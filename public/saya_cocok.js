/* saya_cocok.js: logika murni dasbor "METI untuk saya" (/saya). Tanpa DOM dan tanpa impor, jadi diuji langsung oleh tests/saya.test.mjs.
   Cocok = aturan sederhana yang bisa dijelaskan ke pengguna (alasan ikut dikembalikan): sasaran dari kategori organisasi, sektor dari kepakaran + keahlian + topik yang diikuti. */

// Kategori organisasi (organisasi.json kategori.kode) -> sasaran pemohon di skema pendanaan (pendanaan.json sasaran[]).
export const SASARAN_KATEGORI = {
  swasta: ["swasta", "pelaku usaha", "industri", "pengembang proyek"], bumn: ["BUMN", "pelaku usaha"],
  pemda: ["pemerintah daerah", "pemerintah", "BUMD"], "kementerian-lembaga": ["pemerintah", "kementerian"],
  "perguruan-tinggi": ["perguruan tinggi", "lembaga riset", "peneliti", "dosen"], "think-tank": ["lembaga riset", "peneliti"],
  "lsm-yayasan": ["LSM", "masyarakat"], koperasi: ["masyarakat", "pelaku usaha"], asosiasi: ["pelaku usaha", "industri"],
  keuangan: ["lembaga keuangan", "investor"], ormawa: ["masyarakat"], donor: [], internasional: [], global: [],
};
// Kepakaran/sektor (slug data) -> id topik (public/data/topik/indeks.json). Slug tanpa topik tidak muncul di saran topik.
export const KEPAKARAN_TOPIK = {
  surya: "surya", bayu: "bayu", hidro: "hidro", "panas-bumi": "panas-bumi", bioenergi: "bioenergi", penyimpanan: "penyimpanan", hidrogen: "hidrogen",
  jaringan: "jaringan", efisiensi: "efisiensi", karbon: "karbon", nuklir: "nuklir", "transisi-adil": "transisi-berkeadilan", pembiayaan: "pembiayaan-hijau",
  "biomassa-sampah": "sampah-energi", sampah: "sampah-energi", elektrifikasi: "kendaraan-listrik",
};
export const SEKTOR_TOPIK = { "sampah-energi": "biomassa-sampah", "transisi-berkeadilan": "transisi-adil", "pembiayaan-hijau": "pembiayaan", "kendaraan-listrik": "elektrifikasi" };

const kecil = (s) => String(s ?? "").trim().toLowerCase();
const irisan = (a, b) => { const B = new Set(b); return a.filter((x) => B.has(x)); };
const unik = (a) => [...new Set(a)];

/** Sektor pengguna: kepakaran organisasi + keahlian profil yang berupa slug dikenal + topik yang diikuti. */
export function sektorPengguna({ org, profil, topikIkut = [] }) {
  const dikenal = new Set([...Object.keys(KEPAKARAN_TOPIK), "kebijakan", "industri", "riset-data", "energi-desa"]);
  return unik([...(org?.kepakaran ?? []), ...(profil?.keahlian ?? []).map(kecil).filter((k) => dikenal.has(k)), ...topikIkut.map((t) => SEKTOR_TOPIK[t] || t)]);
}
export const sasaranPengguna = (org) => SASARAN_KATEGORI[org?.kategori?.kode] ?? [];

/** Skema pendanaan berjalan yang cocok: skor 3 bila sasaran cocok + 1 per sektor sama. Tanpa organisasi dan tanpa sektor = kosong. */
export function cocokSkema(skema, { org, profil, topikIkut = [] }) {
  const sas = sasaranPengguna(org), sek = sektorPengguna({ org, profil, topikIkut });
  return skema.filter((x) => x.jenis_entri === "skema" && !/selesai|batal|ditarik/.test(x.status || ""))
    .map((x) => {
      const s = irisan(sas.map(kecil), (x.sasaran ?? []).map(kecil)), k = irisan(sek, x.sektor ?? []);
      return { x, skor: (s.length ? 3 : 0) + k.length, sasaran: (x.sasaran ?? []).filter((v) => s.includes(kecil(v))), sektor: k };
    })
    .filter((r) => r.skor > 0).sort((a, b) => b.skor - a.skor || a.x.nama.localeCompare(b.x.nama, "id"));
}

/** Lowongan terbit yang cocok: teknologi sama dengan sektor (2) dan/atau provinsi sama (1). */
export function cocokKerja(baris, { kodeProv, sektor }) {
  const S = new Set(sektor);
  return baris.map((x) => ({ x, tek: S.has(x.teknologi), prov: !!kodeProv && x.kode_prov === kodeProv }))
    .filter((r) => r.tek || r.prov).sort((a, b) => (b.tek * 2 + b.prov) - (a.tek * 2 + a.prov) || b.x.id - a.x.id);
}

/** Acara pada atau sesudah hariIni (YYYY-MM-DD), terdekat dulu; ditandai bila mitra/penyelenggaranya organisasi yang diikuti. */
export function acaraTerdekat(kalender, hariIni, orgIkut = []) {
  const O = new Set(orgIkut);
  return kalender.filter((e) => e.tanggal >= hariIni)
    .map((e) => ({ x: e, diikuti: (e.organisasi_ids ?? []).some((i) => O.has(i)) }))
    .sort((a, b) => a.x.tanggal.localeCompare(b.x.tanggal) || b.diikuti - a.diikuti);
}

/** Diskusi regulasi terbuka (belum lewat tenggat): yang diikuti dulu, lalu tenggat terdekat (tanpa tenggat paling akhir), lalu paling ramai. */
export function diskusiTerbuka(baris, hariIni) {
  const tg = (d) => (d.tenggat ? String(d.tenggat).slice(0, 10) : "9999-12-31");
  return baris.filter((d) => d.status === "terbit" && tg(d) >= hariIni)
    .sort((a, b) => (b.diikuti ? 1 : 0) - (a.diikuti ? 1 : 0) || tg(a).localeCompare(tg(b)) || (b.n_komentar + b.n_usulan) - (a.n_komentar + a.n_usulan));
}

/** Proyek di provinsi (nama) atau teknologi yang diikuti; terbaru dulu (nomor id naik = lebih baru masuk). */
export function proyekBaru(proyek, { provNama = [], teknologi = [] }) {
  const P = new Set(provNama.map(kecil)), T = new Set(teknologi);
  const no = (id) => Number(String(id).replace(/\D/g, "")) || 0;
  return proyek.map((x) => ({ x, prov: P.has(kecil(x.lokasi?.provinsi)), tek: T.has(x.teknologi) }))
    .filter((r) => r.prov || r.tek).sort((a, b) => no(b.x.id) - no(a.x.id));
}

/** Organisasi sejenis yang belum diikuti: kategori sama (2) + 1 per kepakaran sama; minimal skor 2, maks `batas`. */
export function saranOrganisasi(organisasi, org, ikut, batas = 6) {
  if (!org) return [];
  const sek = new Set(org.kepakaran ?? []);
  return organisasi.filter((o) => o.id !== org.id && !ikut.has("organisasi|" + o.id))
    .map((o) => {
      const bersama = (o.kepakaran ?? []).filter((k) => sek.has(k));
      return { x: o, bersama, skor: (o.kategori?.kode === org.kategori?.kode ? 2 : 0) + bersama.length + (o.logo ? 0.5 : 0) };
    })
    .filter((r) => r.skor >= 2).sort((a, b) => b.skor - a.skor || a.x.nama.localeCompare(b.x.nama, "id")).slice(0, batas);
}

/** Topik yang belum diikuti dan berasal dari sektor pengguna, hanya topik yang ada di indeks. */
export function saranTopik(sektor, idTopikAda, ikut, batas = 6) {
  const ada = new Set(idTopikAda);
  return unik(sektor.map((k) => KEPAKARAN_TOPIK[k]).filter((id) => id && ada.has(id) && !ikut.has("topik|" + id))).slice(0, batas);
}

/** Daftar periksa profil: [kunci, lengkap]. Dipakai angka "N dari M" dan chip di kepala. */
export function kelengkapan(p) {
  const r = p?.riwayat ?? {};
  return [
    ["foto", !!p?.foto], ["jabatan", !!(p?.jabatan && p?.instansi)], ["organisasi", !!p?.organisasi_id], ["lokasi", !!(p?.kota || p?.kode_prov)],
    ["bio", !!p?.bio], ["keahlian", !!p?.keahlian?.length], ["riwayat", !!(r.pengalaman?.length || r.pendidikan?.length)], ["tautan", !!Object.keys(p?.tautan ?? {}).length],
  ];
}

/** Item ringkasan (/api/ikuti/ringkasan) -> peta "jenis|ref" ke item terbaru. */
export function terbaruPerEntitas(items) {
  const m = new Map();
  for (const it of items) { const k = it.jenis + "|" + it.ref; if (!m.has(k) || it.waktu > m.get(k).waktu) m.set(k, it); }
  return m;
}
