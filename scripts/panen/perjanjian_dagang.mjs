#!/usr/bin/env node
// public/data/global/perjanjian_dagang.json. Tanpa jaringan: node scripts/panen/perjanjian_dagang.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { bangun } from './perjanjian_dagang_lib.mjs';
const p = (f) => fileURLToPath(new URL('../../public/data/global/' + f, import.meta.url));
const d = bangun({ benchmark: JSON.parse(fs.readFileSync(p('benchmark_harga.json'), 'utf8')), tanggal: '2026-11-08' });
fs.writeFileSync(p('perjanjian_dagang.json'), JSON.stringify(d) + '\n');
console.log('baris', d.baris.length, 'termurah', d.termurah.length);
