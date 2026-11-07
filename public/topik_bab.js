/* /topik: penyaji bab generik. Dua jalur: (1) tipe naskah (teks, faq, glosarium, rumus, langkah, tabel, grafik, linimasa, kasus, pola, periksa),
   (2) bab berbasis data dasar-<id>.json (pemain, proyek, regulasi, inovasi, pakar, acara, berita, pustaka). Skema: docs/perencanaan/TOPIK-SKEMA.md. */
import { S, L, u, num, pilu, tok, aman, tautan, est, esc, ikon, tanggal, pil, bahasa, daftarTabel, subjudul, sumberHtml, teksHtml, catatan, kosong } from "/topik_umum.js";
import { lihatSemuaHtml } from "/inti/komponen.js";
import * as W from "/topik_tampil.js";
import * as D from "/topik_data.js";
import { pilKat, logoKotak } from "/topik_wujud.js";

const HARI_INI = new Date().toISOString().slice(0, 10);
const KODE_REG = { uu: "UU", perppu: "Perppu", pp: "PP", perpres: "Perpres", keppres: "Keppres", inpres: "Inpres", permen: "Permen", perda: "Perda" };
const sel = (v) => (v && typeof v === "object" && ("id" in v || "en" in v) ? esc(tok(v)) : v == null || v === "" ? "-" : esc(String(v)));
const hit = (r) => ({ html: r, csv: false });

/* ---------- tipe naskah ---------- */
export const TIPE = {
  teks: (b, id, ctx) => W.teksSisi(b, id, ctx),
  faq: (b, id, ctx) => W.faq(b, id, ctx),
  glosarium: (b) => W.glosarium(b),
  rumus: (b, id, ctx) => W.rumus(b, id, ctx),
  langkah: (b, id, ctx) => (ctx?.n === 6 && (b.butir || []).some((x) => x.pelaku) ? W.rantai(b, id, ctx) : ({ html: `<ol class="jm-tp-langkah">${(b.butir || []).map((x) => `<li><b>${esc(tok(x.judul))}</b><span>${esc(tok(x.isi))}</span>${x.pelaku ? `<small>${esc(tok(x.pelaku))}</small>` : ""}</li>`).join("")}</ol>${catatan(b.catatan)}`, sumber: b.sumber })),
  tabel: (b, id, ctx) => { const r = D.tabelPintar(b, id, ctx); return { html: r.html + catatan(b.catatan), csv: true, sumber: b.sumber }; },
  grafik: (b, id, ctx) => {
    const label = L(b.label), sat = b.satuan ? L(b.satuan) : "";
    const g = b.jenis === "batang" ? D.batangNegara(b) : D.grafikSeri(b, id, ctx, { mode: b.jenis === "kolom" ? "kolom" : "garis" });
    return { html: `<p class="jm-bantu">${esc(label)}${sat ? ", " + esc(sat) : ""}</p>${g}${catatan(b.catatan)}`, sumber: b.sumber };
  },
  linimasa: (b, id, ctx) => ({ html: linimasa(b.butir || [], ctx), sumber: b.sumber }),
};

export const linimasa = (butir, ctx) => D.linimasaVertikal(butir, ctx);

/* ---------- bab berbasis data dasar ---------- */
export function pemain(list, { tambahan = "" } = {}) {
  if (!list.length) return null;
  const kartu = list.slice(0, 24).map((o) => `<a class="jm-tp-pemain" href="/o/${esc(o.id)}">${logoKotak(o.id, o.nama, o.logo)}<b>${esc(o.nama)}</b><small>${pilKat(o.kategori)}${o.proyek ? ` <span>${esc(num(o.proyek))} ${esc(u("kartu.angka.proyek"))}</span>` : ""}</small></a>`).join("");
  return `<div class="jm-tp-pemain-baris">${kartu}</div>${tambahan}`;
}

export function proyek(b, ctx) {
  if (!b) return null;
  const tabel = { per: 8, kolom: [{ k: "nama", l: u("k.nama") }, { k: "tek", l: u("k.tek") }, { k: "prov", l: u("k.prov") }, { k: "mw", l: u("k.mw"), num: true }, { k: "status", l: u("k.status") }], baris: b.daftar.map((r) => ({ nama: r.nama, tek: r.teknologi, prov: r.provinsi, mw: r.mw, status: r.status })) };
  const ringkas = `<p class="jm-tp-p">${esc(u("proyek.ringkas", { n: num(b.jumlah), mw: num(b.mw), op: num(b.beroperasi) }))}${est()}</p>`;
  return { html: ringkas + D.ringkasStatus(b.daftar, "proyek-" + S.id) + D.tabelPintar(tabel, "proyek-" + S.id, ctx || { dasar: { proyek: b } }).html, csv: true };
}

export function regulasi(list) {
  if (!list?.length) return null;
  const tabel = { per: 8, kolom: [{ k: "dok", l: u("k.nama") }, { k: "judul", l: u("k.judul") }, { k: "tgl", l: u("k.tanggal") }, { k: "url", l: u("k.sumber"), url: "url" }], baris: list.map((r) => ({ dok: `${KODE_REG[r.jenis] || r.jenis} ${r.nomor}/${r.tahun}`, judul: r.judul, tgl: r.tanggal, url: r.pdf || r.url })) };
  return { html: D.tabelPintar(tabel, "reg-" + S.id, { dasar: { regulasi: list } }).html, csv: true };
}

export function inovasi(list) {
  if (!list?.length) return null;
  return { html: `<div class="jm-tp-kisi">${list.map((i) => `<article class="jm-tp-kartu"><h3>${esc(i.nama)}</h3><p class="jm-bantu">${esc([i.status, i.tahun].filter(Boolean).join(", "))}${i.pembuat?.length ? " | " + esc(i.pembuat.join(", ")) : ""}</p><p>${esc((i.ringkasan || "").slice(0, 220))}${(i.ringkasan || "").length > 220 ? "..." : ""}</p>${i.url ? `<p class="jm-bantu">${tautan(i.url, u("kasus.baca"))}</p>` : ""}</article>`).join("")}</div>${lihatSemuaHtml("/direktori?tampil=inovasi", u("lihat.inovasi"))}` };
}

export function pakar(blok) {
  const { pakar: p = [], studi: s = [], riset: r = [] } = blok;
  if (!p.length && !s.length && !r.length) return null;
  let h = "", csv = false;
  if (s.length) h += subjudul(u("pakar.studi")) + `<div class="jm-tp-pemain-baris">${s.map((x) => `<a class="jm-tp-pemain" href="/o/${esc(x.id)}"><span class="jm-tp-logo">${x.logo ? `<img src="${esc(x.logo)}" alt="" width="36" height="36" loading="lazy" data-galat="hapus">` : ""}${ikon("gedung", 20)}</span><b>${esc(x.singkatan || x.nama)}</b><small>${esc(x.nama)}${x.kota ? " | " + esc(x.kota) : ""}</small></a>`).join("")}</div>`;
  if (p.length) h += subjudul(u("pakar.pakar")) + daftarTabel("pakar-" + S.id, [
    { k: "nama", l: u("k.nama"), f: (x) => tautan(x.url, x.nama), v: (x) => x.nama }, { k: "kampus", l: u("k.kampus"), f: (x) => esc(x.kampus || "-"), v: (x) => x.kampus }, { k: "karya", l: u("k.karya"), num: true, f: (x) => num(x.karya), v: (x) => x.karya }], p, 6) + lihatSemuaHtml("/direktori?tampil=pakar", u("lihat.pakar"));
  if (r.length) { h += subjudul(u("pakar.riset")) + daftarTabel("riset-" + S.id, [
    { k: "judul", l: u("k.judul"), f: (x) => tautan(x.url, x.judul), v: (x) => x.judul }, { k: "jurnal", l: u("k.jurnal"), f: (x) => esc(x.jurnal || "-"), v: (x) => x.jurnal }, { k: "tahun", l: u("k.tahun"), num: true, f: (x) => esc(String(x.tahun ?? "-")), v: (x) => x.tahun }, { k: "sitasi", l: u("k.sitasi"), num: true, f: (x) => num(x.sitasi), v: (x) => x.sitasi }], r, 5); csv = true; }
  return { html: h, csv };
}

export function acara(list) {
  if (!list?.length) return null;
  return { html: `<ul class="jm-tp-daftar">${list.map((k) => { const href = k.slug ? "/event/" + k.slug : aman(k.url); const depan = k.tanggal > HARI_INI; return `<li><time datetime="${esc(k.tanggal)}">${esc(tanggal(k.tanggal))}</time><span>${href ? `<a href="${esc(href)}"${k.slug ? "" : ' target="_blank" rel="noopener noreferrer"'}>${esc(k.judul)}</a>` : esc(k.judul)}<small>${esc(k.mitra || "")}</small></span>${depan ? pilu("tp.jadwal") : ""}</li>`; }).join("")}</ul>${lihatSemuaHtml("/kalender", u("lihat.acara"))}` };
}

export function berita(list) {
  if (!list?.length) return null;
  return { html: `<ul class="jm-tp-daftar">${list.map((b) => `<li><time datetime="${esc(b.terbit)}">${esc(tanggal(b.terbit))}</time><span>${tautan(b.url, b.judul)}<small>${esc(b.media || "")}</small></span></li>`).join("")}</ul>${lihatSemuaHtml("/berita", u("lihat.berita"))}` };
}

export function pustaka(list) {
  if (!list?.length) return null;
  return { html: `<div class="jm-tp-kisi">${list.map((p) => `<article class="jm-tp-kartu"><h3><a href="/pustaka?id=${encodeURIComponent(p.id)}">${esc(p.judul)}</a></h3><p class="jm-bantu">${esc([p.penerbit, p.tanggal].filter(Boolean).join(", "))}</p><p>${esc(p.ringkasan)}${p.ringkasan.length >= 260 ? "..." : ""}</p></article>`).join("")}</div>${lihatSemuaHtml("/pustaka", u("lihat.pustaka"))}` };
}

/* ---------- bab K: kartu kasus ---------- */
const nilaiProfil = (p) => (typeof p.nilai === "number" ? num(p.nilai, p.d || 0) + (p.satuan ? " " + L(p.satuan) : "") : tok(p.nilai) + (p.satuan ? " " + L(p.satuan) : ""));
const daftarUl = (a) => (a?.length ? `<ul class="jm-tp-ul">${a.map((x) => `<li>${esc(tok(x))}</li>`).join("")}</ul>` : "");
const bag = (judul, isi) => (isi ? `<section><h4>${esc(u(judul))}</h4>${isi}</section>` : "");
const EMAIL = "meti.ires@gmail.com";

export function kartuKasus(k) {
  return W.kartuKasus(k, (k, p) => {
    const kron = (k.kronologi || []).length ? `<ol class="jm-tp-linimasa">${k.kronologi.map((x) => `<li><time datetime="${esc(x.tanggal)}">${esc(tanggal(x.tanggal))}</time><span>${esc(tok(x.teks))}</span></li>`).join("")}</ol>` : "";
    const hak = p.gagal && k.hak_jawab ? `<p class="jm-tp-hak">${ikon("surel", 16)}<span>${esc(u("hak.ket"))} <a href="mailto:${EMAIL}?subject=${encodeURIComponent(u("bagikan.hak") + ": " + k.nama)}">${esc(u("hak.tautan"))}</a></span></p>` : "";
    return `<article class="jm-tp-kasus ${p.gagal ? "jm-tp-kasus-g" : ""}" id="kasus-${esc(k.id)}">${p.sampul}<div class="jm-tp-kbody"><header><span class="jm-tp-pils">${p.pilJenis}${p.pilNegara}</span><h3>${esc(k.nama)}</h3></header>
    ${p.profil}${bag("kasus.angka", p.angka)}${bag("kasus.tindakan", daftarUl(k.tindakan))}${bag(p.gagal ? "kasus.sebab_g" : "kasus.sebab_b", daftarUl(k.sebab))}${bag("kasus.kronologi", kron)}${bag("kasus.terdampak", k.terdampak ? `<p>${esc(tok(k.terdampak))}</p>` : "")}${bag("kasus.seharusnya", k.seharusnya ? `<p>${esc(tok(k.seharusnya))}</p>` : "")}${bag("kasus.tanda", daftarUl(k.tanda_bahaya))}${bag("kasus.pelajaran", daftarUl(k.pelajaran))}
    ${k.dibaca ? `<p class="jm-bantu">${esc(u("kasus.dibaca"))}</p>` : ""}<footer>${sumberHtml(k.sumber || [], k.sumber_tambahan || [])}${hak}</footer></div></article>`;
  });
}
export const kasus = (b, ctx) => ({ html: `<div class="jm-tp-kasus-baris">${(b.butir || []).map((x) => kartuKasus(ctx.selesaikan ? ctx.selesaikan(x) : x)).join("")}</div>`, sumber: b.sumber });

export function tabelPola(faktor, kasusList, id, pilih) {
  const rows = kasusList.filter(pilih);
  if (!faktor?.length || !rows.length) return "";
  const sel = (r, k) => { const v = r.faktor?.[k]; return v === true ? `<span class="jm-tp-ya">${ikon("centang", 18)}<span class="sr">${esc(u("pola.ya"))}</span></span>` : v === false ? `<span class="jm-tp-tdk">${ikon("silang", 18)}<span class="sr">${esc(u("pola.tidak"))}</span></span>` : `<span class="sr">${esc(u("pola.nol"))}</span>`; };
  const kols = [{ k: "kasus", l: u("pola.kasus"), f: (r) => `<a href="#kasus-${esc(r.id)}"><b>${esc(r.nama)}</b></a><br><small>${esc(u(S.ui.s["kasus." + r.jenis] ? "kasus." + r.jenis : r.jenis !== "berhasil" ? "kasus.gagal" : "kasus.berhasil"))}</small>`, v: (r) => r.nama }, ...faktor.map((f) => ({ k: f.k, l: L(f.l), num: false, f: (r) => sel(r, f.k), v: (r) => (r.faktor?.[f.k] === true ? 1 : r.faktor?.[f.k] === false ? 0 : null) }))];
  return daftarTabel(id, kols, rows, 12);
}
export function pola(b, ctx) {
  const semua = [...(ctx.naskah.bab["39"]?.butir || []), ...(ctx.naskah.bab["40"]?.butir || [])].map((x) => (ctx.selesaikan ? ctx.selesaikan(x) : x));
  let h = tabelPola(b.faktor, semua, "pola-p-" + S.id, (r) => r.faktor && r.faktorGrup !== "negara");
  if (b.faktor_negara) h += subjudul(u("pola.negara")) + tabelPola(b.faktor_negara, semua, "pola-n-" + S.id, (r) => r.faktorGrup === "negara");
  return { html: `<p class="jm-bantu">${esc(u("pola.ket"))}</p>${h}`, csv: true, sumber: b.sumber };
}

/* ---------- bab 42: daftar periksa interaktif ---------- */
const kunciCek = () => "jm-tp-cek-" + S.id;
const bacaCek = () => { try { return new Set(JSON.parse(localStorage.getItem(kunciCek()) || "[]")); } catch (e) { return new Set(); } };
const tulisCek = (s) => { try { localStorage.setItem(kunciCek(), JSON.stringify([...s])); } catch (e) { /* tanpa penyimpanan: tetap jalan */ } };
export function periksa(b) {
  const sudah = bacaCek(), peran = b.peran || [], tahap = b.tahap || [], butir = (b.butir || []).map((x, i) => ({ ...x, kunci: `${x.peran}|${x.tahap}|${i}` }));
  const tabs = `<div class="jm-tab" role="tablist" aria-label="${esc(u("cek.peran"))}">${peran.map((p, i) => `<button type="button" role="tab" data-cek-peran="${esc(p.k)}" aria-selected="${i === 0}">${esc(L(p.l))}</button>`).join("")}</div>`;
  const panel = peran.map((p, i) => {
    const sub = tahap.map((t) => ({ t, a: butir.filter((x) => x.peran === p.k && x.tahap === t.k) })).filter((g) => g.a.length);
    return `<div class="jm-tp-cek-panel" role="tabpanel" data-cek-panel="${esc(p.k)}"${i ? " hidden" : ""}>${sub.map((g) => `<section><h4>${esc(L(g.t.l))}</h4><ul class="jm-tp-cek">${g.a.map((x) => `<li><label><input type="checkbox" data-cek="${esc(x.kunci)}"${sudah.has(x.kunci) ? " checked" : ""}><span>${esc(tok(x.teks))}${x.dasar && S.sumber[x.dasar] ? ` <small>${esc(u("cek.dasar"))}: ${esc(S.sumber[x.dasar].judul)}</small>` : ""}</span></label></li>`).join("")}</ul></section>`).join("")}</div>`;
  }).join("");
  const html = `<div data-periksa="1">${tabs}<p class="jm-bantu jm-tp-cek-n" role="status" aria-live="polite"></p>${panel}<p class="jm-bantu">${esc(u("cek.simpan"))} <button type="button" class="jm-hapus" data-cek-reset>${ikon("silang", 16)}${esc(u("cek.reset"))}</button></p></div>`;
  S.periksa = { butir, peran, tahap };
  return { html, csv: true, sumber: b.sumber };
}
export function pasangPeriksa() {
  const hitung = (akar) => {
    const p = akar.querySelector(".jm-tp-cek-panel:not([hidden])"), n = p ? p.querySelectorAll("input:checked").length : 0, t = p ? p.querySelectorAll("input").length : 0;
    const el = akar.querySelector(".jm-tp-cek-n"); if (el) el.textContent = u("cek.selesai", { n: num(n), total: num(t) });
  };
  document.querySelectorAll("[data-periksa]").forEach(hitung);
  document.addEventListener("click", (e) => {
    const tb = e.target.closest("[data-cek-peran]"), rs = e.target.closest("[data-cek-reset]");
    const akar = (tb || rs)?.closest("[data-periksa]");
    if (!akar) return;
    if (tb) {
      akar.querySelectorAll("[data-cek-peran]").forEach((x) => x.setAttribute("aria-selected", String(x === tb)));
      akar.querySelectorAll("[data-cek-panel]").forEach((x) => { x.hidden = x.dataset.cekPanel !== tb.dataset.cekPeran; });
      hitung(akar);
    } else if (rs) { akar.querySelectorAll("input[data-cek]").forEach((c) => { c.checked = false; }); tulisCek(new Set()); hitung(akar); }
  });
  document.addEventListener("change", (e) => {
    const c = e.target.closest("input[data-cek]"); if (!c) return;
    const s = bacaCek(); c.checked ? s.add(c.dataset.cek) : s.delete(c.dataset.cek); tulisCek(s); hitung(c.closest("[data-periksa]"));
  });
  document.addEventListener("jm:csv", (e) => {
    if (!e.target.querySelector?.("[data-periksa]") || !S.periksa) return;
    const s = bacaCek(), P = Object.fromEntries(S.periksa.peran.map((x) => [x.k, L(x.l)])), T = Object.fromEntries(S.periksa.tahap.map((x) => [x.k, L(x.l)]));
    e.detail.baris = [[u("cek.peran"), u("cek.tahap"), u("cek.csv"), u("cek.kolom_selesai"), u("cek.dasar")], ...S.periksa.butir.map((x) => [P[x.peran], T[x.tahap], tok(x.teks), s.has(x.kunci) ? "1" : "0", S.sumber[x.dasar]?.judul || ""])];
  }, true);
}

/* ---------- bab 38: sumber dan metode ---------- */
export function sumberMetode(celah = []) {
  const ids = Object.keys(S.sumber);
  const li = ids.map((id) => { const s = S.sumber[id]; return `<li><b>${s.url ? tautan(s.url, s.judul) : esc(s.judul)}</b><small>${esc([s.penerbit, s.tahun, s.tanggal ? u("diperiksa", { tanggal: tanggal(s.tanggal) }) : "", s.lisensi].filter(Boolean).join(", "))}</small><span class="jm-pil">${esc(u("bukti." + (s.bukti || "editorial")))}</span></li>`; }).join("");
  const cl = celah.length ? subjudul(u("sumber.batas")) + `<ul class="jm-tp-ul">${celah.map((c) => `<li>${esc(tok(c))}</li>`).join("")}</ul>` : "";
  return { html: `<ul class="jm-tp-sumber">${li}</ul>${cl}<p class="jm-bantu">${esc(u("sumber.metode"))}</p>` };
}
