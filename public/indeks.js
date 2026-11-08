/* /indeks: indeks kesiapan provinsi + kesehatan proyek (Hipotesis). Data statis /data/indeks.json dari scripts/pipa/indeks.mjs.
   Tab Provinsi/Proyek (tabel .jm-tabel, urut global dari komponen.js), peta koroplet, popup rincian, bagian Metode + unduh JSON. */
import { mulaiHalaman } from "/inti/kepala.js";
import { geoProvinsi, jalurPerProvinsi } from "/inti/peta_indonesia.js";
import { exHtml, sumberHtml } from "/inti/komponen.js";
import "/inti/tip_grafik.js";
import { t, tanggal } from "/i18n.js";
import { esc, ikon, nanti, hantuHtml } from "/inti/umum.js";
import { susunKajian } from "/indeks_kajian.js";
import { logoOrgSatu } from "/inti/logo_org.js";
import { pilTek, pilStatus, ikonTek } from "/inti/ikon_tek.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import "/inti/galat_gambar.js";
import { muatData, tampilGalat, ubinHtml, pil, num, saatBahasa, teksStatus } from "/analisis.js";

const $ = (id) => document.getElementById(id);
const SATUAN = { potensi: "MW", terpasang: "MW", elektrifikasi: "%", bpp: "Rp/kWh", ruptl: "MW", plts_atap: "MW" };
const S = { d: null, geo: null, tab: "provinsi", saring: "semua", pel: null, pj: new Map() };

const kelasSkor = (s) => (s === null ? "" : s >= 70 ? "ix-s-t" : s >= 40 ? "ix-s-s" : "ix-s-r");
const lencana = (s) => `<span class="ix-skor ${kelasSkor(s)}">${s === null ? esc(t("an.tanpa_data")) : esc(num(s, 1))}</span>`;
const gabung = (a) => a.filter(Boolean).join(" ");
const kuintil = (s) => Math.min(4, Math.floor(s / 20));

function mentahTeks(id, k) {
  if (k.skor === null) return `<span class="ix-kosong-sel">${esc(t("ix.p.kosong"))}</span>`;
  if (id === "rued") return esc(t("ix.ada"));
  return esc(num(k.mentah, id === "elektrifikasi" ? 2 : Number.isInteger(k.mentah) ? 0 : 1) + (SATUAN[id] ? " " + SATUAN[id] : ""));
}
const alasanTeks = (al, kosong = t("ix.a.bersih")) => al.map((a) => t("ix.a." + a.k, { n: a.n, f: (a.f || []).map((x) => t("ix.f." + x)).join(", ") })).join("; ") || kosong;

const KAT = { bermasalah: "jm-pil jm-pil-bad", data_tipis: "jm-pil ix-pil-netral", sehat: "jm-pil jm-pil-ok" };
const pilKat = (k) => `<span class="${KAT[k]}">${esc(t("ix.cat." + k))}</span>`;

/* ---------- popup ---------- */
const IKX = { potensi: "tek-surya", terpasang: "centang", elektrifikasi: "tek-listrik", bpp: "kalkulator", ruptl: "daftar", proyek: "proyek", organisasi: "gedung", rued: "regulasi", plts_atap: "tek-surya", wkp: "tek-panas" };
const median = (a) => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : null; };
const medKomp = (id) => median(S.d.provinsi.map((p) => p.komponen[id]?.skor).filter((v) => typeof v === "number"));
const medSkor = () => median(S.d.provinsi.filter((p) => p.peringkat).map((p) => p.skor));
const selisih = (d) => (d >= 0 ? "+" : "-") + num(Math.abs(d), 1);
const labelK = (id) => `<span class="ix-ik-k">${ikon(IKX[id] || "info", 16)}<span>${esc(t("ix.k." + id))}</span></span>`;
const lambang = (kode, u) => `<img class="ix-lamb" src="/img/provinsi/${esc(kode)}.png" width="${u}" height="${u}" alt="" data-galat="hapus" loading="lazy">`;
const kelasLeng = (v) => (v >= 0.9 ? "jm-pil-ok" : v >= S.d.metode.min_lengkap ? "jm-pil-warn" : "jm-pil-bad");
const jmlRank = () => S.d.provinsi.filter((x) => x.peringkat).length;

function dialog() {
  let d = $("ixDlg");
  if (d) return d;
  d = document.createElement("dialog");
  d.id = "ixDlg"; d.className = "ix-dlg"; d.setAttribute("aria-labelledby", "ixDlgJ");
  document.body.append(d);
  d.addEventListener("click", (e) => {
    if (e.target === d || e.target.closest("[data-tutup]")) return d.close();
    const u = e.target.closest("button[data-urutk]"); if (u && d._baris) urutKomp(d, u.dataset.urutk);
  });
  return d;
}
const tabelPop = (kolom, baris, judul = "") => `${judul ? `<h3>${esc(judul)}</h3>` : ""}<div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr>${kolom.map((c) => `<th>${esc(t(c))}</th>`).join("")}</tr></thead><tbody>${baris.map((r) => `<tr>${r.map((c, i) => `<td data-label="${esc(t(kolom[i]))}"${i ? ' class="jm-num"' : ""}>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const tutupHtml = () => `<button type="button" class="ix-dlg-x" data-tutup aria-label="${esc(t("jm.tutup"))}">${ikon("tutup", 20)}</button>`;
function bukaPopup(judul, subHtml, isiHtml, tautan, kepala) {
  const d = dialog(); d._baris = null;
  d.innerHTML = (kepala || `<div class="ix-dlg-kep"><div><h2 id="ixDlgJ">${esc(judul)}</h2><p>${subHtml}</p></div>${tutupHtml()}</div>`) + isiHtml + `<div class="ix-dlg-aksi">${tautan}</div>`;
  d.showModal();
  return d;
}

/* tabel komponen provinsi: urut diklik, baris tanpa data redup (titik tengah/em dash tidak dipakai) */
const KOLOM = [["label", "ix.p.komponen", ""], ["mentah", "ix.p.mentah", "jm-num"], ["skor", "ix.p.norma", "jm-tengah"], ["kontrib", "ix.p.kontrib", "jm-num"], ["bobot", "ix.p.bobot", "jm-num"]];
function barisKomp(r) {
  const ada = r.k.skor !== null, tip = ada ? "" : ` title="${esc(t("ix.p.kosong"))}"`;
  const L = (i) => esc(t(KOLOM[i][1]));
  return `<tr class="${ada ? "" : "ix-redup"}"${tip}><td data-label="${L(0)}">${labelK(r.id)}</td><td class="jm-num" data-label="${L(1)}">${ada ? mentahTeks(r.id, r.k) : '<span class="ix-kosong-sel">-</span>'}</td><td class="jm-tengah" data-label="${L(2)}">${lencana(r.k.skor)}</td><td class="jm-num" data-label="${L(3)}">${ada ? esc(num(r.kontrib, 1)) : "-"}</td><td class="jm-num" data-label="${L(4)}">${esc(num(r.bobot))}%</td></tr>`;
}
function urutKomp(d, kunci) {
  const arah = d._urut?.[0] === kunci && d._urut[1] === 1 ? -1 : 1; d._urut = [kunci, arah];
  const nilai = (r) => (kunci === "label" ? t("ix.k." + r.id) : kunci === "mentah" ? r.k.mentah : kunci === "skor" ? r.k.skor : r[kunci]);
  d._baris.sort((a, b) => { const x = nilai(a), y = nilai(b); if (x === null || x === undefined) return 1; if (y === null || y === undefined) return -1; return (typeof x === "string" ? x.localeCompare(y) : x - y) * arah; });
  d.querySelector(".ix-pt tbody").innerHTML = d._baris.map(barisKomp).join("");
  d.querySelectorAll(".ix-pt th").forEach((th) => th.setAttribute("aria-sort", th.dataset.k === kunci ? (arah === 1 ? "ascending" : "descending") : "none"));
}
function ringkas(p) {
  const med = medSkor(), ada = Object.entries(p.komponen).filter(([, k]) => k.skor !== null).sort((a, b) => b[1].skor - a[1].skor);
  const butir = ([id, k]) => { const m = medKomp(id); return `<li>${labelK(id)}<span class="ix-rk-n">${lencana(k.skor)}${m === null ? "" : `<small>${esc(t("ix.c.selisih", { d: selisih(k.skor - m) }))}</small>`}</span></li>`; };
  return `<aside class="ix-ring"><section><h3>${ikon("centang", 16)}${esc(t("ix.p.kuat"))}</h3><ul>${ada.slice(0, 3).map(butir).join("")}</ul></section>
    <section><h3>${ikon("peringatan", 16)}${esc(t("ix.p.lemah"))}</h3><ul>${ada.slice(-3).reverse().map(butir).join("")}</ul></section>
    <section class="ix-med"><h3>${ikon("grafik", 16)}${esc(t("ix.p.median"))}</h3><p><b>${esc(num(med, 1))}</b>${p.skor === null ? "" : `<span>${esc(t("ix.p.vs", { d: selisih(p.skor - med), m: num(med, 1) }))}</span>`}</p></section></aside>`;
}
function popupProvinsi(kode) {
  const p = S.d.provinsi.find((x) => x.kode === kode); if (!p) return;
  const bobot = Object.fromEntries(S.d.metode.provinsi.komponen.map((k) => [k.id, k.bobot]));
  const tot = Object.values(bobot).reduce((a, b) => a + b, 0), ada = Object.entries(p.komponen).filter(([, k]) => k.skor !== null).reduce((a, [id]) => a + bobot[id], 0);
  const baris = Object.entries(p.komponen).map(([id, k]) => ({ id, k, bobot: (bobot[id] / tot) * 100, kontrib: k.skor === null ? null : (k.skor * bobot[id]) / ada }));
  const kepala = `<div class="ix-dlg-kep ix-kep-prov">${lambang(p.kode, 72)}<div class="ix-kep-t"><h2 id="ixDlgJ">${esc(p.nama)}</h2><div class="ix-pils">${p.peringkat ? `<span class="jm-pil ix-pil-ik">${ikon("analisis", 14)}${esc(t("ix.p.rank_pil", { r: p.peringkat, n: jmlRank() }))}</span>` : `<span class="jm-pil ix-pil-netral">${esc(t("ix.tanpa_rank"))}</span>`}<span class="jm-pil ix-pil-ik ${kelasLeng(p.kelengkapan)}">${ikon("centang", 14)}${esc(t("ix.lengkap", { p: num(p.kelengkapan * 100) }))}</span>${pil("ix.hipotesis")}</div></div><div class="ix-bulat ${kelasSkor(p.skor)}" role="img" aria-label="${esc(t("ix.p.skor_j"))}: ${p.skor === null ? esc(t("an.tanpa_data")) : esc(num(p.skor, 1))}"><b>${p.skor === null ? "-" : esc(num(p.skor, 1))}</b><small>${esc(t("ix.p.skor_j"))}</small></div>${tutupHtml()}</div>`;
  const th = KOLOM.map(([k, kt], i) => `<th data-k="${k}" aria-sort="none"><button type="button" class="ix-urutk" data-urutk="${k}" aria-label="${esc(t("ix.p.urut", { k: t(kt) }))}">${esc(t(kt))}</button></th>`).join("");
  const isi = `<div class="ix-pop-grid"><div class="jm-gulir ix-pt-w"><table class="jm-tabel ix-pt" data-urut="tidak"><colgroup><col class="c-lab"><col class="c-men"><col class="c-sk"><col class="c-ko"><col class="c-bo"></colgroup><thead><tr>${th}</tr></thead><tbody>${baris.map(barisKomp).join("")}</tbody></table></div>${ringkas(p)}</div>`;
  const d = bukaPopup(p.nama, "", isi, `<a class="ix-btn" href="/wilayah/${esc(p.kode)}">${ikon("wilayah", 18)}<span>${esc(t("ix.p.ke_prov"))}</span></a><a class="ix-btn ix-btn-pinggir" href="/metode">${ikon("metode", 18)}<span>${esc(t("ix.p.cara"))}</span></a>`, kepala);
  d._baris = baris; d._urut = null;
}
function popupProyek(id) {
  const p = S.d.proyek.find((x) => x.id === id); if (!p) return;
  const m = S.d.metode.proyek;
  const sel = (v) => (v === null ? `<span class="ix-kosong-sel">${esc(t("ix.p.na"))}</span>` : esc(num(v)));
  const bar = (sin, bobot) => Object.entries(sin).map(([k, v]) => [esc(t("ix.s." + k)), sel(v), esc(num(bobot[k]))]);
  const kol = ["ix.p.sinyal", "ix.p.norma", "ix.p.bobot"];
  const sub = gabung([pilKat(p.kategori), lencana(p.skor), esc(teksStatus(p.status)), pil("ix.hipotesis")]) + `<br>${esc(alasanTeks(p.alasan))}`;
  const ajak = p.data_tipis ? `<p class="ix-ajak">${esc(t("ix.p.ajak"))}</p>` : "";
  const catat = p.alasan_tipis.length ? `<p class="jm-bantu">${esc(t("ix.p.alasan_tipis"))}: ${esc(alasanTeks(p.alasan_tipis))}</p>` : "";
  bukaPopup(p.nama, sub, tabelPop(kol, bar(p.sinyal, m.bobot), t("ix.p.kes")) + tabelPop(kol, bar(p.sinyal_lengkap, m.bobot_kelengkapan), t("ix.p.lk")) + catat + ajak, `<a class="ix-btn" href="/p/${encodeURIComponent(p.id)}">${ikon("proyek", 18)}<span>${esc(t("ix.p.ke_proyek"))}</span></a>`);
}

/* ---------- peta ---------- */
function peta() {
  const el = $("ixPeta"); if (!el) return;
  if (!S.geo) { el.innerHTML = `<p class="jm-bantu">${esc(t("ix.peta_gagal"))}</p>`; return; }
  const per = new Map(S.d.provinsi.map((p) => [p.kode, p]));
  const W = 1000, H = 440;
  const jalur = jalurPerProvinsi(S.geo, W, H).filter((j) => j.d && per.has(j.kode));
  el.innerHTML = `<svg class="ix-peta" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="${esc(t("ix.peta.j"))}">${jalur.map((j) => { const p = per.get(j.kode), k = p.peringkat ? "ix-q" + kuintil(p.skor) : "ix-kos"; return `<path class="${k}" tabindex="0" role="button" data-k="${esc(j.kode)}" aria-label="${esc(p.nama)}: ${p.skor === null ? esc(t("an.tanpa_data")) : esc(num(p.skor, 1))}" d="${j.d}"></path>`; }).join("")}</svg>
    <div class="ix-legenda" aria-label="${esc(t("ix.lg"))}">${[0, 1, 2, 3, 4].map((q) => `<span><i class="ix-q${q}"></i>${esc(num(q * 20))}-${esc(num(q * 20 + 20))} (${esc(num(S.d.provinsi.filter((p) => p.peringkat && kuintil(p.skor) === q).length))})</span>`).join("")}<span><i class="ix-kos"></i>${esc(t("ix.tanpa_rank"))} (${esc(num(S.d.provinsi.filter((p) => !p.peringkat).length))})</span></div>`;
  const tip = document.createElement("div"); tip.className = "ix-tip"; tip.hidden = true; tip.setAttribute("role", "status"); el.append(tip);
  const tampil = (k, x, y) => {
    const p = per.get(k); if (!p) return;
    tip.innerHTML = `<header><img src="/img/provinsi/${esc(k)}.png" width="36" height="36" alt=""><div><strong>${esc(p.nama)}</strong><small>${esc(p.peringkat ? t("ix.tip.peringkat", { r: p.peringkat, n: S.d.provinsi.filter((q) => q.peringkat).length }) : t("an.tanpa_data"))}</small></div></header><p><span>${esc(t("ix.c.skor"))}</span><b>${p.skor === null ? "-" : esc(num(p.skor, 1))}</b></p><small class="ix-ajak-tip">${esc(t("ix.tip.klik"))}</small>`;
    tip.hidden = false;
    tip.style.left = Math.max(8, Math.min(el.clientWidth - tip.offsetWidth - 8, x + 14)) + "px"; tip.style.top = Math.max(8, Math.min(el.clientHeight - tip.offsetHeight - 8, y + 14)) + "px";
  };
  const svg = el.querySelector("svg"), kotak = () => el.getBoundingClientRect();
  svg.addEventListener("mousemove", (e) => { const pa = e.target.closest(":is(path,rect)[data-k]"); if (!pa) { tip.hidden = true; return; } tampil(pa.dataset.k, e.clientX - kotak().left, e.clientY - kotak().top); });
  svg.addEventListener("mouseleave", () => { tip.hidden = true; });
  svg.addEventListener("focusin", (e) => { const pa = e.target.closest(":is(path,rect)[data-k]"); if (pa) { const r = pa.getBoundingClientRect(), b = kotak(); tampil(pa.dataset.k, r.left - b.left + r.width / 2, r.top - b.top + r.height / 2); } });
  svg.addEventListener("focusout", () => { tip.hidden = true; });
}

/* ---------- tabel ---------- */
const nomor = (r) => (r ? `<span class="ix-no${r <= 3 ? " ix-no-" + r : ""}">${esc(num(r))}</span>` : "-");
const terkuat = (p) => { const e = Object.entries(p.komponen).filter(([, k]) => k.skor !== null).sort((a, b) => b[1].skor - a[1].skor)[0]; return e ? `<span class="ix-mini ix-mini-ok">${ikon(IKX[e[0]] || "info", 14)}<span>${esc(t("ix.k." + e[0]))}</span></span>` : "-"; };
function tabelProvinsi() {
  const med = medSkor();
  const baris = S.d.provinsi.map((p) => `<tr data-prov="${esc(p.kode)}"><td class="jm-tengah" data-label="${esc(t("ix.c.rank"))}" data-urut="${p.peringkat ?? 99}">${nomor(p.peringkat)}</td><td data-label="${esc(t("ix.c.prov"))}" data-urut="${esc(p.nama)}"><span class="ix-prov">${lambang(p.kode, 28)}<button type="button" class="ix-buka" data-prov="${esc(p.kode)}" aria-label="${esc(t("ix.baris.buka", { nama: p.nama }))}">${esc(p.nama)}</button></span></td><td class="ix-sk" data-label="${esc(t("ix.c.skor"))}" data-urut="${p.skor ?? ""}">${lencana(p.skor)}${p.skor === null ? "" : `<small class="ix-sel ${p.skor >= med ? "ix-sel-p" : "ix-sel-n"}">${esc(selisih(p.skor - med))}</small>`}</td><td class="jm-tengah" data-label="${esc(t("ix.c.lengkap2"))}" data-urut="${p.kelengkapan}"><span class="jm-pil ${kelasLeng(p.kelengkapan)}">${esc(num(p.kelengkapan * 100))}%</span></td><td class="ix-mn" data-label="${esc(t("ix.c.kosong"))}" data-urut="${p.kosong.length}">${p.kosong.length ? p.kosong.map((k) => `<span class="ix-mini ix-mini-warn">${ikon(IKX[k] || "info", 14)}<span>${esc(t("ix.k." + k))}</span></span>`).join("") : `<span class="jm-pil jm-pil-ok">${esc(t("ix.c.lengkap_ok"))}</span>`}</td><td data-label="${esc(t("ix.c.terkuat"))}">${terkuat(p)}</td></tr>`).join("");
  return `<div class="jm-gulir"><table class="jm-tabel ix-tb ix-tb-prov"><colgroup><col class="k-no"><col class="k-pr"><col class="k-sk"><col class="k-le"><col class="k-ko"><col class="k-te"></colgroup><thead><tr>${["ix.c.rank", "ix.c.prov", "ix.c.skor", "ix.c.lengkap2", "ix.c.kosong", "ix.c.terkuat"].map((k) => `<th>${esc(t(k))}</th>`).join("")}</tr></thead><tbody>${baris}</tbody></table></div>`;
}
const tekKode = (x) => (x || "").replace(/_/g, "-");
function tabelProyek() {
  const ada = S.d.proyek.filter((p) => S.saring === "semua" || p.kategori === S.saring);
  const baris = ada.map((p) => {
    const x = S.pj.get(p.id) || {}, lg = x.pemilik ? logoOrgSatu(null, x.pemilik) : "";
    return `<tr data-proy="${esc(p.id)}"><td data-label="${esc(t("ix.c.proyek"))}"><button type="button" class="ix-buka" data-proy="${esc(p.id)}" aria-label="${esc(t("ix.baris.buka", { nama: p.nama }))}">${esc(p.nama)}</button></td><td data-label="${esc(t("ix.c.pemilik"))}" data-urut="${esc(x.pemilik || "")}">${x.pemilik ? `<span class="ix-prov">${lg ? `<img class="ix-logo" src="${esc(lg)}" width="22" height="22" alt="" data-galat="hapus" loading="lazy">` : ""}<span>${esc(x.pemilik)}</span></span>` : "-"}</td><td data-label="${esc(t("ix.c.tek"))}" data-urut="${esc(x.tek || "")}">${x.tek ? pilTek(tekKode(x.tek)) : "-"}</td><td data-label="${esc(t("ix.c.prov"))}">${esc(p.provinsi || "-")}</td><td data-label="${esc(t("ix.c.status"))}">${pilStatus(p.status)}</td><td data-label="${esc(t("ix.c.kategori"))}" data-urut="${esc(p.kategori)}">${pilKat(p.kategori)}</td><td class="jm-tengah" data-label="${esc(t("ix.c.kes"))}" data-urut="${p.skor ?? ""}">${lencana(p.skor)}</td><td class="jm-tengah" data-label="${esc(t("ix.c.lk"))}" data-urut="${p.skor_lengkap}"><span class="jm-pil ${p.skor_lengkap >= 70 ? "jm-pil-ok" : p.skor_lengkap >= 40 ? "jm-pil-warn" : "jm-pil-bad"}">${esc(num(p.skor_lengkap))}</span></td><td class="jm-nowrap" data-label="${esc(t("ix.c.kabar"))}" data-urut="${esc(p.kabar_terakhir || "")}">${p.kabar_terakhir ? esc(tanggal(p.kabar_terakhir)) : "-"}</td></tr>`;
  }).join("");
  const n = (k) => S.d.proyek.filter((p) => p.kategori === k).length;
  const sar = [["semua", t("ix.f.semua"), S.d.proyek.length], ["bermasalah", t("ix.cat.bermasalah"), n("bermasalah")], ["data_tipis", t("ix.f.tipis"), n("data_tipis")]];
  return `<div class="ix-saring" role="group" aria-label="${esc(t("ix.f.j"))}">${sar.map(([v, l, c]) => `<button type="button" data-saring="${v}" aria-pressed="${S.saring === v}">${esc(l)} (${esc(num(c))})</button>`).join("")}</div>
    <div class="jm-gulir"><table class="jm-tabel ix-tb ix-tb-proy"><colgroup><col class="p-pr"><col class="p-pe"><col class="p-te"><col class="p-pv"><col class="p-st"><col class="p-ka"><col class="p-sk"><col class="p-lk"><col class="p-kb"></colgroup><thead><tr>${["ix.c.proyek", "ix.c.pemilik", "ix.c.tek", "ix.c.prov", "ix.c.status", "ix.c.kategori", "ix.c.kes", "ix.c.lk", "ix.c.kabar"].map((k) => `<th>${esc(t(k))}</th>`).join("")}</tr></thead><tbody>${baris}</tbody></table></div>`;
}

/* ---------- kajian (perakit murni: /indeks_kajian.js) ---------- */
const fmtP = (p) => Object.fromEntries(Object.entries(p).map(([a, v]) => [a, typeof v === "number" ? num(v, Number.isInteger(v) || Math.abs(v) >= 100 ? 0 : 1) : v]));
const ceklis = (a) => `<li>${ikon("centang", 16)}<span>${esc(t(a.k, fmtP(a.p)))}</span></li>`;
const TEK_KLS = { surya: "surya", bayu: "bayu", hidro: "hidro", panas_bumi: "panas", bioenergi: "bio" };
const nomorKecil = (r) => `<span class="ix-no${r <= 3 ? " ix-no-" + r : ""}">${esc(num(r))}</span>`;
const kelasSisa = (p) => (p >= 80 ? "jm-pil-ok" : p >= 50 ? "jm-pil-warn" : "jm-pil-bad");
const ikInfo = (isi) => sumberHtml(esc(isi), t("ix.kj.f.label"));
/* batang mini proporsional: SVG kelas jm-gf agar tooltip bersama (tip_grafik.js) bekerja */
const batangMini = (frac, tip, kls) => `<svg class="jm-gf ix-bm ${kls}" viewBox="0 0 100 10" preserveAspectRatio="none" role="img" aria-label="${esc(tip)}" focusable="false"><rect class="ix-bm-lat" width="100" height="10"/><rect class="ix-bm-isi" width="${Math.max(1.5, frac * 100).toFixed(1)}" height="10"><title>${esc(tip)}</title></rect></svg>`;
const baris = ({ no, kode, nama, nilai, satuan = "", pils = "", bar = "" }) => `<li class="ix-rw">${nomorKecil(no)}${lambang(kode, 28)}<div class="ix-rw-t"><b>${esc(nama)}</b>${pils ? `<span class="ix-rw-p">${pils}</span>` : ""}</div><span class="ix-rw-v"><b>${esc(nilai)}</b>${satuan ? `<small>${esc(satuan)}</small>` : ""}</span>${bar ? `<div class="ix-rw-b">${bar}</div>` : ""}</li>`;
const kartuKj = (kepala, isi) => `<article class="ix-kb">${kepala}<ol class="ix-rw-l">${isi}</ol></article>`;

function kajianHtml(k, n) {
  const kartu = k.paling.map((c) => `<article class="ix-kj-k"><header>${lambang(c.kode, 56)}<div><h4>${esc(c.nama)}</h4><span class="jm-pil ix-pil-ik">${ikon("analisis", 14)}${esc(t("ix.p.rank_pil", { r: c.peringkat, n }))}</span></div><span class="ix-skor ix-skor-b ${kelasSkor(c.skor)}">${esc(num(c.skor, 1))}</span></header>
    <ul class="ix-kj-al">${c.alasan.map(ceklis).join("")}</ul>
    ${c.risiko ? `<p class="ix-kj-rs">${ikon("peringatan", 16)}<span>${esc(t(c.risiko.k, { komp: t("ix.k." + c.risiko.id), skor: num(c.risiko.p.skor, 1) }))}</span></p>` : ""}
    ${c.tek ? `<p class="ix-kj-tk">${pilTek(tekKode(c.tek.tek))}<span>${esc(t("ix.kj.tek", { tek: t("ix.kj.tk." + c.tek.tek), sisa: num(c.tek.sisa), persen: num(c.tek.persen_sisa, 1) }))}</span></p>` : ""}
    <footer><a class="ix-btn" href="/wilayah/${esc(c.kode)}">${ikon("wilayah", 16)}<span>${esc(t("ix.kj.l.profil"))}</span></a><a class="ix-btn ix-btn-pinggir" href="/peluang">${ikon("insight", 16)}<span>${esc(t("ix.kj.l.peluang"))}</span></a></footer></article>`).join("");
  return `<div class="ix-kj"><div class="ix-kj-kartu">${kartu}</div></div>`;
}
function tekHtml(k) {
  const kartu = k.perTek.map((g) => {
    const maks = Math.max(...g.baris.map((b) => b.sisa), 1), kode = tekKode(g.tek);
    const isi = g.baris.map((b, i) => baris({
      no: i + 1, kode: b.kode, nama: b.nama, nilai: num(b.sisa), satuan: t("ix.kj.mw"),
      pils: `<span class="jm-pil ${kelasSisa(b.persen_sisa)}">${esc(t("ix.kj.sisa_pil", { p: num(b.persen_sisa, 1) }))}</span>`,
      bar: batangMini(b.sisa / maks, t("ix.kj.tek.bar", { nama: b.nama, sisa: num(b.sisa), pot: num(b.potensi), ter: num(b.terpasang) }), "ix-t-" + TEK_KLS[g.tek]),
    })).join("");
    return kartuKj(`<header class="ix-kb-h ix-t-${TEK_KLS[g.tek]}"><span class="ix-kb-ik">${ikonTek(kode)}</span><h4>${esc(t("ix.kj.tk." + g.tek))}</h4></header>`, isi);
  }).join("");
  return `<div class="ix-kj-5">${kartu}</div>`;
}
function peranHtml(k, n) {
  const P = [
    ["investor", "grafik", k.peran.investor, (b) => ({ nilai: num(b.rasio, 2), satuan: t("ix.kj.m.rasio"), pils: `<span class="jm-pil jm-pil-ok">${esc(t("ix.kj.m.peluang", { v: num(b.peluang, 1) }))}</span><span class="jm-pil jm-pil-warn">${esc(t("ix.kj.m.risiko", { v: num(b.risiko, 1) }))}</span>` })],
    ["pemda", "regulasi", k.peran.pemda, (b) => ({ nilai: num(b.skor, 1), satuan: t("ix.kj.m.skor"), pils: `<span class="jm-pil ix-pil-ik">${esc(t("ix.p.rank_pil", { r: b.peringkat, n }))}</span><span class="jm-pil jm-pil-warn">${esc(t("ix.kj.m.rued"))}</span>` })],
    ["pemasok", "tek-surya", k.peran.pemasok, (b) => ({ nilai: num(b.total), satuan: t("ix.kj.mw"), pils: `<span class="jm-pil jm-pil-ok">${esc(t("ix.kj.m.plts", { v: num(b.plts) }))}</span><span class="jm-pil ix-pil-netral">${esc(t("ix.kj.m.ruptl", { v: num(b.ruptl) }))}</span>` })],
  ];
  return `<div class="ix-kj-3">${P.map(([id, ik, rows, f]) => kartuKj(`<header class="ix-kb-h"><span class="ix-kb-ik">${ikon(ik, 22)}</span><h4>${esc(t("ix.kj.p." + id))}</h4>${ikInfo(t("ix.kj.f." + id))}</header>`, rows.map((b, i) => baris({ no: i + 1, kode: b.kode, nama: b.nama, ...f(b) })).join(""))).join("")}</div>`;
}
function tertinggalHtml(k, n) {
  const br = k.tertinggal.map((c) => `<tr data-prov="${esc(c.kode)}"><td data-label="${esc(t("ix.c.prov"))}" data-urut="${esc(c.nama)}"><span class="ix-prov">${lambang(c.kode, 28)}<button type="button" class="ix-buka" data-prov="${esc(c.kode)}" aria-label="${esc(t("ix.baris.buka", { nama: c.nama }))}">${esc(c.nama)}</button></span></td><td class="jm-tengah" data-label="${esc(t("ix.c.skor"))}" data-urut="${c.skor}"><span class="ix-skor ix-s-r">${esc(num(c.skor, 1))}</span></td><td class="jm-tengah" data-label="${esc(t("ix.c.rank"))}" data-urut="${c.peringkat}"><span class="jm-pil ix-pil-ik">${esc(t("ix.p.rank_pil", { r: c.peringkat, n }))}</span></td><td class="ix-mn" data-label="${esc(t("ix.kj.tg.pemberat"))}">${c.pemberat.map((x) => `<span class="ix-mini ix-mini-bad">${ikon(IKX[x.id] || "info", 14)}<span>${esc(t("ix.k." + x.id))}</span><b>${esc(num(x.skor, 1))}</b></span>`).join("")}</td></tr>`).join("");
  return `<div class="jm-gulir"><table class="jm-tabel ix-tb ix-tb-tg"><colgroup><col class="g-pr"><col class="g-sk"><col class="g-rk"><col class="g-pb"></colgroup><thead><tr>${["ix.c.prov", "ix.c.skor", "ix.c.rank", "ix.kj.tg.pemberat"].map((x) => `<th>${esc(t(x))}</th>`).join("")}</tr></thead><tbody>${br}</tbody></table></div>`;
}
function batasHtml(k) {
  const kosong = k.batas.kosong.map((x) => t("ix.kj.b.kosong.i", { komp: t("ix.k." + x.id), n: num(x.n) })).join(", ");
  const li = [t("ix.kj.b.kosong", { daftar: kosong }), t("ix.kj.b.tahun"), t("ix.kj.b.bobot")];
  return `<ul class="ix-ul-w">${li.map((x) => `<li>${ikon("peringatan", 18)}<span>${esc(x)}</span></li>`).join("")}</ul><a class="ix-btn ix-btn-pinggir ix-btn-s" href="#ixMetode">${ikon("metode", 16)}<span>${esc(t("ix.kj.b.metode"))}</span></a>`;
}
function kajianBagian() {
  const k = susunKajian(S.d, S.pel), n = jmlRank();
  const sisaMaks = k.perTek.flatMap((g) => g.baris).sort((a, b) => b.sisa - a.sisa)[0];
  const rasio = k.peran.investor[0], rendah = k.tertinggal[0];
  return exHtml({ id: "ixKajian", ikon: "insight", topik: t("ix.kj.ey"), judulHtml: esc(t("ix.kj.j")), subHtml: esc(t("ix.kj.sub")) + " " + pil("ix.hipotesis"), aksiHtml: aksiHtml({ png: false, bagi: false, pdf: true }), isiHtml: kajianHtml(k, n), kelas: "ix-kj-ex" })
    + (sisaMaks ? exHtml({ id: "ixKjTek", ikon: "tek-surya", topik: t("ix.kj.tek.ey"), judulHtml: hlHtml("ix.kj.tek.j", num(sisaMaks.sisa), { nama: sisaMaks.nama }), subHtml: esc(t("ix.kj.tek.sub")) + " " + pil("an.est"), isiHtml: tekHtml(k) }) : "")
    + (rasio ? exHtml({ id: "ixKjPeran", ikon: "orang", topik: t("ix.kj.peran.ey"), judulHtml: hlHtml("ix.kj.peran.j", num(rasio.rasio, 2), { nama: rasio.nama }), subHtml: esc(t("ix.kj.peran.sub")) + " " + pil("ix.hipotesis") + " " + sumberHtml(esc(t("ix.kj.rasio")), t("ix.kj.f.label")), isiHtml: peranHtml(k, n) }) : "")
    + (rendah ? exHtml({ id: "ixKjTg", ikon: "peringatan", topik: t("ix.kj.tg.ey"), judulHtml: hlHtml("ix.kj.tg.j", num(rendah.skor, 1), { nama: rendah.nama }), subHtml: esc(t("ix.kj.tg.sub")), isiHtml: tertinggalHtml(k, n) }) : "")
    + exHtml({ id: "ixKjBt", ikon: "info", topik: t("ix.kj.bt.ey"), judulHtml: hlHtml("ix.kj.bt.j", "3"), isiHtml: batasHtml(k) });
}

/* ---------- sebaran skor ---------- */
function sebaranHtml() {
  const ber = S.d.provinsi.filter((p) => p.peringkat).sort((a, b) => b.skor - a.skor), n = ber.length;
  if (!n) return "";
  const W = 1000, H = 260, L = 34, B = 34, T = 14, bw = (W - L - 8) / n, Y = (v) => T + (H - T - B) * (1 - v / 100), med = medSkor();
  const sebut = (p, urut) => Object.entries(p.komponen).filter(([, c]) => c.skor !== null).sort((a, b) => (b[1].skor - a[1].skor) * urut).slice(0, 2).map(([id, c]) => `${t("ix.k." + id)} ${num(c.skor, 1)}`).join(", ");
  const grid = [0, 50, 100].map((v) => `<line class="ix-sb-g" x1="${L}" x2="${W}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text class="ix-sb-t" x="${L - 6}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${v}</text>`).join("");
  const bar = ber.map((p, i) => {
    const x = L + i * bw + bw * 0.14, w = bw * 0.72, y = Y(p.skor), tip = t("ix.sb.tip", { nama: p.nama, skor: num(p.skor, 1), r: num(p.peringkat), n: num(n), kuat: sebut(p, 1), lemah: sebut(p, -1) });
    return `<rect class="ix-sb-b ix-q${kuintil(p.skor)}" data-k="${esc(p.kode)}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${(Y(0) - y).toFixed(1)}" rx="3" role="button"><title>${esc(tip)}</title></rect><image href="/img/provinsi/${esc(p.kode)}.png" x="${(x + w / 2 - 9).toFixed(1)}" y="${Y(0) + 6}" width="18" height="18" data-galat="hapus"/>`;
  }).join("");
  const ym = Y(med).toFixed(1);
  return `<div class="jm-gulir ix-sb-gl"><svg class="jm-gf ix-sb" viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(t("ix.sb.aria"))}">${grid}${bar}<line class="ix-sb-med" x1="${L}" x2="${W}" y1="${ym}" y2="${ym}"/><text class="ix-sb-mt" x="${W - 4}" y="${(+ym - 6).toFixed(1)}" text-anchor="end">${esc(t("ix.sb.median", { m: num(med, 1) }))}</text></svg></div>
    <div class="ix-legenda" aria-label="${esc(t("ix.lg"))}">${[0, 1, 2, 3, 4].map((q) => `<span><i class="ix-q${q}"></i>${esc(num(q * 20))}-${esc(num(q * 20 + 20))} (${esc(num(ber.filter((p) => kuintil(p.skor) === q).length))})</span>`).join("")}</div>`;
}
function judulSebaran() {
  const ber = S.d.provinsi.filter((p) => p.peringkat).map((p) => p.skor);
  return hlHtml("ix.sb.j", num(Math.max(...ber), 1), { min: num(Math.min(...ber), 1), med: num(medSkor(), 1) });
}

/* ---------- metode ---------- */
const TAUT = { potensi: "/peluang", terpasang: "/peluang", elektrifikasi: "/wilayah", bpp: "/peluang", ruptl: "/peluang", proyek: "/proyek", organisasi: "/direktori", rued: "/regulasi", plts_atap: "/peluang", wkp: "/panas-bumi?tab=ringkasan" };
const NORMA = { persentil: ["grafik", "jm-pil"], minmax: ["analisis", "jm-pil jm-pil-ok"], biner: ["centang", "jm-pil jm-pil-warn"] };
function metode() {
  const m = S.d.metode, kom = m.provinsi.komponen;
  const total = kom.reduce((s, k) => s + k.bobot, 0);
  let x0 = 0;
  const seg = kom.map((k, i) => { const w = (k.bobot / total) * 1000, r = `<rect class="ix-c${i}" x="${x0.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="30"><title>${esc(t("ix.m.bobot.tip", { nama: t("ix.k." + k.id), b: num(k.bobot) }))}</title></rect>`; x0 += w; return r; }).join("");
  const rumus = [["skor", "kalkulator"], ["pers", "grafik"], ["mm", "analisis"]].map(([id, ik]) => `<article class="ix-fm"><h4>${ikon(ik, 20)}<span>${esc(t("ix.m.f." + id + ".j"))}</span></h4><code class="ix-fm-r">${esc(t("ix.m.f." + id))}</code><p>${esc(t("ix.m.f." + id + ".n"))}</p></article>`).join("");
  const tbl = kom.map((k, i) => {
    const [ikN, klsN] = NORMA[k.normalisasi] || NORMA.persentil, nm = t("ix.k." + k.id);
    return `<tr><td data-label="${esc(t("ix.m.c.komp"))}"><span class="ix-ik-k"><i class="ix-sw ix-c${i}"></i>${ikon(IKX[k.id] || "info", 16)}<span>${esc(nm)}</span></span><span class="jm-bantu ix-kd">${esc(t("ix.kd." + k.id))}</span></td><td class="jm-tengah" data-label="${esc(t("ix.p.bobot"))}" data-urut="${k.bobot}"><span class="jm-pil jm-pil-ok">${esc(num(k.bobot))}%</span></td><td class="jm-tengah" data-label="${esc(t("ix.m.c.norma"))}"><span class="${klsN} ix-pil-ik">${ikon(ikN, 14)}${esc(t("ix.norma." + k.normalisasi))}</span></td><td data-label="${esc(t("ix.m.c.sumber"))}"><a class="ix-src" href="${TAUT[k.id] || "/peluang"}" aria-label="${esc(t("ix.m.taut"))}: ${esc(nm)}">${ikon("tautan", 16)}<span>${esc(t("ix.m.src." + k.id))}</span></a></td></tr>`;
  }).join("");
  const tblP = [...Object.entries(m.proyek.bobot), ...Object.entries(m.proyek.bobot_kelengkapan)].map(([k, b]) => `<tr><td data-label="${esc(t("ix.p.sinyal"))}">${esc(t("ix.s." + k))}</td><td class="jm-tengah" data-label="${esc(t("ix.p.bobot"))}" data-urut="${b}"><span class="jm-pil jm-pil-ok">${esc(num(b))}</span></td></tr>`).join("");
  return `<div class="ix-metode"><p class="ix-m-lead">${ikon("info", 18)}<span>${esc(t("ix.m.ringkas"))} ${pil("ix.hipotesis")}</span></p>
    <p class="jm-bantu">${esc(t("ix.m.versi", { v: S.d.versi, tgl: tanggal(S.d.tanggal, { gaya: "panjang" }) }))}</p>
    <h3>${esc(t("ix.m.h.prov"))}</h3><div class="ix-fm-g">${rumus}</div><p class="ix-m-lead">${ikon("peringatan", 18)}<span>${esc(t("ix.m.min", { p: num(m.min_lengkap * 100) }))}</span></p>
    <h3>${esc(t("ix.m.bobot.j"))}</h3><div class="jm-gulir"><svg class="jm-gf ix-bobot" viewBox="0 0 1000 30" preserveAspectRatio="none" role="img" aria-label="${esc(t("ix.m.bobot.aria"))}">${seg}</svg></div>
    <div class="jm-gulir"><table class="jm-tabel ix-tb ix-tb-m"><colgroup><col class="m-kp"><col class="m-bo"><col class="m-no"><col class="m-su"></colgroup><thead><tr>${["ix.m.c.komp", "ix.p.bobot", "ix.m.c.norma", "ix.m.c.sumber"].map((k) => `<th>${esc(t(k))}</th>`).join("")}</tr></thead><tbody>${tbl}</tbody></table></div>
    <h3>${esc(t("ix.m.h.proy"))}</h3><p class="ix-m-lead">${ikon("kalkulator", 18)}<span>${esc(t("ix.m.rumus.proyek"))}</span></p>
    <div class="jm-gulir"><table class="jm-tabel ix-tb ix-tb-ps"><thead><tr>${["ix.p.sinyal", "ix.p.bobot"].map((k) => `<th>${esc(t(k))}</th>`).join("")}</tr></thead><tbody>${tblP}</tbody></table></div>
    <h3>${esc(t("ix.m.h.batas"))}</h3><ul class="ix-ul-w">${[1, 2, 3, 4].map((i) => `<li>${ikon("peringatan", 18)}<span>${esc(t("ix.m.lim." + i))}</span></li>`).join("")}</ul>
    <button type="button" class="ix-unduh" id="ixUnduh">${ikon("unduh", 18)}<span>${esc(t("ix.m.unduh"))}</span></button></div>`;
}
function unduhMetode() {
  const { label, versi, tanggal: tg, metode: m } = S.d;
  const url = URL.createObjectURL(new Blob([JSON.stringify({ label, versi, tanggal: tg, metode: m }, null, 2)], { type: "application/json" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `indeks-metode-${versi}.json` });
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- kerangka ---------- */
function ubin() {
  const { provinsi, proyek } = S.d, atas = provinsi.find((p) => p.peringkat === 1);
  const masalah = proyek.filter((p) => p.kategori === "bermasalah").length, tipis = proyek.filter((p) => p.kategori === "data_tipis").length;
  $("ubin").innerHTML = ubinHtml([
    { ikon: "analisis", nilai: atas ? num(atas.skor, 1) : "-", label: t("ix.u.atas", { nama: atas?.nama || "-" }), href: "#ixPeta" },
    { ikon: "wilayah", nilai: num(provinsi.filter((p) => p.peringkat).length), satuan: `/ ${num(provinsi.length)}`, label: t("ix.u.rank"), href: "#ixTab" },
    { ikon: "peringatan", nilai: num(masalah), satuan: `/ ${num(proyek.length)}`, label: t("ix.u.masalah"), href: "#ixTab" },
    { ikon: "info", nilai: num(tipis), satuan: `/ ${num(proyek.length)}`, label: t("ix.u.tipis"), href: "#ixTab" },
  ]);
}
function judulTabel() {
  const atas = S.d.provinsi.find((p) => p.peringkat === 1), n = S.d.provinsi.filter((p) => p.peringkat && p.skor < 50).length;
  return atas ? hlHtml("ix.tabel.j2", num(atas.skor, 1), { nama: atas.nama, n: num(n) }) : esc(t("ix.tabel.j"));
}
function kerangka() {
  const tabs = [["provinsi", "wilayah", "ix.tab.prov"], ["proyek", "proyek", "ix.tab.proy"]];
  $("isi").innerHTML = exHtml({ id: "ixPetaEx", ikon: "peta", topik: t("ix.peta.ey"), judulHtml: esc(t("ix.peta.j")), subHtml: esc(t("ix.peta.sub")) + " " + pil("ix.hipotesis"), isiHtml: `<div id="ixPeta"></div>`, kelas: "ix-peta-ex" }).replace('class="jm-ex-bd"', 'class="jm-ex-bd ix-peta-bd"')
    + (S.pel ? kajianBagian() : "")
    + exHtml({ id: "ixSebaran", ikon: "grafik", topik: t("ix.sb.ey"), judulHtml: judulSebaran(), subHtml: esc(t("ix.sb.sub")) + " " + pil("ix.hipotesis"), isiHtml: sebaranHtml(), kelas: "ix-sb-ex" })
    + exHtml({ id: "ixTab", ikon: "tabel", topik: t("ix.tabel.ey"), judulHtml: judulTabel(), subHtml: esc(t("ix.tabel.sub")), aksiHtml: pil("ix.hipotesis") + `<a class="ix-btn ix-btn-pinggir ix-btn-s" href="#ixMetode">${ikon("metode", 16)}<span>${esc(t("ix.p.cara"))}</span></a>`, isiHtml: `<div class="jm-tab" role="tablist" aria-label="${esc(t("ix.tab.aria"))}">${tabs.map(([k, ik, kt]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${S.tab === k}">${ikon(ik, 18)}<span>${esc(t(kt))}</span></button>`).join("")}</div><div class="ix-tab-panel" id="ixPanel" role="tabpanel"></div>` })
    + exHtml({ id: "ixMetode", ikon: "metode", topik: t("ix.m.ey"), judulHtml: esc(t("ix.m.j")), isiHtml: metode() });
  ubin(); peta(); panel();
}
function panel() { $("ixPanel").innerHTML = S.tab === "provinsi" ? tabelProvinsi() : tabelProyek(); }

function pasang() {
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-prov],[data-proy],button[data-tab],button[data-saring],#ixUnduh,:is(path,rect)[data-k]");
    if (!b || e.target.closest("a")) return;
    if (b.id === "ixUnduh") return unduhMetode();
    if (b.dataset.prov) return popupProvinsi(b.dataset.prov);
    if (b.dataset.proy) return popupProyek(b.dataset.proy);
    if (b.dataset.k) return popupProvinsi(b.dataset.k);
    if (b.dataset.tab) { S.tab = b.dataset.tab; for (const x of b.parentElement.children) x.setAttribute("aria-selected", String(x === b)); return nanti(panel); }
    if (b.dataset.saring) { S.saring = b.dataset.saring; nanti(panel); }
  });
  document.addEventListener("keydown", (e) => { const p = e.target.closest?.(":is(path,rect)[data-k]"); if (p && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); popupProvinsi(p.dataset.k); } });
}

async function muat() {
  $("isi").innerHTML = hantuHtml(6);
  try { [S.d, S.geo] = await Promise.all([muatData("indeks.json"), geoProvinsi()]); } catch { tampilGalat($("isi"), muat); return; }
  S.pel = await muatData("peluang.json").catch(() => null);
  const pj = await muatData("proyek.json").catch(() => null);
  for (const r of pj?.baris || []) S.pj.set(r.id, { tek: r.teknologi, pemilik: r.pihak?.pemilik?.[0]?.nilai || "" });
  kerangka();
}

await mulaiHalaman();
pasang();
saatBahasa(() => S.d && kerangka());
muat();
