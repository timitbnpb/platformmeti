// Pelengkap kartu sistem/provinsi kembaran jaringan: BPP, rencana RUPTL, penduduk dan konsumsi per kapita, elektrifikasi,
// potensi surya/angin, nama kota GeoNames. Murni dan deterministik; tiap angka membawa st/src/tgl dari barisnya.
// Dipanggil dari graf_jaringan.mjs bangun(); semua masukan opsional (tanpa masukan = tidak ada kartu tambahan).
const R = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const norm = (n) => String(n || '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
const PEMEKARAN = { 93: '91', 94: '91', 95: '91', 96: '92' }; // sama dengan bangun(): penjualan BPS 859 belum memisahkan pemekaran Papua 2022

// ---- Sumber tambahan untuk meta.sumber (id unik; yang sudah ada dibuang oleh pemanggil)
export function sumberPelengkap(ctx) {
  const o = [];
  if (ctx.biaya) for (const s of ctx.biaya.sumber || []) if (s.id === 's-bpp') o.push({ id: s.id, judul: s.judul, penerbit: s.penerbit, url: s.url, lisensi: s.lisensi, tanggal_data: '2021-09-08', tanggal_ambil: ctx.biaya.dibangun_pada ?? null });
  if (ctx.akses?.sumber?.['gatrik-2024']) { const s = ctx.akses.sumber['gatrik-2024']; o.push({ id: 'gatrik-2024', judul: s.judul, penerbit: s.penerbit, url: s.url, lisensi: 'publikasi pemerintah terbuka; atribusi ESDM', tanggal_data: '2024', tanggal_ambil: s.tanggal_ambil ?? null }); }
  for (const s of ctx.pelengkap?.sumber || []) o.push(s);
  for (const s of ctx.atlas?.sumber || []) o.push(s);
  if (ctx.geonames?.meta) { const m = ctx.geonames.meta; o.push({ id: m.sumber, judul: m.judul, penerbit: 'GeoNames', url: m.url, lisensi: m.lisensi, tanggal_data: null, tanggal_ambil: m.tanggal_ambil }); }
  return o;
}

// ---- GeoNames: kota/kabupaten terpadat dekat pusat sistem; tanpa penduduk tercatat -> yang terdekat. null bila tak ada dalam radius.
export function kotaTerdekat(geonames, cx, cy, radiusKm = 25) {
  if (!geonames?.kota?.length) return null;
  const dy = radiusKm / 111.32, dx = dy / Math.cos((cy * Math.PI) / 180), cand = [];
  for (const [nama, lat, lon, pop, kode] of geonames.kota) {
    if (Math.abs(lat - cy) > dy || Math.abs(lon - cx) > dx) continue;
    const km = Math.hypot((lon - cx) * 111.32 * Math.cos((cy * Math.PI) / 180), (lat - cy) * 111.32);
    if (km <= radiusKm) cand.push({ nama, pop, kode, km });
  }
  if (!cand.length) return null;
  const adaPop = cand.filter((c) => c.pop > 0);
  const [p] = (adaPop.length ? adaPop.sort((a, b) => b.pop - a.pop || a.km - b.km || cmp(a.nama, b.nama)) : cand.sort((a, b) => a.km - b.km || cmp(a.nama, b.nama)));
  return { nama: p.nama, penduduk: p.pop || null, km: R(p.km), kode_fitur: p.kode };
}

const PULAU_TERPISAH = new Set(['bangka', 'belitung']); // BPP 2020: Bangka dan Belitung sub-sistem pulau tersendiri
// ---- BPP pembangkitan per sistem (Kepmen ESDM; biaya_listrik.bpp_sistem). Nama persis = sumber; selain itu cocok lewat provinsi (hitung).
export function bppSistem(biaya, sistem /* [{id, nama, prov:[kode]}] */, tahun = 2020) {
  if (!biaya?.bpp_sistem?.length) return new Map();
  const nas = (biaya.bpp_nasional || []).find((x) => x.tahun === tahun), tgl = nas?.tanggal_penetapan ?? String(tahun), t = String(tahun);
  const rows = biaya.bpp_sistem.filter((r) => r.rp_kwh?.[t] != null), hasil = new Map(), pakai = new Map(), dikeluarkan = new Map(), hasilProv = new Map();
  for (const s of sistem) {
    const P = new Set(s.prov), nm = norm(s.nama), persis = rows.filter((r) => norm(r.nama) === nm);
    const kandidat = persis.length ? persis.map((r) => [r, 'nama']) : rows.filter((r) => r.provinsi.some((p) => P.has(p))).map((r) => [r, 'provinsi']); // irisan provinsi, bukan subset: "Kaltim dan Utara" ikut sistem yang tak memuat Kaltara
    const keluar = kandidat.filter(([r]) => PULAU_TERPISAH.has(r.kunci)), cocok = kandidat.filter(([r]) => !PULAU_TERPISAH.has(r.kunci));
    if (!cocok.length) continue;
    dikeluarkan.set(s.id, keluar.map(([r]) => ({ nama: r.nama, rp_kwh: r.rp_kwh[t], alasan: 'pulau dengan sub-sistem BPP tersendiri; sistem terpisah di peta kami (tak masuk rentang)' })));
    for (const [r] of cocok) pakai.set(r.kunci, (pakai.get(r.kunci) || 0) + 1);
    hasil.set(s.id, cocok); hasilProv.set(s.id, P);
  }
  const keluar = new Map();
  for (const [id, cocok] of hasil) {
    const luar = cocok.filter(([r, c]) => c === 'provinsi' && r.provinsi.some((p) => !hasilProv.get(id).has(p))).map(([r]) => r.nama), v = cocok.map(([r]) => r.rp_kwh[t]), tahunAda = [...new Set(cocok.flatMap(([r]) => Object.keys(r.rp_kwh)))].sort(), nama = cocok[0][1] === 'nama';
    const bersama = cocok.filter(([r]) => pakai.get(r.kunci) > 1).map(([r]) => r.nama);
    keluar.set(id, {
      tahun, rp_kwh_min: R(Math.min(...v), 2), rp_kwh_maks: R(Math.max(...v), 2), ...(nas?.rp_kwh != null ? { nasional_rp_kwh: nas.rp_kwh } : {}),
      baris: cocok.map(([r, cara]) => ({ nama: r.nama, rp_kwh: r.rp_kwh[t], provinsi: r.provinsi, cara_cocok: cara })).sort((a, b) => cmp(a.nama, b.nama)),
      per_tahun: Object.fromEntries(tahunAda.map((y) => { const q = cocok.map(([r]) => r.rp_kwh[y]).filter((x) => x != null); return [y, { min: R(Math.min(...q), 2), maks: R(Math.max(...q), 2), n: q.length }]; })),
      ...(dikeluarkan.get(id)?.length ? { dikeluarkan: dikeluarkan.get(id) } : {}),
      st: nama && cocok.length === 1 ? 'sumber' : 'hitung', src: 's-bpp', tgl,
      catatan: nama ? 'Nama sistem sama persis dengan nama baris Kepmen.' : 'Dicocokkan lewat provinsi (heuristik): baris Kepmen yang provinsinya seluruhnya ada di sistem ini. BPP Kepmen per sistem PLN, bukan per jaringan OSM; sistem kecil di pulau lain dalam provinsi yang sama bisa punya BPP berbeda.' + (luar.length ? ' Baris mencakup provinsi di luar sistem ini: ' + [...new Set(luar)].sort().join(', ') + '.' : '') + (bersama.length ? ' Baris yang juga dicocokkan ke sistem kembaran lain: ' + [...new Set(bersama)].sort().join(', ') + '.' : ''),
      ...(bersama.length || luar.length ? { ragu: true } : {}),
    });
  }
  return keluar;
}

// ---- RUPTL 2025-2034: tambahan pembangkit EBT bernama + penyimpanan per provinsi (MW per tahun COD, skenario RE Base). Tanpa koordinat.
export function ruptlProvinsi(ruptl, kodeProv /* Map(norm(nama)->kode) */) {
  const per = new Map(), tanpa = { n: 0, mw: 0 }, takPeta = new Set();
  for (const b of ruptl?.baris || []) {
    const mw = b.kapasitas_mw ?? 0; if (!b.provinsi) { tanpa.n++; tanpa.mw += mw; continue; }
    const k = kodeProv.get(norm(b.provinsi)); if (!k) { takPeta.add(b.provinsi); continue; }
    const o = per.get(k) || { kode: k, proyek: 0, mw: 0, tek: {}, thn: {}, status: {} }; o.proyek++; o.mw += mw;
    o.tek[b.teknologi] = (o.tek[b.teknologi] || 0) + mw; o.status[b.status] = (o.status[b.status] || 0) + mw;
    const y = (b.cod_tahun || []).length ? [...b.cod_tahun].sort().join('/') : 'tanpa-tahun', h = (o.thn[y] ||= {}); h[b.teknologi] = (h[b.teknologi] || 0) + mw; // COD banyak tahun (36 baris) tak dipecah: kunci "2029/2030"
    per.set(k, o);
  }
  const bulat = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => cmp(a, b)).map(([k, v]) => [k, typeof v === 'object' ? bulat(v) : R(v, 1)]));
  const th = ruptl?.meta?.tahun_dokumen ?? 2025;
  const kartu = new Map([...per].map(([k, o]) => [k, { periode: ruptl.meta.periode, skenario: 'RE Base', proyek: o.proyek, mw_total: R(o.mw, 1), per_teknologi: bulat(o.tek), per_status: bulat(o.status), per_tahun_cod: bulat(o.thn), st: 'hitung', src: 'riset-ruptl-2025', tgl: String(th), catatan: 'Hanya pembangkit EBT bernama dan penyimpanan di Lampiran A-C RUPTL; bukan seluruh tambahan kapasitas (PLTU/PLTG tidak termasuk). Kunci "2029/2030" = COD tahap berbeda yang tak dipisah sumber.' }]));
  return { kartu, tanpaProvinsi: { proyek: tanpa.n, mw: R(tanpa.mw, 1) }, takTerpetakan: [...takPeta].sort() };
}
export function ruptlSistem(kartuProv, provSistem /* [kodeProv] */) { // jumlah provinsi anggota (provinsi mayoritas sistem), hanya yang ada rencananya
  const ada = provSistem.filter((k) => kartuProv.has(k)); if (!ada.length) return null;
  const tek = {}, thn = {}; let mw = 0, n = 0;
  for (const k of ada) { const o = kartuProv.get(k); mw += o.mw_total; n += o.proyek; for (const [t, v] of Object.entries(o.per_teknologi)) tek[t] = (tek[t] || 0) + v; for (const [y, h] of Object.entries(o.per_tahun_cod)) { const q = (thn[y] ||= {}); for (const [t, v] of Object.entries(h)) q[t] = (q[t] || 0) + v; } }
  const bulat = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => cmp(a, b)).map(([k, v]) => [k, typeof v === 'object' ? bulat(v) : R(v, 1)]));
  return { provinsi: ada.slice().sort(), periode: kartuProv.get(ada[0]).periode, skenario: 'RE Base', proyek: n, mw_total: R(mw, 1), per_teknologi: bulat(tek), per_tahun_cod: bulat(thn), st: 'hitung', src: 'riset-ruptl-2025', tgl: kartuProv.get(ada[0]).tgl, catatan: 'Jumlah provinsi yang mayoritas jaringannya ada di sistem ini (sama dengan penetapan bauran sistem); rencana provinsi seluruhnya dihitung ke satu sistem saja.' };
}

// ---- Rencana transmisi (kms) dan gardu induk (MVA) per provinsi, RUPTL 2025-2034 Lampiran A-C, RE Base (data/kembaran/ruptl_jaringan.json)
const JARINGAN_SRC = { src: 'RUPTL-2025', tgl: '2025' };
export function ruptlJaringan(rj) {
  const kartu = new Map(), gabungan = [];
  for (const p of rj?.provinsi || []) {
    if (!p.kode) { gabungan.push(p.nama.join(' + ')); continue; } // lampiran gabungan Papua: tak dipecah per provinsi
    const per = (t) => Object.fromEntries(Object.entries(t || {}).filter(([k]) => k !== 'total').sort(([a], [b]) => cmp(a, b)).map(([k, v]) => [k, v.slice(0, 10)]));
    kartu.set(p.kode, { periode: '2025-2034', skenario: 'RE Base', tahun_awal: 2025, kms_per_kv_per_tahun: per(p.kms), mva_per_kv_per_tahun: per(p.mva), total_kms: p.kms?.total?.[10] ?? null, total_mva: p.mva?.total?.[10] ?? null, st: 'sumber', ...JARINGAN_SRC, catatan: [p.sumber_tabel?.kms, p.sumber_tabel?.mva].filter(Boolean).join('; ') });
  }
  return { kartu, gabungan };
}
export function ruptlJaringanSistem(kartuProv, provSistem /* [kodeProv] */) { // jumlah provinsi anggota; total = jumlah total provinsi (bukan dihitung ulang dari baris)
  const ada = provSistem.filter((k) => kartuProv.has(k)); if (!ada.length) return null;
  const jum = (f) => { const o = {}; for (const k of ada) for (const [kv, v] of Object.entries(kartuProv.get(k)[f])) o[kv] = (o[kv] || v.map(() => 0)).map((x, i) => x + v[i]); return Object.fromEntries(Object.entries(o).sort(([a], [b]) => cmp(a, b)).map(([kv, v]) => [kv, v.map((x) => R(x, 1))])); };
  const t = (f) => R(ada.reduce((s, k) => s + (kartuProv.get(k)[f] ?? 0), 0), 1);
  return { provinsi: ada.slice().sort(), periode: '2025-2034', skenario: 'RE Base', tahun_awal: 2025, kms_per_kv_per_tahun: jum('kms_per_kv_per_tahun'), mva_per_kv_per_tahun: jum('mva_per_kv_per_tahun'), total_kms: t('total_kms'), total_mva: t('total_mva'), st: 'hitung', ...JARINGAN_SRC, catatan: 'Jumlah provinsi yang mayoritas jaringannya ada di sistem ini (sama dengan ruptl_ebt); tabel RUPTL per provinsi, bukan per sistem.' };
}

// ---- Penduduk (BPS-POP-<tahun>) dan konsumsi per kapita = penjualan BPS 859 / penduduk
export function pendudukKapita(pel, penjualanBps /* [{prov_kode, gwh, tahun, src}] tahun data */, thn) {
  const hasil = new Map(); if (!pel?.penduduk?.length) return hasil;
  const pop = new Map(pel.penduduk.map((p) => [p.kode, p]));
  for (const p of pel.penduduk) hasil.set(p.kode, { penduduk: { tahun: p.tahun, jiwa: p.jiwa, st: p.bukti === 'via-pihak-ketiga' ? 'est' : 'sumber', src: p.src, tgl: String(p.tahun), ...(p.bukti ? { bukti: p.bukti } : {}) } });
  for (const r of penjualanBps) {
    const anak = Object.entries(PEMEKARAN).filter(([, ind]) => ind === r.prov_kode).map(([a]) => a), kode = [r.prov_kode, ...anak], p = pop.get(r.prov_kode);
    if (!p || kode.some((k) => !pop.has(k))) continue;
    const jiwa = kode.reduce((t, k) => t + (pop.get(k).jiwa || 0), 0), o = hasil.get(r.prov_kode);
    if (!(jiwa > 0) || !(r.gwh >= 0)) continue; // tanpa penduduk atau penjualan: tak ada pembagian
    o.kwh_per_kapita = { tahun: thn, kwh: R((r.gwh * 1e6) / jiwa, 0), penjualan_gwh: r.gwh, jiwa, label: 'penjualan PLN per kapita, bukan konsumsi total', st: 'hitung', src: r.src + ',' + p.src, tgl: String(thn), ...(anak.length ? { catatan: 'Penjualan BPS 859 belum memisahkan provinsi pemekaran Papua: penduduk induk dijumlah dengan ' + anak.sort().join(', ') } : {}), ...(p.tahun !== thn ? { catatan_tahun: `penjualan ${thn}, penduduk ${p.tahun}` } : {}) };
  }
  return hasil;
}

// ---- Elektrifikasi: rasio (Statistik Ketenagalistrikan 2024) dan desa (desa_listrik.json)
export function elektrifikasi(akses, desa) {
  const hasil = new Map(), dv = new Map((desa?.baris || []).map((d) => [d.kode, d]));
  for (const a of akses?.provinsi || []) {
    if (a.re_persen == null) continue;
    const d = dv.get(a.kode), o = { tahun: a.re_tahun, rasio_persen: a.re_persen, rumah_tangga_berlistrik: a.rumah_tangga_berlistrik ?? null, st: 'sumber', src: 'gatrik-2024', tgl: String(a.re_tahun) };
    if (d) o.desa = { tahun: d.tahun, jumlah: d.jumlah_desa, berlistrik_pln: d.desa_pln, berlistrik_non_pln: d.desa_non_pln, belum_berlistrik: d.belum_berlistrik, persen_berlistrik: d.persen_berlistrik, st: 'hitung', src: 'gatrik-2024', tgl: String(d.tahun), catatan: 'belum_berlistrik = jumlah desa - desa berlistrik (PLN + non-PLN), turunan sederhana dari Tabel 8-9' };
    hasil.set(a.kode, o);
  }
  return hasil;
}

// ---- Potensi surya/angin per provinsi + gardu teratas (ebt_dekat_gardu)
export function potensiProvinsi(atlas) {
  const hasil = new Map(); if (!atlas?.provinsi) return hasil;
  const t = atlas.meta.tanggal_ambil;
  for (const [k, v] of Object.entries(atlas.provinsi)) hasil.set(k, { ...(v.pvout ? { pvout: { ...v.pvout, sat: 'kWh/kWp/tahun', st: 'hitung', src: 'gsa-pvout', tgl: t } } : {}), ...(v.angin ? { angin_100m: { ...v.angin, sat: 'm/s', st: 'hitung', src: 'gwa-100m', tgl: t } } : {}), catatan: 'Sampel grid ' + atlas.meta.grid_derajat + ' derajat dalam poligon provinsi: rata-rata dan persentil titik, bukan rata-rata raster penuh. PVOUT = potensi PV teoretis.' });
  return hasil;
}
export function ebtDekatGardu(atlas, gardu /* [{id,nama,kv,prov,sis}] */, n = 10) {
  if (!atlas?.gardu) return null;
  const t = atlas.meta.tanggal_ambil, g = gardu.filter((x) => atlas.gardu[x.id]);
  const top = (idx, key, sat, src) => g.filter((x) => atlas.gardu[x.id][idx] != null).sort((a, b) => atlas.gardu[b.id][idx] - atlas.gardu[a.id][idx] || cmp(a.id, b.id)).slice(0, n).map((x) => ({ id: x.id, nama: x.nama, kv: x.kv, prov: x.prov, sis: x.sis, [key]: atlas.gardu[x.id][idx], sat, st: 'hitung', src, tgl: t }));
  return { surya: top(0, 'pvout', 'kWh/kWp/tahun', 'gsa-pvout'), angin: top(1, 'angin_100m', 'm/s', 'gwa-100m'), catatan: 'Gardu dengan potensi surya/angin tertinggi di titik gardunya (piksel atlas di koordinat OSM); bukan lokasi pembangkit dan bukan kajian kelayakan.', st: 'hitung', src: 'gsa-pvout,gwa-100m', tgl: t };
}
