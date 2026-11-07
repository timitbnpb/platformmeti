// Pengayaan berita: wilayah (provinsi/kabupaten), proyek, dan regulasi yang disebut.
// Teks pencocokan = judul + ringkasan (og:description/RSS, disimpan di data-panen/berita/ringkas.json, TIDAK pernah ke public; lihat berita_foto.mjs).
// Dipanggil dari scripts/pipa/potret.mjs tiap bangun (perkaya) dan bisa dijalankan sendiri: node scripts/panen/berita_wilayah.mjs
// Nama pendek (<= 5 huruf) atau ambigu butuh awalan "Kab./Kabupaten/Kota". Proyek bernama dikenali dari nama (>= 16 huruf) dan memberi provinsinya.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const AKAR = fileURLToPath(new URL('../..', import.meta.url));
const pusat = JSON.parse(readFileSync(AKAR + 'data/geo/pusat-wilayah.json', 'utf8'));
const norm = (s) => ' ' + String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^0-9a-z]+/g, ' ').trim() + ' ';
const SINGKAT = { kaltim: 'Kalimantan Timur', kalsel: 'Kalimantan Selatan', kalbar: 'Kalimantan Barat', kalteng: 'Kalimantan Tengah', kaltara: 'Kalimantan Utara', sumut: 'Sumatera Utara', sumbar: 'Sumatera Barat', sumsel: 'Sumatera Selatan', sultra: 'Sulawesi Tenggara', sulsel: 'Sulawesi Selatan', sulteng: 'Sulawesi Tengah', sulut: 'Sulawesi Utara', sulbar: 'Sulawesi Barat', jabar: 'Jawa Barat', jateng: 'Jawa Tengah', jatim: 'Jawa Timur', ntt: 'Nusa Tenggara Timur', ntb: 'Nusa Tenggara Barat' };

const prov = Object.entries(pusat.adm1).map(([nama, v]) => ({ nama, n: norm(nama), lat: v.lat, lng: v.lng }));
const provByNama = new Map(prov.map((p) => [p.nama, p]));
const cacahNama = {}; for (const k of pusat.adm2) cacahNama[k.nama] = (cacahNama[k.nama] || 0) + 1;
const kab = pusat.adm2.map((k) => ({ ...k, n: norm(k.asli), kuat: k.nama.length >= 6 && cacahNama[k.nama] === 1, awalan: new RegExp(` (kab|kabupaten|kota) ${k.nama} `) }));

// Lokasi terkenal (proyek/fasilitas) -> kabupaten/kota (nama `asli` di pusat-wilayah). Hanya yang tidak ambigu; yang tak ditemukan di adm2 dilewati.
const TEMPAT = [['Cirata', 'Purwakarta'], ['Saguling', 'Bandung Barat'], ['Kamojang', 'Garut'], ['Legok Nangka', 'Bandung'], ['Piyungan', 'Bantul'], ['Bantargebang', 'Kota Bekasi'], ['Jatigede', 'Sumedang'], ['Dieng', 'Banjarnegara'], ['Patuha', 'Bandung'], ['Wayang Windu', 'Bandung'], ['Gunung Ungaran', 'Semarang'], ['Sarulla', 'Tapanuli Utara'], ['Muara Laboh', 'Solok Selatan'], ['Rantau Dedap', 'Muara Enim'], ['Lahendong', 'Kota Tomohon'], ['Ulubelu', 'Tanggamus'], ['Sorik Marapi', 'Mandailing Natal'], ['Sidrap', 'Sidenreng Rappang'], ['Mandalika', 'Lombok Tengah'], ['Tanjung Jati', 'Jepara'], ['Suralaya', 'Kota Cilegon'], ['Paiton', 'Probolinggo'], ['IKN', 'Penajam Paser Utara'], ['Ibu Kota Nusantara', 'Penajam Paser Utara'], ['Batam', 'Kota Batam'], ['Jembrana', 'Jembrana']];
const tempat = TEMPAT.map(([t, a]) => ({ n: norm(t), k: pusat.adm2.find((k) => k.asli === a) })).filter((x) => x.k);
// Alias provinsi yang lazim di judul.
const ALIAS_PROV = [['jakarta', 'DKI Jakarta'], ['yogyakarta', 'DI Yogyakarta'], ['jogja', 'DI Yogyakarta'], ['diy', 'DI Yogyakarta'], ['babel', 'Kepulauan Bangka Belitung'], ['bangka belitung', 'Kepulauan Bangka Belitung'], ['kepri', 'Kepulauan Riau']];

/** Wilayah yang disebut di satu teks (kabupaten dahulu, lalu provinsi yang belum terwakili). */
export function wilayahDari(teks) {
  const n = norm(teks), hasil = new Map();
  for (const k of kab) if (n.includes(k.n) && (k.kuat || k.awalan.test(n))) hasil.set(k.provinsi + '|' + k.asli, { prov: k.provinsi, kab: k.asli, lat: k.lat, lng: k.lng });
  for (const t of tempat) if (n.includes(t.n)) hasil.set(t.k.provinsi + '|' + t.k.asli, { prov: t.k.provinsi, kab: t.k.asli, lat: t.k.lat, lng: t.k.lng });
  const ada = () => new Set([...hasil.values()].map((x) => x.prov));
  for (const [a, nama] of ALIAS_PROV) { const p = provByNama.get(nama); if (p && n.includes(' ' + a + ' ') && !ada().has(nama)) hasil.set(nama, { prov: nama, lat: p.lat, lng: p.lng }); }
  for (const p of prov) if (n.includes(p.n) && !ada().has(p.nama)) hasil.set(p.nama, { prov: p.nama, lat: p.lat, lng: p.lng });
  for (const [s, nama] of Object.entries(SINGKAT)) { const p = provByNama.get(nama); if (p && n.includes(' ' + s + ' ') && !ada().has(nama)) hasil.set(nama, { prov: nama, lat: p.lat, lng: p.lng }); }
  return [...hasil.values()];
}

const ALIAS = [ // [pola, id regulasi]
  [/\bRUU\s*(EBET|EBT|Energi Baru)/i, 'lokal-431'], [/\bPerpres\s*EBT\b/i, 'perpres-112-2022'], [/\bUU\s*Cipta Kerja\b|\bomnibus law\b/i, 'uu-6-2023'],
  [/\bKebijakan Energi Nasional\b/i, 'pp-40-2025'], [/\bnilai ekonomi karbon\b|\bNEK\b/i, 'perpres-110-2025'], [/\bPSEL\b|sampah (menjadi|jadi) (energi|listrik)/i, 'perpres-109-2025'],
  [/\bUU\s*Panas Bumi\b/i, 'uu-21-2014'], [/\bUU\s*Ketenagalistrikan\b/i, 'uu-30-2009'], [/\bPLTS atap\b|\bPermen ESDM 2\/2024\b/i, 'permen-esdm-2-2024'],
];
const RX_REG = /\b(UU|Perpres|PP|Permen|Perppu|Keppres|Inpres|Kepmen)\s*(ESDM\s*)?(?:No\.?|Nomor)?\s*(\d{1,3})\s*(?:\/|\s*Tahun\s*)\s*(\d{4})/gi;

const TEK = { 'panas-bumi': /\b(pltp|panas bumi|geotermal|geothermal)\b/, surya: /\b(plts|surya|solar|pv)\b/, hidro: /\b(plta|pltm|pltmh|hidro|hydro|air|bendungan)\b/, bayu: /\b(pltb|bayu|angin|wind)\b/, bioenergi: /\b(pltbm|pltbg|biomassa|biogas|bioenergi)\b/, 'biomassa-sampah': /\b(psel|pltsa|sampah|waste)\b/ };
const STOP = new Set(['plt', 'pltp', 'plts', 'plta', 'pltm', 'pltmh', 'pltb', 'pltbm', 'pltbg', 'pltsa', 'psel', 'bess', 'ps', 'power', 'station', 'plant', 'hydro', 'hydroelectric', 'geothermal', 'project', 'dam', 'unit', 'ftp2', 'ftp', 'pu', 'ii', 'iii', 'iv', 'psn', 'nomor', 'energi', 'asal', 'sampah', 'of', 'the', 'and', 'merah', 'putih', 'hybrid', 'isolated']);
const namaProv = new Set(prov.map((p) => p.n.trim()));
/** Alias proyek: frasa khas lokasi (nama + nama_lain tanpa awalan teknologi) + teknologi; frasa milik >1 proyek dibuang. */
function aliasProyek(proyek) {
  const peta = new Map();
  for (const p of proyek) {
    const tek = TEK[p.teknologi]; if (!tek) continue;
    for (const nm of [p.nama, ...(p.nama_lain || [])]) {
      const d = norm(String(nm).replace(/\([^)]*\)/g, ' ')).trim().split(' ').filter((t) => t && !STOP.has(t) && !/^\d+$/.test(t)).join(' ');
      if (d.length < 6 || namaProv.has(d)) continue;
      const k = ' ' + d + ' '; (peta.get(k) || peta.set(k, new Map()).get(k)).set(p.id, tek);
    }
  }
  return [...peta].filter(([, m]) => m.size === 1).map(([n, m]) => ({ n, id: [...m.keys()][0], tek: [...m.values()][0] }));
}
const kabDari = (l) => { const v = l?.kabupaten_kota?.[0]?.nilai; if (!v || l.presisi !== 'kabupaten') return null; return pusat.adm2.find((k) => k.asli === v && k.provinsi === l.provinsi) || null; };

/** Konteks pencocokan dari baris publik proyek.json dan regulasi.json. */
export function bangunKonteks({ proyek, regulasi }) {
  const regById = new Set(regulasi.map((r) => r.id));
  const namaProyek = proyek.filter((p) => p.lokasi?.provinsi && provByNama.has(p.lokasi.provinsi)).map((p) => ({ id: p.id, prov: p.lokasi.provinsi, n: norm(p.nama) })).filter((x) => x.n.trim().length >= 16);
  const lokasi = new Map(proyek.map((p) => [p.id, p.lokasi]));
  return { regById, namaProyek, aliasProyek: aliasProyek(proyek), lokasi };
}

/** Hasil pengayaan satu berita: { wilayah, proyek_ids, regulasi_ids } (judul diutamakan; ringkasan hanya menambah). */
export function perkaya(judul, ringkas, ctx) {
  const teks = judul + ' . ' + (ringkas || ''), n = norm(teks);
  const w = new Map();
  for (const x of [...wilayahDari(judul), ...wilayahDari(ringkas || '')]) { const k = x.prov + '|' + (x.kab || ''); if (!w.has(k)) w.set(k, x); }
  const proyek_ids = [];
  for (const p of ctx.namaProyek) if (n.includes(p.n)) { proyek_ids.push(p.id); const pv = provByNama.get(p.prov); if (![...w.values()].some((x) => x.prov === p.prov)) w.set(p.prov + '|', { prov: p.prov, lat: pv.lat, lng: pv.lng }); }
  for (const a of ctx.aliasProyek || []) if (n.includes(a.n) && a.tek.test(n) && !proyek_ids.includes(a.id)) {
    proyek_ids.push(a.id); const l = ctx.lokasi.get(a.id), k = kabDari(l), pv = provByNama.get(l?.provinsi);
    if (k) w.set(k.provinsi + '|' + k.asli, { prov: k.provinsi, kab: k.asli, lat: k.lat, lng: k.lng }); else if (pv && ![...w.values()].some((x) => x.prov === l.provinsi)) w.set(l.provinsi + '|', { prov: l.provinsi, lat: pv.lat, lng: pv.lng });
  }
  const reg = new Set();
  for (const m of teks.matchAll(RX_REG)) { const j = m[1].toLowerCase(), id = [`${j}-${m[3]}-${m[4]}`, `${j}-esdm-${m[3]}-${m[4]}`, `${j === 'kepmen' ? 'kepmen-esdm' : j}-${m[3]}-${m[4]}`].find((i) => ctx.regById.has(i)); if (id) reg.add(id); }
  for (const [pola, id] of ALIAS) if (pola.test(teks) && ctx.regById.has(id)) reg.add(id);
  return { wilayah: [...w.values()].slice(0, 4), proyek_ids, regulasi_ids: [...reg] };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pub = (f) => JSON.parse(readFileSync(AKAR + 'public/data/' + f, 'utf8'));
  const d = pub('berita.json'), ctx = bangunKonteks({ proyek: pub('proyek.json').baris, regulasi: pub('regulasi.json').baris });
  const jr = AKAR + 'data-panen/berita/ringkas.json', ringkas = existsSync(jr) ? JSON.parse(readFileSync(jr, 'utf8')) : {};
  let nw = 0, nr = 0, np = 0, nrk = 0;
  for (const r of d.baris) {
    const o = perkaya(r.judul, ringkas[r.id], ctx); if (ringkas[r.id]) nrk++;
    o.wilayah.length ? (r.wilayah = o.wilayah, nw++) : delete r.wilayah;
    o.regulasi_ids.length ? (r.regulasi_ids = o.regulasi_ids, nr++) : delete r.regulasi_ids;
    if (o.proyek_ids.length) { r.proyek_ids = [...new Set([...(r.proyek_ids || []), ...o.proyek_ids])]; np++; }
  }
  writeFileSync(AKAR + 'public/data/berita.json', JSON.stringify(d));
  console.log(`ringkasan ${nrk}/${d.baris.length}; wilayah ${nw} (${Math.round(nw / d.baris.length * 100)}%), proyek ${np}, regulasi ${nr}`);
}
