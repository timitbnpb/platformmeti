/* kiriman.js (F65-206..208, F65-213, 214): kiriman pengguna yang ditinjau admin, dipasang di halaman rumahnya.
   pasangLencana(el, { id, nama })    -> /o/<id>: lencana verifikasi organisasi (kirim hanya akun berklaim organisasi itu)
   pasangLaporan(el, { id })          -> /p/<id>: laporan warga atas proyek (akun masuk; tampil sesudah ditinjau, tanpa nama pelapor)
   pasangProyek(el, { id, namaOrg })  -> /p/<id>: foto tonggak + kebutuhan dana proyek itu (kirim hanya akun berklaim organisasi yang disetujui)
   pasangDanaDaftar(el, { namaOrg, namaProyek }) -> /investasi: semua kebutuhan dana yang disetujui
   pasangHijau(el, { namaProv })      -> /pasar-listrik-hijau: formulir minat + agregat per provinsi (n >= ambang)
   pasangUnit(el)                     -> /karbon tab Papan minat: minat beli atau jual REC dan kredit karbon (tanpa transaksi)
   pasangStan(el, { id })             -> detail acara: minat stan pameran (tanpa bayar, tanpa denah)
   pasangFakta(el)                    -> /isu tab Cek fakta: klaim yang sudah diputus redaksi + formulir pengajuan
   Yang tampil ke pengguna lain hanya kiriman berstatus disetujui (dijaga server). Semua teks lewat t(), semua keluaran lewat esc(). */
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon, api, nanti, hantuHtml, galatTeks } from "/inti/umum.js";
import { exHtml, pilihHtml } from "/inti/komponen.js";
import { PROV } from "/inti/prov_singkat.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { REC_TEK, REG_KARBON, SATUAN_UNIT, PUTUSAN } from "/inti/minat_enum.js";

if (!document.querySelector('link[href="/kiriman.css"]')) document.head.insertAdjacentHTML("beforeend", '<link rel="stylesheet" href="/kiriman.css">');

const PIL = { menunggu: ["jm-pil-warn", "jam"], disetujui: ["jm-pil-ok", "centang"], ditolak: ["jm-pil-bad", "silang"], ditarik: ["", "balik"] };
const pilStatus = (s) => `<span class="jm-pil ${PIL[s]?.[0] || ""}">${ikon(PIL[s]?.[1] || "info", 14)}<span>${esc(t("kr.st." + s))}</span></span>`;
const tgl = (u) => tanggal(new Date(u * 1000).toISOString().slice(0, 10));
const uang = (n, mu) => `${mu === "USD" ? "US$" : "Rp"} ${angka(n)}`;
const isian = (id, label, attr = "", tag = "input") => `<label class="kr-f"><span>${esc(label)}</span><${tag} id="${id}" ${attr}>${tag === "textarea" ? "</textarea>" : ""}</label>`;
const pesan = (el, jenis, teks) => { el.hidden = !teks; el.className = "kr-pesan " + (jenis === "ok" ? "kr-pesan-ok" : "kr-pesan-bad"); el.textContent = teks || ""; };
const galatKirim = (e) => t({ 403: "kr.g.klaim", 409: "kr.g.aktif", 413: "kr.g.besar", 415: "kr.g.tipe", 422: "kr.g.isi", 429: "kr.g.laju" }[e.status] || "kr.g.umum");
const aktif = (r) => r.status === "menunggu" || r.status === "disetujui";
const tanpaKlaimHtml = () => `<p class="kr-catatan">${ikon("info", 16)}<span>${esc(t("kr.tanpa_klaim"))} <a href="/portal">${esc(t("kr.ke_portal"))}</a></span></p>`;

/** Daftar kiriman saya (status + alasan + tombol tarik). baris(r) -> teks ringkas satu kiriman. */
const sayaHtml = (jenis, rows, baris) => (rows.length ? `<div class="kr-saya"><h4>${esc(t("kr.saya"))}</h4><ul>${rows.map((r) => `<li><span class="kr-saya-t">${baris(r)}<small>${esc(tgl(r.dibuat))}${r.alasan ? ", " + esc(t("kr.alasan", { a: r.alasan })) : ""}</small></span>${pilStatus(r.status)}${aktif(r) ? `<button type="button" class="jm-tbl jm-tbl-kecil" data-tarik="${jenis}:${r.id}">${ikon("balik", 14)}<span>${esc(t("kr.tarik"))}</span></button>` : ""}</li>`).join("")}</ul></div>` : "");
const pilihOrg = (id, klaim, namaOrg) => (klaim.length > 1 ? `<div class="kr-f"><span>${esc(t("kr.f.org"))}</span>${pilihHtml({ id, ikon: "gedung", label: t("kr.f.org"), opsi: klaim.map((k) => [k, namaOrg(k)]), nilai: klaim[0] })}</div>` : `<input type="hidden" id="${id}" value="${esc(klaim[0])}"><p class="kr-catatan">${ikon("gedung", 16)}<span>${esc(t("kr.atas_nama", { org: namaOrg(klaim[0]) }))}</span></p>`);

/** Pasang penangan tarik pada wadah; ulang() dipanggil sesudah berhasil. */
function pasangTarik(el, ulang) {
  el.addEventListener("click", async (e) => {
    if (e.target.closest("[data-buka-pesan]")) return void document.getElementById("psFab")?.click(); // kontak hanya lewat pesan ke sekretariat
    const b = e.target.closest("[data-tarik]");
    if (!b || !confirm(t("kr.tarik_tanya"))) return;
    b.disabled = true;
    const [jenis, id] = b.dataset.tarik.split(":");
    try { await api(`/api/kiriman/${jenis}/${id}`, { metode: "DELETE" }); nanti(ulang); } catch (x) { b.disabled = false; alert(galatTeks(x.kode)); }
  });
}

/* Gambar dari kamera membawa EXIF dan GPS; server menolaknya. Gambar digambar ulang ke kanvas (paling panjang 1600 px) supaya metadata hilang. */
async function gambarBersih(file) {
  const bmp = await createImageBitmap(file), skala = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = Object.assign(document.createElement("canvas"), { width: Math.round(bmp.width * skala), height: Math.round(bmp.height * skala) });
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((ok, gagal) => c.toBlob((b) => (b ? ok(b) : gagal(new Error("kanvas"))), "image/webp", 0.85));
}

/* ---------------- /p/<id>: foto tonggak + kebutuhan dana ---------------- */
export async function pasangProyek(el, { id, namaOrg = (x) => x }) {
  const pid = encodeURIComponent(id);
  async function gambar() {
    let saya, foto, dana;
    try { [saya, foto, dana] = await Promise.all([api("/api/kiriman/saya"), api(`/api/proyek/${pid}/foto`), api("/api/proyek-dana")]); }
    catch (e) { el.innerHTML = e.kode === "fitur_belum_aktif" ? "" : `<p class="kr-pesan kr-pesan-bad" role="alert">${esc(galatTeks(e.kode))}</p>`; return; }
    const klaim = saya.klaim, danaIni = dana.baris.filter((d) => d.proyek_id === id);
    const fotoSaya = saya.foto.filter((r) => r.proyek_id === id), danaSaya = saya.dana.filter((r) => r.proyek_id === id);
    const galeri = foto.baris.length
      ? `<ul class="kr-galeri">${foto.baris.map((f) => `<li><figure><a href="/api/proyek-foto/${f.id}" target="_blank" rel="noopener"><img src="/api/proyek-foto/${f.id}" alt="${esc(f.keterangan)}" loading="lazy" decoding="async" width="320" height="240"></a><figcaption><b>${esc(f.keterangan)}</b><small>${esc(t("kr.foto.oleh", { org: namaOrg(f.organisasi_id), tgl: tgl(f.dibuat) }))}</small></figcaption></figure></li>`).join("")}</ul>`
      : `<p class="kr-kosong">${ikon("gambar", 20)}<span>${esc(t("kr.foto.kosong"))}</span></p>`;
    const formFoto = klaim.length ? `<form id="krFotoF" class="kr-form" novalidate>${pilihOrg("krFotoOrg", klaim, namaOrg)}
      ${isian("krFotoB", t("kr.f.berkas"), 'type="file" accept="image/png,image/jpeg,image/webp" required')}${isian("krFotoK", t("kr.f.keterangan"), 'type="text" maxlength="300" required')}
      <p class="kr-catatan">${ikon("info", 16)}<span>${esc(t("kr.foto.aturan"))}</span></p><p id="krFotoP" class="kr-pesan" role="status" hidden></p>
      <button type="submit" class="jm-tbl jm-tbl-utama">${ikon("tambah", 16)}<span>${esc(t("kr.foto.kirim"))}</span></button></form>` : tanpaKlaimHtml();
    const daftarDana = danaIni.length
      ? `<ul class="kr-dana">${danaIni.map((d) => `<li><span class="kr-dana-n"><b>${esc(uang(d.jumlah, d.mata_uang))}</b><span class="jm-pil">${esc(t("kr.dana.jenis." + d.jenis))}</span></span><p>${esc(d.uraian)}</p><small>${esc(t("kr.dana.klaim", { org: namaOrg(d.organisasi_id), tgl: tgl(d.dibuat) }))}</small><button type="button" class="jm-tbl jm-tbl-kecil" data-buka-pesan>${ikon("surel", 14)}<span>${esc(t("kr.dana.hubungi"))}</span></button></li>`).join("")}</ul>`
      : `<p class="kr-kosong">${ikon("kartu", 20)}<span>${esc(t("kr.dana.kosong"))}</span></p>`;
    const formDana = klaim.length ? (danaSaya.some(aktif) ? "" : `<form id="krDanaF" class="kr-form" novalidate>${pilihOrg("krDanaOrg", klaim, namaOrg)}
      <div class="kr-dua">${isian("krDanaJ", t("kr.f.jumlah"), 'type="number" inputmode="numeric" min="1" step="1" required')}<div class="kr-f"><span>${esc(t("kr.f.mata_uang"))}</span>${pilihHtml({ id: "krDanaM", ikon: "tag", label: t("kr.f.mata_uang"), opsi: [["IDR", t("kr.mu.IDR")], ["USD", t("kr.mu.USD")]], nilai: "IDR" })}</div></div>
      <div class="kr-f"><span>${esc(t("kr.f.jenis"))}</span>${pilihHtml({ id: "krDanaT", ikon: "kartu", label: t("kr.f.jenis"), opsi: ["ekuitas", "utang", "hibah", "campuran"].map((j) => [j, t("kr.dana.jenis." + j)]), nilai: "ekuitas" })}</div>
      ${isian("krDanaU", t("kr.f.uraian"), 'rows="3" maxlength="600" required', "textarea")}
      <p class="kr-catatan">${ikon("info", 16)}<span>${esc(t("kr.dana.aturan"))}</span></p><p id="krDanaP" class="kr-pesan" role="status" hidden></p>
      <button type="submit" class="jm-tbl jm-tbl-utama">${ikon("surel", 16)}<span>${esc(t("kr.dana.kirim"))}</span></button></form>`) : tanpaKlaimHtml();
    el.innerHTML = exHtml({ id: "kr-foto", ikon: "gambar", topik: t("kr.foto.ey"), judulHtml: esc(t("kr.foto.j", { n: angka(foto.baris.length) })), subHtml: esc(t("kr.foto.sub")),
      isiHtml: galeri + sayaHtml("foto", fotoSaya, (r) => `<b>${esc(r.keterangan)}</b>`) + formFoto })
      + exHtml({ id: "kr-dana", ikon: "kartu", topik: t("kr.dana.ey"), judulHtml: esc(t("kr.dana.j", { n: angka(danaIni.length) })), subHtml: esc(t("kr.dana.sub")),
        isiHtml: `<p class="kr-catatan kr-penafian">${ikon("peringatan", 16)}<span>${esc(t("kr.dana.penafian"))}</span></p>` + daftarDana + sayaHtml("dana", danaSaya, (r) => `<b>${esc(uang(r.jumlah, r.mata_uang))}</b> ${esc(t("kr.dana.jenis." + r.jenis))}`) + formDana });
  }
  el.innerHTML = hantuHtml(3);
  pasangTarik(el, gambar);
  el.addEventListener("submit", async (e) => {
    const f = e.target, $ = (i) => el.querySelector("#" + i);
    if (f.id !== "krFotoF" && f.id !== "krDanaF") return;
    e.preventDefault();
    const tbl = f.querySelector("button[type=submit]"), p = $(f.id === "krFotoF" ? "krFotoP" : "krDanaP");
    tbl.disabled = true; pesan(p, "ok", t("kr.mengirim")); // chrome langsung; kerja berat sesudahnya
    try {
      if (f.id === "krFotoF") {
        const file = $("krFotoB").files[0], ket = $("krFotoK").value.trim();
        if (!file || ket.length < 3) throw Object.assign(new Error("isi"), { status: 422 });
        const blob = await gambarBersih(file).catch(() => { throw Object.assign(new Error("tipe"), { status: 415 }); });
        const r = await fetch(`/api/proyek/${pid}/foto?organisasi=${encodeURIComponent($("krFotoOrg").value)}&keterangan=${encodeURIComponent(ket)}`, { method: "POST", credentials: "same-origin", headers: { "x-pb": "1", "content-type": "application/octet-stream" }, body: blob });
        if (!r.ok) throw Object.assign(new Error("kirim"), { status: r.status });
      } else {
        await api(`/api/proyek/${pid}/dana`, { metode: "POST", badan: { organisasi_id: $("krDanaOrg").value, jumlah: Math.round(+$("krDanaJ").value), mata_uang: $("krDanaM").value, jenis: $("krDanaT").value, uraian: $("krDanaU").value } });
      }
      await gambar();
      const baru = $(f.id === "krFotoF" ? "krFotoP" : "krDanaP") || el.querySelector(f.id === "krFotoF" ? "#kr-foto .kr-saya" : "#kr-dana .kr-saya");
      if (baru?.classList.contains("kr-pesan")) pesan(baru, "ok", t("kr.terkirim"));
    } catch (x) { tbl.disabled = false; pesan(p, "bad", galatKirim(x)); }
  });
  document.addEventListener("jm:bahasa", gambar);
  await gambar();
}

/* ---------------- /investasi: semua kebutuhan dana yang disetujui ---------------- */
export async function pasangDanaDaftar(el, { namaOrg, namaProyek } = {}) {
  let d;
  try { d = await api("/api/proyek-dana"); } catch (e) { el.innerHTML = ""; return; }
  const baris = d.baris;
  // nama organisasi dan proyek hanya dimuat bila ada baris untuk ditampilkan (kedua berkas besar)
  const peta = async (nama) => (baris.length ? fetch(`/data/${nama}.json`).then((r) => r.json()).then((o) => new Map(o.baris.map((x) => [x.id, x.nama]))).catch(() => new Map()) : new Map());
  if (!namaOrg) { const m = await peta("organisasi"); namaOrg = (id) => m.get(id) || id; }
  if (!namaProyek) { const m = await peta("proyek"); namaProyek = (id) => m.get(id) || id; }
  const gambar = () => { el.innerHTML = exHtml({ id: "kr-dana-semua", ikon: "kartu", topik: t("kr.dana.ey"), judulHtml: esc(t("kr.dana.semua.j", { n: angka(baris.length) })), subHtml: esc(t("kr.dana.semua.sub")),
    isiHtml: `<p class="kr-catatan kr-penafian">${ikon("peringatan", 16)}<span>${esc(t("kr.dana.penafian"))}</span></p>` + (baris.length
      ? `<div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr>${["proyek", "org", "jumlah", "jenis", "uraian", "tgl"].map((k) => `<th scope="col">${esc(t("kr.dana.c." + k))}</th>`).join("")}</tr></thead><tbody>${baris.slice(0, 50).map((r) => `<tr>
        <td data-l="${esc(t("kr.dana.c.proyek"))}"><a href="/p/${encodeURIComponent(r.proyek_id)}#kr-dana">${esc(namaProyek(r.proyek_id))}</a></td><td data-l="${esc(t("kr.dana.c.org"))}"><a href="/o/${encodeURIComponent(r.organisasi_id)}">${esc(namaOrg(r.organisasi_id))}</a></td>
        <td class="jm-num" data-l="${esc(t("kr.dana.c.jumlah"))}"><b>${esc(uang(r.jumlah, r.mata_uang))}</b></td><td data-l="${esc(t("kr.dana.c.jenis"))}">${esc(t("kr.dana.jenis." + r.jenis))}</td>
        <td data-l="${esc(t("kr.dana.c.uraian"))}">${esc(r.uraian)}</td><td class="jm-nowrap" data-l="${esc(t("kr.dana.c.tgl"))}">${esc(tgl(r.dibuat))}</td></tr>`).join("")}</tbody></table></div>`
      : `<p class="kr-kosong">${ikon("kartu", 20)}<span>${esc(t("kr.dana.semua.kosong"))}</span></p>`) }); };
  document.addEventListener("jm:bahasa", gambar);
  gambar();
}

/* ---------------- /pasar-listrik-hijau: minat + agregat ---------------- */
export async function pasangHijau(el, { namaProv = (k) => PROV[k]?.[0] || k } = {}) {
  async function gambar() {
    let ag, saya;
    try { [ag, saya] = await Promise.all([api("/api/permintaan-hijau"), api("/api/kiriman/saya")]); }
    catch (e) { el.innerHTML = e.kode === "fitur_belum_aktif" ? "" : `<p class="kr-pesan kr-pesan-bad" role="alert">${esc(galatTeks(e.kode))}</p>`; return; }
    const milik = saya.hijau, adaAktif = milik.some(aktif);
    const agregat = ag.baris.length
      ? `<div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr>${["prov", "n", "mwh"].map((k) => `<th scope="col">${esc(t("kr.hijau.c." + k))}</th>`).join("")}</tr></thead><tbody>${ag.baris.map((r) => `<tr><td data-l="${esc(t("kr.hijau.c.prov"))}">${esc(namaProv(r.prov))}</td><td class="jm-num" data-l="${esc(t("kr.hijau.c.n"))}">${esc(angka(r.n))}</td><td class="jm-num" data-l="${esc(t("kr.hijau.c.mwh"))}"><b>${esc(r.mwh_maks == null ? t("kr.hijau.lebih", { a: angka(r.mwh_min) }) : t("kr.hijau.rentang", { a: angka(r.mwh_min), b: angka(r.mwh_maks) }))}</b> <small>MWh</small></td></tr>`).join("")}</tbody></table></div><p class="kr-catatan">${ikon("info", 16)}<span>${esc(t("kr.hijau.rentang_ket"))}</span></p>`
      : `<p class="kr-kosong">${ikon("info", 20)}<span>${esc(t("kr.hijau.kosong", { n: ag.ambang }))}</span></p>`;
    const form = adaAktif ? "" : `<form id="krHijauF" class="kr-form" novalidate>${isian("krHijauN", t("kr.f.perusahaan"), 'type="text" maxlength="120" required')}
      <div class="kr-f"><span>${esc(t("kr.f.prov"))}</span>${pilihHtml({ id: "krHijauP", ikon: "wilayah", label: t("kr.f.prov"), opsi: [["", t("kr.f.prov_pilih")], ...Object.entries(PROV).map(([k, v]) => [k, v[0]]).sort((a, b) => a[1].localeCompare(b[1], "id"))], nilai: "" })}</div>
      <div class="kr-dua">${isian("krHijauM", t("kr.f.mwh"), 'type="number" inputmode="numeric" min="1" step="1" required')}${isian("krHijauT", t("kr.f.tahun"), 'type="number" inputmode="numeric" min="2000" max="2100" step="1" required')}</div>
      ${isian("krHijauC", t("kr.f.catatan"), 'rows="2" maxlength="500"', "textarea")}
      <p class="kr-catatan">${ikon("kunci", 16)}<span>${esc(t("kr.hijau.aturan", { n: ag.ambang }))}</span></p><p id="krHijauPs" class="kr-pesan" role="status" hidden></p>
      <button type="submit" class="jm-tbl jm-tbl-utama">${ikon("surel", 16)}<span>${esc(t("kr.hijau.kirim"))}</span></button></form>`;
    el.innerHTML = exHtml({ id: "kr-hijau", ikon: "petir", topik: t("kr.hijau.ey"), judulHtml: esc(t("kr.hijau.j")), subHtml: esc(t("kr.hijau.sub", { n: ag.ambang })),
      isiHtml: `<div class="kr-belah"><div><h4>${esc(t("kr.hijau.agregat"))}</h4>${agregat}</div><div>${sayaHtml("hijau", milik, (r) => `<b>${esc(r.perusahaan)}</b> ${esc(namaProv(r.prov))}, ${esc(angka(r.mwh_tahun))} MWh`)}${form}</div></div>` });
  }
  el.innerHTML = hantuHtml(3);
  pasangTarik(el, gambar);
  el.addEventListener("submit", async (e) => {
    if (e.target.id !== "krHijauF") return;
    e.preventDefault();
    const $ = (i) => el.querySelector("#" + i), tbl = e.target.querySelector("button[type=submit]"), p = $("krHijauPs");
    tbl.disabled = true; pesan(p, "ok", t("kr.mengirim"));
    try {
      const catatan = $("krHijauC").value.trim();
      await api("/api/permintaan-hijau", { metode: "POST", badan: { perusahaan: $("krHijauN").value, prov: $("krHijauP").value, mwh_tahun: Math.round(+$("krHijauM").value), tahun_mulai: Math.round(+$("krHijauT").value), ...(catatan ? { catatan } : {}) } });
      await gambar();
    } catch (x) { tbl.disabled = false; pesan(p, "bad", galatKirim(x)); }
  });
  document.addEventListener("jm:bahasa", gambar);
  await gambar();
}

/* ---------- F65-213: lencana verifikasi organisasi, dipasang di /o/<id>. Yang tampil hanya lencana yang disetujui admin, dengan tanggal dan peninjau. ---------- */
const IK_LENCANA = { legalitas: "perisai", sertifikat: "medali", proyek: "proyek" };
export async function pasangLencana(el, { id, nama = id }) {
  const oid = encodeURIComponent(id);
  async function gambar() {
    let saya, lc;
    try { [saya, lc] = await Promise.all([api("/api/kiriman/saya"), api(`/api/organisasi/${oid}/lencana`)]); }
    catch (e) { el.innerHTML = e.kode === "fitur_belum_aktif" ? "" : `<p class="kr-pesan kr-pesan-bad" role="alert">${esc(galatTeks(e.kode))}</p>`; return; }
    const boleh = saya.klaim.includes(id), milik = (saya.lencana || []).filter((r) => r.organisasi_id === id);
    const daftar = lc.baris.length
      ? `<ul class="kr-lencana">${lc.baris.map((x) => `<li><span class="kr-lencana-ik">${ikon(IK_LENCANA[x.jenis] || "centang", 20)}</span><span class="kr-saya-t"><b>${esc(t("kr.lc.jenis." + x.jenis))}</b><span>${esc(x.uraian)}</span>
          <small>${esc(t("kr.lc.ditinjau", { tgl: tgl(x.diputus_pada), oleh: x.peninjau || t("kr.lc.admin") }))} <a href="${esc(/^https:\/\//.test(x.bukti_url) ? x.bukti_url : "#")}" target="_blank" rel="noopener noreferrer">${esc(t("kr.lc.bukti"))}</a></small></span></li>`).join("")}</ul>`
      : `<p class="kr-kosong">${ikon("perisai", 20)}<span>${esc(t("kr.lc.kosong"))}</span></p>`;
    const form = boleh ? `<form id="krLcF" class="kr-form" novalidate><div class="kr-f"><span>${esc(t("kr.lc.f.jenis"))}</span>${pilihHtml({ id: "krLcJ", ikon: "perisai", label: t("kr.lc.f.jenis"), opsi: ["legalitas", "sertifikat", "proyek"].map((k) => [k, t("kr.lc.jenis." + k)]), nilai: "legalitas" })}</div>
      ${isian("krLcB", t("kr.lc.f.bukti"), 'type="url" inputmode="url" maxlength="600" placeholder="https://" required')}${isian("krLcU", t("kr.lc.f.uraian"), 'maxlength="400" rows="3" required', "textarea")}
      <p class="kr-catatan">${ikon("info", 16)}<span>${esc(t("kr.lc.aturan"))}</span></p><p id="krLcP" class="kr-pesan" role="status" hidden></p>
      <button type="submit" class="jm-tbl jm-tbl-utama">${ikon("tambah", 16)}<span>${esc(t("kr.lc.kirim"))}</span></button></form>` : "";
    el.innerHTML = exHtml({ id: "kr-lencana", ikon: "perisai", topik: t("kr.lc.ey"), judulHtml: esc(t("kr.lc.j", { n: angka(lc.baris.length), org: nama })), subHtml: esc(t("kr.lc.sub")),
      isiHtml: `<div class="kr-belah"><div>${daftar}</div><div>${sayaHtml("lencana", milik, (r) => `<b>${esc(t("kr.lc.jenis." + r.jenis))}</b> ${esc(r.uraian)}`)}${form}</div></div>` });
  }
  el.addEventListener("submit", async (e) => {
    if (e.target.id !== "krLcF") return;
    e.preventDefault();
    const ps = el.querySelector("#krLcP"), tbl = e.target.querySelector("button[type=submit]");
    tbl.disabled = true;
    try { await api(`/api/organisasi/${oid}/lencana`, { metode: "POST", badan: { jenis: el.querySelector("#krLcJ").value, bukti_url: el.querySelector("#krLcB").value.trim(), uraian: el.querySelector("#krLcU").value } }); nanti(gambar); }
    catch (x) { tbl.disabled = false; pesan(ps, "bad", galatKirim(x)); }
  });
  pasangTarik(el, gambar);
  document.addEventListener("jm:bahasa", gambar);
  await gambar();
}

/* ---------- F65-214: laporan warga atas proyek, dipasang di /p/<id>. Tampil hanya yang sudah ditinjau admin; nama pelapor tidak pernah tampil. ---------- */
export async function pasangLaporan(el, { id }) {
  const pid = encodeURIComponent(id);
  async function gambar() {
    let saya, lp;
    try { [saya, lp] = await Promise.all([api("/api/kiriman/saya"), api(`/api/proyek/${pid}/laporan`)]); }
    catch (e) { el.innerHTML = e.kode === "fitur_belum_aktif" ? "" : `<p class="kr-pesan kr-pesan-bad" role="alert">${esc(galatTeks(e.kode))}</p>`; return; }
    const milik = (saya.laporan || []).filter((r) => r.proyek_id === id), adaAktif = milik.some(aktif);
    const daftar = lp.baris.length
      ? `<ul class="kr-laporan">${lp.baris.map((x) => `<li><p>${esc(x.isi)}</p><small>${esc(t("kr.lp.ditinjau", { tgl: tgl(x.diputus_pada) }))}</small></li>`).join("")}</ul>`
      : `<p class="kr-kosong">${ikon("bendera", 20)}<span>${esc(t("kr.lp.kosong"))}</span></p>`;
    const form = adaAktif ? "" : `<form id="krLpF" class="kr-form" novalidate>${isian("krLpI", t("kr.lp.f.isi"), 'maxlength="1000" rows="5" required', "textarea")}
      <p class="kr-catatan">${ikon("kunci", 16)}<span>${esc(t("kr.lp.aturan"))}</span></p><p id="krLpP" class="kr-pesan" role="status" hidden></p>
      <button type="submit" class="jm-tbl jm-tbl-utama">${ikon("bendera", 16)}<span>${esc(t("kr.lp.kirim"))}</span></button></form>`;
    el.innerHTML = exHtml({ id: "kr-laporan", ikon: "bendera", topik: t("kr.lp.ey"), judulHtml: esc(t("kr.lp.j", { n: angka(lp.baris.length) })), subHtml: esc(t("kr.lp.sub")),
      isiHtml: `<div class="kr-belah"><div>${daftar}</div><div>${sayaHtml("laporan", milik, (r) => esc(r.isi.length > 120 ? r.isi.slice(0, 120) + "..." : r.isi))}${form}</div></div>` });
  }
  el.addEventListener("submit", async (e) => {
    if (e.target.id !== "krLpF") return;
    e.preventDefault();
    const ps = el.querySelector("#krLpP"), tbl = e.target.querySelector("button[type=submit]"), teks = el.querySelector("#krLpI").value.trim();
    if (teks.length < 20) return pesan(ps, "bad", t("kr.lp.pendek"));
    tbl.disabled = true;
    try { await api(`/api/proyek/${pid}/laporan`, { metode: "POST", badan: { isi: teks } }); nanti(gambar); }
    catch (x) { tbl.disabled = false; pesan(ps, "bad", galatKirim(x)); }
  });
  pasangTarik(el, gambar);
  document.addEventListener("jm:bahasa", gambar);
  await gambar();
}

/* ---------- F65-303: papan minat REC dan kredit karbon, dipasang di /karbon. Bukan bursa: tidak ada harga, tidak ada transaksi; volume adalah klaim pengirim. ---------- */
const provOpsi = () => [["", t("kr.f.prov_pilih")], ...Object.entries(PROV).map(([k, v]) => [k, v[0]]).sort((a, b) => a[1].localeCompare(b[1], "id"))];
const rujukanTeks = (jenis, k) => (k ? t((jenis === "rec" ? "pj.tek." : "mu.reg.") + k) : "");
export async function pasangUnit(el) {
  let namaOrg = (x) => x;
  const rujukanOpsi = (jenis) => [["", t("mu.f.rujukan_tanpa")], ...(jenis === "rec" ? REC_TEK : REG_KARBON).map((k) => [k, rujukanTeks(jenis, k)])];
  async function gambar() {
    let d, saya;
    try { [d, saya] = await Promise.all([api("/api/minat-unit"), api("/api/kiriman/saya")]); }
    catch (e) { el.innerHTML = e.kode === "fitur_belum_aktif" ? "" : `<p class="kr-pesan kr-pesan-bad" role="alert">${esc(galatTeks(e.kode))}</p>`; return; }
    const milik = saya.unit || [], klaim = saya.klaim || [];
    if ([...d.baris, ...milik].some((r) => r.organisasi_id) || klaim.length) { // nama organisasi hanya dimuat bila memang ada yang ditampilkan
      const m = await fetch("/data/organisasi.json", { credentials: "same-origin" }).then((r) => r.json()).then((o) => new Map(o.baris.map((x) => [x.id, x.nama]))).catch(() => new Map());
      namaOrg = (id) => m.get(id) || id;
    }
    const vol = (r) => `${angka(r.volume)} ${SATUAN_UNIT[r.jenis]}`;
    const papan = d.baris.length
      ? `<div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr>${["no", "minat", "volume", "prov", "uraian", "org", "aksi"].map((k) => `<th scope="col">${esc(t("mu.c." + k))}</th>`).join("")}</tr></thead><tbody>${d.baris.map((r) => `<tr>
        <td class="jm-nowrap" data-l="${esc(t("mu.c.no"))}">${esc(t("mu.no", { id: r.id }))}</td>
        <td data-l="${esc(t("mu.c.minat"))}"><span class="jm-pil ${r.arah === "beli" ? "jm-pil-ok" : ""}">${ikon(r.arah === "beli" ? "tambah" : "balik", 14)}<span>${esc(t("mu.arah." + r.arah))} ${esc(t("mu.jenis." + r.jenis))}</span></span>${r.rujukan ? `<small>${esc(rujukanTeks(r.jenis, r.rujukan))}</small>` : ""}</td>
        <td class="jm-num" data-l="${esc(t("mu.c.volume"))}"><b>${esc(vol(r))}</b><small>${esc(t("mu.klaim"))}</small></td><td data-l="${esc(t("mu.c.prov"))}">${esc(PROV[r.prov]?.[0] || r.prov)}</td>
        <td data-l="${esc(t("mu.c.uraian"))}">${esc(r.uraian)}<small>${esc(tgl(r.dibuat))}</small></td>
        <td data-l="${esc(t("mu.c.org"))}">${r.organisasi_id ? `<a href="/o/${encodeURIComponent(r.organisasi_id)}">${esc(namaOrg(r.organisasi_id))}</a>` : esc(t("mu.org_tanpa"))}</td>
        <td data-l="${esc(t("mu.c.aksi"))}"><button type="button" class="jm-tbl jm-tbl-kecil" data-buka-pesan>${ikon("surel", 14)}<span>${esc(t("mu.hubungi"))}</span></button></td></tr>`).join("")}</tbody></table></div>`
      : `<p class="kr-kosong">${ikon("info", 20)}<span>${esc(t("mu.kosong"))}</span></p>`;
    const form = `<form id="krUnitF" class="kr-form" novalidate>
      <div class="kr-dua"><div class="kr-f"><span>${esc(t("mu.f.jenis"))}</span>${pilihHtml({ id: "krUnitJ", ikon: "tag", label: t("mu.f.jenis"), opsi: ["rec", "karbon"].map((k) => [k, t("mu.jenis." + k)]), nilai: "rec" })}</div>
        <div class="kr-f"><span>${esc(t("mu.f.arah"))}</span>${pilihHtml({ id: "krUnitA", ikon: "transaksi", label: t("mu.f.arah"), opsi: ["beli", "jual"].map((k) => [k, t("mu.arah." + k)]), nilai: "beli" })}</div></div>
      <div class="kr-dua"><label class="kr-f"><span id="krUnitVL">${esc(t("mu.f.volume", { sat: SATUAN_UNIT.rec }))}</span><input id="krUnitV" type="number" inputmode="numeric" min="1" step="1" required></label>
        <div class="kr-f"><span>${esc(t("mu.f.rujukan"))}</span><span id="krUnitRW">${pilihHtml({ id: "krUnitR", ikon: "daftar", label: t("mu.f.rujukan"), opsi: rujukanOpsi("rec"), nilai: "" })}</span></div></div>
      <div class="kr-f"><span>${esc(t("kr.f.prov"))}</span>${pilihHtml({ id: "krUnitP", ikon: "wilayah", label: t("kr.f.prov"), opsi: provOpsi(), nilai: "" })}</div>
      ${isian("krUnitU", t("mu.f.uraian"), 'rows="3" maxlength="500" required', "textarea")}
      ${klaim.length ? `<label class="kr-cek"><input type="checkbox" id="krUnitT"><span>${esc(t("mu.f.tampil"))}</span></label><div id="krUnitOW" hidden>${pilihOrg("krUnitO", klaim, namaOrg)}</div>` : `<p class="kr-catatan">${ikon("kunci", 16)}<span>${esc(t("mu.tanpa_nama"))}</span></p>`}
      <p class="kr-catatan">${ikon("info", 16)}<span>${esc(t("mu.aturan"))}</span></p><p id="krUnitPs" class="kr-pesan" role="status" hidden></p>
      <button type="submit" class="jm-tbl jm-tbl-utama">${ikon("surel", 16)}<span>${esc(t("mu.kirim"))}</span></button></form>`;
    el.innerHTML = exHtml({ id: "kr-unit", ikon: "transaksi", topik: t("mu.ey"), judulHtml: esc(t("mu.j", { n: angka(d.baris.length) })), subHtml: esc(t("mu.sub")),
      isiHtml: `<p class="kr-catatan kr-penafian">${ikon("peringatan", 16)}<span>${esc(t("mu.penafian"))}</span></p>${papan}<div class="kr-belah"><div>${sayaHtml("unit", milik, (r) => `<b>${esc(t("mu.arah." + r.arah))} ${esc(t("mu.jenis." + r.jenis))}</b> ${esc(vol(r))}`)}</div><div><h4>${esc(t("mu.form"))}</h4>${form}</div></div>` });
  }
  el.innerHTML = hantuHtml(3);
  pasangTarik(el, gambar);
  el.addEventListener("change", (e) => {
    const $ = (i) => el.querySelector("#" + i);
    if (e.target.id === "krUnitJ") { const j = e.target.value; $("krUnitVL").textContent = t("mu.f.volume", { sat: SATUAN_UNIT[j] }); $("krUnitRW").innerHTML = pilihHtml({ id: "krUnitR", ikon: "daftar", label: t("mu.f.rujukan"), opsi: rujukanOpsi(j), nilai: "" }); }
    if (e.target.id === "krUnitT") $("krUnitOW").hidden = !e.target.checked;
  });
  el.addEventListener("submit", async (e) => {
    if (e.target.id !== "krUnitF") return;
    e.preventDefault();
    const $ = (i) => el.querySelector("#" + i), tbl = e.target.querySelector("button[type=submit]"), p = $("krUnitPs");
    tbl.disabled = true; pesan(p, "ok", t("kr.mengirim"));
    try {
      const rujukan = $("krUnitR").value;
      await api("/api/minat-unit", { metode: "POST", badan: { jenis: $("krUnitJ").value, arah: $("krUnitA").value, volume: Math.round(+$("krUnitV").value), prov: $("krUnitP").value, uraian: $("krUnitU").value, ...(rujukan ? { rujukan } : {}), ...($("krUnitT")?.checked ? { organisasi_id: $("krUnitO").value } : {}) } });
      await gambar();
    } catch (x) { tbl.disabled = false; pesan(p, "bad", galatKirim(x)); }
  });
  document.addEventListener("jm:bahasa", gambar);
  await gambar();
}

/* ---------- F65-302: minat stan pameran, dipasang di detail acara yang pengaturannya ada. Tanpa bayar, tanpa denah, tanpa kuota: admin menyetujui atau menolak. ---------- */
export async function pasangStan(el, { id }) {
  async function gambar() {
    let saya;
    try { saya = await api("/api/kiriman/saya"); } catch (e) { el.innerHTML = ""; return; }
    const milik = (saya.stan || []).filter((r) => r.event_id === id);
    const form = milik.some(aktif) ? "" : `<form id="krStanF" class="kr-form" novalidate>${isian("krStanO", t("st.f.organisasi"), 'type="text" maxlength="120" required')}${isian("krStanK", t("st.f.kebutuhan"), 'rows="3" maxlength="500" required', "textarea")}
      <p class="kr-catatan">${ikon("info", 16)}<span>${esc(t("st.aturan"))}</span></p><p id="krStanP" class="kr-pesan" role="status" hidden></p>
      <button type="submit" class="jm-tbl jm-tbl-utama">${ikon("surel", 16)}<span>${esc(t("st.kirim"))}</span></button></form>`;
    el.innerHTML = exHtml({ id: "kr-stan", ikon: "gedung", topik: t("st.ey"), judulHtml: esc(t("st.j")), subHtml: esc(t("st.sub")),
      isiHtml: sayaHtml("stan", milik, (r) => `<b>${esc(r.organisasi)}</b> ${esc(r.kebutuhan)}`) + form });
  }
  pasangTarik(el, gambar);
  el.addEventListener("submit", async (e) => {
    if (e.target.id !== "krStanF") return;
    e.preventDefault();
    const tbl = e.target.querySelector("button[type=submit]"), p = el.querySelector("#krStanP");
    tbl.disabled = true; pesan(p, "ok", t("kr.mengirim"));
    try { await api(`/api/event/${encodeURIComponent(id)}/stan`, { metode: "POST", badan: { organisasi: el.querySelector("#krStanO").value, kebutuhan: el.querySelector("#krStanK").value } }); await gambar(); }
    catch (x) { tbl.disabled = false; pesan(p, "bad", x.status === 404 ? t("st.tanpa_atur") : galatKirim(x)); }
  });
  document.addEventListener("jm:bahasa", gambar);
  await gambar();
}

/* ---------- F65-306: cek fakta klaim energi, dipasang di /isu. Yang tampil hanya klaim yang SUDAH diputus redaksi METI; daftar boleh kosong. Tidak ada putusan otomatis. ---------- */
const PIL_PUTUSAN = { benar: ["jm-pil-ok", "centang"], sebagian: ["jm-pil-warn", "info"], keliru: ["jm-pil-bad", "silang"], tidak_pasti: ["", "tanya"] };
export const putusanHtml = (k) => `<span class="jm-pil ${PIL_PUTUSAN[k]?.[0] || ""}">${ikon(PIL_PUTUSAN[k]?.[1] || "info", 14)}<span>${esc(t("cf.putusan." + (PUTUSAN.includes(k) ? k : "tidak_pasti")))}</span></span>`;
const tautLuar = (u, teks) => (/^https:\/\//.test(u || "") ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(teks)}</a>` : "");
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };
export async function pasangFakta(el) {
  const S = { hal: 1 };
  async function gambar() {
    let d, saya;
    try { [d, saya] = await Promise.all([api("/api/cek-fakta?hal=" + S.hal), api("/api/kiriman/saya")]); }
    catch (e) { el.innerHTML = e.kode === "fitur_belum_aktif" ? "" : `<p class="kr-pesan kr-pesan-bad" role="alert">${esc(galatTeks(e.kode))}</p>`; return; }
    const milik = saya.fakta || [];
    const daftar = d.baris.length
      ? `<ul class="kr-fakta">${d.baris.map((r) => `<li><div class="kr-fakta-k">${putusanHtml(r.putusan)}<small>${esc(t("cf.diputus", { tgl: tgl(r.diputus_pada) }))}</small></div>
          <blockquote>${esc(r.kutipan)}</blockquote><small>${esc(t("cf.penutur", { nama: r.penutur, tgl: tanggal(r.tanggal) }))} ${tautLuar(r.sumber_url, t("cf.sumber_klaim"))}</small>
          <p>${esc(r.penjelasan)}</p><small>${esc(t("cf.sumber_putusan"))} ${(r.sumber || []).map((u) => tautLuar(u, host(u))).filter(Boolean).join(", ")}</small></li>`).join("")}</ul>${paginasiHtml({ hal: S.hal, total: d.total, per: d.per })}`
      : `<p class="kr-kosong">${ikon("info", 20)}<span>${esc(t("cf.kosong"))}</span></p>`;
    const form = `<form id="krFaktaF" class="kr-form" novalidate>${isian("krFaktaK", t("cf.f.kutipan"), 'rows="4" maxlength="600" required', "textarea")}
      <div class="kr-dua">${isian("krFaktaP", t("cf.f.penutur"), 'type="text" maxlength="120" required')}${isian("krFaktaT", t("cf.f.tanggal"), 'type="date" required')}</div>
      ${isian("krFaktaS", t("cf.f.sumber"), 'type="url" inputmode="url" maxlength="600" placeholder="https://" required')}
      <p class="kr-catatan">${ikon("info", 16)}<span>${esc(t("cf.aturan"))}</span></p><p id="krFaktaPs" class="kr-pesan" role="status" hidden></p>
      <button type="submit" class="jm-tbl jm-tbl-utama">${ikon("tanya", 16)}<span>${esc(t("cf.kirim"))}</span></button></form>`;
    el.innerHTML = exHtml({ id: "kr-fakta", ikon: "tanya", topik: t("cf.ey"), judulHtml: esc(t("cf.j", { n: angka(d.total) })), subHtml: esc(t("cf.sub")),
      isiHtml: `<div class="kr-belah"><div>${daftar}</div><div>${sayaHtml("fakta", milik, (r) => `${esc(r.kutipan.length > 120 ? r.kutipan.slice(0, 120) + "..." : r.kutipan)}${r.putusan ? " " + putusanHtml(r.putusan) : ""}`)}<h4>${esc(t("cf.form"))}</h4>${form}</div></div>` });
  }
  el.innerHTML = hantuHtml(3);
  pasangTarik(el, gambar);
  el.addEventListener("click", (e) => { const h = e.target.closest(".jm-pag-b[data-hal]"); if (h) { S.hal = +h.dataset.hal; sorotHalaman(h, S.hal); nanti(gambar); } });
  el.addEventListener("submit", async (e) => {
    if (e.target.id !== "krFaktaF") return;
    e.preventDefault();
    const $ = (i) => el.querySelector("#" + i), tbl = e.target.querySelector("button[type=submit]"), p = $("krFaktaPs");
    tbl.disabled = true; pesan(p, "ok", t("kr.mengirim"));
    try { await api("/api/cek-fakta", { metode: "POST", badan: { kutipan: $("krFaktaK").value, penutur: $("krFaktaP").value, tanggal: $("krFaktaT").value, sumber_url: $("krFaktaS").value.trim() } }); await gambar(); }
    catch (x) { tbl.disabled = false; pesan(p, "bad", galatKirim(x)); }
  });
  document.addEventListener("jm:bahasa", gambar);
  await gambar();
}
