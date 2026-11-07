/* Pembantu bersama modul Event, Foto, Video, Podcast: data acara, tanggal, poster, tag topik, bagikan, kalender, QR. Teks selalu dari kamus (t). */
import { t, tanggal } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { muat, label, urlAman } from "/publik.js";

export const BUKAN_ACARA = new Set(["regulasi", "tenggat"]);
export const JENIS_ACARA = ["seminar", "konferensi", "audiensi", "lokakarya"];
export const IKON_JENIS = { seminar: "video", konferensi: "orang", audiensi: "perisai", lokakarya: "metode" };
const BLN = { jan: 1, feb: 2, mar: 3, apr: 4, mei: 5, jun: 6, jul: 7, agu: 8, agt: 8, sep: 9, okt: 10, nov: 11, des: 12 };
export const utc = (s) => { const [y, m, h] = s.split("-").map(Number); return Date.UTC(y, m - 1, h); };
export const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
export const hariIni = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10); // WIB
export const hariKe = (s) => (new Date(utc(s)).getUTCDay() + 6) % 7; // 0 = Senin
export const namaBulan = (ym) => tanggal(ym + "-01", { gaya: "panjang" }).split(" ").slice(1, -1).join(" ");
export const geserBulan = (ym, n) => { const [y, m] = ym.split("-").map(Number); return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7); };
export const urlEvent = (b) => `/event/${encodeURIComponent(b.slug)}`;
export const urlMutlak = (b) => location.origin + urlEvent(b);

/** Rentang hanya ada di judul ("2-4 Sep"); sama dengan akhirDari() di kalender.js. */
export function akhirDari(b) {
  const m = /\b(\d{1,2})\s*-\s*(\d{1,2})\s+(jan|feb|mar|apr|mei|jun|jul|agu|agt|sep|okt|nov|des)\w*/i.exec(b.judul);
  if (!m || +m[1] !== +b.tanggal.slice(8) || +m[2] <= +m[1]) return b.tanggal;
  return BLN[m[3].toLowerCase()] === +b.tanggal.slice(5, 7) ? `${b.tanggal.slice(0, 7)}-${m[2].padStart(2, "0")}` : b.tanggal;
}
/** Judul tampil: buang lokasi/tanggal di ekor judul arsip ("IndoEBTKE ConEx ke-12, JIEXPO, 2-4 Sep"). */
export const judulBersih = (b) => (b.slug === "indoebtke-conex-2026" ? "The 12th IndoEBTKE ConEx 2026" : b.judul.replace(/,\s*\d{1,2}\s*-\s*\d{1,2}\s+\w+$/, ""));

let cache = null;
/** Semua acara (bukan regulasi/tenggat) berurut tanggal naik, dengan `akhir`. */
export function muatAcara() {
  return (cache ||= muat("kalender").then((d) => d.baris.filter((b) => !BUKAN_ACARA.has(b.jenis) && b.slug).map((b) => ({ ...b, akhir: akhirDari(b), judulTampil: judulBersih(b) })).sort((a, c) => a.tanggal.localeCompare(c.tanggal)))).catch((e) => { cache = null; throw e; });
}
export const mendatang = (rows, kini = hariIni()) => rows.filter((b) => b.akhir >= kini);
export const lalu = (rows, kini = hariIni()) => rows.filter((b) => b.akhir < kini).reverse();
export const selesai = (b, kini = hariIni()) => b.akhir < kini;
export const lokasiTeks = (b) => (b.lokasi && typeof b.lokasi === "object" ? [b.lokasi.tempat, b.lokasi.kota].filter(Boolean).join(", ") : b.lokasi || "");
export const jamTeks = (b) => b.jam || "";
export const tglRentang = (b) => (b.akhir > b.tanggal ? `${tanggal(b.tanggal)} - ${tanggal(b.akhir)}` : tanggal(b.tanggal));

/* ---------- poster ---------- */
export const posterHtml = (b, kelas = "") => (b.poster
  ? `<img class="ev-poster ${kelas}" src="${esc(b.poster.file)}" alt="" loading="lazy" decoding="async">`
  : `<span class="ev-poster ev-ph ev-g-${esc(b.jenis)} ${kelas}">${ikon(IKON_JENIS[b.jenis] || "kalender", 40)}<b>${esc(b.judulTampil.split(/[\s:,]+/).filter(Boolean).slice(0, 3).join(" "))}</b></span>`);
export const pilJenis = (j) => `<span class="ev-pil ev-t-${esc(j)}">${esc(label("kal.jenis.", j))}</span>`;
export const pilStatus = (b) => (selesai(b) ? `<span class="ev-pil ev-selesai">${ikon("centang", 14)}${esc(t("ev.selesai"))}</span>` : "");

/* ---------- tag topik (juga dipakai Video) ---------- */
export const TOPIK = [
  ["surya", /surya|plts|solar|photovoltaic/i, "tek-surya"], ["panas", /panas bumi|geotherm|pltp/i, "tek-panas"], ["bio", /bioenergi|biomass|biomassa|biofuel|sampah|waste/i, "tek-bio"],
  ["hidro", /hidro|hydro|plta|bendungan/i, "tek-listrik"], ["bayu", /bayu|angin|wind/i, "tek-listrik"], ["hidrogen", /hidrogen|hydrogen/i, "tek-listrik"],
  ["regulasi", /ruu|undang|regulasi|kebijakan|policy|perpres|audiensi|rdpu/i, "regulasi"], ["karbon", /karbon|carbon|iklim|cop\d|climate|net.?zero/i, "analisis"],
  ["listrik", /listrik|ketenagalistrikan|pln|electric|grid|jaringan/i, "tek-listrik"], ["investasi", /investasi|investment|pembiayaan|financ/i, "proyek"],
];
export const topikDari = (teks) => TOPIK.filter(([, re]) => re.test(teks)).map(([k]) => k);
export const tagHtml = (k, ik) => `<span class="ev-tag">${ikon(ik || (TOPIK.find((x) => x[0] === k) || [])[2] || "topik", 14)}${esc(t("ev.topik." + k))}</span>`;

/* ---------- tautan: bagikan, kalender ---------- */
export function tautanBagikan(url, judul) {
  const u = encodeURIComponent(url), j = encodeURIComponent(judul);
  return [
    ["whatsapp", "ev.bagi.wa", `https://wa.me/?text=${j}%20${u}`], ["linkedin", "ev.bagi.linkedin", `https://www.linkedin.com/sharing/share-offsite/?url=${u}`],
    ["x", "ev.bagi.x", `https://twitter.com/intent/tweet?text=${j}&url=${u}`], ["facebook", "ev.bagi.facebook", `https://www.facebook.com/sharer/sharer.php?u=${u}`],
    ["surel", "ev.bagi.surel", `mailto:?subject=${j}&body=${u}`],
  ];
}
export const bagikanHtml = (url, judul) => `<div class="ev-bagi" role="group" aria-label="${esc(t("ev.bagikan"))}">${tautanBagikan(url, judul).map(([ik, k, h]) =>
  `<a class="ev-bulat" href="${esc(h)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(t(k))}" title="${esc(t(k))}">${ikon(ik, 18)}</a>`).join("")}<button type="button" class="ev-bulat" data-salin="${esc(url)}" aria-label="${esc(t("ev.salin"))}" title="${esc(t("ev.salin"))}">${ikon("salin", 18)}</button></div>`;
/** Salin tautan (delegasi klik): umpan balik lewat title/aria-label sementara. */
export function pasangSalin(akar = document) {
  akar.addEventListener("click", (e) => {
    const b = e.target.closest("[data-salin]");
    if (!b || !navigator.clipboard) return;
    navigator.clipboard.writeText(b.dataset.salin).then(() => {
      const lama = b.getAttribute("aria-label"), baru = t("ev.disalin");
      b.setAttribute("aria-label", baru); b.title = baru; b.classList.add("ev-ok");
      setTimeout(() => { b.setAttribute("aria-label", lama); b.title = lama; b.classList.remove("ev-ok"); }, 1600);
    }, () => {});
  });
}
const d8 = (s) => s.replaceAll("-", "");
export const gcalUrl = (b) => `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(b.judulTampil)}&dates=${d8(b.tanggal)}/${d8(iso(utc(b.akhir) + 864e5))}&details=${encodeURIComponent([b.deskripsi, urlMutlak(b)].filter(Boolean).join("\n\n"))}&location=${encodeURIComponent(lokasiTeks(b))}`;
export function unduhIcs(b) {
  const e = (x) => String(x).replace(/\\/g, "\\\\").replace(/[;,]/g, (m) => "\\" + m).replace(/\r?\n/g, "\\n");
  const baris = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//METI//Direktori METI//ID", "BEGIN:VEVENT", `UID:${b.slug}@meti`, `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d+/g, "")}`,
    `DTSTART;VALUE=DATE:${d8(b.tanggal)}`, `DTEND;VALUE=DATE:${d8(iso(utc(b.akhir) + 864e5))}`, `SUMMARY:${e(b.judulTampil)}`, lokasiTeks(b) && `LOCATION:${e(lokasiTeks(b))}`, `URL:${urlMutlak(b)}`, "END:VEVENT", "END:VCALENDAR"].filter(Boolean);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([baris.join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" })); a.download = `meti-${b.slug}.ics`;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ---------- QR (qrcode-generator 1.4.4, MIT, di-vendor) ---------- */
export async function qrSvg(teks) {
  const qr = (await import("/vendor/qrcode/qrcode.mjs")).default(0, "M");
  qr.addData(teks); qr.make();
  const n = qr.getModuleCount(), m = 2;
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
  return `<svg class="ev-qr-svg" viewBox="0 0 ${n + 2 * m} ${n + 2 * m}" role="img" aria-label="${esc(t("ev.qr"))}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#0b3d31"/></svg>`;
}

/* ---------- logo mitra: cocokkan nama ke mitra-meti.json ---------- */
const kecil = (s) => String(s).toLowerCase().replace(/\([^)]*\)/g, "").replace(/\bpt\b/g, "").trim();
export async function logoMitra(nama) {
  if (/^meti$/i.test(nama)) return "/img/logo-meti-tanda.png";
  try {
    const d = await muat("mitra-meti"), n = kecil(nama.replace(/\s*\(.*$/, ""));
    const m = n.length > 2 && (d.mitra || []).find((x) => { const k = kecil(x.nama); return k === n || k.includes(n) || n.includes(k); });
    return m ? m.logo : "";
  } catch { return ""; }
}
export const mitraHtml = (nama, logo) => `<li class="ev-mitra">${logo ? `<img src="${esc(logo)}" alt="" loading="lazy" decoding="async">` : `<span class="ev-mitra-in" aria-hidden="true">${esc(nama.replace(/[^A-Za-z]/g, "").slice(0, 2))}</span>`}<span>${esc(nama)}</span></li>`;

export const unggahAman = urlAman;
