/* /keandalan: keandalan sistem listrik PLN. Data /data/keandalan.json (scripts/panen/keandalan_ruptl.mjs): SAIDI/SAIFI dan susut nasional,
   neraca daya per sistem RUPTL 2025-2034. Per UID dan curtailment tidak terbit terbuka: ditulis sebagai celah, tidak dikarang. Teks lewat kamus kd2.*. */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, angka } from "/i18n.js";
import { esc, ikon, hantuHtml, nanti } from "/inti/umum.js";
import { khUbin } from "/inti/kh.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { muatData, tampilGalat, batangHtml, pasangBar, pasangSeg } from "/analisis.js";
import { seksi, catatan, narasi, sumber, lambang, saatBahasa, garisSvg } from "/info_kerangka.js";
import { petaKoroplet, pasangPeta } from "/peta_koroplet.js";

const $ = (id) => document.getElementById(id);
const PER = 8;
let d = null, S = [], metrik = "rm0", prov = new Map();
const st = { k: "bp", arah: -1, hal: 1 };
const num = (v, n = 0) => angka(v, { desimal: n });
const namaProv = (k) => prov.get(k) ?? k;
const pilIk = (jenis, ik, teks) => `<span class="jm-pil${jenis ? " jm-pil-" + jenis : ""}">${ikon(ik, 14)}${esc(teks)}</span>`;
const lambangSistem = (s) => s.prov.slice(0, 3).map((k) => lambang(k, 16)).join("");
const namaS = (s) => `<span class="inf-nama">${lambangSistem(s)}${esc(s.nama)}</span>`;
const M = {
  rm0: { f: (s) => s.rm_persen[0], satuan: "%" },
  rmmin: { f: (s) => Math.min(...s.rm_persen), satuan: "%" },
  ebt: { f: (s) => (s.ebt_dmn_mw[9] / s.beban_puncak_neto_mw[9]) * 100, satuan: "%" },
};
const butuh = (s) => M.rmmin.f(s) <= d.ambang_penyimpanan.rm_persen_maks && M.ebt.f(s) >= d.ambang_penyimpanan.ebt_rasio_persen_min;
const status = (s) => (butuh(s) ? pilIk("warn", "peringatan", t("kd2.status.butuh")) : M.rmmin.f(s) < d.ambang_penyimpanan.rm_persen_maks ? pilIk("", "info", t("kd2.status.tipis")) : pilIk("ok", "centang", t("kd2.status.aman")));
const turun = (a, b) => Math.round(((b - a) / a) * 100);

function garis(kunci, label, satuanKey, tahunData = d.tren_nasional) {
  const titik = tahunData.map((x, i) => ({ x: x.tahun, y: x[kunci], teks: `${x.tahun}: ${t(satuanKey, { v: num(x[kunci], 2) })}${i ? ` (${turun(tahunData[i - 1][kunci], x[kunci]) > 0 ? "+" : ""}${num(turun(tahunData[i - 1][kunci], x[kunci]))}% ${t("kd2.dari_tahun_lalu")})` : ""}` }));
  return `<div><h3 class="jm-bantu">${esc(label)}</h3><div class="jm-gf">${garisSvg({ titik, lebar: 520, tinggi: 240, label })}</div></div>`;
}

function rincian(kode) {
  const s = S.find((x) => x.prov.includes(kode)); if (!s) return;
  const dlg = $("kdDlg"), thn = (i) => 2025 + i;
  const rm = garisSvg({ titik: s.rm_persen.map((v, i) => ({ x: thn(i), y: v, teks: `${thn(i)}: ${t("kd2.tip.rm", { v: num(v, 1) })}` })), ref: [{ y: d.ambang_penyimpanan.rm_persen_maks, teks: t("kd2.ref.rm", { v: d.ambang_penyimpanan.rm_persen_maks }) }], lebar: 560, tinggi: 240, label: t("kd2.dlg.rm") });
  const baris = [[t("kd2.kol.bp"), s.beban_puncak_neto_mw], [t("kd2.dlg.ebt"), s.ebt_dmn_mw]].map(([l, v]) => `<tr><td data-label="${esc(t("kd2.dlg.baris"))}">${esc(l)}</td>${[0, 4, 9].map((i) => `<td class="jm-num" data-label="${thn(i)}">${num(v[i])}</td>`).join("")}</tr>`).join("");
  dlg.innerHTML = `<header class="kd-dh"><h2 id="kdDlgJudul">${namaS(s)}</h2><button type="button" class="jm-aksi-b" data-tutup aria-label="${esc(t("jm.tutup"))}">${ikon("silang", 18)}</button></header>
<div class="kd-dr">${status(s)}${pilIk("warn", "info", t("an.hipotesis"))}<span class="jm-bantu">${esc(t("kd2.dlg.cakupan", { prov: s.prov.map(namaProv).join(", ") }))}</span></div>
<div class="kd-grid2"><div><h3 class="jm-bantu">${esc(t("kd2.dlg.rm"))}</h3><div class="jm-gf">${rm}</div></div>
<div><div class="jm-gulir"><table class="jm-tabel"><thead><tr><th>${esc(t("kd2.dlg.baris"))}</th>${[0, 4, 9].map((i) => `<th class="jm-num">${thn(i)}</th>`).join("")}</tr></thead><tbody>${baris}</tbody></table></div>
<p class="jm-bantu inf-cat">${esc(t("kd2.dlg.simpan", { mw: num(s.penyimpanan_ruptl_mw), tabel: s.tabel }))}</p></div></div>
<p class="jm-bantu inf-cat">${esc(t("kd2.dlg.catatan"))}</p>`;
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
}

function dataPeta() {
  const f = M[metrik].f, nil = S.map(f), lo = Math.min(...nil), hi = Math.max(...nil);
  const peta = new Map();
  for (const s of S) {
    const v = f(s), kelas = Math.min(4, Math.floor(((v - lo) / (hi - lo || 1)) * 5));
    for (const k of s.prov) peta.set(k, { kelas, tip: `${namaProv(k)}: ${t("kd2.tip.sistem", { s: s.nama, m: t("kd2.m." + metrik), v: num(v, 1) })}${butuh(s) ? ` (${t("kd2.status.butuh")})` : ""}` });
  }
  return { peta, lo, hi };
}
async function gambarPeta() {
  const { peta, lo, hi } = dataPeta();
  const leg = [0, 1, 2, 3, 4].map((i) => ({ kelas: "inf-k" + i, teks: i === 0 ? `${num(lo, 0)}%` : i === 4 ? `${num(hi, 0)}%` : "" })).concat([{ kelas: "inf-kx", teks: t("kd2.leg.kosong") }]);
  $("peta-isi").innerHTML = await petaKoroplet({ data: peta, nama: namaProv, label: t("kd2.peta.label"), legenda: leg });
  const f = M[metrik].f;
  const urut = [...S].sort((a, z) => f(z) - f(a));
  $("bar-isi").innerHTML = batangHtml(urut.map((s) => ({ id: s.id, label: s.nama, labelHtml: namaS(s), bagian: [{ nilai: f(s), kelas: butuh(s) ? "jm-an-c2" : "jm-an-id" }], teks: `${num(f(s), 1)}%${butuh(s) ? ` (${t("kd2.status.butuh")})` : ""}` })), { label: t("kd2.bar.label"), satuan: "%" });
  pasangBar($("bar-isi"));
}

const nilaiKol = { nama: (s) => s.nama, bp: (s) => s.beban_puncak_neto_mw[0], rm0: (s) => M.rm0.f(s), rmmin: (s) => M.rmmin.f(s), ebt: (s) => M.ebt.f(s), sim: (s) => s.penyimpanan_ruptl_mw };
const susun = () => [...S].sort((a, z) => { const x = nilaiKol[st.k](a), y = nilaiKol[st.k](z); return (typeof x === "number" ? x - y : String(x).localeCompare(String(y), "id")) * st.arah; });
function tabelHtml() {
  const a = susun(), m = (st.hal - 1) * PER;
  const kol = [["nama", "kd2.kol.sistem"], ["bp", "kd2.kol.bp"], ["rm0", "kd2.kol.rm0"], ["rmmin", "kd2.kol.rmmin"], ["ebt", "kd2.kol.ebt"], ["sim", "kd2.kol.sim"]];
  const th = kol.map(([k, l]) => `<th aria-sort="${st.k === k ? (st.arah > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-kol="${k}">${esc(t(l))}</button></th>`).join("") + `<th class="jm-tengah">${esc(t("kd2.kol.status"))}</th><th class="jm-tengah">${esc(t("kd2.kol.rincian"))}</th>`;
  const tr = a.slice(m, m + PER).map((s) => `<tr><td data-label="${esc(t("kd2.kol.sistem"))}">${namaS(s)}</td><td class="jm-num" data-label="${esc(t("kd2.kol.bp"))}">${num(s.beban_puncak_neto_mw[0])}</td><td class="jm-num" data-label="${esc(t("kd2.kol.rm0"))}">${num(M.rm0.f(s), 1)}%</td><td class="jm-num" data-label="${esc(t("kd2.kol.rmmin"))}">${num(M.rmmin.f(s), 1)}%</td><td class="jm-num" data-label="${esc(t("kd2.kol.ebt"))}">${num(M.ebt.f(s), 0)}%</td><td class="jm-num" data-label="${esc(t("kd2.kol.sim"))}">${num(s.penyimpanan_ruptl_mw)}</td><td class="jm-tengah" data-label="${esc(t("kd2.kol.status"))}">${status(s)}</td><td class="jm-tengah"><button type="button" class="jm-aksi-b" data-rinci="${esc(s.prov[0])}" aria-label="${esc(t("kd2.buka", { nama: s.nama }))}">${ikon("info", 18)}</button></td></tr>`).join("");
  return `<div class="jm-gulir"><table class="jm-tabel" data-urut="tidak" aria-label="${esc(t("kd2.tabel.label"))}"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>${paginasiHtml({ hal: st.hal, total: a.length, per: PER, satuan: "kd2.satuan" })}`;
}
function pasangTabel(akar) {
  const ulang = () => { akar.innerHTML = tabelHtml(); };
  akar.addEventListener("click", (e) => {
    const u = e.target.closest(".jm-urut"), h = e.target.closest("[data-hal]"), r = e.target.closest("[data-rinci]");
    if (r) { rincian(r.dataset.rinci); return; }
    if (u) {
      const k = u.dataset.kol; st.arah = st.k === k ? -st.arah : k === "nama" ? 1 : -1; st.k = k; st.hal = 1;
      for (const th of akar.querySelectorAll("th[aria-sort]")) th.setAttribute("aria-sort", th === u.parentElement ? (st.arah > 0 ? "ascending" : "descending") : "none");
      nanti(ulang);
    } else if (h && !h.disabled) { st.hal = Number(h.dataset.hal); sorotHalaman(h, st.hal); nanti(ulang); }
  });
  akar.closest(".jm-ex")?.addEventListener("jm:csv", (e) => {
    e.detail.baris = [[t("kd2.kol.sistem"), t("kd2.kol.bp"), t("kd2.kol.rm0"), t("kd2.kol.rmmin"), t("kd2.kol.ebt"), t("kd2.kol.sim"), t("kd2.kol.status")], ...susun().map((s) => [s.nama, s.beban_puncak_neto_mw[0], M.rm0.f(s), M.rmmin.f(s), Math.round(M.ebt.f(s)), s.penyimpanan_ruptl_mw, butuh(s) ? t("kd2.status.butuh") : ""])];
  });
  ulang();
}

async function gambar() {
  const tn = d.tren_nasional, a = tn.at(-1), b = tn.find((x) => x.tahun === 2020), flagged = S.filter(butuh);
  khUbin("ubin", [
    { ikon: "jam", nilai: num(a.saidi_jam, 2), satuan: t("kd2.sat.jam"), label: t("kd2.ubin.saidi", { tahun: a.tahun }) },
    { ikon: "petir", nilai: num(a.saifi_kali, 2), satuan: t("kd2.sat.kali"), label: t("kd2.ubin.saifi", { tahun: a.tahun }) },
    { ikon: "peringatan", nilai: num(flagged.length), satuan: `/ ${num(S.length)}`, label: t("kd2.ubin.butuh") },
  ]);
  $("isi").innerHTML = `<div id="s-tren"></div><div id="s-peta"></div><div id="s-sorot"></div><div id="s-tabel"></div><div id="s-metode"></div>`;
  $("s-tren").innerHTML = seksi({ id: "tren", ik: "grafik", topik: t("kd2.tren.topik"), judul: t("kd2.tren.judul", { a: num(turun(b.saidi_jam, a.saidi_jam) * -1), v: num(a.saidi_jam, 2) }), sub: t("kd2.tren.sub"), turunan: false,
    isi: `${narasi(t("kd2.tren.narasi"))}<div class="kd-grid2">${garis("saidi_jam", t("kd2.tren.saidi"), "kd2.tip.saidi")}${garis("saifi_kali", t("kd2.tren.saifi"), "kd2.tip.saifi")}${garis("jumlah", t("kd2.tren.susut"), "kd2.tip.susut", d.susut_nasional)}</div>${catatan(t("kd2.tren.cat"))}` });
  const seg = ["rm0", "rmmin", "ebt"].map((k) => `<button type="button" data-m="${k}" aria-pressed="${k === metrik}">${esc(t("kd2.m." + k))}</button>`).join("");
  $("s-peta").innerHTML = seksi({ id: "peta", ik: "peta", topik: t("kd2.peta.topik"), judul: t("kd2.peta.judul", { n: num(S.length), r: num(Math.min(...S.map(M.rmmin.f)), 0) }), sub: t("kd2.peta.sub"), turunan: false,
    isi: `${narasi(t("kd2.peta.narasi"))}<div class="jm-seg" role="group" aria-label="${esc(t("kd2.peta.seg"))}" id="kdSeg">${seg}</div><div id="peta-isi"></div><h3 class="jm-bantu">${esc(t("kd2.bar.judul"))}</h3><div id="bar-isi"></div><p class="jm-bantu inf-cat">${esc(t("kd2.peta.klik"))}</p>` });
  pasangSeg($("kdSeg"), "m", () => metrik, (v) => { metrik = v; }, gambarPeta, nanti);
  pasangPeta($("s-peta"), rincian);
  $("s-sorot").innerHTML = seksi({ id: "sorot", ik: "peringatan", topik: t("kd2.sorot.topik"), judul: t("kd2.sorot.judul", { n: num(flagged.length) }), sub: t("kd2.sorot.sub", { rm: d.ambang_penyimpanan.rm_persen_maks, ebt: d.ambang_penyimpanan.ebt_rasio_persen_min }), turunan: false,
    isi: `<ul class="kd-sorot">${flagged.sort((x, z) => M.rmmin.f(x) - M.rmmin.f(z)).map((s) => `<li><b>${namaS(s)}</b><div>${status(s)}</div><p>${esc(t("kd2.sorot.isi", { rm: num(M.rmmin.f(s), 1), ebt: num(M.ebt.f(s), 0), mw: num(s.penyimpanan_ruptl_mw) }))}</p></li>`).join("")}</ul>${catatan(t("kd2.sorot.cat"))}` });
  $("s-tabel").innerHTML = seksi({ id: "tabel", ik: "tabel", topik: t("kd2.tabel.topik"), judul: t("kd2.tabel.judul", { n: num(S.length) }), sub: t("kd2.tabel.sub"), turunan: false, csv: true, isi: `<div id="t-kd"></div>` });
  pasangTabel($("t-kd"));
  const celah = [1, 2, 3, 4].map((i) => `<li>${ikon("info", 18)}<div><p>${esc(t("kd2.celah." + i))}</p></div></li>`).join("");
  $("s-metode").innerHTML = seksi({ id: "metode", ik: "metode", topik: t("kd2.metode.topik"), judul: t("kd2.metode.judul"), sub: t("kd2.metode.sub"), turunan: false,
    isi: `${narasi(t("kd2.metode.isi"))}<ol class="kd-langkah">${celah}</ol>${catatan(t("kd2.metode.tanggal", { tanggal: d.dibangun_pada }))}${sumber(d.sumber.map((s) => ({ sumber: s.judul, url: s.url, tanggal: d.dibangun_pada, tahun: s.tahun })))}` });
  await gambarPeta();
  document.title = t("kd2.judul_halaman");
}

(async () => {
  await mulaiHalaman();
  $("isi").innerHTML = hantuHtml(6);
  try {
    const [k, w] = await Promise.all([muatData("keandalan.json"), muatData("wilayah.json")]);
    d = k; S = k.sistem; prov = new Map(w.baris.map((b) => [b.kode, b.nama]));
  } catch (e) { tampilGalat($("isi"), () => location.reload()); return; }
  await gambar();
  $("kdDlg").addEventListener("click", (e) => { if (e.target === e.currentTarget || e.target.closest("[data-tutup]")) e.currentTarget.close(); });
  saatBahasa(() => gambar());
})();
