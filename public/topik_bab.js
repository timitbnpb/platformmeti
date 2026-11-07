/* /topik: penyaji bab generik. Dua jalur: (1) tipe naskah (teks, faq, glosarium, rumus, langkah, tabel, grafik, linimasa, kasus, pola, periksa),
   (2) bab berbasis data dasar-<id>.json (pemain, proyek, regulasi, inovasi, pakar, acara, berita, pustaka). Skema: docs/perencanaan/TOPIK-SKEMA.md. */
import { S, L, u, num, pilu, tok, aman, tautan, est, esc, ikon, tanggal, pil, bahasa, daftarTabel, subjudul, sumberHtml, teksHtml, catatan, kosong } from "/topik_umum.js";
import { logoOrg } from "/inti/logo_org.js";
import { kolom, batang } from "/grafik.js";
import { garisTip } from "/topik_umum.js";
import { lihatSemuaHtml } from "/inti/komponen.js";

const HARI_INI = new Date().toISOString().slice(0, 10);
const KODE_REG = { uu: "UU", perppu: "Perppu", pp: "PP", perpres: "Perpres", keppres: "Keppres", inpres: "Inpres", permen: "Permen", perda: "Perda" };
const sel = (v) => (v && typeof v === "object" && ("id" in v || "en" in v) ? esc(tok(v)) : v == null || v === "" ? "-" : esc(String(v)));
const hit = (r) => ({ html: r, csv: false });

/* ---------- tipe naskah ---------- */
export const TIPE = {
  teks: (b) => ({ html: (b.paragraf || []).map((p) => teksHtml(p)).join("") + catatan(b.catatan), sumber: b.sumber }),
  faq: (b) => ({ html: `<div class="jm-tp-faq">${(b.butir || []).map((x) => `<details><summary>${esc(tok(x.t))}</summary><p class="jm-tp-p">${esc(tok(x.j))}</p></details>`).join("")}</div>`, sumber: b.sumber }),
  glosarium: (b) => ({ html: `<dl class="jm-tp-glos">${(b.butir || []).map((x) => `<div><dt>${esc(L(x.istilah))}</dt><dd>${esc(tok(x.arti))}</dd></div>`).join("")}</dl>`, sumber: b.sumber }),
  rumus: (b) => ({ html: `<div class="jm-tp-rumus">${(b.rumus || []).map((r) => `<p>${esc(tok(r))}</p>`).join("")}</div>${(b.contoh || []).length ? subjudul(u("contoh")) : ""}<ol class="jm-tp-langkah jm-tp-contoh">${(b.contoh || []).map((c) => `<li>${esc(tok(c))}</li>`).join("")}</ol>`, sumber: b.sumber }),
  langkah: (b) => ({ html: `<ol class="jm-tp-langkah">${(b.butir || []).map((x) => `<li><b>${esc(tok(x.judul))}</b><span>${esc(tok(x.isi))}</span>${x.pelaku ? `<small>${esc(tok(x.pelaku))}</small>` : ""}</li>`).join("")}</ol>${catatan(b.catatan)}`, sumber: b.sumber }),
  tabel: (b, id) => {
    const kols = (b.kolom || []).map((c) => ({ k: c.k, l: L(c.l), num: !!c.num, f: (r) => (c.url && r[c.url] ? tautan(r[c.url], String(L(r[c.k]))) : c.num && typeof r[c.k] === "number" ? num(r[c.k], c.d || 0) : sel(r[c.k])), v: (r) => (typeof r[c.k] === "number" ? r[c.k] : L(r[c.k]) || null) }));
    return { html: daftarTabel(id, kols, b.baris || [], b.per || 8) + catatan(b.catatan), csv: true, sumber: b.sumber };
  },
  grafik: (b) => {
    const seri = b.seri || [], label = L(b.label);
    let g = "";
    if (b.jenis === "garis") { const lab = (seri[0]?.titik || []).map((p) => String(p[0])); g = garisTip(lab, seri.map((s) => ({ nama: L(s.nama), sorot: !!s.sorot, v: s.titik.map((p) => p[1]) })), { d: b.d || 0, satuan: b.satuan ? " " + b.satuan : "", label }); }
    else if (b.jenis === "batang") g = batang((seri[0]?.titik || []).map((p, i) => ({ label: String(p[0]), v: p[1], teks: num(p[1], b.d || 0) + (b.satuan ? " " + b.satuan : ""), sorot: i === 0 })), { label });
    else g = kolom((seri[0]?.titik || []).map((p) => ({ label: String(p[0]), v: p[1], tip: `${p[0]}: ${num(p[1], b.d || 0)}${b.satuan ? " " + b.satuan : ""}` })), { d: b.d || 0, label });
    return { html: `<p class="jm-bantu">${esc(label)}${b.satuan ? ", " + esc(b.satuan) : ""}</p>${g}${catatan(b.catatan)}`, sumber: b.sumber };
  },
  linimasa: (b, id, ctx) => ({ html: linimasa(b.butir || [], ctx), sumber: b.sumber }),
};

export function linimasa(butir, ctx) {
  const reg = new Map((ctx.dasar.regulasi || []).map((r) => [r.id, r]));
  const li = [...butir].sort((a, z) => a.tanggal.localeCompare(z.tanggal)).map((x) => {
    const r = x.reg ? reg.get(x.reg) : null, url = aman(x.url) || (r && aman(r.url)) || null;
    const depan = x.tanggal > HARI_INI, st = r?.status;
    return `<li class="${depan ? "jm-tp-depan" : ""}"><time datetime="${esc(x.tanggal)}">${esc(tanggal(x.tanggal))}</time><span>${url ? tautan(url, tok(x.judul)) : esc(tok(x.judul))}</span>${depan ? pilu("tp.jadwal") : ""}${st === "dicabut" ? `<em class="jm-pil jm-pil-bad">${esc(u("reg." + st))}</em>` : ""}</li>`;
  }).join("");
  return `<ol class="jm-tp-linimasa">${li}</ol>`;
}

/* ---------- bab berbasis data dasar ---------- */
export function pemain(list, { tambahan = "" } = {}) {
  if (!list.length) return null;
  const kartu = list.slice(0, 24).map((o) => {
    const logo = logoOrg(o.id, o.nama, o.logo)[0];
    return `<a class="jm-tp-pemain" href="/o/${esc(o.id)}"><span class="jm-tp-logo">${logo ? `<img src="${esc(logo)}" alt="" width="36" height="36" loading="lazy" data-galat="hapus">` : ""}${ikon("gedung", 20)}</span><b>${esc(o.nama)}</b><small>${esc(o.kategori || "")}${o.proyek ? ` | ${esc(num(o.proyek))} ${esc(u("kartu.angka.proyek"))}` : ""}</small></a>`;
  }).join("");
  return `<div class="jm-tp-pemain-baris">${kartu}</div>${tambahan}`;
}

export function proyek(b) {
  if (!b) return null;
  const kols = [
    { k: "nama", l: u("k.nama"), f: (r) => `<a href="/p/${esc(r.id)}">${esc(r.nama)}</a>`, v: (r) => r.nama },
    { k: "tek", l: u("k.tek"), f: (r) => esc(r.teknologi || "-"), v: (r) => r.teknologi },
    { k: "prov", l: u("k.prov"), f: (r) => esc(r.provinsi || "-"), v: (r) => r.provinsi },
    { k: "mw", l: u("k.mw"), num: true, f: (r) => num(r.mw, 0), v: (r) => r.mw },
    { k: "st", l: u("k.status"), f: (r) => esc(r.status || "-"), v: (r) => r.status },
  ];
  const ringkas = `<p class="jm-tp-p">${esc(u("proyek.ringkas", { n: num(b.jumlah), mw: num(b.mw), op: num(b.beroperasi) }))}${est()}</p>`;
  return { html: ringkas + daftarTabel("proyek-" + S.id, kols, b.daftar, 8), csv: true };
}

const namaReg = (r) => `${KODE_REG[r.jenis] || r.jenis} ${r.nomor}/${r.tahun}`;
export function regulasi(list) {
  if (!list?.length) return null;
  const kols = [
    { k: "kode", l: u("k.nama"), f: (r) => `<a href="/regulasi?id=${encodeURIComponent(r.id)}"><b>${esc(namaReg(r))}</b></a><br><small>${esc(r.judul)}</small>`, v: (r) => namaReg(r) },
    { k: "st", l: u("k.status"), f: (r) => `<span class="jm-pil ${r.status === "berlaku" ? "jm-pil-ok" : r.status === "dicabut" ? "jm-pil-bad" : "jm-pil-warn"}">${esc(u("reg." + r.status) === "reg." + r.status ? r.status : u("reg." + r.status))}</span>`, v: (r) => r.status },
    { k: "tgl", l: u("k.tanggal"), f: (r) => esc(tanggal(r.tanggal)), v: (r) => r.tanggal },
    { k: "unduh", l: u("k.sumber"), f: (r) => tautan(r.pdf || r.url, u("unduh")), v: () => null },
  ];
  return { html: daftarTabel("reg-" + S.id, kols, list, 8), csv: true };
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
  const gagal = k.jenis !== "berhasil";
  const foto = k.foto?.src ? `<figure class="jm-tp-kfoto"><img src="${esc(k.foto.src)}" alt="${esc(L(k.foto.alt))}" loading="lazy" decoding="async" data-galat="hapus"><figcaption>${esc(k.foto.kredit || "")}</figcaption></figure>` : `<div class="jm-tp-kfoto jm-tp-kfoto-ikon" aria-hidden="true">${ikon(k.ikon || "bintang", 40)}</div>`;
  const profil = (k.profil || []).length ? `<dl class="jm-tp-profil">${k.profil.map((p) => `<div><dt>${esc(tok(p.label))}</dt><dd>${esc(nilaiProfil(p))}</dd></div>`).join("")}</dl>` : "";
  const angka = (k.angka || []).length ? `<ul class="jm-tp-angka">${k.angka.map((a) => `<li><b>${esc(typeof a.nilai === "number" ? num(a.nilai, a.d || 0) : tok(a.nilai))}${a.satuan ? `<small>${esc(L(a.satuan))}</small>` : ""}</b><span>${esc(tok(a.label))}${a.est ? est() : ""}</span></li>`).join("")}</ul>` : "";
  const kron = (k.kronologi || []).length ? `<ol class="jm-tp-linimasa">${k.kronologi.map((x) => `<li><time datetime="${esc(x.tanggal)}">${esc(tanggal(x.tanggal))}</time><span>${esc(tok(x.teks))}</span></li>`).join("")}</ol>` : "";
  const hak = gagal && k.hak_jawab ? `<p class="jm-tp-hak">${ikon("surel", 16)}<span>${esc(u("hak.ket"))} <a href="mailto:${EMAIL}?subject=${encodeURIComponent(u("bagikan.hak") + ": " + k.nama)}">${esc(u("hak.tautan"))}</a></span></p>` : "";
  return `<article class="jm-tp-kasus ${gagal ? "jm-tp-kasus-g" : ""}" id="kasus-${esc(k.id)}">${foto}<div class="jm-tp-kbody"><header><span class="jm-pil ${gagal ? "jm-pil-warn" : "jm-pil-ok"}">${esc(u(S.ui.s["kasus." + k.jenis] ? "kasus." + k.jenis : gagal ? "kasus.gagal" : "kasus.berhasil"))}</span><span class="jm-pil">${esc(u(k.negara === "ID" ? "kasus.lokal" : "kasus.luar"))}</span><h3>${esc(k.nama)}</h3>${k.lokasi ? `<p class="jm-bantu">${esc(tok(k.lokasi))}</p>` : ""}</header>
    ${profil}${bag("kasus.angka", angka)}${bag("kasus.tindakan", daftarUl(k.tindakan))}${bag(gagal ? "kasus.sebab_g" : "kasus.sebab_b", daftarUl(k.sebab))}${bag("kasus.kronologi", kron)}${bag("kasus.terdampak", k.terdampak ? `<p>${esc(tok(k.terdampak))}</p>` : "")}${bag("kasus.seharusnya", k.seharusnya ? `<p>${esc(tok(k.seharusnya))}</p>` : "")}${bag("kasus.tanda", daftarUl(k.tanda_bahaya))}${bag("kasus.pelajaran", daftarUl(k.pelajaran))}
    ${k.dibaca ? `<p class="jm-bantu">${esc(u("kasus.dibaca"))}</p>` : ""}<footer>${sumberHtml(k.sumber || [], k.sumber_tambahan || [])}${hak}</footer></div></article>`;
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
