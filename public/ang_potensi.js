/* /angin, tab Potensi: potensi darat dan lepas pantai (semua versi angka), terpasang lawan target, sebaran 38 provinsi (potensi RUEN/HEESI + kecepatan angin 100 m
   Global Wind Atlas per provinsi, dihitung dari 514 titik kabupaten/kota) dan daftar kabupaten/kota. Dibaca runtime; modul ini tidak menyalin angka. */
import { B, muat, t, ex, num, esc, ikon, tx, buktiS, kakiSumber, tabel, batangSvg, tipHtml, kosongTab, daftarCelah, catatan, bukti, proyekBayu, tautProvinsi, siapTautan, naikkan } from "/ang_umum.js";
import { nanti } from "/inti/umum.js";

const PUSAT = "global-wind-atlas";
function kartu(ik, judul, nilai, satuan, ket, sid, tb) {
  return `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(ik, 22)}<b>${esc(judul)}</b></div><p class="ang-angka">${esc(nilai)} <small>${esc(satuan)}</small></p><p class="jm-bantu">${esc(ket)}</p>${buktiS(sid, tb)}</div>`;
}
function angka() {
  const P = B.ang.potensi, d = P.darat_gw, l = P.lepas_gw, w = P.lepas_wb_gw, terp = P.terpasang_mw[0];
  return [kartu("angin", t("ang.p.darat"), num(d.nilai, 1), "GW", tx(d.ket), d.sumber_id, d.tingkat_bukti),
    kartu("kapal", t("ang.p.lepas"), num(l.nilai, 1), "GW", tx(l.ket), l.sumber_id, l.tingkat_bukti),
    kartu("globe", t("ang.p.lepas_wb"), num(w.nilai, 0), "GW", tx(w.ket), w.sumber_id, w.tingkat_bukti),
    kartu("petir", t("ang.p.terpasang", { th: terp.tahun }), num(terp.nilai, 1), "MW", t("ang.p.dari_darat", { pc: num((terp.nilai / (d.nilai * 1000)) * 100, 2) }) + " " + tx(terp.ket), terp.sumber_id, terp.tingkat_bukti)].join("");
}
function grafikTarget() {
  const el = document.getElementById("ang-p-tg"); if (!el) return;
  const P = B.ang.potensi, terp = P.terpasang_mw[0], rup = (B.ruptl?.baris || []).filter((b) => b.teknologi === "bayu").reduce((s, b) => s + (b.kapasitas_mw || 0), 0);
  const baris = [{ k: "n", label: t("ang.p.g.terpasang", { th: terp.tahun }), gw: terp.nilai / 1000, tip: t("ang.p.g.terpasang", { th: terp.tahun }), src: terp.sumber_id, tb: terp.tingkat_bukti },
    { k: "n", label: t("ang.p.g.ruptl_nama"), gw: rup / 1000, tip: t("ang.p.g.ruptl_nama"), src: "ruptl", tb: "resmi" },
    ...P.target.slice().sort((a, z) => a.tahun - z.tahun).map((x) => ({ k: "t", label: t("ang.p.tg." + x.k, { th: x.tahun }), gw: x.nilai_mw / 1000, tip: t("ang.p.tg." + x.k, { th: x.tahun }), src: x.sumber_id, tb: x.tingkat_bukti }))];
  el.innerHTML = batangSvg({ el, d: 2, satuan: "GW", label: t("ang.p.g.label"), seri: [{ k: "n", kelas: "rg3-s-id" }, { k: "t", kelas: "rg3-s-banding" }],
    baris: baris.map((b) => ({ label: b.label, ikon: "angin", tip: `${b.tip}: ${num(b.gw, 2)} GW`, th: tipHtml(b.label, [[t("ang.p.g.nilai"), `${num(b.gw, 2)} GW`], [t("ang.c.sumber"), B.ang.sumber.find((s) => s.id === b.src)?.penerbit || "-"], [t("ang.c.bukti"), t("ang.p.g.bukti." + b.tb)]]), bagian: [{ k: b.k, nilai: b.gw }] })) });
}
/** Rata-rata dan maksimum kecepatan angin 100 m per provinsi dari titik kabupaten/kota. */
function atlasProv() {
  const m = new Map();
  for (const b of B.atlas?.baris || []) {
    const v = b.angin?.kecepatan_100m_ms; if (v == null) continue;
    const a = m.get(b.kode_provinsi) || { n: 0, s: 0, mx: 0, nama: b.provinsi }; a.n++; a.s += v; a.mx = Math.max(a.mx, v); m.set(b.kode_provinsi, a);
  }
  return m;
}
function barisProv() {
  const at = atlasProv(), pr = proyekBayu();
  return B.ang.potensi.provinsi.map((r) => { const a = at.get(r.kode), ps = pr.filter((x) => x.prov_kode === r.kode); return { ...r, rata: a ? a.s / a.n : null, mx: a?.mx ?? null, kab: a?.n || 0, n: ps.length, mw: ps.reduce((s, x) => s + (x.mw || 0), 0) }; });
}
function grafikProv() {
  const el = document.getElementById("ang-p-pg"); if (!el) return;
  const baris = barisProv().filter((r) => r.rata != null).sort((a, z) => z.rata - a.rata).slice(0, 15);
  el.innerHTML = batangSvg({ el, d: 2, satuan: "m/s", label: t("ang.p.pg.label"), seri: [{ k: "n", kelas: "rg3-s-bayu" }],
    baris: baris.map((r) => ({ label: r.provinsi, logo: `/img/provinsi/${r.kode}.png`, tip: `${r.provinsi}: ${num(r.rata, 2)} m/s`, th: tipHtml(r.provinsi, [[t("ang.c.rata"), `${num(r.rata, 2)} m/s`], [t("ang.c.maks"), `${num(r.mx, 2)} m/s`], [t("ang.c.kab"), num(r.kab, 0)], [t("ang.c.potensi"), r.potensi_mw != null ? `${num(r.potensi_mw, 0)} MW` : "-"]], { img: `/img/provinsi/${r.kode}.png` }), bagian: [{ k: "n", nilai: r.rata }] })) });
}
function tabProv() {
  const el = document.getElementById("ang-p-prov"); if (!el) return;
  tabel(el, { satuan: "ang.u.prov", per: 10, urutAwal: 1, menurun: true, kolom: [
    { label: t("ang.c.provinsi"), v: (r) => r.provinsi, f: (r) => tautProvinsi(r.kode, r.provinsi) },
    { label: t("ang.c.rata"), num: true, v: (r) => r.rata ?? -1, f: (r) => (r.rata != null ? `<b>${esc(num(r.rata, 2))}</b>` : "-") },
    { label: t("ang.c.maks"), num: true, v: (r) => r.mx ?? -1, f: (r) => (r.mx != null ? esc(num(r.mx, 2)) : "-") },
    { label: t("ang.c.potensi"), num: true, v: (r) => r.potensi_mw ?? -1, f: (r) => (r.potensi_mw != null ? esc(num(r.potensi_mw, 0)) : "-") },
    { label: t("ang.c.terpasang"), num: true, v: (r) => r.terpasang_mw ?? -1, f: (r) => (r.terpasang_mw != null ? esc(num(r.terpasang_mw, 0)) : "-") },
    { label: t("ang.c.proyek"), num: true, v: (r) => r.n, f: (r) => esc(num(r.n, 0)) },
    { label: t("ang.c.bukti"), v: () => "", f: () => buktiS(B.ang.potensi.provinsi_sumber_id, "kajian") },
  ], baris: barisProv() });
}
function tabKab() {
  const el = document.getElementById("ang-p-kab"); if (!el) return;
  const baris = (B.atlas?.baris || []).filter((b) => b.angin?.kecepatan_100m_ms != null);
  tabel(el, { satuan: "ang.u.kab", per: 10, urutAwal: 2, menurun: true, kolom: [
    { label: t("ang.c.kabupaten"), v: (b) => b.nama, f: (b) => `<b>${esc(b.nama)}</b>` },
    { label: t("ang.c.provinsi"), v: (b) => b.provinsi, f: (b) => tautProvinsi(b.kode_provinsi, b.provinsi) },
    { label: t("ang.c.v100"), num: true, v: (b) => b.angin.kecepatan_100m_ms, f: (b) => `<b>${esc(num(b.angin.kecepatan_100m_ms, 2))}</b>` },
    { label: t("ang.c.maks"), num: true, v: (b) => b.angin.maks_jendela_ms ?? -1, f: (b) => (b.angin.maks_jendela_ms != null ? esc(num(b.angin.maks_jendela_ms, 2)) : "-") },
    { label: t("ang.c.bukti"), v: () => "", f: (b) => bukti(b.angin.tingkat_bukti || "via-pihak-ketiga", { sumber: "Global Wind Atlas v4 (DTU, Bank Dunia)", tanggal: B.atlas.dibangun_pada || "", cara: t("ang.p.cara_atlas") }) },
  ], baris });
}
export async function mulai(el) {
  await muat(["atlas", "ruptl"]);
  const A = B.ang;
  if (!A) { el.innerHTML = kosongTab("ang.kosong"); return; }
  const adaAtlas = (B.atlas?.baris || []).length > 0;
  el.innerHTML = [
    ex({ id: "ang-p-angka", ikon: "angin", topik: t("ang.p.ey.angka"), judulHtml: esc(t("ang.p.j.angka", { d: num(A.potensi.darat_gw.nilai, 1), l: num(A.potensi.lepas_gw.nilai, 1) })), subHtml: esc(t("ang.p.s.angka")),
      isiHtml: `<div class="rg3-kisi">${angka()}</div><p class="jm-bantu ih-catatan">${esc(tx(A.potensi.catatan_beda))}</p>`, kakiHtml: kakiSumber(["ruen", "etp1", "katadata277", "esmap", "irena", "chambers-2026"]) }),
    ex({ id: "ang-p-target", ikon: "bendera", topik: t("ang.p.ey.target"), judulHtml: esc(t("ang.p.j.target")), subHtml: esc(t("ang.p.s.target")), isiHtml: `<div id="ang-p-tg" class="ih-bagan"></div>${catatan("ang.p.n.target")}`, kakiHtml: kakiSumber(["ruptl-faq", "ruptl", "ruen", "target-5gw"]) }),
    adaAtlas ? ex({ id: "ang-p-prov", ikon: "peta", topik: t("ang.p.ey.prov"), judulHtml: esc(t("ang.p.j.prov")), subHtml: esc(t("ang.p.s.prov")), isiHtml: `<div id="ang-p-pg" class="ih-bagan"></div><div id="ang-p-prov"></div>${catatan("ang.p.n.prov")}${daftarCelah((B.atlas.meta?.celah || []).slice(0, 1))}`, kakiHtml: kakiSumber([A.potensi.provinsi_sumber_id]) }) : "",
    adaAtlas ? ex({ id: "ang-p-kabx", ikon: "lokasi", topik: t("ang.p.ey.kab"), judulHtml: esc(t("ang.p.j.kab", { n: num((B.atlas.baris || []).length, 0) })), subHtml: esc(t("ang.p.s.kab")), isiHtml: `<div id="ang-p-kab"></div>${catatan("ang.p.n.kab")}<p class="jm-bantu"><a class="rg3-tautan" href="/cek-lokasi">${esc(t("ang.p.ke_cek"))}</a></p>` }) : "",
  ].join("");
  nanti(() => { grafikTarget(); if (adaAtlas) { grafikProv(); tabProv(); tabKab(); } });
  siapTautan("provinsi").then(() => naikkan(el));
}
