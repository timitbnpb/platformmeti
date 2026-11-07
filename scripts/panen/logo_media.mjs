/* Unduh logo media (apple-touch-icon / favicon besar) dari situs media itu sendiri -> public/img/media/<domain>.png 64px.
   Robots dipatuhi, jeda 2 detik, UA peneliti. Catatan sumber -> public/img/logo/SUMBER.md. Pakai: node scripts/panen/logo_media.mjs [--maks=N] */
import { readFile, writeFile, mkdir, appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import sharp from "sharp";
import { domainMedia } from "../../public/inti/nama_media.js";
const UA = "METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)";
const maks = Number((process.argv.find((a) => a.startsWith("--maks=")) || "").slice(7)) || 1e9;
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const ambil = async (u, buf) => { const r = await fetch(u, { headers: { "user-agent": UA }, redirect: "follow", signal: AbortSignal.timeout(15000) }); if (!r.ok) throw new Error(r.status); return buf ? Buffer.from(await r.arrayBuffer()) : r.text(); };
async function bolehRobots(dom, jalur) {
  try {
    const t = await ambil(`https://${dom}/robots.txt`); let ua = false, ok = true;
    for (const b of t.split(/\r?\n/)) { const m = /^\s*(user-agent|disallow)\s*:\s*(.*)$/i.exec(b.split("#")[0]); if (!m) continue;
      if (m[1].toLowerCase() === "user-agent") ua = m[2].trim() === "*"; else if (ua && m[2].trim() && jalur.startsWith(m[2].trim())) ok = false; }
    return ok;
  } catch { return true; }
}
const dom = new Set();
for (const f of ["berita", "siaran_pers"]) { try { for (const r of JSON.parse(await readFile(`public/data/${f}.json`, "utf8")).baris) { const d = domainMedia(r.url); if (d) dom.add(d); } } catch { /* berkas belum ada */ } }
await mkdir("public/img/media", { recursive: true });
let n = 0;
for (const d of [...dom].sort()) {
  const out = `public/img/media/${d}.png`; if (existsSync(out)) continue; if (n++ >= maks) break;
  try {
    const base = `https://www.${d}/`; let html = ""; try { html = await ambil(base); } catch { html = await ambil(`https://${d}/`); }
    const cand = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).filter((l) => /rel=["'][^"']*icon/i.test(l)).map((l) => ({ href: /href=["']([^"']+)/i.exec(l)?.[1], apple: /apple-touch/i.test(l), sz: Number(/sizes=["'](\d+)/i.exec(l)?.[1] || 0) })).filter((c) => c.href)
      .sort((a, b) => (b.apple - a.apple) || (b.sz - a.sz)).map((c) => new URL(c.href, base).href);
    cand.push(`https://www.${d}/apple-touch-icon.png`, `https://www.${d}/favicon.ico`);
    let ok = null;
    for (const u of cand) { await tidur(2000); if (!(await bolehRobots(new URL(u).host, new URL(u).pathname))) continue;
      try { const b = await ambil(u, true); await sharp(b).resize(64, 64, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toFile(out); ok = u; break; } catch { /* kandidat berikut */ } }
    if (ok) await appendFile("public/img/logo/SUMBER.md", `- media/${d}.png: ${ok} (diambil ${new Date().toISOString().slice(0, 10)})\n`);
    else console.log("tanpa logo:", d);
  } catch (e) { console.log("gagal:", d, e.message); }
  await tidur(2000);
}
