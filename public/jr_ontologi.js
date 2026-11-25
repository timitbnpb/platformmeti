/* /jaringan?tab=ontologi (KJ-06): tujuh pelat isometrik, penelusuran objek, jejak, tabel per lapis.
   Kontrak: docs/perencanaan/KEMBARAN-JARINGAN.md §3, §6 butir 2, 7, 10. Hitungan terkait ada di /jr_ontologi_hitung.js (murni).
   INP: chrome (aria, jejak, label) berubah sinkron di handler; sorot SVG dan tabel ditunda lewat nanti(). SVG digambar sekali, sorot lewat kelas. */
import { t, esc, num, ikon } from "/jr_umum.js";
import { nanti, debounce } from "/inti/umum.js";
import { cariHtml, pilihHtml, hitungHtml } from "/inti/komponen.js";
import { muatKJ, kakiFakta, gabungObjek } from "/jr_kj.js";
import { LAPIS, bangunIndeks, terkait, lapisBawaan, langkahJejak, potongJejak, saring, urut, sederhana } from "/jr_ontologi_hitung.js";

/* geometri pelat: koordinat lokal 0..PW x 0..PH, miring lewat matrix (SK = geser, SY = pipih) */
const PW = 520, PH = 200, LNG0 = 94.5, LAT0 = 6.5, SC = PW / 47, SK = 0.9, SY = 0.42, GAP = 100, TOP = 14, LABW = 220, EX = LABW + 40 + SK * PH, VBW = 980, TB = 7;
const VBH = TOP + 6 * GAP + PH * SY + TB + 10, HAL = 50;
const r1 = (n) => Math.round(n * 10) / 10;
const lok = (lng, lat) => [(lng - LNG0) * SC, (LAT0 - lat) * SC];
const proj = (i, p) => [r1(p[0] - SK * p[1] + EX), r1(p[1] * SY + TOP + i * GAP)];
const garis = (pts) => "M" + pts.map((p) => r1(p[0]) + " " + r1(p[1])).join("L");
const REL = { op: "mengelola", sis: "mencakup", prov: "berisi", pb: "tersambung", gi: "dihubungkan", jl: "terdiri", rs: "" };
const KELAS = { 500: "k5", "230-275": "k2", "115-150": "k1" };

const n0 = (v, d) => (v ? num(v, d) : "-");
/* kolom tabel per lapis (§6.7): k = kunci kamus, v = nilai urut, h = sel, n = numerik */
const KOLOM = (c) => ({
  op: [{ k: "nama" }, { k: "km", v: (x) => x.km || null, h: (x) => n0(x.km, 1), n: 1 }, { k: "gardu", v: (x) => x.gi || null, h: (x) => n0(x.gi), n: 1 }, { k: "mw", v: (x) => x.mw || null, h: (x) => n0(x.mw), n: 1 }],
  sis: [{ k: "nama" }, { k: "km", v: (x) => x.km || null, h: (x) => n0(x.km, 1), n: 1 }, { k: "gardu", v: (x) => x.gi || null, h: (x) => n0(x.gi), n: 1 }, { k: "mw_pln", v: (x) => x.mw_pln || null, h: (x) => n0(x.mw_pln), n: 1 }, { k: "mva_sis", v: (x) => x.mva || null, h: (x) => n0(x.mva), n: 1 }, { k: "kv_maks", v: (x) => x.kv_maks || null, h: (x) => n0(x.kv_maks), n: 1 }],
  prov: [{ k: "nama" }, { k: "km", v: (x) => x.km || null, h: (x) => n0(x.km, 1), n: 1 }, { k: "gardu", v: (x) => x.gi || null, h: (x) => n0(x.gi), n: 1 }, { k: "mva", v: (x) => x.mva || null, h: (x) => n0(x.mva), n: 1 }, { k: "pulau", v: (x) => x.pulau, h: (x) => esc(x.pulau) }],
  pb: [{ k: "nama" }, { k: "bb", v: (x) => bb(x.jenis), h: (x) => esc(bb(x.jenis)) }, { k: "mw", v: (x) => x.mw || null, h: (x) => n0(x.mw), n: 1 }, { k: "unit", v: (x) => x.tahun, h: (x) => (x.tahun ? esc(x.tahun) : "-"), n: 1 }, { k: "sis", v: (x) => c.sisNama(x.sis), h: (x) => esc(c.sisNama(x.sis) || "-") }],
  gi: [{ k: "nama" }, { k: "kv", v: (x) => x.kv, h: (x) => num(x.kv), n: 1 }, { k: "mva", v: (x) => x.mva || null, h: (x) => n0(x.mva), n: 1 }, { k: "sis", v: (x) => c.sisNama(x.sis), h: (x) => esc(c.sisNama(x.sis) || "-") }, { k: "prov", v: (x) => c.provNama(x.prov), h: (x) => esc(c.provNama(x.prov) || "-") }, { k: "jalur_masuk", v: (x) => x.jl.length, h: (x) => num(x.jl.length), n: 1 }],
  jl: [{ k: "nama" }, { k: "kv", v: (x) => x.kv, h: (x) => num(x.kv), n: 1 }, { k: "sirkit", v: (x) => x.sirkit, h: (x) => (x.sirkit ? num(x.sirkit) : "-"), n: 1 }, { k: "km", v: (x) => x.km || null, h: (x) => n0(x.km, 1), n: 1 }, { k: "tunggal", v: (x) => (x.tunggal ? 1 : 0), h: (x) => esc(t(x.tunggal ? "kj.ont.ya" : "kj.ont.tidak")) }],
  rs: [{ k: "nama" }, { k: "kv", v: (x) => x.kv, h: (x) => num(x.kv), n: 1 }, { k: "sirkit", v: (x) => x.sirkit, h: (x) => (x.sirkit ? num(x.sirkit) : "-"), n: 1 }, { k: "km", v: (x) => x.km || null, h: (x) => n0(x.km, 1), n: 1 }],
});
const BAWAAN = { op: ["mw", -1], sis: ["km", -1], prov: ["nama", 1], pb: ["mw", -1], gi: ["kv", -1], jl: ["km", -1], rs: ["km", -1] };
const bb = (j) => (j ? t("kj.ont.bb." + j) : "");

export async function mulai(panel) {
  const [inti, geo, ringkasKJ, gprov] = await Promise.all([muatKJ("inti"), muatKJ("geo"), muatKJ("ringkas"), fetch("/geo/provinsi.json", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)).catch(() => null)]);
  if (!inti?.gi?.length) { panel.innerHTML = `<div class="jm-galat" role="status">${ikon("peringatan", 32)}<p>${esc(t("kj.ont.galat"))}</p></div>`; return; }
  let ix = bangunIndeks(inti); const S = { jejak: [], hasil: null, lapis: "op", q: "", sis: "", prov: "", urut: {}, hal: 0 };
  const lap = (l) => t("kj.ont.l." + l), tgl = ringkasKJ?.meta?.tanggal || "";

  /* ---- nama ---- */
  const cacheNama = new Map();
  const nmId = (id) => { const g = ix.per.gi.get(id); return g ? nm(g, "gi") : t("kj.ont.simpang"); };
  const nm = (x, l) => {
    let s = cacheNama.get(x.id);
    if (s === undefined) {
      s = x.nama || (l === "gi" ? t("kj.ont.gi_tanpa_nama", { kv: x.kv }) : l === "rs" ? (ix.per.jl.get(x.jl)?.nama || t("kj.ont.ruas_tanpa_nama", { id: String(x.id).replace(/^rs_/, "") })) : l === "jl" ? t("kj.ont.ke", { a: nmId(x.a), b: nmId(x.b) }) : x.id);
      cacheNama.set(x.id, s);
    }
    return s;
  };
  const objNama = (id) => nm(ix.per[ix.lap.get(id)].get(id), ix.lap.get(id));
  const ctx = { sisNama: (id) => (id ? ix.per.sis.get(id)?.nama || "" : ""), provNama: (p) => (p ? ix.per.prov.get("prov_" + p)?.nama || "" : "") };
  const kolom = KOLOM(ctx);

  /* ---- kerangka ---- */
  const opsiSis = [["", t("kj.ont.semua_sis")], ...[...ix.per.sis.values()].filter((s) => !s.potongan).sort((a, b) => a.nama.localeCompare(b.nama)).map((s) => [s.id, s.nama])];
  const opsiProv = [["", t("kj.ont.semua_prov")], ...[...ix.per.prov.values()].sort((a, b) => a.nama.localeCompare(b.nama)).map((p) => [p.kode, p.nama])];
  panel.innerHTML = `<div class="jm-ont">
  <header class="jm-ont-kep"><h2>${esc(t("kj.ont.judul"))}</h2><p>${esc(t("kj.ont.lead"))}</p></header>
  <div class="jm-ont-grid">
    <section class="jm-ont-kiri" aria-label="${esc(t("kj.ont.tumpuk_aria"))}">
      <div class="jm-ont-tumpuk" id="ontTumpuk">
        <svg class="jm-ont-svg" id="ontSvg" viewBox="0 0 ${VBW} ${VBH}" role="img" aria-label="${esc(t("kj.ont.tumpuk_aria"))}"></svg>
        ${LAPIS.map((l, i) => `<button type="button" class="jm-ont-lb" data-lapis="${l}" aria-pressed="false">
          <span class="jm-ont-ln">${esc(t("kj.ont.lapis", { n: i + 1 }))}</span><b>${esc(lap(l))}</b><span class="jm-ont-j" data-j="${l}">${esc(t("kj.ont.hitung_semua", { n: num(ix.per[l].size) }))}</span>${REL[l] ? `<span class="jm-ont-rel">${esc(t("kj.ont.rel." + l))}</span>` : ""}</button>`).join("")}
        <div class="jm-ont-tip" id="ontTip" role="tooltip" hidden></div>
      </div>
      <p class="jm-ont-cat">${esc(t("kj.ont.catatan"))}</p>
      ${kakiFakta("hitung", ["osm-power", "gem-gcpt"], tgl)}
    </section>
    <section class="jm-ont-kanan" aria-live="polite">
      <nav class="jm-ont-jejak" id="ontJejak" aria-label="${esc(t("kj.ont.jejak_aria"))}"></nav>
      <a class="jm-tbl jm-tbl-kecil jm-ont-peta" id="ontPeta" hidden></a>
      <h3 class="jm-ont-judul" id="ontJudul"></h3>
      <div class="jm-saring" id="ontSaring">
        ${cariHtml({ id: "ontCari", label: t("kj.ont.cari"), placeholder: t("kj.ont.cari") })}
        <span id="ontFSis">${pilihHtml({ id: "ontSis", ikon: "sistem-listrik", label: t("kj.ont.sis_label"), opsi: opsiSis })}</span>
        <span id="ontFProv">${pilihHtml({ id: "ontProv", ikon: "peta", label: t("kj.ont.prov_label"), opsi: opsiProv })}</span>
        ${hitungHtml({ id: "ontHitung", teks: "" })}
      </div>
      <div id="ontTabel"></div>
    </section>
  </div></div>`;
  const $ = (id) => panel.querySelector("#" + id);
  const svg = $("ontSvg"), tip = $("ontTip");

  /* ---- chrome sinkron ---- */
  const idxLapis = (l) => LAPIS.indexOf(l);
  function chrome() {
    const sel = S.jejak.at(-1);
    for (const b of panel.querySelectorAll(".jm-ont-lb")) {
      const l = b.dataset.lapis, j = b.querySelector(".jm-ont-j");
      b.setAttribute("aria-pressed", String(l === S.lapis));
      const n = S.hasil ? S.hasil[l].length : 0;
      j.textContent = S.hasil ? t("kj.ont.terkait", { n: num(n) }) : t("kj.ont.hitung_semua", { n: num(ix.per[l].size) });
      j.classList.toggle("on", !!S.hasil && n > 0);
    }
    for (const g of svg.querySelectorAll(".jm-ont-p")) g.classList.toggle("aktif", g.dataset.lapis === S.lapis);
    for (const b of panel.querySelectorAll(".jm-ont-lb")) b.classList.toggle("aktif", b.dataset.lapis === S.lapis);
    $("ontJejak").innerHTML = `<ol><li>${sel ? `<button type="button" data-jejak="-1">${esc(t("kj.ont.jejak_akar"))}</button>` : `<span aria-current="step">${esc(t("kj.ont.jejak_akar"))}</span>`}</li>${S.jejak.map((id, i) => `<li>${i === S.jejak.length - 1 ? `<span aria-current="step"><small>${esc(lap(ix.lap.get(id)))}</small> ${esc(objNama(id))}</span>` : `<button type="button" data-jejak="${i}"><small>${esc(lap(ix.lap.get(id)))}</small> ${esc(objNama(id))}</button>`}</li>`).join("")}</ol>`;
    const a = $("ontPeta");
    a.hidden = !sel;
    if (sel) { a.href = "?tab=peta&fokus=" + encodeURIComponent(sel); a.innerHTML = ikon("peta", 16) + esc(t("kj.ont.buka_peta", { nama: objNama(sel) })); }
    $("ontJudul").textContent = sel ? t("kj.ont.judul_terkait", { lapis: lap(S.lapis), objek: objNama(sel) }) : lap(S.lapis);
    const f = idxLapis(S.lapis) >= 3;
    $("ontFSis").hidden = $("ontFProv").hidden = !f;
  }

  /* ---- tabel ---- */
  const idsLapis = () => (S.hasil ? S.hasil[S.lapis] : [...ix.per[S.lapis].entries()].filter(([, x]) => !x.potongan).map(([id]) => id));
  const nPotongan = () => (S.hasil || S.lapis !== "sis" ? 0 : [...ix.per.sis.values()].filter((x) => x.potongan).length);
  function kalimatKosong() {
    const sel = S.jejak.at(-1), ob = sel && ix.per[ix.lap.get(sel)].get(sel), lo = sel && ix.lap.get(sel), tg = S.lapis;
    if (!sel) return t("kj.ont.kosong.lapis", { lapis: lap(tg).toLowerCase() });
    const jaringan = ["sis", "gi", "jl", "rs"].includes(tg);
    if (lo === "pb" && jaringan && !ob.gi) return t("kj.ont.kosong.pb_lepas");
    if (lo === "op" && jaringan) return t("kj.ont.kosong.op");
    if (lo === "prov" && jaringan) return t("kj.ont.kosong.prov");
    return t("kj.ont.kosong.umum", { lapis: lap(tg).toLowerCase(), objek: objNama(sel) });
  }
  function tabel() {
    const l = S.lapis, kols = kolom[l], ur = S.urut[l] || BAWAAN[l], f = idxLapis(l) >= 3;
    const semua = idsLapis();
    const tampil = saring(ix, semua, l, { q: S.q, sis: f ? S.sis : "", prov: f ? S.prov : "", nama: nm });
    const mapKol = Object.fromEntries(kols.map((k) => [k.k, k]));
    const kk = mapKol[ur[0]] || kols[0], nilai = kk.v ? (id) => kk.v(ix.per[l].get(id)) : (id) => nm(ix.per[l].get(id), l);
    const urutan = urut(tampil, nilai, ur[1]);
    const hal = Math.min(S.hal, Math.max(0, Math.ceil(urutan.length / HAL) - 1)), irisan = urutan.slice(hal * HAL, (hal + 1) * HAL);
    $("ontHitung").textContent = tampil.length === semua.length ? t("kj.ont.hitung_semua", { n: num(semua.length) }) : t("kj.ont.hitung", { a: num(tampil.length), b: num(semua.length) });
    const wadah = $("ontTabel");
    if (!irisan.length) { wadah.innerHTML = `<div class="jm-ont-kosong">${ikon("info", 20)}<p>${esc(S.q || S.sis || S.prov ? t("kj.ont.kosong.saring", { lapis: lap(l).toLowerCase() }) : kalimatKosong())}</p></div>`; return; }
    const th = kols.map((k) => `<th scope="col" aria-sort="${k.k === kk.k ? (ur[1] > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-kol="${k.k}">${esc(t("kj.ont.kol." + k.k))}</button></th>`).join("") + `<th scope="col"><span class="sr">${esc(t("kj.ont.kol.peta"))}</span></th>`;
    const baris = irisan.map((id) => {
      const x = ix.per[l].get(id), sel = S.jejak.at(-1) === id;
      const nama = `<td data-l="${esc(t("kj.ont.kol.nama"))}">${l === "sis" ? `<i class="jm-ont-kls jm-ont-kls-${KELAS[x.warna_kelas] || "k0"}" aria-hidden="true"></i>` : ""}<button type="button" data-pilih="${esc(id)}"${sel ? ' aria-current="true"' : ""}>${esc(nm(x, l))}</button>${l === "sis" && x.captive ? ` <span class="rg3-lain">${esc(t("kj.peta.captive"))}</span>` : ""}${l === "pb" && x.prov ? `<small>${esc(ctx.provNama(x.prov))}</small>` : ""}</td>`;
      const sisa = kols.slice(1).map((k) => `<td data-l="${esc(t("kj.ont.kol." + k.k))}"${k.n ? " data-num" : ""}>${k.h(x)}</td>`).join("");
      return `<tr>${nama}${sisa}<td class="jm-tengah"><a class="jm-tbl jm-tbl-kecil" href="?tab=peta&amp;fokus=${encodeURIComponent(id)}" aria-label="${esc(t("kj.ont.buka_peta", { nama: nm(x, l) }))}">${ikon("peta", 16)}<span>${esc(t("kj.ont.peta"))}</span></a></td></tr>`;
    }).join("");
    const nh = Math.ceil(urutan.length / HAL);
    const np = nPotongan();
    const mvaKaki = l === "sis" ? `<p class="jm-ont-cat">${esc(t("kj.ont.mva_sis_cat"))}</p>${kakiFakta("hitung", "esdm-statistik-2024", "2024")}` : l === "prov" ? `<p class="jm-ont-cat">${esc(t("kj.ont.mva_prov_cat"))}</p>${kakiFakta("sumber", "esdm-statistik-2024", "2024")}` : "";
    wadah.innerHTML = `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>${th}</tr></thead><tbody>${baris}</tbody></table></div>${nh > 1 ? `<nav class="jm-pag" aria-label="${esc(t("kj.ont.hal_aria"))}"><p class="jm-pag-teks">${esc(t("kj.ont.rentang", { a: num(hal * HAL + 1), b: num(hal * HAL + irisan.length), n: num(urutan.length) }))}</p><div class="jm-pag-nomor"><button type="button" class="jm-pag-b" data-hal="${hal - 1}" aria-label="${esc(t("kj.ont.sebelum"))}"${hal ? "" : " disabled"}>${ikon("panah-kiri", 16)}</button><span class="jm-pag-teks">${esc(t("kj.ont.hal", { a: num(hal + 1), b: num(nh) }))}</span><button type="button" class="jm-pag-b" data-hal="${hal + 1}" aria-label="${esc(t("kj.ont.sesudah"))}"${hal < nh - 1 ? "" : " disabled"}>${ikon("panah-kanan", 16)}</button></div></nav>` : ""}${np ? `<p class="jm-ont-cat">${esc(t("kj.peta.lainnya", { n: num(np) }))}</p>` : ""}${mvaKaki}`;
  }

  /* ---- pemilihan ---- */
  function setJejak(j) {
    S.jejak = j;
    const sel = j.at(-1);
    S.hasil = sel ? terkait(ix, sel) : null;
    S.lapis = sel ? lapisBawaan(S.hasil, ix.lap.get(sel)) : S.lapis;
    S.hal = 0; S.q = ""; S.sis = ""; S.prov = "";
    $("ontCari").value = ""; $("ontSis").value = ""; $("ontProv").value = "";
    chrome();
    nanti(() => { tabel(); sorot(); });
  }
  const pilih = (id) => setJejak(langkahJejak(ix, S.jejak, id));
  function bukaLapis(l) { S.lapis = l; S.hal = 0; chrome(); nanti(tabel); }

  /* ---- SVG ---- */
  const el = new Map(), anc = new Map(); let terk = [], hub = null;
  function gambar() {
    const gp = new Map((geo?.pb || []).map((p) => [p.id, p])), gg = new Map((geo?.gi || []).map((p) => [p.id, p])), gr = new Map((geo?.rs || []).map((p) => [p.id, p.c]));
    const garisRs = (id, tol) => { const c = gr.get(id); return c && c.length > 1 ? sederhana(c.map((q) => lok(q[0], q[1])), tol) : null; };
    const tengah = (a) => a[a.length >> 1];
    const plat = LAPIS.map(() => []);
    // 0 operator: titik di rata-rata lokasi anggotanya
    for (const x of ix.per.op.values()) {
      const ps = [];
      for (const k of ix.adj.get(x.id)) { const p = gp.get(k) || gg.get(k); if (p) ps.push(lok(p.x, p.y)); else if (gr.has(k)) ps.push(tengah(lok2(gr.get(k)))); if (ps.length >= 40) break; }
      if (!ps.length) continue;
      const p = [ps.reduce((s, q) => s + q[0], 0) / ps.length, ps.reduce((s, q) => s + q[1], 0) / ps.length];
      anc.set(x.id, p); plat[0].push(`<circle class="o" data-id="${esc(x.id)}" cx="${r1(p[0])}" cy="${r1(p[1])}" r="2.4"/>`);
    }
    function lok2(c) { return c.map((q) => lok(q[0], q[1])); }
    // 1 sistem: satu lintasan gabungan per sistem
    const perSis = new Map();
    for (const x of ix.per.rs.values()) { if (!x.sis) continue; const g = garisRs(x.id, 0.5); if (g) (perSis.get(x.sis) || perSis.set(x.sis, []).get(x.sis)).push(g); }
    for (const [id, gs] of perSis) { anc.set(id, tengah(gs[gs.length >> 1])); plat[1].push(`<path class="o" data-id="${esc(id)}" d="${gs.map(garis).join("")}"/>`); }
    // 2 provinsi
    for (const f of gprov?.features || []) {
      const id = "prov_" + f.properties.kode, polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
      let d = "", terbesar = null, luas = 0;
      for (const poly of polys) {
        const cincin = sederhana(poly[0].map((q) => lok(q[0], q[1])), 0.6);
        if (cincin.length < 3) continue;
        d += garis(cincin) + "Z";
        const xs = cincin.map((q) => q[0]), ys = cincin.map((q) => q[1]), a = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
        if (a > luas) { luas = a; terbesar = [(Math.max(...xs) + Math.min(...xs)) / 2, (Math.max(...ys) + Math.min(...ys)) / 2]; }
      }
      if (d && ix.per.prov.has(id)) { anc.set(id, terbesar); plat[2].push(`<path class="o" data-id="${esc(id)}" d="${d}"/>`); }
    }
    // 3 pembangkit, 4 gardu
    for (const p of gp.values()) { const q = lok(p.x, p.y); anc.set(p.id, q); plat[3].push(`<circle class="o" data-id="${esc(p.id)}" cx="${r1(q[0])}" cy="${r1(q[1])}" r="${r1(1.3 + Math.sqrt(p.mw || 0) / 14)}"/>`); }
    for (const p of gg.values()) { const q = lok(p.x, p.y); anc.set(p.id, q); plat[4].push(`<circle class="o" data-id="${esc(p.id)}" cx="${r1(q[0])}" cy="${r1(q[1])}" r="1.7"/>`); }
    // 5 jalur: garis lurus antar gardu bila kedua ujung gardu, selain itu lintasan ruasnya
    for (const x of ix.per.jl.values()) {
      const a = gg.get(x.a), b = gg.get(x.b);
      let pts = a && b ? [lok(a.x, a.y), lok(b.x, b.y)] : (x.rs || []).flatMap((r) => garisRs(r, 0.5) || []);
      if (pts.length < 2) continue;
      anc.set(x.id, tengah(pts)); plat[5].push(`<path class="o" data-id="${esc(x.id)}" d="${garis(pts)}"/>`);
    }
    // 6 ruas
    for (const x of ix.per.rs.values()) { const g = garisRs(x.id, 0.35); if (!g) continue; anc.set(x.id, tengah(g)); plat[6].push(`<path class="o" data-id="${esc(x.id)}" d="${garis(g)}"/>`); }
    let idn = "";
    for (const f of gprov?.features || []) for (const poly of f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) { const c = sederhana(poly[0].map((q) => lok(q[0], q[1])), 0.9); if (c.length > 2) idn += garis(c) + "Z"; }
    const sudut = (i) => { const y0 = TOP + i * GAP, y1 = y0 + PH * SY; return [[EX, y0], [EX + PW, y0], [EX + PW - SK * PH, y1], [EX - SK * PH, y1]]; };
    svg.innerHTML = `<defs><path id="ontIdn" d="${idn}"/></defs>` + LAPIS.map((l, i) => {
      const [c0, c1, c2, c3] = sudut(i), P = (q, d = 0) => r1(q[0]) + " " + r1(q[1] + d), ym = r1((c0[1] + c3[1]) / 2);
      return `<g class="jm-ont-p jm-ont-p${i}" data-lapis="${l}"><path class="sisi" d="M${P(c3)}L${P(c2)}L${P(c1)}L${P(c1, TB)}L${P(c2, TB)}L${P(c3, TB)}Z"/><path class="pen" d="M${LABW - 6} ${ym}H${r1((c0[0] + c3[0]) / 2)}"/><g transform="matrix(1 0 ${-SK} ${SY} ${EX} ${TOP + i * GAP})"><rect class="alas" width="${PW}" height="${PH}" rx="4"/><use class="idn" href="#ontIdn"/><g>${plat[i].join("")}</g></g></g>`;
    }).join("") + `<g class="jm-ont-hub" id="ontHub"></g>`;
    panel.querySelectorAll(".jm-ont-lb").forEach((b, i) => b.style.setProperty("--y", r1(((TOP + i * GAP + PH * SY / 2) / VBH) * 100) + "%"));
    for (const e of svg.querySelectorAll("[data-id]")) el.set(e.dataset.id, e);
    hub = svg.querySelector("#ontHub");
    svg.querySelector(`.jm-ont-p[data-lapis="${S.lapis}"]`)?.classList.add("aktif");
    if (S.jejak.length) sorot();
  }
  function sorot() {
    if (!hub) return;
    for (const e of terk) e.classList.remove("terk", "sel");
    terk = []; hub.replaceChildren();
    const sel = S.jejak.at(-1);
    svg.classList.toggle("pilih", !!sel);
    if (!sel) return;
    for (const l of LAPIS) for (const id of S.hasil[l]) { const e = el.get(id); if (e) { e.classList.add("terk"); terk.push(e); } }
    el.get(sel)?.classList.add("sel");
    const l0 = ix.lap.get(sel), a0 = anc.get(sel);
    if (!a0) return;
    const p0 = proj(idxLapis(l0), a0);
    let d = "", dt = "";
    for (const l of LAPIS) {
      if (l === l0) continue;
      const ids = S.hasil[l], langkah = Math.max(1, Math.ceil(ids.length / 14));
      for (let k = 0; k < ids.length; k += langkah) { const a = anc.get(ids[k]); if (a) { const q = proj(idxLapis(l), a); d += `M${p0[0]} ${p0[1]}L${q[0]} ${q[1]}`; dt += `<circle cx="${q[0]}" cy="${q[1]}" r="2.2"/>`; } }
    }
    hub.innerHTML = `<path d="${d}"/>${dt}<circle class="in" cx="${p0[0]}" cy="${p0[1]}" r="3"/><circle class="cin" cx="${p0[0]}" cy="${p0[1]}" r="9"/>`;
  }
  nanti(gambar);

  /* ---- tooltip ---- */
  const ringkas = (x, l) => ({ op: () => t("kj.ont.tip.mw", { n: num(x.mw) }), sis: () => t("kj.ont.tip.km", { n: num(x.km) }), prov: () => t("kj.ont.tip.km", { n: num(x.km, 1) }), pb: () => t("kj.ont.tip.mw", { n: num(x.mw) }), gi: () => t("kj.ont.tip.kv", { n: num(x.kv) }), jl: () => t("kj.ont.tip.kvkm", { kv: num(x.kv), km: num(x.km, 1) }), rs: () => t("kj.ont.tip.kvkm", { kv: num(x.kv), km: num(x.km, 1) }) })[l]();
  let idTip = null, bingkai = 0, pt = null;
  const letakTip = () => {
    bingkai = 0;
    const w = $("ontTumpuk").getBoundingClientRect(), x = pt.clientX - w.left, y = pt.clientY - w.top, lebar = tip.offsetWidth;
    tip.style.setProperty("left", Math.max(4, Math.min(x + 14, w.width - lebar - 4)) + "px");
    tip.style.setProperty("top", y + 16 + "px");
  };
  svg.addEventListener("pointermove", (e) => {
    const n = e.target.closest?.("[data-id]");
    pt = e;
    if (!n) { if (idTip) { idTip = null; tip.hidden = true; } return; }
    if (n.dataset.id !== idTip) {
      idTip = n.dataset.id;
      const l = ix.lap.get(idTip), x = ix.per[l].get(idTip);
      tip.innerHTML = `<b>${esc(nm(x, l))}</b><small>${esc(lap(l))}</small><span>${esc(ringkas(x, l))}</span>`;
      tip.hidden = false;
    }
    if (!bingkai) bingkai = requestAnimationFrame(letakTip);
  });
  svg.addEventListener("pointerleave", () => { idTip = null; tip.hidden = true; });

  /* ---- penangan ---- */
  svg.addEventListener("click", (e) => {
    const n = e.target.closest("[data-id]");
    if (n) { tip.hidden = true; pilih(n.dataset.id); return; }
    const p = e.target.closest(".jm-ont-p");
    if (p) bukaLapis(p.dataset.lapis);
  });
  panel.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b || !panel.contains(b)) return;
    if (b.dataset.lapis) return bukaLapis(b.dataset.lapis);
    if (b.dataset.pilih) return pilih(b.dataset.pilih);
    if (b.dataset.jejak !== undefined) { const i = +b.dataset.jejak; return setJejak(i < 0 ? [] : potongJejak(S.jejak, i)); }
    if (b.dataset.kol) {
      const l = S.lapis, ur = S.urut[l] || BAWAAN[l];
      S.urut[l] = [b.dataset.kol, ur[0] === b.dataset.kol ? -ur[1] : (b.dataset.kol === "nama" || ["bb", "sis", "prov", "pulau"].includes(b.dataset.kol) ? 1 : -1)];
      S.hal = 0;
      b.closest("tr").querySelectorAll("th").forEach((th) => th.setAttribute("aria-sort", th.contains(b) ? (S.urut[l][1] > 0 ? "ascending" : "descending") : "none")); // chrome sinkron
      return nanti(tabel);
    }
    if (b.dataset.hal !== undefined) { S.hal = +b.dataset.hal; nanti(() => { tabel(); $("ontJudul").scrollIntoView({ block: "nearest" }); }); }
  });
  $("ontCari").addEventListener("input", debounce((e) => { S.q = e.target.value; S.hal = 0; tabel(); }));
  $("ontSis").addEventListener("change", (e) => { S.sis = e.target.value; S.hal = 0; nanti(tabel); });
  $("ontProv").addEventListener("change", (e) => { S.prov = e.target.value; S.hal = 0; nanti(tabel); });

  chrome();
  tabel();

  /* ruas menyusul (1,1 MB): indeks dibangun ulang, pelat digambar ulang, pilihan dipertahankan */
  nanti(async () => {
    const rsb = await muatKJ("rs");
    if (!rsb?.rs?.length) return;
    ix = bangunIndeks(gabungObjek(inti, rsb));
    cacheNama.clear(); el.clear(); anc.clear(); terk = [];
    const sel = S.jejak.at(-1);
    if (sel) S.hasil = terkait(ix, sel);
    for (const b of panel.querySelectorAll(".jm-ont-lb")) b.querySelector(".jm-ont-j").textContent = t("kj.ont.hitung_semua", { n: num(ix.per[b.dataset.lapis].size) });
    chrome(); tabel(); nanti(gambar);
  });
}
