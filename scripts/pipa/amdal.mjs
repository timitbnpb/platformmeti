// public/data/amdal.json: pengumuman AMDAL/UKL-UPL kegiatan pembangkit EBT dari AMDALNET (API pengumuman publik tanpa login).
//   node scripts/pipa/amdal.mjs ambil <dirMentah>          (jaringan: amdalnet.kemenlh.go.id/api/announcements, 100 baris/halaman, jeda >= 2 dtk; ~10 menit)
//   node scripts/pipa/amdal.mjs bangun <dirMentah> <tgl>   (tanpa jaringan)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ambil } from './_panen_sopan.mjs';
import { muat, indeksProyek, cocokProyek, provinsi, mwDariNama } from './_cocok.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const API = 'https://amdalnet.kemenlh.go.id/api/announcements';
const SUMBER = [{ id: 's-amdalnet', lisensi: 'Pengumuman publik pemerintah (KLH/BPLH); hanya fakta; pemrakarsa perseorangan tidak disimpan', judul: 'AMDALNET: Pengumuman Rencana Usaha dan/atau Kegiatan (AMDAL, UKL-UPL)', penerbit: 'Kementerian Lingkungan Hidup/BPLH (AMDALNET)', tahun: 2026, url: 'https://amdalnet.kemenlh.go.id/announcement', tingkat_bukti: 'resmi' }];
// kata kunci pembangkit EBT pada judul kegiatan; "surya" harus bersama listrik/PLTS agar tidak menangkap usaha lain
export const TEK = [['panas-bumi', /\bPLTP\b|panas\s*bumi|geothermal/i], ['surya', /\bPLTS\b|\bPLTS?\s?(atap|apung|terapung)|solar|surya|photovoltaic|\bPV\b/i], ['hidro', /\bPLTA\b|\bPLTMH\b|\bPLTM\b|mikro\s*hidro|mini\s*hidro|tenaga\s*air|hydro|pembangkit listrik.*\bair\b/i], ['bayu', /\bPLTB\b|tenaga\s*angin|bayu|wind/i], ['bioenergi', /\bPLTBm\b|\bPLTBg\b|\bPLTSa\b|biomassa|biogas|\bPLTBM\b|tenaga\s*sampah|waste to energy|\bPSEL\b/i]];
export const LISTRIK = /pembangkit|listrik|\bPLT[A-Z]|kelistrikan|power|energi|energy|\bMW\b|\bMWp\b|\bkW\b/i;
const FOSIL = /batu\s*bara|\bPLTU\b|\bPLTG\b|\bPLTGU\b|\bPLTD\b|\bPLTMG\b|gas alam|\bLNG\b|tambang/i; // judul fosil: bukan EBT walau uraiannya menyebut PLTS dsb
export function teknologi(judul, desk) {
  const t = `${judul ?? ''} ${desk ?? ''}`; if (!LISTRIK.test(t) || FOSIL.test(judul ?? '')) return null;
  const j = TEK.find(([, r]) => r.test(judul ?? '')) || TEK.find(([, r]) => r.test(t)); return j ? j[0] : null;
}
const htmlTeks = (s) => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&amp;/g, ' ').replace(/\s+/g, ' ').trim();
const ORG = /^(PT\.?|CV\.?|Koperasi|KUD|Perum|Perumda|Perseroda|UD\.?|Yayasan|BUMDes|BUMD|Pemerintah|Dinas|Badan|Universitas)\b|\b(Tbk|Persero|Indonesia|Energy|Energi|Power|Solar|Renewable)\b/i;
export function mwDari(skala, judul) { // "60.00 MW" | "1,5 MWp" | kW | judul
  const m = String(skala ?? '').match(/(\d+(?:[.,]\d+)?)\s*(MWp?|kWp?)/i);
  if (m) { const v = Number(m[1].replace(',', '.')); return /^k/i.test(m[2]) ? v / 1000 : v; }
  return mwDariNama(judul);
}
export function bangunData(mentah, tgl, proyek) {
  const ip = indeksProyek(proyek); const baris = []; const lihat = new Set();
  for (const a of mentah.baris) {
    const p = a.project || {}; const judul = p.project_title || a.project_type; const desk = htmlTeks(p.description); const tek = teknologi(judul, desk);
    if (!tek || lihat.has(a.id)) continue; lihat.add(a.id);
    const loc = htmlTeks(p.location_desc); const prov = provinsi(loc); const mw = mwDari(a.project_scale, judul); const c = cocokProyek(judul, prov, mw, ip, tek);
    const pem = String(a.cs_name || a.pic_name || '').trim().replace(/\s+-\s+[^-]*$/, ''); /* buang ' - nama orang' di ujung */ // nama perseorangan tidak disimpan (privasi); hanya badan usaha/instansi
    baris.push({ id: 'amdal_' + a.id, nama_kegiatan: judul, pemrakarsa: ORG.test(pem) ? pem : null, pemrakarsa_dirahasiakan: !ORG.test(pem), teknologi: tek, kapasitas_mw: mw, skala_asal: a.project_scale ?? null, jenis_dokumen: a.project_result || p.required_doc || null, jenis_kegiatan: p.project_type ?? null, kewenangan: p.authority ?? null, lokasi: { teks: loc || null, provinsi: prov }, tahun_proyek: p.project_year ?? null, tanggal_mulai: String(a.start_date ?? '').slice(0, 10) || null, tanggal_akhir: String(a.end_date ?? '').slice(0, 10) || null, status_pengumuman: a.expired ? 'berakhir' : 'berlangsung', proyek_id: c.proyek_id, kandidat_proyek: c.kandidat, sumber_id: 's-amdalnet', sumber_url: 'https://amdalnet.kemenlh.go.id/announcement/view/' + a.id, tingkat_bukti: 'resmi', tanggal: tgl });
  }
  baris.sort((a, b) => (b.tanggal_mulai || '').localeCompare(a.tanggal_mulai || '') || a.id.localeCompare(b.id));
  const thn = baris.map((b) => b.tanggal_mulai).filter(Boolean).sort();
  return { lapis: 'publik', dibangun_pada: tgl, jumlah: baris.length, baris, sumber: SUMBER, meta: { diperbarui: tgl, total_pengumuman_disisir: mentah.total, rentang_tanggal: [thn[0] ?? null, thn.at(-1) ?? null], celah: [
    `Disisir ${mentah.total} pengumuman AMDALNET; hanya yang judul/uraiannya memuat kata kunci pembangkit EBT (PLTS/PLTA/PLTMH/PLTB/PLTP/biomassa/biogas/surya/hidro/panas bumi/angin) dan istilah kelistrikan yang masuk. Kegiatan yang judulnya tidak menyebut jenis pembangkit tidak tertangkap.`,
    'Hanya pengumuman di AMDALNET (kewenangan pusat dan daerah yang memakainya); pengumuman di situs DLH provinsi/kabupaten yang tidak memakai AMDALNET dan berita tidak dipanen.',
    'Kolom pemrakarsa memakai cs_name AMDALNET (bisa berupa instansi/penyusun, mis. Dinas Lingkungan Hidup); dipakai apa adanya. Judul bernuansa fosil (batu bara, PLTU/PLTG/PLTD, tambang) dikeluarkan walau uraiannya menyebut EBT.',
    'Nama pemrakarsa perseorangan tidak disimpan (pemrakarsa null, pemrakarsa_dirahasiakan true); hanya badan usaha/instansi.',
    'lokasi.provinsi diturunkan dari uraian lokasi (teks bebas) dan null bila tak terbaca; kolom project_location API rusak ("[object Object]") sehingga tidak dipakai.',
    'proyek_id hanya untuk kemiripan nama kuat dan provinsi/teknologi tak bertentangan; selebihnya kandidat_proyek untuk kurator. Dokumen AMDAL belum tentu berarti proyek terbangun.'] } };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, dir, tgl] = process.argv.slice(2); const f = path.join(dir ?? '.', 'amdal_mentah.json');
  if (cmd === 'ambil') {
    fs.mkdirSync(dir, { recursive: true }); const baris = []; let total = 0, hal = 1, akhir = 1;
    for (; hal <= akhir; hal++) {
      const d = await ambil(`${API}?limit=100&page=${hal}`, { json: true, headers: { accept: 'application/json' } });
      akhir = d.last_page; total = d.total;
      for (const a of d.data) { const p = a.project || {}; const judul = p.project_title || a.project_type; if (teknologi(judul, htmlTeks(p.description))) baris.push({ id: a.id, cs_name: a.cs_name, pic_name: a.pic_name, project_result: a.project_result, project_scale: a.project_scale, project_type: a.project_type, start_date: a.start_date, end_date: a.end_date, expired: a.expired, project: { project_title: p.project_title, description: p.description, location_desc: p.location_desc, project_year: p.project_year, project_type: p.project_type, authority: p.authority, required_doc: p.required_doc } }); }
      if (hal % 10 === 0) console.error('halaman', hal, '/', akhir);
    }
    if (total && baris.length === 0) throw new Error('nol baris EBT: tidak menimpa'); // gagal tidak menimpa data lama
    fs.writeFileSync(f, JSON.stringify({ total, baris }));
  } else if (cmd === 'bangun' && tgl) {
    const out = bangunData(JSON.parse(fs.readFileSync(f, 'utf8')), tgl, muat('proyek.json').baris);
    const o = path.join(ROOT, 'public/data/amdal.json'); fs.mkdirSync(path.dirname(o), { recursive: true }); fs.writeFileSync(o, JSON.stringify(out) + '\n');
    console.log('amdal:', out.jumlah, 'baris;', out.baris.filter((b) => b.proyek_id).length, 'tertaut proyek');
  } else { console.error('pakai: ambil <dir> | bangun <dir> <tgl>'); process.exit(2); }
}
