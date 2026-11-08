/* /gas, tab Pembangkit: tambahan PLTG/PLTMG/PLTGU RUPTL 2025-2034 (empat versi angka), faktor kapasitas 2024, proyek bernama, gasifikasi PLTD dan mini-LNG. Semua butir dari gas.json. */
import { B, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, batangSvg, tipHtml, kosongTab, daftarCelah, kartuAngka, orgLogoSel, pil, catatan, siapTautan, naikkan, chip, warnaIdx } from "/gsj_umum.js";

function grafikRuptl() {
  const g = document.getElementById("gsj-p-g"); if (!g) return;
  g.innerHTML = batangSvg({ el: g, d: 1, satuan: "GW", label: t("gsj.p.g.label"), seri: [{ k: "n", kelas: "gsj-s-gas" }],
    baris: B.gs.pembangkit.angka.map((x) => ({ label: t("gsj.p.a." + x.k), tip: t("gsj.p.a." + x.k), th: tipHtml(t("gsj.p.a." + x.k), [["GW", num(x.nilai, 1)], [t("gsj.c.bukti"), t("gsj.b." + x.tingkat_bukti)]]), bagian: [{ k: "n", nilai: x.nilai }] })) });
}
function tabProyek() {
  const el = document.getElementById("gsj-p-tab"); if (!el) return;
  tabel(el, { satuan: "gsj.u.proyek", per: 10, urutAwal: 2, menurun: true, kolom: [
    { label: t("gsj.c.pembangkit"), v: (p) => p.nama, f: (p) => `<span class="rg3-idk"><b>${esc(p.nama)}</b><small>${esc(p.lokasi === p.prov ? p.prov : p.lokasi + ", " + p.prov)}</small></span>` },
    { label: t("gsj.c.jenis"), v: (p) => p.jenis, f: (p) => chip("rg3-w" + warnaIdx(p.jenis), "", p.jenis) },
    { label: t("gsj.c.status"), v: (p) => p.status, f: (p) => pil("gsj.st.", p.status) },
    { label: t("gsj.c.mw"), num: true, v: (p) => p.mw, f: (p) => `<b>${esc(num(p.mw, 0))}</b>` },
    { label: t("gsj.c.pemilik"), v: (p) => p.pemilik[0]?.nama || "", f: (p) => `<span class="gsj-org-daftar">${p.pemilik.map((o) => orgLogoSel(o.org_id, o.nama)).join("")}</span>` },
    { label: t("gsj.c.cod"), num: true, v: (p) => Number(p.cod) || 0, f: (p) => (p.cod ? `<span class="rg3-idk"><b>${esc(p.cod)}</b><small>${esc(t("gsj.cod." + p.cod_jenis))}</small></span>` : `<span class="jm-bantu">${esc(t("gsj.belum_ada"))}</span>`) },
    { label: t("gsj.c.bukti"), v: (p) => p.tingkat_bukti, f: (p) => buktiS(p.sumber_id, p.tingkat_bukti) },
  ], baris: B.gs.pembangkit.proyek });
}
function tabKlaster() {
  const el = document.getElementById("gsj-p-klaster"); if (!el) return;
  const G = B.gs.pembangkit.gasifikasi;
  tabel(el, { satuan: "gsj.u.klaster", per: 6, urutAwal: 1, menurun: true, kolom: [
    { label: t("gsj.c.klaster"), v: (r) => r.k, f: (r) => `<b>${esc(t("gsj.p.k." + r.k))}</b>` },
    { label: t("gsj.c.plta"), num: true, v: (r) => r.plta, f: (r) => esc(num(r.plta, 0)) },
    { label: t("gsj.c.konsorsium"), v: (r) => r.konsorsium, f: (r) => (r.konsorsium ? `<span class="rg3-teks">${esc(r.konsorsium)}</span>` : `<span class="jm-bantu">${esc(t("gsj.p.belum_mitra"))}</span>`) },
    { label: t("gsj.c.status"), v: (r) => r.status, f: (r) => pil("gsj.st.", r.status) },
    { label: t("gsj.c.bukti"), v: () => "", f: () => buktiS(G.klaster_sumber_id, G.klaster_bukti) },
  ], baris: G.klaster });
}
export function mulai(el) {
  if (!B.gs) { el.innerHTML = kosongTab("gsj.kosong"); return; }
  const P = B.gs.pembangkit, fk = P.fk_2024;
  const ringkas = P.ringkas_plnt.map((x) => kartuAngka("petir", t("gsj.p.r." + x.k), num(x.nilai, x.nilai % 1 ? 1 : 0), x.satuan, tx(x.ket), x.sumber_id, x.tingkat_bukti)).join("");
  const gas = P.gasifikasi.angka.map((x) => kartuAngka("kapal", t("gsj.p.gf." + x.k), num(x.nilai, 0), x.satuan, tx(x.ket), x.sumber_id, x.tingkat_bukti)).join("");
  el.innerHTML = [
    ex({ id: "gsj-p-ruptl", ikon: "petir", topik: t("gsj.p.ey.ruptl"), judulHtml: esc(t("gsj.p.j.ruptl", { gw: num(P.angka[0].nilai, 1) })), subHtml: esc(t("gsj.p.s.ruptl")),
      isiHtml: `<div id="gsj-p-g" class="ih-bagan gsj-grafik"></div><div class="gsj-kisi">${P.angka.map((x) => kartuAngka("petir", t("gsj.p.a." + x.k), num(x.nilai, x.nilai % 1 ? 1 : 0), x.satuan, tx(x.ket), x.sumber_id, x.tingkat_bukti)).join("")}${kartuAngka("grafik", t("gsj.p.fk"), num(fk.nilai, 0), fk.satuan, tx(fk.ket), fk.sumber_id, fk.tingkat_bukti)}</div>${catatan("gsj.p.n.ruptl")}`,
      kakiHtml: kakiSumber(["ibp-ieefa", "tanahair-gas", "kontan-6529", "hukumonline-ruptl"]) }),
    ex({ id: "gsj-p-daftar", ikon: "tabel", topik: t("gsj.p.ey.daftar"), judulHtml: esc(t("gsj.p.j.daftar", { n: P.proyek.length })), subHtml: esc(t("gsj.p.s.daftar")),
      isiHtml: `<div class="gsj-kisi">${ringkas}</div><div id="gsj-p-tab"></div>${catatan("gsj.p.n.daftar")}${daftarCelah(B.gs.celah.slice(0, 1))}`, kakiHtml: kakiSumber(["kontan-6529", "tenggara-jawa1", "baird-jawa1", "pertamina-jawa1", "mitsubishi-bisnis"]) }),
    ex({ id: "gsj-p-gasif", ikon: "kapal", topik: t("gsj.p.ey.gasif"), judulHtml: esc(t("gsj.p.j.gasif")), subHtml: esc(t("gsj.p.s.gasif")),
      isiHtml: `<div class="gsj-kisi">${gas}</div><div id="gsj-p-klaster"></div>${catatan("gsj.p.n.gasif")}`, kakiHtml: kakiSumber(["petromindo-gasif", "pgj-minilng", "petromindo-6lng"]) }),
  ].join("");
  grafikRuptl(); tabProyek(); tabKlaster();
  siapTautan("org").then(() => naikkan(el));
}
