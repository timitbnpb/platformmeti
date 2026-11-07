import { mulaiHalaman } from "/inti/kepala.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, nanti, debounce, hantuHtml, galatHtml, ikon } from "/inti/umum.js";
import { cariHtml, pilihHtml, hapusHtml, hitungHtml } from "/inti/komponen.js";
import { volumeSvg, batangMendatar } from "/berita_grafik.js";
import { muat, label, urlAman, norm } from "/publik.js";

const LANJUT = 30;
const HARI = 86400000;
const S = { mode: "hari", tab: "berita", q: "", tek: "", media: "", periode: "", bahasa: "", n: LANJUT };
let B = null, V = null, ORG = new Map(), SEKARANG = Date.now();

const umur = (iso) => (SEKARANG - Date.parse(iso)) / HARI;
const tek = (k) => label("brt.tek.", k);
const baris = () => (S.tab === "berita" ? B : V);

function saring() {
  const q = norm(S.q.trim()), mak = S.periode ? +S.periode : 0;
  return baris().filter((r) => (!S.tek || (r.kepakaran || []).includes(S.tek)) && (!S.media || (r.media || r.kanal) === S.media)
    && (!S.bahasa || r.bahasa === S.bahasa) && (!mak || umur(r.terbit) <= mak) && (!q || r._cari.includes(q)));
}

function opsiTab() {
  const dari = (f) => [...new Set(baris().map(f).filter(Boolean))].sort((a, b) => a.localeCompare(b)).map((v) => [v, v]);
  return {
    tek: [["", t("brt.f.tek")], ...[...new Set(B.flatMap((r) => r.kepakaran || []))].map((k) => [k, tek(k)]).sort((a, b) => a[1].localeCompare(b[1]))],
    media: [["", t(S.tab === "berita" ? "brt.f.media" : "brt.f.kanal")], ...dari((r) => r.media || r.kanal)],
    periode: [["", t("brt.f.periode")], ...["7", "30", "90"].map((v) => [v, t("brt.p." + v)])],
    bahasa: [["", t("brt.f.bahasa")], ["id", t("brt.b.id")], ["en", t("brt.b.en")]],
  };
}
function gambarSaring() {
  const o = opsiTab();
  document.getElementById("saring").innerHTML = cariHtml({ id: "q", label: t("brt.cari") })
    + pilihHtml({ id: "tek", ikon: "topik", label: t("brt.f.tek"), opsi: o.tek, nilai: S.tek })
    + pilihHtml({ id: "media", ikon: "jenis", label: t(S.tab === "berita" ? "brt.f.media" : "brt.f.kanal"), opsi: o.media, nilai: S.media })
    + pilihHtml({ id: "periode", ikon: "tahun", label: t("brt.f.periode"), opsi: o.periode, nilai: S.periode })
    + pilihHtml({ id: "bahasa", ikon: "bahasa", label: t("brt.f.bahasa"), opsi: o.bahasa, nilai: S.bahasa })
    + hapusHtml({ id: "hapus", label: t("jm.hapus_filter") }) + hitungHtml({ id: "hitung", teks: "" });
  document.getElementById("q").value = S.q;
  aturSaring();
}
/** Teknologi dan bahasa hanya untuk berita (video tidak berlabel). */
function aturSaring() {
  const v = S.tab === "video";
  for (const id of ["tek", "bahasa"]) document.getElementById(id).closest("label").hidden = v;
  document.getElementById("hapus").hidden = !(S.q || S.tek || S.media || S.periode || (!v && S.bahasa));
}
function gambarTab() {
  document.getElementById("tab").innerHTML = ["berita", "video"].map((k) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${S.tab === k}">${ikon(k, 18)}<span>${esc(t("brt.tab." + k))}</span></button>`).join("");
}
function gambarTopik() {
  const n = new Map();
  for (const r of B) if (umur(r.terbit) <= 30) for (const k of r.kepakaran || []) n.set(k, (n.get(k) || 0) + 1);
  document.getElementById("topik").innerHTML = [...n].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 10)
    .map(([k, c]) => `<button type="button" class="brt-chip" data-topik="${esc(k)}" aria-pressed="${S.tek === k}">${esc(tek(k))} <b>${angka(c)}</b></button>`).join("");
}
function gambarRingkas() {
  const ak = B[0].terbit;
  document.getElementById("mode").innerHTML = ["hari", "minggu"].map((m) => `<button type="button" class="brt-chip" data-mode="${m}" aria-pressed="${S.mode === m}">${esc(t("brt.g.per_" + m))}</button>`).join("");
  document.getElementById("vol-h").textContent = t("brt.g.volume_" + S.mode);
  document.getElementById("volume").innerHTML = volumeSvg(B, S.mode, ak);
  const c = (f) => { const m = new Map(); for (const r of B) for (const k of f(r)) m.set(k, (m.get(k) || 0) + 1); return [...m].sort((a, b) => b[1] - a[1]); };
  document.getElementById("sebaran").innerHTML = batangMendatar(c((r) => r.kepakaran || []).slice(0, 8).map(([k, v]) => [tek(k), v, k]), "topik");
  document.getElementById("media-top").innerHTML = batangMendatar(c((r) => [r.media]).slice(0, 8).map(([k, v]) => [k, v, k]), "media");
}
function gambarAngka() {
  const item = (v, k) => `<div><dd>${angka(v)}</dd><dt>${esc(t(k))}</dt></div>`;
  document.getElementById("angka").innerHTML = item(B.length, "brt.n.berita") + item(new Set(B.map((r) => r.media)).size, "brt.n.media") + item(B.filter((r) => umur(r.terbit) <= 30).length, "brt.n.30") + item(V.length, "brt.n.video");
}

const inisial = (m) => { const p = m.replace(/^www\./, "").split(".")[0].replace(/[^a-z0-9]/gi, ""); return (p.slice(0, 2) || "?").toUpperCase(); };
const warna = (m) => [...m].reduce((a, c) => a + c.charCodeAt(0), 0) % 5;
const GRUP = [["hari", (u) => u < 1], ["minggu", (u) => u < 7], ["bulan", (u) => u < 30], ["lama", () => true]];
const grupDari = (iso) => { const u = umur(iso); return GRUP.find(([, f]) => f(u))[0]; };

function itemBerita(r) {
  const u = urlAman(r.url);
  const org = (r.organisasi_ids || []).map((id) => ORG.get(id)).filter(Boolean).slice(0, 3);
  const chips = (r.kepakaran || []).slice(0, 2).map((k) => `<button type="button" class="brt-tek" data-topik="${esc(k)}">${esc(tek(k))}</button>`).join("")
    + org.map((nama) => `<a class="brt-org" href="/direktori?tampil=lembaga">${esc(nama)}</a>`).join("");
  return `<li class="brt-item"><span class="brt-ubin brt-w${warna(r.media)}" aria-hidden="true">${esc(inisial(r.media))}</span>
    <div><a class="brt-judul" href="${esc(u)}" target="_blank" rel="noopener noreferrer" title="${esc(t("brt.buka"))}">${esc(r.judul)}</a>
    <p class="brt-meta"><span>${esc(r.media)}</span><span>${esc(tanggal(r.terbit))}</span></p></div>${chips ? `<div class="brt-label">${chips}</div>` : ""}</li>`;
}
function durasi(d) { const j = Math.floor(d / 3600), m = Math.floor((d % 3600) / 60), s = String(d % 60).padStart(2, "0"); return j ? `${j}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`; }
function itemVideo(r) {
  const lencana = r.jenis === "resmi" ? "jm-pil-ok" : "";
  return `<li><a class="brt-kartu" href="${esc(urlAman(r.url))}" target="_blank" rel="noopener noreferrer" title="${esc(t("brt.buka"))}">
    <span class="brt-gambar"><img src="https://i.ytimg.com/vi/${encodeURIComponent(r.id)}/mqdefault.jpg" width="320" height="180" alt="" loading="lazy" decoding="async">${r.durasi_detik ? `<span class="brt-durasi">${durasi(r.durasi_detik)}</span>` : ""}</span>
    <span class="brt-judul">${esc(r.judul)}</span>
    <span class="brt-meta"><span>${esc(r.kanal)}</span><span class="jm-pil ${lencana}">${esc(t("brt." + r.jenis))}</span><span>${esc(tanggal(r.terbit))}</span></span></a></li>`;
}

function gambarIsi() {
  const rows = saring();
  document.getElementById("hitung").textContent = t("brt.hitung", { n: angka(rows.length), total: angka(baris().length) });
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
  S.n = LANJUT; sinkron && sinkron(); aturSaring(); gambarTopik(); tulisUrl(); nanti(gambarIsi);
}

async function mulai() {
  document.getElementById("isi").innerHTML = hantuHtml(6);
  try {
    const [b, v] = await Promise.all([muat("berita"), muat("video")]);
    SEKARANG = Date.now();
    B = b.baris.map((r) => ({ ...r, _cari: norm(`${r.judul} ${r.media}`) })).sort((x, y) => y.terbit.localeCompare(x.terbit));
    V = v.baris.map((r) => ({ ...r, _cari: norm(`${r.judul} ${r.kanal}`) })).sort((x, y) => y.terbit.localeCompare(x.terbit));
    document.getElementById("sumber").textContent = `${t("brt.sumber")} ${tanggal(b.dibangun_pada)}.`;
  } catch { document.getElementById("isi").innerHTML = galatHtml(); return; }
  const p = new URLSearchParams(location.search);
  for (const k of Object.keys(S)) if (p.has(k) && k !== "n") S[k] = p.get(k);
  if (S.tab !== "video") S.tab = "berita";
  gambarAngka(); gambarRingkas(); gambarTab(); gambarSaring(); gambarTopik(); gambarIsi();
  muat("organisasi").then((o) => { ORG = new Map(o.baris.map((x) => [x.id, x.singkatan || x.nama])); gambarIsi(); }).catch(() => {});
}

(async () => {
  await mulaiHalaman();
  document.getElementById("isi").addEventListener("click", (e) => {
    if (e.target.closest("[data-aksi=ulang]")) return mulai();
    if (e.target.closest("[data-aksi=lagi]")) { S.n += LANJUT; return nanti(gambarIsi); }
    const c = e.target.closest("[data-topik]"); if (c) { ubah(() => { S.tek = c.dataset.topik; document.getElementById("tek").value = S.tek; }); }
  });
  document.getElementById("topik").addEventListener("click", (e) => {
    const c = e.target.closest("[data-topik]"); if (!c) return;
    ubah(() => { S.tab = "berita"; S.tek = S.tek === c.dataset.topik ? "" : c.dataset.topik; gambarTab(); gambarSaring(); });
  });
  document.getElementById("tab").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]"); if (!b || b.dataset.tab === S.tab) return;
    ubah(() => { S.tab = b.dataset.tab; S.media = ""; if (S.tab === "video") { S.tek = ""; S.bahasa = ""; } gambarTab(); gambarSaring(); });
  });
  document.getElementById("mode").addEventListener("click", (e) => { const b = e.target.closest("[data-mode]"); if (!b) return; S.mode = b.dataset.mode; for (const x of e.currentTarget.children) x.setAttribute("aria-pressed", String(x === b)); nanti(gambarRingkas); });
  document.getElementById("s00-h").closest("section").addEventListener("click", (e) => {
    const k = e.target.closest("[data-topik],[data-media]"); if (!k) return;
    ubah(() => { S.tab = "berita"; if (k.dataset.topik) S.tek = k.dataset.topik; else S.media = k.dataset.media; gambarTab(); gambarSaring(); });
    document.getElementById("s02-h").scrollIntoView({ block: "start" });
  });
  const cariTunda = debounce(() => ubah(() => {}), 120);
  const sr = document.getElementById("saring");
  sr.addEventListener("input", (e) => { if (e.target.id === "q") { S.q = e.target.value; cariTunda(); } });
  sr.addEventListener("change", (e) => { const k = e.target.id; if (k in S && k !== "q") ubah(() => { S[k] = e.target.value; }); });
  sr.addEventListener("click", (e) => { if (e.target.closest("#hapus")) ubah(() => { Object.assign(S, { q: "", tek: "", media: "", periode: "", bahasa: "" }); gambarSaring(); }); });
  await mulai();
})();
