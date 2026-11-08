/* /topik: penyaji bab bergaya baru (ringkasan eksekutif, jawaban cepat, glosarium, teks bersisi fakta, rumus + kalkulator mini, rantai nilai, kartu kasus).
   Tabel, peta, grafik, linimasa ada di topik_data.js. Teks antarmuka lewat t("tp.*") (kamus global); teks bab dari data lewat tok()/L(). */
import { t } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { pilihHtml, cariHtml } from "/inti/komponen.js";
import { ikonTek } from "/inti/ikon_tek.js";
import { kodeProv, PROV } from "/inti/prov_singkat.js";
import { S, L, u, num, tok, sumberHtml, catatan } from "/topik_umum.js";
import { K, rapi, angkaDalam, norm, cariOrg, logoKotak, lambang, bendera, penerbit, logoPenerbit, spark, KAMUS_TEK } from "/topik_wujud.js";

const ikonLabel = (s) => (/kapasitas|capacity|mw\b|daya|listrik|electric/i.test(s) ? "tek-listrik" : /harga|biaya|price|cost|usd|rp\b|dana|invest/i.test(s) ? "kartu" : /porsi|pangsa|share|bauran|persen/i.test(s) ? "grafik" : /pabrik|factor/i.test(s) ? "pabrik" : /target|sasaran/i.test(s) ? "bintang" : /emisi|karbon|co2/i.test(s) ? "analisis" : /proyek|project/i.test(s) ? "proyek" : /regulasi|aturan|permen|uu\b/i.test(s) ? "regulasi" : /tahun|year|bulan/i.test(s) ? "kalender" : /pemain|organisasi|perusahaan/i.test(s) ? "gedung" : "analisis");
const ikonButir = (s) => (/permen|uu\b|perpres|aturan|regulasi|kuota|izin/i.test(s) ? "regulasi" : /proyek|ppa|jaringan|pengelola/i.test(s) ? "proyek" : /kapasitas|listrik|mw|gw/i.test(s) ? "tek-listrik" : /harga|biaya|rp|usd|dana/i.test(s) ? "kartu" : /emisi|karbon/i.test(s) ? "analisis" : "bintang");

/* ---------- ringkasan eksekutif: ubin sejajar tanpa yatim, label penuh, tren kecil, tiga hal, kalimat posisi ---------- */
export function ringkasanHtml(k, ctx) {
  const naskah = ctx.naskah, tren = naskah?.bab?.[7]?.seri?.find((s) => s.sorot) || naskah?.bab?.[7]?.seri?.[0];
  const ub = k.map((x, i) => {
    const deret = x.deret || (i === 0 && tren && /kapasitas|capacity|terpasang/i.test(x.label) ? tren.titik : null);
    const sat = x.satuan ? `<small>${esc(x.satuan)}</small>` : "";
    return `<li class="jm-tp-ub"><span class="jm-tp-ub-ik">${ikon(x.ikon && x.ikon !== "analisis" ? x.ikon : ikonLabel(x.label), 20)}</span><span class="jm-tp-ub-l">${esc(x.label)}</span><b class="jm-tp-ub-n">${esc(x.nilai)}${sat}</b><span class="jm-tp-ub-b">${deret ? spark(deret, { label: x.label }) : "<span></span>"}<span class="jm-tp-ub-s">${x.est ? `<span class="jm-pil">EST</span>` : ""}${sumberHtml(x.src || [])}</span></span></li>`;
  }).join("");
  let h = `<ul class="jm-tp-ubin5" data-n="${k.length}">${ub}</ul>`;
  const penting = naskah?.penting || [];
  if (penting.length) h += `<h3 class="jm-tp-h3">${esc(u("ringkas.penting"))}</h3><ol class="jm-tp-tiga" data-n="${penting.length}">${penting.map((p, i) => { const s = tok(p); return `<li><span class="jm-tp-tiga-ik">${ikon(ikonButir(s), 20)}<i>${i + 1}</i></span><p>${rapi(s)}</p></li>`; }).join("")}</ol>`;
  if (naskah?.posisi) h += `<p class="jm-tp-posisi">${ikon("kompas", 22)}<span>${rapi(tok(naskah.posisi))}</span></p>`;
  return h;
}

/* ---------- jawaban cepat: akordeon, tiga pertama terbuka ---------- */
const AMBIL_BAB = [[/peta|provinsi|daerah|wilayah|cerah|pvout|lokasi/i, 8], [/pabrik|perusahaan|pemain|pengembang/i, 9], [/regulasi|permen|\buu\b|aturan|kuota|izin|dibayar/i, 12], [/proyek|beroperasi/i, 10], [/kapasitas|tren|naik|turun|capacity|trend/i, 7]];
export function adaBab(ctx, n) {
  const d = ctx.dasar;
  return !!(ctx.naskah?.bab?.[n] || (n === 9 && d.pemain?.length) || (n === 10 && d.proyek?.daftar?.length) || (n === 12 && d.regulasi?.length));
}
export function faq(b, id, ctx) {
  const butir = b.butir || [], src = sumberHtml(b.sumber || []);
  return { html: `<div class="jm-tp-faq">${butir.map((x, i) => {
    const q = tok(x.t), a = tok(x.j), n = x.bab || (AMBIL_BAB.find((p) => p[0].test(q + " " + a)) || [])[1];
    const tautan = n && S.ui.bab[n] && adaBab(ctx, n) ? `<a class="jm-tp-faq-ke" href="#bab-${n}">${ikon("tautan", 16)}<span>${esc(t("tp.lihat", { bab: L(S.ui.bab[n].j) }))}</span></a>` : "";
    return `<details${i < 3 ? " open" : ""}><summary><span class="jm-tp-faq-ik">${ikon("tanya", 20)}</span><span>${esc(q)}</span></summary><div class="jm-tp-faq-j"><p class="jm-tp-p">${rapi(a)}</p><div class="jm-tp-faq-aksi">${tautan}${src}</div></div></details>`;
  }).join("")}</div>`, sumber: [] };
}

/* ---------- glosarium: cari + huruf A-Z + ikon kategori ---------- */
const KAT_ISTILAH = [[/\b(wp|wh|mw|kw|gw|twh|kwh|ton|co2)\b|satuan|unit of/i, "kalkulator", "tp.kat.satuan"], [/permen|\buu\b|perpres|regulasi|aturan|izin|peraturan|kuota|regulation|permit|rule/i, "palu", "tp.kat.aturan"], [/rp\b|biaya|tarif|harga|lcoe|capex|ppa|kredit|pajak|investasi|cost|tariff|price|credit|tax|invest/i, "kartu", "tp.kat.uang"]];
export function glosarium(b) {
  const butir = (b.butir || []).map((x) => { const istilah = L(x.istilah), arti = tok(x.arti), kt = KAT_ISTILAH.find((k) => k[0].test(istilah + " " + arti)) || [0, "petir", "tp.kat.teknis"], h = istilah.charAt(0).toLocaleUpperCase(); return { istilah, arti, ik: kt[1], kat: t(kt[2]), h: /[A-Z]/.test(h) ? h : "#" }; }).sort((a, z) => a.istilah.localeCompare(z.istilah));
  const ada = new Set(butir.map((x) => x.h)), abjad = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
  const huruf = `<div class="jm-tp-abjad" role="group" aria-label="${esc(t("tp.huruf"))}"><button type="button" class="jm-tp-hrf" data-gl-h="" aria-pressed="true">${esc(t("tp.semua"))}</button>${abjad.map((c) => `<button type="button" class="jm-tp-hrf" data-gl-h="${c}" aria-pressed="false"${ada.has(c) ? "" : " disabled"}>${c}</button>`).join("")}</div>`;
  return { html: `<div class="jm-tp-glw" data-gl><div class="jm-tp-glbar">${cariHtml({ id: "gl-" + Math.random().toString(36).slice(2, 7), label: t("tp.cari_istilah"), placeholder: t("tp.cari_istilah") }).replace("<input ", "<input data-gl-cari ")}<span class="jm-tp-gl-n" role="status" aria-live="polite"></span></div>${huruf}<dl class="jm-tp-glos">${butir.map((x) => `<div class="jm-tp-gl" data-h="${x.h}" data-q="${esc((x.istilah + " " + x.arti).toLowerCase())}"><dt><span class="jm-tp-gl-ik" title="${esc(x.kat)}">${ikon(x.ik, 18)}</span>${esc(x.istilah)}</dt><dd>${esc(x.arti)}</dd></div>`).join("")}</dl><p class="jm-bantu jm-tp-gl-kosong" hidden>${esc(t("tp.tak_ada"))}</p></div>`, sumber: b.sumber };
}
function saringGlosarium(w) {
  const q = (w.querySelector("[data-gl-cari]")?.value || "").trim().toLowerCase(), h = w.querySelector("[aria-pressed=true][data-gl-h]")?.dataset.glH || "";
  let n = 0;
  for (const d of w.querySelectorAll(".jm-tp-gl")) { const ok = (!h || d.dataset.h === h) && (!q || d.dataset.q.includes(q)); d.hidden = !ok; if (ok) n++; }
  w.querySelector(".jm-tp-gl-kosong").hidden = n > 0;
  w.querySelector(".jm-tp-gl-n").textContent = t("tp.n_istilah", { n: num(n) });
}

/* ---------- teks naratif: rata kiri, angka disorot, ubin fakta di samping, ilustrasi ---------- */
export function fakta(paragraf, maks = 3) {
  const a = [];
  for (const p of paragraf) for (const k of String(p).split(/(?<=[.!?])\s+/)) {
    const g = angkaDalam(k).find((x) => x.satuan && x.satuan !== "tahun" || /^(Rp|USD)/.test(x.nilai));
    if (g && a.length < maks && !a.some((x) => x.nilai === g.nilai)) a.push({ nilai: g.nilai + (g.satuan ? " " + g.satuan : ""), satuan: g.satuan, teks: k.length > 120 ? k.slice(0, 117).replace(/\s+\S*$/, "") + "..." : k });
  }
  return a;
}
export function teksSisi(b, id, ctx) {
  const ps = (b.paragraf || []).map((p) => tok(p)), n = ctx.n, fk = fakta(ps), ilus = n === 4 || n === 11;
  const badan = ps.map((p) => `<p class="jm-tp-p">${rapi(p)}</p>`).join("") + catatan(b.catatan);
  if (!fk.length && !ilus) return { html: badan, sumber: b.sumber };
  const tek = KAMUS_TEK[ctx.id] || "jaringan";
  const gambar = ilus ? `<figure class="jm-tp-ilus${ctx.foto ? " jm-tp-ilus-foto" : ""}">${ctx.foto ? `<img src="${esc(ctx.foto)}" alt="" width="640" height="360" loading="lazy" decoding="async" data-galat="hapus">` : ""}<span class="jm-tp-ilus-ik">${ikonTek(tek)}</span><figcaption>${esc(L(S.ui.topik[ctx.id].nama))}</figcaption></figure>` : "";
  const ub = fk.map((f) => `<li class="jm-tp-fk"><span class="jm-tp-fk-ik">${ikon(ikonButir(f.teks), 18)}</span><b>${esc(f.nilai)}</b><span>${rapi(f.teks)}</span></li>`).join("");
  return { html: `<div class="jm-tp-sisi"><div class="jm-tp-sisi-t">${badan}</div><aside class="jm-tp-sisi-s">${gambar}${ub ? `<ul class="jm-tp-fk-l">${ub}</ul>` : ""}</aside></div>`, sumber: b.sumber };
}

/* ---------- sains dan cara hitung: rumus berikon, kalkulator mini (surya) atau langkah bernomor ---------- */
const KALK = new Map();
export function rumus(b, id, ctx) {
  const rows = (ctx.naskah?.bab?.[8]?.baris || []).filter((r) => typeof r.pvout === "number" && kodeProv(r.prov)).sort((a, z) => String(a.prov).localeCompare(String(z.prov)));
  const kalk = ctx.id === "surya" && rows.length >= 10 && (b.rumus || []).length ? kalkulator(rows, ctx) : "";
  const rm = `<div class="jm-tp-rumus">${(b.rumus || []).map((r) => `<p>${ikon("kalkulator", 20)}<span>${rapi(tok(r))}</span></p>`).join("")}</div>`;
  const contoh = kalk || ((b.contoh || []).length ? `<h3 class="jm-tp-h3">${esc(u("contoh"))}</h3><ol class="jm-tp-langkah jm-tp-contoh">${b.contoh.map((c) => `<li>${rapi(tok(c))}</li>`).join("")}</ol>` : "");
  const tautan = `<div class="jm-tp-rumus-ke"><a class="jm-tp-cta" href="/metode">${ikon("metode", 16)}<span>${esc(t("tp.cara_hitung"))}</span></a>${ctx.id === "bioenergi" ? `<a class="jm-tp-cta" href="/bioenergi">${ikon("bioenergi", 16)}<span>${esc(t("tp.modul_bioenergi"))}</span></a>` : ""}${ctx.id === "hidro" ? `<a class="jm-tp-cta" href="/hidro">${ikon("hidro", 16)}<span>${esc(t("tp.modul_hidro"))}</span></a>` : ctx.id === "panas-bumi" ? `<a class="jm-tp-cta" href="/panas-bumi">${ikon("panas-bumi", 16)}<span>${esc(t("tp.modul_panasbumi"))}</span></a>` : ""}${ctx.id === "bayu" ? `<a class="jm-tp-cta" href="/angin">${ikon("angin", 16)}<span>${esc(t("tp.modul_angin"))}</span></a>` : ""}${ctx.id === "sampah-energi" ? `<a class="jm-tp-cta" href="/sampah-energi">${ikon("sampah-energi", 16)}<span>${esc(t("swe.tp.modul"))}</span></a>` : ""}${ctx.id === "transisi-berkeadilan" ? `<a class="jm-tp-cta" href="/transisi-pltu?tab=pekerja">${ikon("pltu", 16)}<span>${esc(t("tp.modul_transisi_pltu"))}</span></a>` : ""}${ctx.id === "hidrogen" ? `<a class="jm-tp-cta" href="/hidrogen">${ikon("hidrogen", 16)}<span>${esc(t("tp.modul_hidrogen"))}</span></a>` : ""}${ctx.id === "jaringan" ? `<a class="jm-tp-cta" href="/jaringan">${ikon("menara", 16)}<span>${esc(t("jr.dari.topik"))}</span></a>` : ""}${ctx.id === "surya" ? `<a class="jm-tp-cta" href="/surya">${ikon("panel-surya", 16)}<span>${esc(t("sur.dari_topik"))}</span></a><a class="jm-tp-cta" href="/peluang#plts-atap">${ikon("kalkulator", 16)}<span>${esc(t("tp.kalkulator_atap"))}</span></a>` : ""}</div>`;
  return { html: rm + contoh + catatan(b.catatan) + tautan, sumber: b.sumber };
}
function kalkulator(rows, ctx) {
  const id = "kk-" + ctx.id, awal = rows.find((r) => /barat/i.test(r.prov) && /jawa/i.test(r.prov)) || rows[0];
  KALK.set(id, rows);
  const opsi = rows.map((r) => [r.prov, r.prov, "prov:" + kodeProv(r.prov)]);
  return `<h3 class="jm-tp-h3">${esc(t("tp.kalk.judul"))}</h3><div class="jm-tp-kalk" data-kalk="${id}"><div class="jm-tp-kalk-in"><label class="jm-tp-kalk-f"><span>${esc(t("tp.kalk.kwp"))}</span><input type="number" inputmode="decimal" min="0.5" max="100000" step="0.5" value="3" data-kalk-kwp></label><div class="jm-tp-kalk-f"><span>${esc(t("tp.kalk.prov"))}</span>${pilihHtml({ id: id + "-p", ikon: "peta", label: t("tp.kalk.prov"), opsi, nilai: awal.prov })}</div></div><ul class="jm-tp-kalk-out"><li><span class="jm-tp-ub-ik">${ikon("petir", 18)}</span><span>${esc(t("tp.kalk.produksi"))}</span><b data-k-prod>-</b></li><li><span class="jm-tp-ub-ik">${ikon("grafik", 18)}</span><span>${esc(t("tp.kalk.fk"))}</span><b data-k-fk>-</b></li><li><span class="jm-tp-ub-ik">${ikon("tek-surya", 18)}</span><span>PVOUT</span><b data-k-pv>-</b></li></ul><p class="jm-bantu">${esc(t("tp.kalk.ket"))} <span class="jm-pil">EST</span></p></div>`;
}
function hitungKalk(el) {
  const rows = KALK.get(el.dataset.kalk), p = el.querySelector("select")?.value, r = rows?.find((x) => x.prov === p), kwp = +el.querySelector("[data-kalk-kwp]").value;
  if (!r || !(kwp > 0)) { el.querySelectorAll("[data-k-prod],[data-k-fk],[data-k-pv]").forEach((e) => { e.textContent = "-"; }); return; }
  el.querySelector("[data-k-prod]").textContent = num(kwp * r.pvout, 0) + " kWh";
  el.querySelector("[data-k-fk]").textContent = num((r.pvout / 8760) * 100, 1) + "%";
  el.querySelector("[data-k-pv]").textContent = num(r.pvout, 0) + " kWh/kWp";
}

/* ---------- peta rantai nilai: diagram alir hulu-hilir, logo pemain, hitungan, tautan direktori ---------- */
const ROL = [[/pengembang|developer|epc|kontraktor|ipp/i, ["pengembang", "ipp", "epc"], "proyek"], [/pabrik|manufaktur|produsen|modul/i, ["manufaktur", "produsen bbn"], "pabrik", "pabrik"], [/pemasok|supplier|komponen|inverter|baterai|struktur/i, ["pemasok"], "rantai", "pemasok"], [/operator|pln|pembeli|offtaker|pelanggan/i, ["operator"], "tek-listrik"], [/pemodal|pembiay|bank|pendana|investor/i, ["pembiaya", "pendana"], "berlian"], [/pemerintah|kebijakan|regulator|kementerian|lembaga/i, ["lembaga"], "regulasi"]];
export function rantai(b, id, ctx) {
  const butir = b.butir || [], rp = ctx.rantai?.teknologi?.find((x) => x.id === ctx.id.replace(/-/g, "_") || x.id === ctx.id), komp = rp?.komponen || [];
  const tahap = butir.map((x, i) => {
    const s = tok(x.judul) + " " + tok(x.pelaku), r = ROL.find((q) => q[0].test(s)), pl = new Map();
    const tambah = (o) => { const k = norm(o.nama); if (k && !pl.has(k)) pl.set(k, o); };
    if (r) for (const o of ctx.dasar.pemain || []) if ((o.peran || []).some((p) => r[1].includes(String(p).toLowerCase()))) tambah({ id: o.id, nama: o.nama, logo: o.logo });
    if (r?.[3] === "pabrik") for (const o of komp[0]?.pemasok || []) tambah({ id: o.org_id || o.id, nama: o.nama, logo: o.logo ? `/img/logo/org/${o.logo}.png` : "", ada: !!o.org_id });
    if (r?.[3] === "pemasok") for (const c of komp.slice(1)) for (const o of c.pemasok || []) tambah({ id: o.org_id || o.id, nama: o.nama, logo: o.logo ? `/img/logo/org/${o.logo}.png` : "", ada: !!o.org_id });
    const pb = []; for (const q of (s + " " + tok(x.isi)).matchAll(/\b(ESDM|Kemenperin|Kemenkeu|Kemendag|Bappenas|BUMN|PLN|Kemenhut|Bapeten)\b/g)) { const p = penerbit(q[1]); if (p && !pb.some((x) => x.nama === p.nama)) pb.push(p); }
    const daftar = [...pl.values()];
    return { x, n: i + 1, ik: r?.[2] || "daftar", daftar, pb, tek: ctx.id };
  });
  const kartu = tahap.map((h) => {
    const logos = h.daftar.slice(0, 4).map((o) => { const org = cariOrg(o.nama); return `<a class="jm-tp-alir-lg" href="${org || o.ada || /^(p|in|l)_/.test(o.id || "") ? "/o/" + esc((org || o).id || o.id) : "/direktori?tampil=lembaga"}" title="${esc(o.nama)}">${logoKotak(o.id, o.nama, o.logo, "jm-tp-logo-s")}</a>`; }).join("") + h.pb.map((p) => `<span class="jm-tp-alir-lg">${logoPenerbit(p)}</span>`).join("");
    const lebih = h.daftar.length > 4 ? `<span class="jm-tp-alir-plus">+${esc(num(h.daftar.length - 4))}</span>` : "";
    return `<li class="jm-tp-alir-t"><span class="jm-tp-alir-no">${h.n}</span><span class="jm-tp-alir-ik">${ikon(h.ik, 24)}</span><h4>${esc(tok(h.x.judul))}</h4><p>${rapi(tok(h.x.isi))}</p>${h.x.pelaku ? `<small>${esc(tok(h.x.pelaku))}</small>` : ""}<div class="jm-tp-alir-lgs">${logos}${lebih}</div>${h.daftar.length ? `<a class="jm-tp-alir-n" href="/direktori?tampil=lembaga&amp;sektor=${esc(ctx.id)}">${ikon("direktori", 14)}<span>${esc(t("tp.n_pemain", { n: num(h.daftar.length) }))}</span></a>` : `<span class="jm-tp-alir-n jm-tp-alir-n0">${esc(t("tp.pemain_nol"))}</span>`}</li>`;
  }).join("");
  const n = butir.length;
  return { html: `<ol class="jm-tp-alir" data-n="${n}" aria-label="${esc(t("tp.alir"))}">${kartu}</ol><p class="jm-bantu jm-tp-alir-ket"><span>${ikon("info", 14)}</span>${esc(t("tp.alir_ket"))}</p>${catatan(b.catatan)}`, sumber: b.sumber };
}

/* ---------- kartu kasus (mercusuar dan gagal) ---------- */
const ikonAngka = (s) => (/mw|gw|kapasitas|capacity|daya/i.test(s) ? "tek-listrik" : /usd|rp\b|biaya|nilai|cost|value|tarif|tariff|investasi/i.test(s) ? "kartu" : /tahun|year|bulan|month|sejak|operasi|operation/i.test(s) ? "kalender" : /ha\b|hektare|lahan|area/i.test(s) ? "peta" : /orang|jiwa|rumah|pekerja|people|homes|jobs/i.test(s) ? "orang" : /persen|%|faktor|factor|efisiensi/i.test(s) ? "grafik" : "analisis");
function pengembang(k) {
  const m = new Map();
  for (const p of k.profil || []) if (/pemilik|kepemilikan|pengembang|owner|developer|kontraktor|operator|sponsor/i.test(tok(p.label))) {
    for (const bag of tok(p.nilai).split(/[,;]|\s+dan\s+|\s+and\s+|\(|\)/)) {
      const nm = bag.replace(/\b\d+([.,]\d+)?\s*(persen|percent|%)/gi, "").replace(/\s+/g, " ").trim(), o = nm.length > 2 ? cariOrg(nm) : null;
      if (o && !m.has(o.id)) m.set(o.id, o);
    }
  }
  return [...m.values()].slice(0, 3);
}
export function kartuKasus(k, bantu) {
  const gagal = k.jenis !== "berhasil", iso = String(k.negara || "").toLowerCase(), lokal = iso === "id", lok = tok(k.lokasi || "");
  const kodeP = lokal ? Object.keys(PROV).find((c) => lok.toLowerCase().includes(PROV[c][0].toLowerCase())) : "";
  const foto = k.foto?.src || k.foto_url;
  const dev = pengembang(k).map((o) => `<a class="jm-tp-kv-dev" href="/o/${esc(o.id)}" title="${esc(o.nama)}">${logoKotak(o.id, o.nama, o.logo, "jm-tp-logo-s")}</a>`).join("");
  const sampul = foto
    ? `<figure class="jm-tp-kfoto"><img src="${esc(foto)}" alt="${esc(L(k.foto?.alt))}" loading="lazy" decoding="async" data-galat="hapus"><figcaption>${esc(k.foto?.kredit || "")}</figcaption></figure>`
    : `<div class="jm-tp-kfoto jm-tp-kfoto-ikon" aria-hidden="true"><span class="jm-tp-kv-b">${kodeP ? lambang(kodeP, 56) : bendera(iso, 64) || ikon("lokasi", 40)}</span>${dev ? `<span class="jm-tp-kv-d">${dev}</span>` : ""}<span class="jm-tp-kv-l">${ikon("lokasi", 16)}<span>${esc(lok)}</span></span></div>`;
  const profil = (k.profil || []).length ? `<ul class="jm-tp-fakta">${k.profil.map((p) => { const v = tok(p.nilai) + (p.satuan ? " " + L(p.satuan) : ""), lab = tok(p.label); return `<li><span class="jm-tp-ub-ik">${ikon(ikonAngka(lab + " " + v), 18)}</span><span class="jm-tp-fakta-l">${esc(lab)}</span><b>${rapi(v)}</b></li>`; }).join("")}</ul>` : "";
  const angka = (k.angka || []).length ? `<ul class="jm-tp-angka">${k.angka.map((a) => { const lab = tok(a.label); return `<li><span class="jm-tp-ub-ik">${ikon(ikonAngka(lab + " " + L(a.satuan)), 18)}</span><b>${esc(typeof a.nilai === "number" ? num(a.nilai, a.d || 0) : tok(a.nilai))}${a.satuan ? `<small>${esc(L(a.satuan))}</small>` : ""}</b><span>${esc(lab)}${a.est ? ` <span class="jm-pil">EST</span>` : ""}</span></li>`; }).join("")}</ul>` : "";
  const pilJenis = `<span class="jm-pil ${gagal ? "jm-pil-warn" : "jm-pil-ok"} jm-tp-pil-i">${ikon(gagal ? "peringatan" : "centang", 14)}<span>${esc(u(S.ui.s["kasus." + k.jenis] ? "kasus." + k.jenis : gagal ? "kasus.gagal" : "kasus.berhasil"))}</span></span>`;
  const pilNegara = `<span class="jm-pil jm-tp-pil-i">${bendera(iso, 16) || ikon("globe", 14)}<span>${esc(u(lokal ? "kasus.lokal" : "kasus.luar"))}</span></span>`;
  return bantu(k, { buruk: gagal, sampul, profil, angka, pilJenis, pilNegara, lok });
}
export { saringGlosarium, hitungKalk };

export function pasangTampil() {
  if (pasangTampil.ok) return; pasangTampil.ok = true;
  let tm = 0;
  document.addEventListener("input", (e) => {
    const c = e.target.closest?.("[data-gl-cari]"), kk = e.target.closest?.("[data-kalk]");
    if (c) { clearTimeout(tm); tm = setTimeout(() => saringGlosarium(c.closest("[data-gl]")), 120); }
    if (kk && e.target.matches("[data-kalk-kwp]")) hitungKalk(kk);
  });
  document.addEventListener("change", (e) => { const kk = e.target.closest?.("[data-kalk]"); if (kk) hitungKalk(kk); });
  document.addEventListener("click", (e) => {
    const b = e.target.closest?.("[data-gl-h]"); if (!b || b.disabled) return;
    const w = b.closest("[data-gl]");
    w.querySelectorAll("[data-gl-h]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    saringGlosarium(w);
  });
}
export function awalTampil(akar = document) {
  akar.querySelectorAll("[data-gl]").forEach(saringGlosarium);
  akar.querySelectorAll("[data-kalk]").forEach(hitungKalk);
}
