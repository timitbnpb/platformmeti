/* /bioenergi, tab Pelet dan ekspor: UN Comtrade HS 440131 (pelet kayu) dan HS 230660 (bungkil inti sawit), mitra dengan bendera, pangsa Korea/Jepang, PKS ke Jepang, produsen. HS 230660 BUKAN cangkang. */
import { B, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, kolomSvg, tipHtml, legendaHtml, siapTautan, naikkan, kosongTab, catatan, orgSel, bendera, namaNegara, urlGet, urlSet } from "/bio_umum.js";
import { nanti } from "/inti/umum.js";
import { pilihHtml } from "/inti/komponen.js";
import { pasangPilih } from "/inti/pilih.js";

let hs = "440131";
const C = () => (B.bio?.pelet?.comtrade || []).filter((c) => c.hs === hs);
function grafik() {
  const g = document.getElementById("bn-p-g"); if (!g) return;
  const baris = C(), isos = [...new Set(baris.flatMap((c) => c.mitra.map((m) => m.iso)))];
  document.getElementById("bn-p-l").innerHTML = legendaHtml([...isos.map((i, k) => ({ kelas: "bn-m" + k, label: namaNegara(i) })), { kelas: "bn-m9", label: t("bn.pl.lain") }]);
  g.innerHTML = kolomSvg({ el: g, satuan: t("bn.u.juta_t"), label: t("bn.pl.j.ekspor"), seri: [...isos.map((i, k) => ({ k: i, kelas: "bn-m" + k })), { k: "lain", kelas: "bn-m9" }],
    kategori: baris.map((c) => { const n = {}; let s = 0; for (const m of c.mitra) { n[m.iso] = m.ton / 1e6; s += m.ton; } if (c.ton) n.lain = Math.max(0, (c.ton - s) / 1e6);
      return { label: String(c.tahun), nilai: n, tip: String(c.tahun), th: tipHtml(String(c.tahun), [[t("bn.pl.nilai"), `US$${num(c.usd / 1e6, 1)} ${t("bn.u.juta")}`], [t("bn.pl.berat"), c.ton ? `${num(c.ton / 1e6, 2)} ${t("bn.u.juta_t")}` : t("bn.belum")], ...c.mitra.map((m) => [namaNegara(m.iso), `${num(m.ton / 1e6, 2)} ${t("bn.u.juta_t")}`])]) }; }) });
}
function tab() {
  const el = document.getElementById("bn-p-tab"); if (!el) return;
  const rows = C().flatMap((c) => c.mitra.map((m) => ({ tahun: c.tahun, iso: m.iso, ton: m.ton, pangsa: c.ton ? (m.ton / c.ton) * 100 : null })));
  tabel(el, { satuan: "bn.u.baris", per: 8, urutAwal: 0, menurun: true, kolom: [
    { label: t("bn.c.tahun"), num: true, v: (r) => r.tahun, f: (r) => esc(String(r.tahun)) },
    { label: t("bn.c.negara"), v: (r) => namaNegara(r.iso), f: (r) => `<span class="rg3-neg">${bendera(r.iso, 20)}<span>${esc(namaNegara(r.iso))}</span></span>` },
    { label: t("bn.pl.berat"), num: true, v: (r) => r.ton, f: (r) => `${esc(num(r.ton / 1e3, 0))} ${esc(t("bn.u.ribu_t"))}` },
    { label: t("bn.pl.pangsa"), num: true, v: (r) => r.pangsa ?? -1, f: (r) => (r.pangsa == null ? "-" : `${esc(num(r.pangsa, 1))}%`) },
    { label: t("bn.c.bukti"), v: () => "", f: () => bukti("resmi", { sumber: "UN Comtrade", tanggal: "2026-11-08" }) },
  ], baris: rows });
}
export function mulai(el) {
  if (!B.bio) { el.innerHTML = kosongTab("bn.kosong"); return; }
  const P = B.bio.pelet; hs = urlGet("hs") === "230660" ? "230660" : "440131";
  el.innerHTML = [
    ex({ id: "bn-p-ekspor", ikon: "kapal", topik: t("bn.pl.ey.ekspor"), judulHtml: esc(t("bn.pl.j.ekspor")), subHtml: esc(t("bn.pl.s.ekspor")),
      isiHtml: `<div class="jm-saring rg3-saring rg3-saring-1">${pilihHtml({ id: "bn-p-hs", ikon: "tag", label: t("bn.pl.f.hs"), opsi: [["440131", t("bn.pl.hs.440131"), "tek-bio"], ["230660", t("bn.pl.hs.230660"), "desa"]], nilai: hs })}</div><div id="bn-p-l"></div><div id="bn-p-g" class="ih-bagan"></div><div id="bn-p-tab"></div><p class="jm-bantu ih-catatan">${esc(tx(P.comtrade_catatan))}</p>`, kakiHtml: kakiSumber(["comtrade"]) }),
    ex({ id: "bn-p-industri", ikon: "grafik", topik: t("bn.pl.ey.ind"), judulHtml: esc(t("bn.pl.j.ind")), subHtml: esc(t("bn.pl.s.ind")),
      isiHtml: `<div class="rg3-kisi">${P.industri.map((k) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(k.k === "pks_jepang" ? "kapal" : "pabrik", 22)}<b>${esc(t("bn.pl.k." + k.k))}</b></div><p class="bn-angka">${esc(num(k.nilai, k.nilai % 1 ? 1 : 0))} <small>${esc(k.satuan)}</small></p><p class="jm-bantu">${esc(tx(k.ket))}</p>${buktiS(k.sumber_id, k.tingkat_bukti)}</div>`).join("")}</div>`, kakiHtml: kakiSumber(P.industri.map((k) => k.sumber_id)) }),
    ex({ id: "bn-p-pemain", ikon: "gedung", topik: t("bn.pl.ey.pemain"), judulHtml: esc(t("bn.pl.j.pemain")), subHtml: esc(t("bn.pl.s.pemain")), isiHtml: `<p class="rg3-org">${P.org_ids.map(orgSel).join("")}</p>${catatan("bn.pl.n.pemain")}` }),
  ].join("");
  pasangPilih(); grafik(); tab();
  siapTautan("org").then(() => naikkan(el));
  el.querySelector("#bn-p-hs")?.addEventListener("change", (e) => { hs = e.target.value === "230660" ? "230660" : "440131"; urlSet({ hs: hs === "440131" ? "" : hs }); nanti(() => { grafik(); tab(); }); });
}
