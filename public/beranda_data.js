/* Enam kartu dataset di beranda: semua angka dihitung dari public/data/*.json; grafik SVG/CSS polos. */
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon, fotoBerita } from "/inti/umum.js";
import { ikonTek, ikonStatus, pilTek } from "/inti/ikon_tek.js";
import { tautOrg } from "/inti/tautan.js";
import { namaProyek } from "/inti/nama_proyek.js";
import { sumberHtml, unduhRegHtml, exHtml, lihatSemuaHtml } from "/inti/komponen.js";
import { penerbitHtml } from "/penerbit.js";
import { muat, label, namaRegulasi, sembunyi } from "/publik.js";

import { LOGO_ORG, LOGO_NAMA } from "/inti/logo_org.js";
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
const inisial = (n) => String(n).split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

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
  isiHtml: `<dl class="jm-ds-stat">${stat.map(([n, l, est]) => `<div><dd class="jm-ds-n">${esc(n)}</dd><dt>${esc(t(l))}${est ? ` <span class="jm-pil jm-pil-est">EST</span>` : ""}</dt></div>`).join("")}</dl><div class="jm-ds-viz">${viz}</div>`,
  kakiHtml: `<span>${esc(t("beranda.ds.diperbarui", { tanggal: tanggal(tgl) }))}</span>${lihatSemuaHtml(href, t("beranda.ds.buka"))}` });

/** Baris peringkat: nomor bulat, nama + pil, batang tipis, nilai tabular di kanan. items: {nama, pil, nilai, unit, frac} */
const rangking = (items) => `<ol class="jm-rank">${items.map((o, i) => `<li class="jm-rank-i"><span class="jm-rank-no">${i + 1}</span><span class="jm-rank-t">${o.th ? `<span class="jm-rank-th jm-pt-k jm-tek-${esc(o.thKls)}">${o.th}</span>` : ""}${o.logo ? `<img class="jm-rank-lg" src="${esc(o.logo)}" width="24" height="24" alt="" loading="lazy">` : ""}<span class="jm-rank-tx"><strong title="${esc(o.nama)}">${o.href ? `<a href="${esc(o.href)}">${esc(o.nama)}</a>` : esc(o.nama)}</strong>${o.aksi || ""}${o.pilHtml ? `<small>${o.pilHtml}</small>` : o.pil ? `<small><span class="jm-pil">${esc(o.pil)}</span></small>` : ""}</span></span><span class="jm-rank-v"><b>${esc(o.nilai)}</b>${o.unit ? ` <small>${esc(o.unit)}</small>` : ""}</span></li>`).join("")}</ol>`;

const baris = (kiri, kanan) => `<div class="jm-ds-baris"><span>${esc(kiri)}</span><span>${esc(kanan)}</span></div>`;
const bar = (frac, w) => `<svg class="jm-ds-bar jm-w${w}" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true"><rect class="jm-bar-isi" width="${Math.max(1, Math.round(frac * 100))}" height="6"/></svg>`;

const norm = (n) => String(n).toLowerCase().replace(/^pt\.?\s+/, "").replace(/\s+tbk$/, "").trim();
function logoPemilik(nama, orgIdx) {
  const id = orgIdx.get(norm(nama)), slug = LOGO_NAMA[nama] || LOGO_ORG[id];
  return slug ? `/img/logo/${slug}.png` : id ? `/img/logo/org/${id}.png` : "";
}
function pencar(proyek, org) {
  const per = new Map(), idx = new Map(org.map((o) => [norm(o.nama), o.id]));
  for (const p of proyek) for (const o of p.pihak?.pemilik || []) {
    const k = pemilik(o.nilai), d = per.get(k) || per.set(k, { k, bangun: 0, rencana: 0, n: 0 }).get(k);
    d.n++; const m = sat(p), s = st(p);
    if (s === "beroperasi" || s === "konstruksi") d.bangun += m; else if (s === "rencana") d.rencana += m;
  }
  const semua = [...per.values()], urut = (a, b) => b.bangun + b.rencana - a.bangun - a.rencana, ada = semua.filter((d) => d.bangun + d.rencana > 0);
  const belum = ada.find((d) => d.k === BELUM), top = [...ada.filter((d) => d !== belum).sort(urut).slice(0, belum ? 9 : 10), ...(belum ? [belum] : [])];
  const baris = top.map((d) => {
    const lg = d === belum ? "" : logoPemilik(d.k, idx), nama = d === belum ? t("beranda.pm.belum") : d.k, w = 1 + [...nama].reduce((h, c) => h + c.charCodeAt(0), 0) % 5;
    return `<li class="jm-pm"><span class="jm-pm-lg"><span class="jm-pm-ini jm-w${w}" aria-hidden="true">${esc(d === belum ? "?" : inisial(nama))}</span>${lg ? `<img src="${esc(lg)}" width="24" height="24" alt="" loading="lazy" data-galat="hapus">` : ""}</span><span class="jm-pm-n" title="${esc(nama)}">${d === belum ? esc(nama) : tautOrg(d.k)}</span>
      <span class="jm-pm-v"><b>${esc(angka(d.bangun + d.rencana))}</b> <small>MW</small></span>
      <span class="jm-pm-pil">${d.bangun ? `<span class="jm-pil-st jm-st-beroperasi">${ikonStatus("beroperasi").replace('class="jm-ikt"', 'class="jm-ikt jm-ikt-s"')}<span>${esc(t("beranda.ds.pengembang.bangun", { n: angka(d.bangun) }))}</span></span>` : ""}${d.rencana ? `<span class="jm-pil-st jm-st-rencana">${ikon("kalender", 14)}<span>${esc(t("beranda.ds.pengembang.rencana", { n: angka(d.rencana) }))}</span></span>` : ""}</span></li>`;
  }).join("");
  const leg = `<div class="jm-pm-leg"><b>${esc(t("beranda.ds.pengembang.st"))}</b><span class="jm-pil-st jm-st-beroperasi" title="${esc(t("beranda.ds.pengembang.bangun_t"))}">${ikonStatus("beroperasi").replace('class="jm-ikt"', 'class="jm-ikt jm-ikt-s"')}<span>${esc(t("beranda.ds.pengembang.bangun_l"))}</span></span><span class="jm-pil-st jm-st-rencana" title="${esc(t("beranda.ds.pengembang.rencana_t"))}">${ikon("kalender", 14)}<span>${esc(t("beranda.ds.pengembang.rencana_l"))}</span></span></div>`;
  const svg = leg + `<ol class="jm-pm-daftar" aria-label="${esc(t("beranda.ds.pengembang.aria"))}">${baris}</ol>`;
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
    const top7 = rangking(urut7.map((p) => ({ nama: namaProyek(p), href: "/p/" + p.id, pilHtml: pilTek(p.teknologi), th: ubinProyek(p, foto), thKls: p.teknologi || "lain", nilai: angka(sat(p)), unit: p.kapasitas[0].satuan, frac: sat(p) / sat(urut7[0]) })));
    const pc = pencar(pro.baris, org.baris);
    const baru = `<ol class="jm-rb">${[...reg.baris].filter((r) => r.tanggal_ditetapkan).sort((a, b) => String(b.tanggal_ditetapkan).localeCompare(String(a.tanggal_ditetapkan))).slice(0, 7).map((r) => `<li class="jm-rb-i">${penerbitHtml(r.instansi_penerbit, 28).replace(/<span class="jm-pen-pendek">.*?<\/span>/, "")}<a class="jm-rb-t" href="/regulasi?id=${encodeURIComponent(r.id)}"><b>${esc(namaRegulasi(r))}</b><small title="${esc(r.judul || "")}">${esc(r.judul || "")}</small></a><span class="jm-rb-tgl">${esc(tanggal(r.tanggal_ditetapkan))}</span>${unduhRegHtml(r)}</li>`).join("")}</ol>`;
    const topPab = [...rantai.pabrikan].sort((a, b) => b.mwp - a.mwp).slice(0, 6), rr = rantai.ringkas, tk = rantai.pabrikan.filter((x) => x.tkdn != null), tkdn = tk.length ? jml(tk, (x) => x.tkdn) / tk.length : null;
    const top5 = [...wil.baris].filter((w) => w.terpasang_mw?.nilai != null).sort((a, b) => b.terpasang_mw.nilai - a.terpasang_mw.nilai).slice(0, 5), mw5 = top5[0]?.terpasang_mw.nilai || 1;
    const re = wil.baris.map((w) => w.rasio_elektrifikasi?.nilai).filter(Number.isFinite);
    const doc = rangking([...pus.baris].sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal))).slice(0, 5).map((d) => ({ nama: d.judul, nilai: tanggal(d.tanggal) })));
    const sm = (k, p) => t("beranda.ds." + k + ".s", { tanggal: tanggal(p) });
    el.innerHTML = [
      kartu("proyek", 1, "/proyek", pro.dibangun_pada, [[angka(pro.baris.length), "beranda.ds.l.proyek"], [angka(kap), "beranda.ds.l.mw", 1], [angka(lewat), "beranda.ds.l.cod", 1]], top7, sm("proyek", pro.dibangun_pada)),
      kartu("pengembang", 2, "/direktori?tampil=lembaga", pro.dibangun_pada, [[angka(pc.n), "beranda.ds.l.pengembang"], [angka(pc.pangsa, { desimal: 1 }) + "%", "beranda.ds.l.bumn", 1], [angka(pc.pipa), "beranda.ds.l.pipa", 1]], pc.svg, sm("pengembang", pro.dibangun_pada)),
      kartu("regulasi", 3, "/regulasi", reg.dibangun_pada, [[angka(reg.baris.length), "beranda.ds.l.reg"], [angka(reg.baris.filter((r) => r.status === "berlaku").length), "beranda.ds.l.berlaku"], [angka(reg.baris.filter((r) => r.status !== "berlaku").length), "beranda.ds.l.ubahcabut"]], baru, sm("regulasi", reg.dibangun_pada)),
      kartu("rantai", 4, "/rantai", rantai.dibangun_pada, [[angka(rr.pabrikan), "beranda.ds.l.pabrikan"], [angka(rr.total_mwp / 1000, { desimal: 1 }), "beranda.ds.l.gwp"], [tkdn == null ? "-" : angka(tkdn, { desimal: 1 }) + "%", "beranda.ds.l.tkdn", 1]],
        `<div class="jm-ds-pasar"><span class="jm-ds-ps">${ikon("rantai", 16)}<span>${esc(t("beranda.ds.l.lokal"))}</span><b>${esc(angka(rr.lokal_mwp))}</b><small>MWp</small></span><span class="jm-ds-ps">${ikon("asean", 16)}<span>${esc(t("beranda.ds.l.ekspor"))}</span><b>${esc(angka(rr.ekspor_mwp))}</b><small>MWp</small></span></div>${rangking(topPab.map((p) => ({ nama: p.nama.replace(/^PT\.?\s+/i, ""), pil: label("rt.pasar.", p.pasar), nilai: angka(p.mwp), unit: "MWp", frac: p.mwp / topPab[0].mwp })))}`, t("beranda.ds.rantai.s", { tanggal: tanggal(rantai.sumber.tanggal) })),
      kartu("wilayah", 5, "/wilayah", wil.dibangun_pada, [[angka(wil.baris.length), "beranda.ds.l.prov"], [angka(jml(wil.baris, (w) => w.terpasang_mw?.nilai)), "beranda.ds.l.terpasang"], [re.length ? angka(jml(re, (x) => x) / re.length, { desimal: 1 }) + "%" : "-", "beranda.ds.l.rasio", 1]],
        rangking(top5.map((w) => ({ nama: w.nama, logo: w.kode ? `/img/provinsi/${w.kode}.png` : "", href: w.kode ? `/wilayah/${w.kode}` : "", nilai: angka(w.terpasang_mw.nilai), unit: "MW", frac: w.terpasang_mw.nilai / mw5 }))), sm("wilayah", wil.dibangun_pada)),
      kartu("pustaka", 1, "/direktori?tampil=pustaka", pus.dibangun_pada, [[angka(pus.baris.length), "beranda.ds.l.dok"], [angka(orang.baris.length), "beranda.ds.l.pakar"], [angka(ber.baris.length), "beranda.ds.l.berita"]], doc, sm("pustaka", pus.dibangun_pada)),
    ].join("");
  } catch (e) { sembunyi(el, e); }
}
