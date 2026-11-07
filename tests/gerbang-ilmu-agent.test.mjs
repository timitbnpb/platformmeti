// Gerbang: tiap agent punya ilmu, ingatan kerja, dan wilayah berkas tunggal.
//
// Disalin dari gemah-ripah (tests/unit/gerbang-ilmu-agent.test.ts) lalu diubah
// ke node:test. Aturan tanpa gerbang mekanis dianggap belum jadi, jadi enam hal
// ini dimesinkan: katalog segar, ilmu terisi, protokol ilmu, satu pemilik per
// berkas, jejak melewati yang tak berubah, AGENTS.md memuat aturan orkestrator.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { pemilik, muatRoster } from '../scripts/agents/ilmu.mjs'

const ROOT = join(import.meta.dirname, '..')
const ILMU = join(ROOT, '.claude', 'ilmu-agent')
const roster = JSON.parse(readFileSync(join(ROOT, 'scripts/agents/roster.json'), 'utf8')).agents

const BAGIAN = [
  '## Peta berkas & tabel',
  '## Aturan & invarian',
  '## Ranjau yang pernah meledak',
  '## Gerbang yang menghakimi',
  '## Kasus',
]

// Agent WAJIB menurut KEAMANAN-PRIVASI 10, TIKET JM-A01, dan DESAIN-TEKNIS 2.3.
const WAJIB = [
  'worker', 'layar', 'pipa', 'mekanik', 'gerbang', 'migrasi',
  'guard-api', 'security-reviewer', 'selera-angka', 'inp-reviewer', 'migrasi-idempoten',
  'validasi-model', 'higiene-repo', 'penulis-gerbang',
]

test('agent wajib dari KPV 10 dan TIKET ada di roster', () => {
  const ada = new Set(roster.map((a) => a.nama))
  assert.deepEqual(WAJIB.filter((n) => !ada.has(n)), [])
})

test('definisi agent dan katalog orkestrator segar terhadap roster', () => {
  const r = spawnSync('node', ['scripts/agents/build.mjs', '--cek'], { cwd: ROOT, encoding: 'utf8' })
  assert.equal(r.status, 0, `npm run agents:check merah:\n${r.stderr}\nJalankan npm run agents:build.`)
})

test('tiap agent punya ilmu yang benar-benar terisi', () => {
  const kurang = []
  for (const a of roster) {
    const f = join(ILMU, `${a.nama}.md`)
    if (!existsSync(f)) {
      kurang.push(`${a.nama}: .claude/ilmu-agent/${a.nama}.md tidak ada`)
      continue
    }
    const isi = readFileSync(f, 'utf8')
    const hilang = BAGIAN.filter((b) => !isi.includes(b))
    if (hilang.length) kurang.push(`${a.nama}: bagian hilang ${hilang.join(', ')}`)
    if (isi.includes('(belum diisi)')) kurang.push(`${a.nama}: masih kerangka "(belum diisi)"`)
    if (isi.length < 2000) kurang.push(`${a.nama}: ${isi.length} karakter, di bawah 2000`)
  }
  assert.deepEqual(kurang, [], `${kurang.length} agent belum punya ilmu yang layak (AGENTS.md 1.5)`)
})

test('tiap definisi agent memuat protokol ilmu dan jejak', () => {
  const dir = join(ROOT, '.claude', 'agents')
  const tanpa = readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => {
      const isi = readFileSync(join(dir, f), 'utf8')
      return !isi.includes(`node scripts/agents/ilmu.mjs baca ${f.slice(0, -3)}`) || !isi.includes('ilmu.mjs catat')
    })
  assert.deepEqual(tanpa, [], 'agent tanpa protokol ilmu (baca sebelum kerja, catat sesudahnya)')
})

test('larangan semua agent ada di tiap definisi', () => {
  const dir = join(ROOT, '.claude', 'agents')
  const tanpa = readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => {
      const isi = readFileSync(join(dir, f), 'utf8')
      return !['Tidak deploy', 'Tidak push', 'migrasi produksi', 'Tidak melonggarkan gerbang'].every((k) => isi.includes(k))
    })
  assert.deepEqual(tanpa, [])
})

test('tiap berkas kode dan konfigurasi punya tepat satu pemilik', () => {
  // Berkas nyata (git, termasuk yang belum dilacak tapi tidak diabaikan) ...
  const nyata = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
    .split('\n')
    .filter((f) => /^(src|public|migrations|tests|scripts|\.github|data)\//.test(f))
    .filter((f) => !f.endsWith('.gitkeep') && !f.startsWith('scripts/panen/panen_1001'))
  // ... ditambah wakil tiap path yang disebut DESAIN-TEKNIS 2.2 supaya gerbang tidak hijau kosong
  // selagi repo masih kerangka.
  const wakil = [
    'src/worker.js', 'src/hak.js', 'src/sesi.js', 'src/potret.js', 'src/direktori.js',
    'public/index.html', 'public/direktori.js', 'public/inti/tema.css', 'public/i18n/id.json', 'public/_headers',
    'migrations/0001_akun.sql', 'migrations/0006_laju.sql',
    'scripts/panen/openalex.py', 'scripts/pipa/contoh.mjs', 'scripts/direktori/potret.mjs', 'scripts/mesin/buat_super.mjs',
    'scripts/agents/build.mjs', 'scripts/token-ukur.mjs', 'data/cerita/contoh.json',
    'tests/hak.test.mjs', 'tests/cakupan.json', 'tests/e2e/05-dummy-jejak.sql', 'tests/fixtures/matriks.json',
    'package.json', 'wrangler.jsonc', '.dev.vars.example', '.gitignore',
    '.github/workflows/uji.yml', '.github/workflows/panen-bulanan.yml', '.github/workflows/potret.yml',
    '.claude/settings.json',
  ]
  const semua = [...new Set([...nyata, ...wakil])]
  assert.ok(semua.length >= wakil.length)
  const r = muatRoster()
  const tanpa = []
  const ganda = []
  for (const f of semua) {
    const p = pemilik(f, r)
    if (!p.length) tanpa.push(f)
    else if (p.length > 1) ganda.push(`${f} -> ${p.join(' + ')}`)
  }
  assert.deepEqual(tanpa, [], 'berkas tanpa pemilik: tambahkan glob ke "milik" di roster.json')
  assert.deepEqual(ganda, [], 'berkas dengan dua pemilik sama spesifik: pertajam salah satu glob')
})

test('jejak melewati berkas yang tak berubah dan memeriksa ulang yang berubah', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ilmu-'))
  const f = join(dir, 'contoh.mjs')
  writeFileSync(f, 'export const a = 1\n')
  const jalan = (...arg) =>
    execFileSync('node', ['scripts/agents/ilmu.mjs', ...arg], {
      cwd: ROOT,
      encoding: 'utf8',
      env: { ...process.env, ILMU_DIR: dir },
    })
  assert.match(jalan('cek', 'security-reviewer', f), /^BARU /m, 'berkas baru harus tampil BARU')
  jalan('catat', 'security-reviewer', f, 'bersih', 'uji gerbang')
  assert.match(jalan('cek', 'security-reviewer', f), /^LEWATI /m, 'berkas tak berubah harus LEWATI')
  writeFileSync(f, 'export const a = 2\n')
  assert.match(jalan('cek', 'security-reviewer', f), /^ULANG /m, 'berkas berubah tidak boleh dilewati')
  const salah = spawnSync('node', ['scripts/agents/ilmu.mjs', 'catat', 'security-reviewer', f, 'mantap', 'x'], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, ILMU_DIR: dir },
  })
  assert.notEqual(salah.status, 0, 'vonis di luar bersih|temuan|dikerjakan diterima')
})

test('AGENTS.md menulis pengetahuan dan otoritas orkestrator', () => {
  const agents = readFileSync(join(ROOT, 'AGENTS.md'), 'utf8')
  assert.ok(agents.includes('### 1.5 Orkestrator'), 'AGENTS.md 1.5 hilang')
  for (const kata of ['roster.json', 'agents:build', 'ilmu.mjs pemilik', 'KATALOG.md', 'Otoritas membuat agent'])
    assert.ok(agents.includes(kata), `AGENTS.md 1.5 tidak lagi menyebut "${kata}"`)
  assert.ok(existsSync(join(ILMU, 'orkestrator.md')), 'ilmu orkestrator hilang')
})
