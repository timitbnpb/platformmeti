/* Embedding + unggah potongan "Tanya data" ke Vectorize "meti-tanya" (1024 dimensi, cosine; model @cf/baai/bge-m3).
   Masukan: data/tanya/potongan.jsonl (scripts/pipa/tanya_indeks.mjs). Keluaran: data/tanya/vektor.ndjson (dapat dilanjutkan).
   --kering  : hitung dan tampilkan rencana, TANPA jaringan dan tanpa menulis apa pun.
   --unggah  : setelah embedding, jalankan `npx wrangler vectorize insert meti-tanya --file=data/tanya/vektor.ndjson`.
   Env (tidak pernah di repo): CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN (izin Workers AI). Metadata tiap vektor = potongan itu sendiri (teks, url, sumber, tanggal). */
import { readFileSync, writeFileSync, appendFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const AKAR = join(fileURLToPath(new URL("../..", import.meta.url)));
const MASUK = join(AKAR, "data/tanya/potongan.jsonl"), KELUAR = join(AKAR, "data/tanya/vektor.ndjson");
export const MODEL_EMBED = "@cf/baai/bge-m3", GELOMBANG = 50;
const arg = (n) => process.argv.includes(n);

export const bacaPotongan = (f = MASUK) => readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
// Metadata Vectorize maks 10 KiB per vektor; potongan <= 650 huruf + judul/url jauh di bawahnya.
export const metadata = (p) => ({ jenis: p.jenis, judul: p.judul, teks: p.teks, url: p.url, sumber: p.sumber, tanggal: p.tanggal });

async function embed(teks) {
  const { CLOUDFLARE_ACCOUNT_ID: a, CLOUDFLARE_API_TOKEN: k } = process.env;
  if (!a || !k) throw new Error("CLOUDFLARE_ACCOUNT_ID dan CLOUDFLARE_API_TOKEN wajib (atau pakai --kering)");
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${a}/ai/run/${MODEL_EMBED}`, { method: "POST", headers: { authorization: "Bearer " + k, "content-type": "application/json" }, body: JSON.stringify({ text: teks }) });
  const d = await r.json();
  if (!r.ok || !d.success) throw new Error("embedding gagal: " + r.status);
  return d.result.data;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const semua = bacaPotongan();
  const sudah = new Set(existsSync(KELUAR) ? readFileSync(KELUAR, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l).id) : []);
  const sisa = semua.filter((p) => !sudah.has(p.id));
  console.log(`potongan ${semua.length}, sudah ber-vektor ${sudah.size}, perlu embedding ${sisa.length} (${Math.ceil(sisa.length / GELOMBANG)} panggilan), model ${MODEL_EMBED}`);
  if (arg("--kering")) { console.log("kering: tidak ada jaringan, tidak ada tulis."); process.exit(0); }
  if (!existsSync(KELUAR)) writeFileSync(KELUAR, "");
  for (let i = 0; i < sisa.length; i += GELOMBANG) {
    const g = sisa.slice(i, i + GELOMBANG), v = await embed(g.map((p) => p.teks));
    appendFileSync(KELUAR, g.map((p, j) => JSON.stringify({ id: p.id, values: v[j], metadata: metadata(p) })).join("\n") + "\n");
    process.stdout.write(`\r${Math.min(i + GELOMBANG, sisa.length)}/${sisa.length}`);
  }
  console.log("\nvektor.ndjson siap.");
  if (arg("--unggah")) process.exit(spawnSync("npx", ["wrangler", "vectorize", "insert", "meti-tanya", "--file=" + KELUAR], { stdio: "inherit" }).status ?? 1);
}
