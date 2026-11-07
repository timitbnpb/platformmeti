/* /profil-saya: profil sendiri ala halaman profil profesional. Kepala bersampul + foto bulat yang bisa diklik, kolom kiri berisi bagian baca-saja,
   kolom kanan ringkasan (kelengkapan, KTA, pengaturan). Semua sunting lewat satu <dialog> per bagian; satu API (/api/profil/saya), server tetap menghakimi.
   INP: dialog berisi form kecil dan sinkron; daftar organisasi/proyek (besar) dimuat malas hanya saat kolomnya difokuskan. */
import { t, bahasa, tanggal, tanggalDariUnix, jam } from "/i18n.js";
import { api, esc, ikon, galatTeks, pesanHtml, hantuHtml, debounce, nanti, GalatApi } from "/inti/umum.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { exHtml } from "/inti/komponen.js";
import { IKON_TEK } from "/inti/ikon_tek.js";
import { pasangPilih } from "/inti/pilih.js";
import { namaProyek } from "/inti/nama_proyek.js";
import { segarkanAvatar } from "/inti/akun_menu.js";
import { namaProvinsi, pasangFoto, fotoIsi, labelKeahlian } from "/profil_tampil.js";

await mulaiHalaman();
pasangFoto();

const BAGIAN = [["foto", "gambar"], ["pekerjaan", "direktori"], ["lokasi", "lokasi"], ["bio", "info"], ["keahlian", "topik"], ["tautan", "tautan"], ["riwayat", "linimasa"], ["kontak", "surel"]];
const TEK_PRESET = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "penyimpanan", "hidrogen", "nuklir"];
const JENJANG = ["sma", "d3", "d4", "s1", "s2", "s3", "lain"];
const SAMPUL = ["surya-cirata", "bayu-sidrap", "hidro-saguling", "panas-bumi-sibayak", "bioenergi-sawit", "penyimpanan-baterai", "sampah-psel", "nuklir-siwabessy", "biomassa-bantargebang", "bioetanol-tebu"];
const MAKS_KEAHLIAN = 12, MAKS_BIO = 600, MAKS_RIWAYAT = 15, MAKS_FOTO_SUMBER = 10 * 1024 * 1024, UKURAN_FOTO = 512;
const IK_JENIS = { pendidikan: "wisuda", pengalaman: "gedung", sertifikasi: "perisai", publikasi: "regulasi" };
const BIDANG = {
  pendidikan: [["jenjang", "pilih", 0, true, "wisuda"], ["kampus", "teks", 120, true, "gedung"], ["jurusan", "teks", 120, false, "buku"], ["tahun", "angka", 0, false, "tahun"]],
  pengalaman: [["jabatan", "teks", 120, true, "orang"], ["organisasi", "teks", 120, true, "gedung"], ["mulai", "angka", 0, true, "tahun"], ["selesai", "angka", 0, false, "tahun"]],
  sertifikasi: [["nama", "teks", 120, true, "perisai"], ["penerbit", "teks", 120, false, "gedung"], ["tahun", "angka", 0, false, "tahun"]],
  publikasi: [["judul", "teks", 160, true, "regulasi"], ["tahun", "angka", 0, false, "tahun"], ["proyek_id", "proyek", 0, false, "proyek"]],
};

const $ = (id) => document.getElementById(id);
const panel = $("pfPanel"), samping = $("pfSamping"), dlg = $("psDlg");
const S = { p: null, prov: [], crop: null, orgs: null, proyek: null, kenal: null };
const Z = { org: "", ahli: [], rw: null }; // keadaan dialog yang sedang terbuka

const tx = (k) => `data-i18n="${k}"`;
const pesan = (jenis, teks) => { const el = $("pfPesan"); if (el) el.innerHTML = teks ? pesanHtml(jenis, teks) : ""; };
const tombolIk = (aksi, ik, label, data = "") => `<button type="button" class="ps-ik" data-aksi="${aksi}" ${data} aria-label="${esc(label)}" title="${esc(label)}">${ikon(ik, 18)}</button>`;
const kartu = (ik, kunci, isi, aksi = "") => exHtml({ ikon: ik, judulHtml: `<span ${tx(kunci)}>${esc(t(kunci))}</span>`, aksiHtml: aksi, isiHtml: isi, tingkat: "h2", kelas: "pf-ex" });
const kosong = (ik, kunci, aksi, data = "") => `<div class="ps-kosong"><span class="ps-kosong-ik">${ikon(ik, 28)}</span><p>${esc(t(kunci))}</p><button type="button" class="jm-tbl" data-aksi="${aksi}" ${data}>${ikon("tambah", 18)}<span>${esc(t("pf.tambah"))}</span></button></div>`;
const medan = (id, kunci, ik, isi, bantu = "") => `<div class="jm-medan ps-f"><label for="${id}">${esc(t(kunci))}</label><div class="ps-in">${ikon(ik, 18)}${isi}</div><small class="pf-bantu ps-bantu">${bantu}</small></div>`;
const teks = (id, nilai, maks, { tipe = "text", ac = "off", mode = "", ro = false } = {}) => `<input class="jm-isian" id="${id}" name="${id}" type="${tipe}" maxlength="${maks}" autocomplete="${ac}"${mode ? ` inputmode="${mode}"` : ""} value="${esc(nilai ?? "")}"${ro ? " readonly" : ""}>`;

/* ---------- muat ---------- */
async function muat() { S.p = await api("/api/profil/saya"); }
const namaProv = () => (S.prov.find(([k]) => k === S.p.kode_prov) || [])[1] || "";
const daftarRw = (j) => S.p.riwayat?.[j] || [];

/* ---------- kepala ---------- */
function sampulIndeks() { try { return Math.abs(+localStorage.getItem("jm-sampul") || 0) % SAMPUL.length; } catch { return 0; } }
function gambarSampul(i = sampulIndeks()) { $("psSampul").src = `/img/beranda/${SAMPUL[i]}.webp`; }
function gambarKepala() {
  const p = S.p, h1 = $("judul");
  $("pfFotoKepala").innerHTML = `${fotoIsi(p.id, p.nama, p.foto)}<span class="ps-kam">${ikon("kamera", 18)}</span><span class="ps-ganti">${ikon("kamera", 16)}<span>${esc(t("pf.foto.ganti"))}</span></span>`;
  h1.removeAttribute("data-i18n"); h1.textContent = [p.gelar, p.nama].filter(Boolean).join(" ");
  document.title = `${h1.textContent} | ${t("ag.situs")}`;
  $("pfSub").textContent = p.jabatan && p.instansi ? t("pf.headline", { jabatan: p.jabatan, instansi: p.instansi }) : p.jabatan || p.instansi || t("pf.headline.kosong");
  const org = p.instansi ? (p.organisasi_id ? `<a class="pf-taut" href="/o/${encodeURIComponent(p.organisasi_id)}">${ikon("gedung", 16)}<span>${esc(p.instansi)}</span></a>` : `<span>${ikon("gedung", 16)}<span>${esc(p.instansi)}</span></span>`) : "";
  const lok = [p.kota, namaProv()].filter(Boolean).join(", ");
  $("pfMeta").innerHTML = [lok ? `<span>${ikon("lokasi", 16)}<span>${esc(lok)}</span></span>` : "", org].filter(Boolean).join("");
  $("pfLencana").innerHTML = p.kta ? `<span class="pf-lencana-meti" title="${esc(t("pf.lencana.ket"))}">${ikon("qr", 16)}<span>${esc(t("pf.lencana"))}${p.kta.tahun_masuk ? ` ${esc(t("pf.sejak", { th: p.kta.tahun_masuk }))}` : ""}</span></span>` : "";
  $("pfAksi").innerHTML = `<button type="button" class="jm-tbl jm-tbl-utama" data-aksi="buka" data-bag="diri">${ikon("ubah", 18)}<span>${esc(t("pf.sunting"))}</span></button>
    <a class="jm-tbl" href="/anggota/${encodeURIComponent(p.id)}">${ikon("orang", 18)}<span>${esc(t("pf.lihat_publik"))}</span></a>
    <button type="button" class="jm-tbl" data-aksi="bagikan">${ikon("bagikan", 18)}<span>${esc(t("pf.bagikan"))}</span></button>`;
}

/* ---------- bagian baca ---------- */
function periode(j, x) {
  if (j === "pengalaman") return x.mulai ? `${x.mulai} - ${x.selesai || t("pf.sekarang")}` : "";
  return x.tahun ? String(x.tahun) : "";
}
function judulSub(j, x) {
  if (j === "pendidikan") return [x.kampus, [t("pf.jenjang." + x.jenjang), x.jurusan].filter(Boolean).join(", ")];
  if (j === "pengalaman") return [x.jabatan, x.organisasi];
  if (j === "sertifikasi") return [x.nama, x.penerbit];
  return [x.judul, ""];
}
function timeline(j) {
  const d = daftarRw(j);
  if (!d.length) return kosong(IK_JENIS[j], "pf.kosong." + j, "tambah-rw", `data-jenis="${j}"`);
  return `<ol class="ps-tl${j === "pengalaman" || j === "pendidikan" ? " ps-tl-garis" : ""}">${d.map((x) => {
    const [a, b] = judulSub(j, x), p = periode(j, x);
    const taut = j === "publikasi" && x.proyek_id ? `<a class="pf-taut pf-taut-kecil" href="/p/${encodeURIComponent(x.proyek_id)}">${ikon("proyek", 14)}<span>${esc(t("pf.lihat_proyek"))}</span></a>` : "";
    return `<li class="ps-tl-i"><span class="ps-logo">${ikon(IK_JENIS[j], 22)}</span><div class="ps-tl-isi"><b>${esc(a)}</b>${b ? `<span>${esc(b)}</span>` : ""}${p ? `<small>${ikon("tahun", 14)}<span>${esc(p)}</span></small>` : ""}${taut}</div>${tombolIk("ubah-rw", "ubah", t("pf.ubah"), `data-jenis="${j}" data-id="${x.id}"`)}</li>`;
  }).join("")}</ol>`;
}
const aksiRw = (j) => (daftarRw(j).length >= MAKS_RIWAYAT ? "" : tombolIk("tambah-rw", "tambah", t("pf.tambah"), `data-jenis="${j}"`));
const kartuRw = (j) => kartu(IK_JENIS[j], "pf.jenis." + j, timeline(j), aksiRw(j));

function gambarPanel() {
  const p = S.p, ubah = (bag) => tombolIk("buka", "ubah", t("pf.ubah"), `data-bag="${bag}"`);
  const tentang = kartu("info", "pf.bag.bio", p.bio ? `<p class="pf-bio">${esc(p.bio)}</p>` : kosong("info", "pf.kosong.bio", "buka", 'data-bag="bio"'), ubah("bio"));
  const ahli = kartu("topik", "pf.bag.keahlian", p.keahlian?.length ? `<div class="pf-pils">${p.keahlian.map((k) => `<span class="pf-pil">${IKON_TEK[k] || ikon("topik", 14)}<span>${esc(labelKeahlian(k))}</span></span>`).join("")}</div>` : kosong("topik", "pf.kosong.keahlian", "buka", 'data-bag="ahli"'), ubah("ahli"));
  const meti = p.kta ? `<li class="ps-tl-i"><span class="ps-logo">${ikon("qr", 22)}</span><div class="ps-tl-isi"><b>${esc(t("pf.lencana"))}</b>${p.kta.tahun_masuk ? `<span>${esc(t("pf.sejak", { th: p.kta.tahun_masuk }))}</span>` : ""}</div></li>` : "";
  const inst = p.instansi ? `<li class="ps-tl-i"><span class="ps-logo">${ikon("gedung", 22)}</span><div class="ps-tl-isi"><b>${esc(p.instansi)}</b>${p.jabatan ? `<span>${esc(p.jabatan)}</span>` : ""}${p.organisasi_id ? `<a class="pf-taut pf-taut-kecil" href="/o/${encodeURIComponent(p.organisasi_id)}">${ikon("tautan", 14)}<span>${esc(t("pf.f.org_tertaut"))}</span></a>` : ""}</div></li>` : "";
  const org = kartu("gedung", "pf.bag.org", inst || meti ? `<ul class="ps-tl">${inst}${meti}</ul>` : kosong("gedung", "pf.kosong.org", "buka", 'data-bag="diri"'), ubah("diri"));
  const li = p.tautan?.linkedin, si = p.tautan?.situs, tel = p.kontak?.telepon, sur = p.kontak?.surel;
  const aman = (u) => (/^https?:[/][/]/i.test(u || "") ? u : "");
  const baris = (ik, label, v, href) => `<li><span class="ps-logo">${ikon(ik, 20)}</span><span class="ps-kon"><small>${esc(label)}</small>${href ? `<a class="pf-taut" href="${esc(href)}" target="_blank" rel="noopener noreferrer nofollow"><span>${esc(v)}</span></a>` : `<b>${esc(v)}</b>`}</span></li>`;
  const kon = [li ? baris("linkedin", t("pf.f.linkedin"), li, aman(li)) : "", si ? baris("tautan", t("pf.f.situs"), si, aman(si)) : "", tel ? baris("whatsapp", t("pf.f.telepon"), tel) : "", sur ? baris("surel", t("pf.f.surel"), sur) : ""].filter(Boolean).join("");
  const tautan = kartu("tautan", "pf.bag.kontak_tautan", kon ? `<ul class="ps-kons">${kon}</ul>` : kosong("tautan", "pf.kosong.tautan", "buka", 'data-bag="tautan"'), ubah("tautan"));
  panel.innerHTML = tentang + kartuRw("pengalaman") + kartuRw("pendidikan") + ahli + kartuRw("sertifikasi") + kartuRw("publikasi") + org + tautan;
}

/* ---------- samping ---------- */
function kelengkapan() {
  const p = S.p;
  return [
    ["foto", !!p.foto, "ganti-foto", ""], ["jabatan", !!(p.jabatan && p.instansi), "buka", "diri"], ["lokasi", !!(p.kota || p.kode_prov), "buka", "diri"],
    ["bio", !!p.bio, "buka", "bio"], ["keahlian", !!p.keahlian?.length, "buka", "ahli"], ["pengalaman", daftarRw("pengalaman").length > 0, "tambah-rw", "pengalaman"],
    ["pendidikan", daftarRw("pendidikan").length > 0, "tambah-rw", "pendidikan"], ["tautan", !!(p.tautan?.linkedin || p.tautan?.situs), "buka", "tautan"],
  ];
}
function gambarSamping() {
  const p = S.p, k = kelengkapan(), n = Math.round((k.filter((x) => x[1]).length / k.length) * 100);
  const data = (aksi, v) => (aksi === "buka" ? `data-bag="${v}"` : aksi === "tambah-rw" ? `data-jenis="${v}"` : "");
  const lk = kartu("daftar", "pf.lengkap.judul", `<p class="ps-persen"><b>${esc(t("pf.lengkap", { n }))}</b></p>
    <ul class="ps-cek">${k.map(([id, ok, aksi, v]) => `<li><button type="button" class="ps-cek-b${ok ? " ok" : ""}" data-aksi="${aksi}" ${data(aksi, v)}><span class="ps-cek-m">${ok ? ikon("centang", 14) : ""}</span><span>${esc(t("pf.lk." + id))}</span></button></li>`).join("")}</ul>`);
  const kta = kartu("kartu", "pf.kta.judul", p.kta ? `<p class="ps-kta">${ikon("centang", 18)}<span>${esc(t("pf.lencana"))}${p.kta.tahun_masuk ? ` ${esc(t("pf.sejak", { th: p.kta.tahun_masuk }))}` : ""}</span></p>` : `<p class="ps-kta ps-kta-belum">${ikon("info", 18)}<span>${esc(t("pf.kta.belum"))}</span></p>`);
  const baris = (aksi, ik, kunci, data = "") => `<li><button type="button" class="ps-set" data-aksi="${aksi}" ${data}>${ikon(ik, 18)}<span>${esc(t(kunci))}</span></button></li>`;
  const set = kartu("kunci", "pf.set.judul", `<ul class="ps-sets">${baris("buka", "kunci", "pf.tab.privasi", 'data-bag="privasi"')}${baris("buka", "perisai", "pf.tab.keamanan", 'data-bag="keamanan"')}${p.foto ? baris("hapus-foto", "silang", "pf.foto.hapus") : ""}</ul>`);
  const kenal = S.kenal?.length ? kartu("orang", "pf.kenal.judul", `<ul class="ps-kenal">${S.kenal.map((o) => `<li><span class="ps-logo">${ikon("orang", 20)}</span><span><b>${esc(o.nama)}</b>${o.jabatan_terkini ? `<small>${esc(o.jabatan_terkini)}</small>` : ""}</span></li>`).join("")}</ul>`) : "";
  samping.innerHTML = lk + kta + set + kenal;
}
function muatKenal() {
  const org = S.p.organisasi_id;
  if (!org) return;
  fetch("/data/orang.json").then((r) => r.json()).then((j) => {
    S.kenal = j.baris.filter((o) => o.organisasi_id === org && o.nama !== S.p.nama).slice(0, 4);
    if (S.kenal.length) gambarSamping();
  }).catch(() => {});
}
function segar() { gambarKepala(); gambarPanel(); gambarSamping(); }

/* ---------- dialog ---------- */
function buka({ judul, ik, isi, form, kaki = "simpan", hapus = "" }) {
  const batal = `<button type="button" class="jm-tbl" data-aksi="tutup">${ikon("silang", 18)}<span>${esc(t(kaki === "simpan" ? "jm.batal" : "jm.tutup"))}</span></button>`;
  const simpan = kaki === "simpan" ? `<button type="submit" class="jm-tbl jm-tbl-utama">${ikon("centang", 18)}<span>${esc(t("pf.simpan"))}</span></button>` : "";
  dlg.innerHTML = `<form class="ps-form" data-form="${form}" novalidate>
    <header class="ps-dlg-hd"><span class="ps-dlg-ik">${ikon(ik, 20)}</span><h2 id="psDlgJ">${esc(judul)}</h2>${tombolIk("tutup", "silang", t("jm.tutup"))}</header>
    <div class="ps-dlg-bd">${isi}${hapus}<div id="psDlgPesan" aria-live="polite"></div></div>
    <footer class="ps-kaki${kaki === "simpan" ? "" : " ps-kaki-satu"}">${batal}${simpan}</footer></form>`;
  if (!dlg.open) dlg.showModal();
  pasangPilih();
}
const galatDlg = (m) => { const el = $("psDlgPesan"); if (el) el.innerHTML = pesanHtml("galat", m); };
async function kirim(fn) {
  const btn = dlg.querySelector("[type=submit]");
  if (btn) { btn.disabled = true; btn.setAttribute("aria-busy", "true"); }
  try { await fn(); dlg.close(); await muat(); segar(); pesan("ok", t("pf.tersimpan")); }
  catch (e) { galatDlg(e.status === 409 ? t("pf.riwayat.penuh") : e.pesanSendiri || galatTeks(e.kode)); if (btn) { btn.disabled = false; btn.removeAttribute("aria-busy"); } }
}
const simpanProfil = (badan) => api("/api/profil/saya", { metode: "PUT", badan });
const nilai = (id) => $(id)?.value.trim() ?? "";

/* --- Sunting profil (data diri) --- */
function bukaDiri() {
  const p = S.p, opsi = [["", t("pf.f.prov_pilih"), "peta"], ...S.prov.map(([k, n]) => [k, n, "prov:" + k])];
  Z.org = p.organisasi_id || "";
  const prov = `<select id="fProv" title="${esc(t("pf.f.prov"))}" data-ikon="peta">${opsi.map(([v, l, i]) => `<option value="${esc(v)}"${v === (p.kode_prov || "") ? " selected" : ""} data-ikon="${esc(i)}">${esc(l)}</option>`).join("")}</select>`;
  buka({ judul: t("pf.sunting"), ik: "orang", form: "diri", isi: `<div class="ps-grid">
    ${medan("fNama", "pf.f.nama", "kunci", teks("fNama", p.nama, 120, { ro: true }), esc(t("pf.f.nama_bantu")))}
    ${medan("fGelar", "pf.f.gelar", "bintang", teks("fGelar", p.gelar, 40, { ac: "honorific-prefix" }), esc(t("pf.f.gelar_bantu")))}
    ${medan("fJabatan", "pf.f.jabatan", "direktori", teks("fJabatan", p.jabatan, 120, { ac: "organization-title" }))}
    <div class="jm-medan ps-f pf-combo-w"><label for="fInstansi">${esc(t("pf.f.instansi"))}</label><div class="ps-in pf-combo">${ikon("gedung", 18)}<input class="jm-isian" id="fInstansi" name="fInstansi" role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="lstOrg" autocomplete="off" maxlength="160" value="${esc(p.instansi || "")}"><ul class="pf-lst" id="lstOrg" role="listbox" hidden></ul></div><small class="pf-bantu ps-bantu" id="refOrg"></small></div>
    ${medan("fKota", "pf.f.kota", "lokasi", teks("fKota", p.kota, 80, { ac: "address-level2" }))}
    <div class="jm-medan ps-f"><label for="fProv">${esc(t("pf.f.prov"))}</label><div class="ps-in ps-in-pilih">${prov}</div><small class="pf-bantu ps-bantu"></small></div></div>` });
  segarOrg();
  pasangCombo($("fInstansi"), $("lstOrg"), SUMBER.org, (x) => { Z.org = x.id; $("fInstansi").value = x.nama; segarOrg(); });
}
function segarOrg() {
  const r = $("refOrg");
  if (!r) return;
  r.innerHTML = Z.org ? `<a class="pf-taut pf-taut-kecil" href="/o/${encodeURIComponent(Z.org)}" target="_blank" rel="noopener">${ikon("tautan", 14)}<span>${esc(t("pf.f.org_tertaut"))}</span></a> <button type="button" class="pf-lepas" data-aksi="lepas-org">${esc(t("pf.f.org_lepas"))}</button>` : esc(t("pf.f.instansi_bantu"));
}
const kirimDiri = () => simpanProfil({ gelar: nilai("fGelar"), jabatan: nilai("fJabatan"), instansi: nilai("fInstansi"), organisasi_id: Z.org, kota: nilai("fKota"), kode_prov: $("fProv").value });

/* --- Tentang --- */
function bukaBio() {
  buka({ judul: t("pf.bag.bio"), ik: "info", form: "bio", isi: `<div class="jm-medan ps-f"><label for="fBio">${esc(t("pf.f.bio"))}</label><textarea class="jm-isian pf-bio-isi" id="fBio" name="fBio" rows="6" maxlength="${MAKS_BIO}">${esc(S.p.bio || "")}</textarea><small class="pf-bantu ps-bantu"><span id="hitBio">${(S.p.bio || "").length}/${MAKS_BIO}</span></small></div>` });
}
const kirimBio = () => simpanProfil({ bio: nilai("fBio") });

/* --- Keahlian: pil pilihan bertoggle --- */
const ikChip = (k) => IKON_TEK[k] || ikon("topik", 14);
function gambarChip() {
  const semua = [...TEK_PRESET, ...Z.ahli.filter((k) => !TEK_PRESET.includes(k))];
  $("psChip").innerHTML = semua.map((k) => { const on = Z.ahli.includes(k); return `<button type="button" class="ps-chip" data-aksi="toggle-ahli" data-k="${esc(k)}" aria-pressed="${on}">${on ? ikon("centang", 14) : ikChip(k)}<span>${esc(labelKeahlian(k))}</span></button>`; }).join("");
  $("psAhliHit").textContent = `${Z.ahli.length}/${MAKS_KEAHLIAN}`;
}
function bukaAhli() {
  Z.ahli = [...(S.p.keahlian || [])];
  buka({ judul: t("pf.bag.keahlian"), ik: "topik", form: "ahli", isi: `<div class="ps-chips" id="psChip" role="group" aria-label="${esc(t("pf.f.saran"))}"></div><p class="pf-bantu ps-bantu"><span id="psAhliHit"></span></p>
    <div class="ps-tambah"><div class="ps-in">${ikon("topik", 18)}<input class="jm-isian" id="fAhliBaru" maxlength="40" autocomplete="off" placeholder="${esc(t("pf.f.ahli_baru"))}" aria-label="${esc(t("pf.f.ahli_baru"))}"></div><button type="button" class="jm-tbl" data-aksi="tambah-ahli">${ikon("tambah", 18)}<span>${esc(t("pf.f.tambah"))}</span></button></div>` });
  gambarChip();
}
function tambahAhli(k) {
  const v = String(k || "").trim().slice(0, 40);
  if (!v || Z.ahli.length >= MAKS_KEAHLIAN || Z.ahli.some((x) => x.toLowerCase() === v.toLowerCase())) return;
  Z.ahli.push(v); gambarChip(); $("fAhliBaru").value = "";
}
const kirimAhli = () => simpanProfil({ keahlian: Z.ahli });

/* --- Kontak dan tautan --- */
function bukaTautan() {
  const p = S.p;
  buka({ judul: t("pf.bag.kontak_tautan"), ik: "tautan", form: "tautan", isi: `<div class="ps-grid ps-grid2">
    ${medan("fLinkedin", "pf.f.linkedin", "linkedin", teks("fLinkedin", p.tautan?.linkedin, 200, { tipe: "url", mode: "url" }), esc(t("pf.f.linkedin_bantu")))}
    ${medan("fSitus", "pf.f.situs", "tautan", teks("fSitus", p.tautan?.situs, 200, { tipe: "url", mode: "url" }))}
    ${medan("fTelepon", "pf.f.telepon", "whatsapp", teks("fTelepon", p.kontak?.telepon, 20, { tipe: "tel", ac: "tel", mode: "tel" }), esc(t("pf.f.telepon_bantu")))}
    ${medan("fSurel", "pf.f.surel", "kunci", teks("fSurel", p.kontak?.surel, 120, { ro: true }), esc(t("pf.f.surel_bantu")))}</div>` });
}
const kirimTautan = () => simpanProfil({ tautan: { linkedin: nilai("fLinkedin"), situs: nilai("fSitus") }, telepon: nilai("fTelepon") });

/* --- Riwayat (pendidikan, pengalaman, sertifikasi, publikasi) --- */
function bukaRw(jenis, id = null) {
  const awal = id ? daftarRw(jenis).find((x) => x.id === id) || {} : {};
  Z.rw = { jenis, id };
  const f = BIDANG[jenis].map(([k, tipe, maks, wajib, ik]) => {
    const kid = `rw-${k}`, lab = esc(t(`pf.rw.${k}`)) + (wajib ? ` <span class="pf-wajib" aria-hidden="true">*</span>` : "");
    const bungkus = (isi, bantu = "") => `<div class="jm-medan ps-f${tipe === "proyek" ? " pf-combo-w" : ""}"><label for="${kid}${tipe === "proyek" ? "-teks" : ""}">${lab}</label><div class="ps-in${tipe === "pilih" ? " ps-in-pilih" : ""}${tipe === "proyek" ? " pf-combo" : ""}">${tipe === "pilih" ? "" : ikon(ik, 18)}${isi}</div><small class="pf-bantu ps-bantu">${bantu}</small></div>`;
    if (tipe === "pilih") return bungkus(`<select id="${kid}" title="${esc(t("pf.rw.jenjang"))}" data-ikon="${ik}">${JENJANG.map((j) => `<option value="${j}"${j === (awal[k] || "s1") ? " selected" : ""}>${esc(t("pf.jenjang." + j))}</option>`).join("")}</select>`);
    if (tipe === "angka") return bungkus(`<input class="jm-isian" id="${kid}" type="number" inputmode="numeric" min="1950" max="2100" value="${esc(awal[k] ?? "")}">`);
    if (tipe === "proyek") return bungkus(`<input class="jm-isian" id="${kid}-teks" role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="lstProyek" autocomplete="off" maxlength="120" value="${esc(awal.proyek_id || "")}"><ul class="pf-lst" id="lstProyek" role="listbox" hidden></ul><input type="hidden" id="${kid}" value="${esc(awal[k] || "")}">`, esc(t("pf.rw.proyek_bantu")));
    return bungkus(`<input class="jm-isian" id="${kid}" maxlength="${maks}" autocomplete="off" value="${esc(awal[k] ?? "")}">`);
  }).join("");
  buka({ judul: t(id ? "pf.modal.ubah" : "pf.modal.tambah", { nama: t("pf.jenis." + jenis) }), ik: IK_JENIS[jenis], form: "riwayat", isi: `<div class="ps-grid ps-grid2">${f}</div>`,
    hapus: id ? `<button type="button" class="jm-tbl jm-tbl-bahaya ps-hapus" data-aksi="hapus-rw">${ikon("silang", 18)}<span>${esc(t("pf.hapus"))}</span></button>` : "" });
  const teksProyek = $("rw-proyek_id-teks");
  if (teksProyek) {
    const nil = $("rw-proyek_id");
    SUMBER.proyek().then((semua) => { const n = semua.find((x) => x.id === nil.value); if (n) teksProyek.value = n.nama; });
    pasangCombo(teksProyek, $("lstProyek"), SUMBER.proyek, (x) => { teksProyek.value = x.nama; nil.value = x.id; });
    teksProyek.addEventListener("input", () => { nil.value = ""; });
  }
}
function kirimRw() {
  const { jenis, id } = Z.rw, isi = {};
  for (const [k, tipe, , wajib] of BIDANG[jenis]) {
    const v = nilai(`rw-${k}`);
    if (wajib && !v) { const e = new GalatApi("salah-masukan", 422); e.pesanSendiri = t("pf.err.wajib"); throw e; }
    isi[k] = tipe === "angka" ? (v === "" ? null : Number(v)) : v;
  }
  return api(id ? `/api/profil/saya/riwayat/${id}` : "/api/profil/saya/riwayat", { metode: id ? "PUT" : "POST", badan: { jenis, isi } });
}
async function hapusRw(b) {
  b.disabled = true;
  try { await api(`/api/profil/saya/riwayat/${Z.rw.id}`, { metode: "DELETE" }); dlg.close(); await muat(); segar(); } catch (e) { galatDlg(galatTeks(e.kode)); b.disabled = false; }
}

/* --- Privasi (simpan seketika per pilihan) --- */
function bukaPrivasi() {
  const pv = S.p.privasi || {};
  const baris = BAGIAN.map(([k, ik]) => `<div class="pf-priv" role="group" aria-labelledby="pvl-${k}"><div class="pf-priv-t"><span class="pf-priv-ik">${ikon(ik, 18)}</span><span><b id="pvl-${k}">${esc(t("pf.priv." + k))}</b><small>${esc(t("pf.priv." + k + ".d"))}</small></span></div>
      <div class="pf-seg" role="radiogroup">${["semua", "admin"].map((v) => `<label class="pf-seg-o"><input type="radio" name="pv-${k}" value="${v}" data-bagian="${k}"${pv[k] === v ? " checked" : ""}><span>${esc(t("pf.priv.o_" + v))}</span></label>`).join("")}</div></div>`).join("");
  buka({ judul: t("pf.tab.privasi"), ik: "kunci", form: "privasi", kaki: "tutup", isi: `<p class="pf-bantu pf-bantu-atas">${esc(t("pf.priv.ket"))}</p><div class="pf-priv-daftar">${baris}</div>` });
}
async function simpanPrivasi(bagian, nil) {
  S.p.privasi = { ...S.p.privasi, [bagian]: nil };
  try { await api("/api/profil/saya", { metode: "PUT", badan: { privasi: { [bagian]: nil } } }); $("psDlgPesan").innerHTML = pesanHtml("ok", t("pf.priv.tersimpan")); }
  catch (e) { galatDlg(galatTeks(e.kode)); }
}

/* --- Keamanan --- */
function bukaKeamanan() {
  const surel = esc(S.p.kontak?.surel || "");
  const sandi = (id, kunci, ac) => medan(id, kunci, "kunci", `<input class="jm-isian" id="${id}" type="password" autocomplete="${ac}" maxlength="128">`);
  buka({ judul: t("pf.tab.keamanan"), ik: "perisai", form: "sandi", isi: `<input type="text" name="username" autocomplete="username" value="${surel}" tabindex="-1" aria-hidden="true" hidden>
    <div class="ps-grid">${sandi("sLama", "pf.sandi.lama", "current-password")}${sandi("sBaru", "pf.sandi.baru", "new-password")}${sandi("sUlang", "pf.sandi.ulang", "new-password")}</div>
    <p class="pf-bantu">${esc(t("pf.sandi.aturan"))}</p>
    <h3 class="ps-sub">${ikon("bahasa", 18)}<span>${esc(t("pf.sesi.judul"))}</span></h3><div id="pfSesi">${hantuHtml(2)}</div>` });
  muatSesi();
}
const IK_PERANGKAT = { desktop: "laptop", ponsel: "ponsel", tablet: "tablet" };
// "Jakarta, DKI Jakarta, Indonesia, masuk 8 Nov 2026 pukul 00.53 WIB" (tanpa titik tengah); jam pakai titik di bahasa Indonesia.
const barisSesi = (s) => {
  const tempat = [s.kota, s.wilayah, s.negara_nama || s.negara].filter(Boolean).join(", ");
  const waktu = t("pf.sesi.masuk", { tgl: tanggal(tanggalDariUnix(s.dibuat)), jam: bahasa() === "id" ? jam(s.dibuat).replace(":", ".") : jam(s.dibuat) });
  return tempat ? `${tempat}, ${waktu.charAt(0).toLowerCase()}${waktu.slice(1)}` : waktu;
};
async function muatSesi() {
  const el = $("pfSesi");
  try {
    const sesi = (await api("/api/profil/saya/sesi")).sesi, lain = sesi.filter((s) => !s.ini).length;
    if (!$("pfSesi")) return;
    el.innerHTML = `<ul class="pf-sesi">${sesi.map((s) => `<li><span class="pf-sesi-ik">${ikon(IK_PERANGKAT[s.jenis] || "laptop", 18)}</span><span><b>${esc(s.perangkat || t("pf.sesi.tak_dikenal"))}</b><small>${esc(barisSesi(s))}</small></span>${s.ini ? `<span class="jm-pil jm-pil-ok">${esc(t("pf.sesi.aktif"))}</span>` : `<button type="button" class="jm-tbl jm-tbl-kecil" data-aksi="keluar-satu" data-sid="${esc(s.sid)}" title="${esc(t("pf.sesi.keluarkan"))}">${ikon("keluar", 16)}<span>${esc(t("pf.sesi.keluarkan"))}</span></button>`}</li>`).join("")}</ul>
      <button type="button" class="jm-tbl ps-lebar" data-aksi="keluar-lain"${lain ? "" : " disabled"}>${ikon("keluar", 18)}<span>${esc(t("pf.sesi.keluar_lain"))}</span></button>`;
  } catch (e) { if (el) el.innerHTML = pesanHtml("galat", galatTeks(e.kode)); }
}
async function kirimSandi() {
  const lama = $("sLama").value, baru = $("sBaru").value, ulang = $("sUlang").value;
  const salah = (m) => { const e = new GalatApi("salah-masukan", 422); e.pesanSendiri = m; throw e; };
  if (!lama) salah(t("pf.sandi.err_lama"));
  if (baru.length < 12 || baru.length > 128) salah(t("pf.sandi.err_panjang"));
  if (baru !== ulang) salah(t("pf.sandi.err_beda"));
  await api("/api/ganti-sandi", { metode: "POST", badan: { lama, baru } });
}

/* --- Foto: klik foto bulat, pilih berkas, potong di dialog --- */
function bukaCrop(file) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return pesan("galat", t("pf.foto.tipe"));
  if (file.size > MAKS_FOTO_SUMBER) return pesan("galat", t("pf.foto.besar"));
  const url = URL.createObjectURL(file), im = new Image();
  im.onload = () => {
    URL.revokeObjectURL(url);
    const dasar = 300 / Math.min(im.width, im.height);
    S.crop = { img: im, zoom: 1, ox: (300 - im.width * dasar) / 2, oy: (300 - im.height * dasar) / 2 };
    buka({ judul: t("pf.foto.judul"), ik: "kamera", form: "foto", isi: `<div class="ps-potong"><canvas id="cvFoto" width="300" height="300" role="img" aria-label="${esc(t("pf.foto.pratinjau"))}"></canvas>
      <div class="ps-potong-k"><label for="zoomFoto">${esc(t("pf.foto.zoom"))}</label><input type="range" id="zoomFoto" min="1" max="4" step="0.01" value="1"><p class="pf-bantu">${esc(t("pf.foto.geser"))}</p>
      ${S.p.foto ? `<button type="button" class="jm-tbl jm-tbl-bahaya" data-aksi="hapus-foto">${ikon("silang", 18)}<span>${esc(t("pf.foto.hapus"))}</span></button>` : ""}</div></div>` });
    gambarCrop($("cvFoto")); pasangCrop();
  };
  im.onerror = () => { URL.revokeObjectURL(url); pesan("galat", t("pf.foto.tipe")); };
  im.src = url;
}
function gambarCrop(cv, ukuran = 300) {
  const c = S.crop, g = cv.getContext("2d"), im = c.img, dasar = ukuran / Math.min(im.width, im.height), sk = dasar * c.zoom;
  const w = im.width * sk, h = im.height * sk;
  c.ox = Math.min(0, Math.max(ukuran - w, c.ox)); c.oy = Math.min(0, Math.max(ukuran - h, c.oy));
  g.clearRect(0, 0, ukuran, ukuran); g.drawImage(im, c.ox, c.oy, w, h);
}
function pasangCrop() {
  const cv = $("cvFoto");
  let seret = null;
  cv.addEventListener("pointerdown", (e) => { seret = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener("pointermove", (e) => {
    if (!seret) return;
    const k = 300 / cv.getBoundingClientRect().width;
    S.crop.ox += (e.clientX - seret[0]) * k; S.crop.oy += (e.clientY - seret[1]) * k; seret = [e.clientX, e.clientY]; gambarCrop(cv);
  });
  cv.addEventListener("pointerup", () => { seret = null; });
  $("zoomFoto").addEventListener("input", (e) => {
    const c = S.crop, lama = c.zoom, baru = Number(e.target.value), pusat = 150;
    c.ox = pusat - ((pusat - c.ox) / lama) * baru; c.oy = pusat - ((pusat - c.oy) / lama) * baru; c.zoom = baru; gambarCrop(cv);
  });
}
async function kirimFoto() {
  const kecil = document.createElement("canvas"); kecil.width = kecil.height = UKURAN_FOTO;
  const c = S.crop, k = UKURAN_FOTO / 300, g = kecil.getContext("2d");
  const dasar = 300 / Math.min(c.img.width, c.img.height) * c.zoom;
  g.drawImage(c.img, c.ox * k, c.oy * k, c.img.width * dasar * k, c.img.height * dasar * k);
  const blob = await new Promise((res) => kecil.toBlob(res, "image/webp", 0.85));
  if (!blob) throw new GalatApi("masukan_salah", 422);
  const r = await fetch("/api/profil/saya/foto", { method: "POST", credentials: "same-origin", headers: { "x-pb": "1", "content-type": blob.type }, body: blob });
  if (!r.ok) throw new GalatApi(r.status === 413 ? "terlalu-besar" : r.status === 415 ? "masukan_salah" : r.status === 429 ? "terlalu-sering" : "umum", r.status);
  S.crop = null;
}
async function hapusFoto() {
  try { await api("/api/profil/saya/foto", { metode: "DELETE" }); if (dlg.open) dlg.close(); await muat(); segarkanAvatar(false, S.p.nama); segar(); pesan("ok", t("pf.foto.dihapus")); }
  catch (e) { pesan("galat", galatTeks(e.kode)); }
}

/* ---------- kolom bersaran (sumber dimuat malas: organisasi 430 KB, proyek 390 KB; hasil dibatasi 8 baris) ---------- */
const SUMBER = {
  org: async () => (S.orgs ??= fetch("/data/organisasi.json").then((r) => r.json()).then((j) => j.baris.map((x) => ({ id: x.id, nama: x.nama }))).catch(() => [])),
  proyek: async () => (S.proyek ??= fetch("/data/proyek.json").then((r) => r.json()).then((j) => j.baris.map((x) => ({ id: x.id, nama: namaProyek(x) }))).catch(() => [])),
};
function pasangCombo(input, daftarEl, sumber, pilih) {
  let item = [], aktif = -1;
  const tutup = () => { daftarEl.hidden = true; input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant"); aktif = -1; };
  const gambar = () => {
    daftarEl.innerHTML = item.map((x, i) => `<li role="option" id="${daftarEl.id}-${i}" data-i="${i}" aria-selected="${i === aktif}">${esc(x.nama)}</li>`).join("");
    daftarEl.hidden = !item.length; input.setAttribute("aria-expanded", String(!!item.length));
  };
  const cari = debounce(async () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { item = []; return gambar(); }
    const semua = await sumber();
    item = semua.filter((x) => x.nama.toLowerCase().includes(q)).slice(0, 8); aktif = -1; gambar();
  });
  input.addEventListener("input", cari);
  input.addEventListener("focus", () => sumber());
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !daftarEl.hidden) { tutup(); e.stopPropagation(); e.preventDefault(); return; }
    if (!item.length || daftarEl.hidden) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { aktif = (aktif + (e.key === "ArrowDown" ? 1 : -1) + item.length) % item.length; gambar(); input.setAttribute("aria-activedescendant", `${daftarEl.id}-${aktif}`); e.preventDefault(); }
    else if (e.key === "Enter" && aktif >= 0) { pilih(item[aktif]); tutup(); e.preventDefault(); }
  });
  daftarEl.addEventListener("mousedown", (e) => { const li = e.target.closest("li"); if (li) { e.preventDefault(); pilih(item[+li.dataset.i]); tutup(); } });
  input.addEventListener("blur", () => setTimeout(tutup, 100));
}

/* ---------- peristiwa ---------- */
const BUKA = { diri: bukaDiri, bio: bukaBio, ahli: bukaAhli, tautan: bukaTautan, privasi: bukaPrivasi, keamanan: bukaKeamanan };
const KIRIM = { diri: kirimDiri, bio: kirimBio, ahli: kirimAhli, tautan: kirimTautan, riwayat: kirimRw, sandi: kirimSandi, foto: kirimFoto };

async function bagikan() {
  const url = `${location.origin}/anggota/${encodeURIComponent(S.p.id)}`;
  try { if (navigator.share) { await navigator.share({ url, title: $("judul").textContent }); return; } } catch (e) { if (e?.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(url); pesan("ok", t("pf.bagikan.salin")); } catch { pesan("galat", url); }
}

document.addEventListener("click", (e) => {
  if (e.target === dlg) return dlg.close();
  const b = e.target.closest("[data-aksi]");
  if (!b) return;
  const a = b.dataset.aksi;
  if (a === "buka") BUKA[b.dataset.bag]();
  else if (a === "tutup") dlg.close();
  else if (a === "ganti-foto") $("fBerkasFoto").click();
  else if (a === "ganti-sampul") { const i = (sampulIndeks() + 1) % SAMPUL.length; try { localStorage.setItem("jm-sampul", String(i)); } catch { /* abaikan */ } gambarSampul(i); }
  else if (a === "bagikan") bagikan();
  else if (a === "tambah-rw") bukaRw(b.dataset.jenis);
  else if (a === "ubah-rw") bukaRw(b.dataset.jenis, +b.dataset.id);
  else if (a === "hapus-rw") hapusRw(b);
  else if (a === "lepas-org") { Z.org = ""; segarOrg(); }
  else if (a === "toggle-ahli") {
    const k = b.dataset.k, i = Z.ahli.indexOf(k);
    if (i >= 0) Z.ahli.splice(i, 1); else if (Z.ahli.length < MAKS_KEAHLIAN) Z.ahli.push(k);
    gambarChip();
  }
  else if (a === "tambah-ahli") tambahAhli($("fAhliBaru").value);
  else if (a === "hapus-foto") hapusFoto();
  else if (a === "keluar-satu") {
    if (!confirm(t("pf.sesi.konfirmasi"))) return;
    b.disabled = true;
    api(`/api/profil/saya/sesi/${encodeURIComponent(b.dataset.sid)}`, { metode: "DELETE" }).then(muatSesi).then(() => { $("psDlgPesan").innerHTML = pesanHtml("ok", t("pf.sesi.sukses_satu")); }).catch((er) => { galatDlg(galatTeks(er.kode)); b.disabled = false; });
  }
  else if (a === "keluar-lain") {
    b.disabled = true;
    api("/api/profil/saya/sesi/keluar-lain", { metode: "POST", badan: {} }).then(muatSesi).then(() => { $("psDlgPesan").innerHTML = pesanHtml("ok", t("pf.sesi.sukses")); }).catch((er) => { galatDlg(galatTeks(er.kode)); b.disabled = false; });
  }
});
$("fBerkasFoto").addEventListener("change", (e) => { const f = e.target.files[0]; e.target.value = ""; if (f) bukaCrop(f); });
dlg.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target.dataset.form;
  if (KIRIM[f]) kirim(KIRIM[f]);
});
dlg.addEventListener("input", (e) => {
  if (e.target.id === "fBio") $("hitBio").textContent = `${e.target.value.length}/${MAKS_BIO}`;
  if (e.target.id === "fInstansi" && Z.org) { Z.org = ""; segarOrg(); }
});
dlg.addEventListener("change", (e) => { if (e.target.dataset?.bagian) simpanPrivasi(e.target.dataset.bagian, e.target.value); });
dlg.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.id === "fAhliBaru") { e.preventDefault(); tambahAhli(e.target.value); } });
dlg.addEventListener("close", () => { S.crop = null; });
document.addEventListener("jm:bahasa", () => { if (S.p) segar(); });

try {
  [S.prov] = await Promise.all([namaProvinsi(), muat()]);
  gambarSampul(); segar();
  const h = location.hash.slice(1);
  if (BUKA[h]) BUKA[h]();
  nanti(muatKenal);
} catch (e) {
  panel.innerHTML = `<div class="jm-galat" role="alert">${ikon("peringatan", 32)}<p>${esc(e.status === 503 ? t("pf.belum_aktif") : galatTeks(e.kode))}</p></div>`;
}
