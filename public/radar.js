/* /radar: dua tab, Radar kabupaten (radar_kab.js) dan Dedieselisasi (radar_ded.js), dimuat malas saat tab dibuka. Hero memakai kedua potret statis.
   Rumus bersama ada di radar_rumus.js (dipakai juga oleh scripts/pipa dan uji). */
import { mulaiHalaman } from "/inti/kepala.js";
import { tabHalaman } from "/inti/tab_halaman.js";
import { khUbin } from "/inti/kh.js";
import { t, angka } from "/i18n.js";
import { galatHtml } from "/inti/umum.js";
import { hemat } from "/radar_rumus.js";

const ambil = (n) => fetch(`/data/${n}.json`, { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error(n); return r.json(); });
await mulaiHalaman();
let RK, DD;
try { [RK, DD] = await Promise.all([ambil("radar_kabupaten"), ambil("dedieselisasi")]); } catch {
  document.getElementById("rdKabIsi").innerHTML = galatHtml("jaringan");
  document.querySelector("#rdKabIsi [data-aksi=ulang]")?.addEventListener("click", () => location.reload());
  throw new Error("data radar");
}
const N = (n, d = 0) => angka(n, { desimal: d });
const pltdMw = DD.baris.reduce((a, b) => a + (b.pltd_mw || 0), 0);
const liter = DD.baris.reduce((a, b) => a + (b.pltd_gwh ? hemat({ pltdGwh: b.pltd_gwh, s: 1, hargaL: 1 }).liter : 0), 0);
function hero() {
  khUbin("rdAngka", [
    { ikon: "peta", nilai: N(RK.jumlah), label: t("rd2.k.kab") },
    { ikon: "status", nilai: N(RK.baris.filter((b) => b.dasar !== "provinsi").length), label: t("rd2.k.bukti") },
    { ikon: "petir", nilai: N(pltdMw / 1000, 1), satuan: "GW", label: t("rd2.k.pltd") },
    { ikon: "tek-listrik", nilai: N(liter / 1e9, 1), satuan: t("rd2.k.miliar_l"), label: t("rd2.k.solar") },
  ]);
}
hero();
document.addEventListener("jm:bahasa", hero);
tabHalaman("tabHal", {
  label: "rd2.tab",
  tab: [
    { k: "kabupaten", ikon: "peta", teks: "rd2.tab.kab", panel: "panelKab", muat: () => import("/radar_kab.js").then((m) => m.mulai(RK)) },
    { k: "dedieselisasi", ikon: "petir", teks: "rd2.tab.ded", panel: "panelDed", muat: () => import("/radar_ded.js").then((m) => m.mulai(DD)) },
  ],
});
