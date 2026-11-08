/* /surya, tab Polisilikon, wafer, sel, modul: rantai pabrikan. Semua baris dibaca saat runtime dari berkas yang sudah ada (pemasok_surya, rantai_plts, pabrik_dunia, neraca_pasokan,
   benchmark_harga, produk); modul ini hanya menyusunnya per segmen. Neraca = Hipotesis (kapasitas tetap, faktor 1 MWp modul = 1 MWp sel = 1 MWp wafer). INP: pilihan seketika, tabel dan grafik menyusul lewat nanti(). */
import { X, R, L, t, ex, num, esc, ikon, bukti, luar, bendera, negaraSel, chip, chipSeg, logoHtml, namaOrg, kosongTab, daftarCelah, catatan, tabel, kolomSvg, legendaHtml, tipHtml, muat, mwTeks } from "/sy_umum.js";
import { nanti } from "/inti/umum.js";
import { pilihHtml } from "/inti/komponen.js";
import { pasangPilih } from "/inti/pilih.js";
import { muatMapLibre } from "/inti/maplibre.js";

const SEG = ["polisilikon", "wafer", "sel", "modul"];
const NERACA = [["wafer", "wafer"], ["sel_surya", "sel"], ["modul", "modul"]];
let seg = "polisilikon", nk = "modul", ns = "ruptl_plts100", peta = null;
const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
const kapSeg = (b, s) => (b.kapasitas || []).filter((k) => (k.segmen || []).includes(s) && k.nilai != null).sort((a, z) => z.nilai - a.nilai)[0] || null;
const pemain = (s) => (X.pemasok?.baris || []).filter((b) => (b.segmen || []).includes(s));

function tabelPemain() {
  const el = document.getElementById("sur-r-tb"); if (!el) return;
  tabel(el, { satuan: "sur.u.pemain", per: 8, urutAwal: 2, menurun: true, kolom: [
    { label: t("sur.c.pemain"), v: (b) => b.nama, f: (b) => `<span class="rg3-org">${logoHtml(b.id, b.nama, b.logo)}<span class="rg3-idk"><b>${namaOrg(b.id, b.nama)}</b></span></span>` },
    { label: t("sur.c.negara"), v: (b) => b.negara_iso2, f: (b) => negaraSel(String(b.negara_iso2).toLowerCase(), 18) },
    { label: t("sur.c.kapasitas"), num: true, v: (b) => kapSeg(b, seg)?.nilai ?? -1, f: (b) => { const k = kapSeg(b, seg); return k ? `<span class="rg3-idk"><b>${esc(num(k.nilai, k.nilai % 1 ? 1 : 0))} ${esc(k.satuan)}</b><small>${esc(k.periode || "")}</small></span>` : "-"; } },
    { label: t("sur.c.id_pabrik"), num: true, v: (b) => (b.pabrik_indonesia || []).length, f: (b) => ((b.pabrik_indonesia || []).length ? `<b>${num((b.pabrik_indonesia || []).length)}</b>` : "-") },
    { label: t("sur.c.bukti"), v: (b) => kapSeg(b, seg)?.tingkat_bukti || "", f: (b) => { const k = kapSeg(b, seg); return k ? bukti(k.tingkat_bukti, { sumber: k.sumber_penerbit, tanggal: k.tanggal_terbit, cara: k.kutipan }) : bukti(""); } },
  ], baris: pemain(seg) });
}
/** Pabrik di Indonesia: modul (DJEBTKE) + fasilitas lain (sel, wafer, kaca) dari rantai_plts.json. */
function barisPabrikId() {
  const P = X.rantaiPlts; if (!P) return [];
  return [...(P.fasilitas_lain || []).filter((f) => !/baterai|katoda|HLI|CATIB|REPT|LBM|Antam/i.test(f.nama + " " + (f.komponen || []).join(" "))).map((f) => ({ id: f.id, nama: f.nama, org_id: f.perusahaan_id, kota: f.lokasi?.kota, provinsi: f.lokasi?.provinsi, lat: f.lokasi?.lat, lng: f.lokasi?.lng, mwp: f.kapasitas, komponen: (f.komponen || []).join(", "), status: f.status, pasar: f.pasar, jenis: "lain" })),
    ...(P.pabrikan || []).map((b) => ({ id: b.id, nama: b.nama, org_id: b.id, kota: b.kota, provinsi: b.provinsi, mwp: b.mwp, komponen: "modul", status: "beroperasi", pasar: b.pasar, jenis: "modul", logo: b.logo }))];
}
const STATUS = { beroperasi: "ok", operasi: "ok", bangun: "info", konstruksi: "info", rencana: "warn", "belum-dipastikan": "x" };
function tabelId() {
  const el = document.getElementById("sur-r-id"); if (!el) return;
  tabel(el, { satuan: "sur.u.pabrik", per: 8, urutAwal: 2, menurun: true, kolom: [
    { label: t("sur.c.pabrik"), v: (b) => b.nama, f: (b) => `<span class="rg3-org">${logoHtml(b.org_id, b.nama, b.logo)}<span class="rg3-idk"><b>${namaOrg(b.org_id, b.nama)}</b><small>${esc(b.komponen || "")}</small></span></span>` },
    { label: t("sur.c.lokasi"), v: (b) => b.kota || "", f: (b) => esc([b.kota, b.provinsi].filter(Boolean).join(", ") || "-") },
    { label: t("sur.c.mwp"), num: true, v: (b) => b.mwp ?? -1, f: (b) => (b.mwp != null ? `<b>${esc(num(b.mwp, 0))}</b> MWp/${esc(t("sur.u.th"))}` : "-") },
    { label: t("sur.c.pasar"), v: (b) => b.pasar || "", f: (b) => (b.pasar ? chip("rg3-w" + (b.pasar === "ekspor" ? 1 : b.pasar === "lokal" ? 2 : 3), "", t("sur.pasar." + b.pasar)) : "-") },
    { label: t("sur.c.status"), v: (b) => b.status || "", f: (b) => chip("sur-st-" + (STATUS[b.status] || "x"), "", t("sur.st." + (b.status || "x"))) },
  ], baris: barisPabrikId() });
}
async function gambarPeta(el) {
  const w = el.querySelector("#sur-r-peta"); if (!w) return;
  try { await muatMapLibre(); } catch { w.textContent = t("rg3.map.gagal"); return; }
  if (peta) { peta.remove(); peta = null; }
  const pm = peta = new maplibregl.Map({ container: w, style: "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron"), center: [113, -4], zoom: 4, minZoom: 2, maxZoom: 10, dragRotate: false, pitchWithRotate: false, attributionControl: false });
  pm.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
  pm.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  const kota = X.rantaiPlts?.kota || [], kotak = new maplibregl.LngLatBounds();
  for (const k of kota) {
    kotak.extend([k.lng, k.lat]);
    const m = document.createElement("div"); m.className = "rg3-mk rg3-pin sur-pin-l"; m.tabIndex = 0; m.setAttribute("role", "img"); m.setAttribute("aria-label", `${k.kota}, ${k.pabrik}`); m.innerHTML = ikon("pabrik", 16);
    new maplibregl.Marker({ element: m }).setLngLat([k.lng, k.lat]).addTo(pm);
    const pop = new maplibregl.Popup({ closeButton: false, offset: 14, className: "rg3-pop", maxWidth: "300px" }).setHTML(`<div class="rg3-tipm"><b>${esc(k.kota)}</b><span><em>${esc(t("sur.c.pabrik"))}</em><strong>${esc(num(k.pabrik))}</strong></span><span><em>${esc(t("sur.c.mwp"))}</em><strong>${esc(num(k.mwp, 0))}</strong></span></div>`);
    const buka = () => pop.setLngLat([k.lng, k.lat]).addTo(pm), tutup = () => pop.remove();
    m.addEventListener("pointerenter", buka); m.addEventListener("pointerleave", tutup); m.addEventListener("focus", buka); m.addEventListener("blur", tutup);
  }
  if (kota.length > 1) pm.fitBounds(kotak, { padding: 60, duration: 0, maxZoom: 7 });
}
/* ---------- neraca ---------- */
function barisNeraca() { const b = (X.neraca?.baris || []).find((x) => x.id === nk); return b?.skenario?.[ns] || null; }
function gambarNeraca(el) {
  const w = el.querySelector("#sur-r-ng"); if (!w) return;
  const s = barisNeraca(), b = (X.neraca?.baris || []).find((x) => x.id === nk); if (!s || !b) { w.innerHTML = kosongTab("sur.kosong_data"); return; }
  const pk = s.reduce((a, r) => (r.celah > a.celah ? r : a), s[0]);
  el.querySelector("#sur-r-nu").innerHTML = [[t("sur.r.u.puncak", { th: pk.tahun }), num(pk.kebutuhan, 0), b.satuan], [t("sur.r.u.celah", { th: pk.tahun }), num(pk.celah, 0), b.satuan], [t("sur.r.u.impor"), num(pk.impor_tersirat_pct, 0), "%"]]
    .map(([l, v, u]) => `<div class="rg3-kartu sur-ubin"><span class="jm-kh-lbl">${esc(l)}</span><p class="sur-angka"><b>${esc(v)}</b><span>${esc(u)}</span></p><span class="rg3-ab">${bukti("hipotesis", { cara: t("sur.r.rumus") })}</span></div>`).join("");
  w.innerHTML = kolomSvg({ el: w, satuan: b.satuan, label: t("sur.r.j.neraca"),
    seri: [{ k: "dalam", kelas: "sur-s-kap" }, { k: "celah", kelas: "sur-s-butuh" }],
    kategori: s.map((r) => { const dalam = Math.min(r.kebutuhan, r.kapasitas); return { label: String(r.tahun), nilai: { dalam, celah: Math.max(0, r.kebutuhan - r.kapasitas) }, tip: `${r.tahun}: ${num(r.kebutuhan, 0)} ${b.satuan}`, th: tipHtml(String(r.tahun), [[t("sur.r.kebutuhan"), `${num(r.kebutuhan, 0)} ${b.satuan}`], [t("sur.r.kapasitas"), `${num(r.kapasitas, 0)} ${b.satuan}`], [t("sur.r.celah"), `${num(r.celah, 0)} ${b.satuan}`], [t("sur.r.impor"), `${num(r.impor_tersirat_pct, 0)}%`]]) }; }) });
}
function bagianNeraca() {
  if (!X.neraca?.baris?.length) return "";
  const k = pilihHtml({ id: "sur-r-nk", ikon: "tabel", label: t("sur.r.f.komponen"), opsi: NERACA.map(([id, s]) => [id, t("rg3.seg." + s), "pabrik"]), nilai: nk });
  const sk = pilihHtml({ id: "sur-r-ns", ikon: "grafik", label: t("sur.r.f.skenario"), opsi: [["ruptl", t("sur.r.sk.ruptl"), "grafik"], ["ruptl_plts100", t("sur.r.sk.plts100"), "bendera"]], nilai: ns });
  return ex({ id: "sur-r-neraca", ikon: "banding", topik: t("sur.r.ey.neraca"), judulHtml: esc(t("sur.r.j.neraca")), subHtml: esc(t("sur.r.s.neraca")),
    isiHtml: `<p class="rg3-info">${ikon("tanya", 18)}<span>${esc(t("sur.r.hip"))} ${bukti("hipotesis", { cara: t("sur.r.rumus") })}</span></p><div class="jm-saring rg3-saring rg3-saring-2">${k}${sk}</div><div id="sur-r-nu" class="rg3-kisi"></div>${legendaHtml([{ kelas: "sur-s-kap", label: t("sur.r.dalam") }, { kelas: "sur-s-butuh", label: t("sur.r.celah") }])}<div id="sur-r-ng" class="ih-bagan"></div>${daftarCelah((X.neraca.celah || []).slice(0, 2))}<p class="jm-bantu ih-catatan">${esc(t("sur.r.rumus"))}</p>` });
}
/* ---------- harga dan produk ---------- */
function tabelHarga() {
  const el = document.getElementById("sur-r-hg"); if (!el) return;
  const ids = X.sy.rujukan.harga, P = (X.harga?.produk || []).filter((p) => ids.includes(p.id)), S = new Map((X.harga?.sumber || []).map((s) => [s.id, s]));
  tabel(el, { satuan: "sur.u.produk", per: 6, urutAwal: 0, menurun: false, kolom: [
    { label: t("sur.c.produk"), v: (p) => p.nama, f: (p) => `<span class="rg3-idk"><b>${esc(p.nama)}</b><small>${esc(p.satuan)}</small></span>` },
    { label: t("sur.c.rentang"), num: true, v: (p) => Math.min(...p.dunia.map((d) => d.usd)), f: (p) => { const u = p.dunia.map((d) => d.usd).filter((v) => v != null); return u.length ? `<b>${esc(num(Math.min(...u), 3))} - ${esc(num(Math.max(...u), 3))}</b>` : "-"; } },
    { label: t("sur.c.pasar_n"), num: true, v: (p) => p.dunia.length, f: (p) => esc(num(p.dunia.length)) },
    { label: t("sur.c.indonesia"), v: (p) => (p.indonesia || []).length, f: (p) => ((p.indonesia || []).length ? `<b>${num(p.indonesia.length)}</b>` : `<span class="rg3-catat">${esc(t("sur.r.belum_seri"))}</span>`) },
    { label: t("sur.c.bukti"), v: (p) => p.dunia[0]?.tingkat_bukti || "", f: (p) => { const d = p.dunia[0], s = S.get(d?.sumber_id); return bukti(d?.tingkat_bukti, { sumber: s?.penerbit, tanggal: d?.tanggal, cara: s?.judul }); } },
  ], baris: P });
}
function tabelModul() {
  const el = document.getElementById("sur-r-md"); if (!el) return;
  const S = new Map((X.produk?.sumber || []).map((s) => [s.id, s])), baris = (X.produk?.baris || []).filter((p) => p.kategori === "modul");
  tabel(el, { satuan: "sur.u.produk", per: 6, urutAwal: 2, menurun: true, kolom: [
    { label: t("sur.c.produk"), v: (p) => p.merek, f: (p) => `<span class="rg3-org">${logoHtml(p.org_id, p.merek, "")}<span class="rg3-idk"><b>${namaOrg(p.org_id, p.merek)}</b><small>${esc(p.seri)}</small></span></span>` },
    { label: t("sur.c.teknologi"), v: (p) => p.teknologi || "", f: (p) => `<span class="rg3-teks">${esc(p.teknologi || "-")}</span>` },
    { label: t("sur.c.efisiensi"), num: true, v: (p) => p.spesifikasi?.efisiensi_maks_persen ?? -1, f: (p) => (p.spesifikasi?.efisiensi_maks_persen != null ? `<b>${esc(num(p.spesifikasi.efisiensi_maks_persen, 1))}%</b>` : "-") },
    { label: t("sur.c.daya"), num: true, v: (p) => p.spesifikasi?.daya_w_maks ?? -1, f: (p) => (p.spesifikasi?.daya_w_maks != null ? `${esc(num(p.spesifikasi.daya_w_maks, 0))} W` : "-") },
    { label: t("sur.c.bukti"), v: (p) => p.bukti?.tingkat_bukti || "", f: (p) => { const s = S.get(p.bukti?.sumber_id); return bukti(p.bukti?.tingkat_bukti, { sumber: s?.penerbit, tanggal: p.bukti?.tanggal, cara: s?.judul }); } },
  ], baris });
}
export async function mulai(el) {
  await muat(["pemasok", "rantaiPlts", "pabrik", "neraca", "harga", "produk", "org"]);
  if (!X.pemasok && !X.rantaiPlts) { el.innerHTML = kosongTab("sur.kosong_data"); return; }
  const n = (s) => pemain(s).length, idn = barisPabrikId().length, rp = X.rantaiPlts?.ringkas;
  const opsi = SEG.map((s) => [s, t("rg3.seg." + s), "pabrik", n(s)]);
  el.innerHTML = [
    ex({ id: "sur-r-pemain", ikon: "gedung", topik: t("sur.r.ey.pemain"), judulHtml: esc(t("sur.r.j.pemain")), subHtml: esc(t("sur.r.s.pemain")),
      isiHtml: `<div class="jm-saring rg3-saring rg3-saring-1">${pilihHtml({ id: "sur-r-seg", ikon: "pabrik", label: t("sur.r.f.segmen"), opsi, nilai: seg })}</div><div id="sur-r-tb"></div>${catatan("sur.r.n.pemain")}` }),
    X.rantaiPlts ? ex({ id: "sur-r-idn", ikon: "pabrik", topik: t("sur.r.ey.id"), judulHtml: esc(t("sur.r.j.id", { n: num(rp?.pabrikan || 0), g: num((rp?.total_mwp || 0) / 1000, 1) })), subHtml: esc(t("sur.r.s.id")),
      isiHtml: `<div id="sur-r-peta" class="rg3-peta" role="region" aria-label="${esc(t("sur.r.peta"))}"></div><div id="sur-r-id"></div>${daftarCelah((X.rantaiPlts.celah || []).slice(0, 3))}` }) : "",
    bagianNeraca(),
    X.harga?.produk ? ex({ id: "sur-r-harga", ikon: "tag", topik: t("sur.r.ey.harga"), judulHtml: esc(t("sur.r.j.harga")), subHtml: esc(t("sur.r.s.harga")), isiHtml: `<div id="sur-r-hg"></div>${catatan("sur.r.n.harga")}<p class="jm-bantu"><a href="/rantai-global?tab=harga">${esc(t("sur.r.ke_harga"))}</a></p>` }) : "",
    X.produk?.baris ? ex({ id: "sur-r-modul", ikon: "daftar2", topik: t("sur.r.ey.modul"), judulHtml: esc(t("sur.r.j.modul", { n: num((X.produk.baris || []).filter((p) => p.kategori === "modul").length) })), subHtml: esc(t("sur.r.s.modul")), isiHtml: `<div id="sur-r-md"></div><p class="jm-bantu"><a href="/rantai-global?tab=produk">${esc(t("sur.r.ke_produk"))}</a> <a href="${esc("/surya?tab=kebijakan")}" data-pindah="kebijakan">${esc(t("sur.r.ke_keb"))}</a></p>` }) : "",
  ].join("");
  void idn;
  pasangPilih();
  const seg$ = el.querySelector("#sur-r-seg"); seg$?.addEventListener("change", (e) => { seg = SEG.includes(e.target.value) ? e.target.value : "polisilikon"; nanti(tabelPemain); });
  nanti(() => { tabelPemain(); tabelId(); tabelHarga(); tabelModul(); gambarNeraca(el); gambarPeta(el); });
  for (const [id, set] of [["sur-r-nk", (v) => { nk = v; }], ["sur-r-ns", (v) => { ns = v; }]]) el.querySelector("#" + id)?.addEventListener("change", (e) => { set(e.target.value); nanti(() => gambarNeraca(el)); });
}
