/* Lembar proyek /investasi: pop-up besar (skor, model keuangan, pendana, risiko, perizinan), lembar cetak A4, dan tabel banding 2-3 proyek.
   Semua angka datang dari public/data/investasi.json (scripts/pipa/investasi.mjs); tidak ada rumus baru di sini. Hipotesis, bukan rekomendasi investasi. */
import { t, tanggal } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { sumberHtml } from "/inti/komponen.js";
import { BOBOT, MIN_KOMPONEN } from "/inti/investasi_rumus.js";
import { KOMP, N, pct, rpkwh, usd, rpMiliar, tahun, hipPil, lambang, bendera, logoPemilik, pemilikHtml, lokasiHtml, pilTahap, pilTek, pilTingkat, skorHtml, nilaiPil, tautModel, masukan } from "/investasi_umum.js";

const tabel = (kolom, baris, kls = "") => `<div class="jm-gulir"><table class="jm-tabel jm-tabel-tetap ${kls}"><thead><tr>${kolom.map(([k, c]) => `<th scope="col"${c ? ` class="${c}"` : ""}>${esc(t(k))}</th>`).join("")}</tr></thead><tbody>${baris.join("")}</tbody></table></div>`;
const td = (k, h, c = "") => `<td data-label="${esc(t(k))}"${c ? ` class="${c}"` : ""}>${h}</td>`;
const bag = (id, ik, j, isi, kls = "") => `<section class="iv-bag ${kls}" id="${id}"><h3 class="iv-bag-j">${ikon(ik, 18)}<span>${esc(t(j))}</span></h3>${isi}</section>`;
const dl = (baris) => `<dl class="iv-dl">${baris.filter(Boolean).map(([k, v]) => `<div><dt>${esc(t(k))}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
const pilTitik = (teks, kelas = "") => `<span class="jm-pil iv-nilai ${kelas}"><i aria-hidden="true"></i><b>${esc(teks)}</b></span>`;

/* ---------- bagian-bagian ---------- */
export function ubinRingkas(b) {
  const m = b.model, ada = !m.galat;
  const u = [["petir", t("iv.c.kap"), `${N(b.mw, b.mw < 100 ? 1 : 0)} MW`], ["kartu", t("iv.m.dana"), ada ? usd(m.capex_usd_juta) : "-"], ["grafik", t("iv.m.irr"), ada ? pct(m.irr) : "-"], ["tag", t("iv.m.lcoe"), ada ? rpkwh(m.lcoe) : "-"]];
  return `<div class="iv-ubin">${u.map(([ik, l, v]) => `<div class="iv-ub"><span class="jm-kpi-ik">${ikon(ik, 18)}</span><p><b>${esc(v)}</b><small>${esc(l)}</small></p></div>`).join("")}</div>`;
}

function bagSkor(b, D) {
  const pakai = KOMP.filter((k) => b.k[k] != null), tot = pakai.reduce((a, k) => a + BOBOT[k], 0);
  const baris = KOMP.map((k) => {
    const ada = b.k[k] != null;
    return `<tr>${td("iv.col.komp", `<b>${esc(t("iv.kp." + k))}</b>`)}${td("iv.col.nilai", nilaiPil(b.k[k]), "jm-num")}${td("iv.col.bobot", ada ? esc(`${N((BOBOT[k] / tot) * 100)}%`) : '<span class="iv-redup">-</span>', "jm-num")}${td("iv.col.masukan", esc(masukan(b, k)))}</tr>`;
  });
  return bag("ivSkor", "metode", "iv.l.skor", `<p class="iv-skor-ring">${skorHtml(b)}${pilTingkat(b.skor)}${hipPil()}</p>${tabel([["iv.col.komp"], ["iv.col.nilai", "jm-num"], ["iv.col.bobot", "jm-num"], ["iv.col.masukan"]], baris)}
    <p class="iv-cat">${esc(t("iv.skor.rumus", { n: MIN_KOMPONEN }))} <a href="/metode#investasi">${esc(t("iv.met.link"))}</a></p>`);
}

function bagModel(b) {
  const m = b.model;
  if (m.galat) return bag("ivModel", "kalkulator", "iv.l.model", `<p class="iv-kosong">${ikon("info", 18)}<span>${esc(t("iv.m.galat", { sel: m.galat.map((k) => t("mk.f." + k)).join(", ") }))}</span></p>`);
  const diisi = m.diisi?.length ? `<p class="iv-cat">${ikon("info", 14)} ${esc(t("iv.m.diisi", { sel: m.diisi.map((k) => t("iv.m.sel." + k)).join(", ") }))}</p>` : "";
  const hasil = dl([["iv.m.irr", `<b>${pct(m.irr)}</b>`], ["iv.m.lcoe", `<b>${esc(rpkwh(m.lcoe))}</b>`], ["iv.m.dana", `<b>${esc(usd(m.capex_usd_juta))}</b> <small>${esc(rpMiliar(m.capex_rp_miliar))}</small>`], ["iv.m.npv", esc(rpMiliar(m.npv_rp_miliar))], ["iv.m.balik", esc(tahun(m.balik))], ["iv.m.rasio", esc(`${N(m.rasio_harga, 2)}x`)]]);
  const asumsi = dl([["iv.m.bisnis", esc(t("iv.m.ipp"))], ["iv.m.tarif", esc(`${rpkwh(m.tarif)} / ${rpkwh(m.tarif11)}`)], ["iv.m.capex", esc(t("iv.m.usd_kw", { n: N(m.capex_usd_kw) }))], ["iv.m.opex", esc(t("iv.m.usd_kw", { n: N(m.opex_usd_kw_thn, 1) }))], ["iv.m.fk", esc(`${N(m.fk, 1)}%`)], ["iv.m.umur", esc(tahun(m.umur))], ["iv.m.diskonto", esc(`${N(m.diskonto, 1)}%`)], ["iv.m.kurs", esc(t("iv.m.rp_usd", { n: N(m.kurs) }))]]);
  return bag("ivModel", "kalkulator", "iv.l.model", `<p class="iv-cat">${hipPil()} ${esc(t("iv.m.cara"))}</p><h4 class="iv-sub">${esc(t("iv.m.hasil"))}</h4>${hasil}<h4 class="iv-sub">${esc(t("iv.m.asumsi"))}</h4>${asumsi}${diisi}
    <a class="jm-tbl jm-tbl-utama" href="${esc(tautModel(b))}">${ikon("kalkulator", 16)}<span>${esc(t("iv.m.buka"))}</span></a>`);
}

function kartuPendana(p, d) {
  const alasan = p.a.map((a) => `<span class="jm-pil jm-pil-ok">${ikon("centang", 12)}<span>${esc(t("iv.p.alasan." + a))}</span></span>`).join("");
  const nama = d.org_id ? `<a href="/o/${esc(d.org_id)}">${esc(d.nama)}</a>` : d.url && /^https?:\/\//.test(d.url) ? `<a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.nama)}</a>` : esc(d.nama);
  const ik = d.negara ? bendera(d.negara, 22) : `<span class="iv-logo">${ikon(d.jenis === "skema" ? "kartu" : "gedung", 14)}</span>`;
  return `<li class="iv-pn"><span class="iv-pn-ik">${ik}</span><div class="iv-pn-isi"><p class="iv-pn-nama">${nama}<span class="jm-pil">${esc(t("iv.p.jenis." + d.jenis))}</span></p>
    <p class="iv-pn-sub">${esc(d.sub)}${d.tiket ? ` <span class="iv-redup">${esc(t("iv.p.tiket", { n: N(d.tiket / 1e6, d.tiket < 1e8 ? 1 : 0) }))}</span>` : ""}</p><p class="iv-pn-alasan">${alasan}</p></div><b class="iv-pn-skor" title="${esc(t("iv.p.cocok", { n: N(p.s * 100) }))}">${esc(N(p.s * 100))}</b></li>`;
}
function bagPendana(b, ctx) {
  const isi = b.pendana.length ? `<ul class="iv-pn-daftar">${b.pendana.map((p) => kartuPendana(p, ctx.pn.get(p.i))).join("")}</ul><p class="iv-cat">${esc(t("iv.p.catatan"))}</p>`
    : `<p class="iv-kosong">${ikon("info", 18)}<span>${esc(t(b.model.galat ? "iv.p.tanpa_model" : "iv.p.kosong"))}</span></p>`;
  return bag("ivPendana", "kartu", "iv.l.pendana", isi);
}

function bagRisiko(b) {
  const r = b.risiko, baris = [];
  if (r) {
    baris.push(`<p class="iv-skor-ring">${pilTitik(N(r.skor), "iv-nl-" + (r.skor >= 45 ? "r" : r.skor >= 25 ? "s" : "t"))}<span class="jm-pil iv-rk iv-rk-${esc(r.kelas)}">${esc(t("iv.r.kelas." + r.kelas))}</span></p>`);
    const komp = Object.entries(r.komponen).filter(([, v]) => v.v != null).sort((x, y) => y[1].v - x[1].v);
    baris.push(`<ul class="iv-rk-daftar">${komp.map(([k, v]) => `<li><span>${esc(t("iv.r." + k))}</span><span class="iv-redup">${esc(String(v.ket || ""))}</span>${pilTitik(N(v.v), "iv-nl-" + (v.v >= 45 ? "r" : v.v >= 25 ? "s" : "t"))}</li>`).join("")}</ul>`);
    if (r.dikeluarkan?.length) baris.push(`<p class="iv-cat">${esc(t("iv.r.dikeluarkan", { k: r.dikeluarkan.map((k) => t("iv.r." + k)).join(", ") }))}</p>`);
  } else baris.push(`<p class="iv-kosong">${ikon("info", 18)}<span>${esc(t("iv.r.tanpa"))}</span></p>`);
  if (b.isu.length) baris.push(`<h4 class="iv-sub">${esc(t("iv.r.isu"))}</h4><ul class="iv-isu">${b.isu.map((i) => `<li>${ikon("peringatan", 14)}<span>${esc(i.teks)}</span></li>`).join("")}</ul>`);
  if (b.presisi === "provinsi") baris.push(`<p class="iv-cat">${ikon("info", 14)} ${esc(t("iv.r.lokasi", { presisi: t("iv.presisi.provinsi") }))}</p>`);
  return bag("ivRisiko", "peringatan", "iv.l.risiko", baris.join(""));
}

function bagIzin(b) {
  const z = b.izin, d = [["iv.z.tahap", pilTahap(b)], ["iv.z.prov", z.prov_skor == null ? '<span class="iv-redup">-</span>' : `<b>${esc(N(z.prov_skor))}</b> <small>/ 100</small>`],
    z.perda_n != null ? ["iv.z.perda", esc(N(z.perda_n))] : null, b.cod ? ["iv.z.cod", esc(String(b.cod))] : null,
    z.amdal ? ["iv.z.amdal", `<a href="${esc(z.amdal.url)}" target="_blank" rel="noopener noreferrer">${esc(t("iv.z.amdal_isi", { tanggal: tanggal(z.amdal.tanggal), bulan: N(z.amdal.bulan) }))}</a>`] : null,
    z.lelang.length ? ["iv.z.lelang", z.lelang.map((l) => `<a href="/lelang#putaran">${esc(l.nama)}</a>`).join(", ")] : null,
    b.psn ? ["iv.z.psn", esc(b.psn.nama)] : null];
  const tanpa = !z.amdal && !z.lelang.length && !b.psn ? `<p class="iv-cat">${ikon("info", 14)} ${esc(t("iv.z.tanpa"))}</p>` : "";
  return bag("ivIzin", "lencana", "iv.l.izin", dl(d) + tanpa);
}

const sumberIsi = (D) => D.sumber.map((s) => `${esc(s.judul)} (${esc(s.berkas)}, ${esc(s.tanggal)})`).join("<br>");
function bagSumber(b, D) {
  return `<p class="iv-cat iv-lebar">${sumberHtml(sumberIsi(D))} ${esc(t("iv.penafian.j"))} ${esc(t("iv.penafian"))}</p>`;
}

/* ---------- pop-up lembar ---------- */
export function lembarHtml(b, ctx) {
  const D = ctx.D, tautProfil = b.profil && /^pj_/.test(b.id) ? `<a class="jm-tbl" href="/p/${esc(b.id)}">${ikon("proyek", 16)}<span>${esc(t("iv.a.profil"))}</span></a>` : "";
  const sumberProyek = b.url && /^https?:\/\//.test(b.url) ? `<a class="jm-tbl" href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}<span>${esc(t("iv.a.sumber"))}</span></a>` : "";
  return `<header class="iv-lh"><div class="iv-lh-bar"><button type="button" class="iv-x" data-tutup aria-label="${esc(t("jm.tutup"))}">${ikon("silang", 18)}</button></div>
    <div class="iv-lh-isi"><div class="iv-lh-teks"><p class="iv-lh-pil">${pilTek(b.tek)}${pilTahap(b)}${hipPil()}</p><h2 id="ivDlgJ">${esc(b.nama)}</h2>
      <p class="iv-lh-meta"><span>${lokasiHtml(b)}</span><span>${pemilikHtml(b)}</span></p></div>
      <div class="iv-lh-skor"><p class="iv-lh-skor-l">${esc(t("iv.c.skor"))}</p>${skorHtml(b)}${pilTingkat(b.skor)}</div></div></header>
    <div class="iv-lb">${ubinRingkas(b)}<div class="iv-kol"><div class="iv-kol-a">${bagSkor(b, D)}${bagModel(b)}</div><div class="iv-kol-b">${bagPendana(b, ctx)}${bagRisiko(b)}${bagIzin(b)}</div></div>${bagSumber(b, D)}</div>
    <footer class="iv-lf"><button type="button" class="jm-tbl jm-tbl-utama" data-cetak="${esc(b.id)}">${ikon("pdf", 16)}<span>${esc(t("iv.a.cetak"))}</span></button>${b.model.galat ? "" : `<a class="jm-tbl" href="${esc(tautModel(b))}">${ikon("kalkulator", 16)}<span>${esc(t("iv.m.buka"))}</span></a>`}${tautProfil}${sumberProyek}
      <button type="button" class="jm-tbl" data-banding="${esc(b.id)}">${ikon("banding", 16)}<span>${esc(t("iv.c.banding"))}</span></button></footer>`;
}

/* ---------- lembar cetak A4 ---------- */
export function cetakHtml(b, ctx) {
  const D = ctx.D, m = b.model, ada = !m.galat;
  const pn = b.pendana.slice(0, 5).map((p) => { const d = ctx.pn.get(p.i); return `<tr><td>${esc(d.nama)}</td><td>${esc(t("iv.p.jenis." + d.jenis))} - ${esc(d.sub)}</td><td>${esc(p.a.map((a) => t("iv.p.alasan." + a)).join(", "))}</td><td class="jm-num">${esc(N(p.s * 100))}</td></tr>`; }).join("");
  const pakai = KOMP.filter((k) => b.k[k] != null), tot = pakai.reduce((a, k) => a + BOBOT[k], 0);
  const sk = KOMP.map((k) => `<tr><td>${esc(t("iv.kp." + k))}</td><td class="jm-num">${b.k[k] == null ? "-" : esc(N(b.k[k] * 100))}</td><td class="jm-num">${b.k[k] == null ? "-" : esc(N((BOBOT[k] / tot) * 100) + "%")}</td><td>${esc(masukan(b, k))}</td></tr>`).join("");
  const r = b.risiko, rk = r ? Object.entries(r.komponen).filter(([, v]) => v.v != null).sort((x, y) => y[1].v - x[1].v).map(([k, v]) => `${t("iv.r." + k)}: ${v.ket} (${N(v.v)})`).join("; ") : t("iv.r.tanpa");
  const baris = (rows) => rows.map(([k, v]) => `<tr><th scope="row">${esc(t(k))}</th><td>${v}</td></tr>`).join("");
  return `<header class="iv-cp-kop"><b>${esc(t("iv.cetak.kop"))}</b><span>${esc(t("iv.cetak.judul"))}</span></header>
    <h1>${esc(b.nama)}</h1>
    <p class="iv-cp-meta">${esc(t("pj.tek." + b.tek))} - ${esc(t("pj.st." + b.status))} - ${esc(N(b.mw, b.mw < 100 ? 1 : 0))} MW - ${esc(b.prov || "-")} - ${esc(b.pemilik?.nama || t("iv.c.tanpa_pemilik"))}</p>
    <p class="iv-cp-pen"><b>${esc(t("iv.penafian.j"))}</b> ${esc(t("iv.penafian"))}</p>
    <h2>${esc(t("iv.l.skor"))}: ${esc(b.skor == null ? "-" : N(b.skor, 1))} (${esc(t("kl.hipotesis"))})</h2>
    <table class="iv-cp-t"><thead><tr><th>${esc(t("iv.col.komp"))}</th><th>${esc(t("iv.col.nilai"))}</th><th>${esc(t("iv.col.bobot"))}</th><th>${esc(t("iv.col.masukan"))}</th></tr></thead><tbody>${sk}</tbody></table>
    <h2>${esc(t("iv.l.model"))} (${esc(t("kl.hipotesis"))})</h2>
    ${ada ? `<table class="iv-cp-t iv-cp-kv"><tbody>${baris([["iv.m.dana", esc(`${usd(m.capex_usd_juta)} (${rpMiliar(m.capex_rp_miliar)})`)], ["iv.m.irr", esc(pct(m.irr))], ["iv.m.lcoe", esc(rpkwh(m.lcoe))], ["iv.m.npv", esc(rpMiliar(m.npv_rp_miliar))], ["iv.m.balik", esc(tahun(m.balik))], ["iv.m.tarif", esc(`${rpkwh(m.tarif)} / ${rpkwh(m.tarif11)}`)], ["iv.m.capex", esc(t("iv.m.usd_kw", { n: N(m.capex_usd_kw) }))], ["iv.m.opex", esc(t("iv.m.usd_kw", { n: N(m.opex_usd_kw_thn, 1) }))], ["iv.m.fk", esc(`${N(m.fk, 1)}%`)], ["iv.m.umur", esc(tahun(m.umur))], ["iv.m.diskonto", esc(`${N(m.diskonto, 1)}%`)]])}</tbody></table><p class="iv-cp-cat">${esc(t("iv.m.cara"))}</p>` : `<p>${esc(t("iv.m.galat", { sel: m.galat.map((k) => t("mk.f." + k)).join(", ") }))}</p>`}
    <h2>${esc(t("iv.l.pendana"))}</h2>
    ${pn ? `<table class="iv-cp-t"><thead><tr><th>${esc(t("iv.p.nama"))}</th><th>${esc(t("iv.p.jenis"))}</th><th>${esc(t("iv.p.alasan"))}</th><th>${esc(t("iv.p.skor"))}</th></tr></thead><tbody>${pn}</tbody></table>` : `<p>${esc(t("iv.p.kosong"))}</p>`}
    <h2>${esc(t("iv.l.risiko"))}</h2><p>${esc(rk)}${b.isu.length ? " " + esc(b.isu.map((i) => i.teks).join(" ")) : ""}</p>
    <h2>${esc(t("iv.l.izin"))}</h2><p>${esc(t("pj.st." + b.status))}; ${esc(t("iv.z.prov"))}: ${esc(b.izin.prov_skor == null ? "-" : N(b.izin.prov_skor) + "/100")}${b.cod ? "; " + esc(t("iv.z.cod")) + ": " + esc(String(b.cod)) : ""}</p>
    <footer class="iv-cp-kaki"><p>${esc(t("iv.cetak.sumber", { tgl: D.dibangun_pada }))} ${D.sumber.map((s) => esc(s.berkas)).join(", ")}.</p><p>${esc(t("iv.cetak.dari", { url: location.origin + "/investasi#" + b.id }))}</p></footer>`;
}

/* ---------- banding 2-3 proyek ---------- */
export function bandingHtml(list, ctx) {
  const unggul = (f, arah) => { const v = list.map(f).filter((x) => x != null); if (v.length < 2) return () => false; const e = arah > 0 ? Math.max(...v) : Math.min(...v); return (x) => x != null && x === e; };
  const uS = unggul((b) => b.skor, 1), uI = unggul((b) => b.model.irr, 1), uL = unggul((b) => b.model.lcoe, -1), uR = unggul((b) => b.risiko?.skor, -1);
  const sel = (isi, menang) => `<td${menang ? ' class="iv-unggul"' : ""}>${isi}</td>`;
  const baris = (k, f, menang = () => false) => `<tr><th scope="row">${esc(t(k))}</th>${list.map((b) => sel(f(b), menang(b))).join("")}</tr>`;
  const mdl = (b, f) => (b.model.galat ? '<span class="iv-redup">-</span>' : f(b.model));
  const pnTop = (b) => (b.pendana.length ? `<ol class="iv-bd-pn">${b.pendana.slice(0, 3).map((p) => `<li>${esc(ctx.pn.get(p.i).nama)}</li>`).join("")}</ol>` : '<span class="iv-redup">-</span>');
  const kepala = list.map((b) => `<th scope="col"><span class="iv-bd-tek">${pilTek(b.tek)}</span><b>${esc(b.nama)}</b><button type="button" class="iv-bd-lepas" data-banding="${esc(b.id)}" aria-label="${esc(t("iv.b.lepas", { nama: b.nama }))}">${ikon("silang", 14)}</button></th>`).join("");
  return `<header class="iv-lh iv-lh-bd"><div class="iv-lh-bar"><button type="button" class="iv-x" data-tutup aria-label="${esc(t("jm.tutup"))}">${ikon("silang", 18)}</button></div>
    <div class="iv-lh-isi"><div class="iv-lh-teks"><p class="iv-lh-pil">${hipPil()}</p><h2 id="ivDlgJ">${esc(t("iv.b.judul"))}</h2><p class="iv-lh-meta"><span>${esc(t("iv.b.lead"))}</span></p></div></div></header>
    <div class="iv-lb"><div class="jm-gulir"><table class="jm-tabel jm-tabel-tetap iv-bd" data-urut="tidak"><thead><tr><th scope="col">${esc(t("iv.b.baris"))}</th>${kepala}</tr></thead><tbody>
    ${baris("iv.c.kap", (b) => `<b>${esc(N(b.mw, b.mw < 100 ? 1 : 0))}</b> MW <small>${esc(t("iv.uk." + b.ukuran))}</small>`)}
    ${baris("iv.c.lokasi", (b) => `<span class="iv-sel">${lokasiHtml(b)}</span>`)}
    ${baris("iv.c.pemilik", (b) => `<span class="iv-sel">${pemilikHtml(b)}</span>`)}
    ${baris("iv.c.tahap", pilTahap)}
    ${baris("iv.c.skor", (b) => `<span class="iv-sel">${skorHtml(b)}${pilTingkat(b.skor)}</span>`, uS)}
    ${KOMP.map((k) => baris("iv.kp." + k, (b) => nilaiPil(b.k[k]))).join("")}
    ${baris("iv.m.irr", (b) => mdl(b, (m) => esc(pct(m.irr))), (b) => !b.model.galat && uI(b.model.irr))}
    ${baris("iv.m.lcoe", (b) => mdl(b, (m) => esc(rpkwh(m.lcoe))), (b) => !b.model.galat && uL(b.model.lcoe))}
    ${baris("iv.m.dana", (b) => mdl(b, (m) => esc(usd(m.capex_usd_juta))))}
    ${baris("iv.m.balik", (b) => mdl(b, (m) => esc(tahun(m.balik))))}
    ${baris("iv.l.risiko", (b) => (b.risiko ? pilTitik(N(b.risiko.skor), "iv-nl-" + (b.risiko.skor >= 45 ? "r" : b.risiko.skor >= 25 ? "s" : "t")) : '<span class="iv-redup">-</span>'), (b) => b.risiko && uR(b.risiko.skor))}
    ${baris("iv.z.prov", (b) => (b.izin.prov_skor == null ? '<span class="iv-redup">-</span>' : esc(N(b.izin.prov_skor))))}
    ${baris("iv.l.pendana", pnTop)}
    <tr><th scope="row"><span class="sr">${esc(t("iv.c.lembar"))}</span></th>${list.map((b) => `<td><button type="button" class="jm-tbl" data-lembar="${esc(b.id)}">${ikon("tabel", 16)}<span>${esc(t("iv.c.lembar"))}</span></button></td>`).join("")}</tr>
    </tbody></table></div><p class="iv-cat">${esc(t("iv.b.catatan"))} ${esc(t("iv.penafian.j"))}</p></div>`;
}
