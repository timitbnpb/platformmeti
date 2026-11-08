/* /program#psn: fungsi murni (tanpa DOM, diuji di Node). Data = /data/psn.json (scripts/pipa/psn_bangun.mjs). */
export const SEKTOR = ["energi", "kawasan", "teknologi", "program"];
export const IKON_SEKTOR = { energi: "petir", kawasan: "denah", teknologi: "laptop", program: "bintang" };
export const STATUS = ["beroperasi", "sebagian", "konstruksi", "pra-konstruksi", "rencana", "tidak-diketahui"];
export const IKON_STATUS = { beroperasi: "centang", sebagian: "tingkat", konstruksi: "industri", "pra-konstruksi": "jam", rencana: "kalender", "tidak-diketahui": "tanya" };
export const DANA = ["apbn", "bumn", "swasta", "kpbu"];
export const IKON_DANA = { apbn: "kemenkeu", bumn: "pabrik", swasta: "gedung", kpbu: "kartu" };
export const ENERGI = ["inti", "turunan"];
export const NEGARA = { Inpex: "jp", Eni: "it", bp: "gb", Petronas: "my", Rosneft: "ru", "ib vogt": "de", Genting: "my", CATL: "cn", Sojitz: "jp" };

/** Saring baris: s = {q, sektor, prov, status, energi, dana, lengkap}. Nilai kosong = tidak menyaring. */
export function saring(baris, s) {
  const q = (s.q || "").toLowerCase().trim();
  return baris.filter((b) => (!q || (b.nama + " " + b.lokasi).toLowerCase().includes(q))
    && (!s.sektor || b.sektor === s.sektor) && (!s.prov || b.prov_kode.includes(s.prov)) && (!s.status || b.status === s.status)
    && (!s.energi || (s.energi === "ada" ? !!b.energi : b.energi === s.energi)) && (!s.dana || b.dana.includes(s.dana)) && (!s.lengkap || b.lengkap === 1));
}

/** Nilai investasi dalam miliar rupiah-setara tidak dihitung (kurs tidak ditebak): kembalikan {usd, rp} terpisah dari baris yang punya angka. */
export function totalInvestasi(baris) {
  let usd = 0, rp = 0, n = 0;
  for (const b of baris) { const i = b.investasi; if (!i) continue; n++; if (i.usd_miliar) usd += i.usd_miliar; else if (i.rp_triliun) rp += i.rp_triliun; }
  return { usd, rp, n };
}

/** Hitung per kunci (fungsi yang mengembalikan satu kunci atau daftar kunci); urut menurun menurut jumlah. */
export function hitungPer(baris, kunci) {
  const m = new Map();
  for (const b of baris) for (const k of [].concat(kunci(b) ?? []).filter((x) => x !== "" && x != null)) m.set(k, (m.get(k) || 0) + 1);
  return [...m].map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n || String(a.k).localeCompare(String(b.k)));
}

/** Tahun dari "2026-07-16" | "2027-01" | "2030" -> angka; selain itu null. */
export const tahunDari = (s) => { const m = String(s ?? "").match(/^(\d{4})/); return m ? +m[1] : null; };

/** Baris linimasa: baris yang punya cod atau tonggak bertanggal; mulai = tahun tonggak paling awal (atau cod), selesai = cod ?? tahun tonggak paling akhir. */
export function barisLinimasa(baris) {
  const out = [];
  for (const b of baris) {
    const ths = (b.tonggak || []).map((x) => tahunDari(x.tgl)).filter(Boolean);
    if (b.cod == null && !ths.length) continue;
    const semua = [...ths, ...(b.cod != null ? [b.cod] : [])];
    out.push({ b, mulai: Math.min(...semua), selesai: b.cod ?? Math.max(...ths), tonggak: (b.tonggak || []).filter((x) => tahunDari(x.tgl)) });
  }
  return out.sort((a, c) => a.selesai - c.selesai || a.mulai - c.mulai);
}

/** Baris CSV (judul + isi) dari baris terfilter; sel mentah, kutip diurus aksi_ex. */
export function barisCsv(baris, judul) {
  return [judul, ...baris.map((b) => [b.id, b.tipe, b.sektor, b.nama, b.lokasi, b.prov_kode.join(","), b.status, b.progres ?? "", b.cod ?? "", b.investasi?.usd_miliar != null ? "USD " + b.investasi.usd_miliar + " miliar" : b.investasi?.rp_triliun != null ? "Rp " + b.investasi.rp_triliun + " triliun" : "", b.kapasitas ? b.kapasitas.nilai + " " + b.kapasitas.satuan : "", b.dana.join(","), b.pelaksana.map((x) => x.nama).join("; "), b.tingkat_bukti, b.sumber.map((s) => s.url).filter(Boolean).join(" ")])];
}
