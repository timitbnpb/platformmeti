#!/usr/bin/env node
// public/data/kalender.json -> public/kalender.ics (langganan iCalendar publik; hanya judul, tanggal, mitra, lokasi, sumber).
//   node scripts/pipa/kalender_ics.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BLN = { jan: 1, feb: 2, mar: 3, apr: 4, mei: 5, jun: 6, jul: 7, agu: 8, agt: 8, sep: 9, okt: 10, nov: 11, des: 12 };
const hari = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const d8 = (s) => s.replaceAll('-', '');
const esc = (x) => String(x).replace(/\\/g, '\\\\').replace(/[;,]/g, (m) => '\\' + m).replace(/\r?\n/g, '\\n');

/** Rentang hanya ada di judul ("COP31 Antalya 9-20 Nov"); sama dengan akhirDari() di public/kalender.js. */
export function akhirDari(b) {
  const m = /\b(\d{1,2})\s*-\s*(\d{1,2})\s+(jan|feb|mar|apr|mei|jun|jul|agu|agt|sep|okt|nov|des)\w*/i.exec(b.judul);
  if (!m || +m[1] !== +b.tanggal.slice(8) || +m[2] <= +m[1]) return b.tanggal;
  return BLN[m[3].toLowerCase()] === +b.tanggal.slice(5, 7) ? `${b.tanggal.slice(0, 7)}-${m[2].padStart(2, '0')}` : b.tanggal;
}

export function bangun(d) {
  const stamp = `${d8(d.dibangun_pada)}T000000Z`;
  const out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//METI//Direktori METI//ID', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Kalender METI', 'X-WR-TIMEZONE:Asia/Jakarta'];
  for (const b of d.baris) {
    const url = /^https?:\/\//i.test(b.sumber?.url || '') ? b.sumber.url : '';
    out.push('BEGIN:VEVENT', `UID:${b.id}@meti`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${d8(b.tanggal)}`, `DTEND;VALUE=DATE:${d8(iso(hari(akhirDari(b)) + 864e5))}`, `SUMMARY:${esc(b.judul)}`);
    if (b.mitra) out.push(`DESCRIPTION:${esc(b.mitra)}`);
    if (b.lokasi) out.push(`LOCATION:${esc(b.lokasi)}`);
    if (url) out.push(`URL:${url}`);
    out.push('END:VEVENT');
  }
  out.push('END:VCALENDAR');
  return out.join('\r\n') + '\r\n';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data/kalender.json'), 'utf8'));
  fs.writeFileSync(path.join(ROOT, 'public/kalender.ics'), bangun(d));
  console.log(`kalender.ics: ${d.baris.length} acara`);
}
