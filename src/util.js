// util.js (JM-A04): pembantu murni, tanpa D1. Dipakai router dan semua modul rute.

export const RE_EMAIL = /^[^\s@]{1,64}@[^\s@.]+(\.[^\s@.]+)+$/;

// Surel untuk catatan jejak: dua huruf awal nama dan satu huruf awal domain, sisanya bintang (mis. "ab***@d***.id").
export function samarSurel(surel) {
  const [l, d = ""] = String(surel).toLowerCase().split("@");
  const ujung = d.slice(d.lastIndexOf("."));
  return `${l.slice(0, 2)}***@${d.slice(0, 1)}***${d.includes(".") ? ujung : ""}`.slice(0, 80);
}

// Katalog kode galat (snake) -> [status baku, pesan Indonesia baku]. Klien menerjemahkan lewat kunci `galat.<kode>`.
export const KATALOG = {
  belum_masuk: [401, "Silakan masuk terlebih dahulu."],
  masuk_gagal: [401, "Surel atau sandi salah."],
  dilarang: [403, "Anda tidak berhak melakukan ini."],
  tidak_ditemukan: [404, "Tidak ditemukan."],
  metode: [405, "Metode tidak didukung."],
  konflik: [409, "Konflik data."],
  terlalu_besar: [413, "Badan permintaan terlalu besar."],
  masukan_salah: [422, "Masukan tidak sah."],
  persetujuan_wajib: [422, "Pilih tujuan penggunaan dan setujui ketentuan unduh."],
  berkas_belum_ada: [404, "Berkas belum tersedia."],
  sumber_wajib: [422, "Fakta dan ikatan wajib bersumber."],
  kuota_penuh: [409, "Kuota acara sudah penuh."],
  pendaftaran_tutup: [409, "Pendaftaran acara ini tidak dibuka."],
  laju_terlampaui: [429, "Terlalu sering. Coba lagi nanti."],
  server: [500, "Terjadi kesalahan di server."],
  layanan: [503, "Layanan belum siap."],
};

export class Galat extends Error {
  constructor(kode, status) {
    super(kode);
    this.kode = kode;
    this.status = status ?? KATALOG[kode]?.[0] ?? 500;
  }
}

const NOSNIFF = { "x-content-type-options": "nosniff" };

export function json(data, status = 200, header = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...NOSNIFF, ...header },
  });
}

// Tanpa jejak tumpukan atau pesan internal ke klien.
export function gagal(kode, status, header = {}) {
  const [baku, pesan] = KATALOG[kode] ?? KATALOG.server;
  return json({ galat: pesan, kode: KATALOG[kode] ? kode : "server" }, status ?? baku, header);
}

// Respons berautentikasi: tidak pernah masuk cache bersama.
export const PRIVAT = { "cache-control": "private, no-store", vary: "Cookie" };

const dekode = new TextDecoder();

// Baca JSON objek, maks `maks` BYTE, dibaca bertahap (juga untuk chunked tanpa Content-Length).
export async function bacaBody(req, maks = 65536) {
  if (!/^application\/json(\s*;|$)/i.test(req.headers.get("content-type") || "")) throw new Galat("masukan_salah", 415);
  if (Number(req.headers.get("content-length")) > maks) throw new Galat("terlalu_besar");
  const bagian = [];
  let n = 0;
  if (req.body) {
    const rd = req.body.getReader();
    for (;;) {
      const { value, done } = await rd.read();
      if (done) break;
      n += value.length;
      if (n > maks) {
        rd.cancel().catch(() => {});
        throw new Galat("terlalu_besar");
      }
      bagian.push(value);
    }
  }
  const b = new Uint8Array(n);
  let p = 0;
  for (const x of bagian) { b.set(x, p); p += x.length; }
  let o;
  try { o = JSON.parse(dekode.decode(b) || "{}"); } catch { throw new Galat("masukan_salah"); }
  if (!o || typeof o !== "object" || Array.isArray(o)) throw new Galat("masukan_salah");
  return o;
}

const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");

export const acak = (n = 32) => hex(crypto.getRandomValues(new Uint8Array(n)));

export const sha = async (teks) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(teks)));

// Perbandingan waktu tetap untuk dua string (panjang beda = false, tanpa keluar awal pada isi).
export function samaTetap(a, b) {
  const x = new TextEncoder().encode(String(a)), y = new TextEncoder().encode(String(b));
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return d === 0;
}

// IPv6 dipangkas ke /64 (satu pelanggan memegang satu /64), IPv4 apa adanya.
export function kunciIP(ip) {
  if (!ip.includes(":") || ip.includes(".")) return ip;
  const [a, b] = ip.split("::");
  const h = a ? a.split(":") : [], t = b ? b.split(":") : [];
  return [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill("0"), ...t]
    .slice(0, 4).map((x) => parseInt(x || "0", 16).toString(16)).join(":") + "::/64";
}

// 16 hex: SHA-256(IP_SALT | hari | ip/64). Garam harian: kunci tidak bisa dilacak lintas hari. Tanpa IP_SALT: galat layanan.
export async function ipHash(env, req, kini = Date.now()) {
  if (!env.IP_SALT) throw new Galat("layanan");
  const ip = req.headers.get("cf-connecting-ip") || "lokal";
  const hari = Math.floor(kini / 86400000);
  return (await sha(`${env.IP_SALT}|${hari}|${kunciIP(ip)}`)).slice(0, 16);
}

// Cache tepi HANYA untuk respons lapis publik; kunci tanpa cookie. Pemanggil wajib sudah memeriksa sesi.
export async function cacheTepi(req, ctx, bikin, detik = 300) {
  const u = new URL(req.url);
  const kunci = new Request(u.origin + u.pathname + (u.pathname === "/api/konten-beranda" ? "" : u.search)); // konten beranda tanpa query: cegah cache-busting
  const c = globalThis.caches?.default;
  const kena = c && (await c.match(kunci));
  if (kena) return kena;
  const res = await bikin();
  if (c && res.status === 200) {
    const salin = new Response(res.body, res);
    salin.headers.set("cache-control", `public, max-age=${detik}`);
    ctx?.waitUntil?.(c.put(kunci, salin.clone()));
    return salin;
  }
  return res;
}

// `ke` pengalihan: hanya jalur relatif di situs sendiri.
export function jalurAman(ke, bawaan = "/") {
  return typeof ke === "string" && /^\/(?![/\\])[^\s\\]*$/.test(ke) && ke.length <= 200 ? ke : bawaan;
}

// Gerbang peran, BARIS PERTAMA handler: `perlu(p, ["admin", "super"])` (tanpa himpunan = cukup masuk).
// 401 untuk tamu, 403 untuk peran lain. Mengembalikan akun.
export function perlu(p, himpunan) {
  if (!p?.akun) throw new Galat("belum_masuk");
  if (himpunan && !himpunan.includes(p.akun.peran)) throw new Galat("dilarang");
  return p.akun;
}

// Header keamanan global; HARUS sama dengan blok "/*" di public/_headers (dijaga tests/gerbang-headers.test.mjs).
export const HEADER_KEAMANAN = {
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "cross-origin-opener-policy": "same-origin",
  "content-security-policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob: https://tiles.openfreemap.org https://i.ytimg.com; font-src 'self'; connect-src 'self' https://tiles.openfreemap.org; worker-src blob:; frame-src https://www.youtube-nocookie.com https://www.instagram.com https://www.linkedin.com; child-src blob:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'; upgrade-insecure-requests",
};

// Halaman HTML rakitan Worker: salin header aset asal (bila ada), pastikan header keamanan terpasang, dan jangan di-cache bersama (situs di balik login).
export function halamanHtml(html, cangkang, status = 200) {
  const h = new Headers(cangkang?.headers);
  for (const k of ["content-length", "content-encoding", "etag", "last-modified"]) h.delete(k);
  for (const [k, v] of Object.entries(HEADER_KEAMANAN)) if (!h.has(k)) h.set(k, v);
  h.set("content-type", "text/html; charset=utf-8");
  h.set("cache-control", "private, no-store");
  h.set("vary", "Cookie");
  return new Response(html, { status, headers: h });
}
