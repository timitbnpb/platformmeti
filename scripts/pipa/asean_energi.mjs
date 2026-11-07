// Perluasan asean.json: bauran listrik per teknologi 2024 (OWID/Ember, CC BY 4.0) + target regional APAEC dari AEO9 (ACE).
// Pakai: node scripts/pipa/asean_energi.mjs [--unduh] [--tanggal=...]. Kunci iso3 sama dengan asean.json: halaman /asean tinggal menggabung per iso3.
import fs from 'node:fs';
import path from 'node:path';
import { AKAR, TANGGAL, UA, tulis, bacaRef } from './_panen_umum.mjs';

const CSV = path.join(AKAR, 'raw/owid-energy-data.csv');
const URL_OWID = 'https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv';
export const KOLOM = { surya: 'solar_share_elec', angin: 'wind_share_elec', hidro: 'hydro_share_elec', bioenergi: 'biofuel_share_elec', ebt_lain_termasuk_panas_bumi: 'other_renewables_share_elec_exc_biofuel', ebt_total: 'renewables_share_elec', batubara: 'coal_share_elec', gas: 'gas_share_elec', minyak: 'oil_share_elec', nuklir: 'nuclear_share_elec' };
export const ISO = ['IDN', 'VNM', 'PHL', 'THA', 'MYS', 'SGP', 'LAO', 'KHM', 'MMR', 'BRN'];

// CSV OWID tanpa kolom bertanda kutip koma: pemisah sederhana cukup untuk baris ASEAN (diuji di tests).
export function parseCsv(teks) {
  const [h, ...r] = teks.split('\n'); const kol = h.split(',');
  return r.filter(Boolean).map(l => { const v = l.split(','); return Object.fromEntries(kol.map((k, i) => [k, v[i]])); });
}
export function bangun(baris, asean) {
  const per = new Map(); for (const b of baris) if (ISO.includes(b.iso_code)) (per.get(b.iso_code) || per.set(b.iso_code, []).get(b.iso_code)).push(b);
  const nama = new Map(asean.baris.map(b => [b.iso3, b.nama]));
  return ISO.map(iso => {
    const r = (per.get(iso) || []).sort((a, b) => a.year - b.year);
    const nilai = k => { for (let i = r.length - 1; i >= 0; i--) if (r[i][k] !== '' && r[i][k] != null) return { tahun: +r[i].year, nilai: +(+r[i][k]).toFixed(2) }; return null; };
    return {
      iso3: iso, nama: nama.get(iso) || iso,
      bauran_listrik_persen: Object.fromEntries(Object.entries(KOLOM).map(([k, c]) => [k, nilai(c)])),
      pembangkitan_twh: nilai('electricity_generation'),
      intensitas_karbon_gco2_kwh: nilai('carbon_intensity_elec'),
      kebijakan_kunci: null, tarif_feed_in_atau_lelang: null, target_ebt_nasional: null,
      sumber_url: 'https://github.com/owid/energy-data', tanggal_periksa: TANGGAL, tingkat_bukti: 'via-pihak-ketiga',
    };
  });
}

export const REGIONAL = {
  sumber: 'ASEAN Centre for Energy, the 9th ASEAN Energy Outlook (AEO9)', url: 'https://aseanenergy.org/publications/the-9th-asean-energy-outlook',
  pdf: 'https://storage.googleapis.com/aceweb-bucket-261225/pdf/publication/9th%20ASEAN%20Energy%20Outlook__r1OSn51iWBCHG5U0Tlz82cKOeulQJT5o5sLbOJev.pdf',
  tingkat_bukti: 'resmi',
  target: [
    { rencana: 'APAEC 2016-2025', ebt_pasokan_energi_primer_persen: 23, ebt_kapasitas_terpasang_persen: 35, intensitas_energi_turun_persen_vs_2005: 32, tahun: 2025,
      kutipan: 'set a 23% renewable share of total primary energy supply for 2025 … added a 35% renewable share of installed power capacity and a 32% reduction in energy intensity' },
    { rencana: 'APAEC 2026-2030', ebt_pasokan_energi_primer_persen: 30, ebt_kapasitas_terpasang_persen: 45, intensitas_energi_turun_persen_vs_2005: 40, tahun: 2030,
      kutipan: 'a 30% renewable energy share in total primary energy supply, a 45% renewable energy share in installed power capacity and a 40% reduction in energy intensity' },
  ],
  realisasi_2024: { ebt_pasokan_energi_primer_persen: 14.1, ebt_kapasitas_terpasang_persen: 33, kutipan: 'Renewables supplied 14.1% of primary energy in 2024 against the 23% target' },
};

if (process.argv[1] === new URL(import.meta.url).pathname) (async () => {
  if (process.argv.includes('--unduh') || !fs.existsSync(CSV)) {
    const r = await fetch(URL_OWID, { headers: { 'User-Agent': UA } }); if (!r.ok) throw new Error('HTTP ' + r.status);
    fs.mkdirSync(path.dirname(CSV), { recursive: true }); fs.writeFileSync(CSV, await r.text(), 'utf-8');
  }
  const asean = bacaRef('public/data/asean.json');
  const baris = bangun(parseCsv(fs.readFileSync(CSV, 'utf-8')), asean);
  tulis(path.join(AKAR, 'public/data/asean_energi.json'), {
    jenis: 'asean_energi', tanggal_ambil: TANGGAL, lisensi: 'OWID energy-data CC BY 4.0 (memuat Ember); AEO9 kutipan pendek dengan atribusi',
    sumber: { bauran: { sumber: 'Our World in Data energy-data (Ember Yearly Electricity Data)', url: URL_OWID, lisensi: 'CC BY 4.0' }, regional: REGIONAL },
    jumlah: baris.length, baris,
    meta: {
      catatan: 'Pelengkap asean.json (kunci iso3 sama). bauran_listrik_persen = persen pembangkitan listrik per sumber, nilai terbaru yang tersedia (tahun ikut tiap nilai); ebt_lain_termasuk_panas_bumi tak dapat dipisah dari OWID.',
      celah: [
        'kebijakan_kunci, tarif_feed_in_atau_lelang, target_ebt_nasional per negara = null: AEO9 tidak memuat tabel target/tarif per negara; sumber tiap negara (kementerian energi, regulator) belum dipanen. Jangan diisi tanpa dokumen.',
        'Ember files host melarang robots (Disallow /); data Ember diambil lewat OWID energy-data (CC BY 4.0). IRENA kapasitas sudah ada di asean.json (kapasitas_ebt_mw).',
        'Target regional APAEC dari teks AEO9 (halaman publik ACE), bukan dokumen APAEC asli.',
      ],
    },
  });
  console.log('asean_energi:', baris.length, 'negara');
})().catch(e => { console.error(e.message); process.exit(1); });
