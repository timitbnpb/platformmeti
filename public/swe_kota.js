/* /sampah-energi, tab 33 kota: proyek PSEL dari psel.json (kota, ton per hari, MW, status, pengembang, COD) dengan saringan status, grafik kapasitas, peta (koordinat dari proyek_terpadu.json). */
import { B, t, ex, num, esc, ikon, tx, buktiS, kakiSumber, tabel, batangSvg, tipHtml, kosongTab, daftarCelah, catatan, pil, orgLogoSel, tautProvinsi, tautProyek, siapTautan, naikkan, pselRows, pertama, statusDari, proyekById, gelap, bukti, luar } from "/swe_umum.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { nanti } from "/inti/umum.js";

let st = "";
const URUT = () => B.sw.rujukan.status_urut;
function grafik() {
  const g = document.getElementById("swe-k-grafik"); if (!g) return;
  const top = pselRows().filter((r) => pertama(r.kapasitas_ton_hari)).sort((a, b) => pertama(b.kapasitas_ton_hari) - pertama(a.kapasitas_ton_hari)).slice(0, 12);
  g.innerHTML = batangSvg({ el: g, d: 0, satuan: t("swe.u.ton_hari"), label: t("swe.k.j.grafik"), seri: [{ k: "v", kelas: "swe-s-ton" }],
    baris: top.map((r) => ({ label: r.kota, tip: r.nama, th: tipHtml(r.nama, [[t("swe.c.status"), t("swe.st." + statusDari(r))], [t("swe.u.ton_hari"), num(pertama(r.kapasitas_ton_hari), 0)], ["MW", pertama(r.kapasitas_mw) != null ? num(pertama(r.kapasitas_mw), 1) : "-"]]), bagian: [{ k: "v", nilai: pertama(r.kapasitas_ton_hari) }] })) });
}
function tabKota() {
  const el = document.getElementById("swe-k-tab"); if (!el) return;
  const baris = pselRows().filter((r) => !st || statusDari(r) === st);
  tabel(el, { satuan: "swe.u.proyek", per: 8, urutAwal: 3, menurun: true, kolom: [
    { label: t("swe.c.proyek_kota"), v: (r) => r.kota, f: (r) => `<span class="rg3-idk"><b>${tautProyek(r.proyek_id, r.nama.replace(/\s*\(PSN nomor \d+\)/, ""))}</b><small>${tautProvinsi(String(r.kode_bps).slice(0, 2), r.provinsi)}</small></span>` },
    { label: t("swe.c.status"), v: (r) => statusDari(r), f: (r) => pil("swe.st.", statusDari(r)) },
    { label: t("swe.c.dasar"), v: (r) => (r.perpres_35_2018 ? 1 : 0), f: (r) => (r.perpres_35_2018 ? pil("swe.dasar.", "p35") : pil("swe.dasar.", "p109")) },
    { label: t("swe.u.ton_hari"), num: true, v: (r) => pertama(r.kapasitas_ton_hari) ?? -1, f: (r) => (pertama(r.kapasitas_ton_hari) ? `<b>${esc(num(pertama(r.kapasitas_ton_hari), 0))}</b>` : "-") },
    { label: "MW", num: true, v: (r) => pertama(r.kapasitas_mw) ?? -1, f: (r) => (pertama(r.kapasitas_mw) != null ? esc(num(pertama(r.kapasitas_mw), 1)) : "-") },
    { label: t("swe.c.pengembang"), v: (r) => r.pengembang[0]?.nama || "", f: (r) => (r.pengembang[0] ? orgLogoSel(r.pengembang[0].organisasi_id, r.pengembang[0].nama.replace(/^Badan Pengelola Investasi Daya Anagata Nusantara \(Danantara\)$/, "Danantara")) : `<span class="jm-bantu">${esc(t("swe.belum_ada"))}</span>`) },
    { label: t("swe.c.cod"), num: true, v: (r) => pertama(r.cod_target) ?? 0, f: (r) => (pertama(r.cod_target) ? esc(String(pertama(r.cod_target))) : "-") },
    { label: t("swe.c.bukti"), v: (r) => r.tingkat_bukti, f: (r) => bukti(r.tingkat_bukti || "media", { sumber: r.sumber?.[0]?.url ? new URL(r.sumber[0].url).hostname.replace(/^www\./, "") : "psel.json", tanggal: r.sumber?.[0]?.tanggal || "" }) },
  ], baris });
  siapTautan("proyek", "provinsi").then(() => naikkan(el));
}
async function peta(el) {
  const w = el.querySelector("#swe-k-peta"); if (!w) return;
  try { await muatMapLibre(); } catch { w.textContent = t("rg3.map.gagal"); return; }
  const pm = new maplibregl.Map({ container: w, style: "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron"), center: [112, -6], zoom: 4.6, minZoom: 2, maxZoom: 10, dragRotate: false, pitchWithRotate: false, attributionControl: false });
  pm.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
  pm.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  const kotak = new maplibregl.LngLatBounds(); let n = 0;
  for (const r of pselRows()) {
    const p = proyekById(r.proyek_id); if (!p || p.lat == null || p.lng == null) continue;
    n++; kotak.extend([p.lng, p.lat]);
    const s = statusDari(r), m = document.createElement("div"); m.className = "rg3-mk rg3-pin swe-pin swe-pin-" + s; m.tabIndex = 0; m.setAttribute("role", "img"); m.setAttribute("aria-label", `${r.kota}, ${r.provinsi}`); m.innerHTML = ikon("sampah-energi", 14);
    new maplibregl.Marker({ element: m }).setLngLat([p.lng, p.lat]).addTo(pm);
    const pop = new maplibregl.Popup({ closeButton: false, offset: 14, className: "rg3-pop", maxWidth: "320px" }).setHTML(`<div class="rg3-tipm"><b>${esc(r.kota)}</b><span><em>${esc(t("swe.c.status"))}</em><strong>${esc(t("swe.st." + s))}</strong></span><span><em>${esc(t("swe.u.ton_hari"))}</em><strong>${esc(pertama(r.kapasitas_ton_hari) != null ? num(pertama(r.kapasitas_ton_hari), 0) : "-")}</strong></span><span><em>${esc(t("swe.c.presisi"))}</em><strong>${esc(p.presisi || "-")}</strong></span></div>`);
    const buka = () => pop.setLngLat([p.lng, p.lat]).addTo(pm), tutup = () => pop.remove();
    m.addEventListener("pointerenter", buka); m.addEventListener("pointerleave", tutup); m.addEventListener("focus", buka); m.addEventListener("blur", tutup);
  }
  if (n > 1) pm.fitBounds(kotak, { padding: 50, duration: 0, maxZoom: 7 });
}
export function mulai(el) {
  if (!B.sw || !B.psel) { el.innerHTML = kosongTab("swe.kosong"); return; }
  const P = pselRows(), per = URUT().map((s) => [s, P.filter((r) => statusDari(r) === s)]).filter(([, a]) => a.length), ton = (a) => a.reduce((s, r) => s + (pertama(r.kapasitas_ton_hari) || 0), 0);
  const ubin = per.map(([s, a]) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon("sampah-energi", 22)}<b>${esc(t("swe.st." + s))}</b></div><p class="swe-angka">${esc(num(a.length, 0))} <small>${esc(t("swe.u.proyek_k"))}</small></p><p class="jm-bantu">${esc(t("swe.k.ton", { n: num(ton(a), 0) }))}</p></div>`).join("");
  const opsi = [["", t("swe.semua"), P.length], ...per.map(([s, a]) => [s, t("swe.st." + s), a.length])];
  const leg = ["beroperasi", "konstruksi", "rencana", "tidak-diketahui"].map((s) => `<li class="swe-leg swe-pin-${s}">${ikon("sampah-energi", 14)}<span>${esc(t("swe.st." + s))}</span></li>`).join("");
  el.innerHTML = [
    ex({ id: "swe-k-ringkas", ikon: "kawasan", topik: t("swe.k.ey.ringkas"), judulHtml: esc(t("swe.k.j.ringkas", { n: P.length, kota: B.sw.program.ringkas.kota })), subHtml: esc(t("swe.k.s.ringkas")), isiHtml: `<div class="rg3-kisi">${ubin}</div>${daftarCelah([B.sw.celah[0], B.sw.celah[1]])}`, kakiHtml: kakiSumber(["detik-33", "bisnis-10kota", "empat"]) }),
    ex({ id: "swe-k-gr", ikon: "grafik", topik: t("swe.k.ey.grafik"), judulHtml: esc(t("swe.k.j.grafik")), subHtml: esc(t("swe.k.s.grafik")), isiHtml: `<div id="swe-k-grafik"></div>` }),
    ex({ id: "swe-k-daftar", ikon: "tabel", topik: t("swe.k.ey.daftar"), judulHtml: esc(t("swe.k.j.daftar")), subHtml: esc(t("swe.k.s.daftar")),
      isiHtml: `<div class="rg3-chips" role="group" aria-label="${esc(t("swe.k.f"))}">${opsi.map(([k, l, n]) => `<button type="button" class="rg3-chip rg3-chipb" data-st="${esc(k)}" aria-pressed="${st === k}"><span>${esc(l)}</span> <i>${n}</i></button>`).join("")}</div><div id="swe-k-tab"></div>${catatan("swe.k.n.daftar")}` }),
    ex({ id: "swe-k-petab", ikon: "peta", topik: t("swe.k.ey.peta"), judulHtml: esc(t("swe.k.j.peta")), subHtml: esc(t("swe.k.s.peta")), isiHtml: `<ul class="swe-keterangan">${leg}</ul><div id="swe-k-peta" class="rg3-peta" role="region" aria-label="${esc(t("swe.k.peta_label"))}"></div>${catatan("swe.k.n.peta")}` }),
  ].join("");
  grafik(); tabKota(); peta(el);
  el.querySelector(".rg3-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-st]"); if (!b) return;
    st = b.dataset.st; for (const x of el.querySelectorAll("[data-st]")) x.setAttribute("aria-pressed", String(x.dataset.st === st));
    nanti(tabKota);
  });
}
