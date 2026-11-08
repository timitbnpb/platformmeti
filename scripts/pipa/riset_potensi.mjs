// Riset potensi (8 tema) -> public/data/riset/*.json. Satu berkas per tema, tiap baris wajib punya kunci tautan (kode BPS, sistem_id keandalan, proyek_id, org_id).
// Tingkat bukti: Data (angka tertulis di sumber) | EST (turunan hitung/sumber sekunder) | Hipotesis (model/asumsi). Tanpa angka karangan: yang tak ditemukan masuk meta.celah.
// Sumber angka dari PDF lokal: RUPTL 2025-2034 (scripts/panen/riset_potensi.mjs). Pakai: node scripts/pipa/riset_potensi.mjs [--selftest]
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { teksRuptl, urai_waduk, urai_lampiran_e, SAWIT_2023, SAWIT_NASIONAL_2023, URL_RUPTL } from '../panen/riset_potensi.mjs';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const j = (rel) => JSON.parse(fs.readFileSync(path.join(AKAR, rel), 'utf8'));
const TGL = '2026-11-08';
const OUT = path.join(AKAR, 'public/data/riset');

const S = {
  ruptl: { id: 'ruptl-2025', judul: 'RUPTL PT PLN (Persero) 2025-2034 (Kepmen ESDM 188.K/TL.03/MEM.L/2025)', penerbit: 'PT PLN (Persero); Kementerian ESDM', tahun: 2025, url: URL_RUPTL, lisensi: 'Dokumen resmi pemerintah; dikutip dengan sumber', tingkat_bukti: 'Data' },
  iea: { id: 'iea-2022', judul: "Enhancing Indonesia's Power System (ringkasan eksekutif)", penerbit: 'IEA', tahun: 2022, url: 'https://www.iea.org/reports/enhancing-indonesias-power-system/executive-summary', lisensi: 'IEA, kutipan dengan sumber', tingkat_bukti: 'Hipotesis' },
  tumiran: { id: 'tumiran-2021', judul: 'Maximum penetration determination of variable renewable energy generation: A case in Java-Bali power systems (Renewable Energy 163:561-570; DOI 10.1016/j.renene.2020.08.048)', penerbit: 'Tumiran, Putranto, Sarjiya, Pramono (Elsevier)', tahun: 2021, url: 'https://ideas.repec.org/a/eee/renene/v163y2021icp561-570.html', lisensi: 'Abstrak publik; dikutip dengan sumber', tingkat_bukti: 'Hipotesis' },
  bps: { id: 'bps-sawit-2023', judul: 'Statistik Kelapa Sawit Indonesia 2023, Tabel 3.3.2 (luas areal dan produksi CPO 2023 menurut provinsi)', penerbit: 'Badan Pusat Statistik', tahun: 2024, url: 'https://www.bps.go.id/id/publication/2024/11/29/d5dcb42ab730df1be4339c34/statistik-kelapa-sawit-indonesia-2023', lisensi: 'Hak cipta BPS; dikutip dengan sumber', tingkat_bukti: 'Data' },
  stich: { id: 'iea-bioenergy-stichnothe', judul: 'Palm Oil Residues for Biogas Production (slide IEA Bioenergy Workshop Rome, 17 Mei 2016): per 1000 kg TBS = 200 kg CPO, 140 kg serat, 55 kg cangkang, 230 kg TKKS, 0,65 m3 POME; LHV serat 11,0 / cangkang 13,4 / TKKS 4,4 GJ/t; POME 32 PJ/th dari 97.500 ribu m3', penerbit: 'H. Stichnothe, Thuenen Institute (IEA Bioenergy Task 37)', tahun: 2016, url: 'https://www.ieabioenergy.com/wp-content/uploads/2016/05/P12-Palm-oil-residues-for-biogas-production-Stichnothe.pdf', lisensi: 'Slide publik IEA Bioenergy; dikutip dengan sumber', tingkat_bukti: 'EST' },
  gem: { id: 'gem-solar', judul: 'Global Solar Power Tracker (via public/data/gem_pembangkit.json)', penerbit: 'Global Energy Monitor', tahun: 2026, url: 'https://globalenergymonitor.org/projects/global-solar-power-tracker/', lisensi: 'CC BY 4.0', tingkat_bukti: 'EST' },
  irenastat: { id: 'irenastat', judul: 'IRENASTAT Renewable Energy Statistics, kapasitas surya Indonesia (via public/data/kapasitas_tren.json)', penerbit: 'IRENA', tahun: 2026, url: 'https://pxweb.irena.org/pxweb/en/IRENASTAT/IRENASTAT__Power%20Capacity%20and%20Generation/', lisensi: 'IRENASTAT: bebas dipakai dengan atribusi', tingkat_bukti: 'Data' },
};
const pilih = (...k) => k.map((x) => S[x]);
const bungkus = (tema, sumber, baris, celah, ekstra = {}) => ({ lapis: 'publik', tema, dibangun_pada: TGL, sumber, ...ekstra, meta: { diperbarui: TGL, jumlah: baris.length, tingkat_bukti_kamus: { Data: 'angka tertulis di sumber', EST: 'turunan hitung atau sumber sekunder', Hipotesis: 'hasil model atau asumsi' }, celah }, baris });
const tulis = (nama, d) => { fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(path.join(OUT, nama + '.json'), JSON.stringify(d) + '\n'); };

const wil = j('public/data/wilayah.json').baris; const kodeNama = new Map(wil.map((b) => [b.nama, b.kode]));
const ALIAS = { DIY: '34', 'DI Yogyakarta': '34', 'Kepulauan Bangka Belitung': '19' };
const kode = (n) => ALIAS[n] || kodeNama.get(n) || null;
const ke = j('public/data/keandalan.json');
const sistemDariProv = (k) => ke.sistem.find((s) => s.prov.includes(k))?.id || null;
const round = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;
const hav = (a, b, c, d) => { const r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2; return 6371 * 2 * Math.asin(Math.sqrt(x)); };

// 1. Kesiapan jaringan per sistem
function jaringan() {
  const idx = (a, t) => a[t - ke.tahun_neraca];
  const baris = ke.sistem.map((s) => {
    const bp = (t) => idx(s.beban_puncak_neto_mw, t), eb = (t) => idx(s.ebt_dmn_mw, t), rm = (t) => idx(s.rm_persen, t);
    return {
      sistem_id: s.id, keandalan_id: s.id, nama: s.nama, kode_prov: s.prov,
      beban_puncak_neto_mw: { 2025: bp(2025), 2030: bp(2030), 2034: bp(2034) }, reserve_margin_persen: { 2025: rm(2025), 2030: rm(2030), 2034: rm(2034) },
      ebt_dmn_mw: { 2025: eb(2025), 2030: eb(2030), 2034: eb(2034) },
      rasio_ebt_beban_puncak_persen: { 2025: round(eb(2025) / bp(2025) * 100), 2030: round(eb(2030) / bp(2030) * 100), 2034: round(eb(2034) / bp(2034) * 100) },
      penyimpanan_ruptl_mw: s.penyimpanan_ruptl_mw, sumber_id: 'ruptl-2025', tingkat_bukti: { neraca: 'Data', rasio: 'EST', penyimpanan: 'Data' },
      catatan_rasio: 'Rasio = kapasitas pembangkit EBT (dmn, MW) / beban puncak neto; BUKAN penetrasi energi dan tak sebanding langsung dengan batas studi di bawah.',
    };
  });
  const studi = [
    { id: 'tumiran-2021', lingkup: 'Jawa-Bali', metrik: 'kapasitas VRE (surya) terhadap kapasitas sistem', batas_persen: 5.85, tahun: 2023, catatan: 'Total surya 6.447 MWp pada beban puncak 36.669 MW; subsistem Paiton-Grati 711 MWp. Dibatasi ramping dan beban minimum.', sumber_id: 'tumiran-2021', tingkat_bukti: 'Hipotesis' },
    { id: 'iea-2022-jb-sum', lingkup: 'Jawa-Bali + Sumatera (gabungan)', metrik: 'pangsa energi surya tahunan yang dapat ditampung aset eksisting', batas_persen: 10, tahun: 2025, catatan: 'Surya 17,7 GW (RUPTL saat itu 2,8 GW); tanpa tambahan jaringan atau penyimpanan; batubara dan hidro cukup fleksibel.', sumber_id: 'iea-2022', tingkat_bukti: 'Hipotesis' },
  ];
  return bungkus('jaringan', pilih('ruptl', 'iea', 'tumiran'), baris, [
    'Kebutuhan penyimpanan dalam MWh per sistem tidak tercantum di RUPTL yang diurai; hanya MW (penyimpanan_ruptl_mw, termasuk pumped storage).',
    'Studi batas penetrasi lain (UGM 2018 skripsi: 10,95% beban puncak; IESR: bauran EBT 32/35/35/51% Jawa-Bali/Sumatera/Kalimantan/Sulawesi 2030) muncul di hasil pencarian tetapi berkasnya belum dibuka; tidak dimasukkan sebagai angka.',
    'ADB, NREL, GIZ: tidak ditemukan studi batas penetrasi Indonesia yang dapat dibaca. Batas antarstudi memakai metrik dan tahun berbeda: jangan dibandingkan langsung.',
  ], { studi_batas_penetrasi: studi });
}

// 2. Curtailment
function curtailment() {
  const baris = [{ id: 'iea-2022-sumatera', jenis: 'hasil-model', sistem_id: 'sumatera', kode_prov: ke.sistem.find((s) => s.id === 'sumatera').prov, curtailment_persen_tahunan: 14, tahun_skenario: 2025, uraian: 'Pemangkasan PV tahunan tinggi di Sumatera pada skenario surya 10% pangsa; turun bila permintaan lebih tinggi.', sumber_id: 'iea-2022', tingkat_bukti: 'Hipotesis' }];
  return bungkus('curtailment', pilih('iea'), baris, [
    'Tidak ditemukan satu pun kejadian curtailment terukur per sistem atau proyek di sumber terbuka (PLN, ESDM, media). Satu-satunya angka adalah hasil model IEA, bukan kejadian.',
    'PLTB Sidrap tak dibeli PLN sebagian November 2019 untuk perawatan (Bisnis.com): bukan curtailment sistem, tidak dicatat sebagai kejadian.',
  ]);
}

// 3. Permintaan baru (data center, smelter, kawasan industri) dari RUPTL Lampiran E.1/E.2
function permintaan(teks) {
  const kaw = j('public/data/kawasan.json').baris; const GENERIK = /^(industri|kawasan|estate|park|indonesia|jaya|raya|kek|pt|zone|industrial|center|data)$/i;
  const tok = (n) => (n.match(/[A-Za-z]{5,}/g) || []).filter((w) => !GENERIK.test(w)).map((w) => w.toLowerCase());
  const raw = urai_lampiran_e(teks);
  const semua = raw.map((r) => {
    const kp = kode(r.provinsi.replace(/(Jawa Barat) \1/, '$1').split(/\s(?=Jawa Barat)/)[0]) ;
    const ragu = !kp || (r.mva_awal != null && r.mva_akhir != null && r.mva_awal > r.mva_akhir) || (r.tahun_awal && r.tahun_akhir && r.tahun_awal > r.tahun_akhir) || r.mva_akhir == null || / PT .* PT /.test(r.nama);
    const nt = tok(r.nama); const k = kp && ['KI', 'KEK', 'Kawasan'].includes(r.kategori) && kaw.find((x) => x.provinsi === wil.find((w) => w.kode === kp)?.nama && (() => { const kt = tok(x.nama); const sama = kt.filter((t) => nt.includes(t)).length; return sama >= Math.min(2, kt.length) && sama > 0; })());
    return {
      id: `re${r.regional === 'jawa-madura-bali' ? '2' : '1'}-${String(r.no).padStart(3, '0')}`, kategori: r.kategori, nama: r.nama, kode_prov: kp, sistem_id: kp ? sistemDariProv(kp) : null,
      kawasan_id: k?.id || null, mva_awal: r.mva_awal ?? null, tahun_awal: r.tahun_awal ?? null, mva_akhir: r.mva_akhir ?? null, tahun_akhir: r.tahun_akhir ?? null,
      mw_est: r.mva_akhir != null ? round(r.mva_akhir * 0.9) : null, faktor_daya_asumsi: 0.9, diurai_ragu: ragu,
      sumber_id: 'ruptl-2025', halaman: `Lampiran ${r.regional === 'jawa-madura-bali' ? 'E.2' : 'E.1'} no. ${r.no}`, tingkat_bukti: ragu ? 'Hipotesis' : 'Data', tingkat_bukti_mw: 'EST',
    };
  });
  const baris = semua.filter((b) => b.kode_prov); const tanpaProv = semua.length - baris.length;
  const ok = baris.filter((b) => !b.diurai_ragu && b.mva_akhir != null);
  const proy = {};
  for (const kat of ['Data Center', 'Smelter', 'KI']) for (const b of ok.filter((x) => x.kategori === kat)) {
    const p = (proy[kat] ||= { mva_sampai_2030: 0, mva_tanpa_tahun: 0, mva_setelah_2030: 0, butir: 0 }); p.butir++;
    if (!b.tahun_akhir) p.mva_tanpa_tahun += b.mva_akhir; else if (b.tahun_akhir <= 2030) p.mva_sampai_2030 += b.mva_akhir; else p.mva_setelah_2030 += b.mva_akhir;
  }
  for (const p of Object.values(proy)) for (const k of Object.keys(p)) p[k] = round(p[k]);
  return bungkus('permintaan_baru', pilih('ruptl'), baris, [
    'Hanya Lampiran E.1 (Sumatera-Kalimantan) dan E.2 (Jawa-Madura-Bali) diurai; E.3 (Sulawesi, Maluku, Papua, Nusra: IMIP, Weda Bay, dll) bertata letak tengah-vertikal dan belum diurai. Smelter Sulawesi/Maluku lihat captive_power.json.',
    'Satuan MVA permintaan PLN (bukan MW); mw_est = MVA x 0,9 faktor daya (asumsi, EST). Butir diurai_ragu=true (urut kolom meragukan: awal>akhir, provinsi gagal, nama bercampur) dikeluarkan dari proyeksi_2030 dan perlu dicek ke PDF.',
    'MVA akhir = puncak yang diminta pelanggan, belum tentu terealisasi; RUPTL membangun infrastruktur hanya bila tingkat kepastian terpenuhi (PJBTL, MOU). Sumber listrik per butir tidak diurai.',
    `${tanpaProv} butir terurai tetapi provinsinya gagal dicocokkan ke kode BPS (kolom bocor): dibuang, bukan dipakai.`,
    'MW per kawasan (di luar daftar RUPTL) dan data center di luar Jabodetabek-Batam-Bintan tidak ditemukan di sumber resmi.',
  ], { proyeksi_2030: proy });
}

// 4. PLTS terapung
function terapung(teks) {
  const waduk = urai_waduk(teks);
  const gem = j('public/data/gem_pembangkit.json').baris; const gardu = j('public/geo/gardu.json').gardu; const bbox = j('public/geo/gardu.json').meta.cakupan_bbox;
  const dalam = (la, lo) => bbox.some(([s, w, n, e]) => la >= s && la <= n && lo >= w && lo <= e);
  const terdekat = (la, lo) => { if (!dalam(la, lo)) return null; let m = null; for (const g of gardu) { const d = hav(la, lo, g.lat, g.lng); if (!m || d < m.d) m = { d, g }; } return { jarak_km: round(m.d), gardu_id: m.g.id, gardu_nama: m.g.nama, teg_kv: m.g.teg_kv }; };
  const PROY = ['gem-solar-L100000800892', 'gem-solar-L100000801313', 'gem-solar-L100000801387', 'gem-solar-L100000830282', 'gem-solar-L100000830289', 'gem-solar-L100001080948'];
  const rencana = { 'gem-solar-L100000800892': 'Studi ekspansi hingga 500 MWac/MWp (PLN NP-Masdar, Mei 2024); belum ada keputusan konstruksi.' };
  const proyek = PROY.map((id) => {
    const g = gem.find((x) => x.id === id); const pid = g.pencocokan.proyek_id || null;
    return { id: 'prj-' + id, jenis: 'proyek', nama: g.nama, gem_id: g.id, proyek_id: pid, kode_prov: kode(g.provinsi), sistem_id: kode(g.provinsi) ? sistemDariProv(kode(g.provinsi)) : null, kapasitas_mw: g.kapasitas_mw, status_gem: g.status, tahun_mulai: g.tahun_mulai ?? null, pemilik: g.pemilik || [], lat: g.lat, lng: g.lon, akurasi_titik: g.akurasi, gardu_terdekat: terdekat(g.lat, g.lon), catatan: rencana[id] || null, sumber_id: 'gem-solar', tingkat_bukti: 'EST' };
  });
  const sama = (a, b) => a.toLowerCase().replace(/[^a-z]/g, '').includes(b.toLowerCase().replace(/[^a-z]/g, ''));
  const wd = waduk.map((w) => {
    const p = proyek.find((x) => (/karangkates/i.test(x.nama) && /kates\/sutami/i.test(w.nama)) || sama(x.nama, w.nama.split('/')[0]) && w.nama.length > 4);
    return { id: `waduk-${String(w.no).padStart(3, '0')}`, jenis: 'waduk', nama: w.nama, kode_prov: kode(w.provinsi), sistem_id: kode(w.provinsi) ? sistemDariProv(kode(w.provinsi)) : null, status_bendungan: w.status_bendungan, luas_ha: w.luas_ha, potensi_mw_20persen_luas: w.mw_20persen, proyek_id: p?.proyek_id || null, gem_id: p?.gem_id || null, sumber_id: 'ruptl-2025', halaman: 'Tabel 2.2', tingkat_bukti: 'Data', tingkat_bukti_mw: 'EST' };
  });
  const jml = round(waduk.reduce((a, b) => a + b.mw_20persen, 0), 0);
  return bungkus('plts_terapung', pilih('ruptl', 'gem'), [...wd, ...proyek], [
    `RUPTL Tabel 2.2 (surat Menteri PUPR 2 Agt 2023 dan ESDM 1 Des 2023): potensi dihitung 20% luas bendungan; teks menyebut 13,9 GW di 109 lokasi, diurai ${waduk.length} baris = ${jml} MW (Gembong tercatat dua kali di sumber, tidak dibuang).`,
    'Tabel PU tak memuat koordinat: jarak ke gardu hanya untuk proyek GEM berkoordinat dan dalam cakupan gardu.json (bbox OSM terbatas; Batam di luar cakupan, jarak null). Titik GEM "approximate".',
    'Cirata (192 MWp, 2023) tak ada di tabel PU; Saguling 60 MW, Singkarak 48-50 MW, Karangkates 100 MW dan Tembesi/Duriangkang berstatus sesuai GEM: status konstruksi terkini belum diverifikasi ke PLN/ACWA.',
  ], { ringkasan: { jumlah_waduk: wd.length, potensi_mw_20persen_luas: jml, klaim_ruptl_gw: 13.9, klaim_ruptl_lokasi: 109 } });
}

// 5. Biomassa dari CPO
function biomassa() {
  const F = { oer: 0.2, tkks_t_per_t_tbs: 0.23, cangkang_t_per_t_tbs: 0.055, serat_t_per_t_tbs: 0.14, pome_m3_per_t_tbs: 0.65, lhv_gj_per_t: { cangkang: 13.4, serat: 11.0, tkks: 4.4 }, pome_gj_per_m3_biogas: round(32e6 / 97.5e6, 3), jam: 8760 };
  const rp = j('public/data/ruptl.json').baris, pel = j('public/data/peluang.json').baris;
  const baris = Object.entries(SAWIT_2023).map(([k, [ha, cpo]]) => {
    const tbs = cpo / F.oer, tkks = tbs * F.tkks_t_per_t_tbs, cang = tbs * F.cangkang_t_per_t_tbs, serat = tbs * F.serat_t_per_t_tbs, pome = tbs * F.pome_m3_per_t_tbs;
    const gj = { cangkang: cang * F.lhv_gj_per_t.cangkang, serat: serat * F.lhv_gj_per_t.serat, tkks: tkks * F.lhv_gj_per_t.tkks, pome_biogas: pome * F.pome_gj_per_m3_biogas };
    const gjT = Object.values(gj).reduce((a, b) => a + b, 0); const nama = wil.find((w) => w.kode === k).nama;
    const p = pel.find((x) => x.kode === k)?.potensi?.bioenergi?.mw ?? null;
    return {
      kode_prov: k, provinsi: nama, sistem_id: sistemDariProv(k), luas_sawit_ha: ha, cpo_ton: cpo, tbs_ton_est: Math.round(tbs), tkks_ton_est: Math.round(tkks), cangkang_ton_est: Math.round(cang), serat_ton_est: Math.round(serat), pome_m3_est: Math.round(pome),
      energi_tj_per_tahun_est: round(gjT / 1000), mw_termal_setara_est: round(gjT / (F.jam * 3.6)),
      mw_termal_per_residu_est: Object.fromEntries(Object.entries(gj).map(([a, b]) => [a, round(b / (F.jam * 3.6))])),
      ruptl_bioenergi_mw: round(rp.filter((r) => ['bioenergi', 'biomassa-sampah'].includes(r.teknologi) && kode(r.provinsi) === k).reduce((a, r) => a + (r.kapasitas_mw || 0), 0)),
      ruen_bioenergi_mw: p, sumber_id: 'bps-sawit-2023', tingkat_bukti: 'EST', tingkat_bukti_cpo: 'Data',
    };
  });
  const jm = baris.reduce((a, b) => a + b.mw_termal_setara_est, 0);
  return bungkus('biomassa', pilih('bps', 'stich'), baris, [
    'Tingkat PROVINSI, bukan kabupaten: BPS menerbitkan produksi CPO per provinsi; tabel kabupaten (Ditjenbun) tidak ditemukan terbuka.',
    'MW = daya TERMAL setara (energi LHV tahunan / 8760 jam). Daya listrik bergantung efisiensi pembangkit dan fraksi residu yang tak terpakai (cangkang dan serat sudah jadi bahan bakar pabrik; TKKS sering dikembalikan ke lahan): tidak dikonversi ke MW listrik karena faktor bersumber tak ditemukan.',
    'Faktor residu dan LHV dari satu slide IEA Bioenergy 2016 (pabrik 30 t CPO/jam); POME 0,328 GJ/m3 diturunkan dari 32 PJ / 97.500 ribu m3 pada slide yang sama. TBS = CPO / 0,2 (rendemen 20% pada slide).',
    'Sekam padi (BPS produksi GKG), limbah kayu/penggergajian, dan bagasse tidak diperoleh: belum ada.',
    `Jumlah nasional BPS 2023: ${SAWIT_NASIONAL_2023.cpo_ton} t CPO; Papua (91) dan Papua Barat (92) memakai pembagian BPS 34 provinsi (Papua mencakup provinsi pemekaran).`,
  ], { faktor: F, ringkasan: { mw_termal_setara_total_est: round(jm, 0), cpo_ton_total: baris.reduce((a, b) => a + b.cpo_ton, 0) } });
}

// 6. Pumped storage dan angin lepas pantai
function ps_offshore() {
  const rp = j('public/data/ruptl.json').baris; const gem = j('public/data/gem_pembangkit.json').baris;
  const ps = [['Upper Cisokan', ['rp_147a83fa', 'rp_a33bfe1c'], 'gem-hydropower-L100000602154'], ['Matenggeng', ['rp_6b999c47'], 'gem-hydropower-L100000602130'], ['Grindulu', ['rp_af53f9d0'], 'gem-hydropower-L100000602110']].map(([n, ids, gid]) => {
    const r = ids.map((i) => rp.find((x) => x.id === i)); const g = gem.find((x) => x.id === gid);
    return { id: 'ps-' + n.toLowerCase().replace(/\s/g, '-'), jenis: 'pumped-storage', nama: n, kode_prov: kode(r[0].provinsi), sistem_id: 'jawabali', proyek_id: r[0].proyek_id, proyek_id_semua: r.map((x) => x.proyek_id), ruptl_id: ids, gem_id: gid, kapasitas_mw_ruptl: round(r.reduce((a, b) => a + b.kapasitas_mw, 0)), cod_ruptl: r.map((x) => x.cod_tahun[0]), status_ruptl: r[0].status, kapasitas_mw_gem: g.kapasitas_mw, status_gem: g.status, lat: g.lat, lng: g.lon, sumber_id: 'ruptl-2025', tingkat_bukti: 'Data' };
  });
  const lain = [
    { id: 'ps-jawa-barat-tersebar', jenis: 'pumped-storage', nama: 'PS tersebar Jawa Barat (disebut Jatiluhur 760 MW oleh sumber sekunder)', kode_prov: '32', sistem_id: 'jawabali', proyek_id: null, kapasitas_mw_ruptl: 760, sumber_id: 'ruptl-2025', halaman: 'Bab V (teks pumped storage Jawa-Bali)', tingkat_bukti: 'Data' },
  ];
  const offshore = [
    { id: 'owf-nasional-wb', jenis: 'angin-lepas-pantai', nama: 'Potensi teknis angin lepas pantai Indonesia (Bank Dunia)', kode_prov: null, wilayah: 'nasional; area disebut: selatan Jawa dekat Jakarta, Aceh, Natuna, Sulawesi, Indonesia timur', potensi_gw: 277, proyek_id: null, sumber_url: 'https://katadata.co.id/ekonomi-hijau/energi-baru/6a27fd9abe1b4/indonesia-miliki-277-gw-potensi-energi-angin-lepas-pantai-yang-belum-tersentuh', tanggal: '2026-06-09', tingkat_bukti: 'EST', catatan: 'Dikutip Katadata (9 Jun 2026) dari Bank Dunia; belum dicocokkan dengan peta ESMAP "Technical Potential for Offshore Wind in Indonesia" (2021). Potensi teknis = hanya kecepatan angin dan kedalaman laut.' },
    { id: 'owf-papua-selatan', jenis: 'angin-lepas-pantai', nama: 'Pesisir selatan Papua (kajian kebijakan PonderaSEA)', kode_prov: '93', wilayah: 'Papua Selatan (pesisir selatan)', potensi_gw: null, proyek_id: null, sumber_url: 'https://www.eeas.europa.eu/sites/default/files/documents/2024/Offshore%20Wind%20Opportunities%20in%20Indonesia%20-%20Executive%20Summary.pdf', tanggal: '2024-11-21', tingkat_bukti: 'Hipotesis', catatan: 'Hasil pencarian menyebut lebih dari 50 GW potensi teknis di pesisir selatan Papua; berkas PDF tak terbaca mesin, angka belum diverifikasi: potensi_gw dikosongkan.' },
  ];
  return bungkus('pumped_storage_offshore', [S.ruptl, { id: 'katadata-2026', judul: 'Indonesia Miliki 277 GW Potensi Energi Angin Lepas Pantai yang Belum Tersentuh', penerbit: 'Katadata', tahun: 2026, url: offshore[0].sumber_url, lisensi: 'Berita; dikutip dengan sumber', tingkat_bukti: 'EST' }, { id: 'ponderasea-2024', judul: 'Policy Recommendation Paper for Offshore Wind in Indonesia (Final Version)', penerbit: 'PonderaSEA (via EEAS)', tahun: 2024, url: offshore[1].sumber_url, lisensi: 'Dokumen publik; dikutip dengan sumber', tingkat_bukti: 'Hipotesis' }], [...ps, ...lain, ...offshore], [
    'Total pumped storage RUPTL 2025-2034 disebut sekitar 4,3 GW oleh sumber sekunder; di RUPTL yang diurai: Cisokan 1.040, Matenggeng 943, Grindulu 1.000, tersebar Jawa Barat 760 MW. Sumatera Utara PS 500 MW hanya dari berita (tidak dimasukkan). Dokumen Bank Dunia lama menyebut Matenggeng +-880 MW (RUPTL 943,2).',
    'Angin lepas pantai: tak ada proyek GEM, tak ada lokasi studi per provinsi yang terverifikasi, tak ada angka MW per lokasi. Status Upper Cisokan terbaru (2025-2026) hanya dari berita sekunder.',
  ]);
}

// 7. Tenaga kerja
function tenaga_kerja() {
  const k = j('public/data/kerja.json'); const lsp = k.lsp;
  const baris = Object.entries(k.faktor.tabel).map(([t, f]) => ({
    teknologi: t, kunci_kerja: 'kerja.json#faktor.tabel.' + t, kode_prov: null,
    tahap: [
      { tahap: 'konstruksi', satuan: 'orang-tahun per MW', nilai_global: f.konstruksi, nilai_asia_est: round(f.konstruksi * k.faktor.pengali_asia, 1), lama_tahun: f.tahun_bangun },
      { tahap: 'operasi-pemeliharaan', satuan: 'orang per MW per tahun', nilai_global: f.om, nilai_asia_est: round(f.om * k.faktor.pengali_asia, 1) },
    ],
    lsp_id: lsp.filter((l) => l.teknologi.includes(t === 'hidro-besar' || t === 'hidro-kecil' ? 'hidro' : t === 'bioenergi' || t === 'biomassa-sampah' ? 'bioenergi' : t)).map((l) => l.id),
    sumber_id: 'rutovitz-2015', tingkat_bukti: 'EST',
  }));
  const banding = [
    { id: 'ilo-2020', uraian: 'Pekerja sektor EBT Indonesia 2020 (ILO)', nilai: 501092, satuan: 'orang', tahun: 2020, tingkat_bukti: 'EST', catatan: 'Dari hasil pencarian (lembar fakta ILO); berkas belum dibuka.' },
    { id: 'iesr-2030', uraian: 'Proyeksi pekerjaan EBT (IESR, kesiapan ketenagakerjaan)', nilai: { 2025: 630000, 2030: 740000, 2050: 1070000 }, satuan: 'orang', tahun: 2050, tingkat_bukti: 'EST', catatan: 'Ringkasan hasil pencarian; halaman iesr.or.id/en?p=99791 belum dibuka.' },
  ];
  const sertifikasi = [{ id: 'skkni-plts', uraian: 'SKKNI PLTS: perencanaan, pemasangan, pemeriksaan, pengoperasian, pemeliharaan', rujukan: 'Kompas.com 19 Jun 2025; Kepmenaker 166/2019 (pemasangan) disebut; nomor perencanaan 2017 terbaca rancu', url: 'https://lestari.kompas.com/read/2025/06/19/194300586/peluang-green-jobs-di-indonesia-besar-tapi-produktivitas-sdm-masih-rendah', tingkat_bukti: 'Hipotesis' }];
  return bungkus('tenaga_kerja', [...k.sumber.filter((s) => s.id === 'rutovitz-2015').map((s) => ({ ...s, lisensi: 'Riset akademik; dikutip dengan sumber' })), { id: 'iesr-ilo', judul: 'IESR dan ILO ringkasan (sekunder)', penerbit: 'IESR; ILO', tahun: 2024, url: 'https://iesr.or.id/en?p=99791', lisensi: 'Dikutip dengan sumber', tingkat_bukti: 'EST' }], baris, [
    'Faktor orang-tahun/MW diturunkan dari kerja.json (Rutovitz 2015 x pengali Asia 2,4 asumsi METI): tidak ada faktor khusus Indonesia dari IRENA/ILO/IESR yang ditemukan; jangan menghitung ulang di tempat lain.',
    'Jabatan per tahap proyek (mis. teknisi, penyelia) dan kode SKKNI/skema LSP per jabatan tidak ditemukan di sumber yang dapat dibaca; hanya SKKNI PLTS (sekunder) dan LSP BPSDM ESDM/PPSDM KEBTKE dari kerja.json.',
  ], { pembanding: banding, sertifikasi });
}

// 8. Daur ulang
function daur_ulang() {
  const ct = j('public/data/kapasitas_tren.json').baris.filter((b) => b.teknologi === 'surya' || b.taksonomi === 'surya');
  const cum = new Map(ct.map((b) => [b.tahun, b.kapasitas_mw]));
  const baris = [];
  for (let t = 2020; t <= 2040; t++) {
    const pens = (u) => cum.get(t - u) ?? (t - u > 2025 ? null : 0);
    baris.push({ tahun: t, kapasitas_pensiun_kumulatif_mw: { umur_25: pens(25), umur_30: pens(30) }, tingkat_bukti: 'EST', sumber_id: 'irenastat', rumus: 'kapasitas terpasang kumulatif tahun (t - umur) = kapasitas yang sudah melewati umur desain pada tahun t' });
  }
  const pelaku = [
    { id: 'ibc', nama: 'PT Indonesia Battery Corporation', org_id: 'p_c9b8bffbec', jenis: 'baterai-EV', status: 'rencana: membangun industri daur ulang baterai EV 2029-2030', url: 'https://www.cnbcindonesia.com/news/20260202191557-4-707548/ibc-siap-garap-proyek-daur-ulang-baterai-ev-di-2030', tingkat_bukti: 'EST' },
    { id: 'brin', nama: 'BRIN (pilot plant daur ulang baterai)', org_id: 'l_973f60de15', jenis: 'baterai-EV', status: 'pilot plant dikembangkan (2024)', url: 'https://lestari.kompas.com/read/2024/08/13/110000986/dukung-daur-ulang-baterai-brin-kembangkan-pabrik-percontohan', tingkat_bukti: 'EST' },
  ];
  return bungkus('daur_ulang', [S.irenastat, { id: 'iea-pvps-eol', judul: 'End-of-life management of PV panels (IEA PVPS Task 12 dan IRENA 2016): limbah kumulatif 1,7-8,0 Mt (2030), 60-78 Mt (2050); umur modul sekitar 30 tahun', penerbit: 'IEA PVPS', tahun: 2016, url: 'https://iea-pvps.org/key-topics/end-of-life-management-of-photovoltaic-panels-trends-in-pv-module-recycling-technologies/', lisensi: 'Dikutip dengan sumber', tingkat_bukti: 'EST' }, { id: 'ui-2023', judul: 'Policy and projection of solar PV waste management: Indonesia case (modul 25-30 tahun, inverter 10-15 tahun)', penerbit: 'Maharani, Nurcahyo, Gabriel (UI)', tahun: 2023, url: 'https://scholar.ui.ac.id/en/publications/policy-and-projection-of-solar-pv-waste-management-indonesia-case/', lisensi: 'Abstrak publik; dikutip dengan sumber', tingkat_bukti: 'EST' }], baris, [
    'TONASE TIDAK DIHITUNG: faktor massa modul per MW tidak ditemukan pada sumber IRENA/IEA PVPS yang dapat dibaca (IRENA 403). Yang dikeluarkan hanya MW yang melewati umur desain, dari riwayat terpasang IRENASTAT.',
    'Proyeksi sampai 2040 dengan umur 25-30 tahun hanya bergantung pada pemasangan sampai 2015 (Indonesia sangat kecil); gelombang besar baru setelah 2050. Skenario kehilangan dini (early-loss) tak dimodelkan.',
    'Pembanding tak terverifikasi: studi UGM (sekunder) menaksir 996 t (2025) dan 1,5 Mt kumulatif 2050; belum dibuka berkasnya.',
    'Limbah baterai (BESS dan EV): tak ada riwayat/proyeksi bersumber. Pelaku daur ulang PANEL SURYA yang beroperasi tidak ditemukan; yang ada hanya rencana/riset daur ulang baterai EV.',
  ], { pelaku, pembanding_global: { limbah_kumulatif_2030_mt: [1.7, 8.0], limbah_kumulatif_2050_mt: [60, 78], umur_modul_tahun: [25, 30], umur_inverter_tahun: [10, 15], sumber_id: 'iea-pvps-eol' } });
}

export function bangun() {
  const t = teksRuptl();
  const out = { jaringan: jaringan(), curtailment: curtailment(), permintaan_baru: permintaan(t), plts_terapung: terapung(t), biomassa: biomassa(), pumped_storage_offshore: ps_offshore(), tenaga_kerja: tenaga_kerja(), daur_ulang: daur_ulang() };
  return out;
}

if (process.argv[2] === '--selftest') {
  assert.equal(round(1.26), 1.3); assert.ok(hav(0, 0, 0, 1) > 111 && hav(0, 0, 0, 1) < 112);
  console.log('selftest ok');
} else {
  const o = bangun(); for (const [k, v] of Object.entries(o)) { tulis(k, v); console.log(k, v.baris.length); }
}
