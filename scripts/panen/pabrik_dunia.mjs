#!/usr/bin/env node
// public/data/global/pabrik_dunia.json. Tanpa jaringan: node scripts/panen/pabrik_dunia.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { bangun } from './pabrik_dunia_lib.mjs';
const d = bangun();
fs.writeFileSync(fileURLToPath(new URL('../../public/data/global/pabrik_dunia.json', import.meta.url)), JSON.stringify(d) + '\n');
console.log('pabrik', d.baris.length);
