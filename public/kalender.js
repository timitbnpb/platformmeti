import { mulaiHalaman } from "/inti/kepala.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, nanti, ikon, hantuHtml, kosongHtml, galatHtml } from "/inti/umum.js";
import { pilihHtml } from "/inti/komponen.js";
import { muat, label, urlAman } from "/publik.js";

const JENIS = ["seminar", "konferensi", "audiensi", "lokakarya", "regulasi", "tenggat"];
const HP = matchMedia("(max-width:639px)");
const S = { tampil: "agenda", jenis: "", bulan: "", hari: "", mini: !HP.matches }; // bulan = "YYYY-MM"
let D = null, KINI = "";

const MAKS_LANE = 3;
const BLN = { jan: 1, feb: 2, mar: 3, apr: 4, mei: 5, jun: 6, jul: 7, agu: 8, agt: 8, sep: 9, okt: 10, nov: 11, des: 12 };
const bulanDari = (tgl) => tgl.slice(0, 7);
const utc = (s) => { const [y, m, h] = s.split("-").map(Number); return Date.UTC(y, m - 1, h); };
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
const hariKe = (s) => (new Date(utc(s)).getUTCDay() + 6) % 7; // 0 = Senin
const namaBulan = (ym) => tanggal(ym + "-01", { gaya: "panjang" }).split(" ").slice(1, -1).join(" ");
const geser = (ym, n) => { const [y, m] = ym.split("-").map(Number); return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7); };
const efektif = () => (HP.matches ? "agenda" : S.tampil);

/** Rentang hanya ada di judul ("COP31 Antalya 9-20 Nov"); ambil bila hari awal sama dengan tanggal. */
function akhirDari(b) {
  const m = /\b(\d{1,2})\s*-\s*(\d{1,2})\s+(jan|feb|mar|apr|mei|jun|jul|agu|agt|sep|okt|nov|des)\w*/i.exec(b.judul);
  if (!m || +m[1] !== +b.tanggal.slice(8) || +m[3 - 0 ? 2 : 2] <= +m[1]) return b.tanggal;
  return BLN[m[3].toLowerCase()] === +b.tanggal.slice(5, 7) ? `${bulanDari(b.tanggal)}-${m[2].padStart(2, "0")}` : b.tanggal;
}

function bacaUrl() {
  const p = new URLSearchParams(location.search);
  if (p.get("tampil") === "bulan") S.tampil = "bulan";
  if (JENIS.includes(p.get("jenis"))) S.jenis = p.get("jenis");
  if (/^\d{4}-\d{2}$/.test(p.get("bulan") || "")) S.bulan = p.get("bulan");
}
function tulisUrl() {
  const u = new URL(location.href);
  S.tampil === "bulan" ? u.searchParams.set("tampil", "bulan") : u.searchParams.delete("tampil");
  S.jenis ? u.searchParams.set("jenis", S.jenis) : u.searchParams.delete("jenis");
  S.bulan ? u.searchParams.set("bulan", S.bulan) : u.searchParams.delete("bulan");
  u.searchParams.delete("hari");
  history.replaceState(null, "", u);
}

/* ---------- kepala ---------- */
const tombolTampil = (v, ik) => `<button type="button" data-tampil="${v}" aria-pressed="${S.tampil === v}">${ikon(ik, 18)}<span>${esc(t("kal.tampil." + v))}</span></button>`;
function gambarKepala() {
  document.getElementById("kepalaKal").innerHTML = `
    <div class="kal-nav">
      <button type="button" class="kal-bulat" data-geser="-1" aria-label="${esc(t("kal.sebelumnya"))}">${ikon("panah-kiri", 20)}</button>
      <h2 id="judulBulan"></h2>
      <button type="button" class="kal-bulat" data-geser="1" aria-label="${esc(t("kal.berikutnya"))}">${ikon("panah-kanan", 20)}</button>
      <button type="button" class="kal-hariini" data-hariini>${ikon("kalender", 18)}<span>${esc(t("kal.hariini"))}</span></button>
    </div>
    <div class="kal-kanan">
      <div class="kal-seg" role="group" aria-label="${esc(t("kal.agenda"))}">${tombolTampil("agenda", "daftar2")}${tombolTampil("bulan", "tabel")}</div>
      <div class="jm-saring kal-saring">${pilihHtml({ id: "jenis", ikon: "jenis", label: t("kal.semua"), opsi: [["", t("kal.semua")], ...JENIS.map((j) => [j, label("kal.jenis.", j)])], nilai: S.jenis })}<span class="jm-hitung" id="hitung" role="status" aria-live="polite"></span></div>
    </div>`;
  judulBulan();
}
function judulBulan() { document.getElementById("judulBulan").innerHTML = `${esc(namaBulan(S.bulan))} <span>${esc(S.bulan.slice(0, 4))}</span>`; }

/* ---------- data turunan ---------- */
function acaraDari(sem) {
  return sem.map((b) => ({ ...b, akhir: akhirDari(b) }));
}
const urlB = (b) => (b.sumber?.url && urlAman(b.sumber.url) ? b.sumber.url : "");
const pilJenis = (j) => `<span class="kal-pil kal-t-${esc(j)}">${esc(label("kal.jenis.", j))}</span>`;

/* ---------- kalender mini ---------- */
function mingguDari(ym) {
  const awal = utc(ym + "-01"), mulai = awal - hariKe(ym + "-01") * 864e5;
  const jml = new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5), 0)).getUTCDate();
  const n = Math.ceil((hariKe(ym + "-01") + jml) / 7);
  return Array.from({ length: n }, (_, w) => Array.from({ length: 7 }, (_, i) => iso(mulai + (w * 7 + i) * 864e5)));
}
const kepalaHari = (kelas) => [0, 1, 2, 3, 4, 5, 6].map((i) => `<div class="${kelas}${i > 4 ? " kal-akhir" : ""}">${esc(t("kal.hari." + i))}</div>`).join("");

function miniHtml(rows) {
  const sel = [];
  for (const mg of mingguDari(S.bulan)) for (const h of mg) {
    const mulai = rows.filter((b) => b.tanggal === h), cakup = rows.find((b) => b.akhir > b.tanggal && b.tanggal <= h && b.akhir >= h);
    const jen = [...new Set(mulai.map((b) => b.jenis))].slice(0, 3);
    const kls = ["kal-sel", bulanDari(h) !== S.bulan && "kal-luar", hariKe(h) > 4 && "kal-akhir", h === KINI && "kal-kini", h === S.hari && "kal-pilih"].filter(Boolean).join(" ");
    const rt = cakup ? `<i class="kal-rt kal-t-${esc(cakup.jenis)}${cakup.tanggal === h ? " kal-rt-a" : ""}${cakup.akhir === h ? " kal-rt-z" : ""}"></i>` : "";
    sel.push(`<button type="button" class="${kls}" data-hari="${h}" aria-pressed="${h === S.hari}" aria-label="${esc(tanggal(h))}"><b>${+h.slice(8)}</b><span class="kal-titik">${jen.map((j) => `<i class="kal-t-${esc(j)}"></i>`).join("")}</span>${rt}</button>`);
  }
  return `<div class="jm-kartu kal-mini${S.mini ? " kal-buka" : ""}">
    <button type="button" class="kal-mini-tgl" data-mini aria-expanded="${S.mini}">${ikon("kalender", 18)}<span>${esc(t("kal.mini"))}</span></button>
    <div class="kal-mini-badan"><div class="kal-grid7">${kepalaHari("kal-hn")}${sel.join("")}</div></div></div>`;
}

/* ---------- agenda ---------- */
function barisHtml(b) {
  const rentang = b.akhir > b.tanggal, d = b.tanggal;
  const tgl = `<span class="kal-tgl"><b class="${rentang ? "kal-rg" : ""}">${rentang ? `${+d.slice(8)}-${+b.akhir.slice(8)}` : +d.slice(8)}</b><span>${esc(tanggal(d).split(" ")[1])}</span><small>${esc(t("kal.hari." + hariKe(d)))}</small></span>`;
  const u = urlB(b);
  const isi = `${tgl}<span class="kal-isi"><strong>${esc(b.judul)}</strong>
    ${b.mitra ? `<span class="kal-meta">${ikon("orang", 16)}<span>${esc(b.mitra)}</span></span>` : ""}
    <span class="kal-meta kal-sumber">${ikon("info", 16)}<span>${esc(t("kal.sumber." + b.sumber.label))}, ${esc(t("kal.diambil", { tanggal: tanggal(b.sumber.tanggal) }))}</span></span></span>
    <span class="kal-sisi">${pilJenis(b.jenis)}${u ? `<span class="kal-buka-tautan"><span>${esc(t("kal.buka"))}</span>${ikon("panah-kanan", 16)}</span>` : ""}</span>`;
  return `<li>${u ? `<a class="kal-baris" id="${esc(b.id)}" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${isi}</a>` : `<div class="kal-baris" id="${esc(b.id)}">${isi}</div>`}</li>`;
}
function kelompokHtml(rows, turun) {
  const g = new Map();
  for (const b of rows) (g.get(bulanDari(b.tanggal)) || g.set(bulanDari(b.tanggal), []).get(bulanDari(b.tanggal))).push(b);
  return [...g.keys()].sort().sort(() => 0).sort((a, c) => (turun ? c.localeCompare(a) : a.localeCompare(c))).map((ym) => {
    const r = g.get(ym).sort((a, c) => (turun ? c.tanggal.localeCompare(a.tanggal) : a.tanggal.localeCompare(c.tanggal)));
    return `<section class="kal-grup"><h3>${esc(namaBulan(ym))} ${esc(ym.slice(0, 4))}<span>${esc(angka(r.length))}</span></h3><ul class="kal-daftar">${r.map(barisHtml).join("")}</ul></section>`;
  }).join("");
}
function agendaHtml(rows) {
  let kiri;
  if (S.hari) {
    const r = rows.filter((b) => b.tanggal <= S.hari && b.akhir >= S.hari);
    kiri = `<div class="kal-pilih-bar"><strong>${esc(t("kal.pada", { tanggal: tanggal(S.hari) }))}</strong><button type="button" class="jm-hapus" data-hari="${S.hari}">${ikon("silang", 16)}${esc(t("kal.semuatgl"))}</button></div>${r.length ? `<ul class="kal-daftar">${r.map(barisHtml).join("")}</ul>` : kosongHtml("kal.kosong")}`;
  } else {
    const dep = rows.filter((b) => b.akhir >= KINI), lalu = rows.filter((b) => b.akhir < KINI);
    kiri = (dep.length ? kelompokHtml(dep, false) : kosongHtml("kal.kosong")) + (lalu.length ? `<details class="jm-kartu kal-lalu"><summary>${ikon("jejak", 18)}<span>${esc(t("kal.lalu", { n: angka(lalu.length) }))}</span></summary>${kelompokHtml(lalu, true)}</details>` : "");
  }
  return `<div class="kal-dua">${miniHtml(rows)}<div class="kal-agenda">${kiri}</div></div>`;
}

/* ---------- tampilan bulan ---------- */
function bulanHtml(rows) {
  const minggu = mingguDari(S.bulan).map((mg) => {
    const aw = mg[0], ak = mg[6], seg = [];
    for (const b of rows) if (b.tanggal <= ak && b.akhir >= aw) {
      const s = b.tanggal < aw ? aw : b.tanggal, e = b.akhir > ak ? ak : b.akhir;
      seg.push({ b, k: (utc(s) - utc(aw)) / 864e5 + 1, n: (utc(e) - utc(s)) / 864e5 + 1, kiri: b.tanggal < aw, kanan: b.akhir > ak });
    }
    seg.sort((a, c) => a.k - c.k || c.n - a.n);
    const akhirLane = [], lebih = Array(8).fill(0);
    let out = "";
    for (const sg of seg) {
      let l = akhirLane.findIndex((x) => x < sg.k);
      if (l < 0) l = akhirLane.length;
      akhirLane[l] = sg.k + sg.n - 1;
      if (l >= MAKS_LANE) { for (let c = sg.k; c < sg.k + sg.n; c++) lebih[c]++; continue; }
      const u = urlB(sg.b), multi = sg.b.akhir > sg.b.tanggal;
      const kls = `kal-ev kal-t-${esc(sg.b.jenis)} kal-k${sg.k} kal-s${sg.n} kal-l${l}${multi ? " kal-ev-bar" : ""}${sg.kiri ? " kal-pot-k" : ""}${sg.kanan ? " kal-pot-n" : ""}`;
      const dalam = (multi ? "" : "<i></i>") + `<span>${esc(sg.b.judul)}</span>`;
      out += u ? `<a class="${kls}" href="${esc(u)}" target="_blank" rel="noopener noreferrer" title="${esc(sg.b.judul)}">${dalam}</a>` : `<span class="${kls}" title="${esc(sg.b.judul)}">${dalam}</span>`;
    }
    const sel = mg.map((h, i) => `<div class="kal-hr${bulanDari(h) !== S.bulan ? " kal-luar" : ""}${i > 4 ? " kal-akhir" : ""}${h === KINI ? " kal-kini" : ""} kal-k${i + 1}"><b>${+h.slice(8)}</b></div>`).join("");
    const lain = mg.map((h, i) => (lebih[i + 1] ? `<button type="button" class="kal-lain kal-k${i + 1}" data-hari="${h}" data-ke="agenda">${esc(t("kal.lainnya", { n: lebih[i + 1] }))}</button>` : "")).join("");
    return `<div class="kal-minggu">${sel}${out}${lain}</div>`;
  }).join("");
  return `<div class="jm-kartu kal-bulan"><div class="kal-hdr">${kepalaHari("kal-hn")}</div>${minggu}</div>`;
}

function gambarIsi() {
  const rows = acaraDari(D.baris.filter((b) => !S.jenis || b.jenis === S.jenis));
  const v = efektif();
  document.getElementById("hitung").textContent = t("kal.hitung", { n: angka(rows.length), total: angka(D.baris.length) });
  document.getElementById("isi").innerHTML = v === "bulan" ? bulanHtml(rows) : agendaHtml(rows);
}

async function main() {
  await mulaiHalaman();
  bacaUrl();
  KINI = new Date().toISOString().slice(0, 10);
  const isi = document.getElementById("isi");
  const catatan = () => { document.getElementById("sumber").textContent = t("kal.catatan", { tanggal: tanggal(D.dibangun_pada) }); };
  const mulai = async () => {
    isi.innerHTML = hantuHtml(5);
    try { D = await muat("kalender"); } catch (e) { isi.innerHTML = galatHtml("layanan"); return; }
    if (!S.bulan) { const kini = KINI.slice(0, 7); S.bulan = D.baris.some((b) => bulanDari(b.tanggal) === kini) ? kini : bulanDari(D.baris.filter((b) => b.tanggal <= KINI).pop()?.tanggal || D.baris[D.baris.length - 1].tanggal); }
    catatan(); gambarKepala(); gambarIsi();
  };
  await mulai();
  isi.addEventListener("click", (e) => e.target.closest("[data-aksi=ulang]") && mulai());
  const ulang = () => nanti(() => { tulisUrl(); gambarIsi(); });
  const akar = document.getElementById("kal");
  akar.addEventListener("click", (e) => {
    if (!D) return;
    const q = (s) => e.target.closest(s);
    let b;
    if ((b = q("[data-tampil]"))) {
      S.tampil = b.dataset.tampil;
      for (const x of document.querySelectorAll("[data-tampil]")) x.setAttribute("aria-pressed", String(x === b)); // chrome urgent
      ulang();
    } else if ((b = q("[data-geser]"))) { S.bulan = geser(S.bulan, +b.dataset.geser); S.hari = ""; judulBulan(); ulang(); }
    else if (q("[data-hariini]")) { S.bulan = KINI.slice(0, 7); S.hari = ""; judulBulan(); ulang(); }
    else if ((b = q("[data-mini]"))) { S.mini = !S.mini; b.setAttribute("aria-expanded", String(S.mini)); b.closest(".kal-mini").classList.toggle("kal-buka", S.mini); }
    else if ((b = q("[data-hari]"))) {
      const h = b.dataset.hari;
      S.hari = S.hari === h && !b.dataset.ke ? "" : h;
      if (b.dataset.ke) S.tampil = "agenda";
      if (bulanDari(h) !== S.bulan && S.hari) { S.bulan = bulanDari(h); judulBulan(); }
      ulang();
    }
  });
  akar.addEventListener("change", (e) => { if (e.target.id === "jenis") { S.jenis = e.target.value; ulang(); } });
  HP.addEventListener("change", () => D && nanti(() => { S.mini = !HP.matches; gambarIsi(); }));
  document.addEventListener("jm:bahasa", () => D && nanti(() => { gambarKepala(); gambarIsi(); catatan(); }));
}
main();
