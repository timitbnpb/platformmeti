/* /nuklir, tab Pembiayaan: biaya per kW pembanding (Barakah dihitung dari kontrak dan kapasitas = EST; SMR unit pertama dari rentang industri), contoh investasi 500 MW (Hipotesis), tabel biaya topik nuklir bab 19, sikap Bank Dunia dan ADB, skema pembiayaan contoh. */
import { B, t, ex, num, esc, ikon, tx, buktiS, kartu, butir, kakiSumber, kakiTopik, batangSvg, tipHtml, legendaHtml, tabel, kosongTab, catatan, daftarCelah, bab, bukti } from "/nkl_umum.js";

const hitung = () => { const k = B.nk.biaya, bk = (k.barakah.kontrak_usd_miliar * 1e9) / (k.barakah.kapasitas_gw * 1e6), bt = (k.barakah.pembiayaan_usd_miliar * 1e9) / (k.barakah.kapasitas_gw * 1e6); return { bk, bt, lo: k.smr_foak_usd_per_kw.min, hi: k.smr_foak_usd_per_kw.maks }; };
function grafik() {
  const g = document.getElementById("nkl-c-g"), l = document.getElementById("nkl-c-l"); if (!g) return;
  const h = hitung(), rows = [["bk", "est", h.bk], ["bt", "est", h.bt], ["lo", "foak", h.lo], ["hi", "foak", h.hi]];
  l.innerHTML = legendaHtml([{ kelas: "nkl-s-est", label: t("nkl.c.s.est") }, { kelas: "nkl-s-foak", label: t("nkl.c.s.foak") }]);
  g.innerHTML = batangSvg({ el: g, d: 0, satuan: t("nkl.u.usd_kw"), label: t("nkl.c.j.g"), seri: [{ k: "est", kelas: "nkl-s-est" }, { k: "foak", kelas: "nkl-s-foak" }],
    baris: rows.map(([k, s, v]) => { const lab = t("nkl.c.b." + k); return { label: lab, bagian: [{ k: s, nilai: v }], tip: lab, th: tipHtml(lab, [[t("nkl.c.biaya"), `${num(v, 0)} USD/kW`], [t("nkl.c.bukti"), s === "est" ? t("nkl.c.est") : t("nkl.c.rentang")]]) }; }) });
}
function tabBiaya() {
  const el = document.getElementById("nkl-c-tab"); if (!el) return;
  tabel(el, { satuan: "nkl.u.biaya", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("nkl.c.ukuran"), v: (r) => tx(r.item), f: (r) => `<span class="rg3-teks">${esc(tx(r.item))}</span>` },
    { label: t("nkl.c.nilai"), v: (r) => tx(r.nilai), f: (r) => `<b>${esc(tx(r.nilai))}</b>` },
    { label: t("nkl.c.sumber"), v: (r) => tx(r.sumber), f: (r) => esc(tx(r.sumber)) },
  ], baris: bab("biaya")?.baris || [] });
}
export function mulai(el) {
  if (!B.nk) { el.innerHTML = kosongTab("nkl.kosong"); return; }
  const K = B.nk.biaya, h = hitung(), mw = B.nk.rencana.angka[0].nilai;
  const inv = (usdKw) => num((mw * 1000 * usdKw) / 1e9, 1);
  const kartuHitung = `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon("kalkulator", 22)}<b>${esc(t("nkl.c.k.j", { mw }))}</b></div><p class="nkl-angka">${esc(inv(h.bk))} <small>${esc(t("nkl.u.usd_miliar"))}</small></p><p class="jm-bantu">${esc(t("nkl.c.k.est", { mw, h: num(h.bk, 0) }))}</p>${bukti("est", { sumber: t("nkl.c.hitung") })}</div>
    <div class="rg3-kartu"><div class="rg3-k-kep">${ikon("kalkulator", 22)}<b>${esc(t("nkl.c.k.j2", { mw }))}</b></div><p class="nkl-angka">${esc(inv(h.lo))} - ${esc(inv(h.hi))} <small>${esc(t("nkl.u.usd_miliar"))}</small></p><p class="jm-bantu">${esc(t("nkl.c.k.hip", { mw, a: num(h.lo, 0), b: num(h.hi, 0) }))}</p>${bukti("hipotesis", { sumber: t("nkl.c.hitung") })}</div>`;
  el.innerHTML = [
    ex({ id: "nkl-c-grafik", ikon: "tag", topik: t("nkl.c.ey.g"), judulHtml: esc(t("nkl.c.j.g")), subHtml: esc(t("nkl.c.s.g")), isiHtml: `<div id="nkl-c-l"></div><div id="nkl-c-g" class="ih-bagan"></div>${catatan("nkl.c.n.g")}`, kakiHtml: kakiSumber([K.barakah.sumber_id, K.smr_foak_usd_per_kw.sumber_id]) }),
    ex({ id: "nkl-c-hitung", ikon: "kalkulator", topik: t("nkl.c.ey.hitung"), judulHtml: esc(t("nkl.c.j.hitung")), subHtml: esc(t("nkl.c.s.hitung")), isiHtml: `<div class="rg3-kisi">${kartuHitung}</div>${catatan("nkl.c.n.hitung")}` }),
    ex({ id: "nkl-c-tabel", ikon: "tabel", topik: t("nkl.c.ey.tab"), judulHtml: esc(t("nkl.c.j.tab")), subHtml: esc(t("nkl.c.s.tab")), isiHtml: `<div id="nkl-c-tab"></div>${catatan("nkl.c.n.tab")}`, kakiHtml: kakiTopik(bab("biaya")?.sumber) }),
    ex({ id: "nkl-c-lembaga", ikon: "kartu", topik: t("nkl.c.ey.lembaga"), judulHtml: esc(t("nkl.c.j.lembaga")), subHtml: esc(t("nkl.c.s.lembaga")), isiHtml: butir(K.lembaga, "info"), kakiHtml: kakiSumber(K.lembaga.map((x) => x.sumber_id)) }),
    ex({ id: "nkl-c-skema", ikon: "transaksi", topik: t("nkl.c.ey.skema"), judulHtml: esc(t("nkl.c.j.skema")), subHtml: esc(t("nkl.c.s.skema")), isiHtml: butir(K.skema, "tautan"), kakiHtml: kakiSumber(K.skema.map((x) => x.sumber_id)) }),
    ex({ id: "nkl-c-celah", ikon: "tanya", topik: t("nkl.ey.celah"), judulHtml: esc(t("nkl.j.celah")), isiHtml: daftarCelah(B.nk.celah.filter((c) => /biaya per kW/.test(c))) }),
  ].join("");
  grafik(); tabBiaya();
}
