/* /admin tab Portal: antrean kurasi klaim organisasi, ajuan lembaga, ajuan METI Wilayah (satu antrean, /api/admin/portal) + tautan akun ke provinsi (/api/admin/wilayah-akun).
   Tolak wajib catatan. Nilai di-escape. */
import { t, tanggal, tanggalDariUnix } from "/i18n.js";
import { esc, api, nanti, hantuHtml, kosongHtml, galatTeks, ikon, pesanHtml } from "/inti/umum.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { kepalaTab, ubinKepala, keadaan, aman } from "/admin_umum.js";
import { namaProvinsi } from "/profil_tampil.js";

const TIPE = ["ajuan", "klaim", "wilayah", "orang"], STATUS = ["baru", "setuju", "tolak"];
const KUNCI_AKSI = { setuju: "kor.setujui", tolak: "kor.tolak", cabut: "ap.cabut" };
const pil = (s) => `<span class="jm-pil ${s === "setuju" ? "jm-pil-ok" : s === "tolak" ? "jm-pil-bad" : "jm-pil-warn"}">${esc(t("kor.s." + s))}</span>`;
const tgl = (u) => (u ? `<span data-urut="${u}">${esc(tanggal(tanggalDariUnix(u)))}</span>` : "-");

function isiTeks(tipe, r) {
  const i = r.isi || {};
  if (tipe === "klaim") return [r.jabatan, r.bukti_url].filter(Boolean).join(" / ");
  return Object.entries(i).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join("; ") + (r.proyek_id ? ` (${r.proyek_id})` : "");
}

export function panelPortal(panel) {
  const S = { nama: new Map(), tipe: "ajuan", status: "baru", hal: 1, baris: [], total: 0, galat: null, ctl: null, prov: [], wil: [], pilih: null };
  const opsi = (arr, aktif, kunci) => arr.map((x) => `<option value="${x}"${x === aktif ? " selected" : ""}>${esc(t(kunci + x))}</option>`).join("");
  panel.innerHTML = `${kepalaTab("centang", "ap.ey", "ap.j", "ap.d")}
    <div class="jm-bar jm-adm-bar1"><select data-ikon="jenis" class="jm-pilih" id="pTipe" aria-label="${esc(t("ap.f.tipe"))}">${opsi(TIPE, S.tipe, "ap.tipe.")}</select>
      <select data-ikon="status" class="jm-pilih" id="pStatus" aria-label="${esc(t("kor.f.status"))}">${opsi(STATUS, S.status, "kor.s.")}</select></div>
    <div id="pDaftar" aria-live="polite"></div><div class="jm-hal" id="pHal"></div>
    <section class="jm-ex" id="pWil"><header class="jm-ex-hd"><div class="jm-ex-teks"><h3 class="jm-ex-j">${esc(t("ap.wil"))}</h3><p class="jm-ex-sub">${esc(t("ap.wil_sub"))}</p></div></header><div class="jm-ex-bd" id="pWilIsi"></div></section>
    <dialog class="jm-dlg" id="pTinjau" aria-labelledby="pTinjauJ"></dialog>`;
  const $ = (i) => panel.querySelector("#" + i), dlg = $("pTinjau");
  panel.addEventListener("change", (e) => {
    if (e.target.id === "pTipe") { S.tipe = e.target.value; S.hal = 1; muat(); muatRingkas(); } else if (e.target.id === "pStatus") { S.status = e.target.value; S.hal = 1; muat(); }
  });
  panel.addEventListener("click", async (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const a = b.dataset.aksi;
    if (b?.dataset.hal) { S.hal = +b.dataset.hal; sorotHalaman(b, S.hal); muat(); } else if (a === "ulang") muat();
    else if (a === "setuju" || a === "tolak" || a === "cabut") tinjau(a, b.dataset.id);
    else if (a === "batal") dlg.close();
    else if (a === "lepas") { try { await api(`/api/admin/wilayah-akun/${encodeURIComponent(b.dataset.id)}`, { metode: "DELETE" }); muatWil(); } catch (er) { $("pWilPesan").innerHTML = pesanHtml("galat", galatTeks(er.kode || "umum")); } }
  });
  panel.addEventListener("submit", async (e) => {
    if (e.target.id !== "fWil") return;
    e.preventDefault();
    const surel = $("wSurel").value.trim(), kode = $("wKode").value;
    try { await api("/api/admin/wilayah-akun", { metode: "POST", badan: { surel, kode_prov: kode } }); $("wSurel").value = ""; muatWil(); $("pWilPesan").innerHTML = pesanHtml("ok", t("ap.wil_ok")); }
    catch (er) { $("pWilPesan").innerHTML = pesanHtml("galat", er.status === 404 ? t("ap.wil_tak_ada") : galatTeks(er.kode || "umum")); }
  });
  dlg.addEventListener("submit", async (e) => {
    e.preventDefault();
    const tbl = e.target.querySelector("button[type=submit]"), catatan = dlg.querySelector("#pCatatan").value.trim();
    if (S.pilih.aksi !== "setuju" && !catatan) { dlg.querySelector("#pPesan").innerHTML = pesanHtml("galat", t("ap.catatan_wajib")); return; }
    tbl.disabled = true;
    try { await api(`/api/admin/portal/${S.tipe}/${encodeURIComponent(S.pilih.id)}`, { metode: "POST", badan: { aksi: S.pilih.aksi, catatan } }); dlg.close(); muat(); muatRingkas(); }
    catch (er) { tbl.disabled = false; dlg.querySelector("#pPesan").innerHTML = pesanHtml("galat", er.status === 409 ? t("kor.sudah_diputus") : er.status === 403 ? t("ap.diri_sendiri") : galatTeks(er.kode || "umum")); }
  });
  muat(); muatWil(); muatRingkas();
  /* ubin kepala: jumlah per status untuk jenis yang sedang dibuka */
  async function muatRingkas() {
    const n = await Promise.all(STATUS.map((x) => api(`/api/admin/portal?tipe=${S.tipe}&status=${x}&hal=1`).then((d) => d.total ?? (d.baris || []).length).catch(() => 0)));
    ubinKepala(panel, STATUS.map((x, i) => ({ ikon: ["lonceng", "centang", "silang"][i], nilai: n[i], label: t("ap.k." + x) })));
  }

  function tinjau(aksi, id) {
    S.pilih = { aksi, id };
    dlg.innerHTML = `<form class="jm-form"><h2 id="pTinjauJ">${esc(t(KUNCI_AKSI[aksi]))}</h2><p class="jm-bantu">${esc(t("kor.konfirm"))}</p>
      <div class="jm-medan"><label for="pCatatan">${esc(t("kor.catatan"))}</label><textarea class="jm-isian" id="pCatatan" rows="3" maxlength="500"></textarea></div><div id="pPesan"></div>
      <div class="jm-aksi"><button type="submit" class="jm-tbl ${aksi === "setuju" ? "jm-tbl-utama" : "jm-tbl-bahaya"}">${esc(t(KUNCI_AKSI[aksi]))}</button><button type="button" class="jm-tbl" data-aksi="batal">${esc(t("jm.batal"))}</button></div></form>`;
    dlg.showModal();
  }
  async function muat() {
    if (S.ctl) S.ctl.abort();
    S.ctl = new AbortController();
    $("pDaftar").innerHTML = hantuHtml(5);
    try {
      if (S.tipe === "orang" && !S.nama.size) await fetch("/data/orang.json").then((r) => r.json()).then((j) => j.baris.forEach((o) => S.nama.set(o.id, o.nama))).catch(() => {});
      const d = await api(`/api/admin/portal?tipe=${S.tipe}&status=${S.status}&hal=${S.hal}`, { signal: S.ctl.signal }); S.baris = d.baris || []; S.total = d.total ?? S.baris.length; S.galat = null; }
    catch (e) { if (e.name === "AbortError") return; S.galat = e.kode || "umum"; S.baris = []; }
    nanti(gambar);
  }
  function gambar() {
    const el = $("pDaftar"); if (!el) return;
    if (S.galat) el.innerHTML = keadaan(S.galat);
    else if (!S.baris.length) el.innerHTML = kosongHtml("kor.kosong_antrean");
    else {
      const baris = S.baris.map((r) => {
        const u = aman(r.bukti_url), cabut = S.tipe === "orang" && r.status === "setuju" ? `<button type="button" class="jm-tbl jm-tbl-kecil jm-tbl-bahaya" data-aksi="cabut" data-id="${esc(r.id)}">${ikon("silang", 16)}${esc(t("ap.cabut"))}</button>` : "", aksi = r.status !== "baru" ? pil(r.status) + cabut : `<div class="jm-sel-aksi"><button type="button" class="jm-tbl jm-tbl-kecil jm-tbl-utama" data-aksi="setuju" data-id="${esc(r.id)}">${ikon("centang", 16)}${esc(t("kor.setujui"))}</button><button type="button" class="jm-tbl jm-tbl-kecil jm-tbl-bahaya" data-aksi="tolak" data-id="${esc(r.id)}">${ikon("silang", 16)}${esc(t("kor.tolak"))}</button></div>`;
        const lampir = r.berkas ? `<a href="/api/wilayah/berkas/${encodeURIComponent(r.id)}" target="_blank" rel="noopener noreferrer">${esc(r.berkas.nama)}</a>${r.persetujuan_foto ? ` <span class="jm-pil jm-pil-ok">${esc(t("ap.setuju_foto"))}</span>` : ""}` : "";
        return `<tr><td data-l="${esc(t(S.tipe === "orang" ? "ap.c.entri" : "pt.c.org"))}">${esc(S.tipe === "orang" ? S.nama.get(r.orang_id) || r.orang_id : r.organisasi_id)}<small>${esc(r.pengaju || "")}${r.pengaju_surel ? ` (${esc(r.pengaju_surel)})` : ""}</small></td><td data-l="${esc(t("pt.c.jenis"))}">${esc(r.jenis ? (S.tipe === "wilayah" ? t("pb.w." + r.jenis) : t("pt.j." + r.jenis)) : t(S.tipe === "orang" ? "ap.tipe.orang" : "ap.tipe.klaim"))}</td>
          <td data-l="${esc(t("pt.c.isi"))}"><span class="jm-ringkas-sel">${esc(isiTeks(S.tipe, r))}</span></td>
          <td data-l="${esc(t("kor.c.sumber"))}">${u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(u.replace(/^https?:\/\/(www\.)?/, "").slice(0, 40))}</a>` : "-"}${lampir ? `<small>${lampir}</small>` : ""}</td>
          <td class="jm-nowrap" data-l="${esc(t("pt.c.tanggal"))}">${tgl(r.dibuat)}</td><td data-l="${esc(t("admin.k.aksi"))}">${aksi}${r.catatan_admin ? `<small>${esc(r.catatan_admin)}</small>` : ""}</td></tr>`;
      }).join("");
      el.innerHTML = `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>${[S.tipe === "orang" ? "ap.c.entri" : "pt.c.org", "pt.c.jenis", "pt.c.isi", "kor.c.sumber", "pt.c.tanggal"].map((k) => `<th scope="col">${esc(t(k))}</th>`).join("")}<th scope="col" data-urut="tidak">${esc(t("admin.k.aksi"))}</th></tr></thead><tbody>${baris}</tbody></table></div>`;
    }
    $("pHal").innerHTML = paginasiHtml({ hal: S.hal, total: S.total, per: 50, satuan: "jm.pag.u.permohonan" });
  }
  async function muatWil() {
    const el = $("pWilIsi");
    try {
      S.prov = S.prov.length ? S.prov : await namaProvinsi();
      S.wil = (await api("/api/admin/wilayah-akun")).baris;
      el.innerHTML = `<form class="jm-form" id="fWil" novalidate><div class="jm-form-grid"><div class="jm-medan"><label for="wSurel">${esc(t("ap.wil_surel"))}</label><input class="jm-isian" id="wSurel" type="email" maxlength="120" required autocomplete="off"></div>
        <div class="jm-medan"><label for="wKode">${esc(t("ap.wil_prov"))}</label><select class="jm-pilih" id="wKode" data-ikon="wilayah">${S.prov.map(([k, n]) => `<option value="${esc(k)}">${esc(n)}</option>`).join("")}</select></div></div>
        <div id="pWilPesan" aria-live="polite"></div><div class="jm-aksi"><button type="submit" class="jm-tbl jm-tbl-utama">${ikon("tambah", 16)}<span>${esc(t("ap.wil_taut"))}</span></button></div></form>
        ${S.wil.length ? `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>${["ap.wil_akun", "ap.wil_prov"].map((k) => `<th scope="col">${esc(t(k))}</th>`).join("")}<th scope="col" data-urut="tidak">${esc(t("admin.k.aksi"))}</th></tr></thead><tbody>${S.wil.map((w) => `<tr><td data-l="${esc(t("ap.wil_akun"))}">${esc(w.nama)}<small>${esc(w.surel)}</small></td><td data-l="${esc(t("ap.wil_prov"))}">${esc(w.provinsi || w.kode_prov)}</td><td data-l="${esc(t("admin.k.aksi"))}"><button type="button" class="jm-tbl jm-tbl-kecil jm-tbl-bahaya" data-aksi="lepas" data-id="${esc(w.akun_id)}">${ikon("silang", 16)}${esc(t("ap.wil_lepas"))}</button></td></tr>`).join("")}</tbody></table></div>` : kosongHtml("ap.wil_kosong")}`;
    } catch (e) { el.innerHTML = keadaan(e.kode || "umum"); }
  }
}
