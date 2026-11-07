/* /strategi: Kajian strategis EBT Indonesia. Analisis turunan deterministik (bukan AI) dari data yang sudah terkumpul; hitungan di strategi_hitung.js.
   Tiap angka bersumber (ikon info per kepala), tiap turunan berpil EST, kesimpulan berlabel "Analisis METI (Hipotesis)", metode terbuka di bagian akhir.
   Tanpa kalkulator: tidak ada masukan angka dari pengguna. INP: kontrol (urut, halaman, segmen, klik sel) mengubah chrome seketika; isi berat lewat nanti(). */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, bahasa, tanggal } from "/i18n.js";
import { esc, nanti, ikon, hantuHtml } from "/inti/umum.js";
import { exHtml, tabTautan } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { khSisi } from "/inti/kh.js";
import { sumberLipat, pil, num, saatBahasa, tampilGalat, muatData } from "/analisis.js";
import { batang, dumbbell } from "/grafik.js";
import { ikonTek } from "/inti/ikon_tek.js";
import { singkatProv } from "/inti/prov_singkat.js";
import { daftarTabel, pasangTabel, bersihTabel, ubahBaris, seg, legenda, garisTip, kolomTumpuk } from "/strategi_ui.js";
import * as H from "/strategi_hitung.js";

const $ = (id) => document.getElementById(id);
const D = {};
let A = null, REF = { tahun: 2026 };
const ST = { urutPeta: { k: "rata", arah: -1 }, tingkat: "semua", sel: null, proyek: null };
const tekL = (k) => (k ? t("st.tn." + k) : "-");
const n0 = (v) => (v == null ? "-" : num(v, 0));
const n1 = (v) => (v == null ? "-" : num(v, 1));
const n2 = (v) => (v == null ? "-" : num(v, 2));
const pct = (v, d = 1) => (v == null ? "-" : num(v, d) + "%");
const usd = (v) => (v == null ? "-" : Math.abs(v) >= 1e9 ? t("st.u.miliar", { n: num(v / 1e9, 1) }) : Math.abs(v) >= 1e6 ? t("st.u.juta", { n: num(v / 1e6, Math.abs(v) < 1e7 ? 1 : 0) }) : t("st.u.ribu", { n: num(v / 1e3, 0) })));
const EST = () => " " + pil("an.est");

/* ---------- sumber ---------- */
const SUMB = {
  target: () => D.target.sumber.map((s) => ({ sumber: s.judul, url: s.url, tahun: s.tahun, tanggal: D.target.meta.diperbarui })),
  ruptl: () => D.ruptl.sumber.slice(0, 1).map((s) => ({ sumber: s.judul, url: s.url, tahun: s.tahun, tanggal: D.ruptl.meta.diperbarui })),
  proyek: () => [{ sumber: t("st.s.proyek"), tanggal: D.proyek.dibangun_pada }],
  peluang: () => D.peluang.sumber.map((s) => ({ sumber: s.judul, url: s.url, tahun: s.tahun, tanggal: D.peluang.meta.diperbarui })),
  tren: () => D.kapasitas_tren.sumber.map((s) => ({ sumber: s.judul, url: s.url, tahun: s.tahun, tanggal: D.kapasitas_tren.meta.diperbarui })),
  dana: () => D.pendanaan.sumber.slice(0, 4).map((s) => ({ sumber: s.judul, url: s.url, tanggal: D.pendanaan.dibangun_pada })),
  iati: () => D.pendanaan_int.sumber.map((s) => ({ sumber: s.judul, url: s.url, tanggal: D.pendanaan_int.dibangun_pada })),
  publik: () => D.keuangan_hijau.sumber.slice(0, 2).map((s) => ({ sumber: s.judul, url: s.url, tahun: s.tahun, tanggal: D.keuangan_hijau.dibangun_pada })),
  indeks: () => [{ sumber: t("st.s.indeks"), tanggal: D.indeks.tanggal }],
  berita: () => [{ sumber: t("st.s.berita"), tanggal: D.berita.dibangun_pada }],
  peristiwa: () => D.peristiwa.sumber.map((s) => ({ sumber: s.judul, url: s.url, tanggal: D.peristiwa.dibangun_pada })),
  rued: () => [{ sumber: D.rued.sumber, tanggal: D.rued.tanggal_ambil }],
  transisi: () => D.transisi.sumber.map((s) => ({ sumber: s.judul, url: s.url, tahun: s.tahun, tanggal: D.transisi.dibangun_pada })),
};
const src = (...ks) => sumberLipat(ks.flatMap((k) => SUMB[k]()));

/* ---------- eksibit ---------- */
const ex = (id, ik, kunci, { judul, sub = "", isi, sumber = "", csv = false, kaki = "" }) =>
  exHtml({ id, ikon: ik, topik: t(`st.${kunci}.ey`), judulHtml: judul, subHtml: (sub ? esc(sub) : esc(t(`st.${kunci}.sub`))) + EST(), aksiHtml: aksiHtml({ csv }) + sumber, isiHtml: isi, kakiHtml: kaki });
const grup = (id, ik, isi) => `<div id="${id}" class="jm-st-bag"><section class="jm-st-grup" aria-labelledby="g-${id}"><header><span class="jm-kpi-ik">${ikon(ik, 20)}</span><div><h2 id="g-${id}">${esc(t(`st.g.${id}`))}</h2><p>${esc(t(`st.g.${id}_sub`))}</p></div></header>${isi.join("")}</section></div>`;
const bantu = (kunci, p) => `<p class="jm-bantu">${esc(t(kunci, p))}</p>`;
const kesimpulan = (teks) => `<p class="jm-st-kes"><span class="jm-pil jm-pil-warn">${esc(t("st.hipotesis"))}</span> ${esc(teks)}</p>`;

/* ---------- 1. kesenjangan target ---------- */
const namaTarget = (x) => `${x.dok} ${x.tahun}${x.ukuran === "primer" ? " " + t("st.bauran.primer") : ""}`;
function eBauran() {
  const K = A.kes, b34 = K.bauran.find((x) => x.id === "ruptl-2034"), real = K.real, rukn = D.target.target.find((x) => x.id === "rukn-2025-pembangkitan").seri;
  const th = Array.from({ length: 20 }, (_, i) => 2015 + i), akhir = real.at(-1);
  const reg = H.regresi(real.map((r) => r.tahun), real.map((r) => r.nilai));
  const seri = [
    { nama: t("st.bauran.s_real"), sorot: true, v: th.map((y) => real.find((r) => r.tahun === y)?.nilai ?? null) },
    { nama: t("st.bauran.s_tren"), putus: true, v: th.map((y) => (y >= akhir.tahun ? reg.a + reg.b * y : null)) },
    { nama: t("st.bauran.s_rukn"), v: th.map((y) => rukn[y] ?? null) },
    { nama: t("st.bauran.s_ruptl"), v: th.map((y) => (y === 2034 ? b34.target : null)) },
  ];
  const tab = daftarTabel("bauran", [
    { k: "n", l: "st.c.target", v: (x) => namaTarget(x), f: (x) => esc(namaTarget(x)) },
    { k: "t", l: "st.c.nilai", v: (x) => x.target, f: (x) => pct(x.target), num: true },
    { k: "r", l: "st.c.realisasi", v: (x) => x.realisasi, f: (x) => pct(x.realisasi), num: true },
    { k: "g", l: "st.c.selisih", v: (x) => x.gap, f: (x) => n1(x.gap), num: true, est: true },
    { k: "p", l: "st.c.perlu_poin", v: (x) => x.perlu_poin, f: (x) => n2(x.perlu_poin), num: true, est: true },
    { k: "e", l: "st.c.tren_poin", v: (x) => x.tren_poin, f: (x) => n2(x.tren_poin), num: true, est: true },
    { k: "k", l: "st.c.kali", v: (x) => x.kali, f: (x) => (x.kali == null ? "-" : n1(x.kali) + "x"), num: true, est: true },
    { k: "y", l: "st.c.tahun_capai", v: (x) => x.tahun_capai, f: (x) => (x.tahun_capai == null ? "-" : x.tahun_capai), num: true, est: true },
    { k: "l", l: "st.c.terlambat", v: (x) => x.terlambat, f: (x) => (x.terlambat == null ? "-" : n0(x.terlambat)), num: true, est: true },
  ], K.bauran, 6);
  const kes = t("st.bauran.kes", { target: pct(b34.target), tahun: b34.tahun, capai: b34.tahun_capai ?? "-", telat: b34.terlambat ?? "-" });
  return ex("bauran", "grafik", "bauran", {
    judul: hlHtml("st.bauran.judul", n2(b34.perlu_poin), { tren: n2(b34.tren_poin), tahun: b34.tahun }),
    isi: garisTip(th.map(String), seri, { d: 1, satuan: "%", label: t("st.bauran.grafik") }) + bantu("st.bauran.catatan") + tab + kesimpulan(kes),
    sumber: src("target"), csv: true,
  });
}
function eKapasitas() {
  const K = A.kes, ru = K.kapasitas.find((x) => x.id === "ruptl-2034-kapasitas") || K.kapasitas[0];
  const grafik = batang(K.kapasitas.map((x) => ({ label: `${x.dok} ${x.tahun}`, v: x.perlu_mw, teks: n0(x.perlu_mw), sorot: x === ru })), { ref: K.laju, teksRef: n0(K.laju), label: t("st.kap.grafik") });
  const tab = daftarTabel("kap", [
    { k: "n", l: "st.c.target", v: (x) => x.tahun, f: (x) => esc(`${x.dok} ${x.tahun}`) },
    { k: "c", l: "st.c.celah_mw", v: (x) => x.celah_mw, f: (x) => n0(x.celah_mw), num: true },
    { k: "p", l: "st.c.perlu_mw", v: (x) => x.perlu_mw, f: (x) => n0(x.perlu_mw), num: true, est: true },
    { k: "h", l: "st.c.laju_hist", v: (x) => x.laju, f: (x) => n0(x.laju), num: true },
    { k: "k", l: "st.c.kali", v: (x) => x.kali, f: (x) => n1(x.kali) + "x", num: true, est: true },
    { k: "y", l: "st.c.tahun_capai", v: (x) => x.tahun_capai, f: (x) => x.tahun_capai, num: true, est: true },
  ], K.kapasitas, 6);
  return ex("kap", "kompas", "kap", {
    judul: hlHtml("st.kap.judul", n0(ru.perlu_mw), { kali: n1(ru.kali), laju: n0(ru.laju) }),
    isi: grafik + bantu("st.kap.catatan") + tab + kesimpulan(t("st.kap.kes", { dok: `${ru.dok} ${ru.tahun}`, capai: ru.tahun_capai, kali: n1(ru.kali) })),
    sumber: src("target", "tren"), csv: true,
  });
}
function eTek() {
  const K = A.kes, p = K.per_tek, t1 = p.find((x) => x.kali != null);
  const grafik = dumbbell(p.map((x) => ({ label: tekL(x.tek), a: x.laju10, b: x.perlu_mw, tekA: n0(x.laju10), tekB: n0(x.perlu_mw), sorot: x === t1 })), { kepA: t("st.tek.k_hist"), kepB: t("st.tek.k_perlu"), label: t("st.tek.grafik") });
  const tab = daftarTabel("tek", [
    { k: "n", l: "st.c.teknologi", v: (x) => tekL(x.tek), f: (x) => esc(tekL(x.tek)) },
    { k: "a", l: "st.c.kap_akhir", v: (x) => x.kap_akhir, f: (x) => n0(x.kap_akhir), num: true },
    { k: "h", l: "st.c.laju10", v: (x) => x.laju10, f: (x) => n0(x.laju10), num: true, est: true },
    { k: "l", l: "st.c.laju5", v: (x) => x.laju5, f: (x) => n0(x.laju5), num: true, est: true },
    { k: "b", l: "st.c.bernama", v: (x) => x.bernama_mw, f: (x) => n0(x.bernama_mw), num: true },
    { k: "p", l: "st.c.perlu_mw", v: (x) => x.perlu_mw, f: (x) => n0(x.perlu_mw), num: true, est: true },
    { k: "k", l: "st.c.kali", v: (x) => x.kali, f: (x) => (x.kali == null ? "-" : n1(x.kali) + "x"), num: true, est: true },
    { k: "y", l: "st.c.tahun_capai", v: (x) => x.tahun_capai, f: (x) => (x.tahun_capai == null ? "-" : x.tahun_capai), num: true, est: true },
  ], p, 5);
  return ex("tek", "tek-surya", "tek", {
    judul: hlHtml("st.tek.judul", tekL(t1.tek), { kali: n1(t1.kali) }),
    isi: grafik + bantu("st.tek.catatan", { total: n0(K.ruptl_total_mw), nama: n0(K.bernama_total_mw), sisa: n0(K.tidak_terperinci_mw) }) + tab + kesimpulan(t("st.tek.kes", { tek: tekL(t1.tek), tahun: t1.tahun_capai, target: t1.tahun_target })),
    sumber: src("target", "ruptl", "tren"), csv: true,
  });
}

/* ---------- 2. peta peluang ---------- */
const kelasSkor = (s) => (s == null ? "k" : s < 20 ? "s0" : s < 40 ? "s1" : s < 60 ? "s2" : s < 80 ? "s3" : "s4");
function urutProv() {
  const u = ST.urutPeta, P = A.peta, nilai = (p) => (u.k === "rata" ? P.baris.find((b) => b.kode === p.kode).rata : u.k === "nama" ? p.nama : P.sel[p.kode + "|" + u.k].skor);
  return [...P.provinsi].sort((a, b) => {
    const x = nilai(a), z = nilai(b);
    return ((x == null) - (z == null)) || (x == null ? 0 : typeof x === "number" ? (x - z) * u.arah : String(x).localeCompare(String(z), bahasa()) * u.arah) || a.nama.localeCompare(b.nama);
  });
}
function matriks() {
  const P = A.peta, u = ST.urutPeta;
  const ar = (k) => (u.k === k ? (u.arah > 0 ? "ascending" : "descending") : "none");
  const kep = H.TEK.map((k) => `<th scope="col" aria-sort="${ar(k)}"><button type="button" class="jm-st-uh" data-urutpeta="${k}" aria-label="${esc(t("st.peta.urut_tek", { tek: tekL(k) }))}">${(ikonTek(k === "mikrohidro" ? "hidro" : k === "sampah" ? "biomassa-sampah" : k))}<span>${esc(t("st.tk." + k))}</span></button></th>`).join("");
  const baris = urutProv().map((p) => {
    const rata = P.baris.find((b) => b.kode === p.kode).rata;
    const sel = H.TEK.map((k) => {
      const c = P.sel[p.kode + "|" + k], on = ST.sel === p.kode + "|" + k;
      return `<td><button type="button" class="jm-st-sel ${kelasSkor(c.skor)}${on ? " pilih" : ""}" data-sel="${p.kode}|${k}" aria-pressed="${on}" aria-label="${esc(c.skor == null ? t("st.peta.sel_kosong", { prov: p.nama, tek: tekL(k) }) : t("st.peta.sel", { prov: p.nama, tek: tekL(k), skor: n1(c.skor) }))}" title="${esc(`${p.nama}, ${tekL(k)}: ${c.skor == null ? t("st.peta.kurang") : n1(c.skor)}`)}">${c.skor == null ? "-" : n0(c.skor)}</button></td>`;
    }).join("");
    return `<tr><th scope="row"><span class="jm-st-pn">${esc(p.nama)}</span><span class="jm-st-ps">${esc(singkatProv(p.kode) || p.nama)}</span></th>${sel}<td class="jm-st-rt jm-num">${n0(rata)}</td></tr>`;
  }).join("");
  return `<div class="jm-st-mgulir"><table class="jm-st-mat" aria-label="${esc(t("st.peta.label"))}"><thead><tr><th scope="col" aria-sort="${ar("nama")}"><button type="button" class="jm-st-uh" data-urutpeta="nama">${esc(t("st.c.provinsi"))}</button></th>${kep}<th scope="col" class="jm-num" aria-sort="${ar("rata")}"><button type="button" class="jm-st-uh" data-urutpeta="rata">${esc(t("st.c.rata"))}</button></th></tr></thead><tbody>${baris}</tbody></table></div>`;
}
function rinciSel() {
  const el = $("stRinci");
  if (!el) return;
  if (!ST.sel) { el.innerHTML = `<p class="jm-bantu">${esc(t("st.peta.pilih"))}</p>`; return; }
  const c = A.peta.sel[ST.sel];
  const baris = c.komponen.map((k) => {
    const ket = t("st.k." + k.id, { pot: n0(k.potensi), ter: n0(k.terpasang), sisa: n0(k.nilai), bpp: n2(k.bpp), tarif: n2(k.tarif), F: n2(k.F), tingkat: k.tingkat || "", r: n2(k.nilai), mw: n0(k.mw ?? k.nilai), n: k.n, b: k.bermasalah, mwb: n0(k.mw_bermasalah), lokal: k.lokal, nas: n0(k.nasional), rued: t("st.rued." + (k.nilai >= 100 ? "target" : k.nilai > 0 ? "perda" : "tidak")) });
    return `<tr><th scope="row">${esc(t("st.kn." + k.id))}</th><td>${esc(ket)}</td><td class="jm-num">${n0(k.skor)}</td><td class="jm-num">${k.bobot}</td></tr>`;
  }).join("");
  const kurang = c.skor == null;
  let kes = "";
  if (!kurang) {
    const sorted = [...c.komponen].sort((a, b) => b.skor - a.skor), kuat = sorted[0], lemah = sorted.at(-1);
    kes = kesimpulan(t("st.kes." + (c.skor >= 70 ? "kuat" : c.skor >= 50 ? "telaah" : "terbatas"), { prov: c.prov, tek: tekL(c.tek), skor: n1(c.skor), kuat: t("st.kn." + kuat.id), lemah: t("st.kn." + lemah.id) }));
  }
  el.innerHTML = `<h3 class="jm-st-h3">${esc(c.prov)}, ${esc(tekL(c.tek))}${kurang ? "" : `<span class="jm-st-skor">${n1(c.skor)}</span>`}</h3>${kurang ? bantu("st.peta.kurang_n", { n: c.n }) : ""}<div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr><th>${esc(t("st.c.komponen"))}</th><th>${esc(t("st.c.alasan"))}</th><th class="jm-num">${esc(t("st.c.skor"))}</th><th class="jm-num">${esc(t("st.c.bobot"))}</th></tr></thead><tbody>${baris}</tbody></table></div>${kes}`;
}
function ePeta() {
  const P = A.peta, top = P.top[0];
  const semua = Object.values(P.sel).filter((s) => s.skor != null).sort((a, b) => b.skor - a.skor || a.prov.localeCompare(b.prov) || a.tek.localeCompare(b.tek));
  const rank = new Map(semua.map((s, i) => [s, i + 1]));
  const ekstrem = (s, f) => t("st.kn." + [...s.komponen].sort((a, b) => f * (b.skor - a.skor))[0].id);
  const tab = daftarTabel("sel", [
    { k: "r", l: "st.c.peringkat", v: (x) => rank.get(x), f: (x) => rank.get(x), num: true },
    { k: "p", l: "st.c.provinsi", v: (x) => x.prov, f: (x) => esc(x.prov) },
    { k: "t", l: "st.c.teknologi", v: (x) => tekL(x.tek), f: (x) => esc(tekL(x.tek)) },
    { k: "s", l: "st.c.skor", v: (x) => x.skor, f: (x) => n1(x.skor), num: true, est: true },
    { k: "u", l: "st.c.terkuat", v: (x) => ekstrem(x, 1), f: (x) => esc(ekstrem(x, 1)) },
    { k: "w", l: "st.c.terlemah", v: (x) => ekstrem(x, -1), f: (x) => esc(ekstrem(x, -1)) },
    { k: "n", l: "st.c.komponen_n", v: (x) => x.n, f: (x) => x.n, num: true },
  ], semua, 8);
  const skala = `<div class="jm-st-skala"><span>${esc(t("st.peta.skala_rendah"))}</span><i class="jm-st-grad" aria-hidden="true"></i><span>${esc(t("st.peta.skala_tinggi"))}</span><small>${esc(t("st.peta.skala_kurang"))}</small></div>`;
  return ex("matriks", "peta", "peta", {
    judul: hlHtml("st.peta.judul", n0(P.terisi), { total: n0(P.total), prov: top.prov, tek: tekL(top.tek) }),
    isi: `<div id="stMatriks">${matriks()}</div>${skala}${bantu("st.peta.petunjuk")}<div id="stRinci" class="jm-st-rinci" aria-live="polite"></div><h3 class="jm-st-h3">${esc(t("st.peta.top"))}</h3>${tab}`,
    sumber: src("peluang", "ruptl", "proyek", "indeks", "rued", "dana"), csv: true,
  });
}

/* ---------- 3. radar risiko ---------- */
const kelasTingkat = { tinggi: "bad", sedang: "warn", rendah: "ok" };
const pilTingkat = (k) => `<span class="jm-pil jm-pil-${kelasTingkat[k]}">${esc(t("st.tingkat." + k))}</span>`;
function barisRadar() { return A.radar.baris.filter((b) => ST.tingkat === "semua" || b.tingkat === ST.tingkat); }
function kolomRadar() {
  return [
    { k: "n", l: "st.c.proyek", v: (x) => x.nama, f: (x) => `<button type="button" class="jm-st-nama" data-proyek="${esc(x.id)}">${esc(x.nama)}</button>` },
    { k: "t", l: "st.c.teknologi", v: (x) => tekL(x.tek), f: (x) => esc(tekL(x.tek)) },
    { k: "p", l: "st.c.provinsi", v: (x) => x.prov || "", f: (x) => esc(x.prov || "-") },
    { k: "m", l: "st.c.mw", v: (x) => x.mw, f: (x) => n1(x.mw), num: true },
    { k: "s", l: "st.c.status", v: (x) => x.status, f: (x) => esc(t("st.status." + x.status)) },
    { k: "c", l: "st.c.cod", v: (x) => x.cod, f: (x) => (x.cod == null ? "-" : x.cod), num: true },
    { k: "x", l: "st.c.skor_risiko", v: (x) => x.skor, f: (x) => x.skor, num: true, est: true },
    { k: "l", l: "st.c.tingkat", v: (x) => x.skor, f: (x) => pilTingkat(x.tingkat) },
    { k: "d", l: "st.c.tanda_n", v: (x) => x.tanda.length, f: (x) => x.tanda.length, num: true },
  ];
}
function rinciProyek() {
  const el = $("stProyek");
  if (!el) return;
  const p = A.radar.baris.find((b) => b.id === ST.proyek);
  if (!p) { el.innerHTML = `<p class="jm-bantu">${esc(t("st.radar.pilih"))}</p>`; return; }
  const tanda = p.tanda.map((x) => `<li>${ikon("peringatan", 16)}<span>${esc(t("st.tanda." + x.id, { ...x.param, judul: "", lewat: x.param.lewat, rm: n0(x.param.rm), rasio: n1(x.param.rasio) }))}${x.param.url ? ` <a href="${esc(x.param.url)}" target="_blank" rel="noopener noreferrer">${esc(x.param.judul)}</a>` : ""}</span></li>`).join("");
  const grupP = [...new Set(p.tanda.map((x) => H.DAFTAR_PERIKSA[x.id]))];
  const periksa = grupP.map((g) => `<li>${ikon("centang", 16)}<span>${esc(t("st.periksa." + g))}</span></li>`).join("");
  el.innerHTML = `<h3 class="jm-st-h3">${esc(p.nama)} ${pilTingkat(p.tingkat)}</h3><p class="jm-bantu">${esc(t("st.radar.ringkas", { tek: tekL(p.tek), prov: p.prov || "-", mw: n1(p.mw), status: t("st.status." + p.status), skor: p.skor }))}</p>
    <ul class="jm-st-daftar">${tanda || `<li>${ikon("centang", 16)}<span>${esc(t("st.radar.bersih"))}</span></li>`}</ul>${periksa ? `<h4 class="jm-st-h4">${esc(t("st.radar.periksa"))}</h4><ul class="jm-st-daftar">${periksa}</ul>` : ""}${kesimpulan(t("st.radar.kes." + p.tingkat))}`;
}
function eRadar() {
  const R = A.radar, B = R.baris;
  const rows = Object.entries(R.frek).sort((a, b) => b[1] - a[1]).map(([k, v], i) => ({ label: t("st.tanda_p." + k), v, teks: `${n0(v)} ${t("st.u.proyek")}`, sorot: i === 0 }));
  const grafik = batang(rows, { label: t("st.radar.grafik") });
  const tab = daftarTabel("radar", kolomRadar(), barisRadar(), 8);
  const sg = seg("tingkat", [["semua", "st.tingkat.semua", "daftar"], ["tinggi", "st.tingkat.tinggi", "peringatan"], ["sedang", "st.tingkat.sedang", "info"], ["rendah", "st.tingkat.rendah", "centang"]], ST.tingkat, t("st.radar.seg"));
  return ex("risiko", "peringatan", "radar", {
    judul: hlHtml("st.radar.judul", n0(R.per.tinggi.n), { total: n0(B.length), mw: n0(R.per.tinggi.mw) }),
    isi: `${grafik}${bantu("st.radar.catatan", { cod: n0(R.mw_lewat_cod), total: n0(R.total_mw) })}<div id="stProyek" class="jm-st-rinci" aria-live="polite"></div>${sg}${legenda([["bad", "st.tingkat.tinggi_k"], ["warn", "st.tingkat.sedang_k"], ["ok", "st.tingkat.rendah_k"]])}${tab}`,
    sumber: src("proyek", "ruptl", "berita", "transisi", "dana"), csv: true,
  });
}

/* ---------- 4. konsentrasi ---------- */
function eHhi() {
  const K = A.kons, p = K.per_tek, t1 = p.find((x) => x.pemain >= 2 && x.n_bernama >= 3 && x.cakupan >= 50) || p[0];
  const grafik = batang(p.filter((x) => x.n_bernama >= 3).map((x) => ({ label: tekL(x.tek), v: x.hhi, teks: `${n0(x.hhi)} (${t("st.hhi." + x.kelas)})`, sorot: x === t1 })), { maks: 10000, ref: 2500, teksRef: t("st.hhi.ambang"), label: t("st.hhi.grafik") });
  const tab = daftarTabel("hhi", [
    { k: "n", l: "st.c.teknologi", v: (x) => tekL(x.tek), f: (x) => esc(tekL(x.tek)) },
    { k: "m", l: "st.c.mw_operasi", v: (x) => x.mw_total, f: (x) => n0(x.mw_total), num: true },
    { k: "b", l: "st.c.mw_bernama", v: (x) => x.mw_bernama, f: (x) => n0(x.mw_bernama), num: true },
    { k: "c", l: "st.c.cakupan", v: (x) => x.cakupan, f: (x) => pct(x.cakupan, 0), num: true },
    { k: "p", l: "st.c.pemain", v: (x) => x.pemain, f: (x) => n0(x.pemain), num: true },
    { k: "h", l: "st.c.hhi", v: (x) => x.hhi, f: (x) => n0(x.hhi), num: true, est: true },
    { k: "k", l: "st.c.kelas", v: (x) => x.hhi, f: (x) => esc(t("st.hhi." + x.kelas)) },
    { k: "g", l: "st.c.terbesar", v: (x) => x.terbesar || "", f: (x) => esc(x.terbesar || "-") },
    { k: "s", l: "st.c.pangsa_terbesar", v: (x) => x.pangsa_terbesar, f: (x) => pct(x.pangsa_terbesar, 0), num: true, est: true },
  ], p, 6);
  return ex("hhi", "tingkat", "hhi", {
    judul: hlHtml("st.hhi.judul", n0(t1.hhi), { tek: tekL(t1.tek), kelas: t("st.hhi." + t1.kelas) }),
    isi: grafik + bantu("st.hhi.catatan", { n: n0(K.n_bernama), total: n0(K.n_beroperasi) }) + tab + kesimpulan(t("st.hhi.kes", { tek: tekL(t1.tek), nama: t1.terbesar || "-", pangsa: pct(t1.pangsa_terbesar, 0), cakupan: pct(t1.cakupan, 0) })),
    sumber: src("proyek"), csv: true,
  });
}
function ePangsa() {
  const K = A.kons.pangsa, a = K.find((x) => x.tahun >= 2015) || K[0], z = K.at(-1);
  const th = K.map((x) => String(x.tahun));
  const seri = [{ nama: t("st.gol.bumn"), sorot: true, v: K.map((x) => x.bumn) }, { nama: t("st.gol.swasta"), v: K.map((x) => x.swasta) }, { nama: t("st.gol.asing"), v: K.map((x) => x.asing) }];
  const tab = daftarTabel("pangsa", [
    { k: "y", l: "st.c.tahun", v: (x) => x.tahun, f: (x) => x.tahun, num: true },
    { k: "t", l: "st.c.mw_bernama", v: (x) => x.total, f: (x) => n0(x.total), num: true },
    { k: "b", l: "st.gol.bumn", v: (x) => x.bumn, f: (x) => pct(x.bumn), num: true, est: true },
    { k: "s", l: "st.gol.swasta", v: (x) => x.swasta, f: (x) => pct(x.swasta), num: true, est: true },
    { k: "a", l: "st.gol.asing", v: (x) => x.asing, f: (x) => pct(x.asing), num: true, est: true },
  ], [...K].reverse(), 5);
  return ex("pangsa", "grafik", "pangsa", {
    judul: hlHtml("st.pangsa.judul", n0(z.bumn), { dari: n0(a.bumn), a: a.tahun, z: z.tahun }),
    isi: garisTip(th, seri, { d: 1, satuan: "%", label: t("st.pangsa.grafik") }) + bantu("st.pangsa.catatan") + tab + kesimpulan(t("st.pangsa.kes", { asing: pct(z.asing, 0), swasta: pct(z.swasta, 0) })),
    sumber: src("proyek"), csv: true,
  });
}
function ePemain() {
  const P = A.kons.pemain, t1 = P[0];
  const grafik = batang(P.slice(0, 8).map((x, i) => ({ label: x.nama, v: x.baru + x.pipeline, teks: `${n0(x.baru)} + ${n0(x.pipeline)} MW`, sorot: i === 0 })), { label: t("st.pemain.grafik") });
  const tab = daftarTabel("pemain", [
    { k: "n", l: "st.c.pemain1", v: (x) => x.nama, f: (x) => esc(x.nama) },
    { k: "g", l: "st.c.golongan", v: (x) => x.gol, f: (x) => esc(t("st.gol." + x.gol)) },
    { k: "d", l: "st.c.mw_dasar", v: (x) => x.dasar, f: (x) => n0(x.dasar), num: true },
    { k: "b", l: "st.c.mw_baru", v: (x) => x.baru, f: (x) => n0(x.baru), num: true },
    { k: "l", l: "st.c.laju_tumbuh", v: (x) => x.laju, f: (x) => (x.laju == null ? "-" : pct(x.laju, 0)), num: true, est: true },
    { k: "p", l: "st.c.pipeline", v: (x) => x.pipeline, f: (x) => n0(x.pipeline), num: true },
  ], P, 8);
  return ex("pemain", "orang", "pemain", {
    judul: hlHtml("st.pemain.judul", n0(P.length), { nama: t1.nama }),
    isi: grafik + bantu("st.pemain.catatan") + tab + kesimpulan(t("st.pemain.kes", { nama: t1.nama, gol: t("st.gol." + t1.gol) })),
    sumber: src("proyek"), csv: true,
  });
}

/* ---------- 5. arus uang ---------- */
function eAlokasi() {
  const U = A.uang, t1 = U.tek[0];
  const grafik = dumbbell(U.tek.map((x, i) => ({ label: tekL(x.tek), a: x.pangsa_mw, b: x.pangsa_dana, tekA: pct(x.pangsa_mw), tekB: pct(x.pangsa_dana), sorot: i === 0 })), { kepA: t("st.uang.k_mw"), kepB: t("st.uang.k_dana"), d: 1, label: t("st.uang.grafik") });
  const tab = daftarTabel("alokasi", [
    { k: "n", l: "st.c.teknologi", v: (x) => tekL(x.tek), f: (x) => esc(tekL(x.tek)) },
    { k: "m", l: "st.c.mw_ruptl", v: (x) => x.mw_ruptl, f: (x) => n0(x.mw_ruptl), num: true },
    { k: "a", l: "st.c.pangsa_mw", v: (x) => x.pangsa_mw, f: (x) => pct(x.pangsa_mw), num: true, est: true },
    { k: "u", l: "st.c.dana_publik", v: (x) => x.publik_usd, f: (x) => usd(x.publik_usd), num: true },
    { k: "b", l: "st.c.pangsa_dana", v: (x) => x.pangsa_dana, f: (x) => pct(x.pangsa_dana), num: true, est: true },
    { k: "e", l: "st.c.dana_mw", v: (x) => x.usd_per_mw, f: (x) => usd(x.usd_per_mw), num: true, est: true },
    { k: "c", l: "st.c.celah", v: (x) => x.celah_usd, f: (x) => (x.celah_usd >= 0 ? "+" : "-") + usd(Math.abs(x.celah_usd)), num: true, est: true },
    { k: "r", l: "st.c.rasio", v: (x) => x.rasio, f: (x) => n2(x.rasio), num: true, est: true },
  ], U.tek, 5);
  return ex("alokasi", "kartu", "alokasi", {
    judul: hlHtml("st.uang.judul", usd(t1.celah_usd), { tek: tekL(t1.tek), mw: pct(t1.pangsa_mw), dana: pct(t1.pangsa_dana) }),
    isi: grafik + bantu("st.uang.catatan", { a: U.awal_publik, z: U.akhir_publik, camp: usd(U.campuran_usd), jetp: usd(U.jetp_usd) }) + tab + kesimpulan(t("st.uang.kes", { tek: tekL(t1.tek), total: usd(U.celah_total_usd) })),
    sumber: src("publik", "ruptl", "dana"), csv: true,
  });
}
function eTahunan() {
  const S = A.uang.seri, th = S.map((x) => String(x.tahun)), puncak = S.reduce((m, x) => (x.iati_usd > m.iati_usd ? x : m), S[0]);
  const seri = [{ nama: t("st.tahunan.s_iati"), sorot: true, v: S.map((x) => x.iati_usd / 1e9) }, { nama: t("st.tahunan.s_publik"), v: S.map((x) => (x.publik_usd ? x.publik_usd / 1e9 : null)) }];
  const tab = daftarTabel("tahunan", [
    { k: "y", l: "st.c.tahun", v: (x) => x.tahun, f: (x) => x.tahun, num: true },
    { k: "n", l: "st.c.aktivitas", v: (x) => x.n, f: (x) => n0(x.n), num: true },
    { k: "i", l: "st.c.iati", v: (x) => x.iati_usd, f: (x) => usd(x.iati_usd), num: true },
    { k: "p", l: "st.c.dana_publik", v: (x) => x.publik_usd, f: (x) => (x.publik_usd ? usd(x.publik_usd) : "-"), num: true },
  ], [...S].reverse(), 6);
  return ex("tahunan", "linimasa", "tahunan", {
    judul: hlHtml("st.tahunan.judul", usd(A.uang.iati_usd), { tahun: puncak.tahun, n: n0(S.reduce((s, x) => s + x.n, 0)) }),
    isi: garisTip(th, seri, { d: 1, satuan: "", label: t("st.tahunan.grafik") }) + bantu("st.tahunan.catatan") + tab,
    sumber: src("iati", "publik"), csv: true,
  });
}
function eProvDana() {
  const P = A.uang.provinsi;
  const tab = daftarTabel("provdana", [
    { k: "p", l: "st.c.provinsi", v: (x) => x.prov, f: (x) => esc(x.prov) },
    { k: "n", l: "st.c.proyek_dana", v: (x) => x.n, f: (x) => n0(x.n), num: true },
    { k: "m", l: "st.c.mw", v: (x) => x.mw, f: (x) => n0(x.mw), num: true },
    { k: "u", l: "st.c.nilai_dana", v: (x) => x.usd, f: (x) => (x.usd ? usd(x.usd) : "-"), num: true },
  ], P, 8);
  return ex("provdana", "wilayah", "provdana", {
    judul: hlHtml("st.provdana.judul", n0(P.length), { total: n0(D.peluang.baris.length) }),
    isi: bantu("st.provdana.catatan") + tab,
    sumber: src("dana", "proyek"), csv: true,
  });
}

/* ---------- 6. sinyal pasar ---------- */
const bln = (m) => { const [y, b] = m.split("-"); return `${t("st.bln." + Number(b))} ${String(y).slice(2)}`; };
function eMomentum() {
  const S = A.sinyal, M = S.momentum, t1 = M[0];
  const grafik = dumbbell(M.map((x, i) => ({ label: tekL(x.tek), a: x.awal, b: x.akhir, tekA: pct(x.awal), tekB: pct(x.akhir), sorot: i === 0 })), { kepA: S.jendela.awal.map(bln).join(", "), kepB: S.jendela.akhir.map(bln).join(", "), d: 1, label: t("st.mom.grafik") });
  const tab = daftarTabel("mom", [
    { k: "n", l: "st.c.teknologi", v: (x) => tekL(x.tek), f: (x) => esc(tekL(x.tek)) },
    { k: "a", l: "st.c.pangsa_awal", v: (x) => x.awal, f: (x) => pct(x.awal), num: true, est: true },
    { k: "b", l: "st.c.pangsa_akhir", v: (x) => x.akhir, f: (x) => pct(x.akhir), num: true, est: true },
    { k: "s", l: "st.c.selisih_poin", v: (x) => x.selisih, f: (x) => (x.selisih > 0 ? "+" : "") + n1(x.selisih), num: true, est: true },
    { k: "x", l: "st.c.berita_awal", v: (x) => x.n_awal, f: (x) => n0(x.n_awal), num: true },
    { k: "y", l: "st.c.berita_akhir", v: (x) => x.n_akhir, f: (x) => n0(x.n_akhir), num: true },
  ], M, 5);
  return ex("mom", "berita", "mom", {
    judul: hlHtml("st.mom.judul", tekL(t1.tek), { selisih: n1(Math.abs(t1.selisih)), arah: t("st.mom.arah_" + (t1.selisih >= 0 ? "naik" : "turun")) }),
    isi: grafik + bantu("st.mom.catatan", { a: S.jendela.awal.map(bln).join(", "), z: S.jendela.akhir.map(bln).join(", ") }) + tab + kesimpulan(t("st.mom.kes", { tek: tekL(t1.tek) })),
    sumber: src("berita"), csv: true,
  });
}
function eBulanan() {
  const S = A.sinyal, TK = ["surya", "panas-bumi", "penyimpanan", "bioenergi", "bayu", "hidro", "sampah"], KLS = ["jm-st-t1", "jm-st-t2", "jm-st-t3", "jm-st-t4", "jm-st-t5", "jm-st-t6", "jm-st-t7"];
  const bulan = S.per_bulan.filter((x) => x.n >= 5);
  const items = bulan.map((x) => ({ label: bln(x.bulan), bagian: TK.map((k, i) => ({ v: x.tek[k] || 0, kls: KLS[i], tip: `${bln(x.bulan)}, ${tekL(k)}: ${n0(x.tek[k] || 0)}` })) }));
  const peristiwa = (m, k) => S.peristiwa[m]?.[k] || 0;
  const tab = daftarTabel("bulanan", [
    { k: "b", l: "st.c.bulan", v: (x) => x.bulan, f: (x) => esc(bln(x.bulan) + (x.penuh ? "" : " " + t("st.bln.sebagian"))) },
    { k: "n", l: "st.c.berita", v: (x) => x.n, f: (x) => n0(x.n), num: true },
    { k: "r", l: "st.c.t_resmi", v: (x) => x.topik.resmi, f: (x) => n0(x.topik.resmi), num: true, est: true },
    { k: "p", l: "st.c.t_ppa", v: (x) => x.topik.ppa, f: (x) => n0(x.topik.ppa), num: true, est: true },
    { k: "l", l: "st.c.t_lelang", v: (x) => x.topik.lelang, f: (x) => n0(x.topik.lelang), num: true, est: true },
    { k: "x", l: "st.c.t_batal", v: (x) => x.topik.batal, f: (x) => n0(x.topik.batal), num: true, est: true },
    { k: "v", l: "st.c.peristiwa_v", v: (x) => ["peresmian", "ppa", "lelang"].reduce((s, k) => s + peristiwa(x.bulan, k), 0), f: (x) => n0(["peresmian", "ppa", "lelang"].reduce((s, k) => s + peristiwa(x.bulan, k), 0)), num: true },
  ], [...bulan].reverse(), 6);
  const topikTot = bulan.reduce((s, x) => s + x.topik.resmi + x.topik.ppa + x.topik.lelang + x.topik.batal, 0);
  return ex("bulanan", "kalender", "bulanan", {
    judul: hlHtml("st.bulanan.judul", n0(S.n_berita), { n: n0(topikTot), batal: n0(S.n_batal_proyek) }),
    isi: legenda(TK.map((k, i) => [`t${i + 1}`, "st.tn." + k])) + kolomTumpuk(items, { label: t("st.bulanan.grafik") }) + bantu("st.bulanan.catatan", { tgl: tanggal(S.terakhir) }) + tab,
    sumber: src("berita", "peristiwa"), csv: true,
  });
}

/* ---------- 7. ringkasan dan metode ---------- */
function paramTemuan(f) {
  const p = { ...f.param };
  for (const k of Object.keys(p)) {
    if (k === "tek") p[k] = tekL(p[k]);
    else if (typeof p[k] === "number") p[k] = Math.abs(p[k]) >= 1e6 ? usd(p[k]) : Number.isInteger(p[k]) && p[k] > 1900 && p[k] < 2200 ? String(p[k]) : num(p[k], Math.abs(p[k]) < 100 && !Number.isInteger(p[k]) ? 1 : 0);
  }
  if (f.id === "bauran") { p.tren = n2(f.param.tren); p.real = pct(f.param.real); p.target = pct(f.param.target); }
  if (f.id === "bumn") { p.dari = pct(f.param.dari, 0); p.ke = pct(f.param.ke, 0); }
  if (f.id === "celah_dana") { p.pangsa_mw = pct(f.param.pangsa_mw); p.pangsa_dana = pct(f.param.pangsa_dana); p.celah = usd(f.param.celah); p.total = usd(f.param.total); }
  if (f.id === "hhi") p.pangsa = pct(f.param.pangsa, 0);
  if (f.id === "momentum") { p.selisih = n1(f.param.selisih); p.akhir = pct(f.param.akhir); }
  if (f.id === "sel_unggul" || f.id === "prov_unggul") p.skor = n1(f.param.skor);
  if (f.id === "cod") p.total = n0(f.param.total);
  return p;
}
function eRingkasan() {
  const li = A.temuan.map((f, i) => `<li><a class="jm-st-tf" href="#${f.bagian === "kesenjangan" ? "kesenjangan" : f.bagian}"><span class="jm-st-no">${i + 1}</span><span class="jm-st-ft">${esc(t("st.f." + f.id, paramTemuan(f)))}</span><span class="jm-st-ke">${esc(t("st.g." + f.bagian + "_p"))}</span></a></li>`).join("");
  return exHtml({
    id: "ringkasan", ikon: "kajian", topik: t("st.ring.ey"), judulHtml: hlHtml("st.ring.judul", String(A.temuan.length)),
    subHtml: esc(t("st.ring.sub")) + EST(), aksiHtml: aksiHtml({ csv: false }) + src("target", "ruptl", "proyek", "peluang", "berita"),
    isiHtml: `<ol class="jm-st-temuan">${li}</ol>${bantu("st.ring.catatan", { tgl: tanggal(D.target.meta.diperbarui, { gaya: "panjang" }) })}<p><button type="button" class="jm-tbl" data-aksi="cetak">${ikon("pdf", 18)}<span>${esc(t("st.ring.cetak"))}</span></button></p>`,
  });
}
function eMetode() {
  const m = ["kesenjangan", "peta", "radar", "konsentrasi", "uang", "sinyal"];
  const li = m.map((k) => `<li><h3 class="jm-st-h3">${esc(t("st.g." + k))}</h3><p>${esc(t("st.m." + k + ".rumus"))}</p><p class="jm-bantu">${esc(t("st.m." + k + ".batas"))}</p></li>`).join("");
  const bobot = Object.entries(H.BOBOT_PETA).map(([k, v]) => `<li><b>${esc(t("st.kn." + k))}</b> ${v}</li>`).join("");
  return ex("metode", "metode", "metode", {
    judul: esc(t("st.metode.judul")),
    isi: `<ul class="jm-st-metode">${li}</ul><h3 class="jm-st-h3">${esc(t("st.m.bobot"))}</h3><ul class="jm-st-bobot">${bobot}</ul><h3 class="jm-st-h3">${esc(t("st.m.celah"))}</h3><ul class="jm-st-daftar">${["konflik", "kebutuhan", "pemilik", "berita", "mikro", "atap"].map((x) => `<li>${ikon("peringatan", 16)}<span>${esc(t("st.m.celah_" + x))}</span></li>`).join("")}</ul>${bantu("st.m.katalog")}${bantu("st.m.ulang")}`,
    sumber: src("target", "ruptl", "proyek", "peluang", "tren", "dana", "iati", "publik", "indeks", "berita", "peristiwa", "rued", "transisi"),
  });
}

/* ---------- rakit halaman ---------- */
function ubin() {
  const K = A.kes, ru = K.kapasitas.find((x) => x.id === "ruptl-2034-kapasitas"), b34 = K.bauran.find((x) => x.id === "ruptl-2034"), top = A.peta.top[0];
  khSisi(".jm-kh", { ubin: [
    { ikon: "kompas", nilai: n1(ru.kali) + "x", label: t("st.u1") },
    { ikon: "linimasa", nilai: String(b34.tahun_capai ?? "-"), label: t("st.u2", { target: pct(b34.target), tahun: b34.tahun }) },
    { ikon: "peringatan", nilai: n0(A.radar.per.tinggi.n), label: t("st.u3", { total: n0(A.radar.baris.length) }) },
    { ikon: "peta", nilai: n0(top.skor), label: t("st.u4", { prov: top.prov, tek: tekL(top.tek) }) },
  ] });
}
function gambar() {
  bersihTabel();
  $("jawab").textContent = t("st.lead");
  ubin();
  const nav = [["ringkasan", "kajian"], ["kesenjangan", "kompas"], ["peta", "peta"], ["radar", "peringatan"], ["konsentrasi", "tingkat"], ["uang", "kartu"], ["sinyal", "berita"], ["metode", "metode"]];
  $("isi").innerHTML = `<nav class="jm-st-nav" aria-label="${esc(t("st.nav"))}">${tabTautan(nav.map(([k, ik]) => ({ href: "#" + k, ikon: ik, label: t("st.n." + k) })))}</nav>
    ${eRingkasan()}
    ${grup("kesenjangan", "kompas", [eBauran(), eKapasitas(), eTek()])}
    ${grup("peta", "peta", [ePeta()])}
    ${grup("radar", "peringatan", [eRadar()])}
    ${grup("konsentrasi", "tingkat", [eHhi(), ePangsa(), ePemain()])}
    ${grup("uang", "kartu", [eAlokasi(), eTahunan(), eProvDana()])}
    ${grup("sinyal", "berita", [eMomentum(), eBulanan()])}
    ${eMetode()}`;
  rinciSel();
  rinciProyek();
}
function ulangMatriks() { $("stMatriks").innerHTML = matriks(); }
function pasang() {
  pasangTabel();
  document.addEventListener("click", (e) => {
    const u = e.target.closest("[data-urutpeta]");
    if (u) {
      const k = u.dataset.urutpeta;
      ST.urutPeta = ST.urutPeta.k === k ? { k, arah: -ST.urutPeta.arah } : { k, arah: k === "nama" ? 1 : -1 };
      for (const th of $("stMatriks").querySelectorAll("th[aria-sort]")) th.setAttribute("aria-sort", "none");
      u.closest("th").setAttribute("aria-sort", ST.urutPeta.arah > 0 ? "ascending" : "descending");
      nanti(ulangMatriks);
      return;
    }
    const s = e.target.closest("button[data-sel]");
    if (s) {
      for (const x of document.querySelectorAll("button.jm-st-sel.pilih")) { x.classList.remove("pilih"); x.setAttribute("aria-pressed", "false"); }
      s.classList.add("pilih"); s.setAttribute("aria-pressed", "true");
      ST.sel = s.dataset.sel;
      nanti(() => { rinciSel(); $("stRinci").scrollIntoView({ block: "nearest" }); });
      return;
    }
    const pr = e.target.closest("button[data-proyek]");
    if (pr) { ST.proyek = pr.dataset.proyek; nanti(() => { rinciProyek(); $("stProyek").scrollIntoView({ block: "nearest", behavior: "auto" }); }); return; }
    const sg = e.target.closest('[data-seg="tingkat"] button[data-v]');
    if (sg && ST.tingkat !== sg.dataset.v) {
      for (const x of sg.parentElement.children) x.setAttribute("aria-selected", String(x === sg));
      ST.tingkat = sg.dataset.v;
      nanti(() => ubahBaris("radar", barisRadar()));
      return;
    }
    if (e.target.closest('[data-aksi="cetak"]')) window.print();
  });
  document.addEventListener("jm:csv", (e) => {
    if (e.target.id !== "matriks" || e.detail.baris) return;
    e.detail.baris = [[t("st.c.provinsi"), ...H.TEK.map(tekL), t("st.c.rata")], ...urutProv().map((p) => [p.nama, ...H.TEK.map((k) => A.peta.sel[p.kode + "|" + k].skor ?? ""), A.peta.baris.find((b) => b.kode === p.kode).rata ?? ""])];
  }, true);
}
async function mulai() {
  await mulaiHalaman();
  $("isi").innerHTML = hantuHtml(4);
  try {
    const nama = { target: "target", ruptl: "ruptl", proyek: "proyek", peluang: "peluang", kapasitas_tren: "kapasitas_tren", pendanaan: "pendanaan", pendanaan_int: "pendanaan_internasional", jetp: "jetp_cipp", keuangan_hijau: "keuangan_hijau", indeks: "indeks", berita: "berita", peristiwa: "peristiwa_ebt", rued: "rued", transisi: "transisi" };
    const hasil = await Promise.all(Object.values(nama).map((n) => muatData(n + ".json")));
    Object.keys(nama).forEach((k, i) => (D[k] = hasil[i]));
    REF = { tahun: Number(D.target.meta.diperbarui.slice(0, 4)) };
    A = H.analisis(D, REF);
  } catch (e) { tampilGalat($("isi"), mulai); return; }
  gambar();
  pasang();
  saatBahasa(gambar);
}
mulai();
