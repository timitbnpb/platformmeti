// Pembaca xlsx minimal tanpa pustaka (zip + sharedStrings + sheetN.xml): untuk AidData GCDF 3.0 dan BU CGEF.
//   bacaXlsx(bufXlsx, nomorLembar, (barisObjek) => boolean|void)  baris = {A: nilai, B: ...} (nilai string); callback dipanggil per baris.
import zlib from 'node:zlib';
import assert from 'node:assert/strict';

export function bacaZip(buf) { // -> Map nama -> () => Buffer
  let e = buf.length - 22; while (e >= 0 && buf.readUInt32LE(e) !== 0x06054b50) e--; if (e < 0) throw new Error('bukan zip');
  const n = buf.readUInt16LE(e + 10); let p = buf.readUInt32LE(e + 16); const m = new Map();
  for (let i = 0; i < n; i++) {
    const metode = buf.readUInt16LE(p + 10), csz = buf.readUInt32LE(p + 20), nl = buf.readUInt16LE(p + 28), el = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), lh = buf.readUInt32LE(p + 42);
    const nama = buf.toString('utf8', p + 46, p + 46 + nl); p += 46 + nl + el + cl;
    m.set(nama, () => { const o = lh + 30 + buf.readUInt16LE(lh + 26) + buf.readUInt16LE(lh + 28); const d = buf.subarray(o, o + csz); return metode === 0 ? d : zlib.inflateRawSync(d); });
  }
  return m;
}
const ent = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
export function bacaXlsx(buf, lembar, tiapBaris) {
  const z = bacaZip(buf); const ss = [];
  const sx = z.get('xl/sharedStrings.xml')?.().toString('utf8') || '';
  for (const m of sx.matchAll(/<si>([\s\S]*?)<\/si>/g)) ss.push(ent([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')));
  const xml = z.get(`xl/worksheets/sheet${lembar}.xml`)().toString('utf8');
  for (const rm of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const r = {};
    for (const c of rm[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = /r="([A-Z]+)\d+"/.exec(c[1])?.[1]; if (!ref || c[2] == null) continue; const t = /t="(\w+)"/.exec(c[1])?.[1];
      const v = /<v>([\s\S]*?)<\/v>/.exec(c[2]); const is = /<is>([\s\S]*?)<\/is>/.exec(c[2]);
      const val = v ? (t === 's' ? ss[Number(v[1])] : ent(v[1])) : is ? ent([...is[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join('')) : null;
      if (val != null && val !== '') r[ref] = val;
    }
    if (tiapBaris(r) === false) break;
  }
}
if (process.argv[2] === '--selftest') {
  // zip kecil tanpa kompresi (metode 0) dibangun manual
  const dosya = (nama, isi) => ({ nama: Buffer.from(nama), isi: Buffer.from(isi) });
  const files = [dosya('xl/sharedStrings.xml', '<sst><si><t>Halo &amp; dunia</t></si></sst>'), dosya('xl/worksheets/sheet1.xml', '<worksheet><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1"><v>2.5</v></c></row></worksheet>')];
  const lh = [], cd = []; let off = 0;
  for (const f of files) { const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt32LE(f.isi.length, 18); h.writeUInt32LE(f.isi.length, 22); h.writeUInt16LE(f.nama.length, 26); const blok = Buffer.concat([h, f.nama, f.isi]); const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt32LE(f.isi.length, 20); c.writeUInt32LE(f.isi.length, 24); c.writeUInt16LE(f.nama.length, 28); c.writeUInt32LE(off, 42); cd.push(Buffer.concat([c, f.nama])); lh.push(blok); off += blok.length; }
  const cdb = Buffer.concat(cd); const eocd = Buffer.alloc(22); eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(2, 10); eocd.writeUInt32LE(cdb.length, 12); eocd.writeUInt32LE(off, 16);
  const baris = []; bacaXlsx(Buffer.concat([...lh, cdb, eocd]), 1, (r) => { baris.push(r); });
  assert.deepEqual(baris, [{ A: 'Halo & dunia', B: '2.5' }]); console.log('selftest ok');
}
