/* Pembantu bersama /investasi (kartu, lembar, banding): format angka, pil, lambang, dan teks masukan tiap komponen skor. Teks lewat t() (kunci iv.*). */
import { t, angka } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { logoOrgSatu } from "/inti/logo_org.js";
import { pilTek, pilStatus } from "/inti/ikon_tek.js";
import { tingkatKesiapan } from "/inti/investasi_rumus.js";

export const N = (n, d = 0) => angka(n, { desimal: d });
export const KOMP = ["izin", "harga", "lahan", "sumber", "pendanaan", "jaringan"];
export const pct = (x) => (x == null ? "-" : `${N(x * 100, 1)}%`);
export const rpkwh = (x) => (x == null ? "-" : t("iv.rp_kwh", { n: N(x) }));
export const usd = (juta) => (juta == null ? "-" : juta >= 1000 ? t("iv.usd_miliar", { n: N(juta / 1000, 1) }) : t("iv.usd_juta", { n: N(juta, juta < 100 ? 1 : 0) }));
export const rpMiliar = (m) => (m == null ? "-" : Math.abs(m) >= 1000 ? t("iv.rp_triliun", { n: N(m / 1000, 1) }) : t("iv.rp_miliar", { n: N(m, 1) }));
export const tahun = (x) => (x == null ? "-" : t("iv.tahun", { n: N(x, 1) }));
export const hipPil = () => `<span class="jm-pil jm-pil-warn">${esc(t("kl.hipotesis"))}</span>`;
export const lambang = (kode, u = 20) => (kode ? `<img class="iv-lambang" src="/img/provinsi/${esc(kode)}.png" width="${u}" height="${u}" alt="" loading="lazy" decoding="async" data-galat="hapus">` : "");
export const bendera = (iso, u = 20) => (/^[A-Za-z]{2}$/.test(iso || "") ? `<img class="iv-bendera" src="/img/bendera/${esc(String(iso).toLowerCase())}.svg" width="${u}" height="${Math.round(u * 0.75)}" alt="" loading="lazy" decoding="async" data-galat="hapus">` : "");
export const logoPemilik = (p, u = 24) => {
  if (!p) return "";
  const src = logoOrgSatu(p.org_id, p.nama, p.logo);
  return `<span class="iv-logo">${ikon("gedung", 14)}${src ? `<img src="${esc(src)}" width="${u}" height="${u}" alt="" loading="lazy" decoding="async" data-galat="hapus">` : ""}</span>`;
};
export const pemilikHtml = (b) => (b.pemilik?.nama ? `${logoPemilik(b.pemilik)}<span class="iv-teks">${esc(b.pemilik.nama)}</span>` : `<span class="iv-redup">${esc(t("iv.c.tanpa_pemilik"))}</span>`);
export const lokasiHtml = (b) => `${lambang(b.prov_kode)}<span class="iv-teks">${esc(b.prov || "-")}</span>`;
export const pilTahap = (b) => pilStatus(b.status);
export { pilTek };

export const pilTingkat = (skor) => {
  const k = tingkatKesiapan(skor);
  return k ? `<span class="jm-pil iv-sk iv-sk-${k}">${ikon(k === "t" ? "centang" : k === "s" ? "info" : "peringatan", 14)}<span>${esc(t("iv.tingkat." + k))}</span></span>` : `<span class="jm-pil">${esc(t("iv.tingkat.n"))}</span>`;
};
export const skorHtml = (b) => (b.skor == null ? `<b class="iv-angka">-</b>` : `<b class="iv-angka iv-sk-${b.tingkat}">${esc(N(b.skor, 1))}</b>`);
export const nilaiPil = (x) => (x == null ? `<span class="iv-redup" title="${esc(t("iv.mk.kosong"))}">-</span>` : `<span class="jm-pil iv-nilai iv-nl-${x >= 0.6 ? "t" : x >= 0.4 ? "s" : "r"}"><i aria-hidden="true"></i><b>${esc(N(x * 100))}</b></span>`);

/** Tautan ke /model-keuangan dengan parameter proyek terisi (model bisnis IPP, harga patokan, kapasitas, provinsi, faktor lokasi, skala biaya). */
export function tautModel(b) {
  const m = b.model;
  if (!m || m.galat) return "";
  const q = new URLSearchParams({ tek: m.id, mw: String(b.mw), prov: String(b.prov_kode), lok: String(m.lok), skala: m.skala });
  if (m.diisi?.includes("capex")) q.set("capex", String(m.capex_usd_kw));
  if (m.diisi?.includes("opex")) q.set("opex", String(m.opex_usd_kw_thn));
  if (m.diisi?.includes("fk")) q.set("fk", String(m.fk));
  return "/model-keuangan?" + q.toString();
}

/** Teks masukan satu komponen (apa yang dihitung dari mana). */
export function masukan(b, k) {
  const m = b.m, md = b.model;
  const st = t("pj.st." + b.status);
  if (k === "izin") return m.izinProv == null ? t("iv.mk.izin_tanpa", { status: st }) : t("iv.mk.izin", { status: st, skor: N(m.izinProv) });
  if (k === "harga") return m.rasioHarga == null ? t("iv.mk.kosong") : t("iv.mk.harga", { tarif: N(md.tarif), lcoe: N(md.lcoe), rasio: N(m.rasioHarga, 2) });
  if (k === "lahan") return m.risiko == null ? t("iv.mk.kosong") : t("iv.mk.lahan", { skor: N(m.risiko), kelas: t("iv.r.kelas." + b.risiko.kelas) });
  if (k === "sumber") return m.sumber == null ? t("iv.mk.kosong") : t("iv.mk.sumber", { n: N(m.sumber, 2) });
  if (k === "pendanaan") return t("iv.mk.dana." + m.dana);
  return m.jarakKm == null ? t(b.presisi === "provinsi" ? "iv.mk.jaringan_prov" : "iv.mk.kosong") : t("iv.mk.jaringan", { km: N(m.jarakKm), presisi: t("iv.presisi." + b.presisi) });
}

/** Tiga ubin ringkas model: IRR, LCOE, kebutuhan dana. */
export function ubinModel(b) {
  const m = b.model;
  if (m.galat) return null;
  return [["irr", pct(m.irr)], ["lcoe", rpkwh(m.lcoe)], ["dana", usd(m.capex_usd_juta)]];
}
