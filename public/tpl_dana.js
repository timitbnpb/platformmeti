/* /transisi-pltu, tab Pendanaan: JETP (angka bersumber, transisi_pltu.json#pendanaan), portofolio JETP (jetp_cipp.json), riwayat pembiayaan PLTU batubara (global/pembiayaan_luar.json, basis data PPI). */
import { B, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, kolomSvg, tipHtml, kosongTab, catatan, pilJenis, luar } from "/tpl_umum.js";

const BARA = () => (B.biaya?.baris || []).filter((b) => b.teknologi === "batubara" && b.nilai_usd_juta);
function kartu() {
  return B.tp.pendanaan.angka.map((a) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon("kartu", 22)}<b class="tpl-angka">${a.nilai == null ? "-" : esc(num(a.nilai, a.nilai % 1 ? 1 : 0))} <small>${esc(a.satuan)}</small></b></div><p>${esc(tx(a.label))}</p><p class="jm-bantu">${esc(tx(a.catatan))}</p>${buktiS(a.sumber_id, a.tingkat_bukti)}</div>`).join("");
}
function portofolio() {
  const el = document.getElementById("tpl-d-jetp"); if (!el) return;
  tabel(el, { satuan: "tpl.u.baris", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("tpl.c.nama"), v: (r) => r.nama_id || r.nama, f: (r) => `<b>${esc(r.nama_id || r.nama)}</b>` },
    { label: t("tpl.c.jenis"), v: (r) => r.jenis, f: (r) => pilJenis("tpl.dn.jenis.", r.jenis) },
    { label: t("tpl.c.tek"), v: (r) => r.teknologi || "", f: (r) => (r.teknologi ? esc(r.teknologi.replace(/-/g, " ")) : "-") },
    { label: "MW", num: true, v: (r) => r.kapasitas_mw || 0, f: (r) => (r.kapasitas_mw ? esc(num(r.kapasitas_mw, 0)) : "-") },
    { label: t("tpl.c.status"), v: (r) => r.status, f: (r) => esc(String(r.status || "-").replace(/_/g, " ")) },
    { label: t("tpl.c.bukti"), v: (r) => r.tingkat_bukti, f: (r) => bukti(r.tingkat_bukti, { sumber: "JETP Indonesia", tanggal: r.tanggal }) + " " + luar(r.sumber_url, t("tpl.buka")) },
  ], baris: B.jetp.baris });
}
function riwayat() {
  const g = document.getElementById("tpl-d-riw"); if (!g) return;
  const per = new Map();
  for (const b of BARA()) { const k = Math.floor(b.tahun / 5) * 5; per.set(k, (per.get(k) || 0) + b.nilai_usd_juta / 1000); }
  const ks = [...per.keys()].sort((a, b) => a - b);
  g.innerHTML = kolomSvg({ el: g, satuan: t("tpl.u.miliar_usd"), label: t("tpl.dn.j.riw"), seri: [{ k: "v", kelas: "tpl-s-vol" }], kategori: ks.map((k) => ({ label: `${k}-${String(k + 4).slice(2)}`, nilai: { v: per.get(k) }, tip: `${k}-${k + 4}`, th: tipHtml(`${k}-${k + 4}`, [[t("tpl.dn.nilai"), `US$ ${num(per.get(k), 1)} ${t("tpl.u.miliar")}`], [t("tpl.dn.n"), String(BARA().filter((b) => b.tahun >= k && b.tahun < k + 5).length)]]) })) });
}
function tabRiw() {
  const el = document.getElementById("tpl-d-tab"); if (!el) return;
  tabel(el, { satuan: "tpl.u.proyek", per: 8, urutAwal: 2, menurun: true, kolom: [
    { label: t("tpl.c.nama"), v: (b) => b.nama, f: (b) => `<b>${esc(b.nama)}</b>` },
    { label: t("tpl.c.tahun"), num: true, v: (b) => b.tahun, f: (b) => esc(String(b.tahun)) },
    { label: "MW", num: true, v: (b) => b.kapasitas_mw || 0, f: (b) => (b.kapasitas_mw ? esc(num(b.kapasitas_mw, 0)) : "-") },
    { label: t("tpl.dn.nilai"), num: true, v: (b) => b.nilai_usd_juta, f: (b) => `<b>US$ ${esc(num(b.nilai_usd_juta, 0))}</b> <small class="rg3-catat">${esc(t("tpl.u.juta"))}</small>` },
    { label: t("tpl.dn.pemberi"), v: (b) => b.pemberi || "", f: (b) => `<span class="rg3-teks">${esc(b.pemberi || "-")}</span>` },
  ], baris: BARA() });
}
export function mulai(el) {
  if (!B.tp) { el.innerHTML = kosongTab("tpl.kosong"); return; }
  const tot = BARA().reduce((a, b) => a + b.nilai_usd_juta, 0) / 1000;
  el.innerHTML = [
    ex({ id: "tpl-d-jetpex", ikon: "kartu", topik: t("tpl.dn.ey.jetp"), judulHtml: esc(t("tpl.dn.j.jetp")), subHtml: esc(t("tpl.dn.s.jetp")), isiHtml: `<div class="tpl-kisi">${kartu()}</div>`, kakiHtml: kakiSumber(B.tp.pendanaan.angka.map((a) => a.sumber_id)) + `<span class="tpl-sumber"><a class="rg3-tautan" href="/pendanaan">${esc(t("tpl.dn.lihat"))}</a></span>` }),
    B.jetp ? ex({ id: "tpl-d-portex", ikon: "daftar2", topik: t("tpl.dn.ey.port"), judulHtml: esc(t("tpl.dn.j.port", { n: B.jetp.baris.length })), subHtml: esc(t("tpl.dn.s.port")), isiHtml: `<div id="tpl-d-jetp"></div>${catatan("tpl.dn.n.port")}` }) : "",
    B.biaya ? ex({ id: "tpl-d-riwex", ikon: "grafik", topik: t("tpl.dn.ey.riw"), judulHtml: esc(t("tpl.dn.j.riw_n", { n: num(tot, 0), k: BARA().length })), subHtml: esc(t("tpl.dn.s.riw")), isiHtml: `<div id="tpl-d-riw" class="ih-bagan"></div><div id="tpl-d-tab"></div>${catatan("tpl.dn.n.riw")}` }) : "",
  ].join("");
  portofolio(); riwayat(); tabRiw();
}
