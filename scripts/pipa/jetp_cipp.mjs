// public/data/jetp_cipp.json: portofolio proyek/program JETP Indonesia dari jetp-id.org (halaman publik). Daftar proyek CIPP 2023 sendiri belum terbaca (lihat meta.celah).
//   node scripts/pipa/jetp_cipp.mjs ambil <dirMentah>          (jaringan; jeda >= 2 dtk; hanya tautan yang dimuat halaman portofolio)
//   node scripts/pipa/jetp_cipp.mjs bangun <dirMentah> <tgl>   (tanpa jaringan)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ambil } from './_panen_sopan.mjs';
import { muat, indeksProyek, cocokProyek, provinsi } from './_cocok.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SUMBER = [
  { id: 's-jetp-portofolio', lisensi: 'Publikasi Sekretariat JETP; hanya fakta dan angka dengan atribusi', judul: 'JETP Indonesia Portfolio Dashboard (proyek dan program)', penerbit: 'Sekretariat JETP Indonesia', tahun: 2026, url: 'https://jetp-id.org/portfolio-sub/index', tingkat_bukti: 'resmi' },
  { id: 's-jetp-cipp', lisensi: 'Publikasi Sekretariat JETP; hanya fakta dan angka dengan atribusi', judul: 'JETP Indonesia CIPP 2023 (laporan penuh, ringkasan eksekutif)', penerbit: 'Sekretariat JETP Indonesia', tahun: 2023, url: 'https://jetp-id.org/cipp', tingkat_bukti: 'resmi' } ];
export const teks = (h) => h.replace(/<script.*?<\/script>|<style.*?<\/style>/gs, '').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#0?39;|&#8217;/g, "'").split('\n').map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
export function uraiLokasi(html) { // array "locations" yang disematkan di halaman portofolio
  const m = html.match(/locations\s*=\s*(\[.*?\]);/s); return m ? JSON.parse(m[1]) : [];
}
export function uraiRingkasan(html) { // pasangan label -> angka pada kartu dasbor
  const t = teks(html); const nilai = (label) => { const i = t.findIndex((x) => x.startsWith(label)); const v = i >= 0 ? t.slice(i + 1, i + 4).find((x) => /^[\d.,]+$/.test(x)) : null; return v ? Number(v.replace(/,/g, '')) : null; };
  return { energi_terbarukan_didukung_mw: nilai('Renewable Energy supported by JETP'), potensi_penurunan_ghg_tco2e: nilai('Potential GHG Emissions Reduction') };
}
export function uraiDetailProyek(html) {
  const t = teks(html); const after = (lbl, n = 3) => { const i = t.findIndex((x) => x.startsWith(lbl)); return i >= 0 ? t.slice(i + 1, i + 1 + n) : []; };
  const usd = (a) => { const v = a.find((x) => /^[\d,]{5,}$/.test(x)); return v ? Number(v.replace(/,/g, '')) : null; };
  const i = t.findIndex((x) => /^Modality [A-Z]$/.test(x)); const ket = i >= 0 ? t.slice(i + 1, i + 4) : []; // jenis, sumber, perantara
  return { ifa: after('Investment Focus Area')[0] ?? null, pengembang: t[t.findIndex((x) => x === 'General') + 2] ?? null, provinsi_resmi: after('Provinces')[0] ?? null, kota: after('City/District')[0] ?? null, jenis_pembiayaan: ket[0] ?? null, sumber_dana: ket[1] ?? null, perantara: ket[2] ?? null, pembiayaan_jetp_usd: usd(after('Total JETP Financing Approved for This Project', 3)), kapasitas_mw: usd2(after('Total Installed Capacity', 3)), ghg_tco2e: usd(after('Potential for GHG Emission Reduction', 2)) };
}
const usd2 = (a) => { const v = a.find((x) => /^\d+(\.\d+)?$/.test(x)); return v ? Number(v) : null; };
const EBT = /geothermal|solar|hydro|wind|biomass|biogas|panas bumi/i;
export function bangunData(portofolio, saguling, ikiflex, tgl, proyek, keuangan) {
  const ip = indeksProyek(proyek); const baris = []; const L = uraiLokasi(portofolio); const rk = uraiRingkasan(portofolio);
  const ref = (nama) => (keuangan.baris.some((b) => b.kelompok === 'jetp' && b.proyek && String(b.proyek).toLowerCase().replace(/[–-]/g, '-') === nama.toLowerCase().replace(/[–-]/g, '-')) ? true : false);
  for (const l of L) {
    const d = l.short_description_en; const ebt = EBT.test(l.title_en); const tambah = d.match(/addition of (\d+(?:\.\d+)?) MW/i); const mw = tambah ? Number(tambah[1]) : (d.match(/(\d+(?:\.\d+)?) MW/) ? Number(d.match(/(\d+(?:\.\d+)?) MW/)[1]) : null);
    const tek = /geothermal/i.test(l.title_en) ? 'panas-bumi' : /solar/i.test(l.title_en) ? 'surya' : null;
    const det = l.slug === 'saguling-floating-solar-pv-power-plant' ? uraiDetailProyek(saguling) : null;
    const prov = provinsi(det?.provinsi_resmi ?? d.match(/(?:in|located in) ([A-Za-z ]+)\.?$/)?.[1] ?? d);
    const c = ebt ? cocokProyek(l.title_en, prov, mw, ip, tek) : { proyek_id: null, kandidat: [] };
    baris.push({ id: 'jetp_' + l.id, jenis: 'proyek', nama: l.title_en, nama_id: l.title_id, teknologi: ebt ? tek : null, ebt, deskripsi_singkat: d, lokasi: { provinsi: prov, kota: det?.kota ?? null, lat: Number(l.latitude), lng: Number(l.longitude) }, kapasitas_mw: det?.kapasitas_mw ?? mw, kapasitas_catatan: tambah ? 'tambahan kapasitas (85 MW menjadi 168 MW), bukan total' : null, pengembang: det?.pengembang ?? null, pendana: det ? { pembiayaan_jetp_usd: det.pembiayaan_jetp_usd, jenis: det.jenis_pembiayaan, sumber_dana: det.sumber_dana, perantara: det.perantara } : null, ifa: det?.ifa ?? null, potensi_ghg_tco2e: det?.ghg_tco2e ?? null, status: 'disetujui_pembiayaan_jetp', proyek_id: c.proyek_id, kandidat_proyek: c.kandidat, keuangan_json: ref(l.title_en) ? 'sudah ada baris kelompok jetp di keuangan.json; nilai tidak diulang di sini' : null, sumber_id: 's-jetp-portofolio', sumber_url: 'https://jetp-id.org/portfolio-sub/index' + (det ? '' : ''), tingkat_bukti: 'resmi', tanggal: tgl });
  }
  const prog = teks(portofolio); const a = prog.indexOf('Latest Program');
  const NAMA_PROG = prog.slice(a + 1).filter((x) => x !== 'See More' && x !== '.' && x !== '-').slice(0, 4);
  for (const n of NAMA_PROG) {
    const iki = /IKI-Flex/.test(n); const t = iki ? teks(ikiflex) : [];
    const eur = t.find((x) => /^[\d,]{5,}$/.test(x)); const j = t.indexOf('Commited Amount (USD)');
    baris.push({ id: 'jetp_prog_' + n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40), jenis: 'program', nama: n, teknologi: /Geothermal/i.test(n) ? 'panas-bumi' : null, ebt: /Geothermal/i.test(n) ? true : null, pendana: iki ? { pembiayaan_usd: Number((t[j + 2] || '').replace(/,/g, '')) || null, jumlah_mata_uang_asal: 'EUR ' + (eur || ''), anggota_ipg: 'Germany', pelaksana: 'GIZ', jenis: 'Grant / TA' } : null, status: 'disetujui_pembiayaan_jetp', proyek_id: null, kandidat_proyek: [], keuangan_json: ref(n) ? 'sudah ada baris kelompok jetp di keuangan.json' : null, sumber_id: 's-jetp-portofolio', sumber_url: 'https://jetp-id.org/portfolio-sub/index', tingkat_bukti: 'resmi', tanggal: tgl });
  }
  return { lapis: 'publik', dibangun_pada: tgl, jumlah: baris.length, baris, ringkasan: { ...rk, catatan: 'angka kartu dasbor halaman portofolio JETP pada tanggal ambil; kartu lain dimuat JS dan terbaca 0 di HTML, tidak dipakai', sumber_id: 's-jetp-portofolio' }, sumber: SUMBER, meta: { diperbarui: tgl, celah: [
    'Daftar proyek prioritas CIPP 2023 (laporan penuh 334 halaman, ringkasan eksekutif) TIDAK terbaca: server jetp-id.org memutus semua unduhan PDF pada ~98 KB (file tidak valid; permintaan Range dijawab 206 tanpa isi). Tidak ada proyek CIPP yang ditebak dari ingatan. PDF asal: https://jetp-id.org/storage/official-jetp-cipp-2023-vshare_f_en-1700532655.pdf.',
    'Hanya 4 proyek dan 4 program yang tampil di dasbor portofolio. Rincian pendana per proyek terbaca hanya untuk Saguling (halaman detail dapat dimuat); halaman detail proyek lain di portfolio.jetp-id.org tidak terjangkau dan jalur /portfolio-sub/project dijawab 403/404, sehingga tidak diteruskan.',
    'MRT Jakarta (Utara-Selatan dan Timur-Barat) bukan proyek EBT (ebt=false); dicatat karena diklaim sebagai JETP.',
    'Tautan ke proyek.json hanya bila kemiripan nama kuat dan tidak ambigu; sisanya kandidat_proyek untuk kurator.'] } };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, dir, tgl] = process.argv.slice(2); const w = (n) => path.join(dir, n); const B = 'https://jetp-id.org/portfolio-sub/';
  if (cmd === 'ambil') {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(w('jetp_portofolio.html'), await ambil(B + 'index'));
    fs.writeFileSync(w('jetp_saguling.html'), await ambil(B + 'project/saguling-floating-solar-pv-power-plant'));
    fs.writeFileSync(w('jetp_ikiflex.html'), await ambil(B + 'program/iki-flex-jetp-support-package-1'));
  } else if (cmd === 'bangun' && tgl) {
    const r = (n) => fs.readFileSync(w(n), 'utf8');
    const out = bangunData(r('jetp_portofolio.html'), r('jetp_saguling.html'), r('jetp_ikiflex.html'), tgl, muat('proyek.json').baris, muat('keuangan.json'));
    const f = path.join(ROOT, 'public/data/jetp_cipp.json'); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(out) + '\n');
    console.log('jetp_cipp:', out.jumlah, 'baris');
  } else { console.error('pakai: ambil <dir> | bangun <dir> <tgl>'); process.exit(2); }
}
