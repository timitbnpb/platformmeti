/* /admin: tab Statistik. Server: GET /api/admin/statistik?hari=N. Tanpa data pribadi: kata cari yang menyerupai surel/nomor disamarkan. */
import { t, angka, tanggal } from "/i18n.js";
import { esc, api, nanti, hantuHtml, kosongHtml } from "/inti/umum.js";
import { kepalaTab, keadaan } from "/admin_umum.js";
import { exHtml } from "/inti/komponen.js";

const HARI = [7, 30, 90];
const W = 640, H = 200, KIRI = 36, BAWAH = 22, ATAS = 8;
const samar = (s) => (/@|\d{6,}|https?:/i.test(s) ? t("sta.samar") : s);

function grafik(harian) {
  const maks = Math.max(1, ...harian.map((d) => Math.max(d.halaman || 0, d.cari || 0)));
  const n = harian.length, x = (i) => KIRI + (n > 1 ? (i / (n - 1)) * (W - KIRI - 8) : 0), y = (v) => ATAS + (1 - v / maks) * (H - ATAS - BAWAH);
  const garis = (k, kls) => `<polyline class="${kls}" fill="none" points="${harian.map((d, i) => `${x(i).toFixed(1)},${y(d[k] || 0).toFixed(1)}`).join(" ")}"/>${harian.map((d, i) => `<circle class="${kls}-t" cx="${x(i).toFixed(1)}" cy="${y(d[k] || 0).toFixed(1)}" r="2.5"><title>${esc(tanggal(d.tanggal))}: ${esc(angka(d[k] || 0))}</title></circle>`).join("")}`;
  const tick = [0, maks / 2, maks].map((v) => `<line class="sta-grid" x1="${KIRI}" x2="${W - 8}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="sta-sb" x="${KIRI - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${esc(angka(Math.round(v)))}</text>`).join("");
  return `<svg class="sta-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("sta.grafik"))}" preserveAspectRatio="xMidYMid meet">${tick}
    <text class="sta-sb" x="${KIRI}" y="${H - 4}">${esc(tanggal(harian[0].tanggal))}</text><text class="sta-sb" x="${W - 8}" y="${H - 4}" text-anchor="end">${esc(tanggal(harian[n - 1].tanggal))}</text>
    ${garis("halaman", "sta-g1")}${garis("cari", "sta-g2")}</svg>
    <ul class="sta-legenda"><li><i class="sta-k1"></i>${esc(t("sta.halaman"))}</li><li><i class="sta-k2"></i>${esc(t("sta.cari"))}</li></ul>`;
}
const tabel = (judul, kolom, baris, samarkan) => exHtml({ ikon: "tabel", topik: t("sta.ey"), tingkat: "h3", judulHtml: esc(t(judul)), subHtml: esc(t("sta.sub.tabel")), isiHtml: `${baris.length ? `<div class="jm-gulir"><table class="jm-tabel"><thead><tr><th scope="col">${esc(t(kolom))}</th><th scope="col">${esc(t("sta.jumlah"))}</th></tr></thead><tbody>${baris.map((r) => `<tr><td data-l="${esc(t(kolom))}">${esc(samarkan ? samar(String(r.kunci)) : r.kunci)}</td><td data-l="${esc(t("sta.jumlah"))}"><span data-urut="${+r.jumlah || 0}">${esc(angka(r.jumlah))}</span></td></tr>`).join("")}</tbody></table></div>` : kosongHtml("sta.kosong")}` });

export function panelStatistik(panel) {
  const S = { hari: 30, ctl: null };
  panel.innerHTML = `${kepalaTab("analisis", "sta.ey", "sta.j", "sta.d")}
    <div class="jm-bar jm-adm-bar1"><select data-ikon="tahun" class="jm-pilih" id="sHari" aria-label="${esc(t("sta.rentang"))}">${HARI.map((h) => `<option value="${h}"${h === S.hari ? " selected" : ""}>${esc(t("sta.hari", { n: h }))}</option>`).join("")}</select></div>
    <div id="sIsi" aria-live="polite"></div>`;
  const isi = panel.querySelector("#sIsi");
  panel.addEventListener("change", (e) => { if (e.target.id === "sHari") { S.hari = +e.target.value; muat(); } });
  panel.addEventListener("click", (e) => { if (e.target.closest("[data-aksi=ulang]")) muat(); });
  muat();

  async function muat() {
    if (S.ctl) S.ctl.abort();
    S.ctl = new AbortController();
    isi.innerHTML = hantuHtml(5);
    let d;
    try { d = await api(`/api/admin/statistik?hari=${S.hari}`, { signal: S.ctl.signal }); } catch (e) { if (e.name !== "AbortError") isi.innerHTML = keadaan(e.kode || "umum"); return; }
    nanti(() => {
      const h = d.harian || [];
      isi.innerHTML = `${exHtml({ ikon: "analisis", topik: t("sta.ey"), tingkat: "h3", judulHtml: esc(t("sta.j.grafik")), subHtml: esc(t("sta.sub.grafik")), isiHtml: h.length ? grafik(h) : kosongHtml("sta.kosong") })}<div class="jm-adm-dua">${tabel("sta.top_halaman", "sta.c.halaman", d.halaman || [], false)}${tabel("sta.top_cari", "sta.c.kata", d.cari || [], true)}</div>`;
    });
  }
}
