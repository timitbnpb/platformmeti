/* /surya, tab Daur ulang panel: kapasitas surya yang melewati umur desain (riset/daur_ulang.json, IRENASTAT, umur 25 dan 30 tahun), pembanding global, pelaku, dan celah.
   Tonase TIDAK dihitung (faktor massa per MW tidak bersumber). Dibaca runtime; modul ini tidak menyalin angka. INP: grafik dan tabel menyusul lewat nanti(). */
import { X, L, t, ex, num, esc, ikon, bukti, luar, tabel, kolomSvg, legendaHtml, tipHtml, kosongTab, daftarCelah, catatan, muat, namaOrg, sumberBerkas } from "/sy_umum.js";
import { nanti } from "/inti/umum.js";

const D = () => X.daur;
function grafik() {
  const el = document.getElementById("sur-d-g"); if (!el) return;
  el.innerHTML = kolomSvg({ el, satuan: "MW", label: t("sur.d.j.pensiun"), seri: [{ k: "a", kelas: "sur-s-kap" }, { k: "b", kelas: "sur-s-butuh" }],
    kategori: D().baris.filter((r) => r.tahun >= 2030).map((r) => ({ label: String(r.tahun), nilai: { a: r.kapasitas_pensiun_kumulatif_mw.umur_30, b: Math.max(0, r.kapasitas_pensiun_kumulatif_mw.umur_25 - r.kapasitas_pensiun_kumulatif_mw.umur_30) }, tip: `${r.tahun}: ${num(r.kapasitas_pensiun_kumulatif_mw.umur_25, 1)} MW`, th: tipHtml(String(r.tahun), [[t("sur.d.umur25"), `${num(r.kapasitas_pensiun_kumulatif_mw.umur_25, 1)} MW`], [t("sur.d.umur30"), `${num(r.kapasitas_pensiun_kumulatif_mw.umur_30, 1)} MW`]]) })) });
}
function tabelPlg() {
  const el = document.getElementById("sur-d-t"); if (!el) return;
  tabel(el, { satuan: "sur.u.tahun", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("sur.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => esc(String(r.tahun)) },
    { label: t("sur.d.umur25"), num: true, v: (r) => r.kapasitas_pensiun_kumulatif_mw.umur_25, f: (r) => `<b>${esc(num(r.kapasitas_pensiun_kumulatif_mw.umur_25, 2))}</b> MW` },
    { label: t("sur.d.umur30"), num: true, v: (r) => r.kapasitas_pensiun_kumulatif_mw.umur_30, f: (r) => `${esc(num(r.kapasitas_pensiun_kumulatif_mw.umur_30, 2))} MW` },
    { label: t("sur.c.bukti"), v: (r) => r.tingkat_bukti, f: (r) => bukti(r.tingkat_bukti, { sumber: "IRENASTAT", cara: r.rumus }) },
  ], baris: D().baris });
}
export async function mulai(el) {
  await muat(["daur", "org"]);
  if (!D()?.baris?.length) { el.innerHTML = kosongTab("sur.kosong_data"); return; }
  const d = D(), g = d.pembanding_global || {}, last = d.baris.find((r) => r.tahun === 2040) || d.baris.at(-1);
  const rg = (a) => (Array.isArray(a) ? `${num(a[0], 1)} - ${num(a[1], 1)}` : "-");
  el.innerHTML = [
    ex({ id: "sur-d-pensiun", ikon: "daur", topik: t("sur.d.ey.pensiun"), judulHtml: esc(t("sur.d.j.pensiun")), subHtml: esc(t("sur.d.s.pensiun")),
      isiHtml: `<div class="rg3-kisi"><div class="rg3-kartu sur-ubin"><span class="jm-kh-lbl">${esc(t("sur.d.u.2040"))}</span><p class="sur-angka"><b>${esc(num(last.kapasitas_pensiun_kumulatif_mw.umur_25, 0))}</b><span>MW</span></p><span class="rg3-ab">${bukti("est", { sumber: "IRENASTAT", cara: last.rumus })}</span></div>
      <div class="rg3-kartu sur-ubin"><span class="jm-kh-lbl">${esc(t("sur.d.u.g2030"))}</span><p class="sur-angka"><b>${esc(rg(g.limbah_kumulatif_2030_mt))}</b><span>Mt</span></p><span class="rg3-ab">${bukti("est", { sumber: t("sur.d.pembanding") })}</span></div>
      <div class="rg3-kartu sur-ubin"><span class="jm-kh-lbl">${esc(t("sur.d.u.g2050"))}</span><p class="sur-angka"><b>${esc(rg(g.limbah_kumulatif_2050_mt))}</b><span>Mt</span></p><span class="rg3-ab">${bukti("est", { sumber: t("sur.d.pembanding") })}</span></div></div>
      ${legendaHtml([{ kelas: "sur-s-kap", label: t("sur.d.umur30") }, { kelas: "sur-s-butuh", label: t("sur.d.tambah25") }])}<div id="sur-d-g" class="ih-bagan"></div><div id="sur-d-t"></div>${catatan("sur.d.n.pensiun")}`, kakiHtml: sumberBerkas(d, ["irenastat"]) }),
    ex({ id: "sur-d-pelaku", ikon: "gedung", topik: t("sur.d.ey.pelaku"), judulHtml: esc(t("sur.d.j.pelaku")), subHtml: esc(t("sur.d.s.pelaku")),
      isiHtml: `<ul class="sur-daftar">${(d.pelaku || []).map((p) => `<li>${ikon("daur", 18)}<div><b>${namaOrg(p.org_id, p.nama)}</b><p class="jm-bantu">${esc(p.status)}</p>${bukti(p.tingkat_bukti, { sumber: t("sur.d.pelaku_sumber") })} ${luar(p.url, t("sur.d.sumber"))}</div></li>`).join("")}</ul>${catatan("sur.d.n.pelaku")}${daftarCelah((d.meta?.celah || []).slice(0, 3))}` }),
  ].join("");
  nanti(() => { grafik(); tabelPlg(); });
}
