// Pembaca minimal berkas Stata .dta rilis 118 (little-endian), tanpa pustaka: dipakai untuk World Bank PPI Database (2024-PPI-Full-DTA.dta).
//   import { bacaDta } from './global_negara_dta.mjs' -> { kolom: [nama], label: {nama: label}, baris: [{nama: nilai}] }  (--selftest)
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

export function bacaDta(buf) {
  const ada = (t) => { const a = buf.indexOf(`<${t}>`); if (a < 0) throw new Error('tag hilang ' + t); return a + t.length + 2; };
  if (buf.toString('latin1', ada('release'), ada('release') + 3) !== '118') throw new Error('hanya rilis 118');
  if (buf.toString('latin1', ada('byteorder'), ada('byteorder') + 3) !== 'LSF') throw new Error('hanya little-endian');
  const K = buf.readUInt16LE(ada('K')), N = Number(buf.readBigUInt64LE(ada('N')));
  const tipe = []; let p = ada('variable_types'); for (let i = 0; i < K; i++, p += 2) tipe.push(buf.readUInt16LE(p));
  const teks = (a, w, n) => Array.from({ length: n }, (_, i) => { const s = buf.subarray(a + i * w, a + (i + 1) * w); const z = s.indexOf(0); return s.toString('utf8', 0, z < 0 ? w : z); });
  const nama = teks(ada('varnames'), 129, K); const lab = teks(ada('variable_labels'), 321, K);
  const lebar = (t) => (t <= 2045 ? t : t === 32768 ? 8 : t === 65526 ? 8 : t === 65527 ? 4 : t === 65528 ? 4 : t === 65529 ? 2 : 1);
  const rl = tipe.reduce((a, t) => a + lebar(t), 0); let d = ada('data'); const baris = [];
  const NA = { 65528: 2147483620, 65529: 32740, 65530: 100 };
  for (let r = 0; r < N; r++, d += rl) {
    const o = {}; let q = d;
    for (let i = 0; i < K; i++) {
      const t = tipe[i]; let v;
      if (t <= 2045) { const s = buf.subarray(q, q + t); const z = s.indexOf(0); v = s.toString('utf8', 0, z < 0 ? t : z); }
      else if (t === 65526) { v = buf.readDoubleLE(q); if (v > 8.9e307) v = null; }
      else if (t === 65527) { v = buf.readFloatLE(q); if (v > 1.6e38) v = null; }
      else if (t === 65528) { v = buf.readInt32LE(q); if (v >= NA[65528]) v = null; }
      else if (t === 65529) { v = buf.readInt16LE(q); if (v >= NA[65529]) v = null; }
      else if (t === 65530) { v = buf.readInt8(q); if (v >= NA[65530]) v = null; }
      else v = null; // strL tak dipakai
      o[nama[i]] = v; q += lebar(t);
    }
    baris.push(o);
  }
  // label nilai: <value_label_names> (nama label per variabel) + <value_labels> (<lbl> berulang)
  const etiket = {};
  if (buf.indexOf('<value_labels>') >= 0 && buf.indexOf('<value_label_names>') >= 0) {
    const vln = teks(ada('value_label_names'), 129, K); const tbl = {}; let a = ada('value_labels');
    while (buf.toString('latin1', a, a + 5) === '<lbl>') {
      a += 5; const len = buf.readInt32LE(a); const nm = teks(a + 4, 129, 1)[0]; let b = a + 4 + 129 + 3; const n = buf.readInt32LE(b), tl = buf.readInt32LE(b + 4); b += 8;
      const off = [], val = []; for (let i = 0; i < n; i++) off.push(buf.readInt32LE(b + i * 4)); for (let i = 0; i < n; i++) val.push(buf.readInt32LE(b + 4 * n + i * 4));
      const tx = buf.subarray(b + 8 * n, b + 8 * n + tl); tbl[nm] = Object.fromEntries(val.map((v, i) => { const z = tx.indexOf(0, off[i]); return [v, tx.toString('utf8', off[i], z < 0 ? tl : z)]; }));
      a += len + 4 + 6; // len + isi + </lbl>
    }
    nama.forEach((n, i) => { if (vln[i] && tbl[vln[i]]) etiket[n] = tbl[vln[i]]; });
  }
  return { kolom: nama, label: Object.fromEntries(nama.map((n, i) => [n, lab[i]])), etiket, baris };
}
if (process.argv[2] === '--selftest') {
  const nama = 'x'.padEnd(129, '\0'), lab = ''.padEnd(321, '\0');
  const u16 = (v) => { const b = Buffer.alloc(2); b.writeUInt16LE(v); return b; }; const u64 = (v) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(v)); return b; };
  const dbl = Buffer.alloc(8); dbl.writeDoubleLE(2.5); const s3 = Buffer.from('ab\0');
  const tag = (t, ...c) => Buffer.concat([Buffer.from(`<${t}>`), ...c, Buffer.from(`</${t}>`)]);
  const buf = Buffer.concat([Buffer.from('<stata_dta>'), tag('header', tag('release', Buffer.from('118')), tag('byteorder', Buffer.from('LSF')), tag('K', u16(2)), tag('N', u64(1))), tag('variable_types', u16(65526), u16(3)), tag('varnames', Buffer.from(nama + 'y'.padEnd(129, '\0'), 'latin1')), tag('variable_labels', Buffer.from(lab + 'Teks'.padEnd(321, '\0'))), tag('data', dbl, s3)]);
  const r = bacaDta(buf); assert.deepEqual(r.baris, [{ x: 2.5, y: 'ab' }]); assert.equal(r.label.y, 'Teks'); console.log('selftest ok');
}
