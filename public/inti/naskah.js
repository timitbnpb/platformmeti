/* naskah.js: fungsi murni forum Konsultasi (tanpa DOM, tanpa D1), dipakai klien, Worker, dan uji.
   bersihTeks   : teks bebas -> teks tanpa HTML/kontrol, panjang dipotong
   pecahNaskah  : teks naskah -> baris bab/pasal/ayat
   cariJangkar  : kutipan + offset -> rentang di teks terkini (tahan perubahan teks)
   segmen       : teks + utas -> potongan siap gambar ala track changes
   terapkanUsulan : teks + usulan diterima -> teks hasil */

const KONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f​-‏‪-‮⁦-⁩]/g;

/** Tanpa HTML: tag dibuang, sisa < dan > dibuang, kontrol dibuang, CRLF -> LF, dipotong ke `maks`. Baris baru dipertahankan bila `baris`. */
export function bersihTeks(s, maks = 4000, baris = true) {
  let x = String(s ?? "").normalize("NFC").replace(/\r\n?/g, "\n").replace(KONTROL, "");
  x = x.replace(/<[^>]*>/g, "").replace(/[<>]/g, "");
  x = baris ? x.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n") : x.replace(/\s+/g, " ");
  return x.trim().slice(0, maks);
}

/* ---------- pecah naskah ---------- */
const RE_BAB = /^BAB\s+([IVXLCDM]+|\d+)\b\.?\s*(.*)$/i;
const RE_PASAL = /^Pasal\s+(\d+[A-Z]{0,2})\s*\.?\s*(.*)$/i;
const RE_AYAT = /^\((\d{1,2}[a-z]?)\)\s+(.*)$/;
const RE_BUTIR = /^([a-z]|\d{1,2})[.)]\s+\S/;
const RE_JUDUL_BAB = /^[A-Z0-9][A-Z0-9 ,.\-/()&']{2,}$/; // judul bab ditulis huruf besar semua pada naskah resmi

/** Baris naskah: [{ tingkat: bab|pasal|ayat, nomor, judul, teks }]. Pasal beraya dipecah per ayat; pasal tanpa ayat satu baris.
 *  Teks sebelum pasal pertama (konsiderans) diabaikan: bukan bagian yang dikonsultasikan. Hasil bisa disunting admin sebelum terbit. */
export function pecahNaskah(mentah) {
  const baris = bersihTeks(mentah, 2_000_000).split("\n").map((l) => l.trim());
  const hasil = [];
  let pasal = null, ayat = null, terakhirBab = null, tungguJudulBab = false;
  const tutup = () => { ayat = null; };
  const tambahTeks = (obj, l) => { obj.teks = obj.teks ? (RE_BUTIR.test(l) || RE_AYAT.test(l) ? obj.teks + "\n" : obj.teks.endsWith("-") ? obj.teks.slice(0, -1) : obj.teks + " ") + l : l; };
  for (const l of baris) {
    if (!l) { tungguJudulBab = false; continue; }
    let m;
    if ((m = l.match(RE_BAB)) && !RE_PASAL.test(l)) {
      terakhirBab = { tingkat: "bab", nomor: m[1].toUpperCase(), judul: m[2] || "", teks: "" };
      hasil.push(terakhirBab); pasal = null; tutup(); tungguJudulBab = !m[2];
    } else if (tungguJudulBab && terakhirBab && RE_JUDUL_BAB.test(l) && !RE_PASAL.test(l)) {
      terakhirBab.judul = l; tungguJudulBab = false;
    } else if ((m = l.match(RE_PASAL))) {
      tungguJudulBab = false;
      pasal = { tingkat: "pasal", nomor: m[1], judul: "", teks: "" };
      hasil.push(pasal); tutup();
      if (m[2]) tambahTeks(pasal, m[2]);
    } else if (pasal) {
      tungguJudulBab = false;
      if ((m = l.match(RE_AYAT))) { ayat = { tingkat: "ayat", nomor: `(${m[1]})`, judul: "", teks: m[2] }; hasil.push(ayat); }
      else tambahTeks(ayat || pasal, l);
    }
  }
  return hasil.filter((b) => b.tingkat === "bab" || b.teks || b.tingkat === "pasal").map((b) => ({ ...b, teks: bersihTeks(b.teks, 20000) }));
}

/* ---------- jangkar ---------- */
/** Rentang kutipan di `teks` terkini. Pakai offset bila masih cocok; kalau teks berubah, cari kutipan; tidak ada = null (yatim). */
export function cariJangkar(teks, { kutipan, mulai, akhir }) {
  if (!kutipan) return null;
  if (Number.isInteger(mulai) && Number.isInteger(akhir) && teks.slice(mulai, akhir) === kutipan) return [mulai, akhir];
  const i = teks.indexOf(kutipan);
  return i < 0 ? null : [i, i + kutipan.length];
}

/** Potongan teks untuk digambar. Utas yang tumpang-tindih dengan yang lebih awal dilewati (tetap di panel, bukan di teks).
 *  Hasil: [{ t, kelas: "" | "sorot" | "coret" | "ganti" | "sisip", utas: id|null, baru?: teks pengganti }] */
export function segmen(teks, daftar) {
  const rentang = [];
  for (const u of daftar) {
    if (!["sorot", "komentar", "ubah", "coret", "tambah"].includes(u.jenis) || u.status === "ditolak" || u.status === "digabung" || u.status === "ditarik") continue;
    const r = cariJangkar(teks, u);
    if (r) rentang.push({ a: r[0], b: r[1], u });
  }
  rentang.sort((x, y) => x.a - y.a || x.b - y.b);
  const keluar = []; let kursor = 0;
  const dorong = (t, kelas = "", utas = null, ekstra = {}) => { if (t || ekstra.baru) keluar.push({ t, kelas, utas, ...ekstra }); };
  for (const { a, b, u } of rentang) {
    if (a < kursor) continue;
    dorong(teks.slice(kursor, a));
    const isi = teks.slice(a, b);
    if (u.jenis === "coret") dorong(isi, "coret", u.id);
    else if (u.jenis === "ubah") dorong(isi, "coret", u.id, { baru: u.teks_ganti });
    else if (u.jenis === "tambah") {
      if (u.sisip === "sebelum") { dorong("", "sisip", u.id, { baru: u.teks_ganti }); dorong(isi, "sorot", u.id); }
      else { dorong(isi, "sorot", u.id); dorong("", "sisip", u.id, { baru: u.teks_ganti }); }
    } else dorong(isi, "sorot", u.id);
    kursor = b;
  }
  dorong(teks.slice(kursor));
  return keluar;
}

/** Terapkan usulan diterima (ubah/coret/tambah) dari belakang ke depan supaya offset tetap sah. Tumpang-tindih dilewati dan dilaporkan. */
export function terapkanUsulan(teks, usulan) {
  const r = [];
  for (const u of usulan) {
    const j = cariJangkar(teks, u);
    if (j) r.push({ a: j[0], b: j[1], u });
  }
  r.sort((x, y) => y.a - x.a || y.b - x.b);
  let hasil = teks; let batas = Infinity; const dilewati = [];
  for (const { a, b, u } of r) {
    if (b > batas) { dilewati.push(u.id); continue; }
    if (u.jenis === "coret") hasil = hasil.slice(0, a) + hasil.slice(b);
    else if (u.jenis === "ubah") hasil = hasil.slice(0, a) + u.teks_ganti + hasil.slice(b);
    else if (u.jenis === "tambah") hasil = u.sisip === "sebelum" ? hasil.slice(0, a) + u.teks_ganti + " " + hasil.slice(a) : hasil.slice(0, b) + " " + u.teks_ganti + hasil.slice(b);
    else continue;
    batas = a;
  }
  const yatim = usulan.filter((u) => !r.some((x) => x.u === u)).map((u) => u.id);
  return { teks: hasil.replace(/ {2,}/g, " ").replace(/ +([,.;:])/g, "$1").trim(), dilewati: [...dilewati, ...yatim] };
}

/* ---------- rekap ---------- */
const UBAHAN = ["ubah", "coret", "tambah"];
/** Label ringkas bagian: "Pasal 5", "Pasal 5 (1)", "BAB II", "Butir 3". `pasal` = nomor pasal induk untuk ayat. */
export const labelBagian = (b, pasal = "") => (b.tingkat === "pasal" ? `Pasal ${b.nomor}` : b.tingkat === "ayat" ? `Pasal ${pasal} ${b.nomor}`.trim() : b.tingkat === "bab" ? `BAB ${b.nomor}` : b.nomor ? `Butir ${b.nomor}` : "Butir");
/** Baris Rekap posisi METI dari usulan yang DITERIMA. Dokumen butir: semua butir (yang tak berubah tetap muncul); naskah: hanya bagian yang berubah. Butir baru di akhir. */
export function susunRekap({ dokumen, bagian, diterima }) {
  const per = new Map();
  for (const u of diterima) if (u.bagian_id != null) per.set(u.bagian_id, [...(per.get(u.bagian_id) ?? []), u]);
  const penuh = dokumen.bentuk === "butir", baris = [];
  let pasal = "";
  const alasan = (us) => us.map((u) => u.isi + (u.putusan ? ` (catatan pengurus: ${u.putusan})` : "")).join("; ");
  for (const b of bagian) {
    if (b.tingkat === "pasal") pasal = b.nomor;
    if (b.tingkat === "bab") continue;
    const us = per.get(b.id) ?? [], ubahan = us.filter((u) => UBAHAN.includes(u.jenis));
    if (!penuh && !ubahan.length) continue;
    const { teks, dilewati } = terapkanUsulan(b.teks, ubahan);
    baris.push({ id: b.id, label: labelBagian(b, pasal), judul: b.judul || "", rujukan: b.rujukan || "", asli: b.teks, usulan: ubahan.length ? teks : b.teks, alasan: alasan(ubahan) || b.alasan || "", berubah: ubahan.length > 0, status_asal: b.status_asal || "", dilewati, baru: false });
  }
  for (const u of diterima.filter((x) => x.jenis === "butir_baru")) baris.push({ id: "u" + u.id, label: "Usulan baru", judul: u.kutipan || "", rujukan: "", asli: "", usulan: u.teks_ganti, alasan: alasan([u]), berubah: true, status_asal: "", dilewati: [], baru: true });
  return baris;
}

/* ---------- ekstraksi DOCX di peramban/Worker (tanpa pustaka): zip -> word/document.xml -> teks berparagraf ---------- */
export async function ekstrakDocx(buf) {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf), dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let e = b.length - 22;
  while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error("docx-bukan-zip");
  const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true);
  for (let i = 0; i < n; i++, p += 46 + dv.getUint16(p + 28, true) + dv.getUint16(p + 30, true) + dv.getUint16(p + 32, true)) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const nama = new TextDecoder().decode(b.subarray(p + 46, p + 46 + dv.getUint16(p + 28, true)));
    if (nama !== "word/document.xml") continue;
    const metode = dv.getUint16(p + 10, true), uk = dv.getUint32(p + 20, true), lok = dv.getUint32(p + 42, true);
    const mulai = lok + 30 + dv.getUint16(lok + 26, true) + dv.getUint16(lok + 28, true);
    let data = b.subarray(mulai, mulai + uk);
    if (metode === 8) data = new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer());
    else if (metode !== 0) throw new Error("docx-kompresi");
    return new TextDecoder().decode(data).replace(/<w:tab\/>/g, " ").replace(/<w:br\/>|<\/w:p>/g, "\n").replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
  }
  throw new Error("docx-tanpa-dokumen");
}
