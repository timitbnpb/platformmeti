// sandi.js (JM-B02): PBKDF2-SHA256 WebCrypto, garam 16 byte, perbandingan waktu tetap, `iterasi` per akun (ADR-04).
import { acak, samaTetap } from "./util.js";

export const ITERASI_TARGET = 210000;
// Terukur di workerd lokal (wrangler 4.158): 210.000 dan 600.000 diterima. Batas produksi Workers diyakini 100.000;
// bila runtime menolak (NotSupportedError) hashSandi turun ke ITERASI_CADANGAN dan akun menyimpan angka sebenarnya.
export const ITERASI_CADANGAN = 100000;
let aktif = ITERASI_TARGET;
export const iterasiAktif = () => aktif;

const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");
const dariHex = (h) => Uint8Array.from(h.match(/../g) ?? [], (x) => parseInt(x, 16));

async function turunkan(sandi, garamHex, iterasi) {
  const kunci = await crypto.subtle.importKey("raw", new TextEncoder().encode(sandi), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: dariHex(garamHex), iterations: iterasi }, kunci, 256));
}

// -> { hash (64 hex), garam (32 hex), iterasi }
export async function hashSandi(sandi, garam = acak(16)) {
  try {
    return { hash: await turunkan(sandi, garam, aktif), garam, iterasi: aktif };
  } catch (e) {
    if (aktif === ITERASI_CADANGAN || e?.name !== "NotSupportedError") throw e;
    aktif = ITERASI_CADANGAN;
    return { hash: await turunkan(sandi, garam, aktif), garam, iterasi: aktif };
  }
}

export async function cocokSandi(sandi, hashSimpan, garam, iterasi) {
  return samaTetap(await turunkan(sandi, garam, iterasi), hashSimpan);
}

// Hitung hash sungguhan pada surel tak dikenal supaya waktu respons sama (KPV §4).
export async function hashPalsu(sandi) {
  await turunkan(String(sandi), "00".repeat(16), aktif);
}

// Akun lama dengan iterasi < target di-rehash saat masuk berikutnya.
export const perluRehash = (iterasi) => iterasi < aktif;

// Kebijakan KPV §4: 12 sampai 128 karakter, tidak sama dengan surel. -> true bila sah.
export const sandiSah = (sandi, surel = "") =>
  typeof sandi === "string" && sandi.length >= 12 && sandi.length <= 128 && sandi.toLowerCase() !== String(surel).toLowerCase();
