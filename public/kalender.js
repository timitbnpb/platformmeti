import { khUbin } from "/inti/kh.js";
import { t, ada, angka, tanggal } from "/i18n.js";
import { esc, nanti, ikon, hantuHtml, kosongHtml, galatHtml, api } from "/inti/umum.js";
import { pilihHtml, exHtml, sumberHtml } from "/inti/komponen.js";
import { tautOrg, siapTautan, rinci } from "/inti/tautan.js";
import { tautanBagi } from "/inti/bagi.js";
import { lokasiTeks, petaUrl, sumberDaftar, namaSumber, sumberTeks, namaPenyelenggara, gambarAcara } from "/kalender_fmt.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { muat, label, urlAman } from "/publik.js";

const IKON_JENIS = { seminar: "video", konferensi: "orang", audiensi: "perisai", lokakarya: "metode", regulasi: "regulasi", tenggat: "linimasa" };
const JENIS = ["seminar", "konferensi", "audiensi", "lokakarya", "regulasi", "tenggat"];
const HP = matchMedia("(max-width:639px)");
const S = { tampil: "bulan", jenis: "", bulan: "" }; // bulan = "YYYY-MM"
let D = null, KINI = "", ROWS = [], OPENER = null;
let LIBUR = new Map(); // "YYYY-MM-DD" -> { nama, singkat, jenis } dari SKB 3 Menteri (data/libur.json); tidak ikut ekspor .ics, Google Calendar, atau CSV
let BUKTI = new Map(); // kegiatan_ref -> { ada_notulensi, jumlah_foto }; kosong untuk publik

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
  if (!m || +m[1] !== +b.tanggal.slice(8) || +m[2] <= +m[1]) return b.tanggal;
  return BLN[m[3].toLowerCase()] === +b.tanggal.slice(5, 7) ? `${bulanDari(b.tanggal)}-${m[2].padStart(2, "0")}` : b.tanggal;
}

function bacaUrl() {
  const p = new URLSearchParams(location.search);
  if (p.get("tampil") === "agenda") S.tampil = "agenda";
  if (JENIS.includes(p.get("jenis"))) S.jenis = p.get("jenis");
  if (/^\d{4}-\d{2}$/.test(p.get("bulan") || "")) S.bulan = p.get("bulan");
}
function tulisUrl() {
  const u = new URL(location.href);
  S.tampil === "agenda" ? u.searchParams.set("tampil", "agenda") : u.searchParams.delete("tampil");
  S.jenis ? u.searchParams.set("jenis", S.jenis) : u.searchParams.delete("jenis");
  S.bulan ? u.searchParams.set("bulan", S.bulan) : u.searchParams.delete("bulan");
  history.replaceState(null, "", u);
}

/* ---------- kepala ---------- */
const tombolTampil = (v, ik) => `<button type="button" data-tampil="${v}" aria-pressed="${S.tampil === v}">${ikon(ik, 18)}<span>${esc(t("kal.tampil." + v))}</span></button>`;
function gambarAngkaKunci() {
  const bln = KINI.slice(0, 7);
  khUbin("khUbin", [{ ikon: "kalender", nilai: angka(D.baris.length), label: t("kal.n.total") }, { ikon: "tahun", nilai: angka(D.baris.filter((b) => bulanDari(b.tanggal) === bln).length), label: t("kal.n.bulan") }, { ikon: "linimasa", nilai: angka(D.baris.filter((b) => b.tanggal >= KINI).length), label: t("kal.n.depan") }]);
}
function gambarKepala() {
  gambarAngkaKunci();
  document.getElementById("kepalaKal").innerHTML = `
    <div class="kal-kiri">
      <div class="kal-seg" role="group" aria-label="${esc(t("kal.agenda"))}">${tombolTampil("bulan", "tabel")}${tombolTampil("agenda", "daftar2")}</div>
      <button type="button" class="kal-hariini" data-hariini>${ikon("kalender", 18)}<span>${esc(t("kal.hariini"))}</span></button>
    </div>
    <div class="kal-nav">
      <button type="button" class="kal-bulat" data-geser="-1" aria-label="${esc(t("kal.sebelumnya"))}">${ikon("panah-kiri", 20)}</button>
      <h2 id="judulBulan"></h2>
      <button type="button" class="kal-bulat" data-geser="1" aria-label="${esc(t("kal.berikutnya"))}">${ikon("panah-kanan", 20)}</button>
    </div>
    <div class="kal-kanan">
      <a class="kal-hariini" id="kalLanggan" href="https://calendar.google.com/calendar/r?cid=${encodeURIComponent("webcal://" + location.host + "/kalender.ics")}" target="_blank" rel="noopener noreferrer" title="${esc(t("kal.langgan"))}" aria-label="${esc(t("kal.langgan"))}">${ikon("tambah", 18)}<span>${esc(t("kal.langgan_pendek"))}</span></a>
      <button type="button" class="kal-bulat" data-salin-ical aria-label="${esc(t("kal.salin_ical"))}" title="${esc(t("kal.salin_ical"))}">${ikon("salin", 20)}</button>
      <div class="jm-saring kal-saring">${pilihHtml({ id: "jenis", ikon: "jenis", label: t("kal.semua"), opsi: [["", t("kal.semua")], ...JENIS.map((j) => [j, label("kal.jenis.", j), IKON_JENIS[j]])], nilai: S.jenis })}</div>
    </div>`;
  judulBulan();
}
function judulBulan() { document.getElementById("judulBulan").innerHTML = `${esc(namaBulan(S.bulan))} <span>${esc(S.bulan.slice(0, 4))}</span>`; }

/* ---------- data turunan ---------- */
function acaraDari(sem) {
  return sem.map((b) => ({ ...b, akhir: akhirDari(b) }));
}
const nmSumber = (l) => (ada("kal.sumber." + l) ? t("kal.sumber." + l) : "");
const FMT = { nama: nmSumber, diambil: (d) => t("kal.diambil", { tanggal: tanggal(d) }) };
const urlB = (b) => urlAman(sumberDaftar(b.sumber)[0]?.url || "");
const mitraTeks = (b) => namaPenyelenggara(b).join(", ");
const thumb = (b) => { const g = gambarAcara(b); return g ? `<img class="kal-thumb" src="${esc(g)}" alt="" width="64" height="64" loading="lazy" decoding="async" data-galat="hapus">` : ""; };
const pilJenis = (j) => `<span class="kal-pil kal-t-${esc(j)}">${esc(label("kal.jenis.", j))}</span>`;

/* ---------- kalender ---------- */
function mingguDari(ym) {
  const awal = utc(ym + "-01"), mulai = awal - hariKe(ym + "-01") * 864e5;
  const jml = new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5), 0)).getUTCDate();
  const n = Math.ceil((hariKe(ym + "-01") + jml) / 7);
  return Array.from({ length: n }, (_, w) => Array.from({ length: 7 }, (_, i) => iso(mulai + (w * 7 + i) * 864e5)));
}
const IK_LIBUR = { libur_nasional: "bintang", cuti_bersama: "tahun" };
const kelasLibur = (h) => (LIBUR.has(h) ? ` ${LIBUR.get(h).jenis === "cuti_bersama" ? "kal-cuti" : "kal-libur"}` : "");
/** Legenda kecil dan daftar "Libur bulan ini" di bawah kalender; daftar disembunyikan bila bulan itu tanpa libur. */
function liburHtml() {
  const ada = [...LIBUR].filter(([h]) => h.startsWith(S.bulan)).sort(([a], [c]) => a.localeCompare(c));
  const leg = `<ul class="kal-ket" aria-label="${esc(t("kal.libur.legenda"))}"><li><i class="kal-ket-akhir"></i><span>${esc(t("kal.libur.akhir"))}</span></li><li><i class="kal-ket-libur"></i><span>${esc(t("kal.libur.nasional"))}</span></li><li><i class="kal-ket-cuti"></i><span>${esc(t("kal.libur.cuti"))}</span></li></ul>`;
  if (!ada.length) return leg;
  return leg + `<section class="jm-kartu kal-libur-daftar" aria-labelledby="kalLiburJ"><h3 id="kalLiburJ">${ikon("kalender", 18)}<span>${esc(t("kal.libur.bulan"))}</span></h3><ul>${ada.map(([h, l]) => `<li class="${l.jenis === "cuti_bersama" ? "kal-cuti" : "kal-libur"}">${ikon(IK_LIBUR[l.jenis], 18)}<b>${esc(tanggal(h, { gaya: "panjang" }))}</b><span>${esc(l.nama)}</span><em>${esc(t("kal.libur." + (l.jenis === "cuti_bersama" ? "cuti" : "nasional")))}</em></li>`).join("")}</ul></section>`;
}
const kepalaHari = (kelas) => [0, 1, 2, 3, 4, 5, 6].map((i) => `<div class="${kelas}${i > 4 ? " kal-akhir" : ""}">${esc(t("kal.hari." + i))}</div>`).join("");

/** Pekan ringkas untuk HP: satu minggu (minggu hari ini bila di bulan tampil), titik jenis per hari. */
function pekanHtml(rows) {
  const ada = mingguDari(S.bulan), mg = ada.find((w) => w.includes(KINI)) || ada[0];
  const sel = mg.map((h) => {
    const jen = [...new Set(rows.filter((b) => b.tanggal <= h && b.akhir >= h).map((b) => b.jenis))].slice(0, 3);
    const kls = ["kal-sel", bulanDari(h) !== S.bulan && "kal-luar", hariKe(h) > 4 && "kal-akhir", h === KINI && "kal-kini"].filter(Boolean).join(" ");
    return `<button type="button" class="${kls}" data-hari="${h}" aria-label="${esc(tanggal(h))}"><b>${+h.slice(8)}</b><span class="kal-titik">${jen.map((j) => `<i class="kal-t-${esc(j)}"></i>`).join("")}</span></button>`;
  });
  return `<div class="jm-kartu kal-pekan"><div class="kal-grid7">${kepalaHari("kal-hn")}${sel.join("")}</div></div>`;
}

/* ---------- agenda ---------- */
function barisHtml(b) {
  const rentang = b.akhir > b.tanggal, d = b.tanggal;
  const tgl = `<span class="kal-tgl"><b class="${rentang ? "kal-rg" : ""}">${rentang ? `${+d.slice(8)}-${+b.akhir.slice(8)}` : +d.slice(8)}</b><span>${esc(tanggal(d).split(" ")[1])}</span><small>${esc(t("kal.hari." + hariKe(d)))}</small></span>`;
  const sm = sumberTeks(b.sumber, FMT), mt = mitraTeks(b), th = thumb(b);
  return `<li><button type="button" class="kal-baris${th ? " kal-baris-g" : ""}" id="acara-${esc(b.id)}" data-acara="${esc(b.id)}">${tgl}<span class="kal-isi"><strong>${esc(b.judul)}</strong>
    ${mt ? `<span class="kal-meta">${ikon("orang", 16)}<span>${esc(mt)}</span></span>` : ""}
    ${sm ? `<span class="kal-meta kal-sumber">${ikon("info", 16)}<span>${esc(sm)}</span></span>` : ""}</span>
    <span class="kal-sisi">${th}${pilJenis(b.jenis)}</span></button></li>`;
}
function buktiHtml(b) {
  const x = BUKTI.get(b.id);
  if (!x || (!x.jumlah_foto && !x.ada_notulensi)) return "";
  const tb = (a, ik, kunci, n) => `<button type="button" class="jm-tbl jm-tbl-kecil" data-bukti="${a}" data-ref="${esc(b.id)}">${ikon(ik, 16)}<span>${esc(t(kunci, n ? { n: angka(n) } : undefined))}</span></button>`;
  return `<div class="kal-bukti">${x.jumlah_foto ? tb("foto", "gambar", "kal.bukti.foto", x.jumlah_foto) : ""}${x.ada_notulensi ? tb("notulen", "berita", "kal.bukti.notulen") : ""}</div>`;
}

/* ---------- dialog bukti (hanya yang login; publik tidak pernah melihatnya) ---------- */
const DL = { el: null, ref: "", det: null, foto: -1, ctl: null };
function notulenHtml(teks) {
  const keluar = [];
  for (const blok of esc(teks).split(/\n\s*\n/)) {
    const baris = blok.split("\n").map((x) => x.trim()).filter(Boolean);
    let para = [], daftar = null;
    const tutup = () => { if (para.length) keluar.push(`<p>${para.join("<br>")}</p>`); if (daftar) keluar.push(`<${daftar.tag}>${daftar.li.map((x) => `<li>${x}</li>`).join("")}</${daftar.tag}>`); para = []; daftar = null; };
    for (const r of baris) {
      const m = /^(\d+[.)]|-)\s+(.*)$/.exec(r);
      if (m) { const tag = m[1] === "-" ? "ul" : "ol"; if (!daftar || daftar.tag !== tag) { tutup(); daftar = { tag, li: [] }; } else if (para.length) tutup(); daftar.li.push(m[2]); }
      else { if (daftar) tutup(); para.push(r); }
    }
    tutup();
  }
  return keluar.join("");
}
function dialog() {
  if (DL.el) return DL.el;
  const d = document.createElement("dialog");
  d.className = "jm-dlg jm-dlg-lebar";
  d.setAttribute("aria-labelledby", "bktJudul");
  document.body.appendChild(d);
  d.addEventListener("click", (e) => {
    if (e.target === d) { d.close(); return; }
    const b = e.target.closest("button");
    if (!b) return;
    const a = b.dataset.bk;
    if (a === "tutup") d.close();
    else if (a === "foto") { DL.foto = +b.dataset.i; gambarBukti(); }
    else if (a === "galeri") { DL.foto = -1; gambarBukti(); }
    else if (a === "prev" || a === "next") geserFoto(a === "next" ? 1 : -1);
  });
  d.addEventListener("keydown", (e) => { if (DL.foto >= 0 && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { e.preventDefault(); geserFoto(e.key === "ArrowRight" ? 1 : -1); } });
  d.addEventListener("close", () => { if (DL.ctl) DL.ctl.abort(); DL.foto = -1; });
  return (DL.el = d);
}
function geserFoto(n) { const f = DL.det.foto; DL.foto = (DL.foto + n + f.length) % f.length; gambarBukti(); }
function gambarBukti() {
  const d = DL.el, { bukti, foto } = DL.det, acara = D.baris.find((b) => b.id === DL.ref) || {};
  const kepala = `<header class="kal-bk-kepala"><div><h2 id="bktJudul">${esc(acara.judul || "")}</h2><p class="jm-bantu">${esc(tanggal(acara.tanggal))}${bukti && bukti.tempat ? ", " + esc(bukti.tempat) : ""}</p></div>
    <button type="button" class="jm-tbl jm-tbl-kecil" data-bk="tutup" aria-label="${esc(t("jm.tutup"))}">${ikon("tutup", 18)}</button></header>`;
  let isi;
  if (DL.foto >= 0 && foto[DL.foto]) {
    const f = foto[DL.foto];
    isi = `<div class="kal-bk-penuh"><button type="button" class="jm-tbl jm-tbl-kecil" data-bk="galeri">${ikon("panah-kiri", 18)}<span>${esc(t("kal.bukti.galeri"))}</span></button>
      <div class="kal-bk-lihat"><button type="button" class="jm-tbl kal-bulat" data-bk="prev" aria-label="${esc(t("kal.sebelumnya"))}">${ikon("panah-kiri", 20)}</button>
      <img src="/api/agenda/foto/${encodeURIComponent(f.id)}" alt="${esc(f.keterangan || t("kal.bukti.foto_alt", { n: angka(DL.foto + 1) }))}" decoding="async">
      <button type="button" class="jm-tbl kal-bulat" data-bk="next" aria-label="${esc(t("kal.berikutnya"))}">${ikon("panah-kanan", 20)}</button></div>
      <p class="jm-bantu">${esc(t("kal.bukti.n_dari", { n: angka(DL.foto + 1), total: angka(foto.length) }))}${f.keterangan ? ": " + esc(f.keterangan) : ""}</p></div>`;
  } else {
    isi = (foto.length ? `<section aria-label="${esc(t("kal.bukti.foto", { n: angka(foto.length) }))}"><div class="kal-bk-kisi">${foto.map((f, i) => `<figure><button type="button" data-bk="foto" data-i="${i}" aria-label="${esc(f.keterangan || t("kal.bukti.foto_alt", { n: angka(i + 1) }))}"><img src="/api/agenda/foto/${encodeURIComponent(f.id)}" alt="" loading="lazy" decoding="async"></button>${f.keterangan ? `<figcaption>${esc(f.keterangan)}</figcaption>` : ""}</figure>`).join("")}</div></section>` : "")
      + (bukti && bukti.notulensi ? `<section class="kal-bk-notulen"><h3>${esc(t("kal.bukti.notulen"))}</h3>${notulenHtml(bukti.notulensi)}</section>` : "");
  }
  d.innerHTML = kepala + (isi || kosongHtml("kal.bukti.kosong"));
}
async function bukaBukti(ref, fokus) {
  const d = dialog();
  DL.ref = ref; DL.foto = -1;
  if (DL.ctl) DL.ctl.abort();
  DL.ctl = new AbortController();
  d.innerHTML = hantuHtml(4);
  if (!d.open) d.showModal();
  try { DL.det = await api("/api/agenda/" + encodeURIComponent(ref), { signal: DL.ctl.signal }); } catch (e) { if (e.name !== "AbortError") d.innerHTML = galatHtml(e.kode || "umum"); return; }
  DL.det.foto = DL.det.foto || [];
  nanti(() => { gambarBukti(); const k = fokus === "notulen" && d.querySelector(".kal-bk-notulen"); if (k) k.scrollIntoView({ block: "start" }); });
}
/** Diam bila 401/403/galat: publik tidak melihat apa pun yang baru (DS prinsip 5). */
async function muatBukti() {
  try {
    const d = await api("/api/agenda");
    BUKTI = new Map(((d && d.bukti) || []).map((b) => [b.kegiatan_ref, b]));
  } catch (e) { BUKTI = new Map(); }
  if (BUKTI.size) nanti(gambarIsi);
}
function kelompokHtml(rows, turun) {
  const g = new Map();
  for (const b of rows) (g.get(bulanDari(b.tanggal)) || g.set(bulanDari(b.tanggal), []).get(bulanDari(b.tanggal))).push(b);
  return [...g.keys()].sort((a, c) => (turun ? c.localeCompare(a) : a.localeCompare(c))).map((ym) => {
    const r = g.get(ym).sort((a, c) => (turun ? c.tanggal.localeCompare(a.tanggal) : a.tanggal.localeCompare(c.tanggal)));
    return `<section class="kal-grup"><h3>${esc(namaBulan(ym))} ${esc(ym.slice(0, 4))}<span>${esc(angka(r.length))}</span></h3><ul class="kal-daftar">${r.map(barisHtml).join("")}</ul></section>`;
  }).join("");
}
const sumberKal = () => sumberHtml(esc(t("kal.catatan", { tanggal: tanggal(D.dibangun_pada) })));
function agendaHtml(rows) {
  const dep = rows.filter((b) => b.akhir >= KINI), lalu = rows.filter((b) => b.akhir < KINI);
  const isi = (dep.length ? kelompokHtml(dep, false) : kosongHtml("kal.kosong")) + (lalu.length ? `<details class="kal-lalu"><summary>${ikon("jejak", 18)}<span>${esc(t("kal.lalu", { n: angka(lalu.length) }))}</span></summary>${kelompokHtml(lalu, true)}</details>` : "");
  return exHtml({ id: "ex-agenda", ikon: "daftar2", topik: t("kal.ex.agenda.ey"), judulHtml: dep.length ? hlHtml("kal.ex.agenda.j", angka(dep.length)) : esc(t("kal.ex.agenda.j0")), subHtml: esc(t("kal.ex.agenda.sub")),
    aksiHtml: aksiHtml({ csv: true }) + sumberKal(), isiHtml: `<div class="kal-agenda">${isi}</div>` });
}

/* ---------- tampilan bulan: 7 kolom penuh, batang rentang melintang ---------- */
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
      const kls = `kal-ev ${sg.b.akhir > sg.b.tanggal ? "kal-ev-bar" : "kal-ev-satu"} kal-t-${esc(sg.b.jenis)} kal-k${sg.k} kal-s${sg.n} kal-l${l}${sg.kiri ? " kal-pot-k" : ""}${sg.kanan ? " kal-pot-n" : ""}`;
      out += `<button type="button" class="${kls}" data-acara="${esc(sg.b.id)}" title="${esc(sg.b.judul)}"><i></i><span>${esc(sg.b.judul)}</span></button>`;
    }
    const sel = mg.map((h, i) => `<div class="kal-hr${bulanDari(h) !== S.bulan ? " kal-luar" : ""}${i > 4 ? " kal-akhir" : ""}${kelasLibur(h)}${h === KINI ? " kal-kini" : ""} kal-k${i + 1}" data-hari="${h}"${LIBUR.has(h) ? ` title="${esc(LIBUR.get(h).nama)}"` : ""}><button type="button" data-hari="${h}" aria-label="${esc(tanggal(h) + (LIBUR.has(h) ? ", " + LIBUR.get(h).nama : ""))}"><b>${+h.slice(8)}</b></button>${LIBUR.has(h) ? `<span class="kal-lbl">${esc(LIBUR.get(h).singkat)}</span>` : ""}</div>`).join("");
    const lain = mg.map((h, i) => (lebih[i + 1] ? `<button type="button" class="kal-lain kal-k${i + 1}" data-hari="${h}">${esc(t("kal.lainnya", { n: lebih[i + 1] }))}</button>` : "")).join("");
    return `<div class="kal-minggu">${sel}${out}${lain}</div>`;
  }).join("");
  const n = rows.filter((b) => b.tanggal.slice(0, 7) <= S.bulan && b.akhir.slice(0, 7) >= S.bulan).length;
  return exHtml({ id: "ex-bulan", ikon: "kalender", topik: t("kal.ex.bulan.ey"), judulHtml: hlHtml("kal.ex.bulan.j", angka(n), { bulan: `${namaBulan(S.bulan)} ${S.bulan.slice(0, 4)}` }), subHtml: esc(t("kal.ex.bulan.sub")),
    aksiHtml: aksiHtml({ csv: true }) + sumberKal(), isiHtml: `${legendaJenis()}<div class="kal-bulan"><div class="kal-hdr">${kepalaHari("kal-hn")}</div>${minggu}</div>` });
}

/* legenda warna jenis acara di atas kalender bulanan (pemilik 8 Nov 2026) */
function legendaJenis() {
  const ada = new Set(D.baris.map((b) => b.jenis));
  return `<ul class="kal-legenda" aria-label="${esc(t("kal.legenda"))}">${JENIS.filter((j) => ada.has(j)).map((j) => `<li><span class="kal-titik"><i class="kal-t-${j}"></i></span>${ikon(IKON_JENIS[j], 16)}<span>${esc(label("kal.jenis.", j))}</span></li>`).join("")}</ul>`;
}
function gambarIsi() {
  const rows = acaraDari(D.baris.filter((b) => !S.jenis || b.jenis === S.jenis));
  const v = efektif();
  ROWS = rows;
  const atas = v === "bulan" ? bulanHtml(rows) : HP.matches ? pekanHtml(rows) : "";
  document.getElementById("isi").innerHTML = atas + (atas ? liburHtml() : "") + agendaHtml(rows);
}

/* ---------- popup acara / hari (dialog modal; di HP jadi lembar bawah lewat CSS) ---------- */
const pop = () => document.getElementById("kalPop");
const tglRentang = (b) => `${t("kal.hari." + hariKe(b.tanggal))}, ${tanggal(b.tanggal)}${b.akhir > b.tanggal ? ` - ${t("kal.hari." + hariKe(b.akhir))}, ${tanggal(b.akhir)}` : ""}`;
const tutupX = () => `<button type="button" class="kal-pop-x" data-pop="tutup" aria-label="${esc(t("kal.pop.tutup"))}">${ikon("silang", 22)}</button>`;
const tampilPop = (html, opener) => {
  const d = pop(); d.innerHTML = html; OPENER = opener || OPENER;
  if (!d.open) d.showModal();
  d.scrollTop = 0; d.querySelector("[data-pop=tutup]")?.focus();
};
const IK_JENIS_G = IKON_JENIS;
/** Penyelenggara dengan logo + tautan /o bila dikenal; teks polos bila tidak. */
function mitraHtml(b) {
  return namaPenyelenggara(b).map((n) => {
    const r = rinci("org", n);
    return r ? `<a class="kal-org" href="${esc(r.href)}">${r.logo ? `<img src="${esc(r.logo)}" alt="" width="24" height="24" loading="lazy" decoding="async" data-galat="hapus">` : ikon("gedung", 16)}<span>${esc(r.nama)}</span></a>` : `<span class="kal-org"><span>${esc(n)}</span></span>`;
  }).join("");
}
function sumberHtmlPop(b) {
  return sumberDaftar(b.sumber).map((s) => {
    const n = namaSumber(s, nmSumber);
    if (!n) return "";
    const ket = esc(n) + (s.tanggal ? `, ${esc(FMT.diambil(s.tanggal))}` : "");
    return s.url && urlAman(s.url) ? `<a class="kal-taut" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}<span>${ket}</span></a>` : `<span>${ket}</span>`;
  }).filter(Boolean).join("<br>");
}
function kartuTerkait(x) {
  const th = thumb(x), mt = mitraTeks(x);
  return `<li><button type="button" class="kal-trk" data-acara="${esc(x.id)}"><span class="kal-tgl"><b>${+x.tanggal.slice(8)}</b><span>${esc(tanggal(x.tanggal).split(" ")[1])}</span></span>
    <span class="kal-isi"><strong>${esc(x.judul)}</strong>${mt ? `<span class="kal-meta">${ikon("orang", 16)}<span>${esc(mt)}</span></span>` : ""}${pilJenis(x.jenis)}</span>${th}</button></li>`;
}
function bukaAcara(id, opener) {
  const b = ROWS.find((x) => x.id === id) || acaraDari(D.baris).find((x) => x.id === id);
  if (!b) return;
  const u = urlB(b), hari = Math.round((utc(b.akhir) - utc(b.tanggal)) / 864e5) + 1, lok = lokasiTeks(b.lokasi), peta = petaUrl(b.lokasi), g = gambarAcara(b);
  const f = (ik, k, v) => (v ? `<li>${ikon(ik, 20)}<span><small>${esc(t(k))}</small>${v}</span></li>` : "");
  const kontak = b.daftar_url && urlAman(b.daftar_url) ? `<a class="kal-taut" href="${esc(b.daftar_url)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}<span>${esc(t("kal.pop.daftar"))}</span></a>` : b.situs && urlAman(b.situs) ? `<a class="kal-taut" href="${esc(b.situs)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}<span>${esc(t("kal.pop.situs"))}</span></a>` : "";
  const terkait = D.baris.filter((x) => x.id !== b.id && x.jenis === b.jenis).sort((p, q) => Math.abs(utc(p.tanggal) - utc(b.tanggal)) - Math.abs(utc(q.tanggal) - utc(b.tanggal))).slice(0, 3).map((x) => acaraDari([x])[0]);
  const url = `${location.origin}/kalender#acara-${b.id}`, bagi = tautanBagi(url, b.judul);
  const tglTeks = tglRentang(b);
  tampilPop(`<div class="kal-pop-isi"><div class="kal-pop-ban kal-g-${esc(b.jenis)}${g.startsWith("/img/acara/") ? " kal-ban-p" : ""}">${g ? (g.startsWith("/img/acara/") ? `<img class="kal-ban-blur" src="${esc(g)}" alt="" aria-hidden="true" decoding="async" data-galat="hapus"><img class="kal-ban-poster" src="${esc(g)}" alt="" decoding="async" data-galat="hapus">` : `<img src="${esc(g)}" alt="" decoding="async" data-galat="hapus">`) : ""}<span class="kal-pop-ik">${ikon(IK_JENIS_G[b.jenis] || "kalender", 56)}</span>${tutupX()}</div>
    <div class="kal-pop-kep">${pilJenis(b.jenis)}<h2 id="kalPopJ">${esc(b.judul)}</h2>
      <p class="kal-pop-sub"><span>${ikon("kalender", 18)}<span>${esc(tglTeks)}</span></span>${lok ? `<span>${ikon("lokasi", 18)}<span>${esc(lok)}</span></span>` : ""}</p></div>
    <div class="kal-pop-bd"><div class="kal-pop-kiri">${b.deskripsi ? `<p class="kal-pop-desk">${esc(b.deskripsi)}</p>` : ""}
      ${terkait.length ? `<section><h3>${esc(t("kal.pop.terkait"))}</h3><ul class="kal-trk-daftar">${terkait.map(kartuTerkait).join("")}</ul></section>` : ""}</div>
    <aside class="kal-pop-kanan"><ul class="kal-pop-meta">${f("kalender", "kal.pop.tanggal", `${esc(tglTeks)}${hari > 1 ? ` <em>${esc(t("kal.pop.durasi", { n: angka(hari) }))}</em>` : ""}`)}${f("lokasi", "kal.pop.lokasi", lok ? `${esc(lok)}${peta ? ` <a class="kal-peta" href="${esc(peta)}" target="_blank" rel="noopener noreferrer">${ikon("peta", 16)}<span>${esc(t("kal.pop.peta"))}</span></a>` : ""}` : "")}${f("orang", "kal.pop.mitra", mitraHtml(b))}${f("info", "kal.pop.sumber", sumberHtmlPop(b))}${f("tautan", "kal.pop.kontak", kontak)}</ul>
      <div class="kal-pop-aksi"><a class="jm-tbl" href="${esc(gcal(b))}" target="_blank" rel="noopener noreferrer">${ikon("kalender", 18)}<span>${esc(t("kal.pop.gcal"))}</span></a>
        <button type="button" class="jm-tbl" data-pop="ics" data-id="${esc(b.id)}">${ikon("unduh", 18)}<span>${esc(t("kal.pop.ics"))}</span></button>
        <button type="button" class="jm-tbl" data-pop="bagi" aria-expanded="false">${ikon("bagikan", 18)}<span>${esc(t("kal.pop.bagi"))}</span></button>
        <div class="kal-bagi" hidden><a class="kal-bulat" href="${esc(bagi.wa)}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" title="WhatsApp">${ikon("whatsapp", 20)}</a><a class="kal-bulat" href="${esc(bagi.x)}" target="_blank" rel="noopener noreferrer" aria-label="X" title="X">${ikon("x", 20)}</a><a class="kal-bulat" href="${esc(bagi.li)}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn">${ikon("linkedin", 20)}</a><button type="button" class="kal-bulat" data-pop="salin" data-url="${esc(url)}" aria-label="${esc(t("kal.pop.salin"))}" title="${esc(t("kal.pop.salin"))}">${ikon("salin", 20)}</button></div>
        ${u ? `<a class="jm-tbl" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 18)}<span>${esc(t("kal.pop.buka"))}</span></a>` : ""}${buktiHtml(b)}</div></aside></div></div>`, opener);
  history.replaceState(null, "", `${location.pathname}${location.search}#acara-${b.id}`);
}
function bukaHari(h, opener) {
  const r = ROWS.filter((b) => b.tanggal <= h && b.akhir >= h), lanjut = ROWS.filter((b) => b.tanggal > h).sort((a, c) => a.tanggal.localeCompare(c.tanggal))[0];
  const item = barisHtml;
  tampilPop(`<div class="kal-pop-isi"><div class="kal-pop-kep">${tutupX()}<span class="kal-pop-ik">${ikon("kalender", 28)}</span><h2 id="kalPopJ">${esc(t("kal.pop.hari", { tanggal: tanggal(h, { gaya: "panjang" }) }))}</h2></div><div class="kal-pop-bd">
    ${r.length ? `<ul class="kal-daftar">${r.map(item).join("")}</ul>` : `<p>${esc(t("kal.pop.kosong"))}</p>${lanjut ? `<h3>${esc(t("kal.pop.berikut"))}</h3><ul class="kal-daftar">${item(lanjut)}</ul>` : ""}`}</div></div>`, opener);
}
const gcal = (b) => `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(b.judul)}&dates=${b.tanggal.replaceAll("-", "")}/${iso(utc(b.akhir) + 864e5).replaceAll("-", "")}&details=${encodeURIComponent([mitraTeks(b), urlB(b)].filter(Boolean).join("\n"))}&location=${encodeURIComponent(lokasiTeks(b.lokasi))}`;
const icsUrl = () => `${location.origin}/kalender.ics`;
const ics = (b) => {
  const e = (x) => String(x).replace(/\\/g, "\\\\").replace(/[;,]/g, (m) => "\\" + m).replace(/\r?\n/g, "\\n"), d = (x) => x.replaceAll("-", "");
  const baris = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//METI//Direktori METI//ID", "BEGIN:VEVENT", `UID:${b.id}@meti`, `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d+/g, "")}`,
    `DTSTART;VALUE=DATE:${d(b.tanggal)}`, `DTEND;VALUE=DATE:${d(iso(utc(b.akhir) + 864e5))}`, `SUMMARY:${e(b.judul)}`, mitraTeks(b) && `DESCRIPTION:${e(mitraTeks(b))}`, lokasiTeks(b.lokasi) && `LOCATION:${e(lokasiTeks(b.lokasi))}`, urlB(b) && `URL:${urlB(b)}`, "END:VEVENT", "END:VCALENDAR"].filter(Boolean);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([baris.join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" })); a.download = `meti-${b.id}.ics`;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
};
function pasangPop() {
  const d = document.createElement("dialog");
  d.id = "kalPop"; d.className = "kal-pop"; d.setAttribute("aria-labelledby", "kalPopJ");
  document.body.append(d);
  d.addEventListener("click", (e) => {
    if (e.target === d || e.target.closest("[data-pop=tutup]")) return d.close();
    const bk = e.target.closest("[data-bukti]"); if (bk) { OPENER = null; d.close(); return bukaBukti(bk.dataset.ref, bk.dataset.bukti); }
    const a = e.target.closest("[data-acara]"); if (a) return bukaAcara(a.dataset.acara);
    const b = e.target.closest("[data-pop]"); if (!b) return;
    const ev = ROWS.find((x) => x.id === b.dataset.id) || acaraDari(D.baris).find((x) => x.id === b.dataset.id);
    if (b.dataset.pop === "ics" && ev) ics(ev);
    else if (b.dataset.pop === "bagi") {
      const m = d.querySelector(".kal-bagi"), buka = m.hidden;
      m.hidden = !buka; b.setAttribute("aria-expanded", String(buka));
    } else if (b.dataset.pop === "salin") {
      navigator.clipboard?.writeText(b.dataset.url).then(() => { b.title = t("kal.pop.disalin"); b.setAttribute("aria-label", t("kal.pop.disalin")); setTimeout(() => { b.title = t("kal.pop.salin"); b.setAttribute("aria-label", t("kal.pop.salin")); }, 1600); }, () => {});
    }
  });
  d.addEventListener("close", () => {
    history.replaceState(null, "", location.pathname + location.search);
    const o = OPENER; OPENER = null;
    const el = o && (o.isConnected ? o : document.querySelector(o.dataset.acara ? `[data-acara="${o.dataset.acara}"]` : `[data-hari="${o.dataset.hari}"]`));
    el?.focus();
  });
}

/* CSV seksi kalender (hook jm:csv dari inti/aksi_ex.js): acara yang tampil menurut filter */
const csvBaris = () => [[t("kal.pop.tanggal"), "s/d", "Judul", t("kal.pop.jenis"), t("kal.pop.mitra"), t("kal.pop.sumber"), "URL"], ...ROWS.slice().sort((a, c) => a.tanggal.localeCompare(c.tanggal)).map((b) => [b.tanggal, b.akhir, b.judul, label("kal.jenis.", b.jenis), mitraTeks(b), sumberTeks(b.sumber, FMT), urlB(b)])];

/** Dipanggil kalender_halaman.js saat tab Kalender pertama dibuka; saya = hasil mulaiHalaman(). */
export async function pasang(saya) {
  bacaUrl();
  KINI = new Date().toISOString().slice(0, 10);
  const isi = document.getElementById("isi");
  const mulai = async () => {
    isi.innerHTML = hantuHtml(5);
    try { [D] = await Promise.all([muat("kalender"), siapTautan("org")]); LIBUR = await muat("libur").then((l) => new Map(l.baris.sort((a, c) => (a.jenis === "libur_nasional" ? 1 : 0) - (c.jenis === "libur_nasional" ? 1 : 0)).map((b) => [b.tanggal, b])), () => new Map()); } catch (e) { isi.innerHTML = galatHtml("layanan"); return; }
    const deep = /^#acara-(.+)$/.exec(location.hash)?.[1], tuju = deep && D.baris.find((b) => b.id === deep);
    if (tuju) S.bulan = bulanDari(tuju.tanggal);
    else if (!S.bulan) { const kini = KINI.slice(0, 7); S.bulan = D.baris.some((b) => bulanDari(b.tanggal) === kini) ? kini : bulanDari(D.baris.filter((b) => b.tanggal <= KINI).pop()?.tanggal || D.baris[D.baris.length - 1].tanggal); }
    gambarKepala(); gambarIsi();
    if (tuju) bukaAcara(deep);
    if (!saya || saya.masuk !== false) muatBukti();
  };
  pasangPop();
  await mulai();
  isi.addEventListener("click", (e) => e.target.closest("[data-aksi=ulang]") && mulai());
  const ulang = () => nanti(() => { tulisUrl(); gambarIsi(); });
  const akar = document.getElementById("kal");
  document.addEventListener("jm:csv", (e) => { const ex = e.target.closest?.(".jm-ex"); if (ex && akar.contains(ex)) e.detail.baris = csvBaris(); }, true);
  addEventListener("click", (e) => {
    if (!D || e.target.closest("dialog")) return;
    const q = (s) => e.target.closest(s);
    let b;
    if ((b = q("[data-bukti]"))) bukaBukti(b.dataset.ref, b.dataset.bukti);
    else if ((b = q("[data-tampil]"))) {
      S.tampil = b.dataset.tampil;
      for (const x of document.querySelectorAll("[data-tampil]")) x.setAttribute("aria-pressed", String(x === b)); // chrome urgent
      ulang();
    } else if ((b = q("[data-geser]"))) { S.bulan = geser(S.bulan, +b.dataset.geser); judulBulan(); ulang(); }
    else if ((b = q("[data-salin-ical]"))) navigator.clipboard?.writeText(icsUrl()).then(() => { b.title = t("kal.pop.disalin"); b.setAttribute("aria-label", t("kal.pop.disalin")); setTimeout(() => { b.title = t("kal.salin_ical"); b.setAttribute("aria-label", t("kal.salin_ical")); }, 1600); }, () => {});
    else if (q("[data-hariini]")) { S.bulan = KINI.slice(0, 7); judulBulan(); ulang(); }
    else if ((b = q("[data-acara]")) && akar.contains(b)) bukaAcara(b.dataset.acara, b);
    else if ((b = q("[data-hari]")) && akar.contains(b)) bukaHari(b.dataset.hari, b.closest("button") || b);
  });
  akar.addEventListener("change", (e) => { if (e.target.id === "jenis") { S.jenis = e.target.value; ulang(); } });
  HP.addEventListener("change", () => D && nanti(() => { gambarIsi(); }));
  document.addEventListener("jm:bahasa", () => D && nanti(() => { gambarKepala(); gambarIsi(); }));
}
