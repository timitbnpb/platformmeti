#!/usr/bin/env node
// public/data/global/purnajual.json. Tanpa jaringan: node scripts/panen/purnajual.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { bangun } from './purnajual_lib.mjs';
const d = bangun();
fs.writeFileSync(fileURLToPath(new URL('../../public/data/global/purnajual.json', import.meta.url)), JSON.stringify(d) + '\n');
console.log('merek', d.meta.jumlah_merek, 'layanan', d.meta.jumlah_layanan);
