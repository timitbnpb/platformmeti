/* /transaksi: pelacak transaksi dan investasi EBT (akuisisi, IPO, obligasi hijau, pembiayaan proyek, investasi asing, JV). Data statis /data/transaksi.json (scripts/pipa/transaksi.mjs). */
import { buktiHtml } from "/inti/bukti.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { nanti, esc, hantuHtml, debounce, ikon } from "/inti/umum.js";
import { t, angka } from "/i18n.js";
import { exHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { pilTek } from "/inti/ikon_tek.js";
import { uangHtml } from "/inti/uang.js";
import { pasangPilih } from "/inti/pilih.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { muatData, tampilGalat, ubinHtml, num, saatBahasa } from "/analisis.js";
import { kolomSvg, batangSvg, legendaHtml, tabel, tipHtml } from "/info_hijau.js";

const $ = (id) => document.getElementById(id);
const JENIS = ["ma", "ipo", "obligasi", "pembiayaan", "pma", "jv"], TEKS = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "campuran"];
const IK_JENIS = { ma: "tautan", ipo: "grafik", obligasi: "tag", pembiayaan: "kartu", pma: "globe", jv: "rantai" };
const IK_ST = { selesai: "centang", diumumkan: "jam", batal: "silang" };
const PIHAK_NILAI = new Set(["pembeli", "pendana", "investor", "mitra"]);
/* titik pusat negara untuk peta asal modal [lon, lat] */
const PUSAT = { us: [-98, 39], jp: [138, 36], th: [101, 15], sg: [103.8, 1.35], ae: [54, 24], ph: [122, 12.5], cn: [104, 35], fr: [2, 46.5], gb: [-2, 54], sa: [45, 24] };
const ID_PUSAT = [118, -2];
const NAMA_NEGARA = (iso) => { try { return new Intl.DisplayNames([document.documentElement.lang || "id"], { type: "region" }).of(iso.toUpperCase()); } catch { return iso.toUpperCase(); } };
let d = null, seriMode = "jenis", saring = { jenis: "", tek: "", tahun: "", negara: "" }, petaObj = null;

const baris = () => d.baris;
const bernilai = (r) => r.status === "selesai" && r.nilai && !r.nilai.batas;
const usd = (r) => r.nilai?.usd_juta || 0;
const tekKode = (r) => r.teknologi || "campuran";
const asing = (p) => p.negara && p.negara !== "id";
const teksUsd = (jt) => (jt >= 1000 ? `US$ ${num(jt / 1000, jt >= 10000 ? 0 : 1)} ${t("tr3.u2s")}` : `US$ ${num(jt, 0)} ${document.documentElement.lang === "en" ? "million" : "juta"}`);
const bendera = (iso, w = 18) => (iso ? `<img class="tr3-fl" src="/img/bendera/${esc(iso)}.svg" alt="" width="${w}" height="${Math.round(w * 0.75)}" loading="lazy">` : ikon("globe", w));
const jenisKelas = (j) => "tr3-j-" + j;
const pilJenis = (j) => `<span class="jm-pil-st tr3-jn tr3-jn-${j}">${ikon(IK_JENIS[j], 14).replace('class="jm-ik"', 'class="jm-ik jm-ikt-s"')}<span>${esc(t("tr3.j." + j))}</span></span>`;
const pilSt = (s) => `<span class="jm-pil-st tr3-st tr3-st-${s}">${ikon(IK_ST[s], 14).replace('class="jm-ik"', 'class="jm-ik jm-ikt-s"')}<span>${esc(t("tr3.st." + s))}</span></span>`;
const pilTekBaris = (r) => (r.teknologi ? pilTek(r.teknologi) : `<span class="jm-pil-tek jm-tek-lain">${esc(t("tr3.tek.campuran_s"))}</span>`);
const kosong = '<span class="ih-kosong" title="-">-</span>';
const tglTeks = (r) => {
  const l = document.documentElement.lang === "en" ? "en" : "id", [y, m, h] = r.tanggal.split("-").map(Number);
  if (r.presisi === "tahun") return String(y);
  const f = new Intl.DateTimeFormat(l, r.presisi === "hari" ? { day: "numeric", month: "short", year: "numeric" } : { month: "short", year: "numeric" });
  return f.format(new Date(Date.UTC(y, m - 1, h || 1)));
};
const logoSel = (p) => (p.logo ? `<img class="tr3-lg" src="${esc(p.logo)}" alt="" width="20" height="20" loading="lazy" decoding="async">` : "");
const pihakHtml = (p) => {
  const n = `<span class="tr3-pn">${logoSel(p)}${bendera(p.negara, 16)}<span>${esc(p.nama)}</span></span>`;
  return p.org_id ? `<a class="tr3-pt" href="/o/${esc(p.org_id)}">${n}</a>` : n;
};
const proyekHtml = (r) => r.proyek_id.length ? r.proyek_id.map((id) => `<a class="ih-tautan tr3-pj" href="/p/${esc(id)}">${esc(id)}</a>`).join(" ") : "";
document.addEventListener("error", (e) => { const i = e.target; if (i?.tagName === "IMG" && i.classList.contains("tr3-lg")) i.remove(); }, true);

/* ---------- agregasi ---------- */
function perTahun() {
  const th = [...new Set(baris().filter(bernilai).map((r) => r.tahun))], a = Math.min(...th), b = Math.max(...th), kat = [];
  for (let y = a; y <= b; y++) kat.push(y);
  return kat;
}
const seriDaftar = () => (seriMode === "jenis" ? JENIS : TEKS);
const kunciSeri = (r) => (seriMode === "jenis" ? r.jenis : tekKode(r));
const labelSeri = (k) => (seriMode === "jenis" ? t("tr3.j." + k) : k === "campuran" ? t("tr3.tek.campuran") : t("pj.tek." + k));
const kelasSeri = (k) => "tr3-s-" + k;

function liga() {
  const m = new Map();
  for (const r of baris().filter(bernilai)) {
    const lihat = new Set();
    for (const p of r.pihak) {
      if (!PIHAK_NILAI.has(p.peran) || p.generik) continue;
      const k = p.org_id || p.nama; if (lihat.has(k)) continue; lihat.add(k);
      const o = m.get(k) || { p, usd: 0, n: 0, jenis: {} }; o.usd += usd(r); o.n++; o.jenis[r.jenis] = (o.jenis[r.jenis] || 0) + usd(r); m.set(k, o);
    }
  }
  return [...m.values()].sort((a, b) => b.usd - a.usd).slice(0, 8);
}
function negaraAgg() {
  const m = new Map();
  for (const r of baris().filter((x) => x.status !== "batal")) {
    const lihat = new Set();
    for (const p of r.pihak) {
      if (!PIHAK_NILAI.has(p.peran) || p.negara === "id" || lihat.has(p.negara)) continue; lihat.add(p.negara);
      const o = m.get(p.negara) || { iso: p.negara, usd: 0, n: 0 }; o.n++; if (bernilai(r)) o.usd += usd(r); m.set(p.negara, o);
    }
  }
  return [...m.values()].sort((a, b) => b.usd - a.usd || b.n - a.n);
}
const investorAsing = () => new Set(baris().flatMap((r) => r.pihak.filter((p) => PIHAK_NILAI.has(p.peran) && asing(p) && !p.generik).map((p) => p.org_id || p.nama)));

/* ---------- kepala ---------- */
function ubin() {
  const sel = baris().filter(bernilai), total = sel.reduce((s, r) => s + usd(r), 0), mw = baris().filter((r) => r.status === "selesai").reduce((s, r) => s + (r.mw || 0), 0);
  const th = Math.min(...baris().map((r) => r.tahun));
  $("jawab").textContent = t("tr3.lead", { n: baris().length, tahun: th, usd: teksUsd(total) });
  $("ubin").innerHTML = ubinHtml([
    { ikon: "transaksi", nilai: num(baris().length), label: t("tr3.u1"), href: "#tabel" },
    { ikon: "kartu", nilai: num(total / 1000, 1), satuan: t("tr3.u2s"), label: t("tr3.u2"), href: "#tahun" },
    { ikon: "petir", nilai: num(mw, 0), satuan: "MW", label: t("tr3.u3"), href: "#tabel" },
    { ikon: "globe", nilai: num(investorAsing().size), label: t("tr3.u4"), href: "#liga" },
  ]);
}

/* ---------- kerangka ---------- */
function opsiSaring() {
  const op = (v, l, ik = "") => `<option value="${esc(v)}"${ik ? ` data-ikon="${esc(ik)}"` : ""}>${esc(l)}</option>`;
  const tahun = [...new Set(baris().map((r) => r.tahun))].sort((a, b) => b - a);
  const neg = [...new Set(baris().flatMap((r) => r.pihak.map((p) => p.negara)).filter((n) => n))].sort((a, b) => NAMA_NEGARA(a).localeCompare(NAMA_NEGARA(b)));
  const sl = (id, aria, ik, isi) => `<label class="tr3-f"><select class="jm-pilih" id="${id}" data-ikon="${ik}" aria-label="${esc(aria)}">${isi}</select></label>`;
  return `<div class="tr3-saring">${[
    sl("fJenis", t("tr3.fa.jenis"), "jenis", op("", t("tr3.f.jenis"), "jenis") + JENIS.map((j) => op(j, t("tr3.j." + j), IK_JENIS[j])).join("")),
    sl("fTek", t("tr3.fa.tek"), "tek:jaringan", op("", t("tr3.f.tek"), "tek:jaringan") + TEKS.filter((k) => k !== "campuran").map((k) => op(k, t("pj.tek." + k), "tek:" + k)).join("") + op("campuran", t("tr3.tek.campuran"), "tek:jaringan")),
    sl("fTahun", t("tr3.fa.tahun"), "tahun", op("", t("tr3.f.tahun"), "tahun") + tahun.map((y) => op(y, y, "tahun")).join("")),
    sl("fNegara", t("tr3.fa.negara"), "globe", op("", t("tr3.f.negara"), "globe") + neg.map((n) => op(n, NAMA_NEGARA(n), "img:/img/bendera/" + n + ".svg")).join("")),
  ].join("")}</div>`;
}
function rangka() {
  const ex = (o) => exHtml({ ...o, aksiHtml: aksiHtml({ csv: !!o.csv }), tingkat: "h2" });
  const sel = baris().filter(bernilai), tahunUsd = new Map();
  for (const r of sel) tahunUsd.set(r.tahun, (tahunUsd.get(r.tahun) || 0) + usd(r));
  const [puncakTh, puncak] = [...tahunUsd].sort((a, b) => b[1] - a[1])[0] || [0, 0];
  const L = liga(), N = negaraAgg().filter((x) => x.iso), top = N[0];
  const selesai = baris().filter((r) => r.status === "selesai").length;
  const tabSeri = `<div class="jm-tab" role="tablist" aria-label="${esc(t("tr3.pilih_seri"))}">${["jenis", "tek"].map((k) => `<button type="button" role="tab" data-seri="${k}" aria-selected="${k === seriMode}">${esc(t("tr3.tab." + k))}</button>`).join("")}</div>`;
  $("isi").innerHTML = [
    ex({ id: "tahun", ikon: "tahun", topik: t("tr3.ey.tahun"), judulHtml: hlHtml("tr3.t.tahun", teksUsd(puncak), { tahun: puncakTh }), subHtml: esc(t("tr3.s.tahun", { n: sel.length, m: selesai })),
      isiHtml: `${tabSeri}<div id="lg-tahun"></div><div id="g-tahun" class="ih-bagan"></div><p class="jm-bantu ih-catatan">${esc(t("tr3.n.nilai", { kurs: num(d.kurs.usd_idr) }))}</p>` }),
    ex({ id: "liga", ikon: "piala", topik: t("tr3.ey.liga"), judulHtml: L[0] ? hlHtml("tr3.t.liga", L[0].p.singkat || L[0].p.nama.replace(/^PT /, ""), { nilai: teksUsd(L[0].usd) }) : esc(t("tr3.ey.liga")), subHtml: esc(t("tr3.s.liga")),
      isiHtml: `${legendaHtml(JENIS.map((j) => ({ kelas: kelasSeri(j), label: t("tr3.j." + j) })))}<div id="g-liga" class="ih-bagan"></div>` }),
    ex({ id: "modal", ikon: "globe", topik: t("tr3.ey.modal"), judulHtml: hlHtml("tr3.t.modal", String(N.length), { top: top ? NAMA_NEGARA(top.iso) : "-" }), subHtml: esc(t("tr3.s.modal")),
      isiHtml: `<div id="peta" class="tr3-peta" role="img" aria-label="${esc(t("tr3.map.label"))}"></div><div id="g-negara" class="ih-bagan tr3-neg"></div>` }),
    ex({ id: "tabel", ikon: "tabel", topik: t("tr3.ey.tabel"), judulHtml: hlHtml("tr3.t.tabel", String(baris().length)), subHtml: esc(t("tr3.s.tabel")), csv: true,
      isiHtml: `${opsiSaring()}<div id="tb" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("tr3.n.tabel"))}</p>` }),
  ].join("");
  pasangPilih();
  for (const [k, id] of [["jenis", "fJenis"], ["tek", "fTek"], ["tahun", "fTahun"], ["negara", "fNegara"]]) $(id).value = saring[k];
  pasangPilih();
  $("tabel").addEventListener("jm:csv", csvSemua);
}

/* ---------- grafik ---------- */
function gTahun() {
  const seri = seriDaftar(), kat = perTahun(), sel = baris().filter(bernilai);
  $("lg-tahun").innerHTML = legendaHtml(seri.map((k) => ({ kelas: kelasSeri(k), label: labelSeri(k) })));
  $("g-tahun").innerHTML = kolomSvg({ el: $("g-tahun"), satuan: t("tr3.tip.usd"), label: t("tr3.ey.tahun"), seri: seri.map((k) => ({ k, kelas: kelasSeri(k) })),
    kategori: kat.map((y) => {
      const L = sel.filter((r) => r.tahun === y), v = {}; let tot = 0;
      for (const r of L) { v[kunciSeri(r)] = (v[kunciSeri(r)] || 0) + usd(r); tot += usd(r); }
      const terbesar = [...L].sort((a, b) => usd(b) - usd(a))[0];
      return { label: String(y), nilai: v, tip: `${y}: ${teksUsd(tot)}`,
        th: tipHtml(String(y), [[t("tr3.tip.total"), teksUsd(tot)], [t("tr3.tip.jumlah"), String(L.length)], ...seri.filter((k) => v[k]).map((k) => [labelSeri(k), teksUsd(v[k]), ""]), ...(terbesar ? [[t("tr3.tip.terbesar"), `${terbesar.pihak.find((p) => ["penerima", "penerbit", "pembeli", "mitra"].includes(p.peran))?.nama || terbesar.id} (${teksUsd(usd(terbesar))})`]] : [])]) };
    }) });
}
function gLiga() {
  const L = liga(), total = baris().filter(bernilai).reduce((s, r) => s + usd(r), 0);
  $("g-liga").innerHTML = batangSvg({ el: $("g-liga"), d: 0, label: t("tr3.ey.liga"), satuan: t("tr3.tip.usd"), seri: JENIS.map((k) => ({ k, kelas: kelasSeri(k) })),
    baris: L.map((o) => ({ label: o.p.singkat || o.p.nama.replace(/^PT /, ""), logo: o.p.logo, bendera: o.p.logo ? "" : o.p.negara, ikon: o.p.negara || o.p.logo ? "" : "globe", tip: `${o.p.nama}: ${teksUsd(o.usd)}`,
      th: tipHtml(o.p.nama, [[t("tr3.tip.nilai"), teksUsd(o.usd)], [t("tr3.tip.jumlah"), String(o.n)], [t("tr3.tip.pangsa"), `${num(o.usd / total * 100, 0)}%`], ...JENIS.filter((j) => o.jenis[j]).map((j) => [t("tr3.j." + j), teksUsd(o.jenis[j])]), [t("tr3.tip.negara"), o.p.negara ? NAMA_NEGARA(o.p.negara) : t("tr3.multi")]], { img: o.p.negara ? `/img/bendera/${o.p.negara}.svg` : "" }),
      bagian: JENIS.map((k) => ({ k, nilai: o.jenis[k] || 0 })) })) });
}
function gNegara() {
  const N = negaraAgg(), total = baris().filter(bernilai).reduce((s, r) => s + usd(r), 0);
  $("g-negara").innerHTML = batangSvg({ el: $("g-negara"), d: 0, label: t("tr3.ey.modal"), satuan: t("tr3.tip.usd"), seri: [{ k: "n", kelas: "tr3-s-neg" }],
    baris: N.map((o) => ({ label: o.iso ? NAMA_NEGARA(o.iso) : t("tr3.multi"), bendera: o.iso, ikon: o.iso ? "" : "globe", tip: `${o.iso ? NAMA_NEGARA(o.iso) : t("tr3.multi")}: ${teksUsd(o.usd)}`,
      th: tipHtml(o.iso ? NAMA_NEGARA(o.iso) : t("tr3.multi"), [[t("tr3.tip.nilai"), teksUsd(o.usd)], [t("tr3.tip.jumlah"), String(o.n)], [t("tr3.tip.pangsa"), `${num(o.usd / total * 100, 0)}%`]], { img: o.iso ? `/img/bendera/${o.iso}.svg` : "" }), bagian: [{ k: "n", nilai: o.usd }] })) });
}

/* ---------- peta asal modal ---------- */
const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
async function peta() {
  const el = $("peta"); if (!el) return;
  const N = negaraAgg().filter((x) => x.iso && PUSAT[x.iso]);
  try { await muatMapLibre(); } catch { el.textContent = t("tr3.map.gagal"); return; }
  if (petaObj) { petaObj.remove(); petaObj = null; }
  const maks = Math.max(1, ...N.map((o) => o.usd));
  petaObj = new maplibregl.Map({ container: el, style: "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron"), center: [90, 20], zoom: 1.6, minZoom: 1, maxZoom: 6, dragRotate: false, pitchWithRotate: false, attributionControl: false });
  petaObj.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
  petaObj.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  const kotak = new maplibregl.LngLatBounds(); kotak.extend([95, -11]); kotak.extend([141, 6]);
  for (const o of N) kotak.extend(PUSAT[o.iso]);
  petaObj.fitBounds(kotak, { padding: { top: 40, bottom: 40, left: 40, right: 40 }, duration: 0, maxZoom: 3.2 });
  petaObj.on("load", () => {
    petaObj.addSource("busur", { type: "geojson", data: { type: "FeatureCollection", features: N.map((o) => ({ type: "Feature", geometry: { type: "LineString", coordinates: [PUSAT[o.iso], ID_PUSAT] }, properties: {} })) } });
    petaObj.addLayer({ id: "busur", type: "line", source: "busur", paint: { "line-color": gelap() ? "#4FD3AD" : "#0A5C47", "line-width": 1.4, "line-opacity": 0.5, "line-dasharray": [2, 2] } });
  });
  const marker = (lngLat, isi, ukuran, kelas) => { const m = document.createElement("div"); m.className = "tr3-mk " + kelas; m.style.width = m.style.height = ukuran + "px"; m.innerHTML = isi; new maplibregl.Marker({ element: m }).setLngLat(lngLat).addTo(petaObj); return m; };
  marker(ID_PUSAT, `<img src="/img/bendera/id.svg" alt="" width="40" height="30"><b>${esc(t("tr3.map.id"))}</b>`, 44, "tr3-mk-id");
  for (const o of N) {
    const u = 30 + Math.round(24 * Math.sqrt(o.usd / maks)), m = marker(PUSAT[o.iso], `<img src="/img/bendera/${esc(o.iso)}.svg" alt="" width="${u}" height="${u}"><b>${o.n}</b>`, u, "tr3-mk-n");
    const pop = new maplibregl.Popup({ closeButton: false, offset: u / 2 + 4, className: "tr3-pop" }).setHTML(`<div class="tr3-tipm"><b>${bendera(o.iso, 20)}${esc(NAMA_NEGARA(o.iso))}</b><span><em>${esc(t("tr3.tip.nilai"))}</em><strong>${esc(teksUsd(o.usd))}</strong></span><span><em>${esc(t("tr3.tip.jumlah"))}</em><strong>${o.n}</strong></span></div>`);
    m.setAttribute("tabindex", "0"); m.setAttribute("role", "img"); m.setAttribute("aria-label", `${NAMA_NEGARA(o.iso)}: ${teksUsd(o.usd)}, ${o.n}`);
    const buka = () => pop.setLngLat(PUSAT[o.iso]).addTo(petaObj), tutup = () => pop.remove();
    m.addEventListener("pointerenter", buka); m.addEventListener("pointerleave", tutup); m.addEventListener("focus", buka); m.addEventListener("blur", tutup); m.addEventListener("click", buka);
  }
}

/* ---------- tabel ---------- */
const lolos = (r) => (!saring.jenis || r.jenis === saring.jenis) && (!saring.tek || tekKode(r) === saring.tek) && (!saring.tahun || String(r.tahun) === saring.tahun) && (!saring.negara || r.pihak.some((p) => p.negara === saring.negara));
const dipilih = () => baris().filter(lolos);
const nilaiSel = (r) => {
  if (!r.nilai) return kosong;
  const n = r.nilai, est = t("tr3.est"), pre = n.batas ? t("tr3.maks") + " " : "";
  const utama = n.mu === "IDR" ? uangHtml("Rp", `${pre}${num(n.jumlah, n.jumlah < 100 ? 1 : 0)} ${document.documentElement.lang === "en" ? "bn" : "miliar"}`, "") : uangHtml("US$", `${pre}${num(n.jumlah, n.jumlah % 1 ? 1 : 0)} ${document.documentElement.lang === "en" ? "m" : "juta"}`, "");
  const lain = n.mu === "IDR" ? uangHtml("US$", `${num(n.usd_juta, 1)} ${document.documentElement.lang === "en" ? "m" : "juta"} ${est}`, "") : n.idr_miliar >= 1000 ? uangHtml("Rp", `${num(n.idr_miliar / 1000, 1)} ${document.documentElement.lang === "en" ? "tn" : "triliun"} ${n.est_idr ? est : ""}`, "") : uangHtml("Rp", `${num(n.idr_miliar, 0)} ${document.documentElement.lang === "en" ? "bn" : "miliar"} ${n.est_idr ? est : ""}`, "");
  return `<span class="tr3-nl">${utama}<small>${lain}</small></span>`;
};
const transaksiSel = (r) => {
  const urut = ["pembeli", "penjual", "penerbit", "penerima", "pendana", "investor", "mitra"], per = {};
  for (const p of r.pihak) (per[p.peran] ||= []).push(p);
  const baris2 = urut.filter((k) => per[k]).slice(0, 3).map((k) => `<span class="tr3-pr"><em>${esc(t("tr3.p." + k))}</em><span>${per[k].slice(0, 3).map(pihakHtml).join("")}${per[k].length > 3 ? `<small>+${per[k].length - 3} ${esc(t("tr3.pihak_lain"))}</small>` : ""}</span></span>`).join("");
  return `<div class="tr3-tx"><b>${esc(r.aset)}</b>${proyekHtml(r) ? `<span class="tr3-pjs">${proyekHtml(r)}</span>` : ""}${baris2}</div>`;
};
const sumberSel = (r) => `<span class="tr3-sm"><a class="ih-tautan tr3-src" href="${esc(r.sumber.url)}" target="_blank" rel="noopener noreferrer" title="${esc(r.sumber.judul)}">${esc(r.sumber.penerbit)}</a>${buktiHtml(r.tingkat_bukti, { sumber: r.sumber.penerbit, tanggal: r.tanggal_ambil })}</span>`;
function tb() {
  const B = dipilih();
  if (!B.length) { $("tb").innerHTML = `<p class="jm-kosong">${esc(t("tr3.kosong"))}</p>`; return; }
  tabel($("tb"), { satuan: "tr3.u.transaksi", per: 8, urutAwal: 0, menurun: true, kelasBaris: (r) => "tr3-b-" + r.status, kolom: [
    { label: t("tr3.c.tgl"), v: (r) => r.tanggal, f: (r) => `<span class="tr3-tg">${esc(tglTeks(r))}</span>` },
    { label: t("tr3.c.jenis"), v: (r) => t("tr3.j." + r.jenis), f: (r) => pilJenis(r.jenis) },
    { label: t("tr3.c.transaksi"), v: (r) => r.aset, f: transaksiSel },
    { label: t("tr3.c.tek"), v: (r) => tekKode(r), f: pilTekBaris },
    { label: t("tr3.c.nilai"), num: true, v: (r) => (r.nilai ? r.nilai.usd_juta : null), f: nilaiSel },
    { label: t("tr3.c.mw"), num: true, v: (r) => r.mw, f: (r) => (r.mw != null ? `<b>${num(r.mw, r.mw % 1 ? 1 : 0)}</b>` : kosong) },
    { label: t("tr3.c.status"), v: (r) => r.status, f: (r) => pilSt(r.status) },
    { label: t("tr3.c.sumber"), v: (r) => r.sumber.penerbit, f: sumberSel },
  ], baris: B });
}
function csvSemua(e) {
  const K = ["tanggal", "jenis", "status", "aset", "pihak", "teknologi", "mw", "nilai_asli", "mata_uang", "usd_juta", "idr_miliar", "tingkat_bukti", "sumber", "url"];
  e.detail.baris = [K, ...dipilih().map((r) => [r.tanggal, t("tr3.j." + r.jenis), t("tr3.st." + r.status), r.aset, r.pihak.map((p) => `${t("tr3.p." + p.peran)}: ${p.nama}`).join(" | "), r.teknologi || "", r.mw ?? "", r.nilai?.jumlah ?? "", r.nilai?.mu ?? "", r.nilai?.usd_juta ?? "", r.nilai?.idr_miliar ?? "", r.tingkat_bukti, r.sumber.penerbit, r.sumber.url])];
}

async function mulai() {
  await mulaiHalaman();
  $("isi").innerHTML = hantuHtml(3);
  try { d = await muatData("transaksi.json"); } catch (e) { tampilGalat($("isi"), mulai); return; }
  const gambar = () => { ubin(); rangka(); gTahun(); gLiga(); gNegara(); tb(); nanti(peta); };
  gambar();
  saatBahasa(gambar);
  $("isi").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-seri]"); if (!b || b.getAttribute("aria-selected") === "true") return;
    for (const x of b.parentElement.children) x.setAttribute("aria-selected", String(x === b));
    seriMode = b.dataset.seri; nanti(gTahun);
  });
  $("isi").addEventListener("change", (e) => {
    const m = { fJenis: "jenis", fTek: "tek", fTahun: "tahun", fNegara: "negara" }[e.target.id]; if (!m) return;
    saring[m] = e.target.value; nanti(tb);
  });
  let w = innerWidth;
  addEventListener("resize", debounce(() => { if (Math.abs(innerWidth - w) > 20) { w = innerWidth; gTahun(); gLiga(); gNegara(); } }, 200));
}
mulai();
