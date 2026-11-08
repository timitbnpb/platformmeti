/* /lelang tab Putaran: grafik jumlah putaran per tahun dan per skema, saringan, tabel berpaginasi + CSV, panel rinci per putaran. */
import { t } from "/i18n.js";
import { esc, ikon, nanti, debounce } from "/inti/umum.js";
import { exHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { pasangPilih } from "/inti/pilih.js";
import { kolomSvg, batangSvg, legendaHtml, tabel, tipHtml } from "/info_hijau.js";
import { D, TAHAP, SKEMA, TEK, baris, num, kosong, tglTeks, kapTeks, pilTahap, pilSkema, pilKat, pilTeknologi, labelTek, orgDaftar, orgHtml, proyekTaut, programTaut, regTaut, sumberSel, cariSumber, luar, ikTahap, ikSkema } from "/lelang_umum.js";

const $ = (id) => document.getElementById(id);
const saring = { tahap: "", skema: "", tek: "", tahun: "", kat: "" };
let akar = null;

const lolos = (p) => (!saring.tahap || p.tahap === saring.tahap) && (!saring.skema || p.skema === saring.skema) && (!saring.tek || p.teknologi === saring.tek) && (!saring.tahun || String(p.tahun) === saring.tahun) && (!saring.kat || p.kategori === saring.kat);
const dipilih = () => baris().filter(lolos);

function opsi() {
  const op = (v, l, ik) => `<option value="${esc(v)}"${ik ? ` data-ikon="${esc(ik)}"` : ""}>${esc(l)}</option>`;
  const tahun = [...new Set(baris().map((p) => p.tahun))].sort((a, b) => b - a);
  const sl = (id, aria, ik, isi) => `<label class="lel-f"><select class="jm-pilih" id="${id}" data-ikon="${ik}" aria-label="${esc(aria)}">${isi}</select></label>`;
  return `<div class="lel-saring">${[
    sl("pt-fTahap", t("lel.fa.tahap"), "status", op("", t("lel.f.tahap"), "status") + TAHAP.map((k) => op(k, t("lel.tahap." + k), ikTahap(k))).join("")),
    sl("pt-fSkema", t("lel.fa.skema"), "jenis", op("", t("lel.f.skema"), "jenis") + SKEMA.map((k) => op(k, t("lel.skema." + k), ikSkema(k))).join("")),
    sl("pt-fTek", t("lel.fa.tek"), "tek:jaringan", op("", t("lel.f.tek"), "tek:jaringan") + TEK.filter((k) => baris().some((p) => p.teknologi === k)).map((k) => op(k, labelTek(k), k === "campuran" ? "tek:jaringan" : "tek:" + k)).join("")),
    sl("pt-fTahun", t("lel.fa.tahun"), "tahun", op("", t("lel.f.tahun"), "tahun") + tahun.map((y) => op(y, y, "tahun")).join("")),
    sl("pt-fKat", t("lel.fa.kat"), "gedung", op("", t("lel.f.kat"), "gedung") + ["pln", "anak_usaha", "pemerintah"].map((k) => op(k, t("lel.kat." + k), "gedung")).join("")),
  ].join("")}</div>`;
}

function rangka() {
  const ex = (o) => exHtml({ ...o, aksiHtml: aksiHtml({ csv: !!o.csv }), tingkat: "h2" });
  const B = baris(), th = B.map((p) => p.tahun), puncak = B.reduce((m, p) => ((m[p.tahun] = (m[p.tahun] || 0) + 1), m), {});
  const [thTop, nTop] = Object.entries(puncak).sort((a, b) => b[1] - a[1])[0] || ["-", 0];
  const ada = SKEMA.filter((k) => B.some((p) => p.skema === k));
  akar.innerHTML = [
    ex({ id: "pt-tahun", ikon: "tahun", topik: t("lel.ey.tahun"), judulHtml: hlHtml("lel.t.tahun", String(nTop), { tahun: thTop }), subHtml: esc(t("lel.s.tahun", { n: B.length, a: Math.min(...th), b: Math.max(...th) })),
      isiHtml: `<div id="pt-lg-tahun"></div><div id="pt-g-tahun" class="ih-bagan"></div><p class="jm-bantu ih-catatan">${esc(t("lel.n.hitung"))}</p>` }),
    ex({ id: "pt-skema", ikon: "jenis", topik: t("lel.ey.skema"), judulHtml: hlHtml("lel.t.skema", String(ada.length)), subHtml: esc(t("lel.s.skema")),
      isiHtml: `${legendaHtml(TAHAP.map((k) => ({ kelas: "lel-s-th-" + k, label: t("lel.tahap." + k) })))}<div id="pt-g-skema" class="ih-bagan"></div>` }),
    ex({ id: "pt-tabel", ikon: "tabel", topik: t("lel.ey.tabel"), judulHtml: hlHtml("lel.t.tabel", String(B.length)), subHtml: esc(t("lel.s.tabel")), csv: true,
      isiHtml: `${opsi()}<div id="pt-rinci" class="lel-rinci" tabindex="-1" hidden></div><div id="pt-tb" class="ih-tabel"></div><p class="jm-bantu ih-catatan">${esc(t("lel.n.tabel"))}</p>` }),
  ].join("");
  pasangPilih();
  for (const [k, id] of [["tahap", "pt-fTahap"], ["skema", "pt-fSkema"], ["tek", "pt-fTek"], ["tahun", "pt-fTahun"], ["kat", "pt-fKat"]]) $(id).value = saring[k];
  pasangPilih();
  $("pt-tabel").addEventListener("jm:csv", csvSemua);
}

/* ---------- grafik ---------- */
function gTahun() {
  const B = baris(), a = Math.min(...B.map((p) => p.tahun)), b = Math.max(...B.map((p) => p.tahun)), kat = [];
  for (let y = a; y <= b; y++) kat.push(y);
  const seri = TEK.filter((k) => B.some((p) => p.teknologi === k));
  $("pt-lg-tahun").innerHTML = legendaHtml(seri.map((k) => ({ kelas: "lel-s-" + k, label: labelTek(k) })));
  $("pt-g-tahun").innerHTML = kolomSvg({ el: $("pt-g-tahun"), satuan: t("lel.tip.putaran"), label: t("lel.ey.tahun"), seri: seri.map((k) => ({ k, kelas: "lel-s-" + k })),
    kategori: kat.map((y) => {
      const L = B.filter((p) => p.tahun === y), v = {};
      for (const p of L) v[p.teknologi] = (v[p.teknologi] || 0) + 1;
      return { label: String(y), nilai: v, tip: `${y}: ${L.length}`,
        th: tipHtml(String(y), [[t("lel.tip.total"), String(L.length)], ...seri.filter((k) => v[k]).map((k) => [labelTek(k), String(v[k])]), [t("lel.tip.pemenang"), String(L.filter((p) => p.pemenang.length).length)]]) };
    }) });
}
function gSkema() {
  const B = baris(), ada = SKEMA.filter((k) => B.some((p) => p.skema === k));
  $("pt-g-skema").innerHTML = batangSvg({ el: $("pt-g-skema"), d: 0, label: t("lel.ey.skema"), satuan: t("lel.tip.putaran"), seri: TAHAP.map((k) => ({ k, kelas: "lel-s-th-" + k })),
    baris: ada.map((s) => {
      const L = B.filter((p) => p.skema === s), per = Object.fromEntries(TAHAP.map((k) => [k, L.filter((p) => p.tahap === k).length]));
      return { label: t("lel.skema." + s), ikon: ikSkema(s), tip: `${t("lel.skema." + s)}: ${L.length}`,
        th: tipHtml(t("lel.skema." + s), [[t("lel.tip.total"), String(L.length)], ...TAHAP.filter((k) => per[k]).map((k) => [t("lel.tahap." + k), String(per[k])])]), bagian: TAHAP.map((k) => ({ k, nilai: per[k] })) };
    }) });
}

/* ---------- tabel ---------- */
const namaSel = (p) => `<div class="lel-nm"><button type="button" class="lel-buka" data-buka="${esc(p.id)}">${esc(p.nama)}</button><span class="lel-mt">${pilKat(p.kategori)}<span>${esc(p.penyelenggara.nama)}</span></span><small>${esc(p.lokasi.teks)}</small></div>`;
function tb() {
  const B = dipilih();
  if (!B.length) { $("pt-tb").innerHTML = `<p class="jm-kosong">${esc(t("lel.kosong"))}</p>`; return; }
  tabel($("pt-tb"), { satuan: "lel.u.putaran", per: 8, urutAwal: 0, menurun: true, kolom: [
    { label: t("lel.c.tgl"), v: (p) => p.tanggal, f: (p) => `<span class="lel-tg">${esc(tglTeks(p.tanggal))}</span>` },
    { label: t("lel.c.putaran"), v: (p) => p.nama, f: namaSel },
    { label: t("lel.c.tek"), v: (p) => p.teknologi, f: (p) => pilTeknologi(p.teknologi) },
    { label: t("lel.c.kap"), num: true, v: (p) => p.kapasitas_mw, f: (p) => (p.kapasitas_mw != null ? `<b>${esc(kapTeks(p))}</b>` : kosong) },
    { label: t("lel.c.skema"), v: (p) => t("lel.skema." + p.skema), f: (p) => pilSkema(p.skema) },
    { label: t("lel.c.tahap"), v: (p) => TAHAP.indexOf(p.tahap), f: (p) => pilTahap(p.tahap) },
    { label: t("lel.c.pemenang"), v: (p) => p.pemenang[0]?.nama || null, f: (p) => `<div class="lel-pml">${orgDaftar(p.pemenang)}</div>` },
    { label: t("lel.c.sumber"), v: (p) => cariSumber(p.sumber_id)?.penerbit || "", f: (p) => sumberSel(p.sumber_id, p.tingkat_bukti) },
  ], baris: B });
}
function csvSemua(e) {
  const K = ["tanggal", "putaran", "penyelenggara", "teknologi", "kapasitas", "satuan", "lokasi", "kode_bps", "skema", "tahap", "pemenang", "peserta_tercatat", "harga_sen_usd_kwh", "tingkat_bukti", "sumber", "url"];
  e.detail.baris = [K, ...dipilih().map((p) => { const s = cariSumber(p.sumber_id); return [p.tanggal, p.nama, p.penyelenggara.nama, p.teknologi, p.kapasitas_mw ?? "", p.kapasitas_satuan, p.lokasi.teks, p.lokasi.kode_bps.join(" "), t("lel.skema." + p.skema), t("lel.tahap." + p.tahap), p.pemenang.map((o) => o.nama).join(" | "), p.peserta_jumlah ?? "", p.harga?.usd_sen_kwh ?? "", p.tingkat_bukti, s?.penerbit || "", s?.url || ""]; })];
}

/* ---------- panel rinci ---------- */
const fakta = (k, isi) => (isi ? `<div><dt>${esc(t(k))}</dt><dd>${isi}</dd></div>` : "");
export function bukaRinci(id) {
  const p = baris().find((x) => x.id === id), el = $("pt-rinci");
  if (!p || !el) return;
  const wil = p.lokasi.kode_bps.map((k) => `<a class="ih-tautan" href="/wilayah/${esc(k)}">${esc(p.lokasi.teks)}</a>`).join(" ") || esc(p.lokasi.teks);
  const harga = p.harga ? `${esc(num(p.harga.usd_sen_kwh, 4))} ${esc(t("lel.u.sen"))} (${esc(t("lel.harga." + p.harga.jenis))}, ${esc(String(p.harga.tahun_harga))})` : "";
  const langkah = p.riwayat.map((r) => `<li class="lel-lk lel-th-${esc(r.tahap)}"><span class="lel-lk-ik">${ikon(ikTahap(r.tahap), 16)}</span><div><b>${esc(t("lel.tahap." + r.tahap))}</b> <span class="lel-tg">${esc(tglTeks(r.tanggal, r.presisi))}</span>${r.tentatif ? ` <span class="jm-pil lel-target">${esc(t("lel.target"))}</span>` : ""}<p>${esc(r.catatan || "")}</p>${r.sumber_id ? `<small>${luar(cariSumber(r.sumber_id)?.url, cariSumber(r.sumber_id)?.penerbit || r.sumber_id)}</small>` : ""}</div></li>`).join("");
  const pes = p.peserta_jumlah != null ? `${esc(t("lel.peserta_n", { n: num(p.peserta_jumlah) }))}${p.peserta.length ? `<div class="lel-pml">${p.peserta.map(orgHtml).join("")}</div>` : ""}` : p.peserta.length ? `<div class="lel-pml">${p.peserta.map(orgHtml).join("")}</div>` : "";
  const paket = p.paket?.length ? `<ul class="lel-paket">${p.paket.map((x) => `<li><span>${esc(x.wilayah)}</span><b>${esc(num(x.mw))} MW</b></li>`).join("")}</ul>` : "";
  el.innerHTML = `<div class="lel-rinci-hd"><div><p class="jm-ex-ey">${ikon("lelang", 14)}${esc(t("lel.rinci"))}</p><h3>${esc(p.nama)}</h3><div class="lel-pil-baris">${pilTahap(p.tahap)}${pilSkema(p.skema)}${pilTeknologi(p.teknologi)}${pilKat(p.kategori)}</div></div><button type="button" class="jm-tbl" data-tutup="1" aria-label="${esc(t("lel.tutup"))}">${ikon("silang", 18)}<span>${esc(t("lel.tutup"))}</span></button></div>`
    + `<dl class="lel-fakta">${fakta("lel.r.penyelenggara", orgHtml(p.penyelenggara))}${fakta("lel.r.lokasi", wil)}${fakta("lel.r.kap", p.kapasitas_mw != null ? esc(kapTeks(p)) : "")}${fakta("lel.r.harga", harga)}${fakta("lel.r.investasi", p.investasi_usd_juta != null ? esc(t("lel.usd_juta", { n: num(p.investasi_usd_juta, 1) })) : "")}${fakta("lel.r.peserta", pes)}${fakta("lel.r.pemenang", p.pemenang.length ? `<div class="lel-pml">${p.pemenang.map(orgHtml).join("")}</div>` : "")}${fakta("lel.r.paket", paket)}${fakta("lel.r.proyek", proyekTaut(p.proyek_id))}${fakta("lel.r.program", programTaut(p.program_id))}${fakta("lel.r.regulasi", regTaut(p.regulasi_id))}</dl>`
    + `<h4>${esc(t("lel.r.riwayat"))}</h4><ol class="lel-langkah">${langkah}</ol>${p.catatan ? `<p class="jm-bantu">${esc(p.catatan)}</p>` : ""}<p class="lel-sm">${sumberSel(p.sumber_id, p.tingkat_bukti)}</p>`;
  el.hidden = false;
  el.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion:reduce)").matches ? "auto" : "smooth" });
  el.focus({ preventScroll: true });
}

export async function mulai(panel) {
  akar = panel;
  const gambar = () => { rangka(); gTahun(); gSkema(); tb(); };
  gambar();
  panel.addEventListener("click", (e) => {
    const b = e.target.closest("[data-buka]");
    if (b) { bukaRinci(b.dataset.buka); return; }
    if (e.target.closest("[data-tutup]")) { $("pt-rinci").hidden = true; document.querySelector(`[data-buka="${CSS.escape(panel.dataset.terakhir || "")}"]`)?.focus(); }
  });
  panel.addEventListener("click", (e) => { const b = e.target.closest("[data-buka]"); if (b) panel.dataset.terakhir = b.dataset.buka; }, true);
  panel.addEventListener("change", (e) => {
    const m = { "pt-fTahap": "tahap", "pt-fSkema": "skema", "pt-fTek": "tek", "pt-fTahun": "tahun", "pt-fKat": "kat" }[e.target.id]; if (!m) return;
    saring[m] = e.target.value; nanti(tb);
  });
  let w = innerWidth;
  addEventListener("resize", debounce(() => { if (panel.hidden || Math.abs(innerWidth - w) <= 20) return; w = innerWidth; gTahun(); gSkema(); }, 200));
}
