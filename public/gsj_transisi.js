/* /gas, tab Transisi, risiko, dan hidrogen: posisi pemerintah vs pengkritik, hitungan energi dan umur kontrak (EST/Hipotesis), co-firing hidrogen di turbin gas, rujukan energi_baru.json dan isu.json. */
import { B, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, kosongTab, daftarCelah, daftarButir, catatan, batangSvg, tipHtml } from "/gsj_umum.js";

const hitung = () => { const H = B.gs.transisi.hitung; return H.fk.map((f) => ({ ...f, twh: H.gw * H.jam * (f.nilai / 100) })); };
function grafik() {
  const g = document.getElementById("gsj-t-g"); if (!g) return;
  const H = B.gs.transisi.hitung;
  g.innerHTML = batangSvg({ el: g, d: 1, satuan: "TWh", label: t("gsj.t.g.label"), seri: [{ k: "n", kelas: "gsj-s-gas" }],
    baris: hitung().map((x) => ({ label: t("gsj.t.fk." + x.k, { f: num(x.nilai, 0) }), tip: t("gsj.t.fk." + x.k, { f: num(x.nilai, 0) }), th: tipHtml(t("gsj.t.fk." + x.k, { f: num(x.nilai, 0) }), [["GW", num(H.gw, 1)], [t("gsj.t.fk_l"), `${num(x.nilai, 0)}%`], ["TWh", num(x.twh, 1)], [t("gsj.c.bukti"), t("gsj.b." + x.tingkat_bukti)]]), bagian: [{ k: "n", nilai: x.twh }] })) });
}
export function mulai(el) {
  if (!B.gs) { el.innerHTML = kosongTab("gsj.kosong"); return; }
  const T = B.gs.transisi, H = T.hitung, ids = T.energi_baru_ids.map((id) => (B.enb?.baris || []).find((b) => b.id === id)).filter(Boolean);
  const posisi = `<div class="gsj-kisi">${T.posisi.map((p) => `<div class="rg3-kartu gsj-posisi"><div class="rg3-k-kep">${ikon(p.k === "pemerintah" ? "bendera" : "peringatan", 22)}<b>${esc(tx(p.pihak))}</b></div><p>${esc(tx(p.teks))}</p>${buktiS(p.sumber_id, p.tingkat_bukti)}</div>`).join("")}</div>`;
  const akhir = (cod) => cod + H.ppa_tahun;
  const kartuHit = hitung().map((x) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon("kalkulator", 22)}<b>${esc(t("gsj.t.fk." + x.k, { f: num(x.nilai, 0) }))}</b></div><p class="gsj-angka">${esc(num(x.twh, 1))} <small>TWh</small></p><p class="jm-bantu">${esc(t("gsj.t.rumus", { gw: num(H.gw, 1), f: num(x.nilai, 0) }))}</p>${x.sumber_id ? buktiS(x.sumber_id, x.tingkat_bukti) : bukti(x.tingkat_bukti, { sumber: "METI" })}</div>`).join("")
    + `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon("linimasa", 22)}<b>${esc(t("gsj.t.umur"))}</b></div><p class="gsj-angka">${esc(String(akhir(2034)))} <small>${esc(t("gsj.t.umur_u"))}</small></p><p class="jm-bantu">${esc(t("gsj.t.umur_ket", { y: H.ppa_tahun, cod: 2034, akhir: akhir(2034), nol: H.target_nol }))}</p>${bukti("est", { sumber: "METI", cara: t("gsj.t.umur_cara") })}</div>`;
  const rujuk = ids.map((b) => `<li>${ikon("info", 18)}<div><p><b>${esc(tx(b.nama))}</b></p><p>${esc(tx(b.ringkas))}</p>${bukti(b.tingkat_bukti, { sumber: "energi_baru.json", tanggal: b.tanggal_periksa || "" })}</div></li>`).join("");
  const isu = B.gs.isu.isu_ids.map((id) => (B.isu?.baris || []).find((x) => x.id === id)).filter(Boolean);
  el.innerHTML = [
    ex({ id: "gsj-t-posisi", ikon: "bendera", topik: t("gsj.t.ey.posisi"), judulHtml: esc(t("gsj.t.j.posisi")), subHtml: esc(t("gsj.t.s.posisi")), isiHtml: posisi + catatan("gsj.t.n.posisi"), kakiHtml: kakiSumber(T.posisi.map((p) => p.sumber_id)) }),
    ex({ id: "gsj-t-risiko", ikon: "kalkulator", topik: t("gsj.t.ey.risiko"), judulHtml: esc(t("gsj.t.j.risiko")), subHtml: esc(t("gsj.t.s.risiko")), isiHtml: `<div id="gsj-t-g" class="ih-bagan gsj-grafik"></div><div class="gsj-kisi">${kartuHit}</div><p class="jm-bantu ih-catatan">${esc(tx(H.ket))}</p><ul class="gsj-daftar">${isu.map((x) => `<li>${ikon("peringatan", 18)}<div><p><b>${esc(x.judul)}</b></p><p>${esc(x.ringkas)}</p><p><a class="rg3-tautan" href="/isu#${esc(x.id)}">${esc(t("gsj.i.rinci"))}</a></p></div></li>`).join("")}</ul>`, kakiHtml: kakiSumber(["ibp-ieefa", "baird-jawa1"]) }),
    ex({ id: "gsj-t-h2", ikon: "tek-listrik", topik: t("gsj.t.ey.h2"), judulHtml: esc(t("gsj.t.j.h2")), subHtml: esc(t("gsj.t.s.h2")), isiHtml: daftarButir(T.hidrogen, "tek-listrik") + `<ul class="gsj-daftar">${rujuk}</ul><p class="jm-bantu"><a href="/hidrogen">${esc(t("gsj.t.h2_modul"))}</a> <a href="/transisi-pltu">${esc(t("gsj.t.pltu_modul"))}</a></p>${daftarCelah(B.gs.celah.slice(7, 9))}`, kakiHtml: kakiSumber(T.hidrogen.map((x) => x.sumber_id)) }),
  ].join("");
  grafik();
}
