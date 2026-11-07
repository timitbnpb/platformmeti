/* /wilayah: peta koroplet 38 provinsi + profil provinsi (?prov=XX). Data statis /data/wilayah.json. */
import { mulaiHalaman } from "/inti/kepala.js";
import { nanti, esc, hantuHtml } from "/inti/umum.js";
import { t, tanggal } from "/i18n.js";
import { muatData, tampilGalat, sumberHtml, sumberLipat, kartuHtml, batangHtml, pasangBar, temuanHtml, heroVisual, ubinHtml, pil, teksTek, teksStatus, num, saatBahasa, amanUrl } from "/analisis.js";

const $ = (id) => document.getElementById(id);
const param = new URLSearchParams(location.search).get("prov");
let data = null, geo = null, metrik = "terpasang", peta = null, petaSiap = false;

const METRIK = {
  terpasang: { ambil: (p) => p.terpasang_mw?.nilai ?? null, satuan: "MW", d: 1, sumber: (p) => p.terpasang_mw, kedua: ["proyek", "panasbumi"] },
  panasbumi: { ambil: (p) => p.potensi_panas_bumi?.nilai ?? null, satuan: "MW", d: 0, sumber: (p) => p.potensi_panas_bumi, kedua: ["terpasang", "proyek"] },
  proyek: { ambil: (p) => p.jumlah_proyek, satuan: "", d: 0, sumber: () => null, kedua: ["terpasang", "panasbumi"] },
  rued: { ambil: (p) => (p.rued.perda ? 1 : null), satuan: "", d: 0, sumber: (p) => (p.rued.perda ? { sumber: t("wl.sumber_rued"), url: p.rued.url, tanggal: p.rued.tanggal } : null), kedua: ["terpasang", "proyek"] },
};
const nilaiTeks = (m, p) => {
  if (m === "rued") return p.rued.perda ? t("wl.rued_ada", { perda: p.rued.perda }) : t("an.tanpa_data");
  const v = METRIK[m].ambil(p);
  return v === null ? t("an.tanpa_data") : `${num(v, METRIK[m].d)}${METRIK[m].satuan ? " " + METRIK[m].satuan : ""}`;
};
const ciriSumber = (m) => { const s = data.baris.map(METRIK[m].sumber).find(Boolean); return s || { sumber: t("wl.sumber_proyek"), tahun: null, tanggal: data.dibangun_pada }; };
const urutM = (m) => [...data.baris].sort((a, b) => (METRIK[m].ambil(b) ?? -1) - (METRIK[m].ambil(a) ?? -1) || a.nama.localeCompare(b.nama));
const berdata = (m) => data.baris.filter((p) => METRIK[m].ambil(p) !== null);
const peringkat = (m, p) => urutM(m).findIndex((x) => x.kode === p.kode) + 1;
const hlHtml = (kunci, v, sorot) => esc(t(kunci, { ...v, hl: "\u0001" + sorot + "\u0002" })).replace("\u0001", '<span class="jm-hl">').replace("\u0002", "</span>");
const lambang = (p, u = 24) => `<img class="jm-wl-lb" src="/img/provinsi/${esc(p.kode)}.png" width="${u}" height="${u}" alt="" loading="lazy" decoding="async">`;

/* ---------- daftar ---------- */

function jawab() {
  const urut = [...data.baris].filter((p) => p.terpasang_mw).sort((a, b) => b.terpasang_mw.nilai - a.terpasang_mw.nilai), a = urut[0];
  const tot = urut.reduce((x, p) => x + p.terpasang_mw.nilai, 0), rued = data.baris.filter((p) => p.rued.perda).length;
  $("jawab").textContent = t("wl.kh.lead");
  $("ubin").innerHTML = ubinHtml([
    { ikon: "analisis", nilai: num(a.terpasang_mw.nilai, 0), satuan: "MW", label: t("wl.kh.u1", { nama: a.nama }), href: "#h-peta" },
    { ikon: "regulasi", nilai: num(rued), satuan: t("wl.kh.u2s", { n: data.baris.length }), label: t("wl.kh.u2"), href: "#h-urut" },
    { ikon: "peta", nilai: num((a.terpasang_mw.nilai / tot) * 100, 0), satuan: "%", label: t("wl.kh.u3", { nama: a.nama }), href: "#h-urut", turunan: true },
  ]);
}

function kartu() {
  const B = data.baris, tp = B.filter((p) => p.terpasang_mw), pb = B.filter((p) => p.potensi_panas_bumi);
  const jp = B.reduce((s, p) => s + p.jumlah_proyek, 0);
  $("kartu").innerHTML =
    kartuHtml({ ikon: "analisis", judul: t("wl.k.terpasang"), nilai: num(tp.reduce((s, p) => s + p.terpasang_mw.nilai, 0), 0), satuan: "MW", turunan: true, penyebut: t("wl.sub_prov", { n: tp.length, total: B.length }), sumber: sumberHtml(tp[0]?.terpasang_mw) }) +
    kartuHtml({ ikon: "peta", judul: t("wl.k.potensi"), nilai: num(pb.reduce((s, p) => s + p.potensi_panas_bumi.nilai, 0), 0), satuan: "MW", turunan: true, penyebut: t("wl.sub_prov", { n: pb.length, total: B.length }), sumber: sumberHtml(pb[0]?.potensi_panas_bumi) }) +
    kartuHtml({ ikon: "proyek", judul: t("wl.k.proyek"), nilai: num(jp), satuan: t("wl.proyek_sat"), penyebut: t("wl.tanpa_prov", { n: data.proyek_tanpa_provinsi }), sumber: sumberHtml({ sumber: t("wl.sumber_proyek"), tanggal: data.dibangun_pada }) }) +
    kartuHtml({ ikon: "regulasi", judul: t("wl.k.rued"), nilai: num(B.filter((p) => p.rued.perda).length), satuan: t("wl.prov_sat"), penyebut: t("wl.sub_prov", { n: B.filter((p) => p.rued.perda).length, total: B.length }), sumber: sumberHtml({ sumber: t("wl.sumber_rued"), tanggal: B.find((p) => p.rued.tanggal)?.rued.tanggal }) });
}

/* kelas 5 tingkat berdasar kuantil; "rued" hanya ada/tidak. Kelas tanpa anggota tidak masuk legenda. */
function kelasPeta(m) {
  const B = data.baris, v = berdata(m).map(METRIK[m].ambil).sort((a, b) => a - b), kelas = new Map();
  const q = (f) => v[Math.min(v.length - 1, Math.floor(f * v.length))], pem = m === "rued" ? [] : [q(0.2), q(0.4), q(0.6), q(0.8)];
  for (const p of B) { const x = METRIK[m].ambil(p); kelas.set(p.kode, x === null ? -1 : m === "rued" ? 4 : pem.filter((b) => x >= b).length); }
  const rentang = [];
  for (let k = 0; k < 5; k++) { const a = B.filter((p) => kelas.get(p.kode) === k).map(METRIK[m].ambil); if (a.length) rentang.push({ k, min: Math.min(...a), max: Math.max(...a), n: a.length }); }
  return { kelas, rentang };
}

function urutan() {
  const m = metrik, B = urutM(m), maks = Math.max(1, ...B.map((p) => METRIK[m].ambil(p) ?? 0));
  const th = (k, s = "") => `<th class="${s}">${esc(t(k))}</th>`;
  const rued = (p) => {
    if (!p.rued.perda) return `<span class="jm-wl-kos" title="${esc(t("wl.rued_belum"))}">-</span>`;
    const isi = esc(t("wl.rued_ada", { perda: p.rued.perda })), u = amanUrl(p.rued.url);
    return u ? `<a class="jm-pil jm-wl-perda" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${isi}</a>` : `<span class="jm-pil jm-wl-perda">${isi}</span>`;
  };
  $("urutan").innerHTML = `<div class="jm-gulir"><table class="jm-tabel jm-wl-tabel"><colgroup><col class="jm-wl-c1"><col><col class="jm-wl-c3"><col class="jm-wl-c4"></colgroup><thead><tr><th>#</th>${th("wl.col.prov")}<th>${esc(t("wl.m." + m))}</th>${th("wl.col.rued")}</tr></thead><tbody>${B.map((p, i) => {
    const v = METRIK[m].ambil(p), lbl = (k) => esc(t(k));
    return `<tr data-href="/wilayah?prov=${esc(p.kode)}"><td data-label="#"><span class="jm-wl-no">${i + 1}</span></td><td data-label="${lbl("wl.col.prov")}"><a class="jm-wl-nama" href="/wilayah?prov=${esc(p.kode)}">${lambang(p)}<span>${esc(p.nama)}</span></a></td><td data-label="${esc(t("wl.col.nilai"))}" class="jm-num"><span class="jm-wl-nil"><span class="jm-wl-mb" aria-hidden="true"><i data-w="${v === null ? 0 : ((v / maks) * 100).toFixed(1)}"></i></span><b>${esc(nilaiTeks(m, p))}</b></span></td><td data-label="${lbl("wl.col.rued")}" class="jm-tengah">${rued(p)}</td></tr>`;
  }).join("")}</tbody></table></div>`;
  pasangBar($("urutan"));
}

function legenda() {
  const m = metrik, { rentang } = kelasPeta(m), s = ciriSumber(m), kosong = data.baris.length - berdata(m).length;
  const fmt = (v) => num(v, METRIK[m].d);
  $("legenda").innerHTML = `<p class="jm-wl-lg-j">${esc(t("wl.m." + m))}</p><ul>${rentang.map((r) => `<li><i class="jm-wl-k${r.k}" aria-hidden="true"></i>${esc(m === "rued" ? t("wl.lg.ada") : r.min === r.max ? fmt(r.min) : `${fmt(r.min)} - ${fmt(r.max)}`)}</li>`).join("")}${kosong ? `<li><i class="jm-wl-sw-kos" aria-hidden="true"></i>${esc(t("an.tanpa_data"))}</li>` : ""}</ul><span class="jm-wl-lg-s">${sumberHtml(s)}</span>`;
  const tp = urutM(m)[0], tgt = METRIK[m].ambil(tp);
  const sumP = berdata(m).reduce((a, p) => a + METRIK[m].ambil(p), 0), top10 = urutM(m).slice(0, 10).reduce((a, p) => a + (METRIK[m].ambil(p) ?? 0), 0);
  $("j-peta").innerHTML = m === "rued" ? hlHtml("wl.j.rued", { n: data.baris.length }, num(berdata(m).length)) : hlHtml("wl.j.peta", { mj: t("wl.mj." + m), nilai: nilaiTeks(m, tp) }, tp.nama);
  $("sub-peta").innerHTML = `${esc(t("wl.sub.peta", { metrik: t("wl.m." + m), n: berdata(m).length, total: data.baris.length }))} ${pil("an.est")}`;
  $("j-urut").innerHTML = m === "rued" ? hlHtml("wl.j.rued", { n: data.baris.length }, num(berdata(m).length)) : hlHtml("wl.j.urut", { mj: t("wl.mj." + m) }, num((top10 / sumP) * 100, 0) + "%");
  $("sub-urut").innerHTML = `${esc(t("wl.sub.urut", { metrik: t("wl.m." + m) }))} ${pil("an.est")}`;
  $("aksi-urut").innerHTML = $("aksi-peta").innerHTML = sumberHtml(s); // ponytail: tempat aksiHtml({csv,png,pdf,bagi}) dari /inti/aksi_ex.js bila sudah ada
}

/* ---------- peta (SVG: tiap provinsi satu jalur yang bisa difokus) ---------- */

const W = 1000, H = 337, BAT = [[88, 6.5], [141.5, -11.5]];
const jalur = (g) => {
  const X = (lng) => ((lng - BAT[0][0]) / (BAT[1][0] - BAT[0][0])) * W, Y = (lat) => ((BAT[0][1] - lat) / (BAT[0][1] - BAT[1][1])) * H;
  let d = "";
  for (const poli of g.type === "Polygon" ? [g.coordinates] : g.coordinates) for (const ring of poli.slice(0, 1)) {
    let px = Infinity, py = Infinity, s = "", n = 0;
    for (const [lng, lat] of ring) { const x = X(lng), y = Y(lat); if (Math.hypot(x - px, y - py) < 0.8) continue; s += (n++ ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1); px = x; py = y; }
    if (n > 3) d += s + "Z";
  }
  return d;
};

function tampilTip(p, x, y) {
  const m = metrik, tip = $("tip"), kd = METRIK[m].kedua.map((k) => `<li><span>${esc(t("wl.m." + k))}</span><b>${esc(nilaiTeks(k, p))}</b></li>`).join("");
  const rk = METRIK[m].ambil(p) === null ? esc(t("an.tanpa_data")) : esc(t("wl.peringkat", { r: peringkat(m, p), n: data.baris.length }));
  tip.innerHTML = `<header>${lambang(p, 36)}<div><strong>${esc(p.nama)}</strong><small>${rk}</small></div></header><p><span>${esc(t("wl.m." + m))}</span><b>${esc(nilaiTeks(m, p))}</b></p><ul>${kd}</ul>`;
  tip.hidden = false;
  const b = $("peta").parentElement.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
  tip.style.left = Math.max(8, Math.min(b.width - tw - 8, x + 14)) + "px";
  tip.style.top = Math.max(8, Math.min(b.height - th - 8, y + 14)) + "px";
}

function warnai() {
  const svg = $("peta").querySelector("svg");
  if (!svg) return;
  const { kelas } = kelasPeta(metrik);
  for (const pa of svg.querySelectorAll("path[data-k]")) {
    const p = data.baris.find((x) => x.kode === pa.dataset.k), k = kelas.get(pa.dataset.k);
    pa.setAttribute("class", "jm-wl-p " + (k < 0 ? "jm-wl-kos-p" : "jm-wl-k" + k));
    pa.setAttribute("aria-label", `${p.nama}: ${t("wl.m." + metrik)}, ${nilaiTeks(metrik, p)}`);
  }
  const g = svg.querySelector(".jm-wl-lbl"), ns = "http://www.w3.org/2000/svg";
  g.replaceChildren();
  const dipakai = [];
  for (const p of urutM(metrik).slice(0, metrik === "rued" ? 0 : 5)) {
    const bb = svg.querySelector(`path[data-k="${p.kode}"]`).getBBox(), cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
    const teks = `${p.nama} ${nilaiTeks(metrik, p)}`, lw = teks.length * 6.6 + 10;
    let ly = cy + 34 * (cy < 230 ? -1 : 1), lx = Math.max(4, Math.min(W - lw - 4, cx - lw / 2));
    for (let i = 0; i < 12 && dipakai.some((r) => Math.abs(r.y - ly) < 18 && lx < r.x + r.w && lx + lw > r.x); i++) ly += 20;
    dipakai.push({ x: lx, y: ly, w: lw });
    const ln = document.createElementNS(ns, "line"); ln.setAttribute("class", "jm-wl-gl"); ln.setAttribute("x1", cx.toFixed(1)); ln.setAttribute("y1", cy.toFixed(1)); ln.setAttribute("x2", (lx + lw / 2).toFixed(1)); ln.setAttribute("y2", (ly + (ly < cy ? 4 : -12)).toFixed(1));
    const bg = document.createElementNS(ns, "rect"); bg.setAttribute("class", "jm-wl-lr"); bg.setAttribute("x", lx); bg.setAttribute("y", ly - 12); bg.setAttribute("width", lw); bg.setAttribute("height", 18); bg.setAttribute("rx", 9);
    const tx = document.createElementNS(ns, "text"); tx.setAttribute("class", "jm-wl-lt"); tx.setAttribute("x", lx + lw / 2); tx.setAttribute("y", ly + 1); tx.setAttribute("text-anchor", "middle"); tx.textContent = teks;
    g.append(ln, bg, tx);
  }
}

async function bukaPeta() {
  try { geo = await (await fetch("/geo/provinsi.json", { credentials: "same-origin" })).json(); }
  catch (e) { $("peta").innerHTML = `<p class="jm-bantu">${esc(t("wl.peta_gagal"))}</p>`; return; }
  const nama = new Map(data.baris.map((p) => [p.kode, p]));
  const paths = geo.features.filter((f) => nama.has(f.properties.kode)).map((f) => `<path tabindex="0" role="link" data-k="${esc(f.properties.kode)}" d="${jalur(f.geometry)}"/>`).join("");
  $("peta").innerHTML = `<svg class="jm-wl-svg" viewBox="0 0 ${W} ${H}" focusable="false"><defs><pattern id="wl-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" class="jm-wl-hb"/><line x1="0" y1="0" x2="0" y2="7" class="jm-wl-hg"/></pattern></defs><g class="jm-wl-prov">${paths}</g><path class="jm-wl-sorot" d="" aria-hidden="true"/><g class="jm-wl-lbl" aria-hidden="true"></g></svg>`;
  const svg = $("peta").querySelector("svg"), sorot = svg.querySelector(".jm-wl-sorot"), tip = $("tip");
  const naik = (pa) => sorot.setAttribute("d", pa ? pa.getAttribute("d") : "");
  const bingkai = () => $("peta").parentElement.getBoundingClientRect();
  svg.addEventListener("mousemove", (e) => {
    const pa = e.target.closest("path[data-k]");
    if (!pa) { naik(null); tip.hidden = true; return; }
    naik(pa); const b = bingkai(); tampilTip(nama.get(pa.dataset.k), e.clientX - b.left, e.clientY - b.top);
  });
  svg.addEventListener("mouseover", (e) => { const pa = e.target.closest("path[data-k]"); if (pa && e.isTrusted === false) { naik(pa); const bb = pa.getBoundingClientRect(), b = bingkai(); tampilTip(nama.get(pa.dataset.k), bb.left - b.left + bb.width / 2, bb.top - b.top + bb.height / 2); } });
  svg.addEventListener("mouseleave", () => { naik(null); tip.hidden = true; });
  svg.addEventListener("focusin", (e) => { const pa = e.target.closest("path[data-k]"); if (!pa) return; naik(pa); const bb = pa.getBoundingClientRect(), b = bingkai(); tampilTip(nama.get(pa.dataset.k), bb.left - b.left + bb.width / 2, bb.top - b.top + bb.height / 2); });
  svg.addEventListener("focusout", () => { naik(null); tip.hidden = true; });
  const buka = (pa) => pa && location.assign(`/wilayah?prov=${encodeURIComponent(pa.dataset.k)}`);
  svg.addEventListener("click", (e) => buka(e.target.closest("path[data-k]")));
  svg.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); buka(e.target.closest("path[data-k]")); } });
  petaSiap = true;
  warnai();
}

function pasangSakelar() {
  $("urutan").addEventListener("click", (e) => { const tr = e.target.closest("tr[data-href]"); if (tr && !e.target.closest("a")) location.assign(tr.dataset.href); });
  document.querySelector(".jm-wl-seg").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-m]");
    if (!b || b.dataset.m === metrik) return;
    for (const x of b.parentElement.children) x.setAttribute("aria-selected", String(x === b)); // chrome urgent
    metrik = b.dataset.m;
    nanti(() => { warnai(); legenda(); urutan(); });
  });
}

function caraDaftar() {
  $("cara").innerHTML = `<p>${esc(t("wl.cara1"))}</p><p>${esc(t("wl.cara2"))}</p><p>${pil("an.est")} ${esc(t("wl.cara3"))}</p>`;
  $("kutip").textContent = t("wl.kutip", { tanggal: tanggal(data.dibangun_pada, { gaya: "panjang" }) });
}

/* ---------- profil ---------- */

const TEK = ["hidro", "panas-bumi", "surya", "bayu", "bioenergi"];

function tabelTek(p) {
  const pt = p.per_teknologi_mw || {};
  const pot = (k) => (k === "panas-bumi" && p.potensi_panas_bumi ? num(p.potensi_panas_bumi.nilai, 0) + " MW" : t("an.belum_tersedia"));
  return `<div class="jm-gulir"><table class="jm-tabel"><thead><tr><th>${esc(t("wl.col.tek"))}</th><th>${esc(t("wl.col.terpasang"))}</th><th>${esc(t("wl.col.potensi"))}</th></tr></thead><tbody>${TEK.map((k) =>
    `<tr><td data-label="${esc(t("wl.col.tek"))}">${esc(teksTek(k))}</td><td data-label="${esc(t("wl.col.terpasang"))}" class="jm-num">${esc(pt[k] === undefined ? t("an.tanpa_data") : num(pt[k], 2) + " MW")}</td><td data-label="${esc(t("wl.col.potensi"))}" class="jm-num">${esc(pot(k))}</td></tr>`).join("")}</tbody></table></div>`;
}

function blokRued(p) {
  const r = p.rued;
  if (!r.perda) return `<p class="jm-bantu">${esc(r.alasan || "")}</p>${sumberLipat([{ sumber: t("wl.sumber_rued"), tanggal: r.tanggal }])}`;
  const kand = (r.kandidat || []).map((k) => `<li>${esc(t("wl.rued_kand", { tahun: k.tahun, persen: num(k.persen, 2) }))}</li>`).join("");
  const u = amanUrl(r.url);
  return `<p><strong>${esc(t("wl.rued_target"))}:</strong> ${esc(r.target_ebt_persen === null ? t("an.belum_tersedia") : num(r.target_ebt_persen, 2) + "%")}</p>
    <p>${u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t("wl.rued_ada", { perda: r.perda }))}</a>` : esc(t("wl.rued_ada", { perda: r.perda }))}</p>
    ${kand ? `<p>${pil("an.hipotesis")} ${esc(t("wl.rued_kand_judul"))}</p><ul>${kand}</ul>` : ""}
    ${sumberLipat([{ sumber: t("wl.sumber_rued"), url: r.url, tanggal: r.tanggal }])}`;
}

function visualProfil(p) {
  const urut = [...data.baris].filter((x) => x.terpasang_mw).sort((a, b) => b.terpasang_mw.nilai - a.terpasang_mw.nilai), i = urut.findIndex((x) => x.kode === p.kode);
  if (i < 0) return "";
  const med = urut[Math.floor(urut.length / 2)].terpasang_mw.nilai, mw = (v) => num(v, 0) + " MW";
  return heroVisual({ angka: `${i + 1}/${urut.length}`, label: t("wl.vis.peringkat"), rows: [
    { label: p.nama, nilai: p.terpasang_mw.nilai, teks: mw(p.terpasang_mw.nilai), kelas: "jm-hv-b1" },
    { label: urut[0].nama, nilai: urut[0].terpasang_mw.nilai, teks: mw(urut[0].terpasang_mw.nilai), kelas: "jm-hv-b2" },
    { label: t("wl.vis.median"), nilai: med, teks: mw(med), kelas: "jm-hv-b3" }] });
}

function profil(p) {
  document.title = t("wl.profil_title", { nama: p.nama });
  const pb = p.per_teknologi_mw?.["panas-bumi"], pot = p.potensi_panas_bumi;
  const batang = pot ? batangHtml([
    { label: t("wl.bar.terpasang"), bagian: [{ nilai: pb ?? 0, kelas: "jm-an-b1" }], teks: num(pb ?? 0, 1) + " MW" },
    { label: t("wl.bar.potensi"), bagian: [{ nilai: pot.nilai, kelas: "jm-an-b2" }], teks: num(pot.nilai, 0) + " MW" },
  ], { label: t("wl.bar.label") }) : `<p>${esc(t("an.belum_tersedia"))}</p>`;
  const proy = p.proyek.length ? `<div class="jm-gulir"><table class="jm-tabel"><thead><tr><th>${esc(t("wl.col.proyek"))}</th><th>${esc(t("wl.col.tek"))}</th><th>${esc(t("wl.col.kap"))}</th><th>${esc(t("wl.col.status"))}</th></tr></thead><tbody>${p.proyek.map((x) =>
    `<tr><td data-label="${esc(t("wl.col.proyek"))}">${esc(x.nama)}</td><td data-label="${esc(t("wl.col.tek"))}">${esc(teksTek(x.teknologi))}</td><td data-label="${esc(t("wl.col.kap"))}" class="jm-num">${esc(x.mw === null ? t("an.tanpa_data") : num(x.mw, 1) + " " + x.satuan)}</td><td data-label="${esc(t("wl.col.status"))}">${esc(teksStatus(x.status))}</td></tr>`).join("")}</tbody></table></div>` : `<p>${esc(t("wl.proyek_kosong"))}</p>`;
  const perda = p.perda.length ? `<ul class="jm-an-daftar">${p.perda.map((x) => `<li>${amanUrl(x.url) ? `<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">` : "<span>"}${esc(t("wl.perda_item", { nomor: x.nomor, tahun: x.tahun }))}${amanUrl(x.url) ? "</a>" : "</span>"} ${esc(x.judul)}</li>`).join("")}</ul>` : `<p>${esc(t("wl.perda_kosong"))}</p>`;
  const orgs = p.organisasi.length ? `<ul class="jm-an-daftar">${p.organisasi.map((o) => `<li>${esc(o.nama)}${o.kategori ? ` <small>${esc(o.kategori)}</small>` : ""}</li>`).join("")}</ul>` : `<p>${esc(t("wl.org_kosong"))}</p>`;
  const pakar = p.pakar.length ? `<ul class="jm-an-daftar">${p.pakar.map((o) => `<li>${esc(o.nama)} <small>${esc(o.jabatan || "")}, ${esc(o.organisasi || "")}</small></li>`).join("")}</ul>` : `<p>${esc(t("wl.pakar_kosong"))}</p>`;
  $("profil-isi").innerHTML = `
    <section class="jm-hero jm-an-hero2"><div><h1 class="jm-wl-h1">${lambang(p, 64)}<span>${esc(p.nama)}</span></h1><p class="jm-an-label">${esc(t("an.jawaban"))}</p>
      <p>${esc(t("wl.profil_jawab", { nama: p.nama, mw: p.terpasang_mw ? num(p.terpasang_mw.nilai, 1) : "-", tahun: p.terpasang_mw?.tahun ?? "-", n: p.jumlah_proyek, pot: pot ? num(pot.nilai, 0) : "-" }))}</p></div>
      <aside class="jm-an-visual" id="visual">${visualProfil(p)}</aside></section>
    <section class="jm-an-kartu-baris">
      ${kartuHtml({ ikon: "analisis", judul: t("wl.k.terpasang1"), nilai: p.terpasang_mw ? num(p.terpasang_mw.nilai, 2) : "-", satuan: "MW", sumber: sumberHtml(p.terpasang_mw) })}
      ${kartuHtml({ ikon: "status", judul: t("wl.m.rasio"), nilai: p.rasio_elektrifikasi ? num(p.rasio_elektrifikasi.nilai, 2) : "-", satuan: "%", sumber: sumberHtml(p.rasio_elektrifikasi) })}
      ${kartuHtml({ ikon: "peta", judul: t("wl.m.panasbumi"), nilai: pot ? num(pot.nilai, 0) : "-", satuan: "MW", sumber: sumberHtml(pot) })}
      ${kartuHtml({ ikon: "proyek", judul: t("wl.k.proyek1"), nilai: num(p.jumlah_proyek), satuan: t("wl.proyek_sat"), sumber: sumberHtml({ sumber: t("wl.sumber_proyek"), tanggal: data.dibangun_pada }) })}
    </section>
    <section class="jm-kartu jm-an-wadah"><header class="jm-an-kepala"><div><h2>${esc(t("wl.pot_vs"))}</h2>${pot ? `<p class="jm-temuan">${temuanHtml(t("wl.t.pot", { a: num(pb ?? 0, 1), b: num(pot.nilai, 0), persen: num(((pb ?? 0) / pot.nilai) * 100, 1) }))}</p>` : ""}</div></header>${batang}${sumberHtml(pot)}<h3>${esc(t("wl.per_tek"))}</h3>${tabelTek(p)}${sumberHtml(p.terpasang_mw)}
      <p class="jm-bantu">${esc(Object.values(p.potensi_lain)[0]?.alasan || "")}</p></section>
    <section class="jm-kartu jm-an-wadah"><h2>${esc(t("wl.rued"))}</h2><p class="jm-temuan">${esc(p.rued.perda ? t("wl.t.rued_ada", { perda: p.rued.perda }) : t("wl.t.rued_tidak"))}</p>${blokRued(p)}</section>
    <section class="jm-kartu jm-an-wadah"><h2>${esc(t("wl.proyek_judul", { n: p.jumlah_proyek }))}</h2>${p.proyek.length ? `<p class="jm-temuan">${temuanHtml(t("wl.t.proyek", { n: p.jumlah_proyek, mw: num(p.proyek.reduce((s, x) => s + (x.mw || 0), 0), 0) }))}</p>` : ""}${proy}</section>
    <section class="jm-kartu jm-an-wadah"><h2>${esc(t("wl.perda_judul"))}</h2>${perda}${sumberLipat([{ sumber: t("wl.sumber_perda"), tanggal: data.dibangun_pada }])}</section>
    <section class="jm-kartu jm-an-wadah"><h2>${esc(t("wl.org_judul", { n: p.organisasi.length }))}</h2>${orgs}<h2>${esc(t("wl.pakar_judul", { n: p.pakar.length }))}</h2>${pakar}${sumberLipat([{ sumber: t("wl.sumber_org"), tanggal: data.dibangun_pada }])}</section>`;
  pasangBar($("profil-isi"));
  $("cara").innerHTML = `<p>${esc(t("wl.cara_profil"))}</p>`;
  $("kutip").textContent = t("wl.kutip_profil", { nama: p.nama, tanggal: tanggal(data.dibangun_pada, { gaya: "panjang" }) });
}

/* ---------- mulai ---------- */

function gambar() {
  if (param) {
    const p = data.baris.find((x) => x.kode === param);
    $("daftar").hidden = true; $("profil").hidden = false;
    if (!p) { $("profil-isi").innerHTML = `<div class="jm-kosong"><p>${esc(t("wl.tidak_ada"))}</p></div>`; return; }
    profil(p);
  } else {
    $("daftar").hidden = false; $("profil").hidden = true;
    jawab(); kartu(); legenda(); urutan(); caraDaftar(); warnai();
  }
}

async function mulai() {
  await mulaiHalaman();
  $("kartu") && ($("kartu").innerHTML = hantuHtml(2));
  try { data = await muatData("wilayah.json"); } catch (e) { tampilGalat($(param ? "profil-isi" : "kartu"), mulai); if (param) { $("daftar").hidden = true; $("profil").hidden = false; } return; }
  gambar();
  saatBahasa(gambar);
  if (!param) { pasangSakelar(); nanti(bukaPeta); }
}
mulai();
