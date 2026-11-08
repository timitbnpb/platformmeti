/* Uji asap live: audit tetap sesudah tiap deploy (keputusan pemilik 9 Nov 2026). GET saja, aman untuk produksi.
   Pakai: npm run uji:live [-- --basis https://direktori.metiires.or.id]
   Tanpa sesi: gerbang masuk (D19), rute 302, rute alih, aset publik, /og. Dengan env SESI_UJI (nilai cookie "sesi" akun uji,
   atau "sesi=nilai"): tiap halaman dibuka di Chrome 1440 dan 390. Cookie tidak pernah ditulis ke disk. Laporan: data-panen/uji-asap/<tanggal>.json
   Chrome tidak ada: bagian peramban dilewati dengan pesan. Kode keluar 1 bila ada gagal. */
import {readdirSync, readFileSync, mkdirSync, writeFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {bukaPeramban, cariChrome} from "./_peramban.mjs";

const akar = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const i = process.argv.indexOf("--basis");
const basis = (i > 0 ? process.argv[i + 1] : "https://direktori.metiires.or.id").replace(/\/$/, "");
const hasil = [];
const catat = (kelompok, nama, ok, info = "") => { hasil.push({kelompok, nama, ok, info}); if (!ok) console.log(`GAGAL ${kelompok} ${nama} ${info}`); };
const ambil = (p, opsi = {}) => fetch(basis + p, {redirect: "manual", ...opsi});

const PUBLIK_HALAMAN = new Set(["masuk", "aktivasi", "ganti-sandi", "langganan", "daftar", "404"]);
const halaman = readdirSync(path.join(akar, "public")).filter(f => f.endsWith(".html")).map(f => f.slice(0, -5))
  .filter(n => !PUBLIK_HALAMAN.has(n)).map(n => n === "index" ? "/" : "/" + n);
const rincian = ["/o/x", "/p/x", "/wilayah/11", "/program/psn", "/sistem/x", "/kawasan/x", "/teknologi/surya", "/topik?id=surya", "/pelacak?tek=bayu"];
/* satu teknologi, satu rumah (src/alih_tek.js): tautan lama dialihkan 301 ke modul */
const ALIH_TEK = {"/teknologi/surya": "/surya?tab=ringkasan", "/teknologi/bayu": "/angin?tab=ringkasan", "/topik?id=hidro": "/hidro?tab=dasar", "/pelacak?tek=plta": "/hidro"};
const ALIH = {"/kelayakan": "/peluang#hitung", "/event": "/kalender#daftar", "/video": "/galeri#video", "/podcast": "/galeri#sosmed", "/tender": "/proyek#tender", "/psn": "/program#psn", "/hukum": "/regulasi#hukum", "/pelacak-proyek": "/proyek#terpadu", "/proyek-besar": "/proyek#besar", "/proyek-berhenti": "/proyek#henti", "/energi-baru": "/transisi-pltu?tab=enb", "/transisi": "/target#transisi", "/strategi": "/target#strategi", "/rapor": "/target#rapor", "/ringkasan": "/insight#ringkasan", "/rantai": "/rantai-global?tab=tkdn", "/akademi": "/panduan#akademi", "/istilah": "/panduan#istilah"};

/* (b) tamu: semua rute halaman 302 ke /masuk */
async function tamu() {
  for (const p of [...halaman, ...rincian]) {
    const r = await ambil(p), ke = r.headers.get("location") || "";
    catat("tamu-302", p, r.status === 302 && ke.startsWith("/masuk"), `${r.status} ${ke}`);
  }
  for (const [p, tujuan] of Object.entries({...ALIH, ...ALIH_TEK})) {
    const r = await ambil(p), ke = r.headers.get("location") || "";
    /* tamu: gerbang masuk menang atas alih (302 /masuk); alih sejati (301) hanya terlihat setelah masuk */
    catat("alih", p, r.status === 302 && ke.startsWith("/masuk"), `tamu ${r.status} ${ke} (alih ${tujuan} diuji bersesi)`);
  }
  const inti = readdirSync(path.join(akar, "public/inti")).filter(f => /\.(js|css)$/.test(f));
  const aset = ["/tema.js", "/i18n.js", "/i18n/id.json", "/i18n/en.json", "/masuk.js", ...inti.slice(0, 5).map(f => "/inti/" + f)];
  for (const p of aset) { const r = await ambil(p); catat("aset", p, r.status === 200, String(r.status)); }
  const r = await ambil("/og/beranda/utama.png");
  catat("og", "/og/beranda/utama.png", r.status === 200 && /image\/png/.test(r.headers.get("content-type") || ""), `${r.status} ${r.headers.get("content-type")}`);
  /* jalur masuk menulis D1: akun fiktif harus 401, bukan 500 (9 Nov 2026 kuota tulis D1 habis dan login semua orang gagal, halaman tetap 200) */
  const m = await ambil("/api/masuk", {method: "POST", headers: {"x-pb": "1", origin: basis, "content-type": "application/json"}, body: JSON.stringify({surel: "uji.asap@example.org", sandi: "bukan-sandi-sungguhan"})});
  catat("masuk", "/api/masuk", m.status === 401, String(m.status));
}

/* (a) halaman publik termuat di Chrome tanpa galat konsol; dengan sesi: semua halaman, 1440 dan 390 */
async function peramban(sesi) {
  const bin = cariChrome();
  if (!bin) { console.log("LEWATI peramban: Chrome tidak ditemukan (set CHROME_BIN)"); return; }
  const pb = await bukaPeramban(bin);
  try {
    const t = await pb.tab();
    if (sesi) await t.cookie(basis + "/", "sesi", sesi);
    const daftar = sesi ? [...halaman, ...rincian.filter(p => !/\/x$/.test(p))] : ["/masuk", "/aktivasi", "/daftar"];
    for (const lebar of sesi ? [1440, 390] : [1440]) {
      await t.ukuran(lebar, 900);
      for (const p of daftar) {
        const nama = `${p} @${lebar}`, t0 = Date.now();
        try {
          const st = await t.eval(`fetch(${JSON.stringify(basis + p)},{credentials:"include"}).then(r=>r.status)`).catch(() => 0);
          await t.buka(basis + p);
          const ms = Date.now() - t0, galat = t.galat();
          const sumber = await t.eval(`performance.getEntriesByType("resource").filter(e=>e.responseStatus>=400).map(e=>e.responseStatus+" "+e.name)`);
          const h1 = await t.eval(`!!document.querySelector("h1")`), lb = await t.lebihLebar();
          const url = await t.eval("location.pathname");
          const masalah = [...galat, ...sumber.map(s => "sumber " + s)];
          if (!sesi && st !== 200) masalah.push("status " + st);
          if (sesi && /^\/masuk/.test(url) && !p.startsWith("/masuk")) masalah.push("terlempar ke /masuk (sesi tidak sah?)");
          if (!h1) masalah.push("h1 tidak ada");
          if (lebar === 390 && lb.sw > lb.iw + 1) masalah.push(`gulir samping ${lb.sw}>${lb.iw}`);
          catat("peramban", nama, masalah.length === 0, `${ms} ms ${masalah.join(" | ").slice(0, 300)}`);
        } catch (e) { catat("peramban", nama, false, e.message.slice(0, 200)); }
      }
    }
    await t.tutup();
  } finally { await pb.tutup(); }
}

const sesi = (process.env.SESI_UJI || "").replace(/^sesi=/, "") || null;
console.log(`Uji asap live: ${basis} (${sesi ? "dengan sesi" : "tanpa sesi"})`);
await tamu();
await peramban(sesi);
const tgl = new Date().toISOString().slice(0, 10), ringkas = {};
for (const h of hasil) { const k = ringkas[h.kelompok] ??= {lulus: 0, gagal: 0}; h.ok ? k.lulus++ : k.gagal++; }
mkdirSync(path.join(akar, "data-panen/uji-asap"), {recursive: true});
writeFileSync(path.join(akar, `data-panen/uji-asap/${tgl}.json`), JSON.stringify({basis, tanggal: new Date().toISOString(), sesi: !!sesi, ringkas, hasil}, null, 1));
console.table(ringkas);
const gagal = hasil.filter(h => !h.ok).length;
console.log(gagal ? `GAGAL: ${gagal} dari ${hasil.length}` : `LULUS: ${hasil.length} pemeriksaan`);
process.exit(gagal ? 1 : 0);
