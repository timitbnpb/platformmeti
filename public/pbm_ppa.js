/* /panas-bumi, tab PPA dan harga: harga patokan tertinggi Perpres 112/2022 (8 kelas), hitungan pendapatan contoh (faktor kapasitas dan harga dari data, F = 1), contoh PPA/pembiayaan proyek, biaya bangun (porsi eksplorasi). */
import { B, t, ex, num, esc, ikon, tx, buktiS, kakiSumber, tabel, kosongTab, catatan, luar, proyekById, orgLogoSel, siapTautan, naikkan } from "/pbm_umum.js";

function tabHarga() {
  const el = document.getElementById("pbm-h-tab"); if (!el) return;
  const baris = B.pb.ppa.harga_patokan;
  tabel(el, { satuan: "pbm.u.kelas", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("pbm.c.varian"), v: (r) => r.varian, f: (r) => esc(t("pbm.h.v." + r.varian)) },
    { label: t("pbm.c.kelas"), v: (r) => r.kelas, f: (r) => esc(r.kelas) },
    { label: t("pbm.c.th1"), num: true, v: (r) => r.tahun1_10, f: (r) => `<b>${esc(num(r.tahun1_10, 2))}</b>` },
    { label: t("pbm.c.th11"), num: true, v: (r) => r.tahun11_30, f: (r) => esc(num(r.tahun11_30, 2)) },
    { label: t("pbm.c.bukti"), v: () => "", f: () => buktiS(B.pb.ppa.harga_sumber_id, "resmi") },
  ], baris });
}
function contoh() {
  const C = B.pb.ppa.contoh, k = B.pb.ppa.harga_patokan.find((r) => r.varian === "listrik" && r.kelas.includes(C.kelas)); if (!k) return "";
  const gwh = (C.mw * C.faktor_kapasitas / 100) * 8.76, juta = gwh * 1000 * k.tahun1_10 / 100 * C.f / 1000; // GWh x 1e6 kWh x sen/100 = US$; /1e6 = juta
  return `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon("kalkulator", 22)}<b>${esc(t("pbm.h.contoh_j", { mw: C.mw }))}</b></div><p class="pbm-angka">${esc(num(juta, 1))} <small>${esc(t("pbm.h.juta_th"))}</small></p><p class="jm-bantu">${esc(t("pbm.h.contoh", { gwh: num(gwh, 1), cf: num(C.faktor_kapasitas, 1), h: num(k.tahun1_10, 2), kelas: C.kelas }))}</p><p class="jm-bantu">${esc(tx(C.ket))}</p>${buktiS(C.sumber_id, "est")}</div>`;
}
const ppa = () => B.pb.ppa.ppa_contoh.map((x) => { const p = proyekById(x.proyek_id); return `<li>${ikon("tautan", 18)}<div><p><b>${esc(p?.nama || x.proyek_id)}</b>${p?.mw != null ? ` <small>${esc(num(p.mw, 0))} MW</small>` : ""}</p><p>${esc(tx(x.teks))}</p>${buktiS(x.sumber_id, x.tingkat_bukti)}</div></li>`; }).join("");
export function mulai(el) {
  if (!B.pb) { el.innerHTML = kosongTab("pbm.kosong"); return; }
  const P = B.pb.ppa, bb = B.bb?.komponen?.find((c) => c.id === B.pb.rujukan.biaya_bangun_id), mak = bb?.bagian?.[0]?.persen_maks, sb = (B.bb?.sumber || []).find((s) => s.id === bb?.sumber_id);
  el.innerHTML = [
    ex({ id: "pbm-h-harga", ikon: "tag", topik: t("pbm.h.ey.harga"), judulHtml: esc(t("pbm.h.j.harga")), subHtml: esc(t("pbm.h.s.harga")), isiHtml: `<div id="pbm-h-tab"></div><p class="jm-bantu ih-catatan">${esc(tx(P.transkripsi_catatan))} ${esc(tx(P.faktor_f))}</p>`, kakiHtml: kakiSumber([P.harga_sumber_id]) }),
    ex({ id: "pbm-h-hitung", ikon: "kalkulator", topik: t("pbm.h.ey.hitung"), judulHtml: esc(t("pbm.h.j.hitung")), subHtml: esc(t("pbm.h.s.hitung")), isiHtml: `<div class="rg3-kisi">${contoh()}${mak ? `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon("grafik", 22)}<b>${esc(t("pbm.h.biaya_j"))}</b></div><p class="pbm-angka">${esc(num(mak, 0))} <small>%</small></p><p class="jm-bantu">${esc(t("pbm.h.biaya", { b: bb.basis }))}</p>${sb ? luar(sb.url, `${sb.penerbit}, ${sb.tanggal_terbit}`) : ""}</div>` : ""}</div>`, kakiHtml: kakiSumber([P.contoh.sumber_id]) }),
    ex({ id: "pbm-h-ppa", ikon: "dokumen", topik: t("pbm.h.ey.ppa"), judulHtml: esc(t("pbm.h.j.ppa")), subHtml: esc(t("pbm.h.s.ppa")), isiHtml: `<ul class="pbm-daftar">${ppa()}</ul>${catatan("pbm.h.n.ppa")}<p class="jm-bantu"><a href="/isu#harga-patokan-112">${esc(t("pbm.h.isu"))}</a></p>`, kakiHtml: kakiSumber(P.ppa_contoh.map((x) => x.sumber_id)) }),
  ].join("");
  tabHarga();
  siapTautan("proyek").then(() => naikkan(el));
}
