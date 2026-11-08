/* /bioenergi, tab Biodiesel: mandat B30-B50, alokasi dan realisasi per tahun, HIP bulanan, produsen FAME (kapasitas dibaca dari pemasok_lain, org_id ke profil), ekspor (celah). */
import { B, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, batangSvg, kolomSvg, tipHtml, legendaHtml, siapTautan, naikkan, juta, kosongTab, daftarCelah, catatan, bulanLabel, orgSel, orgLogo, butir, klDari, pilJenis, luar } from "/bio_umum.js";
import { nanti } from "/inti/umum.js";

const MD = () => (B.bio?.mandat || []).filter((m) => m.jenis === "biodiesel");
const mulaiTeks = (m) => (m.mulai ? m.mulai : t("bn.belum"));
function alokasi() {
  const el = document.getElementById("bn-d-alok"); if (!el) return;
  const baris = B.bio.alokasi.map((a) => ({ ...a, kapasitas: a.alokasi_kl ?? (a.rujuk_butir ? klDari((butir((b) => b.uraian?.includes(a.rujuk_butir.cocok))[0] || {}).nilai) : null) }));
  document.getElementById("bn-d-alok-l").innerHTML = legendaHtml([{ kelas: "bn-s-realisasi", label: t("bn.bd.realisasi") }, { kelas: "bn-s-alokasi", label: t("bn.bd.sisa") }]);
  el.innerHTML = kolomSvg({ el, satuan: t("bn.u.juta_kl"), label: t("bn.bd.j.alok"), seri: [{ k: "realisasi", kelas: "bn-s-realisasi" }, { k: "alokasi", kelas: "bn-s-alokasi" }],
    kategori: baris.map((a) => ({ label: String(a.tahun), nilai: { alokasi: Math.max(0, (a.kapasitas || 0) - (a.realisasi_kl || 0)) / 1e6, realisasi: (a.realisasi_kl || 0) / 1e6 }, tip: String(a.tahun),
      th: tipHtml(String(a.tahun), [[t("bn.bd.alokasi"), a.kapasitas ? `${juta(a.kapasitas, 2)} ${t("bn.u.juta_kl")}` : t("bn.belum")], [t("bn.bd.realisasi"), a.realisasi_kl ? `${juta(a.realisasi_kl, 1)} ${t("bn.u.juta_kl")}` : t("bn.belum")], [t("bn.bd.mandat"), a.catatan]]) })) });
}
function hip() {
  const el = document.getElementById("bn-d-hip"); if (!el) return;
  const H = B.bio.hip;
  document.getElementById("bn-d-hip-l").innerHTML = legendaHtml([{ kelas: "bn-s-hip", label: t("bn.bd.hip") }]);
  el.innerHTML = kolomSvg({ el, satuan: t("bn.u.ribu_rp"), label: t("bn.bd.j.hip"), seri: [{ k: "hip", kelas: "bn-s-hip" }],
    kategori: H.map((h, i) => ({ label: bulanLabel(h.bulan), nilai: { hip: h.biodiesel_rp_l / 1000 }, tip: bulanLabel(h.bulan),
      th: tipHtml(bulanLabel(h.bulan), [[t("bn.bd.hip"), `Rp${num(h.biodiesel_rp_l, 0)}/L`], [t("bn.bd.ubah"), i ? `${h.biodiesel_rp_l - H[i - 1].biodiesel_rp_l > 0 ? "+" : ""}${num(h.biodiesel_rp_l - H[i - 1].biodiesel_rp_l, 0)}` : "-"]]) })) });
}
function produsen() {
  const el = document.getElementById("bn-d-pro"); if (!el) return;
  const ids = B.bio.rujukan.produsen_fame;
  const rows = ids.map((id) => { const b = butir((x) => x.organisasi_id === id && x.jenis === "kapasitas" && x.segmen === "biofuel")[0]; return b ? { id, kl: klDari(b.nilai), tahun: b.periode, b } : null; }).filter(Boolean);
  const gr = document.getElementById("bn-d-pro-g");
  gr.innerHTML = batangSvg({ el: gr, d: 2, satuan: t("bn.u.juta_kl"), label: t("bn.bd.kap"), seri: [{ k: "kap", kelas: "bn-s-alokasi" }], baris: [...rows].sort((a, b) => b.kl - a.kl).map((r) => ({ label: r.b.org_nama, logo: B.org?.baris?.find((o) => o.id === r.id)?.logo, tip: r.b.org_nama, th: tipHtml(r.b.org_nama, [[t("bn.bd.kap"), `${juta(r.kl, 2)} ${t("bn.u.juta_kl")}`], [t("bn.c.periode"), r.b.periode]]), bagian: [{ k: "kap", nilai: r.kl / 1e6 }] })) });
  tabel(el, { satuan: "bn.u.produsen", per: 6, urutAwal: 1, menurun: true, kolom: [
    { label: t("bn.c.produsen"), v: (r) => r.b.org_nama, f: (r) => orgSel(r.id) },
    { label: t("bn.bd.kap"), num: true, v: (r) => r.kl, f: (r) => `<b>${esc(juta(r.kl, 2))}</b> ${esc(t("bn.u.juta_kl"))}` },
    { label: t("bn.c.periode"), v: (r) => r.b.periode, f: (r) => esc(r.b.periode) },
    { label: t("bn.c.bukti"), v: (r) => r.b.tingkat_bukti, f: (r) => bukti(r.b.tingkat_bukti, { sumber: "bisnis.com", tanggal: r.b.tanggal_sumber }) },
    { label: t("bn.c.sumber"), v: () => "", f: (r) => luar(r.b.sumber_url, t("bn.buka")) },
  ], baris: rows });
  siapTautan("org").then(() => naikkan(el));
}
export function mulai(el) {
  if (!B.bio) { el.innerHTML = kosongTab("bn.kosong"); return; }
  const tot = (B.lain?.butir || []).find((b) => b.sub?.includes("fame") && b.jenis === "kapasitas" && !b.organisasi_id);
  el.innerHTML = [
    ex({ id: "bn-d-mandat", ikon: "linimasa", topik: t("bn.bd.ey.mandat"), judulHtml: esc(t("bn.bd.j.mandat")), subHtml: esc(t("bn.bd.s.mandat")),
      isiHtml: `<div class="rg3-kisi">${MD().map((m) => `<div class="rg3-kartu"><div class="rg3-k-kep">${pilJenis("bn.kode.", m.kode, "petir")}<b class="bn-angka">${esc(num(m.persen))}%</b></div><p class="jm-bantu">${esc(t("bn.bd.mulai"))}: <b>${esc(mulaiTeks(m))}</b></p><p>${esc(tx(m.ket))}</p>${buktiS(m.sumber_ids[0], m.tingkat_bukti)}</div>`).join("")}</div>`, kakiHtml: kakiSumber(MD().flatMap((m) => m.sumber_ids)) }),
    ex({ id: "bn-d-alokasi", ikon: "grafik", topik: t("bn.bd.ey.alok"), judulHtml: esc(t("bn.bd.j.alok")), subHtml: esc(t("bn.bd.s.alok")), isiHtml: `<div id="bn-d-alok-l"></div><div id="bn-d-alok" class="ih-bagan"></div>${catatan("bn.bd.n.alok")}`, kakiHtml: kakiSumber(B.bio.alokasi.flatMap((a) => [a.sumber_alokasi, a.sumber_realisasi])) }),
    ex({ id: "bn-d-harga", ikon: "tag", topik: t("bn.bd.ey.hip"), judulHtml: esc(t("bn.bd.j.hip")), subHtml: esc(t("bn.bd.s.hip")), isiHtml: `<div id="bn-d-hip-l"></div><div id="bn-d-hip" class="ih-bagan"></div>${catatan("bn.bd.n.hip")}`, kakiHtml: kakiSumber(B.bio.hip.map((h) => h.sumber_id)) }),
    ex({ id: "bn-d-produsen", ikon: "pabrik", topik: t("bn.bd.ey.pro"), judulHtml: esc(t("bn.bd.j.pro")), subHtml: esc(tot ? t("bn.bd.s.pro", { n: tot.nilai }) : t("bn.bd.s.pro0")), isiHtml: `<div id="bn-d-pro-g" class="ih-bagan"></div><div id="bn-d-pro"></div>${catatan("bn.bd.n.pro")}` }),
    ex({ id: "bn-d-ekspor", ikon: "kapal", topik: t("bn.bd.ey.ekspor"), judulHtml: esc(t("bn.bd.j.ekspor")), subHtml: esc(t("bn.bd.s.ekspor")), isiHtml: daftarCelah([t("bn.bd.celah.ekspor")]) }),
  ].join("");
  alokasi(); hip(); produsen();
}
