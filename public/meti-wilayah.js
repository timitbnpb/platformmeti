/* /meti-wilayah: peta koroplet status METI Wilayah per provinsi + daftar kartu; /meti-wilayah/<kode BPS> membuka profil (meti-wilayah_profil.js).
   Satu sumber status: tabel D1 pilihan admin (/api/meti-wilayah); nama provinsi dari katalog /data/meti-wilayah.json.
   INP: filter mengubah chrome (aria-pressed) seketika; peta dan kartu digambar ulang lewat nanti(). */
import { mulaiHalaman } from "/inti/kepala.js";
import { geserPanel } from "/inti/panel_geser.js";
import { geoProvinsi, jalurPerProvinsi } from "/inti/peta_indonesia.js";
import { khUbin } from "/inti/kh.js";
import { t, tanggal, angka } from "/i18n.js";
import { api, esc, nanti, hantuHtml, galatHtml, GalatApi } from "/inti/umum.js";

export const STATUS = ["berdiri", "segera", "rencana", "belum"];
export const PIL = { berdiri: "jm-pil jm-pil-ok", segera: "jm-pil", rencana: "jm-pil jm-pil-warn", belum: "jm-pil mw-pil-nol" };
const IKON_ST = { berdiri: "centang", segera: "kalender", rencana: "linimasa", belum: "wilayah" };
const $ = (id) => document.getElementById(id);
const S = { kat: null, ap: null, baris: [], filter: "", geo: null };

export const lambang = (kode, u = 40) => `<img class="mw-lb" src="/img/provinsi/${esc(kode)}.png" width="${u}" height="${u}" alt="" loading="lazy" decoding="async">`;
export const pilStatus = (s) => `<span class="jm-pil mw-pil mw-pil-${s}"><svg class="jm-ik" width="12" height="12" aria-hidden="true" focusable="false"><use href="/img/ikon.svg#i-${IKON_PIL[s]}"/></svg>${esc(t("mw.st." + s))}</span>`;
const IKON_PIL = { berdiri: "centang", segera: "kalender", rencana: "linimasa", belum: "wilayah" };
const ik = (n, u = 14) => `<svg class="jm-ik" width="${u}" height="${u}" aria-hidden="true" focusable="false"><use href="/img/ikon.svg#i-${n}"/></svg>`;
const tahunDari = (b) => (b.tgl_pelantikan || "").slice(0, 4);
const cacah = (n) => (typeof n === "number" ? angka(n) : n ? t("mw.kurang10") : "");
/* kartu info provinsi: dipakai tooltip peta dan kartu ponsel */
export function isiKartu(b, tautan) {
  const baris = [["orang", b.ketua && `${esc(t("mw.ketua"))}: <b>${esc(b.ketua)}</b>`], ["lokasi", b.sekretariat && esc(b.sekretariat)], ["tahun", tahunDari(b) && esc(t("mw.tahun", { tahun: tahunDari(b) }))]].filter((x) => x[1]);
  const ang = [["orang", cacah(b.individu), t("mw.u.individu")], ["direktori", cacah(b.organisasi), t("mw.u.organisasi")]].filter((x) => x[1]);
  const aj = `${ik("tautan", 16)}${esc(t("mw.kartu_profil"))}`;
  return `<header>${lambang(b.kode, 48)}<strong>${esc(b.nama)}</strong>${pilStatus(b.status)}</header>
    ${baris.length ? `<ul class="mw-info">${baris.map(([i, v]) => `<li>${ik(i)}<span>${v}</span></li>`).join("")}</ul>` : `<p class="mw-kos">${esc(t("mw.belum_semua"))}</p>`}
    ${ang.length ? `<div class="mw-cacah">${ang.map(([i, v, l]) => `<span>${ik(i, 18)}<b>${esc(v)}</b><small>${esc(l)}</small></span>`).join("")}</div>` : ""}
    ${tautan ? `<a class="mw-ajak" href="/meti-wilayah/${esc(b.kode)}">${aj}</a>` : `<p class="mw-ajak">${aj}</p>`}`;
}
export const namaWilayah = (nama) => t("mw.nama", { prov: nama });
export const tgl = (s) => (s ? tanggal(s, { gaya: "panjang" }) : "");

export async function muatDasar() {
  const [kat, ap] = await Promise.all([
    fetch("/data/meti-wilayah.json", { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new GalatApi("layanan", r.status); return r.json(); }),
    api("/api/meti-wilayah"),
  ]);
  const per = new Map(ap.wilayah.map((w) => [w.kode_prov, w]));
  const baris = kat.provinsi.map((p) => ({ kode: p.kode, nama: p.nama, individu: p.individu, organisasi: p.organisasi, ...(per.get(p.kode) || { status: "belum", bidang: [] }) }));
  return { kat, ap, baris };
}

/* ---------- kepala dan sumber ---------- */
function kepala() {
  khUbin("ubin", STATUS.map((s) => ({ ikon: IKON_ST[s], nilai: angka(S.ap.hitung[s]), label: t("mw.st." + s) })));
  const a = S.ap;
  $("sumber").textContent = a.sumber ? t("mw.sumber", { tanggal: a.status_per ? tgl(a.status_per) : "-", sumber: a.sumber }) + (a.lainnya ? " " + t("mw.sumber_lain", { n: a.lainnya }) : "") : t("mw.sumber_kosong");
}

/* ---------- peta ---------- */
const W = 1000, H = 380;
const dipilih = (b) => !S.filter || b.status === S.filter;

function warnai() {
  const svg = $("peta").querySelector("svg");
  if (!svg) return;
  for (const pa of svg.querySelectorAll("path[data-k]")) {
    const b = S.baris.find((x) => x.kode === pa.dataset.k);
    pa.setAttribute("class", `mw-p mw-s-${b.status}${dipilih(b) ? "" : " mw-redup"}`);
    pa.setAttribute("aria-label", `${namaWilayah(b.nama)}: ${t("mw.st." + b.status)}`);
  }
}

function tampilTip(b, x, y) {
  const tip = $("tip");
  tip.innerHTML = isiKartu(b);
  tip.hidden = false;
  const kotak = $("penuh").getBoundingClientRect();
  const kiri = x + 16 + tip.offsetWidth > kotak.width - 8 ? x - tip.offsetWidth - 16 : x + 16;
  const atas = y + 16 + tip.offsetHeight > kotak.height - 8 ? y - tip.offsetHeight - 16 : y + 16;
  tip.style.left = Math.max(8, kiri) + "px";
  tip.style.top = Math.max(8, atas) + "px";
}

/* zoom: viewBox digeser; tombol tambah = perbesar ke tengah, balik = atur ulang */
let zoom = 1;
function atur(f) {
  const svg = $("peta").querySelector("svg");
  zoom = f ? Math.min(4, zoom * f) : 1;
  const w = W / zoom, h = H / zoom;
  svg.setAttribute("viewBox", `${zoom === 1 ? 0 : (W - w) * 0.62} ${zoom === 1 ? 0 : (H - h) * 0.55} ${w} ${h}`);
}

async function petaSvg() {
  S.geo = await geoProvinsi();
  if (!S.geo) { $("peta").innerHTML = `<p class="jm-bantu">${esc(t("mw.peta_gagal"))}</p>`; return; }
  const ada = new Set(S.baris.map((b) => b.kode));
  const jalur = jalurPerProvinsi(S.geo, W, H).filter((j) => ada.has(j.kode) && j.d);
  $("peta").innerHTML = `<svg class="mw-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" focusable="false">${jalur.map((j) => `<path tabindex="0" role="link" data-k="${esc(j.kode)}" d="${j.d}"/>`).join("")}</svg><div class="mw-zoom">${[["tambah", "perbesar", "mw.zoom_masuk"], ["balik", "atur", "mw.zoom_reset"]].map(([i, a, k]) => `<button type="button" class="mw-zm" data-z="${a}" aria-label="${esc(t(k))}" title="${esc(t(k))}">${ik(i, 18)}</button>`).join("")}</div><div class="mw-kartu-hp" id="kartu-peta" hidden></div>`;
  const svg = $("peta").querySelector("svg"), dasar = $("penuh");
  const buka = (pa) => {
    if (!pa) return;
    if (innerWidth < 900) { const b = S.baris.find((v) => v.kode === pa.dataset.k), k = $("kartu-peta"); k.innerHTML = isiKartu(b, true); k.hidden = false; return; }
    location.assign("/meti-wilayah/" + encodeURIComponent(pa.dataset.k));
  };
  $("peta").addEventListener("click", (e) => { const z = e.target.closest("button[data-z]"); if (z) atur(z.dataset.z === "perbesar" ? 1.6 : 0); });
  const tampil = (pa, x, y) => { const b = S.baris.find((v) => v.kode === pa.dataset.k); tampilTip(b, x, y); };
  svg.addEventListener("mousemove", (e) => { const pa = e.target.closest("path[data-k]"); if (!pa) { $("tip").hidden = true; return; } const k = dasar.getBoundingClientRect(); tampil(pa, e.clientX - k.left, e.clientY - k.top); });
  svg.addEventListener("mouseleave", () => { $("tip").hidden = true; });
  svg.addEventListener("focusin", (e) => { const pa = e.target.closest("path[data-k]"); if (pa) { const r = pa.getBoundingClientRect(), k = dasar.getBoundingClientRect(); tampil(pa, r.left - k.left + r.width / 2, r.top - k.top + r.height / 2); } });
  svg.addEventListener("focusout", () => { $("tip").hidden = true; });
  svg.addEventListener("click", (e) => buka(e.target.closest("path[data-k]")));
  svg.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); buka(e.target.closest("path[data-k]")); } });
  if (innerWidth >= 900) geserPanel($("panel"), { kunci: "panel", batas: dasar });
  warnai();
}

/* ---------- legenda dan filter (satu keadaan) ---------- */
function legenda() {
  const n = (s) => S.ap.hitung[s];
  $("legenda").innerHTML = STATUS.map((s) => `<button type="button" class="mw-lg" data-s="${s}" aria-pressed="${S.filter === s}"><i class="mw-sw mw-s-${s}" aria-hidden="true"></i><span>${esc(t("mw.st." + s))}</span><b>${angka(n(s))}</b></button>`).join("")
    + `<p class="jm-bantu">${esc(t("mw.legenda_bantu"))}</p>`;
  $("saring").innerHTML = [["", t("mw.semua"), S.baris.length], ...STATUS.map((s) => [s, t("mw.st." + s), n(s)])]
    .filter(([v, , c]) => c > 0 || v === S.filter)
    .map(([v, l, c]) => `<button type="button" class="mw-chip" data-s="${v}" aria-pressed="${S.filter === v}">${ik(v ? IKON_PIL[v] : "daftar")}${esc(l)}<small>${angka(c)}</small></button>`).join("");
}

/* ---------- kartu ---------- */
const URUT = Object.fromEntries(STATUS.map((s, i) => [s, i]));
function kartu() {
  const q = ($("cari")?.value || "").trim().toLowerCase();
  const isi = S.baris.filter((b) => dipilih(b) && (!q || b.nama.toLowerCase().includes(q))).sort((a, b) => URUT[a.status] - URUT[b.status] || a.nama.localeCompare(b.nama, "id"));
  $("ringkas").innerHTML = STATUS.filter((s) => S.ap.hitung[s] > 0).map((s) => `<span class="mw-ring">${ik(IKON_PIL[s], 14)}${angka(S.ap.hitung[s])} ${esc(t("mw.st." + s))}</span>`).join("");
  $("j-kartu").textContent = t("mw.n_prov", { n: angka(S.baris.length) });
  $("kisi").innerHTML = isi.map((b) => {
    const kos = `<span class="mw-kos">${esc(t("mw.belum_dicantum"))}</span>`;
    const th = tahunDari(b);
    const kaki = b.status === "belum" ? `${ik("tambah")}${esc(t("mw.daftar_tombol"))}` : `${esc(t("mw.lihat"))}${ik("panah-kanan")}`;
    return `<article class="mw-kartu mw-k-${b.status}"><header>${lambang(b.kode, 40)}<div><h3>${esc(b.nama)}</h3>${pilStatus(b.status)}</div></header>
      <ul class="mw-info"><li>${ik("orang")}<span>${b.ketua ? esc(b.ketua) : `<span class="mw-kos">${esc(t("mw.ketua_belum"))}</span>`}</span></li>${b.sekretariat ? `<li>${ik("lokasi")}<span>${esc(b.sekretariat)}</span></li>` : ""}${th ? `<li>${ik("tahun")}<span>${esc(t("mw.tahun", { tahun: th }))}</span></li>` : ""}</ul>
      <a class="mw-kaki${b.status === "belum" ? " jm-tbl jm-tbl-utama" : ""}" href="/meti-wilayah/${esc(b.kode)}${b.status === "belum" ? "#ajukan" : ""}">${kaki}</a></article>`;
  }).join("") || `<p class="jm-bantu">${esc(t("mw.kosong"))}</p>`;
}

function catatan() {
  const v = S.ap.versi_angka;
  if ($("catatan")) $("catatan").innerHTML = `<p>${esc(t("mw.catatan_isi"))}</p><div class="jm-gulir"><table class="jm-tabel"><thead><tr><th>${esc(t("mw.c.sumber"))}</th><th>${esc(t("mw.c.tanggal"))}</th><th class="jm-num">${esc(t("mw.st.berdiri"))}</th><th class="jm-num">${esc(t("mw.st.segera"))}</th><th class="jm-num">${esc(t("mw.st.rencana"))}</th></tr></thead><tbody>${v.map((x) => `<tr><td data-label="${esc(t("mw.c.sumber"))}">${esc(x.sumber)}</td><td data-label="${esc(t("mw.c.tanggal"))}">${esc(tgl(x.tanggal))}</td><td class="jm-num" data-label="${esc(t("mw.st.berdiri"))}">${esc(x.berdiri ?? "-")}</td><td class="jm-num" data-label="${esc(t("mw.st.segera"))}">${esc(x.segera ?? "-")}</td><td class="jm-num" data-label="${esc(t("mw.st.rencana"))}">${esc(x.rencana ?? "-")}</td></tr>`).join("")}</tbody></table></div><p class="jm-bantu">${esc(t("mw.catatan_kaki"))}</p>`;
}

function gambarDaftar() { kepala(); legenda(); kartu(); catatan(); warnai(); }

// lambang provinsi yang berkasnya tak ada disembunyikan (error tidak menggelembung: tangkap di fase capture)
const sembunyiLambang = (e) => { if (e.target.classList?.contains("mw-lb")) e.target.hidden = true; };

function pasangFilter() {
  const klik = (e) => {
    const b = e.target.closest("button[data-s]");
    if (!b) return;
    S.filter = S.filter === b.dataset.s ? "" : b.dataset.s;
    for (const x of document.querySelectorAll("button[data-s]")) x.setAttribute("aria-pressed", String(x.dataset.s === S.filter)); // chrome urgent
    nanti(() => { warnai(); kartu(); });
  };
  $("saring").addEventListener("click", klik);
  let td; $("cari").addEventListener("input", () => { clearTimeout(td); td = setTimeout(kartu, 120); });
  $("legenda").addEventListener("click", klik);
}

async function mulai() {
  const saya = await mulaiHalaman();
  document.addEventListener("error", sembunyiLambang, true);
  const m = location.pathname.match(/^\/meti-wilayah\/(\d{2})\/?$/);
  const tampilGalat = (e) => { const el = m ? $("profil") : $("kisi"); if (m) { $("daftar").hidden = true; el.hidden = false; } el.innerHTML = galatHtml(e.kode || "umum"); el.querySelector("[data-aksi=ulang]")?.addEventListener("click", () => location.reload()); };
  $("kisi").innerHTML = hantuHtml(4);
  try { Object.assign(S, await muatDasar()); } catch (e) { tampilGalat(e); return; }
  const gambar = async () => {
    if (m) {
      $("daftar").hidden = true; $("profil").hidden = false;
      await (await import("/meti-wilayah_profil.js")).profilWilayah(m[1], S, saya, $("profil"));
    } else { $("daftar").hidden = false; $("profil").hidden = true; gambarDaftar(); }
  };
  await gambar();
  document.addEventListener("jm:bahasa", () => { gambar(); });
  if (!m) { pasangFilter(); nanti(petaSvg); }
}
mulai();
