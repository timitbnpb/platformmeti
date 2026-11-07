/* /o/<id>: blok profil gaya sensus (kepala berjejak + ubin angka, ubin fakta bersumber, kartu kualitas data, diagram rantai pasok,
   kantor, kontak, sumber, sebanding). Dipanggil o.js. Semua angka dari data; baris tanpa data disembunyikan, bukan diisi "-". */
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { sumberHtml } from "/inti/komponen.js";
import { pilTek } from "/inti/ikon_tek.js";
import { urlAman } from "/publik.js";
import { lencanaOrg } from "/peristiwa_komitmen.js";
import { sebanding, domain, sektorDari, suratPeran, teleponKantor, NORM, TEK_PROYEK } from "/inti/org_sensus.js";
import { logoOrgHtml } from "/o_bagian.js";
import { diperbaruiHtml, pasangRiwayat } from "/inti/riwayat.js";

const pilBukti = (b) => (b ? `<span class="oj-pil" title="${esc(t("oj.tip.bukti"))}" tabindex="0">${esc(t("oj.bukti." + b))}</span>` : "");
const namaSek = (id) => (id === "lain" || id === "lintas" ? t("so.sek." + id) : t("an.tek." + id));
const pilSek = (id) => (TEK_PROYEK.includes(id) ? pilTek(id) : `<span class="oj-pil">${esc(namaSek(id))}</span>`);
const badanHukum = (n) => (/\bTbk\b/i.test(n) ? "tbk" : /\(Persero\)/i.test(n) ? "persero" : (/^(PT|CV|Yayasan|Koperasi)\b/i.exec(n) || [])[1]?.toLowerCase() || "");
const domSumber = (o) => { const s = (o.sumber || []).find((x) => x.jenis === "situs-resmi") || (o.sumber || [])[0]; return s ? domain(s.url) : ""; };
const keuTerbaru = (o, metrik) => (o.keuangan || []).filter((k) => k.metrik === metrik && Number.isFinite(k.nilai)).sort((a, b) => b.tahun - a.tahun)[0];

/* satu ubin: ikon, label, nilai (+satuan, pil), sumber kecil; null bila tidak ada nilai */
function ubin(ik, label, { nilai, satuan = "", pil = "", dom = "", tip = "" }) {
  if (nilai === undefined || nilai === null || nilai === "") return "";
  return `<div class="oj-ub"><span class="oj-ub-ik">${ikon(ik, 20)}</span><div><dt>${esc(label)}${tip ? `<span class="oj-i" title="${esc(tip)}" tabindex="0" aria-label="${esc(tip)}">${ikon("info", 14)}</span>` : ""}</dt><dd><b>${nilai}</b>${satuan ? ` <span class="oj-sat">${esc(satuan)}</span>` : ""}${pil}</dd>${dom ? `<small class="oj-dom">${esc(dom)}</small>` : ""}</div></div>`;
}
const hash = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7);

/* diagram rantai: pemasok | organisasi | pelanggan (maks 5 per sisi) */
function rantaiDiagram(o, S) {
  const simpul = new Map((S.rantai?.simpul || []).map((s) => [s.id, s]));
  const baris = (S.rantai?.tautan || []).filter((x) => x.pemasok_id === o.id || x.pelanggan_id === o.id).map((x) => { const keluar = x.pemasok_id === o.id, lain = simpul.get(keluar ? x.pelanggan_id : x.pemasok_id);
    return { peran: keluar ? "pelanggan" : "pemasok", id: keluar ? x.pelanggan_id : x.pemasok_id, nama: lain?.nama || "-", jenis: t("oj.rk." + x.kategori), angka: x.angka?.nilai ? `${angka(x.angka.nilai)} ${x.angka.satuan}` : "", dom: x.domain || domain(x.url_dokumen), bukti: x.label_bukti }; });
  const lihat = new Set(baris.map((b) => b.peran + NORM(b.nama)));
  for (const x of o.relasi || []) { const p = x.arah === "pemasok" ? "pemasok" : "pelanggan"; if (lihat.has(p + NORM(x.nama))) continue; lihat.add(p + NORM(x.nama)); baris.push({ peran: p, id: x.organisasi_id, nama: x.nama, jenis: x.jenis || "", angka: x.besaran_teknis || "", dom: domain(x.sumber_url), bukti: x.label_bukti }); }
  if (!baris.length) return "";
  const sisi = (peran) => {
    const d = baris.filter((b) => b.peran === peran), tampil = d.slice(0, 5);
    const li = tampil.map((b) => { const isi = `${logoOrgHtml(b.id, b.nama, null, "oj-lg oj-lg-s")}<span class="oj-sp-t"><b>${esc(b.nama)}</b><small>${b.jenis ? `<span class="oj-jn oj-jn-${hash(b.jenis) % 5}">${esc(b.jenis)}</span>` : ""}${b.angka ? `<span>${esc(b.angka)}</span>` : ""}${b.dom ? `<span class="oj-dom">${esc(b.dom)}</span>` : ""}</small></span>${b.bukti ? pilBukti(b.bukti) : ""}`;
      return `<li>${b.id ? `<a class="oj-sp" href="/o/${esc(b.id)}">${isi}</a>` : `<span class="oj-sp">${isi}</span>`}</li>`; }).join("");
    return `<div class="oj-rk-sisi oj-rk-${peran}"><span class="oj-peran ${peran === "pemasok" ? "oj-pr-dir" : "oj-pr-utama"}">${ikon("rantai", 14)}<span>${esc(t("oj.peran." + peran))} (${esc(angka(d.length))})</span></span>${tampil.length ? `<ul class="oj-sp-daftar">${li}</ul>` : `<p class="oj-bantu">-</p>`}${d.length > 5 ? `<a class="oj-lagi" href="/rantai?cari=${encodeURIComponent(o.nama)}">${esc(t("oj.lagi", { n: angka(d.length - 5) }))}</a>` : ""}</div>`;
  };
  return `<section class="oj-kartu oj-rk-kartu" aria-labelledby="ojRk"><div class="oj-kh"><h2 id="ojRk">${ikon("rantai", 20)}${esc(t("oj.rantai"))}</h2><a class="oj-tautan-kecil" href="/rantai?cari=${encodeURIComponent(o.nama)}">${esc(t("oj.a.rantai"))}${ikon("panah-kanan", 14)}</a></div>
    <div class="oj-rk-diagram">${sisi("pemasok")}<div class="oj-rk-tengah"><span class="oj-sp oj-sp-ini">${logoOrgHtml(o.id, o.nama, o.logo, "oj-lg oj-lg-b")}<span class="oj-sp-t"><b>${esc(o.nama)}</b></span></span></div>${sisi("pelanggan")}</div></section>`;
}

/* gauge setengah lingkaran untuk skor 0..1 */
function gauge(sk, tingkat, tip) {
  const a = Math.PI * (1 - Math.min(1, Math.max(0, sk))), x = 60 + 46 * Math.cos(a), y = 58 - 46 * Math.sin(a);
  return `<svg class="jm-gf oj-gauge" viewBox="0 0 120 70" role="img" aria-label="${esc(tip)}" focusable="false"><path class="oj-g-alas" d="M14 58A46 46 0 0 1 106 58"/><path class="oj-g-isi oj-${tingkat}" d="M14 58A46 46 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}" tabindex="0" data-tip="${esc(tip)}"/><text class="oj-g-angka" x="60" y="56" text-anchor="middle">${esc(angka(sk, { desimal: 2 }))}</text></svg>`;
}

export function ringkasHtml(o, S, { tombolIkuti, tombolKoreksi }) {
  const r = S.per.get(o.id), N = S.baris.length, tgl = tanggal(o.diperiksa || S.tgl), tglP = tanggal(S.tglProyek);
  const L = o.lokasi || {}, sek = r.sek, url = urlAman(o.situs), bh = badanHukum(o.nama), dSitus = url ? domain(url) : "", dom = domSumber(o);
  const jawab = t("oj.jawab", { nama: o.nama, kat: (o.kategori?.label || "").toLowerCase(), sek: namaSek(sek).toLowerCase(), kota: L.kota ? t("oj.jawab.kota", { kota: L.kota }) : "", proyek: r.nProy ? t(r.mw ? "oj.jawab.proyek" : "oj.jawab.proyek0", { n: angka(r.nProy), mw: angka(Math.round(r.mw)), v: angka(r.nProv) }) : t("oj.jawab.tanpa"), k: angka(r.rank), N: angka(N) });
  const kutip = `${o.nama}. ${t("oj.kutip.dari", { tgl })}. ${location.origin}/o/${o.id}`;
  const sk = r.yakin.skor, tingkat = sk >= 0.65 ? "ok" : sk >= 0.4 ? "warn" : "bad";

  /* ubin angka di kepala: nilai minimum bertanda info (tooltip), bukan lencana */
  const kpi = (ik, label, nilai, ket, min, sat = "") => `<li class="oj-kpi"><span class="oj-ub-ik">${ikon(ik, 20)}</span><b>${esc(nilai)}${sat ? ` <span class="oj-sat">${esc(sat)}</span>` : ""}</b><span class="oj-kpi-l">${esc(label)}${min ? `<span class="oj-i" title="${esc(t("oj2.min"))}" tabindex="0" aria-label="${esc(t("oj2.min"))}">${ikon("info", 14)}</span>` : ""}</span><small>${esc(ket)}</small></li>`;
  const kpis = [
    kpi("proyek", t("oj2.kpi.proyek"), r.nProy ? angka(r.nProy) : "-", t("oj.s.proyek", { tgl: tglP }), !!r.nProy),
    kpi("petir", t("oj2.kpi.mw"), r.mw ? angka(Math.round(r.mw)) : "-", t("oj.k.mw"), !!r.mw, r.mw ? "MW" : ""),
    kpi("peta", t("oj2.kpi.prov"), r.nProv ? angka(r.nProv) : "-", t("oj.s.proyek", { tgl: tglP }), !!r.nProv),
    kpi("piala", t("oj2.kpi.rank"), `#${angka(r.rank)}`, t("oj2.kpi.rank_ket", { N: angka(N) }), false),
  ].join("");

  const uangPil = (k) => (k ? pilBukti(k.tingkat_bukti) : "");
  const fk = [
    ubin("tag", t("oj.f.kategori"), { nilai: esc(o.kategori?.label || "") }),
    ubin("petir", t("oj.f.sektor"), { nilai: esc(namaSek(sek)), pil: `<span class="oj-pil" title="${esc(t("oj.tip.turunan"))}" tabindex="0">${esc(t("so.pil.est"))}</span>`, tip: t(r.ps.length ? "oj.k.sektor_proyek" : "oj.k.sektor") }),
    ubin("tahun", t("oj.f.tahun"), { nilai: o.tahun_berdiri ? esc(o.tahun_berdiri) : "", dom }),
    ubin("grafik", t("oj.f.saham"), { nilai: o.kode_saham ? esc(o.kode_saham) : "", dom }),
    ...["pendapatan", "laba bersih"].map((m) => { const k = keuTerbaru(o, m); return ubin(m === "pendapatan" ? "kartu" : "grafik", t("oj.f.keu_" + (m === "pendapatan" ? "pendapatan" : "laba"), { tahun: k?.tahun ?? "" }).trim(), { nilai: k ? esc(angka(k.nilai)) : "", satuan: k?.satuan, pil: uangPil(k), dom: k ? domain(k.sumber_url) : "", tip: k ? t("oj.k.keu") : "" }); }),
    ubin("lencana", t("oj.f.aplsi"), { nilai: r.aplsi ? esc(t("oj.ya")) : "", dom: "aplsi.or.id" }),
    ubin("bendera", t("oj.f.meti"), { nilai: o.meti ? esc(t("oj.ya")) : "" }),
    ubin("tautan", t("oj2.f.situs"), { nilai: url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(dSitus)}</a>` : "" }),
  ].filter(Boolean).join("");
  const glosarium = `<dl class="oj-arti">${["proyek", "mw", "min", "est", "skor"].map((k) => `<div><dt>${esc(t("oj.arti." + k))}</dt><dd>${esc(t("oj.arti." + k + ".d"))}</dd></div>`).join("")}</dl>`;
  const per = new Map();
  for (const s of (o.sumber || []).filter((x) => x.url && urlAman(x.url))) { const d = domain(s.url) || s.url, a = per.get(d) || { s, n: 0 }; a.n++; per.set(d, a); }
  const sumber = per.size ? `<div class="oj-sumber"><span class="oj-kl">${ikon("buku", 16)}${esc(t("oj.sumber"))}</span><p class="oj-chips">${[...per].slice(0, 12).map(([d, a]) => `<a class="oj-chip oj-chip-s" href="${esc(urlAman(a.s.url))}" target="_blank" rel="noopener noreferrer" title="${esc(a.s.tanggal ? tanggal(a.s.tanggal) : "")}">${esc(d)}${a.n > 1 ? `<b>${esc(angka(a.n))}</b>` : ""}</a>`).join("")}</p>${per.size > 12 ? `<span class="oj-bantu">${esc(t("oj.lagi", { n: angka(per.size - 12) }))}</span>` : ""}</div>` : "";
  const fakta = fk ? `<section class="oj-kartu" aria-labelledby="ojFakta"><div class="oj-kh"><h2 id="ojFakta">${ikon("tabel", 20)}${esc(t("oj.fakta"))}</h2>${sumberHtml(glosarium, t("oj.arti"))}</div><dl class="oj-fakta">${fk}</dl>${sumber}<p class="oj-bantu">${esc(t("oj2.diperiksa", { tgl }))}</p></section>` : "";

  /* satu kartu kualitas data: gauge + tiga komponen berangka; rumus di popover info */
  const tg = (v, a, b) => (v >= a ? "ok" : v >= b ? "warn" : "bad");
  const komp = (ik, label, nilai, tng) => `<li class="oj-komp"><span class="oj-titik oj-${tng}" aria-hidden="true"></span><span>${esc(label)}</span><b>${esc(nilai)}</b></li>`;
  const rumus = `<p><b>${esc(t("oj.cara"))}</b></p><p>${esc(t("oj.cara.isi", { isi: angka(r.yakin.isi, { desimal: 2 }), dom: angka(r.yakin.domain), bukti: angka(r.yakin.bukti, { desimal: 2 }) }))}</p>`;
  const tipSkor = t("oj2.kd.tip", { s: angka(sk, { desimal: 2 }), t: t("oj.yakin.t." + tingkat) });
  const yakin = `<section class="oj-kartu oj-kd" aria-labelledby="ojYakin"><div class="oj-kh"><h2 id="ojYakin">${ikon("perisai", 20)}${esc(t("oj2.kd"))}</h2>${sumberHtml(rumus, t("oj.cara"))}</div>
    <div class="oj-kd-isi">${gauge(sk, tingkat, tipSkor)}<div><p class="oj-skor"><span class="oj-pil oj-pil-${tingkat}">${esc(t("oj.yakin.t." + tingkat))}</span><span class="oj-pil">${esc(t("oj.hipotesis"))}</span></p>
    <ul class="oj-komps">${komp("tabel", t("oj2.kd.isi"), angka(r.yakin.isi, { desimal: 2 }), tg(r.yakin.isi, 0.7, 0.4))}${komp("tautan", t("oj2.kd.dom"), t("oj2.kd.dom_n", { n: angka(r.yakin.domain) }), tg(r.yakin.domain, 3, 2))}${komp("lencana", t("oj2.kd.bukti"), angka(r.yakin.bukti, { desimal: 2 }), tg(r.yakin.bukti, 0.7, 0.4))}</ul></div></div></section>`;

  const presisi = L.presisi ? t("oj.presisi." + L.presisi) : "";
  const kantor = L.kota || L.alamat || L.provinsi ? `<section class="oj-kartu" aria-labelledby="ojKantor"><div class="oj-kh"><h2 id="ojKantor">${ikon("lokasi", 20)}${esc(t("oj.kantor"))}</h2></div>
    <p class="oj-alamat">${esc([L.alamat, L.kota, L.provinsi].filter((v, i, a) => v && a.indexOf(v) === i).join(", "))}</p>${presisi ? `<p class="oj-bantu">${ikon("info", 14)}${esc(presisi)}</p>` : ""}</section>` : "";

  const emel = suratPeran(o), telp = teleponKantor(o);
  const kontak = emel.length || telp.length ? `<section class="oj-kartu" aria-labelledby="ojKontak"><div class="oj-kh"><h2 id="ojKontak">${ikon("surel", 20)}${esc(t("oj.kontak"))}</h2>${sumberHtml(esc(t("oj.kontak.aturan")))}</div><ul class="oj-kon">${emel.map((e) => `<li>${ikon("surel", 16)}<a href="mailto:${esc(e)}">${esc(e)}</a></li>`).join("")}${telp.map((x) => `<li>${ikon("kartu", 16)}<a href="tel:${esc(x.replace(/[^\d+]/g, ""))}">${esc(x)}</a></li>`).join("")}</ul><small class="oj-dom">${esc(t("oj.kontak.sumber", { dom: dSitus || dom || "-" }))}</small></section>` : "";

  /* sumber: satu chip per domain (tautan ke sumber pertama), jumlah bila lebih dari satu */
  const info = [kantor, kontak].filter(Boolean);

  /* sebanding: sektor sama dulu, lalu tetangga peringkat; 5 ubin berlogo, disembunyikan bila kurang dari 3 */
  let sb = sebanding(S, r, 5);
  if (sb.length < 5) { const ada = new Set([r, ...sb]); sb = [...sb, ...S.baris.filter((x) => !ada.has(x) && x.nProy > 0).sort((a, b) => Math.abs(a.rank - r.rank) - Math.abs(b.rank - r.rank)).slice(0, 5 - sb.length)]; }
  const banding = sb.length >= 3 ? `<section class="oj-kartu" aria-labelledby="ojBand"><div class="oj-kh"><h2 id="ojBand">${ikon("analisis", 20)}${esc(t("oj.banding"))}</h2>${sumberHtml(esc(t("oj2.band.sub")))}</div><ul class="oj-band">${sb.map((x) => `<li><a href="/o/${esc(x.id)}">${logoOrgHtml(x.id, x.nm, x.o.logo, "oj-lg oj-lg-s")}<span class="oj-bn">${esc(x.nm)}</span>${pilSek(x.sek)}<span class="oj-band-n">${esc(x.mw ? `${angka(Math.round(x.mw))} MW` : "-")}<small>${esc(t("pf.prog.proyek", { n: angka(x.nProy) }))}</small></span><span class="oj-pil oj-pil-rank">${esc(t("oj.rank", { k: angka(x.rank) }))}</span></a></li>`).join("")}</ul></section>` : "";

  const aksi = `<div class="oj-aksi">${url ? `<a class="oj-tb oj-tb-utama" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 18)}${esc(t("oj.a.situs"))}</a>` : ""}${Number.isFinite(L.lat) ? `<a class="oj-tb" href="/direktori?tampil=lembaga&id=${encodeURIComponent(o.id)}">${ikon("peta", 18)}${esc(t("oj.a.peta"))}</a>` : ""}${tombolIkuti({ jenis: "organisasi", id: o.id, nama: o.nama })}<a class="oj-tb" href="/rantai?cari=${encodeURIComponent(o.nama)}">${ikon("rantai", 18)}${esc(t("oj.a.rantai"))}</a>${tombolKoreksi({ entitas: "organisasi", id: o.id, nama: o.nama })}</div>`;

  return `<header class="oj-kepala">
    <nav class="oj-remah" aria-label="${esc(t("oj.remah"))}"><a class="oj-r-rumah" href="/" aria-label="${esc(t("oj.r.beranda"))}" title="${esc(t("oj.r.beranda"))}">${ikon("beranda", 18)}</a>${ikon("panah-kanan", 14)}<a href="/direktori?tampil=lembaga">${esc(t("oj.r.direktori"))}</a>${ikon("panah-kanan", 14)}<span class="oj-r-ini" aria-current="page">${logoOrgHtml(o.id, o.nama, o.logo, "oj-lg oj-lg-k")}<span>${esc(o.nama)}</span></span></nav>
    <div class="oj-kepala-isi"><div class="oj-kepala-kiri">
      <div class="oj-id">${logoOrgHtml(o.id, o.nama, o.logo, "oj-lg oj-lg-b")}<div><h1>${esc(o.nama)}</h1>${bh ? `<p class="oj-bantu">${esc(t("oj.bh." + bh))}</p>` : ""}<p class="oj-pils">${pilSek(sek)}${r.aplsi ? `<span class="oj-pil">${esc(t("so.len.aplsi"))}</span>` : ""}</p></div></div>
      <p class="oj-jawab">${esc(jawab)}</p>
      ${diperbaruiHtml({ jenis: "organisasi", id: o.id, nama: o.nama, tgl: o.diperiksa || S.tgl })}
      <div class="oj-kutip"><span class="oj-kl">${esc(t("oj.kutip"))}</span><code id="ojKutip">${esc(kutip)}</code><button type="button" class="oj-tb" id="ojSalin" data-salin="${esc(kutip)}">${ikon("salin", 18)}<span>${esc(t("oj.salin"))}</span></button></div>
      ${aksi}</div>
      <ul class="oj-kpis">${kpis}</ul></div>
  </header>
  <div class="oj-baris oj-baris-dua">${fakta}${yakin}</div>
  ${rantaiDiagram(o, S)}
  ${info.length ? `<div class="oj-baris">${info.join("")}</div>` : ""}
  ${banding}`;
}

/* tombol salin kutipan + logo cadangan; dipanggil sekali sesudah innerHTML */
export function pasangRingkas(akar, o) {
  pasangRiwayat(akar);
  if (o) lencanaOrg(o.nama).then((h) => { if (h) akar.querySelector(".oj-pils")?.insertAdjacentHTML("beforeend", h); });
  akar.addEventListener("error", (e) => { const im = e.target; if (im.tagName === "IMG" && im.dataset.ini !== undefined && im.closest(".oj-lg")) im.replaceWith(document.createTextNode(im.dataset.ini)); }, true);
  akar.querySelector("#ojSalin")?.addEventListener("click", async (e) => {
    const b = e.currentTarget, teks = b.dataset.salin, s = b.querySelector("span");
    try { await navigator.clipboard.writeText(teks); } catch { const r = document.createRange(); r.selectNodeContents(akar.querySelector("#ojKutip")); const g = getSelection(); g.removeAllRanges(); g.addRange(r); try { document.execCommand("copy"); } catch { /* pilihan teks tetap tersorot */ } }
    s.textContent = t("oj.tersalin"); setTimeout(() => { s.textContent = t("oj.salin"); }, 1800);
  });
}
