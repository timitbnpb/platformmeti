/* /angin, tab Proyek: PLTB beroperasi (Sidrap, Tolo, Kluet), Tanah Laut, rencana RUPTL dan tabel proyek terpadu (GEM, RUPTL, proyek.json) dengan saringan status; peta; lepas pantai.
   Profil proyek unggulan dibaca dari topik/bayu.json (kasus) lewat id; turbin dan pemasok dari angin.json bersumber. Dibaca runtime. */
import { B, muat, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, kosongTab, daftarCelah, catatan, pil, orgLogoSel, proyekBayu, proyekById, kasusTopik, jumlahMw, luar, siapTautan, naikkan, gelap } from "/ang_umum.js";
import { nanti } from "/inti/umum.js";
import { muatMapLibre } from "/inti/maplibre.js";

let st = "";
const urut = () => B.ang.rujukan.pembangkit_status_urut;
function kartuProyek(u) {
  const p = proyekById(u.proyek_id), k = kasusTopik(u.kasus), prof = (k?.profil || []).filter((x) => !/Kapasitas|Turbin/i.test(tx(x.label))).slice(0, 5);
  const turbin = u.jumlah ? `${u.jumlah} x ${num(u.mw_unit, 1)} MW (${u.model})` : t("ang.pr.turbin_belum");
  const baris = (l, v) => `<div><dt>${esc(l)}</dt><dd>${v}</dd></div>`;
  return `<article class="ang-kartu"><header class="ang-kartu-k"><h3>${esc(tx(k?.nama) || p?.nama || u.k)}</h3>${p ? pil("ang.st.", p.status) : ""}</header>
    <p class="jm-bantu">${esc(tx(k?.lokasi) || p?.prov || "")}</p>
    <dl class="ang-prof">${baris(t("ang.pr.p.mw"), `<b>${esc(p?.mw != null ? num(p.mw, 0) + " MW" : "-")}</b>`)}${baris(t("ang.pr.p.turbin"), esc(turbin))}${u.menara_m ? baris(t("ang.pr.p.dimensi"), esc(t("ang.pr.dim", { m: u.menara_m, b: u.bilah_m }))) : ""}${prof.map((x) => baris(tx(x.label), esc(typeof x.nilai === "object" ? tx(x.nilai) : String(x.nilai) + (x.satuan ? " " + tx(x.satuan) : "")))).join("")}</dl>
    <div>${u.pemasok_org ? orgLogoSel(u.pemasok_org) : ""}</div>
    <div class="rg3-ab">${p ? bukti({ ruptl: "resmi", gem: "via-pihak-ketiga" }[p.status_sumber?.jenis] || "media", { sumber: p.status_sumber?.jenis || "", tanggal: p.status_sumber?.tanggal || "" }) : ""}${u.sumber_ids.slice(0, 2).map((s) => buktiS(s)).join("")}</div>
    <p class="jm-bantu"><a class="rg3-tautan" href="/topik?id=bayu#bab-${u.kasus === "tanah-laut" ? 40 : 39}">${esc(t("ang.pr.kasus"))}</a> ${p ? `<a class="rg3-tautan" href="/p/${esc(p.id)}">${esc(t("ang.pr.profil"))}</a>` : ""}</p></article>`;
}
function tabProyek() {
  const el = document.getElementById("ang-pr-tab"); if (!el) return;
  const baris = proyekBayu().filter((p) => !st || p.status === st);
  tabel(el, { satuan: "ang.u.proyek", per: 10, urutAwal: 2, menurun: true, kolom: [
    { label: t("ang.c.pltb"), v: (p) => p.nama, f: (p) => `<span class="rg3-idk"><b>${p.url ? luar(p.url, p.nama) : esc(p.nama)}</b><small>${esc(p.prov || "")}</small></span>` },
    { label: t("ang.c.status"), v: (p) => p.status, f: (p) => pil("ang.st.", p.status) },
    { label: t("ang.c.mw"), num: true, v: (p) => p.mw ?? -1, f: (p) => (p.mw != null ? `<b>${esc(num(p.mw, 0))}</b>` : "-") },
    { label: t("ang.c.pemilik"), v: (p) => p.pemilik?.nama || "", f: (p) => (p.pemilik?.nama ? orgLogoSel(p.pemilik.org_id, p.pemilik.nama) : "-") },
    { label: t("ang.c.cod"), num: true, v: (p) => p.cod_terbaru ?? p.cod_rencana ?? 0, f: (p) => (p.cod_terbaru || p.cod_rencana ? `<span class="rg3-idk"><b>${esc(String(p.cod_terbaru ?? p.cod_rencana))}</b><small>${esc(p.cod_jenis === "aktual" ? t("ang.cod.aktual") : t("ang.cod.rencana"))}</small></span>` : "-") },
    { label: t("ang.c.bukti"), v: (p) => p.status_sumber?.jenis || "", f: (p) => bukti({ ruptl: "resmi", gem: "via-pihak-ketiga" }[p.status_sumber?.jenis] || "media", { sumber: t("ang.sj." + (p.status_sumber?.jenis || "x")), tanggal: p.status_sumber?.tanggal || "" }) },
  ], baris });
}
function tabRuptl() {
  const el = document.getElementById("ang-pr-rt"); if (!el) return;
  const baris = (B.ruptl?.baris || []).filter((b) => B.ang.rujukan.ruptl_ids.includes(b.id));
  tabel(el, { satuan: "ang.u.proyek", per: 8, urutAwal: 2, menurun: true, kolom: [
    { label: t("ang.c.pltb"), v: (b) => b.nama, f: (b) => `<span class="rg3-idk"><b>${esc(b.nama)}</b><small>${esc(b.provinsi || "")}</small></span>` },
    { label: t("ang.c.status"), v: (b) => b.status, f: (b) => pil("ang.st.", b.status) },
    { label: t("ang.c.mw"), num: true, v: (b) => b.kapasitas_mw ?? -1, f: (b) => `<b>${esc(num(b.kapasitas_mw, 0))}</b>` },
    { label: t("ang.c.cod"), num: true, v: (b) => (b.cod_tahun || [0])[0], f: (b) => esc((b.cod_tahun || []).join(" - ") || "-") },
    { label: t("ang.c.pengembang"), v: (b) => b.pengembang_status || "", f: (b) => esc(b.pengembang_status || "-") },
    { label: t("ang.c.bukti"), v: () => "", f: (b) => bukti("resmi", { sumber: "RUPTL PLN 2025-2034", tanggal: String(b.tahun || ""), cara: `${t("ang.pr.hal")} ${b.halaman || "-"}; ${b.kapasitas_catatan || ""}` }) },
  ], baris });
}
async function gambarPeta(el) {
  const w = el.querySelector("#ang-pr-peta"); if (!w) return;
  try { await muatMapLibre(); } catch { w.textContent = t("rg3.map.gagal"); return; }
  const pm = new maplibregl.Map({ container: w, style: "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron"), center: [118, -2], zoom: 3.4, minZoom: 2, maxZoom: 10, dragRotate: false, pitchWithRotate: false, attributionControl: false });
  pm.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
  pm.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  const rows = proyekBayu().filter((p) => p.lat != null && p.lng != null && p.status !== "dibatalkan"), kotak = new maplibregl.LngLatBounds();
  for (const r of rows) {
    kotak.extend([r.lng, r.lat]);
    const m = document.createElement("div"); m.className = "rg3-mk rg3-pin ang-pin ang-pin-" + r.status; m.tabIndex = 0; m.setAttribute("role", "img"); m.setAttribute("aria-label", `${r.nama}, ${r.prov}`); m.innerHTML = ikon("angin", 14);
    new maplibregl.Marker({ element: m }).setLngLat([r.lng, r.lat]).addTo(pm);
    const pop = new maplibregl.Popup({ closeButton: false, offset: 14, className: "rg3-pop", maxWidth: "320px" }).setHTML(`<div class="rg3-tipm"><b>${esc(r.nama)}</b><span><em>${esc(t("ang.c.provinsi"))}</em><strong>${esc(r.prov || "-")}</strong></span><span><em>${esc(t("ang.c.mw"))}</em><strong>${esc(r.mw != null ? num(r.mw, 0) : "-")}</strong></span><span><em>${esc(t("ang.c.status"))}</em><strong>${esc(t("ang.st." + r.status))}</strong></span><span><em>${esc(t("ang.c.presisi"))}</em><strong>${esc(r.presisi || "-")}</strong></span></div>`);
    const buka = () => pop.setLngLat([r.lng, r.lat]).addTo(pm), tutup = () => pop.remove();
    m.addEventListener("pointerenter", buka); m.addEventListener("pointerleave", tutup); m.addEventListener("focus", buka); m.addEventListener("blur", tutup);
  }
  if (rows.length > 1) pm.fitBounds(kotak, { padding: 50, duration: 0, maxZoom: 6 });
}
export async function mulai(el) {
  await muat(["pt", "ruptl", "tb"]);
  if (!B.ang || !B.pt) { el.innerHTML = kosongTab("ang.kosong"); return; }
  const P = proyekBayu(), per = urut().map((s) => [s, P.filter((p) => p.status === s)]).filter(([, a]) => a.length), nP = P.filter((p) => p.lat != null && p.status !== "dibatalkan").length;
  const rupMw = (B.ruptl?.baris || []).filter((b) => b.teknologi === "bayu").reduce((s, b) => s + (b.kapasitas_mw || 0), 0), rup = B.ang.potensi.target.find((x) => x.k === "ruptl");
  const ubin = per.map(([s, a]) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon("angin", 22)}<b>${esc(t("ang.st." + s))}</b></div><p class="ang-angka">${esc(num(jumlahMw(a), 0))} <small>MW</small></p><p class="jm-bantu">${esc(t("ang.pr.n", { n: a.length }))}</p></div>`).join("");
  const opsi = [["", t("ang.semua"), P.length], ...per.map(([s, a]) => [s, t("ang.st." + s), a.length])];
  const leg = ["beroperasi", "konstruksi", "izin", "rencana", "ditunda"].map((s) => `<li class="ang-leg ang-pin-${s}">${ikon("angin", 14)}<span>${esc(t("ang.st." + s))}</span></li>`).join("");
  el.innerHTML = [
    ex({ id: "ang-pr-unggul", ikon: "proyek", topik: t("ang.pr.ey.unggul"), judulHtml: esc(t("ang.pr.j.unggul")), subHtml: esc(t("ang.pr.s.unggul")), isiHtml: `<div class="ang-kisi">${B.ang.proyek.unggulan.map(kartuProyek).join("")}</div>${catatan("ang.pr.n.unggul")}`, kakiHtml: kakiSumber(B.ang.proyek.unggulan.flatMap((u) => u.sumber_ids)) }),
    ex({ id: "ang-pr-ringkas", ikon: "petir", topik: t("ang.pr.ey.ringkas"), judulHtml: esc(t("ang.pr.j.ringkas", { n: P.length, mw: num(jumlahMw(P), 0) })), subHtml: esc(t("ang.pr.s.ringkas")), isiHtml: `<div class="rg3-kisi">${ubin}</div>`, kakiHtml: kakiSumber(["gem", "ruptl"]) }),
    ex({ id: "ang-pr-daftar", ikon: "tabel", topik: t("ang.pr.ey.daftar"), judulHtml: esc(t("ang.pr.j.daftar")), subHtml: esc(t("ang.pr.s.daftar")),
      isiHtml: `<div class="rg3-chips" role="group" aria-label="${esc(t("ang.pr.f"))}">${opsi.map(([k, l, n]) => `<button type="button" class="rg3-chip rg3-chipb" data-st="${esc(k)}" aria-pressed="${st === k}"><span>${esc(l)}</span> <i>${n}</i></button>`).join("")}</div><div id="ang-pr-tab"></div>${catatan("ang.pr.n.daftar")}${daftarCelah([B.ang.celah[9]])}` }),
    ex({ id: "ang-pr-ruptl", ikon: "kalender", topik: t("ang.pr.ey.ruptl"), judulHtml: esc(t("ang.pr.j.ruptl", { n: num(rupMw, 0), r: num(rup.nilai_mw / 1000, 1) })), subHtml: esc(t("ang.pr.s.ruptl")), isiHtml: `<div id="ang-pr-rt"></div>${catatan("ang.pr.n.ruptl")}`, kakiHtml: kakiSumber(["ruptl", "ruptl-faq"]) }),
    ex({ id: "ang-pr-petab", ikon: "peta", topik: t("ang.pr.ey.peta"), judulHtml: esc(t("ang.pr.j.peta", { n: num(nP, 0) })), subHtml: esc(t("ang.pr.s.peta")), isiHtml: `<ul class="ang-keterangan">${leg}</ul><div id="ang-pr-peta" class="rg3-peta" role="region" aria-label="${esc(t("ang.pr.peta_label"))}"></div>${catatan("ang.pr.n.peta")}` }),
    ex({ id: "ang-pr-lepas", ikon: "kapal", topik: t("ang.pr.ey.lepas"), judulHtml: esc(t("ang.pr.j.lepas")), subHtml: esc(tx(B.ang.proyek.lepas_pantai.ket)), isiHtml: `${buktiS(B.ang.proyek.lepas_pantai.sumber_id, B.ang.proyek.lepas_pantai.tingkat_bukti)}${daftarCelah([B.ang.celah[7]])}`, kakiHtml: kakiSumber(["esmap", "katadata277"]) }),
  ].join("");
  tabProyek(); tabRuptl(); gambarPeta(el);
  el.querySelector(".rg3-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-st]"); if (!b) return;
    st = b.dataset.st; for (const x of el.querySelectorAll("[data-st]")) x.setAttribute("aria-pressed", String(x.dataset.st === st));
    nanti(tabProyek);
  });
  siapTautan("org", "proyek").then(() => naikkan(el));
}
