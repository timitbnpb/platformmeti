// Bangun public/data/global/pemasok_lain.json dari data/global/lain/panen.json + proyek.json + gem_pembangkit.json, lalu
// gabung ke data/direktori/entitas_tambah.json (idempoten, _asal "global_lain"). Tanpa jaringan. Pakai: node scripts/panen/global_lain_bangun.mjs [--selftest]
import path from 'node:path';
import assert from 'node:assert/strict';
import { ROOT, TINGKAT, bacaJson, tulisJson, validasiPerusahaan, kelengkapan, gabungEntitasTambah } from '../pipa/global_pemasok.mjs';
import { idEntitas } from '../pipa/entitas_tambah.mjs';

export const SEGMEN = new Set(['bayu', 'panas-bumi', 'hidro', 'hidrogen', 'jaringan', 'biomassa', 'biogas', 'biofuel']);
const PERAN_PIHAK = { pemilik: 'pemilik/pengembang', peminjam: 'peminjam', pelaksana: 'pelaksana' };
const sumberWD = (id) => `https://www.wikidata.org/wiki/${id}`;

export function cocokProyek(alias, proyek, gem) {
  const re = new RegExp(alias), out = new Map();
  const tambah = (k, v) => { if (!out.has(k)) out.set(k, v); };
  for (const pj of proyek) for (const [kunci, arr] of Object.entries(pj.pihak || {})) for (const x of arr) {
    if (!re.test(`${x.nilai || ''} ${x.catatan || ''}`)) continue;
    const s = (pj.sumber || []).find((q) => q.id === x.sumber_id) || pj.sumber?.[0];
    tambah(pj.id + kunci, { proyek_id: pj.id, nama: pj.nama, peran: PERAN_PIHAK[kunci] || kunci, sumber: 'proyek.json', sumber_url: s?.url, tingkat_bukti: pj.tingkat_bukti });
  }
  for (const g of gem) if ((g.pemilik || []).some((n) => re.test(n)))
    tambah(g.id, { proyek_id: g.pencocokan?.status === 'cocok' ? g.pencocokan.proyek_id : null, gem_id: g.id, nama: g.nama, peran: 'pemilik/mitra (daftar pemilik GEM)', kapasitas_mw: g.kapasitas_mw, status: g.status, sumber: 'Global Energy Monitor (CC BY 4.0)', sumber_url: g.url_wiki, tingkat_bukti: 'via-pihak-ketiga' });
  return [...out.values()].filter((x) => x.sumber_url);
}
export const kunciNama = (n) => String(n).toLowerCase().replace(/\b(pt|tbk|persero|ltd|inc|gmbh|ag|asa|corporation|co|group)\b\.?/g, '').replace(/[^a-z0-9]+/g, '');
export function bangunSatu(r, tgl, proyek, gem, orgId = new Map()) {
  const w = r.wikidata && r.wikidata.cocok_by === 'label' && r.wikidata.label.toLowerCase() !== r.nama.toLowerCase() ? { ...r.wikidata, tahun_berdiri: null } : r.wikidata; // entri induk/merek lain: tahun berdiri induk tak dipakai
  const b = r.beranda, fakta = [], sumber = [];
  const f = (medan, nilai, url, tingkat) => fakta.push({ medan, nilai, sumber_url: url, tanggal_periksa: tgl, tingkat_bukti: tingkat });
  sumber.push({ url: r.situs, tingkat_bukti: 'situs-sendiri', tanggal_periksa: tgl, keterangan: 'beranda resmi' });
  if (w) sumber.push({ url: sumberWD(w.id), tingkat_bukti: 'via-pihak-ketiga', tanggal_periksa: tgl, keterangan: 'Wikidata (CC0)' });
  const L = r.lengkapi; // pelengkap bila Wikidata tak punya negara (data/global/lain/lengkapi.json)
  const iso2 = w?.iso2?.[0] || L?.iso2 || null, tahun = w?.tahun_berdiri || L?.tahun || null;
  if (L) sumber.push({ url: L.sumber_url, tingkat_bukti: L.tingkat, tanggal_periksa: tgl, keterangan: L.ket });
  if (w?.iso2?.[0]) f('negara_iso2', w.iso2[0], sumberWD(w.id), 'via-pihak-ketiga'); else if (L?.iso2) f('negara_iso2', L.iso2, L.sumber_url, L.tingkat);
  if (w?.tahun_berdiri) f('tahun_berdiri', w.tahun_berdiri, sumberWD(w.id), 'via-pihak-ketiga'); else if (L?.tahun) f('tahun_berdiri', L.tahun, L.sumber_url, L.tingkat);
  if (L?.portofolio) f('portofolio_terpasang', L.portofolio.nilai, L.portofolio.sumber_url, L.portofolio.tingkat);
  const produk = new Set(), terbukti = [], belum = [];
  for (const s of r.segmen) { const p = (b.produk || {})[s] || []; (p.length ? terbukti : belum).push(s); p.forEach((x) => produk.add(x)); }
  if (produk.size) f('produk', [...produk].sort(), r.situs, 'situs-sendiri');
  if (b.deskripsi) f('deskripsi_situs', b.deskripsi.slice(0, 300), r.situs, 'situs-sendiri');
  if (b.indonesia) f('halaman_indonesia', b.indonesia, b.indonesia, 'situs-sendiri');
  const pi = cocokProyek(r.alias, proyek, gem);
  return {
    id: idEntitas(r.nama), nama: r.nama, negara_iso2: iso2, situs: r.situs, segmen: r.segmen, subsegmen: r.sub || [], organisasi_id: orgId.get(kunciNama(r.nama)) || null, tahun_berdiri: tahun || undefined,
    produk: [...produk].sort(), segmen_terbukti_di_situs: terbukti, segmen_belum_terbukti_di_beranda: belum,
    halaman_indonesia: b.indonesia || null, kapasitas_produksi: null, pangsa_dunia: null, kantor_pabrik_asean: null, mitra_lokal: null,
    proyek_indonesia: pi, logo: r.logo?.berkas ? `/img/logo/org/${r.logo.berkas}` : null, fakta, sumber,
    catatan: [!b.deskripsi && b.gagal ? `beranda tak terbaca (${b.gagal})` : null, !w ? 'tidak ada entri Wikidata yang situsnya cocok' : null].filter(Boolean),
  };
}
export function bangun(tgl, { panen = bacaJson(path.join(ROOT, 'data/global/lain/panen.json')), proyek = bacaJson(path.join(ROOT, 'public/data/proyek.json')).baris, gem = bacaJson(path.join(ROOT, 'public/data/gem_pembangkit.json')).baris, org = bacaJson(path.join(ROOT, 'public/data/organisasi.json')).baris } = {}) {
  const orgId = new Map(org.map((o) => [kunciNama(o.nama), o.id]));
  const semua = panen.baris.map((r) => bangunSatu(r, tgl, proyek, gem, orgId));
  const lengkap = semua.filter((p) => p.negara_iso2), tunda = semua.filter((p) => !p.negara_iso2).map((p) => p.nama);
  const salah = lengkap.flatMap((p) => validasiPerusahaan(p, SEGMEN));
  if (salah.length) throw new Error(salah.join('; '));
  return { semua, lengkap, tunda };
}
/** Hulu bioenergi + pemain lokal + pasar dunia (data/global/lain/hulu_lokal.json): tautkan org_nama ke organisasi.json / pelaku_baru, hitung pangsa pasang. */
export function hulu(berkas, org, pemasok) {
  const kunci = new Map(org.map((o) => [kunciNama(o.nama), o.id])); for (const b of berkas.pelaku_baru) kunci.set(kunciNama(b.nama), idEntitas(b.nama));
  const butir = berkas.butir.map((b) => { const organisasi_id = b.org_nama ? kunci.get(kunciNama(b.org_nama)) || null : null;
    if (b.org_nama && !organisasi_id) throw new Error('org_nama tak cocok: ' + b.org_nama); return { ...b, organisasi_id }; });
  const id = new Map(pemasok.map((p) => [p.nama, p.id]));
  const pasar_dunia = berkas.pasar_dunia.map((x) => ({ ...x, per_pemasok: x.per_pemasok.map((q) => { if (!id.has(q.nama)) throw new Error('pemasok tak ada: ' + q.nama); return { ...q, pemasok_id: id.get(q.nama), pangsa_persen: Math.round((q.gw / x.total_gw) * 1000) / 10 }; }) }));
  const salah = [...butir, ...pasar_dunia].filter((x) => !/^https:\/\//.test(x.sumber_url) || !TINGKAT.has(x.tingkat_bukti)).map((x) => x.uraian.slice(0, 40));
  if (salah.length) throw new Error('butir tanpa sumber/tingkat: ' + salah.join('; '));
  return { butir, pasar_dunia };
}
/** Pelaku lokal baru ke entitas_tambah (idempoten, _asal global_lain_hulu; nama yang sudah ada di tempat lain dilewati). */
export function gabungPelakuHulu(berkas, tgl, f = path.join(ROOT, 'data/direktori/entitas_tambah.json')) {
  const d = bacaJson(f), ada = new Set(d.baris.filter((b) => b._asal !== 'global_lain_hulu').map((b) => idEntitas(b.nama)));
  d.baris = d.baris.filter((b) => b._asal !== 'global_lain_hulu');
  for (const b of berkas.pelaku_baru) if (!ada.has(idEntitas(b.nama))) d.baris.push({ _asal: 'global_lain_hulu', nama: b.nama, nama_lain: b.nama_lain || [], kategori: b.kategori, kepakaran: b.kepakaran, peran_rantai: b.peran_rantai, situs: b.situs, sumber: [{ url: b.sumber_url, tingkat_bukti: b.tingkat_bukti, keterangan: b.ket }] });
  if (!d.tanggal_periksa || d.tanggal_periksa < tgl) d.tanggal_periksa = tgl;
  tulisJson(f, d); return berkas.pelaku_baru.length;
}
export function rantai(daftar, taks = bacaJson(path.join(ROOT, 'data/global/lain/subsegmen.json')).segmen) {
  const o = {};
  for (const [seg, subs] of Object.entries(taks)) o[seg] = Object.fromEntries(subs.map((sb) => [sb, daftar.filter((p) => p.segmen.includes(seg) && p.subsegmen.includes(sb)).map((p) => ({ id: p.id, nama: p.nama, negara_iso2: p.negara_iso2, organisasi_id: p.organisasi_id }))]));
  return o;
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  if (process.argv.includes('--selftest')) {
    const pj = [{ id: 'pj_1', nama: 'X', tingkat_bukti: 'resmi', sumber: [{ id: 's1', url: 'https://a.id/' }], pihak: { pemilik: [{ nilai: 'Ormat Technologies', sumber_id: 's1' }, { nilai: 'Informat' }] } }];
    const gm = [{ id: 'g1', nama: 'Y', pemilik: ['Ormat Technology Inc'], url_wiki: 'https://www.gem.wiki/Y', pencocokan: { status: 'baru' } }];
    const r = cocokProyek('\\bOrmat\\b', pj, gm); assert.equal(r.length, 2); assert.equal(r[1].proyek_id, null); assert.equal(kunciNama('PT Ormat Inc'), kunciNama('Ormat')); console.log('selftest ok');
  } else {
    const tgl = process.argv[2]; if (!/^\d{4}-\d\d-\d\d$/.test(tgl || '')) throw new Error('tanggal YYYY-MM-DD wajib');
    const { semua, lengkap, tunda } = bangun(tgl); const hl = bacaJson(path.join(ROOT, 'data/global/lain/hulu_lokal.json'));
    const medan = { negara: (p) => p.negara_iso2, produk: (p) => p.produk.length, halaman_indonesia: (p) => p.halaman_indonesia, proyek_indonesia: (p) => p.proyek_indonesia.length, logo: (p) => p.logo, tahun_berdiri: (p) => p.tahun_berdiri };
    tulisJson(path.join(ROOT, 'public/data/global/pemasok_lain.json'), { lapis: 'publik', dibangun_pada: tgl, sumber: 'Wikidata (CC0), beranda resmi perusahaan, proyek.json, Global Energy Monitor (CC BY 4.0)', jumlah: lengkap.length, belum_lengkap: tunda, kelengkapan_persen: kelengkapan(lengkap, medan), catatan: 'kapasitas_produksi, pangsa_dunia, kantor_pabrik_asean, mitra_lokal sengaja kosong: belum ada sumber publik yang dibaca; jangan diisi tanpa sumber.', rantai: rantai(lengkap), ...hulu(hl, bacaJson(path.join(ROOT, 'public/data/organisasi.json')).baris, lengkap), baris: lengkap });
    const gh = gabungPelakuHulu(hl, tgl);
    const g = gabungEntitasTambah('global_lain', lengkap, { kepakaran: ['penyedia teknologi global'], peran: ['manufaktur'], tanggal: tgl });
    console.log(gh, 'pelaku hulu;', lengkap.length, 'perusahaan;', 'tunda:', tunda.join(', ') || '-', ';', g);
    console.log(JSON.stringify(kelengkapan(lengkap, medan)));
  }
}
