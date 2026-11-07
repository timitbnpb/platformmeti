// public/data/libur.json: hari libur nasional dan cuti bersama 2026 dan 2027 menurut SKB 3 Menteri (Menag, Menaker, MenPAN-RB).
//   node scripts/pipa/libur.mjs periksa              (jaringan, sopan: robots.txt, UA METI, jeda >= 2 dtk; memastikan kedua PDF SKB masih terunduh)
//   node scripts/pipa/libur.mjs bangun [tanggal]     (tanpa jaringan; tanggal_periksa = tanggal itu, bawaan hari ini)
// Kedua PDF adalah pindaian (tanpa lapisan teks), jadi lampiran A dan B ditranskripsi ke TABEL di bawah dari PDF-nya (dibaca 8 Nov 2026).
// Gerbang transkripsi: nama hari tiap baris dicocokkan dengan kalender; salah ketik tanggal ketahuan di uji (tests/libur.test.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ambil } from './_panen_sopan.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const SKB = {
  2026: { nomor: 'Nomor 1497 Tahun 2025, Nomor 2 Tahun 2025, Nomor 5 Tahun 2025', url: 'https://www.kemenkopmk.go.id/sites/default/files/pengumuman/2025-09/SKB%20Libur%20Nasional%20dan%20Cuti%20Bersama%20Tahun%202026.pdf' },
  2027: { nomor: 'Nomor 1205 Tahun 2026, Nomor 3 Tahun 2026, Nomor 2 Tahun 2026', url: 'https://www.kemenkopmk.go.id/sites/default/files/pengumuman/2026-09/SKB%20Libur%20Nasional%20dan%20Cuti%20Bersama%20Tahun%202027.pdf' },
};
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BLN = { Januari: 1, Februari: 2, Maret: 3, April: 4, Mei: 5, Juni: 6, Juli: 7, Agustus: 8, September: 9, Oktober: 10, November: 11, Desember: 12 };
// [jenis, "tanggal(-tanggal | , tanggal)" , bulan, hari menurut SKB, keterangan menurut SKB, label sel]; jenis: N libur nasional, C cuti bersama
const TABEL = {
  2026: [
    ['N', '1', 'Januari', 'Kamis', 'Tahun Baru 2026 Masehi', 'Tahun Baru'], ['N', '16', 'Januari', 'Jumat', 'Isra Mikraj Nabi Muhammad S.A.W.', 'Isra Mikraj'],
    ['N', '17', 'Februari', 'Selasa', 'Tahun Baru Imlek 2577 Kongzili', 'Imlek'], ['N', '19', 'Maret', 'Kamis', 'Hari Suci Nyepi (Tahun Baru Saka 1948)', 'Nyepi'],
    ['N', '21-22', 'Maret', 'Sabtu-Minggu', 'Idul Fitri 1447 Hijriah', 'Idul Fitri'], ['N', '3', 'April', 'Jumat', 'Wafat Yesus Kristus', 'Wafat Yesus'],
    ['N', '5', 'April', 'Minggu', 'Kebangkitan Yesus Kristus (Paskah)', 'Paskah'], ['N', '1', 'Mei', 'Jumat', 'Hari Buruh Internasional', 'Hari Buruh'],
    ['N', '14', 'Mei', 'Kamis', 'Kenaikan Yesus Kristus', 'Kenaikan Yesus'], ['N', '27', 'Mei', 'Rabu', 'Idul Adha 1447 Hijriah', 'Idul Adha'],
    ['N', '31', 'Mei', 'Minggu', 'Hari Raya Waisak 2570 BE', 'Waisak'], ['N', '1', 'Juni', 'Senin', 'Hari Lahir Pancasila', 'Pancasila'],
    ['N', '16', 'Juni', 'Selasa', '1 Muharam Tahun Baru Islam 1448 Hijriah', '1 Muharam'], ['N', '17', 'Agustus', 'Senin', 'Proklamasi Kemerdekaan', 'Kemerdekaan'],
    ['N', '25', 'Agustus', 'Selasa', 'Maulid Nabi Muhammad S.A.W.', 'Maulid Nabi'], ['N', '25', 'Desember', 'Jumat', 'Kelahiran Yesus Kristus', 'Natal'],
    ['C', '16', 'Februari', 'Senin', 'Tahun Baru Imlek 2577 Kongzili', 'Cuti Imlek'], ['C', '18', 'Maret', 'Rabu', 'Hari Suci Nyepi (Tahun Baru Saka 1948)', 'Cuti Nyepi'],
    ['C', '20,23,24', 'Maret', 'Jumat,Senin,Selasa', 'Idul Fitri 1447 Hijriah', 'Cuti Idul Fitri'], ['C', '15', 'Mei', 'Jumat', 'Kenaikan Yesus Kristus', 'Cuti Kenaikan'],
    ['C', '28', 'Mei', 'Kamis', 'Idul Adha 1447 Hijriah', 'Cuti Idul Adha'], ['C', '24', 'Desember', 'Kamis', 'Kelahiran Yesus Kristus', 'Cuti Natal'],
  ],
  2027: [
    ['N', '1', 'Januari', 'Jumat', 'Tahun Baru 2027 Masehi', 'Tahun Baru'], ['N', '5', 'Januari', 'Selasa', 'Isra Mikraj Nabi Muhammad S.A.W. 1448 Hijriah', 'Isra Mikraj'],
    ['N', '6', 'Februari', 'Sabtu', 'Tahun Baru Imlek 2578 Kongzili', 'Imlek'], ['N', '8', 'Maret', 'Senin', 'Hari Suci Nyepi (Tahun Baru Saka 1949)', 'Nyepi'],
    ['N', '10-11', 'Maret', 'Rabu-Kamis', 'Idul Fitri 1448 Hijriah', 'Idul Fitri'], ['N', '26', 'Maret', 'Jumat', 'Wafat Yesus Kristus', 'Wafat Yesus'],
    ['N', '28', 'Maret', 'Minggu', 'Kebangkitan Yesus Kristus (Paskah)', 'Paskah'], ['N', '1', 'Mei', 'Sabtu', 'Hari Buruh Internasional', 'Hari Buruh'],
    ['N', '6', 'Mei', 'Kamis', 'Kenaikan Yesus Kristus', 'Kenaikan Yesus'], ['N', '17', 'Mei', 'Senin', 'Idul Adha 1448 Hijriah', 'Idul Adha'],
    ['N', '20', 'Mei', 'Kamis', 'Hari Raya Waisak 2571 BE', 'Waisak'], ['N', '1', 'Juni', 'Selasa', 'Hari Lahir Pancasila', 'Pancasila'],
    ['N', '6', 'Juni', 'Minggu', '1 Muharam Tahun Baru Islam 1449 Hijriah', '1 Muharam'], ['N', '15', 'Agustus', 'Minggu', 'Maulid Nabi Muhammad S.A.W.', 'Maulid Nabi'],
    ['N', '17', 'Agustus', 'Selasa', 'Proklamasi Kemerdekaan', 'Kemerdekaan'], ['N', '25', 'Desember', 'Sabtu', 'Kelahiran Yesus Kristus', 'Natal'],
    ['N', '26', 'Desember', 'Minggu', 'Isra Mikraj Nabi Muhammad S.A.W. 1449 Hijriah', 'Isra Mikraj'],
    ['C', '5', 'Februari', 'Jumat', 'Tahun Baru Imlek 2578 Kongzili', 'Cuti Imlek'], ['C', '9,12,15', 'Maret', 'Selasa,Jumat,Senin', 'Idul Fitri 1448 Hijriah', 'Cuti Idul Fitri'],
    ['C', '25', 'Maret', 'Kamis', 'Wafat Yesus Kristus', 'Cuti Wafat Yesus'], ['C', '18', 'Mei', 'Selasa', 'Idul Adha 1448 Hijriah', 'Cuti Idul Adha'],
    ['C', '19', 'Mei', 'Rabu', 'Hari Raya Waisak 2571 BE', 'Cuti Waisak'], ['C', '24', 'Desember', 'Jumat', 'Kelahiran Yesus Kristus', 'Cuti Natal'],
  ],
};

const hariDari = (iso) => HARI[new Date(iso + 'T00:00:00Z').getUTCDay()];
/** Pecah "21-22" / "20,23,24" jadi daftar tanggal ISO; hari yang tertulis di SKB dicocokkan dengan kalender. */
export function urai(tahun, [jenis, tgl, bulan, hari, nama, singkat]) {
  const hr = tgl.includes('-') ? (([a, b]) => Array.from({ length: +b - +a + 1 }, (_, i) => +a + i))(tgl.split('-')) : tgl.split(',').map(Number);
  const hs = hari.split(/[-,]/);
  return hr.map((d, i) => {
    const iso = `${tahun}-${String(BLN[bulan]).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (hariDari(iso) !== hs[i]) throw new Error(`${iso}: SKB menulis ${hs[i]}, kalender ${hariDari(iso)} (${nama})`);
    return { tanggal: iso, nama, singkat, jenis: jenis === 'N' ? 'libur_nasional' : 'cuti_bersama', sumber_url: SKB[tahun].url };
  });
}
export function bangun(tglPeriksa) {
  const baris = Object.entries(TABEL).flatMap(([th, rs]) => rs.flatMap((r) => urai(+th, r))).map((b) => ({ ...b, tanggal_periksa: tglPeriksa })).sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.jenis.localeCompare(b.jenis));
  return {
    meta: { judul: 'Hari libur nasional dan cuti bersama 2026 dan 2027', penerbit: 'Menteri Agama, Menteri Ketenagakerjaan, dan MenPAN-RB (SKB 3 Menteri), diumumkan di kemenkopmk.go.id', tanggal_periksa: tglPeriksa,
      catatan: 'Transkripsi dari PDF SKB (pindaian). Tanggal 1 Ramadan, Idul Fitri, dan Idul Adha 1448 H ditetapkan tersendiri oleh Menteri Agama (Diktum KEDUA SKB 2027); periksa ulang bila ada SKB perubahan.',
      skb: Object.fromEntries(Object.entries(SKB).map(([th, s]) => [th, { nomor: s.nomor, url: s.url }])) },
    baris,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [aksi, arg] = process.argv.slice(2);
  if (aksi === 'periksa') {
    for (const [th, s] of Object.entries(SKB)) { const b = await ambil(s.url, { buf: true }); console.log(th, b.length, 'byte', b.subarray(0, 5).toString() === '%PDF-' ? 'PDF' : 'BUKAN PDF'); }
  } else if (aksi === 'bangun') {
    const tgl = arg || new Date().toISOString().slice(0, 10);
    const j = bangun(tgl);
    fs.writeFileSync(path.join(ROOT, 'public/data/libur.json'), JSON.stringify(j, null, 1) + '\n');
    console.log('libur.json:', j.baris.length, 'baris');
  } else { console.error('pakai: periksa | bangun [tanggal]'); process.exit(2); }
}
