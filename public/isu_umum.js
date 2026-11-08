/* /isu: bahan bersama (data, tema, status, kartu, tanggal parsial). Semua teks lewat t(); warna lewat kelas isu.css. */
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";

export const TEMA = { kebijakan: "regulasi", harga: "tag", industri: "pabrik", batubara: "industri", pendanaan: "kartu", perizinan: "lencana", lahan: "denah", lingkungan: "peringatan", sosial: "orang", jaringan: "petir", sampah: "tek-bio", karbon: "karbon", nuklir: "tek-panas", desa: "lokasi", rued: "bendera", proyek: "proyek" };
export const STATUS = ["aktif", "mereda", "selesai"];
export const IKON_STATUS = { aktif: "petir", mereda: "jam", selesai: "centang" };
export const N = (n) => angka(n);

let muat;
export const muatIsu = () => (muat ??= fetch("/data/isu.json", { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error("data"); return r.json(); }).catch((e) => { muat = null; throw e; }));

/** "2026" / "2026-09" / "2026-09-08" -> teks pendek (tanpa hari bila presisinya bulan atau tahun). */
export function tgl(s) {
  if (!s) return "-";
  const v = String(s);
  if (v.length === 4) return v;
  if (v.length === 7) return tanggal(v + "-01").replace(/^1 /, "");
  return tanggal(v);
}
export const lengkap = (s) => (String(s).length === 4 ? s + "-01-01" : String(s).length === 7 ? s + "-01" : String(s));

export const pilTema = (k) => `<span class="isu-tema isu-t-${esc(k)}">${ikon(TEMA[k] || "info", 14)}<span>${esc(t("isu.tema." + k))}</span></span>`;
export const pilStatus = (s) => `<span class="isu-st isu-s-${esc(s)}">${ikon(IKON_STATUS[s] || "info", 14)}<span>${esc(t("isu.st." + s))}</span></span>`;
export const pilBukti = (b) => `<span class="isu-bk">${ikon("tingkat", 14)}<span>${esc(t("isu.bukti." + b))}</span></span>`;

/** Kartu satu isu (tautan penuh ke #id). */
export function kartuIsu(i) {
  const rentang = i.mulai ? (i.terbaru && i.terbaru !== i.mulai ? t("isu.k.rentang", { a: tgl(i.mulai), b: tgl(i.terbaru) }) : tgl(i.mulai)) : "";
  return `<li class="isu-kartu-li"><a class="isu-kartu isu-t-${esc(i.tema)}" href="#${esc(i.id)}" data-isu="${esc(i.id)}">
    <span class="isu-lg">${ikon(TEMA[i.tema] || "info", 24)}</span>
    <span class="isu-kartu-isi">
      <span class="isu-pil-baris">${pilTema(i.tema)}${pilStatus(i.status)}${i.auto ? `<span class="isu-auto">${ikon("analisis", 14)}<span>${esc(t("isu.k.auto"))}</span></span>` : ""}</span>
      <b class="isu-kartu-j">${esc(i.judul)}</b>
      <span class="isu-kartu-r">${esc(i.ringkas)}</span>
      <span class="isu-meta">${rentang ? `<span>${ikon("kalender", 14)}${esc(rentang)}</span>` : ""}<span>${ikon("buku", 14)}${esc(t("isu.k.sumber", { n: N(i.sumber.length) }))}</span>${i.linimasa.length ? `<span>${ikon("linimasa", 14)}${esc(t("isu.k.peristiwa", { n: N(i.linimasa.length) }))}</span>` : ""}</span>
    </span></a></li>`;
}

/** Saring menurut state {q, tema, status}. */
export function saring(baris, S) {
  const q = S.q.trim().toLowerCase();
  return baris.filter((i) => (!S.tema || i.tema === S.tema) && (!S.status || i.status === S.status)
    && (!q || `${i.judul} ${i.ringkas} ${i.pihak.map((p) => p.nama).join(" ")}`.toLowerCase().includes(q)));
}
export const hitung = (baris, k) => baris.reduce((m, i) => ((m[i[k]] = (m[i[k]] || 0) + 1), m), {});
