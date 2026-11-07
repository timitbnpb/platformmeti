// docx.js: DOCX minimal tanpa pustaka (zip tanpa kompresi + OOXML). Murni, tanpa D1. Dipakai ekspor Rekap posisi METI.
const enc = new TextEncoder();
const TABEL_CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
export function crc32(b) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = TABEL_CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

/** Zip metode "store". berkas: [[nama, string|Uint8Array]]. */
export function zip(berkas) {
  const bagian = [], pusat = []; let pos = 0;
  const u16 = (v) => [v & 255, (v >>> 8) & 255], u32 = (v) => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
  for (const [nama, isi] of berkas) {
    const n = enc.encode(nama), d = typeof isi === "string" ? enc.encode(isi) : isi, c = crc32(d);
    const lokal = new Uint8Array([0x50, 0x4b, 3, 4, ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(c), ...u32(d.length), ...u32(d.length), ...u16(n.length), ...u16(0)]);
    pusat.push(new Uint8Array([0x50, 0x4b, 1, 2, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(c), ...u32(d.length), ...u32(d.length), ...u16(n.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(pos)]), n);
    bagian.push(lokal, n, d); pos += lokal.length + n.length + d.length;
  }
  const ukPusat = pusat.reduce((s, x) => s + x.length, 0);
  const akhir = new Uint8Array([0x50, 0x4b, 5, 6, ...u16(0), ...u16(0), ...u16(berkas.length), ...u16(berkas.length), ...u32(ukPusat), ...u32(pos), ...u16(0)]);
  const semua = [...bagian, ...pusat, akhir], hasil = new Uint8Array(semua.reduce((s, x) => s + x.length, 0));
  let o = 0; for (const x of semua) { hasil.set(x, o); o += x.length; }
  return hasil;
}

const x = (s) => String(s ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const lari = (teks, { tebal = false, ukuran = 20, warna = null } = {}) => String(teks ?? "").split("\n").map((l, i) =>
  `<w:r><w:rPr><w:rFonts w:ascii="Inter" w:hAnsi="Inter" w:cs="Inter"/>${tebal ? "<w:b/>" : ""}${warna ? `<w:color w:val="${warna}"/>` : ""}<w:sz w:val="${ukuran}"/></w:rPr>${i ? "<w:br/>" : ""}<w:t xml:space="preserve">${x(l)}</w:t></w:r>`).join("");
const para = (teks, o = {}) => `<w:p><w:pPr><w:spacing w:before="${o.sebelum ?? 0}" w:after="${o.sesudah ?? 80}"/></w:pPr>${lari(teks, o)}</w:p>`;
const sel = (teks, lebar, o = {}) => `<w:tc><w:tcPr><w:tcW w:w="${lebar}" w:type="dxa"/>${o.isi ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.isi}"/>` : ""}</w:tcPr>${para(teks, { sesudah: 40, ukuran: 18, ...o })}</w:tc>`;

/** dokumen: { judul, subjudul?, kolom: [{judul, lebar(dxa)}], baris: [[teks...]], catatan? } -> Uint8Array .docx (lanskap A4). */
export function buatDocx({ judul, subjudul = "", kolom, baris, catatan = "" }) {
  const garis = ["top", "left", "bottom", "right", "insideH", "insideV"].map((s) => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="B8C2BE"/>`).join("");
  const tabel = `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>${garis}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr>`
    + `<w:tblGrid>${kolom.map((k) => `<w:gridCol w:w="${k.lebar}"/>`).join("")}</w:tblGrid>`
    + `<w:tr><w:trPr><w:tblHeader/></w:trPr>${kolom.map((k) => sel(k.judul, k.lebar, { tebal: true, warna: "FFFFFF", isi: "0A5C47" })).join("")}</w:tr>`
    + baris.map((b) => `<w:tr><w:trPr><w:cantSplit/></w:trPr>${b.map((t, i) => sel(t, kolom[i].lebar)).join("")}</w:tr>`).join("") + "</w:tbl>";
  const badan = para(judul, { tebal: true, ukuran: 32, sesudah: 60 }) + (subjudul ? para(subjudul, { ukuran: 20, sesudah: 200, warna: "5B6B66" }) : "") + tabel + (catatan ? para(catatan, { ukuran: 16, sebelum: 160, warna: "5B6B66" }) : "");
  const dokumen = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${badan}<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="1000" w:right="900" w:bottom="1000" w:left="900" w:header="500" w:footer="500" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  return zip([
    ["[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
    ["_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
    ["word/document.xml", dokumen],
  ]);
}
