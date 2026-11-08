/* /hidro, tab Pendanaan: Bank Dunia, JICA, ADB, AIIB, Norad dan lain-lain. Baris dibaca dari pendanaan.json lewat id (nilai tercatat, tanpa menjumlah lintas mata uang); butir baru bersumber. */
import { B, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, batangSvg, tipHtml, kosongTab, daftarCelah, pil, orgLogoSel, siapTautan, naikkan, luar, catatan } from "/hdr_umum.js";

const rows = () => B.hd.rujukan.pendanaan_ids.map((i) => (B.pend?.pendanaan || []).find((x) => x.id === i)).filter(Boolean);
function grafik() {
  const g = document.getElementById("hdr-n-graf"); if (!g) return;
  const m = new Map();
  for (const r of rows()) if (r.nilai_usd && r.status !== "batal") m.set(r.pemberi, (m.get(r.pemberi) || 0) + r.nilai_usd);
  const top = [...m.entries()].sort((a, b) => b[1] - a[1]);
  g.innerHTML = batangSvg({ el: g, d: 0, satuan: t("hdr.n.juta_usd"), label: t("hdr.n.j.graf"), seri: [{ k: "v", kelas: "hdr-s-mw" }],
    baris: top.map(([p, v]) => ({ label: p, tip: p, th: tipHtml(p, [[t("hdr.n.juta_usd"), num(v / 1e6, 1)]]), bagian: [{ k: "v", nilai: v / 1e6 }] })) });
}
function tabDana() {
  const el = document.getElementById("hdr-n-tab"); if (!el) return;
  tabel(el, { satuan: "hdr.u.dana", per: 8, urutAwal: 3, menurun: true, kolom: [
    { label: t("hdr.c.skema"), v: (r) => r.nama, f: (r) => `<span class="rg3-idk"><b>${r.url ? luar(r.url, r.nama) : esc(r.nama)}</b><small>${esc(r.jenis_entri === "skema" ? t("hdr.n.skema") : t("hdr.n.proyek"))}</small></span>` },
    { label: t("hdr.c.pemberi"), v: (r) => r.pemberi, f: (r) => orgLogoSel(r.lembaga_id || r.pemberi_org_id || null, r.pemberi) },
    { label: t("hdr.c.jenis"), v: (r) => r.jenis || "", f: (r) => (r.jenis ? `<span class="jm-pil">${esc(r.jenis)}</span>` : "-") },
    { label: t("hdr.c.nilai"), num: true, v: (r) => r.nilai_usd ?? -1, f: (r) => (r.nilai_usd ? `<b>${esc(num(r.nilai_usd / 1e6, 1))}</b>` : `<span class="jm-bantu">${esc(t("hdr.belum_ada"))}</span>`) },
    { label: t("hdr.c.status"), v: (r) => r.status || "", f: (r) => (r.status ? pil("hdr.st.", r.status) : "-") },
    { label: t("hdr.c.tahun"), num: true, v: (r) => r.tahun ?? 0, f: (r) => (r.tahun ? esc(String(r.tahun)) : "-") },
    { label: t("hdr.c.bukti"), v: (r) => r.tingkat_bukti || "", f: (r) => bukti(r.tingkat_bukti === "resmi" ? "resmi" : "via-pihak-ketiga", { sumber: r.pemberi, tanggal: r.tanggal_periksa || "" }) },
  ], baris: rows() });
}
const butir = () => `<div class="rg3-kisi">${B.hd.pendanaan.butir.map((x) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon("kartu", 22)}<b>${orgLogoSel(x.org_id, x.lembaga)}</b></div><p class="jm-bantu">${esc(tx(x.teks))}</p>${buktiS(x.sumber_id, x.tingkat_bukti)}</div>`).join("")}</div>`;
export function mulai(el) {
  if (!B.hd) { el.innerHTML = kosongTab("hdr.kosong"); return; }
  el.innerHTML = [
    ex({ id: "hdr-n-lembaga", ikon: "kartu", topik: t("hdr.n.ey.lembaga"), judulHtml: esc(t("hdr.n.j.lembaga")), subHtml: esc(t("hdr.n.s.lembaga")), isiHtml: butir(), kakiHtml: kakiSumber(B.hd.pendanaan.butir.flatMap((x) => [x.sumber_id, x.sumber_id2])) }),
    ex({ id: "hdr-n-daftar", ikon: "tabel", topik: t("hdr.n.ey.daftar"), judulHtml: esc(t("hdr.n.j.daftar", { n: rows().length })), subHtml: esc(t("hdr.n.s.daftar")), isiHtml: `<div id="hdr-n-graf" class="hdr-grafik"></div><div id="hdr-n-tab"></div>${catatan("hdr.n.n.daftar")}<p class="jm-bantu"><a href="/pendanaan">${esc(t("hdr.n.semua"))}</a></p>` }),
  ].join("");
  grafik(); tabDana();
  siapTautan("org").then(() => naikkan(el));
}
