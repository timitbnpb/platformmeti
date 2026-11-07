// public/data/captive_power.json: PLTU captive industri (unit batubara GEM berkolom captive) + kawasan smelter + analisa konversi EBT.
//   node scripts/pipa/captive_power.mjs            (tulis berkas; tanpa jaringan, membaca data/strategis/pltu.json dan potret publik)
//   node scripts/pipa/captive_power.mjs --selftest
// Semua angka turunan berlabel EST; parameter terbuka di keluaran (parameter). Tanpa em dash.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { idEntitas } from './entitas_tambah.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baca = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

/* Parameter terbuka (Hipotesis). Faktor kapasitas EBT = kisaran umum Indonesia, bukan studi tapak. */
export const PARAMETER = {
  fk_batubara: 0.85,   // faktor kapasitas PLTU captive beban dasar bila listrik aktual tidak ada
  bauran: { surya: 0.45, bayu: 0.15, firm: 0.40 }, // bagian ENERGI (bukan MW) yang digantikan tiap kelompok
  fk_ebt: { surya: 0.17, bayu: 0.28, firm: 0.60 }, // firm = PLTA / panas bumi / hibrida dengan simpanan
  faktor_emisi_default: 0.95, // tCO2e per MWh PLTU captive bila tak ada data Climate TRACE
  jam: 8760,
  catatan: 'Penyimpanan baterai, transmisi, dan lahan tidak dihitung; MW EBT adalah MW nameplate yang menghasilkan energi tahunan sama dengan PLTU yang diganti.',
};

/* Zona kawasan smelter (titik pusat tangan dari koordinat unit GEM; radius km). kawasan_id = id di public/data/kawasan.json. */
export const ZONA = [
  { id: 'imip', nama: 'IMIP Morowali (Bahodopi)', kawasan_id: 'ki_morowali_dir', prov: 'Sulawesi Tengah', kode: '72', lat: -2.86, lng: 122.17, r: 40 },
  { id: 'morut', nama: 'Morowali Utara (GNI, IHIP)', kawasan_id: null, prov: 'Sulawesi Tengah', kode: '72', lat: -2.1, lng: 121.55, r: 50 },
  { id: 'konawe', nama: 'Konawe Morosi (VDNI, OSS)', kawasan_id: 'ki_indonesiakonawe_dir', prov: 'Sulawesi Tenggara', kode: '74', lat: -3.86, lng: 122.45, r: 30 },
  { id: 'pomalaa', nama: 'Kolaka Pomalaa', kawasan_id: 'ki_indonesiapomalaaindustry_dir', prov: 'Sulawesi Tenggara', kode: '74', lat: -4.18, lng: 121.59, r: 25 },
  { id: 'iwip', nama: 'IWIP Weda Bay', kawasan_id: 'ki_indonesiawedabay_dir', prov: 'Maluku Utara', kode: '82', lat: 0.48, lng: 128.0, r: 30 },
  { id: 'obi', nama: 'Pulau Obi', kawasan_id: 'ki_pulauobi_dir', prov: 'Maluku Utara', kode: '82', lat: -1.55, lng: 127.42, r: 25 },
  { id: 'sorowako', nama: 'Sorowako (Vale)', kawasan_id: null, prov: 'Sulawesi Selatan', kode: '73', lat: -2.55, lng: 121.36, r: 30 },
  { id: 'kaltara', nama: 'Kaltara KIPI (Tanah Kuning)', kawasan_id: 'ki_delma_dir', prov: 'Kalimantan Utara', kode: '65', lat: 2.5, lng: 117.9, r: 60 },
  { id: 'bintan', nama: 'Bintan, Batam, Galang (Kepri)', kawasan_id: 'ki_kabil_dir', prov: 'Kepulauan Riau', kode: '21', lat: 0.95, lng: 104.4, r: 60 },
];
const INDUSTRI = [['nickel', 'nikel'], ['aluminum', 'aluminium'], ['iron & steel', 'baja'], ['cement', 'semen'], ['pulp', 'pulp-kertas'], ['chemicals', 'kimia'], ['textiles', 'tekstil'], ['industrial park', 'kawasan-industri'], ['other metals', 'logam-lain']];
const jenisIndustri = (c) => [...new Set(INDUSTRI.filter(([k]) => String(c).includes(k)).map(([, v]) => v))];

export const jarakKm = (a, b, c, d) => {
  const t = (x) => (x * Math.PI) / 180, h = Math.sin(t(c - a) / 2) ** 2 + Math.cos(t(a)) * Math.cos(t(c)) * Math.sin(t(d - b) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};
export const zonaDari = (lat, lng) => {
  let best = null;
  for (const z of ZONA) { const d = jarakKm(lat, lng, z.lat, z.lng); if (d <= z.r && (!best || d < best.d)) best = { z, d }; }
  return best ? best.z.id : null;
};

/** MW EBT sepadan untuk energi tahunan E (MWh). */
export function ebtSepadan(mwh, p = PARAMETER) {
  const per = (k) => (mwh * p.bauran[k]) / (p.jam * p.fk_ebt[k]);
  const surya = per('surya'), bayu = per('bayu'), firm = per('firm');
  return { surya, bayu, firm, total: surya + bayu + firm };
}
const norm = (x) => String(x || '').toLowerCase().replace(/\b(pt|tbk|persero|limited|ltd|co)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
/** nama -> {id, nama, logo} dari organisasi.json + entitas_tambah (id deterministik en_<sha1>, hidup setelah potret dibangun) */
export function petaOrg(org, entitas, idEntitas, logoAda = () => false) {
  const k = new Map();
  for (const o of org.baris) for (const n of [o.nama, ...(o.nama_lain || [])]) k.set(norm(n), { id: o.id, nama: o.nama, logo: o.logo && logoAda(o.logo) ? o.logo : null });
  for (const e of entitas.baris) { const id = idEntitas(e.nama); for (const n of [e.nama, ...(e.nama_lain || [])]) if (!k.has(norm(n))) k.set(norm(n), { id, nama: e.nama, logo: null }); }
  return (nama) => k.get(norm(nama)) || null;
}
const bulat = (x, d = 0) => (x === null || x === undefined ? null : Number(x.toFixed(d)));

export function bangun({ pltu, karbon, gem, proyek, korporat, tanggal, orgDari = () => null }) {
  const kb = new Map(karbon.baris.map((b) => [b.id, b]));
  const gr = new Map(); // pembangkit_id -> unit
  for (const u of pltu.unit) if (u.captive) (gr.get(u.pembangkit_id) ?? gr.set(u.pembangkit_id, []).get(u.pembangkit_id)).push(u);
  const induk = new Map(pltu.pembangkit.map((p) => [p.id, p]));
  const pembangkit = [];
  for (const [id, us] of gr) {
    const ind = induk.get(id) || {};
    const op = us.filter((u) => u.status === 'operating'), kon = us.filter((u) => u.status === 'construction');
    const ren = us.filter((u) => ['announced', 'pre-construction', 'permitted'].includes(u.status));
    if (!op.length && !kon.length && !ren.length) continue; // dibatalkan / ditunda / pensiun
    const j = (a) => a.reduce((s, u) => s + (u.kapasitas_mw || 0), 0);
    const pm = [...new Set(us.flatMap((u) => (u.pemilik || []).filter((o) => o.persen > 0).map((o) => o.nama)))];
    const th = op.map((u) => u.tahun_mulai).filter(Number.isFinite);
    const ct = ind.karbon_id ? kb.get(ind.karbon_id) : null;
    const lat = us[0].lat, lng = us[0].lon;
    pembangkit.push({
      id, nama: us[0].pembangkit, kota: us[0].kota ?? null, wilayah: us[0].wilayah ?? null, industri: jenisIndustri(us[0].captive), captive_ket: us[0].captive,
      pemilik: pm, pemilik_org: pm.map((n) => { const o = orgDari(n); return { nama: o?.nama || n, org_id: o?.id ?? null, logo: o?.logo ?? null }; }), status: op.length ? 'operasi' : kon.length ? 'konstruksi' : 'rencana', bahan_bakar: 'batubara', teknologi: [...new Set(us.map((u) => u.teknologi_pembakaran).filter((x) => x && x !== 'unknown'))],
      unit_operasi: op.length, mw_operasi: bulat(j(op), 1), mw_konstruksi: bulat(j(kon), 1), mw_rencana: bulat(j(ren), 1),
      tahun_mulai: th.length ? [Math.min(...th), Math.max(...th)] : null, lat, lng, akurasi: us[0].akurasi ?? null, zona: zonaDari(lat, lng),
      karbon_id: ct ? ct.id : null, mwh_aktual: ct?.aktivitas_mwh ?? null, emisi_tco2e: ct?.emisi_tco2e ?? null, emisi_tahun: ct?.tahun ?? null, faktor_emisi: ct?.faktor_emisi_tco2e_per_mwh ?? null,
      url_wiki: us[0].url_wiki ?? null, tingkat_bukti: 'via-pihak-ketiga',
    });
  }
  pembangkit.sort((a, b) => b.mw_operasi - a.mw_operasi || b.mw_konstruksi - a.mw_konstruksi);

  /* proyek konversi EBT: GEM (hibrida, surya, hidro rencana/operasi di zona) + PPA korporat bertanda kawasan smelter */
  const konversi = [];
  for (const b of gem.baris) {
    if (b.tracker === 'coal' || b.tracker === 'geothermal') continue;
    const z = zonaDari(b.lat, b.lon); if (!z) continue;
    const pm = (b.pemilik || []).filter(Boolean);
    if (/PLN/i.test(pm.join(' ')) && b.status === 'operating') continue;
    if (['cancelled', 'retired', 'shelved', 'mothballed'].includes(b.status)) continue;
    const pid = b.id.replace(/^gem-(\w+)-/, 'gem_$1_');
    konversi.push({ id: b.id, proyek_id: proyek.baris.some((q) => q.id === pid) ? pid : null, nama: b.nama, teknologi: { solar: 'surya', hydropower: 'hidro', wind: 'bayu' }[b.tracker] || b.tracker, mw: b.kapasitas_mw, status: b.status, zona: z, lat: b.lat, lng: b.lon, pemilik: pm, sumber: 'GEM', url: b.url_wiki ?? null, tingkat_bukti: 'via-pihak-ketiga' });
  }
  for (const pp of korporat.ppa) {
    if (!/morowali|weda|obi|konawe|halmahera|nikel|nickel/i.test(`${pp.lokasi} ${pp.pembeli}`)) continue;
    if (!konversi.some((k) => /Morowali Industrial Park solar/i.test(k.nama))) { /* PPA ini = proyek GEM yang sama, cukup tautkan */ }
    const k = konversi.find((x) => x.zona === 'imip' && x.teknologi === 'surya');
    if (k) { k.ppa = { id: pp.id, pembeli: pp.pembeli, mw: pp.mw, skema: pp.skema, tahun: pp.tahun, url: pp.sumber?.url ?? null, tingkat_bukti: pp.tingkat_bukti }; }
  }
  for (const p of proyek.baris) {
    if (p.id === 'pj_0310' || /Mentarang/i.test(p.nama)) {
      if (konversi.some((k) => k.id === p.id)) continue;
      const lat = p.lokasi?.lat ?? p.lokasi?.koordinat?.lat, lng = p.lokasi?.lng ?? p.lokasi?.koordinat?.lng;
      konversi.push({ id: p.id, proyek_id: p.id, nama: p.nama, teknologi: p.teknologi, mw: p.kapasitas?.[0]?.nilai ?? null, status: (p.status || [])[0]?.nilai ?? null, zona: /Mentarang/i.test(p.nama) ? 'kaltara' : 'iwip', pemilik: (p.pihak?.pemilik || []).map((x) => x.nilai), sumber: 'proyek', url: '/p/' + p.id, tingkat_bukti: p.tingkat_bukti ?? null, lat: lat ?? null, lng: lng ?? null });
    }
  }
  for (const k of konversi) k.zona_nama = ZONA.find((z) => z.id === k.zona)?.nama ?? null;
  konversi.sort((a, b) => (b.mw || 0) - (a.mw || 0));

  const kawasan = ZONA.map((z) => {
    const isi = pembangkit.filter((p) => p.zona === z.id);
    const op = isi.reduce((s, p) => s + p.mw_operasi, 0), kon = isi.reduce((s, p) => s + p.mw_konstruksi, 0), ren = isi.reduce((s, p) => s + p.mw_rencana, 0);
    let mwh = 0, aktual = 0;
    for (const p of isi) { if (!p.mw_operasi) continue; if (p.mwh_aktual) { mwh += p.mwh_aktual; aktual += p.mw_operasi; } else mwh += p.mw_operasi * PARAMETER.jam * PARAMETER.fk_batubara; }
    const emisi = isi.reduce((s, p) => s + (p.emisi_tco2e ?? (p.mw_operasi ? p.mw_operasi * PARAMETER.jam * PARAMETER.fk_batubara * PARAMETER.faktor_emisi_default : 0)), 0);
    const kon_z = konversi.filter((k) => k.zona === z.id);
    const ebtOp = kon_z.filter((k) => k.status === 'operating').reduce((s, k) => s + (k.mw || 0), 0);
    const e = ebtSepadan(mwh);
    return {
      ...z, jumlah_pembangkit: isi.length, mw_operasi: bulat(op, 1), mw_konstruksi: bulat(kon, 1), mw_rencana: bulat(ren, 1), pembangkit_ids: isi.map((p) => p.id),
      mw_aktual_terukur: bulat(aktual, 1), mwh_tahun: Math.round(mwh), emisi_tco2e: Math.round(emisi), pct_batubara: op + ebtOp > 0 ? bulat((op / (op + ebtOp)) * 100, 1) : null, ebt_operasi_mw: bulat(ebtOp, 1),
      ebt_sepadan_mw: { surya: bulat(e.surya), bayu: bulat(e.bayu), firm: bulat(e.firm), total: bulat(e.total) }, rasio_ebt_per_mw_batubara: op ? bulat(e.total / op, 2) : null,
      proyek_konversi_ids: kon_z.map((k) => k.id),
    };
  }).filter((k) => k.jumlah_pembangkit > 0);
  kawasan.sort((a, b) => b.emisi_tco2e - a.emisi_tco2e);
  kawasan.forEach((k, i) => { k.peringkat = i + 1; });

  const op = pembangkit.reduce((s, p) => s + p.mw_operasi, 0);
  const per_industri = {};
  for (const p of pembangkit) for (const i of p.industri.length ? p.industri : ['lainnya']) per_industri[i] = bulat((per_industri[i] || 0) + p.mw_operasi / (p.industri.length || 1), 1);
  return {
    lapis: 'captive_power', dibangun_pada: tanggal, parameter: PARAMETER,
    sumber: [
      { id: 'gem-coal', judul: 'Global Coal Plant Tracker (unit berkolom captive), via data/strategis/pltu.json', penerbit: 'Global Energy Monitor', url: 'https://globalenergymonitor.org/projects/global-coal-plant-tracker/', lisensi: 'CC BY 4.0', tingkat_bukti: 'via-pihak-ketiga' },
      { id: 'ct', judul: 'Climate TRACE v6 (aktivitas dan emisi aset pembangkit 2024), public/data/karbon.json', penerbit: 'Climate TRACE', url: 'https://climatetrace.org/', lisensi: 'CC BY 4.0', tingkat_bukti: 'via-pihak-ketiga' },
      { id: 'gem-ebt', judul: 'GEM Solar/Hydropower/Wind Tracker (proyek EBT dalam radius zona), public/data/gem_pembangkit.json', penerbit: 'Global Energy Monitor', url: 'https://globalenergymonitor.org/', lisensi: 'CC BY 4.0', tingkat_bukti: 'via-pihak-ketiga' },
      { id: 'kor', judul: 'PPA korporat (public/data/korporat.json), pengumuman ASX Nickel Industries 9 Okt 2023', penerbit: 'Nickel Industries Limited', url: 'https://announcements.asx.com.au/asxpdf/20231009/pdf/05vtqtfg19hgfc.pdf', tingkat_bukti: 'kata-pihak' },
    ],
    meta: {
      jumlah_pembangkit: pembangkit.length, mw_operasi: bulat(op, 1), mw_konstruksi: bulat(pembangkit.reduce((s, p) => s + p.mw_konstruksi, 0), 1), mw_rencana: bulat(pembangkit.reduce((s, p) => s + p.mw_rencana, 0), 1),
      mw_operasi_nikel: bulat(pembangkit.filter((p) => p.industri.includes('nikel')).reduce((s, p) => s + p.mw_operasi, 0), 1), per_industri,
      ebt_captive_operasi_mw: bulat(konversi.filter((k) => k.status === 'operating').reduce((s, k) => s + (k.mw || 0), 0), 1),
      pct_batubara: bulat((op / (op + konversi.filter((k) => k.status === 'operating').reduce((s, k) => s + (k.mw || 0), 0))) * 100, 1),
      emisi_tco2e_terukur: pembangkit.reduce((s, p) => s + (p.emisi_tco2e ?? 0), 0),
      catatan: 'Hanya unit batubara; captive EBT (mis. PLTA Vale) masuk lewat proyek_konversi. Kapasitas = jumlah unit GEM berstatus operasi/konstruksi/rencana per pembangkit.',
    },
    kawasan, pembangkit, proyek_konversi: konversi,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) {
    assert.ok(Math.abs(jarakKm(0, 0, 0, 1) - 111.2) < 1);
    const e = ebtSepadan(8760 * 100); // 100 MW rata-rata
    assert.ok(Math.abs(e.surya - (45 / 0.17)) < 1e-6 && e.total > 300 && e.total < 450);
    assert.equal(zonaDari(0.48, 128.0), 'iwip'); assert.equal(zonaDari(-7, 110), null);
    console.log('selftest captive_power ok');
  } else {
    const d = bangun({ pltu: baca('data/strategis/pltu.json'), karbon: baca('public/data/karbon.json'), gem: baca('public/data/gem_pembangkit.json'), proyek: baca('public/data/proyek.json'), korporat: baca('public/data/korporat.json'), tanggal: '2026-11-08', orgDari: petaOrg(baca('public/data/organisasi.json'), baca('data/direktori/entitas_tambah.json'), idEntitas, (l) => fs.existsSync(path.join(ROOT, 'public', l))) });
    fs.writeFileSync(path.join(ROOT, 'public/data/captive_power.json'), JSON.stringify(d, null, 1) + '\n');
    console.log('captive_power:', d.meta.jumlah_pembangkit, 'pembangkit,', d.meta.mw_operasi, 'MW operasi,', d.kawasan.length, 'kawasan,', d.proyek_konversi.length, 'proyek konversi');
  }
}
