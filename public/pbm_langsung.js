/* /panas-bumi, tab Pemanfaatan langsung: pertanian, pengeringan, wisata tanpa turbin. Butir dibaca dari cuplikan sumber (tingkat bukti ditulis); skala nasional tercatat kecil dan datanya buruk. */
import { B, t, ex, num, esc, ikon, tx, buktiS, kakiSumber, kosongTab, catatan, tautRegulasi, siapTautan, naikkan } from "/pbm_umum.js";

export function mulai(el) {
  if (!B.pb) { el.innerHTML = kosongTab("pbm.kosong"); return; }
  const L = B.pb.langsung, s = L.skala;
  const kartu = (x) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(x.ikon, 22)}<b>${esc(t("pbm.l.k." + x.k))}</b></div><p class="pbm-lokasi">${ikon("lokasi", 14)}<span>${esc(x.lokasi)}</span></p><p class="jm-bantu">${esc(tx(x.teks))}</p>${buktiS(x.sumber_id, x.tingkat_bukti)}</div>`;
  el.innerHTML = [
    ex({ id: "pbm-l-skala", ikon: "tek-panas", topik: t("pbm.l.ey.skala"), judulHtml: esc(t("pbm.l.j.skala", { n: num(s.nilai, 1) })), subHtml: esc(t("pbm.l.s.skala")),
      isiHtml: `<div class="rg3-kisi"><div class="rg3-kartu"><div class="rg3-k-kep">${ikon("grafik", 22)}<b>${esc(t("pbm.l.skala"))}</b></div><p class="pbm-angka">${esc(num(s.nilai, 1))} <small>${esc(s.satuan)}</small></p><p class="jm-bantu">${esc(tx(s.ket))}</p>${buktiS(s.sumber_id, s.tingkat_bukti)}</div></div>`, kakiHtml: kakiSumber([s.sumber_id]) }),
    ex({ id: "pbm-l-contoh", ikon: "desa", topik: t("pbm.l.ey.contoh"), judulHtml: esc(t("pbm.l.j.contoh")), subHtml: esc(t("pbm.l.s.contoh")), isiHtml: `<div class="rg3-kisi">${L.butir.map(kartu).join("")}</div>${catatan("pbm.l.n.contoh")}`, kakiHtml: kakiSumber(L.butir.map((x) => x.sumber_id)) }),
    ex({ id: "pbm-l-aturan", ikon: "palu", topik: t("pbm.l.ey.aturan"), judulHtml: esc(t("pbm.l.j.aturan")), subHtml: esc(t("pbm.l.s.aturan")), isiHtml: `<ul class="pbm-daftar"><li>${ikon("palu", 18)}<div><p>${esc(tx(L.regulasi.teks))}</p><p>${tautRegulasi("uu-21-2014", t("pbm.k.uu21"))}</p>${buktiS(L.regulasi.sumber_id, L.regulasi.tingkat_bukti)}</div></li></ul>`, kakiHtml: kakiSumber([L.regulasi.sumber_id]) }),
  ].join("");
  siapTautan("regulasi").then(() => naikkan(el));
}
