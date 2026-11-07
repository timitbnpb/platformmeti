/* Penyamaran kontak anggota (murni, tanpa DOM): pecah di / , ; dan spasi, samarkan SETIAP surel dan nomor. */
const TOKEN = /([\/,;\s]+)/;
const samarSurel = (s) => { const i = s.indexOf("@"); return s.slice(0, Math.min(2, i)) + "****" + s.slice(i); };
const samarNomor = (s) => { const d = s.replace(/\D/g, ""); return d.length > 8 ? d.slice(0, 4) + "****" + d.slice(-2) : "****"; };
export function samarKontak(teks) {
  return String(teks || "").split(TOKEN).map((x, i) => (i % 2 ? x : x.includes("@") ? samarSurel(x) : /\d/.test(x) ? samarNomor(x) : x)).join("");
}
