/* /hidrogen, tab Isu: biaya, kebijakan, permintaan, jadwal, teknologi, rantai pasok, pasar, kualitas data. Pihak yang berbicara ditulis; klaim pihak berlabel "kata pihak", bukan fakta. */
import { H, t, ex, esc, ikon, tx, buktiS, kakiSumber, tabel, pilJenis, warnaIdx } from "/h2_umum.js";

const KAT = [["biaya", "tag"], ["kebijakan", "regulasi"], ["permintaan", "industri"], ["jadwal", "kalender"], ["teknologi", "labu"], ["rantai", "pabrik"], ["pasar", "globe"], ["data", "tanya"]];
let kat = "";
function tabelIsu() {
  const el = document.getElementById("h2-i-tab"); if (!el) return;
  const baris = H.h2.isu.filter((x) => !kat || x.kat === kat);
  tabel(el, { satuan: "h2.u.isu", per: 5, urutAwal: 0, menurun: false, kolom: [
    { label: t("h2.c.kategori"), v: (x) => x.kat, f: (x) => pilJenis("h2.kat.", x.kat, KAT.find((k) => k[0] === x.kat)?.[1]) },
    { label: t("h2.c.pihak"), v: (x) => tx(x.pihak), f: (x) => `<b>${esc(tx(x.pihak))}</b>` },
    { label: t("h2.c.uraian"), v: (x) => tx(x.ket), f: (x) => `<span class="rg3-teks">${esc(tx(x.ket))}</span>` },
    { label: t("h2.c.bukti"), v: (x) => x.tingkat_bukti, f: (x) => buktiS(x.sumber_id, x.tingkat_bukti) },
  ], baris });
}
export function mulai(el) {
  const I = H.h2.isu, n = (k) => I.filter((x) => !k || x.kat === k).length;
  el.innerHTML = ex({ id: "h2-i-isu", ikon: "peringatan", topik: t("h2.is.ey"), judulHtml: esc(t("h2.is.j", { n: n("") })), subHtml: esc(t("h2.is.s")),
    isiHtml: `<div class="rg3-chips" role="group" aria-label="${esc(t("h2.f.kategori"))}">${[["", "daftar2"], ...KAT].map(([k, i]) => `<button type="button" class="rg3-chip rg3-chipb rg3-w${k ? warnaIdx(k) : 0}" data-kat="${esc(k)}" aria-pressed="${kat === k}">${ikon(i, 14)}<span>${esc(t(k ? "h2.kat." + k : "h2.semua"))}</span> <i>${n(k)}</i></button>`).join("")}</div><div id="h2-i-tab"></div><p class="jm-bantu ih-catatan">${esc(t("h2.is.n"))}</p>`, kakiHtml: kakiSumber(I.map((x) => x.sumber_id)) });
  tabelIsu();
  el.querySelector(".rg3-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-kat]"); if (!b) return;
    kat = b.dataset.kat; for (const x of el.querySelectorAll("[data-kat]")) x.setAttribute("aria-pressed", String(x.dataset.kat === kat));
    tabelIsu();
  });
}
