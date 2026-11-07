/* /jejaring: graf pengetahuan yang bisa dijelajahi. Simpul dan sisi dari grafJejaring() (inti/tautan.js), graf yang sama dengan panel Terkait.
   Layout gaya-pegas sederhana dihitung sekali per tampilan (tanpa pustaka); jumlah simpul dibatasi MAKS. */
import { mulaiHalaman } from "/inti/kepala.js";
import { khUbin } from "/inti/kh.js";
import { t, angka, ada } from "/i18n.js";
import { esc, ikon, hantuHtml, nanti } from "/inti/umum.js";
import { cariHtml, hitungHtml } from "/inti/komponen.js";
import { grafJejaring, bangun } from "/inti/tautan.js";
import { geserPanel } from "/inti/panel_geser.js";

const JENIS = ["org", "pendana", "proyek", "provinsi", "regulasi", "orang"];
const IKON = { org: "direktori", pendana: "analisis", proyek: "proyek", provinsi: "wilayah", regulasi: "regulasi", orang: "orang" };
const MAKS = 140, L = 1000, H = 620;
let G, S = { aktif: new Set(JENIS), q: "", pilih: null }, tetangga, derajat;

const kunciTaut = (n) => [n.j === "pendana" ? "org" : n.j, n.id];
const norm = (s) => String(s ?? "").toLowerCase();

function pilihTampil() {
  const aktif = G.simpul.filter((n) => S.aktif.has(n.j) && derajat.get(n.k));
  const pakai = new Map();
  const tambah = (n) => pakai.set(n.k, n);
  if (S.q) aktif.filter((n) => norm(n.nama).includes(S.q)).slice(0, 30).forEach((n) => { tambah(n); for (const m of tetangga.get(n.k) || []) if (S.aktif.has(m.n.j)) tambah(m.n); });
  else aktif.sort((a, b) => derajat.get(b.k) - derajat.get(a.k)).slice(0, MAKS).forEach(tambah);
  if (S.pilih) { tambah(S.pilih); for (const m of tetangga.get(S.pilih.k) || []) if (S.aktif.has(m.n.j)) tambah(m.n); }
  return [...pakai.values()].slice(0, MAKS + 60);
}

function tata(nodes, edges) {
  let r = 7;
  const rand = () => (r = (r * 16807) % 2147483647) / 2147483647;
  const P = nodes.map((n, i) => ({ n, x: L / 2 + (rand() - 0.5) * 600, y: H / 2 + (rand() - 0.5) * 400, vx: 0, vy: 0 }));
  const ix = new Map(P.map((p, i) => [p.n.k, i]));
  const E = edges.map((e) => [ix.get(e.a), ix.get(e.b)]);
  for (let it = 0; it < 220; it++) {
    const kuat = 1 - it / 240;
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      const dx = P[i].x - P[j].x, dy = P[i].y - P[j].y, d2 = dx * dx + dy * dy + 30, f = 2600 / d2;
      const d = Math.sqrt(d2); P[i].vx += (dx / d) * f; P[i].vy += (dy / d) * f; P[j].vx -= (dx / d) * f; P[j].vy -= (dy / d) * f;
    }
    for (const [a, b] of E) {
      const dx = P[b].x - P[a].x, dy = P[b].y - P[a].y, d = Math.sqrt(dx * dx + dy * dy) + 0.01, f = (d - 70) * 0.02;
      P[a].vx += (dx / d) * f; P[a].vy += (dy / d) * f; P[b].vx -= (dx / d) * f; P[b].vy -= (dy / d) * f;
    }
    for (const p of P) {
      p.vx += (L / 2 - p.x) * 0.004; p.vy += (H / 2 - p.y) * 0.006;
      p.x = Math.min(L - 30, Math.max(30, p.x + p.vx * kuat)); p.y = Math.min(H - 20, Math.max(20, p.y + p.vy * kuat));
      p.vx *= 0.6; p.vy *= 0.6;
    }
  }
  return P;
}

function gambarGraf() {
  const nodes = pilihTampil(), pak = new Set(nodes.map((n) => n.k));
  const edges = G.sisi.filter((e) => pak.has(e.a) && pak.has(e.b));
  const P = tata(nodes, edges), at = new Map(P.map((p) => [p.n.k, p]));
  const tampilLabel = (p) => S.pilih?.k === p.n.k || S.q || derajat.get(p.n.k) >= 14;
  const garis = edges.map((e) => { const a = at.get(e.a), b = at.get(e.b), sorot = S.pilih && (e.a === S.pilih.k || e.b === S.pilih.k); return `<line class="jj-sisi${sorot ? " jj-sorot" : ""}" data-a="${esc(e.a)}" data-b="${esc(e.b)}" x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"/>`; }).join("");
  const bulat = P.map((p) => {
    const r = 5 + Math.sqrt(derajat.get(p.n.k) || 1) * 1.8, on = S.pilih?.k === p.n.k;
    return `<g class="jj-n jj-n-${p.n.j}${on ? " jj-on" : ""}" data-k="${esc(p.n.k)}" tabindex="0" role="button" aria-label="${esc(p.n.nama)}"><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${r.toFixed(1)}"/><title>${esc(p.n.nama)}</title>${tampilLabel(p) ? `<text x="${p.x.toFixed(1)}" y="${(p.y + r + 11).toFixed(1)}" text-anchor="middle">${esc(p.n.nama.length > 28 ? p.n.nama.slice(0, 27) + "..." : p.n.nama)}</text>` : ""}</g>`;
  }).join("");
  document.getElementById("jjKanvas").innerHTML = nodes.length ? `<svg class="jj-svg" viewBox="0 0 ${L} ${H}" role="img" aria-label="${esc(t("jj.graf"))}">${garis}${bulat}</svg>` : `<p class="jm-kosong">${esc(t("jj.kosong"))}</p>`;
  document.getElementById("jjKet").textContent = t("jj.ket", { n: angka(nodes.length), m: angka(edges.length), maks: angka(MAKS) });
  document.getElementById("jjHitung").textContent = t("jj.hitung", { n: angka(nodes.length), total: angka(derajat.size) });
}

function gambarPanel() {
  const el = document.getElementById("jjPanelIsi"), n = S.pilih;
  document.getElementById("jjPanel").hidden = !n; /* panel muncul saat simpul diklik */
  if (!n) { el.innerHTML = ""; return; }
  const [j, id] = kunciTaut(n);
  const grup = new Map();
  for (const m of tetangga.get(n.k) || []) { if (!grup.has(m.n.j)) grup.set(m.n.j, []); grup.get(m.n.j).push(m); }
  const peran = (r) => (r && ada("pf.peran." + r) ? ` <small>${esc(t("pf.peran." + r))}</small>` : "");
  el.innerHTML = `<h3>${ikon(IKON[n.j], 18)}<span>${esc(n.nama)}</span></h3><p><span class="jm-pil">${esc(t("jj.k." + n.j))}</span>${n.info ? ` <small>${esc(n.info)}</small>` : ""}</p>
<p class="jj-profil">${bangun(j, id, t("jj.buka"))}</p>
${[...grup].map(([jn, arr]) => `<section><h4>${esc(t("jj.k." + jn))} <b>${arr.length}</b></h4><ul>${arr.slice(0, 12).map((m) => `<li><button type="button" class="jj-tombol" data-k="${esc(m.n.k)}">${esc(m.n.nama)}</button>${peran(m.r)}</li>`).join("")}${arr.length > 12 ? `<li class="jm-bantu">${esc(t("terkait.lagi", { n: arr.length - 12 }))}</li>` : ""}</ul></section>`).join("") || `<p class="jm-bantu">${esc(t("jj.tanpa"))}</p>`}`;
}

function gambarSaring() {
  const tot = new Map(JENIS.map((j) => [j, G.simpul.filter((n) => n.j === j && derajat.get(n.k)).length]));
  document.getElementById("jjSaring").innerHTML = cariHtml({ id: "jjQ", label: t("jj.cari") }) + `<div class="jj-jenis" role="group" aria-label="${esc(t("jj.jenis"))}">${JENIS.map((j) => `<button type="button" class="jj-chip jj-n-${j}" data-j="${j}" aria-pressed="${S.aktif.has(j)}">${ikon(IKON[j], 16)}<span>${esc(t("jj.k." + j))}</span><b>${angka(tot.get(j))}</b></button>`).join("")}</div>` + hitungHtml({ id: "jjHitung", teks: "" });
  document.getElementById("jjQ").value = S.q;
}

function semua() { gambarGraf(); gambarPanel(); }
/* Kendali urgent (panel, penanda, kelas), subtree berat (tata letak + SVG) ditunda ke frame berikut. */
function tundaGraf() { clearTimeout(tundaGraf.d); tundaGraf.d = setTimeout(() => nanti(gambarGraf), 0); }
function sorotPilih() {
  for (const g of document.querySelectorAll("#jjKanvas .jj-n")) g.classList.toggle("jj-on", g.dataset.k === S.pilih?.k);
  for (const l of document.querySelectorAll("#jjKanvas .jj-sisi")) l.classList.toggle("jj-sorot", !!S.pilih && (l.dataset.a === S.pilih.k || l.dataset.b === S.pilih.k));
}

async function mulai() {
  document.getElementById("jjKanvas").innerHTML = hantuHtml(6);
  G = await grafJejaring();
  tetangga = new Map(); derajat = new Map();
  const per = new Map(G.simpul.map((n) => [n.k, n]));
  for (const e of G.sisi) {
    for (const [x, y] of [[e.a, e.b], [e.b, e.a]]) { if (!tetangga.has(x)) tetangga.set(x, []); tetangga.get(x).push({ n: per.get(y), r: e.r }); derajat.set(x, (derajat.get(x) || 0) + 1); }
  }
  G.per = per;
  khUbin("ubin", [{ ikon: "direktori", nilai: angka(G.simpul.filter((n) => n.j === "org" || n.j === "pendana").length), label: t("jj.k.org") }, { ikon: "proyek", nilai: angka(G.simpul.filter((n) => n.j === "proyek").length), label: t("jj.k.proyek") }, { ikon: "tautan", nilai: angka(G.sisi.length), label: t("jj.sisi") }]);
  gambarSaring();
  semua();
  const dok = document.getElementById("jjSaring");
  dok.addEventListener("input", (e) => { if (e.target.id !== "jjQ") return; clearTimeout(mulai.d); mulai.d = setTimeout(() => { S.q = norm(e.target.value.trim()); gambarPanel(); tundaGraf(); }, 160); });
  dok.addEventListener("click", (e) => {
    const b = e.target.closest(".jj-chip"); if (!b) return;
    S.aktif.has(b.dataset.j) ? S.aktif.delete(b.dataset.j) : S.aktif.add(b.dataset.j);
    b.setAttribute("aria-pressed", String(S.aktif.has(b.dataset.j))); tundaGraf();
  });
  const pilih = (e) => {
    const k = e.target.closest("[data-k]")?.dataset.k; if (!k || (e.type === "keydown" && e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault(); S.pilih = G.per.get(k); gambarPanel();
    if (document.querySelector(`#jjKanvas .jj-n[data-k="${CSS.escape(k)}"]`)) sorotPilih(); else tundaGraf(); // simpul sudah tampil: cukup sorot, tanpa tata ulang
  };
  geserPanel(document.getElementById("jjPanel"), { kunci: "panel", batas: document.querySelector(".jj-kisi") });
  for (const id of ["jjKanvas", "jjPanelIsi"]) { const el = document.getElementById(id); el.addEventListener("click", pilih); el.addEventListener("keydown", pilih); }
  document.addEventListener("jm:bahasa", () => { gambarSaring(); semua(); });
}
mulaiHalaman().then(mulai);
