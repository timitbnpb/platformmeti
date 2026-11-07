/* /meti-wilayah/<kode>/kelola: pengurus METI Wilayah mengunggah data provinsinya (SK PDF, sekretariat, pengurus, bidang, keanggotaan, kegiatan, proyek potensi).
   Semua masuk antrean kurasi Admin; hanya yang disetujui tampil di halaman publik wilayah. Foto wajib pernyataan persetujuan. Server menolak data pribadi. */
import { t, tanggal, tanggalDariUnix } from "/i18n.js";
import { api, esc, ikon, galatTeks, kosongHtml, pesanHtml } from "/inti/umum.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { unggahHtml } from "/inti/unggah.js";
import { siapHtml, matikan } from "/inti/siap.js";
import { exHtml } from "/inti/komponen.js";
import { namaProvinsi } from "/profil_tampil.js";

await mulaiHalaman();
const akar = document.getElementById("isi");
const kodeUrl = location.pathname.match(/^\/meti-wilayah\/(\d{2})\/kelola\/?$/)?.[1];
const JENIS = ["sk", "sekretariat", "pengurus", "bidang", "keanggotaan", "kegiatan", "proyek_potensi"];
const TEK = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "penyimpanan", "hidrogen", "nuklir"];
const FOTO = { pengurus: true, kegiatan: true };
let S = { kode: null, ajuan: [], nama: "" };

const pil = (s) => `<span class="jm-pil ${s === "setuju" ? "jm-pil-ok" : s === "tolak" ? "jm-pil-bad" : "jm-pil-warn"}">${esc(t("kor.s." + s))}</span>`;
const tgl = (u) => (u ? `<span data-urut="${u}">${esc(tanggal(tanggalDariUnix(u)))}</span>` : "-");
const medan = (id, kunci, isi, penuh = false) => `<div class="jm-medan${penuh ? " jm-penuh" : ""}"><label for="${id}">${esc(t(kunci))}</label>${isi}</div>`;
const isian = (id, { tipe = "text", maks = 200, wajib = false, ph = "" } = {}) => `<input class="jm-isian" id="${id}" type="${tipe}" maxlength="${maks}" autocomplete="off"${wajib ? " required" : ""}${ph ? ` placeholder="${esc(ph)}"` : ""}>`;
const area = (id, maks) => `<textarea class="jm-isian" id="${id}" rows="3" maxlength="${maks}"></textarea>`;
const berkas = (id, terima) => unggahHtml({ id, terima, maks: id === "wBerkas" && terima === "application/pdf" ? 5242880 : 2097152, bantu: t(terima === "application/pdf" ? "wk.f.pdf" : "wk.f.foto") });

function bidang(j) {
  if (j === "sk") return `${medan("wNomor", "wk.f.nomor", isian("wNomor", { maks: 120, wajib: true }))}${medan("wTgl", "wk.f.tanggal", isian("wTgl", { tipe: "date" }))}${medan("wPerihal", "wk.f.perihal", isian("wPerihal"), true)}${medan("wBerkas", "wk.f.pdf", berkas("wBerkas", "application/pdf"), true)}`;
  if (j === "sekretariat") return `${medan("wAlamat", "wk.f.alamat", isian("wAlamat"), true)}${medan("wKota", "wk.f.kota", isian("wKota", { maks: 80 }))}${medan("wTelp", "wk.f.telepon_kantor", isian("wTelp", { tipe: "tel", maks: 20 }))}${medan("wSurel", "wk.f.surel_resmi", isian("wSurel", { tipe: "email", maks: 120 }))}<small class="jm-bantu jm-penuh">${esc(t("wk.kontak_resmi"))}</small>`;
  if (j === "pengurus") return `${medan("wNama", "wk.f.nama", isian("wNama", { maks: 120, wajib: true }))}${medan("wJabatan", "wk.f.jabatan", isian("wJabatan", { maks: 120, wajib: true }))}${foto()}`;
  if (j === "bidang") return medan("wBidang", "wk.f.bidang", isian("wBidang", { maks: 800 }), true) + `<small class="jm-bantu jm-penuh">${esc(t("wk.bidang_bantu"))}</small>`;
  if (j === "keanggotaan") return `${medan("wJumlah", "wk.f.jumlah", isian("wJumlah", { tipe: "number", maks: 6 }))}${medan("wOrgs", "wk.f.org_ids", isian("wOrgs", { maks: 900, ph: "ix_arko, l_43f00f6a72" }), true)}`;
  if (j === "kegiatan") return `${medan("wJudul", "wk.f.judul", isian("wJudul", { maks: 200, wajib: true }), true)}${medan("wTgl", "wk.f.tanggal", isian("wTgl", { tipe: "date" }))}${medan("wRingkas", "wk.f.ringkasan", area("wRingkas", 600), true)}${foto()}`;
  return `${medan("wNama", "wk.f.nama_proyek", isian("wNama", { maks: 120, wajib: true }))}${medan("wTek", "wk.f.teknologi", `<select class="jm-pilih" id="wTek" data-ikon="topik">${TEK.map((k) => `<option value="${k}">${esc(t("pj.tek." + k))}</option>`).join("")}</select>`)}${medan("wKap", "wk.f.kapasitas", isian("wKap", { tipe: "number", maks: 9 }))}${medan("wDes", "wk.f.deskripsi", area("wDes", 300), true)}`;
}
const foto = () => `${medan("wBerkas", "wk.f.foto", berkas("wBerkas", "image/png,image/jpeg,image/webp"), true)}<label class="jm-cek jm-penuh"><input type="checkbox" id="wSetuju"><span>${esc(t("wk.f.persetujuan"))}</span></label>`;

function kartuForm() {
  const j = document.getElementById("wJenis")?.value || "sk";
  const form = `<form class="jm-form" id="fWilayah" novalidate><div class="jm-form-grid">
    ${medan("wJenis", "wk.f.jenis", `<select class="jm-pilih" id="wJenis" data-ikon="topik">${JENIS.map((x) => `<option value="${x}">${esc(t("pb.w." + x))}</option>`).join("")}</select>`)}
    ${bidang(j)}
    ${medan("wBukti", "wk.f.bukti", isian("wBukti", { tipe: "url", maks: 600, ph: "https://" }), true)}</div>
    <small class="jm-bantu">${esc(t("wk.privasi"))}</small><div id="pWilayah" aria-live="polite"></div>
    <div class="jm-aksi"><button type="submit" class="jm-tbl jm-tbl-utama">${ikon("centang", 16)}<span>${esc(t("pt.kirim"))}</span></button></div></form>`;
  queueMicrotask(() => { const s = document.getElementById("wJenis"); if (s) s.value = j; });
  return exHtml({ id: "unggah", ikon: "ubah", judulHtml: esc(t("wk.unggah", { nama: S.nama })), subHtml: esc(t("wk.unggah_sub")), isiHtml: form });
}
function ringkas(a) {
  const i = a.isi || {};
  return [i.nomor, i.nama, i.judul, i.alamat, (i.bidang || []).join(", "), i.jumlah_anggota != null ? t("pb.anggota", { n: i.jumlah_anggota }) : ""].filter(Boolean).join(" / ");
}
function kartuRiwayat() {
  const isi = S.ajuan.length
    ? `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>${["pt.c.jenis", "pt.c.isi", "pt.c.status", "pt.c.tanggal"].map((k) => `<th scope="col">${esc(t(k))}</th>`).join("")}</tr></thead><tbody>${S.ajuan.map((a) => `<tr><td data-l="${esc(t("pt.c.jenis"))}">${esc(t("pb.w." + a.jenis))}</td><td data-l="${esc(t("pt.c.isi"))}"><span class="jm-ringkas-sel">${esc(ringkas(a))}${a.berkas ? `<small><a href="/api/wilayah/berkas/${encodeURIComponent(a.id)}" target="_blank" rel="noopener noreferrer">${esc(a.berkas.nama)}</a></small>` : ""}</span></td><td data-l="${esc(t("pt.c.status"))}">${pil(a.status)}${a.catatan_admin ? `<small>${esc(a.catatan_admin)}</small>` : ""}</td><td class="jm-nowrap" data-l="${esc(t("pt.c.tanggal"))}">${tgl(a.dibuat)}</td></tr>`).join("")}</tbody></table></div>`
    : kosongHtml("pt.ajuan_kosong");
  return exHtml({ id: "riwayat", ikon: "linimasa", judulHtml: esc(t("pt.riwayat")), isiHtml: isi });
}
const gambar = () => { akar.innerHTML = kartuForm() + kartuRiwayat(); };
const v = (id) => (document.getElementById(id)?.value ?? "").trim();
const daftar = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
const angka = (s) => (s === "" ? null : Number(s));

function isiDari(j) {
  if (j === "sk") return { nomor: v("wNomor"), tanggal: v("wTgl"), perihal: v("wPerihal") };
  if (j === "sekretariat") return { alamat: v("wAlamat"), kota: v("wKota"), telepon_kantor: v("wTelp"), surel_resmi: v("wSurel") };
  if (j === "pengurus") return { nama: v("wNama"), jabatan: v("wJabatan") };
  if (j === "bidang") return { bidang: daftar(v("wBidang")) };
  if (j === "keanggotaan") return { jumlah_anggota: angka(v("wJumlah")), organisasi_ids: daftar(v("wOrgs")) };
  if (j === "kegiatan") return { judul: v("wJudul"), tanggal: v("wTgl"), ringkasan: v("wRingkas") };
  return { nama: v("wNama"), teknologi: v("wTek"), kapasitas_mw: angka(v("wKap")), deskripsi: v("wDes") };
}

akar.addEventListener("change", (e) => { if (e.target.id === "wJenis") document.getElementById("unggah").outerHTML = kartuForm(); });
akar.addEventListener("submit", async (e) => {
  e.preventDefault();
  const tbl = e.target.querySelector("button[type=submit]"), tulis = (j, k) => { document.getElementById("pWilayah").innerHTML = pesanHtml(j, k); };
  const j = v("wJenis"), f = new FormData(), file = document.getElementById("wBerkas")?.files?.[0];
  if (FOTO[j] && file && !document.getElementById("wSetuju").checked) { tulis("galat", t("wk.persetujuan_wajib")); return; }
  f.set("data", JSON.stringify({ jenis: j, isi: isiDari(j), bukti_url: v("wBukti") }));
  if (file) f.set("berkas", file);
  if (document.getElementById("wSetuju")?.checked) f.set("setuju_foto", "1");
  tbl.disabled = true;
  try {
    const r = await fetch("/api/wilayah/kelola", { method: "POST", credentials: "same-origin", headers: { "x-pb": "1" }, body: f });
    if (!r.ok) { const d = await r.json().catch(() => ({})); throw Object.assign(new Error(d.kode), { kode: d.kode, status: r.status }); }
    S = { ...S, ...(await api("/api/wilayah/kelola")) };
    gambar();
    document.getElementById("pWilayah").innerHTML = pesanHtml("ok", t("pt.terkirim"));
  } catch (err) {
    tulis("galat", err.status === 403 ? t("wk.bukan_pengurus") : err.status === 413 ? t("wk.terlalu_besar") : err.status === 415 ? t("wk.jenis_berkas") : err.status === 422 ? t("pt.ditolak_isian") : galatTeks(err.kode || "umum"));
  } finally { tbl.disabled = false; }
});

try {
  const d = await api("/api/wilayah/kelola");
  if (!d.kode || (kodeUrl && d.kode !== kodeUrl)) akar.innerHTML = kosongHtml("wk.bukan_pengurus");
  else {
    S = { ...d, nama: (await namaProvinsi()).find(([k]) => k === d.kode)?.[1] || d.kode };
    gambar();
  }
} catch (e) {
  if (e.kode === "fitur_belum_aktif") {
    S = { kode: kodeUrl, ajuan: [], nama: (await namaProvinsi().catch(() => [])).find(([k]) => k === kodeUrl)?.[1] || kodeUrl || "" };
    gambar();
    akar.insertAdjacentHTML("afterbegin", siapHtml("wk.siap"));
    matikan(akar);
  } else akar.innerHTML = pesanHtml("galat", galatTeks(e.kode || "umum"));
}
