/* Pembantu Video: gabungan kanal METI, IndoEBTKE ConEx (video_kanal.json) dan video ekosistem (video.json); seri/playlist, topik, kartu seragam. */
import { t, tanggal } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { muat } from "/publik.js";
import { thumbUrl, durasiTeks, topikDari } from "/event_umum.js";

export const SEGMEN = ["meti", "conex", "eko"];
/* seri = playlist: urutan penting, yang pertama cocok menang. */
export const SERI = [
  ["conex-2026", /12th|2026/i, "conex"], ["conex-2023", /11th|2023/i, "conex"], ["conex-2021", /2021/i, "conex"], ["munas", /musyawarah nasional|munas/i], ["bincang-meti", /bincang/i],
  ["roundtable", /roundtable/i], ["profil", /profile|profil/i], ["field-trip", /field trip/i],
];
export const seriDari = (v) => {
  const s = SERI.find(([, re, kanal]) => re.test(v.judul) && (!kanal || v.segmen === kanal));
  return s ? s[0] : v.segmen === "conex" ? "conex-2026" : v.segmen === "eko" ? "ekosistem" : "lain";
};
export const SERI_SLUG = { "conex-2026": "indoebtke-conex-2026", munas: "munas-meti-viii-2022" };

let cache = null;
export function muatVideo() {
  return (cache ||= Promise.all([muat("video_kanal"), muat("video").catch(() => ({ baris: [] }))]).then(([k, e]) => {
    const meta = k.kanal;
    const a = k.baris.map((v) => ({ id: v.id, judul: v.judul, tanggal: v.terbit.slice(0, 10), segmen: v.kanal, kanalNama: meta[v.kanal].nama, durasi: v.durasi_detik || 0, ringkas: v.ringkas || "" }));
    const b = (e.baris || []).map((v) => ({ id: v.id, judul: v.judul, tanggal: v.terbit.slice(0, 10), segmen: "eko", kanalNama: v.kanal.trim(), durasi: v.durasi_detik || 0, ringkas: "", tonton: v.tonton, oid: v.organisasi_ids || [], jenis: v.jenis }));
    const semua = [...a, ...b].map((v) => ({ ...v, seri: seriDari(v), topik: topikDari(v.judul) })).sort((x, y) => y.tanggal.localeCompare(x.tanggal));
    return { semua, kanal: meta, unggulan: k.unggulan };
  })).catch((e) => { cache = null; throw e; });
}
export const logoKanal = (v) => (v.segmen === "eko" ? "" : "/img/logo-meti-tanda.png");
export const kartuVideo = (v) => `<li><a class="vid-kartu" href="/video/${esc(v.id)}"><span class="vid-thumb"><img src="${esc(thumbUrl(v.id))}" alt="" loading="lazy" decoding="async" width="320" height="180">${v.durasi ? `<span class="vid-dur">${esc(durasiTeks(v.durasi))}</span>` : ""}<span class="vid-main">${ikon("putar", 40)}</span></span>
  <b class="vid-j">${esc(v.judul)}</b><small class="vid-meta">${esc(v.kanalNama)} - ${esc(tanggal(v.tanggal))}</small></a></li>`;
