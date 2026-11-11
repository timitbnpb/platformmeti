// md.mjs: format berkas hukum/<jenis>/<tahun>/<id>.md (DT §regulasi R.2/R.3). Murni, tanpa I/O.
export const KUNCI = ["id", "id_lama", "regulasi_id", "jenis", "nomor", "tahun", "judul", "tgl_tetap", "tgl_undang",
  "status", "status_per", "mulai", "mulai_perkiraan", "selesai", "mencabut", "mengubah", "mengganti", "mengingat", "merujuk",
  "dicabut_oleh", "diubah_oleh", "topik", "sumber", "ekstraksi", "resmi", "lisensi", "md_sha256"];
const TGL = /^\d{4}-\d{2}-\d{2}$/;
const TGL_KUNCI = new Set(["tgl_tetap", "tgl_undang", "status_per", "mulai", "selesai"]);

export function tulisFrontmatter(f) {
  const baris = KUNCI.map((k) => {
    const v = f[k] === undefined ? null : f[k];
    if (TGL_KUNCI.has(k) && typeof v === "string") return `${k}: ${v}`;
    return `${k}: ${JSON.stringify(v)}`;   // JSON = YAML aliran yang sah
  });
  return `---\n${baris.join("\n")}\n---\n`;
}

// Balikan: { fm, badan }. Galat bila bentuk rusak.
export function bacaBerkas(s) {
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(s);
  if (!m) throw new Error("tanpa frontmatter");
  const fm = {};
  for (const b of m[1].split("\n")) {
    const mm = /^([a-z0-9_]+): (.*)$/.exec(b);
    if (!mm) throw new Error("baris frontmatter rusak: " + b.slice(0, 40));
    fm[mm[1]] = TGL.test(mm[2]) ? mm[2] : JSON.parse(mm[2]);
  }
  return { fm, badan: m[2] };
}

// Hanya data pribadi sungguhan: surel webmail pribadi, ponsel, NIK. Surel/telepon kantor instansi,
// NIP pejabat, angka tabel, dan nomor peraturan adalah isi naskah dan dibiarkan.
const RX_PRIBADI = [
  /[\w.+-]+@(?:gmail|yahoo|ymail|hotmail|outlook)\.[\w.]+/i,                   // surel webmail
  /(?<![\d.])(?:\+62|62|0)[\s.-]?8\d{2}[\s.-]?\d{3,4}[\s.-]?\d{2,5}(?!\d)/, // ponsel ID
  /(?<![\w#])\d{16}(?![\w#])/,                                                // NIK 16 digit berdiri sendiri
];
export function adaDataPribadi(s) { return RX_PRIBADI.some((r) => r.test(s)); }
export function tutupPribadi(s) { return RX_PRIBADI.reduce((t, r) => t.replace(new RegExp(r.source, "g"), "[dihapus]"), s); }

// Segmen { jenis, label, bab, teks } terurut -> badan Markdown.
export function badanDariSegmen(segs) {
  const out = [];
  let babKini = null;
  let pasalKini = null;
  const esc = (t) => t.split("\n").map((l) => (/^\s{0,3}#/.test(l) ? "\\" + l : l)).join("\n");
  for (const s of segs) {
    const t = esc(tutupPribadi(s.teks));
    if (s.jenis === "judul") { out.push(`# ${t.replace(/\n+/g, " ")}`); continue; }
    if (s.jenis === "pasal") {
      if (s.bab && s.bab !== babKini) { out.push(`## ${s.bab.replace(/\n+/g, " ")}`); babKini = s.bab; }
      const m = /^(.*?) \(lanjutan (\d+)\)$/.exec(s.label);
      if (m && m[1] === pasalKini) { out.push(`<!-- bagian ${Number(m[2]) + 1} -->\n${t}`); continue; }
      pasalKini = s.label;
      out.push(`### ${s.label}\n\n${t}`);
      continue;
    }
    const kepala = { menimbang: "Menimbang", mengingat: "Mengingat", menetapkan: "Memutuskan" }[s.jenis];
    if (kepala) { out.push(`## ${kepala}\n\n${t}`); continue; }
    if (s.jenis === "penjelasan" || s.jenis === "lampiran") out.push(`## ${s.label}\n\n${t}`);
    else out.push(`## ${s.label}\n\n${t}`);   // lain (Penutup dst.)
  }
  return out.join("\n\n") + "\n";
}
