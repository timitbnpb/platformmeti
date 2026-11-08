/* /surya: pemuat isi satu tab. Tiap tab = modul sy_<nama>.js dengan mulai(el); data dimuat malas per tab dan tahan kosong. */
import { X, kosongTab } from "/sy_umum.js";

const MOD = { bahan: "/sy_bahan.js", rantai: "/sy_rantai.js", proyek: "/sy_proyek.js", potensi: "/sy_potensi.js", biaya: "/sy_biaya.js", kebijakan: "/sy_kebijakan.js", daur: "/sy_daur.js", isu: "/sy_isu.js" };
export async function mulai(el, id) {
  if (!X.sy || !MOD[id]) { el.innerHTML = kosongTab("sur.kosong_data"); return; }
  const m = await import(MOD[id]);
  await m.mulai(el);
}
