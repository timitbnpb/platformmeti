/* /o/<id>: blok profil gaya sensus (jejak remah, jawaban berangka, kutip, fakta bersumber, rantai pasok, kontak peran, skor yakin, sebanding).
   Dipanggil o.js. Semua angka dari data; kosong = "-" redup bertooltip alasan atau bagian disembunyikan. */
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { logoOrg } from "/inti/logo_org.js";
import { urlAman } from "/publik.js";
import { sebanding, domain, sektorDari, suratPeran, teleponKantor, NORM } from "/inti/org_sensus.js";

const dim = (kunci) => `<span class="oj-dim" title="${esc(t(kunci))}" tabindex="0">-</span>`;
const pilBukti = (b) => (b ? `<span class="oj-pil" title="${esc(t("oj.tip.bukti"))}" tabindex="0">${esc(t("oj.bukti." + b))}</span>` : "");
const ini = (n) => String(n || "?").replace(/^(PT|CV|Yayasan|Pemerintah|Kementerian)\.?\s+/i, "").split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("");
const namaSek = (id) => (id === "lain" ? t("so.sek.lain") : t("an.tek." + id));
const logo = (id, nm, l, k = "oj-lg") => { const u = logoOrg(id, nm, l)[0]; return `<span class="${k}">${u ? `<img src="${esc(u)}" alt="" loading="lazy" decoding="async" data-ini="${esc(ini(nm))}">` : esc(ini(nm))}</span>`; };
const badanHukum = (n) => (/\bTbk\b/i.test(n) ? "tbk" : /\(Persero\)/i.test(n) ? "persero" : (/^(PT|CV|Yayasan|Koperasi)\b/i.exec(n) || [])[1]?.toLowerCase() || "");
const domSumber = (o) => { const s = (o.sumber || []).find((x) => x.jenis === "situs-resmi") || (o.sumber || [])[0]; return s ? domain(s.url) : ""; };

/* satu baris fakta: label | nilai + satuan + pil + domain sumber + penjelasan */
function fakta(label, { nilai, satuan = "", pil = "", dom = "", ket = "", kosong = "oj.tip.kosong" }) {
  const isi = nilai === undefined || nilai === null || nilai === "" ? dim(kosong) : `<b>${nilai}</b>${satuan ? ` <span class="oj-sat">${esc(satuan)}</span>` : ""} ${pil}`;
  return `<div class="oj-fk"><dt>${esc(label)}</dt><dd>${isi}${dom && nilai ? `<small class="oj-dom">${esc(dom)}</small>` : ""}${ket && nilai ? `<small class="oj-ket">${esc(ket)}</small>` : ""}</dd></div>`;
}
const keuTerbaru = (o, metrik) => (o.keuangan || []).filter((k) => k.metrik === metrik && Number.isFinite(k.nilai)).sort((a, b) => b.tahun - a.tahun)[0];

function rantaiRingkas(o, S) {
  const simpul = new Map((S.rantai?.simpul || []).map((s) => [s.id, s]));
  const tt = (S.rantai?.tautan || []).filter((x) => x.pemasok_id === o.id || x.pelanggan_id === o.id);
  const baris = tt.map((x) => { const arahKeluar = x.pemasok_id === o.id, lain = simpul.get(arahKeluar ? x.pelanggan_id : x.pemasok_id);
    return { peran: arahKeluar ? "pelanggan" : "pemasok", nama: lain?.nama || "-", jenis: t("oj.rk." + x.kategori), angka: x.angka?.nilai ? `${angka(x.angka.nilai)} ${x.angka.satuan}` : "", dom: x.domain || domain(x.url_dokumen), bukti: x.label_bukti }; });
  for (const x of o.relasi || []) baris.push({ peran: x.arah === "pemasok" ? "pemasok" : "pelanggan", nama: x.nama, jenis: x.jenis || "", angka: "", dom: domain(x.sumber_url), bukti: x.label_bukti });
  if (!baris.length) return "";
  const hit = (p) => baris.filter((b) => b.peran === p).length;
  return `<section class="oj-kartu" aria-labelledby="ojRk"><h2 id="ojRk">${ikon("rantai", 20)}${esc(t("oj.rantai"))}</h2>
    <p class="oj-bantu">${esc(t("oj.rantai.ringkas", { a: angka(hit("pemasok")), b: angka(hit("pelanggan")) }))}</p>
    <ul class="oj-rk">${baris.slice(0, 6).map((b) => `<li><span class="oj-pil">${esc(t("oj.peran." + b.peran))}</span><b>${esc(b.nama)}</b><small>${esc([b.jenis, b.angka].filter(Boolean).join(", "))}${b.dom ? `<span class="oj-dom">${esc(b.dom)}</span>` : ""}</small></li>`).join("")}</ul>
    ${baris.length > 6 ? `<p class="oj-bantu">${esc(t("oj.lagi", { n: angka(baris.length - 6) }))}</p>` : ""}
    <a class="oj-tb" href="/rantai-pasok?id=${encodeURIComponent(o.id)}">${ikon("rantai", 18)}${esc(t("oj.a.rantai"))}</a></section>`;
}

export function ringkasHtml(o, S, { tombolIkuti, tombolKoreksi }) {
  const r = S.per.get(o.id), N = S.baris.length, tgl = tanggal(o.diperiksa || S.tgl), tglP = tanggal(S.tglProyek);
  const L = o.lokasi || {}, sek = sektorDari(o), url = urlAman(o.situs), bh = badanHukum(o.nama), dSitus = url ? domain(url) : "", dom = domSumber(o);
  const cocokNama = new Map(S.baris.map((x) => [NORM(x.nm), x]));
  const jawab = t("oj.jawab", { nama: o.nama, kat: (o.kategori?.label || "").toLowerCase(), sek: namaSek(sek).toLowerCase(), kota: L.kota ? t("oj.jawab.kota", { kota: L.kota }) : "", proyek: r.nProy ? t("oj.jawab.proyek", { n: angka(r.nProy), mw: angka(Math.round(r.mw)), v: angka(r.nProv) }) : t("oj.jawab.tanpa"), k: angka(r.rank), N: angka(N) });
  const kutip = `${o.nama}. ${t("oj.kutip.dari", { tgl })}. ${location.origin}/o/${o.id}`;
  const sk = r.yakin.skor, tingkat = sk >= 0.65 ? "ok" : sk >= 0.4 ? "warn" : "bad";

  const fk = [
    fakta(t("oj.f.kategori"), { nilai: esc(o.kategori?.label || ""), dom, ket: t("oj.k.kategori") }),
    fakta(t("oj.f.sektor"), { nilai: esc(namaSek(sek)), pil: `<span class="oj-pil" title="${esc(t("oj.tip.turunan"))}" tabindex="0">${esc(t("so.pil.est"))}</span>`, ket: t("oj.k.sektor") }),
    fakta(t("oj.f.tahun"), { nilai: o.tahun_berdiri ? esc(o.tahun_berdiri) : "", dom, kosong: "oj.tip.tahun" }),
    fakta(t("oj.f.saham"), { nilai: o.kode_saham ? esc(o.kode_saham) : "", dom, kosong: "oj.tip.saham" }),
    fakta(t("oj.f.proyek"), { nilai: r.nProy ? esc(angka(r.nProy)) : "", satuan: t("oj.sat.proyek"), pil: `<span class="oj-pil" title="${esc(t("so.tip.min"))}" tabindex="0">${esc(t("so.pil.min"))}</span>`, dom: t("oj.s.proyek", { tgl: tglP }), ket: t("oj.k.proyek"), kosong: "so.tip.tanpa_proyek" }),
    fakta(t("oj.f.mw"), { nilai: r.mw ? esc(angka(Math.round(r.mw))) : "", satuan: "MW", pil: `<span class="oj-pil" title="${esc(t("so.tip.min"))}" tabindex="0">${esc(t("so.pil.min"))}</span>`, dom: t("oj.s.proyek", { tgl: tglP }), ket: t("oj.k.mw"), kosong: "so.tip.tanpa_mw" }),
    fakta(t("oj.f.prov"), { nilai: r.nProv ? esc(angka(r.nProv)) : "", satuan: t("oj.sat.prov"), pil: `<span class="oj-pil" title="${esc(t("so.tip.min"))}" tabindex="0">${esc(t("so.pil.min"))}</span>`, dom: t("oj.s.proyek", { tgl: tglP }), kosong: "so.tip.tanpa_proyek" }),
    ...["pendapatan", "laba bersih"].map((m) => { const k = keuTerbaru(o, m); return fakta(t("oj.f.keu_" + (m === "pendapatan" ? "pendapatan" : "laba"), { tahun: k?.tahun ?? "" }).trim(), { nilai: k ? esc(angka(k.nilai)) : "", satuan: k?.satuan, pil: k ? pilBukti(k.tingkat_bukti) : "", dom: k ? domain(k.sumber_url) : "", ket: k ? t("oj.k.keu") : "", kosong: "oj.tip.keu" }); }),
    fakta(t("oj.f.aplsi"), { nilai: r.aplsi ? esc(t("oj.ya")) : "", dom: "aplsi.or.id", kosong: "oj.tip.aplsi" }),
    fakta(t("oj.f.meti"), { nilai: o.meti ? esc(t("oj.ya")) : "", kosong: "oj.tip.meti" }),
  ].join("");

  /* induk dan keanggotaan sebagai chip */
  const chips = []; const lihat = new Set();
  const chip = (nama, id) => { if (lihat.has(nama)) return; lihat.add(nama); const x = id ? S.per.get(id) : cocokNama.get(NORM(nama)); chips.push(x ? `<a class="oj-chip" href="/o/${esc(x.id)}">${logo(x.id, x.nm, x.o.logo, "oj-lg oj-lg-k")}${esc(x.nm)}</a>` : `<span class="oj-chip">${esc(nama)}</span>`); };
  if (o.induk) chip(o.induk);
  for (const k of o.keanggotaan || []) { const x = S.per.get(k.organisasi_id); if (x) chip(x.nm, x.id); }
  const kepemilikan = chips.length ? `<section class="oj-kartu" aria-labelledby="ojInduk"><h2 id="ojInduk">${ikon("direktori", 20)}${esc(t("oj.induk"))}</h2><p class="oj-chips">${chips.join("")}</p><small class="oj-dom">${esc(dom || "")}</small></section>` : "";

  const presisi = L.presisi ? t("oj.presisi." + L.presisi) : "";
  const kantor = L.kota || L.alamat || L.provinsi ? `<section class="oj-kartu" aria-labelledby="ojKantor"><h2 id="ojKantor">${ikon("lokasi", 20)}${esc(t("oj.kantor"))}</h2>
    <p class="oj-alamat">${esc([L.alamat, L.kota, L.provinsi].filter((v, i, a) => v && a.indexOf(v) === i).join(", "))}</p>${presisi ? `<p class="oj-bantu">${ikon("info", 14)}${esc(presisi)}</p>` : ""}</section>` : "";

  const emel = suratPeran(o), telp = teleponKantor(o);
  const kontak = `<section class="oj-kartu" aria-labelledby="ojKontak"><h2 id="ojKontak">${ikon("surel", 20)}${esc(t("oj.kontak"))}</h2>${emel.length || telp.length
    ? `<ul class="oj-kon">${emel.map((e) => `<li>${ikon("surel", 16)}<a href="mailto:${esc(e)}">${esc(e)}</a></li>`).join("")}${telp.map((x) => `<li>${ikon("kartu", 16)}<a href="tel:${esc(x.replace(/[^\d+]/g, ""))}">${esc(x)}</a></li>`).join("")}</ul><small class="oj-dom">${esc(t("oj.kontak.sumber", { dom: dSitus || dom || "-" }))}</small>`
    : `<p class="oj-bantu">${dim("oj.tip.kontak")} ${esc(t("oj.kontak.kosong"))}</p>`}<p class="oj-bantu">${esc(t("oj.kontak.aturan"))}</p></section>`;

  const arti = `<section class="oj-kartu" aria-labelledby="ojArti"><h2 id="ojArti">${ikon("info", 20)}${esc(t("oj.arti"))}</h2><dl class="oj-arti">${["proyek", "mw", "min", "est", "skor"].map((k) => `<div><dt>${esc(t("oj.arti." + k))}</dt><dd>${esc(t("oj.arti." + k + ".d"))}</dd></div>`).join("")}</dl></section>`;

  const yakin = `<section class="oj-kartu" aria-labelledby="ojYakin"><h2 id="ojYakin">${ikon("perisai", 20)}${esc(t("oj.yakin"))}</h2>
    <p class="oj-skor"><span class="oj-titik oj-${tingkat}" role="img" aria-label="${esc(t("oj.yakin.t." + tingkat))}"></span><b>${esc(angka(sk, { desimal: 2 }))}</b><span class="oj-bantu">${esc(t("oj.yakin.t." + tingkat))}</span><span class="oj-pil">${esc(t("oj.hipotesis"))}</span></p>
    <details open class="oj-cara"><summary>${esc(t("oj.cara"))}</summary><p>${esc(t("oj.cara.isi", { isi: angka(r.yakin.isi, { desimal: 2 }), dom: angka(r.yakin.domain), bukti: angka(r.yakin.bukti, { desimal: 2 }) }))}</p></details></section>`;

  const situs = `<section class="oj-kartu" aria-labelledby="ojSitus"><h2 id="ojSitus">${ikon("tautan", 20)}${esc(t("oj.situs"))}</h2>${url
    ? `<p><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(dSitus)}</a></p><p class="oj-bantu">${esc(t("oj.situs.tercatat", { tgl }))}</p>` : `<p>${dim("oj.tip.situs")} ${esc(t("oj.situs.kosong"))}</p>`}</section>`;

  const lihatU = new Set(), sm = (o.sumber || []).filter((s) => s.url && !lihatU.has(s.url) && lihatU.add(s.url));
  const sumber = `<section class="oj-kartu" aria-labelledby="ojSumber"><h2 id="ojSumber">${ikon("buku", 20)}${esc(t("oj.sumber"))}</h2>${sm.length
    ? `<ul class="oj-sm">${sm.slice(0, 10).map((s) => `<li><b>${esc(domain(s.url))}</b>${pilBukti(s.tingkat_bukti)}<a href="${esc(urlAman(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.url)}</a>${s.tanggal ? `<small>${esc(tanggal(s.tanggal))}</small>` : ""}</li>`).join("")}</ul>${sm.length > 10 ? `<p class="oj-bantu">${esc(t("oj.lagi", { n: angka(sm.length - 10) }))}</p>` : ""}` : `<p>${dim("oj.tip.sumber")}</p>`}</section>`;

  const sb = sebanding(S, r);
  const banding = sb.length ? `<section class="oj-kartu" aria-labelledby="ojBand"><h2 id="ojBand">${ikon("analisis", 20)}${esc(t("oj.banding"))}</h2><ul class="oj-band">${sb.map((x) => `<li><a href="/o/${esc(x.id)}">${logo(x.id, x.nm, x.o.logo)}<span class="oj-bn">${esc(x.nm)}</span><span class="oj-pil">${esc(t("oj.rank", { k: angka(x.rank) }))}</span></a></li>`).join("")}</ul></section>` : "";

  const aksi = `<div class="oj-aksi">${url ? `<a class="oj-tb oj-tb-utama" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 18)}${esc(t("oj.a.situs"))}</a>` : ""}${Number.isFinite(L.lat) ? `<a class="oj-tb" href="/direktori?tampil=lembaga&id=${encodeURIComponent(o.id)}">${ikon("peta", 18)}${esc(t("oj.a.peta"))}</a>` : ""}${tombolIkuti({ jenis: "organisasi", id: o.id, nama: o.nama })}<a class="oj-tb" href="/rantai-pasok?id=${encodeURIComponent(o.id)}">${ikon("rantai", 18)}${esc(t("oj.a.rantai"))}</a>${tombolKoreksi({ entitas: "organisasi", id: o.id, nama: o.nama })}</div>`;

  return `<nav class="oj-remah" aria-label="${esc(t("oj.remah"))}"><a href="/">${esc(t("oj.r.beranda"))}</a>${ikon("panah-kanan", 14)}<a href="/direktori?tampil=lembaga">${esc(t("oj.r.direktori"))}</a>${ikon("panah-kanan", 14)}<span aria-current="page">${esc(o.nama)}</span></nav>
  <header class="oj-kepala">
    <div class="oj-id">${logo(o.id, o.nama, o.logo, "oj-lg oj-lg-b")}<div><h1>${esc(o.nama)}</h1>${bh ? `<p class="oj-bantu">${esc(t("oj.bh." + bh))}</p>` : ""}<p class="oj-pils"><span class="oj-pil">${esc(namaSek(sek))}</span><span class="oj-pil oj-pil-rank">${esc(t("oj.rank_dari", { k: angka(r.rank), N: angka(N) }))}</span>${r.aplsi ? `<span class="oj-pil">${esc(t("so.len.aplsi"))}</span>` : ""}</p></div></div>
    <p class="oj-jawab">${esc(jawab)}</p>
    <div class="oj-kutip"><span class="oj-kl">${esc(t("oj.kutip"))}</span><code id="ojKutip">${esc(kutip)}</code><button type="button" class="oj-tb" id="ojSalin" data-salin="${esc(kutip)}">${ikon("salin", 18)}<span>${esc(t("oj.salin"))}</span></button></div>
    ${aksi}
  </header>
  <div class="oj-dua"><div class="oj-kol">
    <section class="oj-kartu" aria-labelledby="ojFakta"><h2 id="ojFakta">${ikon("tabel", 20)}${esc(t("oj.fakta"))}</h2><dl class="oj-fakta">${fk}</dl><p class="oj-bantu">${esc(t("oj.diperiksa", { tgl }))}</p></section>
    ${kepemilikan}${rantaiRingkas(o, S)}${kantor}
  </div><div class="oj-kol">${kontak}${yakin}${situs}${arti}${sumber}${banding}</div></div>`;
}

/* tombol salin kutipan + logo cadangan; dipanggil sekali sesudah innerHTML */
export function pasangRingkas(akar) {
  akar.addEventListener("error", (e) => { const im = e.target; if (im.tagName === "IMG" && im.dataset.ini !== undefined && im.closest(".oj-lg")) im.replaceWith(document.createTextNode(im.dataset.ini)); }, true);
  akar.querySelector("#ojSalin")?.addEventListener("click", async (e) => {
    const b = e.currentTarget, teks = b.dataset.salin, s = b.querySelector("span");
    try { await navigator.clipboard.writeText(teks); } catch { const r = document.createRange(); r.selectNodeContents(akar.querySelector("#ojKutip")); const g = getSelection(); g.removeAllRanges(); g.addRange(r); try { document.execCommand("copy"); } catch { /* pilihan teks tetap tersorot */ } }
    s.textContent = t("oj.tersalin"); setTimeout(() => { s.textContent = t("oj.salin"); }, 1800);
  });
}
