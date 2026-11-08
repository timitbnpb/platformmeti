/* /hidrogen, tab Elektroliser: empat teknologi (AEL, PEM, SOEC, AEM), harga terpasang USD/kW (IEA), kapasitas pabrik dunia, pemasok global dari pemasok_lain.json (segmen hidrogen) dan pemasok lokal. */
import { H, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, batangSvg, kolomSvg, tipHtml, legendaHtml, siapTautan, naikkan, kosongTab, daftarCelah, catatan, orgSel, negaraSel, bendera, namaNegara, logoHtml, tautOrg, pilJenis, chip, rentang, luar } from "/h2_umum.js";

const KEMATANGAN = { komersial: "centang", awal: "labu", demonstrasi: "pabrik" };
let negara = "";
const E = () => H.h2.elektroliser;
const kelas = (k) => "h2-s-" + k;
function chipTeknologi(k) { return `<span class="rg3-chip h2-teknologi ${kelas(k)}"><i class="ih-sw ${kelas(k)}"></i><span>${esc(t("h2.el.k." + k))}</span></span>`; }
function efisiensi() {
  const g = document.getElementById("h2-e-ef"); if (!g) return;
  g.innerHTML = batangSvg({ el: g, d: 0, satuan: "kWh/kg", label: t("h2.el.j.ef"), seri: [{ k: "min", kelas: "h2-s-dasar" }, { k: "sel", kelas: "h2-s-rentang" }],
    baris: E().teknologi.map((x) => ({ label: t("h2.el.k." + x.k), ikon: "labu", tip: t("h2.el.k." + x.k), th: tipHtml(t("h2.el.k." + x.k), [[t("h2.el.kwh"), `${rentang(x.kwh)} kWh/kg`], [t("h2.el.umur"), x.umur_jam[1] ? `${rentang(x.umur_jam)} ${t("h2.u.jam")}` : "-"], [t("h2.el.kematangan"), t("h2.mat." + x.kematangan)]]), bagian: [{ k: "min", nilai: x.kwh[0] }, { k: "sel", nilai: x.kwh[1] - x.kwh[0] }] })) });
}
function harga() {
  const g = document.getElementById("h2-e-hg"); if (!g) return;
  g.innerHTML = batangSvg({ el: g, d: 0, satuan: "USD/kW", label: t("h2.el.j.hg"), seri: [{ k: "min", kelas: "h2-s-dasar" }, { k: "sel", kelas: "h2-s-rentang" }],
    baris: E().harga_iea.map((x) => ({ label: t("h2.el.h." + x.k), bendera: x.k === "luar-cina" ? null : "cn", ikon: x.k === "luar-cina" ? "globe" : null, tip: t("h2.el.h." + x.k), th: tipHtml(t("h2.el.h." + x.k), [["USD/kW", rentang(x.usd_kw)]]), bagian: [{ k: "min", nilai: x.usd_kw[0] }, { k: "sel", nilai: x.usd_kw[1] - x.usd_kw[0] }] })) });
}
function pabrik() {
  const g = document.getElementById("h2-e-pb"); if (!g) return;
  const p = E().pabrik_dunia, lain = Math.round((p.kapasitas_pabrik_cn_gw / (p.pangsa_pabrik_cn_persen / 100)) - p.kapasitas_pabrik_cn_gw);
  const K = [["cn", p.kapasitas_pabrik_cn_gw, "h2-s-cn", t("h2.el.p.cn")], ["lain", lain, "h2-s-lain", t("h2.el.p.lain")], ["min", p.permintaan_gw_2024, "h2-s-target", t("h2.el.p.minta")]];
  document.getElementById("h2-e-pb-l").innerHTML = legendaHtml(K.map(([, , c, l]) => ({ kelas: c, label: l })));
  g.innerHTML = kolomSvg({ el: g, satuan: "GW", label: t("h2.el.j.pb"), seri: K.map(([k, , c]) => ({ k, kelas: c })),
    kategori: K.map(([k, v, , l]) => ({ label: l, nilai: { [k]: v }, tip: l, th: tipHtml(l, [["GW", num(v, 0)], [t("h2.c.bukti"), k === "lain" ? t("h2.est") : t("h2.resmi")]]) })) });
}
function pemasok() {
  const el = document.getElementById("h2-e-tab"); if (!el) return;
  const semua = (H.lain?.baris || []).filter((b) => (b.segmen || []).includes("hidrogen")), baris = semua.filter((b) => !negara || b.negara_iso2 === negara);
  tabel(el, { satuan: "h2.u.pemasok", per: 6, urutAwal: 0, menurun: false, kolom: [
    { label: t("h2.c.pemasok"), v: (b) => b.nama, f: (b) => `<span class="rg3-org">${logoHtml(b.organisasi_id, b.nama, b.logo)}<span class="rg3-idk"><b>${tautOrg(b.organisasi_id, b.nama)}</b></span></span>` },
    { label: t("h2.c.negara"), v: (b) => b.negara_iso2, f: (b) => negaraSel(b.negara_iso2) },
    { label: t("h2.c.bagian"), v: (b) => (b.subsegmen || []).join(), f: (b) => `<span class="h2-baris">${(b.subsegmen || []).filter((s) => s !== "bess-integrasi").map((s) => pilJenis("h2.el.sub.", s, s.includes("elektroliser") ? "labu" : "pabrik")).join("")}</span>` },
    { label: t("h2.c.produk"), v: (b) => (b.produk || []).length, f: (b) => `<span class="rg3-teks">${esc((b.produk || []).slice(0, 4).join(", ") || "-")}</span>` },
    { label: t("h2.c.bukti"), v: (b) => b.fakta?.[0]?.tingkat_bukti || "", f: (b) => bukti(b.fakta?.[1]?.tingkat_bukti || b.fakta?.[0]?.tingkat_bukti, { sumber: b.sumber?.[0]?.keterangan || "", tanggal: b.sumber?.[0]?.tanggal_periksa || "" }) },
  ], baris });
  siapTautan("org").then(() => naikkan(el));
  const neg = [...new Set(semua.map((b) => b.negara_iso2))].sort();
  document.getElementById("h2-e-neg").innerHTML = [["", null], ...neg.map((n) => [n, n])].map(([k]) => `<button type="button" class="rg3-chip rg3-chipb rg3-w${k ? 1 + (neg.indexOf(k) % 7) : 0}" data-neg="${esc(k)}" aria-pressed="${negara === k}">${k ? bendera(k, 16) : ikon("globe", 14)}<span>${esc(k ? namaNegara(k) : t("h2.semua"))}</span> <i>${k ? semua.filter((b) => b.negara_iso2 === k).length : semua.length}</i></button>`).join("");
}
export function mulai(el) {
  const d = E(), L0 = d.lokal[0], tg = d.target;
  el.innerHTML = [
    ex({ id: "h2-e-tek", ikon: "labu", topik: t("h2.el.ey.tek"), judulHtml: esc(t("h2.el.j.tek")), subHtml: esc(t("h2.el.s.tek")),
      isiHtml: `<div id="h2-e-ef" class="ih-bagan"></div><div id="h2-e-tek-t"></div>${catatan("h2.el.n.tek")}`, kakiHtml: kakiSumber([d.sumber_id, d.sumber_bnef]) }),
    ex({ id: "h2-e-harga", ikon: "tag", topik: t("h2.el.ey.hg"), judulHtml: esc(t("h2.el.j.hg")), subHtml: esc(t("h2.el.s.hg")), isiHtml: `<div id="h2-e-hg" class="ih-bagan"></div>${catatan("h2.el.n.hg")}`, kakiHtml: kakiSumber([d.harga_sumber_id]) }),
    ex({ id: "h2-e-pab", ikon: "pabrik", topik: t("h2.el.ey.pb"), judulHtml: esc(t("h2.el.j.pb")), subHtml: esc(t("h2.el.s.pb")),
      isiHtml: `<div id="h2-e-pb-l"></div><div id="h2-e-pb" class="ih-bagan"></div><div class="rg3-info">${ikon("info", 18)}<p>${esc(t("h2.el.i.pb", { t: d.pabrik_dunia.terpasang_gw_2024, c: d.pabrik_dunia.pangsa_terpasang_cn }))} ${buktiS(d.pabrik_dunia.sumber_id, d.pabrik_dunia.tingkat_bukti)}</p></div>${catatan("h2.el.n.pb")}`, kakiHtml: kakiSumber([d.pabrik_dunia.sumber_id]) }),
    ex({ id: "h2-e-pem", ikon: "globe", topik: t("h2.el.ey.pem"), judulHtml: esc(t("h2.el.j.pem", { n: (H.lain?.baris || []).filter((b) => (b.segmen || []).includes("hidrogen")).length })), subHtml: esc(t("h2.el.s.pem")),
      isiHtml: `<div id="h2-e-neg" class="rg3-chips" role="group" aria-label="${esc(t("h2.f.negara"))}"></div><div id="h2-e-tab"></div>${catatan("h2.el.n.pem")}` }),
    ex({ id: "h2-e-lok", ikon: "pabrik", topik: t("h2.el.ey.lok"), judulHtml: esc(t("h2.el.j.lok")), subHtml: esc(t("h2.el.s.lok")),
      isiHtml: `<div class="rg3-kisi"><div class="rg3-kartu"><div class="rg3-k-kep">${bendera("id", 22)}<b>${esc(L0.nama)}</b></div><p>${esc(tx(L0.produk))}</p>${buktiS(L0.sumber_id, L0.tingkat_bukti)}</div><div class="rg3-kartu"><div class="rg3-k-kep">${ikon("regulasi", 22)}<b>${esc(num(tg.mw))} MW, ${esc(String(tg.tahun))}</b></div><p>${esc(tx(tg.catatan))}</p>${buktiS(tg.sumber_id, tg.tingkat_bukti)}</div></div>${daftarCelah([t("h2.el.celah.lokal")])}`, kakiHtml: kakiSumber([L0.sumber_id, tg.sumber_id]) }),
  ].join("");
  efisiensi(); harga(); pabrik(); pemasok();
  const tbl = document.getElementById("h2-e-tek-t");
  tabel(tbl, { satuan: "h2.u.teknologi", per: 4, urutAwal: 0, menurun: false, kolom: [
    { label: t("h2.c.teknologi"), v: (x) => x.k, f: (x) => chipTeknologi(x.k) },
    { label: t("h2.el.kwh"), num: true, v: (x) => x.kwh[0], f: (x) => `${esc(rentang(x.kwh))} kWh/kg` },
    { label: t("h2.el.umur"), num: true, v: (x) => x.umur_jam[1], f: (x) => (x.umur_jam[1] ? `${esc(x.umur_jam[0] === x.umur_jam[1] ? "~" + num(x.umur_jam[1], 0) : rentang(x.umur_jam))} ${esc(t("h2.u.jam"))}` : "-") },
    { label: t("h2.el.stack"), num: true, v: (x) => x.stack_usd_kw?.[0] || 0, f: (x) => (x.stack_usd_kw ? `${x.stack_usd_kw[0] === x.stack_usd_kw[1] ? (x.k === "soec" ? ">" : "~") + num(x.stack_usd_kw[0], 0) : esc(rentang(x.stack_usd_kw))} USD/kW` : "-") },
    { label: t("h2.el.kematangan"), v: (x) => x.kematangan, f: (x) => pilJenis("h2.mat.", x.kematangan, KEMATANGAN[x.kematangan]) },
    { label: t("h2.c.uraian"), v: (x) => tx(x.ket), f: (x) => `<span class="rg3-teks">${esc(tx(x.ket))}</span>` },
    { label: t("h2.c.bukti"), v: () => "", f: () => buktiS(d.sumber_id, "via-pihak-ketiga") },
  ], baris: d.teknologi });
  document.getElementById("h2-e-neg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-neg]"); if (!b) return;
    negara = b.dataset.neg; for (const x of el.querySelectorAll("[data-neg]")) x.setAttribute("aria-pressed", String(x.dataset.neg === negara));
    pemasok();
  });
}
