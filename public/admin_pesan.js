/* /admin: tab Pesan (migrasi 0016). Kotak masuk chat akun: filter topik/status, percakapan dua arah, balas (dengan lampiran dan templat), tandai selesai.
   Server: GET /api/admin/pesan, GET|POST /api/admin/pesan/:id[/balas|/status]. Hanya admin dan super. Polling 20 detik saat tab terlihat. */
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { t, tanggalDariUnix, jam, angka } from "/i18n.js";
import { esc, api, nanti, hantuHtml, kosongHtml, galatHtml } from "/inti/umum.js";
import { TOPIK, MAKS_ISI, gelembungHtml, periksaBerkas, kirimForm, kunciGalat, umumkanBelum } from "/inti/pesan_umum.js";

const STATUS = ["baru", "dibalas", "selesai"];
const TEMPLAT = [1, 2, 3, 4];
const waktu = (w) => `${tanggalDariUnix(w)} ${jam(w)}`;

export function panelPesan(panel) {
  if (!document.querySelector('link[href="/pesan.css"]')) document.head.insertAdjacentHTML("beforeend", '<link rel="stylesheet" href="/pesan.css">');
  const S = { status: "", topik: "", hal: 1, id: null, ctl: null, galat: "" };
  const opsi = (daftar, awalan, semua) => `<option value="">${esc(t(semua))}</option>` + daftar.map((v) => `<option value="${v}">${esc(t(awalan + v))}</option>`).join("");
  panel.innerHTML = `<header class="jm-adm-bhd"><div><h3>${esc(t("adm.ps.j"))}</h3><p class="jm-bantu">${esc(t("adm.ps.catatan"))}</p></div></header>
    <div class="jm-bar jm-adm-bar1"><select data-ikon="status" class="jm-pilih" id="psfStatus" aria-label="${esc(t("adm.ps.f.status"))}">${opsi(STATUS, "ps.status.", "adm.ps.semua_status")}</select>
    <select data-ikon="topik" class="jm-pilih" id="psfTopik" aria-label="${esc(t("adm.ps.f.topik"))}">${opsi(TOPIK, "ps.topik.", "adm.ps.semua_topik")}</select></div>
    <div class="psn-adm"><div class="psn-adm-daf" id="psaDaf" aria-live="polite"></div><div class="psn-adm-utas" id="psaUtas"><p class="jm-bantu">${esc(t("adm.ps.pilih"))}</p></div></div>`;
  const daf = panel.querySelector("#psaDaf"), utasEl = panel.querySelector("#psaUtas");

  panel.addEventListener("change", (e) => {
    if (e.target.id === "psfStatus") { S.status = e.target.value; S.hal = 1; muatDaftar(); }
    else if (e.target.id === "psfTopik") { S.topik = e.target.value; S.hal = 1; muatDaftar(); }
    else if (e.target.id === "psaBerkas") {
      const f = e.target.files[0], k = periksaBerkas(f);
      panel.querySelector("#psaGalat").textContent = k ? t(k) : "";
      if (k) e.target.value = "";
      panel.querySelector("#psaNamaBerkas").textContent = k || !f ? "" : f.name;
    }
  });
  panel.addEventListener("input", (e) => { if (e.target.id === "psaIsi") panel.querySelector("#psaHitung").textContent = `${e.target.value.length}/${MAKS_ISI}`; });
  panel.addEventListener("click", (e) => {
    if (e.target.closest("[data-aksi=ulang]")) return muatDaftar();
    const h = e.target.closest("[data-hal]");
    if (h) { if (h.disabled) return; S.hal = +h.dataset.hal; sorotHalaman(h, S.hal); return muatDaftar(); }
    const u = e.target.closest("[data-utas]");
    if (u) { // chrome urgent: baris aktif seketika
      daf.querySelectorAll(".psn-utas.aktif").forEach((x) => x.classList.remove("aktif")); u.classList.add("aktif");
      S.id = u.dataset.utas; return void nanti(() => muatUtas(true));
    }
    const tp = e.target.closest("[data-tpl]");
    if (tp) { const ta = panel.querySelector("#psaIsi"); ta.value = t("adm.ps.tpl." + tp.dataset.tpl + ".i"); ta.dispatchEvent(new Event("input", { bubbles: true })); ta.focus(); return; }
    const st = e.target.closest("[data-status]");
    if (st) return void ubahStatus(st.dataset.status);
  });
  panel.addEventListener("submit", async (e) => {
    e.preventDefault();
    const isi = e.target.elements.isi.value.trim(), berkas = panel.querySelector("#psaBerkas").files[0] || null, g = panel.querySelector("#psaGalat"), tbl = panel.querySelector("#psaKirim");
    if (!isi) return void (g.textContent = t("ps.err.isi"));
    const kb = periksaBerkas(berkas); if (kb) return void (g.textContent = t(kb));
    tbl.disabled = true; g.textContent = "";
    const r = await kirimForm(`/api/admin/pesan/${S.id}/balas`, { isi, berkas });
    if (!r.ok) { g.textContent = t(kunciGalat(r.status)); tbl.disabled = false; return; }
    muatUtas(true); muatDaftar(true);
  });

  async function ubahStatus(status) {
    try { await api(`/api/admin/pesan/${S.id}/status`, { metode: "POST", badan: { status } }); muatUtas(false); muatDaftar(true); } catch { panel.querySelector("#psaGalat").textContent = t("ps.err.umum"); }
  }

  async function muatDaftar(diam) {
    if (S.ctl) S.ctl.abort();
    S.ctl = new AbortController();
    if (!diam) daf.innerHTML = hantuHtml(4);
    try {
      const q = `hal=${S.hal}${S.status ? "&status=" + S.status : ""}${S.topik ? "&topik=" + S.topik : ""}`;
      const d = await api("/api/admin/pesan?" + q, { signal: S.ctl.signal });
      umumkanBelum(d.belum);
      nanti(() => gambarDaftar(d));
    } catch (e) { if (e.name !== "AbortError") daf.innerHTML = galatHtml(e.kode || "umum"); }
  }
  function gambarDaftar(d) {
    const hal = Math.max(1, Math.ceil(d.total / 50));
    panel.querySelector(".psn-adm").classList.toggle("jm-adm-satu", !d.baris.length); // tanpa percakapan: satu keadaan kosong penuh lebar, tanpa panel kanan
    daf.innerHTML = `<p class="jm-bantu">${esc(t("adm.ps.ringkas", { total: angka(d.total), belum: angka(d.belum) }))}</p>` + (d.baris.length
      ? `<ul class="psn-daftar">${d.baris.map((u) => `<li><button type="button" class="psn-utas${u.dibaca_admin ? "" : " belum"}${u.id === S.id ? " aktif" : ""}" data-utas="${esc(u.id)}"><span class="psn-utas-a"><b>${esc(u.nama || u.surel || "-")}</b><span class="psn-pil psn-pil-${esc(u.status)}">${esc(t("ps.status." + u.status))}</span></span><span class="psn-g-meta"><span>${esc(t("ps.topik." + u.topik))}</span><span>${esc(waktu(u.diubah))}</span></span><span class="psn-utas-t">${esc(u.terakhir_dari === "admin" ? t("adm.ps.anda") + ": " : "")}${esc(u.terakhir || "")}</span></button></li>`).join("")}</ul>`
      : kosongHtml("adm.ps.kosong"))
      + paginasiHtml({ hal: S.hal, total: d.total, per: 50, satuan: "jm.pag.u.pesan" });
  }

  async function muatUtas(awal) {
    if (!S.id) return;
    const id = S.id;
    if (awal) utasEl.innerHTML = hantuHtml(3);
    try {
      const d = await api("/api/admin/pesan/" + id);
      if (id !== S.id) return;
      const u = d.utas, ta = panel.querySelector("#psaIsi"), simpan = awal ? "" : ta?.value || "";
      const gel = d.pesan.map((m) => gelembungHtml(m, { nama: m.dari === "admin" ? t("adm.ps.anda") : u.nama || u.surel || "-", waktu: waktu(m.waktu), status: "", url: m.lampiran ? `/api/admin/pesan/${id}/berkas/${encodeURIComponent(m.id)}` : "" })).join("");
      utasEl.innerHTML = `<div class="psn-adm-kep"><h3>${esc(u.nama || "-")} <span class="psn-g-meta"><span>${esc(u.surel || "")}</span><span>${esc(t("ps.topik." + u.topik))}</span></span></h3><span class="psn-pil psn-pil-${esc(u.status)}">${esc(t("ps.status." + u.status))}</span>
        <button type="button" class="jm-tbl jm-tbl-kecil" data-status="${u.status === "selesai" ? "baru" : "selesai"}">${esc(t(u.status === "selesai" ? "adm.ps.buka_lagi" : "adm.ps.selesai"))}</button></div>
        <ul class="psn-pesan">${gel}</ul>
        <form class="psn-form" novalidate><div class="psn-tpl" role="group" aria-label="${esc(t("adm.ps.templat"))}">${TEMPLAT.map((n) => `<button type="button" class="jm-tbl jm-tbl-kecil" data-tpl="${n}">${esc(t("adm.ps.tpl." + n + ".j"))}</button>`).join("")}</div>
        <label class="sr" for="psaIsi">${esc(t("adm.ps.balas"))}</label><textarea id="psaIsi" name="isi" maxlength="${MAKS_ISI}" placeholder="${esc(t("adm.ps.balas"))}" required></textarea>
        <p class="psn-galat" role="alert" id="psaGalat"></p>
        <div class="psn-baris"><label class="jm-tbl jm-tbl-kecil" for="psaBerkas">${esc(t("ps.lampir"))}</label><input class="sr" type="file" id="psaBerkas" accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"><span class="psn-file" id="psaNamaBerkas"></span><span class="psn-sp"></span><span class="psn-hitung" id="psaHitung">${simpan.length}/${MAKS_ISI}</span><button type="submit" class="jm-tbl jm-tbl-utama jm-tbl-kecil" id="psaKirim">${esc(t("adm.ps.kirim"))}</button></div></form>`;
      panel.querySelector("#psaIsi").value = simpan;
      const l = utasEl.querySelector(".psn-pesan"); l.scrollTop = l.scrollHeight;
      if (awal) muatDaftar(true); // buka utas menandai dibaca: segarkan tebal dan lencana
    } catch (e) { if (id === S.id) utasEl.innerHTML = galatHtml(e.kode || "umum"); }
  }

  const timer = setInterval(() => {
    if (!panel.isConnected || !panel.querySelector(".psn-adm")) return clearInterval(timer);
    if (document.hidden) return;
    muatDaftar(true);
    if (S.id && !panel.querySelector("#psaIsi")?.value) muatUtas(false);
  }, 20000);
  muatDaftar();
}
