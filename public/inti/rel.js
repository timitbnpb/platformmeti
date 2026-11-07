/* Rel navigasi seksi (pemilik 7 Nov 2026): rel mengambang di kanan (>=1280px) berisi ikon per seksi, label muncul saat disorot,
   seksi yang sedang dibaca menyala; di layar kecil satu tombol mengambang di pojok bawah membuka daftar seksi.
   Otomatis di semua halaman: mengambil section/article ber-id yang punya judul (h2/h3 .jm-ex-j). Minimal 3 seksi. */
import { esc, ikon } from "/inti/umum.js";
import { t } from "/i18n.js";

const PILIH = "main section[id], main article.jm-ex[id], main section.jm-ex[id], main .jm-ex[id]";
const judul = (el) => (el.dataset.relLabel || el.querySelector(".jm-ex-ey")?.textContent || el.querySelector("h2, .jm-ex-j, h3")?.textContent || "").trim().replace(/\s+/g, " ");
/* ikon dari kata kunci judul bila seksi tak menyebut ikon sendiri, supaya tiap butir rel berbeda */
const KATA_IKON = [[/peta|lokasi|wilayah|provinsi|sebaran/i, "peta"], [/proyek|pembangkit/i, "proyek"], [/regulasi|aturan|hukum|kebijakan|perda/i, "regulasi"], [/berita|media/i, "berita"], [/kalender|agenda|acara|jadwal/i, "kalender"], [/tren|volume|waktu|tahun/i, "analisis"], [/rantai|pabrik|pasok/i, "rantai"], [/asean|negara/i, "asean"], [/metode|cara|sumber/i, "metode"], [/organisasi|pengurus|struktur|anggota|mitra|tim|orang|pakar|siapa/i, "orang"], [/tentang|mengapa|kontak|faq|pertanyaan/i, "info"], [/teknologi|surya|energi/i, "tek-surya"], [/emisi|karbon/i, "tek-panas"], [/data|dataset|angka|ringkas|kondisi|insight|temuan/i, "insight"], [/akses|gabung|daftar/i, "kunci"]];
const ikonSeksi = (el) => {
  const sv = el.querySelector(".jm-ex-ey svg");
  if (el.dataset.relIkon) return ikon(el.dataset.relIkon, 18);
  if (sv) return sv.outerHTML;
  const j = judul(el); const k = KATA_IKON.find(([re]) => re.test(j));
  return ikon(k ? k[1] : "daftar", 18);
};

function kumpul() {
  const lihat = new Set();
  return [...document.querySelectorAll(PILIH)].filter((el) => {
    if (lihat.has(el.id) || el.closest("dialog") || el.hidden || el.dataset.rel === "tidak") return false;
    // seksi bersarang: ambil yang terluar saja
    if ([...lihat].some((id) => document.getElementById(id)?.contains(el))) return false;
    const j = judul(el); if (!j) return false;
    lihat.add(el.id); return true;
  });
}

let rel, tombol, daftar, pengamat;
function bangun() {
  const seksi = kumpul();
  rel?.remove(); tombol?.remove(); daftar?.remove(); pengamat?.disconnect();
  document.documentElement.classList.toggle("jm-ada-rel", seksi.length >= 3);
  if (seksi.length < 3) return;
  const item = (el) => `<a href="#${esc(el.id)}" data-rel="${esc(el.id)}"><span class="jm-rel-ik">${ikonSeksi(el)}</span><span class="jm-rel-l">${esc(judul(el))}</span></a>`;
  rel = document.createElement("nav");
  rel.className = "jm-rel"; rel.setAttribute("aria-label", t("jm.rel"));
  rel.innerHTML = `<span class="jm-rel-garis" aria-hidden="true"><i></i></span>${seksi.map(item).join("")}`;
  tombol = document.createElement("button");
  tombol.type = "button"; tombol.className = "jm-rel-fab"; tombol.setAttribute("aria-expanded", "false");
  tombol.setAttribute("aria-label", t("jm.rel")); tombol.innerHTML = ikon("daftar", 20);
  daftar = document.createElement("nav");
  daftar.className = "jm-rel-lembar"; daftar.hidden = true; daftar.setAttribute("aria-label", t("jm.rel"));
  daftar.innerHTML = seksi.map(item).join("");
  document.body.append(rel, tombol, daftar);
  tombol.addEventListener("click", () => { const b = daftar.hidden; daftar.hidden = !b; tombol.setAttribute("aria-expanded", String(b)); });
  daftar.addEventListener("click", (e) => { if (e.target.closest("a")) { daftar.hidden = true; tombol.setAttribute("aria-expanded", "false"); } });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !daftar.hidden) { daftar.hidden = true; tombol.setAttribute("aria-expanded", "false"); tombol.focus(); } });
  const tanda = (id) => [rel, daftar].forEach((n) => n.querySelectorAll("a").forEach((a) => a.toggleAttribute("aria-current", a.dataset.rel === id)));
  const garis = rel.querySelector(".jm-rel-garis i");
  pengamat = new IntersectionObserver((es) => {
    const v = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (!v) return;
    const i = seksi.indexOf(v.target); tanda(v.target.id);
    garis.style.height = `${((i + 1) / seksi.length) * 100}%`;
  }, { rootMargin: "-30% 0px -60% 0px" });
  seksi.forEach((el) => pengamat.observe(el));
}

let tunda;
export function pasangRel() {
  const jalan = () => { clearTimeout(tunda); tunda = setTimeout(bangun, 300); };
  jalan();
  // halaman merender seksi secara malas; bangun ulang saat jumlah seksi berubah
  let n = 0;
  new MutationObserver(() => { const m = kumpul().length; if (m !== n) { n = m; jalan(); } }).observe(document.querySelector("main") || document.body, { childList: true, subtree: true });
}
