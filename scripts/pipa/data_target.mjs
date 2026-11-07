// public/data/target.json: target bauran EBT nasional + realisasi + kapasitas terpasang + celah (EST).
// Masukan: data/strategis/target_seed.json (angka disalin dari dokumen resmi, tiap angka punya sumber_id + halaman). Tanpa jaringan.
//   node scripts/pipa/data_target.mjs <YYYY-MM-DD>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const ASUMSI = {
  faktor_kapasitas_tambahan: { rendah: 0.25, dasar: 0.35, tinggi: 0.45, catatan: 'EST: kapasitas tambahan berbauran surya (~0,2), bayu/PLTA/PLTP (0,3-0,8); bukan angka sumber. Rendah = surya dominan, tinggi = PLTP/PLTA dominan.' },
  jam_per_tahun: 8760,
  tahun_dasar: 2024,
  proksi_persen: 'Target bauran RUKN (persen produksi listrik) dikalikan kebutuhan listrik KEN tanpa captive (titik tengah rentang); persen energi primer KEN tidak diubah menjadi MW.',
};
const ebt = (c) => c.hidro + c.panas_bumi + c.surya + c.bayu + c.bioenergi;
const bulat = (x, d = 0) => +x.toFixed(d);

export function bangun(seed, tanggal) {
  const kap = seed.kapasitas_ebt_mw; const dasar = ebt(kap[ASUMSI.tahun_dasar]);
  const kapasitas = Object.entries(kap).map(([y, c]) => ({ tahun: +y, hidro_mw: c.hidro, panas_bumi_mw: c.panas_bumi, surya_mw: c.surya, bayu_mw: c.bayu, bioenergi_mw: c.bioenergi, total_ebt_mw: bulat(ebt(c), 2), sumber_id: c.sumber_id, halaman: c.halaman }));
  const laju = bulat((ebt(kap[2024]) - ebt(kap[2015])) / 9, 1);
  const twh2024 = seed.realisasi.pembangkitan_ebt_persen_ember.find((r) => r.tahun === 2024).twh;
  const rukn = seed.target.find((t) => t.id === 'rukn-2025-pembangkitan').seri;
  const celah = [];
  const mwDari = (twhButuh, tahun) => { // tambahan MW di atas dasar 2024
    const f = (cf) => bulat(((twhButuh - twh2024) * 1e6) / (ASUMSI.jam_per_tahun * cf));
    const n = tahun - ASUMSI.tahun_dasar; const r = { celah_mw: {}, per_tahun_mw: {} };
    for (const k of ['rendah', 'dasar', 'tinggi']) { const v = f(ASUMSI.faktor_kapasitas_tambahan[k]); r.celah_mw[k] = v; r.per_tahun_mw[k] = bulat(v / n); }
    return r;
  };
  // 1. RUPTL: tambahan EBT langsung dalam MW
  const rup = seed.target.find((t) => t.id === 'ruptl-2034-kapasitas');
  celah.push({ target_id: rup.id, metode: 'langsung', tahun_awal: 2025, tahun_target: 2034, celah_mw: rup.min, per_tahun_mw: bulat(rup.min / 10, 1), laju_historis_mw_per_tahun_2015_2024: laju, kali_laju_historis: bulat(rup.min / 10 / laju, 1), label: 'EST', rumus: 'tambahan EBT RUPTL / 10 tahun; laju historis = (kapasitas EBT 2024 - 2015) / 9' });
  // 2. RUKN 2060 kapasitas terbarukan
  const r60 = seed.target.find((t) => t.id === 'rukn-2060-kapasitas'); const n60 = r60.tahun_target - ASUMSI.tahun_dasar;
  celah.push({ target_id: r60.id, metode: 'langsung', tahun_awal: 2025, tahun_target: 2060, celah_mw: bulat(r60.min - dasar), per_tahun_mw: bulat((r60.min - dasar) / n60), laju_historis_mw_per_tahun_2015_2024: laju, kali_laju_historis: bulat((r60.min - dasar) / n60 / laju, 1), label: 'EST', rumus: 'kapasitas terbarukan 2060 (RUKN) - kapasitas EBT 2024 (Statistik 2024), dibagi 36 tahun' });
  // 3. Target persen pembangkitan RUKN -> MW via kebutuhan listrik KEN
  for (const th of ['2030', '2040', '2050']) {
    const [lo, hi] = seed.kebutuhan_listrik_twh.tanpa_captive[th]; const dem = (lo + hi) / 2; const s = rukn[th];
    const twhButuh = (s / 100) * dem;
    celah.push({ target_id: 'rukn-2025-pembangkitan', metode: 'proksi', tahun_target: +th, persen_target: s, kebutuhan_listrik_twh: dem, produksi_ebt_dibutuhkan_twh: bulat(twhButuh, 1), produksi_ebt_2024_twh: twh2024, ...mwDari(twhButuh, +th), label: 'EST', rumus: 'celah MW = (persen RUKN x kebutuhan listrik KEN tengah - produksi EBT 2024) x 1e6 / (8760 x faktor kapasitas tambahan); per tahun = celah / (tahun target - 2024)' });
  }
  { celah.push({ target_id: 'ruptl-2034-bauran', metode: 'tak-dihitung', tahun_target: 2034, persen_target: seed.target.find((t) => t.id === 'ruptl-2034-bauran').min, alasan: 'kebutuhan listrik 2034 tidak ada di dokumen yang terbaca; pakai tambahan_kapasitas_ebt_mw RUPTL di atas', label: 'EST' }); }
  for (const t of seed.target.filter((x) => x.ukuran === 'bauran_energi_primer_ebt_persen' && x.dokumen === 'ken-pp-40-2025')) celah.push({ target_id: t.id, metode: 'tak-dihitung', tahun_target: t.tahun_target, alasan: 'persen energi primer (termasuk panas, transportasi) tidak dapat diubah ke MW tanpa model energi; lihat target RUKN untuk sektor listrik', label: 'EST' });
  const real = seed.realisasi;
  return {
    meta: {
      diperbarui: tanggal, tahun_dasar: ASUMSI.tahun_dasar, kapasitas_ebt_dasar_mw: bulat(dasar, 2), laju_historis_mw_per_tahun_2015_2024: laju, asumsi: ASUMSI,
      definisi: { kapasitas_ebt: 'hidro (PLTA/M/MH) + panas bumi + surya (termasuk atap) + bayu + bioenergi; PLTGB tidak dihitung. ESDM (Lakin DJK 2025) mencatat 14,44 GW untuk 2024 (definisi sedikit lebih luas), Statistik 2024 menjumlah 13,86 GW.', pembangkitan_ember: 'persen produksi listrik dari energi terbarukan (hidro, surya, bayu, bio, panas bumi; tanpa nuklir); bukan bauran energi primer KEN', energi_primer_ei: 'persen energi primer metode substitusi Energy Institute; tidak sama dengan bauran energi primer ESDM/KEN (yang memasukkan biofuel dan biomassa tradisional)', bauran_pln: 'bauran energi primer pembangkit PLN (Tabel 48), bukan nasional' },
      celah: [
        'Realisasi bauran EBT energi primer nasional resmi ESDM/EBTKE per tahun (HEESI, capaian kinerja) tidak dipanen: ebtke.esdm.go.id tidak terjangkau dan esdm.go.id tidak punya rangkaian tahunan terbaca. Angka Ember/EI dan bauran PLN dipakai sebagai pengganti dengan definisi tercatat.',
        'Realisasi 2025 belum ada dari sumber terbaca; Lakin DJK 2025 hanya memuat target RUKN 15,9 persen untuk 2025.',
        'Kapasitas EBT 2015-2019 dari Statistik 2020 (sebelum koreksi 2021); 2020-2024 dari Statistik 2024. PLTS Atap baru terpisah 2020+. Kapasitas 2025 belum ada.',
        'Second NDC dan RUEN (Perpres 22/2017, target 45,2 GW EBT 2025) tidak dimasukkan: lampiran RUEN berupa gambar, dokumen Second NDC tidak terbaca. E-NDC 2022 dikutip lewat RUKN.',
        'Kebutuhan investasi (Rp/USD) tidak dihitung: tidak ada biaya satuan bersumber di dokumen yang terbaca.',
        'Celah MW bertanda EST: bergantung faktor kapasitas tambahan (rendah/dasar/tinggi) dan kebutuhan listrik titik tengah KEN; hasil bukan ramalan.',
      ],
    },
    sumber: seed.sumber,
    target: seed.target,
    realisasi: { pembangkitan_ebt_persen: real.pembangkitan_ebt_persen_ember.map((r) => ({ ...r, sumber_id: 'owid-energi' })), energi_primer_ebt_persen_ei: real.energi_primer_ebt_persen_ei.map((r) => ({ ...r, sumber_id: 'owid-energi' })), bauran_primer_pembangkit_pln_ebt_persen: real.bauran_primer_pembangkit_pln_ebt_persen.map((r) => ({ ...r, sumber_id: 'stat-2024', halaman: 'Tabel 48 hlm 57' })) },
    kapasitas_ebt: kapasitas,
    kapasitas_ebt_gw_esdm: { ...seed.kapasitas_ebt_gw_esdm, sumber_id: 'lakin-djk-2025' },
    celah,
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tgl = process.argv[2]; if (!/^\d{4}-\d\d-\d\d$/.test(tgl || '')) throw new Error('pakai: data_target.mjs YYYY-MM-DD');
  fs.writeFileSync(path.join(ROOT, 'public/data/target.json'), JSON.stringify(bangun(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/strategis/target_seed.json'), 'utf8')), tgl)) + '\n'); console.log('target.json ok');
}
