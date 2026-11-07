/* Peristiwa EBT (/data/peristiwa_ebt.json, siaran pers ESDM) dan komitmen iklim perusahaan (/data/komitmen_iklim.json, SBTi + RE100).
   Dipakai: p.js (peristiwa per proyek), proyek.js (kartu popup), transisi.js (linimasa), o_ringkas.js (lencana), pasar_hijau.js (tabel komitmen).
   Semua baris peristiwa berstatus perlu tinjau (ekstraksi heuristik); kapasitas sengaja tidak ditampilkan (bisa berupa angka nasional, bukan kapasitas proyek). */
import { t, tanggal, angka } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { exHtml, pilihHtml } from "/inti/komponen.js";
import { aksiHtml } from "/inti/aksi_ex.js";
import { NORM } from "/inti/org_sensus.js";
import { muatData } from "/analisis.js";

const cache = {};
const ambil = (n) => (cache[n] ??= muatData(n + ".json").catch(() => { delete cache[n]; return null; }));
export const muatPeristiwa = () => ambil("peristiwa_ebt");
export const muatKomitmen = () => ambil("komitmen_iklim");

const IK = { peresmian: "kalender-bintang", ppa: "regulasi", lelang: "palu", lain: "berita" };
const jenisDari = (b) => b.peristiwa || "lain";
const urlEsdm = (u) => (/^https:\/\/(www\.)?esdm\.go\.id\//.test(u || "") ? u : "");
const urut = (a) => [...a].sort((x, y) => String(y.tanggal).localeCompare(String(x.tanggal)));

function itemHtml(b) {
  const j = jenisDari(b), u = urlEsdm(b.sumber_url);
  const pb = (b.pembangkit || []).slice(0, 3).map((x) => `<span class="pe-chip">${esc(x)}</span>`).join("");
  return `<li class="pe-i"><span class="pe-ik pe-${j}" title="${esc(t("pe.jenis." + j))}">${ikon(IK[j], 18)}</span><div class="pe-b">
    <div class="pe-meta"><time datetime="${esc(b.tanggal)}">${esc(tanggal(b.tanggal))}</time><span class="jm-pil">${esc(t("pe.jenis." + j))}</span>${b.provinsi ? `<span class="jm-pil">${ikon("lokasi", 12)}${esc(b.provinsi)}</span>` : ""}${b.perlu_tinjau ? `<span class="jm-pil jm-pil-warn" title="${esc(t("pe.tinjau_tip"))}">${esc(t("pe.tinjau"))}</span>` : ""}</div>
    <p class="pe-j">${esc(b.judul)}</p>${pb ? `<p class="pe-chips">${pb}</p>` : ""}${u ? `<a class="pe-src" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 14)}<span>${esc(t("pe.sumber"))} esdm.go.id</span></a>` : ""}</div></li>`;
}

/* ---------- profil proyek: peristiwa yang cocok (nama saja) ---------- */
export async function peristiwaProyek(id) {
  const d = await muatPeristiwa();
  return d ? urut(d.baris.filter((b) => b.proyek_id === id)) : [];
}
export const peristiwaProyekHtml = (daftar) => (daftar.length ? `<ul class="pe-daftar">${daftar.map(itemHtml).join("")}</ul><p class="jm-bantu pe-cat">${esc(t("pe.p.ket"))}</p>` : "");

/* ---------- kartu popup peta: satu baris peristiwa terbaru (cache sinkron setelah muat) ---------- */
export function peristiwaPopupHtml(id) {
  const b = sinkron && urut(sinkron.baris.filter((x) => x.proyek_id === id))[0];
  if (!b) return "";
  const j = jenisDari(b), u = urlEsdm(b.sumber_url);
  return `<p class="pe-pop">${ikon(IK[j], 14)}<span><time>${esc(tanggal(b.tanggal))}</time> ${u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(b.judul)}</a>` : esc(b.judul)} <span class="jm-pil jm-pil-warn">${esc(t("pe.tinjau"))}</span></span></p>`;
}
let sinkron = null;
muatPeristiwa().then((d) => { sinkron = d; });

/* ---------- linimasa /transisi: filter jenis dan provinsi, paginasi ---------- */
const PER = 8;
export async function pasangLinimasa(host) {
  const d = await muatPeristiwa(); if (!host || !d) return;
  const st = { j: "", p: "", hal: 1 }, semua = urut(d.baris);
  const hitungJ = (k) => semua.filter((b) => jenisDari(b) === k).length;
  const provs = [...new Set(semua.map((b) => b.provinsi).filter(Boolean))].sort((a, z) => a.localeCompare(z, "id"));
  const saring = () => semua.filter((b) => (!st.j || jenisDari(b) === st.j) && (!st.p || b.provinsi === st.p));
  host.innerHTML = exHtml({ id: "peristiwa", ikon: "linimasa", topik: t("pe.ey"), judulHtml: esc(t("pe.judul", { n: angka(semua.length) })), subHtml: esc(t("pe.sub", { dari: tanggal(d.meta.dari), sampai: tanggal(d.meta.sampai) })),
    aksiHtml: `<span class="jm-pil jm-pil-warn" title="${esc(t("pe.tinjau_tip"))}">${esc(t("pe.tinjau"))}</span>${aksiHtml({ csv: true, png: false, pdf: false, bagi: false })}`,
    isiHtml: `<div class="pe-alat">${pilihHtml({ id: "peJenis", ikon: "jenis", label: t("pe.jenis_lbl"), opsi: [["", t("pe.semua_jenis")], ...["peresmian", "ppa", "lelang", "lain"].map((k) => [k, t("pe.jenis." + k), null, hitungJ(k)])] })}${pilihHtml({ id: "peProv", ikon: "wilayah", label: t("pe.prov"), opsi: [["", t("pe.semua_prov")], ...provs.map((p) => [p, p])] })}<span class="jm-hitung" id="peHitung" role="status"></span></div><div id="peIsi"></div>`,
    kakiHtml: esc(t("pe.catatan", { n: angka(d.meta.artikel_diperiksa), tgl: tanggal(d.dibangun_pada) })) });
  const gambar = () => {
    const b = saring(), maks = Math.max(1, Math.ceil(b.length / PER)); st.hal = Math.min(st.hal, maks);
    host.querySelector("#peHitung").textContent = t("pe.hitung", { n: angka(b.length) });
    host.querySelector("#peIsi").innerHTML = b.length ? `<ul class="pe-daftar">${b.slice((st.hal - 1) * PER, st.hal * PER).map(itemHtml).join("")}</ul>${paginasiHtml({ hal: st.hal, total: b.length, per: PER, satuan: "pe.satuan" })}` : `<p class="jm-bantu">${esc(t("pe.kosong"))}</p>`;
  };
  host.addEventListener("change", (e) => { if (e.target.id === "peJenis") st.j = e.target.value; else if (e.target.id === "peProv") st.p = e.target.value; else return; st.hal = 1; gambar(); });
  host.addEventListener("click", (e) => { const h = e.target.closest("[data-hal]"); if (h && !h.disabled) { st.hal = +h.dataset.hal; sorotHalaman(h, st.hal); gambar(); host.querySelector("#peIsi").scrollIntoView({ block: "nearest" }); } });
  host.querySelector(".jm-ex").addEventListener("jm:csv", (e) => { e.detail.baris = [[t("pe.c.tanggal"), t("pe.jenis_lbl"), t("pe.c.judul"), t("pe.prov"), t("pe.c.sumber")], ...saring().map((b) => [b.tanggal, t("pe.jenis." + jenisDari(b)), b.judul, b.provinsi || "", b.sumber_url])]; });
  gambar();
}

/* ---------- komitmen iklim ---------- */
const STATUS = { "Commitment to Set Targets": "berkomitmen", "Validated Targets": "tervalidasi", "Commitment Removed": "dicabut" };
export const statusKm = (b) => (b.registri === "RE100" ? "anggota" : STATUS[b.status_jangka_pendek] || "lain");
export const tahunKm = (b) => (b.registri === "RE100" ? b.tahun_target_100persen : b.tahun_sasaran_jangka_pendek ?? b.tahun_net_zero) ?? null;
export const slugSek = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40);
export const sektorKm = (s) => { const k = "km.sek." + slugSek(s); const v = t(k); return v === k ? s : v; };
export const pilStatusKm = (b) => { const s = statusKm(b), kls = s === "tervalidasi" || s === "anggota" ? "jm-pil-ok" : s === "dicabut" ? "jm-pil-bad" : ""; return `<span class="jm-pil ${kls}">${esc(t("km.st." + s))}</span>`; };

/* cocokkan nama komitmen ke organisasi (nama baku) -> id /o */
export function cocokOrg(nama, orgBaris) {
  const n = NORM(nama); if (!n) return null;
  return orgBaris.find((o) => NORM(o.nama) === n) || null;
}

/* lencana di profil organisasi /o: tampil bila nama baku cocok */
export async function lencanaOrg(nama) {
  const d = await muatKomitmen(); if (!d) return "";
  const n = NORM(nama), cocok = d.baris.filter((b) => NORM(b.nama) === n);
  if (!cocok.length) return "";
  const out = [];
  for (const [reg, ik, kunci] of [["SBTi", "perisai", "km.lencana.sbti"], ["RE100", "tek-listrik", "km.lencana.re100"]]) {
    const b = cocok.find((x) => x.registri === reg); if (!b) continue;
    const info = reg === "SBTi" ? t("km.st." + statusKm(b)) + (tahunKm(b) ? `, ${tahunKm(b)}` : "") : t("km.re100_tip", { th: tahunKm(b) ?? "-" });
    out.push(`<a class="km-lencana km-${reg.toLowerCase()}" href="/pasar-listrik-hijau#komitmen" title="${esc(info)}">${ikon(ik, 14)}<span>${esc(t(kunci))}</span></a>`);
  }
  return out.join("");
}
