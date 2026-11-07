#!/usr/bin/env node
// public/data/lokasi_hijau.json: masukan mentah pencocok lokasi industri hijau (/lokasi-hijau). Offline; skor dihitung di peramban
// (public/lokasi_hijau_hitung.js) karena bergantung pilihan pengguna. Yang dibekukan di sini hanya fakta bersumber per kawasan dan provinsi.
//   node scripts/pipa/lokasi_hijau.mjs [YYYY-MM-DD]
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const AKAR = fileURLToPath(new URL('../../', import.meta.url));
const baca = (f) => JSON.parse(fs.readFileSync(AKAR + f, 'utf8'));
export const TEK = ['surya', 'bayu', 'hidro', 'panas-bumi', 'bioenergi'];
export const RADIUS_KM = 50;
const BIO = new Set(['bioenergi', 'biomassa-sampah']);
// Cakupan panen OSM (public/geo/gardu.json meta.cakupan_bbox, [S,W,N,E]); di luarnya jarak jaringan tidak dihitung.
export const pulauDari = (kode) => ({ 1: 'sumatera', 2: 'sumatera', 3: 'jawa', 5: 'bali-nusra', 6: 'kalimantan', 7: 'sulawesi', 8: 'maluku-papua', 9: 'maluku-papua' })[String(kode)[0]];
export const jarakKm = (a, b) => { // haversine
  const r = Math.PI / 180, dl = (b[0] - a[0]) * r, dg = (b[1] - a[1]) * r;
  const h = Math.sin(dl / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dg / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};
export function jarakSegmenKm(p, a, b) { // titik [lat,lng] ke ruas a-b, bidang datar lokal (cukup untuk puluhan km)
  const k = Math.cos((p[0] * Math.PI) / 180), X = (q) => (q[1] - p[1]) * k * 111.32, Y = (q) => (q[0] - p[0]) * 110.57;
  const [ax, ay, bx, by] = [X(a), Y(a), X(b), Y(b)], dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  const u = l2 ? Math.max(0, Math.min(1, (-ax * dx - ay * dy) / l2)) : 0;
  return Math.hypot(ax + u * dx, ay + u * dy);
}
export const dalamBbox = (p, bbox) => bbox.some(([s, w, n, e]) => p[0] >= s && p[0] <= n && p[1] >= w && p[1] <= e);
const ALIAS = [['Bali', '51'], ['Cikarang', '32'], ['Bekasi', '32']]; // lokasi PPA yang menyebut kota/pulau
const PULAU_PPA = [['Pulau Jawa', 'jawa'], ['Sumatera', 'sumatera'], ['Kalimantan', 'kalimantan'], ['Sulawesi', 'sulawesi']];
export function lokasiPpa(teks, prov) { // -> { kode: [..], pulau: [..] } dari teks lokasi bebas
  const s = String(teks || ''), kode = new Set(), pulau = new Set();
  for (const w of [...prov].sort((a, b) => b.nama.length - a.nama.length)) if (s.includes(w.nama)) kode.add(w.kode);
  for (const [k, v] of ALIAS) if (new RegExp('\\b' + k + '\\b').test(s)) kode.add(v);
  for (const [k, v] of PULAU_PPA) if (s.includes(k) && ![...kode].some((c) => pulauDari(c) === v)) pulau.add(v);
  return { kode: [...kode], pulau: [...pulau] };
}
const bulat = (x, d = 1) => (x == null ? null : Math.round(x * 10 ** d) / 10 ** d);
const rata = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

export function bangun(tgl = new Date().toISOString().slice(0, 10)) {
  const W = baca('public/data/wilayah.json').baris, kodeDari = new Map(W.map((w) => [w.nama, w.kode]));
  const atlas = new Map(baca('public/data/potensi_atlas.json').baris.map((b) => [b.kode, b]));
  const pel = new Map(baca('public/data/peluang.json').baris.map((b) => [b.kode, b]));
  const izin = new Map(baca('public/data/perizinan_provinsi.json').baris.map((b) => [b.kode, b]));
  const bpp = baca('public/data/biaya_listrik.json').bpp_sistem;
  const PR = baca('public/data/proyek.json').baris, KOR = baca('public/data/korporat.json');
  const KW = baca('public/data/kawasan.json');
  const gardu = baca('public/geo/gardu.json'), trans = baca('public/geo/transmisi.json'), bbox = gardu.meta.cakupan_bbox;

  const proyekEbt = PR.filter((p) => p.lokasi?.provinsi && ['beroperasi', 'konstruksi'].includes(p.status?.[0]?.nilai) && (TEK.includes(p.teknologi) || BIO.has(p.teknologi)))
    .map((p) => ({ id: p.id, nama: p.nama, tek: BIO.has(p.teknologi) ? 'bioenergi' : p.teknologi, prov: p.lokasi.provinsi, kode: kodeDari.get(p.lokasi.provinsi) ?? null, status: p.status[0].nilai,
      mw: p.kapasitas?.[0]?.satuan === 'MW' ? p.kapasitas[0].nilai : null, presisi: p.lokasi.presisi ?? null, lat: p.lokasi.lat, lng: p.lokasi.lng }));

  const ppa = KOR.ppa.map((p) => ({ id: p.id, pembeli: p.pembeli, skema: p.skema, mw: p.mw, teknologi: p.teknologi, lokasi: p.lokasi, tingkat_bukti: p.tingkat_bukti, url: p.sumber?.url ?? null, ...lokasiPpa(p.lokasi, W.map((w) => ({ nama: w.nama, kode: w.kode }))) }))
    .filter((p) => p.kode.length || p.pulau.length);

  const provinsi = W.map((w) => {
    const sis = bpp.filter((s) => s.provinsi.includes(w.kode)).map((s) => { const th = Object.keys(s.rp_kwh).sort().at(-1); return { nama: s.nama, tahun: Number(th), rp_kwh: s.rp_kwh[th] }; });
    const pe = pel.get(w.kode)?.potensi ?? {}, pm = (k) => pe[k]?.mw ?? null;
    const pr = proyekEbt.filter((p) => p.kode === w.kode);
    return { kode: w.kode, nama: w.nama, pulau: pulauDari(w.kode), pvout: atlas.get(w.kode)?.pvout_kwh_per_kwp_tahun ?? null,
      potensi_mw: { surya: pm('surya'), bayu: pm('bayu'), hidro: pm('hidro'), 'panas-bumi': pm('panas_bumi'), bioenergi: pm('bioenergi') },
      bpp: sis.length ? { rp_kwh: bulat(rata(sis.map((s) => s.rp_kwh))), tahun: Math.max(...sis.map((s) => s.tahun)), sistem: sis.map((s) => s.nama) } : null,
      izin: izin.get(w.kode)?.skor ?? null,
      proyek: Object.fromEntries(TEK.map((k) => { const a = pr.filter((p) => p.tek === k); return [k, { n: a.length, mw: bulat(a.reduce((x, p) => x + (p.mw || 0), 0)) }]; })) };
  });

  const garis = trans.garis.map((g) => ({ kv: g.teg_kv, nama: g.nama, k: g.koordinat.map(([x, y]) => [y, x]) }));
  const kawasan = KW.baris.map((k) => {
    const kode = kodeDari.get(k.provinsi); if (!kode) throw new Error('provinsi tak dikenal: ' + k.provinsi + ' (' + k.id + ')');
    const titik = k.jenis === 'kek' ? k.lat != null : false; // KEK: titik kantor resmi; KI HKI: pusat kabupaten, bukan lokasi kawasan
    const p = k.lat != null ? [k.lat, k.lng] : null;
    const o = { id: k.id, jenis: k.jenis, nama: k.nama, provinsi: k.provinsi, kode, pulau: pulauDari(kode), lat: k.lat, lng: k.lng, titik_tepat: titik,
      luas_ha: k.luas_ha ?? null, kegiatan: k.kegiatan ?? null, sektor: k.sektor, pengelola: k.pengelola ?? null, url: k.url, tingkat_bukti: k.tingkat_bukti };
    if (titik && dalamBbox(p, bbox)) {
      let g = null; for (const x of gardu.gardu) { const d = jarakKm(p, [x.lat, x.lng]); if (!g || d < g.km) g = { km: d, nama: x.nama, kv: x.teg_kv }; }
      let l = null; for (const ln of garis) for (let i = 1; i < ln.k.length; i++) { const d = jarakSegmenKm(p, ln.k[i - 1], ln.k[i]); if (!l || d < l.km) l = { km: d, nama: ln.nama, kv: ln.kv }; }
      o.jaringan = { gardu_km: bulat(g?.km), gardu: g?.nama ?? null, gardu_kv: g?.kv ?? null, saluran_km: bulat(l?.km), saluran: l?.nama ?? null, saluran_kv: l?.kv ?? null };
    } else o.jaringan = null;
    o.proyek_dekat = titik ? proyekEbt.filter((x) => x.presisi === 'titik_persis' && x.lat != null).map((x) => ({ x, d: jarakKm(p, [x.lat, x.lng]) })).filter((x) => x.d <= RADIUS_KM)
      .sort((a, b) => a.d - b.d).map(({ x, d }) => ({ id: x.id, nama: x.nama, tek: x.tek, mw: x.mw, status: x.status, km: bulat(d) })) : null;
    return o;
  });

  const re = (m) => m.match(/^\d{4}-\d{2}-\d{2}$/);
  return {
    lapis: 'publik', dibangun_pada: re(tgl) ? tgl : new Date().toISOString().slice(0, 10), hipotesis: true, radius_km: RADIUS_KM,
    sumber: [
      { id: 'kawasan', judul: 'Kawasan industri dan KEK (kawasan.json: HKI dan kek.go.id)', penerbit: 'HKI; Dewan Nasional KEK', url: '/data/kawasan.json' },
      { id: 'atlas', judul: 'Global Solar Atlas 2.0 (PVOUT per provinsi, titik ibu kota)', penerbit: 'World Bank Group / ESMAP, Solargis', url: 'https://globalsolaratlas.info/' },
      { id: 'ruen', judul: 'Potensi EBT per provinsi (RUEN 2015; panas bumi Badan Geologi 2025), peluang.json', penerbit: 'DEN; ESDM', url: '/data/peluang.json' },
      { id: 'osm', judul: 'Gardu dan saluran 150 kV ke atas (OpenStreetMap, ODbL)', penerbit: 'Kontributor OpenStreetMap', url: 'https://www.openstreetmap.org/copyright' },
      { id: 'bpp', judul: 'BPP pembangkitan per sistem (biaya_listrik.json, Kepmen ESDM)', penerbit: 'Kementerian ESDM', url: '/data/biaya_listrik.json' },
      { id: 'izin', judul: 'Indeks perizinan provinsi (Hipotesis, perizinan_provinsi.json)', penerbit: 'Platform Jaringan METI', url: '/data/perizinan_provinsi.json' },
      { id: 'proyek', judul: 'Proyek EBT beroperasi dan konstruksi (proyek.json)', penerbit: 'Platform Jaringan METI', url: '/data/proyek.json' },
      { id: 'korporat', judul: 'PPA, REC, dan PLTS atap korporat (korporat.json)', penerbit: 'Platform Jaringan METI', url: '/data/korporat.json' } ],
    ppa, provinsi, kawasan,
    meta: { diperbarui: tgl, jumlah: kawasan.length, jumlah_titik_tepat: kawasan.filter((k) => k.titik_tepat).length, jumlah_jaringan: kawasan.filter((k) => k.jaringan).length,
      celah: [
        'Kemenperin (SIINas) 502 dan tidak terjangkau pada 8 Nov 2026: daftar kawasan industri masih Member Directory HKI (anggota saja, bukan seluruh kawasan nasional).',
        'Hanya KEK yang punya titik kantor resmi; kawasan industri HKI paling jauh berkoordinat pusat kabupaten atau kosong, sehingga jarak jaringan dan proyek dalam radius tidak dihitung untuknya.',
        'OSM gardu dan saluran hanya mencakup empat ubin (Jawa, Sumatera bagian selatan dan tengah, Kalimantan barat daya); di luarnya komponen jarak dikeluarkan. OSM dipetakan sukarelawan dan tidak lengkap.',
        'Potensi EBT RUEN 2015 dan PVOUT titik ibu kota provinsi: gambaran provinsi, bukan hasil studi di lokasi kawasan.',
        'BPP sistem tahun terbaru yang tersedia (2020); skema PPA/REC tidak punya data per kawasan, hanya contoh kontrak korporat yang diumumkan.',
        'Data risiko proyek per wilayah belum tersedia di repo; komponen risiko dikeluarkan.' ] },
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const d = bangun(process.argv[2]); fs.writeFileSync(AKAR + 'public/data/lokasi_hijau.json', JSON.stringify(d) + '\n');
  console.log(d.meta.jumlah, 'kawasan;', d.meta.jumlah_titik_tepat, 'titik tepat;', d.meta.jumlah_jaringan, 'dengan jarak jaringan;', d.ppa.length, 'PPA terpetakan');
}
