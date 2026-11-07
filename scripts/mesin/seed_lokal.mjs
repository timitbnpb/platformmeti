#!/usr/bin/env node
// Isi D1 LOKAL atau PRATINJAU dengan data contoh fiktif (example.org, akhiran "(contoh)"). K15: satu-satunya jalan data contoh.
// Pakai:  SEED_SANDI=... node scripts/mesin/seed_lokal.mjs [--lokal | --pratinjau] [--db nama] [--sql-saja berkas]
// Menolak target produksi: produksi jaringan-meti, atau remote apa pun yang namanya tak berakhir -pratinjau.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAKIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PROD = 'jaringan-meti';

export function pilihTarget(argv) {
  const a = argv.slice(2);
  const nilai = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
  const remote = a.includes('--pratinjau');
  const db = nilai('--db') ?? (remote ? `${PROD}-pratinjau` : PROD);
  if (remote && !db.endsWith('-pratinjau')) throw new Error(`ditolak: target remote "${db}" bukan pratinjau (harus berakhir -pratinjau); produksi ${PROD} tidak boleh diisi data contoh`);
  if (remote && db === PROD) throw new Error('ditolak: produksi');
  return { db, remote, sqlSaja: nilai('--sql-saja') };
}

const q = (s) => `'${String(s).replaceAll("'", "''")}'`;

// Memakai hashSandi dari src/sandi.js (JM-B02). Cadangan bila berkas belum ada: PBKDF2 inline sebentuk (garam 16 byte hex, hash 32 byte hex, >= 100000 iterasi).
async function hashSandi(sandi) {
  const f = path.join(RAKIT, 'src/sandi.js');
  if (fs.existsSync(f)) {
    const m = await import(pathToFileURL(f).href);
    const h = await m.hashSandi(sandi);
    if (h?.garam && h?.hash && h?.iterasi) return { garam: h.garam, sandi: h.hash, iterasi: h.iterasi };
    throw new Error('src/sandi.js ada tetapi bentuk hashSandi tak dikenal; selaraskan seed_lokal.mjs');
  }
  const garam = crypto.randomBytes(16).toString('hex'), iterasi = 100000;
  const sandiHex = crypto.pbkdf2Sync(sandi, Buffer.from(garam, 'hex'), iterasi, 32, 'sha256').toString('hex');
  return { garam, sandi: sandiHex, iterasi };
}

const SEKTOR = ['surya', 'bayu', 'air', 'panas-bumi', 'bioenergi', 'laut', 'hidrogen', 'penyimpanan', 'jaringan', 'efisiensi', 'kendaraan-listrik', 'sampah-energi'];
const PROV = ['11', '12', '16', '31', '32', '33', '34', '35', '51', '52', '64', '73', '76', '91'];
const KAT = ['swasta', 'bumn', 'perguruan-tinggi', 'asosiasi', 'think-tank', 'keuangan', 'pemda', 'koperasi'];
const RANTAI = ['manufaktur-modul', 'epc', 'pengembang-ipp', 'operator', 'pembiaya', 'konsultan'];

export async function bangunSql({ sandi, kini = new Date().toISOString().slice(0, 10) }) {
  const L = [];
  const h = await hashSandi(sandi);
  L.push(`INSERT OR IGNORE INTO akun (surel,nama,peran,status,garam,sandi,iterasi,bahasa) VALUES ('super.contoh@example.org','Super Lokal (contoh)','super','aktif',${q(h.garam)},${q(h.sandi)},${h.iterasi},'id');`);
  for (let i = 1; i <= 30; i++) {
    const n = String(i).padStart(2, '0'), url = `https://example.org/contoh/${n}`;
    const sek = SEKTOR[(i - 1) % SEKTOR.length], prov = PROV[(i - 1) % PROV.length], kat = KAT[(i - 1) % KAT.length];
    const kunci = `lembaga:contoh-${n}`, slug = `contoh-${n}`;
    L.push(`INSERT OR IGNORE INTO sumber (url,domain,jenis,judul,diperiksa) VALUES (${q(url)},'example.org','data-terbuka',${q(`Dokumen contoh ${n} (contoh)`)},${q(kini)});`);
    const sid = `(SELECT id FROM sumber WHERE url=${q(url)})`;
    L.push(`INSERT OR IGNORE INTO entitas (kunci,slug,jenis,kategori,nama,ringkas,sektor,prov,situs,tampil,di_sensus,sumber_id) VALUES (${q(kunci)},${q(slug)},'lembaga',${q(kat)},${q(`Lembaga Energi Contoh ${n} (contoh)`)},${q(`Entitas fiktif untuk uji lokal, sektor ${sek} (contoh)`)},${q(sek)},${q(prov)},${q(`https://${slug}.example.org`)},1,1,${sid});`);
    const eid = `(SELECT id FROM entitas WHERE kunci=${q(kunci)})`;
    L.push(`INSERT OR IGNORE INTO label (entitas_id,jenis,nilai) SELECT ${eid},'sektor',${q(sek)};`);
    L.push(`INSERT OR IGNORE INTO label (entitas_id,jenis,nilai) SELECT ${eid},'rantai',${q(RANTAI[(i - 1) % RANTAI.length])};`);
    L.push(`INSERT OR IGNORE INTO fakta (entitas_id,kunci,nilai_num,satuan,per_tanggal,tingkat_bukti,sumber_id) VALUES (${eid},'kapasitas_mw',${(i * 7.5).toFixed(1)},'MW',${q(kini)},'terkonfirmasi',${sid});`);
    L.push(`INSERT OR IGNORE INTO fakta (entitas_id,kunci,nilai_teks,per_tanggal,tingkat_bukti,sumber_id) VALUES (${eid},'pimpinan',${q(`Direktur Contoh ${n} (contoh)`)},${q(kini)},'kata-pihak',${sid});`);
    L.push(`INSERT OR IGNORE INTO fakta (entitas_id,kunci,alasan_kosong,per_tanggal,tingkat_bukti,sumber_id) VALUES (${eid},'pendapatan_idr','belum-dicari',${q(kini)},'inferensi',${sid});`);
  }
  // ikatan: rantai pasok dan pendanaan antar lembaga contoh, tiap ikatan bersumber
  for (let i = 1; i < 30; i += 2) {
    const a = String(i).padStart(2, '0'), b = String(i + 1).padStart(2, '0'), jenis = i % 4 === 1 ? 'memasok' : 'mendanai';
    const extra = jenis === 'memasok' ? ",jenis_pasok" : '', ev = jenis === 'memasok' ? ",'komponen'" : '';
    L.push(`INSERT OR IGNORE INTO ikatan (dari,ke,jenis${extra},per_tanggal,tingkat_bukti,sumber_id) VALUES ((SELECT id FROM entitas WHERE kunci='lembaga:contoh-${a}'),(SELECT id FROM entitas WHERE kunci='lembaga:contoh-${b}'),'${jenis}'${ev},${q(kini)},'cuplikan',(SELECT id FROM sumber WHERE url='https://example.org/contoh/${a}'));`);
  }
  return L.join('\n') + '\n';
}

async function utama() {
  const t = pilihTarget(process.argv);
  const sandi = process.env.SEED_SANDI;
  if (!sandi || sandi.length < 12) throw new Error('SEED_SANDI wajib diisi di lingkungan (minimal 12 karakter); tidak ditulis di kode');
  const sql = await bangunSql({ sandi });
  if (t.sqlSaja) { fs.writeFileSync(t.sqlSaja, sql); console.log(`SQL ditulis ke ${t.sqlSaja}`); return; }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-meti-')), f = path.join(tmp, 'seed.sql');
  fs.writeFileSync(f, sql, { mode: 0o600 });
  try {
    const r = spawnSync('npx', ['wrangler', 'd1', 'execute', t.db, t.remote ? '--remote' : '--local', '--file', f], { cwd: RAKIT, stdio: 'inherit' });
    if (r.status !== 0) throw new Error(`wrangler gagal (${r.status})`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  console.log(`Seed contoh diisi ke ${t.db} (${t.remote ? 'pratinjau' : 'lokal'}).`);
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) utama().catch((e) => { console.error(e.message); process.exit(1); });
