/* /admin: tab Event. Atur pendaftaran per acara (buka/tutup, kuota, batas, contact person), lihat peserta, unduh CSV. Hak ditegakkan di server (admin dan super). */
import { t, angka, tanggal, tanggalDariUnix } from "/i18n.js";
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
          <a class="jm-tbl jm-tbl-kecil" href="/api/event/${encodeURIComponent(b.slug)}/peserta.csv" download>${ikon("csv", 16)}<span>${esc(t("adm.event.csv"))}</span></a></td></tr>`;
    }).join("")}</tbody></table></div>`;
  }
  function klik(e) {
    const b = e.target.closest("[data-m=atur]");
    if (b) bukaAtur(b.dataset.slug);
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
}
