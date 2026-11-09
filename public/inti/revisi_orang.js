/* Revisi orang oleh yang bersangkutan (/api/orang/revisi) ditimpa ke baris bentuk /data/orang.json. Satu pemuat bersama untuk direktori, /o, dan sensus.
   Gagal muat = tanpa revisi (tidak melempar). Bagian yang dirahasiakan pemilik tidak dikirim server, jadi tidak menimpa apa pun. */
import { t } from "/i18n.js";

let janji = null;
const muatRevisi = () => (janji ||= fetch("/api/orang/revisi", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)).then((d) => (Array.isArray(d?.baris) ? d.baris : [])).catch(() => []));
const isi = (v) => (Array.isArray(v) ? v.length > 0 : v != null && v !== "");
const JENIS_TAUTAN = { linkedin: "linkedin", situs: "web", orcid: "orcid", scholar: "scholar", researchgate: "researchgate" };
const URL_AMAN = /^https?:\/\//i;

export const fotoRevisi = (r) => (isi(r.foto) && r.akun_id ? `/api/profil/${encodeURIComponent(r.akun_id)}/foto?v=${encodeURIComponent(r.foto)}` : "");

export function timpa(o, r) {
  const set = (k, v) => { if (isi(v)) o[k] = v; };
  set("nama", r.nama); set("gelar", r.gelar); set("jabatan_terkini", r.jabatan); set("organisasi_terkini", r.instansi); set("organisasi_id", r.organisasi_id);
  set("ringkasan", r.bio);
  if (isi(r.keahlian)) o.kepakaran = r.keahlian.map((kode) => ({ kode, utama: false, bukti: "revisi" }));
  const taut = Object.entries(r.tautan || {}).filter(([k, u]) => JENIS_TAUTAN[k] && URL_AMAN.test(u || "")).map(([k, url]) => ({ jenis: JENIS_TAUTAN[k], url }));
  if (taut.length) o.tautan = taut;
  const pd = r.riwayat?.pendidikan;
  if (isi(pd)) o.pendidikan = pd.map((x) => ({ jenjang: x.jenjang ? t("pf.jenjang." + x.jenjang) : null, bidang: x.jurusan || null, institusi: x.kampus || null, selesai: x.tahun ? String(x.tahun) : null }));
  const pg = r.riwayat?.pengalaman;
  if (isi(pg)) o.jabatan = pg.map((x) => ({ organisasi_id: "", organisasi: x.organisasi || "", jabatan: x.jabatan || "", mulai: x.mulai ? String(x.mulai) : "", selesai: x.selesai ? String(x.selesai) : "", kini: !x.selesai }));
  // Jabatan kini direvisi tanpa riwayat pengalaman: entri "kini" hasil panen diganti pernyataan pemiliknya (jabatan lain bisa ditambah lewat Pengalaman).
  else if (isi(r.jabatan) && Array.isArray(o.jabatan) && !o.jabatan.some((j) => j.kini && j.jabatan === r.jabatan)) o.jabatan = [{ organisasi_id: r.organisasi_id || "", organisasi: r.instansi || o.organisasi_terkini || "", jabatan: r.jabatan, kini: true }, ...o.jabatan.filter((j) => !j.kini)];
  const f = fotoRevisi(r); if (f) o.foto = f;
  o._revisi = { diubah: r.diubah };
}

/** barisOrang: array baris orang.json (diubah di tempat). Mengembalikan array yang sama. */
export async function terapkanRevisi(barisOrang) {
  if (!Array.isArray(barisOrang)) return barisOrang;
  const rev = await muatRevisi();
  if (!rev.length) return barisOrang;
  const per = new Map(rev.map((r) => [r.orang_id, r]));
  for (const o of barisOrang) { const r = per.get(o.id); if (r) timpa(o, r); }
  return barisOrang;
}
