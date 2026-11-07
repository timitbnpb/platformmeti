/* /indeks: indeks kesiapan provinsi + kesehatan proyek (Hipotesis). Data statis /data/indeks.json dari scripts/pipa/indeks.mjs.
   Tab Provinsi/Proyek (tabel .jm-tabel, urut global dari komponen.js), peta koroplet, popup rincian, bagian Metode + unduh JSON. */
import { mulaiHalaman } from "/inti/kepala.js";
import { geoProvinsi, jalurPerProvinsi } from "/inti/peta_indonesia.js";
import { exHtml } from "/inti/komponen.js";
import { t, tanggal } from "/i18n.js";
import { esc, ikon, nanti, hantuHtml } from "/inti/umum.js";
import { muatData, tampilGalat, ubinHtml, pil, num, saatBahasa, teksStatus } from "/analisis.js";

const $ = (id) => document.getElementById(id);
const SATUAN = { potensi: "MW", terpasang: "MW", elektrifikasi: "%", bpp: "Rp/kWh", ruptl: "MW", plts_atap: "MW" };
const S = { d: null, geo: null, tab: "provinsi", saring: "semua" };

const kelasSkor = (s) => (s === null ? "" : s >= 70 ? "ix-s-t" : s >= 40 ? "ix-s-s" : "ix-s-r");
const lencana = (s) => `<span class="ix-skor ${kelasSkor(s)}">${s === null ? esc(t("an.tanpa_data")) : esc(num(s, 1))}</span>`;
const gabung = (a) => a.filter(Boolean).join(" | ");
const kuintil = (s) => Math.min(4, Math.floor(s / 20));

function mentahTeks(id, k) {
  if (k.skor === null) return `<span class="ix-kosong-sel">${esc(t("ix.p.kosong"))}</span>`;
  if (id === "rued") return esc(t("ix.ada"));
  return esc(num(k.mentah, id === "elektrifikasi" ? 2 : 1) + (SATUAN[id] ? " " + SATUAN[id] : ""));
}
const alasanTeks = (al, kosong = t("ix.a.bersih")) => al.map((a) => t("ix.a." + a.k, { n: a.n, f: (a.f || []).map((x) => t("ix.f." + x)).join(", ") })).join("; ") || kosong;

const KAT = { bermasalah: "jm-pil jm-pil-bad", data_tipis: "jm-pil ix-pil-netral", sehat: "jm-pil jm-pil-ok" };
const pilKat = (k) => `<span class="${KAT[k]}">${esc(t("ix.cat." + k))}</span>`;

/* ---------- popup ---------- */
function dialog() {
  let d = $("ixDlg");
  if (d) return d;
  d = document.createElement("dialog");
  d.id = "ixDlg"; d.className = "ix-dlg"; d.setAttribute("aria-labelledby", "ixDlgJ");
  document.body.append(d);
  d.addEventListener("click", (e) => { if (e.target === d || e.target.closest("[data-tutup]")) d.close(); });
  return d;
}
const tabelPop = (kolom, baris, judul = "") => `${judul ? `<h3>${esc(judul)}</h3>` : ""}<div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr>${kolom.map((c) => `<th>${esc(t(c))}</th>`).join("")}</tr></thead><tbody>${baris.map((r) => `<tr>${r.map((c, i) => `<td data-label="${esc(t(kolom[i]))}"${i ? ' class="jm-num"' : ""}>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
function bukaPopup(judul, subHtml, isiHtml, tautan) {
  const d = dialog();
  d.innerHTML = `<div class="ix-dlg-kep"><div><h2 id="ixDlgJ">${esc(judul)}</h2><p>${subHtml}</p></div><button type="button" class="ix-dlg-x" data-tutup aria-label="${esc(t("jm.tutup"))}">${ikon("tutup", 20)}</button></div>${isiHtml}<div class="ix-dlg-aksi">${tautan}</div>`;
  d.showModal();
}
function popupProvinsi(kode) {
  const p = S.d.provinsi.find((x) => x.kode === kode); if (!p) return;
  const bobot = Object.fromEntries(S.d.metode.provinsi.komponen.map((k) => [k.id, k.bobot]));
  const baris = Object.entries(p.komponen).map(([id, k]) => [esc(t("ix.k." + id)), mentahTeks(id, k), k.skor === null ? "-" : esc(num(k.skor, 1)), esc(num(bobot[id]))]);
  const sub = gabung([lencana(p.skor), p.peringkat ? esc(t("ix.rank", { r: p.peringkat, n: S.d.provinsi.filter((x) => x.peringkat).length })) : esc(t("ix.tanpa_rank")), esc(t("ix.lengkap", { p: num(p.kelengkapan * 100) })), pil("ix.hipotesis")]);
  bukaPopup(p.nama, sub, tabelPop(["ix.p.komponen", "ix.p.mentah", "ix.p.norma", "ix.p.bobot"], baris), `<a href="/wilayah/${esc(p.kode)}">${ikon("wilayah", 16)} ${esc(t("ix.p.ke_prov"))}</a>`);
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
  bukaPopup(p.nama, sub, tabelPop(kol, bar(p.sinyal, m.bobot), t("ix.p.kes")) + tabelPop(kol, bar(p.sinyal_lengkap, m.bobot_kelengkapan), t("ix.p.lk")) + catat + ajak, `<a href="/p/${encodeURIComponent(p.id)}">${ikon("proyek", 16)} ${esc(t("ix.p.ke_proyek"))}</a>`);
}

/* ---------- peta ---------- */
function peta() {
  const el = $("ixPeta"); if (!el) return;
  if (!S.geo) { el.innerHTML = `<p class="jm-bantu">${esc(t("ix.peta_gagal"))}</p>`; return; }
  const per = new Map(S.d.provinsi.map((p) => [p.kode, p]));
  const W = 1000, H = 440;
  const jalur = jalurPerProvinsi(S.geo, W, H).filter((j) => j.d && per.has(j.kode));
  el.innerHTML = `<svg class="ix-peta" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="group" aria-label="${esc(t("ix.peta.j"))}">${jalur.map((j) => { const p = per.get(j.kode), k = p.peringkat ? "ix-q" + kuintil(p.skor) : "ix-kos"; return `<path class="${k}" tabindex="0" role="button" data-k="${esc(j.kode)}" d="${j.d}"><title>${esc(p.nama)}: ${p.skor === null ? esc(t("an.tanpa_data")) : esc(num(p.skor, 1))}</title></path>`; }).join("")}</svg>
    <div class="ix-legenda" aria-label="${esc(t("ix.lg"))}">${[0, 1, 2, 3, 4].map((q) => `<span><i class="ix-q${q}"></i>${esc(num(q * 20))}-${esc(num(q * 20 + 20))} (${esc(num(S.d.provinsi.filter((p) => p.peringkat && kuintil(p.skor) === q).length))})</span>`).join("")}<span><i class="ix-kos"></i>${esc(t("ix.tanpa_rank"))} (${esc(num(S.d.provinsi.filter((p) => !p.peringkat).length))})</span></div>`;
}

/* ---------- tabel ---------- */
function tabelProvinsi() {
  const baris = S.d.provinsi.map((p) => `<tr><td class="jm-num" data-label="${esc(t("ix.c.rank"))}">${p.peringkat ?? "-"}</td><td data-label="${esc(t("ix.c.prov"))}"><button type="button" class="ix-buka" data-prov="${esc(p.kode)}">${esc(p.nama)}</button></td><td class="jm-num" data-label="${esc(t("ix.c.skor"))}" data-urut="${p.skor ?? ""}">${lencana(p.skor)}</td><td class="jm-num" data-label="${esc(t("ix.c.lengkap"))}">${esc(num(p.kelengkapan * 100))}%</td><td data-label="${esc(t("ix.c.kosong"))}">${p.kosong.length ? esc(p.kosong.map((k) => t("ix.k." + k)).join(", ")) : "-"}</td></tr>`).join("");
  return `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>${["ix.c.rank", "ix.c.prov", "ix.c.skor", "ix.c.lengkap", "ix.c.kosong"].map((k) => `<th>${esc(t(k))}</th>`).join("")}</tr></thead><tbody>${baris}</tbody></table></div>`;
}
function tabelProyek() {
  const ada = S.d.proyek.filter((p) => S.saring === "semua" || p.kategori === S.saring);
  const baris = ada.map((p) => `<tr><td data-label="${esc(t("ix.c.proyek"))}"><button type="button" class="ix-buka" data-proy="${esc(p.id)}">${esc(p.nama)}</button></td><td data-label="${esc(t("ix.c.prov"))}">${esc(p.provinsi || "-")}</td><td data-label="${esc(t("ix.c.status"))}">${esc(teksStatus(p.status))}</td><td data-label="${esc(t("ix.c.kategori"))}" data-urut="${esc(p.kategori)}">${pilKat(p.kategori)}</td><td class="jm-num" data-label="${esc(t("ix.c.kes"))}">${lencana(p.skor)}</td><td class="jm-num" data-label="${esc(t("ix.c.lk"))}">${esc(num(p.skor_lengkap))}</td><td data-label="${esc(t("ix.c.kabar"))}" data-urut="${esc(p.kabar_terakhir || "")}">${p.kabar_terakhir ? esc(tanggal(p.kabar_terakhir)) : "-"}</td><td data-label="${esc(t("ix.c.alasan"))}">${esc(p.alasan.length ? alasanTeks(p.alasan) : alasanTeks(p.alasan_tipis, t("ix.a.bersih")))}</td></tr>`).join("");
  const n = (k) => S.d.proyek.filter((p) => p.kategori === k).length;
  const sar = [["semua", t("ix.f.semua"), S.d.proyek.length], ["bermasalah", t("ix.cat.bermasalah"), n("bermasalah")], ["data_tipis", t("ix.f.tipis"), n("data_tipis")]];
  return `<div class="ix-saring" role="group" aria-label="${esc(t("ix.f.j"))}">${sar.map(([v, l, c]) => `<button type="button" data-saring="${v}" aria-pressed="${S.saring === v}">${esc(l)} (${esc(num(c))})</button>`).join("")}</div>
    <div class="jm-gulir"><table class="jm-tabel"><thead><tr>${["ix.c.proyek", "ix.c.prov", "ix.c.status", "ix.c.kategori", "ix.c.kes", "ix.c.lk", "ix.c.kabar", "ix.c.alasan"].map((k) => `<th>${esc(t(k))}</th>`).join("")}</tr></thead><tbody>${baris}</tbody></table></div>`;
}

/* ---------- metode ---------- */
function metode() {
  const m = S.d.metode;
  const tbl = m.provinsi.komponen.map((k) => `<tr><td data-label="${esc(t("ix.m.c.komp"))}"><b>${esc(t("ix.k." + k.id))}</b><br><span class="jm-bantu">${esc(t("ix.kd." + k.id))}</span></td><td class="jm-num" data-label="${esc(t("ix.p.bobot"))}">${esc(num(k.bobot))}</td><td data-label="${esc(t("ix.m.c.norma"))}">${esc(t("ix.norma." + k.normalisasi))}</td><td data-label="${esc(t("ix.m.c.sumber"))}">${esc(k.sumber.join("; "))}</td></tr>`).join("");
  const tblP = [...Object.entries(m.proyek.bobot), ...Object.entries(m.proyek.bobot_kelengkapan)].map(([k, b]) => `<tr><td data-label="${esc(t("ix.p.sinyal"))}">${esc(t("ix.s." + k))}</td><td class="jm-num" data-label="${esc(t("ix.p.bobot"))}">${esc(num(b))}</td></tr>`).join("");
  return `<div class="ix-metode"><p>${esc(t("ix.m.ringkas"))} ${pil("ix.hipotesis")}</p>
    <p class="jm-bantu">${esc(t("ix.m.versi", { v: S.d.versi, tgl: tanggal(S.d.tanggal, { gaya: "panjang" }) }))}</p>
    <h3>${esc(t("ix.m.h.prov"))}</h3><p>${esc(t("ix.m.rumus.prov"))}</p><p class="jm-bantu">${esc(t("ix.m.min", { p: num(m.min_lengkap * 100) }))}</p>
    <div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr>${["ix.m.c.komp", "ix.p.bobot", "ix.m.c.norma", "ix.m.c.sumber"].map((k) => `<th>${esc(t(k))}</th>`).join("")}</tr></thead><tbody>${tbl}</tbody></table></div>
    <h3>${esc(t("ix.m.h.proy"))}</h3><p>${esc(t("ix.m.rumus.proyek"))}</p>
    <div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr>${["ix.p.sinyal", "ix.p.bobot"].map((k) => `<th>${esc(t(k))}</th>`).join("")}</tr></thead><tbody>${tblP}</tbody></table></div>
    <h3>${esc(t("ix.m.h.batas"))}</h3><ul>${[1, 2, 3, 4].map((i) => `<li>${esc(t("ix.m.lim." + i))}</li>`).join("")}</ul>
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
function kerangka() {
  const tabs = [["provinsi", "wilayah", "ix.tab.prov"], ["proyek", "proyek", "ix.tab.proy"]];
  $("isi").innerHTML = exHtml({ id: "ixPetaEx", ikon: "peta", topik: t("ix.peta.ey"), judulHtml: esc(t("ix.peta.j")), subHtml: esc(t("ix.peta.sub")) + " " + pil("ix.hipotesis"), isiHtml: `<div id="ixPeta"></div>`, kelas: "ix-peta-ex" }).replace('class="jm-ex-bd"', 'class="jm-ex-bd ix-peta-bd"')
    + exHtml({ id: "ixTab", ikon: "tabel", topik: t("ix.tabel.ey"), judulHtml: esc(t("ix.tabel.j")), subHtml: esc(t("ix.tabel.sub")), isiHtml: `<div class="jm-tab" role="tablist" aria-label="${esc(t("ix.tab.aria"))}">${tabs.map(([k, ik, kt]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${S.tab === k}">${ikon(ik, 18)}<span>${esc(t(kt))}</span></button>`).join("")}</div><div class="ix-tab-panel" id="ixPanel" role="tabpanel"></div>` })
    + exHtml({ id: "ixMetode", ikon: "metode", topik: t("ix.m.ey"), judulHtml: esc(t("ix.m.j")), isiHtml: metode() });
  ubin(); peta(); panel();
}
function panel() { $("ixPanel").innerHTML = S.tab === "provinsi" ? tabelProvinsi() : tabelProyek(); }

function pasang() {
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-prov],button[data-proy],button[data-tab],button[data-saring],#ixUnduh,path[data-k]");
    if (!b) return;
    if (b.id === "ixUnduh") return unduhMetode();
    if (b.dataset.prov) return popupProvinsi(b.dataset.prov);
    if (b.dataset.proy) return popupProyek(b.dataset.proy);
    if (b.dataset.k) return popupProvinsi(b.dataset.k);
    if (b.dataset.tab) { S.tab = b.dataset.tab; for (const x of b.parentElement.children) x.setAttribute("aria-selected", String(x === b)); return nanti(panel); }
    if (b.dataset.saring) { S.saring = b.dataset.saring; nanti(panel); }
  });
  document.addEventListener("keydown", (e) => { const p = e.target.closest?.("path[data-k]"); if (p && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); popupProvinsi(p.dataset.k); } });
}

async function muat() {
  $("isi").innerHTML = hantuHtml(6);
  try { [S.d, S.geo] = await Promise.all([muatData("indeks.json"), geoProvinsi()]); } catch { tampilGalat($("isi"), muat); return; }
  kerangka();
}

await mulaiHalaman();
pasang();
saatBahasa(() => S.d && kerangka());
muat();
