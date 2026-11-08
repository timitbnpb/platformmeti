/* /hidro, tab Pumped storage: Upper Cisokan dan kandidat Jawa-Bali (Matenggeng, Grindulu, PS tersebar Jawa Barat) dari riset/pumped_storage_offshore.json lewat id; butir desain, kontraktor, jadwal, dan pendanaan membawa sumber. */
import { B, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, batangSvg, tipHtml, kosongTab, daftarCelah, pil, namaProv, tautProvinsi, proyekById, siapTautan, naikkan, catatan, luar } from "/hdr_umum.js";

const psBaris = () => (B.ps?.baris || []).filter((b) => B.hd.rujukan.ps_ids.includes(b.id) && b.jenis === "pumped-storage");
function tabKandidat() {
  const el = document.getElementById("hdr-m-tab"); if (!el) return;
  const sumber = (B.ps?.sumber || []).find((s) => s.id === "ruptl-2025");
  tabel(el, { satuan: "hdr.u.ps", per: 8, urutAwal: 2, menurun: true, kolom: [
    { label: t("hdr.c.kandidat"), v: (b) => b.nama, f: (b) => `<span class="rg3-idk"><b>${esc(b.nama)}</b><small>${esc(b.sistem_id === "jawabali" ? t("hdr.m.jawabali") : b.sistem_id || "")}</small></span>` },
    { label: t("hdr.c.provinsi"), v: (b) => namaProv(b.kode_prov), f: (b) => tautProvinsi(b.kode_prov, namaProv(b.kode_prov)) },
    { label: t("hdr.c.mw_ruptl"), num: true, v: (b) => b.kapasitas_mw_ruptl ?? -1, f: (b) => (b.kapasitas_mw_ruptl != null ? `<b>${esc(num(b.kapasitas_mw_ruptl, b.kapasitas_mw_ruptl % 1 ? 1 : 0))}</b>` : "-") },
    { label: t("hdr.c.mw_gem"), num: true, v: (b) => b.kapasitas_mw_gem ?? -1, f: (b) => (b.kapasitas_mw_gem != null ? esc(num(b.kapasitas_mw_gem, 0)) : "-") },
    { label: t("hdr.c.cod_ruptl"), num: true, v: (b) => (b.cod_ruptl || [0])[0], f: (b) => (b.cod_ruptl?.length ? esc([...new Set(b.cod_ruptl)].join(", ")) : "-") },
    { label: t("hdr.c.status"), v: (b) => b.status_ruptl || "", f: (b) => (b.status_ruptl ? pil("hdr.st.", b.status_ruptl) : `<span class="jm-bantu">${esc(t("hdr.belum_ada"))}</span>`) },
    { label: t("hdr.c.bukti"), v: () => "", f: (b) => bukti(b.tingkat_bukti === "Data" ? "resmi" : "media", { sumber: sumber?.penerbit || "RUPTL", tanggal: B.ps?.dibangun_pada || "" }) },
  ], baris: psBaris() });
}
function grafik() {
  const g = document.getElementById("hdr-m-graf"); if (!g) return;
  g.innerHTML = batangSvg({ el: g, d: 0, satuan: "MW", label: t("hdr.m.j.graf"), seri: [{ k: "v", kelas: "hdr-s-mw" }],
    baris: psBaris().filter((b) => b.kapasitas_mw_ruptl != null).map((b) => ({ label: b.nama, tip: b.nama, th: tipHtml(b.nama, [[t("hdr.c.mw_ruptl"), num(b.kapasitas_mw_ruptl, 1)], [t("hdr.c.mw_gem"), b.kapasitas_mw_gem != null ? num(b.kapasitas_mw_gem, 0) : "-"], [t("hdr.c.cod_ruptl"), (b.cod_ruptl || []).join(", ") || "-"]]), bagian: [{ k: "v", nilai: b.kapasitas_mw_ruptl }] })) });
}
const butir = () => `<ul class="hdr-daftar">${B.hd.pumped.butir.map((x) => { const p = x.proyek_id ? proyekById(x.proyek_id) : null; return `<li>${ikon("baterai", 18)}<div><p>${esc(tx(x.teks))}</p>${p ? `<p class="jm-bantu">${esc(t("hdr.m.proyek"))}: ${esc(p.nama)}${p.mw != null ? ` (${esc(num(p.mw, 0))} MW)` : ""}</p>` : ""}${buktiS(x.sumber_id, x.tingkat_bukti)}</div></li>`; }).join("")}</ul>`;
function dana() {
  const ids = B.hd.rujukan.pendanaan_ids.filter((i) => /wb_P|pw_P|aiib_dev/.test(i)), rows = ids.map((i) => (B.pend?.pendanaan || []).find((x) => x.id === i)).filter(Boolean);
  if (!rows.length) return "";
  return `<ul class="hdr-daftar">${rows.map((x) => `<li>${ikon("kartu", 18)}<div><p><b>${x.url ? luar(x.url, x.nama) : esc(x.nama)}</b></p><p class="jm-bantu">${esc(x.pemberi)}${x.nilai_usd ? `, US$ ${esc(num(x.nilai_usd / 1e6, 0))} ${esc(t("hdr.juta"))}` : ""} ${pil("hdr.st.", x.status || "x")}</p>${bukti(x.tingkat_bukti === "resmi" ? "resmi" : "via-pihak-ketiga", { sumber: x.pemberi, tanggal: x.tanggal_periksa || "" })}</div></li>`).join("")}</ul>`;
}
export function mulai(el) {
  if (!B.hd) { el.innerHTML = kosongTab("hdr.kosong"); return; }
  const n = psBaris().length;
  el.innerHTML = [
    ex({ id: "hdr-m-kandidat", ikon: "baterai", topik: t("hdr.m.ey.kandidat"), judulHtml: esc(t("hdr.m.j.kandidat", { n })), subHtml: esc(t("hdr.m.s.kandidat")), isiHtml: `<div id="hdr-m-graf" class="hdr-grafik"></div><div id="hdr-m-tab"></div>${B.ps?.meta?.celah ? daftarCelah(B.ps.meta.celah.slice(0, 1)) : ""}`, kakiHtml: kakiSumber(["ruptl", "gem-cisokan"]) }),
    ex({ id: "hdr-m-cisokan", ikon: "pabrik", topik: t("hdr.m.ey.cisokan"), judulHtml: esc(t("hdr.m.j.cisokan")), subHtml: esc(t("hdr.m.s.cisokan")), isiHtml: butir() + catatan("hdr.m.n.cisokan") + daftarCelah([B.hd.celah[3]]), kakiHtml: kakiSumber(B.hd.pumped.butir.map((x) => x.sumber_id)) }),
    ex({ id: "hdr-m-dana", ikon: "kartu", topik: t("hdr.m.ey.dana"), judulHtml: esc(t("hdr.m.j.dana")), subHtml: esc(t("hdr.m.s.dana")), isiHtml: dana() + catatan("hdr.m.n.dana") }),
  ].join("");
  grafik(); tabKandidat();
  siapTautan("provinsi", "proyek").then(() => naikkan(el));
}
