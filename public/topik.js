/* /topik (hub) dan /topik?id=<id> (laporan topik). Satu cetakan untuk semua topik; skema data: docs/perencanaan/TOPIK-SKEMA.md, kerangka bab: TOPIK-MENDALAM.md.
   Data: data/topik/indeks.json (hub), dasar-<id>.json (irisan otomatis), <id>.json (naskah terkurasi, opsional), luar_karbon.json (benchmark).
   INP: kontrol (tabel, daftar periksa, daftar isi) mengubah chrome seketika; isi berat disusun lewat nanti(). Bab tanpa data bersumber tidak dirender. */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, bahasa } from "/i18n.js";
import { nanti, hantuHtml } from "/inti/umum.js";
import { khSisi } from "/inti/kh.js";
import { kartuHtml, tampilGalat, saatBahasa } from "/analisis.js";
import { ikonTek } from "/inti/ikon_tek.js";
import { tombolIkuti, pasangIkuti } from "/inti/ikuti.js";
import { S, L, u, num, tok, esc, ikon, tanggal, muat, eksibit, sumberHtml, pilu, pasangTabel, kosong } from "/topik_umum.js";
import * as B from "/topik_bab.js";
import * as KB from "/topik_karbon.js";

/* tombol Ikuti topik menunggu jenis "topik" di src/hak.js (JENIS_IKUTI) dan CHECK migrasi ikuti; nyalakan setelah backend siap */
const IKUTI_TOPIK = true;
const $ = (id) => document.getElementById(id);
const berkas = (id) => id.replace(/-/g, "_");
const KONTEKS = {};

/* ---------- hub ---------- */
function hubHtml(ind) {
  const n = ind.topik;
  const kartu = n.map((x) => {
    const nama = L(S.ui.topik[x.id].nama), ket = L(S.ui.topik[x.id].ket);
    const angka = (x.angka || []).slice(0, 3).map((a) => `<li><b>${esc(a.nilai == null ? "-" : num(a.nilai, a.d || 0))}${a.satuan ? `<small>${esc(L(a.satuan))}</small>` : ""}</b><span>${esc(a.label ? L(a.label) : u(a.k))}</span></li>`).join("");
    const gambar = x.foto ? `<img src="${esc(x.foto)}" alt="" width="640" height="360" loading="lazy" decoding="async" data-galat="hapus">` : "";
    return `<a class="jm-tp-kt" href="/topik?id=${encodeURIComponent(x.id)}" data-st="${esc(x.status)}"><div class="jm-tp-kt-foto jm-batik">${gambar}<span class="jm-tp-kt-ik">${ikonTek(x.ikon)}</span>${pilu("st." + x.status, x.status === "lengkap" ? "ok" : x.status === "terisi" ? "info" : "warn").replace("jm-pil ", "jm-pil jm-tp-kt-st ")}</div>
      <div class="jm-tp-kt-isi"><h2>${esc(nama)}</h2><p>${esc(ket)}</p>${angka ? `<ul class="jm-tp-kt-angka">${angka}</ul>` : `<p class="jm-bantu">${esc(u("sedang"))}</p>`}<small>${esc(x.bab ? u("kartu.bab") + ": " + num(x.bab) : u("kartu.sumber"))}</small></div></a>`;
  }).join("");
  return `<div class="jm-tp-kisi-hub">${kartu}</div>`;
}
async function hub() {
  const ind = await muat("/data/topik/indeks.json");
  if (!ind) throw new Error("data");
  const lengkap = ind.topik.filter((x) => x.status === "lengkap").length, disusun = ind.topik.filter((x) => x.status === "disusun").length;
  $("judul").textContent = u("hub.judul"); $("jawab").textContent = u("hub.lead");
  khSisi("#kh", { ubin: [{ ikon: "topik", nilai: num(ind.topik.length), label: u("hub.u.topik") }, { ikon: "centang", nilai: num(lengkap), label: u("hub.u.lengkap") }, { ikon: "peringatan", nilai: num(disusun), label: u("hub.u.disusun") }] });
  document.title = u("hub.eyebrow") + " | " + t("jm.merek");
  $("isi").innerHTML = hubHtml(ind);
}

/* ---------- laporan topik ---------- */
function kunciGenerik(ctx) {
  const h = ctx.dasar.hitung, a = [];
  const tambah = (k, v, ik) => { if (v > 0) a.push({ ikon: ik, label: u("kartu.angka." + k), nilai: num(v), satuan: "", sub: "", src: ["dasar"] }); };
  tambah("proyek", h.proyek, "proyek"); tambah("mw", h.mw, "tek-listrik"); tambah("regulasi", h.regulasi, "regulasi"); tambah("organisasi", h.organisasi, "gedung"); tambah("pakar", h.pakar, "orang"); tambah("riset", h.riset, "buku"); tambah("berita", h.berita, "berita"); tambah("inovasi", h.inovasi, "tek-surya");
  return a.slice(0, 5);
}
function kunciNaskah(ctx) {
  return (ctx.naskah.kunci || []).map((x) => ({ ikon: "analisis", label: L(x.label), nilai: typeof x.nilai === "number" ? num(x.nilai, x.d || 0) : tok(x.nilai), satuan: x.satuan ? L(x.satuan) : "", sub: "", src: x.sumber ? [x.sumber] : [], est: !!x.est }));
}
function bab1(ctx) {
  const adaNaskah = !!ctx.naskah, k = adaNaskah ? (ctx.id === "karbon" ? KB.kunci(ctx) : kunciNaskah(ctx)) : kunciGenerik(ctx);
  if (!k.length) return null;
  const kartu = k.map((x) => kartuHtml({ judul: x.label, nilai: x.nilai, satuan: x.satuan, penyebut: x.sub, sumber: sumberHtml(x.src || []), turunan: !!x.est, ikon: x.ikon })).join("");
  let h = `<div class="jm-an-kartu-baris jm-tp-kunci">${kartu}</div>`;
  if (adaNaskah && ctx.naskah.penting?.length) h += `<h3 class="jm-tp-h3">${esc(u("ringkas.penting"))}</h3><ol class="jm-tp-langkah">${ctx.naskah.penting.map((p) => `<li>${esc(tok(p))}</li>`).join("")}</ol>`;
  if (adaNaskah && ctx.naskah.posisi) h += `<p class="jm-tp-posisi">${ikon("kompas", 18)}<span>${esc(tok(ctx.naskah.posisi))}</span></p>`;
  if (!adaNaskah) h += `<p class="jm-bantu">${esc(u("ringkas.dasar", { tanggal: tanggal(ctx.dasar.dibangun_pada) }))}</p>`;
  return { html: h, sumber: adaNaskah ? [] : ["dasar"], diperbarui: adaNaskah ? ctx.naskah.diperbarui : ctx.dasar.dibangun_pada, ubin: k.slice(0, 3) };
}

function hasil(ctx, n) {
  const nb = ctx.naskah?.bab?.[n], T = nb && B.TIPE[nb.tipe], karbon = ctx.id === "karbon", d = ctx.dasar;
  const dasar = (r) => (r ? { ...r, sumber: ["dasar"] } : null);
  if (n === 1) return bab1(ctx);
  if (karbon && KB.KHUSUS[n]) { const r = KB.KHUSUS[n](ctx); return r; }
  if (n === 12 && karbon) { const g = B.regulasi(d.regulasi), tb = nb ? B.TIPE.tabel(nb, "reg-tercatat") : null; return g ? { html: g.html + (tb ? `<h3 class="jm-tp-h3">${esc(L(nb.judul))}</h3>` + tb.html : ""), csv: true, sumber: ["dasar", ...(nb ? ["celah"] : [])] } : null; }
  if (n === 13 && nb?.tipe === "linimasa") return B.TIPE.linimasa(nb, "", ctx);
  if (n === 39 || n === 40) return nb ? B.kasus(nb, ctx) : null;
  if (n === 41) return nb ? B.pola(nb, ctx) : null;
  if (n === 42) return nb ? B.periksa(nb) : null;
  if (nb && T) { const r = T(nb, "bab-" + n + "-" + ctx.id, ctx); return r; }
  if (n === 9) return d.pemain.length ? dasar({ html: B.pemain(d.pemain, { tambahan: karbon ? pengembangKarbon(ctx) : "" }) }) : null;
  if (n === 10) return dasar(B.proyek(d.proyek));
  if (n === 12) return dasar(B.regulasi(d.regulasi));
  if (n === 18) return dasar(B.inovasi(d.inovasi));
  if (n === 33) return dasar(B.pakar(d));
  if (n === 34) return dasar(B.acara(d.acara));
  if (n === 35) return dasar(B.berita(d.berita));
  if (n === 36) return dasar(B.pustaka(d.pustaka));
  return null;
}
function pengembangKarbon(ctx) {
  const m = new Map();
  for (const p of ctx.d.kredit.daftar) if (p.pengembang) m.set(p.pengembang, (m.get(p.pengembang) || 0) + 1);
  const a = [...m].sort((x, y) => y[1] - x[1]).slice(0, 12);
  return `<h3 class="jm-tp-h3">${esc(u("pemain.pengembang"))}</h3><ul class="jm-tp-etiket">${a.map(([nm, c]) => `<li>${esc(nm)} <b>${esc(num(c))}</b></li>`).join("")}</ul>`;
}

function susun(ctx) {
  const out = [], urutan = Array.from({ length: 42 }, (_, i) => i + 1).filter((n) => n !== 37 && n !== 38);
  let diperbarui = ctx.naskah?.diperbarui || ctx.dasar.dibangun_pada, ubin = [];
  const csvBab = [];
  for (const n of urutan) {
    let r = null;
    try { r = hasil(ctx, n); } catch (e) { console.error("bab", n, e); r = null; }
    if (!r || !r.html) continue;
    if (n === 1) { ubin = r.ubin; diperbarui = r.diperbarui; }
    out.push({ n, html: eksibit(n, r.html, { csv: !!r.csv, sumber: sumberHtml(r.sumber || [], r.tambah || []), judul: ctx.naskah?.bab?.[n]?.judul ? L(ctx.naskah.bab[n].judul) : "" }) });
    if (r.csv) csvBab.push(n);
    if (r.celah) ctx.celah.push(...r.celah);
  }
  if (csvBab.length) {
    const li = csvBab.map((n) => `<li><a href="#bab-${n}">${esc(L(S.ui.bab[n].j))}</a></li>`).join("");
    out.push({ n: 37, html: eksibit(37, `<p class="jm-tp-p">${esc(u("unduh.ket"))}</p><ul class="jm-tp-etiket jm-tp-etiket-tautan">${li}</ul><p class="jm-bantu">${esc(u("unduh.kutip", { topik: L(S.ui.topik[ctx.id].nama), tanggal: tanggal(new Date().toISOString().slice(0, 10)) }))}</p>`) });
  }
  const ns = ctx.naskah?.celah || [];
  out.push({ n: 38, html: eksibit(38, B.sumberMetode([...ns, ...ctx.celah]).html) });
  out.sort((a, b) => a.n - b.n);
  return { out, diperbarui, ubin };
}

function tocHtml(out, id) {
  const ada = new Set(out.map((x) => x.n));
  const grup = Object.keys(S.ui.grup).map((g) => {
    const ns = Object.keys(S.ui.bab).filter((n) => S.ui.bab[n].g === g && ada.has(+n));
    return ns.length ? `<li><b>${esc(g)}. ${esc(L(S.ui.grup[g]))}</b><ol>${ns.map((n) => `<li><a href="#bab-${n}" data-toc="${n}">${esc(L(S.ui.bab[n].j))}</a></li>`).join("")}</ol></li>` : "";
  }).join("");
  const ikuti = IKUTI_TOPIK ? `<div class="jm-tp-toc-aksi">${tombolIkuti({ jenis: "topik", id, nama: L(S.ui.topik[id].nama) })}</div>` : "";
  return `<aside class="jm-tp-toc" aria-label="${esc(u("toc"))}"><details${innerWidth >= 900 ? " open" : ""}><summary>${ikon("daftar", 18)}<span>${esc(u("toc"))}</span></summary><nav><ul>${grup}</ul>${ikuti}<a class="jm-tp-semua" href="/topik">${ikon("topik", 16)}<span>${esc(u("toc.hub"))}</span></a></nav></details></aside>`;
}

async function halaman(id) {
  if (!S.ui.topik[id]) { $("judul").textContent = u("kosong.judul"); $("jawab").textContent = u("kosong.isi"); khSisi("#kh", { fakta: [{ ikon: "topik", label: u("toc.hub"), nilai: u("toc.hub"), href: "/topik" }] }); $("isi").innerHTML = ""; return; }
  const [dasar, naskah, luar] = await Promise.all([muat(`/data/topik/dasar-${id}.json`), muat(`/data/topik/${berkas(id)}.json`), id === "karbon" ? muat("/data/topik/luar_karbon.json") : null]);
  if (!dasar) throw new Error("data");
  S.id = id; S.dipakai = new Set(); S.tabel.clear(); S.sumber = { ...(naskah?.sumber || {}), dasar: { judul: u("src.dasar"), penerbit: "METI", tanggal: dasar.dibangun_pada, bukti: "editorial" } };
  const ctx = { id, dasar, naskah, luar, celah: [] };
  Object.assign(KONTEKS, ctx);
  if (id === "karbon") { if (!naskah || !luar) throw new Error("data"); KB.siap(ctx); ctx.selesaikan = KB.selesaikan(ctx); }
  const { out, diperbarui, ubin } = susun(ctx);
  const nama = L(S.ui.topik[id].nama);
  $("judul").textContent = nama;
  $("jawab").textContent = naskah?.lead ? tok(naskah.lead) : L(S.ui.topik[id].ket);
  khSisi("#kh", { ubin: ubin?.length ? ubin.map((x) => ({ ikon: x.ikon, nilai: x.nilai, satuan: x.satuan.length > 3 ? "" : x.satuan, label: x.satuan.length > 3 ? `${x.label} (${x.satuan})` : x.label })) : [{ ikon: "info", nilai: num(out.length), label: u("kartu.bab") }], aksi: `<span class="jm-tp-tgl">${esc(u("diperbarui", { tanggal: tanggal(diperbarui) }))}</span>` });
  document.title = `${nama} | ${u("ey")} | ${t("jm.merek")}`;
  $("isi").innerHTML = `<div class="jm-tp">${tocHtml(out, id)}<div class="jm-tp-isi">${out.map((x) => x.html).join("")}</div></div>`;
  pasangScroll(out);
  B.pasangPeriksa();
  if (IKUTI_TOPIK) pasangIkuti($("isi"));
  if (location.hash) $(location.hash.slice(1))?.scrollIntoView();
}
function pasangScroll(out) {
  if (!("IntersectionObserver" in window)) return;
  const nav = document.querySelector(".jm-tp-toc"), tautan = new Map([...nav.querySelectorAll("[data-toc]")].map((a) => [a.dataset.toc, a]));
  const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { tautan.forEach((a) => a.removeAttribute("aria-current")); tautan.get(e.target.id.slice(4))?.setAttribute("aria-current", "true"); } }, { rootMargin: "-80px 0px -70% 0px" });
  out.forEach((x) => { const el = $("bab-" + x.n); if (el) io.observe(el); });
}

async function render(saya) {
  const id = new URLSearchParams(location.search).get("id");
  $("isi").innerHTML = hantuHtml(6);
  try { await (id ? halaman(id) : hub()); } catch (e) { console.error(e); tampilGalat($("isi"), () => render(saya)); }
}

const saya = await mulaiHalaman();
S.ui = await muat("/data/topik/ui.json");
if (!S.ui) tampilGalat($("isi"), () => location.reload());
else {
  pasangTabel();
  await render(saya);
  saatBahasa(() => nanti(() => render(saya)));
}
