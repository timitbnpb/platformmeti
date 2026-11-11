// Pembantu S08: ekstraktor rute /api/ (impor tabel `rute` tiap modul src + dua rute milik worker.js) dan pemanggil per peran.
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import worker from "../src/worker.js";
import * as hak from "../src/hak.js";
import { sha } from "../src/util.js";

const AKAR = join(dirname(fileURLToPath(import.meta.url)), "..");
export const PERAN_UJI = ["anggota", "pengurus", "kurator", "wilayah", "admin", "super"];

// -> { rute: Map("METODE /api/jalur" -> "src/berkas.js"), modul: jumlah modul ber-`rute` }. Bukan daftar tangan.
export async function ekstrakRute() {
  const rute = new Map();
  let modul = 0;
  for (const f of readdirSync(join(AKAR, "src")).filter((x) => x.endsWith(".js")).sort()) {
    const m = await import("../src/" + f);
    if (m.rute && typeof m.rute === "object") {
      modul++;
      for (const k of Object.keys(m.rute)) if (/^[A-Z]+ \/api\//.test(k)) rute.set(k, "src/" + f);
    }
  }
  // Tabel milik worker.js sendiri (rutePemilik) tidak diekspor: urai kunci literalnya.
  const w = readFileSync(join(AKAR, "src/worker.js"), "utf8");
  const awal = w.indexOf("const rutePemilik"), akhir = w.indexOf("const DAFTAR");
  for (const x of w.slice(awal, akhir).matchAll(/^\s*"([A-Z]+ \/api\/[^"]+)"\s*:/gm)) rute.set(x[1], "src/worker.js");
  return { rute: new Map([...rute].sort(([a], [b]) => (a < b ? -1 : 1))), modul };
}

export const isiJalur = (j) => j.replace(/:[a-z_]+/g, "1");

// Satu akun + sesi per peran di D1 lokal. Sesi dibuat ulang lewat segarkan() karena rute keluar/ganti-sandi mematikannya.
export async function siapkanPeran(env) {
  const ID = {};
  for (const peran of PERAN_UJI) {
    const r = await env.DB.prepare("INSERT INTO akun (surel, nama, peran, cakupan_prov, status, garam, sandi, iterasi) VALUES (?,?,?,?, 'aktif', ?, ?, 100000)")
      .bind(`rute-${peran}@example.org`, `Orang ${peran}`, peran, peran === "wilayah" ? "31" : null, "a".repeat(32), "a".repeat(64)).run();
    ID[peran] = r.meta.last_row_id;
  }
  let n = 0;
  async function segarkan(peran) {
    const token = (++n).toString(16).padStart(64, "0");
    await hak.catatSesi(env, { idHash: await sha(token), akunId: ID[peran], peran, sampai: Math.floor(Date.now() / 1000) + 3600, ipHash: "h" });
    return `sesi=${token}`;
  }
  return { segarkan };
}

let ipN = 0;
// Memanggil worker.fetch utuh. peran null = tanpa sesi. badan {} untuk metode tulis agar lolos penjaga CSRF dan sampai ke handler.
export async function panggil(env, P, rute, { peran = null, metode, csrf = true, origin = "https://uji.test" } = {}) {
  const [m0, j] = rute.split(" ");
  const m = metode || m0;
  const h = { "cf-connecting-ip": `198.51.100.${(++ipN % 250) + 1}` };
  if (origin) h.origin = origin;
  if (csrf && m !== "GET" && m !== "HEAD") h["x-pb"] = "1";
  if (peran) h.cookie = await P.segarkan(peran);
  let body;
  if (m !== "GET" && m !== "HEAD") { body = "{}"; h["content-type"] = "application/json"; }
  const res = await worker.fetch(new Request("https://uji.test" + isiJalur(j), { method: m, headers: h, body }), env, { waitUntil() {} });
  return res.status;
}

export const TULIS = new Set(["POST", "PATCH", "PUT", "DELETE"]);
// Dikecualikan dari penjaga CSRF x-pb oleh worker.js (sendBeacon statistik dan webhook Midtrans).
export const TANPA_CSRF = new Set(["POST /api/statistik", "POST /api/daftar/midtrans/notifikasi"]);
const cocokPola = (pola, jalur) => {
  const a = pola.split("/"), b = jalur.split("/");
  return a.length === b.length && a.every((x, i) => x[0] === ":" || x === b[i]);
};
// Metode yang tidak terdaftar untuk jalur ini di tabel mana pun (jalur terisi bisa cocok pola lain). null bila semua terpakai.
export function metodeSalah(rute, semua) {
  const jalur = isiJalur(rute.split(" ")[1]);
  for (const m of ["DELETE", "PATCH", "PUT", "POST"]) {
    if (![...semua].some((k) => k.startsWith(m + " ") && cocokPola(k.split(" ")[1], jalur))) return m;
  }
  return null;
}

// Selidiki peran: benar = peran yang LOLOS penjaga (bukan 401/403/405), salah = tamu + peran yang ditolak 403.
export async function selidikiPeran(env, P, rute) {
  const benar = [], salah = [];
  if ((await panggil(env, P, rute)) === 401) salah.push("tamu"); else benar.push("tamu");
  for (const p of PERAN_UJI) ([403, 401, 405].includes(await panggil(env, P, rute, { peran: p })) ? salah : benar).push(p);
  return { benar, salah };
}
