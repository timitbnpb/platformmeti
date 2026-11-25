// Lapis tambahan kembaran jaringan: rencana pembangkit (GEM + pltu.json), risiko bencana (IRBI BNPB 2025 per kab/kota), kawasan industri/KEK/smelter.
// Murni dan deterministik; semua masukan opsional. Dipanggil dari graf_jaringan.mjs bangun(); keluaran lapis.json + ringkas + fakta gardu `risiko`.
const R = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const BAHAYA = ['banjir', 'longsor', 'gempabumi', 'tsunami'];
const STATUS_GEM = { announced: 'rencana', 'pre-construction': 'pra-konstruksi', construction: 'konstruksi' };
const JENIS_GEM = { solar: 'surya', hydropower: 'hidro', geothermal: 'panas-bumi', wind: 'bayu' };
const AMBANG_JAUH_KM = 25, KV_UTAMA = 150;

export function sumberTambahan(ctx) {
  const o = [];
  if (ctx.irbi) {
    o.push({ id: 'irbi-2025', judul: 'Indeks Risiko Bencana Indonesia (IRBI) 2025 per kab/kota (InaRISK BNPB; dump API data-irbi-full ditarik 18 Okt 2026, 514 kab/kota; nilai per bahaya apa adanya)', penerbit: 'Badan Nasional Penanggulangan Bencana (BNPB)', url: 'https://inarisk.bnpb.go.id/', lisensi: 'tidak tertulis di InaRISK (bukan klaim data terbuka); atribusi wajib: "Sumber: InaRISK BNPB"', atribusi: 'Sumber: InaRISK BNPB', tanggal_data: '2025', tanggal_ambil: '2026-10-18', via: 'paket data/kajian-bnpb/data/irbi (repo poskokarhutla, commit a06bdb8)' });
    o.push({ id: 'big-batas-kab', judul: 'Batas kabupaten/kota (BIG, Juni 2026) dari repo poskokarhutla public/geo/kabupaten', penerbit: 'Badan Informasi Geospasial (BIG)', url: 'https://tanahair.indonesia.go.id/', lisensi: 'IGD terbuka (UU 4/2011); atribusi BIG', atribusi: 'Batas administrasi: Badan Informasi Geospasial', tanggal_data: '2026-06', tanggal_ambil: '2026-11-25' });
  }
  for (const s of ctx.kawasanSumber || []) o.push(s);
  return o;
}

// ---- IRBI: indeks poligon kabupaten (bbox + ring) dan baris per kode
export function siapKab(geoPerProv /* {kodeProv: FeatureCollection} */, baris /* [{prov_kode,nama,kode,banjir,...,status_total_resmi}] */) {
  const by = new Map(baris.map((b) => [b.prov_kode + '|' + b.nama, b])), fit = [];
  for (const kp of Object.keys(geoPerProv).sort()) for (const f of geoPerProv[kp].features) {
    const b = by.get(kp + '|' + f.properties.kab); if (!b) continue;
    const rings = (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).map((p) => p.map((r) => r)); // [poligon][ring][titik]
    let x0 = 180, y0 = 90, x1 = -180, y1 = -90; for (const p of rings) for (const [x, y] of p[0]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    fit.push({ b, rings, bb: [x0, y0, x1, y1] });
  }
  fit.sort((a, c) => cmp(a.b.kode, c.b.kode));
  const nilai = Object.fromEntries(BAHAYA.map((k) => [k, baris.map((b) => b[k]).filter((v) => v != null && v !== '').map(Number).sort((a, c) => a - c)]));
  const ambang = Object.fromEntries(BAHAYA.map((k) => [k, nilai[k][Math.floor(nilai[k].length * 0.75)]]));
  return { fit, ambang, n_baris: baris.length, n_poligon: fit.length, n_nilai: Object.fromEntries(BAHAYA.map((k) => [k, nilai[k].length])) };
}
const dalamRing = (r, x, y) => { let d = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > y) !== (r[j][1] > y) && x < ((r[j][0] - r[i][0]) * (y - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) d = !d; return d; };
const dalamPoli = (p, x, y) => dalamRing(p[0], x, y) && !p.slice(1).some((h) => dalamRing(h, x, y));
// kabupaten: titik-dalam-poligon; di luar semua poligon (garis pantai/pulau kecil): kabupaten bertitik sudut terdekat <= 10 km (cara 'terdekat')
export function kabDi(idx, x, y, jarakM) {
  for (const f of idx.fit) { if (x < f.bb[0] || x > f.bb[2] || y < f.bb[1] || y > f.bb[3]) continue; if (f.rings.some((p) => dalamPoli(p, x, y))) return { b: f.b, cara: 'dalam', km: 0 }; }
  let best = null, bd = 10000;
  for (const f of idx.fit) { if (x < f.bb[0] - 0.12 || x > f.bb[2] + 0.12 || y < f.bb[1] - 0.12 || y > f.bb[3] + 0.12) continue; for (const p of f.rings) for (const [px, py] of p[0]) { const d = jarakM([x, y], [px, py]); if (d < bd) { bd = d; best = f.b; } } }
  return best ? { b: best, cara: 'terdekat', km: R(bd / 1000, 1) } : null;
}
const kelasTinggi = (idx, b) => BAHAYA.filter((k) => b[k] !== '' && b[k] != null && +b[k] >= idx.ambang[k]);
export const faktaRisiko = (idx, hit) => ({ kab: hit.b.nama, kode: hit.b.kode, ...Object.fromEntries(BAHAYA.map((k) => [k, hit.b[k] === '' ? null : +hit.b[k]])), tinggi: kelasTinggi(idx, hit.b), total_resmi: hit.b.status_total_resmi, ...(hit.cara === 'terdekat' ? { kab_terdekat_km: hit.km } : {}) });

// ---- titik tengah jalur (polyline gabungan ruas): ruas tengah, titik tengah ruas itu
function titikTengahJalur(j, ruasBy) {
  const ruas = (j.rs || []).map((id) => ruasBy.get(id)).filter(Boolean); if (!ruas.length) return null;
  const r = ruas[Math.floor((ruas.length - 1) / 2)], c = r.c, i = Math.floor((c.length - 1) / 2);
  return c.length === 1 ? c[0] : [(c[i][0] + c[i + 1][0]) / 2, (c[i][1] + c[i + 1][1]) / 2];
}

// ---- gardu terdekat
function terdekat(gardu, x, y, jarakM, kvMin = 0) {
  let best = null, bd = Infinity; for (const g of gardu) { if ((g.kv ?? 0) < kvMin) continue; const d = jarakM([x, y], [g.x, g.y]); if (d < bd || (d === bd && best && cmp(g.id, best.id) < 0)) { bd = d; best = g; } }
  return best ? { id: best.id, nama: best.nama ?? null, kv: best.kv ?? null, km: R(bd / 1000, 1) } : null;
}

// ---- 1. rencana pembangkit
export function rencanaPembangkit(ctx, S) {
  const { gardu, tgl, jarakM, provPoint, namaProv } = S, L = [];
  
  for (const b of ctx.pltu.baris) { const st = { rencana: 'rencana', konstruksi: 'konstruksi', 'pra-konstruksi': 'pra-konstruksi' }[b.st]; if (!st || b.lat == null) continue; L.push({ id: 'rpb_' + b.id, nama: b.nama, jenis: 'batubara', mw: b.mw_rencana ?? b.mw_konstruksi ?? null, status: st, tahun: b.th_awal ?? null, pemilik: b.pemilik?.nama ?? null, captive: !!b.captive, x: b.lng, y: b.lat, src: 'gem-gcpt', tglData: (ctx.pltu.sumber || []).find((q) => q.id === 'gem-gcpt')?.judul?.match(/rilis (\d{4}-\d\d)/)?.[1] ?? null }); }
  for (const b of ctx.gem.baris) { const st = STATUS_GEM[b.status], jenis = JENIS_GEM[b.tracker]; if (!st || !jenis || b.lat == null) continue; L.push({ id: 'rpb_' + b.id, nama: b.nama, jenis, mw: b.kapasitas_mw ?? null, status: st, tahun: b.tahun_mulai ?? null, pemilik: b.pemilik?.[0] ?? null, captive: false, x: b.lon, y: b.lat, src: 'gem', tglData: (ctx.gem.sumber || []).find((q) => q.tracker === b.tracker)?.rilis ?? null }); }
  for (const b of ctx.gemGas?.rencana || []) L.push({ id: 'rpb_gemgas_' + b.id, nama: b.nama, jenis: b.jenis, mw: b.mw, status: STATUS_GEM[b.status], tahun: b.tahun, pemilik: b.pemilik, captive: false, x: b.x, y: b.y, src: 'gem-ggpt-2023', tglData: '2023-10' });
  const titik = L.sort((a, c) => cmp(a.id, c.id)).map((p) => {
    const g = terdekat(gardu, p.x, p.y, jarakM), g150 = terdekat(gardu, p.x, p.y, jarakM, KV_UTAMA), prov = provPoint(p.x, p.y);
    return { id: p.id, nama: p.nama, jenis: p.jenis, mw: p.mw, status: p.status, tahun: p.tahun, pemilik: p.pemilik, ...(p.captive ? { captive: true } : {}), prov: prov ? { kode: prov, nama: namaProv.get(prov) || prov } : null, x: R(p.x, 4), y: R(p.y, 4), gardu: g, gardu_150: g150, st: 'hitung', src: [p.src], tgl, tgl_data: p.tglData };
  });
  const per = new Map(); for (const p of titik) { const k = p.status + '|' + p.jenis, o = per.get(k) || { status: p.status, jenis: p.jenis, n: 0, mw: 0, tanpa_mw: 0 }; o.n++; o.mw += p.mw || 0; if (p.mw == null) o.tanpa_mw++; per.set(k, o); }
  const jauh = titik.filter((p) => p.mw != null && p.gardu_150 && p.gardu_150.km > AMBANG_JAUH_KM).sort((a, c) => c.mw - a.mw || cmp(a.id, c.id)).slice(0, 10).map((p) => ({ id: p.id, nama: p.nama, jenis: p.jenis, mw: p.mw, status: p.status, tahun: p.tahun, prov: p.prov?.nama ?? null, gardu_150: p.gardu_150, st: 'hitung', src: p.src, tgl }));
  const mwTotal = R(titik.reduce((t, p) => t + (p.mw || 0), 0));
  return { titik, ringkas: { n: titik.length, mw: mwTotal, per_status_jenis: [...per.values()].sort((a, c) => cmp(a.status + a.jenis, c.status + c.jenis)).map((o) => ({ ...o, mw: R(o.mw) })), ambang_jauh_km: AMBANG_JAUH_KM, kv_min_jauh: KV_UTAMA, jauh_dari_gardu_utama: jauh, n_jauh_semua: titik.filter((p) => p.gardu_150 && p.gardu_150.km > AMBANG_JAUH_KM).length, catatan: 'Proyek belum beroperasi (rencana, pra-konstruksi, konstruksi) dari GEM (tracker surya, bayu, hidro, panas bumi, batu bara via pltu.json, gas via GGPT Okt 2023) tanpa dihitung dalam pembangkit, bauran, atau MW PLN. Proyek dibatalkan atau ditunda dikeluarkan. Jarak = garis lurus ke gardu OSM (bukan rute sambungan); tahun = tahun mulai menurut GEM, bisa usang; koordinat GEM ada yang berpresisi perkiraan.', st: 'hitung', src: [...new Set(titik.map((p) => p.src[0]))].sort(), tgl } };
}

// ---- 2. risiko bencana jaringan
export function risikoJaringan(ctx, S) {
  if (!ctx.irbi) return null;
  const { gardu, jalur, ruasBy, besar, sisDariNode, tgl, jarakM } = S, idx = ctx.irbi, perGardu = new Map();
  for (const g of gardu) { const h = kabDi(idx, g.x, g.y, jarakM); if (h) perGardu.set(g.id, faktaRisiko(idx, h)); }
  const hitung = (daftar, ambil) => { const o = Object.fromEntries(BAHAYA.map((k) => [k, 0])); let tot = 0, ada = 0; for (const x of daftar) { const r = ambil(x); if (!r) continue; ada++; for (const k of r.tinggi) o[k]++; if (r.total_resmi === 'Tinggi') tot++; } return { n: daftar.length, ada_kelas: ada, per_bahaya: o, total_resmi_tinggi: tot }; };
  const sah = new Set(besar.filter((s) => !s.potongan && !s.captive).map((s) => s.id));
  const gSah = gardu.filter((g) => sah.has(sisDariNode.get(g.id)?.id));
  const jT = jalur.filter((j) => j.tunggal && sah.has(j.sis)), perJalur = new Map();
  for (const j of jT) { const t = titikTengahJalur(j, ruasBy); const h = t && kabDi(idx, t[0], t[1], jarakM); if (h) perJalur.set(j.id, faktaRisiko(idx, h)); }
  const teratas = jT.filter((j) => perJalur.get(j.id)?.tinggi.length && j.belakang?.gi).sort((a, c) => c.belakang.gi - a.belakang.gi || c.belakang.mw - a.belakang.mw || cmp(a.id, c.id)).filter(((seen) => (j) => { const k = j.sis + '|' + perJalur.get(j.id).kode + '|' + j.belakang.gi + '|' + j.belakang.mw; if (seen.has(k)) return false; seen.add(k); return true; })(new Set())).slice(0, 15)
    .map((j) => { const r = perJalur.get(j.id); return { id: j.id, nama: j.nama, sis: j.sis, kv: j.kv, km: R(j.km), gardu_belakang: j.belakang.gi, mva_belakang: j.belakang.mva, mw_belakang: j.belakang.mw, kab: r.kab, kode_kab: r.kode, tinggi: r.tinggi, total_resmi: r.total_resmi, nilai: Object.fromEntries(r.tinggi.map((k) => [k, r[k]])), st: 'hitung', src: ['irbi-2025', 'big-batas-kab', 'osm-power'], tgl }; });
  const ringkas = { tahun_irbi: 2025, ambang_tinggi: idx.ambang, n_bernilai: idx.n_nilai, gardu: hitung(gSah, (g) => perGardu.get(g.id)), jalur_tunggal: hitung(jT, (j) => perJalur.get(j.id)), jalur_tunggal_teratas: teratas, n_gardu_kab_terdekat: [...perGardu.values()].filter((r) => r.kab_terdekat_km != null).length, n_gardu_tanpa_kab: gSah.filter((g) => !perGardu.has(g.id)).length,
    catatan: 'IRBI BNPB 2025 per kabupaten/kota: nilai per bahaya apa adanya (skala 0 sampai sekitar 36; tiap kab hanya bahaya yang dinilai). BNPB TIDAK menerbitkan kelas per bahaya, jadi "tinggi" di sini = nilai di kuartil teratas (>= P75) dari semua kab/kota bernilai untuk bahaya itu (ambang di ambang_tinggi): hitungan kami, bukan klasifikasi resmi. total_resmi = kelas total semua bahaya dari BNPB (Tinggi 169 dari 514 kab/kota). Risiko = risiko kabupaten tempat titik berada (gardu: titik gardu; jalur tunggal: titik tengah ruas tengah), bukan risiko lokasi tepat: gardu pesisir bisa lebih terpapar daripada rata-rata kab. Titik di luar semua poligon dipetakan ke kab dengan titik sudut terdekat <= 10 km (kab_terdekat_km).', st: 'hitung', src: ['irbi-2025', 'big-batas-kab', 'osm-power'], tgl };
  return { perGardu, ringkas };
}

// ---- 3. kawasan industri, KEK, smelter
export function kawasanBeban(ctx, S) {
  const kab = ctx.kawasanIndustri; if (!kab) return null;
  const { gardu, pbs, tgl, jarakM } = S, L = [];
  const captive = pbs.filter((p) => p.captive && p.mw != null);
  for (const b of kab.baris) if (b.lat != null) L.push({ id: b.id, jenis: b.jenis, nama: b.nama, prov: b.provinsi, x: b.lng, y: b.lat, presisi: b.jenis === 'kek' ? 'titik halaman KEK (kantor/pengelola)' : 'pusat kabupaten/kota (geoBoundaries), bukan lokasi kawasan', sektor: b.sektor ?? null, status: b.status ?? null, luas_ha: b.luas_ha ?? null, mw_butuh: b.kebutuhan_mw_kek ?? null, mva_butuh: b.kebutuhan_mva ?? null, mw_tersedia: b.tersedia_mw ?? null, mw_captive: b.kebutuhan_mw_captive ?? null, src: b.jenis === 'kek' ? ['kek-go-id'] : ['hki-anggota', 'geoboundaries'] });
  for (const b of ctx.hilirisasi?.baris || []) if (b.lat != null) L.push({ id: 'sm_' + b.id, jenis: b.rantai, nama: b.nama, prov: b.provinsi ?? null, x: b.lng, y: b.lat, presisi: 'titik kurasi (kira-kira lokasi pabrik)', sektor: b.produk ?? null, status: b.status ?? null, kapasitas: b.kapasitas ? { nilai: b.kapasitas.nilai, satuan: b.kapasitas.satuan } : null, mw_listrik: b.mw_rata ?? null, kawasan: b.kawasan_id ?? null, src: ['kurasi'] });
  const titik = L.sort((a, c) => cmp(a.id, c.id)).map((k) => {
    const g = terdekat(gardu, k.x, k.y, jarakM), g150 = terdekat(gardu, k.x, k.y, jarakM, KV_UTAMA); let c = null, cd = Infinity; for (const p of captive) { const d = jarakM([k.x, k.y], [p.x, p.y]); if (d < cd || (d === cd && c && cmp(p.id, c.id) < 0)) { cd = d; c = p; } }
    const { src, ...rest } = k; return { ...rest, x: R(k.x, 4), y: R(k.y, 4), gardu: g, gardu_150: g150, captive_terdekat: c && cd <= 100000 ? { id: c.id, nama: c.nama, mw: c.mw, km: R(cd / 1000, 1) } : null, st: 'hitung', src: [...new Set([...src, 'osm-power', ...(c ? ['gem-gcpt'] : [])])].sort(), tgl };
  });
  const adaBeban = titik.filter((k) => k.mw_butuh != null || k.mva_butuh != null || k.mw_listrik != null);
  const teratas = adaBeban.slice().sort((a, c) => (c.mw_butuh ?? c.mw_listrik ?? 0) - (a.mw_butuh ?? a.mw_listrik ?? 0) || (c.mva_butuh ?? 0) - (a.mva_butuh ?? 0) || cmp(a.id, c.id)).slice(0, 10).map((k) => ({ id: k.id, jenis: k.jenis, nama: k.nama, prov: k.prov, mw_butuh: k.mw_butuh, mva_butuh: k.mva_butuh, mw_tersedia: k.mw_tersedia, mw_listrik: k.mw_listrik, gardu_150: k.gardu_150, captive_terdekat: k.captive_terdekat, presisi: k.presisi, st: 'hitung', src: k.src, tgl }));
  const jenis = new Map(); for (const k of titik) jenis.set(k.jenis, (jenis.get(k.jenis) || 0) + 1);
  return { titik, ringkas: { n: titik.length, per_jenis: [...jenis].sort((a, c) => cmp(a[0], c[0])).map(([j, n]) => ({ jenis: j, n })), n_dengan_beban: adaBeban.length, n_jauh_gardu_utama: titik.filter((k) => k.gardu_150 && k.gardu_150.km > AMBANG_JAUH_KM).length, ambang_jauh_km: AMBANG_JAUH_KM, teratas_beban: teratas, catatan: 'Titik: KEK = titik halaman kek.go.id; kawasan industri = anggota HKI dengan koordinat pusat kabupaten/kota (BUKAN lokasi kawasan; jarak gardu bisa meleset puluhan km); smelter dan hilirisasi = titik kurasi METI. Beban memakai satuan sumber (MW dan MVA tidak dijumlahkan; hanya kawasan yang diriset punya angka). Jarak = garis lurus ke gardu OSM (bukan rute) dan ke pembangkit captive (PLTU/gas captive di graf) terdekat bila <= 100 km (selain itu null). Daftar KEK resmi sudah di repo (kek.go.id, panen 7-8 Nov 2026), tidak diunduh ulang.', st: 'hitung', src: ['kek-go-id', 'hki-anggota', 'kurasi', 'osm-power'], tgl } };
}

// ---- 4. proyeksi beban RUPTL 2025-2034 (data/kembaran/ruptl_beban.json) ke kartu sistem/provinsi
const ALIAS_SISTEM = { 'sis_sumatera': 'Sumatera-Bangka', 'sis_jawa-bali': 'Jawa-Bali', 'sis_kalimantan-barat': 'Kalimantan Barat', 'sis_kalimantan-selatan-tengah-timur-utara': 'Kalseltengtimra', 'sis_sulawesi-bagian-selatan': 'Sulbagsel', 'sis_sulawesi-bagian-utara': 'Sulbagut' };
const EXACT = new Set(['sis_jawa-bali', 'sis_kalimantan-barat']); // nama sama persis; lainnya alias nama (hitung)
const deret = (rb, a) => ({ tahun: rb.meta.tahun, ...a });
export function proyeksiSistem(rb, id) {
  const nama = ALIAS_SISTEM[id]; if (!rb || !nama) return null;
  const f = (sk) => rb.sistem.find((s) => s.nama === nama && s.skenario === sk); const base = f('RE Base'); if (!base) return null;
  const bentuk = (s) => ({ skenario: s.skenario, nama_ruptl: s.nama, beban_puncak_mw: s.beban_puncak_neto_mw, beban_puncak_bruto_mw: s.beban_puncak_bruto_mw ?? null, kebutuhan_gwh: s.produksi_gwh, penjualan_gwh: s.penjualan_gwh, faktor_beban_pct: s.faktor_beban_pct, tabel: s.sumber_tabel });
  const o = { tahun: rb.meta.tahun, ...bentuk(base), st: EXACT.has(id) ? 'sumber' : 'hitung', src: 'RUPTL-2025', tgl: rb.meta.diambil, ket: 'Beban puncak = neto; kebutuhan = produksi (GWh). ' + (EXACT.has(id) ? 'Nama sistem sama dengan RUPTL.' : 'Sistem kembaran dicocokkan ke sistem RUPTL lewat nama/wilayah (heuristik, batas tidak persis sama).') };
  const ared = f('ARED'); if (ared) o.skenario_ared = bentuk(ared);
  return o;
}
export function proyeksiProvinsi(rb, kode) {
  const p = rb?.provinsi.find((x) => x.kode === kode || (x.kode_gabungan || []).includes(kode)); if (!p) return null;
  const gab = !!p.kode_gabungan;
  return { tahun: rb.meta.tahun, beban_puncak_mw: p.beban_puncak_mw, kebutuhan_gwh: p.produksi_gwh, penjualan_gwh: p.penjualan_gwh, pelanggan: p.pelanggan, pertumbuhan_ekonomi_pct: p.pertumbuhan_ekonomi_pct, ...(gab ? { gabungan: p.kode_gabungan.slice().sort(), ket: 'Angka gabungan beberapa provinsi (lampiran RUPTL tidak memecah); bukan angka provinsi ini sendiri.' } : {}), tabel: p.sumber_tabel, st: gab ? 'hitung' : 'sumber', src: 'RUPTL-2025', tgl: rb.meta.diambil };
}

// ---- 5. gangguan besar (data/kembaran/gangguan.json): linimasa per kartu sistem + 5 terbaru
const SIS_GANGGUAN = { 'Jawa-Bali': 'sis_jawa-bali', Bali: 'sis_jawa-bali', Sumatera: 'sis_sumatera' }; // Bali = bagian sistem Jawa-Bali (kabel laut 150 kV Jawa-Bali)
export function gangguan(g, tgl) {
  if (!g?.peristiwa?.length) return null;
  const tg = g.meta?.tanggal_baca ?? tgl;
  const baris = g.peristiwa.map((p) => ({ id: p.id, tanggal: p.tanggal, tanggal_arti: p.tanggal_arti, nama: p.nama, sistem_asal: p.sistem, sis: SIS_GANGGUAN[p.sistem] ?? null, provinsi: p.provinsi, mulai: p.mulai, pulih: p.pulih, durasi_tertulis: p.durasi_tertulis, terdampak: p.terdampak, penyebab_tertulis: p.penyebab_tertulis, ringkas: p.ringkas, st: p.st ?? 'sumber', src: p.src, src_tambahan: p.src_tambahan ?? [], tgl: tg })).sort((a, b) => cmp(b.tanggal, a.tanggal) || cmp(a.id, b.id));
  const per = new Map(); for (const b of baris) if (b.sis) (per.get(b.sis) || per.set(b.sis, []).get(b.sis)).push(b);
  const terbaru = baris.slice(0, 5).map((b) => ({ id: b.id, tanggal: b.tanggal, nama: b.nama, sistem: b.sistem_asal, sis: b.sis, terdampak: b.terdampak, penyebab_tertulis: b.penyebab_tertulis, st: b.st, src: b.src, tgl: b.tgl }));
  return { per, terbaru, celah: g.meta?.celah ?? [], n: baris.length, sumber: (g.sumber || []).map((s) => ({ id: s.id, judul: s.judul, penerbit: s.penerbit, url: s.url, lisensi: s.lisensi, tanggal_data: s.tanggal_terbit ?? null, tanggal_ambil: s.tanggal_baca ?? null })) };
}

// ---- 6. tarif PLN per golongan (data/kembaran/tarif.json) + selisih terhadap BPP nasional terbaru (biaya_listrik.bpp_nasional)
export function tarifGolongan(t, biaya, tgl) {
  if (!t?.golongan?.length) return null;
  const tg = t.meta?.tanggal_baca ?? tgl, bpp = (biaya?.bpp_nasional || []).slice().sort((a, b) => b.tahun - a.tahun)[0] ?? null;
  const harga = (g) => g.rp_per_kwh ?? g.lwbp_rp_per_kwh ?? null;
  const golongan = t.golongan.map((g) => { const h = harga(g), { src, st, rekening_minimum: _rm, rp_per_kwh: _rp, ...rest } = g; return { ...rest, harga_rp_kwh: h, harga_dasar: g.rp_per_kwh != null ? 'reguler' : g.lwbp_rp_per_kwh != null ? 'LWBP' : null, ...(h != null && bpp ? { selisih_bpp_rp_kwh: R(h - bpp.rp_kwh, 1), selisih_bpp_persen: R(((h - bpp.rp_kwh) / bpp.rp_kwh) * 100, 1) } : {}), st: st ?? 'sumber', src, tgl: tg }; });
  return { rekening_minimum: [...new Set(t.golongan.map((g) => g.rekening_minimum).filter(Boolean))].sort(), berlaku: t.meta.berlaku, dasar_hukum: t.meta.dasar_hukum, catatan: t.meta.catatan, golongan, pembanding_bpp: bpp ? { tahun_bpp: bpp.tahun, bpp_rp_kwh: bpp.rp_kwh, kepmen: bpp.kepmen, st: 'hitung', src: bpp.sumber_id, tgl: bpp.tanggal_penetapan, ket: `Selisih = harga tarif (reguler, atau LWBP bila berblok waktu) dikurangi BPP pembangkitan nasional ${bpp.tahun} (Kepmen ${bpp.kepmen}). BPP adalah biaya pokok PEMBANGKITAN, bukan biaya pokok penyediaan lengkap (tanpa transmisi/distribusi), dan tahunnya (${bpp.tahun}) jauh lebih tua daripada tarif (${t.meta.berlaku?.tahun}): selisih menunjukkan urutan besar, bukan subsidi atau margin.` } : null, st: 'sumber', src: 'PLN-TARIF-2026-TW4', tgl: tg, sumber: (t.sumber || []).map((s) => ({ id: s.id, judul: s.judul, penerbit: s.penerbit, url: s.url, lisensi: s.lisensi, tanggal_data: s.tanggal_terbit ?? null, tanggal_ambil: s.tanggal_baca ?? null })) };
}
