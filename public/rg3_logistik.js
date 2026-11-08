/* /rantai-global, tab Logistik: diagram alur tahap, peta rute pelabuhan (MapLibre), kalkulator biaya mendarat.
   Sumber: logistik.json, benchmark_harga.json, perjanjian_dagang.json. Rumus: rantai_global_hitung.js (teruji). Hasil kalkulator = EST/Hipotesis menurut masukan.
   INP: masukan berubah seketika; hasil dan grafik menyusul lewat nanti(). */
import { D, berisi, ex, t, esc, ikon, num, bukti, cariSumber, kosongTab, urlGet, urlSet, sumberBerkas, catatan, daftarCelah, bendera, namaNegara } from "/rg3_umum.js";
import { nanti } from "/inti/umum.js";
import { pilihHtml } from "/inti/komponen.js";
import { pasangPilih } from "/inti/pilih.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { uangHtml } from "/inti/uang.js";
import { PROV } from "/inti/prov_singkat.js";
import { biayaMendarat, beaMasuk, pelabuhanMasuk, pelabuhanAsal } from "/rantai_global_hitung.js";
import { batangSvg, legendaHtml, tabel, tipHtml } from "/info_hijau.js";

const L = () => D.logistik, H = () => D.harga;
const IK_TAHAP = { "po-incoterms": "tiket", produksi: "pabrik", pengapalan: "koper", layar: "kapal", "bea-cukai": "palu", "darat-antarpulau": "peta", pasang: "petir" };
/* profil kalkulator: muatan per kontainer 40 kaki (Hipotesis, ubah di formulir) dan HS cadangan bila benchmark tak membawa bm_hs */
const PROFIL = { "modul-topcon": [400000, "8541.43.00"], "modul-hjt": [400000, "8541.43.00"], "modul-perc": [400000, "8541.43.00"], "inverter-string": [30000000, "8504.40.40"], "inverter-sentral": [3500000, "8504.40.40"], "baterai-pack": [2500, "8507.60"], "bess-sistem": [5000, "8507.60"], "turbin-angin": [200, "8502.31"], elektroliser: [1000, "8543"] };
const NEGARA_ASAL = ["cn", "vn", "my", "kr", "in", "jp", "th", "us", "de"];
const POS = ["fob", "angkut", "asuransi", "bm", "ppn", "pph22", "lokal"];
const S = { k: "", f: 0, neg: "cn", prov: "32", tk: "", mu: "", as: "0.2", lo: "0", bm: "", kr: "", api: "1", fm: "" };
let petaObj = null, asalDipilih = "";

const kurs0 = () => H()?.kurs?.find((k) => k.idr)?.idr || 0;
const wci = () => L()?.biaya_angkut?.titik?.find((x) => x.usd_40ft && x.tingkat_bukti === "resmi") || L()?.biaya_angkut?.titik?.find((x) => x.usd_40ft);
const komp = () => (H()?.produk || []).filter((p) => PROFIL[p.id] && (p.dunia || []).length);
const produkTerpilih = () => komp().find((p) => p.id === S.k) || komp()[0];
const selisihKomp = (k) => H()?.komponen_selisih?.find((x) => x.k === k);

/* ---------- alur tahap ---------- */
function alur() {
  return `<ol class="rg3-alur">${(L().tahap || []).map((s) => {
    const d = s.durasi_hari != null ? `<b class="rg3-hari">${esc(t("rg3.l.hari", { n: num(s.durasi_hari, 0) }))}</b>` : `<span class="jm-pil rg3-belum">${ikon("tanya", 14)}<span>${esc(t("rg3.belum"))}</span></span>`;
    return `<li class="rg3-tahap"><span class="rg3-tahap-no">${ikon(IK_TAHAP[s.id] || "rantai", 18)}<i>${s.urut}</i></span><div><h3>${esc(t("rg3.l.tahap." + s.id))}</h3><p class="rg3-tahap-pelaku">${esc(s.pelaku)}</p><p>${esc(t("rg3.l.tahap." + s.id + ".u"))}</p><div class="rg3-tahap-kaki">${d}${bukti(s.tingkat_bukti, { sumber: cariSumber(L(), s.sumber_id)?.penerbit || "", tanggal: s.tanggal })}</div></div></li>`;
  }).join("")}</ol>`;
}

/* ---------- peta rute ---------- */
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
function rute(asal) { return (L().rute || []).filter((r) => !asal || r.dari === asal); }
async function peta() {
  const el = document.getElementById("rg3-l-peta"); if (!el) return;
  const P = L().pelabuhan || [];
  try { await muatMapLibre(); } catch { el.textContent = t("rg3.map.gagal"); return; }
  if (petaObj) { petaObj.remove(); petaObj = null; }
  petaObj = new maplibregl.Map({ container: el, style: "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron"), center: [112, 8], zoom: 2.2, minZoom: 1.2, maxZoom: 8, dragRotate: false, pitchWithRotate: false, attributionControl: false });
  petaObj.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
  petaObj.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  const kotak = new maplibregl.LngLatBounds(); P.forEach((p) => kotak.extend([p.lon, p.lat]));
  petaObj.fitBounds(kotak, { padding: 50, duration: 0, maxZoom: 4 });
  const garis = (asal) => ({ type: "FeatureCollection", features: rute(asal).map((r) => { const a = P.find((p) => p.id === r.dari), b = P.find((p) => p.id === r.ke); return a && b ? { type: "Feature", geometry: { type: "LineString", coordinates: [[a.lon, a.lat], [b.lon, b.lat]] }, properties: { id: r.id } } : null; }).filter(Boolean) });
  petaObj.on("load", () => {
    petaObj.addSource("semua", { type: "geojson", data: garis("") });
    petaObj.addLayer({ id: "semua", type: "line", source: "semua", paint: { "line-color": warna("--line-ctl") || "gray", "line-width": 1, "line-opacity": 0.35 } });
    petaObj.addSource("sorot", { type: "geojson", data: asalDipilih ? garis(asalDipilih) : { type: "FeatureCollection", features: [] } });
    petaObj.addLayer({ id: "sorot", type: "line", source: "sorot", paint: { "line-color": warna("--accent") || "green", "line-width": 2.6, "line-opacity": 0.85 } });
  });
  for (const p of P) {
    const m = document.createElement("div"); m.className = "rg3-mk rg3-mk-" + p.peran; m.tabIndex = 0; m.setAttribute("role", "button"); m.setAttribute("aria-label", `${p.nama}, ${namaNegara(p.negara)}`);
    m.innerHTML = `<img src="/img/bendera/${esc(p.negara.toLowerCase())}.svg" alt="" width="26" height="26" data-galat="hapus"><b>${esc(p.nama)}</b>`;
    new maplibregl.Marker({ element: m }).setLngLat([p.lon, p.lat]).addTo(petaObj);
    const rs = rute().filter((r) => r.dari === p.id || r.ke === p.id);
    const pop = new maplibregl.Popup({ closeButton: false, offset: 18, className: "rg3-pop" }).setHTML(`<div class="rg3-tipm"><b>${bendera(p.negara, 20)}${esc(p.nama)}</b><span><em>${esc(t("rg3.l.peran"))}</em><strong>${esc(t("rg3.l.peran." + p.peran))}</strong></span><span><em>${esc(t("rg3.l.rute"))}</em><strong>${rs.length}</strong></span></div>`);
    const buka = () => pop.setLngLat([p.lon, p.lat]).addTo(petaObj), tutup = () => pop.remove();
    m.addEventListener("pointerenter", buka); m.addEventListener("pointerleave", tutup); m.addEventListener("focus", buka); m.addEventListener("blur", tutup);
    m.addEventListener("click", () => { if (p.peran === "asal") pilihAsal(p.id); });
  }
}
function pilihAsal(id) {
  asalDipilih = id; urlSet({ lasal: id });
  const sel = document.getElementById("rg3-l-asal"); if (sel && sel.value !== id) { sel.value = id; sel.dispatchEvent(new Event("jm:segar")); }
  const src = petaObj?.getSource?.("sorot");
  if (src) src.setData({ type: "FeatureCollection", features: !id ? [] : rute(id).map((r) => { const P = L().pelabuhan, a = P.find((p) => p.id === r.dari), b = P.find((p) => p.id === r.ke); return a && b ? { type: "Feature", geometry: { type: "LineString", coordinates: [[a.lon, a.lat], [b.lon, b.lat]] }, properties: {} } : null; }).filter(Boolean) });
  nanti(tabelRute);
}
const namaPort = (id) => L().pelabuhan?.find((p) => p.id === id)?.nama || id;
function tabelRute() {
  const el = document.getElementById("rg3-l-rt"), B = rute(asalDipilih); if (!el) return;
  tabel(el, { satuan: "rg3.l.u_rute", per: 8, urutAwal: 2, menurun: false, kolom: [
    { label: t("rg3.l.asal"), v: (r) => namaPort(r.dari), f: (r) => { const p = L().pelabuhan.find((x) => x.id === r.dari); return `<span class="rg3-neg">${bendera(p?.negara, 16)}<b>${esc(namaPort(r.dari))}</b></span>`; } },
    { label: t("rg3.l.tujuan"), v: (r) => namaPort(r.ke), f: (r) => `<b>${esc(namaPort(r.ke))}</b>` },
    { label: t("rg3.l.jarak"), num: true, v: (r) => r.jarak_garis_km, f: (r) => `${esc(num(r.jarak_garis_km, 0))} km` },
    { label: t("rg3.l.layar"), num: true, v: (r) => r.hari_layar_est, f: (r) => `${esc(num(r.hari_layar_est, 1))} ${esc(t("rg3.l.hr"))}` },
    { label: t("rg3.h.bukti"), v: (r) => r.tingkat_bukti, f: (r) => bukti(r.tingkat_bukti, { tanggal: r.tanggal, cara: r.rumus }) },
  ], baris: B });
}

/* ---------- kalkulator ---------- */
function efektif() {
  const p = produkTerpilih(); if (!p) return null;
  const [muDef, hsDef] = PROFIL[p.id], fobRow = p.dunia[Math.min(+S.f || 0, p.dunia.length - 1)], fob = S.fm !== "" && +S.fm > 0 ? +S.fm : fobRow.usd;
  const hs = p.bm_hs || hsDef, mfn = selisihKomp("bea_masuk")?.per_hs || [], bea = beaMasuk({ hs, asal: S.neg, perjanjian: D.perjanjian?.baris || [], mfn });
  const bm = S.bm !== "" ? +S.bm : bea.pct, tk = S.tk !== "" ? +S.tk : wci()?.usd_40ft || 0, mu = S.mu !== "" ? +S.mu : muDef;
  const ppn = selisihKomp("ppn")?.nilai_persen ?? 11, pph = S.api === "1" ? selisihKomp("pph22_impor")?.nilai_persen ?? 2.5 : selisihKomp("pph22_impor")?.alternatif_persen?.[0]?.nilai_persen ?? 7.5;
  const kr = S.kr !== "" ? +S.kr : kurs0();
  return { p, hs, bea, fobRow, fob, bm, tk, mu, ppn, pph, kr, muDef, asuransi: +S.as || 0, lokal: +S.lo || 0 };
}
function hasil() {
  const e = efektif(), el = document.getElementById("rg3-l-hasil"); if (!el) return;
  if (!e || !e.kr || e.bm == null) { el.innerHTML = `<div class="rg3-info">${ikon("tanya", 18)}<p>${esc(t(e && e.bm == null ? "rg3.l.k.bm_kosong" : "rg3.l.k.tak_lengkap"))}</p></div>`; return; }
  const r = biayaMendarat({ fob: e.fob, tarifKontainer: e.tk, muatanKontainer: e.mu, asuransiPct: e.asuransi, bmPct: e.bm, ppnPct: e.ppn, pph22Pct: e.pph, lokal: e.lokal, kurs: e.kr });
  if (!r) { el.innerHTML = `<div class="rg3-info">${ikon("tanya", 18)}<p>${esc(t("rg3.l.k.tak_lengkap"))}</p></div>`; return; }
  const sat = e.p.satuan.split("/")[1], s0 = cariSumber(H(), e.fobRow.sumber_id), asal = pelabuhanAsal(S.neg, L().pelabuhan), masuk = pelabuhanMasuk(S.prov), rt = (L().rute || []).find((x) => x.dari === asal && x.ke === masuk);
  const bBM = e.bea.jenis === "pref" ? bukti("agregator", { sumber: e.bea.perjanjian ? e.bea.perjanjian.toUpperCase() : "", cara: t("rg3.l.k.cara_pref") }) : bukti("data", { tingkatSumber: cariSumber(H(), selisihKomp("bea_masuk")?.sumber_id)?.tingkat_bukti, sumber: cariSumber(H(), selisihKomp("bea_masuk")?.sumber_id)?.penerbit || "", cara: t("rg3.l.k.cara_mfn") });
  const B = {
    fob: bukti(S.fm !== "" ? "hipotesis" : e.fobRow.tingkat_bukti, { tingkatSumber: s0?.tingkat_bukti, sumber: s0?.penerbit || "", tanggal: e.fobRow.tanggal, cara: e.fobRow.pasar }),
    angkut: bukti("est", { cara: t("rg3.l.k.cara_angkut") }), asuransi: bukti("hipotesis", { cara: t("rg3.l.k.cara_asuransi") }), bm: bBM,
    ppn: bukti(selisihKomp("ppn")?.tingkat_bukti || "est", { cara: selisihKomp("ppn")?.catatan || "" }), pph22: bukti(selisihKomp("pph22_impor")?.tingkat_bukti || "est", { cara: selisihKomp("pph22_impor")?.catatan || "" }),
    lokal: e.lokal ? bukti("hipotesis", { cara: t("rg3.l.k.cara_lokal") }) : `<span class="ih-kosong">-</span>`,
  };
  const nama = { fob: t("rg3.l.k.fob"), angkut: t("rg3.l.k.angkut"), asuransi: t("rg3.l.k.asuransi"), bm: t("rg3.l.k.bm", { pct: num(e.bm, 1) }), ppn: t("rg3.l.k.ppn", { pct: num(e.ppn, 1) }), pph22: t("rg3.l.k.pph22", { pct: num(e.pph, 1) }), lokal: t("rg3.l.k.lokal") };
  const dg = (v) => num(v, v < 1 ? 4 : v < 100 ? 2 : 0), rpf = (v) => num(v, v < 10 ? 2 : 0);
  const baris = POS.map((k) => `<tr><td data-label="${esc(t("rg3.l.k.pos"))}"><span class="rg3-pos"><i class="rg3-sw rg3-s-${k}"></i>${esc(nama[k])}</span></td><td data-label="USD/${esc(sat)}" class="jm-num">${esc(dg(r.pos[k]))}</td><td data-label="Rp/${esc(sat)}" class="jm-num">${uangHtml("Rp", rpf(r.rp[k]))}</td><td data-label="%" class="jm-num">${esc(num((r.pos[k] / r.total) * 100, 1))}%</td><td data-label="${esc(t("rg3.h.bukti"))}">${B[k]}</td></tr>`).join("");
  el.innerHTML = `<div class="rg3-total"><div><span>${esc(t("rg3.l.k.total", { sat }))}</span><b>${uangHtml("Rp", num(r.rp.total, r.rp.total < 10 ? 2 : 0))}</b><small>${esc(t("rg3.l.k.usd", { v: dg(r.total), sat, naik: num(r.kenaikanPct, 1) }))}</small></div><div><span>${esc(t("rg3.l.k.tanpa", { sat }))}</span><b>${uangHtml("Rp", num(r.rp.tanpaPajak, r.rp.tanpaPajak < 10 ? 2 : 0))}</b><small>${esc(t("rg3.l.k.tanpa_n"))}</small></div><div class="rg3-total-b">${bukti("est", { cara: t("rg3.l.k.cara_total") })}</div></div>
    <div id="rg3-l-bar" class="ih-bagan"></div>
    <div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr><th>${esc(t("rg3.l.k.pos"))}</th><th class="jm-num">USD/${esc(sat)}</th><th class="jm-num">Rp/${esc(sat)}</th><th class="jm-num">%</th><th>${esc(t("rg3.h.bukti"))}</th></tr></thead><tbody>${baris}<tr class="rg3-sub-t"><td data-label="${esc(t("rg3.l.k.pos"))}"><b>${esc(t("rg3.l.k.cif"))}</b></td><td data-label="USD/${esc(sat)}" class="jm-num"><b>${esc(dg(r.cif))}</b></td><td data-label="Rp/${esc(sat)}" class="jm-num">${uangHtml("Rp", rpf(r.rp.cif))}</td><td></td><td>${bukti("est")}</td></tr></tbody></table></div>
    <p class="rg3-rute">${ikon("kapal", 16)}<span>${rt ? esc(t("rg3.l.k.rute", { a: namaPort(asal), b: namaPort(masuk), km: num(rt.jarak_garis_km, 0), hr: num(rt.hari_layar_est, 1) })) : esc(t("rg3.l.k.rute_kosong", { b: masuk ? namaPort(masuk) : "-" }))}</span>${rt ? bukti(rt.tingkat_bukti, { cara: rt.rumus }) : ""}</p>`;
  const bar = document.getElementById("rg3-l-bar");
  bar.innerHTML = legendaHtml(POS.map((k) => ({ kelas: "rg3-s-" + k, label: nama[k] }))) + batangSvg({ el: bar, d: r.total < 1 ? 3 : 2, label: t("rg3.l.k.judul"), satuan: "USD/" + sat, seri: POS.map((k) => ({ k, kelas: "rg3-s-" + k })),
    baris: [{ label: e.p.nama, ikon: "tag", tip: `${e.p.nama}: ${dg(r.total)} USD/${sat}`, th: tipHtml(e.p.nama, [[t("rg3.l.k.total", { sat }), `Rp ${num(r.rp.total, 0)}`], ...POS.map((k) => [nama[k], `${dg(r.pos[k])} USD/${sat} (${num((r.pos[k] / r.total) * 100, 1)}%)`])]), bagian: POS.map((k) => ({ k, nilai: r.pos[k] })) }] });
}
const field = (id, label, nilai, ket = "", step = "any") => `<label class="rg3-fld" for="${id}"><span>${esc(label)}</span><input id="${id}" type="number" inputmode="decimal" min="0" step="${step}" value="${esc(nilai)}">${ket ? `<small>${esc(ket)}</small>` : ""}</label>`;
function form() {
  const e = efektif(), p = e.p, el = document.getElementById("rg3-l-form");
  const provOps = Object.entries(PROV).map(([k, [nama]]) => [k, nama, "prov:" + k]), tahun = (r) => r.tanggal ? ` (${r.tanggal})` : "";
  el.innerHTML = `<div class="rg3-form">
    ${pilihHtml({ id: "rg3-l-k", ikon: "tag", label: t("rg3.l.f.komp"), opsi: komp().map((x) => [x.id, x.nama, "tag"]), nilai: p.id })}
    ${pilihHtml({ id: "rg3-l-f", ikon: "kartu", label: t("rg3.l.f.fob"), opsi: p.dunia.map((r, i) => [String(i), `${r.pasar}: ${num(r.usd, r.usd < 1 ? 3 : 1)}${tahun(r)}`, "kartu"]), nilai: String(+S.f || 0) })}
    ${pilihHtml({ id: "rg3-l-neg", ikon: "globe", label: t("rg3.l.f.asal"), opsi: NEGARA_ASAL.map((n) => [n, namaNegara(n), "img:/img/bendera/" + n + ".svg"]), nilai: S.neg })}
    ${pilihHtml({ id: "rg3-l-prov", ikon: "wilayah", label: t("rg3.l.f.prov"), opsi: provOps, nilai: S.prov })}
    ${field("rg3-l-fm", t("rg3.l.f.fm", { sat: p.satuan }), S.fm, t("rg3.l.f.fm_k"))}
    ${field("rg3-l-tk", t("rg3.l.f.tk"), S.tk !== "" ? S.tk : e.tk, t("rg3.l.f.tk_k", { n: wci()?.label ?? "WCI" }))}
    ${field("rg3-l-mu", t("rg3.l.f.mu", { sat: p.satuan.split("/")[1] }), S.mu !== "" ? S.mu : e.muDef, t("rg3.l.f.mu_k"))}
    ${field("rg3-l-as", t("rg3.l.f.as"), S.as, t("rg3.l.f.as_k"), "0.05")}
    ${field("rg3-l-bm", t("rg3.l.f.bm"), S.bm !== "" ? S.bm : e.bea.pct ?? "", t(e.bea.jenis === "pref" ? "rg3.l.f.bm_pref" : e.bea.pct != null ? "rg3.l.f.bm_mfn" : "rg3.l.f.bm_kosong", { hs: e.hs, p: (e.bea.perjanjian || "").toUpperCase() }), "0.5")}
    ${field("rg3-l-lo", t("rg3.l.f.lo", { sat: p.satuan }), S.lo, t("rg3.l.f.lo_k"))}
    ${field("rg3-l-kr", t("rg3.l.f.kr"), S.kr !== "" ? S.kr : e.kr, t("rg3.l.f.kr_k"), "1")}
    <label class="rg3-cek"><input id="rg3-l-api" type="checkbox"${S.api === "1" ? " checked" : ""}><span>${esc(t("rg3.l.f.api"))}</span></label>
  </div>`;
  pasangPilih();
}
const simpanK = () => urlSet({ lk: S.k, lf: S.f ? S.f : "", lneg: S.neg === "cn" ? "" : S.neg, lprov: S.prov === "32" ? "" : S.prov, lfm: S.fm, ltk: S.tk, lmu: S.mu, las: S.as === "0.2" ? "" : S.as, lbm: S.bm, llo: S.lo === "0" ? "" : S.lo, lkr: S.kr, lapi: S.api === "1" ? "" : "0" });

export function mulai(el) {
  if (!berisi("logistik", "tahap") || !komp().length) { el.innerHTML = kosongTab("rg3.l.kosong_data"); return; }
  asalDipilih = urlGet("lasal");
  Object.assign(S, { k: urlGet("lk") || komp()[0].id, f: +urlGet("lf") || 0, neg: urlGet("lneg") || "cn", prov: urlGet("lprov") || "32", fm: urlGet("lfm"), tk: urlGet("ltk"), mu: urlGet("lmu"), as: urlGet("las") || "0.2", bm: urlGet("lbm"), lo: urlGet("llo") || "0", kr: urlGet("lkr"), api: urlGet("lapi") === "0" ? "0" : "1" });
  const asal = (L().pelabuhan || []).filter((p) => p.peran === "asal");
  el.innerHTML = [
    ex({ id: "rg3-l-alur", ikon: "rantai", topik: t("rg3.l.ey.alur"), judulHtml: esc(t("rg3.l.j.alur", { n: num(L().tahap.length) })), subHtml: esc(t("rg3.l.s.alur")), isiHtml: alur() + catatan("rg3.l.n.alur"), kakiHtml: sumberBerkas(L(), ["s-wiki-incoterms", "s-bpk-pmk66", "s-bpk-pmk176", "s-bpk-esdm-2-2021"]) }),
    (L().pelabuhan || []).length ? ex({ id: "rg3-l-rute", ikon: "peta", topik: t("rg3.l.ey.rute"), judulHtml: esc(t("rg3.l.j.rute", { n: num(L().pelabuhan.length), m: num((L().rute || []).length) })), subHtml: esc(t("rg3.l.s.rute")),
      isiHtml: `<div class="jm-saring rg3-saring rg3-saring-1">${pilihHtml({ id: "rg3-l-asal", ikon: "kapal", label: t("rg3.l.f.pilihasal"), opsi: [["", t("rg3.l.f.semua_asal"), "kapal"], ...asal.map((p) => [p.id, `${p.nama} (${namaNegara(p.negara)})`, "img:/img/bendera/" + p.negara.toLowerCase() + ".svg"])], nilai: asalDipilih })}</div><div id="rg3-l-peta" class="rg3-peta" role="region" aria-label="${esc(t("rg3.map.label"))}"></div><div id="rg3-l-rt"></div>${catatan("rg3.l.n.rute")}`, kakiHtml: sumberBerkas(L(), ["s-wiki-pelabuhan"]) }) : "",
    ex({ id: "rg3-l-kalk", ikon: "kalkulator", topik: t("rg3.l.ey.kalk"), judulHtml: esc(t("rg3.l.j.kalk")), subHtml: esc(t("rg3.l.s.kalk")), isiHtml: `<div class="rg3-kalk"><div id="rg3-l-form"></div><div id="rg3-l-hasil" aria-live="polite"></div></div>${catatan("rg3.l.n.kalk")}`, kakiHtml: `<a class="ih-tautan-pil" href="/metode#rantai-global">${ikon("metode", 16)}<span>${esc(t("rg3.l.metode"))}</span></a>` + sumberBerkas(H(), ["s-pmk131", "s-pph22-ortax", "s-btki-2022", "s-kurs"]) + sumberBerkas(L(), ["s-drewry-wci"]) }),
    daftarCelah(L().meta?.celah) ? ex({ id: "rg3-l-celah", ikon: "tanya", topik: t("rg3.celah"), judulHtml: esc(t("rg3.l.j.celah")), isiHtml: daftarCelah(L().meta.celah) }) : "",
  ].join("");
  pasangPilih();
  form(); hasil();
  if ((L().pelabuhan || []).length) { nanti(peta); nanti(tabelRute); }
  const ubahBerat = () => { simpanK(); nanti(hasil); };
  el.addEventListener("change", (e) => {
    const id = e.target.id;
    if (id === "rg3-l-asal") { pilihAsal(e.target.value); return; }
    if (id === "rg3-l-k") { Object.assign(S, { k: e.target.value, f: 0, fm: "", mu: "", bm: "" }); simpanK(); form(); nanti(hasil); return; }
    if (id === "rg3-l-neg") { Object.assign(S, { neg: e.target.value, bm: "" }); simpanK(); form(); nanti(hasil); return; }
    if (id === "rg3-l-f") { S.f = +e.target.value; S.fm = ""; simpanK(); form(); nanti(hasil); return; }
    if (id === "rg3-l-prov") { S.prov = e.target.value; ubahBerat(); return; }
    if (id === "rg3-l-api") { S.api = e.target.checked ? "1" : "0"; ubahBerat(); }
  });
  el.addEventListener("input", (e) => {
    const m = { "rg3-l-fm": "fm", "rg3-l-tk": "tk", "rg3-l-mu": "mu", "rg3-l-as": "as", "rg3-l-bm": "bm", "rg3-l-lo": "lo", "rg3-l-kr": "kr" }[e.target.id];
    if (m) { S[m] = e.target.value; ubahBerat(); }
  });
}
