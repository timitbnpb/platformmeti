/* "Tanya data": komponen bersama halaman /tanya dan tab "Tanya" di palet cari. Mengirim pertanyaan ke POST /api/tanya dan
   menggambar kartu jawaban: tiap klaim membawa sitasi bertaut ke entitas sumber; yang tak bersitasi tidak pernah tampil sebagai jawaban.
   Semua teks dari server lewat textContent / esc (bukan HTML). */
import { t, tanggal } from "/i18n.js";
import { esc, ikon, api, galatTeks } from "/inti/umum.js";

export function muatGayaTanya() {
  if (document.querySelector("link[data-tny]")) return;
  const l = document.createElement("link");
  l.rel = "stylesheet"; l.href = "/inti/tanya.css"; l.dataset.tny = "1";
  document.head.append(l);
}

export const tanyaKirim = (pertanyaan, signal) => api("/api/tanya", { metode: "POST", badan: { pertanyaan }, signal });
/* Kode galat -> kalimat kamus (laju dan masukan punya kalimat sendiri). */
export const tanyaGalat = (e) => (e?.status === 429 ? t("tny.laju") : e?.status === 422 ? t("tny.pendek") : galatTeks(e?.kode));

const aman = (u) => (typeof u === "string" && /^(\/(?![/\\])\S*|https:\/\/\S+)$/.test(u) ? u : "");
const luar = (u) => /^https:/.test(u);
const tautanHtml = (u, isi, kelas = "") => {
  const a = aman(u);
  return a ? `<a${kelas ? ` class="${kelas}"` : ""} href="${esc(a)}"${luar(a) ? ' target="_blank" rel="noopener noreferrer"' : ""}>${isi}</a>` : isi;
};
const meta = (p) => [p.sumber ? tautanHtml(p.sumber, esc(t("tny.sumber_luar")) + ikon("tautan", 12)) : "", p.tanggal ? `<span>${esc(t("tny.diperiksa", { tgl: tanggal(p.tanggal) }))}</span>` : ""].filter(Boolean).join("");
const butirSumber = (p, kutipan) => `<li class="tny-sum"><div class="tny-sum-kepala"><span class="tny-no">${p.n}</span><span class="jm-pil">${esc(p.jenis)}</span>${tautanHtml(p.url, `<b>${esc(p.judul)}</b>`)}</div>
  <blockquote>${esc(kutipan ?? p.teks)}</blockquote><p class="tny-meta">${meta(p)}</p></li>`;

/** d = jawaban server { pertanyaan, status: "jawab"|"potongan"|"kosong", klaim[], potongan[], dibuang, model }. Mengembalikan <article>. */
export function kartuJawab(d) {
  const a = document.createElement("article");
  a.className = "tny-kartu";
  const pot = new Map((d.potongan || []).map((p) => [p.n, p]));
  const labelMesin = `<p class="tny-mesin"><span class="jm-pil jm-pil-warn">${ikon("peringatan", 14)}${esc(t("tny.mesin"))}</span>${d.dibuang ? `<span class="jm-pil">${ikon("centang", 14)}${esc(t("tny.dibuang", { n: d.dibuang }))}</span>` : ""}</p>`;
  let isi;
  if (d.status === "jawab" && d.klaim?.length) {
    const rujuk = [...new Set(d.klaim.map((k) => k.n))].filter((n) => pot.has(n));
    isi = `${labelMesin}<div class="tny-jawab">${d.klaim.map((k) => `<p class="tny-klaim">${esc(k.pernyataan)} ${pot.has(k.n) ? tautanHtml(pot.get(k.n).url, esc(k.n), "tny-sit") : ""}</p>`).join("")}</div>
      <h4 class="tny-h">${ikon("tautan", 16)}<span>${esc(t("tny.sumber"))}</span></h4>
      <ol class="tny-daftar">${rujuk.map((n) => butirSumber(pot.get(n), d.klaim.find((k) => k.n === n)?.teks)).join("")}</ol>`;
  } else if (d.status === "potongan" && d.potongan?.length) {
    isi = `<p class="tny-info">${ikon("info", 18)}<span>${esc(t(d.model ? "tny.tanpa_kutipan" : "tny.tanpa_model"))}</span></p>${d.dibuang ? labelMesin : ""}
      <h4 class="tny-h">${ikon("daftar", 16)}<span>${esc(t("tny.potongan"))}</span></h4><ol class="tny-daftar">${d.potongan.map((p) => butirSumber(p)).join("")}</ol>`;
  } else {
    isi = `<p class="tny-info tny-kosong">${ikon("cari2", 22)}<span>${esc(t("tny.kosong"))}</span></p>`;
  }
  a.innerHTML = `<h3 class="tny-q">${esc(d.pertanyaan)}</h3>${isi}`;
  return a;
}

/** Hantu pemuatan + kartu galat, dipakai pemanggil saat menunggu / gagal. */
export const tanyaMuat = () => `<div class="jm-hantu" role="status" aria-label="${esc(t("jm.memuat"))}"><i></i><i></i><i></i></div>`;
export const tanyaRusak = (e) => `<p class="tny-info" role="alert">${ikon("peringatan", 20)}<span>${esc(tanyaGalat(e))}</span></p>`;
