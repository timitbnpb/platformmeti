// public/data/pendanaan.json: skema, proyek, dan negara donor untuk tab Pendanaan Direktori. Tanpa jaringan.
//   node scripts/pipa/pendanaan.mjs <tgl>
// Masukan: pendanaan_internasional, jetp_cipp, obligasi_hijau, karbon_proyek, insentif, keuangan (public/data) + data/pendanaan/skema_kurasi.json.
// Nilai proyek memakai kurs Rp per US$ bertanggal (sama dengan layar Direktori); tiap baris wajib bersumber (KP D5).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const KURS = { usd_idr: 18150, tanggal: '2026-10-30', sumber: 'open.er-api.com, tercatat di layar Direktori' };
export const JENIS_SKEMA = ['hibah', 'pinjaman lunak', 'blended', 'obligasi hijau', 'JETP', 'kredit karbon', 'insentif fiskal', 'dana riset'];
import { token, jaccard } from './cocok_proyek.mjs';
const KAPITAL = /\b[A-Z]{6,}\b/;

// Negara dari kode organisasi IATI; lembaga multilateral (XM-DAC-4xxxx, XI-BRIDGE, XI-IATI-WBTF) tidak punya negara.
const NEGARA = {
  DE: ['Jerman', 'DE'], CA: ['Kanada', 'CA'], US: ['Amerika Serikat', 'US'], AU: ['Australia', 'AU'], FR: ['Prancis', 'FR'], KR: ['Korea Selatan', 'KR'],
  SE: ['Swedia', 'SE'], NO: ['Norwegia', 'NO'], FI: ['Finlandia', 'FI'], NZ: ['Selandia Baru', 'NZ'], GB: ['Inggris', 'GB'], NL: ['Belanda', 'NL'],
  DK: ['Denmark', 'DK'], JP: ['Jepang', 'JP'], EU: ['Uni Eropa', 'EU'],
};
const REF_KHUSUS = { 'XM-DAC-7': 'NL', 'XM-DAC-3-1': 'DK', 'XM-DAC-5-7': 'DE', 'XM-DAC-701-8': 'JP', 'XI-IATI-EC_INTPA': 'EU' };
export function negaraDari(ref) {
  const r = String(ref || '');
  if (REF_KHUSUS[r]) return NEGARA[REF_KHUSUS[r]];
  const m = r.match(/^([A-Z]{2})-/);
  return m && NEGARA[m[1]] && !/^XI|^XM/.test(r) ? NEGARA[m[1]] : null;
}
const STATUS_IATI = { 'selesai-menurut-tanggal': 'selesai', 'berjalan-menurut-tanggal': 'berjalan', Dropped: 'batal', Pipeline: 'persiapan' };
const STATUS_KEU = { konstruksi: 'konstruksi', rencana: 'persiapan', beroperasi: 'beroperasi', dibatalkan: 'batal' };
// Fasilitas GCF yang melayani banyak negara: nilai penuh bukan porsi Indonesia, jadi tidak dijumlahkan.
const MULTINEGARA = /\b(global|asean|climate investor|srmi|peen|peeb|facility|navis|green guarantee)\b|other asean/i;
const rapi = (s) => String(s || '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
const kap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const usd = (idr) => Math.round(idr / KURS.usd_idr);
const url = (u) => (/^https:\/\//.test(u || '') ? u : null);

export function skemaDariKurasi(r, tgl) {
  return {
    id: r.id, jenis_entri: 'skema', nama: r.nama, pemberi: r.pemberi, jenis: r.jenis, sasaran: r.sasaran, sektor: r.sektor, uraian: r.uraian, cara: r.cara,
    ...(r.nilai ? { nilai: r.nilai, mata_uang: r.mata_uang, nilai_usd: r.mata_uang === 'USD' ? r.nilai : undefined } : {}), ...(r.besaran ? { besaran: r.besaran } : {}),
    ...(r.detail_sumber ? Object.fromEntries(['kelayakan', 'alur', 'dokumen', 'tenor', 'tiket', 'lama_proses', 'kontak_teks', 'kontak_url', 'instrumen_detail', 'detail_sumber', 'pemberi_alias'].filter((f) => r[f] != null).map((f) => [f, r[f]])) : {}),
    ...(r.iso2 ? { iso2: r.iso2 } : {}), ...(r.negara ? { negara: r.negara } : {}), status: 'berjalan', url: r.url, sumber: [{ url: r.url, tanggal: tgl }],
    sumber_url: r.url, tanggal_periksa: tgl, tingkat_bukti: 'kata-pihak', isi_status: 'sebagian',
    isi_catatan: 'Ringkasan dari pengetahuan umum tentang skema; syarat, besaran, dan tenggat terkini ada di laman resmi pemberi.',
  };
}

export function skemaDariInsentif(i, tgl) {
  return {
    id: 'sk_' + i.id, jenis_entri: 'skema', nama: kap(i.instrumen), pemberi: 'Kementerian Keuangan', jenis: 'insentif fiskal', iso2: 'ID', sasaran: ['pelaku usaha'],
    sektor: ['pembiayaan', 'kebijakan'], uraian: i.syarat_ringkas, cara: [`Rujuk ${i.nomor_aturan} dan ajukan sesuai ketentuan peraturan itu.`],
    status: 'berjalan', url: i.sumber_url, sumber: [{ url: i.sumber_url, tanggal: i.tanggal }], sumber_url: i.sumber_url, tanggal_periksa: i.tanggal, tingkat_bukti: i.tingkat_bukti,
    ...(i.berlaku_sampai ? { tenggat: i.berlaku_sampai } : {}),
  };
}

export function proyekDariIati(r) {
  const porsi = r.porsi_energi_persen != null ? r.porsi_energi_persen / 100 : 1;
  const multi = /Green Climate/.test(r.pemberi) && MULTINEGARA.test(r.nama);
  const b = {
    id: r.id, jenis_entri: 'proyek', nama: r.nama, pemberi: r.pemberi, pemberi_ref: r.pemberi_ref, lembaga_id: r.pemberi_org_id || undefined, penerima: r.penerima || undefined,
    pelaksana: r.penerima ? [r.penerima] : [], jenis: '', tahun: r.tahun, selesai: r.tanggal_selesai ? Number(r.tanggal_selesai.slice(0, 4)) : undefined,
    status: STATUS_IATI[r.status] || '', sektor: [], prov: [], proyek_id: r.proyek_id || undefined, penerima_org_id: r.penerima_org_id || undefined,
    url: url(r.sumber_url), sumber: [{ url: r.sumber_url, tanggal: r.tanggal }], sumber_url: r.sumber_url, tanggal_periksa: r.tanggal, tingkat_bukti: r.tingkat_bukti, asal: 'iati',
    nilai_catatan: r.satuan_nilai + (porsi < 1 ? `; dikali porsi energi ${r.porsi_energi_persen} persen` : ''),
  };
  if (r.nilai_usd != null) {
    b.nilai_aktivitas_usd = r.nilai_usd;
    if (multi) b.nilai_catatan += '; fasilitas multinegara, nilai penuh bukan porsi Indonesia sehingga tidak dijumlahkan';
    else b.nilai_usd = Math.round(r.nilai_usd * porsi);
  }
  return b;
}

export function proyekDariKeuangan(r) {
  const idr = r.nilai_idr != null && r.nilai_usd == null;
  const wb = /^pd_wb_/.test(r.id);
  return {
    id: r.id, jenis_entri: 'proyek', nama: r.nama, pemberi: r.pemberi || undefined, lembaga_id: r.pemberi_org_id || undefined, penerima: r.penerima || undefined, pelaksana: r.penerima ? [r.penerima] : [],
    jenis: wb ? 'pinjaman lunak' : '', tahun: r.tahun, status: STATUS_KEU[r.status] || '', sektor: [], prov: [], proyek_id: r.proyek_id || undefined,
    ...(idr ? { nilai: r.nilai_idr, mata_uang: 'IDR', nilai_usd: usd(r.nilai_idr), nilai_catatan: `Rp ${KURS.usd_idr} per US$ (${KURS.tanggal})` } : r.nilai_usd != null ? { nilai_usd: r.nilai_usd, nilai_catatan: 'USD komitmen menurut sumber' } : {}),
    url: url(r.sumber_url), sumber: [{ url: r.sumber_url, tanggal: r.tanggal }], sumber_url: r.sumber_url, tanggal_periksa: r.tanggal, tingkat_bukti: r.tingkat_bukti, asal: wb ? 'bank-dunia' : 'berita',
  };
}

export function proyekDariJetp(j, sumber) {
  const pd = j.pendana || {};
  const nilai = pd.pembiayaan_jetp_usd ?? pd.pembiayaan_usd ?? null;
  return {
    id: 'pd_' + j.id, jenis_entri: 'proyek', nama: j.nama_id || j.nama, judul_en: j.nama, pemberi: 'JETP Indonesia (IPG dan GFANZ)', penerima: j.pengembang && !/^-+(\s-+)*$/.test(j.pengembang) ? j.pengembang : undefined,
    pelaksana: pd.pelaksana ? [pd.pelaksana] : [], jenis: 'JETP', status: 'disetujui', sektor: j.teknologi ? [j.teknologi] : [], prov: j.lokasi?.provinsi ? [j.lokasi.provinsi] : [], proyek_id: j.proyek_id || undefined,
    ...(nilai != null ? { nilai_usd: nilai, nilai_catatan: `${pd.jenis || 'pembiayaan'}${pd.perantara ? ' lewat ' + pd.perantara : ''}` } : {}),
    url: url(j.sumber_url), sumber: [{ url: j.sumber_url, tanggal: j.tanggal }], sumber_url: j.sumber_url, tanggal_periksa: j.tanggal, tingkat_bukti: j.tingkat_bukti, asal: 'jetp',
  };
}

export function proyekDariObligasi(o) {
  const usdN = o.satuan_nilai === 'USD juta' ? o.nilai * 1e6 : o.satuan_nilai === 'IDR miliar' ? usd(o.nilai * 1e9) : null;
  return {
    id: 'pd_' + o.id, jenis_entri: 'proyek', nama: o.instrumen, pemberi: 'Investor pasar modal', penerima: o.penerbit, pelaksana: [o.penerbit], lembaga_id: undefined, penerima_org_id: o.penerbit_org_id || undefined,
    jenis: 'obligasi hijau', tahun: o.tahun, status: 'terbit', sektor: [], prov: [], uraian: o.penggunaan_dana || undefined,
    ...(usdN != null ? { nilai_usd: Math.round(usdN), ...(o.satuan_nilai === 'IDR miliar' ? { nilai: o.nilai * 1e9, mata_uang: 'IDR', nilai_catatan: `Rp ${KURS.usd_idr} per US$ (${KURS.tanggal})` } : { nilai_catatan: 'USD menurut sumber' }) } : {}),
    url: url(o.sumber_url), sumber: [{ url: o.sumber_url, tanggal: o.tanggal }], sumber_url: o.sumber_url, tanggal_periksa: o.tanggal, tingkat_bukti: o.tingkat_bukti, asal: 'obligasi',
  };
}

export function proyekDariKarbon(k) {
  const d = k.kredit?.diterbitkan;
  return {
    id: 'pd_' + k.id, jenis_entri: 'proyek', nama: k.nama, pelaksana: k.pengembang ? [k.pengembang] : [], penerima: k.pengembang || undefined, jenis: 'kredit karbon', tahun: Number((k.tanggal_registrasi || k.periode_kredit?.mulai || '').slice(0, 4)) || undefined,
    status: rapi(k.status), sektor: k.teknologi ? [k.teknologi] : [], prov: k.lokasi?.provinsi ? [k.lokasi.provinsi] : [], organisasi_id: k.organisasi_id || undefined, proyek_id: k.proyek_id || undefined,
    uraian: `Proyek terdaftar di ${k.registri} (${k.registri_id}); ${d != null ? new Intl.NumberFormat('id-ID').format(d) + ' ' + (k.kredit.satuan || 'tCO2e') + ' kredit sudah diterbitkan' : 'jumlah kredit terbit belum tercatat'}. Nilai uang tidak dilaporkan registri.`,
    url: url(k.sumber_url), sumber: [{ url: k.sumber_url, tanggal: k.tanggal }], sumber_url: k.sumber_url, tanggal_periksa: k.tanggal, tingkat_bukti: k.tingkat_bukti, asal: 'registri-karbon',
  };
}

// Satu proyek di atas 5 miliar USD tidak masuk akal untuk portofolio ini (galat satuan atau angka program): nilai ditahan, tidak dijumlahkan.
export const BATAS_NILAI_USD = 5e9;
export function jagaNilai(p) {
  if (p.nilai_usd > BATAS_NILAI_USD) { p.nilai_aktivitas_usd = p.nilai_usd; delete p.nilai_usd; p.nilai_catatan = `${p.nilai_catatan || 'nilai menurut sumber'}; di atas 5 miliar USD untuk satu proyek, ditahan dan tidak dijumlahkan sampai dicek ke sumber`; }
  return p;
}
const wbId = (u) => (String(u || '').match(/\/(P\d{5,7})\b/) || [])[1];

export function proyekDariAiib(a) {
  return {
    id: 'pd_' + a.id, jenis_entri: 'proyek', nama: a.nama, pemberi: 'Asian Infrastructure Investment Bank', jenis: '', tahun: a.tahun, status: a.status === 'disetujui' ? 'disetujui' : 'persiapan', sektor: [], prov: [],
    ...(a.nilai_usd != null ? { nilai_usd: a.nilai_usd, nilai_catatan: `${a.nilai_asli} menurut AIIB (${a.status})` } : {}),
    url: url(a.sumber_url), sumber: [{ url: a.sumber_url, tanggal: a.tanggal_periksa }], sumber_url: a.sumber_url, tanggal_periksa: a.tanggal_periksa, tingkat_bukti: a.tingkat_bukti, asal: 'aiib',
  };
}
// tautan hasil scripts/pipa/pendana_proyek.mjs: baris AIIB tanpa proyek_id dapat proyek_id; baris Bank Dunia (proyek_id wb_) dapat proyek_terkait_ids
export function terapkanTautan(proyek, t) {
  for (const p of proyek) {
    const k = p.id.replace(/^pd_/, ''), x = t.tautan[k] || t.tautan['wb_' + wbId(p.sumber_url)];
    if (!x) continue;
    if (!p.proyek_id) { p.proyek_id = x.proyek_id; p.proyek_kecocokan = 'nama-pasti'; } else if (p.proyek_id !== x.proyek_id) p.proyek_terkait_ids = [x.proyek_id];
  }
  return proyek;
}

export function periksa(b) {
  const g = [];
  for (const f of ['id', 'nama', 'jenis_entri', 'sumber_url', 'tanggal_periksa', 'tingkat_bukti']) if (!b[f]) g.push(`${b.id}: ${f} kosong`);
  if (b.jenis_entri === 'skema' && !JENIS_SKEMA.includes(b.jenis)) g.push(`${b.id}: jenis skema`);
  if (b.jenis_entri === 'skema' && (!Array.isArray(b.cara) || !b.cara.length || !b.url || !b.pemberi || !b.sasaran?.length)) g.push(`${b.id}: skema tanpa pemberi, sasaran, cara, atau tautan`);
  if (b.url && !/^https:\/\//.test(b.url)) g.push(`${b.id}: url`);
  if (/[—–]/.test(JSON.stringify(b))) g.push(`${b.id}: em dash`);
  if (KAPITAL.test(`${b.uraian || ''} ${(b.cara || []).join(' ')}`)) g.push(`${b.id}: KAPITAL penuh`);
  if (/[\w.+-]+@[\w-]+\.\w+/.test(JSON.stringify(b))) g.push(`${b.id}: data pribadi`);
  if (b.nilai_usd != null && !(b.nilai_usd >= 0)) g.push(`${b.id}: nilai_usd`);
  return g;
}

export function rakitNegara(proyek) {
  const per = new Map();
  for (const p of proyek) {
    const n = negaraDari(p.pemberi_ref);
    if (!n) continue;
    const e = per.get(n[1]) || { negara: n[0], iso2: n[1], total_usd: 0, jumlah_proyek: 0, badan: new Set(), rincian: [], proyek_pendanaan_ids: [], sumber: new Map() };
    e.jumlah_proyek++; e.badan.add(p.pemberi); e.proyek_pendanaan_ids.push(p.id); e.total_usd += p.nilai_usd || 0;
    e.rincian.push({ tahun: p.tahun, kejadian: p.nama, usd: p.nilai_usd || 0, penerima: p.penerima ? [p.penerima] : [], sumber_url: p.sumber_url });
    e.sumber.set(p.sumber_url, { url: p.sumber_url });
    per.set(n[1], e);
  }
  return [...per.values()].map((e) => ({ ...e, badan: [...e.badan].sort(), sumber: [...e.sumber.values()].slice(0, 8), rincian: e.rincian.sort((a, b) => b.usd - a.usd), proyek_pendanaan_ids: e.proyek_pendanaan_ids.sort() }))
    .sort((a, b) => b.total_usd - a.total_usd || a.negara.localeCompare(b.negara));
}

export function ringkasan(skema, proyek) {
  const sk = {}; skema.forEach((s) => (sk[s.jenis] = (sk[s.jenis] || 0) + 1));
  const nilai = new Map();
  for (const p of proyek) if (p.pemberi && p.nilai_usd) { const e = nilai.get(p.pemberi) || { pemberi: p.pemberi, total_usd: 0, jumlah_proyek: 0 }; e.total_usd += p.nilai_usd; e.jumlah_proyek++; nilai.set(p.pemberi, e); }
  return {
    skema_per_jenis: JENIS_SKEMA.filter((j) => sk[j]).map((j) => ({ jenis: j, jumlah: sk[j] })),
    nilai_per_pemberi: [...nilai.values()].sort((a, b) => b.total_usd - a.total_usd).slice(0, 10),
    total_proyek_usd: proyek.reduce((s, p) => s + (p.nilai_usd || 0), 0), jumlah_skema: skema.length, jumlah_proyek: proyek.length,
  };
}


// ---- Pendana: satu baris per pemberi, hanya dari proyek bersumber di atas. MW hanya bila proyeknya tertaut ke proyek.json atau JETP; teknologi dari proyek tertaut atau kata di judul.
const KUNCI_TEK = [['panas-bumi', /geotherm|panas bumi|pltp/i], ['surya', /solar|surya|plts|photovoltaic|\bpv\b/i], ['hidro', /hydro|hidro|plta|pumped/i], ['bayu', /\bwind\b|bayu|angin|pltb/i], ['bioenergi', /biomass|biogas|bioenergi|biofuel|biodiesel/i], ['jaringan', /grid|transmission|network|electrification|electricity access|jaringan|listrik desa/i], ['efisiensi', /efficiency|efisiensi/i]];
export const teknologiDariJudul = (n) => KUNCI_TEK.filter(([, re]) => re.test(n || '')).map(([k]) => k);
export function jenisPendana(nama) {
  if (/JETP/.test(nama)) return 'JETP';
  if (/export|\bECA\b|JBIC|NEXI|EKF|Euler/i.test(nama)) return 'ECA';
  if (/Asian Development|World Bank|Green Climate|Global Environment|Islamic Development|Asian Infrastructure|Climate Investment|United Nations|European Commission|Private Infrastructure|\bIFC\b/i.test(nama)) return 'multilateral dan DFI';
  if (/\bPT\b|Tbk|Danamart|Bank\b/.test(nama)) return 'swasta';
  return 'pemerintah donor';
}
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const mwDari = (r) => { const k = (r?.kapasitas || []).find((c) => c.satuan === 'MW' && Number.isFinite(c.nilai)); return k ? k.nilai : null; };
export function rakitPendana(proyek, refProyek = [], mwJetp = {}) {
  const ref = new Map(refProyek.map((r) => [r.id, r]));
  const per = new Map();
  for (const p of proyek) {
    if (!p.pemberi || p.pemberi === 'Investor pasar modal') continue;
    const k = p.pemberi_ref || p.pemberi;
    const e = per.get(k) || { nama: new Map(), lembaga_id: undefined, proyek: [] };
    e.nama.set(p.pemberi, (e.nama.get(p.pemberi) || 0) + 1);
    e.lembaga_id ||= p.lembaga_id; e.proyek.push(p); per.set(k, e);
  }
  return [...per.values()].map((e) => {
    const nama = [...e.nama].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
    const ps = e.proyek.slice().sort((a, b) => (b.nilai_usd || 0) - (a.nilai_usd || 0) || a.id.localeCompare(b.id));
    const mw = ps.map((p) => (p.proyek_id && ref.has(p.proyek_id) ? mwDari(ref.get(p.proyek_id)) : null) ?? mwJetp[p.id] ?? null);
    const tek = new Set(); ps.forEach((p) => { const r = p.proyek_id && ref.get(p.proyek_id); (r?.teknologi ? [r.teknologi] : teknologiDariJudul(p.nama)).forEach((t) => tek.add(t)); });
    const nilai = ps.reduce((a, p) => a + (p.nilai_usd || 0), 0);
    return { id: 'pn_' + slug(nama), nama, ...(e.lembaga_id ? { lembaga_id: e.lembaga_id } : {}), jenis_pendana: jenisPendana(nama), jumlah_proyek: ps.length,
      total_mw: mw.some((m) => m != null) ? Math.round(mw.reduce((a, m) => a + (m || 0), 0) * 100) / 100 : null, mw_n: mw.filter((m) => m != null).length,
      nilai_usd: nilai, nilai_label: nilai ? 'min' : null, nilai_n: ps.filter((p) => p.nilai_usd).length,
      teknologi: [...tek].sort(), proyek_nama: ps.slice(0, 3).map((p) => p.nama), proyek_ids: ps.map((p) => p.id).sort() };
  }).sort((a, b) => b.jumlah_proyek - a.jumlah_proyek || b.nilai_usd - a.nilai_usd || a.nama.localeCompare(b.nama)).map((x, i) => ({ peringkat: i + 1, ...x }));
}

const baca = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));

export function rakit(tgl) {
  const pi = baca('public/data/pendanaan_internasional.json'), jt = baca('public/data/jetp_cipp.json'), ob = baca('public/data/obligasi_hijau.json');
  const kb = baca('public/data/karbon_proyek.json'), ins = baca('public/data/insentif.json'), ke = baca('public/data/keuangan.json'), kur = baca('data/pendanaan/skema_kurasi.json');
  const orgs = new Set(baca('public/data/organisasi.json').baris.map((o) => o.id));
  const skema = [...kur.map((r) => skemaDariKurasi(r, tgl)), ...ins.baris.filter((i) => i.jenis === 'fiskal' && i.status_berlaku === 'berlaku').map((i) => skemaDariInsentif(i, tgl))];
  const iati = pi.baris.map(proyekDariIati), adaWb = new Set(iati.map((p) => wbId(p.sumber_url)).filter(Boolean));
  const keu = ke.baris.filter((r) => r.kelompok === 'pendanaan' && !adaWb.has(wbId(r.sumber_url))).map(proyekDariKeuangan);
  const jetp = jt.baris.filter((j) => j.ebt === true).map((j) => proyekDariJetp(j));
  const obl = ob.baris.filter((o) => !/^Agregat|^Total/.test(o.instrumen) && o.nilai !== undefined).map(proyekDariObligasi);
  const kar = kb.baris.map(proyekDariKarbon);
  const fa = path.join(ROOT, 'data/pendanaan/aiib_indonesia.json'), ft = path.join(ROOT, 'data/pendanaan/tautan_proyek.json');
  const aiib = fs.existsSync(fa) ? baca('data/pendanaan/aiib_indonesia.json').baris.map(proyekDariAiib) : [];
  let proyek = [...iati, ...keu, ...jetp, ...obl, ...kar, ...aiib].map(jagaNilai);
  for (const p of proyek) for (const k of ['lembaga_id', 'penerima_org_id', 'organisasi_id']) if (p[k] && !orgs.has(p[k])) delete p[k];
  tautkanNama(proyek, baca('public/data/proyek.json').baris);
  if (fs.existsSync(ft)) terapkanTautan(proyek, baca('data/pendanaan/tautan_proyek.json'));
  proyek = proyek.map((p) => JSON.parse(JSON.stringify(p).replace(/\s*[—–]\s*/g, ' - '))).sort((a, b) => a.id.localeCompare(b.id));
  skema.sort((a, b) => JENIS_SKEMA.indexOf(a.jenis) - JENIS_SKEMA.indexOf(b.jenis) || a.id.localeCompare(b.id));
  const sumber = [...pi.sumber, ...jt.sumber, ...ob.sumber, ...kb.sumber, ...ins.sumber, ...ke.sumber].map(({ id, judul, penerbit, url: u, lisensi }) => ({ id, judul, penerbit, url: u, lisensi }));
  return { skema, proyek, negara: rakitNegara(proyek), ringkasan: ringkasan(skema, proyek), pendana: rakitPendana(proyek, baca('public/data/proyek.json').baris, Object.fromEntries(jt.baris.filter((j) => j.ebt === true && Number.isFinite(j.kapasitas_mw)).map((j) => ['pd_' + j.id, j.kapasitas_mw]))), sumber: [...new Map(sumber.map((s) => [s.id + s.url, s])).values()] };
}

// Tautkan proyek donor tanpa proyek_id ke proyek.json lewat nama (Jaccard >= 0,8); lebih lemah dari itu tidak ditautkan.
export function tautkanNama(proyek, ref) {
  const r = ref.map((q) => ({ id: q.id, tok: token(q.nama) }));
  for (const p of proyek) {
    if (p.proyek_id || !p.pemberi) continue;
    let b = null; const tk = token(p.nama);
    for (const q of r) { const j = jaccard(tk, q.tok); if (j >= 0.8 && (!b || j > b.j)) b = { j, id: q.id }; }
    if (b) { p.proyek_id = b.id; p.proyek_kecocokan = 'nama'; }
  }
  return proyek;
}

function bangun(tgl) {
  const h = rakit(tgl), baris = [...h.skema, ...h.proyek];
  const gal = baris.flatMap(periksa);
  if (new Set(baris.map((b) => b.id)).size !== baris.length) gal.push('id ganda');
  if (gal.length) { console.error(gal.join('\n')); process.exit(1); }
  const out = { lapis: 'publik', dibangun_pada: tgl, kurs: KURS, jumlah: baris.length, ringkasan: h.ringkasan, pendanaan: baris, negara: h.negara, pendana: h.pendana, sumber: h.sumber };
  fs.writeFileSync(path.join(ROOT, 'public/data/pendanaan.json'), JSON.stringify(out) + '\n', 'utf8');
  console.log(h.skema.length, 'skema', h.proyek.length, 'proyek', h.negara.length, 'negara', Math.round(h.ringkasan.total_proyek_usd / 1e9) + ' miliar USD');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tgl = process.argv[2];
  if (!/^\d{4}-\d\d-\d\d$/.test(tgl || '')) { console.log('pendanaan.mjs <tgl>'); process.exit(1); }
  bangun(tgl);
}
