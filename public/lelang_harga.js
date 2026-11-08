/* /lelang tab Harga vs patokan: patokan tertinggi Perpres 112/2022 per teknologi dan kapasitas, serta harga PPA/tawar putaran yang publik dibandingkan dengan patokannya. */
import { t } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { exHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { batangSvg, legendaHtml, tabel, tipHtml, pilUbah } from "/info_hijau.js";
import { D, baris, num, kosong, labelTek, kapTeks, pilTeknologi, regTaut, sumberSel, cariSumber } from "/lelang_umum.js";
import { patokanSen, selisihPersen, usdPerMwh } from "/lelang_hitung.js";

const $ = (id) => document.getElementById(id);
const IKT = { surya: "tek-surya", "panas-bumi": "tek-panas", bayu: "tek-listrik", hidro: "tek-listrik" };
const TEK_PATOKAN = [["surya", "surya"], ["bayu", "bayu"], ["hidro", "hidro"], ["panas_bumi", "panas-bumi"]];

function tingkatBaris() {
  const hp = D.pel?.harga_patokan?.teknologi || {}, F = D.pel?.harga_patokan?.faktor_lokasi || [], fMaks = Math.max(...F.map((x) => x.F), 1);
  return TEK_PATOKAN.flatMap(([kunci, tek]) => (hp[kunci]?.tingkat || []).map((x) => ({ tek, kapasitas: x.kapasitas, koef: x.koef_1_10, t11: x.tahun_11_dst, fMaks })));
}
const hargaBaris = () => baris().filter((p) => p.harga);
function banding(p) {
  const pat = patokanSen(D.pel, p.teknologi, p.kapasitas_mw, p.lokasi.kode_bps[0]);
  return { p, pat, selisih: pat ? selisihPersen(p.harga.usd_sen_kwh, pat.sen) : null };
}

export async function mulai(panel) {
  const ex = (o) => exHtml({ ...o, aksiHtml: aksiHtml({ csv: !!o.csv }), tingkat: "h2" });
  const T = tingkatBaris(), H = hargaBaris().map(banding), B = baris(), adaPat = !!D.pel?.harga_patokan;
  const pertama = H.find((x) => x.selisih != null);
  panel.innerHTML = [
    ex({ id: "hg-banding", ikon: "tag", topik: t("lel.ey.banding"), judulHtml: pertama ? hlHtml("lel.t.banding", `${pertama.selisih > 0 ? "+" : ""}${num(pertama.selisih, 1)}%`, { nama: pertama.p.nama.split(" (")[0] }) : esc(t("lel.t.banding_kosong")), subHtml: esc(t("lel.s.banding", { n: H.length, m: B.length })), csv: true,
      isiHtml: `${legendaHtml([{ kelas: "lel-s-harga", label: t("lel.tip.harga") }, { kelas: "lel-s-patokan", label: t("lel.tip.patokan") }])}<div id="hg-g-banding" class="ih-bagan"></div><div id="hg-tb" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("lel.n.banding"))}</p>` }),
    ex({ id: "hg-patokan", ikon: "kalkulator", topik: t("lel.ey.patokan"), judulHtml: hlHtml("lel.t.patokan", String(T.length)), subHtml: esc(t("lel.s.patokan")),
      isiHtml: adaPat ? `<div id="hg-g-patokan" class="ih-bagan"></div><p class="jm-bantu ih-catatan">${esc(t("lel.n.patokan"))} ${regTaut(["perpres-112-2022"])}</p>` : `<p class="jm-kosong">${esc(t("lel.kosong"))}</p>` }),
    ex({ id: "hg-celah", ikon: "peringatan", topik: t("lel.ey.celah"), judulHtml: esc(t("lel.t.celah")), subHtml: esc(t("lel.s.celah")),
      isiHtml: `<ul class="ih-celah">${(D.lel.meta.celah || []).map((c) => `<li class="ih-celah-k"><span class="jm-kpi-ik">${ikon("peringatan", 18)}</span><div><p>${esc(c)}</p></div></li>`).join("")}</ul>` }),
  ].join("");

  const bar = [];
  for (const x of H) {
    bar.push({ label: x.p.nama.split(" (")[0].slice(0, 40), ikon: "tag", bagian: [{ k: "harga", nilai: x.p.harga.usd_sen_kwh }], tip: `${x.p.nama}: ${x.p.harga.usd_sen_kwh}`,
      th: tipHtml(x.p.nama, [[t("lel.tip.harga"), `${num(x.p.harga.usd_sen_kwh, 4)} ${t("lel.u.sen")}`], [t("lel.tip.usd_mwh"), num(usdPerMwh(x.p.harga.usd_sen_kwh), 2)], [t("lel.tip.jenis"), t("lel.harga." + x.p.harga.jenis)]]) });
    if (x.pat) bar.push({ label: t("lel.tip.patokan_baris", { tek: labelTek(x.p.teknologi) }), ikon: "kalkulator", bagian: [{ k: "patokan", nilai: x.pat.sen }], tip: `${x.pat.sen}`,
      th: tipHtml(t("lel.tip.patokan"), [[t("lel.tip.koef"), num(x.pat.koef, 2)], [t("lel.tip.f"), num(x.pat.F, 2)], [t("lel.tip.patokan"), `${num(x.pat.sen, 2)} ${t("lel.u.sen")}`], [t("lel.tip.kapasitas"), x.pat.kapasitas], [t("lel.tip.selisih"), x.selisih == null ? "-" : `${num(x.selisih, 1)}%`]]) });
  }
  $("hg-g-banding").innerHTML = bar.length ? batangSvg({ el: $("hg-g-banding"), d: 2, label: t("lel.ey.banding"), satuan: t("lel.u.sen"), seri: [{ k: "harga", kelas: "lel-s-harga" }, { k: "patokan", kelas: "lel-s-patokan" }], baris: bar }) : `<p class="jm-kosong">${esc(t("lel.kosong_harga"))}</p>`;

  if (H.length) tabel($("hg-tb"), { satuan: "lel.u.putaran", per: 6, urutAwal: 0, menurun: false, kolom: [
    { label: t("lel.c.putaran"), v: (x) => x.p.nama, f: (x) => `<b>${esc(x.p.nama)}</b>` },
    { label: t("lel.c.tek"), v: (x) => x.p.teknologi, f: (x) => pilTeknologi(x.p.teknologi) },
    { label: t("lel.c.kap"), num: true, v: (x) => x.p.kapasitas_mw, f: (x) => esc(kapTeks(x.p)) || kosong },
    { label: t("lel.c.harga"), num: true, v: (x) => x.p.harga.usd_sen_kwh, f: (x) => `<span class="lel-nl"><b>${num(x.p.harga.usd_sen_kwh, 4)} ${esc(t("lel.u.sen"))}</b><small>${num(usdPerMwh(x.p.harga.usd_sen_kwh), 2)} ${esc(t("lel.u.usd_mwh"))}</small></span>` },
    { label: t("lel.c.patokan"), num: true, v: (x) => x.pat?.sen ?? null, f: (x) => (x.pat ? `<span class="lel-nl"><b>${num(x.pat.sen, 2)} ${esc(t("lel.u.sen"))}</b><small>${esc(t("lel.patokan_rinci", { koef: num(x.pat.koef, 2), f: num(x.pat.F, 2), kap: x.pat.kapasitas }))}</small></span>` : kosong) },
    { label: t("lel.c.selisih"), num: true, v: (x) => x.selisih, f: (x) => pilUbah(x.selisih) },
    { label: t("lel.c.sumber"), v: (x) => cariSumber(x.p.harga.sumber_id)?.penerbit || "", f: (x) => sumberSel(x.p.harga.sumber_id, x.p.tingkat_bukti) },
  ], baris: H });
  else $("hg-tb").innerHTML = "";
  $("hg-banding").addEventListener("jm:csv", (e) => { e.detail.baris = [["putaran", "teknologi", "kapasitas_mw", "harga_sen_usd_kwh", "jenis_harga", "patokan_sen_usd_kwh", "koefisien", "faktor_lokasi", "selisih_persen", "sumber", "url"], ...H.map((x) => [x.p.nama, x.p.teknologi, x.p.kapasitas_mw ?? "", x.p.harga.usd_sen_kwh, x.p.harga.jenis, x.pat?.sen ?? "", x.pat?.koef ?? "", x.pat?.F ?? "", x.selisih == null ? "" : Math.round(x.selisih * 10) / 10, cariSumber(x.p.harga.sumber_id)?.penerbit || "", cariSumber(x.p.harga.sumber_id)?.url || ""])]; });

  if (adaPat) $("hg-g-patokan").innerHTML = batangSvg({ el: $("hg-g-patokan"), d: 2, label: t("lel.ey.patokan"), satuan: t("lel.u.sen"), seri: ["surya", "bayu", "hidro", "panas-bumi"].map((k) => ({ k, kelas: "lel-s-" + k })),
    baris: T.map((x) => ({ label: `${labelTek(x.tek)} ${x.kapasitas}`, ikon: IKT[x.tek] || "petir", tip: `${labelTek(x.tek)} ${x.kapasitas}: ${x.koef}`,
      th: tipHtml(`${labelTek(x.tek)} ${x.kapasitas}`, [[t("lel.tip.th1_10"), `${num(x.koef, 2)} ${t("lel.u.sen")}`], [t("lel.tip.th11"), `${num(x.t11, 2)} ${t("lel.u.sen")}`], [t("lel.tip.fmaks"), `${num(x.koef * x.fMaks, 2)} ${t("lel.u.sen")}`]]),
      bagian: [{ k: x.tek, nilai: x.koef }] })) });
}
