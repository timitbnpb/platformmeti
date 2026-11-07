/* /karbon: registri karbon Indonesia terpadu (Verra, Gold Standard, IDXCarbon + SRN PPI, Plan Vivo), kredit per tahun per sektor, pasar karbon energi,
   daya saing EBT lawan PLTU (rumus terbuka, EST), hukum NEK. Data: /data/karbon_registri.json dan /data/karbon_pasar.json (scripts/pipa/karbon_registri.mjs).
   Tooltip grafik: inti/tip_grafik.js (path/rect bertanda data-tip di dalam svg.jm-gx). Tinggi/lebar lewat atribut SVG; tanpa gaya inline (CSP). */
import { mulaiHalaman } from "/inti/kepala.js";
import { khUbin } from "/inti/kh.js";
import { tabHalaman } from "/inti/tab_halaman.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon, nanti, debounce, kosongHtml, galatHtml } from "/inti/umum.js";
import { cariHtml, pilihHtml, hapusHtml, exHtml, sumberHtml, unduhRegHtml } from "/inti/komponen.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { batangHtml, pasangBar, pil as pilAn } from "/analisis.js";
import { logoOrg } from "/inti/logo_org.js";
import { kodeProv, singkatProv } from "/inti/prov_singkat.js";
import "/inti/tip_grafik.js";

const HAL = 20;
const SEKTOR = ["energi-terbarukan", "efisiensi", "redd", "mangrove", "gambut", "agroforestri", "limbah", "lain"];
/* ikon sektor: bentuk berbeda per sektor (bukan satu ikon untuk semua) */
const IK_SEKTOR = {
  "energi-terbarukan": '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  efisiensi: '<path d="M4 18a8 8 0 1 1 16 0M12 18l4-6"/><circle cx="12" cy="18" r="1"/>',
  redd: '<path d="M12 3 6 12h3l-4 6h14l-4-6h3z"/><path d="M12 18v3"/>',
  mangrove: '<path d="M3 15c3 0 3-2 6-2s3 2 6 2 3-2 6-2M3 20c3 0 3-2 6-2s3 2 6 2 3-2 6-2M12 4v6M9 7l3 3 3-3"/>',
  gambut: '<path d="M3 8h18M3 13h18M3 18h18"/><path d="M8 4l-2 4M14 4l-2 4"/>',
  agroforestri: '<path d="M12 21V11M12 11C12 7 9 5 5 5c0 4 3 6 7 6zM12 14c0-3 3-5 7-5 0 3-3 5-7 5z"/>',
  limbah: '<path d="M7 7h10l-1 13H8zM5 7h14M10 7V4h4v3"/>',
  lain: '<circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/>',
};
const svgIk = (d) => `<svg class="jm-ikt jm-ikt-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const pilSektor = (k) => `<span class="jm-pil-tek kb-sek kb-s-${esc(k)}">${svgIk(IK_SEKTOR[k] || IK_SEKTOR.lain)}<span>${esc(t("kb2.s." + k))}</span></span>`;
const TONE_ST = { terdaftar: "ok", tersertifikasi: "ok", desain_tersertifikasi: "ok", tercatat_bursa: "ok", terdaftar_terlambat_verifikasi: "warn", validasi: "info", pengajuan_registrasi: "info", dicantumkan: "info", pipa_pengembangan: "warn", ditarik: "bad", nonaktif: "bad", lainnya: "info" };
const pilStatus = (s) => `<span class="jm-pil-st kb-st-${TONE_ST[s] || "info"}">${svgIk(s === "ditarik" || s === "nonaktif" ? '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>' : TONE_ST[s] === "ok" ? '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>' : '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>')}<span>${esc(t("kb2.st." + (TONE_ST[s] ? s : "lainnya")))}</span></span>`;
const REG_KELAS = (n) => (/^Verra/.test(n) ? "verra" : /^Gold/.test(n) ? "gs" : /^IDX/.test(n) ? "idx" : /^SRN/.test(n) ? "srn" : "pv");
const lencanaReg = (r) => `<a class="kb-reg kb-r-${REG_KELAS(r.nama)}" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" title="${esc(r.nama + " " + r.id)}">${esc(r.nama.replace(" (SPE-GRK)", ""))}</a>`;
const strip = () => `<span class="jm-strip" title="${esc(t("jm.belum"))}">-</span>`;
const redup = () => `<span class="jm-redup" title="${esc(t("jm.belum"))}">-</span>`;
const nilai = (n) => (n == null ? redup() : esc(angka(n)));
const ringkas = (n) => (n >= 1e6 ? `${angka(n / 1e6, { desimal: 1 })} ${t("kb2.juta")}` : angka(n));
const jutaAngka = (n) => (n >= 1e6 ? angka(n / 1e6, { desimal: 1 }) : angka(n));
const jutaSatuan = (n) => (n >= 1e6 ? t("kb2.u.jt") : t("kb2.u.t"));
const muatJson = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(u); return r.json(); });
const httpOk = (u) => /^https?:\/\//i.test(String(u || ""));

let R, P; // registri, pasar
const S = { q: "", sektor: "", registri: "", status: "", hal: 1, uk: "terbit", ua: -1, seri: "terbit", pasar: "harga" };
const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/* ---------- registri terpadu ---------- */
const regNama = (r) => r.registri.map((x) => x.nama);
const saring = () => {
  const q = norm(S.q.trim());
  return R.baris.filter((r) => (!S.sektor || r.sektor === S.sektor) && (!S.status || r.status === S.status) && (!S.registri || regNama(r).some((n) => n.startsWith(S.registri)))
    && (!q || r._cari.includes(q)));
};
const KUNCI = { nama: (r) => r.nama, sektor: (r) => t("kb2.s." + r.sektor), registri: (r) => r.registri[0].nama, pengembang: (r) => r.pengembang || "", prov: (r) => r.lokasi.provinsi || "", status: (r) => t("kb2.st." + r.status), terbit: (r) => r.kredit.diterbitkan ?? -1, pensiun: (r) => r.kredit.dipensiunkan ?? -1 };
function urutkan(rows) {
  const f = KUNCI[S.uk]; if (!f) return rows;
  return [...rows].sort((a, b) => { const x = f(a), y = f(b); return (typeof x === "number" ? x - y : String(x).localeCompare(String(y), "id", { numeric: true })) * S.ua; });
}
const lambangProv = (p) => { const k = p && kodeProv(p); return k ? `<span class="kb-prov"><img src="/img/provinsi/${esc(k)}.png" width="22" height="22" alt="" loading="lazy" decoding="async" data-galat="hapus"><span>${esc(singkatProv(k) || p)}</span></span>` : p ? `<span class="kb-prov">${ikon("lokasi", 16)}<span>${esc(p)}</span></span>` : redup(); };
function pengembangHtml(r) {
  if (!r.pengembang) return redup();
  const o = r.pengembang_org, logo = o ? logoOrg(o.id, o.nama)[0] : "";
  const ikonOrg = `<span class="kb-logo kb-logo-ik">${ikon("gedung", 16)}${logo ? `<img class="kb-logo-img" src="${esc(logo)}" width="24" height="24" alt="" loading="lazy" decoding="async" data-galat="hapus">` : ""}</span>`;
  const nama = o ? `<a href="/o/${esc(o.id)}" title="${esc(r.pengembang)}">${esc(r.pengembang)}</a>` : `<span title="${esc(r.pengembang)}">${esc(r.pengembang)}</span>`;
  return `<span class="kb-dev">${ikonOrg}${nama}</span>`;
}
function barisHtml(r, i) {
  const no = (S.hal - 1) * HAL + i + 1;
  const sub = [r.lokasi.provinsi, r.metodologi].filter(Boolean).join(" | ");
  return `<tr><td class="jm-no" data-label="${esc(t("kb2.c.no"))}"><span class="jm-rank${no <= 3 && S.uk === "terbit" && S.ua < 0 ? " jm-rank-top" : ""}">${no}</span></td>
    <td class="jm-id-sel" data-label="${esc(t("kb2.c.proyek"))}"><span class="jm-id"><span><button type="button" data-id="${esc(r.id)}"><b>${esc(r.nama)}</b></button><small title="${esc(sub)}">${esc(sub)}</small></span></span></td>
    <td class="jm-tengah" data-label="${esc(t("kb2.c.sektor"))}">${pilSektor(r.sektor)}</td>
    <td class="jm-tengah" data-label="${esc(t("kb2.c.registri"))}"><span class="kb-regs">${r.registri.map(lencanaReg).join("")}</span></td>
    <td data-label="${esc(t("kb2.c.pengembang"))}">${pengembangHtml(r)}</td>
    <td class="jm-tengah" data-label="${esc(t("kb2.c.prov"))}">${lambangProv(r.lokasi.provinsi)}</td>
    <td class="jm-tengah" data-label="${esc(t("kb2.c.status"))}">${pilStatus(r.status)}</td>
    <td class="jm-num" data-label="${esc(t("kb2.c.terbit"))}">${nilai(r.kredit.diterbitkan)}</td>
    <td class="jm-num" data-label="${esc(t("kb2.c.pensiun"))}">${nilai(r.kredit.dipensiunkan)}</td></tr>`;
}
const th = (k, kelas, uk) => `<th class="${kelas}" aria-sort="${S.uk === uk ? (S.ua > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-uk="${uk}">${esc(t(k))}</button></th>`;
function gambarTabel() {
  const rows = saring(), maks = Math.max(1, Math.ceil(rows.length / HAL)); S.hal = Math.min(S.hal, maks);
  const potong = urutkan(rows).slice((S.hal - 1) * HAL, S.hal * HAL);
  document.getElementById("kbCount").textContent = t("kb2.hitung", { n: angka(rows.length), total: angka(R.baris.length) });
  document.getElementById("kbHapus").hidden = !(S.q || S.sektor || S.registri || S.status);
  document.getElementById("kbIsi").innerHTML = potong.length
    ? `<div class="jm-gulir"><table class="jm-tabel jm-tabel-tetap kb-tabel" data-urut="tidak"><thead><tr>${`<th class="jm-no">${esc(t("kb2.c.no"))}</th>`}${th("kb2.c.proyek", "", "nama")}${th("kb2.c.sektor", "jm-tengah", "sektor")}${th("kb2.c.registri", "jm-tengah", "registri")}${th("kb2.c.pengembang", "", "pengembang")}${th("kb2.c.prov", "jm-tengah", "prov")}${th("kb2.c.status", "jm-tengah", "status")}${th("kb2.c.terbit", "jm-num", "terbit")}${th("kb2.c.pensiun", "jm-num", "pensiun")}</tr></thead><tbody>${potong.map(barisHtml).join("")}</tbody></table></div>`
    : kosongHtml("kb2.kosong", { data: "reset", kunci: "jm.kosong.reset" });
  document.getElementById("kbHal").innerHTML = paginasiHtml({ hal: S.hal, total: rows.length, per: HAL, satuan: "jm.pag.u.proyek" });
}
function gambarSaring() {
  const hitung = (f) => R.baris.reduce((m, r) => (f(r).forEach((k) => m.set(k, (m.get(k) || 0) + 1)), m), new Map());
  const pilih = (id, ik, semua, daftar) => pilihHtml({ id, ikon: ik, label: t(semua), opsi: [["", t(semua)], ...daftar], nilai: S[id.replace("kbF", "").toLowerCase()] });
  const sek = hitung((r) => [r.sektor]), reg = hitung((r) => [...new Set(regNama(r).map((n) => n.replace(" (SPE-GRK)", "").replace(/ VCS$/, "")))]), st = hitung((r) => [r.status]);
  document.getElementById("kbSaring").innerHTML = cariHtml({ id: "kbQ", label: t("kb2.cari") })
    + pilih("kbFSektor", "topik", "kb2.f.sektor", SEKTOR.filter((k) => sek.has(k)).map((k) => [k, t("kb2.s." + k), "karbon", sek.get(k)]))
    + pilih("kbFRegistri", "buku", "kb2.f.registri", [...reg].map(([k, n]) => [k, k, "daftar2", n]))
    + pilih("kbFStatus", "status", "kb2.f.status", [...st].map(([k, n]) => [k, t("kb2.st." + (TONE_ST[k] ? k : "lainnya")), TONE_ST[k] === "ok" ? "centang" : TONE_ST[k] === "bad" ? "silang" : "jam", n]))
    + hapusHtml({ id: "kbHapus", label: t("jm.kosong.reset") }) + `<span class="jm-hitung" id="kbCount" role="status" aria-live="polite"></span>`;
  document.getElementById("kbQ").value = S.q;
}
function antreanHtml() {
  const a = R.meta.antrean_tinjau; if (!a.length) return "";
  return exHtml({ id: "ex-antrean", ikon: "tanya", topik: t("kb2.antrean.ey"), judulHtml: hlHtml("kb2.antrean.j", angka(a.length)), subHtml: esc(t("kb2.antrean.sub")),
    isiHtml: `<ul class="kb-antrean">${a.map((x) => `<li><span class="jm-pil jm-pil-warn">${esc(t("kb2.antrean.skor", { n: angka(x.skor, { desimal: 2 }) }))}</span><span><b>${esc(x.nama_a)}</b> <small>${esc(x.a)}</small></span><span><b>${esc(x.nama_b)}</b> <small>${esc(x.b)}</small></span></li>`).join("")}</ul>` });
}
function bukaRincian(id) {
  const r = R.baris.find((x) => x.id === id), dlg = document.getElementById("lembar"); if (!r) return;
  const dd = (k, v) => (v ? `<div><dt>${esc(t(k))}</dt><dd>${v}</dd></div>` : "");
  const per = Object.entries(r.kredit.per_tahun || {});
  const lokasi = [r.lokasi.kabupaten, r.lokasi.provinsi].filter(Boolean).join(", ") || r.lokasi.teks_asal;
  const periode = r.periode_kredit.mulai || r.periode_kredit.akhir ? `${r.periode_kredit.mulai ? esc(String(r.periode_kredit.mulai).length > 4 ? tanggal(r.periode_kredit.mulai) : r.periode_kredit.mulai) : "-"} - ${r.periode_kredit.akhir ? esc(tanggal(r.periode_kredit.akhir)) : "-"}` : "";
  dlg.innerHTML = `<div class="jm-lembar-isi"><div class="jm-rgh"><div class="jm-rgh-isi"><p class="jm-baris-no">${esc(r.registri.map((x) => x.id).join(" | "))}</p><h2 id="lembar-j">${esc(r.nama)}</h2>
    <div class="jm-baris-meta">${pilSektor(r.sektor)}${pilStatus(r.status)}</div></div>
    <div class="jm-rgh-aksi"><button type="button" class="iconbtn" data-aksi="tutup" aria-label="${esc(t("kb2.m.tutup"))}">${ikon("tutup", 22)}</button></div></div>
    <div class="jm-rgb"><div class="jm-rgb-kiri">
      ${r.catatan_gabung ? `<p class="jm-bantu">${esc(t("kb2.m.gabung"))}</p>` : ""}
      <section><h3>${ikon("grafik", 18)}${esc(t("kb2.m.tahunan"))}</h3>${per.length ? `<table class="jm-tabel kb-mini" data-urut="tidak"><thead><tr><th>${esc(t("kb2.m.tahun"))}</th><th class="jm-num">${esc(t("kb2.c.terbit"))}</th><th class="jm-num">${esc(t("kb2.c.pensiun"))}</th></tr></thead><tbody>${per.map(([y, v]) => `<tr><td>${esc(y)}</td><td class="jm-num">${esc(angka(v.t))}</td><td class="jm-num">${esc(angka(v.p))}</td></tr>`).join("")}</tbody></table>` : r.kredit.tercatat_bursa != null ? `<p>${esc(t("kb2.m.tercatat"))}: <b>${esc(angka(r.kredit.tercatat_bursa))}</b> tCO2e</p>` : `<p>${strip()}</p>`}</section>
      <p class="jm-rg-diambil">${ikon("kalender", 14)} ${esc(t("kb2.m.diambil"))} ${esc(tanggal(r.tanggal))}</p></div>
    <aside class="jm-rgb-kanan"><section class="jm-fakta"><h3>${ikon("info", 18)}${esc(t("kb2.m.fakta"))}</h3><dl class="jm-dl">
      ${dd("kb2.m.registri", r.registri.map(lencanaReg).join(" "))}${dd("kb2.c.pengembang", r.pengembang ? (r.pengembang_org ? `<a href="/o/${esc(r.pengembang_org.id)}">${esc(r.pengembang)}</a>` : esc(r.pengembang)) : "")}
      ${dd("kb2.m.metodologi", esc(r.metodologi || ""))}${dd("kb2.m.validator", esc(r.validator || ""))}${dd("kb2.m.verifikator", esc(r.verifikator || ""))}${dd("kb2.m.lokasi", esc(lokasi || ""))}
      ${dd("kb2.m.periode", periode)}${dd("kb2.m.registrasi", r.tanggal_registrasi ? esc(tanggal(r.tanggal_registrasi)) : "")}${dd("kb2.m.taksiran", r.kredit.taksiran_tahunan ? `${esc(angka(r.kredit.taksiran_tahunan))} tCO2e` : "")}
      ${dd("kb2.m.kapasitas", r.kapasitas_mw ? `${esc(angka(r.kapasitas_mw))} MW` : "")}${dd("kb2.m.otorisasi", esc(r.otorisasi || t("kb2.m.tdk_otorisasi")))}${dd("kb2.m.label", esc((r.label || []).join(", ")))}</dl>
      <p>${r.registri.filter((x) => httpOk(x.url)).map((x) => `<a class="jm-tbl" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}${esc(t("kb2.m.buka"))} ${esc(x.nama)}</a>`).join(" ")}</p></section></aside></div></div>`;
  if (!dlg.open) dlg.showModal(); dlg.scrollTop = 0;
}
function panelRegistri() {
  const el = document.getElementById("panelRegistri");
  el.innerHTML = exHtml({ id: "ex-reg", ikon: "tabel", topik: t("kb2.reg.ey"), judulHtml: hlHtml("kb2.reg.j", angka(R.jumlah)), subHtml: esc(t("kb2.reg.sub")), aksiHtml: aksiHtml({ csv: true }) + sumberHtml(esc(t("kb2.sumber.registri", { tanggal: tanggal(R.dibangun_pada) }))),
    isiHtml: `<div class="jm-saring" id="kbSaring"></div><div id="kbIsi"></div><div class="jm-hal" id="kbHal"></div>` }) + antreanHtml();
  gambarSaring(); gambarTabel();
  const tunda = debounce(() => { S.hal = 1; gambarTabel(); }, 160);
  const ex = document.getElementById("ex-reg");
  ex.addEventListener("input", (e) => { if (e.target.id === "kbQ") { S.q = e.target.value; tunda(); } });
  ex.addEventListener("change", (e) => { const k = { kbFSektor: "sektor", kbFRegistri: "registri", kbFStatus: "status" }[e.target.id]; if (k) { S[k] = e.target.value; S.hal = 1; nanti(gambarTabel); document.getElementById("kbHapus").hidden = false; } });
  ex.addEventListener("click", (e) => {
    const ub = e.target.closest("button[data-uk]"); if (ub) { const k = ub.dataset.uk; S.ua = S.uk === k ? -S.ua : (typeof KUNCI[k]({ ...R.baris[0] }) === "number" ? -1 : 1); S.uk = k; S.hal = 1; nanti(gambarTabel); return; }
    const hp = e.target.closest("[data-hal]"); if (hp) { if (hp.disabled) return; S.hal = +hp.dataset.hal; sorotHalaman(hp, S.hal); nanti(() => { gambarTabel(); document.getElementById("kbSaring").scrollIntoView({ block: "start" }); }); return; }
    if (e.target.closest("#kbHapus,[data-aksi=reset]")) { Object.assign(S, { q: "", sektor: "", registri: "", status: "", hal: 1 }); gambarSaring(); gambarTabel(); return; }
    const b = e.target.closest("button[data-id]"); if (b) bukaRincian(b.dataset.id);
  });
  ex.addEventListener("jm:csv", (e) => { const rows = urutkan(saring()); e.detail.baris = [["id", t("kb2.c.proyek"), t("kb2.c.sektor"), t("kb2.c.registri"), t("kb2.c.pengembang"), t("kb2.c.prov"), t("kb2.c.status"), t("kb2.c.terbit"), t("kb2.c.pensiun")], ...rows.map((r) => [r.id, r.nama, t("kb2.s." + r.sektor), r.registri.map((x) => x.nama + " " + x.id).join(" | "), r.pengembang, r.lokasi.provinsi, t("kb2.st." + r.status), r.kredit.diterbitkan, r.kredit.dipensiunkan])]; });
  const dlg = document.getElementById("lembar");
  dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest("[data-aksi=tutup]")) dlg.close(); });
}

/* ---------- grafik kolom SVG (bertumpuk atau satu deret); tooltip lewat data-tip ---------- */
function kolomSvg(wadah, { label, labels, tumpuk, tip, fmt = angka, ref = null }) {
  const W = Math.max(wadah.clientWidth || 640, 320), M = { a: 14, k: 84, b: 30, r: 10 }, H = 280, n = labels.length, lebarMin = n * 30 + M.k + M.r, Wt = Math.max(W, lebarMin);
  const tot = labels.map((_, i) => tumpuk.reduce((s, d) => s + (d.vals[i] || 0), 0)), mx0 = Math.max(1, ...tot, ref || 0), mag = 10 ** Math.floor(Math.log10(mx0)), lang = [1, 2, 2.5, 5, 10].find((k) => k * mag * 4 >= mx0) * mag, mx = lang * 4;
  const pw = Wt - M.k - M.r, ph = H - M.a - M.b, sl = pw / n, bw = Math.min(46, sl * 0.68), y = (v) => M.a + ph - (v / mx) * ph;
  let g = "";
  for (let k = 0; k <= 4; k++) g += `<line class="kb-grid" x1="${M.k}" x2="${Wt - M.r}" y1="${y(k * lang)}" y2="${y(k * lang)}"/><text class="kb-t" x="${M.k - 8}" y="${y(k * lang) + 4}" text-anchor="end">${esc(fmt(k * lang))}</text>`;
  if (ref && ref <= mx) g += `<line class="kb-ref" x1="${M.k}" x2="${Wt - M.r}" y1="${y(ref)}" y2="${y(ref)}"/>`;
  labels.forEach((lb, i) => {
    const x = M.k + sl * i + (sl - bw) / 2; let alas = M.a + ph;
    if (!tot[i]) g += `<path class="kb-nol" d="M${x} ${alas - 2}h${bw}v2h${-bw}z" data-tip="${esc(tip(i, null, 0, 0))}"/>`;
    for (const d of tumpuk) { const v = d.vals[i] || 0; if (!v) continue; const h = (v / mx) * ph; alas -= h; g += `<path class="kb-seg ${d.kelas}" d="M${x} ${alas}h${bw}v${h}h${-bw}z" data-tip="${esc(tip(i, d, v, tot[i]))}"/>`; }
    g += `<text class="kb-t" x="${x + bw / 2}" y="${H - 9}" text-anchor="middle">${esc(lb)}</text>`;
  });
  wadah.innerHTML = `<div class="kb-gulir"><svg class="jm-gx kb-svg" width="${Wt}" height="${H}" viewBox="0 0 ${Wt} ${H}" role="img" aria-label="${esc(label)}">${g}</svg></div>`;
}
const legenda = (ks) => `<ul class="kb-leg">${ks.map((k) => `<li>${pilSektor(k)}</li>`).join("")}</ul>`;

/* ---------- kredit per tahun per sektor ---------- */
function dataTahun(seri) {
  const m = new Map();
  for (const r of R.baris) for (const [y, v] of Object.entries(r.kredit.per_tahun || {})) { const d = m.get(y) || m.set(y, {}).get(y); d[r.sektor] = (d[r.sektor] || 0) + (seri === "terbit" ? v.t : v.p); }
  return m;
}
function gambarKredit() {
  const m = dataTahun(S.seri), tahun = [...m.keys()].sort(), wad = document.getElementById("kbGr"); if (!wad) return;
  const sek = SEKTOR.filter((k) => tahun.some((y) => m.get(y)[k] > 0));
  const tot = tahun.map((y) => Object.values(m.get(y)).reduce((a, b) => a + b, 0)), jumlah = tot.reduce((a, b) => a + b, 0), puncak = tahun[tot.indexOf(Math.max(...tot))];
  const ex = document.getElementById("ex-kredit");
  ex.querySelector(".jm-ex-j").innerHTML = hlHtml("kb2.gr.j." + S.seri, angka(jumlah), { awal: tahun[0], puncak });
  kolomSvg(wad, { label: t("kb2.gr.label"), labels: tahun, tumpuk: sek.map((k) => ({ kelas: "kb-s-" + k, vals: tahun.map((y) => m.get(y)[k] || 0) })),
    tip: (i, d, v, total) => t("kb2.gr.tip", { sektor: t("kb2.s." + d.kelas.slice(5)), tahun: tahun[i], nilai: angka(v), pct: angka((v / total) * 100, { desimal: 1 }) + "%", total: angka(total) }) });
  document.getElementById("kbLeg").innerHTML = legenda(sek);
}
function panelKredit() {
  document.getElementById("panelKredit").innerHTML = exHtml({ id: "ex-kredit", ikon: "grafik", topik: t("kb2.gr.ey"), judulHtml: "", subHtml: esc(t("kb2.gr.sub")), aksiHtml: aksiHtml({ csv: false }) + sumberHtml(esc(t("kb2.sumber.registri", { tanggal: tanggal(R.dibangun_pada) }))),
    isiHtml: `<div class="jm-tab" role="tablist" id="kbSeri" aria-label="${esc(t("kb2.gr.seri"))}">${["terbit", "pensiun"].map((k) => `<button type="button" role="tab" data-seri="${k}" aria-selected="${S.seri === k}">${ikon(k === "terbit" ? "tambah" : "centang", 18)}<span>${esc(t("kb2.gr." + k))}</span></button>`).join("")}</div><div id="kbGr" class="kb-gr"></div><div id="kbLeg"></div>` });
  document.getElementById("kbSeri").addEventListener("click", (e) => { const b = e.target.closest("[data-seri]"); if (!b) return; S.seri = b.dataset.seri; for (const x of e.currentTarget.children) x.setAttribute("aria-selected", String(x === b)); nanti(gambarKredit); });
  gambarKredit();
}

/* ---------- pasar karbon energi ---------- */
const BLN = (p) => blnPendek(p);
const blnPendek = (p) => { const [y, m] = p.split("-"); return `${["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][+m - 1]} ${y.slice(2)}`; };
function gambarPasar() {
  const wad = document.getElementById("kbPs"); if (!wad) return;
  const b = P.idxcarbon.bulanan, f = { harga: (x) => x.harga_rata || 0, volume: (x) => x.volume || 0, nilai: (x) => x.nilai_idr || 0 }[S.pasar];
  kolomSvg(wad, { label: t("kb2.ps.label"), labels: b.map((x) => blnPendek(x.periode)), tumpuk: [{ kelas: "kb-s-seri", vals: b.map(f) }], ref: S.pasar === "harga" ? P.pajak_karbon.tarif_minimum_rp_per_ton : null,
    tip: (i) => (b[i].volume ? t("kb2.ps.tip", { bulan: BLN(b[i].periode), vol: angka(b[i].volume), nil: angka(b[i].nilai_idr), hrg: angka(b[i].harga_rata), fr: angka(b[i].frekuensi) }) : t("kb2.ps.tip0", { bulan: BLN(b[i].periode) })) });
  document.getElementById("kbPsRef").hidden = S.pasar !== "harga";
}
const akhirHarga = () => [...P.idxcarbon.bulanan].reverse().find((x) => x.harga_rata);
function panelPasar() {
  const b = P.idxcarbon.bulanan, ak = akhirHarga(), pj = P.pajak_karbon, pt = P.ptbae_pu, fe = P.faktor_emisi, eb = P.kredit_ebt, el = document.getElementById("panelPasar");
  const bar = (baris, opsi) => batangHtml(baris, opsi);
  const barPt = pt.aktual_est.map((k) => ({ id: k.kelompok, label: t("kb2.pt.k." + k.kelompok), bagian: [{ nilai: k.intensitas_t_per_mwh || 0, kelas: "kb-b-pt" }], teks: `${angka(k.intensitas_t_per_mwh, { desimal: 3 })} t/MWh`,
    sorot: false, tip: t("kb2.pt.tip", { kelompok: t("kb2.pt.k." + k.kelompok), n: angka(k.pltu), mw: angka(k.mw), int: angka(k.intensitas_t_per_mwh, { desimal: 3 }), emisi: angka(k.emisi_tco2e / 1e6, { desimal: 1 }) }) }));
  const grid = fe.grid_est.slice().sort((a, c) => c.intensitas_t_per_mwh - a.intensitas_t_per_mwh), gTop = grid[0];
  const barGrid = grid.slice(0, 8).map((s) => ({ id: s.id, label: s.nama, bagian: [{ nilai: s.intensitas_t_per_mwh, kelas: "kb-b-gr" }], teks: `${angka(s.intensitas_t_per_mwh, { desimal: 2 })} t/MWh`, tip: t("kb2.fe.tip", { sistem: s.nama, int: angka(s.intensitas_t_per_mwh, { desimal: 2 }), tahun: s.tahun, skenario: s.skenario, tabel: s.tabel }) }));
  const bd = (rows, o) => bar(rows.map((r) => ({ ...r, label: r.label })), o);
  const sumber = esc(t("kb2.sumber.pasar", { tanggal: tanggal(P.dibangun_pada) }));
  const pil = pilAn("an.est");
  el.innerHTML = exHtml({ id: "ex-pasar", ikon: "kartu", topik: t("kb2.ps.ey"), judulHtml: hlHtml("kb2.ps.j", `Rp ${angka(ak.harga_rata)}`, { bulan: BLN(ak.periode) }), subHtml: esc(t("kb2.ps.sub")), aksiHtml: aksiHtml({ csv: false }) + sumberHtml(sumber),
    isiHtml: `<div class="jm-tab" role="tablist" id="kbPsTab" aria-label="${esc(t("kb2.gr.seri"))}">${[["harga", "tag"], ["volume", "grafik"], ["nilai", "transaksi"]].map(([k, ik]) => `<button type="button" role="tab" data-ps="${k}" aria-selected="${S.pasar === k}">${ikon(ik, 18)}<span>${esc(t("kb2.ps." + k))}</span></button>`).join("")}</div><div id="kbPs" class="kb-gr"></div><p class="kb-ref-ket" id="kbPsRef"><span class="kb-ref-sw"></span>${esc(t("kb2.ps.ref"))}: Rp ${esc(angka(pj.tarif_minimum_rp_per_ton))} per ton</p>` })
    + `<div class="kb-kol2"><div class="kb-kol">`
    + exHtml({ id: "ex-ptbae", ikon: "perisai", topik: t("kb2.pt.ey"), judulHtml: hlHtml("kb2.pt.j", angka(pt.kategori.length)), subHtml: esc(t("kb2.pt.sub")), aksiHtml: sumberHtml(sumber),
      isiHtml: `<p class="kb-est">${pil}<span>${esc(t("kb2.est.ket"))}</span></p><ol class="kb-fase">${pt.fase.map((f, i) => `<li><b>${esc(t("kb2.pt.fase"))} ${i + 1}</b><span>${esc(t("kb2.pt.f" + (i + 1)))}</span></li>`).join("")}</ol>${bd(barPt, { label: t("kb2.pt.label") })}` })
    + exHtml({ id: "ex-grid", ikon: "petir", topik: t("kb2.fe.ey"), judulHtml: hlHtml("kb2.fe.j", angka(gTop.intensitas_t_per_mwh, { desimal: 2 }), { nama: gTop.nama }), subHtml: esc(t("kb2.fe.sub") + " " + t("kb2.fe.top", { k: angka(8), n: angka(grid.length) })), aksiHtml: sumberHtml(sumber), isiHtml: `<p class="kb-est">${pil}<span>${esc(t("kb2.est.ket"))}</span></p>` + bd(barGrid, { label: t("kb2.fe.label") }) })
    + `</div><div class="kb-kol">`
    + exHtml({ id: "ex-pajak", ikon: "tag", topik: t("kb2.pj.ey"), judulHtml: hlHtml("kb2.pj.j", `Rp ${angka(pj.tarif_minimum_rp_per_kg)}`), subHtml: esc(t("kb2.pj.sub")), aksiHtml: sumberHtml(sumber),
      isiHtml: `<div class="kb-pajak"><div class="kb-pajak-n"><b>Rp ${esc(angka(pj.tarif_minimum_rp_per_ton))}</b><span>${esc(t("kb2.pj.rp_ton", { n: angka(pj.tarif_minimum_rp_per_ton) }))}</span></div><p><span class="jm-pil jm-pil-warn">${esc(t("kb2.pj.status"))}: ${esc(t("kb2.pj.belum"))}</span></p><p>${esc(t("kb2.pj.vs", { x: angka(ak.harga_rata / pj.tarif_minimum_rp_per_ton, { desimal: 1 }) }))}</p>${batangHtml([{ id: "idx", label: t("kb2.pj.b.idx"), bagian: [{ nilai: ak.harga_rata, kelas: "kb-b-gr" }], teks: `Rp ${angka(ak.harga_rata)}` }, { id: "pj", label: t("kb2.pj.b.pajak"), bagian: [{ nilai: pj.tarif_minimum_rp_per_ton, kelas: "kb-b-pt" }], teks: `Rp ${angka(pj.tarif_minimum_rp_per_ton)}` }], { label: t("kb2.pj.b.label") })}<p class="jm-bantu">${esc(pj.dasar)}</p></div>` })
    + exHtml({ id: "ex-ebt", ikon: "tek-surya", topik: t("kb2.eb.ey"), judulHtml: hlHtml("kb2.eb.j", angka(eb.proyek)), subHtml: esc(t("kb2.eb.sub")), aksiHtml: sumberHtml(sumber),
      isiHtml: `<dl class="kb-fakta"><div><dt>${esc(t("kb2.eb.proyek"))}</dt><dd>${esc(angka(eb.proyek))}</dd></div><div><dt>${esc(t("kb2.eb.terbit"))}</dt><dd>${esc(ringkas(eb.diterbitkan))} <small>tCO2e</small></dd></div><div><dt>${esc(t("kb2.eb.pensiun"))}</dt><dd>${esc(ringkas(eb.dipensiunkan))} <small>tCO2e</small></dd></div></dl><div class="kb-wb">${ikon("peringatan", 18)}<div><b>${esc(t("kb2.wb.j"))}</b><p>${esc(t("kb2.wb.isi"))}</p></div></div>` })
    + `</div>`;
  for (const u of el.querySelectorAll(".kb-kol2 .jm-batang")) pasangBar(u.parentElement);
  document.getElementById("kbPsTab").addEventListener("click", (e) => { const x = e.target.closest("[data-ps]"); if (!x) return; S.pasar = x.dataset.ps; for (const y of e.currentTarget.children) y.setAttribute("aria-selected", String(y === x)); nanti(gambarPasar); });
  gambarPasar();
}

/* ---------- daya saing EBT lawan PLTU (EST, rumus terbuka) ---------- */
const FE = () => {
  const pt = P.ptbae_pu.aktual_est.filter((k) => k.intensitas_t_per_mwh && k.kelompok !== "<25");
  return [{ id: "bara", nama: t("kb2.ds.fe.bara"), fe: P.faktor_emisi.pltu_batubara_t_per_mwh }, ...pt.map((k) => ({ id: k.kelompok, nama: t("kb2.ds.fe.k", { k: k.kelompok.replace("mulut-tambang", t("kb2.pt.k.mulut-tambang")) }), fe: k.intensitas_t_per_mwh })), { id: "gas", nama: t("kb2.ds.fe.gas"), fe: P.faktor_emisi.gas_t_per_mwh }, { id: "ebt", nama: t("kb2.ds.fe.ebt"), fe: 0 }];
};
const D = { harga: 0, selisih: 150 };
function hitungSaing() {
  const f = FE(), tambah = (fe) => (fe * D.harga) / 1000, bara = f[0];
  const baris = f.map((x) => ({ id: x.id, label: x.nama, bagian: [{ nilai: tambah(x.fe), kelas: x.id === "ebt" ? "kb-b-ebt" : "kb-b-pt" }], teks: `Rp ${angka(tambah(x.fe), { desimal: 1 })}/kWh`, tip: t("kb2.ds.tip", { nama: x.nama, fe: angka(x.fe, { desimal: 3 }), tambah: angka(tambah(x.fe), { desimal: 1 }) }) }));
  document.getElementById("kbDsBar").innerHTML = batangHtml(baris, { label: t("kb2.ds.label"), maks: Math.max(10, ...f.map((x) => tambah(x.fe))) * 1.12 }); pasangBar(document.getElementById("kbDsBar"));
  const impas = (D.selisih * 1000) / bara.fe, ok = tambah(bara.fe) >= D.selisih;
  document.getElementById("kbHargaV").textContent = `Rp ${angka(D.harga)}`; document.getElementById("kbSelisihV").textContent = `Rp ${angka(D.selisih)}`;
  document.getElementById("kbImpas").textContent = t("kb2.ds.impas_v", { n: angka(Math.round(impas)) });
  const k = document.getElementById("kbImpasK"); k.textContent = ok ? t("kb2.ds.sudah") : t("kb2.ds.belum", { n: angka(D.selisih - tambah(bara.fe), { desimal: 1 }) }); k.className = "jm-pil " + (ok ? "jm-pil-ok" : "jm-pil-warn");
  document.getElementById("ex-saing").querySelector(".jm-ex-j").innerHTML = hlHtml("kb2.ds.j", angka(D.harga), { tambah: angka(tambah(bara.fe), { desimal: 1 }) });
}
function panelSaing() {
  const ak = akhirHarga(), pj = P.pajak_karbon.tarif_minimum_rp_per_ton; D.harga = Math.round(ak.harga_rata / 5000) * 5000;
  const acuan = [["pajak", pj, "tag"], ["idx", D.harga, "kartu"], ["nol", 0, "silang"]];
  document.getElementById("panelSaing").innerHTML = exHtml({ id: "ex-saing", ikon: "kalkulator", topik: t("kb2.ds.ey"), judulHtml: "", subHtml: esc(t("kb2.ds.sub")), aksiHtml: aksiHtml({ csv: false }) + sumberHtml(esc(t("kb2.sumber.pasar", { tanggal: tanggal(P.dibangun_pada) }))),
    isiHtml: `<p class="kb-est">${pilAn("an.est")}<span>${esc(t("kb2.est.ket"))}</span></p><div class="kb-ds"><div class="kb-ds-in">
      <label class="kb-rng"><span>${esc(t("kb2.ds.harga"))}</span><output id="kbHargaV"></output><input id="kbHarga" type="range" min="0" max="1000000" step="5000" value="${D.harga}"></label>
      <label class="kb-rng"><span>${esc(t("kb2.ds.selisih"))}</span><output id="kbSelisihV"></output><input id="kbSelisih" type="range" min="0" max="1000" step="10" value="${D.selisih}"></label>
      <div class="jm-tab" role="group" aria-label="${esc(t("kb2.ds.acuan"))}">${acuan.map(([k, v, ik]) => `<button type="button" data-harga="${v}">${ikon(ik, 18)}<span>${esc(t("kb2.ds.a." + k))}</span></button>`).join("")}</div>
      <div class="kb-impas"><span>${esc(t("kb2.ds.impas"))}</span><b id="kbImpas"></b><span id="kbImpasK"></span></div></div>
      <div id="kbDsBar" class="kb-ds-bar"></div></div>` });
  const ex = document.getElementById("ex-saing");
  ex.addEventListener("input", (e) => { if (e.target.id === "kbHarga") D.harga = +e.target.value; else if (e.target.id === "kbSelisih") D.selisih = +e.target.value; else return; hitungSaing(); });
  ex.addEventListener("click", (e) => { const b = e.target.closest("[data-harga]"); if (!b) return; D.harga = +b.dataset.harga; document.getElementById("kbHarga").value = D.harga; hitungSaing(); });
  hitungSaing();
}

/* ---------- hukum NEK ---------- */
function panelHukum() {
  const h = P.hukum_nek, sumber = sumberHtml(esc(t("kb2.sumber.hukum")));
  const kartu = (d) => `<li class="kb-hk"><span class="jm-lm-jn">${esc(d.jenis)}</span><b>${esc(`${d.nomor}/${d.tahun}`)}</b><span class="kb-hk-j">${esc(d.judul)}</span><span class="kb-hk-a"><a class="jm-tbl jm-tbl-utama" href="${esc(d.href)}">${ikon("palu", 16)}${esc(t("kb2.hk.baca"))}</a>${unduhRegHtml({ judul: d.judul, url_pdf: d.pdf, url_sumber: d.url })}</span></li>`;
  const reg = h.regulasi.map((d) => `<li class="kb-hk"><span class="jm-lm-jn">${esc("Perpres")}</span><b>${esc("110/2025")}</b><span class="kb-hk-j">${esc(d.judul)}</span><span class="kb-hk-a"><a class="jm-tbl jm-tbl-utama" href="${esc(d.href)}">${ikon("regulasi", 16)}${esc(t("kb2.hk.regulasi"))}</a></span></li>`);
  const n = h.pustaka.length + h.regulasi.length;
  const tautan = (href, ik, j, s) => `<a class="kb-tautan" href="${href}">${ikon(ik, 22)}<span><b>${esc(t(j))}</b><small>${esc(t(s))}</small></span></a>`;
  document.getElementById("panelHukum").innerHTML = exHtml({ id: "ex-hukum", ikon: "palu", topik: t("kb2.hk.ey"), judulHtml: hlHtml("kb2.hk.j", angka(n)), subHtml: esc(t("kb2.hk.sub")), aksiHtml: sumber,
    isiHtml: `<ul class="kb-hk-daftar">${h.pustaka.map(kartu).join("")}${reg.join("")}</ul><div class="kb-tautans">${tautan("/topik?id=karbon", "topik", "kb2.hk.topik", "kb2.hk.topik_s")}${tautan("/regulasi", "regulasi", "kb2.hk.regulasi", "kb2.hk.regulasi_s")}${tautan("/hukum", "palu", "kb2.hk.baca", "kb2.hk.sub")}</div>` });
}

/* ---------- mulai ---------- */
await mulaiHalaman();
try {
  [R, P] = await Promise.all([muatJson("/data/karbon_registri.json"), muatJson("/data/karbon_pasar.json")]);
} catch {
  document.getElementById("panelRegistri").innerHTML = galatHtml("layanan");
  throw new Error("karbon");
}
for (const r of R.baris) r._cari = norm([r.nama, r.pengembang, r.lokasi.provinsi, r.metodologi, ...r.registri.map((x) => x.id)].filter(Boolean).join(" "));
const ak = akhirHarga(), TERBIT = R.baris.reduce((a, r) => a + (r.kredit.diterbitkan || 0), 0), PENSIUN = R.baris.reduce((a, r) => a + (r.kredit.dipensiunkan || 0), 0);
khUbin("khUbin", [
  { ikon: "proyek", nilai: angka(R.jumlah), label: t("kb2.u.proyek") },
  { ikon: "grafik", nilai: jutaAngka(TERBIT), satuan: jutaSatuan(TERBIT), label: t("kb2.u.terbit") },
  { ikon: "centang", nilai: jutaAngka(PENSIUN), satuan: jutaSatuan(PENSIUN), label: t("kb2.u.pensiun") },
  { ikon: "tag", nilai: angka(ak.harga_rata), satuan: t("kb2.u.rp_t"), label: t("kb2.u.harga") },
]);
const sekali = (f) => { let ok = false; return () => (ok ? Promise.resolve() : ((ok = true), Promise.resolve(f()))); };
const muatKredit = sekali(panelKredit), muatPasar = sekali(panelPasar), muatSaing = sekali(panelSaing), muatHukum = sekali(panelHukum);
panelRegistri();
tabHalaman("tabHal", { label: "kb2.tab", tab: [
  { k: "registri", ikon: "tabel", teks: "kb2.tab.registri", panel: "panelRegistri", muat: () => {} },
  { k: "kredit", ikon: "grafik", teks: "kb2.tab.kredit", panel: "panelKredit", muat: muatKredit },
  { k: "pasar", ikon: "kartu", teks: "kb2.tab.pasar", panel: "panelPasar", muat: muatPasar },
  { k: "saing", ikon: "kalkulator", teks: "kb2.tab.saing", panel: "panelSaing", muat: muatSaing },
  { k: "hukum", ikon: "palu", teks: "kb2.tab.hukum", panel: "panelHukum", muat: muatHukum },
] });
addEventListener("resize", debounce(() => { if (!document.getElementById("panelKredit").hidden) gambarKredit(); if (!document.getElementById("panelPasar").hidden) gambarPasar(); }, 200));
