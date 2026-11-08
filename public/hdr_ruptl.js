/* /hidro, tab RUPTL dan kebijakan: PLTA/PLTM dalam RUPTL 2025-2034 (ruptl.json, skenario RE Base) per tahun COD dan daftar, lalu regulasi dari regulasi.json lewat id. */
import { B, t, ex, num, esc, bukti, kakiSumber, tabel, kolomSvg, tipHtml, kosongTab, pil, luar, tautProvinsi, tautRegulasi, siapTautan, naikkan, catatan } from "/hdr_umum.js";

const baris = () => (B.rup?.baris || []).filter((r) => r.teknologi === "hidro");
function grafik() {
  const g = document.getElementById("hdr-r-graf"); if (!g) return;
  const m = new Map();
  for (const r of baris()) { const th = (r.cod_tahun || [])[0]; if (th) m.set(th, (m.get(th) || 0) + (r.kapasitas_mw || 0)); }
  const th = [...m.keys()].sort();
  g.innerHTML = kolomSvg({ el: g, satuan: "MW", label: t("hdr.r.j.graf"), seri: [{ k: "v", kelas: "hdr-s-mw" }],
    kategori: th.map((y) => ({ label: String(y), nilai: { v: m.get(y) }, tip: String(y), th: tipHtml(String(y), [["MW", num(m.get(y), 0)], [t("hdr.p.n_label"), String(baris().filter((r) => (r.cod_tahun || [])[0] === y).length)]]) })) });
}
function tabRuptl() {
  const el = document.getElementById("hdr-r-tab"); if (!el) return;
  tabel(el, { satuan: "hdr.u.ruptl", per: 10, urutAwal: 2, menurun: true, kolom: [
    { label: t("hdr.c.pembangkit"), v: (r) => r.nama, f: (r) => `<span class="rg3-idk"><b>${esc(r.nama)}</b><small>${esc(r.provinsi || "")}</small></span>` },
    { label: t("hdr.c.status"), v: (r) => r.status, f: (r) => pil("hdr.st.", r.status) },
    { label: t("hdr.c.mw"), num: true, v: (r) => r.kapasitas_mw ?? -1, f: (r) => (r.kapasitas_mw != null ? `<span class="rg3-idk"><b>${esc(num(r.kapasitas_mw, r.kapasitas_mw % 1 ? 1 : 0))}</b>${r.kapasitas_catatan ? `<small>${esc(r.kapasitas_catatan)}</small>` : ""}</span>` : "-") },
    { label: t("hdr.c.cod"), num: true, v: (r) => (r.cod_tahun || [0])[0], f: (r) => (r.cod_tahun?.length ? esc(r.cod_tahun.join(", ")) : "-") },
    { label: t("hdr.c.pengembang"), v: (r) => r.pengembang_status || "", f: (r) => (r.pengembang_status ? `<span class="jm-pil">${esc(r.pengembang_status)}</span>` : "-") },
    { label: t("hdr.c.halaman"), num: true, v: (r) => r.halaman ?? 0, f: (r) => (r.halaman ? esc(String(r.halaman)) : "-") },
    { label: t("hdr.c.bukti"), v: () => "", f: () => bukti("resmi", { sumber: "RUPTL PLN 2025-2034", tanggal: B.rup?.meta?.diperbarui || "" }) },
  ], baris: baris() });
}
function tabReg() {
  const el = document.getElementById("hdr-r-reg"); if (!el) return;
  const rows = B.hd.rujukan.regulasi_ids.map((id) => (B.reg?.baris || []).find((r) => r.id === id)).filter(Boolean);
  tabel(el, { satuan: "hdr.u.reg", per: 8, urutAwal: 2, menurun: true, kolom: [
    { label: t("hdr.c.peraturan"), v: (r) => `${r.jenis} ${r.nomor}/${r.tahun}`, f: (r) => `<span class="rg3-idk"><b>${tautRegulasi(r.id, `${String(r.jenis).toUpperCase()} ${r.nomor}/${r.tahun}`)}</b><small>${esc(r.instansi_penerbit || "")}</small></span>` },
    { label: t("hdr.c.tentang"), v: (r) => r.judul, f: (r) => `<span class="rg3-teks">${esc(r.judul)}</span>` },
    { label: t("hdr.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => esc(String(r.tahun)) },
    { label: t("hdr.c.status"), v: (r) => r.status, f: (r) => pil("hdr.rst.", r.status) },
    { label: t("hdr.c.sumber"), v: () => "", f: (r) => (r.url_sumber ? luar(r.url_sumber, t("hdr.k.buka")) : "-") },
    { label: t("hdr.c.bukti"), v: () => "", f: (r) => bukti("resmi", { sumber: r.instansi_penerbit || "JDIH", tanggal: r.tanggal_ambil || "" }) },
  ], baris: rows });
}
export function mulai(el) {
  if (!B.hd || !B.rup) { el.innerHTML = kosongTab("hdr.kosong"); return; }
  const R = baris(), mw = R.reduce((s, r) => s + (r.kapasitas_mw || 0), 0);
  el.innerHTML = [
    ex({ id: "hdr-r-ruptl", ikon: "petir", topik: t("hdr.r.ey.ruptl"), judulHtml: esc(t("hdr.r.j.ruptl", { n: R.length, mw: num(mw, 0) })), subHtml: esc(t("hdr.r.s.ruptl")), isiHtml: `<div id="hdr-r-graf" class="hdr-grafik"></div><div id="hdr-r-tab"></div><p class="jm-bantu ih-catatan">${esc(B.hd.ruptl.catatan[document.documentElement.lang === "en" ? "en" : "id"])}</p>`, kakiHtml: kakiSumber(["ruptl"]) }),
    ex({ id: "hdr-r-regb", ikon: "palu", topik: t("hdr.r.ey.reg"), judulHtml: esc(t("hdr.r.j.reg")), subHtml: esc(t("hdr.r.s.reg")), isiHtml: `<div id="hdr-r-reg"></div>${catatan("hdr.r.n.reg")}<p class="jm-bantu"><a href="/regulasi">${esc(t("hdr.k.semua"))}</a></p>`, kakiHtml: kakiSumber(["perpres112"]) }),
  ].join("");
  grafik(); tabRuptl(); tabReg();
  siapTautan("regulasi", "provinsi").then(() => naikkan(el));
}
