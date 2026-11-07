import * as hak from "./hak.js";
import { sha } from "./util.js";

// lalin.js: klasifikasi lalu lintas orang vs AI vs mesin pencari (murni, tanpa D1; tulis D1 ada di hak.js).
// Tiru poskokarhutla/src/publik.js. Sumber daftar IP operator: diambil cron harian ke tabel lalin_ip lewat hak.js.

// [nama, pola UA, kunci daftar IP operator (null = operator tidak menerbitkan daftar)]
export const AI_JAWAB = [["ChatGPT", /ChatGPT-User/i, "openai-user"], ["Claude", /Claude-User/i, null], ["Perplexity", /Perplexity-User/i, "perplexity-user"],
  ["Mistral Le Chat", /MistralAI-User/i, null], ["Meta AI", /meta-externalfetcher/i, null], ["DuckAssist", /DuckAssistBot/i, null],
  ["Google (permintaan pengguna)", /Google-(?:Read-Aloud|NotebookLM)/i, null]];
export const AI_CRAWL = [["OAI-SearchBot", /OAI-SearchBot/i, "openai-search"], ["GPTBot", /GPTBot/i, "openai-gptbot"], ["Claude-SearchBot", /Claude-SearchBot/i, null],
  ["ClaudeBot", /ClaudeBot|anthropic-ai/i, null], ["PerplexityBot", /PerplexityBot/i, "perplexity-bot"], ["CCBot", /CCBot/i, "commoncrawl"],
  ["Google-Extended", /Google-Extended/i, "google"], ["Applebot-Extended", /Applebot-Extended/i, "apple"], ["Bytespider", /Bytespider/i, null],
  ["Amazonbot", /Amazonbot/i, null], ["Meta-ExternalAgent", /meta-externalagent/i, null], ["cohere-ai", /cohere-ai|cohere-training/i, null],
  ["Exa", /ExaBot|\bExa\b/i, null], ["YouBot", /YouBot/i, null], ["Diffbot", /Diffbot/i, null], ["Timpibot", /Timpibot/i, null]];
export const MESIN_CARI = [["Googlebot", /Googlebot|Google-InspectionTool|GoogleOther/i, "google"], ["Bingbot", /bingbot|BingPreview/i, "bing"],
  ["Applebot", /Applebot/i, "apple"], ["DuckDuckBot", /DuckDuckBot/i, null], ["YandexBot", /YandexBot/i, null], ["Baiduspider", /Baiduspider/i, null], ["PetalBot", /PetalBot/i, null]];
const BOT_LAIN = /bot\b|bot\/|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|whatsapp|telegram|discord|curl|wget|python|axios|node-fetch|undici|go-http|java\/|okhttp|phantom|puppeteer|playwright|selenium|scrapy|httpclient/i;

export const SUMBER_IP = {
  "openai-gptbot": "https://openai.com/gptbot.json", "openai-search": "https://openai.com/searchbot.json", "openai-user": "https://openai.com/chatgpt-user.json",
  google: "https://developers.google.com/static/search/apis/ipranges/googlebot.json", bing: "https://www.bing.com/toolbox/bingbot.json",
  apple: "https://search.developer.apple.com/applebot.json", "perplexity-bot": "https://www.perplexity.ai/perplexitybot.json",
  "perplexity-user": "https://www.perplexity.ai/perplexity-user.json", commoncrawl: "https://index.commoncrawl.org/ccbot.json",
};

// Jaringan hosting/cloud: tampilan dari sini hampir selalu otomatis (pemindai, pratinjau, skrip), bukan orang.
export const ASN_HOSTING = new Set([16509, 14618, 8987, 396982, 19527, 8075, 8068, 14061, 16276, 24940, 213230, 63949, 20473, 45102, 37963, 132203, 31898,
  51167, 12876, 60781, 28753, 13335, 209242, 36352, 46606, 26496, 55286, 62567, 54290, 4785, 135377, 9009, 212238]);
const ORG_HOSTING = /amazon|aws|google cloud|microsoft corporation|azure|digitalocean|ovh|hetzner|linode|akamai connected cloud|vultr|choopa|alibaba|tencent|oracle|contabo|scaleway|leaseweb|m247|datacamp|colocrossing|hostinger|cloudflare|fastly|zenlayer|psychz|quadranet/i;
export const jaringanHosting = (cf) => ASN_HOSTING.has(Number(cf?.asn)) || ORG_HOSTING.test(cf?.asOrganization || "");

// -> { jenis: ai_jawab|ai_crawl|mesin_cari, nama, op } | { jenis: "tak", alasan } | { jenis: "manusia" }
export function klasifikasi(ua, cf, h = {}) {
  for (const [daftar, jenis] of [[AI_JAWAB, "ai_jawab"], [AI_CRAWL, "ai_crawl"], [MESIN_CARI, "mesin_cari"]])
    for (const [nama, re, op] of daftar) if (re.test(ua)) return { jenis, nama, op };
  if (!ua || BOT_LAIN.test(ua)) return { jenis: "tak", alasan: "bot lain" };
  if (jaringanHosting(cf)) return { jenis: "tak", alasan: "jaringan hosting/cloud" };
  if (!h.bahasa || h.bahasa.trim() === "*" || (h.dest && h.dest !== "document")) return { jenis: "tak", alasan: "tanpa tanda peramban" };
  return { jenis: "manusia" };
}

/* ---------------- CIDR (IPv4 dan IPv6) ---------------- */
export function ipKeAngka(ip) {
  if (ip.includes(".") && !ip.includes(":")) {
    const p = ip.split(".").map(Number);
    if (p.length !== 4 || p.some((x) => !(x >= 0 && x <= 255))) return null;
    return [p.reduce((a, x) => a * 256n + BigInt(x), 0n), 32];
  }
  if (!ip.includes(":")) return null;
  const [a, b] = ip.split("::"), h = a ? a.split(":") : [], t = b != null ? (b ? b.split(":") : []) : [];
  if (b == null && h.length !== 8) return null;
  const g = [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill("0"), ...t];
  if (g.length !== 8 || g.some((x) => !/^[0-9a-f]{1,4}$/i.test(x))) return null;
  return [g.reduce((acc, x) => acc * 65536n + BigInt(parseInt(x, 16)), 0n), 128];
}
export function cidrKe(c) {
  const [ip, pre] = String(c).split("/"), a = ipKeAngka(ip), n = Number(pre);
  if (!a || !Number.isInteger(n) || n < 0 || n > a[1]) return null;
  return [a[0] >> BigInt(a[1] - n), n, a[1]];
}
export const dalamCidr = (ip, daftar) => { const a = ipKeAngka(ip); return !!a && daftar.some(([net, n, bits]) => bits === a[1] && (a[0] >> BigInt(bits - n)) === net); };
export const ambilCidr = (teks) => [...new Set(String(teks).match(/\b(?:\d{1,3}\.){3}\d{1,3}\/\d{1,2}\b|\b[0-9a-f]{1,4}(?::[0-9a-f]{0,4}){2,7}\/\d{1,3}\b/gi) || [])].filter((c) => cidrKe(c));

// rentang = { kunciOperator: [[net, n, bits]] } (hasil hak.lalinRentang). terverifikasi | palsu | tak terverifikasi
export function verifikasi(rentang, op, ip) {
  const d = op && rentang?.[op];
  if (!d?.length) return "tak terverifikasi";
  return dalamCidr(ip, d) ? "terverifikasi" : "palsu";
}

/* ---------------- rujukan, kanal, perangkat, jalur ---------------- */
const AI_REF = /(^|\.)(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com|poe\.com|you\.com|phind\.com|meta\.ai|chat\.mistral\.ai|deepseek\.com)$/;
const SOSIAL = /(^|\.)(whatsapp\.com|wa\.me|facebook\.com|fb\.com|instagram\.com|t\.co|x\.com|twitter\.com|threads\.net|threads\.com|linkedin\.com|lnkd\.in|tiktok\.com|youtube\.com|t\.me|telegram\.org|reddit\.com|line\.me)$/;
const CARI = /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|yahoo\.com|yandex\.[a-z]+|baidu\.com|ecosia\.org|search\.brave\.com)$/;
export function kanal(referer, host, utm) {
  let d = "";
  try { d = new URL(referer).hostname.replace(/^www\.|^m\.|^l\.|^lm\./, ""); } catch { /* tanpa rujukan */ }
  const k = utm ? "kampanye" : !d ? "langsung" : d === host ? "internal" : AI_REF.test(d) ? "jawaban_ai" : SOSIAL.test(d) ? "sosial" : CARI.test(d) ? "pencarian" : "rujukan";
  return { kanal: k, rujukan: d && d !== host ? d.slice(0, 80) : "(langsung)" };
}
export const perangkat = (ua) => (/iPad|Tablet|Android(?!.*Mobi)/i.test(ua) ? "tablet" : /Mobi|iPhone|Android/i.test(ua) ? "ponsel" : "desktop");

// Jalur halaman bersih untuk statistik: huruf kecil, tanpa .html, id di jalur dibuang; asing = "lainnya" (kardinalitas terbatas).
export function jalurBersih(path) {
  const k = String(path).toLowerCase().replace(/\.html$/, "").replace(/(.)\/$/, "$1");
  if (k === "/") return "/";
  const m = k.match(/^\/(o|p|anggota|event|video|program|teknologi|wilayah|meti-wilayah|siaran-pers|daftar)\/.+$/);
  if (m) return `/${m[1]}/*`;
  return /^\/[a-z0-9-]{1,40}$/.test(k) ? k : "lainnya";
}
// Hanya halaman: GET tanpa ekstensi (kecuali .html), bukan /api, bukan aset.
const BUKAN_HALAMAN = /^\/(api|img|fonts|i18n|data|inti|vendor|geo)\//;
export function halamanDihitung(metode, path) {
  if (metode !== "GET" || BUKAN_HALAMAN.test(path)) return false;
  const akhir = path.split("/").pop();
  return !akhir.includes(".") || akhir.endsWith(".html");
}

export const jamWIB = (ms) => new Date(ms + 7 * 3600e3).toISOString().slice(11, 13);
export const tglWIB = (ms) => new Date(ms + 7 * 3600e3).toISOString().slice(0, 10);

/* Rencana catatan satu hit (murni): { tgl, jam, jenis, dim: [[dim, kunci]], tamu?: bool, klik_ai?: bool, kini?: jalur } */
export function rencanaHit({ ua, cf, ip, bahasa, dest, referer, host, utm, jalur, status, rentang, kini }) {
  const k = klasifikasi(ua, cf, { bahasa, dest }), tgl = tglWIB(kini), jam = jamWIB(kini), dim = [];
  if (k.jenis === "manusia") {
    if (status !== 200) return null;
    const r = kanal(referer || "", host, utm);
    dim.push(["halaman", jalur], ["rujukan", r.rujukan], ["kanal", r.kanal], ["negara", cf?.country || "?"], ["perangkat", perangkat(ua)]);
    return { tgl, jam, jenis: "manusia", dim, jalur, klik_ai: r.kanal === "jawaban_ai" };
  }
  if (k.jenis === "tak") return { tgl, jam, jenis: "tak", dim: [["tak", k.alasan]] };
  const v = verifikasi(rentang, k.op, ip);
  if (v === "palsu") return { tgl, jam, jenis: "tak", dim: [["tak", "perayap palsu: " + k.nama]] };
  dim.push(["jalur_bot", jalur]);
  if (k.jenis === "ai_jawab") dim.push(["ai_agen", `${k.nama}|${v}`], ["ai_halaman", jalur]);
  else dim.push(["perayap", `${k.jenis}|${k.nama}|${v}`]);
  return { tgl, jam, jenis: k.jenis, dim };
}

/* ---------------- sisi Worker: dipanggil dari worker.js lewat ctx.waitUntil, setelah respons dikirim ---------------- */
// ponytail: sampel bot per isolat (1 dari 10, hitung menyimpang antar isolat); naikkan jadi penghitung D1 bila statistik bot harus tepat.
let cacahBot = 0;
export async function catatHit(env, req, status, kini = Date.now()) {
  const url = new URL(req.url);
  if (status !== 200 || !halamanDihitung(req.method, url.pathname)) return false;   // 3xx/4xx/5xx (gerbang masuk, 404) tidak menulis D1
  const ua = req.headers.get("user-agent") || "", ip = req.headers.get("cf-connecting-ip") || "", cf = req.cf || {};
  const rentang = await hak.lalinRentang(env, kini, cidrKe);
  const r = rencanaHit({ ua, cf, ip, bahasa: req.headers.get("accept-language"), dest: req.headers.get("sec-fetch-dest"), referer: req.headers.get("referer"),
    host: url.hostname, utm: url.searchParams.get("utm_source"), jalur: jalurBersih(url.pathname), status, rentang, kini });
  if (!r) return false;
  if (r.jenis !== "manusia" && ++cacahBot % (Number(env.SAMPEL_BOT) || 10) !== 0) return false;
  let tamu = null;
  if (r.jenis === "manusia") {
    const h = (await sha((await hak.lalinGaram(env, r.tgl)) + "|" + ip + "|" + ua)).slice(0, 16);
    tamu = { h, hjam: (await sha(h + "|" + r.jam)).slice(0, 16), kini };
  }
  await hak.lalinTulis(env, r, tamu);
  return true;
}

// Cron harian: ambil ulang daftar IP resmi operator (untuk lencana "terverifikasi").
export async function perbaruiRentang(env, kini = Date.now()) {
  const hasil = {};
  await Promise.all(Object.entries(SUMBER_IP).map(async ([op, u]) => {
    try {
      const r = await fetch(u, { headers: { "user-agent": "PlatformMETI-statistik/1.0" } });
      if (!r.ok) throw new Error(r.status);
      const c = ambilCidr(await r.text());
      if (!c.length) throw new Error("tanpa CIDR");
      await hak.lalinSimpanRentang(env, op, c, kini);
      hasil[op] = c.length;
    } catch (e) { hasil[op] = "gagal: " + e.message; }
  }));
  return hasil;
}
