/* /admin: tab Konten beranda. Server: GET /api/konten-beranda, PUT /api/admin/konten-beranda {kunci, isi}.
   Isi = daftar berurutan. sorotan: [{jenis, id}] (proyek, organisasi, berita); lainnya: [id]. Urut: seret atau tombol naik/turun. */
import { t } from "/i18n.js";
import { esc, api, nanti, hantuHtml, ikon, pesanHtml, galatTeks } from "/inti/umum.js";
import { data, kepalaTab, ubinKepala, keadaan } from "/admin_umum.js";
import { exHtml } from "/inti/komponen.js";

const SEKSI = [["sorotan", "daftar"], ["berita_pilihan", "berita"], ["agenda", "kalender"], ["program", "regulasi"]];
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/* kandidat per seksi: token -> { label, sub }; sorotan memakai token "jenis:id" */
async function kandidat(kunci) {
  const hasil = new Map();
  const dari = async (berkas, jenis, label, sub, awalan) => { for (const r of (await data(berkas)).baris) hasil.set(awalan + r.id, { label: label(r), sub: sub(r), jenis }); };
  if (kunci === "sorotan") {
    await dari("proyek", "proyek", (r) => r.nama, (r) => r.lokasi?.provinsi || "", "proyek:");
    await dari("organisasi", "organisasi", (r) => r.nama, (r) => r.kategori?.label || "", "organisasi:");
    await dari("berita", "berita", (r) => r.judul, (r) => r.media || "", "berita:");
  } else if (kunci === "berita_pilihan") await dari("berita", "berita", (r) => r.judul, (r) => r.media || "", "");
  else if (kunci === "agenda") await dari("kalender", "agenda", (r) => r.judul, (r) => r.tanggal || "", "");
  else await dari("program", "program", (r) => r.nama, (r) => r.ringkas || "", "");
  return hasil;
}
const kenaToken = (kunci, x) => (kunci === "sorotan" ? (x && typeof x === "object" ? `${x.jenis}:${x.id}` : String(x)) : String(x && typeof x === "object" ? x.id : x));
const keIsi = (kunci, tokens) => (kunci === "sorotan" ? tokens.map((k) => { const i = k.indexOf(":"); return { jenis: k.slice(0, i), id: k.slice(i + 1) }; }) : tokens);
const larik = (v) => { if (typeof v === "string") { try { v = JSON.parse(v); } catch (e) { v = []; } } return Array.isArray(v) ? v : []; };

export async function panelBeranda(panel) {
  panel.innerHTML = `${kepalaTab("beranda", "ber.ey", "ber.j", "ber.d")}<div id="bIsi">${hantuHtml(5)}</div>`;
  const isi = panel.querySelector("#bIsi");
  const K = {}, C = {}; // daftar token terpilih; kandidat
  try {
    const d = await api("/api/konten-beranda");
    for (const [k] of SEKSI) K[k] = larik(d?.[k]).map((x) => kenaToken(k, x));
    await Promise.all(SEKSI.map(async ([k]) => { C[k] = await kandidat(k); }));
  } catch (e) { isi.innerHTML = keadaan(e.kode || "umum"); return; }
  const Q = {}; let seret = null;
  nanti(gambar);

  const info = (k, tok) => C[k].get(tok) || { label: tok.replace(/^[a-z]+:/, ""), sub: "", jenis: "" };
  const jenisTeks = (k, i) => (k === "sorotan" && i.jenis ? `<span class="jm-pil">${esc(t("ber.j." + i.jenis))}</span>` : "");

  function gambar() {
    isi.innerHTML = `<div class="jm-adm-dua">${SEKSI.map(([k, ik]) => exHtml({ kelas: "jm-ber", ikon: ik, topik: t("ber.ey"), tingkat: "h3", judulHtml: esc(t("ber.s." + k)), subHtml: esc(t("ber.d." + k)), isiHtml: `<ol class="jm-ber-daftar" data-daftar="${k}"></ol>
      <div class="jm-medan"><label class="sr" for="bc-${k}">${esc(t("ber.cari"))}</label><input class="jm-isian" id="bc-${k}" type="search" autocomplete="off" placeholder="${esc(t("ber.cari"))}" data-cari="${k}"></div>
      <ul class="jm-ber-hasil" data-hasil="${k}"></ul>
      <div class="jm-aksi"><button type="button" class="jm-tbl jm-tbl-utama" data-simpan="${k}">${ikon("centang", 18)}${esc(t("jm.simpan"))}</button><span data-pesan="${k}" role="status"></span></div>` }).replace("<section ", `<section data-k="${k}" `)).join("")}</div>`;
    for (const [k] of SEKSI) daftar(k);
  }
  const ubin = () => ubinKepala(panel, SEKSI.map(([k, ik]) => ({ ikon: ik, nilai: K[k].length, label: t("ber.s." + k) })));
  function daftar(k) {
    ubin();
    const ol = isi.querySelector(`[data-daftar="${k}"]`); if (!ol) return;
    ol.innerHTML = K[k].length ? K[k].map((tok, i) => { const f = info(k, tok); return `<li draggable="true" data-i="${i}"><span class="jm-ber-pegang" aria-hidden="true">${ikon("daftar2", 16)}</span><span class="jm-ber-teks"><b>${esc(f.label)}</b>${f.sub ? `<small>${esc(f.sub)}</small>` : ""}</span>${jenisTeks(k, f)}
      <button type="button" class="jm-tbl jm-tbl-kecil" data-gerak="-1" data-i="${i}" ${i === 0 ? "disabled" : ""} aria-label="${esc(t("ber.naik"))}">${ikon("panah-kiri", 16)}</button><button type="button" class="jm-tbl jm-tbl-kecil" data-gerak="1" data-i="${i}" ${i === K[k].length - 1 ? "disabled" : ""} aria-label="${esc(t("ber.turun"))}">${ikon("panah-kanan", 16)}</button>
      <button type="button" class="jm-tbl jm-tbl-kecil jm-tbl-bahaya" data-hapus="${i}" aria-label="${esc(t("ber.hapus"))}">${ikon("silang", 16)}</button></li>`; }).join("") : `<li class="jm-ber-kosong">${esc(t("ber.kosong"))}</li>`;
  }
  function hasil(k) {
    const ul = isi.querySelector(`[data-hasil="${k}"]`), q = norm(Q[k] || "");
    if (!ul) return;
    if (q.length < 2) { ul.innerHTML = ""; return; }
    const ada = new Set(K[k]), out = [];
    for (const [tok, f] of C[k]) { if (!ada.has(tok) && norm(f.label + " " + f.sub).includes(q)) { out.push([tok, f]); if (out.length >= 8) break; } }
    ul.innerHTML = out.length ? out.map(([tok, f]) => `<li><button type="button" class="jm-tbl jm-tbl-kecil" data-tambah="${esc(tok)}" data-k="${k}" aria-label="${esc(t("ber.tambah"))}">${ikon("tambah", 16)}</button><span class="jm-ber-teks"><b>${esc(f.label)}</b>${f.sub ? `<small>${esc(f.sub)}</small>` : ""}</span>${jenisTeks(k, f)}</li>`).join("") : `<li class="jm-ber-kosong">${esc(t("ber.tak_ada"))}</li>`;
  }
  const kunciDari = (el) => el.closest("[data-k]")?.dataset.k;
  const cariTunda = {};
  isi.addEventListener("input", (e) => {
    const k = e.target.dataset?.cari; if (!k) return;
    Q[k] = e.target.value; clearTimeout(cariTunda[k]); cariTunda[k] = setTimeout(() => nanti(() => hasil(k)), 120);
  });
  isi.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const k = kunciDari(b);
    if (b.dataset.tambah) { K[b.dataset.k].push(b.dataset.tambah); b.disabled = true; nanti(() => { daftar(b.dataset.k); hasil(b.dataset.k); }); }
    else if (b.dataset.gerak) { const i = +b.dataset.i, j = i + +b.dataset.gerak; if (j >= 0 && j < K[k].length) { [K[k][i], K[k][j]] = [K[k][j], K[k][i]]; nanti(() => daftar(k)); } }
    else if (b.dataset.hapus) { K[k].splice(+b.dataset.hapus, 1); nanti(() => { daftar(k); hasil(k); }); }
    else if (b.dataset.simpan) simpan(b.dataset.simpan, b);
    else if (b.dataset.aksi === "ulang") location.reload();
  });
  isi.addEventListener("dragstart", (e) => { const li = e.target.closest("li[data-i]"); if (!li) return; seret = { k: kunciDari(li), i: +li.dataset.i }; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(seret.i)); });
  isi.addEventListener("dragover", (e) => { if (seret && e.target.closest("li[data-i]")) e.preventDefault(); });
  isi.addEventListener("drop", (e) => {
    const li = e.target.closest("li[data-i]"); if (!li || !seret || kunciDari(li) !== seret.k) return;
    e.preventDefault();
    const k = seret.k, [x] = K[k].splice(seret.i, 1); K[k].splice(+li.dataset.i, 0, x); seret = null; nanti(() => daftar(k));
  });
  async function simpan(k, b) {
    const pesan = isi.querySelector(`[data-pesan="${k}"]`);
    b.disabled = true; pesan.innerHTML = "";
    try { await api("/api/admin/konten-beranda", { metode: "PUT", badan: { kunci: k, isi: keIsi(k, K[k]) } }); pesan.innerHTML = pesanHtml("ok", t("admin.tersimpan")); }
    catch (err) { pesan.innerHTML = pesanHtml("galat", err.kode === "fitur_belum_aktif" ? t("adm.belum_aktif") : galatTeks(err.kode || "umum")); }
    b.disabled = false;
  }
}
