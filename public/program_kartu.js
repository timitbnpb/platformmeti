/* Kartu program nasional: SATU pola dipakai /proyek (bagian Program nasional) dan /program (indeks).
   Data = baris program_analisis.json (16 program; 7 di antaranya program nasional di program.json, kode sama jadi tak ganda). */
import { t, angka, bahasa } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { ikonTek, ikonStatus } from "/inti/ikon_tek.js";

export const ST_IK = { rencana: "rencana", lelang: "izin", konstruksi: "konstruksi", berjalan: "beroperasi" };
const BOBOT = { tinggi: 0, sedang: 1, rendah: 2 };
const num = (n, d = 0) => angka(n, { desimal: d });
export const L = (x) => (x && (x[bahasa()] ?? x.id)) || "";
/* kategori untuk segmen saring */
export const KAT = { "plts-100gw": "pembangkit", wte: "pembangkit", dedieselisasi: "pembangkit", "panas-bumi": "pembangkit", "plts-atap": "pembangkit", nuklir: "pembangkit", "pensiun-dini-pltu": "pembangkit",
  b50: "bahan", e20: "bahan", "co-firing": "bahan", "hidrogen-hijau": "bahan", ruptl: "jaringan", "super-grid": "jaringan", psn: "jaringan", "kendaraan-listrik": "kendaraan", jetp: "dana" };
export const KAT_DAFTAR = [["semua", "daftar2", "jm-tek-lain"], ["pembangkit", "surya", "jm-tek-surya"], ["bahan", "bioenergi", "jm-tek-bioenergi"], ["jaringan", "jaringan", "jm-tek-jaringan"], ["kendaraan", "penyimpanan", "jm-tek-penyimpanan"], ["dana", "pembiayaan", "jm-tek-pembiayaan"]];
/* foto hanya bila benar-benar sesuai programnya; selain itu ilustrasi ikon bergradien --tp-* */
const FOTO = { "plts-100gw": "surya-cirata", wte: "sampah-psel", b50: "bioenergi-sawit", e20: "bioetanol-tebu", ruptl: "hidro-saguling", "panas-bumi": "panas-bumi-sibayak", nuklir: "nuklir-siwabessy", "hidrogen-hijau": "hidrogen-spbu", dedieselisasi: "penyimpanan-baterai", psn: "bayu-sidrap", jetp: "pembiayaan-hijau", "pensiun-dini-pltu": "transisi-berkeadilan", "plts-atap": "efisiensi", "kendaraan-listrik": "kendaraan-listrik", "co-firing": "biomassa-bantargebang", "super-grid": "jaringan" };
const WARNA = { surya: "surya", "biomassa-sampah": "sampah", bioenergi: "bio", jaringan: "jaringan", "panas-bumi": "panas", penyimpanan: "simpan", hidrogen: "hidrogen", nuklir: "nuklir" };

const kecil = (svg) => svg.replace('class="jm-ikt"', 'class="jm-ikt jm-ikt-s"');
export const fotoProgram = (g) => { const f = FOTO[g.kode] || g.gambar; return f ? `/img/beranda/${f}.webp` : ""; };
export const pilTahap = (k) => `<span class="jm-pil-st jm-st-${ST_IK[k]}">${kecil(ikonStatus(ST_IK[k]))}<span>${esc(t("pg.tahap." + k))}</span></span>`;
export const teratas = (g) => [...g.isu].sort((a, z) => BOBOT[a.tingkat] - BOBOT[z.tingkat])[0] || null;
export const berat = (g) => g.isu.filter((x) => x.tingkat === "tinggi").length;
/* "100", "1.076", "3,21" ditulis format Indonesia di data; tampil mengikuti bahasa. Nilai bukan angka apa adanya. */
export function angkaTampil(s) {
  if (!/^[\d.,]+$/.test(String(s))) return String(s);
  const n = Number(String(s).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? num(n, Number.isInteger(n) ? 0 : String(s).split(",")[1].length) : String(s);
}

export const kartuProgram = (g) => {
  const tg = g.target[0], tt = teratas(g), nb = berat(g), np = g.proyek_ringkas.jumlah;
  const foto = FOTO[g.kode];
  const ubin = [
    tg && `<div title="${esc(L(tg.label))}${tg.tahun ? ", " + esc(tg.tahun) : ""}"><dt>${esc(t("pg.c.target"))}</dt><dd>${esc(angkaTampil(tg.angka))} <small>${esc(L(tg.satuan))}</small></dd></div>`,
    np && `<div><dt>${esc(t("pk.u.proyek"))}</dt><dd>${num(np)}</dd></div>`,
    nb && `<div><dt>${esc(t("pg.u.isu"))}</dt><dd>${num(nb)}</dd></div>`,
  ].filter(Boolean);
  const gb = foto ? `<img src="/img/beranda/${esc(foto)}.webp" alt="" width="800" height="450" loading="lazy" decoding="async">` : `<span class="jm-pk-ilu" aria-hidden="true">${ikonTek(g.ikon)}</span>`;
  return `<a class="jm-pk jm-pk-t-${WARNA[g.ikon] || "jaringan"}" href="/program/${esc(g.kode)}" data-kat="${KAT[g.kode] || "jaringan"}"><div class="jm-pk-gb">${gb}<span class="jm-pk-ik">${ikonTek(g.ikon)}</span>${pilTahap(g.tahap)}<h3>${esc(L(g.nama))}</h3></div>
    <div class="jm-pk-isi"><p class="jm-pk-desk">${esc(L(g.ringkasan))}</p>
    ${ubin.length ? `<dl class="jm-pk-stat jm-pk-n${ubin.length}">${ubin.join("")}</dl>` : ""}
    ${tt ? `<p class="jm-pk-isu jm-pk-isu-${tt.tingkat}" title="${esc(t("pg.tingkat." + tt.tingkat))}">${ikon(tt.tingkat === "tinggi" ? "peringatan" : "info", 18)}<span>${esc(L(tt.judul))}</span></p>` : ""}</div></a>`;
};

/* segmen saring: ujung ke ujung, ikon berwarna, cacah per kategori */
export const segmenProgram = (baris, aktif = "semua") => `<div class="jm-pk-seg" role="group" aria-label="${esc(t("pk.f.grup"))}">${KAT_DAFTAR.map(([k, ik, kls]) => {
  const n = k === "semua" ? baris.length : baris.filter((g) => (KAT[g.kode] || "jaringan") === k).length;
  return `<button type="button" class="${kls}" data-kat="${k}" aria-pressed="${k === aktif}">${k === "semua" ? ikon(ik, 18) : ikonTek(ik)}<span>${esc(t("pk.kat." + k))}</span><b>${num(n)}</b></button>`;
}).join("")}</div>`;

/* pasang: segmen mengubah chrome seketika, grid menyusul sesudah bingkai tercat */
export function pasangProgram(akar, baris, nanti) {
  const grid = akar.querySelector(".jm-pk-grid"), seg = akar.querySelector(".jm-pk-seg");
  const isi = (k) => { grid.innerHTML = baris.filter((g) => k === "semua" || (KAT[g.kode] || "jaringan") === k).map(kartuProgram).join(""); };
  seg.addEventListener("click", (e) => {
    const b = e.target.closest("[data-kat]");
    if (!b) return;
    for (const x of seg.children) x.setAttribute("aria-pressed", String(x === b));
    nanti(() => isi(b.dataset.kat));
  });
  isi("semua");
}
