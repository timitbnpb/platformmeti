/* Nama proyek berbahasa Indonesia, satu sumber untuk layar profil (/p) dan Worker (judul tautan).
   Nama dari Wikidata sering berbahasa Inggris ("Agam hydro"); pakai nama_lain berawalan PLT bila ada ("PLTA Agam").
   Salinan pola yang sama ada di proyek.js (modul sendiri tanpa ekspor). */
const ID_POLA = [[/^(.+?) floating solar$/i, "PLTS Terapung $1"], [/^(.+?) pumped storage(?: hydro)?(.*)$/i, "PLTA pumped storage $1$2"], [/^(.+?) hydro(?:electric|power)?(?: power)?(?: plant| project)?$/i, "PLTA $1"], [/^(.+?) geothermal(?: power)?(?: plant| project)?$/i, "PLTP $1"], [/^(.+?) wind(?: power)?(?: farm| plant| project)?$/i, "PLTB $1"], [/^(.+?) solar(?: power)?(?: farm| plant| project)$/i, "PLTS $1"]];
export function namaProyek(p) {
  const n = p.nama || "";
  if (/^PLT/i.test(n)) return n;
  const lain = (p.nama_lain || []).find((x) => /^PLT[A-Za-z]*\s/.test(x) && !/power|plant/i.test(x));
  if (lain) return lain;
  for (const [re, to] of ID_POLA) if (re.test(n)) return n.replace(re, to);
  return n;
}
