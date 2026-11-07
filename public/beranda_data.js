/* Enam kartu dataset di beranda: semua angka dihitung dari public/data/*.json; grafik SVG/CSS polos. */
import { t, angka, tanggal } from "/i18n.js";
import { esc, galatHtml } from "/inti/umum.js";
import { muat, label, namaRegulasi } from "/publik.js";

const LOGO_NAMA = { "Indonesia Power": "pln-indonesia-power", "PLN IP": "pln-indonesia-power" };
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

const kartu = (no, kunci, w, href, tgl, stat, viz, sumberTeks) => `<a class="jm-ds jm-w${w}" href="${href}">
  <div class="jm-ds-kep"><span>${no} ${esc(t("beranda.ds." + kunci + ".k"))}</span><span>${esc(t("beranda.ds.diperbarui", { tanggal: tanggal(tgl) }))}</span></div>
  <h3>${esc(t("beranda.ds." + kunci + ".j"))}</h3><p>${esc(t("beranda.ds." + kunci + ".d"))}</p>
  <dl class="jm-ds-stat">${stat.map(([n, l, est]) => `<div><dd class="jm-ds-n">${esc(n)}</dd><dt>${esc(t(l))}${est ? ` <span class="jm-pil jm-pil-est">EST</span>` : ""}</dt></div>`).join("")}</dl>
  <div class="jm-ds-viz">${viz}</div><small class="jm-sumber">${esc(sumberTeks)}</small></a>`;

const baris = (kiri, kanan) => `<div class="jm-ds-baris"><span>${esc(kiri)}</span><span>${esc(kanan)}</span></div>`;
const bar = (frac, w) => `<svg class="jm-ds-bar jm-w${w}" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true"><rect class="jm-bar-latar" width="100" height="6"/><rect class="jm-bar-isi" width="${Math.max(1, Math.round(frac * 100))}" height="6"/></svg>`;

function pencar(proyek, org) {
  const per = new Map();
  for (const p of proyek) for (const o of p.pihak?.pemilik || []) {
    const k = pemilik(o.nilai), d = per.get(k) || per.set(k, { k, bangun: 0, rencana: 0, n: 0 }).get(k);
    d.n++; const m = sat(p), s = st(p);
    if (s === "beroperasi" || s === "konstruksi") d.bangun += m; else if (s === "rencana") d.rencana += m;
  }
  const semua = [...per.values()], titik = semua.filter((d) => d.bangun + d.rencana > 0).sort((a, b) => b.bangun + b.rencana - a.bangun - a.rencana).slice(0, 8);
  const mx = Math.max(1, ...titik.map((d) => d.bangun)), my = Math.max(1, ...titik.map((d) => d.rencana));
  const dot = titik.map((d) => {
    const x = 30 + (d.bangun / mx) * 240, y = 170 - (d.rencana / my) * 140, slug = LOGO_NAMA[d.k];
    return `<g><title>${esc(d.k)}</title><circle class="jm-sc-dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="15"/>${slug ? `<image href="/img/logo/${slug}.png" x="${(x - 11).toFixed(1)}" y="${(y - 11).toFixed(1)}" width="22" height="22"/>` : `<text class="jm-sc-ini" x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle">${esc(inisial(d.k))}</text>`}</g>`;
  }).join("");
  const svg = `<svg class="jm-sc" viewBox="0 0 300 200" role="img" aria-label="${esc(t("beranda.ds.pengembang.aria"))}"><line class="jm-sc-as" x1="30" y1="170" x2="290" y2="170"/><line class="jm-sc-as" x1="30" y1="10" x2="30" y2="170"/>
    <line class="jm-sc-bagi" x1="160" y1="10" x2="160" y2="170"/><line class="jm-sc-bagi" x1="30" y1="90" x2="290" y2="90"/>
    <text class="jm-sc-sb" x="290" y="190" text-anchor="end">${esc(t("beranda.ds.pengembang.x"))}</text><text class="jm-sc-sb" x="34" y="18">${esc(t("beranda.ds.pengembang.y"))}</text>${dot}</svg>`;
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
    const top7 = [...pro.baris].sort((a, b) => sat(b) - sat(a)).slice(0, 7).map((p) => baris(`${p.nama} (${label("beranda.tek.", p.teknologi)})`, `${angka(sat(p))} ${p.kapasitas[0].satuan}`)).join("");
    const pc = pencar(pro.baris, org.baris);
    const baru = [...reg.baris].filter((r) => r.tanggal_ditetapkan).sort((a, b) => String(b.tanggal_ditetapkan).localeCompare(String(a.tanggal_ditetapkan))).slice(0, 5).map((r) => baris(namaRegulasi(r), tanggal(r.tanggal_ditetapkan))).join("");
    const rr = rantai.ringkas, tk = rantai.pabrikan.filter((x) => x.tkdn != null), tkdn = tk.length ? jml(tk, (x) => x.tkdn) / tk.length : null;
    const top5 = [...wil.baris].filter((w) => w.terpasang_mw?.nilai != null).sort((a, b) => b.terpasang_mw.nilai - a.terpasang_mw.nilai).slice(0, 5), mw5 = top5[0]?.terpasang_mw.nilai || 1;
    const re = wil.baris.map((w) => w.rasio_elektrifikasi?.nilai).filter(Number.isFinite);
    const doc = [...pus.baris].sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal))).slice(0, 3).map((d) => baris(d.judul, d.tanggal)).join("");
    const sm = (k, p) => t("beranda.ds." + k + ".s", { tanggal: tanggal(p) });
    el.innerHTML = [
      kartu("01", "proyek", 1, "/proyek", pro.dibangun_pada, [[angka(pro.baris.length), "beranda.ds.l.proyek"], [angka(kap), "beranda.ds.l.mw", 1], [angka(lewat), "beranda.ds.l.cod", 1]], top7, sm("proyek", pro.dibangun_pada)),
      kartu("02", "pengembang", 2, "/direktori?tampil=lembaga", pro.dibangun_pada, [[angka(pc.n), "beranda.ds.l.pengembang"], [angka(pc.pangsa, { desimal: 1 }) + "%", "beranda.ds.l.bumn", 1], [angka(pc.pipa), "beranda.ds.l.pipa", 1]], pc.svg, sm("pengembang", pro.dibangun_pada)),
      kartu("03", "regulasi", 3, "/regulasi", reg.dibangun_pada, [[angka(reg.baris.length), "beranda.ds.l.reg"], [angka(reg.baris.filter((r) => r.status === "berlaku").length), "beranda.ds.l.berlaku"], [angka(reg.baris.filter((r) => r.status !== "berlaku").length), "beranda.ds.l.ubahcabut"]], baru, sm("regulasi", reg.dibangun_pada)),
      kartu("04", "rantai", 4, "/rantai", rantai.dibangun_pada, [[angka(rr.pabrikan), "beranda.ds.l.pabrikan"], [angka(rr.total_mwp / 1000, { desimal: 1 }), "beranda.ds.l.gwp"], [tkdn == null ? "-" : angka(tkdn, { desimal: 1 }) + "%", "beranda.ds.l.tkdn", 1]],
        `<div class="jm-ds-baris"><span>${esc(t("beranda.ds.l.lokal"))}</span><span>${esc(angka(rr.lokal_mwp))} MWp</span></div>${bar(rr.lokal_mwp / rr.total_mwp, 4)}<div class="jm-ds-baris"><span>${esc(t("beranda.ds.l.ekspor"))}</span><span>${esc(angka(rr.ekspor_mwp))} MWp</span></div>${bar(rr.ekspor_mwp / rr.total_mwp, 5)}`, t("beranda.ds.rantai.s", { tanggal: tanggal(rantai.sumber.tanggal) })),
      kartu("05", "wilayah", 5, "/wilayah", wil.dibangun_pada, [[angka(wil.baris.length), "beranda.ds.l.prov"], [angka(jml(wil.baris, (w) => w.terpasang_mw?.nilai)), "beranda.ds.l.terpasang"], [re.length ? angka(jml(re, (x) => x) / re.length, { desimal: 1 }) + "%" : "-", "beranda.ds.l.rasio", 1]],
        top5.map((w) => baris(w.nama, `${angka(w.terpasang_mw.nilai)} MW`) + bar(w.terpasang_mw.nilai / mw5, 5)).join(""), sm("wilayah", wil.dibangun_pada)),
      kartu("06", "pustaka", 1, "/direktori?tampil=pustaka", pus.dibangun_pada, [[angka(pus.baris.length), "beranda.ds.l.dok"], [angka(orang.baris.length), "beranda.ds.l.pakar"], [angka(ber.baris.length), "beranda.ds.l.berita"]], doc, sm("pustaka", pus.dibangun_pada)),
    ].join("");
  } catch (e) { el.innerHTML = galatHtml("layanan"); }
}
