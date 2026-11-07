/* Modul industri lokal /pelacak (FITUR-200 J01 J02 J03 J05 J06 J07 J09 J11 A19). Berdiri sendiri: pemanggil (pelacak.js) memanggil
   industriHtml(cfg, ctx) lalu gambarSemua(); cara pasang tertulis di laporan. Hanya informasi dari data yang ada; yang belum ada = "butuh unduhan pemilik". */
import { t } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { exHtml, sumberHtml as infoHtml } from "/inti/komponen.js";
import { namaBaku } from "/inti/nama_baku.js";
import { kolomHtml } from "/pelacak_grafik.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { sumberLipat, num, amanUrl, batangHtml } from "/analisis.js";
import { tautOrg, tautProyek } from "/inti/tautan.js";
import { logoOrgSatu } from "/inti/logo_org.js";
import { tabelHtml } from "/pelacak_tabel.js";

const inisial = (nama) => namaBaku(nama).nama.replace(/^PT\.?\s+/i, "").charAt(0).toUpperCase() || "?";
const warnaMg = (nama) => [...String(nama)].reduce((z, c) => z + c.charCodeAt(0), 0) % 6;
const monogram = (nama) => `<span class="pl-lg pl-mg pl-mg-${warnaMg(nama)}" aria-hidden="true">${esc(inisial(nama))}</span>`;
/* satu logo 32px bulat di kiri nama; tanpa logo atau gambar rusak = monogram berwarna (bukan ikon orang) */
export const logoHtml = (id, nama, logo) => {
  const u = logoOrgSatu(id, nama, logo);
  return u ? `<span class="pl-lg"><img src="${esc(u)}" data-lg="${esc(nama)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"></span>` : monogram(nama);
};
export const gantiMonogram = (img) => { const h = Object.assign(document.createElement("span"), { innerHTML: monogram(img.dataset.lg) }).firstChild; (img.closest(".pl-lg") || img).replaceWith(h); };
const nm = (id, nama, logo) => { const n = namaBaku(nama).nama; return `<span class="pl-nm">${logoHtml(id, nama, logo)}<span>${id ? tautOrg(id, n) : esc(n)}</span></span>`; };
const ex = (id, ik, kunci, { info, ss, ...o }) => exHtml({ id, ikon: ik, topik: t(`pl.i.${kunci}.ey`), aksiHtml: aksiHtml({ csv: false }) + (o.sumber || "") + (info ? infoHtml(esc(info), t("pl.info")) : ""), ...o, subHtml: ss ? esc(t(ss)) : o.subHtml || "" });
const sel = (v) => (v == null || v === "" ? "-" : esc(v));
const tautSumber = (u) => { const a = amanUrl(u); return a ? `<a href="${esc(a)}" target="_blank" rel="noopener noreferrer">${esc(new URL(a).hostname.replace(/^www\./, ""))}</a>` : "-"; };
const adaKata = (teks, daftar) => daftar.some((k) => String(teks || "").toLowerCase().includes(k));
const surya = (cfg) => cfg.ind.pt === "surya";
const STATUS = { beroperasi: "pj.st.beroperasi", konstruksi: "pj.st.konstruksi", rencana: "pj.st.rencana" };
const stat = (s) => esc(STATUS[s] ? t(STATUS[s]) : s || "-");

/* baris pabrik seragam dari dua sumber: pabrikan modul (rantai_plts.pabrikan) dan fasilitas_lain */
export function barisPabrik(cfg, RT) {
  if (!RT || !cfg.ind) return [];
  const mod = surya(cfg) ? (RT.pabrikan || []).map((p) => ({ id: p.org_id || p.id, nama: p.nama, logo: p.logo, kota: p.kota, prov: p.provinsi, komp: t("pl.i.modul"), kap: p.mwp ?? null, sat: "MWp", status: "beroperasi", mulai: null, tkdn: p.tkdn, investor: null, sumber: RT.sumber?.url })) : [];
  const fas = (RT.fasilitas_lain || []).filter((f) => adaKata((f.komponen || []).join(" ") + " " + f.nama, cfg.ind.rt)).map((f) => ({
    id: f.perusahaan_id, nama: f.nama, logo: null, kota: f.lokasi?.kota, prov: f.lokasi?.provinsi, komp: (f.komponen || []).join(", "), kap: Number(f.kapasitas) || null,
    sat: String(f.satuan || "").replace("/tahun", ""), status: f.status, mulai: f.tahun_mulai, tkdn: f.tkdn, investor: f.negara_investor, sumber: f.sumber?.[0]?.url, tanggal: f.sumber?.[0]?.tanggal,
  }));
  const g = new Map();
  for (const r of [...mod, ...fas]) { const k = namaBaku(r.nama).nama.toLowerCase() + "|" + r.komp; const o = g.get(k); if (!o || (r.kap || 0) > (o.kap || 0)) g.set(k, r); }
  return [...g.values()];
}

export function industriHtml(cfg, X) {
  if (!cfg.ind) return ex("ind-celah", "gedung", "celah", { judulHtml: esc(t("pl.i.celah.j0")), isiHtml: celahIsi(cfg) });
  const { RT, TK, PT, PROY, BER } = X, out = [];
  const pab = barisPabrik(cfg, RT), jalan = pab.filter((r) => r.status === "beroperasi"), baru = pab.filter((r) => r.status !== "beroperasi");
  const srcRt = RT ? sumberLipat([{ sumber: RT.sumber?.judul, tanggal: RT.dibangun_pada }]) : "";

  /* J01 kapasitas pabrik */
  if (jalan.length) {
    const kap = jalan.filter((r) => r.sat === "MWp" && r.kap);
    const tot = kap.reduce((s, r) => s + r.kap, 0);
    const per = new Map(); for (const r of kap) if (r.kota) per.set(r.kota, (per.get(r.kota) || 0) + r.kap);
    const kota = [...per].sort((a, z) => z[1] - a[1]).slice(0, 8).map(([k, v]) => ({ label: k, bagian: [{ nilai: v, kelas: "jm-an-b1" }], teks: num(v) }));
    const g = kota.length >= 2 ? `<h3 class="pl-sub">${esc(t("pl.i.pabrik.g"))}</h3>${batangHtml(kota, { maks: kota[0].bagian[0].nilai, label: t("pl.i.pabrik.g") })}` : "";
    out.push(ex("ind-pabrik", "gedung", "pabrik", {
      judulHtml: tot ? hlHtml("pl.i.pabrik.j", num(jalan.length), { mw: num(tot) }) : hlHtml("pl.i.pabrik.j0", num(jalan.length)), ss: "pl.ss.pabrik", info: t("pl.i.pabrik.sub"),
      isiHtml: g + tabelHtml("tb-pabrik", { urut: "kap", arah: -1, satuan: "pl.u.pabrik", baris: jalan, kolom: [
        { k: "nama", j: "pl.c.pabrik", u: (r) => r.nama, sel: (r) => nm(r.id, r.nama, r.logo) },
        { k: "komp", j: "pl.c.komponen", u: (r) => r.komp, sel: (r) => esc(r.komp) },
        { k: "kota", j: "pl.c.kota", u: (r) => r.kota, sel: (r) => sel(r.kota) },
        { k: "kap", j: "pl.c.kapasitas", u: (r) => r.kap, desc: 1, kelas: "jm-num", sel: (r) => (r.kap ? `${esc(num(r.kap))} ${esc(r.sat)}` : "-") },
        { k: "mulai", j: "pl.c.mulai", u: (r) => r.mulai, kelas: "jm-num", sel: (r) => sel(r.mulai) },
        { k: "tkdn", j: "pl.c.tkdn", u: (r) => r.tkdn, desc: 1, kelas: "jm-num", sel: (r) => (r.tkdn != null ? esc(num(r.tkdn, 1)) + "%" : "-") },
      ] }), sumber: srcRt,
    }));
  }

  /* J02 + J06 TKDN dan katalog produk bersertifikat */
  const gt = new Map();
  for (const r of (TK?.baris || []).filter((r) => cfg.ind.tkdn.includes(r.kategori))) { const k = [r.produsen, r.produk, r.merk].join("|").toLowerCase(), o = gt.get(k); if (!o) gt.set(k, { ...r, n: 1 }); else { o.n++; if ((r.tkdn_persen || 0) > (o.tkdn_persen || 0)) Object.assign(o, { tkdn_persen: r.tkdn_persen, berlaku_sampai: r.berlaku_sampai, sumber_url: r.sumber_url }); } }
  const tk = [...gt.values()];
  if (tk.length) {
    const rata = tk.reduce((s, r) => s + (r.tkdn_persen || 0), 0) / tk.length;
    const ember = [["<25", (v) => v < 25], ["25-40", (v) => v >= 25 && v < 40], ["40-60", (v) => v >= 40 && v < 60], ["60+", (v) => v >= 60]].map(([l, f]) => { const n = tk.filter((r) => f(r.tkdn_persen || 0)).length; return { label: l + "%", v: n, tip: `${l}%: ${num(n)} ${t("pl.u.produk")}` }; });
    out.push(ex("ind-tkdn", "tabel", "tkdn", {
      judulHtml: hlHtml("pl.i.tkdn.j", num(tk.length), { rata: num(rata, 1) }), ss: "pl.ss.tkdn", info: t("pl.i.tkdn.sub"),
      isiHtml: (ember.filter((x) => x.v).length >= 2 ? `<h3 class="pl-sub">${esc(t("pl.i.tkdn.g"))}</h3>${kolomHtml(ember, { label: t("pl.i.tkdn.g") })}` : "") + tabelHtml("tb-tkdn", { urut: "tkdn", arah: -1, satuan: "pl.u.produk", baris: tk, kolom: [
        { k: "produsen", j: "pl.c.produsen", u: (r) => r.produsen, sel: (r) => nm(r.produsen_org_id, r.produsen) },
        { k: "produk", j: "pl.c.produk", u: (r) => r.produk, sel: (r) => esc([r.produk, r.merk].filter(Boolean).join(", ")) + (r.n > 1 ? `<small class="pl-ket">${esc(t("pl.i.tipe", { n: r.n }))}</small>` : "") },
        { k: "tkdn", j: "pl.c.tkdn", u: (r) => r.tkdn_persen, desc: 1, kelas: "jm-num", sel: (r) => esc(num(r.tkdn_persen, 1)) + "%" },
        { k: "berlaku", j: "pl.c.berlaku", u: (r) => r.berlaku_sampai, sel: (r) => sel(r.berlaku_sampai) },
        { k: "sumber", j: "pl.c.sumber", u: (r) => r.sumber_url, sel: (r) => tautSumber(r.sumber_url) },
      ] }), sumber: sumberLipat([{ sumber: TK.sumber?.[0]?.judul, url: TK.sumber?.[0]?.url, tanggal: TK.dibangun_pada }]),
    }));
  }

  /* J07 rekam jejak pemasok: pemasok yang punya proyek rujukan */
  const idP = new Map((PROY || []).map((p) => [p.id, p]));
  const pem = (PT?.baris || []).filter((r) => (r.teknologi || []).includes(cfg.ind.pt) && (r.proyek_rujukan || []).length);
  if (pem.length) out.push(ex("ind-pemasok", "proyek", "pemasok", {
    judulHtml: hlHtml("pl.i.pemasok.j", num(pem.length), { n: num(pem.reduce((s, r) => s + r.proyek_rujukan.length, 0)) }), ss: "pl.ss.pemasok", info: t("pl.i.pemasok.sub"),
    isiHtml: tabelHtml("tb-pemasok", { urut: "n", arah: -1, satuan: "pl.u.pemasok", baris: pem, kolom: [
      { k: "nama", j: "pl.c.pemasok", u: (r) => r.nama, sel: (r) => nm(r.organisasi_id, r.nama) },
      { k: "kat", j: "pl.c.kategori", u: (r) => (r.kategori_layanan || [])[0], sel: (r) => esc((r.kategori_layanan || []).slice(0, 2).join(", ")) },
      { k: "n", j: "pl.c.proyek_n", u: (r) => r.proyek_rujukan.length, desc: 1, kelas: "jm-num", sel: (r) => esc(num(r.proyek_rujukan.length)) },
      { k: "proyek", j: "pl.c.proyek", u: (r) => r.proyek_rujukan[0], sel: (r) => r.proyek_rujukan.slice(0, 3).map((x) => (idP.has(x.id || x) ? tautProyek(x.id || x) : esc(String(x.nama || x)))).join("<br>") },
      { k: "sumber", j: "pl.c.sumber", u: (r) => r.sumber?.[0]?.url, sel: (r) => tautSumber(r.sumber?.[0]?.url) },
    ] }), sumber: PT ? sumberLipat([{ sumber: t("pl.i.src.pt"), tanggal: PT.dibangun_pada }]) : "",
  }));

  /* J11 investasi pabrik baru: fasilitas berstatus rencana/konstruksi + berita pabrik */
  const brt = (BER || []).filter((b) => /pabrik|manufaktur|smelter/i.test(b.judul) && cfg.ind.rt.some((k) => b.judul.toLowerCase().includes(k.split(" ")[0])));
  const bar = [...baru.map((r) => ({ ...r, jenis: "fasilitas" })), ...brt.map((b) => ({ nama: b.judul, jenis: "berita", status: null, mulai: String(b.terbit).slice(0, 4), komp: "", kap: null, sat: "", investor: null, sumber: b.url, tanggal: b.terbit }))];
  if (bar.length) out.push(ex("ind-investasi", "grafik", "investasi", {
    judulHtml: hlHtml("pl.i.investasi.j", num(bar.length), {}), ss: "pl.ss.investasi", info: t("pl.i.investasi.sub"),
    isiHtml: tabelHtml("tb-investasi", { urut: "mulai", arah: -1, satuan: "pl.u.kabar", baris: bar, kolom: [
      { k: "nama", j: "pl.c.pabrik", u: (r) => r.nama, sel: (r) => (r.jenis === "fasilitas" ? nm(r.id, r.nama) : esc(r.nama)) },
      { k: "status", j: "pl.c.status", u: (r) => r.status, kelas: "jm-tengah", sel: (r) => (r.status ? `<span class="jm-pil">${stat(r.status)}</span>` : `<span class="jm-pil">${esc(t("pl.i.berita"))}</span>`) },
      { k: "kap", j: "pl.c.kapasitas", u: (r) => r.kap, desc: 1, kelas: "jm-num", sel: (r) => (r.kap ? `${esc(num(r.kap))} ${esc(r.sat)}` : "-") },
      { k: "investor", j: "pl.c.investor", u: (r) => r.investor, sel: (r) => sel(r.investor) },
      { k: "mulai", j: "pl.c.tahun", u: (r) => Number(r.mulai) || null, desc: 1, kelas: "jm-num", sel: (r) => sel(r.mulai) },
      { k: "sumber", j: "pl.c.sumber", u: (r) => r.sumber, sel: (r) => tautSumber(r.sumber) },
    ] }), sumber: srcRt,
  }));

  /* J09 + A19 lab uji dan lembaga sertifikasi */
  const lab = (PT?.baris || []).filter((r) => (r.teknologi || []).includes(cfg.ind.pt) && (r.kategori_layanan || []).some((k) => /uji|sertifikasi|inspeksi/.test(k)));
  if (lab.length) out.push(ex("ind-lab", "metode", "lab", {
    judulHtml: hlHtml("pl.i.lab.j", num(lab.length), {}), ss: "pl.ss.lab", info: t("pl.i.lab.sub"),
    isiHtml: tabelHtml("tb-lab", { urut: "nama", satuan: "pl.u.lembaga", baris: lab, kolom: [
      { k: "nama", j: "pl.c.lembaga", u: (r) => r.nama, sel: (r) => nm(r.organisasi_id, r.nama) },
      { k: "kat", j: "pl.c.kategori", u: (r) => (r.kategori_layanan || [])[0], sel: (r) => esc((r.kategori_layanan || []).filter((k) => /uji|sertifikasi|inspeksi/.test(k)).join(", ")) },
      { k: "kel", j: "pl.c.anggota", u: (r) => (r.keanggotaan || [])[0], sel: (r) => sel((r.keanggotaan || []).join(", ")) },
      { k: "sumber", j: "pl.c.sumber", u: (r) => r.sumber?.[0]?.url, sel: (r) => tautSumber(r.sumber?.[0]?.url) },
    ] }), sumber: PT ? sumberLipat([{ sumber: t("pl.i.src.pt"), tanggal: PT.dibangun_pada }]) : "",
  }));

  /* J03 J05 A19 dan sisanya: yang belum ada di Direktori */
  out.push(ex("ind-celah", "gedung", "celah", { judulHtml: esc(t("pl.i.celah.j")), ss: "pl.ss.celah", info: t("pl.i.celah.sub"), isiHtml: celahIsi(cfg) }));
  return out.join("");
}

/* Tabel butir yang belum terpanen. Bahan baku per teknologi hanya daftar nama bahan, tanpa angka. */
const BAHAN = { surya: "pl.bahan.surya", terapung: "pl.bahan.surya", hibrida: "pl.bahan.baterai", bayu: "pl.bahan.bayu", baterai: "pl.bahan.baterai", "kendaraan-listrik": "pl.bahan.baterai", "panas-bumi": "pl.bahan.baja", plta: "pl.bahan.baja", hidrogen: "pl.bahan.hidrogen", "daur-ulang": "pl.bahan.daur", bioenergi: "pl.bahan.bio", psel: "pl.bahan.baja" };
const SUMBER_BELUM = [
  ["impor", "https://www.bps.go.id/id/exim", "BPS"], ["bahan", "https://modi.esdm.go.id/", "Kementerian ESDM (MODI)"], ["sni", "https://sispk.bsn.go.id/SNI", "BSN"],
  ["lab", "https://kan.or.id/", "KAN"], ["datasheet", null, "pl.i.pabrikan"], ["tkdn", "https://tkdn.kemenperin.go.id/", "Kemenperin"],
];
function celahIsi(cfg) {
  const bahan = t(BAHAN[cfg.id.replace("plts-", "").replace("atap", "surya")] || "pl.bahan.baja");
  const hs = { baterai: "8507", "kendaraan-listrik": "8507", bayu: "8502", "plts-atap": "8541", "plts-terapung": "8541", hibrida: "8541" }[cfg.id];
  const baris = SUMBER_BELUM.filter(([k]) => k !== "impor" || hs).map(([k, u, s]) => ({ k, u, s: s.startsWith("pl.") ? t(s) : s, hs, bahan }));
  return tabelHtml("tb-celah", { urut: "k", satuan: "pl.u.butir", baris, kolom: [
    { k: "k", j: "pl.c.butir", u: (r) => t("pl.celah." + r.k), sel: (r) => `<b>${esc(t("pl.celah." + r.k))}</b><small class="pl-ket">${esc(t("pl.celah." + r.k + ".ket", { hs: r.hs || "", bahan: r.bahan }))}</small>` },
    { k: "s", j: "pl.c.penyedia", u: (r) => r.s, sel: (r) => (r.u ? `<a href="${esc(r.u)}" target="_blank" rel="noopener noreferrer">${esc(r.s)}</a>` : esc(r.s)) },
    { k: "st", j: "pl.c.status", u: () => 0, kelas: "jm-tengah", sel: () => `<span class="jm-pil jm-pil-warn">${esc(t("pl.butuh"))}</span>` },
  ] });
}
