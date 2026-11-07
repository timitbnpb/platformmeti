/* Tab Radar kabupaten: peta koroplet PROVINSI (rata-rata skor kabupatennya; geometri kabupaten belum ada di repo), panel geser, tabel 514 kabupaten/kota berurut.
   Skor dihitung scripts/pipa/radar_kabupaten.mjs lewat radar_rumus.js; layar menghitung ulang per teknologi dari norma yang sama. HIPOTESIS terbuka.
   INP: segmen teknologi seketika (aria-pressed); peta, tabel menyusul lewat nanti(). */
import { t, angka } from "/i18n.js";
import { esc, nanti, ikon, debounce, galatHtml } from "/inti/umum.js";
import { exHtml, sumberHtml, pilihHtml, cariHtml } from "/inti/komponen.js";
import { aksiHtml } from "/inti/aksi_ex.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { ikonTek } from "/inti/ikon_tek.js";
import { geoProvinsi, jalurPerProvinsi } from "/inti/peta_indonesia.js";
import { geserPanel } from "/inti/panel_geser.js";
import { batang } from "/grafik.js";
import { TEK, BOBOT_SEMUA, BOBOT_TEK, skorTek, komponen, skor as hitungSkor, tingkatSkor } from "/radar_rumus.js";

const $ = (id) => document.getElementById(id);
const N = (n, d = 0) => angka(n, { desimal: d });
const PER = 15;
const lambang = (kode, u = 20) => `<img src="/img/provinsi/${esc(kode)}.png" width="${u}" height="${u}" alt="" loading="lazy" decoding="async">`;
const labTek = (k) => t("pj.tek." + k);
const hl = (x) => `<span class="jm-hl">${esc(x)}</span>`;
const hipPil = () => `<span class="jm-pil jm-pil-warn">${esc(t("kl.hipotesis"))}</span>`;
const pilSkor = (x) => { const k = tingkatSkor(x); return k ? `<span class="jm-pil rd2-sk rd2-sk-${k}" title="${esc(t("rd2.tingkat." + k))}">${ikon(k === "t" ? "centang" : k === "s" ? "info" : "peringatan", 14)}<b>${esc(N(x, 1))}</b></span>` : `<span class="rd2-kosong" title="${esc(t("rd2.tanpa_skor"))}">-</span>`; };

const tingkatPil = (x) => { const k = tingkatSkor(x); return k ? `<span class="jm-pil rd2-sk rd2-sk-${k}">${ikon(k === "t" ? "centang" : k === "s" ? "info" : "peringatan", 14)}${esc(t("rd2.tingkat." + k))}</span>` : ""; };

let D, GEO, isi;
const S = { tek: "semua", prov: "", jenis: "", q: "", uk: "skor", ua: -1, hal: 1 };
const P = (kode) => D.provinsi[kode];
const skorBaris = (b) => (S.tek === "semua" ? b.skor : b.skor_tek[S.tek]);
const celahProv = (kode) => P(kode).mentah.celah[S.tek];

/* ---------- agregat provinsi ---------- */
function agregat() {
  const m = new Map();
  for (const b of D.baris) { const v = skorBaris(b); if (v === null) continue; const a = m.get(b.prov) || { n: 0, s: 0, top: null }; a.n++; a.s += v; if (!a.top || v > skorBaris(a.top)) a.top = b; m.set(b.prov, a); }
  for (const a of m.values()) a.rata = a.s / a.n;
  return m;
}
let AGR = new Map(), BATAS = [];
function kuantil() {
  const v = [...AGR.values()].map((a) => a.rata).sort((x, y) => x - y);
  BATAS = v.length ? [0, 1, 2, 3, 4, 5].map((i) => v[Math.round((i * (v.length - 1)) / 5)]) : [];
}
const kelas = (x) => { let k = 0; for (let i = 1; i < 5; i++) if (x >= BATAS[i]) k = i; return k; };

/* ---------- kerangka ---------- */
function kerangka() {
  const segmen = ["semua", ...TEK].map((k) => `<button type="button" class="jm-kl-tb" data-tek="${k}" aria-pressed="${S.tek === k}">${k === "semua" ? ikon("analisis", 20) : ikonTek(k)}<span>${esc(k === "semua" ? t("pel.semua") : labTek(k))}</span></button>`).join("");
  isi.innerHTML = `
  <div id="rdPeta">${exHtml({ id: "exRdPeta", ikon: "peta", topik: "", judulHtml: "", isiHtml: `<div class="jm-pel-seg" id="rdSeg" role="group" aria-label="${esc(t("rd2.seg"))}">${segmen}</div>
    <div class="jm-pel-penuh rd2-peta">
      <div id="rdKanvas" class="rd2-kanvas" role="application" aria-label="${esc(t("rd2.peta.label"))}"></div>
      <div id="rdTip" class="jm-pel-tip" role="status" hidden></div>
      <details class="jm-pel-lapis" id="rdLapis" open><summary><span>${esc(t("rd2.legenda"))}</span></summary><div id="rdLegenda"></div></details>
      <details class="jm-pel-panel" id="rdPanel" open><summary id="rdPanelJ"><span>${esc(t("rd2.panel"))}</span></summary><div id="rdPanelIsi" class="jm-pel-panel-isi"></div></details>
    </div>` })}</div>
  <div id="rdTabel">${exHtml({ id: "exRdTabel", ikon: "tabel", topik: "", judulHtml: "", isiHtml: `<div id="rdTabelIsi"></div>` })}</div>
  <div id="rdMetode"></div>`;
}
function kepala(id, d) {
  const m = $(id), tmp = document.createElement("div");
  tmp.innerHTML = exHtml({ ...d, isiHtml: "" });
  m.querySelector(".jm-ex-hd").replaceWith(tmp.querySelector(".jm-ex-hd"));
}
const srcRadar = () => sumberHtml(`${D.sumber.map((s) => esc(s.judul)).join("<br>")}<br>${esc(t("rd2.sumber.tgl", { tgl: D.dibangun_pada }))}`);
function judul() {
  const urut = [...AGR.entries()].sort((a, z) => z[1].rata - a[1].rata), [kp, ap] = urut[0] || [];
  kepala("rdPeta", { ikon: "peta", topik: t("rd2.ex.peta"), judulHtml: kp ? `${esc(P(kp).nama)} ${esc(t("rd2.ex.peta.j"))} ${hl(N(ap.rata, 1))}` : esc(t("rd2.ex.peta.k")), subHtml: `${esc(t("rd2.ex.peta.s"))} ${hipPil()}`, aksiHtml: aksiHtml() + srcRadar() });
  const baris = barisTabel();
  kepala("rdTabel", { ikon: "tabel", topik: t("rd2.ex.tabel"), judulHtml: `${hl(N(baris.length))} ${esc(t("rd2.ex.tabel.j"))}`, subHtml: `${esc(t("rd2.ex.tabel.s"))} ${hipPil()}`, aksiHtml: aksiHtml({ csv: true }) + srcRadar() });
}

/* ---------- peta provinsi (SVG, offline) ---------- */
function peta() {
  const W = 1000, H = 379, jalur = jalurPerProvinsi(GEO, W, H);
  $("rdKanvas").innerHTML = `<svg class="rd2-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("rd2.peta.label"))}" focusable="false">${jalur.map((j) => {
    const a = AGR.get(String(j.kode)), k = a ? kelas(a.rata) : -1;
    return `<path d="${j.d}" class="rd2-prov rd2-f${k < 0 ? "x" : k}${S.prov === String(j.kode) ? " rd2-on" : ""}" data-kode="${esc(j.kode)}" tabindex="0" role="button" aria-label="${esc((P(String(j.kode))?.nama || "") + (a ? ": " + N(a.rata, 1) : ""))}"/>`;
  }).join("")}</svg>`;
}
function legenda() {
  const nama = ["jm-pel-k0", "jm-pel-k1", "jm-pel-k2", "jm-pel-k3", "jm-pel-k4"];
  $("rdLegenda").innerHTML = `<ul class="jm-pel-kuantil">${BATAS.length ? nama.map((k, i) => `<li><i class="${k}" aria-hidden="true"></i><span>${esc(t("pel.rentang", { a: N(BATAS[i], 1), b: N(BATAS[i + 1], 1) }))}</span></li>`).join("") : ""}<li><i class="jm-pel-nd" aria-hidden="true"></i><span>${esc(t("rd2.legenda.tanpa"))}</span>${sumberHtml(esc(t("rd2.legenda.cara")), t("pel.legenda.info"))}</li></ul>`;
}
function tip(kode, e) {
  const a = AGR.get(kode), el = $("rdTip"), p = P(kode); if (!p) return;
  el.innerHTML = `<header>${lambang(kode, 36)}<div><strong>${esc(p.nama)}</strong><small>${esc(t("rd2.tip.n", { n: a ? a.n : 0 }))}</small></div></header><p><span>${esc(t("rd2.tip.rata"))}</span><b>${esc(a ? N(a.rata, 1) : "-")}</b></p><small class="jm-pel-ajak">${esc(t("pel.tip.klik"))}</small>`;
  el.hidden = false;
  const r = $("rdKanvas").getBoundingClientRect();
  el.style.left = Math.max(8, Math.min(r.width - el.offsetWidth - 8, e.clientX - r.left + 16)) + "px";
  el.style.top = Math.max(8, Math.min(r.height - el.offsetHeight - 8, e.clientY - r.top + 16)) + "px";
}

/* ---------- panel provinsi ---------- */
function panel() {
  const el = $("rdPanelIsi");
  if (!S.prov) {
    const top = [...AGR.entries()].sort((a, z) => z[1].rata - a[1].rata).slice(0, 6);
    $("rdPanelJ").firstElementChild.textContent = t("rd2.panel");
    el.innerHTML = `<h4>${esc(t("rd2.panel.top"))}</h4><ol class="jm-pel-top">${top.map(([k, a], i) => `<li><button type="button" data-prov="${esc(k)}"><span class="jm-pel-top-n">${i + 1}</span>${lambang(k)}<span class="jm-pel-top-p">${esc(P(k).nama)}</span>${pilSkor(a.rata)}</button></li>`).join("")}</ol>`;
    return;
  }
  const a = AGR.get(S.prov), p = P(S.prov), kab = D.baris.filter((b) => b.prov === S.prov && skorBaris(b) !== null).sort((x, z) => skorBaris(z) - skorBaris(x));
  $("rdPanelJ").firstElementChild.textContent = p.nama;
  el.innerHTML = `<div class="jm-pel-pj">${lambang(S.prov, 32)}<b>${esc(p.nama)}</b><a href="/wilayah/${esc(S.prov)}" class="jm-pel-tautan">${ikon("tautan", 14)}<span>${esc(t("pel.profil"))}</span></a></div>
    <p class="jm-pel-utama"><span>${esc(t("rd2.tip.rata"))}</span><b>${esc(a ? N(a.rata, 1) : "-")}</b>${hipPil()}</p>
    <h4>${esc(t("rd2.panel.kab", { n: N(kab.length) }))}</h4>
    <ol class="jm-pel-top rd2-top">${kab.slice(0, 8).map((b, i) => `<li><button type="button" data-kab="${esc(b.kode)}"><span class="jm-pel-top-n">${i + 1}</span><span class="jm-pel-top-p">${esc(b.nama)}</span>${pilSkor(skorBaris(b))}</button></li>`).join("")}</ol>
    <button type="button" class="jm-tbl" id="rdSemuaProv">${ikon("tabel", 16)}<span>${esc(t("rd2.panel.tabel"))}</span></button>
    <button type="button" class="jm-hapus" id="rdLepasProv">${ikon("silang", 16)}${esc(t("rd2.panel.lepas"))}</button>`;
}
function pilihProv(kode) {
  S.prov = kode; S.hal = 1;
  for (const p of $("rdKanvas").querySelectorAll(".rd2-prov")) p.classList.toggle("rd2-on", p.dataset.kode === kode);
  const sp = $("rdTprov"); if (sp) sp.value = kode;
  $("rdPanel").open = true;
  nanti(() => { panel(); tabel(); judul(); });
}

/* ---------- tabel ---------- */
function barisTabel() {
  const q = S.q.trim().toLowerCase();
  const r = D.baris.filter((b) => (!S.prov || b.prov === S.prov) && (!S.jenis || b.jenis === S.jenis) && (!q || b.nama.toLowerCase().includes(q) || P(b.prov).nama.toLowerCase().includes(q)));
  const kunci = { nama: (b) => b.nama, skor: (b) => skorBaris(b), celah: (b) => celahProv(b.prov), bpp: (b) => P(b.prov).mentah.bpp, pasar: (b) => b.kab?.proyek_mw, dasar: (b) => (b.kab ? 1 : 0) }[S.uk];
  return r.sort((a, z) => {
    const x = kunci(a), y = kunci(z);
    if (x == null) return 1; if (y == null) return -1;
    return (typeof x === "string" ? x.localeCompare(y, "id") : x - y) * S.ua || a.nama.localeCompare(z.nama, "id");
  });
}
const KOL = [["nama", "rd2.c.kab", ""], ["skor", "rd2.c.skor", ""], ["celah", "rd2.c.celah", "MW"], ["bpp", "rd2.c.bpp", "Rp/kWh"], ["pasar", "rd2.c.pasar", "MW"], ["dasar", "rd2.c.dasar", ""]];
function tabel() {
  const semua = barisTabel(), maks = Math.max(1, Math.ceil(semua.length / PER));
  S.hal = Math.min(S.hal, maks);
  const rows = semua.slice((S.hal - 1) * PER, S.hal * PER);
  const td = (i, h, kelasTd = "") => `<td data-label="${esc(t(KOL[i][1]))}"${kelasTd ? ` class="${kelasTd}"` : ""}>${h}</td>`;
  const th = KOL.map(([k, lab, sat]) => `<th scope="col" class="rd2-c-${k}" aria-sort="${S.uk === k ? (S.ua > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-uk="${k}">${esc(t(lab))}</button>${sat ? `<small>${esc(sat)}</small>` : ""}</th>`).join("");
  const tr = rows.map((b) => {
    const p = P(b.prov), dash = '<span class="rd2-kosong" title="' + esc(t("rd2.tanpa_data")) + '">-</span>';
    const celah = celahProv(b.prov);
    return `<tr><td data-label="${esc(t("rd2.c.kab"))}"><button type="button" class="rd2-nama" data-kab="${esc(b.kode)}"><span class="rd2-nama-a">${esc(b.nama)}</span><span class="jm-pel-pj rd2-nama-p">${lambang(b.prov, 16)}<small>${esc(p.nama)}</small></span></button></td>${td(1, pilSkor(skorBaris(b)), "jm-num")}${td(2, celah === null ? dash : N(celah), "jm-num")}${td(3, p.mentah.bpp === null ? dash : N(p.mentah.bpp), "jm-num")}${td(4, b.kab ? N(b.kab.proyek_mw) : dash, "jm-num")}${td(5, `<span class="jm-pil ${b.kab ? "jm-pil-ok" : "jm-pil-est"}" title="${esc(t("rd2.dasar." + (b.kab ? "pk" : "p") + ".i"))}">${ikon(b.kab ? "lokasi" : "peta", 14)}${esc(t("rd2.dasar." + (b.kab ? "pk" : "p")))}</span>`)}</tr>`;
  }).join("");
  $("rdTabelIsi").innerHTML = `<div class="jm-saring rd2-sr" role="group" aria-label="${esc(t("rd2.saring"))}">${cariHtml({ id: "rdCari", label: t("rd2.cari"), placeholder: t("rd2.cari.ph") })}
      ${pilihHtml({ id: "rdTprov", ikon: "peta", label: t("pj.f.provinsi"), opsi: [["", t("pel.semua_prov")], ...Object.entries(D.provinsi).map(([k, p]) => [k, p.nama, "prov:" + k])], nilai: S.prov })}
      ${pilihHtml({ id: "rdTjenis", ikon: "jenis", label: t("rd2.jenis"), opsi: [["", t("rd2.jenis.semua"), "daftar"], ["kab", t("rd2.jenis.kab"), "wilayah"], ["kota", t("rd2.jenis.kota"), "gedung"]], nilai: S.jenis })}
      <span class="jm-hitung" role="status">${esc(t("rd2.hitung", { n: N(semua.length) }))}</span></div>
    <div class="jm-gulir"><table class="jm-tabel jm-tabel-tetap rd2-tabel" data-urut="tidak"><thead><tr>${th}</tr></thead><tbody>${tr || `<tr><td colspan="6">${esc(t("jm.kosong.cocok"))}</td></tr>`}</tbody></table></div>${paginasiHtml({ hal: S.hal, total: semua.length, per: PER, satuan: "rd2.pag" })}`;
  $("rdCari").value = S.q;
}

/* ---------- rincian satu kabupaten (dialog) ---------- */
const NILAI_FMT = { pvout: (v) => `${N(v)} kWh/kWp`, celah: (v) => `${N(v)} MW`, sumber: (v) => `${N(v)} MW`, bpp: (v) => `Rp${N(v)}/kWh`, harga: (v) => `F ${N(v, 2)}`, akses: (v) => `${N(v, 1)}%`, pasar: (v) => `${N(v)} MW`, amdal: (v) => N(v), perda: (v) => N(v) };
function rincian(kode) {
  const b = D.baris.find((x) => x.kode === kode); if (!b) return;
  const p = P(b.prov), pn = p.norma, kn = b.kab_norma || null, tek = S.tek, bobot = tek === "semua" ? BOBOT_SEMUA : BOBOT_TEK;
  const komp = komponen(tek, pn, kn), hasil = hitungSkor(komp, bobot);
  const mentah = { pvout: p.mentah.pvout, celah: p.mentah.celah.semua, sumber: p.mentah.celah[tek], bpp: p.mentah.bpp, harga: p.mentah.harga, akses: p.mentah.akses, pasar: b.kab?.proyek_mw ?? null, amdal: b.kab?.amdal_n ?? null, perda: b.kab?.perda_n ?? null };
  const ids = Object.keys(bobot), ada = ids.filter((id) => hasil.bobot[id] !== undefined), tanpa = ids.filter((id) => hasil.bobot[id] === undefined);
  const rows = ada.map((id) => ({ label: t("rd2.k." + id), v: Math.max(0.05, komp[id] * hasil.bobot[id] * 100), teks: `${N(komp[id] * hasil.bobot[id] * 100, 1)} ${t("rd2.poin")}` }));
  const tkt = (id) => (["pasar", "amdal", "perda"].includes(id) ? "kab" : "prov");
  const dlg = $("rdDlg");
  dlg.innerHTML = `<header class="rd2-dlg-h"><div><span class="rd2-dlg-ey">${lambang(b.prov, 20)}${esc(p.nama)}</span><h2>${esc(b.nama)}</h2></div><button type="button" class="jm-tbl jm-tbl-kecil" data-tutup>${ikon("silang", 16)}<span>${esc(t("rd2.tutup"))}</span></button></header>
    <p class="jm-pel-utama"><span>${esc(tek === "semua" ? t("rd2.skor") : t("rd2.skor_tek", { tek: labTek(tek) }))}</span><b>${esc(hasil.skor === null ? "-" : N(hasil.skor, 1))}</b>${tingkatPil(hasil.skor)}${hipPil()}</p>
    <h3>${esc(t("rd2.kontribusi"))}</h3>${rows.length ? batang(rows, { label: t("rd2.kontribusi") }) : ""}
    <ul class="rd2-komp">${ada.map((id) => `<li><span class="jm-pil jm-pil-${tkt(id) === "kab" ? "ok" : "est"}">${esc(t("rd2.tingkat." + tkt(id)))}</span><b>${esc(t("rd2.k." + id))}</b><span>${esc(mentah[id] === null || mentah[id] === undefined ? "-" : NILAI_FMT[id](mentah[id]))}</span><small>${esc(t("rd2.bobot", { w: N(hasil.bobot[id] * 100, 0) }))}</small></li>`).join("")}</ul>
    ${tanpa.length ? `<p class="jm-bantu">${ikon("peringatan", 14)} ${esc(t("rd2.dikeluarkan", { daftar: tanpa.map((id) => t("rd2.k." + id)).join(", ") }))}</p>` : ""}
    <p class="jm-bantu">${esc(t(b.kab ? "rd2.dasar.pk.i" : "rd2.dasar.p.i"))}</p>`;
  dlg.showModal();
}

/* ---------- metode ringkas ---------- */
function metode() {
  const bobot = (o) => Object.entries(o).map(([id, w]) => `<li><b>${esc(t("rd2.k." + id))}</b><span>${esc(N(w * 100, 0))}%</span></li>`).join("");
  $("rdMetode").innerHTML = exHtml({ id: "exRdMetode", ikon: "metode", topik: t("an.cara"), judulHtml: `${esc(t("rd2.metode.j"))} ${hipPil()}`, tingkat: "h2",
    aksiHtml: sumberHtml(`${esc(t("rd2.metode.rumus"))}`),
    isiHtml: `<div class="rd2-metode"><section><h3>${ikon("analisis", 16)}<span>${esc(t("rd2.metode.semua"))}</span></h3><ul class="rd2-bobot">${bobot(D.metode.bobot_semua)}</ul></section>
      <section><h3>${ikon("jenis", 16)}<span>${esc(t("rd2.metode.tek"))}</span></h3><ul class="rd2-bobot">${bobot(D.metode.bobot_tek)}</ul></section>
      <section><h3>${ikon("peringatan", 16)}<span>${esc(t("rd2.metode.celah"))}</span></h3><ul class="rd2-celah">${D.celah.map((c, i) => `<li>${ikon("info", 14)}<span>${esc(t("rd2.celah." + (i + 1)))}</span></li>`).join("")}</ul></section></div>` });
}

/* ---------- alur ---------- */
function segarkan() {
  AGR = agregat(); kuantil();
  peta(); legenda(); panel(); tabel(); judul();
}
function semua() {
  kerangka();
  geserPanel($("rdLapis"), { kunci: "lapis" }); geserPanel($("rdPanel"), { kunci: "panel" });
  if (innerWidth < 1000) { $("rdLapis").open = false; $("rdPanel").open = false; }
  metode(); segarkan();
}
let terpasang = false;
function pasang() {
  isi.addEventListener("click", (e) => {
    const seg = e.target.closest("[data-tek]");
    if (seg && seg.dataset.tek !== S.tek) { S.tek = seg.dataset.tek; S.hal = 1; for (const x of $("rdSeg").querySelectorAll("[data-tek]")) x.setAttribute("aria-pressed", String(x === seg)); nanti(segarkan); return; }
    const pv = e.target.closest("path[data-kode]"); if (pv) { pilihProv(pv.dataset.kode); return; }
    const bp = e.target.closest("[data-prov]"); if (bp) { pilihProv(bp.dataset.prov); return; }
    const bk = e.target.closest("[data-kab]"); if (bk) { nanti(() => rincian(bk.dataset.kab)); return; }
    if (e.target.closest("#rdSemuaProv")) { $("exRdTabel").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion:reduce)").matches ? "auto" : "smooth", block: "start" }); return; }
    if (e.target.closest("#rdLepasProv")) { pilihProv(""); return; }
    const u = e.target.closest("#exRdTabel .jm-urut");
    if (u) { const k = u.dataset.uk; S.ua = S.uk === k ? -S.ua : k === "nama" ? 1 : -1; S.uk = k; S.hal = 1; for (const th of u.closest("tr").children) th.setAttribute("aria-sort", th.contains(u) ? (S.ua > 0 ? "ascending" : "descending") : "none"); nanti(tabel); return; }
    const pg = e.target.closest("#exRdTabel .jm-pag [data-hal]");
    if (pg && !pg.disabled) { S.hal = +pg.dataset.hal; sorotHalaman(pg, S.hal); nanti(tabel); }
  });
  isi.addEventListener("pointermove", (e) => { const pv = e.target.closest?.("path[data-kode]"); if (pv) tip(pv.dataset.kode, e); else $("rdTip").hidden = true; });
  isi.addEventListener("pointerleave", () => { $("rdTip").hidden = true; });
  isi.addEventListener("keydown", (e) => { const pv = e.target.closest?.("path[data-kode]"); if (pv && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pilihProv(pv.dataset.kode); } });
  isi.addEventListener("change", (e) => {
    if (e.target.id === "rdTprov") pilihProv(e.target.value);
    else if (e.target.id === "rdTjenis") { S.jenis = e.target.value; S.hal = 1; nanti(() => { tabel(); judul(); }); }
  });
  isi.addEventListener("input", debounce((e) => { if (e.target.id === "rdCari") { S.q = e.target.value; S.hal = 1; nanti(() => { tabel(); judul(); $("rdCari")?.focus(); }); } }));
  isi.addEventListener("jm:csv", (e) => {
    const ex = e.target.closest(".jm-ex"); if (!ex || ex.id !== "exRdTabel") return;
    e.detail.baris = [[t("rd2.c.kab"), t("pj.c.prov"), t("rd2.c.skor"), t("rd2.c.celah") + " MW", t("rd2.c.bpp") + " Rp/kWh", t("rd2.c.pasar") + " MW", t("rd2.c.dasar")], ...barisTabel().map((b) => [b.nama, P(b.prov).nama, skorBaris(b) ?? "", celahProv(b.prov) ?? "", P(b.prov).mentah.bpp ?? "", b.kab?.proyek_mw ?? "", t("rd2.dasar." + (b.kab ? "pk" : "p"))])];
  }, true);
  const dlg = document.createElement("dialog");
  dlg.id = "rdDlg"; dlg.className = "jm-dlg rd2-dlg"; dlg.setAttribute("aria-label", t("rd2.rincian"));
  dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest("[data-tutup]")) dlg.close(); });
  document.body.append(dlg);
  document.addEventListener("jm:bahasa", () => nanti(() => { semua(); }));
}
export async function mulai(data) {
  isi = $("rdKabIsi"); D = data;
  GEO = await geoProvinsi();
  if (!GEO) { isi.innerHTML = galatHtml("layanan"); return; }
  if (!terpasang) { terpasang = true; pasang(); }
  semua();
}
