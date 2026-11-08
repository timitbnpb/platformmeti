/* /gas, tab Kontrak dan harga: HGBT (Perpres 121/2020, Kepmen 76.K dan 77.K/2025), kontrak yang tercatat, hitungan biaya bahan bakar per MWh (Hipotesis/EST). Dari gas.json. */
import { B, t, ex, num, esc, tx, bukti, buktiS, kakiSumber, tabel, batangSvg, tipHtml, kosongTab, daftarCelah, daftarButir, kartuAngka, catatan } from "/gsj_umum.js";

function hitung() {
  const H = B.gs.harga.hitung, hr = H.heat_rate_mmbtu_mwh;
  return H.skenario.map((s) => ({ ...s, biaya: hr * s.harga }));
}
function grafik() {
  const g = document.getElementById("gsj-h-g"); if (!g) return;
  const H = B.gs.harga.hitung;
  g.innerHTML = batangSvg({ el: g, d: 0, satuan: "US$/MWh", label: t("gsj.h.g.label"), seri: [{ k: "n", kelas: "gsj-s-gas" }],
    baris: hitung().map((s) => ({ label: t("gsj.h.sk." + s.k, { h: num(s.harga, 0) }), tip: t("gsj.h.sk." + s.k, { h: num(s.harga, 0) }), th: tipHtml(t("gsj.h.sk." + s.k, { h: num(s.harga, 0) }), [["US$/MMBTU", num(s.harga, 1)], [t("gsj.h.heat"), `${num(H.heat_rate_mmbtu_mwh, 1)} MMBTU/MWh`], ["US$/MWh", num(s.biaya, 0)], [t("gsj.c.bukti"), t("gsj.b." + s.tingkat_bukti)]]), bagian: [{ k: "n", nilai: s.biaya }] })) });
}
export function mulai(el) {
  if (!B.gs) { el.innerHTML = kosongTab("gsj.kosong"); return; }
  const Hg = B.gs.harga, sk = hitung();
  const kartu = sk.map((s) => `<div class="rg3-kartu"><div class="rg3-k-kep"><b>${esc(t("gsj.h.sk." + s.k, { h: num(s.harga, 0) }))}</b></div><p class="gsj-angka">${esc(num(s.biaya, 0))} <small>US$/MWh</small></p><p class="jm-bantu">${esc(t("gsj.h.rumus", { hr: num(Hg.hitung.heat_rate_mmbtu_mwh, 1), h: num(s.harga, 1) }))}</p>${s.sumber_id ? buktiS(s.sumber_id, s.tingkat_bukti) : bukti(s.tingkat_bukti, { sumber: "METI" })}</div>`).join("");
  el.innerHTML = [
    ex({ id: "gsj-h-hgbt", ikon: "tag", topik: t("gsj.h.ey.hgbt"), judulHtml: esc(t("gsj.h.j.hgbt")), subHtml: esc(t("gsj.h.s.hgbt")), isiHtml: daftarButir(Hg.kebijakan, "tag") + catatan("gsj.h.n.hgbt"), kakiHtml: kakiSumber(Hg.kebijakan.map((x) => x.sumber_id)) }),
    ex({ id: "gsj-h-hitung", ikon: "kalkulator", topik: t("gsj.h.ey.hitung"), judulHtml: esc(t("gsj.h.j.hitung")), subHtml: esc(t("gsj.h.s.hitung")), isiHtml: `<div id="gsj-h-g" class="ih-bagan gsj-grafik"></div><div class="gsj-kisi">${kartu}</div><p class="jm-bantu ih-catatan">${esc(tx(Hg.hitung.ket))}</p>`, kakiHtml: kakiSumber(["esdm-hgbt"]) }),
    ex({ id: "gsj-h-kontrak", ikon: "buku", topik: t("gsj.h.ey.kontrak"), judulHtml: esc(t("gsj.h.j.kontrak")), subHtml: esc(t("gsj.h.s.kontrak")), isiHtml: daftarButir(Hg.kontrak, "buku") + daftarCelah(B.gs.celah.slice(2, 3)), kakiHtml: kakiSumber(Hg.kontrak.map((x) => x.sumber_id)) }),
  ].join("");
  grafik();
}
