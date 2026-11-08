/* /baterai-ev: bagian umum tiap tahap: ubin kapasitas, harga, ekspor-impor (UN Comtrade), kebijakan, isu. Data dari baterai_ev.json + berkas yang sudah ada
   (bahan_baku.json, hilirisasi.json, dagang_komponen.json, insentif_fiskal.json). INP: pilihan HS/arah seketika, grafik menyusul lewat nanti(). */
import { D, X, L, t, esc, ikon, num, bukti, luar, bendera, namaNegara, chip, lbl, ex, catatan, daftarCelah, urlGet, urlSet, juta, kapTeks, buktiBe, sumberBe, tautSumber, sumberHtmlBe, tahapData, sumberBerkas } from "/be_umum.js";
import { nanti } from "/inti/umum.js";
import { pilihHtml } from "/inti/komponen.js";
import { batangSvg, garisSvg, legendaHtml, tipHtml, tabel } from "/info_hijau.js";

/* ---------- ubin kapasitas ---------- */
export function bagianKapasitas(id) {
  const td = tahapData(id), k = td?.kapasitas || [];
  if (!k.length) return "";
  return ex({ id: `bev-${id}-kap`, ikon: "grafik", topik: t("bev.ey.kap"), judulHtml: esc(t("bev.j.kap")), subHtml: esc(t("bev.s.kap")),
    isiHtml: `<div class="rg3-kisi">${k.map((x) => `<div class="rg3-kartu bev-ubin"><span class="jm-kh-lbl">${esc(L(x.label))}</span><p class="bev-angka"><b>${esc(num(x.nilai, x.nilai < 10 && x.nilai % 1 ? 1 : 0))}</b><span>${esc(x.satuan)}</span></p><small class="rg3-catat">${esc(t("bev.tahun", { th: x.tahun }))}. ${esc(L(x.catatan))}</small><span class="rg3-ab">${buktiBe(x)}${tautSumber(x.sumber_id)}</span></div>`).join("")}</div>` });
}

/* ---------- harga ---------- */
const HARGA_TAHAP = { tambang: ["nikel"], olah: ["nikel"], prekursor: ["litium"], sel: ["pack", "litium"], kendaraan: ["pack"], bess: ["pack"], daur: ["nikel", "litium"], pengisian: [] };
const deretBahan = (id) => (D.bahan?.deret || []).find((d) => d.id === id) || (id === "litium-karbonat" ? D.bahan?.litium_karbonat : null);
function garisBahan(id, el, kelas) {
  const d = deretBahan(id); if (!d) return;
  const titik = d.titik.map((p) => ({ x: p.x, y: p.y }));
  el.innerHTML = garisSvg({ el, satuan: d.satuan, label: id, anot: [titik[0].x, titik.at(-1).x], seri: [{ id, kelas, label: lbl("bev.hg.l.", id), titik }], ringkas: (x, y, p) => (p ? `${num(((y - p.y) / p.y) * 100, 0)}%` : "") });
}
function batangPack(el) {
  const R = X.be?.harga?.pack || [];
  el.innerHTML = batangSvg({ el, d: 0, label: t("bev.hg.pack"), satuan: t("bev.hg.u.pack"), seri: [{ k: "n", kelas: "rg3-s-dunia" }, { k: "p", kelas: "rg3-s-banding" }],
    baris: R.map((r) => ({ label: L(r.label), ikon: r.k === "bev" ? "kartu" : r.k === "stasioner" ? "sistem-listrik" : r.k === "cn" ? "globe" : r.k === "proyeksi-2026" ? "linimasa" : "petir", tip: `${L(r.label)}: ${r.usd}`,
      th: tipHtml(L(r.label), [[t("bev.hg.harga"), `${num(r.usd, 0)} USD/kWh`], [t("bev.c.bukti"), t("bev.tb." + (r.proyeksi ? "proyeksi" : "kajian"))]]), bagian: [{ k: r.proyeksi ? "p" : "n", nilai: r.usd }] })) });
}
export function bagianHarga(id) {
  const jenis = HARGA_TAHAP[id] || []; if (!jenis.length) return "";
  const H = X.be?.harga || {}, bahan = D.bahan, bag = [];
  if (jenis.includes("nikel") && deretBahan("nikel")) {
    const p = H.nikel_lme?.[0];
    bag.push(`<h3 class="rg3-sub">${esc(t("bev.hg.nikel"))}</h3><div id="bev-${id}-hn" class="ih-bagan"></div>${p ? `<p class="rg3-info rg3-info-ok">${ikon("info", 18)}<span>${esc(t("bev.hg.lme", { v: num(p.y), s: L(p.ket) }))} ${buktiBe(p)} ${tautSumber(p.sumber_id)}</span></p>` : ""}`);
  }
  if (jenis.includes("litium") && deretBahan("litium-karbonat")) {
    const p = H.litium_karbonat_cny?.[0];
    bag.push(`<h3 class="rg3-sub">${esc(t("bev.hg.litium"))}</h3><div id="bev-${id}-hl" class="ih-bagan"></div>${p ? `<p class="rg3-info rg3-info-ok">${ikon("info", 18)}<span>${esc(t("bev.hg.smm", { v: num(p.y), s: L(p.ket) }))} ${buktiBe(p)} ${tautSumber(p.sumber_id)}</span></p>` : ""}`);
  }
  if (jenis.includes("pack") && H.pack?.length) {
    bag.push(`<h3 class="rg3-sub">${esc(t("bev.hg.pack"))}</h3><div id="bev-${id}-hp" class="ih-bagan"></div><p class="rg3-info rg3-info-ok">${ikon("info", 18)}<span>${esc(t("bev.hg.pack_n"))} ${buktiBe(H.pack[0])} ${sumberHtmlBe(H.pack.map((r) => r.sumber_id))}</span></p>`);
  }
  if (!bag.length) return "";
  return ex({ id: `bev-${id}-harga`, ikon: "tag", topik: t("bev.ey.harga"), judulHtml: esc(t("bev.j.harga")), subHtml: esc(t("bev.s.harga")), isiHtml: bag.join("") + catatan("bev.n.harga"), kakiHtml: bahan ? sumberBerkas(bahan, ["s-pinksheet", "s-usgs-li"]) : "" });
}
export function gambarHarga(id, el) {
  const a = el.querySelector(`#bev-${id}-hn`); if (a) garisBahan("nikel", a, "rg3-g-0");
  const b = el.querySelector(`#bev-${id}-hl`); if (b) garisBahan("litium-karbonat", b, "rg3-g-2");
  const c = el.querySelector(`#bev-${id}-hp`); if (c) batangPack(c);
}

/* ---------- ekspor dan impor ---------- */
const NAMA_HS = (hs) => t("bev.hs." + hs);
/** Deret impor/ekspor satu kode HS dari tiga sumber yang ada. Mengembalikan {impor:{th:{usd,mitra}}, ekspor:{...}, sumber, nama(kode)->{iso,nama}}. */
export function seriHS(hs) {
  const out = { impor: {}, ekspor: {}, sumber: "comtrade" };
  const iso = new Map(), pasang = (arr) => { for (const m of arr || []) if (m.iso2) iso.set(m.kode, m.iso2); };
  const baru = (X.be?.dagang?.baris || []).filter((r) => r.hs === hs);
  if (baru.length) { pasang(X.be.dagang.mitra); for (const r of baru) out[r.alir][r.tahun] = { usd: r.usd, mitra: r.mitra.map((m) => ({ iso: iso.get(m.kode), usd: m.usd })).filter((m) => m.iso) }; return out; }
  if (hs === "850760") { pasang(D.dagang?.mitra); for (const r of (D.dagang?.tahunan || []).filter((x) => x.komponen === "baterai")) out[r.alir][r.tahun] = { usd: r.usd, mitra: r.mitra.slice(0, 10).map((m) => ({ iso: iso.get(m.kode), usd: m.usd })).filter((m) => m.iso) }; return out; }
  const e = X.hili?.ekspor?.nilai?.[hs];
  if (e) for (const [th, v] of Object.entries(e)) out.ekspor[th] = { usd: v.usd, mitra: (v.mitra || []).map((m) => ({ iso: m.iso, usd: m.usd })) };
  out.sumber = "hilirisasi";
  return out;
}
let hsKini = {}, arah = "ekspor";
function gambarEkspor(id, el) {
  const hs = hsKini[id], S = seriHS(hs), g = el.querySelector(`#bev-${id}-eg`), m = el.querySelector(`#bev-${id}-em`);
  const seri = ["impor", "ekspor"].map((a, i) => ({ id: a, kelas: i ? "rg3-g-1" : "rg3-g-0", label: t("bev.ex." + a), titik: Object.entries(S[a]).map(([x, v]) => ({ x: +x, y: v.usd / 1e6 })).sort((p, q) => p.x - q.x) })).filter((s) => s.titik.length > 1);
  el.querySelector(`#bev-${id}-el`).innerHTML = legendaHtml(seri.map((s) => ({ id: s.id, kelas: s.kelas, label: s.label })));
  g.innerHTML = seri.length ? garisSvg({ el: g, satuan: t("bev.ex.u"), label: NAMA_HS(hs), seri }) : `<p class="jm-kosong">${esc(t("bev.ex.kosong"))}</p>`;
  const a = S[arah] && Object.keys(S[arah]).length ? arah : (Object.keys(S.ekspor).length ? "ekspor" : "impor"), th = Math.max(...Object.keys(S[a] || {}).map(Number), 0), v = S[a]?.[th];
  const baris = (v?.mitra || []).slice(0, 8);
  m.innerHTML = baris.length ? `<h3 class="rg3-sub">${esc(t("bev.ex.mitra", { a: t("bev.ex." + a), th }))}</h3>` + batangSvg({ el: m, d: 1, label: NAMA_HS(hs), satuan: t("bev.ex.u"), seri: [{ k: "v", kelas: a === "impor" ? "rg3-s-dunia" : "rg3-s-id" }],
    baris: baris.map((r) => ({ label: namaNegara(r.iso), bendera: r.iso, tip: `${namaNegara(r.iso)}: ${juta(r.usd, 2)}`, th: tipHtml(namaNegara(r.iso), [[t("bev.ex.nilai"), `${juta(r.usd, 2)} ${t("bev.ex.u")}`], [t("bev.ex.tahun"), String(th)]], { img: `/img/bendera/${r.iso}.svg` }), bagian: [{ k: "v", nilai: r.usd / 1e6 }] })) }) : "";
}
export function bagianEkspor(id) {
  const hsL = (tahapData(id)?.hs || []).filter((h) => { const s = seriHS(h); return Object.keys(s.impor).length + Object.keys(s.ekspor).length > 1; });
  if (!hsL.length) return "";
  hsKini[id] = hsL.includes(urlGet("hs")) ? urlGet("hs") : hsL[0];
  const pil = pilihHtml({ id: `bev-${id}-hs`, ikon: "tag", label: t("bev.f.hs"), opsi: hsL.map((h) => [h, `${h.replace(/^(\d{4})(\d{2})$/, "$1.$2")} ${NAMA_HS(h)}`, "tag"]), nilai: hsKini[id] });
  const ar = pilihHtml({ id: `bev-${id}-ar`, ikon: "jenis", label: t("bev.f.arah"), opsi: [["ekspor", t("bev.ex.ekspor"), "panah-kanan"], ["impor", t("bev.ex.impor"), "panah-kiri"]], nilai: arah });
  return ex({ id: `bev-${id}-ekspor`, ikon: "kapal", topik: t("bev.ey.ekspor"), judulHtml: esc(t("bev.j.ekspor")), subHtml: esc(t("bev.s.ekspor")),
    isiHtml: `<div class="jm-saring rg3-saring rg3-saring-2">${pil}${ar}</div><div id="bev-${id}-el"></div><div id="bev-${id}-eg" class="ih-bagan"></div><div id="bev-${id}-em" class="ih-bagan"></div><p class="rg3-info rg3-info-ok">${ikon("info", 18)}<span>${esc(t("bev.ex.n"))} ${bukti("resmi", { sumber: "UN Comtrade", tanggal: X.be?.dibangun_pada })} ${luar(X.be?.sumber_comtrade?.url, "UN Comtrade")}</span></p>${catatan("bev.n.ekspor")}` });
}
export function pasangEkspor(id, el) {
  if (!el.querySelector(`#bev-${id}-hs`)) return;
  gambarEkspor(id, el);
  el.querySelector(`#bev-${id}-hs`).addEventListener("change", (e) => { hsKini[id] = e.target.value; urlSet({ hs: hsKini[id] }); nanti(() => gambarEkspor(id, el)); });
  el.querySelector(`#bev-${id}-ar`).addEventListener("change", (e) => { arah = e.target.value; nanti(() => gambarEkspor(id, el)); });
}

/* ---------- kebijakan dan isu ---------- */
const KSTAT = { berlaku: "ok", rencana: "warn", dilaporkan: "warn", "berakhir-2025": "bad", "tidak-ada": "bad" };
export function bagianKebijakan(id) {
  const ids = tahapData(id)?.kebijakan || [], K = (X.be?.kebijakan || []).filter((k) => ids.includes(k.id));
  const ins = id === "kendaraan" ? (X.insentif?.baris || []).filter((r) => /kbl/i.test(r.id)) : [];
  if (!K.length && !ins.length) return "";
  const kartu = K.map((k) => `<article class="rg3-kartu"><div class="rg3-k-kep"><span class="rg3-idk"><b>${esc(L(k.judul))}</b><small>${esc(t("bev.kj2." + k.jenis))} - ${esc(k.tanggal)}</small></span></div>${chip("bev-ks-" + (KSTAT[k.status] || "x"), "", lbl("bev.ks.", k.status))}<p>${esc(L(k.ringkas))}</p><span class="rg3-ab">${buktiBe(k)}${tautSumber(k.sumber_id)}${(k.sumber_lain || []).map(tautSumber).join(" ")}</span>${k.regulasi_id && X.regId?.has(k.regulasi_id) ? `<a class="rg3-tautan" href="/regulasi?id=${encodeURIComponent(k.regulasi_id)}">${ikon("regulasi", 16)} ${esc(t("bev.kb.reg"))}</a>` : ""}</article>`).join("");
  const tbl = ins.length ? `<h3 class="rg3-sub">${esc(t("bev.kb.insentif"))}</h3><div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr><th>${esc(t("bev.kb.c.aturan"))}</th><th>${esc(t("bev.kb.c.jenis"))}</th><th>${esc(t("bev.kb.c.status"))}</th><th>${esc(t("bev.c.bukti"))}</th></tr></thead><tbody>${ins.map((r) => `<tr><td data-label="${esc(t("bev.kb.c.aturan"))}">${r.regulasi_id && X.regId?.has(r.regulasi_id) ? `<a class="rg3-tautan" href="/regulasi?id=${encodeURIComponent(r.regulasi_id)}">${esc(r.nomor_aturan)}</a>` : esc(r.nomor_aturan)}</td><td data-label="${esc(t("bev.kb.c.jenis"))}">${chip("rg3-w" + (r.instrumen === "ppn-dtp" || r.jenis_insentif === "ppn-dtp" ? 3 : 1), "", lbl("bev.ins.", r.jenis_insentif))}</td><td data-label="${esc(t("bev.kb.c.status"))}">${chip("bev-ks-" + (r.status_berlaku === "berlaku" ? "ok" : "x"), "", lbl("bev.ks.", String(r.status_berlaku).replace(/\s+/g, "-")))}</td><td data-label="${esc(t("bev.c.bukti"))}">${bukti(r.tingkat_bukti, { sumber: X.insentif?.sumber?.[0]?.penerbit || "", tanggal: r.tanggal })}</td></tr>`).join("")}</tbody></table></div>` : "";
  return ex({ id: `bev-${id}-kebijakan`, ikon: "palu", topik: t("bev.ey.kebijakan"), judulHtml: esc(t("bev.j.kebijakan", { n: num(K.length + ins.length) })), subHtml: esc(t("bev.s.kebijakan")), isiHtml: (kartu ? `<div class="rg3-kisi">${kartu}</div>` : "") + tbl });
}
export function bagianIsu(id) {
  const I = tahapData(id)?.isu || [];
  if (!I.length) return "";
  const kartu = I.map((i) => `<article class="rg3-kartu bev-isu bev-isu-${esc(i.tingkat)}"><div class="rg3-k-kep"><span class="bev-isu-ik">${ikon(i.tingkat === "tinggi" ? "peringatan" : "info", 20)}</span><span class="rg3-idk"><b>${esc(L(i.judul))}</b></span></div>${chip("bev-it-" + i.tingkat, "", t("bev.it." + i.tingkat))}<p>${esc(L(i.uraian))}</p><span class="rg3-ab">${buktiBe(i)}${tautSumber(i.sumber_id)}${(i.sumber_lain || []).map(tautSumber).join(" ")}</span></article>`).join("");
  return ex({ id: `bev-${id}-isu`, ikon: "peringatan", topik: t("bev.ey.isu"), judulHtml: esc(t("bev.j.isu", { n: num(I.length) })), subHtml: esc(t("bev.s.isu")), isiHtml: `<div class="rg3-kisi">${kartu}</div>` });
}
export const bagianCelah = (id) => (id === "daur" ? ex({ id: "bev-celah", ikon: "tanya", topik: t("bev.ey.celah"), judulHtml: esc(t("bev.j.celah")), subHtml: esc(t("bev.s.celah")), isiHtml: daftarCelah((X.be?.meta?.celah || []).map(L)) }) : "");
