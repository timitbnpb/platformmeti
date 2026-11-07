/* /portal: portal pembaruan data lembaga. Klaim organisasi (disetujui admin) lalu ajukan perubahan profil, proyek baru, atau status proyek bertautan bukti.
   Semua pengajuan masuk antrean kurasi Admin. Server menolak data pribadi (surel, telepon, NIK). Nilai di-escape. */
import { t, tanggal, tanggalDariUnix } from "/i18n.js";
import { api, esc, ikon, galatTeks, kosongHtml, pesanHtml } from "/inti/umum.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { siapHtml, matikan } from "/inti/siap.js";
import { exHtml } from "/inti/komponen.js";
import { namaProyek } from "/inti/nama_proyek.js";
import { namaProvinsi } from "/profil_tampil.js";
import { IKON_TEK } from "/inti/ikon_tek.js";

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
const medan = (id, kunci, isi, penuh = false, ik = "") => `<div class="jm-medan${penuh ? " jm-penuh" : ""}"><label for="${id}">${ik ? ikon(ik, 16) : ""}<span>${esc(t(kunci))}</span></label>${isi}</div>`;
const bungkus = (ik, isi, kelas = "") => `<div class="pt-in${kelas}">${ikon(ik, 18)}${isi}</div>`;
const isian = (id, { tipe = "text", maks = 200, wajib = false, ph = "", ik = "" } = {}) => bungkus(ik, `<input class="jm-isian" id="${id}" type="${tipe}" maxlength="${maks}" autocomplete="off"${wajib ? " required" : ""}${ph ? ` placeholder="${esc(ph)}"` : ""}>`);
const pilihan = (id, opsi, { kosong = false, ik = "topik", ph = "", mati: m = false } = {}) => `<select class="jm-pilih" id="${id}" data-ikon="${ik}"${m ? " disabled" : ""}>${ph ? `<option value="" disabled selected>${esc(ph)}</option>` : kosong ? '<option value=""></option>' : ""}${opsi.map(([v, l, i]) => `<option value="${esc(v)}"${i ? ` data-ikon="${esc(i)}"` : ""}>${esc(l)}</option>`).join("")}</select>`;
const tekOpsi = () => TEK.map((k) => [k, t("pj.tek." + k), "tek:" + k]);

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
    ${medan("kOrg", "pt.f.org", `${bungkus("gedung", `<input class="jm-isian" id="kOrg" list="dlOrg" autocomplete="off" maxlength="120" required placeholder="${esc(t("pt.org_pilih_ph"))}">`)}<datalist id="dlOrg">${[...ORG.values()].map((o) => `<option value="${esc(o.nama)}"></option>`).join("")}</datalist>`, false, "gedung")}
    ${medan("kJab", "pt.f.jabatan", isian("kJab", { maks: 120, ik: "orang" }), false, "orang")}
    ${medan("kBukti", "pt.f.bukti_klaim", isian("kBukti", { tipe: "url", maks: 600, ph: "https://", ik: "tautan" }), true, "tautan")}</div>
    <p class="pt-bantu">${ikon("info", 16)}<span>${esc(t("pt.klaim_bantu"))}</span></p><div id="pKlaim" aria-live="polite"></div>
    <div class="jm-aksi pt-aksi"><button type="submit" class="jm-tbl jm-tbl-utama">${ikon("tambah", 16)}<span>${esc(t("pt.klaim_kirim"))}</span></button></div></form>`;
  return exHtml({ id: "klaim", ikon: "direktori", topik: t("pt.top.klaim"), judulHtml: esc(t("pt.klaim")), subHtml: esc(t("pt.klaim_sub")), isiHtml: daftar + form });
}

function bidang(jenis, orgId) {
  if (jenis === "profil") return `${medan("aDes", "pt.f.deskripsi", `<div class="pt-in pt-area">${ikon("teks", 18)}<textarea class="jm-isian" id="aDes" rows="4" maxlength="600"></textarea></div><small class="pt-hitung" id="aDesN" aria-live="off">0/600</small>`, true, "teks")}${medan("aSitus", "pt.f.situs", isian("aSitus", { tipe: "url", ph: "https://", ik: "globe" }), false, "globe")}${medan("aAlamat", "pt.f.alamat", isian("aAlamat", { ik: "lokasi" }), false, "lokasi")}
    <div class="jm-medan jm-penuh" role="group" aria-labelledby="aTekJ"><span class="pt-lab" id="aTekJ">${ikon("tek-listrik", 16)}<span>${esc(t("pt.f.teknologi"))}</span><small>${esc(t("pt.f.tek_bantu"))}</small></span><div class="pt-tek">${TEK.map((k) => `<label class="pt-chip jm-tek-${k}"><input type="checkbox" name="aTek" value="${k}">${IKON_TEK[k]}<span>${esc(t("pj.tek." + k))}</span></label>`).join("")}</div></div>`;
  if (jenis === "proyek_baru") return `${medan("aNama", "pt.f.nama_proyek", isian("aNama", { maks: 120, wajib: true, ik: "proyek" }), false, "proyek")}${medan("aTek", "pt.f.teknologi1", pilihan("aTek", tekOpsi(), { ik: "tek-listrik" }), false, "tek-listrik")}${medan("aKap", "pt.f.kapasitas", isian("aKap", { tipe: "number", maks: 9, ik: "grafik" }), false, "grafik")}
    ${medan("aProv", "pt.f.provinsi", pilihan("aProv", PROV.map(([k, n]) => [k, n]), { kosong: true, ik: "lokasi" }), false, "lokasi")}${medan("aStatus", "pt.f.status", pilihan("aStatus", STATUS.map((s) => [s, t("pb.st." + s)]), { ik: "status" }), false, "status")}${medan("aCod", "pt.f.cod", isian("aCod", { tipe: "number", maks: 4, ik: "tahun" }), false, "tahun")}`;
  const ids = ORG.get(orgId)?.proyek_ids || [];
  return `${medan("aProyek", "pt.f.proyek", ids.length ? pilihan("aProyek", ids.map((i) => [i, PROYEK.has(i) ? namaProyek(PROYEK.get(i)) : i]), { ik: "proyek" }) : isian("aProyek", { maks: 60, wajib: true, ph: "pj_0001", ik: "proyek" }), false, "proyek")}${medan("aStatus", "pt.f.status", pilihan("aStatus", STATUS.map((s) => [s, t("pb.st." + s)]), { ik: "status" }), false, "status")}${medan("aCodA", "pt.f.cod_aktual", isian("aCodA", { tipe: "number", maks: 4, ik: "tahun" }), false, "tahun")}`;
}

function kartuAjuan() {
  const setuju = saya.klaim.filter((k) => k.status === "setuju");
  const orgId = document.getElementById("aOrg")?.value || setuju[0]?.organisasi_id || "", jenis = document.getElementById("aJenis")?.value || "profil";
  const catatan = setuju.length ? "" : `<div class="pt-ajak">${ikon("gedung", 28)}<div><b>${esc(t("pt.cta_t"))}</b><p>${esc(t("pt.belum_klaim"))}</p></div><a class="jm-tbl jm-tbl-utama" href="#klaim">${ikon("panah-kanan", 16)}<span>${esc(t("pt.cta_tbl"))}</span></a></div>`;
  const form = `${catatan}<form class="jm-form" id="fAjuan" novalidate><div class="jm-form-grid">
    ${medan("aOrg", "pt.f.org", pilihan("aOrg", setuju.map((k) => [k.organisasi_id, namaOrg(k.organisasi_id)]), { ik: "gedung", ph: setuju.length ? "" : t("pt.org_ph"), mati: !setuju.length }), false, "gedung")}${medan("aJenis", "pt.f.jenis", pilihan("aJenis", JENIS.map((j) => [j, t("pt.j." + j)]), { ik: "tag" }), false, "tag")}
    ${bidang(jenis, orgId)}
    ${medan("aBukti", "pt.f.bukti", isian("aBukti", { tipe: "url", maks: 600, wajib: true, ph: "https://", ik: "tautan" }), true, "tautan")}</div>
    <p class="pt-bantu">${ikon("perisai", 16)}<span>${esc(t("pt.privasi"))}</span></p><div id="pAjuan" aria-live="polite"></div>
    <div class="jm-aksi pt-aksi"><button type="reset" class="jm-tbl">${ikon("silang", 16)}<span>${esc(t("pt.batal"))}</span></button><button type="submit" class="jm-tbl jm-tbl-utama">${ikon("centang", 16)}<span>${esc(t("pt.kirim"))}</span></button></div></form>`;
  const sel = (i, v) => { const el = document.getElementById(i); if (el) el.value = v; };
  queueMicrotask(() => { sel("aOrg", orgId); sel("aJenis", jenis); });
  return exHtml({ id: "ajukan", ikon: "ubah", topik: t("pt.top.ajukan"), judulHtml: esc(t("pt.ajukan")), subHtml: esc(t("pt.ajukan_sub")), isiHtml: form });
}

function kartuRiwayat() {
  const isi = saya.ajuan.length
    ? `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>${["pt.c.org", "pt.c.jenis", "pt.c.isi", "pt.c.status", "pt.c.tanggal"].map((k) => `<th scope="col">${esc(t(k))}</th>`).join("")}</tr></thead><tbody>${saya.ajuan.map((a) => `<tr><td data-l="${esc(t("pt.c.org"))}">${esc(namaOrg(a.organisasi_id))}</td><td data-l="${esc(t("pt.c.jenis"))}">${esc(t("pt.j." + a.jenis))}</td><td data-l="${esc(t("pt.c.isi"))}"><span class="jm-ringkas-sel">${esc(ringkasIsi(a))}</span></td><td data-l="${esc(t("pt.c.status"))}">${pil(a.status)}${a.catatan_admin ? `<small>${esc(a.catatan_admin)}</small>` : ""}</td><td class="jm-nowrap" data-l="${esc(t("pt.c.tanggal"))}">${tgl(a.dibuat)}</td></tr>`).join("")}</tbody></table></div>`
    : kosongHtml("pt.ajuan_kosong");
  return exHtml({ id: "riwayat", ikon: "linimasa", topik: t("pt.top.riwayat"), judulHtml: esc(t("pt.riwayat")), isiHtml: isi });
}

const gambar = () => {
  akar.innerHTML = (mati ? siapHtml("pt.siap") : "") + kartuKlaim() + kartuAjuan() + kartuRiwayat();
  if (mati) matikan(akar); else if (!saya.klaim.some((k) => k.status === "setuju")) matikan(document.getElementById("fAjuan"));
  const alasan = mati ? t("pt.nonaktif") : t("pt.kirim_mati");
  for (const f of akar.querySelectorAll("form")) if (f.querySelector("button[type=submit]").disabled) f.querySelector("button[type=submit]").title = f.id === "fAjuan" ? alasan : t("pt.nonaktif");
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
akar.addEventListener("input", (e) => { if (e.target.id === "aDes") document.getElementById("aDesN").textContent = e.target.value.length + "/600"; });
akar.addEventListener("reset", () => queueMicrotask(() => { const n = document.getElementById("aDesN"); if (n) n.textContent = "0/600"; }));
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
