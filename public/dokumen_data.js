/* /dokumen-data: indeks /data/dokumen_data.json lalu satu dokumen /data/dokumen/<id>.json (scripts/pipa/ekstrak_pdf.mjs).
   SATU perender matriks untuk semua tabel: bpp (hierarki sistem), deret (tahun jadi kolom), prov (baris x kategori), ruptl (kelompok x jenis x tahun), rued (provinsi > teknologi).
   Tiap jenis tabel memakai kerangka sama: kepala exhibit, grafik interaktif (legenda bisa dimatikan, tooltip kaya, klik menyaring), lencana satuan,
   kolom nama lengket kiri, jumlah lengket kanan, panas halus per sel, "-" redup untuk kosong dan nol. Teks layar dari kamus. */
import { mulaiHalaman } from "/inti/kepala.js";
import { khUbin } from "/inti/kh.js";
import { t, angka, tanggal, ada } from "/i18n.js";
import { esc, ikon, hantuHtml } from "/inti/umum.js";
import { cariHtml, pilihHtml } from "/inti/komponen.js";
import { aksiHtml } from "/inti/aksi_ex.js";
import { paginasiHtml } from "/inti/paginasi.js";
import { namaBaku } from "/inti/nama_baku.js";
import { IKON_TEK } from "/inti/ikon_tek.js";
import { kodeProv, singkatProv } from "/inti/prov_singkat.js";
import { muatData, tampilGalat, saatBahasa } from "/analisis.js";

const $ = (id) => document.getElementById(id);
const PER = 25;
const S = { idx: null, dok: null, tab: 0, hal: 1, uk: null, ua: 1, q: "", g: "", buka: new Set(), nol: false, band: false };
const G = { cfg: null, hid: new Set(), geo: null };

const adaPdf = (u) => /^https:\/\/\S+\.pdf(\?\S*)?$/i.test(u || "");
const tautHal = (u, h) => (adaPdf(u) ? `${u.split("#")[0]}#page=${h}` : "");
const http = (u) => (/^https:\/\//.test(u || "") ? u : "");
const tahunDok = (s) => String(s).slice(0, 4);
/* "2026-08" -> "Diperbarui Agu 2026"; tanggal penuh -> "Terbit 8 Sep 2021" */
const tglDok = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s) ? t("dd.terbit", { t: tanggal(s) }) : /^\d{4}-\d{2}$/.test(s) ? t("dd.diperbarui", { t: tanggal(s + "-01").split(" ").slice(1).join(" ") }) : String(s));

/* logo penerbit dari berkas lokal; tanpa padanan -> ikon gedung */
const LOGO = [[/^PT PLN/i, "/img/logo/pln.png"], [/ESDM|Ketenagalistrikan/i, "/img/logo/esdm.png"], [/Pemerintah/i, "/img/penerbit/garuda.png"]];
const logoHtml = (penerbit, u = 36) => { const f = LOGO.find(([r]) => r.test(penerbit)); return f ? `<img src="${f[1]}" width="${u}" height="${u}" alt="" loading="lazy" decoding="async">` : ikon("gedung", u - 12); };
const PENDEK = new Set(["kepmen-bpp-pembangkitan", "heesi-2025", "rued-target-kapasitas", "ruptl-2025-2034", "statistik-ketenagalistrikan-2024"]);
const judulPendek = (d) => (PENDEK.has(d.id) ? t("dd.pendek." + d.id) : d.judul);
function labelTabel(x) {
  const bpp = /^BPP .*tahun (\d{4})/.exec(x.judul); if (bpp) return `BPP ${bpp[1]}`;
  const sk = /skenario ([^,]+)/.exec(x.judul); if (sk) return t("dd.skenario", { s: sk[1] });
  return x.judul.replace(/\s*\([^)]*\)/g, "");
}

/* ---------------------------------------- kamus jenis: [kunci ikon teknologi, EBT?, kelas warna] ---------------------------------------- */
const E = (tek, k = tek) => [tek, true, "dd-c-" + k], F = (k) => ["", false, "dd-c-" + k];
const KAM = {
  batubara: F("f1"), pltu: F("f1"), pltu_mt: F("f1"), uap_batubara: F("f1"), minyak_bumi: F("f2"), pltd: F("f2"), diesel: F("f2"),
  gas_bumi: F("f3"), gas: F("f3"), pltg: F("f3"), pltg_gu: F("f3"), gas_uap: F("f4"), pltgu: F("f4"), pltmg: F("f5"), mesin_gas: F("f5"),
  hidro: E("hidro"), plta: E("hidro"), plta_ps: E("hidro", "hidro2"), plta_m: E("hidro"), pltm: E("hidro", "hidro2"), pltmh: E("hidro", "hidro3"), mini_hidro: E("hidro", "hidro2"), mikro_hidro: E("hidro", "hidro3"),
  panas_bumi: E("panas-bumi", "panas"), pltp: E("panas-bumi", "panas"), panas_bumi_langsung: E("panas-bumi", "panas2"),
  surya: E("surya"), plts: E("surya"), plts_bess: E("surya", "surya2"), pemanas_air_surya: E("surya", "surya2"), bayu: E("bayu"), pltb: E("bayu"),
  bioenergi: E("bioenergi"), biomassa_tradisional: E("bioenergi", "bio2"), biofuel: E("bioenergi", "bio3"), biogas: E("bioenergi", "bio3"), biomassa_industri: E("bioenergi"), biomassa: E("bioenergi"),
  plt_bio: E("bioenergi"), pltbg: E("bioenergi", "bio3"), pltbm: E("bioenergi", "bio2"), pltgb: E("bioenergi", "bio3"),
  pltsa: E("biomassa-sampah", "sampah"), biomassa_sampah: E("biomassa-sampah", "sampah"), pltn: E("nuklir"), nuklir: E("nuklir"), bess: [E("penyimpanan")[0], null, "dd-c-penyimpanan"], penyimpanan: [E("penyimpanan")[0], null, "dd-c-penyimpanan"],
  pltal: E("laut"), ebt_lain: ["", true, "dd-c-x2"], plt_lain: ["", null, "dd-c-x"],
};
const nk = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const jinfo = (k) => KAM[nk(k)] || ["", null, "dd-c-x"];
const jIkon = (k) => { const tek = jinfo(k)[0]; return tek && IKON_TEK[tek] ? IKON_TEK[tek] : ikon("petir", 16); };
const jPanjang = (k, cadangan) => (ada("dd.j." + nk(k)) ? t("dd.j." + nk(k)) : cadangan);
const labelTek = (k) => (ada("pj.tek." + k) ? t("pj.tek." + k) : k);

/* ---------------------------------------- nama BPP: sistem, wilayah, tingkat ---------------------------------------- */
const nm = (s) => (/NASIONAL$/.test(s) ? t("dd.nasional") : /^[A-Z]{3,5}$/.test(s) && s !== "DKI" ? s[0] + s.slice(1).toLowerCase() : namaBaku(s).nama);
const PULAU = /^(sumatera|jawa bali|kalimantan|sulawesi dan nusa tenggara|maluku dan papua)$/i;
const tingkatNama = (s) => (/NASIONAL$/.test(s) ? 0 : PULAU.test(s) ? 0 : /^SUBSISTEM/i.test(s) ? 2 : s === s.toUpperCase() || s === "Riau" ? 1 : 2);
const nmProv = (s) => namaBaku(s).nama;

/* ---------------------------------------- angka ---------------------------------------- */
const nilaiTeks = (v) => angka(v, { desimal: Number.isInteger(v) ? 0 : v < 100 ? 2 : 1 });
const ringkas = (v) => (v >= 1e6 ? `${angka(v / 1e6, { desimal: 1 })}${t("dd.jt")}` : v >= 1e4 ? `${angka(v / 1e3, { desimal: 0 })}${t("dd.rb")}` : angka(v, { desimal: v < 10 && !Number.isInteger(v) ? 1 : 0 }));
const jml = (a) => a.reduce((n, v) => n + (v || 0), 0);
function stepBagus(kasar) { const e = 10 ** Math.floor(Math.log10(kasar)), f = kasar / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e; }
const tingkatPanas = (v, mx) => (!v || v <= 0 || !mx ? 0 : Math.min(5, Math.max(1, Math.ceil((5 * v) / mx))));

/* ---------------------------------------- ikon dokumen: halaman + tinjau ---------------------------------------- */
const hlmIkon = (d, r) => {
  const url = tautHal(r.sumber_url || d.sumber_url, r.halaman), tip = t("dd.hlm_n", { n: r.halaman });
  return url ? `<a class="dd-hl" href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="${esc(tip)}" aria-label="${esc(t("dd.ke_hlm", { n: r.halaman }))}">${ikon("pdf", 16)}</a>`
    : `<span class="dd-hl dd-hl-mati" role="img" tabindex="0" title="${esc(tip + ". " + t("dd.hlm_tanpa_tautan"))}" aria-label="${esc(tip)}">${ikon("pdf", 16)}</span>`;
};
const tjDot = (r) => (r.perlu_tinjau ? `<span class="dd-tj" role="img" tabindex="0" title="${esc(t("dd.tinjau_tip"))}" aria-label="${esc(t("dd.tinjau"))}"></span>` : "");
const lambang = (nama, kode) => { const k = kode || kodeProv(String(nama).replace(/\./g, "")); return k ? `<img class="dd-lam" src="/img/provinsi/${esc(k)}.png" width="24" height="24" alt="" loading="lazy" decoding="async">` : `<span class="dd-lam dd-lam-ik">${ikon("wilayah", 14)}</span>`; };

/* ---------------------------------------- model per jenis tabel ---------------------------------------- */
const adaK = (tab, k) => tab.kolom.some((c) => c.k === k);
const jenisTabel = (tab) => (tab.kolom[0]?.k === "sistem" ? "bpp" : tab.kolom[0]?.k === "tahun" ? "deret" : adaK(tab, "kelompok") && adaK(tab, "jenis") ? "ruptl" : adaK(tab, "teknologi") && adaK(tab, "mw") ? "rued" : "prov");

function modelBpp(tab) {
  const nas = tab.baris.find((r) => /NASIONAL$/.test(r.sistem)); let p = -1;
  tab.baris.forEach((r, i) => {
    r._t = tingkatNama(r.sistem); r._i = i; r._n = 0;
    if (r._t < 2) { p = i; r._p = -1; } else { r._p = p; if (p >= 0) tab.baris[p]._n++; }
    r._sel = nas && r !== nas && r._t !== 0 && r.bpp_rp_kwh != null ? Math.round((r.bpp_rp_kwh / nas.bpp_rp_kwh - 1) * 100) : null;
  });
  return { jenis: "bpp", nas, rows: tab.baris, wil: tab.baris.filter((r) => r._t === 1 && r.bpp_rp_kwh != null) };
}
function modelDeret(tab, d) {
  const kn = tab.kolom.filter((c) => c.k !== "tahun" && c.k !== "total" && c.tipe === "angka");
  const kol = tab.baris.map((b) => ({ k: String(b.tahun), label: String(b.tahun) }));
  const baris = kn.map((c) => ({ id: c.k, nama: c.label, v: Object.fromEntries(tab.baris.map((b) => [String(b.tahun), b[c.k]])) })).filter((r) => kol.some((c) => r.v[c.k]));
  const tot = adaK(tab, "total") ? Object.fromEntries(tab.baris.map((b) => [String(b.tahun), b.total])) : null;
  return { jenis: "deret", kol, baris, tot, halaman: [...new Set(tab.baris.map((b) => b.halaman))], url: d.sumber_url };
}
function modelProv(tab) {
  const nama = (tab.kolom.find((c) => c.k === "provinsi") || tab.kolom.find((c) => c.tipe !== "angka" && c.k !== "kode") || tab.kolom[0]).k;
  const urut = { false: 0, null: 1, true: 2 };
  const kol = tab.kolom.filter((c) => c.tipe === "angka" && c.k !== "total").map((c) => ({ ...c, info: jinfo(c.k) })).sort((a, b) => urut[a.info[1]] - urut[b.info[1]]);
  const adaEbt = kol.some((c) => c.info[1] === true), adaFos = kol.some((c) => c.info[1] === false);
  const TOTAL = /^(total|jumlah|nasional|indonesia)$/i, rt = tab.baris.find((r) => TOTAL.test(String(r[nama])));
  const dec = Object.fromEntries(kol.map((c) => { const v = tab.baris.map((r) => r[c.k]).filter((x) => x != null); return [c.k, v.every(Number.isInteger) ? 0 : Math.max(...v) < 100 ? 2 : 1]; }));
  const baris = tab.baris.filter((r) => r !== rt).map((r) => {
    const v = Object.fromEntries(kol.map((c) => [c.k, r[c.k]])), tot = r.total ?? jml(Object.values(v));
    const ebt = jml(kol.filter((c) => c.info[1] === true).map((c) => r[c.k]));
    return { id: r[nama], nama: nmProv(r[nama]), kode: r.kode || kodeProv(r[nama]), v, tot, pangsa: adaEbt && adaFos && tot > 0 ? (ebt / tot) * 100 : null, raw: r };
  });
  dec._tot = Math.max(0, ...Object.values(dec));
  return { jenis: "prov", kol, baris, rt, dec, adaEbt, adaFos, bands: adaEbt && adaFos, namaK: nama, totK: tab.kolom.find((c) => c.k === "total")?.label || t("dd.jumlah") };
}
function modelRuptl(tab) {
  const ky = tab.kolom.filter((c) => /^y\d{4}$/.test(c.k)), grup = [], tot = {};
  let nasional = null;
  for (const r of tab.baris) {
    if (r.kelompok === "Total") { if (r.jenis === "Jumlah") nasional = r; else tot[r.jenis] = r; continue; }
    let g = grup.find((x) => x.id === r.kelompok); if (!g) grup.push((g = { id: r.kelompok, sub: null, anak: [] }));
    if (r.jenis === "Jumlah") g.sub = r; else g.anak.push(r);
  }
  if (!nasional && Object.keys(tot).length) { nasional = { jumlah: 0 }; for (const c of ky) nasional[c.k] = jml(Object.values(tot).map((r) => r[c.k])); nasional.jumlah = jml(Object.values(tot).map((r) => r.jumlah)); nasional._est = true; }
  return { jenis: "ruptl", ky, grup, tot, nasional, jml: tab.kolom.find((c) => c.k === "jumlah") };
}
function modelRued(tab) {
  const m = new Map();
  for (const r of tab.baris) { let g = m.get(r.provinsi); if (!g) m.set(r.provinsi, (g = { id: r.provinsi, kode: r.kode, perda: r.perda, anak: [] })); g.anak.push(r); }
  const grup = [...m.values()].map((g) => ({ ...g, mw: jml(g.anak.map((a) => a.mw)) })).sort((a, b) => b.mw - a.mw);
  return { jenis: "rued", grup };
}
function siapkan(tab, d) {
  if (tab._m) return tab._m;
  const j = jenisTabel(tab);
  return (tab._m = j === "bpp" ? modelBpp(tab) : j === "deret" ? modelDeret(tab, d) : j === "ruptl" ? modelRuptl(tab) : j === "rued" ? modelRued(tab) : modelProv(tab));
}
const kunciGrup = (m) => (m.jenis === "bpp" ? m.rows.filter((r) => r._n > 0).map((r) => "i" + r._i) : m.jenis === "ruptl" ? m.grup.map((g) => g.id) : m.jenis === "rued" ? m.grup.map((g) => g.id) : []);
const bisaLipat = (m) => kunciGrup(m).length > 0;
const opsiGrup = (m) => (m.jenis === "bpp" ? m.rows.filter((r) => r._t === 1 || (r._t < 2 && r._n > 0)).map((r) => [r.sistem, nm(r.sistem)])
  : m.jenis === "prov" ? m.baris.map((r) => [r.id, r.nama]) : m.jenis === "rued" ? m.grup.map((g) => [g.id, nmProv(g.id)]) : []);
const dasar = (tab) => tab.satuan && !/ dan /.test(tab.satuan) ? tab.satuan : "";

/* ---------------------------------------- sel angka ---------------------------------------- */
const fmt = (v, dec) => (dec == null ? nilaiTeks(v) : angka(v, { desimal: dec }));
const sel = (v, lv, tip = "", dec = null) => (v == null || v === 0
  ? `<td class="dd-n"><span class="dd-nol" title="${esc(t(v === 0 ? "dd.nol" : "dd.kosong"))}">-</span></td>`
  : `<td class="dd-n dd-h${lv}"${tip ? ` title="${esc(tip)}"` : ""}>${esc(fmt(v, dec))}</td>`);

/* ---------------------------------------- BPP ---------------------------------------- */
const kelasSel = (p) => (p < 0 ? "jm-pil-ok" : Math.abs(p) < 5 ? "dd-pil-n" : Math.abs(p) < 15 ? "jm-pil-warn" : "jm-pil-bad");
function pilSelisih(m, r) {
  if (r._sel == null) return `<span class="dd-nol">-</span>`;
  const p = r._sel;
  return `<span class="jm-pil ${kelasSel(p)}" title="${esc(t("dd.selisih_tip", { rp: angka(r.bpp_rp_kwh), nas: angka(m.nas.bpp_rp_kwh, { desimal: Number.isInteger(m.nas.bpp_rp_kwh) ? 0 : 2 }) }))}">${p > 0 ? "+" : ""}${esc(angka(p))}%</span>`;
}
function barisBpp(m) {
  const q = S.q.trim().toLocaleLowerCase(), all = m.rows;
  const cocok = (r) => nm(r.sistem).toLocaleLowerCase().includes(q) || String(r.bpp_rp_kwh ?? "").includes(q) || String(r.bpp_cent_kwh ?? "").includes(q);
  return all.filter((r, i) => {
    if (S.g && !(r.sistem === S.g || (r._p >= 0 && all[r._p].sistem === S.g))) return false;
    if (q) return cocok(r) || (r._t < 2 && all.some((x) => x._p === i && cocok(x)));
    return r._t < 2 || !!S.g || S.buka.has("i" + r._p);
  });
}
function tabelBpp(d, tab, m) {
  const all = m.rows, ada = !!(S.q.trim() || S.g), b = barisBpp(m);
  const badan = b.map((r) => {
    const nama = esc(nm(r.sistem)), buka = ada || S.buka.has("i" + r._i);
    let th;
    if (r._t === 2) th = `<th scope="row" class="dd-nama dd-lk"><span class="dd-anak"><i class="dd-titik"></i><span>${nama}</span></span></th>`;
    else if (r._n > 0) th = `<th scope="row" class="dd-nama dd-lk"><button type="button" class="dd-lipat" data-buka="i${r._i}" aria-expanded="${buka}">${ikon("panah-kanan", 14)}<span class="dd-ik">${ikon(r._t === 0 ? "peta" : "wilayah", 16)}</span><span>${nama}</span><small>${esc(t("dd.n_sub", { n: angka(r._n) }))}</small></button></th>`;
    else th = `<th scope="row" class="dd-nama dd-lk"><span class="dd-anak dd-induk"><span class="dd-ik">${ikon(r._t === 0 ? "peta" : "wilayah", 16)}</span><span>${nama}</span></span></th>`;
    const v1 = r.bpp_rp_kwh == null ? `<td class="dd-n"><span class="dd-nol" title="${esc(t("dd.kosong"))}">-</span></td>` : `<td class="dd-n">${esc(nilaiTeks(r.bpp_rp_kwh))}${tjDot(r)}</td>`;
    const v2 = r.bpp_cent_kwh == null ? `<td class="dd-n"><span class="dd-nol" title="${esc(t("dd.kosong"))}">-</span></td>` : `<td class="dd-n">${esc(nilaiTeks(r.bpp_cent_kwh))}</td>`;
    return `<tr class="dd-g${r._t}">${th}${v1}${v2}<td class="dd-n dd-sel">${pilSelisih(m, r)}</td><td class="dd-h">${hlmIkon(d, r)}</td></tr>`;
  }).join("");
  const est = `<span class="dd-est" title="${esc(t("dd.est_tip"))}">${esc(t("dd.est"))}</span>`;
  const kep = `<tr><th scope="col" class="dd-nama dd-lk">${esc(tab.kolom[0].label)}</th><th scope="col" class="dd-n">${esc(tab.kolom[1].label)}</th><th scope="col" class="dd-n">${esc(tab.kolom[2].label)}</th><th scope="col" class="dd-n">${esc(t("dd.selisih"))} ${est}</th><th scope="col" class="dd-h">${esc(t("dd.hlm"))}</th></tr>`;
  const leg = `<span class="dd-leg-s">${esc(t("dd.sel.leg"))}</span><span class="jm-pil jm-pil-ok">${esc(t("dd.sel.bawah"))}</span><span class="jm-pil dd-pil-n">${esc(t("dd.sel.kecil"))}</span><span class="jm-pil jm-pil-warn">${esc(t("dd.sel.sedang"))}</span><span class="jm-pil jm-pil-bad">${esc(t("dd.sel.besar"))}</span>`;
  return { html: tabelHtml("dd-bpp", kep, badan || `<tr><td colspan="5">${esc(t("dd.tak_ada"))}</td></tr>`), leg, total: b.length, hal: false };
}
const tabelHtml = (kls, kepala, badan, kaki = "") => `<div class="jm-gulir dd-gulir"><table class="jm-tabel dd-t dd-m ${kls}" data-urut="tidak"><thead>${kepala}</thead><tbody>${badan}</tbody>${kaki ? `<tfoot>${kaki}</tfoot>` : ""}</table></div>`;

/* ---------------------------------------- deret: sumber = baris, tahun = kolom ---------------------------------------- */
function sparkline(vals) {
  const ada = vals.filter((v) => v != null); if (ada.length < 2) return "";
  const mn = Math.min(...ada), mx = Math.max(...ada), W = 84, H = 24, dx = W / (vals.length - 1);
  let dpath = "", pen = false;
  vals.forEach((v, i) => { if (v == null) { pen = false; return; } const y = H - 3 - ((v - mn) / (mx - mn || 1)) * (H - 6); dpath += `${pen ? "L" : "M"}${(i * dx).toFixed(1)} ${y.toFixed(1)}`; pen = true; });
  return `<svg class="dd-spark" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false"><path d="${dpath}"/></svg>`;
}
function tabelDeret(d, tab, m) {
  const q = S.q.trim().toLocaleLowerCase(), th = (c) => `<th scope="col" class="dd-n">${esc(c.label)}</th>`;
  const rows = m.baris.filter((r) => !q || r.nama.toLocaleLowerCase().includes(q) || jPanjang(r.id, "").toLocaleLowerCase().includes(q));
  const badan = rows.map((r) => {
    const mx = Math.max(...m.kol.map((c) => r.v[c.k] || 0)), vals = m.kol.map((c) => r.v[c.k]), i0 = jinfo(r.id);
    const cells = m.kol.map((c, i) => {
      const v = r.v[c.k], prev = i ? vals[i - 1] : null;
      const tip = v != null && prev ? t("dd.tip.ubah", { p: (v >= prev ? "+" : "") + angka(((v / prev) - 1) * 100, { desimal: 1 }), y: m.kol[i - 1].label }) : "";
      return sel(v, tingkatPanas(v, mx), tip);
    }).join("");
    return `<tr><th scope="row" class="dd-nama dd-lk" title="${esc(jPanjang(r.id, r.nama))}"><span class="dd-id"><i class="dd-sw ${i0[2]}"></i><span class="dd-ik">${jIkon(r.id)}</span><span>${esc(r.nama)}</span></span></th>${cells}<td class="dd-tren">${sparkline(vals)}</td></tr>`;
  }).join("");
  const kep = `<tr><th scope="col" class="dd-nama dd-lk">${esc(tab.kolom[0].label === "Tahun" ? t("dd.sumber_energi") : tab.kolom[0].label)}</th>${m.kol.map(th).join("")}<th scope="col" class="dd-tren">${esc(t("dd.tren"))}</th></tr>`;
  const kaki = m.tot ? `<tr class="dd-kaki"><th scope="row" class="dd-nama dd-lk">${esc(t("dd.total"))}</th>${m.kol.map((c) => `<td class="dd-n">${m.tot[c.k] == null ? `<span class="dd-nol">-</span>` : esc(nilaiTeks(m.tot[c.k]))}</td>`).join("")}<td class="dd-tren"></td></tr>` : "";
  return { html: tabelHtml("dd-deret", kep, badan || `<tr><td colspan="${m.kol.length + 2}">${esc(t("dd.tak_ada"))}</td></tr>`, kaki), total: rows.length, hal: false };
}

/* ---------------------------------------- prov: baris = provinsi, kolom = kategori ---------------------------------------- */
function barisProv(m) {
  const q = S.q.trim().toLocaleLowerCase();
  let b = m.baris.filter((r) => (!S.g || r.id === S.g) && (!q || r.nama.toLocaleLowerCase().includes(q) || Object.values(r.v).some((x) => String(x ?? "").includes(q))));
  if (S.uk) { const ak = S.uk, v = (r) => (ak === "_nama" ? r.nama : ak === "_tot" ? r.tot : ak === "_pangsa" ? r.pangsa : r.v[ak]); b = [...b].sort((a, z) => { const x = v(a), y = v(z); return ((x == null) - (y == null)) || (typeof x === "string" ? x.localeCompare(y, "id") * S.ua : (x - y) * S.ua); }); }
  return b;
}
const urutTh = (k, isi, kls = "dd-n") => `<th scope="col" class="${kls}" aria-sort="${S.uk === k ? (S.ua > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-uk="${esc(k)}">${isi}</button></th>`;
function tabelProv(d, tab, m) {
  const semua = barisProv(m), per = Math.min(Math.max(1, Math.ceil(semua.length / PER)), S.hal), potong = semua.slice((per - 1) * PER, per * PER);
  const mx = Object.fromEntries(m.kol.map((c) => [c.k, Math.max(0, ...m.baris.map((r) => r.v[c.k] || 0))]));
  const badan = potong.map((r) => {
    const cells = m.kol.map((c) => sel(r.v[c.k], tingkatPanas(r.v[c.k], mx[c.k]), "", m.dec[c.k])).join("");
    const pg = m.bands ? (r.pangsa == null ? `<td class="dd-n"><span class="dd-nol">-</span></td>` : `<td class="dd-n"><span class="jm-pil ${r.pangsa >= 30 ? "jm-pil-ok" : r.pangsa >= 10 ? "jm-pil-warn" : "dd-pil-n"}">${esc(angka(r.pangsa, { desimal: 1 }))}%</span></td>`) : "";
    return `<tr><th scope="row" class="dd-nama dd-lk"><span class="dd-id">${lambang(r.nama, r.kode)}<span class="dd-nm">${esc(r.nama)}</span>${hlmIkon(d, r.raw)}${tjDot(r.raw)}</span></th>${cells}${pg}<td class="dd-n dd-tot dd-rk">${r.tot ? esc(fmt(r.tot, m.dec._tot)) : `<span class="dd-nol">-</span>`}</td></tr>`;
  }).join("");
  const kh = (c) => urutTh(c.k, `<span class="dd-kh" title="${esc(jPanjang(c.k, c.label))}"><span class="dd-ik">${jIkon(c.k)}</span><span>${esc(c.label)}</span></span>`);
  const band = (kls, lab, kk) => (kk.length ? `<th class="dd-band ${kls}" colspan="${kk.length}">${esc(t(lab))}</th>` : "");
  const f = m.kol.filter((c) => c.info[1] === false), l = m.kol.filter((c) => c.info[1] === null), e = m.kol.filter((c) => c.info[1] === true);
  const kep = m.bands
    ? `<tr><th rowspan="2" scope="col" class="dd-nama dd-lk" aria-sort="${S.uk === "_nama" ? (S.ua > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-uk="_nama">${esc(tab.kolom[0].label)}</button></th>${band("dd-band-f", "dd.band.fosil", f)}${band("dd-band-l", "dd.band.lain", l)}${band("dd-band-e", "dd.band.ebt", e)}${urutTh("_pangsa", esc(t("dd.pangsa"))).replace("<th ", '<th rowspan="2" ')}${urutTh("_tot", esc(m.totK), "dd-n dd-rk").replace("<th ", '<th rowspan="2" ')}</tr><tr>${m.kol.map(kh).join("")}</tr>`
    : `<tr>${urutTh("_nama", esc(tab.kolom[0].label), "dd-nama dd-lk")}${m.kol.map(kh).join("")}${urutTh("_tot", esc(m.totK), "dd-n dd-rk")}</tr>`;
  const totK = Object.fromEntries(m.kol.map((c) => [c.k, m.rt ? m.rt[c.k] : jml(m.baris.map((r) => r.v[c.k]))])), totAll = m.rt ? (m.rt.total ?? jml(Object.values(totK))) : jml(m.baris.map((r) => r.tot));
  const estB = m.rt ? "" : `<span class="dd-est" title="${esc(t("dd.est_tip"))}">${esc(t("dd.est"))}</span>`;
  const ebtAll = jml(m.kol.filter((c) => c.info[1] === true).map((c) => totK[c.k]));
  const kaki = `<tr class="dd-kaki"><th scope="row" class="dd-nama dd-lk"><span>${esc(t("dd.total_nas"))}</span>${estB}</th>${m.kol.map((c) => `<td class="dd-n">${totK[c.k] ? esc(fmt(totK[c.k], m.dec[c.k])) : `<span class="dd-nol">-</span>`}</td>`).join("")}${m.bands ? `<td class="dd-n">${totAll ? esc(angka((ebtAll / totAll) * 100, { desimal: 1 })) + "%" : "-"}</td>` : ""}<td class="dd-n dd-tot dd-rk">${esc(fmt(totAll, m.dec._tot))}</td></tr>`;
  return { html: tabelHtml("dd-prov", kep, badan || `<tr><td colspan="${m.kol.length + 2}">${esc(t("dd.tak_ada"))}</td></tr>`, kaki), total: semua.length, hal: true, per };
}

/* ---------------------------------------- RUPTL: kelompok > jenis x tahun ---------------------------------------- */
const nolSemua = (r, ky) => !ky.some((c) => r[c.k]);
function tabelRuptl(d, tab, m) {
  const q = S.q.trim().toLocaleLowerCase(), mx = Math.max(1, ...m.grup.flatMap((g) => g.anak.flatMap((r) => m.ky.map((c) => r[c.k] || 0))));
  const sembunyi = (r) => !S.nol && nolSemua(r, m.ky) && !r.jumlah;
  const jsel = (r, kls = "") => m.ky.map((c) => sel(r[c.k], tingkatPanas(r[c.k], mx))).join("") + `<td class="dd-n dd-tot dd-rk ${kls}">${r.jumlah ? esc(nilaiTeks(r.jumlah)) : `<span class="dd-nol">-</span>`}</td>`;
  let n = 0;
  const badan = m.grup.map((g) => {
    const anak = g.anak.filter((r) => !sembunyi(r) && (!q || r.jenis.toLocaleLowerCase().includes(q) || jPanjang(r.jenis, "").toLocaleLowerCase().includes(q) || g.id.toLocaleLowerCase().includes(q)));
    if (q && !anak.length) return "";
    const buka = !!q || S.buka.has(g.id); n += 1 + (buka ? anak.length : 0);
    const kepG = g.sub ? m.ky.map((c) => `<td class="dd-n">${g.sub[c.k] ? esc(nilaiTeks(g.sub[c.k])) : `<span class="dd-nol">-</span>`}</td>`).join("") + `<td class="dd-n dd-tot dd-rk">${g.sub.jumlah ? esc(nilaiTeks(g.sub.jumlah)) : "-"}</td>` : `<td colspan="${m.ky.length + 1}"></td>`;
    const baris = `<tr class="dd-g1"><th scope="row" class="dd-nama dd-lk"><button type="button" class="dd-lipat" data-buka="${esc(g.id)}" aria-expanded="${buka}">${ikon("panah-kanan", 14)}<span class="dd-ik">${ikon("gedung", 16)}</span><span>${esc(g.id)}</span><small>${esc(t("dd.n_jenis", { n: angka(anak.length) }))}</small></button></th>${kepG}</tr>`;
    return baris + (buka ? anak.map((r) => {
      const i0 = jinfo(r.jenis);
      return `<tr><th scope="row" class="dd-nama dd-lk" title="${esc(jPanjang(r.jenis, r.jenis))}"><span class="dd-anak"><i class="dd-sw ${i0[2]}"></i><span class="dd-ik">${jIkon(r.jenis)}</span><span>${esc(r.jenis)}</span></span></th>${jsel(r)}</tr>`;
    }).join("") : "");
  }).join("");
  const kep = `<tr><th scope="col" class="dd-nama dd-lk">${esc(t("dd.pengembang_jenis"))}</th>${m.ky.map((c) => `<th scope="col" class="dd-n">${esc(c.label)}</th>`).join("")}<th scope="col" class="dd-n dd-rk">${esc(m.jml?.label || t("dd.jumlah"))}</th></tr>`;
  const na = m.nasional, kaki = na ? `<tr class="dd-kaki"><th scope="row" class="dd-nama dd-lk"><span>${esc(t("dd.total_th"))}</span>${na._est ? `<span class="dd-est" title="${esc(t("dd.est_tip"))}">${esc(t("dd.est"))}</span>` : ""}</th>${m.ky.map((c) => `<td class="dd-n">${na[c.k] ? esc(nilaiTeks(na[c.k])) : `<span class="dd-nol">-</span>`}</td>`).join("")}<td class="dd-n dd-tot dd-rk">${na.jumlah ? esc(nilaiTeks(na.jumlah)) : "-"}</td></tr>` : "";
  return { html: tabelHtml("dd-ruptl", kep, badan || `<tr><td colspan="${m.ky.length + 2}">${esc(t("dd.tak_ada"))}</td></tr>`, kaki), total: n, hal: false };
}

/* ---------------------------------------- RUED: provinsi > teknologi ---------------------------------------- */
function tabelRued(d, tab, m) {
  const q = S.q.trim().toLocaleLowerCase();
  const badan = m.grup.filter((g) => (!S.g || g.id === S.g) && (!q || nmProv(g.id).toLocaleLowerCase().includes(q) || g.anak.some((a) => labelTek(a.teknologi).toLocaleLowerCase().includes(q) || String(a.mw).includes(q)))).map((g) => {
    const buka = !!(q || S.g) || S.buka.has(g.id), anak = q ? g.anak.filter((a) => labelTek(a.teknologi).toLocaleLowerCase().includes(q) || String(a.mw).includes(q) || nmProv(g.id).toLocaleLowerCase().includes(q)) : g.anak;
    const ind = `<tr class="dd-g1"><th scope="row" class="dd-nama dd-lk" title="${esc(t("dd.rued.kode", { k: g.kode || "-" }))}"><button type="button" class="dd-lipat" data-buka="${esc(g.id)}" aria-expanded="${buka}">${ikon("panah-kanan", 14)}${lambang(g.id, g.kode)}<span>${esc(nmProv(g.id))}</span><small>${esc(t("dd.n_tek", { n: angka(g.anak.length) }))}</small></button></th><td class="dd-c"><span class="jm-pil">${esc(t("dd.rued.perda", { n: g.perda }))}</span></td><td class="dd-n dd-tot">${esc(nilaiTeks(g.mw))}</td><td class="dd-h"></td></tr>`;
    return ind + (buka ? anak.map((a) => {
      const i0 = jinfo(a.teknologi);
      return `<tr><th scope="row" class="dd-nama dd-lk"><span class="dd-anak"><i class="dd-sw ${i0[2]}"></i><span class="dd-ik">${jIkon(a.teknologi)}</span><span>${esc(labelTek(a.teknologi))}</span></span></th><td class="dd-c">${a.tahun ? `<span class="jm-pil dd-pil-n">${esc(t("dd.rued.tahun", { y: a.tahun }))}</span>` : `<span class="dd-nol" title="${esc(t("dd.rued.tanpa_tahun"))}">-</span>`}</td><td class="dd-n">${esc(nilaiTeks(a.mw))}</td><td class="dd-h">${hlmIkon(d, a)}${tjDot(a)}</td></tr>`;
    }).join("") : "");
  }).join("");
  const kep = `<tr><th scope="col" class="dd-nama dd-lk">${esc(t("dd.rued.kol_tek"))}</th><th scope="col" class="dd-c">${esc(t("dd.rued.kol_tahun"))}</th><th scope="col" class="dd-n">${esc(t("dd.rued.kol_mw"))}</th><th scope="col" class="dd-h">${esc(t("dd.hlm"))}</th></tr>`;
  const kaki = `<tr class="dd-kaki"><th scope="row" class="dd-nama dd-lk"><span>${esc(t("dd.total_nas"))}</span><span class="dd-est" title="${esc(t("dd.est_tip"))}">${esc(t("dd.est"))}</span></th><td></td><td class="dd-n dd-tot">${esc(fmt(jml(m.grup.map((g) => g.mw)), 1))}</td><td></td></tr>`;
  return { html: tabelHtml("dd-rued", kep, badan || `<tr><td colspan="4">${esc(t("dd.tak_ada"))}</td></tr>`, kaki), total: m.grup.length, hal: false };
}

/* ---------------------------------------- tabel: pilih perender ---------------------------------------- */
function rakitTabel() {
  const d = S.dok, tab = d.tabel[S.tab], m = siapkan(tab, d);
  return (m.jenis === "bpp" ? tabelBpp : m.jenis === "deret" ? tabelDeret : m.jenis === "ruptl" ? tabelRuptl : m.jenis === "rued" ? tabelRued : tabelProv)(d, tab, m);
}
function gambarTabel() {
  const r = rakitTabel();
  $("ddTabel").innerHTML = r.html + (r.hal ? paginasiHtml({ hal: r.per, total: r.total, per: PER, satuan: "dd.satuan_baris" }) : "");
  const leg = $("ddLeg"); if (leg) leg.innerHTML = r.leg || "";
  const sg = $("ddGrup"); if (sg && sg.value !== S.g) sg.value = S.g;
  lukis();
}

/* ---------------------------------------- grafik: konfigurasi per jenis ---------------------------------------- */
const tipHtml = ({ judul, sub = "", baris = [], total = "", ekstra = "" }) => `<div class="dd-tip-j">${judul}</div>${sub ? `<div class="dd-tip-s">${sub}</div>` : ""}${baris.length ? `<ul>${baris.slice(0, 8).map(([k, l, v]) => `<li><i class="dd-sw ${k}"></i><span>${l}</span><b>${v}</b></li>`).join("")}${baris.length > 8 ? `<li class="dd-tip-l"><span></span><span>${esc(t("dd.tip.lainnya", { n: baris.length - 8 }))}</span></li>` : ""}</ul>` : ""}${total ? `<div class="dd-tip-t">${total}</div>` : ""}${ekstra ? `<div class="dd-tip-x">${ekstra}</div>` : ""}`;
const spanPil = (kls, teks) => `<span class="jm-pil ${kls}">${esc(teks)}</span>`;
const pecahTotal = (seriHid, kolSeri, ki) => {
  const v = kolSeri.filter((s) => !seriHid.has(s.id)); let e = 0, f = 0;
  for (const s of v) { const x = s.nilai[ki] || 0; if (s.ebt === true) e += x; else if (s.ebt === false) f += x; }
  return { e, f };
};
function cfgBpp(d, tab, m) {
  const w = m.wil; if (w.length < 3) return null;
  const nas = m.nas?.bpp_rp_kwh, atas = (r) => nas != null && r.bpp_rp_kwh > nas;
  return {
    mode: "kolom", slot: 26, satuan: "Rp/kWh", judul: t("dd.graf"), sub: t("dd.graf_tip"), klik: true, nilaiAtas: true,
    kat: w.map((r) => ({ id: r.sistem, label: nm(r.sistem), pend: nm(r.sistem) })),
    seri: [{ id: "atas", label: t("dd.leg.atas"), kls: "dd-c-atas", nilai: w.map((r) => (atas(r) ? r.bpp_rp_kwh : null)), tetap: true }, { id: "bawah", label: t("dd.leg.bawah"), kls: "dd-c-bawah", nilai: w.map((r) => (atas(r) ? null : r.bpp_rp_kwh)), tetap: true }],
    garis: nas != null ? { v: nas, label: t("dd.leg_nasional", { v: angka(nas, { desimal: Number.isInteger(nas) ? 0 : 2 }) }) } : null,
    pilih: (ki) => w[ki].sistem === S.g,
    aria: (ki) => `${nm(w[ki].sistem)}: ${angka(w[ki].bpp_rp_kwh)} Rp/kWh`,
    tip: (ki) => {
      const r = w[ki], p = r._sel;
      return tipHtml({ judul: esc(nm(r.sistem)), sub: esc(t("dd.tip.bpp_rp", { v: angka(r.bpp_rp_kwh) })) + (r.bpp_cent_kwh != null ? `<br>${esc(t("dd.tip.bpp_usd", { v: angka(r.bpp_cent_kwh, { desimal: 2 }) }))}` : ""),
        total: p == null ? "" : `${spanPil(kelasSel(p), (p > 0 ? "+" : "") + angka(p) + "%")} ${esc(t("dd.tip.vs_nas"))} <span class="dd-est">${esc(t("dd.est"))}</span>`,
        ekstra: `${r._n ? esc(t("dd.n_sub", { n: angka(r._n) })) + "<br>" : ""}${esc(t("dd.tip.hlm", { n: r.halaman }))}<br><em>${esc(t(S.g === r.sistem ? "dd.tip.klik_lagi" : "dd.tip.klik"))}</em>` });
    },
    onKlik: (ki) => { S.g = S.g === w[ki].sistem ? "" : w[ki].sistem; S.hal = 1; gambarTabel(); },
  };
}
function cfgDeret(d, tab, m) {
  const seri = m.baris.map((r) => ({ id: r.id, label: r.nama, kls: jinfo(r.id)[2], ebt: jinfo(r.id)[1], nilai: m.kol.map((c) => r.v[c.k] || 0) }));
  return {
    mode: "area", slot: 40, satuan: dasar(tab), judul: t("dd.g.deret", { s: dasar(tab) }), sub: t("dd.g.sub_leg"),
    kat: m.kol.map((c) => ({ id: c.k, label: c.label, pend: c.label })), seri,
    aria: (ki) => `${m.kol[ki].label}: ${angka(jml(seri.map((s) => s.nilai[ki])))}`,
    tip: (ki) => {
      const v = seri.filter((s) => !G.hid.has(s.id) && s.nilai[ki]).sort((a, b) => b.nilai[ki] - a.nilai[ki]), tt = jml(v.map((s) => s.nilai[ki]));
      const { e, f } = pecahTotal(G.hid, seri, ki);
      return tipHtml({ judul: esc(m.kol[ki].label), baris: v.map((s) => [s.kls, esc(s.label), `${esc(nilaiTeks(s.nilai[ki]))}${ki && s.nilai[ki - 1] ? ` <small class="${s.nilai[ki] >= s.nilai[ki - 1] ? "dd-naik" : "dd-turun"}">${s.nilai[ki] >= s.nilai[ki - 1] ? "+" : ""}${esc(angka((s.nilai[ki] / s.nilai[ki - 1] - 1) * 100, { desimal: 1 }))}%</small>` : ""}`]),
        total: `${esc(t("dd.total"))} ${esc(nilaiTeks(tt))} ${esc(dasar(tab))}`, ekstra: tt && (e || f) ? esc(t("dd.tip.pangsa", { p: angka((e / tt) * 100, { desimal: 1 }) })) : "" });
    },
  };
}
function cfgProv(d, tab, m) {
  const urut = [...m.baris].sort((a, b) => b.tot - a.tot), seri = m.kol.map((c) => ({ id: c.k, label: c.label, kls: c.info[2], ebt: c.info[1], nilai: urut.map((r) => r.v[c.k] || 0), tip: jPanjang(c.k, c.label) }));
  return {
    mode: "kolom", slot: 22, satuan: dasar(tab), judul: t("dd.g.prov", { s: dasar(tab) }), sub: t("dd.g.sub_klik"), klik: true,
    kat: urut.map((r) => ({ id: r.id, kode: r.kode, label: r.nama, pend: singkatProv(r.kode) || r.nama })), seri,
    pilih: (ki) => urut[ki].id === S.g,
    aria: (ki) => `${urut[ki].nama}: ${angka(urut[ki].tot)}`,
    tip: (ki) => {
      const r = urut[ki], v = seri.filter((s) => s.nilai[ki]).sort((a, b) => b.nilai[ki] - a.nilai[ki]);
      return tipHtml({ judul: `<span class="dd-tipid">${lambang(r.nama, r.kode)}${esc(r.nama)}</span>`, baris: v.map((s) => [s.kls, esc(s.label), esc(nilaiTeks(s.nilai[ki]))]),
        total: `${esc(t("dd.total"))} ${esc(nilaiTeks(r.tot))} ${esc(dasar(tab))}`, ekstra: `${r.pangsa != null ? esc(t("dd.tip.pangsa", { p: angka(r.pangsa, { desimal: 1 }) })) + "<br>" : ""}<em>${esc(t(S.g === r.id ? "dd.tip.klik_lagi" : "dd.tip.klik"))}</em>` });
    },
    onKlik: (ki) => { S.g = S.g === urut[ki].id ? "" : urut[ki].id; S.hal = 1; gambarTabel(); },
  };
}
function cfgRuptl(d, tab, m) {
  const jen = Object.keys(m.tot).filter((j) => m.ky.some((c) => m.tot[j][c.k]));
  const seri = jen.map((j) => ({ id: j, label: j, kls: jinfo(j)[2], ebt: jinfo(j)[1], nilai: m.ky.map((c) => m.tot[j][c.k] || 0) }));
  const lain = lawanRuptl(d, tab), banding = S.band && lain;
  const nilaiLain = (j, ki) => lain?.m.tot[j]?.[lain.m.ky[ki].k] || 0;
  return {
    mode: "kolom", slot: 46, satuan: "MW", judul: t("dd.g.ruptl"), sub: t("dd.g.sub_leg"), nilaiAtas: true,
    kat: m.ky.map((c) => ({ id: c.k, label: c.label, pend: c.label })), seri,
    tanda: banding ? m.ky.map((c, ki) => jml(jen.filter((j) => !G.hid.has(j)).map((j) => nilaiLain(j, ki)))) : null, tandaLabel: banding ? labelTabel(lain.tab) : "",
    aria: (ki) => `${m.ky[ki].label}: ${angka(jml(seri.map((s) => s.nilai[ki])))} MW`,
    tip: (ki) => {
      const v = seri.filter((s) => !G.hid.has(s.id) && (s.nilai[ki] || (banding && nilaiLain(s.id, ki)))).sort((a, b) => b.nilai[ki] - a.nilai[ki]), tt = jml(v.map((s) => s.nilai[ki])), { e, f } = pecahTotal(G.hid, seri, ki);
      const bar = v.map((s) => { const x = s.nilai[ki]; let isi = esc(nilaiTeks(x) || "-"); if (banding) { const o = nilaiLain(s.id, ki), df = o - x; isi += ` <small class="dd-lain">${esc(labelTabel(lain.tab))} ${esc(nilaiTeks(o))}${df ? ` <b class="${df > 0 ? "dd-naik" : "dd-turun"}">${df > 0 ? "+" : ""}${esc(nilaiTeks(df))}</b>` : ""}</small>`; } return [s.kls, esc(s.label), isi]; });
      return tipHtml({ judul: esc(m.ky[ki].label), baris: bar, total: `${esc(t("dd.total"))} ${esc(nilaiTeks(tt))} MW`, ekstra: tt ? `${esc(t("dd.tip.pangsa", { p: angka((e / tt) * 100, { desimal: 1 }) }))}<br>${esc(t("dd.tip.hlm", { n: d.tabel[S.tab].baris[0]?.halaman }))}` : "" });
    },
  };
}
function lawanRuptl(d, tab) {
  const i = d.tabel.findIndex((x) => x !== tab && jenisTabel(x) === "ruptl"); if (i < 0) return null;
  return { tab: d.tabel[i], m: siapkan(d.tabel[i], d) };
}
function cfgRued(d, tab, m) {
  const tek = [...new Set(m.grup.flatMap((g) => g.anak.map((a) => a.teknologi)))], urut = m.grup;
  const seri = tek.map((k) => ({ id: k, label: labelTek(k), kls: jinfo(k)[2], ebt: true, nilai: urut.map((g) => jml(g.anak.filter((a) => a.teknologi === k).map((a) => a.mw))) }));
  return {
    mode: "kolom", slot: 40, satuan: "MW", judul: t("dd.g.rued"), sub: t("dd.g.sub_klik"), klik: true, nilaiAtas: true,
    kat: urut.map((g) => ({ id: g.id, kode: g.kode, label: nmProv(g.id), pend: singkatProv(g.kode) || nmProv(g.id) })), seri,
    pilih: (ki) => urut[ki].id === S.g,
    aria: (ki) => `${nmProv(urut[ki].id)}: ${angka(urut[ki].mw)} MW`,
    tip: (ki) => { const g = urut[ki], v = seri.filter((s) => !G.hid.has(s.id) && s.nilai[ki]).sort((a, b) => b.nilai[ki] - a.nilai[ki]);
      return tipHtml({ judul: `<span class="dd-tipid">${lambang(g.id, g.kode)}${esc(nmProv(g.id))}</span>`, sub: esc(t("dd.rued.perda", { n: g.perda })), baris: v.map((s) => [s.kls, esc(s.label), esc(nilaiTeks(s.nilai[ki]))]), total: `${esc(t("dd.total"))} ${esc(nilaiTeks(jml(v.map((s) => s.nilai[ki]))))} MW`, ekstra: `<em>${esc(t(S.g === g.id ? "dd.tip.klik_lagi" : "dd.tip.klik"))}</em>` }); },
    onKlik: (ki) => { S.g = S.g === urut[ki].id ? "" : urut[ki].id; gambarTabel(); },
  };
}
function cfgGrafik() {
  const d = S.dok, tab = d.tabel[S.tab], m = siapkan(tab, d);
  return (m.jenis === "bpp" ? cfgBpp : m.jenis === "deret" ? cfgDeret : m.jenis === "ruptl" ? cfgRuptl : m.jenis === "rued" ? cfgRued : cfgProv)(d, tab, m);
}

/* ---------------------------------------- grafik: gambar SVG ukuran nyata, legenda, tooltip ---------------------------------------- */
function lukis() {
  const svg = $("ddSvg"); if (!svg || !G.cfg) return;
  const c = G.cfg, n = c.kat.length, sc = $("ddGs"), H = 280, mL = 52, mT = 26, mR = c.garis ? 118 : 10;
  const maxLab = Math.max(...c.kat.map((k) => k.pend.length)), W = Math.max(sc.clientWidth || 600, n * c.slot + mL + mR);
  const slot = (W - mL - mR) / n, rot = slot < maxLab * 6.4, kd = (k) => k.kode || kodeProv(String(k.label).replace(/\./g, "")), ik = c.kat.some(kd) ? 18 : 0, mB = (rot ? Math.min(100, 14 + maxLab * 5.6) : 30) + ik, ph = H - mT - mB;
  const vis = c.seri.map((_, i) => i).filter((i) => !G.hid.has(c.seri[i].id));
  const tot = c.kat.map((_, ki) => vis.reduce((a, si) => a + (c.seri[si].nilai[ki] || 0), 0));
  const mx = Math.max(1, ...tot, c.garis?.v || 0, ...(c.tanda || []).map((v) => v || 0)), step = stepBagus(mx / 4), top = Math.ceil(mx / step) * step;
  const y = (v) => mT + ph * (1 - v / top), cx = (ki) => mL + slot * (ki + 0.5);
  let o = "";
  for (let v = 0; v <= top + 1e-9; v += step) o += `<line class="dd-grid" x1="${mL}" x2="${W - mR}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="dd-ax" x="${mL - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${esc(ringkas(v))}</text>`;
  if (c.mode === "area" && n > 1) {
    let lo = new Array(n).fill(0);
    for (const si of vis) { const s = c.seri[si], hi = lo.map((a, ki) => a + (s.nilai[ki] || 0)); const atas = hi.map((v, ki) => `${cx(ki).toFixed(1)} ${y(v).toFixed(1)}`), bawah = lo.map((v, ki) => `${cx(ki).toFixed(1)} ${y(v).toFixed(1)}`).reverse();
      o += `<path class="dd-area ${s.kls}" d="M${atas.join("L")}L${bawah.join("L")}Z"><title>${esc(s.label)}</title></path>`; lo = hi; }
  } else {
    c.kat.forEach((k, ki) => {
      let base = 0; const bw = Math.min(slot * 0.7, 44), x = cx(ki) - bw / 2;
      for (const si of vis) { const v = c.seri[si].nilai[ki]; if (!v) continue; const y1 = y(base + v), y0 = y(base); o += `<rect class="dd-bar ${c.seri[si].kls}${c.pilih?.(ki) ? " dd-pilih" : ""}" data-ki="${ki}" x="${x.toFixed(1)}" y="${y1.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0, y0 - y1).toFixed(1)}" rx="2"/>`; base += v; }
      if ((c.nilaiAtas || n <= 14) && slot >= 24 && tot[ki]) o += `<text class="dd-vl" data-ki="${ki}" x="${cx(ki).toFixed(1)}" y="${(y(tot[ki]) - 5).toFixed(1)}" text-anchor="middle">${esc(ringkas(tot[ki]))}</text>`;
    });
  }
  if (c.tanda) c.tanda.forEach((v, ki) => { if (v) o += `<line class="dd-mark" x1="${(cx(ki) - slot * 0.4).toFixed(1)}" x2="${(cx(ki) + slot * 0.4).toFixed(1)}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/>`; });
  if (c.garis) o += `<line class="dd-nas" x1="${mL}" x2="${W - mR + 4}" y1="${y(c.garis.v).toFixed(1)}" y2="${y(c.garis.v).toFixed(1)}"/><text class="dd-nas-t" x="${W - mR + 8}" y="${(y(c.garis.v) + 4).toFixed(1)}" text-anchor="start">${esc(c.garis.label)}</text>`;
  c.kat.forEach((k, ki) => {
    const lab = k.pend.length > 15 ? k.pend.slice(0, 14) + "…" : k.pend, xx = cx(ki).toFixed(1), yy = (mT + ph + 14 + ik).toFixed(1);
    if (kd(k)) o += `<image href="/img/provinsi/${esc(kd(k))}.png" x="${(cx(ki) - 8).toFixed(1)}" y="${(mT + ph + 3).toFixed(1)}" width="16" height="16" preserveAspectRatio="xMidYMid meet"/>`;
    o += rot ? `<text class="dd-ax dd-eks" data-ki="${ki}" x="${xx}" y="${yy}" text-anchor="end" transform="rotate(-55 ${xx} ${yy})">${esc(lab)}</text>` : `<text class="dd-ax dd-eks" data-ki="${ki}" x="${xx}" y="${(mT + ph + 18 + ik).toFixed(1)}" text-anchor="middle">${esc(lab)}</text>`;
  });
  c.kat.forEach((k, ki) => { o += `<rect class="dd-hit" data-ki="${ki}" tabindex="0" role="img" aria-label="${esc(c.aria(ki))}" x="${(mL + slot * ki).toFixed(1)}" y="${mT}" width="${slot.toFixed(1)}" height="${ph.toFixed(1)}"/>`; });
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("width", W); svg.setAttribute("height", H); svg.innerHTML = o;
  G.geo = { mL, slot };
  $("ddLegS").innerHTML = c.seri.map((s) => (s.tetap ? `<span class="dd-leg dd-leg-t"><i class="dd-sw ${s.kls}"></i>${esc(s.label)}</span>` : `<button type="button" class="dd-leg${G.hid.has(s.id) ? " dd-mati" : ""}" data-seri="${esc(s.id)}" aria-pressed="${!G.hid.has(s.id)}" title="${esc(s.tip || s.label)}"><i class="dd-sw ${s.kls}"></i>${esc(s.label)}</button>`)).join("")
    + (c.tanda ? `<span class="dd-leg dd-leg-t"><i class="dd-sw dd-sw-mark"></i>${esc(c.tandaLabel)}</span>` : "");
}
function sorot(ki) {
  const svg = $("ddSvg"), tip = $("ddTip"); if (!svg || !G.cfg) return;
  svg.classList.toggle("dd-ada", ki != null);
  svg.querySelectorAll("[data-ki]").forEach((e) => e.classList.toggle("dd-on", e.dataset.ki === String(ki)));
  if (ki == null) { tip.hidden = true; return; }
  tip.innerHTML = G.cfg.tip(ki); tip.hidden = false;
  const wb = $("ddGw").clientWidth, tw = tip.offsetWidth, x = G.geo.mL + G.geo.slot * (ki + 0.5) - $("ddGs").scrollLeft;
  let l = x + 16; if (l + tw > wb) l = x - 16 - tw; if (l < 0) l = Math.max(0, (wb - tw) / 2);
  tip.style.setProperty("left", `${l}px`); tip.style.setProperty("top", "6px");
}
function kerangkaGrafik(c) {
  const lawan = S.dok.tabel[S.tab] && jenisTabel(S.dok.tabel[S.tab]) === "ruptl" && lawanRuptl(S.dok, S.dok.tabel[S.tab]);
  return `<figure class="dd-graf${c.klik ? " dd-klik" : ""}"><figcaption><span class="dd-g-j">${ikon("grafik", 16)}<b>${esc(c.judul)}</b></span><span class="dd-g-s">${esc(c.sub)}</span>${lawan ? `<button type="button" class="dd-tog" data-band="1" aria-pressed="${S.band}">${esc(t("dd.band_skenario"))}</button>` : ""}</figcaption><div class="dd-legenda" id="ddLegS"></div><div class="dd-gw" id="ddGw"><div class="dd-gs" id="ddGs"><svg class="dd-svg" id="ddSvg" role="group" aria-label="${esc(c.judul)}"></svg></div><div class="dd-tip" id="ddTip" role="status" hidden></div></div></figure>`;
}

/* ---------------------------------------- kepala dokumen + badan ---------------------------------------- */
const infoHtml = (baris) => {
  const isi = baris.filter(Boolean).map((x) => `<p>${esc(x)}</p>`).join("");
  return isi ? `<details class="dd-info"><summary aria-label="${esc(t("dd.info"))}" title="${esc(t("dd.info"))}">${ikon("info", 18)}</summary><div class="dd-pop">${isi}</div></details>` : "";
};
function gambarDok() {
  const d = S.dok, tab = d.tabel[S.tab], m = siapkan(tab, d);
  d.tabel.forEach((x) => siapkan(x, d));
  G.cfg = cfgGrafik(); G.hid = new Set();
  const g = opsiGrup(m), kg = m.jenis === "bpp" ? "wilayah" : "provinsi";
  const pilTabel = d.tabel.length > 1 ? `<div class="dd-seg" role="group" aria-label="${esc(t("dd.tabel"))}">${d.tabel.map((x, i) => `<button type="button" data-tab="${i}" aria-pressed="${i === S.tab}" title="${esc(x.judul)}"><b>${esc(labelTabel(x))}</b><small>${esc(t("dd.n_baris", { n: angka(x.jumlah_baris) }))}</small></button>`).join("")}</div>` : "";
  const sub = `<span class="jm-pil">${ikon("kalender", 14)}${esc(tglDok(d.tanggal_dokumen))}</span><span class="jm-pil">${ikon(d.metode === "ocr-vision" ? "gambar" : "pdf", 14)}${esc(t("dd.metode." + d.metode))}</span>${infoHtml([d.catatan, d.versi && t("dd.versi", { v: d.versi })])}`;
  const sumber = http(d.sumber_url) ? `<a class="dd-sumber" href="${esc(d.sumber_url)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}<span>${esc(t("dd.sumber"))}</span></a>` : "";
  const pilih = g.length > 1 ? pilihHtml({ id: "ddGrup", ikon: "wilayah", label: t(kg === "wilayah" ? "dd.wilayah" : "dd.provinsi"), nilai: S.g, opsi: [["", t(kg === "wilayah" ? "dd.semua_wilayah" : "dd.semua_provinsi")], ...g] }) : "";
  const tog = bisaLipat(m) ? `<button type="button" class="dd-tog" data-semua="buka">${esc(t("dd.buka_semua"))}</button><button type="button" class="dd-tog" data-semua="lipat">${esc(t("dd.lipat_semua"))}</button>` : "";
  const nol = m.jenis === "ruptl" ? `<button type="button" class="dd-tog" data-nol="1" aria-pressed="${S.nol}">${esc(t("dd.baris_kosong"))}</button>` : "";
  const halaman = m.jenis === "deret" || m.jenis === "ruptl" ? [...new Set(tab.baris.map((r) => r.halaman))].map((n) => { const url = tautHal(d.sumber_url, n); return url ? `<a class="dd-hl dd-hl-b" href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="${esc(t("dd.ke_hlm", { n }))}">${ikon("pdf", 14)}<span>${esc(t("dd.hlm_n", { n }))}</span></a>` : `<span class="dd-hl dd-hl-b dd-hl-mati" title="${esc(t("dd.hlm_tanpa_tautan"))}">${ikon("pdf", 14)}<span>${esc(t("dd.hlm_n", { n }))}</span></span>`; }).join("") : "";
  const satuan = tab.satuan ? `<span class="dd-satuan">${ikon("tabel", 14)}${esc(t("dd.satuan_l", { s: tab.satuan }))}</span>` : "";
  $("ddDok").innerHTML = `<section class="jm-ex dd-ex" id="ddEx"><header class="jm-ex-hd"><div class="jm-ex-teks"><span class="jm-ex-ey dd-ey">${logoHtml(d.penerbit, 22)}${esc(d.penerbit)}</span><h2 class="jm-ex-j">${esc(d.judul)}</h2><div class="dd-pils">${sub}</div></div><div class="jm-ex-aksi dd-aksi">${sumber}${aksiHtml({ csv: true, png: false, pdf: false, bagi: false })}</div></header>
  <div class="jm-ex-bd">${pilTabel}${G.cfg ? kerangkaGrafik(G.cfg) : ""}<div class="dd-alat">${cariHtml({ id: "ddCari", label: t("dd.cari"), placeholder: t("dd.cari") })}${pilih}${tog}${nol}${infoHtml([tab.catatan])}</div><div class="dd-strip">${satuan}${halaman}<span class="dd-legs" id="ddLeg"></span></div><div id="ddTabel"></div></div></section>`;
  $("ddCari").value = S.q;
  $("ddEx").addEventListener("jm:csv", (e) => { e.detail.baris = csvBaris(); });
  gambarTabel();
}
function csvBaris() {
  const d = S.dok, tab = d.tabel[S.tab], m = siapkan(tab, d), v = (x) => (x == null ? "" : x);
  if (m.jenis === "bpp") return [[...tab.kolom.map((c) => c.label), t("dd.selisih"), t("dd.hlm")], ...barisBpp(m).map((r) => [nm(r.sistem), v(r.bpp_rp_kwh), v(r.bpp_cent_kwh), v(r._sel), r.halaman])];
  if (m.jenis === "deret") return [[t("dd.sumber_energi"), ...m.kol.map((c) => c.label)], ...m.baris.map((r) => [r.nama, ...m.kol.map((c) => v(r.v[c.k]))])];
  if (m.jenis === "ruptl") return [[t("dd.pengembang_jenis"), ...m.ky.map((c) => c.label), m.jml?.label || t("dd.jumlah")], ...m.grup.flatMap((g) => g.anak.map((r) => [`${g.id} / ${r.jenis}`, ...m.ky.map((c) => v(r[c.k])), v(r.jumlah)]))];
  if (m.jenis === "rued") return [[t("dd.provinsi"), t("dd.rued.kol_tek"), t("dd.rued.kol_tahun"), t("dd.rued.kol_mw"), t("dd.hlm")], ...m.grup.flatMap((g) => g.anak.map((a) => [nmProv(g.id), labelTek(a.teknologi), v(a.tahun), a.mw, a.halaman]))];
  return [[tab.kolom[0].label, ...m.kol.map((c) => c.label), m.totK], ...barisProv(m).map((r) => [r.nama, ...m.kol.map((c) => v(r.v[c.k])), r.tot])];
}

function bukaAwal(m) { const k = kunciGrup(m); return new Set(m.jenis === "ruptl" || m.jenis === "rued" ? k.slice(0, 1) : []); }
function gambarKartu() {
  $("ddKartu").innerHTML = S.idx.dokumen.map((d) => `<button type="button" class="dd-kartu" data-id="${esc(d.id)}" aria-pressed="${S.dok?.id === d.id}" title="${esc(d.judul)}"><span class="dd-k-atas"><span class="dd-logo">${logoHtml(d.penerbit)}</span><span class="jm-pil">${esc(tahunDok(d.tanggal_dokumen))}</span></span><b class="dd-k-j">${esc(judulPendek(d))}</b><span class="dd-k-r"><span>${ikon("tabel", 14)}${esc(t("dd.n_tabel", { n: angka(d.tabel.length) }))}</span><span>${ikon("daftar", 14)}${esc(t("dd.n_baris", { n: angka(d.tabel.reduce((n, tb) => n + tb.jumlah_baris, 0)) }))}</span></span></button>`).join("");
}
function ulangTab() { S.hal = 1; S.uk = null; S.q = ""; S.g = ""; S.band = false; S.nol = false; S.buka = bukaAwal(siapkan(S.dok.tabel[S.tab], S.dok)); }
async function pilihDok(id) {
  S.tab = 0;
  document.querySelectorAll(".dd-kartu").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
  $("ddDok").innerHTML = hantuHtml(4);
  try { S.dok = await muatData(`dokumen/${id}.json`); } catch (e) { return tampilGalat($("ddDok"), () => pilihDok(id)); }
  ulangTab(); gambarDok();
}

let wkt = 0, wlr = 0;
async function mulai() {
  await mulaiHalaman();
  const isi = $("isi");
  isi.innerHTML = hantuHtml(4);
  try { S.idx = await muatData("dokumen_data.json"); } catch (e) { return tampilGalat(isi, mulai); }
  const x = S.idx, tinjau = x.dokumen.reduce((n, d) => n + d.tabel.reduce((m, tb) => m + tb.perlu_tinjau, 0), 0);
  khUbin("ubin", [{ ikon: "pdf", nilai: angka(x.jumlah_dokumen), label: t("dd.u.dokumen") }, { ikon: "tabel", nilai: angka(x.jumlah_tabel), label: t("dd.u.tabel") }, { ikon: "daftar", nilai: angka(x.jumlah_baris), label: t("dd.u.baris") }, { ikon: "peringatan", nilai: angka(tinjau), label: t("dd.u.tinjau") }]);
  isi.innerHTML = `<div class="dd-dok" id="ddKartu"></div><div id="ddDok"></div>`;
  gambarKartu();
  isi.addEventListener("click", (e) => {
    const h = e.target.closest(".dd-hit"); if (h) { G.cfg?.onKlik?.(+h.dataset.ki); return; }
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.id) pilihDok(b.dataset.id);
    else if (b.dataset.tab != null) { S.tab = +b.dataset.tab; ulangTab(); gambarDok(); }
    else if (b.dataset.uk) { S.ua = S.uk === b.dataset.uk ? -S.ua : 1; S.uk = b.dataset.uk; S.hal = 1; gambarTabel(); }
    else if (b.dataset.hal) { S.hal = +b.dataset.hal; gambarTabel(); }
    else if (b.dataset.buka) { const k = b.dataset.buka; S.buka.has(k) ? S.buka.delete(k) : S.buka.add(k); gambarTabel(); }
    else if (b.dataset.semua) { S.buka = b.dataset.semua === "buka" ? new Set(kunciGrup(siapkan(S.dok.tabel[S.tab], S.dok))) : new Set(); S.q = ""; S.g = ""; gambarTabel(); }
    else if (b.dataset.nol) { S.nol = !S.nol; b.setAttribute("aria-pressed", String(S.nol)); gambarTabel(); }
    else if (b.dataset.band) { S.band = !S.band; b.setAttribute("aria-pressed", String(S.band)); G.cfg = cfgGrafik(); lukis(); }
    else if (b.dataset.seri != null) { const k = b.dataset.seri; G.hid.has(k) ? G.hid.delete(k) : G.hid.add(k); lukis(); }
  });
  isi.addEventListener("keydown", (e) => { const h = e.target.closest?.(".dd-hit"); if (h && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); G.cfg?.onKlik?.(+h.dataset.ki); } });
  isi.addEventListener("pointerover", (e) => { const h = e.target.closest?.(".dd-hit"); if (h) sorot(+h.dataset.ki); });
  isi.addEventListener("pointerout", (e) => { if (e.target.closest?.(".dd-hit") && !e.relatedTarget?.closest?.(".dd-hit")) sorot(null); });
  isi.addEventListener("focusin", (e) => { const h = e.target.closest?.(".dd-hit"); if (h) sorot(+h.dataset.ki); });
  isi.addEventListener("focusout", (e) => { if (e.target.closest?.(".dd-hit")) sorot(null); });
  document.addEventListener("pointerdown", (e) => { if (!e.target.closest?.(".dd-gw")) sorot(null); });
  window.addEventListener("resize", () => { clearTimeout(wlr); wlr = setTimeout(lukis, 150); });
  isi.addEventListener("input", (e) => { if (e.target.id === "ddCari") { S.q = e.target.value; S.hal = 1; clearTimeout(wkt); wkt = setTimeout(gambarTabel, 120); } });
  isi.addEventListener("change", (e) => { if (e.target.id === "ddGrup") { S.g = e.target.value; S.hal = 1; gambarTabel(); } });
  document.addEventListener("click", (e) => document.querySelectorAll("details.dd-info[open]").forEach((p) => { if (!p.contains(e.target)) p.open = false; }));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") document.querySelectorAll("details.dd-info[open]").forEach((p) => { p.open = false; }); });
  const awal = decodeURIComponent(location.hash.slice(1));
  pilihDok(x.dokumen.some((d) => d.id === awal) ? awal : x.dokumen[0].id);
}
saatBahasa(() => { if (S.idx) gambarKartu(); if (S.dok) { S.dok.tabel.forEach((tb) => { delete tb._m; }); ulangTab(); gambarDok(); } });
mulai();
