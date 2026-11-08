/* /baterai-ev: neraca kapasitas sel dalam negeri lawan kebutuhan baterai (EV roda empat, motor, hibrida/PHEV, BESS). SELURUHNYA HIPOTESIS:
   kebutuhan = unit tahun dasar x kWh per kendaraan (asumsi, bisa diubah) x pertumbuhan skenario; BESS = target skenario dibagi rata 2026-2028.
   Rumus ditulis di halaman. Kapasitas sel dibaca dari hilirisasi.json (HLI, CATL-IBC) lewat skenario tetap. */
import { X, t, esc, ikon, num, bukti, ex, catatan, buktiBe, sumberHtmlBe } from "/be_umum.js";
import { nanti } from "/inti/umum.js";
import { pilihHtml } from "/inti/komponen.js";
import { kolomSvg, legendaHtml, tipHtml } from "/info_hijau.js";

const TAHUN = [2025, 2026, 2027, 2028], TUMBUH = { 0: "t0", 50: "t50", 100: "t100" };
let st = { sel: "hli-catl1", bess: "tanpa", kwh: "45", g: "50" };
const dasar = () => {
  const P = X.be?.penjualan; if (!P) return null;
  const bev = P.bev.at(-1), el = P.elektrifikasi.at(-1), mo = P.motor.at(-1);
  return { th: bev.tahun, bev: bev.unit, lain: Math.max(0, el.unit - bev.unit), motor: mo.unit };
};
export function hitung(s = st) {
  const d = dasar(), N = X.be?.neraca; if (!d || !N) return null;
  const kwh = +s.kwh, g = +s.g / 100, bess = N.skenario_bess_gwh.find((b) => b.k === s.bess)?.gwh || 0, kap = N.skenario_sel.find((b) => b.k === s.sel)?.gwh || 0;
  const baris = TAHUN.map((th) => {
    const f = (1 + g) ** (th - d.th), bev = (d.bev * f * kwh) / 1e6, motor = (d.motor * N.param.kwh_motor) / 1e6, lain = (d.lain * N.param.kwh_hybrid) / 1e6, b = th > d.th ? bess / 3 : 0;
    return { th, bev, motor, lain, bess: b, total: bev + motor + lain + b, kap, selisih: kap - (bev + motor + lain + b) };
  });
  return { baris, kap, d };
}
export function bagianNeraca() {
  if (!dasar()) return "";
  const N = X.be.neraca;
  const sel = pilihHtml({ id: "bev-n-sel", ikon: "petir", label: t("bev.nr.f.sel"), opsi: N.skenario_sel.map((x) => [x.k, t("bev.nr.sel." + x.k, { g: num(x.gwh, 1) }), "pabrik"]), nilai: st.sel });
  const bs = pilihHtml({ id: "bev-n-bess", ikon: "sistem-listrik", label: t("bev.nr.f.bess"), opsi: N.skenario_bess_gwh.map((x) => [x.k, t("bev.nr.bess." + x.k, { g: num(x.gwh, 1) }), "sistem-listrik"]), nilai: st.bess });
  const kw = pilihHtml({ id: "bev-n-kwh", ikon: "kartu", label: t("bev.nr.f.kwh"), opsi: [["35", t("bev.nr.kwh", { n: 35 }), "kartu"], ["45", t("bev.nr.kwh", { n: 45 }), "kartu"], ["60", t("bev.nr.kwh", { n: 60 }), "kartu"]], nilai: st.kwh });
  const gr = pilihHtml({ id: "bev-n-g", ikon: "grafik", label: t("bev.nr.f.g"), opsi: Object.entries(TUMBUH).map(([v, k]) => [v, t("bev.nr." + k), "grafik"]), nilai: st.g });
  return ex({ id: "bev-sel-neraca", ikon: "banding", topik: t("bev.ey.neraca"), judulHtml: esc(t("bev.j.neraca")), subHtml: esc(t("bev.s.neraca")),
    isiHtml: `<p class="rg3-info">${ikon("tanya", 18)}<span>${esc(t("bev.nr.hip"))} ${bukti("hipotesis", { cara: t("bev.nr.rumus") })}</span></p><div class="jm-saring bev-saring4">${sel}${bs}${kw}${gr}</div><div id="bev-n-ubin" class="rg3-kisi"></div>${legendaHtml([{ kelas: "rg3-s-dunia", label: t("bev.nr.s.bev") }, { kelas: "rg3-s-banding", label: t("bev.nr.s.lain") }, { kelas: "rg3-s-id", label: t("bev.nr.s.motor") }, { kelas: "rg3-s-h-sedang", label: t("bev.nr.s.bess") }])}<div id="bev-n-g2" class="ih-bagan"></div>${catatan("bev.nr.n")}<p class="jm-bantu ih-catatan">${esc(t("bev.nr.rumus"))}</p>`,
    kakiHtml: `<span class="bev-sumber">${sumberHtmlBe([...X.be.penjualan.bev, ...X.be.penjualan.motor].map((r) => r.sumber_id))}</span>` });
}
export function gambarNeraca(el) {
  const w = el.querySelector("#bev-n-g2"); if (!w) return;
  const h = hitung(); if (!h) return;
  const last = h.baris.at(-1);
  el.querySelector("#bev-n-ubin").innerHTML = [
    [t("bev.nr.u.kap"), num(h.kap, 1), "GWh"], [t("bev.nr.u.butuh", { th: last.th }), num(last.total, 1), "GWh"],
    [t(last.selisih >= 0 ? "bev.nr.u.lebih" : "bev.nr.u.kurang", { th: last.th }), num(Math.abs(last.selisih), 1), "GWh"],
  ].map(([l, v, s]) => `<div class="rg3-kartu bev-ubin"><span class="jm-kh-lbl">${esc(l)}</span><p class="bev-angka"><b>${esc(v)}</b><span>${esc(s)}</span></p><span class="rg3-ab">${bukti("hipotesis", { cara: t("bev.nr.rumus") })}</span></div>`).join("");
  w.innerHTML = kolomSvg({ el: w, satuan: "GWh", label: t("bev.j.neraca"), ref: { nilai: h.kap, label: t("bev.nr.ref", { g: num(h.kap, 1) }) },
    seri: [{ k: "bev", kelas: "rg3-s-dunia", label: t("bev.nr.s.bev") }, { k: "lain", kelas: "rg3-s-banding", label: t("bev.nr.s.lain") }, { k: "motor", kelas: "rg3-s-id", label: t("bev.nr.s.motor") }, { k: "bess", kelas: "rg3-s-h-sedang", label: t("bev.nr.s.bess") }],
    kategori: h.baris.map((r) => ({ label: String(r.th), nilai: { bev: r.bev, lain: r.lain, motor: r.motor, bess: r.bess }, tip: `${r.th}: ${num(r.total, 1)} GWh`, th: tipHtml(String(r.th), [[t("bev.nr.s.bev"), `${num(r.bev, 2)} GWh`], [t("bev.nr.s.lain"), `${num(r.lain, 2)} GWh`], [t("bev.nr.s.motor"), `${num(r.motor, 2)} GWh`], [t("bev.nr.s.bess"), `${num(r.bess, 2)} GWh`], [t("bev.nr.u.kap"), `${num(r.kap, 1)} GWh`], [t(r.selisih >= 0 ? "bev.nr.u.lebih0" : "bev.nr.u.kurang0"), `${num(Math.abs(r.selisih), 1)} GWh`]]) })) });
}
export function pasangNeraca(el) {
  if (!el.querySelector("#bev-n-g2")) return;
  gambarNeraca(el);
  for (const [id, k] of [["bev-n-sel", "sel"], ["bev-n-bess", "bess"], ["bev-n-kwh", "kwh"], ["bev-n-g", "g"]])
    el.querySelector("#" + id).addEventListener("change", (e) => { st[k] = e.target.value; nanti(() => gambarNeraca(el)); });
}
