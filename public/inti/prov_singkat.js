/* Singkatan baku provinsi (kode BPS -> {nama, singkat}). Murni, tanpa DOM; dipakai direktori dan pipeline potret (Node). */
export const PROV = {
  11: ["Aceh", "Aceh"], 12: ["Sumatera Utara", "Sumut"], 13: ["Sumatera Barat", "Sumbar"], 14: ["Riau", "Riau"], 15: ["Jambi", "Jambi"],
  16: ["Sumatera Selatan", "Sumsel"], 17: ["Bengkulu", "Bengkulu"], 18: ["Lampung", "Lampung"], 19: ["Kepulauan Bangka Belitung", "Babel"], 21: ["Kepulauan Riau", "Kepri"],
  31: ["DKI Jakarta", "DKI"], 32: ["Jawa Barat", "Jabar"], 33: ["Jawa Tengah", "Jateng"], 34: ["DI Yogyakarta", "DIY"], 35: ["Jawa Timur", "Jatim"], 36: ["Banten", "Banten"],
  51: ["Bali", "Bali"], 52: ["Nusa Tenggara Barat", "NTB"], 53: ["Nusa Tenggara Timur", "NTT"],
  61: ["Kalimantan Barat", "Kalbar"], 62: ["Kalimantan Tengah", "Kalteng"], 63: ["Kalimantan Selatan", "Kalsel"], 64: ["Kalimantan Timur", "Kaltim"], 65: ["Kalimantan Utara", "Kaltara"],
  71: ["Sulawesi Utara", "Sulut"], 72: ["Sulawesi Tengah", "Sulteng"], 73: ["Sulawesi Selatan", "Sulsel"], 74: ["Sulawesi Tenggara", "Sultra"], 75: ["Gorontalo", "Gorontalo"], 76: ["Sulawesi Barat", "Sulbar"],
  81: ["Maluku", "Maluku"], 82: ["Maluku Utara", "Malut"], 91: ["Papua", "Papua"], 92: ["Papua Barat", "Papbar"], 93: ["Papua Selatan", "Papsel"], 94: ["Papua Tengah", "Papteng"],
  95: ["Papua Pegunungan", "Pegunungan Papua"], 96: ["Papua Barat Daya", "PBD"],
};
/** singkatProv("12") -> "Sumut"; kode tak dikenal -> "". */
export const singkatProv = (kode) => PROV[String(kode)]?.[1] || "";
/** kodeProv("Sumatera Utara" | "Sumut" | "DI Yogyakarta") -> "12"; tak dikenal -> "". Pencocokan penuh, tidak sebagian. */
export function kodeProv(teks) {
  const t = String(teks || "").trim().toLowerCase().replace(/^provinsi\s+/, "").replace(/^(daerah istimewa|di)\s+yogyakarta$/, "di yogyakarta");
  for (const [k, [nama, singkat]] of Object.entries(PROV)) if (t === nama.toLowerCase() || t === singkat.toLowerCase()) return k;
  return t === "yogyakarta" ? "34" : t === "jakarta" ? "31" : "";
}
