/* /profil-saya: ubah profil sendiri. Lima tab (Profil, Riwayat, Foto, Privasi, Keamanan), satu API (/api/profil/saya). Server tetap menghakimi semua isian.
   INP: tab berganti seketika (aria-selected dulu), isi tab kecil dan sinkron; daftar organisasi/proyek (besar) dimuat malas hanya saat kolomnya difokuskan. */
import { t, ada, tanggalDariUnix, jam } from "/i18n.js";
import { api, esc, ikon, galatTeks, pesanHtml, hantuHtml, debounce, GalatApi } from "/inti/umum.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { exHtml, pilihHtml } from "/inti/komponen.js";
import { IKON_TEK } from "/inti/ikon_tek.js";
import { namaProyek } from "/inti/nama_proyek.js";
import { segarkanAvatar } from "/inti/akun_menu.js";
import { JENIS, isiKepala, namaProvinsi, pasangFoto, fotoIsi, pilKeahlian, riwayatBaris } from "/profil_tampil.js";

await mulaiHalaman();
pasangFoto();

const TAB = [["profil", "orang"], ["riwayat", "linimasa"], ["foto", "gambar"], ["privasi", "kunci"], ["keamanan", "perisai"]];
const BAGIAN = [["foto", "gambar"], ["pekerjaan", "direktori"], ["lokasi", "lokasi"], ["bio", "info"], ["keahlian", "topik"], ["tautan", "tautan"], ["riwayat", "linimasa"], ["kontak", "surel"]];
const TEK_PRESET = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "penyimpanan", "hidrogen", "nuklir"];
const JENJANG = ["sma", "d3", "d4", "s1", "s2", "s3", "lain"];
const MAKS_KEAHLIAN = 12, MAKS_BIO = 600, MAKS_FOTO_SUMBER = 10 * 1024 * 1024, UKURAN_FOTO = 512;
const IK_JENIS = { pendidikan: "buku", pengalaman: "linimasa", sertifikasi: "perisai", publikasi: "regulasi" };

const panel = document.getElementById("pfPanel"), bilahTab = document.getElementById("pfTab");
const S = { tab: "profil", p: null, prov: [], d: null, edit: null, sesi: null, crop: null, orgs: null, proyek: null };
const tab0 = location.hash.slice(1);
if (TAB.some(([k]) => k === tab0)) S.tab = tab0;

const tx = (k) => `data-i18n="${k}"`;
const pesan = (jenis, teks) => { const el = document.getElementById("pfPesan"); if (el) el.innerHTML = teks ? pesanHtml(jenis, teks) : ""; };
const kartu = (ik, kunci, isi, { id = "", aksi = "" } = {}) => exHtml({ id, ikon: ik, judulHtml: `<span ${tx(kunci)}>${esc(t(kunci))}</span>`, aksiHtml: aksi, isiHtml: isi, tingkat: "h2", kelas: "pf-ex" });
const medan = (id, kunci, isi, bantu = "") => `<div class="jm-medan"><label for="${id}" ${tx(kunci)}>${esc(t(kunci))}</label>${isi}${bantu ? `<small class="pf-bantu">${bantu}</small>` : ""}</div>`;
const teks = (id, nilai, maks, { tipe = "text", ac = "off", mode = "" } = {}) => `<input class="jm-isian" id="${id}" name="${id}" type="${tipe}" maxlength="${maks}" autocomplete="${ac}"${mode ? ` inputmode="${mode}"` : ""} value="${esc(nilai ?? "")}">`;

/* ---------- muat dan kepala ---------- */
async function muat() {
  S.p = await api("/api/profil/saya");
  S.d = {
    gelar: S.p.gelar || "", jabatan: S.p.jabatan || "", instansi: S.p.instansi || "", organisasi_id: S.p.organisasi_id || "", kota: S.p.kota || "", kode_prov: S.p.kode_prov || "",
    bio: S.p.bio || "", keahlian: [...(S.p.keahlian || [])], linkedin: S.p.tautan?.linkedin || "", situs: S.p.tautan?.situs || "", telepon: S.p.kontak?.telepon || "",
  };
  gambarKepala();
}
function gambarKepala() {
  isiKepala(S.p);
  const sub = document.getElementById("pfSub");
  if (sub.hidden) { sub.hidden = false; sub.textContent = t("pf.lead"); }
  document.getElementById("pfLencana").insertAdjacentHTML("beforeend", `<a class="pf-lencana-lihat" href="/anggota/${S.p.id}">${ikon("orang", 16)}<span>${esc(t("pf.lihat_publik"))}</span></a>`);
}

/* ---------- tab ---------- */
function gambarTab() {
  bilahTab.innerHTML = TAB.map(([k, ik]) => `<button type="button" role="tab" id="tab-${k}" data-tab="${k}" aria-selected="${S.tab === k}" aria-controls="pfPanel" tabindex="${S.tab === k ? 0 : -1}">${ikon(ik, 18)}<span ${tx("pf.tab." + k)}>${esc(t("pf.tab." + k))}</span></button>`).join("");
  panel.setAttribute("aria-labelledby", "tab-" + S.tab);
}
function pilihTab(k) {
  S.tab = k; S.edit = null; S.crop = null;
  try { history.replaceState(null, "", "#" + k); } catch { /* abaikan */ }
  for (const b of bilahTab.children) { const on = b.dataset.tab === k; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; }
  panel.setAttribute("aria-labelledby", "tab-" + k);
  gambarPanel();
}
bilahTab.addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) pilihTab(b.dataset.tab); });
bilahTab.addEventListener("keydown", (e) => {
  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
  const i = TAB.findIndex(([k]) => k === S.tab), n = (i + (e.key === "ArrowRight" ? 1 : TAB.length - 1)) % TAB.length;
  pilihTab(TAB[n][0]); bilahTab.children[n].focus(); e.preventDefault();
});

function gambarPanel() {
  panel.innerHTML = ({ profil: htmlProfil, riwayat: htmlRiwayat, foto: htmlFoto, privasi: htmlPrivasi, keamanan: htmlKeamanan })[S.tab]();
  if (S.tab === "keamanan") muatSesi();
}

/* ---------- tab Profil ---------- */
function htmlProfil() {
  const d = S.d, opsiProv = [["", t("pf.f.prov_pilih"), "peta"], ...S.prov.map(([k, n]) => [k, n, "prov:" + k])];
  const ref = d.organisasi_id ? `<a class="pf-taut pf-taut-kecil" href="/o/${encodeURIComponent(d.organisasi_id)}">${ikon("tautan", 14)}<span ${tx("pf.f.org_tertaut")}>${esc(t("pf.f.org_tertaut"))}</span></a> <button type="button" class="pf-lepas" data-aksi="lepas-org">${esc(t("pf.f.org_lepas"))}</button>` : "";
  const keahlian = d.keahlian.map((k, i) => `<span class="pf-pil pf-pil-hapus">${IKON_TEK[k] || ikon("topik", 14)}<span>${esc(ada("pj.tek." + k) ? t("pj.tek." + k) : k)}</span><button type="button" data-aksi="buang-ahli" data-i="${i}" aria-label="${esc(t("pf.f.buang", { nama: ada("pj.tek." + k) ? t("pj.tek." + k) : k }))}">${ikon("silang", 12)}</button></span>`).join("");
  const preset = TEK_PRESET.filter((k) => !d.keahlian.includes(k)).map((k) => `<button type="button" class="pf-saran" data-aksi="tambah-tek" data-k="${k}">${IKON_TEK[k] || ""}<span>${esc(t("pj.tek." + k))}</span></button>`).join("");
  const kiri = kartu("orang", "pf.bag.diri", `
      <div class="pf-grid">
        ${medan("fNama", "pf.f.nama", `<input class="jm-isian" id="fNama" value="${esc(S.p.nama)}" readonly>`, esc(t("pf.f.nama_bantu")))}
        ${medan("fGelar", "pf.f.gelar", teks("fGelar", d.gelar, 40, { ac: "honorific-prefix" }), esc(t("pf.f.gelar_bantu")))}
        ${medan("fJabatan", "pf.f.jabatan", teks("fJabatan", d.jabatan, 120, { ac: "organization-title" }))}
        <div class="jm-medan pf-combo-w"><label for="fInstansi" ${tx("pf.f.instansi")}>${esc(t("pf.f.instansi"))}</label>
          <div class="pf-combo"><input class="jm-isian" id="fInstansi" name="fInstansi" role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="lstOrg" autocomplete="off" maxlength="160" value="${esc(d.instansi)}"><ul class="pf-lst" id="lstOrg" role="listbox" hidden></ul></div>
          <small class="pf-bantu" id="refOrg">${ref || esc(t("pf.f.instansi_bantu"))}</small></div>
        ${medan("fKota", "pf.f.kota", teks("fKota", d.kota, 80, { ac: "address-level2" }))}
        ${medan("fProv", "pf.f.prov", pilihHtml({ id: "fProv", ikon: "peta", label: t("pf.f.prov"), opsi: opsiProv, nilai: d.kode_prov }))}
      </div>
      ${medan("fBio", "pf.f.bio", `<textarea class="jm-isian pf-bio-isi" id="fBio" name="fBio" rows="4" maxlength="${MAKS_BIO}">${esc(d.bio)}</textarea>`, `<span id="hitBio">${d.bio.length}/${MAKS_BIO}</span>`)}`);
  const ahli = kartu("topik", "pf.bag.keahlian", `
      <div class="pf-pils" id="pfAhli">${keahlian || `<span class="pf-kosong" ${tx("pf.f.keahlian_kosong")}>${esc(t("pf.f.keahlian_kosong"))}</span>`}</div>
      <div class="pf-saran-w" aria-label="${esc(t("pf.f.saran"))}">${preset}</div>
      <div class="pf-tambah"><input class="jm-isian" id="fAhliBaru" maxlength="40" autocomplete="off" placeholder="${esc(t("pf.f.ahli_baru"))}" aria-label="${esc(t("pf.f.ahli_baru"))}"><button type="button" class="jm-tbl" data-aksi="tambah-ahli">${ikon("tambah", 18)}<span ${tx("pf.f.tambah")}>${esc(t("pf.f.tambah"))}</span></button></div>`);
  const kontak = kartu("tautan", "pf.bag.kontak_tautan", `
      <div class="pf-grid">
        ${medan("fLinkedin", "pf.f.linkedin", teks("fLinkedin", d.linkedin, 200, { tipe: "url", mode: "url" }), esc(t("pf.f.linkedin_bantu")))}
        ${medan("fSitus", "pf.f.situs", teks("fSitus", d.situs, 200, { tipe: "url", mode: "url" }))}
        ${medan("fTelepon", "pf.f.telepon", teks("fTelepon", d.telepon, 20, { tipe: "tel", ac: "tel", mode: "tel" }), esc(t("pf.f.telepon_bantu")))}
        ${medan("fSurel", "pf.f.surel", `<input class="jm-isian" id="fSurel" value="${esc(S.p.kontak?.surel || "")}" readonly>`, esc(t("pf.f.surel_bantu")))}
      </div>`);
  return `<form id="fProfil" class="pf-form" novalidate>${kiri}${ahli}${kontak}
    <div id="pfPesan" aria-live="polite"></div>
    <div class="pf-bar"><button type="submit" class="jm-tbl jm-tbl-utama" id="simpanProfil">${ikon("centang", 18)}<span ${tx("pf.simpan")}>${esc(t("pf.simpan"))}</span></button></div></form>`;
}

async function simpanProfil() {
  const d = S.d, btn = document.getElementById("simpanProfil");
  btn.disabled = true; btn.setAttribute("aria-busy", "true"); pesan("", "");
  try {
    await api("/api/profil/saya", { metode: "PUT", badan: {
      gelar: d.gelar, jabatan: d.jabatan, instansi: d.instansi, organisasi_id: d.organisasi_id, kota: d.kota, kode_prov: d.kode_prov, bio: d.bio,
      keahlian: d.keahlian, tautan: { linkedin: d.linkedin, situs: d.situs }, telepon: d.telepon } });
    await muat();
    gambarPanel();
    pesan("ok", t("pf.tersimpan"));
  } catch (e) { pesan("galat", galatTeks(e.kode)); btn.disabled = false; btn.removeAttribute("aria-busy"); }
}

/* Kolom bersaran: sumber dimuat malas (organisasi 430 KB, proyek 390 KB), hasil dibatasi 8 baris. */
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
    if (e.key === "Escape") return tutup();
    if (!item.length || daftarEl.hidden) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { aktif = (aktif + (e.key === "ArrowDown" ? 1 : -1) + item.length) % item.length; gambar(); input.setAttribute("aria-activedescendant", `${daftarEl.id}-${aktif}`); e.preventDefault(); }
    else if (e.key === "Enter" && aktif >= 0) { pilih(item[aktif]); tutup(); e.preventDefault(); }
  });
  daftarEl.addEventListener("mousedown", (e) => { const li = e.target.closest("li"); if (li) { e.preventDefault(); pilih(item[+li.dataset.i]); tutup(); } });
  input.addEventListener("blur", () => setTimeout(tutup, 100));
}
function pasangKolomProfil() {
  const inst = document.getElementById("fInstansi");
  if (!inst) return;
  pasangCombo(inst, document.getElementById("lstOrg"), SUMBER.org, (x) => {
    S.d.instansi = x.nama; S.d.organisasi_id = x.id; inst.value = x.nama; segarOrg();
  });
}
function segarOrg() {
  const r = document.getElementById("refOrg");
  if (!r) return;
  r.innerHTML = S.d.organisasi_id
    ? `<a class="pf-taut pf-taut-kecil" href="/o/${encodeURIComponent(S.d.organisasi_id)}">${ikon("tautan", 14)}<span>${esc(t("pf.f.org_tertaut"))}</span></a> <button type="button" class="pf-lepas" data-aksi="lepas-org">${esc(t("pf.f.org_lepas"))}</button>`
    : esc(t("pf.f.instansi_bantu"));
}
function segarAhli() { gambarPanel(); document.getElementById("fAhliBaru")?.focus(); }
function tambahAhli(k) {
  const v = String(k || "").trim().slice(0, 40);
  if (!v || S.d.keahlian.length >= MAKS_KEAHLIAN || S.d.keahlian.some((x) => x.toLowerCase() === v.toLowerCase())) return;
  S.d.keahlian.push(v); segarAhli();
}

/* ---------- tab Riwayat ---------- */
const BIDANG = {
  pendidikan: [["jenjang", "pilih"], ["kampus", "teks", 120, true], ["jurusan", "teks", 120], ["tahun", "angka"]],
  pengalaman: [["jabatan", "teks", 120, true], ["organisasi", "teks", 120, true], ["mulai", "angka", 0, true], ["selesai", "angka"]],
  sertifikasi: [["nama", "teks", 120, true], ["penerbit", "teks", 120], ["tahun", "angka"]],
  publikasi: [["judul", "teks", 160, true], ["tahun", "angka"], ["proyek_id", "proyek"]],
};
function formRiwayat(jenis, awal = {}) {
  const f = BIDANG[jenis].map(([k, tipe, maks, wajib]) => {
    const id = `rw-${k}`, label = `<label for="${id}">${esc(t(`pf.rw.${k}`))}${wajib ? ` <span class="pf-wajib" aria-hidden="true">*</span>` : ""}</label>`;
    if (tipe === "pilih") return `<div class="jm-medan">${label}${pilihHtml({ id, ikon: "tingkat", label: t("pf.rw.jenjang"), opsi: JENJANG.map((j) => [j, t("pf.jenjang." + j)]), nilai: awal[k] || "s1" })}</div>`;
    if (tipe === "angka") return `<div class="jm-medan">${label}<input class="jm-isian" id="${id}" type="number" inputmode="numeric" min="1950" max="2100" value="${esc(awal[k] ?? "")}"${wajib ? " required" : ""}></div>`;
    if (tipe === "proyek") return `<div class="jm-medan pf-combo-w">${label}<div class="pf-combo"><input class="jm-isian" id="${id}-teks" role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="lstProyek" autocomplete="off" maxlength="120" value="${esc(awal.proyek_id || "")}"><ul class="pf-lst" id="lstProyek" role="listbox" hidden></ul></div><small class="pf-bantu">${esc(t("pf.rw.proyek_bantu"))}</small><input type="hidden" id="${id}" value="${esc(awal[k] || "")}"></div>`;
    return `<div class="jm-medan">${label}<input class="jm-isian" id="${id}" maxlength="${maks}" autocomplete="off" value="${esc(awal[k] ?? "")}"${wajib ? " required" : ""}></div>`;
  }).join("");
  return `<form class="pf-rwform" data-jenis="${jenis}" data-id="${awal.id || ""}" novalidate><div class="pf-grid">${f}</div><div id="pfPesanRw" aria-live="polite"></div>
    <div class="pf-bar"><button type="submit" class="jm-tbl jm-tbl-utama jm-tbl-kecil">${esc(t("pf.simpan"))}</button><button type="button" class="jm-tbl jm-tbl-kecil" data-aksi="batal-rw">${esc(t("jm.batal"))}</button></div></form>`;
}
function htmlRiwayat() {
  return `<div class="pf-kisi">${JENIS.map((j) => {
    const daftar = S.p.riwayat?.[j] || [], buka = S.edit?.jenis === j;
    const baris = daftar.map((x) => {
      if (buka && S.edit.id === x.id) return `<li class="pf-rw-edit">${formRiwayat(j, x)}</li>`;
      const [a, b] = riwayatBaris(j, x);
      return `<li><span class="pf-rw-isi"><b>${esc(a)}</b>${b ? `<span>${esc(b)}</span>` : ""}</span><span class="pf-rw-aksi"><button type="button" class="pf-ik" data-aksi="ubah-rw" data-jenis="${j}" data-id="${x.id}" aria-label="${esc(t("pf.ubah"))}" title="${esc(t("pf.ubah"))}">${ikon("ubah", 16)}</button><button type="button" class="pf-ik pf-ik-bahaya" data-aksi="hapus-rw" data-jenis="${j}" data-id="${x.id}" aria-label="${esc(t("pf.hapus"))}" title="${esc(t("pf.hapus"))}">${ikon("silang", 16)}</button></span></li>`;
    }).join("");
    const baru = buka && S.edit.id == null ? `<li class="pf-rw-edit">${formRiwayat(j)}</li>` : "";
    const tombol = daftar.length >= 15 || buka ? "" : `<button type="button" class="jm-tbl jm-tbl-kecil" data-aksi="tambah-rw" data-jenis="${j}">${ikon("tambah", 16)}<span>${esc(t("pf.tambah"))}</span></button>`;
    return kartu(IK_JENIS[j], "pf.jenis." + j, `${daftar.length || baru ? `<ul class="pf-rw">${baris}${baru}</ul>` : `<p class="pf-kosong">${esc(t("pf.riwayat.kosong"))}</p>`}${tombol}`);
  }).join("")}</div><div id="pfPesan" aria-live="polite"></div>`;
}
function pasangFormRiwayat() {
  const teksProyek = document.getElementById("rw-proyek_id-teks");
  if (!teksProyek) return;
  const nilai = document.getElementById("rw-proyek_id");
  SUMBER.proyek().then((semua) => { const n = semua.find((x) => x.id === nilai.value); if (n) teksProyek.value = n.nama; });
  pasangCombo(teksProyek, document.getElementById("lstProyek"), SUMBER.proyek, (x) => { teksProyek.value = x.nama; nilai.value = x.id; });
  teksProyek.addEventListener("input", () => { nilai.value = ""; });
}
async function kirimRiwayat(form) {
  const jenis = form.dataset.jenis, isi = {};
  for (const [k, tipe] of BIDANG[jenis]) {
    const v = document.getElementById(`rw-${k}`)?.value.trim() ?? "";
    isi[k] = tipe === "angka" ? (v === "" ? null : Number(v)) : v;
  }
  const id = form.dataset.id, pesanEl = document.getElementById("pfPesanRw");
  const btn = form.querySelector("[type=submit]"); btn.disabled = true;
  try {
    await api(id ? `/api/profil/saya/riwayat/${id}` : "/api/profil/saya/riwayat", { metode: id ? "PUT" : "POST", badan: { jenis, isi } });
    S.edit = null; await muat(); gambarPanel(); pesan("ok", t("pf.tersimpan"));
  } catch (e) { btn.disabled = false; pesanEl.innerHTML = pesanHtml("galat", e.status === 409 ? t("pf.riwayat.penuh") : galatTeks(e.kode)); }
}

/* ---------- tab Foto ---------- */
function htmlFoto() {
  const ada_ = !!S.p.foto, c = S.crop;
  const kini = `<div class="pf-foto-kini"><span class="pf-foto pf-foto-besar" aria-hidden="true">${fotoIsi(S.p.id, S.p.nama, S.p.foto)}</span>
      <div class="pf-foto-aksi"><label class="jm-tbl jm-tbl-utama" for="fBerkasFoto">${ikon("unduh", 18)}<span ${tx("pf.foto.pilih")}>${esc(t("pf.foto.pilih"))}</span></label>
      <input class="sr" type="file" id="fBerkasFoto" accept="image/png,image/jpeg,image/webp">
      ${ada_ ? `<button type="button" class="jm-tbl" data-aksi="hapus-foto">${ikon("silang", 18)}<span ${tx("pf.foto.hapus")}>${esc(t("pf.foto.hapus"))}</span></button>` : ""}</div></div>
      <p class="pf-bantu" ${tx("pf.foto.bantu")}>${esc(t("pf.foto.bantu"))}</p>`;
  const potong = c ? `<div class="pf-potong"><canvas id="cvFoto" width="300" height="300" role="img" aria-label="${esc(t("pf.foto.pratinjau"))}"></canvas>
      <div class="pf-potong-kontrol"><label for="zoomFoto" ${tx("pf.foto.zoom")}>${esc(t("pf.foto.zoom"))}</label><input type="range" id="zoomFoto" min="1" max="4" step="0.01" value="${c.zoom}"><p class="pf-bantu" ${tx("pf.foto.geser")}>${esc(t("pf.foto.geser"))}</p>
      <div class="pf-bar"><button type="button" class="jm-tbl jm-tbl-utama" data-aksi="unggah-foto" id="unggahFoto">${ikon("centang", 18)}<span ${tx("pf.foto.pakai")}>${esc(t("pf.foto.pakai"))}</span></button><button type="button" class="jm-tbl" data-aksi="batal-foto">${esc(t("jm.batal"))}</button></div></div></div>` : "";
  return `<div class="pf-kisi">${kartu("gambar", "pf.tab.foto", kini + potong)}</div><div id="pfPesan" aria-live="polite"></div>`;
}
function gambarCrop(cv, ukuran = 300) {
  const c = S.crop, g = cv.getContext("2d"), im = c.img, dasar = ukuran / Math.min(im.width, im.height), sk = dasar * c.zoom;
  const w = im.width * sk, h = im.height * sk;
  c.ox = Math.min(0, Math.max(ukuran - w, c.ox)); c.oy = Math.min(0, Math.max(ukuran - h, c.oy));
  g.clearRect(0, 0, ukuran, ukuran); g.drawImage(im, c.ox, c.oy, w, h);
}
function bukaCrop(file) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return pesan("galat", t("pf.foto.tipe"));
  if (file.size > MAKS_FOTO_SUMBER) return pesan("galat", t("pf.foto.besar"));
  const url = URL.createObjectURL(file), im = new Image();
  im.onload = () => {
    URL.revokeObjectURL(url);
    const dasar = 300 / Math.min(im.width, im.height);
    S.crop = { img: im, zoom: 1, ox: (300 - im.width * dasar) / 2, oy: (300 - im.height * dasar) / 2 };
    gambarPanel(); gambarCrop(document.getElementById("cvFoto"));
  };
  im.onerror = () => { URL.revokeObjectURL(url); pesan("galat", t("pf.foto.tipe")); };
  im.src = url;
}
function pasangCrop() {
  const cv = document.getElementById("cvFoto");
  if (!cv) return;
  let seret = null;
  cv.addEventListener("pointerdown", (e) => { seret = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener("pointermove", (e) => {
    if (!seret) return;
    const k = 300 / cv.getBoundingClientRect().width;
    S.crop.ox += (e.clientX - seret[0]) * k; S.crop.oy += (e.clientY - seret[1]) * k; seret = [e.clientX, e.clientY]; gambarCrop(cv);
  });
  cv.addEventListener("pointerup", () => { seret = null; });
  document.getElementById("zoomFoto").addEventListener("input", (e) => {
    const c = S.crop, lama = c.zoom, baru = Number(e.target.value), pusat = 150;
    c.ox = pusat - ((pusat - c.ox) / lama) * baru; c.oy = pusat - ((pusat - c.oy) / lama) * baru; c.zoom = baru; gambarCrop(cv);
  });
}
async function unggahFoto() {
  const btn = document.getElementById("unggahFoto"); btn.disabled = true; btn.setAttribute("aria-busy", "true");
  const kecil = document.createElement("canvas"); kecil.width = kecil.height = UKURAN_FOTO;
  const c = S.crop, k = UKURAN_FOTO / 300, g = kecil.getContext("2d");
  const dasar = 300 / Math.min(c.img.width, c.img.height) * c.zoom;
  g.drawImage(c.img, c.ox * k, c.oy * k, c.img.width * dasar * k, c.img.height * dasar * k);
  const blob = await new Promise((res) => kecil.toBlob(res, "image/webp", 0.85));
  try {
    if (!blob) throw new GalatApi("masukan_salah", 422);
    const r = await fetch("/api/profil/saya/foto", { method: "POST", credentials: "same-origin", headers: { "x-pb": "1", "content-type": blob.type }, body: blob });
    if (!r.ok) throw new GalatApi(r.status === 413 ? "terlalu-besar" : r.status === 415 ? "masukan_salah" : r.status === 429 ? "terlalu-sering" : "umum", r.status);
    S.crop = null; await muat(); segarkanAvatar(true, S.p.nama); gambarPanel(); pesan("ok", t("pf.foto.tersimpan"));
  } catch (e) { btn.disabled = false; btn.removeAttribute("aria-busy"); pesan("galat", galatTeks(e.kode)); }
}
async function hapusFoto() {
  try { await api("/api/profil/saya/foto", { metode: "DELETE" }); await muat(); segarkanAvatar(false, S.p.nama); gambarPanel(); pesan("ok", t("pf.foto.dihapus")); }
  catch (e) { pesan("galat", galatTeks(e.kode)); }
}

/* ---------- tab Privasi ---------- */
function htmlPrivasi() {
  const pv = S.p.privasi || {};
  const baris = BAGIAN.map(([k, ik]) => `<div class="pf-priv" role="group" aria-labelledby="pvl-${k}"><div class="pf-priv-t"><span class="pf-priv-ik">${ikon(ik, 18)}</span><span><b id="pvl-${k}" ${tx("pf.priv." + k)}>${esc(t("pf.priv." + k))}</b><small ${tx("pf.priv." + k + ".d")}>${esc(t("pf.priv." + k + ".d"))}</small></span></div>
      <div class="pf-seg" role="radiogroup">${["semua", "admin"].map((v) => `<label class="pf-seg-o"><input type="radio" name="pv-${k}" value="${v}" data-bagian="${k}"${pv[k] === v ? " checked" : ""}><span ${tx("pf.priv.o_" + v)}>${esc(t("pf.priv.o_" + v))}</span></label>`).join("")}</div></div>`).join("");
  return `<div class="pf-kisi">${kartu("kunci", "pf.tab.privasi", `<p class="pf-bantu pf-bantu-atas" ${tx("pf.priv.ket")}>${esc(t("pf.priv.ket"))}</p><div class="pf-priv-daftar">${baris}</div>`)}</div><div id="pfPesan" aria-live="polite"></div>`;
}
async function simpanPrivasi(bagian, nilai) {
  S.p.privasi = { ...S.p.privasi, [bagian]: nilai };
  try { await api("/api/profil/saya", { metode: "PUT", badan: { privasi: { [bagian]: nilai } } }); pesan("ok", t("pf.priv.tersimpan")); }
  catch (e) { pesan("galat", galatTeks(e.kode)); }
}

/* ---------- tab Keamanan ---------- */
function htmlKeamanan() {
  const sandi = (id, kunci, ac) => `<div class="jm-medan"><label for="${id}" ${tx(kunci)}>${esc(t(kunci))}</label><input class="jm-isian" id="${id}" type="password" autocomplete="${ac}" maxlength="128" required></div>`;
  const surel = esc(S.p.kontak?.surel || "");
  const kolom = sandi("sLama", "pf.sandi.lama", "current-password") + sandi("sBaru", "pf.sandi.baru", "new-password") + sandi("sUlang", "pf.sandi.ulang", "new-password");
  const form = `<form id="fSandi" class="pf-form" novalidate>
      <input type="text" name="username" autocomplete="username" value="${surel}" tabindex="-1" aria-hidden="true" hidden>
      <div class="pf-grid">${kolom}</div>
      <small class="pf-bantu" ${tx("pf.sandi.aturan")}>${esc(t("pf.sandi.aturan"))}</small><div id="pfPesanSandi" aria-live="polite"></div>
      <div class="pf-bar"><button type="submit" class="jm-tbl jm-tbl-utama" id="simpanSandi">${esc(t("pf.sandi.simpan"))}</button></div></form>`;
  const sesi = `<div id="pfSesi">${hantuHtml(2)}</div>`;
  return `<div class="pf-kisi">${kartu("kunci", "pf.sandi.judul", form)}${kartu("bahasa", "pf.sesi.judul", sesi)}</div><div id="pfPesan" aria-live="polite"></div>`;
}
async function muatSesi() {
  const el = document.getElementById("pfSesi");
  try {
    S.sesi = (await api("/api/profil/saya/sesi")).sesi;
    const lain = S.sesi.filter((s) => !s.ini).length;
    el.innerHTML = `<ul class="pf-sesi">${S.sesi.map((s) => `<li><span class="pf-sesi-ik">${ikon("bahasa", 18)}</span><span><b>${esc(s.ini ? t("pf.sesi.ini") : t("pf.sesi.lain"))}</b><small>${esc(t("pf.sesi.masuk", { tgl: tanggalDariUnix(s.dibuat), jam: jam(s.dibuat) }))}</small></span>${s.ini ? `<span class="jm-pil jm-pil-ok">${esc(t("pf.sesi.aktif"))}</span>` : ""}</li>`).join("")}</ul>
      <div class="pf-bar"><button type="button" class="jm-tbl" data-aksi="keluar-lain"${lain ? "" : " disabled"}>${ikon("keluar", 18)}<span>${esc(t("pf.sesi.keluar_lain"))}</span></button></div>`;
  } catch (e) { el.innerHTML = pesanHtml("galat", galatTeks(e.kode)); }
}
async function kirimSandi() {
  const lama = document.getElementById("sLama").value, baru = document.getElementById("sBaru").value, ulang = document.getElementById("sUlang").value;
  const tulis = (j, k) => { document.getElementById("pfPesanSandi").innerHTML = pesanHtml(j, k); };
  if (!lama) return tulis("galat", t("pf.sandi.err_lama"));
  if (baru.length < 12 || baru.length > 128) return tulis("galat", t("pf.sandi.err_panjang"));
  if (baru !== ulang) return tulis("galat", t("pf.sandi.err_beda"));
  const btn = document.getElementById("simpanSandi"); btn.disabled = true;
  try {
    await api("/api/ganti-sandi", { metode: "POST", badan: { lama, baru } });
    gambarPanel(); document.getElementById("pfPesanSandi").innerHTML = pesanHtml("ok", t("pf.sandi.sukses"));
  } catch (e) { btn.disabled = false; tulis("galat", galatTeks(e.kode)); }
}

/* ---------- peristiwa ---------- */
panel.addEventListener("input", (e) => {
  const id = e.target.id, d = S.d;
  if (!d) return;
  const peta = { fGelar: "gelar", fJabatan: "jabatan", fKota: "kota", fBio: "bio", fLinkedin: "linkedin", fSitus: "situs", fTelepon: "telepon" };
  if (peta[id]) d[peta[id]] = e.target.value;
  if (id === "fBio") document.getElementById("hitBio").textContent = `${e.target.value.length}/${MAKS_BIO}`;
  if (id === "fInstansi") { d.instansi = e.target.value; if (d.organisasi_id) { d.organisasi_id = ""; segarOrg(); } }
});
panel.addEventListener("change", (e) => {
  if (e.target.id === "fProv") S.d.kode_prov = e.target.value;
  else if (e.target.id === "fBerkasFoto" && e.target.files[0]) bukaCrop(e.target.files[0]);
  else if (e.target.dataset?.bagian) simpanPrivasi(e.target.dataset.bagian, e.target.value);
});
panel.addEventListener("submit", (e) => {
  e.preventDefault();
  if (e.target.id === "fProfil") simpanProfil();
  else if (e.target.id === "fSandi") kirimSandi();
  else if (e.target.classList.contains("pf-rwform")) kirimRiwayat(e.target);
});
panel.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.id === "fAhliBaru") { e.preventDefault(); tambahAhli(e.target.value); } });
panel.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-aksi]");
  if (!b) return;
  const a = b.dataset.aksi;
  if (a === "lepas-org") { S.d.organisasi_id = ""; segarOrg(); }
  else if (a === "tambah-tek") tambahAhli(b.dataset.k);
  else if (a === "tambah-ahli") tambahAhli(document.getElementById("fAhliBaru").value);
  else if (a === "buang-ahli") { S.d.keahlian.splice(+b.dataset.i, 1); segarAhli(); }
  else if (a === "tambah-rw") { S.edit = { jenis: b.dataset.jenis, id: null }; gambarPanel(); }
  else if (a === "ubah-rw") { S.edit = { jenis: b.dataset.jenis, id: +b.dataset.id }; gambarPanel(); }
  else if (a === "batal-rw") { S.edit = null; gambarPanel(); }
  else if (a === "hapus-rw") {
    b.disabled = true;
    try { await api(`/api/profil/saya/riwayat/${b.dataset.id}`, { metode: "DELETE" }); await muat(); gambarPanel(); } catch (er) { pesan("galat", galatTeks(er.kode)); b.disabled = false; }
  }
  else if (a === "hapus-foto") hapusFoto();
  else if (a === "unggah-foto") unggahFoto();
  else if (a === "batal-foto") { S.crop = null; gambarPanel(); }
  else if (a === "keluar-lain") {
    b.disabled = true;
    try { await api("/api/profil/saya/sesi/keluar-lain", { metode: "POST", badan: {} }); await muatSesi(); pesan("ok", t("pf.sesi.sukses")); } catch (er) { pesan("galat", galatTeks(er.kode)); b.disabled = false; }
  }
});

// Setelah tiap gambar ulang panel: pasang perilaku yang bergantung pada elemen barunya.
function lengkapi() { pasangKolomProfil(); pasangFormRiwayat(); pasangCrop(); }
new MutationObserver(() => lengkapi()).observe(panel, { childList: true });

document.addEventListener("jm:bahasa", () => { gambarTab(); gambarKepala(); gambarPanel(); });

try {
  [S.prov] = await Promise.all([namaProvinsi(), muat()]);
  gambarTab();
  gambarPanel();
} catch (e) {
  panel.innerHTML = `<div class="jm-galat" role="alert">${ikon("peringatan", 32)}<p>${esc(e.status === 503 ? t("pf.belum_aktif") : galatTeks(e.kode))}</p></div>`;
}
