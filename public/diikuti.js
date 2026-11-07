/* /diikuti: daftar yang diikuti + "Ringkasan minggu ini" (7 hari: ajuan lembaga dan koreksi yang disetujui, berita, regulasi baru).
   Data: /api/ikuti, /api/ikuti/ringkasan; nama dari /data/*.json. Membuka halaman ini menandai ringkasan sudah dilihat (lonceng turun). */
import { t, tanggal, tanggalDariUnix } from "/i18n.js";
import { api, esc, ikon, galatTeks, kosongHtml, pesanHtml } from "/inti/umum.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { siapHtml } from "/inti/siap.js";
import { exHtml } from "/inti/komponen.js";
import { namaProyek } from "/inti/nama_proyek.js";
import { namaProvinsi } from "/profil_tampil.js";

await mulaiHalaman();
const akar = document.getElementById("isi");
const IK = { proyek: "proyek", organisasi: "direktori", provinsi: "wilayah", regulasi: "regulasi", tender: "peluang" };
const BERKAS = { proyek: "proyek", organisasi: "organisasi", regulasi: "regulasi" };
const tautan = (jenis, ref) => (jenis === "proyek" ? "/p/" : jenis === "organisasi" ? "/o/" : jenis === "provinsi" ? "/wilayah/" : jenis === "regulasi" ? "/regulasi?id=" : jenis === "topik" ? "/topik?id=" : "") + (jenis === "tender" ? "/proyek#tender" : encodeURIComponent(ref));
const muatData = (n) => fetch(`/data/${n}.json`).then((r) => r.json()).then((d) => new Map(d.baris.map((x) => [x.id, x]))).catch(() => new Map());

let NAMA = {};
async function siapkanNama(jenisAda) {
  NAMA = {};
  await Promise.all([...jenisAda].filter((j) => BERKAS[j]).map(async (j) => { NAMA[j] = await muatData(BERKAS[j]); }));
  if (jenisAda.has("provinsi")) NAMA.provinsi = new Map(await namaProvinsi());
}
function nama(jenis, ref) {
  const x = NAMA[jenis]?.get(ref);
  if (jenis === "provinsi") return x || ref;
  if (!x) return ref;
  return jenis === "proyek" ? namaProyek(x) : jenis === "regulasi" ? x.judul : x.nama;
}
const ent = (jenis, ref) => { const kons = ref.startsWith("kons:"), n = esc(kons ? ref.slice(5) : nama(jenis, ref)), h = kons ? "/regulasi?kd=" + encodeURIComponent(ref.slice(5)) + "#konsultasi" : tautan(jenis, ref); return `<span class="jm-ringkas-sel">${h ? `<a href="${esc(h)}">${n}</a>` : `<b>${n}</b>`}<small>${esc(t("dk.j." + jenis))}</small></span>`; };
const tgl = (u) => `<span data-urut="${u}">${esc(tanggal(tanggalDariUnix(u)))}</span>`;

function barisRingkasan(x) {
  const apa = x.tipe === "portal" ? esc(t("dk.portal." + x.jenis_ajuan))
    : x.tipe === "koreksi" ? esc(t("dk.koreksi", { kolom: t("kor.k." + x.kolom) }))
      : x.tipe === "topik" ? esc(t("dk.topik_baru", { judul: x.judul || x.ref }))
      : x.tipe === "konsultasi" ? esc(t("dk.kons." + x.sub))
      : x.tipe === "regulasi" ? esc(t("dk.regulasi_baru", { judul: x.judul }))
        : `<a href="${/^https?:\/\//i.test(x.url) ? esc(x.url) : "#"}" target="_blank" rel="noopener noreferrer">${esc(x.judul)}</a>${x.media ? ` <small>${esc(x.media)}</small>` : ""}`;
  return `<tr><td class="jm-nowrap" data-l="${esc(t("dk.c.tanggal"))}">${tgl(x.waktu)}</td><td data-l="${esc(t("dk.c.entitas"))}">${ent(x.jenis, x.ref)}</td><td data-l="${esc(t("dk.c.pembaruan"))}"><span class="jm-ringkas-sel"><b>${esc(t("dk.tipe." + x.tipe))}</b><span>${apa}</span></span></td></tr>`;
}

function gambar(d, r) {
  const ringkas = r.item.length
    ? `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>${["dk.c.tanggal", "dk.c.entitas", "dk.c.pembaruan"].map((k) => `<th scope="col">${esc(t(k))}</th>`).join("")}</tr></thead><tbody>${r.item.map(barisRingkasan).join("")}</tbody></table></div>`
    : kosongHtml(d.baris.length ? "dk.ringkas_kosong" : "dk.kosong");
  const daftar = d.baris.length
    ? `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>${["dk.c.entitas", "dk.c.sejak"].map((k) => `<th scope="col">${esc(t(k))}</th>`).join("")}<th scope="col" data-urut="tidak">${esc(t("dk.c.aksi"))}</th></tr></thead><tbody>${d.baris.map((x) => `<tr><td data-l="${esc(t("dk.c.entitas"))}">${ent(x.jenis, x.ref)}</td><td class="jm-nowrap" data-l="${esc(t("dk.c.sejak"))}">${tgl(x.dibuat)}</td><td data-l="${esc(t("dk.c.aksi"))}"><button type="button" class="jm-tbl jm-tbl-kecil" data-lepas="${esc(x.jenis)}|${esc(x.ref)}" title="${esc(t("dk.lepas"))}">${ikon("silang", 16)}<span>${esc(t("dk.lepas"))}</span></button></td></tr>`).join("")}</tbody></table></div>`
    : kosongHtml("dk.kosong");
  akar.innerHTML = exHtml({ id: "ringkasan", ikon: "kalender", judulHtml: esc(t("dk.ringkasan")), subHtml: esc(t("dk.ringkasan_sub")), isiHtml: ringkas })
    + exHtml({ id: "daftar", ikon: "bintang", judulHtml: esc(t("dk.daftar", { n: d.baris.length })), isiHtml: `<div id="dkPesan" aria-live="polite"></div>${daftar}` });
}

async function muat() {
  try {
    const [d, r] = await Promise.all([api("/api/ikuti"), api("/api/ikuti/ringkasan")]);
    await siapkanNama(new Set([...d.baris, ...r.item].map((x) => x.jenis)));
    gambar(d, r);
    api("/api/ikuti/lihat", { metode: "POST", badan: {} }).catch(() => {});
  } catch (e) {
    akar.innerHTML = e.kode === "fitur_belum_aktif" ? siapHtml("dk.siap") + kosongHtml("dk.kosong") : pesanHtml("galat", galatTeks(e.kode || "umum"));
  }
}
akar.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-lepas]");
  if (!b) return;
  const [jenis, ref] = b.dataset.lepas.split("|");
  b.disabled = true;
  try { await api(`/api/ikuti/${encodeURIComponent(jenis)}/${encodeURIComponent(ref)}`, { metode: "DELETE" }); await muat(); }
  catch (er) { b.disabled = false; document.getElementById("dkPesan").innerHTML = pesanHtml("galat", galatTeks(er.kode || "umum")); }
});
muat();
