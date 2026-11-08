// Penguraian PDF lokal (RUPTL PLN 2025-2034) untuk riset potensi: waduk PLTS terapung (Tabel 2.2) dan permintaan baru (Lampiran E).
// PDF sudah diunduh oleh panen RUPTL (data-panen/pdf, git-ignored). Tanpa jaringan. Pakai: node scripts/panen/riset_potensi.mjs --selftest
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const URL_RUPTL = 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/b967d-ruptl-pln-2025-2034-pub-.pdf';
export const teksRuptl = () => execFileSync('pdftotext', ['-layout', path.join(AKAR, 'data-panen/pdf/ruptl-2025-2034.pdf'), '-'], { encoding: 'utf-8', maxBuffer: 1 << 28 });

const angka = (t) => Number(t.replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));

// RUPTL Tabel 2.2 "Daftar Potensi PLTS pada Bendungan Kementerian PU": No, Nama, Status, Luas (Ha), 20% MW, Provinsi.
export function urai_waduk(teks) {
  const mulai = teks.lastIndexOf('Tabel 2.2 Daftar Potensi PLTS pada Bendungan');
  const akhir = teks.indexOf('Tabel 2.3', mulai);
  const out = [];
  const L = teks.slice(mulai, akhir > 0 ? akhir : mulai + 12000).split('\n');
  L.forEach((l, i) => {
    const m = l.match(/^\s*(\d{1,3})\s+(.*?)\s*(Eksisting|Selesai|On Going|Baru)\s+([\d.]+)\s+([\d.,]+)\s+(\D.*?)\s*$/);
    if (!m) return;
    // nama bisa terpecah ke baris di atas/bawah (mis. "Karang" / "Kates/Sutami")
    const nama = m[2].trim() || `${L[i - 1].trim()} ${L[i + 1].trim()}`.trim();
    out.push({ no: +m[1], nama, status_bendungan: m[3], luas_ha: angka(m[4]), mw_20persen: angka(m[5]), provinsi: m[6].trim() });
  });
  return out;
}

// RUPTL Lampiran E.1 (Sumatera-Kalimantan) dan E.2 (Jawa-Madura-Bali): butir diawali baris "No  Kategori  Provinsi  [Skenario]  Nama  Kebutuhan ...";
// kolom diiris per posisi karakter baris pertama. E.3 (Sulawesi-Maluku-Papua-Nusra) bertata letak tengah-vertikal: TIDAK diurai (dicatat sebagai celah).
const KAT = ['Data Center', 'Smelter', 'Industri', 'KI', 'KEK', 'SKPT', 'Pertambang', 'Migas', 'Tambang', 'Semen', 'Transportasi', 'Pelabuhan', 'DPP', 'Kawasan'];
const rapat = (a) => a.join(' ').replace(/\s+/g, ' ').trim();
export function urai_lampiran_e(teks) {
  const i1 = teks.lastIndexOf('LAMPIRAN E.1'); const i3 = teks.lastIndexOf('LAMPIRAN E.3');
  const L = teks.slice(i1, i3).split('\n').map((x) => x.replace(/\f/g, ''));
  const out = []; let regional = 'sumatera-kalimantan'; let blk = null;
  const tutup = () => {
    if (!blk) return; const { l0, B } = blk; blk = null;
    const seg = []; l0.replace(/\S+(?: \S+)*/g, (m, o) => { seg.push([o, m]); return m; });
    const kb = l0.indexOf('Kebutuhan'); const iKb = seg.findIndex(([o]) => o === kb); if (iKb < 0) return;
    const nomor = seg[0][1]; const kat = seg[1][1]; const katBaku = KAT.find((k) => kat.startsWith(k)); if (!katBaku) return;
    const sk = seg.findIndex(([, m]) => /^(Reguler|Optimis|Pesimis|Tinggi|Rendah|Moderat)/.test(m));
    const iP = seg[2][0]; const iN = sk >= 0 ? seg[sk + 1][0] : seg[3][0]; const iPe = sk >= 0 ? seg[sk][0] : iN;
    const iDe = seg[iKb + 1] ? seg[iKb + 1][0] : kb + 16;
    const baris = { no: +nomor, regional, kategori: katBaku === 'Pertambang' ? 'Pertambangan' : katBaku, provinsi: rapat(B.map((x) => x.slice(iP, iPe))), nama: rapat(B.map((x) => x.slice(iN, kb))) };
    const dm = rapat(B.map((x) => x.slice(kb, iDe)));
    const mva = [...dm.matchAll(/([\d.]+(?:,\d+)?)\s*MVA/g)].map((m) => angka(m[1]));
    const thn = [...dm.matchAll(/\b(20\d\d)\b/g)].map((m) => +m[1]);
    const brt = /dari\s*([\d.]+(?:,\d+)?)\s*MVA/.exec(dm) && /sampai/.test(dm);
    const m1 = /dari\s*([\d.]+(?:,\d+)?)\s*(?:MVA)?\s*(?:di\s*)?(?:ditahun|tahun)/.exec(dm);
    if (!mva.length && !m1) return;
    if (brt || m1) {
      const awal = angka((/dari\s*([\d.]+(?:,\d+)?)/.exec(dm) || [])[1] || 'NaN'); const akhir = angka((/sampai\s*dengan\s*([\d.]+(?:,\d+)?)/.exec(dm) || [])[1] || 'NaN');
      if (Number.isFinite(awal)) baris.mva_awal = awal; if (Number.isFinite(akhir)) baris.mva_akhir = akhir;
      if (thn.length >= 2) { baris.tahun_awal = thn[0]; baris.tahun_akhir = thn[thn.length - 1]; } else if (thn.length === 1) baris.tahun_akhir = thn[0];
    } else { baris.mva_akhir = mva[mva.length - 1]; if (thn.length) baris.tahun_akhir = thn[thn.length - 1]; }
    if (baris.mva_akhir == null && baris.mva_awal == null) return;
    out.push(baris);
  };
  for (const l of L) {
    if (/LAMPIRAN E\.2/.test(l)) { tutup(); regional = 'jawa-madura-bali'; }
    if (/^\s*\d{1,3}\s{2,}\S/.test(l) && /Kebutuhan/.test(l) && KAT.some((k) => new RegExp('^\\s*\\d{1,3}\\s+' + k).test(l))) { tutup(); blk = { l0: l, B: [l] }; continue; }
    if (blk) { if (/^\s*E-\d+\s*$/.test(l) || /Kategori|Skenario|Perkiraan/.test(l)) { tutup(); continue; } blk.B.push(l); }
  }
  tutup();
  return out;
}

// BPS, Statistik Kelapa Sawit Indonesia 2023 (terbit 29 Nov 2024), Tabel 3.3.2: luas areal (ha) dan produksi CPO (ton) 2023 per provinsi, jumlah semua status.
// Diketik dari PDF unduhan resmi (webapi.bps.go.id); baris berlatar watermark dibaca manual. Jumlah nasional 15.928.712 ha / 47.084.299 ton jadi uji silang.
export const SAWIT_2023 = {
  11: [471357, 1056529], 12: [1352225, 5006543], 13: [440276, 1369851], 14: [3401607, 9222465], 15: [952150, 2214159],
  16: [1241090, 4130197], 17: [418428, 1316220], 18: [197455, 461900], 19: [255717, 890583], 21: [7726, 20306],
  32: [15180, 44425], 36: [18527, 35276], 61: [2133412, 5200745], 62: [2171000, 8466673], 63: [470736, 1329100],
  64: [1490950, 3853054], 65: [237706, 618477], 72: [140859, 400555], 73: [54710, 132952], 74: [61790, 75283],
  75: [12566, 27446], 76: [147272, 374839], 81: [10195, 20920], 82: [5555, 24461], 92: [75985, 89501], 91: [144236, 701842],
};
export const SAWIT_NASIONAL_2023 = { luas_ha: 15928712, cpo_ton: 47084299 };

if (process.argv[2] === '--selftest') {
  assert.deepEqual(urai_waduk('Tabel 2.2 Daftar Potensi PLTS pada Bendungan\n 1    Jatiluhur/Djuanda   Eksisting      8.130     1626      Jawa Barat\n Tabel 2.3'), [{ no: 1, nama: 'Jatiluhur/Djuanda', status_bendungan: 'Eksisting', luas_ha: 8130, mw_20persen: 1626, provinsi: 'Jawa Barat' }]);
  assert.equal(Object.values(SAWIT_2023).reduce((a, [, t]) => a + t, 0) > 47e6 - 1e3, true);
  console.log('selftest ok');
} else if (process.argv[2] === '--cek') {
  const t = teksRuptl();
  console.log('waduk', urai_waduk(t).length, 'lampiran E', urai_lampiran_e(t).length);
}
