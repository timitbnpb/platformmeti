/* /admin tab Surel, bagian "Surel keluar" (F65-215, 216): antrean pengingat dan buletin, serta draf buletin mingguan.
   Platform ini BELUM mengirim surel (K19: layanan surel belum dipilih). Menyetujui draf hanya memasukkannya ke antrean; layar menulis itu apa adanya.
   Hak ditegakkan di server (admin, super). Semua nilai lewat esc(). */
import { t, angka, tanggal, tanggalDariUnix } from "/i18n.js";
import { esc, api, nanti, hantuHtml, galatTeks, ikon, pesanHtml } from "/inti/umum.js";

const PIL = { draf: "jm-pil-warn", disetujui: "jm-pil-ok", batal: "" };
export function pasangSurelKeluar(el) {
  let d = null;
  async function muat() {
    el.innerHTML = hantuHtml(3);
    try { d = await api("/api/admin/surel-keluar"); } catch (e) { el.innerHTML = e.kode === "fitur_belum_aktif" ? "" : pesanHtml("galat", galatTeks(e.kode || "umum")); return; }
    nanti(gambar);
  }
  const hitung = (jenis, status) => d.antre.filter((x) => x.jenis === jenis && (!status || x.status === status)).reduce((n, x) => n + x.n, 0);
  function gambar() {
    const draf = d.draf.length ? `<ul class="ask-draf">${d.draf.map((x) => `<li><div class="ask-kepala"><b>${esc(x.subjek)}</b><span class="jm-pil ${PIL[x.status] || ""}">${esc(t("ask.st." + x.status))}</span></div>
        <small>${esc(t("ask.dirakit", { tgl: tanggal(tanggalDariUnix(x.dibuat)) }))}${x.status === "disetujui" ? " " + esc(t("ask.penerima_tetap", { n: angka(x.penerima ?? 0) })) : ""}</small>
        <details><summary>${esc(t("ask.pratinjau"))}</summary><pre class="ask-pre">${esc(x.isi)}</pre></details>
        ${x.status === "draf" ? `<p class="jm-bantu">${ikon("orang", 14)} ${esc(t("ask.penerima", { n: angka(d.pelanggan_aktif) }))}</p>
          <div class="jm-sel-aksi"><button type="button" class="jm-tbl jm-tbl-kecil jm-tbl-utama" data-bl="setuju:${esc(x.id)}">${ikon("centang", 16)}<span>${esc(t("ask.setuju"))}</span></button><button type="button" class="jm-tbl jm-tbl-kecil" data-bl="batal:${esc(x.id)}">${ikon("silang", 16)}<span>${esc(t("ask.batal"))}</span></button></div>` : ""}</li>`).join("")}</ul>`
      : `<p class="jm-bantu">${esc(t("ask.draf_kosong"))}</p>`;
    el.innerHTML = `<header class="jm-adm-bhd"><div><h3>${esc(t("ask.j"))}</h3><p class="jm-bantu">${esc(t("ask.bantu"))}</p></div></header>
      <p class="ask-catatan" role="note">${ikon("info", 16)}<span>${esc(t("ask.belum_kirim"))}</span></p>
      <dl class="ask-angka"><div><dt>${esc(t("ask.n.pengingat"))}</dt><dd>${esc(angka(hitung("pengingat", "antre")))}</dd></div><div><dt>${esc(t("ask.n.buletin"))}</dt><dd>${esc(angka(hitung("buletin", "antre")))}</dd></div>
        <div><dt>${esc(t("ask.n.pelanggan"))}</dt><dd>${esc(angka(d.pelanggan_aktif))}</dd></div><div><dt>${esc(t("ask.n.plafon"))}</dt><dd>${esc(angka(d.plafon_pengingat))}</dd></div></dl>
      <div class="ask-kepala"><h4>${esc(t("ask.draf"))}</h4><button type="button" class="jm-tbl jm-tbl-kecil" data-bl="rakit">${ikon("tambah", 16)}<span>${esc(t("ask.rakit"))}</span></button></div><div id="askPesan" aria-live="polite"></div>${draf}`;
  }
  el.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-bl]"); if (!b) return;
    const [aksi, id] = b.dataset.bl.split(":");
    if (aksi === "setuju" && !confirm(t("ask.setuju_tanya", { n: angka(d.pelanggan_aktif) }))) return;
    b.disabled = true;
    try {
      const r = aksi === "rakit" ? await api("/api/admin/buletin/rakit", { metode: "POST", badan: {} }) : await api(`/api/admin/buletin/${encodeURIComponent(id)}`, { metode: "POST", badan: { aksi } });
      await muat();
      const p = el.querySelector("#askPesan");
      if (p) p.innerHTML = pesanHtml("ok", aksi === "rakit" ? t(r.kosong ? "ask.rakit_kosong" : r.baru ? "ask.rakit_baru" : "ask.rakit_ada") : aksi === "setuju" ? t("ask.diantrekan", { n: angka(r.antre) }) : t("ask.dibatalkan"));
    } catch (x) { b.disabled = false; alert(x.status === 409 ? t("ask.konflik") : galatTeks(x.kode || "umum")); }
  });
  document.addEventListener("jm:bahasa", () => { if (d) gambar(); });
  muat();
}
