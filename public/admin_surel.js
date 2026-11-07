/* /admin tab Surel: antrean permintaan alamat @metiires.or.id (/api/admin/surel). Admin membuat kotak surel MANUAL di penyedia lalu menandai "dibuat".
   Tidak ada sandi di sini. Setuju menetapkan alamat final; tolak wajib catatan. Nilai di-escape. */
import { t, tanggal, tanggalDariUnix } from "/i18n.js";
import { esc, api, nanti, hantuHtml, kosongHtml, galatTeks, ikon, pesanHtml } from "/inti/umum.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { kepalaTab, ubinKepala, keadaan } from "/admin_umum.js";
import { DOMAIN } from "/inti/surel_minta.js";

const STATUS = ["diajukan", "disetujui", "dibuat", "ditolak"];
const IKON = ["lonceng", "centang", "surel", "silang"];
const PIL = { diajukan: "jm-pil-warn", disetujui: "jm-pil-warn", dibuat: "jm-pil-ok", ditolak: "jm-pil-bad" };
const urlAntrean = (status, hal) => "/api/admin/surel?" + new URLSearchParams({ status, hal });
const tgl = (u) => (u ? `<span data-urut="${u}">${esc(tanggal(tanggalDariUnix(u)))}</span>` : "-");

export function panelSurel(panel) {
  const S = { status: "diajukan", hal: 1, baris: [], total: 0, galat: null, ctl: null, pilih: null };
  panel.innerHTML = `${kepalaTab("surel", "sm.ad.ey", "sm.ad.j", "sm.ad.d")}
    <div class="jm-bar jm-adm-bar1"><select data-ikon="status" class="jm-pilih" id="sStatus" aria-label="${esc(t("kor.f.status"))}">${STATUS.map((x) => `<option value="${x}"${x === S.status ? " selected" : ""}>${esc(t("sm.status." + x))}</option>`).join("")}</select></div>
    <div id="sDaftar" aria-live="polite"></div><div class="jm-hal" id="sHal"></div>
    <dialog class="jm-dlg" id="sTinjau" aria-labelledby="sTinjauJ"></dialog>`;
  const $ = (i) => panel.querySelector("#" + i), dlg = $("sTinjau");
  panel.addEventListener("change", (e) => { if (e.target.id === "sStatus") { S.status = e.target.value; S.hal = 1; muat(); } });
  panel.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const a = b.dataset.aksi;
    if (b.dataset.hal) { S.hal = +b.dataset.hal; sorotHalaman(b, S.hal); muat(); } else if (a === "ulang") muat();
    else if (a === "setuju" || a === "tolak" || a === "dibuat") tinjau(a, b.dataset.id);
    else if (a === "batal") dlg.close();
  });
  dlg.addEventListener("submit", async (e) => {
    e.preventDefault();
    const tbl = e.target.querySelector("button[type=submit]"), catatan = dlg.querySelector("#sCatatan").value.trim(), alamat = dlg.querySelector("#sAlamat")?.value.trim().toLowerCase();
    if (S.pilih.aksi === "tolak" && !catatan) { dlg.querySelector("#sPesan").innerHTML = pesanHtml("galat", t("ap.catatan_wajib")); return; }
    tbl.disabled = true;
    try { await api(`/api/admin/surel/${encodeURIComponent(S.pilih.id)}`, { metode: "POST", badan: { aksi: S.pilih.aksi, catatan: catatan || undefined, alamat } }); dlg.close(); muat(); muatRingkas(); }
    catch (er) { tbl.disabled = false; dlg.querySelector("#sPesan").innerHTML = pesanHtml("galat", er.status === 409 ? t("sm.ad.konflik") : er.status === 422 ? t("sm.tak_sah") : galatTeks(er.kode || "umum")); }
  });
  muat(); muatRingkas();

  async function muatRingkas() {
    const n = await Promise.all(STATUS.map((x) => api(urlAntrean(x, 1)).then((d) => d.total ?? 0).catch(() => 0)));
    ubinKepala(panel, STATUS.map((x, i) => ({ ikon: IKON[i], nilai: n[i], label: t("sm.status." + x) })));
  }
  function tinjau(aksi, id) {
    const r = S.baris.find((x) => String(x.id) === String(id)) || {};
    S.pilih = { aksi, id };
    const alt = [r.alternatif_1, r.alternatif_2].filter(Boolean);
    dlg.innerHTML = `<form class="jm-form"><h2 id="sTinjauJ">${esc(t("sm.ad.a." + aksi))}</h2>
      <p class="jm-bantu">${esc(aksi === "dibuat" ? t("sm.ad.manual") : t("kor.konfirm"))}</p>
      ${aksi === "setuju" ? `<div class="jm-medan"><label for="sAlamat">${esc(t("sm.ad.alamat"))}</label><div class="sm-baris"><input class="jm-isian" id="sAlamat" maxlength="32" value="${esc(r.nama_lokal || "")}" required autocomplete="off" autocapitalize="none" spellcheck="false"><span class="sm-domain">@${DOMAIN}</span></div>
        ${alt.length ? `<p class="jm-bantu">${esc(t("sm.ad.alt", { daftar: alt.join(", ") }))}</p>` : ""}</div>` : ""}
      <div class="jm-medan"><label for="sCatatan">${esc(t(aksi === "tolak" ? "sm.ad.catatan_wajib" : "kor.catatan"))}</label><textarea class="jm-isian" id="sCatatan" rows="3" maxlength="500"></textarea></div><div id="sPesan"></div>
      <div class="jm-aksi"><button type="submit" class="jm-tbl ${aksi === "tolak" ? "jm-tbl-bahaya" : "jm-tbl-utama"}">${esc(t("sm.ad.a." + aksi))}</button><button type="button" class="jm-tbl" data-aksi="batal">${esc(t("jm.batal"))}</button></div></form>`;
    dlg.showModal();
  }
  async function muat() {
    if (S.ctl) S.ctl.abort();
    S.ctl = new AbortController();
    $("sDaftar").innerHTML = hantuHtml(5);
    try { const d = await api(urlAntrean(S.status, S.hal), { signal: S.ctl.signal }); S.baris = d.baris || []; S.total = d.total ?? S.baris.length; S.galat = null; }
    catch (e) { if (e.name === "AbortError") return; S.galat = e.kode || "umum"; S.baris = []; }
    nanti(gambar);
  }
  function aksiSel(r) {
    const tb = (a, ik, kelas) => `<button type="button" class="jm-tbl jm-tbl-kecil ${kelas}" data-aksi="${a}" data-id="${esc(r.id)}">${ikon(ik, 16)}${esc(t("sm.ad.a." + a))}</button>`;
    if (r.status === "diajukan") return `<div class="jm-sel-aksi">${tb("setuju", "centang", "jm-tbl-utama")}${tb("tolak", "silang", "jm-tbl-bahaya")}</div>`;
    if (r.status === "disetujui") return `<div class="jm-sel-aksi">${tb("dibuat", "surel", "jm-tbl-utama")}${tb("tolak", "silang", "jm-tbl-bahaya")}</div>`;
    return `<span class="jm-pil ${PIL[r.status]}">${esc(t("sm.status." + r.status))}</span>`;
  }
  function gambar() {
    const el = $("sDaftar"); if (!el) return;
    if (S.galat) el.innerHTML = keadaan(S.galat);
    else if (!S.baris.length) el.innerHTML = kosongHtml("kor.kosong_antrean");
    else {
      const baris = S.baris.map((r) => {
        const alt = [r.alternatif_1, r.alternatif_2].filter(Boolean).map((x) => `${x}@${DOMAIN}`).join(", ");
        const jejak = [r.pemutus ? `${t("sm.ad.diputus")}: ${r.pemutus}, ${r.diputus_pada ? tanggal(tanggalDariUnix(r.diputus_pada)) : ""}` : "", r.pembuat ? `${t("sm.ad.dibuat")}: ${r.pembuat}, ${r.dibuat_pada ? tanggal(tanggalDariUnix(r.dibuat_pada)) : ""}` : ""].filter(Boolean);
        return `<tr><td data-l="${esc(t("sm.ad.c.pengaju"))}">${esc(r.pengaju || "-")}<small>${esc(r.pengaju_surel || "")}</small></td>
          <td data-l="${esc(t("sm.ad.c.minta"))}"><b>${esc(r.alamat_final || r.nama_lokal)}@${DOMAIN}</b>${alt ? `<small>${esc(t("sm.ad.alt", { daftar: alt }))}</small>` : ""}</td>
          <td data-l="${esc(t("sm.ad.c.alasan"))}"><span class="jm-ringkas-sel">${esc(r.alasan)}</span><small>${esc(r.organisasi)}</small></td>
          <td class="jm-nowrap" data-l="${esc(t("pt.c.tanggal"))}">${tgl(r.dibuat)}</td>
          <td data-l="${esc(t("admin.k.aksi"))}">${aksiSel(r)}${r.catatan_admin ? `<small>${esc(r.catatan_admin)}</small>` : ""}${jejak.map((j) => `<small>${esc(j)}</small>`).join("")}</td></tr>`;
      }).join("");
      el.innerHTML = `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>${["sm.ad.c.pengaju", "sm.ad.c.minta", "sm.ad.c.alasan", "pt.c.tanggal"].map((k) => `<th scope="col">${esc(t(k))}</th>`).join("")}<th scope="col" data-urut="tidak">${esc(t("admin.k.aksi"))}</th></tr></thead><tbody>${baris}</tbody></table></div>`;
    }
    $("sHal").innerHTML = paginasiHtml({ hal: S.hal, total: S.total, per: 50, satuan: "jm.pag.u.permohonan" });
  }
}
