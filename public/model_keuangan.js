/* /model-keuangan: pemodelan keuangan proyek EBT per teknologi dan model bisnis. Rumus: /inti/model_keuangan_rumus.js (murni, teruji);
   asumsi bawaan bersumber: /model_keuangan_data.js. INP: pilihan dan kolom isian menyalakan chrome seketika, hitung ulang + grafik + tabel
   menyusul lewat nanti() dengan debounce 120 ms. Hasil selalu Hipotesis; turunan berpil EST. */
import { t, angka } from "/i18n.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { esc, nanti, ikon, hantuHtml, debounce, galatHtml } from "/inti/umum.js";
import { khUbin } from "/inti/kh.js";
import { exHtml, pilihHtml } from "/inti/komponen.js";
import { aksiHtml } from "/inti/aksi_ex.js";
import { buktiHtml } from "/inti/bukti.js";
import { muatData, sumberLipat, pil, saatBahasa } from "/analisis.js";
import { hitungModel, tornado, skenario } from "/inti/model_keuangan_rumus.js";
import { TEK, BISNIS, SKALA, bawaan, keParam } from "/model_keuangan_data.js";

const $ = (id) => document.getElementById(id);
const N = (n, d = 0) => angka(n, { desimal: d });
const GRUP = [
  ["proyek", "tabel", ["mw", "umur"]],
  ["biaya", "tag", ["capexUsdKw", "opexUsdKwThn", "eskOpex", "gantiTahun", "gantiPersen", "kurs"]],
  ["produksi", "petir", ["fk", "degr"]],
  ["tarif", "transaksi", ["tarif", "tarifTahun2", "tarifGanti", "eskTarif", "porsiBayar", "sewaRpKwp", "recRpMwh", "karbonRpT", "emisiTMwh"]],
  ["dana", "kartu", ["utang", "bunga", "tenor"]],
  ["pajak", "regulasi", ["pajak", "libur", "susut", "ppnPorsi", "diskonto"]],
];
const DESIMAL = { mw: 3, capexUsdKw: 0, opexUsdKwThn: 1, fk: 1, degr: 2, eskOpex: 1, eskTarif: 1, bunga: 2, pajak: 1, diskonto: 1, emisiTMwh: 3, kurs: 0 };
const SATUAN = { mw: "MW", capexUsdKw: "USD/kW", opexUsdKwThn: "USD/kW", kurs: "Rp/USD", tarif: "Rp/kWh", tarifTahun2: "Rp/kWh", sewaRpKwp: "Rp/kWp", recRpMwh: "Rp/MWh", karbonRpT: "Rp/tCO2e", emisiTMwh: "tCO2e/MWh" };
const SATUAN_T = new Set(["umur", "gantiTahun", "tarifGanti", "tenor", "libur", "susut"]);
const PERSEN = new Set(["eskOpex", "gantiPersen", "fk", "degr", "eskTarif", "porsiBayar", "utang", "bunga", "pajak", "ppnPorsi", "diskonto"]);
const S = { tek: "surya-atap-rumah", skala: "plts-atap-rumah", bis: "netmeter", prov: "31", lok: 1, acuan: null, gol: "", bpp: "", grid: "jawa-bali", v: {}, sum: {}, diubah: new Set(), wT: 20, wS: 10, ppnDtp: false };
/* ?tek=<id model | teknologi patokan>: dari halaman teknologi/profil; id tak dikenal diabaikan */
{ const q = new URLSearchParams(location.search).get("tek"), x = q && (TEK.find((e) => e.id === q) || TEK.find((e) => e.patokan === q)); if (x) { S.tek = x.id; S.skala = (SKALA[x.id] || [])[0] || ""; S.bis = x.bisnis[0]; } }
const D = {};
let hasil = null;

/* ---- angka masukan menurut bahasa aktif ---- */
const urai = (s) => {
  const k = String(s).trim().replace(/\s/g, ""), id = angka(1.5, { desimal: 1 }).includes(",");
  const bersih = id ? k.replace(/\./g, "").replace(",", ".") : k.replace(/,/g, "");
  return bersih === "" || isNaN(+bersih) ? null : +bersih;
};
const tampilNilai = (k, v) => (v === null || v === undefined ? "" : N(v, DESIMAL[k] ?? (Number.isInteger(v) ? 0 : 2)));

/* ---- format hasil ---- */
const rp = (n) => {
  if (n === null || n === undefined || !isFinite(n)) return "-";
  const a = Math.abs(n), s = n < 0 ? "-" : "";
  for (const [b, u] of [[1e12, "triliun"], [1e9, "miliar"], [1e6, "juta"]]) if (a >= b) return `${s}Rp ${N(a / b, 1)} ${t("mk.u." + u)}`;
  return `${s}Rp ${N(a, 0)}`;
};
const pct = (x) => (x === null || x === undefined || !isFinite(x) ? "-" : `${N(x * 100, 1)}%`);
const thn = (x) => (x === null || x === undefined ? "-" : `${N(x, 1)} ${t("mk.u.tahun")}`);
const kali = (x) => (x === null || x === undefined ? "-" : `${N(x, 2)}x`);
const rpkwh = (x) => (x === null || x === undefined ? "-" : `Rp ${N(x, 0)}/kWh`);
const juta = (n) => N(n / 1e6, 0);

/* ---- konteks data ---- */
function konteks() {
  const tek = TEK.find((x) => x.id === S.tek);
  const gol = D.atap.tarif.find((g) => g.id === S.gol) || D.atap.tarif[0];
  const prov = D.atap.provinsi.find((p) => p.kode === S.prov);
  const bpp = D.listrik.bpp_sistem.find((b) => b.kunci === S.bpp) || D.listrik.bpp_sistem[0];
  const thBpp = Object.keys(bpp.rp_kwh).sort().at(-1);
  const lok = D.peluang.harga_patokan.faktor_lokasi[S.lok] || D.peluang.harga_patokan.faktor_lokasi[0];
  return { tek, skalaRow: D.bangun?.skala?.find((r) => r.id === S.skala) || null, peluang: D.peluang, atap: D.atap, bangun: D.bangun, karbon: D.karbon, prov: tek.surya ? prov?.pvout_kwh_per_kwp_tahun : null, faktorLokasi: lok.F, grid: S.grid,
    tarifPln: { tarif: gol.tarif_idr_per_kwh, bukti: "media", tanggal: gol.berlaku_sejak }, bppSistem: { tarif: bpp.rp_kwh[thBpp], tahun: thBpp, tanggal: D.listrik.dibangun_pada }, acuanPilih: S.acuan };
}
function terap({ simpan = true } = {}) {
  const k = konteks(), lama = { ...S.v }, b = bawaan(k.tek, S.bis, k);
  S.v = b.nilai; S.sum = b.sumber; S.acuan = b.nilai.acuan;
  if (simpan) for (const f of S.diubah) S.v[f] = lama[f];
  S.v.ppnDtp = S.ppnDtp;
  gambarAcuan(); isiKolom();
}

/* ---- kontrol ---- */
const opsiTek = () => TEK.map((x) => [x.id, t("mk.tek." + x.id), x.ikon]);
const opsiBis = () => Object.entries(BISNIS).map(([k, i]) => [k, t("mk.bis." + k), i]);
const kontrolHtml = () => `<div class="jm-saring mk-saring">
  ${pilihHtml({ id: "mkTek", ikon: "tek:surya", label: t("mk.tek"), opsi: opsiTek(), nilai: S.tek })}
  ${pilihHtml({ id: "mkBis", ikon: "transaksi", label: t("mk.bisnis"), opsi: opsiBis(), nilai: S.bis })}
  <span id="mkSkalaW">${skalaPilih()}</span>
  <span id="mkProvW">${pilihHtml({ id: "mkProv", ikon: "peta", label: t("mk.prov"), opsi: D.atap.provinsi.map((p) => [p.kode, p.provinsi, "prov:" + p.kode]), nilai: S.prov })}</span>
  ${pilihHtml({ id: "mkAcuan", ikon: "tag", label: t("mk.acuan"), opsi: ["perpres", "pln", "bpp", "manual"].map((a) => [a, t("mk.acuan." + a), { perpres: "regulasi", pln: "petir", bpp: "tabel", manual: "ubah" }[a]]), nilai: S.acuan || "manual" })}
  <span id="mkLokW">${pilihHtml({ id: "mkLok", ikon: "lokasi", label: t("mk.lokasi"), opsi: D.peluang.harga_patokan.faktor_lokasi.map((l, i) => [i, `${l.wilayah} (F ${N(l.F, 2)})`]), nilai: S.lok })}</span>
  <span id="mkGolW">${pilihHtml({ id: "mkGol", ikon: "petir", label: t("mk.golongan"), opsi: D.atap.tarif.map((g) => [g.id, `${g.golongan} (${N(g.tarif_idr_per_kwh, 0)})`]), nilai: S.gol })}</span>
  <span id="mkBppW">${pilihHtml({ id: "mkBpp", ikon: "tabel", label: t("mk.bpp"), opsi: D.listrik.bpp_sistem.map((b) => [b.kunci, b.nama, "prov:" + (b.provinsi?.[0] || "")]), nilai: S.bpp })}</span>
  ${pilihHtml({ id: "mkGrid", ikon: "air-energi", label: t("mk.grid"), opsi: D.karbon.faktor_emisi.grid_est.map((g) => [g.id, `${g.nama} (${N(g.intensitas_t_per_mwh, 2)})`]), nilai: S.grid })}
</div>`;
function gambarAcuan() {
  const adaSkala = (SKALA[S.tek] || []).length > 0 && !!D.bangun;
  $("mkSkalaW").hidden = !adaSkala; $("mkTanpa").hidden = S.v.capexUsdKw !== null && S.v.capexUsdKw !== undefined;
  const a = S.acuan, tek = TEK.find((x) => x.id === S.tek);
  $("mkProvW").hidden = !tek.surya; $("mkLokW").hidden = a !== "perpres"; $("mkGolW").hidden = a !== "pln"; $("mkBppW").hidden = a !== "bpp";
  const sel = $("mkAcuan"); if (sel && sel.value !== a) { sel.value = a; }
}

const skalaPilih = () => pilihHtml({ id: "mkSkala", ikon: "tabel", label: t("mk.skala"), opsi: (SKALA[S.tek] || []).map((id) => { const r = D.bangun?.skala?.find((x) => x.id === id); return r ? [id, r.nama, { indonesia: "img:/img/bendera/id.svg", proyek: "proyek", pembanding: "globe" }[r.kelas] || "globe", "", "", r.nama] : null; }).filter(Boolean), nilai: S.skala });
const rangkaSkala = () => { $("mkSkalaW").innerHTML = skalaPilih(); };

const medan = (k) => {
  const ada = S.v[k] !== undefined, s = S.sum[k];
  const sat = SATUAN[k] || (SATUAN_T.has(k) ? t("mk.u.tahun") : PERSEN.has(k) ? "%" : "");
  return `<div class="mk-f" data-f="${k}"><label class="mk-fl" for="mk-${k}"><span>${esc(t("mk.f." + k))}</span></label>
    <div class="mk-in"><input id="mk-${k}" data-k="${k}" type="text" inputmode="decimal" autocomplete="off" value="${esc(ada ? tampilNilai(k, S.v[k]) : "")}" placeholder="${esc(t("mk.isi"))}" aria-describedby="mk-s-${k}"><span class="mk-sat">${esc(sat)}</span></div>
    <p class="mk-sm" id="mk-s-${k}">${sumberKolom(k, s)}</p></div>`;
};
function sumberKolom(k, s) {
  if (S.diubah.has(k)) return `<span class="jm-pil jm-pil-warn">${esc(t("mk.diubah"))}</span>`;
  if (!s) return `<span class="jm-pil jm-pil-warn">${esc(t("mk.isi_sendiri"))}</span>`;
  return `${buktiHtml(s.bukti, { sumber: s.teks || t(s.sumber), tanggal: s.tanggal || "" })}<span class="mk-sk">${esc(s.teks || t(s.sumber))}</span>`;
}
function isiKolom() {
  for (const [, , ks] of GRUP) for (const k of ks) {
    const el = $("mk-" + k); if (!el) continue;
    el.value = S.v[k] === undefined || S.v[k] === null ? "" : tampilNilai(k, S.v[k]);
    $("mk-s-" + k).innerHTML = sumberKolom(k, S.sum[k]);
  }
  const c = $("mkDtp"); if (c) c.checked = S.ppnDtp;
}

/* ---- komputasi dan penyajian (ditunda) ---- */
function hitung() {
  const r = keParam(S.v);
  if (r.kurang) { hasil = { kurang: r.kurang }; return; }
  const p = r.p, ada = p.utang > 0 && p.bunga >= 0 && p.tenor > 0, metrik = ada ? (x) => x.irrEkuitas : (x) => x.irrProyek;
  const peubah = ["capexUsdKw", "opexUsdKwThn", "fk", "tarif", "kurs", ...(ada && p.bunga > 0 ? ["bunga"] : [])];
  hasil = { p, m: hitungModel(p), tr: tornado(p, peubah, S.wT / 100, metrik), sk: skenario(p, S.wS / 100), ada };
}
function sajikan() {
  hitung();
  const h = hasil, out = $("mkHasil");
  if (h.kurang) {
    out.innerHTML = `<div class="jm-kosong" role="status">${ikon("info", 32)}<p>${esc(t("mk.kurang"))} ${h.kurang.map((k) => `<b>${esc(t("mk.f." + k))}</b>`).join(", ")}</p></div>`;
    khUbin("mkAngka", ["irr", "npv", "lcoe", "dscr"].map((x) => ({ ikon: UBIN_IK[x], nilai: "-", label: t("mk.u." + x) })));
    return;
  }
  const r = h.m.ringkas, b = h.m.baris;
  khUbin("mkAngka", [
    { ikon: UBIN_IK.irr, nilai: pct(h.ada ? r.irrEkuitas : r.irrProyek), label: t(h.ada ? "mk.u.irr_eks" : "mk.u.irr") },
    { ikon: UBIN_IK.npv, nilai: rp(r.npvProyek), label: t("mk.u.npv") },
    { ikon: UBIN_IK.lcoe, nilai: rpkwh(r.lcoe), label: t("mk.u.lcoe") },
    { ikon: UBIN_IK.dscr, nilai: r.dscrMin === null ? "-" : kali(r.dscrMin), label: t("mk.u.dscr") },
  ]);
  out.innerHTML = [
    ringkasHtml(r, h), skenarioHtml(h.sk), chartHtml(b, h.p.umur), tornadoHtml(h),
    exHtml({ id: "mk-tabel", ikon: "tabel", topik: t("mk.tabel.ey"), judulHtml: esc(t("mk.tabel.j")), subHtml: esc(t("mk.tabel.s")) + " " + pil("an.est"), aksiHtml: aksiHtml({ csv: true, png: false, pdf: false, bagi: false, sajian: false }), isiHtml: tabelHtml(b) }),
  ].join("");
}
const UBIN_IK = { irr: "grafik", npv: "kalkulator", lcoe: "tag", dscr: "perisai" };

function ringkasHtml(r, h) {
  const baris = [
    ["capex", rp(r.capex), r.ppnRp > 0 ? t("mk.ket.ppn", { n: rp(r.ppnRp) }) : ""], ["utang", rp(r.utang), pct(h.p.utang)], ["ekuitas", rp(r.ekuitas), ""],
    ["irr_proyek", pct(r.irrProyek), ""], ["irr_ekuitas", h.ada ? pct(r.irrEkuitas) : "-", h.ada ? "" : t("mk.ket.tanpa_utang")],
    ["npv_proyek", rp(r.npvProyek), t("mk.ket.diskonto", { n: N(h.p.diskonto * 100, 1) })], ["npv_ekuitas", rp(r.npvEkuitas), ""],
    ["balik_proyek", thn(r.balikProyek), ""], ["balik_ekuitas", thn(r.balikEkuitas), ""], ["lcoe", rpkwh(r.lcoe), t("mk.ket.lcoe")],
    ["dscr_min", r.dscrMin === null ? "-" : kali(r.dscrMin), ""], ["dscr_rata", r.dscrRata === null ? "-" : kali(r.dscrRata), ""],
    ["energi", `${N(r.energiTahun1 / 1000, 0)} MWh`, ""],
  ];
  return exHtml({ id: "mk-ringkas", ikon: "analisis", topik: t("mk.ring.ey"), judulHtml: esc(t("mk.ring.j")), subHtml: pil("an.est") + " " + pil("an.hipotesis"),
    isiHtml: `<div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr><th scope="col">${esc(t("mk.col.ukuran"))}</th><th scope="col">${esc(t("mk.col.nilai"))}</th><th scope="col">${esc(t("mk.col.ket"))}</th></tr></thead><tbody>${baris.map(([k, v, ket]) => `<tr><td data-label="${esc(t("mk.col.ukuran"))}">${esc(t("mk.r." + k))}</td><td class="jm-num" data-label="${esc(t("mk.col.nilai"))}"><b>${esc(v)}</b></td><td data-label="${esc(t("mk.col.ket"))}">${esc(ket)}</td></tr>`).join("")}</tbody></table></div>` });
}
function skenarioHtml(sk) {
  const L = [["rendah", sk.rendah], ["tengah", sk.tengah], ["tinggi", sk.tinggi]];
  const baris = [["irr_proyek", (x) => pct(x.irrProyek)], ["irr_ekuitas", (x) => pct(x.irrEkuitas)], ["npv_proyek", (x) => rp(x.npvProyek)], ["lcoe", (x) => rpkwh(x.lcoe)], ["balik_proyek", (x) => thn(x.balikProyek)], ["dscr_min", (x) => (x.dscrMin === null ? "-" : kali(x.dscrMin))]];
  return exHtml({ id: "mk-skenario", ikon: "banding", topik: t("mk.sk.ey"), judulHtml: esc(t("mk.sk.j")), subHtml: esc(t("mk.sk.s", { n: N(S.wS, 0) })) + " " + pil("an.hipotesis"),
    isiHtml: `<div class="mk-w"><label for="mk-wS">${esc(t("mk.sk.lebar"))}</label><div class="mk-in"><input id="mk-wS" data-w="wS" type="text" inputmode="decimal" value="${esc(N(S.wS, 0))}"><span class="mk-sat">%</span></div></div>
    <div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr><th scope="col">${esc(t("mk.col.ukuran"))}</th>${L.map(([k]) => `<th scope="col">${esc(t("mk.sk." + k))}</th>`).join("")}</tr></thead><tbody>${baris.map(([k, f]) => `<tr><td data-label="${esc(t("mk.col.ukuran"))}">${esc(t("mk.r." + k))}</td>${L.map(([n, x]) => `<td class="jm-num" data-label="${esc(t("mk.sk." + n))}">${esc(f(x))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` });
}

/* grafik arus kas kumulatif: SVG .jm-gx, tiap tahun satu kolom sentuh bertooltip */
function chartHtml(b, umur) {
  const W = 760, H = 300, L = 62, R = 18, T = 16, B = 38, n = b.length;
  const v = b.flatMap((x) => [x.kumProyek, x.kumEkuitas]), lo = Math.min(0, ...v), hi = Math.max(0, ...v), rg = hi - lo || 1;
  const X = (i) => L + (i / (n - 1)) * (W - L - R), Y = (y) => T + (1 - (y - lo) / rg) * (H - T - B);
  let g = "";
  for (let i = 0; i <= 4; i++) { const y = lo + (rg * i) / 4; g += `<line class="mk-grid" x1="${L}" x2="${W - R}" y1="${Y(y).toFixed(1)}" y2="${Y(y).toFixed(1)}"/><text class="mk-sb" x="${L - 6}" y="${(Y(y) + 4).toFixed(1)}" text-anchor="end">${esc(N(y / 1e9, 1))}</text>`; }
  g += `<line class="mk-nol" x1="${L}" x2="${W - R}" y1="${Y(0).toFixed(1)}" y2="${Y(0).toFixed(1)}"/>`;
  const langkah = Math.ceil(n / 10);
  b.forEach((x, i) => { if (i % langkah === 0 || i === n - 1) g += `<text class="mk-sb" x="${X(i).toFixed(1)}" y="${H - B + 16}" text-anchor="middle">${x.tahun}</text>`; });
  const garis = (kunci, kelas) => `<polyline class="mk-gr ${kelas}" points="${b.map((x, i) => `${X(i).toFixed(1)},${Y(x[kunci]).toFixed(1)}`).join(" ")}"/>`;
  g += garis("kumProyek", "mk-g1") + garis("kumEkuitas", "mk-g2");
  const kolW = (W - L - R) / (n - 1);
  b.forEach((x, i) => {
    g += `<circle class="mk-t1" cx="${X(i).toFixed(1)}" cy="${Y(x.kumProyek).toFixed(1)}" r="3"/><circle class="mk-t2" cx="${X(i).toFixed(1)}" cy="${Y(x.kumEkuitas).toFixed(1)}" r="3"/>`;
    g += `<rect class="mk-hit" x="${(X(i) - kolW / 2).toFixed(1)}" y="${T}" width="${kolW.toFixed(1)}" height="${H - T - B}"><title>${esc(t("mk.tip.tahun", { n: x.tahun }))}: ${esc(t("mk.lg.proyek"))} ${esc(rp(x.kumProyek))}; ${esc(t("mk.lg.ekuitas"))} ${esc(rp(x.kumEkuitas))}</title></rect>`;
  });
  const leg = `<ul class="mk-leg"><li><i class="mk-sw1"></i>${esc(t("mk.lg.proyek"))}</li><li><i class="mk-sw2"></i>${esc(t("mk.lg.ekuitas"))}</li></ul>`;
  return exHtml({ id: "mk-grafik", ikon: "grafik", topik: t("mk.gr.ey"), judulHtml: esc(t("mk.gr.j", { n: umur })), subHtml: esc(t("mk.gr.s")) + " " + pil("an.est"),
    isiHtml: `${leg}<div class="mk-svgw"><svg class="jm-gx mk-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("mk.gr.label"))}" focusable="false">${g}</svg></div>` });
}

/* tornado: dua sisi (peubah turun / naik w persen) di sekitar nilai dasar */
function tornadoHtml(h) {
  const { dasar, baris } = h.tr, W = 760, rh = 34, L = 150, R = 70, T = 12, H = T + baris.length * rh + 30;
  const nilai = baris.flatMap((r) => [r.rendah, r.tinggi]).filter((x) => x !== null && x !== undefined);
  if (dasar === null || dasar === undefined || !nilai.length) return exHtml({ id: "mk-tornado", ikon: "tingkat", topik: t("mk.to.ey"), judulHtml: esc(t("mk.to.j")), isiHtml: `<p class="jm-bantu">${esc(t("mk.to.kosong"))}</p>` });
  const lo = Math.min(dasar, ...nilai), hi = Math.max(dasar, ...nilai), rg = hi - lo || 1, X = (v) => L + ((v - lo) / rg) * (W - L - R);
  let g = `<line class="mk-nol" x1="${X(dasar).toFixed(1)}" x2="${X(dasar).toFixed(1)}" y1="${T - 4}" y2="${H - 26}"/><text class="mk-sb" x="${X(dasar).toFixed(1)}" y="${H - 10}" text-anchor="middle">${esc(pct(dasar))}</text>`;
  baris.forEach((r, i) => {
    const y = T + i * rh, nm = t("mk.f." + r.kunci);
    g += `<text class="mk-sl" x="${L - 10}" y="${y + rh / 2 + 4}" text-anchor="end">${esc(nm)}</text>`;
    [[r.rendah, "mk-b1", "-"], [r.tinggi, "mk-b2", "+"]].forEach(([val, kls, tanda]) => {
      if (val === null || val === undefined) return;
      const x1 = X(Math.min(val, dasar)), x2 = X(Math.max(val, dasar)), kanan = val >= dasar;
      g += `<rect class="${kls}" x="${x1.toFixed(1)}" y="${y + 4}" width="${Math.max(2, x2 - x1).toFixed(1)}" height="${rh - 8}" rx="3"><title>${esc(nm)} ${tanda}${N(S.wT, 0)}%: ${esc(pct(val))}</title></rect><text class="${kls}-t" x="${(kanan ? x2 + 6 : x1 - 6).toFixed(1)}" y="${y + rh / 2 + 4}" text-anchor="${kanan ? "start" : "end"}">${esc(pct(val))}</text>`;
    });
  });
  const leg = `<ul class="mk-leg"><li><i class="mk-sw3"></i>${esc(t("mk.to.turun", { n: N(S.wT, 0) }))}</li><li><i class="mk-sw4"></i>${esc(t("mk.to.naik", { n: N(S.wT, 0) }))}</li></ul>`;
  return exHtml({ id: "mk-tornado", ikon: "tingkat", topik: t("mk.to.ey"), judulHtml: esc(t(h.ada ? "mk.to.j_eks" : "mk.to.j")), subHtml: esc(t("mk.to.s")) + " " + pil("an.hipotesis"),
    isiHtml: `<div class="mk-w"><label for="mk-wT">${esc(t("mk.to.lebar"))}</label><div class="mk-in"><input id="mk-wT" data-w="wT" type="text" inputmode="decimal" value="${esc(N(S.wT, 0))}"><span class="mk-sat">%</span></div></div>${leg}<div class="mk-svgw"><svg class="jm-gx mk-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("mk.to.label"))}" focusable="false">${g}</svg></div>` });
}

function tabelHtml(b) {
  const K = ["tahun", "energi", "tarif", "pendapatan", "opex", "ebitda", "pajak", "cicilan", "dscr", "arusProyek", "arusEkuitas", "kumEkuitas"];
  const sel = (x, k) => (k === "tahun" ? x.tahun : k === "energi" ? N(x.energi / 1000, 0) : k === "tarif" ? N(x.tarif, 0) : k === "dscr" ? (x.dscr === null ? "-" : N(x.dscr, 2)) : juta(x[k]));
  return `<div class="jm-gulir"><table class="jm-tabel mk-tb" data-urut="tidak"><thead><tr>${K.map((k) => `<th scope="col">${esc(t("mk.c." + k))}</th>`).join("")}</tr></thead><tbody>${b.map((x) => `<tr>${K.map((k) => `<td class="${k === "tahun" ? "" : "jm-num"}" data-label="${esc(t("mk.c." + k))}">${esc(sel(x, k))}</td>`).join("")}</tr>`).join("")}</tbody></table></div><p class="jm-bantu">${esc(t("mk.tabel.cat"))}</p>`;
}

/* ---- rangka halaman ---- */
function rangka() {
  const sumber = sumberLipat([
    { sumber: "Perpres 112/2022", halaman: t("mk.s.perpres"), tanggal: D.peluang.meta?.diperbarui || D.listrik.dibangun_pada },
    { sumber: t("mk.s.pln_p"), halaman: t("mk.s.pln"), tanggal: D.atap.meta?.tarif_terbaru || D.atap.dibangun_pada },
    { sumber: "Kementerian ESDM", halaman: t("mk.s.bpp"), tanggal: D.listrik.dibangun_pada },
    { sumber: "IRENA; ESDM/DEA", halaman: t("mk.s.irena"), tanggal: D.listrik.dibangun_pada },
  ]);
  $("mkIsi").innerHTML = exHtml({ id: "mk-asumsi", ikon: "kalkulator", topik: t("mk.as.ey"), judulHtml: esc(t("mk.as.j")), subHtml: esc(t("mk.as.s")) + " " + pil("an.hipotesis"),
    aksiHtml: `<a class="jm-tbl jm-tbl-kecil" href="/metode#model-keuangan">${ikon("metode", 16)}<span>${esc(t("mk.metode"))}</span></a><button type="button" class="jm-tbl jm-tbl-kecil" id="mkReset">${ikon("balik", 16)}<span>${esc(t("mk.reset"))}</span></button>`,
    isiHtml: `${kontrolHtml()}<p class="jm-bantu mk-tanpa" id="mkTanpa" hidden>${ikon("info", 16)}<span>${esc(t("mk.tanpa_asumsi"))}</span></p><div class="mk-grup">${GRUP.map(([g, ik, ks]) => `<section class="mk-g"><h3 class="mk-gh">${ikon(ik, 16)}<span>${esc(t("mk.g." + g))}</span></h3><div class="mk-gb">${ks.map(medan).join("")}${g === "pajak" ? `<label class="mk-cb" for="mkDtp"><input type="checkbox" id="mkDtp"><span>${esc(t("mk.dtp"))}</span></label>` : ""}</div></section>`).join("")}</div>${sumber}` })
    + `<div id="mkHasil" aria-live="polite">${hantuHtml(4)}</div>`
    + exHtml({ id: "mk-cara", ikon: "metode", topik: t("mk.cara.ey"), judulHtml: esc(t("mk.cara.j")), subHtml: pil("an.hipotesis"),
      isiHtml: `<ol class="mk-cara">${[1, 2, 3, 4, 5].map((i) => `<li>${esc(t("mk.cara" + i))}</li>`).join("")}</ol><p><a class="jm-tbl jm-tbl-kecil" href="/metode#model-keuangan">${ikon("tautan", 16)}<span>${esc(t("mk.metode"))}</span></a></p>` });
  import("/inti/pilih.js").then((m) => m.pasangPilih()).catch(() => {});
}

const tunda = debounce(() => nanti(sajikan), 120);
function pasang() {
  const akar = $("mkIsi");
  akar.addEventListener("input", (e) => {
    const el = e.target;
    if (el.dataset.k) { // kolom isian: tandai diubah seketika (chrome), hitung ulang menyusul
      const nil = urai(el.value), k = el.dataset.k;
      S.v[k] = nil; S.diubah.add(k); $("mk-s-" + k).innerHTML = sumberKolom(k, null);
      if (k === "tarif") { S.acuan = "manual"; gambarAcuan(); }
      tunda();
    } else if (el.dataset.w) { const n = urai(el.value); if (n > 0 && n < 100) { S[el.dataset.w] = n; tunda(); } }
  });
  akar.addEventListener("change", (e) => {
    const el = e.target, k = el.dataset.k;
    if (k) { el.value = S.v[k] === null || S.v[k] === undefined ? "" : tampilNilai(k, S.v[k]); return; }
    if (el.id === "mkDtp") { S.ppnDtp = el.checked; S.v.ppnDtp = el.checked; return tunda(); }
    const peta = { mkSkala: ["skala", true], mkTek: ["tek", true], mkBis: ["bis", true], mkProv: ["prov"], mkLok: ["lok"], mkGol: ["gol"], mkBpp: ["bpp"], mkGrid: ["grid"], mkAcuan: ["acuan"] }[el.id];
    if (!peta) return;
    S[peta[0]] = el.id === "mkLok" ? +el.value : el.value;
    if (el.id === "mkSkala") S.diubah.clear();
    if (el.id === "mkTek") { S.skala = (SKALA[S.tek] || [])[0] || ""; rangkaSkala(); S.bis = TEK.find((x) => x.id === S.tek).bisnis[0]; S.acuan = null; S.diubah.clear(); const b = $("mkBis"); b.value = S.bis; }
    if (el.id === "mkBis") { S.acuan = null; S.diubah.delete("tarif"); S.diubah.delete("tarifTahun2"); S.diubah.delete("porsiBayar"); }
    if (el.id === "mkAcuan") { S.diubah.delete("tarif"); S.diubah.delete("tarifTahun2"); }
    terap({ simpan: true }); tunda();
  });
  akar.addEventListener("click", (e) => { if (e.target.closest("#mkReset")) { S.diubah.clear(); S.ppnDtp = false; S.acuan = null; terap({ simpan: false }); tunda(); } });
}

/* ---- mulai ---- */
await mulaiHalaman();
try {
  const [peluang, atap, karbon, listrik] = await Promise.all(["peluang.json", "plts_atap_hitung.json", "karbon_pasar.json", "biaya_listrik.json"].map(muatData));
  Object.assign(D, { peluang, atap, karbon, listrik, bangun: await muatData("biaya_bangun.json").catch(() => null) });
  S.gol = (atap.tarif.find((g) => /r_1_tr_2_200/.test(g.id)) || atap.tarif[0]).id; S.bpp = listrik.bpp_sistem[0].kunci;
  rangka(); terap({ simpan: false }); sajikan();
  pasang();
  saatBahasa(() => { rangka(); terap(); sajikan(); });
} catch (e) {
  $("mkIsi").innerHTML = galatHtml("umum");
  $("mkIsi").querySelector("[data-aksi=ulang]")?.addEventListener("click", () => location.reload());
}
