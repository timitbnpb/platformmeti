/* /hidrogen, tab Sumber listrik: lokasi potensial (hub produksi, permintaan, pelabuhan), listrik EBT beroperasi di provinsi hub (Direktori proyek) dan potensi surya/angin kabupaten hub (Global Solar/Wind Atlas). */
import { H, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, batangSvg, tipHtml, legendaHtml, siapTautan, naikkan, kosongTab, daftarCelah, catatan, tautProvinsi, orgDaftar, chipStatus, chipTek, pilJenis, luar, src } from "/h2_umum.js";

const PERAN = [["", "daftar2"], ["produksi", "pabrik"], ["permintaan", "industri"], ["pelabuhan", "kapal"]];
let peran = "";
const TEK = [["panas-bumi", "h2-s-pltp"], ["surya", "h2-s-pltm"], ["hidro", "h2-s-plta"], ["bayu", "h2-s-bayu"]];
const L = () => H.h2.lokasi;

function mwProvinsi() {
  const g = document.getElementById("h2-s-mw"); if (!g) return;
  const P = (H.proyek?.baris || []).filter((p) => p.teknologi && p.status?.[0]?.nilai === "beroperasi" && p.kapasitas?.[0]?.satuan === "MW");
  const provs = [...new Map(L().filter((l) => l.prov).map((l) => [l.prov, l.provinsi])).entries()];
  const baris = provs.map(([kode, nama]) => {
    const bagian = TEK.map(([k]) => ({ k, nilai: Math.round(P.filter((p) => p.lokasi?.provinsi === nama && p.teknologi === k).reduce((a, p) => a + p.kapasitas[0].nilai, 0)) }));
    return { label: nama, logo: `/img/provinsi/${kode}.png`, tip: nama, th: tipHtml(nama, bagian.map((b) => [t("h2.tek." + b.k), `${num(b.nilai, 0)} MW`]), { img: `/img/provinsi/${kode}.png` }), bagian };
  }).filter((b) => b.bagian.some((p) => p.nilai > 0)).sort((a, b) => b.bagian.reduce((x, p) => x + p.nilai, 0) - a.bagian.reduce((x, p) => x + p.nilai, 0));
  document.getElementById("h2-s-mw-l").innerHTML = legendaHtml(TEK.map(([k, c]) => ({ kelas: c, label: t("h2.tek." + k) })));
  g.innerHTML = baris.length ? batangSvg({ el: g, d: 0, satuan: "MW", label: t("h2.s.j.mw"), seri: TEK.map(([k, kelas]) => ({ k, kelas })), baris }) : kosongTab("h2.kosong");
}
function potensi() {
  const g = document.getElementById("h2-s-pv"); if (!g) return;
  const A = new Map((H.atlas?.baris || []).map((b) => [b.kode, b]));
  const baris = L().flatMap((l) => [l.kab, l.kab2].filter(Boolean).map((k) => A.get(k))).filter(Boolean).sort((a, b) => b.surya.pvout_kwh_per_kwp_tahun - a.surya.pvout_kwh_per_kwp_tahun);
  g.innerHTML = baris.length ? batangSvg({ el: g, d: 0, satuan: "kWh/kWp", label: t("h2.s.j.pv"), seri: [{ k: "pv", kelas: "h2-s-pltm" }],
    baris: baris.map((b) => ({ label: b.nama.replace(/^(Kabupaten|Kota) /, ""), logo: `/img/provinsi/${b.kode_provinsi}.png`, tip: b.nama, th: tipHtml(b.nama, [[t("h2.s.pv"), `${num(b.surya.pvout_kwh_per_kwp_tahun, 0)} kWh/kWp`], [t("h2.s.angin"), `${num(b.angin.kecepatan_100m_ms, 1)} m/s`], [t("h2.s.ghi"), `${num(b.surya.ghi_kwh_per_m2_tahun, 0)} kWh/m2`]], { img: `/img/provinsi/${b.kode_provinsi}.png` }), bagian: [{ k: "pv", nilai: b.surya.pvout_kwh_per_kwp_tahun }] })) }) : kosongTab("h2.kosong");
}
function tabelLokasi() {
  const el = document.getElementById("h2-s-tab"); if (!el) return;
  const baris = L().filter((l) => !peran || l.peran.includes(peran));
  tabel(el, { satuan: "h2.u.lokasi", per: 5, urutAwal: 0, menurun: false, kolom: [
    { label: t("h2.c.lokasi"), v: (l) => l.nama, f: (l) => `<span class="rg3-idk"><b>${esc(l.nama)}</b><small>${tautProvinsi(l.prov)}</small></span>` },
    { label: t("h2.c.listrik"), v: (l) => l.sumber_listrik.join(), f: (l) => (l.sumber_listrik.length ? `<span class="h2-baris">${l.sumber_listrik.map(chipTek).join("")}</span>` : `<span class="jm-bantu">${esc(t("h2.belum"))}</span>`) },
    { label: t("h2.c.peran"), v: (l) => l.peran.join(), f: (l) => `<span class="h2-baris">${l.peran.map((p) => pilJenis("h2.peran.", p, PERAN.find((x) => x[0] === p)?.[1])).join("")}</span>` },
    { label: t("h2.c.status"), v: (l) => l.status, f: (l) => chipStatus(l.status) },
    { label: t("h2.c.pihak"), v: (l) => l.org.length, f: (l) => orgDaftar(l.org) },
    { label: t("h2.c.uraian"), v: (l) => tx(l.ket), f: (l) => `<span class="rg3-teks">${esc(tx(l.ket))}</span>` },
    { label: t("h2.c.bukti"), v: (l) => l.tingkat_bukti, f: (l) => buktiS(l.sumber_id, l.tingkat_bukti) },
  ], baris });
  siapTautan("org", "provinsi").then(() => naikkan(el));
}
export function mulai(el) {
  const d = H.h2, n = (p) => L().filter((l) => !p || l.peran.includes(p)).length, lk = d.lokasi_potensial_jumlah;
  el.innerHTML = [
    ex({ id: "h2-s-lok", ikon: "peta", topik: t("h2.s.ey.lok"), judulHtml: esc(t("h2.s.j.lok", { n: lk.n })), subHtml: esc(t("h2.s.s.lok")),
      isiHtml: `<div class="rg3-info">${ikon("info", 18)}<p>${esc(t("h2.s.info", { n: lk.n }))} ${buktiS(lk.sumber_id, lk.tingkat_bukti)}</p></div><div class="rg3-chips" role="group" aria-label="${esc(t("h2.f.peran"))}">${PERAN.map(([k, i]) => `<button type="button" class="rg3-chip rg3-chipb rg3-w${k ? ["produksi", "permintaan", "pelabuhan"].indexOf(k) + 1 : 0}" data-peran="${esc(k)}" aria-pressed="${peran === k}">${ikon(i, 14)}<span>${esc(t(k ? "h2.peran." + k : "h2.semua"))}</span> <i>${n(k)}</i></button>`).join("")}</div><div id="h2-s-tab"></div>${catatan("h2.s.n.lok")}`, kakiHtml: kakiSumber(L().map((l) => l.sumber_id).concat(lk.sumber_id)) }),
    ex({ id: "h2-s-mwx", ikon: "petir", topik: t("h2.s.ey.mw"), judulHtml: esc(t("h2.s.j.mw")), subHtml: esc(t("h2.s.s.mw")), isiHtml: `<div id="h2-s-mw-l"></div><div id="h2-s-mw" class="ih-bagan"></div>${catatan("h2.s.n.mw")}` }),
    ex({ id: "h2-s-pvx", ikon: "tek-surya", topik: t("h2.s.ey.pv"), judulHtml: esc(t("h2.s.j.pv")), subHtml: esc(t("h2.s.s.pv")), isiHtml: `<div id="h2-s-pv" class="ih-bagan"></div>${catatan("h2.s.n.pv")}` }),
  ].join("");
  tabelLokasi(); mwProvinsi(); potensi();
  el.querySelector(".rg3-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-peran]"); if (!b) return;
    peran = b.dataset.peran; for (const x of el.querySelectorAll("[data-peran]")) x.setAttribute("aria-pressed", String(x.dataset.peran === peran));
    tabelLokasi();
  });
}
