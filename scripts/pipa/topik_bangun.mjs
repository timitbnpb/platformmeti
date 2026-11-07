// Bangun public/data/topik/indeks.json dan public/data/topik/<id>.json dari data yang sudah ada di public/data (tanpa jaringan).
// Hanya mengiris dan menghitung; tidak ada angka karangan. Naskah panjang tulisan tangan ada di <id>.json (tidak disentuh).
// Pakai: node scripts/pipa/topik_bangun.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const D = "public/data/";
const baca = (n) => JSON.parse(readFileSync(D + n + ".json", "utf8"));
const hariIni = new Date().toISOString().slice(0, 10);
/* sumber Verra memuat tanggal sebagai nomor seri Excel (hari sejak 1899-12-30); ubah ke ISO, biarkan ISO apa adanya */
const tgl = (v) => (v == null || v === "" ? null : /^\d{4,6}$/.test(String(v)) && +v > 20000 ? new Date(Date.UTC(1899, 11, 30) + +v * 864e5).toISOString().slice(0, 10) : String(v));

/* kepakaran = tag di organisasi/berita/pustaka/riset/pakar/inovasi; tek = teknologi di proyek; reg = tag topik regulasi; kata = regex berita/acara/regulasi */
const TOPIK = [
  { id: "karbon", ikon: "karbon", foto: "", kep: ["karbon"], tek: [], reg: [], kata: /karbon|carbon|emisi|\bets\b|idxcarbon|net zero|nol bersih/i, regKata: /nilai ekonomi karbon|karbon|gas rumah kaca|paris agreement|framework convention|emisi nol bersih/i, regTolak: /remisi|uji emisi|gas buang|baku mutu emisi|retribusi/i },
  { id: "surya", ikon: "surya", foto: "/img/beranda/surya-cirata.webp", kep: ["surya"], tek: ["surya"], reg: ["surya"], kata: /surya|plts|solar|photovoltaic/i },
  { id: "bayu", ikon: "bayu", foto: "/img/beranda/bayu-sidrap.webp", kep: ["bayu"], tek: ["bayu"], reg: ["angin"], kata: /bayu|angin|pltb|wind/i },
  { id: "panas-bumi", ikon: "panas-bumi", foto: "/img/beranda/panas-bumi-sibayak.webp", kep: ["panas-bumi"], tek: ["panas-bumi"], reg: ["panas_bumi"], kata: /panas bumi|pltp|geothermal/i },
  { id: "hidro", ikon: "hidro", foto: "/img/beranda/hidro-saguling.webp", kep: ["hidro"], tek: ["hidro"], reg: ["hidro"], kata: /hidro|plta|pltmh|bendungan|hydropower/i },
  { id: "bioenergi", ikon: "bioenergi", foto: "/img/beranda/bioenergi-sawit.webp", kep: ["bioenergi", "biomassa-sampah"], tek: ["bioenergi", "biomassa-sampah"], reg: ["bioenergi"], kata: /bioenergi|biomassa|biodiesel|bioetanol|biogas|psel|sampah/i },
  { id: "hidrogen", ikon: "hidrogen", foto: "/img/beranda/hidrogen-spbu.webp", kep: ["hidrogen"], tek: ["hidrogen"], reg: ["hidrogen"], kata: /hidrogen|hydrogen|amonia/i },
  { id: "penyimpanan", ikon: "penyimpanan", foto: "/img/beranda/penyimpanan-baterai.webp", kep: ["penyimpanan"], tek: ["penyimpanan"], reg: ["penyimpanan"], kata: /baterai|battery|penyimpanan energi|bess|pumped/i },
  { id: "kendaraan-listrik", ikon: "elektrifikasi", foto: "", kep: ["elektrifikasi"], tek: [], reg: [], kata: /kendaraan listrik|mobil listrik|motor listrik|spklu|spbklu|\bkbl|ev charging|elektrifikasi/i, regKata: /kendaraan bermotor listrik|kendaraan listrik|spklu|baterai/i, regTolak: /remisi/i },
  { id: "jaringan", ikon: "jaringan", foto: "", kep: ["jaringan"], tek: [], reg: ["jaringan"], kata: /transmisi|jaringan listrik|smart grid|grid|gardu|sutet|interkoneksi|supergrid/i, batasReg: 40 },
  { id: "efisiensi", ikon: "efisiensi", foto: "", kep: ["efisiensi"], tek: [], reg: ["efisiensi"], kata: /efisiensi energi|konservasi energi|hemat energi|audit energi/i },
  { id: "nuklir", ikon: "nuklir", foto: "/img/beranda/nuklir-menara.webp", kep: ["nuklir"], tek: ["nuklir"], reg: ["nuklir"], kata: /nuklir|\bsmr\b|reaktor|bapeten|thorcon/i },
  { id: "transisi-berkeadilan", ikon: "transisi-adil", foto: "", kep: ["transisi-adil"], tek: [], reg: [], kata: /transisi berkeadilan|transisi yang adil|just energy|jetp|pensiun dini|phase.?out|pltu/i, regKata: /transisi energi|pensiun dini|percepatan pengembangan energi terbarukan/i, regTolak: /remisi/i },
  { id: "pembiayaan-hijau", ikon: "pembiayaan", foto: "", kep: ["pembiayaan"], tek: [], reg: ["insentif", "harga"], kata: /obligasi hijau|sukuk hijau|pembiayaan hijau|green bond|jetp|pendanaan|investasi hijau|blended/i },
  { id: "energi-laut", ikon: "laut", foto: "", kep: ["laut"], tek: ["laut"], reg: [], kata: /energi laut|arus laut|gelombang laut|pasang surut|otec|ocean energy|tidal|wave energy/i },
  { id: "sampah-energi", ikon: "biomassa-sampah", foto: "", kep: ["sampah", "biomassa-sampah"], tek: ["biomassa-sampah"], reg: [], kata: /psel|pltsa|sampah jadi energi|waste.to.energy|pengolahan sampah/i },
];

const proyek = baca("proyek").baris, org = baca("organisasi").baris, reg = baca("regulasi").baris, inov = baca("inovasi").inovasi;
const berita = baca("berita").baris, kal = baca("kalender").baris, pus = baca("pustaka").baris, pakar = baca("pakar_riset"), studi = baca("pusat_studi"), riset = baca("riset");
const sama = (a, b) => (a || []).some((x) => b.includes(x));
const urut = (a, f, arah = -1) => [...a].sort((x, y) => (f(x) > f(y) ? arah : f(x) < f(y) ? -arah : 0));
const mwProyek = (p) => { const k = (p.kapasitas || [])[0]; return k && /^mw$/i.test(k.satuan) && Number.isFinite(k.nilai) ? k.nilai : null; };
const statusProyek = (p) => (p.status || [])[0]?.nilai ?? null;

function irisTopik(T) {
  const cocokOrg = (o) => sama(o.kepakaran, T.kep);
  const pj = proyek.filter((p) => T.tek.includes(p.teknologi));
  const mw = pj.reduce((s, p) => s + (mwProyek(p) || 0), 0);
  const beroperasi = pj.filter((p) => /operasi/i.test(statusProyek(p) || ""));
  let rg = reg.filter((r) => (T.reg || []).some((x) => (r.topik || []).includes(x)) || (T.regKata && T.regKata.test(r.judul) && !(T.regTolak && T.regTolak.test(r.judul))));
  if (T.id === "karbon" || T.regKata) rg = rg.filter((r) => !(T.regTolak && T.regTolak.test(r.judul)));
  rg = urut(rg, (r) => r.tanggal_ditetapkan || "").slice(0, T.batasReg || 60);
  const iv = inov.filter((i) => sama(i.sektor, T.kep));
  const br = urut(berita.filter((b) => sama(b.kepakaran, T.kep) || T.kata.test(b.judul)), (b) => b.terbit || "");
  const ac = urut(kal.filter((k) => T.kata.test(k.judul + " " + (k.deskripsi || ""))), (k) => k.tanggal || "");
  const pk = urut(pus.filter((p) => sama(p.kepakaran, T.kep) && !String(p.id).startsWith("pk-reg-")), (p) => String(p.tanggal || ""));
  const pr = urut(pakar.filter((p) => sama(p.sektor, T.kep)), (p) => p.karya || 0);
  const ps = studi.filter((s) => (s.fokus || []).some((f) => T.kep.some((k) => f.toLowerCase().replace(/ /g, "-") === k || (k === "panas-bumi" && /panas bumi/i.test(f)))));
  const rs = urut(riset.filter((r) => sama(r.sektor, T.kep)), (r) => r.sitasi || 0);
  const og = org.filter(cocokOrg);
  return { pj, mw, beroperasi, rg, iv, br, ac, pk, pr, ps, rs, og };
}

const rinci = {
  pemain: (o) => ({ id: o.id, nama: o.nama, singkatan: o.singkatan || null, logo: o.logo || null, kategori: o.kategori?.label || null, peran: o.peran_rantai || [], proyek: (o.proyek_ids || []).length }),
  proyek: (p) => ({ id: p.id, nama: p.nama, teknologi: p.teknologi, provinsi: p.lokasi?.provinsi || null, mw: mwProyek(p), status: statusProyek(p), bukti: p.tingkat_bukti || null }),
  regulasi: (r) => ({ id: r.id, jenis: r.jenis, nomor: r.nomor, tahun: r.tahun, judul: r.judul, status: r.status, tanggal: r.tanggal_ditetapkan, url: r.url_sumber, pdf: r.url_pdf || null, diambil: r.tanggal_ambil }),
  inovasi: (i) => ({ id: i.id, nama: i.nama, jenis: i.jenis, status: i.status, tahun: i.tahun, ringkasan: i.ringkasan, pembuat: (i.pembuat || []).map((x) => x.nama), trl: i.trl, url: i.sumber?.[0]?.url || null, tanggal: i.sumber?.[0]?.tanggal || null }),
  berita: (b) => ({ id: b.id, judul: b.judul, url: b.url, media: b.media, terbit: (b.terbit || "").slice(0, 10), diambil: b.tanggal_ambil }),
  acara: (k) => ({ id: k.id, slug: k.slug || null, judul: k.judul, tanggal: k.tanggal, mitra: k.mitra, jenis: k.jenis, url: k.sumber?.[0]?.url || null, diperiksa: k.sumber?.[0]?.tanggal_periksa || null }),
  pustaka: (p) => ({ id: p.id, judul: p.judul, jenis: p.jenis, penerbit: p.penerbit, tanggal: String(p.tanggal || ""), ringkasan: (p.ringkasan || "").slice(0, 260) }),
  pakar: (p) => ({ id: p.id, nama: p.nama, kampus: p.kampus, prov: p.prov, karya: p.karya, url: p.sumber_url, diperiksa: p.tanggal_periksa }),
  studi: (s) => ({ id: s.id, nama: s.nama, singkatan: s.singkatan, kota: s.kota, web: s.web, logo: s.logo || null, diperiksa: s.diperiksa }),
  riset: (r) => ({ id: r.id, judul: r.judul, penulis: (r.penulis || []).slice(0, 3), jurnal: r.jurnal, tahun: r.tahun, sitasi: r.sitasi, url: r.doi ? "https://doi.org/" + r.doi : r.sumber_url, diperiksa: r.tanggal_periksa }),
};

/* ---------- blok khusus karbon, dari berkas yang sudah ada ---------- */
function blokKarbon() {
  const k = baca("karbon"), kp = baca("karbon_proyek"), ki = baca("komitmen_iklim"), ep = baca("emisi_provinsi"), tr = baca("transisi");
  const bursa = k.baris.filter((b) => b.kelompok === "bursa_karbon").sort((a, z) => a.periode.localeCompare(z.periode));
  const sbursa = k.sumber.find((s) => s.id === "s-idxcarbon");
  const pb = k.baris.filter((b) => b.kelompok === "pembangkit" && Number.isFinite(b.emisi_tco2e));
  const per = {};
  for (const b of pb) { const ja = b.jenis_aset || "lain", j = ja === "coal" ? "batubara" : ja === "gas" ? "gas" : ja === "oil" ? "minyak" : ja === "biomass" ? "biomassa" : "campuran"; (per[j] ||= { n: 0, mw: 0, emisi: 0, mwh: 0 }); per[j].n++; per[j].mw += b.kapasitas_mw || 0; per[j].emisi += b.emisi_tco2e; per[j].mwh += b.aktivitas_mwh || 0; }
  const srn = k.baris.filter((b) => b.kelompok === "proyek_srn");
  const reg = {};
  for (const p of kp.baris) { const g = (reg[p.registri] ||= { proyek: 0, terbit: 0, pensiun: 0, taksiran: 0 }); g.proyek++; g.terbit += p.kredit.diterbitkan || 0; g.pensiun += p.kredit.dipensiunkan || 0; g.taksiran += p.kredit.taksiran_tahunan || 0; }
  const tekKredit = {};
  for (const p of kp.baris) { const g = (tekKredit[p.teknologi] ||= { proyek: 0, terbit: 0 }); g.proyek++; g.terbit += p.kredit.diterbitkan || 0; }
  const nz = ki.baris.filter((b) => b.status_net_zero === "Validated Targets");
  const sbt = ki.baris.filter((b) => /validated/i.test(b.klasifikasi_jangka_pendek || "") || /Targets Set/i.test(b.status_jangka_pendek || ""));
  return {
    bursa: bursa.map((b) => ({ periode: b.periode, volume_ytd: b.volume_ytd_tco2e, nilai_ytd: b.nilai_ytd_idr, harga: b.harga_rata_idr_per_tco2e, volume_bulan: b.volume_tco2e, nilai_bulan: b.nilai_idr, peserta: b.peserta, frekuensi_ytd: b.frekuensi_ytd, proyek_terdaftar: b.proyek_terdaftar, unit_tersedia: b.unit_tersedia_tco2e, unit_pensiun: b.unit_pensiun_tco2e, url: b.sumber_url })),
    bursa_sumber: { judul: sbursa.judul, penerbit: sbursa.penerbit, url: sbursa.url, tanggal: k.dibangun_pada, catatan: k.meta.celah.slice(0, 3) },
    pembangkit: { sumber: "Climate TRACE v6 API (CC BY 4.0), estimasi berbasis satelit/model, bukan laporan operator", tahun: pb[0]?.tahun ?? null, tanggal: k.dibangun_pada, per_jenis: Object.entries(per).map(([j, v]) => ({ jenis: j, aset: v.n, mw: Math.round(v.mw), emisi_juta: Math.round(v.emisi / 1e4) / 100, faktor: v.mwh ? Math.round((v.emisi / v.mwh) * 1000) / 1000 : null })).sort((a, z) => z.emisi_juta - a.emisi_juta), jumlah: pb.length, total_juta: Math.round(pb.reduce((s, b) => s + b.emisi_tco2e, 0) / 1e4) / 100,
      teratas: pb.sort((a, z) => z.emisi_tco2e - a.emisi_tco2e).slice(0, 10).map((b) => ({ id: b.id, nama: b.nama, jenis: b.jenis_aset, mw: b.kapasitas_mw, emisi_juta: Math.round(b.emisi_tco2e / 1e4) / 100, faktor: b.faktor_emisi_tco2e_per_mwh, url: b.sumber_url })) },
    srn: srn.map((b) => ({ id: b.id, nama: b.nama, tipe: b.tipe_unit, pemilik: b.pemilik_proyek, org: b.pemilik_org_id, vintage: b.vintage, listing: b.tanggal_listing, volume: b.volume_listing_total_tco2e, status: b.status_laporan, url: b.sumber_url })),
    kredit: { per_registri: Object.entries(reg).map(([r, v]) => ({ registri: r, ...v })), per_teknologi: Object.entries(tekKredit).map(([r, v]) => ({ teknologi: r, ...v })).sort((a, z) => z.terbit - a.terbit),
      daftar: kp.baris.map((p) => ({ id: p.id, registri: p.registri, registri_id: p.registri_id, nama: p.nama, pengembang: p.pengembang, teknologi: p.teknologi, status: p.status, terbit: p.kredit.diterbitkan, pensiun: p.kredit.dipensiunkan, taksiran: p.kredit.taksiran_tahunan, mulai: tgl(p.periode_kredit?.mulai), akhir: tgl(p.periode_kredit?.akhir), registrasi: tgl(p.tanggal_registrasi), metodologi: p.metodologi || null, provinsi: p.lokasi?.provinsi || null, url: p.sumber_url, bukti: p.tingkat_bukti, proyek_id: p.proyek_id })),
      sumber: kp.sumber.map((s) => ({ judul: s.judul, penerbit: s.penerbit, url: s.url, lisensi: s.lisensi || null })), tanggal: kp.dibangun_pada, catatan: kp.meta.celah.slice(0, 3) },
    komitmen: { sbti: ki.meta.sbti, re100: ki.meta.re100, sbti_dunia: ki.meta.sbti_total_dunia, re100_dunia: ki.meta.re100_total_dunia, net_zero_valid: nz.length, daftar: ki.baris.filter((b) => b.registri === "SBTi" && b.status_jangka_pendek).slice(0, 0), tanggal: ki.dibangun_pada, url: "https://sciencebasedtargets.org/target-dashboard", ringkas: Object.entries(ki.baris.reduce((a, b) => { a[b.status_net_zero || "Tanpa target net zero tercatat"] = (a[b.status_net_zero || "Tanpa target net zero tercatat"] || 0) + 1; return a; }, {})).map(([s, n]) => ({ status: s, n })) },
    mitigasi: { satuan: ep.nasional.mitigasi_ketenagalistrikan.satuan, baris: ep.nasional.mitigasi_ketenagalistrikan.baris, sumber: ep.sumber, url: ep.url, tanggal: ep.tanggal_ambil },
    sistem: (tr.sistem || []).map((s) => ({ id: s.id, nama: s.nama, tabel: s.tabel_ruptl, skenario: s.skenario, tahun: s.tahun, emisi: s.emisi_juta_ton, produksi: s.produksi_gwh, ebt: s.bauran_ebt_persen, batubara: s.bauran_batubara_persen, intensitas: s.emisi_juta_ton.map((e, i) => (s.produksi_gwh[i] ? Math.round((e / s.produksi_gwh[i]) * 1e5) / 100 : null)) })),
    jetp: (() => { const kh = baca("keuangan_hijau"), jc = baca("jetp_cipp"); return { komitmen_usd_miliar: kh.jetp.komitmen_usd_miliar, tanggal: kh.jetp.tanggal, bukti: kh.jetp.tingkat_bukti, ebt_didukung_mw: jc.ringkasan.energi_terbarukan_didukung_mw, penurunan_ghg_tco2e: jc.ringkasan.potensi_penurunan_ghg_tco2e, catatan: jc.ringkasan.catatan, sumber: jc.sumber.map((x) => ({ judul: x.judul, penerbit: x.penerbit, url: x.url })), tanggal_cipp: jc.dibangun_pada }; })(),
    target: baca("target").target.filter((t) => /^ndc|ken-2060|rukn-2060-kapasitas/.test(t.id)).map((t) => ({ id: t.id, dokumen: t.dokumen, tahun: t.tahun_target, min: t.min, maks: t.maks, ukuran: t.ukuran, catatan: t.catatan, halaman: t.halaman })),
    target_sumber: baca("target").sumber.map((x) => ({ id: x.id, judul: x.judul, url: x.url, tahun: x.tahun })),
    regulasi_resmi: tr.regulasi_karbon,
    sumber_ruptl: tr.sumber[0],
    tanggal: hariIni,
  };
}

mkdirSync(D + "topik", { recursive: true });
const indeks = [];
const per = {};
for (const T of TOPIK) {
  const x = irisTopik(T);
  const blok = {
    pemain: urut(x.og, (o) => (o.proyek_ids || []).length).slice(0, 24).map(rinci.pemain),
    proyek: x.pj.length ? { jumlah: x.pj.length, mw: Math.round(x.mw), beroperasi: x.beroperasi.length, daftar: urut(x.pj, (p) => mwProyek(p) || 0).slice(0, 30).map(rinci.proyek) } : null,
    regulasi: x.rg.map(rinci.regulasi),
    inovasi: x.iv.slice(0, 20).map(rinci.inovasi),
    berita: x.br.slice(0, 12).map(rinci.berita),
    acara: x.ac.slice(0, 12).map(rinci.acara),
    pustaka: x.pk.slice(0, 12).map(rinci.pustaka),
    pakar: x.pr.slice(0, 12).map(rinci.pakar),
    studi: x.ps.slice(0, 10).map(rinci.studi),
    riset: x.rs.slice(0, 10).map(rinci.riset),
  };
  const hitung = { organisasi: x.og.length, proyek: x.pj.length, mw: Math.round(x.mw), regulasi: x.rg.length, inovasi: x.iv.length, berita: x.br.length, acara: x.ac.length, pustaka: x.pk.length, pakar: x.pr.length, studi: x.ps.length, riset: x.rs.length };
  const isi = Object.entries({ pemain: blok.pemain.length, proyek: blok.proyek ? 1 : 0, regulasi: blok.regulasi.length, inovasi: blok.inovasi.length, berita: blok.berita.length, acara: blok.acara.length, pustaka: blok.pustaka.length, pakar: blok.pakar.length, studi: blok.studi.length, riset: blok.riset.length }).filter(([, n]) => n > 0).map(([k]) => k);
  const berkasNaskah = D + `topik/${T.id.replace(/-/g, "_")}.json`;
  const naskah = existsSync(berkasNaskah) ? JSON.parse(readFileSync(berkasNaskah, "utf8")) : null;
  const adaNaskah = !!naskah && Object.keys(naskah.bab || {}).length >= 10;
  const status = adaNaskah ? "lengkap" : isi.length >= 6 && x.pj.length + x.rg.length + x.iv.length >= 10 ? "terisi" : "disusun";
  const out = { id: T.id, dibangun_pada: hariIni, tag: { kepakaran: T.kep, teknologi: T.tek }, hitung, blok_terisi: isi, ...blok };
  if (T.id === "karbon") out.karbon = blokKarbon();
  if (T.id === "pembiayaan-hijau") { const kh = baca("keuangan_hijau"); out.keuangan = { jetp_usd_miliar: kh.jetp.komitmen_usd_miliar, jetp_tanggal: kh.jetp.tanggal, instrumen: kh.instrumen_hijau.slice(0, 12).map((i) => ({ penerbit: i.penerbit, instrumen: i.instrumen, tahun: i.tahun, penggunaan: i.penggunaan_dana, url: i.sumber_url, tanggal: i.tanggal, bukti: i.tingkat_bukti })), skema: kh.skema.slice(0, 15).map((s) => ({ nama: s.nama, pemberi: s.pemberi, jenis: s.jenis, uraian: s.uraian, status: s.status, url: s.url, tanggal: s.tanggal })), jumlah_instrumen: kh.instrumen_hijau.length, jumlah_skema: kh.skema.length }; }
  per[T.id] = out;
  writeFileSync(D + `topik/dasar-${T.id}.json`, JSON.stringify(out));
  const angkaHitung = ["proyek", "mw", "regulasi", "organisasi", "pakar", "riset", "inovasi", "berita"].filter((k) => hitung[k] > 0).slice(0, 3).map((k) => ({ k: "kartu.angka." + k, nilai: hitung[k], d: 0, satuan: "" }));
  let angka = angkaHitung;
  if (naskah?.kunci?.length && naskah.kunci.every((x) => x.nilai !== undefined)) angka = naskah.kunci.slice(0, 3).map((x) => ({ label: x.label, nilai: typeof x.nilai === "number" ? x.nilai : null, d: x.d || 0, satuan: x.satuan || "" }));
  if (T.id === "karbon" && existsSync(D + "topik/luar_karbon.json")) {
    const idn = JSON.parse(readFileSync(D + "topik/luar_karbon.json", "utf8")).negara.find((n) => n.kode === "IDN"), b = out.karbon.bursa.at(-1);
    angka = [{ k: "kref.cakupan", nilai: Math.round(idn.cakupan.semua * 10) / 10, d: 1, satuan: "%" }, { k: "kref.bursa_vol", nilai: b.volume_ytd, d: 0, satuan: "tCO2e" }, { k: "kref.kredit_terbit", nilai: out.karbon.kredit.per_registri.reduce((a, r) => a + r.terbit, 0), d: 0, satuan: "tCO2e" }];
  }
  indeks.push({ id: T.id, angka, ikon: T.ikon, foto: T.foto, status, hitung, blok_terisi: isi.length, naskah: !!naskah, bab: naskah ? Object.keys(naskah.bab || {}).length : 0 });
}
writeFileSync(D + "topik/indeks.json", JSON.stringify({ dibangun_pada: hariIni, topik: indeks }));
for (const i of indeks) console.log(i.id.padEnd(22), i.status.padEnd(8), i.blok_terisi, JSON.stringify(i.hitung));
