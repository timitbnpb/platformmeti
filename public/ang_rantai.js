/* /angin, tab Rantai pasok: enam komponen (bilah, menara, nacelle, turbin lengkap, drivetrain, kapal instalasi), pemasok global dari global/pemasok_lain.json (segmen bayu),
   pemasok per negara, unit yang tertaut siaran, produksi dalam negeri (menara) dan impor HS 850231 (UN Comtrade lewat dagang_komponen.json). Dibaca runtime. */
import { B, muat, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, batangSvg, kolomSvg, tipHtml, kosongTab, daftarCelah, catatan, orgLogoSel, bendera, namaNegara, luar, siapTautan, naikkan, orgNama } from "/ang_umum.js";
import { nanti } from "/inti/umum.js";

const IK = { bilah: "angin", menara: "menara", nacelle: "pabrik", turbin: "tek-listrik", drivetrain: "pabrik", instalasi: "kapal" };
const pemasok = () => (B.lain?.baris || []).filter((b) => (b.segmen || []).includes(B.ang.rujukan.pemasok_segmen));
const subDari = (k) => B.ang.rantai.komponen.find((x) => x.k === k).subsegmen;
function kartuKomponen(c) {
  const p = pemasok().filter((b) => (b.subsegmen || []).some((s) => c.subsegmen.includes(s))), neg = [...new Set(p.map((b) => b.negara_iso2))], d = B.ang.rantai.domestik.find((x) => x.k === c.k);
  return `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon(IK[c.k] || "info", 22)}<b>${esc(t("ang.r.k." + c.k))}</b></div><p class="ang-angka">${esc(num(p.length, 0))} <small>${esc(t("ang.r.pemasok_k"))}</small></p>
    <p class="jm-bantu">${esc(p.slice(0, 4).map((b) => b.nama).join(", "))}${p.length > 4 ? ", ..." : ""}</p><div class="rg3-ab">${neg.map((n) => bendera(n, 18)).join(" ")}</div>
    <p class="jm-bantu">${esc(d ? tx(d.ket) : t("ang.r.domestik_belum"))}</p>${d ? buktiS(d.sumber_id, d.tingkat_bukti) : bukti("hipotesis", { sumber: "METI", cara: t("ang.r.cara_belum") })}</div>`;
}
function tabPemasok() {
  const el = document.getElementById("ang-r-tab"); if (!el) return;
  const sub = B.ang.rantai.komponen.flatMap((c) => c.subsegmen), U = B.ang.rantai.unit_pemasok;
  tabel(el, { satuan: "ang.u.pemasok", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("ang.c.pemasok"), v: (b) => b.nama, f: (b) => orgLogoSel(b.organisasi_id, b.nama) },
    { label: t("ang.c.negara"), v: (b) => b.negara_iso2, f: (b) => `<span class="rg3-neg">${bendera(b.negara_iso2, 20)}<span>${esc(namaNegara(b.negara_iso2))}</span></span>` },
    { label: t("ang.c.komponen"), v: (b) => (b.subsegmen || []).join(), f: (b) => (b.subsegmen || []).filter((s) => sub.includes(s)).map((s) => `<span class="jm-pil">${esc(t("ang.sub." + s))}</span>`).join(" ") },
    { label: t("ang.c.unit"), v: (b) => (U.some((u) => u.org_pemasok === b.organisasi_id) ? 1 : 0), f: (b) => { const u = U.filter((x) => x.org_pemasok === b.organisasi_id); return u.length ? `<ul class="ang-mini">${u.map((x) => `<li>${esc(tx(x.unit))} ${buktiS(x.sumber_id, x.tingkat_bukti)}</li>`).join("")}</ul>` : `<span class="jm-bantu">${esc(t("ang.r.unit_belum"))}</span>`; } },
    { label: t("ang.c.situs"), v: () => "", f: (b) => luar(b.situs, t("ang.situs")) },
  ], baris: pemasok().filter((b) => (b.subsegmen || []).some((s) => sub.includes(s))) });
}
function grafikNegara() {
  const el = document.getElementById("ang-r-neg"); if (!el) return;
  const m = new Map(); for (const b of pemasok()) m.set(b.negara_iso2, [...(m.get(b.negara_iso2) || []), b.nama]);
  const baris = [...m].sort((a, z) => z[1].length - a[1].length).map(([n, a]) => ({ label: namaNegara(n), bendera: String(n).toLowerCase(), tip: `${namaNegara(n)}: ${a.length}`, th: tipHtml(namaNegara(n), [[t("ang.c.pemasok"), a.join(", ")]]), bagian: [{ k: "n", nilai: a.length }] }));
  el.innerHTML = batangSvg({ el, d: 0, satuan: t("ang.r.pemasok_k"), label: t("ang.r.neg.label"), seri: [{ k: "n", kelas: "rg3-s-bayu" }], baris });
}
function grafikImpor() {
  const el = document.getElementById("ang-r-imp"); if (!el) return;
  const baris = (B.dk?.tahunan || []).filter((x) => x.komponen === "angin" && x.alir === "impor").sort((a, z) => a.tahun - z.tahun);
  if (!baris.length) { el.innerHTML = kosongTab("ang.kosong"); return; }
  el.innerHTML = kolomSvg({ el, satuan: "US$ juta", label: t("ang.r.imp.label"), seri: [{ k: "n", kelas: "rg3-s-bayu", label: t("ang.r.imp.seri") }],
    kategori: baris.map((x) => ({ label: String(x.tahun), nilai: { n: x.usd / 1e6 }, tip: `${x.tahun}: US$ ${num(x.usd / 1e6, 2)} ${t("ang.r.juta")}` })) });
}
export async function mulai(el) {
  await muat(["lain", "org", "dk"]);
  if (!B.ang || !B.lain) { el.innerHTML = kosongTab("ang.kosong"); return; }
  const A = B.ang, nP = pemasok().length;
  el.innerHTML = [
    ex({ id: "ang-r-komp", ikon: "pabrik", topik: t("ang.r.ey.komp"), judulHtml: esc(t("ang.r.j.komp")), subHtml: esc(t("ang.r.s.komp")), isiHtml: `<div class="rg3-kisi">${A.rantai.komponen.map(kartuKomponen).join("")}</div>${catatan("ang.r.n.komp")}`, kakiHtml: kakiSumber(["etp2", "kenertec", "detik-sidrap"]) }),
    ex({ id: "ang-r-pem", ikon: "gedung", topik: t("ang.r.ey.pem"), judulHtml: esc(t("ang.r.j.pem", { n: num(nP, 0) })), subHtml: esc(t("ang.r.s.pem")), isiHtml: `<div id="ang-r-neg" class="ih-bagan"></div><div id="ang-r-tab"></div>${catatan("ang.r.n.pem")}`, kakiHtml: kakiSumber(["windtech-gamesa", "petromindo-sg", "siemens-tolo"]) }),
    ex({ id: "ang-r-impor", ikon: "grafik", topik: t("ang.r.ey.imp"), judulHtml: esc(t("ang.r.j.imp")), subHtml: esc(t("ang.r.s.imp")), isiHtml: `<div id="ang-r-imp" class="ih-bagan"></div>${catatan("ang.r.n.imp")}<p class="jm-bantu">${bukti("hipotesis", { sumber: "METI", cara: t("ang.r.cara_imp") })}</p>`, kakiHtml: kakiSumber(["comtrade-angin"]) }),
    ex({ id: "ang-r-celah", ikon: "tanya", topik: t("ang.ey.celah"), judulHtml: esc(t("ang.j.celah")), isiHtml: daftarCelah([A.celah[2], A.celah[3]]) }),
  ].join("");
  nanti(() => { grafikNegara(); tabPemasok(); grafikImpor(); });
  siapTautan("org").then(() => naikkan(el));
}
