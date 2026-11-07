/* /perizinan: indeks kemudahan perizinan per provinsi (Hipotesis). Data /data/perizinan_provinsi.json (scripts/pipa/perizinan_indeks.mjs).
   Peta koroplet interaktif, peringkat berlambang, tabel berpaginasi, rincian komponen dalam pop-up. Teks lewat kamus pz2.*. */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, angka } from "/i18n.js";
import { esc, ikon, hantuHtml, nanti } from "/inti/umum.js";
import { khUbin } from "/inti/kh.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { muatData, tampilGalat, batangHtml, pasangBar } from "/analisis.js";
import { seksi, catatan, narasi, sumber, lambang, tautan, saatBahasa } from "/info_kerangka.js";
import { petaKoroplet, pasangPeta } from "/peta_koroplet.js";

const $ = (id) => document.getElementById(id);
const PER = 10;
let d = null, rata = 0;
const st = { k: "peringkat", arah: 1, hal: 1 };
const num = (v, n = 0) => angka(v, { desimal: n });
const nama = (k) => d.baris.find((r) => r.kode === k)?.nama ?? k;
const namaL = (r) => `<span class="inf-nama">${lambang(r.kode)}${esc(r.nama)}</span>`;
const band = (s) => (s == null ? ["kosong", "info", ""] : s >= 70 ? ["tinggi", "centang", "ok"] : s >= 40 ? ["sedang", "info", "warn"] : ["rendah", "peringatan", "bad"]);
const pilIk = (jenis, ik, teks) => `<span class="jm-pil${jenis ? " jm-pil-" + jenis : ""}">${ikon(ik, 14)}${esc(teks)}</span>`;
const pilSkor = (s) => { const [b, ik, j] = band(s); return pilIk(j, ik, s == null ? t("pz2.band.kosong") : `${num(s)} ${t("pz2.band." + b)}`); };
const kelasPeta = (s) => (s == null ? null : Math.min(4, Math.floor(s / 20)));
const bandingTeks = (s) => { const p = Math.round(s - rata); return p === 0 ? t("pz2.sama") : t(p > 0 ? "pz2.atas" : "pz2.bawah", { p: num(Math.abs(p)) }); };
const ikK = { rued: "regulasi", perda: "buku", wkp: "tek-panas", berita: "berita", oss: "gedung" };

function bukti(k, c) {
  if (c.skor == null) return esc(t("pz2.k." + k + ".kosong"));
  const v = c.nilai;
  if (k === "rued") return v ? `${esc(t("pz2.k.rued.ada", { perda: v.perda, tahun: v.tahun ?? "-" }))} ${v.url ? tautan(v.url, t("pz2.sumber")) : ""} ${v.pdf ? tautan(v.pdf, "PDF") : ""}` : esc(t("pz2.k.rued.tidak"));
  if (k === "perda") return v.n ? `${esc(t("pz2.k.perda.ada", { n: num(v.n) }))}<ul class="pz-daftar">${v.daftar.slice(0, 5).map((x) => `<li>${tautan(x.url, `${x.judul.length > 80 ? x.judul.slice(0, 77) + "..." : x.judul} (${x.tahun})`)}</li>`).join("")}</ul>` : esc(t("pz2.k.perda.nol"));
  if (k === "wkp") return `${esc(t("pz2.k.wkp.ada", { n: num(v.n) }))}<ul class="pz-daftar">${v.daftar.map((x) => `<li>${esc(x.nama)}: ${esc(t("pz2.wkp." + x.status))}</li>`).join("")}</ul>`;
  if (k === "berita") return `${esc(t("pz2.k.berita.ada", { n: num(v.n) }))}<ul class="pz-daftar">${v.daftar.map((x) => `<li>${tautan(x.url, x.judul)} <span class="jm-bantu">${esc(x.media)}</span></li>`).join("")}</ul>`;
  return "";
}
function rincian(kode) {
  const r = d.baris.find((x) => x.kode === kode); if (!r) return;
  const dlg = $("pzDlg");
  const baris = Object.entries(r.komponen).map(([k, c]) => `<tr><td data-label="${esc(t("pz2.kol.komponen"))}"><span class="pz-komp">${ikon(ikK[k], 18)}<b>${esc(t("pz2.k." + k))}</b></span></td><td class="jm-num" data-label="${esc(t("pz2.kol.bobot"))}">${num(d.bobot[k])}%</td><td class="jm-tengah" data-label="${esc(t("pz2.kol.skor"))}">${c.skor == null ? pilIk("", "silang", t("pz2.keluar")) : pilSkor(c.skor)}</td><td data-label="${esc(t("pz2.kol.bukti"))}">${bukti(k, c)}</td></tr>`).join("");
  dlg.innerHTML = `<header class="pz-dh"><h2 id="pzDlgJudul">${namaL(r)}</h2><button type="button" class="jm-aksi-b" data-tutup aria-label="${esc(t("jm.tutup"))}">${ikon("silang", 18)}</button></header>
<div class="pz-dr">${pilSkor(r.skor)}${r.peringkat ? pilIk("", "tingkat", t("pz2.peringkat", { n: num(r.peringkat), dari: num(d.baris.filter((x) => x.skor != null).length) })) : ""}${pilIk("warn", "info", t("an.hipotesis"))}<span class="jm-bantu">${esc(t("pz2.bobot_terpakai", { p: num(r.bobot_terpakai) }))}</span></div>
<div class="jm-gulir"><table class="jm-tabel pz-tabel"><thead><tr><th>${esc(t("pz2.kol.komponen"))}</th><th class="jm-num">${esc(t("pz2.kol.bobot"))}</th><th class="jm-tengah">${esc(t("pz2.kol.skor"))}</th><th>${esc(t("pz2.kol.bukti"))}</th></tr></thead><tbody>${baris}</tbody></table></div>
<p class="jm-bantu inf-cat">${esc(t("pz2.catatan_dlg"))}</p>`;
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
}

const nilaiKol = {
  peringkat: (r) => r.peringkat ?? null, nama: (r) => r.nama, skor: (r) => r.skor,
  rued: (r) => r.komponen.rued.nilai?.tahun ?? null, perda: (r) => r.komponen.perda.nilai.n, wkp: (r) => r.komponen.wkp.nilai?.n ?? null,
};
const susun = () => [...d.baris].sort((a, z) => {
  const x = nilaiKol[st.k](a), y = nilaiKol[st.k](z);
  return ((x == null) - (y == null)) || (x == null ? 0 : (typeof x === "number" ? x - y : String(x).localeCompare(String(y), "id")) * st.arah);
});
function tabelHtml() {
  const a = susun(), m = (st.hal - 1) * PER;
  const kol = [["peringkat", "pz2.kol.no", ""], ["nama", "pz2.kol.provinsi", ""], ["skor", "pz2.kol.skor", ""], ["rued", "pz2.kol.rued", ""], ["perda", "pz2.kol.perda", ""], ["wkp", "pz2.kol.wkp", ""]];
  const th = kol.map(([k, l]) => `<th aria-sort="${st.k === k ? (st.arah > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-kol="${k}">${esc(t(l))}</button></th>`).join("") + `<th class="jm-tengah">${esc(t("pz2.kol.rincian"))}</th>`;
  const tr = a.slice(m, m + PER).map((r) => {
    const ru = r.komponen.rued.nilai;
    return `<tr><td class="jm-tengah" data-label="${esc(t("pz2.kol.no"))}">${r.peringkat ? num(r.peringkat) : "-"}</td><td data-label="${esc(t("pz2.kol.provinsi"))}">${namaL(r)}</td><td data-label="${esc(t("pz2.kol.skor"))}">${pilSkor(r.skor)}</td><td data-label="${esc(t("pz2.kol.rued"))}">${ru ? pilIk("ok", "centang", t("pz2.rued.ada", { tahun: ru.tahun ?? "-" })) : pilIk("", "silang", t("pz2.rued.tidak"))}</td><td class="jm-num" data-label="${esc(t("pz2.kol.perda"))}">${num(r.komponen.perda.nilai.n)}</td><td class="jm-num" data-label="${esc(t("pz2.kol.wkp"))}">${r.komponen.wkp.nilai ? num(r.komponen.wkp.nilai.n) : '<span class="jm-bantu" title="' + esc(t("pz2.k.wkp.kosong")) + '">-</span>'}</td><td class="jm-tengah"><button type="button" class="jm-aksi-b" data-rinci="${esc(r.kode)}" aria-label="${esc(t("pz2.buka", { nama: r.nama }))}">${ikon("info", 18)}</button></td></tr>`;
  }).join("");
  return `<div class="jm-gulir"><table class="jm-tabel" data-urut="tidak" aria-label="${esc(t("pz2.tabel.label"))}"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>${paginasiHtml({ hal: st.hal, total: a.length, per: PER, satuan: "pz2.satuan" })}`;
}
function pasangTabel(akar) {
  const gambarUlang = () => { akar.innerHTML = tabelHtml(); };
  akar.addEventListener("click", (e) => {
    const u = e.target.closest(".jm-urut"), h = e.target.closest("[data-hal]"), r = e.target.closest("[data-rinci]");
    if (r) { rincian(r.dataset.rinci); return; }
    if (u) {
      const k = u.dataset.kol; st.arah = st.k === k ? -st.arah : 1; st.k = k; st.hal = 1;
      for (const th of akar.querySelectorAll("th[aria-sort]")) th.setAttribute("aria-sort", th === u.parentElement ? (st.arah > 0 ? "ascending" : "descending") : "none");
      nanti(gambarUlang);
    } else if (h && !h.disabled) { st.hal = Number(h.dataset.hal); sorotHalaman(h, st.hal); nanti(gambarUlang); }
  });
  akar.closest(".jm-ex")?.addEventListener("jm:csv", (e) => {
    e.detail.baris = [[t("pz2.kol.no"), t("pz2.kol.provinsi"), t("pz2.kol.skor"), t("pz2.kol.rued"), t("pz2.kol.perda"), t("pz2.kol.wkp")], ...susun().map((r) => [r.peringkat ?? "", r.nama, r.skor ?? "", r.komponen.rued.nilai?.perda ?? "", r.komponen.perda.nilai.n, r.komponen.wkp.nilai?.n ?? ""])];
  });
  gambarUlang();
}

async function gambar() {
  const ada = d.baris.filter((r) => r.skor != null).sort((a, z) => a.peringkat - z.peringkat);
  rata = ada.reduce((s, r) => s + r.skor, 0) / ada.length;
  khUbin("ubin", [
    { ikon: "lokasi", nilai: num(ada.length), satuan: `/ ${num(d.baris.length)}`, label: t("pz2.ubin.prov") },
    { ikon: "piala", nilai: num(ada[0].skor), label: t("pz2.ubin.atas", { nama: ada[0].nama }) },
    { ikon: "grafik", nilai: num(rata), label: t("pz2.ubin.rata") },
  ]);
  const akar = $("isi");
  akar.innerHTML = `<div id="s-peta"></div><div id="s-rank"></div><div id="s-tabel"></div><div id="s-metode"></div>`;
  const data = new Map(d.baris.map((r) => [r.kode, { kelas: kelasPeta(r.skor), tip: `${r.nama}: ${r.skor == null ? t("pz2.band.kosong") : `${num(r.skor)} (${bandingTeks(r.skor)})`}` }]));
  const leg = [0, 1, 2, 3, 4].map((i) => ({ kelas: "inf-k" + i, teks: i === 0 ? t("pz2.leg.rendah") : i === 4 ? t("pz2.leg.tinggi") : "" })).concat([{ kelas: "inf-kx", teks: t("pz2.band.kosong") }]);
  const peta = await petaKoroplet({ data, nama, label: t("pz2.peta.label"), legenda: leg });
  $("s-peta").innerHTML = seksi({ id: "peta", ik: "peta", topik: t("pz2.peta.topik"), judul: t("pz2.peta.judul", { n: num(ada.length), top: ada[0].nama, v: num(ada[0].skor) }), sub: t("pz2.peta.sub"), turunan: false,
    isi: `${narasi(t("pz2.peta.narasi"))}${peta}<p class="jm-bantu inf-cat">${esc(t("pz2.peta.klik"))}</p>` });
  pasangPeta($("s-peta"), rincian);
  const bar = batangHtml(ada.slice(0, 10).map((r) => ({ id: r.kode, label: r.nama, labelHtml: namaL(r), bagian: [{ nilai: r.skor, kelas: r.skor >= 70 ? "jm-an-c1" : r.skor >= 40 ? "jm-an-c3" : "jm-an-c2" }], teks: num(r.skor) })), { maks: 100, label: t("pz2.rank.label"), satuan: "" });
  $("s-rank").innerHTML = seksi({ id: "peringkat", ik: "tingkat", topik: t("pz2.rank.topik"), judul: t("pz2.rank.judul", { n: 10, rata: num(rata) }), sub: t("pz2.rank.sub"), turunan: false, isi: bar + catatan(t("pz2.rank.cat")) });
  pasangBar($("s-rank"));
  $("s-tabel").innerHTML = seksi({ id: "tabel", ik: "tabel", topik: t("pz2.tabel.topik"), judul: t("pz2.tabel.judul", { n: num(d.baris.length) }), sub: t("pz2.tabel.sub"), turunan: false, csv: true, isi: `<div id="t-pz"></div>` });
  pasangTabel($("t-pz"));
  const langkah = ["rued", "perda", "wkp", "berita", "oss"].map((k) => `<li>${ikon(ikK[k], 18)}<div><b>${esc(t("pz2.k." + k))} (${num(d.bobot[k])}%)</b><p>${esc(t("pz2.m." + k))}</p></div></li>`).join("");
  $("s-metode").innerHTML = seksi({ id: "metode", ik: "metode", topik: t("pz2.metode.topik"), judul: t("pz2.metode.judul"), sub: t("pz2.metode.sub"), turunan: false,
    isi: `<ol class="pz-langkah">${langkah}</ol><ul class="pz-celah">${d.celah.map((_, i) => `<li>${esc(t("pz2.celah." + (i + 1)))}</li>`).join("")}</ul>${catatan(t("pz2.metode.tanggal", { tanggal: d.dibangun_pada }))}${sumber([{ sumber: t("pz2.sumber.bpk"), url: d.sumber[0].url, tanggal: d.dibangun_pada, tahun: 2026 }, { sumber: t("pz2.sumber.wkp"), url: "https://platformmeti.timitbnpb.workers.dev/data/wkp.json", tanggal: d.dibangun_pada, tahun: 2026 }])}` });
  document.title = t("pz2.judul_halaman");
}

(async () => {
  await mulaiHalaman();
  $("isi").innerHTML = hantuHtml(6);
  try { d = await muatData("perizinan_provinsi.json"); } catch (e) { tampilGalat($("isi"), () => location.reload()); return; }
  await gambar();
  $("pzDlg").addEventListener("click", (e) => { if (e.target === e.currentTarget || e.target.closest("[data-tutup]")) e.currentTarget.close(); });
  saatBahasa(() => gambar());
})();
