/* /angin, tab Pelabuhan dan logistik: pelabuhan tujuan Indonesia dan rute dari pelabuhan asal komponen (global/logistik.json, jarak garis lurus dan hari layar EST), kasus nyata Sidrap dan Tolo.
   Dibaca runtime; waktu layar adalah batas bawah (tanpa antrean), bukan jadwal pelayaran. */
import { B, muat, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, kosongTab, daftarCelah, catatan, pil } from "/ang_umum.js";
import { nanti } from "/inti/umum.js";

const PEL = () => new Map((B.log?.pelabuhan || []).map((p) => [p.id, p]));
function tabPelabuhan() {
  const el = document.getElementById("ang-g-pel"); if (!el) return;
  const baris = B.ang.rujukan.pelabuhan_ids.map((i) => PEL().get(i)).filter(Boolean);
  tabel(el, { satuan: "ang.u.pelabuhan", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("ang.c.pelabuhan"), v: (p) => p.nama, f: (p) => `<b>${esc(p.nama)}</b>` },
    { label: t("ang.c.peran"), v: (p) => p.peran, f: (p) => pil("ang.pp.", p.peran) },
    { label: t("ang.c.koordinat"), v: (p) => p.lat, f: (p) => esc(`${num(p.lat, 2)}, ${num(p.lon, 2)}`) },
    { label: t("ang.c.bukti"), v: () => "", f: (p) => bukti(p.tingkat_bukti || "via-pihak-ketiga", { sumber: "Wikipedia", tanggal: p.tanggal || "" }) },
  ], baris });
}
function tabRute() {
  const el = document.getElementById("ang-g-rute"); if (!el) return;
  const P = PEL(), tuj = new Set(B.ang.rujukan.pelabuhan_ids);
  const baris = (B.log?.rute || []).filter((r) => tuj.has(r.ke));
  tabel(el, { satuan: "ang.u.rute", per: 10, urutAwal: 2, menurun: false, kolom: [
    { label: t("ang.c.asal"), v: (r) => P.get(r.dari)?.nama || r.dari, f: (r) => esc(P.get(r.dari)?.nama || r.dari) },
    { label: t("ang.c.tujuan"), v: (r) => P.get(r.ke)?.nama || r.ke, f: (r) => `<b>${esc(P.get(r.ke)?.nama || r.ke)}</b>` },
    { label: t("ang.c.hari"), num: true, v: (r) => r.hari_layar_est, f: (r) => esc(num(r.hari_layar_est, 1)) },
    { label: t("ang.c.jarak"), num: true, v: (r) => r.jarak_garis_km, f: (r) => esc(num(r.jarak_garis_km, 0)) },
    { label: t("ang.c.bukti"), v: () => "", f: (r) => bukti("est", { sumber: "METI", tanggal: r.tanggal || "", cara: r.rumus || "" }) },
  ], baris });
}
export async function mulai(el) {
  await muat(["log"]);
  if (!B.ang) { el.innerHTML = kosongTab("ang.kosong"); return; }
  const A = B.ang, kartu = (x) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon("kapal", 22)}<b>${esc(t("ang.g.k." + x.k))}</b></div><p class="jm-bantu">${esc(tx(x.teks))}</p>${buktiS(x.sumber_id, x.tingkat_bukti)}</div>`;
  el.innerHTML = [
    ex({ id: "ang-g-kasus", ikon: "kapal", topik: t("ang.g.ey.kasus"), judulHtml: esc(t("ang.g.j.kasus")), subHtml: esc(t("ang.g.s.kasus")), isiHtml: `<div class="rg3-kisi">${A.logistik.kasus.map(kartu).join("")}</div>${catatan("ang.g.n.kasus")}${daftarCelah([A.celah[1]])}`, kakiHtml: kakiSumber(["etp1", "detik-sidrap"]) }),
    ex({ id: "ang-g-pelx", ikon: "lokasi", topik: t("ang.g.ey.pel"), judulHtml: esc(t("ang.g.j.pel", { n: A.rujukan.pelabuhan_ids.length })), subHtml: esc(t("ang.g.s.pel")), isiHtml: `<div id="ang-g-pel"></div>${catatan("ang.g.n.pel")}<p class="jm-bantu"><a class="rg3-tautan" href="/rantai-global?tab=logistik">${esc(t("ang.g.ke_logistik"))}</a></p>` }),
    ex({ id: "ang-g-rutex", ikon: "globe", topik: t("ang.g.ey.rute"), judulHtml: esc(t("ang.g.j.rute")), subHtml: esc(t("ang.g.s.rute")), isiHtml: `<div id="ang-g-rute"></div>${catatan("ang.g.n.rute")}` }),
  ].join("");
  nanti(() => { tabPelabuhan(); tabRute(); });
}
