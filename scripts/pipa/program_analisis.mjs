// public/data/program_analisis.json: analisis lengkap tiap program prioritas nasional energi.
// Masukan: data/program_analisis.json (ditulis tangan, tiap butir bersumber URL) + potret publik (proyek, regulasi, organisasi,
// orang, berita, siaran pers). Tanpa jaringan. Teks dwibahasa ditulis sebagai pasangan [id, en] dan di sini dijadikan {id, en}.
//   node scripts/pipa/program_analisis.mjs
// Kosong + catatan bila tak ada: regulasi yang belum ada di basis dicatat di `catatan_regulasi`, bukan dikarang.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const KELOMPOK = ['regulator', 'pelaksana', 'pengembang', 'pendana', 'pemda', 'masyarakat'];
export const TAHAP = ['rencana', 'lelang', 'konstruksi', 'berjalan'];
export const JENIS_ISU = ['regulasi', 'lahan', 'pendanaan', 'teknis', 'sosial', 'tarif'];
export const TINGKAT = ['tinggi', 'sedang', 'rendah'];

// Satuan teks Indonesia -> Inggris; satuan baku (GW, MW, kms) sama di kedua bahasa.
const SATUAN_EN = { persen: 'percent', 'juta kL': 'million kL', 'Rp triliun': 'Rp trillion', 'US$ miliar': 'US$ billion', 'juta ton': 'million tons', inisiatif: 'initiatives', proyek: 'projects', kota: 'cities', unit: 'units', PLTU: 'plants', 'hingga 1:12': 'to 1:12' };
const T = (x) => (Array.isArray(x) ? { id: x[0], en: x[1] } : { id: x, en: x });
const baca = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const urlSah = (u) => /^https:\/\/[^\s]+$/.test(u || '');
// Bukti "resmi" hanya untuk host pemerintah; selebihnya media.
const bukti = (u) => { try { return /(^|\.)(go\.id)$/.test(new URL(u).hostname) ? 'resmi' : 'media'; } catch { return 'media'; } };
const tglTampil = (s) => String(s || '');

export function bangun(src, d) {
  const reg = new Map(d.regulasi.map((r) => [r.id, r]));
  const org = new Map(d.organisasi.map((o) => [o.id, o]));
  const orang = new Map(d.orang.map((o) => [o.id, o]));
  const foto = d.berita_foto || {};
  const catatanReg = [];
  const kode = new Set();
  const baris = src.program.map((g, urut) => {
    if (kode.has(g.kode)) throw new Error('kode ganda: ' + g.kode);
    kode.add(g.kode);
    if (!TAHAP.includes(g.tahap)) throw new Error(g.kode + ': tahap tak dikenal ' + g.tahap);
    const cek = (u, ket) => { if (!urlSah(u)) throw new Error(`${g.kode}: url tak sah (${ket}): ${u}`); };

    const dasar = (g.dasar_hukum || []).map((h) => {
      const r = h.reg ? reg.get(h.reg) : null;
      if (h.reg && !r) catatanReg.push({ program: g.kode, reg: h.reg });
      return { reg_id: r ? r.id : null, nama: h.nama, ket: T(h.ket), judul: r?.judul ?? null, status: r?.status ?? null, url_pdf: r?.url_pdf ?? null, url_sumber: r?.url_sumber ?? null };
    });

    const c = g.proyek || {};
    const re = c.nama_re ? new RegExp(c.nama_re, 'i') : null;
    const pj = d.proyek.filter((p) => (c.program_ids || []).some((i) => (p.program_ids || []).includes(i)) || (c.teknologi || []).includes(p.teknologi) || (re && re.test(p.nama)));
    const mw = (p) => { const k = p.kapasitas?.[0]; return k && Number.isFinite(Number(k.nilai)) ? Number(k.nilai) : null; };
    const per_status = {};
    for (const p of pj) { const s = p.status?.[0]?.nilai || 'tidak-diketahui'; per_status[s] = (per_status[s] || 0) + 1; }
    const proyek = pj.slice(0, 400).map((p) => ({
      id: p.id, nama: p.nama, tek: p.teknologi || null, prov: p.lokasi?.provinsi || null, kap: mw(p), sat: p.kapasitas?.[0]?.satuan || null,
      st: p.status?.[0]?.nilai || 'tidak-diketahui', lat: p.lokasi?.lat ?? null, lng: p.lokasi?.lng ?? null, presisi: p.lokasi?.presisi || null,
    }));

    const pelaksana = (g.pelaksana || []).map((x) => {
      if (!KELOMPOK.includes(x.kel)) throw new Error(g.kode + ': kelompok tak dikenal ' + x.kel);
      const o = x.org ? org.get(x.org) : null, p = x.orang ? orang.get(x.orang) : null;
      if (x.org && !o) throw new Error(`${g.kode}: organisasi ${x.org} tak ada`);
      if (x.orang && !p) throw new Error(`${g.kode}: orang ${x.orang} tak ada`);
      return { kel: x.kel, nama: x.nama, org_id: o?.id ?? null, logo: o?.logo ?? null, peran: T(x.peran), orang_id: p?.id ?? null, orang_nama: p?.nama ?? null, orang_jabatan: p?.jabatan_terkini ?? null };
    });

    for (const k of ['target', 'tonggak', 'realisasi', 'isu', 'pendanaan']) for (const x of g[k] || []) cek(x.url, k);
    for (const x of g.berita?.luar || []) cek(x.url, 'berita');
    const isu = (g.isu || []).map((x) => {
      if (!JENIS_ISU.includes(x.jenis) || !TINGKAT.includes(x.tingkat)) throw new Error(g.kode + ': isu salah jenis/tingkat');
      return { jenis: x.jenis, tingkat: x.tingkat, judul: T(x.j), uraian: T(x.u), url: x.url, bukti: bukti(x.url) };
    });
    const tonggak = [...(g.tonggak || [])].sort((a, b) => String(a.tgl).localeCompare(String(b.tgl)))
      .map((x) => ({ tgl: tglTampil(x.tgl), perkiraan: !!x.perkiraan, peristiwa: T(x.t), url: x.url, bukti: bukti(x.url) }));

    const bre = g.berita?.re ? new RegExp(g.berita.re, 'i') : null;
    const lokal = bre ? d.berita.filter((b) => bre.test(b.judul)).map((b) => ({ id: b.id, judul: b.judul, url: b.url, media: b.media, terbit: String(b.terbit).slice(0, 10), foto: !!foto[b.id] })) : [];
    const luar = (g.berita?.luar || []).map((b) => ({ id: null, judul: b.judul, url: b.url, media: b.media, terbit: b.tgl, foto: false }));
    const lihat = new Set();
    const berita = [...luar, ...lokal].filter((b) => (lihat.has(b.url) ? false : lihat.add(b.url))).sort((a, b) => String(b.terbit).localeCompare(String(a.terbit))).slice(0, 8);
    const siaran = bre ? d.siaran.filter((s) => bre.test(`${s.judul} ${s.ringkasan || ''}`)).sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 4).map((s) => ({ id: s.id, judul: s.judul, tanggal: s.tanggal, foto: s.foto || null })) : [];

    return {
      urut, kode: g.kode, program_id: g.program_id ?? null, nama: T(g.nama), ikon: g.ikon, gambar: g.gambar ?? null,
      tahap: g.tahap, tahap_ket: T(g.tahap_ket), ringkasan: T(g.ringkasan), dasar_hukum: dasar,
      target: (g.target || []).map((x) => ({ label: T(x.label), angka: x.angka, satuan: T([x.satuan, SATUAN_EN[x.satuan] ?? x.satuan]), tahun: x.tahun ?? null, tgl: x.tgl, url: x.url, bukti: bukti(x.url) })),
      tonggak,
      realisasi: (g.realisasi || []).map((x) => ({ label: T(x.label), nilai: T(x.nilai), per: x.per, url: x.url, bukti: bukti(x.url) })),
      proyek_ringkas: { jumlah: pj.length, kapasitas_mw: Math.round(pj.reduce((s, p) => s + (p.kapasitas?.[0]?.satuan === 'MW' || p.kapasitas?.[0]?.satuan === 'MWp' ? mw(p) || 0 : 0), 0) * 10) / 10, per_status },
      proyek,
      pelaksana,
      pendanaan: (g.pendanaan || []).map((x) => ({ label: T(x.label), nilai: T(x.nilai), tgl: x.tgl, url: x.url, bukti: bukti(x.url) })),
      pendanaan_catatan: g.pendanaan_catatan ? T(g.pendanaan_catatan) : null,
      isu, berita, siaran_pers: siaran,
      posisi_meti: (g.posisi_meti || []).map((x) => ({ teks: T(x.t), sumber: x.sumber })),
      indikator: (g.indikator || []).map(T),
    };
  });
  return { lapis: 'publik', dibangun_pada: src.meta.diperbarui, jumlah: baris.length, meta: { catatan: src.meta.catatan, catatan_regulasi: catatanReg, ketentuan: 'Angka dan tanggal bersumber URL pada tiap butir; label EST tidak dipakai karena tak ada angka turunan. Butir tanpa sumber tidak dimuat.' }, baris };
}

function utama() {
  const pub = (n) => baca(`public/data/${n}.json`);
  const hasil = bangun(baca('data/program_analisis.json'), {
    proyek: pub('proyek').baris, regulasi: pub('regulasi').baris, organisasi: pub('organisasi').baris, orang: pub('orang').baris,
    berita: pub('berita').baris, berita_foto: pub('berita_foto'), siaran: pub('siaran_pers').baris,
  });
  fs.writeFileSync(path.join(ROOT, 'public/data/program_analisis.json'), JSON.stringify(hasil) + '\n');
  console.log(`program_analisis: ${hasil.jumlah} program, regulasi tak ada di basis: ${hasil.meta.catatan_regulasi.length}`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) utama();
