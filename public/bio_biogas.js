/* /bioenergi, tab Biogas dan biometana: potensi POME per provinsi (riset/biomassa, EST), PLTBg, pemanfaatan nasional, bio-CNG. */
import { B, t, ex, num, esc, ikon, tx, buktiS, kakiSumber, tabel, batangSvg, tipHtml, siapTautan, naikkan, kosongTab, daftarCelah, catatan, orgSel, tautProvinsi, bukti } from "/bio_umum.js";

function pome() {
  const g = document.getElementById("bn-g-pome"); if (!g) return;
  const baris = [...(B.biomassa?.baris || [])].sort((a, b) => b.pome_m3_est - a.pome_m3_est).slice(0, 10);
  g.innerHTML = batangSvg({ el: g, d: 2, satuan: t("bn.u.juta_m3"), label: t("bn.bg.j.pome"), seri: [{ k: "n", kelas: "bn-s-biogas" }], baris: baris.map((b) => ({ label: b.provinsi, logo: `/img/provinsi/${b.kode_prov}.png`, tip: b.provinsi, th: tipHtml(b.provinsi, [[t("bn.bh.m.pome"), `${num(b.pome_m3_est / 1e6, 2)} ${t("bn.u.juta_m3")}`], ["MW termal (biogas)", num(b.mw_termal_per_residu_est?.pome_biogas ?? 0, 1)], [t("bn.bh.m.cpo"), `${num(b.cpo_ton / 1e6, 2)} ${t("bn.u.juta_t")}`]], { img: `/img/provinsi/${b.kode_prov}.png` }), bagian: [{ k: "n", nilai: b.pome_m3_est / 1e6 }] })) });
}
function pltbg() {
  const el = document.getElementById("bn-g-tab"); if (!el) return;
  tabel(el, { satuan: "bn.u.unit", per: 5, urutAwal: 0, menurun: false, kolom: [
    { label: t("bn.c.unit"), v: (u) => tx(u.nama), f: (u) => `<b>${esc(tx(u.nama))}</b><small class="rg3-catat">${esc(tx(u.catatan))}</small>` },
    { label: t("bn.c.prov"), v: (u) => u.prov, f: (u) => tautProvinsi(u.prov) },
    { label: t("bn.bg.mw"), num: true, v: (u) => u.mw, f: (u) => `${esc(num(u.mw, 1))} MW` },
    { label: t("bn.c.pihak"), v: (u) => u.org_ids[0], f: (u) => u.org_ids.map(orgSel).join(" ") },
    { label: t("bn.c.bukti"), v: (u) => u.tingkat_bukti, f: (u) => buktiS(u.sumber_id, u.tingkat_bukti) },
  ], baris: B.bio.biogas.pltbg });
  siapTautan("org", "provinsi").then(() => naikkan(el));
}
export function mulai(el) {
  if (!B.bio) { el.innerHTML = kosongTab("bn.kosong"); return; }
  const G = B.bio.biogas, tot = (B.biomassa?.baris || []).reduce((a, b) => a + (b.pome_m3_est || 0), 0);
  el.innerHTML = [
    ex({ id: "bn-g-pot", ikon: "air-energi", topik: t("bn.bg.ey.pome"), judulHtml: esc(t("bn.bg.j.pome", { n: num(tot / 1e6, 0) })), subHtml: esc(t("bn.bg.s.pome")), isiHtml: `<div id="bn-g-pome" class="ih-bagan"></div>${catatan("bn.bg.n.pome")}` }),
    ex({ id: "bn-g-nas", ikon: "grafik", topik: t("bn.bg.ey.nas"), judulHtml: esc(t("bn.bg.j.nas")), subHtml: esc(t("bn.bg.s.nas")),
      isiHtml: `<div class="rg3-kisi">${G.nasional.map((k) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(k.k === "potensi" ? "bintang" : "tek-bio", 22)}<b>${esc(t("bn.bg.k." + k.k))}</b></div><p class="bn-angka">${esc(num(k.nilai, 1))} <small>${esc(k.satuan)}</small></p><p class="jm-bantu">${esc(tx(k.ket))}</p>${buktiS(k.sumber_id, k.tingkat_bukti)}</div>`).join("")}</div>`, kakiHtml: kakiSumber(G.nasional.map((k) => k.sumber_id)) }),
    ex({ id: "bn-g-pltbg", ikon: "petir", topik: t("bn.bg.ey.pltbg"), judulHtml: esc(t("bn.bg.j.pltbg")), subHtml: esc(t("bn.bg.s.pltbg")), isiHtml: `<div id="bn-g-tab"></div>`, kakiHtml: kakiSumber(G.pltbg.map((k) => k.sumber_id)) }),
    ex({ id: "bn-g-cng", ikon: "petir", topik: t("bn.bg.ey.cng"), judulHtml: esc(t("bn.bg.j.cng")), subHtml: esc(t("bn.bg.s.cng")),
      isiHtml: `<div class="rg3-info">${ikon("info", 18)}<p>${esc(tx(G.biocng.ket))} ${buktiS(G.biocng.sumber_id, G.biocng.tingkat_bukti)}</p></div><p class="rg3-org">${G.biocng.org_ids.map(orgSel).join("")}</p>`, kakiHtml: kakiSumber([G.biocng.sumber_id]) }),
  ].join("");
  pome(); pltbg();
}
