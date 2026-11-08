/* /rantai-global, tab Harga: benchmark harga dunia vs Indonesia, selisih, tren harga komponen dan bahan baku.
   Sumber: benchmark_harga.json, harga_komponen.json, bahan_baku.json. Angka turunan (selisih, indeks) berlabel EST. INP: pilihan produk/deret seketika, grafik menyusul lewat nanti(). */
import { D, berisi, ex, t, esc, ikon, num, bukti, luar, cariSumber, kosongTab, urlGet, urlSet, sumberBerkas, catatan, daftarCelah, bendera, lbl } from "/rg3_umum.js";
import { nanti } from "/inti/umum.js";
import { pilihHtml } from "/inti/komponen.js";
import { pasangPilih } from "/inti/pilih.js";
import { uangHtml } from "/inti/uang.js";
import { selisihPct } from "/rantai_global_hitung.js";
import { batangSvg, garisSvg, legendaHtml, tabel, tipHtml, pilUbah } from "/info_hijau.js";

let pid = "", deret = "";
const H = () => D.harga, produk = () => (H()?.produk || []).filter((p) => (p.dunia || []).length);
const kurs = () => H()?.kurs?.find((k) => k.idr)?.idr || null;
const sumberRow = (r) => cariSumber(H(), r.sumber_id);
const buktiRow = (r) => { const s = sumberRow(r); return bukti(r.tingkat_bukti, { tingkatSumber: s?.tingkat_bukti, sumber: s?.penerbit || "", tanggal: r.tanggal, cara: r.basis || "" }); };
const rp = (usd, satuan) => (kurs() && /Wp?$|\/W$/.test(satuan) ? uangHtml("Rp", num(usd * kurs(), 0) + "/" + satuan.split("/")[1]) : "");

function pilihProduk() {
  const p = produk().find((x) => x.id === pid) || produk()[0]; pid = p.id; return p;
}
function barisHarga(p) {
  return [...p.dunia.map((r) => ({ ...r, grup: "dunia" })), ...(p.indonesia || []).map((r) => ({ ...r, grup: "id" }))];
}
function bagan(p) {
  const el = document.getElementById("rg3-h-g"), B = barisHarga(p).filter((r) => r.usd != null).sort((a, b) => b.usd - a.usd);
  document.getElementById("rg3-h-leg").innerHTML = legendaHtml([{ kelas: "rg3-s-dunia", label: t("rg3.h.dunia") }, ...(p.indonesia?.length ? [{ kelas: "rg3-s-id", label: t("rg3.h.indonesia") }] : [])]);
  const d = B.some((r) => r.usd < 10) ? (B.some((r) => r.usd < 1) ? 3 : 2) : 0;
  el.innerHTML = batangSvg({ el, d, label: p.nama, satuan: p.satuan, seri: [{ k: "dunia", kelas: "rg3-s-dunia" }, { k: "id", kelas: "rg3-s-id" }],
    baris: B.map((r) => ({ label: r.pasar, bendera: r.grup === "id" ? "id" : "", ikon: r.grup === "id" ? "" : "globe", tip: `${r.pasar}: ${r.usd} ${p.satuan}`,
      th: tipHtml(r.pasar, [[t("rg3.h.harga"), `${num(r.usd, d)} ${p.satuan}`], ...(r.mata_uang !== "USD" ? [[t("rg3.h.asli"), `${num(r.harga, 3)} ${r.mata_uang}`]] : []), [t("rg3.h.tanggal"), r.tanggal || "-"], [t("rg3.h.kelompok"), t(r.grup === "id" ? "rg3.h.indonesia" : "rg3.h.dunia")]], { img: r.grup === "id" ? "/img/bendera/id.svg" : "" }),
      bagian: [{ k: r.grup, nilai: r.usd }] })) });
}
function tabelHarga(p) {
  tabel(document.getElementById("rg3-h-tb"), { satuan: "rg3.h.u", per: 8, urutAwal: 2, menurun: false, kolom: [
    { label: t("rg3.h.pasar"), v: (r) => r.pasar, f: (r) => `<span class="rg3-idk"><b>${r.grup === "id" ? bendera("id", 16) : ikon("globe", 16)} ${esc(r.pasar)}</b><small>${esc(r.basis || "")}</small></span>` },
    { label: t("rg3.h.kelompok"), v: (r) => r.grup, f: (r) => `<span class="rg3-chip rg3-g-${r.grup}">${esc(t(r.grup === "id" ? "rg3.h.indonesia" : "rg3.h.dunia"))}</span>` },
    { label: `${t("rg3.h.harga")} (${p.satuan})`, num: true, v: (r) => r.usd, f: (r) => (r.usd == null ? "-" : `<b>${esc(num(r.usd, r.usd < 1 ? 3 : r.usd < 10 ? 2 : 0))}</b>`) },
    { label: t("rg3.h.rupiah"), num: true, v: (r) => (r.usd != null && kurs() ? r.usd * kurs() : null), f: (r) => (r.usd != null ? rp(r.usd, p.satuan) || "-" : "-") },
    { label: t("rg3.h.tanggal"), v: (r) => r.tanggal || "", f: (r) => `<span class="rg3-tg">${esc(r.tanggal || "-")}</span>` },
    { label: t("rg3.h.bukti"), v: (r) => r.tingkat_bukti || "", f: (r) => `<span class="rg3-sm">${buktiRow(r)}${sumberRow(r)?.url ? luar(sumberRow(r).url, sumberRow(r).penerbit) : ""}</span>` },
  ], baris: barisHarga(p) });
}
function selisihKartu(p) {
  const id = (p.indonesia || []).map((r) => r.usd).filter((x) => x != null), dn = p.dunia.map((r) => r.usd).filter((x) => x != null);
  const el = document.getElementById("rg3-h-sel");
  if (!id.length) { el.innerHTML = `<div class="rg3-info">${ikon("tanya", 18)}<p>${esc(p.alasan_indonesia_kosong || t("rg3.h.tanpa_id"))}</p></div>`; return; }
  const ref = dn[0], lo = selisihPct(Math.min(...id), ref), hi = selisihPct(Math.max(...id), ref);
  el.innerHTML = `<div class="rg3-info rg3-info-ok">${ikon("banding", 18)}<p>${esc(t("rg3.h.sel_teks", { a: num(lo, 0), b: num(hi, 0) }))} ${pilUbah(p.selisih_persen ?? hi)} ${bukti("est", { cara: t("rg3.h.sel_cara") })}</p></div>`;
}
function ringkasanID() {
  const L = (H().produk || []).filter((p) => (p.indonesia || []).length && (p.dunia || []).length);
  if (!L.length) return `<p class="jm-kosong">${esc(t("rg3.h.tanpa_id"))}</p>`;
  return `<div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr><th>${esc(t("rg3.h.produk"))}</th><th class="jm-num">${esc(t("rg3.h.dunia"))}</th><th class="jm-num">${esc(t("rg3.h.indonesia"))}</th><th class="jm-num">${esc(t("rg3.h.selisih"))}</th><th>${esc(t("rg3.h.bukti"))}</th></tr></thead><tbody>${L.map((p) => {
    const id = p.indonesia.map((r) => r.usd), a = Math.min(...id), b = Math.max(...id), s = selisihPct(b, p.dunia[0].usd);
    return `<tr><td data-label="${esc(t("rg3.h.produk"))}"><span class="rg3-idk"><b>${esc(p.nama)}</b><small>${esc(p.satuan)}</small></span></td><td data-label="${esc(t("rg3.h.dunia"))}" class="jm-num">${esc(num(p.dunia[0].usd, 0))}</td><td data-label="${esc(t("rg3.h.indonesia"))}" class="jm-num">${esc(a === b ? num(a, 0) : num(a, 0) + " - " + num(b, 0))}</td><td data-label="${esc(t("rg3.h.selisih"))}" class="jm-num">${pilUbah(s)}</td><td data-label="${esc(t("rg3.h.bukti"))}">${bukti("est", { cara: t("rg3.h.sel_cara") })}</td></tr>`;
  }).join("")}</tbody></table></div>`;
}

/* ---------- tren ---------- */
const DERET = () => (D.hargaKomp?.deret || []).filter((d) => (d.titik || []).length >= 5);
function trenKomp() {
  const d = DERET().find((x) => x.id === deret) || DERET()[0]; if (!d) return;
  deret = d.id;
  const el = document.getElementById("rg3-h-gt"), titik = d.titik.map((p) => ({ x: p.x, y: p.y })), log = Math.max(...titik.map((p) => p.y)) / Math.min(...titik.filter((p) => p.y > 0).map((p) => p.y)) > 20;
  const s = cariSumber(D.hargaKomp, d.titik.at(-1)?.sumber_id);
  document.getElementById("rg3-h-gt-b").innerHTML = bukti(d.titik.at(-1)?.tingkat_bukti, { tingkatSumber: s?.tingkat_bukti, sumber: s?.penerbit || "", tanggal: d.titik.at(-1)?.tanggal, cara: d.basis || "" });
  el.innerHTML = garisSvg({ el, skalaLog: log, satuan: d.satuan, label: d.id, anot: [titik[0].x, titik.at(-1).x], seri: [{ id: d.id, kelas: "rg3-g-0", label: lbl("rg3.h.d.", d.id), titik }], ringkas: (x, y, p) => (p ? `${num(((y - p.y) / p.y) * 100, 0)}%` : "") });
}
function trenBahan() {
  const L = D.bahan?.deret || [], el = document.getElementById("rg3-h-gb"); if (!el || !L.length) return;
  const seri = L.map((d, i) => { const dasar = d.titik[0]?.y; return { id: d.id, kelas: "rg3-g-" + (i % 8), label: lbl("rg3.bb.", d.id), titik: d.titik.map((p) => ({ x: p.x, y: (p.y / dasar) * 100 })) }; });
  document.getElementById("rg3-h-gb-l").innerHTML = legendaHtml(seri.map((s) => ({ id: s.id, kelas: s.kelas, label: s.label })));
  el.innerHTML = garisSvg({ el, satuan: t("rg3.h.indeks"), label: t("rg3.h.ey.bahan"), xTick: [...new Set(seri.flatMap((s) => s.titik.map((p) => p.x)))].sort(), seri });
}
function perak() {
  const s = D.bahan?.sensitivitas?.perak_ke_modul; if (!s?.per_tahun?.length) return "";
  return `<h3 class="rg3-sub">${esc(t("rg3.h.perak"))}</h3><p class="rg3-info rg3-info-ok">${ikon("info", 18)}<span>${esc(t("rg3.h.perak_teks", { p: num(s.porsi_dari_harga_modul_2025_persen, 1), mg: num(s.konsumsi_mg_per_w, 0) }))} ${bukti(s.tingkat_bukti, { cara: s.rumus, tanggal: s.tanggal })}</span></p>`;
}

export function mulai(el) {
  if (!berisi("harga", "produk") || !produk().length) { el.innerHTML = kosongTab("rg3.h.kosong_data"); return; }
  pid = urlGet("hp"); deret = urlGet("hd"); pilihProduk();
  const nID = (H().produk || []).filter((p) => (p.indonesia || []).length).length;
  const opsiP = produk().map((p) => [p.id, p.nama, (p.indonesia || []).length ? "banding" : "tag", (p.dunia || []).length]), opsiD = DERET().map((d) => [d.id, lbl("rg3.h.d.", d.id), "grafik"]);
  el.innerHTML = [
    ex({ id: "rg3-h-bench", ikon: "tag", topik: t("rg3.h.ey.bench"), judulHtml: esc(t("rg3.h.j.bench", { n: num(produk().length), m: num(nID) })), subHtml: esc(t("rg3.h.s.bench", { tgl: H().kurs?.find((k) => k.idr)?.tanggal || "-" })),
      isiHtml: `<div class="jm-saring rg3-saring rg3-saring-1">${pilihHtml({ id: "rg3-h-p", ikon: "tag", label: t("rg3.h.f.produk"), opsi: opsiP, nilai: pid })}</div><div id="rg3-h-sel"></div><div id="rg3-h-leg"></div><div id="rg3-h-g" class="ih-bagan"></div><div id="rg3-h-tb"></div>${catatan("rg3.h.n.bench", { kurs: kurs() ? num(kurs()) : "-" })}`, kakiHtml: sumberBerkas(H()) }),
    ex({ id: "rg3-h-id", ikon: "banding", topik: t("rg3.h.ey.id"), judulHtml: esc(t("rg3.h.j.id")), subHtml: esc(t("rg3.h.s.id")), isiHtml: ringkasanID() + catatan("rg3.h.n.id") }),
    D.hargaKomp && opsiD.length ? ex({ id: "rg3-h-tren", ikon: "grafik", topik: t("rg3.h.ey.tren"), judulHtml: esc(t("rg3.h.j.tren")), subHtml: esc(t("rg3.h.s.tren")),
      isiHtml: `<div class="jm-saring rg3-saring rg3-saring-1">${pilihHtml({ id: "rg3-h-d", ikon: "grafik", label: t("rg3.h.f.deret"), opsi: opsiD, nilai: deret })}<span id="rg3-h-gt-b"></span></div><div id="rg3-h-gt" class="ih-bagan"></div>`, kakiHtml: sumberBerkas(D.hargaKomp) }) : "",
    berisi("bahan", "deret") ? ex({ id: "rg3-h-bahan", ikon: "industri", topik: t("rg3.h.ey.bahan"), judulHtml: esc(t("rg3.h.j.bahan")), subHtml: esc(t("rg3.h.s.bahan")),
      isiHtml: `<div id="rg3-h-gb-l"></div><div id="rg3-h-gb" class="ih-bagan"></div>${perak()}${catatan("rg3.h.n.bahan")}${daftarCelah(D.bahan.meta?.celah)}`, kakiHtml: sumberBerkas(D.bahan) }) : "",
  ].join("");
  pasangPilih();
  const gambar = () => { const p = pilihProduk(); selisihKartu(p); bagan(p); tabelHarga(p); };
  gambar(); nanti(() => { trenKomp(); trenBahan(); });
  el.querySelector("#rg3-h-p").addEventListener("change", (e) => { pid = e.target.value; urlSet({ hp: pid }); nanti(gambar); });
  el.querySelector("#rg3-h-d")?.addEventListener("change", (e) => { deret = e.target.value; urlSet({ hd: deret }); nanti(trenKomp); });
}
