/* Exhibit "Pemangku kepentingan" di /p/<id>: graf interaktif (seret simpul, geser latar, zoom, klik simpul -> panel rinci) + daftar ringkas per peran.
   Data: /data/pemangku/<id>.json dari scripts/pipa/pemangku.mjs. Pemasok dan pakar = kandidat (garis putus, tingkat Hipotesis).
   Tata letak radial per peran (deterministik, tanpa pustaka); zoom lewat tombol atau Ctrl/Cmd + gulir (gulir polos tetap menggulir halaman). */
import { t, angka } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { exHtml, sumberHtml, unduhRegHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { logoOrg } from "/inti/logo_org.js";
import { geserPanel } from "/inti/panel_geser.js";

export const PERAN = ["pemilik", "pengembang", "epc", "operator", "pendana", "pembeli", "regulator", "pemasok", "pakar"];
export const IKON_PERAN = { pemilik: "gedung", pengembang: "proyek", epc: "palu", operator: "jam", pendana: "berlian", pembeli: "petir", regulator: "regulasi", pemasok: "pabrik", pakar: "wisuda" };
const IKON_JENIS = { org: "gedung", pendana: "berlian", orang: "orang", pemda: "wilayah", regulasi: "regulasi", proyek: "proyek" };
const R = { proyek: 38, org: 25, pendana: 25, pemda: 23, regulasi: 21, orang: 23 };
const TINGKAT = ["resmi", "kajian", "media", "hipotesis"];
const inisial = (n) => String(n || "?").replace(/^(PT|CV|Yayasan|Pemerintah|Kementerian)\.?\s+/i, "").split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();
const pendek = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const hrefNode = (n) => (n.href ? n.href : (n.j === "org" || n.j === "pendana") && n.id ? "/o/" + encodeURIComponent(n.id) : "");
const gambarNode = (n) => {
  if (n.j === "proyek") return [];
  if (n.lambang) return [n.lambang];
  if (n.iso) return [`/img/bendera/${String(n.iso).toLowerCase()}.svg`];
  if (n.j === "org" || n.j === "pendana") return logoOrg(n.id, n.nama, n.logo);
  if (n.j === "orang") return [`/img/orang/${n.id}.webp`, `/img/pakar/${n.id}.webp`];
  return [];
};

async function muatData(id) {
  try { const r = await fetch(`/data/pemangku/${encodeURIComponent(id)}.json`); return r.ok ? await r.json() : null; } catch { return null; }
}

/* ---------- tata letak ---------- */
function tata(G, W, H) {
  const pusat = "proyek:" + G.id, pos = new Map([[pusat, { x: W / 2, y: H / 2 }]]);
  const utama = new Map();
  for (const e of G.sisi) if (e.a === pusat && !utama.has(e.b)) utama.set(e.b, e.p);
  const grup = PERAN.map((r) => [r, [...utama].filter(([, p]) => p === r).map(([k]) => k)]).filter(([, a]) => a.length);
  const total = grup.reduce((s, [, a]) => s + a.length + 1.4, 0);
  const rx = Math.max(90, W / 2 - 78), ry = Math.max(120, H / 2 - 62);
  let ang = -Math.PI / 2 - ((grup[0]?.[1].length + 1.4) / total) * Math.PI;
  for (const [, ks] of grup) {
    const busur = ((ks.length + 1.4) / total) * Math.PI * 2;
    ks.forEach((k, i) => {
      const a = ang + busur * ((i + 0.7 + (ks.length > 1 ? 0 : 0.0)) / (ks.length + 1.4)), dalam = ks.length > 3 && i % 2 === 1 ? 0.64 : 1;
      pos.set(k, { x: W / 2 + Math.cos(a) * rx * dalam, y: H / 2 + Math.sin(a) * ry * dalam });
    });
    ang += busur;
  }
  const arr = [...pos].filter(([k]) => k !== pusat).map(([k, p]) => ({ k, ...p }));
  for (let it = 0; it < 60; it++) {
    for (let i = 0; i < arr.length; i++) {
      const c = pos.get(pusat);
      for (const [b, min] of [[c, 92], ...arr.slice(i + 1).map((o) => [o, 64])]) {
        const dx = arr[i].x - b.x, dy = arr[i].y - b.y, d = Math.hypot(dx, dy) || 0.01;
        if (d < min) { const g = (min - d) / 2 / d; arr[i].x += dx * g; arr[i].y += dy * g; if (b !== c) { b.x -= dx * g; b.y -= dy * g; } }
      }
      arr[i].x = Math.min(W - 44, Math.max(44, arr[i].x)); arr[i].y = Math.min(H - 52, Math.max(40, arr[i].y));
    }
  }
  for (const a of arr) pos.set(a.k, { x: a.x, y: a.y });
  return pos;
}

/* ---------- model ---------- */
function model(G) {
  const pusat = "proyek:" + G.id, per = new Map(G.simpul.map((n) => [n.k, { ...n, peran: new Map(), sisi: [] }]));
  for (const e of G.sisi) {
    const n = per.get(e.b); if (!n || e.a !== pusat) continue;
    n.sisi.push(e); n.peran.set(e.p, e);
  }
  for (const n of per.values()) if (n.k !== pusat && !n.sisi.length) per.delete(n.k);
  const sisi = G.sisi.filter((e) => per.has(e.a) && per.has(e.b));
  return { pusat, per, sisi, adaPeran: PERAN.filter((r) => [...per.values()].some((n) => n.peran.has(r))) };
}
const terbaik = (n) => [...n.peran.values()].sort((a, b) => TINGKAT.indexOf(a.t) - TINGKAT.indexOf(b.t))[0];
const peranUtama = (n) => PERAN.find((r) => n.peran.has(r));
const kandidat = (n) => [...n.peran.values()].every((e) => e.t === "hipotesis");

/* ---------- HTML statis ---------- */
function avatarHtml(n, u = 36) {
  const g = gambarNode(n);
  const awal = n.j === "regulasi" || n.j === "pemda" || n.j === "proyek" ? ikon(IKON_JENIS[n.j], Math.round(u * 0.55)) : esc(inisial(n.nama));
  return `<span class="pk-av pk-r-${esc(peranUtama(n) || "pemilik")}" data-jenis="${esc(n.j)}">${g.length ? `<img src="${esc(g[0])}" alt="" width="${u}" height="${u}" loading="lazy" decoding="async" data-pk-cad="${esc(g.slice(1).join("|"))}">` : ""}<span class="pk-av-i">${awal}</span></span>`;
}
const pilTingkat = (tk) => `<span class="pk-tingkat pk-t-${esc(tk)}">${esc(t("pk3.t." + tk))}</span>`;
const pilPeran = (r) => `<span class="pk-pil pk-r-${esc(r)}">${ikon(IKON_PERAN[r], 14)}<span>${esc(t("pk3.peran." + r))}</span></span>`;

function saringHtml(M) {
  const semua = `<button type="button" class="pk-chip pk-chip-semua" data-peran="" aria-pressed="true">${ikon("rantai", 16)}<span>${esc(t("pk3.semua"))}</span><b>${angka(M.per.size - 1)}</b></button>`;
  return `<div class="pk-saring" role="group" aria-label="${esc(t("pk3.saring"))}">${semua}${M.adaPeran.map((r) => `<button type="button" class="pk-chip pk-r-${r}" data-peran="${r}" aria-pressed="false">${ikon(IKON_PERAN[r], 16)}<span>${esc(t("pk3.peran." + r))}</span><b>${angka([...M.per.values()].filter((n) => n.peran.has(r)).length)}</b></button>`).join("")}</div>`;
}

function daftarHtml(M) {
  return `<div class="pk-daftar">${M.adaPeran.map((r) => {
    const ns = [...M.per.values()].filter((n) => n.peran.has(r));
    return `<section class="pk-blok pk-r-${r}" aria-label="${esc(t("pk3.peran." + r))}"><header class="pk-blok-hd">${ikon(IKON_PERAN[r], 18)}<h3>${esc(t("pk3.peran." + r))}</h3><b>${angka(ns.length)}</b></header><ul>${ns.map((n) => {
      const e = n.peran.get(r), h = hrefNode(n);
      return `<li>${avatarHtml(n, 30)}<span class="pk-li-t">${h ? `<a href="${esc(h)}">${esc(n.nama)}</a>` : `<b>${esc(n.nama)}</b>`}<small>${esc(e.c || n.info || n.judul || "")}</small></span>${pilTingkat(e.t)}</li>`;
    }).join("")}</ul></section>`;
  }).join("")}</div>`;
}

function kisiHtml(M, G) {
  const pilihLegenda = TINGKAT.map((k) => `<li>${pilTingkat(k)}</li>`).join("");
  return `<div class="pk-kisi" data-id="${esc(G.id)}">
<div class="pk-kanvas" id="pkKanvas" role="group" aria-label="${esc(t("pk3.graf", { nama: G.nama }))}"></div>
<div class="pk-kendali" role="group" aria-label="${esc(t("pk3.zoom"))}"><button type="button" class="pk-k" data-zoom="1" aria-label="${esc(t("pk3.zoom.masuk"))}" title="${esc(t("pk3.zoom.masuk"))}">${ikon("tambah", 18)}</button><button type="button" class="pk-k" data-zoom="-1" aria-label="${esc(t("pk3.zoom.keluar"))}" title="${esc(t("pk3.zoom.keluar"))}"><svg class="jm-ik" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg></button><button type="button" class="pk-k" data-zoom="0" aria-label="${esc(t("pk3.zoom.reset"))}" title="${esc(t("pk3.zoom.reset"))}">${ikon("peta", 18)}</button></div>
<ul class="pk-legenda" aria-label="${esc(t("pk3.legenda"))}"><li class="pk-leg-g"><svg width="30" height="8" aria-hidden="true"><line x1="0" y1="4" x2="30" y2="4" class="pk-sisi"/></svg>${esc(t("pk3.garis.penuh"))}</li><li class="pk-leg-g"><svg width="30" height="8" aria-hidden="true"><line x1="0" y1="4" x2="30" y2="4" class="pk-sisi pk-putus"/></svg>${esc(t("pk3.garis.putus"))}</li></ul>
<div class="pk-tip" id="pkTip" role="tooltip" hidden></div>
<aside class="pk-panel" id="pkPanel" hidden aria-live="polite"><header class="pk-panel-hd"><span>${esc(t("pk3.panel"))}</span><button type="button" class="pk-tutup" aria-label="${esc(t("pk3.tutup"))}">${ikon("tutup", 16)}</button></header><div class="pk-panel-isi" id="pkPanelIsi"></div></aside>
</div><ul class="pk-bukti-leg" aria-label="${esc(t("pk3.tingkat"))}">${pilihLegenda}</ul>`;
}

/* ---------- graf interaktif ---------- */
function pasangGraf(akar, G, M) {
  const kanvas = akar.querySelector("#pkKanvas"), tip = akar.querySelector("#pkTip"), panel = akar.querySelector("#pkPanel"), panelIsi = akar.querySelector("#pkPanelIsi");
  const kisi = akar.querySelector(".pk-kisi");
  let pos, W = 0, H = 0, tf = { x: 0, y: 0, k: 1 }, pilih = null, saring = "";
  const el = new Map(), garis = [];

  const apply = () => kanvas.querySelector(".pk-dunia")?.setAttribute("transform", `translate(${tf.x.toFixed(1)} ${tf.y.toFixed(1)}) scale(${tf.k.toFixed(3)})`);
  const zoomDi = (f, cx = W / 2, cy = H / 2) => { const k = Math.min(3, Math.max(0.5, tf.k * f)), r = k / tf.k; tf = { k, x: cx - (cx - tf.x) * r, y: cy - (cy - tf.y) * r }; apply(); };

  function gambar() {
    W = Math.round(kanvas.clientWidth) || 800; H = Math.round(kanvas.clientHeight) || 560;
    pos = tata(G, W, H); tf = { x: 0, y: 0, k: 1 }; el.clear(); garis.length = 0;
    const sisiSvg = M.sisi.map((e) => {
      const a = pos.get(e.a), b = pos.get(e.b); if (!a || !b) return "";
      return `<line class="pk-sisi pk-r-${esc(e.p)}${e.t === "hipotesis" ? " pk-putus" : ""}" data-a="${esc(e.a)}" data-b="${esc(e.b)}" data-p="${esc(e.p)}" x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"/>`;
    }).join("");
    const bulat = [...M.per.values()].map((n) => {
      const p = pos.get(n.k); if (!p) return "";
      const r = R[n.j] || 22, g = gambarNode(n), peran = peranUtama(n) || "pemilik", d = r * 2 - 8;
      const ik = n.j === "proyek" || n.j === "regulasi" || n.j === "pemda" ? `<use class="pk-n-ik" href="/img/ikon.svg#i-${n.j === "proyek" ? "proyek" : IKON_JENIS[n.j]}" x="${-r * 0.5}" y="${-r * 0.5}" width="${r}" height="${r}"/>` : `<text class="pk-n-ini" text-anchor="middle" dy=".35em">${esc(inisial(n.nama))}</text>`;
      const img = g.length ? `<image class="pk-n-img${n.lambang || n.iso ? " pk-n-bulat" : ""}" href="${esc(g[0])}" data-cad="${esc(g.slice(1).join("|"))}" x="${-d / 2}" y="${-d / 2}" width="${d}" height="${d}" preserveAspectRatio="${n.lambang || n.iso ? "xMidYMid slice" : "xMidYMid meet"}"/>` : "";
      const label = n.j === "proyek" ? pendek(n.nama, 26) : pendek(n.nama, 20);
      return `<g class="pk-n pk-j-${esc(n.j)} pk-r-${esc(peran)}${kandidat(n) ? " pk-kand" : ""}" data-k="${esc(n.k)}" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})" tabindex="0" role="button" aria-label="${esc(n.nama)}"><circle class="pk-n-c" r="${r}"/>${ik}${img}<text class="pk-n-l" text-anchor="middle" y="${r + 14}">${esc(label)}</text></g>`;
    }).join("");
    kanvas.innerHTML = `<svg class="pk-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("pk3.graf", { nama: G.nama }))}"><defs><clipPath id="pkBulat" clipPathUnits="objectBoundingBox"><circle cx=".5" cy=".5" r=".5"/></clipPath></defs><g class="pk-dunia"><g class="pk-sisi-g">${sisiSvg}</g><g class="pk-n-g">${bulat}</g></g></svg>`;
    for (const g of kanvas.querySelectorAll(".pk-n")) el.set(g.dataset.k, g);
    for (const l of kanvas.querySelectorAll(".pk-sisi")) garis.push(l);
    for (const i of kanvas.querySelectorAll(".pk-n-bulat")) i.setAttribute("clip-path", "url(#pkBulat)");
    tandai();
  }
  function tandai() {
    for (const [k, g] of el) {
      const n = M.per.get(k), cocok = !saring || k === M.pusat || n.peran.has(saring);
      g.classList.toggle("pk-redup", !cocok); g.classList.toggle("pk-on", pilih === k);
    }
    for (const l of garis) {
      const cocok = !saring || l.dataset.p === saring || l.dataset.a !== M.pusat;
      l.classList.toggle("pk-redup", !cocok || (saring && l.dataset.p !== saring && l.dataset.a === M.pusat));
      l.classList.toggle("pk-sorot", !!pilih && (l.dataset.a === pilih || l.dataset.b === pilih));
    }
    kanvas.classList.toggle("pk-ada-pilih", !!pilih);
  }
  function pindah(k, x, y) {
    pos.set(k, { x, y }); el.get(k)?.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    for (const l of garis) {
      if (l.dataset.a === k) { l.setAttribute("x1", x.toFixed(1)); l.setAttribute("y1", y.toFixed(1)); }
      if (l.dataset.b === k) { l.setAttribute("x2", x.toFixed(1)); l.setAttribute("y2", y.toFixed(1)); }
    }
  }
  function buka(k) {
    pilih = k; tandai();
    const n = k && M.per.get(k);
    panel.hidden = !n; if (!n) { panelIsi.innerHTML = ""; return; }
    const h = hrefNode(n);
    const baris = [...n.peran.values()].sort((a, b) => PERAN.indexOf(a.p) - PERAN.indexOf(b.p)).map((e) => `<li>${pilPeran(e.p)} ${pilTingkat(e.t)}${e.c ? `<small>${esc(e.c)}</small>` : ""}${(e.s || []).length ? `<span class="pk-src">${e.s.map((s) => `<a href="${esc(s.u)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 14)}<span>${esc(s.n || new URL(s.u).hostname.replace(/^www\./, ""))}</span></a>`).join("")}</span>` : ""}</li>`).join("");
    const reg = n.j === "regulasi" ? `<p class="pk-reg">${unduhRegHtml({ url_pdf: n.pdf, url_sumber: n.url, judul: n.nama })}<small>${esc(n.judul || "")}</small></p>` : "";
    const jejaring = (n.j === "org" || n.j === "pendana") && n.id ? `<a class="pk-tombol" href="/jejaring?org=${encodeURIComponent(n.id)}">${ikon("rantai", 16)}<span>${esc(t("pk3.jejaring"))}</span></a>` : "";
    panelIsi.innerHTML = `<div class="pk-p-kepala">${avatarHtml(n, 44)}<div><h3>${esc(n.nama)}</h3><p><span class="pk-jenis">${esc(t("pk3.j." + n.j))}</span>${n.info ? ` <small>${esc(n.info)}</small>` : ""}</p></div></div>${reg}${n.j === "proyek" ? "" : `<h4>${esc(t("pk3.peran_di"))}</h4><ul class="pk-p-peran">${baris}</ul>`}<p class="pk-p-aksi">${h ? `<a class="pk-tombol pk-utama" href="${esc(h)}">${ikon("tautan", 16)}<span>${esc(t("pk3.buka"))}</span></a>` : ""}${jejaring}</p>`;
  }
  function pasangGambarGalat() {
    kanvas.addEventListener("error", (e) => { const i = e.target; if (i.tagName?.toLowerCase() !== "image") return; const sisa = (i.dataset.cad || "").split("|").filter(Boolean); if (sisa.length) { i.setAttribute("href", sisa.shift()); i.dataset.cad = sisa.join("|"); } else i.remove(); }, true);
    akar.addEventListener("error", (e) => { const i = e.target; if (i.tagName !== "IMG" || !i.dataset.pkCad && i.dataset.pkCad !== "") return; const sisa = i.dataset.pkCad.split("|").filter(Boolean); if (sisa.length) { i.dataset.pkCad = sisa.slice(1).join("|"); i.src = sisa[0]; } else i.remove(); }, true);
  }

  /* interaksi penunjuk */
  let aksi = null;
  kanvas.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    const g = e.target.closest(".pk-n");
    aksi = { id: e.pointerId, g, k: g?.dataset.k, sx: e.clientX, sy: e.clientY, gerak: false, tf: { ...tf }, p: g ? { ...pos.get(g.dataset.k) } : null };
    kanvas.setPointerCapture?.(e.pointerId); tip.hidden = true;
  });
  kanvas.addEventListener("pointermove", (e) => {
    if (aksi && aksi.id === e.pointerId) {
      const dx = e.clientX - aksi.sx, dy = e.clientY - aksi.sy;
      if (!aksi.gerak && Math.hypot(dx, dy) < 4) return;
      aksi.gerak = true; kanvas.classList.add("pk-seret");
      if (aksi.g) pindah(aksi.k, aksi.p.x + dx / tf.k, aksi.p.y + dy / tf.k); else { tf.x = aksi.tf.x + dx; tf.y = aksi.tf.y + dy; apply(); }
      return;
    }
    const g = e.target.closest?.(".pk-n");
    if (!g) { tip.hidden = true; return; }
    const n = M.per.get(g.dataset.k), kr = kanvas.getBoundingClientRect();
    tip.innerHTML = `<b>${esc(n.nama)}</b><span class="pk-tip-j">${esc(t("pk3.j." + n.j))}</span>${[...n.peran.values()].map((x) => `<span class="pk-tip-b">${pilPeran(x.p)}${pilTingkat(x.t)}</span>`).join("")}${n.info ? `<small>${esc(n.info)}</small>` : ""}`;
    tip.hidden = false;
    tip.style.left = Math.min(kr.width - tip.offsetWidth - 8, Math.max(8, e.clientX - kr.left + 14)) + "px";
    tip.style.top = Math.min(kr.height - tip.offsetHeight - 8, Math.max(8, e.clientY - kr.top + 14)) + "px";
  });
  const akhir = (e) => {
    if (!aksi || aksi.id !== e.pointerId) return;
    const { g, gerak, k } = aksi; aksi = null; kanvas.classList.remove("pk-seret");
    if (!gerak && g) buka(k);
    else if (!gerak && !g && pilih) buka(null);
  };
  kanvas.addEventListener("pointerup", akhir); kanvas.addEventListener("pointercancel", akhir);
  kanvas.addEventListener("pointerleave", () => { tip.hidden = true; });
  kanvas.addEventListener("wheel", (e) => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); const kr = kanvas.getBoundingClientRect(); zoomDi(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - kr.left, e.clientY - kr.top); }, { passive: false });
  kanvas.addEventListener("dblclick", (e) => { if (e.target.closest(".pk-n")) return; const kr = kanvas.getBoundingClientRect(); zoomDi(1.4, e.clientX - kr.left, e.clientY - kr.top); });
  kanvas.addEventListener("keydown", (e) => { const g = e.target.closest?.(".pk-n"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); buka(g.dataset.k); } if (e.key === "Escape") buka(null); });
  akar.querySelector(".pk-kendali").addEventListener("click", (e) => {
    const b = e.target.closest("[data-zoom]"); if (!b) return;
    const z = +b.dataset.zoom; if (z === 0) { tf = { x: 0, y: 0, k: 1 }; apply(); } else zoomDi(z > 0 ? 1.3 : 1 / 1.3);
  });
  panel.querySelector(".pk-tutup").addEventListener("click", () => buka(null));
  akar.querySelector(".pk-saring").addEventListener("click", (e) => {
    const b = e.target.closest(".pk-chip"); if (!b) return;
    saring = saring === b.dataset.peran ? "" : b.dataset.peran;
    for (const c of akar.querySelectorAll(".pk-chip")) c.setAttribute("aria-pressed", String(c.dataset.peran === saring));
    tandai();
  });
  pasangGambarGalat();
  geserPanel(panel, { kunci: "pemangku", batas: kisi });
  gambar();
  let lebarAwal = W;
  new ResizeObserver(() => { const w = Math.round(kanvas.clientWidth); if (w && Math.abs(w - lebarAwal) > 24) { lebarAwal = w; gambar(); if (pilih) tandai(); } }).observe(kanvas);
  document.addEventListener("jm:bahasa", () => { /* teks panel mengikuti bahasa */ if (pilih) buka(pilih); });
}

/** Kembalikan { html, pasang(akar) }; html kosong bila proyek tak punya pemangku tercatat. */
export async function pemangkuSeksi(id, sumber = "") {
  const G = await muatData(id);
  if (!G || !G.sisi?.length) return { html: "", pasang() {} };
  const M = model(G);
  const jml = M.per.size - 1;
  const html = exHtml({
    id: "pemangku", ikon: "rantai", topik: t("pk3.ey"), judulHtml: hlHtml("pk3.j", angka(jml)), subHtml: esc(t("pk3.sub")),
    aksiHtml: aksiHtml({ csv: false }) + sumberHtml(`${esc(t("pk3.metode"))}${sumber ? `<br>${sumber}` : ""}`),
    isiHtml: `<div class="pk">${saringHtml(M)}${kisiHtml(M, G)}${daftarHtml(M)}</div>`,
  });
  return { html, pasang(akar) { const a = akar.querySelector("#pemangku .pk"); if (a) pasangGraf(a, G, M); } };
}
