/* /transisi: halaman informasi target dan skenario, kesehatan sistem kelistrikan, dan karbon. Hanya data yang ada + olahan (turunan berpil EST).
   Sumber: target.json, transisi.json (neraca daya RUPTL), ember_bulanan.json, statistik_pln.json, ruptl.json, karbon.json, karbon_proyek.json, program_analisis.json.
   INP: kontrol (segmen, urut, halaman) mengubah chrome seketika; isi menyusul lewat nanti(). Tanpa kalkulator: tidak ada masukan angka dari pengguna. */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, ada, bahasa, tanggal } from "/i18n.js";
import { esc, nanti, ikon, hantuHtml } from "/inti/umum.js";
import { exHtml, tabTautan, lihatSemuaHtml, unduhRegHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { paginasiHtml } from "/inti/paginasi.js";
import { khSisi } from "/inti/kh.js";
import { sumberLipat, pil, num, saatBahasa, tampilGalat, muatData, ubinHtml } from "/analisis.js";
import { kolom, batang, dumbbell } from "/grafik.js";
import { pilStatus } from "/inti/ikon_tek.js";
import { geoProvinsi, jalurPerProvinsi } from "/inti/peta_indonesia.js";
import { geserPanel } from "/inti/panel_geser.js";
import * as H from "/transisi_hitung.js";

const $ = (id) => document.getElementById(id);
const D = {};
const ST = { segmen: "rm", sistem: "jawa-bali", bursa: "volume" };
const TB = new Map();
const L = (o) => (o && (o[bahasa()] ?? o.id)) ?? "";
const mw = (v, d = 0) => (v == null ? "-" : num(v, d));
const pct = (v, d = 1) => (v == null ? "-" : num(v, d) + "%");
const rp = (v) => "Rp" + num(v);
const jml = (a) => a.reduce((s, x) => s + (x || 0), 0);

/* ---------- sumber ---------- */
const src = (kunci, tgl, url, halaman) => sumberLipat([{ sumber: t(kunci), halaman, url, tanggal: tgl }]);
const srcTarget = (id, halaman) => { const s = D.target.sumber.find((x) => x.id === id); return sumberLipat([{ sumber: s.judul, halaman, url: s.url, tahun: s.tahun, tanggal: D.target.meta.diperbarui }]); };
const srcRuptl = (tabel) => { const s = D.tr.sumber[0]; return sumberLipat([{ sumber: s.judul, halaman: tabel, url: s.url, tahun: s.tahun, tanggal: D.tr.dibangun_pada }]); };
const srcEmber = () => { const s = D.ember.sumber[0]; return sumberLipat([{ sumber: s.judul, url: s.url, tahun: s.tahun, tanggal: D.ember.meta.diperbarui }]); };
const srcKarbon = (id) => { const s = D.karbon.sumber.find((x) => x.id === id); return sumberLipat([{ sumber: s.judul, url: s.url, tahun: s.tahun, tanggal: D.karbon.dibangun_pada }]); };
const srcStat = () => sumberLipat([{ sumber: D.stat.sumber, url: D.stat.url, tahun: D.stat.tahun, tanggal: D.stat.tanggal_ambil }]);

/* ---------- tabel urut + paginasi bernomor (data penuh diurutkan sendiri) ---------- */
function daftarTabel(id, kols, baris, per = 8, csvNama = "") {
  TB.set(id, { kols, baris, per, hal: 1, urut: null, csvNama });
  return `<div class="jm-tr-tb" id="tb-${id}" data-tb="${id}">${isiTabel(id)}</div>`;
}
function isiTabel(id) {
  const s = TB.get(id);
  let b = s.baris;
  if (s.urut) {
    const k = s.kols.find((c) => c.k === s.urut.k);
    b = [...b].sort((x, z) => { const a = k.v(x), c = k.v(z); return ((a == null) - (c == null)) || (a == null ? 0 : (typeof a === "number" ? a - c : String(a).localeCompare(String(c), bahasa()))) * s.urut.arah; });
  }
  const dari = (s.hal - 1) * s.per;
  const kep = s.kols.map((c) => `<th${c.num ? ' class="jm-num"' : ""} aria-sort="${s.urut?.k === c.k ? (s.urut.arah > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-urut="${esc(c.k)}">${esc(t(c.l))}${c.est ? " " + pil("an.est") : ""}</button></th>`).join("");
  const isi = b.slice(dari, dari + s.per).map((r) => `<tr>${s.kols.map((c) => `<td data-label="${esc(t(c.l))}"${c.num ? ' class="jm-num"' : ""}>${c.f(r)}</td>`).join("")}</tr>`).join("");
  return `<div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr>${kep}</tr></thead><tbody>${isi}</tbody></table></div>${paginasiHtml({ hal: s.hal, total: b.length, per: s.per, satuan: "tr.u.baris" })}`;
}
function csvTabel(id) {
  const s = TB.get(id);
  const el = (h) => { const d = document.createElement("div"); d.innerHTML = h; return d.textContent.replace(/\s+/g, " ").trim(); };
  return [s.kols.map((c) => t(c.l)), ...s.baris.map((r) => s.kols.map((c) => el(c.f(r))))];
}
function pasangTabel() {
  document.addEventListener("click", (e) => {
    const w = e.target.closest("[data-tb]");
    if (!w) return;
    const s = TB.get(w.dataset.tb);
    const u = e.target.closest("button[data-urut]");
    const h = e.target.closest("button[data-hal]");
    if (u) {
      const th = u.parentElement;
      s.urut = s.urut?.k === u.dataset.urut ? { k: s.urut.k, arah: -s.urut.arah } : { k: u.dataset.urut, arah: 1 };
      s.hal = 1;
      for (const x of w.querySelectorAll("th")) x.setAttribute("aria-sort", "none");
      th.setAttribute("aria-sort", s.urut.arah > 0 ? "ascending" : "descending");
    } else if (h && !h.disabled) {
      s.hal = +h.dataset.hal;
      for (const b of w.querySelectorAll(".jm-pag-b")) b.classList.toggle("on", b.dataset.hal === h.dataset.hal && !/[‹›]/.test(b.textContent));
    } else return;
    nanti(() => { const y = scrollY; w.innerHTML = isiTabel(w.dataset.tb); if (h) w.scrollIntoView({ block: "nearest" }); else scrollTo(scrollX, y); });
  });
  document.addEventListener("jm:csv", (e) => {
    const w = e.target.querySelector?.("[data-tb]");
    if (w && e.target.classList.contains("jm-ex")) e.detail.baris = csvTabel(w.dataset.tb);
  }, true);
}

/* ---------- eksibit ---------- */
const ex = (id, ik, kunci, { judul, sub = "", isi, sumber = "", csv = false, kaki = "" }) =>
  exHtml({ id, ikon: ik, topik: t(`tr.${kunci}.ey`), judulHtml: judul, subHtml: sub ? esc(sub) : esc(t(`tr.${kunci}.sub`)), aksiHtml: aksiHtml({ csv }) + sumber, isiHtml: isi, kakiHtml: kaki });
const tulis = (id, html) => { $(id).innerHTML = html; };
const EST = () => " " + pil("an.est");
const seg = (nama, opsi, aktif) => `<div class="jm-tab" role="tablist" aria-label="${esc(t("tr.metrik"))}" data-seg="${nama}">${opsi.map(([v, l, ik]) => `<button type="button" role="tab" data-v="${v}" aria-selected="${v === aktif}">${ikon(ik, 18)}<span>${esc(t(l))}</span></button>`).join("")}</div>`;

/* garis dengan titik bertooltip (grafik.js hanya memberi tooltip bila titik <= 16) */
function garisTip(labels, seri, { d = 0, satuan = "", label = "" } = {}) {
  const M = innerWidth < 640, W = M ? 420 : 680, H = M ? 250 : 230, Lk = 40, Rk = M ? 100 : 122, T = 14, B = H - 28, n = labels.length, fs = M ? 13 : 11.5;
  const mx = Math.max(1, ...seri.flatMap((s) => s.v.filter((x) => x != null))) * 1.1;
  const X = (i) => Lk + (n > 1 ? (i / (n - 1)) * (W - Lk - Rk) : 0), Y = (v) => B - (v / mx) * (B - T);
  const f = (v) => num(v, d);
  let g = [0, 1 / 3, 2 / 3, 1].map((q) => `<line class="jm-gf-grid" x1="${Lk}" x2="${W - Rk}" y1="${Y(mx * q).toFixed(1)}" y2="${Y(mx * q).toFixed(1)}"/><text class="jm-gf-t2" x="${Lk - 6}" y="${(Y(mx * q) + 4).toFixed(1)}" text-anchor="end" font-size="${fs - 1}">${esc(f(mx * q))}</text>`).join("");
  const langkah = Math.max(1, Math.ceil(n / (M ? 5 : 8)));
  g += labels.map((l, i) => ((i % langkah === 0 && n - 1 - i >= langkah) || i === n - 1 ? `<text class="jm-gf-t2" x="${X(i).toFixed(1)}" y="${B + 16}" text-anchor="${i === n - 1 ? "end" : "middle"}" font-size="${fs}">${esc(l)}</text>` : "")).join("");
  const ujung = [];
  for (const s of [...seri].sort((a, b) => !!a.sorot - !!b.sorot)) {
    const p = s.v.map((v, i) => (v == null ? null : [X(i), Y(v), v, i])).filter(Boolean);
    if (!p.length) continue;
    const z = p.at(-1);
    g += `<polyline class="jm-gf-gar ${s.sorot ? "jm-gf-sorot-g" : "jm-gf-gar-abu"}${s.putus ? " jm-tr-putus" : ""}" points="${p.map((q) => q[0].toFixed(1) + "," + q[1].toFixed(1)).join(" ")}"/>`;
    g += p.map((q) => `<circle class="jm-tr-hit${s.sorot ? " jm-tr-hit-s" : ""}" cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${M ? 8 : 5}"><title>${esc(s.nama)}, ${esc(labels[q[3]])}: ${esc(f(q[2]) + satuan)}</title></circle>`).join("");
    ujung.push({ y: z[1], x: z[0], on: !!s.sorot, teks: `${s.nama} ${f(z[2])}${satuan}` });
  }
  ujung.sort((a, b) => a.y - b.y);
  for (let i = 1; i < ujung.length; i++) if (ujung[i].y - ujung[i - 1].y < fs + 3) ujung[i].y = ujung[i - 1].y + fs + 3;
  g += ujung.map((u) => `<text class="jm-gf-t1${u.on ? " jm-gf-tb" : ""}" x="${(u.x + 8).toFixed(1)}" y="${(u.y + 4).toFixed(1)}" font-size="${fs - 1}">${esc(u.teks)}</text>`).join("");
  return `<svg class="jm-gf" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}" focusable="false">${g}</svg>`;
}

/* kolom divergen: tiap tahun dua efek (EBT naik, permintaan naik) di atas/bawah nol, titik = selisih bersih */
function divergen(rows, { label = "" } = {}) {
  const M = innerWidth < 640, W = M ? 420 : 680, H = M ? 260 : 240, Lk = 40, Rk = 10, T = 16, B = H - 28, fs = M ? 13 : 11.5, n = rows.length;
  const atas = Math.max(0.5, ...rows.map((r) => Math.max(r.efek_ebt, 0) + Math.max(r.efek_permintaan, 0))), bawah = Math.max(0.5, ...rows.map((r) => Math.abs(Math.min(r.efek_ebt, 0)) + Math.abs(Math.min(r.efek_permintaan, 0))));
  const Y = (v) => T + ((atas - v) / (atas + bawah)) * (B - T), gap = (W - Lk - Rk) / n, bw = gap * 0.6;
  let g = [-bawah, 0, atas].map((v) => `<line class="jm-gf-grid" x1="${Lk}" x2="${W - Rk}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text class="jm-gf-t2" x="${Lk - 6}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end" font-size="${fs - 1}">${esc(num(v, 1))}</text>`).join("");
  g += `<line class="jm-tr-nol" x1="${Lk}" x2="${W - Rk}" y1="${Y(0).toFixed(1)}" y2="${Y(0).toFixed(1)}"/>`;
  rows.forEach((r, i) => {
    const x = Lk + i * gap + (gap - bw) / 2;
    let pos = 0, neg = 0;
    for (const [v, kls, kunci] of [[r.efek_ebt, "jm-gf-sorot", "tr.dk.efek_ebt"], [r.efek_permintaan, "jm-gf-b", "tr.dk.efek_perm"]]) {
      const y0 = v >= 0 ? pos : neg, y1 = y0 + v;
      if (v >= 0) pos = y1; else neg = y1;
      g += `<rect class="${kls}" x="${x.toFixed(1)}" y="${Y(Math.max(y0, y1)).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, Math.abs(Y(y0) - Y(y1))).toFixed(1)}"><title>${esc(r.tahun + ", " + t(kunci) + ": " + (v > 0 ? "+" : "") + num(v, 2) + " " + t("tr.poin"))}</title></rect>`;
    }
    g += `<circle class="jm-tr-net" cx="${(x + bw / 2).toFixed(1)}" cy="${Y(r.selisih).toFixed(1)}" r="${M ? 5 : 4}"><title>${esc(r.tahun + ", " + t("tr.dk.bersih") + ": " + (r.selisih > 0 ? "+" : "") + num(r.selisih, 2) + " " + t("tr.poin"))}</title></circle>`;
    g += `<text class="jm-gf-t2" x="${(x + bw / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="${fs}">${i % (M ? 2 : 1) === 0 ? r.tahun : ""}</text>`;
  });
  return `<svg class="jm-gf" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}" focusable="false">${g}</svg>`;
}
const legenda = (items) => `<ul class="jm-tr-leg">${items.map(([k, ket]) => `<li><i class="jm-tr-sw jm-tr-sw-${k}" aria-hidden="true"></i>${esc(t(ket))}</li>`).join("")}</ul>`;

/* ---------- olah ---------- */
const sistemNama = (s) => s.nama;
const KALI = (c) => (typeof c.per_tahun_mw === "number" ? c.per_tahun_mw : c.per_tahun_mw?.dasar) / D.target.meta.laju_historis_mw_per_tahun_2015_2024;
function olah() {
  const T = D.target;
  const tg = (id) => T.target.find((x) => x.id === id);
  D.celahBaris = T.celah.filter((c) => c.metode !== "tak-dihitung").map((c) => {
    const g = tg(c.target_id), dok = g.dokumen.startsWith("ruptl") ? "RUPTL" : g.dokumen.startsWith("rukn") ? "RUKN" : "KEN";
    const proksi = typeof c.per_tahun_mw === "object";
    const per = proksi ? c.per_tahun_mw.dasar : c.per_tahun_mw;
    const awal = c.tahun_awal ?? T.meta.tahun_dasar, akhir = g.tahun_target ?? c.tahun_target;
    return { id: c.target_id, nama: `${dok} ${akhir}`, jenis: g.ukuran.includes("bauran") ? "bauran" : "kapasitas", awal, akhir, per, lo: proksi ? c.per_tahun_mw.tinggi : null, hi: proksi ? c.per_tahun_mw.rendah : null, kali: per / T.meta.laju_historis_mw_per_tahun_2015_2024, proksi, doc: g.dokumen, halaman: g.halaman };
  }).sort((a, b) => a.akhir - b.akhir || a.nama.localeCompare(b.nama));
  D.tambah = H.tambahanTahunan(T.kapasitas_ebt);
  D.laju = H.lajuRata(T.kapasitas_ebt);
  D.dekomp = H.dekomposisiBauran(T.realisasi.pembangkitan_ebt_persen);
  D.rukn = tg("rukn-2025-pembangkitan").seri;
  D.real = Object.fromEntries(T.realisasi.pembangkitan_ebt_persen.map((r) => [r.tahun, r.nilai]));
  D.sis = D.tr.sistem.map((s) => ({
    ...s, nama_penuh: s.nama, nama: s.id === "sumatera" ? "Sumatera" : s.nama, n0: s.beban_puncak_neto_mw[0], n9: s.beban_puncak_neto_mw[9], cagr: H.cagr(s.beban_puncak_neto_mw[0], s.beban_puncak_neto_mw[9], 9),
    rm0: s.reserve_margin_persen[0], rm9: s.reserve_margin_persen[9], ebt0: s.bauran_ebt_persen[0], ebt9: s.bauran_ebt_persen[9], bb9: s.bauran_batubara_persen[9],
    e0: H.intensitasEmisi(s, 0), e9: H.intensitasEmisi(s, 9),
  }));
  D.sisById = Object.fromEntries(D.sis.map((s) => [s.id, s]));
  D.provSis = Object.fromEntries(D.sis.flatMap((s) => s.provinsi.map((k) => [k, s.id])));
}

/* ---------- A. target dan skenario ---------- */
function tCelah() {
  const r = D.celahBaris, utama = r.find((x) => x.id === "ruptl-2034-kapasitas");
  const lbl = (x) => `${x.nama} ${t("tr.jenis." + x.jenis)}${x.proksi ? " " + t("tr.proksi") : ""}`;
  const pendek = (x) => x.nama;
  const chart = batang(r.map((x) => ({ label: pendek(x), v: x.per, teks: mw(x.per), sorot: x === utama })), { ref: D.target.meta.laju_historis_mw_per_tahun_2015_2024, teksRef: num(D.target.meta.laju_historis_mw_per_tahun_2015_2024), label: t("tr.celah.grafik") });
  const tab = daftarTabel("celah", [
    { k: "n", l: "tr.c.target", v: (x) => lbl(x), f: (x) => esc(lbl(x)) },
    { k: "p", l: "tr.c.periode", v: (x) => x.akhir, f: (x) => `${x.awal}-${x.akhir}`, num: true },
    { k: "m", l: "tr.c.per_tahun", v: (x) => x.per, f: (x) => mw(x.per), num: true, est: true },
    { k: "r", l: "tr.c.rentang", v: (x) => x.lo, f: (x) => (x.lo ? `${mw(x.lo)} - ${mw(x.hi)}` : "-"), num: true },
    { k: "k", l: "tr.c.kali", v: (x) => x.kali, f: (x) => num(x.kali, 1) + "x", num: true, est: true },
    { k: "b", l: "tr.c.per_bulan", v: (x) => x.per, f: (x) => mw(x.per / 12), num: true, est: true },
  ], r, 6);
  return ex("celah", "kompas", "celah", {
    judul: hlHtml("tr.celah.judul", num(utama.per), { kali: num(utama.kali, 1) }) + EST(),
    isi: chart + `<p class="jm-bantu">${esc(t("tr.celah.laju", { mw: num(D.target.meta.laju_historis_mw_per_tahun_2015_2024) }))} ${esc(t("tr.celah.catatan"))}</p>` + tab, sumber: srcTarget("ruptl-2025", "target.json celah") + srcTarget("rukn-2025", "Tabel 8 hlm 177"), csv: true,
    kaki: lihatSemuaHtml("/program", t("tr.lihat.program")),
  });
}
function tTambah() {
  const a = D.tambah, rata = D.laju;
  const items = a.map((x) => ({ label: String(x.tahun), v: x.total, sorot: x.tahun === a.at(-1).tahun, tip: `${x.tahun}: ${num(x.total, 0)} MW (${num(x.bulanan, 0)} MW ${t("tr.per_bulan")})${x.beda_seri ? ", " + t("tr.beda_seri") : ""}` }));
  const tab = daftarTabel("tambah", [
    { k: "y", l: "tr.c.tahun", v: (x) => x.tahun, f: (x) => x.tahun, num: true },
    { k: "t", l: "tr.c.total", v: (x) => x.total, f: (x) => mw(x.total), num: true },
    { k: "b", l: "tr.c.per_bulan", v: (x) => x.bulanan, f: (x) => mw(x.bulanan), num: true, est: true },
    ...["hidro", "panas_bumi", "surya", "bayu", "bioenergi"].map((k) => ({ k, l: "tr.tek." + k, v: (x) => x.per[k + "_mw"], f: (x) => mw(x.per[k + "_mw"]), num: true })),
  ], [...a].reverse(), 5);
  return ex("tambah", "grafik", "tambah", {
    judul: hlHtml("tr.tambah.judul", num(rata), { bln: num(rata / 12), a: D.target.kapasitas_ebt[0].tahun, z: D.target.kapasitas_ebt.at(-1).tahun }) + EST(),
    isi: kolom(items, { rata, teksRata: t("tr.tambah.rata"), label: t("tr.tambah.grafik") }) + `<p class="jm-bantu">${esc(t("tr.tambah.catatan"))}</p>` + tab,
    sumber: srcTarget("stat-2024", "Tabel 3") + srcTarget("stat-2020", "Tabel 3 hlm 11-12"), csv: true,
  });
}
function tSkenario() {
  const th = Array.from({ length: 46 }, (_, i) => 2015 + i);
  const seri = [
    { nama: t("tr.sk.real"), v: th.map((y) => D.real[y] ?? null) },
    { nama: t("tr.sk.rukn"), v: th.map((y) => D.rukn[y] ?? null), sorot: true },
  ];
  const T = D.target;
  const fx = (v) => num(v, v % 1 ? 1 : 0), nilaiT = (g) => (g.maks != null && g.maks !== g.min ? `${fx(g.min)} - ${fx(g.maks)}` : fx(g.min));
  const sat = (u) => (u.endsWith("persen") ? "%" : u.endsWith("_mw") ? "MW" : u.endsWith("twh") ? "TWh" : "");
  const baris = [
    ...T.target.filter((g) => g.tahun_target && g.min != null && !["ken-2025-ebt-primer", "ken-2050-ebt-primer-lama"].includes(g.id)).map((g) => ({ dok: g.dokumen, tahun: g.tahun_target, uk: g.ukuran, nilai: nilaiT(g), s: sat(g.ukuran), bukti: "resmi", hal: g.halaman })),
    ...[2030, 2040, 2050, 2060].map((y) => ({ dok: "rukn-2025", tahun: y, uk: "bauran_pembangkitan_ebt_persen", nilai: num(D.rukn[y], 1), s: "%", bukti: "resmi", hal: "Tabel 8 hlm 177" })),
    ...D.tr.pembanding_iesr.filter((a) => ["ieto-017", "ieto-018", "ieto-020", "ieto-022", "ieto-031"].includes(a.id)).map((a) => ({ dok: a.sumber_id, tahun: a.tahun_data, uk: a.id, nilai: String(a.nilai), s: a.satuan.replace("persen", "%"), bukti: "kajian", hal: "hlm " + a.halaman, eng: a.label })),
  ];
  const docNama = (d) => (d.startsWith("ken") ? "KEN" : d.startsWith("ruptl") ? "RUPTL" : d.startsWith("rukn") ? "RUKN" : d.startsWith("iesr") ? "IESR" : d);
  const tab = daftarTabel("skenario", [
    { k: "d", l: "tr.c.dokumen", v: (x) => docNama(x.dok), f: (x) => esc(docNama(x.dok)) },
    { k: "y", l: "tr.c.tahun", v: (x) => x.tahun, f: (x) => x.tahun, num: true },
    { k: "u", l: "tr.c.ukuran", v: (x) => x.uk, f: (x) => esc(x.eng ?? (t("tr.uk." + x.uk))) },
    { k: "n", l: "tr.c.nilai", v: (x) => parseFloat(String(x.nilai).replace(/\./g, "").replace(",", ".")), f: (x) => `${esc(x.nilai)} ${esc(x.s)}`, num: true },
    { k: "b", l: "tr.c.bukti", v: (x) => x.bukti, f: (x) => esc(t("tr.bukti." + x.bukti)) },
    { k: "h", l: "tr.c.halaman", v: (x) => x.hal, f: (x) => esc(x.hal || "-") },
  ], baris.sort((a, b) => a.tahun - b.tahun || docNama(a.dok).localeCompare(docNama(b.dok))), 8);
  return ex("skenario", "linimasa", "skenario", {
    judul: hlHtml("tr.sk.judul", num(D.rukn[2060], 1), { y30: num(D.rukn[2030], 1) }),
    isi: garisTip(th.map(String), seri, { d: 1, satuan: "%", label: t("tr.sk.grafik") }) + `<p class="jm-bantu">${esc(t("tr.sk.catatan"))}</p>` + tab,
    sumber: srcTarget("rukn-2025", "Tabel 8 hlm 177") + srcTarget("ken-pp-40-2025", "Pasal 10") + srcTarget("owid-energi"), csv: true,
  });
}
function tRukn() {
  const th = Array.from({ length: 36 }, (_, i) => 2025 + i);
  const baris = th.map((y) => ({ y, rukn: D.rukn[y], real: D.real[y] ?? null, sel: D.real[y] != null ? D.real[y] - D.rukn[y] : null }));
  const tab = daftarTabel("rukn", [
    { k: "y", l: "tr.c.tahun", v: (x) => x.y, f: (x) => x.y, num: true },
    { k: "r", l: "tr.c.rukn", v: (x) => x.rukn, f: (x) => pct(x.rukn), num: true },
    { k: "a", l: "tr.c.real", v: (x) => x.real, f: (x) => pct(x.real), num: true },
    { k: "s", l: "tr.c.selisih", v: (x) => x.sel, f: (x) => (x.sel == null ? "-" : (x.sel > 0 ? "+" : "") + num(x.sel, 1)), num: true, est: true },
  ], baris, 9);
  const t0 = D.target.celah.find((c) => c.target_id === "rukn-2025-pembangkitan");
  return ex("rukn", "regulasi", "rukn", {
    judul: hlHtml("tr.rukn.judul", num(D.rukn[2025], 1), { z: num(D.rukn[2060], 1), tahun_ebt: 2044 }),
    isi: tab, sumber: srcTarget("rukn-2025", "Tabel 8 hlm 177, teks hlm 136"), csv: true,
    kaki: t0 ? `<span class="jm-bantu">${esc(t("tr.rukn.kaki"))}</span>` : "",
  });
}
function tDekomp() {
  const d = D.dekomp, net = d.reduce((s, r) => s + r.selisih, 0), eb = d.reduce((s, r) => s + r.efek_ebt, 0), pm = d.reduce((s, r) => s + r.efek_permintaan, 0);
  const tab = daftarTabel("dekomp", [
    { k: "y", l: "tr.c.tahun", v: (x) => x.tahun, f: (x) => x.tahun, num: true },
    { k: "b", l: "tr.c.bauran", v: (x) => x.bauran, f: (x) => pct(x.bauran, 2), num: true },
    { k: "s", l: "tr.c.selisih_poin", v: (x) => x.selisih, f: (x) => num(x.selisih, 2), num: true, est: true },
    { k: "e", l: "tr.dk.efek_ebt", v: (x) => x.efek_ebt, f: (x) => num(x.efek_ebt, 2), num: true, est: true },
    { k: "p", l: "tr.dk.efek_perm", v: (x) => x.efek_permintaan, f: (x) => num(x.efek_permintaan, 2), num: true, est: true },
  ], [...d].reverse(), 5);
  return ex("dekomp", "insight", "dekomp", {
    judul: hlHtml(net >= 0 ? "tr.dk.judul_naik" : "tr.dk.judul_turun", num(Math.abs(net), 1), { a: d[0].tahun - 1, z: d.at(-1).tahun, e: num(eb, 1), p: num(Math.abs(pm), 1) }) + EST(),
    isi: legenda([["ebt", "tr.dk.efek_ebt"], ["perm", "tr.dk.efek_perm"], ["net", "tr.dk.bersih"]]) + divergen(d, { label: t("tr.dk.grafik") }) + `<p class="jm-bantu">${esc(t("tr.dk.catatan"))}</p>` + tab,
    sumber: srcTarget("owid-energi"), csv: true,
  });
}
function tPapan() {
  const p = D.program.baris.find((b) => b.kode === "plts-100gw"), T = D.target.kapasitas_ebt.at(-1);
  const tg = (k) => +p.target.find((x) => x.label.id.toLowerCase().includes(k))?.angka;
  const rows = [
    { label: t("tr.pl.terpasang", { y: T.tahun }), v: T.surya_mw / 1000, teks: `${num(T.surya_mw / 1000, 2)} GW` },
    { label: t("tr.pl.terlacak"), v: p.proyek_ringkas.kapasitas_mw / 1000, teks: `${num(p.proyek_ringkas.kapasitas_mw / 1000, 1)} GW` },
    { label: t("tr.pl.tahap1"), v: tg("tahap pertama"), teks: `${num(tg("tahap pertama"), 0)} GW`, sorot: true },
    { label: t("tr.pl.koperasi"), v: tg("koperasi"), teks: `${num(tg("koperasi"), 0)} GW` },
    { label: t("tr.pl.target"), v: tg("kapasitas plts"), teks: `${num(tg("kapasitas plts"), 0)} GW` },
  ];
  const tab = daftarTabel("papan", [
    { k: "n", l: "tr.c.proyek", v: (x) => x.nama, f: (x) => esc(x.nama) },
    { k: "p", l: "tr.c.provinsi", v: (x) => x.prov, f: (x) => esc(x.prov) },
    { k: "m", l: "tr.c.kapasitas", v: (x) => x.kap, f: (x) => `${mw(x.kap)} ${esc(x.sat)}`, num: true },
    { k: "s", l: "tr.c.status", v: (x) => x.st, f: (x) => pilStatus(x.st) },
  ], p.proyek, 8);
  const tong = p.tonggak.map((x) => `<li><time>${esc(/^\d{4}-\d{2}-\d{2}$/.test(x.tgl) ? tanggal(x.tgl) : x.tgl)}</time><span>${esc(L(x.peristiwa))}</span><a class="jm-tr-bukti" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer" title="${esc(t("tr.bukti.media"))}">${ikon("tautan", 14)}<span class="sr">${esc(t("tr.bukti.media"))}</span></a></li>`).join("");
  return ex("papan", "tek-surya", "papan", {
    judul: hlHtml("tr.pl.judul", num(tg("kapasitas plts"), 0), { th: p.target.find((x) => x.angka === "100").tahun, n: num(p.proyek_ringkas.jumlah), mw: num(p.proyek_ringkas.kapasitas_mw, 0) }),
    sub: L(p.tahap_ket),
    isi: batang(rows, { label: t("tr.pl.grafik") }) + `<ol class="jm-tr-tonggak">${tong}</ol><p class="jm-bantu">${esc(t("tr.pl.catatan"))}</p>` + tab,
    sumber: sumberLipat([{ sumber: t("tr.src.program"), url: p.target[0].url, tanggal: D.program.dibangun_pada }]) + srcTarget("stat-2024", "Tabel 3"), csv: true,
    kaki: lihatSemuaHtml("/program/plts-100gw", t("tr.lihat.papan")),
  });
}

/* ---------- B. kesehatan sistem ---------- */
const METRIK = {
  rm: { f: (s) => s.rm0, d: 1, sat: "%", kunci: "tr.m.rm" },
  tumbuh: { f: (s) => s.cagr, d: 1, sat: "%", kunci: "tr.m.tumbuh" },
  ebt: { f: (s) => s.ebt9, d: 0, sat: "%", kunci: "tr.m.ebt" },
};
function tPeta() {
  const m = METRIK[ST.segmen], nil = D.sis.map(m.f), kls = H.kelasKuantil(nil, 5);
  D.kelas = Object.fromEntries(D.sis.map((s, i) => [s.id, kls[i]]));
  const ada = D.sis.filter((s) => m.f(s) != null), min = ada.reduce((a, s) => (m.f(s) < m.f(a) ? s : a)), maks = ada.reduce((a, s) => (m.f(s) > m.f(a) ? s : a));
  const opsi = [["rm", "tr.m.rm_p", "perisai"], ["tumbuh", "tr.m.tumbuh_p", "grafik"], ["ebt", "tr.m.ebt_p", "tek-surya"]];
  return ex("peta", "peta", "peta", {
    judul: hlHtml("tr.peta.judul_" + ST.segmen, num(m.f(min), m.d) + "%", { min: min.nama, maks: maks.nama, v2: num(m.f(maks), m.d) + "%" }),
    isi: seg("segmen", opsi, ST.segmen) + `<div class="jm-tr-peta" id="trPeta"><div id="trSvg" class="jm-tr-svg" aria-live="polite">${hantuHtml(3)}</div><aside class="jm-tr-panel" id="trPanel" aria-live="polite"></aside></div>
      <div class="jm-tr-skala" id="trSkala"><span>${esc(num(m.f(min), m.d))}%</span><i class="jm-tr-grad" aria-hidden="true"></i><span>${esc(num(m.f(maks), m.d))}%</span><small>${esc(t("tr.peta.kosong"))}</small></div><p class="jm-bantu">${esc(t("tr.peta.catatan"))}</p>`,
    sumber: srcRuptl("Tabel 5.82-5.122 (RE Base)"),
  });
}
async function petaSvg() {
  const g = await geoProvinsi();
  const el = $("trSvg");
  if (!el || !g) { if (el) el.innerHTML = `<p class="jm-bantu">${esc(t("tr.peta.gagal"))}</p>`; return; }
  const W = 900, Hh = 340;
  D.jalur ??= jalurPerProvinsi(g, W, Hh).filter((j) => j.d);
  const nama = (k) => D.kelas ? D.kelas[D.provSis[k]] ?? -1 : -1;
  el.innerHTML = `<svg viewBox="0 0 ${W} ${Hh}" role="group" aria-label="${esc(t("tr.peta.label"))}" focusable="false">${D.jalur.map((j) => `<path tabindex="0" role="button" class="jm-tr-prov k${nama(j.kode)}${D.provSis[j.kode] === ST.sistem ? " pilih" : ""}" data-k="${esc(j.kode)}" d="${j.d}"><title>${esc(D.provSis[j.kode] ? D.sisById[D.provSis[j.kode]].nama : t("tr.peta.tanpa"))}</title></path>`).join("")}</svg>`;
}
function panelSistem() {
  const s = D.sisById[ST.sistem], el = $("trPanel");
  if (!el || !s) return;
  const baris = (k, v) => `<div><dt>${esc(t(k))}</dt><dd>${v}</dd></div>`;
  el.innerHTML = `<h3 class="jm-tr-ph">${ikon("peta", 16)}<span>${esc(s.nama_penuh)}</span></h3><div class="jm-tr-pb"><dl>
    ${baris("tr.p.puncak", `${mw(s.n0)} - ${mw(s.n9)} MW`)}${baris("tr.p.cagr", pct(s.cagr))}${baris("tr.p.rm", `${pct(s.rm0)} - ${pct(s.rm9)}`)}
    ${baris("tr.p.ebt", `${pct(s.ebt0, 0)} - ${pct(s.ebt9, 0)}`)}${baris("tr.p.batubara", `${pct(s.bauran_batubara_persen[0], 0)} - ${pct(s.bb9, 0)}`)}
    ${baris("tr.p.emisi", s.e0 == null ? "-" : `${num(s.e0, 2)} - ${num(s.e9, 2)}`)}</dl><p class="jm-bantu">${esc(t("tr.p.sumber", { tabel: s.tabel_ruptl }))}</p></div>`;
}
function tSistem() {
  const tab = daftarTabel("sistem", [
    { k: "n", l: "tr.c.sistem", v: (x) => x.nama, f: (x) => esc(x.nama) },
    { k: "a", l: "tr.c.puncak25", v: (x) => x.n0, f: (x) => mw(x.n0), num: true },
    { k: "b", l: "tr.c.puncak34", v: (x) => x.n9, f: (x) => mw(x.n9), num: true },
    { k: "c", l: "tr.c.cagr", v: (x) => x.cagr, f: (x) => pct(x.cagr), num: true, est: true },
    { k: "r", l: "tr.c.rm25", v: (x) => x.rm0, f: (x) => pct(x.rm0), num: true },
    { k: "q", l: "tr.c.rm34", v: (x) => x.rm9, f: (x) => pct(x.rm9), num: true },
    { k: "e", l: "tr.c.ebt34", v: (x) => x.ebt9, f: (x) => pct(x.ebt9, 0), num: true },
    { k: "k", l: "tr.c.batubara34", v: (x) => x.bb9, f: (x) => pct(x.bb9, 0), num: true },
  ], D.sis, 8);
  const tot = jml(D.sis.map((s) => s.n0)), tot9 = jml(D.sis.map((s) => s.n9));
  return ex("sistem", "tabel", "sistem", {
    judul: hlHtml("tr.sistem.judul", num(H.cagr(tot, tot9, 9), 1) + "%", { a: num(tot), z: num(tot9) }) + EST(),
    isi: tab + `<p class="jm-bantu">${esc(t("tr.sistem.catatan"))}</p>`, sumber: srcRuptl("Tabel 5.82-5.122"), csv: true,
  });
}
function tBeban() {
  const b = D.tr.beban_puncak_nasional.baris, a = b[0], z = b.at(-1);
  const items = rapikan(b.map((x) => ({ label: String(x.tahun), v: x.beban_puncak_mw / 1000, sorot: x === z, tip: `${x.tahun}: ${num(x.beban_puncak_mw)} MW${x === z ? " (" + t("tr.sd_okt") + ")" : ""}` })));
  const w = D.stat.wilayah_pln;
  const tab = daftarTabel("wilayah", [
    { k: "n", l: "tr.c.wilayah", v: (x) => x.nama, f: (x) => esc(x.nama) },
    { k: "p", l: "tr.c.penjualan", v: (x) => x.penjualan_gwh, f: (x) => mw(x.penjualan_gwh), num: true },
    { k: "c", l: "tr.c.pelanggan", v: (x) => x.pelanggan, f: (x) => mw(x.pelanggan), num: true },
    { k: "m", l: "tr.c.per_pelanggan", v: (x) => x.penjualan_gwh / x.pelanggan, f: (x) => num((x.penjualan_gwh * 1000) / x.pelanggan, 2), num: true, est: true },
  ], w, 8);
  return ex("beban", "analisis", "beban", {
    judul: hlHtml("tr.beban.judul", num(H.cagr(a.beban_puncak_mw, z.beban_puncak_mw, 9), 1) + "%", { a: num(a.beban_puncak_mw), z: num(z.beban_puncak_mw) }) + EST(),
    isi: `<p class="jm-bantu">${esc(t("tr.beban.unit"))}</p>` + kolom(items, { d: 1, label: t("tr.beban.grafik") }) + `<p class="jm-bantu">${esc(t("tr.beban.catatan"))}</p>` + tab,
    sumber: srcRuptl("Tabel 4.48") + srcStat(), csv: true,
  });
}
function tKapasitas() {
  const th = Array.from({ length: 10 }, (_, i) => 2015 + i);
  const fk = (s) => Object.fromEntries(H.deretFaktorKapasitas(D.ember.baris, s).map((x) => [x.tahun, x.nilai]));
  const S = [["Coal", "tr.src.batubara", true], ["Gas", "tr.src.gas"], ["Hydro", "tr.src.hidro"], ["Wind", "tr.src.bayu"], ["Solar", "tr.src.surya"]];
  const seri = S.map(([k, l, so]) => { const m = fk(k); return { nama: t(l), v: th.map((y) => m[y] ?? null), sorot: !!so }; });
  const bu = seri[0].v.filter((x) => x != null);
  const p = D.stat.baris.filter((r) => r.kapasitas_terpasang_mw.PLTP > 0 || r.kapasitas_terpasang_mw["PLTA/M"] >= 20).map((r) => {
    const kp = r.kapasitas_terpasang_mw, pr = r.produksi_pln_gwh, hy = pr.PLTA + pr.PLTM + pr.PLTMH;
    const cf = (v) => (v != null && v > 0 && v <= 100 ? v : null);
    return { kode: r.kode, nama: r.provinsi, ptp: kp.PLTP, ptpG: pr.PLTP, ptpF: cf(H.faktorKapasitasProv(pr.PLTP, kp.PLTP)), hy: kp["PLTA/M"], hyG: hy, hyF: cf(H.faktorKapasitasProv(hy, kp["PLTA/M"])) };
  });
  const tab = daftarTabel("kapprov", [
    { k: "n", l: "tr.c.provinsi", v: (x) => x.nama, f: (x) => `<span class="jm-tr-prv"><img src="/img/provinsi/${esc(x.kode)}.png" width="20" height="20" alt="" loading="lazy" decoding="async">${esc(x.nama)}</span>` },
    { k: "a", l: "tr.c.pltp_mw", v: (x) => x.ptp, f: (x) => mw(x.ptp), num: true },
    { k: "b", l: "tr.c.pltp_gwh", v: (x) => x.ptpG, f: (x) => mw(x.ptpG), num: true },
    { k: "c", l: "tr.c.pltp_fk", v: (x) => x.ptpF, f: (x) => pct(x.ptpF, 0), num: true, est: true },
    { k: "d", l: "tr.c.hidro_mw", v: (x) => x.hy, f: (x) => mw(x.hy), num: true },
    { k: "e", l: "tr.c.hidro_gwh", v: (x) => x.hyG, f: (x) => mw(x.hyG), num: true },
    { k: "f", l: "tr.c.hidro_fk", v: (x) => x.hyF, f: (x) => pct(x.hyF, 0), num: true, est: true },
  ], p, 8);
  return ex("kapasitas", "gedung", "kapasitas", {
    judul: hlHtml("tr.kap.judul", num(bu.at(-1), 0) + "%", { idle: num(100 - bu.at(-1), 0), y: 2024 }) + EST(),
    isi: garisTip(th.map(String), seri, { d: 0, satuan: "%", label: t("tr.kap.grafik") }) + `<p class="jm-bantu">${esc(t("tr.kap.catatan"))}</p>` + `<h3 class="jm-tr-h3">${esc(t("tr.kap.prov"))}</h3>` + tab + `<p class="jm-bantu">${esc(t("tr.kap.catatan_prov"))}</p>`,
    sumber: srcEmber() + srcStat(), csv: true,
  });
}
function tVre() {
  const r = H.serapVre(D.ruptl.baris, D.tr.sistem), tot = (k) => jml(r.map((x) => x[k]));
  const nm = { sum: t("tr.reg.sum"), jmb: t("tr.reg.jmb"), kal: t("tr.reg.kal"), smpnt: t("tr.reg.smpnt") };
  const chart = dumbbell(r.map((x) => ({ label: nm[x.regional], a: x.vre_mw, b: x.bess_mw, tekA: mw(x.vre_mw), tekB: mw(x.bess_mw) })), { kepA: t("tr.vre.a"), kepB: t("tr.vre.b"), label: t("tr.vre.grafik") });
  const iesr = D.tr.pembanding_iesr.find((a) => a.id === "ieto-005");
  return ex("vre", "tek-listrik", "vre", {
    judul: hlHtml("tr.vre.judul", mw(tot("bess_mw")) + " MW", { vre: mw(tot("vre_mw")) }),
    isi: `<p class="jm-bantu">${esc(t("tr.vre.unit"))}</p>` + chart + `<p class="jm-bantu">${esc(t("tr.vre.catatan"))}</p>` + (iesr ? `<p class="jm-tr-fakta">${ikon("info", 16)}<span>${esc(t("tr.vre.iesr", { v: iesr.nilai, y: iesr.tahun_data }))}</span></p>` : ""),
    sumber: sumberLipat([{ sumber: D.ruptl.sumber[0].judul, url: D.ruptl.sumber[0].url, tahun: D.ruptl.sumber[0].tahun, tanggal: D.ruptl.meta.diperbarui }]) + srcIesr(),
  });
}
const srcIesr = () => { const s = D.tr.sumber[1]; return sumberLipat([{ sumber: s.judul, halaman: "hlm 51", url: s.url, tahun: s.tahun, tanggal: D.tr.dibangun_pada }]); };

/* ---------- C. karbon ---------- */
const bursa = () => D.karbon.baris.filter((b) => b.kelompok === "bursa_karbon").sort((a, z) => a.periode.localeCompare(z.periode));
const BLN = (p) => { const [y, m] = p.split("-"); return tanggal(`${y}-${m}-01`).replace(/^1 /, ""); };
const BM = {
  volume: { f: (b) => b.volume_tco2e / 1000, d: 1, tip: (b) => `${num(b.volume_tco2e)} tCO2e` },
  nilai: { f: (b) => b.nilai_idr / 1e9, d: 1, tip: (b) => `Rp${num(b.nilai_idr / 1e6, 1)} ${t("tr.juta")}` },
  harga: { f: (b) => b.harga_rata_idr_per_tco2e / 1000, d: 1, tip: (b) => rp(b.harga_rata_idr_per_tco2e) },
};
/* label sumbu kolom: kosongkan label yang bertabrakan dengan label terakhir (grafik.js menampilkan tiap langkah dan yang terakhir) */
const rapikan = (items) => { const n = items.length, lk = Math.max(1, Math.ceil(n / (innerWidth < 640 ? 6 : 10))); return items.map((x, i) => (i % lk === 0 && i !== n - 1 && n - 1 - i < lk ? { ...x, label: "" } : x)); };
const itemsBursa = (b) => { const m = BM[ST.bursa]; return rapikan(b.map((x) => ({ label: BLN(x.periode), v: m.f(x), sorot: x === b.at(-1), tip: `${BLN(x.periode)}: ${m.tip(x)}` }))); };
function tBursa() {
  const b = bursa(), z = b.at(-1), m = BM[ST.bursa];
  const tab = daftarTabel("bursa", [
    { k: "p", l: "tr.c.periode_b", v: (x) => x.periode, f: (x) => esc(BLN(x.periode)) },
    { k: "v", l: "tr.c.volume", v: (x) => x.volume_tco2e, f: (x) => mw(x.volume_tco2e), num: true },
    { k: "n", l: "tr.c.nilai_idr", v: (x) => x.nilai_idr, f: (x) => rp(x.nilai_idr), num: true },
    { k: "h", l: "tr.c.harga", v: (x) => x.harga_rata_idr_per_tco2e, f: (x) => rp(x.harga_rata_idr_per_tco2e), num: true, est: true },
    { k: "f", l: "tr.c.frekuensi", v: (x) => x.frekuensi, f: (x) => mw(x.frekuensi), num: true },
    { k: "t", l: "tr.c.peserta", v: (x) => x.peserta, f: (x) => mw(x.peserta), num: true },
  ], [...b].reverse(), 7);
  return ex("bursa", "kartu", "bursa", {
    judul: hlHtml("tr.bursa.judul", num(z.volume_ytd_tco2e), { bln: BLN(z.periode), nilai: num(z.nilai_ytd_idr / 1e9, 2), harga: rp(z.harga_rata_idr_per_tco2e) }),
    isi: seg("bursa", [["volume", "tr.b.volume", "grafik"], ["nilai", "tr.b.nilai", "kartu"], ["harga", "tr.b.harga", "tahun"]], ST.bursa) + `<p class="jm-bantu" id="trBursaUnit">${esc(t("tr.b.unit_" + ST.bursa))}</p><div id="trBursa">${kolom(itemsBursa(b), { d: m.d, label: t("tr.bursa.grafik") })}</div><p class="jm-bantu">${esc(t("tr.bursa.catatan"))}</p>` + tab,
    sumber: srcKarbon("s-idxcarbon"), csv: true,
  });
}
function tEmisi() {
  const s = [...D.sis].filter((x) => x.e0 != null).sort((a, b) => b.e0 - a.e0), top = s[0];
  const chart = dumbbell(s.map((x) => ({ label: x.nama, a: x.e0, b: x.e9 ?? 0, tekA: num(x.e0, 2), tekB: num(x.e9 ?? 0, 2) })), { kepA: "2025", kepB: "2034", d: 2, label: t("tr.emisi.grafik") });
  return ex("emisi", "kajian", "emisi", {
    judul: hlHtml("tr.emisi.judul", num(top.e0, 2), { sistem: top.nama }) + EST(),
    isi: chart + `<p class="jm-bantu">${esc(t("tr.emisi.catatan"))}</p>`, sumber: srcRuptl("Tabel 5.82-5.122 (Emisi GRK, Produksi)"),
  });
}
function tSrn() {
  const p = D.karbon.baris.filter((b) => b.kelompok === "proyek_srn"), re = p.filter((x) => x.tipe_unit.endsWith("RE"));
  const tab = daftarTabel("srn", [
    { k: "n", l: "tr.c.proyek", v: (x) => x.nama, f: (x) => `<a href="${esc(x.sumber_url)}" target="_blank" rel="noopener noreferrer">${esc(x.nama)}</a>` },
    { k: "t", l: "tr.c.tipe", v: (x) => x.tipe_unit, f: (x) => esc(t(x.tipe_unit.endsWith("RE") ? "tr.srn.re" : "tr.srn.non")) },
    { k: "o", l: "tr.c.pemilik", v: (x) => x.pemilik_proyek, f: (x) => esc(x.pemilik_proyek) },
    { k: "v", l: "tr.c.vintage", v: (x) => x.vintage, f: (x) => esc(x.vintage), num: true },
    { k: "d", l: "tr.c.listing", v: (x) => x.tanggal_listing, f: (x) => esc(tanggal(x.tanggal_listing)), num: true },
    { k: "m", l: "tr.c.volume_l", v: (x) => x.volume_listing_total_tco2e, f: (x) => mw(x.volume_listing_total_tco2e), num: true },
  ], p, 5);
  const regs = D.tr.regulasi_karbon.map((r) => `<li class="jm-tr-reg"><span class="jm-tr-regn"><b>${esc(r.nomor && r.id.startsWith("perpres") ? "Perpres " + r.nomor + "/" + r.tahun : r.id)}</b><small>${esc(r.judul)}</small></span><span class="jm-pil ${r.status === "berlaku" ? "jm-pil-ok" : "jm-pil-bad"}">${esc(t("tr.reg_st." + r.status))}</span>${unduhRegHtml({ url_pdf: r.url_pdf, url_sumber: r.url_sumber, judul: r.judul })}</li>`).join("");
  return ex("srn", "palu", "srn", {
    judul: hlHtml("tr.srn.judul", String(re.length), { n: p.length, vol: num(jml(re.map((x) => x.volume_listing_total_tco2e))) }),
    isi: tab + `<h3 class="jm-tr-h3">${esc(t("tr.pajak.judul"))}</h3><p class="jm-bantu">${esc(t("tr.pajak.catatan"))}</p><ul class="jm-tr-regs">${regs}</ul>`,
    sumber: srcKarbon("s-idxcarbon") + sumberLipat([{ sumber: t("tr.src.regulasi"), url: D.tr.regulasi_karbon[0].url_sumber, tanggal: D.tr.dibangun_pada }]), csv: true,
  });
}
function tKredit() {
  const p = D.kp.baris, dit = jml(p.map((x) => x.kredit.diterbitkan)), pen = jml(p.map((x) => x.kredit.dipensiunkan));
  const tek = [...new Set(p.map((x) => x.teknologi))].map((k) => { const a = p.filter((x) => x.teknologi === k); return { k, a: jml(a.map((x) => x.kredit.dipensiunkan)), b: jml(a.map((x) => x.kredit.diterbitkan)) }; }).sort((x, z) => z.b - x.b);
  const chart = dumbbell(tek.map((x) => ({ label: t("tr.tk." + x.k), a: x.a / 1e6, b: x.b / 1e6, tekA: num(x.a / 1e6, 2), tekB: num(x.b / 1e6, 2) })), { kepA: t("tr.kr.pensiun"), kepB: t("tr.kr.terbit"), d: 1, label: t("tr.kr.grafik") });
  const tab = daftarTabel("kredit", [
    { k: "n", l: "tr.c.proyek", v: (x) => x.nama, f: (x) => `<a href="${esc(x.sumber_url)}" target="_blank" rel="noopener noreferrer">${esc(x.nama)}</a>` },
    { k: "r", l: "tr.c.registri", v: (x) => x.registri, f: (x) => esc(x.registri) },
    { k: "t", l: "tr.c.teknologi", v: (x) => x.teknologi, f: (x) => esc(t("tr.tk." + x.teknologi)) },
    { k: "s", l: "tr.c.status", v: (x) => x.status, f: (x) => esc(ada("tr.kst." + x.status) ? t("tr.kst." + x.status) : x.status) },
    { k: "a", l: "tr.c.terbit", v: (x) => x.kredit.diterbitkan, f: (x) => mw(x.kredit.diterbitkan), num: true },
    { k: "b", l: "tr.c.pensiun", v: (x) => x.kredit.dipensiunkan, f: (x) => mw(x.kredit.dipensiunkan), num: true },
    { k: "c", l: "tr.c.taksiran", v: (x) => x.kredit.taksiran_tahunan, f: (x) => mw(x.kredit.taksiran_tahunan), num: true },
    { k: "e", l: "tr.c.bukti", v: (x) => x.tingkat_bukti, f: (x) => esc(t("tr.bukti." + x.tingkat_bukti)) },
  ], p, 8);
  return ex("kredit", "bintang", "kredit", {
    judul: hlHtml("tr.kr.judul", num(dit / 1e6, 1), { n: p.length, pen: num(pen / 1e6, 1) }),
    isi: `<p class="jm-bantu">${esc(t("tr.kr.unit"))}</p>` + chart + `<p class="jm-bantu">${esc(t("tr.kr.catatan"))}</p>` + tab,
    sumber: sumberLipat(D.kp.sumber.map((s) => ({ sumber: s.judul, url: s.url, tahun: s.tahun, tanggal: D.kp.dibangun_pada }))), csv: true,
  });
}

/* ---------- penutup ---------- */
function tCelahData() {
  const k = ["kurtailmen", "operator", "faktor_emisi", "pajak", "srn", "bulanan", "serap"];
  return ex("celahdata", "peringatan", "celahdata", {
    judul: esc(t("tr.celahdata.judul")),
    isi: `<ul class="jm-tr-celah">${k.map((x) => `<li>${ikon("peringatan", 18)}<span>${esc(t("tr.celah." + x))}</span></li>`).join("")}</ul>`,
  });
}
function tCara() {
  return ex("cara", "metode", "cara", {
    judul: esc(t("tr.cara.judul")),
    isi: `<ul class="jm-tr-cara">${["celah", "tambah", "dekomp", "fk", "emisi", "peta"].map((x) => `<li>${esc(t("tr.cara." + x))}</li>`).join("")}</ul><p class="jm-bantu">${esc(t("tr.cara.kutip", { tanggal: tanggal(D.tr.dibangun_pada, { gaya: "panjang" }) }))}</p>`,
  });
}
function grup(id, ik, kunci, isi) {
  return `<section class="jm-tr-grup" aria-labelledby="g-${id}"><header><span class="jm-kpi-ik">${ikon(ik, 20)}</span><div><h2 id="g-${id}" class="jm-tr-g2" data-grup="${id}">${esc(t(`tr.g.${kunci}`))}</h2><p>${esc(t(`tr.g.${kunci}_sub`))}</p></div></header>${isi.join("")}</section>`;
}

function gambar() {
  olah();
  const u = D.celahBaris.find((x) => x.id === "ruptl-2034-kapasitas"), jb = D.sisById["jawa-bali"], b = bursa().at(-1);
  $("jawab").textContent = t("tr.lead");
  khSisi(".jm-kh", { ubin: [
    { ikon: "kompas", nilai: num(u.kali, 1), satuan: "x", label: t("tr.u1") },
    { ikon: "perisai", nilai: num(jb.rm0, 1), satuan: "%", label: t("tr.u2") },
    { ikon: "kartu", nilai: num(b.harga_rata_idr_per_tco2e), satuan: "Rp/tCO2e", label: t("tr.u3", { bln: BLN(b.periode) }) },
  ] });
  TB.clear();
  $("isi").innerHTML = `<nav class="jm-tr-nav" aria-label="${esc(t("tr.nav"))}">${tabTautan([{ href: "#target", ikon: "analisis", label: t("tr.n.target") }, { href: "#sistem", ikon: "rantai", label: t("tr.n.sistem") }, { href: "#karbon", ikon: "tek-bio", label: t("tr.n.karbon") }])}</nav>
    <div id="target">${grup("target", "analisis", "target", [tCelah(), tTambah(), tSkenario(), tRukn(), tDekomp(), tPapan()])}</div>
    <div id="sistem">${grup("sistem", "rantai", "sistem", [tPeta(), tSistem(), tBeban(), tKapasitas(), tVre()])}</div>
    <div id="karbon">${grup("karbon", "tek-bio", "karbon", [tBursa(), tEmisi(), tSrn(), tKredit()])}</div>
    ${tCelahData()}${tCara()}`;
  panelSistem();
  petaSvg().then(() => { if (innerWidth >= 900 && $("trPanel") && !$("trPanel").classList.contains("jm-geser")) geserPanel($("trPanel"), { kunci: "panel", batas: $("trPeta") }); });
}

function pasang() {
  pasangTabel();
  document.addEventListener("click", (e) => {
    const sg = e.target.closest("[data-seg] button[data-v]");
    if (sg) {
      const nama = sg.parentElement.dataset.seg, kunci = nama === "segmen" ? "segmen" : "bursa";
      if (ST[kunci] === sg.dataset.v) return;
      for (const x of sg.parentElement.children) x.setAttribute("aria-selected", String(x === sg));
      ST[kunci] = sg.dataset.v;
      nanti(() => {
        if (kunci === "bursa") { tulis("trBursa", kolom(itemsBursa(bursa()), { d: BM[ST.bursa].d, label: t("tr.bursa.grafik") })); $("trBursaUnit").textContent = t("tr.b.unit_" + ST.bursa); return; }
        const tmp = document.createElement("div"); tmp.innerHTML = tPeta();
        $("peta").querySelector(".jm-ex-j").innerHTML = tmp.querySelector(".jm-ex-j").innerHTML;
        $("trSkala").innerHTML = tmp.querySelector("#trSkala").innerHTML;
        petaSvg();
      });
      return;
    }
    const pa = e.target.closest("path[data-k]");
    if (pa && D.provSis[pa.dataset.k]) pilihSistem(D.provSis[pa.dataset.k]);
  });
  document.addEventListener("keydown", (e) => { const pa = e.target.closest?.("path[data-k]"); if (pa && (e.key === "Enter" || e.key === " ") && D.provSis[pa.dataset.k]) { e.preventDefault(); pilihSistem(D.provSis[pa.dataset.k]); } });
}
function pilihSistem(id) {
  ST.sistem = id;
  for (const p of document.querySelectorAll("path.jm-tr-prov")) p.classList.toggle("pilih", D.provSis[p.dataset.k] === id);
  nanti(panelSistem);
}

async function mulai() {
  await mulaiHalaman();
  $("isi").innerHTML = hantuHtml(4);
  try {
    const [target, tr, ember, karbon, kp, stat, program, ruptl] = await Promise.all(["target", "transisi", "ember_bulanan", "karbon", "karbon_proyek", "statistik_pln", "program_analisis", "ruptl"].map((n) => muatData(n + ".json")));
    Object.assign(D, { target, tr, ember, karbon, kp, stat, program, ruptl });
  } catch (e) { tampilGalat($("isi"), mulai); return; }
  gambar();
  pasang();
  saatBahasa(gambar);
}
mulai();
