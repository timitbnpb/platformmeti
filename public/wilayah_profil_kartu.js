/* Kartu profil provinsi yang dipisah dari wilayah_profil.js: organisasi, peta proyek, emisi, perbandingan.
   Pemakaian: const K = kartu(H); H = pembantu milik wilayah_profil.js (seksi, sumberDari, namaBersih, peringkat, UKUR, fmt, satuan, kos, juta, hlHtml, aksiHtml).
   Teks selalu dari t(); tidak ada rumus baru (hanya pengelompokan dan format). */
import { navLokal, pasangLokal } from "/inti/paginasi.js";
import { esc, ikon } from "/inti/umum.js";
import { t } from "/i18n.js";
import { num } from "/analisis.js";
import { pilihHtml } from "/inti/komponen.js";
import { namaBaku } from "/inti/nama_baku.js";
import { logoOrg } from "/inti/logo_org.js";
import { pilTek, pilStatus } from "/inti/ikon_tek.js";
import { muatMapLibre } from "/inti/maplibre.js";
import { rapikanPeta, geoProvinsi } from "/inti/peta_indonesia.js";
import { tautProyek, tautProvinsi } from "/inti/tautan.js";

const S = (d, u = 18) => `<svg class="jm-ik" width="${u}" height="${u}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const TEK_ADA = new Set(["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "nuklir", "penyimpanan"]);
const awalan = (s) => String(s).replace(/^(PT|CV|Pemerintah|Dinas|Universitas|Koperasi)\s+/i, "");

/* ============ organisasi ============ */
const IKON_JENIS = { "perguruan-tinggi": "wisuda", ormawa: "wisuda", "think-tank": "analisis", bumn: "gedung", bumd: "gedung", swasta: "gedung", internasional: "asean", "kementerian-lembaga": "regulasi", pemda: "wilayah", asosiasi: "rantai", koperasi: "daftar", keuangan: "analisis", donor: "orang", "lsm-yayasan": "orang" };
const kotaKunci = (k) => String(k).replace(/^(kota|kabupaten|kab\.?)\s+/i, "").trim().toLowerCase();
/** { kunci -> {nama, n} } urut jumlah turun; nama = bentuk terpanjang (berawalan Kota/Kabupaten) */
export function kelompokKota(orgs) {
  const m = new Map();
  for (const o of orgs) {
    if (!o.kota) continue;
    const k = kotaKunci(o.kota), g = m.get(k) || { kunci: k, nama: o.kota, n: 0 };
    if (o.kota.length > g.nama.length) g.nama = o.kota;
    g.n++; m.set(k, g);
  }
  return [...m.values()].sort((a, b) => b.n - a.n || a.nama.localeCompare(b.nama, "id"));
}

export function kartu(H) {
  const { seksi, sumberDari, namaBersih, peringkat, UKUR, fmt, satuan, kos, juta, hlHtml, aksiHtml } = H;

  function organisasi(p) {
    if (!p.organisasi.length) return "";
    const kat = new Set(p.organisasi.map((o) => o.kategori).filter(Boolean)).size, kel = kelompokKota(p.organisasi);
    const kartuOrg = p.organisasi.map((o) => {
      const lg = o.logo || logoOrg(o.id, o.nama).find((u) => !u.includes("/logo/org/")), nama = namaBaku(o.nama).nama;
      const ini = esc(awalan(nama).slice(0, 2).toUpperCase());
      const jenis = o.kategori ? `<span class="jm-pil jm-wp-jenis">${ikon(IKON_JENIS[o.kode] || "gedung", 14)}<span>${esc(o.kategori)}</span></span>` : "";
      const kota = o.kota ? `<span class="jm-wp-kota">${ikon("lokasi", 14)}<span>${esc(o.kota)}</span></span>` : "";
      return `<li data-kota="${esc(o.kota ? kotaKunci(o.kota) : "")}"><a class="jm-wp-org" href="/direktori?tampil=lembaga&amp;id=${encodeURIComponent(o.id)}" title="${esc(nama)}"><span class="jm-wp-lg"><span class="jm-wp-org-i" aria-hidden="true">${ini}</span>${lg ? `<img src="${esc(lg)}" alt="" loading="lazy" decoding="async" data-galat="hapus">` : ""}</span><span class="jm-wp-ob"><b>${esc(nama)}</b>${jenis}${kota}</span></a></li>`;
    }).join("");
    const saring = kel.length ? `<div class="jm-wp-sar">${pilihHtml({ id: "wp-org-kota", ikon: "lokasi", label: t("wo.kota_label"), opsi: [["", t("wo.kota_semua"), "", p.organisasi.length], ...kel.map((k) => [k.kunci, k.nama, "", k.n])] })}<ul class="jm-wp-ringkas" aria-label="${esc(t("wo.ringkas"))}">${kel.slice(0, 8).map((k) => `<li><button type="button" class="jm-wp-rk" data-kota="${esc(k.kunci)}">${ikon("lokasi", 14)}<span>${esc(k.nama)}</span><b>${num(k.n)}</b></button></li>`).join("")}</ul></div>` : "";
    return seksi({ id: "organisasi", ikon: "direktori", topik: t("wp.ey.org"), judulHtml: hlHtml("wp.j.org", num(p.organisasi.length), { nama: p.nama, kat: num(kat) }), aksiHtml: aksiHtml() + sumberDari({ sumber: t("wl.sumber_org"), tanggal: "" }), isiHtml: `${saring}<ul class="jm-wp-orgs">${kartuOrg}</ul>`, kakiHtml: `<p class="jm-bantu">${esc(t("wo.cat"))}</p>` });
  }

  /* ============ peta proyek ============ */
  const warnaCss = (kelas) => { const e = document.createElement("span"); e.className = kelas; e.style.color = "var(--tk)"; document.body.append(e); const c = getComputedStyle(e).color; e.remove(); return c; };
  const kelasTek = (k) => "jm-tek-" + (TEK_ADA.has(k) ? k : "lain");
  const TOMBOL = [["in", S('<path d="M12 5v14M5 12h14"/>'), "wp.pt.in"], ["out", S('<path d="M5 12h14"/>'), "wp.pt.out"], ["reset", S('<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/>'), "wp.pt.reset"], ["penuh", S('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'), "wp.pt.penuh"]];
  function petaSeksi(p) {
    if (!p.proyek.length) return "";
    const tepat = p.proyek.filter((x) => x.lat != null && x.presisi !== "provinsi").length, per = new Map();
    for (const x of p.proyek) per.set(x.teknologi, (per.get(x.teknologi) || 0) + 1);
    const leg = `<div class="jm-wp-lg-peta"><div class="jm-wp-lg-b"><b>${esc(t("wp.pt.leg_tek"))}</b>${[...per].sort((a, b) => b[1] - a[1]).map(([k, n]) => `<span class="jm-wp-pilgrup">${pilTek(k)} <b>${num(n)}</b></span>`).join("")}</div>
      <div class="jm-wp-lg-b"><b>${esc(t("wp.pt.leg_ukuran"))}</b><span class="jm-wp-uk">${[10, 100, 1000].map((mw, i) => `<span class="jm-wp-uk-i"><i class="jm-wp-uk-${i + 1}"></i>${num(mw)}</span>`).join("")}<small>MW</small></span></div>
      <div class="jm-wp-lg-b"><span class="jm-wp-ti"><i class="jm-wp-ti-p"></i>${esc(t("wp.pt.leg_tepat"))}</span><span class="jm-wp-ti"><i class="jm-wp-ti-u"></i>${esc(t("wp.pt.leg_pudar"))}</span></div></div>`;
    const kontrol = `<div class="jm-wp-pk">${TOMBOL.map(([a, svg, k]) => `<button type="button" class="jm-wp-pkb" data-pk="${a}" title="${esc(t(k))}" aria-label="${esc(t(k))}">${svg}</button>`).join("")}</div>`;
    return seksi({ id: "peta", ikon: "peta", topik: t("wp.ey.peta"), judulHtml: hlHtml("wp.j.peta", num(p.proyek.length), { nama: p.nama, tepat: num(tepat) }), aksiHtml: aksiHtml({ csv: false }) + sumberDari({ sumber: t("wl.sumber_proyek"), tanggal: "" }), isiHtml: `<div class="jm-wp-pw" id="wp-pw"><div class="jm-wp-peta" id="wp-peta" role="region" aria-label="${esc(t("wp.peta_label"))}"></div>${kontrol}</div>${leg}`, kakiHtml: `<p class="jm-bantu">${esc(t("wp.peta_cat", { tepat: num(tepat), n: num(p.proyek.length) }))}</p>` });
  }
  const popHtml = (x) => {
    const nm = esc(namaBersih(x)), peng = x.peng && x.peng.id && !x.peng.generik ? `<a href="/o/${encodeURIComponent(x.peng.id)}">${esc(x.peng.nama)}</a>` : x.peng ? esc(x.peng.nama) : "";
    return `<div class="jm-wp-pop">${x.foto ? `<img src="${esc(x.foto)}" alt="" loading="lazy" data-galat="hapus">` : ""}<b><a href="/p/${encodeURIComponent(x.id)}">${nm}</a></b><div class="jm-wp-pop-b">${pilTek(x.teknologi)}${pilStatus(x.status || "tidak-diketahui")}</div><div class="jm-wp-pop-m">${x.mw != null ? `<span>${esc(num(x.mw, 1))} ${esc(x.satuan || "MW")}</span>` : ""}${peng ? `<span>${esc(t("wp.pt.pemilik"))}: ${peng}</span>` : ""}</div><a class="jm-wp-pop-l" href="/p/${encodeURIComponent(x.id)}">${esc(t("wp.pt.buka"))}</a></div>`;
  };
  const gelap = () => (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
  const warna = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  async function bukaPeta(p) {
    const el = document.getElementById("wp-peta"), pw = document.getElementById("wp-pw"); if (!el) return;
    try {
      const [g] = await Promise.all([geoProvinsi(), muatMapLibre()]);
      const f = g?.features.find((x) => String(x.properties.kode) === p.kode); if (!f) throw new Error("geo");
      const b = new maplibregl.LngLatBounds(), polis = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
      for (const poli of polis) for (const [x, y] of poli[0]) b.extend([x, y]);
      const peta = new maplibregl.Map({ container: el, style: "https://tiles.openfreemap.org/styles/" + (gelap() ? "dark" : "positron"), bounds: b, fitBoundsOptions: { padding: 32 }, minZoom: 3, maxZoom: 14, dragRotate: false, pitchWithRotate: false, scrollZoom: false, cooperativeGestures: true, attributionControl: { compact: true } });
      const reset = () => peta.fitBounds(b, { padding: 32, duration: 400 });
      pw.addEventListener("click", (e) => {
        const a = e.target.closest("[data-pk]")?.dataset.pk; if (!a) return;
        if (a === "in") peta.zoomIn(); else if (a === "out") peta.zoomOut(); else if (a === "reset") reset();
        else if (document.fullscreenElement) document.exitFullscreen(); else pw.requestFullscreen?.();
      });
      document.addEventListener("fullscreenchange", () => setTimeout(() => peta.resize(), 80));
      peta.on("style.load", () => {
        const idLabel = rapikanPeta(peta); // titik di bawah lapisan label supaya nama kota tidak tertimpa
        const luar = [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]]];
        for (const poli of polis) luar.push(poli[0]);
        peta.addSource("luar", { type: "geojson", data: { type: "Feature", geometry: { type: "Polygon", coordinates: luar } } });
        peta.addSource("prov", { type: "geojson", data: f });
        peta.addSource("provSemua", { type: "geojson", data: g });
        peta.addLayer({ id: "luar", type: "fill", source: "luar", paint: { "fill-color": warna("--paper"), "fill-opacity": 0.78 } }, idLabel);
        peta.addLayer({ id: "prov-lain", type: "line", source: "provSemua", paint: { "line-color": warna("--ink2"), "line-opacity": 0.3, "line-width": 0.6 } }, idLabel);
        peta.addLayer({ id: "prov", type: "line", source: "prov", paint: { "line-color": warna("--accent-isi"), "line-width": 2 } }, idLabel);
        const byId = new Map(p.proyek.map((x) => [x.id, x])), cache = {};
        const w = (k) => (cache[k] ||= warnaCss(kelasTek(k)));
        const titik = p.proyek.filter((x) => x.lat != null).sort((a, z) => (z.mw || 0) - (a.mw || 0)).map((x) => ({ type: "Feature", geometry: { type: "Point", coordinates: [x.lng, x.lat] }, properties: { id: x.id, mw: x.mw || 0, tepat: x.presisi === "provinsi" ? 0 : 1, w: w(x.teknologi) } }));
        peta.addSource("titik", { type: "geojson", data: { type: "FeatureCollection", features: titik } });
        const jari = ["interpolate", ["linear"], ["sqrt", ["get", "mw"]], 0, 5, 10, 8, 30, 13];
        peta.addLayer({ id: "titik-pudar", type: "circle", source: "titik", filter: ["==", ["get", "tepat"], 0], paint: { "circle-color": ["get", "w"], "circle-opacity": 0.18, "circle-radius": jari, "circle-stroke-color": ["get", "w"], "circle-stroke-opacity": 0.8, "circle-stroke-width": 1.5 } }, idLabel);
        peta.addLayer({ id: "titik", type: "circle", source: "titik", filter: ["==", ["get", "tepat"], 1], paint: { "circle-color": ["get", "w"], "circle-opacity": 0.92, "circle-radius": jari, "circle-stroke-color": warna("--card"), "circle-stroke-width": 1.5 } }, idLabel);
        const pop = new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: "300px", offset: 12 });
        for (const ly of ["titik", "titik-pudar"]) {
          peta.on("click", ly, (e) => { const x = byId.get(e.features[0].properties.id); if (x) pop.setLngLat(e.features[0].geometry.coordinates).setHTML(popHtml(x)).addTo(peta); });
          peta.on("mouseenter", ly, () => { peta.getCanvas().style.cursor = "pointer"; });
          peta.on("mouseleave", ly, () => { peta.getCanvas().style.cursor = ""; });
        }
      });
    } catch (e) { console.warn("peta profil", e); el.innerHTML = `<p class="jm-kosong">${esc(t("wl.peta_gagal"))}</p>`; }
  }

  /* ============ emisi ============ */
  const BB = { coal: "batubara", gas: "gas", oil: "minyak", other_fossil: "fosil_lain", biomass: "biomassa" };
  const IKON_E = {
    batubara: S('<path d="M4 18l3-8 4 3 3-7 6 12z"/>', 20),
    gas: S('<path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-2 1-3.5 2-5 1 1.5 2 2 2 2 0-2 0-5 2-8z"/>', 20),
    industri: S('<path d="M3 21V10l6 3V10l6 3V6h4v15zM7 17h2M12 17h2M17 17h2"/>', 20),
    tekstil: S('<circle cx="12" cy="12" r="8"/><path d="M4 12h16M7 6.5c2 3 2 8 0 11M17 6.5c-2 3-2 8 0 11"/>', 20),
    lain: S('<path d="M13 2 5 14h6l-1 8 8-12h-6z"/>', 20),
  };
  /** jenis tampilan dari nama dan bahan bakar utama (bahan bakar pertama di daftar Climate TRACE) */
  const jenisEmisi = (x) => {
    const n = String(x.nama || ""), bb = String(x.jenis || "").split(",")[0].trim();
    if (/cement|semen/i.test(n)) return "industri";
    if (/rayon|textile|tekstil|spinning|garment|garmen/i.test(n)) return "tekstil";
    return bb === "coal" ? "batubara" : bb === "gas" ? "gas" : "lain";
  };
  const bahan = (x) => String(x.jenis || "").split(",").map((s) => s.trim()).filter(Boolean).map((s) => (BB[s] ? t("we.bb." + BB[s]) : s)).join(", ");
  const nmEmisi = (n) => namaBaku(String(n).replace(/\s+(power station|power plant|plant)$/i, "")).nama;
  const emisiBaris = (x, i, mx, ada) => {
    const j = jenisEmisi(x), nm = nmEmisi(x.nama), pk = ada.get(nm.toLowerCase()), v = juta(x.emisi);
    const sub = [x.kota ? `<span class="jm-we-s" title="${esc(t("we.kota_ket"))}">${ikon("lokasi", 12)}${esc(x.kota)}</span>` : "", bahan(x) ? `<span class="jm-we-s">${esc(bahan(x))}</span>` : "", x.mw != null ? `<span class="jm-we-s">${esc(num(x.mw, 0))} MW</span>` : ""].join("");
    return `<li class="jm-we-r jm-we-${j}"${i >= 10 ? " hidden" : ""}><span class="jm-we-no">${i + 1}</span><span class="jm-we-ik" title="${esc(t("we.j." + j))}">${IKON_E[j]}</span><div class="jm-we-nm"><b>${pk ? tautProyek(pk.id, nm) : esc(nm)}</b><span class="jm-we-sub">${sub}</span></div><div class="jm-we-v"><span class="jm-we-bar" aria-hidden="true"><i data-w="${((x.emisi / mx) * 100).toFixed(1)}"></i></span><b class="jm-we-n">${esc(v)}<small> tCO2e</small></b></div></li>`;
  };
  function emisi(p, d) {
    const e = d?.emisi; if (!e) return "";
    const L = e.pembangkit, mx = Math.max(1, ...L.map((x) => x.emisi || 0)), tot = L.reduce((s, x) => s + (x.emisi || 0), 0) || 1;
    const ada = new Map(p.proyek.map((x) => [namaBersih(x).toLowerCase(), x]));
    const grup = new Map();
    for (const x of L) grup.set(jenisEmisi(x), (grup.get(jenisEmisi(x)) || 0) + (x.emisi || 0));
    const ubin = [...grup].sort((a, b) => b[1] - a[1]).map(([j, v]) => `<li class="jm-we-u jm-we-${j}"><span class="jm-we-ik">${IKON_E[j]}</span><span class="jm-we-ut"><span>${esc(t("we.j." + j))}</span><b>${esc(juta(v))}</b><small>${esc(num((v / tot) * 100, 0))}%</small></span></li>`).join("");
    const tombol = navLokal({ total: L.length, per: 10, satuan: "jm.pag.u.pembangkit" });
    const leg = [...grup.keys()].map((j) => `<span class="jm-we-lg jm-we-${j}"><i></i>${esc(t("we.j." + j))}</span>`).join("");
    return seksi({ id: "emisi", ikon: "analisis", topik: t("wp.ey.emisi"), judulHtml: hlHtml("wp.j.emisi", t("wp.emisi.nilai", { n: juta(e.total_tco2e) }), { nama: p.nama, n: num(e.jumlah), tahun: e.tahun }), aksiHtml: aksiHtml() + sumberDari({ sumber: e.sumber, url: e.url, tahun: e.tahun, tanggal: e.tanggal }), isiHtml: `<ul class="jm-we-ubin" aria-label="${esc(t("we.ringkas"))}">${ubin}</ul><ol class="jm-we" aria-label="${esc(t("wp.emisi.grafik"))}">${L.map((x, i) => emisiBaris(x, i, mx, ada)).join("")}</ol><div class="jm-we-kaki">${tombol}<span class="jm-we-kunci">${leg}</span></div>`, kakiHtml: `<p class="jm-bantu">${esc(t("wp.cat.emisi"))}</p>` });
  }

  /* ============ perbandingan ============ */
  const IKON_UK = { ebt: ikon("tek-bio", 20), kap: ikon("tek-listrik", 20), rasio: S('<path d="M9 3v5M15 3v5M6 8h12v4a6 6 0 0 1-12 0zM12 18v3"/>', 20), desa: ikon("beranda", 20), pb: ikon("tek-panas", 20), proyek: ikon("lokasi", 20), penduduk: ikon("orang", 20), pdrbk: S('<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6.5 9.5v.01M17.5 14.5v.01"/>', 20) };
  const pilRank = (r, n) => `<span class="jm-pil ${r <= 10 ? "jm-pil-ok" : r <= 25 ? "jm-pil-warn" : ""} jm-wp-rk-p">${esc(t("wp.rank_ket", { r, n }))}</span>`;
  function nilaiHtml(k, v) {
    if (k === "pdrbk") return `<b>${esc(t("wb.pdrbk", { n: num(v, 1) }))}</b>`;
    const sat = satuan(k);
    return `<b>${esc(fmt(k, v))}</b>${sat ? `<small>${esc(sat)}</small>` : ""}`;
  }
  function banding(data, p) {
    const K = ["ebt", "kap", "rasio", "desa", "pb", "proyek", "penduduk", "pdrbk"], R = K.map((k) => [k, peringkat(data, p, k)]);
    if (!R.some(([, r]) => r.v != null)) return "";
    const utama = R[0][1];
    const j = utama.r ? hlHtml("wp.j.banding", t("wp.rank_ket", { r: utama.r, n: utama.n }), { nama: p.nama }) : hlHtml("wp.j.banding0", p.nama, {});
    const baris = R.map(([k, r]) => {
      const sendiri = r.top && r.top.b.kode === p.kode;
      const pos = (v) => (r.hi > r.lo ? ((v - r.lo) / (r.hi - r.lo)) * 100 : 50);
      const ket = r.v != null && r.lo != null ? t("wb.posisi", { n: r.n, lo: fmt(k, r.lo), med: fmt(k, r.med), hi: fmt(k, r.top.v) }) : "";
      const strip = r.v != null && r.lo != null ? `<span class="jm-wp-ds" role="img" aria-label="${esc(ket)}" title="${esc(ket)}"><i class="jm-wp-ds-g"></i><i class="jm-wp-ds-m" data-p="${pos(r.med).toFixed(1)}"></i><i class="jm-wp-ds-o" data-p="${pos(r.v).toFixed(1)}"></i></span>` : kos();
      const rank = r.r ? (sendiri ? `<span class="jm-pil jm-pil-ok jm-wp-rk-p">${ikon("bintang", 14)}<span>${esc(t("wb.tertinggi"))}</span></span>` : pilRank(r.r, r.n)) : kos();
      const tert = r.top ? (sendiri ? "" : `<span class="jm-wp-top">${tautProvinsi(r.top.b.kode, r.top.b.nama)}</span>`) : kos();
      return `<tr><td data-label="${esc(t("wp.col.ukuran"))}"><span class="jm-wp-uk-n"><span class="jm-wp-uk-ik">${IKON_UK[k]}</span>${esc(t("wp.uk." + k))}</span></td><td data-label="${esc(p.nama)}" class="jm-num" data-urut="${r.v ?? ""}">${r.v == null ? kos() : `<span class="jm-wp-v">${nilaiHtml(k, r.v)}</span>`}</td><td data-label="${esc(t("wp.col.rank"))}" data-urut="${r.r ?? ""}">${rank}</td><td data-label="${esc(t("wb.col.posisi"))}">${strip}</td><td data-label="${esc(t("wp.col.tertinggi"))}">${tert}</td></tr>`;
    }).join("");
    const tb = `<div class="jm-gulir"><table class="jm-tabel jm-wp-bd"><thead><tr><th>${esc(t("wp.col.ukuran"))}</th><th class="jm-num">${esc(p.nama)}</th><th>${esc(t("wp.col.rank"))}</th><th data-urut="tidak">${esc(t("wb.col.posisi"))}</th><th data-urut="tidak">${esc(t("wp.col.tertinggi"))}</th></tr></thead><tbody>${baris}</tbody></table></div>`;
    return seksi({ id: "banding", ikon: "tabel", topik: t("wp.ey.banding"), judulHtml: j, aksiHtml: aksiHtml({ csv: true }), isiHtml: tb, kakiHtml: `<p class="jm-bantu">${esc(t("wb.cat"))}</p>` });
  }

  /* ============ interaksi (delegasi, sekali per profil) ============ */
  function pasang(akar) {
    const org = akar.querySelector(".jm-wp-orgs");
    if (org) {
      const sel = akar.querySelector("#wp-org-kota"), tampil = (k) => { for (const li of org.children) li.hidden = !!k && li.dataset.kota !== k; };
      sel?.addEventListener("change", () => tampil(sel.value));
      akar.querySelector(".jm-wp-ringkas")?.addEventListener("click", (e) => { const k = e.target.closest("[data-kota]")?.dataset.kota; if (!k || !sel) return; sel.value = sel.value === k ? "" : k; tampil(sel.value); });
    }
    pasangLokal(akar, () => akar.querySelectorAll(".jm-we-r"));
  }

  /* Kartu "Capaian RUED": target bauran 2025 dibanding realisasi pangsa kapasitas EBT; selalu Hipotesis (ukuran berbeda). Data: /data/rued_capaian.json. */
  function capaian(p, C) {
    const c = C?.baris.find((x) => x.kode === p.kode);
    if (!c) return "";
    const ST = { tercapai: "jm-pil-ok", "di-jalur": "jm-pil-warn", tertinggal: "jm-pil-bad" };
    const pil = c.status ? `<span class="jm-pil ${ST[c.status]}">${esc(t("wp.cap.st." + c.status))}</span>` : "";
    const hip = `<span class="jm-pil jm-pil-warn" title="${esc(t("wp.cap.hip_tip"))}">${esc(t("wp.cap.hip"))}</span>`;
    const fakta = [["wp.cap.target", c.target_2025_persen == null ? null : num(c.target_2025_persen, 1) + "%"], ["wp.cap.akhir", c.target_akhir ? t("wp.cap.akhir_isi", { p: num(c.target_akhir.persen, 1), th: c.target_akhir.tahun }) : null], ["wp.cap.real", c.realisasi_persen == null ? null : num(c.realisasi_persen, 1) + "%"], ["wp.cap.selisih", c.selisih_poin == null ? null : (c.selisih_poin > 0 ? "+" : "") + num(c.selisih_poin, 1) + " " + t("wp.cap.poin")]]
      .map(([k, v]) => `<div class="jm-wp-fk"><dt>${esc(t(k))}</dt><dd>${v == null ? `<span title="${esc(c.alasan_kosong || t("wp.cap.kosong"))}" tabindex="0">-</span>` : esc(v)}</dd></div>`).join("");
    const kol = c.target_2025_persen != null && c.realisasi_persen != null ? (() => { const m = Math.max(c.target_2025_persen, c.realisasi_persen, 1), h = (v) => Math.max(2, v / m * 90);
      return `<svg viewBox="0 0 200 130" class="jm-wp-cap-g" role="img" aria-label="${esc(t("wp.cap.grafik"))}"><line x1="10" x2="190" y1="105" y2="105" stroke="currentColor" opacity=".25"/><rect x="40" y="${105 - h(c.target_2025_persen)}" width="45" height="${h(c.target_2025_persen)}" rx="4" fill="var(--data5, #7a8aa0)"/><rect x="115" y="${105 - h(c.realisasi_persen)}" width="45" height="${h(c.realisasi_persen)}" rx="4" fill="var(--brand)"/><text x="62" y="${100 - h(c.target_2025_persen)}" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">${esc(num(c.target_2025_persen, 1))}</text><text x="137" y="${100 - h(c.realisasi_persen)}" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">${esc(num(c.realisasi_persen, 1))}</text><text x="62" y="122" text-anchor="middle" font-size="10" fill="currentColor">${esc(t("wp.cap.g_target"))}</text><text x="137" y="122" text-anchor="middle" font-size="10" fill="currentColor">${esc(t("wp.cap.g_real"))}</text></svg>`; })() : "";
    const tautan = [c.url_pdf && `<a href="${esc(c.url_pdf)}" target="_blank" rel="noopener noreferrer">${esc(t("wp.cap.perda", { perda: c.perda }))}</a>`, c.realisasi_sumber_url && `<a href="${esc(c.realisasi_sumber_url)}" target="_blank" rel="noopener noreferrer">${esc(t("wp.cap.stat"))}</a>`].filter(Boolean).join(" | ");
    const j = c.status ? t("wp.cap.j", { nama: p.nama, status: t("wp.cap.st." + c.status).toLocaleLowerCase(), r: num(c.rasio_persen, 0) }) : t("wp.cap.j0", { nama: p.nama });
    return seksi({ id: "capaian-rued", ikon: "grafik", topik: t("wp.cap.ey"), judulHtml: esc(j), aksiHtml: aksiHtml(), isiHtml: `<p class="jm-wp-cap-p">${pil} ${hip}</p><dl class="jm-wp-fakta">${fakta}</dl>${kol}`, kakiHtml: `<p class="jm-bantu">${esc(C.metode)}</p><p class="jm-bantu">${tautan}</p>` });
  }
  return { organisasi, petaSeksi, bukaPeta, emisi, banding, pasang, capaian };
}
