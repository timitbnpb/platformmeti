/* i18n: t(), angka(), tanggal() (DT §8.4, ALGORITMA §10, KP D10 dan D17).
   ES module; fungsi murni bisa diuji di Node, bagian DOM hanya jalan di peramban.
   Satu-satunya pintu format angka dan tanggal: tidak ada toLocaleString di berkas lain (gerbang-teks). */

export const BAHASA = ["id", "zh", "en"]; // urutan tombol: Indonesia, Mandarin, Inggris
const KUNCI_SIMPAN = "jm-bahasa";
const kamus = { id: {}, en: {}, zh: {} };
let aktif = "id";
export const hilang = new Set(); // kunci yang diminta t() tapi tak ada; dibaca uji dan konsol

export const bahasa = () => aktif;
/** Sumbu data dwibahasa {id,en}: zh tidak punya cabang sendiri, pakai Inggris. Pakai ini, jangan bahasa(), untuk o[...] ?? o.id. */
export const bahasaData = () => (aktif === "zh" ? "en" : aktif);
// rantai cadangan teks: zh -> en -> id
const RANTAI = { id: ["id"], en: ["en", "id"], zh: ["zh", "en", "id"] };
const cari = (kunci) => { for (const b of RANTAI[aktif]) if (kunci in kamus[b]) return kamus[b][kunci]; };
export const ada = (kunci) => cari(kunci) !== undefined;

export function t(kunci, param) {
  const s = cari(kunci);
  if (s === undefined) { hilang.add(kunci); return kunci; }
  return param ? s.replace(/\{(\w+)\}/g, (m, n) => (param[n] !== undefined ? param[n] : m)) : s;
}

/* ---------- angka ---------- */

/** Setengah menjauhi nol atas nilai desimal tertulis: bulat(1.005, 2) = 1.01, bulat(-2.5, 0) = -3. */
export function bulat(n, d = 0) {
  if (!Number.isFinite(n)) return n;
  const s = String(Math.abs(n));
  const m = s.includes("e") ? Math.round(Math.abs(n) * 10 ** d) / 10 ** d : Number(Math.round(Number(s + "e" + d)) + "e-" + d);
  return n < 0 && m !== 0 ? -m : m;
}

const penyusun = {};
function format(b, d) {
  const kunci = b + d;
  return (penyusun[kunci] ??= new Intl.NumberFormat(b === "id" ? "id-ID" : "en-US", { useGrouping: true, minimumFractionDigits: d, maximumFractionDigits: d }));
}

/** angka(1234567.891, {desimal: 2}) -> ID "1.234.567,89", EN "1,234,567.89". null/NaN/Infinity -> "-". */
export function angka(n, { desimal = 0, bahasa: b = aktif } = {}) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "-";
  if (Math.abs(n) > 1e21) throw new RangeError("terlalu-besar");
  return format(b, desimal).format(bulat(n, desimal));
}

/* ---------- tanggal (tabel bulan sendiri, tanpa Intl, supaya "Agu" dan "Mei" sama di semua mesin) ---------- */

const BULAN = {
  id: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  zh: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
};
const BULAN_PANJANG = {
  id: ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  zh: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
};

export function tanggalSah(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s));
  if (!m) return false;
  const [y, b, h] = [+m[1], +m[2], +m[3]];
  if (b < 1 || b > 12 || h < 1) return false;
  const kabisat = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  return h <= [31, kabisat ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][b - 1];
}

/** tanggal("2026-11-07") -> "7 Nov 2026", zh "2026年11月7日"; gaya "panjang" -> "7 November 2026"; tidak sah -> "-". */
export function tanggal(s, { gaya = "pendek", bahasa: b = aktif } = {}) {
  if (!tanggalSah(s)) return "-";
  const [y, bln, h] = String(s).split("-").map(Number);
  if (b === "zh") return `${y}年${bln}月${h}日`; // pendek dan panjang sama: 2026年11月12日
  return `${h} ${(gaya === "panjang" ? BULAN_PANJANG : BULAN)[b === "en" ? "en" : "id"][bln - 1]} ${y}`;
}

const WIB = 7 * 3600;
/** Detik unix -> "YYYY-MM-DD" zona WIB (tanpa pustaka tanggal). */
export function tanggalDariUnix(unix) {
  if (!Number.isFinite(unix)) return "-";
  return new Date((unix + WIB) * 1000).toISOString().slice(0, 10);
}
/** Detik unix -> "HH:MM WIB", 24 jam. */
export function jam(unix) {
  if (!Number.isFinite(unix)) return "-";
  return new Date((unix + WIB) * 1000).toISOString().slice(11, 16) + " WIB";
}

/* ---------- bahasa aktif (peramban) ---------- */

const LANG_HTML = { id: "id", en: "en", zh: "zh-Hans" };

/** Prioritas: ?lang= > localStorage (try/catch) > akun.bahasa > "id". */
export function pilihBahasa(akunBahasa) {
  try { const q = new URLSearchParams(location.search).get("lang"); if (BAHASA.includes(q)) return q; } catch (e) {}
  try { const s = localStorage.getItem(KUNCI_SIMPAN); if (BAHASA.includes(s)) return s; } catch (e) {}
  return BAHASA.includes(akunBahasa) ? akunBahasa : "id";
}

async function muat(b) {
  if (Object.keys(kamus[b]).length) return;
  const r = await fetch(`/i18n/${b}.json`, { credentials: "same-origin" });
  if (!r.ok) throw new Error("kamus");
  kamus[b] = await r.json();
}

/** Terapkan teks kamus ke DOM: data-i18n="kunci" (isi), data-i18n-attr="atribut:kunci;atribut:kunci". */
export function terapkanDom(akar = document) {
  for (const el of akar.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  for (const el of akar.querySelectorAll("[data-i18n-attr]")) {
    for (const pasang of el.dataset.i18nAttr.split(";")) {
      const [attr, kunci] = pasang.split(":");
      if (attr && kunci) el.setAttribute(attr, t(kunci));
    }
  }
}

/** Dipanggil sekali per halaman sebelum render. */
export async function mulaiBahasa(akunBahasa) {
  const b = pilihBahasa(akunBahasa);
  await Promise.all([muat("id"), b !== "id" ? muat("en") : null, b === "zh" ? muat("zh") : null]);
  aktif = b;
  document.documentElement.lang = LANG_HTML[b];
  terapkanDom();
  return b;
}

/** Ganti bahasa dari tombol ID/ZH/EN: simpan, rapikan ?lang=, terapkan, kabari halaman. */
export async function gantiBahasa(b, { masuk = false } = {}) {
  if (!BAHASA.includes(b)) return;
  if (b !== "id") await muat("en");
  await muat(b);
  aktif = b;
  document.documentElement.lang = LANG_HTML[b];
  try { localStorage.setItem(KUNCI_SIMPAN, b); } catch (e) {}
  try {
    const u = new URL(location.href);
    if (u.searchParams.has("lang")) { u.searchParams.set("lang", b); history.replaceState(null, "", u); }
  } catch (e) {}
  terapkanDom();
  document.dispatchEvent(new CustomEvent("jm:bahasa", { detail: b }));
  // ponytail: akun.bahasa di D1 ber-CHECK ('id','en') dan tanpa migrasi; zh hanya di localStorage. Naikkan lewat migrasi bila zh perlu ikut akun.
  if (masuk && b !== "zh") {
    fetch("/api/saya", { method: "PATCH", credentials: "same-origin", headers: { "x-pb": "1", "content-type": "application/json" }, body: JSON.stringify({ bahasa: b }) }).catch(() => {});
  }
}
