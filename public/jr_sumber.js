/* /jaringan?tab=sumber: status fakta, tanggal data, cara menghitung, seberapa dekat, yang tidak dihitung, atribusi, daftar sumber.
   Kontrak: KEMBARAN-JARINGAN.md §6 butir 8. Baris sumber ber-id `src-<id>` jadi sasaran chip id sumber di semua tab. */
import { t, esc, num, amanUrl, kosongTab } from "/jr_umum.js";
import { tanggal } from "/i18n.js";
import { muatKJ, chipSt, chipSrc, muatSumber } from "/jr_kj.js";

const n1 = (v) => (typeof v === "number" ? num(v, Number.isInteger(v) ? 0 : 1) : "-");
const ST = ["sumber", "hitung", "menunggu", "est"];
const chips = (ids) => ids.map(chipSrc).join("");
/* Langkah per prosedur: kunci i18n + id sumber yang dipakai langkah itu (kontrak §4 butir 1-9). */
const CARA = [
  ["kembaran", ["k.1", ["osm-power"]], ["k.2", ["osm-power"]], ["k.3", ["osm-power"]], ["k.4", ["osm-power", "gem"]], ["k.5", ["gem", "gem-gcpt", "osm-pembangkit"]], ["k.6", ["osm-power"]], ["k.7", ["esdm-statistik-2024"]]],
  ["bauran", ["b.1", ["esdm-statistik-2024"]], ["b.2", ["ipcc-2006", "ipcc-ar5"]], ["b.3", ["esdm-statistik-2024"]]],
  ["aliran", ["a.1", ["esdm-statistik-2024"]], ["a.2", ["osm-power"]], ["a.3", ["osm-power", "esdm-statistik-2024"]], ["a.4", ["osm-power"]]],
];
const ATR = [["osm", "https://www.openstreetmap.org/copyright"], ["gem", "https://globalenergymonitor.org/"], ["esdm", "https://gatrik.esdm.go.id/"], ["gsa", "https://globalsolaratlas.info/"], ["gwa", "https://globalwindatlas.info/"], ["geonames", "https://www.geonames.org/"], ["irbi", "https://inarisk.bnpb.go.id/"], ["bigkab", "https://tanahair.indonesia.go.id/"]];

const bagStatus = () => `<section class="kj-sb-bag" aria-labelledby="sb-st"><h2 id="sb-st">${esc(t("kj.sb.st.j"))}</h2><dl class="kj-sb-dl">${ST.map((s) => `<div><dt>${chipSt(s)}</dt><dd>${esc(t("kj.sb.st." + s))}</dd></div>`).join("")}</dl></section>`;

function bagCara() {
  return `<section class="kj-sb-bag" aria-labelledby="sb-hit"><h2 id="sb-hit">${esc(t("kj.sb.hitung.j"))}</h2>${CARA.map(([k, ...ls]) => `<h3 class="kj-rk-h3">${esc(t("kj.sb.h." + k))}</h3>
    <ol class="kj-sb-ol">${ls.map(([kt, ids], i) => `<li><span class="kj-sb-lg">${esc(t("kj.sb.langkah", { n: i + 1 }))}</span><p>${esc(t("kj.sb." + kt))}</p><p class="kj-kaki">${chips(ids)}</p></li>`).join("")}</ol>`).join("")}</section>`;
}

const tabel = (judul, kolom, baris) => `<h3 class="kj-rk-h3">${esc(judul)}</h3><div class="kj-tabel kj-rk-tb" tabindex="0" role="region" aria-label="${esc(judul)}"><table><thead><tr>${kolom.map(([l, n]) => `<th scope="col"${n ? ` class="kj-rk-n"` : ""}>${esc(l)}</th>`).join("")}</tr></thead><tbody>${baris.join("")}</tbody></table></div>`;
const kosongDekat = () => `<p class="kj-cat">${esc(t("kj.sb.dekat.kosong"))} ${chipSt("menunggu")}</p>`;

const WIL = { Indonesia: "nasional", "Jawa-Madura-Bali": "sis_jawa-bali", Sumatera: "sis_sumatera" };
function bagDekat(E) {
  const bs = new Map((E?.bauran?.sistem || []).map((s) => [s.id, s]));
  const kami = (w, faktor) => { const b = WIL[w] === "nasional" ? E?.nasional : bs.get(WIL[w]); return b?.langsung == null ? null : faktor ? b.langsung / 1000 : (b.langsung * b.total) / 1e6; };
  const awal = (o) => { const y = Object.keys(o || {}).sort()[0]; return y ? [y, o[y]] : null; };
  const rows = (E?.pembanding_emisi || []).map((r) => {
    const f = !r.emisi_juta_tco2, [y, v] = awal(f ? r.faktor_t_co2_mwh : r.emisi_juta_tco2) || [], k = kami(r.wilayah, f);
    return v == null ? "" : `<tr><th scope="row">${esc(r.wilayah)}</th><td>${esc(r.skenario)}</td><td>${esc(t(f ? "kj.sb.u.faktor" : "kj.sb.u.emisi"))}</td><td class="kj-rk-n">${esc(num(v, f ? 2 : 0))} (${esc(y)}) ${chipSrc(r.src)}</td><td class="kj-rk-n">${k == null ? "-" : `${esc(num(k, f ? 2 : 0))} (${esc(E.nasional?.tahun || "")}) ${chipSt("est")}`}</td></tr>`;
  }).filter(Boolean);
  const int = rows.length ? tabel(t("kj.sb.dekat.int"), [[t("kj.sb.c.sistem")], [t("kj.sb.c.skenario")], [t("kj.sb.c.ukuran")], [t("kj.sb.c.ruptl"), 1], [t("kj.sb.c.kami"), 1]], rows) + `<p class="kj-cat">${esc(t("kj.sb.dekat.proyeksi"))}</p>` : `<h3 class="kj-rk-h3">${esc(t("kj.sb.dekat.int"))}</h3>${kosongDekat()}`;
  const kt = E?.kiriman_terbit || [];
  const ali = kt.length ? tabel(t("kj.sb.dekat.ali"), [[t("kj.sb.c.batas")], [t("kj.sb.c.terbit"), 1], [t("kj.sb.c.mw"), 1], [t("kj.sb.c.sel"), 1], [t("kj.sb.c.banding")]],
    kt.map((r) => `<tr><th scope="row">${esc(t("kj.sb.batas_ab", { a: r.dari, b: r.ke }))} ${chipSrc(r.src)}<br><span class="kj-tgl">${esc((r.tanggal_terbit || r.tanggal) ? tanggal(r.tanggal_terbit || r.tanggal) : "")}</span></th><td class="kj-rk-n">${esc(n1(r.terbit_mw ?? r.nilai_mw))}</td><td class="kj-rk-n">${esc(n1(r.kami?.mw))}</td><td class="kj-rk-n">${esc(n1(r.selisih_mw))}${r.selisih_persen != null ? ` (${esc(n1(r.selisih_persen))}%)` : ""}</td><td>${esc(t("kj.sb.sb." + (r.sebanding || "tidak")))}${r.alasan ? `<br><span class="kj-tgl">${esc(r.alasan)}</span>` : ""}</td></tr>`)) : `<h3 class="kj-rk-h3">${esc(t("kj.sb.dekat.ali"))}</h3>${kosongDekat()}`;
  return `<section class="kj-sb-bag" aria-labelledby="sb-dkt"><h2 id="sb-dkt">${esc(t("kj.sb.dekat.j"))}</h2>${int}${ali}</section>`;
}

const bagTidak = () => `<section class="kj-sb-bag" aria-labelledby="sb-tdk"><h2 id="sb-tdk">${esc(t("kj.sb.tidak.j"))}</h2><ul class="kj-rk-ul">${[1, 2, 3, 4, 5].map((i) => `<li class="kj-rk-tk"><span>${esc(t("kj.sb.tidak." + i))}</span></li>`).join("")}</ul></section>`;
const bagAtr = () => `<section class="kj-sb-bag" aria-labelledby="sb-atr"><h2 id="sb-atr">${esc(t("kj.sb.atr.j"))}</h2><ul class="kj-rk-ul">${ATR.map(([k, u]) => `<li class="kj-rk-tk"><span>${esc(t("kj.sb.atr." + k))}</span><a class="kj-rk-nm" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(new URL(u).host)}</a></li>`).join("")}</ul></section>`;

/** Gabung sumber ringkas.json (lisensi) dan energi.json (url) menurut id; tanggal dari fakta pertama yang bersumber itu. */
function gabung(R, E, S0, Dr) {
  const peta = new Map(), tgl = {};
  for (const s of S0) peta.set(s.id, { ...peta.get(s.id), ...s });
  for (const a of [...R.angka, ...R.tegangan, ...R.neraca, ...(E ? [E.nasional, ...E.faktor.map((f) => ({ ...f, src: f.src_langsung }))] : [])]) if (a?.src && a.tgl) tgl[a.src] ??= a.tgl;
  const lain = E ? [...E.keandalan, ...E.keandalan_nasional, ...(Dr?.tren_pln_nasional || []), ...(Dr?.tren_nasional || []), ...(Dr?.produksi_pln_nasional || []), ...E.pembanding_esdm_lain, ...E.kartu_provinsi.flatMap((k) => [...(k.penjualan_gwh || []), k.mva_per_kv]), ...E.kartu_sistem.map((k) => k.beban_puncak), ...E.bauran.sistem.map((x) => x.pembanding_esdm), ...E.neraca.map((n) => ({ src: n.src_penjualan, tgl: n.tgl }))] : [];
  for (const a of lain) if (a?.src && a.tgl) tgl[a.src] ??= a.tgl;
  return [...peta.values()].map((s) => ({ ...s, tgl: s.tanggal_terbit || s.tgl || tgl[s.id] || "" }));
}
const tak = () => t("kj.sb.tak");
function bagTanggal(S) {
  return `<section class="kj-sb-bag" aria-labelledby="sb-tgl"><h2 id="sb-tgl">${esc(t("kj.sb.tgl.j"))}</h2><ul class="kj-rk-ul">${S.map((s) => `<li class="kj-rk-tk">${chipSrc(s.id)}<span>${esc(s.tgl ? tanggal(s.tgl) : t("kj.sb.tgl.tak"))}</span></li>`).join("")}</ul></section>`;
}
function bagDaftar(S) {
  return `<section class="kj-sb-bag" aria-labelledby="sb-dft"><h2 id="sb-dft">${esc(t("kj.sb.daftar.j"))}</h2><ul class="kj-sb-src">${S.map((s) => `<li class="kj-sb-it" id="src-${esc(s.id)}"><h3><span class="kj-src">${esc(s.id)}</span> ${esc(s.judul)}</h3>
    <dl class="kj-dl"><div><dt>${esc(t("kj.sb.f.penerbit"))}</dt><dd>${esc(s.penerbit || tak())}</dd></div><div><dt>${esc(t("kj.sb.f.tgl"))}</dt><dd>${esc(s.tgl ? tanggal(s.tgl) : tak())}</dd></div><div><dt>${esc(t("kj.sb.f.lisensi"))}</dt><dd>${esc(s.lisensi || tak())}</dd></div></dl>
    ${amanUrl(s.url) ? `<a class="kj-lnk" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(t("kj.sb.buka"))}</a>` : `<p class="kj-cat">${esc(t("kj.sb.buka_tak"))}</p>`}</li>`).join("")}</ul></section>`;
}

export async function mulai(panel) {
  const [R, E, SM, Dr] = await Promise.all([muatKJ("ringkas"), muatKJ("energi"), muatSumber(), muatKJ("deret")]);
  if (!R?.meta) { panel.innerHTML = kosongTab("kj.sb.kosong"); return; }
  const S = gabung(R, E, [...SM.values()], Dr);
  panel.innerHTML = `<div class="kj-rk kj-sb"><h2 class="kj-rk-judul">${esc(t("kj.sb.judul"))}</h2>${bagStatus()}${bagTanggal(S)}${bagCara()}${bagDekat(E)}${bagTidak()}${bagAtr()}${bagDaftar(S)}</div>`;
  const h = decodeURIComponent(location.hash || ""), el = h.startsWith("#src-") ? document.getElementById(h.slice(1)) : null;
  if (el) { el.classList.add("kj-sb-sorot"); el.scrollIntoView({ block: "center" }); }
}
