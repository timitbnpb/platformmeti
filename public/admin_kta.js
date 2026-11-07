/* /admin: tab KTA (migrasi 0017). Daftar anggota (basis R2) digabung dengan status KTA; terbitkan, setujui klaim, perpanjang, cabut,
   masa berlaku massal, ekspor CSV. Hanya admin. Server: /api/admin/kta*, /api/admin/anggota-meti. */
import { t, angka, tanggal } from "/i18n.js";
import { esc, api, nanti, debounce, hantuHtml, kosongHtml, galatHtml, galatTeks, ikon, pesanHtml } from "/inti/umum.js";

const BARIS = 50;
const JENIS = ["individu", "utama", "biasa", "luar biasa", "kehormatan"];
const STATUS = ["belum", "tertunda", "aktif", "kedaluwarsa", "dicabut"];
const DARI_ANGGOTA = { individu: "individu", utama: "utama", perusahaan: "biasa", organisasi: "biasa", koperasi: "biasa" };
const NADA = { belum: "", tertunda: "jm-pil-warn", aktif: "jm-pil-ok", kedaluwarsa: "jm-pil-warn", dicabut: "jm-pil-bad" };
const URUT_RANK = { tertunda: 0, kedaluwarsa: 1, belum: 2, aktif: 3, dicabut: 4 };
const labelJenis = (j) => t("kta.jenis." + j.replace(/ /g, "-"));
const opsiJenis = (pilih, semua) => (semua ? `<option value="">${esc(t("adm.kta.f.jenis_semua"))}</option>` : "") + JENIS.map((j) => `<option value="${j}"${j === pilih ? " selected" : ""}>${esc(labelJenis(j))}</option>`).join("");
const akhirTahun = (th) => `${th}-12-31`;

export function panelKta(panel) {
  const S = { baris: [], saring: [], cari: "", status: "", urut: "", arah: 1, hal: 1, ctl: null, dlg: null };
  panel.innerHTML = `<p class="jm-bantu">${esc(t("adm.kta.catatan"))}</p>
    <div id="kRingkas"></div>
    <div class="jm-bar jm-adm-bar1">
      <div class="jm-medan"><label class="sr" for="kCari">${esc(t("adm.kta.cari"))}</label><input class="jm-isian" id="kCari" type="search" autocomplete="off" placeholder="${esc(t("adm.kta.cari"))}"></div>
      <select data-ikon="status" class="jm-pilih" id="kStatus" aria-label="${esc(t("adm.kta.f.status"))}"><option value="">${esc(t("adm.kta.f.semua"))}</option>${STATUS.map((s) => `<option value="${s}">${esc(t("adm.kta.status." + s))}</option>`).join("")}</select>
      <button type="button" class="jm-tbl" data-k="massal">${ikon("kalender", 18)}${esc(t("adm.kta.massal"))}</button>
      <a class="jm-tbl" href="/api/admin/kta?format=csv" download>${ikon("csv", 18)}${esc(t("adm.kta.csv"))}</a>
    </div>
    <p class="jm-bantu" id="kHitung" aria-live="polite"></p>
    <div id="kIsi" aria-live="polite"></div>
    <div id="kPesan" aria-live="polite"></div>
    <dialog class="jm-dlg" id="kDlg" aria-labelledby="kDlgJudul"></dialog>`;
  const $ = (id) => panel.querySelector("#" + id);
  const dlg = $("kDlg");
  const kabari = (j, tk) => { $("kPesan").innerHTML = tk ? pesanHtml(j, tk) : ""; };

  async function muat() {
    if (S.ctl) S.ctl.abort();
    S.ctl = new AbortController();
    $("kIsi").innerHTML = hantuHtml(4);
    try {
      const [a, k] = await Promise.all([api("/api/admin/anggota-meti", { signal: S.ctl.signal }), api("/api/admin/kta", { signal: S.ctl.signal })]);
      nanti(() => { gabung(a.baris || [], k.baris || []); saring(); gambar(); });
    } catch (e) { if (e.name !== "AbortError") $("kIsi").innerHTML = galatHtml(e.kode || "umum"); }
  }
  function gabung(anggota, kta) {
    const peta = new Map(kta.map((k) => [k.anggota_id, k]));
    S.baris = anggota.map((a) => { const k = peta.get(a.id) || null; peta.delete(a.id); return { id: a.id, nama: a.nama || "", instansi: a.instansi || "", jenisAng: a.jenis || "", kta: k, st: k ? k.status_ef : "belum" }; });
    for (const k of peta.values()) S.baris.push({ id: k.anggota_id, nama: k.nama_cetak, instansi: k.instansi || "", jenisAng: "", kta: k, st: k.status_ef }); // anggota sudah tak ada di basis
  }
  function saring() {
    const q = S.cari.trim().toLowerCase();
    S.saring = S.baris.filter((r) => (!S.status || r.st === S.status) && (!q || r.nama.toLowerCase().includes(q) || (r.kta?.nomor_kta || "").toLowerCase().includes(q)));
    const nilai = { nama: (r) => r.nama.toLowerCase(), status: (r) => URUT_RANK[r.st], berlaku: (r) => r.kta?.berlaku_sampai || "", nomor: (r) => r.kta?.nomor_kta || "" }[S.urut];
    S.saring.sort(nilai ? (x, y) => (nilai(x) > nilai(y) ? 1 : nilai(x) < nilai(y) ? -1 : 0) * S.arah : (x, y) => URUT_RANK[x.st] - URUT_RANK[y.st] || x.nama.localeCompare(y.nama));
  }
  const hitung = (st) => S.baris.filter((r) => r.st === st).length;
  function gambar() {
    $("kRingkas").innerHTML = `<ul class="kta-ubin">${[["adm.kta.r.total", S.baris.length], ["adm.kta.r.aktif", hitung("aktif")], ["adm.kta.r.tertunda", hitung("tertunda")], ["adm.kta.r.lewat", hitung("kedaluwarsa")], ["adm.kta.r.cabut", hitung("dicabut")]]
      .map(([k, n]) => `<li><b>${esc(angka(n))}</b><span>${esc(t(k))}</span></li>`).join("")}</ul>`;
    const n = S.saring.length, maks = Math.max(1, Math.ceil(n / BARIS));
    S.hal = Math.min(S.hal, maks);
    $("kHitung").textContent = t("adm.kta.n", { n: angka(n) });
    if (!n) { $("kIsi").innerHTML = kosongHtml("adm.kta.kosong"); return; }
    const th = (kunci, k) => (k
      ? `<th scope="col" aria-sort="${S.urut === k ? (S.arah > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-adm-urut" data-k="urut" data-u="${k}">${esc(t(kunci))}</button></th>`
      : `<th scope="col">${esc(t(kunci))}</th>`);
    const baris = S.saring.slice((S.hal - 1) * BARIS, S.hal * BARIS).map((r) => {
      const k = r.kta, L = (kunci) => `data-l="${esc(t(kunci))}"`;
      const aksi = (a, kunci, ik) => `<button type="button" class="jm-tbl jm-tbl-kecil${a === "cabut" || a === "tolak" ? " jm-tbl-bahaya" : ""}" data-k="${a}" data-id="${esc(r.id)}" title="${esc(t(kunci))}" aria-label="${esc(t("adm.kta.a.untuk", { aksi: t(kunci), nama: r.nama }))}">${ikon(ik, 18)}</button>`;
      const tombol = r.st === "belum" || r.st === "dicabut" ? aksi("terbit", "adm.kta.a.terbit", "tambah")
        : r.st === "tertunda" ? aksi("setujui", "adm.kta.a.setujui", "centang") + aksi("tolak", "adm.kta.a.tolak", "silang")
        : aksi("perpanjang", "adm.kta.a.perpanjang", "kalender") + aksi("cabut", "adm.kta.a.cabut", "blokir");
      return `<tr><td ${L("adm.kta.k.nama")}><strong>${esc(r.nama)}</strong>${r.instansi ? `<br><small>${esc(r.instansi)}</small>` : ""}</td>
        <td ${L("adm.kta.k.sumber")}>${esc(r.jenisAng || "-")}</td><td ${L("adm.kta.k.nomor")}>${esc(k?.nomor_kta || "-")}</td>
        <td ${L("adm.kta.k.jenis")}>${k ? esc(labelJenis(k.jenis)) : "-"}</td>
        <td ${L("adm.kta.k.status")}><span class="jm-pil ${NADA[r.st]}">${esc(t("adm.kta.status." + r.st))}</span></td>
        <td ${L("adm.kta.k.berlaku")}>${k?.berlaku_sampai ? esc(tanggal(k.berlaku_sampai)) : "-"}</td>
        <td ${L("adm.kta.k.akun")}>${esc(k?.akun_surel || "-")}</td>
        <td ${L("adm.kta.k.aksi")}><span class="jm-adm-acts">${tombol}${k?.ada_bukti && r.st === "tertunda" ? `<a class="jm-tbl jm-tbl-kecil" href="/api/admin/kta/${k.id}/bukti" download title="${esc(t("adm.kta.a.bukti"))}" aria-label="${esc(t("adm.kta.a.bukti"))}">${ikon("unduh", 18)}</a>` : ""}</span></td></tr>`;
    }).join("");
    $("kIsi").innerHTML = `<div class="jm-gulir"><table class="jm-tabel jm-adm-tabel"><thead><tr>${th("adm.kta.k.nama", "nama")}${th("adm.kta.k.sumber")}${th("adm.kta.k.nomor", "nomor")}${th("adm.kta.k.jenis")}${th("adm.kta.k.status", "status")}${th("adm.kta.k.berlaku", "berlaku")}${th("adm.kta.k.akun")}${th("adm.kta.k.aksi")}</tr></thead><tbody>${baris}</tbody></table></div>
      ${maks > 1 ? `<div class="jm-bar"><button type="button" class="jm-tbl jm-tbl-kecil" data-k="hal-"${S.hal <= 1 ? " disabled" : ""} aria-label="${esc(t("jm.sebelumnya"))}">${ikon("panah-kiri", 18)}</button><span>${esc(t("adm.kta.hal", { n: angka(S.hal), m: angka(maks) }))}</span><button type="button" class="jm-tbl jm-tbl-kecil" data-k="hal+"${S.hal >= maks ? " disabled" : ""} aria-label="${esc(t("jm.berikutnya"))}">${ikon("panah-kanan", 18)}</button></div>` : ""}`;
  }

  /* ---------- dialog aksi ---------- */
  const tahunIni = new Date().getFullYear();
  function bukaDialog(aksi, r) {
    const k = r?.kta, jenis0 = k?.jenis || DARI_ANGGOTA[r?.jenisAng] || "individu";
    const kepala = (kunci) => `<h2 id="kDlgJudul">${esc(t(kunci))}</h2>${r ? `<p><strong>${esc(r.nama)}</strong></p>` : ""}`;
    const tgl = (nilai) => `<div class="jm-medan"><label for="dBerlaku">${esc(t("adm.kta.f.berlaku"))}</label><input class="jm-isian" id="dBerlaku" type="date" value="${esc(nilai)}" required></div>`;
    const kaki = (utama, bahaya) => `<div class="jm-aksi-baris"><button type="button" class="jm-tbl" data-d="batal">${esc(t("jm.batal"))}</button><button type="submit" class="jm-tbl ${bahaya ? "jm-tbl-bahaya" : "jm-tbl-utama"}" id="dKirim">${esc(t(utama))}</button></div>`;
    let isi;
    if (aksi === "terbit" || aksi === "setujui") {
      isi = `${kepala(aksi === "terbit" ? "adm.kta.d.terbit" : "adm.kta.d.setujui")}
        <div class="jm-medan"><label for="dJenis">${esc(t("adm.kta.f.jenis"))}</label><select data-ikon="jenis" class="jm-pilih" id="dJenis">${opsiJenis(jenis0)}</select></div>
        ${tgl(akhirTahun(tahunIni))}
        ${aksi === "terbit" && !k?.akun_id ? `<div class="jm-medan"><label for="dAkun">${esc(t("adm.kta.f.akun"))}</label><input class="jm-isian" id="dAkun" type="email" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="120"><span class="jm-bantu">${esc(t("adm.kta.f.akun_bantu"))}</span></div>` : ""}
        ${kaki(aksi === "terbit" ? "adm.kta.a.terbit" : "adm.kta.a.setujui")}`;
    } else if (aksi === "perpanjang") {
      const th = Number((k?.berlaku_sampai || "").slice(0, 4)) || tahunIni;
      isi = `${kepala("adm.kta.d.perpanjang")}${tgl(akhirTahun(Math.max(th, tahunIni) + 1))}${kaki("adm.kta.a.perpanjang")}`;
    } else if (aksi === "massal") {
      isi = `${kepala("adm.kta.d.massal")}<p class="jm-bantu">${esc(t("adm.kta.d.massal_isi"))}</p>
        <div class="jm-medan"><label for="dJenis">${esc(t("adm.kta.f.jenis"))}</label><select data-ikon="jenis" class="jm-pilih" id="dJenis">${opsiJenis("", true)}</select></div>${tgl(akhirTahun(tahunIni + 1))}${kaki("adm.kta.massal")}`;
    } else {
      isi = `${kepala(aksi === "cabut" ? "adm.kta.d.cabut" : "adm.kta.d.tolak")}<p>${esc(t(aksi === "cabut" ? "adm.kta.d.cabut_isi" : "adm.kta.d.tolak_isi", { nama: r.nama }))}</p>${kaki("adm.kta.d.ya", true)}`;
    }
    dlg.innerHTML = `<form class="kta-dlg-form" id="dForm" novalidate data-aksi="${aksi}" data-id="${esc(r?.id || "")}">${isi}<div id="dPesan" aria-live="polite"></div></form>`;
    dlg.showModal();
  }
  async function kirimDialog(e) {
    e.preventDefault();
    const f = e.target, aksi = f.dataset.aksi, r = S.baris.find((x) => x.id === f.dataset.id);
    const v = (id) => f.querySelector("#" + id)?.value.trim() || "";
    const tgl = v("dBerlaku");
    if (["terbit", "setujui", "perpanjang", "massal"].includes(aksi) && !tgl) { f.querySelector("#dPesan").innerHTML = pesanHtml("galat", galatTeks("masukan_salah")); return; }
    const kirim = f.querySelector("#dKirim");
    kirim.disabled = true; kirim.setAttribute("aria-busy", "true");
    try {
      let d = null;
      if (aksi === "terbit") d = await api("/api/admin/kta", { metode: "POST", badan: { anggota_id: r.id, jenis: v("dJenis"), berlaku_sampai: tgl, ...(v("dAkun") ? { akun_surel: v("dAkun") } : {}) } });
      else if (aksi === "massal") d = await api("/api/admin/kta/masa", { metode: "POST", badan: { berlaku_sampai: tgl, ...(v("dJenis") ? { jenis: v("dJenis") } : {}) } });
      else d = await api("/api/admin/kta/" + r.kta.id, { metode: "PATCH", badan: { aksi, ...(aksi === "setujui" ? { jenis: v("dJenis"), berlaku_sampai: tgl } : {}), ...(aksi === "perpanjang" ? { berlaku_sampai: tgl } : {}) } });
      dlg.close();
      kabari("ok", aksi === "massal" ? t("adm.kta.massal_ok", { n: angka(d.diubah) }) : t("adm.kta.berhasil"));
      muat();
    } catch (er) {
      f.querySelector("#dPesan").innerHTML = pesanHtml("galat", galatTeks(er.kode || "umum"));
      kirim.disabled = false; kirim.setAttribute("aria-busy", "false");
    }
  }

  panel.addEventListener("click", (e) => {
    const b = e.target.closest("[data-k]");
    if (!b) { if (e.target.closest("[data-aksi=ulang]")) muat(); return; }
    const k = b.dataset.k;
    if (k === "hal-" || k === "hal+") { S.hal += k === "hal+" ? 1 : -1; nanti(gambar); return; }
    if (k === "urut") { S.arah = S.urut === b.dataset.u ? -S.arah : 1; S.urut = b.dataset.u; nanti(() => { saring(); gambar(); }); return; }
    bukaDialog(k, S.baris.find((x) => x.id === b.dataset.id));
  });
  dlg.addEventListener("click", (e) => { if (e.target.closest('[data-d="batal"]')) dlg.close(); });
  dlg.addEventListener("submit", kirimDialog);
  panel.addEventListener("input", debounce((e) => { if (e.target.id === "kCari") { S.cari = e.target.value; S.hal = 1; nanti(() => { saring(); gambar(); }); } }, 200));
  panel.addEventListener("change", (e) => { if (e.target.id === "kStatus") { S.status = e.target.value; S.hal = 1; nanti(() => { saring(); gambar(); }); } });
  muat();
}
