/* Komponen bersama (CSS di inti/jm.css): baris filter, tab, subnav. Teks selalu dari pemanggil lewat t().
   Contoh filter: `<div class="jm-saring">${cariHtml({id:"q",label:t("reg.cari")})}${pilihHtml({id:"jenis",ikon:"jenis",label:t("reg.jenis"),opsi:[["","Semua"],["uu","UU"]]})}${hapusHtml({id:"hapus",label:t("jm.hapus_filter")})}${hitungHtml({id:"hitung",teks:"430 dari 430"})}</div>` */
import { t } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";

export const cariHtml = ({ id, label, placeholder }) =>
  `<label class="jm-cari">${ikon("cari2", 18)}<span class="sr">${esc(label)}</span><input id="${esc(id)}" type="search" autocomplete="off" placeholder="${esc(placeholder ?? label)}"></label>`;

/** opsi: [[nilai, teks, ikon?, hitungan?], ...]; ikon per opsi ("tek:surya", "st:beroperasi", "prov:Aceh", atau nama sprite) menimpa ikon select. Teks panjang dipotong elipsis. */
export const pilihHtml = ({ id, ikon: ik, label, opsi, nilai = "" }) =>
  `<label class="jm-pil-pilih">${ikon(ik, 18)}<span class="sr">${esc(label)}</span><select id="${esc(id)}" title="${esc(label)}" data-ikon="${esc(ik)}">${opsi.map(([v, l, i, n]) => `<option value="${esc(v)}"${String(v) === String(nilai) ? " selected" : ""} title="${esc(l)}"${i ? ` data-ikon="${esc(i)}"` : ""}${n !== undefined && n !== "" ? ` data-n="${esc(n)}"` : ""}>${esc(l)}</option>`).join("")}</select></label>`;

/** Tautan teks kecil berikon X; atribut hidden sampai ada filter aktif (atur `el.hidden`). */
export const hapusHtml = ({ id, label }) =>
  `<button type="button" class="jm-hapus" id="${esc(id)}" hidden>${ikon("silang", 16)}${esc(label)}</button>`;
export const hitungHtml = ({ id, teks }) =>
  `<span class="jm-hitung" id="${esc(id)}" role="status" aria-live="polite">${esc(teks)}</span>`;

/** Tab antarhalaman (a) dengan ikon: items [{href, ikon, label, aktif}] */
export const tabTautan = (items) =>
  `<div class="jm-tab">${items.map((x) => `<a href="${esc(x.href)}"${x.aktif ? ' aria-current="page"' : ""}>${ikon(x.ikon, 18)}<span>${esc(x.label)}</span></a>`).join("")}</div>`;

/** Subnav bagian Insight; dipasang otomatis oleh mulaiHalaman() di halaman bagian ini. */
export const BAGIAN_INSIGHT = [
  { href: "/insight", ikon: "insight", kunci: "nav.sub.ringkasan" },
  { href: "/insight#tren", ikon: "analisis", kunci: "nav.sub.tren" },
  { href: "/rantai", ikon: "rantai", kunci: "nav.rantai" },
  { href: "/asean", ikon: "asean", kunci: "nav.asean" },
  { href: "/metode", ikon: "metode", kunci: "nav.sub.metode" },
];
export function subnavHtml(jalur, hash = "") {
  const aktif = (x) =>
    x.href === "/insight"
      ? jalur === "/insight" && hash !== "#tren"
      : x.href === "/insight#tren"
        ? jalur === "/insight" && hash === "#tren"
        : jalur === x.href || jalur.startsWith(x.href + "/");
  return `<nav class="jm-subnav" id="subnav" aria-label="${esc(t("nav.insight"))}">${tabTautan(BAGIAN_INSIGHT.map((x) => ({ href: x.href, ikon: x.ikon, label: t(x.kunci), aktif: aktif(x) })))}</nav>`;
}
export const diBagianInsight = (jalur) =>
  BAGIAN_INSIGHT.some(
    (x) =>
      !x.href.includes("#") &&
      (jalur === x.href || jalur.startsWith(x.href + "/")),
  );

/* Sumber: ikon "!" dalam lingkaran, klik membuka catatan sumber (permintaan pemilik 7 Nov 2026).
   isiHtml sudah di-escape oleh pemanggil. Pakai: sumberHtml(`${esc(teks)} <a href="...">...</a>`). */
export const sumberHtml = (isiHtml, label = t("jm.sumber")) =>
  `<span class="jm-sumber"><button type="button" class="jm-sumber-b" aria-expanded="false" aria-label="${esc(label)}" title="${esc(label)}">${ikon("info", 16)}</button><span class="jm-sumber-isi" role="note" hidden>${isiHtml}</span></span>`;
if (typeof document !== "undefined" && !window.__jmSumber) {
  window.__jmSumber = true;
  const tutup = (kec) =>
    document
      .querySelectorAll(".jm-sumber-b[aria-expanded=true]")
      .forEach((b) => {
        if (b !== kec) {
          b.setAttribute("aria-expanded", "false");
          b.nextElementSibling.hidden = true;
        }
      });
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".jm-sumber-b");
    if (!b) {
      if (!e.target.closest(".jm-sumber-isi")) tutup();
      return;
    }
    const buka = b.getAttribute("aria-expanded") !== "true";
    tutup(b);
    b.setAttribute("aria-expanded", String(buka));
    b.nextElementSibling.hidden = !buka;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") tutup();
  });
}

/* Kepala seksi "exhibit" bersama. Semua argumen *Html sudah di-escape/dirakit aman oleh pemanggil.
   exHtml({ id, ikon, topik, judulHtml, subHtml, aksiHtml, isiHtml, kakiHtml, tingkat: "h2"|"h3" }) */
export const exHtml = ({
  id = "",
  ikon: ik = "",
  topik = "",
  judulHtml = "",
  subHtml = "",
  aksiHtml = "",
  isiHtml = "",
  kakiHtml = "",
  tingkat = "h2",
  kelas = "",
}) =>
  `<section class="jm-ex${kelas ? " " + esc(kelas) : ""}"${id ? ` id="${esc(id)}"` : ""}><header class="jm-ex-hd"><div class="jm-ex-teks">${topik ? `<span class="jm-ex-ey">${ik ? ikon(ik, 14) : ""}${esc(topik)}</span>` : ""}<${tingkat} class="jm-ex-j">${judulHtml}</${tingkat}>${subHtml ? `<p class="jm-ex-sub">${subHtml}</p>` : ""}</div>${aksiHtml ? `<div class="jm-ex-aksi">${aksiHtml}</div>` : ""}</header><div class="jm-ex-bd">${isiHtml}</div>${kakiHtml ? `<footer class="jm-ex-ft">${kakiHtml}</footer>` : ""}</section>`;

/* Urut global (pemilik 7 Nov 2026: SEMUA tabel bisa diurutkan). Tiap table.jm-tabel yang belum punya button.jm-urut
   dan tidak bertanda data-urut="tidak" mendapat tombol urut di tiap th; urut di DOM (tbody) per kolom.
   Tabel berhalaman wajib mengurutkan data penuhnya sendiri (pasang .jm-urut sendiri, lihat regulasi.js). */
const BULAN = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  mei: 5,
  may: 5,
  jun: 6,
  jul: 7,
  agu: 8,
  aug: 8,
  sep: 9,
  okt: 10,
  oct: 10,
  nov: 11,
  des: 12,
  dec: 12,
};
const kunciSel = (td) => {
  const v = td?.dataset?.urut ?? (td?.textContent || "").trim();
  const tgl = /^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})$/.exec(v);
  if (tgl && BULAN[tgl[2].toLowerCase()])
    return +tgl[3] * 1e4 + BULAN[tgl[2].toLowerCase()] * 100 + +tgl[1];
  const n = /^[-+]?[\d.]+(,\d+)?/.exec(v.replace(/\s/g, ""));
  if (n && /\d/.test(n[0])) {
    const x = Number(n[0].replace(/\./g, "").replace(",", "."));
    if (Number.isFinite(x)) return x;
  }
  return v === "-" || v === "" ? null : v.toLocaleLowerCase("id");
};
export function pasangUrutTabel(akar = document) {
  akar
    .querySelectorAll(
      "table.jm-tabel:not([data-urut-terpasang]):not([data-urut='tidak'])",
    )
    .forEach((tb) => {
      tb.dataset.urutTerpasang = "1";
      if (tb.querySelector("button.jm-urut")) return;
      const ths = [...tb.querySelectorAll("thead th")];
      ths.forEach((th, i) => {
        if (!th.textContent.trim() || th.dataset.urut === "tidak") return;
        th.setAttribute("aria-sort", "none");
        const b = document.createElement("button");
        b.type = "button";
        b.className = "jm-urut";
        while (th.firstChild) b.appendChild(th.firstChild);
        th.appendChild(b);
        b.addEventListener("click", () => {
          const arah = th.getAttribute("aria-sort") === "ascending" ? -1 : 1;
          ths.forEach(
            (x) =>
              x.hasAttribute("aria-sort") &&
              x.setAttribute("aria-sort", "none"),
          );
          th.setAttribute("aria-sort", arah > 0 ? "ascending" : "descending");
          const body = tb.tBodies[0];
          if (!body) return;
          const baris = [...body.rows].map((r, k) => [
            r,
            kunciSel(r.cells[i]),
            k,
          ]);
          baris.sort(
            (a, z) =>
              (a[1] === null) - (z[1] === null) ||
              (a[1] === null
                ? 0
                : (typeof a[1] === "number" && typeof z[1] === "number"
                    ? a[1] - z[1]
                    : String(a[1]).localeCompare(String(z[1]), "id", {
                        numeric: true,
                      })) * arah) ||
              a[2] - z[2],
          );
          body.append(...baris.map((x) => x[0]));
        });
      });
    });
}
if (typeof document !== "undefined" && !window.__jmUrut) {
  window.__jmUrut = true;
  const jalan = () => pasangUrutTabel();
  new MutationObserver(() => {
    clearTimeout(window.__jmUrutT);
    window.__jmUrutT = setTimeout(jalan, 60);
  }).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState !== "loading") jalan();
  else document.addEventListener("DOMContentLoaded", jalan);
}

/* Unduh naskah regulasi (pemilik 7 Nov 2026: tiap penyebutan regulasi di mana pun WAJIB punya ikon unduh PDF langsung + tautan sumber).
   r = baris regulasi (url_pdf, url_sumber, judul). */
const httpOk = (u) => /^https?:\/\//i.test(String(u || ""));
export const unduhRegHtml = (r) => {
  if (!r) return "";
  const nama = esc(r.judul || r.nomor || "");
  const pdf = httpOk(r.url_pdf)
    ? `<a class="jm-reg-ik" href="${esc(r.url_pdf)}" target="_blank" rel="noopener noreferrer" download title="${esc(t("reg.unduh"))}" aria-label="${esc(t("reg.unduh"))}: ${nama}">${ikon("pdf", 18)}</a>`
    : "";
  const src = httpOk(r.url_sumber)
    ? `<a class="jm-reg-ik" href="${esc(r.url_sumber)}" target="_blank" rel="noopener noreferrer" title="${esc(t("reg.naskah"))}" aria-label="${esc(t("reg.naskah"))}: ${nama}">${ikon("tautan", 18)}</a>`
    : "";
  return pdf || src ? `<span class="jm-reg-iks">${pdf}${src}</span>` : "";
};
