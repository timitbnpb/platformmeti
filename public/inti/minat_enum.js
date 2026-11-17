/* minat_enum.js (F65-303, 306): enum papan minat REC dan karbon serta putusan cek fakta. Dipakai layar DAN Worker supaya dua sisi tidak bisa berbeda.
   Tidak ada enum baru yang dikarang: REC_TEK = kode teknologi di proyek.json (tanpa nuklir dan penyimpanan, yang bukan pembangkit terbarukan);
   REG_KARBON = kelas registri di karbon_registri.json (pola sama dengan REG_KELAS di karbon.js). Uji tests/minat.test.mjs menagih kecocokannya dengan data. */
export const REC_TEK = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah"];
export const REG_KARBON = ["verra", "gs", "pv", "idx", "srn"];
export const REG_KELAS = (n) => (/^Verra/.test(n) ? "verra" : /^Gold/.test(n) ? "gs" : /^IDX/.test(n) ? "idx" : /^SRN/.test(n) ? "srn" : "pv");
export const SATUAN_UNIT = { rec: "MWh", karbon: "tCO2e" };
export const PUTUSAN = ["benar", "sebagian", "keliru", "tidak_pasti"];
