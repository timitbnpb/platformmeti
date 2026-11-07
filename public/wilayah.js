/* /wilayah: peta koroplet 38 provinsi + profil provinsi (?prov=XX). Data statis /data/wilayah.json. */
import { mulaiHalaman } from "/inti/kepala.js";
import { nanti, esc, hantuHtml, debounce } from "/inti/umum.js";
import { t, tanggal } from "/i18n.js";
import { muatData, tampilGalat, sumberHtml, sumberLipat, pasangAksi, kartuHtml, batangHtml, pasangBar, temuanHtml, heroVisual, ubinHtml, pil, teksTek, teksStatus, num, saatBahasa, amanUrl } from "/analisis.js";

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
  $("legenda").innerHTML = `<p class="jm-wl-lg-j">${esc(t("wl.m." + m))}</p><div class="jm-wl-rp"><div class="jm-wl-rp-s">${rentang.map((r) => `<span><i class="jm-wl-k${r.k}" aria-hidden="true"></i><small>${esc(m === "rued" ? t("wl.lg.ada") : fmt(r.min))}</small></span>`).join("")}</div>${kosong ? `<span class="jm-wl-rp-k"><i class="jm-wl-sw-kos" aria-hidden="true"></i><small>${esc(t("an.tanpa_data"))}</small></span>` : ""}<span class="jm-wl-lg-s">${sumberHtml(s)}</span></div>`;
  const tp = urutM(m)[0], tgt = METRIK[m].ambil(tp);
  const sumP = berdata(m).reduce((a, p) => a + METRIK[m].ambil(p), 0), top10 = urutM(m).slice(0, 10).reduce((a, p) => a + (METRIK[m].ambil(p) ?? 0), 0);
  $("j-peta").innerHTML = m === "rued" ? hlHtml("wl.j.rued", { n: data.baris.length }, num(berdata(m).length)) : hlHtml("wl.j.peta", { mj: t("wl.mj." + m), nilai: nilaiTeks(m, tp) }, tp.nama);
  $("sub-peta").innerHTML = `${esc(t("wl.sub.peta", { metrik: t("wl.m." + m), n: berdata(m).length, total: data.baris.length }))} ${pil("an.est")}`;
  $("j-urut").innerHTML = m === "rued" ? hlHtml("wl.j.rued", { n: data.baris.length }, num(berdata(m).length)) : hlHtml("wl.j.urut", { mj: t("wl.mj." + m) }, num((top10 / sumP) * 100, 0) + "%");
  $("sub-urut").innerHTML = `${esc(t("wl.sub.urut", { metrik: t("wl.m." + m) }))} ${pil("an.est")}`;
  for (const id of ["aksi-peta", "aksi-urut"]) { const el = $(id); el.querySelector(".jm-sumber")?.remove(); el.insertAdjacentHTML("beforeend", sumberHtml(s)); }
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
  // kotak peta menyesuaikan bentuk wadah (tepi ke tepi), daratan di tengah-bawah
  const rc = svg.getBoundingClientRect(), asp = (rc.width || 1200) / (rc.height || 620), vh = Math.max(H, W / asp);
  svg.setAttribute("viewBox", `0 ${((H - vh) / 2 - vh * 0.04).toFixed(1)} ${W} ${vh.toFixed(1)}`);
  const s = (rc.width || 1200) / W; // piksel per satuan
  const g = svg.querySelector(".jm-wl-lbl"), ns = "http://www.w3.org/2000/svg", el = (n, a) => { const e = document.createElementNS(ns, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  g.replaceChildren();
  const dipakai = [{ x: W - 340 / s, y: -1e4, w: 340 / s, h: 1e4 + 340 / s }]; // panel peringkat di kanan atas
  for (const p of urutM(metrik).slice(0, metrik === "rued" ? 0 : 5)) {
    const pa = svg.querySelector(`path[data-k="${p.kode}"]`), bb = pa.getBBox(), cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
    const nm = p.nama, vl = nilaiTeks(metrik, p), w = (Math.max(nm.length * 6.3, vl.length * 7) + 34) / s, h = 34 / s;
    const kand = [];
    for (const jar of [14, 40, 70]) for (const a of [90, 270, 0, 180, 45, 315, 135, 225]) {
      const r = (a * Math.PI) / 180, ax = cx + (Math.cos(r) * jar) / s, ay = cy - (Math.sin(r) * jar) / s;
      kand.push({ x: Math.cos(r) > 0.3 ? ax : Math.cos(r) < -0.3 ? ax - w : ax - w / 2, y: Math.sin(r) > 0.3 ? ay - h : Math.sin(r) < -0.3 ? ay : ay - h / 2, w, h, jar });
    }
    const tb = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const k = kand.find((c) => !dipakai.some((o) => tb(c, o))) || kand[0];
    dipakai.push(k);
    if (k.jar > 14) g.append(el("line", { class: "jm-wl-gl", x1: cx.toFixed(1), y1: cy.toFixed(1), x2: Math.max(k.x, Math.min(k.x + w, cx)).toFixed(1), y2: Math.max(k.y, Math.min(k.y + h, cy)).toFixed(1) }));
    g.append(el("circle", { class: "jm-wl-gd", cx: cx.toFixed(1), cy: cy.toFixed(1), r: (3 / s).toFixed(2) }), el("rect", { class: "jm-wl-lr", x: k.x.toFixed(1), y: k.y.toFixed(1), width: w.toFixed(1), height: h.toFixed(1), rx: (8 / s).toFixed(1) }));
    const im = el("image", { href: `/img/provinsi/${p.kode}.png`, x: (k.x + 8 / s).toFixed(1), y: (k.y + 9 / s).toFixed(1), width: (16 / s).toFixed(1), height: (16 / s).toFixed(1), preserveAspectRatio: "xMidYMid meet" });
    const t1 = el("text", { class: "jm-wl-lt", x: (k.x + 30 / s).toFixed(1), y: (k.y + 14 / s).toFixed(1), "font-size": (11 / s).toFixed(2) }); t1.textContent = nm;
    const t2 = el("text", { class: "jm-wl-lv", x: (k.x + 30 / s).toFixed(1), y: (k.y + 28 / s).toFixed(1), "font-size": (12 / s).toFixed(2) }); t2.textContent = vl;
    g.append(im, t1, t2);
  }
  peringkatPanel();
}

function peringkatPanel() {
  const m = metrik, B = urutM(m).filter((p) => METRIK[m].ambil(p) !== null).slice(0, 10), maks = Math.max(1, ...B.map((p) => METRIK[m].ambil(p)));
  $("peringkat").innerHTML = `<h3>${esc(t("wl.ey.urut"))}</h3><ol>${B.map((p, i) => `<li data-k="${esc(p.kode)}" tabindex="0"><span class="jm-wl-no">${i + 1}</span>${lambang(p, 18)}<span class="jm-wl-pn">${esc(p.nama)}</span>${m === "rued" ? "" : `<span class="jm-wl-mb" aria-hidden="true"><i data-w="${((METRIK[m].ambil(p) / maks) * 100).toFixed(1)}"></i></span>`}<b>${esc(nilaiTeks(m, p))}</b></li>`).join("")}</ol>`;
  pasangBar($("peringkat"));
}

async function bukaPeta() {
  try { geo = await (await fetch("/geo/provinsi.json", { credentials: "same-origin" })).json(); }
  catch (e) { $("peta").innerHTML = `<p class="jm-bantu">${esc(t("wl.peta_gagal"))}</p>`; return; }
  const nama = new Map(data.baris.map((p) => [p.kode, p]));
  const paths = geo.features.filter((f) => nama.has(f.properties.kode)).map((f) => `<path tabindex="0" role="link" data-k="${esc(f.properties.kode)}" d="${jalur(f.geometry)}"/>`).join("");
  $("peta").innerHTML = `<svg class="jm-wl-svg" viewBox="0 0 ${W} ${H}" focusable="false"><defs><pattern id="wl-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" class="jm-wl-hb"/><line x1="0" y1="0" x2="0" y2="7" class="jm-wl-hg"/></pattern><filter id="wl-bayang" x="-5%" y="-5%" width="110%" height="115%"><feDropShadow dx="0" dy="3" stdDeviation="3" class="jm-wl-fds"/></filter></defs><g class="jm-wl-prov" filter="url(#wl-bayang)">${paths}</g><path class="jm-wl-sorot" d="" aria-hidden="true"/><g class="jm-wl-lbl" aria-hidden="true"></g></svg>`;
  const svg = $("peta").querySelector("svg"), sorot = svg.querySelector(".jm-wl-sorot"), tip = $("tip");
  const naik = (pa) => { sorot.setAttribute("d", pa ? pa.getAttribute("d") : ""); for (const li of $("peringkat").querySelectorAll("li")) li.classList.toggle("jm-wl-aktif", !!pa && li.dataset.k === pa.dataset.k); };
  const bingkai = () => $("peta").parentElement.getBoundingClientRect();
  const dipa = (k) => svg.querySelector(`path[data-k="${k}"]`);
  svg.addEventListener("mousemove", (e) => {
    const pa = e.target.closest("path[data-k]");
    if (!pa) { naik(null); tip.hidden = true; return; }
    naik(pa); const b = bingkai(); tampilTip(nama.get(pa.dataset.k), e.clientX - b.left, e.clientY - b.top);
  });
  svg.addEventListener("mouseover", (e) => { const pa = e.target.closest("path[data-k]"); if (pa && e.isTrusted === false) { naik(pa); const bb = pa.getBoundingClientRect(), b = bingkai(); tampilTip(nama.get(pa.dataset.k), bb.left - b.left + bb.width / 2, bb.top - b.top + bb.height / 2); } });
  svg.addEventListener("mouseleave", () => { naik(null); tip.hidden = true; });
  svg.addEventListener("focusin", (e) => { const pa = e.target.closest("path[data-k]"); if (!pa) return; naik(pa); const bb = pa.getBoundingClientRect(), b = bingkai(); tampilTip(nama.get(pa.dataset.k), bb.left - b.left + bb.width / 2, bb.top - b.top + bb.height / 2); });
  svg.addEventListener("focusout", () => { naik(null); tip.hidden = true; });
  const buka = (k) => k && location.assign(`/wilayah?prov=${encodeURIComponent(k)}`);
  svg.addEventListener("click", (e) => buka(e.target.closest("path[data-k]")?.dataset.k));
  svg.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); buka(e.target.closest("path[data-k]")?.dataset.k); } });
  // panel peringkat: sorot dua arah
  const pr = $("peringkat");
  pr.addEventListener("mouseover", (e) => { const li = e.target.closest("li[data-k]"); if (li) naik(dipa(li.dataset.k)); });
  pr.addEventListener("mouseleave", () => naik(null));
  pr.addEventListener("click", (e) => buka(e.target.closest("li[data-k]")?.dataset.k));
  pr.addEventListener("keydown", (e) => { if (e.key === "Enter") buka(e.target.closest("li[data-k]")?.dataset.k); });
  petaSiap = true;
  warnai();
  new ResizeObserver(debounce(warnai, 150)).observe($("peta"));
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

/* ---------- profil: modul sendiri (wilayah_profil.js), dimuat hanya bila ?prov= ---------- */

const profil = async (p) => (await import("/wilayah_profil.js")).profilProvinsi(p, data, $);

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
  if (!param) pasangAksi(["aksi-urut"]);
  gambar();
  saatBahasa(gambar);
  if (!param) { pasangSakelar(); nanti(bukaPeta); }
}
mulai();
