/* /topik?id=karbon: bab khusus Karbon yang dihitung dari dasar-karbon.json (bursa, pembangkit, registri, sistem PLN) dan luar_karbon.json (benchmark OWID/RFF).
   Semua angka berasal dari berkas data; turunan hitung sendiri berlabel EST. Teks antarmuka di data/topik/ui.json, naskah di data/topik/karbon.json. */
import { S, L, u, num, tok, aman, tautan, est, esc, ikon, tanggal, bulan, pilu, daftarTabel, subjudul, teksHtml, garisTip } from "/topik_umum.js";
import { kolom, batang } from "/grafik.js";
import { negaraSel, isoNegara } from "/topik_wujud.js";
import { khUbinHtml } from "/inti/kh.js";
import * as B from "/topik_bab.js";

const HARI_INI = new Date().toISOString().slice(0, 10);
const median = (a) => { const s = a.filter(Number.isFinite).sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; };
const ringkasBln = (p) => tanggal(p + "-01").split(" ").slice(1).join(" ");

export function siap(ctx) {
  const d = ctx.dasar.karbon, lu = ctx.luar;
  const byKode = Object.fromEntries(lu.negara.map((n) => [n.kode, n]));
  const idn = byKode.IDN, b = d.bursa.at(-1), hargas = d.bursa.map((x) => x.harga).filter(Number.isFinite);
  const terbit = d.kredit.per_registri.reduce((s, r) => s + r.terbit, 0), pensiun = d.kredit.per_registri.reduce((s, r) => s + r.pensiun, 0);
  const bara = d.pembangkit.per_jenis.find((j) => j.jenis === "batubara");
  const jb = d.sistem.find((s) => s.id === "jawa-bali"), iJb = jb.tahun.indexOf(2025), grid = jb.intensitas[iJb];
  const ndc = d.target.find((t) => t.id === "ndc-2030");
  const hmin = Math.min(...hargas), hmaks = Math.max(...hargas);
  const nol = lu.negara.filter((n) => n.kode !== "IDN" && n.cakupan && n.cakupan.semua === 0).length;
  Object.assign(ctx, { d, lu, byKode, idn, b, hmin, hmaks, grid, iJb, terbit, pensiun });
  /* sumber benchmark ikut daftar sumber halaman */
  for (const [k, m] of Object.entries(lu.sumber)) S.sumber["ow_" + k] = { judul: `${m.judul} (${m.kutipan})`, penerbit: "Our World in Data", url: m.url, tanggal: lu.tanggal_ambil, tahun: (m.diperbarui || "").slice(0, 4) * 1 || null, bukti: "via-pihak-ketiga", lisensi: "CC BY 4.0" };
  S.sumber.owg = S.sumber.ow_cakupan;
  S.sumber.jetp = { judul: d.jetp.sumber[0].judul, penerbit: d.jetp.sumber[0].penerbit, url: d.jetp.sumber[0].url, tanggal: d.jetp.tanggal_cipp, bukti: "resmi" };
  for (const t of d.target_sumber) if (["ken-pp-40-2025", "rukn-2025"].includes(t.id)) S.sumber["t_" + t.id] = { judul: t.judul, penerbit: "Pemerintah RI", url: t.url, tahun: t.tahun, tanggal: d.tanggal, bukti: "resmi" };
  const N = {
    cakupan: num(idn.cakupan.semua, 1), tahun_luar: idn.cakupan.tahun, ets_usd: num(idn.harga_ets[1], 2), bursa_vol: num(b.volume_ytd), bursa_bln: bulan(b.periode), bursa_harga: num(b.harga), bursa_n: num(d.bursa.length),
    harga_min: num(hmin), harga_maks: num(hmaks), kredit_terbit: num(terbit), kredit_pensiun: num(pensiun), emisi_juta: num(d.pembangkit.total_juta), bara_persen: num((bara.emisi_juta / d.pembangkit.total_juta) * 100),
    ndc_min: num(ndc.min, 2), ndc_maks: num(ndc.maks, 2), grid_jb: num(grid, 2), contoh_t: num(grid * 1000), contoh_rp_min: num((grid * 1000 * hmin) / 1e6, 1), contoh_rp_maks: num((grid * 1000 * hmaks) / 1e6, 1),
    de_ets: num(byKode.DEU.harga_ets[1], 1), za_pajak: num(byKode.ZAF.harga_pajak[1], 1), nol_n: num(nol),
  };
  S.N = N;
}

/* ---------- angka kunci (bab 1) ---------- */
export function kunci(ctx) {
  const { d, idn, b, terbit } = ctx;
  const k = {
    cakupan: { v: num(idn.cakupan.semua, 1), s: "%", src: ["ow_cakupan"], sub: u("kref.cakupan_sub", { tahun: idn.cakupan.tahun }) },
    ets_usd: { v: num(idn.harga_ets[1], 2), s: "US$", src: ["ow_ets"], sub: u("kref.ets_sub", { tahun: idn.harga_ets[0] }) },
    bursa_vol: { v: num(b.volume_ytd), s: "tCO2e", src: ["idx"], sub: u("kref.bursa_sub", { bln: bulan(b.periode) }) },
    kredit_terbit: { v: num(terbit), s: "tCO2e", src: ["kp"], sub: u("kref.kredit_sub", { n: num(d.kredit.daftar.length) }) },
    emisi_juta: { v: num(d.pembangkit.total_juta), s: u("kref.juta"), src: ["ct"], sub: u("kref.emisi_sub", { n: num(d.pembangkit.jumlah), tahun: d.pembangkit.tahun }) },
  };
  return ctx.naskah.kunci.map((x) => ({ ikon: { cakupan: "grafik", ets_usd: "kartu", bursa_vol: "tahun", kredit_terbit: "centang", emisi_juta: "peringatan" }[x.ref], label: u("kref." + x.ref), nilai: k[x.ref].v, satuan: k[x.ref].s, sub: k[x.ref].sub, src: k[x.ref].src, est: x.ref === "kredit_terbit" ? false : false }));
}

/* ---------- kasus: isi dari data (tak ada angka yang diketik tangan) ---------- */
const STATUS_AKTIF = new Set(["terdaftar", "tersertifikasi"]);
export function selesaikan(ctx) {
  const { d, byKode } = ctx;
  return (x) => {
    if (x._ok) return x;
    let o = { ...x, _ok: true };
    if (x.dari?.jenis === "kredit") {
      const p = d.kredit.daftar.find((q) => q.id === x.dari.id);
      if (!p) return o;
      const rasio = p.terbit > 0 ? p.pensiun / p.terbit : null;
      o = { ...o, nama: p.nama.replace(/^\*/, ""), negara: "ID", ikon: "tek-listrik", lokasi: p.provinsi ? p.provinsi : { id: "Indonesia", en: "Indonesia" }, dibaca: true,
        profil: [
          { label: L({ id: "Registri", en: "Registry" }), nilai: `${p.registri} ${p.registri_id || p.id}` }, { label: L({ id: "Pengembang", en: "Developer" }), nilai: p.pengembang || "-" }, { label: L({ id: "Teknologi", en: "Technology" }), nilai: p.teknologi },
          { label: L({ id: "Status registri", en: "Registry status" }), nilai: u("status." + p.status) }, { label: L({ id: "Periode kredit", en: "Crediting period" }), nilai: [p.mulai, p.akhir].map((t) => (t ? tanggal(t) : "-")).join(" - ") }, ...(p.metodologi ? [{ label: L({ id: "Metodologi", en: "Methodology" }), nilai: p.metodologi }] : [])],
        angka: [
          { label: L({ id: "Kredit diterbitkan", en: "Credits issued" }), nilai: p.terbit, satuan: "tCO2e" }, { label: L({ id: "Kredit dipensiunkan", en: "Credits retired" }), nilai: p.pensiun, satuan: "tCO2e" },
          ...(rasio != null ? [{ label: L({ id: "Bagian dipensiunkan", en: "Share retired" }), nilai: rasio * 100, d: 1, satuan: "%", est: true }] : []), ...(p.taksiran ? [{ label: L({ id: "Taksiran per tahun", en: "Estimated per year" }), nilai: p.taksiran, satuan: "tCO2e" }] : [])],
        faktor: { kredit_terbit: p.terbit > 0, kredit_dipakai: p.terbit > 0 ? rasio >= 0.5 : false, status_aktif: STATUS_AKTIF.has(p.status), metodologi_baku: p.metodologi ? /ACM0002|AMS-I/.test(p.metodologi) : undefined, periode_berjalan: p.akhir ? p.akhir >= HARI_INI : undefined },
        sumber: ["kp"], sumber_tambahan: [{ sumber: `${p.registri} ${p.registri_id || p.id}`, url: p.url, tanggal: d.kredit.tanggal }] };
    } else if (x.dari?.jenis === "negara") {
      const n = byKode[x.dari.kode];
      if (!n) return o;
      const harga = Math.max(n.harga_ets?.[1] || 0, n.harga_pajak?.[1] || 0);
      o = { ...o, nama: L(n.nama), negara: n.kode, ikon: "asean", dibaca: true, faktorGrup: "negara",
        profil: [{ label: L({ id: "Pajak karbon", en: "Carbon tax" }), nilai: u("instr." + (n.pajak_status?.nilai === "Has a carbon tax" ? "ada" : "tidak")) + (n.pajak_sejak ? ` (${u("k.tahun_mulai")} ${n.pajak_sejak})` : "") }, { label: L({ id: "ETS", en: "ETS" }), nilai: u("instr." + (n.ets_status?.nilai === "Has an ETS" ? "ada" : /sub-national/.test(n.ets_status?.nilai || "") ? "sub" : "tidak")) }, { label: L({ id: "CO2 per kapita", en: "CO2 per capita" }), nilai: n.per_kapita ? `${num(n.per_kapita[1], 1)} t` : "-" }],
        angka: [{ label: L({ id: "Cakupan emisi CO2", en: "CO2 emissions coverage" }), nilai: n.cakupan.semua, d: 1, satuan: "%" }, { label: L({ id: "Harga rata-rata tertimbang", en: "Weighted average price" }), nilai: harga, d: 1, satuan: "US$/tCO2e" }, { label: L({ id: "Intensitas emisi listrik", en: "Electricity emission intensity" }), nilai: n.intensitas_listrik?.[1], satuan: "gCO2/kWh" }],
        faktor: { cakupan_luas: n.cakupan.semua >= 50, harga_bermakna: harga > 1, nasional: n.ets_status?.nilai !== "Has an ETS only at a sub-national level" },
        sumber: ["ow_cakupan", "ow_ets", "ow_pajak"] };
    }
    return o;
  };
}

/* ---------- bab khusus; tiap fungsi mengembalikan {html, csv, sumber, sub} atau null ---------- */
const K = {};
const kartuAngka = (items) => khUbinHtml(items).replace("jm-kh-ubin", "jm-kh-ubin jm-tp-ubin");

K[7] = ({ d }) => {
  const bs = d.bursa;
  const harga = kolom(bs.map((x) => ({ label: ringkasBln(x.periode), v: x.harga ?? 0, tip: `${ringkasBln(x.periode)}: Rp${num(x.harga)}` })), { label: u("g.harga") });
  const vol = kolom(bs.map((x) => ({ label: ringkasBln(x.periode), v: x.volume_bulan ?? 0, tip: `${ringkasBln(x.periode)}: ${num(x.volume_bulan)} tCO2e` })), { label: u("g.volume") });
  const jenis = batang(d.pembangkit.per_jenis.map((j, i) => ({ label: u("jenis." + j.jenis), v: j.emisi_juta, teks: num(j.emisi_juta, 1) + " Mt", sorot: i === 0 })), { label: u("g.emisi") });
  const mit = d.mitigasi.baris;
  const mg = kolom(mit.map((x) => ({ label: String(x.tahun), v: x.juta_ton_co2, tip: `${x.tahun}: ${num(x.juta_ton_co2, 2)} Mt CO2` })), { d: 1, label: u("g.mitigasi") });
  const html = subjudul(u("g.harga")) + `<p class="jm-bantu">${esc(u("g.harga_ket"))}${est()}</p>${harga}` + subjudul(u("g.volume")) + vol + subjudul(u("g.emisi")) + `<p class="jm-bantu">${esc(u("g.emisi_ket", { n: num(d.pembangkit.jumlah), tahun: d.pembangkit.tahun }))}</p>${jenis}` + subjudul(u("g.mitigasi")) + `<p class="jm-bantu">${esc(d.mitigasi.satuan)}</p>${mg}`;
  return { html, sumber: ["idx", "ct"], tambah: [{ sumber: d.mitigasi.sumber, url: d.mitigasi.url, tanggal: d.mitigasi.tanggal }] };
};

K[8] = ({ d, iJb }) => {
  const rows = d.sistem.map((s) => { const i = s.tahun.indexOf(2025), j = s.tahun.length - 1; return { id: s.id, nama: s.nama, tabel: s.tabel, emisi: s.emisi[i], int: s.intensitas[i], ebt: s.ebt[i], ebtAkhir: s.ebt[j], bara: s.batubara[i], thn: s.tahun[j] }; });
  const grafik = batang([...rows].sort((a, z) => z.int - a.int).map((r, i) => ({ label: r.nama, v: r.int, teks: num(r.int, 2), sorot: i === 0 })), { label: u("g.intensitas") });
  const t = daftarTabel("sistem", [
    { k: "nama", l: u("k.nama"), f: (r) => esc(r.nama), v: (r) => r.nama },
    { k: "emisi", l: u("k.emisi"), num: true, f: (r) => num(r.emisi), v: (r) => r.emisi },
    { k: "int", l: u("k.intensitas"), num: true, est: true, f: (r) => num(r.int, 2), v: (r) => r.int },
    { k: "ebt", l: u("k.ebt25"), num: true, f: (r) => num(r.ebt), v: (r) => r.ebt },
    { k: "ebtAkhir", l: u("k.ebt34"), num: true, f: (r) => num(r.ebtAkhir), v: (r) => r.ebtAkhir },
    { k: "bara", l: u("k.bara"), num: true, f: (r) => num(r.bara), v: (r) => r.bara }], rows, 8);
  return { html: `<p class="jm-bantu">${esc(u("g.intensitas_ket"))}${est()}</p>${grafik}${t}`, csv: true, sumber: ["ruptl"] };
};

K[10] = ({ d }) => {
  const kr = d.kredit;
  const resum = kr.per_registri.map((r) => ({ ikon: "centang", label: r.registri, nilai: num(r.terbit), satuan: "tCO2e", sub: u("kref.reg_sub", { n: num(r.proyek), p: num(r.pensiun) }) }));
  const tabelKredit = daftarTabel("kredit", [
    { k: "nama", l: u("k.nama"), f: (r) => tautan(r.url, r.nama.replace(/^\*/, "")), v: (r) => r.nama },
    { k: "reg", l: u("k.registri"), f: (r) => esc(r.registri), v: (r) => r.registri },
    { k: "tek", l: u("k.tek"), f: (r) => esc(r.teknologi), v: (r) => r.teknologi },
    { k: "st", l: u("k.status"), f: (r) => esc(u("status." + r.status)), v: (r) => r.status },
    { k: "terbit", l: u("k.terbit"), num: true, f: (r) => num(r.terbit), v: (r) => r.terbit },
    { k: "pensiun", l: u("k.pensiun"), num: true, f: (r) => num(r.pensiun), v: (r) => r.pensiun }], kr.daftar, 8);
  const tabelSrn = daftarTabel("srn", [
    { k: "nama", l: u("k.nama"), f: (r) => tautan(r.url, r.nama), v: (r) => r.nama },
    { k: "pemilik", l: u("k.pemilik"), f: (r) => (r.org ? `<a href="/o/${esc(r.org)}">${esc(r.pemilik)}</a>` : esc(r.pemilik || "-")), v: (r) => r.pemilik },
    { k: "tipe", l: u("k.tipe"), f: (r) => esc(r.tipe), v: (r) => r.tipe },
    { k: "vint", l: u("k.vintage"), f: (r) => esc(r.vintage || "-"), v: (r) => r.vintage },
    { k: "list", l: u("k.listing"), f: (r) => esc(tanggal(r.listing)), v: (r) => r.listing },
    { k: "vol", l: u("k.volume"), num: true, f: (r) => num(r.volume), v: (r) => r.volume }], d.srn, 5);
  return { html: `<div class="jm-tp-ubin-baris">${kartuAngka(resum)}</div>` + subjudul(u("h.kredit")) + `<p class="jm-bantu">${esc(u("h.kredit_ket"))}</p>` + tabelKredit + subjudul(u("h.srn")) + `<p class="jm-bantu">${esc(u("h.srn_ket"))}</p>` + tabelSrn, csv: true, sumber: ["kp", "idx"] };
};

K[11] = ({ d }) => {
  const b = d.bursa.at(-1), tabel = daftarTabel("bursa", [
    { k: "p", l: u("k.periode"), f: (r) => esc(bulan(r.periode)), v: (r) => r.periode },
    { k: "vb", l: u("k.vol_bln"), num: true, f: (r) => num(r.volume_bulan), v: (r) => r.volume_bulan },
    { k: "nb", l: u("k.nilai_bln"), num: true, f: (r) => num(r.nilai_bulan), v: (r) => r.nilai_bulan },
    { k: "h", l: u("k.harga"), num: true, est: true, f: (r) => num(r.harga), v: (r) => r.harga },
    { k: "ps", l: u("k.peserta"), num: true, f: (r) => num(r.peserta), v: (r) => r.peserta },
    { k: "ut", l: u("k.unit_ada"), num: true, f: (r) => num(r.unit_tersedia), v: (r) => r.unit_tersedia }], d.bursa, 7);
  const k = d.komitmen;
  const ub = kartuAngka([{ ikon: "orang", label: u("m.peserta"), nilai: num(b.peserta), satuan: "", sub: "" }, { ikon: "tahun", label: u("m.frek"), nilai: num(b.frekuensi_ytd), satuan: "", sub: "" }, { ikon: "proyek", label: u("m.proyek"), nilai: num(b.proyek_terdaftar), satuan: "", sub: "" }, { ikon: "grafik", label: u("m.unit"), nilai: num(b.unit_tersedia), satuan: "tCO2e", sub: "" }]);
  const pembeli = `<p class="jm-tp-p">${esc(u("m.pembeli", { sbti: num(k.sbti), nz: num(k.net_zero_valid), dunia: num(k.sbti_dunia), re: num(k.re100) }))}</p>`;
  return { html: `${ub}<p class="jm-bantu">${esc(u("m.catatan"))}</p>` + tabel + subjudul(u("h.pembeli")) + pembeli, csv: true, sumber: ["idx", "sbti"] };
};

K[20] = ({ lu }) => {
  const baris = lu.negara;
  const ST = (n, k) => (n[k]?.nilai ? u("instr." + (/^Has an? (carbon tax|ETS)$/.test(n[k].nilai) ? "ada" : /sub-national/.test(n[k].nilai) ? "sub" : "tidak")) : "-");
  const tabel = daftarTabel("benchmark", [
    { k: "n", l: u("k.negara"), f: (r) => negaraSel(L(r.nama)), v: (r) => L(r.nama) },
    { k: "p", l: u("k.pajak"), f: (r) => ST(r, "pajak_status"), v: (r) => ST(r, "pajak_status") },
    { k: "e", l: u("k.ets"), f: (r) => ST(r, "ets_status"), v: (r) => ST(r, "ets_status") },
    { k: "hp", l: u("k.harga_pajak"), num: true, f: (r) => num(r.harga_pajak?.[1], 1), v: (r) => r.harga_pajak?.[1] },
    { k: "he", l: u("k.harga_ets"), num: true, f: (r) => num(r.harga_ets?.[1], 1), v: (r) => r.harga_ets?.[1] },
    { k: "c", l: u("k.cakupan"), num: true, f: (r) => num(r.cakupan?.semua, 1), v: (r) => r.cakupan?.semua },
    { k: "s", l: u("k.tahun_mulai"), num: true, f: (r) => esc(String(r.pajak_sejak || r.ets_sejak || "-")), v: (r) => r.pajak_sejak || r.ets_sejak },
    { k: "k", l: u("k.kapita"), num: true, f: (r) => num(r.per_kapita?.[1], 1), v: (r) => r.per_kapita?.[1] },
    { k: "i", l: u("k.intensitas_listrik"), num: true, f: (r) => num(r.intensitas_listrik?.[1]), v: (r) => r.intensitas_listrik?.[1] }], baris, 8);
  const sorot = (n) => n.kode === "IDN", bd = (n) => { const i = isoNegara(L(n.nama).split(" (")[0]); return i ? { img: `/img/bendera/${i}.svg`, bend: true } : {}; };
  const gC = batang([...baris].sort((a, z) => (z.cakupan?.semua ?? 0) - (a.cakupan?.semua ?? 0)).map((n) => ({ label: L(n.nama), ...bd(n), v: n.cakupan?.semua ?? 0, teks: num(n.cakupan?.semua, 1) + "%", sorot: sorot(n) })), { maks: 100, label: u("g.cakupan") });
  const hg = (n) => Math.max(n.harga_ets?.[1] || 0, n.harga_pajak?.[1] || 0);
  const gH = batang([...baris].sort((a, z) => hg(z) - hg(a)).map((n) => ({ label: L(n.nama), ...bd(n), v: hg(n), teks: "US$" + num(hg(n), 1), sorot: sorot(n) })), { label: u("g.harga_luar") });
  const pilih = ["IDN", "CHN", "KOR", "DEU", "ZAF"].map((k) => baris.find((n) => n.kode === k)), tahun = pilih[0].deret_cakupan.map((p) => p[0]);
  const gT = garisTip(tahun.map(String), pilih.map((n) => ({ nama: L(n.nama).split(" (")[0], sorot: n.kode === "IDN", v: tahun.map((y) => n.deret_cakupan.find((p) => p[0] === y)?.[1] ?? null) })), { d: 0, satuan: "%", label: u("g.cakupan_tren") });
  const pil2 = ["IDN", "MYS", "CHN", "DEU", "ZAF"].map((k) => baris.find((n) => n.kode === k)), thn2 = pil2[0].deret_intensitas.map((p) => p[0]);
  const gI = garisTip(thn2.map(String), pil2.map((n) => ({ nama: L(n.nama).split(" (")[0], sorot: n.kode === "IDN", v: thn2.map((y) => n.deret_intensitas.find((p) => p[0] === y)?.[1] ?? null) })), { d: 0, label: u("g.intensitas_luar") });
  return { html: `<p class="jm-bantu">${esc(tok(lu.meta.catatan))}</p>` + tabel + subjudul(u("g.cakupan")) + gC + subjudul(u("g.harga_luar")) + gH + subjudul(u("g.cakupan_tren")) + gT + subjudul(u("g.intensitas_luar")) + `<p class="jm-bantu">${esc(u("g.intensitas_ket2"))}</p>` + gI, csv: true, sumber: ["ow_cakupan", "ow_pajak", "ow_ets", "ow_instrumen_pajak", "ow_instrumen_ets", "ow_per_kapita", "ow_intensitas"], celah: lu.meta.celah };
};

K[21] = ({ byKode: k, lu }) => {
  const p = (kode) => k[kode], hg = (n) => Math.max(n.harga_ets?.[1] || 0, n.harga_pajak?.[1] || 0), c = (n) => num(n.cakupan.semua, 1), h = (n) => num(hg(n), 1);
  const kartu = (judul, isi) => `<article class="jm-tp-kartu"><h3>${esc(u(judul))}</h3><p>${esc(isi)}</p></article>`;
  const html = `<div class="jm-tp-kisi">` +
    kartu("p.ets_mahal", u("p.ets_mahal_isi", { n: L(p("DEU").nama), c: c(p("DEU")), h: h(p("DEU")), y: p("DEU").ets_sejak })) +
    kartu("p.pajak", u("p.pajak_isi", { sg: c(p("SGP")), sgh: h(p("SGP")), sgy: p("SGP").pajak_sejak, za: c(p("ZAF")), zah: h(p("ZAF")), zay: p("ZAF").pajak_sejak, jp: c(p("JPN")), jph: h(p("JPN")) })) +
    kartu("p.ets_murah", u("p.ets_murah_isi", { cn: c(p("CHN")), cnh: h(p("CHN")), kr: c(p("KOR")), krh: h(p("KOR")), id: c(p("IDN")), idh: num(hg(p("IDN")), 2) })) + `</div>` +
    `<p class="jm-tp-p">${esc(u("p.pelajaran", { krh: h(p("KOR")), de: h(p("DEU")), idh: num(hg(p("IDN")), 2) }))}${est()}</p>`;
  return { html, sumber: ["ow_cakupan", "ow_pajak", "ow_ets"] };
};

K[22] = ({ lu, byKode, naskah }) => {
  const n = lu.negara, id = byKode.IDN;
  const ind = [
    { k: "cakupan", l: u("k.cakupan"), v: (x) => x.cakupan?.semua, d: 1, s: "%" }, { k: "harga", l: u("k.harga_gabung"), v: (x) => Math.max(x.harga_ets?.[1] || 0, x.harga_pajak?.[1] || 0), d: 2, s: "US$" },
    { k: "kapita", l: u("k.kapita"), v: (x) => x.per_kapita?.[1], d: 1, s: "t" }, { k: "intensitas", l: u("k.intensitas_listrik"), v: (x) => x.intensitas_listrik?.[1], d: 0, s: "g/kWh" }]
    .map((i) => { const nilai = i.v(id), lain = n.filter((x) => x.kode !== "IDN").map(i.v), rank = [...n].map(i.v).sort((a, z) => z - a).indexOf(nilai) + 1; return { ...i, nilai, med: median(lain), rank }; });
  const t = daftarTabel("posisi", [
    { k: "l", l: u("k.indikator"), f: (r) => esc(r.l), v: (r) => r.l },
    { k: "n", l: u("k.indonesia"), num: true, f: (r) => num(r.nilai, r.d), v: (r) => r.nilai },
    { k: "m", l: u("k.median"), num: true, est: true, f: (r) => num(r.med, r.d), v: (r) => r.med },
    { k: "r", l: u("k.peringkat", { n: num(n.length) }), num: true, est: true, f: (r) => num(r.rank), v: (r) => r.rank }], ind, 6);
  return { html: `<p class="jm-tp-p">${esc(tok(naskah.posisi))}</p>` + t + `<p class="jm-bantu">${esc(u("p.peringkat_ket"))}</p>`, csv: true, sumber: ["ow_cakupan", "ow_ets", "ow_per_kapita", "ow_intensitas"] };
};

K[23] = ({ d }) => {
  const j = d.jetp;
  const ub = kartuAngka([{ ikon: "kartu", label: u("j.komitmen"), nilai: num(j.komitmen_usd_miliar), satuan: u("j.miliar"), sub: "" }, { ikon: "tek-listrik", label: u("j.mw"), nilai: num(j.ebt_didukung_mw), satuan: "MW", sub: "" }, { ikon: "grafik", label: u("j.ghg"), nilai: num(j.penurunan_ghg_tco2e), satuan: "tCO2e", sub: "" }]);
  return { html: ub + `<p class="jm-bantu">${esc(u("j.catatan"))}</p><p class="jm-tp-p">${esc(u("j.pasal6"))}</p>`, sumber: ["jetp"], tambah: j.sumber.slice(1).map((s) => ({ sumber: s.judul, url: s.url, tanggal: j.tanggal_cipp })) };
};

K[25] = ({ d, hmin, hmaks, iJb }) => {
  const rows = d.sistem.map((s) => { const i = s.tahun.indexOf(2025), g = s.intensitas[i]; return { nama: s.nama, g, t: g * 1000, rmin: (g * 1000 * hmin) / 1e6, rmaks: (g * 1000 * hmaks) / 1e6 }; });
  const t = daftarTabel("ekonomi", [
    { k: "n", l: u("k.nama"), f: (r) => esc(r.nama), v: (r) => r.nama },
    { k: "g", l: u("k.intensitas"), num: true, est: true, f: (r) => num(r.g, 2), v: (r) => r.g },
    { k: "t", l: u("k.terhindar"), num: true, est: true, f: (r) => num(r.t), v: (r) => r.t },
    { k: "a", l: u("k.rp_min", { h: num(hmin) }), num: true, est: true, f: (r) => num(r.rmin, 1), v: (r) => r.rmin },
    { k: "b", l: u("k.rp_maks", { h: num(hmaks) }), num: true, est: true, f: (r) => num(r.rmaks, 1), v: (r) => r.rmaks }], rows, 8);
  return { html: `<p class="jm-tp-p">${esc(u("e.ket"))}</p>` + t + `<p class="jm-bantu">${esc(u("e.syarat"))}</p>`, csv: true, sumber: ["ruptl", "idx"] };
};

K[29] = ({ d, dasar }) => {
  const dft = d.kredit.daftar, hitung = (f) => dft.filter(f).length;
  const reg = Object.fromEntries(d.kredit.per_registri.map((r) => [r.registri, r]));
  const ub = kartuAngka([
    { ikon: "peringatan", label: u("i.terlambat"), nilai: num(hitung((p) => p.status === "terdaftar_terlambat_verifikasi")), satuan: "", sub: "" }, { ikon: "silang", label: u("i.ditarik"), nilai: num(hitung((p) => p.status === "ditarik")), satuan: "", sub: "" },
    { ikon: "centang", label: u("i.pensiun_verra"), nilai: num((reg["Verra VCS"].pensiun / reg["Verra VCS"].terbit) * 100, 1), satuan: "%", sub: "" }, { ikon: "centang", label: u("i.pensiun_gs"), nilai: num((reg["Gold Standard"].pensiun / reg["Gold Standard"].terbit) * 100, 1), satuan: "%", sub: "" }]);
  const bacaan = (dasar.pustaka || []).filter((p) => /co-firing|cirebon|pledges/i.test(p.id));
  const html = `<p class="jm-tp-p">${esc(u("i.pengantar"))}</p>${ub}<p class="jm-bantu">${esc(u("i.ket"))}${est()}</p>` + subjudul(u("i.bacaan")) + `<p class="jm-bantu">${esc(u("i.satu_sisi"))}</p>` + (B.pustaka(bacaan)?.html || "");
  return { html, sumber: ["kp"] };
};

K[30] = ({ d }) => {
  const th = d.sistem[0].tahun, jml = (key) => th.map((_, i) => d.sistem.reduce((s, x) => s + (x[key][i] || 0), 0));
  const em = jml("emisi"), prod = jml("produksi"), ebt = th.map((_, i) => d.sistem.reduce((s, x) => s + (x.ebt[i] || 0) * (x.produksi[i] || 0), 0) / prod[i]);
  const g = garisTip(th.map(String), [{ nama: u("g.emisi_total"), sorot: true, v: em }], { d: 0, label: u("g.emisi_total") });
  const g2 = garisTip(th.map(String), [{ nama: u("g.ebt_tertimbang"), sorot: true, v: ebt }], { d: 0, satuan: "%", label: u("g.ebt_tertimbang") });
  const tg = d.target.map((x) => ({ ...x, ket: x.catatan })), uk = { bauran_energi_primer_ebt_persen: "k.u.bauran", kapasitas_terbarukan_mw: "k.u.kap", penurunan_emisi_persen: "k.u.emisi" };
  const t = daftarTabel("target", [
    { k: "u", l: u("k.ukuran"), f: (r) => esc(u(uk[r.ukuran] || "k.u.lain")), v: (r) => r.ukuran },
    { k: "y", l: u("k.tahun"), num: true, f: (r) => esc(String(r.tahun)), v: (r) => r.tahun },
    { k: "min", l: u("k.min"), num: true, f: (r) => num(r.min, r.min % 1 ? 2 : 0), v: (r) => r.min },
    { k: "maks", l: u("k.maks"), num: true, f: (r) => num(r.maks, 2), v: (r) => r.maks },
    { k: "d", l: u("k.dokumen"), f: (r) => { const s = S.sumber["t_" + r.dokumen]; return s ? tautan(s.url, r.dokumen) : esc(r.dokumen); }, v: (r) => r.dokumen }], tg, 6);
  return { html: `<p class="jm-tp-p">${esc(u("pr.ket"))}${est()}</p>` + subjudul(u("g.emisi_total")) + `<p class="jm-bantu">${esc(u("pr.sat"))}</p>` + g + subjudul(u("g.ebt_tertimbang")) + g2 + subjudul(u("pr.target")) + t, csv: true, sumber: ["ruptl", "t_ken-pp-40-2025", "t_rukn-2025"] };
};

export const KHUSUS = K;
