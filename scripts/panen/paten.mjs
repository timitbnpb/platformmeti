// Paten EBT terkait Indonesia -> public/data/paten.json.
// Sumber sah: Lens.org Patent API (butuh token, env LENS_API_TOKEN). Tanpa token: berkas ditulis kosong + celah. PATENTSCOPE (JSF/sesi, tanpa API terbuka),
// PDKI DJKI (gerbang 302) dan penelusuran web Lens (robots Disallow /lens/search) TIDAK dipanen.
import path from 'node:path';
import { AKAR, TANGGAL, UA, tidur, tulis, bacaRef } from '../pipa/_panen_umum.mjs';

export const CPC = { surya: ['H01L31', 'Y02E10/50'], angin: ['F03D', 'Y02E10/70'], baterai: ['H01M', 'Y02E60/10'], energi_bersih: ['Y02E'] };
const JELAS = { surya: 'surya', angin: 'angin', baterai: 'baterai' };

export function tekDari(cpc) {
  const s = (cpc || []).join(' ');
  return Object.keys(JELAS).filter(k => CPC[k].some(c => s.includes(c.replace(/^(\w+\d+)\/.*/, '$1').slice(0, 5)))).concat([]) .slice(0, 3);
}
// murni: satu hasil Lens -> baris paten
export function barisDariLens(h, organisasi = []) {
  const pemohon = (h.biblio?.parties?.applicants || []).map(a => a.extracted_name?.value).filter(Boolean);
  const n = s => String(s).toLowerCase().replace(/[^a-z]/g, '');
  const org = organisasi.filter(o => pemohon.some(p => n(o.nama).length > 5 && n(p).includes(n(o.nama)))).map(o => o.id).sort();
  const cpc = (h.biblio?.classifications_cpc?.classifications || []).map(c => c.symbol);
  return {
    id: 'pt_' + h.lens_id, lens_id: h.lens_id, judul: h.biblio?.invention_title?.[0]?.text || '', pemohon, organisasi_id: org,
    tahun: h.year_published ?? null, yurisdiksi: h.jurisdiction, status: h.legal_status?.patent_status || null, jenis: h.publication_type || null,
    cpc: cpc.slice(0, 8), teknologi: tekDari(cpc), tautan: `https://www.lens.org/lens/patent/${h.lens_id}`,
    sumber_url: 'https://api.lens.org/patent/search', tanggal_periksa: TANGGAL, tingkat_bukti: 'via-pihak-ketiga',
  };
}

async function utama() {
  const token = process.env.LENS_API_TOKEN, baris = [], celah = [];
  celah.push('PATENTSCOPE WIPO: tidak ada API terbuka tanpa akun (pencarian JSF bersesi, hasil via AJAX); tidak dipanen otomatis.');
  celah.push('PDKI DJKI (pdki-indonesia.dgip.go.id): gerbang pengalihan 302 tanpa data publik yang dapat dibaca skrip.');
  celah.push('Lens.org: penelusuran web dilarang robots; Patent API butuh token (LENS_API_TOKEN). ' + (token ? '' : 'Token tidak ada: tidak ada paten terambil.'));
  if (token) {
    const organisasi = bacaRef('public/data/organisasi.json').baris;
    const q = { query: { bool: { must: [{ terms: { 'class_cpc.symbol': ['Y02E', 'H01L31', 'F03D', 'H01M'] } }], should: [{ term: { 'applicant.residence': 'ID' } }, { term: { jurisdiction: 'ID' } }], minimum_should_match: 1 } }, size: 500, include: ['lens_id', 'biblio', 'year_published', 'jurisdiction', 'legal_status', 'publication_type'] };
    const r = await fetch('https://api.lens.org/patent/search', { method: 'POST', headers: { 'User-Agent': UA, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(q) });
    if (!r.ok) throw new Error('Lens HTTP ' + r.status);
    for (const h of (await r.json()).data || []) baris.push(barisDariLens(h, organisasi));
    await tidur(2000);
  }
  tulis(path.join(AKAR, 'public/data/paten.json'), {
    jenis: 'paten', sumber: 'Lens.org Patent API', url: 'https://www.lens.org', tanggal_ambil: TANGGAL, tingkat_bukti: 'via-pihak-ketiga',
    cakupan: 'CPC Y02E, H01L31, F03D, H01M; pemohon berdomisili ID atau perlindungan di yurisdiksi ID', jumlah: baris.length, baris, meta: { celah },
  });
  console.log('paten:', baris.length);
}
if (process.argv[1] === new URL(import.meta.url).pathname) utama().catch(e => { console.error(e.message); process.exit(1); });
