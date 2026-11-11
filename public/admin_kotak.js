/* /admin: tab Kotak masuk kurasi terpadu. Satu antrean untuk semua yang menunggu putusan kurator/admin.
   Butir D1 dari GET /api/admin/kotak (hitungan + penugasan); butir statis dibaca klien dari JSON publik (tanpa panggilan server).
   Tombol hanya mengarah ke alat yang sudah ada; satu-satunya tulisan di sini adalah "ambil/lepas butir" (kotak_tugas).
   INP: ubin saring dan nomor halaman berubah seketika; render tabel menyusul lewat nanti(). */
import { t, angka } from "/i18n.js";
import { esc, api, nanti, hantuHtml, kosongHtml, galatTeks, ikon, pesanHtml } from "/inti/umum.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { data, kepalaTab, ubinKepala, keadaan } from "/admin_umum.js";

const PER = 25, HARI = 86400;
/* [jenis, ikon, sumber, alat tujuan]. sumber d1 = tabel antrean di D1; data = berkas JSON publik. */
const JENIS = [
  ["koreksi", "ubah", "d1", "/admin?tab=koreksi"], ["portal", "centang", "d1", "/admin?tab=portal"], ["surel", "surel", "d1", "/admin?tab=surel"],
  ["pendaftaran", "orang", "d1", "/admin?tab=persetujuan"], ["lowongan", "kartu", "d1", "/kerja"],
  ["logo", "gambar", "data"], ["belum", "peringatan", "data"], ["pemasok", "perisai", "data"], ["psn", "tabel", "data"],
  ["kawasan", "direktori", "data"], ["dedup", "salin", "data"], ["tautan", "tautan", "data"],
];
const KUNCI = JENIS.map((j) => j[0]);
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
const hrefRef = (ref) => {
  const [tipe, id] = String(ref || "").split(/:(.*)/s);
  return !id ? "" : tipe === "organisasi" ? "/o/" + encodeURIComponent(id) : tipe === "proyek" ? "/p/" + encodeURIComponent(id) : tipe === "regulasi" ? "/regulasi?id=" + encodeURIComponent(id) : "";
};
const hariDari = (unix, kini) => Math.max(0, Math.floor((kini - unix) / HARI));

/* butir statis: [{jenis, id, judul, sub, ref, dibuat(detik, tanggal berkas), href}] */
const tgl = (s) => { const d = Date.parse(s); return Number.isFinite(d) ? Math.floor(d / 1000) : Math.floor(Date.now() / 1000); };
const muatStatis = async () => {
  const ambil = (url) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error(url)))).catch(() => null);
  const [org, pg, pw, psn, ki, dd, ks] = await Promise.all([data("organisasi").catch(() => null), ambil("/data/global/pelaku_global.json"), ambil("/data/global/pemasok_wte.json"),
    data("psn").catch(() => null), ambil("/data/kawasan_industri.json"), Promise.resolve(null), data("konsistensi").catch(() => null)]);
  const o = [];
  for (const b of org?.baris || []) if (!b.logo) o.push({ jenis: "logo", id: "org:" + b.id, judul: b.nama, sub: b.kategori?.label || "", ref: "organisasi:" + b.id, dibuat: tgl(org.dibangun_pada) });
  if (pg) {
    const peta = new Map((pg.baris || []).map((b) => [b.nama, b.org_id]));
    for (const n of pg.belum_terverifikasi || []) o.push({ jenis: "belum", id: "pg:" + slug(n), judul: n, sub: "", ref: peta.get(n) ? "organisasi:" + peta.get(n) : "", dibuat: tgl(pg.dibangun_pada) });
  }
  for (const b of pw?.baris || []) if (/^perlu-tinjau/.test(b.teknologi_status || "")) o.push({ jenis: "pemasok", id: "pw:" + b.id, judul: b.nama, sub: b.negara || "", ref: "organisasi:" + b.id, dibuat: tgl(pw.dibangun_pada) });
  for (const b of psn?.baris || []) if (b.tingkat_bukti === "media") o.push({ jenis: "psn", id: "psn:" + b.id, judul: b.nama, sub: b.sektor || "", ref: "", dibuat: tgl(psn.dibangun_pada) });
  for (const b of ki?.baris || []) if (!b.diriset) o.push({ jenis: "kawasan", id: "ki:" + b.id, judul: b.nama, sub: b.provinsi || "", ref: "", dibuat: tgl(ki.dibangun_pada) });
  for (const [kel, tipe] of [["organisasi", "organisasi"], ["proyek", "proyek"]]) for (const [grup, daftar] of Object.entries(dd?.[kel] || {})) for (const [a, b, ket] of Array.isArray(daftar) ? daftar : [])
    o.push({ jenis: "dedup", id: `dd:${a}:${b}`.slice(0, 120), judul: ket || `${a} / ${b}`, sub: grup, ref: `${tipe}:${a}`, dibuat: tgl("2026-11-08") });
  (ks?.gagal?.tautan_mati || []).forEach((x, i) => {
    const url = typeof x === "string" ? x : x?.url || x?.tautan || "";
    o.push({ jenis: "tautan", id: "tm:" + (slug(url) || i).slice(0, 100), judul: url || String(i + 1), sub: x?.halaman || x?.dari || "", ref: "", href: /^https?:\/\//i.test(url) ? url : "", dibuat: tgl(ks.dibangun_pada) });
  });
  return o;
};

export function panelKotak(panel) {
  const S = { jenis: "", urut: "tua", hal: 1, butir: [], tugas: new Map(), saya: 0, hitungD1: {}, galat: null };
  panel.innerHTML = `${kepalaTab("lonceng", "kt.ey", "kt.j", "kt.d")}<div id="ktPesan" aria-live="polite"></div><div id="ktUbin" class="jm-kt-ubin">${hantuHtml(2)}</div>
    <div class="jm-bar jm-adm-bar1"><select data-ikon="urut" class="jm-pilih" id="ktUrut" aria-label="${esc(t("kt.urut"))}"><option value="tua">${esc(t("kt.urut.tua"))}</option><option value="baru">${esc(t("kt.urut.baru"))}</option></select></div>
    <div id="ktDaftar" aria-live="polite"></div><div class="jm-hal" id="ktHal"></div>`;
  const $ = (i) => panel.querySelector("#" + i);
  const kini = () => Math.floor(Date.now() / 1000);

  panel.addEventListener("change", (e) => { if (e.target.id === "ktUrut") { S.urut = e.target.value; S.hal = 1; nanti(gambar); } });
  panel.addEventListener("click", async (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.hal) { S.hal = +b.dataset.hal; sorotHalaman(b, S.hal); nanti(gambar); return; }
    if (b.dataset.jenis !== undefined) { S.jenis = S.jenis === b.dataset.jenis ? "" : b.dataset.jenis; S.hal = 1; ubin(); nanti(gambar); return; }
    const a = b.dataset.aksi; if (a !== "ambil" && a !== "lepas") return;
    b.disabled = true;
    try {
      const [jenis, butir] = [b.dataset.j, b.dataset.b];
      if (a === "ambil") await api("/api/admin/kotak/tugas", { metode: "PUT", badan: { jenis, butir } });
      else await api("/api/admin/kotak/tugas?" + new URLSearchParams({ jenis, butir }), { metode: "DELETE" });
      await muatTugas(); gambar(); ubin();
    } catch (er) { b.disabled = false; $("ktPesan").innerHTML = pesanHtml("galat", er.status === 409 ? t("kt.diambil") : galatTeks(er.kode || "umum")); }
  });

  const kunciTugas = (x) => (x.sumber === "d1" ? x.jenis : "statis") + "\u0001" + x.id;
  async function muatTugas() { const d = await api("/api/admin/kotak"); S.tugas = new Map(d.tugas.map((x) => [x.jenis + "\u0001" + x.butir, x])); S.saya = d.saya; return d; }
  (async () => {
    try {
      const [d, statis] = await Promise.all([api("/api/admin/kotak"), muatStatis().catch(() => [])]);
      S.tugas = new Map(d.tugas.map((x) => [x.jenis + "\u0001" + x.butir, x])); S.saya = d.saya; S.hitungD1 = d.hitung;
      S.butir = [...d.butir.map((x) => ({ ...x, sumber: "d1" })), ...statis.map((x) => ({ ...x, sumber: "data", status: "" }))];
    } catch (e) { S.galat = e.kode || "umum"; }
    nanti(() => { if (!panel.isConnected) return; ubin(); gambar(); });
  })();

  const hitung = () => { const h = Object.fromEntries(KUNCI.map((k) => [k, 0])); for (const x of S.butir) h[x.jenis] = (h[x.jenis] || 0) + 1; for (const [k, n] of Object.entries(S.hitungD1)) h[k] = n; return h; };
  function ubin() {
    const el = $("ktUbin"); if (!el) return;
    if (S.galat) { el.innerHTML = ""; return; }
    const h = hitung(), total = KUNCI.reduce((s, k) => s + h[k], 0), saya = [...S.tugas.values()].filter((x) => x.akun_id === S.saya).length;
    ubinKepala(panel, [{ ikon: "lonceng", nilai: total, label: t("kt.k.total") }, { ikon: "orang", nilai: saya, label: t("kt.k.saya") },
      { ikon: "tabel", nilai: KUNCI.filter((k) => JENIS.find((j) => j[0] === k)[2] === "d1").reduce((s, k) => s + h[k], 0), label: t("kt.k.d1") }, { ikon: "info", nilai: KUNCI.filter((k) => JENIS.find((j) => j[0] === k)[2] === "data").reduce((s, k) => s + h[k], 0), label: t("kt.k.data") }]);
    el.innerHTML = `<ul class="jm-hi-grid jm-kt-grid">${JENIS.map(([k, ik]) => `<li><button type="button" class="jm-hi-u jm-kt-j jm-kt-j-${k}${h[k] ? " jm-hi-aktif" : " jm-adm-nol"}" data-jenis="${k}" aria-pressed="${S.jenis === k}"><span class="jm-hi-ang">${ikon(ik, 20)}<strong>${esc(angka(h[k]))}</strong></span><span class="jm-hi-lbl">${esc(t("kt.j." + k))}</span></button></li>`).join("")}</ul>`;
  }
  function gambar() {
    const el = $("ktDaftar"); if (!el) return;
    if (S.galat) { el.innerHTML = keadaan(S.galat); $("ktHal").innerHTML = ""; return; }
    const sekarang = kini();
    const umur = (x) => hariDari(x.dibuat, sekarang);
    const daftar = S.butir.filter((x) => !S.jenis || x.jenis === S.jenis).sort((a, b) => (S.urut === "tua" ? a.dibuat - b.dibuat : b.dibuat - a.dibuat));
    if (!daftar.length) { el.innerHTML = kosongHtml("kt.kosong"); $("ktHal").innerHTML = ""; return; }
    const hal = Math.min(S.hal, Math.ceil(daftar.length / PER)), ik = Object.fromEntries(JENIS.map((j) => [j[0], j[1]]));
    const baris = daftar.slice((hal - 1) * PER, hal * PER).map((x) => {
      const link = hrefRef(x.ref), tugas = S.tugas.get(kunciTugas(x));
      const judul = link ? `<a href="${esc(link)}">${esc(x.judul)}</a>` : `<b>${esc(x.judul)}</b>`;
      const alat = x.href || JENIS.find((j) => j[0] === x.jenis)[3] || link || "/admin?tab=koreksi";
      const luar = /^https?:/i.test(alat);
      const kj = x.sumber === "d1" ? x.jenis : "statis";
      const tombol = !tugas ? `<button type="button" class="jm-tbl jm-tbl-kecil" data-aksi="ambil" data-j="${esc(kj)}" data-b="${esc(x.id)}">${ikon("orang", 16)}${esc(t("kt.a.ambil"))}</button>`
        : tugas.akun_id === S.saya ? `<button type="button" class="jm-tbl jm-tbl-kecil" data-aksi="lepas" data-j="${esc(kj)}" data-b="${esc(x.id)}">${ikon("silang", 16)}${esc(t("kt.a.lepas"))}</button>` : "";
      return `<tr><td data-l="${esc(t("kt.c.jenis"))}"><span class="jm-pil jm-kt-j jm-kt-j-${esc(x.jenis)}">${ikon(ik[x.jenis], 14)}${esc(t("kt.j." + x.jenis))}</span></td>
        <td data-l="${esc(t("kt.c.butir"))}">${judul}${x.sub ? `<small>${esc(x.sub)}</small>` : ""}</td>
        <td class="jm-nowrap" data-l="${esc(t("kt.c.umur"))}" data-urut="${x.dibuat}">${esc(t("kt.umur", { n: angka(umur(x)) }))}</td>
        <td data-l="${esc(t("kt.c.status"))}"><span class="jm-pil jm-pil-warn">${esc(t(x.status ? "kt.s." + x.status : "kt.s.tinjau"))}</span></td>
        <td data-l="${esc(t("kt.c.penangan"))}">${tugas ? esc(tugas.nama) : '<span class="jm-bantu">-</span>'}</td>
        <td data-l="${esc(t("admin.k.aksi"))}"><div class="jm-sel-aksi"><a class="jm-tbl jm-tbl-kecil jm-tbl-utama" href="${esc(alat)}" ${alat.startsWith("/admin?tab=") ? ` data-ke="${esc(alat.slice(11))}"` : ""}${luar ? ' target="_blank" rel="noopener noreferrer"' : ""}>${ikon("panah-kanan", 16)}${esc(t("kt.a.buka"))}</a>${tombol}</div></td></tr>`;
    }).join("");
    el.innerHTML = `<div class="jm-gulir"><table class="jm-tabel jm-adm-tabel-k"><thead><tr>${["kt.c.jenis", "kt.c.butir", "kt.c.umur", "kt.c.status", "kt.c.penangan"].map((k) => `<th scope="col">${esc(t(k))}</th>`).join("")}<th scope="col" data-urut="tidak">${esc(t("admin.k.aksi"))}</th></tr></thead><tbody>${baris}</tbody></table></div>`;
    $("ktHal").innerHTML = paginasiHtml({ hal, total: daftar.length, per: PER, satuan: "kt.pag" });
  }
}
