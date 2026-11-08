/* /rantai-global, tab WTE & PSEL: penyedia teknologi per negara asal, hulu rantai sampah, pelacak PSEL 12 kota Perpres 35/2018 dan tarif Perpres.
   Sumber: pemasok_wte.json, psel.json. Keterlibatan lembaga pendamping per negara BELUM fakta proyek (kata sumber). INP: saringan seketika, kartu/tabel menyusul lewat nanti(). */
import { D, berisi, ex, t, esc, ikon, num, bukti, luar, kosongTab, urlGet, urlSet, sumberBerkas, catatan, bendera, namaNegara, namaOrg, logoHtml, chip, warnaIdx, lbl } from "/rg3_umum.js";
import { nanti, debounce } from "/inti/umum.js";
import { cariHtml, pilihHtml, hapusHtml, hitungHtml } from "/inti/komponen.js";
import { pasangPilih } from "/inti/pilih.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { uangHtml } from "/inti/uang.js";
import { tarifPerpres35, tarifPerpres109 } from "/rantai_global_hitung.js";
import { batangSvg, legendaHtml, tabel, tipHtml } from "/info_hijau.js";

const PER = 6;
const TEKS = ["insinerasi-grate", "fluidized-bed", "gasifikasi", "biodigester-biogas", "landfill-gas"];
const ST = ["beroperasi", "konstruksi", "rencana", "tidak-diketahui"], IK_ST = { beroperasi: "centang", konstruksi: "industri", rencana: "kalender", "tidak-diketahui": "tanya" };
let wf = { tek: "", neg: "", q: "" }, whal = 1, pf = { st: "", p35: "", q: "" }, mw = 40;
const W = () => D.wte?.baris || [], PS = () => D.psel?.baris || [];
const stKode = (b) => (ST.includes(b.status) ? b.status : "tidak-diketahui");
const pilSt = (s) => `<span class="jm-pil-st rg3-st-${s}">${ikon(IK_ST[s] || "tanya", 14)}<span>${esc(t("rg3.w.st." + s))}</span></span>`;
const wLolos = (b) => (!wf.tek || b.teknologi.includes(wf.tek)) && (!wf.neg || b.negara.toLowerCase() === wf.neg) && (!wf.q || b.nama.toLowerCase().includes(wf.q.toLowerCase()));
const kodeNeg = (b) => b.negara.toLowerCase();

/* ---------- penyedia ---------- */
function grafikNegara() {
  const el = document.getElementById("rg3-w-g"), per = new Map();
  for (const b of W().filter(wLolos)) { const o = per.get(b.negara) || { n: b.negara, c: 0, tek: {} }; o.c++; for (const k of b.teknologi) o.tek[k] = (o.tek[k] || 0) + 1; per.set(b.negara, o); }
  const B = [...per.values()].sort((a, b) => b.c - a.c), ada = TEKS.filter((k) => B.some((o) => o.tek[k]));
  document.getElementById("rg3-w-leg").innerHTML = legendaHtml(ada.map((k) => ({ kelas: "rg3-s-w-" + k, label: lbl("rg3.w.tek.", k) })));
  el.innerHTML = B.length ? batangSvg({ el, d: 0, label: t("rg3.w.ey.negara"), satuan: t("rg3.w.u"), seri: TEKS.map((k) => ({ k, kelas: "rg3-s-w-" + k })),
    baris: B.map((o) => ({ label: namaNegara(o.n), bendera: o.n.toLowerCase(), tip: `${namaNegara(o.n)}: ${o.c}`, th: tipHtml(namaNegara(o.n), [[t("rg3.p.jumlah"), String(o.c)], ...ada.filter((k) => o.tek[k]).map((k) => [lbl("rg3.w.tek.", k), String(o.tek[k])])], { img: `/img/bendera/${o.n.toLowerCase()}.svg` }), bagian: ada.map((k) => ({ k, nilai: o.tek[k] || 0 })) })) }) : "";
}
function kartuNegara(n) {
  const P = W().filter((b) => wLolos(b) && b.negara === n.iso2), pend = n.pendanaan_pendamping || [];
  return `<article class="rg3-kartu rg3-negara"><header class="rg3-k-kep"><span class="rg3-bdr">${bendera(n.iso2.toLowerCase(), 40)}</span><div><h3>${esc(namaNegara(n.iso2))}</h3><p>${esc(t("rg3.w.n_penyedia", { n: P.length }))}</p></div></header>
    <div class="rg3-chips">${(n.teknologi || []).map((k) => chip("rg3-w" + warnaIdx(k), "", lbl("rg3.w.tek.", k))).join("")}</div>
    <ul class="rg3-penyedia">${P.map((b) => `<li>${logoHtml(b.id, b.nama, "", "rg3-lg rg3-lg-k")}<div><b>${namaOrg(b.id, b.nama)}</b><small>${esc((b.komponen || []).map((k) => lbl("rg3.w.komp.", k)).join(", "))}</small>${(b.indonesia || []).map((i) => `<a class="rg3-tautan rg3-proyek" href="/p/${encodeURIComponent(i.proyek_id)}">${ikon("proyek", 14)}${esc(i.proyek)}</a>`).join("")}</div>${b.sumber?.[0] ? bukti(b.sumber[0].tingkat_bukti, { tanggal: b.sumber[0].tanggal }) : ""}</li>`).join("")}</ul>
    ${pend.length ? `<p class="rg3-pend">${ikon("kartu", 16)}<span>${esc(t("rg3.w.pendamping"))}</span>${pend.map((p) => `<span class="rg3-chip rg3-chip-pudar">${esc(p)}</span>`).join("")}</p>` : ""}</article>`;
}
function daftarNegara() {
  const N = (D.wte?.negara || []).filter((n) => W().some((b) => wLolos(b) && b.negara === n.iso2)).sort((a, b) => b.penyedia_ids.length - a.penyedia_ids.length), mak = Math.max(1, Math.ceil(N.length / PER)); whal = Math.min(whal, mak);
  document.getElementById("rg3-w-hit").textContent = t("rg3.w.hit", { n: num(W().filter(wLolos).length), m: num(W().length) });
  document.getElementById("rg3-w-hapus").hidden = !(wf.tek || wf.neg || wf.q);
  document.getElementById("rg3-w-kartu").innerHTML = N.length ? `<div class="rg3-kisi">${N.slice((whal - 1) * PER, whal * PER).map(kartuNegara).join("")}</div>${paginasiHtml({ hal: whal, total: N.length, per: PER, satuan: "rg3.w.u_negara" })}` : `<p class="jm-kosong">${esc(t("rg3.p.kosong"))}</p>`;
}
const segarW = () => { urlSet({ wt: wf.tek, wn: wf.neg, wq: wf.q, wh: whal > 1 ? whal : "" }); nanti(() => { grafikNegara(); daftarNegara(); }); };
function hulu() {
  const H = D.wte?.hulu || []; if (!H.length) return "";
  return `<ol class="rg3-alur rg3-alur-3">${H.map((h, i) => `<li class="rg3-tahap"><span class="rg3-tahap-no">${ikon(["daftar2", "pabrik", "petir"][i] || "rantai", 18)}<i>${i + 1}</i></span><div><h3>${esc(lbl("rg3.w.hulu.", h.segmen))}</h3><p>${esc(h.uraian)}</p><div class="rg3-tahap-kaki"><span class="rg3-lain">${esc(t("rg3.w.hulu_pelaku", { n: (h.pelaku || []).length }))}</span>${bukti(h.sumber?.tingkat_bukti, { tanggal: h.sumber?.tanggal })}${h.sumber?.url ? luar(h.sumber.url, t("rg3.pr.buka")) : ""}</div></div></li>`).join("")}</ol>`;
}

/* ---------- pelacak PSEL ---------- */
const pLolos = (b) => (!pf.st || stKode(b) === pf.st) && (!pf.p35 || String(!!b.perpres_35_2018) === pf.p35) && (!pf.q || (b.kota + " " + b.nama).toLowerCase().includes(pf.q.toLowerCase()));
const nilaiInv = (n) => (n ? (n.satuan === "USD" ? uangHtml("US$", num(n.nilai / 1e6, 0) + " " + t("rg3.r.juta")) : uangHtml("Rp", num(n.nilai / 1e12, 1) + " " + t("rg3.w.triliun"))) : `<span class="ih-kosong">${esc(t("rg3.pr.belum"))}</span>`);
function dua12() {
  const K = D.psel?.kota_perpres_35_2018 || []; if (!K.length) return "";
  return `<ul class="rg3-kota">${K.map((k) => {
    const P = k.proyek_ids.map((id) => PS().find((b) => b.proyek_id === id)).filter(Boolean), st = P.length ? P.map(stKode).sort((a, b) => ST.indexOf(a) - ST.indexOf(b))[0] : "tidak-diketahui", ton = P.reduce((s, b) => s + (b.kapasitas_ton_hari[0] || 0), 0);
    return `<li class="rg3-kota-k rg3-kota-${st}"><div class="rg3-kota-h"><b>${esc(k.kota)}</b>${pilSt(st)}</div><p>${esc(t("rg3.w.k_proyek", { n: k.proyek_ids.length }))}${ton ? " | " + esc(t("rg3.w.k_ton", { n: num(ton, 0) })) : ""}</p><p class="rg3-chips">${k.proyek_ids.map((id) => `<a class="rg3-tautan rg3-proyek" href="/p/${encodeURIComponent(id)}">${ikon("proyek", 14)}${esc(PS().find((b) => b.proyek_id === id)?.nama.replace(/\s*\(.*\)\s*$/, "") || id)}</a>`).join("")}</p></li>`;
  }).join("")}</ul>`;
}
function grafikSt() {
  const el = document.getElementById("rg3-w-gs"); if (!el) return;
  const B = ST.map((s) => ({ s, n: PS().filter((b) => stKode(b) === s).length })).filter((x) => x.n);
  document.getElementById("rg3-w-gs-l").innerHTML = legendaHtml(B.map((x) => ({ kelas: "rg3-s-st-" + x.s, label: t("rg3.w.st." + x.s) })));
  el.innerHTML = batangSvg({ el, d: 0, label: t("rg3.w.ey.status"), satuan: t("rg3.w.u_psel"), seri: ST.map((s) => ({ k: s, kelas: "rg3-s-st-" + s })),
    baris: B.map((x) => { const L = PS().filter((b) => stKode(b) === x.s), ton = L.reduce((s, b) => s + (b.kapasitas_ton_hari[0] || 0), 0); return { label: t("rg3.w.st." + x.s), ikon: IK_ST[x.s], tip: `${t("rg3.w.st." + x.s)}: ${x.n}`, th: tipHtml(t("rg3.w.st." + x.s), [[t("rg3.w.u_psel"), String(x.n)], [t("rg3.w.kap"), ton ? `${num(ton, 0)} ton/${t("rg3.w.hari")}` : t("rg3.pr.belum")]]), bagian: [{ k: x.s, nilai: x.n }] }; }) });
}
function tabelPsel() {
  const el = document.getElementById("rg3-w-tb"), B = PS().filter(pLolos);
  document.getElementById("rg3-w-phit").textContent = t("rg3.w.hit", { n: num(B.length), m: num(PS().length) });
  document.getElementById("rg3-w-phapus").hidden = !(pf.st || pf.p35 || pf.q);
  if (!B.length) { el.innerHTML = `<p class="jm-kosong">${esc(t("rg3.p.kosong"))}</p>`; return; }
  tabel(el, { satuan: "rg3.w.u_psel", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("rg3.w.c.kota"), v: (b) => b.kota, f: (b) => `<span class="rg3-idk"><b>${esc(b.kota)}</b><small>${esc(b.provinsi || "")}</small></span>${b.perpres_35_2018 ? chip("rg3-w3", "", t("rg3.w.p35")) : ""}` },
    { label: t("rg3.w.c.proyek"), v: (b) => b.nama, f: (b) => `<a class="rg3-tautan" href="/p/${encodeURIComponent(b.proyek_id)}">${esc(b.nama)}</a>` },
    { label: t("rg3.w.c.status"), v: (b) => ST.indexOf(stKode(b)), f: (b) => pilSt(stKode(b)) },
    { label: t("rg3.w.kap"), num: true, v: (b) => b.kapasitas_ton_hari[0] ?? null, f: (b) => (b.kapasitas_ton_hari.length ? `<b>${esc(b.kapasitas_ton_hari.map((x) => num(x, 0)).join(" / "))}</b> ton/${esc(t("rg3.w.hari"))}${b.kapasitas_mw.length ? `<small class="rg3-catat">${esc(b.kapasitas_mw.map((x) => num(x, 1)).join(" / "))} MW</small>` : ""}` : `<span class="ih-kosong">${esc(t("rg3.pr.belum"))}</span>`) },
    { label: t("rg3.w.c.pengembang"), v: (b) => b.pengembang[0]?.nama || "", f: (b) => (b.pengembang.length ? b.pengembang.slice(0, 3).map((p) => `<span class="rg3-org">${namaOrg(p.organisasi_id, p.nama)}</span>`).join("") : `<span class="ih-kosong">${esc(t("rg3.pr.belum"))}</span>`) },
    { label: t("rg3.w.c.tek"), v: (b) => b.penyedia_teknologi[0]?.nama || "", f: (b) => (b.penyedia_teknologi.length ? b.penyedia_teknologi.map((p) => `<span class="rg3-org">${namaOrg(p.pemasok_id, p.nama)}</span>`).join("") : `<span class="ih-kosong">${esc(t("rg3.pr.belum"))}</span>`) },
    { label: t("rg3.w.c.cod"), num: true, v: (b) => b.cod_target[0] ?? null, f: (b) => (b.cod_target.length ? esc(b.cod_target.join(", ")) : "-") },
    { label: t("rg3.w.c.nilai"), num: true, v: (b) => b.nilai_investasi[0]?.nilai ?? null, f: (b) => nilaiInv(b.nilai_investasi[0]) },
    { label: t("rg3.h.bukti"), v: (b) => b.tingkat_bukti || "", f: (b) => `<span class="rg3-sm">${bukti(b.tingkat_bukti, { tanggal: b.sumber?.[0]?.tanggal })}${b.sumber?.[0]?.url ? luar(b.sumber[0].url, t("rg3.pr.buka")) : ""}</span>` },
  ], baris: B });
}
function tarif() {
  const R = D.psel?.regulasi || []; if (!R.length) return "";
  const r35 = R.find((x) => x.id === "perpres-35-2018"), r109 = R.find((x) => x.id === "perpres-109-2025");
  const kartu = (r, ik) => `<li class="rg3-ub"><span class="jm-kpi-ik">${ikon(ik, 18)}</span><b>Perpres ${esc(r.nomor)}</b><small>${esc(/^berlaku/.test(r.status) ? t("rg3.w.berlaku") : t("rg3.w.dicabut"))}</small>${(r.tarif || []).map((x) => `<small>${esc(x.syarat)}: ${esc(x.usd_sen_per_kwh != null ? `${num(x.usd_sen_per_kwh, 2)} US cent/kWh` : x.rumus)}</small>`).join("")}${bukti(r.tingkat_bukti, { tanggal: r.tanggal })}${r.url ? luar(r.url, t("rg3.pr.buka")) : ""}</li>`;
  return `<ul class="rg3-ubin rg3-ubin-2">${r35 ? kartu(r35, "regulasi") : ""}${r109 ? kartu(r109, "regulasi") : ""}</ul>
    <div class="rg3-sim"><label class="rg3-fld" for="rg3-w-mw"><span>${esc(t("rg3.w.mw"))}</span><input id="rg3-w-mw" type="number" min="1" step="1" inputmode="decimal" value="${esc(mw)}"><small>${esc(t("rg3.w.mw_k"))}</small></label><div id="rg3-w-tarif" class="ih-bagan"></div></div>`;
}
function tarifGrafik() {
  const el = document.getElementById("rg3-w-tarif"); if (!el) return;
  const a = tarifPerpres35(mw), b = tarifPerpres109(mw);
  if (a == null) { el.innerHTML = ""; return; }
  el.innerHTML = batangSvg({ el, d: 2, label: t("rg3.w.ey.tarif"), satuan: "US cent/kWh", seri: [{ k: "a", kelas: "rg3-s-p35" }, { k: "b", kelas: "rg3-s-p109" }],
    baris: [{ label: "Perpres 35/2018", ikon: "regulasi", tip: `${num(a, 2)}`, th: tipHtml("Perpres 35/2018", [[t("rg3.w.tarif"), `${num(a, 2)} US cent/kWh`], [t("rg3.w.mw"), `${num(mw, 0)} MW`], [t("rg3.w.status"), t("rg3.w.dicabut")]]), bagian: [{ k: "a", nilai: a }] },
      { label: "Perpres 109/2025", ikon: "regulasi", sorot: true, tip: `${num(b, 2)}`, th: tipHtml("Perpres 109/2025", [[t("rg3.w.tarif"), `${num(b, 2)} US cent/kWh`], [t("rg3.w.mw"), `${num(mw, 0)} MW`], [t("rg3.w.status"), t("rg3.w.berlaku")]]), bagian: [{ k: "b", nilai: b }] }] }) + `<p class="jm-bantu ih-catatan">${esc(t("rg3.w.tarif_n", { a: num(a, 2), b: num(b, 2), s: num(b - a, 2) }))} ${bukti("est", { cara: t("rg3.w.tarif_cara") })}</p>`;
}

export function mulai(el) {
  if (!berisi("wte") && !berisi("psel")) { el.innerHTML = kosongTab("rg3.w.kosong_data"); return; }
  wf = { tek: urlGet("wt"), neg: urlGet("wn"), q: urlGet("wq") }; whal = +urlGet("wh") || 1; pf = { st: urlGet("ws"), p35: urlGet("w35"), q: urlGet("wpq") }; mw = +urlGet("wmw") || 40;
  const nTek = (k) => W().filter((b) => b.teknologi.includes(k)).length, neg = [...new Set(W().map((b) => b.negara))].sort((a, b) => namaNegara(a).localeCompare(namaNegara(b)));
  el.innerHTML = [
    berisi("wte") ? ex({ id: "rg3-w-penyedia", ikon: "globe", topik: t("rg3.w.ey.negara"), judulHtml: esc(t("rg3.w.j.negara", { n: num(W().length), m: num(neg.length) })), subHtml: esc(t("rg3.w.s.negara")),
      isiHtml: `<div class="jm-saring rg3-saring">${cariHtml({ id: "rg3-w-q", label: t("rg3.p.f.q"), placeholder: t("rg3.p.f.q") })}${pilihHtml({ id: "rg3-w-t", ikon: "tek:biomassa-sampah", label: t("rg3.p.f.tek"), opsi: [["", t("rg3.w.f.tek"), "tek:biomassa-sampah"], ...TEKS.filter(nTek).map((k) => [k, lbl("rg3.w.tek.", k), "tek:biomassa-sampah", nTek(k)])], nilai: wf.tek })}${pilihHtml({ id: "rg3-w-n", ikon: "globe", label: t("rg3.p.f.neg"), opsi: [["", t("rg3.p.f.neg"), "globe"], ...neg.map((n) => [n.toLowerCase(), namaNegara(n), "img:/img/bendera/" + n.toLowerCase() + ".svg", W().filter((b) => b.negara === n).length])], nilai: wf.neg })}${hapusHtml({ id: "rg3-w-hapus", label: t("rg3.p.f.hapus") })}${hitungHtml({ id: "rg3-w-hit", teks: "" })}</div><div id="rg3-w-leg"></div><div id="rg3-w-g" class="ih-bagan"></div><div id="rg3-w-kartu"></div>${catatan("rg3.w.n_penyedia_cat")}`, kakiHtml: sumberBerkas(D.wte) }) : "",
    berisi("wte") ? ex({ id: "rg3-w-hulu", ikon: "rantai", topik: t("rg3.w.ey.hulu"), judulHtml: esc(t("rg3.w.j.hulu")), subHtml: esc(t("rg3.w.s.hulu")), isiHtml: `${hulu()}${D.wte.alur_impor ? `<div class="rg3-info">${ikon("tanya", 18)}<p>${esc(D.wte.alur_impor.catatan)} ${bukti(D.wte.alur_impor.status)}</p></div>` : ""}` }) : "",
    berisi("psel") ? ex({ id: "rg3-w-pelacak", ikon: "proyek", topik: t("rg3.w.ey.psel"), judulHtml: esc(t("rg3.w.j.psel", { n: num(PS().length), m: num((D.psel.kota_perpres_35_2018 || []).length) })), subHtml: esc(t("rg3.w.s.psel")),
      isiHtml: `<h3 class="rg3-sub">${esc(t("rg3.w.ey.kota"))}</h3>${dua12()}<h3 class="rg3-sub">${esc(t("rg3.w.ey.status"))}</h3><div id="rg3-w-gs-l"></div><div id="rg3-w-gs" class="ih-bagan"></div><h3 class="rg3-sub">${esc(t("rg3.w.ey.daftar"))}</h3><div class="jm-saring rg3-saring">${cariHtml({ id: "rg3-w-pq", label: t("rg3.w.f.kota"), placeholder: t("rg3.w.f.kota") })}${pilihHtml({ id: "rg3-w-ps", ikon: "status", label: t("rg3.w.c.status"), opsi: [["", t("rg3.w.f.status"), "status"], ...ST.map((s) => [s, t("rg3.w.st." + s), "centang", PS().filter((b) => stKode(b) === s).length])], nilai: pf.st })}${pilihHtml({ id: "rg3-w-p35", ikon: "regulasi", label: t("rg3.w.p35"), opsi: [["", t("rg3.w.f.p35"), "regulasi"], ["true", t("rg3.w.f.p35_ya"), "regulasi", PS().filter((b) => b.perpres_35_2018).length], ["false", t("rg3.w.f.p35_tidak"), "regulasi", PS().filter((b) => !b.perpres_35_2018).length]], nilai: pf.p35 })}${hapusHtml({ id: "rg3-w-phapus", label: t("rg3.p.f.hapus") })}${hitungHtml({ id: "rg3-w-phit", teks: "" })}</div><div id="rg3-w-tb"></div>${catatan("rg3.w.n_psel")}`, kakiHtml: sumberBerkas(D.psel) }) : "",
    D.psel?.regulasi?.length ? ex({ id: "rg3-w-tarif-ex", ikon: "regulasi", topik: t("rg3.w.ey.tarif"), judulHtml: esc(t("rg3.w.j.tarif")), subHtml: esc(t("rg3.w.s.tarif")), isiHtml: tarif() + catatan("rg3.w.n_tarif") }) : "",
  ].join("");
  pasangPilih();
  if (wf.q) el.querySelector("#rg3-w-q").value = wf.q;
  if (pf.q) el.querySelector("#rg3-w-pq").value = pf.q;
  if (berisi("wte")) { grafikNegara(); daftarNegara(); }
  if (berisi("psel")) { grafikSt(); tabelPsel(); }
  tarifGrafik();
  const baruW = (k) => (e) => { wf[k] = e.target.value.trim?.() ?? e.target.value; whal = 1; segarW(); };
  el.querySelector("#rg3-w-q")?.addEventListener("input", debounce(baruW("q"), 150));
  el.querySelector("#rg3-w-t")?.addEventListener("change", baruW("tek"));
  el.querySelector("#rg3-w-n")?.addEventListener("change", baruW("neg"));
  el.querySelector("#rg3-w-hapus")?.addEventListener("click", () => { wf = { tek: "", neg: "", q: "" }; whal = 1; el.querySelector("#rg3-w-q").value = ""; for (const id of ["rg3-w-t", "rg3-w-n"]) { const s = el.querySelector("#" + id); s.value = ""; s.dispatchEvent(new Event("jm:segar")); } segarW(); });
  const segarP = () => { urlSet({ ws: pf.st, w35: pf.p35, wpq: pf.q }); nanti(tabelPsel); };
  el.querySelector("#rg3-w-pq")?.addEventListener("input", debounce((e) => { pf.q = e.target.value.trim(); segarP(); }, 150));
  el.querySelector("#rg3-w-ps")?.addEventListener("change", (e) => { pf.st = e.target.value; segarP(); });
  el.querySelector("#rg3-w-p35")?.addEventListener("change", (e) => { pf.p35 = e.target.value; segarP(); });
  el.querySelector("#rg3-w-phapus")?.addEventListener("click", () => { pf = { st: "", p35: "", q: "" }; el.querySelector("#rg3-w-pq").value = ""; for (const id of ["rg3-w-ps", "rg3-w-p35"]) { const s = el.querySelector("#" + id); s.value = ""; s.dispatchEvent(new Event("jm:segar")); } segarP(); });
  el.querySelector("#rg3-w-mw")?.addEventListener("input", (e) => { mw = +e.target.value || 0; urlSet({ wmw: mw === 40 ? "" : mw }); nanti(tarifGrafik); });
  el.querySelector("#rg3-w-kartu")?.addEventListener("click", (e) => { const h = e.target.closest("[data-hal]"); if (!h || h.disabled) return; whal = +h.dataset.hal; sorotHalaman(h, whal); urlSet({ wh: whal > 1 ? whal : "" }); nanti(daftarNegara); });
}
