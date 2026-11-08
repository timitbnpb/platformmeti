/* /sampah-energi, tab Jalur teknologi: PSEL, RDF/SRF, biogas TPA, insinerator; fasilitas bernama (RDF Jeruklegi, RDF Rorotan, gas Bantargebang) dari sampah_energi.json; produsen RDF/SRF dari pemasok_wte.json (hulu). */
import { B, t, ex, num, esc, ikon, tx, buktiS, kakiSumber, tabel, kosongTab, catatan, daftarCelah, pil } from "/swe_umum.js";

const IK = { psel: "petir", rdf: "pabrik", biogas: "tek-bio", insinerator: "peringatan" };
function tabFasilitas() {
  const el = document.getElementById("swe-j-tab"); if (!el) return;
  tabel(el, { satuan: "swe.u.fasilitas", per: 6, urutAwal: 0, menurun: false, kolom: [
    { label: t("swe.c.fasilitas"), v: (f) => f.nama, f: (f) => `<span class="rg3-idk"><b>${esc(f.nama)}</b><small>${esc(f.lokasi)}</small></span>` },
    { label: t("swe.c.jalur"), v: (f) => f.k, f: (f) => pil("swe.j.k.", f.k) },
    { label: t("swe.c.status"), v: (f) => f.status, f: (f) => pil("swe.st.", f.status) },
    { label: t("swe.u.ton_hari"), num: true, v: (f) => Math.max(0, ...f.kapasitas_ton_hari), f: (f) => (f.kapasitas_ton_hari.length ? esc(f.kapasitas_ton_hari.map((x) => num(x, 0)).join(" / ")) : "-") },
    { label: t("swe.c.keluaran"), v: (f) => tx(f.produk), f: (f) => `<span class="rg3-teks">${esc(tx(f.produk))}</span><small class="jm-bantu">${esc(tx(f.kapasitas_ket))}</small>` },
    { label: t("swe.c.nilai"), v: (f) => tx(f.nilai), f: (f) => (f.nilai ? esc(tx(f.nilai)) : "-") },
    { label: t("swe.c.bukti"), v: (f) => f.tingkat_bukti, f: (f) => buktiS(f.sumber_ids[0], f.tingkat_bukti) },
  ], baris: B.sw.jalur.fasilitas });
}
function tabProdusen() {
  const el = document.getElementById("swe-j-hulu"); if (!el) return;
  const baris = (B.wte?.hulu || []);
  tabel(el, { satuan: "swe.u.segmen", per: 6, urutAwal: 0, menurun: false, kolom: [
    { label: t("swe.c.segmen"), v: (h) => h.segmen, f: (h) => pil("swe.hulu.", h.segmen) },
    { label: t("swe.c.uraian"), v: (h) => h.uraian, f: (h) => `<span class="rg3-teks">${esc(h.uraian)}</span>` },
    { label: t("swe.c.pelaku"), num: true, v: (h) => (h.pelaku || []).length, f: (h) => ((h.pelaku || []).length ? esc(num(h.pelaku.length, 0)) : `<span class="jm-bantu">${esc(t("swe.belum_ada"))}</span>`) },
    { label: t("swe.c.status"), v: (h) => h.status || "", f: (h) => pil("swe.hs.", h.status || "tidak-diketahui") },
  ], baris });
}
export function mulai(el) {
  if (!B.sw) { el.innerHTML = kosongTab("swe.kosong"); return; }
  const J = B.sw.jalur;
  const kartu = (x) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(IK[x.k] || "info", 22)}<b>${esc(t("swe.j.k." + x.k))}</b></div><p class="jm-bantu">${esc(tx(x.teks))}</p>${buktiS(x.sumber_id, x.tingkat_bukti)}${x.sumber_id2 ? buktiS(x.sumber_id2) : ""}</div>`;
  el.innerHTML = [
    ex({ id: "swe-j-jenis", ikon: "pabrik", topik: t("swe.j.ey.jenis"), judulHtml: esc(t("swe.j.j.jenis")), subHtml: esc(t("swe.j.s.jenis")), isiHtml: `<div class="rg3-kisi">${J.jenis.map(kartu).join("")}</div>${catatan("swe.j.n.jenis")}`, kakiHtml: kakiSumber(["sgnea", "mongabay-rdf-cilacap", "esdm-lfg", "p70-2016", "p26-2020", "iea_wte"]) }),
    ex({ id: "swe-j-fas", ikon: "tabel", topik: t("swe.j.ey.fas"), judulHtml: esc(t("swe.j.j.fas", { n: J.fasilitas.length })), subHtml: esc(t("swe.j.s.fas")), isiHtml: `<div id="swe-j-tab"></div>${catatan("swe.j.n.fas")}`, kakiHtml: kakiSumber(J.fasilitas.flatMap((f) => f.sumber_ids)) }),
    ex({ id: "swe-j-hulu", ikon: "koper", topik: t("swe.j.ey.hulu"), judulHtml: esc(t("swe.j.j.hulu")), subHtml: esc(t("swe.j.s.hulu")), isiHtml: `<div id="swe-j-hulu"></div>${daftarCelah([B.sw.celah[3]])}` }),
  ].join("");
  tabFasilitas(); tabProdusen();
}
