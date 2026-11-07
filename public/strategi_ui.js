/* Pembantu tampilan /strategi: tabel urut berpaginasi (data penuh diurutkan sendiri), garis bertooltip, segmen, legenda.
   INP: klik urut/halaman mengubah chrome seketika; isi tabel menyusul lewat nanti(). Teks semua lewat kamus (t()). */
import { t, bahasa } from "/i18n.js";
import { esc, nanti, ikon } from "/inti/umum.js";
import { paginasiHtml } from "/inti/paginasi.js";
import { pil, num } from "/analisis.js";

const TB = new Map();
export const bersihTabel = () => TB.clear();

export function daftarTabel(id, kols, baris, per = 8) {
  TB.set(id, { kols, baris, per, hal: 1, urut: null });
  return `<div class="jm-st-tb" id="tb-${id}" data-tb="${id}">${isiTabel(id)}</div>`;
}
export function ubahBaris(id, baris) {
  const s = TB.get(id);
  if (!s) return;
  s.baris = baris; s.hal = 1;
  const w = document.getElementById("tb-" + id);
  if (w) w.innerHTML = isiTabel(id);
}
function urutkan(s) {
  if (!s.urut) return s.baris;
  const k = s.kols.find((c) => c.k === s.urut.k);
  return [...s.baris].sort((x, z) => {
    const a = k.v(x), c = k.v(z);
    return ((a == null) - (c == null)) || (a == null ? 0 : (typeof a === "number" ? a - c : String(a).localeCompare(String(c), bahasa()))) * s.urut.arah;
  });
}
function isiTabel(id) {
  const s = TB.get(id), b = urutkan(s), dari = (s.hal - 1) * s.per;
  const kep = s.kols.map((c) => `<th${c.num ? ' class="jm-num"' : ""} aria-sort="${s.urut?.k === c.k ? (s.urut.arah > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-urut="${esc(c.k)}">${esc(t(c.l))}${c.est ? " " + pil("an.est") : ""}</button></th>`).join("");
  const isi = b.slice(dari, dari + s.per).map((r) => `<tr>${s.kols.map((c) => `<td data-label="${esc(t(c.l))}"${c.num ? ' class="jm-num"' : ""}>${c.f(r)}</td>`).join("")}</tr>`).join("");
  return `<div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr>${kep}</tr></thead><tbody>${isi}</tbody></table></div>${paginasiHtml({ hal: s.hal, total: b.length, per: s.per, satuan: "st.u.baris" })}`;
}
function csvTabel(id) {
  const s = TB.get(id), el = (h) => { const d = document.createElement("div"); d.innerHTML = h; return d.textContent.replace(/\s+/g, " ").trim(); };
  return [s.kols.map((c) => t(c.l)), ...urutkan(s).map((r) => s.kols.map((c) => el(c.f(r))))];
}
export function pasangTabel() {
  document.addEventListener("click", (e) => {
    const w = e.target.closest("[data-tb]");
    if (!w) return;
    const s = TB.get(w.dataset.tb);
    const u = e.target.closest("button[data-urut]"), h = e.target.closest("button[data-hal]");
    if (u) {
      s.urut = s.urut?.k === u.dataset.urut ? { k: s.urut.k, arah: -s.urut.arah } : { k: u.dataset.urut, arah: 1 };
      s.hal = 1;
      for (const x of w.querySelectorAll("th")) x.setAttribute("aria-sort", "none");
      u.parentElement.setAttribute("aria-sort", s.urut.arah > 0 ? "ascending" : "descending");
    } else if (h && !h.disabled) {
      s.hal = +h.dataset.hal;
      for (const b of w.querySelectorAll(".jm-pag-b")) b.classList.toggle("on", b.dataset.hal === h.dataset.hal && !/[‹›]/.test(b.textContent));
    } else return;
    nanti(() => { const y = scrollY; w.innerHTML = isiTabel(w.dataset.tb); if (h) w.scrollIntoView({ block: "nearest" }); else scrollTo(scrollX, y); });
  });
  document.addEventListener("jm:csv", (e) => {
    const w = e.target.querySelector?.("[data-tb]");
    if (w && e.target.classList.contains("jm-ex") && !e.detail.baris) e.detail.baris = csvTabel(w.dataset.tb);
  });
}

export const seg = (nama, opsi, aktif, label) => `<div class="jm-tab" role="tablist" aria-label="${esc(label)}" data-seg="${nama}">${opsi.map(([v, l, ik]) => `<button type="button" role="tab" data-v="${v}" aria-selected="${v === aktif}">${ik ? ikon(ik, 18) : ""}<span>${esc(t(l))}</span></button>`).join("")}</div>`;
export const legenda = (items) => `<ul class="jm-st-leg">${items.map(([k, ket]) => `<li><i class="jm-st-sw jm-st-sw-${k}" aria-hidden="true"></i>${esc(t(ket))}</li>`).join("")}</ul>`;

/* garis dengan titik bertooltip. seri: [{nama, v:[angka|null], sorot?, putus?}] */
export function garisTip(labels, seri, { d = 0, satuan = "", label = "" } = {}) {
  const M = innerWidth < 640, W = M ? 420 : 680, H = M ? 250 : 230, Lk = 40, Rk = M ? 100 : 122, T = 14, B = H - 28, n = labels.length, fs = M ? 13 : 11.5;
  const mx = Math.max(1, ...seri.flatMap((s) => s.v.filter((x) => x != null))) * 1.1;
  const X = (i) => Lk + (n > 1 ? (i / (n - 1)) * (W - Lk - Rk) : 0), Y = (v) => B - (v / mx) * (B - T);
  const f = (v) => num(v, d);
  let g = [0, 1 / 3, 2 / 3, 1].map((q) => `<line class="jm-gf-grid" x1="${Lk}" x2="${W - Rk}" y1="${Y(mx * q).toFixed(1)}" y2="${Y(mx * q).toFixed(1)}"/><text class="jm-gf-t2" x="${Lk - 6}" y="${(Y(mx * q) + 4).toFixed(1)}" text-anchor="end" font-size="${fs - 1}">${esc(f(mx * q))}</text>`).join("");
  const langkah = Math.max(1, Math.ceil(n / (M ? 5 : 8)));
  g += labels.map((l, i) => ((i % langkah === 0 && n - 1 - i >= langkah) || i === n - 1 ? `<text class="jm-gf-t2" x="${X(i).toFixed(1)}" y="${B + 16}" text-anchor="${i === n - 1 ? "end" : "middle"}" font-size="${fs}">${esc(l)}</text>` : "")).join("");
  const ujung = [];
  for (const s of [...seri].sort((a, b) => !!a.sorot - !!b.sorot)) {
    const p = s.v.map((v, i) => (v == null ? null : [X(i), Y(v), v, i])).filter(Boolean);
    if (!p.length) continue;
    const z = p.at(-1);
    g += `<polyline class="jm-gf-gar ${s.sorot ? "jm-gf-sorot-g" : "jm-gf-gar-abu"}${s.putus ? " jm-st-putus" : ""}" points="${p.map((q) => q[0].toFixed(1) + "," + q[1].toFixed(1)).join(" ")}"/>`;
    g += p.map((q) => `<circle class="jm-st-hit${s.sorot ? " jm-st-hit-s" : ""}" cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${M ? 8 : 5}"><title>${esc(s.nama)}, ${esc(labels[q[3]])}: ${esc(f(q[2]) + satuan)}</title></circle>`).join("");
    ujung.push({ y: z[1], x: z[0], on: !!s.sorot, teks: `${s.nama} ${f(z[2])}${satuan}` });
  }
  ujung.sort((a, b) => a.y - b.y);
  for (let i = 1; i < ujung.length; i++) if (ujung[i].y - ujung[i - 1].y < fs + 3) ujung[i].y = ujung[i - 1].y + fs + 3;
  g += ujung.map((u) => `<text class="jm-gf-t1${u.on ? " jm-gf-tb" : ""}" x="${(u.x + 8).toFixed(1)}" y="${(u.y + 4).toFixed(1)}" font-size="${fs - 1}">${esc(u.teks)}</text>`).join("");
  return `<svg class="jm-gf" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}" focusable="false">${g}</svg>`;
}

/* kolom bertumpuk bertooltip: items [{label, bagian:[{v, kls, tip}]}] */
export function kolomTumpuk(items, { d = 0, label = "" } = {}) {
  const M = innerWidth < 640, W = M ? 420 : 680, H = M ? 240 : 220, L = 40, R = 10, T = 12, B = H - 28, fs = M ? 13 : 11.5, n = items.length;
  const tot = (x) => x.bagian.reduce((s, b) => s + b.v, 0), mx = Math.max(1, ...items.map(tot)) * 1.08, Y = (v) => B - (v / mx) * (B - T);
  const gap = (W - L - R) / n, bw = Math.min(46, gap * 0.62);
  let g = [0, 0.5, 1].map((q) => `<line class="jm-gf-grid" x1="${L}" x2="${W - R}" y1="${Y(mx * q).toFixed(1)}" y2="${Y(mx * q).toFixed(1)}"/><text class="jm-gf-t2" x="${L - 6}" y="${(Y(mx * q) + 4).toFixed(1)}" text-anchor="end" font-size="${fs - 1}">${esc(num(mx * q, d))}</text>`).join("");
  items.forEach((x, i) => {
    const px = L + i * gap + (gap - bw) / 2;
    let acc = 0;
    for (const b of x.bagian) {
      if (b.v <= 0) continue;
      g += `<rect class="${b.kls}" x="${px.toFixed(1)}" y="${Y(acc + b.v).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, Y(acc) - Y(acc + b.v)).toFixed(1)}"><title>${esc(b.tip)}</title></rect>`;
      acc += b.v;
    }
    g += `<text class="jm-gf-t1" x="${(px + bw / 2).toFixed(1)}" y="${(Y(acc) - 5).toFixed(1)}" text-anchor="middle" font-size="${fs - 1}">${esc(num(acc, d))}</text><text class="jm-gf-t2" x="${(px + bw / 2).toFixed(1)}" y="${B + 16}" text-anchor="middle" font-size="${fs}">${esc(x.label)}</text>`;
  });
  return `<svg class="jm-gf" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}" focusable="false">${g}</svg>`;
}
