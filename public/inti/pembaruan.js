/* Lapisan "diperbarui oleh lembaga, dikurasi METI" (organisasi, proyek) dan "diperbarui oleh METI Wilayah X, dikurasi METI" (provinsi).
   Hanya data yang sudah disetujui admin; tanggal disetujui ikut tampil. Kosong atau fitur belum aktif = tidak ada kartu. Semua nilai di-escape. */
import { t, tanggal, tanggalDariUnix } from "/i18n.js";
import { api, esc, ikon } from "/inti/umum.js";
import { exHtml } from "/inti/komponen.js";

if (!document.getElementById("ikutiCss")) document.head.insertAdjacentHTML("beforeend", '<link id="ikutiCss" rel="stylesheet" href="/inti/ikuti.css">');
const tgl = (u) => tanggal(tanggalDariUnix(u));
const aman = (u) => (/^https:\/\//i.test(u || "") ? esc(u) : "");
const butir = (judul, baris, x) => `<div class="jm-pembaruan-butir"><b>${esc(judul)}</b>${baris.filter(Boolean).map((b) => `<span>${esc(b)}</span>`).join("")}<small>${esc(t("pb.tanggal", { tgl: tgl(x.tanggal) }))}${aman(x.bukti_url) ? ` <a href="${aman(x.bukti_url)}" target="_blank" rel="noopener noreferrer">${esc(t("pb.bukti"))}</a>` : ""}</small></div>`;
const kartu = (label, isiHtml) => exHtml({ id: "pembaruan", ikon: "centang", judulHtml: esc(label), subHtml: esc(t("pb.sub")), isiHtml: `<div class="jm-pembaruan">${isiHtml}</div>`, tingkat: "h2" });
const tek = (k) => t("pj.tek." + k);

function htmlOrganisasi(d) {
  const p = d.profil, h = [];
  if (p) h.push(butir(t("pb.profil"), [p.deskripsi, p.situs, p.alamat_kantor, p.teknologi?.length ? p.teknologi.map(tek).join(", ") : ""], p));
  for (const x of d.proyek_baru || []) h.push(butir(x.nama, [tek(x.teknologi), x.kapasitas_mw ? `${x.kapasitas_mw} MW` : "", t("pb.st." + x.status), x.cod ? t("pb.cod", { n: x.cod }) : ""], x));
  for (const x of d.proyek_status || []) h.push(butir(t("pb.status_proyek", { id: x.proyek_id }), [t("pb.st." + x.status), x.cod_aktual ? t("pb.cod_aktual", { n: x.cod_aktual }) : ""], x));
  return h.join("");
}
function htmlProyek(d) { const x = d.status; return x ? butir(t("pb.status"), [t("pb.st." + x.status), x.cod_aktual ? t("pb.cod_aktual", { n: x.cod_aktual }) : ""], x) : ""; }

/** jenis: organisasi | proyek. Menambahkan kartu ke `akhir` (elemen); tanpa data = tidak melakukan apa pun. */
export async function muatPembaruan(jenis, id, akhir) {
  let d;
  try { d = await api(`/api/pembaruan/${jenis}/${encodeURIComponent(id)}`); } catch { return; }
  const h = jenis === "organisasi" ? htmlOrganisasi(d) : htmlProyek(d);
  if (h && akhir) akhir.insertAdjacentHTML("beforeend", kartu(t("pb.judul_lembaga"), h));
}

const URUT = ["sk", "sekretariat", "pengurus", "bidang", "keanggotaan", "kegiatan", "proyek_potensi"];
const lihatBerkas = (x) => (x.berkas ? `<a href="/api/wilayah/berkas/${encodeURIComponent(x.id)}" target="_blank" rel="noopener noreferrer">${esc(x.berkas.nama || t("pb.berkas"))}</a>` : "");
function butirWilayah(j, x) {
  const L = {
    sk: [x.nomor, x.perihal, x.tanggal ? tanggal(x.tanggal) : ""],
    sekretariat: [x.alamat, x.kota, x.telepon_kantor, x.surel_resmi],
    pengurus: [x.jabatan], bidang: [(x.bidang || []).join(", ")],
    keanggotaan: [x.jumlah_anggota != null ? t("pb.anggota", { n: x.jumlah_anggota }) : "", (x.organisasi_ids || []).length ? t("pb.org_anggota", { n: x.organisasi_ids.length }) : ""],
    kegiatan: [x.tanggal ? tanggal(x.tanggal) : "", x.ringkasan], proyek_potensi: [x.teknologi ? tek(x.teknologi) : "", x.kapasitas_mw ? `${x.kapasitas_mw} MW` : "", x.deskripsi],
  };
  const judul = x.nama || x.judul || x.nomor || t("pb.w." + j);
  const orgs = j === "keanggotaan" ? (x.organisasi_ids || []).map((o) => `<a href="/o/${encodeURIComponent(o)}">${esc(o)}</a>`).join(", ") : "";
  return butir(judul, [t("pb.w." + j), ...L[j]], { tanggal: x.disetujui, bukti_url: x.bukti_url }).replace("</small></div>", `</small>${orgs ? `<span>${orgs}</span>` : ""}${lihatBerkas(x) ? `<span>${lihatBerkas(x)}</span>` : ""}</div>`);
}
/** Halaman publik wilayah: kartu dari /api/wilayah/terbit/<kode>. */
export async function muatPembaruanWilayah(kode, akhir) {
  let d;
  try { d = await api(`/api/wilayah/terbit/${encodeURIComponent(kode)}`); } catch { return; }
  const h = URUT.flatMap((j) => (d[j] || []).map((x) => butirWilayah(j, x))).join("");
  if (h && akhir) akhir.insertAdjacentHTML("beforeend", kartu(t("pb.judul_wilayah", { nama: d.nama }), h));
}
