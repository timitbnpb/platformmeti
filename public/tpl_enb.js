/* /transisi-pltu, tab "Energi baru lain" (menggantikan /energi-baru): butir energi baru dari energi_baru.json (nuklir, hidrogen dan amonia, CBM, DME, co-firing)
   dengan status, linimasa, pihak, regulasi, sumber. Inventaris PLTU dan dampaknya ada di tab Armada dan Emisi. Dimuat malas oleh transisi-pltu.js (mulai(panel)).
   Data /data/energi_baru.json dan /data/pltu.json dibaca lewat tpl_umum.js. INP: saringan menyalakan chrome seketika, isi berat menyusul lewat nanti(). */
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
import "/inti/tip_grafik.js";

import { B } from "/tpl_umum.js";

let PAN, E, P, SUMBER_E, PL;
const $ = (id) => PAN.querySelector("#" + id);
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

let NAMA_PROV = {};
/* ================= tab 1: energi baru ================= */
const SE = { q: "", bag: "", st: "", neg: "", hal: 1, uk: "bagian", ua: 1 };
const teksButir = (b) => norm([L(b.nama), L(b.ringkas), b.lokasi_teks, ...(b.pihak || []).map((p) => p.nama)].join(" "));
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
      ${b.bagian === "cofiring" ? `<p><a class="jm-tbl" href="/sampah-energi?tab=jalur">${ikon("sampah-energi", 16)}${esc(t("swe.ln.enb"))}</a></p>` : ""}
      ${b.bagian === "nuklir" ? `<p><a class="jm-tbl" href="/nuklir">${ikon("nuklir", 16)}${esc(t("enb.lihat_nkl"))}</a></p>` : ""}
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
  const el = PAN;
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


export async function mulai(panel) {
  PAN = panel; panel.classList.add("enb-halaman"); E = B.enb; P = B.pltu;
  if (!E) { panel.innerHTML = galatHtml("layanan"); return; }
  await siapTautan("org", "regulasi", "proyek");
  SUMBER_E = new Map(E.sumber.map((s) => [s.id, s]));
  PL = new Map((P?.baris || []).map((p) => [p.id, p]));
  E.baris.forEach((b) => { b._cari = teksButir(b); });
  panelEnergi();
  PAN.insertAdjacentHTML("beforeend", '<dialog class="jm-lembar" id="lembar" aria-labelledby="lembar-j"></dialog>');
  const dlg = $("lembar");
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg || e.target.closest("[data-aksi=tutup]")) { dlg.close(); return; }
    const pb = e.target.closest("[data-pltu]"); if (pb) { dlg.close(); document.querySelector("#tplTab [data-tab=armada]")?.click(); }
  });
}
