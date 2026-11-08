/* /sampah-energi, tab Sampah dan TPA: timbulan nasional, porsi terkelola, TPA open dumping, target 2029 (KLH/BPLH, satu angka resmi), sebaran proyek PSEL per provinsi (psel.json). */
import { B, t, ex, num, esc, ikon, tx, buktiS, kakiSumber, tabel, batangSvg, tipHtml, kosongTab, daftarCelah, catatan, tautProvinsi, siapTautan, naikkan, pselRows, pertama, statusDari } from "/swe_umum.js";

function kartu() {
  const T = B.sw.timbulan, tak = T.timbulan.nilai - T.terkelola.nilai;
  const k = (ik, judul, nilai, satuan, ket, sid, tb) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(ik, 22)}<b>${esc(judul)}</b></div><p class="swe-angka">${esc(nilai)} <small>${esc(satuan)}</small></p><p class="jm-bantu">${esc(ket)}</p>${buktiS(sid, tb)}</div>`;
  return [
    k("tabel", t("swe.s.timbulan", { th: T.timbulan.tahun }), num(T.timbulan.nilai, 2), tx(T.timbulan.satuan), tx(T.timbulan.ket), T.timbulan.sumber_id, T.timbulan.tingkat_bukti),
    k("centang", t("swe.s.terkelola"), `${num(T.terkelola.nilai, 2)}`, `${tx(T.terkelola.satuan)} (${num(T.terkelola.persen, 2)}%)`, tx(T.terkelola.ket), T.terkelola.sumber_id, T.terkelola.tingkat_bukti),
    `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon("peringatan", 22)}<b>${esc(t("swe.s.tak"))}</b></div><p class="swe-angka">${esc(num(tak, 2))} <small>${esc(tx(T.timbulan.satuan))}</small></p><p class="jm-bantu">${esc(t("swe.s.tak_ket"))}</p>${buktiS(T.timbulan.sumber_id, "est")}</div>`,
    k("tek-bio", t("swe.s.tpa"), `${num(T.tpa.open_dumping, 0)} / ${num(T.tpa.total, 0)}`, "TPA", tx(T.tpa.ket), T.tpa.sumber_id, T.tpa.tingkat_bukti),
    k("bendera", t("swe.s.target"), String(T.target.tahun), `${num(T.target.persen, 0)}%`, tx(T.target.ket), T.target.sumber_id, T.target.tingkat_bukti),
  ].join("");
}
function perProvinsi() {
  const m = new Map();
  for (const r of pselRows()) {
    const kd = String(r.kode_bps || "").slice(0, 2), a = m.get(kd) || { kode: kd, provinsi: r.provinsi, n: 0, ton: 0, op: 0, bangun: 0 };
    a.n++; a.ton += pertama(r.kapasitas_ton_hari) || 0; if (statusDari(r) === "beroperasi") a.op++; if (statusDari(r) === "konstruksi") a.bangun++;
    m.set(kd, a);
  }
  return [...m.values()];
}
function grafik(baris) {
  const g = document.getElementById("swe-s-grafik"); if (!g) return;
  const top = [...baris].sort((a, b) => b.ton - a.ton).slice(0, 10);
  g.innerHTML = batangSvg({ el: g, d: 0, satuan: t("swe.u.ton_hari"), label: t("swe.s.j.grafik"), seri: [{ k: "v", kelas: "swe-s-ton" }],
    baris: top.map((p) => ({ label: p.provinsi, logo: `/img/provinsi/${p.kode}.png`, tip: p.provinsi, th: tipHtml(p.provinsi, [[t("swe.c.proyek"), num(p.n, 0)], [t("swe.u.ton_hari"), num(p.ton, 0)], [t("swe.st.beroperasi"), num(p.op, 0)], [t("swe.st.konstruksi"), num(p.bangun, 0)]], { img: `/img/provinsi/${p.kode}.png` }), bagian: [{ k: "v", nilai: p.ton }] })) });
}
function tabProv(baris) {
  const el = document.getElementById("swe-s-tab"); if (!el) return;
  tabel(el, { satuan: "swe.u.prov", per: 8, urutAwal: 2, menurun: true, kolom: [
    { label: t("swe.c.provinsi"), v: (r) => r.provinsi, f: (r) => tautProvinsi(r.kode, r.provinsi) },
    { label: t("swe.c.proyek"), num: true, v: (r) => r.n, f: (r) => esc(num(r.n, 0)) },
    { label: t("swe.u.ton_hari"), num: true, v: (r) => r.ton, f: (r) => `<b>${esc(num(r.ton, 0))}</b>` },
    { label: t("swe.st.beroperasi"), num: true, v: (r) => r.op, f: (r) => esc(num(r.op, 0)) },
    { label: t("swe.st.konstruksi"), num: true, v: (r) => r.bangun, f: (r) => esc(num(r.bangun, 0)) },
    { label: t("swe.c.bukti"), v: () => "", f: () => buktiS("ashurst", "media") },
  ], baris });
}
export function mulai(el) {
  if (!B.sw) { el.innerHTML = kosongTab("swe.kosong"); return; }
  const T = B.sw.timbulan, baris = perProvinsi();
  el.innerHTML = [
    ex({ id: "swe-s-angka", ikon: "tabel", topik: t("swe.s.ey.angka"), judulHtml: esc(t("swe.s.j.angka", { n: num(T.tpa.open_dumping, 0), p: num(T.terkelola.persen, 0) })), subHtml: esc(t("swe.s.s.angka")),
      isiHtml: `<div class="rg3-kisi">${kartu()}</div><p class="jm-bantu ih-catatan">${esc(tx(T.catatan_beda))}</p><p class="jm-bantu ih-catatan">${esc(tx(T.revisi.teks))}</p>`, kakiHtml: kakiSumber(["klh-rakornas", "uu18"]) }),
    ex({ id: "swe-s-gr", ikon: "grafik", topik: t("swe.s.ey.grafik"), judulHtml: esc(t("swe.s.j.grafik")), subHtml: esc(t("swe.s.s.grafik")), isiHtml: `<div id="swe-s-grafik"></div>${catatan("swe.s.n.grafik")}` }),
    ex({ id: "swe-s-prov", ikon: "peta", topik: t("swe.s.ey.prov"), judulHtml: esc(t("swe.s.j.prov", { n: num(baris.length, 0) })), subHtml: esc(t("swe.s.s.prov")), isiHtml: `<div id="swe-s-tab"></div>${catatan("swe.s.n.prov")}`, kakiHtml: kakiSumber(["ashurst", "metro109"]) }),
    ex({ id: "swe-s-celah", ikon: "tanya", topik: t("swe.ey.celah"), judulHtml: esc(t("swe.j.celah")), isiHtml: daftarCelah([B.sw.celah[3], B.sw.celah[6], B.sw.celah[8]]) }),
  ].join("");
  grafik(baris); tabProv(baris);
  siapTautan("provinsi").then(() => naikkan(el));
}
