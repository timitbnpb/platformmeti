/* /metode: cara menghitung tiap kartu Insight (anchor #metode-<id>) dan cara mengutip. Teks dari kamus, tanpa angka tertanam. */
import { mulaiHalaman } from "/inti/kepala.js";
import { esc } from "/inti/umum.js";
import { t, tanggal } from "/i18n.js";
import { exHtml, sumberHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { muatData, saatBahasa } from "/analisis.js";

const $ = (id) => document.getElementById(id);
const DAFTAR = [
  ["pipeline", "pip"], ["terlambat", "tel"], ["celah", "cel"], ["plts", "plt"], ["bauran", "mix"], ["regulasi", "reg"], ["berita", "ber"],
  ["jetp", "fin"], ["karbon", "kar"], ["tarif", "trf"], ["asean", "asn"],
  ["t-kap", "tk"], ["t-pip", "tp"], ["t-reg", "tr"], ["t-ber", "tb"], ["t-kar", "tkar"], ["t-asn", "ta"],
];
let tgl = "", target = 100;

function gambar() {
  const tahun = Number(tgl.slice(0, 4)) || "";
  $("jawab").textContent = t("met.jawab", { n: DAFTAR.length, tanggal: tanggal(tgl) });
  const sumber = sumberHtml(esc(t("met.jawab", { n: DAFTAR.length, tanggal: tanggal(tgl) })));
  const ex = (o) => exHtml({ aksiHtml: aksiHtml({ csv: false }) + sumber, ...o });
  $("umum-w").innerHTML = ex({ id: "ex-umum", ikon: "metode", topik: t("met.ex.umum.ey"), judulHtml: hlHtml("met.ex.umum.j", 4), subHtml: esc(t("met.ex.umum.sub")),
    isiHtml: `<div class="jm-an-cara">${["ins.cara1", "ins.cara2", "ins.cara3", "ins.cara4"].map((k) => `<p>${esc(t(k))}</p>`).join("")}</div>` });
  $("kartu-w").innerHTML = ex({ id: "ex-kartu", ikon: "analisis", topik: t("met.ex.kartu.ey"), judulHtml: hlHtml("met.ex.kartu.j", DAFTAR.length), subHtml: esc(t("met.ex.kartu.sub")),
    isiHtml: `<div class="jm-met-daftar">${DAFTAR.map(([id, k]) => (exHtml({ id: "metode-" + id, kelas: "jm-met", ikon: "analisis", topik: t("met.ex.kartu.ey"), tingkat: "h3", judulHtml: esc(t("ins.mt." + id)), isiHtml: `<p>${esc(t("ins." + k + ".cara", { tahun, target }))}</p><p><a href="/insight#ins-${id}">${esc(t("met.lihat"))}</a></p>` }))).join("")}</div>` });
  $("kutip").textContent = t("ins.kutip", { tanggal: tanggal(tgl, { gaya: "panjang" }) });
  if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
}

(async () => {
  await mulaiHalaman();
  try { tgl = (await muatData("ringkas.json")).dibangun_pada; } catch (e) { tgl = ""; }
  try { target = (await muatData("rantai_plts.json")).program.target_gwp; } catch (e) { target = 100; }
  gambar();
  saatBahasa(gambar);
})();
