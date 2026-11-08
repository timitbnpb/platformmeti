/* /hidrogen, tab Ekspor dan koridor: permintaan Jepang dan Korea Selatan (bendera), instrumen pasar, nota kesepahaman, koridor dan pelabuhan yang disebut sumber. */
import { H, t, ex, num, esc, ikon, tx, buktiS, kakiSumber, tabel, kolomSvg, tipHtml, siapTautan, naikkan, daftarCelah, catatan, orgDaftar, bendera, namaNegara, tanggal } from "/h2_umum.js";

function targetJepang() {
  const g = document.getElementById("h2-x-g"); if (!g) return;
  const J = H.h2.ekspor.negara.find((n) => n.iso2 === "jp");
  g.innerHTML = kolomSvg({ el: g, satuan: t("h2.u.juta_t"), label: t("h2.x.j.g"), seri: [{ k: "n", kelas: "h2-s-rentang" }],
    kategori: J.target_mt.map((x) => ({ label: String(x.tahun), nilai: { n: x.mt }, tip: String(x.tahun), th: tipHtml(String(x.tahun), [[t("h2.x.pasokan"), `${num(x.mt, 0)} ${t("h2.u.juta_t")}`], [t("h2.c.bukti"), x.ket ? t("h2.x.sekarang") : t("h2.x.target")]]) })) });
}
function tabelNota() {
  const el = document.getElementById("h2-x-tab"); if (!el) return;
  tabel(el, { satuan: "h2.u.nota", per: 4, urutAwal: 0, menurun: true, kolom: [
    { label: t("h2.c.tanggal"), v: (n) => n.tgl, f: (n) => esc(n.tgl.length === 7 ? tanggal(n.tgl + "-01").replace(/^1 /, "") : tanggal(n.tgl)) },
    { label: t("h2.c.negara"), v: (n) => n.iso2, f: (n) => `<span class="rg3-neg">${bendera(n.iso2, 18)}<span>${esc(namaNegara(n.iso2))}</span></span>` },
    { label: t("h2.c.pihak"), v: (n) => n.org.length, f: (n) => orgDaftar(n.org) },
    { label: t("h2.c.uraian"), v: (n) => tx(n.teks), f: (n) => `<span class="rg3-teks">${esc(tx(n.teks))}</span>` },
    { label: t("h2.c.bukti"), v: (n) => n.tingkat_bukti, f: (n) => buktiS(n.sumber_id, n.tingkat_bukti) },
  ], baris: H.h2.ekspor.nota });
  siapTautan("org").then(() => naikkan(el));
}
export function mulai(el) {
  const X = H.h2.ekspor;
  const negara = X.negara.map((n) => `<div class="rg3-kartu h2-kartu"><div class="h2-kartu-kep">${bendera(n.iso2, 28)}<h3 class="jm-h3">${esc(tx(n.nama))}</h3></div><p>${esc(tx(n.instrumen))}</p>${n.target_mt.length ? `<p class="jm-bantu">${esc(t("h2.x.target_jp"))}</p>` : `<p class="jm-bantu">${esc(t("h2.x.target_kr"))}</p>`}${buktiS(n.sumber_ids[0], n.tingkat_bukti)}${kakiSumber(n.sumber_ids)}</div>`).join("");
  const koridor = X.koridor.map((k) => `<div class="rg3-kartu h2-kartu"><div class="h2-kartu-kep">${ikon(k.id === "patimban" ? "kapal" : "kompas", 22)}<h3 class="jm-h3">${esc(tx(k.nama))}</h3></div><p>${esc(tx(k.ket))}</p>${buktiS(k.sumber_id, k.tingkat_bukti)}</div>`).join("");
  el.innerHTML = [
    ex({ id: "h2-x-n", ikon: "globe", topik: t("h2.x.ey.n"), judulHtml: esc(t("h2.x.j.n")), subHtml: esc(t("h2.x.s.n")), isiHtml: `<div class="rg3-kisi">${negara}</div>${catatan("h2.x.n.n")}` }),
    ex({ id: "h2-x-gx", ikon: "grafik", topik: t("h2.x.ey.g"), judulHtml: esc(t("h2.x.j.g")), subHtml: esc(t("h2.x.s.g")), isiHtml: `<div id="h2-x-g" class="ih-bagan"></div>${catatan("h2.x.n.g")}`, kakiHtml: kakiSumber(["jp-basic-white", "jp-12jt"]) }),
    ex({ id: "h2-x-nt", ikon: "tautan", topik: t("h2.x.ey.t"), judulHtml: esc(t("h2.x.j.t")), subHtml: esc(t("h2.x.s.t")), isiHtml: `<div id="h2-x-tab"></div>`, kakiHtml: kakiSumber(X.nota.map((n) => n.sumber_id)) }),
    ex({ id: "h2-x-k", ikon: "kapal", topik: t("h2.x.ey.k"), judulHtml: esc(t("h2.x.j.k")), subHtml: esc(t("h2.x.s.k")), isiHtml: `<div class="rg3-kisi">${koridor}</div>${daftarCelah([t("h2.x.celah")])}` }),
  ].join("");
  targetJepang(); tabelNota();
}
