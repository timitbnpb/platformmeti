/* /admin: tab Kesegaran data (G1). Membaca kesegaran.json, riwayat/perubahan_terbaru.json, dan konsistensi.json; tanpa panggilan server.
   Status: segar (hijau) / perlu diperbarui (kuning) / basi (merah) menurut ambang tiap dataset; grafik perubahan punya tooltip bersama. */
import { t, angka, tanggal } from "/i18n.js";
import { esc, nanti, hantuHtml, kosongHtml, ikon } from "/inti/umum.js";
import { data, kepalaTab, ubinKepala, keadaan } from "/admin_umum.js";
import { exHtml, sumberHtml } from "/inti/komponen.js";
import { batangHtml, pasangBar } from "/analisis.js";
import { IKON_DS } from "/inti/riwayat.js";

for (const [id, href] of [["analisisCss", "/analisis.css"]]) if (!document.getElementById(id)) document.head.append(Object.assign(document.createElement("link"), { id, rel: "stylesheet", href }));

const STATUS = ["segar", "perlu", "basi"];
const IKON_STATUS = { segar: "centang", perlu: "peringatan", basi: "silang" };
const namaDs = (k) => t("rw.d." + k);
const stPil = (s) => `<span class="jm-rw-st jm-rw-${s}">${esc(t("kes.s." + s))}</span>`;
const dsHtml = (k) => `<span class="jm-rw-ds jm-rw-d-${esc(k)}"><span class="jm-rw-ik">${ikon(IKON_DS[k] || "tabel", 16)}</span>${esc(namaDs(k))}</span>`;

const KONS_KELAS = { ok: "segar", bad: "basi", warn: "perlu" };
function konsItem(k, v, gagal) {
  const ket = !v ? "ok" : gagal.has(k) ? "bad" : "warn";
  return `<li><b>${esc(angka(v))}</b><span>${esc(t("kes.kons." + k))}</span><span class="jm-rw-st jm-rw-${KONS_KELAS[ket]}">${esc(t("kes.kons.s." + ket))}</span></li>`;
}

export async function panelKesegaran(panel) {
  panel.innerHTML = `${kepalaTab("jam", "kes.ey", "kes.j", "kes.d")}<div id="kBadan">${hantuHtml(5)}</div>`;
  const badan = panel.querySelector("#kBadan");
  let kes, ter, kons = null;
  try {
    [kes, ter, kons] = await Promise.all([data("kesegaran"), data("riwayat/perubahan_terbaru").catch(() => null), data("konsistensi").catch(() => null)]);
  } catch (e) { badan.innerHTML = kosongHtml("kes.kosong"); return; }
  nanti(() => gambar(kes, ter, kons));

  function gambar(kes, ter, kons) {
    const n = kes.ringkas || {};
    ubinKepala(panel, [{ ikon: "tabel", nilai: kes.jumlah, label: t("kes.k.dataset") }, ...STATUS.map((s) => ({ ikon: IKON_STATUS[s], nilai: n[s] || 0, label: t("kes.s." + s) }))]);
    const sumber = sumberHtml(esc(t("kes.catatan")));
    const tabel = exHtml({ ikon: "tabel", topik: t("kes.ey"), tingkat: "h3", judulHtml: esc(t("kes.tabel.j", { n: "\u0001" })).replace("\u0001", `<span class="jm-hl">${esc(angka(kes.dataset.length))}</span>`), subHtml: esc(t("kes.tabel.sub", { tgl: tanggal(kes.dibangun_pada) })), aksiHtml: sumber,
      isiHtml: `<div class="jm-gulir"><table class="jm-tabel jm-adm-tabel-k"><thead><tr>${["dataset", "status", "umur", "dibangun", "ambang", "baris", "sumber"].map((c) => `<th scope="col">${esc(t("kes.c." + (c === "ambang" ? "ambang" : c)))}</th>`).join("")}</tr></thead><tbody>${kes.dataset.map((d) => `<tr>
        <td data-l="${esc(t("kes.c.dataset"))}">${dsHtml(d.kunci)}</td>
        <td data-l="${esc(t("kes.c.status"))}">${stPil(d.status)}</td>
        <td class="jm-rw-nw" data-l="${esc(t("kes.c.umur"))}">${esc(t("kes.umur", { n: angka(d.umur) }))}</td>
        <td class="jm-rw-nw" data-l="${esc(t("kes.c.dibangun"))}">${esc(tanggal(d.dibangun))}</td>
        <td class="jm-rw-nw" data-l="${esc(t("kes.c.ambang"))}">${esc(t("kes.ambang", { a: angka(d.segar), b: angka(d.basi) }))}</td>
        <td data-l="${esc(t("kes.c.baris"))}">${d.baris ? esc(angka(d.baris)) : '<span class="jm-rw-sunyi" title="-">-</span>'}</td>
        <td data-l="${esc(t("kes.c.sumber"))}">${d.sumber.length ? `<span class="jm-rw-dom">${d.sumber.map((s) => `<span class="jm-pil" title="${esc(angka(s.baris))}">${esc(s.domain)}</span>`).join("")}</span>` : '<span class="jm-rw-sunyi" title="-">-</span>'}</td></tr>`).join("")}</tbody></table></div>` });

    const jenis = ter?.jumlah_jenis || {}, urut = Object.entries(jenis).map(([k, v]) => [k, v, v.tambah + v.hapus + v.ubah]).filter((x) => x[2]).sort((a, b) => b[2] - a[2]);
    const total = urut.reduce((s, x) => s + x[2], 0);
    const grafik = urut.length ? exHtml({ ikon: "linimasa", topik: t("kes.graf.ey"), tingkat: "h3", judulHtml: esc(t("kes.graf.j", { n: "\u0001", hari: ter.hari })).replace("\u0001", `<span class="jm-hl">${esc(angka(total))}</span>`), subHtml: esc(t("kes.graf.sub")),
      isiHtml: `<ul class="jm-rw-legenda" aria-hidden="true">${[["ok", "tambah"], ["bad", "hapus"], ["info", "ubah"]].map(([k, j]) => `<li><span class="jm-rw-seg-sw jm-rw-seg-${k}"></span>${esc(t("rw.j." + j))}</li>`).join("")}</ul><div id="kGraf">${batangHtml(urut.map(([k, v, tot]) => ({ label: namaDs(k), labelHtml: dsHtml(k), teks: angka(tot), bagian: [{ nilai: v.tambah, kelas: "jm-rw-seg-ok" }, { nilai: v.hapus, kelas: "jm-rw-seg-bad" }, { nilai: v.ubah, kelas: "jm-rw-seg-info" }] })), { label: t("kes.graf.aria") })}</div>` }) : "";

    let kon = "";
    if (kons?.jumlah) {
      const gagal = new Set(["tautan_mati", "selisih_ringkas"]), ks = Object.entries(kons.jumlah), tot = ks.reduce((s, [, v]) => s + v, 0);
      kon = exHtml({ ikon: "perisai", topik: t("kes.kons.ey"), tingkat: "h3", judulHtml: esc(t("kes.kons.j", { n: "\u0001" })).replace("\u0001", `<span class="jm-hl">${esc(angka(tot))}</span>`), subHtml: esc(t("kes.kons.sub", { tgl: tanggal(String(kons.dibangun_pada || "").slice(0, 10)) })),
        isiHtml: `<ul class="jm-rw-kons">${ks.map(([k, v]) => konsItem(k, v, gagal)).join("")}</ul>` });
    }
    badan.innerHTML = `${tabel}${grafik}${kon}`;
    const g = badan.querySelector("#kGraf");
    if (g) {
      pasangBar(g);
      const li = [...g.querySelectorAll("ul>li:not(.jm-bar-ax)")];
      urut.forEach(([k, v, tot], i) => { if (li[i]) li[i].title = `${namaDs(k)}: ${t("kes.graf.tip", { d: namaDs(k), n: angka(tot), tambah: angka(v.tambah), hapus: angka(v.hapus), ubah: angka(v.ubah) }).replace(/^[^:]*:\s*/, "")}`; });
    }
  }
}
