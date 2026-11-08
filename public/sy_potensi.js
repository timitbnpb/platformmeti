/* /surya, tab Potensi: PVOUT dan radiasi per provinsi (Global Solar Atlas, satu titik ibu kota per provinsi, indikasi relatif) dan skor surya per kabupaten/kota (radar_kabupaten.json,
   Hipotesis). Dibaca runtime; modul ini tidak menyalin angka. INP: pilihan metrik seketika, grafik dan tabel menyusul lewat nanti(). */
import { X, L, t, ex, num, esc, ikon, bukti, luar, tabel, batangSvg, tipHtml, kosongTab, daftarCelah, catatan, muat, sumberBerkas } from "/sy_umum.js";
import { nanti } from "/inti/umum.js";
import { pilihHtml } from "/inti/komponen.js";
import { pasangPilih } from "/inti/pilih.js";

const M = { pvout: ["pvout_kwh_per_kwp_tahun", "sur.po.m.pvout", "kWh/kWp"], ghi: ["ghi_kwh_per_m2_tahun", "sur.po.m.ghi", "kWh/m2"], dni: ["dni_kwh_per_m2_tahun", "sur.po.m.dni", "kWh/m2"], gti: ["gti_optimal_kwh_per_m2_tahun", "sur.po.m.gti", "kWh/m2"] };
let metrik = "pvout";
const A = () => X.atlas?.baris || [];
function grafik() {
  const el = document.getElementById("sur-o-g"); if (!el) return;
  const [f, , u] = M[metrik], baris = [...A()].filter((b) => b[f] != null).sort((a, z) => z[f] - a[f]);
  el.innerHTML = batangSvg({ el, d: 0, satuan: u, label: t(M[metrik][1]), seri: [{ k: "n", kelas: "sur-s-pvout" }],
    baris: baris.map((b) => ({ label: b.provinsi, logo: `/img/provinsi/${b.kode}.png`, tip: `${b.provinsi}: ${num(b[f], 0)} ${u}`, th: tipHtml(b.provinsi, [[t("sur.po.m.pvout"), `${num(b.pvout_kwh_per_kwp_tahun, 0)} kWh/kWp`], [t("sur.po.m.ghi"), `${num(b.ghi_kwh_per_m2_tahun, 0)} kWh/m2`], [t("sur.po.m.sudut"), `${num(b.sudut_optimal_derajat, 0)}°`]], { img: `/img/provinsi/${b.kode}.png` }), bagian: [{ k: "n", nilai: b[f] }] })) });
}
function tabelProv() {
  const el = document.getElementById("sur-o-t"); if (!el) return;
  tabel(el, { satuan: "sur.u.prov", per: 10, urutAwal: 1, menurun: true, kolom: [
    { label: t("sur.c.provinsi"), v: (b) => b.provinsi, f: (b) => `<a class="rg3-tautan" href="/wilayah/${esc(b.kode)}"><b>${esc(b.provinsi)}</b></a>` },
    { label: t("sur.po.m.pvout"), num: true, v: (b) => b.pvout_kwh_per_kwp_tahun, f: (b) => `<b>${esc(num(b.pvout_kwh_per_kwp_tahun, 0))}</b>` },
    { label: t("sur.po.m.ghi"), num: true, v: (b) => b.ghi_kwh_per_m2_tahun, f: (b) => esc(num(b.ghi_kwh_per_m2_tahun, 0)) },
    { label: t("sur.po.m.dni"), num: true, v: (b) => b.dni_kwh_per_m2_tahun, f: (b) => esc(num(b.dni_kwh_per_m2_tahun, 0)) },
    { label: t("sur.po.m.sudut"), num: true, v: (b) => b.sudut_optimal_derajat, f: (b) => `${esc(num(b.sudut_optimal_derajat, 0))}°` },
    { label: t("sur.c.bukti"), v: (b) => b.tingkat_bukti, f: (b) => bukti(b.tingkat_bukti, { sumber: "Global Solar Atlas 2.0 (Solargis, World Bank)", tanggal: String(b.tahun || ""), cara: t("sur.po.cara") }) },
  ], baris: A() });
}
function tabelKab() {
  const el = document.getElementById("sur-o-k"); if (!el) return;
  const prov = X.radar?.provinsi || {}, baris = (X.radar?.baris || []).filter((b) => b.skor_tek?.surya != null);
  tabel(el, { satuan: "sur.u.kab", per: 10, urutAwal: 2, menurun: true, kolom: [
    { label: t("sur.c.kabupaten"), v: (b) => b.nama, f: (b) => `<b>${esc(b.nama)}</b>` },
    { label: t("sur.c.provinsi"), v: (b) => prov[b.prov]?.nama || "", f: (b) => esc(prov[b.prov]?.nama || b.prov) },
    { label: t("sur.po.skor"), num: true, v: (b) => b.skor_tek.surya, f: (b) => `<b>${esc(num(b.skor_tek.surya, 1))}</b>` },
    { label: t("sur.po.dasar"), v: (b) => b.dasar || "", f: (b) => esc(t("sur.po.dasar." + (b.dasar || "provinsi").replace("+", "_"))) },
    { label: t("sur.c.bukti"), v: () => "hipotesis", f: () => bukti("hipotesis", { sumber: "radar_kabupaten.json", cara: X.radar?.metode?.rumus }) },
  ], baris });
}
export async function mulai(el) {
  await muat(["atlas", "radar"]);
  if (!A().length) { el.innerHTML = kosongTab("sur.kosong_data"); return; }
  const ts = [...A()].sort((a, z) => z.pvout_kwh_per_kwp_tahun - a.pvout_kwh_per_kwp_tahun), at = ts[0], bw = ts.at(-1);
  el.innerHTML = [
    ex({ id: "sur-o-prov", ikon: "tek-surya", topik: t("sur.po.ey.prov"), judulHtml: esc(t("sur.po.j.prov", { a: at.provinsi, av: num(at.pvout_kwh_per_kwp_tahun, 0), b: bw.provinsi, bv: num(bw.pvout_kwh_per_kwp_tahun, 0) })), subHtml: esc(t("sur.po.s.prov")),
      isiHtml: `<div class="jm-saring rg3-saring rg3-saring-1">${pilihHtml({ id: "sur-o-m", ikon: "tek-surya", label: t("sur.po.f.metrik"), opsi: Object.entries(M).map(([k, v]) => [k, t(v[1]), "tek-surya"]), nilai: metrik })}</div><div id="sur-o-g" class="ih-bagan"></div><div id="sur-o-t"></div>${catatan("sur.po.n.prov")}${daftarCelah((X.atlas.meta?.celah || []).slice(0, 1))}`,
      kakiHtml: sumberBerkas(X.atlas, ["global-solar-atlas"]) }),
    X.radar?.baris ? ex({ id: "sur-o-kab", ikon: "berlian", topik: t("sur.po.ey.kab"), judulHtml: esc(t("sur.po.j.kab", { n: num((X.radar.baris || []).length) })), subHtml: esc(t("sur.po.s.kab")), isiHtml: `<div id="sur-o-k"></div>${catatan("sur.po.n.kab")}${daftarCelah((X.radar.celah || []).slice(0, 1))}<p class="jm-bantu"><a class="rg3-tautan" href="/radar">${esc(t("sur.po.ke_radar"))}</a> <a class="rg3-tautan" href="/cek-lokasi">${esc(t("sur.po.ke_cek"))}</a> <a class="jm-tbl" href="/surya?tab=proyek" data-pindah="proyek">${esc(t("sur.po.ke_terapung"))}</a></p>` }) : "",
  ].join("");
  pasangPilih();
  nanti(() => { grafik(); tabelProv(); tabelKab(); });
  el.querySelector("#sur-o-m")?.addEventListener("change", (e) => { metrik = M[e.target.value] ? e.target.value : "pvout"; nanti(grafik); });
}
