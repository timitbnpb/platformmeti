/* /transisi-pltu, tab Co-firing dan amonia: butir energi_baru.json (cofiring, hidrogen-amonia) dirujuk lewat id; unit co-firing tertaut ke PLTU (pltu.json); angka volume di /bioenergi?tab=listrik. */
import { B, t, ex, num, esc, ikon, tx, bukti, kakiSumber, kosongTab, catatan, pilJenis, luar, pltuById, tautRegulasi, siapTautan, naikkan, tautProvinsi } from "/tpl_umum.js";

const E = (id) => (B.enb?.baris || []).find((b) => b.id === id);
const kartu = (b) => {
  const plt = (b.pltu_ids || []).map(pltuById).filter(Boolean);
  const s = (B.enb.sumber || []).find((x) => x.id === (b.sumber_ids || [])[0]);
  return `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(b.id.startsWith("cf") ? "tek-bio" : "petir", 22)}<b>${esc(tx(b.nama))}</b></div><p class="tpl-baris">${pilJenis("tpl.cf.st.", b.status)} ${b.prov ? tautProvinsi(b.prov) : ""}</p>
    <p>${esc(tx(b.ringkas))}</p>${(b.angka || []).length ? `<ul class="tpl-daftar">${b.angka.slice(0, 3).map((a) => `<li><span><b>${esc(num(a.nilai, a.nilai % 1 ? 2 : 0))}</b> ${esc(a.satuan || "")}<p class="jm-bantu">${esc(tx(a.label))}</p></span></li>`).join("")}</ul>` : ""}
    ${plt.length ? `<p class="jm-bantu">${esc(t("tpl.cf.pltu"))}: ${plt.map((p) => `<b>${esc(p.nama)}</b> (${num(p.mw_operasi || 0, 0)} MW)`).join(", ")}</p>` : ""}
    ${bukti(b.tingkat_bukti, { sumber: s?.penerbit || "", tanggal: b.tanggal_periksa })} ${s ? luar(s.url, t("tpl.buka")) : ""}</div>`;
};
export function mulai(el) {
  if (!B.tp || !B.enb) { el.innerHTML = kosongTab("tpl.kosong"); return; }
  const cf = B.tp.cofiring.energi_baru_ids.map(E).filter(Boolean), am = B.tp.cofiring.hidrogen_amonia_ids.map(E).filter((b) => b && /amonia|ammonia/i.test(JSON.stringify(b)));
  const nas = E("cf-nasional");
  el.innerHTML = [
    ex({ id: "tpl-c-cf", ikon: "tek-bio", topik: t("tpl.cf.ey.cf"), judulHtml: esc(t("tpl.cf.j.cf", { n: num((nas?.angka || [])[0]?.nilai || 0, 0) })), subHtml: esc(t("tpl.cf.s.cf")),
      isiHtml: `<div class="tpl-kisi">${cf.map(kartu).join("")}</div><p class="jm-bantu">${tautRegulasi("permen-esdm-12-2023", "Permen ESDM 12/2023")} <a class="rg3-tautan" href="/bioenergi?tab=listrik">${esc(t("tpl.cf.lihat_bio"))}</a></p>${catatan("tpl.cf.n.cf")}` }),
    ex({ id: "tpl-c-am", ikon: "petir", topik: t("tpl.cf.ey.am"), judulHtml: esc(t("tpl.cf.j.am")), subHtml: esc(t("tpl.cf.s.am")), isiHtml: `<div class="tpl-kisi">${am.map(kartu).join("")}</div><p class="jm-bantu"><a class="rg3-tautan" href="/energi-baru">${esc(t("tpl.cf.lihat_enb"))}</a></p>${catatan("tpl.cf.n.am")}` }),
  ].join("");
  siapTautan("regulasi").then(() => naikkan(el));
}
