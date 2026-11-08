/* /surya, tab Proyek: PLTS atap (kuota per klaster sistem, realisasi, aturan), C&I dan captive (PPA korporat), utilitas, terapung, dan program 100 GW / koperasi desa (sy_program.js).
   Kuota dan realisasi atap = surya_modul.json (baru); PPA, proyek, waduk, aturan = berkas yang sudah ada dibaca runtime. INP: tabel dan grafik menyusul lewat nanti(). */
import { X, L, t, ex, num, esc, ikon, bukti, buktiSy, kakiSy, luar, chip, tabel, kolomSvg, garisSvg, legendaHtml, tipHtml, kosongTab, daftarCelah, catatan, muat, mwTeks, bulanTeks, namaOrg } from "/sy_umum.js";
import { nanti } from "/inti/umum.js";
import { bagianProgram, gambarProgram } from "/sy_program.js";

const A = () => X.sy.atap;
const stProy = { beroperasi: "ok", konstruksi: "info", rencana: "warn", ditunda: "bad" };
const xBulan = (ym) => { const [y, m] = ym.split("-").map(Number); return y + (m - 0.5) / 12; };
function gambarAtap(el) {
  const g = el.querySelector("#sur-p-ag"); if (!g) return;
  const a = A();
  const kuota = a.tahun.map((th, i) => ({ x: th + 0.95, y: a.jumlah[i], tip: `${th}: ${num(a.jumlah[i], 0)} MW` }));
  const real = a.realisasi.map((r) => ({ x: xBulan(r.tanggal), y: r.mw, tip: `${bulanTeks(r.tanggal)}: ${num(r.mw, 1)} MWp` }));
  g.innerHTML = garisSvg({ el: g, satuan: "MW", label: t("sur.p.j.grafik"), xTick: [2023, 2024, 2025, 2026, 2027, 2028],
    seri: [{ id: "kuota", kelas: "sur-s-kuota", label: t("sur.p.s.kuota"), titik: kuota }, { id: "real", kelas: "sur-s-realisasi", label: t("sur.p.s.real"), titik: real }] });
  const k = el.querySelector("#sur-p-ak");
  tabel(k, { satuan: "sur.u.klaster", per: 11, urutAwal: 5, menurun: true, kolom: [
    { label: t("sur.c.klaster"), v: (c) => c.nama, f: (c) => `<span class="sur-baris">${ikon("lokasi", 16)}<b>${esc(c.nama)}</b></span>` },
    ...a.tahun.map((th, i) => ({ label: String(th), num: true, v: (c) => c.mw[i], f: (c) => esc(num(c.mw[i], c.mw[i] % 1 ? 1 : 0)) })),
  ], baris: a.klaster });
  const r = el.querySelector("#sur-p-ar");
  tabel(r, { satuan: "sur.u.titik", per: 8, urutAwal: 0, menurun: true, kolom: [
    { label: t("sur.c.tanggal"), v: (x) => x.tanggal, f: (x) => esc(bulanTeks(x.tanggal)) },
    { label: t("sur.c.mwp"), num: true, v: (x) => x.mw, f: (x) => `<b>${esc(num(x.mw, 1))}</b> MWp` },
    { label: t("sur.c.pelanggan"), num: true, v: (x) => x.pelanggan ?? -1, f: (x) => (x.pelanggan ? esc(num(x.pelanggan)) : "-") },
    { label: t("sur.c.catatan"), v: (x) => L(x.ket), f: (x) => `<span class="rg3-teks">${esc(L(x.ket))}</span>` },
    { label: t("sur.c.bukti"), v: (x) => x.tingkat_bukti, f: (x) => buktiSy(x) },
  ], baris: a.realisasi });
  const ru = el.querySelector("#sur-p-ru");
  const tot = X.atap?.total?.per_tahun; if (ru && tot) ru.innerHTML = kolomSvg({ el: ru, satuan: "MW", label: t("sur.p.j.ruptl"), seri: [{ k: "n", kelas: "sur-s-kuota" }], kategori: Object.entries(tot).map(([th, v]) => ({ label: th, nilai: { n: v }, tip: `${th}: ${num(v, 0)} MW`, th: tipHtml(th, [[t("sur.p.s.kuota"), `${num(v, 0)} MW`]]) })) });
}
function bagianAtap() {
  const a = A(), j = a.kuota_2026_januari, rl = a.realisasi.at(-1), ub = [
    [t("sur.p.u.real", { bln: bulanTeks(rl.tanggal) }), num(rl.mw, 1), "MWp", buktiSy(rl)], [t("sur.p.u.dibuka"), num(j.dibuka_mw), "MW", buktiSy(j)],
    [t("sur.p.u.tunggu"), num(j.daftar_tunggu_mw), "MW", buktiSy(j)], [t("sur.p.u.usul"), num(j.usul_tambah_mw), "MW", buktiSy(j)], [t("sur.p.u.ruptl", { p: a.target_ruptl_gw.periode }), num(a.target_ruptl_gw.nilai, 1), "GW", buktiSy(a.target_ruptl_gw)],
  ];
  const aturan = X.atapHitung?.aturan;
  return ex({ id: "sur-p-atap", ikon: "panel-surya", topik: t("sur.p.ey.atap"), judulHtml: esc(t("sur.p.j.atap")), subHtml: esc(t("sur.p.s.atap")),
    isiHtml: `<div class="rg3-kisi">${ub.map(([l, v, u, b]) => `<div class="rg3-kartu sur-ubin"><span class="jm-kh-lbl">${esc(l)}</span><p class="sur-angka"><b>${esc(v)}</b><span>${esc(u)}</span></p><span class="rg3-ab">${b}</span></div>`).join("")}</div>
      <h3 class="rg3-sub">${esc(t("sur.p.h.kuota"))}</h3><p class="rg3-info">${ikon("info", 18)}<span>${esc(L(a.dasar.nama))}. ${esc(L(j.catatan))}</span></p>
      ${legendaHtml([{ id: "kuota", kelas: "sur-s-kuota", label: t("sur.p.s.kuota") }, { id: "real", kelas: "sur-s-realisasi", label: t("sur.p.s.real") }])}<div id="sur-p-ag" class="ih-bagan"></div><div id="sur-p-ak"></div>${catatan("sur.p.n.kuota")}<p class="jm-bantu ih-catatan">${esc(L(a.catatan))}</p>
      <h3 class="rg3-sub">${esc(t("sur.p.h.real"))}</h3><div id="sur-p-ar"></div><p class="rg3-info rg3-info-bad">${ikon("tanya", 18)}<span>${esc(L(a.klaim_belum_rekonsiliasi[0].ket))} ${buktiSy(a.klaim_belum_rekonsiliasi[0])}</span></p><p class="jm-bantu ih-catatan">${esc(L(a.catatan_industri))}</p>
      <h3 class="rg3-sub">${esc(t("sur.p.h.ruptl"))}</h3><div id="sur-p-ru" class="ih-bagan"></div>${catatan("sur.p.n.ruptl")}
      ${aturan ? `<h3 class="rg3-sub">${esc(t("sur.p.h.aturan"))}</h3><ul class="sur-daftar">${aturan.butir.map((b) => `<li>${ikon("regulasi", 18)}<p>${esc(b)}</p></li>`).join("")}</ul><p class="jm-bantu"><a class="rg3-tautan" href="/regulasi?id=${esc(aturan.regulasi_id)}">${esc(t("sur.p.ke_aturan"))}</a> <a class="rg3-tautan" href="/peluang#plts-atap">${esc(t("sur.p.ke_kalk"))}</a></p>` : ""}
      ${daftarCelah(a.celah.map(L))}`, kakiHtml: kakiSy([a.sumber_id, ...a.realisasi.map((r) => r.sumber_id), j.sumber_id, a.target_2028_wilayah_mw.sumber_id]) });
}
/* ---------- C&I dan captive ---------- */
function bagianCni() {
  const K = X.korporat; if (!K) return "";
  const ppa = (K.ppa || []).filter((p) => p.teknologi === "surya"), ag = (K.agregat || []).filter((x) => /plts|surya|solar/i.test(x.label + (x.id || "")));
  if (!ppa.length && !ag.length) return "";
  const b = (o) => bukti(o.tingkat_bukti, { sumber: o.sumber?.penerbit || "", tanggal: o.tanggal || o.sumber?.terbit || "", cara: o.sumber?.judul || "" });
  return ex({ id: "sur-p-cni", ikon: "gedung", topik: t("sur.p.ey.cni"), judulHtml: esc(t("sur.p.j.cni", { n: num(ppa.length) })), subHtml: esc(t("sur.p.s.cni")),
    isiHtml: `${ag.length ? `<div class="rg3-kisi">${ag.map((x) => `<div class="rg3-kartu sur-ubin"><span class="jm-kh-lbl">${esc(x.label)}</span><p class="sur-angka"><b>${esc(num(x.nilai, x.nilai % 1 ? 1 : 0))}</b><span>${esc(x.satuan)}</span></p><span class="rg3-ab">${b(x)}${x.sumber?.url ? luar(x.sumber.url, x.sumber.penerbit) : ""}</span></div>`).join("")}</div>` : ""}<div id="sur-p-cn"></div>${catatan("sur.p.n.cni")}`, kakiHtml: "" });
}
function tabelCni() {
  const el = document.getElementById("sur-p-cn"); if (!el) return;
  const ppa = (X.korporat?.ppa || []).filter((p) => p.teknologi === "surya");
  tabel(el, { satuan: "sur.u.ppa", per: 8, urutAwal: 3, menurun: true, kolom: [
    { label: t("sur.c.pembeli"), v: (p) => p.pembeli, f: (p) => `<b>${esc(p.pembeli)}</b>` },
    { label: t("sur.c.pemasok"), v: (p) => p.pemasok, f: (p) => esc(p.pemasok || "-") },
    { label: t("sur.c.lokasi"), v: (p) => p.lokasi || "", f: (p) => `<span class="rg3-teks">${esc(p.lokasi || "-")}</span>` },
    { label: "MW", num: true, v: (p) => p.mw ?? -1, f: (p) => (p.mw != null ? `<b>${esc(num(p.mw, 0))}</b>` : "-") },
    { label: t("sur.c.skema"), v: (p) => p.skema || "", f: (p) => (p.skema ? chip("rg3-w" + (p.skema === "ppa" ? 2 : 3), "", t("sur.skema." + p.skema)) : "-") },
    { label: t("sur.c.bukti"), v: (p) => p.tingkat_bukti || "", f: (p) => bukti(p.tingkat_bukti, { sumber: p.sumber?.penerbit, tanggal: p.sumber?.terbit || "", cara: p.sumber?.judul }) },
  ], baris: ppa });
}
/* ---------- utilitas dan terapung ---------- */
const kapMw = (p) => { const k = p.kapasitas?.[0]; if (k?.nilai == null) return null; const s = (k.satuan || "MW").toLowerCase(); return s.startsWith("kw") ? k.nilai / 1000 : s.startsWith("gw") ? k.nilai * 1000 : k.nilai; };
const surya = () => (X.proyek?.baris || []).filter((p) => p.teknologi === "surya");
const terapungP = (p) => /terapung|floating/i.test(p.nama);
function bagianUtilitas() {
  const S = surya(); if (!S.length) return "";
  const per = {}; for (const p of S) { const s = p.status?.[0]?.nilai || "tidak-diketahui"; per[s] = (per[s] || 0) + (kapMw(p) || 0); }
  const mw = Object.values(per).reduce((a, v) => a + v, 0);
  return ex({ id: "sur-p-util", ikon: "proyek", topik: t("sur.p.ey.util"), judulHtml: esc(t("sur.p.j.util", { n: num(S.length), g: num(mw / 1000, 1) })), subHtml: esc(t("sur.p.s.util")),
    isiHtml: `<div class="rg3-kisi">${Object.entries(per).sort((a, b) => b[1] - a[1]).map(([s, v]) => `<div class="rg3-kartu sur-ubin"><span class="jm-kh-lbl">${esc(t("sur.st." + s))}</span><p class="sur-angka"><b>${esc(num(v, 0))}</b><span>MW</span></p><span class="rg3-ab">${chip("sur-st-" + (stProy[s] || "x"), "", num(S.filter((p) => (p.status?.[0]?.nilai || "tidak-diketahui") === s).length) + " " + t("sur.u.proyek"))}</span></div>`).join("")}</div><div id="sur-p-ut"></div><p class="jm-bantu"><a class="rg3-tautan" href="/proyek?tek=surya">${esc(t("sur.p.ke_proyek"))}</a></p>` });
}
function tabelUtilitas() {
  const el = document.getElementById("sur-p-ut"); if (!el) return;
  const baris = surya().filter((p) => (kapMw(p) || 0) >= 10 && !terapungP(p));
  tabel(el, { satuan: "sur.u.proyek", per: 8, urutAwal: 3, menurun: true, kolom: [
    { label: t("sur.c.proyek"), v: (p) => p.nama, f: (p) => `<a class="rg3-tautan" href="/p/${encodeURIComponent(p.id)}"><b>${esc(p.nama)}</b></a>` },
    { label: t("sur.c.provinsi"), v: (p) => p.lokasi?.provinsi || "", f: (p) => esc(p.lokasi?.provinsi || "-") },
    { label: t("sur.c.status"), v: (p) => p.status?.[0]?.nilai || "", f: (p) => { const s = p.status?.[0]?.nilai || "tidak-diketahui"; return chip("sur-st-" + (stProy[s] || "x"), "", t("sur.st." + s)); } },
    { label: "MW", num: true, v: (p) => kapMw(p) ?? -1, f: (p) => `<b>${esc(num(kapMw(p), 0))}</b>` },
    { label: t("sur.c.bukti"), v: (p) => p.tingkat_bukti || "", f: (p) => bukti(p.tingkat_bukti, { sumber: p.sumber?.[0]?.penerbit || "", tanggal: p.sumber?.[0]?.tanggal || "" }) },
  ], baris });
}
function bagianTerapung() {
  const T = X.terapung; if (!T?.baris?.length) return "";
  const r = T.ringkasan || {};
  return ex({ id: "sur-p-tp", ikon: "air-energi", topik: t("sur.p.ey.tp"), judulHtml: esc(t("sur.p.j.tp", { n: num(r.jumlah_waduk || T.baris.length), g: num((r.potensi_mw_20persen_luas || 0) / 1000, 1) })), subHtml: esc(t("sur.p.s.tp")),
    isiHtml: `<div class="rg3-kisi">${[[t("sur.p.u.waduk"), num(r.jumlah_waduk || T.baris.length), ""], [t("sur.p.u.potensi"), num((r.potensi_mw_20persen_luas || 0) / 1000, 1), "GW"], [t("sur.p.u.klaim"), num(r.klaim_ruptl_gw || 0, 1), "GW"]].map(([l, v, u]) => `<div class="rg3-kartu sur-ubin"><span class="jm-kh-lbl">${esc(l)}</span><p class="sur-angka"><b>${esc(v)}</b><span>${esc(u)}</span></p><span class="rg3-ab">${bukti("est", { sumber: "RUPTL 2025-2034", cara: t("sur.p.cara_tp") })}</span></div>`).join("")}</div><div id="sur-p-tt"></div>${catatan("sur.p.n.tp")}<p class="jm-bantu"><a class="rg3-tautan" href="/teknologi/surya">${esc(t("sur.p.ke_tek"))}</a></p>` });
}
function tabelTerapung() {
  const el = document.getElementById("sur-p-tt"); if (!el) return;
  const prov = new Map((X.atlas?.baris || []).map((b) => [b.kode, b.provinsi]));
  tabel(el, { satuan: "sur.u.waduk", per: 8, urutAwal: 3, menurun: true, kolom: [
    { label: t("sur.c.waduk"), v: (w) => w.nama, f: (w) => `<b>${esc(w.nama)}</b>` },
    { label: t("sur.c.provinsi"), v: (w) => prov.get(w.kode_prov) || "", f: (w) => esc(prov.get(w.kode_prov) || w.kode_prov || "-") },
    { label: t("sur.c.luas"), num: true, v: (w) => w.luas_ha ?? -1, f: (w) => (w.luas_ha != null ? `${esc(num(w.luas_ha, 0))} ha` : "-") },
    { label: t("sur.c.potensi"), num: true, v: (w) => w.potensi_mw_20persen_luas ?? -1, f: (w) => (w.potensi_mw_20persen_luas != null ? `<b>${esc(num(w.potensi_mw_20persen_luas, 0))}</b> MW` : "-") },
    { label: t("sur.c.proyek"), v: (w) => w.proyek_id || "", f: (w) => (w.proyek_id ? `<a class="rg3-tautan" href="/p/${encodeURIComponent(w.proyek_id)}">${esc(w.proyek_id)}</a>` : "-") },
    { label: t("sur.c.bukti"), v: (w) => w.tingkat_bukti || "", f: (w) => bukti(w.tingkat_bukti, { sumber: "RUPTL 2025-2034", tanggal: X.terapung.dibangun_pada, tingkatSumber: "resmi" }) },
  ], baris: X.terapung.baris });
}
export async function mulai(el) {
  await muat(["atap", "atapHitung", "korporat", "proyek", "terapung", "atlas", "program", "neraca", "org", "regulasi"]);
  el.innerHTML = [bagianAtap(), bagianCni(), bagianUtilitas(), bagianTerapung(), bagianProgram()].join("");
  nanti(() => { gambarAtap(el); tabelCni(); tabelUtilitas(); tabelTerapung(); gambarProgram(el); });
}
