#!/usr/bin/env node
// JM-S05: satu angka proyek terlacak + penjelasan selisih kapasitas terlacak vs angka nasional.
// Keluaran public/data/proyek_rekon.json. Turunan murni: TIDAK menyunting proyek.json maupun proyek_terpadu.json (pembaca lama tetap jalan).
// Sumber kebenaran angka proyek = proyek_terpadu.json (superset proyek.json: 488 dari 548 id masuk, sisanya tanpa teknologi/kapasitas terpakai).
// Kapasitas terlacak = jumlah mw baris beroperasi (bukan rencana) per teknologi; nasional dari konsistensi.json (topik/*.json). Rumus: ALGORITMA §P.5.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const J = (f) => JSON.parse(fs.readFileSync(new URL('../../public/data/' + f, import.meta.url), 'utf8'));
const PETA = { surya: 'surya', hidro: 'hidro', panas_bumi: 'panas-bumi' };   // topik konsistensi -> tek terpadu
const bulat1 = (x) => Math.round(x * 10) / 10;

// Sumber angka nasional tiap teknologi: diambil dari naskah topik (kunci "kapasitas ... terpasang" + registri sumber), lengkap dengan URL dan tahun data.
export function sumberNasional(topik) {
  const k = (topik.kunci ?? []).find((x) => /kapasitas/i.test(x.label?.id ?? '') && /terpasang/i.test(x.label?.id ?? ''));
  const reg = Array.isArray(topik.sumber) ? topik.sumber.find((x) => x.id === k?.sumber) : topik.sumber?.[k?.sumber];
  if (!k || !reg?.url) return null;
  return { penerbit: reg.penerbit, judul: reg.judul, url: reg.url, tahun_data: Number(k.deret?.at(-1)?.[0]) || null, diambil: reg.tanggal, lisensi: reg.lisensi };
}
export function bangun(terpadu, lama, konsistensi, topik = {}) {
  const baris = terpadu.baris.filter((r) => !r.ragu), idT = new Set(terpadu.baris.map((r) => r.id));
  const tanpa = (f) => baris.filter(f).length;
  const kap = (tek) => baris.filter((r) => r.tek === tek && r.status === 'beroperasi').reduce((s, r) => s + (r.mw || 0), 0);
  const tekMap = {};
  for (const w of konsistensi.peringatan.angka_bertentangan) {
    const tek = PETA[w.topik]; if (!tek) continue;
    const terlacak = kap(tek), nasional = w.nilai_topik_mw;
    tekMap[tek] = {
      nasional_mw: nasional, terlacak_mw: bulat1(terlacak), cakupan_persen: nasional ? bulat1(Math.min(100, terlacak / nasional * 100)) : null,
      melebihi: terlacak > nasional, sisa_mw: bulat1(Math.max(0, nasional - terlacak)), label_nasional: w.label,
      proyek_json_lama_mw: w.proyek_beroperasi_mw, sumber_nasional: topik[w.topik] ? sumberNasional(topik[w.topik]) : null,
    };
  }
  return {
    lapis: 'publik', dibangun_pada: konsistensi.dibangun_pada,
    angka_proyek: { terlacak: baris.length, sumber: 'public/data/proyek_terpadu.json', tanggal: terpadu.dibangun_pada,
      rincian: { ragu_dikecualikan: terpadu.baris.length - baris.length, proyek_json_lama: lama.baris.length, proyek_json_masuk_terpadu: lama.baris.filter((r) => idT.has(r.id)).length,
        proyek_json_tidak_masuk: lama.baris.filter((r) => !idT.has(r.id)).length } },
    kapasitas: tekMap,
    sebab_selisih: [
      { kode: 'status_tidak_diketahui', n: tanpa((r) => r.status === 'tidak-diketahui'), teks: { id: 'proyek tanpa status yang jelas', en: 'projects with no clear status' } },
      { kode: 'operasi_tanpa_mw', n: tanpa((r) => r.status === 'beroperasi' && !r.mw), teks: { id: 'proyek beroperasi tanpa kapasitas tercatat', en: 'operating projects without recorded capacity' } },
      { kode: 'tanpa_cod', n: tanpa((r) => !r.cod_rencana && !r.cod_terbaru), teks: { id: 'proyek tanpa tahun COD', en: 'projects without a COD year' } },
      { kode: 'tanpa_teknologi', n: lama.baris.filter((r) => !idT.has(r.id)).length, teks: { id: 'baris proyek.json yang tidak masuk karena tanpa teknologi', en: 'proyek.json rows excluded for lacking a technology' } },
      { kode: 'ragu', n: terpadu.baris.length - baris.length, teks: { id: 'pasangan kembar diragukan, menunggu tinjauan kurator', en: 'doubtful duplicate pairs awaiting curator review' } },
    ],
    batas: 'Angka nasional adalah kapasitas terpasang (statistik ESDM/topik); terlacak hanya baris berstatus beroperasi di daftar proyek, jadi selisih bukan galat melainkan proyek yang belum tercatat. Rencana tidak pernah dibandingkan dengan terpasang.',
    meta: { tanggal_nasional: konsistensi.dibangun_pada, catatan: 'URL dan tahun data tiap angka nasional ada di kapasitas.<tek>.sumber_nasional.' },
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const d = bangun(J('proyek_terpadu.json'), J('proyek.json'), J('konsistensi.json'), Object.fromEntries(Object.keys(PETA).map((t) => [t, J(`topik/${t}.json`)])));
  fs.writeFileSync(new URL('../../public/data/proyek_rekon.json', import.meta.url), JSON.stringify(d) + '\n');
  console.log(JSON.stringify(d.angka_proyek), JSON.stringify(Object.fromEntries(Object.entries(d.kapasitas).map(([k, v]) => [k, v.cakupan_persen]))));
}
