/* Skor kecocokan kawasan industri/KEK untuk perusahaan bertarget RE100 atau net zero. Fungsi murni (tanpa DOM), dipakai layar dan uji.
   Semua bobot dan ambang adalah HIPOTESIS (EST): alat bantu menyaring, bukan penilaian kelayakan. Komponen tanpa data dikeluarkan dan bobot dibagi ulang. */
export const TEKNOLOGI = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi"];
export const PULAU = ["sumatera", "jawa", "bali-nusra", "kalimantan", "sulawesi", "maluku-papua"];
/* bobot (jumlah 100), Hipotesis */
export const BOBOT = { ebt: 22, cukup: 8, gardu: 20, bpp: 10, izin: 15, proyek_prov: 7, proyek_radius: 8, skema: 5, sektor: 5 };
export const AMBANG = { gardu_dekat_km: 5, gardu_jauh_km: 50, proyek_penuh: 3, cukup_rasio_penuh: 100 };
/* sektor perusahaan -> kata kunci pada kegiatan kawasan (kegiatan KEK ditulis kek.go.id, Inggris) */
export const SEKTOR = {
  pangan: /palm oil|coconut|food|fishing|sago|rubber|agro/i,
  kimia: /petrochemical|chemical/i,
  logam: /metal|nickel|smelter|bauxite|steel|mineral/i,
  tekstil: /textile|clothing|garment|apparel/i,
  "kayu-kertas": /wood|forestry|paper|pulp/i,
  digital: /digital|electronic|creative|technology/i,
  otomotif: /automotive|ship|boat|MRO/i,
  logistik: /logistic/i,
};
/* kelompok sektor SBTi/RE100 (korporat.json sektor_grup) -> kunci SEKTOR; selain ini "semua" */
export function sektorDariGrup(g) {
  const s = String(g || "");
  if (/Textile|Apparel|Footwear/i.test(s)) return "tekstil";
  if (/Packaging|Forest|Paper/i.test(s)) return "kayu-kertas";
  if (/Food|Beverage|Agricultur/i.test(s)) return "pangan";
  if (/Chemical/i.test(s)) return "kimia";
  if (/Metal|Mining|Steel/i.test(s)) return "logam";
  if (/Software|Technology|Telecom|Electronic/i.test(s)) return "digital";
  if (/Retail|Logistic|Transport/i.test(s)) return "logistik";
  return "semua";
}
const klem = (x, a = 0, b = 100) => Math.max(a, Math.min(b, x));
/* persentil tengah-peringkat 0-100 di antara nilai yang ada; nilai tunggal -> 50 */
export function persentil(v, semua) {
  const a = semua.filter((x) => x != null && Number.isFinite(x));
  if (v == null || !a.length) return null;
  const bawah = a.filter((x) => x < v).length, sama = a.filter((x) => x === v).length;
  return klem(((bawah + 0.5 * sama) / a.length) * 100);
}
/** Nilai per provinsi untuk pilihan teknologi `tek` dan kebutuhan `mw`. Mengembalikan Map kode -> {komponen: {skor, nilai}} */
export function perProvinsi(prov, { tek, mw }) {
  const pilih = tek.filter((k) => TEKNOLOGI.includes(k));
  const nilaiTek = (p, k) => (k === "surya" ? p.pvout : p.potensi_mw[k]);
  const pctTek = Object.fromEntries(pilih.map((k) => [k, prov.map((p) => nilaiTek(p, k))]));
  const mwProyek = (p) => pilih.reduce((a, k) => a + (p.proyek[k]?.mw || 0), 0);
  const semuaBpp = prov.map((p) => p.bpp?.rp_kwh ?? null), semuaProyek = prov.map(mwProyek);
  const out = new Map();
  for (const p of prov) {
    const pc = pilih.map((k) => persentil(nilaiTek(p, k), pctTek[k])).filter((x) => x != null);
    const pot = pilih.map((k) => p.potensi_mw[k]).filter((x) => x != null).reduce((a, b) => a + b, 0);
    const adaPot = pilih.some((k) => p.potensi_mw[k] != null);
    const rasio = adaPot && mw > 0 ? pot / mw : null;
    out.set(p.kode, {
      ebt: pc.length ? { skor: pc.reduce((a, b) => a + b, 0) / pc.length, nilai: { pvout: p.pvout, per_tek: Object.fromEntries(pilih.map((k) => [k, nilaiTek(p, k)])) } } : null,
      cukup: rasio != null ? { skor: klem((Math.log10(Math.max(rasio, 1)) / Math.log10(AMBANG.cukup_rasio_penuh)) * 100), nilai: { potensi_mw: pot, rasio } } : null,
      bpp: p.bpp ? { skor: persentil(p.bpp.rp_kwh, semuaBpp), nilai: p.bpp } : null,
      izin: p.izin != null ? { skor: p.izin, nilai: { skor: p.izin } } : null,
      proyek_prov: pilih.length ? { skor: mwProyek(p) > 0 ? persentil(mwProyek(p), semuaProyek) : 0, nilai: { mw: mwProyek(p), n: pilih.reduce((a, k) => a + (p.proyek[k]?.n || 0), 0) } } : null,
    });
  }
  return out;
}
/** Skor satu kawasan. kb = { mw, tek:[..], sektor }, d = lokasi_hijau.json, pp = hasil perProvinsi */
export function skorKawasan(k, kb, d, pp) {
  const dasar = pp.get(k.kode) ?? {}, kom = {};
  const sedia = (id, x) => { if (x && x.skor != null && Number.isFinite(x.skor)) kom[id] = { skor: klem(x.skor), nilai: x.nilai ?? null }; };
  for (const id of ["ebt", "cukup", "bpp", "izin", "proyek_prov"]) sedia(id, dasar[id]);
  if (k.jaringan) {
    const km = Math.min(k.jaringan.gardu_km ?? Infinity, k.jaringan.saluran_km ?? Infinity);
    if (Number.isFinite(km)) sedia("gardu", { skor: ((AMBANG.gardu_jauh_km - km) / (AMBANG.gardu_jauh_km - AMBANG.gardu_dekat_km)) * 100, nilai: { km, ...k.jaringan } });
  }
  if (k.proyek_dekat && kb.tek.length) {
    const dekat = k.proyek_dekat.filter((x) => kb.tek.includes(x.tek));
    sedia("proyek_radius", { skor: (Math.min(dekat.length, AMBANG.proyek_penuh) / AMBANG.proyek_penuh) * 100, nilai: { n: dekat.length, mw: dekat.reduce((a, x) => a + (x.mw || 0), 0), daftar: dekat } });
  }
  const bukti = d.ppa.filter((p) => p.kode.includes(k.kode));
  const bukti2 = d.ppa.filter((p) => !p.kode.includes(k.kode) && p.pulau.includes(k.pulau));
  if (bukti.length) sedia("skema", { skor: 100, nilai: { daftar: bukti, tingkat: "provinsi" } });
  else if (bukti2.length) sedia("skema", { skor: 60, nilai: { daftar: bukti2, tingkat: "pulau" } });
  const re = SEKTOR[kb.sektor];
  if (re && k.kegiatan?.length) sedia("sektor", { skor: k.kegiatan.some((g) => re.test(g)) || re.test(k.nama) ? 100 : 0, nilai: { kegiatan: k.kegiatan } });
  let b = 0, s = 0;
  for (const [id, x] of Object.entries(kom)) { b += BOBOT[id]; s += BOBOT[id] * x.skor; x.bobot = BOBOT[id]; }
  return { k, kom, skor: b ? s / b : null, dasar: b };
}
/** Peringkat semua kawasan yang lolos saringan pulau/titik. */
export function peringkat(d, kb) {
  const pp = perProvinsi(d.provinsi, kb);
  const pulau = kb.pulau?.length ? new Set(kb.pulau) : null;
  return d.kawasan.filter((k) => (!pulau || pulau.has(k.pulau)) && (!kb.hanyaTitik || k.titik_tepat))
    .map((k) => skorKawasan(k, kb, d, pp)).filter((r) => r.skor != null)
    .sort((a, b) => b.skor - a.skor || b.dasar - a.dasar || a.k.nama.localeCompare(b.k.nama, "id")).map((r, i) => ({ ...r, no: i + 1 }));
}
/** Alasan untuk pil: komponen kuat (>= 70) dan lemah (<= 30), diurut menurut sumbangan bobot. */
export function alasan(r) {
  const a = Object.entries(r.kom).map(([id, x]) => ({ id, skor: x.skor, bobot: x.bobot }));
  const kuat = a.filter((x) => x.skor >= 70).sort((x, y) => y.skor * y.bobot - x.skor * x.bobot).slice(0, 3);
  const lemah = a.filter((x) => x.skor <= 30).sort((x, y) => y.bobot * (100 - y.skor) - x.bobot * (100 - x.skor)).slice(0, 1);
  return [...kuat.map((x) => ({ ...x, arah: "kuat" })), ...lemah.map((x) => ({ ...x, arah: "lemah" }))];
}
