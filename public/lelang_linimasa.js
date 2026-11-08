/* /lelang tab Linimasa: peristiwa kebijakan dan tahap putaran per tahun. Grafik kolom per tahun + daftar bergulir per tahun terpilih. */
import { t } from "/i18n.js";
import { esc, ikon, nanti, debounce } from "/inti/umum.js";
import { exHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { pasangPilih } from "/inti/pilih.js";
import { kolomSvg, legendaHtml, tipHtml } from "/info_hijau.js";
import { D, baris, tglTeks, ikTahap, cariSumber, luar, regTaut, pilTahap } from "/lelang_umum.js";
import { tahunDari } from "/lelang_hitung.js";

const $ = (id) => document.getElementById(id);
const JENIS = ["kebijakan", "tahap", "target"];
let tahunPilih = "";

function kumpul() {
  const out = [];
  for (const e of D.lel.peristiwa) if (e.tanggal) out.push({ jenis: "kebijakan", tanggal: e.tanggal, presisi: e.presisi, judul: e.judul, teks: e.teks, sumber_id: e.sumber_id, regulasi_id: e.regulasi_id, ikon: "regulasi" });
  for (const p of baris()) for (const r of p.riwayat) out.push({ jenis: r.tentatif ? "target" : "tahap", tanggal: r.tanggal, presisi: r.presisi, judul: p.nama, teks: r.catatan, tahap: r.tahap, sumber_id: r.sumber_id || p.sumber_id, putaran: p.id, ikon: ikTahap(r.tahap) });
  return out.sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)) || a.judul.localeCompare(b.judul, "id"));
}
let E = [];

function grafik() {
  const th = E.map((x) => tahunDari(x.tanggal)), a = Math.min(...th), b = Math.max(...th), kat = [];
  for (let y = a; y <= b; y++) kat.push(y);
  $("ln-lg").innerHTML = legendaHtml(JENIS.map((k) => ({ kelas: "lel-s-ln-" + k, label: t("lel.ln." + k) })));
  $("ln-g").innerHTML = kolomSvg({ el: $("ln-g"), satuan: t("lel.tip.peristiwa"), label: t("lel.ey.linimasa"), seri: JENIS.map((k) => ({ k, kelas: "lel-s-ln-" + k })),
    kategori: kat.map((y) => {
      const L = E.filter((x) => tahunDari(x.tanggal) === y), v = Object.fromEntries(JENIS.map((k) => [k, L.filter((x) => x.jenis === k).length]));
      return { label: String(y), nilai: v, tip: `${y}: ${L.length}`, th: tipHtml(String(y), [[t("lel.tip.total"), String(L.length)], ...JENIS.filter((k) => v[k]).map((k) => [t("lel.ln." + k), String(v[k])])]) };
    }) });
}
function daftar() {
  const L = E.filter((x) => String(tahunDari(x.tanggal)) === tahunPilih);
  $("ln-daftar").innerHTML = L.length ? `<ol class="lel-ln">${L.map((x) => `<li class="lel-ln-i lel-ln-${esc(x.jenis)}"><span class="lel-ln-ik">${ikon(x.ikon, 18)}</span><div class="lel-ln-isi"><div class="lel-ln-hd"><span class="lel-tg">${esc(tglTeks(x.tanggal, x.presisi))}</span><span class="jm-pil lel-ln-pil-${esc(x.jenis)}">${esc(t("lel.ln." + x.jenis))}</span>${x.tahap ? pilTahap(x.tahap) : ""}</div><h3>${esc(x.judul)}</h3><p>${esc(x.teks || "")}</p><p class="lel-ln-ft">${x.putaran ? `<button type="button" class="lel-buka" data-ke="${esc(x.putaran)}">${esc(t("lel.lihat_putaran"))}</button>` : ""}${x.regulasi_id ? regTaut([x.regulasi_id]) : ""}${cariSumber(x.sumber_id) ? luar(cariSumber(x.sumber_id).url, cariSumber(x.sumber_id).penerbit) : ""}</p></div></li>`).join("")}</ol>` : `<p class="jm-kosong">${esc(t("lel.kosong"))}</p>`;
}

export async function mulai(panel) {
  E = kumpul();
  const tahun = [...new Set(E.map((x) => tahunDari(x.tanggal)))].sort((a, b) => b - a);
  tahunPilih = String(tahun[0]);
  const ex = (o) => exHtml({ ...o, aksiHtml: aksiHtml({ csv: false }), tingkat: "h2" });
  const kebijakan = E.filter((x) => x.jenis === "kebijakan").length;
  panel.innerHTML = [
    ex({ id: "ln-grafik", ikon: "tahun", topik: t("lel.ey.linimasa"), judulHtml: hlHtml("lel.t.linimasa", String(E.length), { k: kebijakan }), subHtml: esc(t("lel.s.linimasa")),
      isiHtml: `<div id="ln-lg"></div><div id="ln-g" class="ih-bagan"></div>` }),
    ex({ id: "ln-rinci", ikon: "linimasa", topik: t("lel.ey.rinci_tahun"), judulHtml: esc(t("lel.t.rinci_tahun")), subHtml: esc(t("lel.s.rinci_tahun")),
      isiHtml: `<div class="lel-saring lel-saring-1"><label class="lel-f"><select class="jm-pilih" id="ln-tahun" data-ikon="tahun" aria-label="${esc(t("lel.fa.tahun"))}">${tahun.map((y) => `<option value="${y}" data-ikon="tahun">${y}</option>`).join("")}</select></label></div><div id="ln-daftar"></div>` }),
  ].join("");
  pasangPilih(); $("ln-tahun").value = tahunPilih; pasangPilih();
  grafik(); daftar();
  panel.addEventListener("change", (e) => { if (e.target.id === "ln-tahun") { tahunPilih = e.target.value; nanti(daftar); } });
  panel.addEventListener("click", (e) => { const b = e.target.closest("[data-ke]"); if (b) dispatchEvent(new CustomEvent("lel:buka", { detail: b.dataset.ke })); });
  let w = innerWidth;
  addEventListener("resize", debounce(() => { if (panel.hidden || Math.abs(innerWidth - w) <= 20) return; w = innerWidth; grafik(); }, 200));
}
