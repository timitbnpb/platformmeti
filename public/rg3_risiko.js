/* /rantai-global, tab Risiko: konsentrasi negara (HHI), ESG dan larangan kerja paksa (UFLPA), radar berita rantai pasok, gangguan logistik.
   Sumber: dagang_komponen.json (UN Comtrade), pemasok_*.json, kebijakan_dagang.json, esg_rantai.json, radar_rantai.json, logistik.json.
   HHI dan pangsa = turunan EST dari angka resmi; hitungan jumlah pemasok bukan pangsa pasar. INP: pilihan/chip seketika, daftar menyusul lewat nanti(). */
import { D, berisi, ex, t, esc, ikon, num, bukti, luar, cariSumber, kosongTab, urlGet, urlSet, sumberBerkas, catatan, daftarCelah, bendera, namaNegara, namaOrg, logoHtml, chip, warnaIdx, lbl, tanggal } from "/rg3_umum.js";
import { nanti } from "/inti/umum.js";
import { pilihHtml } from "/inti/komponen.js";
import { pasangPilih } from "/inti/pilih.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { hhi, kelasHhi, pangsaMitra } from "/rantai_global_hitung.js";
import { batangSvg, legendaHtml, tipHtml, tabel } from "/info_hijau.js";

const IK_RADAR = { "pabrik-baru": "pabrik", ekspansi: "grafik", penutupan: "silang", kebangkrutan: "peringatan", akuisisi: "transaksi", tarif: "tag", kebijakan: "palu" };
const KOMP = ["surya", "baterai", "angin", "inverter"], PER = 8;
let dk = "surya", rj = new Set(), rn = "", rhal = 1;

/* ---------- konsentrasi impor (Comtrade) ---------- */
function impor(komp) {
  const rows = (D.dagang?.tahunan || []).filter((r) => r.komponen === komp && r.alir === "impor"), th = Math.max(...rows.map((r) => r.tahun));
  const r = rows.find((x) => x.tahun === th); return r ? { r, th } : null;
}
function konsentrasi() {
  const x = impor(dk), el = document.getElementById("rg3-r-g"), ket = document.getElementById("rg3-r-k"); if (!el) return;
  if (!x) { el.innerHTML = ""; ket.innerHTML = `<p class="jm-kosong">${esc(t("rg3.r.kosong_dagang"))}</p>`; return; }
  const iso = Object.fromEntries((D.dagang.mitra || []).map((m) => [m.kode, m])), P = pangsaMitra(x.r.mitra), h = hhi(x.r.mitra.map((m) => m.usd)), kl = kelasHhi(h), top = P.slice(0, 8);
  ket.innerHTML = `<ul class="rg3-ubin rg3-ubin-3"><li class="rg3-ub"><span class="jm-kpi-ik">${ikon("kartu", 18)}</span><b>US$ ${esc(num(x.r.usd / 1e6, 0))} ${esc(t("rg3.r.juta"))}</b><small>${esc(t("rg3.r.impor", { th: x.th, hs: x.r.hs }))}</small>${bukti("resmi", { sumber: cariSumber(D.dagang, "s-comtrade")?.penerbit || "UN Comtrade" })}</li>
    <li class="rg3-ub"><span class="jm-kpi-ik">${ikon("globe", 18)}</span><b>${esc(num(P[0]?.pct, 1))}%</b><small>${esc(t("rg3.r.terbesar", { n: P[0] ? (iso[P[0].kode]?.iso2 ? namaNegara(iso[P[0].kode].iso2) : iso[P[0].kode]?.nama) || "-" : "-" }))}</small>${bukti("est", { cara: t("rg3.r.cara_pangsa") })}</li>
    <li class="rg3-ub rg3-hhi-${kl}"><span class="jm-kpi-ik">${ikon("peringatan", 18)}</span><b>${esc(num(h, 0))}</b><small>${esc(t("rg3.r.hhi"))}: ${esc(t("rg3.r.hhi." + kl))}</small>${bukti("est", { cara: t("rg3.r.cara_hhi") })}</li></ul>`;
  el.innerHTML = batangSvg({ el, d: 1, label: t("rg3.r.ey.negara"), satuan: "%", seri: [{ k: "p", kelas: "rg3-s-pangsa" }],
    baris: top.map((m) => { const mi = iso[m.kode]; return { label: mi?.iso2 ? namaNegara(mi.iso2) : mi?.nama || String(m.kode), bendera: mi?.iso2, ikon: mi?.iso2 ? "" : "globe", tip: `${mi?.nama}: ${num(m.pct, 1)}%`, th: tipHtml(mi?.nama || String(m.kode), [[t("rg3.r.pangsa"), `${num(m.pct, 1)}%`], [t("rg3.r.nilai"), `US$ ${num(m.usd / 1e6, 1)} ${t("rg3.r.juta")}`]], { img: mi?.iso2 ? `/img/bendera/${mi.iso2}.svg` : "" }), bagian: [{ k: "p", nilai: m.pct }] }; }) });
}
function hhiPemasok() {
  const el = document.getElementById("rg3-r-hp"); if (!el) return;
  const per = new Map();
  for (const b of D.surya?.baris || []) for (const s of b.segmen) { const o = per.get(s) || {}; o[b.negara_iso2] = (o[b.negara_iso2] || 0) + 1; per.set(s, o); }
  const B = [...per].map(([s, o]) => ({ s, o, n: Object.values(o).reduce((a, b) => a + b, 0), h: hhi(Object.values(o)) })).filter((x) => x.n >= 2).sort((a, b) => b.h - a.h);
  if (!B.length) { el.innerHTML = ""; return; }
  document.getElementById("rg3-r-hp-l").innerHTML = legendaHtml(["tinggi", "sedang", "rendah"].map((k) => ({ kelas: "rg3-s-h-" + k, label: t("rg3.r.hhi." + k) })));
  el.innerHTML = batangSvg({ el, d: 0, label: t("rg3.r.ey.hhi"), satuan: "HHI", seri: ["tinggi", "sedang", "rendah"].map((k) => ({ k, kelas: "rg3-s-h-" + k })),
    baris: B.map((x) => { const kl = kelasHhi(x.h), top = Object.entries(x.o).sort((a, b) => b[1] - a[1]); return { label: lbl("rg3.seg.", x.s), ikon: "pabrik", tip: `${lbl("rg3.seg.", x.s)}: HHI ${num(x.h, 0)}`, th: tipHtml(lbl("rg3.seg.", x.s), [["HHI", num(x.h, 0), ""], [t("rg3.r.pemasok"), String(x.n)], ...top.slice(0, 4).map(([n, c]) => [namaNegara(n), `${c} (${num((c / x.n) * 100, 0)}%)`])]), bagian: [{ k: kl, nilai: x.h }] }; }) });
}
function kpiChina() {
  const K = D.logistik?.risiko?.konsentrasi || []; if (!K.length) return "";
  return `<ul class="rg3-ubin rg3-ubin-4">${K.filter((k) => k.china_pangsa_persen != null).map((k) => `<li class="rg3-ub"><span class="jm-kpi-ik">${ikon("tag", 18)}</span><b>${esc(num(k.china_pangsa_persen, 1))}%</b><small>${esc(lbl("rg3.r.komp.", k.komponen))}</small><small>${bendera("cn", 14)} ${esc(k.tahun || "")}</small>${bukti(k.tingkat_bukti, { sumber: cariSumber(D.logistik, k.sumber_id)?.penerbit || "", tanggal: k.tanggal, cara: k.rumus })}</li>`).join("")}</ul>`;
}

/* ---------- ESG dan larangan kerja paksa ---------- */
const buktiE = (x) => bukti(x.tingkat_bukti, { sumber: cariSumber(D.esg, x.sumber_id)?.penerbit || "", tanggal: x.tanggal || x.tanggal_akses || "", cara: x.batas || "" });
function esg() {
  const kerja = (D.kebijakan?.baris || []).filter((b) => b.jenis === "larangan-kerja-paksa"), d = D.esg || {};
  const aturan = kerja.length ? `<ul class="rg3-daftar">${kerja.map((b) => `<li class="rg3-baris"><span class="rg3-neg">${bendera(b.negara, 20)}</span><div><b>${esc(b.produk)}</b><small>${esc(b.besaran || "")}</small><small>${esc(b.status || "")}</small></div>${bukti(b.tingkat_bukti, { tanggal: b.tanggal })}${b.sumber_url ? luar(b.sumber_url, t("rg3.pr.buka")) : ""}</li>`).join("")}</ul>` : "";
  const sup = (D.surya?.baris || []).filter((b) => (b.esg || []).length || (b.isu_dagang || []).length);
  const pot = (s) => { const x = String(s || "").replace(/\s+/g, " ").replace(/=+\s*[^=]+?\s*=+/g, " "); return x.length > 230 ? x.slice(0, 227) + "..." : x; };
  const bar = sup.flatMap((b) => [...(b.esg || []).map((e) => ({ b, e, jenis: "esg" })), ...(b.isu_dagang || []).map((e) => ({ b, e, jenis: "dagang" }))]);
  const daftar = bar.length ? `<ul class="rg3-daftar">${bar.slice(0, 12).map(({ b, e, jenis }) => `<li class="rg3-baris">${bendera(b.negara_iso2.toLowerCase(), 20)}<div><b>${namaOrg(b.id, b.nama)}</b><small>${esc(pot(e.kutipan || e.ringkas || e.uraian || ""))}</small></div>${chip("rg3-w" + warnaIdx(jenis), "", t("rg3.r.esg." + jenis))}${bukti(e.tingkat_bukti, { tanggal: e.tanggal_periksa })}${e.sumber_url ? luar(e.sumber_url, t("rg3.pr.buka")) : ""}</li>`).join("")}</ul>${bar.length > 12 ? `<p class="jm-bantu ih-catatan">${esc(t("rg3.r.esg.lain", { n: bar.length - 12 }))}</p>` : ""}` : "";
  const jm = (d.jejak_modul || []).filter((x) => x.nilai != null), jb = (d.jejak_baterai || []).filter((x) => x.nilai != null);
  const kp = d.kerja_paksa?.entitas || [], sr = d.sertifikasi || [];
  const sert = sr.length ? `<ul class="rg3-daftar">${sr.map((x) => `<li class="rg3-baris">${logoHtml(x.org_id, x.nama, "")}<div><b>${namaOrg(x.org_id, x.nama)}</b><small>${esc(x.skema)}: ${esc(x.detail || "")}</small></div>${chip("rg3-st-" + (x.status === "berlaku" ? "operasi" : "x"), "", x.status === "berlaku" ? t("rg3.k.pj.berlaku") : x.status)}${buktiE(x)}</li>`).join("")}</ul>` : "";
  const isi = (aturan ? `<h3 class="rg3-sub">${esc(t("rg3.r.esg.aturan"))}</h3>${aturan}` : "")
    + (kp.length ? `<h3 class="rg3-sub">${esc(t("rg3.r.esg.uf", { n: num(kp.length) }))}</h3><div id="rg3-r-uf"></div><p class="jm-bantu ih-catatan">${esc(d.kerja_paksa.catatan || "")}</p>` : "")
    + (jm.length ? `<h3 class="rg3-sub">${esc(t("rg3.r.esg.jm"))}</h3><div id="rg3-r-jm-l"></div><div id="rg3-r-jm" class="ih-bagan"></div><p class="jm-bantu ih-catatan">${esc(t("rg3.r.esg.jm_n"))}</p>` : "")
    + (jb.length ? `<h3 class="rg3-sub">${esc(t("rg3.r.esg.jb"))}</h3><div id="rg3-r-jb" class="ih-bagan"></div>` : "")
    + (sert ? `<h3 class="rg3-sub">${esc(t("rg3.r.esg.sert"))}</h3>${sert}` : "")
    + (daftar ? `<h3 class="rg3-sub">${esc(t("rg3.r.esg.pemasok"))}</h3>${daftar}` : "");
  return isi || `<p class="jm-kosong">${esc(t("rg3.r.esg.kosong"))}</p>`;
}
function esgGrafik() {
  const d = D.esg; if (!d) return;
  const jm = (d.jejak_modul || []).filter((x) => x.nilai != null), jb = (d.jejak_baterai || []).filter((x) => x.nilai != null), jmEl = document.getElementById("rg3-r-jm"), jbEl = document.getElementById("rg3-r-jb");
  if (jmEl && jm.length) {
    const tek = [...new Set(jm.map((x) => x.teknologi))];
    document.getElementById("rg3-r-jm-l").innerHTML = legendaHtml(tek.map((k) => ({ kelas: "rg3-g-" + warnaIdx(k), label: k })));
    jmEl.innerHTML = batangSvg({ el: jmEl, d: 0, label: t("rg3.r.esg.jm"), satuan: jm[0].satuan, seri: tek.map((k) => ({ k, kelas: "rg3-g-" + warnaIdx(k) })),
      baris: jm.sort((a, b) => a.nilai - b.nilai).map((x) => ({ label: x.wilayah, bendera: x.negara_iso2 ? x.negara_iso2.toLowerCase() : "", ikon: x.negara_iso2 ? "" : "globe", tip: `${x.wilayah}: ${x.nilai}`, th: tipHtml(x.wilayah, [[t("rg3.r.nilai"), `${num(x.nilai, 0)} ${x.satuan}`], [t("rg3.pr.tek"), x.teknologi], [t("rg3.h.tanggal"), String(x.tahun_data || "-")], [t("rg3.r.esg.batas"), x.batas || "-"]], { img: x.negara_iso2 ? `/img/bendera/${x.negara_iso2.toLowerCase()}.svg` : "" }), bagian: tek.map((k) => ({ k, nilai: x.teknologi === k ? x.nilai : 0 })) })) });
  }
  if (jbEl && jb.length) {
    const kim = [...new Set(jb.map((x) => x.kimia))];
    jbEl.innerHTML = batangSvg({ el: jbEl, d: 0, label: t("rg3.r.esg.jb"), satuan: jb[0].satuan, seri: kim.map((k) => ({ k, kelas: "rg3-g-" + warnaIdx(k) })),
      baris: jb.sort((a, b) => a.nilai - b.nilai).map((x) => ({ label: `${x.wilayah} (${x.kimia})`, bendera: x.negara_iso2 ? x.negara_iso2.toLowerCase() : "", ikon: x.negara_iso2 ? "" : "globe", tip: `${x.wilayah}: ${x.nilai}`, th: tipHtml(x.wilayah, [[t("rg3.r.nilai"), `${num(x.nilai, 1)} ${x.satuan}`], [t("rg3.r.esg.kimia"), x.kimia]], { img: x.negara_iso2 ? `/img/bendera/${x.negara_iso2.toLowerCase()}.svg` : "" }), bagian: kim.map((k) => ({ k, nilai: x.kimia === k ? x.nilai : 0 })) })) });
  }
  const uf = document.getElementById("rg3-r-uf"), kp = d.kerja_paksa?.entitas || [];
  if (uf && kp.length) tabel(uf, { satuan: "rg3.r.u_uf", per: 6, urutAwal: 2, menurun: true, kolom: [
    { label: t("rg3.r.uf.entitas"), v: (x) => x.entitas, f: (x) => `<b>${x.org_id ? namaOrg(x.org_id, x.entitas) : esc(x.entitas)}</b>` },
    { label: t("rg3.r.uf.sektor"), v: (x) => x.sektor || "", f: (x) => chip("rg3-w" + warnaIdx(x.sektor), "", x.sektor || "-") },
    { label: t("rg3.r.uf.ditambahkan"), v: (x) => x.ditambahkan || "", f: (x) => esc(x.ditambahkan ? tanggal(x.ditambahkan) : "-") },
    { label: t("rg3.r.uf.bagian"), v: (x) => x.bagian || "", f: (x) => esc(x.bagian || "-") },
    { label: t("rg3.h.bukti"), v: (x) => x.tingkat_bukti || "", f: (x) => { const s = cariSumber(D.esg, x.sumber_id); return `<span class="rg3-sm">${buktiE(x)}${s?.url ? luar(s.url, s.penerbit) : ""}</span>`; } },
  ], baris: kp });
}

/* ---------- radar ---------- */
const RB = () => D.radar?.baris || [];
const radarLolos = (r) => (!rj.size || rj.has(r.jenis)) && (!rn || r.negara === rn);
function radarChip() {
  const jenis = Object.keys(D.radar?.jenis || {}), per = D.radar?.per_jenis || {};
  return jenis.map((j) => `<button type="button" class="rg3-chip rg3-chipb rg3-w${warnaIdx(j)}" data-rj="${esc(j)}" aria-pressed="${rj.has(j)}">${ikon(IK_RADAR[j] || "info", 14)}<span>${esc(lbl("rg3.rd.j.", j))}</span><i>${per[j] ?? RB().filter((r) => r.jenis === j).length}</i></button>`).join("");
}
function radar() {
  const L = RB().filter(radarLolos).sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal))), mak = Math.max(1, Math.ceil(L.length / PER)); rhal = Math.min(rhal, mak);
  const el = document.getElementById("rg3-r-rd"); if (!el) return;
  el.innerHTML = L.length ? `<ul class="rg3-lini">${L.slice((rhal - 1) * PER, rhal * PER).map((r) => `<li class="rg3-lini-i"><span class="rg3-lini-ik rg3-w${warnaIdx(r.jenis)}">${ikon(IK_RADAR[r.jenis] || "info", 18)}</span><div><p class="rg3-lini-m">${chip("rg3-w" + warnaIdx(r.jenis), "", lbl("rg3.rd.j.", r.jenis))}<span class="rg3-neg">${bendera(r.negara, 16)}<span>${esc(namaNegara(r.negara))}</span></span><time datetime="${esc(r.tanggal)}">${esc(tanggal(r.tanggal))}</time></p><p>${esc(r.ringkas)}</p><p class="rg3-chips">${(r.komponen || []).map((k) => `<span class="rg3-lain">${esc(lbl("rg3.rd.k.", k))}</span>`).join("")}${(r.org_nama || []).map((n, i) => (r.org_ids?.[i] ? namaOrg(r.org_ids[i], n) : `<span class="rg3-lain">${esc(n)}</span>`)).join("")}</p></div><div class="rg3-sm">${bukti(r.tingkat_bukti, { sumber: r.media || r.sumber, tanggal: r.tanggal_periksa })}${r.url ? luar(r.url, r.media || r.sumber || t("rg3.pr.buka")) : ""}</div></li>`).join("")}</ul>${paginasiHtml({ hal: rhal, total: L.length, per: PER, satuan: "rg3.rd.u" })}` : `<p class="jm-kosong">${esc(t("rg3.rd.kosong"))}</p>`;
}
function gangguan() {
  const G = D.logistik?.risiko?.gangguan || []; if (!G.length) return "";
  return `<ul class="rg3-daftar">${G.map((g) => `<li class="rg3-baris">${ikon("peringatan", 20)}<div><b>${esc(g.nama)}</b><small>${esc(g.ringkas)}</small></div>${bukti(g.tingkat_bukti, { tanggal: g.tanggal })}</li>`).join("")}</ul>`;
}

export function mulai(el) {
  const adaDagang = berisi("dagang", "tahunan"), adaRadar = berisi("radar"), adaEsg = berisi("kebijakan") || berisi("surya") || !!D.esg;
  if (!adaDagang && !adaRadar && !adaEsg && !berisi("logistik", "tahap")) { el.innerHTML = kosongTab("rg3.r.kosong_data"); return; }
  dk = KOMP.includes(urlGet("rk")) ? urlGet("rk") : "surya"; rn = urlGet("rn"); rj = new Set(urlGet("rj").split(",").filter((j) => D.radar?.jenis?.[j])); rhal = +urlGet("rh") || 1;
  const negR = [...new Set(RB().map((r) => r.negara))].sort((a, b) => namaNegara(a).localeCompare(namaNegara(b)));
  el.innerHTML = [
    adaDagang ? ex({ id: "rg3-r-konsentrasi", ikon: "globe", topik: t("rg3.r.ey.negara"), judulHtml: esc(t("rg3.r.j.negara")), subHtml: esc(t("rg3.r.s.negara")),
      isiHtml: `${kpiChina()}<div class="jm-saring rg3-saring rg3-saring-1">${pilihHtml({ id: "rg3-r-kp", ikon: "tag", label: t("rg3.r.f.komp"), opsi: KOMP.filter((k) => impor(k)).map((k) => [k, lbl("rg3.r.komp.", k), k === "surya" ? "tek:surya" : k === "angin" ? "tek:bayu" : k === "baterai" ? "tek:penyimpanan" : "petir"]), nilai: dk })}</div><div id="rg3-r-k"></div><div id="rg3-r-g" class="ih-bagan"></div>${catatan("rg3.r.n.negara")}`, kakiHtml: sumberBerkas(D.dagang) }) : "",
    berisi("surya") ? ex({ id: "rg3-r-hhi", ikon: "pabrik", topik: t("rg3.r.ey.hhi"), judulHtml: esc(t("rg3.r.j.hhi")), subHtml: esc(t("rg3.r.s.hhi")), isiHtml: `<div id="rg3-r-hp-l"></div><div id="rg3-r-hp" class="ih-bagan"></div>${catatan("rg3.r.n.hhi")}` }) : "",
    adaEsg ? ex({ id: "rg3-r-esg", ikon: "perisai", topik: t("rg3.r.ey.esg"), judulHtml: esc(t("rg3.r.j.esg")), subHtml: esc(t("rg3.r.s.esg")), isiHtml: esg() + catatan("rg3.r.n.esg"), kakiHtml: sumberBerkas(D.kebijakan) + (D.esg ? sumberBerkas(D.esg) : "") }) : "",
    adaRadar ? ex({ id: "rg3-r-radar", ikon: "berita", topik: t("rg3.r.ey.radar"), judulHtml: esc(t("rg3.r.j.radar", { n: num(RB().length), p: D.radar.periode || "" })), subHtml: esc(t("rg3.r.s.radar")),
      isiHtml: `<div class="jm-saring rg3-saring rg3-saring-1">${pilihHtml({ id: "rg3-r-n", ikon: "globe", label: t("rg3.p.f.neg"), opsi: [["", t("rg3.p.f.neg"), "globe"], ...negR.map((n) => [n, namaNegara(n), "img:/img/bendera/" + n + ".svg", RB().filter((r) => r.negara === n).length])], nilai: rn })}</div><div class="rg3-chips rg3-radar-chip" id="rg3-r-chip">${radarChip()}</div><div id="rg3-r-rd"></div>${daftarCelah(D.radar.celah)}`, kakiHtml: sumberBerkas(D.radar) }) : "",
    gangguan() ? ex({ id: "rg3-r-ganggu", ikon: "peringatan", topik: t("rg3.r.ey.ganggu"), judulHtml: esc(t("rg3.r.j.ganggu")), subHtml: esc(t("rg3.r.s.ganggu")), isiHtml: gangguan(), kakiHtml: sumberBerkas(D.logistik, ["s-wiki-redsea", "s-drewry-wci", "s-unctad-rmt24"]) }) : "",
  ].join("");
  pasangPilih();
  konsentrasi(); hhiPemasok(); radar(); nanti(esgGrafik);
  el.querySelector("#rg3-r-kp")?.addEventListener("change", (e) => { dk = e.target.value; urlSet({ rk: dk === "surya" ? "" : dk }); nanti(konsentrasi); });
  el.querySelector("#rg3-r-n")?.addEventListener("change", (e) => { rn = e.target.value; rhal = 1; urlSet({ rn, rh: "" }); nanti(radar); });
  el.addEventListener("click", (e) => {
    const c = e.target.closest("[data-rj]");
    if (c) { const j = c.dataset.rj; rj.has(j) ? rj.delete(j) : rj.add(j); c.setAttribute("aria-pressed", String(rj.has(j))); rhal = 1; urlSet({ rj: [...rj].join(","), rh: "" }); nanti(radar); return; }
    const h = e.target.closest("#rg3-r-rd [data-hal]"); if (h && !h.disabled) { rhal = +h.dataset.hal; sorotHalaman(h, rhal); urlSet({ rh: rhal > 1 ? rhal : "" }); nanti(radar); }
  });
}
