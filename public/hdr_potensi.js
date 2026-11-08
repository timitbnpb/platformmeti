/* /hidro, tab Potensi dan DAS: potensi vs terpasang (semua versi angka), target, sebaran 38 provinsi (potensi dari topik hidro, proyek dari proyek_terpadu), sub-DAS tempat PLTA berdiri (air_energi.json), peta proyek. */
import { B, t, ex, num, esc, ikon, tx, buktiS, kakiSumber, tabel, batangSvg, tipHtml, kosongTab, daftarCelah, pil, proyekHidro, tautProvinsi, siapTautan, naikkan, gelap, catatan, bukti } from "/hdr_umum.js";
import { muatMapLibre } from "/inti/maplibre.js";

const ST_URUT = ["beroperasi", "konstruksi", "izin", "rencana", "ditunda"];
function angka() {
  const S = B.hd.sumber_daya, p = S.potensi_mw[0];
  const kartu = (ik, judul, nilai, satuan, ket, sid, tb) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(ik, 22)}<b>${esc(judul)}</b></div><p class="hdr-angka">${esc(nilai)} <small>${esc(satuan)}</small></p><p class="jm-bantu">${esc(ket)}</p>${buktiS(sid, tb)}</div>`;
  return [...S.potensi_mw.map((x, i) => kartu("air-energi", t("hdr.s.potensi", { n: i + 1 }), num(x.nilai, 0), "MW", tx(x.ket), x.sumber_id, x.tingkat_bukti)),
    ...S.terpasang_mw.map((x) => kartu("petir", t("hdr.s.terpasang", { th: x.tahun }), num(x.nilai, x.nilai % 1 ? 2 : 0), "MW", `${num((x.nilai / p.nilai) * 100, 1)}% ${t("hdr.s.dari_potensi")}. ${tx(x.ket)}`, x.sumber_id, x.tingkat_bukti)),
    ...S.target.map((x) => kartu("bendera", t("hdr.s.target", { th: x.tahun }), num(x.nilai, x.nilai % 1 ? 1 : 0), x.satuan, tx(x.teks), x.sumber_id, x.tingkat_bukti))].join("");
}
function barisProv() {
  const pr = proyekHidro(), rows = B.tp?.bab?.["8"]?.baris || [];
  return rows.map((r) => {
    const ps = pr.filter((x) => x.prov_kode === r.kode), op = ps.filter((x) => x.status === "beroperasi");
    return { kode: r.kode, prov: r.prov, potensi: r.potensi_mw, potensi2: r.potensi2_mw, terpasang: r.terpasang_mw, n: ps.length, mw: ps.reduce((s, x) => s + (x.mw || 0), 0), op: op.reduce((s, x) => s + (x.mw || 0), 0) };
  });
}
function grafikProv() {
  const g = document.getElementById("hdr-p-graf"); if (!g) return;
  const top = barisProv().filter((r) => r.potensi != null).sort((a, b) => b.potensi - a.potensi).slice(0, 10);
  g.innerHTML = batangSvg({ el: g, d: 0, satuan: "MW", label: t("hdr.s.j.graf"), seri: [{ k: "v", kelas: "hdr-s-mw" }],
    baris: top.map((r) => ({ label: r.prov, tip: r.prov, th: tipHtml(r.prov, [[t("hdr.c.potensi"), num(r.potensi, 0)], [t("hdr.c.terpasang"), r.terpasang != null ? num(r.terpasang, 0) : "-"], [t("hdr.c.mw_proyek"), num(r.mw, 0)]]), bagian: [{ k: "v", nilai: r.potensi }] })) });
}
function tabProv() {
  const el = document.getElementById("hdr-p-prov-tab"); if (!el) return;
  tabel(el, { satuan: "hdr.u.prov", per: 10, urutAwal: 1, menurun: true, kolom: [
    { label: t("hdr.c.provinsi"), v: (r) => r.prov, f: (r) => tautProvinsi(r.kode, r.prov) },
    { label: t("hdr.c.potensi"), num: true, v: (r) => r.potensi ?? -1, f: (r) => (r.potensi != null ? esc(num(r.potensi, 0)) : "-") },
    { label: t("hdr.c.potensi2"), num: true, v: (r) => r.potensi2 ?? -1, f: (r) => (r.potensi2 != null ? esc(num(r.potensi2, 0)) : "-") },
    { label: t("hdr.c.terpasang"), num: true, v: (r) => r.terpasang ?? -1, f: (r) => (r.terpasang != null ? esc(num(r.terpasang, 0)) : "-") },
    { label: t("hdr.c.proyek"), num: true, v: (r) => r.n, f: (r) => esc(num(r.n, 0)) },
    { label: t("hdr.c.mw_proyek"), num: true, v: (r) => r.mw, f: (r) => esc(num(r.mw, 0)) },
    { label: t("hdr.c.bukti"), v: () => "", f: () => bukti("via-pihak-ketiga", { sumber: "topik/hidro.json", tanggal: B.tp?.diperbarui || "" }) },
  ], baris: barisProv() });
}
function tabDas() {
  const el = document.getElementById("hdr-p-das-tab"); if (!el) return;
  tabel(el, { satuan: "hdr.u.das", per: 8, urutAwal: 4, menurun: true, kolom: [
    { label: t("hdr.c.das"), v: (d) => d.nama, f: (d) => `<span class="rg3-idk"><b>${esc(d.nama)}</b><small>${esc(d.prov || "")}</small></span>` },
    { label: t("hdr.c.km2"), num: true, v: (d) => d.km2, f: (d) => esc(num(d.km2, 0)) },
    { label: t("hdr.c.n_plta"), num: true, v: (d) => d.n, f: (d) => esc(num(d.n, 0)) },
    { label: t("hdr.c.mw_plta"), num: true, v: (d) => d.mw, f: (d) => `<b>${esc(num(d.mw, 0))}</b>` },
    { label: t("hdr.c.mw_op"), num: true, v: (d) => d.mw_op, f: (d) => esc(num(d.mw_op, 0)) },
    { label: t("hdr.c.skor_air"), num: true, v: (d) => d.skor, f: (d) => `<span class="rg3-idk"><b>${esc(num(d.skor, 0))}</b><small>${esc(d.kelas)}</small></span>` },
    { label: t("hdr.c.bukti"), v: () => "", f: () => bukti("kajian", { sumber: "HydroBASINS, METI", tanggal: B.ae?.dibangun_pada || "" }) },
  ], baris: B.ae.das.filter((d) => B.hd.rujukan.das_ids.includes(d.id)) });
}
async function gambarPeta(el) {
  const w = el.querySelector("#hdr-p-peta"); if (!w) return;
  try { await muatMapLibre(); } catch { w.textContent = t("rg3.map.gagal"); return; }
  const pm = new maplibregl.Map({ container: w, style: "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron"), center: [118, -2], zoom: 3.4, minZoom: 2, maxZoom: 10, dragRotate: false, pitchWithRotate: false, attributionControl: false });
  pm.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
  pm.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  const rows = proyekHidro().filter((p) => p.lat != null && p.lng != null && p.status !== "dibatalkan"), kotak = new maplibregl.LngLatBounds();
  for (const r of rows) {
    kotak.extend([r.lng, r.lat]);
    const m = document.createElement("div"); m.className = "rg3-mk rg3-pin hdr-pin hdr-pin-" + r.status; m.tabIndex = 0; m.setAttribute("role", "img"); m.setAttribute("aria-label", `${r.nama}, ${r.prov}`); m.innerHTML = ikon("air-energi", 14);
    new maplibregl.Marker({ element: m }).setLngLat([r.lng, r.lat]).addTo(pm);
    const pop = new maplibregl.Popup({ closeButton: false, offset: 14, className: "rg3-pop", maxWidth: "320px" }).setHTML(`<div class="rg3-tipm"><b>${esc(r.nama)}</b><span><em>${esc(t("hdr.c.provinsi"))}</em><strong>${esc(r.prov || "-")}</strong></span><span><em>${esc(t("hdr.c.mw"))}</em><strong>${esc(r.mw != null ? num(r.mw, 0) : "-")}</strong></span><span><em>${esc(t("hdr.c.status"))}</em><strong>${esc(t("hdr.st." + r.status))}</strong></span><span><em>${esc(t("hdr.c.presisi"))}</em><strong>${esc(r.presisi || "-")}</strong></span></div>`);
    const buka = () => pop.setLngLat([r.lng, r.lat]).addTo(pm), tutup = () => pop.remove();
    m.addEventListener("pointerenter", buka); m.addEventListener("pointerleave", tutup); m.addEventListener("focus", buka); m.addEventListener("blur", tutup);
  }
  if (rows.length > 1) pm.fitBounds(kotak, { padding: 50, duration: 0, maxZoom: 6 });
}
export function mulai(el) {
  if (!B.hd) { el.innerHTML = kosongTab("hdr.kosong"); return; }
  const S = B.hd.sumber_daya, nP = proyekHidro().filter((p) => p.lat != null && p.status !== "dibatalkan").length;
  const leg = ST_URUT.map((s) => `<li class="hdr-leg hdr-pin-${s}">${ikon("air-energi", 14)}<span>${esc(t("hdr.st." + s))}</span></li>`).join("");
  el.innerHTML = [
    ex({ id: "hdr-p-angka", ikon: "air-energi", topik: t("hdr.s.ey.angka"), judulHtml: esc(t("hdr.s.j.angka", { p: num(S.potensi_mw[0].nilai, 0), t: num(S.terpasang_mw[0].nilai, 0) })), subHtml: esc(t("hdr.s.s.angka")),
      isiHtml: `<div class="rg3-kisi">${angka()}</div><p class="jm-bantu ih-catatan">${esc(tx(S.catatan_beda))}</p>`, kakiHtml: kakiSumber(["esdm-hidro", "kompas-95gw", "undip-potensi", "kap", "li-72gw"]) }),
    ex({ id: "hdr-p-prov", ikon: "peta", topik: t("hdr.s.ey.prov"), judulHtml: esc(t("hdr.s.j.prov")), subHtml: esc(t("hdr.s.s.prov")), isiHtml: `<div id="hdr-p-graf" class="hdr-grafik"></div><div id="hdr-p-prov-tab"></div>${catatan("hdr.s.n.prov")}` }),
    ex({ id: "hdr-p-das", ikon: "kawasan", topik: t("hdr.s.ey.das"), judulHtml: esc(t("hdr.s.j.das", { n: num(B.hd.rujukan.das_ids.length, 0) })), subHtml: esc(t("hdr.s.s.das")), isiHtml: `<div id="hdr-p-das-tab"></div>${catatan("hdr.s.n.das")}<p class="jm-bantu"><a href="${esc(B.hd.rujukan.air_energi_href)}">${esc(t("hdr.s.air_energi"))}</a></p>${daftarCelah(B.hd.celah.slice(0, 1))}` }),
    ex({ id: "hdr-p-petab", ikon: "peta", topik: t("hdr.s.ey.peta"), judulHtml: esc(t("hdr.s.j.peta", { n: num(nP, 0) })), subHtml: esc(t("hdr.s.s.peta")), isiHtml: `<ul class="hdr-keterangan">${leg}</ul><div id="hdr-p-peta" class="rg3-peta" role="region" aria-label="${esc(t("hdr.s.peta_label"))}"></div>${catatan("hdr.s.n.peta")}` }),
  ].join("");
  if (B.tp) { grafikProv(); tabProv(); }
  if (B.ae) tabDas();
  gambarPeta(el);
  siapTautan("org", "provinsi").then(() => naikkan(el));
}
