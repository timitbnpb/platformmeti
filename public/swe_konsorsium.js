/* /sampah-energi, tab Danantara dan konsorsium: tahap program (sampah_energi.json), delapan konsorsium tahap II dirujuk ke psel.json lewat id, pengembang per proyek, negara penyedia teknologi dari pemasok_wte.json. */
import { B, t, ex, num, esc, ikon, tx, buktiS, kakiSumber, tabel, kosongTab, daftarCelah, catatan, pil, orgLogoSel, siapTautan, naikkan, pselById, pselRows, pertama, statusDari, wteById, bendera, namaNegara } from "/swe_umum.js";

const negaraDari = (r) => [...new Set((r?.penyedia_teknologi || []).map((p) => wteById(p.pemasok_id)?.negara).filter(Boolean))];
const bendNeg = (iso) => `<span class="rg3-neg">${bendera(iso, 20)}<span>${esc(namaNegara(iso))}</span></span>`;
function tabKonsorsium() {
  const el = document.getElementById("swe-c-tab"); if (!el) return;
  const baris = B.sw.program.konsorsium.map((k) => ({ ...k, r: pselById(k.psel_id) }));
  tabel(el, { satuan: "swe.u.konsorsium", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("swe.c.konsorsium"), v: (k) => k.nama, f: (k) => `<span class="rg3-idk"><b>${esc(k.nama)}</b><small>${esc(k.anggota)}</small></span>` },
    { label: t("swe.c.lokasi"), v: (k) => k.r?.kota || "", f: (k) => `<span class="rg3-idk"><b>${esc(k.r?.nama.replace(/\s*\(PSN nomor \d+\)/, "") || "-")}</b><small>${esc(k.r?.provinsi || "")}</small></span>` },
    { label: t("swe.c.status"), v: (k) => statusDari(k.r || {}), f: (k) => pil("swe.st.", statusDari(k.r || {})) },
    { label: t("swe.u.ton_hari"), num: true, v: (k) => pertama(k.r?.kapasitas_ton_hari) ?? -1, f: (k) => (pertama(k.r?.kapasitas_ton_hari) ? esc(num(pertama(k.r.kapasitas_ton_hari), 0)) : `<span class="jm-bantu">${esc(t("swe.belum_ada"))}</span>`) },
    { label: t("swe.c.teknologi"), v: (k) => (k.r?.penyedia_teknologi || []).map((p) => p.nama).join(), f: (k) => ((k.r?.penyedia_teknologi || []).length ? k.r.penyedia_teknologi.map((p) => orgLogoSel(wteById(p.pemasok_id)?.organisasi_id_ada, p.nama)).join("") : `<span class="jm-bantu">${esc(t("swe.belum_ada"))}</span>`) },
    { label: t("swe.c.negara"), v: (k) => negaraDari(k.r).join(), f: (k) => (negaraDari(k.r).length ? negaraDari(k.r).map(bendNeg).join("") : "-") },
    { label: t("swe.c.bukti"), v: () => "", f: (k) => buktiS(k.sumber_id, k.tingkat_bukti) },
  ], baris });
  siapTautan("org").then(() => naikkan(el));
}
function tabPengembang() {
  const el = document.getElementById("swe-c-peng"); if (!el) return;
  const baris = pselRows().filter((r) => r.pengembang.length);
  tabel(el, { satuan: "swe.u.proyek", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("swe.c.proyek_kota"), v: (r) => r.kota, f: (r) => `<span class="rg3-idk"><b>${esc(r.kota)}</b><small>${esc(r.provinsi)}</small></span>` },
    { label: t("swe.c.pengembang"), v: (r) => r.pengembang.map((p) => p.nama).join(), f: (r) => r.pengembang.map((p) => orgLogoSel(p.organisasi_id, p.nama.replace(/^Badan Pengelola Investasi Daya Anagata Nusantara \(Danantara\)$/, "Danantara"))).join("") },
    { label: t("swe.c.status"), v: (r) => statusDari(r), f: (r) => pil("swe.st.", statusDari(r)) },
    { label: t("swe.c.bukti"), v: (r) => r.tingkat_bukti, f: (r) => buktiS("tahap2", r.tingkat_bukti || "media") },
  ], baris });
  siapTautan("org").then(() => naikkan(el));
}
export function mulai(el) {
  if (!B.sw || !B.psel) { el.innerHTML = kosongTab("swe.kosong"); return; }
  const P = B.sw.program, ik = { t1: "kawasan", dpt: "orang", t2: "gedung", lima: "bendera" };
  const kartu = (x) => `<li>${ikon(ik[x.k] || "info", 18)}<div><p><b>${esc(t("swe.c.tahap." + x.k))}</b></p><p>${esc(tx(x.teks))}</p>${buktiS(x.sumber_id, x.tingkat_bukti)}</div></li>`;
  el.innerHTML = [
    ex({ id: "swe-c-tahap", ikon: "kawasan", topik: t("swe.c.ey.tahap"), judulHtml: esc(t("swe.c.j.tahap", { kota: P.ringkas.kota })), subHtml: esc(tx(P.ringkas.ket)), isiHtml: `<ul class="swe-daftar">${P.tahap.map(kartu).join("")}</ul>${catatan("swe.c.n.tahap")}`, kakiHtml: kakiSumber([P.ringkas.sumber_id, P.ringkas.sumber_id2, ...P.tahap.flatMap((x) => [x.sumber_id, x.sumber_id2])]) }),
    ex({ id: "swe-c-kons", ikon: "gedung", topik: t("swe.c.ey.kons"), judulHtml: esc(t("swe.c.j.kons", { n: P.konsorsium.length })), subHtml: esc(t("swe.c.s.kons")), isiHtml: `<div id="swe-c-tab"></div>${catatan("swe.c.n.kons")}`, kakiHtml: kakiSumber(["tahap2"]) }),
    ex({ id: "swe-c-pengembang", ikon: "tabel", topik: t("swe.c.ey.peng"), judulHtml: esc(t("swe.c.j.peng")), subHtml: esc(t("swe.c.s.peng")), isiHtml: `<div id="swe-c-peng"></div>`, kakiHtml: kakiSumber(["bali", "bekasi", "bogor"]) }),
    ex({ id: "swe-c-celah", ikon: "tanya", topik: t("swe.ey.celah"), judulHtml: esc(t("swe.j.celah")), isiHtml: daftarCelah([B.sw.celah[1], B.sw.celah[5]]) }),
  ].join("");
  tabKonsorsium(); tabPengembang();
}
