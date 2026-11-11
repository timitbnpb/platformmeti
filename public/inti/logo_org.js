/* Resolver logo organisasi TUNGGAL (dipakai direktori, beranda, berita, halaman lain).
   Urutan: field logo di data -> peta id (LOGO_ORG) -> peta nama (LOGO_NAMA) -> berkas /img/logo/<slug nama>.png
   -> /img/logo/org/<id>.png (hanya bila id ada di LOGO_ORG_ADA; selain itu pemanggil jatuh ke ikon/inisial tanpa meminta berkas). */
import { LOGO_ORG_ADA } from "./logo_org_ada.js";
export const LOGO_ORG = { p_6998264f50: "pertamina-nre", p_10e0dde689: "pertamina-nre", p_dda1e51dae: "pge", p_5a2e7d0c63: "pln-indonesia-power", p_ff7a390a42: "pln-nusantara-power", p_27ae5a4203: "medco-power", p_bdd0f2d140: "barito-renewables", p_7a803f3b71: "star-energy", l_41bf1f0b41: "meti", l_dd90c88f59: "aesi", l_d3dadc789e: "aprobi", l_7278e0528a: "esdm", l_973f60de15: "brin", su_ed074ff5: "pln", p_b1c52ad7b0: "pertamina", p_476a6bf2fb: "pertamina", p_e0f3886341: "pln-icon-plus", p_d99d5987f7: "sumitomo", p_9de27fd5b9: "medco-energi", l_38ba1d6f56: "ebtke", p_7f829f524e: "adaro", p_c6c4e478c0: "supreme-energy", ix_keen: "kencana-energi-lestari", l_7e5f8d771d: "api-inaga", l_15e21f04fa: "ojk", l_7b43a2574c: "kemenkeu", l_edde12ff1f: "kementerian-bumn", l_05301f48a5: "bkpm", l_3d20494e0a: "kemenhut", l_06d49428ac: "aplsi", l_67ed5e1422: "apamsi", l_1192cb8a15: "ibeka", l_0974f82eba: "aspebindo", p_978ca76d57: "mind-id" };
export const LOGO_NAMA = { PLN: "pln", "Indonesia Power": "pln-indonesia-power", "PLN Indonesia Power": "pln-indonesia-power", "PLN IP": "pln-indonesia-power", "PLN Nusantara Power": "pln-nusantara-power" };
const SLUG_ADA = new Set("adaro aesi apamsi api-inaga aplsi aprobi aspebindo barito-renewables bkpm brin ebtke esdm ibeka kemenhut kemenkeu kementerian-bumn kencana-energi-lestari medco-energi medco-power meti mind-id ojk pertamina-nre pertamina pge pln-icon-plus pln-indonesia-power pln-nusantara-power pln star-energy sumitomo supreme-energy".split(" "));
const slugNama = (n) => String(n || "").toLowerCase().replace(/^pt\.?\s+/, "").replace(/\s+(tbk|\(persero\)|persero)\b/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
/* kembalikan daftar url kandidat (terbaik dulu, tanpa duplikat); kosong bila tak ada petunjuk sama sekali */
export function logoOrg(id, nama, logo) {
  const a = [], slug = (id && LOGO_ORG[id]) || LOGO_NAMA[nama] || (SLUG_ADA.has(slugNama(nama)) ? slugNama(nama) : "");
  if (logo) a.push(logo);
  if (slug) a.push(`/img/logo/${slug}.png`);
  if (id && LOGO_ORG_ADA.has(id)) a.push(`/img/logo/org/${id}.png`);
  return [...new Set(a)];
}
export const logoOrgSatu = (id, nama, logo) => logoOrg(id, nama, logo)[0] || "";
