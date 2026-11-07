#!/usr/bin/env node
// Mesin berita EBET: GDELT DOC 2.0 (utama) + RSS langsung media -> data-panen/berita/berita.jsonl. Node stdlib saja.
//   node scripts/panen/berita.mjs          panen sungguhan (--sumber=gdelt,rss bawaan; google hanya bila diminta dan robots mengizinkan)
//   node scripts/panen/berita.mjs --uji    baca tests/fixture/berita/*.xml, tanpa jaringan, tanpa menulis
// Disimpan: judul + tautan + media + tanggal SAJA, tidak pernah isi artikel (hak cipta).
// entitas_disebut = KANDIDAT rujukan orang (nama persis sama dengan orang.jsonl), bukan fakta; kurator yang memutuskan.
// Port dari poskokarhutla scripts/umum/berita.py; geocoder, topik, sentimen, cerita sengaja tidak dibawa.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AKAR = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const JEDA_MS = 2100;
const EDISI = { id: { hl: 'id', gl: 'ID', ceid: 'ID:id' }, en: { hl: 'en-US', gl: 'US', ceid: 'US:en' } };

// Aturan kata kunci K16 sumbu 1 (judul dinormalisasi: huruf kecil, tanpa tanda baca). Satu artikel boleh banyak kode.
export const ATURAN = {
  surya: /\b(plts|surya|solar|photovoltaic|fotovoltaik|pv)\b/,
  bayu: /\b(pltb|bayu|angin|wind|offshore wind)\b/,
  hidro: /\b(plta|pltm|pltmh|hidro|hydro|hydropower|tenaga air|mikrohidro)\b/,
  'panas-bumi': /\b(panas bumi|geothermal|pltp)\b/,
  bioenergi: /\b(biodiesel|bioetanol|bioethanol|bioavtur|saf|biogas|biometana|biofuel|b40|b50|bahan bakar nabati|sustainable aviation fuel)\b/,
  'biomassa-sampah': /\b(biomassa|biomass|co firing|cofiring|pltsa|waste to energy|sampah jadi listrik|psel)\b/,
  nuklir: /\b(nuklir|nuclear|pltn|smr|thorium|bapeten)\b/,
  hidrogen: /\b(hidrogen|hydrogen|amonia hijau|green ammonia)\b/,
  laut: /\b(arus laut|gelombang laut|otec|energi laut|ocean energy|tidal|wave energy)\b/,
  penyimpanan: /\b(bess|baterai|battery|pumped storage|penyimpanan energi|energy storage)\b/,
  jaringan: /\b(transmisi|smart grid|mikrogrid|microgrid|jaringan listrik|listrik desa|supergrid|grid)\b/,
  efisiensi: /\b(efisiensi energi|konservasi energi|energy efficiency|data center|hemat energi|green building)\b/,
  elektrifikasi: /\b(kendaraan listrik|mobil listrik|motor listrik|electric vehicle|ev|spklu|kompor induksi|kompor listrik)\b/,
  karbon: /\b(pasar karbon|bursa karbon|carbon|karbon|ccs|ccus|ndc|mrv|net zero|emisi)\b/,
  pembiayaan: /\b(pembiayaan|green finance|blended finance|obligasi hijau|green bond|investasi hijau|pendanaan)\b/,
  kebijakan: /\b(regulasi|peraturan|permen|perpres|ruu|undang undang|perizinan|ruptl|ruen|rukn|kebijakan energi|uu ebt)\b/,
  industri: /\b(tkdn|manufaktur|rantai pasok|supply chain|hilirisasi|smelter|industri hijau)\b/,
  'transisi-adil': /\b(jetp|transisi energi|transisi berkeadilan|just energy transition|pensiun dini|phase out|energy transition)\b/,
  'riset-data': /\b(pemodelan|model energi|statistik energi|outlook energi|energy outlook|data energi|riset energi)\b/,
};

// Kueri: daftar istilah (ATAU) per kode, ID dan EN, + METI, EBTKE, lembaga kunci. Istilah >= 3 huruf (syarat GDELT).
// Dirakit jadi sintaks GDELT (utama) atau Google News (cadangan, hanya --sumber=google).
const T = (id, en) => ({ id, en });
export const KUERI = {
  surya: T(['PLTS', 'energi surya', 'tenaga surya'], ['solar power', 'solar energy', 'solar PV']),
  bayu: T(['PLTB', 'tenaga angin', 'energi bayu'], ['wind power', 'wind farm']),
  hidro: T(['PLTA', 'PLTMH', 'tenaga air'], ['hydropower', 'micro hydro']),
  'panas-bumi': T(['panas bumi', 'PLTP'], ['geothermal']),
  bioenergi: T(['biodiesel', 'bioetanol', 'bioavtur', 'biogas'], ['biofuel', 'biodiesel', 'sustainable aviation fuel']),
  'biomassa-sampah': T(['biomassa', 'co-firing', 'PLTSa', 'PSEL'], ['biomass', 'waste to energy']),
  nuklir: T(['PLTN', 'energi nuklir', 'reaktor modular'], ['nuclear power', 'small modular reactor']),
  hidrogen: T(['hidrogen hijau', 'amonia hijau', 'hidrogen'], ['green hydrogen', 'green ammonia']),
  laut: T(['energi laut', 'arus laut', 'gelombang laut'], ['ocean energy', 'tidal energy', 'wave energy']),
  penyimpanan: T(['BESS', 'baterai penyimpanan', 'penyimpanan energi', 'pumped storage'], ['battery storage', 'energy storage', 'pumped storage']),
  jaringan: T(['smart grid', 'mikrogrid', 'jaringan transmisi', 'listrik desa'], ['smart grid', 'microgrid', 'transmission grid']),
  efisiensi: T(['efisiensi energi', 'konservasi energi'], ['energy efficiency']),
  elektrifikasi: T(['kendaraan listrik', 'SPKLU', 'kompor induksi'], ['electric vehicle', 'EV charging']),
  karbon: T(['pasar karbon', 'bursa karbon', 'CCUS', 'penangkapan karbon'], ['carbon market', 'carbon capture', 'carbon credit']),
  pembiayaan: T(['pembiayaan energi terbarukan', 'green finance', 'pendanaan energi bersih'], ['renewable energy financing', 'green finance', 'blended finance']),
  kebijakan: T(['RUPTL', 'regulasi energi terbarukan', 'RUU EBET', 'perpres energi'], ['renewable energy policy', 'renewable energy regulation']),
  industri: T(['TKDN energi', 'industri hijau', 'rantai pasok baterai'], ['clean energy manufacturing', 'energy supply chain']),
  'transisi-adil': T(['JETP', 'transisi energi', 'pensiun dini PLTU'], ['JETP', 'energy transition', 'coal phase out']),
  'riset-data': T(['outlook energi', 'statistik energi', 'pemodelan energi'], ['energy outlook', 'energy statistics']),
};
export const KUERI_LEMBAGA = [
  ['METI', T(['Masyarakat Energi Terbarukan Indonesia', 'METI energi terbarukan'], ['Indonesia Renewable Energy Society'])],
  ['EBTKE', T(['EBTKE', 'Ditjen EBTKE', 'energi baru terbarukan'], ['EBTKE', 'new and renewable energy directorate'])],
  ['ESDM', T(['Kementerian ESDM energi terbarukan'], ['Ministry of Energy and Mineral Resources renewable'])],
  ['DEN', T(['Dewan Energi Nasional'], ['National Energy Council'])],
  ['PLN', T(['PLN energi baru terbarukan', 'PLN transisi energi'], ['PLN renewable energy'])],
  ['IESR', T(['IESR', 'Institute for Essential Services Reform'], ['IESR energy transition'])],
];
const frasa = (t) => (/\s/.test(t) ? `"${t}"` : t);
export const kueriGdelt = (terms, ed) => (terms.length > 1 ? `(${terms.map(frasa).join(" OR ")})` : frasa(terms[0])) + (ed === 'en' ? ' Indonesia sourcelang:english' : ' sourcelang:indonesian');
export const kueriGoogle = (terms) => terms.map(frasa).join(' OR ');

// RSS langsung media (bukan feed pencarian: disaring dengan aturan K16). Yang tidak ada di sini gagal diperiksa 7 Nov 2026:
// Kompas, Kontan, The Jakarta Post, ESDM (tidak ada feed publik, 404 atau HTML); Bisnis (robots melarang /rss/ dan /feed/, 403).
export const FEEDS = [
  ['Antara', 'https://www.antaranews.com/rss/ekonomi.xml', 'id'], ['Antara', 'https://www.antaranews.com/rss/ekonomi-bisnis.xml', 'id'],
  ['CNBC Indonesia', 'https://www.cnbcindonesia.com/rss', 'id'], ['Katadata', 'https://katadata.co.id/rss', 'id'],
  ['Mongabay', 'https://www.mongabay.co.id/feed/', 'id'], ['Mongabay', 'https://www.mongabay.co.id/category/energi/feed/', 'id'],
  ['Dunia Energi', 'https://www.dunia-energi.com/feed/', 'id'], ['Ruang Energi', 'https://ruangenergi.com/feed/', 'id'],
  ['Tempo', 'https://rss.tempo.co/bisnis', 'id'], ['Detik Finance', 'https://finance.detik.com/rss', 'id'],
  ['Republika', 'https://www.republika.co.id/rss/ekonomi', 'id'], ['CNN Indonesia', 'https://www.cnnindonesia.com/ekonomi/rss', 'id'],
];

// ---------------------------------------------------------------- teks
export const norm = (s) => String(s ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^0-9a-z]+/g, ' ').trim();
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const lepas = (s) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : (ENT[e.toLowerCase()] ?? m))
  .replace(/\s+/g, ' ').trim();
const etiket = (blok, nama) => { const m = blok.match(new RegExp(`<${nama}(?:\\s[^>]*)?>([\\s\\S]*?)</${nama}>`, 'i')); return m ? lepas(m[1]) : ''; };

// Parser RSS tulisan tangan: item -> {judul, url, media, terbit}. Isi <description> dibuang sengaja.
// Feed Google News menaruh " - Media" di judul; feed langsung memakai { media } tetap dan judulnya tidak disentuh.
export function urai(xml, { media: tetap } = {}) {
  const out = [];
  for (const m of String(xml).matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const b = m[1];
    let judul = etiket(b, 'title'); const url = etiket(b, 'link'); let media = tetap || etiket(b, 'source');
    if (!judul || !url) continue;
    if (tetap) { /* judul apa adanya */ }
    else if (media && judul.endsWith(' - ' + media)) judul = judul.slice(0, -media.length - 3).trim();
    else if (!media && judul.includes(' - ')) { const i = judul.lastIndexOf(' - '); if (judul.length - i - 3 <= 40) { media = judul.slice(i + 3).trim(); judul = judul.slice(0, i).trim(); } }
    const t = new Date(etiket(b, 'pubDate') || etiket(b, 'dc:date'));
    if (!judul || Number.isNaN(t.getTime())) continue;
    out.push({ judul, url, media, terbit: t.toISOString() });
  }
  return out;
}

// GDELT DOC 2.0 ArtList: {articles:[{url,title,seendate:"20261106T030000Z",domain,language}]} -> bentuk yang sama dengan urai().
const BAHASA_GDELT = { indonesian: 'id', english: 'en' };
export function uraiGdelt(teks) {
  let j; try { j = JSON.parse(teks); } catch { throw new Error('GDELT bukan JSON: ' + String(teks).slice(0, 80)); }
  const out = [];
  for (const a of j.articles || []) {
    const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(a.seendate || '');
    const bahasa = BAHASA_GDELT[String(a.language || '').toLowerCase()];
    const judul = lepas(String(a.title || '')), url = String(a.url || '');
    if (!m || !bahasa || !judul || !/^https?:\/\//.test(url)) continue;
    out.push({ judul, url, media: String(a.domain || '').replace(/^www\./, ''), terbit: `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}.000Z`, bahasa });
  }
  return out;
}

// ---------------------------------------------------------------- olah
export function kepakaranDari(judul) {
  const n = norm(judul);
  return Object.keys(ATURAN).filter((k) => ATURAN[k].test(n));
}

// Kandidat orang: nama persis (batas kata, tanpa diakritik/kapital), minimal dua kata (nama satu kata terlalu ambigu).
export function bangunPencocok(orang) {
  const per = orang.map((o) => ({ ...o, n: norm(o.nama) })).filter((o) => o.n.split(' ').length >= 2);
  return (judul) => {
    const n = ` ${norm(judul)} `;
    return per.filter((o) => n.includes(` ${o.n} `)).map((o) => ({ orang_id: o.orang_id, nama: o.nama, jenis: 'kandidat-rujukan' }));
  };
}

// URL kanonik: tanpa skema, www, query, fragmen, garis miring akhir.
export const urlKanon = (u) => String(u).toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/[?#].*$/, '').replace(/\/+$/, '');

// Dedup lintas sumber: satu artikel bila judul ternormalisasi SAMA atau URL kanonik SAMA; kepakaran dan kueri digabung, yang pertama menang.
export function dedup(artikel) {
  const perJudul = new Map(), perUrl = new Map(), hasil = [];
  for (const a of artikel) {
    const k = norm(a.judul), u = urlKanon(a.url);
    const ada = perJudul.get(k) || perUrl.get(u);
    if (!ada) {
      const baru = { id: createHash('sha1').update(k).digest('hex').slice(0, 10), ...a, kepakaran: [...a.kepakaran], kueri: [a.kueri] };
      perJudul.set(k, baru); perUrl.set(u, baru); hasil.push(baru); continue;
    }
    perJudul.set(k, ada); perUrl.set(u, ada);
    ada.kepakaran = [...new Set([...ada.kepakaran, ...a.kepakaran])];
    if (!ada.kueri.includes(a.kueri)) ada.kueri.push(a.kueri);
  }
  return hasil;
}

export function jadikanBaris(mentah, { bahasa, kueri, tanggal_ambil, sumber_panen, cocokOrang = () => [] }) {
  return mentah.map((a) => ({ judul: a.judul, url: a.url, media: a.media, terbit: a.terbit, bahasa: a.bahasa || bahasa, kepakaran: kepakaranDari(a.judul),
    entitas_disebut: cocokOrang(a.judul), kueri, sumber_panen, tanggal_ambil }));
}

// ---------------------------------------------------------------- robots + jaringan
// Longest-match, grup "*" saja (cukup untuk Google News). Pola mendukung $ di akhir.
export function robotsBolehkan(txt, jalur) {
  const aturan = []; let bintang = false, barisUA = false;
  for (const g of String(txt).split(/\r?\n/)) {
    const l = g.replace(/#.*/, '').trim(); const i = l.indexOf(':'); if (i < 0) continue;
    const k = l.slice(0, i).trim().toLowerCase(), v = l.slice(i + 1).trim();
    if (k === 'user-agent') { bintang = (barisUA ? bintang : false) || v === '*'; barisUA = true; }
    else { barisUA = false; if (bintang && (k === 'allow' || k === 'disallow') && v) aturan.push([k, v]); }
  }
  let terbaik = ['allow', ''];
  for (const [k, p] of aturan) {
    const re = new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
    if (re.test(jalur) && p.length >= terbaik[1].length) terbaik = [k, p];
  }
  return terbaik[0] === 'allow';
}

const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const terakhir = new Map();
// Jeda per host: GDELT minta <= 1 permintaan per 5 detik, lainnya >= 2 detik. 403 = berhenti total; 429 = tunggu lalu coba lagi.
async function ambil(url, { coba = 2 } = {}) {
  const host = new URL(url).host, jeda = host.endsWith('gdeltproject.org') ? 5500 : JEDA_MS;
  for (let i = 0; i < coba; i++) {
    const tunggu = (terakhir.get(host) || 0) + jeda - Date.now(); if (tunggu > 0) await tidur(tunggu);
    terakhir.set(host, Date.now());
    let r;
    try { r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(60000) }); }
    catch (e) { if (i === coba - 1) throw new Error(`jaringan ${host}: ${e.cause?.code || e.message}`); await tidur(15000); continue; }
    if (r.status === 403) throw new Error('403: ' + host);
    if (r.status === 429) { if (i === coba - 1) throw new Error('429: ' + host); await tidur((+r.headers.get('retry-after') || 60) * 1000); continue; }
    if (r.ok) {
      const buf = Buffer.from(await r.arrayBuffer());
      const cs = /charset=([\w-]+)/i.exec(r.headers.get('content-type') || '')?.[1] || /<\?xml[^>]*encoding=["']([\w-]+)/i.exec(buf.subarray(0, 200).toString('latin1'))?.[1] || 'utf-8';
      try { return new TextDecoder(cs).decode(buf); } catch { return buf.toString('utf-8'); }
    }
    if (i === coba - 1) throw new Error(`${r.status} ${host}`);
    await tidur(5000);
  }
}
export const urlGdelt = (q) => 'https://api.gdeltproject.org/api/v2/doc/doc?' + new URLSearchParams({ query: q, mode: 'ArtList', format: 'json', maxrecords: '250', timespan: '3m' });
export const urlRss = (q, ed) => 'https://news.google.com/rss/search?' + new URLSearchParams({ q: `${q} when:90d`, ...EDISI[ed] });

export function muatOrang(jalur = join(AKAR, 'data-panen/orang/orang.jsonl')) {
  if (!existsSync(jalur)) return [];
  return readFileSync(jalur, 'utf-8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((o) => o.nama && o.orang_id);
}
export const daftarKueri = () => [...Object.entries(KUERI), ...KUERI_LEMBAGA].flatMap(([k, v]) => [[k, 'id', v.id], [k, 'en', v.en]]);

// ---------------------------------------------------------------- CLI
// Bawaan: GDELT lalu RSS langsung. Google News hanya lewat --sumber=google dan tetap ditolak selama robots.txt-nya melarang.
async function main() {
  const uji = process.argv.includes('--uji');
  const pilih = (process.argv.find((a) => a.startsWith('--sumber=')) || '--sumber=gdelt,rss').slice(9).split(',');
  const hari = new Date().toISOString().slice(0, 10);
  const cocokOrang = bangunPencocok(muatOrang());
  const baris = [], gagal = [];
  const catat = (xs, o) => baris.push(...jadikanBaris(xs, { ...o, tanggal_ambil: hari, cocokOrang }));
  if (uji) {
    const dir = join(AKAR, 'tests/fixture/berita');
    for (const f of readdirSync(dir).sort()) {
      const t = readFileSync(join(dir, f), 'utf-8');
      if (f.startsWith('gdelt_')) catat(uraiGdelt(t), { kueri: f, sumber_panen: 'gdelt' });
      else if (f.startsWith('rss_')) { const md = f.slice(4, -4).replace(/-/g, ' '); catat(urai(t, { media: md }).filter((a) => kepakaranDari(a.judul).length), { bahasa: 'id', kueri: f, sumber_panen: 'rss:' + md }); }
      else if (f.startsWith('feed_')) catat(urai(t), { bahasa: f.includes('_en') ? 'en' : 'id', kueri: f, sumber_panen: 'google' });
    }
  } else {
    if (pilih.includes('google')) {
      const robots = await ambil('https://news.google.com/robots.txt').catch(() => '');
      const contoh = new URL(urlRss('x', 'id'));
      if (!robotsBolehkan(robots, contoh.pathname + contoh.search)) { gagal.push('google: robots.txt melarang /rss/search'); console.error(gagal.at(-1)); }
      else for (const [kode, ed, terms] of daftarKueri()) {
        try { catat(urai(await ambil(urlRss(kueriGoogle(terms), ed))), { bahasa: ed, kueri: `${kode}:${ed}`, sumber_panen: 'google' }); }
        catch (e) { gagal.push(`google ${kode}:${ed} ${e.message}`); if (/^403/.test(e.message)) break; }
      }
    }
    if (pilih.includes('gdelt')) {
      let beruntun = 0;
      for (const [kode, ed, terms] of daftarKueri()) {
        if (beruntun >= 6) { gagal.push('gdelt: dihentikan setelah 6 kegagalan beruntun'); break; }
        try { catat(uraiGdelt(await ambil(urlGdelt(kueriGdelt(terms, ed)), { coba: 3 })), { kueri: `${kode}:${ed}`, sumber_panen: 'gdelt' }); beruntun = 0; }
        catch (e) { beruntun++; gagal.push(`gdelt ${kode}:${ed} ${e.message}`); }
      }
    }
    if (pilih.includes('rss')) {
      const robots = new Map();
      for (const [media, url, bahasa] of FEEDS) {
        try {
          const u = new URL(url);
          if (!robots.has(u.host)) robots.set(u.host, await ambil(u.origin + '/robots.txt').catch(() => ''));
          if (!robotsBolehkan(robots.get(u.host), u.pathname + u.search)) { gagal.push(`${url} robots melarang`); continue; }
          const xs = urai(await ambil(url), { media }).filter((a) => kepakaranDari(a.judul).length);   // bukan feed pencarian: saring K16
          catat(xs, { bahasa, kueri: 'feed:' + new URL(url).pathname, sumber_panen: 'rss:' + media });
        } catch (e) { gagal.push(`${url} ${e.message}`); }
      }
    }
    if (!baris.length) { console.error('nol artikel: berkas lama tidak ditimpa'); process.exit(1); }
  }
  const hasil = dedup(baris).sort((a, b) => b.terbit.localeCompare(a.terbit));
  const per = {}; for (const a of hasil) for (const k of a.kepakaran) per[k] = (per[k] || 0) + 1;
  const media = {}; for (const a of hasil) media[a.media || '?'] = (media[a.media || '?'] || 0) + 1;
  const sumber = {}; for (const a of hasil) sumber[a.sumber_panen.split(':')[0]] = (sumber[a.sumber_panen.split(':')[0]] || 0) + 1;
  const ringkas = { artikel: hasil.length, mentah: baris.length, per_sumber: sumber, tanpa_kode: hasil.filter((a) => !a.kepakaran.length).length, per_kepakaran: per,
    media_teratas: Object.entries(media).sort((a, b) => b[1] - a[1]).slice(0, 5), dengan_entitas: hasil.filter((a) => a.entitas_disebut.length).length, gagal };
  if (!uji) {
    const jalur = join(AKAR, 'data-panen/berita/berita.jsonl'); mkdirSync(dirname(jalur), { recursive: true });
    writeFileSync(jalur + '.tmp', hasil.map((a) => JSON.stringify(a)).join('\n') + '\n', 'utf-8'); renameSync(jalur + '.tmp', jalur);
  }
  console.log(JSON.stringify(ringkas));
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main().catch((e) => { console.error(e.message); process.exit(1); });
