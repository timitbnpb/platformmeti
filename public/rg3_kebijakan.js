/* /rantai-global, tab Kebijakan: kebijakan dagang (AS, UE, Indonesia), perjanjian dagang per HS, simulasi syarat TKDN.
   Sumber: kebijakan_dagang.json, perjanjian_dagang.json, simulasi_tkdn.json + inti/simulasi_tkdn_rumus.js (dimuat dinamis; bila tak ada, bagian simulasi disembunyikan).
   Hasil simulasi = Hipotesis. INP: pilihan syarat seketika, hitung dan tabel menyusul lewat nanti(). */
import { D, berisi, ex, t, esc, ikon, num, bukti, luar, cariSumber, kosongTab, urlGet, urlSet, sumberBerkas, catatan, daftarCelah, bendera, namaNegara, chip, warnaIdx, lbl } from "/rg3_umum.js";
import { nanti } from "/inti/umum.js";
import { pilihHtml } from "/inti/komponen.js";
import { pasangPilih } from "/inti/pilih.js";
import { batangSvg, legendaHtml, tabel, tipHtml } from "/info_hijau.js";

let kf = { neg: "", jenis: "" }, tp = "", sm = { m: 0, i: 0 }, rumus = null;
const KD = () => D.kebijakan?.baris || [];
const sumberKd = (b) => cariSumber(D.kebijakan, b.sumber_id);

/* ---------- kebijakan dagang ---------- */
const lolos = (b) => (!kf.neg || b.negara === kf.neg) && (!kf.jenis || b.jenis === kf.jenis);
function bagan() {
  const el = document.getElementById("rg3-k-g"), jenis = [...new Set(KD().map((b) => b.jenis))], per = new Map();
  for (const b of KD().filter(lolos)) { const o = per.get(b.negara) || { n: b.negara, j: {} }; o.j[b.jenis] = (o.j[b.jenis] || 0) + 1; per.set(b.negara, o); }
  const B = [...per.values()].sort((a, b) => Object.values(b.j).reduce((x, y) => x + y, 0) - Object.values(a.j).reduce((x, y) => x + y, 0));
  document.getElementById("rg3-k-leg").innerHTML = legendaHtml(jenis.filter((j) => B.some((o) => o.j[j])).map((j) => ({ kelas: "rg3-g-" + warnaIdx(j), label: lbl("rg3.kd.j.", j) })));
  el.innerHTML = B.length ? batangSvg({ el, d: 0, label: t("rg3.k.ey.kd"), satuan: t("rg3.k.u"), seri: jenis.map((j) => ({ k: j, kelas: "rg3-g-" + warnaIdx(j) })),
    baris: B.map((o) => ({ label: namaNegara(o.n), bendera: o.n, tip: `${namaNegara(o.n)}`, th: tipHtml(namaNegara(o.n), jenis.filter((j) => o.j[j]).map((j) => [lbl("rg3.kd.j.", j), String(o.j[j])]), { img: `/img/bendera/${o.n}.svg` }), bagian: jenis.map((j) => ({ k: j, nilai: o.j[j] || 0 })) })) }) : "";
}
function tabelKd() {
  const B = KD().filter(lolos), el = document.getElementById("rg3-k-tb");
  if (!B.length) { el.innerHTML = `<p class="jm-kosong">${esc(t("rg3.k.kosong"))}</p>`; return; }
  tabel(el, { satuan: "rg3.k.u", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("rg3.k.c.negara"), v: (b) => namaNegara(b.negara), f: (b) => `<span class="rg3-neg">${bendera(b.negara, 18)}<b>${esc(namaNegara(b.negara))}</b></span>` },
    { label: t("rg3.k.c.jenis"), v: (b) => b.jenis, f: (b) => chip("rg3-w" + warnaIdx(b.jenis), "", lbl("rg3.kd.j.", b.jenis)) },
    { label: t("rg3.k.c.produk"), v: (b) => b.produk, f: (b) => `<span class="rg3-idk"><b>${esc(b.produk)}</b>${(b.hs || []).length ? `<small>HS ${esc(b.hs.join(", "))}</small>` : ""}</span>` },
    { label: t("rg3.k.c.besaran"), v: (b) => b.besaran || "", f: (b) => `<span class="rg3-teks">${esc(b.besaran || "-")}</span>${(b.sasaran || []).some((s) => s.negara === "id") ? `<span class="rg3-id-tanda">${bendera("id", 14)}${esc(t("rg3.k.kena_id", { n: num(Math.max(...b.sasaran.filter((s) => s.negara === "id" && s.tarif_pct != null).map((s) => s.tarif_pct), 0), 2) }))}</span>` : ""}` },
    { label: t("rg3.k.c.status"), v: (b) => b.status || "", f: (b) => `<span class="rg3-teks">${esc(b.status || "-")}</span>` },
    { label: t("rg3.k.c.tgl"), v: (b) => b.tanggal_putusan || b.tanggal_efektif || "", f: (b) => `<span class="rg3-tg">${esc(b.tanggal_putusan || b.tanggal_efektif || "-")}</span>` },
    { label: t("rg3.h.bukti"), v: (b) => b.tingkat_bukti || "", f: (b) => `<span class="rg3-sm">${bukti(b.tingkat_bukti, { sumber: sumberKd(b)?.penerbit || "", tanggal: b.tanggal })}${b.sumber_url ? luar(b.sumber_url, sumberKd(b)?.penerbit || t("rg3.pr.buka")) : ""}</span>` },
  ], baris: B });
}
function dampak() {
  const d = D.kebijakan?.dampak, e = d?.ekspor_surya_ke_as; if (!e?.length) return "";
  const last = e.at(-1), pangsa = last.usd_total ? (last.usd_as / last.usd_total) * 100 : null;
  return `<div class="rg3-info rg3-info-bad">${ikon("peringatan", 18)}<p>${esc(t("rg3.k.dampak", { th: last.tahun, as: num(last.usd_as / 1e6, 0), p: num(pangsa, 0), n: (d.perusahaan_terdampak || []).join(", ") }))} ${bukti("resmi", { sumber: d.sumber_nilai })}</p></div>`;
}

/* ---------- perjanjian dagang ---------- */
const PJ = () => D.perjanjian?.baris || [];
function perjanjian() {
  const L = D.perjanjian?.perjanjian || [];
  return `<ul class="rg3-pj">${L.filter((p) => p.id !== "mfn").map((p) => `<li class="rg3-pj-k"><b>${esc((p.id || "").toUpperCase())}</b><small>${(p.mitra || []).map((m) => bendera(m, 16)).join("")}</small><span class="jm-pil ${/^berlaku/.test(p.status) ? "jm-pil-ok" : "jm-pil-warn"}">${esc(/^berlaku/.test(p.status) ? t("rg3.k.pj.berlaku") : t("rg3.k.pj.belum"))}</span></li>`).join("")}</ul>`;
}
function tabelPj() {
  const el = document.getElementById("rg3-k-pj"), B = PJ(); if (!el || !B.length) return;
  tabel(el, { satuan: "rg3.k.u_hs", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: "HS", v: (b) => b.hs6, f: (b) => `<b>${esc(b.hs8 || b.hs6)}</b>` },
    { label: t("rg3.k.c.produk"), v: (b) => b.uraian, f: (b) => `<span class="rg3-teks">${esc(b.uraian)}</span>${b.repr === false ? `<small class="rg3-catat">${esc(t("rg3.k.tak_repr"))}</small>` : ""}` },
    { label: "MFN", num: true, v: (b) => b.mfn, f: (b) => (b.mfn == null ? `<span class="ih-kosong">${esc(t("rg3.pr.belum"))}</span>` : `<b>${esc(num(b.mfn, 1))}%</b>`) },
    { label: t("rg3.k.c.pref"), v: (b) => Math.min(...(b.pref || []).map((p) => p.pct ?? 99), 99), f: (b) => ((b.pref || []).length ? `<span class="rg3-chips">${b.pref.map((p) => `<span class="rg3-chip ${p.tingkat_bukti === "belum-diperiksa" ? "rg3-chip-pudar" : "rg3-w" + warnaIdx(p.perjanjian)}">${(p.mitra || []).slice(0, 3).map((m) => bendera(m, 14)).join("")}<span>${esc(p.perjanjian.toUpperCase())} ${esc(num(p.pct, 1))}%</span></span>`).join("")}</span>` : `<span class="ih-kosong">${esc(t("rg3.pr.belum"))}</span>`) },
    { label: t("rg3.h.bukti"), v: (b) => b.tingkat_bukti || "", f: (b) => `<span class="rg3-sm">${bukti(b.tingkat_bukti, { tanggal: b.tanggal })}${b.sumber_url ? luar(b.sumber_url, t("rg3.pr.buka")) : ""}</span>` },
  ], baris: B });
}
function termurah() {
  const T = D.perjanjian?.termurah || [], el = document.getElementById("rg3-k-tm"); if (!el || !T.length) return;
  const x = T.find((o) => o.produk_id === tp) || T[0]; tp = x.produk_id;
  const bar = x.opsi.map((o) => ({ ...o })).sort((a, b) => a.usd_setelah_bea - b.usd_setelah_bea);
  const d = bar.some((o) => o.usd_setelah_bea < 1) ? 3 : 2;
  el.innerHTML = `<div id="rg3-k-tmg" class="ih-bagan"></div><p class="jm-bantu ih-catatan">${esc(x.catatan || "")}</p>`;
  const g = document.getElementById("rg3-k-tmg");
  g.innerHTML = legendaHtml([{ kelas: "rg3-s-fob", label: t("rg3.k.fob") }, { kelas: "rg3-s-bm", label: t("rg3.k.bea") }]) + batangSvg({ el: g, d, label: t("rg3.k.ey.termurah"), satuan: x.satuan, seri: [{ k: "fob", kelas: "rg3-s-fob" }, { k: "bm", kelas: "rg3-s-bm" }],
    baris: bar.map((o) => ({ label: `${namaNegara(o.negara)}: ${o.pasar}`, bendera: o.negara, tip: `${namaNegara(o.negara)}: ${o.usd_setelah_bea}`,
      th: tipHtml(namaNegara(o.negara), [[o.pasar, ""], [t("rg3.k.fob"), `${num(o.usd, d)} ${x.satuan}`], [t("rg3.k.bea"), `${num(o.bea_pct, 1)}%`], [t("rg3.k.setelah"), `${num(o.usd_setelah_bea, d)} ${x.satuan}`], [t("rg3.h.tanggal"), o.tanggal || "-"]], { img: `/img/bendera/${o.negara}.svg` }),
      bagian: [{ k: "fob", nilai: o.usd }, { k: "bm", nilai: Math.max(0, o.usd_setelah_bea - o.usd) }] })) });
}

/* ---------- simulasi TKDN ---------- */
function masukan() {
  const s = D.simulasi?.asumsi, sr = D.simulasi?.sertifikat; if (!s || !sr || !rumus) return null;
  const k = (o) => ({ usdW: o.usd_w.nilai, premiRef: o.premi_ref.nilai, tkdnRef: o.tkdn_ref.nilai, kapasitasGw: o.kapasitas_gw_tahun?.nilai ?? null, kebutuhanGw: o.kebutuhan_gw_tahun.nilai });
  const { tingkat_bukti, catatan: _c, ...keu } = s.keuangan;
  return { a: { capexDasarRpKwp: s.capex_dasar_rp_kwp.nilai, kurs: s.kurs_rp_usd.nilai, modul: { ...k(s.modul), sertifikat: sr.modul?.tkdn_persen || [] }, inverter: { ...k(s.inverter), sertifikat: sr.inverter?.tkdn_persen || [] } }, keu };
}
const pp = (x) => (x == null ? "-" : `${x > 0 ? "+" : ""}${num(x * 100, 2)}`);
function simulasi() {
  const el = document.getElementById("rg3-k-sim"), M = masukan(); if (!el || !M) return;
  const r = rumus.simulasi(M.a, M.keu, sm.m, sm.i), c = r.capex, rp = (v) => esc(`Rp ${num(v / 1e6, 2)} ${t("rg3.r.juta")}`), h = (kunci, par) => bukti("hipotesis", { cara: t(kunci, par) });
  const pM = c.modul.pasokan || {}, pI = c.inverter.pasokan || {}, syM = D.simulasi.syarat_uji.modul, syI = D.simulasi.syarat_uji.inverter;
  const kelasHm = (d) => (d == null ? "rg3-hm-x" : d >= -0.0005 ? "rg3-hm-0" : d > -0.01 ? "rg3-hm-1" : d > -0.02 ? "rg3-hm-2" : d > -0.04 ? "rg3-hm-3" : "rg3-hm-4");
  const peta = rumus.peta(M.a, M.keu, syM, syI);
  el.innerHTML = `<ul class="rg3-ubin rg3-ubin-4">
    <li class="rg3-ub"><span class="jm-kpi-ik">${ikon("kartu", 18)}</span><b>${rp(c.capexPatuh)}</b><small>${esc(t("rg3.k.s.capex_patuh"))}</small><small>${esc(t("rg3.k.s.dasar", { v: num(M.a.capexDasarRpKwp, 0) }))}</small>${h("rg3.k.s.cara_capex")}</li>
    <li class="rg3-ub"><span class="jm-kpi-ik">${ikon("kartu", 18)}</span><b>${rp(c.capexCampur)}</b><small>${esc(t("rg3.k.s.capex_campur"))}</small>${h("rg3.k.s.cara_campur")}</li>
    <li class="rg3-ub"><span class="jm-kpi-ik">${ikon("grafik", 18)}</span><b>${esc(pp(r.irr.deltaPatuh))} pp</b><small>${esc(t("rg3.k.s.irr"))}</small><small>${esc(t("rg3.k.s.irr_dasar", { v: num((r.irr.dasar.irrProyek ?? 0) * 100, 2) }))}</small>${h("rg3.k.s.cara_irr")}</li>
    <li class="rg3-ub"><span class="jm-kpi-ik">${ikon("pabrik", 18)}</span><b>${pM.cakupan == null ? esc(t(sm.m ? "rg3.pr.belum" : "rg3.k.f.tanpa")) : esc(num(pM.cakupan * 100, 0)) + "%"}</b><small>${esc(t("rg3.k.s.cakupan"))}</small><small>${pM.pangsa == null ? "" : esc(t("rg3.k.s.pangsa", { p: num(pM.pangsa * 100, 0) }))}</small>${h("rg3.k.s.cara_pasokan")}</li></ul>
    <h3 class="rg3-sub">${esc(t("rg3.k.s.peta"))}</h3>
    <div class="jm-gulir"><table class="jm-tabel rg3-hm" data-urut="tidak"><thead><tr><th>${esc(t("rg3.k.s.m_i"))}</th>${syI.map((i) => `<th class="jm-num">${esc(i)}%</th>`).join("")}</tr></thead><tbody>${syM.map((m) => `<tr><th scope="row">${esc(m)}%</th>${syI.map((i) => { const x = peta.find((p) => p.tkdnModul === m && p.tkdnInverter === i), d = x?.irr?.deltaPatuh; return `<td class="jm-num ${kelasHm(d)}${m === sm.m && i === sm.i ? " rg3-hm-on" : ""}" data-label="${esc(i)}%"><button type="button" class="rg3-hm-b" data-sm="${m}" data-si="${i}" title="${esc(t("rg3.k.s.pilih"))}">${esc(pp(d))}</button></td>`; }).join("")}</tr>`).join("")}</tbody></table></div>
    <p class="jm-bantu ih-catatan">${esc(t("rg3.k.s.n_peta"))}</p>`;
}
const ASUMSI_CELAH = () => daftarCelah(D.simulasi?.celah);

export async function mulai(el) {
  if (!berisi("kebijakan") && !berisi("perjanjian") && !D.simulasi) { el.innerHTML = kosongTab("rg3.k.kosong_data"); return; }
  kf = { neg: urlGet("kn"), jenis: urlGet("kj") }; tp = urlGet("kp"); sm = { m: +urlGet("km") || 0, i: +urlGet("ki") || 0 };
  try { rumus = await import("/inti/simulasi_tkdn_rumus.js"); } catch { rumus = null; }
  const nSim = !!(D.simulasi?.asumsi && rumus), neg = [...new Set(KD().map((b) => b.negara))], jenis = [...new Set(KD().map((b) => b.jenis))], T = D.perjanjian?.termurah || [];
  const nNeg = (n) => KD().filter((b) => b.negara === n).length, nJ = (j) => KD().filter((b) => b.jenis === j).length;
  const syar = D.simulasi?.syarat_uji || { modul: [], inverter: [] };
  el.innerHTML = [
    berisi("kebijakan") ? ex({ id: "rg3-k-dagang", ikon: "palu", topik: t("rg3.k.ey.kd"), judulHtml: esc(t("rg3.k.j.kd", { n: num(KD().length), m: num(neg.length) })), subHtml: esc(t("rg3.k.s.kd")),
      isiHtml: `${dampak()}<div class="jm-saring rg3-saring rg3-saring-2">${pilihHtml({ id: "rg3-k-n", ikon: "globe", label: t("rg3.p.f.neg"), opsi: [["", t("rg3.p.f.neg"), "globe"], ...neg.map((n) => [n, namaNegara(n), "img:/img/bendera/" + n + ".svg", nNeg(n)])], nilai: kf.neg })}${pilihHtml({ id: "rg3-k-j", ikon: "jenis", label: t("rg3.k.f.jenis"), opsi: [["", t("rg3.k.f.jenis"), "jenis"], ...jenis.map((j) => [j, lbl("rg3.kd.j.", j), "palu", nJ(j)])], nilai: kf.jenis })}</div><div id="rg3-k-leg"></div><div id="rg3-k-g" class="ih-bagan"></div><div id="rg3-k-tb"></div>${daftarCelah(D.kebijakan.celah)}`, kakiHtml: sumberBerkas(D.kebijakan) }) : "",
    berisi("perjanjian") ? ex({ id: "rg3-k-pj-ex", ikon: "tag", topik: t("rg3.k.ey.pj"), judulHtml: esc(t("rg3.k.j.pj", { n: num(PJ().length) })), subHtml: esc(t("rg3.k.s.pj")),
      isiHtml: `${perjanjian()}<div id="rg3-k-pj"></div>${T.length ? `<h3 class="rg3-sub">${esc(t("rg3.k.ey.termurah"))}</h3><div class="jm-saring rg3-saring rg3-saring-1">${pilihHtml({ id: "rg3-k-tp", ikon: "tag", label: t("rg3.h.f.produk"), opsi: T.map((o) => [o.produk_id, (D.harga?.produk || []).find((p) => p.id === o.produk_id)?.nama || o.produk_id, "tag"]), nilai: tp })}</div><div id="rg3-k-tm"></div>` : ""}${catatan("rg3.k.n.pj")}${daftarCelah(D.perjanjian.celah)}`, kakiHtml: sumberBerkas(D.perjanjian) }) : "",
    nSim ? ex({ id: "rg3-k-simulasi", ikon: "kalkulator", topik: t("rg3.k.ey.sim"), judulHtml: esc(t("rg3.k.j.sim")), subHtml: esc(t("rg3.k.s.sim")),
      isiHtml: `<div class="jm-saring rg3-saring rg3-saring-2">${pilihHtml({ id: "rg3-k-sm", ikon: "tek:surya", label: t("rg3.k.f.syarat_m"), opsi: syar.modul.map((v) => [String(v), v ? t("rg3.k.f.syarat", { v }) : t("rg3.k.f.tanpa"), "tek:surya"]), nilai: String(sm.m) })}${pilihHtml({ id: "rg3-k-si", ikon: "petir", label: t("rg3.k.f.syarat_i"), opsi: syar.inverter.map((v) => [String(v), v ? t("rg3.k.f.syarat", { v }) : t("rg3.k.f.tanpa"), "petir"]), nilai: String(sm.i) })}</div><div id="rg3-k-sim"></div>${catatan("rg3.k.n.sim")}${ASUMSI_CELAH()}`, kakiHtml: sumberBerkas(D.simulasi) }) : "",
  ].join("");
  pasangPilih();
  if (berisi("kebijakan")) { bagan(); tabelKd(); }
  nanti(() => { tabelPj(); termurah(); simulasi(); });
  const ubah = (id, f) => el.querySelector("#" + id)?.addEventListener("change", (e) => { f(e.target.value); });
  ubah("rg3-k-n", (v) => { kf.neg = v; urlSet({ kn: v }); nanti(() => { bagan(); tabelKd(); }); });
  ubah("rg3-k-j", (v) => { kf.jenis = v; urlSet({ kj: v }); nanti(() => { bagan(); tabelKd(); }); });
  ubah("rg3-k-tp", (v) => { tp = v; urlSet({ kp: v }); nanti(termurah); });
  const sel = (m, i) => { sm = { m, i }; urlSet({ km: m || "", ki: i || "" }); for (const [id, v] of [["rg3-k-sm", m], ["rg3-k-si", i]]) { const s = el.querySelector("#" + id); if (s && s.value !== String(v)) { s.value = String(v); s.dispatchEvent(new Event("jm:segar")); } } nanti(simulasi); };
  ubah("rg3-k-sm", (v) => sel(+v, sm.i)); ubah("rg3-k-si", (v) => sel(sm.m, +v));
  el.addEventListener("click", (e) => { const b = e.target.closest("[data-sm]"); if (b) sel(+b.dataset.sm, +b.dataset.si); });
}
