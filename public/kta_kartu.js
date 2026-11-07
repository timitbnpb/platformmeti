/* Penggambar kartu KTA di kanvas (satu penggambar untuk tampilan, PNG, dan PDF). Ukuran 1712 x 1080 = 85,6 x 54 mm x 20.
   Warna diambil dari token tema.css (--meti-*) saat digambar, jadi kartu sama di mode terang dan gelap. Teks lewat t(). */
import { t, tanggal } from "/i18n.js";

export const LEBAR = 1712, TINGGI = 1080;
const M = 84; // margin kartu
const warna = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const PUTIH = "#ffffff";
/* Kartu tidak ikut tema gelap: teks gelap memakai --kaki-bg (hampir hitam di dua tema), judul --meti-navy. */
const gelap = () => warna("--kaki-bg");
const lembut = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

const kotak = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
const mentah = (a) => a.replace(/ /g, "-");
export const labelJenis = (j) => t("kta.jenis." + mentah(j));

/** Pecah teks per kata ke baris selebar `maks` px pada font kanvas saat ini. */
function bungkus(c, teks, maks) {
  const baris = [];
  let cur = "";
  for (const k of String(teks).split(/\s+/)) {
    const uji = cur ? cur + " " + k : k;
    if (c.measureText(uji).width <= maks || !cur) cur = uji; else { baris.push(cur); cur = k; }
  }
  if (cur) baris.push(cur);
  return baris;
}
function potong(c, teks, maks) {
  let s = String(teks);
  if (c.measureText(s).width <= maks) return s;
  while (s.length > 1 && c.measureText(s + "…").width > maks) s = s.slice(0, -1);
  return s.trimEnd() + "…";
}
const huruf = (c, w, tebal, px) => { c.font = `${w} ${px}px Inter, Arial, sans-serif`; if ("letterSpacing" in c) c.letterSpacing = tebal || "0px"; };

/* ---------- latar bersama: gradasi hijau brand + pola cincin halus + garis aksen bawah ---------- */
function latarHijau(c, tinggiBidang = TINGGI) {
  const navy = warna("--meti-navy"), teal = warna("--meti-teal"), cyan = warna("--meti-cyan"), lime = warna("--meti-lime");
  const g = c.createLinearGradient(0, 0, LEBAR, tinggiBidang);
  g.addColorStop(0, navy); g.addColorStop(0.62, teal); g.addColorStop(1, navy);
  c.fillStyle = g; c.fillRect(0, 0, LEBAR, tinggiBidang);
  const r1 = c.createRadialGradient(LEBAR * 0.92, 0, 0, LEBAR * 0.92, 0, 900);
  r1.addColorStop(0, cyan + "55"); r1.addColorStop(1, cyan + "00");
  c.fillStyle = r1; c.fillRect(0, 0, LEBAR, tinggiBidang);
  const r2 = c.createRadialGradient(0, tinggiBidang, 0, 0, tinggiBidang, 700);
  r2.addColorStop(0, lime + "40"); r2.addColorStop(1, lime + "00");
  c.fillStyle = r2; c.fillRect(0, 0, LEBAR, tinggiBidang);
  c.save();
  c.strokeStyle = "rgba(255,255,255,.07)"; c.lineWidth = 3;
  for (let r = 170; r < 1500; r += 110) { c.beginPath(); c.arc(LEBAR * 0.9, tinggiBidang * 0.1, r, 0, Math.PI * 2); c.stroke(); }
  c.strokeStyle = "rgba(255,255,255,.035)"; c.lineWidth = 2;
  for (let x = -tinggiBidang; x < LEBAR; x += 26) { c.beginPath(); c.moveTo(x, tinggiBidang); c.lineTo(x + tinggiBidang, 0); c.stroke(); }
  c.restore();
}
function garisAksen(c) {
  const g = c.createLinearGradient(0, 0, LEBAR, 0);
  g.addColorStop(0, warna("--meti-lime")); g.addColorStop(1, warna("--meti-cyan"));
  c.fillStyle = g; c.fillRect(0, TINGGI - 16, LEBAR, 16);
}
function kepalaMerek(c, logo, { kanan }) {
  c.fillStyle = PUTIH; c.beginPath(); c.arc(M + 70, 138, 70, 0, Math.PI * 2); c.fill();
  if (logo) { const w = 104, h = (w * 238) / 256; c.drawImage(logo, M + 70 - w / 2, 138 - h / 2, w, h); }
  c.textBaseline = "alphabetic"; c.textAlign = "left";
  huruf(c, 700, "2px", 66); c.fillStyle = PUTIH; c.fillText("METI", M + 168, 134);
  huruf(c, 400, "0px", 28); c.fillStyle = "rgba(255,255,255,.88)"; c.fillText(t("kta.kartu.org"), M + 168, 176);
  if (kanan) { c.textAlign = "right"; huruf(c, 700, "0px", 40); c.fillStyle = warna("--meti-lime"); c.fillText(kanan, LEBAR - M, 150); c.textAlign = "left"; }
}

/* ---------- QR: modul digambar langsung dari matriks (qrcode-generator, di-vendor) ---------- */
export async function bikinQr(teks) {
  const qr = (await import("/vendor/qrcode/qrcode.mjs")).default(0, "M");
  qr.addData(teks); qr.make();
  const n = qr.getModuleCount(), m = [];
  for (let r = 0; r < n; r++) { m.push([]); for (let k = 0; k < n; k++) m[r].push(qr.isDark(r, k)); }
  return m;
}
function gambarQr(c, matriks, x, y, ukuran) {
  c.fillStyle = PUTIH; kotak(c, x, y, ukuran, ukuran, 30); c.fill();
  if (!matriks) return;
  const n = matriks.length, sel = Math.floor((ukuran - 48) / n), tepi = (ukuran - sel * n) / 2;
  c.fillStyle = gelap();
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (matriks[r][k]) c.fillRect(Math.round(x + tepi + k * sel), Math.round(y + tepi + r * sel), sel, sel);
}

const STATUS = { aktif: ["--meti-lime", "gelap"], kedaluwarsa: ["--meti-oranye", PUTIH], dicabut: ["#B3261E", PUTIH], tertunda: ["--meti-cyan", "gelap"] };
const ambil = (x) => (x === "gelap" ? gelap() : x.startsWith("--") ? warna(x) : x);

/** Sisi depan. d: { nama, nomor, jenis, instansi, berlaku, status, qr, foto, logo }. */
export function gambarDepan(c, d) {
  c.save(); kotak(c, 0, 0, LEBAR, TINGGI, 56); c.clip();
  latarHijau(c); garisAksen(c);
  kepalaMerek(c, d.logo, { kanan: t("kta.kartu.judul") });
  // foto persegi
  const fx = M, fy = 300, fs = 380;
  c.fillStyle = PUTIH; kotak(c, fx - 8, fy - 8, fs + 16, fs + 16, 40); c.fill();
  c.save(); kotak(c, fx, fy, fs, fs, 32); c.clip();
  if (d.foto) {
    const s = Math.min(d.foto.width, d.foto.height), sx = (d.foto.width - s) / 2, sy = (d.foto.height - s) / 2;
    c.drawImage(d.foto, sx, sy, s, s, fx, fy, fs, fs);
  } else {
    const g = c.createLinearGradient(fx, fy, fx + fs, fy + fs);
    g.addColorStop(0, warna("--meti-lime")); g.addColorStop(1, warna("--meti-cyan"));
    c.fillStyle = g; c.fillRect(fx, fy, fs, fs);
    huruf(c, 700, "0px", 170); c.fillStyle = PUTIH; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText((String(d.nama).match(/\p{L}/gu) || ["?"]).slice(0, 2).join("").toLocaleUpperCase(), fx + fs / 2, fy + fs / 2 + 8);
    c.textAlign = "left"; c.textBaseline = "alphabetic";
  }
  c.restore();
  // lencana status
  const [lat, tek] = STATUS[d.status] || STATUS.tertunda;
  c.fillStyle = ambil(lat); kotak(c, fx, 718, fs, 66, 33); c.fill();
  huruf(c, 700, "0px", 32); c.fillStyle = ambil(tek); c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(t("kta.kartu.status." + d.status), fx + fs / 2, 752); c.textAlign = "left"; c.textBaseline = "alphabetic";
  // nama (maks dua baris), instansi
  const kx = 520, kl = LEBAR - M - kx;
  let px = 78, baris;
  for (;;) { huruf(c, 700, "-1px", px); baris = bungkus(c, d.nama, kl); if (baris.length <= 2 || px <= 52) break; px -= 4; }
  baris = baris.slice(0, 2).map((b, i, a) => (i === a.length - 1 ? potong(c, b, kl) : b));
  c.fillStyle = PUTIH;
  let y = 372;
  for (const b of baris) { c.fillText(b, kx, y); y += px * 1.12; }
  if (d.instansi) { huruf(c, 400, "0px", 40); c.fillStyle = "rgba(255,255,255,.9)"; c.fillText(potong(c, d.instansi, kl), kx, y + 14); }
  // jenis dan masa berlaku
  c.fillStyle = "rgba(255,255,255,.32)"; c.fillRect(kx, 612, 790, 2);
  const kolom = (x, kunci, nilai) => {
    huruf(c, 400, "0px", 28); c.fillStyle = "rgba(255,255,255,.75)"; c.fillText(t(kunci), x, 662);
    huruf(c, 600, "0px", 44); c.fillStyle = PUTIH; c.fillText(nilai, x, 716);
  };
  kolom(kx, "kta.kartu.jenis", labelJenis(d.jenis));
  kolom(960, "kta.kartu.berlaku", tanggal(d.berlaku));
  // nomor KTA dan QR
  huruf(c, 400, "0px", 28); c.fillStyle = "rgba(255,255,255,.75)"; c.fillText(t("kta.kartu.nomor"), M, 852);
  huruf(c, 700, "1px", 68); c.fillStyle = warna("--meti-lime"); c.fillText(d.nomor || "-", M, 930);
  gambarQr(c, d.qr, LEBAR - M - 330, 690, 330);
  c.restore();
}

/** Sisi belakang. d: { nomor, berlaku, logo, ttd (gambar tanda tangan Ketua Umum atau null) }. */
export function gambarBelakang(c, d) {
  c.save(); kotak(c, 0, 0, LEBAR, TINGGI, 56); c.clip();
  const g = c.createLinearGradient(0, 0, 0, TINGGI);
  g.addColorStop(0, warna("--meti-cloud")); g.addColorStop(1, PUTIH);
  c.fillStyle = g; c.fillRect(0, 0, LEBAR, TINGGI);
  c.save(); c.beginPath(); c.rect(0, 0, LEBAR, 250); c.clip(); latarHijau(c, 250); c.restore();
  kepalaMerek(c, d.logo, { kanan: t("kta.kartu.judul") });
  c.textBaseline = "alphabetic"; c.textAlign = "left";
  // ketentuan
  huruf(c, 700, "0px", 42); c.fillStyle = warna("--meti-navy"); c.fillText(t("kta.belakang.judul"), M, 340);
  huruf(c, 400, "0px", 33); c.fillStyle = lembut(gelap(), 0.78);
  let y = 400;
  for (const k of ["kta.belakang.k1", "kta.belakang.k2", "kta.belakang.k3"]) {
    c.fillStyle = warna("--meti-lime"); c.beginPath(); c.arc(M + 9, y - 11, 9, 0, Math.PI * 2); c.fill();
    c.fillStyle = lembut(gelap(), 0.78);
    for (const b of bungkus(c, t(k), 780)) { c.fillText(b, M + 40, y); y += 46; }
    y += 20;
  }
  // sekretariat
  const sx = 1010, sl = LEBAR - M - sx;
  c.fillStyle = warna("--meti-navy"); huruf(c, 700, "0px", 42); c.fillText(t("kta.belakang.sekretariat"), sx, 340);
  huruf(c, 400, "0px", 31); c.fillStyle = lembut(gelap(), 0.78);
  let yy = 400;
  for (const b of bungkus(c, t("kta.belakang.alamat"), sl)) { c.fillText(b, sx, yy); yy += 44; }
  yy += 14;
  c.fillStyle = warna("--meti-navy"); huruf(c, 600, "0px", 31);
  c.fillText("meti.ires@gmail.com", sx, yy); yy += 46; c.fillText("www.meti.or.id", sx, yy);
  // tanda tangan Ketua Umum, hanya bila berkas tersedia
  if (d.ttd) {
    const h = 130, w = Math.min(380, (d.ttd.width / d.ttd.height) * h);
    c.drawImage(d.ttd, sx, 740, w, (w * d.ttd.height) / d.ttd.width);
    c.fillStyle = lembut(gelap(), 0.78); c.fillRect(sx, 884, 380, 2);
    huruf(c, 600, "0px", 28); c.fillText(t("kta.belakang.ketua"), sx, 924);
  }
  // nomor dan masa berlaku
  c.fillStyle = warna("--meti-navy"); huruf(c, 700, "1px", 44); c.fillText(d.nomor || "-", M, 940);
  huruf(c, 400, "0px", 30); c.fillStyle = lembut(gelap(), 0.78); c.fillText(t("kta.kartu.berlaku") + " " + tanggal(d.berlaku), M, 988);
  garisAksen(c);
  c.restore();
}

/* ---------- muat gambar ---------- */
export const muatGambar = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
export async function pastikanFont() {
  try { await Promise.all([400, 600, 700].map((w) => document.fonts.load(`${w} 30px Inter`))); } catch (e) { /* font cadangan */ }
}

/* ---------- ekspor ---------- */
export function unduhBlob(blob, nama) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = nama; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
const jadiBlob = (kanvas, tipe, mutu) => new Promise((ok) => kanvas.toBlob(ok, tipe, mutu));

/** PNG: depan di atas, belakang di bawah, satu berkas. */
export async function unduhPng(depan, belakang, nama) {
  const k = document.createElement("canvas"), g = 48;
  k.width = LEBAR; k.height = TINGGI * 2 + g;
  const c = k.getContext("2d");
  c.drawImage(depan, 0, 0); c.drawImage(belakang, 0, TINGGI + g);
  unduhBlob(await jadiBlob(k, "image/png"), nama + ".png");
}

/** PDF dua halaman seukuran kartu (85,6 x 54 mm), gambar JPEG dibungkus tanpa pustaka. */
export function susunPdf(jpegs, lebarPx, tinggiPx) {
  const pw = ((85.6 / 25.4) * 72).toFixed(2), ph = ((54 / 25.4) * 72).toFixed(2);
  const enc = new TextEncoder(), bagian = [], pos = [];
  let n = 0;
  const taruh = (x) => { const b = typeof x === "string" ? enc.encode(x) : x; bagian.push(b); n += b.length; };
  const objek = (no, isi, aliran) => {
    pos[no] = n; taruh(`${no} 0 obj\n${isi}`);
    if (aliran) { taruh("\nstream\n"); taruh(aliran); taruh("\nendstream"); }
    taruh("\nendobj\n");
  };
  taruh("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n");
  objek(1, "<< /Type /Catalog /Pages 2 0 R >>");
  objek(2, `<< /Type /Pages /Count ${jpegs.length} /Kids [${jpegs.map((_, i) => `${3 + 3 * i} 0 R`).join(" ")}] >>`);
  jpegs.forEach((j, i) => {
    const p = 3 + 3 * i, isi = `q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;
    objek(p, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 ${p + 1} 0 R >> >> /Contents ${p + 2} 0 R >>`);
    objek(p + 1, `<< /Type /XObject /Subtype /Image /Width ${lebarPx} /Height ${tinggiPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${j.length} >>`, j);
    objek(p + 2, `<< /Length ${isi.length} >>`, isi);
  });
  const total = 3 + 3 * jpegs.length, xref = n;
  taruh(`xref\n0 ${total}\n0000000000 65535 f \n`);
  for (let i = 1; i < total; i++) taruh(String(pos[i]).padStart(10, "0") + " 00000 n \n");
  taruh(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const hasil = new Uint8Array(n);
  let o = 0;
  for (const b of bagian) { hasil.set(b, o); o += b.length; }
  return hasil;
}
export async function unduhPdf(depan, belakang, nama) {
  const jpegs = [];
  for (const sisi of [depan, belakang]) {
    const k = document.createElement("canvas");
    k.width = LEBAR; k.height = TINGGI;
    const c = k.getContext("2d");
    c.fillStyle = PUTIH; c.fillRect(0, 0, LEBAR, TINGGI); c.drawImage(sisi, 0, 0);
    jpegs.push(new Uint8Array(await (await jadiBlob(k, "image/jpeg", 0.93)).arrayBuffer()));
  }
  unduhBlob(new Blob([susunPdf(jpegs, LEBAR, TINGGI)], { type: "application/pdf" }), nama + ".pdf");
}
