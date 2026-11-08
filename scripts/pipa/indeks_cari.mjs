/* Indeks cari gabungan (G2): membangun public/data/cari/<jenis>.json dari data yang sudah ada, satu berkas per jenis agar dimuat malas.
   Butir ringkas: j judul, s sub, u tautan, x teks cari tambahan (alias, singkatan, nomor), b tingkat bukti, e=1 tautan luar,
   l=1 logo organisasi, p kode lambang provinsi, t teknologi, st status, k kunci i18n (halaman). Normalisasi + peringkat ada di public/inti/cari_rumus.js.
   Pakai: node scripts/pipa/indeks_cari.mjs   (hukum: public/data/hukum/katalog.json dipakai bila ada) */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const PUB = join(fileURLToPath(new URL("../..", import.meta.url)), "public");
const baca = (n) => { const p = join(PUB, "data", n + ".json"); return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null; };
const baris = (d) => (Array.isArray(d) ? d : d?.baris || []);
const httpAman = (u) => /^https?:\/\//i.test(u || "");
const bersih = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== "" && v != null && v !== false));
const b = (j, s, u, x, o = {}) => bersih({ j: String(j ?? "").trim(), s, u, x: Array.isArray(x) ? x.filter(Boolean).join(" ") : x, ...o });
const tanggalPendek = (t) => String(t || "").slice(0, 10);

// halaman situs: judul dari kamus (kunci disimpan, klien memakai t(k) agar mengikuti bahasa)
const HALAMAN = [["/", "nav.beranda"], ["/insight", "nav.insight_ringkasan"], ["/rantai", "nav.rantai"], ["/rantai-global", "rg3.nav"], ["/asean", "nav.asean"], ["/jejaring", "nav.jejaring"], ["/metode", "nav.sub.metode"],
  ["/proyek", "nav.proyek"], ["/wilayah", "nav.wilayah"], ["/regulasi", "nav.regulasi"], ["/berita", "nav.berita"], ["/kalender", "nav.kalender"], ["/tentang", "nav.tentang"],
  ["/pustaka", "nav.pustaka"], ["/program", "nav.program"], ["/topik", "nav.topik"], ["/peluang", "nav.peluang"], ["/indeks", "nav.indeks"], ["/strategi", "nav.strategi"],
  ["/direktori", "nav.direktori"], ["/transisi", "nav.transisi"], ["/pelacak", "nav.pelacak"], ["/kuadran", "nav.kuadran"], ["/rapor", "nav.rapor"], ["/kerja", "nav.kerja"],
  ["/radar", "nav.radar"], ["/biaya-listrik", "nav.biaya_listrik"], ["/keuangan-hijau", "nav.keuangan_hijau"], ["/pasar-listrik-hijau", "nav.pasar_hijau"], ["/dokumen-data", "nav.dokumen_data"],
  ["/kelayakan", "nav.kelayakan"], ["/cari", "cari.judul"]];

// halaman yang bukan tujuan pencarian: akun, detail berparameter, kerangka
const TANPA_CARI = /^(index|404|masuk|aktivasi|ganti-sandi|daftar|admin|langganan|kta|kta_v|portal|profil-saya|diikuti|event_detail|video_detail|siaran-pers-rinci|o|p|cari)$/;

export function bangunIndeks({ data = baca, id = JSON.parse(readFileSync(join(PUB, "i18n/id.json"), "utf8")), dirTopik = join(PUB, "data/topik") } = {}) {
  const out = {};
  const tambah = (g, e) => { if (e.j) (out[g] ||= []).push(e); };

  // organisasi: nama, alias, singkatan, kode saham
  const og = baris(data("organisasi")), orgIds = new Set();
  for (const o of og) { orgIds.add(o.id); tambah("org", b(o.nama, o.kategori?.label, "/o/" + o.id, [o.singkatan, ...(o.nama_lain || []), o.kode_saham], { l: 1 })); }

  // orang publik (tokoh publik berorganisasi, sama seperti palet lama): nama + jabatan
  for (const p of baris(data("orang"))) if (p.kelompok?.kode === "tokoh-publik" && orgIds.has(p.organisasi_id))
    tambah("orang", b([p.gelar, p.nama].filter(Boolean).join(" "), p.jabatan_terkini, "/o/" + p.organisasi_id, [p.jabatan_terkini, p.organisasi_terkini]));

  for (const p of baris(data("proyek"))) tambah("proyek", b(p.nama, p.lokasi?.provinsi, "/p/" + p.id, [p.teknologi, ...Object.values(p.pihak || {}).flat().map((x) => x?.nilai)], { t: p.teknologi, st: p.status?.[0]?.nilai, b: p.tingkat_bukti }));

  for (const r of baris(data("regulasi"))) tambah("reg", b(r.judul, [String(r.jenis || "").toUpperCase(), r.nomor && r.tahun ? `${r.nomor}/${r.tahun}` : r.tahun].filter(Boolean).join(" "),
    "/regulasi?id=" + encodeURIComponent(r.id), [r.jenis, r.nomor, r.tahun, r.nomor && r.tahun ? `${r.nomor} ${r.tahun}` : "", r.instansi_penerbit], { b: "resmi" }));

  // pasal hukum: katalog yang dibangun agent hukum; bentuk dibaca longgar (item punya judul/nomor, opsional pasal[] dengan nomor + isi/judul)
  const hk = data("hukum/katalog");
  for (const it of baris(hk?.baris ? hk : hk?.regulasi || hk?.katalog || hk)) {
    const nama = it.judul || it.nama, idr = it.id || it.regulasi_id; if (!nama || !idr) continue;
    tambah("hukum", b(nama, [it.nomor && it.tahun ? `${it.nomor}/${it.tahun}` : "", it.jenis].filter(Boolean).join(" "), "/hukum?id=" + encodeURIComponent(idr), [it.nomor, it.tahun], { b: "resmi" }));
    for (const ps of it.pasal || []) { const no = ps.nomor ?? ps.no; if (no == null) continue; tambah("hukum", b(`${nama}, Pasal ${no}`, ps.judul || String(ps.isi || "").slice(0, 90), `/hukum?id=${encodeURIComponent(idr)}#pasal-${encodeURIComponent(no)}`, [`pasal ${no}`, ps.isi ? String(ps.isi).slice(0, 400) : ""], { b: "resmi" })); }
  }

  // topik: judul topik + judul bab + FAQ + glosarium (16 naskah); judul bab dari topik/ui.json
  const ui = JSON.parse(readFileSync(join(dirTopik, "ui.json"), "utf8"));
  const nmTopik = (k) => ui.topik?.[k]?.nama?.id || k;
  for (const f of readdirSync(dirTopik)) {
    if (/^(dasar-|indeks|ui\.|luar_)/.test(f) || !f.endsWith(".json")) continue;
    const tp = JSON.parse(readFileSync(join(dirTopik, f), "utf8")), tid = tp.id || f.replace(/\.json$/, "").replace(/_/g, "-");
    if (!tp.bab) continue;
    const url = (bab) => `/topik?id=${encodeURIComponent(tid)}${bab ? "#bab-" + bab : ""}`, nm = tp.judul?.id || nmTopik(tid);
    tambah("topik", b(nm, "Topik mendalam", url(), [tp.lead?.id], { b: "kajian" }));
    for (const [no, bb] of Object.entries(tp.bab)) {
      const jb = ui.bab?.[no]?.j?.id;
      if (jb) tambah("topik", b(jb, nm, url(no), [bb.tipe], { b: "kajian" }));
      for (const q of bb.butir || []) {
        if (bb.tipe === "faq" && q.t?.id) tambah("topik", b(q.t.id, `${nm}, FAQ`, url(no), [q.j?.id], { b: "kajian" }));
        else if (bb.tipe === "glosarium" && q.istilah?.id) tambah("topik", b(q.istilah.id, `${nm}, glosarium`, url(no), [q.arti?.id], { b: "kajian" }));
      }
    }
  }

  for (const r of baris(data("berita"))) if (httpAman(r.url)) tambah("berita", b(r.judul, [r.media, tanggalPendek(r.terbit)].filter(Boolean).join(", "), r.url, r.media, { e: 1, b: "media" }));

  for (const p of baris(data("pakar_riset"))) tambah("pakar", b(p.nama, [p.kampus, p.kota].filter(Boolean).join(", "), "/direktori?tampil=riset&sub=pakar-riset", [p.kampus, ...(p.sektor || [])], { b: p.tingkat_bukti || "via-pihak-ketiga" }));

  for (const i of data("inovasi")?.inovasi || []) tambah("inovasi", b(i.nama, [i.jenis, i.status].filter(Boolean).join(", "), "/direktori?tampil=inovasi", [...(i.sektor || []), ...(i.pembuat || []).map((x) => x?.nama), String(i.ringkasan || "").slice(0, 160)]));

  for (const d of data("pendanaan")?.pendanaan || []) tambah("pendanaan", b(d.nama, [d.pemberi, d.jenis].filter(Boolean).join(", "), "/direktori?tampil=pendanaan", [d.pemberi, ...(d.sektor || []), ...(d.sasaran || [])], { b: d.tingkat_bukti }));

  for (const g of baris(data("program_analisis"))) tambah("program", b(g.nama?.id, g.tahap_ket?.id ? String(g.tahap_ket.id).slice(0, 90) : "", "/program/" + encodeURIComponent(g.kode), ["program nasional", g.nama?.en]));

  for (const k of baris(data("pustaka"))) tambah("pustaka", b(k.judul, [k.penerbit, k.tanggal].filter(Boolean).join(", "), "/pustaka?id=" + encodeURIComponent(k.id), [k.jenis, ...(k.kepakaran || [])]));

  for (const w of baris(data("wilayah"))) tambah("wilayah", b(w.nama, w.identitas?.ibu_kota, "/wilayah/" + w.kode, ["provinsi", w.identitas?.ibu_kota], { p: w.kode }));

  // entitas modul baru: isu, PSN, PLTU, sistem PLN, kawasan, pemasok global (tiap butir menunjuk halaman modulnya)
  for (const r of baris(data("isu"))) tambah("isu", b(r.judul, [r.tema, r.status].filter(Boolean).join(", "), "/isu#" + encodeURIComponent(r.id), [r.tema, r.ringkas?.slice(0, 120)], { b: r.bukti }));
  for (const r of baris(data("psn"))) tambah("psn", b(r.nama, [r.sektor, r.lokasi].filter(Boolean).join(", "), "/psn#" + encodeURIComponent(r.id), [r.sektor, r.lokasi], { b: "resmi" }));
  for (const r of baris(data("pltu"))) tambah("pltu", b(r.nama, [r.mw_operasi ? r.mw_operasi + " MW" : "", r.kab, r.pulau].filter(Boolean).join(", "), `/peta?l=pltu&v=${r.lng},${r.lat},9`, [r.pemilik?.nama, r.prov, "PLTU", "batubara"], { b: "kajian" }));
  for (const r of baris(data("sistem_pln"))) tambah("sistem", b(r.nama?.id || r.singkat, "Sistem kelistrikan PLN", "/sistem", [r.singkat, r.nama?.en, ...(r.provinsi || []).map((x) => x.nama)], { b: "resmi" }));
  for (const r of baris(data("kawasan"))) tambah("kawasan", b(r.nama, [String(r.jenis || "").toUpperCase(), r.provinsi].filter(Boolean).join(", "), "/kawasan#" + encodeURIComponent(r.id), [r.sektor, r.pengelola], { b: r.tingkat_bukti }));
  const seenP = new Set();
  const pasok = (d, tab, f) => { for (const r of baris(d)) { if (!r.nama || seenP.has(r.id)) continue; seenP.add(r.id); const t = f(r); tambah("pemasok", b(r.nama, [t.sub, r.negara_iso2 || r.negara].filter(Boolean).join(", "), orgIds.has(r.organisasi_id || r.id) ? "/o/" + (r.organisasi_id || r.id) : "/rantai-global?tab=" + encodeURIComponent(t.tab), [...(r.nama_lain || []), ...(t.x || [])], { b: "via-pihak-ketiga" })); } };
  pasok(data("global/pemasok_surya"), "surya", (r) => ({ sub: (r.segmen || []).join("/"), tab: "surya", x: r.segmen }));
  pasok(data("global/pemasok_lain"), "lain", (r) => ({ sub: (r.segmen || []).join("/"), tab: (r.segmen || [])[0] || "lain", x: r.produk }));
  pasok(data("global/pemasok_wte"), "wte", (r) => ({ sub: (r.teknologi || []).join("/"), tab: "wte", x: r.komponen }));

  for (const [href, k] of HALAMAN) tambah("halaman", b(id[k] || href, "", href, href.slice(1), { k }));
  // halaman/modul baru: pindai public/*.html, judul dari <title> (tanpa akhiran situs); yang sudah ada di daftar atas dilewati
  const ada = new Set(HALAMAN.map(([h]) => h));
  for (const f of readdirSync(PUB).filter((n) => n.endsWith(".html") && !n.startsWith("_"))) {
    const slug = f.replace(/\.html$/, ""), href = "/" + slug;
    if (ada.has(href) || TANPA_CARI.test(slug)) continue;
    const ttl = readFileSync(join(PUB, f), "utf8").match(/<title[^>]*>([^<]+)<\/title>/)?.[1]?.replace(/\s*\|\s*Direktori METI\s*$/, "").trim();
    if (ttl) tambah("halaman", b(ttl, "", href, slug.replace(/-/g, " ")));
  }

  // istilah nasional (G5): nama, alias, arti
  for (const i of data("istilah")?.istilah || []) tambah("istilah", b(i.nama, i.arti?.id ? String(i.arti.id).slice(0, 90) : "", "/istilah#" + encodeURIComponent(i.id), [i.panjang, ...(i.alias || []), i.arti?.id, i.arti?.en], { b: i.resmi ? "resmi" : "" }));
  return out;
}

const BATAS_BELING = 350_000;   // gerbang uji: tiap berkas < 400 KB
export function tulisIndeks(out, dir = join(PUB, "data/cari")) {
  mkdirSync(dir, { recursive: true });
  const ukuran = {};
  for (const f of readdirSync(dir)) if (/\.\d+\.json$/.test(f)) unlinkSync(join(dir, f));   // beling lama
  for (const [g, a] of Object.entries(out)) {
    const s = JSON.stringify(a);
    if (s.length < BATAS_BELING) { writeFileSync(join(dir, g + ".json"), s); ukuran[g] = [a.length, s.length]; continue; }
    // terlalu besar: pecah jadi beling <g>.1.json ..., <g>.json hanya berisi {"beling":n}; pemuat (cari_indeks.js) menggabungkan
    const bagian = []; let cur = [], by = 2;
    for (const e of a) { const n = JSON.stringify(e).length + 1; if (cur.length && by + n > BATAS_BELING) { bagian.push(cur); cur = []; by = 2; } cur.push(e); by += n; }
    if (cur.length) bagian.push(cur);
    bagian.forEach((c, i) => writeFileSync(join(dir, `${g}.${i + 1}.json`), JSON.stringify(c)));
    writeFileSync(join(dir, g + ".json"), JSON.stringify({ beling: bagian.length }));
    ukuran[g] = [a.length, s.length];
  }
  return ukuran;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const u = tulisIndeks(bangunIndeks());
  for (const [g, [n, by]] of Object.entries(u)) console.log(g.padEnd(10), String(n).padStart(6), "butir", (by / 1024).toFixed(1).padStart(8), "KB");
}
