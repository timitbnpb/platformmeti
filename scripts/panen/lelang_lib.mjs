/* /lelang: perakit dan pemeriksa public/data/lelang.json. Murni (tanpa jaringan); sumbernya seed terkurasi + tender.json + regulasi.json. */
import { kodeProv } from "../../public/inti/prov_singkat.js";

export const TAHAP = ["rencana", "pengumuman", "prakualifikasi", "penawaran", "pemenang", "ppa", "cod", "batal"];
export const SKEMA = ["lelang_terbuka", "pemilihan_langsung", "penunjukan_langsung", "kerja_sama_anak_usaha", "lelang_pemerintah", "tidak_dinyatakan"];
export const TEKNOLOGI = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "penyimpanan", "campuran"];
export const BUKTI = ["resmi", "media", "kajian", "via-pihak-ketiga", "kata-pihak", "est", "hipotesis"];
const URL_OK = /^https:\/\/[^\s]+$/;
const TGL_OK = /^\d{4}(-\d{2}(-\d{2})?)?$/;

/** Rakit lelang.json. seed = lelang_seed.mjs; tender = tender.json (ESDM); regulasi = regulasi.json. */
export function bangun({ seed, tender, regulasi, proyek, program, tanggal }) {
  const reg = new Map((regulasi?.baris || []).map((r) => [r.id, r]));
  const sumber = seed.SUMBER.map((s) => ({ ...s, tanggal_ambil: seed.TGL_AMBIL }));
  const ada = new Set(sumber.map((s) => s.id));
  const SUM = { "berita-cnbc-lelang-2025": "s-cnbc-lelang-2025" };
  const dariTender = (tender?.baris || []).map((r) => {
    const kode = kodeProv(r.provinsi);
    return {
      id: "lel_" + r.id, nama: r.judul, kategori: "pemerintah", penyelenggara: { nama: r.instansi, org_id: null }, teknologi: r.teknologi === "pltp" ? "panas-bumi" : "campuran",
      kapasitas_mw: r.rencana_mw ?? null, kapasitas_satuan: "MW", lokasi: { teks: r.lokasi || r.provinsi || "", kode_bps: kode ? [kode] : [] }, skema: "lelang_pemerintah", tahap: "pengumuman", tahun: r.tahun,
      riwayat: [{ tahap: "pengumuman", tanggal: r.tanggal, presisi: "hari", catatan: "Lelang wilayah panas bumi oleh Kementerian ESDM; pemenang belum ditemukan.", sumber_id: SUM[r.sumber_id] || r.sumber_id }],
      peserta_jumlah: null, peserta: [], pemenang: [], harga: null, investasi_usd_juta: null, proyek_id: [], program_id: [], regulasi_id: [], sumber_id: SUM[r.sumber_id] || r.sumber_id, tingkat_bukti: r.tingkat_bukti, catatan: "Baris dari tender.json (lelang WKP/PSPE 2025).",
    };
  });
  const putaran = [...seed.PUTARAN, ...dariTender].map((p) => ({ ...p, tanggal: (p.riwayat.filter((x) => !x.tentatif).at(-1) || p.riwayat.at(-1)).tanggal }));
  const peristiwa = seed.PERISTIWA.map((e) => {
    const r = e.regulasi_id && reg.get(e.regulasi_id);
    return { ...e, tanggal: e.tanggal || r?.tanggal_ditetapkan || null };
  });
  return {
    lapis: "publik", dibangun_pada: tanggal || seed.TGL_AMBIL, jumlah: putaran.length,
    meta: {
      metode: "Seed terkurasi dari halaman terbuka yang dibaca 8 Nov 2026 (media, siaran, kajian) ditambah tender.json; tanpa login, tanpa CAPTCHA. Harga hanya ditulis bila sumber menyebut angkanya; selisih terhadap patokan Perpres 112/2022 dihitung di layar dari peluang.json.",
      celah: [
        "Portal pengadaan resmi PLN (eproc.pln.co.id) dan LPSE berCAPTCHA/login tidak dibaca; hasil tender per paket (peserta, harga tawar) hampir seluruhnya tidak diumumkan di sumber terbuka.",
        "Hanya satu putaran (Cirata) yang punya harga PPA publik pada seed ini; harga tawar peserta kalah tidak ditemukan.",
        "Pengadaan PLTS/PLTMH oleh pemerintah daerah dan kementerian lain berada di LPSE yang tidak dibaca; belum ada barisnya.",
        "Putaran 2015-2018 (mis. PLTB Sidrap, Tolo, PLTS kecil) belum tercatat karena belum ada sumber terbuka yang terbaca lengkap; kejadian skema 2013-2017 ada di linimasa dari kajian IESR.",
      ],
    },
    tautan: nama({ putaran, peristiwa, reg, proyek, program }),
    sumber, putaran, dpt: seed.DPT, peristiwa,
  };
}

const KODE = { perpres: "Perpres", permen: "Permen" };
function nama({ putaran, peristiwa, reg, proyek, program }) {
  const pr = new Map((proyek?.baris || []).map((r) => [r.id, r.nama])), pg = new Map((program?.baris || []).map((r) => [r.id, r.nama]));
  const ids = (f) => [...new Set([...putaran.flatMap((p) => p[f] || []), ...(f === "regulasi_id" ? peristiwa.map((e) => e.regulasi_id).filter(Boolean) : [])])].sort();
  const o = (daftar, f) => Object.fromEntries(daftar.map((i) => [i, f(i)]).filter((x) => x[1]));
  return {
    proyek: o(ids("proyek_id"), (i) => pr.get(i)), program: o(ids("program_id"), (i) => pg.get(i)),
    regulasi: o(ids("regulasi_id"), (i) => { const r = reg.get(i); return r && `${KODE[r.jenis] || r.jenis} ${r.nomor}/${r.tahun}`; }),
  };
}

/** Daftar galat (kosong = lolos). */
export function periksa(d, { proyekAda, orgAda, regAda, programAda } = {}) {
  const g = [], idSumber = new Set((d.sumber || []).map((s) => s.id)), idDouble = new Set();
  for (const s of d.sumber || []) if (!URL_OK.test(s.url)) g.push(`sumber ${s.id}: url bukan https`);
  const cekSumber = (id, w) => { if (!id || !idSumber.has(id)) g.push(`${w}: sumber_id ${id} tak ada`); };
  for (const p of d.putaran || []) {
    if (idDouble.has(p.id)) g.push(`${p.id}: id ganda`); idDouble.add(p.id);
    if (!TAHAP.includes(p.tahap)) g.push(`${p.id}: tahap ${p.tahap}`);
    if (!SKEMA.includes(p.skema)) g.push(`${p.id}: skema ${p.skema}`);
    if (!TEKNOLOGI.includes(p.teknologi)) g.push(`${p.id}: teknologi ${p.teknologi}`);
    if (!BUKTI.includes(p.tingkat_bukti)) g.push(`${p.id}: tingkat_bukti`);
    cekSumber(p.sumber_id, p.id);
    if (!p.riwayat?.length) g.push(`${p.id}: riwayat kosong`);
    for (const r of p.riwayat || []) { if (!TAHAP.includes(r.tahap)) g.push(`${p.id}: riwayat tahap ${r.tahap}`); if (!TGL_OK.test(r.tanggal || "")) g.push(`${p.id}: tanggal riwayat ${r.tanggal}`); cekSumber(r.sumber_id, p.id + " riwayat"); }
    if (p.harga) { cekSumber(p.harga.sumber_id, p.id + " harga"); if (!(p.harga.usd_sen_kwh > 0)) g.push(`${p.id}: harga tanpa angka`); }
    if (p.kapasitas_mw != null && !(p.kapasitas_mw > 0)) g.push(`${p.id}: kapasitas`);
    for (const k of p.lokasi?.kode_bps || []) if (!/^\d{2}$/.test(k)) g.push(`${p.id}: kode_bps ${k}`);
    if (proyekAda) for (const x of p.proyek_id || []) if (!proyekAda.has(x)) g.push(`${p.id}: proyek ${x} tak ada`);
    if (orgAda) for (const o of [...(p.peserta || []), ...(p.pemenang || []), p.penyelenggara]) if (o?.org_id && !orgAda.has(o.org_id)) g.push(`${p.id}: org ${o.org_id} tak ada`);
    if (regAda) for (const x of p.regulasi_id || []) if (!regAda.has(x)) g.push(`${p.id}: regulasi ${x} tak ada`);
    if (programAda) for (const x of p.program_id || []) if (!programAda.has(x)) g.push(`${p.id}: program ${x} tak ada`);
    if (/[—–]/.test(JSON.stringify(p))) g.push(`${p.id}: em dash`);
  }
  for (const e of d.dpt || []) cekSumber(e.sumber_id, e.id);
  for (const e of d.peristiwa || []) { cekSumber(e.sumber_id, e.id); if (e.regulasi_id && regAda && !regAda.has(e.regulasi_id)) g.push(`${e.id}: regulasi`); }
  return g;
}
