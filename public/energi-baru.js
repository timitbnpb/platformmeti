/* /energi-baru: (A) energi baru (huruf B pada EBET: nuklir, hidrogen dan amonia, CBM, DME, co-firing) dan (B) inventaris PLTU, kandidat pensiun dini, dampak udara dan kesehatan.
   Data: /data/energi_baru.json (scripts/panen/energi_baru.mjs) dan /data/pltu.json (scripts/panen/pltu.mjs; GEM Global Coal Plant Tracker CC BY 4.0, Climate TRACE, CREA).
   INP: saringan menyalakan chrome seketika, isi berat (peta, grafik, tabel) menyusul lewat nanti(). Tooltip grafik: inti/tip_grafik.js (data-tip). Tanpa gaya inline (CSP). */
import { mulaiHalaman } from "/inti/kepala.js";
import { khUbin } from "/inti/kh.js";
import { tabHalaman } from "/inti/tab_halaman.js";
import { t, angka, tanggal, bahasa } from "/i18n.js";
import { esc, ikon, nanti, debounce, kosongHtml, galatHtml, hantuHtml } from "/inti/umum.js";
import { cariHtml, pilihHtml, hapusHtml, exHtml, sumberHtml } from "/inti/komponen.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { buktiHtml } from "/inti/bukti.js";
import { IKON_TEK } from "/inti/ikon_tek.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { rapikanPeta, pasangBatas, BATAS_ID } from "/inti/peta_indonesia.js";
import { geserPanel } from "/inti/panel_geser.js";
import { kodeProv, singkatProv } from "/inti/prov_singkat.js";
import { siapTautan, tautOrg, tautRegulasi, tautProyek, naikkan } from "/inti/tautan.js";
import { saatBahasa } from "/analisis.js";
import "/inti/tip_grafik.js";

const $ = (id) => document.getElementById(id);
const N = (n, d = 0) => angka(n, { desimal: d });
const L = (o) => (o && (o[bahasa()] ?? o.id)) || "";
const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "gray";
const gelap = () => document.documentElement.dataset.theme === "dark" || (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme:dark)").matches);
const gaya = () => "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron");
const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const httpOk = (u) => /^https?:\/\//i.test(String(u || ""));
const svg = (d) => `<svg class="jm-ikt jm-ikt-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const redup = () => `<span class="jm-redup" title="${esc(t("jm.belum"))}">-</span>`;

const BAG = ["nuklir", "hidrogen", "cbm", "dme", "cofiring"];
const IK_BAG = { nuklir: IKON_TEK.nuklir, hidrogen: IKON_TEK.hidrogen, cbm: svg('<path d="M12 3c2 3 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-8z"/>'), dme: svg('<path d="M4 20V10l5 3V8l5 3V6l6 4v10zM8 20v-3M12 20v-3M16 20v-3"/>'), cofiring: IKON_TEK.bioenergi };
const SEL_BAG = { nuklir: "tek:nuklir", hidrogen: "tek:hidrogen", cbm: "tek-panas", dme: "pabrik", cofiring: "tek:bioenergi" };
const STAT = ["beroperasi", "pilot", "konstruksi", "persiapan", "rencana", "kerja-sama", "tertunda", "dibatalkan"];
const IK_STAT = { beroperasi: "centang", pilot: "kamera", konstruksi: "pabrik", persiapan: "jam", rencana: "kalender", "kerja-sama": "tautan", tertunda: "peringatan", dibatalkan: "silang" };
const NADA_STAT = { beroperasi: "ok", pilot: "ok", konstruksi: "warn", persiapan: "info", rencana: "info", "kerja-sama": "info", tertunda: "warn", dibatalkan: "bad" };
const KU = ["u0", "u10", "u20", "u30", "tak-diketahui"];
const WARNA_KU = { u0: "--ok", u10: "--info", u20: "--warn", u30: "--bad", "tak-diketahui": "--ink2" };
const ST_PLTU = ["operasi", "konstruksi", "pra-konstruksi", "rencana", "ditunda", "pensiun"];
const PULAU = ["Sumatera", "Jawa", "Kalimantan", "Sulawesi", "Maluku", "Nusa Tenggara", "Papua"];
const JALUR = ["jetp", "etm", "gem", "usia"];
const HAL = 15;

const pilBag = (k) => `<span class="jm-pil-tek enb-pb enb-b-${esc(k)}">${IK_BAG[k]}<span>${esc(t("enb.bag." + k))}</span></span>`;
const pilStat = (s) => `<span class="jm-pil-st enb-st enb-st-${NADA_STAT[s] || "info"}">${ikon(IK_STAT[s] || "info", 14)}<span>${esc(t("enb.st." + s))}</span></span>`;
const pilKu = (k) => `<span class="jm-pil-tek enb-ku enb-k-${esc(k)}"><i aria-hidden="true"></i><span>${esc(t("enb.ku." + k))}</span></span>`;
const pilJalur = (j) => `<span class="jm-pil-tek enb-jl enb-j-${esc(j)}">${ikon(j === "usia" ? "jam" : j === "gem" ? "tabel" : "bendera", 14)}<span>${esc(t("enb.jl." + j))}</span></span>`;
const bendera = (iso, u = 20) => iso ? `<img class="enb-bd" src="/img/bendera/${esc(String(iso).toLowerCase())}.svg" width="${u}" height="${Math.round(u * 0.75)}" alt="" loading="lazy" decoding="async" data-galat="hapus">` : "";
const lambang = (kode) => { const k = kode && String(kode); return k ? `<span class="enb-prov"><img src="/img/provinsi/${esc(k)}.png" width="22" height="22" alt="" loading="lazy" decoding="async" data-galat="hapus"><span>${esc(singkatProv(k) || NAMA_PROV[k] || k)}</span></span>` : redup(); };
const bukti = (k, s = "") => buktiHtml(k, { sumber: s, tanggal: E.dibangun_pada, ukuran: 14, tag: "span" });
function tglTeks(s) {
  if (!s) return "";
  if (s.length === 10) return tanggal(s);
  const [y, m] = s.split("-");
  return m ? tanggal(`${y}-${m}-01`).replace(/^1 /, "") : y;
}
const tglAngka = (s) => { const [y, m = 6, d = 15] = String(s).split("-").map(Number); return y + (m - 1) / 12 + (d - 1) / 365; };
const urut = (a, b) => (typeof a === "number" && typeof b === "number" ? a - b : String(a ?? "").localeCompare(String(b ?? ""), "id", { numeric: true }));
const thUrut = (S, k, kls, uk, kunci) => `<th class="${kls}" aria-sort="${S.uk === uk ? (S.ua > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-uk="${uk}">${esc(t(kunci))}</button></th>`;
const gantiUrut = (S, k, angkaDulu) => { S.ua = S.uk === k ? -S.ua : angkaDulu ? -1 : 1; S.uk = k; S.hal = 1; };

await mulaiHalaman();
const isi = $("panelEnergi");
isi.innerHTML = hantuHtml(6);
let E, P, NAMA_PROV = {};
try {
  [E, P] = await Promise.all(["/data/energi_baru.json", "/data/pltu.json"].map((u) => fetch(u, { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error(u); return r.json(); })));
} catch (e) {
  isi.innerHTML = galatHtml("jaringan");
  isi.querySelector("[data-aksi=ulang]")?.addEventListener("click", () => location.reload());
  throw e;
}
for (const p of P.dampak.provinsi) NAMA_PROV[p.kode] = p.nama;
await siapTautan("org", "regulasi", "proyek");
const SUMBER_E = new Map(E.sumber.map((s) => [s.id, s]));
const SUMBER_P = new Map(P.sumber.map((s) => [s.id, s]));
const PL = new Map(P.baris.map((p) => [p.id, p]));
P.baris.forEach((p, i) => { p.i = i; p.cari = norm([p.nama, p.kab, p.pemilik?.nama, p.industri].join(" ")); });
for (const u of P.unit) u.cari = norm([u.pn, u.u, u.kab, ...(u.pemilik || []).map((o) => o.nama), u.industri].join(" "));
const KAND_PID = new Map(); for (const k of P.kandidat) { if (!KAND_PID.has(k.pid)) KAND_PID.set(k.pid, []); KAND_PID.get(k.pid).push(k); }

/* ================= kepala ================= */
function kepala() {
  const m = P.meta, kematian = P.dampak.nasional[0];
  khUbin("khUbin", [
    { ikon: "tek-panas", nilai: N(E.jumlah), label: t("enb.kh.butir") },
    { ikon: "pabrik", nilai: N(m.mw_operasi / 1000, 1), satuan: "GW", label: t("enb.kh.mw") },
    { ikon: "peringatan", nilai: N(P.kandidat.length), label: t("enb.kh.kand") },
    { ikon: "info", nilai: N(kematian.nilai), label: t("enb.kh.mati") },
  ]);
}

/* ================= tab 1: energi baru ================= */
const SE = { q: "", bag: "", st: "", neg: "", hal: 1, uk: "bagian", ua: 1 };
const teksButir = (b) => norm([L(b.nama), L(b.ringkas), b.lokasi_teks, ...(b.pihak || []).map((p) => p.nama)].join(" "));
E.baris.forEach((b) => { b._cari = teksButir(b); });
const negaraButir = (b) => [...new Set([...(b.negara || []), ...(b.pihak || []).map((p) => p.iso2).filter(Boolean)])];
const saringE = () => { const q = norm(SE.q.trim()); return E.baris.filter((b) => (!SE.bag || b.bagian === SE.bag) && (!SE.st || b.status === SE.st) && (!SE.neg || negaraButir(b).includes(SE.neg)) && (!q || b._cari.includes(q))); };
const KE = { nama: (b) => L(b.nama), bagian: (b) => t("enb.bag." + b.bagian), status: (b) => STAT.indexOf(b.status), kap: (b) => b.kapasitas?.nilai ?? -1, tahun: (b) => b.target_tahun ?? 9999, pihak: (b) => b.pihak?.[0]?.nama || "" };
const urutE = (rows) => { const f = KE[SE.uk]; return f ? [...rows].sort((a, b) => urut(f(a), f(b)) * SE.ua) : rows; };

function barisE(b, i) {
  const no = (SE.hal - 1) * HAL + i + 1, kap = b.kapasitas ? `${N(b.kapasitas.nilai, b.kapasitas.nilai < 10 ? 1 : 0)} ${esc(b.kapasitas.satuan)}` : redup();
  const pih = (b.pihak || []).slice(0, 2).map((p) => (p.org_id ? tautOrg(p.org_id, p.nama) : `<span>${esc(p.nama)}</span>`)).join("");
  return `<tr><td class="jm-no" data-label="${esc(t("enb.c.no"))}"><span class="jm-rank">${no}</span></td>
    <td class="jm-id-sel" data-label="${esc(t("enb.c.butir"))}"><span class="jm-id"><span><button type="button" data-id="${esc(b.id)}"><b>${esc(L(b.nama))}</b></button><small>${esc(b.lokasi_teks || "")}</small></span></span></td>
    <td class="jm-tengah" data-label="${esc(t("enb.c.bagian"))}">${pilBag(b.bagian)}</td>
    <td class="jm-tengah" data-label="${esc(t("enb.c.status"))}">${pilStat(b.status)}</td>
    <td class="jm-num" data-label="${esc(t("enb.c.kap"))}">${kap}</td>
    <td class="jm-num" data-label="${esc(t("enb.c.tahun"))}">${b.target_tahun ?? redup()}</td>
    <td data-label="${esc(t("enb.c.pihak"))}"><span class="enb-pihak">${pih || redup()}</span></td>
    <td class="jm-tengah" data-label="${esc(t("enb.c.negara"))}"><span class="enb-neg">${negaraButir(b).map((n) => bendera(n, 22)).join("") || redup()}</span></td></tr>`;
}
function tabelE() {
  const rows = saringE(), maks = Math.max(1, Math.ceil(rows.length / HAL)); SE.hal = Math.min(SE.hal, maks);
  const potong = urutE(rows).slice((SE.hal - 1) * HAL, SE.hal * HAL);
  $("enbECount").textContent = t("enb.hitung", { n: N(rows.length), total: N(E.baris.length) });
  $("enbEHapus").hidden = !(SE.q || SE.bag || SE.st || SE.neg);
  $("enbEIsi").innerHTML = potong.length
    ? `<div class="jm-gulir"><table class="jm-tabel jm-tabel-tetap enb-tabel" data-urut="tidak"><thead><tr><th class="jm-no">${esc(t("enb.c.no"))}</th>${thUrut(SE, 0, "", "nama", "enb.c.butir")}${thUrut(SE, 0, "jm-tengah", "bagian", "enb.c.bagian")}${thUrut(SE, 0, "jm-tengah", "status", "enb.c.status")}${thUrut(SE, 0, "jm-num", "kap", "enb.c.kap")}${thUrut(SE, 0, "jm-num", "tahun", "enb.c.tahun")}${thUrut(SE, 0, "", "pihak", "enb.c.pihak")}<th class="jm-tengah">${esc(t("enb.c.negara"))}</th></tr></thead><tbody>${potong.map(barisE).join("")}</tbody></table></div>`
    : kosongHtml("enb.kosong", { data: "reset", kunci: "jm.kosong.reset" });
  $("enbEHal").innerHTML = paginasiHtml({ hal: SE.hal, total: rows.length, per: HAL, satuan: "jm.pag.u.data" });
  naikkan($("enbEIsi"));
}
function saringE_html() {
  const hit = (f) => E.baris.reduce((m, b) => (f(b).forEach((k) => m.set(k, (m.get(k) || 0) + 1)), m), new Map());
  const bg = hit((b) => [b.bagian]), st = hit((b) => [b.status]), ng = hit(negaraButir);
  $("enbESaring").innerHTML = cariHtml({ id: "enbEQ", label: t("enb.cari") })
    + pilihHtml({ id: "enbEFBag", ikon: "topik", label: t("enb.f.bagian"), nilai: SE.bag, opsi: [["", t("enb.f.bagian")], ...BAG.filter((k) => bg.has(k)).map((k) => [k, t("enb.bag." + k), SEL_BAG[k], bg.get(k)])] })
    + pilihHtml({ id: "enbEFSt", ikon: "status", label: t("enb.f.status"), nilai: SE.st, opsi: [["", t("enb.f.status")], ...STAT.filter((k) => st.has(k)).map((k) => [k, t("enb.st." + k), IK_STAT[k], st.get(k)])] })
    + pilihHtml({ id: "enbEFNeg", ikon: "globe", label: t("enb.f.negara"), nilai: SE.neg, opsi: [["", t("enb.f.negara")], ...[...ng].map(([k, n]) => [k, t("enb.neg." + k), "img:/img/bendera/" + k.toLowerCase() + ".svg", n])] })
    + hapusHtml({ id: "enbEHapus", label: t("jm.kosong.reset") }) + `<span class="jm-hitung" id="enbECount" role="status" aria-live="polite"></span>`;
  $("enbEQ").value = SE.q;
}

/* kartu ringkas per bagian: tombol saring */
function kartuBagian() {
  return `<ul class="enb-kartu">${BAG.map((k) => {
    const rs = E.baris.filter((b) => b.bagian === k), mw = rs.filter((b) => b.kapasitas && /MW/.test(b.kapasitas.satuan)).length;
    return `<li><button type="button" class="enb-kb enb-b-${k}" data-bag="${k}" aria-pressed="${SE.bag === k}"><span class="enb-kb-ik">${IK_BAG[k]}</span><span class="enb-kb-t"><b>${esc(t("enb.bag." + k))}</b><small>${esc(t("enb.bag." + k + ".d"))}</small></span><span class="enb-kb-n">${N(rs.length)}</span>${mw ? "" : ""}</button></li>`;
  }).join("")}</ul>`;
}

/* linimasa: titik peristiwa (bulat) dan tahun target (belah ketupat) per bagian */
function linimasaSvg() {
  const el = $("enbLin"); if (!el) return;
  const ev = [];
  for (const b of E.baris) {
    if (SE.bag && b.bagian !== SE.bag) continue;
    for (const l of b.linimasa) { const x = tglAngka(l.tgl); if (x >= 2021.5) ev.push({ b, x, tgl: l.tgl, teks: L(l.teks), tipe: "p" }); }
    if (b.target_tahun && b.target_tahun <= 2035) ev.push({ b, x: b.target_tahun + 0.5, tgl: String(b.target_tahun), teks: t("enb.lin.target"), tipe: "t" });
  }
  const bagTampil = BAG.filter((k) => !SE.bag || k === SE.bag), W = Math.max(el.clientWidth || 720, 560), M = { a: 16, k: 210, b: 34, r: 24 }, rh = 46, H = M.a + M.b + rh * bagTampil.length;
  const x0 = 2021.5, x1 = 2036, xs = (v) => M.k + ((v - x0) / (x1 - x0)) * (W - M.k - M.r);
  let g = "";
  for (let y = 2022; y <= Math.floor(x1); y += 1) g += `<line class="enb-grid" x1="${xs(y)}" x2="${xs(y)}" y1="${M.a}" y2="${H - M.b}"/><text class="enb-tx" x="${xs(y)}" y="${H - 12}" text-anchor="middle">${y}</text>`;
  const kini = tglAngka(E.dibangun_pada); g += `<line class="enb-kini" x1="${xs(kini)}" x2="${xs(kini)}" y1="${M.a}" y2="${H - M.b}"/>`;
  bagTampil.forEach((k, r) => {
    const cy = M.a + rh * r + rh / 2;
    g += `<line class="enb-baris" x1="${M.k}" x2="${W - M.r}" y1="${cy}" y2="${cy}"/><text class="enb-tx enb-tx-b" x="${M.k - 12}" y="${cy + 4}" text-anchor="end">${esc(t("enb.bag." + k))}</text>`;
    const e = ev.filter((v) => v.b.bagian === k).sort((a, b2) => a.x - b2.x);
    e.forEach((v, i) => {
      const dy = ((i % 3) - 1) * 9, tip = `${L(v.b.nama)} | ${tglTeks(v.tgl)} | ${v.teks}`;
      g += v.tipe === "t"
        ? `<path class="enb-dot enb-b-${k} enb-tgt" d="M${xs(v.x)} ${cy + dy - 8}l7 8-7 8-7-8z" data-tip="${esc(tip)}"/>`
        : `<circle class="enb-dot enb-b-${k}" cx="${xs(v.x)}" cy="${cy + dy}" r="6" data-tip="${esc(tip)}"/>`;
    });
  });
  el.innerHTML = `<div class="enb-gulir"><svg class="jm-gx enb-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("enb.lin.label"))}">${g}</svg></div>
    <ul class="enb-leg"><li><i class="enb-leg-p" aria-hidden="true"></i>${esc(t("enb.lin.peristiwa"))}</li><li><i class="enb-leg-t" aria-hidden="true"></i>${esc(t("enb.lin.target"))}</li><li><i class="enb-leg-k" aria-hidden="true"></i>${esc(t("enb.lin.kini"))}</li></ul>`;
}

/* kerja sama luar negeri per negara (iso2) */
function negaraHtml() {
  const per = new Map(); for (const b of E.baris) for (const n of negaraButir(b)) { if (!per.has(n)) per.set(n, []); per.get(n).push(b); }
  const daftar = [...per].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  return `<ul class="enb-neg-daftar">${daftar.map(([iso, rs]) => `<li><button type="button" class="enb-nb" data-neg="${esc(iso)}" aria-pressed="${SE.neg === iso}">${bendera(iso, 32)}<span class="enb-nb-t"><b>${esc(t("enb.neg." + iso))}</b><small>${esc(rs.map((b) => L(b.nama)).slice(0, 2).join(" | "))}${rs.length > 2 ? " ..." : ""}</small></span><span class="enb-kb-n">${N(rs.length)}</span></button></li>`).join("")}</ul>`;
}

function rincianButir(id) {
  const b = E.baris.find((x) => x.id === id), dlg = $("lembar"); if (!b) return;
  const dd = (k, v) => (v ? `<div><dt>${esc(t(k))}</dt><dd>${v}</dd></div>` : "");
  const srcs = b.sumber_ids.map((s) => SUMBER_E.get(s)).filter(Boolean);
  const kap = b.kapasitas ? `${N(b.kapasitas.nilai, b.kapasitas.nilai < 10 ? 1 : 0)} ${esc(b.kapasitas.satuan)}` : "";
  dlg.innerHTML = `<div class="jm-lembar-isi"><div class="jm-rgh"><div class="jm-rgh-isi"><p class="jm-baris-no">${esc(t("enb.bag." + b.bagian))}</p><h2 id="lembar-j">${esc(L(b.nama))}</h2>
    <div class="jm-baris-meta">${pilBag(b.bagian)}${pilStat(b.status)}${bukti(b.tingkat_bukti, srcs[0]?.penerbit)}</div></div>
    <div class="jm-rgh-aksi"><button type="button" class="iconbtn" data-aksi="tutup" aria-label="${esc(t("enb.m.tutup"))}">${ikon("tutup", 22)}</button></div></div>
    <div class="jm-rgb"><div class="jm-rgb-kiri">
      <p>${esc(L(b.ringkas))}</p>
      ${b.bagian === "hidrogen" ? `<p><a class="jm-tbl" href="/hidrogen">${ikon("hidrogen", 16)}${esc(t("enb.lihat_h2"))}</a></p>` : ""}
      ${b.angka.length ? `<section><h3>${ikon("grafik", 18)}${esc(t("enb.m.angka"))}</h3><ul class="enb-angka">${b.angka.map((a) => `<li><span>${esc(L(a.label))}</span><b>${N(a.nilai, a.nilai < 10 ? 2 : 0)} ${esc(typeof a.satuan === "object" ? L(a.satuan) : a.satuan)}</b></li>`).join("")}</ul></section>` : ""}
      ${b.linimasa.length ? `<section><h3>${ikon("linimasa", 18)}${esc(t("enb.m.linimasa"))}</h3><ol class="enb-lin-daftar">${b.linimasa.map((l) => `<li><time>${esc(tglTeks(l.tgl))}</time><span>${esc(L(l.teks))}</span></li>`).join("")}</ol></section>` : ""}
      <section><h3>${ikon("buku", 18)}${esc(t("enb.m.sumber"))}</h3><ul class="enb-src">${srcs.map((s) => `<li>${bukti(s.tingkat_bukti, s.penerbit)}${httpOk(s.url) ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.judul)}</a>` : esc(s.judul)}<small>${esc(s.penerbit)}${s.tahun ? ", " + s.tahun : ""}</small></li>`).join("")}</ul></section>
      <p class="jm-rg-diambil">${ikon("kalender", 14)} ${esc(t("enb.m.diperiksa"))} ${esc(tanggal(b.tanggal_periksa))}</p></div>
    <aside class="jm-rgb-kanan"><section class="jm-fakta"><h3>${ikon("info", 18)}${esc(t("enb.m.fakta"))}</h3><dl class="jm-dl">
      ${dd("enb.c.kap", esc(kap))}${dd("enb.c.tahun", b.target_tahun ? esc(String(b.target_tahun)) : "")}
      ${dd("enb.m.lokasi", b.lokasi_teks ? `<span class="enb-lok">${b.prov ? lambang(b.prov) : ""}<span>${esc(b.lokasi_teks)}</span></span>` : "")}
      ${dd("enb.c.pihak", b.pihak.length ? `<ul class="enb-pl">${b.pihak.map((p) => `<li>${p.iso2 ? bendera(p.iso2, 18) : ""}${p.org_id ? tautOrg(p.org_id, p.nama) : `<span>${esc(p.nama)}</span>`}<small>${esc(p.peran)}</small></li>`).join("")}</ul>` : "")}
      ${dd("enb.m.regulasi", b.regulasi.length ? `<ul class="enb-pl">${b.regulasi.map((r) => `<li>${r.id ? tautRegulasi(r.id, r.label) : `<span>${esc(r.label)}</span>`}</li>`).join("")}</ul>` : "")}
      ${dd("enb.m.proyek", b.proyek_ids.length ? `<ul class="enb-pl">${b.proyek_ids.map((p) => `<li>${tautProyek(p)}</li>`).join("")}</ul>` : "")}
      ${dd("enb.m.pltu", (b.pltu_ids || []).length ? `<ul class="enb-pl">${b.pltu_ids.map((p) => `<li><button type="button" class="jm-tbl" data-pltu="${esc(p)}">${ikon("pabrik", 16)}${esc(PL.get(p)?.nama || p)}</button></li>`).join("")}</ul>` : "")}
      ${dd("enb.c.negara", negaraButir(b).length ? `<span class="enb-neg">${negaraButir(b).map((n) => `<span class="enb-neg-i">${bendera(n, 22)}<span>${esc(t("enb.neg." + n))}</span></span>`).join("")}</span>` : "")}
    </dl></section></aside></div></div>`;
  naikkan(dlg);
  if (!dlg.open) dlg.showModal(); dlg.scrollTop = 0;
}

function panelEnergi() {
  const el = $("panelEnergi");
  el.innerHTML = `<p class="enb-def">${ikon("info", 16)}<span>${esc(L(E.meta.definisi))}</span></p>` + kartuBagian()
    + exHtml({ id: "ex-lin", ikon: "linimasa", topik: t("enb.lin.ey"), judulHtml: hlHtml("enb.lin.j", N(E.baris.reduce((s, b) => s + b.linimasa.length, 0))), subHtml: esc(t("enb.lin.sub")), aksiHtml: aksiHtml({ csv: false }), isiHtml: `<div id="enbLin"></div>` })
    + exHtml({ id: "ex-butir", ikon: "tabel", topik: t("enb.tb.ey"), judulHtml: hlHtml("enb.tb.j", N(E.jumlah)), subHtml: esc(t("enb.tb.sub")), aksiHtml: aksiHtml({ csv: true }) + sumberHtml(esc(t("enb.sumber.e", { tanggal: tanggal(E.dibangun_pada) }))),
      isiHtml: `<div class="jm-saring" id="enbESaring"></div><div id="enbEIsi"></div><div class="jm-hal" id="enbEHal"></div>` })
    + exHtml({ id: "ex-negara", ikon: "globe", topik: t("enb.ng.ey"), judulHtml: hlHtml("enb.ng.j", N(E.meta.negara.length)), subHtml: esc(t("enb.ng.sub")), aksiHtml: aksiHtml({ csv: false }), isiHtml: negaraHtml() })
    + `<details class="enb-celah"><summary>${ikon("tanya", 16)}${esc(t("enb.celah"))}</summary><ul>${E.meta.celah.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></details>`;
  saringE_html(); tabelE(); linimasaSvg();
  const tunda = debounce(() => { SE.hal = 1; tabelE(); }, 160);
  const segarkan = () => { SE.hal = 1; saringE_html(); nanti(() => { tabelE(); linimasaSvg(); }); for (const b of el.querySelectorAll("[data-bag]")) b.setAttribute("aria-pressed", String(b.dataset.bag === SE.bag)); for (const b of el.querySelectorAll("[data-neg]")) b.setAttribute("aria-pressed", String(b.dataset.neg === SE.neg)); };
  el.addEventListener("input", (e) => { if (e.target.id === "enbEQ") { SE.q = e.target.value; tunda(); } });
  el.addEventListener("change", (e) => { const k = { enbEFBag: "bag", enbEFSt: "st", enbEFNeg: "neg" }[e.target.id]; if (k) { SE[k] = e.target.value; segarkan(); } });
  el.addEventListener("click", (e) => {
    const ub = e.target.closest("#ex-butir button[data-uk]"); if (ub) { gantiUrut(SE, ub.dataset.uk, ["kap"].includes(ub.dataset.uk)); nanti(tabelE); return; }
    const hp = e.target.closest("#ex-butir [data-hal]"); if (hp) { if (hp.disabled) return; SE.hal = +hp.dataset.hal; sorotHalaman(hp, SE.hal); nanti(() => { tabelE(); $("enbESaring").scrollIntoView({ block: "start" }); }); return; }
    if (e.target.closest("#enbEHapus,[data-aksi=reset]")) { Object.assign(SE, { q: "", bag: "", st: "", neg: "", hal: 1 }); segarkan(); return; }
    const kb = e.target.closest("[data-bag]"); if (kb) { SE.bag = SE.bag === kb.dataset.bag ? "" : kb.dataset.bag; segarkan(); return; }
    const nb = e.target.closest("[data-neg]"); if (nb) { SE.neg = SE.neg === nb.dataset.neg ? "" : nb.dataset.neg; segarkan(); $("ex-butir").scrollIntoView({ block: "start" }); return; }
    const b = e.target.closest("#ex-butir button[data-id]"); if (b) rincianButir(b.dataset.id);
  });
  $("ex-butir").addEventListener("jm:csv", (e) => {
    e.detail.baris = [["id", t("enb.c.butir"), t("enb.c.bagian"), t("enb.c.status"), t("enb.c.kap"), t("enb.c.tahun"), t("enb.c.pihak"), t("enb.c.negara"), t("enb.m.sumber")],
      ...urutE(saringE()).map((b) => [b.id, L(b.nama), t("enb.bag." + b.bagian), t("enb.st." + b.status), b.kapasitas ? `${b.kapasitas.nilai} ${b.kapasitas.satuan}` : "", b.target_tahun ?? "", b.pihak.map((p) => p.nama).join(" | "), negaraButir(b).join(" | "), b.sumber_ids.map((s) => SUMBER_E.get(s)?.url).filter(Boolean).join(" | ")])];
  });
}

/* ================= tab 2: PLTU ================= */
const SP = { q: "", st: "", cap: "", prov: "", ku: "", hal: 1, uk: "mw", ua: -1, pilih: "", pilihKand: "" };
const cocokU = (u) => { const q = norm(SP.q.trim()); return (!SP.st || u.st === SP.st) && (!SP.cap || (SP.cap === "captive") === !!u.captive) && (!SP.prov || u.prov === SP.prov) && (!SP.ku || u.ku === SP.ku || (SP.ku === "tak-diketahui" && u.st !== "operasi")) && (!q || u.cari.includes(q)); };
const unitTerpilih = () => P.unit.filter(cocokU);
const kuU = (u) => (u.st === "operasi" ? u.ku : "tak-diketahui");
function plantTerpilih() {
  const ok = new Set(unitTerpilih().map((u) => u.pid));
  return P.baris.filter((p) => ok.has(p.id));
}
const KP = { plant: (u) => u.pn + " " + (u.u || ""), mw: (u) => u.mw, umur: (u) => u.umur ?? -1, th: (u) => u.th ?? 0, st: (u) => ST_PLTU.indexOf(u.st), prov: (u) => NAMA_PROV[u.prov] || "", pemilik: (u) => u.pemilik?.[0]?.nama || "", co2: (u) => u.co2_gem_jt ?? -1 };
const urutP = (rows) => { const f = KP[SP.uk]; return f ? [...rows].sort((a, b) => urut(f(a), f(b)) * SP.ua) : rows; };
function barisU(u, i) {
  const no = (SP.hal - 1) * HAL + i + 1, o = u.pemilik?.[0];
  const sub = [u.kab, NAMA_PROV[u.prov]].filter(Boolean).join(", ");
  return `<tr><td class="jm-no" data-label="${esc(t("enb.c.no"))}"><span class="jm-rank">${no}</span></td>
    <td class="jm-id-sel" data-label="${esc(t("enb.p.plant"))}"><span class="jm-id"><span><button type="button" data-pid="${esc(u.pid)}"><b>${esc(u.pn)}${u.u ? " " + esc(u.u) : ""}</b></button><small title="${esc(sub)}">${esc(sub)}</small></span></span></td>
    <td class="jm-num" data-label="${esc(t("enb.p.mw"))}">${N(u.mw)}</td>
    <td class="jm-tengah" data-label="${esc(t("enb.p.status"))}"><span class="jm-pil-tek enb-pu enb-pu-${esc(u.st)}">${esc(t("enb.pst." + u.st))}</span></td>
    <td class="jm-num" data-label="${esc(t("enb.p.th"))}">${u.th ?? redup()}</td>
    <td class="jm-tengah" data-label="${esc(t("enb.p.umur"))}">${u.umur != null ? `${pilKu(u.ku)}<small class="enb-umur">${N(u.umur)} ${esc(t("enb.thn"))}</small>` : redup()}</td>
    <td class="jm-tengah" data-label="${esc(t("enb.p.cap"))}"><span class="jm-pil-tek enb-cp enb-cp-${u.captive ? "captive" : "grid"}">${ikon(u.captive ? "industri" : "tek-listrik", 14)}<span>${esc(t(u.captive ? "enb.cap.captive" : "enb.cap.grid"))}</span></span>${u.industri ? `<small class="enb-umur">${esc(u.industri)}</small>` : ""}</td>
    <td class="jm-tengah" data-label="${esc(t("enb.p.prov"))}">${lambang(u.prov)}</td>
    <td data-label="${esc(t("enb.p.pemilik"))}">${o ? (o.org_id ? tautOrg(o.org_id, o.nama) : `<span title="${esc(o.nama)}">${esc(o.nama)}</span>`) : redup()}</td>
    <td class="jm-num" data-label="${esc(t("enb.p.co2"))}">${u.co2_gem_jt != null ? N(u.co2_gem_jt, 2) : redup()}</td></tr>`;
}
function tabelU() {
  const rows = unitTerpilih(), maks = Math.max(1, Math.ceil(rows.length / HAL)); SP.hal = Math.min(SP.hal, maks);
  const potong = urutP(rows).slice((SP.hal - 1) * HAL, SP.hal * HAL);
  $("enbPCount").textContent = t("enb.p.hitung", { n: N(rows.length), total: N(P.unit.length) });
  $("enbPHapus").hidden = !(SP.q || SP.st || SP.cap || SP.prov || SP.ku);
  $("enbUIsi").innerHTML = potong.length
    ? `<div class="jm-gulir"><table class="jm-tabel jm-tabel-tetap enb-tabel" data-urut="tidak"><thead><tr><th class="jm-no">${esc(t("enb.c.no"))}</th>${thUrut(SP, 0, "", "plant", "enb.p.plant")}${thUrut(SP, 0, "jm-num", "mw", "enb.p.mw")}${thUrut(SP, 0, "jm-tengah", "st", "enb.p.status")}${thUrut(SP, 0, "jm-num", "th", "enb.p.th")}${thUrut(SP, 0, "jm-tengah", "umur", "enb.p.umur")}<th class="jm-tengah">${esc(t("enb.p.cap"))}</th>${thUrut(SP, 0, "jm-tengah", "prov", "enb.p.prov")}${thUrut(SP, 0, "", "pemilik", "enb.p.pemilik")}${thUrut(SP, 0, "jm-num", "co2", "enb.p.co2")}</tr></thead><tbody>${potong.map(barisU).join("")}</tbody></table></div>`
    : kosongHtml("enb.kosong", { data: "reset", kunci: "jm.kosong.reset" });
  $("enbUHal").innerHTML = paginasiHtml({ hal: SP.hal, total: rows.length, per: HAL, satuan: "jm.pag.u.data" });
  naikkan($("enbUIsi"));
}
function saringP_html() {
  const hit = (f) => P.unit.reduce((m, u) => (f(u).forEach((k) => m.set(k, (m.get(k) || 0) + 1)), m), new Map());
  const st = hit((u) => [u.st]), pv = hit((u) => [u.prov]), ku = hit((u) => [kuU(u)]);
  $("enbPSaring").innerHTML = cariHtml({ id: "enbPQ", label: t("enb.p.cari") })
    + pilihHtml({ id: "enbPFSt", ikon: "status", label: t("enb.p.f.status"), nilai: SP.st, opsi: [["", t("enb.p.f.status")], ...ST_PLTU.filter((k) => st.has(k)).map((k) => [k, t("enb.pst." + k), "", st.get(k)])] })
    + pilihHtml({ id: "enbPFCap", ikon: "industri", label: t("enb.p.f.cap"), nilai: SP.cap, opsi: [["", t("enb.p.f.cap")], ["grid", t("enb.cap.grid"), "tek-listrik"], ["captive", t("enb.cap.captive"), "industri"]] })
    + pilihHtml({ id: "enbPFProv", ikon: "wilayah", label: t("enb.p.f.prov"), nilai: SP.prov, opsi: [["", t("enb.p.f.prov")], ...P.dampak.provinsi.filter((p) => pv.has(p.kode)).sort((a, b) => a.nama.localeCompare(b.nama, "id")).map((p) => [p.kode, p.nama, "prov:" + p.kode, pv.get(p.kode)])] })
    + pilihHtml({ id: "enbPFKu", ikon: "jam", label: t("enb.p.f.ku"), nilai: SP.ku, opsi: [["", t("enb.p.f.ku")], ...KU.filter((k) => ku.has(k)).map((k) => [k, t("enb.ku." + k), "", ku.get(k)])] })
    + hapusHtml({ id: "enbPHapus", label: t("jm.kosong.reset") }) + `<span class="jm-hitung" id="enbPCount" role="status" aria-live="polite"></span>`;
  $("enbPQ").value = SP.q;
}

/* ---- peta ---- */
let peta = null, petaSiap = false;
const fitur = (rows) => ({ type: "FeatureCollection", features: rows.map((p) => ({ type: "Feature", geometry: { type: "Point", coordinates: [p.lng, p.lat] }, properties: { i: p.i, k: p.ku || "tak-diketahui", mw: p.mw_operasi || p.mw_konstruksi || p.mw_rencana || 1 } })) });
const rAng = ["interpolate", ["linear"], ["sqrt", ["max", ["get", "mw"], 1]], 5, 4, 20, 7, 40, 11, 70, 16];
const kuP = (p) => (p.mw_operasi ? p.ku : "tak-diketahui");
function petaData() { if (peta && petaSiap) { peta.getSource("pl")?.setData(fitur(plantTerpilih())); peta.setFilter("pl-sel", ["==", ["get", "i"], PL.get(SP.pilih)?.i ?? -1]); } }
function pasangLapisan() {
  const il = rapikanPeta(peta);
  peta.addSource("pl", { type: "geojson", data: fitur(plantTerpilih()) });
  peta.addLayer({ id: "pl-titik", type: "circle", source: "pl", paint: { "circle-color": ["match", ["get", "k"], ...KU.slice(0, 4).flatMap((k) => [k, warna(WARNA_KU[k])]), warna("--ink2")], "circle-radius": rAng, "circle-opacity": 0.82, "circle-stroke-color": warna("--card"), "circle-stroke-width": 1.4 } });
  peta.addLayer({ id: "pl-sel", type: "circle", source: "pl", filter: ["==", ["get", "i"], PL.get(SP.pilih)?.i ?? -1], paint: { "circle-color": "rgba(0,0,0,0)", "circle-radius": ["+", rAng, 4], "circle-stroke-color": warna("--sorot"), "circle-stroke-width": 3 } });
  pasangBatas(peta, warna, il, "pl-titik");
}
const padPeta = () => {
  const box = $("enbPeta").getBoundingClientRect(), p = { top: 16, bottom: 16, left: 12, right: 12 };
  if (innerWidth < 1000) return p;
  for (const id of ["enbLapis", "enbPanel"]) {
    const r = $(id).getBoundingClientRect(), tengah = r.left + r.width / 2 - box.left;
    if (tengah < box.width / 2) p.left = Math.max(p.left, r.right - box.left + 16); else p.right = Math.max(p.right, box.right - r.left + 16);
  }
  return p;
};
function tampilTip(p, pt) {
  const tip = $("enbTip");
  tip.innerHTML = `<b>${esc(p.nama)}</b><span>${esc(N(p.mw_operasi || p.mw_konstruksi || p.mw_rencana))} MW, ${esc(t("enb.ku." + kuP(p)))}${p.umur_maks != null ? `, ${esc(N(p.umur_maks))} ${esc(t("enb.thn"))}` : ""}</span>`;
  tip.hidden = false;
  const w = $("enbPeta").clientWidth, tw = tip.offsetWidth, th = tip.offsetHeight;
  tip.style.left = Math.min(Math.max(pt.x + 14, 8), w - tw - 8) + "px"; tip.style.top = Math.max(8, pt.y - th - 14) + "px";
}
function bukaPeta() {
  muatMapLibre().then(() => {
    peta = new maplibregl.Map({ container: "enbPeta", style: gaya(), bounds: BATAS_ID, fitBoundsOptions: { padding: padPeta() }, minZoom: 2, maxZoom: 11, dragRotate: false, pitchWithRotate: false, attributionControl: false });
    peta.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: t("enb.peta.attr") }), "bottom-left");
    peta.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    peta.on("style.load", () => { petaSiap = true; pasangLapisan(); });
    new ResizeObserver(() => peta && peta.resize()).observe($("enbPeta"));
    peta.once("idle", () => { peta.resize(); peta.fitBounds(BATAS_ID, { padding: padPeta(), duration: 0 }); });
    peta.on("click", "pl-titik", (e) => pilihPlant(P.baris[e.features[0].properties.i].id, false));
    peta.on("mousemove", "pl-titik", (e) => { peta.getCanvas().style.cursor = "pointer"; const p = P.baris[e.features[0].properties.i]; if (p) tampilTip(p, e.point); });
    peta.on("mouseleave", "pl-titik", () => { peta.getCanvas().style.cursor = ""; $("enbTip").hidden = true; });
    new MutationObserver(() => { petaSiap = false; peta && peta.setStyle(gaya()); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }).catch(() => { $("enbPeta").innerHTML = `<div class="jm-kosong">${ikon("peringatan", 32)}<p>${esc(t("enb.peta.galat"))}</p></div>`; });
}
function legendaP() {
  const rows = plantTerpilih(), per = {}; for (const p of rows) per[kuP(p)] = (per[kuP(p)] || 0) + 1;
  $("enbLapisIsi").innerHTML = `<p class="enb-leg-j">${esc(t("enb.peta.warna"))}</p><ul class="enb-leg-daftar">${KU.map((k) => `<li><button type="button" class="enb-lb" data-ku="${k}" aria-pressed="${SP.ku === k}"><i class="enb-t enb-k-${k}" aria-hidden="true"></i><span>${esc(t("enb.ku." + k))}</span><b>${N(per[k] || 0)}</b></button></li>`).join("")}</ul><p class="enb-attr">${esc(t("enb.peta.ukuran"))}</p>`;
}
function peringkat() {
  const rows = [...plantTerpilih()].sort((a, b) => (b.mw_operasi || b.mw_konstruksi || 0) - (a.mw_operasi || a.mw_konstruksi || 0)).slice(0, 12);
  return `<ol class="enb-rank">${rows.map((p, i) => `<li><button type="button" class="enb-rank-b" data-pid="${esc(p.id)}"><span class="jm-rank">${i + 1}</span><span class="enb-rank-t"><b>${esc(p.nama)}</b><small>${esc(p.kab || NAMA_PROV[p.prov] || "")}</small></span><span class="enb-mw">${N(p.mw_operasi || p.mw_konstruksi || p.mw_rencana)} MW</span></button></li>`).join("")}</ol>`;
}
function panelRinci() {
  const el = $("enbPanelIsi"), p = PL.get(SP.pilih);
  if (!p) { $("enbPanelJ").firstElementChild.textContent = t("enb.panel"); el.innerHTML = peringkat(); return; }
  $("enbPanelJ").firstElementChild.textContent = t("enb.panel.rinci");
  const us = P.unit.filter((u) => u.pid === p.id), kd = KAND_PID.get(p.id) || [], dd = (k, v) => (v ? `<div><dt>${esc(t(k))}</dt><dd>${v}</dd></div>` : "");
  const pem = [...new Map(us.flatMap((u) => u.pemilik || []).map((o) => [o.nama, o])).values()].slice(0, 4);
  el.innerHTML = `<button type="button" class="jm-tbl enb-kembali" data-aksi="kembali">${ikon("panah-kiri", 16)}${esc(t("enb.panel.kembali"))}</button>
    <h3 class="enb-det-nama">${esc(p.nama)}</h3>
    <div class="enb-det-pil">${pilKu(kuP(p))}<span class="jm-pil-tek enb-cp enb-cp-${p.captive ? "captive" : "grid"}">${ikon(p.captive ? "industri" : "tek-listrik", 14)}<span>${esc(t(p.captive ? "enb.cap.captive" : "enb.cap.grid"))}</span></span>${p.toxic20 ? `<span class="jm-pil-tek enb-t20">${ikon("peringatan", 14)}<span>${esc(t("enb.t20"))}</span></span>` : ""}${kd.map((k) => pilJalur(k.jalur[0])).join("")}</div>
    <dl class="enb-det">
      ${dd("enb.p.mw", `${N(p.mw_operasi)} MW${p.mw_konstruksi ? ` + ${N(p.mw_konstruksi)} MW ${esc(t("enb.pst.konstruksi"))}` : ""}`)}
      ${dd("enb.p.unit", N(p.jumlah_unit))}${dd("enb.p.th", p.th_awal ? String(p.th_awal) : "")}${dd("enb.p.umur", p.umur_maks != null ? `${N(p.umur_maks)} ${esc(t("enb.thn"))}` : "")}
      ${dd("enb.p.prov", `${lambang(p.prov)}${p.kab ? `<small class="enb-umur">${esc(p.kab)}</small>` : ""}`)}
      ${dd("enb.p.pemilik", pem.length ? `<ul class="enb-pl">${pem.map((o) => `<li>${o.org_id ? tautOrg(o.org_id, o.nama) : `<span>${esc(o.nama)}</span>`}${o.persen ? `<small>${N(o.persen, 1)}%</small>` : ""}</li>`).join("")}</ul>` : "")}
      ${dd("enb.p.emisi", p.emisi_ct_t != null ? `${N(p.emisi_ct_t / 1e6, 2)} ${esc(t("enb.jt"))} ${bukti("est", "Climate TRACE")}` : "")}
      ${dd("enb.p.co2", p.co2_gem_jt != null ? `${N(p.co2_gem_jt, 2)} ${esc(t("enb.jt"))} ${bukti("est", "Global Energy Monitor")}` : "")}
    </dl>
    <table class="jm-tabel enb-mini" data-urut="tidak"><thead><tr><th>${esc(t("enb.p.unit1"))}</th><th class="jm-num">${esc(t("enb.p.mw"))}</th><th class="jm-num">${esc(t("enb.p.th"))}</th><th>${esc(t("enb.p.status"))}</th></tr></thead><tbody>${us.map((u) => `<tr><td>${esc(u.u || "-")}</td><td class="jm-num">${N(u.mw)}</td><td class="jm-num">${u.th ?? "-"}</td><td>${esc(t("enb.pst." + u.st))}</td></tr>`).join("")}</tbody></table>
    ${kd.length ? `<p class="enb-bantu">${esc(t("enb.panel.kand", { n: N(kd.length) }))}</p>` : ""}
    <p class="enb-tautan">${us[0]?.wiki ? `<a class="jm-tbl" href="${esc(us[0].wiki)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}${esc(t("enb.panel.gem"))}</a>` : ""}</p>`;
  naikkan(el);
}
function pilihPlant(pid, fokus) {
  SP.pilih = pid; panelRinci(); petaData();
  const p = PL.get(pid);
  if (fokus && peta && p) peta.flyTo({ center: [p.lng, p.lat], zoom: Math.max(peta.getZoom(), 7), padding: padPeta(), duration: 600 });
  $("enbPanel").open = true;
}

/* ---- grafik umur dan provinsi ---- */
function grafikUmur() {
  const el = $("enbGUmur"); if (!el) return;
  const us = unitTerpilih().filter((u) => u.st === "operasi"), kel = ["u0", "u10", "u20", "u30"];
  const v = kel.map((k) => ({ k, grid: us.filter((u) => u.ku === k && !u.captive).reduce((s, u) => s + u.mw, 0), cap: us.filter((u) => u.ku === k && u.captive).reduce((s, u) => s + u.mw, 0) }));
  const W = Math.max(el.clientWidth || 420, 300), H = 260, M = { a: 14, k: 56, b: 34, r: 8 }, mx0 = Math.max(1, ...v.map((d) => d.grid + d.cap)), mag = 10 ** Math.floor(Math.log10(mx0)), lang = [1, 2, 2.5, 5, 10].find((k) => k * mag * 4 >= mx0) * mag, mx = lang * 4;
  const pw = W - M.k - M.r, ph = H - M.a - M.b, sl = pw / kel.length, bw = Math.min(64, sl * 0.62), y = (a) => M.a + ph - (a / mx) * ph;
  let g = ""; for (let i = 0; i <= 4; i++) g += `<line class="enb-grid" x1="${M.k}" x2="${W - M.r}" y1="${y(i * lang)}" y2="${y(i * lang)}"/><text class="enb-tx" x="${M.k - 8}" y="${y(i * lang) + 4}" text-anchor="end">${esc(N((i * lang) / 1000, 0))}</text>`;
  v.forEach((d, i) => {
    const x = M.k + sl * i + (sl - bw) / 2, hg = (d.grid / mx) * ph, hc = (d.cap / mx) * ph, base = M.a + ph, tot = d.grid + d.cap;
    const tip = (lab, a) => `${t("enb.ku." + d.k)} | ${lab}: ${N(a)} MW | ${t("enb.g.tot")}: ${N(tot)} MW`;
    g += `<path class="enb-seg enb-s-grid" d="M${x} ${base}v${-hg}h${bw}v${hg}z" data-tip="${esc(tip(t("enb.cap.grid"), d.grid))}"/><path class="enb-seg enb-s-cap" d="M${x} ${base - hg}v${-hc}h${bw}v${hc}z" data-tip="${esc(tip(t("enb.cap.captive"), d.cap))}"/>`;
    g += `<text class="enb-tx" x="${x + bw / 2}" y="${H - 10}" text-anchor="middle">${esc(t("enb.ku." + d.k))}</text>`;
  });
  el.innerHTML = `<svg class="jm-gx enb-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("enb.g.umur.label"))}">${g}</svg><ul class="enb-leg"><li><i class="enb-s-grid" aria-hidden="true"></i>${esc(t("enb.cap.grid"))}</li><li><i class="enb-s-cap" aria-hidden="true"></i>${esc(t("enb.cap.captive"))}</li></ul>`;
}
function batangProv(el, rows, nilai, fmt, kls, labelKunci) {
  const W = Math.max(el.clientWidth || 420, 300), rh = 30, M = { k: 130, r: 150 }, H = rows.length * rh + 6, mx = Math.max(1, ...rows.map(nilai));
  const g = rows.map((p, i) => { const w = Math.max(2, ((W - M.k - M.r) * nilai(p)) / mx), cy = 3 + i * rh; return `<g data-tip="${esc(`${p.nama} | ${t(labelKunci)}: ${fmt(nilai(p))}`)}"><text class="enb-tx" x="${M.k - 8}" y="${cy + 19}" text-anchor="end">${esc(p.nama)}</text><rect class="${kls}" x="${M.k}" y="${cy + 4}" width="${w.toFixed(1)}" height="${rh - 10}" rx="4"/><text class="enb-tx enb-tx-v" x="${M.k + w + 6}" y="${cy + 19}">${esc(fmt(nilai(p)))}</text></g>`; }).join("");
  el.innerHTML = `<svg class="jm-gx enb-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t(labelKunci))}">${g}</svg>`;
}
function grafikProv() {
  const el = $("enbGProv"); if (!el) return;
  const us = unitTerpilih().filter((u) => u.st === "operasi"), per = new Map(); for (const u of us) per.set(u.prov, (per.get(u.prov) || 0) + u.mw);
  const rows = [...per].map(([k, mw]) => ({ nama: NAMA_PROV[k] || k, mw })).sort((a, b) => b.mw - a.mw).slice(0, 10);
  batangProv(el, rows, (p) => p.mw, (v) => `${N(v)} MW`, "enb-bar enb-bar-mw", "enb.g.prov");
}

/* ---- kandidat pensiun ---- */
const SK = { jalur: "", hal: 1 };
function kandidatHtml() {
  const kunci = P.kandidat.filter((k) => k.jalur.includes("jetp"));
  const kartu = kunci.map((k) => `<article class="enb-kand"><header><h3>${esc(k.nama)}</h3><div class="enb-det-pil">${k.jalur.map(pilJalur).join("")}<span class="jm-pil-st enb-st enb-st-${k.status === "dibatalkan" ? "bad" : "info"}">${esc(t("enb.ks." + k.status))}</span>${bukti(k.tingkat_bukti, "")}</div></header>
    <p>${esc(L(k.catatan))}</p><dl class="enb-det"><div><dt>${esc(t("enb.p.mw"))}</dt><dd>${N(k.mw)} MW</dd></div><div><dt>${esc(t("enb.k.target"))}</dt><dd>${k.tahun_target ?? "-"}${k.tahun_asal ? ` <small class="enb-umur">${esc(t("enb.k.asal", { th: k.tahun_asal }))}</small>` : ""}</dd></div>
    <div><dt>${esc(t("enb.m.regulasi"))}</dt><dd>${k.regulasi.map((r) => tautRegulasi(r)).join(" ")}</dd></div></dl>
    <p class="enb-tautan">${k.sumber_ids.map((s) => SUMBER_P.get(s)).filter(Boolean).map((s) => `<a class="jm-tbl" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}${esc(s.penerbit)}</a>`).join(" ")}<button type="button" class="jm-tbl" data-pid="${esc(k.pid)}">${ikon("peta", 16)}${esc(t("enb.k.peta"))}</button></p></article>`).join("");
  return `<div class="enb-kand-grid">${kartu}</div><div class="jm-saring" id="enbKSaring">${pilihHtml({ id: "enbKFJ", ikon: "bendera", label: t("enb.k.f"), nilai: SK.jalur, opsi: [["", t("enb.k.f")], ...JALUR.map((j) => [j, t("enb.jl." + j), j === "usia" ? "jam" : j === "gem" ? "tabel" : "bendera", P.kandidat.filter((k) => k.jalur.includes(j)).length])] })}</div><div id="enbKIsi"></div><div class="jm-hal" id="enbKHal"></div>`;
}
function tabelK() {
  const rows = P.kandidat.filter((k) => !SK.jalur || k.jalur.includes(SK.jalur)), maks = Math.max(1, Math.ceil(rows.length / HAL)); SK.hal = Math.min(SK.hal, maks);
  const potong = rows.slice((SK.hal - 1) * HAL, SK.hal * HAL);
  $("enbKIsi").innerHTML = `<div class="jm-gulir"><table class="jm-tabel jm-tabel-tetap enb-tabel" data-urut="tidak"><thead><tr><th>${esc(t("enb.p.plant"))}</th><th class="jm-num">${esc(t("enb.p.mw"))}</th><th class="jm-tengah">${esc(t("enb.k.jalur"))}</th><th class="jm-tengah">${esc(t("enb.p.status"))}</th><th class="jm-num">${esc(t("enb.k.target"))}</th></tr></thead><tbody>${potong.map((k) => `<tr><td class="jm-id-sel" data-label="${esc(t("enb.p.plant"))}"><span class="jm-id"><span><button type="button" data-pid="${esc(k.pid)}"><b>${esc(k.nama)}</b></button></span></span></td><td class="jm-num" data-label="${esc(t("enb.p.mw"))}">${N(k.mw)}</td><td class="jm-tengah" data-label="${esc(t("enb.k.jalur"))}">${k.jalur.map(pilJalur).join("")}</td><td class="jm-tengah" data-label="${esc(t("enb.p.status"))}">${esc(t("enb.ks." + k.status))}</td><td class="jm-num" data-label="${esc(t("enb.k.target"))}">${k.tahun_target ?? redup()}</td></tr>`).join("")}</tbody></table></div>`;
  $("enbKHal").innerHTML = paginasiHtml({ hal: SK.hal, total: rows.length, per: HAL, satuan: "jm.pag.u.data" });
}

let pltuSiap = false;
function panelPltu() {
  if (pltuSiap) { dispatchEvent(new Event("resize")); return; }
  pltuSiap = true;
  const el = $("panelPltu"), m = P.meta;
  el.innerHTML = exHtml({ id: "ex-peta", ikon: "peta", topik: t("enb.peta.ey"), judulHtml: hlHtml("enb.peta.j", N(m.jumlah_pembangkit)), subHtml: esc(t("enb.peta.sub", { mw: N(m.mw_captive_operasi / 1000, 1) })), aksiHtml: aksiHtml({ csv: false, pdf: false }) + sumberHtml(esc(t("enb.sumber.p", { tanggal: tanggal(P.dibangun_pada) }))),
    isiHtml: `<div class="jm-saring" id="enbPSaring"></div><div class="enb-peta" id="enbPetaWadah"><div id="enbPeta" class="enb-kanvas" role="application" aria-label="${esc(t("enb.peta.label"))}"></div><div id="enbTip" class="enb-tip" role="status" hidden></div>
      <details class="enb-lapis" id="enbLapis" open><summary><span>${esc(t("enb.peta.lapis"))}</span></summary><div class="enb-lapis-isi" id="enbLapisIsi"></div></details>
      <details class="enb-panel" id="enbPanel" open><summary id="enbPanelJ"><span>${esc(t("enb.panel"))}</span></summary><div class="enb-panel-isi" id="enbPanelIsi" aria-live="polite"></div></details></div>` })
    + exHtml({ id: "ex-grafik", ikon: "grafik", topik: t("enb.g.ey"), judulHtml: hlHtml("enb.g.j", N(m.umur_rata_tertimbang, 1)), subHtml: esc(t("enb.g.sub")), aksiHtml: aksiHtml({ csv: false }), isiHtml: `<div class="enb-dua"><div><h3 class="enb-h3">${esc(t("enb.g.umur"))}</h3><div id="enbGUmur"></div></div><div><h3 class="enb-h3">${esc(t("enb.g.prov"))}</h3><div id="enbGProv"></div></div></div>` })
    + exHtml({ id: "ex-kand", ikon: "peringatan", topik: t("enb.k.ey"), judulHtml: hlHtml("enb.k.j", N(P.kandidat.length)), subHtml: esc(t("enb.k.sub")), aksiHtml: aksiHtml({ csv: false }), isiHtml: kandidatHtml() })
    + exHtml({ id: "ex-unit", ikon: "tabel", topik: t("enb.u.ey"), judulHtml: hlHtml("enb.u.j", N(m.jumlah_unit)), subHtml: esc(t("enb.u.sub", { n: N(m.dibatalkan_dikecualikan) })), aksiHtml: aksiHtml({ csv: true }) + sumberHtml(esc(t("enb.sumber.p", { tanggal: tanggal(P.dibangun_pada) }))),
      isiHtml: `<div id="enbUIsi"></div><div class="jm-hal" id="enbUHal"></div>` });
  saringP_html(); legendaP(); panelRinci(); tabelU(); tabelK(); grafikUmur(); grafikProv(); bukaPeta();
  if (innerWidth >= 1000) { geserPanel($("enbLapis"), { kunci: "lapis" }); geserPanel($("enbPanel"), { kunci: "panel" }); }
  const tunda = debounce(() => { SP.hal = 1; berat(); }, 160);
  const berat = () => { petaData(); legendaP(); grafikUmur(); grafikProv(); tabelU(); if (SP.pilih && !PL.get(SP.pilih)) { SP.pilih = ""; } panelRinci(); };
  el.addEventListener("input", (e) => { if (e.target.id === "enbPQ") { SP.q = e.target.value; tunda(); } });
  el.addEventListener("change", (e) => {
    const k = { enbPFSt: "st", enbPFCap: "cap", enbPFProv: "prov", enbPFKu: "ku" }[e.target.id];
    if (k) { SP[k] = e.target.value; SP.hal = 1; $("enbPHapus").hidden = false; nanti(berat); return; }
    if (e.target.id === "enbKFJ") { SK.jalur = e.target.value; SK.hal = 1; nanti(tabelK); }
  });
  el.addEventListener("click", (e) => {
    const ub = e.target.closest("#ex-unit button[data-uk]"); if (ub) { gantiUrut(SP, ub.dataset.uk, !["plant", "prov", "pemilik", "st"].includes(ub.dataset.uk)); nanti(tabelU); return; }
    const hp = e.target.closest("#ex-unit [data-hal]"); if (hp) { if (hp.disabled) return; SP.hal = +hp.dataset.hal; sorotHalaman(hp, SP.hal); nanti(() => { tabelU(); $("ex-unit").scrollIntoView({ block: "start" }); }); return; }
    const hk = e.target.closest("#ex-kand [data-hal]"); if (hk) { if (hk.disabled) return; SK.hal = +hk.dataset.hal; sorotHalaman(hk, SK.hal); nanti(tabelK); return; }
    if (e.target.closest("#enbPHapus,#ex-unit [data-aksi=reset]")) { Object.assign(SP, { q: "", st: "", cap: "", prov: "", ku: "", hal: 1 }); saringP_html(); nanti(berat); return; }
    const lb = e.target.closest("[data-ku]"); if (lb) { SP.ku = SP.ku === lb.dataset.ku ? "" : lb.dataset.ku; SP.hal = 1; $("enbPFKu").value = SP.ku; for (const b of el.querySelectorAll("[data-ku]")) b.setAttribute("aria-pressed", String(b.dataset.ku === SP.ku)); $("enbPHapus").hidden = false; nanti(berat); return; }
    if (e.target.closest("[data-aksi=kembali]")) { SP.pilih = ""; panelRinci(); petaData(); return; }
    const pb = e.target.closest("button[data-pid]"); if (pb) { pilihPlant(pb.dataset.pid, true); $("ex-peta").scrollIntoView({ block: "start" }); }
  });
  $("ex-unit").addEventListener("jm:csv", (e) => {
    e.detail.baris = [["id", t("enb.p.plant"), t("enb.p.mw"), t("enb.p.status"), t("enb.p.th"), t("enb.p.umur"), t("enb.p.cap"), t("enb.p.prov"), t("enb.p.kab"), t("enb.p.pemilik"), "lat", "lng", t("enb.p.co2")],
      ...urutP(unitTerpilih()).map((u) => [u.id, `${u.pn} ${u.u || ""}`.trim(), u.mw, t("enb.pst." + u.st), u.th ?? "", u.umur ?? "", t(u.captive ? "enb.cap.captive" : "enb.cap.grid"), NAMA_PROV[u.prov] || "", u.kab || "", (u.pemilik || []).map((o) => o.nama).join(" | "), u.lat, u.lng, u.co2_gem_jt ?? ""])];
  });
}

/* ================= tab 3: dampak ================= */
const SD = { uk: "kematian", ua: -1 };
function panelDampak() {
  const el = $("panelDampak"); if (el.dataset.siap) return; el.dataset.siap = "1";
  const dn = P.dampak.nasional, prov = P.dampak.provinsi;
  const ubin = dn.map((n) => { const s = SUMBER_P.get(n.sumber_id); return `<li class="enb-ubin"><p class="enb-ubin-a"><b>${N(n.nilai, n.nilai < 100 ? 1 : 0)}</b><span>${esc(L(n.satuan))}</span></p><p class="enb-ubin-l">${esc(L(n.label))}</p><p class="enb-ubin-c">${esc(L(n.catatan))}</p><p class="enb-ubin-s">${bukti(s?.tingkat_bukti, s?.penerbit)}<a href="${esc(s?.url)}" target="_blank" rel="noopener noreferrer">${esc(s?.penerbit)}, ${n.tahun_data}</a></p></li>`; }).join("");
  const t20 = P.dampak.toxic20_nama.map((n) => { const p = P.baris.find((b) => b.toxic20 && norm(b.nama).includes(norm(n))); return p ? `<li><button type="button" class="enb-chip" data-pid="${esc(p.id)}">${ikon("pabrik", 14)}<span>${esc(p.nama)}</span></button></li>` : ""; }).join("");
  el.innerHTML = exHtml({ id: "ex-dampak", ikon: "peringatan", topik: t("enb.d.ey"), judulHtml: hlHtml("enb.d.j", N(dn[0].nilai)), subHtml: esc(t("enb.d.sub")), aksiHtml: aksiHtml({ csv: false }), isiHtml: `<ul class="enb-ubin-daftar">${ubin}</ul>` })
    + exHtml({ id: "ex-d-prov", ikon: "wilayah", topik: t("enb.dp.ey"), judulHtml: hlHtml("enb.dp.j", N(prov.length)), subHtml: esc(t("enb.dp.sub")), aksiHtml: aksiHtml({ csv: true }),
      isiHtml: `<p class="enb-est">${bukti("est", "METI")}<span>${esc(t("enb.dp.est"))}</span></p><div class="enb-dua"><div><h3 class="enb-h3">${esc(t("enb.dp.g1"))}</h3><div id="enbDG1"></div></div><div><h3 class="enb-h3">${esc(t("enb.dp.g2"))}</h3><div id="enbDG2"></div></div></div><div id="enbDTabel"></div>` })
    + exHtml({ id: "ex-t20", ikon: "pabrik", topik: t("enb.t20.ey"), judulHtml: hlHtml("enb.t20.j", N(t20.split("<li>").length - 1)), subHtml: esc(t("enb.t20.sub")), aksiHtml: aksiHtml({ csv: false }), isiHtml: `<ul class="enb-chips">${t20}</ul>` })
    + `<details class="enb-celah" open><summary>${ikon("info", 16)}${esc(t("enb.d.metode"))}</summary><p>${esc(t("enb.d.metode.isi"))}</p><p class="enb-tautan">${P.sumber.filter((s) => s.id.startsWith("crea")).map((s) => `<a class="jm-tbl" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}${esc(s.penerbit)}, ${s.tahun || ""}</a>`).join(" ")}</p></details>`;
  const top = [...prov].sort((a, b) => b.kematian_est - a.kematian_est).slice(0, 10);
  batangProv($("enbDG1"), top, (p) => p.kematian_est, (v) => `${N(v)} ${t("enb.jiwa")} (EST)`, "enb-bar enb-bar-mati", "enb.dp.g1");
  batangProv($("enbDG2"), [...prov].sort((a, b) => b.emisi_ct_t - a.emisi_ct_t).slice(0, 10), (p) => p.emisi_ct_t / 1e6, (v) => `${N(v, 1)} ${t("enb.jt")}`, "enb-bar enb-bar-co2", "enb.dp.g2");
  const tabel = () => {
    const rows = [...prov].sort((a, b) => { const f = { nama: (p) => p.nama, mw: (p) => p.mw_operasi, cap: (p) => p.mw_captive, emisi: (p) => p.emisi_ct_t, kematian: (p) => p.kematian_est, biaya: (p) => p.biaya_est_musd }[SD.uk]; return urut(f(a), f(b)) * SD.ua; });
    const th = (k, kls, kunci) => `<th class="${kls}" aria-sort="${SD.uk === k ? (SD.ua > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-dk="${k}">${esc(t(kunci))}</button></th>`;
    $("enbDTabel").innerHTML = `<div class="jm-gulir"><table class="jm-tabel jm-tabel-tetap enb-tabel" data-urut="tidak"><thead><tr>${th("nama", "", "enb.p.prov")}${th("mw", "jm-num", "enb.dp.mw")}${th("cap", "jm-num", "enb.dp.cap")}${th("emisi", "jm-num", "enb.dp.emisi")}${th("kematian", "jm-num", "enb.dp.mati")}${th("biaya", "jm-num", "enb.dp.biaya")}</tr></thead><tbody>${rows.map((p) => `<tr><td data-label="${esc(t("enb.p.prov"))}">${lambang(p.kode)}</td><td class="jm-num" data-label="${esc(t("enb.dp.mw"))}">${N(p.mw_operasi)}</td><td class="jm-num" data-label="${esc(t("enb.dp.cap"))}">${p.mw_captive ? N(p.mw_captive) : redup()}</td><td class="jm-num" data-label="${esc(t("enb.dp.emisi"))}">${p.emisi_ct_t ? N(p.emisi_ct_t / 1e6, 2) : redup()}</td><td class="jm-num" data-label="${esc(t("enb.dp.mati"))}">${N(p.kematian_est)} ${bukti("est", "METI")}</td><td class="jm-num" data-label="${esc(t("enb.dp.biaya"))}">${N(p.biaya_est_musd)}</td></tr>`).join("")}</tbody></table></div>`;
  };
  tabel();
  el.addEventListener("click", (e) => {
    const u = e.target.closest("button[data-dk]"); if (u) { const k = u.dataset.dk; SD.ua = SD.uk === k ? -SD.ua : k === "nama" ? 1 : -1; SD.uk = k; nanti(tabel); return; }
    const pb = e.target.closest("button[data-pid]"); if (pb) { location.hash = "pltu"; nanti(() => { pilihPlant(pb.dataset.pid, true); $("ex-peta")?.scrollIntoView({ block: "start" }); }); }
  });
  $("ex-d-prov").addEventListener("jm:csv", (e) => { e.detail.baris = [["kode", t("enb.p.prov"), t("enb.dp.mw"), t("enb.dp.cap"), t("enb.dp.emisi"), t("enb.dp.mati") + " (EST)", t("enb.dp.biaya") + " (EST)"], ...prov.map((p) => [p.kode, p.nama, p.mw_operasi, p.mw_captive, p.emisi_ct_t ? +(p.emisi_ct_t / 1e6).toFixed(2) : "", p.kematian_est, p.biaya_est_musd])]; });
}

/* ================= mulai ================= */
kepala();
const dlg = $("lembar");
dlg.addEventListener("click", (e) => {
  if (e.target === dlg || e.target.closest("[data-aksi=tutup]")) { dlg.close(); return; }
  const pb = e.target.closest("[data-pltu]"); if (pb) { dlg.close(); location.hash = "pltu"; nanti(() => { pilihPlant(pb.dataset.pltu, true); $("ex-peta")?.scrollIntoView({ block: "start" }); }); }
});
panelEnergi();
tabHalaman("tabHal", { label: "enb.tab.label", tab: [
  { k: "energi", ikon: "tek-panas", teks: "enb.tab.energi", panel: "panelEnergi", muat: async () => { linimasaSvg(); } },
  { k: "pltu", ikon: "pabrik", teks: "enb.tab.pltu", panel: "panelPltu", muat: async () => panelPltu() },
  { k: "dampak", ikon: "peringatan", teks: "enb.tab.dampak", panel: "panelDampak", muat: async () => panelDampak() },
] });
saatBahasa(() => { location.reload(); });
