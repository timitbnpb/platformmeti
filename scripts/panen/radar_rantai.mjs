#!/usr/bin/env node
// public/data/global/radar_rantai.json. Tanpa jaringan: node scripts/panen/radar_rantai.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { bangun } from './radar_rantai_lib.mjs';
const p = (f) => fileURLToPath(new URL('../../public/data/' + f, import.meta.url));
const j = (f) => JSON.parse(fs.readFileSync(p(f), 'utf8'));
const rows = [...j('organisasi.json').baris, ...j('global/pelaku_global.json').baris];
const d = bangun({ orgIds: new Set(rows.map((o) => o.id)), namaOrg: Object.fromEntries(rows.map((o) => [o.id, o.nama])), tanggal: '2026-11-08' });
fs.writeFileSync(p('global/radar_rantai.json'), JSON.stringify(d) + '\n');
console.log('peristiwa', d.jumlah, 'ditolak', JSON.stringify(d.ditolak));
