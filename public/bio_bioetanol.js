/* /bioenergi, tab Bioetanol: jalur E5 sampai E10, produsen dan kapasitas (pemasok_lain), HIP bioetanol, kendala bahan baku. Kebutuhan lawan pasokan = angka sumber, tanpa turunan. */
import { B, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, kolomSvg, batangSvg, tipHtml, legendaHtml, siapTautan, naikkan, juta, kosongTab, catatan, bulanLabel, orgSel, butir, klDari, pilJenis, luar } from "/bio_umum.js";

function produsen() {
  const el = document.getElementById("bn-e-pro"); if (!el) return;
  const rows = B.bio.rujukan.produsen_etanol.map((id) => {
    const b = butir((x) => x.organisasi_id === id && x.segmen === "biofuel" && x.sub?.includes("bioetanol") && ["kapasitas", "rencana"].includes(x.jenis))[0];
    return b ? { id, b, kl: klDari(b.nilai, false), rencana: b.jenis === "rencana" } : null;
  }).filter(Boolean);
  const g = document.getElementById("bn-e-g");
  g.innerHTML = batangSvg({ el: g, d: 0, satuan: t("bn.u.ribu_kl"), label: t("bn.be.j.pro"), seri: [{ k: "ada", kelas: "bn-s-realisasi" }, { k: "rencana", kelas: "bn-s-rencana" }],
    baris: rows.map((r) => ({ label: r.b.org_nama, logo: B.org?.baris?.find((o) => o.id === r.id)?.logo, tip: r.b.org_nama, th: tipHtml(r.b.org_nama, [[t("bn.be.kap"), `${num((r.kl || 0) / 1e3, 0)} ${t("bn.u.ribu_kl")}`], [t("bn.c.status"), t(r.rencana ? "bn.st.rencana" : "bn.st.ada")], [t("bn.c.periode"), r.b.periode]]), bagian: [{ k: r.rencana ? "rencana" : "ada", nilai: (r.kl || 0) / 1e3 }] })) });
  document.getElementById("bn-e-l").innerHTML = legendaHtml([{ kelas: "bn-s-realisasi", label: t("bn.st.ada") }, { kelas: "bn-s-rencana", label: t("bn.st.rencana") }]);
  tabel(el, { satuan: "bn.u.produsen", per: 6, urutAwal: 1, menurun: true, kolom: [
    { label: t("bn.c.produsen"), v: (r) => r.b.org_nama, f: (r) => orgSel(r.id) },
    { label: t("bn.be.kap"), num: true, v: (r) => r.kl, f: (r) => `<b>${esc(num((r.kl || 0) / 1e3, 0))}</b> ${esc(t("bn.u.ribu_kl"))}<small class="rg3-catat">${esc(r.b.nilai)}</small>` },
    { label: t("bn.c.status"), v: (r) => (r.rencana ? 1 : 0), f: (r) => pilJenis("bn.st.", r.rencana ? "rencana" : "ada", r.rencana ? "kalender" : "centang") },
    { label: t("bn.c.bukti"), v: (r) => r.b.tingkat_bukti, f: (r) => bukti(r.b.tingkat_bukti, { sumber: "Bloomberg Technoz / Investortrust", tanggal: r.b.tanggal_sumber }) },
    { label: t("bn.c.sumber"), v: () => "", f: (r) => luar(r.b.sumber_url, t("bn.buka")) },
  ], baris: rows });
  siapTautan("org").then(() => naikkan(el));
}
function hip() {
  const el = document.getElementById("bn-e-hip"); if (!el) return;
  const H = B.bio.hip.filter((h) => h.bioetanol_rp_l);
  const nov = butir((b) => b.sub?.includes("bioetanol") && b.jenis === "harga")[0];
  el.innerHTML = kolomSvg({ el, satuan: t("bn.u.ribu_rp"), label: t("bn.be.j.hip"), seri: [{ k: "hip", kelas: "bn-s-hip" }],
    kategori: H.map((h) => ({ label: bulanLabel(h.bulan), nilai: { hip: h.bioetanol_rp_l / 1000 }, tip: bulanLabel(h.bulan), th: tipHtml(bulanLabel(h.bulan), [[t("bn.be.hip"), `Rp${num(h.bioetanol_rp_l, 0)}/L`]]) })) });
  document.getElementById("bn-e-hip-n").innerHTML = nov ? `<p class="jm-bantu ih-catatan">${esc(t("bn.be.n.hip_nov", { nilai: nov.nilai }))} ${luar(nov.sumber_url, t("bn.buka"))}</p>` : "";
}
export function mulai(el) {
  if (!B.bio) { el.innerHTML = kosongTab("bn.kosong"); return; }
  const be = B.bio.bioetanol, MD = B.bio.mandat.filter((m) => m.jenis === "bioetanol");
  el.innerHTML = [
    ex({ id: "bn-e-mandat", ikon: "linimasa", topik: t("bn.be.ey.mandat"), judulHtml: esc(t("bn.be.j.mandat", { n: juta(be.kebutuhan_e10_kl, 1) })), subHtml: esc(t("bn.be.s.mandat")),
      isiHtml: `<div class="rg3-kisi">${MD.map((m) => `<div class="rg3-kartu"><div class="rg3-k-kep">${pilJenis("bn.kode.", m.kode, "petir")}<b class="bn-angka">${esc(num(m.persen))}%</b></div><p class="jm-bantu">${esc(t("bn.bd.mulai"))}: <b>${esc(m.mulai || t("bn.belum"))}</b></p><p>${esc(tx(m.ket))}</p>${buktiS(m.sumber_ids[0], m.tingkat_bukti)}</div>`).join("")}</div>`, kakiHtml: kakiSumber(MD.flatMap((m) => m.sumber_ids)) }),
    ex({ id: "bn-e-produsen", ikon: "pabrik", topik: t("bn.be.ey.pro"), judulHtml: esc(t("bn.be.j.pro")), subHtml: esc(t("bn.be.s.pro")), isiHtml: `<div id="bn-e-l"></div><div id="bn-e-g" class="ih-bagan"></div><div id="bn-e-pro"></div>${catatan("bn.be.n.pro")}` }),
    ex({ id: "bn-e-harga", ikon: "tag", topik: t("bn.be.ey.hip"), judulHtml: esc(t("bn.be.j.hip")), subHtml: esc(t("bn.be.s.hip")), isiHtml: `<div id="bn-e-hip" class="ih-bagan"></div><div id="bn-e-hip-n"></div>`, kakiHtml: kakiSumber(B.bio.hip.filter((h) => h.bioetanol_rp_l).map((h) => h.sumber_etanol)) }),
    ex({ id: "bn-e-kendala", ikon: "peringatan", topik: t("bn.be.ey.kendala"), judulHtml: esc(t("bn.be.j.kendala")), subHtml: esc(t("bn.be.s.kendala")),
      isiHtml: `<div class="rg3-kisi">${be.kendala.map((k) => `<div class="rg3-kartu"><div class="rg3-k-kep">${pilJenis("bn.kd.", k.k, k.k === "pasokan" ? "grafik" : k.k === "molase" ? "desa" : "industri")}</div><p>${esc(tx(k.ket))}</p>${buktiS(k.sumber_id, k.tingkat_bukti)}</div>`).join("")}</div>${catatan("bn.be.n.bahan")}`, kakiHtml: kakiSumber(be.kendala.map((k) => k.sumber_id)) }),
  ].join("");
  produsen(); hip();
}
