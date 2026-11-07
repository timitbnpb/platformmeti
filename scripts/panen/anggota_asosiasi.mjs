#!/usr/bin/env node
// Daftar anggota asosiasi dari halaman anggota publik -> data/direktori/anggota_asosiasi.json (dibaca sensus /sektor lewat potret).
//   node scripts/panen/anggota_asosiasi.mjs --selftest | --ambil <tanggal>
// Sopan: _panen_sopan.ambil (robots.txt, jeda 2,1 dtk, UA METI, 403 berhenti). Hanya nama yang tertulis di halaman; tidak ada keanggotaan yang ditebak.
// AESI (aesi.id) dan MKI (mki.or.id) tidak terjangkau saat dicoba (koneksi gagal); API panas bumi belum ada alamat anggota publik. Dicatat apa adanya.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { ambil } from '../pipa/_panen_sopan.mjs';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data/direktori/anggota_asosiasi.json');
const teks = (h) => String(h).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, '\n').replace(/&amp;/g, '&').replace(/&#0?39;|&#8217;/g, "'").split('\n').map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
export function namaAplsi(html) { // nama = baris tepat sebelum "Address"
  const b = teks(html), out = [];
  b.forEach((l, i) => { if (/^Address$|^Alamat$/.test(l) && i > 0 && b[i - 1].length > 2 && b[i - 1].length < 90) out.push(b[i - 1]); });
  return [...new Set(out)];
}
async function ambilAplsi() {
  const url = 'https://aplsi.or.id/category/member/', semua = []; let n = 1;
  for (; n <= 15; n++) {
    let h; try { h = await ambil(n === 1 ? url : `${url}page/${n}/`); } catch (e) { if (n === 1) throw e; break; }
    const a = namaAplsi(h); if (!a.length || a.every((x) => semua.includes(x))) break; semua.push(...a);
  }
  return { nama: 'APLSI (Asosiasi Produsen Listrik Swasta Indonesia)', sumber_url: url, anggota: [...new Set(semua)].sort() };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2);
  if (a.includes('--selftest')) { assert.deepEqual(namaAplsi('<h3>Akuo Energy Indonesia</h3><b>Address</b> Menara <h3>Adimitra Energy Hidro</h3><b>Address</b>'), ['Akuo Energy Indonesia', 'Adimitra Energy Hidro']); console.log('selftest ok'); }
  else if (a.includes('--ambil')) {
    const tgl = a[a.indexOf('--ambil') + 1]; assert.match(String(tgl), /^\d{4}-\d{2}-\d{2}$/);
    const baris = {}, gagal = {};
    try { baris.aplsi = { ...(await ambilAplsi()), tanggal_baca: tgl }; } catch (e) { gagal.aplsi = e.message; }
    gagal.aesi = 'aesi.id tidak terjangkau (koneksi gagal) saat dicoba'; gagal.mki = 'mki.or.id tidak terjangkau (koneksi gagal) saat dicoba'; gagal.api_panas_bumi = 'tidak ada daftar anggota publik yang ditemukan';
    if (fs.existsSync(OUT) && !baris.aplsi) throw new Error('aplsi gagal; tidak menimpa berkas lama');
    fs.writeFileSync(OUT, JSON.stringify({ sumber: 'halaman anggota publik asosiasi', diambil: tgl, baris, tidak_terbaca: gagal }, null, 1) + '\n');
    console.log('aplsi', baris.aplsi?.anggota.length, gagal);
  }
}
