/* /transisi-pltu, tab Pengganti EBT per lokasi: MW EBT setara tiap PLTU = energi PLTU (MW x FK x jam) x bauran / (FK EBT x jam), faktor dari captive_power.json; dibandingkan celah potensi
   provinsi (radar_kabupaten.json: potensi RUEN dikurangi terpasang). Seluruhnya Hipotesis: tanpa baterai, transmisi, lahan. Data: transisi_pltu.json#pengganti. */
import { B, t, ex, num, esc, ikon, bukti, hipotesis, kakiSumber, tabel, batangSvg, tipHtml, legendaHtml, siapTautan, naikkan, kosongTab, catatan, daftarCelah, tautProvinsi, orgSel, pilJenis, pltuById, tx } from "/tpl_umum.js";

const G = () => B.tp.pengganti, TEK = ["surya", "bayu", "firm"];
const nama = (k) => { const p = B.pltu?.dampak?.provinsi?.find((x) => x.kode === k); return p?.nama || k; };
const cukup = (p) => (p.rasio ? TEK.filter((k) => p.rasio[k] >= 1).length : -1);
function grafik() {
  const g = document.getElementById("tpl-g-g"); if (!g) return;
  const top = G().provinsi.slice(0, 10);
  document.getElementById("tpl-g-l").innerHTML = legendaHtml(TEK.map((k) => ({ kelas: "tpl-s-" + k, label: t("tpl.gn.t." + k) })));
  g.innerHTML = batangSvg({ el: g, d: 1, satuan: "GW", label: t("tpl.gn.j.g"), seri: TEK.map((k) => ({ k, kelas: "tpl-s-" + k })),
    baris: top.map((p) => ({ label: nama(p.kode), logo: `/img/provinsi/${p.kode}.png`, tip: nama(p.kode), th: tipHtml(nama(p.kode), [["PLTU MW", num(p.mw, 0)], ...TEK.map((k) => [t("tpl.gn.t." + k), `${num(p.sepadan_mw[k], 0)} MW`])], { img: `/img/provinsi/${p.kode}.png` }), bagian: TEK.map((k) => ({ k, nilai: p.sepadan_mw[k] / 1000 })) })) });
}
function tabProv() {
  const el = document.getElementById("tpl-g-prov"); if (!el) return;
  tabel(el, { satuan: "tpl.u.prov", per: 8, urutAwal: 1, menurun: true, kolom: [
    { label: t("tpl.c.prov"), v: (p) => nama(p.kode), f: (p) => tautProvinsi(p.kode) },
    { label: "PLTU MW", num: true, v: (p) => p.mw, f: (p) => esc(num(p.mw, 0)) },
    ...TEK.map((k) => ({ label: `${t("tpl.gn.t." + k)} MW`, num: true, v: (p) => p.sepadan_mw[k], f: (p) => esc(num(p.sepadan_mw[k], 0)) })),
    { label: t("tpl.gn.celah"), num: true, v: (p) => (p.celah_mw ? p.celah_mw.surya + p.celah_mw.bayu + p.celah_mw.firm : -1), f: (p) => (p.celah_mw ? esc(num(p.celah_mw.surya + p.celah_mw.bayu + p.celah_mw.firm, 0)) : "-") },
    { label: t("tpl.gn.cukup"), v: (p) => cukup(p), f: (p) => { const n = cukup(p); return n < 0 ? "-" : chipCukup(n); } },
  ], baris: G().provinsi });
  siapTautan().then(() => naikkan(el));
}
const chipCukup = (n) => `<span class="rg3-chip ${n === 3 ? "tpl-cukup" : n === 0 ? "tpl-kurang" : "tpl-sebagian"}"><span>${esc(t("tpl.gn.k" + n))}</span></span>`;
function tabPltu() {
  const el = document.getElementById("tpl-g-tab"); if (!el) return;
  tabel(el, { satuan: "tpl.u.pltu", per: 10, urutAwal: 2, menurun: true, kolom: [
    { label: t("tpl.c.pltu"), v: (r) => pltuById(r.pid)?.nama || r.pid, f: (r) => `<b>${esc(pltuById(r.pid)?.nama || r.pid)}</b>` },
    { label: t("tpl.c.prov"), v: (r) => nama(r.prov), f: (r) => tautProvinsi(r.prov) },
    { label: "MW", num: true, v: (r) => r.mw, f: (r) => esc(num(r.mw, 0)) },
    { label: t("tpl.c.jenis"), v: (r) => (r.captive ? 1 : 0), f: (r) => pilJenis("tpl.jenis.", r.captive ? "captive" : "grid") },
    ...TEK.map((k) => ({ label: `${t("tpl.gn.t." + k)} MW`, num: true, v: (r) => r.sepadan_mw[k], f: (r) => esc(num(r.sepadan_mw[k], 0)) })),
    { label: t("tpl.gn.total"), num: true, v: (r) => r.sepadan_mw.total, f: (r) => `<b>${esc(num(r.sepadan_mw.total, 0))}</b> ${hipotesis()}` },
    { label: t("tpl.c.pemilik"), v: (r) => pltuById(r.pid)?.pemilik?.nama, f: (r) => orgSel(pltuById(r.pid)?.pemilik?.org_id, pltuById(r.pid)?.pemilik?.nama) },
  ], baris: G().baris });
  siapTautan("org").then(() => naikkan(el));
}
export function mulai(el) {
  if (!B.tp || !B.pltu) { el.innerHTML = kosongTab("tpl.kosong"); return; }
  const P = G().param, tot = G().baris.reduce((a, r) => a + r.sepadan_mw.total, 0), mw = G().baris.reduce((a, r) => a + r.mw, 0);
  el.innerHTML = [
    ex({ id: "tpl-g-ringkas", ikon: "tek-surya", topik: t("tpl.gn.ey.ringkas"), judulHtml: esc(t("tpl.gn.j.ringkas", { mw: num(mw / 1000, 1), g: num(tot / 1000, 0), r: num(tot / mw, 1) })), subHtml: esc(t("tpl.gn.s.ringkas")),
      isiHtml: `<div class="tpl-kisi"><div class="rg3-kartu"><div class="rg3-k-kep">${ikon("kalkulator", 22)}<b>${esc(t("tpl.gn.rumus_j"))}</b></div><p>${esc(t("tpl.gn.rumus", { fk: num(P.fk_batubara * 100, 0), s: num(P.bauran.surya * 100, 0), b: num(P.bauran.bayu * 100, 0), f: num(P.bauran.firm * 100, 0), fs: num(P.fk_ebt.surya * 100, 0), fb: num(P.fk_ebt.bayu * 100, 0), ff: num(P.fk_ebt.firm * 100, 0) }))}</p>${hipotesis()}</div><div class="rg3-kartu"><div class="rg3-k-kep">${ikon("peta", 22)}<b>${esc(t("tpl.gn.arah_j"))}</b></div><p>${esc(t("tpl.gn.arah"))}</p><p class="jm-bantu"><a class="rg3-tautan" href="/peluang">${esc(t("tpl.gn.lihat_peluang"))}</a> <a class="rg3-tautan" href="/cek-lokasi">${esc(t("tpl.gn.lihat_cek"))}</a></p></div></div>`,
      kakiHtml: kakiSumber(["gem-gcpt"]) }),
    ex({ id: "tpl-g-gex", ikon: "grafik", topik: t("tpl.gn.ey.g"), judulHtml: esc(t("tpl.gn.j.g")), subHtml: esc(t("tpl.gn.s.g")), isiHtml: `<div id="tpl-g-l"></div><div id="tpl-g-g" class="ih-bagan"></div>${catatan("tpl.gn.n.g")}` }),
    ex({ id: "tpl-g-provex", ikon: "wilayah", topik: t("tpl.gn.ey.prov"), judulHtml: esc(t("tpl.gn.j.prov")), subHtml: esc(t("tpl.gn.s.prov")), isiHtml: `<div id="tpl-g-prov"></div>${catatan("tpl.gn.n.prov")}` }),
    ex({ id: "tpl-g-tabex", ikon: "daftar2", topik: t("tpl.gn.ey.tab"), judulHtml: esc(t("tpl.gn.j.tab", { n: G().baris.length })), subHtml: esc(t("tpl.gn.s.tab")), isiHtml: `<div id="tpl-g-tab"></div>` }),
    daftarCelah([tx({ id: B.tp.meta.celah[4], en: B.tp.meta.celah_en[4] })]),
  ].join("");
  grafik(); tabProv(); tabPltu();
}
