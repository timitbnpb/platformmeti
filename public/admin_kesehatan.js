/* /admin: tab Kesehatan data. Dihitung di peramban dari /data/*.json; tidak ada panggilan server.
   Ubin = jumlah masalah; klik ubin memilih daftar. Logo: resolver inti/logo_org.js (petunjuk di data, bukan cek berkas). */
import { t, angka, tanggal } from "/i18n.js";
import { esc, nanti, hantuHtml, kosongHtml, ikon } from "/inti/umum.js";
import { LOGO_ORG, LOGO_NAMA } from "/inti/logo_org.js";
import { data, kepalaTab, keadaan } from "/admin_umum.js";
import { tombolKoreksi } from "/inti/koreksi.js";

/* [kunci, ikon, entitas, kolom koreksi] */
const MASALAH = [
  ["org_prov", "peta", "organisasi", "provinsi"], ["org_logo", "gambar", "organisasi", "logo"],
  ["pj_sumber", "tautan", "proyek", "nama"], ["pj_kap", "analisis", "proyek", "kapasitas"], ["pj_dev", "orang", "proyek", "pengembang"], ["pj_koor", "wilayah", "proyek", "koordinat"],
  ["rg_pdf", "pdf", "regulasi", "url_pdf"], ["br_foto", "berita", "berita", ""], ["tua", "kalender", "organisasi", "nama"],
];
const BATAS = 12;

function hitung([org, pj, rg, br, foto]) {
  const M = Object.fromEntries(MASALAH.map(([k]) => [k, []]));
  const lalu = new Date(); lalu.setMonth(lalu.getMonth() - BATAS);
  const batas = lalu.toISOString().slice(0, 10);
  const tambah = (k, ent, r, nama, href) => M[k].push({ ent, id: r.id, nama, href });
  const terbaru = (r) => [r.diperiksa, ...(r.sumber || []).map((s) => s.tanggal)].filter(Boolean).map((s) => String(s).slice(0, 10)).sort().pop();
  for (const o of org.baris) {
    const h = "/o/" + encodeURIComponent(o.id);
    if (!o.lokasi?.provinsi) tambah("org_prov", "organisasi", o, o.nama, h);
    if (!o.logo && !LOGO_ORG[o.id] && !LOGO_NAMA[o.nama]) tambah("org_logo", "organisasi", o, o.nama, h);
    const d = terbaru(o); if (d && d < batas) tambah("tua", "organisasi", o, o.nama, h);
  }
  for (const p of pj.baris) {
    const h = "/p/" + encodeURIComponent(p.id);
    if (!p.sumber?.length) tambah("pj_sumber", "proyek", p, p.nama, h);
    if (!p.kapasitas?.length) tambah("pj_kap", "proyek", p, p.nama, h);
    if (!(p.pihak?.pemilik || []).some((x) => x.nilai)) tambah("pj_dev", "proyek", p, p.nama, h);
    if (p.lokasi?.lat == null || p.lokasi?.lng == null) tambah("pj_koor", "proyek", p, p.nama, h);
    const d = terbaru(p); if (d && d < batas) tambah("tua", "proyek", p, p.nama, h);
  }
  for (const r of rg.baris) if (!/^https?:\/\//i.test(r.url_pdf || "")) tambah("rg_pdf", "regulasi", r, r.judul, "/regulasi?id=" + encodeURIComponent(r.id));
  for (const b of br.baris) if (!foto[b.id]) tambah("br_foto", "berita", b, b.judul, /^https?:\/\//i.test(b.url || "") ? b.url : "");
  return M;
}

export async function panelKesehatan(panel) {
  panel.innerHTML = `${kepalaTab("centang", "keh.ey", "keh.j", "keh.d")}<div id="hBadan">${hantuHtml(5)}</div>`;
  const badan = panel.querySelector("#hBadan");
  let M;
  try {
    const d = await Promise.all([data("organisasi"), data("proyek"), data("regulasi"), data("berita"), data("berita_foto").catch(() => ({}))]);
    M = hitung(d);
    M.__tgl = d[0].dibangun_pada;
  } catch (e) { badan.innerHTML = keadaan("umum"); return; }
  let pilih = (MASALAH.find(([k]) => M[k].length) || MASALAH[0])[0];
  nanti(gambar);
  panel.addEventListener("click", (e) => {
    const u = e.target.closest("[data-masalah]");
    if (u) { pilih = u.dataset.masalah; for (const x of panel.querySelectorAll("[data-masalah]")) x.setAttribute("aria-pressed", String(x === u)); nanti(isiTabel); return; }
    if (e.target.closest("a, button")) return;
    const tr = e.target.closest("tr[data-href]");
    if (tr) location.assign(tr.dataset.href);
  });

  function gambar() {
    badan.innerHTML = `<p class="jm-bantu">${esc(t("keh.sumber", { tanggal: tanggal(String(M.__tgl || "").slice(0, 10)) }))}</p>
      <div class="jm-adm-ubin" role="group" aria-label="${esc(t("keh.ubin"))}">${MASALAH.map(([k, ik]) => `<button type="button" class="jm-adm-s jm-adm-u${M[k].length ? "" : " jm-adm-nol"}" data-masalah="${k}" aria-pressed="${k === pilih}"><span class="jm-kpi-ik">${ikon(ik, 18)}</span><strong>${esc(angka(M[k].length))}</strong><small>${esc(t("keh.m." + k))}</small></button>`).join("")}</div>
      <div id="hTabel" aria-live="polite"></div>`;
    isiTabel();
  }
  function isiTabel() {
    const el = panel.querySelector("#hTabel"); if (!el) return;
    const m = MASALAH.find(([k]) => k === pilih), rows = M[pilih];
    if (!rows.length) { el.innerHTML = kosongHtml("keh.bersih"); return; }
    const tampil = rows.slice(0, 200);
    el.innerHTML = `<h3 class="jm-adm-sub">${esc(t("keh.m." + pilih))} <span class="jm-pil">${esc(angka(rows.length))}</span></h3>
      <div class="jm-gulir"><table class="jm-tabel jm-adm-tabel-k"><thead><tr><th scope="col">${esc(t("keh.c.nama"))}</th><th scope="col">${esc(t("keh.c.jenis"))}</th><th scope="col" data-urut="tidak">${esc(t("admin.k.aksi"))}</th></tr></thead><tbody>${tampil.map((r) => `<tr${r.href ? ` data-href="${esc(r.href)}"` : ""}>
        <td data-l="${esc(t("keh.c.nama"))}">${r.href ? `<a href="${esc(r.href)}"${r.ent === "berita" ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(r.nama)}</a>` : esc(r.nama)}</td>
        <td data-l="${esc(t("keh.c.jenis"))}">${esc(t("kor.e." + r.ent))}</td>
        <td data-l="${esc(t("admin.k.aksi"))}">${r.ent === "berita" ? "-" : tombolKoreksi({ entitas: r.ent, id: r.id, nama: r.nama, kolom: m[3] })}</td></tr>`).join("")}</tbody></table></div>
      ${rows.length > tampil.length ? `<p class="jm-bantu">${esc(t("pf.lagi", { n: angka(rows.length - tampil.length) }))}</p>` : ""}`;
  }
}
