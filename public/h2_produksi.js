/* /hidrogen, tab Produksi H2: proyek di Indonesia (PLN GHP Muara Karang dan Kamojang, pilot PGE Ulubelu, rencana Gresik dan lainnya) dengan kapasitas ton per tahun, status, dan pihak; rujukan energi_baru. */
import { H, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, batangSvg, tipHtml, legendaHtml, siapTautan, naikkan, kosongTab, catatan, orgDaftar, chipStatus, pilJenis, tautProvinsi, enbBaris, daftarCelah } from "/h2_umum.js";

const ST = ["beroperasi", "konstruksi", "studi", "kerja-sama", "tak-jelas"];
let st = "";
const P = () => H.h2.produksi;
function grafik() {
  const g = document.getElementById("h2-p-g"); if (!g) return;
  const baris = P().filter((p) => p.ton_tahun != null).sort((a, b) => b.ton_tahun - a.ton_tahun);
  document.getElementById("h2-p-g-l").innerHTML = legendaHtml([{ kelas: "h2-s-ok", label: t("h2.st.beroperasi") }, { kelas: "h2-s-warn", label: t("h2.st.konstruksi") }]);
  g.innerHTML = batangSvg({ el: g, d: 1, satuan: t("h2.u.t_thn"), label: t("h2.p.j.g"), seri: [{ k: "ok", kelas: "h2-s-ok" }, { k: "warn", kelas: "h2-s-warn" }],
    baris: baris.map((p) => ({ label: tx(p.nama), logo: p.prov ? `/img/provinsi/${p.prov}.png` : null, ikon: p.prov ? null : "pabrik", tip: tx(p.nama), th: tipHtml(tx(p.nama), [[t("h2.p.kap"), `${num(p.ton_tahun, p.ton_tahun < 100 ? 1 : 0)} ${t("h2.u.t_thn")}${p.hitung ? " (" + t("h2.hitung") + ")" : ""}`], [t("h2.c.status"), t("h2.st." + p.status)]]), bagian: [{ k: p.status === "beroperasi" ? "ok" : "warn", nilai: p.ton_tahun }] })) });
}
function tabelProyek() {
  const el = document.getElementById("h2-p-tab"); if (!el) return;
  const baris = P().filter((p) => !st || p.status === st);
  tabel(el, { satuan: "h2.u.proyek", per: 5, urutAwal: 3, menurun: true, kolom: [
    { label: t("h2.c.proyek"), v: (p) => tx(p.nama), f: (p) => `<span class="rg3-idk"><b>${esc(tx(p.nama))}</b><small>${p.prov ? tautProvinsi(p.prov) : esc(t("h2.nasional"))}</small></span>` },
    { label: t("h2.c.pihak"), v: (p) => p.org.length, f: (p) => orgDaftar(p.org) },
    { label: t("h2.c.status"), v: (p) => p.status, f: (p) => `<span class="h2-baris">${chipStatus(p.status)}${p.tahun ? `<small class="rg3-catat">${esc(String(p.tahun))}</small>` : ""}</span>` },
    { label: t("h2.p.kap"), num: true, v: (p) => p.ton_tahun ?? -1, f: (p) => (p.ton_tahun != null ? `<b>${esc(num(p.ton_tahun, p.ton_tahun < 100 ? 1 : 0))}</b> <small>${esc(t("h2.u.t_thn"))}${p.hitung ? " *" : ""}</small>` : `<span class="jm-bantu">${esc(t("h2.belum"))}</span>`) },
    { label: t("h2.c.uraian"), v: (p) => tx(p.ket), f: (p) => `<span class="rg3-teks">${esc(tx(p.ket))}</span>` },
    { label: t("h2.c.bukti"), v: (p) => p.tingkat_bukti, f: (p) => buktiS(p.sumber_id, p.tingkat_bukti) },
  ], baris });
  siapTautan("org", "provinsi").then(() => naikkan(el));
}
export function mulai(el) {
  const d = H.h2, n = (s) => P().filter((p) => !s || p.status === s).length, rhan = enbBaris("h2-rhan");
  el.innerHTML = [
    ex({ id: "h2-p-gx", ikon: "pabrik", topik: t("h2.p.ey.g"), judulHtml: esc(t("h2.p.j.g", { n: num(d.kunci.pln_ton_tahun) })), subHtml: esc(t("h2.p.s.g")),
      isiHtml: `<div id="h2-p-g-l"></div><div id="h2-p-g" class="ih-bagan"></div><div class="rg3-info">${ikon("info", 18)}<p>${esc(t("h2.p.i", { m: num(d.kunci.permintaan_mt_2024), k: num(d.kunci.kpi_2026_ton) }))} ${buktiS(d.kunci.sumber_ids.kpi, "resmi")}</p></div>${catatan("h2.p.n.g")}`, kakiHtml: kakiSumber(["hrs", "mc", "ibp-kamojang", "ulu", "esdm-asta-cita"]) }),
    ex({ id: "h2-p-tx", ikon: "daftar2", topik: t("h2.p.ey.t"), judulHtml: esc(t("h2.p.j.t", { n: n("") })), subHtml: esc(t("h2.p.s.t")),
      isiHtml: `<div class="rg3-chips" role="group" aria-label="${esc(t("h2.f.status"))}">${[""].concat(ST).map((k, i) => `<button type="button" class="rg3-chip rg3-chipb rg3-w${i % 8}" data-st="${esc(k)}" aria-pressed="${st === k}">${ikon(k ? ({ beroperasi: "centang", konstruksi: "pabrik", studi: "labu", "kerja-sama": "tautan", "tak-jelas": "tanya" })[k] : "daftar2", 14)}<span>${esc(t(k ? "h2.st." + k : "h2.semua"))}</span> <i>${n(k)}</i></button>`).join("")}</div><div id="h2-p-tab"></div><p class="jm-bantu ih-catatan">* ${esc(t("h2.p.n.hitung"))} <a class="rg3-tautan" href="/transisi-pltu?tab=enb">${esc(t("h2.p.lihat_enb"))}</a></p>`, kakiHtml: kakiSumber(P().map((p) => p.sumber_id)) }),
    rhan ? ex({ id: "h2-p-rhan", ikon: "regulasi", topik: t("h2.p.ey.r"), judulHtml: esc(t("h2.p.j.r")), subHtml: esc(t("h2.p.s.r")), isiHtml: `<div class="rg3-info">${ikon("info", 18)}<p>${esc(tx(rhan.ringkas))} ${bukti(rhan.tingkat_bukti, { tanggal: rhan.tanggal_periksa })}</p></div>` }) : "",
  ].join("");
  grafik(); tabelProyek();
  el.querySelector(".rg3-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-st]"); if (!b) return;
    st = b.dataset.st; for (const x of el.querySelectorAll("[data-st]")) x.setAttribute("aria-pressed", String(x.dataset.st === st));
    tabelProyek();
  });
}
