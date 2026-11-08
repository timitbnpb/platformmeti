/* /dpr-energi: peta politik energi, Komisi XII DPR 2024-2029. Data /data/dpr_energi.json (scripts/panen/dpr_energi.mjs).
   Netral: parafrase pernyataan bertanggal dan bersumber, tanpa penilaian, tanpa foto dan kontak (inisial berwarna fraksi). */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, bahasa, tanggal } from "/i18n.js";
import { esc, ikon, hantuHtml, nanti } from "/inti/umum.js";
import { khUbin } from "/inti/kh.js";
import { muatData, tampilGalat, batangHtml, pasangBar, pasangSeg } from "/analisis.js";
import { seksi, catatan, narasi, saatBahasa } from "/info_kerangka.js";
import { num, L, tautan, pilBukti } from "/sistem_umum.js";

const $ = (id) => document.getElementById(id);
const TOPIK = ["ruu-ebet", "power-wheeling", "nuklir", "pltu", "tkdn"];
let d = null, fFraksi = "semua", fTopik = "semua";
const fr = (id) => d.fraksi.find((f) => f.id === id);
const agt = (id) => d.anggota.find((a) => a.id === id);
const ini = (n) => n.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join("");
const av = (a, kecil) => `<span class="dp-av dp-f-${esc(a.fraksi)}${kecil ? " dp-av-k" : ""}" aria-hidden="true">${esc(ini(a.nama))}</span>`;
const tgl = (s) => (s.length === 7 ? s : tanggal(s));
const pilFraksi = (a) => `<span class="jm-pil">${esc(fr(a.fraksi).singkat)}</span>`;
const lamb = (k) => `<img class="inf-lb-kecil" src="/img/provinsi/${esc(k)}.png" width="16" height="16" alt="" loading="lazy">`;
const dapil = (a) => `<span class="dp-dapil">${a.kode_provinsi ? lamb(a.kode_provinsi) : ""}<a href="/wilayah/${esc(a.kode_provinsi || "")}">${esc(a.dapil)}</a></span>`;
const jumSikap = (id) => d.sikap.filter((s) => s.anggota === id).length;
const seg = (nama, daftar, kini, labelFn) => `<div class="jm-seg" role="group" id="seg-${nama}" aria-label="${esc(t("dp2.f." + nama))}">${daftar.map((k) => `<button type="button" data-v="${esc(k)}" aria-pressed="${k === kini}">${esc(labelFn(k))}</button>`).join("")}</div>`;

const anggotaHtml = () => `<ul class="dp-grid">${d.anggota.filter((a) => fFraksi === "semua" || a.fraksi === fFraksi).sort((a, z) => ({ ketua: 0, wakil: 1, anggota: 2 }[a.jabatan] - { ketua: 0, wakil: 1, anggota: 2 }[z.jabatan]) || a.nama.localeCompare(z.nama, "id")).map((a) => `<li>${av(a)}<div><h3>${esc(a.nama)}</h3><p class="dp-meta">${pilFraksi(a)}${a.jabatan !== "anggota" ? `<span class="jm-pil jm-pil-ok">${esc(t("dp2.jabatan." + a.jabatan))}</span>` : ""}${jumSikap(a.id) ? `<a class="jm-pil" href="#sikap">${esc(t("dp2.n_sikap", { n: num(jumSikap(a.id)) }))}</a>` : ""}</p>${dapil(a)}${a.catatan ? `<p class="jm-bantu">${esc(L(a.catatan, bahasa()))}</p>` : ""}</div></li>`).join("")}</ul>`;
const sikapHtml = () => `<ul class="dp-sikap">${d.sikap.filter((s) => fTopik === "semua" || s.topik.includes(fTopik)).map((s) => { const a = agt(s.anggota), sm = d.sumber[s.sumber_id]; return `<li><div class="dp-kepala">${av(a, true)}<b>${esc(a.nama)}</b>${pilFraksi(a)}<time datetime="${esc(s.tanggal)}">${esc(tgl(s.tanggal))}</time></div><div class="kw-pil">${s.topik.map((x) => `<span class="jm-pil">${esc(t("dp2.topik." + x))}</span>`).join("")}</div><p>${esc(L(s.parafrase, bahasa()))}</p><div class="dp-kaki">${ikon("buku", 14)}${tautan(sm.url, sm.judul)}<span>${esc(sm.media)}</span>${pilBukti(sm.tingkat_bukti)}${s.ket ? `<span>${esc(s.ket)}</span>` : ""}</div></li>`; }).join("")}</ul>`;

function gambar() {
  document.title = t("dp2.judul_halaman");
  khUbin("ubin", [
    { ikon: "orang", nilai: num(d.anggota.length), label: t("dp2.ubin.anggota") },
    { ikon: "gedung", nilai: num(d.fraksi.length), label: t("dp2.ubin.fraksi") },
    { ikon: "regulasi", nilai: num(d.sikap.length), label: t("dp2.ubin.sikap") },
  ]);
  $("isi").innerHTML = ["status", "fraksi", "anggota", "sikap", "agenda", "metode"].map((i) => `<div id="d-${i}"></div>`).join("");
  const e = d.ruu_ebet;
  $("d-status").innerHTML = seksi({ id: "status", ik: "regulasi", topik: t("dp2.status.topik"), judul: t("dp2.status.judul"), sub: t("dp2.status.sub"), turunan: false,
    isi: `<div class="dp-status"><p>${esc(L(e.status, bahasa()))}</p><p class="jm-bantu">${esc(L(e.catatan, bahasa()))}</p><div class="dp-kaki">${tautan(d.sumber[e.sumber_id].url, d.sumber[e.sumber_id].judul)}${pilBukti(d.sumber[e.sumber_id].tingkat_bukti)}<span>${esc(tgl(e.tanggal))}</span></div></div>` });
  const urut = [...d.fraksi].sort((a, z) => z.jumlah - a.jumlah);
  $("d-fraksi").innerHTML = seksi({ id: "fraksi", ik: "grafik", topik: t("dp2.fraksi.topik"), judul: t("dp2.fraksi.judul", { n: num(d.anggota.length), f: num(d.fraksi.length) }), sub: t("dp2.fraksi.sub"), turunan: false,
    isi: `${narasi(t("dp2.fraksi.narasi"))}<div id="bar-fr">${batangHtml(urut.map((f) => ({ id: f.id, label: f.singkat, labelHtml: `<span class="sp-teknis"><i class="dp-f-${esc(f.id)}"></i>${esc(f.singkat)}</span>`, bagian: [{ nilai: f.jumlah, kelas: "dp-f-" + f.id }], teks: `${num(f.jumlah)} (${num((f.jumlah / d.anggota.length) * 100, 0)}%)` })), { label: t("dp2.fraksi.label"), maks: Math.max(...urut.map((f) => f.jumlah)) + 2 })}</div>` });
  pasangBar($("bar-fr"));
  $("d-anggota").innerHTML = seksi({ id: "anggota", ik: "orang", topik: t("dp2.anggota.topik"), judul: t("dp2.anggota.judul", { n: num(d.anggota.length) }), sub: t("dp2.anggota.sub"), turunan: false, isi: `${narasi(t("dp2.anggota.narasi"))}<div class="dp-fr">${seg("fraksi", ["semua", ...d.fraksi.map((f) => f.id)], fFraksi, (k) => (k === "semua" ? t("dp2.f.semua") : fr(k).singkat))}</div><div id="gr-ang">${anggotaHtml()}</div>` });
  pasangSeg($("seg-fraksi"), "v", () => fFraksi, (v) => { fFraksi = v; }, () => { $("gr-ang").innerHTML = anggotaHtml(); }, nanti);
  const per = TOPIK.map((x) => ({ x, n: d.sikap.filter((s) => s.topik.includes(x)).length }));
  $("d-sikap").innerHTML = seksi({ id: "sikap", ik: "regulasi", topik: t("dp2.sikap.topik"), judul: t("dp2.sikap.judul", { n: num(d.sikap.length) }), sub: t("dp2.sikap.sub"), turunan: false,
    isi: `${narasi(t("dp2.sikap.narasi"))}<div id="bar-tp">${batangHtml(per.map((p) => ({ id: p.x, label: t("dp2.topik." + p.x), bagian: [{ nilai: p.n, kelas: "jm-an-id" }], teks: num(p.n) })), { label: t("dp2.sikap.label"), maks: 6 })}</div><div class="dp-fr">${seg("topik", ["semua", ...TOPIK], fTopik, (k) => (k === "semua" ? t("dp2.f.semua") : t("dp2.topik." + k)))}</div><div id="gr-sk">${sikapHtml()}</div>${catatan(t("dp2.sikap.catatan"))}` });
  pasangBar($("bar-tp"));
  pasangSeg($("seg-topik"), "v", () => fTopik, (v) => { fTopik = v; }, () => { $("gr-sk").innerHTML = sikapHtml(); }, nanti);
  $("d-agenda").innerHTML = seksi({ id: "agenda", ik: "kalender", topik: t("dp2.agenda.topik"), judul: t("dp2.agenda.judul", { n: num(d.agenda.length) }), sub: t("dp2.agenda.sub"), turunan: false,
    isi: `<ol class="dp-lini">${d.agenda.map((g) => { const sm = d.sumber[g.sumber_id]; return `<li><div class="dp-kaki"><time datetime="${esc(g.tanggal)}">${esc(tgl(g.tanggal))}</time><span class="jm-pil">${esc(g.jenis)}</span></div><h3>${esc(L(g.judul, bahasa()))}</h3><p>${esc(L(g.hasil, bahasa()))}</p><div class="dp-kaki">${tautan(sm.url, sm.judul)}<span>${esc(sm.media)}</span>${pilBukti(sm.tingkat_bukti)}</div></li>`; }).join("")}</ol>` });
  $("d-metode").innerHTML = seksi({ id: "metode", ik: "metode", topik: t("dp2.metode.topik"), judul: t("dp2.metode.judul"), sub: t("dp2.metode.sub"), turunan: false,
    isi: `<ul class="sp-celah">${d.meta.celah.map((_, i) => `<li>${ikon("info", 18)}<p>${esc(t("dp2.celah." + (i + 1)))}</p></li>`).join("")}</ul>${catatan(t("dp2.metode.tanggal", { tanggal: d.dibangun_pada }))}` });
}
(async () => {
  await mulaiHalaman();
  $("isi").innerHTML = hantuHtml(6);
  try { d = await muatData("dpr_energi.json"); } catch { tampilGalat($("isi"), () => location.reload()); return; }
  gambar();
  saatBahasa(() => gambar());
})();
