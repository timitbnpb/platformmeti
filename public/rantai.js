/* /rantai: kebutuhan PLTS 100 GWp per tahun vs kapasitas 40 pabrikan modul (ESDM DJEBTKE). Data statis /data/rantai_plts.json. */
import { mulaiHalaman } from "/inti/kepala.js";
import { nanti, esc, hantuHtml, debounce, ikon } from "/inti/umum.js";
import { cariHtml, pilihHtml, hapusHtml, hitungHtml } from "/inti/komponen.js";
import { t, tanggal } from "/i18n.js";
import { ikonTek } from "/inti/ikon_tek.js";
import { PROV } from "/penerbit.js";
import { namaBaku } from "/inti/nama_baku.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { muatData, tampilGalat, sumberLipat, pasangAksi, kartuHtml, batangHtml, pasangBar, temuanHtml, heroVisual, ubinHtml, pil, num, saatBahasa } from "/analisis.js";

const temuan = (tx, ...r) => temuanHtml(String(tx).replace(/[.\s]+$/, ""), ...r);
const $ = (id) => document.getElementById(id);
const KELAS = { lokal: "jm-an-b1", ekspor: "jm-an-b2", keduanya: "jm-an-b4" };
const WARNA = { lokal: "--data1", ekspor: "--data3", keduanya: "--data4" };
let d = null, dp = null, tek = "surya", fProv = "", fKomp = "", horizon = 10, urut = { k: "mwp", arah: -1 }, cari = "", fPasar = "", fApamsi = "", fBin = null;
let mPasar = "", mApamsi = "", sel = null, urutKota = { k: "mwp", arah: -1 };
let hal = 1, balaiPer = 10, tkdnDat = null, popIdx = -1, daftarKini = [];
let peta = null, petaSiap = false, grup = [], markah = [];

const gw = (mwp) => mwp / 1000;
const sumberTabel = () => ({ sumber: d.sumber.judul, tanggal: d.sumber.tanggal });
const sumberProgram = () => ({ sumber: d.program.sumber, tanggal: d.program.tanggal_sumber });
const median = (a) => { const s = [...a].sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; };
const butuh = () => d.program.target_gwp / horizon;
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const tautOrg = (x) => (x.org_id ? `<a href="/o/${esc(x.org_id)}">${esc(x.nama)}</a>` : esc(x.nama));
const TEK = ["surya", "bayu", "hidro", "panas_bumi", "bioenergi", "baterai", "hidrogen", "jaringan"];
const GBR = { surya: "surya-cirata", bayu: "bayu-sidrap", hidro: "hidro-saguling", panas_bumi: "panas-bumi-sibayak", bioenergi: "bioenergi-sawit", baterai: "penyimpanan-baterai", hidrogen: "hidrogen-spbu", jaringan: "nuklir-menara" };
const IKON_T = { panas_bumi: "panas-bumi", baterai: "penyimpanan" };
const kodeProv = (p) => PROV[String(p || "").trim().toLowerCase()];
const NOLOGO = new Set(["p_a1e72bb6ad"]); // foto bangunan, bukan logo: pakai monogram
const dTek = () => dp.teknologi.find((x) => x.id === tek);
const median0 = (a) => (a.length ? median(a) : null);
/* Satu baris per pemasok untuk teknologi terpilih; komp = komponen yang dipasok. */
function barisTek() {
  const m = new Map();
  for (const k of dTek().komponen) for (const p of k.pemasok) {
    const o = m.get(p.id) || { ...p, komp: [] };
    if (p.mwp != null && o.mwp == null) o.mwp = p.mwp;
    if (p.tkdn != null && (o.tkdn == null || p.tkdn > o.tkdn)) o.tkdn = p.tkdn;
    o.komp.push(k.id); m.set(p.id, o);
  }
  return [...m.values()].map((o) => ({ ...o, nama: namaBaku(o.nama).nama, logo: NOLOGO.has(o.id) ? null : o.logo, daerah: [o.provinsi, o.kota].filter(Boolean).join(" "), kompTeks: o.komp.map((k) => t("rt.komp." + k)).join(", "), nk: o.komp.length }));
}

function jawab() {
  const T = dTek(), B = barisTek(), tk = B.map((x) => x.tkdn).filter((x) => x != null), mw = B.reduce((n, x) => n + (x.mwp || 0), 0);
  $("jawab").textContent = t("rt.kh.lead");
  $("gbr-tek").src = `/img/beranda/${GBR[tek]}.webp`;
  const u = [
    { ikon: "gedung", nilai: num(B.length), satuan: "", label: t("rt.kh.u1"), href: "#h-tabel" },
    tek === "surya" ? { ikon: "grafik", nilai: num(gw(mw), 1), satuan: "GWp", label: t("rt.kh.u2"), href: "#h-komp", turunan: true }
      : { ikon: "rantai", nilai: num(T.komponen.length - T.celah.length), satuan: t("rt.dari_n", { n: T.komponen.length }), label: t("rt.kh.u5"), href: "#h-komp" },
    { ikon: "tingkat", nilai: tk.length ? num(median0(tk), 1) : "-", satuan: tk.length ? "%" : "", label: t("rt.kh.u3"), href: "#h-tabel", turunan: tk.length > 0 },
    { ikon: "peringatan", nilai: num(T.celah.length), satuan: t("rt.dari_n", { n: T.komponen.length }), label: t("rt.kh.u4"), href: "#h-komp" },
  ];
  $("ubin").innerHTML = ubinHtml(u);
}

function kartu() {
  const r = d.ringkas, tk = d.pabrikan.filter((x) => x.tkdn != null).map((x) => x.tkdn), ap = d.pabrikan.filter((x) => x.apamsi).length;
  $("kartu").innerHTML =
    kartuHtml({ ikon: "tabel", judul: t("rt.k.total"), nilai: num(gw(r.total_mwp), 1), satuan: t("rt.gwp_tahun"), turunan: true, penyebut: t("an.n_dari", { n: r.pabrikan - r.tanpa_kapasitas, total: r.pabrikan }), sumber: sumberLipat([sumberTabel()]) }) +
    kartuHtml({ ikon: "peta", judul: t("rt.k.ekspor"), nilai: num(gw(r.ekspor_mwp), 1), satuan: t("rt.gwp_tahun"), turunan: true, penyebut: t("rt.k.ekspor_cat", { gw: num(gw(r.keduanya_mwp), 1) }), sumber: sumberLipat([sumberTabel()]) }) +
    kartuHtml({ ikon: "proyek", judul: t("rt.k.program"), nilai: num(d.program.tahap_awal_gwp, 1), satuan: "GWp", penyebut: t("rt.k.program_cat", { n: d.program.tahap_awal_proyek, target: d.program.target_gwp }), sumber: sumberLipat([sumberProgram()]) }) +
    kartuHtml({ ikon: "tingkat", judul: t("rt.k.tkdn"), nilai: num(median(tk), 1), satuan: "%", turunan: true, penyebut: t("an.n_dari", { n: tk.length, total: r.pabrikan }) + " | " + t("rt.k.apamsi", { n: ap }), sumber: sumberLipat([sumberTabel()]) });
  for (const a of $("kartu").querySelectorAll(".jm-an-kartu")) { const src = a.querySelector(":scope > .jm-an-src"), kp = a.querySelector(".jm-kpi-kepala"); if (src && kp) kp.append(src); } // satu ikon info di kepala kartu
}

const legendaPasar = () => ["lokal", "ekspor", "keduanya"].map((k) => `<span class="jm-an-sw ${KELAS[k]}"></span>${esc(t("rt.pasar." + k))}`).join(" ");

function grafikKebutuhan() {
  const r = d.ringkas, b = butuh(), lokal = gw(r.lokal_mwp);
  $("temuan-keb").innerHTML = temuan(t("rt.t.keb", { lokal: num(lokal, 1), persen: num((lokal / b) * 100, 0), butuh: num(b, 1) }));
  const baris = [
    { label: t("rt.b.butuh"), bagian: [{ nilai: b, kelas: "jm-an-b3" }], teks: num(b, 1) + " GWp" },
    { label: t("rt.b.total"), bagian: [{ nilai: lokal, kelas: "jm-an-b1" }, { nilai: gw(r.ekspor_mwp), kelas: "jm-an-b2" }], teks: num(gw(r.total_mwp), 1) + " GWp" },
    { label: t("rt.b.lokal"), bagian: [{ nilai: lokal, kelas: "jm-an-b1" }], teks: num(lokal, 1) + " GWp" },
  ];
  $("grafik-keb").innerHTML = `${batangHtml(baris, { ref: b, maks: Math.max(b, gw(r.total_mwp)) * 1.08, label: t("rt.b.label") })}
    <div class="jm-rt-kuncibaris"><p class="jm-an-kunci"><span class="jm-an-sw jm-an-b1"></span>${esc(t("rt.lokal"))} <span class="jm-an-sw jm-an-b2"></span>${esc(t("rt.ekspor"))} <span class="jm-an-sw jm-an-garis-sw"></span>${esc(t("rt.garis"))}</p>
    <p class="jm-bantu">${pil("an.hipotesis")} ${esc(t("rt.horizon_cat", { target: d.program.target_gwp, n: horizon }))}</p></div>${sumberLipat([sumberTabel(), sumberProgram()])}`;
  pasangBar($("grafik-keb"));
}

const BIN = [[0, 30], [30, 40], [40, 45], [45, 50], [50, 101]];
const labelBin = ([a, b]) => (a === 0 ? t("rt.bin_lt", { b }) : b === 101 ? t("rt.bin_ge", { a }) : t("rt.bin", { a, b }));
const labelPendek = ([a, b]) => (a === 0 ? `< ${b}%` : b === 101 ? `${a}%+` : `${a}-${b}%`);

/* Kolom vertikal per sebaran TKDN: tombol penyaring tabel; < 40% token peringatan, >= 40% hijau merek; garis batas 40% dan penanda median. */
function grafikTkdn() {
  const v = d.pabrikan.map((x) => x.tkdn), isi = v.filter((x) => x != null), med = median(isi), tanpa = v.length - isi.length;
  const n = BIN.map((b) => isi.filter((x) => x >= b[0] && x < b[1]).length);
  $("temuan-tkdn").innerHTML = temuan(t("rt.t.tkdn", { med: num(med, 1), n: isi.length, k: isi.filter((x) => x < 40).length }));
  const W = Math.max(320, Math.round($("grafik-tkdn").clientWidth || 680)), H = 214, L = 12, R = 12, T = 40, B = 168, fs = innerWidth < 640 ? 13 : 12, g = (W - L - R) / BIN.length, bw = g * 0.62, mx = Math.max(...n) * 1.12, Y = (q) => B - (q / mx) * (B - T);
  const xBatas = L + 2 * g, xMed = L + (BIN.findIndex((b) => med >= b[0] && med < b[1]) + (med - BIN[BIN.findIndex((b) => med >= b[0] && med < b[1])][0]) / (BIN[BIN.findIndex((b) => med >= b[0] && med < b[1])][1] - BIN[BIN.findIndex((b) => med >= b[0] && med < b[1])][0])) * g;
  const kol = BIN.map((b, i) => {
    const x0 = L + i * g, px = x0 + (g - bw) / 2, y = Y(n[i]), aktif = fBin === String(i), tip = `${labelBin(b)}: ${t("rt.n_pabrikan", { n: n[i] })}`;
    return `<g class="jm-tk-kol" role="button" tabindex="0" aria-pressed="${aktif}" data-id="${i}" aria-label="${esc(tip)}"><title>${esc(tip)}</title>
      <rect class="jm-tk-hit" x="${x0.toFixed(1)}" y="${T - 22}" width="${g.toFixed(1)}" height="${B + 30 - T + 22}" rx="6"/>
      <rect class="jm-tk-isi${b[1] <= 40 ? " jm-tk-rendah" : ""}" x="${px.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(2, B - y).toFixed(1)}" rx="5"/>
      <text class="jm-tk-n" x="${(x0 + g / 2).toFixed(1)}" y="${(y - 7).toFixed(1)}" text-anchor="middle" font-size="${fs + 2}">${n[i]}</text>
      <text class="jm-tk-l" x="${(x0 + g / 2).toFixed(1)}" y="${B + 20}" text-anchor="middle" font-size="${fs}">${esc(labelPendek(b))}</text></g>`;
  }).join("");
  const svg = `<svg class="jm-tk" viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(t("rt.tkdn"))}" focusable="false">
    <line class="jm-gf-grid" x1="${L}" x2="${W - R}" y1="${B}" y2="${B}"/>${kol}
    <line class="jm-tk-batas" x1="${xBatas.toFixed(1)}" x2="${xBatas.toFixed(1)}" y1="4" y2="${B}"/><text class="jm-tk-tb" x="${(xBatas - 5).toFixed(1)}" y="15" text-anchor="end" font-size="${fs}">${esc(t("rt.tk.batas"))}</text>
    <line class="jm-tk-median" x1="${xMed.toFixed(1)}" x2="${xMed.toFixed(1)}" y1="4" y2="${B}"/><text class="jm-tk-tm" x="${(xMed + 5).toFixed(1)}" y="15" font-size="${fs}">${esc(t("rt.tk.median", { v: num(med, 1) }))}</text></svg>`;
  $("grafik-tkdn").innerHTML = `${svg}<p class="jm-bantu">${esc(t("rt.tkdn_klik"))} ${esc(t("rt.tk.tanpa", { n: tanpa }))}</p>${sumberLipat([sumberTabel()])}`;
}

/* ---------- peta interaktif ---------- */

function kelompok() {
  const koor = new Map(d.kota.map((k) => [k.kota, k]));
  const m = new Map();
  for (const x of d.pabrikan) {
    if (!x.kota || !koor.has(x.kota)) continue;
    if (mPasar && x.pasar !== mPasar) continue;
    if (mApamsi && (mApamsi === "ya") !== !!x.apamsi) continue;
    const g = m.get(x.kota) || m.set(x.kota, { kota: x.kota, lat: koor.get(x.kota).lat, lng: koor.get(x.kota).lng, pabrik: [], mwp: 0, per: { lokal: 0, ekspor: 0, keduanya: 0 } }).get(x.kota);
    g.pabrik.push(x); g.mwp += x.mwp || 0; g.per[x.pasar] += (x.mwp || 0) + 0.001;
  }
  for (const g of m.values()) g.dom = Object.entries(g.per).sort((a, b) => b[1] - a[1])[0][0];
  return [...m.values()];
}

/* ---------- peta SVG: bulat per kota (ukuran = MWp, warna = pasar dominan), label tanpa tabrakan, laci kota ---------- */

const PPD = 40, B0 = [94.5, 6.5], WS = 47 * PPD, HS = 18 * PPD; // 40 satuan per derajat; kotak seluruh Indonesia
const px = (lng) => (lng - B0[0]) * PPD, py = (lat) => (B0[1] - lat) * PPD;
let semuaIndo = false;

function viewBoxPeta() {
  if (semuaIndo || !d.kota.length) return [0, 0, WS, HS];
  const la = d.kota.map((k) => k.lat), lo = d.kota.map((k) => k.lng), pad = 3;
  const x0 = px(Math.min(...lo) - pad), x1 = px(Math.max(...lo) + pad), y0 = py(Math.max(...la) + pad), y1 = py(Math.min(...la) - pad);
  return [x0, y0, x1 - x0, y1 - y0];
}

function jalurProv(geo) {
  return geo.features.map((f) => {
    let dd = "";
    for (const poli of f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) {
      let ppx = Infinity, ppy = Infinity, s = "", n = 0;
      for (const [lng, lat] of poli[0]) { const x = px(lng), y = py(lat); if (Math.hypot(x - ppx, y - ppy) < 0.9) continue; s += (n++ ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1); ppx = x; ppy = y; }
      if (n > 3) dd += s + "Z";
    }
    return dd;
  }).join("");
}

let SK = 1; // piksel layar per satuan peta: gelembung berukuran tetap dalam piksel (akar kuadrat, maks 22 px) agar tidak menutup peta
const rPx = (mwp, maks) => 5 + 17 * Math.sqrt(Math.max(5, mwp) / maks);
const radius = (mwp, maks) => rPx(mwp, maks) / SK;

function gambarBulat() {
  const svg = $("peta-pabrik").querySelector("svg");
  if (!svg) return;
  const maks = Math.max(5, ...grup.map((g) => g.mwp)), ns = "http://www.w3.org/2000/svg", vb = viewBoxPeta();
  svg.setAttribute("viewBox", vb.map((v) => v.toFixed(1)).join(" "));
  const rc = svg.getBoundingClientRect(), asp = (rc.width || 1000) / (rc.height || 600); // perluas kotak agar sama bentuk dengan wadah (tanpa ruang kosong tak terpakai)
  const w2 = Math.max(vb[2], vb[3] * asp), h2 = Math.max(vb[3], vb[2] / asp);
  vb[0] -= (w2 - vb[2]) / 2; vb[1] -= (h2 - vb[3]) / 2; vb[2] = w2; vb[3] = h2;
  svg.setAttribute("viewBox", vb.map((v) => v.toFixed(1)).join(" "));
  const skala = (rc.width || 1000) / vb[2]; SK = skala;
  const gb = svg.querySelector(".jm-rt-bulat"), gl = svg.querySelector(".jm-rt-lbl");
  gb.replaceChildren(); gl.replaceChildren();
  const urutMw = [...grup].sort((a, b) => b.mwp - a.mwp);
  for (const g of [...grup].sort((a, b) => b.mwp - a.mwp)) {
    const c = document.createElementNS(ns, "circle");
    c.setAttribute("class", `jm-rt-c jm-rt-${g.dom}${g.kota === sel ? " jm-rt-sel" : ""}`);
    c.setAttribute("cx", px(g.lng).toFixed(1)); c.setAttribute("cy", py(g.lat).toFixed(1)); c.setAttribute("r", radius(g.mwp, maks).toFixed(1));
    c.setAttribute("tabindex", "0"); c.setAttribute("role", "button"); c.dataset.kota = g.kota;
    c.setAttribute("aria-label", `${g.kota}: ${num(g.mwp)} MWp, ${t("rt.n_pabrik", { n: g.pabrik.length })}`);
    gb.append(c);
  }
  // label: kota dengan >= 2 pabrik atau 6 teratas menurut MWp; tolak tabrakan dengan kotak yang sudah ada, geser dengan garis penuntun
  const lab = new Set([...urutMw.slice(0, 6), ...grup.filter((g) => g.pabrik.length >= 2)].map((g) => g.kota));
  const fs = 11.5 / skala, kotak = grup.map((g) => ({ x: px(g.lng) - radius(g.mwp, maks), y: py(g.lat) - radius(g.mwp, maks), w: 2 * radius(g.mwp, maks), h: 2 * radius(g.mwp, maks) }));
  const tabrak = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const dipakai = [];
  for (const g of urutMw.filter((x) => lab.has(x.kota))) {
    const cx = px(g.lng), cy = py(g.lat), r = radius(g.mwp, maks), w = (g.kota.length * 6.4 + 12) / skala, h = 17 / skala;
    const kand = [];
    for (const jar of [r + 4 / skala, r + 22 / skala, r + 44 / skala]) for (const sdt of [0, 180, 90, 270, 45, 135, 315, 225]) {
      const a = (sdt * Math.PI) / 180, ax = cx + Math.cos(a) * jar, ay = cy - Math.sin(a) * jar;
      kand.push({ x: Math.cos(a) >= 0.3 ? ax : Math.cos(a) <= -0.3 ? ax - w : ax - w / 2, y: Math.sin(a) >= 0.3 ? ay - h : Math.sin(a) <= -0.3 ? ay : ay - h / 2, w, h, jar });
    }
    const pilih = kand.find((k) => !dipakai.some((o) => tabrak(k, o)) && !kotak.some((o, i) => grup[i].kota !== g.kota && tabrak(k, o))) || kand[0];
    dipakai.push(pilih);
    if (pilih.jar > r + 10 / skala) {
      const l = document.createElementNS(ns, "line"); l.setAttribute("class", "jm-rt-gl"); l.setAttribute("x1", cx.toFixed(1)); l.setAttribute("y1", cy.toFixed(1));
      l.setAttribute("x2", Math.max(pilih.x, Math.min(pilih.x + w, cx)).toFixed(1)); l.setAttribute("y2", Math.max(pilih.y, Math.min(pilih.y + h, cy)).toFixed(1)); gl.append(l);
    }
    const bg = document.createElementNS(ns, "rect"); bg.setAttribute("class", "jm-rt-lr"); bg.setAttribute("x", pilih.x.toFixed(1)); bg.setAttribute("y", pilih.y.toFixed(1)); bg.setAttribute("width", w.toFixed(1)); bg.setAttribute("height", h.toFixed(1)); bg.setAttribute("rx", (h / 2).toFixed(1));
    const tx = document.createElementNS(ns, "text"); tx.setAttribute("class", "jm-rt-lt"); tx.setAttribute("x", (pilih.x + w / 2).toFixed(1)); tx.setAttribute("y", (pilih.y + h / 2 + fs * 0.35).toFixed(1)); tx.setAttribute("text-anchor", "middle"); tx.setAttribute("font-size", fs.toFixed(2)); tx.textContent = g.kota;
    gl.append(bg, tx);
  }
  $("reset-peta").textContent = t(semuaIndo ? "rt.reset_fokus" : "rt.reset_semua");
}

function legendaKartu() {
  const maks = Math.max(5, ...grup.map((g) => g.mwp)), ref = [1000, 10000].filter((v) => v <= maks * 1.2);
  $("legenda-peta").innerHTML = `<p class="jm-wl-lg-j">${esc(t("rt.col.pasar"))}</p><ul>${["lokal", "ekspor", "keduanya"].map((k) => `<li><i class="jm-an-sw ${KELAS[k]}" aria-hidden="true"></i>${esc(t("rt.pasar." + k))}</li>`).join("")}</ul>
    <p class="jm-wl-lg-j">${esc(t("rt.legenda_ukuran"))}</p><div class="jm-rt-ukuran">${ref.map((v) => { const r = Math.round(rPx(v, maks) * 0.8); return `<span><svg width="${2 * r + 2}" height="${2 * r + 2}" aria-hidden="true"><circle cx="${r + 1}" cy="${r + 1}" r="${r}"/></svg>${esc(num(v))}</span>`; }).join("")}<small>MWp</small></div>
    <p class="jm-bantu jm-rt-cat">${esc(t("rt.peta_pil"))}</p>`;
}

function tampilTipKota(g, x, y) {
  const tip = $("tip-kota"), tot = grup.reduce((s, k) => s + k.mwp, 0) || 1;
  tip.innerHTML = `<strong>${esc(g.kota)}</strong><ul><li><span>${esc(t("rt.col.n"))}</span><b>${esc(num(g.pabrik.length))}</b></li><li><span>${esc(t("rt.col.mwp"))}</span><b>${esc(num(g.mwp))} MWp</b></li><li><span>${esc(t("rt.tip_porsi"))}</span><b>${esc(num((g.mwp / tot) * 100, 0))}%</b></li></ul>`;
  tip.hidden = false;
  const b = $("peta-pabrik").parentElement.getBoundingClientRect();
  tip.style.left = Math.max(8, Math.min(b.width - tip.offsetWidth - 8, x + 14)) + "px";
  tip.style.top = Math.max(8, Math.min(b.height - tip.offsetHeight - 8, y + 14)) + "px";
}

function petaPerbarui() {
  grup = kelompok();
  if (sel && !grup.some((g) => g.kota === sel)) sel = null;
  kotaTeks(); tabelKota(); panel(); legendaKartu();
  gambarBulat();
}

function kotaTeks() {
  const tot = grup.reduce((s, g) => s + g.mwp, 0), a = [...grup].sort((x, y) => y.mwp - x.mwp)[0];
  $("temuan-peta").innerHTML = a ? temuan(t("rt.t.peta", { kota: a.kota, persen: num((a.mwp / (tot || 1)) * 100, 0), gw: num(gw(a.mwp), 1), total: num(gw(tot), 1) })) : esc(t("an.tanpa_data"));
  $("sumber-peta").innerHTML = sumberLipat([sumberTabel()]);
}

function panel() {
  const g = grup.find((x) => x.kota === sel), p = $("kota-panel");
  p.hidden = !g;
  if (!g) { p.innerHTML = ""; return; }
  const tot = [...g.pabrik].sort((a, b) => (b.mwp ?? -1) - (a.mwp ?? -1));
  p.innerHTML = `<div class="jm-panel-kepala"><div><h3>${esc(g.kota)}</h3><p class="jm-bantu">${esc(t("rt.panel_ringkas", { mwp: num(g.mwp), n: g.pabrik.length }))}</p></div><button type="button" class="jm-rt-x" data-aksi="tutup" aria-label="${esc(t("jm.tutup"))}">${ikon("silang", 16)}</button></div>
    <ul class="jm-rt-daftar">${tot.map((x) => `<li><a class="jm-an-nama" href="/direktori#${esc(x.id)}">${logoHtml(x)}<span class="jm-id"><b>${esc(x.nama)}</b><small>${esc(x.mwp == null ? "-" : num(x.mwp))} MWp</small></span></a><span class="jm-rt-tag">${pasarPil(x.pasar)}${x.apamsi ? `<span class="jm-pil jm-rt-apamsi">APAMSI</span>` : ""}</span></li>`).join("")}</ul>`;
}

function pilihKota(k, terbang = true) {
  sel = k; panel(); tabelKota(); gambarBulat();
  if (terbang) $("peta-pabrik").scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

function tutupKota() { sel = null; panel(); tabelKota(); gambarBulat(); }

async function bukaPeta() {
  if (peta) return;
  let geo;
  try { geo = await (await fetch("/geo/provinsi.json", { credentials: "same-origin" })).json(); } catch (e) { $("peta-pabrik").innerHTML = `<p class="jm-bantu">${esc(t("wl.peta_gagal"))}</p>`; return; }
  peta = true;
  $("peta-pabrik").innerHTML = `<svg class="jm-rt-svg" viewBox="0 0 ${WS} ${HS}" focusable="false"><path class="jm-rt-prov" d="${jalurProv(geo)}"/><g class="jm-rt-bulat"></g><g class="jm-rt-lbl" aria-hidden="true"></g></svg>`;
  const svg = $("peta-pabrik").querySelector("svg"), tip = $("tip-kota"), bingkai = () => $("peta-pabrik").parentElement.getBoundingClientRect();
  const dari = (e) => { const c = e.target.closest("circle[data-kota]"); return c && { c, g: grup.find((x) => x.kota === c.dataset.kota) }; };
  const tampil = (e) => { const r = dari(e); if (!r) { tip.hidden = true; return; } const b = bingkai(); tampilTipKota(r.g, e.clientX - b.left, e.clientY - b.top); };
  svg.addEventListener("mousemove", tampil);
  svg.addEventListener("mouseover", tampil);
  svg.addEventListener("mouseleave", () => { tip.hidden = true; });
  svg.addEventListener("focusin", (e) => { const r = dari(e); if (!r) return; const bb = r.c.getBoundingClientRect(), b = bingkai(); tampilTipKota(r.g, bb.left - b.left + bb.width / 2, bb.top - b.top + bb.height / 2); });
  svg.addEventListener("focusout", () => { tip.hidden = true; });
  svg.addEventListener("click", (e) => { const r = dari(e); if (r) pilihKota(r.g.kota, false); });
  svg.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { const r = dari(e); if (r) { e.preventDefault(); pilihKota(r.g.kota, false); } } });
  $("reset-peta").addEventListener("click", () => { semuaIndo = !semuaIndo; gambarBulat(); });
  new ResizeObserver(debounce(gambarBulat, 150)).observe($("peta-pabrik"));
  gambarBulat();
}

function tabelKota() {
  const B = [...grup].sort((a, b) => {
    const k = urutKota.k, x = k === "kota" ? a.kota : k === "n" ? a.pabrik.length : a.mwp, y = k === "kota" ? b.kota : k === "n" ? b.pabrik.length : b.mwp;
    return (typeof x === "string" ? x.localeCompare(y) : x - y) * urutKota.arah || a.kota.localeCompare(b.kota);
  });
  const totN = grup.reduce((s, g) => s + g.pabrik.length, 0), totMw = grup.reduce((s, g) => s + g.mwp, 0);
  const th = (k, kk) => `<th aria-sort="${urutKota.k === k ? (urutKota.arah > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-kk="${k}">${esc(t(kk))}</button></th>`;
  const pendek = (n) => n.replace(/\([^)]*\)/g, " ").split(/\s+/).filter((w) => w && !/^(pt|tbk|cv)$/i.test(w)).slice(0, 2).join(" ") || n;
  const pp = (x) => `<span class="jm-rt-pab">${logoHtml({ ...x, nama: namaBaku(x.nama).nama }, "jm-rt-lgk")}${esc(pendek(namaBaku(x.nama).nama))}</span>`;
  const mini = (g) => `<span class="jm-rt-mini">${g.pabrik.slice(0, 3).map(pp).join("")}${g.pabrik.length > 3 ? `<button type="button" class="jm-rt-pab jm-rt-lebih" aria-expanded="false" data-n="${g.pabrik.length - 3}" aria-label="${esc(t("rt.lebih", { n: g.pabrik.length - 3 }))}">+${g.pabrik.length - 3}</button><span class="jm-rt-sisa" hidden>${g.pabrik.slice(3).map(pp).join("")}</span>` : ""}</span>`;
  $("tabel-kota").innerHTML = `<div class="jm-gulir"><table class="jm-tabel jm-rt-tabel"><colgroup><col class="jm-rt-k1"><col class="jm-rt-k2"><col class="jm-rt-k3"><col class="jm-rt-k4"><col class="jm-rt-k5"><col class="jm-rt-k6"></colgroup><thead><tr><th>#</th>${th("kota", "rt.col.kota")}${th("n", "rt.col.n").replace("<th ", "<th class=\"jm-rt-ka\" ")}<th>${esc(t("rt.col.nama"))}</th>${th("mwp", "rt.col.mwp").replace("<th ", "<th class=\"jm-rt-ka\" ")}<th>${esc(t("rt.col.pasar"))}</th></tr></thead><tbody>${B.map((g, i) => `<tr data-kota="${esc(g.kota)}"${g.kota === sel ? ' class="jm-baris-pilih"' : ""}>
    <td data-label="#"><span class="jm-wl-no">${i + 1}</span></td>
    <td data-label="${esc(t("rt.col.kota"))}"><span class="jm-id"><b>${esc(g.kota)}</b><small>${esc(g.pabrik[0]?.provinsi || "-")}</small></span></td>
    <td data-label="${esc(t("rt.col.n"))}" class="jm-num">${num(g.pabrik.length)}</td>
    <td data-label="${esc(t("rt.col.nama"))}">${mini(g)}</td>
    <td data-label="${esc(t("rt.col.mwp"))}" class="jm-num"><b class="jm-rt-kap">${esc(num(g.mwp))}<small>MWp</small></b></td>
    <td data-label="${esc(t("rt.col.pasar"))}" class="jm-tengah">${pasarPil(g.dom)}</td></tr>`).join("")}</tbody><tfoot><tr><td></td><td>${esc(t("rt.total"))}</td><td class="jm-tengah">${num(totN)}</td><td></td><td class="jm-num"><b>${esc(num(gw(totMw), 1))} GWp</b></td><td></td></tr></tfoot></table></div>`;
}

/* ---------- tabel pabrikan ---------- */
const kolTek = (adaMw) => [["nama", "rt.col.nama"], ["daerah", "rt.col.daerah"], ["nk", "rt.col.komp"], ...(adaMw ? [["mwp", "rt.col.mwp"]] : []), ...(tek === "surya" ? [["pasar", "rt.col.pasar"], ["apamsi", "rt.col.apamsi"]] : []), ["tkdn", "rt.col.tkdn"], ...(tek === "surya" ? [["bmp", "rt.col.bmp"]] : [])];
const inisial = (n) => (n.replace(/\([^)]*\)/g, " ").split(/\s+/).filter((w) => w && !/^(pt|tbk|cv)$/i.test(w)).slice(0, 2).map((w) => w[0]).join("") || "?").toUpperCase();
const logoHtml = (x, kelas = "") => `<span class="jm-an-logo jm-rt-lg ${kelas}" aria-hidden="true">${esc(inisial(x.nama))}${x.logo && !NOLOGO.has(x.id) ? `<img src="/img/logo/org/${esc(x.logo)}.png" alt="" width="28" height="28" loading="lazy" decoding="async" data-galat="hapus">` : ""}</span>`;
const tkdnPil = (v) => (v == null ? "-" : `<span class="jm-pil ${v >= 40 ? "jm-pil-ok" : "jm-pil-warn"}">${esc(num(v, 1))}%</span>`);
const daerahHtml = (x) => { const k = kodeProv(x.provinsi), tx = esc([x.kota, x.provinsi].filter(Boolean).join(", ") || "-"); return k ? `<a class="jm-rt-daerah" href="/wilayah/${k}"><img src="/img/provinsi/${k}.png" width="24" height="24" alt="" loading="lazy" decoding="async"><span>${tx}</span></a>` : `<span class="jm-rt-daerah">${tx}</span>`; };
const pasarPil = (p) => `<span class="jm-pil jm-an-pasar"><i class="jm-an-sw ${KELAS[p]}"></i>${esc(t("rt.pasar." + p))}</span>`;

const provOpsi = () => [...new Set(barisTek().map((x) => x.provinsi).filter(Boolean))].sort((a, b) => a.localeCompare(b)).map((p) => [p, p, kodeProv(p) ? "prov:" + kodeProv(p) : ""]);
function saringRender() {
  const sy = tek === "surya";
  $("saring").innerHTML = cariHtml({ id: "cari", label: t("rt.cari") }) +
    (sy ? pilihHtml({ id: "f-pasar", ikon: "jenis", label: t("rt.f_pasar"), nilai: fPasar, opsi: [["", t("rt.f_pasar") + ": " + t("rt.semua")], ["lokal", t("rt.pasar.lokal")], ["ekspor", t("rt.pasar.ekspor")], ["keduanya", t("rt.pasar.keduanya")]] }) : "") +
    (sy ? pilihHtml({ id: "f-apamsi", ikon: "status", label: t("rt.f_apamsi"), nilai: fApamsi, opsi: [["", t("rt.col.apamsi") + ": " + t("rt.semua")], ["ya", t("rt.ya")], ["tidak", t("rt.tidak")]] }) : "") +
    pilihHtml({ id: "f-prov", ikon: "lokasi", label: t("rt.f_prov"), nilai: fProv, opsi: [["", t("rt.f_prov") + ": " + t("rt.semua")], ...provOpsi()] }) +
    hapusHtml({ id: "hapus", label: t("jm.kosong.reset") }) + hitungHtml({ id: "hitung", teks: "" });
  $("cari").value = cari;
}

function tabel(tetap) {
  if (tetap !== true) hal = 1;
  const q = cari.trim().toLowerCase();
  const bin = fBin === null ? null : BIN[+fBin];
  const sy = tek === "surya", semua = barisTek();
  const kosongTek = !semua.length;
  $("h-tabel").closest("section").hidden = kosongTek;
  if (kosongTek) { daftarKini = []; $("tabel").innerHTML = ""; return; }
  const B = semua.filter((x) => (!q || (x.nama + " " + (x.kota || "") + " " + (x.provinsi || "") + " " + x.kompTeks).toLowerCase().includes(q)) && (!fProv || x.provinsi === fProv) && (!fKomp || x.komp.includes(fKomp)) && (!sy || (!fPasar || x.pasar === fPasar) && (!fApamsi || (fApamsi === "ya") === !!x.apamsi)) &&
    (bin === null || (x.tkdn != null && x.tkdn >= bin[0] && x.tkdn < bin[1])));
  B.sort((a, b) => {
    const x = a[urut.k], y = b[urut.k];
    if (x == null && y == null) return a.nama.localeCompare(b.nama);
    if (x == null) return 1; if (y == null) return -1;
    return (typeof x === "string" ? x.localeCompare(y) : x - y) * urut.arah || a.nama.localeCompare(b.nama);
  });
  daftarKini = B;
  const ap = semua.filter((x) => x.apamsi).length;
  $("temuan-tabel").innerHTML = temuan(sy ? t("rt.t.tabel", { n: semua.length, ap, k: d.ringkas.tanpa_kapasitas }) : t("rt.t.tabel_tek", { n: semua.length, k: dTek().celah.length }), false);
  $("hitung").textContent = t("rt.info", { n: B.length, total: semua.length });
  $("hapus").hidden = !(fBin !== null || cari || fPasar || fApamsi || fProv || fKomp);
  $("hapus").title = fBin !== null ? t("rt.hapus_bin", { bin: labelBin(BIN[+fBin]) }) : "";
  if (!B.length) { $("tabel").innerHTML = `<div class="jm-kosong"><p>${esc(t("jm.kosong.cocok"))}</p></div>`; return; }
  const adaMw = semua.some((x) => x.mwp != null), adaBmp = sy && semua.some((x) => x.bmp != null), kol = kolTek(adaMw).filter(([k]) => k !== "bmp" || adaBmp), L = (k) => esc(t(k));
  const maksHal = Math.max(1, Math.ceil(B.length / balaiPer));
  if (hal > maksHal) hal = maksHal;
  const mulai = (hal - 1) * balaiPer;
  const RATA = { mwp: " jm-rt-ka", tkdn: " jm-rt-ka", bmp: " jm-rt-ka" };
  const th = kol.map(([k, kunci]) => `<th aria-sort="${urut.k === k ? (urut.arah > 0 ? "ascending" : "descending") : "none"}" class="jm-rt-k-${k}${RATA[k] || ""}"><button type="button" class="jm-urut" data-k="${k}">${esc(t(kunci))}</button></th>`).join("");
  const num0 = (v, n) => esc(v == null ? "-" : num(v, n));
  $("tabel").innerHTML = `<div class="jm-gulir"><table class="jm-tabel jm-rp-tabel"><thead><tr>${th}</tr></thead><tbody>${B.slice(mulai, mulai + balaiPer).map((x, j) => `<tr class="jm-rt-baris" tabindex="0" data-i="${mulai + j}">
    <td data-label="${L("rt.col.nama")}" class="jm-rt-k-nama"><span class="jm-an-nama">${logoHtml(x)}<span class="jm-id"><b>${esc(x.nama)}</b></span></span></td>
    <td data-label="${L("rt.col.daerah")}" class="jm-rt-k-daerah">${daerahHtml(x)}</td>
    <td data-label="${L("rt.col.komp")}" class="jm-rt-k-nk">${esc(x.kompTeks)}</td>
    ${adaMw ? `<td data-label="${L("rt.col.mwp")}" class="jm-num">${num0(x.mwp)}</td>` : ""}${sy ? `
    <td data-label="${L("rt.col.pasar")}" class="jm-tengah">${x.pasar ? pasarPil(x.pasar) : "-"}</td>
    <td data-label="${L("rt.col.apamsi")}" class="jm-tengah"><span class="jm-pil ${x.apamsi ? "jm-pil-ok" : "jm-an-pasar"}">${esc(x.apamsi ? t("rt.ya") : t("rt.tidak"))}</span></td>` : ""}
    <td data-label="${L("rt.col.tkdn")}" class="jm-num">${tkdnPil(x.tkdn)}</td>${adaBmp ? `
    <td data-label="${L("rt.col.bmp")}" class="jm-num">${num0(x.bmp, 1)}</td>` : ""}</tr>`).join("")}</tbody></table></div>${paginasiHtml({ hal, total: B.length, per: balaiPer, satuan: "rt.u.pabrikan" })}${sumberLipat(dp.sumber.map((z) => ({ sumber: z.judul, tanggal: z.tanggal })))}`;
}

/* ---------- pop-up rinci pabrikan (dialog modal: Esc menutup, fokus terjebak oleh browser) ---------- */
async function bukaPop(i) {
  if (i < 0 || i >= daftarKini.length) return;
  popIdx = i;
  let dlg = $("pop-pabrik");
  if (!dlg) {
    dlg = document.createElement("dialog"); dlg.id = "pop-pabrik"; dlg.className = "jm-dlg jm-rt-pop"; dlg.setAttribute("aria-label", t("rt.pop.label"));
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg || e.target.closest("[data-pop=tutup]")) dlg.close();
      else if (e.target.closest("[data-pop=prev]")) bukaPop(popIdx - 1);
      else if (e.target.closest("[data-pop=next]")) bukaPop(popIdx + 1);
    });
    dlg.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") bukaPop(popIdx - 1); else if (e.key === "ArrowRight") bukaPop(popIdx + 1); });
    document.body.append(dlg);
  }
  if (!tkdnDat) { try { tkdnDat = await muatData("tkdn.json"); } catch (e) { tkdnDat = { baris: [] }; } }
  const x = daftarKini[i], sert = tkdnDat.baris.filter((r) => r.produsen_org_id === x.org_id || r.produsen_org_id === x.id);
  const fakta = [[t("rt.col.mwp"), x.mwp == null ? "-" : num(x.mwp)], [t("rt.col.tkdn"), tkdnPil(x.tkdn)], ...(x.bmp != null ? [[t("rt.col.bmp"), esc(num(x.bmp, 1))]] : []), [t("rt.col.daerah"), daerahHtml(x)]];
  dlg.innerHTML = `<header class="jm-rt-pop-h">${logoHtml(x, "jm-rt-lgb")}<div class="jm-rt-pop-j"><h2>${esc(x.nama)}</h2><p>${daerahHtml(x)}</p><p class="jm-rt-pop-pil">${x.pasar ? pasarPil(x.pasar) : ""}${tek === "surya" ? `<span class="jm-pil ${x.apamsi ? "jm-pil-ok" : "jm-an-pasar"}">APAMSI: ${esc(x.apamsi ? t("rt.ya") : t("rt.tidak"))}</span>` : ""}</p></div><button type="button" class="jm-rt-x" data-pop="tutup" aria-label="${esc(t("jm.tutup"))}">${ikon("silang", 18)}</button></header>
    <div class="jm-rt-pop-bd"><div><h3>${esc(t("rt.pop.komp"))}</h3><p class="jm-rt-pilcelah">${x.komp.map((k) => `<span class="jm-pil jm-an-pasar">${esc(t("rt.komp." + k))}</span>`).join("")}</p>
      <h3>${esc(t("rt.pop.tkdn"))}</h3>${sert.length ? `<div class="jm-gulir"><table class="jm-tabel"><thead><tr><th>${esc(t("rt.pop.produk"))}</th><th class="jm-rt-ka">TKDN</th><th>${esc(t("rt.pop.berlaku"))}</th></tr></thead><tbody>${sert.map((r) => `<tr><td>${esc(r.produk)}${r.merk ? `<small> ${esc(r.merk)}</small>` : ""}</td><td class="jm-num">${tkdnPil(r.tkdn_persen)}</td><td>${esc(r.berlaku_sampai || "-")}</td></tr>`).join("")}</tbody></table></div>` : `<p class="jm-bantu">${esc(t("rt.pop.tkdn_kosong"))}</p>`}</div>
      <aside class="jm-rt-fakta"><h3>${esc(t("rt.pop.fakta"))}</h3><dl>${fakta.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join("")}</dl></aside></div>
    <footer class="jm-rt-pop-f"><button type="button" class="jm-tbl" data-pop="prev"${i <= 0 ? " disabled" : ""}>${esc(t("jm.pag.sebelum"))}</button><span class="jm-bantu">${esc(t("rt.pop.posisi", { i: num(i + 1), n: num(daftarKini.length) }))}</span><button type="button" class="jm-tbl" data-pop="next"${i >= daftarKini.length - 1 ? " disabled" : ""}>${esc(t("jm.pag.berikut"))}</button>${x.org_id ? `<a class="jm-tbl jm-rt-profil" href="/o/${esc(x.org_id)}">${esc(t("rt.pop.profil"))}</a>` : ""}${sumberLipat([sumberTabel()])}</footer>`;
  if (!dlg.open) dlg.showModal();
}

/* Komponen utama: kartu seragam; klik menyaring tabel. Celah = belum ada pemasok dalam negeri terbaca (bukan bukti tiadanya). */
const IK_KOMP = { modul: "tek-surya", sel_wafer: "grafik", kaca_frame: "gambar", rangka: "gedung", floater: "wilayah", inverter: "tek-listrik", bilah: "kompas", menara: "peta", nacelle: "kartu", gearbox_generator: "kalkulator", turbin_hidro: "tek-listrik", generator: "tek-listrik", pipa_pesat: "rantai", turbin_uap: "tek-panas", pipa_uap: "rantai", kepala_sumur: "lokasi", digester: "tek-bio", boiler_gasifier: "tek-bio", sel: "kartu", pack: "tablet", bms_pcs: "laptop", elektroliser: "insight", tangki_tekan: "perisai", panel_tr: "tabel", trafo: "tek-listrik", kabel: "tautan" };
const kompIk = (id, i) => `<span class="jm-rt-ik jm-rt-w${i % 5}">${ikon(IK_KOMP[id] || "rantai", 22)}</span>`;
function komp() {
  const T = dTek(), B = barisTek();
  $("src-komp").innerHTML = sumberLipat(dp.sumber.map((z) => ({ sumber: z.judul, tanggal: z.tanggal })));
  $("temuan-komp").innerHTML = temuan(t("rt.t.komp", { n: T.komponen.length - T.celah.length, total: T.komponen.length, c: T.celah.length }), false);
  const peta = new Map(B.map((x) => [x.id, x]));
  if (!B.length) {
    $("komp").innerHTML = `<div class="jm-rt-kosong"><span class="jm-rt-ik jm-rt-w3">${ikon("peringatan", 26)}</span><div><h3>${esc(t("rt.kosong.j", { tek: t("rt.tek." + tek) }))}</h3><p>${esc(t("rt.kosong.ajak"))}</p>
      <p class="jm-rt-pilcelah">${T.komponen.map((k) => `<span class="jm-pil jm-pil-warn">${esc(t("rt.komp." + k.id))}</span>`).join("")}</p>
      <p class="jm-rt-lain"><a class="jm-tbl" href="/peluang">${esc(t("rt.peluang"))}</a>${TEK.filter((k) => k !== tek).map((k) => `<button type="button" class="jm-rt-lnk" data-tek="${k}">${esc(t("rt.tek." + k))}</button>`).join("")}</p></div></div>`;
    return;
  }
  $("komp").innerHTML = `<div class="jm-rt-komp">${T.komponen.map((k, i) => {
      const tk = k.pemasok.map((p) => p.tkdn).filter((v) => v != null), ada = k.pemasok.length > 0;
      if (!ada) return `<a class="jm-rt-kk jm-rt-celah" href="/peluang"><span class="jm-rt-ik jm-rt-w3">${ikon("peringatan", 22)}</span><b>${esc(t("rt.komp." + k.id))}</b><span class="jm-rt-n"><span class="jm-pil jm-pil-warn">${esc(t("rt.celah"))}</span></span><small>${esc(t("rt.celah_cat"))}</small><span class="jm-rt-ajak">${esc(t("rt.peluang"))}</span></a>`;
      const top = [...k.pemasok].sort((a, b) => (b.mwp ?? -1) - (a.mwp ?? -1)).slice(0, 3).map((p) => logoHtml({ ...(peta.get(p.id) || p), nama: namaBaku(p.nama).nama }, "jm-rt-lgk")).join(""), lebih = k.pemasok.length - 3;
      return `<button type="button" class="jm-rt-kk" data-komp="${esc(k.id)}" aria-pressed="${fKomp === k.id}">${kompIk(k.id, i)}<b>${esc(t("rt.komp." + k.id))}</b>
        <span class="jm-rt-n"><strong>${esc(num(k.pemasok.length))}</strong><span>${esc(t("rt.kk.label"))}</span>${tk.length ? `<span class="jm-pil ${median(tk) >= 40 ? "jm-pil-ok" : "jm-pil-warn"}">${esc(t("rt.kk.tkdn", { v: num(median(tk), 1) }))}</span>` : ""}</span>
        <span class="jm-rt-lgs">${top}${lebih > 0 ? `<span class="jm-rt-lebihk">+${lebih}</span>` : ""}</span></button>`; }).join("")}</div>`;
}

/* Pemilih teknologi: ujung ke ujung, ikon sesuai teknologi. */
function tekPilih() {
  $("seg-tek").innerHTML = TEK.map((k) => `<button type="button" role="tab" data-tek="${k}" aria-label="${esc(t("rt.tek." + k))}" aria-selected="${k === tek}">${ikonTek(IKON_T[k] || k)}<span>${esc(t("rt.tek." + k))}</span></button>`).join("");
}

function cara() {
  if (tek !== "surya") { $("cara").innerHTML = `<ol class="jm-rt-cara"><li>${esc(t("rt.cara_tek"))}</li></ol>`; $("kutip").textContent = t("rt.kutip", { tanggal: tanggal(d.dibangun_pada, { gaya: "panjang" }) }); return; }
  $("cara").innerHTML = `<ol class="jm-rt-cara">${[1, 2, 3, 4, 5].map((n) => `<li>${esc(t("rt.cara" + n, { target: d.program.target_gwp }))}</li>`).join("")}</ol>`;
  $("kutip").textContent = t("rt.kutip", { tanggal: tanggal(d.dibangun_pada, { gaya: "panjang" }) });
}

function gambarSemua() { tekPilih(); komp(); for (const e of document.querySelectorAll("[data-surya]")) e.hidden = tek !== "surya"; jawab(); kartu(); grafikKebutuhan(); grafikTkdn(); petaPerbarui(); saringRender(); tabel(); cara(); }

function segSync(seg, b) { for (const x of seg.children) x.setAttribute("aria-selected", String(x === b)); }

function pasang() {
  document.querySelector("[data-h]").parentElement.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-h]");
    if (!b || +b.dataset.h === horizon) return;
    segSync(b.parentElement, b); horizon = +b.dataset.h;
    nanti(() => { jawab(); grafikKebutuhan(); });
  });
  $("seg-pasar").addEventListener("click", (e) => { const b = e.target.closest("button[data-p]"); if (!b || b.dataset.p === mPasar) return; segSync($("seg-pasar"), b); mPasar = b.dataset.p; nanti(petaPerbarui); });
  $("seg-apamsi").addEventListener("click", (e) => { const b = e.target.closest("button[data-a]"); if (!b || b.dataset.a === mApamsi) return; segSync($("seg-apamsi"), b); mApamsi = b.dataset.a; nanti(petaPerbarui); });
  $("kota-panel").addEventListener("click", (e) => { if (e.target.closest("[data-aksi=tutup]")) nanti(tutupKota); });
  $("tabel-kota").addEventListener("click", (e) => {
    const k = e.target.closest("tr[data-kota]"), s = e.target.closest("button[data-kk]"), l = e.target.closest(".jm-rt-lebih");
    if (l) { const o = l.nextElementSibling, b = o.hidden; o.hidden = !b; l.setAttribute("aria-expanded", String(b)); l.textContent = b ? "-" : "+" + l.dataset.n; return; }
    if (s) { const kk = s.dataset.kk; urutKota = urutKota.k === kk ? { k: kk, arah: -urutKota.arah } : { k: kk, arah: kk === "kota" ? 1 : -1 }; nanti(tabelKota); }
    else if (k) { for (const x of $("tabel-kota").querySelectorAll("tr[data-kota]")) x.classList.toggle("jm-baris-pilih", x === k); nanti(() => pilihKota(k.dataset.kota)); }
  });
  const klikBin = (e) => {
    const b = e.target.closest("[data-id]"); if (!b) return;
    fBin = fBin === b.dataset.id ? null : b.dataset.id;
    for (const x of $("grafik-tkdn").querySelectorAll("[data-id]")) x.setAttribute("aria-pressed", String(x.dataset.id === fBin));
    nanti(tabel);
  };
  $("grafik-tkdn").addEventListener("click", klikBin);
  $("grafik-tkdn").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); klikBin(e); } });
  $("tabel").addEventListener("click", (e) => {
    const pg = e.target.closest(".jm-pag [data-hal]");
    if (pg) { if (pg.disabled) return; sorotHalaman(pg, pg.dataset.hal); hal = +pg.dataset.hal; nanti(() => { tabel(true); $("h-tabel").scrollIntoView({ block: "start" }); }); return; }
    const tr = e.target.closest("tr[data-i]"); if (tr && !e.target.closest("a,button")) bukaPop(+tr.dataset.i);
  });
  $("tabel").addEventListener("keydown", (e) => { const tr = e.target.closest("tr[data-i]"); if (tr && e.target === tr && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); bukaPop(+tr.dataset.i); } });
  $("saring").addEventListener("input", debounce((e) => { if (e.target.id === "cari") { cari = e.target.value; tabel(); } }));
  $("saring").addEventListener("change", (e) => {
    const id = e.target.id;
    if (id === "f-prov") fProv = e.target.value; else if (id === "f-pasar") fPasar = e.target.value; else if (id === "f-apamsi") fApamsi = e.target.value; else return;
    nanti(tabel);
  });
  $("saring").addEventListener("click", (e) => {
    if (!e.target.closest("#hapus")) return;
    cari = ""; fPasar = ""; fApamsi = ""; fBin = null; fProv = ""; fKomp = "";
    for (const x of $("grafik-tkdn").querySelectorAll("[data-id]")) x.setAttribute("aria-pressed", "false");
    nanti(() => { saringRender(); komp(); tabel(); });
  });
  $("seg-tek").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tek]");
    if (!b || b.dataset.tek === tek) return;
    segSync($("seg-tek"), b); tek = b.dataset.tek;
    cari = ""; fPasar = ""; fApamsi = ""; fBin = null; fProv = ""; fKomp = ""; urut = { k: tek === "surya" ? "mwp" : "nama", arah: tek === "surya" ? -1 : 1 };
    nanti(() => { for (const x of document.querySelectorAll("[data-surya]")) x.hidden = tek !== "surya"; jawab(); komp(); saringRender(); tabel(); cara(); });
  });
  $("komp").addEventListener("click", (e) => {
    const lain = e.target.closest("button[data-tek]"); if (lain) { $("seg-tek").querySelector(`[data-tek=${lain.dataset.tek}]`).click(); return; }
    const b = e.target.closest("button[data-komp]"); if (!b) return;
    fKomp = fKomp === b.dataset.komp ? "" : b.dataset.komp;
    for (const x of $("komp").querySelectorAll("button[data-komp]")) x.setAttribute("aria-pressed", String(x.dataset.komp === fKomp));
    nanti(() => { saringRender(); tabel(); });
  });
  $("tabel").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-k]");
    if (!b) return;
    const k = b.dataset.k;
    urut = urut.k === k ? { k, arah: -urut.arah } : { k, arah: k === "nama" || k === "kota" ? 1 : -1 };
    for (const th of b.closest("tr").children) th.setAttribute("aria-sort", th === b.parentElement ? (urut.arah > 0 ? "ascending" : "descending") : "none");
    nanti(tabel);
  });
  // peta dimuat malas saat mendekati layar
  const el = $("peta-pabrik");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((a) => { if (a.some((x) => x.isIntersecting)) { io.disconnect(); nanti(bukaPeta); } }, { rootMargin: "300px" });
    io.observe(el);
  } else nanti(bukaPeta);
}

async function mulai() {
  await mulaiHalaman();
  $("kartu").innerHTML = hantuHtml(2);
  try { [d, dp] = await Promise.all([muatData("rantai_plts.json"), muatData("rantai_pasok.json")]); } catch (e) { tampilGalat($("kartu"), mulai); return; }
  pasangAksi(["aksi-peta", "aksi-tabel"]);
  gambarSemua(); pasang();
  saatBahasa(gambarSemua);
}
mulai();
