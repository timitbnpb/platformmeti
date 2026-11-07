/* Pembantu halaman informasi biaya, keuangan, dan pasar hijau: grafik SVG interaktif (kolom tumpuk, garis, batang mendatar),
   legenda yang bisa dinyalakan/dimatikan, tabel urut + berpaginasi, kartu celah data. Teks selalu dari t(). Warna lewat kelas .ih-* (info_hijau.css).
   Semua grafik: tooltip mengambang (hover, sentuh, fokus keyboard), elemen tersorot menonjol dan sisanya redup; tidak ada kotak teks "pilih atau arahkan". */
import { t, angka } from "/i18n.js";
import { esc, nanti, ikon } from "/inti/umum.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";

export const n1 = (v, d = 1) => angka(v, { desimal: d });
const lebar = (el, min = 300) => Math.max(min, Math.round(el?.clientWidth || 640));
const tip = (s) => esc(s);

/** Skala sumbu: batas atas "rapi" dan tick bulat (langkah 1, 2, 5, 10 x 10^n), sekitar 5 interval. */
function skala(maks) {
  if (!(maks > 0)) return { atas: 1, tick: [0, 0.25, 0.5, 0.75, 1] };
  const kasar = maks / 5, p = 10 ** Math.floor(Math.log10(kasar)), f = kasar / p, s = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p, n = Math.ceil(maks / s - 1e-9);
  return { atas: s * n, tick: Array.from({ length: n + 1 }, (_, i) => s * i) };
}
const dec = (langkah) => (langkah >= 1 ? 0 : langkah >= 0.1 ? 1 : 2);

/** Legenda. Butir ber-`id` jadi tombol: klik menyalakan/mematikan seri di grafik garis, hover menyorot garisnya. */
export const legendaHtml = (seri) => `<ul class="ih-leg">${seri.map((s) => `<li>${s.id ? `<button type="button" class="ih-leg-b" data-s="${esc(s.id)}" aria-pressed="true"><i class="ih-sw ${s.kelas}"></i>${esc(s.label)}</button>` : `<i class="ih-sw ${s.kelas}"></i>${esc(s.label)}`}</li>`).join("")}</ul>`;
/** Tidak lagi menulis kotak teks: tooltip mengambang menggantikannya (pemilik 8 Nov 2026). Dipertahankan agar pemanggil lama tidak patah. */
export const detailHtml = () => "";
export function pasangDetail() {}

/** Isi tooltip kaya. baris: [[kunci, nilai, kelasWarna?]]; opsi {img: url gambar kecil, extra: html tepercaya (mis. sparkline statis)}. */
export const tipHtml = (judul, baris = [], { img = "", extra = "" } = {}) =>
  `<b>${img ? `<img class="ih-tip-i" src="${esc(img)}" alt="" width="20" height="14">` : ""}${esc(judul)}</b>${baris.map(([k, v, c]) => `<span class="ih-tr"><em>${esc(k)}</em><strong class="${c || ""}">${esc(v)}</strong></span>`).join("")}${extra}`;
/** Selisih persen a terhadap b sebagai [teks, kelas]; naik = merah (biaya lebih mahal), turun = hijau. */
export const selisih = (a, b) => { if (!(b > 0) || a == null) return ["-", ""]; const p = ((a - b) / b) * 100; return [`${p > 0 ? "+" : ""}${n1(p, 0)}%`, p > 0.5 ? "ih-naik" : p < -0.5 ? "ih-turun" : ""]; };
const PANAH = { turun: '<path d="M6 2v8M2.5 6.5L6 10l3.5-3.5"/>', naik: '<path d="M6 10V2M2.5 5.5L6 2l3.5 3.5"/>' };
/** Pil perubahan berwarna dengan panah SVG: p persen (negatif = turun = hijau). */
export const pilUbah = (p) => { if (p == null || !isFinite(p)) return '<span class="ih-kosong">-</span>'; const k = p > 0.5 ? "naik" : p < -0.5 ? "turun" : "sama"; return `<span class="ih-ub ih-${k}">${k === "sama" ? "" : `<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false">${PANAH[k]}</svg>`}${esc(`${p > 0 ? "+" : ""}${n1(p, 0)}%`)}</span>`; };
/** Sparkline kecil. vals: [angka]; opsi {tip, th (html), statis, kelas}. Bertooltip bila tidak statis. */
export function sparkSvg(vals, { tip: tp = "", th = "", statis = false, kelas = "", w = 76, h = 24 } = {}) {
  const v = vals.filter((x) => x != null);
  if (v.length < 2) return '<span class="ih-kosong">-</span>';
  const lo = Math.min(...v), hi = Math.max(...v), x = (i) => 3 + (i / (v.length - 1)) * (w - 6), y = (a) => h - 3 - (hi === lo ? 0.5 : (a - lo) / (hi - lo)) * (h - 6);
  const pts = v.map((a, i) => `${x(i).toFixed(1)},${y(a).toFixed(1)}`).join(" "), z = v.length - 1;
  return `<svg class="ih-spark ${kelas}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(tp)}" focusable="false"${statis ? "" : ` tabindex="0" data-tip="${esc(tp)}" data-th="${esc(th)}"`}><polyline class="ih-gr" points="${pts}"/><circle class="ih-tk" cx="${x(z).toFixed(1)}" cy="${y(v[z]).toFixed(1)}" r="2.6"/></svg>`;
}

/** Kolom bertumpuk. kategori: [{label, nilai:{kunciSeri: angka}, tip, th?}]; seri: [{k, kelas, label}]; ref: {nilai, label}. */
export function kolomSvg({ kategori, seri, satuan, el, ref, label }) {
  const W = lebar(el), H = W < 500 ? 250 : 290, L = 52, R = 10, T = 14, B = 28;
  const tot = kategori.map((c) => seri.reduce((a, s) => a + (c.nilai[s.k] || 0), 0));
  const { atas, tick } = skala(Math.max(...tot, ref?.nilai || 0));
  const y = (v) => T + (1 - v / atas) * (H - T - B), lb = (W - L - R) / kategori.length, bw = Math.max(4, Math.min(48, lb * 0.66)), dc = dec(tick[1]);
  const grid = tick.map((v) => `<line class="ih-grid" x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="ih-lbl" x="${L - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${esc(n1(v, dc))}</text>`).join("");
  const langkah = Math.ceil(kategori.length / Math.max(1, Math.floor((W - L - R) / 46)));
  const batang = kategori.map((c, i) => {
    let dasar = 0; const cx = L + lb * i + lb / 2, tp = tip(c.tip || c.label);
    const bag = seri.map((s) => { const v = c.nilai[s.k] || 0; if (!v) return ""; const y0 = y(dasar), y1 = y(dasar + v); dasar += v; return `<rect class="ih-bar ${s.kelas}" x="${(cx - bw / 2).toFixed(1)}" y="${y1.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0.5, y0 - y1).toFixed(1)}"/>`; }).join("");
    const hit = `<rect class="ih-hit" x="${(L + lb * i).toFixed(1)}" y="${T}" width="${lb.toFixed(1)}" height="${H - T - B}"/>`;
    return `<g class="ih-baris" tabindex="0" data-tip="${tp}"${c.th ? ` data-th="${esc(c.th)}"` : ""} aria-label="${tp}">${hit}${bag}</g>` + (i % langkah === 0 ? `<text class="ih-lbl" x="${cx.toFixed(1)}" y="${H - 8}" text-anchor="middle">${esc(c.label)}</text>` : "");
  }).join("");
  const garisRef = ref ? `<line class="ih-ref" x1="${L}" x2="${W - R}" y1="${y(ref.nilai).toFixed(1)}" y2="${y(ref.nilai).toFixed(1)}"/><text class="ih-lbl ih-lbl-ref" x="${L + 6}" y="${(y(ref.nilai) - 5).toFixed(1)}" text-anchor="start">${esc(ref.label)}</text>` : "";
  return `<svg class="ih-svg" viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(label || satuan)}" focusable="false"><text class="ih-lbl" x="${L}" y="9">${esc(satuan)}</text>${grid}${batang}${garisRef}</svg>`;
}

/* ---------- garis interaktif ---------- */
const GR = new Map(); let gidN = 0;
/** Garis. seri: [{id, kelas, label, titik:[{x, y, tip}]}]. Opsi: skalaLog (sumbu log, tick pangkat 10), anot: [x] (tandai titik seri pertama dengan "x: nilai"),
    ringkas(x, y) -> teks kecil di tooltip (hanya satu seri), xTick. Tanpa label ujung (legenda yang menamai); crosshair + tooltip semua seri diurutkan nilai. */
export function garisSvg({ seri, satuan, el, label, xTick, skalaLog = false, anot = [], ringkas }) {
  const W = lebar(el), H = W < 500 ? 270 : 320, L = 52, R = 16, T = 18, B = 28;
  const semua = seri.flatMap((s) => s.titik), x0 = Math.min(...semua.map((p) => p.x)), x1 = Math.max(...semua.map((p) => p.x));
  const ys = semua.map((p) => p.y), lo = Math.floor(Math.log10(Math.min(...ys.filter((v) => v > 0)))), hi = Math.ceil(Math.log10(Math.max(...ys)));
  const sk = skalaLog ? { tick: Array.from({ length: hi - lo + 1 }, (_, i) => 10 ** (lo + i)) } : skala(Math.max(...ys)), atas = sk.tick.at(-1);
  const x = (v) => L + ((v - x0) / Math.max(1, x1 - x0)) * (W - L - R);
  const y = (v) => T + (1 - (skalaLog ? (Math.log10(Math.max(v, 10 ** lo)) - lo) / Math.max(1, hi - lo) : v / atas)) * (H - T - B);
  const dc = skalaLog ? 0 : dec(sk.tick[1]);
  const grid = sk.tick.map((v) => `<line class="ih-grid" x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="ih-lbl" x="${L - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${esc(n1(v, skalaLog && v < 1 ? 1 : dc))}</text>`).join("");
  const sb = (xTick || [x0, Math.round((x0 + x1) / 2), x1]).map((a) => `<text class="ih-lbl" x="${x(a).toFixed(1)}" y="${H - 8}" text-anchor="middle">${a}</text>`).join("");
  const mati = new Set([...(el?.closest?.(".jm-ex")?.querySelectorAll(".ih-leg-b[aria-pressed=false]") ?? [])].map((b) => b.dataset.s));
  const g = seri.map((s) => {
    const pts = s.titik.map((p) => `${x(p.x).toFixed(1)},${y(p.y).toFixed(1)}`).join(" ");
    const dot = s.titik.length <= 30 ? s.titik.map((p) => `<circle class="ih-tk" cx="${x(p.x).toFixed(1)}" cy="${y(p.y).toFixed(1)}" r="3"/>`).join("") : "";
    return `<g class="ih-g ${s.kelas}${mati.has(s.id) ? " ih-mati" : ""}" data-s="${esc(s.id)}"><polyline class="ih-gr" points="${pts}"/>${dot}</g>`;
  }).join("");
  const an = anot.map((a) => { const p = seri[0].titik.find((q) => q.x === a); if (!p) return ""; const px = x(p.x), py = y(p.y), fin = px > W * 0.7; return `<g class="ih-g ${seri[0].kelas}"><circle class="ih-an" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="6"/></g><text class="ih-lbl ih-lbl-an" x="${(fin ? px - 8 : px + 9).toFixed(1)}" y="${(fin ? py + 20 : py - 10).toFixed(1)}" text-anchor="${fin ? "end" : "start"}">${esc(`${a}: ${n1(p.y, p.y < 10 ? 2 : 0)}`)}</text>`; }).join("");
  const id = ++gidN;
  GR.set(String(id), { W, H, X: x, Y: y, xs: [...new Set(semua.map((p) => p.x))].sort((a, b) => a - b), seri: seri.map((s) => ({ ...s, pts: [...s.titik].sort((a, b) => a.x - b.x) })), satuan, ringkas, T, B });
  if (GR.size > 40) GR.delete(GR.keys().next().value);
  return `<svg class="ih-svg ih-garis" data-gid="${id}" viewBox="0 0 ${W} ${H}" role="group" tabindex="0" aria-label="${esc(label || satuan)}" focusable="false"><text class="ih-lbl" x="${L}" y="9">${esc(satuan)}</text>${grid}${sb}${g}${an}<line class="ih-xh" hidden x1="0" x2="0" y1="${T}" y2="${H - B}"/><g class="ih-hov"></g></svg>`;
}

function garisTampil(svg, idx, cx, cy, sy) {
  const g = GR.get(svg.dataset.gid); if (!g) return;
  const xv = g.xs[idx], mt = (s) => svg.querySelector(`.ih-g[data-s="${CSS.escape(s.id)}"]`)?.classList.contains("ih-mati");
  const baris = g.seri.filter((s) => !mt(s)).map((s) => { const i = s.pts.findIndex((p) => p.x === xv); return i < 0 ? null : { s, v: s.pts[i].y, p: i ? s.pts[i - 1] : null }; }).filter(Boolean).sort((a, b) => b.v - a.v);
  if (!baris.length) return;
  const dekat = sy == null ? baris[0] : baris.reduce((m, b) => (Math.abs(g.Y(b.v) - sy) < Math.abs(g.Y(m.v) - sy) ? b : m));
  const xs = g.X(xv).toFixed(1), xh = svg.querySelector(".ih-xh");
  xh.setAttribute("x1", xs); xh.setAttribute("x2", xs); xh.removeAttribute("hidden");
  svg.querySelector(".ih-hov").innerHTML = baris.map((b) => `<g class="ih-g ${b.s.kelas}"><circle class="ih-hd${b === dekat ? " ih-hd-on" : ""}" cx="${xs}" cy="${g.Y(b.v).toFixed(1)}" r="${b === dekat ? 6 : 4.5}"/></g>`).join("");
  svg.classList.add("ih-fokus");
  for (const e of svg.querySelectorAll(".ih-g[data-s]")) e.classList.toggle("ih-g-on", e.dataset.s === dekat.s.id);
  const dv = (b) => { if (!b.p) return ""; const p = ((b.v - b.p.y) / b.p.y) * 100; return `<small class="ih-ub-k ${p > 0.5 ? "ih-naik" : p < -0.5 ? "ih-turun" : ""}">${esc(`${p > 0 ? "+" : ""}${n1(p, 0)}%`)}</small>`; };
  const ring = g.seri.length === 1 && g.ringkas ? `<small class="ih-ring">${esc(g.ringkas(xv, baris[0].v, baris[0].p))}</small>` : "";
  isiTip(`<b>${esc(String(xv))}</b>${baris.map((b) => `<span class="ih-tr${b === dekat ? " ih-tr-on" : ""}"><em><i class="ih-sw ${b.s.kelas}"></i>${esc(b.s.label)}</em><strong>${esc(n1(b.v, b.v < 10 ? 2 : 1))} ${esc(g.satuan)}${dv(b)}</strong></span>`).join("")}${ring}`);
  svg.dataset.k = idx; taruh(cx, cy);
}
function garisGerak(svg, ev) {
  const g = GR.get(svg.dataset.gid); if (!g) return;
  const r = svg.getBoundingClientRect(), sx = ((ev.clientX - r.left) / r.width) * g.W, sy = ((ev.clientY - r.top) / r.height) * g.H;
  let best = 0, bd = 1e9; g.xs.forEach((v, i) => { const d = Math.abs(g.X(v) - sx); if (d < bd) { bd = d; best = i; } });
  garisTampil(svg, best, ev.clientX, ev.clientY, sy);
}
function garisSembunyi(svg) {
  svg.querySelector(".ih-xh").setAttribute("hidden", ""); svg.querySelector(".ih-hov").innerHTML = ""; svg.classList.remove("ih-fokus");
  for (const e of svg.querySelectorAll(".ih-g-on")) e.classList.remove("ih-g-on");
  if (TIP) TIP.hidden = true;
}

/** Batang mendatar. baris: [{label, bagian:[{k, nilai}], tip, th?, sorot?, bendera?, logo?, ikon?, kelasIkon?}]; seri: [{k, kelas}]; ref: {nilai, label} garis vertikal berlabel.
    Label berikon (pilih salah satu per baris): bendera:"id" -> /img/bendera/id.svg; logo:"/img/..." (hanya jalur /img/); ikon:"tek:surya" (sprite tek-surya) atau "globe", dengan kelasIkon
    (mis. "ih-s1") untuk warna. Label dipotong elipsis, nama lengkap ada di tooltip: th (html dari tipHtml) atau tip (teks). */
export function batangSvg({ baris, seri, satuan, el, label, d = 0, ref }) {
  const W = lebar(el), rh = W < 520 ? 32 : 30, adaIk = baris.some((b) => b.bendera || b.logo || b.ikon), L = W < 520 ? (adaIk ? 138 : 118) : adaIk ? 240 : 190, R = 64, T = 22, B = ref ? 20 : 4, H = T + baris.length * rh + B;
  const maks = Math.max(...baris.map((b) => b.bagian.reduce((a, p) => a + p.nilai, 0)), ref?.nilai || 0), { atas, tick } = skala(maks), dc = dec(tick[1]);
  const x = (v) => L + (v / atas) * (W - L - R), mx = Math.floor((L - (adaIk ? 44 : 14)) / 5.9), pot = (s) => (s.length > mx ? s.slice(0, mx - 1) + "…" : s);
  const grid = tick.map((v) => `<line class="ih-grid" x1="${x(v).toFixed(1)}" x2="${x(v).toFixed(1)}" y1="${T - 4}" y2="${T + baris.length * rh}"/><text class="ih-lbl" x="${x(v).toFixed(1)}" y="10" text-anchor="middle">${esc(n1(v, dc))}</text>`).join("");
  const gambar = (b, y0) => {
    const u = y0 + (rh - 14) / 2 - 1;
    if (b.bendera) return `<image class="ih-fl" href="/img/bendera/${esc(b.bendera)}.svg" x="6" y="${u}" width="22" height="16" preserveAspectRatio="xMidYMid slice"/>`;
    if (b.logo && String(b.logo).startsWith("/img/")) return `<image class="ih-fl" href="${esc(b.logo)}" x="6" y="${u - 1}" width="18" height="18" preserveAspectRatio="xMidYMid meet"/>`;
    if (b.ikon) return `<svg class="${esc(b.kelasIkon || "")}" x="6" y="${u - 1}" width="18" height="18" aria-hidden="true"><use href="/img/ikon.svg#i-${esc(String(b.ikon).replace(/^tek:/, "tek-"))}"/></svg>`;
    return "";
  };
  const isi = baris.map((b, i) => {
    const y0 = T + i * rh; let dasar = 0; const tot = b.bagian.reduce((a, p) => a + p.nilai, 0), tp = tip(b.tip || b.label);
    const bag = b.bagian.map((p) => { if (!p.nilai) return ""; const s = seri.find((q) => q.k === p.k), xa = x(dasar), xb = x(dasar + p.nilai); dasar += p.nilai; return `<rect class="ih-bar ${s.kelas}" x="${xa.toFixed(1)}" y="${y0 + 5}" width="${Math.max(1, xb - xa).toFixed(1)}" height="${rh - 10}" rx="3"/>`; }).join("");
    const lab = adaIk ? `${gambar(b, y0)}<text class="ih-lbl ih-lbl-b" x="34" y="${y0 + rh / 2 + 4}">${esc(pot(b.label))}</text>` : `<text class="ih-lbl ih-lbl-b" x="${L - 8}" y="${y0 + rh / 2 + 4}" text-anchor="end">${esc(pot(b.label))}</text>`;
    return `<g class="ih-baris${b.sorot ? " ih-sorot" : ""}" tabindex="0" data-tip="${tp}"${b.th ? ` data-th="${esc(b.th)}"` : ""} aria-label="${tp}"><rect class="ih-hit" x="0" y="${y0}" width="${W}" height="${rh}"/>${lab}${bag}<text class="ih-lbl ih-lbl-v" x="${(x(tot) + 6).toFixed(1)}" y="${y0 + rh / 2 + 4}">${esc(n1(tot, d))}</text></g>`;
  }).join("");
  const rx = ref ? Math.min(Math.max(x(ref.nilai), L + 50), W - R - 30) : 0;
  const garisRef = ref ? `<line class="ih-ref" x1="${x(ref.nilai).toFixed(1)}" x2="${x(ref.nilai).toFixed(1)}" y1="${T - 4}" y2="${T + baris.length * rh}"/><text class="ih-lbl ih-lbl-ref" x="${rx.toFixed(1)}" y="${H - 4}" text-anchor="middle">${esc(ref.label)}</text>` : "";
  return `<svg class="ih-svg" viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(label || satuan)}" focusable="false"><text class="ih-lbl" x="4" y="10">${esc(satuan || "")}</text>${grid}${isi}${garisRef}</svg>`;
}

/* ---------- tooltip mengambang bersama ---------- */
let TIP, kini = null;
const kotak = () => TIP || (TIP = Object.assign(document.createElement("div"), { className: "jm-gf-tip ih-tip", hidden: true, role: "tooltip" }), document.body.append(TIP), TIP);
function isiTip(html) { const k = kotak(); k.innerHTML = html; k.hidden = false; }
function taruh(cx, cy) {
  const k = TIP, w = k.offsetWidth, h = k.offsetHeight; let l = cx + 16, tp = cy - h - 12;
  if (l + w > innerWidth - 8) l = cx - w - 16;
  l = Math.max(8, l); if (tp < 8) tp = cy + 18; if (tp + h > innerHeight - 8) tp = Math.max(8, innerHeight - h - 8);
  k.style.left = l + "px"; k.style.top = tp + "px";
}
function lepas() { if (kini) { kini.classList.remove("ih-on"); kini.closest(".ih-svg,.ih-spark")?.classList.remove("ih-fokus"); kini = null; } const g = document.querySelector(".ih-garis.ih-fokus"); if (g) garisSembunyi(g); else if (TIP) TIP.hidden = true; }
function gerak(ev) {
  const tg = ev.target; if (!tg.closest) return;
  const gs = tg.closest("svg[data-gid]");
  if (gs) { if (kini) lepas(); garisGerak(gs, ev); return; }
  const e = tg.closest("[data-tip]");
  if (!e || !e.closest(".ih-svg,.ih-spark")) { if (kini || TIP && !TIP.hidden) lepas(); return; }
  if (e !== kini) { lepas(); kini = e; isiTip(e.dataset.th || `<b>${esc(e.dataset.tip)}</b>`); e.classList.add("ih-on"); e.closest(".ih-svg,.ih-spark").classList.add("ih-fokus"); }
  taruh(ev.clientX, ev.clientY);
}
function fokus(ev) {
  const tg = ev.target; if (!tg.closest) return;
  const gs = tg.matches?.("svg[data-gid]") ? tg : null;
  if (gs) { const g = GR.get(gs.dataset.gid), r = gs.getBoundingClientRect(), i = g.xs.length - 1; garisTampil(gs, i, r.left + (g.X(g.xs[i]) / g.W) * r.width - 20, r.top + 40, null); return; }
  const e = tg.closest("[data-tip]"); if (!e || !e.closest(".ih-svg,.ih-spark")) return;
  lepas(); kini = e; isiTip(e.dataset.th || `<b>${esc(e.dataset.tip)}</b>`); e.classList.add("ih-on"); e.closest(".ih-svg,.ih-spark").classList.add("ih-fokus");
  const r = e.getBoundingClientRect(); taruh(r.left + Math.min(r.width, 200) / 2, r.top);
}
document.addEventListener("pointermove", gerak);
document.addEventListener("pointerdown", gerak);
document.addEventListener("pointerout", (ev) => { if (ev.pointerType === "touch") return; const s = ev.target.closest?.(".ih-svg,.ih-spark"); if (s && !s.contains(ev.relatedTarget)) lepas(); });
document.addEventListener("focusin", fokus);
document.addEventListener("focusout", (ev) => { if (ev.target.closest?.(".ih-svg,.ih-spark")) lepas(); });
addEventListener("scroll", () => { if (kini || document.querySelector(".ih-garis.ih-fokus")) lepas(); }, { passive: true });
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") { lepas(); return; }
  const gs = ev.target.matches?.("svg[data-gid]") ? ev.target : null;
  if (!gs || (ev.key !== "ArrowLeft" && ev.key !== "ArrowRight")) return;
  const g = GR.get(gs.dataset.gid), r = gs.getBoundingClientRect(), i = Math.min(g.xs.length - 1, Math.max(0, +(gs.dataset.k ?? g.xs.length - 1) + (ev.key === "ArrowRight" ? 1 : -1)));
  ev.preventDefault(); garisTampil(gs, i, r.left + (g.X(g.xs[i]) / g.W) * r.width, r.top + 40, null);
});
/* legenda: klik menyalakan/mematikan seri, hover menyorot garisnya */
const grafikDari = (b) => b.closest(".jm-ex")?.querySelector("svg.ih-garis");
document.addEventListener("click", (ev) => {
  const b = ev.target.closest?.(".ih-leg-b"); if (!b) return;
  const on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", String(on));
  grafikDari(b)?.querySelector(`.ih-g[data-s="${CSS.escape(b.dataset.s)}"]`)?.classList.toggle("ih-mati", !on);
});
const sorotLeg = (ev, nyala) => {
  const b = ev.target.closest?.(".ih-leg-b"); const s = b && grafikDari(b); if (!s) return;
  s.classList.toggle("ih-fokus", nyala); for (const e of s.querySelectorAll(".ih-g[data-s]")) e.classList.toggle("ih-g-on", nyala && e.dataset.s === b.dataset.s);
};
document.addEventListener("pointerover", (ev) => sorotLeg(ev, true)); document.addEventListener("pointerout", (ev) => sorotLeg(ev, false));
document.addEventListener("focusin", (ev) => sorotLeg(ev, true)); document.addEventListener("focusout", (ev) => sorotLeg(ev, false));

/* ---------- tabel urut + berpaginasi ---------- */
const ST = new Map();
/** el: wadah (punya id). kolom: [{k, label, v(baris) -> nilai urut, f(baris) -> teks sel (sudah di-escape bila HTML), num}]. Urut dan halaman bertahan antar-render. */
export function tabel(el, { kolom, baris, per = 10, satuan = "jm.pag.u.data", urutAwal = 0, menurun = true, kelasBaris }) {
  const s = ST.get(el.id) || { hal: 1, uk: urutAwal, ua: menurun ? -1 : 1 };
  ST.set(el.id, s);
  el._tb = { kolom, baris, per, satuan, kelasBaris };
  if (!el._pasang) {
    el._pasang = true;
    el.addEventListener("click", (e) => {
      const h = e.target.closest("[data-hal]"), u = e.target.closest(".jm-urut");
      if (h && !h.disabled) { s.hal = +h.dataset.hal; sorotHalaman(h, s.hal); nanti(() => gambar(el)); }
      else if (u) {
        const k = +u.dataset.uk; s.ua = s.uk === k ? -s.ua : (el._tb.kolom[k].num ? -1 : 1); s.uk = k; s.hal = 1;
        for (const th of el.querySelectorAll("thead th")) th.setAttribute("aria-sort", th.contains(u) ? (s.ua > 0 ? "ascending" : "descending") : "none");
        nanti(() => gambar(el));
      }
    });
  }
  gambar(el);
}
function gambar(el) {
  const s = ST.get(el.id), { kolom, baris, per, satuan, kelasBaris } = el._tb, k = kolom[s.uk] || kolom[0];
  const urut = [...baris].sort((a, b) => { const x = k.v(a), y = k.v(b); if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return (typeof x === "string" ? x.localeCompare(y, "id") : x - y) * s.ua; });
  const maks = Math.max(1, Math.ceil(urut.length / per)); s.hal = Math.min(s.hal, maks);
  const lihat = urut.slice((s.hal - 1) * per, s.hal * per);
  const th = kolom.map((c, i) => `<th class="${c.num ? "jm-num" : ""}" aria-sort="${i === s.uk ? (s.ua > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-uk="${i}">${esc(c.label)}</button></th>`).join("");
  const tr = lihat.map((r) => `<tr${kelasBaris ? ` class="${esc(kelasBaris(r) || "")}"` : ""}>${kolom.map((c) => `<td data-label="${esc(c.label)}" class="${c.num ? "jm-num" : ""}">${c.f(r)}</td>`).join("")}</tr>`).join("");
  el.innerHTML = `<div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>${paginasiHtml({ hal: s.hal, total: urut.length, per, satuan })}`;
}

/** Kartu celah: kunci kamus `${awalan}.${kunci}.j` (judul) dan `.i` (isi); tautan ke lembaga sumber. */
export const celahHtml = (daftar, awalan) => `<ul class="ih-celah">${daftar.map((c) => `<li class="ih-celah-k"><span class="jm-kpi-ik">${ikon("unduh", 18)}</span><div><h3>${esc(t(`${awalan}.${c.kunci}.j`))}</h3><p>${esc(t(`${awalan}.${c.kunci}.i`))}</p><a class="ih-tautan" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">${esc(new URL(c.url).hostname.replace(/^www\./, ""))}</a></div></li>`).join("")}</ul>`;
