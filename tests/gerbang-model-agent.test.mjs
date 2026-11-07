// Gerbang model sub-agent (AGEN.md, 7 Nov 2026).
//
// Sub-agent tanpa model tertulis IKUT model sesi induk (Opus). Dua pagar:
//   1. env CLAUDE_CODE_SUBAGENT_MODEL di .claude/settings.json menurunkan agent
//      bawaan (general-purpose, Explore, Plan) ke Sonnet;
//   2. tiap agent khusus di .claude/agents/ menulis `model:` sendiri
//      (pengerja sonnet, pemeriksa pola haiku, pemeriksa nalar sonnet).
// Roster juga dicek langsung supaya entri tanpa model gagal sebelum digenerate.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const MODEL_SAH = ['sonnet', 'haiku']

test('settings repo menurunkan sub-agent bawaan dari Opus', () => {
  const s = JSON.parse(readFileSync(join(ROOT, '.claude/settings.json'), 'utf8'))
  const m = s.env?.CLAUDE_CODE_SUBAGENT_MODEL ?? ''
  assert.notEqual(m, '', 'env.CLAUDE_CODE_SUBAGENT_MODEL hilang')
  assert.ok(!m.toLowerCase().includes('opus'), 'env.CLAUDE_CODE_SUBAGENT_MODEL tidak boleh opus')
})

test('tiap entri roster menulis model sonnet atau haiku', () => {
  const { agents } = JSON.parse(readFileSync(join(ROOT, 'scripts/agents/roster.json'), 'utf8'))
  assert.ok(agents.length >= 10, 'roster terbaca kosong: gerbang ini jadi hijau kosong')
  const salah = agents.filter((a) => !MODEL_SAH.includes(a.model)).map((a) => `${a.nama}: ${a.model}`)
  assert.deepEqual(salah, [], 'agent tanpa model atau memakai model di luar sonnet|haiku')
})

test('tiap agent khusus menulis model di frontmatter', () => {
  const dir = join(ROOT, '.claude/agents')
  assert.ok(existsSync(dir), '.claude/agents/ tidak ada: jalankan npm run agents:build')
  const berkas = readdirSync(dir).filter((f) => f.endsWith('.md'))
  assert.ok(berkas.length >= 10, 'agent terbaca terlalu sedikit: gerbang ini jadi hijau kosong')
  const tanpa = berkas.filter(
    (f) => !/^---[\s\S]*?\nmodel:\s*(sonnet|haiku)\s*\n[\s\S]*?---/.test(readFileSync(join(dir, f), 'utf8')),
  )
  assert.deepEqual(tanpa, [], 'agent tanpa baris model: sonnet|haiku di frontmatter')
})
