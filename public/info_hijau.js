/* Pembantu halaman informasi biaya, keuangan, dan pasar hijau: grafik SVG bertooltip (kolom tumpuk, garis, batang mendatar),
   legenda, tabel urut + berpaginasi bernomor, kartu celah data. Teks selalu dari t(). Warna lewat kelas .ih-* (info_hijau.css). */
import { t, angka } from "/i18n.js";
import { esc, nanti, ikon } from "/inti/umum.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";

export const n1 = (v, d = 1) => angka(v, { desimal: d });
const lebar = (el, min = 300) => Math.max(min, Math.round(el?.clientWidth || 640));
const tip = (s) => esc(s);

/** Skala sumbu: batas atas "rapi" dan 4 tick. */
function skala(maks) {
  if (!(maks > 0)) return { atas: 1, tick: [0, 0.25, 0.5, 0.75, 1] };
  const p = 10 ** Math.floor(Math.log10(maks)), f = maks / p, atas = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  return { atas, tick: [0, 1, 2, 3, 4].map((i) => (atas * i) / 4) };
}
const dec = (atas) => (atas >= 10 ? 0 : atas >= 1 ? 1 : 2);

export const legendaHtml = (seri) => `<ul class="ih-leg">${seri.map((s) => `<li><i class="ih-sw ${s.kelas}"></i>${esc(s.label)}</li>`).join("")}</ul>`;
export const detailHtml = () => `<p class="jm-detail ih-detail" role="status" data-detail>${esc(t("ih.pilih"))}</p>`;
/** Klik atau fokus pada elemen [data-tip] menulis isinya ke [data-detail] terdekat (sentuh tidak punya hover). */
export function pasangDetail(akar) {
  const tulis = (e) => { const x = e.target.closest("[data-tip]"); const d = e.target.closest(".jm-ex")?.querySelector("[data-detail]"); if (x && d) d.textContent = x.dataset.tip; };
  akar.addEventListener("click", tulis); akar.addEventListener("focusin", tulis);
}

/** Kolom bertumpuk. kategori: [{label, nilai:{kunciSeri: angka}, tip}]; seri: [{k, kelas, label}]; ref: {nilai, label}. */
export function kolomSvg({ kategori, seri, satuan, el, ref, label }) {
  const W = lebar(el), H = W < 500 ? 250 : 290, L = 52, R = 10, T = 14, B = 28;
  const tot = kategori.map((c) => seri.reduce((a, s) => a + (c.nilai[s.k] || 0), 0));
  const { atas, tick } = skala(Math.max(...tot, ref?.nilai || 0));
  const y = (v) => T + (1 - v / atas) * (H - T - B), lb = (W - L - R) / kategori.length, bw = Math.max(4, Math.min(48, lb * 0.66));
  const grid = tick.map((v) => `<line class="ih-grid" x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="ih-lbl" x="${L - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${esc(n1(v, dec(atas)))}</text>`).join("");
  const langkah = Math.ceil(kategori.length / Math.max(1, Math.floor((W - L - R) / 46)));
  const batang = kategori.map((c, i) => {
    let dasar = 0; const cx = L + lb * i + lb / 2;
    const bag = seri.map((s) => { const v = c.nilai[s.k] || 0; if (!v) return ""; const y0 = y(dasar), y1 = y(dasar + v); dasar += v; return `<rect class="ih-bar ${s.kelas}" x="${(cx - bw / 2).toFixed(1)}" y="${y1.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0.5, y0 - y1).toFixed(1)}" tabindex="0" data-tip="${tip(c.tip || c.label)}"><title>${tip(c.tip || c.label)}</title></rect>`; }).join("");
    return bag + (i % langkah === 0 ? `<text class="ih-lbl" x="${cx.toFixed(1)}" y="${H - 8}" text-anchor="middle">${esc(c.label)}</text>` : "");
  }).join("");
  const garisRef = ref ? `<line class="ih-ref" x1="${L}" x2="${W - R}" y1="${y(ref.nilai).toFixed(1)}" y2="${y(ref.nilai).toFixed(1)}"/><text class="ih-lbl ih-lbl-ref" x="${W - R}" y="${(y(ref.nilai) - 5).toFixed(1)}" text-anchor="end">${esc(ref.label)}</text>` : "";
  return `<svg class="ih-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label || satuan)}" focusable="false"><text class="ih-lbl" x="${L}" y="9">${esc(satuan)}</text>${grid}${batang}${garisRef}</svg>`;
}

/** Garis. seri: [{id, kelas, label, titik:[{x, y, tip}]}]; label ujung kanan memakai label seri. */
export function garisSvg({ seri, satuan, el, label, xTick }) {
  const W = lebar(el), H = W < 500 ? 260 : 300, L = 52, R = 84, T = 18, B = 28;
  const semua = seri.flatMap((s) => s.titik), x0 = Math.min(...semua.map((p) => p.x)), x1 = Math.max(...semua.map((p) => p.x));
  const { atas, tick } = skala(Math.max(...semua.map((p) => p.y)));
  const x = (v) => L + ((v - x0) / Math.max(1, x1 - x0)) * (W - L - R), y = (v) => T + (1 - v / atas) * (H - T - B);
  const grid = tick.map((v) => `<line class="ih-grid" x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="ih-lbl" x="${L - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${esc(n1(v, dec(atas)))}</text>`).join("");
  const sb = (xTick || [x0, Math.round((x0 + x1) / 2), x1]).map((a) => `<text class="ih-lbl" x="${x(a).toFixed(1)}" y="${H - 8}" text-anchor="middle">${a}</text>`).join("");
  const ujung = seri.map((s) => ({ s, py: y(s.titik.at(-1).y) })).sort((a, b) => a.py - b.py); let prev = -1e9;
  for (const u of ujung) { u.ly = Math.max(u.py, prev + 14); prev = u.ly; }
  const g = seri.map((s) => {
    const pts = s.titik.map((p) => `${x(p.x).toFixed(1)},${y(p.y).toFixed(1)}`).join(" "), u = ujung.find((q) => q.s === s), a = s.titik.at(-1);
    const dot = s.titik.map((p) => `<circle class="ih-tk" cx="${x(p.x).toFixed(1)}" cy="${y(p.y).toFixed(1)}" r="${s.titik.length > 30 ? 3 : 4}" tabindex="0" data-tip="${tip(p.tip)}"><title>${tip(p.tip)}</title></circle>`).join("");
    return `<g class="ih-g ${s.kelas}"><polyline class="ih-gr" points="${pts}"/>${dot}<text class="ih-lbl ih-lbl-s" x="${(x(a.x) + 8).toFixed(1)}" y="${(u.ly + 4).toFixed(1)}">${esc(s.label)}</text></g>`;
  }).join("");
  return `<svg class="ih-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label || satuan)}" focusable="false"><text class="ih-lbl" x="${L}" y="9">${esc(satuan)}</text>${grid}${sb}${g}</svg>`;
}

/** Batang mendatar (bertumpuk bila bagian banyak). baris: [{label, bagian:[{k, nilai}], tip, sorot}]; seri: [{k, kelas}]. Label dipotong elipsis, nama lengkap di tooltip. */
export function batangSvg({ baris, seri, satuan, el, label, d = 0 }) {
  const W = lebar(el), rh = 30, L = W < 520 ? 118 : 190, R = 64, T = 22, H = T + baris.length * rh + 4;
  const maks = Math.max(...baris.map((b) => b.bagian.reduce((a, p) => a + p.nilai, 0))), { atas, tick } = skala(maks);
  const x = (v) => L + (v / atas) * (W - L - R), pot = (s) => (s.length > (W < 520 ? 17 : 29) ? s.slice(0, W < 520 ? 16 : 28) + "…" : s);
  const grid = tick.map((v) => `<line class="ih-grid" x1="${x(v).toFixed(1)}" x2="${x(v).toFixed(1)}" y1="${T - 4}" y2="${H - 2}"/><text class="ih-lbl" x="${x(v).toFixed(1)}" y="10" text-anchor="middle">${esc(n1(v, dec(atas)))}</text>`).join("");
  const isi = baris.map((b, i) => {
    const y0 = T + i * rh; let dasar = 0; const tot = b.bagian.reduce((a, p) => a + p.nilai, 0);
    const bag = b.bagian.map((p) => { if (!p.nilai) return ""; const s = seri.find((q) => q.k === p.k), xa = x(dasar), xb = x(dasar + p.nilai); dasar += p.nilai; return `<rect class="ih-bar ${s.kelas}" x="${xa.toFixed(1)}" y="${y0 + 4}" width="${Math.max(1, xb - xa).toFixed(1)}" height="${rh - 10}" tabindex="0" data-tip="${tip(b.tip)}"><title>${tip(b.tip)}</title></rect>`; }).join("");
    return `<g class="ih-baris${b.sorot ? " ih-sorot" : ""}"><text class="ih-lbl ih-lbl-b" x="${L - 8}" y="${y0 + rh / 2 + 1}" text-anchor="end"><title>${esc(b.label)}</title>${esc(pot(b.label))}</text>${bag}<text class="ih-lbl" x="${(x(tot) + 6).toFixed(1)}" y="${y0 + rh / 2 + 1}">${esc(n1(tot, d))}</text></g>`;
  }).join("");
  return `<svg class="ih-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label || satuan)}" focusable="false">${grid}${isi}</svg>`;
}

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
