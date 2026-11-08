/* /rapor: rapor bulanan dan tahunan "Kondisi EBT Indonesia" dari /data/rapor/<periode>.json (scripts/pipa/rapor_bulanan.mjs).
   Kepala standar (judul, 4 ubin, segmen jenis, pilih periode, PNG/PDF), kartu perbandingan hanya metrik sebanding, empat bagian bernomor dengan logo dan nama yang digabung (rapor_nama.js),
   kartu regulasi dan berita, arsip, kutipan. Sel kosong "-" bertooltip alasan. Teks layar dari kamus. */
import { khUbin } from "/inti/kh.js";
import { t, ada, angka, tanggal, bahasa } from "/i18n.js";
import { esc, ikon, hantuHtml } from "/inti/umum.js";
import { pilihHtml, unduhRegHtml } from "/inti/komponen.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { uangHtml } from "/inti/uang.js";
import { pilTek } from "/inti/ikon_tek.js";
import { namaMedia, logoLokal } from "/inti/nama_media.js";
import { NORM } from "/inti/org_sensus.js";
import { muatData, tampilGalat, saatBahasa } from "/analisis.js";
import { gabungPengembang, gabungPendana, namaPendanaBaku, logoHtml, uangRingkas } from "/rapor_nama.js";

const $ = (id) => document.getElementById(id);
const S = { idx: null, r: null, jenis: "bulanan", periode: "", ref: null };
const TB = new Map();
const PER = 10;
const num = (n, d = 0) => angka(n, { desimal: d });

const namaPeriode = (jenis, p) => (jenis === "tahunan" ? p : new Intl.DateTimeFormat(bahasa(), { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(p + "-01T00:00:00Z")));
const namaTek = (k) => (ada("an.tek." + k) ? t("an.tek." + k) : k);
const kosong = (alasanKunci) => `<span class="rp-kosong" title="${esc(t(alasanKunci))}" tabindex="0">-</span>`;
const sel = (label, isi, kelas = "") => `<td data-label="${esc(label)}"${kelas ? ` class="${kelas}"` : ""}>${isi}</td>`;
const pilPorsi = (v) => (v == null ? kosong("rp.kosong.nilai") : `<span class="jm-pil jm-pil-ok">${esc(num(v, 1))}%</span>`);

/* tabel berhalaman per bagian: kolom [{k (kunci i18n), kelas, sel(baris, i)}]; baris sudah dalam urutan akhir */
function tabelH(id, kolom, baris, { per = PER, satuan = "jm.pag.u.data", kosongKunci = "rp.kosong.data" } = {}) {
  TB.set(id, { kolom, baris, per, satuan, hal: 1 });
  return `<div class="rp-tb" id="rpT-${id}" data-rt="${id}">${isiTabel(id)}</div>`;
}
function isiTabel(id) {
  const s = TB.get(id), n = s.baris.length, maks = Math.max(1, Math.ceil(n / s.per)); s.hal = Math.min(s.hal, maks);
  const lihat = s.baris.slice((s.hal - 1) * s.per, s.hal * s.per);
  const kep = s.kolom.map((c) => `<th scope="col" class="${c.kelas || ""}">${esc(t(c.k))}</th>`).join("");
  const isi = lihat.map((b, i) => `<tr>${s.kolom.map((c) => sel(t(c.k), c.sel(b, (s.hal - 1) * s.per + i), c.kelas || "")).join("")}</tr>`).join("") || `<tr><td colspan="${s.kolom.length}">${kosong("rp.kosong.data")}</td></tr>`;
  return `<div class="jm-gulir"><table class="jm-tabel rp-t"><thead><tr>${kep}</tr></thead><tbody>${isi}</tbody></table></div>${n > s.per ? paginasiHtml({ hal: s.hal, total: n, per: s.per, satuan: s.satuan }) : ""}`;
}

/* ---------- perbandingan: hanya metrik sebanding ---------- */
const bulanKe = (p) => (/^\d{4}$/.test(p) ? p + "-12" : p);
function kartuBanding(r) {
  const sejak = r.cakupan?.berita_sejak || "", b = r.banding, th = r.jenis === "tahunan", berjalan = th && String(r.periode) === String(r.dibekukan).slice(0, 4);
  const lalu = namaPeriode(r.jenis, b.periode_lalu);
  const baris = [];
  const metrik = (kunci, ik, now, prev, { catatan = "", tak = "" } = {}) => {
    let pil;
    if (tak) pil = `<span class="jm-pil jm-pil-warn" title="${esc(tak)}">${esc(t("rp.bd.belum"))}</span>`;
    else if (now == null || prev == null) pil = `<span class="jm-pil" title="${esc(catatan)}">${esc(t("rp.bd.belum"))}</span>`;
    else { const d = Math.round((now - prev) * 10) / 10; pil = `<span class="jm-pil ${d > 0 ? "jm-pil-ok" : d < 0 ? "jm-pil-bad" : ""}">${d > 0 ? "+" : ""}${esc(num(d, d % 1 ? 1 : 0))}</span>`; }
    baris.push(`<li class="rp-bk"><span class="rp-bk-ik">${ikon(ik, 20)}</span><div class="rp-bk-t"><span class="rp-bk-l">${esc(t(kunci))}</span><b class="rp-bk-n">${now == null ? kosong("rp.kosong.nilai") : esc(num(now, now % 1 ? 1 : 0))}</b><small>${esc(t("rp.bd.lalu", { p: lalu, n: prev == null ? "-" : num(prev, prev % 1 ? 1 : 0) }))}</small></div>${pil}</li>`);
  };
  const tipBerita = t("rp.bd.tip_berita", { sejak });
  const berBelum = sejak && bulanKe(b.periode_lalu) < sejak;
  metrik("rp.u.berita", "berita", bulanKe(r.periode) < sejak ? null : b.berita[0], berBelum ? null : b.berita[1], { tak: bulanKe(r.periode) < sejak || berBelum ? tipBerita : "" });
  metrik("rp.u.reg", "regulasi", b.regulasi[0], b.regulasi[1]);
  metrik("rp.u.tender", "palu", b.tender[0], b.tender[1]);
  if (th) metrik("rp.u.mw", "proyek", berjalan ? null : b.mw_baru?.[0] ?? null, b.mw_baru?.[1] ?? null, { tak: berjalan ? t("rp.bd.tip_berjalan") : "", catatan: t("rp.bd.tip_cod") });
  return `<section class="rp-bag rp-banding" aria-labelledby="rpBd"><h2 id="rpBd" class="rp-h2">${ikon("tingkat", 20)}<span>${esc(t("rp.bd.j", { p: lalu }))}</span></h2><ul class="rp-bks">${baris.join("")}</ul>${(th && berjalan) || bulanKe(b.periode_lalu) < sejak ? `<p class="rp-cat">${ikon("info", 14)}<span>${esc(berjalan ? t("rp.bd.tip_berjalan") : tipBerita)}</span></p>` : ""}</section>`;
}

function ubinData(r) {
  const u = r.ubin, sejak = r.cakupan?.berita_sejak || "", belumB = sejak && bulanKe(r.periode) < sejak;
  const nilai = (v) => (v == null ? "-" : num(v, v % 1 ? 1 : 0));
  return [{ ikon: "proyek", nilai: nilai(u.mw_baru), satuan: u.mw_baru == null ? "" : "MW", label: t("rp.u.mw") }, { ikon: "centang", nilai: nilai(u.proyek_cod), label: t("rp.u.cod") }, { ikon: "regulasi", nilai: nilai(u.regulasi), label: t("rp.u.reg") }, { ikon: "berita", nilai: belumB ? "-" : nilai(u.berita), label: t("rp.u.berita") }];
}

/* ---------- grafik kolom ---------- */
function dataGrafik(r) {
  return r.jenis === "tahunan" && r.kapasitas_baru?.length
    ? { satuan: "MW", judul: t("rp.g.mw"), kol: r.kapasitas_baru.map((g) => ({ label: namaTek(g.teknologi), v: g.mw })) }
    : { satuan: "", judul: t("rp.g.aktivitas"), kol: [{ label: t("rp.u.berita"), v: r.ubin.berita || 0 }, { label: t("rp.u.reg"), v: r.ubin.regulasi || 0 }, { label: t("rp.u.tender"), v: r.ubin.tender || 0 }] };
}
function grafikSvg(g) {
  const maks = Math.max(1, ...g.kol.map((k) => k.v)), W = 360, H = 190, dasar = 150, lebar = Math.min(48, (W - 20) / g.kol.length - 10), langkah = (W - 20) / g.kol.length;
  const batang = g.kol.map((k, i) => { const h = Math.max(1, k.v / maks * 120), x = 10 + i * langkah + (langkah - lebar) / 2; return `<rect x="${x}" y="${dasar - h}" width="${lebar}" height="${h}" rx="4" class="rp-b"/><text x="${x + lebar / 2}" y="${dasar - h - 5}" text-anchor="middle" class="rp-bv" font-size="11">${esc(num(k.v, k.v % 1 ? 1 : 0))}</text><text x="${x + lebar / 2}" y="${dasar + 16}" text-anchor="middle" class="rp-bl" font-size="10">${esc(k.label.length > 11 ? k.label.slice(0, 10) + "." : k.label)}</text>`; }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="rp-grafik" role="img" aria-label="${esc(g.judul)}"><line x1="6" x2="${W - 6}" y1="${dasar}" y2="${dasar}" class="rp-sumbu"/>${batang}</svg>`;
}


/* ---------- empat bagian ---------- */
/* kepala bagian: nomor, judul, label topik kanan atas, aksi (CSV) sejajar judul */
const bagian = (no, judul, lead, isi, label, ik) => `<section class="rp-bag" aria-labelledby="rpB${no}"><div class="rp-bag-k"><span class="rp-no" aria-hidden="true">${no}</span><div class="rp-bag-t"><h2 id="rpB${no}">${esc(judul)}</h2><p class="rp-lead">${esc(lead)}</p></div><span class="jm-pil rp-label">${ikon(ik, 14)}${esc(label)}</span></div>${isi}</section>`;
const orgPil = (nama) => { const o = S.ref?.orgs.find((x) => NORM(x.nama) === NORM(nama)); return o; };
const namaSel = (g, lg) => { const o = orgPil(g.nama), n = esc(g.nama); return `<span class="rp-nm">${lg}${o ? `<a href="/o/${esc(o.id)}" title="${esc(t("rp.buka_profil"))}">${n}</a>` : `<b>${n}</b>`}</span>`; };
const tipAsal = (g) => (g.asal?.length ? ` title="${esc(t("rp.digabung", { n: g.asal.join("; ") }))}"` : "");

function bagian1(b) {
  const p = b.pengembang, semua = p.mw_semua ?? p.mw_bernama, g = gabungPengembang(p.baris, p.mw_bernama);
  const atas = g.slice(0, p.atas || 10), porsiAtas = p.mw_bernama ? (atas.reduce((n, x) => n + x.mw, 0) / p.mw_bernama) * 100 : p.porsi_atas_persen;
  const lead = p.mw_semua == null ? t("rp.b1.l2", { n: num(p.proyek_bernama), t: num(p.proyek_ber_mw), mw: num(p.mw_bernama), h: num(p.jumlah_pengembang) }) : t("rp.b1.l", { n: num(p.proyek_bernama), t: num(p.proyek_ber_mw), mw: num(p.mw_bernama), semua: num(semua), h: num(p.jumlah_pengembang) });
  const kol = [
    { k: "rp.k.no", kelas: "rp-no-k", sel: (x) => num(x.peringkat) },
    { k: "rp.k.pengembang", kelas: "rp-nama", sel: (x) => `<span${tipAsal(x)}>${namaSel(x, logoHtml({ nama: x.nama, logo: x.logo, id: orgPil(x.nama)?.id }))}</span>` },
    { k: "rp.k.mw", kelas: "rp-n", sel: (x) => esc(num(x.mw)) },
    { k: "rp.k.proyek", kelas: "rp-n", sel: (x) => esc(num(x.proyek)) },
    { k: "rp.k.porsi", kelas: "rp-pil", sel: (x) => pilPorsi(x.porsi) },
  ];
  return bagian(1, t("rp.b1.j", { n: num(atas.length), x: num(porsiAtas, 1) }), lead, tabelH("dev", kol, g, { satuan: "rp.u.pengembang" }) + `<p class="rp-cat">${ikon("info", 14)}<span>${esc(t("rp.metode_nama"))}</span></p>`, t("rp.l.pengembang"), "orang");
}
function bagian2(b) {
  const p = b.pendana, g = gabungPendana(p.baris);
  const kol = [
    { k: "rp.k.no", kelas: "rp-no-k", sel: (x) => num(x.peringkat) },
    { k: "rp.k.pendana", kelas: "rp-nama", sel: (x) => `<span${tipAsal(x)}>${namaSel(x, logoHtml({ nama: x.nama, bendera: x.bendera }))}</span>` },
    { k: "rp.k.aktivitas", kelas: "rp-n", sel: (x) => esc(num(x.proyek)) },
    { k: "rp.k.nilai", kelas: "rp-uang", sel: (x) => (x.nilai == null ? kosong("rp.kosong.nilai") : uangRingkas(x.nilai, "USD")) },
  ];
  return bagian(2, t("rp.b2.j", { n: num(g.filter((x) => x.proyek === 1).length || p.satu_saja), h: num(g.length) }), t("rp.b2.l", { a: num(p.jumlah_aktivitas) }), tabelH("dana", kol, g, { satuan: "rp.u.pendana" }), t("rp.l.pendana"), "kartu");
}

/* program/pinjaman pendanaan (operasi Bank Dunia, id wb_) bukan pembangkit */
const program = (x) => /^wb_/.test(x.id);
const pilStatus = (s) => `<span class="jm-pil rp-pil-st ${s === "dibatalkan" ? "jm-pil-bad" : "jm-pil-warn"}">${ikon(s === "dibatalkan" ? "silang" : "peringatan", 14)}<span>${esc(t("rp.st." + s))}</span></span>`;
const pilJenis = (prog) => `<span class="jm-pil rp-pil-j${prog ? "" : " jm-pil-ok"}">${ikon(prog ? "kartu" : "proyek", 14)}<span>${esc(t(prog ? "rp.jenis.program" : "rp.jenis.pembangkit"))}</span></span>`;
const namaProyek = (x) => (program(x) ? `<span class="rp-nm">${logoHtml({ nama: "World Bank" })}<b>${esc(x.nama)}</b></span>` : `<span class="rp-nm"><span class="rp-lg rp-lg-b">${ikon("proyek", 18)}</span><a href="/p/${esc(x.id)}">${esc(x.nama)}</a></span>`);
function bagian3(b) {
  const h = b.berhenti, total = h.per_tahun.reduce((n, x) => n + x.jumlah, 0), pemb = h.proyek.filter((x) => !program(x)), prog = h.proyek.filter(program);
  const ubin = h.per_tahun.map((x) => `<li class="rp-th"><b>${esc(num(x.jumlah))}</b><span>${esc(x.tahun)}</span></li>`).join("");
  const kol = (prog1) => [
    { k: prog1 ? "rp.k.program1" : "rp.k.proyek1", kelas: "rp-nama", sel: (x) => namaProyek(x) },
    { k: "rp.k.status", sel: (x) => pilStatus(x.status) },
    { k: "rp.k.mw", kelas: "rp-n", sel: (x) => (x.mw == null ? kosong("rp.kosong.mw") : esc(num(x.mw, x.mw % 1 ? 1 : 0))) },
    { k: "rp.k.dicatat", sel: (x) => (x.tanggal ? `<span class="jm-pil" title="${esc(t("rp.dicatat_tip"))}">${ikon("kalender", 14)}${esc(t("rp.dicatat", { tgl: tanggal(x.tanggal) }))}</span>` : kosong("rp.kosong.tanggal")) },
    { k: "rp.k.label", sel: (x) => `${x.dilaporkan_media ? `<span class="jm-pil jm-pil-warn">${esc(t("rp.lap_media"))}</span>` : `<span class="jm-pil jm-pil-ok">${esc(t("rp.terkonfirmasi"))}</span>`}${/^https:\/\//.test(x.sumber_url || "") ? `<a class="rp-ik" href="${esc(x.sumber_url)}" target="_blank" rel="noopener noreferrer" title="${esc(t("rp.buka_sumber"))}" aria-label="${esc(t("rp.buka_sumber"))}: ${esc(x.nama)}">${ikon("tautan", 16)}</a>` : ""}` },
  ];
  const blok = (judul, prog1, daftar, id) => `<div class="rp-sub-w"><h3 class="rp-sub">${pilJenis(prog1)}<span>${esc(judul)}</span><small>${esc(num(daftar.length))}</small></h3>${tabelH(id, kol(prog1), daftar)}</div>`;
  return bagian(3, t("rp.b3.j", { n: num(pemb.length), p: num(prog.length), b: num(total) }), t("rp.b3.l"), `<div class="rp-sub-w"><h3 class="rp-sub">${ikon("berita", 16)}<span>${esc(t("rp.b3.th"))}</span></h3><ul class="rp-ths">${ubin}</ul><p class="rp-cat">${ikon("info", 14)}<span>${esc(h.catatan ? t("rp.b3.cat") : "")}</span></p></div>${pemb.length ? blok(t("rp.b3.pr"), false, pemb, "hp") : ""}${prog.length ? blok(t("rp.b3.pg"), true, prog, "hg") : ""}`, t("rp.l.berhenti"), "blokir");
}
function bagian4(b) {
  const o = b.terbuka, pemb = o.baris.filter((x) => !program(x)), prog = o.baris.filter(program), ref = S.ref;
  const kol = (prog1) => [
    { k: prog1 ? "rp.k.program1" : "rp.k.proyek1", kelas: "rp-nama", sel: (x) => namaProyek(x) },
    { k: "rp.k.nilai", kelas: "rp-uang", sel: (x) => uangRingkas(x.nilai, x.satuan) },
    { k: "rp.k.jenis", sel: (x) => `<span class="jm-pil ${x.jenis === "perkiraan" ? "jm-pil-warn" : "jm-pil-ok"}">${esc(t("rp.j." + x.jenis))}</span>` },
    { k: "rp.k.mw", kelas: "rp-n", sel: (x) => (x.mw == null ? kosong("rp.kosong.mw") : esc(num(x.mw, x.mw % 1 ? 1 : 0))) },
  ];
  const blok = (judul, prog1, daftar, id) => `<div class="rp-sub-w"><h3 class="rp-sub">${pilJenis(prog1)}<span>${esc(judul)}</span><small>${esc(num(daftar.length))}</small></h3>${tabelH(id, kol(prog1), daftar)}</div>`;
  return bagian(4, t("rp.b4.j", { n: num(ref.pembDenganNilai), h: num(ref.pembTotal) }), t("rp.b4.l", { p: num(o.dengan_ppa) }), `${pemb.length ? blok(t("rp.b4.pr"), false, pemb, "tp") : ""}${prog.length ? blok(t("rp.b4.pg"), true, prog, "tg") : ""}<p class="rp-cat">${ikon("info", 14)}<span>${esc(t("rp.b4.cat"))}</span></p>`, t("rp.l.terbuka"), "tabel");
}

/* ---------- kartu regulasi dan berita ---------- */
const ENERGI_UMUM = /minyak|lpg|bbm|migas|batubara|batu bara|gas bumi/i;
const logoPenerbit = (inst) => (/ESDM|Energi dan Sumber/i.test(inst) ? "/img/logo/esdm.png" : /Pemerintah|Provinsi|Kota|Kabupaten|Gubernur|Bupati|Walikota/i.test(inst) ? "/img/penerbit/garuda.png" : "");
function kartuReg(x) {
  const full = S.ref?.reg.get(x.id) || {}, inst = full.instansi_penerbit || "", lg = logoPenerbit(inst), nomor = full.nomor ? `${(full.jenis || x.jenis || "").toUpperCase()} ${full.nomor}/${full.tahun}` : (x.jenis || "").toUpperCase();
  return `<li class="rp-kt"><span class="rp-lg rp-lg-b">${lg ? `<img src="${esc(lg)}" alt="" loading="lazy" decoding="async">` : ikon("regulasi", 20)}</span><div class="rp-kt-t"><a class="rp-kt-j" href="/regulasi#${esc(x.id)}">${esc(x.judul)}</a><div class="rp-kt-m"><span class="jm-pil">${esc(nomor)}</span><time datetime="${esc(x.tanggal)}">${esc(tanggal(x.tanggal))}</time>${ENERGI_UMUM.test(x.judul) ? `<span class="jm-pil jm-pil-warn">${esc(t("rp.terkait_energi"))}</span>` : ""}</div>${inst ? `<small>${esc(inst)}</small>` : ""}</div>${unduhRegHtml({ judul: x.judul, url_pdf: full.url_pdf, url_sumber: full.url_sumber || full.url_sumber })}</li>`;
}
const TEKB = [[/surya|plts|solar|panel/i, "surya"], [/bayu|angin|wind/i, "bayu"], [/panas bumi|geothermal|pltp/i, "panas-bumi"], [/hidro|plta|air /i, "hidro"], [/nuklir|pltn/i, "nuklir"], [/baterai|storage|penyimpanan/i, "penyimpanan"], [/biomassa|bioenergi|biodiesel|bioetanol|sampah/i, "bioenergi"], [/regulasi|kebijakan|aturan|tarif|insentif/i, "kebijakan"], [/listrik|pln|jaringan/i, "jaringan"]];
function kartuBerita(x) {
  const u = /^https:\/\//.test(x.url || "") ? x.url : "", lg = logoLokal(x.url || x.media), tek = (TEKB.find(([re]) => re.test(x.judul)) || [])[1], nm = namaMedia(x.url || x.media);
  return `<li class="rp-kt"><span class="rp-lg rp-lg-b">${lg ? `<img src="${esc(lg)}" alt="" loading="lazy" decoding="async" data-ini="${esc(nm.slice(0, 2))}">` : esc(nm.slice(0, 2).toUpperCase())}</span><div class="rp-kt-t">${u ? `<a class="rp-kt-j" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(x.judul)}</a>` : `<span class="rp-kt-j">${esc(x.judul)}</span>`}<div class="rp-kt-m"><span class="jm-pil">${esc(x.media || nm)}</span><time datetime="${esc(x.tanggal)}">${esc(tanggal(x.tanggal))}</time>${tek ? pilTek(tek) : ""}</div></div></li>`;
}
function daftarKartu(judulKunci, ik, baris, kartu, tambah = "") {
  return `<div class="rp-kol"><h3 class="rp-sub">${ikon(ik, 16)}<span>${esc(t(judulKunci))}</span><small>${esc(num(baris.length))}</small></h3>${baris.length ? `<ul class="rp-kts">${baris.slice(0, 6).map(kartu).join("")}</ul>${tambah}` : `<p class="rp-cat">${ikon("info", 14)}<span>${esc(t("rp.kosong.data"))}</span></p>`}</div>`;
}

/* ---------- badan rapor ---------- */
function kutipHtml(r, nama) {
  const kutip = t("rp.kutip.isi", { nama, tgl: tanggal(r.dibekukan), url: `${location.origin}/target#${r.periode}` });
  return `<section class="rp-bag rp-kutip-k no-cetak"><span class="rp-kutip-ik">${ikon("salin", 20)}</span><div class="rp-kutip-t"><b>${esc(t("rp.kutip"))}</b><p class="rp-kutip" id="rpKutip">${esc(kutip)}</p></div><button type="button" class="jm-tbl" data-aksi="salin">${ikon("salin", 16)}<span>${esc(t("rp.salin"))}</span></button><details class="rp-info"><summary aria-label="${esc(t("rp.info"))}" title="${esc(t("rp.info"))}">${ikon("info", 18)}</summary><div class="rp-pop"><p>${esc(t("rp.beku", { tgl: tanggal(r.dibekukan) }))}</p><p>${esc(t("rp.catatan_data", { sejak: r.cakupan.berita_sejak || "-" }))}</p></div></details></section>`;
}
function badanRapor(r) {
  const nama = namaPeriode(r.jenis, r.periode), g = dataGrafik(r), th = r.jenis === "tahunan";
  const regs = r.regulasi.map((x) => x).sort((a, z) => ENERGI_UMUM.test(a.judul) - ENERGI_UMUM.test(z.judul));
  const grafik = th && r.kapasitas_baru?.length ? `<section class="rp-bag rp-graf"><h2 class="rp-h2">${ikon("grafik", 20)}<span>${esc(g.judul)}</span></h2>${grafikSvg(g)}</section>` : "";
  return `<article class="rp-rapor" id="rpRapor">${kartuBanding(r)}${grafik}
    <div class="rp-dua${regs.length ? "" : " rp-dua-1"}">${regs.length ? daftarKartu("rp.reg_baru", "regulasi", regs, kartuReg, r.regulasi.length > 6 ? `<a class="jm-tbl jm-tbl-kecil rp-lainnya" href="/regulasi">${ikon("regulasi", 16)}<span>${esc(t("rp.semua_reg"))}</span></a>` : "") : ""}${daftarKartu("rp.berita_atas", "berita", r.berita, kartuBerita)}</div>
    ${bagian1(r.bagian)}${bagian2(r.bagian)}${bagian3(r.bagian)}${bagian4(r.bagian)}${kutipHtml(r, nama)}</article>`;
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
  x.fillStyle = ink2; x.font = "400 18px Inter, Arial, sans-serif"; x.fillText(`${t("rp.kutip.isi", { nama, tgl: tanggal(r.dibekukan), url: location.origin + "/target#rapor" })}`.slice(0, 120), 48, 742);
  c.toBlob((blob) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `rapor-ebt-${r.periode}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }, "image/png");
}


/* ---------- arsip dan kepala ---------- */
function arsipHtml() {
  const baru = (p, daftar) => daftar[0] === p;
  const kel = (jenis, ik, daftar) => `<div class="rp-arsip-k"><h3 class="rp-sub">${ikon(ik, 16)}<span>${esc(t("rp.arsip." + jenis))}</span><small>${esc(num(daftar.length))}</small></h3><ul class="rp-arsip-l">${daftar.map((p) => `<li><a class="rp-ar${S.periode === p ? " rp-ar-on" : ""}" href="#${p}" data-p="${p}" data-j="${jenis}"${S.periode === p ? ' aria-current="page"' : ""}>${ikon("kalender", 16)}<span>${esc(namaPeriode(jenis, p))}</span>${baru(p, daftar) ? `<span class="jm-pil jm-pil-ok">${esc(t("rp.baru"))}</span>` : ""}</a></li>`).join("")}</ul></div>`;
  return `<section class="rp-bag rp-arsip no-cetak"><h2 class="rp-h2">${ikon("kalender", 20)}<span>${esc(t("rp.arsip"))}</span></h2><div class="rp-arsip-g">${kel("bulanan", "kalender", S.idx.bulanan)}${kel("tahunan", "tahun", S.idx.tahunan)}</div></section>`;
}
function kepala(r, jenis, periode) {
  const nama = namaPeriode(jenis, periode), daftar = S.idx[jenis];
  $("rpKhJ").textContent = t("rp.h1", { nama });
  $("rpJawab").textContent = t(jenis === "tahunan" ? "rp.lead_th" : "rp.lead_bl", { nama, tgl: tanggal(r.dibekukan) });
  $("rpAksi").innerHTML = `<div class="rp-seg" role="group" aria-label="${esc(t("rp.jenis"))}"><button type="button" data-j="bulanan" aria-pressed="${jenis === "bulanan"}">${ikon("kalender", 16)}<span>${esc(t("rp.bulanan"))}</span></button><button type="button" data-j="tahunan" aria-pressed="${jenis === "tahunan"}">${ikon("tahun", 16)}<span>${esc(t("rp.tahunan"))}</span></button></div>${pilihHtml({ id: "rpPeriode", ikon: "kalender", label: t("rp.periode"), nilai: periode, opsi: daftar.map((p) => [p, namaPeriode(jenis, p)]) })}<span class="rp-tombol"><button type="button" class="jm-tbl" data-aksi="png">${ikon("gambar", 16)}<span>${esc(t("rp.png"))}</span></button><button type="button" class="jm-tbl" data-aksi="cetak">${ikon("pdf", 16)}<span>${esc(t("rp.pdf"))}</span></button></span>`;
}

async function referensi() {
  if (S.ref) return;
  const [orgs, reg, proyek] = await Promise.all([muatData("organisasi.json").then((o) => o.baris).catch(() => []), muatData("regulasi.json").then((o) => new Map(o.baris.map((x) => [x.id, x]))).catch(() => new Map()), muatData("proyek.json").then((o) => o.baris).catch(() => [])]);
  const pemb = proyek.filter((x) => !/^wb_/.test(x.id));
  S.ref = { orgs, reg, pembTotal: pemb.length, pembDenganNilai: pemb.filter((x) => (x.nilai_investasi || []).length).length };
}

async function tampil(jenis, periode) {
  S.jenis = jenis; S.periode = periode;
  const isi = $("rpIsi");
  isi.innerHTML = hantuHtml(6);
  try { S.r = await muatData(`rapor/${periode}.json`); await referensi(); } catch (e) { return tampilGalat(isi, () => tampil(jenis, periode)); }
  khUbin("rpUbin", ubinData(S.r).filter((u) => u.nilai !== "-")); /* ubin tanpa nilai disembunyikan */
  TB.clear();
  kepala(S.r, jenis, periode);
  isi.innerHTML = badanRapor(S.r) + arsipHtml();
  document.title = t("rp.h1", { nama: namaPeriode(jenis, periode) }) + " | Direktori METI";
}

async function mulai() {
  $("rpIsi").innerHTML = hantuHtml(6);
  try { S.idx = await muatData("rapor/indeks.json"); } catch (e) { return tampilGalat($("rpIsi"), mulai); }
  const h = decodeURIComponent(location.hash.slice(1)), jenis = S.idx.tahunan.includes(h) ? "tahunan" : "bulanan";
  await tampil(jenis, S.idx[jenis].includes(h) ? h : S.idx.bulanan[0]);
  const klik = (e) => {
    const hl = e.target.closest("[data-hal]");
    if (hl && !hl.disabled) { const w = hl.closest("[data-rt]"); if (w) { const s = TB.get(w.dataset.rt); s.hal = +hl.dataset.hal; sorotHalaman(hl, s.hal); w.innerHTML = isiTabel(w.dataset.rt); w.scrollIntoView({ block: "nearest" }); return; } }
    const b = e.target.closest("button,a[data-p]"); if (!b) return;
    if (b.dataset.p) { e.preventDefault(); history.replaceState(null, "", "#" + b.dataset.p); tampil(b.dataset.j, b.dataset.p); scrollTo({ top: 0 }); }
    else if (b.dataset.j) { b.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); tampil(b.dataset.j, S.idx[b.dataset.j][0]); } // chrome urgent
    else if (b.dataset.aksi === "png") unduhPng();
    else if (b.dataset.aksi === "cetak") window.print();
    else if (b.dataset.aksi === "salin") navigator.clipboard?.writeText($("rpKutip").textContent);
  };
  $("rpIsi").addEventListener("click", klik); $("rpAksi").addEventListener("click", klik);
  $("rpAksi").addEventListener("change", (e) => { if (e.target.id === "rpPeriode") { history.replaceState(null, "", "#" + e.target.value); tampil(S.jenis, e.target.value); } });
  $("rpIsi").addEventListener("error", (e) => { const im = e.target; if (im.tagName === "IMG" && im.dataset.ini !== undefined) im.replaceWith(document.createTextNode(im.dataset.ini)); }, true);
  document.addEventListener("click", (e) => document.querySelectorAll("details.rp-info[open]").forEach((p) => { if (!p.contains(e.target)) p.open = false; }));
}
saatBahasa(() => { if (S.r) tampil(S.jenis, S.periode); });
mulai();
