/* /peta: adapter lapisan (data mentah -> rekaman seragam), legenda, tip, dan pop-up kaya per lapisan.
   Titik: baca() memberi rekaman {nama, tek, st, mw, pk, lat, lng, w, ...}; w = kunci warna (status atau teknologi).
   Koroplet: baca() memberi {peta: Map(kode provinsi -> {v, ...}), min, max, ramp, des, satuan}. Garis: baca() memberi fitur GeoJSON.
   Murni data + HTML; tidak menyentuh peta. Semua teks lewat kamus (pn2.*, pj.*). */
import { t, ada, angka } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { pilTek, pilStatus } from "/inti/ikon_tek.js";
import { logoOrgSatu } from "/inti/logo_org.js";
import { PROV, kodeProv } from "/inti/prov_singkat.js";

export const N = (n, d = 0) => angka(n, { desimal: d });
export const ST = ["beroperasi", "konstruksi", "izin", "rencana", "ditunda", "dibatalkan", "tidak-diketahui"];
export const TEK = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "penyimpanan", "nuklir", "batubara"];
/* kunci warna -> token tema.css (peta membaca nilainya saat gambar, jadi mengikuti terang/gelap) */
export const WARNA = {
  beroperasi: "--ok", konstruksi: "--warn", izin: "--data5", rencana: "--info", ditunda: "--data3", dibatalkan: "--bad", "tidak-diketahui": "--ink2",
  surya: "--tp-surya", bayu: "--tp-bayu", hidro: "--tp-hidro", "panas-bumi": "--tp-panas", bioenergi: "--tp-bio", "biomassa-sampah": "--tp-sampah",
  penyimpanan: "--tp-simpan", nuklir: "--tp-nuklir", batubara: "--tp-karbon", gardu: "--ink", hidup: "--ok", rusak: "--warn", mati: "--bad", tinggi: "--bad", sedang: "--warn", rendah: "--ok", umum: "--info",
};
export const RAMP = { hijau: ["--soft-hijau", "--accent"], oranye: ["--warn-bg", "--warn"], biru: ["--soft-biru", "--info"] };
export const KV = [[0, "--info"], [275, "--warn"], [500, "--bad"]];
export const labTek = (k) => (k === "batubara" ? t("pn2.tek.batubara") : ada("pj.tek." + k) ? t("pj.tek." + k) : k || "-");
const namaProv = (k) => PROV[k]?.[0] || "";
const lambang = (k, u = 32) => (PROV[k] ? `<img class="pn-lb" src="/img/provinsi/${esc(k)}.png" width="${u}" height="${u}" alt="" loading="lazy" decoding="async" data-galat="hapus">` : "");
const urlAman = (u) => (/^https?:\/\//i.test(u || "") ? u : "");
const baris = (kunci, v) => (v == null || v === false || v === "" ? "" : `<div><dt>${esc(t(kunci))}</dt><dd>${v}</dd></div>`);
const taut = (href, kunci, ik, luar) => `<a class="pn-taut" href="${esc(href)}"${luar ? ' target="_blank" rel="noopener noreferrer"' : ""}>${ikon(ik, 14)}<span>${esc(t(kunci))}</span></a>`;
const kartu = ({ logo = "", judul, sub = "", pil = "", rows = "", links = "" }) =>
  `<div class="pn-pop"><header class="pn-pop-h">${logo}<div><b>${judul}</b>${sub ? `<small>${sub}</small>` : ""}</div></header>${pil ? `<div class="pn-pop-pil">${pil}</div>` : ""}${rows ? `<dl class="pn-pop-d">${rows}</dl>` : ""}${links ? `<nav class="pn-pop-t">${links}</nav>` : ""}</div>`;
const provSub = (k, nama) => (k && PROV[k] ? `${esc(namaProv(k))}` : esc(nama || ""));
const linkProv = (k) => (PROV[k] ? taut("/wilayah/" + k, "pn2.t.wilayah", "wilayah") : "");

/* titik berpresisi provinsi disebar di sekitar pusatnya (sudut emas) supaya tidak menumpuk; ditandai perkiraan */
function sebar(a) {
  const grup = new Map();
  for (const r of a) {
    r.px = r.lng; r.py = r.lat;
    if (!r.perkiraan) continue;
    const k = r.sg || r.pk || "x", n = grup.get(k) || 0; grup.set(k, n + 1);
    const s = n * 2.39996, d = n ? 0.16 * Math.sqrt(n) : 0;
    r.px += d * Math.cos(s); r.py += d * Math.sin(s);
  }
  return a;
}
const mwTeks = (r) => (r.mw == null ? "" : `${N(r.mw, r.mw < 10 ? 1 : 0)} MW`);
const lokasiCatatan = (r) => (r.perkiraan ? ` <small class="jm-bantu">${esc(t("pn2.perkiraan"))}</small>` : "");
const pilTekK = (k) => (k === "batubara" ? `<span class="jm-pil-tek jm-tek-lain"><span>${esc(labTek(k))}</span></span>` : pilTek(k));

/* ---------- pop-up proyek (terpadu, proyek METI) dan pembangkit GEM ---------- */
function popupProyek(r) {
  const logo = logoOrgSatu(r.pemId, r.pem, r.pemLogo);
  const lg = logo ? `<img class="pn-lb" src="${esc(logo)}" width="32" height="32" alt="" loading="lazy" decoding="async" data-galat="hapus">` : lambang(r.pk);
  const pem = r.pem ? (r.pemId ? `<a href="/o/${esc(r.pemId)}">${esc(r.pem)}</a>` : esc(r.pem)) : "";
  const cod = r.cod && (r.cod[0] || r.cod[1]) ? `${esc(r.cod[0] ?? "-")} / ${esc(r.cod[1] ?? "-")}` : "";
  const telat = r.telat > 0 ? ` <small class="jm-bantu">${esc(t("pn2.telat", { n: N(r.telat) }))}</small>` : "";
  const links = [r.profil ? taut("/p/" + r.id, "pn2.t.profil", "proyek") : "", linkProv(r.pk), taut(`/pelacak-proyek?${r.pk ? "prov=" + r.pk + "&" : ""}tek=${encodeURIComponent(r.tek)}`, "pn2.t.pelacak", "petir"), r.url ? taut(urlAman(r.url), "pn2.t.sumber", "tautan", true) : ""].join("");
  return kartu({
    logo: lg, judul: r.profil ? `<a href="/p/${esc(r.id)}">${esc(r.nama)}</a>` : esc(r.nama), sub: provSub(r.pk, r.prov),
    pil: pilTekK(r.tek) + pilStatus(r.st), links,
    rows: baris("pj.c.kap", mwTeks(r) && `<b>${esc(mwTeks(r))}</b>`) + baris("pj.c.pemilik", pem) + baris("pn2.cod", cod && cod + telat) + baris("pj.c.prov", provSub(r.pk, r.prov) + lokasiCatatan(r)),
  });
}
const tipProyek = (r) => `<b>${esc(r.nama)}</b><span>${esc(labTek(r.tek))}, ${esc(t("pj.st." + r.st))}${r.mw != null ? `, ${esc(mwTeks(r))}` : ""}</span>`;

const TITIK = {
  terpadu: {
    palet: "status", w: (r) => r.st,
    baca: (d) => sebar(d.baris.filter((r) => !r.ragu && r.lat != null).map((r) => ({
      id: r.id, nama: r.nama, tek: r.tek, st: r.status, w: r.status, mw: r.mw, pk: r.prov_kode, prov: r.prov, lat: r.lat, lng: r.lng, perkiraan: r.presisi === "provinsi",
      pem: r.pemilik && r.pemilik.nama, pemId: r.pemilik && r.pemilik.org_id, pemLogo: r.pemilik && r.pemilik.logo, profil: r.profil, cod: [r.cod_rencana, r.cod_terbaru], telat: r.telat, url: r.status_sumber && r.status_sumber.url,
    }))),
    semua: (d) => d.baris.filter((r) => !r.ragu),
    popup: popupProyek, tip: tipProyek,
  },
  proyek: {
    palet: "status",
    baca: (d) => sebar(d.baris.filter((b) => b.lokasi && b.lokasi.lat != null).map((b) => {
      const kap = (b.kapasitas || []).find((c) => /^MWp?$/.test(c.satuan)), st = ST.includes(b.status && b.status[0] && b.status[0].nilai) ? b.status[0].nilai : "tidak-diketahui";
      const pem = b.pihak && b.pihak.pemilik && b.pihak.pemilik[0];
      return { id: b.id, nama: b.nama, tek: b.teknologi || "lain", st, w: st, mw: kap ? kap.nilai : null, prov: b.lokasi.provinsi, pk: kodeProv(b.lokasi.provinsi), lat: b.lokasi.lat, lng: b.lokasi.lng, perkiraan: b.lokasi.presisi === "provinsi", pem: pem && pem.nilai, profil: true,
        cod: [(b.cod_target || [])[0] && b.cod_target[0].nilai, null] };
    })),
    popup: popupProyek, tip: tipProyek,
  },
  gem: {
    palet: "tek",
    baca: (d) => d.baris.filter((b) => b.lat != null).map((b) => {
      const tek = { solar: "surya", wind: "bayu", hydropower: "hidro", geothermal: "panas-bumi", coal: "batubara" }[b.tracker] || b.tracker;
      const st = { operating: "beroperasi", construction: "konstruksi", "pre-construction": "rencana", announced: "rencana", shelved: "ditunda", cancelled: "dibatalkan" }[b.status] || "tidak-diketahui";
      return { id: b.id, nama: b.nama, tek, st, w: tek, mw: b.kapasitas_mw, lat: b.lat, lng: b.lon, unit: b.jumlah_unit, tahun: b.tahun_mulai, pem: (b.pemilik || [])[0], url: b.url_wiki, akurasi: b.akurasi };
    }),
    popup: (r) => kartu({
      logo: ikon("pabrik", 24), judul: esc(r.nama), sub: esc(t("pn2.gem.sub")), pil: pilTekK(r.tek) + pilStatus(r.st),
      rows: baris("pj.c.kap", mwTeks(r) && `<b>${esc(mwTeks(r))}</b>`) + baris("pn2.unit", r.unit && N(r.unit)) + baris("pn2.tahun", r.tahun && esc(r.tahun)) + baris("pj.c.pemilik", r.pem && esc(r.pem)),
      links: [taut("/pelacak-proyek?tek=" + encodeURIComponent(r.tek), "pn2.t.pelacak", "petir"), r.url ? taut(urlAman(r.url), "pn2.t.gem", "tautan", true) : ""].join(""),
    }),
    tip: tipProyek,
  },
  gardu: {
    palet: "satu", saring: false,
    baca: (d) => (d.gardu || []).map((g) => ({ id: g.id, nama: g.nama, tek: "", st: "", w: "gardu", kv: g.teg_kv, op: g.operator, lat: g.lat, lng: g.lng })),
    popup: (r) => kartu({ logo: ikon("denah", 24), judul: esc(r.nama || t("pn2.gardu.tanpa")), sub: esc(t("pn2.gardu")), rows: baris("pn2.kv", r.kv && `${esc(r.kv)} kV`) + baris("pn2.operator", r.op && esc(r.op)), links: taut("https://www.openstreetmap.org/" + (String(r.id).startsWith("n") ? "node/" : "way/") + String(r.id).replace(/\D/g, ""), "pn2.t.osm", "tautan", true) }),
    tip: (r) => `<b>${esc(r.nama || t("pn2.gardu.tanpa"))}</b><span>${esc(t("pn2.gardu"))}${r.kv ? `, ${esc(r.kv)} kV` : ""}</span>`,
  },
  wkp: {
    palet: "status",
    baca: (d) => d.baris.filter((b) => b.lat != null && b.lng != null).map((b) => {
      const st = { produksi: "beroperasi", pengembangan: "konstruksi", lelang: "rencana", kajian: "tidak-diketahui" }[b.status] || "tidak-diketahui";
      return { id: b.id, nama: b.nama, tek: "panas-bumi", st, w: st, mw: b.terpasang_mw ?? b.rencana_mw, prov: b.provinsi, pk: kodeProv(b.provinsi), lat: b.lat, lng: b.lng, pem: b.pemegang, pemId: b.organisasi_id };
    }),
    popup: popupProyek, tip: tipProyek,
  },
  psn: {
    palet: "status",
    baca: (d) => d.baris.filter((b) => b.lat != null && b.lng != null).map((b) => {
      const st = { beroperasi: "beroperasi", sebagian: "konstruksi", konstruksi: "konstruksi", "pra-konstruksi": "rencana", rencana: "rencana" }[b.status] || "tidak-diketahui";
      return { id: b.id, nama: b.nama, tek: "", st, w: st, mw: null, prov: "", pk: b.prov_kode[0] || "", lat: b.lat, lng: b.lng, pem: "", pemId: null, sek: b.sektor };
    }),
    popup: (r) => kartu({ logo: ikon("mahkota", 24), judul: esc(r.nama), sub: provSub(r.pk), rows: baris("psn.f.sektor", t("psn.sektor." + r.sek)) + baris("psn.f.status", t("pj.st." + r.st)), links: taut("/program#psn", "psn.nav", "mahkota") + linkProv(r.pk) }),
    tip: (r) => `<b>${esc(r.nama)}</b><span>${esc(t("psn.sektor." + r.sek))}, ${esc(t("pj.st." + r.st))}</span>`,
  },
  desa_mandiri: {
    palet: "hidup", saring: false,
    baca: (d) => sebar(d.baris.filter((b) => b.lokasi && b.lokasi.lat != null).map((b) => ({
      id: b.id, nama: b.nama, tek: "", st: "", w: ["hidup", "rusak", "mati"].includes(b.status) ? b.status : "mati", jenis: b.jenis, kab: b.kabupaten, prov: b.provinsi, pk: b.kode_prov, sg: b.kabupaten, kw: b.kapasitas_kw, bangun: b.tahun_bangun, henti: b.tahun_henti,
      sebab: b.penyebab || [], uraian: b.uraian, lat: b.lokasi.lat, lng: b.lokasi.lng, perkiraan: b.lokasi.presisi !== "titik_persis", sumber: b.sumber,
    }))),
    popup: (r) => kartu({
      logo: lambang(r.pk) || ikon("lencana", 24), judul: esc(r.nama), sub: esc([r.kab, r.prov].filter(Boolean).join(", ")), pil: `<span class="jm-pil-st pn-dm pn-dm-${esc(r.w)}"><span>${esc(t("pn2.dm." + r.w))}</span></span>` + `<span class="jm-pil-tek jm-tek-lain"><span>${esc(t("pn2.dm.j." + r.jenis))}</span></span>`,
      rows: baris("pj.c.kap", r.kw != null && `<b>${esc(N(r.kw))} kW</b>`) + baris("pn2.dibangun", r.bangun) + baris("pn2.berhenti", r.henti) + baris("pn2.sebab", r.sebab.length && `<ul class="pn-kv">${r.sebab.map((k) => `<li><span>${esc(t("pn2.sebab." + k))}</span></li>`).join("")}</ul>`) + baris("pn2.ket", r.uraian && esc(r.uraian)) + baris("pj.c.prov", provSub(r.pk, r.prov) + lokasiCatatan(r)),
      links: linkProv(r.pk) + (r.sumber && urlAman(r.sumber.url) ? taut(r.sumber.url, "pn2.t.sumber_berita", "berita", true) : ""),
    }),
    tip: (r) => `<b>${esc(r.nama)}</b><span>${esc(t("pn2.dm.j." + r.jenis))}, ${esc(t("pn2.dm." + r.w))}</span>`,
  },
  generik_titik: {
    palet: "tingkat", saring: false,
    baca: (d, L) => (Array.isArray(d) ? d : d.baris || []).filter((b) => (b.lat ?? b.koordinat?.lat) != null && (b.lng ?? b.lon ?? b.koordinat?.lon) != null && (b.negara_iso2 || "ID") === "ID").map((b) => {
      const w = ["tinggi", "sedang", "rendah"].includes(b.tingkat) ? b.tingkat : "umum";
      return { id: b.id, nama: b.nama || b.perusahaan || b.id, tek: b.tek || "", st: "", w, skor: b.skor, pk: String(b.prov_kode || b.kode_prov || ""), lat: b.lat ?? b.koordinat.lat, lng: b.lng ?? b.lon ?? b.koordinat.lon, ket: b.keterangan };
    }),
    popup: (r) => kartu({ logo: ikon("peringatan", 24), judul: esc(r.nama), sub: provSub(r.pk), rows: baris("pn2.tingkat", t("pn2.tingkat." + r.w)) + baris("pn2.skor", r.skor != null && N(r.skor, 1)) + baris("pn2.ket", r.ket && esc(r.ket)), links: linkProv(r.pk) + taut("/pelacak-proyek", "pn2.t.pelacak", "petir") }),
    tip: (r) => `<b>${esc(r.nama)}</b><span>${esc(t("pn2.tingkat." + r.w))}</span>`,
  },
};
/* palet legenda per jenis warna; fungsi supaya teks mengikuti bahasa aktif */
export const paletDari = (nama) => ({
  status: () => ST.map((k) => [k, t("pj.st." + k)]),
  tek: () => ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "batubara"].map((k) => [k, labTek(k)]),
  satu: () => [["gardu", ""]],
  hidup: () => ["hidup", "rusak", "mati"].map((k) => [k, t("pn2.dm." + k)]),
  tingkat: () => ["tinggi", "sedang", "rendah"].map((k) => [k, t("pn2.tingkat." + k)]),
}[nama]());

/* ---------- garis: transmisi ---------- */
const GARIS = {
  transmisi: {
    baca: (d) => ({ type: "FeatureCollection", features: d.garis.filter((g) => g.koordinat && g.koordinat.length > 1).map((g) => ({ type: "Feature", properties: { v: g.teg_kv || 0, n: g.nama || "", id: g.id, op: g.operator || "" }, geometry: { type: "LineString", coordinates: g.koordinat } })) }),
    popup: (p) => kartu({ logo: ikon("tek-listrik", 24), judul: esc(p.n || t("pn2.transmisi.tanpa")), sub: esc(t("pn2.transmisi")), rows: baris("pn2.kv", p.v && `<b>${esc(p.v)} kV</b>`) + baris("pn2.operator", p.op && esc(p.op)), links: taut("https://www.openstreetmap.org/way/" + p.id, "pn2.t.osm", "tautan", true) }),
    tip: (p) => `<b>${esc(p.n || t("pn2.transmisi.tanpa"))}</b><span>${esc(t("pn2.transmisi"))}${p.v ? `, ${esc(p.v)} kV` : ""}</span>`,
  },
};

/* ---------- poligon: kawasan hutan, gambut, wilayah adat, konsesi ---------- */
const POLIGON = {
  poligon: {
    baca: (d) => d,
    popup: (p) => kartu({ logo: ikon("perisai", 24), judul: esc(p.n || t("pn2.pg." + (p.k || p.j))), sub: esc(p.n ? t("pn2.pg." + p.j) : t("pn2.pg.kawasan")), rows: baris("pn2.pg.jenis", esc(t("pn2.pg." + (p.k || p.j)))) + baris("pn2.pg.luas", p.ha != null && `${esc(N(p.ha))} ha`) }),
    tip: (p) => `<b>${esc(p.n || t("pn2.pg." + (p.k || p.j)))}</b><span>${esc(t("pn2.pg." + (p.j || p.k)))}</span>`,
  },
};

/* ---------- koroplet per provinsi ---------- */
const rataRata = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
function koro(peta, ramp, des, satuan, tambah = {}) {
  const v = [...peta.values()].map((x) => x.v).filter(Number.isFinite);
  return { peta, ramp, des, satuan, min: v.length ? Math.min(...v) : 0, max: v.length ? Math.max(...v) : 1, ...tambah };
}
const fmtV = (k, v) => (v == null ? "-" : `${N(v, k.des)}${k.satuan ? " " + k.satuan : ""}`);
const popupKoro = (judulKey, rowsFn, linksFn) => (kode, k) => {
  const x = k.peta.get(kode);
  return kartu({
    logo: lambang(kode), judul: esc(namaProv(kode) || kode), sub: esc(t(judulKey)),
    rows: baris("pn2.nilai", x && x.v != null ? `<b>${esc(fmtV(k, x.v))}</b>` : `<span class="jm-bantu">${esc(t("pn2.tanpa_data"))}</span>`) + (x ? rowsFn(x, kode) : ""),
    links: linkProv(kode) + (linksFn ? linksFn(kode, x) : ""),
  });
};
const KORO = {
  radar: {
    baca: (d) => {
      const per = new Map();
      for (const b of d.baris) (per.get(b.prov) || per.set(b.prov, []).get(b.prov)).push(b);
      const peta = new Map();
      for (const [kode, a] of per) { const top = a.slice().sort((x, y) => y.skor - x.skor).slice(0, 3); peta.set(kode, { v: Math.round(rataRata(a.map((b) => b.skor)) * 10) / 10, n: a.length, top }); }
      return koro(peta, "hijau", 1, "", { skala: [0, 100] });
    },
    popup: popupKoro("pn2.l.radar", (x) => baris("pn2.n_kab", N(x.n)) + baris("pn2.top_kab", `<ol class="pn-top">${x.top.map((b) => `<li><span>${esc(b.nama)}</span><b>${esc(N(b.skor, 1))}</b></li>`).join("")}</ol>`), () => taut("/radar", "pn2.t.radar", "berlian")),
  },
  celah: {
    baca: (d) => {
      const peta = new Map();
      for (const b of d.baris) {
        const per = ["surya", "bayu", "hidro", "panas_bumi", "bioenergi"].map((k) => { const p = b.potensi[k] && b.potensi[k].mw, e = b.terpasang[k] && b.terpasang[k].mw; return [k, p != null && e != null ? Math.max(0, p - e) : null]; });
        const ada_ = per.filter((x) => x[1] != null);
        peta.set(b.kode, { v: ada_.length ? Math.round(ada_.reduce((s, x) => s + x[1], 0)) : null, per, tanpaPengembang: b.proyek && b.proyek.mw_rencana_tanpa_pengembang });
      }
      return koro(peta, "hijau", 0, "MW");
    },
    popup: popupKoro("pn2.l.celah", (x) => baris("pn2.celah_tek", `<ul class="pn-kv">${x.per.filter((p) => p[1] != null).sort((a, b) => b[1] - a[1]).map((p) => `<li><span>${esc(labTek(p[0].replace("_", "-")))}</span><b>${esc(N(p[1]))} MW</b></li>`).join("")}</ul>`) + baris("pn2.tanpa_pengembang", x.tanpaPengembang != null && `${esc(N(x.tanpaPengembang))} MW`), () => taut("/peluang", "pn2.t.peluang", "kompas")),
  },
  desa_idm: {
    baca: (d) => koro(new Map(d.baris.map((b) => [b.kode, { v: b.persen_maju_mandiri_2024, b }])), "biru", 1, "%"),
    popup: popupKoro("pn2.l.desa_idm", (x) => baris("pn2.idm", `<ul class="pn-kv">${["mandiri", "maju", "berkembang", "tertinggal", "sangat_tertinggal"].map((k) => `<li><span>${esc(t("pn2.idm." + k))}</span><b>${esc(N(x.b[k]))}</b></li>`).join("")}</ul>`) + baris("pn2.tahun", x.b.tahun)),
  },
  desa_listrik: {
    baca: (d) => koro(new Map(d.baris.map((b) => [b.kode, { v: Math.round((100 - b.persen_berlistrik) * 100) / 100, b }])), "oranye", 2, "%"),
    popup: popupKoro("pn2.l.desa_listrik", (x) => baris("pn2.desa_total", N(x.b.jumlah_desa)) + baris("pn2.desa_pln", N(x.b.desa_pln)) + baris("pn2.desa_non", N(x.b.desa_non_pln)) + baris("pn2.desa_belum", N(x.b.belum_berlistrik)) + baris("pn2.tahun", x.b.tahun)),
  },
  meti_wilayah: {
    baca: (d) => koro(new Map(d.provinsi.map((p) => [p.kode, { v: (p.individu || 0) + (p.organisasi || 0), p }])), "hijau", 0, ""),
    popup: popupKoro("pn2.l.meti_wilayah", (x) => baris("pn2.individu", x.p.individu != null && N(x.p.individu)) + baris("pn2.organisasi", N(x.p.organisasi || 0)), (kode) => taut("/meti-wilayah/" + kode, "pn2.t.meti", "lokasi")),
  },
  rued: {
    baca: (d) => koro(new Map(d.baris.map((b) => [b.kode, { v: b.realisasi && b.realisasi.pangsa_kapasitas_persen != null ? b.realisasi.pangsa_kapasitas_persen : null, b }])), "biru", 1, "%"),
    popup: popupKoro("pn2.l.rued", (x) => baris("pn2.perda", esc(x.b.perda)) + baris("pn2.target", x.b.target != null && esc(typeof x.b.target === "object" ? JSON.stringify(x.b.target) : x.b.target)) + baris("pn2.tahun", x.b.realisasi && x.b.realisasi.tahun), (kode, x) => (x && urlAman(x.b.url_pdf) ? taut(x.b.url_pdf, "pn2.t.pdf", "pdf", true) : "")),
  },
  perizinan: {
    baca: (d) => koro(new Map(d.baris.filter((b) => b.skor != null).map((b) => [b.kode, { v: b.skor, b }])), "hijau", 0, "", { skala: [0, 100] }),
    popup: popupKoro("pn2.l.perizinan", (x) => baris("pn2.iz", `<ul class="pn-kv">${Object.entries(x.b.komponen).map(([k, c]) => `<li><span>${esc(t("pn2.iz." + k))}</span><b>${c.skor == null ? "-" : esc(N(c.skor))}</b></li>`).join("")}</ul>`) + baris("pn2.iz.bobot", `${esc(N(x.b.bobot_terpakai))}%`)),
  },
  keandalan: {
    baca: (d) => {
      const peta = new Map();
      for (const s of d.sistem) for (const k of s.prov) if (!peta.has(k)) peta.set(k, { v: s.rm_persen[0], s });
      return koro(peta, "biru", 1, "%");
    },
    popup: popupKoro("pn2.l.keandalan", (x) => baris("pn2.sistem", esc(x.s.nama)) + baris("pn2.rm_akhir", `${esc(N(x.s.rm_persen[x.s.rm_persen.length - 1], 1))}%`) + baris("pn2.beban", `${esc(N(x.s.beban_puncak_neto_mw[0]))} MW`) + baris("pn2.ebt_dmn", `${esc(N(x.s.ebt_dmn_mw[0]))} MW`) + baris("pn2.simpan", x.s.penyimpanan_ruptl_mw != null && `${esc(N(x.s.penyimpanan_ruptl_mw))} MW`) + baris("pn2.tahun", x.s.tahun_awal)),
  },
  generik_koroplet: {
    baca: (d, L) => {
      const a = Array.isArray(d) ? d : d.baris || d.provinsi || [];
      const peta = new Map();
      for (const b of Array.isArray(a) ? a : []) { const kode = String(b.kode ?? b.prov_kode ?? "").slice(0, 2), v = Number(b[L.nilai]); if (PROV[kode] && Number.isFinite(v)) peta.set(kode, { v, b }); }
      return koro(peta, "oranye", 1, L.satuan || "");
    },
    popup: popupKoro("pn2.l.generik", () => ""),
  },
};
export const kosongKoro = (k) => !k.peta.size;

export const ADAPTER = { titik: TITIK, garis: GARIS, poligon: POLIGON, koroplet: KORO };
export const adapterDari = (L) => ADAPTER[L.jenis] && ADAPTER[L.jenis][L.adapter];
export const teksNilai = fmtV;
export const popupProvinsiTanpaNilai = (kode) => kartu({ logo: lambang(kode), judul: esc(namaProv(kode) || kode), sub: esc(t("pn2.provinsi")), links: linkProv(kode) + taut("/peluang?prov=" + kode, "pn2.t.peluang", "kompas") + taut("/pelacak-proyek?prov=" + kode, "pn2.t.pelacak", "petir") });
