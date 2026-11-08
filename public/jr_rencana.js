/* /jaringan, tab Rencana transmisi: RUPTL 2025-2034 skenario RE Base. Kms dan MVA per wilayah per tahun per tegangan, pangsa wilayah, ruas utama.
   Sumber: jaringan_modul.json (rencana, diurai dari tabel 5.187-5.209 RUPTL). INP: pilihan wilayah/ukuran seketika, grafik menyusul lewat nanti(). */
import { D, ex, t, esc, ikon, num, bukti, L, buktiSumber, catatan, kosongTab, urlGet, urlSet, sumberBerkas, chip, sumberLink } from "/jr_umum.js";
import { wilayahRencana, nasional, puncak, tumpukTegangan, pangsaWilayah, kumulatif } from "/jaringan_hitung.js";
import { nanti } from "/inti/umum.js";
import { pilihHtml } from "/inti/komponen.js";
import { pasangPilih } from "/inti/pilih.js";
import { kolomSvg, batangSvg, legendaHtml, tabel, tipHtml } from "/info_hijau.js";

let wil = "indonesia", uk = "kms";
const S = () => D.m.rencana.sistem, cari = (id) => S().find((s) => s.id === id) || S()[0];
const satuan = () => (uk === "kms" ? "kms" : "MVA");
const namaW = (s) => L(s.nama);

function grafikTahun() {
  const s = cari(wil), { kunci, kategori } = tumpukTegangan(s, uk, D.m.rencana.tahun), el = document.getElementById("jr-r-g");
  document.getElementById("jr-r-l").innerHTML = legendaHtml(kunci.map((k, i) => ({ kelas: "jr-s-p" + (i % 8), label: k + (uk === "kms" ? " kV" : " kV"), })));
  el.innerHTML = kolomSvg({ el, satuan: satuan(), label: namaW(s), seri: kunci.map((k, i) => ({ k, kelas: "jr-s-p" + (i % 8) })),
    kategori: kategori.map((c) => ({ label: String(c.tahun), nilai: c.nilai, tip: String(c.tahun),
      th: tipHtml(String(c.tahun), [...kunci.filter((k) => c.nilai[k] > 0).map((k) => [k + " kV", `${num(c.nilai[k], c.nilai[k] % 1 ? 1 : 0)} ${satuan()}`]), [t("jr.r.total"), `${num(Object.values(c.nilai).reduce((a, b) => a + b, 0), 0)} ${satuan()}`]]) })) });
  const tot = s[uk].total, p = puncak(tot.tahun, D.m.rencana.tahun), kum = kumulatif(tot.tahun);
  document.getElementById("jr-r-k").innerHTML = `<div class="rg3-info rg3-info-ok">${ikon("info", 18)}<p>${esc(t("jr.r.ringkas", { w: namaW(s), n: num(tot.jumlah, 0), u: satuan(), th: p.tahun, p: num(p.nilai, 0), a: num(kum[4], 0) }))} ${bukti("resmi", { sumber: "RUPTL 2025-2034", cara: `Tabel ${s.tabel[uk]}` })}</p></div>`;
}
function tabelTegangan() {
  const s = cari(wil), T = D.m.rencana.tahun;
  tabel(document.getElementById("jr-r-tb"), { satuan: "jr.r.u", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("jr.r.tegangan"), v: (r) => r.k, f: (r) => `<b>${esc(r.k)} kV</b>` },
    ...T.map((th, i) => ({ label: String(th), num: true, v: (r) => r.tahun[i], f: (r) => (r.tahun[i] ? esc(num(r.tahun[i], r.tahun[i] % 1 ? 1 : 0)) : "-") })),
    { label: t("jr.r.total"), num: true, v: (r) => r.jumlah, f: (r) => `<b>${esc(num(r.jumlah, r.jumlah % 1 ? 1 : 0))}</b>` },
  ], baris: Object.entries(s[uk].tegangan).map(([k, v]) => ({ k, ...v })) });
}
function pangsa() {
  const el = document.getElementById("jr-r-pw"), data = pangsaWilayah(D.m, uk);
  el.innerHTML = batangSvg({ el, d: 0, label: t("jr.r.pangsa"), satuan: satuan(), seri: [{ k: "n", kelas: "jr-s-p0" }],
    baris: data.map((x) => { const s = cari(x.id); return { label: namaW(s), ikon: "peta", kelasIkon: "jr-s-p0", tip: `${namaW(s)}: ${num(x.nilai)}`, th: tipHtml(namaW(s), [[t("jr.r.total"), `${num(x.nilai, 0)} ${satuan()}`], [t("jr.r.pangsa"), `${num(x.persen, 1)}%`]]), bagian: [{ k: "n", nilai: x.nilai }] }; }) });
}
function ruas() {
  return `<ul class="jr-ruas">${D.m.rencana.ruas.map((r) => `<li class="jr-kartu">
    <div class="jr-kartu-kep"><span class="jr-ik jr-ik-w${r.kv >= 500 ? "500" : r.kv >= 275 ? "275" : "150"}">${ikon(r.ikon, 20)}</span><div><h3>${esc(L(r.nama))}</h3><p>${chip("rg3-w" + (r.kv >= 500 ? 0 : r.kv >= 275 ? 3 : 1), "", r.kv + " kV")} <span class="rg3-lain">${esc(num(r.kms))} kms</span> <span class="rg3-lain">${esc(t("jr.cod"))} ${esc(r.cod)}</span></p></div></div>
    <p class="jr-kartu-t">${esc(L(r.ket))}</p><p class="jr-kartu-b">${buktiSumber("resmi", D.m.rencana.sumber_id, { cara: "Tabel " + r.tabel })}<a class="rg3-tautan" href="/jaringan?tab=peta">${esc(t("jr.lihat_peta"))}</a></p></li>`).join("")}</ul>`;
}

export function mulai(el) {
  if (!D.m?.rencana?.sistem?.length) { el.innerHTML = kosongTab("jr.kosong_data"); return; }
  wil = S().some((s) => s.id === urlGet("rw")) ? urlGet("rw") : "indonesia"; uk = urlGet("ru") === "mva" ? "mva" : "kms";
  const n = nasional(D.m), hv = (n.kms.tegangan["500 DC"]?.jumlah || 0);
  const ub = [[t("jr.r.u_kms"), `${num(n.kms.total.jumlah)} kms`], [t("jr.r.u_mva"), `${num(n.mva.total.jumlah)} MVA`], [t("jr.r.u_hvdc"), `${num(hv)} kms`], [t("jr.r.u_wil"), num(wilayahRencana(D.m).length)]];
  el.innerHTML = [
    `<ul class="rg3-ubin">${ub.map(([l, v]) => `<li class="rg3-ub"><b>${esc(v)}</b><small>${esc(l)}</small></li>`).join("")}</ul>`,
    ex({ id: "jr-r-tahun", ikon: "kalender", topik: t("jr.r.ey.tahun"), judulHtml: esc(t("jr.r.j.tahun", { kms: num(n.kms.total.jumlah) })), subHtml: esc(t("jr.r.s.tahun")),
      isiHtml: `<div class="jm-saring rg3-saring rg3-saring-2">${pilihHtml({ id: "jr-r-w", ikon: "peta", label: t("jr.r.f.wilayah"), opsi: S().map((s) => [s.id, namaW(s), "peta"]), nilai: wil })}${pilihHtml({ id: "jr-r-u", ikon: "jenis", label: t("jr.r.f.ukuran"), opsi: [["kms", t("jr.r.kms"), "menara"], ["mva", t("jr.r.mva"), "petir"]], nilai: uk })}</div><div id="jr-r-k"></div><div id="jr-r-l"></div><div id="jr-r-g" class="ih-bagan"></div>${catatan("jr.r.n.tahun")}`, kakiHtml: sumberBerkas(D.m) }),
    ex({ id: "jr-r-tabel", ikon: "tabel", topik: t("jr.r.ey.tabel"), judulHtml: esc(t("jr.r.j.tabel")), subHtml: esc(t("jr.r.s.tabel")), isiHtml: `<div id="jr-r-tb"></div>` }),
    ex({ id: "jr-r-pangsa", ikon: "wilayah", topik: t("jr.r.ey.pangsa"), judulHtml: esc(t("jr.r.j.pangsa")), subHtml: esc(t("jr.r.s.pangsa")), isiHtml: `<div id="jr-r-pw" class="ih-bagan"></div>${catatan("jr.r.n.pangsa")}` }),
    ex({ id: "jr-r-ruas", ikon: "menara", topik: t("jr.r.ey.ruas"), judulHtml: esc(t("jr.r.j.ruas", { n: num(D.m.rencana.ruas.length) })), subHtml: esc(t("jr.r.s.ruas")), isiHtml: `${ruas()}<p class="jm-bantu ih-catatan">${sumberLink("ruptl-2025")}</p>` }),
  ].join("");
  pasangPilih();
  grafikTahun(); tabelTegangan(); nanti(pangsa);
  const ubah = () => { grafikTahun(); tabelTegangan(); nanti(pangsa); };
  el.querySelector("#jr-r-w")?.addEventListener("change", (e) => { wil = e.target.value; urlSet({ rw: wil === "indonesia" ? "" : wil }); nanti(ubah); });
  el.querySelector("#jr-r-u")?.addEventListener("change", (e) => { uk = e.target.value; urlSet({ ru: uk === "kms" ? "" : uk }); nanti(ubah); });
}
