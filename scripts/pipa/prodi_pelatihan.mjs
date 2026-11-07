// LSP (BNSP) berskema energi terbarukan/konservasi energi: bnsp.go.id/lsp (publik, robots hanya melarang /amp), detail per LSP.
// Pakai: node scripts/pipa/prodi_pelatihan.mjs [--tanggal=...]. HTML mentah di raw/bnsp/ (cache).
// Prodi PDDikti dan PPSDM KEBTKE TIDAK terpanen: lihat meta.celah.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { AKAR, TANGGAL, UA, tidur, tulis } from './_panen_umum.mjs';

const KUERI = ['energi terbarukan', 'ebtke', 'surya', 'listrik', 'ketenagalistrikan', 'panas bumi', 'biogas', 'bioenergi', 'konservasi energi', 'energi'];
// skema yang dianggap terkait EBT/efisiensi energi (nama skema/unit kompetensi)
export const POLA_EBT = /surya|PLTS|fotovoltaik|photovoltaic|angin|bayu|PLTB|panas ?bumi|geotermal|biogas|biomassa|bioenergi|biodiesel|mikro ?hidro|PLTMH|PLTA|tenaga air|hidroelektrik|terbarukan|EBT|energi baru|konservasi energi|manajer energi|auditor energi|efisiensi energi|hidrogen/i;
const sha = s => crypto.createHash('sha1').update(s).digest('hex');
const ent = s => s.replace(/&amp;/g, '&').replace(/&#0?39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#160;/g, ' ');

async function ambil(url) {
  const f = path.join(AKAR, 'raw/bnsp', sha(url) + '.html');
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf-8');
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) });
  if (r.status === 403) throw new Error('403 berhenti total: ' + url);
  if (r.status === 404) { await tidur(2200); return null; } // tautan rusak di situs BNSP sendiri
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  const h = await r.text(); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, h, 'utf-8'); await tidur(2200); return h;
}
export const slugs = h => [...new Set([...h.matchAll(/href="https:\/\/bnsp\.go\.id\/lsp\/([^"]+)"/g)].map(m => ent(m[1])))];
export function parseLsp(h, slug) {
  const t = ent(h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, '\n')).split('\n').map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const nilai = k => { const i = t.indexOf(k); return i >= 0 && t[i + 1] === ':' ? (t[i + 2] && t[i + 2] !== ':' ? t[i + 2] : null) : null; };
  const nama = (h.match(/<title>\s*LSP - ([\s\S]*?)<\/title>/) || [])[1]?.trim() || null;
  const iA = t.indexOf('Alamat');
  const web = nilai('Website');
  return {
    slug, nama: nama && ent(nama), no_lisensi: nilai('No Lisensi'), jenis: nilai('Jenis'), status_lisensi: nilai('Status Lisensi'), berlaku_sampai: nilai('Masa Berlaku Sertifikat'),
    alamat: iA >= 0 ? t[iA + 1] : null, website: web && !/\[email/.test(web) ? web : null,
    skema: [...h.matchAll(/fetchDataUnitSkema\('((?:[^'\\]|\\.)*)'/g)].map(m => ent(m[1].replace(/\\'/g, "'")).trim()),
  };
}

if (process.argv[1] === new URL(import.meta.url).pathname) (async () => {
  const semua = new Set();
  for (const q of KUERI) for (const s of slugs(await ambil('https://bnsp.go.id/lsp?sSearch=' + encodeURIComponent(q)))) semua.add(s);
  const baris = []; const rusak = [];
  for (const s of [...semua].sort()) {
    const h = await ambil('https://bnsp.go.id/lsp/' + encodeURI(s).replace(/&/g, '%26'));
    if (!h) { rusak.push(s); continue; }
    const l = parseLsp(h, s);
    const ebt = [...new Set(l.skema.filter(x => POLA_EBT.test(x)))].sort();
    if (!ebt.length) continue;
    baris.push({ ...l, skema_ebt: ebt, jumlah_skema_total: new Set(l.skema).size, skema: undefined, sumber_url: 'https://bnsp.go.id/lsp/' + s, tanggal_periksa: TANGGAL, tingkat_bukti: 'resmi' });
  }
  tulis(path.join(AKAR, 'public/data/prodi_pelatihan.json'), {
    jenis: 'prodi_pelatihan', tanggal_ambil: TANGGAL, tingkat_bukti: 'resmi', sumber: 'BNSP, bnsp.go.id/lsp (daftar LSP berlisensi)', lisensi: 'Direktori publik BNSP; hanya nama, nomor lisensi, status, skema (badan, bukan perseorangan); atribusi BNSP', url: 'https://bnsp.go.id/lsp',
    kueri: KUERI, jumlah_lsp_diperiksa: semua.size, jumlah_lsp_ebt: baris.length, tautan_rusak_bnsp: rusak, lsp: baris, prodi: [], lembaga_pelatihan: [],
    meta: {
      catatan: 'LSP dipilih bila punya >= 1 skema/unit yang namanya cocok pola EBT/konservasi energi (POLA_EBT); skema_ebt = nama skema yang cocok, bukan semua skema LSP. Surel/telepon sengaja tidak diambil.',
      celah: [
        'prodi = [] : PDDikti tidak terpanen. Web pddikti.kemdiktisaintek.go.id adalah SPA yang memanggil api-pddikti (401 Unauthorized tanpa kredensial) dan robots melarang /search/; bukan jalur sopan.',
        'lembaga_pelatihan = [] : PPSDM KEBTKE/ESDM (ppsdm.esdm.go.id, ppsdmebtke.esdm.go.id, pusdiklat.esdm.go.id) tak dapat dijangkau (koneksi gagal) pada tanggal ambil.',
        'Hanya hasil halaman pertama (21 LSP) per kueri sSearch; kueri lain dapat menemukan LSP tambahan. Filter pencarian BNSP mencocokkan teks bebas, jadi sebagian LSP hasil pencarian tidak relevan dan dibuang oleh pola.',
        'Nomor skema SKKNI dan harga uji tidak diambil.',
      ],
    },
  });
  console.log('prodi_pelatihan:', baris.length, 'LSP EBT dari', semua.size);
})().catch(e => { console.error(e.message); process.exit(1); });
