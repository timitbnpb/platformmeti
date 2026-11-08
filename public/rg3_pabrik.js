/* /rantai-global, tab Pabrik: peta pabrik dunia berbendera, ringkasan ASEAN, daftar pabrik, neraca pasokan Indonesia per komponen per tahun.
   Sumber: pabrik_dunia.json, neraca_pasokan.json. Koordinat = pusat kota/negara (bukan gerbang pabrik); neraca = Hipotesis (faktor konversi tanpa standar resmi).
   INP: pilihan komponen/skenario seketika, grafik menyusul lewat nanti(). */
import { D, berisi, ex, t, esc, ikon, num, bukti, cariSumber, kosongTab, urlGet, urlSet, sumberBerkas, catatan, daftarCelah, bendera, namaNegara, namaOrg, logoHtml, chip, warnaIdx, lbl, PUSAT } from "/rg3_umum.js";
import { nanti } from "/inti/umum.js";
import { pilihHtml } from "/inti/komponen.js";
import { pasangPilih } from "/inti/pilih.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { batangSvg, kolomSvg, legendaHtml, tabel, tipHtml } from "/info_hijau.js";

let petaObj = null, nk = "", skn = "ruptl";
const PB = () => D.pabrik?.baris || [], NR = () => D.neraca?.baris || [];
const kapTeks = (k) => (k?.nilai == null ? t("rg3.pr.belum") : `${num(k.nilai, k.nilai % 1 ? 1 : 0)} ${k.satuan || ""}`);
const segTeks = (b) => (b.segmen || []).map((s) => chip("rg3-w" + warnaIdx(s), "", lbl("rg3.seg.", s))).join("");
const stTeks = (s) => chip("rg3-st-" + (s || "x"), "", lbl("rg3.pb.st.", s || "x"));
const buktiB = (b) => { const x = b.bukti?.[0]; return x ? bukti(x.tingkat_bukti, { sumber: cariSumber(D.pabrik, x.sumber_id)?.penerbit || "", tanggal: x.tanggal }) : bukti(""); };

/* ---------- peta ---------- */
const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
async function peta() {
  const el = document.getElementById("rg3-b-peta"); if (!el) return;
  try { await muatMapLibre(); } catch { el.textContent = t("rg3.map.gagal"); return; }
  if (petaObj) { petaObj.remove(); petaObj = null; }
  const per = new Map();
  for (const b of PB()) { if (!PUSAT[String(b.negara_iso2).toLowerCase()]) continue; const k = b.negara_iso2.toLowerCase(), o = per.get(k) || { iso: k, baris: [] }; o.baris.push(b); per.set(k, o); }
  petaObj = new maplibregl.Map({ container: el, style: "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron"), center: [105, 25], zoom: 1.8, minZoom: 1, maxZoom: 9, dragRotate: false, pitchWithRotate: false, attributionControl: false });
  petaObj.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
  petaObj.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  const kotak = new maplibregl.LngLatBounds(); for (const o of per.values()) kotak.extend(PUSAT[o.iso]);
  if (per.size) petaObj.fitBounds(kotak, { padding: 60, duration: 0, maxZoom: 3.4 });
  const maks = Math.max(1, ...[...per.values()].map((o) => o.baris.length));
  for (const o of per.values()) {
    const u = 30 + Math.round(22 * Math.sqrt(o.baris.length / maks)), m = document.createElement("div");
    m.className = "rg3-mk rg3-mk-n"; m.style.width = m.style.height = u + "px"; m.tabIndex = 0; m.setAttribute("role", "button"); m.setAttribute("aria-label", `${namaNegara(o.iso)}: ${o.baris.length}`);
    m.innerHTML = `<img src="/img/bendera/${esc(o.iso)}.svg" alt="" width="${u}" height="${u}" data-galat="hapus"><i>${o.baris.length}</i>`;
    new maplibregl.Marker({ element: m }).setLngLat(PUSAT[o.iso]).addTo(petaObj);
    const pop = new maplibregl.Popup({ closeButton: false, offset: u / 2 + 4, className: "rg3-pop", maxWidth: "320px" }).setHTML(`<div class="rg3-tipm"><b>${bendera(o.iso, 20)}${esc(namaNegara(o.iso))}</b>${o.baris.slice(0, 6).map((b) => `<span><em>${esc(b.perusahaan)}</em><strong>${esc(kapTeks(b.kapasitas))}</strong></span>`).join("")}${o.baris.length > 6 ? `<small>${esc(t("rg3.pb.lain", { n: o.baris.length - 6 }))}</small>` : ""}</div>`);
    const buka = () => pop.setLngLat(PUSAT[o.iso]).addTo(petaObj), tutup = () => pop.remove();
    m.addEventListener("pointerenter", buka); m.addEventListener("pointerleave", tutup); m.addEventListener("focus", buka); m.addEventListener("blur", tutup); m.addEventListener("click", buka);
  }
  for (const b of PB().filter((x) => x.koordinat)) {
    const m = document.createElement("div"); m.className = "rg3-mk rg3-pin"; m.tabIndex = 0; m.setAttribute("role", "img"); m.setAttribute("aria-label", `${b.perusahaan}, ${b.kota || ""}`); m.innerHTML = ikon("pabrik", 16);
    new maplibregl.Marker({ element: m }).setLngLat([b.koordinat.lon, b.koordinat.lat]).addTo(petaObj);
    const pop = new maplibregl.Popup({ closeButton: false, offset: 14, className: "rg3-pop" }).setHTML(`<div class="rg3-tipm"><b>${bendera(b.negara_iso2.toLowerCase(), 20)}${esc(b.perusahaan)}</b><span><em>${esc(t("rg3.pb.kota"))}</em><strong>${esc(b.kota || "-")}</strong></span><span><em>${esc(t("rg3.pb.kap"))}</em><strong>${esc(kapTeks(b.kapasitas))}</strong></span><span><em>${esc(t("rg3.pb.status"))}</em><strong>${esc(lbl("rg3.pb.st.", b.status))}</strong></span><small>${esc(t("rg3.pb.koord_" + (b.koordinat.tingkat === "pusat-kota" ? "kota" : "lain")))}</small></div>`);
    const buka = () => pop.setLngLat([b.koordinat.lon, b.koordinat.lat]).addTo(petaObj), tutup = () => pop.remove();
    m.addEventListener("pointerenter", buka); m.addEventListener("pointerleave", tutup); m.addEventListener("focus", buka); m.addEventListener("blur", tutup);
  }
}

/* ---------- ASEAN dan daftar ---------- */
function asean() {
  const a = D.pabrik?.ringkasan_asean, el = document.getElementById("rg3-b-as"); if (!el || !a?.negara?.length) return;
  const B = [...a.negara].sort((x, y) => (y.modul || 0) - (x.modul || 0));
  document.getElementById("rg3-b-as-l").innerHTML = legendaHtml([{ kelas: "rg3-s-modul", label: t("rg3.pb.modul") }, { kelas: "rg3-s-sel", label: t("rg3.pb.sel") }]);
  el.innerHTML = batangSvg({ el, d: 1, label: t("rg3.pb.ey.asean"), satuan: a.satuan || "GW", seri: [{ k: "modul", kelas: "rg3-s-modul" }, { k: "sel", kelas: "rg3-s-sel" }],
    baris: B.map((n) => ({ label: namaNegara(n.iso2), bendera: n.iso2.toLowerCase(), sorot: n.iso2 === "ID", tip: `${namaNegara(n.iso2)}`, th: tipHtml(namaNegara(n.iso2), [[t("rg3.pb.modul"), n.modul == null ? "-" : `${num(n.modul, 1)} ${a.satuan}`], [t("rg3.pb.sel"), n.sel == null ? "-" : `${num(n.sel, 1)} ${a.satuan}`], [t("rg3.pb.per"), a.per]], { img: `/img/bendera/${n.iso2.toLowerCase()}.svg` }), bagian: [{ k: "modul", nilai: n.modul || 0 }, { k: "sel", nilai: n.sel || 0 }] })) });
}
function tabelPb() {
  const el = document.getElementById("rg3-b-tb"); if (!el) return;
  tabel(el, { satuan: "rg3.pb.u", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("rg3.pb.perusahaan"), v: (b) => b.perusahaan, f: (b) => `<span class="rg3-org">${logoHtml(b.org_id, b.perusahaan, "", "rg3-lg rg3-lg-k")}<b>${namaOrg(b.org_id, b.perusahaan)}</b></span>` },
    { label: t("rg3.p.f.neg"), v: (b) => namaNegara(b.negara_iso2), f: (b) => `<span class="rg3-neg">${bendera(b.negara_iso2.toLowerCase(), 18)}<span>${esc(namaNegara(b.negara_iso2))}</span></span>${b.kota ? `<small class="rg3-catat">${esc(b.kota)}</small>` : ""}` },
    { label: t("rg3.pb.segmen"), v: (b) => (b.segmen || []).join(","), f: (b) => `<span class="rg3-chips">${segTeks(b)}</span>` },
    { label: t("rg3.pb.kap"), num: true, v: (b) => b.kapasitas?.nilai ?? null, f: (b) => `<b>${esc(kapTeks(b.kapasitas))}</b>${b.kapasitas?.cakupan ? `<small class="rg3-catat">${esc(b.kapasitas.cakupan)}</small>` : ""}` },
    { label: t("rg3.pb.status"), v: (b) => b.status || "", f: (b) => stTeks(b.status) },
    { label: t("rg3.h.bukti"), v: (b) => b.bukti?.[0]?.tingkat_bukti || "", f: buktiB },
  ], baris: PB() });
}

/* ---------- neraca pasokan ---------- */
const komp = () => NR().filter((b) => (b.skenario?.ruptl || []).length);
function neraca() {
  const b = komp().find((x) => x.id === nk) || komp()[0]; if (!b) return; nk = b.id;
  const seri = b.skenario[skn] || b.skenario.ruptl, ada = seri.some((r) => r.kapasitas != null), el = document.getElementById("rg3-b-ng");
  const ket = document.getElementById("rg3-b-nk");
  ket.innerHTML = `<div class="rg3-info${ada ? "" : ""}">${ikon("info", 18)}<p>${esc(t("rg3.pb.faktor", { f: num(b.faktor.nilai, 1), k: b.faktor.ket }))} ${bukti(b.faktor.tingkat_bukti, { cara: b.faktor.ket })}</p></div>${ada ? "" : `<div class="rg3-info">${ikon("tanya", 18)}<p>${esc(b.kapasitas?.catatan || t("rg3.pb.tak_terbaca"))}</p></div>`}${b.peluang ? `<div class="rg3-info rg3-info-ok">${ikon("tag", 18)}<p>${esc(b.peluang.teks)} ${bukti(b.peluang.label)}</p></div>` : ""}`;
  document.getElementById("rg3-b-nl").innerHTML = legendaHtml(ada ? [{ kelas: "rg3-s-lokal", label: t("rg3.pb.lokal") }, { kelas: "rg3-s-celah", label: t("rg3.pb.celah") }] : [{ kelas: "rg3-s-butuh", label: t("rg3.pb.butuh") }]);
  el.innerHTML = kolomSvg({ el, satuan: b.satuan, label: b.nama, seri: ada ? [{ k: "lokal", kelas: "rg3-s-lokal" }, { k: "celah", kelas: "rg3-s-celah" }] : [{ k: "butuh", kelas: "rg3-s-butuh" }],
    kategori: seri.map((r) => ({ label: String(r.tahun), nilai: ada ? { lokal: Math.min(r.kebutuhan, r.kapasitas || 0), celah: r.celah || 0 } : { butuh: r.kebutuhan }, tip: String(r.tahun),
      th: tipHtml(String(r.tahun), [[t("rg3.pb.butuh"), `${num(r.kebutuhan, 0)} ${b.satuan}`], [t("rg3.pb.kapasitas"), r.kapasitas == null ? t("rg3.pr.belum") : `${num(r.kapasitas, 0)} ${b.satuan}`], [t("rg3.pb.celah"), r.celah == null ? t("rg3.pr.belum") : `${num(r.celah, 0)} ${b.satuan}`], [t("rg3.pb.impor"), r.impor_tersirat_pct == null ? t("rg3.pr.belum") : `${num(r.impor_tersirat_pct, 0)}%`]]) })) });
  const v = b.validasi_impor;
  document.getElementById("rg3-b-nv").innerHTML = v ? `<p class="jm-bantu ih-catatan">${esc(t("rg3.pb.validasi", { hs: v.hs, th: v.tahun, usd: num(v.usd / 1e6, 0) }))}</p>` : "";
}

export function mulai(el) {
  if (!berisi("pabrik") && !komp().length) { el.innerHTML = kosongTab("rg3.pb.kosong_data"); return; }
  nk = urlGet("bk"); skn = urlGet("bs") === "ruptl_plts100" ? "ruptl_plts100" : "ruptl";
  const nNeg = new Set(PB().map((b) => b.negara_iso2)).size, N = komp();
  el.innerHTML = [
    berisi("pabrik") ? ex({ id: "rg3-b-pt", ikon: "globe", topik: t("rg3.pb.ey.peta"), judulHtml: esc(t("rg3.pb.j.peta", { n: num(PB().length), m: num(nNeg) })), subHtml: esc(t("rg3.pb.s.peta")), isiHtml: `<div id="rg3-b-peta" class="rg3-peta" role="region" aria-label="${esc(t("rg3.map.label"))}"></div>${catatan("rg3.pb.n.peta")}`, kakiHtml: sumberBerkas(D.pabrik) }) : "",
    D.pabrik?.ringkasan_asean?.negara?.length ? ex({ id: "rg3-b-asean", ikon: "asean", topik: t("rg3.pb.ey.asean"), judulHtml: esc(t("rg3.pb.j.asean", { m: num(D.pabrik.ringkasan_asean.indonesia_dalam_negeri?.kapasitas_mwp ? D.pabrik.ringkasan_asean.indonesia_dalam_negeri.kapasitas_mwp / 1000 : 0, 1), n: num(D.pabrik.ringkasan_asean.indonesia_dalam_negeri?.produsen_modul || 0) })), subHtml: esc(t("rg3.pb.s.asean", { per: D.pabrik.ringkasan_asean.per })), isiHtml: `<div id="rg3-b-as-l"></div><div id="rg3-b-as" class="ih-bagan"></div><p class="jm-bantu ih-catatan">${bukti(D.pabrik.ringkasan_asean.tingkat_bukti, { sumber: cariSumber(D.pabrik, D.pabrik.ringkasan_asean.sumber_id)?.penerbit || "" })} ${esc(D.pabrik.ringkasan_asean.indonesia_dalam_negeri?.ket || "")}</p>` }) : "",
    berisi("pabrik") ? ex({ id: "rg3-b-daftar", ikon: "pabrik", topik: t("rg3.pb.ey.daftar"), judulHtml: esc(t("rg3.pb.j.daftar", { n: num(PB().length) })), subHtml: esc(t("rg3.pb.s.daftar")), isiHtml: `<div id="rg3-b-tb"></div>${daftarCelah(D.pabrik.meta?.celah)}` }) : "",
    N.length ? ex({ id: "rg3-b-neraca", ikon: "grafik", topik: t("rg3.pb.ey.neraca"), judulHtml: esc(t("rg3.pb.j.neraca", { n: num(N.length) })), subHtml: esc(t("rg3.pb.s.neraca")),
      isiHtml: `<div class="jm-saring rg3-saring rg3-saring-2">${pilihHtml({ id: "rg3-b-k", ikon: "tag", label: t("rg3.pb.f.komp"), opsi: N.map((b) => [b.id, b.nama, "tag"]), nilai: nk })}${pilihHtml({ id: "rg3-b-s", ikon: "jenis", label: t("rg3.pb.f.skenario"), opsi: [["ruptl", t("rg3.pb.sk.ruptl"), "kalender"], ["ruptl_plts100", t("rg3.pb.sk.plts100"), "bintang"]], nilai: skn })}</div><div id="rg3-b-nk"></div><div id="rg3-b-nl"></div><div id="rg3-b-ng" class="ih-bagan"></div><div id="rg3-b-nv"></div>${catatan("rg3.pb.n.neraca")}${daftarCelah(D.neraca.celah)}`, kakiHtml: sumberBerkas(D.neraca) }) : "",
  ].join("");
  pasangPilih();
  asean(); tabelPb(); neraca(); nanti(peta);
  el.querySelector("#rg3-b-k")?.addEventListener("change", (e) => { nk = e.target.value; urlSet({ bk: nk }); nanti(neraca); });
  el.querySelector("#rg3-b-s")?.addEventListener("change", (e) => { skn = e.target.value; urlSet({ bs: skn === "ruptl" ? "" : skn }); nanti(neraca); });
}
