// Bangun public/data/isu.json: isu nasional + daerah kurasi (data/isu/*.json) + isu daerah turunan dari lapis yang sudah ada
// (desa energi mati, RUED tertinggal, proyek berhenti/mundur, risiko sosial-lingkungan sangat tinggi, PSEL), lalu tautan berita
// dan keterkaitan antarisu. Satu sumber kebenaran: tiap angka berasal dari berkas data/ lain, tak ada angka baru di sini.
// Pakai: node scripts/pipa/isu_bangun.mjs   (--cek: gagal bila isu.json di disk berbeda dari hasil bangun)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baca = (p) => JSON.parse(fs.readFileSync(path.join(AKAR, p), 'utf8'));
export const TEMA = ['kebijakan', 'harga', 'industri', 'batubara', 'pendanaan', 'perizinan', 'lahan', 'lingkungan', 'sosial', 'jaringan', 'sampah', 'karbon', 'nuklir', 'desa', 'rued', 'proyek'];
export const STATUS = ['aktif', 'mereda', 'selesai'];
const BUKTI = { berita: 'media', resmi: 'resmi', media: 'media', kajian: 'kajian' };
const lolosBerita = (j) => /^[0-9a-f]{10}$/.test(j.id);
const prov2 = (k) => String(k).slice(0, 2);
const urut = (a, b) => String(a).localeCompare(String(b));
const koma = (n) => String(n).replace(".", ",");

/** Tanggal ISO parsial (YYYY, YYYY-MM, YYYY-MM-DD) dibandingkan sebagai teks setelah dilengkapi. */
export const lengkapi = (t) => String(t).length === 4 ? t + '-01-01' : String(t).length === 7 ? t + '-01' : String(t);

/** Cocokkan kata kunci pada judul berita (batas kata, huruf kecil). */
export function cocokBerita(kata, judul) {
  const j = String(judul).toLowerCase();
  return (kata || []).some((k) => new RegExp('(^|[^a-z0-9])' + String(k).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)').test(j));
}

function normal(i, tingkat, auto = false) {
  const lini = [...(i.linimasa || [])].map((e) => ({ tanggal: e.t, peristiwa: e.p, sumber: e.s ?? null })).sort((a, b) => lengkapi(a.tanggal).localeCompare(lengkapi(b.tanggal)));
  const wilayah = [...new Set(i.wilayah || [])].sort(urut);
  return {
    id: i.id, tingkat, auto, tema: i.tema, status: i.status, bukti: BUKTI[i.bukti] || i.bukti,
    judul: i.judul, ringkas: i.ringkas,
    mulai: lini[0]?.tanggal ?? null, terbaru: lini.length ? lini[lini.length - 1].tanggal : null,
    linimasa: lini,
    pihak: (i.pihak || []).map((p) => ({ nama: p.nama, org_id: p.org_id ?? null, peran: p.peran, posisi: p.posisi, sumber: p.s ?? null })),
    regulasi_ids: [...new Set(i.regulasi || [])],
    proyek_ids: [...new Set(i.proyek || [])],
    wilayah, prov: [...new Set(wilayah.map(prov2))].sort(urut),
    posisi_meti: i.posisi_meti ? { ringkas: i.posisi_meti.ringkas, tanggal: i.posisi_meti.tanggal ?? null, sumber: i.posisi_meti.sumber_idx ?? null } : null,
    sumber: (i.sumber || []).map((s) => ({ judul: s.j, penerbit: s.p, url: s.u, tanggal: s.t ?? null })),
    _kata: i.kata || [], _konsultasi: i.konsultasi_id || null,
  };
}

/** Isu turunan per provinsi dari lapis data yang sudah ada. */
export function turunan({ prov, desa, rued, besar, risiko, psel, proyekAda, regAda, kuratorProyek }) {
  const nama = new Map(prov.map((p) => [p.kode, p.nama])), kode = new Map(prov.map((p) => [p.nama, p.kode]));
  const out = [];
  // desa energi mandiri mati atau rusak
  const dPer = new Map();
  for (const b of desa.baris) if (['mati', 'rusak'].includes(b.status) && b.kode_prov) (dPer.get(b.kode_prov) || dPer.set(b.kode_prov, []).get(b.kode_prov)).push(b);
  for (const [k, ar] of dPer) {
    const sum = new Map(); ar.forEach((b) => b.sumber?.url && sum.set(b.sumber.url, { j: b.sumber.judul, p: b.sumber.penerbit, u: b.sumber.url, t: b.sumber.tanggal }));
    const S = [...sum.values()], idx = new Map(S.map((s, n) => [s.u, n]));
    out.push({
      id: 'desa-energi-mati-' + k, tema: 'desa', status: 'aktif', bukti: 'media', wilayah: [k],
      judul: `Desa energi mandiri berhenti beroperasi di ${nama.get(k)}`,
      ringkas: `${ar.length} sistem energi desa di ${nama.get(k)} tercatat rusak atau mati dalam liputan yang dikumpulkan (${[['mati', 'mati'], ['rusak', 'rusak']].map(([st, l]) => [ar.filter((b) => b.status === st).length, l]).filter(([n]) => n).map(([n, l]) => n + ' ' + l).join(', ')}). Penyebab yang paling sering disebut: komponen, beban melampaui kapasitas, dan perawatan oleh sumber daya manusia setempat. Cakupan kasus tidak lengkap; titik lokasi hanya perkiraan kabupaten.`,
      linimasa: ar.filter((b) => b.tahun_henti).map((b) => ({ t: String(b.tahun_henti), p: `${b.nama} (${b.kabupaten}) berhenti; sumber: ${b.uraian}`, s: idx.get(b.sumber?.url) ?? null })),
      pihak: [], sumber: S, regulasi: [],
    });
  }
  // RUED tertinggal
  for (const b of rued.baris.filter((x) => x.status === 'tertinggal')) {
    const reg = b.perda_id && regAda.has(b.perda_id) ? [b.perda_id] : [];
    out.push({
      id: 'rued-tertinggal-' + b.kode, tema: 'rued', status: 'aktif', bukti: 'kajian', wilayah: [b.kode],
      judul: `Capaian bauran EBT ${b.provinsi} tertinggal dari target RUED`,
      ringkas: `Perda RUED ${b.provinsi} (${b.perda}) menargetkan bauran EBT ${koma(b.target_2025_persen)}% pada 2025, sedangkan pangsa kapasitas terpasang EBT ${b.realisasi_tahun} baru ${koma(b.realisasi_persen)}% (rasio ${b.rasio_persen}% dari target). Ukuran target (bauran energi primer) dan realisasi (kapasitas) berbeda, sehingga penilaian berstatus Hipotesis.`,
      linimasa: [{ t: String(b.realisasi_tahun), p: `Realisasi pangsa kapasitas EBT ${koma(b.realisasi_persen)}% (${b.ebt_mw} dari ${b.total_mw} MW).`, s: 0 }],
      pihak: [], regulasi: reg, sumber: [{ j: `Perda RUED ${b.provinsi} ${b.perda}`, p: 'peraturan.bpk.go.id', u: b.sumber_url, t: b.tanggal_periksa }, ...(b.realisasi_sumber_url ? [{ j: 'Statistik Ketenagalistrikan 2024', p: 'Kementerian ESDM', u: b.realisasi_sumber_url, t: null }] : [])],
    });
  }
  // proyek berhenti atau mundur
  const hPer = new Map();
  for (const b of besar.berhenti.baris) { const k = kode.get(b.prov); if (k && b.sumber_url) (hPer.get(k) || hPer.set(k, []).get(k)).push(b); }
  for (const [k, ar] of hPer) {
    const sum = new Map(); ar.forEach((b) => sum.set(b.sumber_url, { j: `Dokumen ${b.sumber_jenis || 'sumber'} untuk ${b.nama}`, p: b.sumber_jenis || 'sumber resmi', u: b.sumber_url, t: null }));
    const S = [...sum.values()], idx = new Map(S.map((s, n) => [s.u, n]));
    out.push({
      id: 'proyek-henti-' + k, tema: 'proyek', status: 'aktif', bukti: ar.every((b) => b.bukti === 'resmi') ? 'resmi' : 'media', wilayah: [k],
      judul: `Proyek EBT berhenti atau mundur dari jadwal di ${nama.get(k)}`,
      ringkas: `${ar.length} proyek di ${nama.get(k)} (${Math.round(ar.reduce((s, b) => s + (b.mw || 0), 0))} MW) tercatat berhenti, batal, atau lewat target operasi komersial: ${ar.slice(0, 4).map((b) => b.nama).join('; ')}${ar.length > 4 ? ' dan lainnya' : ''}.`,
      linimasa: ar.map((b) => ({ t: String(b.tanggal || b.tahun || b.cod), p: `${b.nama}: ${b.jenis === 'mundur' ? 'mundur dari target COD' : b.jenis} (status asli ${b.status_asli || '-'})`, s: idx.get(b.sumber_url) })).filter((e) => e.t && e.t !== 'undefined'),
      pihak: [], regulasi: [], proyek: ar.map((b) => b.id).filter((id) => proyekAda.has(id)), sumber: S,
    });
  }
  // risiko sosial-lingkungan sangat tinggi
  const rPer = new Map();
  for (const b of risiko.baris.filter((x) => x.kelas === 'sangat-tinggi')) if (b.prov_kode) (rPer.get(b.prov_kode) || rPer.set(b.prov_kode, []).get(b.prov_kode)).push(b);
  for (const [k, ar] of rPer) {
    out.push({
      id: 'risiko-sosial-lingkungan-' + k, tema: 'lingkungan', status: 'aktif', bukti: 'kajian', wilayah: [k],
      judul: `Proyek EBT berisiko sosial-lingkungan sangat tinggi di ${nama.get(k)}`,
      ringkas: `${ar.length} proyek di ${nama.get(k)} mendapat skor risiko 65 atau lebih (kelas sangat tinggi) dari tumpang tindih dengan kawasan hutan, gambut, wilayah adat, dan bahaya bencana: ${ar.slice(0, 3).map((b) => `${b.nama} (${b.skor})`).join('; ')}. Skor berbobot Hipotesis dan titik berpresisi kabupaten dapat meleset.`,
      linimasa: [], pihak: [], regulasi: [], proyek: ar.map((b) => b.id).filter((id) => proyekAda.has(id)),
      sumber: [{ j: 'Peta risiko sosial dan lingkungan proyek', p: 'Platform Jaringan METI (olahan dari KLHK/GFW, LandMark, InaRISK)', u: 'https://platformmeti.timitbnpb.workers.dev/risiko', t: risiko.tanggal_ambil }],
    });
  }
  // PSEL belum beroperasi per provinsi, di luar yang sudah dikurasi
  const pPer = new Map();
  for (const b of psel.baris.filter((x) => ['rencana', 'konstruksi', null].includes(x.status) && x.kode_bps && !kuratorProyek.has(x.proyek_id))) (pPer.get(prov2(b.kode_bps)) || pPer.set(prov2(b.kode_bps), []).get(prov2(b.kode_bps))).push(b);
  for (const [k, ar] of pPer) {
    if (!nama.has(k)) continue;
    const sum = new Map(); ar.flatMap((b) => b.sumber || []).forEach((s) => s.url && sum.set(s.url, { j: 'Pemberitaan proyek PSEL', p: new URL(s.url).hostname.replace(/^www\./, ''), u: s.url, t: s.tanggal }));
    out.push({
      id: 'psel-' + k, tema: 'sampah', status: 'aktif', bukti: 'media', wilayah: [k],
      judul: `Proyek sampah menjadi energi (PSEL) di ${nama.get(k)}: tarif, lahan, dan jadwal`,
      ringkas: `${ar.length} proyek PSEL di ${nama.get(k)} berstatus rencana atau konstruksi (${[...new Set(ar.map((b) => b.kota))].slice(0, 5).join(', ')}). Perpres 109/2025 menghapus tipping fee pemda dan menggantinya dengan pembelian listrik oleh PLN dengan kompensasi dari pusat; kepastian lahan, pasokan sampah, dan jadwal operasi masih menjadi isu tiap kota.`,
      linimasa: [], pihak: [{ nama: 'Danantara', org_id: 'l_43f00f6a72', peran: 'pengembang program', posisi: 'Memimpin program PSEL bersama pemerintah daerah.', s: null }], regulasi: ['perpres-109-2025'].filter((r) => regAda.has(r)),
      proyek: ar.map((b) => b.proyek_id).filter((id) => proyekAda.has(id)), sumber: [...sum.values()].slice(0, 6),
    });
  }
  return out.map((i) => ({ ...i, sumber: (i.sumber || []).filter((s) => s.u) }));
}

export function bangun() {
  const nas = baca('data/isu/nasional.json'), dae = baca('data/isu/daerah.json');
  const prov = baca('public/data/wilayah.json').baris.map((b) => ({ kode: b.kode, nama: b.nama }));
  const proyekAda = new Set(baca('public/data/proyek.json').baris.map((b) => b.id));
  const regAda = new Set(baca('public/data/regulasi.json').baris.map((b) => b.id));
  const psel = baca('public/data/psel.json');
  const kuratorProyek = new Set([...nas.isu, ...dae.isu].flatMap((i) => i.proyek || []));
  const tur = turunan({ prov, desa: baca('public/data/desa_energi_mandiri.json'), rued: baca('public/data/rued_capaian.json'), besar: baca('public/data/proyek_besar.json'), risiko: baca('public/data/risiko_proyek.json'), psel, proyekAda, regAda, kuratorProyek: new Set([...kuratorProyek].map((id) => id.replace(/^psel_/, ''))) });
  const kons = baca('public/data/konsultasi.json').baris;
  const berita = baca('public/data/berita.json').baris.filter(lolosBerita);
  const semua = [
    ...nas.isu.map((i) => normal(i, 'nasional')), ...dae.isu.map((i) => normal(i, 'daerah')),
    ...tur.map((i) => normal(i, 'daerah', true)),
  ];
  for (const i of semua) {
    if (i._konsultasi) {
      const k = kons.find((x) => x.id === i._konsultasi);
      // hanya ringkasan publik; butir posisi internal (nomor >= 23) tak disalin
      if (k?.posisi_meti?.ringkas) i.posisi_meti = { ringkas: k.posisi_meti.ringkas, tanggal: k.posisi_meti.tanggal ?? null, sumber: null, sumber_teks: k.posisi_meti.sumber ?? null };
      if (k) i.konsultasi = { id: k.id, tahap: k.tahap, tenggat: k.tenggat, instansi: k.instansi, tautan: k.tautan };
    }
    i.berita_ids = i._kata.length ? berita.filter((b) => cocokBerita(i._kata, b.judul)).sort((a, b) => b.terbit.localeCompare(a.terbit)).slice(0, 8).map((b) => b.id) : [];
    delete i._kata; delete i._konsultasi;
  }
  // keterkaitan antarisu: proyek sama (kuat), atau regulasi sama
  for (const i of semua) {
    const dasar = (j) => j.id === i.id ? 0 : 2 * j.proyek_ids.filter((x) => i.proyek_ids.includes(x)).length + j.regulasi_ids.filter((x) => i.regulasi_ids.includes(x)).length;
    const skor = (j) => dasar(j) ? dasar(j) + (j.tingkat === 'nasional' ? 0.5 : 0) : 0;
    i.terkait = semua.map((j) => [j.id, skor(j)]).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1] || urut(a[0], b[0])).slice(0, 6).map(([id]) => id);
  }
  const perProv = {};
  for (const i of semua) for (const k of i.prov) perProv[k] = (perProv[k] || 0) + 1;
  return {
    lapis: 'isu', dibangun_pada: nas.tanggal_ambil, tanggal_ambil: nas.tanggal_ambil, tingkat_bukti: 'media',
    catatan: 'Ringkasan berparafrase. Isu turunan (auto) dihitung dari lapis data lain; klaim dukungan/penolakan warga berasal dari media dan bisa saling bertentangan.',
    meta: { jumlah: semua.length, nasional: semua.filter((i) => i.tingkat === 'nasional').length, daerah: semua.filter((i) => i.tingkat === 'daerah').length, auto: semua.filter((i) => i.auto).length, per_provinsi: Object.fromEntries(Object.entries(perProv).sort(([a], [b]) => urut(a, b))) },
    baris: semua.sort((a, b) => (a.tingkat === b.tingkat ? lengkapi(b.terbaru || '0') .localeCompare(lengkapi(a.terbaru || '0')) || urut(a.id, b.id) : a.tingkat === 'nasional' ? -1 : 1)),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const hasil = JSON.stringify(bangun());
  const tujuan = path.join(AKAR, 'public/data/isu.json');
  if (process.argv.includes('--cek')) { if (!fs.existsSync(tujuan) || fs.readFileSync(tujuan, 'utf8') !== hasil) { console.error('isu.json basi: jalankan node scripts/pipa/isu_bangun.mjs'); process.exit(1); } }
  else { fs.writeFileSync(tujuan, hasil); const m = JSON.parse(hasil).meta; console.log(`isu.json: ${m.jumlah} isu (${m.nasional} nasional, ${m.daerah} daerah, ${m.auto} turunan), ${Object.keys(m.per_provinsi).length} provinsi`); }
}
