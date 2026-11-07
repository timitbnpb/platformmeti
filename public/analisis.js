/* Pembantu bersama halaman analisis statis (/wilayah, /rantai, /asean): data JSON statis, sumber bertanggal (dilipat), batang, kartu angka. */
import { t, angka, tanggal } from "/i18n.js";
import { esc, galatHtml } from "/inti/umum.js";

export const amanUrl = (u) => (/^https?:\/\//.test(u || "") ? u : null);

export async function muatData(nama) {
  const r = await fetch(`/data/${nama}`, { credentials: "same-origin" });
  if (!r.ok) throw new Error("data");
  return r.json();
}

export const tampilGalat = (el, ulang) => {
  el.innerHTML = galatHtml("umum");
  el.querySelector("[data-aksi=ulang]")?.addEventListener("click", ulang);
};

/* Satu butir sumber: "Sumber: X, halaman, data 2025, diperiksa 7 Nov 2026" (tautan bila URL sah). */
function sumberBaris(s) {
  const isi = [s.sumber, s.halaman, s.tahun ? t("an.data_tahun", { tahun: s.tahun }) : null].filter(Boolean).join(", ");
  const u = amanUrl(s.url);
  const teks = esc(t("an.sumber", { isi }));
  return `<span>${u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${teks}</a>` : teks}, ${esc(t("an.diperiksa", { tanggal: tanggal(s.tanggal) }))}</span>`;
}

/* Sumber dilipat: ringkasan memuat jumlah dan tanggal periksa; isi lengkap saat dibuka. */
export function sumberLipat(daftar) {
  const a = daftar.filter(Boolean);
  if (!a.length) return "";
  const tgl = tanggal(a[0].tanggal);
  return `<details class="jm-an-src"><summary>${esc(a.length > 1 ? t("an.sumber_n", { n: a.length, tanggal: tgl }) : t("an.sumber_1", { tanggal: tgl }))}</summary><div>${a.map(sumberBaris).join("")}</div></details>`;
}
export const sumberHtml = (s) => sumberLipat([s]);

export const pil = (kunci, jenis = "warn") => `<span class="jm-pil jm-pil-${jenis}">${esc(t(kunci))}</span>`;

/* Kartu angka: nilai, satuan, penyebut "n dari N", sumber, pil EST bila turunan. */
export function kartuHtml({ judul, nilai, satuan, penyebut, sumber, turunan }) {
  return `<article class="jm-kartu jm-an-kartu"><h3>${esc(judul)}${turunan ? " " + pil("an.est") : ""}</h3>
    <p class="jm-an-angka">${esc(nilai)}${satuan ? ` <span>${esc(satuan)}</span>` : ""}</p>
    ${penyebut ? `<p class="jm-bantu">${esc(penyebut)}</p>` : ""}${sumber || ""}</article>`;
}

/* Temuan utama di kepala wadah: kalimat besar dari data + pil EST bila turunan. */
export const temuanHtml = (teks, turunan = true) => `${esc(teks)}${turunan ? " " + pil("an.est") : ""}`;

/* Batang horizontal HTML. baris: [{label, bagian:[{nilai, kelas}], teks, sorot, id}]; ref = nilai garis putus-putus; aksi = batang bisa diklik.
   Lebar lewat data-w; panggil pasangBar(akar) sesudah innerHTML (CSSOM, tanpa atribut style). */
export function batangHtml(baris, { maks, ref, label, aksi } = {}) {
  const M = maks || Math.max(1, ref || 0, ...baris.map((b) => b.bagian.reduce((s, x) => s + (x.nilai || 0), 0)));
  const isi = baris.map((b) => {
    const garis = ref ? `<u class="jm-bar-garis" data-ref="${((ref / M) * 100).toFixed(2)}"></u>` : "";
    const seg = b.bagian.map((p) => `<i class="${p.kelas}" data-w="${(Math.max(0, (p.nilai || 0) / M) * 100).toFixed(2)}"></i>`).join("");
    const dalam = `<span class="jm-bar-lbl">${esc(b.label)}</span><span class="jm-bar-trek">${seg}${garis}</span><b class="jm-bar-val">${esc(b.teks)}</b>`;
    const kelas = `jm-bar-b${b.sorot ? " jm-an-sorot" : ""}`;
    return aksi ? `<li class="${kelas}"><button type="button" class="jm-bar-aksi" data-id="${esc(b.id)}" aria-pressed="${b.pilih ? "true" : "false"}" title="${esc(b.label + ": " + b.teks)}">${dalam}</button></li>`
      : `<li class="${kelas}" title="${esc(b.label + ": " + b.teks)}">${dalam}</li>`;
  }).join("");
  return `<ul class="jm-batang" aria-label="${esc(label || "")}">${isi}</ul>`;
}
export function pasangBar(akar) {
  for (const e of akar.querySelectorAll("[data-w]")) e.style.width = e.dataset.w + "%";
  for (const e of akar.querySelectorAll("[data-ref]")) e.style.left = e.dataset.ref + "%";
}

/* Versi lama (batang SVG berskala viewBox), masih dipakai insight.js. */
export function batangSvg(baris, { maks, label } = {}) {
  const M = maks || Math.max(1, ...baris.map((b) => b.bagian.reduce((s, x) => s + (x.nilai || 0), 0)));
  const isi = baris.map((b) => {
    let x = 0;
    const rect = b.bagian.map((p) => {
      const w = Math.max(0, ((p.nilai || 0) / M) * 100);
      const r = `<rect class="${p.kelas}" x="${x.toFixed(2)}" y="0" width="${w.toFixed(2)}" height="10"/>`;
      x += w;
      return r;
    }).join("");
    return `<li class="jm-an-br${b.sorot ? " jm-an-sorot" : ""}"><div class="jm-an-bt"><span>${esc(b.label)}</span><b>${esc(b.teks)}</b></div><svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" focusable="false"><rect class="jm-an-trek" x="0" y="0" width="100" height="10"/>${rect}</svg></li>`;
  }).join("");
  return `<ul class="jm-an-batang" aria-label="${esc(label || "")}">${isi}</ul>`;
}

export const teksTek = (k) => t("an.tek." + k);
export const teksStatus = (k) => t("an.status." + (k || "tidak-diketahui"));
export const num = (n, d = 0) => angka(n, { desimal: d });

/* Pasang ulang render saat bahasa berganti. */
export function saatBahasa(fn) { document.addEventListener("jm:bahasa", fn); }

/* Sakelar segmen: chrome (aria-pressed) berubah seketika, isi berat menyusul. */
export function pasangSeg(seg, atribut, ambilKini, setel, kerja, nantiFn) {
  seg.addEventListener("click", (e) => {
    const b = e.target.closest(`button[data-${atribut}]`);
    if (!b || b.dataset[atribut] === String(ambilKini())) return;
    for (const x of seg.children) x.setAttribute("aria-pressed", String(x === b));
    setel(b.dataset[atribut]);
    nantiFn(kerja);
  });
}
