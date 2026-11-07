// Adapter Perda RUED provinsi: KANDIDAT target kapasitas per teknologi (MW) dari kalimat/tabel yang menyebut sasaran. Angka persentase bauran tetap di scripts/pipa/rued.mjs (ditulis tangan dari kutipan).
// Heuristik: baris bermuatan "<angka> MW/GW" + nama teknologi + kata sasaran; baris potensi/eksisting dibuang. SEMUA baris perlu_tinjau (bukan target resmi sampai dibaca manusia).
import fs from 'node:fs';
import path from 'node:path';
import { AKAR } from '../_panen_umum.mjs';
import { angkaId } from '../ekstrak_pdf.mjs';

const TEK = [['surya', /PLTS|surya|solar|fotovoltaik/i], ['bayu', /PLTB\b|bayu|angin/i], ['hidro', /PLTA|PLTM|PLTMH|hidro|mikrohidro|minihidro/i], ['panas-bumi', /PLTP|panas ?bumi|geotermal/i], ['bioenergi', /PLTBm|PLTBg|PLTSa|biomassa|biogas|bioenergi|sampah/i]];
const SASARAN = /target|sasaran|ditargetkan|paling sedikit|minimal|minimum|dikembangkan|dibangun|ditingkatkan|mencapai|diproyeksikan|rencana/i;
const BUANG = /potensi|sumber daya|cadangan|terpasang saat|saat ini|eksisting|existing|kondisi|PLTU|PLTGU|PLTG\b|PLTD|PLTMG|batubara|batu bara|diesel|\bgas\b/i;
const MW = /(\d[\d.,]*)\s*(MWp|MW|GW)\b/gi;

/** Teks satu halaman -> kandidat [{teknologi, mw, tahun, kutipan}]; konteks = baris + baris sebelumnya (kalimat patah). */
export function kandidatDariHalaman(teks) {
  const baris = String(teks).split('\n').map((g) => g.replace(/\s+/g, ' ').trim()), keluar = [];
  baris.forEach((g, i) => {
    const konteks = ((baris[i - 1] || '') + ' ' + g).trim();
    for (const m of g.matchAll(MW)) {
      const tek = TEK.find(([, re]) => re.test(g)) || (/PLT|tenaga|energi/i.test(g) ? null : TEK.find(([, re]) => re.test(baris[i - 1] || ''))); // teknologi dari baris yang sama; baris sebelumnya hanya bila baris ini tak menyebut pembangkit
      if (!tek || !SASARAN.test(konteks) || BUANG.test(g)) continue;
      let v = angkaId(m[1]); if (!Number.isFinite(v)) v = Number(m[1].replace(',', '.'));
      if (!Number.isFinite(v) || v <= 0) continue;
      if (/^GW$/i.test(m[2])) v *= 1000;
      const th = /\b(20[2-5]\d)\b/.exec(g.slice(m.index + m[0].length, m.index + m[0].length + 45)) || /\b(20[2-5]\d)\b/.exec(g) || /\b(20[2-5]\d)\b/.exec(konteks); // tahun terdekat sesudah angka
      keluar.push({ teknologi: tek[0], mw: v, tahun: th ? Number(th[1]) : null, kutipan: g.slice(0, 220) });
    }
  });
  return keluar;
}

const rued = JSON.parse(fs.readFileSync(path.join(AKAR, 'public/data/rued.json'), 'utf-8')).baris.filter((b) => b.perda_id && b.url_pdf);
const berkas = rued.map((b) => 'rued-' + b.perda_id + '.pdf');

export default {
  id: 'rued-target-kapasitas', judul: 'Perda RUED provinsi: kandidat target kapasitas EBT (MW) per teknologi', penerbit: 'Pemerintah provinsi (Perda RUED), peraturan.bpk.go.id', tanggal_dokumen: '2025-03-01', versi: 'Perda RUED 2019-2025 (' + rued.length + ' provinsi)',
  sumber_url: 'https://peraturan.bpk.go.id/', unduh_url: rued.map((b) => b.url_pdf), berkas,
  catatan: 'Kandidat otomatis: kalimat yang menyebut sasaran MW per teknologi. Semua perlu tinjau; tautan hlm membuka PDF Perda di peraturan.bpk.go.id. Tanggal dokumen = pengambilan; tiap Perda punya tanggal sendiri (kolom perda).',
  ekstrak(semua) {
    const baris = [];
    rued.forEach((b, i) => {
      semua[i].forEach((teks, h) => {
        const lihat = new Set();
        for (const c of kandidatDariHalaman(teks)) {
          const kunci = c.teknologi + c.mw + c.tahun; if (lihat.has(kunci)) continue; lihat.add(kunci);
          baris.push({ kode: b.kode, provinsi: b.provinsi, perda: b.perda, teknologi: c.teknologi, mw: c.mw, tahun: c.tahun, kutipan: c.kutipan, sumber_url: b.url_pdf, halaman: h + 1, perlu_tinjau: true });
        }
      });
    });
    return [{ id: 'kandidat-mw', judul: 'Kandidat target kapasitas per teknologi', satuan: 'MW', kolom: [{ k: 'provinsi', label: 'Provinsi', tipe: 'teks' }, { k: 'perda', label: 'Perda', tipe: 'teks' }, { k: 'teknologi', label: 'Teknologi', tipe: 'teks' }, { k: 'mw', label: 'MW', tipe: 'angka' }, { k: 'tahun', label: 'Tahun', tipe: 'teks' }, { k: 'kode', label: 'Kode', tipe: 'teks' }], baris }];
  },
};
