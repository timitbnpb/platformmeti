/* Profil METI Wilayah /meti-wilayah/<kode BPS>: kepala berlambang, SK, sekretariat dan kontak resmi, susunan pengurus (kartu foto), bidang kerja,
   anggota (agregat), kegiatan dan berita, proyek dan potensi, kit pelantikan, serta formulir pembentukan untuk akun masuk.
   Respons publik tidak memuat kontak pribadi: hanya nama, jabatan resmi, dan kontak kantor. */
import { khUbin } from "/inti/kh.js";
import { geoProvinsi, jalurPerProvinsi } from "/inti/peta_indonesia.js";
import { t, angka } from "/i18n.js";
import { api, esc, ikon, nanti, galatTeks, pesanHtml, hantuHtml, GalatApi } from "/inti/umum.js";
import { exHtml } from "/inti/komponen.js";
import { lambang, pilStatus, namaWilayah, tgl } from "/meti-wilayah.js";

const TAHAP = ["diajukan", "ditinjau", "sk_terbit", "pelantikan", "berdiri"];
const BIDANG_STD = ["kebijakan", "organisasi", "riset-sdm", "industri-pembiayaan", "energi-daerah", "kepemudaan"];
const HARI = [45, 35, 30, 21, 14, 7, 0];
const slug = (n) => String(n).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const inisial = (n) => String(n).split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
const labelBidang = (b) => (BIDANG_STD.includes(b) ? t("mw.bidang." + b) : b);
const MAKS_BERKAS = 5 * 1024 * 1024, EKS = /\.(pdf|docx|jpe?g|png)$/i;
const seksi = (o) => exHtml({ tingkat: "h2", ...o });
const dl = (baris) => `<dl class="mw-dl">${baris.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
const kos = (kunci) => `<span class="mw-kos">${esc(t(kunci))}</span>`;
const tambahHari = (iso, n) => { const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/* ---------- bagian ---------- */
function kepalaHtml(b, w, anggota) {
  const ub = [
    { ikon: "orang", nilai: anggota.individu == null ? "<10" : angka(anggota.individu), label: t("mw.u.individu") },
    { ikon: "direktori", nilai: angka(anggota.organisasi), label: t("mw.u.organisasi") },
    { ikon: "daftar", nilai: angka((w?.bidang || []).length || BIDANG_STD.length), label: t("mw.u.bidang") },
  ];
  return { html: `<nav class="mw-remah" aria-label="${esc(t("mw.remah"))}"><a href="/meti-wilayah">${ikon("panah-kiri", 16)}<span>${esc(t("mw.judul"))}</span></a></nav>
    <section class="jm-kh" aria-labelledby="judul-p"><div class="jm-kh-teks mw-kh-isi">${lambang(b.kode, 96)}<div>
      <p class="jm-kh-ey">${ikon("wilayah", 16)}<span>${esc(t("mw.eyebrow"))}</span></p>
      <h1 id="judul-p">${esc(namaWilayah(b.nama))}</h1>
      <p class="jm-kh-lead">${pilStatus(b.status)} ${esc(t("mw." + (b.status === "belum" ? "lead_belum" : "lead_ada"), { prov: b.nama }))}</p></div></div>
      <div class="jm-kh-ubin" id="ubin-p"></div></section>`, ub };
}

function skHtml(b) {
  const sk = b.status === "berdiri" && !b.sk_nomor ? `<span class="mw-kos">${esc(t("mw.sk_draf"))}</span>` : b.sk_nomor ? esc(b.sk_nomor) : kos("mw.belum_ada");
  const isi = dl([
    [t("mw.status"), pilStatus(b.status)],
    [t("mw.status_per"), b.sumber ? esc(t("mw.sumber", { tanggal: b.status_per ? tgl(b.status_per) : "-", sumber: b.sumber })) : kos("mw.belum_ada")],
    [t("mw.sk_nomor"), sk],
    [t("mw.sk_tanggal"), b.sk_tanggal ? esc(tgl(b.sk_tanggal)) : kos("mw.belum_ada")],
    [t("mw.masa_bakti"), b.masa_bakti ? esc(b.masa_bakti) : kos("mw.belum_ada")],
    [t("mw.tgl_pelantikan"), b.tgl_pelantikan ? esc(tgl(b.tgl_pelantikan)) : kos("mw.belum_ada")],
  ]);
  return seksi({ id: "sk", ikon: "regulasi", topik: t("mw.ey.sk"), judulHtml: esc(t("mw.sk")), isiHtml: isi });
}

function sekretariatHtml(b) {
  const kontak = dl([
    [t("mw.alamat"), b.sekretariat ? esc(b.sekretariat) : kos("mw.belum_ada")],
    [t("mw.surel"), b.kontak_surel ? `<a href="mailto:${esc(b.kontak_surel)}">${esc(b.kontak_surel)}</a>` : kos("mw.belum_ada")],
    [t("mw.telp"), b.kontak_telp ? `<a href="tel:${esc(b.kontak_telp.replace(/[^\d+]/g, ""))}">${esc(b.kontak_telp)}</a>` : kos("mw.belum_ada")],
  ]);
  return seksi({ id: "sekretariat", ikon: "peta", topik: t("mw.ey.sekretariat"), judulHtml: esc(t("mw.sekretariat")),
    isiHtml: `<div class="mw-sat"><div>${kontak}<p class="jm-bantu">${esc(t("mw.kontak_resmi"))}</p></div><div class="mw-mini" id="mini" role="img" aria-label="${esc(t("mw.peta_mini", { prov: b.nama }))}"></div></div>` });
}

const slotOrang = (nama, jabatan) => `<li class="mw-sl${nama ? "" : " mw-sl-kosong"}"><span class="mw-av"${nama ? ` data-foto="${esc(slug(nama))}"` : ""}>${nama ? `<span class="mw-fk-ini" aria-hidden="true">${esc(inisial(nama))}</span>` : ikon("orang", 24)}</span><span class="mw-sl-t"><b>${esc(nama || t("mw.lowong"))}</b><small>${esc(jabatan)}</small></span></li>`;

function pengurusHtml(b, saya) {
  const kosong = !b.ketua && !b.sekretaris && !b.bendahara;
  const kelola = Array.isArray(saya?.peran) ? saya.peran.includes("pengurus_wilayah") : ["pengurus_wilayah", "admin", "super"].includes(saya?.peran);
  const isi = kosong
    ? `<div class="mw-kosong-st">${ikon("orang", 28)}<p>${esc(t("mw.pengurus_kosong"))}</p>${kelola ? `<a class="jm-tbl jm-tbl-utama" href="/meti-wilayah/${esc(b.kode)}/kelola">${ikon("ubah", 16)}${esc(t("mw.kelola"))}</a>` : ""}</div>`
    : `<ul class="mw-slot">${slotOrang(b.ketua, t("mw.ketua"))}${slotOrang(b.sekretaris, t("mw.sekretaris"))}${slotOrang(b.bendahara, t("mw.bendahara"))}</ul>`;
  return seksi({ id: "pengurus", ikon: "orang", topik: t("mw.ey.pengurus"), judulHtml: esc(t("mw.pengurus")), isiHtml: isi, kakiHtml: `<p class="jm-bantu">${esc(t("mw.pengurus_bantu"))}</p>` });
}

function bidangHtml(b) {
  const sendiri = b.bidang?.length > 0, daftar = sendiri ? b.bidang : BIDANG_STD;
  return seksi({ id: "bidang", ikon: "daftar", topik: t("mw.ey.bidang"), judulHtml: esc(t(sendiri ? "mw.bidang_j" : "mw.bidang_usulan_j")),
    isiHtml: `<ol class="mw-bidang">${daftar.map((x) => `<li><span class="mw-no" aria-hidden="true"></span><span>${esc(labelBidang(x))}</span></li>`).join("")}</ol>`,
    kakiHtml: `<p class="jm-bantu">${esc(t(sendiri ? "mw.bidang_bantu" : "mw.bidang_usulan_bantu"))}</p>` });
}

function anggotaHtml(a, kode, saya) {
  const staf = ["pengurus", "kurator", "admin", "super"].includes(saya.peran);
  const isi = `<div class="mw-angka"><p><b>${esc(a.individu == null ? t("mw.kurang10") : angka(a.individu))}</b><span>${esc(t("mw.u.individu"))}</span></p><p><b>${esc(angka(a.organisasi))}</b><span>${esc(t("mw.u.organisasi"))}</span></p></div>
    <p>${esc(t(staf ? "mw.anggota_staf" : "mw.anggota_agregat"))}</p>${staf ? `<a class="jm-tbl" href="/direktori?prov=${esc(kode)}">${esc(t("mw.lihat_direktori"))}</a>` : ""}`;
  return seksi({ id: "anggota", ikon: "direktori", topik: t("mw.ey.anggota"), judulHtml: esc(t("mw.anggota")), isiHtml: isi, kakiHtml: `<p class="jm-bantu">${esc(t("mw.anggota_sumber"))}</p>` });
}

function kegiatanHtml() {
  return seksi({ id: "kegiatan", ikon: "kalender", topik: t("mw.ey.kegiatan"), judulHtml: esc(t("mw.kegiatan")), isiHtml: `<div id="kg-isi">${hantuHtml(2)}</div>` });
}
async function isiKegiatan(b) {
  const el = document.getElementById("kg-isi");
  if (!el) return;
  const ambil = (u) => fetch(u, { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : { baris: [] })).catch(() => ({ baris: [] }));
  const [br, kal] = await Promise.all([ambil("/data/berita.json"), ambil("/data/kalender.json")]);
  const nm = b.nama.toLowerCase(), meti = /\bmeti\b|masyarakat energi terbarukan/i;
  const berita = (br.baris || []).filter((x) => meti.test(x.judul || "") && (x.wilayah || []).some((w) => String(w.prov || "").toLowerCase() === nm)).sort((p, q) => String(q.terbit).localeCompare(String(p.terbit))).slice(0, 5);
  const acara = (kal.baris || []).filter((x) => /meti wilayah/i.test(`${x.judul} ${x.mitra}`) && `${x.judul} ${x.mitra}`.toLowerCase().includes(nm)).sort((p, q) => String(q.tanggal).localeCompare(String(p.tanggal))).slice(0, 5);
  const li = (a) => a.map(([tg, tj, href]) => `<li><time>${esc(tgl(String(tg).slice(0, 10)))}</time>${href ? `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(tj)}</a>` : `<span>${esc(tj)}</span>`}</li>`).join("");
  el.innerHTML = `<div class="mw-dua"><div><h3>${esc(t("mw.acara"))}</h3>${acara.length ? `<ul class="mw-daftar">${li(acara.map((x) => [x.tanggal, x.judul, ""]))}</ul>` : `<p class="jm-bantu">${esc(t("mw.acara_kosong"))}</p>`}</div>
    <div><h3>${esc(t("mw.berita"))}</h3>${berita.length ? `<ul class="mw-daftar">${li(berita.map((x) => [x.terbit, x.judul, /^https?:\/\//.test(x.url || "") ? x.url : ""]))}</ul>` : `<p class="jm-bantu">${esc(t("mw.berita_kosong"))}</p>`}</div></div>`;
}

function proyekHtml(b) {
  return seksi({ id: "proyek", ikon: "proyek", topik: t("mw.ey.proyek"), judulHtml: esc(t("mw.proyek", { prov: b.nama })),
    isiHtml: `<div id="py-isi" class="mw-angka"></div><div class="mw-aksi"><a class="jm-tbl" href="/wilayah?prov=${esc(b.kode)}">${esc(t("mw.ke_wilayah"))}</a><a class="jm-tbl" href="/peluang">${esc(t("mw.ke_peluang"))}</a><a class="jm-tbl" href="/proyek">${esc(t("mw.ke_proyek"))}</a></div>` });
}
async function isiProyek(b) {
  try {
    const d = await (await fetch("/data/wilayah.json", { credentials: "same-origin" })).json(), p = d.baris.find((x) => x.kode === b.kode);
    if (!p) return;
    const mw = p.terpasang_mw?.nilai;
    document.getElementById("py-isi").innerHTML = `<p><b>${esc(angka(p.jumlah_proyek ?? 0))}</b><span>${esc(t("mw.n_proyek"))}</span></p><p><b>${esc(mw == null ? "-" : angka(mw, { desimal: 0 }))}</b><span>${esc(t("mw.mw_terpasang"))}</span></p>`;
  } catch { /* tautan saja */ }
}

/* ---------- kit: unduhan + linimasa H-45 sebagai daftar tugas ---------- */
const kunciTugas = (kode) => "jm-mw-tugas:" + kode;
function tugasTersimpan(kode) { try { return new Set(JSON.parse(localStorage.getItem(kunciTugas(kode)) || "[]")); } catch { return new Set(); } }
function kitHtml(b) {
  const tersimpan = tugasTersimpan(b.kode);
  const butir = HARI.map((h, i) => {
    const tanggalH = b.tgl_pelantikan ? tgl(tambahHari(b.tgl_pelantikan, -h)) : "";
    return `<li><label class="jm-cek"><input type="checkbox" data-i="${i}"${tersimpan.has(i) ? " checked" : ""}><span><b>${esc(h === 0 ? t("mw.h0") : t("mw.hmin", { n: h }))}</b>${tanggalH ? ` <small>${esc(tanggalH)}</small>` : ""} ${esc(t("mw.tl." + i))}</span></label></li>`;
  }).join("");
  const unduh = [["panduan-pelantikan", "mw.kit.panduan"], ["templat-sk", "mw.kit.templat"]].map(([id, k]) => `<button type="button" class="jm-tbl" data-kit="${id}">${ikon("unduh", 16)}<span>${esc(t(k))}</span></button>`).join("");
  return seksi({ id: "kit", ikon: "unduh", topik: t("mw.ey.kit"), judulHtml: esc(t("mw.kit")),
    isiHtml: `<div class="mw-aksi">${unduh}</div><div id="kit-pesan" aria-live="polite"></div><h3>${esc(t("mw.linimasa"))}</h3><ol class="mw-tugas">${butir}</ol>`,
    kakiHtml: `<p class="jm-bantu">${esc(t(b.tgl_pelantikan ? "mw.linimasa_bantu" : "mw.linimasa_tanpa_tanggal"))}</p>` });
}

/* ---------- pengajuan ---------- */
function linimasaAjuan(a) {
  const idx = TAHAP.indexOf(a.status);
  if (a.status === "ditolak") return `<div class="mw-ajuan"><p>${pilDitolak()}</p>${a.catatan ? `<p>${esc(a.catatan)}</p>` : ""}</div>`;
  return `<ol class="mw-tahap">${TAHAP.map((s, i) => `<li class="${i < idx ? "selesai" : i === idx ? "kini" : ""}"${i === idx ? ' aria-current="step"' : ""}><span class="mw-dot" aria-hidden="true">${i < idx ? ikon("centang", 14) : i + 1}</span><span>${esc(t("mw.tahap." + s))}</span></li>`).join("")}</ol>${a.catatan ? `<p class="jm-bantu">${esc(a.catatan)}</p>` : ""}`;
}
const pilDitolak = () => `<span class="jm-pil jm-pil-bad">${esc(t("mw.tahap.ditolak"))}</span>`;

function formHtml() {
  const cek = BIDANG_STD.map((k) => `<label class="jm-cek"><input type="checkbox" name="bidang" value="${k}"><span>${esc(t("mw.bidang." + k))}</span></label>`).join("");
  const isian = (id, kunci, mks, wajib) => `<div class="jm-medan jm-ambang"><input class="jm-isian" id="${id}" name="${id}" maxlength="${mks}" placeholder=" " autocomplete="off"${wajib ? " required" : ""}><label for="${id}">${esc(t(kunci))}</label></div>`;
  return `<form class="mw-form" id="mw-form" novalidate><div id="mw-pesan" aria-live="polite"></div>
    <div class="mw-tiga">${isian("ketua", "mw.f.ketua", 120, true)}${isian("sekretaris", "mw.f.sekretaris", 120, true)}${isian("bendahara", "mw.f.bendahara", 120, true)}</div>
    <div class="jm-medan jm-ambang"><textarea class="jm-isian" id="formatur" name="formatur" rows="3" maxlength="1200" placeholder=" "></textarea><label for="formatur">${esc(t("mw.f.formatur"))}</label></div>
    ${isian("sekretariat", "mw.f.sekretariat", 300, true)}
    <fieldset class="mw-bidang-f"><legend>${esc(t("mw.f.bidang"))}</legend><div class="mw-cek-kisi">${cek}</div></fieldset>
    ${isian("kontak", "mw.f.kontak", 120, false)}<p class="jm-bantu">${esc(t("mw.f.kontak_bantu"))}</p>
    <div class="mw-berkas"><label class="jm-tbl" for="berkas">${ikon("tambah", 16)}<span>${esc(t("mw.f.berkas"))}</span></label><input type="file" id="berkas" class="sr" multiple accept=".pdf,.docx,.jpg,.jpeg,.png"><ul id="berkas-daftar" class="mw-daftar"></ul><p class="jm-bantu">${esc(t("mw.f.berkas_bantu"))}</p></div>
    <button type="submit" class="jm-tbl jm-tbl-utama" id="kirim">${esc(t("mw.f.kirim"))}</button></form>`;
}

function ajakanHtml(b, w, ajuan) {
  const terbuka = ajuan.find((a) => !["berdiri", "ditolak"].includes(a.status));
  const terakhir = ajuan[0];
  const isi = (terbuka || terakhir ? `<div class="mw-ajuan"><h3>${esc(t("mw.ajuan_saya"))}</h3>${linimasaAjuan(terbuka || terakhir)}</div>` : "")
    + (terbuka ? `<p class="jm-bantu">${esc(t("mw.ajuan_terbuka"))}</p>` : `<p>${esc(t("mw.ajakan_isi", { prov: b.nama }))}</p><button type="button" class="jm-tbl jm-tbl-utama" id="buka-form" aria-expanded="false" aria-controls="form-wadah">${esc(t("mw.daftar_tombol"))}</button><div id="form-wadah" hidden>${formHtml()}</div>`);
  return seksi({ id: "ajukan", ikon: "tambah", topik: t("mw.ey.ajakan"), judulHtml: esc(t("mw.ajakan", { prov: b.nama })), isiHtml: isi });
}

/* ---------- pasang ---------- */
function pasangFoto(akar) {
  for (const el of akar.querySelectorAll("[data-foto]")) {
    const im = new Image();
    im.alt = ""; im.width = 360; im.height = 480;
    im.onload = () => el.prepend(im);
    im.src = `/img/pengurus/${el.dataset.foto}-b.webp`;
  }
}

async function petaMini(kode) {
  const g = await geoProvinsi(), el = document.getElementById("mini");
  if (!g || !el) return;
  const js = jalurPerProvinsi(g, 400, 152);
  el.innerHTML = `<svg viewBox="0 0 400 152" focusable="false" aria-hidden="true">${js.filter((x) => x.d && x.kode !== kode).map((x) => `<path class="mw-mp" d="${x.d}"/>`).join("")}${js.filter((x) => x.kode === kode).map((x) => `<path class="mw-mp mw-mp-on" d="${x.d}"/>`).join("")}</svg>`;
}

function pasangKit(akar, b) {
  const pesan = akar.querySelector("#kit-pesan");
  akar.querySelector("#kit")?.addEventListener("click", async (e) => {
    const tombol = e.target.closest("button[data-kit]");
    if (!tombol) return;
    tombol.setAttribute("aria-busy", "true");
    try {
      const r = await fetch("/api/meti-wilayah/kit/" + encodeURIComponent(tombol.dataset.kit), { credentials: "same-origin", headers: { "x-pb": "1" } });
      if (r.status === 404) { pesan.innerHTML = pesanHtml("galat", t("mw.kit.belum")); return; }
      if (!r.ok) throw new GalatApi("umum", r.status);
      const u = URL.createObjectURL(await r.blob()), a = document.createElement("a");
      a.href = u; a.download = tombol.dataset.kit; a.click();
      setTimeout(() => URL.revokeObjectURL(u), 4000);
      pesan.innerHTML = "";
    } catch (err) { pesan.innerHTML = pesanHtml("galat", galatTeks(err.kode || "umum")); } finally { tombol.removeAttribute("aria-busy"); }
  });
  akar.querySelector(".mw-tugas")?.addEventListener("change", () => {
    const pilih = [...akar.querySelectorAll(".mw-tugas input:checked")].map((x) => Number(x.dataset.i));
    try { localStorage.setItem(kunciTugas(b.kode), JSON.stringify(pilih)); } catch { /* tanpa simpanan */ }
  });
}

function pasangForm(akar, b, muat) {
  const tombol = akar.querySelector("#buka-form");
  if (!tombol) return;
  const wadah = akar.querySelector("#form-wadah"), form = akar.querySelector("#mw-form"), pesan = (j, tk) => { akar.querySelector("#mw-pesan").innerHTML = tk ? pesanHtml(j, tk) : ""; };
  tombol.addEventListener("click", () => { const buka = wadah.hidden; wadah.hidden = !buka; tombol.setAttribute("aria-expanded", String(buka)); if (buka) akar.querySelector("#ketua").focus(); });
  const berkas = akar.querySelector("#berkas"), daftar = akar.querySelector("#berkas-daftar");
  berkas.addEventListener("change", () => { daftar.innerHTML = [...berkas.files].map((f) => `<li>${esc(f.name)} <small>${esc((f.size / 1048576).toFixed(1))} MB</small></li>`).join(""); });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const v = (id) => form.querySelector("#" + id).value.trim(), files = [...berkas.files];
    const bidang = [...form.querySelectorAll('input[name="bidang"]:checked')].map((x) => x.value);
    if (!v("ketua") || !v("sekretaris") || !v("bendahara") || !v("sekretariat")) return pesan("galat", t("mw.f.salah_wajib"));
    if (!bidang.length) return pesan("galat", t("mw.f.salah_bidang"));
    if (files.length > 5 || files.some((f) => f.size > MAKS_BERKAS || !EKS.test(f.name))) return pesan("galat", t("mw.f.salah_berkas"));
    const kirim = form.querySelector("#kirim");
    kirim.disabled = true; kirim.setAttribute("aria-busy", "true"); pesan("", "");
    try {
      const formatur = v("formatur").split(/\n+/).map((x) => x.trim()).filter(Boolean);
      const r = await api("/api/meti-wilayah/ajuan", { metode: "POST", badan: { kode: b.kode, ketua: v("ketua"), sekretaris: v("sekretaris"), bendahara: v("bendahara"), sekretariat: v("sekretariat"), formatur, bidang, kontak: v("kontak") || undefined } });
      for (const f of files) {
        const u = await fetch(`/api/meti-wilayah/ajuan/${r.id}/berkas?nama=${encodeURIComponent(f.name)}`, { method: "POST", credentials: "same-origin", headers: { "x-pb": "1", "content-type": f.type || "application/octet-stream" }, body: f });
        if (!u.ok) throw new GalatApi("umum", u.status);
      }
      muat();
    } catch (err) {
      pesan("galat", err.status === 409 ? t("mw.f.konflik") : galatTeks(err.kode || "umum"));
      kirim.disabled = false; kirim.removeAttribute("aria-busy");
    }
  });
}

export async function profilWilayah(kode, S, saya, akar) {
  const b = S.baris.find((x) => x.kode === kode);
  if (!b) { akar.innerHTML = `<div class="jm-kosong"><p>${esc(t("mw.tidak_ada"))}</p></div>`; return; }
  document.title = t("mw.profil_title", { prov: b.nama });
  akar.innerHTML = hantuHtml(4);
  let det;
  try { det = await api("/api/meti-wilayah/" + encodeURIComponent(kode)); } catch (e) { akar.innerHTML = `<div class="jm-galat" role="alert">${esc(galatTeks(e.kode || "umum"))}</div>`; return; }
  const w = { ...b, ...(det.wilayah || {}), bidang: det.wilayah?.bidang || [] };
  const { html, ub } = kepalaHtml(w, det.wilayah, det.anggota);
  akar.innerHTML = html + `<div class="mw-isi">${[skHtml(w), sekretariatHtml(w), pengurusHtml(w, saya), bidangHtml(w), anggotaHtml(det.anggota, kode, saya), kegiatanHtml(), proyekHtml(w), kitHtml(w), w.status === "berdiri" ? "" : ajakanHtml(w, det.wilayah, det.ajuan_saya)].join("")}</div>`;
  khUbin("ubin-p", ub);
  pasangFoto(akar); pasangKit(akar, w);
  pasangForm(akar, w, () => profilWilayah(kode, S, saya, akar));
  nanti(() => { petaMini(kode); isiKegiatan(w); isiProyek(w); });
}
