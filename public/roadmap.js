/* /roadmap: ajuan peta jalan METI. Data = /data/roadmap.json (statis); suka dan komentar = /api/roadmap/*.
   INP: filter kelas dan geser kuartal hanya mengubah satu atribut atau satu CSS variable; panel rincian membuka chrome-nya
   seketika, isi beratnya menyusul sesudah satu bingkai tercat (nanti()). Komentar dirender lewat esc(), tidak pernah HTML mentah. */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, ada, angka, tanggal, tanggalDariUnix, bahasa } from "/i18n.js";
import { api, esc, nanti, ikon, hantuHtml } from "/inti/umum.js";
import { khUbin } from "/inti/kh.js";

const $ = (id) => document.getElementById(id);
const MAKS = 1000;
let D = null, STAF = false, ring = { suka: {}, komentar: {}, saya: new Set() };
let timer = null, q = 0, saring = "semua";

const lbl = (v) => (ada("rm.v." + v) ? t("rm.v." + v) : esc(v));
const pilKelas = { Pasti: "jm-pil-ok", Bersyarat: "jm-pil-warn", Tinggi: "jm-pil-bad", Sedang: "jm-pil-warn", Rendah: "jm-pil-ok" };
const pil = (v) => `<span class="jm-pil ${pilKelas[v] || ""}">${lbl(v)}</span>`;
const des = (x) => (Number.isInteger(x) ? 0 : Number.isInteger(x * 10) ? 1 : 2);
const rp = (juta) => {
  if (juta >= 1000) { const x = juta / 1000; return t("rm.rp_miliar", { n: angka(x, { desimal: des(x) }) }); }
  if (juta < 1) return t("rm.rp_ribu", { n: angka(juta * 1000) });
  return t("rm.rp_juta", { n: angka(juta, { desimal: des(juta) }) });
};
const angkaStr = (s) => (bahasa() === "id" ? esc(s) : esc(s).replace(/(\d),(\d)/g, "$1.$2"));
const KQ = () => D.KUARTAL;
const periode = (p) => t("rm.periode", { a: KQ()[p.mulai], b: KQ()[p.selesai] });
const prog = (id) => D.PROGRAM.find((p) => p.id === id);
const daftar = (a, kelas = "") => (a && a.length ? `<ul class="rm-daftar ${kelas}">${a.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "");
const tgl = () => tanggal(D.versi, { gaya: "panjang" });


/* ---------- suka dan komentar ---------- */
const sukaHtml = (id) => `<button type="button" class="rm-suka" data-prog="${id}" aria-pressed="${ring.saya.has(id)}">${ikon("bintang", 18)}<span class="rm-suka-t">${esc(ring.saya.has(id) ? t("rm.disukai") : t("rm.suka"))}</span><b data-nsuka="${id}">${ring.suka[id] || 0}</b></button>`;
const komHitungHtml = (id) => `<span class="rm-kom-n" title="${esc(t("rm.k.buka"))}">${ikon("tanya", 16)}<b data-nkom="${id}">${ring.komentar[id] || 0}</b></span>`;

function diskusiHtml(id, sembunyi = false) {
  return `<div class="rm-dk" data-dk="${id}"${sembunyi ? " hidden" : ""}>
    <div class="rm-dk-daftar" aria-live="polite"></div>
    <form class="rm-dk-form" data-prog="${id}">
      <textarea class="rm-dk-isi" rows="3" maxlength="${MAKS}" placeholder="${esc(t("rm.k.ph"))}" aria-label="${esc(t("rm.k.ph"))}"></textarea>
      <div class="rm-dk-bawah"><span class="rm-dk-hitung">${esc(t("rm.k.hitung", { n: 0, maks: MAKS }))}</span><button type="submit" class="jm-tbl jm-tbl-utama" disabled>${esc(t("rm.k.kirim"))}</button></div>
    </form></div>`;
}

function tampilTgl(b) {
  if (typeof b === "number") return tanggal(tanggalDariUnix(b));
  const s = String(b || "").slice(0, 10);
  return tanggal(s);
}

async function muatKomentar(id) {
  const kotak = document.querySelectorAll(`.rm-dk[data-dk="${id}"] .rm-dk-daftar`);
  if (!kotak.length) return;
  for (const k of kotak) k.innerHTML = hantuHtml(2);
  let html;
  try {
    const r = await api("/api/roadmap/komentar?program=" + encodeURIComponent(id));
    STAF = !!r.staf;
    ring.komentar[id] = r.baris.length;
    html = r.baris.length
      ? `<ol class="rm-k-daftar">${r.baris.map((b) => `<li class="rm-k"><div class="rm-k-kepala"><b>${esc(b.nama)}</b><time>${esc(tampilTgl(b.dibuat_pada))}</time>${b.milik || r.staf ? `<button type="button" class="rm-k-hapus" data-hapus="${esc(b.id)}" data-prog="${id}">${esc(t("rm.k.hapus"))}</button>` : ""}</div><p>${esc(b.isi)}</p></li>`).join("")}</ol>`
      : `<p class="rm-kosong">${esc(t("rm.k.kosong"))}</p>`;
    for (const n of document.querySelectorAll(`[data-nkom="${id}"]`)) n.textContent = ring.komentar[id];
  } catch (e) {
    html = `<div class="rm-galat" role="alert"><p>${esc(t("rm.k.galat"))}</p><button type="button" class="jm-tbl" data-ulang="${id}">${esc(t("rm.k.ulang"))}</button></div>`;
  }
  for (const k of document.querySelectorAll(`.rm-dk[data-dk="${id}"] .rm-dk-daftar`)) k.innerHTML = html;
}

let hapusPesan = 0;
function pesan(teks) {
  const el = $("rmPesan");
  el.textContent = teks;
  clearTimeout(hapusPesan);
  hapusPesan = setTimeout(() => { el.textContent = ""; }, 5000);
}

function setSuka(id, saya, jumlah) {
  if (saya) ring.saya.add(id); else ring.saya.delete(id);
  ring.suka[id] = jumlah;
  for (const b of document.querySelectorAll(`.rm-suka[data-prog="${id}"]`)) {
    b.setAttribute("aria-pressed", String(saya));
    b.querySelector(".rm-suka-t").textContent = saya ? t("rm.disukai") : t("rm.suka");
    b.querySelector("b").textContent = jumlah;
  }
  for (const n of document.querySelectorAll(`[data-nsuka="${id}"]:not(.rm-suka b)`)) n.textContent = jumlah;
}

async function klikSuka(id) {
  const saya = ring.saya.has(id), awal = ring.suka[id] || 0;
  setSuka(id, !saya, Math.max(0, awal + (saya ? -1 : 1))); // optimistis: chrome berubah seketika
  try {
    const r = await api("/api/roadmap/suka", { metode: "POST", badan: { program: id } });
    setSuka(id, !!r.suka, r.jumlah);
  } catch (e) {
    setSuka(id, saya, awal);
    pesan(t("rm.k.gagal_suka"));
  }
}

async function kirimKomentar(form) {
  const id = form.dataset.prog, ta = form.querySelector("textarea"), tb = form.querySelector("button"), isi = ta.value.trim();
  if (!isi || isi.length > MAKS) return;
  tb.disabled = true; tb.setAttribute("aria-busy", "true");
  try {
    await api("/api/roadmap/komentar", { metode: "POST", badan: { program: id, isi } });
    ta.value = ""; form.querySelector(".rm-dk-hitung").textContent = t("rm.k.hitung", { n: 0, maks: MAKS });
    await muatKomentar(id);
  } catch (e) {
    pesan(t("rm.k.gagal_kirim"));
    tb.disabled = false;
  }
  tb.removeAttribute("aria-busy");
}

async function hapusKomentar(id, program) {
  try { await api("/api/roadmap/komentar/" + encodeURIComponent(id), { metode: "DELETE" }); await muatKomentar(program); } catch (e) { pesan(t("rm.k.gagal_hapus")); }
}

async function muatRingkas() {
  try {
    const r = await api("/api/roadmap/ringkas");
    ring = { suka: r.suka || {}, komentar: r.komentar || {}, saya: new Set(r.saya || []) };
    for (const id of new Set([...Object.keys(ring.suka), ...ring.saya])) setSuka(id, ring.saya.has(id), ring.suka[id] || 0);
    for (const [id, n] of Object.entries(ring.komentar)) for (const e of document.querySelectorAll(`[data-nkom="${id}"]`)) e.textContent = n;
  } catch (e) { /* hitungan tetap 0; tombol tetap bisa dipakai */ }
}

/* ---------- bagian halaman ---------- */
const BAB = [["kondisi", "grafik"], ["linimasa", "linimasa"], ["program", "proyek"], ["arah", "kompas"], ["anggaran", "kartu"], ["tata", "denah"], ["masukan", "tanya"]];
const bab = (id, kelas, dalam) => `<section data-rel="tidak" class="rm-bag ${kelas}" id="${id}" aria-labelledby="${id}J" data-bab-sec="${id}"><div class="rm-dalam">${dalam}</div></section>`;
const kepalaBag = (ik, id, judul, lead) => `<header class="rm-bh rm-rv"><p class="rm-ey">${ikon(ik, 16)}</p><h2 id="${id}J">${esc(judul)}</h2>${lead ? `<p class="rm-lead">${esc(lead)}</p>` : ""}</header>`;

function navHtml() {
  return `<nav class="rm-nav" aria-label="${esc(t("rm.n.label"))}"><div class="rm-dalam rm-nav-in">${BAB.map(([id, ik]) => `<a href="#${id}" data-bab="${id}">${ikon(ik, 18)}<span>${esc(t("rm.n." + id))}</span></a>`).join("")}</div></nav>`;
}

function kutipHtml() {
  const k = D.KUTIPAN;
  return `<figure class="rm-kutip"><blockquote><p>${esc(k.teks)}</p></blockquote><figcaption><b>${esc(k.oleh)}</b><span>${esc(k.konteks)}</span></figcaption></figure>`;
}

function kondisiHtml() {
  const [u, ...lain] = D.MACET, num = (s) => parseFloat(String(s).replace(",", "."));
  const m = /(\d+(?:,\d+)?)\s*GW/.exec(u[2]), a = num(u[0]), b = m ? num(m[1]) : 0;
  const bar = (v, kt, kelas) => `<div class="rm-bt"><p>${esc(t(kt))}</p><div class="rm-bt-j"><i class="rm-bt-i ${kelas}" data-v="${v}" data-maks="${Math.max(a, b)}"></i><b>${esc(t("rm.kond.gw", { n: angka(v, { desimal: 2 }) }))}</b></div></div>`;
  const utama = `<div class="rm-bn rm-bn-utama rm-rv"><p class="rm-bn-j">${esc(t("rm.kond.utama"))}</p>${b ? bar(a, "rm.kond.b_historis", "rm-bt-a") + bar(b, "rm.kond.b_butuh", "rm-bt-b") : `<p class="rm-m-angka">${angkaStr(u[0])}</p>`}<p class="rm-m-cat">${esc(u[2])}</p></div>`;
  const sel = lain.map(([x, s, c], i) => `<div class="rm-bn rm-bn-${i + 1} rm-rv"><p class="rm-m-angka">${angkaStr(x)}</p><p class="rm-m-satuan">${esc(s)}</p><p class="rm-m-cat">${esc(c)}</p></div>`).join("");
  return bab("kondisi", "", `${kepalaBag("grafik", "kondisi", t("rm.kond.j"), t("rm.kond.lead"))}<div class="rm-bento">${utama}${sel}</div><p class="rm-sumber">${esc(t("rm.sumber_versi", { tgl: tgl() }))}</p>`);
}

function liniHtml() {
  const K = KQ();
  const baris = (p) => `<div class="rm-baris" data-kelas="${p.kelas}">
    <a class="rm-nama" href="#${p.id}"><b>${p.id}</b><span>${esc(p.nama)}</span></a>
    <i class="rm-bar rm-bar-${p.kelas}" data-m="${p.mulai}" data-s="${p.selesai}"></i>
    ${p.tonggak.map(([k, tx]) => `<i class="rm-tg" data-k="${k}" title="${esc(t("rm.lini.tonggak", { k: K[k], n: tx }))}"></i>`).join("")}</div>`;
  const grup = (kelas, kunci) => { const a = D.PROGRAM.filter((p) => p.kelas === kelas); return a.length ? `<div class="rm-grup" data-kelas="${kelas}"><p class="rm-grup-j">${esc(t(kunci))}</p>${a.map(baris).join("")}</div>` : ""; };
  return bab("linimasa", "rm-latar", `${kepalaBag("linimasa", "linimasa", t("rm.lini.j"), t("rm.lini.lead"))}
    <div class="rm-alat rm-rv">
      <div class="rm-seg" role="group" aria-label="${esc(t("rm.lini.saring"))}">${["semua", "Pasti", "Bersyarat"].map((s) => `<button type="button" data-saring="${s}" aria-pressed="${s === saring}">${esc(s === "semua" ? t("rm.lini.semua") : t("rm.v." + s))}</button>`).join("")}</div>
      <div class="rm-kendali">
        <button type="button" class="jm-tbl" id="rmMundur" aria-label="${esc(t("rm.lini.mundur"))}" title="${esc(t("rm.lini.mundur"))}">${ikon("panah-kiri", 18)}</button>
        <button type="button" class="jm-tbl jm-tbl-utama" id="rmPutar" aria-pressed="false">${ikon("putar", 18)}<span>${esc(t("rm.lini.putar"))}</span></button>
        <button type="button" class="jm-tbl" id="rmMaju" aria-label="${esc(t("rm.lini.maju"))}" title="${esc(t("rm.lini.maju"))}">${ikon("panah-kanan", 18)}</button>
      </div>
    </div>
    <p class="rm-ringkas" id="rmRingkas" aria-live="polite"></p>
    <div class="rm-lini rm-rv" id="rmLiniEl" role="group" aria-label="${esc(t("rm.lini.sr"))}"><div class="rm-gulir"><div class="rm-grid">
      <div class="rm-sorot" aria-hidden="true"></div><div class="rm-garis" aria-hidden="true"></div>
      <div class="rm-kol-baris"><span></span>${K.map((k, i) => `<button type="button" class="rm-kol" data-q="${i}">${esc(k)}</button>`).join("")}</div>
      ${grup("Pasti", "rm.lini.g_pasti")}${grup("Bersyarat", "rm.lini.g_bersyarat")}</div></div></div>
    <ul class="rm-legenda"><li><i class="rm-lg rm-lg-pasti"></i>${esc(t("rm.lini.lg_pasti"))}</li><li><i class="rm-lg rm-lg-bers"></i>${esc(t("rm.lini.lg_bersyarat"))}</li><li><i class="rm-lg rm-lg-tg"></i>${esc(t("rm.lini.lg_tonggak"))}</li></ul>`);
}

/* posisi batang, tonggak, dan skala: sekali sesudah HTML masuk; geser kuartal sesudahnya cuma mengubah --q */
function aturLini() {
  for (const e of document.querySelectorAll(".rm-bar")) e.style.gridColumn = `${+e.dataset.m + 2} / ${+e.dataset.s + 3}`;
  for (const e of document.querySelectorAll(".rm-tg")) e.style.gridColumn = String(+e.dataset.k + 2);
  for (const e of document.querySelectorAll(".rm-bt-i")) e.style.width = `calc((100% - 200px) * ${+e.dataset.v / +e.dataset.maks})`;
  for (const e of document.querySelectorAll("#rmIsi .rm-tumpuk i")) e.style.flexGrow = e.dataset.j;
  setQ(q);
}

function setQ(i) {
  q = (i + 9) % 9;
  $("rmLiniEl")?.style.setProperty("--q", q);
  for (const b of document.querySelectorAll(".rm-kol")) b.setAttribute("aria-pressed", String(+b.dataset.q === q));
  const aktif = D.PROGRAM.filter((p) => p.mulai <= q && q <= p.selesai && (saring === "semua" || p.kelas === saring));
  const tg = D.PROGRAM.reduce((n, p) => n + p.tonggak.filter(([k]) => k === q).length, 0);
  const r = $("rmRingkas");
  if (r) r.textContent = t("rm.lini.ringkas", { k: D.KUARTAL[q], n: aktif.length, m: tg });
}

function putar(hidup) {
  clearInterval(timer); timer = null;
  const b = $("rmPutar");
  if (!b) return;
  b.setAttribute("aria-pressed", String(hidup));
  b.querySelector("span").textContent = hidup ? t("rm.lini.jeda") : t("rm.lini.putar");
  $("rmRingkas")?.setAttribute("aria-live", hidup ? "off" : "polite");
  if (hidup) timer = setInterval(() => setQ(q + 1), 1100);
}

const hitungKecil = (id) => `<span class="rm-hit" title="${esc(t("rm.suka"))}">${ikon("bintang", 16)}<b data-nsuka="${id}">${ring.suka[id] || 0}</b></span>${komHitungHtml(id)}`;
const barisPasti = (p) => `<a class="rm-pb rm-rv" href="#${p.id}" aria-label="${esc(t("rm.prog.buka", { kode: p.id }))}">
  <span class="rm-pb-kode">${p.id}</span>
  <div class="rm-pb-teks"><h3>${esc(p.nama)}</h3><p>${esc(p.ringkas)}</p></div>
  <dl class="rm-pb-meta"><div><dt>${esc(t("rm.f.pemilik"))}</dt><dd>${esc(p.pemilik)}</dd></div><div><dt>${esc(t("rm.f.anggaran"))}</dt><dd>${esc(rp(p.anggaran))}</dd></div></dl>
  <div class="rm-pb-aksi">${hitungKecil(p.id)}<span class="rm-pb-panah">${ikon("panah-kanan", 22)}</span></div></a>`;
const kartuBers = (p) => `<a class="rm-bk rm-rv" href="#${p.id}" aria-label="${esc(t("rm.prog.buka", { kode: p.id }))}">
  <div class="rm-bk-atas"><span class="rm-kode">${p.id}</span><b>${esc(rp(p.anggaran))}</b></div>
  <h3>${esc(p.nama)}</h3><p class="rm-bk-r">${esc(p.ringkas)}</p>
  <div class="rm-bk-syarat">${ikon("kunci", 18)}<div><p class="rm-p-lbl">${esc(t("rm.prog.mulai"))}</p><p>${esc(p.syarat || "")}</p></div></div>
  <div class="rm-kartu-kaki">${hitungKecil(p.id)}</div></a>`;
function programHtml() {
  const ps = D.PROGRAM.filter((p) => p.kelas === "Pasti"), bs = D.PROGRAM.filter((p) => p.kelas === "Bersyarat");
  return bab("program", "", `${kepalaBag("proyek", "program", t("rm.prog.j"), t("rm.prog.lead"))}
    <div class="rm-blok" data-kelas="Pasti"><h3 class="rm-sub rm-rv">${esc(t("rm.prog.pasti_j"))}<span>${esc(t("rm.prog.pasti_l"))}</span></h3><div class="rm-pasti">${ps.map(barisPasti).join("")}</div></div>
    ${bs.length ? `<div class="rm-blok rm-bers" data-kelas="Bersyarat"><h3 class="rm-sub rm-rv">${esc(t("rm.prog.bers_j"))}<span>${esc(t("rm.prog.bers_l"))}</span></h3><div class="rm-bers-grid">${bs.map(kartuBers).join("")}</div></div>` : ""}`);
}

/* ---------- arah sesudah 2028 dan grafik nasional ---------- */
function arahHtml() {
  const bidang = [...new Set(D.ARAH.map((a) => a.bidang))];
  return bab("arah", "", `${kepalaBag("kompas", "arah", t("rm.arah.j"), t("rm.arah.lead"))}
    <p class="rm-bukan rm-rv">${ikon("peringatan", 18)}<span>${esc(t("rm.arah.bukan"))}</span></p>
    <div class="rm-sky">${bidang.map((b) => `<div class="rm-sky-k rm-rv"><h3>${esc(ada("rm.bidang." + b) ? t("rm.bidang." + b) : b)}</h3><ul>${D.ARAH.filter((a) => a.bidang === b).map((a) => `<li id="${a.id}"><button type="button" class="rm-ar-b" data-buka="${a.id}" aria-expanded="false"><span class="rm-ar-id">${a.id}</span><span>${esc(a.nama)}</span></button>
      <div class="rm-ar-det" hidden><p class="rm-ar-syarat">${esc(a.syarat)}</p><div class="rm-ar-aksi">${sukaHtml(a.id)}</div>${diskusiHtml(a.id)}</div></li>`).join("")}</ul></div>`).join("")}</div>`);
}

function nasionalHtml() {
  const N = D.NASIONAL, W = 720, H = 340, L = 52, R = 150, T = 18, B = 40, YM = 110;
  const x = (th) => L + ((th - N.tahun[0]) / (N.tahun[N.tahun.length - 1] - N.tahun[0])) * (W - L - R);
  const y = (v) => T + (1 - v / YM) * (H - T - B);
  const jalur = [["historis", "rm.nas.historis"], ["ruptl", "rm.nas.ruptl"], ["ambisi", "rm.nas.ambisi"]];
  const kisi = [0, 25, 50, 75, 100].map((v) => `<line class="rm-sv-kisi" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="rm-sv-t" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join("");
  const sumbuX = N.tahun.map((th) => `<text class="rm-sv-t" x="${x(th)}" y="${H - 14}" text-anchor="middle">${th}</text>`).join("");
  const garis = jalur.map(([k, kt], i) => {
    const nama = t(kt), v = N[k];
    const pts = N.tahun.map((th, j) => `${x(th).toFixed(1)},${y(v[j]).toFixed(1)}`).join(" ");
    const titik = N.tahun.map((th, j) => `<circle class="rm-sv-p rm-sv-p${i}" cx="${x(th).toFixed(1)}" cy="${y(v[j]).toFixed(1)}" r="4"><title>${esc(t("rm.nas.tip", { jalur: nama, tahun: th, n: angka(v[j], { desimal: 1 }) }))}</title></circle>`).join("");
    const akhir = v[v.length - 1], ya = y(akhir) + (i === 1 ? 14 : i === 0 ? 6 : 0);
    return `<g><polyline class="rm-sv-j rm-sv-j${i}" points="${pts}"/>${titik}<text class="rm-sv-e rm-sv-e${i}" x="${x(N.tahun[N.tahun.length - 1]) + 10}" y="${ya}">${esc(angka(akhir, { desimal: 1 }))} GW</text></g>`;
  }).join("");
  return bab("nasional", "rm-latar", `<div class="rm-nas">
    <div class="rm-nas-t rm-rv"><p class="rm-ey">${ikon("grafik", 16)}</p><p class="rm-nas-j">${esc(t("rm.nas.j"))}</p><h2>${esc(t("rm.nas.pernyataan"))}</h2>
      <ul class="rm-legenda">${jalur.map(([, kt], i) => `<li><i class="rm-lg rm-lg-j${i}"></i>${esc(t(kt))}</li>`).join("")}</ul><p class="rm-sumber">${esc(t("rm.nas.cat", { tgl: tgl() }))}</p></div>
    <div class="rm-grafik rm-rv"><svg class="rm-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("rm.nas.sr"))}"><title>${esc(t("rm.nas.sr"))}</title>${kisi}${sumbuX}<text class="rm-sv-t rm-sv-sb" x="${L}" y="12">${esc(t("rm.nas.sumbu"))}</text>${garis}</svg></div></div>`);
}

/* ---------- anggaran, tata kelola, 100 hari, risiko, keputusan ---------- */
function anggaranHtml() {
  const A = D.anggaran, jum = (k) => D.PROGRAM.filter((p) => p.kelas === k).reduce((s, p) => s + p.anggaran, 0), ps = D.PROGRAM.filter((p) => p.kelas === "Pasti");
  const tabel = `<details class="rm-rinci rm-rv"><summary>${ikon("tabel", 18)}<span>${esc(t("rm.ang.tabel"))}</span></summary><div class="rm-gulir-tabel"><table class="jm-tabel"><thead><tr><th>${esc(t("rm.t.kode"))}</th><th>${esc(t("rm.t.program"))}</th><th>${esc(t("rm.t.kelas"))}</th><th>${esc(t("rm.t.dana"))}</th><th>${esc(t("rm.t.anggaran"))}</th></tr></thead><tbody>
    ${D.PROGRAM.map((p) => `<tr><td><a href="#${p.id}">${p.id}</a></td><td>${esc(p.nama)}</td><td>${pil(p.kelas)}</td><td>${esc(p.dana)}</td><td>${esc(rp(p.anggaran))}</td></tr>`).join("")}
    ${["Pasti", "Bersyarat"].map((k) => `<tr class="rm-jumlah"><td colspan="4">${esc(t("rm.d.total"))}: ${lbl(k)}</td><td>${esc(rp(jum(k)))}</td></tr>`).join("")}</tbody></table></div></details>`;
  const tiga = [[A.pasti, "rm.ang.pasti"], [A.bersyarat, "rm.ang.bersyarat"], [A.iuranMaks, "rm.ang.iuran"]];
  return bab("anggaran", "", `${kepalaBag("kartu", "anggaran", t("rm.ang.j"), t("rm.ang.lead"))}
    <div class="rm-tumpuk rm-tumpuk-besar rm-rv" role="img" aria-label="${esc(t("rm.ang.bar"))}">${ps.map((p, i) => `<i class="rm-s${i % 7}" data-j="${p.anggaran}" title="${esc(p.id + " " + p.nama + ": " + rp(p.anggaran))}"></i>`).join("")}</div>
    <ul class="rm-biaya rm-biaya-2 rm-rv">${ps.map((p, i) => `<li><i class="rm-sw rm-s${i % 7}"></i><span><b>${p.id}</b> ${esc(p.nama)}</span><b>${esc(rp(p.anggaran))}</b></li>`).join("")}</ul>
    <div class="rm-tiga">${tiga.map(([v, k]) => `<div class="rm-rv"><p class="rm-m-angka">${esc(rp(v))}</p><p class="rm-m-cat">${esc(t(k))}</p></div>`).join("")}</div>${tabel}`);
}

const jalurHtml = (items) => `<ol class="rm-jalur rm-jalur-${Math.min(items.length, 5)}">${items.map((s, i) => `<li class="rm-rv"><span class="rm-j-titik">${i + 1}</span><h3>${esc(s.judul)}</h3>${s.tebal ? `<p class="rm-tebal">${esc(s.tebal)}</p>` : ""}${s.isi ? `<p>${esc(s.isi)}</p>` : ""}${daftar(s.daftar)}${s.kecil ? `<p class="rm-kecil">${esc(s.kecil)}</p>` : ""}${s.luaran ? `<p class="rm-j-luar">${esc(s.luaran)}</p>` : ""}</li>`).join("")}</ol>`;
const risikoHtml = (r) => `<li class="rm-risiko"><div class="rm-risiko-atas"><p class="rm-tebal">${esc(r.risiko)}</p>${pil(r.tingkat)}</div><p class="rm-langkah-teks"><b>${esc(t("rm.d.langkah"))}</b>${esc(r.langkah)}</p></li>`;
function tataHtml() {
  return bab("tata", "rm-latar", `${kepalaBag("denah", "tata", t("rm.tk.j"), t("rm.tk.lead"))}
    ${jalurHtml(D.tataKelola.map((r) => ({ judul: r.ritme, isi: r.kegiatan, kecil: r.siapa, luaran: r.keluaran })))}
    <h3 class="rm-sub rm-rv">${esc(t("rm.sh.j"))}<span>${esc(t("rm.sh.lead"))}</span></h3>
    ${jalurHtml(D.seratusHari.map((s) => ({ judul: s.rentang, tebal: s.fokus, daftar: s.langkah, kecil: t("rm.sh.pemilik", { p: s.pemilik }) })))}
    <div class="rm-dua-kolom"><div><h3 class="rm-sub rm-rv">${esc(t("rm.ru.j"))}</h3><ul class="rm-risiko-daftar rm-rv">${D.risikoUmum.map(risikoHtml).join("")}</ul></div>
    <div><h3 class="rm-sub rm-rv">${esc(t("rm.kp.j"))}</h3><ul class="rm-centang rm-rv">${D.keputusan.map((k) => `<li>${ikon("centang", 18)}<span>${esc(k)}</span></li>`).join("")}</ul></div></div>`);
}
function masukanHtml() {
  return bab("masukan", "rm-gelap", `<div class="rm-ajak"><div class="rm-rv"><p class="rm-ey">${ikon("tanya", 16)}</p><p class="rm-nas-j">${esc(t("rm.um.j"))}</p><h2 id="masukanJ">${esc(t("rm.um.ajak"))}</h2><p class="rm-lead">${esc(t("rm.um.lead"))}</p>${sukaHtml("UMUM")}</div><div class="rm-rv">${diskusiHtml("UMUM")}</div></div>`);
}

/* ---------- panel rincian satu program ---------- */
function sumberHtml(a) {
  if (!a || !a.length) return "";
  return `<ul class="rm-sumber-daftar">${[...new Set(a)].map((s) => (/^https:\/\//.test(s) ? `<li><a href="${esc(s)}" target="_blank" rel="noopener noreferrer">${esc(new URL(s).hostname.replace(/^www\./, ""))}</a></li>` : `<li><span>${esc(s)}</span></li>`)).join("")}</ul>`;
}

function kepalaPanel(p) {
  return `<div class="rm-p-kepala jm-batik jm-batik-rata" data-kelas="${p.kelas}"><div class="rm-p-atas"><span class="rm-p-kode">${p.id}</span><div class="rm-p-pil">${pil(p.kelas)}<span class="jm-pil">${lbl(p.status)}</span></div>
    <button type="button" class="rm-p-tutup" data-tutup aria-label="${esc(t("rm.d.tutup"))}" title="${esc(t("rm.d.tutup"))}">${ikon("tutup", 20)}</button></div>
    <h2 id="rmPanelJ">${esc(p.nama)}</h2></div>
  <div class="rm-p-fakta"><div><p class="rm-p-lbl">${esc(t("rm.f.periode"))}</p><p class="rm-p-nilai">${esc(periode(p))}</p></div>
    <div><p class="rm-p-lbl">${esc(t("rm.f.peran"))}</p><p class="rm-p-nilai">${lbl(p.peran)}</p></div>
    <div><p class="rm-p-lbl">${esc(t("rm.f.anggaran"))}</p><p class="rm-p-nilai">${esc(rp(p.anggaran))}</p><p class="rm-kecil">${esc(p.dana)}</p></div>
    <div><p class="rm-p-lbl">${esc(t("rm.f.pemilik"))}</p><p class="rm-p-nilai">${esc(p.pemilik)}</p>${p.mitra ? `<p class="rm-kecil">${esc(t("rm.bersama", { m: p.mitra }))}</p>` : ""}</div></div>`;
}

function badanPanel(p) {
  const sub = (j, isi, kelas = "") => `<section class="rm-p-bag ${kelas}"><h3>${esc(j)}</h3>${isi}</section>`;
  const rencana = (p.rencana || []).map((r) => `<li><span class="rm-t-titik"></span><div class="rm-t-isi"><p class="rm-t-k">${esc(KQ()[r.kuartal])}</p>${daftar(r.kegiatan)}<p class="rm-t-luaran"><b>${esc(t("rm.d.luaran"))}</b>${esc(r.luaran)}</p></div></li>`).join("");
  const kpi = (p.kpi || []).map((k) => `<li class="rm-kpi"><p class="rm-tebal">${esc(k.indikator)}</p><div class="rm-kpi-ke"><div><p class="rm-p-lbl">${esc(t("rm.d.awal"))}</p><p class="rm-kpi-n">${esc(k.awal)}</p></div>${ikon("panah-kanan", 22)}<div><p class="rm-p-lbl">${esc(t("rm.d.target"))}</p><p class="rm-kpi-n rm-kpi-t">${esc(k.target)}</p></div></div><p class="rm-kecil">${esc(t("rm.d.cara"))}: ${esc(k.cara)}</p></li>`).join("");
  const r = p.raci || {};
  const peran = [["pemilik", [r.pemilik]], ["pelaksana", r.pelaksana], ["penyetuju", [r.penyetuju]], ["dikonsultasi", r.dikonsultasi]].filter(([, v]) => v && v.filter(Boolean).length);
  const raci = peran.map(([k, v]) => `<div class="rm-raci-k"><p class="rm-p-lbl">${esc(t("rm.raci." + k))}</p><ul>${v.filter(Boolean).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("");
  const biaya = p.anggaranRinci || [], total = biaya.reduce((s, b) => s + b.juta, 0);
  const tumpuk = biaya.length ? `<div class="rm-tumpuk" role="img" aria-label="${esc(t("rm.d.biaya"))}">${biaya.map((b, i) => `<i class="rm-s${i % 5}" data-j="${b.juta}" title="${esc(b.pos + ": " + rp(b.juta))}"></i>`).join("")}</div>
    <ul class="rm-biaya">${biaya.map((b, i) => `<li><i class="rm-sw rm-s${i % 5}"></i><span>${esc(b.pos)}</span><b>${esc(rp(b.juta))}</b></li>`).join("")}<li class="rm-biaya-total"><span>${esc(t("rm.d.total"))}</span><b>${esc(rp(total))}</b></li></ul>` : "";
  const tergantung = (p.tergantung || []).map(prog).filter(Boolean).map((x) => `<a class="rm-tautan" href="#${x.id}"><b>${x.id}</b><span>${esc(x.nama)}</span></a>`).join("");
  const selesai = p.kriteriaSelesai || (Array.isArray(p.selesai) ? p.selesai : []);
  return `<div class="rm-p-isi">
    <p class="rm-masalah">${esc(p.kendala)}</p>
    <div class="rm-dua">${sub(t("rm.d.tujuan"), `<p>${esc(p.tujuan)}</p>`)}${sub(t("rm.d.berhasil"), `<p>${esc(p.kunci)}</p>`)}</div>
    ${p.kerja && p.kerja.length ? sub(t("rm.d.dikerjakan"), `<ul class="rm-centang">${p.kerja.map((x) => `<li>${ikon("centang", 18)}<span>${esc(x)}</span></li>`).join("")}</ul>`) : ""}
    ${rencana ? sub(t("rm.d.rencana"), `<ol class="rm-t">${rencana}</ol>`) : ""}
    ${kpi ? sub(t("rm.d.kpi"), `${p.ukuran ? `<p class="rm-ukuran"><b>${esc(t("rm.d.ukuran"))}</b>${esc(p.ukuran)}</p>` : ""}<ul class="rm-kpi-daftar">${kpi}</ul>`) : ""}
    ${raci ? sub(t("rm.d.raci"), `<div class="rm-raci">${raci}</div>`) : ""}
    ${tumpuk ? sub(t("rm.d.biaya"), tumpuk) : ""}
    ${p.risiko && p.risiko.length ? sub(t("rm.d.risiko"), `<ul class="rm-risiko-daftar">${p.risiko.map(risikoHtml).join("")}</ul>`) : ""}
    ${tergantung ? sub(t("rm.d.tergantung"), `<div class="rm-tautan-daftar">${tergantung}</div>`) : ""}
    ${selesai.length ? sub(t("rm.d.selesai"), `<ul class="rm-centang">${selesai.map((x) => `<li>${ikon("centang", 18)}<span>${esc(x)}</span></li>`).join("")}</ul>`) : ""}
    ${p.syarat ? `<aside class="rm-syarat">${ikon("kunci", 20)}<div><h3>${esc(t("rm.d.syarat"))}</h3><p>${esc(p.syarat)}</p></div></aside>` : ""}
    ${sumberHtml(p.sumber) ? `<section class="rm-p-bag rm-p-sumber"><h3>${esc(t("rm.d.sumber"))}</h3>${sumberHtml(p.sumber)}</section>` : ""}
    <section class="rm-p-bag rm-p-diskusi"><h3>${esc(t("rm.d.diskusi"))}</h3><div class="rm-umum">${sukaHtml(p.id)}${diskusiHtml(p.id)}</div></section></div>`;
}

function bukaPanel(id) {
  const p = prog(id), dlg = $("rmPanel");
  if (!p) return;
  dlg.dataset.id = id;
  dlg.innerHTML = kepalaPanel(p) + `<div class="rm-p-isi">${hantuHtml(5)}</div>`;
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
  nanti(() => { // subtree berat sesudah chrome tercat
    if (dlg.dataset.id !== id) return;
    dlg.querySelector(".rm-p-isi").outerHTML = badanPanel(p);
    for (const e of dlg.querySelectorAll(".rm-tumpuk i")) e.style.flexGrow = e.dataset.j;
    muatKomentar(id);
  });
}

function sinkronHash() {
  const id = decodeURIComponent(location.hash.slice(1)), dlg = $("rmPanel");
  if (id && prog(id)) bukaPanel(id);
  else if (id && D.ARAH.some((a) => a.id === id)) {
    if (dlg.open) dlg.close();
    const tbl = document.querySelector(`.rm-ar-b[data-buka="${id}"]`);
    if (tbl && tbl.getAttribute("aria-expanded") !== "true") tbl.click();
    document.getElementById(id)?.scrollIntoView({ block: "center" });
  } else if (dlg.open) dlg.close();
}

/* ---------- gerak: hanya transform dan opacity; keadaan diam selalu lengkap terlihat ---------- */
const kurangiGerak = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
let sudahHitung = false, ioGerak = null, ioBab = null;

function hitungNaik() {
  const el = [...document.querySelectorAll("#ubin .jm-kh-angka b")];
  const akhir = [D.PROGRAM.filter((x) => x.kelas === "Pasti").length, D.PROGRAM.filter((x) => x.kelas === "Bersyarat").length, D.anggaran.pasti];
  if (kurangiGerak() || el.length !== 3) return;
  const mulai = performance.now();
  const langkah = (now) => {
    const f = Math.min(1, (now - mulai) / 900), e = 1 - (1 - f) ** 3;
    el.forEach((b, i) => { b.textContent = angka(Math.round(akhir[i] * e)); });
    if (f < 1) requestAnimationFrame(langkah);
  };
  requestAnimationFrame(langkah);
}

function gerak(awal) {
  const semua = [...document.querySelectorAll("#rmIsi .rm-rv")];
  ioGerak?.disconnect(); ioBab?.disconnect();
  if (!awal || kurangiGerak() || !("IntersectionObserver" in window)) { for (const e of semua) e.classList.add("rm-tampak"); }
  else {
    document.documentElement.classList.add("rm-js");
    ioGerak = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.classList.add("rm-tampak"); ioGerak.unobserve(e.target); } }, { rootMargin: "0px 0px -8% 0px" });
    const hitung = new Map();
    for (const e of semua) { const n = hitung.get(e.parentNode) || 0; hitung.set(e.parentNode, n + 1); e.style.setProperty("--i", n % 6); ioGerak.observe(e); }
  }
  if ("IntersectionObserver" in window) { // tanda bab aktif: atribut saja
    ioBab = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) for (const a of document.querySelectorAll(".rm-nav a")) { if (a.dataset.bab === e.target.dataset.babSec) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); }
    }, { rootMargin: "-40% 0px -55% 0px" });
    for (const e of document.querySelectorAll("[data-bab-sec]")) ioBab.observe(e);
  }
}

/* ---------- rangkai ---------- */
function gambar(awal = false) {
  const p = D.PROGRAM;
  khUbin("ubin", [
    { ikon: "centang", nilai: String(p.filter((x) => x.kelas === "Pasti").length), label: t("rm.ub.pasti") },
    { ikon: "kunci", nilai: String(p.filter((x) => x.kelas === "Bersyarat").length), label: t("rm.ub.bersyarat") },
    { ikon: "kartu", nilai: angka(D.anggaran.pasti), satuan: t("rm.satuan_juta"), label: t("rm.ub.anggaran") },
  ]);
  $("rmKutip").innerHTML = kutipHtml();
  $("rmIsi").innerHTML = navHtml() + kondisiHtml() + liniHtml() + programHtml() + arahHtml() + nasionalHtml() + anggaranHtml() + tataHtml() + masukanHtml() + `<p class="rm-pesan" id="rmPesan" role="status"></p>`;
  $("rmIsi").dataset.saring = saring;
  aturLini();
  gerak(awal);
  if (awal && !sudahHitung) { sudahHitung = true; hitungNaik(); }
  if (document.querySelector(".rm-dk[data-dk=UMUM]")) muatKomentar("UMUM");
}

function pasang() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest("button");
    if (!a) { if (e.target === $("rmPanel")) $("rmPanel").close(); return; }
    if (a.dataset.saring) { // chrome urgent: atribut CSS saja
      saring = a.dataset.saring; $("rmIsi").dataset.saring = saring;
      for (const b of document.querySelectorAll("[data-saring]")) if (b.tagName === "BUTTON") b.setAttribute("aria-pressed", String(b === a));
      setQ(q);
    } else if (a.dataset.q !== undefined && a.classList.contains("rm-kol")) { putar(false); setQ(+a.dataset.q); }
    else if (a.id === "rmMundur") { putar(false); setQ(q - 1); }
    else if (a.id === "rmMaju") { putar(false); setQ(q + 1); }
    else if (a.id === "rmPutar") putar(!timer);
    else if (a.classList.contains("rm-suka")) klikSuka(a.dataset.prog);
    else if (a.dataset.buka) {
      const buka = a.getAttribute("aria-expanded") !== "true", id = a.dataset.buka, kotak = a.nextElementSibling;
      a.setAttribute("aria-expanded", String(buka)); kotak.hidden = !buka;
      if (buka && !kotak.dataset.dimuat) { kotak.dataset.dimuat = "1"; nanti(() => muatKomentar(id)); }
    } else if (a.dataset.hapus) hapusKomentar(a.dataset.hapus, a.dataset.prog);
    else if (a.dataset.ulang === "halaman") location.reload();
    else if (a.dataset.ulang) muatKomentar(a.dataset.ulang);
    else if (a.dataset.tutup !== undefined) $("rmPanel").close();
  });
  document.addEventListener("input", (e) => {
    const ta = e.target.closest(".rm-dk-isi");
    if (!ta) return;
    const f = ta.form, n = ta.value.length;
    f.querySelector(".rm-dk-hitung").textContent = t("rm.k.hitung", { n, maks: MAKS });
    f.querySelector("button").disabled = !ta.value.trim() || n > MAKS;
  });
  document.addEventListener("submit", (e) => { const f = e.target.closest(".rm-dk-form"); if (f) { e.preventDefault(); kirimKomentar(f); } });
  $("rmPanel").addEventListener("close", () => { if (location.hash) history.replaceState(null, "", location.pathname + location.search); });
  addEventListener("hashchange", sinkronHash);
  document.addEventListener("jm:bahasa", () => {
    putar(false); gambar(); muatRingkas();
    const dlg = $("rmPanel");
    if (dlg.open && dlg.dataset.id) bukaPanel(dlg.dataset.id);
  });
}

(async function mulai() {
  await mulaiHalaman();
  try {
    const r = await fetch("/data/roadmap.json", { credentials: "same-origin" });
    if (!r.ok) throw new Error("data");
    D = await r.json();
  } catch (e) {
    $("rmIsi").innerHTML = `<div class="rm-galat" role="alert"><p>${esc(t("rm.galat"))}</p><button type="button" class="jm-tbl" data-ulang="halaman">${esc(t("rm.k.ulang"))}</button></div>`;
    return;
  }
  gambar(true);
  pasang();
  await muatRingkas();
  if (location.hash) sinkronHash();
})();
