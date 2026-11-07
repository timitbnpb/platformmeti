import { mulaiHalaman } from "/inti/kepala.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, nanti, debounce, hantuHtml, galatHtml, ikon } from "/inti/umum.js";
import { cariHtml, pilihHtml, hapusHtml, hitungHtml } from "/inti/komponen.js";
import { volumeSvg, batangMendatar } from "/berita_grafik.js";
import { muat, label, urlAman, norm } from "/publik.js";

const LANJUT = 30;
const HARI = 86400000;
const S = { mode: "hari", tab: "berita", q: "", tek: "", media: "", periode: "", bahasa: "", n: LANJUT };
let B = null, V = null, FOTO = {}, ORG = new Map(), SEKARANG = Date.now();

const umur = (iso) => (SEKARANG - Date.parse(iso)) / HARI;
const tek = (k) => label("brt.tek.", k);
const baris = () => (S.tab === "berita" ? B : V);

function saring() {
  const q = norm(S.q.trim()), mak = S.periode ? +S.periode : 0;
  return baris().filter((r) => (!S.tek || (r.kepakaran || []).some((k) => S.tek.split(",").includes(k))) && (!S.media || (r.media || r.kanal) === S.media)
    && (!S.bahasa || r.bahasa === S.bahasa) && (!mak || umur(r.terbit) <= mak) && (!q || r._cari.includes(q)));
}

function opsiTab() {
  const dari = (f) => [...new Set(baris().map(f).filter(Boolean))].sort((a, b) => a.localeCompare(b)).map((v) => [v, v]);
  return {
    tek: [["", t("brt.f.tek")], ...[...new Set(B.flatMap((r) => r.kepakaran || []))].map((k) => [k, tek(k)]).sort((a, b) => a[1].localeCompare(b[1])), ...(S.tek.includes(",") ? [[S.tek, S.tek.split(",").map(tek).join(" + ")]] : [])],
    media: [["", t(S.tab === "berita" ? "brt.f.media" : "brt.f.kanal")], ...dari((r) => r.media || r.kanal)],
    periode: [["", t("brt.f.periode")], ...["7", "30", "90"].map((v) => [v, t("brt.p." + v)])],
    bahasa: [["", t("brt.f.bahasa")], ["id", t("brt.b.id")], ["en", t("brt.b.en")]],
  };
}
function gambarSaring() {
  const o = opsiTab();
  document.getElementById("saring").innerHTML = cariHtml({ id: "f-q", label: t("brt.cari") })
    + pilihHtml({ id: "f-tek", ikon: "topik", label: t("brt.f.tek"), opsi: o.tek, nilai: S.tek })
    + pilihHtml({ id: "f-media", ikon: "jenis", label: t(S.tab === "berita" ? "brt.f.media" : "brt.f.kanal"), opsi: o.media, nilai: S.media })
    + pilihHtml({ id: "f-periode", ikon: "tahun", label: t("brt.f.periode"), opsi: o.periode, nilai: S.periode })
    + pilihHtml({ id: "f-bahasa", ikon: "bahasa", label: t("brt.f.bahasa"), opsi: o.bahasa, nilai: S.bahasa })
    + hapusHtml({ id: "f-hapus", label: t("jm.hapus_filter") }) + hitungHtml({ id: "f-hitung", teks: "" });
  document.getElementById("f-q").value = S.q;
  aturSaring();
}
/** Teknologi dan bahasa hanya untuk berita (video tidak berlabel). */
function aturSaring() {
  const v = S.tab === "video";
  for (const id of ["f-tek", "f-bahasa"]) document.getElementById(id).closest("label").hidden = v;
  document.getElementById("f-hapus").hidden = !(S.q || S.tek || S.media || S.periode || (!v && S.bahasa));
}
function gambarTab() {
  document.getElementById("tab").innerHTML = ["berita", "video"].map((k) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${S.tab === k}">${ikon(k, 18)}<span>${esc(t("brt.tab." + k))}</span></button>`).join("");
}
function gambarAngka() {
  const item = (v, k) => `<div><dd>${angka(v)}</dd><dt>${esc(t(k))}</dt></div>`;
  document.getElementById("angka").innerHTML = item(B.length, "brt.n.berita") + item(new Set(B.map((r) => r.media)).size, "brt.n.media") + item(B.filter((r) => umur(r.terbit) <= 30).length, "brt.n.30") + item(V.length, "brt.n.video");
}

const FOTO_URL = (r) => urlAman(FOTO[r.id] || "");
const IKON_TEK = { surya: "tek-surya", "panas-bumi": "tek-panas", bioenergi: "tek-bio", "biomassa-sampah": "tek-bio" };
const ikonTek = (r) => IKON_TEK[(r.kepakaran || [])[0]] || "tek-listrik";
/** Gambar sampul; tanpa foto = latar bermerek dengan ikon teknologi (tidak pernah inisial). Gambar gagal dimuat dicopot oleh penangan error. */
const sampul = (r, kelas, w, h) => { const f = FOTO_URL(r); return `<span class="brt-sampul ${kelas}">${ikon(ikonTek(r), 28)}${f ? `<img src="${esc(f)}" width="${w}" height="${h}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : ""}</span>`; };
const tautan = (r, isi, kelas) => `<a class="${kelas}" href="${esc(urlAman(r.url))}" target="_blank" rel="noopener noreferrer" title="${esc(t("brt.buka"))}">${isi}</a>`;
const metaHtml = (r) => `<p class="brt-meta"><span>${esc(r.media)}</span><span>${esc(tanggal(r.terbit.slice(0, 10)))}</span></p>`;
const tagHtml = (r, n = 2) => (r.kepakaran || []).slice(0, n).map((k) => `<button type="button" class="brt-tek" data-topik="${esc(k)}">${esc(tek(k))}</button>`).join("");
const orgHtml = (r) => (r.organisasi_ids || []).map((id) => ORG.get(id)).filter(Boolean).slice(0, 2).map((nama) => `<a class="brt-org" href="/direktori?tampil=lembaga">${esc(nama)}</a>`).join("");
const kartu = (r) => `<li class="brt-kartu-b">${tautan(r, sampul(r, "brt-s169", 400, 250), "brt-gbr")}<div class="brt-isi">${tautan(r, esc(r.judul), "brt-judul")}${metaHtml(r)}<div class="brt-label">${tagHtml(r)}</div></div></li>`;
const kecil = (r) => `<li class="brt-kecil">${tautan(r, sampul(r, "brt-s32", 96, 64), "brt-gbr")}<div>${tautan(r, esc(r.judul), "brt-judul")}${metaHtml(r)}</div></li>`;
const BAGIAN = [["surya", ["surya"]], ["panas", ["panas-bumi"]], ["bio", ["bioenergi", "biomassa-sampah"]], ["kebijakan", ["kebijakan", "pembiayaan", "transisi-adil"]]];
const dalamBagian = (ks) => B.filter((r) => umur(r.terbit) <= 90 && (r.kepakaran || []).some((k) => ks.includes(k)));
const urutFoto = (xs) => [...xs.filter(FOTO_URL), ...xs.filter((r) => !FOTO_URL(r))];
const kepalaBagian = (no, kunci, p, lihat) => `<header class="jm-sh brt-sh"><div><p class="jm-eyebrow"><span class="jm-kotak" aria-hidden="true"></span><span><b>${no}</b> ${esc(t("brt.sek." + kunci))}</span></p><h2>${esc(t("brt.sek." + kunci))}</h2><p class="brt-lead">${esc(p)}</p></div>${lihat || ""}</header>`;
function gambarBagian() {
  const el = document.getElementById("bagian"), terbaru = B.filter((r) => umur(r.terbit) <= 90);
  const sor = urutFoto(B.slice(0, 40)).slice(0, 5), [lead, ...sisi] = sor;
  let html = `<section class="brt-bagian"><div class="jm-wadah">${kepalaBagian("01", "sorotan", t("brt.sek.sorotan.p"))}
    <div class="brt-sorot"><article class="brt-lead-k">${tautan(lead, sampul(lead, "brt-s169", 800, 450), "brt-gbr")}<div class="brt-isi">${tautan(lead, esc(lead.judul), "brt-judul brt-judul-b")}${metaHtml(lead)}<div class="brt-label">${tagHtml(lead, 3)}${orgHtml(lead)}</div></div></article>
    <ul class="brt-sisi">${sisi.map(kecil).join("")}</ul></div></div></section>`;
  BAGIAN.forEach(([kunci, ks], i) => {
    const xs = dalamBagian(ks); if (!xs.length) return;
    const lihat = `<button type="button" class="brt-semua" data-lihat="${esc(ks.join(","))}">${esc(t("brt.lihat", { n: angka(xs.length) }))}</button>`;
    html += `<section class="brt-bagian"><div class="jm-wadah">${kepalaBagian(String(i + 2).padStart(2, "0"), kunci, t("brt.sek.p", { n: angka(xs.length) }), lihat)}<ul class="brt-grid-k">${urutFoto(xs.slice(0, 16)).slice(0, 4).map(kartu).join("")}</ul></div></section>`;
  });
  el.innerHTML = html;
}
const GRUP = [["hari", (u) => u < 1], ["minggu", (u) => u < 7], ["bulan", (u) => u < 30], ["lama", () => true]];
const grupDari = (iso) => { const u = umur(iso); return GRUP.find(([, f]) => f(u))[0]; };

function itemBerita(r) {
  const chips = tagHtml(r) + orgHtml(r);
  return `<li class="brt-item">${tautan(r, sampul(r, "brt-s32", 96, 64), "brt-gbr")}<div>${tautan(r, esc(r.judul), "brt-judul")}${metaHtml(r)}${chips ? `<div class="brt-label">${chips}</div>` : ""}</div></li>`;
}
function durasi(d) { const j = Math.floor(d / 3600), m = Math.floor((d % 3600) / 60), s = String(d % 60).padStart(2, "0"); return j ? `${j}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`; }
function itemVideo(r) {
  const lencana = r.jenis === "resmi" ? "jm-pil-ok" : "";
  return `<li><a class="brt-kartu" href="${esc(urlAman(r.url))}" target="_blank" rel="noopener noreferrer" title="${esc(t("brt.buka"))}">
    <span class="brt-gambar"><img src="https://i.ytimg.com/vi/${encodeURIComponent(r.id)}/mqdefault.jpg" width="320" height="180" alt="" loading="lazy" decoding="async">${r.durasi_detik ? `<span class="brt-durasi">${durasi(r.durasi_detik)}</span>` : ""}</span>
    <span class="brt-judul">${esc(r.judul)}</span>
    <span class="brt-meta"><span>${esc(r.kanal)}</span><span class="jm-pil ${lencana}">${esc(t("brt." + r.jenis))}</span><span>${esc(tanggal(r.terbit.slice(0, 10)))}</span></span></a></li>`;
}

function gambarIsi() {
  const rows = saring();
  document.getElementById("f-hitung").textContent = t("brt.hitung", { n: angka(rows.length), total: angka(baris().length) });
  const el = document.getElementById("isi");
  if (!rows.length) { el.innerHTML = `<p class="brt-lead">${esc(t("brt.kosong"))}</p>`; return; }
  const potong = rows.slice(0, S.n);
  let html;
  if (S.tab === "video") html = `<ul class="brt-video">${potong.map(itemVideo).join("")}</ul>`;
  else {
    html = "";
    let g = "";
    for (const r of potong) {
      const k = grupDari(r.terbit);
      if (k !== g) { html += `${g ? "</ul>" : ""}<h3 class="brt-grup">${esc(t("brt.g." + k))}</h3><ul class="brt-daftar">`; g = k; }
      html += itemBerita(r);
    }
    html += "</ul>";
  }
  if (rows.length > S.n) html += `<div class="brt-lagi"><button type="button" class="jm-tbl" data-aksi="lagi">${esc(t("brt.lagi", { n: angka(Math.min(LANJUT, rows.length - S.n)) }))}</button></div>`;
  el.innerHTML = html;
}

function tulisUrl() {
  const u = new URL(location.href);
  for (const k of ["tab", "q", "tek", "media", "periode", "bahasa"]) { const v = S[k]; !v || (k === "tab" && v === "berita") ? u.searchParams.delete(k) : u.searchParams.set(k, v); }
  history.replaceState(null, "", u);
}
/** Chrome sinkron, daftar berat sesudah satu bingkai tercat. */
function ubah(sinkron) {
  S.n = LANJUT; sinkron && sinkron(); aturSaring(); tulisUrl(); nanti(gambarIsi);
}

async function mulai() {
  document.getElementById("isi").innerHTML = hantuHtml(6);
  try {
    const [b, v, f] = await Promise.all([muat("berita"), muat("video"), muat("berita_foto").catch(() => ({}))]);
    FOTO = f || {};
    SEKARANG = Date.now();
    B = b.baris.map((r) => ({ ...r, _cari: norm(`${r.judul} ${r.media}`) })).sort((x, y) => y.terbit.localeCompare(x.terbit));
    V = v.baris.map((r) => ({ ...r, _cari: norm(`${r.judul} ${r.kanal}`) })).sort((x, y) => y.terbit.localeCompare(x.terbit));
    document.getElementById("sumber").textContent = `${t("brt.sumber")} ${tanggal(b.dibangun_pada)}.`;
  } catch { document.getElementById("isi").innerHTML = galatHtml(); return; }
  const p = new URLSearchParams(location.search);
  for (const k of Object.keys(S)) if (p.has(k) && k !== "n") S[k] = p.get(k);
  if (S.tab !== "video") S.tab = "berita";
  gambarAngka(); gambarBagian(); gambarRingkas(); gambarTab(); gambarSaring(); gambarIsi();
  muat("organisasi").then((o) => { ORG = new Map(o.baris.map((x) => [x.id, x.singkatan || x.nama])); gambarBagian(); gambarIsi(); }).catch(() => {});
}

(async () => {
  await mulaiHalaman();
  document.getElementById("isi").addEventListener("click", (e) => {
    if (e.target.closest("[data-aksi=ulang]")) return mulai();
    if (e.target.closest("[data-aksi=lagi]")) { S.n += LANJUT; return nanti(gambarIsi); }
    const c = e.target.closest("[data-topik]"); if (c) { ubah(() => { S.tek = c.dataset.topik; document.getElementById("f-tek").value = S.tek; }); }
  });
  document.getElementById("tab").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]"); if (!b || b.dataset.tab === S.tab) return;
    ubah(() => { S.tab = b.dataset.tab; S.media = ""; if (S.tab === "video") { S.tek = ""; S.bahasa = ""; } gambarTab(); gambarSaring(); });
  });
  document.getElementById("mode").addEventListener("click", (e) => { const b = e.target.closest("[data-mode]"); if (!b) return; S.mode = b.dataset.mode; for (const x of e.currentTarget.children) x.setAttribute("aria-pressed", String(x === b)); nanti(gambarRingkas); });
  document.querySelector("main").addEventListener("click", (e) => {
    if (e.target.closest("#isi, #saring, #tab")) return;
    const k = e.target.closest("[data-topik],[data-media],[data-lihat]"); if (!k) return;
    ubah(() => { S.tab = "berita"; if (k.dataset.lihat) S.tek = k.dataset.lihat; else if (k.dataset.topik) S.tek = k.dataset.topik; else S.media = k.dataset.media; gambarTab(); gambarSaring(); });
    document.getElementById("s02-h").scrollIntoView({ block: "start" });
  });
  addEventListener("error", (e) => { if (e.target.tagName === "IMG" && e.target.closest(".brt-sampul")) e.target.remove(); }, true);
  const cariTunda = debounce(() => ubah(() => {}), 120);
  const sr = document.getElementById("saring");
  sr.addEventListener("input", (e) => { if (e.target.id === "f-q") { S.q = e.target.value; cariTunda(); } });
  sr.addEventListener("change", (e) => { const k = e.target.id.slice(2); if (e.target.id.startsWith("f-") && k in S && k !== "q") ubah(() => { S[k] = e.target.value; }); });
  sr.addEventListener("click", (e) => { if (e.target.closest("#f-hapus")) ubah(() => { Object.assign(S, { q: "", tek: "", media: "", periode: "", bahasa: "" }); gambarSaring(); }); });
  await mulai();
})();
