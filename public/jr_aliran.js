/* /jaringan?tab=aliran (KJ-13): aliran listrik TAHUNAN antarprovinsi (neraca provinsi + panah + batas), semua berstatus Dihitung.
   Data: /data/kembaran/energi.json + /geo/provinsi.json. Kontrak: KEMBARAN-JARINGAN.md §4 butir 9, §6 butir 5.
   INP: sakelar Neraca/Karbon dan pilihan provinsi/sistem memakai setPaintProperty/setFilter; peta tidak dibangun ulang. */
import { t, esc, num, token, ikon, kosongTab } from "/jr_umum.js";
import { tanggal } from "/i18n.js";
import { muatKJ, chipSt, chipSrc, kakiFakta, muatSumber, kakiSumber } from "/jr_kj.js";
import { nanti } from "/inti/umum.js";
import { SKALA, rampIntensitas, pasangGaya } from "/jr_bbm.js";
import { blokProvinsi } from "/jr_kartu.js";
import { petaBersama, pasangPeta, padPeta, bukaPanel, bawahSlot } from "/jr_app.js";

const S = { mode: "neraca", sel: null, E: null, peta: null, geo: null, pusat: new Map(), kotak: new Map(), nama: new Map(), mark: [], pan: [] };
let akar, hidup = true;
const $ = (s) => akar.querySelector(s);
const nm = (k) => S.nama.get(String(k)) || String(k);
const gi = (v, d = 0) => (v == null ? "-" : num(v, d));
const tanda = (v, d = 0) => (v > 0 ? "+" : "") + num(v, d);
const pasangan = (a, b) => S.E.batas.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a));
const provSis = (sid) => [...new Set(S.E.batas.filter((b) => b.sis.includes(sid)).flatMap((b) => [b.a, b.b]))];
const bauranProv = (k) => S.E.bauran.provinsi.find((p) => p.kode === k);

/* ---- geometri ---- */
function kotakGeo(g) { // bbox [w,s,e,n] dari koordinat bersarang
  let w = 1e9, s = 1e9, e = -1e9, n = -1e9;
  (function jelajah(a) { if (typeof a[0] === "number") { w = Math.min(w, a[0]); e = Math.max(e, a[0]); s = Math.min(s, a[1]); n = Math.max(n, a[1]); } else for (const x of a) jelajah(x); })(g.coordinates);
  return [w, s, e, n];
}

/* ---- peta ---- */
const ekspresWarna = () => {
  const abu = token("--line");
  if (S.mode === "karbon") return ["case", ["<", ["get", "p"], 0], abu, rampIntensitas(["get", "p"])];
  return ["case", ["<", ["get", "n"], -900], abu, ["interpolate", ["linear"], ["get", "n"], -30, token("--tp-simpan"), 0, token("--line"), 30, token("--ok")]];
};
function pasangLapis(peta) {
  if (!peta.getSource("ka-prov")) peta.addSource("ka-prov", { type: "geojson", data: S.geo });
  peta.addLayer({ id: "ka-isi", type: "fill", source: "ka-prov", paint: { "fill-color": ekspresWarna(), "fill-opacity": 0.78 } });
  peta.addLayer({ id: "ka-gar", type: "line", source: "ka-prov", paint: { "line-color": token("--ink2"), "line-width": 0.5, "line-opacity": 0.6 } });
  peta.addLayer({ id: "ka-sel", type: "line", source: "ka-prov", filter: ["==", ["get", "kode"], S.sel?.tipe === "prov" ? S.sel.id : "-"], paint: { "line-color": token("--head"), "line-width": 2.5 } });
  const fit = S.E.batas.filter((b) => S.pusat.has(b.dari) && S.pusat.has(b.ke));
  if (!peta.getSource("ka-ali")) peta.addSource("ka-ali", { type: "geojson", data: { type: "FeatureCollection", features: fit.map((b) => ({ type: "Feature", properties: { mw: b.mw }, geometry: { type: "LineString", coordinates: [S.pusat.get(b.dari), S.pusat.get(b.ke)] } })) } });
  peta.addLayer({ id: "ka-ali", type: "line", source: "ka-ali", layout: { "line-cap": "round" }, paint: { "line-color": token("--head"), "line-opacity": 0.85, "line-width": ["interpolate", ["linear"], ["get", "mw"], 0, 1.5, 1500, 7] } });
  vis();
}
/** Label MW: yang terbesar menang; yang kecil (<100 MW) baru muncul mulai zoom 5, label batas mulai zoom 5, dan label yang bertumpuk disembunyikan. */
function aturLabel() {
  const peta = S.peta; if (!peta || !hidup) return;
  const z = peta.getZoom(), ambil = [];
  for (const p of [...S.pan].sort((a, b) => b.mw - a.mw)) {
    p.el.style.display = "";
    p.el.querySelector("small")?.toggleAttribute("hidden", z < 5);
    const hilang = (z < 5 && p.mw < 100) || ambil.some((r) => { const q = p.el.getBoundingClientRect(); return q.left < r.right && q.right > r.left && q.top < r.bottom && q.bottom > r.top; });
    if (hilang) p.el.style.display = "none"; else ambil.push(p.el.getBoundingClientRect());
  }
}
function vis() {
  for (const id of ["ka-isi", "ka-gar", "ka-sel", "ka-ali"]) if (S.peta?.getLayer(id)) S.peta.setLayoutProperty(id, "visibility", hidup ? "visible" : "none");
  if (hidup) aturLabel(); else for (const m of S.mark) m.getElement().style.display = "none";
}
/** Dipanggil cangkang saat tab Aliran aktif/tidak. */
export function aktif(on) { hidup = on; vis(); if (!on) S.pop?.remove(); }
function panah(b) { // penanda panah + label MW di tengah garis (DOM; dibuat sekali)
  const a = S.pusat.get(b.dari), z = S.pusat.get(b.ke); if (!a || !z) return;
  const sudut = (Math.atan2(-(z[1] - a[1]), z[0] - a[0]) * 180) / Math.PI;
  const el = document.createElement("span");
  el.className = "kje-pan" + (b.batas_mw != null ? " kje-pan-batas" : "");
  el.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 12h15M12 5l7 7-7 7"/></svg><b>${esc(num(b.mw))} MW</b>${b.batas_mw != null ? `<small>${esc(t("kj.al.batas_n", { mw: num(b.batas_mw) }))}</small>` : ""}`;
  el.querySelector("svg").style.transform = `rotate(${sudut.toFixed(0)}deg)`;
  el.title = t("kj.al.arah", { a: nm(b.dari), b: nm(b.ke) }) + ", " + num(b.mw) + " MW" + (b.batas_mw != null ? ", " + t("kj.al.batas_n", { mw: num(b.batas_mw) }) : "");
  const mk = new maplibregl.Marker({ element: el }).setLngLat([(a[0] + z[0]) / 2, (a[1] + z[1]) / 2]).addTo(S.peta);
  S.mark.push(mk); S.pan.push({ el, mk, mw: b.mw, batas: b.batas_mw != null });
}
function paint() {
  const peta = S.peta; if (!peta?.getLayer("ka-isi")) return;
  peta.setPaintProperty("ka-isi", "fill-color", ekspresWarna());
  peta.setFilter("ka-sel", ["==", ["get", "kode"], S.sel?.tipe === "prov" ? S.sel.id : "-"]);
}
async function bangunPeta() {
  const el = $("#ka-beranda"); if (!el) return;
  const g = await fetch("/geo/provinsi.json", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  if (!g) { el.insertAdjacentHTML("afterbegin", `<p class="kj-cat">${esc(t("kj.al.peta.kosong"))}</p>`); return; }
  for (const f of g.features) { const k = kotakGeo(f.geometry); S.kotak.set(f.properties.kode, k); S.pusat.set(f.properties.kode, [(k[0] + k[2]) / 2, (k[1] + k[3]) / 2]); }
  for (const n of S.E.neraca) { const ps = (n.provinsi || []).map((k) => S.pusat.get(k)).filter(Boolean); if (ps.length > 1 && !S.pusat.has(n.kode)) S.pusat.set(n.kode, [ps.reduce((a, c) => a + c[0], 0) / ps.length, ps.reduce((a, c) => a + c[1], 0) / ps.length]); }
  const ner = new Map(S.E.neraca.flatMap((n) => [n.kode, ...(n.provinsi || [])].map((k) => [k, n]))), bp = new Map(S.E.bauran.provinsi.map((p) => [p.kode, p]));
  const own = (k) => bp.get(k)?.langsung, pakai = new Map(); // karbon dipakai: milik sendiri + tertimbang dari provinsi asal aliran masuk
  for (const n of S.E.neraca) {
    const masuk = S.E.batas.filter((b) => b.ke === n.kode && own(b.dari) != null), gm = n.segmen?.masuk?.gwh || 0, gb = masuk.reduce((a, b) => a + b.gwh, 0), lok = n.segmen?.lokal?.gwh || 0;
    if (own(n.kode) == null) continue;
    pakai.set(n.kode, gm > 0 && gb > 0 && lok + gm > 0 ? (lok * own(n.kode) + gm * (masuk.reduce((a, b) => a + b.gwh * own(b.dari), 0) / gb)) / (lok + gm) : own(n.kode));
  }
  S.geo = { type: "FeatureCollection", features: g.features.map((f) => { const n = ner.get(f.properties.kode), b = bp.get(f.properties.kode); return { type: "Feature", properties: { kode: f.properties.kode, n: n ? n.persen : -999, l: b?.langsung ?? -1, p: pakai.get(f.properties.kode) ?? -1 }, geometry: f.geometry }; }) };
  S.peta = await petaBersama();
  const peta = S.peta; if (!peta) { el.insertAdjacentHTML("afterbegin", `<p class="kj-cat">${esc(t("kj.al.peta.gagal"))}</p>`); return; }
  pasangPeta(pasangLapis);
  for (const b of S.E.batas) panah(b);
  peta.on("zoomend", aturLabel); peta.on("moveend", aturLabel);
  vis();
  const pop = S.pop = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 8, className: "rg3-pop" });
  peta.on("mousemove", "ka-isi", (e) => {
    const k = e.features?.[0]?.properties?.kode, n = ner.get(k); if (!n) { pop.remove(); return; }
    peta.getCanvas().style.cursor = "pointer";
    pop.setLngLat(e.lngLat).setHTML(`<div class="rg3-tipm"><b>${esc(n.nama)}</b><span><em>${esc(t("kj.al.st." + n.status))}</em><strong>${tanda(n.neraca_gwh)} GWh</strong></span></div>`).addTo(peta);
  });
  peta.on("mouseleave", "ka-isi", () => { peta.getCanvas().style.cursor = ""; pop.remove(); });
  peta.on("click", "ka-isi", (e) => { const k = e.features?.[0]?.properties?.kode; if (k && ner.has(k)) pilih("prov", ner.get(k).kode); });
}

/* ---- panel ---- */
function legenda() {
  if (S.mode === "karbon") return `<div class="kje-skala"><span>${num(SKALA.min)}</span><i class="kje-grad"></i><span>${num(SKALA.maks)}+ g/kWh</span><em><i class="kje-sw kje-sw-abu"></i>${esc(t("kj.ba.tak"))}</em></div><p class="kj-cat">${esc(t("kj.al.karbon_cat"))}</p>`;
  return `<div class="kje-skala"><span>${esc(t("kj.al.leg.impor"))}</span><i class="kje-grad kje-grad-n"></i><span>${esc(t("kj.al.leg.ekspor"))}</span></div>`;
}
function daftarSistem() {
  const rows = [...S.E.aliran_sistem].sort((a, b) => b.mw - a.mw).map((s) => {
    const p = pasangan(s.a, s.b);
    return `<li><button type="button" class="kje-sis" data-aksi="sis" data-id="${esc(s.sis)}" aria-pressed="${S.sel?.tipe === "sis" && S.sel.id === s.sis}">
      <span class="kje-sis-n">${esc(s.nama)}</span><b>${num(s.mw)}<small>MW</small></b><span class="kje-sis-s">${esc(t("kj.al.arah", p ? { a: nm(p.dari), b: nm(p.ke) } : { a: nm(s.a), b: nm(s.b) }))}</span></button></li>`;
  }).join("");
  return rows;
}
const chipStatus = (n) => `<span class="kje-ns kje-ns-${esc(n.status)}">${esc(t("kj.al.st." + n.status))}</span>`;

function rincianSistem(sid) {
  const s = S.E.aliran_sistem.find((x) => x.sis === sid); if (!s) return "";
  const p = pasangan(s.a, s.b), prov = provSis(sid).map((k) => S.E.neraca.find((n) => n.kode === k)).filter(Boolean).sort((a, b) => b.neraca_gwh - a.neraca_gwh);
  return `<h3 class="kje-j">${esc(s.nama)}</h3>
    <div class="kj-angs kje-angs-2"><div class="kj-ang"><b>${num(s.mw)}<small>MW</small></b><span>${esc(t("kj.al.terbesar"))}</span></div>
      <div class="kj-ang"><b class="kje-ang-t">${esc(t("kj.al.arah", p ? { a: nm(p.dari), b: nm(p.ke) } : { a: nm(s.a), b: nm(s.b) }))}</b><span>${esc(t("kj.al.batas_terbesar"))}</span></div></div>
    ${kakiFakta(s.st, s.src, s.tgl)}<h4>${esc(t("kj.al.prov_sistem"))}</h4>
    <ul class="kje-daftar">${prov.map((n) => `<li><button type="button" class="kje-sis" data-aksi="prov" data-id="${esc(n.kode)}"><span class="kje-sis-n">${esc(n.nama)}</span><b>${tanda(n.neraca_gwh)}<small>GWh</small></b>${chipStatus(n)}</button></li>`).join("")}</ul>`;
}
function barisBatas(b, k) {
  const lain = b.a === k ? b.b : b.a, arah = t(b.dari === k ? "kj.al.keluar" : "kj.al.masuk");
  const sirkit = Object.entries(b.sirkit_per_kv || {}).map(([kv, c]) => t("kj.al.sirkit", { n: c, kv })).join(", ");
  const cap = b.batas_mw != null ? `<span class="kje-ns kje-ns-defisit">${esc(t("kj.al.batas_n", { mw: num(b.batas_mw) }))}</span>${chipSrc(b.batas_src)}` : "";
  const lebih = (b.melebihi_puncak ? `<span class="kje-ns kje-ns-defisit">${esc(t("kj.al.melebihi_c"))}</span><small class="kj-cat">${esc(t("kj.al.melebihi"))}</small>` : "") + (b.jauh_di_bawah_terbit ? `<span class="kje-ns kje-ns-defisit">${esc(t("kj.al.jauh_c"))}</span><small class="kj-cat">${esc(t("kj.al.jauh"))}</small>` : "") + (b.batas_info || []).map((x) => `<small class="kj-cat">${esc(t("kj.al.batas_info", { mw: num(x.mw ?? x.batas_mw), jenis: x.jenis ?? "-" }))}${chipSrc(x.src || x.batas_src)}</small>`).join("");
  return `<li><span><b>${esc(nm(lain))}</b> ${esc(arah)}</span><b>${num(b.mw)} <small>MW</small></b><span>${esc(sirkit)}</span>${cap}${chipSt(b.st)}${chipSrc(b.src)}${lebih}</li>`;
}
function rincianProv(k) {
  const n = S.E.neraca.find((x) => x.kode === k); if (!n) return "";
  const sg = n.segmen || {}, tot = ["lokal", "keluar", "masuk", "tak_tertutup"].reduce((a, j) => a + (sg[j]?.gwh || 0), 0) || 1;
  const KOMP = [["lokal", "--line-ctl", "kj.al.seg.lokal"], ["keluar", "--ok", "kj.al.seg.keluar"], ["masuk", "--tp-simpan", "kj.al.seg.masuk"], ["tak_tertutup", "", "kj.al.seg.tak"]];
  const bar = KOMP.filter(([j]) => sg[j]?.gwh > 0).map(([j, c]) => `<i class="${c ? "" : "kje-arsir"}" ${c ? `data-c="${c}"` : ""} data-w="${((sg[j].gwh / tot) * 100).toFixed(2)}" title="${esc(t(KOMP.find((x) => x[0] === j)[2]))}"></i>`).join("");
  const leg = KOMP.map(([j, c, kk]) => `<li><i class="kje-sw ${c ? "" : "kje-arsir"}" ${c ? `data-c="${c}"` : ""}></i><span>${esc(t(kk))}</span><b>${gi(sg[j]?.gwh)} GWh</b><small>${gi(sg[j]?.mw)} MW</small></li>`).join("");
  const sb = S.E.batas.filter((b) => b.a === k || b.b === k);
  const asal = sb.filter((b) => b.ke === k).map((b) => nm(b.dari));
  const bs = bauranProv(k);
  return `<h3 class="kje-j">${esc(n.nama)}</h3><p class="kje-pn-m">${chipStatus(n)}<span class="kj-tgl">${esc(t("kj.al.tahunan", { tahun: S.E.meta.tahun_data }))}</span></p>
    <div class="kj-angs"><div class="kj-ang"><b>${gi(n.produksi_gwh)}<small>GWh</small></b><span>${esc(t("kj.al.dibangkitkan"))}</span></div>
      <div class="kj-ang"><b>${gi(n.kebutuhan_gwh)}<small>GWh</small></b><span>${esc(t("kj.al.dipakai"))}</span></div>
      <div class="kj-ang"><b>${tanda(n.neraca_gwh)}<small>GWh</small></b><span>${esc(t("kj.al.neraca", { persen: tanda(n.persen, 1) }))}</span></div></div>
    <span class="kje-bar kje-bar-seg" role="img" aria-label="${esc(t("kj.al.seg.aria"))}">${bar}</span><ul class="kje-leg kje-leg-seg">${leg}</ul>
    <p class="kj-cat">${esc(asal.length ? t("kj.al.asal", { dari: asal.join(", ") }) : t("kj.al.asal_lokal"))}</p>
    ${bs?.langsung != null ? `<p class="kj-cat">${esc(t("kj.al.karbon_prov", { v: num(bs.langsung) }))}</p>` : ""}
    ${kakiFakta(n.st, n.src, n.tgl)}
    <section class="kje-blok kje-blok-d"><h4>${esc(t("kj.al.batas_prov"))}</h4>${sb.length ? `<ul class="kje-banding">${sb.map((b) => barisBatas(b, k)).join("")}</ul>` : `<p class="kj-cat">${esc(t("kj.al.tanpa_batas"))}</p>`}
    <p class="kj-cat">${esc(t("kj.al.batas_kalimat"))}</p></section>${blokProvinsi(S.E.kartu_provinsi?.find((x) => x.kode === k), { jual: true, patah: S.E.meta?.keandalan_patah })}`;
}
function rincian() {
  if (S.sel?.tipe === "prov") return rincianProv(S.sel.id);
  if (S.sel?.tipe === "sis") return rincianSistem(S.sel.id);
  return `<p class="kj-cat">${esc(t("kj.al.pilih"))}</p>`;
}

/* ---- dicek dengan angka terbitan PLN ---- */
function cek() {
  let rows = S.E.kiriman_terbit || [];
  if (S.sel?.tipe === "sis") { const ps = new Set(provSis(S.sel.id)); rows = rows.filter((r) => r.kami && (ps.has(String(r.kami.dari)) || ps.has(String(r.kami.ke)))); }
  const sbd = { langsung: "kj.al.cek.langsung", tidak: "kj.al.cek.tidak", berlawanan: "kj.al.cek.lawan" };
  const isi = rows.map((r) => {
    const kami = r.kami, mw = r.terbit_mw ?? r.mw, balik = mw < 0, a = (balik ? r.ke : r.dari) ?? "-", b = (balik ? r.dari : r.ke) ?? "-", tg = r.tanggal_terbit || r.tgl;
    return `<li class="kje-cek-${esc(r.sebanding)}"><span class="kje-cek-p"><b>${esc(t("kj.al.arah", { a: r.dari ?? "-", b: r.ke ?? "-" }))}</b></span>
      <span>${esc(t("kj.al.cek.terbit"))}: <b>${mw == null ? "-" : num(Math.abs(mw)) + " MW"}</b>${mw == null ? "" : ` ${esc(t("kj.al.arah", { a, b }))}`}</span>
      <span>${esc(t("kj.al.cek.kami"))}: <b>${kami ? gi(kami.mw) + " MW" : "-"}</b>${kami ? ` ${esc(t("kj.al.arah", { a: nm(kami.dari), b: nm(kami.ke) }))}` : ""}</span>
      ${r.selisih_mw != null && !r.arah_berlawanan && !r.catatan_tegangan ? `<span>${esc(t("kj.al.cek.selisih"))}: <b>${tanda(r.selisih_mw)} MW${r.selisih_persen != null ? ` (${tanda(r.selisih_persen, 1)}%)` : ""}</b></span>` : ""}
      <span class="kj-kaki"><span class="kje-sb kje-sb-${esc(r.sebanding)}">${esc(t(sbd[r.sebanding] || sbd.tidak))}</span>${chipSt(r.st)}${chipSrc(r.src?.id || r.src)}${tg ? `<span class="kj-tgl">${esc(t("kj.al.cek.beban_puncak", { tgl: tanggal(tg) }))}</span>` : ""}</span>
      ${r.arah_berlawanan ? `<span class="kje-ns kje-ns-defisit">${esc(t("kj.al.cek.lawan"))}</span>` : ""}${r.catatan_tegangan ? `<small class="kj-cat">${esc(r.catatan_tegangan)}</small>` : ""}${r.melebihi_puncak ? `<span class="kje-ns kje-ns-defisit">${esc(t("kj.al.melebihi_c"))}</span>` : ""}${r.jauh_di_bawah_terbit ? `<span class="kje-ns kje-ns-defisit">${esc(t("kj.al.jauh_c"))}</span>` : ""}${r.alasan ? `<small class="kj-cat">${esc(r.alasan)}</small>` : ""}${r.tanpa_batas ? `<small class="kj-cat">${esc(t("kj.al.cek.tanpa_batas", { mw: num(r.tanpa_batas.mw) }))}</small>` : ""}</li>`;
  }).join("");
  return `<h3 class="kje-j">${esc(t("kj.al.cek.j"))}</h3>${rows.length ? `<ul class="kje-banding kje-cek">${isi}</ul>` : `<p class="kj-cat">${chipSt("menunggu")} ${esc(t("kj.al.cek.kosong"))}</p>`}`;
}

/* ---- interaksi ---- */
function segarkanPanel() { $("#ka-rinci").innerHTML = rincian(); $("#ka-cek").innerHTML = cek(); $("#ka-daftar").innerHTML = daftarSistem(); pasangGaya(akar); }
function pilih(tipe, id) {
  S.sel = S.sel?.tipe === tipe && S.sel.id === id ? null : { tipe, id };
  for (const b of akar.querySelectorAll("#ka-daftar .kje-sis")) b.setAttribute("aria-pressed", String(S.sel?.tipe === "sis" && b.dataset.id === S.sel.id)); // chrome urgent
  $("#ka-beranda").hidden = !!S.sel; $("#ka-detail").hidden = !S.sel;
  paint();
  if (S.sel) bukaPanel();
  else S.peta?.easeTo({ padding: padPeta(), duration: 300 });
  if (S.sel && S.peta) {
    const ks = S.sel.tipe === "prov" ? [S.sel.id] : provSis(S.sel.id), bs = ks.map((k) => S.kotak.get(k)).filter(Boolean);
    if (bs.length) S.peta.fitBounds([[Math.min(...bs.map((b) => b[0])), Math.min(...bs.map((b) => b[1]))], [Math.max(...bs.map((b) => b[2])), Math.max(...bs.map((b) => b[3]))]], { padding: padPeta(), maxZoom: 7, duration: 400 });
  }
  nanti(segarkanPanel);
}
function ganti(m) {
  if (m === S.mode) return;
  S.mode = m;
  for (const b of bawahSlot("aliran").querySelectorAll("[data-mode]")) b.setAttribute("aria-pressed", String(b.dataset.mode === m)); // chrome urgent
  paint();
  nanti(() => { document.getElementById("ka-legenda").innerHTML = legenda(); });
}

export async function mulai(el) {
  akar = el;
  const E = await muatKJ("energi");
  if (!E?.neraca?.length || !E.batas) { el.innerHTML = kosongTab("kj.al.kosong"); return; }
  S.E = E; await muatSumber();
  for (const k of E.kartu_provinsi || []) S.nama.set(k.kode, k.nama);
  for (const n of E.neraca) S.nama.set(n.kode, n.nama);
  const tahun = E.meta?.tahun_data;
  const sakelar = ["neraca", "karbon"].map((m) => `<button type="button" class="kj-mb" data-mode="${m}" aria-pressed="${m === S.mode}">${esc(t("kj.al.mode." + m))}</button>`).join("");
  const slot = bawahSlot("aliran");
  slot.innerHTML = `<div class="kj-mode" role="group" aria-label="${esc(t("kj.al.mode.j"))}">${sakelar}</div><div id="ka-legenda">${legenda()}</div>`;
  el.innerHTML = `<div id="ka-beranda" class="jr-ber"><p class="kj-kaki">${chipSt("hitung")}<span class="kj-tgl">${esc(t("kj.al.tahunan", { tahun }))}</span><span class="kj-tgl">${esc(t("kj.per", { tgl: tanggal(E.meta?.tanggal) }))}</span></p>
    <p class="kj-cat">${esc(t("kj.al.s", { tahun }))}</p>
    <section class="kje-blok"><h3 class="kje-j">${esc(t("kj.al.daftar.j"))}</h3><p class="kj-cat">${esc(t("kj.al.daftar.cat"))}</p><ul class="kje-daftar" id="ka-daftar">${daftarSistem()}</ul></section></div>
    <div id="ka-detail" class="jr-ber" hidden><button type="button" class="jr-kembali" data-kembali>${ikon("panah-kiri", 16)}<span>${esc(t("jr.app.kembali"))}</span></button>
      <section class="kje-blok" id="ka-rinci" aria-live="polite">${rincian()}</section></div>
    <section class="kje-blok" id="ka-cek">${cek()}</section>
    <p class="kj-cat">${esc(t("kj.al.catatan", { susut: num(E.meta?.susut_nasional_persen, 2) }))}</p><div class="jr-kaki-sumber">${kakiSumber(E.meta)}</div>`;
  pasangGaya(el);
  const klik = (e) => {
    const m = e.target.closest("[data-mode]"); if (m) { ganti(m.dataset.mode); return; }
    const b = e.target.closest("[data-aksi]"); if (b) { pilih(b.dataset.aksi, b.dataset.id); return; }
    if (e.target.closest("[data-kembali]") && S.sel) pilih(S.sel.tipe, S.sel.id);
  };
  akar.addEventListener("click", klik); slot.addEventListener("click", klik);
  nanti(bangunPeta);
}
