/* Komponen bersama (CSS di inti/jm.css): baris filter, tab, subnav. Teks selalu dari pemanggil lewat t().
   Contoh filter: `<div class="jm-saring">${cariHtml({id:"q",label:t("reg.cari")})}${pilihHtml({id:"jenis",ikon:"jenis",label:t("reg.jenis"),opsi:[["","Semua"],["uu","UU"]]})}${hapusHtml({id:"hapus",label:t("jm.hapus_filter")})}${hitungHtml({id:"hitung",teks:"430 dari 430"})}</div>` */
import { t, tanggal, angka } from "/i18n.js";
import { esc, ikon, judulHuruf } from "/inti/umum.js";
import { paginasiHtml } from "/inti/paginasi.js";
import { kabar } from "/inti/aksi_ex.js";
import { ikonTek, pilStatus } from "/inti/ikon_tek.js";
import { logoOrg } from "/inti/logo_org.js";
import { namaBaku } from "/inti/nama_baku.js";
import { namaMedia, logoLokal } from "/inti/nama_media.js";
import { urlMutlak, tautanBagi } from "/inti/bagi.js";
export { urlMutlak, tautanBagi };

export const cariHtml = ({ id, label, placeholder }) =>
  `<label class="jm-cari">${ikon("cari2", 18)}<span class="sr">${esc(label)}</span><input id="${esc(id)}" type="search" autocomplete="off" placeholder="${esc(placeholder ?? label)}"></label>`;

/** opsi: [[nilai, teks, ikon?, hitungan?], ...]; ikon per opsi ("tek:surya", "st:beroperasi", "prov:Aceh", atau nama sprite) menimpa ikon select. Teks panjang dipotong elipsis. */
export const pilihHtml = ({ id, ikon: ik, label, opsi, nilai = "" }) => {
  const o = ([v, l, i, n, , judul]) => `<option value="${esc(v)}"${String(v) === String(nilai) ? " selected" : ""} title="${esc(judul || l)}"${i ? ` data-ikon="${esc(i)}"` : ""}${n !== undefined && n !== "" ? ` data-n="${esc(n)}"` : ""}>${esc(l)}</option>`;
  /* opsi kelima = nama grup (opsi sejenis berurutan dibungkus <optgroup>), keenam = title (nama lengkap) */
  let isi = "", g = null;
  for (const x of opsi) {
    if (x[4] !== g) { isi += g ? "</optgroup>" : ""; g = x[4] || null; isi += g ? `<optgroup label="${esc(g)}">` : ""; }
    isi += o(x);
  }
  isi += g ? "</optgroup>" : "";
  return `<label class="jm-pil-pilih">${ikon(ik, 18)}<span class="sr">${esc(label)}</span><select id="${esc(id)}" title="${esc(label)}" data-ikon="${esc(ik)}">${isi}</select></label>`;
};

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
  { href: "/insight", ikon: "kajian", kunci: "nav.sub.ringkasan" },
  { href: "/insight#tren", ikon: "linimasa", kunci: "nav.sub.tren" },
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

/* Tombol bagikan bersama (permintaan pemilik 8 Nov 2026): Facebook, X, WhatsApp, LinkedIn, salin tautan.
   Tautan dibuka di tab baru dengan rel noopener; url kanonik (relatif dijadikan mutlak). Penyalinan ditangani satu pendengar klik di bawah.
   Pakai: bagikanHtml({ url: "/siaran-pers/abc", judul: "Judul", kelas: "kecil" }). */
export const bagikanHtml = ({ url, judul, kelas = "", lengkap = false }) => {
  const mutlak = urlMutlak(url), h = tautanBagi(mutlak, judul);
  const a = (k, ik, kunci) => `<a class="jm-bagi-b" href="${esc(h[k])}" target="_blank" rel="noopener noreferrer" title="${esc(t(kunci))}" aria-label="${esc(t(kunci))}">${ikon(ik, 18)}</a>`;
  const salin = `<button type="button" class="jm-bagi-b" data-jm-salin="${esc(mutlak)}" title="${esc(t("aksi.salin"))}" aria-label="${esc(t("aksi.salin"))}">${ikon("salin", 18)}</button>`;
  /* lengkap: urutan WhatsApp, X, LinkedIn, Facebook, Telegram, Surel, Salin + tombol Web Share bila peramban mendukung */
  const isi = lengkap
    ? `${a("wa", "whatsapp", "aksi.wa")}${a("x", "x", "bagi.x")}${a("li", "linkedin", "aksi.li")}${a("fb", "facebook", "bagi.fb")}${a("tg", "telegram", "bagi.tg")}<a class="jm-bagi-b" href="${esc(h.surel)}" title="${esc(t("bagi.surel"))}" aria-label="${esc(t("bagi.surel"))}">${ikon("surel", 18)}</a>${salin}${typeof navigator !== "undefined" && navigator.share ? `<button type="button" class="jm-bagi-b" data-jm-natif="${esc(mutlak)}" data-judul="${esc(judul)}" title="${esc(t("bagi.natif"))}" aria-label="${esc(t("bagi.natif"))}">${ikon("bagikan", 18)}</button>` : ""}`
    : `${a("fb", "facebook", "bagi.fb")}${a("x", "x", "bagi.x")}${a("wa", "whatsapp", "aksi.wa")}${a("li", "linkedin", "aksi.li")}${salin}`;
  return `<span class="jm-bagi${kelas ? " " + esc(kelas) : ""}" role="group" aria-label="${esc(t("bagi.grup"))}">${isi}</span>`;
};
if (typeof document !== "undefined" && !window.__jmBagi) {
  window.__jmBagi = true;
  document.addEventListener("click", async (e) => {
    const n = e.target.closest("[data-jm-natif]");
    if (n) { try { await navigator.share({ url: n.dataset.jmNatif, title: n.dataset.judul }); } catch (x) { /* dibatalkan pengguna */ } return; }
    const b = e.target.closest("[data-jm-salin]");
    if (!b) return;
    try { await navigator.clipboard.writeText(b.dataset.jmSalin); kabar(t("aksi.disalin")); } catch (x) { kabar(t("aksi.gagal")); }
  });
}

/* "Lihat semua": pil lembut brand di kanan bawah kartu, tanpa panah (pemilik 8 Nov 2026). href kosong = penanda (span) untuk dipakai di dalam kartu bertaut.
   Pakai sebagai kakiHtml exHtml: lihatSemuaHtml("/proyek?teknologi=bayu", t("tk.lihat.proyek", { n })). */
export const lihatSemuaHtml = (href, label, n) => {
  const isi = `${ikon("daftar2", 16)}<span>${esc(n === undefined ? label : label.replace("{n}", n))}</span>`;
  return href ? `<a class="jm-lihat" href="${esc(href)}">${isi}</a>` : `<span class="jm-lihat">${isi}</span>`;
};

/* Panel "Terkait" (aturan pemilik 8 Nov 2026: semua halaman bertaut): entitas yang tersambung lewat id silang di data.
   Pemakaian: `await terkaitHtml("org", id)`; "" bila tak ada sambungan. kecuali = jenis yang dilewati (sudah tampil di seksi sendiri). */
const TERKAIT_URUT = [
  ["proyek", "proyek"],
  ["org", "direktori"],
  ["orang", "orang"],
  ["regulasi", "regulasi"],
  ["program", "analisis"],
  ["provinsi", "wilayah"],
  ["teknologi", "topik"],
  ["event", "kalender"],
  ["dokumen", "buku"],
  ["siaran", "siaran"],
  ["isu", "peringatan"],
  ["berita", "berita"],
];
const TERKAIT_TAMPIL = 9;
const KLS_STATUS = { berlaku: "jm-pil-ok", diubah: "jm-pil-warn", dicabut: "jm-pil-bad" };
const KECIL_NAMA = new Set(["dan", "di", "ke", "dari", "untuk", "of", "and", "the", "for"]);
/* nama organisasi: kapital penuh -> namaBaku; huruf kecil semua ("PT solar karya indonesia") -> Kapital Tiap Kata, PT/CV tetap kapital */
const rapi = (n) => {
  const b = namaBaku(n).nama;
  if (/[A-Z]/.test(b.replace(/^(PT|CV)\b/, "").replace(/^\W*\w/, "")) ) return b;
  return b.split(/(\s+)/).map((w, i) => (/^(pt|cv)\.?$/i.test(w) ? w.toUpperCase() : KECIL_NAMA.has(w) && i ? w : w.replace(/^(\W*)([a-z])/, (_, x, c) => x + c.toUpperCase()))).join("");
};
const kunciNama = (n) => String(n || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const inisialNama = (n) => ([...String(n || "").replace(/^(PT|CV)\.?\s+/i, "").split(/\s+/).slice(0, 2).map((w) => [...w][0] || "")].join("") || "?").toUpperCase();
const warna = (n) => 1 + [...String(n)].reduce((h, c) => h + c.charCodeAt(0), 0) % 5;
const gambar = (u) => (u ? `<img class="jm-tk-img" src="${esc(u)}" alt="" width="40" height="40" loading="lazy" decoding="async" data-galat="hapus">` : "");
const monogram = (n, u) => `<span class="jm-tk-lg jm-tk-mono jm-w${warna(n)}" aria-hidden="true">${esc(inisialNama(n))}${gambar(u)}</span>`;
const kartu = (href, lg, judul, meta, luar, ekstra = "") =>
  `<li class="jm-tk"><a class="jm-tk-a" href="${esc(href)}"${luar ? ' target="_blank" rel="noopener noreferrer"' : ""} title="${esc(judul)}">${lg}<span class="jm-tk-isi"><b class="jm-tk-j">${esc(judul)}</b>${meta ? `<span class="jm-tk-m">${meta}</span>` : ""}</span></a>${ekstra}</li>`;
const mutuKecil = (x) => `<small class="jm-tk-s">${x}</small>`;
/* satu kartu per jenis; mengembalikan { k: kunci dedup, tgl, mw, html } atau null */
function kartuTerkait(j, x, ik, bangun, rinci) {
  if (j === "berita") {
    const lok = x.media ? logoLokal(x.media) : "";
    const lg = `<span class="jm-tk-lg jm-tk-mono jm-w${warna(x.media || "")}" aria-hidden="true">${esc(inisialNama(namaMedia(x.media || x.nama)))}${gambar(lok)}</span>`;
    return { k: x.id || kunciNama(x.nama), n: kunciNama(x.nama), tgl: String(x.tgl || ""), html: kartu(x.url, lg, judulHuruf(x.nama), mutuKecil(esc([x.media ? namaMedia(x.media) : "", x.tgl ? tanggal(String(x.tgl).slice(0, 10)) : ""].filter(Boolean).join(", "))), true) };
  }
  const r = rinci(j, x);
  if (!r) return null;
  const tgl = String(r.tgl || "");
  if (j === "proyek") {
    const lg = `<span class="jm-tk-lg jm-tek-${esc(r.tek)}">${ikonTek(r.tek)}</span>`;
    const meta = `${r.prov ? mutuKecil(esc(r.prov)) : ""}${Number.isFinite(r.mw) ? mutuKecil(esc(angka(r.mw)) + " MW") : ""}${r.st ? pilStatus(r.st) : ""}`;
    return { k: r.id, n: kunciNama(r.nama), mw: r.mw || 0, html: kartu(r.href, lg, r.nama, meta) };
  }
  if (j === "org") {
    const nama = rapi(r.nama);
    return { k: r.id, n: kunciNama(nama), html: kartu(r.href, monogram(nama, logoOrg(r.id, r.nama, r.logo)[0]), nama, r.kat ? mutuKecil(esc(r.kat)) : "") };
  }
  if (j === "dokumen") {
    const pen = r.penerbit ? rapi(r.penerbit) : "";
    const lg = `<span class="jm-tk-lg jm-tk-dok">${ikon(r.jenis === "regulasi" ? "regulasi" : "pdf", 22)}</span>`;
    const meta = `${pen ? `<small class="jm-tk-s jm-tk-pen">${monogram(pen, logoOrg(null, r.penerbit)[0]).replace("jm-tk-lg", "jm-tk-lg jm-tk-kecil")}<span>${esc(pen)}</span></small>` : ""}${r.tgl ? mutuKecil(esc(String(r.tgl).slice(0, 4))) : ""}`;
    return { k: r.id, n: kunciNama(r.nama), tgl, html: kartu(r.href, lg, judulHuruf(r.nama), meta) };
  }
  const judul = judulHuruf(r.nama);
  const meta = (r.tgl ? mutuKecil(esc(tanggal(r.tgl))) : "") + (r.status && KLS_STATUS[r.status] ? `<span class="jm-pil ${KLS_STATUS[r.status]}">${esc(t("reg.status." + r.status))}</span>` : "");
  const lg = `<span class="jm-tk-lg jm-tk-dok">${ikon(ik, 22)}</span>`;
  const ekstra = j === "regulasi" ? unduhRegHtml({ url_pdf: r.pdf, url_sumber: r.sumber, judul: r.kode }) : "";
  return { k: r.id, n: kunciNama(r.kode ? r.kode + judul : judul), tgl, html: kartu(r.href, lg, r.kode ? r.kode + ": " + judul : judul, meta, false, ekstra) };
}
export async function terkaitHtml(jenis, id, { kecuali = [] } = {}) {
  const { hubungan, bangun, rinci } = await import("/inti/tautan.js");
  const h = await hubungan(jenis, id);
  const grup = [];
  for (const [j, ik] of TERKAIT_URUT) {
    if (!h[j]?.length || kecuali.includes(j)) continue;
    const lihat = new Set(), lihatN = new Set(), isi = [];
    for (const x of h[j]) {
      const k = kartuTerkait(j, x, ik, bangun, rinci);
      if (!k || lihat.has(k.k) || lihatN.has(k.n)) continue;
      lihat.add(k.k); lihatN.add(k.n); isi.push(k);
    }
    if (!isi.length) continue;
    /* relevansi: urutan graf (sambungan langsung dulu), lalu terbaru; proyek besar dulu */
    isi.sort((a, b) => (b.tgl || "").localeCompare(a.tgl || "") || (b.mw || 0) - (a.mw || 0));
    grup.push({ j, ik, isi });
  }
  if (!grup.length) return "";
  const tab = grup.map((g, i) => `<button type="button" role="tab" id="trt-${g.j}" aria-controls="trp-${g.j}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ""} data-trt="${g.j}">${ikon(g.ik, 18)}<span>${esc(t("terkait." + g.j))}</span><b>${esc(angka(g.isi.length))}</b></button>`).join("");
  const panel = grup.map((g, i) => {
    const li = g.isi.map((k, n) => (n >= TERKAIT_TAMPIL ? k.html.replace('class="jm-tk"', 'hidden class="jm-tk"') : k.html)).join("");
    const nav = g.isi.length > TERKAIT_TAMPIL ? paginasiHtml({ hal: 1, total: g.isi.length, per: TERKAIT_TAMPIL }) : "";
    return `<div class="jm-terkait-grup" role="tabpanel" id="trp-${g.j}" aria-labelledby="trt-${g.j}"${i ? " hidden" : ""} data-jm-total="${g.isi.length}"><ul class="jm-tk-kisi">${li}</ul>${nav}</div>`;
  }).join("");
  return exHtml({
    id: "terkait",
    ikon: "tautan",
    topik: t("terkait.ey"),
    judulHtml: esc(t("terkait.judul")),
    subHtml: esc(t("terkait.sub")),
    kelas: "jm-terkait",
    isiHtml: `<div class="jm-terkait-isi"><div class="jm-tab" role="tablist" aria-label="${esc(t("terkait.judul"))}">${tab}</div>${panel}</div>`,
  });
}

if (typeof document !== "undefined" && !window.__jmSemua) {
  window.__jmSemua = true;
  document.addEventListener("click", (e) => {
    const tb = e.target.closest(".jm-terkait [data-trt]");
    if (tb) {
      const akar = tb.closest(".jm-terkait");
      akar.querySelectorAll("[data-trt]").forEach((x) => { const on = x === tb; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; });
      akar.querySelectorAll(".jm-terkait-grup").forEach((g) => { g.hidden = g.id !== "trp-" + tb.dataset.trt; });
      return;
    }
    const b = e.target.closest(".jm-terkait-grup [data-hal]");
    if (!b || b.disabled) return;
    const g = b.closest(".jm-terkait-grup"), hal = +b.dataset.hal;
    g.querySelectorAll("li.jm-tr").forEach((li, i) => { li.hidden = i < (hal - 1) * TERKAIT_TAMPIL || i >= hal * TERKAIT_TAMPIL; });
    g.querySelector(".jm-pag").outerHTML = paginasiHtml({ hal, total: +g.dataset.jmTotal, per: TERKAIT_TAMPIL });
  });
}
