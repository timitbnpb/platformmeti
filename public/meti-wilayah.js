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
export const pilStatus = (s) => `<span class="${PIL[s]}">${esc(t("mw.st." + s))}</span>`;
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
  tip.innerHTML = `<header>${lambang(b.kode, 32)}<div><strong>${esc(namaWilayah(b.nama))}</strong><small>${esc(t("mw.st." + b.status))}</small></div></header>${b.ketua ? `<p>${esc(t("mw.ketua"))}: <b>${esc(b.ketua)}</b></p>` : ""}`;
  tip.hidden = false;
  const kotak = $("penuh").getBoundingClientRect();
  tip.style.left = Math.max(8, Math.min(kotak.width - tip.offsetWidth - 8, x + 14)) + "px";
  tip.style.top = Math.max(8, Math.min(kotak.height - tip.offsetHeight - 8, y + 14)) + "px";
}

async function petaSvg() {
  S.geo = await geoProvinsi();
  if (!S.geo) { $("peta").innerHTML = `<p class="jm-bantu">${esc(t("mw.peta_gagal"))}</p>`; return; }
  const ada = new Set(S.baris.map((b) => b.kode));
  const jalur = jalurPerProvinsi(S.geo, W, H).filter((j) => ada.has(j.kode) && j.d);
  $("peta").innerHTML = `<svg class="mw-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" focusable="false">${jalur.map((j) => `<path tabindex="0" role="link" data-k="${esc(j.kode)}" d="${j.d}"/>`).join("")}</svg>`;
  const svg = $("peta").querySelector("svg"), dasar = $("penuh");
  const buka = (pa) => pa && location.assign("/meti-wilayah/" + encodeURIComponent(pa.dataset.k));
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
    .map(([v, l, c]) => `<button type="button" class="mw-chip" data-s="${v}" aria-pressed="${S.filter === v}">${esc(l)}<small>${angka(c)}</small></button>`).join("");
}

/* ---------- kartu ---------- */
const URUT = Object.fromEntries(STATUS.map((s, i) => [s, i]));
function kartu() {
  const isi = S.baris.filter(dipilih).sort((a, b) => URUT[a.status] - URUT[b.status] || a.nama.localeCompare(b.nama, "id"));
  $("kisi").innerHTML = isi.map((b) => {
    const nama = namaWilayah(b.nama);
    const baris = [
      b.ketua ? [t("mw.ketua"), b.ketua] : null,
      b.sekretariat ? [t("mw.sekretariat"), b.sekretariat] : null,
      b.tgl_pelantikan ? [t("mw.tgl_pelantikan"), tgl(b.tgl_pelantikan)] : null,
    ].filter(Boolean);
    return `<a class="mw-kartu mw-k-${b.status}" href="/meti-wilayah/${esc(b.kode)}"><header>${lambang(b.kode, 44)}<div><h3>${esc(nama)}</h3>${pilStatus(b.status)}</div></header>
      ${baris.length ? `<dl>${baris.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : `<p class="jm-bantu">${esc(t(b.status === "belum" ? "mw.kartu_belum" : "mw.kartu_kosong"))}</p>`}</a>`;
  }).join("") || `<p class="jm-bantu">${esc(t("mw.kosong"))}</p>`;
}

function catatan() {
  const v = S.ap.versi_angka;
  $("catatan").innerHTML = `<p>${esc(t("mw.catatan_isi"))}</p><div class="jm-gulir"><table class="jm-tabel"><thead><tr><th>${esc(t("mw.c.sumber"))}</th><th>${esc(t("mw.c.tanggal"))}</th><th class="jm-num">${esc(t("mw.st.berdiri"))}</th><th class="jm-num">${esc(t("mw.st.segera"))}</th><th class="jm-num">${esc(t("mw.st.rencana"))}</th></tr></thead><tbody>${v.map((x) => `<tr><td data-label="${esc(t("mw.c.sumber"))}">${esc(x.sumber)}</td><td data-label="${esc(t("mw.c.tanggal"))}">${esc(tgl(x.tanggal))}</td><td class="jm-num" data-label="${esc(t("mw.st.berdiri"))}">${esc(x.berdiri ?? "-")}</td><td class="jm-num" data-label="${esc(t("mw.st.segera"))}">${esc(x.segera ?? "-")}</td><td class="jm-num" data-label="${esc(t("mw.st.rencana"))}">${esc(x.rencana ?? "-")}</td></tr>`).join("")}</tbody></table></div><p class="jm-bantu">${esc(t("mw.catatan_kaki"))}</p>`;
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
