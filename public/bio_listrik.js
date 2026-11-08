/* /bioenergi, tab Biomassa listrik: co-firing PLTU (butir PLN di pemasok_lain, unit di energi_baru), volume lawan target, komposisi bahan, harga Permen ESDM 12/2023, potensi termal PLTBm per provinsi (EST). */
import { B, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, batangSvg, kolomSvg, tipHtml, legendaHtml, siapTautan, naikkan, kosongTab, daftarCelah, catatan, orgSel, butir, tautProvinsi, luar, tautRegulasi } from "/bio_umum.js";

const U = () => B.bio?.cofiring?.unit || [];
const prog = () => (B.enb?.baris || []).find((b) => b.id === "cf-nasional");
function volume() {
  const g = document.getElementById("bn-l-vol"); if (!g) return;
  const baris = U().filter((u) => u.volume_ton && u.periode !== "per bulan").sort((a, b) => b.volume_ton - a.volume_ton);
  g.innerHTML = batangSvg({ el: g, d: 0, satuan: t("bn.u.ribu_t"), label: t("bn.li.j.unit"), seri: [{ k: "v", kelas: "bn-s-biomassa" }],
    baris: baris.map((u) => ({ label: tx(u.nama), logo: `/img/provinsi/${u.prov}.png`, tip: tx(u.nama), th: tipHtml(tx(u.nama), [[t("bn.li.volume"), `${num(u.volume_ton, 0)} t`], [t("bn.c.periode"), u.periode || t("bn.belum")], [t("bn.li.campur"), u.persen ? `${u.persen}%` : t("bn.belum")]], { img: `/img/provinsi/${u.prov}.png` }), bagian: [{ k: "v", nilai: u.volume_ton / 1e3 }] })) });
}
function tahunan() {
  const g = document.getElementById("bn-l-thn"); if (!g) return;
  const T = B.bio.cofiring.tahunan.filter((x) => x.volume_juta_t || x.target);
  document.getElementById("bn-l-thn-l").innerHTML = legendaHtml([{ kelas: "bn-s-realisasi", label: t("bn.bd.realisasi") }, { kelas: "bn-s-target", label: t("bn.li.sisa") }]);
  g.innerHTML = kolomSvg({ el: g, satuan: t("bn.u.juta_t"), label: t("bn.li.j.thn"), seri: [{ k: "real", kelas: "bn-s-realisasi" }, { k: "tgt", kelas: "bn-s-target" }],
    kategori: T.map((x) => ({ label: String(x.tahun), nilai: { real: x.volume_juta_t || 0, tgt: Math.max(0, (x.target || 0) - (x.volume_juta_t || 0)) }, tip: String(x.tahun), th: tipHtml(String(x.tahun), [[t("bn.bd.realisasi"), x.volume_juta_t ? `${num(x.volume_juta_t, 2)} ${t("bn.u.juta_t")}` : t("bn.belum")], [t("bn.li.target"), x.target ? `${num(x.target, 2)} ${t("bn.u.juta_t")}` : t("bn.belum")]]) })) });
}
function komposisi() {
  const g = document.getElementById("bn-l-kom"); if (!g) return;
  const K = B.bio.cofiring.komposisi;
  g.innerHTML = batangSvg({ el: g, d: 1, satuan: "%", label: t("bn.li.j.kom"), seri: K.map((k, i) => ({ k: k.k, kelas: "bn-k" + i })), baris: [{ label: "2023-2026", ikon: "tek-bio", tip: "2023-2026", th: tipHtml("2023-2026", K.map((k) => [t("bn.li.kom." + k.k), `${num(k.persen, 1)}%`])), bagian: K.map((k) => ({ k: k.k, nilai: k.persen })) }] });
  document.getElementById("bn-l-kom-l").innerHTML = legendaHtml(K.map((k, i) => ({ kelas: "bn-k" + i, label: t("bn.li.kom." + k.k) })));
}
function unitTabel() {
  const el = document.getElementById("bn-l-tab"); if (!el) return;
  tabel(el, { satuan: "bn.u.unit", per: 6, urutAwal: 3, menurun: true, kolom: [
    { label: t("bn.c.unit"), v: (u) => tx(u.nama), f: (u) => `<b>${esc(tx(u.nama))}</b>` },
    { label: t("bn.c.prov"), v: (u) => u.prov, f: (u) => tautProvinsi(u.prov) },
    { label: t("bn.li.campur"), num: true, v: (u) => parseFloat(u.persen) || 0, f: (u) => (u.persen ? `${esc(u.persen)}%` : "-") },
    { label: t("bn.li.volume"), num: true, v: (u) => u.volume_ton || 0, f: (u) => (u.volume_ton ? `${esc(num(u.volume_ton, 0))} t${u.periode ? `<small class="rg3-catat">${esc(u.periode)}</small>` : ""}` : "-") },
    { label: t("bn.c.pihak"), v: (u) => u.org_id, f: (u) => orgSel(u.org_id) },
    { label: t("bn.c.bukti"), v: () => "", f: () => bukti("cuplikan", { sumber: "PLN, listrikindonesia.com", tanggal: "2026" }) },
  ], baris: U() });
  siapTautan("org").then(() => naikkan(el));
}
function potensi() {
  const g = document.getElementById("bn-l-pot"); if (!g) return;
  const baris = [...(B.biomassa?.baris || [])].sort((a, b) => b.mw_termal_setara_est - a.mw_termal_setara_est).slice(0, 10);
  g.innerHTML = batangSvg({ el: g, d: 0, satuan: "MW termal", label: t("bn.li.j.pot"), seri: [{ k: "n", kelas: "bn-s-biomassa" }], baris: baris.map((b) => ({ label: b.provinsi, logo: `/img/provinsi/${b.kode_prov}.png`, tip: b.provinsi, th: tipHtml(b.provinsi, [["MW termal (EST)", num(b.mw_termal_setara_est, 0)], ["RUPTL", `${num(b.ruptl_bioenergi_mw ?? 0, 0)} MW`], ["RUEN", `${num(b.ruen_bioenergi_mw ?? 0, 0)} MW`]], { img: `/img/provinsi/${b.kode_prov}.png` }), bagian: [{ k: "n", nilai: b.mw_termal_setara_est }] })) });
}
export function mulai(el) {
  if (!B.bio) { el.innerHTML = kosongTab("bn.kosong"); return; }
  const p = prog(), harga = butir((b) => b.sub?.includes("cofiring") && ["harga", "regulasi"].includes(b.jenis)), ang = Object.fromEntries((p?.angka || []).map((a) => [a.label.id, a.nilai]));
  el.innerHTML = [
    ex({ id: "bn-l-prog", ikon: "petir", topik: t("bn.li.ey.prog"), judulHtml: esc(t("bn.li.j.prog", { n: num(ang["PLTU co-firing 2025 (target)"] || 52) })), subHtml: esc(t("bn.li.s.prog")),
      isiHtml: `<div id="bn-l-thn-l"></div><div id="bn-l-thn" class="ih-bagan"></div><div class="rg3-info">${ikon("info", 18)}<p>${esc(tx(p?.ringkas) || t("bn.belum"))} ${bukti(p?.tingkat_bukti === "media" ? "media" : "cuplikan", { sumber: "PLN, Kontan, Republika", tanggal: p?.tanggal_periksa })}</p></div>${catatan("bn.li.n.thn")}`, kakiHtml: kakiSumber(["kontan-cofiring"]) }),
    ex({ id: "bn-l-unit", ikon: "industri", topik: t("bn.li.ey.unit"), judulHtml: esc(t("bn.li.j.unit")), subHtml: esc(t("bn.li.s.unit")), isiHtml: `<div id="bn-l-vol" class="ih-bagan"></div><div id="bn-l-tab"></div>${daftarCelah((B.bio.celah || []).filter((c, i) => i === 4).map(tx))}` }),
    ex({ id: "bn-l-bahan", ikon: "tek-bio", topik: t("bn.li.ey.kom"), judulHtml: esc(t("bn.li.j.kom")), subHtml: esc(t("bn.li.s.kom")), isiHtml: `<div id="bn-l-kom-l"></div><div id="bn-l-kom" class="ih-bagan"></div><p class="jm-bantu ih-catatan">${esc(tx({ id: B.bio.cofiring.komposisi_catatan, en: B.bio.cofiring.komposisi_catatan }))}</p>` }),
    ex({ id: "bn-l-harga", ikon: "tag", topik: t("bn.li.ey.harga"), judulHtml: esc(t("bn.li.j.harga")), subHtml: esc(t("bn.li.s.harga")),
      isiHtml: `<div class="rg3-kisi">${harga.map((b) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(b.jenis === "harga" ? "tag" : "regulasi", 22)}<b>${esc(b.nilai)}</b></div><p>${esc(b.uraian)}</p><p class="jm-bantu">${esc(b.periode)}</p>${bukti(b.tingkat_bukti, { sumber: "ESDM / media", tanggal: b.tanggal_sumber })} ${luar(b.sumber_url, t("bn.buka"))}</div>`).join("")}</div><p class="jm-bantu">${tautRegulasi("permen-esdm-12-2023", "Permen ESDM 12/2023")}</p>` }),
    (B.biomassa?.baris || []).length ? ex({ id: "bn-l-pot", ikon: "peta", topik: t("bn.li.ey.pot"), judulHtml: esc(t("bn.li.j.pot")), subHtml: esc(t("bn.li.s.pot")), isiHtml: `<div id="bn-l-pot" class="ih-bagan"></div>${catatan("bn.li.n.pot")}` }) : "",
  ].join("");
  tahunan(); volume(); komposisi(); unitTabel(); potensi();
  siapTautan("regulasi").then(() => naikkan(el));
}
