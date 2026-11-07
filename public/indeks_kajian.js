/* Perakit kajian /indeks: murni, deterministik, tanpa DOM dan tanpa i18n (dimuat layar dan uji node:test).
   Masukan: indeks.json + peluang.json. Keluaran: struktur {k: kunci kamus, p: parameter angka asli}; tidak ada angka karangan. */
export const TEK = ["surya", "bayu", "hidro", "panas_bumi", "bioenergi"];
const nilai = (k) => (k && typeof k.skor === "number" ? k.skor : null);
const urutSkor = (kom) => Object.entries(kom).filter(([, k]) => nilai(k) !== null).sort((a, b) => b[1].skor - a[1].skor);
const rata = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const bulat = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

/** Satu alasan berangka dari satu komponen provinsi; null bila komponen tak punya mentah. */
export function alasanKomponen(id, k, ctx = {}) {
  if (!k || k.mentah === null || k.mentah === undefined) return null;
  const m = k.mentah;
  if (id === "bpp") {
    const nas = ctx.bppNasional;
    return nas ? { id, k: "ix.kj.r.bpp" + (m >= nas ? "_atas" : "_bawah"), p: { v: m, nas } } : { id, k: "ix.kj.r.bpp_netral", p: { v: m } };
  }
  if (id === "rued") return { id, k: "ix.kj.r.rued", p: {} };
  return { id, k: "ix.kj.r." + id, p: { v: m } };
}

/** Sisa potensi per teknologi dari satu baris peluang: [{tek, potensi, terpasang, sisa, persen_sisa}] menurun menurut sisa. */
export function sisaPotensi(baris) {
  const out = [];
  for (const tek of TEK) {
    const pot = baris?.potensi?.[tek]?.mw, ter = baris?.terpasang?.[tek]?.mw;
    if (typeof pot !== "number" || pot <= 0) continue;
    const t = typeof ter === "number" ? ter : 0;
    out.push({ tek, potensi: pot, terpasang: t, sisa: Math.max(0, pot - t), persen_sisa: bulat(Math.max(0, 1 - t / pot) * 100) });
  }
  return out.sort((a, b) => b.sisa - a.sisa);
}

export function susunKajian(indeks, peluang) {
  const per = new Map((peluang?.baris || []).map((b) => [b.kode, b]));
  const ber = indeks.provinsi.filter((p) => p.peringkat).sort((a, b) => a.peringkat - b.peringkat);
  const kom = (p, id) => p.komponen[id];
  const nama = Object.fromEntries(indeks.provinsi.map((p) => [p.kode, p.nama]));

  const paling = ber.slice(0, 5).map((p) => {
    const b = per.get(p.kode), ctx = { bppNasional: b?.bpp?.nasional_rp_kwh };
    const alasan = urutSkor(p.komponen).map(([id]) => alasanKomponen(id, kom(p, id), ctx)).filter(Boolean).slice(0, 3);
    const lemah = urutSkor(p.komponen).reverse()[0];
    const risiko = lemah ? { id: lemah[0], k: "ix.kj.risiko", p: { skor: lemah[1].skor } } : null;
    const tek = sisaPotensi(b)[0] || null;
    return { kode: p.kode, nama: p.nama, skor: p.skor, peringkat: p.peringkat, alasan, risiko, tek, kosong: p.kosong };
  });

  const perTek = TEK.map((tek) => ({
    tek,
    baris: ber.map((p) => { const s = sisaPotensi(per.get(p.kode)).find((x) => x.tek === tek); return s && { kode: p.kode, nama: p.nama, ...s }; }).filter(Boolean).sort((a, b) => b.sisa - a.sisa).slice(0, 3),
  })).filter((x) => x.baris.length);

  const investor = ber.map((p) => {
    const peluang = rata(["potensi", "ruptl", "bpp", "wkp"].map((id) => nilai(kom(p, id))).filter((v) => v !== null));
    const risiko = (1 - p.kelengkapan) * 100 + Object.values(p.komponen).filter((k) => nilai(k) !== null && k.skor < 20).length * 10 + (nilai(kom(p, "rued")) === null ? 10 : 0);
    return { kode: p.kode, nama: p.nama, peluang: bulat(peluang), risiko: bulat(risiko), rasio: bulat(peluang / (risiko + 10), 2) };
  }).sort((a, b) => b.rasio - a.rasio).slice(0, 3);
  const pemda = ber.filter((p) => nilai(kom(p, "rued")) === null).slice(0, 3).map((p) => ({ kode: p.kode, nama: p.nama, skor: p.skor, peringkat: p.peringkat }));
  const pemasok = ber.map((p) => ({ kode: p.kode, nama: p.nama, plts: kom(p, "plts_atap")?.mentah ?? 0, ruptl: kom(p, "ruptl")?.mentah ?? 0 }))
    .map((x) => ({ ...x, total: bulat(x.plts + x.ruptl) })).sort((a, b) => b.total - a.total).slice(0, 3);

  const tertinggal = ber.slice(-5).reverse().map((p) => ({
    kode: p.kode, nama: p.nama, skor: p.skor, peringkat: p.peringkat,
    pemberat: urutSkor(p.komponen).reverse().slice(0, 2).map(([id, k]) => ({ id, skor: k.skor })),
  }));

  const kosongSemua = {};
  for (const p of indeks.provinsi) for (const id of p.kosong) kosongSemua[id] = (kosongSemua[id] || 0) + 1;
  const batas = { kosong: Object.entries(kosongSemua).map(([id, n]) => ({ id, n })), n_prov: indeks.provinsi.length, tanpa_rank: indeks.provinsi.length - ber.length };
  return { paling, perTek, peran: { investor, pemda, pemasok }, tertinggal, batas, nama };
}
