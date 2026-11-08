#!/usr/bin/env node
// public/data/biaya_bangun.json. Tanpa jaringan: node scripts/panen/biaya_bangun.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { bangun } from './biaya_bangun_lib.mjs';
const d = bangun();
fs.writeFileSync(fileURLToPath(new URL('../../public/data/biaya_bangun.json', import.meta.url)), JSON.stringify(d) + '\n');
console.log('skala', d.skala.length, 'sumber', d.sumber.length);
