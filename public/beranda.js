import { mulaiHalaman } from "/inti/kepala.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, nanti, debounce, hantuHtml, kosongHtml, galatHtml, ikon } from "/inti/umum.js";
import { gambarDataset } from "/beranda_data.js";
import { pasangBawah } from "/beranda_bawah.js";
import { muat, label, urlAman, norm, namaRegulasi } from "/publik.js";

const JALUR = [["proyek", "/proyek", "info"], ["wilayah", "/wilayah", "pin"], ["rantai", "/rantai", "tautan"], ["regulasi", "/regulasi", "daftar"], ["direktori", "/direktori", "orang"], ["pustaka", "/direktori?tampil=pustaka", "info"], ["kalender", "/kalender", "jejak"]];
const KARTU = ["proyek", "kapasitas", "organisasi", "orang", "regulasi"];
const LOGO = new Set(["pertamina-nre", "pge", "pln-indonesia-power", "pln-nusantara-power", "medco-power", "barito-renewables", "star-energy", "meti", "aesi", "aprobi", "esdm", "brin"]);
const EKO = [
  ["bumn", 1, [["p_6998264f50", "pertamina-nre"], ["p_dda1e51dae", "pge"], ["p_5a2e7d0c63", "pln-indonesia-power"], ["p_ff7a390a42", "pln-nusantara-power"]]],
  ["swasta", 2, [["p_27ae5a4203", "medco-power"], ["p_bdd0f2d140", "barito-renewables"], ["p_c6c4e478c0", "supreme-energy"], ["p_7a803f3b71", "star-energy"]]],
  ["asosiasi", 3, [["l_41bf1f0b41", "meti"], ["l_dd90c88f59", "aesi"], ["l_d3dadc789e", "aprobi"], ["l_7e5f8d771d", "api"]]],
  ["lembaga", 4, [["l_7278e0528a", "esdm"], ["l_973f60de15", "brin"], ["l_7b43a2574c", "kemenkeu"], ["l_05301f48a5", "bkpm"]]],
];
const HITUNG = [["bumn", 1, "organisasi", "bumn"], ["swasta", 2, "organisasi", "swasta"], ["asing", 5, "organisasi", "internasional"], ["asosiasi", 3, "organisasi", "asosiasi"], ["lembaga", 4, "organisasi", "kementerian-lembaga"], ["kampus", 3, "organisasi", "perguruan-tinggi"], ["proyek", 2, "proyek"], ["regulasi", 1, "regulasi"]];
let R = null; // ringkas
let indeks = null; // korpus cari

const ikonAman = (n) => (["info", "tautan", "daftar", "orang", "jejak"].includes(n) ? n : "info");

function gambarJalur() {
  document.getElementById("jalur").innerHTML = JALUR.map(([k, href, ik]) => `<a class="jm-jalur" href="${href}">${ikon(ikonAman(ik), 24)}<strong>${esc(t("beranda.j." + k))}</strong><span>${esc(t("beranda.j." + k + ".ket"))}</span></a>`).join("");
}

function gambarKartu() {
  const el = document.getElementById("kartu"), tgl = tanggal(R.dibangun_pada);
  const kartu = R.kartu.filter((k) => KARTU.includes(k.kode)).map((k) => ({ kode: k.kode, nilai: k.nilai, satuan: k.satuan }));
  const konstruksi = R.proyek_per_status?.konstruksi;
  if (Number.isFinite(konstruksi)) kartu.push({ kode: "konstruksi", nilai: konstruksi, satuan: "proyek", dari: R.hitung.proyek });
  el.innerHTML = kartu.map((k) => `<div class="jm-kartu jm-angka"><span>${esc(t("beranda.k." + k.kode))}${k.kode === "kapasitas" ? ` <span class="jm-pil jm-pil-est">EST</span>` : ""}</span>
    <b>${esc(angka(k.nilai))}</b><small>${esc(k.dari ? t("beranda.dari", { n: angka(k.nilai), total: angka(k.dari) }) : t("beranda.u." + k.satuan))}</small>
    <small class="jm-angka-src" title="${esc(t("beranda.src." + k.kode, { tanggal: tgl, total: angka(R.hitung.regulasi) }))}">${ikon("info", 14)}<span>${esc(t("beranda.srcs." + k.kode, { tanggal: tgl }))}</span></small></div>`).join("");
  document.getElementById("sumber").textContent = t("beranda.sumber", { tanggal: tgl });
  document.getElementById("heroHitung").innerHTML = ["proyek", "organisasi", "orang", "regulasi", "berita"].map((k, i) => `<li><span class="jm-kotak jm-w${(i % 5) + 1}" aria-hidden="true"></span><b>${esc(angka(R.hitung[k]))}</b> ${esc(t("beranda.hero.h." + k))}</li>`).join("");
}

async function gambarBerita() {
  const el = document.getElementById("berita");
  try {
    const b = await muat("berita"), per = new Map(b.baris.map((x) => [x.id, x]));
    const baris = (R.berita_terbaru || []).map((id) => per.get(id)).filter((x) => x && urlAman(x.url));
    el.innerHTML = baris.length ? `<ul class="jm-daftar">${baris.map((x) => `<li><a class="jm-baris" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer"><span class="jm-baris-judul">${esc(x.judul)}</span><span class="jm-baris-meta"><span>${esc(x.media)}</span><span>${esc(tanggal(String(x.terbit).slice(0, 10)))}</span></span></a></li>`).join("")}</ul>` : kosongHtml("jm.kosong.cocok");
  } catch (e) { el.innerHTML = galatHtml("layanan"); }
}

async function gambarProyek() {
  const el = document.getElementById("proyek");
  try {
    const p = await muat("proyek");
    const baru = [...p.baris].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 6);
    el.innerHTML = `<ul class="jm-daftar">${baru.map((x) => {
      const kap = x.kapasitas?.[0], st = x.status?.[0]?.nilai, s = x.sumber?.[0];
      return `<li class="jm-acara"><strong>${esc(x.nama)}</strong><span class="jm-baris-meta"><span class="jm-pil">${esc(label("beranda.tek.", x.teknologi))}</span>${st ? `<span>${esc(label("beranda.st.", st))}</span>` : ""}<span>${esc(x.lokasi?.provinsi || "-")}</span>${kap ? `<span>${esc(angka(kap.nilai, { desimal: kap.nilai % 1 ? 1 : 0 }))} ${esc(kap.satuan)}</span>` : ""}</span>
        <span class="jm-sumber">${esc(t("beranda.dari_sumber", { sumber: label("beranda.sj.", s?.jenis || "-"), tanggal: tanggal(s?.tanggal) }))}</span></li>`;
    }).join("")}</ul>`;
  } catch (e) { el.innerHTML = galatHtml("layanan"); }
}

/* ---------- ekosistem: hitungan per kategori + kisi logo ---------- */
const inisial = (n) => String(n).replace(/^PT\s+/i, "").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
async function gambarEkosistem() {
  const hit = document.getElementById("ekoHitung"), kisi = document.getElementById("ekoLogo");
  try {
    const [org, pro, reg] = await Promise.all([muat("organisasi"), muat("proyek"), muat("regulasi")]);
    const per = new Map(org.baris.map((o) => [o.id, o]));
    const n = (k) => org.baris.filter((o) => o.kategori?.kode === k).length;
    hit.innerHTML = HITUNG.map(([k, w, benda, kode]) => `<li><span class="jm-kotak jm-w${w}" aria-hidden="true"></span><b>${esc(angka(benda === "organisasi" ? n(kode) : benda === "proyek" ? pro.baris.length : reg.baris.length))}</b> ${esc(t("beranda.eko.h." + k))}</li>`).join("");
    kisi.innerHTML = EKO.map(([kat, w, isi]) => `<div class="jm-logo-kol"><h3><span class="jm-kotak jm-w${w}" aria-hidden="true"></span>${esc(t("beranda.eko.k." + kat))}</h3>${isi.map(([id, slug]) => {
      const o = per.get(id); if (!o) return "";
      const nama = o.nama.replace(/^PT\s+/i, "");
      return `<a class="jm-logo" href="/direktori?tampil=lembaga">${LOGO.has(slug) ? `<img src="/img/logo/${slug}.png" width="40" height="40" alt="" loading="lazy">` : `<span class="jm-logo-ini jm-w${w}" aria-hidden="true">${esc(inisial(nama))}</span>`}<span>${esc(nama)}</span></a>`;
    }).join("")}</div>`).join("");
  } catch (e) { kisi.innerHTML = galatHtml("layanan"); }
}

/* ---------- cari global ---------- */
const GRUP = [
  ["proyek", (x) => `${x.nama} ${x.lokasi?.provinsi || ""} ${x.teknologi || ""}`, (x) => x.nama, (x) => x.lokasi?.provinsi, () => "/direktori?tampil=proyek"],
  ["organisasi", (x) => `${x.nama} ${x.singkatan || ""}`, (x) => x.nama, (x) => x.kategori?.label, () => "/direktori?tampil=lembaga"],
  ["orang", (x) => `${x.nama} ${x.jabatan_terkini || ""} ${x.organisasi_terkini || ""}`, (x) => x.nama, (x) => x.organisasi_terkini, () => "/direktori?tampil=pakar"],
  ["regulasi", (x) => `${x.judul} ${namaRegulasi(x)} ${x.nomor} tahun ${x.tahun}`, (x) => namaRegulasi(x), (x) => x.judul, (x) => `/regulasi?id=${encodeURIComponent(x.id)}`],
];
async function siapkanIndeks() {
  indeks ??= Promise.all(GRUP.map(([k]) => muat(k))).then((d) => GRUP.map((g, i) => ({ g, baris: d[i].baris.map((x) => ({ x, c: norm(g[1](x)) })) })));
  return indeks;
}
let giliran = 0;
async function cari(q) {
  const hasil = document.getElementById("hasil"), ini = ++giliran, kunci = norm(q.trim());
  if (kunci.length < 2) { hasil.hidden = true; return; }
  hasil.hidden = false;
  let idx;
  try { hasil.innerHTML = hantuHtml(3); idx = await siapkanIndeks(); } catch (e) { indeks = null; hasil.innerHTML = galatHtml("layanan"); return; }
  if (ini !== giliran) return;
  const kata = kunci.split(/\s+/);
  const grup = idx.map(({ g, baris }) => ({ g, cocok: baris.filter((b) => kata.every((k) => b.c.includes(k))) })).filter((o) => o.cocok.length);
  hasil.innerHTML = grup.length ? grup.map(({ g, cocok }) => `<div><h3>${esc(t("beranda.cari." + g[0]))} (${esc(angka(cocok.length))})</h3><ul>${cocok.slice(0, 4).map(({ x }) => `<li><a href="${esc(g[4](x))}">${esc(g[2](x))}<small>${esc(g[3](x) || "")}</small></a></li>`).join("")}</ul></div>`).join("") : `<p>${esc(t("jm.kosong.cocok"))}</p>`;
}

async function main() {
  await mulaiHalaman();
  gambarJalur();
  document.getElementById("kartu").innerHTML = hantuHtml(2);
  const mulai = async () => {
    try { R = await muat("ringkas"); } catch (e) { document.getElementById("kartu").innerHTML = galatHtml("layanan"); return; }
    gambarKartu(); nanti(() => { gambarEkosistem(); gambarDataset(R); gambarBerita(); gambarProyek(); });
  };
  await mulai();
  pasangBawah();
  document.getElementById("kartu").addEventListener("click", (e) => e.target.closest("[data-aksi=ulang]") && mulai());
  const input = document.getElementById("cari");
  input.addEventListener("focus", () => siapkanIndeks().catch(() => { indeks = null; }), { once: true });
  const tunda = debounce((q) => cari(q));
  input.addEventListener("input", () => tunda(input.value));
  document.getElementById("cariTbl").addEventListener("click", () => cari(input.value));
  input.addEventListener("keydown", (e) => e.key === "Enter" && cari(input.value));
  document.addEventListener("jm:bahasa", () => nanti(() => { gambarJalur(); R && gambarKartu(); gambarEkosistem(); R && gambarDataset(R); gambarBerita(); gambarProyek(); input.value && cari(input.value); }));
}
main();
