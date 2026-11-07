/* /proyek: pelacak proyek nasional (K17, JM-P02/P03). Data = potret statis /data/*.json, tanpa rute Worker.
   INP: chrome filter/sort berubah seketika; peta, corong, tabel menyusul lewat nanti(); tabel dipaging 50 baris. */
import { t, ada, angka, tanggal, bahasa } from "/i18n.js";
import { esc, nanti, debounce, hantuHtml, galatHtml, ikon } from "/inti/umum.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { lapisAnggota, anggotaDl } from "/publik.js";
import { sumberHtml, exHtml } from "/inti/komponen.js";
import { ikonTek, pilTek, pilStatus } from "/inti/ikon_tek.js";
import { aksiHtml } from "/inti/aksi_ex.js";

const $ = (id) => document.getElementById(id);
const TAHUN = new Date().getFullYear();
const TAHAP = ["rencana", "izin", "pendanaan", "konstruksi", "beroperasi"];
const URUT_ST = [...TAHAP, "dibatalkan"];
const TIDAK = "tidak-diketahui";
const TEK_WARNA = { surya: "--data4", bayu: "--data3", hidro: "--data5", "panas-bumi": "--warn", bioenergi: "--data2", "biomassa-sampah": "--data1", penyimpanan: "--ink2", nuklir: "--bad" };
const BATAS = 15;
const PIN = '<svg class="jm-ik" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';

const lab = (awal, k) => (ada(awal + k) ? t(awal + k) : k || "-");
const labTek = (k) => lab("pj.tek.", k);
const labSt = (k) => lab("pj.st.", k);
const num = (n, d) => angka(n, { desimal: d ?? (Number.isInteger(n) ? 0 : 1) });
const urlAman = (u) => (/^https?:\/\//i.test(u || "") ? u : "");
const mapsUrl = (la, ln) => `https://www.google.com/maps/search/?api=1&query=${la},${ln}`;
const tglIso = (s) => tanggal(String(s || "").slice(0, 10));

const ambil = (u) => fetch(u, { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error(u); return r.json(); });
const lambat = {};
const lazy = (u) => (lambat[u] ??= ambil(u).catch((e) => { delete lambat[u]; throw e; }));

await mulaiHalaman();
const isi = $("isi");

let DATA, PROG;
try {
  const [p, g] = await Promise.all([ambil("/data/proyek.json"), ambil("/data/program.json")]);
  DATA = p; PROG = g;
} catch (e) {
  isi.innerHTML = `<div class="jm-kartu">${galatHtml("jaringan")}</div>`;
  isi.querySelector("[data-aksi=ulang]").addEventListener("click", () => location.reload());
  throw e;
}

/* ---------- bentuk baris ---------- */
/* nama dari Wikidata sering berbahasa Inggris ("Agam hydro"); pakai nama_lain berawalan PLT bila ada ("PLTA Agam") */
const namaId = (p) => (/^PLT/i.test(p.nama || "") ? p.nama : (p.nama_lain || []).find((x) => /^PLT[A-Za-z]*\s/.test(x) && !/power|plant/i.test(x)) || p.nama || "");
const SEMUA = DATA.baris.map((p) => {
  const k = (p.kapasitas || [])[0];
  const cods = (p.cod_target || []).map((x) => x.nilai).filter(Number.isFinite);
  const L = p.lokasi || {};
  const kab = Array.isArray(L.kabupaten_kota) ? L.kabupaten_kota.map((x) => x.nilai).join(", ") : "";
  const pemilik = ((p.pihak || {}).pemilik || []).map((x) => x.nilai).join(", ");
  const r = {
    p, id: p.id, nama: namaId(p), tek: p.teknologi || "", st: ((p.status || [])[0] || {}).nilai || TIDAK,
    prog: p.program_ids || p.programs || (p.program ? [p.program] : []), prov: L.provinsi || "", kab, pemilik,
    kap: k && Number.isFinite(k.nilai) ? k.nilai : null, sat: (k && k.satuan) || "MW",
    cod: cods.length ? Math.min(...cods) : null, ada: Number.isFinite(L.lat) && Number.isFinite(L.lng),
  };
  r.telat = r.cod !== null && r.cod < TAHUN && r.st !== "beroperasi" ? TAHUN - r.cod : 0;
  r.cari = [r.nama, pemilik, r.prov, kab, ...(p.nama_lain || [])].join(" ").toLowerCase();
  return r;
});
const PER_ID = new Map(SEMUA.map((r) => [r.id, r]));
const TEKS = [...new Set(SEMUA.map((r) => r.tek).filter(Boolean))].sort();
const PROVS = [...new Set(SEMUA.map((r) => r.prov).filter(Boolean))].sort();
const warnaTek = (k) => `jm-pj-t-${TEK_WARNA[k] ? k : "lain"}`;
const jumlahMW = (rows) => rows.reduce((a, r) => a + (r.kap ?? 0), 0);
const denganKap = (rows) => rows.filter((r) => r.kap !== null).length;
const hitung = (rows, f) => { const m = {}; for (const r of rows) for (const k of [].concat(f(r))) m[k] = (m[k] || 0) + 1; return m; };

const pil = (teks, jenis) => `<span class="jm-pil${jenis ? " jm-pil-" + jenis : ""}">${esc(teks)}</span>`;
const pilSt = (st) => pilStatus(st);
const progNama = (id) => (PROG.baris.find((x) => x.id === id) || {}).nama || id;
const presisiTeks = (r) => (r.p.lokasi && r.ada ? t("pj.presisi." + (["titik_persis", "kabupaten", "provinsi"].includes(r.p.lokasi.presisi) ? r.p.lokasi.presisi : "provinsi")) : t("pj.presisi.tak"));
const mapsTbl = (r) => r.ada
  ? `<a class="jm-pj-maps" href="${mapsUrl(r.p.lokasi.lat, r.p.lokasi.lng)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(t("pj.maps"))}: ${esc(r.nama)}" title="${esc(t("pj.maps") + " (" + presisiTeks(r) + ")")}">${PIN}</a>`
  : `<span class="jm-bantu">-</span>`;
const sumberRingkas = (r) => {
  const s = (r.p.sumber || [])[0];
  if (!s) return "-";
  const nama = esc(s.dokumen || s.jenis), tgl = esc(tanggal(s.tanggal)), u = urlAman(s.url);
  return sumberHtml(`${u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${nama}</a>` : nama}, ${tgl}${s.lisensi ? `<br>${esc(s.lisensi)}` : ""}`);
};

/* ---------- kepala seksi bersama (exHtml). Isi tetap dari HTML; kepala dibangun ulang tiap bahasa/filter ---------- */
const hl = (n) => `<span class="jm-hl">${esc(n)}</span>`;
const estPil = () => `<span class="jm-pil jm-pil-est">${esc(t("pj.est"))}</span>`;
function ex(id, d) {
  const m = $(id);
  if (!m.dataset.siap) {
    const isi = m.querySelector(".jm-pj-isi"), tmp = document.createElement("div");
    tmp.innerHTML = exHtml({ ...d, isiHtml: "" });
    m.replaceChildren(tmp.firstElementChild);
    m.querySelector(".jm-ex-bd").append(...isi.childNodes);
    m.dataset.siap = "1";
  }
  const tmp = document.createElement("div");
  tmp.innerHTML = exHtml({ ...d, isiHtml: "" });
  m.querySelector(".jm-ex-hd").replaceWith(tmp.querySelector(".jm-ex-hd"));
}
function kepalaSeksi() {
  const n = SEMUA.length, st = hitung(SEMUA, (r) => r.st), dok = dokSumber();
  ex("exGb", { ikon: "analisis", topik: t("pj.ex.gb"), judulHtml: `${hl(num(n))} ${esc(t("pj.ex.gb.1"))} ${hl(num(st.beroperasi || 0))} ${esc(t("pj.ex.gb.2"))}`, subHtml: esc(t("pj.ex.gb.s")), aksiHtml: aksiHtml() + sumberHtml(`${esc(t("pj.sumber", { tgl: tanggal(DATA.dibangun_pada, { gaya: "panjang" }), dok }))}<br>${esc(t("pj.sumber.rinci"))}`) });
  ex("exPeta", { ikon: "peta", topik: t("pj.ex.peta"), judulHtml: `${hl(num(SEMUA.filter((r) => r.ada).length))} ${esc(t("pj.ex.peta.j", { total: num(n) }))}`, subHtml: esc(t("pj.ex.peta.s")), aksiHtml: aksiHtml() });
  ex("exProg", { ikon: "topik", topik: t("pj.ex.prog"), judulHtml: `${hl(num(PROG.baris.length))} ${esc(t("pj.ex.prog.j"))}`, subHtml: esc(t("pj.ex.prog.s", { n: num(PROG.baris.filter((g) => g.jumlah_proyek).length) })), aksiHtml: aksiHtml() });
  kepalaTabel();
}
function kepalaTabel() {
  const mw = jumlahMW(tampil), telat = tampil.filter((r) => r.telat).length, cr = hitung(tampil, (r) => r.st);
  ex("exTahap", { ikon: "status", topik: t("pj.ex.tahap"), judulHtml: `${hl(num(cr.konstruksi || 0))} ${esc(t("pj.ex.tahap.j"))}`, subHtml: esc(t("pj.ex.tahap.s")), aksiHtml: aksiHtml() });
  ex("exTelat", { ikon: "kalender", topik: t("pj.ex.telat"), judulHtml: `${hl(num(telat))} ${esc(t("pj.ex.telat.j"))}`, subHtml: esc(t("pj.telat.ket", { tahun: TAHUN })), aksiHtml: aksiHtml({ csv: true }) });
  ex("exDaftar", { ikon: "tabel", topik: t("pj.ex.daftar"), judulHtml: `${hl(num(tampil.length))} ${esc(t("pj.ex.daftar.j"))}`, subHtml: `${esc(t("pj.ex.daftar.s", { mw: num(mw, 0) }))} ${estPil()}`, aksiHtml: aksiHtml({ csv: true }) });
}
const dokSumber = () => [...new Set(SEMUA.flatMap((r) => (r.p.sumber || []).map((s) => String(s.jenis || s.dokumen).toUpperCase())))].slice(0, 4).join(", ");

/* ---------- hero: kartu KPI, batang status, batang program ---------- */
const progNamaPendek = (id) => (ada("pj.pn." + id) ? t("pj.pn." + id) : progNama(id));
const IKON_K = ["proyek", "analisis", "status", "jenis", "kalender"];
function kpi(i, lab, nilai, satuan, ctx, estimasi) {
  return `<div class="jm-kpi jm-w${i + 1}"><div class="jm-kpi-ik">${ikon(IKON_K[i], 22)}</div><div class="jm-kpi-lab"><span>${esc(lab)}</span>${estimasi ? `<span class="jm-pil jm-pil-est">${esc(t("pj.est"))}</span>` : ""}</div><div class="jm-kpi-n"><b>${esc(nilai)}</b>${satuan ? `<small>${esc(satuan)}</small>` : ""}</div><div class="jm-kpi-ctx">${esc(ctx)}</div></div>`;
}
function gambarHero() {
  const n = SEMUA.length, mw = jumlahMW(SEMUA), nk = denganKap(SEMUA), st = hitung(SEMUA, (r) => r.st), telat = SEMUA.filter((r) => r.telat).length;
  const persen = (x) => t("pj.k.persen", { n: num(((x || 0) / n) * 100, 0) });
  const [kv, ks] = mw >= 10000 ? [num(mw / 1000, 1), "GW"] : [num(mw, 0), "MW"];
  $("pjAngka").innerHTML = kpi(0, t("pj.k.total"), num(n), "", t("pj.k.lokasi", { n: num(SEMUA.filter((r) => r.ada).length) }))
    + kpi(1, t("pj.k.kap"), kv, ks, t("pj.k.penyebut", { n: num(nk), total: num(n) }), true)
    + kpi(2, labSt("konstruksi"), num(st.konstruksi || 0), "", persen(st.konstruksi))
    + kpi(3, labSt("beroperasi"), num(st.beroperasi || 0), "", persen(st.beroperasi))
    + kpi(4, t("pj.k.telat"), num(telat), "", t("pj.k.telat.ket", { tahun: TAHUN }));
  segarHero(); kepalaSeksi();
}
function segarHero() {
  const n = SEMUA.length, st = hitung(SEMUA, (r) => r.st), ada1 = URUT_ST.concat(TIDAK).filter((k) => st[k]);
  $("pjStatus").innerHTML = `<div class="jm-pj-tumpuk jm-pj-tumpuk-b" role="group" aria-label="${esc(t("pj.stat.judul"))}">${ada1.map((k) => `<button type="button" class="jm-pj-seg jm-pj-s-${k}" data-st="${k}" data-w="${(st[k] / n) * 100}" aria-pressed="${F.st === k}" title="${esc(labSt(k) + ": " + st[k])}" aria-label="${esc(labSt(k) + ": " + st[k])}"></button>`).join("")}</div>
    <ul class="jm-pj-leg jm-pj-leg-b">${ada1.map((k) => `<li><button type="button" data-st="${k}" aria-pressed="${F.st === k}">${pilStatus(k)}<b>${num(st[k])}</b></button></li>`).join("")}</ul>`;
  for (const i of $("pjStatus").querySelectorAll("[data-w]")) i.style.width = i.dataset.w + "%";
  const pc = hitung(SEMUA, (r) => r.prog), baris = PROG.baris.map((g) => [g.id, pc[g.id] || 0]).sort((a, b) => b[1] - a[1]), maks = Math.max(1, baris[0][1]);
  /* batang pakai akar supaya program kecil tidak jadi serpihan 2% di samping satu program raksasa */
  $("pjProgBar").innerHTML = `<ul class="jm-pj-pbar">${baris.map(([id, c]) => `<li><button type="button" data-pg="${esc(id)}" aria-pressed="${F.prog === id}"><span class="jm-pj-pbar-n">${esc(progNamaPendek(id))}</span><b>${num(c)}</b><span class="jm-pj-pbar-t"><i data-w="${c ? Math.max(6, Math.sqrt(c / maks) * 100) : 0}"></i></span></button></li>`).join("")}</ul>`;
  for (const i of $("pjProgBar").querySelectorAll("i")) i.style.width = i.dataset.w + "%";
}
function ubahFilter(k, v) {
  F[k] = F[k] === v ? "" : v;
  $({ st: "fst", prog: "fprog" }[k]).value = F[k];
  segarHero(); terapkan();
}
$("pjStatus").addEventListener("click", (e) => { const b = e.target.closest("[data-st]"); if (b) ubahFilter("st", b.dataset.st); });
$("pjProgBar").addEventListener("click", (e) => { const b = e.target.closest("[data-pg]"); if (b) ubahFilter("prog", b.dataset.pg); });

/* ---------- filter ---------- */
const F = { q: "", tek: "", st: "", prog: "", prov: "" };
const cocok = (r, lewati) => (!F.q || r.cari.includes(F.q)) && (lewati === "tek" || !F.tek || r.tek === F.tek) && (!F.st || r.st === F.st) && (!F.prog || r.prog.includes(F.prog)) && (!F.prov || r.prov === F.prov);
/* tautan dalam: /proyek?teknologi=&program=&status=&prov= (kartu teknologi beranda) */
const QS = new URLSearchParams(location.search), DARI_URL = ["teknologi", "program", "status", "prov"].some((k) => QS.get(k));
if (TEKS.includes(QS.get("teknologi"))) F.tek = QS.get("teknologi");
if (PROG.baris.some((g) => g.id === QS.get("program"))) F.prog = QS.get("program");
if ([...URUT_ST, TIDAK].includes(QS.get("status"))) F.st = QS.get("status");
if (PROVS.includes(QS.get("prov"))) F.prov = QS.get("prov");
const sinkronUrl = () => {
  const q = new URLSearchParams();
  for (const [k, p] of [["tek", "teknologi"], ["prog", "program"], ["st", "status"], ["prov", "prov"]]) if (F[k]) q.set(p, F[k]);
  history.replaceState(null, "", location.pathname + (q.size ? "?" + q : "") + location.hash);
};
let tampil = SEMUA, versi = 0;

function isiPilihan() {
  const opsi = (sel, daftar, kunci, nm) => {
    const cur = F[kunci];
    $(sel).innerHTML = `<option value="">${esc(t(nm))}</option>` + daftar.map(([v, l, n]) => `<option value="${esc(v)}">${esc(l)} (${num(n)})</option>`).join("");
    $(sel).value = cur;
  };
  const ct = hitung(SEMUA, (r) => r.tek), cs = hitung(SEMUA, (r) => r.st), cp = hitung(SEMUA, (r) => r.prog), cv = hitung(SEMUA, (r) => r.prov || "_");
  opsi("ftek", TEKS.map((k) => [k, labTek(k), ct[k]]), "tek", "pj.f.tek");
  opsi("fst", [...URUT_ST, TIDAK].filter((k) => cs[k]).map((k) => [k, labSt(k), cs[k]]), "st", "pj.f.status");
  opsi("fprog", PROG.baris.map((g) => [g.id, g.nama, cp[g.id] || 0]), "prog", "pj.f.program");
  opsi("fprov", PROVS.map((k) => [k, k, cv[k]]), "prov", "pj.f.provinsi");
}

function terapkan() {
  const v = ++versi;
  tampil = SEMUA.filter(cocok);
  sinkronUrl();
  const ada = Object.values(F).some(Boolean);
  $("freset").hidden = !ada;
  $("pjHasil").textContent = t("pj.hasil", { n: num(tampil.length), total: num(SEMUA.length), mw: num(jumlahMW(tampil), 0) });
  for (const x of document.querySelectorAll("#pjStatus [data-st]")) x.setAttribute("aria-pressed", String(x.dataset.st === F.st));
  for (const x of document.querySelectorAll("#pjProgBar [data-pg]")) x.setAttribute("aria-pressed", String(x.dataset.pg === F.prog));
  nanti(() => { if (v !== versi) return; kepalaTabel(); gambarCorong(); gambarLegenda(); kePeta(); PN.n = 40; gambarPanel(); TT.n = BATAS; TD.n = BATAS; gambarTelat(); gambarDaftar(); });
}

/* ---------- corong ---------- */
function gambarCorong() {
  const st = hitung(tampil, (r) => r.st), mw = {};
  for (const r of tampil) mw[r.st] = (mw[r.st] || 0) + (r.kap ?? 0);
  const maks = Math.max(1, ...TAHAP.map((k) => st[k] || 0));
  $("pjCorong").innerHTML = `<ol class="jm-pj-corong">${TAHAP.map((k) => `<li><span class="jm-pj-c-l">${esc(labSt(k))}</span><span class="jm-pj-bar"><i data-w="${((st[k] || 0) / maks) * 100}"></i></span><b>${num(st[k] || 0)}</b><small>${st[k] ? num(mw[k] || 0, 0) + " MW" : "-"}</small></li>`).join("")}</ol>` +
    (st[TIDAK] ? `<p class="jm-bantu">${esc(t("pj.corong.tak", { n: num(st[TIDAK]) }))}</p>` : "") + `<p class="jm-bantu">${esc(t("pj.corong.cara"))}</p>`;
  for (const i of $("pjCorong").querySelectorAll("i")) i.style.width = i.dataset.w + "%";
}

/* ---------- tabel (urut + paging) ---------- */
const selNama = (r) => {
  const ket = [...r.prog.map(progNama), r.pemilik].filter(Boolean).join(", ");
  return `<span class="jm-id"><b><a class="jm-pj-nm" href="#${esc(r.id)}">${esc(r.nama)}</a></b>${r.p.nama_perlu_tinjau ? `<span class="jm-pj-tinjau">${esc(t("pj.tinjau"))}</span>` : ""}${ket ? `<small>${esc(ket)}</small>` : ""}</span>`;
};
const selTek = (r) => pilTek(r.tek);
const selKap = (r) => (r.kap === null ? "-" : `<span>${num(r.kap)} <span class="jm-pj-sat">${esc(r.sat)}</span></span>`);
const selProv = (r) => esc(r.prov || "-");
const selSt = (r) => pilSt(r.st);
const selCod = (r) => (r.cod === null ? "-" : r.cod);
const selTelat = (r) => `<span class="jm-pj-telat jm-pj-telat-${r.telat >= 3 ? "b" : "w"}"><b>${esc(t("pj.telat.singkat", { n: r.telat }))}</b><span class="jm-pj-telat-t"><i data-w="${Math.min(r.telat, 5) * 20}"></i></span></span>`;
const kolomDasar = [
  ["nama", "pj.c.nama", selNama, ""], ["tek", "pj.c.tek", selTek, "jm-tengah"], ["kap", "pj.c.kap", selKap, "jm-num"],
  ["prov", "pj.c.prov", selProv, "jm-tengah"], ["st", "pj.c.status", selSt, "jm-tengah"], ["cod", "pj.c.cod", selCod, "jm-tengah"],
];
const kolomPeta = [null, "pj.c.maps", mapsTbl, "jm-pj-aksi"];
const kolomDaftar = [...kolomDasar, [null, "pj.c.sumber", sumberRingkas, "jm-tengah jm-pj-src"], kolomPeta];
const kolomTelat = [...kolomDasar, ["telat", "pj.c.telat", selTelat, "jm-tengah"], kolomPeta];
const TD = { el: "pjDaftar", kolom: kolomDaftar, k: "nama", arah: 1, n: BATAS, baris: () => tampil };
const TT = { el: "pjTelat", kolom: kolomTelat, k: "telat", arah: -1, n: BATAS, baris: () => tampil.filter((r) => r.telat) };
const bandingkan = (k, a) => (x, y) => {
  const u = x[k], v = y[k];
  if (u === v) return x.nama.localeCompare(y.nama);
  if (u === null || u === "" || u === undefined) return 1;
  if (v === null || v === "" || v === undefined) return -1;
  return (typeof u === "number" ? u - v : String(u).localeCompare(String(v))) * a;
};

function gambarTabel(T, fokus) {
  const rows = T.baris().slice().sort(bandingkan(T.k, T.arah)), el = $(T.el);
  if (!rows.length) { el.innerHTML = `<div class="jm-kosong">${ikon("info", 32)}<p>${esc(t(T === TT ? "pj.telat.kosong" : "jm.kosong.cocok"))}</p></div>`; return; }
  const kepala = T.kolom.map(([k, kt, , kls]) => k
    ? `<th scope="col" aria-sort="${T.k === k ? (T.arah > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-u="${k}">${esc(t(kt))}</button></th>`
    : `<th scope="col" class="${kls === "jm-pj-aksi" ? "jm-pj-aksi" : ""}">${kls === "jm-pj-aksi" ? `<span role="img" aria-label="${esc(t(kt))}" title="${esc(t(kt))}">${PIN}</span>` : esc(t(kt))}</th>`).join("");
  const badan = rows.slice(0, T.n).map((r) => `<tr>${T.kolom.map(([, kt, f, kls]) => `<td data-label="${esc(t(kt))}"${kls ? ` class="${kls}"` : ""}>${f(r)}</td>`).join("")}</tr>`).join("");
  el.innerHTML = `<div class="jm-gulir"><table class="jm-tabel jm-pj-tetap"><thead><tr>${kepala}</tr></thead><tbody>${badan}</tbody></table></div>
    <div class="jm-hal"><span>${esc(t("pj.tampil", { n: num(Math.min(T.n, rows.length)), total: num(rows.length) }))}</span>${rows.length > T.n ? `<button type="button" class="jm-tbl" data-lagi="1">${esc(t("pj.lagi"))}</button>` : ""}</div>`;
  for (const i of el.querySelectorAll("i[data-w]")) i.style.width = i.dataset.w + "%";
  if (fokus) { const b = el.querySelector(fokus); if (b) b.focus(); }
}
const gambarDaftar = () => gambarTabel(TD);
const gambarTelat = () => {
  gambarTabel(TT);
};
for (const T of [TD, TT]) {
  $(T.el).addEventListener("click", (e) => {
    const u = e.target.closest("[data-u]"), l = e.target.closest("[data-lagi]");
    if (u) {
      const k = u.dataset.u;
      T.arah = T.k === k ? -T.arah : (k === "kap" || k === "telat" ? -1 : 1); T.k = k;
      for (const th of $(T.el).querySelectorAll("th[aria-sort]")) th.setAttribute("aria-sort", th.contains(u) ? (T.arah > 0 ? "ascending" : "descending") : "none");
      nanti(() => gambarTabel(T, `[data-u="${k}"]`));
    } else if (l) { T.n += BATAS; l.setAttribute("aria-busy", "true"); nanti(() => gambarTabel(T)); }
  });
}

/* CSV seksi tabel: semua baris (bukan hanya yang tampil); aksi_ex.js memanggil jm:csv lalu memakai d.baris */
for (const [id, T] of [["exTelat", TT], ["exDaftar", TD]]) {
  $(id).addEventListener("jm:csv", (e) => {
    const rows = T.baris().slice().sort(bandingkan(T.k, T.arah));
    e.detail.baris = [[t("pj.c.nama"), t("pj.c.tek"), t("pj.c.kap"), t("pj.c.satuan"), t("pj.c.prov"), t("pj.c.status"), t("pj.c.cod"), t("pj.c.telat"), t("pj.c.sumber")],
      ...rows.map((r) => [r.nama, r.tek ? labTek(r.tek) : "", r.kap ?? "", r.kap === null ? "" : r.sat, r.prov, labSt(r.st), r.cod ?? "", r.telat || "", ((r.p.sumber || [])[0] || {}).url || ""])];
  }, true);
}

/* ---------- peta (gaya direktori: kluster satu warna merek berangka, titik per teknologi mulai zoom 8, kartu popup) ---------- */
let peta = null, petaSiap = false, popup = null, idLabel = null;
const HIDE = new Set(), PRES = { pasti: true, kira: true };
let geoProv = null, geoLuar = null;
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "gray";
const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
const gaya = () => "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron");
/* poligon kasar wilayah Indonesia: label tempat di luarnya (Malaysia, Brunei, Filipina, Timor Leste, PNG) disembunyikan */
const INDONESIA = { type: "MultiPolygon", coordinates: [
  [[[94.8, 6.2], [97.8, 5.9], [100.8, 2.6], [102.6, 1.9], [104.5, 0.5], [106, -3], [106, -5], [124.9, -8], [124.9, -11.5], [105, -11.5], [94.5, -6.5], [94.8, 6.2]]],
  [[[108.8, 2.1], [111, 1.2], [114.5, 1.7], [115.8, 3.9], [117.8, 4.3], [119, 1], [119, -4.5], [108, -4.5], [108, 0], [108.8, 2.1]]],
  [[[118.5, 2.5], [125, 5], [128, 4.5], [135, 1], [141, 0], [141, -9.5], [128.5, -9.5], [128.5, -7.3], [125, -7.5], [119, -6], [118.5, 2.5]]],
] };
const SEMBUNYI = /^(poi|housenumber|aerodrome_label|transportation_name)$/;
function rapikanPeta(peta) {
  idLabel = null;
  for (const ly of peta.getStyle().layers || []) {
    if (ly.type !== "symbol") continue;
    if (!idLabel) idLabel = ly.id;
    const sl = ly["source-layer"];
    if (SEMBUNYI.test(sl) || /shield|road_number/i.test(ly.id)) { peta.setLayoutProperty(ly.id, "visibility", "none"); continue; }
    if (sl === "place" || sl === "water_name") peta.setLayoutProperty(ly.id, "text-field", ["coalesce", ["get", "name:id"], ["get", "name:latin"], ["get", "name"]]);
    if (sl === "place") peta.setFilter(ly.id, ly.filter ? ["all", ly.filter, ["within", INDONESIA]] : ["within", INDONESIA]);
  }
}
const fiturSemua = () => {
  const w = {}; for (const k of TEKS) w[k] = warna(TEK_WARNA[k] || "--ink2");
  return { type: "FeatureCollection", features: tampil.filter((r) => r.ada && !HIDE.has(r.tek) && (r.p.lokasi.presisi === "titik_persis" ? PRES.pasti : PRES.kira)).map((r) => ({ type: "Feature", properties: { id: r.id, tek: r.tek, warna: w[r.tek] || warna("--ink2"), op: r.p.lokasi.presisi === "titik_persis" ? 1 : 0.6 }, geometry: { type: "Point", coordinates: [r.p.lokasi.lng, r.p.lokasi.lat] } })) };
};
function pasangLapisan() {
  const lingkar = warna("--paper");
  for (const m of MARC.values()) m.remove();
  MARC.clear();
  const sum = {}; for (const k of TEKS) sum[k] = ["+", ["case", ["==", ["get", "tek"], k], 1, 0]];
  peta.addSource("pts", { type: "geojson", data: fiturSemua(), cluster: true, clusterRadius: 44, clusterMaxZoom: 7, clusterProperties: sum });
  peta.addLayer({ id: "pts-sel", type: "circle", source: "pts", filter: ["==", ["get", "id"], ""], paint: { "circle-radius": 14, "circle-color": warna("--sorot"), "circle-opacity": 0.55, "circle-stroke-color": warna("--sorot"), "circle-stroke-width": 2 } });
  peta.addLayer({ id: "pts-t", type: "circle", source: "pts", filter: ["!", ["has", "point_count"]], paint: { "circle-color": ["get", "warna"], "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 4, 8, 7, 12, 9], "circle-opacity": ["get", "op"], "circle-stroke-color": lingkar, "circle-stroke-width": 1.5 } });
}
/* batas Indonesia: garis provinsi tipis dan peredam di luar wilayah (negara lain tampak pudar) */
function pasangBatas() {
  /* peredam: dunia dikurangi daratan, sudah dilarutkan jadi satu bentuk bersih (geo/luar-indonesia.json); polygon berlubang 38 provinsi mentah membuat serpihan segitiga */
  geoLuar ??= ambil("/geo/luar-indonesia.json").catch(() => null);
  Promise.all([(geoProv ??= ambil("/geo/provinsi.json").catch(() => null)), geoLuar]).then(([g, luar]) => {
    if (!g || !peta || !peta.getStyle() || peta.getSource("prov")) return;
    peta.addSource("prov", { type: "geojson", data: g });
    if (luar) {
      peta.addSource("luar", { type: "geojson", data: luar });
      peta.addLayer({ id: "luar-redam", type: "fill", source: "luar", paint: { "fill-color": warna("--paper"), "fill-opacity": 0.72 } }, idLabel || "pts-t");
    }
    peta.addLayer({ id: "prov-garis", type: "line", source: "prov", paint: { "line-color": warna("--accent-isi"), "line-opacity": 0.55, "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.6, 9, 1.6] } }, "pts-t");
  });
}
/* klaster donat: tiap klaster = lingkaran cincin berwarna per teknologi, angka total di tengah */
const MARC = new Map();
function donatSvg(pr, tot, uk) {
  const r = uk / 2, tebal = Math.max(7, uk * 0.2), rr = r - tebal / 2, K = 2 * Math.PI * rr;
  let off = 0, seg = "";
  for (const k of TEKS) {
    const n = pr[k] || 0; if (!n) continue;
    const pj = (n / tot) * K;
    seg += `<circle r="${rr}" cx="${r}" cy="${r}" fill="none" stroke="${warna(TEK_WARNA[k] || "--ink2")}" stroke-width="${tebal}" stroke-dasharray="${pj} ${K - pj}" stroke-dashoffset="${-off}" transform="rotate(-90 ${r} ${r})"/>`;
    off += pj;
  }
  return `<svg width="${uk}" height="${uk}" viewBox="0 0 ${uk} ${uk}" aria-hidden="true" focusable="false"><circle cx="${r}" cy="${r}" r="${r}" fill="${warna("--card")}"/>${seg}<circle cx="${r}" cy="${r}" r="${r - tebal}" fill="${warna("--card")}"/></svg>`;
}
function ringkasKlaster(pr) {
  return TEKS.filter((k) => pr[k]).sort((a, b) => pr[b] - pr[a]).map((k) => `<span class="jm-pj-tipbaris">${pilTek(k)}<b>${num(pr[k])}</b></span>`).join("");
}
function donatEl(f) {
  const pr = f.properties, tot = pr.point_count, uk = Math.round(Math.min(76, 34 + Math.sqrt(tot) * 4.2));
  const el = document.createElement("button");
  el.type = "button"; el.className = "jm-pj-donat"; el.setAttribute("aria-label", t("pj.tip.kluster", { n: num(tot) }));
  el.innerHTML = donatSvg(pr, tot, uk) + `<b>${esc(pr.point_count_abbreviated)}</b>`;
  el.addEventListener("click", (e) => { e.stopPropagation(); tipPeta(null, ""); peta.getSource("pts").getClusterExpansionZoom(pr.cluster_id).then((z) => peta.easeTo({ center: f.geometry.coordinates, zoom: z + 0.5 })).catch(() => {}); });
  const tip = $("pjTip");
  el.addEventListener("mouseenter", () => {
    const box = $("pjPeta").getBoundingClientRect(), b = el.getBoundingClientRect();
    tip.innerHTML = `<b>${esc(t("pj.tip.kluster", { n: num(tot) }))}</b>${ringkasKlaster(pr)}`; tip.hidden = false;
    tip.style.left = Math.min(Math.max(8, b.left - box.left + b.width / 2 - tip.offsetWidth / 2), box.width - tip.offsetWidth - 8) + "px";
    tip.style.top = Math.max(8, b.top - box.top - tip.offsetHeight - 6) + "px";
  });
  el.addEventListener("mouseleave", () => { tip.hidden = true; });
  return el;
}
function perbaruiDonat() {
  if (!peta || !petaSiap || !peta.getSource("pts") || !peta.isSourceLoaded("pts")) return;
  const baru = new Map();
  for (const f of peta.querySourceFeatures("pts", { filter: ["has", "point_count"] })) {
    const pr = f.properties, kunci = pr.cluster_id + ":" + pr.point_count + ":" + TEKS.map((k) => pr[k] || 0).join(".");
    if (!baru.has(pr.cluster_id)) baru.set(pr.cluster_id, [kunci, f]);
  }
  for (const [id, m] of MARC) if (!baru.has(id) || baru.get(id)[0] !== m.kunci) { m.remove(); MARC.delete(id); }
  for (const [id, [kunci, f]] of baru) if (!MARC.has(id)) {
    const m = new maplibregl.Marker({ element: donatEl(f) }).setLngLat(f.geometry.coordinates).addTo(peta);
    m.kunci = kunci; MARC.set(id, m);
  }
}
function tipPeta(e, html) {
  const el = $("pjTip");
  if (!html) { el.hidden = true; return; }
  el.innerHTML = html; el.hidden = false;
  const box = $("pjPeta").getBoundingClientRect(), x = e.originalEvent.clientX - box.left, y = e.originalEvent.clientY - box.top;
  el.style.left = Math.min(Math.max(8, x + 14), box.width - el.offsetWidth - 8) + "px";
  el.style.top = Math.max(8, y - el.offsetHeight - 12) + "px";
}
function kartuPopup(r) {
  const L = r.p.lokasi, d = document.createElement("div");
  d.className = "jm-pj-pk-kartu";
  d.innerHTML = `<b>${esc(r.nama)}</b><div class="jm-pj-pk-baris">${selTek(r)}${pilSt(r.st)}</div>
    <dl><div><dt>${esc(t("pj.c.kap"))}</dt><dd>${selKap(r)}</dd></div><div><dt>${esc(t("pj.c.prov"))}</dt><dd>${esc(r.prov || "-")}</dd></div><div><dt>${esc(t("pj.c.cod"))}</dt><dd>${selCod(r)}</dd></div></dl>
    <p class="jm-bantu">${esc(presisiTeks(r))}</p>
    <div class="jm-pj-pk-aksi"><a class="jm-tbl jm-tbl-utama jm-tbl-kecil" href="#${esc(r.id)}">${esc(t("pj.pop.profil"))}</a><a class="jm-tbl jm-tbl-kecil" href="${mapsUrl(L.lat, L.lng)}" target="_blank" rel="noopener noreferrer">${PIN}<span>${esc(t("pj.maps.pendek"))}</span></a></div>`;
  return d;
}
function sorotPeta(r) {
  if (!peta || !petaSiap || !r || !r.ada) return;
  if (popup) popup.remove();
  const L = r.p.lokasi;
  peta.setFilter("pts-sel", ["==", ["get", "id"], r.id]);
  peta.flyTo({ center: [L.lng, L.lat], zoom: Math.max(peta.getZoom(), 8.5), duration: 600, offset: [0, 120] });
  popup = new maplibregl.Popup({ closeButton: true, closeOnClick: false, focusAfterOpen: false, offset: 14, maxWidth: "300px", className: "jm-pj-pop" }).setLngLat([L.lng, L.lat]).setDOMContent(kartuPopup(r)).addTo(peta);
  popup.on("close", () => { if (peta && petaSiap) peta.setFilter("pts-sel", ["==", ["get", "id"], ""]); });
}
function bukaPeta() {
  muatMapLibre().then(() => {
    peta = new maplibregl.Map({ container: "pjPeta", style: gaya(), bounds: [[94, -11.5], [141.5, 6.5]], fitBoundsOptions: { padding: { top: 56, bottom: 36, left: $("pjLapis").open && innerWidth >= 1000 ? 284 : 12, right: $("pjDrawer").open && innerWidth >= 1000 ? 352 : 12 } }, minZoom: 3, maxZoom: 16, dragRotate: false, pitchWithRotate: false, attributionControl: { compact: true } });
    peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    peta.on("style.load", () => { rapikanPeta(peta); pasangLapisan(); pasangBatas(); petaSiap = true; });
    peta.addControl(new maplibregl.ScaleControl({ unit: "metric", maxWidth: 90 }), "bottom-left");
    new ResizeObserver(() => peta.resize()).observe($("pjPeta"));
    peta.on("click", "pts-t", (e) => sorotPeta(PER_ID.get(e.features[0].properties.id)));
    for (const l of ["pts-t"]) {
      peta.on("mouseenter", l, () => { peta.getCanvas().style.cursor = "pointer"; });
      peta.on("mouseleave", l, () => { peta.getCanvas().style.cursor = ""; tipPeta(null, ""); });
    }
    peta.on("mousemove", "pts-t", (e) => {
      const r = PER_ID.get(e.features[0].properties.id);
      if (r) tipPeta(e, `<b>${esc(r.nama)}</b><span>${selTek(r)} ${esc(r.kap === null ? "" : num(r.kap) + " " + r.sat)}</span><span>${esc(labSt(r.st))}</span>`);
    });
    for (const ev of ["sourcedata", "moveend", "idle"]) peta.on(ev, perbaruiDonat);
    peta.on("movestart", () => tipPeta(null, ""));
    const ganti = () => { if (peta) { petaSiap = false; peta.setStyle(gaya()); } };
    new MutationObserver(ganti).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", ganti);
    peta.once("idle", () => { kePeta(); const a = $("pjPeta").querySelector(".maplibregl-ctrl-attrib"); if (a) { a.classList.remove("maplibregl-compact-show"); a.removeAttribute("open"); } });
  }).catch((e) => { console.error("peta", e); $("pjPeta").innerHTML = `<div class="jm-galat" role="alert"><p>${esc(t("pj.peta.galat"))}</p></div>`; });
}
function kePeta(fit = true) {
  const n = tampil.filter((r) => r.ada), pasti = n.filter((r) => r.p.lokasi.presisi === "titik_persis").length;
  if ($("pjPresisi")) $("pjPresisi").textContent = t("pj.peta.tempat", { n: num(n.length), m: num(tampil.length), kira: num(n.length - pasti) });
  if (!peta || !petaSiap) return;
  if (popup) { popup.remove(); popup = null; }
  const s = peta.getSource("pts"); if (s) s.setData(fiturSemua());
  if (fit && n.length && Object.values(F).some(Boolean)) {
    const b = new maplibregl.LngLatBounds();
    for (const r of n) b.extend([r.p.lokasi.lng, r.p.lokasi.lat]);
    peta.fitBounds(b, { padding: 50, maxZoom: 8, duration: 400 });
  }
}
function gambarLegenda() {
  const c = hitung(tampil, (r) => r.tek), loc = tampil.filter((r) => r.ada), pasti = loc.filter((r) => r.p.lokasi.presisi === "titik_persis").length;
  $("pjLegenda").innerHTML = `<p class="jm-pj-lapis-j">${esc(t("pj.lapis.tek"))}</p><ul class="jm-pj-lap">${TEKS.filter((k) => c[k]).map((k) => `<li><button type="button" aria-pressed="${!HIDE.has(k)}" data-tek="${esc(k)}">${pilTek(k)}<b>${num(c[k])}</b></button></li>`).join("")}</ul>
    <p class="jm-pj-lapis-j">${esc(t("pj.lapis.presisi"))}</p><ul class="jm-pj-lap"><li><button type="button" aria-pressed="${PRES.pasti}" data-pr="pasti"><span>${esc(t("pj.presisi.titik_persis"))}</span><b>${num(pasti)}</b></button></li><li><button type="button" aria-pressed="${PRES.kira}" data-pr="kira"><span>${esc(t("pj.presisi.kira"))}</span><b>${num(loc.length - pasti)}</b></button></li></ul>
    <p class="jm-pj-pilpeta" id="pjPresisi" role="status"></p>`;
}
$("pjLegenda").addEventListener("click", (e) => {
  const b = e.target.closest("[data-tek],[data-pr]");
  if (!b) return;
  if (b.dataset.tek) HIDE.has(b.dataset.tek) ? HIDE.delete(b.dataset.tek) : HIDE.add(b.dataset.tek);
  else PRES[b.dataset.pr] = !PRES[b.dataset.pr];
  b.setAttribute("aria-pressed", String(b.dataset.tek ? !HIDE.has(b.dataset.tek) : PRES[b.dataset.pr]));
  nanti(() => kePeta(false));
});
if (innerWidth < 1000) { $("pjLapis").open = false; $("pjDrawer").open = false; } else $("pjDrawer").open = true;

/* panel samping: daftar proyek yang tampil di peta; klik baris menerbangkan peta dan membuka kartu */
const PN = { n: 40 };
function gambarPanel() {
  const rows = tampil.slice().sort((a, b) => (b.kap ?? -1) - (a.kap ?? -1) || a.nama.localeCompare(b.nama)), el = $("pjPanel");
  if (!rows.length) { el.innerHTML = `<div class="jm-kosong">${ikon("info", 32)}<p>${esc(t("jm.kosong.cocok"))}</p></div>`; return; }
  el.innerHTML = `<ul class="jm-pj-pl">${rows.slice(0, PN.n).map((r) => `<li><button type="button" class="jm-pj-pr" data-id="${esc(r.id)}"><span class="jm-pj-pr-n">${esc(r.nama)}</span><span class="jm-pj-pr-m">${selTek(r)}<span>${selKap(r)}</span></span><small>${esc(r.prov || "-")}${r.ada ? "" : " (" + esc(t("pj.presisi.tak")) + ")"}</small></button></li>`).join("")}</ul>` +
    (rows.length > PN.n ? `<button type="button" class="jm-tbl jm-tbl-kecil" data-lagi="1">${esc(t("pj.lagi"))}</button>` : "");
}
$("pjPanel").addEventListener("click", (e) => {
  if (e.target.closest("[data-lagi]")) { PN.n += 40; nanti(gambarPanel); return; }
  const b = e.target.closest("[data-id]");
  if (!b) return;
  for (const x of $("pjPanel").querySelectorAll("[aria-current]")) x.removeAttribute("aria-current");
  b.setAttribute("aria-current", "true");
  const r = PER_ID.get(b.dataset.id);
  if (r.ada && peta && petaSiap) sorotPeta(r); else location.hash = r.id;
});

/* ---------- program ---------- */
const ST_BAR = ["rencana", "izin", "pendanaan", "konstruksi", "beroperasi", "dibatalkan", TIDAK];
const IMG = (f) => `/img/beranda/${f}.webp`;
const IMG_PROG = { "plts-100gw": IMG("surya-cirata"), wte: IMG("biomassa-bantargebang"), b50: IMG("bioenergi-sawit"), e20: IMG("bioetanol-tebu"), ruptl: IMG("hidro-saguling"), psn: IMG("panas-bumi-sibayak"), jetp: IMG("bayu-sidrap") };
const IMG_TEK = { surya: IMG("surya-cirata"), bayu: IMG("bayu-sidrap"), hidro: IMG("hidro-saguling"), "panas-bumi": IMG("panas-bumi-sibayak"), bioenergi: IMG("bioenergi-sawit"), "biomassa-sampah": IMG("biomassa-bantargebang"), nuklir: IMG("nuklir-siwabessy"), penyimpanan: IMG("penyimpanan-baterai") };
const TEK_PROG = { "plts-100gw": "surya", wte: "biomassa-sampah", b50: "bioenergi", e20: "bioenergi" };
const ikProg = (id) => ikonTek(TEK_PROG[id] || "jaringan");
/* satuan kapasitas program: MWp bila mayoritas proyeknya MWp (PLTS), selain itu MW */
const satuanProg = (rows) => { const c = hitung(rows.filter((r) => r.kap !== null), (r) => r.sat); return (c.MWp || 0) > (c.MW || 0) ? "MWp" : "MW"; };
const kapTeks = (mw, sat = "MW") => (mw >= 10000 ? `${num(mw / 1000, 1)} G${sat.slice(1)}` : `${num(mw, 0)} ${sat}`);
const legPil = (per) => `<ul class="jm-pj-leg">${ST_BAR.filter((k) => per[k]).map((k) => `<li>${pilStatus(k)}<b>${num(per[k])}</b></li>`).join("")}</ul>`;
const barTumpuk = (per, tot) => `<div class="jm-pj-tumpuk" role="img" aria-label="${esc(ST_BAR.filter((k) => per[k]).map((k) => labSt(k) + " " + per[k]).join(", "))}">${ST_BAR.filter((k) => per[k]).map((k) => `<i class="jm-pj-s-${k}" data-w="${(per[k] / tot) * 100}"></i>`).join("")}</div>`;
function tekBaris(id) {
  const c = hitung(SEMUA.filter((r) => r.prog.includes(id) && r.tek), (r) => r.tek), ks = Object.keys(c).sort((a, b) => c[b] - c[a]);
  return ks.length ? `<ul class="jm-pj-pk-tek">${ks.map((k) => `<li>${pilTek(k)}<b>${num(c[k])}</b></li>`).join("")}</ul>` : "";
}
function dasarKosong(g) {
  const al = (g.alokasi_bbn || []).find((x) => x.jenis === "alokasi" && x.total_kl);
  const nreg = (g.regulasi_ids || []).length;
  const baris = [al ? `<li><b>${esc(t("pj.alokasi", { tahun: al.tahun, n: num(al.total_kl / 1e6, 1) }))}</b><small>${esc(al.dasar_hukum)}</small></li>` : "",
    nreg ? `<li data-reg="${esc(g.id)}"><b>${esc(t("pj.dasar"))}</b><small>${esc(t("pj.prog.nreg", { n: num(nreg) }))}</small></li>` : ""].join("");
  return `<ul class="jm-pj-dasar">${baris || `<li><b>${esc(t("pj.dasar"))}</b><small>${esc(g.ringkas || "")}</small></li>`}</ul>`;
}
function gambarProg() {
  $("pjProg").innerHTML = PROG.baris.map((g, i) => {
    const rows = SEMUA.filter((r) => r.prog.includes(g.id)), per = g.per_status || {}, tot = g.jumlah_proyek || 0, nreg = (g.regulasi_ids || []).length, sat = satuanProg(rows);
    const punyaKap = tot && g.kapasitas_mw;
    const isi = tot ? `${tekBaris(g.id)}<div class="jm-pj-pk-bar">${barTumpuk(per, tot)}</div>${legPil(per)}` : dasarKosong(g);
    const kaki = tot ? t("pj.prog.lihat", { n: num(tot) }) : t(nreg ? "pj.prog.reg" : "pj.prog.buka");
    return `<a class="jm-pj-pk jm-pj-pg-${i % 5}" href="#program-${esc(g.id)}"><div class="jm-pj-pk-gb">${IMG_PROG[g.id] ? `<img src="${IMG_PROG[g.id]}" alt="" width="800" height="450" loading="lazy" decoding="async">` : ""}<span class="jm-pj-pk-ik">${ikProg(g.id)}</span></div>
      <div class="jm-pj-pk-isi"><h3>${esc(g.nama)}</h3><p class="jm-pj-pk-desk">${esc(g.ringkas || "")}</p>
      <dl class="jm-pj-pk-stat"><div><dt>${esc(t("pj.prog.proyek"))}</dt><dd>${num(tot)}</dd></div><div><dt>${esc(t("pj.c.kap"))}</dt><dd${punyaKap ? "" : ` class="jm-pj-redup" title="${esc(t("pj.prog.belum.ket"))}"`}>${punyaKap ? esc(kapTeks(g.kapasitas_mw, sat)) : "-"}</dd></div><div><dt>${esc(t("pj.rel.reg"))}</dt><dd>${num(nreg)}</dd></div></dl>
      ${isi}<span class="jm-pj-link">${esc(kaki)}</span></div></a>`;
  }).join("");
  for (const i of $("pjProg").querySelectorAll("i[data-w]")) i.style.width = i.dataset.w + "%";
  isiDasar();
}
async function isiDasar() {
  const els = [...$("pjProg").querySelectorAll("[data-reg]")];
  if (!els.length) return;
  try {
    const rg = await lazy("/data/regulasi.json");
    for (const el of els) {
      const g = PROG.baris.find((x) => x.id === el.dataset.reg), ids = new Set(g.regulasi_ids || []);
      const x = rg.baris.filter((r) => ids.has(r.id)).slice(0, 2);
      if (x.length) el.querySelector("small").textContent = x.map((r) => r.judul).join("; ");
    }
  } catch (e) { /* tetap tampil jumlah regulasi */ }
}
/* ---------- profil: lembar dari kanan (gaya lembar direktori), tautan dalam #id ---------- */
const dlg = $("pjProfil");
let petaMini = null;
const sumberRef = (id) => (id ? `<sup class="jm-pj-ref" title="${esc(t("pj.sumber.ref"))}">${esc(id)}</sup>` : "");
const inisial = (n) => String(n || "").replace(/[^\p{L} ]/gu, "").split(/\s+/).filter((w) => w.length > 1).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
const uang = (x) => {
  const n = x.nilai;
  if (!Number.isFinite(n)) return "";
  const [v, s] = n >= 1e9 ? [n / 1e9, t("pj.u.miliar")] : n >= 1e6 ? [n / 1e6, t("pj.u.juta")] : [n, ""];
  return `${esc(x.satuan || "")} ${num(v)} ${esc(s)}`.trim();
};
const tglWaktu = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? tanggal(v) : String(v));
const laci = (kunci, isiHtml) => `<section class="jm-pj-bag"><h3>${esc(t("pj.l." + kunci))}</h3><div class="jm-pj-kartubag">${isiHtml}</div></section>`;
const daftarNilai = (a, f) => `<ul class="jm-pj-nilai">${a.map((x) => `<li>${f(x)}${x.catatan ? `<small>${esc(x.catatan)}</small>` : ""}${sumberRef(x.sumber_id)}</li>`).join("")}</ul>`;
const ikTutup = ikon("tutup", 22);
const tile = (k, v, redup) => `<div class="jm-pj-tile"><b${redup ? ' class="jm-pj-redup"' : ""}>${v}</b><span>${esc(t(k))}</span></div>`;

function profilHtml(r) {
  const p = r.p, L = p.lokasi || {};
  const bag = [];
  const baris = [labTek(r.tek), r.prov, ...r.prog.map(progNama)].filter(Boolean).join(", ");
  const tahap = r.telat ? t("pj.telat.tahun", { n: r.telat }) : labSt(r.st);
  if (r.ada || r.prov) {
    bag.push(laci("lokasi", `${r.ada ? `<div id="pjMini" class="jm-pj-mini"></div>` : ""}<div class="jm-pj-lokbaris"><span>${esc([r.kab, r.prov].filter(Boolean).join(", "))}</span>${r.ada ? `<span class="jm-pj-pilpeta2">${esc(presisiTeks(r))}</span>` : ""}</div>`));
  }
  if ((p.kapasitas || []).length) bag.push(laci("teknis", daftarNilai(p.kapasitas, (x) => `<b>${num(x.nilai)} ${esc(x.satuan || "")}</b> ${pilTek(r.tek)}`)));
  const dana = (p.nilai_investasi || []).filter((x) => Number.isFinite(x.nilai));
  if (dana.length) bag.push(laci("uang", daftarNilai(dana, (x) => `<b>${uang(x)}</b>`)));
  const kron = [...Object.entries(p.waktu || {}).map(([k, v]) => ["pj.w." + k, v, 0]), ...(p.tanggal_ppa || []).map((x) => ["pj.w.ppa", x.nilai, 0, x.sumber_id]), ...(p.financial_close || []).map((x) => ["pj.w.fc", x.nilai, 0, x.sumber_id]), ...(p.cod_target || []).map((x) => ["pj.w.target", x.nilai, 0, x.sumber_id, x.catatan]), ...(p.cod_aktual || []).map((x) => ["pj.w.aktual", x.nilai, 1, x.sumber_id])]
    .filter((x) => x[1]).sort((a, b) => String(a[1]).localeCompare(String(b[1])));
  if (kron.length) bag.push(laci("waktu", `<ol class="jm-pj-garis">${kron.map(([k, v, ok, sid, cat]) => `<li${ok ? ' class="ok"' : ""}><b>${esc(String(v).slice(0, 4))}</b><span><strong>${esc(ada(k) ? t(k) : k.replace("pj.w.", ""))}</strong>${String(v).length > 4 ? ` <small>${esc(tglWaktu(v))}</small>` : ""}${cat ? ` <small>${esc(cat)}</small>` : ""}${sumberRef(sid)}</span></li>`).join("")}</ol>`));
  const pihak = Object.entries(p.pihak || {}).flatMap(([peran, a]) => (a || []).map((x) => [peran, x])).filter(([, x]) => x.nilai);
  if (pihak.length) bag.push(laci("pihak", `<ul class="jm-pj-pihak">${pihak.map(([peran, x]) => `<li><span class="jm-pj-av" aria-hidden="true">${esc(inisial(x.nilai))}</span><span class="jm-pj-pn"><b>${esc(x.nilai)}</b><small>${esc(lab("pj.p.", peran))}</small></span>${x.organisasi_id ? `<a class="jm-pj-pt" href="/direktori#${esc(x.organisasi_id)}" data-org="${esc(x.organisasi_id)}" aria-label="${esc(t("pj.p.direktori"))}: ${esc(x.nilai)}">${ikon("panah-kanan", 18)}</a>` : ""}</li>`).join("")}</ul>`));
  bag.push(`<section class="jm-pj-bag" id="pjRelBag" hidden></section>`);
  const sm = [...(p.sumber || []).map((s) => ({ judul: s.dokumen || s.jenis, ket: [s.halaman, t("pj.bukti." + (s.tingkat_bukti || "media")), tanggal(s.tanggal), s.lisensi].filter((v) => v && v !== "-").join(", "), url: urlAman(s.url), id: s.id })),
    ...(L.sumber && L.sumber.catatan ? [{ judul: t("pj.lokasi.sumber"), ket: [L.sumber.catatan, L.sumber.lisensi].filter(Boolean).join(", "), url: urlAman(L.sumber.url) }] : [])];
  if (sm.length) bag.push(laci("sumber", `<ul class="jm-pj-sumberl">${sm.map((s) => `<li>${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">` : "<div>"}<span><b>${esc(s.judul)}</b>${s.id ? sumberRef(s.id) : ""}<small>${esc(s.ket)}</small></span>${s.url ? ikon("tautan", 18) + "</a>" : "</div>"}</li>`).join("")}</ul>`));
  const tiles = `${tile("pj.c.kap", r.kap === null ? "-" : `${num(r.kap)} <small>${esc(r.sat)}</small>`, r.kap === null)}${tile("pj.c.cod", r.cod === null ? "-" : r.cod, r.cod === null)}${tile(r.telat ? "pj.c.telat" : "pj.c.status", esc(tahap), false)}`;
  const pilHtml = `${pilSt(r.st)}${r.telat ? pil(t("pj.telat.tahun", { n: r.telat }), "bad") : ""}${pil(t("pj.bukti." + (p.tingkat_bukti || "media")), p.tingkat_bukti === "resmi" ? "ok" : "warn")}${p.nama_perlu_tinjau ? `<span class="jm-pj-tinjau">${esc(t("pj.tinjau"))}</span>` : ""}`;
  const aks = (r.ada ? `<a class="jm-tbl jm-tbl-kecil" href="${mapsUrl(L.lat, L.lng)}" target="_blank" rel="noopener noreferrer">${PIN}<span>${esc(t("pj.maps.pendek"))}</span></a>` : "") + aksiHtml({ csv: false });
  return kepalaModal({ id: r.id, img: IMG_TEK[r.tek], ikonSvg: ikonTek(r.tek), judul: r.nama, ringkas: baris, pilHtml, aks, balik: dlg.dataset.balik || "" })
    + `<div class="jm-pj-strip"><div class="jm-pj-tiles">${tiles}</div></div><div class="jm-pj-sh-badan jm-pj-dua">${bag.join("")}</div></div>`;
}

const kepalaModal = ({ id, img, ikonSvg, judul, ringkas, pilHtml = "", aks = "", balik = "" }) => `<div class="jm-ex jm-pj-mex" id="${esc(id)}"><header class="jm-pj-ban">
  <div class="jm-pj-ban-gb">${img ? `<img src="${img}" alt="" decoding="async">` : ""}</div>
  <div class="jm-pj-ban-bar">${balik ? `<button type="button" class="jm-pj-x jm-pj-balik" data-balik="${esc(balik)}" aria-label="${esc(t("jm.kembali"))}" title="${esc(t("jm.kembali"))}">${ikon("panah-kiri", 20)}</button>` : ""}<span class="jm-pj-ban-aksi">${aks}</span><button type="button" class="jm-pj-x" data-tutup="1" aria-label="${esc(t("jm.tutup"))}" title="${esc(t("jm.tutup"))}">${ikTutup}</button></div>
  <div class="jm-pj-ban-isi"><span class="jm-pj-logo" aria-hidden="true">${ikonSvg}</span><div class="jm-pj-sh-nama"><h2 class="jm-ex-j" id="pjProfilJudul">${esc(judul)}</h2>${ringkas ? `<p>${esc(ringkas)}</p>` : ""}${pilHtml ? `<div class="jm-pj-sh-pil">${pilHtml}</div>` : ""}</div></div></header>`;

async function isiTerkait(r) {
  const el = $("pjRelBag");
  if (!el) return;
  try {
    const [rg, br, og] = await Promise.all([lazy("/data/regulasi.json"), lazy("/data/berita.json"), lazy("/data/organisasi.json")]);
    if (!el.isConnected || dlg.dataset.id !== r.id) return;
    const ids = new Set(r.p.regulasi_ids || []);
    const regs = rg.baris.filter((x) => ids.has(x.id) || (x.proyek_ids || []).includes(r.id));
    const brs = br.baris.filter((x) => (x.proyek_ids || []).includes(r.id) || (r.p.berita_ids || []).includes(x.id));
    const item = (judul, ket, url) => `<li>${urlAman(url) ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">` : "<div>"}<span><b>${esc(judul)}</b><small>${esc(ket)}</small></span>${urlAman(url) ? ikon("tautan", 18) + "</a>" : "</div>"}</li>`;
    el.innerHTML = (regs.length ? `<h3>${esc(t("pj.rel.reg"))}</h3><div class="jm-pj-kartubag"><ul class="jm-pj-sumberl">${regs.map((x) => item(x.judul, `${String(x.jenis || "").toUpperCase()} ${x.nomor || ""}/${x.tahun || ""}, ${x.status || ""}`, x.url_sumber)).join("")}</ul></div>` : "") +
      (brs.length ? `<h3 class="jm-pj-h3b">${esc(t("pj.rel.ber"))}</h3><div class="jm-pj-kartubag"><ul class="jm-pj-sumberl">${brs.map((x) => item(x.judul, `${x.media || ""}, ${tglIso(x.terbit)}`, x.url)).join("")}</ul></div>` : "");
    el.hidden = !(regs.length || brs.length);
    const nama = new Map(og.baris.map((o) => [o.id, o.nama]));
    for (const a of dlg.querySelectorAll("[data-org]")) if (nama.has(a.dataset.org)) { const b = a.parentElement.querySelector(".jm-pj-pn b"); if (b) b.textContent = nama.get(a.dataset.org); }
  } catch (e) { /* data terkait bersifat tambahan; lembar tetap utuh */ }
}

function miniPeta(r) {
  const el = $("pjMini");
  if (!el) return;
  muatMapLibre().then(() => {
    if (!el.isConnected) return;
    const z = { titik_persis: 11, kabupaten: 8 }[r.p.lokasi.presisi] || 5;
    petaMini = new maplibregl.Map({ container: el, style: gaya(), center: [r.p.lokasi.lng, r.p.lokasi.lat], zoom: z, minZoom: 3, maxZoom: 16, dragRotate: false, attributionControl: { compact: true } });
    petaMini.on("style.load", () => rapikanPeta(petaMini));
    const m = document.createElement("div"); m.className = "jm-pj-penanda" + (r.p.lokasi.presisi === "titik_persis" ? "" : " kira");
    new maplibregl.Marker({ element: m }).setLngLat([r.p.lokasi.lng, r.p.lokasi.lat]).addTo(petaMini);
    petaMini.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
  }).catch(() => { el.textContent = t("pj.peta.galat"); });
}

function programHtml(g) {
  const rows = SEMUA.filter((r) => r.prog.includes(g.id)).sort((a, b) => (b.kap ?? -1) - (a.kap ?? -1) || a.nama.localeCompare(b.nama)), tot = rows.length;
  const per = hitung(rows, (r) => r.st), mw = jumlahMW(rows), nreg = (g.regulasi_ids || []).length, sat = satuanProg(rows);
  const docs = hitung(rows, (r) => [...new Set((r.p.sumber || []).map((x) => x.dokumen || x.jenis))]);
  const baris = rows.slice(0, 100).map((r) => `<tr data-id="${esc(r.id)}"><td data-label="${esc(t("pj.c.nama"))}"><span class="jm-id"><b><a class="jm-pj-nm" href="#${esc(r.id)}">${esc(r.nama)}</a></b><small>${esc(r.prov || "-")}</small></span></td><td class="jm-tengah" data-label="${esc(t("pj.c.tek"))}">${selTek(r)}</td><td class="jm-num" data-label="${esc(t("pj.c.kap"))}">${selKap(r)}</td><td class="jm-tengah" data-label="${esc(t("pj.c.status"))}">${pilSt(r.st)}</td></tr>`).join("");
  const tiles = `${tile("pj.prog.proyek", num(tot), false)}${tile("pj.c.kap", tot && mw ? esc(kapTeks(mw, sat)) : "-", !(tot && mw))}${tile("pj.rel.reg", num(nreg), false)}`;
  const aks = (tot ? `<button type="button" class="jm-tbl jm-tbl-kecil" data-tampil="${esc(g.id)}">${esc(t("pj.prog.dipeta"))}</button>` : "") + aksiHtml({ csv: !!tot });
  const kiri = (tot ? laci("status", barTumpuk(per, tot) + legPil(per)) : laci("dasar", dasarKosong(g))) + `<section class="jm-pj-bag" id="pjRelBag" hidden></section>`
    + (tot ? laci("sumber", `<ul class="jm-pj-sumberl">${Object.entries(docs).sort((a, b) => b[1] - a[1]).map(([d, n]) => `<li><div><span><b>${esc(d)}</b><small>${esc(t("pj.prog.nproyek", { n: num(n) }))}</small></span></div></li>`).join("")}</ul>`) : "");
  const kanan = tot ? `<section class="jm-pj-bag"><h3>${esc(t("pj.l.lokasi"))}</h3><div id="pjMini" class="jm-pj-mini jm-pj-mini-b"></div></section>` : "";
  const tabel = tot ? `<section class="jm-pj-bag jm-pj-penuhlebar"><h3>${esc(t("pj.prog.daftar"))}</h3><div class="jm-gulir"><table class="jm-tabel jm-pj-tetap jm-pj-t4"><thead><tr><th scope="col">${esc(t("pj.c.nama"))}</th><th scope="col">${esc(t("pj.c.tek"))}</th><th scope="col">${esc(t("pj.c.kap"))}</th><th scope="col">${esc(t("pj.c.status"))}</th></tr></thead><tbody>${baris}</tbody></table></div>${tot > 100 ? `<p class="jm-bantu">${esc(t("pj.tampil", { n: 100, total: num(tot) }))}</p>` : ""}</section>` : "";
  return kepalaModal({ id: "program-" + g.id, img: IMG_PROG[g.id], ikonSvg: ikProg(g.id), judul: g.nama, ringkas: g.ringkas || "", aks })
    + `<div class="jm-pj-strip"><div class="jm-pj-tiles">${tiles}</div></div><div class="jm-pj-sh-badan"><div class="jm-pj-dua"><div class="jm-pj-kol">${kiri}</div>${kanan ? `<div class="jm-pj-kol">${kanan}</div>` : ""}</div>${tabel}</div></div>`;
}
/* peta mini program: semua titik proyek program, pas ke batasnya; klik titik membuka profil proyek (dengan tombol kembali) */
function miniProgram(g) {
  const el = $("pjMini"), pts = SEMUA.filter((r) => r.ada && r.prog.includes(g.id));
  if (!el) return;
  if (!pts.length) { el.textContent = t("pj.presisi.tak"); el.classList.add("jm-bantu"); return; }
  muatMapLibre().then(() => {
    if (!el.isConnected) return;
    petaMini = new maplibregl.Map({ container: el, style: gaya(), center: [pts[0].p.lokasi.lng, pts[0].p.lokasi.lat], zoom: 6, minZoom: 3, maxZoom: 16, dragRotate: false, attributionControl: { compact: true } });
    const b = new maplibregl.LngLatBounds(); for (const r of pts) b.extend([r.p.lokasi.lng, r.p.lokasi.lat]);
    const pas = () => { petaMini.resize(); if (pts.length > 1) petaMini.fitBounds(b, { padding: 36, maxZoom: 9, duration: 0 }); else petaMini.jumpTo({ center: b.getCenter(), zoom: 9 }); };
    pas();
    petaMini.on("style.load", () => {
      pas();
      rapikanPeta(petaMini);
      petaMini.addSource("t", { type: "geojson", data: { type: "FeatureCollection", features: pts.map((r) => ({ type: "Feature", properties: { id: r.id, warna: warna(TEK_WARNA[r.tek] || "--ink2") }, geometry: { type: "Point", coordinates: [r.p.lokasi.lng, r.p.lokasi.lat] } })) } });
      petaMini.addLayer({ id: "t", type: "circle", source: "t", paint: { "circle-color": ["get", "warna"], "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 4, 9, 8], "circle-stroke-color": warna("--paper"), "circle-stroke-width": 1.5 } });
    });
    petaMini.on("click", "t", (e) => { location.hash = e.features[0].properties.id; });
    petaMini.on("mouseenter", "t", () => { petaMini.getCanvas().style.cursor = "pointer"; });
    petaMini.on("mouseleave", "t", () => { petaMini.getCanvas().style.cursor = ""; });
    petaMini.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
  }).catch(() => { el.textContent = t("pj.peta.galat"); });
}
async function isiTerkaitProgram(g) {
  const el = $("pjRelBag");
  if (!el) return;
  try {
    const [rg, br] = await Promise.all([lazy("/data/regulasi.json"), lazy("/data/berita.json")]);
    if (!el.isConnected || dlg.dataset.id !== "program-" + g.id) return;
    const ids = new Set(g.regulasi_ids || []), pids = new Set((g.proyek_ids && g.proyek_ids.length ? g.proyek_ids : SEMUA.filter((r) => r.prog.includes(g.id)).map((r) => r.id)));
    const regs = rg.baris.filter((x) => ids.has(x.id) || (x.program_ids || []).includes(g.id));
    const brs = br.baris.filter((x) => (x.proyek_ids || []).some((i) => pids.has(i))).sort((a, b) => String(b.terbit).localeCompare(String(a.terbit))).slice(0, 8);
    const item = (judul, ket, url, dalam) => `<li><a href="${esc(url)}"${dalam ? "" : ' target="_blank" rel="noopener noreferrer"'}><span><b>${esc(judul)}</b><small>${esc(ket)}</small></span>${ikon(dalam ? "panah-kanan" : "tautan", 18)}</a></li>`;
    el.innerHTML = (regs.length ? `<h3>${esc(t("pj.prog.dasar"))}</h3><div class="jm-pj-kartubag"><ul class="jm-pj-sumberl">${regs.map((x) => item(x.judul, `${String(x.jenis || "").toUpperCase()} ${x.nomor || ""}/${x.tahun || ""}, ${x.status || ""}`, "/regulasi?id=" + encodeURIComponent(x.id), true)).join("")}</ul></div>` : "") +
      (brs.length ? `<h3 class="jm-pj-h3b">${esc(t("pj.rel.ber"))}</h3><div class="jm-pj-kartubag"><ul class="jm-pj-sumberl">${brs.map((x) => item(x.judul, `${x.media || ""}, ${tglIso(x.terbit)}`, urlAman(x.url) || "#", false)).join("")}</ul></div>` : "");
    el.hidden = !(regs.length || brs.length);
  } catch (e) { /* tambahan saja */ }
}
function bukaProgram(id) {
  const g = PROG.baris.find((x) => x.id === id);
  if (!g) { if (dlg.open) dlg.close(); return; }
  if (dlg.open && dlg.dataset.id === "program-" + id) return;
  if (petaMini) { petaMini.remove(); petaMini = null; }
  dlg.dataset.id = "program-" + id; delete dlg.dataset.balik;
  dlg.innerHTML = programHtml(g);
  for (const i of dlg.querySelectorAll("i[data-w]")) i.style.width = i.dataset.w + "%";
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
  nanti(() => { miniProgram(g); isiTerkaitProgram(g); });
}
/* lapis anggota/pengurus (hanya bila masuk; tamu: diam). Disisipkan sesudah profil tercat. */
const LAPIS_PJ = lapisAnggota("proyek");
async function isiAnggota(id) {
  const x = (await LAPIS_PJ)?.get(id);
  if (!x || dlg.dataset.id !== id || dlg.querySelector("#pjAnggota")) return;
  const materi = Object.entries(x.dari_materi || {}).map(([k, v]) => `${k}: ${[].concat(v).join(", ")}`);
  const isi = anggotaDl([["pj.ang.skema", x.skema_kerjasama], ["pj.ang.dana", x.pemberi_dana], ["pj.ang.pihak", x.pihak_terlibat], ["pj.ang.fc", x.financial_close], ["pj.ang.ppa", x.tanggal_ppa], ["pj.ang.tk", x.tenaga_kerja], ["pj.ang.materi", materi], ["pj.ang.catatan", x.catatan], ["pj.ang.konflik", x.konflik]], esc);
  if (isi) dlg.querySelector(".jm-pj-sh-badan")?.insertAdjacentHTML("afterbegin", `<section class="jm-pj-bag" id="pjAnggota"><h3>${esc(t("pj.l.anggota"))}</h3><div class="jm-pj-kartubag">${isi}</div></section>`);
}
function bukaProfil(id) {
  const r = PER_ID.get(id);
  if (!r) { if (dlg.open) dlg.close(); return; }
  if (dlg.open && dlg.dataset.id === id) return;
  if (petaMini) { petaMini.remove(); petaMini = null; }
  if (dlg.open && String(dlg.dataset.id).startsWith("program-")) dlg.dataset.balik = dlg.dataset.id;
  else if (!dlg.open) delete dlg.dataset.balik;
  dlg.dataset.id = id;
  dlg.innerHTML = profilHtml(r);
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
  nanti(() => { miniPeta(r); isiTerkait(r); isiAnggota(id); });
}
dlg.addEventListener("click", (e) => {
  const tp = e.target.closest("[data-tampil]");
  if (tp) { dlg.close(); F.prog = tp.dataset.tampil; $("fprog").value = F.prog; segarHero(); terapkan(); $("exPeta").scrollIntoView({ behavior: "smooth", block: "start" }); return; }
  const bl = e.target.closest("[data-balik]");
  if (bl) { location.hash = bl.dataset.balik; return; }
  const tr = e.target.closest("tr[data-id]");
  if (tr && !e.target.closest("a")) { location.hash = tr.dataset.id; return; }
  if (e.target === dlg || e.target.closest("[data-tutup]")) dlg.close();
});
dlg.addEventListener("close", () => {
  if (petaMini) { petaMini.remove(); petaMini = null; }
  delete dlg.dataset.id; delete dlg.dataset.balik;
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
});
const dariHash = () => { const id = decodeURIComponent(location.hash.slice(1)); if (id.startsWith("program-")) bukaProgram(id.slice(8)); else if (id) bukaProfil(id); else if (dlg.open) dlg.close(); };
addEventListener("hashchange", dariHash);

/* ---------- kerangka + pemasangan ---------- */
function semua() {
  gambarHero(); isiPilihan(); gambarProg(); terapkan();
  if (dlg.open && dlg.dataset.id) { const id = dlg.dataset.id; delete dlg.dataset.id; if (petaMini) { petaMini.remove(); petaMini = null; } id.startsWith("program-") ? bukaProgram(id.slice(8)) : bukaProfil(id); }
}
const cariTunda = debounce(() => { F.q = $("fq").value.trim().toLowerCase(); terapkan(); }, 120);
$("fq").addEventListener("input", cariTunda);
for (const [sel, k] of [["ftek", "tek"], ["fst", "st"], ["fprog", "prog"], ["fprov", "prov"]]) $(sel).addEventListener("change", () => { F[k] = $(sel).value; terapkan(); });
$("freset").addEventListener("click", () => { Object.assign(F, { q: "", tek: "", st: "", prog: "", prov: "" }); $("fq").value = ""; for (const s of ["ftek", "fst", "fprog", "fprov"]) $(s).value = ""; terapkan(); });
document.addEventListener("jm:bahasa", () => nanti(semua));

semua();
nanti(bukaPeta);
if (DARI_URL) nanti(() => $("exDaftar").scrollIntoView({ block: "start" }));
dariHash();
