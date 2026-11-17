/* /admin: tab Event. Atur pendaftaran per acara (buka/tutup, kuota, batas, contact person), lihat peserta, unduh CSV. Hak ditegakkan di server (admin dan super).
   F65-201..204: catat hadir dari kode tiket, tutup acara (membuka sertifikat dan survei), laporan agregat. Kamera diblokir Permissions-Policy situs,
   jadi kode diketik atau dibaca pemindai genggam (yang mengetik seperti papan ketik); tidak ada pemindai kamera. */
import { t, angka, tanggal, tanggalDariUnix, jam as jamTeks } from "/i18n.js";
import { esc, api, nanti, hantuHtml, kosongHtml, galatHtml, galatTeks, ikon, pesanHtml } from "/inti/umum.js";
import { muatAcara, hariIni, urlEvent } from "/event_umum.js";

export function panelEvent(el) {
  const S = { acara: [], api: { atur: {}, terdaftar: {} }, slug: "" };
  const $ = (id) => el.querySelector("#" + id);
  const dlg = document.getElementById("dlg");
  const kabar = (jenis, teks) => { const s = $("evStatus"); if (s) s.innerHTML = teks ? pesanHtml(jenis, teks) : ""; };
  el.innerHTML = `<div id="evHost"></div><div id="evStatus" aria-live="polite"></div>`;
  const host = $("evHost");
  host.addEventListener("click", klik);
  dlg.addEventListener("submit", simpan);
  dlg.addEventListener("submit", catatHadir);
  dlg.addEventListener("click", klikHadir);
  muat();

  async function muat() {
    host.innerHTML = hantuHtml(5);
    try { const [a, d] = await Promise.all([muatAcara(), api("/api/event")]); S.acara = a.slice().reverse(); S.api = d; } catch (e) { host.innerHTML = galatHtml(e.kode || "umum"); return; }
    nanti(rangka);
  }
  function rangka() {
    const kini = hariIni();
    host.innerHTML = `<header class="jm-adm-bhd"><div><h3>${esc(t("adm.event.j"))}</h3><p class="jm-bantu">${esc(t("adm.event.bantu"))}</p></div></header><div class="jm-gulir"><table class="jm-tabel"><thead><tr>${["acara", "tgl", "status", "terdaftar", "kuota", "batas", "aksi"].map((k) => `<th scope="col">${esc(t("adm.event.k." + k))}</th>`).join("")}</tr></thead><tbody>${S.acara.map((b) => {
      const a = S.api.atur[b.slug], n = S.api.terdaftar[b.slug] || 0, lalu = b.akhir < kini;
      return `<tr><td data-l="${esc(t("adm.event.k.acara"))}"><a href="${esc(urlEvent(b))}"><strong>${esc(b.judulTampil)}</strong></a></td><td class="jm-nowrap" data-l="${esc(t("adm.event.k.tgl"))}">${esc(tanggal(b.tanggal))}</td>
        <td data-l="${esc(t("adm.event.k.status"))}"><span class="jm-pil ${lalu ? "" : a && a.terbuka ? "jm-pil-ok" : "jm-pil-warn"}">${esc(t(lalu ? "ev.selesai" : a && a.terbuka ? "adm.event.buka" : "adm.event.tutup"))}</span></td>
        <td class="jm-num" data-l="${esc(t("adm.event.k.terdaftar"))}">${esc(angka(n))}</td><td class="jm-num" data-l="${esc(t("adm.event.k.kuota"))}">${a && a.kuota != null ? esc(angka(a.kuota)) : "-"}</td><td class="jm-nowrap" data-l="${esc(t("adm.event.k.batas"))}">${a && a.batas ? esc(tanggal(a.batas)) : "-"}</td>
        <td data-l="${esc(t("adm.event.k.aksi"))}"><button type="button" class="jm-tbl jm-tbl-kecil" data-m="atur" data-slug="${esc(b.slug)}">${ikon("ubah", 16)}<span>${esc(t("adm.event.atur"))}</span></button>
          <button type="button" class="jm-tbl jm-tbl-kecil" data-m="hadir" data-slug="${esc(b.slug)}">${ikon("centang", 16)}<span>${esc(t("adm.event.h.tombol"))}</span></button>
          <a class="jm-tbl jm-tbl-kecil" href="/api/event/${encodeURIComponent(b.slug)}/peserta.csv" download>${ikon("csv", 16)}<span>${esc(t("adm.event.csv"))}</span></a></td></tr>`;
    }).join("")}</tbody></table></div>`;
  }
  function klik(e) {
    const b = e.target.closest("[data-m=atur]"), h = e.target.closest("[data-m=hadir]");
    if (b) bukaAtur(b.dataset.slug);
    else if (h) bukaHadir(h.dataset.slug);
    else if (e.target.closest("[data-aksi=ulang]")) muat();
  }
  function bukaAtur(slug) {
    const b = S.acara.find((x) => x.slug === slug), a = S.api.atur[slug] || {};
    if (!b) return;
    S.slug = slug;
    const k = a.kontak || {}, pribadi = a.kontak && a.kontak.nama !== "Sekretariat METI";
    const f = (id, kunci, nilai, tipe = "text", ekstra = "") => `<div class="jm-medan"><label for="${id}">${esc(t(kunci))}</label><input class="jm-isian" id="${id}" type="${tipe}" value="${esc(nilai ?? "")}" ${ekstra}></div>`;
    dlg.innerHTML = `<form class="jm-form" id="evForm" novalidate data-ev-form><h2 id="dlgJudul">${esc(b.judulTampil)}</h2><p class="jm-bantu">${esc(t("adm.event.terdaftar_n", { n: angka(S.api.terdaftar[slug] || 0) }))}</p>
      <label class="jm-centang"><input type="checkbox" id="evBuka"${a.terbuka ? " checked" : ""}> <span>${esc(t("adm.event.f.terbuka"))}</span></label>
      ${f("evKuota", "adm.event.f.kuota", a.kuota, "number", 'min="1" max="100000"')}${f("evBatas", "adm.event.f.batas", a.batas, "date")}
      <h3>${esc(t("ev.cp"))}</h3><p class="jm-bantu">${esc(t("adm.event.f.cp_bantu"))}</p>
      ${f("evKNama", "adm.event.f.k_nama", pribadi ? k.nama : "", "text", 'maxlength="120"')}${f("evKPeran", "adm.event.f.k_peran", pribadi ? k.peran : "", "text", 'maxlength="120"')}${f("evKWa", "adm.event.f.k_wa", pribadi ? k.wa : "", "tel", 'maxlength="20"')}${f("evKSurel", "adm.event.f.k_surel", pribadi ? k.surel : "", "email", 'maxlength="120"')}
      <label class="jm-centang"><input type="checkbox" id="evSetuju"${pribadi ? " checked" : ""}> <span>${esc(t("adm.event.f.setuju"))}</span></label>
      <p class="ev-dlg-galat" id="evGalat" role="alert" hidden></p>
      <div class="jm-aksi"><button type="button" class="jm-tbl" data-tutup-dlg>${esc(t("jm.batal"))}</button><button type="submit" class="jm-tbl jm-tbl-utama" id="evSimpan">${esc(t("jm.simpan"))}</button></div></form>`;
    dlg.querySelector("[data-tutup-dlg]").addEventListener("click", () => dlg.close());
    dlg.showModal();
  }
  async function simpan(e) {
    if (!e.target.matches("[data-ev-form]")) return;
    e.preventDefault();
    const v = (id) => dlg.querySelector("#" + id).value.trim();
    const kuota = v("evKuota") === "" ? null : Number(v("evKuota")), setuju = dlg.querySelector("#evSetuju").checked;
    const badan = { terbuka: dlg.querySelector("#evBuka").checked, kuota, batas: v("evBatas") || null, kontak_nama: v("evKNama") || null, kontak_peran: v("evKPeran") || null, kontak_wa: v("evKWa") || null, kontak_surel: v("evKSurel") || null, kontak_setuju: setuju && !!(v("evKNama") || v("evKWa") || v("evKSurel")) };
    const g = dlg.querySelector("#evGalat"), tbl = dlg.querySelector("#evSimpan");
    g.hidden = true; tbl.disabled = true;
    try {
      await api(`/api/event/${encodeURIComponent(S.slug)}/atur`, { metode: "PUT", badan });
      dlg.close(); kabar("ok", t("adm.event.tersimpan"));
      S.api = await api("/api/event"); nanti(rangka);
    } catch (err) { g.textContent = galatTeks(err.kode || "umum"); g.hidden = false; tbl.disabled = false; }
  }

  /* ---------- hadir, tutup, laporan ---------- */
  const jam = (u) => `${tanggal(tanggalDariUnix(u))} ${jamTeks(u)}`;
  function laporanHtml(L) {
    const ubin = [["pendaftaran", L.pendaftaran], ["orang", L.orang], ["hadir", L.hadir]].map(([k, v]) => `<div><dt>${esc(t("adm.event.h.u." + k))}</dt><dd>${esc(angka(v))}</dd></div>`).join("");
    const sv = L.survei.tersembunyi
      ? `<p class="jm-bantu">${esc(t("adm.event.h.sv_sembunyi", { n: angka(L.survei.n), min: angka(L.n_min) }))}</p>`
      : `<dl class="adm-ev-dl">${L.butir.map((k) => `<div><dt>${esc(t("ev.sv.b." + k))}</dt><dd>${esc(angka(L.survei.rata[k], { desimal: 1 }))} / 5</dd></div>`).join("")}</dl><p class="jm-bantu">${esc(t("adm.event.h.sv_n", { n: angka(L.survei.n) }))}</p>`;
    const kj = L.kunjungan_semua_acara ? t("adm.event.h.kunjungan", { n: angka(L.kunjungan_semua_acara.n), dari: tanggal(L.kunjungan_semua_acara.dari) }) : t("adm.event.h.kunjungan_kosong");
    return `<dl class="adm-ev-dl">${ubin}</dl><h3>${esc(t("adm.event.h.sv_j"))}</h3>${sv}<h3>${esc(t("adm.event.h.jangkau_j"))}</h3><p>${esc(kj)}</p><p class="jm-bantu">${esc(t("adm.event.h.jangkau_batas"))}</p>`;
  }
  async function isiLaporan() {
    const w = dlg.querySelector("#evLaporan"), tb = dlg.querySelector("#evTutup");
    if (!w) return;
    try {
      const L = await api(`/api/event/${encodeURIComponent(S.slug)}/laporan`);
      if (!w.isConnected) return;
      w.innerHTML = laporanHtml(L);
      tb.dataset.tutup = L.ditutup ? "0" : "1"; tb.hidden = false;
      tb.querySelector("span").textContent = t(L.ditutup ? "adm.event.h.buka_lagi" : "adm.event.h.tutup");
      dlg.querySelector("#evTutupKet").textContent = L.ditutup ? t("adm.event.h.ditutup_pada", { waktu: jam(L.ditutup) }) : t("adm.event.h.tutup_bantu");
    } catch (err) { if (w.isConnected) w.innerHTML = galatHtml(err.kode || "umum"); }
  }
  function bukaHadir(slug) {
    const b = S.acara.find((x) => x.slug === slug);
    if (!b) return;
    S.slug = slug;
    dlg.innerHTML = `<div class="jm-form"><h2 id="dlgJudul">${esc(b.judulTampil)}</h2>
      <form id="evHadirForm" novalidate data-ev-hadir><div class="jm-medan"><label for="evKode">${esc(t("adm.event.h.kode"))}</label><input class="jm-isian" id="evKode" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="60" inputmode="text"></div>
        <p class="jm-bantu">${esc(t("adm.event.h.kode_bantu"))}</p><div id="evHadirHasil" role="status" aria-live="polite"></div>
        <div class="jm-aksi"><button type="submit" class="jm-tbl jm-tbl-utama" id="evHadirTbl">${ikon("centang", 18)}<span>${esc(t("adm.event.h.catat"))}</span></button></div></form>
      <h3>${esc(t("adm.event.h.laporan_j"))}</h3><div id="evLaporan">${hantuHtml(3)}</div>
      <p class="jm-bantu" id="evTutupKet"></p>
      <div class="jm-aksi"><button type="button" class="jm-tbl" data-tutup-dlg>${esc(t("jm.tutup"))}</button><button type="button" class="jm-tbl" id="evTutup" hidden>${ikon("kunci", 18)}<span></span></button></div></div>`;
    dlg.showModal(); dlg.querySelector("#evKode").focus();
    nanti(isiLaporan);
  }
  async function catatHadir(e) {
    if (!e.target.matches("[data-ev-hadir]")) return;
    e.preventDefault();
    const m = dlg.querySelector("#evKode"), out = dlg.querySelector("#evHadirHasil"), tbl = dlg.querySelector("#evHadirTbl"), kode = m.value.trim();
    if (!kode) { m.focus(); return; }
    tbl.disabled = true;
    try {
      const r = await api(`/api/event/${encodeURIComponent(S.slug)}/hadir`, { metode: "POST", badan: { kode } });
      out.innerHTML = pesanHtml("ok", t(r.baru ? "adm.event.h.ok" : "adm.event.h.sudah", { nama: r.nama, n: angka(r.jumlah), waktu: jam(r.hadir_pada) }));
      m.value = ""; nanti(isiLaporan);
    } catch (err) { out.innerHTML = pesanHtml("galat", err.kode === "tidak_ditemukan" ? t("adm.event.h.tak_sah") : galatTeks(err.kode || "umum")); }
    tbl.disabled = false; m.focus();
  }
  async function klikHadir(e) {
    if (e.target.closest("[data-tutup-dlg]") && dlg.querySelector("[data-ev-hadir]")) return void dlg.close();
    const tb = e.target.closest("#evTutup");
    if (!tb) return;
    tb.disabled = true;
    try { await api(`/api/event/${encodeURIComponent(S.slug)}/tutup`, { metode: "PUT", badan: { tutup: tb.dataset.tutup === "1" } }); await isiLaporan(); }
    catch (err) { dlg.querySelector("#evHadirHasil").innerHTML = pesanHtml("galat", galatTeks(err.kode || "umum")); }
    tb.disabled = false;
  }
}
