/* Kamus dan hitungan murni analisis berita (tanpa DOM, tanpa impor; diuji di Node). Hasilnya EST/Hipotesis: kata kunci pada judul, bukan pemahaman isi.
   Ditiru dari poskokarhutla scripts/data/berita.py (ISU, tuntutan_dari) dan index.html (negaraMedia). Tanpa skor sentimen (belum teruji). */
const HARI = 86400000, JAM = 3600000;

/** Isu EBET: [id, regex judul, kata cari untuk filter daftar]. */
export const ISU = [
  ["plts100", /100\s*GW|PLTS\s*100/i, "100 gw"], ["biodiesel", /\bB-?(30|40|50)\b|biodiesel/i, "biodiesel"], ["etanol", /\bE-?(10|20)\b|etanol|ethanol/i, "etanol"],
  ["jetp", /\bJETP\b/i, "jetp"], ["ruptl", /RUPTL/i, "ruptl"], ["pensiun", /pensiun(?:\s+dini)?\s+PLTU|PLTU.{0,30}pensiun|coal phase.?out|retire.{0,20}coal/i, "pensiun"],
  ["tarif", /tarif|harga patokan|\bHPP\b|\bBPP\b|feed-?in/i, "tarif"], ["atap", /PLTS\s+atap|rooftop/i, "atap"], ["psel", /\bPSEL\b|waste.to.energy|\bWtE\b|sampah.{0,25}(energi|listrik)|(energi|listrik).{0,25}sampah/i, "sampah"],
  ["panasbumi", /panas\s*bumi|geotherm|\bWKP\b/i, "panas bumi"], ["tkdn", /\bTKDN\b|local content/i, "tkdn"], ["karbon", /IDXCarbon|bursa karbon|perdagangan karbon|carbon (market|credit|trading)|kredit karbon/i, "karbon"],
  ["nuklir", /nuklir|nuclear|\bPLTN\b|\bSMR\b/i, "nuklir"], ["hidrogen", /hidrogen|hydrogen/i, "hidrogen"], ["baterai", /baterai|battery|batteries|kendaraan listrik|\bEV\b|electric vehicle/i, "baterai"],
];
/** Desakan publik: [id, regex topik]. Syarat tambahan: DESAK_KATA pada judul yang sama. */
export const DESAK_KATA = /\b(desak|minta|dorong|tuntut|usul|harap|urge[sd]?|call(?:s|ed)? for|demand)/i;
export const DESAK = [
  ["izin", /(percepat|permudah|sederhana|simplif|streamline).{0,25}(izin|perizinan|permit)|izin.{0,25}(cepat|mudah|berbelit)|perizinan|permit/i], ["insentif", /insentif|tarif|harga|subsidi|incentive|tariff/i],
  ["regulasi", /kepastian|regulasi|aturan|payung hukum|regulat|policy certainty/i], ["tkdn", /\bTKDN\b|local content|produk dalam negeri/i],
  ["pensiun", /pensiun|PLTU|batu ?bara|coal/i], ["dana", /pendanaan|pembiayaan|investasi|dana\b|financ|funding|investment/i],
];
/** Kabar kebijakan dan tenggat. */
export const KEBIJAKAN = [
  ["revisi", /\b(revisi|ubah|perubahan|terbitkan|terbit|teken|cabut|amend|revise)\b.{0,40}(aturan|permen|perpres|peraturan|regulasi|kepmen|\bPP\b|\bUU\b|rule|regulation)|(aturan|permen|perpres|peraturan|regulasi|kepmen).{0,30}(baru|direvisi|terbit)/i, "/regulasi"],
  ["lelang", /lelang|tender|auction|\bWKP\b/i, "/kalender"], ["tarif", /tarif (baru|listrik)|harga patokan|\bHPP\b|new tariff/i, "/regulasi"],
  ["tenggat", /tenggat|batas waktu|paling lambat|jatuh tempo|deadline|hingga akhir 20\d\d/i, "/kalender"],
  ["luncur", /luncur|resmikan|peresmian|groundbreaking|operasi komersial|\bCOD\b|inaugurat|commission/i, "/kalender"],
];

const STOP = { has: (w) => /^(yang|dan|di|ke|dari|untuk|dengan|pada|ini|itu|akan|atau|oleh|dalam|para|juga|ada|the|and|for|with|that|this|from|will|has|have|are|was|its|new|of|in|to|on|at|by|as|is|be|an)$/.test(w) };
export const token = (j) => new Set(String(j).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").split(" ").filter((w) => w.length >= 3 && !STOP.has(w)));
export function jaccard(a, b) { let i = 0; for (const x of a) if (b.has(x)) i++; const u = a.size + b.size - i; return u ? i / u : 0; }

/** Kluster judul sejenis: serakan pertama (terbaru) jadi benih; anggota harus dalam jendela jam dari benih dan Jaccard >= ambang. Mengembalikan kluster dengan >= minMedia media. */
export function klaster(rows, { jam = 72, ambang = 0.4, minMedia = 2 } = {}) {
  const urut = [...rows].sort((x, y) => y.terbit.localeCompare(x.terbit)), ks = [];
  for (const r of urut) {
    const tk = token(r.judul), tr = Date.parse(r.terbit);
    const k = ks.find((c) => Math.abs(c.t - tr) <= jam * JAM && jaccard(c.tk, tk) >= ambang);
    k ? k.rows.push(r) : ks.push({ t: tr, tk, rows: [r] });
  }
  return ks.map((c) => ({ rows: c.rows, media: [...new Set(c.rows.map((r) => r.media))], lead: c.rows[0] })).filter((c) => c.media.length >= minMedia).sort((a, b) => b.media.length - a.media.length || b.rows.length - a.rows.length);
}

/** Jendela relatif ke waktu `ak`: n hari terakhir vs n hari sebelumnya. */
export function banding(rows, f, ak, hari) {
  let a = 0, b = 0;
  for (const r of rows) { if (!f(r)) continue; const d = (ak - Date.parse(r.terbit)) / HARI; if (d >= 0 && d < hari) a++; else if (d >= hari && d < 2 * hari) b++; }
  return { a, b, selisih: b ? Math.round((a / b - 1) * 100) : null };
}
export const hitungIsu = (rows, ak) => ISU.map(([id, re, cari]) => {
  const f = (r) => re.test(r.judul), h = banding(rows, f, ak, 1), m = banding(rows, f, ak, 7);
  return { id, cari, h24: h.a, h7: m.a, lalu: m.b, selisih: m.selisih };
}).filter((x) => x.h7 + x.lalu > 0).sort((x, y) => y.h7 - x.h7 || y.h24 - x.h24);

/** Deret harian n hari berakhir pada ak (indeks 0 = tertua). */
export function harian(rows, f, ak, n = 30) {
  const out = new Array(n).fill(0);
  for (const r of rows) { if (!f(r)) continue; const d = Math.floor((ak - Date.parse(r.terbit)) / HARI); if (d >= 0 && d < n) out[n - 1 - d]++; }
  return out;
}
export function sparkPoin(deret, w = 120, h = 32) {
  const mx = Math.max(1, ...deret), dx = w / Math.max(1, deret.length - 1);
  return deret.map((v, i) => `${(i * dx).toFixed(1)},${(h - 2 - (v / mx) * (h - 4)).toFixed(1)}`).join(" ");
}

export const hostDari = (r) => { if (r.media && r.media.includes(".")) return r.media.replace(/^www\./, ""); try { return new URL(r.url).hostname.replace(/^www\./, ""); } catch { return ""; } };
/** Tier media dari tabel media_tier.json; domain dicari dari paling spesifik ke induk. Bawaan: id nasional, lainnya internasional. */
export function tierMedia(r, tabel) {
  const host = hostDari(r), p = host.split(".");
  if (p.length >= 3 && (tabel.daerah_prefiks || []).includes(p[0])) return "daerah";
  for (let x = host; x.includes("."); x = x.slice(x.indexOf(".") + 1)) if (tabel.tier[x]) return tabel.tier[x];
  return r.bahasa === "en" ? "internasional" : "nasional";
}

const NEGARA = { "thestar.com.my": "my", "freemalaysiatoday.com": "my", "malaysiasun.com": "my", "mpoc.org.my": "my", "channelnewsasia.com": "sg", "straitstimes.com": "sg", "businesstimes.com.sg": "sg", "asiaone.com": "sg",
  "scmp.com": "hk", "reuters.com": "gb", "bbc.com": "gb", "theguardian.com": "gb", "ft.com": "gb", "investegate.co.uk": "gb", "bloomberg.com": "us", "nytimes.com": "us", "forbes.com": "us", "cnn.com": "us", "newsweek.com": "us", "fortune.com": "us", "latimes.com": "us",
  "xinhuanet.com": "cn", "english.news.cn": "cn", "globaltimes.cn": "cn", "china.org.cn": "cn", "bjreview.com.cn": "cn", "en.ce.cn": "cn", "en.gmw.cn": "cn", "english.anhuinews.com": "cn", "hinews.cn": "cn",
  "aljazeera.com": "qa", "english.aawsat.com": "sa", "dw.com": "de", "finanznachrichten.de": "de", "thehindubusinessline.com": "in", "economictimes.indiatimes.com": "in", "moneycontrol.com": "in", "hindustantimes.com": "in", "livemint.com": "in", "dailypioneer.com": "in",
  "philippinetimes.com": "ph", "shangbao.com.ph": "ph", "manilatimes.net": "ph", "vietnamnews.vn": "vn", "vietnamtribune.com": "vn", "bangkokpost.com": "th", "thailand-business-news.com": "th", "laosnews.net": "la", "bruneinews.net": "bn",
  "smh.com.au": "au", "links.org.au": "au", "thefifthestate.com.au": "au", "yourdemocracy.net.au": "au", "thediplomat.com": "jp", "tribune.com.pk": "pk", "thedailystar.net": "bd", "dailynews.co.tz": "tz", "leadership.ng": "ng", "dailysabah.com": "tr", "trend.az": "az",
  "antaranews.com": "id", "tempo.co": "id", "thejakartapost.com": "id", "kontan.co.id": "id", "republika.co.id": "id", "kompas.com": "id", "indonesiatribune.com": "id", "cnbcindonesia.com": "id" };
const TLD = { my: "my", sg: "sg", au: "au", uk: "gb", in: "in", ph: "ph", th: "th", vn: "vn", jp: "jp", cn: "cn", hk: "hk", tr: "tr", de: "de", fr: "fr", nz: "nz", bn: "bn", kr: "kr", tw: "tw", ca: "ca", qa: "qa", id: "id", pk: "pk", bd: "bd", ng: "ng", tz: "tz", az: "az", la: "la", kh: "kh" };
/** Kode negara media dari domain (ditiru dari negaraMedia Posko). Domain generik .com/.org/.net: perkiraan AS (EST). "" bila tak dikenal. */
export function negaraMedia(d) {
  d = String(d || "").replace(/^www\./, "");
  for (let x = d; x.includes("."); x = x.slice(x.indexOf(".") + 1)) if (NEGARA[x]) return NEGARA[x];
  const tld = d.split(".").pop();
  if (TLD[tld]) return TLD[tld];
  return /\.(com|org|net|news|tv|us)$/.test(d) ? "us" : "";
}
export const BENDERA_ADA = new Set(["id", "my", "sg", "ph", "th", "vn", "bn", "kh", "la", "mm", "tl"]);
