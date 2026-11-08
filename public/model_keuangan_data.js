/* /model-keuangan: asumsi bawaan per teknologi dan model bisnis. TIDAK ADA angka karangan di sini: tiap nilai bawaan datang dari berkas data
   dan membawa sumber + tingkat bukti + tanggal; nilai yang belum punya sumber dibiarkan kosong dan pengguna mengisi sendiri.
   Urutan prioritas capex/opex/FK/umur: public/data/biaya_bangun.json (bila ada) > kelayakan_rumus.js ASUMSI (IRENA, ESDM/DEA) > plts_atap_hitung.json. */
import { ASUMSI, KURS_RP } from "./inti/kelayakan_rumus.js";

/* patokan = kunci peluang.json harga_patokan; bio = jenis di tingkat bioenergi; asumsi = kunci kelayakan_rumus.ASUMSI; atap = kelompok plts_atap_hitung */
export const TEK = [
  { id: "surya-atap-rumah", ikon: "tek:surya", patokan: "surya", surya: true, atap: "rumah", mw: 0.005, bisnis: ["netmeter", "captive", "sewa"] },
  { id: "surya-ci", ikon: "tek:surya", patokan: "surya", surya: true, atap: "industri", mw: 0.5, bisnis: ["captive", "sewa", "esco", "ipp"] },
  { id: "surya-utilitas", ikon: "tek:surya", patokan: "surya", surya: true, asumsi: "plts", mw: 10, bisnis: ["ipp", "rec"] },
  { id: "surya-terapung", ikon: "tek:surya", patokan: "surya", surya: true, asumsi: "terapung", mw: 10, bisnis: ["ipp", "rec"] },
  { id: "surya-bess", ikon: "tek:surya", patokan: "surya", surya: true, mw: 10, bisnis: ["ipp", "captive", "rec"] },
  { id: "bayu", ikon: "tek:bayu", patokan: "bayu", asumsi: "pltb", mw: 20, bisnis: ["ipp", "rec"] },
  { id: "panas-bumi", ikon: "tek:panas-bumi", patokan: "panas_bumi", mw: 55, bisnis: ["ipp", "rec"] },
  { id: "plta", ikon: "tek:hidro", patokan: "hidro", mw: 20, bisnis: ["ipp", "rec"] },
  { id: "pltm", ikon: "tek:hidro", patokan: "hidro", asumsi: "mikrohidro", mw: 3, bisnis: ["ipp", "captive", "rec"] },
  { id: "biomassa", ikon: "tek:bioenergi", patokan: "bioenergi", bio: "PLTBm", mw: 10, bisnis: ["ipp", "captive", "rec"] },
  { id: "biogas-pome", ikon: "tek:bioenergi", patokan: "bioenergi", bio: "PLTBg", mw: 2, bisnis: ["ipp", "captive", "rec"] },
  { id: "biogas-ternak", ikon: "tek:bioenergi", patokan: "bioenergi", bio: "PLTBg", mw: 0.5, bisnis: ["captive", "ipp", "rec"] },
  { id: "wte", ikon: "tek:biomassa-sampah", patokan: null, mw: 10, bisnis: ["ipp", "rec"] },
  { id: "bess", ikon: "tek:penyimpanan", patokan: null, mw: 10, bisnis: ["ipp", "captive"] },
  { id: "hidrogen", ikon: "tek:hidrogen", patokan: null, mw: 10, bisnis: ["captive", "rec"] },
];
export const BISNIS = { ipp: "petir", captive: "pabrik", sewa: "gedung", esco: "transaksi", netmeter: "kalkulator", rec: "lencana" };

/** Batas atas MW dari teks kapasitas ("s.d. 10 MW", ">1 MW s.d. 3 MW", ">100 MW"). */
const batasMW = (k) => { const m = /s\.d\.\s*([\d.,]+)\s*MW/.exec(k); return m ? parseFloat(m[1].replace(",", ".")) : Infinity; };

/** Tingkat harga patokan Perpres 112/2022 untuk kapasitas mw: { koef, tahun11, kapasitas } atau null. */
export function patokan(peluang, tek, mw) {
  const g = tek.patokan && peluang?.harga_patokan?.teknologi?.[tek.patokan];
  if (!g) return null;
  const ls = g.tingkat.filter((x) => !tek.bio || x.jenis === tek.bio).sort((a, b) => batasMW(a.kapasitas) - batasMW(b.kapasitas));
  const x = ls.find((r) => mw <= batasMW(r.kapasitas)) || ls.at(-1);
  return x ? { koef: x.koef_1_10, tahun11: x.tahun_11_dst, kapasitas: x.kapasitas, tahunMaks: typeof g.tahun_maks === "object" ? g.tahun_maks[tek.bio] : g.tahun_maks } : null;
}

/** Skala acuan per teknologi (id baris biaya_bangun.json); urutan pertama = bawaan. Hidrogen sengaja kosong (tak ada sumber). */
export const SKALA = {
  "surya-atap-rumah": ["plts-atap-rumah"], "surya-ci": ["plts-atap-industri", "plts-cni-as"],
  "surya-utilitas": ["plts-utilitas-dunia", "plts-program-100gwp", "plts-utilitas-as", "plts-14-proyek-pln"],
  "surya-terapung": ["plts-terapung-cirata", "plts-terapung-karangkates"], "surya-bess": ["plts-bess-hibrid-sulteng", "plts-bess-hibrid-selayar"],
  bayu: ["pltb-dunia", "pltb-as", "pltb-sidrap-1", "pltb-sidrap-2"], "panas-bumi": ["pltp-indonesia"], plta: ["plta-dunia"], pltm: ["pltm-asia-lain"],
  biomassa: ["bioenergi-dunia"], "biogas-pome": ["bioenergi-dunia"], "biogas-ternak": ["bioenergi-dunia"], wte: ["pltsa-psel-bandung", "pltsa-psel-palembang"], bess: [], hidrogen: [],
};

/**
 * Asumsi bawaan: { nilai: {kunci: angka|null}, sumber: {kunci: {sumber, bukti, tanggal}} }.
 * Satuan antarmuka: persen sebagai angka persen (8 = 8 persen), uang USD/kW dan Rp, kurs Rp/USD.
 * konteks = { peluang, atap, bangun, karbon, prov (pvout kWh/kWp/thn), tarifPln (Rp/kWh), tarifLabel, acuan }
 */
export function bawaan(tek, bisnis, k) {
  const v = {}, s = {};
  const set = (kunci, nilai, sumber, bukti, tanggal) => { v[kunci] = nilai; if (nilai !== null) s[kunci] = { sumber, bukti, tanggal }; };
  const um = k.atap?.asumsi?.umum, tglAtap = k.atap?.dibangun_pada, A = tek.asumsi && ASUMSI[tek.asumsi], bb = k.skalaRow || null;
  set("mw", bb?.mw_contoh ?? tek.mw, bb ? "mk.src.bangun" : "mk.src.contoh", "hipotesis", bb ? k.bangun?.dibangun_pada : null);
  const pat = patokan(k.peluang, tek, v.mw);
  // capex, opex, umur, fk, degradasi: baris skala biaya_bangun.json terpilih > kelayakan_rumus.ASUMSI (umur) > plts_atap_hitung
  const sb = (x) => x && { sumber: "mk.src.bangun", bukti: String(x.tingkat_bukti || "hipotesis").toLowerCase(), tanggal: x.tanggal || k.bangun?.dibangun_pada, id: x.sumber_id };
  const kursB = k.bangun?.kurs_rp_usd?.nilai || KURS_RP;
  set("kurs", kursB, "mk.src.kurs", "hipotesis", k.bangun?.dibangun_pada);
  const cx = bb && (bb.capex_usd_kw?.tengah != null ? { n: bb.capex_usd_kw.tengah, m: sb(bb.capex_usd_kw) }
    : bb.total_usd_juta ? { n: Math.round((bb.total_usd_juta * 1000) / bb.kapasitas_mwp), m: { sumber: "mk.src.bangun", bukti: "est", tanggal: k.bangun.dibangun_pada } }
    : bb.total_rp_miliar ? { n: Math.round((bb.total_rp_miliar * 1e6) / kursB / bb.kapasitas_mwp), m: { sumber: "mk.src.bangun", bukti: "est", tanggal: k.bangun.dibangun_pada } } : null);
  if (cx) set("capexUsdKw", cx.n, cx.m.sumber, cx.m.bukti, cx.m.tanggal);
  else if (A && !bb) set("capexUsdKw", A.capex, "mk.src.irena", "via-pihak-ketiga", null); else set("capexUsdKw", null);
  const ox = bb?.opex?.usd_kw_tahun?.tengah != null ? { n: bb.opex.usd_kw_tahun.tengah, m: sb(bb.opex.usd_kw_tahun) }
    : bb?.opex?.persen_capex_per_tahun && cx ? { n: Math.round(cx.n * bb.opex.persen_capex_per_tahun.nilai) / 100, m: sb(bb.opex.persen_capex_per_tahun) } : null;
  if (ox) set("opexUsdKwThn", ox.n, ox.m.sumber, ox.m.bukti, ox.m.tanggal);
  else if (A && !bb) set("opexUsdKwThn", A.opex, "mk.src.irena", "via-pihak-ketiga", null); else set("opexUsdKwThn", null);
  if (um && tek.atap) set("umur", um.umur_tahun.nilai, "mk.src.atap", "hipotesis", tglAtap);
  else if (A) set("umur", A.umur, "mk.src.irena", "via-pihak-ketiga", null);
  else if (pat?.tahunMaks) set("umur", pat.tahunMaks, "mk.src.masa_ppa", "resmi", String(k.peluang.harga_patokan.tahun)); else set("umur", null);
  if (tek.surya && k.prov && bb?.kelas !== "pembanding") set("fk", +((k.prov / 8760) * 100).toFixed(1), "mk.src.pvout", "est", tglAtap);
  else if (bb?.cf_persen?.tengah != null) set("fk", bb.cf_persen.tengah, sb(bb.cf_persen).sumber, sb(bb.cf_persen).bukti, sb(bb.cf_persen).tanggal);
  else if (A?.fc) set("fk", A.fc * 100, "mk.src.irena", "via-pihak-ketiga", null); else set("fk", null);
  if (um && tek.surya) set("degr", um.degradasi_persen_per_tahun.nilai, "mk.src.atap", "hipotesis", tglAtap); else set("degr", null);
  // penggantian inverter (surya atap) dari plts_atap_hitung
  if (um && tek.atap) { set("gantiTahun", um.ganti_inverter_tahun.nilai, "mk.src.atap", "hipotesis", tglAtap); set("gantiPersen", um.ganti_inverter_persen_capex.nilai, "mk.src.atap", "hipotesis", tglAtap); }
  else { set("gantiTahun", null); set("gantiPersen", null); }
  // tarif menurut model bisnis
  const ak = k.atap?.asumsi?.[tek.atap];
  const porsiAtap = ak ? ak.pakai_sendiri_persen.nilai : null;
  const kurs = v.kurs;
  v.acuan = bisnis === "ipp" || bisnis === "rec" ? (pat ? "perpres" : "manual") : (k.tarifPln ? "pln" : "manual");
  if (k.acuanPilih && (k.acuanPilih !== "perpres" || pat)) v.acuan = k.acuanPilih;
  if (v.acuan === "perpres") {
    const F = k.faktorLokasi ?? 1;
    set("tarif", Math.round((pat.koef * F * kurs) / 100), "mk.src.perpres", "resmi", String(k.peluang.harga_patokan.tahun));
    set("tarifTahun2", Math.round((pat.tahun11 * kurs) / 100), "mk.src.perpres", "resmi", String(k.peluang.harga_patokan.tahun));
  } else if (v.acuan === "bpp") {
    set("tarif", k.bppSistem.tarif, "mk.src.bpp", "resmi", k.bppSistem.tanggal); set("tarifTahun2", null);
  } else if (v.acuan === "pln") {
    set("tarif", k.tarifPln.tarif, "mk.src.pln", k.tarifPln.bukti, k.tarifPln.tanggal); set("tarifTahun2", null);
  } else { set("tarif", null); set("tarifTahun2", null); }
  set("tarifGanti", 11, "mk.src.perpres", "resmi", null);
  set("porsiBayar", bisnis === "ipp" || bisnis === "rec" ? 100 : porsiAtap ?? 100, porsiAtap && bisnis !== "ipp" ? "mk.src.atap" : "mk.src.model", "hipotesis", porsiAtap && bisnis !== "ipp" ? tglAtap : null);
  set("eskTarif", um ? um.kenaikan_tarif_persen_per_tahun.nilai : 0, um ? "mk.src.atap" : "mk.src.model", "hipotesis", um ? tglAtap : null);
  set("eskOpex", 0, "mk.src.model", "hipotesis", null);
  set("sewaRpKwp", 0, "mk.src.model", "hipotesis", null);
  // REC dan karbon
  set("recRpMwh", 0, "mk.src.model", "hipotesis", null);
  const hrg = k.karbon?.idxcarbon?.bulanan?.at(-1);
  if (bisnis === "rec" && hrg) set("karbonRpT", hrg.harga_rata, "mk.src.idxcarbon", "resmi", k.karbon.dibangun_pada); else set("karbonRpT", 0, "mk.src.model", "hipotesis", null);
  const grid = k.karbon?.faktor_emisi?.grid_est?.find((g) => g.id === k.grid);
  if (grid) set("emisiTMwh", grid.intensitas_t_per_mwh, "mk.src.emisi", "est", k.karbon.dibangun_pada); else set("emisiTMwh", 0, "mk.src.model", "hipotesis", null);
  // pendanaan dan pajak: tidak ada sumber untuk struktur modal; PPh badan 22 persen (UU 7/2021 HPP) hanya bila tercatat
  set("utang", 0, "mk.src.model", "hipotesis", null);
  set("bunga", null); set("tenor", null);
  set("pajak", 22, "mk.src.pph", "resmi", null);
  set("libur", 0, "mk.src.model", "hipotesis", null);
  set("susut", v.umur ?? null, "mk.src.model", "hipotesis", null);
  set("ppnPorsi", 0, "mk.src.model", "hipotesis", null);
  set("diskonto", um ? um.diskonto_persen.nilai : A ? A.wacc * 100 : null, um ? "mk.src.atap" : "mk.src.irena", um ? "hipotesis" : "hipotesis", um ? tglAtap : null);
  if (v.diskonto === null) set("diskonto", 8, "mk.src.model", "hipotesis", null);
  v.ppnDtp = false;
  const idS = bb?.capex_usd_kw?.sumber_id || bb?.cf_persen?.sumber_id || bb?.opex?.usd_kw_tahun?.sumber_id || bb?.opex?.persen_capex_per_tahun?.sumber_id || (bb?.total_usd_juta || bb?.total_rp_miliar ? bb.rujukan_proyek?.[0] : null);
  const sm = k.bangun?.sumber?.find((x) => x.id === idS), teks = sm ? `${sm.penerbit}, ${sm.tanggal_terbit || ""}`.replace(/, $/, "") + (bb.nama ? `: ${bb.nama}` : "") : bb?.nama || "";
  for (const x of Object.values(s)) if (x.sumber === "mk.src.bangun") x.teks = teks;
  return { nilai: v, sumber: s };
}

/** Param ke rumus (pecahan, fk dsb) dari nilai antarmuka; null bila masukan wajib belum lengkap (daftar kunci yang kurang). */
export function keParam(v) {
  const wajib = ["mw", "capexUsdKw", "opexUsdKwThn", "fk", "umur", "tarif", "kurs"];
  const kurang = wajib.filter((k) => !(v[k] > 0) && !(k === "opexUsdKwThn" && v[k] === 0));
  if (v.utang > 0) for (const k of ["tenor"]) if (!(v[k] > 0)) kurang.push(k);
  if (kurang.length) return { kurang };
  const u = (x) => (x || 0) / 100;
  return { p: {
    mw: v.mw, capexUsdKw: v.capexUsdKw, opexUsdKwThn: v.opexUsdKwThn, kurs: v.kurs, fk: u(v.fk), degr: u(v.degr), umur: v.umur,
    tarif: v.tarif, tarifTahun2: v.tarifTahun2 > 0 ? v.tarifTahun2 : null, tarifGanti: v.tarifGanti || 11, eskTarif: u(v.eskTarif), eskOpex: u(v.eskOpex),
    porsiBayar: v.porsiBayar === undefined || v.porsiBayar === null ? 1 : u(v.porsiBayar), sewaRpKwp: v.sewaRpKwp || 0, recRpMwh: v.recRpMwh || 0, karbonRpT: v.karbonRpT || 0, emisiTMwh: v.emisiTMwh || 0,
    utang: u(v.utang), bunga: u(v.bunga), tenor: v.tenor || 0, pajak: u(v.pajak), libur: v.libur || 0, susut: v.susut || v.umur,
    ppn: 0.11, ppnPorsi: u(v.ppnPorsi), ppnDtp: !!v.ppnDtp, gantiTahun: v.gantiTahun || 0, gantiPersen: u(v.gantiPersen), diskonto: u(v.diskonto),
  } };
}
