/* /transisi-pltu, tab Pekerja dan daerah terdampak: faktor bersumber (transisi_pltu.json#pekerja), skenario pemangkasan pasokan PLTU (Hipotesis), lapangan kerja EBT pengganti per provinsi
   (faktor Rutovitz x pengali Asia dari riset/tenaga_kerja.json, EST). Tenaga kerja tambang dan DBH batubara per daerah belum terbit terbuka: dicatat sebagai celah. */
import { B, t, ex, num, esc, ikon, tx, bukti, buktiS, hipotesis, kakiSumber, tabel, tipHtml, kosongTab, catatan, daftarCelah, tautProvinsi, siapTautan, naikkan } from "/tpl_umum.js";

const F = (id) => B.tp.pekerja.faktor.find((f) => f.id === id);
const TK = (k) => B.tk?.baris?.find((b) => b.teknologi === k)?.tahap || [];
const asia = (k, tahap) => TK(k).find((x) => x.tahap === tahap)?.nilai_asia_est ?? null;
function skenario() {
  const el = document.getElementById("tpl-k-sk"); if (!el) return;
  const vol = B.pasar.analisis.tahunan.at(-1), tinggi = F("faktor-ton").nilai, rendah = F("faktor-alt").nilai;
  tabel(el, { satuan: "tpl.u.baris", per: 5, urutAwal: 0, menurun: false, kolom: [
    { label: t("tpl.pk.potong"), num: true, v: (r) => r, f: (r) => `${esc(String(r))}%` },
    { label: t("tpl.pk.mt"), num: true, v: (r) => r, f: (r) => `${esc(num((vol.volume_pembangkit_juta_t * r) / 100, 1))} <small class="rg3-catat">${esc(t("tpl.u.juta_t"))}</small>` },
    { label: t("tpl.pk.rendah", { n: rendah }), num: true, v: (r) => r, f: (r) => esc(num(Math.round((vol.volume_pembangkit_juta_t * r * rendah) / 100 / 100) * 100, 0)) },
    { label: t("tpl.pk.tinggi", { n: num(tinggi, 0) }), num: true, v: (r) => r, f: (r) => `<b>${esc(num(Math.round((vol.volume_pembangkit_juta_t * r * tinggi) / 100 / 100) * 100, 0))}</b> ${hipotesis()}` },
  ], baris: [10, 25, 50, 100] });
}
function tabProv() {
  const el = document.getElementById("tpl-k-prov"); if (!el) return;
  const os = asia("surya", "operasi-pemeliharaan"), ob = asia("bayu", "operasi-pemeliharaan"), ks = asia("surya", "konstruksi"), kb = asia("bayu", "konstruksi");
  const nm = (k) => B.pltu.dampak.provinsi.find((p) => p.kode === k)?.nama || k;
  const baris = B.tp.pengganti.provinsi.map((p) => ({ ...p, om: p.sepadan_mw.surya * os + p.sepadan_mw.bayu * ob, kons: p.sepadan_mw.surya * ks + p.sepadan_mw.bayu * kb, cap: B.pltu.dampak.provinsi.find((x) => x.kode === p.kode)?.mw_captive || 0 }));
  tabel(el, { satuan: "tpl.u.prov", per: 8, urutAwal: 1, menurun: true, kolom: [
    { label: t("tpl.c.prov"), v: (p) => nm(p.kode), f: (p) => tautProvinsi(p.kode) },
    { label: "PLTU MW", num: true, v: (p) => p.mw, f: (p) => esc(num(p.mw, 0)) },
    { label: t("tpl.pk.captive"), num: true, v: (p) => p.cap, f: (p) => (p.cap ? esc(num(p.cap, 0)) : "-") },
    { label: t("tpl.pk.om"), num: true, v: (p) => p.om, f: (p) => `<b>${esc(num(Math.round(p.om / 10) * 10, 0))}</b>` },
    { label: t("tpl.pk.kons"), num: true, v: (p) => p.kons, f: (p) => esc(num(Math.round(p.kons / 100) * 100, 0)) },
    { label: t("tpl.c.bukti"), v: () => "", f: () => bukti("est", { sumber: "Rutovitz 2015 x pengali Asia (METI)", cara: t("tpl.pk.cara") }) },
  ], baris });
  siapTautan().then(() => naikkan(el));
}
export function mulai(el) {
  if (!B.tp || !B.pasar || !B.pltu) { el.innerHTML = kosongTab("tpl.kosong"); return; }
  el.innerHTML = [
    ex({ id: "tpl-k-fak", ikon: "orang", topik: t("tpl.pk.ey.fak"), judulHtml: esc(t("tpl.pk.j.fak")), subHtml: esc(t("tpl.pk.s.fak")),
      isiHtml: `<div class="tpl-kisi">${B.tp.pekerja.faktor.map((f) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon("orang", 22)}<b class="tpl-angka">${esc(num(f.nilai, 0))} <small>${esc(f.satuan)}</small></b></div><p>${esc(tx(f.label))}</p><p class="jm-bantu">${esc(tx(f.catatan))}</p>${buktiS(f.sumber_id, f.tingkat_bukti)}</div>`).join("")}</div>`, kakiHtml: kakiSumber(B.tp.pekerja.faktor.map((f) => f.sumber_id)) }),
    ex({ id: "tpl-k-skex", ikon: "kalkulator", topik: t("tpl.pk.ey.sk"), judulHtml: esc(t("tpl.pk.j.sk")), subHtml: esc(t("tpl.pk.s.sk", { th: B.pasar.analisis.tahunan.at(-1).tahun, v: num(B.pasar.analisis.tahunan.at(-1).volume_pembangkit_juta_t, 1) })), isiHtml: `<div id="tpl-k-sk"></div>${catatan("tpl.pk.n.sk")}` }),
    ex({ id: "tpl-k-provex", ikon: "wilayah", topik: t("tpl.pk.ey.prov"), judulHtml: esc(t("tpl.pk.j.prov")), subHtml: esc(t("tpl.pk.s.prov")), isiHtml: `<div id="tpl-k-prov"></div>${catatan("tpl.pk.n.prov")}`, kakiHtml: `<div class="tpl-kaki"><span class="tpl-sumber"><a class="rg3-tautan" href="/kerja">${esc(t("tpl.pk.lihat_kerja"))}</a></span></div>` }),
    daftarCelah([tx({ id: B.tp.meta.celah[0], en: B.tp.meta.celah_en[0] }), tx({ id: B.tp.meta.celah[1], en: B.tp.meta.celah_en[1] })]),
  ].join("");
  skenario(); tabProv();
}
