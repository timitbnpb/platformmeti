/* /admin: tab Langganan (newsletter, migrasi 0014). Daftar + hitungan per minat + unduh CSV. Server: GET /api/admin/langganan. Hanya admin. */
import { t, angka, tanggalDariUnix } from "/i18n.js";
import { esc, api, nanti, hantuHtml, kosongHtml, galatHtml, pesanHtml } from "/inti/umum.js";

const KOLOM = ["nama", "surel", "instansi", "minat", "status", "dibuat"];
const MINAT = ["kebijakan", "proyek", "acara", "kajian", "lowongan"];

export function panelLangganan(panel) {
  const S = { status: "", hal: 1, ctl: null };
  panel.innerHTML = `<p class="jm-bantu">${esc(t("adm.lg.catatan"))}</p>
    <div class="jm-bar jm-adm-bar1"><select data-ikon="status" class="jm-pilih" id="lgStatus" aria-label="${esc(t("adm.lg.k.status"))}"><option value="">${esc(t("adm.lg.semua"))}</option><option value="aktif">${esc(t("adm.lg.aktif"))}</option><option value="berhenti">${esc(t("adm.lg.berhenti"))}</option></select>
    <a class="jm-tbl" id="lgCsv" href="/api/admin/langganan?format=csv" download>${esc(t("adm.lg.csv"))}</a></div>
    <div id="lgIsi" aria-live="polite"></div>`;
  const isi = panel.querySelector("#lgIsi");
  panel.addEventListener("change", (e) => { if (e.target.id === "lgStatus") { S.status = e.target.value; S.hal = 1; muat(); } });
  panel.addEventListener("click", (e) => {
    if (e.target.closest("[data-aksi=ulang]")) return muat();
    const h = e.target.closest("[data-hal]");
    if (h) { S.hal = +h.dataset.hal; muat(); }
  });
  muat();

  async function muat() {
    if (S.ctl) S.ctl.abort();
    S.ctl = new AbortController();
    isi.innerHTML = hantuHtml(4);
    try {
      const d = await api(`/api/admin/langganan?hal=${S.hal}${S.status ? "&status=" + S.status : ""}`, { signal: S.ctl.signal });
      nanti(() => gambar(d));
    } catch (e) { if (e.name !== "AbortError") isi.innerHTML = galatHtml(e.kode || "umum"); }
  }

  function gambar(d) {
    const ringkas = [["adm.lg.total", d.total], ["adm.lg.aktif", d.aktif], ["adm.lg.berhenti", d.berhenti]]
      .map(([k, n]) => `<li><b>${esc(angka(n))}</b><span>${esc(t(k))}</span></li>`).join("");
    const minat = MINAT.map((m) => `<li><b>${esc(angka(d.per_minat[m] || 0))}</b><span>${esc(t("lg.minat." + m))}</span></li>`).join("");
    const baris = d.baris.map((b) => `<tr><td data-l="${esc(t("adm.lg.k.nama"))}">${esc(b.nama)}</td><td data-l="${esc(t("adm.lg.k.surel"))}">${esc(b.surel)}</td><td data-l="${esc(t("adm.lg.k.instansi"))}">${esc(b.instansi || "-")}</td>
      <td data-l="${esc(t("adm.lg.k.minat"))}">${esc(b.minat.map((m) => t("lg.minat." + m)).join(", ") || "-")}</td><td data-l="${esc(t("adm.lg.k.status"))}">${esc(t("adm.lg." + b.status))}</td><td data-l="${esc(t("adm.lg.k.dibuat"))}">${esc(tanggalDariUnix(b.dibuat))}</td></tr>`).join("");
    const hal = Math.max(1, Math.ceil((S.status === "aktif" ? d.aktif : S.status === "berhenti" ? d.berhenti : d.total) / 50));
    isi.innerHTML = `<ul class="jm-kh-ubin">${ringkas}</ul><h3>${esc(t("adm.lg.per_minat"))}</h3><ul class="jm-kh-ubin">${minat}</ul>
      ${d.baris.length ? `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>${KOLOM.map((k) => `<th scope="col">${esc(t("adm.lg.k." + k))}</th>`).join("")}</tr></thead><tbody>${baris}</tbody></table></div>` : kosongHtml("adm.lg.kosong")}
      ${hal > 1 ? `<div class="jm-bar"><button type="button" class="jm-tbl" data-hal="${Math.max(1, S.hal - 1)}"${S.hal <= 1 ? " disabled" : ""}>${esc(t("adm.lg.sebelum"))}</button><span>${esc(S.hal + " / " + hal)}</span><button type="button" class="jm-tbl" data-hal="${S.hal + 1}"${S.hal >= hal ? " disabled" : ""}>${esc(t("adm.lg.berikut"))}</button></div>` : ""}`;
  }
}
