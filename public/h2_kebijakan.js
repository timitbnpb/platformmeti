/* /hidrogen, tab Kebijakan: Strategi Hidrogen Nasional (Des 2023), RHAN (15 Apr 2025), PP 40/2025, fase 2025-2060, target, insentif, standar; tautan ke basis regulasi. */
import { H, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, siapTautan, naikkan, catatan, tautRegulasi, pilJenis, tanggal } from "/h2_umum.js";

const STATUS_IK = { belum: "silang", disiapkan: "jam", disebut: "info" };
const tgl = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s) ? tanggal(s) : /^\d{4}-\d{2}$/.test(s) ? tanggal(s + "-01").replace(/^1 /, "") : s);
export function mulai(el) {
  const K = H.h2.kebijakan, tg = K.target_2060;
  const fase = K.fase.map((f, i) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(["kalender", "pabrik", "bintang"][i], 22)}<b>${esc(t("h2.k.f." + f.k))}</b></div><p class="h2-angka">${f.dari} - ${f.sampai}</p><p>${esc(t("h2.k.f." + f.k + ".ket"))}</p></div>`).join("");
  const lin = K.linimasa.map((x) => `<li class="h2-tl-i"><div class="h2-tl-t"><b>${esc(tgl(x.tgl))}</b>${buktiS(x.sumber_id, x.tingkat_bukti)}</div><p>${esc(tx(x.teks))}</p>${x.regulasi ? `<p class="jm-bantu">${tautRegulasi(x.regulasi, t("h2.k.reg." + x.regulasi))}</p>` : ""}</li>`).join("");
  el.innerHTML = [
    ex({ id: "h2-k-f", ikon: "regulasi", topik: t("h2.k.ey.f"), judulHtml: esc(t("h2.k.j.f")), subHtml: esc(t("h2.k.s.f")),
      isiHtml: `<div class="h2-fase">${fase}</div><div class="rg3-info">${ikon("info", 18)}<p>${esc(t("h2.k.i.t", { a: num(tg.mt, 1), b: num(tg.alternatif_mt, 1) }))} ${buktiS(tg.sumber_id, tg.tingkat_bukti)}</p></div>${catatan("h2.k.n.f")}`, kakiHtml: kakiSumber(["esdm-asta-cita", tg.sumber_id]) }),
    ex({ id: "h2-k-l", ikon: "linimasa", topik: t("h2.k.ey.l"), judulHtml: esc(t("h2.k.j.l")), subHtml: esc(t("h2.k.s.l")), isiHtml: `<ol class="h2-tl">${lin}</ol>`, kakiHtml: kakiSumber(K.linimasa.map((x) => x.sumber_id)) }),
    ex({ id: "h2-k-i", ikon: "kartu", topik: t("h2.k.ey.i"), judulHtml: esc(t("h2.k.j.i")), subHtml: esc(t("h2.k.s.i")), isiHtml: `<div id="h2-k-tab"></div>${catatan("h2.k.n.i")}`, kakiHtml: kakiSumber(K.insentif.map((x) => x.sumber_id)) }),
  ].join("");
  tabel(document.getElementById("h2-k-tab"), { satuan: "h2.u.instrumen", per: 4, urutAwal: 0, menurun: false, kolom: [
    { label: t("h2.c.instrumen"), v: (x) => x.k, f: (x) => `<b>${esc(t("h2.k.ins." + x.k))}</b>` },
    { label: t("h2.c.status"), v: (x) => x.status, f: (x) => pilJenis("h2.k.s.", x.status, STATUS_IK[x.status]) },
    { label: t("h2.c.uraian"), v: (x) => tx(x.ket), f: (x) => `<span class="rg3-teks">${esc(tx(x.ket))}</span>` },
    { label: t("h2.c.bukti"), v: (x) => x.tingkat_bukti, f: (x) => buktiS(x.sumber_id, x.tingkat_bukti) },
  ], baris: K.insentif });
  siapTautan("regulasi").then(() => naikkan(el));
}
