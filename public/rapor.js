/* /rapor: rapor bulanan dan tahunan "Kondisi EBT Indonesia" dari /data/rapor/<periode>.json (scripts/pipa/rapor_bulanan.mjs).
   Empat bagian bernomor (pengembang, pendana, yang berhenti, yang terbuka), grafik kolom SVG, arsip, kutipan, unduh PNG (kanvas) dan cetak PDF.
   Sel kosong "-" bertooltip alasan. Teks layar dari kamus; tabel urut lewat urut global komponen.js. */
import { mulaiHalaman } from "/inti/kepala.js";
import { khUbin } from "/inti/kh.js";
import { t, ada, angka, tanggal, bahasa } from "/i18n.js";
import { esc, ikon, hantuHtml } from "/inti/umum.js";
import { pilihHtml } from "/inti/komponen.js";
import { muatData, tampilGalat, saatBahasa } from "/analisis.js";

const $ = (id) => document.getElementById(id);
const S = { idx: null, r: null, jenis: "bulanan", periode: "" };
const num = (n, d = 0) => angka(n, { desimal: d });

const namaPeriode = (jenis, p) => (jenis === "tahunan" ? p : new Intl.DateTimeFormat(bahasa(), { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(p + "-01T00:00:00Z")));
const namaTek = (k) => (ada("an.tek." + k) ? t("an.tek." + k) : k);
const kosong = (alasanKunci) => `<span class="rp-kosong" title="${esc(t(alasanKunci))}" tabindex="0">-</span>`;
const sel = (label, isi, kelas = "") => `<td data-label="${esc(label)}"${kelas ? ` class="${kelas}"` : ""}>${isi}</td>`;
const tabel = (kolom, baris, kelas = []) => `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>${kolom.map((k) => `<th scope="col">${esc(t(k))}</th>`).join("")}</tr></thead><tbody>${baris.join("") || `<tr><td colspan="${kolom.length}">${kosong("rp.kosong.data")}</td></tr>`}</tbody></table></div>`;
const usd = (n, satuan) => (n == null ? kosong("rp.kosong.nilai") : satuan === "IDR" ? t("rp.idr", { n: num(n / 1e12, 1) }) : t("rp.usd", { n: num(n / 1e6, 0) }));
const selisih = ([a, b]) => (a == null || b == null ? "" : a === b ? t("rp.sama") : t(a > b ? "rp.naik" : "rp.turun", { n: num(Math.abs(a - b), a % 1 || b % 1 ? 1 : 0) }));

function ubinData(r) {
  const u = r.ubin, th = r.jenis === "tahunan", b = r.banding;
  const nilai = (v, alasan) => (v == null ? "-" : num(v, v % 1 ? 1 : 0)) + (v == null && alasan ? "" : "");
  return th
    ? [{ ikon: "proyek", nilai: nilai(u.mw_baru), satuan: "MW", label: t("rp.u.mw") }, { ikon: "centang", nilai: nilai(u.proyek_cod), label: t("rp.u.cod") }, { ikon: "regulasi", nilai: nilai(u.regulasi), label: t("rp.u.reg") }, { ikon: "berita", nilai: nilai(u.berita), label: t("rp.u.berita") }]
    : [{ ikon: "berita", nilai: nilai(u.berita), label: t("rp.u.berita") }, { ikon: "regulasi", nilai: nilai(u.regulasi), label: t("rp.u.reg") }, { ikon: "kompas", nilai: nilai(u.tender), label: t("rp.u.tender") }, { ikon: "grafik", nilai: selisih(b.berita) || "-", label: t("rp.u.banding", { p: namaPeriode("bulanan", b.periode_lalu) }) }];
}

/* ---------- grafik kolom ---------- */
function dataGrafik(r) {
  return r.jenis === "tahunan" && r.kapasitas_baru?.length
    ? { satuan: "MW", judul: t("rp.g.mw"), kol: r.kapasitas_baru.map((g) => ({ label: namaTek(g.teknologi), v: g.mw })) }
    : { satuan: "", judul: t("rp.g.banding"), kol: [{ label: t("rp.u.berita"), v: r.banding.berita[0] }, { label: t("rp.g.lalu_berita"), v: r.banding.berita[1] }, { label: t("rp.u.reg"), v: r.banding.regulasi[0] }, { label: t("rp.g.lalu_reg"), v: r.banding.regulasi[1] }] };
}
function grafikSvg(g) {
  const maks = Math.max(1, ...g.kol.map((k) => k.v)), W = 360, H = 190, dasar = 150, lebar = Math.min(48, (W - 20) / g.kol.length - 10), langkah = (W - 20) / g.kol.length;
  const batang = g.kol.map((k, i) => { const h = Math.max(1, k.v / maks * 120), x = 10 + i * langkah + (langkah - lebar) / 2; return `<rect x="${x}" y="${dasar - h}" width="${lebar}" height="${h}" rx="4" class="rp-b"/><text x="${x + lebar / 2}" y="${dasar - h - 5}" text-anchor="middle" class="rp-bv" font-size="11">${esc(num(k.v, k.v % 1 ? 1 : 0))}</text><text x="${x + lebar / 2}" y="${dasar + 16}" text-anchor="middle" class="rp-bl" font-size="10">${esc(k.label.length > 11 ? k.label.slice(0, 10) + "." : k.label)}</text>`; }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="rp-grafik" role="img" aria-label="${esc(g.judul)}"><line x1="6" x2="${W - 6}" y1="${dasar}" y2="${dasar}" class="rp-sumbu"/>${batang}</svg>`;
}

/* ---------- empat bagian ---------- */
const bagian = (no, judul, lead, isi) => `<section class="rp-bag" aria-labelledby="rpB${no}"><div class="rp-bag-k"><span class="rp-no" aria-hidden="true">${no}</span><div><h2 id="rpB${no}">${esc(judul)}</h2><p class="rp-lead">${esc(lead)}</p></div></div>${isi}</section>`;

function bagian1(b) {
  const p = b.pengembang, baris = p.baris.map((g) => `<tr>${sel(t("rp.k.no"), num(g.peringkat), "rp-n")}${sel(t("rp.k.pengembang"), esc(g.nama))}${sel(t("rp.k.mw"), num(g.mw), "rp-n")}${sel(t("rp.k.proyek"), num(g.proyek), "rp-n")}${sel(t("rp.k.porsi"), g.porsi_persen == null ? kosong("rp.kosong.nilai") : num(g.porsi_persen, 1) + "%", "rp-n")}</tr>`);
  return bagian(1, t("rp.b1.j", { n: num(p.atas), x: num(p.porsi_atas_persen, 1) }), t("rp.b1.l", { n: num(p.proyek_bernama), t: num(p.proyek_ber_mw), mw: num(p.mw_bernama), semua: num(p.mw_semua), h: num(p.jumlah_pengembang) }), tabel(["rp.k.no", "rp.k.pengembang", "rp.k.mw", "rp.k.proyek", "rp.k.porsi"], baris));
}
function bagian2(b) {
  const p = b.pendana, baris = p.baris.map((g) => `<tr>${sel(t("rp.k.no"), num(g.peringkat), "rp-n")}${sel(t("rp.k.pendana"), esc(g.nama))}${sel(t("rp.k.aktivitas"), num(g.proyek), "rp-n")}${sel(t("rp.k.nilai"), g.nilai_usd == null ? kosong("rp.kosong.nilai") : usd(g.nilai_usd, "USD"), "rp-n")}</tr>`);
  return bagian(2, t("rp.b2.j", { n: num(p.satu_saja), h: num(p.jumlah_pendana) }), t("rp.b2.l", { a: num(p.jumlah_aktivitas) }), tabel(["rp.k.no", "rp.k.pendana", "rp.k.aktivitas", "rp.k.nilai"], baris));
}
function bagian3(b) {
  const h = b.berhenti, th = h.per_tahun.map((x) => `<tr>${sel(t("rp.k.tahun"), esc(x.tahun), "rp-n")}${sel(t("rp.k.jumlah"), num(x.jumlah), "rp-n")}</tr>`);
  const pr = h.proyek.map((x) => `<tr>${sel(t("rp.k.proyek1"), esc(x.nama))}${sel(t("rp.k.status"), esc(t("rp.st." + x.status)))}${sel(t("rp.k.mw"), x.mw == null ? kosong("rp.kosong.mw") : num(x.mw, x.mw % 1 ? 1 : 0), "rp-n")}${sel(t("rp.k.tanggal"), x.tanggal ? esc(tanggal(x.tanggal)) : kosong("rp.kosong.tanggal"))}${sel(t("rp.k.label"), x.dilaporkan_media ? `<span class="jm-pil jm-pil-warn">${esc(t("rp.lap_media"))}</span>` : `<span class="jm-pil jm-pil-ok">${esc(t("rp.terkonfirmasi"))}</span>`)}</tr>`);
  const total = h.per_tahun.reduce((n, x) => n + x.jumlah, 0);
  return bagian(3, t("rp.b3.j", { n: num(h.proyek.length), b: num(total) }), t("rp.b3.l"), `<h3 class="rp-sub">${esc(t("rp.b3.th"))}</h3>${tabel(["rp.k.tahun", "rp.k.jumlah"], th)}<h3 class="rp-sub">${esc(t("rp.b3.pr"))}</h3>${tabel(["rp.k.proyek1", "rp.k.status", "rp.k.mw", "rp.k.tanggal", "rp.k.label"], pr)}`);
}
function bagian4(b) {
  const o = b.terbuka, baris = o.baris.map((x) => `<tr>${sel(t("rp.k.proyek1"), esc(x.nama))}${sel(t("rp.k.nilai"), usd(x.nilai, x.satuan), "rp-n")}${sel(t("rp.k.jenis"), `<span class="jm-pil ${x.jenis === "perkiraan" ? "jm-pil-warn" : "jm-pil-ok"}">${esc(t("rp.j." + x.jenis))}</span>`)}${sel(t("rp.k.mw"), x.mw == null ? kosong("rp.kosong.mw") : num(x.mw, x.mw % 1 ? 1 : 0), "rp-n")}</tr>`);
  return bagian(4, t("rp.b4.j", { n: num(o.dengan_nilai), h: num(o.total) }), t("rp.b4.l", { p: num(o.dengan_ppa) }), tabel(["rp.k.proyek1", "rp.k.nilai", "rp.k.jenis", "rp.k.mw"], baris));
}

/* ---------- badan rapor ---------- */
function daftarMini(judulKunci, baris, kosongKunci) {
  return `<div class="rp-kol"><h3 class="rp-sub">${esc(t(judulKunci))}</h3>${baris.length ? `<ul class="rp-daftar">${baris.join("")}</ul>` : `<p class="rp-lead">${kosong(kosongKunci)}</p>`}</div>`;
}
function badanRapor(r) {
  const nama = namaPeriode(r.jenis, r.periode), g = dataGrafik(r), b = r.banding;
  const urlSumber = (u) => (/^https:\/\//.test(u || "") ? u : "");
  const reg = r.regulasi.map((x) => `<li><a href="/regulasi#${esc(x.id)}">${esc(x.judul)}</a><small>${esc(tanggal(x.tanggal))}</small></li>`);
  const ber = r.berita.map((x) => `<li>${urlSumber(x.url) ? `<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.judul)}</a>` : esc(x.judul)}<small>${esc(x.media)}, ${esc(tanggal(x.tanggal))}</small></li>`);
  const tdr = r.tender.map((x) => `<li>${esc(x.judul)}<small>${esc(tanggal(x.tanggal))}${x.mw != null ? ", " + esc(num(x.mw) + " MW") : ""}</small></li>`);
  const kutip = t("rp.kutip.isi", { nama, tgl: tanggal(r.dibekukan), url: `${location.origin}/rapor#${r.periode}` });
  const ubahMw = b.mw_baru ? `<li>${esc(t("rp.banding.mw", { a: num(b.mw_baru[0], 1), b: num(b.mw_baru[1], 1) }))}</li>` : "";
  return `<article class="rp-rapor" id="rpRapor">
    <header class="rp-kop"><h2 class="rp-judul">${esc(t("rp.judul_rapor", { nama }))}</h2><p class="rp-lead">${esc(t(r.jenis === "tahunan" ? "rp.lead_th" : "rp.lead_bl", { nama, tgl: tanggal(r.dibekukan) }))}</p>
    <div class="rp-aksi no-cetak"><button type="button" class="jm-tbl" data-aksi="png">${ikon("gambar", 16)}<span>${esc(t("rp.unduh_png"))}</span></button><button type="button" class="jm-tbl" data-aksi="cetak">${ikon("pdf", 16)}<span>${esc(t("rp.cetak"))}</span></button></div></header>
    <section class="rp-bag rp-ringkas"><div class="rp-kol"><h3 class="rp-sub">${esc(g.judul)}</h3>${r.jenis === "bulanan" ? `<p class="rp-lead">${kosong("rp.kosong.mw_bulan")} ${esc(r.alasan.mw_baru)}</p>` : ""}${grafikSvg(g)}</div>
      <div class="rp-kol"><h3 class="rp-sub">${esc(t("rp.banding"))}</h3><ul class="rp-daftar"><li>${esc(t("rp.banding.berita", { a: num(b.berita[0]), b: num(b.berita[1]), p: namaPeriode(r.jenis, b.periode_lalu) }))}</li><li>${esc(t("rp.banding.reg", { a: num(b.regulasi[0]), b: num(b.regulasi[1]) }))}</li>${ubahMw}</ul></div></section>
    <div class="rp-tiga">${daftarMini("rp.reg_baru", reg, "rp.kosong.data")}${daftarMini("rp.berita_atas", ber, "rp.kosong.data")}${r.jenis === "bulanan" ? daftarMini("rp.tender", tdr, "rp.kosong.data") : ""}</div>
    ${bagian1(r.bagian)}${bagian2(r.bagian)}${bagian3(r.bagian)}${bagian4(r.bagian)}
    <footer class="rp-kaki"><p><b>${esc(t("rp.kutip"))}</b></p><p class="rp-kutip" id="rpKutip">${esc(kutip)}</p><button type="button" class="jm-tbl no-cetak" data-aksi="salin">${ikon("salin", 16)}<span>${esc(t("rp.salin"))}</span></button><p class="rp-lead">${esc(t("rp.beku", { tgl: tanggal(r.dibekukan) }))} ${esc(t("rp.catatan_data", { sejak: r.cakupan.berita_sejak || "-" }))}</p></footer></article>`;
}

/* ---------- PNG lewat kanvas ---------- */
function unduhPng() {
  const r = S.r, nama = namaPeriode(r.jenis, r.periode), W = 1200, H = 760, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d"), gaya = getComputedStyle(document.documentElement), warna = (k, d) => gaya.getPropertyValue(k).trim() || d;
  const brand = warna("--brand", "#122B4A"), ink = warna("--ink", "#18202c"), ink2 = warna("--ink2", "#5b6676"), kartu = warna("--card", "#ffffff");
  x.fillStyle = kartu; x.fillRect(0, 0, W, H); x.fillStyle = brand; x.fillRect(0, 0, W, 14);
  x.fillStyle = ink; x.font = "700 40px Inter, Arial, sans-serif"; x.fillText(t("rp.judul_rapor", { nama }), 48, 80);
  x.fillStyle = ink2; x.font = "400 22px Inter, Arial, sans-serif"; x.fillText(t("rp.beku", { tgl: tanggal(r.dibekukan) }), 48, 118);
  const ub = ubinData(r), lb = (W - 96 - 3 * 20) / 4;
  ub.forEach((u, i) => { const px = 48 + i * (lb + 20); x.fillStyle = warna("--soft-biru", "#eef3fa"); x.beginPath(); x.roundRect(px, 150, lb, 130, 14); x.fill(); x.fillStyle = brand; x.font = "700 44px Inter, Arial, sans-serif"; x.fillText(u.nilai + (u.satuan ? " " + u.satuan : ""), px + 20, 215); x.fillStyle = ink2; x.font = "400 19px Inter, Arial, sans-serif"; x.fillText(u.label.slice(0, 34), px + 20, 255); });
  const g = dataGrafik(r), maks = Math.max(1, ...g.kol.map((k) => k.v)), lebar = Math.min(110, (W - 96) / g.kol.length - 24);
  x.fillStyle = ink; x.font = "700 26px Inter, Arial, sans-serif"; x.fillText(g.judul, 48, 335);
  g.kol.forEach((k, i) => { const h = Math.max(2, k.v / maks * 260), px = 48 + i * ((W - 96) / g.kol.length) + 12; x.fillStyle = brand; x.fillRect(px, 680 - h, lebar, h); x.fillStyle = ink; x.font = "700 20px Inter, Arial, sans-serif"; x.fillText(num(k.v, k.v % 1 ? 1 : 0), px, 670 - h); x.fillStyle = ink2; x.font = "400 18px Inter, Arial, sans-serif"; x.fillText(k.label.slice(0, 14), px, 708); });
  x.fillStyle = ink2; x.font = "400 18px Inter, Arial, sans-serif"; x.fillText(`${t("rp.kutip.isi", { nama, tgl: tanggal(r.dibekukan), url: location.origin + "/rapor" })}`.slice(0, 120), 48, 742);
  c.toBlob((blob) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `rapor-ebt-${r.periode}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }, "image/png");
}

/* ---------- arsip dan pemilih ---------- */
function arsipHtml() {
  const kel = (jenis, daftar) => `<div class="rp-arsip-k"><h3 class="rp-sub">${esc(t("rp.arsip." + jenis))}</h3><ul class="rp-arsip-l">${daftar.map((p) => `<li><a href="#${p}" data-p="${p}" data-j="${jenis}"${S.periode === p ? ' aria-current="page"' : ""}>${esc(namaPeriode(jenis, p))}</a><small>${esc(t("rp.beku_pendek", { tgl: tanggal(S.idx.dibangun_pada) }))}</small></li>`).join("")}</ul></div>`;
  return `<section class="rp-bag rp-arsip no-cetak"><h2 class="rp-arsip-j">${ikon("kalender", 20)}<span>${esc(t("rp.arsip"))}</span></h2><div class="rp-arsip-g">${kel("bulanan", S.idx.bulanan)}${kel("tahunan", S.idx.tahunan)}</div></section>`;
}

async function tampil(jenis, periode) {
  S.jenis = jenis; S.periode = periode;
  const isi = $("isi");
  isi.innerHTML = hantuHtml(6);
  try { S.r = await muatData(`rapor/${periode}.json`); } catch (e) { return tampilGalat(isi, () => tampil(jenis, periode)); }
  khUbin("ubin", ubinData(S.r));
  const daftar = S.idx[jenis];
  isi.innerHTML = `<div class="rp-pilih no-cetak"><div class="rp-seg" role="group" aria-label="${esc(t("rp.jenis"))}"><button type="button" data-j="bulanan" aria-pressed="${jenis === "bulanan"}">${esc(t("rp.bulanan"))}</button><button type="button" data-j="tahunan" aria-pressed="${jenis === "tahunan"}">${esc(t("rp.tahunan"))}</button></div>${pilihHtml({ id: "rpPeriode", ikon: "kalender", label: t("rp.periode"), opsi: daftar.map((p) => [p, namaPeriode(jenis, p)]), nilai: periode })}</div>${badanRapor(S.r)}${arsipHtml()}`;
  document.title = t("rp.judul_rapor", { nama: namaPeriode(jenis, periode) }) + " | Direktori METI";
}

async function mulai() {
  await mulaiHalaman();
  $("isi").innerHTML = hantuHtml(6);
  try { S.idx = await muatData("rapor/indeks.json"); } catch (e) { return tampilGalat($("isi"), mulai); }
  const h = decodeURIComponent(location.hash.slice(1)), jenis = S.idx.tahunan.includes(h) ? "tahunan" : "bulanan";
  await tampil(jenis, S.idx[jenis].includes(h) ? h : S.idx.bulanan[0]);
  $("isi").addEventListener("click", (e) => {
    const b = e.target.closest("button,a[data-p]"); if (!b) return;
    if (b.dataset.p) { e.preventDefault(); history.replaceState(null, "", "#" + b.dataset.p); tampil(b.dataset.j, b.dataset.p); }
    else if (b.dataset.j) tampil(b.dataset.j, S.idx[b.dataset.j][0]);
    else if (b.dataset.aksi === "png") unduhPng();
    else if (b.dataset.aksi === "cetak") window.print();
    else if (b.dataset.aksi === "salin") navigator.clipboard?.writeText($("rpKutip").textContent);
  });
  $("isi").addEventListener("change", (e) => { if (e.target.id === "rpPeriode") { history.replaceState(null, "", "#" + e.target.value); tampil(S.jenis, e.target.value); } });
}
saatBahasa(() => { if (S.r) tampil(S.jenis, S.periode); });
mulai();
