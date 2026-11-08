/* /bioenergi, tab Neraca: CPO untuk pangan, energi (biodiesel), dan sisa (ekspor, oleokimia, stok). Seluruh turunan berlabel Hipotesis: faktor CPO per kl dari kajian BPDP, tahun campuran (produksi 2023, alokasi 2026). */
import { B, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, kolomSvg, tipHtml, legendaHtml, kosongTab, catatan, urlGet, urlSet, juta } from "/bio_umum.js";
import { nanti } from "/inti/umum.js";
import { pilihHtml } from "/inti/komponen.js";
import { pasangPilih } from "/inti/pilih.js";

let sk = "b40";
const hitung = () => {
  const n = B.bio.neraca, prod = n.cpo_ton_2023, b40 = Math.round(n.alokasi_2026_kl * n.faktor_cpo_per_kl), b50 = n.energi_b50_cpo_ton;
  const baris = (energi) => ({ energi, pangan: n.pangan_ton, sisa: Math.max(0, prod - n.pangan_ton - energi) });
  return { prod, b40: baris(b40), b50: baris(b50) };
};
function grafik() {
  const g = document.getElementById("bn-n-g"); if (!g) return;
  const h = hitung();
  document.getElementById("bn-n-l").innerHTML = legendaHtml([{ kelas: "bn-s-energi", label: t("bn.nr.energi") }, { kelas: "bn-s-pangan", label: t("bn.nr.pangan") }, { kelas: "bn-s-sisa", label: t("bn.nr.sisa") }]);
  g.innerHTML = kolomSvg({ el: g, satuan: t("bn.u.juta_t"), label: t("bn.nr.j"), ref: { nilai: h.prod / 1e6, label: t("bn.nr.prod") }, seri: [{ k: "energi", kelas: "bn-s-energi" }, { k: "pangan", kelas: "bn-s-pangan" }, { k: "sisa", kelas: "bn-s-sisa" }],
    kategori: ["b40", "b50"].map((k) => ({ label: t("bn.nr.sk." + k), nilai: { energi: h[k].energi / 1e6, pangan: h[k].pangan / 1e6, sisa: h[k].sisa / 1e6 }, tip: t("bn.nr.sk." + k),
      th: tipHtml(t("bn.nr.sk." + k), [[t("bn.nr.energi"), `${juta(h[k].energi, 2)} ${t("bn.u.juta_t")}`], [t("bn.nr.pangan"), `${juta(h[k].pangan, 2)} ${t("bn.u.juta_t")}`], [t("bn.nr.sisa"), `${juta(h[k].sisa, 2)} ${t("bn.u.juta_t")}`], [t("bn.nr.pangsa"), `${num((h[k].energi / h.prod) * 100, 1)}%`]]) })) });
  const d = h[sk], n = B.bio.neraca;
  document.getElementById("bn-n-d").innerHTML = `<div class="rg3-kisi">${[["energi", "petir", d.energi], ["pangan", "tag", d.pangan], ["sisa", "kapal", d.sisa]].map(([k, ik, v]) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(ik, 22)}<b>${esc(t("bn.nr." + k))}</b></div><p class="bn-angka">${esc(juta(v, 2))} <small>${esc(t("bn.u.juta_t"))}</small></p><p class="jm-bantu">${esc(num((v / h.prod) * 100, 1))}% ${esc(t("bn.nr.dari_prod"))}</p>${bukti(k === "pangan" ? "kata-pihak" : "hipotesis", { sumber: k === "pangan" ? "Metro TV, Menteri ESDM" : "METI", cara: tx(n.catatan) })}</div>`).join("")}</div><div class="rg3-info rg3-info-ok">${ikon("info", 18)}<p>${esc(t("bn.nr.pemerintah", { n: juta(n.b50_pemerintah_cpo_ton, 1), b: juta(n.energi_b50_cpo_ton, 1) }))} ${buktiS("metro-b50", "kata-pihak")}</p></div>`;
}
export function mulai(el) {
  if (!B.bio?.neraca) { el.innerHTML = kosongTab("bn.kosong"); return; }
  sk = urlGet("sk") === "b50" ? "b50" : "b40";
  const n = B.bio.neraca;
  el.innerHTML = ex({ id: "bn-n-neraca", ikon: "grafik", topik: t("bn.nr.ey"), judulHtml: esc(t("bn.nr.j", { n: juta(n.cpo_ton_2023, 1) })), subHtml: esc(t("bn.nr.s")),
    isiHtml: `<div class="jm-saring rg3-saring rg3-saring-1">${pilihHtml({ id: "bn-n-sk", ikon: "jenis", label: t("bn.nr.f.sk"), opsi: [["b40", t("bn.nr.sk.b40"), "petir"], ["b50", t("bn.nr.sk.b50"), "bintang"]], nilai: sk })}</div><p class="jm-bantu">${bukti("hipotesis", { cara: tx(n.catatan) })} ${esc(t("bn.nr.faktor", { f: num(n.faktor_cpo_per_kl, 2) }))}</p><div id="bn-n-l"></div><div id="bn-n-g" class="ih-bagan"></div><div id="bn-n-d"></div><p class="jm-bantu ih-catatan">${esc(tx(n.catatan))}</p>`, kakiHtml: kakiSumber(["metro-pangan", "metro-b50"]) });
  pasangPilih(); grafik();
  el.querySelector("#bn-n-sk")?.addEventListener("change", (e) => { sk = e.target.value === "b50" ? "b50" : "b40"; urlSet({ sk: sk === "b40" ? "" : sk }); nanti(grafik); });
}
