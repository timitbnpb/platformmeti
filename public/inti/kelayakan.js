/* Kalkulator kelayakan lokasi EBT (JM, sementara di /kelayakan, nanti disematkan di /peluang).
   API: bukaKelayakan({ lat, lon, tek, wadah }) menggambar hasil ke wadah; daftarProvinsi() untuk pemilih provinsi.
   Rumus murni ada di kelayakan_rumus.js. Hasil = Hipotesis. INP: ubah asumsi menghitung ulang kartu dan grafik saja. */
import { t, angka, tanggal, ada } from "/i18n.js";
import { esc, ikon, debounce, hantuHtml, galatHtml } from "/inti/umum.js";
import { sumberHtml, exHtml } from "/inti/komponen.js";
import { ikonTek } from "/inti/ikon_tek.js";
import * as R from "/inti/kelayakan_rumus.js";

export const TEKNOLOGI = ["plts", "terapung", "pltb", "mikrohidro"];
const IKON_PADA = { plts: "surya", terapung: "surya", pltb: "bayu", mikrohidro: "hidro" };
const PATOKAN_DATA = { surya: "surya", bayu: "bayu", mikrohidro: "hidro" };
const N = (n, d = 0) => angka(n, { desimal: d });
const ambil = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); });
const SIMPAN = new Map();
const sekali = (k, f) => { if (!SIMPAN.has(k)) SIMPAN.set(k, f().catch((e) => { SIMPAN.delete(k); throw e; })); return SIMPAN.get(k); };
const BULAN = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** Klimatologi NASA POWER (CORS terbuka; origin-nya didaftarkan di connect-src _headers). Koordinat dibulatkan 0,5 derajat. */
function iklim(lat, lon) {
  const la = (Math.round(lat * 2) / 2).toFixed(2), lo = (Math.round(lon * 2) / 2).toFixed(2);
  return sekali(`power:${la}:${lo}`, async () => {
    const d = await ambil(`/api/kelayakan/power?lat=${la}&lon=${lo}`);
    const p = d?.properties?.parameter;
    const baca = (k) => BULAN.map((b) => Number(p?.[k]?.[b]));
    const sw = baca("ALLSKY_SFC_SW_DWN"), ws = baca("WS50M");
    if (![...sw, ...ws].every((x) => Number.isFinite(x) && x > -990)) throw new Error("power");
    return { sw, ws, rentang: d?.header?.range || "" };
  });
}
const dataPeluang = () => sekali("peluang", () => ambil("/data/peluang.json").catch(() => null));
const dataProyek = () => sekali("proyek", () => ambil("/data/proyek.json").catch(() => null));
const dataGeo = () => sekali("geo", () => ambil("/geo/provinsi.json").catch(() => null));

/** [{kode, nama, lat, lon}] gabungan peluang.json (nama) dan provinsi.json (titik di dalam wilayah). */
export async function daftarProvinsi() {
  const [pel, geo] = await Promise.all([dataPeluang(), dataGeo()]);
  if (!pel?.baris || !geo) return [];
  const nama = new Map(pel.baris.map((b) => [String(b.kode), b.nama]));
  return geo.features.filter((f) => nama.has(String(f.properties.kode))).map((f) => {
    const polis = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    const besar = polis.reduce((a, p) => (p[0].length > a[0].length ? p : a))[0];
    const [sx, sy] = besar.reduce(([x, y], c) => [x + c[0], y + c[1]], [0, 0]);
    let lon = sx / besar.length, lat = sy / besar.length;
    if (!R.didalam(lon, lat, f.geometry)) [lon, lat] = besar[Math.floor(besar.length / 2)];
    return { kode: String(f.properties.kode), nama: nama.get(String(f.properties.kode)), lat, lon };
  }).sort((a, b) => a.nama.localeCompare(b.nama, "id"));
}

/* Kolom asumsi per teknologi: [kunci, kunci teks, langkah, skala tampil (1 atau 100)] */
const KOLOM = {
  plts: [["mw", "kl.a.mw", 1, 1], ["capex", "kl.a.capex", 10, 1], ["opex", "kl.a.opex", 1, 1], ["umur", "kl.a.umur", 1, 1], ["wacc", "kl.a.wacc", 0.5, 100], ["pr", "kl.a.pr", 0.01, 1]],
  pltb: [["mw", "kl.a.mw", 1, 1], ["capex", "kl.a.capex", 10, 1], ["opex", "kl.a.opex", 1, 1], ["umur", "kl.a.umur", 1, 1], ["wacc", "kl.a.wacc", 0.5, 100], ["rugi", "kl.a.rugi", 1, 100], ["hub", "kl.a.hub", 5, 1]],
  mikrohidro: [["debit", "kl.a.debit", 0.1, 1], ["head", "kl.a.head", 1, 1], ["fc", "kl.a.fc", 1, 100], ["capex", "kl.a.capex", 10, 1], ["opex", "kl.a.opex", 1, 1], ["umur", "kl.a.umur", 1, 1], ["wacc", "kl.a.wacc", 0.5, 100]],
};
KOLOM.terapung = KOLOM.plts;
const KURS = ["kurs", "kl.a.kurs", 100, 1];

function hitung(s) {
  const a = s.a, jenis = s.tek;
  let bulanan, mw = a.mw, ctx;
  if (jenis === "mikrohidro") {
    mw = R.dayaMikrohidro(a.debit, a.head) / 1000;
    bulanan = R.HARI_BULAN.map((h) => a.fc * h * 24 * mw);
    ctx = t("kl.k.fk.mh");
  } else if (jenis === "pltb") {
    bulanan = R.produksiBayu(s.iklim.ws, { hub: a.hub, rugi: a.rugi, mw }).bulanan;
    ctx = t("kl.k.fk.pltb", { v: N(R.bulat(s.iklim.ws.reduce((x, y) => x + y, 0) / 12, 2), 2), hub: N(a.hub) });
  } else {
    bulanan = R.bulananPlts(s.iklim.sw, a.pr, mw);
    ctx = t("kl.k.fk.plts", { psh: N(R.bulat(s.iklim.sw.reduce((x, y) => x + y, 0) / 12, 2), 2), pr: N(a.pr, 2) });
  }
  const tahunan = bulanan.reduce((x, y) => x + y, 0), perMw = mw > 0 ? tahunan / mw : 0;
  const lc = mw > 0 ? R.lcoe({ capex: a.capex, opex: a.opex, umur: a.umur, wacc: a.wacc, kwhPerKw: perMw }) : null;
  const tabel = R.tabelDariData(s.pel?.harga_patokan?.teknologi?.[PATOKAN_DATA[a.patokan]]?.tingkat);
  const pat = mw > 0 ? R.patokan(a.patokan, mw, tabel || R.HARGA_PATOKAN[a.patokan]) : null;
  return { bulanan, tahunan, perMw, mw, fk: mw > 0 ? R.fk(tahunan, mw) : 0, lc, pat, ctx, bpp: R.bppDari(s.baris) };
}

const kpi = (ik, lab, nilai, satuan, ctx, est) => `<div class="jm-kpi"><div class="jm-kpi-ik">${ikon(ik, 22)}</div><div class="jm-kpi-lab"><span>${esc(lab)}</span>${est ? `<span class="jm-pil jm-pil-est">${esc(t("kl.est"))}</span>` : ""}</div><div class="jm-kpi-n"><b>${esc(nilai)}</b>${satuan ? `<small>${esc(satuan)}</small>` : ""}</div><div class="jm-kpi-ctx">${esc(ctx)}</div></div>`;

function kartuHtml(s, h) {
  const rp = (sen) => (sen == null ? "-" : N(R.keRpKwh(sen, s.a.kurs), 0));
  const patRp = rp(h.pat), kurs = N(s.a.kurs);
  const bpp = h.bpp;
  let vonis = "";
  if (h.lc != null && h.pat != null) vonis += `<p class="jm-kl-vonis ${h.lc <= h.pat ? "jm-kl-ok" : "jm-kl-warn"}">${ikon(h.lc <= h.pat ? "centang" : "peringatan", 18)}<span>${esc(t(h.lc <= h.pat ? "kl.vonis.bawah" : "kl.vonis.atas"))}</span></p>`;
  if (h.lc != null && bpp != null) { const dlmRp = R.keRpKwh(h.lc, s.a.kurs); vonis += `<p class="jm-kl-vonis ${dlmRp <= bpp ? "jm-kl-ok" : "jm-kl-warn"}">${ikon(dlmRp <= bpp ? "centang" : "peringatan", 18)}<span>${esc(t(dlmRp <= bpp ? "kl.vonis.bpp.bawah" : "kl.vonis.bpp.atas"))}</span></p>`; }
  return `<div class="jm-kisi jm-kl-kisi">`
    + kpi("analisis", t("kl.k.produksi"), N(h.tahunan, 0), t("kl.mwh"), t("kl.k.produksi.ctx", { mw: N(h.mw, h.mw < 10 ? 2 : 0), mwhmw: N(h.perMw, 0) }), true)
    + kpi("insight", t("kl.k.fk"), N(h.fk * 100, 1) + "%", "", h.ctx, true)
    + kpi("proyek", t("kl.k.lcoe"), h.lc == null ? "-" : N(h.lc, 2), t("kl.sen"), t("kl.k.lcoe.ctx", { rp: rp(h.lc), kurs }), true)
    + kpi("regulasi", t("kl.k.patokan"), h.pat == null ? "-" : N(h.pat, 2), t("kl.sen"), t("kl.k.patokan.ctx", { rp: patRp }))
    + kpi("wilayah", t("kl.k.bpp"), bpp == null ? "-" : N(bpp, 0), t("kl.rp"), bpp == null ? t("kl.k.bpp.tak") : t("kl.k.bpp.ctx", { prov: s.prov?.nama || "-" }))
    + `</div>${vonis ? `<div class="jm-kl-vonisw">${vonis}</div>` : ""}`;
}

function grafikSvg(h) {
  const W = 640, T = 400, kiri = 52, bawah = 30, atas = 14, lebar = W - kiri - 8, tinggi = T - bawah - atas;
  const maks = Math.max(...h.bulanan, 1e-9), langkah = 10 ** Math.floor(Math.log10(maks)), puncak = Math.ceil(maks / langkah) * langkah;
  const nama = t("kl.bulan").split(","), lb = lebar / 12;
  let g = "";
  for (let i = 0; i <= 3; i++) {
    const y = atas + tinggi - (tinggi * i) / 3;
    g += `<line class="jm-kl-gr" x1="${kiri}" x2="${W - 8}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/><text class="jm-kl-sb" x="${kiri - 6}" y="${(y + 4).toFixed(1)}" text-anchor="end">${esc(N((puncak * i) / 3, puncak < 10 ? 1 : 0))}</text>`;
  }
  h.bulanan.forEach((v, i) => {
    const bt = (v / puncak) * tinggi, x = kiri + i * lb + lb * 0.16;
    g += `<rect class="jm-kl-bar" x="${x.toFixed(1)}" y="${(atas + tinggi - bt).toFixed(1)}" width="${(lb * 0.68).toFixed(1)}" height="${bt.toFixed(1)}" rx="3"><title>${esc(nama[i])}: ${esc(N(v, 1))} MWh</title></rect><text class="jm-kl-sb" x="${(x + lb * 0.34).toFixed(1)}" y="${T - 10}" text-anchor="middle">${esc(nama[i])}</text>`;
  });
  return `<svg class="jm-kl-grafik" viewBox="0 0 ${W} ${T}" role="img" aria-label="${esc(t("kl.grafik.alt"))}" preserveAspectRatio="xMidYMid meet">${g}</svg>`;
}

function dekatHtml(s) {
  const baris = (s.proyek?.baris || []).filter((p) => Number.isFinite(p?.lokasi?.lat) && Number.isFinite(p?.lokasi?.lng))
    .map((p) => ({ p, km: R.jarakKm(s.lat, s.lon, p.lokasi.lat, p.lokasi.lng) })).sort((a, b) => a.km - b.km).slice(0, 5);
  if (!baris.length) return `<p class="jm-bantu">${esc(t("kl.dekat.tak"))}</p>`;
  const tk = (k) => (ada("pj.tek." + k) ? t("pj.tek." + k) : k || "-");
  return `<div class="jm-gulir"><table class="jm-tabel jm-kl-tabel"><thead><tr><th scope="col">${esc(t("pj.c.nama"))}</th><th scope="col">${esc(t("kl.tek"))}</th><th scope="col">MW</th><th scope="col">km</th></tr></thead><tbody>${baris.map(({ p, km }) => {
    const mw = p.kapasitas?.[0]?.nilai;
    return `<tr><td>${esc(p.nama)}${p.lokasi.presisi === "provinsi" ? ` <span class="jm-bantu">(${esc(t("kl.dekat.kasar"))})</span>` : ""}</td><td>${ikonTek(p.teknologi)} ${esc(tk(p.teknologi))}</td><td class="jm-num">${esc(mw == null ? "-" : N(mw, mw % 1 ? 1 : 0))}</td><td class="jm-num">${esc(N(km, 0))}</td></tr>`;
  }).join("")}</tbody></table></div>`;
}

function formAsumsi(s) {
  const kol = [...KOLOM[s.tek], KURS];
  return `<div class="jm-kl-form">${kol.map(([k, kt, langkah, skala]) => `<label class="jm-kl-isian"><span>${esc(t(kt))}</span><input type="number" inputmode="decimal" min="0" step="${langkah}" data-k="${k}" data-skala="${skala}" value="${s.a[k] * skala}"></label>`).join("")}</div>
    <div class="jm-kl-aksi"><p class="jm-bantu" id="klDaya"></p><button type="button" class="jm-tbl" id="klReset">${ikon("ubah", 16)}<span>${esc(t("kl.a.reset"))}</span></button></div>
    <p class="jm-bantu">${esc(t("kl.a.sumber"))}</p>`;
}

const awal = (tek) => ({ ...R.ASUMSI[tek], kurs: R.KURS_RP });

function segarkan(w, s) {
  const h = hitung(s);
  w.querySelector("#klKartu").innerHTML = kartuHtml(s, h);
  w.querySelector("#klGrafikW").innerHTML = grafikSvg(h);
  const d = w.querySelector("#klDaya");
  if (d) d.textContent = s.tek === "mikrohidro" ? t("kl.a.daya", { kw: N(R.dayaMikrohidro(s.a.debit, s.a.head), 1) }) : "";
}

export async function bukaKelayakan({ lat, lon, tek = "plts", wadah = document.getElementById("kelayakanHasil") } = {}) {
  if (!wadah) return;
  if (!TEKNOLOGI.includes(tek)) tek = "plts";
  lat = Number(lat); lon = Number(lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) { wadah.innerHTML = `<div class="jm-kosong">${ikon("peta", 32)}<p>${esc(t("kl.kosong"))}</p></div>`; return; }
  if (!R.DALAM_INDONESIA(lat, lon)) { wadah.innerHTML = `<div class="jm-kosong">${ikon("peringatan", 32)}<p>${esc(t("kl.luar"))}</p></div>`; return; }
  const token = (wadah._kl = (wadah._kl || 0) + 1);
  wadah.innerHTML = hantuHtml(6);
  let ik, pel, proyek, geo;
  try { [ik, pel, proyek, geo] = await Promise.all([iklim(lat, lon), dataPeluang(), dataProyek(), dataGeo()]); }
  catch (e) {
    if (token !== wadah._kl) return;
    wadah.innerHTML = galatHtml("layanan").replace(/<p>.*?<\/p>/, `<p>${esc(t("kl.galat"))}</p>`);
    wadah.querySelector("[data-aksi=ulang]")?.addEventListener("click", () => bukaKelayakan({ lat, lon, tek, wadah }));
    return;
  }
  if (token !== wadah._kl) return;
  const fitur = geo?.features?.find((f) => R.didalam(lon, lat, f.geometry));
  const kode = fitur ? String(fitur.properties.kode) : null;
  const baris = kode ? pel?.baris?.find((b) => String(b.kode) === kode) : null;
  const s = { lat, lon, tek, iklim: ik, pel, proyek, baris, prov: baris ? { kode, nama: baris.nama } : null, a: awal(tek) };
  const tgl = tanggal(pel?.meta?.diperbarui || proyek?.dibangun_pada || "");
  const sumber = sumberHtml(`${esc(t("kl.sumber.power"))}. ${esc(ik.rentang)}<br>${esc(t("kl.sumber.peluang"))} (${esc(tgl)})<br>${esc(t("kl.sumber.proyek"))}`);
  const hip = `<span class="jm-pil jm-pil-warn">${esc(t("kl.hipotesis"))}</span>`;
  const lokasi = `${esc(t("kl.lokasi.isi", { lat: N(lat, 3), lon: N(lon, 3) }))}${s.prov ? `, ${esc(s.prov.nama)}` : `, ${esc(t("kl.lokasi.tanpa"))}`}`;
  wadah.innerHTML = exHtml({ id: "klHasil", ikon: IKON_PADA[tek] ? "analisis" : "", topik: t(`kl.tek.${tek}`), judulHtml: `${lokasi} ${hip}`, aksiHtml: sumber, isiHtml: `<div id="klKartu"></div>` })
    + `<div class="jm-kl-dua">`
    + exHtml({ id: "klGrafik", ikon: "analisis", topik: t("kl.grafik"), judulHtml: esc(t("kl.grafik")), subHtml: esc(t("kl.grafik.sub")), isiHtml: `<div id="klGrafikW"></div>`, tingkat: "h3" })
    + exHtml({ id: "klAsumsi", ikon: "ubah", topik: t("kl.asumsi"), judulHtml: esc(t("kl.asumsi")), subHtml: esc(t("kl.asumsi.sub")), isiHtml: formAsumsi(s), tingkat: "h3" })
    + `</div>`
    + exHtml({ id: "klDekat", ikon: "proyek", topik: t("kl.dekat"), judulHtml: esc(t("kl.dekat")), subHtml: esc(t("kl.dekat.sub")), isiHtml: dekatHtml(s), tingkat: "h3" })
    + exHtml({ id: "klCara", ikon: "metode", topik: t("an.cara"), judulHtml: `${esc(t("an.cara"))} ${hip}`, isiHtml: `<div class="jm-an-cara">${[1, 2, 3, 4, 5].map((i) => `<p>${esc(t("kl.cara" + i))}</p>`).join("")}<p><a href="/metode">${esc(t("kl.metode"))}</a></p></div>`, tingkat: "h3" });
  const ulang = debounce(() => segarkan(wadah, s));
  wadah.querySelector(".jm-kl-form").addEventListener("input", (e) => {
    const i = e.target.closest("input[data-k]"); if (!i) return;
    const v = Number(i.value);
    if (i.value !== "" && Number.isFinite(v) && v >= 0) { s.a[i.dataset.k] = v / Number(i.dataset.skala); ulang(); }
  });
  wadah.querySelector("#klReset").addEventListener("click", () => { s.a = awal(tek); wadah.querySelectorAll("input[data-k]").forEach((i) => { i.value = s.a[i.dataset.k] * Number(i.dataset.skala); }); segarkan(wadah, s); });
  segarkan(wadah, s);
}
