/* /surya, tab Biaya dan model bisnis: capex per skala (biaya_bangun.json, tingkat bukti per baris), lama proyek dari gagasan sampai COD dan dua belas model bisnis (topik surya bab 43 dan 44),
   serta tautan ke kalkulator PLTS atap dan model keuangan. Dibaca runtime; tidak menyalin angka. INP: grafik dan tabel menyusul lewat nanti(). */
import { X, L, t, ex, num, esc, ikon, bukti, tabel, batangSvg, tipHtml, chip, kosongTab, daftarCelah, catatan, muat, sumberBerkas } from "/sy_umum.js";
import { nanti } from "/inti/umum.js";

const skala = () => { const ids = X.sy.rujukan.biaya_skala, B = X.biaya?.skala || []; return ids.map((i) => B.find((s) => s.id === i)).filter(Boolean); };
const usd = (s) => s.capex_usd_kw || null;
function grafik() {
  const el = document.getElementById("sur-c-g"); if (!el) return;
  const baris = skala().filter(usd).map((s) => ({ label: s.nama.replace(/\s*\(.*$/, ""), ikon: "tek-surya", tip: `${s.nama}: ${num(usd(s).tengah, 0)} USD/kW`, th: tipHtml(s.nama, [[t("sur.c.rendah"), `${num(usd(s).rendah, 0)} USD/kW`], [t("sur.c.tengah"), `${num(usd(s).tengah, 0)} USD/kW`], [t("sur.c.tinggi"), `${num(usd(s).tinggi, 0)} USD/kW`]]), bagian: [{ k: s.kelas === "pembanding" ? "p" : "n", nilai: usd(s).tengah }] }));
  el.innerHTML = batangSvg({ el, d: 0, satuan: "USD/kW", label: t("sur.bi.j.capex"), seri: [{ k: "n", kelas: "rg3-s-id" }, { k: "p", kelas: "rg3-s-banding" }], baris });
}
function tabelSkala() {
  const el = document.getElementById("sur-c-t"); if (!el) return;
  const S = new Map((X.biaya?.sumber || []).map((s) => [s.id, s]));
  tabel(el, { satuan: "sur.u.skala", per: 8, urutAwal: 2, menurun: true, kolom: [
    { label: t("sur.c.skala"), v: (s) => s.nama, f: (s) => `<span class="rg3-idk"><b>${esc(s.nama)}</b><small>${esc(t("sur.kelas." + s.kelas))}</small></span>` },
    { label: t("sur.c.rendah"), num: true, v: (s) => usd(s)?.rendah ?? -1, f: (s) => (usd(s) ? esc(num(usd(s).rendah, 0)) : "-") },
    { label: t("sur.c.tengah"), num: true, v: (s) => usd(s)?.tengah ?? -1, f: (s) => (usd(s) ? `<b>${esc(num(usd(s).tengah, 0))}</b>` : "-") },
    { label: t("sur.c.tinggi"), num: true, v: (s) => usd(s)?.tinggi ?? -1, f: (s) => (usd(s) ? esc(num(usd(s).tinggi, 0)) : "-") },
    { label: t("sur.c.bukti"), v: (s) => usd(s)?.tingkat_bukti || "", f: (s) => { const u = usd(s), so = S.get(u?.sumber_id); return bukti(u?.tingkat_bukti, { sumber: so?.penerbit, tanggal: u?.tanggal, cara: so?.judul }); } },
  ], baris: skala() });
}
function lama() {
  const b = X.topikSurya?.bab?.["43"], sk = new Map((b?.skala || []).map((s) => [s.k, s]));
  if (!b?.total) return "";
  const urut = Object.entries(b.total);
  return ex({ id: "sur-c-lama", ikon: "linimasa", topik: t("sur.bi.ey.lama"), judulHtml: esc(t("sur.bi.j.lama")), subHtml: esc(t("sur.bi.s.lama")),
    isiHtml: `<div class="rg3-kisi">${urut.map(([k, [a, z]]) => `<div class="rg3-kartu sur-ubin"><span class="jm-kh-lbl">${esc(L(sk.get(k)?.l) || k)}</span><p class="sur-angka"><b>${esc(num(a))} - ${esc(num(z))}</b><span>${esc(t("sur.u.bulan"))}</span></p><span class="rg3-ab">${bukti("hipotesis", { sumber: "METI", cara: t("sur.bi.cara_lama") })}</span></div>`).join("")}</div>${catatan("sur.bi.n.lama")}<p class="jm-bantu"><a class="rg3-tautan" href="/topik?id=surya#bab-43">${esc(t("sur.bi.ke_bab43"))}</a></p>` });
}
function model() {
  const m = X.topikSurya?.bab?.["44"]?.models; if (!m?.length) return "";
  const ringkas = (s) => { const x = String(s || ""), i = x.indexOf(". "); const k = i > 40 ? x.slice(0, i + 1) : x; return k.length > 220 ? k.slice(0, 217) + "..." : k; };
  return ex({ id: "sur-c-model", ikon: "kalkulator", topik: t("sur.bi.ey.model"), judulHtml: esc(t("sur.bi.j.model", { n: num(m.length) })), subHtml: esc(t("sur.bi.s.model")),
    isiHtml: `<div class="rg3-kisi">${m.map((x) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(x.jenis === "pendapatan" ? "tag" : "kartu", 22)}<b>${esc(L(x.nama))}</b></div><p class="jm-bantu">${esc(ringkas(L(x.isi)))}</p><span class="rg3-ab">${chip("rg3-w" + (x.jenis === "pendapatan" ? 2 : 4), "", t("sur.bi.jenis." + x.jenis))}${bukti("kata-pihak", { sumber: "METI", cara: t("sur.bi.cara_model") })}</span></div>`).join("")}</div>${catatan("sur.bi.n.model")}<p class="jm-bantu"><a class="rg3-tautan" href="/topik?id=surya#bab-44">${esc(t("sur.bi.ke_bab44"))}</a> <a class="rg3-tautan" href="/model-keuangan?tek=surya">${esc(t("sur.bi.ke_model"))}</a> <a class="rg3-tautan" href="/peluang#plts-atap">${esc(t("sur.bi.ke_kalk"))}</a></p>` });
}
export async function mulai(el) {
  await muat(["biaya", "topikSurya", "atapHitung"]);
  if (!skala().length) { el.innerHTML = kosongTab("sur.kosong_data"); return; }
  const tarif = X.atapHitung?.tarif?.length;
  el.innerHTML = [
    ex({ id: "sur-c-capex", ikon: "grafik", topik: t("sur.bi.ey.capex"), judulHtml: esc(t("sur.bi.j.capex")), subHtml: esc(t("sur.bi.s.capex")),
      isiHtml: `<div id="sur-c-g" class="ih-bagan"></div><div id="sur-c-t"></div>${catatan("sur.bi.n.capex")}${daftarCelah((X.biaya.celah || []).slice(0, 2))}${tarif ? `<p class="jm-bantu">${esc(t("sur.bi.tarif", { n: num(tarif) }))}</p>` : ""}`, kakiHtml: sumberBerkas(X.biaya, ["s-irena-2024", "s-atap-hitung", "s-lazard-2026"]) }),
    lama(), model(),
  ].join("");
  nanti(() => { grafik(); tabelSkala(); });
}
