/* /baterai-ev: pemain per tahap (tabel berlogo dan berbendera, saringan kelompok) dan peta lokasi. Baris berasal dari tiga tempat yang disatukan
   saat runtime: kurasi baterai_ev.json, hilirisasi.json (smelter, HPAL, sel), dan tambahan pCAM di esg_rantai.json. Tanpa salinan data. */
import { D, X, L, t, esc, ikon, num, bukti, logoHtml, namaOrg, negaraSel, bendera, namaNegara, luar, kapTeks, chipStatus, chipKelompok, buktiBe, tahapData, gelap, peta, ex, daftarCelah, catatan } from "/be_umum.js";
import { nanti } from "/inti/umum.js";
import { pilihHtml } from "/inti/komponen.js";
import { tabel } from "/info_hijau.js";
import { muatMapLibre } from "/inti/maplibre.js";

const BUKTI_HILI = { "laporan-publik": "media", resmi: "resmi" };
const lokHili = (id) => { const b = (X.hili?.baris || []).find((x) => x.id === id); return b ? { lat: b.lat, lng: b.lng, nama: b.provinsi } : null; };
function dariKurasi(p) {
  return { id: p.id, kurasi: true, nama: p.nama, org_id: p.org_id, pemilik: [], negara: p.negara, kelompok: p.kelompok, peran: L(p.peran), kap: p.kap, status: p.status, lokasi: p.lokasi || (p.hilirisasi_id ? lokHili(p.hilirisasi_id) : null), sumber_id: p.sumber_id, tingkat_bukti: p.tingkat_bukti, tanggal: p.tanggal, segmen: p.segmen, tkdn: p.tkdn };
}
function dariHili(b) {
  const neg = (b.pemilik || []).map((p) => p.negara).filter(Boolean);
  const kap = b.kapasitas ? (b.kapasitas.nilai != null ? { nilai: b.kapasitas.nilai, satuan: b.kapasitas.satuan, jenis: b.kapasitas.jenis } : b.kapasitas.rentang ? { rentang: b.kapasitas.rentang, satuan: b.kapasitas.satuan, jenis: b.kapasitas.jenis } : null) : null;
  return { id: b.id, kurasi: false, nama: b.nama, org_id: null, pemilik: b.pemilik || [], negara: neg.find((n) => n !== "id") || neg[0] || "", kelompok: neg.some((n) => n !== "id") ? "global" : "lokal", peran: b.produk, kap, status: b.status, lokasi: b.lat != null ? { lat: b.lat, lng: b.lng, nama: b.provinsi } : null, url: b.sumber?.[0]?.url, tingkat_bukti: BUKTI_HILI[b.tingkat_bukti] || "media", tanggal: X.hili?.dibangun_pada, sumber_nama: b.sumber?.[0]?.judul };
}
function dariEsg(b) {
  const p = (b.pemilik || [])[0];
  return { id: b.id, kurasi: false, nama: b.nama, org_id: null, pemilik: b.pemilik || [], negara: p?.negara || "", kelompok: p?.negara && p.negara !== "id" ? "global" : "lokal", peran: b.catatan, kap: b.kapasitas?.nilai != null ? { nilai: b.kapasitas.nilai, satuan: b.kapasitas.satuan } : null, status: b.status, lokasi: null, tingkat_bukti: "media", tanggal: b.tanggal_status, sumber_id_esg: b.sumber_id };
}
/** Semua baris pemain sebuah tahap. */
export function pemainTahap(id) {
  const out = (tahapData(id)?.pemain || []).map(dariKurasi);
  const H = (X.hili?.baris || []);
  if (id === "olah") out.push(...H.filter((b) => b.rantai === "smelter" || (b.rantai === "prekursor" && b.jenis === "hpal")).map(dariHili));
  if (id === "sel") {
    out.push(...H.filter((b) => b.rantai === "sel").map(dariHili));
    for (const b of D.pabrik?.baris || []) if (b.segmen === "sel_baterai" && b.negara_iso2 !== "ID") out.push({ id: b.id, kurasi: true, nama: b.perusahaan, org_id: b.org_id || null, pemilik: [], negara: b.negara_iso2.toLowerCase(), kelompok: "global", peran: b.catatan || b.kota, kap: b.kapasitas ? { nilai: b.kapasitas.nilai ?? b.kapasitas.gwh ?? null, satuan: b.kapasitas.satuan || "GWh" } : null, status: b.status === "bangun" ? "konstruksi" : b.status, lokasi: b.koordinat ? { lat: b.koordinat.lat, lng: b.koordinat.lon, nama: b.kota } : null, tingkat_bukti: b.bukti?.[0]?.tingkat_bukti || "media", tanggal: D.pabrik.dibangun_pada, sumber_nama: "pabrik_dunia" });
  }
  if (id === "prekursor") out.push(...(D.esg?.rantai_mineral?.tambahan || []).filter((b) => b.tahap === "pcam").map(dariEsg));
  return out;
}
function barisBukti(r) {
  if (r.sumber_id) return buktiBe(r);
  if (r.sumber_id_esg) { const s = (D.esg?.sumber || []).find((x) => x.id === r.sumber_id_esg); return bukti(r.tingkat_bukti, { sumber: s?.penerbit || "", tanggal: r.tanggal || "", cara: s?.judul || "" }); }
  return bukti(r.tingkat_bukti, { sumber: r.sumber_nama || "", tanggal: r.tanggal || "" });
}
const pemilikSel = (r) => {
  if (r.kurasi || !r.pemilik.length) return r.negara ? negaraSel(r.negara, 18) : "-";
  return `<span class="bev-pem">${r.pemilik.map((p) => `<span class="bev-pem-i">${logoHtml(p.org_id, p.nama, p.logo, "rg3-lg rg3-lg-k")}${namaOrg(p.org_id, p.nama)}${p.negara ? bendera(p.negara, 16) : ""}</span>`).join("")}</span>`;
};
const namaSel = (r) => {
  const nm = r.kurasi && r.org_id ? namaOrg(r.org_id, r.nama) : r.url ? luar(r.url, r.nama) : `<span>${esc(r.nama)}</span>`;
  const first = r.kurasi ? { id: r.org_id, nama: r.nama } : r.pemilik[0] || { nama: r.nama };
  return `<span class="rg3-org">${logoHtml(first.org_id || first.id, first.nama, first.logo)}<span class="rg3-idk"><b>${nm}</b><small>${esc(r.peran || "")}</small></span></span>`;
};
let saring = {};
export function tabelPemain(id, el) {
  const semua = pemainTahap(id), k = saring[id] || "";
  const baris = semua.filter((r) => !k || r.kelompok === k);
  const kolom = [
    { label: t("bev.c.pemain"), v: (r) => r.nama, f: namaSel },
    { label: t("bev.c.pemilik"), v: (r) => r.negara, f: pemilikSel },
    { label: t("bev.c.kelompok"), v: (r) => r.kelompok, f: (r) => chipKelompok(r.kelompok) },
    { label: t("bev.c.kapasitas"), num: true, v: (r) => r.kap?.nilai ?? r.kap?.rentang?.[1] ?? -1, f: (r) => `<span class="rg3-idk"><b>${esc(kapTeks(r.kap))}</b>${r.kap?.jenis ? `<small>${esc(t("bev.kj." + r.kap.jenis))}</small>` : ""}</span>` },
    { label: t("bev.c.status"), v: (r) => r.status || "", f: (r) => chipStatus(r.status) },
    { label: t("bev.c.bukti"), v: (r) => r.tingkat_bukti || "", f: barisBukti },
  ];
  if (id === "kendaraan") kolom.splice(3, 0, { label: t("bev.c.segmen"), v: (r) => r.segmen || "", f: (r) => (r.segmen ? `<span class="jm-pil">${esc(t("bev.seg." + r.segmen))}</span>` : "-") }, { label: t("bev.c.tkdn"), num: true, v: (r) => r.tkdn ?? -1, f: (r) => (r.tkdn != null ? `<b>${esc(num(r.tkdn, 1))}%</b>` : "-") });
  tabel(el, { kolom, baris, per: 8, urutAwal: 0, menurun: false, satuan: "bev.u.pemain" });
  return semua;
}
export function bagianPemain(id) {
  const semua = pemainTahap(id), nG = semua.filter((r) => r.kelompok === "global").length, nL = semua.length - nG;
  if (!semua.length) return "";
  const opsi = [["", t("bev.kel.semua"), "daftar2", semua.length], ["global", t("bev.kel.global"), "globe", nG], ["lokal", t("bev.kel.lokal"), "lokasi", nL]];
  return ex({ id: `bev-${id}-pemain`, ikon: "gedung", topik: t("bev.ey.pemain"), judulHtml: esc(t("bev.j.pemain", { n: num(semua.length), g: num(nG), l: num(nL) })), subHtml: esc(t("bev.s.pemain")),
    isiHtml: `<div class="jm-saring rg3-saring rg3-saring-1">${pilihHtml({ id: `bev-${id}-kel`, ikon: "globe", label: t("bev.f.kelompok"), opsi, nilai: saring[id] || "" })}</div><div id="bev-${id}-tb"></div>${catatan("bev.n.pemain")}` });
}
export function pasangPemain(id, el) {
  tabelPemain(id, el.querySelector(`#bev-${id}-tb`));
  el.querySelector(`#bev-${id}-kel`)?.addEventListener("change", (e) => { saring[id] = e.target.value; nanti(() => tabelPemain(id, el.querySelector(`#bev-${id}-tb`))); });
}

/* ---------- peta ---------- */
export function bagianPeta(id) {
  const n = pemainTahap(id).filter((r) => r.lokasi).length;
  if (!n) return "";
  return ex({ id: `bev-${id}-petab`, ikon: "peta", topik: t("bev.ey.peta"), judulHtml: esc(t("bev.j.peta", { n: num(n) })), subHtml: esc(t("bev.s.peta")),
    isiHtml: `<div id="bev-${id}-peta" class="rg3-peta" role="region" aria-label="${esc(t("bev.peta.label"))}"></div>${catatan("bev.n.peta")}` });
}
export async function gambarPeta(id, el, ik) {
  const w = el.querySelector(`#bev-${id}-peta`); if (!w) return;
  try { await muatMapLibre(); } catch { w.textContent = t("rg3.map.gagal"); return; }
  if (peta[id]) { peta[id].remove(); peta[id] = null; }
  const pm = peta[id] = new maplibregl.Map({ container: w, style: "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron"), center: [118, -2], zoom: 3.4, minZoom: 2, maxZoom: 10, dragRotate: false, pitchWithRotate: false, attributionControl: false });
  pm.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
  pm.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  const rows = pemainTahap(id).filter((r) => r.lokasi), kotak = new maplibregl.LngLatBounds();
  for (const r of rows) {
    kotak.extend([r.lokasi.lng, r.lokasi.lat]);
    const m = document.createElement("div"); m.className = "rg3-mk rg3-pin bev-pin-" + (r.kelompok === "global" ? "g" : "l"); m.tabIndex = 0; m.setAttribute("role", "img"); m.setAttribute("aria-label", `${r.nama}, ${r.lokasi.nama || ""}`); m.innerHTML = ikon(ik, 16);
    new maplibregl.Marker({ element: m }).setLngLat([r.lokasi.lng, r.lokasi.lat]).addTo(pm);
    const pop = new maplibregl.Popup({ closeButton: false, offset: 14, className: "rg3-pop", maxWidth: "320px" }).setHTML(`<div class="rg3-tipm"><b>${r.negara ? bendera(r.negara, 20) : ""}${esc(r.nama)}</b><span><em>${esc(t("bev.c.lokasi"))}</em><strong>${esc(r.lokasi.nama || "-")}</strong></span><span><em>${esc(t("bev.c.kapasitas"))}</em><strong>${esc(kapTeks(r.kap))}</strong></span><span><em>${esc(t("bev.c.status"))}</em><strong>${esc(t("bev.st." + r.status))}</strong></span></div>`);
    const buka = () => pop.setLngLat([r.lokasi.lng, r.lokasi.lat]).addTo(pm), tutup = () => pop.remove();
    m.addEventListener("pointerenter", buka); m.addEventListener("pointerleave", tutup); m.addEventListener("focus", buka); m.addEventListener("blur", tutup);
  }
  if (rows.length > 1) pm.fitBounds(kotak, { padding: 60, duration: 0, maxZoom: 7 }); else if (rows.length) pm.jumpTo({ center: [rows[0].lokasi.lng, rows[0].lokasi.lat], zoom: 6 });
}
