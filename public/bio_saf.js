/* /bioenergi, tab SAF dan HVO: Green Refinery Cilacap (co-processing), uji terbang, minyak jelantah, mandat SAF 1% 2027, biorefinery 2029. Kapasitas HVO berjalan sengaja tidak diangkakan (sumber saling bertentangan). */
import { B, t, ex, num, esc, ikon, tx, buktiS, kakiSumber, orgSel, kosongTab, daftarCelah, catatan, pilJenis, tanggal } from "/bio_umum.js";

const IK = { uji: "kamera", komersial: "kapal", pasokan: "pabrik", mandat: "palu", kapasitas: "grafik" };
export function mulai(el) {
  if (!B.bio) { el.innerHTML = kosongTab("bn.kosong"); return; }
  const S = B.bio.saf, mandat = B.bio.mandat.find((m) => m.id === "saf1");
  const fmt = (g) => (/^\d{4}-\d{2}-\d{2}$/.test(g) ? tanggal(g) : g);
  el.innerHTML = [
    ex({ id: "bn-s-kap", ikon: "pabrik", topik: t("bn.sf.ey.kap"), judulHtml: esc(t("bn.sf.j.kap")), subHtml: esc(t("bn.sf.s.kap")),
      isiHtml: `<div class="rg3-kisi">${S.kapasitas.map((k) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(k.k === "uco" ? "air-energi" : "industri", 22)}<b>${esc(t("bn.sf.k." + k.k))}</b></div><p class="bn-angka">${esc(num(k.nilai))} <small>${esc(k.satuan)}</small></p><p class="jm-bantu">${esc(tx(k.ket))}</p>${buktiS(k.sumber_id, k.tingkat_bukti)}</div>`).join("")}<div class="rg3-kartu"><div class="rg3-k-kep">${pilJenis("bn.kode.", mandat.kode, "kapal")}<b class="bn-angka">${esc(num(mandat.persen))}%</b></div><p class="jm-bantu">${esc(t("bn.bd.mulai"))}: <b>${esc(mandat.mulai)}</b></p><p>${esc(tx(mandat.ket))}</p>${buktiS(mandat.sumber_ids[0], mandat.tingkat_bukti)}</div></div><p class="rg3-org">${S.org_ids.map(orgSel).join("")}</p>${catatan("bn.sf.n.hvo")}`, kakiHtml: kakiSumber(S.kapasitas.map((k) => k.sumber_id)) }),
    ex({ id: "bn-s-tl", ikon: "linimasa", topik: t("bn.sf.ey.tl"), judulHtml: esc(t("bn.sf.j.tl")), subHtml: esc(t("bn.sf.s.tl")),
      isiHtml: `<ol class="bn-tl">${S.linimasa.map((x) => `<li class="bn-tl-i"><span class="bn-tl-t">${ikon(IK[x.jenis] || "info", 16)}<b>${esc(fmt(x.tgl))}</b>${pilJenis("bn.sj.", x.jenis)}</span><p>${esc(tx(x.ket))}</p>${buktiS(x.sumber_id, x.tingkat_bukti)}</li>`).join("")}</ol>`, kakiHtml: kakiSumber(S.linimasa.map((x) => x.sumber_id)) }),
    ex({ id: "bn-s-celah", ikon: "tanya", topik: t("bn.celah"), judulHtml: esc(t("bn.sf.j.celah")), isiHtml: daftarCelah((B.bio.celah || []).filter((c, i) => i === 5).map(tx)) }),
  ].join("");
}
