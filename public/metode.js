/* /metode: cara menghitung tiap kartu Insight (anchor #metode-<id>) dan cara mengutip. Teks dari kamus, tanpa angka tertanam. */
import { mulaiHalaman } from "/inti/kepala.js";
import { esc } from "/inti/umum.js";
import { t, tanggal } from "/i18n.js";
import { exHtml, sumberHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { muatData, saatBahasa } from "/analisis.js";
import { khUbin } from "/inti/kh.js";
import { num, muatPotret, estPil, pasangTabel, urlAman } from "/proyek_besar_umum.js";
import { pilTek } from "/inti/ikon_tek.js";

const $ = (id) => document.getElementById(id);
const DAFTAR = [
  ["pipeline", "pip"], ["terlambat", "tel"], ["celah", "cel"], ["plts", "plt"], ["bauran", "mix"], ["regulasi", "reg"], ["berita", "ber"],
  ["jetp", "fin"], ["karbon", "kar"], ["tarif", "trf"], ["asean", "asn"],
  ["t-kap", "tk"], ["t-pip", "tp"], ["t-reg", "tr"], ["t-ber", "tb"], ["t-kar", "tkar"], ["t-asn", "ta"],
];
let tgl = "", target = 100, PB = null;

function gambar() {
  const tahun = Number(tgl.slice(0, 4)) || "";
  $("jawab").textContent = t("met.jawab", { n: DAFTAR.length, tanggal: tanggal(tgl) });
  const sumber = sumberHtml(esc(t("met.jawab", { n: DAFTAR.length, tanggal: tanggal(tgl) })));
  const ex = (o) => exHtml({ aksiHtml: aksiHtml({ csv: false }) + sumber, ...o });
  $("umum-w").innerHTML = ex({ id: "ex-umum", ikon: "metode", topik: t("met.ex.umum.ey"), judulHtml: hlHtml("met.ex.umum.j", 4), subHtml: esc(t("met.ex.umum.sub")),
    isiHtml: `<div class="jm-an-cara">${["ins.cara1", "ins.cara2", "ins.cara3", "ins.cara4"].map((k) => `<p>${esc(t(k))}</p>`).join("")}</div>` });
  $("kartu-w").innerHTML = ex({ id: "ex-kartu", ikon: "analisis", topik: t("met.ex.kartu.ey"), judulHtml: hlHtml("met.ex.kartu.j", DAFTAR.length), subHtml: esc(t("met.ex.kartu.sub")),
    isiHtml: `<div class="jm-met-daftar">${DAFTAR.map(([id, k]) => (exHtml({ id: "metode-" + id, kelas: "jm-met", ikon: "analisis", topik: t("met.ex.kartu.ey"), tingkat: "h3", judulHtml: esc(t("ins.mt." + id)), isiHtml: `<p>${esc(t("ins." + k + ".cara", { tahun, target }))}</p><p><a href="/insight#ins-${id}">${esc(t("met.lihat"))}</a></p>` }))).join("")}</div>` });
  isiAngka();
  $("kutip").textContent = t("ins.kutip", { tanggal: tanggal(tgl, { gaya: "panjang" }) });
  if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
}

const ALASAN = ["tidak_diungkap", "belum_bersumber", "di_luar_cakupan", "tidak_berlaku"];
function isiAngka() {
  if (!PB) return;
  const sumber = sumberHtml(esc(t("mak.sumber", { tgl: tanggal(PB.dibangun_pada, { gaya: "panjang" }) })));
  const anak = PB.dikeluarkan.find((x) => x.alasan === "anak" && /pertamina/i.test(x.dalam)) || PB.dikeluarkan.find((x) => x.alasan === "anak");
  const aturan = [["mak.a1", {}], ["mak.a2", anak ? { anak: anak.nama, induk: anak.dalam, mw: num(anak.mw) } : { anak: "PGE", induk: "Pertamina", mw: "-" }], ["mak.a3", {}], ["mak.a4", { mw: PB.ambang_mw }], ["mak.a5", {}]];
  const F = PB.kerja.faktor, kt = Object.keys(F), kunciT = (k) => (k.startsWith("hidro") ? "hidro" : k);
  const faktorRow = kt.map((k) => ({ kunci: k, tek: kunciT(k), kon: F[k].konstruksi, man: F[k].manufaktur, om: F[k].om }));
  $("isi-w").innerHTML = exHtml({ id: "apa-isi-angka", ikon: "analisis", topik: t("mak.ey"), judulHtml: esc(t("mak.j")), subHtml: esc(t("mak.s")), aksiHtml: aksiHtml({ csv: false }) + sumber,
    isiHtml: `<div class="mak">
      <ol class="mak-aturan" aria-label="${esc(t("mak.aturan"))}">${aturan.map(([k, p], i) => `<li><b>${esc(t(k + ".j"))}</b><span>${esc(t(k, p))}</span></li>`).join("")}</ol>
      <div class="mak-tabel-blok" id="mak-keluar"><h3>${esc(t("mak.keluar.j"))}</h3><p class="jm-bantu">${esc(t("mak.keluar.s"))}</p><div id="makKeluar"></div></div>
      <div class="mak-tabel-blok" id="mak-kosong"><h3>${esc(t("mak.kosong.j"))}</h3><ul class="mak-aturan">${ALASAN.map((a) => `<li><b>${esc(t("mak.al." + a))}</b><span>${esc(t("mak.al." + a + ".ket"))}</span></li>`).join("")}</ul><div id="makKosong"></div></div>
      <div class="mak-tabel-blok" id="faktor-kerja"><h3>${esc(t("mak.kerja.j"))} ${estPil()}</h3><p class="jm-bantu">${esc(t("mak.kerja.s", { pengali: num(PB.kerja.pengali.nilai), ambang: PB.kerja.ambang_hidro }))}</p><div id="makFaktor"></div>
        <ul class="mak-aturan">${PB.kerja.sumber.map((s) => `<li><b>${urlAman(s.url) ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.judul)}</a>` : esc(s.judul)}</b><span>${esc(s.penerbit)}, ${esc(String(s.tahun))}</span></li>`).join("")}</ul></div>
    </div>` });
  pasangTabel($("makKeluar"), [["nama", "mak.c.baris", (r) => esc(r.nama)], ["mw", "mak.c.mw", (r) => num(r.mw), "jm-num"], ["dalam", "mak.c.dalam", (r) => (r.dalam ? esc(r.dalam) : "-")], ["alasan", "mak.c.alasan", (r) => esc(t("mak.ak." + r.alasan))]],
    PB.dikeluarkan, { k: "mw", arah: -1, hal: 1, turun: ["mw"] });
  const kos = Object.entries(PB.sel_kosong).map(([k, v]) => ({ kunci: t("mak.kol." + k), ...v }));
  pasangTabel($("makKosong"), [["kunci", "mak.c.kolom", (r) => esc(r.kunci)], ...ALASAN.map((a) => [a, "mak.al." + a, (r) => num(r[a]), "jm-num"])], kos, { k: "kunci", arah: 1, hal: 1, turun: ALASAN });
  pasangTabel($("makFaktor"), [["tek", "pj.c.tek", (r) => `${pilTek(r.tek)}${r.kunci.startsWith("hidro") ? ` <small class="jm-bantu">${esc(t(r.kunci === "hidro-besar" ? "mak.f.besar" : "mak.f.kecil", { ambang: PB.kerja.ambang_hidro }))}</small>` : ""}`], ["kon", "mak.f.kon", (r) => num(r.kon), "jm-num"], ["man", "mak.f.man", (r) => num(r.man), "jm-num"], ["om", "mak.f.om", (r) => num(r.om), "jm-num"]],
    faktorRow, { k: "tek", arah: 1, hal: 1, turun: ["kon", "man", "om"] });
  khUbin("metUbin", [{ ikon: "proyek", nilai: num(Object.values(PB.besar).flat().length), label: t("mak.k.besar", { mw: PB.ambang_mw }) }, { ikon: "blokir", nilai: num(PB.dikeluarkan.length), label: t("mak.k.keluar") }, { ikon: "orang", nilai: num(kt.length), label: t("mak.k.faktor") }]);
  if (location.hash === "#apa-isi-angka" || location.hash === "#faktor-kerja") document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

(async () => {
  await mulaiHalaman();
  try { tgl = (await muatData("ringkas.json")).dibangun_pada; } catch (e) { tgl = ""; }
  try { target = (await muatData("rantai_plts.json")).program.target_gwp; } catch (e) { target = 100; }
  try { PB = await muatPotret(); } catch (e) { PB = null; }
  gambar();
  saatBahasa(gambar);
})();
