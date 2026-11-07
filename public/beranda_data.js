/* Enam kartu dataset di beranda: semua angka dihitung dari public/data/*.json; grafik SVG/CSS polos. */
import { t, angka, tanggal } from "/i18n.js";
import { esc } from "/inti/umum.js";
import { sumberHtml, unduhRegHtml } from "/inti/komponen.js";
import { penerbitHtml } from "/penerbit.js";
import { muat, label, namaRegulasi, sembunyi } from "/publik.js";

import { LOGO_ORG, LOGO_NAMA } from "/inti/logo_org.js";
export { LOGO_ORG };
const BUMN = /^(PLN|Indonesia Power|Pembangkitan Jawa Bali|Inalum|Jasa Tirta)/i;
const jml = (a, f) => a.reduce((s, x) => s + (f(x) || 0), 0);
const sat = (p) => p.kapasitas?.[0]?.nilai || 0;
const st = (p) => p.status?.[0]?.nilai;
const inisial = (n) => String(n).split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

function pemilik(nilai) {
  let n = String(nilai).replace(/\s*\(IPP\)/i, "").replace(/^PT\.?\s+/i, "").trim();
  if (/^(SH-)?PLN$/i.test(n)) n = "PLN";
  if (n === "PLN IP") n = "Indonesia Power";
  return n;
}

const kartu = (kunci, w, href, tgl, stat, viz, sumberTeks) => `<article class="jm-ds jm-w${w}">
  <header class="jm-ds-kep"><span class="jm-ds-eb">${esc(t("beranda.ds." + kunci + ".k"))}</span>${sumberHtml(esc(sumberTeks))}</header>
  <h3>${esc(t("beranda.ds." + kunci + ".j"))}</h3><p>${esc(t("beranda.ds." + kunci + ".d"))}</p>
  <dl class="jm-ds-stat">${stat.map(([n, l, est]) => `<div><dd class="jm-ds-n">${esc(n)}</dd><dt>${esc(t(l))}${est ? ` <span class="jm-pil jm-pil-est">EST</span>` : ""}</dt></div>`).join("")}</dl>
  <div class="jm-ds-viz">${viz}</div>
  <footer class="jm-ds-kaki"><span>${esc(t("beranda.ds.diperbarui", { tanggal: tanggal(tgl) }))}</span><a class="jm-lihat" href="${href}">${esc(t("beranda.ds.buka"))} &rarr;</a></footer></article>`;

/** Baris peringkat: nomor bulat, nama + pil, batang tipis, nilai tabular di kanan. items: {nama, pil, nilai, unit, frac} */
const rangking = (items) => `<ol class="jm-rank">${items.map((o, i) => `<li class="jm-rank-i"><span class="jm-rank-no">${i + 1}</span><span class="jm-rank-t"><strong title="${esc(o.nama)}">${o.href ? `<a href="${esc(o.href)}">${esc(o.nama)}</a>` : esc(o.nama)}</strong>${o.aksi || ""}${o.pil ? `<small><span class="jm-pil">${esc(o.pil)}</span></small>` : ""}</span><span class="jm-rank-v"><b>${esc(o.nilai)}</b>${o.unit ? ` <small>${esc(o.unit)}</small>` : ""}</span></li>`).join("")}</ol>`;

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
  const semua = [...per.values()], top = semua.filter((d) => d.bangun + d.rencana > 0).sort((a, b) => b.bangun + b.rencana - a.bangun - a.rencana).slice(0, 10);
  const mx = Math.max(1, ...top.map((d) => d.bangun + d.rencana));
  const baris = top.map((d) => {
    const lg = logoPemilik(d.k, idx), b = (d.bangun / mx) * 100, r = (d.rencana / mx) * 100;
    return `<li class="jm-pm"><span class="jm-pm-lg">${lg ? `<img src="${esc(lg)}" width="24" height="24" alt="" loading="lazy" data-ini="${esc(inisial(d.k))}">` : `<span class="jm-pm-ini" aria-hidden="true">${esc(inisial(d.k))}</span>`}</span><span class="jm-pm-n" title="${esc(d.k)}">${esc(d.k)}</span>
      <svg class="jm-pm-bar" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true"><rect class="jm-pm-b" width="${b.toFixed(2)}" height="8"/><rect class="jm-pm-r" x="${b.toFixed(2)}" width="${r.toFixed(2)}" height="8"/></svg>
      <span class="jm-pm-v"><b>${esc(angka(d.bangun + d.rencana))}</b> <small>MW</small></span></li>`;
  }).join("");
  const svg = `<div class="jm-pm-leg"><span><i class="jm-pm-kb"></i>${esc(t("beranda.ds.pengembang.x"))}</span><span><i class="jm-pm-kr"></i>${esc(t("beranda.ds.pengembang.y"))}</span></div><ol class="jm-pm-daftar" aria-label="${esc(t("beranda.ds.pengembang.aria"))}">${baris}</ol>`;
  const total = jml(semua, (d) => d.bangun + d.rencana), bumn = jml(semua.filter((d) => BUMN.test(d.k)), (d) => d.bangun + d.rencana);
  return { n: semua.length, pangsa: total ? (bumn / total) * 100 : 0, pipa: jml(semua, (d) => d.rencana + (d.bangun)), svg };
}

export async function gambarDataset(R) {
  const el = document.getElementById("dataset");
  try {
    const [pro, org, reg, rantai, wil, pus, orang, ber] = await Promise.all(["proyek", "organisasi", "regulasi", "rantai_plts", "wilayah", "pustaka", "orang", "berita"].map(muat));
    const tahun = +String(pro.dibangun_pada).slice(0, 4);
    const kap = R.kartu.find((k) => k.kode === "kapasitas")?.nilai;
    const lewat = pro.baris.filter((p) => st(p) !== "beroperasi" && p.cod_target?.length && Math.min(...p.cod_target.map((c) => c.nilai)) < tahun).length;
    const urut7 = [...pro.baris].sort((a, b) => sat(b) - sat(a)).slice(0, 7);
    const top7 = rangking(urut7.map((p) => ({ nama: p.nama, href: "/p/" + p.id, pil: label("beranda.tek.", p.teknologi), nilai: angka(sat(p)), unit: p.kapasitas[0].satuan, frac: sat(p) / sat(urut7[0]) })));
    const pc = pencar(pro.baris, org.baris);
    const baru = `<ol class="jm-rb">${[...reg.baris].filter((r) => r.tanggal_ditetapkan).sort((a, b) => String(b.tanggal_ditetapkan).localeCompare(String(a.tanggal_ditetapkan))).slice(0, 7).map((r) => `<li class="jm-rb-i">${penerbitHtml(r.instansi_penerbit, 28).replace(/<span class="jm-pen-pendek">.*?<\/span>/, "")}<a class="jm-rb-t" href="/regulasi?id=${encodeURIComponent(r.id)}"><b>${esc(namaRegulasi(r))}</b><small title="${esc(r.judul || "")}">${esc(r.judul || "")}</small></a><span class="jm-rb-tgl">${esc(tanggal(r.tanggal_ditetapkan))}</span>${unduhRegHtml(r)}</li>`).join("")}</ol>`;
    const topPab = [...rantai.pabrikan].sort((a, b) => b.mwp - a.mwp).slice(0, 4), rr = rantai.ringkas, tk = rantai.pabrikan.filter((x) => x.tkdn != null), tkdn = tk.length ? jml(tk, (x) => x.tkdn) / tk.length : null;
    const top5 = [...wil.baris].filter((w) => w.terpasang_mw?.nilai != null).sort((a, b) => b.terpasang_mw.nilai - a.terpasang_mw.nilai).slice(0, 5), mw5 = top5[0]?.terpasang_mw.nilai || 1;
    const re = wil.baris.map((w) => w.rasio_elektrifikasi?.nilai).filter(Number.isFinite);
    const doc = rangking([...pus.baris].sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal))).slice(0, 5).map((d) => ({ nama: d.judul, nilai: tanggal(d.tanggal) })));
    const sm = (k, p) => t("beranda.ds." + k + ".s", { tanggal: tanggal(p) });
    el.innerHTML = [
      kartu("proyek", 1, "/proyek", pro.dibangun_pada, [[angka(pro.baris.length), "beranda.ds.l.proyek"], [angka(kap), "beranda.ds.l.mw", 1], [angka(lewat), "beranda.ds.l.cod", 1]], top7, sm("proyek", pro.dibangun_pada)),
      kartu("pengembang", 2, "/direktori?tampil=lembaga", pro.dibangun_pada, [[angka(pc.n), "beranda.ds.l.pengembang"], [angka(pc.pangsa, { desimal: 1 }) + "%", "beranda.ds.l.bumn", 1], [angka(pc.pipa), "beranda.ds.l.pipa", 1]], pc.svg, sm("pengembang", pro.dibangun_pada)),
      kartu("regulasi", 3, "/regulasi", reg.dibangun_pada, [[angka(reg.baris.length), "beranda.ds.l.reg"], [angka(reg.baris.filter((r) => r.status === "berlaku").length), "beranda.ds.l.berlaku"], [angka(reg.baris.filter((r) => r.status !== "berlaku").length), "beranda.ds.l.ubahcabut"]], baru, sm("regulasi", reg.dibangun_pada)),
      kartu("rantai", 4, "/rantai", rantai.dibangun_pada, [[angka(rr.pabrikan), "beranda.ds.l.pabrikan"], [angka(rr.total_mwp / 1000, { desimal: 1 }), "beranda.ds.l.gwp"], [tkdn == null ? "-" : angka(tkdn, { desimal: 1 }) + "%", "beranda.ds.l.tkdn", 1]],
        `<div class="jm-ds-baris"><span>${esc(t("beranda.ds.l.lokal"))}</span><span>${esc(angka(rr.lokal_mwp))} MWp</span></div>${bar(rr.lokal_mwp / rr.total_mwp, 4)}<div class="jm-ds-baris"><span>${esc(t("beranda.ds.l.ekspor"))}</span><span>${esc(angka(rr.ekspor_mwp))} MWp</span></div>${bar(rr.ekspor_mwp / rr.total_mwp, 5)}${rangking(topPab.map((p) => ({ nama: p.nama.replace(/^PT\.?\s+/i, ""), pil: label("rt.pasar.", p.pasar), nilai: angka(p.mwp), unit: "MWp", frac: p.mwp / topPab[0].mwp })))}`, t("beranda.ds.rantai.s", { tanggal: tanggal(rantai.sumber.tanggal) })),
      kartu("wilayah", 5, "/wilayah", wil.dibangun_pada, [[angka(wil.baris.length), "beranda.ds.l.prov"], [angka(jml(wil.baris, (w) => w.terpasang_mw?.nilai)), "beranda.ds.l.terpasang"], [re.length ? angka(jml(re, (x) => x) / re.length, { desimal: 1 }) + "%" : "-", "beranda.ds.l.rasio", 1]],
        rangking(top5.map((w) => ({ nama: w.nama, nilai: angka(w.terpasang_mw.nilai), unit: "MW", frac: w.terpasang_mw.nilai / mw5 }))), sm("wilayah", wil.dibangun_pada)),
      kartu("pustaka", 1, "/direktori?tampil=pustaka", pus.dibangun_pada, [[angka(pus.baris.length), "beranda.ds.l.dok"], [angka(orang.baris.length), "beranda.ds.l.pakar"], [angka(ber.baris.length), "beranda.ds.l.berita"]], doc, sm("pustaka", pus.dibangun_pada)),
    ].join("");
  } catch (e) { sembunyi(el, e); }
}
