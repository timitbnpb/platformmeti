/* /panas-bumi, tab Sumber daya dan WKP: potensi vs terpasang (semua versi angka), sebaran 38 provinsi, daftar WKP/PSPE kurasi berlogo pemegang, peta proyek. */
import { B, t, ex, num, esc, ikon, tx, buktiS, kakiSumber, tabel, kosongTab, daftarCelah, pil, orgLogoSel, proyekPB, tautProvinsi, siapTautan, naikkan, gelap, catatan, bukti } from "/pbm_umum.js";
import { muatMapLibre } from "/inti/maplibre.js";

const ST_URUT = ["beroperasi", "konstruksi", "izin", "rencana", "ditunda", "tidak-diketahui", "dibatalkan"];
function angka(el) {
  const S = B.pb.sumber_daya, p = S.potensi_mw[0], terp = S.terpasang_mw;
  const kartu = (ik, judul, nilai, satuan, ket, sid, tb) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(ik, 22)}<b>${esc(judul)}</b></div><p class="pbm-angka">${esc(nilai)} <small>${esc(satuan)}</small></p><p class="jm-bantu">${esc(ket)}</p>${buktiS(sid, tb)}</div>`;
  return [kartu("tek-panas", t("pbm.s.potensi"), num(p.nilai, 0), "MW", tx(p.ket), p.sumber_id, p.tingkat_bukti),
    ...terp.map((x) => kartu("petir", t("pbm.s.terpasang", { th: x.tahun }), num(x.nilai, x.nilai % 1 ? 2 : 0), "MW", `${num((x.nilai / p.nilai) * 100, 1)}% ${t("pbm.s.dari_potensi")}. ${tx(x.ket)}`, x.sumber_id, x.tingkat_bukti)),
    kartu("lokasi", t("pbm.s.lokasi"), num(S.lokasi.nilai, 0), t("pbm.u.lokasi"), tx(S.lokasi.ket), S.lokasi.sumber_id, S.lokasi.tingkat_bukti)].join("");
}
function tabProv() {
  const el = document.getElementById("pbm-s-prov-tab"); if (!el) return;
  const pr = proyekPB(), wk = B.wkp?.baris || [];
  const baris = B.pb.sumber_daya.provinsi.map((r) => {
    const ps = pr.filter((x) => x.prov_kode === r.kode), op = ps.filter((x) => x.status === "beroperasi");
    return { ...r, n: ps.length, mw: ps.reduce((s, x) => s + (x.mw || 0), 0), op: op.reduce((s, x) => s + (x.mw || 0), 0), wkp: wk.filter((w) => w.provinsi && r.provinsi && w.provinsi.toLowerCase() === r.provinsi.toLowerCase()).length };
  });
  tabel(el, { satuan: "pbm.u.prov", per: 10, urutAwal: 1, menurun: true, kolom: [
    { label: t("pbm.c.provinsi"), v: (r) => r.provinsi, f: (r) => tautProvinsi(r.kode, r.provinsi) },
    { label: t("pbm.c.potensi"), num: true, v: (r) => r.potensi_mw ?? -1, f: (r) => (r.potensi_mw != null ? esc(num(r.potensi_mw, 0)) : "-") },
    { label: t("pbm.c.terpasang"), num: true, v: (r) => r.terpasang_mw ?? -1, f: (r) => (r.terpasang_mw != null ? esc(num(r.terpasang_mw, 0)) : "-") },
    { label: t("pbm.c.proyek"), num: true, v: (r) => r.n, f: (r) => esc(num(r.n, 0)) },
    { label: t("pbm.c.mw_proyek"), num: true, v: (r) => r.mw, f: (r) => esc(num(r.mw, 0)) },
    { label: t("pbm.c.wkp"), num: true, v: (r) => r.wkp, f: (r) => esc(num(r.wkp, 0)) },
    { label: t("pbm.c.bukti"), v: () => "", f: () => buktiS(B.pb.sumber_daya.provinsi_sumber_id, "resmi") },
  ], baris });
}
function tabWkp() {
  const el = document.getElementById("pbm-s-wkp-tab"); if (!el) return;
  const baris = B.wkp.baris;
  tabel(el, { satuan: "pbm.u.wkp", per: 10, urutAwal: 0, menurun: false, kolom: [
    { label: t("pbm.c.wkp_nama"), v: (w) => w.nama, f: (w) => `<span class="rg3-idk"><b>${esc(w.nama)}</b><small>${esc(w.jenis)}</small></span>` },
    { label: t("pbm.c.provinsi"), v: (w) => w.provinsi || "", f: (w) => esc(w.provinsi || "-") },
    { label: t("pbm.c.pemegang"), v: (w) => w.pemegang || "", f: (w) => (w.pemegang ? orgLogoSel(w.organisasi_id, w.pemegang) : `<span class="jm-bantu">${esc(t("pbm.belum_ada"))}</span>`) },
    { label: t("pbm.c.status"), v: (w) => w.status, f: (w) => pil("pbm.wst.", w.status) },
    { label: t("pbm.c.luas"), num: true, v: () => -1, f: () => `<span class="jm-bantu">${esc(t("pbm.belum_ada"))}</span>` },
    { label: t("pbm.c.mw"), num: true, v: (w) => w.terpasang_mw ?? w.rencana_mw ?? -1, f: (w) => (w.terpasang_mw != null ? `<b>${esc(num(w.terpasang_mw, 0))}</b> <small>${esc(t("pbm.terpasang_k"))}</small>` : w.rencana_mw != null ? `${esc(num(w.rencana_mw, 0))} <small>${esc(t("pbm.rencana_k"))}</small>` : "-") },
    { label: t("pbm.c.bukti"), v: (w) => w.tingkat_bukti, f: (w) => bukti(w.tingkat_bukti, { sumber: B.wkp.sumber?.find((s) => s.id === w.sumber_ids?.[0])?.penerbit || "", tanggal: B.wkp.meta?.diperbarui || "" }) },
  ], baris });
}
async function gambarPeta(el) {
  const w = el.querySelector("#pbm-s-peta"); if (!w) return;
  try { await muatMapLibre(); } catch { w.textContent = t("rg3.map.gagal"); return; }
  const pm = new maplibregl.Map({ container: w, style: "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron"), center: [118, -2], zoom: 3.4, minZoom: 2, maxZoom: 10, dragRotate: false, pitchWithRotate: false, attributionControl: false });
  pm.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
  pm.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  const rows = proyekPB().filter((p) => p.lat != null && p.lng != null && p.status !== "dibatalkan"), kotak = new maplibregl.LngLatBounds();
  for (const r of rows) {
    kotak.extend([r.lng, r.lat]);
    const m = document.createElement("div"); m.className = "rg3-mk rg3-pin pbm-pin pbm-pin-" + r.status; m.tabIndex = 0; m.setAttribute("role", "img"); m.setAttribute("aria-label", `${r.nama}, ${r.prov}`); m.innerHTML = ikon("tek-panas", 14);
    new maplibregl.Marker({ element: m }).setLngLat([r.lng, r.lat]).addTo(pm);
    const pop = new maplibregl.Popup({ closeButton: false, offset: 14, className: "rg3-pop", maxWidth: "320px" }).setHTML(`<div class="rg3-tipm"><b>${esc(r.nama)}</b><span><em>${esc(t("pbm.c.provinsi"))}</em><strong>${esc(r.prov || "-")}</strong></span><span><em>${esc(t("pbm.c.mw"))}</em><strong>${esc(r.mw != null ? num(r.mw, 0) : "-")}</strong></span><span><em>${esc(t("pbm.c.status"))}</em><strong>${esc(t("pbm.st." + r.status))}</strong></span><span><em>${esc(t("pbm.c.presisi"))}</em><strong>${esc(r.presisi || "-")}</strong></span></div>`);
    const buka = () => pop.setLngLat([r.lng, r.lat]).addTo(pm), tutup = () => pop.remove();
    m.addEventListener("pointerenter", buka); m.addEventListener("pointerleave", tutup); m.addEventListener("focus", buka); m.addEventListener("blur", tutup);
  }
  if (rows.length > 1) pm.fitBounds(kotak, { padding: 50, duration: 0, maxZoom: 6 });
}
export function mulai(el) {
  if (!B.pb) { el.innerHTML = kosongTab("pbm.kosong"); return; }
  const S = B.pb.sumber_daya, nWkp = (B.wkp?.baris || []).length, nP = proyekPB().filter((p) => p.lat != null && p.status !== "dibatalkan").length;
  const leg = ST_URUT.slice(0, 5).map((s) => `<li class="pbm-leg pbm-pin-${s}">${ikon("tek-panas", 14)}<span>${esc(t("pbm.st." + s))}</span></li>`).join("");
  el.innerHTML = [
    ex({ id: "pbm-s-angka", ikon: "tek-panas", topik: t("pbm.s.ey.angka"), judulHtml: esc(t("pbm.s.j.angka", { p: num(S.potensi_mw[0].nilai, 0), t: num(S.terpasang_mw[0].nilai, 0) })), subHtml: esc(t("pbm.s.s.angka")),
      isiHtml: `<div class="rg3-kisi">${angka()}</div><p class="jm-bantu ih-catatan">${esc(tx(S.catatan_beda))}</p>`, kakiHtml: kakiSumber(["irena", "metro-potensi", "cnbc-2744", "innerspace-3", "kabarbursa-24gw"]) }),
    ex({ id: "pbm-s-prov", ikon: "peta", topik: t("pbm.s.ey.prov"), judulHtml: esc(t("pbm.s.j.prov")), subHtml: esc(t("pbm.s.s.prov")), isiHtml: `<div id="pbm-s-prov-tab"></div>${catatan("pbm.s.n.prov")}`, kakiHtml: kakiSumber([S.provinsi_sumber_id]) }),
    ex({ id: "pbm-s-wkp", ikon: "kawasan", topik: t("pbm.s.ey.wkp"), judulHtml: esc(t("pbm.s.j.wkp", { n: num(nWkp, 0) })), subHtml: esc(t("pbm.s.s.wkp")), isiHtml: `<div id="pbm-s-wkp-tab"></div>${daftarCelah(B.pb.celah.slice(0, 3))}`, kakiHtml: kakiSumber(["lelang", "lelang2"]) }),
    ex({ id: "pbm-s-petab", ikon: "peta", topik: t("pbm.s.ey.peta"), judulHtml: esc(t("pbm.s.j.peta", { n: num(nP, 0) })), subHtml: esc(t("pbm.s.s.peta")), isiHtml: `<ul class="pbm-keterangan">${leg}</ul><div id="pbm-s-peta" class="rg3-peta" role="region" aria-label="${esc(t("pbm.s.peta_label"))}"></div>${catatan("pbm.s.n.peta")}` }),
  ].join("");
  tabProv(); tabWkp(); gambarPeta(el);
  siapTautan("org", "provinsi").then(() => naikkan(el));
}
