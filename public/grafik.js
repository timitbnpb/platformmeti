/* Modul grafik bersama (SVG tanpa pustaka), dipakai /insight, beranda, dan /berita. Gaya diport dari Posko Karhutla (kolom dengan puncak dan
   garis rata-rata putus-putus, batang berlabel ujung, garis dengan label langsung) dan dirapikan ala konsultan: satu warna sorot (token METI), abu untuk konteks,
   tanpa legenda, tanpa kotak sumbu. Gaya ada di /grafik.css. Semua fungsi mengembalikan string SVG; judul <title> jadi tooltip dan teks alternatif. */
import { esc } from "/inti/umum.js";
import "/inti/tip_grafik.js";
import { angka } from "/i18n.js";

const fmt = (n, d = 0) => angka(n, { desimal: d });
const potong = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);
const ukuran = () => (innerWidth < 640 ? { M: true, W: 420, fs: 13, L: 118, ch: 20 } : { M: false, W: 680, fs: 11.5, L: 150, ch: 26 });
const svg = (W, H, isi, label) => `<svg class="jm-gf" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label ?? "")}" focusable="false">${isi}</svg>`;

/* pil bernilai: [svg, lebar]; anchor start|middle|end */
export function pil(x, y, teks, { fs = 11, anchor = "start", kelas = "jm-gf-pil" } = {}) {
  const w = teks.length * fs * 0.62 + 14, h = fs + 9, x0 = anchor === "end" ? x - w : anchor === "middle" ? x - w / 2 : x;
  return [`<rect class="${kelas}" x="${x0.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h}" rx="${h / 2}"/><text class="jm-gf-pilt" x="${(x0 + w / 2).toFixed(1)}" y="${(y + h / 2 + fs * 0.35).toFixed(1)}" text-anchor="middle" font-size="${fs}">${esc(teks)}</text>`.replace(' style-x=""', ""), w];
}

/* Kolom: items [{label, v, sorot?, tip?}]. Puncak diberi pil, sorot default = puncak. rata: garis putus-putus. */
export function kolom(items, { rata = null, teksRata = "", d = 0, label = "", nilai = true } = {}) {
  const { M, W, fs } = ukuran(), H = M ? 240 : 220, L = 38, R = 10, T = 34, B = H - 28, n = items.length;
  const mx = Math.max(1, ...items.map((x) => x.v), rata ?? 0), gap = (W - L - R) / n, bw = gap * 0.68, Y = (v) => B - (v / mx) * (B - T);
  const ip = items.reduce((m, x, i) => (x.v > items[m].v ? i : m), 0), adaS = items.some((x) => x.sorot), langkah = Math.max(1, Math.ceil(n / (M ? 6 : 10)));
  let g = [0, 0.5, 1].map((f) => `<line class="jm-gf-grid" x1="${L}" x2="${W - R}" y1="${Y(mx * f).toFixed(1)}" y2="${Y(mx * f).toFixed(1)}"/><text class="jm-gf-t2" x="${L - 6}" y="${(Y(mx * f) + 4).toFixed(1)}" text-anchor="end" font-size="${fs - 1}">${esc(fmt(mx * f, d && mx < 10 ? 1 : 0))}</text>`).join("");
  items.forEach((x, i) => {
    const px = L + i * gap + (gap - bw) / 2, y = Y(x.v), s = adaS ? x.sorot : i === ip;
    g += `<rect class="jm-gf-b${s ? " jm-gf-sorot" : ""}" x="${px.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, B - y).toFixed(1)}" rx="${Math.min(4, bw / 3).toFixed(1)}"><title>${esc(x.tip ?? `${x.label}: ${fmt(x.v, d)}`)}</title></rect>`;
    if (i % langkah === 0 || i === n - 1) g += `<text class="jm-gf-t2" x="${(px + bw / 2).toFixed(1)}" y="${B + 16}" text-anchor="middle" font-size="${fs}">${esc(x.label)}</text>`;
    if (i === ip && !x.sorot) g += pil(px + bw / 2, y - 26, fmt(x.v, d), { fs: fs - 0.5, anchor: "middle" })[0];
    else if (nilai && n <= (M ? 8 : 14)) g += `<text class="jm-gf-t1${s ? " jm-gf-tb" : ""}" x="${(px + bw / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" font-size="${fs - 1}">${esc(fmt(x.v, d))}</text>`;
    if (x.sorot) g += pil(px + bw / 2, y - 26, fmt(x.v, d), { fs: fs - 0.5, anchor: "middle" })[0];
  });
  if (rata != null) g += `<line class="jm-gf-ref" x1="${L}" x2="${W - R}" y1="${Y(rata).toFixed(1)}" y2="${Y(rata).toFixed(1)}"/><text class="jm-gf-t1" x="${L + 4}" y="${(Y(rata) - 5).toFixed(1)}" font-size="${fs - 1}">${esc(teksRata)}</text>`;
  return svg(W, H, g, label);
}

/* Batang horizontal tipis: rows [{label, v, v0?, teks?, sorot?}]; v0 = bagian dasar abu, v = bagian sorot yang ditumpuk. ref: garis putus-putus vertikal. */
export function batang(rows, { maks, ref = null, teksRef = "", label = "" } = {}) {
  const { M, W, fs, L } = ukuran(), rh = M ? 34 : 28, R = M ? 70 : 84, T = ref != null ? 18 : 4, H = T + rows.length * rh + 4;
  const mx = maks ?? Math.max(1, ...rows.map((r) => (r.v0 ?? 0) + r.v), ref ?? 0), X = (v) => (v / mx) * (W - L - R), bt = 10;
  const ip = rows.findIndex((r) => r.sorot), s = ip < 0 ? 0 : ip;
  let g = "";
  rows.forEach((r, i) => {
    const y = T + i * rh, on = i === s, b0 = r.v0 ?? 0, ym = y + (rh - bt) / 2;
    g += `<text class="jm-gf-t1${on ? " jm-gf-tb" : ""}" x="${L - 8}" y="${(ym + bt - 1).toFixed(1)}" text-anchor="end" font-size="${fs}">${esc(potong(r.label, r.img ? (M ? 12 : 16) : (M ? 17 : 22)))}<title>${esc(r.label)}</title></text>`;
    if (r.img) { const w = r.bend ? 20 : 18, h = r.bend ? 15 : 18; g += `<image href="${esc(r.img)}" x="2" y="${(ym + bt / 2 - h / 2).toFixed(1)}" width="${w}" height="${h}" preserveAspectRatio="${r.bend ? "xMidYMid slice" : "xMidYMid meet"}"/>`; }
    if (b0) g += `<rect class="jm-gf-abu" x="${L}" y="${ym}" width="${X(b0).toFixed(1)}" height="${bt}" rx="2"/>`;
    g += `<rect class="${on || b0 ? "jm-gf-sorot" : "jm-gf-abu"}" x="${(L + X(b0)).toFixed(1)}" y="${ym}" width="${Math.max(1, X(r.v)).toFixed(1)}" height="${bt}" rx="2"><title>${esc(r.label)}: ${esc(r.teks ?? fmt(r.v))}</title></rect>`;
    g += `<text class="jm-gf-t1${on ? " jm-gf-tb" : ""}" x="${(L + X(b0 + r.v) + 6).toFixed(1)}" y="${(ym + bt - 1).toFixed(1)}" font-size="${fs}">${esc(r.teks ?? fmt(r.v))}</text>`;
  });
  if (ref != null) g += `<line class="jm-gf-ref" x1="${(L + X(ref)).toFixed(1)}" x2="${(L + X(ref)).toFixed(1)}" y1="${T - 4}" y2="${H}"/><text class="jm-gf-t1" x="${(L + X(ref)).toFixed(1)}" y="10" text-anchor="middle" font-size="${fs - 1}">${esc(teksRef)}</text>`;
  return svg(W, H, g, label);
}

/* Dumbbell: rows [{label, a, b, sorot?, tekA?, tekB?}]; titik abu = a (dulu), titik sorot = b (kini). kepA/kepB = judul kecil di atas. */
export function dumbbell(rows, { kepA = "", kepB = "", d = 0, label = "" } = {}) {
  const { M, W, fs, L } = ukuran(), rh = M ? 34 : 30, R = 18, T = 26, H = T + rows.length * rh + 4, pad = 34;
  const mx = Math.max(1, ...rows.flatMap((r) => [r.a, r.b])), X = (v) => L + pad + (v / mx) * (W - L - R - 2 * pad);
  const ip = rows.findIndex((r) => r.sorot), s = ip < 0 ? 0 : ip;
  let g = `<circle class="jm-gf-da" cx="${L}" cy="10" r="5"/><text class="jm-gf-t2" x="${L + 10}" y="14" font-size="${fs}">${esc(kepA)}</text><circle class="jm-gf-db" cx="${L + 20 + kepA.length * fs * 0.6 + 14}" cy="10" r="5"/><text class="jm-gf-t2" x="${L + 30 + kepA.length * fs * 0.6 + 14}" y="14" font-size="${fs}">${esc(kepB)}</text>`;
  rows.forEach((r, i) => {
    const y = T + i * rh + rh / 2, on = i === s, xa = X(r.a), xb = X(r.b), kiriA = r.a <= r.b;
    g += `<text class="jm-gf-t1${on ? " jm-gf-tb" : ""}" x="${L - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="${fs}">${esc(potong(r.label, M ? 17 : 22))}<title>${esc(r.label)}</title></text>`;
    g += `<line class="jm-gf-hub${on ? " jm-gf-sorot-g" : ""}" x1="${xa.toFixed(1)}" x2="${xb.toFixed(1)}" y1="${y}" y2="${y}"/>`;
    g += `<circle class="jm-gf-da" cx="${xa.toFixed(1)}" cy="${y}" r="5"><title>${esc(kepA)}: ${esc(r.tekA ?? fmt(r.a, d))}</title></circle><circle class="jm-gf-db${on ? "" : " jm-gf-db-lemah"}" cx="${xb.toFixed(1)}" cy="${y}" r="5.5"><title>${esc(kepB)}: ${esc(r.tekB ?? fmt(r.b, d))}</title></circle>`;
    g += `<text class="jm-gf-t2" x="${(xa + (kiriA ? -9 : 9)).toFixed(1)}" y="${y + 4}" text-anchor="${kiriA ? "end" : "start"}" font-size="${fs - 1}">${esc(r.tekA ?? fmt(r.a, d))}</text><text class="jm-gf-t1${on ? " jm-gf-tb" : ""}" x="${(xb + (kiriA ? 9 : -9)).toFixed(1)}" y="${y + 4}" text-anchor="${kiriA ? "start" : "end"}" font-size="${fs - 1}">${esc(r.tekB ?? fmt(r.b, d))}</text>`;
  });
  return svg(W, H, g, label);
}

/* Garis waktu: labels [str], seri [{nama, v:[angka|null], sorot?}]. Seri sorot hijau, lainnya abu; label langsung di ujung kanan, titik akhir ditebalkan. */
export function garis(labels, seri, { area = false, d = 0, label = "", teksAkhir = true } = {}) {
  const { M, W, fs } = ukuran(), H = M ? 240 : 220, L = 38, R = M ? 108 : 130, T = 14, B = H - 28, n = labels.length;
  const mx = Math.max(1, ...seri.flatMap((s) => s.v.filter((x) => x != null))) * 1.1, X = (i) => L + (n > 1 ? (i / (n - 1)) * (W - L - R) : 0), Y = (v) => B - (v / mx) * (B - T);
  let g = [0, 1 / 3, 2 / 3, 1].map((f) => `<line class="jm-gf-grid" x1="${L}" x2="${W - R}" y1="${Y(mx * f).toFixed(1)}" y2="${Y(mx * f).toFixed(1)}"/><text class="jm-gf-t2" x="${L - 6}" y="${(Y(mx * f) + 4).toFixed(1)}" text-anchor="end" font-size="${fs - 1}">${esc(fmt(mx * f, d && mx < 10 ? 1 : 0))}</text>`).join("");
  const langkah = Math.max(1, Math.ceil(n / (M ? 5 : 8)));
  g += labels.map((l, i) => (i % langkah === 0 || i === n - 1 ? `<text class="jm-gf-t2" x="${X(i).toFixed(1)}" y="${B + 16}" text-anchor="${i === n - 1 && n > 1 ? "end" : "middle"}" font-size="${fs}">${esc(l)}</text>` : "")).join("");
  const adaS = seri.some((s) => s.sorot), ujung = [];
  [...seri].sort((a, b) => (adaS ? !!a.sorot - !!b.sorot : 0)).forEach((s, si, arr) => {
    const on = adaS ? !!s.sorot : si === arr.length - 1, p = s.v.map((v, i) => (v == null ? null : [X(i), Y(v), v, i])).filter(Boolean);
    if (!p.length) return;
    const pts = p.map((q) => q[0].toFixed(1) + "," + q[1].toFixed(1)).join(" "), z = p[p.length - 1];
    if (area && on) g += `<polygon class="jm-gf-area" points="${p[0][0].toFixed(1)},${B} ${pts} ${z[0].toFixed(1)},${B}"/>`;
    g += `<polyline class="${on ? "jm-gf-gar jm-gf-sorot-g" : "jm-gf-gar jm-gf-gar-abu"}" points="${pts}"/>`;
    if (p.length <= 16) g += p.map((q) => `<circle class="${on ? "jm-gf-tt" : "jm-gf-tt-abu"}" cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="2.6"><title>${esc(s.nama)}, ${esc(labels[q[3]])}: ${esc(fmt(q[2], d))}</title></circle>`).join("");
    g += `<circle class="${on ? "jm-gf-db" : "jm-gf-da"}" cx="${z[0].toFixed(1)}" cy="${z[1].toFixed(1)}" r="${on ? 5 : 4}"/>`;
    ujung.push({ y: z[1], on, teks: potong(s.nama, M ? 12 : 16), v: fmt(z[2], d), x: z[0] });
  });
  if (teksAkhir) {
    ujung.sort((a, b) => a.y - b.y);
    for (let i = 1; i < ujung.length; i++) if (ujung[i].y - ujung[i - 1].y < fs + 3) ujung[i].y = ujung[i - 1].y + fs + 3;
    g += ujung.map((u) => `<text class="jm-gf-t1${u.on ? " jm-gf-tb" : ""}" x="${(u.x + 10).toFixed(1)}" y="${(u.y + 4).toFixed(1)}" font-size="${fs}">${esc(u.teks)} ${esc(u.v)}</text>`).join("");
  }
  return svg(W, H, g, label);
}
