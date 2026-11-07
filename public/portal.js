/* /portal: portal pembaruan data lembaga. Klaim organisasi (disetujui admin) lalu ajukan perubahan profil, proyek baru, atau status proyek bertautan bukti.
   Semua pengajuan masuk antrean kurasi Admin. Server menolak data pribadi (surel, telepon, NIK). Nilai di-escape. */
import { t, tanggal, tanggalDariUnix } from "/i18n.js";
import { api, esc, ikon, galatTeks, kosongHtml, pesanHtml } from "/inti/umum.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { siapHtml, matikan } from "/inti/siap.js";
import { exHtml } from "/inti/komponen.js";
import { namaProyek } from "/inti/nama_proyek.js";
import { namaProvinsi } from "/profil_tampil.js";

await mulaiHalaman();
const akar = document.getElementById("isi");
const TEK = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "penyimpanan", "hidrogen", "nuklir"];
const STATUS = ["rencana", "konstruksi", "beroperasi"];
const JENIS = ["profil", "proyek_baru", "proyek_status"];
let ORG = new Map(), PROYEK = new Map(), PROV = [], saya = { klaim: [], ajuan: [] }, mati = false;

const muatData = (n) => fetch(`/data/${n}.json`).then((r) => r.json()).then((d) => new Map(d.baris.map((x) => [x.id, x]))).catch(() => new Map());
const namaOrg = (id) => ORG.get(id)?.nama || id;
const pil = (s) => `<span class="jm-pil ${s === "setuju" ? "jm-pil-ok" : s === "tolak" ? "jm-pil-bad" : "jm-pil-warn"}">${esc(t("kor.s." + s))}</span>`;
const tgl = (u) => (u ? `<span data-urut="${u}">${esc(tanggal(tanggalDariUnix(u)))}</span>` : "-");
const medan = (id, kunci, isi, penuh = false) => `<div class="jm-medan${penuh ? " jm-penuh" : ""}"><label for="${id}">${esc(t(kunci))}</label>${isi}</div>`;
const isian = (id, { tipe = "text", maks = 200, wajib = false, ph = "" } = {}) => `<input class="jm-isian" id="${id}" type="${tipe}" maxlength="${maks}" autocomplete="off"${wajib ? " required" : ""}${ph ? ` placeholder="${esc(ph)}"` : ""}>`;
const pilihan = (id, opsi, kosong = false) => `<select class="jm-pilih" id="${id}" data-ikon="topik">${kosong ? '<option value=""></option>' : ""}${opsi.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join("")}</select>`;
const tekOpsi = () => TEK.map((k) => [k, t("pj.tek." + k)]);

function ringkasIsi(a) {
  const i = a.isi || {};
  if (a.jenis === "profil") return [i.deskripsi, i.situs, i.alamat_kantor].filter(Boolean).join(" / ");
  if (a.jenis === "proyek_baru") return [i.nama, i.kapasitas_mw ? i.kapasitas_mw + " MW" : "", t("pb.st." + i.status)].filter(Boolean).join(", ");
  return [a.proyek_id, t("pb.st." + i.status)].join(": ");
}

function kartuKlaim() {
  const daftar = saya.klaim.length
    ? `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>${["pt.c.org", "pt.c.jabatan", "pt.c.status", "pt.c.tanggal"].map((k) => `<th scope="col">${esc(t(k))}</th>`).join("")}</tr></thead><tbody>${saya.klaim.map((k) => `<tr><td data-l="${esc(t("pt.c.org"))}"><a href="/o/${encodeURIComponent(k.organisasi_id)}">${esc(namaOrg(k.organisasi_id))}</a></td><td data-l="${esc(t("pt.c.jabatan"))}">${esc(k.jabatan || "-")}</td><td data-l="${esc(t("pt.c.status"))}">${pil(k.status)}${k.catatan_admin ? `<small>${esc(k.catatan_admin)}</small>` : ""}</td><td class="jm-nowrap" data-l="${esc(t("pt.c.tanggal"))}">${tgl(k.dibuat)}</td></tr>`).join("")}</tbody></table></div>`
    : kosongHtml("pt.klaim_kosong");
  const form = `<form class="jm-form" id="fKlaim" novalidate><div class="jm-form-grid">
    ${medan("kOrg", "pt.f.org", `<div class="pt-cari">${ikon("cari", 18)}<input class="jm-isian" id="kOrg" list="dlOrg" autocomplete="off" maxlength="120" required placeholder="${esc(t("pt.org_pilih_ph"))}"></div><datalist id="dlOrg">${[...ORG.values()].map((o) => `<option value="${esc(o.nama)}"></option>`).join("")}</datalist>`, true)}
    ${medan("kJab", "pt.f.jabatan", isian("kJab", { maks: 120 }))}
    ${medan("kBukti", "pt.f.bukti_klaim", isian("kBukti", { tipe: "url", maks: 600, ph: "https://" }), true)}</div>
    <small class="jm-bantu">${esc(t("pt.klaim_bantu"))}</small><div id="pKlaim" aria-live="polite"></div>
    <div class="jm-aksi"><button type="submit" class="jm-tbl jm-tbl-utama">${ikon("tambah", 16)}<span>${esc(t("pt.klaim_kirim"))}</span></button></div></form>`;
  return exHtml({ id: "klaim", ikon: "direktori", judulHtml: esc(t("pt.klaim")), subHtml: esc(t("pt.klaim_sub")), isiHtml: daftar + form });
}

function bidang(jenis, orgId) {
  if (jenis === "profil") return `${medan("aDes", "pt.f.deskripsi", `<textarea class="jm-isian" id="aDes" rows="3" maxlength="600"></textarea>`, true)}${medan("aSitus", "pt.f.situs", isian("aSitus", { tipe: "url", ph: "https://" }))}${medan("aAlamat", "pt.f.alamat", isian("aAlamat"))}
    <fieldset class="jm-medan jm-penuh"><legend>${esc(t("pt.f.teknologi"))}</legend>${TEK.map((k) => `<label class="jm-cek"><input type="checkbox" name="aTek" value="${k}"><span>${esc(t("pj.tek." + k))}</span></label>`).join("")}</fieldset>`;
  if (jenis === "proyek_baru") return `${medan("aNama", "pt.f.nama_proyek", isian("aNama", { maks: 120, wajib: true }))}${medan("aTek", "pt.f.teknologi1", pilihan("aTek", tekOpsi()))}${medan("aKap", "pt.f.kapasitas", isian("aKap", { tipe: "number", maks: 9 }))}
    ${medan("aProv", "pt.f.provinsi", pilihan("aProv", PROV.map(([k, n]) => [k, n]), true))}${medan("aStatus", "pt.f.status", pilihan("aStatus", STATUS.map((s) => [s, t("pb.st." + s)])))}${medan("aCod", "pt.f.cod", isian("aCod", { tipe: "number", maks: 4 }))}`;
  const ids = ORG.get(orgId)?.proyek_ids || [];
  return `${medan("aProyek", "pt.f.proyek", ids.length ? pilihan("aProyek", ids.map((i) => [i, PROYEK.has(i) ? namaProyek(PROYEK.get(i)) : i])) : isian("aProyek", { maks: 60, wajib: true, ph: "pj_0001" }))}${medan("aStatus", "pt.f.status", pilihan("aStatus", STATUS.map((s) => [s, t("pb.st." + s)])))}${medan("aCodA", "pt.f.cod_aktual", isian("aCodA", { tipe: "number", maks: 4 }))}`;
}

function kartuAjuan() {
  const setuju = saya.klaim.filter((k) => k.status === "setuju");
  const orgId = document.getElementById("aOrg")?.value || setuju[0]?.organisasi_id || "", jenis = document.getElementById("aJenis")?.value || "profil";
  const catatan = setuju.length ? "" : `<p class="pt-catatan">${ikon("info", 16)}<span>${esc(t("pt.belum_klaim"))}</span></p>`;
  const form = `${catatan}<form class="jm-form" id="fAjuan" novalidate><div class="jm-form-grid">
    ${medan("aOrg", "pt.f.org", pilihan("aOrg", setuju.map((k) => [k.organisasi_id, namaOrg(k.organisasi_id)])))}${medan("aJenis", "pt.f.jenis", pilihan("aJenis", JENIS.map((j) => [j, t("pt.j." + j)])))}
    ${bidang(jenis, orgId)}
    ${medan("aBukti", "pt.f.bukti", isian("aBukti", { tipe: "url", maks: 600, wajib: true, ph: "https://" }), true)}</div>
    <small class="jm-bantu">${esc(t("pt.privasi"))}</small><div id="pAjuan" aria-live="polite"></div>
    <div class="jm-aksi"><button type="submit" class="jm-tbl jm-tbl-utama">${ikon("centang", 16)}<span>${esc(t("pt.kirim"))}</span></button></div></form>`;
  const sel = (i, v) => { const el = document.getElementById(i); if (el) el.value = v; };
  queueMicrotask(() => { sel("aOrg", orgId); sel("aJenis", jenis); });
  return exHtml({ id: "ajukan", ikon: "ubah", judulHtml: esc(t("pt.ajukan")), subHtml: esc(t("pt.ajukan_sub")), isiHtml: form });
}

function kartuRiwayat() {
  const isi = saya.ajuan.length
    ? `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>${["pt.c.org", "pt.c.jenis", "pt.c.isi", "pt.c.status", "pt.c.tanggal"].map((k) => `<th scope="col">${esc(t(k))}</th>`).join("")}</tr></thead><tbody>${saya.ajuan.map((a) => `<tr><td data-l="${esc(t("pt.c.org"))}">${esc(namaOrg(a.organisasi_id))}</td><td data-l="${esc(t("pt.c.jenis"))}">${esc(t("pt.j." + a.jenis))}</td><td data-l="${esc(t("pt.c.isi"))}"><span class="jm-ringkas-sel">${esc(ringkasIsi(a))}</span></td><td data-l="${esc(t("pt.c.status"))}">${pil(a.status)}${a.catatan_admin ? `<small>${esc(a.catatan_admin)}</small>` : ""}</td><td class="jm-nowrap" data-l="${esc(t("pt.c.tanggal"))}">${tgl(a.dibuat)}</td></tr>`).join("")}</tbody></table></div>`
    : kosongHtml("pt.ajuan_kosong");
  return exHtml({ id: "riwayat", ikon: "linimasa", judulHtml: esc(t("pt.riwayat")), isiHtml: isi });
}

const gambar = () => {
  akar.innerHTML = (mati ? siapHtml("pt.siap") : "") + kartuKlaim() + kartuAjuan() + kartuRiwayat();
  if (mati) matikan(akar); else if (!saya.klaim.some((k) => k.status === "setuju")) matikan(document.getElementById("fAjuan"));
};
const v = (id) => (document.getElementById(id)?.value ?? "").trim();
const angkaAtauNull = (s) => (s === "" ? null : Number(s));

function badanAjuan() {
  const jenis = v("aJenis"), b = { organisasi_id: v("aOrg"), jenis, bukti_url: v("aBukti") };
  if (jenis === "profil") {
    const tek = [...document.querySelectorAll('input[name="aTek"]:checked')].map((x) => x.value);
    b.isi = { deskripsi: v("aDes"), situs: v("aSitus"), alamat_kantor: v("aAlamat"), ...(tek.length ? { teknologi: tek } : {}) };
  } else if (jenis === "proyek_baru") b.isi = { nama: v("aNama"), teknologi: v("aTek"), kapasitas_mw: angkaAtauNull(v("aKap")), kode_prov: v("aProv"), status: v("aStatus"), cod: angkaAtauNull(v("aCod")) };
  else { b.proyek_id = v("aProyek"); b.isi = { status: v("aStatus"), cod_aktual: angkaAtauNull(v("aCodA")) }; }
  return b;
}

akar.addEventListener("change", (e) => {
  if (e.target.id === "aOrg" || e.target.id === "aJenis") { const k = document.getElementById("ajukan"); k.outerHTML = kartuAjuan(); }
});
akar.addEventListener("submit", async (e) => {
  e.preventDefault();
  const tbl = e.target.querySelector("button[type=submit]"), pesan = e.target.id === "fKlaim" ? "pKlaim" : "pAjuan";
  const tulis = (j, k) => { document.getElementById(pesan).innerHTML = pesanHtml(j, k); };
  tbl.disabled = true;
  try {
    if (e.target.id === "fKlaim") {
      const o = [...ORG.values()].find((x) => x.nama.toLowerCase() === v("kOrg").toLowerCase());
      if (!o) { tulis("galat", t("pt.org_tak_dikenal")); return; }
      await api("/api/portal/klaim", { metode: "POST", badan: { organisasi_id: o.id, jabatan: v("kJab"), bukti_url: v("kBukti") } });
    } else await api("/api/portal/ajuan", { metode: "POST", badan: badanAjuan() });
    saya = await api("/api/portal/saya");
    gambar();
    document.getElementById(pesan).innerHTML = pesanHtml("ok", t(e.target.id === "fKlaim" ? "pt.klaim_terkirim" : "pt.terkirim"));
  } catch (err) {
    tulis("galat", err.status === 409 ? t("pt.klaim_ada") : err.status === 403 ? t("pt.belum_terhubung_p") : err.kode === "fitur_belum_aktif" ? t("adm.belum_aktif") : err.status === 422 ? t("pt.ditolak_isian") : galatTeks(err.kode || "umum"));
  } finally { tbl.disabled = false; }
});

try {
  try { saya = await api("/api/portal/saya"); } catch (e) { if (e.kode !== "fitur_belum_aktif") throw e; mati = true; }
  [ORG, PROYEK, PROV] = await Promise.all([muatData("organisasi"), muatData("proyek"), namaProvinsi()]);
  gambar();
} catch (e) {
  akar.innerHTML = pesanHtml("galat", galatTeks(e.kode || "umum"));
}
