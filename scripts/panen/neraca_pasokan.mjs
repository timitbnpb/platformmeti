#!/usr/bin/env node
// public/data/global/neraca_pasokan.json. Tanpa jaringan: node scripts/panen/neraca_pasokan.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { bangun } from './neraca_pasokan_lib.mjs';
const p = (f) => fileURLToPath(new URL('../../public/data/' + f, import.meta.url));
const j = (f) => JSON.parse(fs.readFileSync(p(f), 'utf8'));
const orgIds = new Set([...j('organisasi.json').baris.map((o) => o.id), ...j('global/pelaku_global.json').baris.map((o) => o.id)]);
const d = bangun({ rantai: j('rantai_pasok.json'), dagang: j('dagang_komponen.json'), orgIds, tanggal: '2026-11-08' });
fs.writeFileSync(p('global/neraca_pasokan.json'), JSON.stringify(d) + '\n');
console.log('komponen', d.baris.length);
