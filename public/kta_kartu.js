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
function kepalaMerek(c, logo, { kanan, x: X = M }) {
  c.fillStyle = PUTIH; c.beginPath(); c.arc(X + 70, 138, 70, 0, Math.PI * 2); c.fill();
  if (logo) { const w = 104, h = (w * 238) / 256; c.drawImage(logo, X + 70 - w / 2, 138 - h / 2, w, h); }
  c.textBaseline = "alphabetic"; c.textAlign = "left";
  huruf(c, 700, "2px", 66); c.fillStyle = PUTIH; c.fillText("METI", X + 168, 134);
  huruf(c, 400, "0px", 28); c.fillStyle = "rgba(255,255,255,.88)"; c.fillText(t("kta.kartu.org"), X + 168, 176);
  if (kanan) { c.textAlign = "right"; huruf(c, 700, "0px", 34); c.fillStyle = warna("--meti-lime"); c.fillText(kanan, LEBAR - M, 78); c.textAlign = "left"; }
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

/* ---------- latar gaya kartu foto pengurus (.tn-fk-pt v3) untuk panel foto ---------- */
const PX = 560, CX = PX / 2, CY = 380; // lebar panel foto dan pusat cahaya di belakang kepala
function latarFoto(c) {
  const navy = warna("--meti-navy"), teal = warna("--meti-teal"), cyan = warna("--meti-cyan"), lime = warna("--meti-lime");
  c.save(); c.beginPath(); c.rect(0, 0, PX, TINGGI); c.clip();
  const g = c.createLinearGradient(0, 0, PX * 0.6, TINGGI);
  g.addColorStop(0, "#04382b"); g.addColorStop(0.35, navy); g.addColorStop(0.75, teal); g.addColorStop(1, cyan);
  c.fillStyle = g; c.fillRect(0, 0, PX, TINGGI);
  c.strokeStyle = lembut(lime, 0.1); c.lineWidth = 3; // garis parang lime
  for (let x = -TINGGI; x < PX; x += 40) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + TINGGI, TINGGI); c.stroke(); }
  c.fillStyle = lembut("#ffffff", 0.06); // sinar conic halus
  for (let a = 0; a < 360; a += 14) { c.beginPath(); c.moveTo(CX, CY); c.arc(CX, CY, 1200, (a * Math.PI) / 180, ((a + 4) * Math.PI) / 180); c.closePath(); c.fill(); }
  c.strokeStyle = "rgba(255,255,255,.1)"; c.lineWidth = 2; // cincin halo
  for (let r = 230; r < 700; r += 54) { c.beginPath(); c.arc(CX, CY, r, 0, Math.PI * 2); c.stroke(); }
  const r1 = c.createRadialGradient(CX, CY, 0, CX, CY, 330); // cahaya lime di belakang kepala
  r1.addColorStop(0, lembut(lime, 0.5)); r1.addColorStop(0.5, "rgba(255,255,255,.12)"); r1.addColorStop(1, lembut(lime, 0));
  c.fillStyle = r1; c.fillRect(0, 0, PX, TINGGI);
  const r2 = c.createLinearGradient(0, TINGGI * 0.55, 0, TINGGI); // vinyet bawah
  r2.addColorStop(0, "rgba(0,0,0,0)"); r2.addColorStop(1, "rgba(0,0,0,.5)");
  c.fillStyle = r2; c.fillRect(0, TINGGI * 0.55, PX, TINGGI);
  c.restore();
}
/* ---------- latar kanan: gradien brand gelap + kawung halus (setara .jm-batik) + kilau ---------- */
function latarKanan(c) {
  const navy = warna("--meti-navy"), lime = warna("--meti-lime");
  c.save(); c.beginPath(); c.rect(PX, 0, LEBAR - PX, TINGGI); c.clip();
  const g = c.createLinearGradient(PX, 0, LEBAR, TINGGI);
  g.addColorStop(0, "#05392c"); g.addColorStop(0.6, navy); g.addColorStop(1, "#04382b");
  c.fillStyle = g; c.fillRect(PX, 0, LEBAR - PX, TINGGI);
  c.save(); c.strokeStyle = "rgba(255,255,255,.09)"; c.lineWidth = 2;
  const k = 64; // kawung: empat elips bertumpuk per sel
  for (let y = 0; y < TINGGI; y += k) for (let x = PX; x < LEBAR + k; x += k) {
    for (const [dx, dy, rot] of [[0, -k / 4, 0], [0, k / 4, 0], [-k / 4, 0, 1], [k / 4, 0, 1]]) {
      c.beginPath(); c.ellipse(x + k / 2 + dx, y + k / 2 + dy, k / 4, k / 8 + 4, rot ? Math.PI / 2 : 0, 0, Math.PI * 2); c.stroke();
    }
  }
  c.restore();
  const m = c.createLinearGradient(0, 0, 0, TINGGI); // pola memudar ke bawah
  m.addColorStop(0, lembut(navy, 0)); m.addColorStop(1, lembut(navy, 0.75));
  c.fillStyle = m; c.fillRect(PX, 0, LEBAR - PX, TINGGI);
  const kl = c.createLinearGradient(PX + 300, 0, PX + 760, TINGGI); // kilau diagonal
  kl.addColorStop(0, "rgba(255,255,255,0)"); kl.addColorStop(0.5, lembut(lime, 0.14)); kl.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = kl; c.fillRect(PX, 0, LEBAR - PX, TINGGI);
  c.restore();
  const s = c.createLinearGradient(0, 0, 0, TINGGI); // garis aksen lime pemisah
  s.addColorStop(0, lime); s.addColorStop(1, warna("--meti-cyan"));
  c.fillStyle = s; c.fillRect(PX - 4, 0, 8, TINGGI);
}

/** Sisi depan. d: { nama, nomor, jenis, instansi, berlaku, status, qr, foto, logo }. */
export function gambarDepan(c, d) {
  c.save(); kotak(c, 0, 0, LEBAR, TINGGI, 56); c.clip();
  latarFoto(c); latarKanan(c); garisAksen(c);
  const lime = warna("--meti-lime");
  // foto: lingkaran berbingkai lime di depan cahaya; tanpa foto, inisial besar
  const R = 190;
  c.save(); c.shadowColor = lembut(lime, 0.55); c.shadowBlur = 50;
  c.fillStyle = lime; c.beginPath(); c.arc(CX, CY, R + 12, 0, Math.PI * 2); c.fill(); c.restore();
  c.save(); c.beginPath(); c.arc(CX, CY, R, 0, Math.PI * 2); c.clip();
  if (d.foto) {
    const s = Math.min(d.foto.width, d.foto.height), sx = (d.foto.width - s) / 2, sy = (d.foto.height - s) / 2;
    c.drawImage(d.foto, sx, sy, s, s, CX - R, CY - R, R * 2, R * 2);
  } else {
    const g = c.createLinearGradient(CX - R, CY - R, CX + R, CY + R);
    g.addColorStop(0, warna("--meti-teal")); g.addColorStop(1, warna("--meti-navy"));
    c.fillStyle = g; c.fillRect(CX - R, CY - R, R * 2, R * 2);
    huruf(c, 700, "0px", 150); c.fillStyle = PUTIH; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText((String(d.nama).match(/\p{L}/gu) || ["?"]).slice(0, 2).join("").toLocaleUpperCase(), CX, CY + 8);
    c.textAlign = "left"; c.textBaseline = "alphabetic";
  }
  c.restore();
  c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = 4; // kilau bingkai
  c.beginPath(); c.arc(CX, CY, R + 12, Math.PI * 1.1, Math.PI * 1.45); c.stroke();
  // lencana status
  const [lat, tek] = STATUS[d.status] || STATUS.tertunda;
  c.fillStyle = ambil(lat); kotak(c, CX - 170, 800, 340, 66, 33); c.fill();
  huruf(c, 700, "0px", 32); c.fillStyle = ambil(tek); c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(t("kta.kartu.status." + d.status), CX, 834); c.textAlign = "left"; c.textBaseline = "alphabetic";
  // kanan: merek
  const kx = PX + 64, kl = LEBAR - M - kx;
  kepalaMerek(c, d.logo, { kanan: t("kta.kartu.judul"), x: kx });
  // nama (maks dua baris), pil jenis, instansi
  let px = 76, baris;
  for (;;) { huruf(c, 700, "-1px", px); baris = bungkus(c, d.nama, kl); if (baris.length <= 2 || px <= 52) break; px -= 4; }
  baris = baris.slice(0, 2).map((b, i, a) => (i === a.length - 1 ? potong(c, b, kl) : b));
  c.fillStyle = PUTIH;
  let y = 340;
  for (const b of baris) { c.fillText(b, kx, y); y += px * 1.1; }
  huruf(c, 700, "0px", 34);
  const jt = labelJenis(d.jenis), jw = c.measureText(jt).width + 56;
  c.fillStyle = lime; kotak(c, kx, y - 18, jw, 62, 31); c.fill();
  c.fillStyle = gelap(); c.textBaseline = "middle"; c.fillText(jt, kx + 28, y + 14); c.textBaseline = "alphabetic";
  y += 100;
  if (d.instansi) { huruf(c, 400, "0px", 38); c.fillStyle = "rgba(255,255,255,.9)"; c.fillText(potong(c, d.instansi, kl), kx, y); }
  // nomor, berlaku, QR di pojok
  huruf(c, 400, "0px", 28); c.fillStyle = "rgba(255,255,255,.75)"; c.fillText(t("kta.kartu.nomor"), kx, 770);
  huruf(c, 700, "1px", 66); c.fillStyle = lime; c.fillText(d.nomor || "-", kx, 840);
  huruf(c, 400, "0px", 28); c.fillStyle = "rgba(255,255,255,.75)"; c.fillText(t("kta.kartu.berlaku"), kx, 905);
  huruf(c, 600, "0px", 42); c.fillStyle = PUTIH; c.fillText(tanggal(d.berlaku), kx, 955);
  gambarQr(c, d.qr, LEBAR - M - 270, 700, 270);
  c.restore();
}

/** Sisi belakang. d: { nomor, berlaku, logo, urlVerif }. */
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
  // pengesahan sekretariat sebagai teks (bukan tanda tangan gambar)
  c.fillStyle = lembut(gelap(), 0.78); c.fillRect(sx, 884, 380, 2);
  huruf(c, 600, "0px", 28); c.fillText(t("kta.belakang.sekretariat") + " METI", sx, 924);
  // tautan verifikasi
  if (d.urlVerif) { huruf(c, 600, "0px", 27); c.fillStyle = warna("--meti-navy"); c.fillText(potong(c, d.urlVerif, 820), M, 860); }
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
