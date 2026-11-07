// Pustaka kecil /risiko: penguraian ubin vektor MVT dan ubin PNG, matematika ubin, titik-dalam-poligon. Tanpa dependensi.
import { inflateSync } from 'node:zlib';

export const ubinDari = (lon, lat, z) => {
  const n = 2 ** z, rad = (lat * Math.PI) / 180;
  const xf = ((lon + 180) / 360) * n, yf = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
  return { x: Math.floor(xf), y: Math.floor(yf), xf, yf };
};
export const lonLatUbin = (z, x, y, px, py, ext = 4096) => {
  const n = 2 ** z, xf = (x + px / ext) / n, yf = (y + py / ext) / n;
  return [(xf * 360 - 180), (Math.atan(Math.sinh(Math.PI * (1 - 2 * yf))) * 180) / Math.PI];
};

/* ---------- protobuf minimal ---------- */
function* medan(b, i = 0, akhir = b.length) {
  while (i < akhir) {
    let k = 0, geser = 1, c;
    do { c = b[i++]; k += (c & 127) * geser; geser *= 128; } while (c & 128);
    const no = Math.floor(k / 8), tipe = k % 8;
    if (tipe === 0) { let v = 0; geser = 1; do { c = b[i++]; v += (c & 127) * geser; geser *= 128; } while (c & 128); yield [no, tipe, v]; }
    else if (tipe === 2) { let n = 0; geser = 1; do { c = b[i++]; n += (c & 127) * geser; geser *= 128; } while (c & 128); yield [no, tipe, b.subarray(i, i + n)]; i += n; }
    else if (tipe === 1) { yield [no, tipe, b.subarray(i, i + 8)]; i += 8; }
    else if (tipe === 5) { yield [no, tipe, b.subarray(i, i + 4)]; i += 4; }
    else throw new Error('tipe protobuf ' + tipe);
  }
}
const varintAll = (b) => { const o = []; let i = 0; while (i < b.length) { let v = 0, g = 1, c; do { c = b[i++]; v += (c & 127) * g; g *= 128; } while (c & 128); o.push(v); } return o; };
const zz = (n) => (n % 2 ? -(n + 1) / 2 : n / 2);

function nilaiMvt(b) {
  for (const [no, , v] of medan(b)) {
    if (no === 1) return Buffer.from(v).toString('utf8');
    if (no === 2) return Buffer.from(v).readFloatLE(0);
    if (no === 3) return Buffer.from(v).readDoubleLE(0);
    if (no === 4 || no === 5) return v;
    if (no === 6) return zz(v);
    if (no === 7) return !!v;
  }
  return null;
}
function geometri(cmd, tipe) {
  const cincin = []; let cur = null, x = 0, y = 0, i = 0;
  while (i < cmd.length) {
    const ci = cmd[i++], id = ci & 7, n = ci >> 3;
    for (let j = 0; j < n; j++) {
      if (id === 7) { if (cur) cur.push(cur[0]); continue; }
      x += zz(cmd[i++]); y += zz(cmd[i++]);
      if (id === 1) { cur = [[x, y]]; cincin.push(cur); } else cur.push([x, y]);
    }
  }
  return tipe === 1 ? cincin.map((c) => c[0]) : cincin;
}
/** buf (sudah gunzip) -> { namaLapis: { extent, fitur: [{ tipe: 1|2|3, sifat, geom }] } } */
export function uraiMvt(buf) {
  const out = {};
  for (const [no, , lp] of medan(buf)) {
    if (no !== 3) continue;
    let nama = '', ext = 4096; const kunci = [], nilai = [], fraw = [];
    for (const [n2, , v] of medan(lp)) {
      if (n2 === 1) nama = Buffer.from(v).toString('utf8');
      else if (n2 === 2) fraw.push(v);
      else if (n2 === 3) kunci.push(Buffer.from(v).toString('utf8'));
      else if (n2 === 4) nilai.push(nilaiMvt(v));
      else if (n2 === 5) ext = v;
    }
    const fitur = fraw.map((fb) => {
      let tipe = 0, tags = [], cmd = [];
      for (const [n3, , v] of medan(fb)) { if (n3 === 2) tags = varintAll(v); else if (n3 === 3) tipe = v; else if (n3 === 4) cmd = varintAll(v); }
      const sifat = {}; for (let i = 0; i < tags.length; i += 2) sifat[kunci[tags[i]]] = nilai[tags[i + 1]];
      return { tipe, sifat, geom: geometri(cmd, tipe) };
    });
    out[nama] = { extent: ext, fitur };
  }
  return out;
}

/* ---------- titik di dalam poligon (genap-ganjil lintas semua cincin satu fitur, memadai untuk cincin tak tumpang tindih) ---------- */
const dalamCincin = (c, px, py) => {
  let d = false;
  for (let i = 0, j = c.length - 1; i < c.length; j = i++) {
    const [xi, yi] = c[i], [xj, yj] = c[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) d = !d;
  }
  return d;
};
export const dalamFitur = (cincin, px, py) => cincin.reduce((a, c) => (dalamCincin(c, px, py) ? !a : a), false);

/* ---------- PNG 8-bit tak berselang-seling (RGBA/RGB/gray/palet) ---------- */
export function uraiPng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('bukan PNG');
  let i = 8, w = 0, h = 0, tipe = 6, dalam = 8, palet = null, trns = null; const idat = [];
  while (i < buf.length) {
    const n = buf.readUInt32BE(i), t = buf.toString('latin1', i + 4, i + 8), d = buf.subarray(i + 8, i + 8 + n);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); dalam = d[8]; tipe = d[9]; if (d[12]) throw new Error('PNG berselang-seling'); }
    else if (t === 'PLTE') palet = d; else if (t === 'tRNS') trns = d; else if (t === 'IDAT') idat.push(d);
    i += 12 + n;
  }
  if (dalam !== 8) throw new Error('kedalaman bit ' + dalam);
  const kanal = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[tipe], baris = w * kanal, raw = inflateSync(Buffer.concat(idat)), px = Buffer.alloc(h * baris);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (baris + 1)], s = y * (baris + 1) + 1, o = y * baris;
    for (let x = 0; x < baris; x++) {
      const a = x >= kanal ? px[o + x - kanal] : 0, b = y ? px[o - baris + x] : 0, c = x >= kanal && y ? px[o - baris + x - kanal] : 0;
      let v = raw[s + x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      px[o + x] = v & 255;
    }
  }
  /** [r,g,b,a] di (x,y) */
  const ambil = (x, y) => {
    const o = (y * w + x) * kanal;
    if (tipe === 6) return [px[o], px[o + 1], px[o + 2], px[o + 3]];
    if (tipe === 2) return [px[o], px[o + 1], px[o + 2], 255];
    if (tipe === 4) return [px[o], px[o], px[o], px[o + 1]];
    if (tipe === 3) { const k = px[o]; return [palet[k * 3], palet[k * 3 + 1], palet[k * 3 + 2], trns && k < trns.length ? trns[k] : 255]; }
    return [px[o], px[o], px[o], 255];
  };
  return { w, h, ambil };
}
