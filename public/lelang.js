/* /lelang: pelacak lelang dan pengadaan EBT. Kerangka: kepala + ubin angka, lima tab ujung ke ujung (#tab), tiap tab dimuat malas dari lelang_<nama>.js.
   INP: tab berganti seketika (aria-selected + panel), isi berat lewat nanti(). */
import { mulaiHalaman } from "/inti/kepala.js";
import { tabHalaman } from "/inti/tab_halaman.js";
import { hantuHtml } from "/inti/umum.js";
import { t } from "/i18n.js";
import { ubinHtml, tampilGalat } from "/analisis.js";
import { D, muat, baris, num } from "/lelang_umum.js";

const $ = (id) => document.getElementById(id);
const MOD = { putaran: "/lelang_putaran.js", pemenang: "/lelang_pemenang.js", harga: "/lelang_harga.js", linimasa: "/lelang_linimasa.js", dunia: "/lelang_dunia.js" };
const IKON = { putaran: "daftar2", pemenang: "piala", harga: "tag", linimasa: "linimasa", dunia: "globe" };
const siap = new Set();
let nav = null;

function kepala() {
  const B = baris(), pemenang = B.filter((p) => ["pemenang", "ppa", "cod"].includes(p.tahap)).length, jalan = B.filter((p) => ["pengumuman", "prakualifikasi", "penawaran"].includes(p.tahap)).length, berharga = B.filter((p) => p.harga).length;
  const th = B.map((p) => p.tahun);
  $("jawab").textContent = t("lel.lead", { n: num(B.length), a: Math.min(...th), b: Math.max(...th), m: num(berharga) });
  $("ubin").innerHTML = ubinHtml([
    { ikon: "lelang", nilai: num(B.length), label: t("lel.u1"), href: "#putaran" },
    { ikon: "piala", nilai: num(pemenang), label: t("lel.u2"), href: "#pemenang" },
    { ikon: "jam", nilai: num(jalan), label: t("lel.u3"), href: "#putaran" },
    { ikon: "tag", nilai: `${num(berharga)}/${num(B.length)}`, label: t("lel.u4"), href: "#harga" },
  ]);
}
const muatTab = (k) => async () => {
  if (siap.has(k)) return;
  siap.add(k);
  const p = $("pn-" + k);
  p.innerHTML = hantuHtml(3);
  try { p.innerHTML = ""; await (await import(MOD[k])).mulai(p); } catch (e) { console.error(e); siap.delete(k); throw e; }
};

async function mulai() {
  await mulaiHalaman();
  document.addEventListener("jm:bahasa", () => location.reload());
  $("isi").insertAdjacentHTML("afterbegin", hantuHtml(3));
  await muat();
  $("isi").querySelector(".jm-hantu")?.remove();
  if (!D.lel?.putaran?.length) { tampilGalat($("isi"), () => location.reload()); return; }
  kepala();
  nav = tabHalaman("lelTab", { label: "lel.tab", tab: Object.keys(MOD).map((k) => ({ k, ikon: IKON[k], teks: "lel.tab." + k, panel: "pn-" + k, muat: muatTab(k) })) });
  addEventListener("lel:buka", async (e) => {
    await nav.buka("putaran"); history.replaceState(null, "", location.pathname);
    (await import(MOD.putaran)).bukaRinci(e.detail);
  });
}
mulai();
