/* /angin, tab Lelang, PPA, dan TKDN: putaran lelang bayu dari lelang.json (lewat id), tarif kasus, aturan dan fakta TKDN bersumber. TKDN per komponen tidak tersedia (celah). */
import { B, muat, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, kosongTab, daftarCelah, catatan, pil, luar, orgLogoSel, siapTautan, naikkan } from "/ang_umum.js";
import { nanti } from "/inti/umum.js";

function tabLelang() {
  const el = document.getElementById("ang-l-tab"); if (!el) return;
  const baris = (B.lel?.putaran || []).filter((x) => B.ang.rujukan.lelang_ids.includes(x.id));
  tabel(el, { satuan: "ang.u.lelang", per: 8, urutAwal: 3, menurun: true, kolom: [
    { label: t("ang.c.lelang"), v: (x) => x.nama, f: (x) => `<span class="rg3-idk"><b>${esc(x.nama)}</b><small>${esc(x.lokasi?.teks || "")}</small></span>` },
    { label: t("ang.c.penyelenggara"), v: (x) => x.penyelenggara?.nama || "", f: (x) => (x.penyelenggara?.nama ? orgLogoSel(x.penyelenggara.org_id, x.penyelenggara.nama) : "-") },
    { label: t("ang.c.mw"), num: true, v: (x) => x.kapasitas_mw ?? -1, f: (x) => (x.kapasitas_mw != null ? `<b>${esc(num(x.kapasitas_mw, 0))}</b>` : "-") },
    { label: t("ang.c.tahun"), num: true, v: (x) => x.tahun ?? 0, f: (x) => esc(String(x.tahun ?? "-")) },
    { label: t("ang.c.tahap"), v: (x) => x.tahap || "", f: (x) => pil("ang.th.", x.tahap || "x") },
    { label: t("ang.c.bukti"), v: () => "", f: (x) => bukti(x.tingkat_bukti || "media", { sumber: "lelang.json", tanggal: B.lel.dibangun_pada || "" }) },
  ], baris });
}
function tabTarif() {
  const el = document.getElementById("ang-l-tarif"); if (!el) return;
  tabel(el, { satuan: "ang.u.kasus", per: 8, urutAwal: 1, menurun: true, kolom: [
    { label: t("ang.c.proyek"), v: (x) => x.k, f: (x) => `<b>${esc(t("ang.l.tarif." + x.k))}</b>` },
    { label: t("ang.c.tahun"), num: true, v: (x) => x.tahun, f: (x) => esc(String(x.tahun)) },
    { label: t("ang.l.sen"), num: true, v: (x) => x.sen, f: (x) => `<b>${esc(num(x.sen, 1))}</b>` },
    { label: t("ang.c.skema"), v: (x) => x.k, f: (x) => esc(t("ang.l.skema." + x.k)) },
    { label: t("ang.c.bukti"), v: () => "", f: (x) => buktiS(x.sumber_id, x.tingkat_bukti) },
  ], baris: B.ang.biaya.tarif_kasus });
}
export async function mulai(el) {
  await muat(["lel", "org"]);
  if (!B.ang) { el.innerHTML = kosongTab("ang.kosong"); return; }
  const A = B.ang, tk = A.lelang.tkdn;
  const kartu = (x) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon("pabrik", 22)}<b>${esc(t("ang.l.tk." + x.k))}</b></div><p class="jm-bantu">${esc(tx(x.teks))}</p>${buktiS(x.sumber_id, x.tingkat_bukti)}</div>`;
  el.innerHTML = [
    ex({ id: "ang-l-lel", ikon: "lelang", topik: t("ang.l.ey.lel"), judulHtml: esc(t("ang.l.j.lel", { n: A.rujukan.lelang_ids.length })), subHtml: esc(t("ang.l.s.lel")), isiHtml: `<div id="ang-l-tab"></div>${catatan("ang.l.n.lel")}${daftarCelah([A.celah[4]])}<p class="jm-bantu"><a class="rg3-tautan" href="/lelang">${esc(t("ang.l.ke_lelang"))}</a></p>`, kakiHtml: kakiSumber(["li_tl", "gem"]) }),
    ex({ id: "ang-l-tarif", ikon: "tag", topik: t("ang.l.ey.tarif"), judulHtml: esc(t("ang.l.j.tarif")), subHtml: esc(t("ang.l.s.tarif")), isiHtml: `<div id="ang-l-tarif"></div>${catatan("ang.l.n.tarif")}`, kakiHtml: kakiSumber(["etp1", "tl-tarif"]) }),
    ex({ id: "ang-l-tkdn", ikon: "pabrik", topik: t("ang.l.ey.tkdn"), judulHtml: esc(t("ang.l.j.tkdn")), subHtml: esc(t("ang.l.s.tkdn")), isiHtml: `<div class="rg3-kisi">${tk.map(kartu).join("")}</div>${catatan("ang.l.n.tkdn")}${daftarCelah([A.celah[0]])}<p class="jm-bantu"><a class="rg3-tautan" href="/rantai-global?tab=bayu">${esc(t("ang.l.ke_rantai"))}</a></p>`, kakiHtml: kakiSumber(["tkdn-esdm11", "etp2", "kenertec"]) }),
  ].join("");
  nanti(() => { tabLelang(); tabTarif(); });
  siapTautan("org").then(() => naikkan(el));
}
