/* /topik: penyaji data tampilan baru: tabel pintar (entitas dikenali dari isi kolom, bertaut + berlogo), peta koroplet provinsi, grafik garis/kolom
   interaktif (crosshair, tooltip, tonggak kebijakan), linimasa vertikal. Tanpa pustaka; SVG lewat atribut, tanpa gaya inline (CSP). */
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { unduhRegHtml } from "/inti/komponen.js";
import { kodeProv, PROV } from "/inti/prov_singkat.js";
import { pilTek, pilStatus } from "/inti/ikon_tek.js";
import { jalurPerProvinsi, geoProvinsi } from "/inti/peta_indonesia.js";
import { batangHtml } from "/analisis.js";
import { S, L, u, num, tok, daftarTabel, sumberHtml } from "/topik_umum.js";
import { K, cariOrg, cariProyek, cariReg, provSel, orgSel, negaraSel, isoNegara, bendera, penerbit, logoPenerbit, pilKat, pilPeran, lambang, kapital } from "/topik_wujud.js";

const HARI_INI = new Date().toISOString().slice(0, 10);
const teks = (v) => (v && typeof v === "object" ? tok(v) : v == null ? "" : String(v));
const TEK = new Set(["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "nuklir", "penyimpanan", "hidrogen", "laut"]);
const STATUS = new Set(["rencana", "izin", "pendanaan", "konstruksi", "beroperasi", "dibatalkan", "ditunda", "berlaku", "dicabut", "diubah", "mangkrak", "operasi"]);
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/* ---------- pil status (proyek dan regulasi) ---------- */
export function pilStatusProyek(kode) {
  const k = String(kode || "").toLowerCase();
  if (!k) return "-";
  if (["rencana", "izin", "pendanaan", "konstruksi", "beroperasi", "dibatalkan"].includes(k)) return pilStatus(k);
  if (k === "operasi") return pilStatus("beroperasi");
  return `<span class="jm-pil-st jm-st-izin">${ikon("jam", 14)}<span>${esc(kapital(k))}</span></span>`;
}
export function pilStatusReg(status) {
  const k = String(status || "").toLowerCase();
  if (!k) return "-";
  const ok = k === "berlaku", bad = k === "dicabut", lab = S.ui.s["reg." + k] ? u("reg." + k) : kapital(k);
  return `<span class="jm-pil ${ok ? "jm-pil-ok" : bad ? "jm-pil-bad" : "jm-pil-warn"} jm-tp-pil-i">${ikon(ok ? "centang" : bad ? "silang" : "peringatan", 14)}<span>${esc(lab)}</span></span>`;
}
const hostDari = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return ""; } };
export const ikonSumber = (url, judul = "") => (/^https?:\/\//i.test(url || "") ? `<a class="jm-reg-ik" href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="${esc(judul ? judul + ": " : "")}${esc(hostDari(url))}" aria-label="${esc(t("tp.sumber_buka"))}: ${esc(hostDari(url))}">${ikon("info", 18)}</a>` : "-");

/* ---------- jenis kolom dari isi ---------- */
export function jenisKolom(c, baris) {
  const k = c.k + " " + teks(c.l), v = baris.map((r) => teks(r[c.k])).filter(Boolean), n = v.length || 1;
  const bagi = (f) => v.filter(f).length / n;
  if (c.url && c.url === c.k) return "url";
  if (v.length && bagi((x) => ISO.test(x)) >= 0.7) return "tgl";
  if (/status/i.test(k)) return "status";
  if (/kategori|category/i.test(k) && bagi((x) => x.length <= 48) > 0.8) return "kat";
  if (/peran|role/i.test(k)) return "peran";
  if (v.length && bagi((x) => kodeProv(x)) >= 0.5) return "prov";
  if (v.length && bagi((x) => cariReg(x)) >= 0.5) return "reg";
  if (/negara|country/i.test(k) || bagi((x) => isoNegara(x)) >= 0.5) return "negara";
  if (v.length && bagi((x) => cariOrg(x)) >= 0.5) return "org";
  if (v.length && bagi((x) => cariProyek(x)) >= 0.5) return "proyek";
  if (v.length && bagi((x) => TEK.has(x.toLowerCase())) >= 0.7) return "tek";
  if (v.length && bagi((x) => STATUS.has(x.toLowerCase())) >= 0.7) return "status";
  return c.num ? "num" : "teks";
}

function sel(j, r, c, ctx, adaReg) {
  const x = teks(r[c.k]);
  if (j === "url") {
    if (!r[c.url]) return "-";
    if (adaReg) { const kolDok = adaReg.k, rr = cariReg(teks(r[kolDok])); return unduhRegHtml({ judul: teks(r[kolDok]), url_sumber: /\.pdf(\?|$)/i.test(r[c.url]) ? "" : r[c.url], url_pdf: /\.pdf(\?|$)/i.test(r[c.url]) ? r[c.url] : rr?.pdf }) || ikonSumber(r[c.url]); }
    return ikonSumber(r[c.url]);
  }
  if (c.url && /^https?:\/\//.test(r[c.url] || "") && !["prov", "org", "proyek", "reg"].includes(j)) return `<a class="jm-tp-ent" href="${esc(r[c.url])}" target="_blank" rel="noopener noreferrer"><span>${esc(x)}</span></a>`;
  if (!x) return `<span class="jm-tp-kosong" title="${esc(u("tanpa"))}">-</span>`;
  if (j === "tgl") return `<time datetime="${esc(x)}">${esc(tanggal(x))}</time>`;
  if (j === "status") return /^(berlaku|dicabut|diubah)$/i.test(x) ? pilStatusReg(x) : pilStatusProyek(x);
  if (j === "kat") return pilKat(x);
  if (j === "peran") return pilPeran(x);
  if (j === "prov") return provSel(x);
  if (j === "negara") return negaraSel(x);
  if (j === "tek") return pilTek(x.toLowerCase());
  if (j === "org") return orgSel(x);
  if (j === "proyek") { const p = cariProyek(x); return p ? `<a class="jm-tp-ent" href="/p/${esc(p.id)}"><span>${esc(x)}</span></a>` : esc(x); }
  if (j === "reg") {
    const r2 = cariReg(x), pb = penerbit(x, r2?.jenis);
    return `<span class="jm-tp-ent">${logoPenerbit(pb)}${r2?.id ? `<a href="/regulasi?id=${encodeURIComponent(r2.id)}"><b>${esc(x)}</b></a>` : `<b>${esc(x)}</b>`}</span>`;
  }
  if (j === "num" || (c.num && typeof r[c.k] === "number")) return typeof r[c.k] === "number" ? num(r[c.k], c.d || 0) : esc(x);
  return esc(x);
}
const urut = (j, r, c) => { const v = r[c.k]; return typeof v === "number" ? v : j === "tgl" ? teks(v) || null : teks(v) || null; };

/* kolom kenal-isi untuk tabel naskah (bab bertipe tabel) */
export function kolomPintar(b, ctx) {
  const baris = b.baris || [], dasar = (b.kolom || []).map((c) => ({ c, j: jenisKolom(c, baris) })), adaReg = dasar.find((x) => x.j === "reg");
  const kols = [];
  for (const { c, j } of dasar) {
    kols.push({ k: c.k, l: L(c.l), j, num: !!c.num, w: j, f: (r) => sel(j, r, c, ctx, j === "url" && adaReg ? { k: adaReg.c.k } : null), v: (r) => urut(j, r, c) });
    if (j === "reg") kols.push({ k: c.k + "_st", l: u("k.status"), j: "status", w: "status", f: (r) => { const q = cariReg(teks(r[c.k])); return q?.status ? pilStatusReg(q.status) : "-"; }, v: (r) => cariReg(teks(r[c.k]))?.status || null });
  }
  return { kols, dasar };
}

export function tabelPintar(b, id, ctx) {
  const { kols: semua, dasar: d0 } = kolomPintar(b, ctx), baris = b.baris || [];
  const adaProv = d0.some((x) => x.j === "prov"), buang = (c) => adaProv && /^kode\b/i.test(teks(c.l)) && !c.num;
  const dasar = d0.filter((x) => !buang(x.c)), kols = semua.filter((c) => !d0.some((x) => buang(x.c) && x.c.k === c.k));
  let atas = "";
  const kp = dasar.find((x) => x.j === "prov"), kn = dasar.filter((x) => x.c.num);
  if (kp && kn.length && new Set(baris.map((r) => kodeProv(teks(r[kp.c.k]))).filter(Boolean)).size >= 15) atas = petaHtml(id, baris, kp.c, kn.find((x) => /pvout/i.test(x.c.k + teks(x.c.l)))?.c || kn.find((x) => /potensi|potential/i.test(x.c.k + teks(x.c.l)))?.c || kn[0].c, kn.map((x) => x.c));
  const rapat = kn.length > 4;
  const ks = dasar.find((x) => x.j === "status"), km = dasar.find((x) => x.c.num && /mw/i.test(x.c.k + teks(x.c.l)));
  if (ks && km && ctx.dasar?.proyek?.daftar?.length) atas += ringkasStatus(ctx.dasar.proyek.daftar, id);
  return { html: atas + `<div class="${rapat ? "jm-tp-rapat" : ""}">` + daftarTabel(id, kols, baris, b.per || 8) + "</div>", csv: true };
}

/* ---------- ringkasan MW per status proyek (kepala tabel proyek) ---------- */
export function ringkasStatus(daftar, id) {
  const m = new Map();
  for (const p of daftar) { const k = String(p.status || "-").toLowerCase(), a = m.get(k) || { n: 0, mw: 0 }; a.n++; a.mw += +p.mw || 0; m.set(k, a); }
  const a = [...m].sort((x, y) => y[1].mw - x[1].mw);
  const maks = Math.max(1, ...a.map((x) => x[1].mw));
  const rows = a.map(([k, v], i) => ({ id: k, label: k, labelHtml: pilStatusProyek(k), bagian: [{ nilai: v.mw, kelas: "jm-an-c" + (1 + i % 4) }], teks: `${num(v.mw)} MW (${num(v.n)} ${u("kartu.angka.proyek")})` }));
  return `<div class="jm-tp-status"><h3 class="jm-tp-h3">${esc(t("tp.mw_status"))}</h3>${batangHtml(rows, { maks, label: t("tp.mw_status"), satuan: "MW" })}</div>`;
}

/* ---------- peta koroplet provinsi ---------- */
const PETA = new Map();
const W = 1000, H = 379;
export function petaHtml(id, baris, kol, kolNilai, lain) {
  const data = new Map();
  for (const r of baris) { const k = kodeProv(teks(r[kol.k])); if (k && typeof r[kolNilai.k] === "number") data.set(k, { nama: PROV[k][0], v: r[kolNilai.k], lain: lain.filter((c) => c.k !== kolNilai.k).slice(0, 3).map((c) => [L(c.l), r[c.k], c.d || 0]) }); }
  const v = [...data.values()].map((x) => x.v).sort((a, b) => a - b), bt = [0.2, 0.4, 0.6, 0.8].map((q) => v[Math.min(v.length - 1, Math.floor(q * v.length))]);
  const kelas = (x) => bt.filter((b) => x >= b).length;
  const rata = v.reduce((s, x) => s + x, 0) / (v.length || 1), urutan = [...data.entries()].sort((a, b) => b[1].v - a[1].v);
  PETA.set(id, { data, kelas, rata, urutan, d: kolNilai.d || 0, l1: L(kolNilai.l), bt, lo: v[0], hi: v.at(-1) });
  const lg = [0, 1, 2, 3, 4].map((k) => { const a = k ? bt[k - 1] : v[0], z = k < 4 ? bt[k] : v.at(-1); return `<li><i class="jm-wl-k${k}"></i><span>${esc(num(a, kolNilai.d || 0))} - ${esc(num(z, kolNilai.d || 0))}</span></li>`; }).join("");
  return `<div class="jm-wl-bingkai jm-tp-peta" data-peta="${esc(id)}"><div class="jm-wl-peta"><div class="jm-tp-peta-isi" role="img" aria-label="${esc(t("tp.peta.label", { metrik: L(kolNilai.l) }))}"></div></div><div class="jm-wl-legenda"><p class="jm-wl-lg-j">${esc(L(kolNilai.l))}</p><ul>${lg}<li><i class="jm-wl-sw-kos"></i><span>${esc(t("tp.peta.kosong"))}</span></li></ul></div><div class="jm-wl-tip" hidden></div></div>`;
}
let geoMuat = null;
export async function pasangPeta(akar = document) {
  const semua = [...akar.querySelectorAll("[data-peta]:not([data-siap])")];
  if (!semua.length) return;
  geoMuat ??= geoProvinsi();
  const geo = await geoMuat;
  if (!geo) return;
  const jalur = jalurPerProvinsi(geo, W, H);
  for (const el of semua) {
    const m = PETA.get(el.dataset.peta); if (!m) continue;
    el.dataset.siap = "1";
    const ps = jalur.filter((j) => j.d).map((j) => { const ada = m.data.has(j.kode); return `<path tabindex="0" role="link" data-k="${esc(j.kode)}" class="jm-wl-p ${ada ? "jm-wl-k" + m.kelas(m.data.get(j.kode).v) : "jm-wl-kos-p"}" d="${j.d}"/>`; }).join("");
    el.querySelector(".jm-tp-peta-isi").innerHTML = `<svg class="jm-wl-svg" viewBox="0 0 ${W} ${H}" focusable="false"><defs><pattern id="wl-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" class="jm-wl-hb"/><line x1="0" y1="0" x2="0" y2="7" class="jm-wl-hg"/></pattern></defs><g>${ps}</g><path class="jm-wl-sorot" d="" aria-hidden="true"/></svg>`;
    for (const p of el.querySelectorAll("path[data-k]")) { const d = m.data.get(p.dataset.k); p.setAttribute("aria-label", d ? `${d.nama}: ${m.l1} ${num(d.v, m.d)}` : PROV[p.dataset.k]?.[0] || ""); }
  }
  if (!pasangPeta.ok) { pasangPeta.ok = true; petaAksi(); }
}
function tipPeta(el, p, x, y) {
  const m = PETA.get(el.dataset.peta), k = p.dataset.k, d = m.data.get(k), tip = el.querySelector(".jm-wl-tip");
  const nama = d?.nama || PROV[k]?.[0] || "";
  let h = `<header>${lambang(k, 36)}<div><strong>${esc(nama)}</strong><small>${d ? esc(t("tp.peta.rank", { r: num(m.urutan.findIndex((e) => e[0] === k) + 1), n: num(m.urutan.length) })) : esc(t("tp.peta.kosong"))}</small></div></header>`;
  if (d) {
    const sel = Math.round((d.v / m.rata - 1) * 100);
    h += `<p><span>${esc(m.l1)}</span><b>${esc(num(d.v, m.d))}</b></p>${d.lain.filter((q) => typeof q[1] === "number").map((q) => `<p><span>${esc(q[0])}</span><b>${esc(num(q[1], q[2]))}</b></p>`).join("")}<p><span>${esc(t("tp.peta.rata"))}</span><b>${esc((sel > 0 ? "+" : "") + num(sel) + "%")}</b></p>`;
  }
  h += `<small class="jm-wl-ajak">${esc(t("tp.peta.klik"))}</small>`;
  tip.innerHTML = h; tip.hidden = false;
  const b = el.getBoundingClientRect();
  tip.style.left = Math.max(8, Math.min(b.width - tip.offsetWidth - 8, x + 14)) + "px";
  tip.style.top = Math.max(8, Math.min(b.height - tip.offsetHeight - 8, y + 14)) + "px";
  el.querySelector(".jm-wl-sorot").setAttribute("d", p.getAttribute("d"));
}
function petaAksi() {
  const di = (e) => { const p = e.target.closest?.(".jm-tp-peta path[data-k]"); return p ? [p, p.closest(".jm-tp-peta")] : []; };
  document.addEventListener("pointermove", (e) => { const [p, el] = di(e); if (p) { const b = el.getBoundingClientRect(); tipPeta(el, p, e.clientX - b.left, e.clientY - b.top); } });
  document.addEventListener("pointerout", (e) => { const [p, el] = di(e); if (p && !p.contains(e.relatedTarget)) { el.querySelector(".jm-wl-tip").hidden = true; el.querySelector(".jm-wl-sorot").setAttribute("d", ""); } });
  document.addEventListener("focusin", (e) => { const [p, el] = di(e); if (p) { const b = el.getBoundingClientRect(), r = p.getBoundingClientRect(); tipPeta(el, p, r.left - b.left + r.width / 2, r.top - b.top + r.height / 2); } });
  document.addEventListener("focusout", (e) => { const [p, el] = di(e); if (p) { el.querySelector(".jm-wl-tip").hidden = true; el.querySelector(".jm-wl-sorot").setAttribute("d", ""); } });
  document.addEventListener("click", (e) => { const [p] = di(e); if (p) location.href = "/wilayah/" + p.dataset.k; });
  document.addEventListener("keydown", (e) => { const [p] = di(e); if (p && e.key === "Enter") location.href = "/wilayah/" + p.dataset.k; });
}

/* ---------- grafik garis/kolom interaktif ---------- */
const GRAF = new Map();
const langkahNice = (mx) => { const m = mx / 3, g = 10 ** Math.floor(Math.log10(m)); return ([1, 2, 2.5, 5, 10].find((k) => k * g >= m) || 10) * g; };
export function tonggakDari(ctx) {
  return (ctx.naskah?.bab?.[13]?.butir || []).map((x) => ({ tahun: String(x.tanggal).slice(0, 4), tanggal: x.tanggal, judul: tok(x.judul) })).filter((x) => x.tahun);
}
export function grafikSeri(b, id, ctx, { mode = "garis" } = {}) {
  const seri = (b.seri || []).map((s, i) => ({ nama: L(s.nama), sorot: !!s.sorot, m: new Map((s.titik || []).map((p) => [String(p[0]), +p[1]])), i }));
  if (!seri.length) return "";
  if (!seri.some((s) => s.sorot)) seri[0].sorot = true;
  const labels = [...new Set(seri.flatMap((s) => [...s.m.keys()]))].sort(), n = labels.length, M = innerWidth < 640, d = b.d || 0, satuan = b.satuan ? L(b.satuan) : "";
  const tahunan = labels.every((x) => /^\d{4}$/.test(x)), tg = tahunan ? tonggakDari(ctx).filter((x) => labels.includes(x.tahun)) : [];
  const Wd = M ? 420 : 900, Hd = M ? 270 : 290, Lk = 52, Rk = seri.length > 1 ? (M ? 110 : 230) : 24, T = 18, Bk = Hd - 32, fs = M ? 13 : 12;
  const mx = Math.max(1e-9, ...seri.flatMap((s) => [...s.m.values()])), g = langkahNice(mx), top = Math.ceil(mx / g) * g || g;
  const X = (i) => (mode === "kolom" ? Lk + ((i + 0.5) / n) * (Wd - Lk - Rk) : Lk + (n > 1 ? (i / (n - 1)) * (Wd - Lk - Rk) : 0)), Y = (v) => Bk - (v / top) * (Bk - T);
  let s = "";
  for (let v = 0; v <= top + 1e-9; v += g) s += `<line class="jm-gf-grid" x1="${Lk}" x2="${Wd - Rk}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text class="jm-gf-t2" x="${Lk - 6}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end" font-size="${fs - 1}">${esc(num(v, g < 1 ? 1 : 0))}</text>`;
  const kapasitas = Math.max(1, Math.floor((Wd - Lk - Rk) / (fs * 4.6))), step = Math.max(1, Math.ceil(n / kapasitas));
  labels.forEach((l, i) => { if ((n - 1 - i) % step === 0) s += `<text class="jm-gf-t2" x="${X(i).toFixed(1)}" y="${Bk + 18}" text-anchor="middle" font-size="${fs}">${esc(l)}</text>`; });
  for (const x of tg) { const i = labels.indexOf(x.tahun); s += `<line class="jm-tp-tg-g" x1="${X(i).toFixed(1)}" x2="${X(i).toFixed(1)}" y1="${T}" y2="${Bk}"/><circle class="jm-tp-tg" cx="${X(i).toFixed(1)}" cy="${Bk}" r="5"/>`; }
  const ujung = [];
  for (const sr of [...seri].sort((a, b2) => a.sorot - b2.sorot)) {
    const p = labels.map((l, i) => (sr.m.has(l) ? [X(i), Y(sr.m.get(l)), sr.m.get(l)] : null)).filter(Boolean);
    if (!p.length) continue;
    if (mode === "kolom") { const bw = Math.min(26, ((Wd - Lk - Rk) / n) * 0.66); s += labels.map((l, i) => (sr.m.has(l) ? `<rect class="jm-gf-b jm-tp-kol${i === n - 1 ? " jm-gf-sorot" : ""}" data-i="${i}" x="${(X(i) - bw / 2).toFixed(1)}" y="${Y(sr.m.get(l)).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, Bk - Y(sr.m.get(l))).toFixed(1)}" rx="2"/>` : "")).join(""); continue; }
    const pts = p.map((q) => q[0].toFixed(1) + "," + q[1].toFixed(1)).join(" ");
    if (sr.sorot) s += `<polygon class="jm-tp-area" points="${p[0][0].toFixed(1)},${Bk} ${pts} ${p.at(-1)[0].toFixed(1)},${Bk}"/>`;
    s += `<polyline class="jm-gf-gar ${sr.sorot ? "jm-gf-sorot-g" : "jm-gf-gar-abu"}" points="${pts}"/><circle class="jm-tp-akhir${sr.sorot ? " jm-tp-akhir-s" : ""}" cx="${p.at(-1)[0].toFixed(1)}" cy="${p.at(-1)[1].toFixed(1)}" r="4"/>`;
    ujung.push({ y: p.at(-1)[1], x: p.at(-1)[0], on: sr.sorot, teks: sr.nama });
  }
  if (seri.length > 1) { ujung.sort((a, b2) => a.y - b2.y); for (let i = 1; i < ujung.length; i++) if (ujung[i].y - ujung[i - 1].y < fs + 3) ujung[i].y = ujung[i - 1].y + fs + 3; s += ujung.map((x) => `<text class="jm-gf-t1${x.on ? " jm-gf-tb" : ""}" x="${(x.x + 9).toFixed(1)}" y="${(x.y + 4).toFixed(1)}" font-size="${fs - 1}">${esc(x.teks.length > (M ? 15 : 34) ? x.teks.slice(0, M ? 14 : 33) + "…" : x.teks)}</text>`).join(""); }
  s += `<line class="jm-tp-xh" x1="0" x2="0" y1="${T}" y2="${Bk}" hidden/>` + seri.map((sr) => `<circle class="jm-tp-dot${sr.sorot ? " jm-tp-dot-s" : ""}" data-s="${sr.i}" cx="0" cy="0" r="5" hidden/>`).join("") + `<rect class="jm-tp-tangkap" x="${Lk}" y="0" width="${Wd - Lk - Rk}" height="${Hd - 30}" fill="transparent"/>`;
  GRAF.set(id, { labels, seri, d, satuan, tg, X: labels.map((_, i) => X(i)), Y, W: Wd, Lk, Rk, mode, label: L(b.label) });
  return `<div class="jm-tp-gr"><svg class="jm-gf jm-tp-gi" data-g="${esc(id)}" viewBox="0 0 ${Wd} ${Hd}" role="img" tabindex="0" aria-label="${esc(L(b.label))}" focusable="false">${s}</svg>${tg.length ? `<p class="jm-tp-tg-ket"><i></i>${esc(t("tp.tonggak"))}</p>` : ""}</div>`;
}
function tipGrafik(svg, i, cx, cy) {
  const m = GRAF.get(svg.dataset.g), tip = (tipGrafik.el ||= Object.assign(document.createElement("div"), { className: "jm-gf-tip jm-tp-tip", hidden: true, role: "tooltip" }));
  if (!tip.isConnected) document.body.append(tip);
  const th = m.labels[i], fmt = (v) => num(v, m.d) + (m.satuan ? " " + m.satuan : "");
  let h = `<b>${esc(th)}</b>`;
  for (const sr of m.seri) if (sr.m.has(th)) {
    const v = sr.m.get(th), prev = m.labels[i - 1] != null ? sr.m.get(m.labels[i - 1]) : null, dl = prev ? Math.round((v / prev - 1) * 1000) / 10 : null;
    h += `<span class="jm-tp-tr"><i class="jm-tp-tdot${sr.sorot ? " jm-tp-tdot-s" : ""}"></i>${m.seri.length > 1 ? `<span>${esc(sr.nama)}</span>` : ""}<b>${esc(fmt(v))}</b></span>` + (sr.sorot && dl != null ? `<small>${esc(t("tp.vs_tahun", { d: (dl > 0 ? "+" : "") + num(dl, 1) + "%", tahun: m.labels[i - 1] }))}</small>` : "");
  }
  for (const x of m.tg.filter((q) => q.tahun === th)) h += `<small class="jm-tp-tg-t">${ikon("bendera", 14)}<span>${esc(x.judul)}</span></small>`;
  tip.innerHTML = h; tip.hidden = false;
  const w = tip.offsetWidth, hh = tip.offsetHeight;
  tip.style.transform = `translate(${Math.max(8, Math.min(innerWidth - w - 8, cx + 14))}px,${Math.max(8, Math.min(innerHeight - hh - 8, cy - hh - 10))}px)`;
  const k = svg.getBoundingClientRect().width / m.W, x = m.X[i];
  const xh = svg.querySelector(".jm-tp-xh"); if (m.mode !== "kolom") { xh.setAttribute("x1", x); xh.setAttribute("x2", x); xh.hidden = false; }
  for (const dot of svg.querySelectorAll(".jm-tp-dot")) { const sr = m.seri[+dot.dataset.s]; if (m.mode !== "kolom" && sr.m.has(th)) { dot.setAttribute("cx", x); dot.setAttribute("cy", m.Y(sr.m.get(th))); dot.hidden = false; } else dot.hidden = true; }
  svg.querySelectorAll(".jm-tp-kol").forEach((r) => r.classList.toggle("jm-tp-kol-on", +r.dataset.i === i));
}
const tutupGrafik = (svg) => { if (tipGrafik.el) tipGrafik.el.hidden = true; svg.querySelectorAll(".jm-tp-xh,.jm-tp-dot").forEach((e) => { e.hidden = true; }); svg.querySelectorAll(".jm-tp-kol-on").forEach((r) => r.classList.remove("jm-tp-kol-on")); };
let grafAktif = null;
export function pasangGrafik() {
  if (pasangGrafik.ok) return; pasangGrafik.ok = true;
  const idx = (svg, e) => { const m = GRAF.get(svg.dataset.g), r = svg.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * m.W; let b = 0; m.X.forEach((q, i) => { if (Math.abs(q - x) < Math.abs(m.X[b] - x)) b = i; }); return b; };
  document.addEventListener("pointermove", (e) => { const svg = e.target.closest?.(".jm-tp-gi"); if (!svg) return; if (!e.target.closest(".jm-tp-tangkap,.jm-tp-kol,.jm-tp-tg")) { if (grafAktif) tutupGrafik(svg); return; } grafAktif = svg; tipGrafik(svg, idx(svg, e), e.clientX, e.clientY); });
  document.addEventListener("pointerout", (e) => { const svg = e.target.closest?.(".jm-tp-gi"); if (svg && !svg.contains(e.relatedTarget)) tutupGrafik(svg); });
  document.addEventListener("keydown", (e) => { const svg = e.target.closest?.(".jm-tp-gi"); if (!svg || !/^Arrow(Left|Right)$/.test(e.key)) return; const m = GRAF.get(svg.dataset.g); svg.dataset.k = Math.max(0, Math.min(m.labels.length - 1, +(svg.dataset.k ?? m.labels.length - 1) + (e.key === "ArrowLeft" ? -1 : 1))); const r = svg.getBoundingClientRect(); tipGrafik(svg, +svg.dataset.k, r.left + (m.X[+svg.dataset.k] / m.W) * r.width, r.top + 40); e.preventDefault(); });
  document.addEventListener("focusout", (e) => { const svg = e.target.closest?.(".jm-tp-gi"); if (svg) tutupGrafik(svg); });
}

/* batang horizontal bertanda negara (bendera) dengan tooltip bersama (jm-batang) */
export function batangNegara(b) {
  const titik = (b.seri?.[0]?.titik || []), sat = b.satuan ? L(b.satuan) : "", maks = Math.max(1, ...titik.map((p) => +p[1]));
  const rows = titik.map((p, i) => ({ label: String(p[0]), labelHtml: negaraSel(String(p[0])), bagian: [{ nilai: +p[1], kelas: i === 0 ? "jm-an-id" : "jm-an-c1" }], teks: num(+p[1], b.d || 0) + (sat ? " " + sat : ""), sorot: i === 0 }));
  return batangHtml(rows, { maks, label: L(b.label), satuan: sat });
}

/* ---------- linimasa vertikal bertitik ---------- */
export function linimasaVertikal(butir, ctx) {
  const reg = new Map((ctx.dasar.regulasi || []).map((r) => [r.id, r]));
  const li = [...butir].sort((a, z) => a.tanggal.localeCompare(z.tanggal)).map((x) => {
    const r = x.reg ? reg.get(x.reg) : null, judul = tok(x.judul), depan = x.tanggal > HARI_INI;
    const st = depan ? "rencana" : r?.status === "dicabut" || /\bdicabut\b|\brevoked\b|\brepealed\b/i.test(judul) ? "dicabut" : "berlaku";
    const url = (/^https?:\/\//.test(x.url || "") && x.url) || (r && `/regulasi?id=${encodeURIComponent(r.id)}`) || "";
    const pb = penerbit(judul, r?.jenis), ik = st === "dicabut" ? "silang" : st === "rencana" ? "jam" : "centang";
    const bersih = judul.replace(/\s*\((dicabut|revoked|repealed)\)\s*/i, " ").trim();
    return `<li class="jm-tp-tl jm-tp-tl-${st}"><span class="jm-tp-tl-titik">${ikon(ik, 16)}</span><div class="jm-tp-tl-isi"><div class="jm-tp-tl-kep"><time datetime="${esc(x.tanggal)}">${esc(tanggal(x.tanggal))}</time>${pilStatusLini(st)}${r ? unduhRegHtml({ judul: bersih, url_pdf: r.pdf, url_sumber: r.url }) : ""}</div><p class="jm-tp-tl-j">${logoPenerbit(pb)}${url ? `<a href="${esc(url)}"${/^https?:/.test(url) ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(bersih)}</a>` : `<span>${esc(bersih)}</span>`}</p></div></li>`;
  }).join("");
  return `<ol class="jm-tp-tlv">${li}</ol>`;
}
const pilStatusLini = (st) => `<span class="jm-pil ${st === "berlaku" ? "jm-pil-ok" : st === "dicabut" ? "jm-pil-bad" : ""} jm-tp-pil-i">${ikon(st === "dicabut" ? "silang" : st === "rencana" ? "jam" : "centang", 14)}<span>${esc(t("tp.st." + st))}</span></span>`;
