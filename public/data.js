/* /data: portal data terbuka. Katalog /data/katalog_data.json (scripts/pipa/katalog_data.mjs): judul, deskripsi, baris, sumber, tanggal,
   lisensi, halaman pemakai; unduh JSON langsung, CSV dikonversi di klien untuk larik datar; sitasi. Teks di kamus i18n (awalan kdt.). */
import { mulaiHalaman } from "/inti/kepala.js";
import { esc, hantuHtml, ikon, debounce } from "/inti/umum.js";
import { muatData, tampilGalat, ubinHtml } from "/analisis.js";
import { t, bahasa, tanggal } from "/i18n.js";
import { cariHtml, pilihHtml, hapusHtml, hitungHtml } from "/inti/komponen.js";
import { kabar, unduhBlob } from "/inti/aksi_ex.js";
import { muatTeks, L, num, seksi, catatan, narasi, tabel, saatBahasa } from "/info_kerangka.js";
import { keCsv, barisDari, bahanSitasi } from "/data_unduh.js";

const $ = (id) => document.getElementById(id);
let K = null;
const st = { q: "", tema: "" };
const ikTema = (id) => K.tema.find((x) => x.id === id)?.ikon ?? "tabel";
const cocok = (b, q) => !q || [b.berkas, b.judul.id, b.judul.en, b.deskripsi.id, b.deskripsi.en, b.sumber.nama, ...b.halaman].some((s) => s && String(s).toLowerCase().includes(q));
const saring = () => K.berkas.filter((b) => (!st.tema || b.tema === st.tema) && cocok(b, st.q.trim().toLowerCase()));
const sitasi = (b) => { const x = bahanSitasi(b, { origin: location.origin, akses: new Date().toISOString().slice(0, 10), bahasa: bahasa() }); return t("kdt.sit.fmt", { sumber: x.sumber, tahun: x.tahun, judul: x.judul, tgl: tanggal(x.tanggal), url: x.url, akses: tanggal(x.akses) }); };
const ukuran = (n) => (n >= 1048576 ? `${num(n / 1048576, 1)} MB` : `${num(Math.max(1, Math.round(n / 1024)))} KB`);

function ubin() {
  const baris = K.berkas.reduce((s, b) => s + (b.baris || 0), 0);
  $("ubin").innerHTML = ubinHtml([
    { ikon: "tabel", nilai: num(K.jumlah), label: t("kdt.u.berkas"), href: "#katalog" },
    { ikon: "daftar2", nilai: num(baris), label: t("kdt.u.baris"), href: "#katalog" },
    { ikon: "csv", nilai: num(K.berkas.filter((b) => b.csv != null).length), label: t("kdt.u.csv"), href: "#katalog" },
    { ikon: "tag", nilai: num(new Set(K.berkas.map((b) => b.tema)).size), label: t("kdt.u.tema"), href: "#katalog" },
    { ikon: "tautan", nilai: num(new Set(K.berkas.flatMap((b) => b.halaman)).size), label: t("kdt.u.halaman"), href: "#katalog" },
    { ikon: "perisai", nilai: num(K.jumlah_dikecualikan), label: t("kdt.u.kecuali"), href: "#kebijakan" },
  ]);
}

const sarHtml = () => {
  const tema = [["", t("kdt.tema.semua"), "tabel", K.jumlah], ...K.tema.map((x) => [x.id, t("kdt.tema." + x.id), x.ikon, K.berkas.filter((b) => b.tema === x.id).length])].filter((x) => x[3] > 0);
  return `<div class="kdt-tema" role="group" aria-label="${esc(t("kdt.tema.label"))}">${tema.map(([id, l, ik, n]) => `<button type="button" data-tema="${esc(id)}" aria-pressed="${id === st.tema}">${ikon(ik, 16)}<span>${esc(l)}</span><b>${esc(num(n))}</b></button>`).join("")}</div>
  <div class="jm-saring kdt-sar">${cariHtml({ id: "kdtQ", label: t("kdt.cari"), placeholder: t("kdt.cari.ph") })}${hitungHtml({ id: "kdtN", teks: "" })}${hapusHtml({ id: "kdtHapus", label: t("kdt.hapus") })}</div>`;
};

const chip = (h) => `<a href="/${esc(h)}">${esc("/" + h)}</a>`;
function halHtml(b) {
  if (!b.halaman.length) return `<span class="jm-bantu" title="${esc(t("kdt.k.tanpa_halaman"))}">-</span>`;
  const lebih = b.halaman.length > 4 ? `<span class="jm-bantu">+${num(b.halaman.length - 4)}</span>` : "";
  return `<div class="kdt-hal">${b.halaman.slice(0, 4).map(chip).join("")}${lebih}</div>`;
}
function unduhHtml(b) {
  const nm = esc(b.berkas), judulJ = esc(t("kdt.json.u", { ukuran: ukuran(b.ukuran) }));
  const csv = b.csv == null ? "" : `<button type="button" data-csv="${nm}" aria-label="${esc(t("kdt.csv.u"))}: ${nm}">${ikon("csv", 14)}CSV</button>`;
  const sit = `<button type="button" data-sit="${nm}" aria-label="${esc(t("kdt.sit.salin"))}: ${nm}">${ikon("tag", 14)}${esc(t("kdt.sit.k"))}</button>`;
  return `<div class="kdt-aksi"><a href="/data/${nm}" download title="${judulJ}" aria-label="${judulJ}: ${nm}">${ikon("unduh", 14)}JSON</a>${csv}${sit}</div>`;
}
let csvFn = null;
function pasangCsv() { // dipasang ulang sesudah tiap tabel baru agar terakhir berjalan dan menimpa CSV kolom mentah tabel
  const ex = $("katalog");
  if (csvFn) ex.removeEventListener("jm:csv", csvFn);
  csvFn = (e) => { e.detail.baris = [[t("kdt.k.berkas"), t("kdt.k.judul"), t("kdt.k.tema"), t("kdt.k.baris"), t("kdt.k.sumber"), t("kdt.k.dibangun"), t("kdt.k.lisensi"), t("kdt.k.halaman")], ...saring().map((b) => [b.berkas, L(b.judul), t("kdt.tema." + b.tema), b.baris ?? "", b.sumber.nama ?? "", b.dibangun ?? "", b.lisensi ?? "", b.halaman.join(" ")])]; };
  ex.addEventListener("jm:csv", csvFn);
}
function isiTabel() {
  const a = saring();
  $("kdtN").textContent = t("kdt.hitung", { n: num(a.length), total: num(K.jumlah) });
  $("kdtHapus").hidden = !st.q && !st.tema;
  const wadah = document.createElement("div"); // wadah baru tiap saring: tanpa pendengar ganda pada tabel lama
  $("kdtTabel").replaceChildren(wadah);
  if (!a.length) { wadah.innerHTML = `<p class="jm-bantu">${esc(t("kdt.kosong"))}</p>`; return; }
  tabel(wadah, { baris: a, per: 10, urut: { k: "berkas", arah: 1 }, label: t("kdt.kat.t"), kolom: [
    { k: "berkas", label: t("kdt.k.berkas"), v: (b) => L(b.judul), f: (b) => `<div class="kdt-brk"><b>${esc(L(b.judul))}</b><code>${esc(b.berkas)}</code><p>${esc(L(b.deskripsi))}</p></div>` },
    { k: "tema", label: t("kdt.k.tema"), tengah: true, v: (b) => t("kdt.tema." + b.tema), f: (b) => `<span class="kdt-tp">${ikon(ikTema(b.tema), 14)}${esc(t("kdt.tema." + b.tema))}</span>` },
    { k: "baris", label: t("kdt.k.baris"), num: true, v: (b) => b.baris, f: (b) => (b.baris == null ? `<span class="jm-bantu" title="${esc(t("kdt.k.tanpa_baris"))}">-</span>` : num(b.baris)) },
    { k: "sumber", label: t("kdt.k.sumber"), v: (b) => b.sumber.nama, f: (b) => (b.sumber.nama ? (b.sumber.url ? `<a href="${esc(b.sumber.url)}" target="_blank" rel="noopener noreferrer">${esc(b.sumber.nama)}</a>` : esc(b.sumber.nama)) : `<span class="jm-bantu" title="${esc(t("kdt.k.tanpa_sumber"))}">-</span>`) },
    { k: "dibangun", label: t("kdt.k.dibangun"), tengah: true, v: (b) => b.dibangun, f: (b) => (b.dibangun ? esc(tanggal(b.dibangun)) : `<span class="jm-bantu">-</span>`) },
    { k: "lisensi", label: t("kdt.k.lisensi"), v: (b) => b.lisensi, f: (b) => (b.lisensi ? esc(b.lisensi) : `<span class="jm-bantu" title="${esc(t("kdt.k.tanpa_lisensi"))}">-</span>`) },
    { k: "halaman", label: t("kdt.k.halaman"), v: (b) => b.halaman.length, f: halHtml },
    { k: "unduh", label: t("kdt.k.unduh"), tengah: true, v: (b) => b.ukuran, f: unduhHtml },
  ] });
  pasangCsv();
}

function katalog() {
  $("kdtKat").innerHTML = seksi({ id: "katalog", ik: "tabel", topik: t("kdt.kat.t"), judul: t("kdt.kat.j", { n: num(K.jumlah) }), turunan: false, sub: t("kdt.kat.s"), csv: true, isi: `${sarHtml()}<div id="kdtTabel"></div>` });
  isiTabel();
  const ex = $("katalog");
  pasangCsv();
  const ulang = debounce(() => isiTabel(), 150);
  ex.addEventListener("input", (e) => { if (e.target.id === "kdtQ") { st.q = e.target.value; ulang(); } });
  ex.addEventListener("click", async (e) => {
    const tm = e.target.closest("[data-tema]"), hp = e.target.closest("#kdtHapus"), c = e.target.closest("[data-csv]"), s = e.target.closest("[data-sit]");
    if (tm) { st.tema = tm.dataset.tema; for (const b of ex.querySelectorAll("[data-tema]")) b.setAttribute("aria-pressed", String(b.dataset.tema === st.tema)); ulang(); }
    else if (hp) { st.q = ""; st.tema = ""; $("kdtQ").value = ""; for (const b of ex.querySelectorAll("[data-tema]")) b.setAttribute("aria-pressed", String(b.dataset.tema === "")); isiTabel(); }
    else if (s) { const b = K.berkas.find((x) => x.berkas === s.dataset.sit); try { await navigator.clipboard.writeText(sitasi(b)); kabar(t("kdt.sit.disalin")); } catch { kabar(sitasi(b)); } }
    else if (c) {
      const b = K.berkas.find((x) => x.berkas === c.dataset.csv); c.disabled = true;
      try {
        const rows = barisDari(await muatData(b.berkas), b.csv);
        unduhBlob(new Blob([keCsv(rows)], { type: "text/csv;charset=utf-8" }), b.berkas.replace(/\.json$/, "").replace(/\//g, "-") + ".csv");
      } catch { kabar(t("kdt.csv.gagal")); }
      c.disabled = false;
    }
  });
}

function sitasiBagian() {
  const b = K.berkas.find((x) => x.berkas === "kelistrikan.json") || K.berkas[0];
  $("kdtSit").innerHTML = seksi({ id: "sitasi", ik: "tag", topik: t("kdt.sit.t"), judul: t("kdt.sit.j"), turunan: false, sub: t("kdt.sit.s"), isi: `${narasi(t("kdt.sit.n"))}<div class="kdt-dua"><div><h3 class="kdt-sub">${esc(t("kdt.sit.fmt_t"))}</h3><p class="kdt-sit">${esc(t("kdt.sit.pola"))}</p></div><div><h3 class="kdt-sub">${esc(t("kdt.sit.contoh", { berkas: b.berkas }))}</h3><p class="kdt-sit">${esc(sitasi(b))}</p></div></div>${catatan(t("kdt.sit.c"))}` });
}

function kebijakan() {
  const alasan = {};
  for (const d of K.dikecualikan) alasan[d.alasan] = (alasan[d.alasan] || 0) + 1;
  $("kdtKeb").innerHTML = seksi({ id: "kebijakan", ik: "perisai", topik: t("kdt.keb.t"), judul: t("kdt.keb.j", { n: num(K.jumlah_dikecualikan) }), turunan: false, sub: t("kdt.keb.s"), isi: `${narasi(L(K.kebijakan))}<ul class="kdt-ket">${K.daftar_tolak_diperiksa ? `<li class="kdt-pil kdt-p-ok">${esc(t("kdt.keb.tolak_ya"))}</li>` : `<li class="kdt-pil kdt-p-warn">${esc(t("kdt.keb.tolak_tidak"))}</li>`}</ul><ul class="kdt-ex">${Object.entries(alasan).map(([a, n]) => `<li><span>${esc(t("kdt.alasan." + a))}</span><b>${esc(num(n))}</b></li>`).join("")}</ul>` });
}

function terkait() {
  const tautan = [["/akses-energi", "tek-listrik", "kdt.t.akses"], ["/dokumen-data", "pdf", "kdt.t.dok"], ["/desa-energi", "lokasi", "kdt.t.desa"], ["/metode", "metode", "kdt.t.metode"], ["/direktori?tampil=sistem_data", "csv", "kdt.t.sistem"]];
  $("kdtTer").innerHTML = seksi({ id: "terkait", ik: "tautan", topik: t("kdt.r.t"), judul: t("kdt.r.j"), turunan: false, sub: t("kdt.r.s"), isi: `<div class="kdt-terkait">${tautan.map(([h, ik, k]) => `<a class="jm-tbl" href="${h}">${ikon(ik, 16)}<span>${esc(t(k))}</span></a>`).join("")}</div>` });
}

function gambar() {
  document.title = t("kdt.judul_halaman");
  ubin();
  if (!$("kdtKat")) $("isi").innerHTML = `<div id="kdtKat"></div><div id="kdtSit"></div><div id="kdtKeb"></div><div id="kdtTer"></div>`;
  katalog(); sitasiBagian(); kebijakan(); terkait();
}

(async () => {
  await mulaiHalaman();
  $("isi").innerHTML = hantuHtml(6);
  try { [K] = await Promise.all([muatData("katalog_data.json"), muatTeks("katalog")]); } catch (e) { tampilGalat($("isi"), () => location.reload()); return; }
  $("isi").innerHTML = "";
  gambar();
  saatBahasa(() => { st.q = ""; st.tema = ""; gambar(); });
  if (location.hash) $(location.hash.slice(1))?.scrollIntoView();
})();
