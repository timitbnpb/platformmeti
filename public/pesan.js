/* Chat ke admin (migrasi 0016): tombol mengambang "Tanya admin" + panel percakapan di semua halaman untuk akun yang masuk.
   Pembaruan: polling 20 detik HANYA saat panel terbuka dan tab terlihat. INP: panel dan tombol berubah seketika, data menyusul lewat nanti(). */
import { t, tanggalDariUnix, jam } from "/i18n.js";
import { esc, api, nanti } from "/inti/umum.js";
import { TOPIK, MAKS_ISI, gelembungHtml, periksaBerkas, kirimForm, kunciGalat } from "/inti/pesan_umum.js";

const IK_PESAN = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12.5h5"/></svg>';
const IK_TUTUP = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const IK_KEMBALI = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m15 6-6 6 6 6"/></svg>';
const POLING_MS = 20000;
const waktu = (w) => `${tanggalDariUnix(w)} ${jam(w)}`;

export function pasangPesan() {
  if (document.getElementById("psFab")) return;
  if (!document.querySelector('link[href="/pesan.css"]')) document.head.insertAdjacentHTML("beforeend", '<link rel="stylesheet" href="/pesan.css">');
  document.body.insertAdjacentHTML("beforeend", `<button type="button" class="ps-fab" id="psFab" aria-haspopup="dialog" aria-expanded="false" aria-controls="psPn">${IK_PESAN}<span class="ps-fab-l">${esc(t("ps.fab"))}</span><span class="ps-lencana" id="psLencana" hidden></span></button>
    <section class="ps-pn" id="psPn" role="dialog" aria-modal="false" aria-labelledby="psJudul" hidden></section>`);
  const fab = document.getElementById("psFab"), pn = document.getElementById("psPn"), lencana = document.getElementById("psLencana");
  const S = { buka: false, view: "daftar", utas: null, timer: null, n: 0, galat: "" };

  const setBelum = (n) => { lencana.textContent = n > 99 ? "99+" : String(n); lencana.hidden = !n; fab.setAttribute("aria-label", n ? t("ps.fab_belum", { n }) : t("ps.fab")); };
  const muatBelum = () => api("/api/pesan").then((d) => setBelum(d.belum || 0)).catch(() => {});
  muatBelum();

  const kepala = (judul, kembali) => `<div class="ps-kep">${kembali ? `<button type="button" class="ps-ik" data-aksi="kembali" aria-label="${esc(t("ps.kembali"))}">${IK_KEMBALI}</button>` : ""}<h2 id="psJudul">${esc(judul)}</h2><button type="button" class="ps-ik" data-aksi="tutup" aria-label="${esc(t("ps.tutup"))}">${IK_TUTUP}</button></div>`;
  const pilStatus = (s) => `<span class="ps-pil ps-pil-${esc(s)}">${esc(t("ps.status." + s))}</span>`;
  const formHtml = (baru) => `<form class="ps-form" id="psForm" novalidate>
      ${baru ? `<label class="sr" for="psTopik">${esc(t("ps.topik"))}</label><select id="psTopik" name="topik" data-ikon="topik">${TOPIK.map((k) => `<option value="${k}">${esc(t("ps.topik." + k))}</option>`).join("")}</select>` : ""}
      <label class="sr" for="psIsi">${esc(t("ps.tulis"))}</label><textarea id="psIsi" name="isi" maxlength="${MAKS_ISI}" placeholder="${esc(t("ps.tulis"))}" required></textarea>
      <p class="ps-galat" role="alert" id="psGalat">${esc(S.galat)}</p>
      <div class="ps-baris"><label class="jm-tbl jm-tbl-kecil" for="psBerkas">${esc(t("ps.lampir"))}</label><input class="sr" type="file" id="psBerkas" accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"><span class="ps-file" id="psNamaBerkas"></span><span class="ps-sp"></span><span class="ps-hitung" id="psHitung">0/${MAKS_ISI}</span><button type="submit" class="jm-tbl jm-tbl-utama jm-tbl-kecil" id="psKirim">${esc(t("ps.kirim"))}</button></div>
    </form>`;

  async function gambarDaftar() {
    S.view = "daftar";
    pn.innerHTML = `${kepala(t("ps.judul"))}<div class="ps-isi" id="psIsiBox" aria-live="polite"><p class="ps-sub">${esc(t("ps.sub"))}</p><button type="button" class="jm-tbl jm-tbl-utama" data-aksi="baru">${esc(t("ps.baru"))}</button><div id="psDaf"><p class="ps-sub">${esc(t("jm.memuat"))}</p></div></div>`;
    await segarDaftar();
  }
  async function segarDaftar() {
    try {
      const d = await api("/api/pesan");
      setBelum(d.belum || 0);
      if (S.view !== "daftar") return;
      const daf = pn.querySelector("#psDaf");
      if (!daf) return;
      daf.innerHTML = d.utas.length
        ? `<ul class="ps-daftar">${d.utas.map((u) => `<li><button type="button" class="ps-utas${u.dibaca_akun ? "" : " belum"}" data-utas="${esc(u.id)}"><span class="ps-utas-a"><b>${esc(t("ps.topik." + u.topik))}</b>${pilStatus(u.status)}</span><span class="ps-utas-t">${esc(u.terakhir_dari === "admin" ? t("ps.admin") + ": " : "")}${esc(u.terakhir || "")}</span><span class="ps-g-meta">${esc(waktu(u.diubah))}</span></button></li>`).join("")}</ul>`
        : `<p class="ps-sub">${esc(t("ps.kosong"))}</p>`;
    } catch { const daf = pn.querySelector("#psDaf"); if (daf) daf.innerHTML = `<p class="ps-galat">${esc(t("ps.err.umum"))}</p>`; }
  }

  function gambarBaru() {
    S.view = "baru"; S.galat = "";
    pn.innerHTML = `${kepala(t("ps.baru"), true)}<div class="ps-isi"><p class="ps-sub">${esc(t("ps.sub"))}</p></div>${formHtml(true)}`;
    pn.querySelector("#psIsi").focus();
  }

  async function gambarUtas(id, awal) {
    S.view = "utas"; S.utas = id; S.galat = "";
    if (awal) pn.innerHTML = `${kepala(t("ps.judul"), true)}<div class="ps-isi"><p class="ps-sub">${esc(t("jm.memuat"))}</p></div>`;
    try {
      const d = await api("/api/pesan/" + encodeURIComponent(id));
      if (S.view !== "utas" || S.utas !== id) return;
      const dibaca = d.utas.dibaca_admin === 1;
      const urut = d.pesan;
      const terakhirAkun = [...urut].reverse().find((m) => m.dari === "akun");
      const daftar = urut.map((m) => gelembungHtml(m, {
        nama: m.dari === "admin" ? t("ps.admin") : t("ps.saya"), waktu: waktu(m.waktu),
        status: m === terakhirAkun ? t(dibaca ? "ps.dibaca" : "ps.terkirim") : "",
        url: m.lampiran ? `/api/pesan/${encodeURIComponent(id)}/berkas/${encodeURIComponent(m.id)}` : "",
      })).join("");
      const lama = pn.querySelector(".ps-isi"), dekat = !lama || lama.scrollHeight - lama.scrollTop - lama.clientHeight < 80;
      const teksSimpan = pn.querySelector("#psIsi")?.value || "";
      pn.innerHTML = `${kepala(t("ps.topik." + d.utas.topik), true)}<div class="ps-isi" aria-live="polite"><div class="ps-baris">${pilStatus(d.utas.status)}</div><ul class="ps-pesan">${daftar}</ul></div>${formHtml(false)}${d.utas.status === "selesai" ? `<p class="ps-tutup-info">${esc(t("ps.selesai_info"))}</p>` : ""}`;
      pn.querySelector("#psIsi").value = teksSimpan;
      pn.querySelector("#psHitung").textContent = `${teksSimpan.length}/${MAKS_ISI}`;
      const kotak = pn.querySelector(".ps-isi");
      if (awal || dekat) kotak.scrollTop = kotak.scrollHeight;
      muatBelum();
    } catch (e) { if (awal) pn.innerHTML = `${kepala(t("ps.judul"), true)}<div class="ps-isi"><p class="ps-galat">${esc(t("ps.err.umum"))}</p></div>`; }
  }

  function mulaiPoling() {
    clearInterval(S.timer);
    S.timer = setInterval(() => {
      if (!S.buka || document.hidden) return;
      if (S.view === "daftar") segarDaftar(); else if (S.view === "utas") gambarUtas(S.utas, false);
    }, POLING_MS);
  }
  function tutup() { S.buka = false; clearInterval(S.timer); pn.hidden = true; fab.setAttribute("aria-expanded", "false"); fab.focus(); }
  function bukaPanel() {
    S.buka = true; pn.hidden = false; fab.setAttribute("aria-expanded", "true"); // chrome urgent
    pn.innerHTML = `${kepala(t("ps.judul"))}<div class="ps-isi"><p class="ps-sub">${esc(t("jm.memuat"))}</p></div>`;
    mulaiPoling();
    nanti(() => gambarDaftar());
  }
  document.addEventListener("visibilitychange", () => { if (S.buka && !document.hidden) { if (S.view === "daftar") segarDaftar(); else if (S.view === "utas") gambarUtas(S.utas, false); } });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && S.buka) tutup(); });
  fab.addEventListener("click", () => (S.buka ? tutup() : bukaPanel()));

  pn.addEventListener("click", (e) => {
    const b = e.target.closest("[data-aksi],[data-utas]");
    if (!b) return;
    if (b.dataset.utas) return void nanti(() => gambarUtas(b.dataset.utas, true));
    if (b.dataset.aksi === "tutup") tutup();
    else if (b.dataset.aksi === "kembali") nanti(gambarDaftar);
    else if (b.dataset.aksi === "baru") gambarBaru();
  });
  pn.addEventListener("input", (e) => { if (e.target.id === "psIsi") pn.querySelector("#psHitung").textContent = `${e.target.value.length}/${MAKS_ISI}`; });
  pn.addEventListener("change", (e) => {
    if (e.target.id !== "psBerkas") return;
    const f = e.target.files[0], k = periksaBerkas(f);
    pn.querySelector("#psGalat").textContent = k ? t(k) : "";
    if (k) e.target.value = "";
    pn.querySelector("#psNamaBerkas").textContent = k || !f ? "" : f.name;
  });
  pn.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, isi = f.elements.isi.value.trim(), berkas = f.elements.berkas?.files[0] || document.getElementById("psBerkas")?.files[0] || null;
    const g = pn.querySelector("#psGalat"), tbl = pn.querySelector("#psKirim");
    if (!isi) return void (g.textContent = t("ps.err.isi"));
    const kb = periksaBerkas(berkas); if (kb) return void (g.textContent = t(kb));
    tbl.disabled = true; tbl.textContent = t("ps.mengirim"); g.textContent = "";
    const r = await kirimForm("/api/pesan", { isi, topik: f.elements.topik?.value, utas: S.view === "utas" ? S.utas : "", berkas });
    if (!r.ok) { g.textContent = t(kunciGalat(r.status)); tbl.disabled = false; tbl.textContent = t("ps.kirim"); return; }
    nanti(() => gambarUtas(r.data.utas_id, true));
  });
}
