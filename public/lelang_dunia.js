/* /lelang tab Pembanding dunia: hasil lelang EBT negara lain (data/global/lelang_dunia.json) berbendera, dengan putaran Indonesia yang berharga publik sebagai pembanding. */
import { t } from "/i18n.js";
import { esc } from "/inti/umum.js";
import { buktiHtml } from "/inti/bukti.js";
import { exHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { batangSvg, legendaHtml, tabel, tipHtml } from "/info_hijau.js";
import { D, baris, num, kosong, bendera, namaNegara, luar, labelTek, pilTeknologi, tglTeks } from "/lelang_umum.js";
import { usdPerMwh } from "/lelang_hitung.js";

const $ = (id) => document.getElementById(id);
const BEDA_TEK = { "hibrid-surya-bess": "surya", bess: "penyimpanan", "campuran-ebt": "campuran" };
const tekDunia = (k) => BEDA_TEK[k] || (["surya", "bayu", "hidro", "panas-bumi", "bioenergi"].includes(k) ? k : "campuran");
const hargaUsd = (r) => r.harga_terendah?.usd_per_mwh ?? null;
const hargaTeks = (h) => (h ? `${num(h.nilai, h.nilai < 1 ? 4 : 2)} ${h.satuan}` : "");

export async function mulai(panel) {
  const ex = (o) => exHtml({ ...o, aksiHtml: aksiHtml({ csv: !!o.csv }), tingkat: "h2" });
  const R = (D.dun?.baris || []).slice().sort((a, b) => (b.tahun || 0) - (a.tahun || 0)), negara = new Set(R.map((r) => r.iso2));
  const ina = baris().filter((p) => p.harga);
  if (!R.length) { panel.innerHTML = `<p class="jm-kosong">${esc(t("lel.kosong"))}</p>`; return; }
  const bersatuan = R.filter((r) => hargaUsd(r) != null);
  panel.innerHTML = [
    ex({ id: "dn-harga", ikon: "tag", topik: t("lel.ey.dunia_harga"), judulHtml: hlHtml("lel.t.dunia_harga", String(bersatuan.length + ina.length)), subHtml: esc(t("lel.s.dunia_harga", { n: negara.size })),
      isiHtml: `${legendaHtml([{ kelas: "lel-s-dunia", label: t("lel.tip.dunia") }, { kelas: "lel-s-ina", label: t("lel.tip.indonesia") }])}<div id="dn-g-harga" class="ih-bagan"></div><p class="jm-bantu ih-catatan">${esc(t("lel.n.dunia_harga"))}</p>` }),
    ex({ id: "dn-kap", ikon: "petir", topik: t("lel.ey.dunia_kap"), judulHtml: hlHtml("lel.t.dunia_kap", String(R.filter((r) => r.kapasitas_dimenangkan_mw).length)), subHtml: esc(t("lel.s.dunia_kap")),
      isiHtml: `<div id="dn-g-kap" class="ih-bagan"></div>` }),
    ex({ id: "dn-tabel", ikon: "globe", topik: t("lel.ey.dunia_tabel"), judulHtml: hlHtml("lel.t.dunia_tabel", String(R.length)), subHtml: esc(t("lel.s.dunia_tabel")), csv: true,
      isiHtml: `<div id="dn-tb" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("lel.n.dunia_tabel"))}</p>` }),
  ].join("");

  const bHarga = [
    ...bersatuan.map((r) => ({ label: `${namaNegara(r.iso2)} ${r.nama_lelang.split(":")[1]?.trim().split(" ")[0] || ""}`.trim().slice(0, 40), bendera: r.iso2.toLowerCase(), bagian: [{ k: "dunia", nilai: hargaUsd(r) }],
      tip: `${r.nama_lelang}: ${hargaUsd(r)}`, th: tipHtml(r.nama_lelang, [[t("lel.tip.harga"), hargaTeks(r.harga_terendah)], [t("lel.tip.usd_mwh"), num(hargaUsd(r), 2)], [t("lel.tip.negara"), namaNegara(r.iso2)], [t("lel.c.tahun"), String(r.tahun ?? "-")], [t("lel.tip.badan"), r.badan]], { img: `/img/bendera/${r.iso2.toLowerCase()}.svg` }) })),
    ...ina.map((p) => ({ label: p.nama.split(" (")[0].slice(0, 40), bendera: "id", bagian: [{ k: "ina", nilai: usdPerMwh(p.harga.usd_sen_kwh) }], tip: `${p.nama}: ${usdPerMwh(p.harga.usd_sen_kwh)}`,
      th: tipHtml(p.nama, [[t("lel.tip.harga"), `${num(p.harga.usd_sen_kwh, 4)} ${t("lel.u.sen")}`], [t("lel.tip.usd_mwh"), num(usdPerMwh(p.harga.usd_sen_kwh), 2)], [t("lel.tip.jenis"), t("lel.harga." + p.harga.jenis)]], { img: "/img/bendera/id.svg" }) })),
  ].sort((a, b) => a.bagian[0].nilai - b.bagian[0].nilai);
  $("dn-g-harga").innerHTML = bHarga.length ? batangSvg({ el: $("dn-g-harga"), d: 1, label: t("lel.ey.dunia_harga"), satuan: t("lel.u.usd_mwh"), seri: [{ k: "dunia", kelas: "lel-s-dunia" }, { k: "ina", kelas: "lel-s-ina" }], baris: bHarga }) : `<p class="jm-kosong">${esc(t("lel.kosong"))}</p>`;

  const bKap = R.filter((r) => r.kapasitas_dimenangkan_mw).sort((a, b) => b.kapasitas_dimenangkan_mw - a.kapasitas_dimenangkan_mw).map((r) => ({ label: `${namaNegara(r.iso2)} ${r.tahun ?? ""}`.trim(), bendera: r.iso2.toLowerCase(), bagian: [{ k: "dunia", nilai: r.kapasitas_dimenangkan_mw }], tip: `${r.nama_lelang}: ${r.kapasitas_dimenangkan_mw}`,
    th: tipHtml(r.nama_lelang, [[t("lel.tip.dimenangkan"), `${num(r.kapasitas_dimenangkan_mw)} MW`], ...(r.kapasitas_ditawar_mw ? [[t("lel.tip.ditawar"), `${num(r.kapasitas_ditawar_mw)} MW`]] : []), [t("lel.tip.badan"), r.badan], [t("lel.c.tek"), labelTek(tekDunia(r.teknologi))]], { img: `/img/bendera/${r.iso2.toLowerCase()}.svg` }) }));
  $("dn-g-kap").innerHTML = batangSvg({ el: $("dn-g-kap"), d: 0, label: t("lel.ey.dunia_kap"), satuan: "MW", seri: [{ k: "dunia", kelas: "lel-s-dunia" }], baris: bKap });

  tabel($("dn-tb"), { satuan: "lel.u.lelang", per: 6, urutAwal: 0, menurun: true, kolom: [
    { label: t("lel.c.negara"), v: (r) => namaNegara(r.iso2), f: (r) => `<span class="lel-org">${bendera(r.iso2.toLowerCase(), 18)}<span>${esc(namaNegara(r.iso2))}</span></span>` },
    { label: t("lel.c.lelang"), v: (r) => r.nama_lelang, f: (r) => `<div class="lel-nm"><b>${esc(r.nama_lelang)}</b><small>${esc(r.badan)}${r.tahun ? ", " + r.tahun : ""}</small></div>` },
    { label: t("lel.c.tek"), v: (r) => tekDunia(r.teknologi), f: (r) => pilTeknologi(tekDunia(r.teknologi)) },
    { label: t("lel.c.kap"), num: true, v: (r) => r.kapasitas_dimenangkan_mw ?? r.kapasitas_ditawar_mw ?? null, f: (r) => (r.kapasitas_dimenangkan_mw ? `<b>${num(r.kapasitas_dimenangkan_mw)} MW</b>` : r.kapasitas_ditawar_mw ? `${num(r.kapasitas_ditawar_mw)} MW <small>${esc(t("lel.ditawar"))}</small>` : kosong) },
    { label: t("lel.c.harga_min"), num: true, v: (r) => hargaUsd(r), f: (r) => (r.harga_terendah ? `<span class="lel-nl"><b>${esc(hargaTeks(r.harga_terendah))}</b>${hargaUsd(r) != null ? `<small>${num(hargaUsd(r), 2)} ${esc(t("lel.u.usd_mwh"))}</small>` : ""}</span>` : kosong) },
    { label: t("lel.c.status"), v: (r) => r.status, f: (r) => `<span class="jm-pil">${esc(String(r.status).replace(/-/g, " "))}</span>` },
    { label: t("lel.c.sumber"), v: (r) => r.tingkat_bukti, f: (r) => `<span class="lel-sm">${luar(r.sumber_url, new URL(r.sumber_url).hostname.replace(/^www\./, ""))}${buktiHtml(r.tingkat_bukti, { sumber: new URL(r.sumber_url).hostname, tanggal: r.tanggal })}</span>` },
  ], baris: R });
  $("dn-tabel").addEventListener("jm:csv", (e) => { e.detail.baris = [["negara", "lelang", "badan", "tahun", "teknologi", "dimenangkan_mw", "ditawar_mw", "harga_terendah", "satuan", "usd_per_mwh", "status", "tingkat_bukti", "url"], ...R.map((r) => [namaNegara(r.iso2), r.nama_lelang, r.badan, r.tahun ?? "", r.teknologi, r.kapasitas_dimenangkan_mw ?? "", r.kapasitas_ditawar_mw ?? "", r.harga_terendah?.nilai ?? "", r.harga_terendah?.satuan ?? "", hargaUsd(r) ?? "", r.status, r.tingkat_bukti, r.sumber_url])]; });
}
