/* /jaringan, tab Peta jaringan: peta penuh lebar (MapLibre) dengan panel lapis dan panel detail yang bisa digeser.
   Lapis: transmisi dan gardu OSM (geo/transmisi.json, geo/gardu.json), interkoneksi antar-pulau dan lintas negara (garis skematik, bukan trase).
   Kembaran (KJ-05): ruas, gardu, pembangkit dari potret public/data/kembaran + geo/kembaran.json, tiga mode warna, kartu objek tujuh jenis.
   INP: nyala/mati lapis hanya setLayoutProperty; sorot hover mengubah satu properti cat; berkas geo berat dimuat lewat nanti(). */
import { D, ex, t, esc, ikon, num, bendera, L, chipStatus, buktiSumber, catatan, daftarCelah, kosongTab, token, gelap, sumberBerkas } from "/jr_umum.js";
import { fiturSkematik, kelasKv } from "/jaringan_hitung.js";
import { tanggal } from "/i18n.js";
import { muatKJ, chipSt, chipSrc } from "/jr_kj.js";
import { nanti } from "/inti/umum.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { geserPanel } from "/inti/panel_geser.js";

let peta = null;
const LAPIS = [
  { k: "ruas", lb: "kj.peta.lapis.ruas", ik: "menara", lapisan: ["jr-kr", "jr-kr-sel", "jr-kr-hit", "jr-tr"] },
  { k: "gardu", lb: "kj.peta.lapis.gardu", ik: "petir", lapisan: ["jr-kg", "jr-kg-sel", "jr-kgl", "jr-gi"] },
  { k: "pb", lb: "kj.peta.lapis.pb", ik: "petir", lapisan: ["jr-kp", "jr-kp-sel", "jr-kpl"] },
  { k: "antarpulau", lb: "jr.lapis.antarpulau", ik: "sambung", lapisan: ["jr-rc"] },
  { k: "lintas", lb: "jr.lapis.lintas", ik: "asean", lapisan: ["jr-ln"] },
];
/* ---- kembaran ---- */
const KELAS = ["500", "230-275", "115-150", "66-70", "tak"];
const WARNA_KELAS = { "500": "--bad", "230-275": "--warn", "115-150": "--data1", "66-70": "--data4", tak: "--ink2" };
const kelasDari = (kv) => (!kv ? "tak" : kv >= 450 ? "500" : kv >= 200 ? "230-275" : kv >= 100 ? "115-150" : kv >= 66 ? "66-70" : "tak");
const PAL = ["--data1", "--data2", "--data3", "--data4", "--data5", "--tp-panas", "--tp-simpan", "--tp-adil", "--tp-industri", "--tp-surya", "--tp-bayu", "--tp-bio"];
const WARNA_BB = { batubara: "--tp-karbon", gas: "--tp-biaya", diesel: "--tp-sampah", "panas-bumi": "--tp-panas", hidro: "--tp-hidro", surya: "--tp-surya", bayu: "--tp-bayu", bioenergi: "--tp-bio" };
const JENIS = ["op", "sis", "prov", "pb", "gi", "jl", "rs"];
const TILE = { rs: ["tegangan", "panjang", "sirkit"], jl: ["tegangan", "panjang", "sirkit"], gi: ["tegangan", "kapasitas_trafo", "jalur_masuk"], pb: ["kapasitas", "bahan_bakar", "tahun_operasi"], sis: ["panjang", "gardu", "pembangkit_pln"], prov: ["panjang", "gardu", "kapasitas_trafo"], op: ["panjang", "gardu", "pembangkit"] };
const SAT_MENTAH = new Set(["km", "MW", "MVA", "kV"]);
const IDX = new Map(), GRS = new Map(), GPT = new Map(), GIRS = new Map(), JLRS = new Map();
let FAKTA = null; /* objek-fakta.json: dimuat saat kartu pertama dibuka */
const S = { kj: null, mode: "tegangan", sel: null, tanda: [], hit: null };
const ge = (id) => document.getElementById(id);
const warna = (n) => token(n);
const SEMUA = () => [...(D.m.antar_pulau || []), ...(D.m.lintas_negara?.negara || [])];
const warnaStatus = () => ({ beroperasi: token("--ok"), konstruksi: token("--info"), "pra-konstruksi": token("--info"), rencana: token("--warn"), studi: token("--data3"), kajian: token("--tp-hidrogen"), "kajian-lanjut": token("--tp-industri"), "tidak-layak": token("--bad") });
const exprStatus = () => ["match", ["get", "status"], ...Object.entries(warnaStatus()).flat(), token("--ink2")];

function detail(id) {
  const x = SEMUA().find((r) => r.id === id), el = document.getElementById("jr-pn-isi");
  if (!x || !el) return;
  const neg = x.negara ? `<span class="rg3-neg">${bendera(x.negara, 20)}<b>${esc(L(x.mitra))}</b></span>` : "";
  el.innerHTML = `<h3 class="jr-pn-j">${esc(L(x.nama))}</h3>${neg}<p class="jr-pn-m">${chipStatus(x.status)}${x.tegangan_kv ? `<span class="rg3-lain">${esc(num(x.tegangan_kv))} kV</span>` : ""}${x.kapasitas_mw ? `<span class="rg3-lain">${esc(num(x.kapasitas_mw))} MW</span>` : ""}${(x.cod || x.tahun) ? `<span class="rg3-lain">${esc(t("jr.cod"))} ${esc(String(x.cod || x.tahun))}</span>` : ""}</p><p class="jr-pn-t">${esc(L(x.ket))}</p><p class="jr-pn-b">${buktiSumber(x.bukti, x.sumber_id)}</p>`;
  document.getElementById("jr-pn").open = true;
}
function sorot(id) {
  if (!peta?.getLayer("jr-rc")) return;
  const op = id ? ["case", ["==", ["get", "id"], id], 1, 0.28] : 0.9;
  for (const l of ["jr-rc", "jr-ln"]) peta.setPaintProperty(l, "line-opacity", op);
}

function pasangGeo(skem) {
  peta.addSource("jr-skem", { type: "geojson", data: skem });
  for (const [idL, jenis, lebar] of [["jr-rc", "antar-pulau", 2.5], ["jr-ln", "lintas", 3.5]])
    peta.addLayer({ id: idL, type: "line", source: "jr-skem", filter: ["==", ["get", "jenis"], jenis], layout: { "line-cap": "round" }, paint: { "line-color": exprStatus(), "line-width": lebar, "line-dasharray": [2, 1.6], "line-opacity": 0.9 } });
  const pop = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10, className: "rg3-pop", maxWidth: "300px" });
  for (const idL of ["jr-rc", "jr-ln"]) {
    peta.on("mousemove", idL, (e) => {
      const f = e.features?.[0]; if (!f) return;
      const x = SEMUA().find((r) => r.id === f.properties.id); if (!x) return;
      peta.getCanvas().style.cursor = "pointer"; sorot(x.id);
      pop.setLngLat(e.lngLat).setHTML(`<div class="rg3-tipm"><b>${x.negara ? bendera(x.negara, 20) : ""}${esc(L(x.nama))}</b><span><em>${esc(t("jr.status"))}</em><strong>${esc(t("jr.st." + x.status))}</strong></span>${x.kapasitas_mw ? `<span><em>${esc(t("jr.kap"))}</em><strong>${esc(num(x.kapasitas_mw))} MW</strong></span>` : ""}<small>${esc(t("jr.peta.skematik_pendek"))}</small></div>`).addTo(peta);
    });
    peta.on("mouseleave", idL, () => { peta.getCanvas().style.cursor = ""; pop.remove(); sorot(null); });
  }
  /* bendera negara mitra di ujung garis lintas negara */
  for (const x of D.m.lintas_negara?.negara || []) {
    if (!x.garis || !/^[a-z]{2,3}$/i.test(x.negara || "")) continue;
    const m = document.createElement("button"); m.type = "button"; m.className = "jr-bd"; m.setAttribute("aria-label", `${L(x.mitra)}: ${L(x.nama)}`);
    m.innerHTML = `<img src="/img/bendera/${esc(x.negara)}.svg" alt="" width="28" height="28" data-galat="hapus">`;
    m.addEventListener("click", () => detail(x.id));
    new maplibregl.Marker({ element: m }).setLngLat(x.garis.at(-1)).addTo(peta);
  }
}

/* ---------- kembaran: data ---------- */
const fk = (o, k) => o.fakta?.find((x) => x.k === k);
const rsDariJl = (id) => JLRS.get(id) || [];
const jlNama = (o) => { const a = IDX.get(o.a)?.o?.nama, b = IDX.get(o.b)?.o?.nama; return a && b ? t("kj.peta.jl_ab", { a, b }) : t("kj.peta.jl_n", { kv: num(o.kv) }); };
const nm = (j, o) => (j === "rs" ? o.nama || IDX.get(o.jl)?.o?.nama || t("kj.peta.ruas_n", { kv: num(o.kv) }) : j === "jl" ? o.nama || jlNama(o) : o.nama || o.id);
const lab = (k) => t("kj.peta.f." + k);
const tglTeks = (x) => tanggal(x);
function nilai(f) {
  if (!f || f.v == null) return "-";
  if (f.sat === "bool") return esc(t(f.v ? "kj.peta.ya" : "kj.peta.tidak"));
  if (typeof f.v === "number") return esc(num(f.v, Number.isInteger(f.v) ? 0 : 1)) + (f.sat === "tahun" || !f.sat ? "" : ` <small>${esc(SAT_MENTAH.has(f.sat) ? f.sat : t("kj.peta.sat." + f.sat))}</small>`);
  return esc(f.k === "bahan_bakar" ? t("kj.peta.bb." + f.v) : String(f.v));
}
function indeks(kj) {
  for (const j of JENIS) for (const o of kj.objek[j] || []) IDX.set(o.id, { j, o });
  for (const g of kj.geo.rs || []) GRS.set(g.id, g.c);
  for (const j of ["gi", "pb"]) for (const g of kj.geo[j] || []) GPT.set(g.id, [g.x, g.y]);
  const sis = (kj.ringkas?.sistem || kj.objek.sis).filter((x) => !x.potongan);
  S.rank = new Map(sis.map((x, i) => [x.id, i]));
  S.nPotongan = kj.objek.sis.filter((x) => x.potongan).length;
  const ob = kj.objek;
  S.tg = { rs: null, jl: [ob.jl.filter((x) => x.tunggal).length, ob.jl.length], gi: [ob.gi.filter((x) => x.satu_masuk).length, ob.gi.length] };
}
/** Ruas menyusul sesudah bingkai pertama: indeks ruas, gardu ujung, ruas per jalur, lalu atribut cat ruas diisi. */
function indeksRs(kj, rsb) {
  kj.objek.rs = rsb.rs;
  for (const r of rsb.rs) { IDX.set(r.id, { j: "rs", o: r }); for (const g of r.gi || []) if (g) { if (!GIRS.has(g)) GIRS.set(g, []); GIRS.get(g).push(r.id); } }
  for (const [id, v] of Object.entries(rsb.jl_rs || {})) JLRS.set(id, v);
  S.tg.rs = [rsb.rs.filter((x) => x.sirkit === 1).length, rsb.rs.length];
}
const fiturRuas = (kj) => ({ type: "FeatureCollection", features: kj.geo.rs.map((g) => { const o = IDX.get(g.id)?.o || {}; return { type: "Feature", properties: { id: g.id, k: kelasDari(g.kv), sis: o.sis || "", op: o.op || "", jl: o.jl || "", pv: o.prov?.length ? `|${o.prov.join("|")}|` : "", m: o.tunggal ? (o.sirkit === 1 ? 2 : 1) : 0 }, geometry: { type: "LineString", coordinates: g.c } }; }) });
const fiturTitik = (kj, j) => ({ type: "FeatureCollection", features: kj.geo[j].map((g) => { const o = IDX.get(g.id)?.o || {}; return { type: "Feature", properties: j === "gi" ? { id: g.id, n: g.n || o.nama || "", kv: g.kv, sm: o.satu_masuk ? 1 : 0 } : { id: g.id, n: o.nama || "", j: g.j, mw: g.mw || 0 }, geometry: { type: "Point", coordinates: [g.x, g.y] } }; }) });

/* ---------- kembaran: peta ---------- */
function pasangKJ(kj) {
  indeks(kj);
  peta.addSource("kj-rs", { type: "geojson", data: fiturRuas(kj) });
  peta.addSource("kj-gi", { type: "geojson", data: fiturTitik(kj, "gi") });
  peta.addSource("kj-pb", { type: "geojson", data: fiturTitik(kj, "pb") });
  const kosong = ["==", ["get", "id"], ""], ink = token("--ink"), merah = token("--bad");
  const teks = { "text-field": ["get", "n"], "text-font": ["Noto Sans Regular"], "text-size": 11, "text-offset": [0, 1.1], "text-anchor": "top", "text-optional": true };
  const halo = { "text-color": ink, "text-halo-color": token("--card"), "text-halo-width": 1.4 };
  const L2 = [
    { id: "jr-kr", type: "line", source: "kj-rs", layout: { "line-cap": "round" }, paint: { "line-color": token("--ink2"), "line-width": 1.5 } },
    { id: "jr-kr-hit", type: "line", source: "kj-rs", paint: { "line-color": ink, "line-width": 14, "line-opacity": 0 } },
    { id: "jr-kr-sel", type: "line", source: "kj-rs", filter: kosong, layout: { "line-cap": "round" }, paint: { "line-color": merah, "line-width": 5 } },
    { id: "jr-kg", type: "circle", source: "kj-gi", minzoom: 5, paint: { "circle-radius": 3.5, "circle-color": token("--card"), "circle-stroke-color": ink, "circle-stroke-width": 1.5 } },
    { id: "jr-kg-sel", type: "circle", source: "kj-gi", filter: kosong, paint: { "circle-radius": 9, "circle-color": merah, "circle-opacity": 0.25, "circle-stroke-color": merah, "circle-stroke-width": 3 } },
    { id: "jr-kgl", type: "symbol", source: "kj-gi", minzoom: 9, layout: teks, paint: halo },
    { id: "jr-kp", type: "circle", source: "kj-pb", paint: { "circle-radius": ["interpolate", ["linear"], ["get", "mw"], 0, 3, 200, 5, 1000, 8, 3000, 12], "circle-color": ["match", ["get", "j"], ...Object.entries(WARNA_BB).flatMap(([k, v]) => [k, token(v)]), token("--ink2")], "circle-stroke-color": token("--card"), "circle-stroke-width": 1.2, "circle-opacity": 0.92 } },
    { id: "jr-kp-sel", type: "circle", source: "kj-pb", filter: kosong, paint: { "circle-radius": 14, "circle-color": merah, "circle-opacity": 0.2, "circle-stroke-color": merah, "circle-stroke-width": 3 } },
    { id: "jr-kpl", type: "symbol", source: "kj-pb", minzoom: 9, layout: teks, paint: halo },
  ];
  for (const l of L2) peta.addLayer(l, "jr-rc");
  pop = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10, className: "rg3-pop" });
  const HIT = ["jr-kp", "jr-kg", "jr-kr-hit"];
  const cari = (e) => peta.queryRenderedFeatures([[e.point.x - 6, e.point.y - 6], [e.point.x + 6, e.point.y + 6]], { layers: ["jr-rc", "jr-ln", ...HIT].filter((l) => peta.getLayer(l)) })[0];
  peta.on("mousemove", (e) => {
    const f = cari(e), id = f?.properties?.id, h = f && !/^jr-(rc|ln)$/.test(f.layer.id) ? IDX.get(id) : null;
    peta.getCanvas().style.cursor = f ? "pointer" : "";
    if (!f) { pop.remove(); sorot(null); return; }
    if (h) pop.setLngLat(e.lngLat).setHTML(`<div class="rg3-tipm"><b>${esc(nm(h.j, h.o))}</b><span><em>${esc(t("kj.peta.jenis." + h.j))}</em><strong>${h.o.kv ? esc(num(h.o.kv)) + " kV" : h.o.mw ? esc(num(h.o.mw)) + " MW" : "-"}</strong></span></div>`).addTo(peta);
  });
  peta.on("click", (e) => {
    const f = cari(e); if (!f) return;
    if (/^jr-(rc|ln)$/.test(f.layer.id)) { setSel(null); detail(f.properties.id); } else pilih(f.properties.id, false);
  });
  terapkanMode();
  const aktif = new Set([...document.querySelectorAll("#jr-lapis [data-lp][aria-pressed=false]")].map((b) => b.dataset.lp));
  for (const k of aktif) nyala(k, false);
  bukaFokus();
}
function bukaFokus() {
  const fokus = new URLSearchParams(location.search).get("fokus");
  if (fokus && IDX.has(fokus) && S.sel !== fokus) pilih(fokus, true);
}
let pop = null;

function filterSel(j, o) {
  const jaga = (a) => ["literal", a.length ? a : [""]];
  if (j === "rs") return ["==", ["get", "id"], o.id];
  if (j === "jl") return ["==", ["get", "jl"], o.id];
  if (j === "gi") return ["in", ["get", "id"], jaga(GIRS.get(o.id) || [])];
  if (j === "sis") return ["==", ["get", "sis"], o.id];
  if (j === "op") return ["==", ["get", "op"], o.id];
  if (j === "prov") return ["in", `|${o.kode}|`, ["get", "pv"]];
  return ["==", ["get", "id"], ""];
}
function setSel(j, o) {
  if (!peta?.getLayer("jr-kr-sel")) return;
  const kosong = ["==", ["get", "id"], ""], id = o?.id ?? "";
  peta.setFilter("jr-kr-sel", o ? filterSel(j, o) : kosong);
  peta.setFilter("jr-kg-sel", j === "gi" ? ["==", ["get", "id"], id] : kosong);
  peta.setFilter("jr-kp-sel", j === "pb" ? ["==", ["get", "id"], id] : kosong);
}
function cakupan(j, o) {
  const c = [];
  const tambah = (id) => { const g = GRS.get(id); if (g) c.push(...g); const p = GPT.get(id); if (p) c.push(p); };
  if (j === "rs" || j === "gi" || j === "pb") { tambah(o.id); if (j === "gi") for (const r of GIRS.get(o.id) || []) tambah(r); }
  else if (j === "jl") for (const r of rsDariJl(o.id)) tambah(r);
  else if (j === "sis" && o.bbox) c.push([o.bbox[0], o.bbox[1]], [o.bbox[2], o.bbox[3]]);
  else if (j === "prov" || j === "op") {
    for (const g of S.kj.geo.rs) { const r = IDX.get(g.id)?.o; if (r && (j === "op" ? r.op === o.id : r.prov?.includes(o.kode))) c.push(g.c[0], g.c.at(-1)); }
    for (const g of S.kj.geo.pb) { const r = IDX.get(g.id)?.o; if (r && (j === "op" ? r.op === o.id : r.prov === o.kode)) c.push([g.x, g.y]); }
    for (const g of S.kj.geo.gi) { const r = IDX.get(g.id)?.o; if (r && j === "prov" && r.prov === o.kode) c.push([g.x, g.y]); }
  }
  return c;
}
function terbang(j, o) {
  const c = cakupan(j, o); if (!c.length || !peta) return;
  const b = c.reduce((a, [x, y]) => [Math.min(a[0], x), Math.min(a[1], y), Math.max(a[2], x), Math.max(a[3], y)], [180, 90, -180, -90]);
  if (b[0] === b[2] && b[1] === b[3]) peta.flyTo({ center: [b[0], b[1]], zoom: 10, duration: 600 });
  else peta.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: { top: 70, bottom: 70, left: 60, right: innerWidth >= 1000 ? 400 : 60 }, maxZoom: 11, duration: 600 });
}

/* ---------- mode warna ---------- */
const BAWAH = [94, -11.5, 141.5, 6.5];
function ekspr(mode) {
  const ink2 = token("--ink2");
  if (mode === "sistem") {
    const pr = [...S.rank.entries()].flatMap(([id, i]) => [id, token(PAL[i % PAL.length])]);
    return { c: pr.length ? ["match", ["get", "sis"], ...pr, ink2] : ink2, w: 2, o: 0.9 };
  }
  if (mode === "tunggal") return { c: ["match", ["get", "m"], 2, token("--bad"), 1, token("--tp-adil"), ink2], w: ["match", ["get", "m"], 0, 1.2, 3.4], o: ["match", ["get", "m"], 0, 0.35, 1] };
  return { c: ["match", ["get", "k"], ...KELAS.flatMap((k) => [k, token(WARNA_KELAS[k])]), ink2], w: ["match", ["get", "k"], "500", 2.8, "230-275", 2.3, "115-150", 1.5, 1.1], o: 0.85 };
}
function terapkanMode() {
  if (!peta?.getLayer("jr-kr")) return;
  const e = ekspr(S.mode);
  peta.setPaintProperty("jr-kr", "line-color", e.c); peta.setPaintProperty("jr-kr", "line-width", e.w); peta.setPaintProperty("jr-kr", "line-opacity", e.o);
  const tg = S.mode === "tunggal";
  peta.setPaintProperty("jr-kg", "circle-radius", tg ? ["case", ["==", ["get", "sm"], 1], 6, 3.5] : 3.5);
  peta.setPaintProperty("jr-kg", "circle-stroke-color", tg ? ["case", ["==", ["get", "sm"], 1], token("--bad"), token("--ink")] : token("--ink"));
  peta.setPaintProperty("jr-kg", "circle-stroke-width", tg ? ["case", ["==", ["get", "sm"], 1], 3, 1.5] : 1.5);
  tandai();
}
function tandai() {
  for (const m of S.tanda) m.remove();
  S.tanda = [];
  const no = (n, lngLat) => { const el = document.createElement("span"); el.className = "kj-no"; el.textContent = n; S.tanda.push(new maplibregl.Marker({ element: el }).setLngLat(lngLat).addTo(peta)); };
  if (S.mode === "sistem") {
    [...S.rank.keys()].slice(0, 10).forEach((id, i) => { const b = IDX.get(id)?.o?.bbox; if (b) no(i + 1, [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]); });
  } else if (S.mode === "tunggal") {
    (S.kj.ringkas?.tunggal_teratas || []).slice(0, 8).forEach((x, i) => { const c = GRS.get(rsDariJl(x.id)[0]); if (c) no(i + 1, c[c.length >> 1]); });
  }
  ge("kj-leg").innerHTML = legenda();
  ge("kj-mode-info").innerHTML = S.mode === "tunggal" ? infoTunggal() : "";
  for (const el of document.querySelectorAll("#jr-peta-ex [data-c]")) el.style.background = `var(${el.dataset.c})`;
  for (const el of document.querySelectorAll("#jr-peta-ex [data-w]")) el.style.width = el.dataset.w + "%";
}
function legenda() {
  const kj = S.kj; if (!kj) return "";
  const li = (sw, teks, b = "") => `<li class="kj-li">${sw}<span>${esc(teks)}</span>${b}</li>`;
  const sw = (c, cls = "") => `<i class="kj-sw ${cls}" data-c="${c}" aria-hidden="true"></i>`;
  if (S.mode === "sistem") {
    const ids = [...S.rank.keys()], top = ids.slice(0, 10);
    return top.map((id, i) => li(sw(PAL[i % PAL.length]), (IDX.get(id)?.o?.nama || id) + (IDX.get(id)?.o?.captive ? ` (${t("kj.peta.captive")})` : ""), `<b class="kj-ln">${i + 1}</b>`)).join("") + (ids.length > 10 || S.nPotongan ? `<li class="kj-li"><span>${esc(t("kj.peta.lainnya", { n: num(Math.max(0, ids.length - 10) + S.nPotongan) }))}</span></li>` : "");
  }
  if (S.mode === "tunggal") return li(sw("--tp-adil"), t("kj.peta.lg.tunggal")) + li(sw("--bad"), t("kj.peta.lg.satu")) + li(`<i class="kj-sw kj-sw-cincin" aria-hidden="true"></i>`, t("kj.peta.lg.cincin")) + li(sw("--ink2", "kj-sw-pudar"), t("kj.peta.lg.lain"));
  const km = Object.fromEntries((kj.ringkas?.tegangan || []).map((x) => [x.kelas === "tak-tercatat" ? "tak" : x.kelas, x.km]));
  return KELAS.map((k) => li(sw(WARNA_KELAS[k]), t("kj.peta.kelas." + k), km[k] != null ? `<b class="kj-ln">${esc(num(km[k]))} km</b>` : "")).join("");
}
function infoTunggal() {
  const tg = S.tg;
  const tile = (n, N, k) => `<div class="kj-ang"><b>${n == null ? "-" : esc(num(n))}</b><span>${esc(t("kj.peta.tg." + k, { n: N == null ? "-" : num(N) }))}</span></div>`;
  const top = (S.kj.ringkas?.tunggal_teratas || []).slice(0, 8), mx = Math.max(1, ...top.map((x) => x.gi || 0));
  const kaki = `<p class="kj-kaki">${chipSt("hitung")}${chipSrc("osm-power")}<span class="kj-tgl">${esc(t("kj.per", { tgl: tglTeks(S.kj.ringkas?.meta?.tanggal) }))}</span></p>`;
  return `<p class="pt2-leg-j">${esc(t("kj.peta.tg.j"))}</p><div class="kj-angs">${tile(tg.rs?.[0], tg.rs?.[1], "rs")}${tile(tg.jl[0], tg.jl[1], "jl")}${tile(tg.gi[0], tg.gi[1], "gi")}</div>${kaki}
    <p class="pt2-leg-j">${esc(t("kj.peta.tg.belakang"))}</p><ol class="kj-top">${top.map((x, i) => `<li><button type="button" class="kj-top-b" data-pilih="${esc(x.id)}"><b class="kj-ln">${i + 1}</b><span class="kj-top-n">${esc(nm("jl", IDX.get(x.id)?.o || { a: "", b: "", kv: x.kv }))}</span><span class="kj-bar"><i data-w="${Math.round(((x.gi || 0) / mx) * 100)}"></i></span><em>${esc(t("kj.peta.tg.gi", { n: num(x.gi || 0) }))}</em></button></li>`).join("")}</ol>`;
}

/* ---------- kartu objek ---------- */
function crumb(j, o) {
  const c = [], sis = o.sis && IDX.get(o.sis), kp = j === "gi" || j === "pb" ? o.prov : j === "rs" ? o.prov?.[0] : null, pv = kp && IDX.get("prov_" + kp);
  if (j === "prov") c.push({ teks: o.pulau });
  if (sis && j !== "sis") c.push({ teks: t("kj.peta.sistem_n", { n: sis.o.nama }), id: sis.o.id });
  if (pv && j !== "prov") c.push({ teks: pv.o.nama, id: pv.o.id });
  return c;
}
function tile(o, k) {
  const f = fk(o, k);
  return `<div class="kj-ang"><b>${nilai(f)}</b><span>${esc(lab(k))}</span>${f ? chipSt(f.st) : ""}</div>`;
}
function blokPutus(j, o) {
  let kal = "", dl = "";
  const b = o.belakang, sirkit = o.sirkit ?? null;
  if ((j === "rs" || j === "jl") && o.tunggal && b) {
    dl = [["kj.peta.p.gi", b.gi], ["kj.peta.p.mva", b.mva], ["kj.peta.p.mw", b.mw], ["kj.peta.p.sirkit", sirkit]].map(([k, v]) => `<div><dt>${esc(t(k))}</dt><dd>${v == null ? "-" : esc(num(v, Number.isInteger(v) ? 0 : 1))}</dd></div>`).join("");
    kal = b.gi > 0 ? t("kj.peta.p.ada", { gi: num(b.gi), mw: num(b.mw || 0) }) : t("kj.peta.p.buntu");
  } else if (j === "rs" || j === "jl") kal = t("kj.peta.p.jalur2");
  else if (j === "gi") kal = t(o.satu_masuk ? "kj.peta.p.gi_satu" : "kj.peta.p.gi_banyak", { n: num(o.jl?.length || 0) });
  else return "";
  const f = fk(o, "jalur_tunggal") || o.fakta?.[0];
  return `<section class="kj-putus"><h4>${esc(t("kj.peta.putus"))}</h4>${dl ? `<dl class="kj-dl">${dl}</dl>` : ""}<p>${esc(kal)}</p><p class="kj-kaki">${chipSt("hitung")}${chipSrc(f?.src)}${f?.tgl ? `<span class="kj-tgl">${esc(t("kj.per", { tgl: tglTeks(f.tgl) }))}</span>` : ""}</p><p class="kj-cat">${esc(t("kj.peta.p.cat"))}</p></section>`;
}
function amanRel(u) { return typeof u === "string" && /^\/[^/\\]/.test(u) ? u : ""; }
function lengkap(j, o) {
  const d = o.fakta?.[0] || {}, tmb = (k, v, sat, st) => (o.fakta.some((f) => f.k === k) ? null : { k, v, sat, st, src: d.src || "osm-power", tgl: d.tgl });
  const x = [];
  if (j === "jl" || j === "rs") x.push(tmb("tegangan", o.kv, "kV", "sumber"));
  if (j === "rs" || j === "jl") x.push(tmb("jalur_tunggal", o.tunggal ? 1 : 0, "bool", "hitung"));
  if (j === "gi") x.push(tmb("jalur_masuk", o.jl?.length ?? null, "jalur", "hitung"));
  if (j === "pb") x.push({ ...tmb("bahan_bakar", o.jenis, "", "sumber"), src: d.src }, tmb("captive", o.captive ? 1 : 0, "bool", "sumber"));
  return [...o.fakta, ...x.filter((f) => f && f.v != null)];
}
function kartu(j, o) {
  if (!FAKTA) muatKJ("fakta").then((f) => { FAKTA = f || { fakta: {} }; if (S.sel === o.id) kartu(j, o); }); /* fakta dimuat saat dibutuhkan; kartu dulu tampil tanpa fakta */
  o = { ...o, fakta: FAKTA ? FAKTA.fakta[o.id] || [] : [] };
  o.fakta = lengkap(j, o);
  const jj = crumb(j, o);
  const jejak = `<ol class="kj-jejak"><li><button type="button" data-reset>${esc(t("kj.peta.jaringan"))}</button></li>${jj.map((c) => `<li>${c.id ? `<button type="button" data-pilih="${esc(c.id)}">${esc(c.teks)}</button>` : `<span>${esc(c.teks)}</span>`}</li>`).join("")}<li aria-current="true"><span>${esc(nm(j, o))}</span></li></ol>`;
  const rows = (o.fakta || []).map((f) => `<tr><th scope="row">${esc(lab(f.k))}</th><td>${nilai(f)}</td><td>${chipSt(f.st)}${chipSrc(f.src)}<span class="kj-tgl">${esc(tglTeks(f.tgl))}</span></td></tr>`).join("");
  const mg = ["pembebanan", "gangguan", "umur", "proteksi", "dispatch"];
  const tm = S.kj.ringkas?.meta?.tanggal;
  const tautan = (o.tautan || []).map((x) => ({ ...x, url: amanRel(x.url) })).filter((x) => x.url).map((x) => `<a class="kj-lnk" href="${esc(x.url)}">${esc(t("kj.peta.direktori"))}<small>${esc(t("kj.peta.tj." + x.jenis))}</small></a>`).join("");
  ge("jr-pn-isi").innerHTML = `${jejak}<h3 class="jr-pn-j">${esc(nm(j, o))}</h3><p class="jr-pn-m"><span class="rg3-lain">${esc(t("kj.peta.jenis." + j))}</span>${(j === "pb" || j === "sis") && o.captive ? `<span class="rg3-lain">${esc(t("kj.peta.captive"))}</span>` : ""}${j === "sis" && o.potongan ? `<span class="rg3-lain">${esc(t("kj.sis.potongan"))}</span>` : ""}</p>
    <div class="kj-angs">${TILE[j].map((k) => tile(o, k)).join("")}</div>
    ${j === "pb" ? `<p class="jr-pn-t">${esc(t("kj.peta.pemilik"))}: ${esc(o.pemilik || "-")}${o.gi ? `, ${esc(IDX.get(o.gi)?.o?.nama || "")}` : ""}</p>` : ""}
    ${blokPutus(j, o)}
    <section class="kj-menunggu"><h4>${esc(t("kj.st.menunggu"))}</h4><ul>${mg.map((k) => `<li><span>${esc(t("kj.peta.m." + k))}</span>${chipSt("menunggu")}</li>`).join("")}</ul>${tm ? `<p class="kj-tgl">${esc(t("kj.per", { tgl: tglTeks(tm) }))}</p>` : ""}</section>
    <details class="kj-semua"><summary>${esc(t("kj.peta.semua", { n: num(o.fakta?.length || 0) }))}</summary><div class="kj-tabel">${FAKTA ? `<table><tbody>${rows}</tbody></table>` : `<p class="kj-cat">${esc(t("kj.peta.memuat"))}</p>`}</div></details>
    ${tautan ? `<p class="kj-tautan">${tautan}</p>` : ""}`;
}
function pilih(id, terbangKe = true) {
  const h = IDX.get(id); if (!h) return;
  S.sel = id; kartu(h.j, h.o);
  ge("jr-pn").open = true;
  setSel(h.j, h.o);
  if (terbangKe) terbang(h.j, h.o);
  const u = new URL(location.href); u.searchParams.set("fokus", id); u.searchParams.delete("ruas"); history.replaceState(null, "", u);
}
function aturUlang() {
  S.sel = null; setSel(null, null);
  if (S.kj) { S.mode = "tegangan"; for (const b of document.querySelectorAll("#kj-mode [data-mode]")) b.setAttribute("aria-pressed", String(b.dataset.mode === "tegangan")); terapkanMode(); }
  ge("jr-pn-isi").innerHTML = `<p class="jr-pn-t">${esc(t("jr.peta.pilih"))}</p>`;
  peta?.fitBounds([[BAWAH[0], BAWAH[1]], [BAWAH[2], BAWAH[3]]], { duration: 500 });
  const u = new URL(location.href); u.searchParams.delete("fokus"); history.replaceState(null, "", u);
}
async function muatKembaran() {
  const [geo, objek, ringkas] = await Promise.all([muatKJ("geo"), muatKJ("inti"), muatKJ("ringkas")]);
  if (!peta) return;
  if (!geo?.rs || !objek) { pasangOsm(); return; }
  S.kj = { geo, objek, ringkas };
  if (ringkas?.meta?.celah?.length && ge("kj-celah")) ge("kj-celah").innerHTML = daftarCelah(ringkas.meta.celah);
  if (ringkas?.meta?.tanggal && ge("kj-sub-tgl")) ge("kj-sub-tgl").textContent = t("kj.per", { tgl: tglTeks(ringkas.meta.tanggal) });
  pasangKJ(S.kj);
  nanti(async () => {
    const rsb = await muatKJ("rs");
    if (!peta || !rsb?.rs) return;
    indeksRs(S.kj, rsb);
    peta.getSource("kj-rs")?.setData(fiturRuas(S.kj));
    tandai();
    bukaFokus();
  });
}

async function pasangOsm() {
  const [tr, gi] = await Promise.all(["/geo/transmisi.json", "/geo/gardu.json"].map((u) => fetch(u).then((r) => (r.ok ? r.json() : null)).catch(() => null)));
  if (!peta) return;
  if (tr?.garis) {
    peta.addSource("jr-tr", { type: "geojson", data: { type: "FeatureCollection", features: tr.garis.filter((g) => g.koordinat?.length > 1).map((g) => ({ type: "Feature", properties: { kv: g.teg_kv || 0, k: kelasKv(g.teg_kv || 0), n: g.nama || "" }, geometry: { type: "LineString", coordinates: g.koordinat } })) } });
    peta.addLayer({ id: "jr-tr", type: "line", source: "jr-tr", paint: { "line-color": ["match", ["get", "k"], "500", token("--bad"), "275", token("--warn"), "150", token("--data1"), token("--ink2")], "line-width": ["match", ["get", "k"], "500", 2.6, "275", 2.2, 1.4], "line-opacity": 0.8 } }, "jr-rc");
  }
  if (gi?.gardu) {
    peta.addSource("jr-gi", { type: "geojson", data: { type: "FeatureCollection", features: gi.gardu.filter((g) => g.lat != null && g.lng != null).map((g) => ({ type: "Feature", properties: { n: g.nama || "", kv: g.teg_kv || 0 }, geometry: { type: "Point", coordinates: [g.lng, g.lat] } })) } });
    peta.addLayer({ id: "jr-gi", type: "circle", source: "jr-gi", minzoom: 6, paint: { "circle-radius": 3.5, "circle-color": token("--card"), "circle-stroke-color": token("--ink"), "circle-stroke-width": 1.5 } }, "jr-rc");
  }
  const pop = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 8, className: "rg3-pop" });
  for (const [idL, ket] of [["jr-tr", "jr.transmisi"], ["jr-gi", "jr.gardu"]]) {
    if (!peta.getLayer(idL)) continue;
    peta.on("mousemove", idL, (e) => { const p = e.features?.[0]?.properties; if (!p) return; peta.getCanvas().style.cursor = "pointer"; pop.setLngLat(e.lngLat).setHTML(`<div class="rg3-tipm"><b>${esc(p.n || t(ket))}</b><span><em>${esc(t(ket))}</em><strong>${p.kv ? esc(num(p.kv)) + " kV" : "-"}</strong></span><small>OpenStreetMap</small></div>`).addTo(peta); });
    peta.on("mouseleave", idL, () => { peta.getCanvas().style.cursor = ""; pop.remove(); });
  }
  const sudahMati = [...document.querySelectorAll("#jr-lapis [data-lp][aria-pressed=false]")].map((b) => b.dataset.lp);
  for (const k of sudahMati) nyala(k, false);
}
function nyala(k, on) {
  const l = LAPIS.find((x) => x.k === k);
  for (const id of l?.lapisan || []) if (peta?.getLayer(id)) peta.setLayoutProperty(id, "visibility", on ? "visible" : "none");
  if (k === "lintas") for (const b of document.querySelectorAll(".jr-bd")) b.hidden = !on;
}

async function bangunPeta() {
  const el = document.getElementById("jr-kanvas"); if (!el) return;
  try { await muatMapLibre(); } catch { el.textContent = t("jr.peta.gagal"); return; }
  const gaya = "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron");
  /* peta dasar gagal dimuat (luring, diblokir): lapis jaringan tetap tampil di atas latar polos */
  const style = await fetch(gaya).then((r) => (r.ok ? gaya : null)).catch(() => null) || { version: 8, sources: {}, glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf", layers: [{ id: "latar", type: "background", paint: { "background-color": token("--soft-hijau") } }] };
  peta = new maplibregl.Map({ container: el, style, center: [108, -2.2], zoom: 4.1, minZoom: 3, maxZoom: 13, dragRotate: false, pitchWithRotate: false, attributionControl: false });
  peta.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: "© OpenStreetMap (ODbL)" }), "bottom-right");
  peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-left");
  peta.once("style.load", () => { pasangGeo(fiturSkematik(D.m)); nanti(muatKembaran); });
}

export function mulai(el) {
  if (!D.m) { el.innerHTML = kosongTab("jr.kosong_data"); return; }
  const n = { antarpulau: (D.m.antar_pulau || []).filter((x) => x.garis).length, lintas: (D.m.lintas_negara?.negara || []).length };
  const tombol = LAPIS.map((l) => `<li><button type="button" class="pt2-leg" data-lp="${l.k}" aria-pressed="true">${ikon(l.ik, 16)}<span>${esc(t(l.lb))}</span>${l.k === "antarpulau" || l.k === "lintas" ? `<b>${esc(num(n[l.k]))}</b>` : ""}</button></li>`).join("");
  const mode = ["tegangan", "sistem", "tunggal"].map((m) => `<button type="button" class="kj-mb" data-mode="${m}" aria-pressed="${m === "tegangan"}">${esc(t("kj.peta.mode." + m))}</button>`).join("");
  const isi = `<div class="pt2-peta jr-petawrap">
    <div id="jr-kanvas" class="pt2-kanvas" role="application" aria-label="${esc(t("jr.peta.label"))}"></div>
    <details class="pt2-lapis jr-lapis" id="jr-lapis" ${innerWidth >= 1280 ? "open" : ""}><summary><span>${esc(t("jr.peta.lapis"))}</span></summary>
      <div class="pt2-lapis-isi"><ul class="pt2-leg-daftar">${tombol}</ul>
      <p class="pt2-leg-j">${esc(t("kj.peta.mode.j"))}</p><div class="kj-mode" id="kj-mode" role="group" aria-label="${esc(t("kj.peta.mode.j"))}">${mode}</div>
      <div id="kj-mode-info" class="kj-info"></div>
      <button type="button" class="kj-reset" id="kj-reset">${esc(t("kj.peta.reset"))}</button>
      <p class="pt2-attr">${esc(t("jr.peta.skematik"))}</p></div></details>
    <details class="pt2-panel jr-panel" id="jr-pn" ${innerWidth >= 1280 ? "open" : ""}><summary><span>${esc(t("jr.peta.panel"))}</span></summary>
      <div class="pt2-panel-isi" id="jr-pn-isi" aria-live="polite"><p class="jr-pn-t">${esc(t("jr.peta.pilih"))}</p></div></details>
    <ul class="kj-legbar" id="kj-leg" aria-label="${esc(t("kj.peta.legenda"))}"></ul>
  </div>`;
  el.innerHTML = ex({ id: "jr-peta-ex", ikon: "peta", topik: t("jr.peta.ey"), judulHtml: esc(t("jr.peta.j")), subHtml: `${esc(t("kj.peta.s"))} <span id="kj-sub-tgl"></span>`, isiHtml: `${isi}${catatan("kj.peta.n")}<div id="kj-celah">${daftarCelah(D.m.meta?.celah?.slice(0, 2))}</div>`, kakiHtml: sumberBerkas(D.m) });
  ge("jr-lapis").addEventListener("click", (e) => {
    const b = e.target.closest("[data-lp]"); if (b) { const on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", String(on)); nyala(b.dataset.lp, on); return; }
    const m = e.target.closest("[data-mode]");
    if (m && S.kj) { S.mode = m.dataset.mode; for (const x of ge("kj-mode").children) x.setAttribute("aria-pressed", String(x === m)); nanti(terapkanMode); return; }
    const p = e.target.closest("[data-pilih]"); if (p) pilih(p.dataset.pilih);
    if (e.target.closest("#kj-reset")) aturUlang();
  });
  ge("jr-pn-isi").addEventListener("click", (e) => {
    const p = e.target.closest("[data-pilih]"); if (p) pilih(p.dataset.pilih); else if (e.target.closest("[data-reset]")) aturUlang();
  });
  if (innerWidth >= 1000) { geserPanel(ge("jr-lapis"), { kunci: "lapis" }); geserPanel(ge("jr-pn"), { kunci: "panel" }); }
  const q = new URLSearchParams(location.search).get("ruas");
  nanti(async () => { await bangunPeta(); if (q) detail(q); });
}
