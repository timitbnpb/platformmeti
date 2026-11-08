/* /topik: bab 43 (Jalan proyek: gantt interaktif + kartu tahap per skala) dan bab 44 (Model bisnis: matriks, kartu model, arus kas ilustratif).
   Skema: tipe "jalan" dan "model" di docs/perencanaan/TOPIK-SKEMA.md. Angka datang dari naskah; tidak ada angka dikarang di sini. */
import { S, L, u, num, tok, esc, ikon, catatan, daftarTabel } from "/topik_umum.js";
import * as D from "/topik_data.js";

const GANTT = new Map();
const pilBukti = (b) => `<span class="jm-pil ${b === "Data" ? "jm-pil-ok" : "jm-pil-warn"} jm-tp-pil-i"><span>${esc(u("jl.bukti." + b))}</span></span>`;
const potong = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const rentang = (a) => (a[0] === a[1] ? num(a[0]) : num(a[0]) + "-" + num(a[1]));
const taut = (x) => (x.u ? `<a href="${esc(x.u)}">${esc(typeof x.nama === "object" ? tok(x.nama) : x.nama)}</a>` : esc(typeof x.nama === "object" ? tok(x.nama) : x.nama));
const tautReg = (x) => `<a href="${esc(x.u)}">${esc(x.label)}</a>`;

function gantt(b, s, idg) {
  const M = innerWidth < 640, W = M ? 420 : 900, Lk = M ? 120 : 270, Rk = 14, T = 26, rh = M ? 30 : 28, fs = M ? 12 : 12;
  const baris = b.tahap.filter((t) => t.dur[s.k] && t.id !== "cod");
  const maks = Math.max(1, b.total[s.k][1]), langkah = maks > 60 ? 12 : maks > 30 ? 6 : maks > 12 ? 3 : 1;
  const X = (m) => Lk + (m / maks) * (W - Lk - Rk), H = T + baris.length * rh + 8;
  let g = "";
  for (let m = 0; m <= maks; m += langkah) g += `<line class="jm-gf-grid" x1="${X(m).toFixed(1)}" x2="${X(m).toFixed(1)}" y1="${T - 6}" y2="${H - 8}"/><text class="jm-gf-t2" x="${X(m).toFixed(1)}" y="${T - 10}" text-anchor="middle" font-size="${fs - 1}">${m}</text>`;
  const rows = [];
  baris.forEach((t, i) => {
    const y = T + i * rh, mu = t.mulai[s.k];
    rows.push({ nama: tok(t.nama), dur: t.dur[s.k], mulai: mu, bukti: t.bukti });
    g += `<text class="jm-gf-t1" x="${Lk - 8}" y="${y + rh / 2 + 4}" text-anchor="end" font-size="${fs}">${esc(potong(tok(t.nama), M ? 17 : 38))}</text>`;
    g += `<rect class="jm-jl-bar-max" data-g="${idg}" data-i="${i}" x="${X(mu[0]).toFixed(1)}" y="${y + 4}" width="${Math.max(2, X(mu[2]) - X(mu[0])).toFixed(1)}" height="${rh - 8}" rx="3"/>`;
    g += `<rect class="jm-jl-bar jm-jl-b-${t.bukti}" data-g="${idg}" data-i="${i}" x="${X(mu[0]).toFixed(1)}" y="${y + 4}" width="${Math.max(2, X(mu[1]) - X(mu[0])).toFixed(1)}" height="${rh - 8}" rx="3"/>`;
  });
  GANTT.set(idg, rows);
  return `<div class="jm-jl-gantt"><svg class="jm-gf" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(u("jl.gantt") + ": " + tok(s.l))}" focusable="false">${g}</svg><p class="jm-bantu">${ikon("jam", 14)} ${esc(u("jl.gantt.ket"))}</p></div>`;
}

function modalHtml(m) {
  if (!m) return `<p class="jm-bantu">${esc(u("jl.modal.kosong"))}</p>`;
  const r = m.rendah != null && m.tinggi != null && m.rendah !== m.tinggi ? num(m.rendah, 1) + "-" + num(m.tinggi, 1) : num(m.tengah ?? m.rendah, 1);
  return `<p class="jm-tp-p">${ikon("kartu", 14)} ${esc(u("jl.modal", { r, t: m.tengah != null ? num(m.tengah, 1) : "-" }))} ${pilBukti(m.bukti)}</p>`;
}
function kartuTahap(t, s) {
  const d = t.dur[s.k], by = t.biaya?.[s.k];
  const biaya = by && (by.min != null || by.maks != null) ? `${num(by.min)}${by.maks != null ? "-" + num(by.maks) : ""} ${esc(by.satuan || "")} ${pilBukti(by.bukti)}` : `<span class="jm-bantu">${esc(u("jl.biaya.menunggu"))}</span>`;
  const pihak = (t.pihak || []).map(taut).join(", ") || "-";
  const reg = (t.reg || []).map(tautReg).join(", ") || `<span class="jm-bantu">${esc(u("jl.tanpa_reg"))}</span>`;
  return `<li><b>${esc(tok(t.nama))}</b><span>${esc(tok(t.isi))}</span><dl class="jm-jl-dl"><div><dt>${ikon("jam", 14)} ${esc(u("jl.durasi"))}</dt><dd>${d[1] === 0 ? esc(u("jl.milestone")) : esc(u("jl.bulan", { r: rentang(d) }))} ${pilBukti(t.bukti)}</dd></div><div><dt>${ikon("kartu", 14)} ${esc(u("jl.biaya"))}</dt><dd>${biaya}</dd></div><div><dt>${ikon("gedung", 14)} ${esc(u("jl.pihak"))}</dt><dd>${pihak}</dd></div><div><dt>${ikon("regulasi", 14)} ${esc(u("jl.reg"))}</dt><dd>${reg}</dd></div><div><dt>${ikon("peringatan", 14)} ${esc(u("jl.risiko"))}</dt><dd>${esc(tok(t.risiko))}</dd></div><div><dt>${ikon("centang", 14)} ${esc(u("jl.mitigasi"))}</dt><dd>${esc(tok(t.mitigasi))}</dd></div></dl></li>`;
}

export function jalan(b, id) {
  const awal = b.skala[b.skala.length - 1].k;
  const tab = `<div class="jm-tp-abjad jm-jl-tab" role="group" aria-label="${esc(u("jl.skala"))}">${b.skala.map((s) => `<button type="button" class="jm-tp-hrf" data-jl="${esc(s.k)}" aria-pressed="${s.k === awal}">${esc(tok(s.l))}</button>`).join("")}</div>`;
  const panel = b.skala.map((s) => {
    const idg = `jl-${id}-${s.k}`, tot = b.total[s.k];
    return `<div class="jm-jl-panel" data-jl-p="${esc(s.k)}"${s.k === awal ? "" : " hidden"}><p class="jm-tp-p">${esc(tok(s.ket))} <b>${esc(u("jl.total", { r: rentang(tot) }))}</b></p>${modalHtml(b.modal?.[s.k])}${gantt(b, s, idg)}<ol class="jm-tp-langkah jm-jl-tahap">${b.tahap.filter((t) => t.dur[s.k]).map((t) => kartuTahap(t, s)).join("")}</ol></div>`;
  }).join("");
  return { html: (b.intro || []).map((p) => `<p class="jm-tp-p">${esc(tok(p))}</p>`).join("") + tab + panel + catatan(b.catatan), sumber: b.sumber };
}

/* ---------- bab 44 ---------- */
const nilai = (v) => `<span class="jm-jl-n jm-jl-n${v}" title="${v}/5">${"●".repeat(v)}<i>${"●".repeat(5 - v)}</i></span>`;
function kartuModel(m) {
  const contoh = m.contoh.length ? m.contoh.map(taut).join(", ") : `<span class="jm-bantu">${esc(u("jl.contoh.kosong"))}</span>`;
  const reg = m.reg.length ? m.reg.map(tautReg).join(", ") : "-";
  return `<article class="jm-tp-kartu jm-jl-model"><h3>${esc(tok(m.nama))} <span class="jm-pil jm-pil-warn jm-tp-pil-i"><span>${esc(u("jl.jenis." + m.jenis))}</span></span></h3><p>${esc(tok(m.isi))}</p><dl class="jm-jl-dl"><div><dt>${esc(u("jl.pembeli"))}</dt><dd>${esc(tok(m.pembeli))}</dd></div><div><dt>${esc(u("jl.kontrak"))}</dt><dd>${esc(tok(m.kontrak))}</dd></div><div><dt>${esc(u("jl.status"))}</dt><dd>${esc(tok(m.status))}</dd></div><div><dt>${esc(u("jl.reg"))}</dt><dd>${reg}</dd></div><div><dt>${esc(u("jl.untung"))}</dt><dd>${esc(tok(m.untung))}</dd></div><div><dt>${esc(u("jl.rugi"))}</dt><dd>${esc(tok(m.rugi))}</dd></div><div><dt>${esc(u("jl.kas"))}</dt><dd>${esc(tok(m.kas))}</dd></div><div><dt>${esc(u("jl.contoh"))}</dt><dd>${contoh}</dd></div><div><dt>${esc(u("jl.dunia"))}</dt><dd>${esc(tok(m.dunia))}</dd></div></dl></article>`;
}

export function model(b, id, ctx) {
  const kols = [
    { k: "nama", l: u("jl.model"), f: (r) => `<b>${esc(tok(r.nama))}</b><br><small>${esc(u("jl.jenis." + r.jenis))}</small>`, v: (r) => tok(r.nama) },
    ...[["modal", "jl.s.modal"], ["risiko", "jl.s.risiko"], ["cepat", "jl.s.cepat"], ["skala", "jl.s.skala"]].map(([k, key]) => ({ k, l: u(key), num: true, f: (r) => nilai(r.skor[k]), v: (r) => r.skor[k] })),
    { k: "status", l: u("jl.status"), f: (r) => esc(tok(r.status)), v: (r) => tok(r.status) },
  ];
  let h = (b.intro || []).map((p) => `<p class="jm-tp-p">${esc(tok(p))}</p>`).join("");
  h += `<h3 class="jm-tp-h3">${esc(u("jl.matriks"))}</h3><p class="jm-bantu">${esc(u("jl.matriks.ket"))} ${pilBukti("Hipotesis")}</p>` + daftarTabel("model-" + id, kols, b.models, 8);
  h += `<h3 class="jm-tp-h3">${esc(u("jl.kartu"))}</h3><div class="jm-jl-kartu">${b.models.map(kartuModel).join("")}</div>`;
  h += `<h3 class="jm-tp-h3">${esc(u("jl.kas.judul"))}</h3>`;
  if (b.kas.seri.length) {
    h += `<p class="jm-bantu">${esc(L(b.kas.label))}</p>` + D.grafikSeri({ label: b.kas.label, satuan: { id: "Rp ribu per kW", en: "Rp thousand per kW" }, d: 0, seri: b.kas.seri }, "kas-" + id, ctx || { dasar: {} }, { mode: "garis" });
    const kr = [{ k: "nama", l: u("jl.model"), f: (r) => esc(r.nama), v: (r) => r.nama }, { k: "irr", l: u("jl.irr"), num: true, f: (r) => (r.irr == null ? "-" : num(r.irr, 1) + "%"), v: (r) => r.irr }, { k: "pb", l: u("jl.payback"), num: true, f: (r) => (r.payback == null ? "-" : num(r.payback, 1)), v: (r) => r.payback }];
    h += daftarTabel("kas-t-" + id, kr, b.kas.ringkas.map((r) => ({ ...r, nama: tok(b.models.find((m) => m.id === r.id)?.nama) })), 8);
    h += catatan(b.kas.asumsi);
  } else h += `<p class="jm-tp-p">${esc(tok(b.kas.menunggu))}</p>` + catatan(b.kas.asumsi);
  return { html: h + catatan(b.catatan), csv: true, sumber: b.sumber };
}

/* ---------- interaksi: tab skala + tooltip gantt ---------- */
export function pasangJalan() {
  if (pasangJalan.ok) return; pasangJalan.ok = true;
  document.addEventListener("click", (e) => {
    const bt = e.target.closest?.("[data-jl]"); if (!bt) return;
    const w = bt.closest(".jm-tp-bab") || document;
    w.querySelectorAll("[data-jl]").forEach((x) => x.setAttribute("aria-pressed", String(x === bt)));
    w.querySelectorAll("[data-jl-p]").forEach((p) => { p.hidden = p.dataset.jlP !== bt.dataset.jl; });
  });
  const tip = () => (pasangJalan.tip ||= Object.assign(document.createElement("div"), { className: "jm-gf-tip jm-tp-tip", hidden: true, role: "tooltip" }));
  const buka = (r, x, y) => {
    const rows = GANTT.get(r.dataset.g), t = rows?.[+r.dataset.i]; if (!t) return;
    const el = tip(); if (!el.isConnected) document.body.append(el);
    el.innerHTML = `<b>${esc(t.nama)}</b><small>${esc(u("jl.tip", { a: num(t.mulai[0]), b: num(t.mulai[1]), c: num(t.mulai[2]), r: rentang(t.dur) }))}</small><small>${esc(u("jl.bukti." + t.bukti))}</small>`;
    el.hidden = false;
    el.style.transform = `translate(${Math.max(8, Math.min(innerWidth - el.offsetWidth - 8, x + 14))}px,${Math.max(8, Math.min(innerHeight - el.offsetHeight - 8, y - el.offsetHeight - 10))}px)`;
  };
  document.addEventListener("pointermove", (e) => { const r = e.target.closest?.(".jm-jl-gantt rect[data-g]"); if (r) buka(r, e.clientX, e.clientY); else if (pasangJalan.tip) pasangJalan.tip.hidden = true; });
  document.addEventListener("pointerdown", (e) => { const r = e.target.closest?.(".jm-jl-gantt rect[data-g]"); if (r) buka(r, e.clientX, e.clientY); });
}
