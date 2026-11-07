/* /banding: pembanding berdampingan 2 sampai 4 provinsi ATAU 2 sampai 4 organisasi.
   Pilih dengan pencarian berlambang/berlogo; angka kunci berdampingan dengan pemenang tersorot; batang berkelompok dan radar interaktif;
   URL berbagi memuat pilihan (?m=prov&p=11,32 atau ?m=org&o=a,b); unduh CSV. Tanpa data = "-" bertooltip, tidak pernah 0 karangan.
   Hitungan murni ada di banding_hitung.js (diuji). Teks layar dari kamus (bd2.*). INP: segmen dan pilihan berubah seketika, render berat lewat nanti(). */
import { mulaiHalaman } from "/inti/kepala.js";
import { khUbin } from "/inti/kh.js";
import "/inti/tip_grafik.js";
import { t, angka } from "/i18n.js";
import { esc, ikon, hantuHtml, nanti } from "/inti/umum.js";
import { exHtml, bagikanHtml, sumberHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { logoOrgSatu } from "/inti/logo_org.js";
import { muatData, tampilGalat, saatBahasa } from "/analisis.js";
import { MIN, MAKS, METRIK_PROV, METRIK_ORG, KOMPONEN_PROV, SUMBU_ORG, metrikProvinsi, metrikOrganisasi, pemenang, indeksPemimpin, bacaUrl, tulisUrl, norma } from "/banding_hitung.js";

const $ = (id) => document.getElementById(id);
const S = { mode: "prov", ids: [], q: "", buka: false, D: {}, daftar: { prov: null, org: null } };
const fmt = (v, d = 0) => angka(v, { desimal: d });
const WARNA = ["bd-c0", "bd-c1", "bd-c2", "bd-c3"];

/* ---------- data ---------- */
const MUAT = { prov: ["wilayah", "indeks", "radar_kabupaten", "rued_capaian", "peluang", "berita"], org: ["organisasi", "proyek", "orang", "berita"] };
async function muatMode(mode) {
  if (S.D[mode]) return S.D[mode];
  const h = await Promise.all(MUAT[mode].map((n) => muatData(n + ".json")));
  const D = Object.fromEntries(MUAT[mode].map((n, i) => [n, h[i]]));
  if (mode === "prov") {
    D.radar = D.radar_kabupaten; D.rued = D.rued_capaian;
    D.daftar = D.wilayah.baris.map((b) => ({ id: b.kode, nama: b.nama, sub: b.identitas?.ibu_kota || "", terpasang: b.terpasang_mw?.nilai ?? 0 }));
  } else {
    D.baris = D.organisasi.baris;
    const per = new Map();
    for (const p of D.proyek.baris) for (const x of Object.values(p.pihak || {}).flat()) if (x?.organisasi_id) per.set(x.organisasi_id, (per.get(x.organisasi_id) || 0) + 1);
    D.daftar = D.baris.map((o) => ({ id: o.id, nama: o.nama, sub: o.kategori?.label || "", logo: o.logo || "", n: (o.proyek_ids || []).length + (per.get(o.id) || 0), o }));
  }
  return (S.D[mode] = D);
}

/* ---------- lambang dan logo ---------- */
const lambang = (e, kelas = "bd-lb") => {
  if (S.mode === "prov") return `<img class="${kelas}" src="/img/provinsi/${esc(e.id)}.png" alt="" width="36" height="36" loading="lazy" decoding="async" data-galat="hapus">`;
  const u = logoOrgSatu(e.id, e.nama, e.logo);
  return u ? `<img class="${kelas}" src="${esc(u)}" alt="" width="36" height="36" loading="lazy" decoding="async" data-galat="hapus">` : `<span class="${kelas} bd-ini">${esc(inisial(e.nama))}</span>`;
};
const inisial = (n) => String(n).replace(/\(.*?\)/g, "").replace(/^(PT|CV|The)\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toLocaleUpperCase() || "?";

/* ---------- entitas terpilih ---------- */
function entitas() {
  const D = S.D[S.mode];
  if (!D) return [];
  return S.ids.map((id) => (S.mode === "prov" ? metrikProvinsi(id, D) : metrikOrganisasi(D.baris.find((o) => o.id === id), { proyek: D.proyek.baris, orang: D.orang.baris, berita: D.berita.baris }))).filter(Boolean);
}
const metrikMode = () => (S.mode === "prov" ? METRIK_PROV : METRIK_ORG);
const labelM = (k) => t((S.mode === "prov" ? "bd2.m." : "bd2.mo.") + k);
const tipM = (k) => t((S.mode === "prov" ? "bd2.mt." : "bd2.mot.") + k);

function awal(D, mode) {
  const urut = [...D.daftar].sort((a, z) => (mode === "prov" ? z.terpasang - a.terpasang : z.n - a.n) || a.nama.localeCompare(z.nama, "id"));
  return urut.slice(0, 3).map((x) => x.id);
}
function simpanUrl() { history.replaceState(null, "", location.pathname + tulisUrl({ mode: S.mode, ids: S.ids })); }

/* ---------- kepala + pilihan ---------- */
function ubinKepala() {
  const nProv = S.D.prov?.daftar.length || 38, nOrg = S.D.ringkas?.hitung?.organisasi;
  khUbin("ubin", [
    { ikon: "wilayah", nilai: fmt(nProv), label: t("bd2.u.prov") },
    ...(nOrg ? [{ ikon: "gedung", nilai: fmt(nOrg), label: t("bd2.u.org") }] : []),
    { ikon: "tabel", nilai: fmt(METRIK_PROV.length), label: t("bd2.u.metrik") },
    { ikon: "tambah", nilai: `${MIN}-${MAKS}`, label: t("bd2.u.pilih") },
  ]);
}
function hasilCari() {
  const D = S.D[S.mode], q = norma(S.q);
  let l = D.daftar.filter((x) => !S.ids.includes(x.id));
  if (q) l = l.filter((x) => norma(x.nama).includes(q) || norma(x.sub).includes(q));
  else if (S.mode === "org") l = [...l].sort((a, z) => z.n - a.n);
  return l.slice(0, S.mode === "prov" ? 40 : 8);
}
function hasilHtml() {
  const l = hasilCari();
  if (!l.length) return `<p class="bd-kosong-cari">${esc(t("bd2.cari_kosong"))}</p>`;
  return `<ul class="bd-hasil" role="listbox" aria-label="${esc(t("bd2.cari"))}">${l.map((x) => `<li role="presentation"><button type="button" role="option" data-tambah="${esc(x.id)}">${lambang(x, "bd-lb bd-lb-k")}<span class="bd-hn"><b>${esc(x.nama)}</b>${x.sub ? `<small>${esc(x.sub)}</small>` : ""}</span></button></li>`).join("")}</ul>`;
}
function kartuPilih(e, i, ringkas) {
  return `<li class="bd-pilih-k ${WARNA[i]}"><span class="bd-pilih-ik">${lambang(e)}</span><div class="bd-pilih-t"><b>${esc(e.nama)}</b><small>${esc(ringkas)}</small></div><button type="button" class="bd-hapus" data-hapus="${esc(e.id)}" aria-label="${esc(t("bd2.hapus", { nama: e.nama }))}" title="${esc(t("bd2.hapus", { nama: e.nama }))}">${ikon("silang", 16)}</button></li>`;
}
function pilihHtml() {
  const ent = entitas(), penuh = S.ids.length >= MAKS;
  const ring = (e) => (S.mode === "prov" ? t("bd2.ring_prov", { mw: fmt(e.m.terpasang ?? 0), n: fmt(e.m.proyek ?? 0) }) : t("bd2.ring_org", { n: fmt(e.m.proyek), mw: fmt(e.m.mw ?? 0) }));
  const kosong = Math.max(0, MIN - ent.length);
  const slot = (n) => Array.from({ length: n }, () => `<li class="bd-pilih-kosong"><button type="button" data-fokus-cari>${ikon("tambah", 18)}<span>${esc(t("bd2.slot"))}</span></button></li>`).join("");
  const seg = ["prov", "org"].map((m) => `<button type="button" role="tab" data-mode="${m}" aria-selected="${S.mode === m}">${ikon(m === "prov" ? "wilayah" : "gedung", 16)}<span>${esc(t("bd2.mode." + m))}</span></button>`).join("");
  const isi = `<div class="jm-tab jm-tab-rata bd-seg" role="tablist" aria-label="${esc(t("bd2.mode"))}">${seg}</div>
    <div class="bd-cari-w"><label class="jm-cari bd-cari">${ikon("cari2", 18)}<span class="sr">${esc(t("bd2.cari"))}</span><input id="bdCari" type="search" autocomplete="off" role="combobox" aria-expanded="${S.buka && !penuh}" aria-controls="bdHasil" value="${esc(S.q)}" placeholder="${esc(t(penuh ? "bd2.penuh" : S.mode === "prov" ? "bd2.cari_prov" : "bd2.cari_org"))}"${penuh ? " disabled" : ""}></label>
      <div id="bdHasil" class="bd-hasil-w" ${S.buka && !penuh ? "" : "hidden"}>${S.buka && !penuh ? hasilHtml() : ""}</div></div>
    <ul class="bd-pilih" data-n="${Math.max(MIN, ent.length)}">${ent.map((e, i) => kartuPilih(e, i, ring(e))).join("")}${slot(kosong)}</ul>
    <p class="bd-catatan">${ikon("info", 14)}<span>${esc(t(S.ids.length < MIN ? "bd2.min" : "bd2.maks", { min: MIN, maks: MAKS }))}</span></p>`;
  return exHtml({ id: "bd-pilih", ikon: "tambah", topik: t("bd2.ey.pilih"), judulHtml: esc(t(S.mode === "prov" ? "bd2.j.pilih_prov" : "bd2.j.pilih_org")), subHtml: esc(t("bd2.sub.pilih", { maks: MAKS })), aksiHtml: bagikanHtml({ url: location.pathname + tulisUrl({ mode: S.mode, ids: S.ids }), judul: t("bd2.judul"), lengkap: true }), isiHtml: isi });
}

/* ---------- tabel angka kunci ---------- */
function tabelHtml(ent) {
  const ms = metrikMode();
  const kep = `<th scope="col" class="bd-th-m">${esc(t("bd2.metrik"))}</th>` + ent.map((e, i) => `<th scope="col" class="${WARNA[i]}"><span class="bd-th">${lambang(e, "bd-lb bd-lb-k")}<span>${esc(e.nama)}</span></span></th>`).join("");
  const baris = ms.map((mt) => {
    const nil = ent.map((e) => e.m[mt.k]), menang = pemenang(nil);
    const sel = ent.map((e, i) => {
      const v = nil[i], ada = typeof v === "number";
      const isi = ada ? `${menang.includes(i) ? `<span class="bd-menang" title="${esc(t("bd2.tertinggi"))}">${ikon("piala", 14)}<b>${esc(fmt(v, mt.d))}</b></span>` : `<span>${esc(fmt(v, mt.d))}</span>`}${mt.sat ? `<small>${esc(mt.sat)}</small>` : ""}` : `<span class="bd-kosong" title="${esc(t("bd2.kosong"))}" tabindex="0">-</span>`;
      return `<td data-label="${esc(e.nama)}" class="bd-n${menang.includes(i) ? " bd-win" : ""}"><span class="bd-v">${isi}</span></td>`;
    }).join("");
    return `<tr><th scope="row" class="bd-th-m" title="${esc(tipM(mt.k))}"><span class="bd-mt">${ikon(mt.ikon, 16)}<span>${esc(labelM(mt.k))}</span></span></th>${sel}</tr>`;
  }).join("");
  const sumber = sumberHtml(esc(t(S.mode === "prov" ? "bd2.sumber_prov" : "bd2.sumber_org")) + ` <a href="/metode#banding">${esc(t("bd2.cara"))}</a>`);
  return exHtml({ id: "bd-angka", ikon: "tabel", topik: t("bd2.ey.angka"), judulHtml: judulAngka(ent), subHtml: esc(t("bd2.sub.angka")), aksiHtml: aksiHtml({ csv: true, png: true, pdf: true, bagi: false }) + sumber,
    isiHtml: `<div class="jm-gulir"><table class="jm-tabel bd-t"><thead><tr>${kep}</tr></thead><tbody>${baris}</tbody></table></div>` });
}
function judulAngka(ent) {
  const ms = metrikMode(), skor = ent.map(() => 0);
  for (const mt of ms) pemenang(ent.map((e) => e.m[mt.k])).forEach((i) => skor[i]++);
  const maks = Math.max(...skor), puncak = ent.filter((_, i) => skor[i] === maks);
  if (!maks) return esc(t("bd2.j.angka_seri"));
  return hlHtml("bd2.j.angka", puncak.length === 1 ? puncak[0].nama : t("bd2.seri"), { n: fmt(maks), dari: fmt(ms.length) });
}

/* ---------- batang berkelompok: satu grup per metrik, tinggi = indeks terhadap pemimpin (100) ---------- */
function kelompokSvg(mt, ent) {
  const nil = ent.map((e) => e.m[mt.k]);
  if (nil.filter((v) => typeof v === "number").length < 1) return "";
  const idx = indeksPemimpin(nil), W = 140, H = 170, B = 130, T = 26, lebar = (W - 16) / ent.length;
  const menang = pemenang(nil);
  const batang = ent.map((e, i) => {
    const v = nil[i];
    if (typeof v !== "number") return "";
    const h = Math.max(2, (idx[i] / 100) * (B - T)), x = 8 + i * lebar + 3, y = B - h;
    return `<rect class="bd-b ${WARNA[i]}${menang.includes(i) ? " bd-b-win" : ""}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(lebar - 6).toFixed(1)}" height="${h.toFixed(1)}" rx="3" data-tip="${esc(`${e.nama}: ${fmt(v, mt.d)}${mt.sat ? " " + mt.sat : ""}`)}"/>`
      + (menang.includes(i) || ent.length <= 3 ? `<text class="jm-gf-t1 bd-bv" x="${(x + (lebar - 6) / 2).toFixed(1)}" y="${(y - 5).toFixed(1)}" text-anchor="middle" font-size="9">${esc(fmtRingkas(v, mt.d))}</text>` : "");
  }).join("");
  return `<figure class="bd-grup"><svg class="jm-gf bd-gf" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(labelM(mt.k))}"><line class="jm-gf-grid" x1="4" x2="${W - 4}" y1="${B}" y2="${B}"/>${batang}</svg><figcaption>${ikon(mt.ikon, 14)}<span>${esc(labelM(mt.k))}</span></figcaption></figure>`;
}
const fmtRingkas = (v, d) => (v >= 1e6 ? fmt(v / 1e6, 1) + " jt" : v >= 1e4 ? fmt(v / 1e3, 0) + " rb" : fmt(v, d));
const legendaHtml = (ent) => `<ul class="bd-legenda">${ent.map((e, i) => `<li class="${WARNA[i]}"><i></i>${lambang(e, "bd-lb bd-lb-k")}<span>${esc(e.nama)}</span></li>`).join("")}</ul>`;
function grafikHtml(ent) {
  const grup = metrikMode().map((mt) => kelompokSvg(mt, ent)).join("");
  return exHtml({ id: "bd-batang", ikon: "grafik", topik: t("bd2.ey.batang"), judulHtml: esc(t("bd2.j.batang")), subHtml: esc(t("bd2.sub.batang")), aksiHtml: aksiHtml({ png: true, pdf: true, bagi: false }),
    isiHtml: legendaHtml(ent) + `<div class="bd-grup-w">${grup || `<p class="bd-kosong-cari">${esc(t("bd2.kosong_grafik"))}</p>`}</div>` });
}

/* ---------- radar: provinsi = 10 komponen indeks (skor 0-100 sumber); organisasi = 7 metrik terhadap pemimpin ---------- */
function radarHtml(ent) {
  const prov = S.mode === "prov", sumbu = prov ? KOMPONEN_PROV : SUMBU_ORG, n = sumbu.length;
  const nilai = (e) => (prov ? sumbu.map((k) => e.komponen[k]) : sumbu.map((k) => e.m[k]));
  const kolom = sumbu.map((_, j) => ent.map((e) => nilai(e)[j]));
  const norm = prov ? kolom : kolom.map((l) => indeksPemimpin(l));
  const W = 420, H = 380, cx = W / 2, cy = H / 2 + 6, R = 128;
  const sudut = (j) => -Math.PI / 2 + (2 * Math.PI * j) / n, titik = (j, r) => [cx + Math.cos(sudut(j)) * r, cy + Math.sin(sudut(j)) * r];
  const cincin = [25, 50, 75, 100].map((p) => `<polygon class="jm-gf-grid bd-ring" points="${sumbu.map((_, j) => titik(j, (R * p) / 100).map((v) => v.toFixed(1)).join(",")).join(" ")}"/>`).join("");
  const jari = sumbu.map((_, j) => { const [x, y] = titik(j, R); return `<line class="jm-gf-grid" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; }).join("");
  const label = sumbu.map((k, j) => { const [x, y] = titik(j, R + 18), c = Math.cos(sudut(j)); return `<text class="jm-gf-t2" x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${Math.abs(c) < 0.25 ? "middle" : c > 0 ? "start" : "end"}" font-size="11">${esc(t((prov ? "bd2.k." : "bd2.mo.") + k))}</text>`; }).join("");
  const poli = ent.map((e, i) => {
    const pts = sumbu.map((_, j) => titik(j, (R * (norm[j][i] ?? 0)) / 100));
    const lingk = sumbu.map((k, j) => (norm[j][i] == null ? "" : `<circle class="bd-pt ${WARNA[i]}" cx="${pts[j][0].toFixed(1)}" cy="${pts[j][1].toFixed(1)}" r="5" data-tip="${esc(`${e.nama} - ${t((prov ? "bd2.k." : "bd2.mo.") + k)}: ${prov ? fmt(kolom[j][i], 1) : fmt(e.m[k], 0) + (k === "mw" ? " MW" : "")}`)}"/>`)).join("");
    return `<g class="bd-rg ${WARNA[i]}"><polygon class="bd-poli" points="${pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}"/>${lingk}</g>`;
  }).join("");
  const svg = `<svg class="jm-gf bd-radar" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("bd2.j.radar"))}">${cincin}${jari}${poli}${label}</svg>`;
  return exHtml({ id: "bd-radar", ikon: "kompas", topik: t("bd2.ey.radar"), judulHtml: esc(t(prov ? "bd2.j.radar" : "bd2.j.radar_org")), subHtml: esc(t(prov ? "bd2.sub.radar" : "bd2.sub.radar_org")), aksiHtml: aksiHtml({ png: true, pdf: true, bagi: false }),
    isiHtml: legendaHtml(ent) + `<div class="bd-radar-w">${svg}</div>` });
}

/* ---------- gambar ---------- */
function bawahHtml() {
  const ent = entitas();
  return ent.length >= MIN
    ? tabelHtml(ent) + `<div class="bd-dua">${grafikHtml(ent)}${radarHtml(ent)}</div>`
    : `<div class="jm-ex bd-kosong-ex">${ikon("tabel", 28)}<p>${esc(t("bd2.min", { min: MIN, maks: MAKS }))}</p></div>`;
}
function gambar() { $("isi").innerHTML = `<div id="bdPilih">${pilihHtml()}</div><div id="bdBawah" class="bd-bawah">${bawahHtml()}</div>`; }
function ubah(fn) { fn(); simpanUrl(); $("bdPilih").innerHTML = pilihHtml(); nanti(() => { const b = $("bdBawah"); if (b) b.innerHTML = bawahHtml(); }); }

async function gantiMode(mode) {
  S.mode = mode; S.q = ""; S.buka = false; S.ids = [];
  $("isi").innerHTML = hantuHtml(5);
  try { const D = await muatMode(mode); S.ids = awal(D, mode); } catch (e) { return tampilGalat($("isi"), () => gantiMode(mode)); }
  simpanUrl(); ubinKepala(); gambar();
}

async function mulai() {
  await mulaiHalaman();
  const dari = bacaUrl(location.search);
  S.mode = dari.mode; S.ids = dari.ids;
  $("isi").innerHTML = hantuHtml(6);
  try {
    const [D, ringkas] = await Promise.all([muatMode(S.mode), muatData("ringkas.json").catch(() => null)]);
    S.D.ringkas = ringkas;
    const sah = new Set(D.daftar.map((x) => x.id));
    S.ids = S.ids.filter((id) => sah.has(id));
    if (S.ids.length < MIN) S.ids = awal(D, S.mode);
    if (S.mode === "org") muatMode("prov").catch(() => {}); /* untuk ubin kepala */
  } catch (e) { return tampilGalat($("isi"), mulai); }
  simpanUrl(); ubinKepala(); gambar();

  const akar = $("isi");
  akar.addEventListener("click", (e) => {
    const m = e.target.closest("[data-mode]");
    if (m) { if (m.dataset.mode === S.mode) return; m.parentElement.querySelectorAll("[role=tab]").forEach((x) => x.setAttribute("aria-selected", String(x === m))); return void nanti(() => gantiMode(m.dataset.mode)); } // chrome urgent
    const h = e.target.closest("[data-hapus]");
    if (h) return ubah(() => { S.ids = S.ids.filter((id) => id !== h.dataset.hapus); });
    const tb = e.target.closest("[data-tambah]");
    if (tb) return ubah(() => { if (S.ids.length < MAKS) S.ids.push(tb.dataset.tambah); S.q = ""; S.buka = false; });
    if (e.target.closest("[data-fokus-cari]")) { S.buka = true; const i = $("bdCari"); i?.focus(); return void ubahBuka(); }
  });
  akar.addEventListener("focusin", (e) => { if (e.target.id === "bdCari" && !S.buka) { S.buka = true; ubahBuka(); } });
  akar.addEventListener("input", (e) => { if (e.target.id !== "bdCari") return; S.q = e.target.value; S.buka = true; const w = $("bdHasil"); w.hidden = false; nanti(() => { w.innerHTML = hasilHtml(); }); });
  akar.addEventListener("keydown", (e) => { if (e.key === "Escape" && S.buka) { S.buka = false; ubahBuka(); } });
  document.addEventListener("click", (e) => { if (S.buka && !e.target.closest(".bd-cari-w") && !e.target.closest("[data-fokus-cari]")) { S.buka = false; ubahBuka(); } });
}
function ubahBuka() { const w = $("bdHasil"); if (!w) return; const penuh = S.ids.length >= MAKS; w.hidden = !(S.buka && !penuh); w.innerHTML = S.buka && !penuh ? hasilHtml() : ""; $("bdCari")?.setAttribute("aria-expanded", String(S.buka && !penuh)); }

saatBahasa(() => { if (S.D[S.mode]) { ubinKepala(); gambar(); } });
mulai();
