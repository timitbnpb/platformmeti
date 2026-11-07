/* Enam kartu dataset di beranda: semua angka dihitung dari public/data/*.json; grafik SVG/CSS polos. */
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon, fotoBerita } from "/inti/umum.js";
import { ikonTek, ikonStatus, pilTek } from "/inti/ikon_tek.js";
import { kodeProvinsi } from "/inti/tautan.js";
import { namaProyek } from "/inti/nama_proyek.js";
import { sumberHtml, unduhRegHtml, exHtml, lihatSemuaHtml } from "/inti/komponen.js";
import { penerbitHtml } from "/penerbit.js";
import { muat, label, namaRegulasi, sembunyi } from "/publik.js";

import { LOGO_ORG, LOGO_NAMA, logoOrg } from "/inti/logo_org.js";
export { LOGO_ORG };
/** Isi thumbnail proyek: ubin ikon teknologi + MW besar, ditutup foto dari berita tertaut bila ada (pola /teknologi). */
export function ubinProyek(p, foto) {
  const k = p.kapasitas?.[0], fid = (p.berita_ids || []).find((b) => fotoBerita(foto, b));
  return `${ikonTek(p.teknologi)}<b>${k ? esc(angka(k.nilai, { desimal: k.nilai % 1 ? 1 : 0 })) : "-"}</b>${k ? `<small>${esc(k.satuan)}</small>` : ""}${fid ? `<img src="${esc(fotoBerita(foto, fid))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : ""}`;
}
/** Ikon gedung untuk pemilik tanpa logo. */
export const GEDUNG = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 21V5l9-2v18M13 8h7v13M7 8h3M7 12h3M7 16h3M3 21h18"/></svg>';
const IKON_DS = { proyek: "proyek", pengembang: "direktori", regulasi: "regulasi", rantai: "rantai", wilayah: "wilayah", pustaka: "daftar" };
const BELUM = "IPP?";
const BUMN = /^(PLN|Indonesia Power|Pembangkitan Jawa Bali|Inalum|Jasa Tirta)/i;
const jml = (a, f) => a.reduce((s, x) => s + (f(x) || 0), 0);
const sat = (p) => p.kapasitas?.[0]?.nilai || 0;
const st = (p) => p.status?.[0]?.nilai;
const inisial = (n) => { const w = String(n).split(/\s+/).filter(Boolean); const r = w.length > 1 ? w[0][0] + w[1][0] : (w[0] || "").slice(0, 2); return r[0].toUpperCase() + r.slice(1).toLowerCase(); };

function pemilik(nilai) {
  let n = String(nilai).replace(/\s*\((IPP|Persero)\)/gi, "").replace(/^PT\.?\s+/i, "").replace(/\s+(Persero|Tbk)\.?$/i, "").trim();
  if (/^(SH-)?PLN$/i.test(n)) n = "PLN";
  if (/^(IPP|swasta|private|independent power producer)$/i.test(n)) n = BELUM;
  if (n === "PLN IP") n = "Indonesia Power";
  return n;
}

const kartu = (kunci, w, href, tgl, stat, viz, sumberTeks) => exHtml({
  kelas: "jm-ds jm-w" + w, tingkat: "h3", ikon: IKON_DS[kunci], topik: t("beranda.ds." + kunci + ".k"),
  judulHtml: esc(t("beranda.ds." + kunci + ".j")), subHtml: esc(t("beranda.ds." + kunci + ".sub")), aksiHtml: sumberHtml(esc(sumberTeks)),
  isiHtml: `<dl class="jm-ds-stat">${stat.map(([n, l, est, ik, wr, tip]) => `<div class="jm-ds-st"${tip ? ` title="${esc(t(tip))}"` : ""}><span class="jm-ds-sik jm-tn-${wr || "data2"}" aria-hidden="true">${ikon(ik || "grafik", 20)}</span><dd class="jm-ds-n">${esc(n)}</dd><dt>${esc(t(l))}${est ? ` <span class="jm-pil jm-pil-est">EST</span>` : ""}</dt></div>`).join("")}</dl><div class="jm-ds-viz">${viz}</div>`,
  kakiHtml: `<span>${esc(t("beranda.ds.diperbarui", { tanggal: tanggal(tgl) }))}</span>${lihatSemuaHtml(href, t("beranda.ds.buka"))}` });

/** Daerah proyek: ikon lokasi + lambang provinsi + "Kabupaten, Provinsi" (dari proyek.json lokasi). */
export function lokasiHtml(p) {
  const kab = p.lokasi?.kabupaten_kota?.[0]?.nilai, prov = p.lokasi?.provinsi, k = prov && kodeProvinsi(prov), teks = [kab, prov].filter(Boolean).join(", ");
  if (!teks) return `<span class="jm-lok jm-redup">${ikon("lokasi", 14)}<span>-</span></span>`;
  return `<span class="jm-lok" title="${esc(teks)}">${ikon("lokasi", 14)}${k ? `<img class="jm-lok-lb" src="/img/provinsi/${esc(k)}.png" width="16" height="16" alt="" loading="lazy" decoding="async" data-galat="hapus">` : ""}<span>${esc(teks)}</span></span>`;
}
const PASAR = { lokal: ["bendera", "lokal"], ekspor: ["globe", "ekspor"], keduanya: ["peta", "campur"] };
/** Pil pasar pabrikan: ikon + warna beda per nilai. */
const pilPasar = (v) => { const [ik, w] = PASAR[v] || ["info", "lain"]; return `<span class="jm-pil-st jm-pasar-${w}">${ikon(ik, 14)}<span>${esc(label("rt.pasar.", v))}</span></span>`; };
/** Sel logo bundar-persegi: monogram berwarna di bawah, logo menutupinya bila ada; kosong = ikon gedung. */
const warnaMono = (n) => 1 + [...String(n)].reduce((h, c) => h + c.charCodeAt(0), 0) % 5;
const logoSel = (url, nama) => `<span class="jm-pm-lg"><span class="jm-pm-ini jm-w${warnaMono(nama)}" aria-hidden="true">${nama ? esc(inisial(nama)) : GEDUNG}</span>${url ? `<img src="${esc(url)}" width="24" height="24" alt="" loading="lazy" data-galat="hapus">` : ""}</span>`;

/** Baris peringkat: nomor bulat, nama + pil, batang tipis, nilai tabular di kanan. items: {nama, pil, nilai, unit, frac} */
const rangking = (items) => `<ol class="jm-rank">${items.map((o, i) => `<li class="jm-rank-i"><span class="jm-rank-no">${i + 1}</span><span class="jm-rank-t">${o.th ? `<span class="jm-rank-th jm-pt-k jm-tek-${esc(o.thKls)}">${o.th}</span>` : ""}${o.logo ? `<img class="jm-rank-lg" src="${esc(o.logo)}" width="24" height="24" alt="" loading="lazy">` : ""}${o.logoSel || ""}<span class="jm-rank-tx"><span class="jm-rank-nm"><strong title="${esc(o.nama)}">${o.href ? `<a href="${esc(o.href)}">${esc(o.nama)}</a>` : esc(o.nama)}</strong>${o.aksi || ""}${o.pilHtml || (o.pil ? `<span class="jm-pil">${esc(o.pil)}</span>` : "")}</span>${o.meta ? `<small class="jm-rank-meta">${o.meta}</small>` : ""}</span></span><span class="jm-rank-v"><b>${esc(o.nilai)}</b>${o.unit ? ` <small>${esc(o.unit)}</small>` : ""}</span></li>`).join("")}</ol>`;

const baris = (kiri, kanan) => `<div class="jm-ds-baris"><span>${esc(kiri)}</span><span>${esc(kanan)}</span></div>`;
const bar = (frac, w) => `<svg class="jm-ds-bar jm-w${w}" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true"><rect class="jm-bar-isi" width="${Math.max(1, Math.round(frac * 100))}" height="6"/></svg>`;

const logoPabrik = (p) => p.logo || logoOrg(p.id, p.nama, null)[0] || "";
const ALIAS_LOGO = [[/pembangkitan jawa bali|^pjb\b/i, "pln-nusantara-power"], [/indonesia power/i, "pln-indonesia-power"]];
/** Nama singkat baku: singkatan dalam kurung menang (Danantara, Denera, Veolia); selain itu buang badan hukum. */
const singkatPemilik = (n) => { const k = /\(([^)]{3,20})\)\s*$/.exec(n)?.[1]; if (k && !/^(ipp|persero|tbk)$/i.test(k)) return k.trim(); return n.replace(/\s*\(.*?\)/g, "").replace(/^PT\.?\s+/i, "").replace(/\s+(Pte\.?\s+Ltd\.?|Group|Consortium|Persero|Tbk)\.?$/gi, "").replace(/\s+Environmental Services Asia$/i, "").trim(); };
const norm = (n) => String(n).toLowerCase().replace(/^pt\.?\s+/, "").replace(/\s+tbk$/, "").trim();
/** Organisasi dari data untuk nama pemilik: nama persis, lalu nama singkat, lalu nama yang memuat nama singkat. */
function cariOrg(nama, singkat, orgs) {
  const a = norm(nama), b = norm(singkat);
  return orgs.find((o) => norm(o.nama) === a) || orgs.find((o) => norm(o.nama) === b) || (b.length >= 5 ? orgs.find((o) => norm(o.nama).includes(b)) : null) || null;
}
function logoPemilik(nama, org) {
  const al = ALIAS_LOGO.find(([re]) => re.test(nama))?.[1];
  if (al) return `/img/logo/${al}.png`;
  return org ? logoOrg(org.id, org.nama, org.logo)[0] || "" : LOGO_NAMA[nama] ? `/img/logo/${LOGO_NAMA[nama]}.png` : "";
}
function pencar(proyek, org) {
  const per = new Map();
  for (const p of proyek) for (const o of p.pihak?.pemilik || []) {
    const k = pemilik(o.nilai), d = per.get(k) || per.set(k, { k, penuh: o.nilai, bangun: 0, rencana: 0, n: 0 }).get(k);
    d.n++; const m = sat(p), s = st(p);
    if (s === "beroperasi" || s === "konstruksi") d.bangun += m; else if (s === "rencana") d.rencana += m;
  }
  const semua = [...per.values()], urut = (a, b) => b.bangun + b.rencana - a.bangun - a.rencana, ada = semua.filter((d) => d.bangun + d.rencana > 0);
  const belum = ada.find((d) => d.k === BELUM), top = [...ada.filter((d) => d !== belum).sort(urut).slice(0, belum ? 9 : 10), ...(belum ? [belum] : [])];
  const baris = top.map((d) => {
    const nama = d === belum ? t("beranda.pm.belum") : singkatPemilik(d.k), og = d === belum ? null : cariOrg(d.k, nama, org), lg = d === belum ? "" : logoPemilik(d.k, og);
    const nm = d === belum ? esc(nama) : og ? `<a class="jm-taut" href="/o/${esc(og.id)}">${esc(nama)}</a>` : esc(nama);
    return `<li class="jm-pm">${logoSel(lg, d === belum ? "" : nama)}<span class="jm-pm-n" title="${esc(d === belum ? nama : d.penuh)}">${nm}</span>
      <span class="jm-pm-v"><b>${esc(angka(d.bangun + d.rencana))}</b> <small>MW</small></span>
      <span class="jm-pm-pil">${d.bangun ? `<span class="jm-pil-st jm-st-beroperasi">${ikonStatus("beroperasi").replace('class="jm-ikt"', 'class="jm-ikt jm-ikt-s"')}<span>${esc(t("beranda.ds.pengembang.bangun", { n: angka(d.bangun) }))}</span></span>` : ""}${d.rencana ? `<span class="jm-pil-st jm-st-rencana">${ikon("kalender", 14)}<span>${esc(t("beranda.ds.pengembang.rencana", { n: angka(d.rencana) }))}</span></span>` : ""}</span></li>`;
  }).join("");
  const svg = `<ol class="jm-pm-daftar" aria-label="${esc(t("beranda.ds.pengembang.aria"))}">${baris}</ol>`;
  const total = jml(semua, (d) => d.bangun + d.rencana), bumn = jml(semua.filter((d) => BUMN.test(d.k)), (d) => d.bangun + d.rencana);
  return { n: semua.length, pangsa: total ? (bumn / total) * 100 : 0, pipa: jml(semua, (d) => d.rencana + (d.bangun)), svg };
}

export async function gambarDataset(R) {
  const el = document.getElementById("dataset");
  try {
    const [pro, org, reg, rantai, wil, pus, orang, ber] = await Promise.all(["proyek", "organisasi", "regulasi", "rantai_plts", "wilayah", "pustaka", "orang", "berita"].map(muat)), foto = await muat("berita_foto").catch(() => ({}));
    const tahun = +String(pro.dibangun_pada).slice(0, 4);
    const kap = R.kartu.find((k) => k.kode === "kapasitas")?.nilai;
    const lewat = pro.baris.filter((p) => st(p) !== "beroperasi" && p.cod_target?.length && Math.min(...p.cod_target.map((c) => c.nilai)) < tahun).length;
    const urut7 = [...pro.baris].sort((a, b) => sat(b) - sat(a)).slice(0, 10);
    const top7 = rangking(urut7.map((p) => ({ nama: namaProyek(p), href: "/p/" + p.id, pilHtml: pilTek(p.teknologi), meta: lokasiHtml(p), th: ubinProyek(p, foto), thKls: p.teknologi || "lain", nilai: angka(sat(p)), unit: p.kapasitas[0].satuan, frac: sat(p) / sat(urut7[0]) })));
    const pc = pencar(pro.baris, org.baris);
    const baru = `<ol class="jm-rb">${[...reg.baris].filter((r) => r.tanggal_ditetapkan).sort((a, b) => String(b.tanggal_ditetapkan).localeCompare(String(a.tanggal_ditetapkan))).slice(0, 7).map((r) => `<li class="jm-rb-i">${penerbitHtml(r.instansi_penerbit, 28).replace(/<span class="jm-pen-pendek">.*?<\/span>/, "")}<a class="jm-rb-t" href="/regulasi?id=${encodeURIComponent(r.id)}"><b>${esc(namaRegulasi(r))}</b><small title="${esc(r.judul || "")}">${esc(r.judul || "")}</small></a><span class="jm-rb-tgl">${esc(tanggal(r.tanggal_ditetapkan))}</span>${unduhRegHtml(r)}</li>`).join("")}</ol>`;
    const topPab = [...rantai.pabrikan].sort((a, b) => b.mwp - a.mwp).slice(0, 6), rr = rantai.ringkas, tk = rantai.pabrikan.filter((x) => x.tkdn != null), tkdn = tk.length ? jml(tk, (x) => x.tkdn) / tk.length : null;
    const top5 = [...wil.baris].filter((w) => w.terpasang_mw?.nilai != null).sort((a, b) => b.terpasang_mw.nilai - a.terpasang_mw.nilai).slice(0, 5), mw5 = top5[0]?.terpasang_mw.nilai || 1;
    const re = wil.baris.map((w) => w.rasio_elektrifikasi?.nilai).filter(Number.isFinite);
    const doc = rangking([...pus.baris].sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal))).slice(0, 5).map((d) => ({ nama: d.judul, nilai: tanggal(d.tanggal) })));
    const sm = (k, p) => t("beranda.ds." + k + ".s", { tanggal: tanggal(p) });
    el.innerHTML = [
      kartu("proyek", 1, "/proyek", pro.dibangun_pada, [[angka(pro.baris.length), "beranda.ds.l.proyek", 0, "lokasi", "data2"], [angka(kap), "beranda.ds.l.mw", 1, "petir", "warn", "beranda.ds.tip.mw"], [angka(lewat), "beranda.ds.l.cod", 1, "jam", "bad", "beranda.ds.tip.cod"]], top7, sm("proyek", pro.dibangun_pada)),
      kartu("pengembang", 2, "/direktori?tampil=lembaga", pro.dibangun_pada, [[angka(pc.n), "beranda.ds.l.pengembang", 0, "gedung", "data5"], [angka(pc.pangsa, { desimal: 1 }) + "%", "beranda.ds.l.bumn", 1, "perisai", "data1", "beranda.ds.tip.bumn"], [angka(pc.pipa), "beranda.ds.l.pipa", 1, "petir", "warn", "beranda.ds.tip.pipa"]], pc.svg, sm("pengembang", pro.dibangun_pada)),
      kartu("regulasi", 3, "/regulasi", reg.dibangun_pada, [[angka(reg.baris.length), "beranda.ds.l.reg", 0, "regulasi", "data1"], [angka(reg.baris.filter((r) => r.status === "berlaku").length), "beranda.ds.l.berlaku", 0, "centang", "ok"], [angka(reg.baris.filter((r) => r.status === "diubah" || r.status === "dicabut").length), "beranda.ds.l.ubahcabut", 0, "ubah", "warn"]], baru, sm("regulasi", reg.dibangun_pada)),
      kartu("rantai", 4, "/rantai", rantai.dibangun_pada, [[angka(rr.pabrikan), "beranda.ds.l.pabrikan", 0, "pabrik", "data3"], [angka(rr.total_mwp / 1000, { desimal: 1 }), "beranda.ds.l.gwp", 0, "tek-surya", "tp-surya"], [tkdn == null ? "-" : angka(tkdn, { desimal: 1 }) + "%", "beranda.ds.l.tkdn", 1, "lencana", "ok", "beranda.ds.tip.tkdn"]],
        `<div class="jm-ds-pasar"><span class="jm-ds-ps">${ikon("rantai", 16)}<span>${esc(t("beranda.ds.l.lokal"))}</span><b>${esc(angka(rr.lokal_mwp))}</b><small>MWp</small></span><span class="jm-ds-ps">${ikon("asean", 16)}<span>${esc(t("beranda.ds.l.ekspor"))}</span><b>${esc(angka(rr.ekspor_mwp))}</b><small>MWp</small></span></div>${rangking(topPab.map((p) => ({ nama: p.nama.replace(/^PT\.?\s+/i, ""), pilHtml: pilPasar(p.pasar), logoSel: logoSel(logoPabrik(p), p.nama.replace(/^PT\.?\s+/i, "")), href: "/o/" + p.id, nilai: angka(p.mwp), unit: "MWp", frac: p.mwp / topPab[0].mwp })))}`, t("beranda.ds.rantai.s", { tanggal: tanggal(rantai.sumber.tanggal) })),
      kartu("wilayah", 5, "/wilayah", wil.dibangun_pada, [[angka(wil.baris.length), "beranda.ds.l.prov", 0, "wilayah", "data3"], [angka(jml(wil.baris, (w) => w.terpasang_mw?.nilai)), "beranda.ds.l.terpasang", 0, "petir", "warn"], [re.length ? angka(jml(re, (x) => x) / re.length, { desimal: 1 }) + "%" : "-", "beranda.ds.l.rasio", 1, "tek-listrik", "tp-listrik"]],
        rangking(top5.map((w) => ({ nama: w.nama, logo: w.kode ? `/img/provinsi/${w.kode}.png` : "", href: w.kode ? `/wilayah/${w.kode}` : "", nilai: angka(w.terpasang_mw.nilai), unit: "MW", frac: w.terpasang_mw.nilai / mw5 }))), sm("wilayah", wil.dibangun_pada)),
      kartu("pustaka", 1, "/direktori?tampil=pustaka", pus.dibangun_pada, [[angka(pus.baris.length), "beranda.ds.l.dok", 0, "buku", "data4"], [angka(orang.baris.length), "beranda.ds.l.pakar", 0, "orang", "data2"], [angka(ber.baris.length), "beranda.ds.l.berita", 0, "berita", "info"]], doc, sm("pustaka", pus.dibangun_pada)),
    ].join("");
  } catch (e) { sembunyi(el, e); }
}
