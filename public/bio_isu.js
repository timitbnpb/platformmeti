/* /bioenergi, tab Isu: deforestasi, ILUC, harga minyak goreng, kesejahteraan petani. Pihak yang berbicara ditulis; klaim pihak berlabel "kata pihak", bukan fakta. Saringan kategori + tabel berhalaman. */
import { B, t, ex, esc, ikon, tx, buktiS, kakiSumber, tabel, kosongTab, chip, warnaIdx, pilJenis } from "/bio_umum.js";

const KAT = [["deforestasi", "tek-bio"], ["iluc", "peta"], ["minyak-goreng", "tag"], ["petani", "orang"]];
let kat = "";
function tabelIsu() {
  const el = document.getElementById("bn-i-tab"); if (!el) return;
  const baris = B.bio.isu.filter((x) => !kat || x.kat === kat);
  tabel(el, { satuan: "bn.u.isu", per: 4, urutAwal: 0, menurun: false, kolom: [
    { label: t("bn.c.kategori"), v: (x) => x.kat, f: (x) => pilJenis("bn.kat.", x.kat, KAT.find((k) => k[0] === x.kat)?.[1]) },
    { label: t("bn.c.pihak"), v: (x) => tx(x.pihak), f: (x) => `<b>${esc(tx(x.pihak))}</b>` },
    { label: t("bn.c.uraian"), v: (x) => tx(x.ket), f: (x) => `<span class="rg3-teks">${esc(tx(x.ket))}</span>` },
    { label: t("bn.c.bukti"), v: (x) => x.tingkat_bukti, f: (x) => buktiS(x.sumber_id, x.tingkat_bukti) },
  ], baris });
}
export function mulai(el) {
  if (!B.bio) { el.innerHTML = kosongTab("bn.kosong"); return; }
  const n = (k) => B.bio.isu.filter((x) => !k || x.kat === k).length;
  el.innerHTML = ex({ id: "bn-i-isu", ikon: "peringatan", topik: t("bn.is.ey"), judulHtml: esc(t("bn.is.j", { n: n("") })), subHtml: esc(t("bn.is.s")),
    isiHtml: `<div class="rg3-chips" role="group" aria-label="${esc(t("bn.is.f"))}">${[["", "daftar2"], ...KAT].map(([k, i]) => `<button type="button" class="rg3-chip rg3-chipb rg3-w${k ? warnaIdx(k) : 0}" data-kat="${esc(k)}" aria-pressed="${kat === k}">${ikon(i, 14)}<span>${esc(t(k ? "bn.kat." + k : "bn.semua"))}</span> <i>${n(k)}</i></button>`).join("")}</div><div id="bn-i-tab"></div><p class="jm-bantu ih-catatan">${esc(t("bn.is.n"))}</p>`, kakiHtml: kakiSumber(B.bio.isu.map((x) => x.sumber_id)) });
  tabelIsu();
  el.querySelector(".rg3-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-kat]"); if (!b) return;
    kat = b.dataset.kat; for (const x of el.querySelectorAll("[data-kat]")) x.setAttribute("aria-pressed", String(x.dataset.kat === kat));
    tabelIsu();
  });
}
