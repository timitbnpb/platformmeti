/* /lelang tab Pemenang dan peserta: liga pemenang (logo, bendera), jumlah peserta per putaran, DPT PLN. */
import { t } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { exHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { logoOrg } from "/inti/logo_org.js";
import { batangSvg, legendaHtml, tabel, tipHtml } from "/info_hijau.js";
import { D, baris, num, kosong, orgHtml, namaNegara, sumberSel, tglTeks, labelTek, cariSumber } from "/lelang_umum.js";

const $ = (id) => document.getElementById(id);
const kunci = (o) => o.org_id || o.nama;

function liga() {
  const m = new Map();
  const ambil = (o) => m.get(kunci(o)) || (m.set(kunci(o), { o, menang: [], ikut: [] }), m.get(kunci(o)));
  for (const p of baris()) {
    for (const o of p.pemenang) ambil(o).menang.push(p);
    for (const o of p.peserta) { const r = ambil(o); if (!p.pemenang.some((x) => kunci(x) === kunci(o))) r.ikut.push(p); }
  }
  return [...m.values()].sort((a, b) => b.menang.length - a.menang.length || b.ikut.length - a.ikut.length || a.o.nama.localeCompare(b.o.nama, "id"));
}
const logoUrl = (o) => { const u = logoOrg(o.org_id, o.nama, "")[0]; return u && u.startsWith("/img/") ? u : ""; };

export async function mulai(panel) {
  const L = liga(), B = baris(), ex = (o) => exHtml({ ...o, aksiHtml: aksiHtml({ csv: !!o.csv }), tingkat: "h2" });
  const pesertaRows = B.filter((p) => p.peserta_jumlah != null).sort((a, b) => b.peserta_jumlah - a.peserta_jumlah);
  const dpt = D.lel.dpt || [], terbanyak = L[0], aktif = L.filter((r) => r.menang.length || r.ikut.length);
  panel.innerHTML = [
    ex({ id: "pm-liga", ikon: "piala", topik: t("lel.ey.liga"), judulHtml: terbanyak ? hlHtml("lel.t.liga", terbanyak.o.nama, { n: terbanyak.menang.length }) : esc(t("lel.ey.liga")), subHtml: esc(t("lel.s.liga")), csv: true,
      isiHtml: `${legendaHtml([{ kelas: "lel-s-menang", label: t("lel.tip.menang") }, { kelas: "lel-s-ikut", label: t("lel.tip.ikut") }])}<div id="pm-g-liga" class="ih-bagan"></div><div id="pm-tb" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("lel.n.liga"))}</p>` }),
    ex({ id: "pm-peserta", ikon: "orang", topik: t("lel.ey.peserta"), judulHtml: hlHtml("lel.t.peserta", pesertaRows[0] ? num(pesertaRows[0].peserta_jumlah) : "-"), subHtml: esc(t("lel.s.peserta")),
      isiHtml: `<div id="pm-g-peserta" class="ih-bagan"></div><p class="jm-bantu ih-catatan">${esc(t("lel.n.peserta"))}</p>` }),
    ex({ id: "pm-dpt", ikon: "daftar2", topik: t("lel.ey.dpt"), judulHtml: hlHtml("lel.t.dpt", String(dpt.length)), subHtml: esc(t("lel.s.dpt")), csv: true,
      isiHtml: `<div id="pm-dpt-tb" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("lel.n.dpt"))}</p>` }),
  ].join("");

  $("pm-g-liga").innerHTML = batangSvg({ el: $("pm-g-liga"), d: 0, label: t("lel.ey.liga"), satuan: t("lel.tip.putaran"), seri: [{ k: "menang", kelas: "lel-s-menang" }, { k: "ikut", kelas: "lel-s-ikut" }],
    baris: aktif.slice(0, 10).map((r) => ({ label: r.o.nama.replace(/^PT\.?\s+/, ""), logo: logoUrl(r.o), bendera: logoUrl(r.o) ? "" : r.o.negara, ikon: logoUrl(r.o) || r.o.negara ? "" : "gedung",
      tip: `${r.o.nama}: ${r.menang.length}`,
      th: tipHtml(r.o.nama, [[t("lel.tip.menang"), String(r.menang.length)], [t("lel.tip.ikut"), String(r.ikut.length)], ...r.menang.slice(0, 4).map((p) => [tglTeks(p.tanggal).slice(-4), p.nama.slice(0, 44)]), [t("lel.tip.negara"), r.o.negara ? namaNegara(r.o.negara) : t("lel.tak_diketahui")]], { img: r.o.negara ? `/img/bendera/${r.o.negara}.svg` : "" }),
      bagian: [{ k: "menang", nilai: r.menang.length }, { k: "ikut", nilai: r.ikut.length }] })) });

  tabel($("pm-tb"), { satuan: "lel.u.pemain", per: 8, urutAwal: 2, menurun: true, kolom: [
    { label: t("lel.c.organisasi"), v: (r) => r.o.nama, f: (r) => orgHtml(r.o) },
    { label: t("lel.c.negara"), v: (r) => (r.o.negara ? namaNegara(r.o.negara) : ""), f: (r) => (r.o.negara ? esc(namaNegara(r.o.negara)) : kosong) },
    { label: t("lel.c.menang"), num: true, v: (r) => r.menang.length, f: (r) => `<b>${num(r.menang.length)}</b>` },
    { label: t("lel.c.ikut"), num: true, v: (r) => r.ikut.length, f: (r) => num(r.ikut.length) },
    { label: t("lel.c.putaran"), v: (r) => r.menang[0]?.nama || r.ikut[0]?.nama || "", f: (r) => { const s = [...r.menang, ...r.ikut]; return `<ul class="lel-daftar">${s.slice(0, 3).map((p) => `<li>${esc(p.nama)}</li>`).join("")}${s.length > 3 ? `<li><small>+${s.length - 3}</small></li>` : ""}</ul>`; } },
  ], baris: aktif });
  $("pm-liga").addEventListener("jm:csv", (e) => { e.detail.baris = [["organisasi", "negara", "putaran_dimenangkan", "putaran_diikuti", "putaran"], ...aktif.map((r) => [r.o.nama, r.o.negara || "", r.menang.length, r.ikut.length, [...r.menang, ...r.ikut].map((p) => p.nama).join(" | ")])]; });

  $("pm-g-peserta").innerHTML = pesertaRows.length ? batangSvg({ el: $("pm-g-peserta"), d: 0, label: t("lel.ey.peserta"), satuan: t("lel.tip.peserta"), seri: [{ k: "n", kelas: "lel-s-ikut" }],
    baris: pesertaRows.map((p) => ({ label: p.nama.slice(0, 44), ikon: "orang", tip: `${p.nama}: ${p.peserta_jumlah}`,
      th: tipHtml(p.nama, [[t("lel.tip.peserta"), String(p.peserta_jumlah)], [t("lel.c.tahap"), t("lel.tahap." + p.tahap)], [t("lel.c.tek"), labelTek(p.teknologi)]]), bagian: [{ k: "n", nilai: p.peserta_jumlah }] })) }) : `<p class="jm-kosong">${esc(t("lel.kosong"))}</p>`;

  tabel($("pm-dpt-tb"), { satuan: "lel.u.dpt", per: 5, urutAwal: 0, menurun: true, kolom: [
    { label: t("lel.c.tahun"), num: true, v: (d) => d.tahun, f: (d) => `<b>${d.tahun}</b>` },
    { label: t("lel.c.dpt"), v: (d) => d.nama, f: (d) => `<div class="lel-nm"><b>${esc(d.nama)}</b><span class="lel-mt">${ikon(d.jenis === "tanah" ? "lokasi" : "daftar2", 14)}<span>${esc(t("lel.dpt." + d.jenis))}</span></span></div>` },
    { label: t("lel.c.jumlah"), num: true, v: (d) => d.jumlah, f: (d) => (d.jumlah != null ? `<b>${num(d.jumlah)}</b>` : kosong) },
    { label: t("lel.c.syarat"), v: (d) => d.teks, f: (d) => `<p class="lel-teks">${esc(d.teks)}</p>${d.catatan ? `<small>${esc(d.catatan)}</small>` : ""}` },
    { label: t("lel.c.sumber"), v: (d) => cariSumber(d.sumber_id)?.penerbit || "", f: (d) => sumberSel(d.sumber_id, d.tingkat_bukti) },
  ], baris: dpt });
  $("pm-dpt").addEventListener("jm:csv", (e) => { e.detail.baris = [["tahun", "nama", "jenis", "jumlah", "keterangan", "tingkat_bukti", "sumber", "url"], ...dpt.map((d) => [d.tahun, d.nama, d.jenis, d.jumlah ?? "", d.teks, d.tingkat_bukti, cariSumber(d.sumber_id)?.penerbit || "", cariSumber(d.sumber_id)?.url || ""])]; });
}
