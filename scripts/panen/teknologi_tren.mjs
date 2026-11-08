#!/usr/bin/env node
// public/data/global/teknologi_tren.json dan bahan_baku.json. Tanpa jaringan: node scripts/panen/teknologi_tren.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { bangunTren, bangunBahan } from './teknologi_tren_lib.mjs';
const tulis = (f, d) => fs.writeFileSync(fileURLToPath(new URL('../../public/data/global/' + f, import.meta.url)), JSON.stringify(d) + '\n');
tulis('teknologi_tren.json', bangunTren()); tulis('bahan_baku.json', bangunBahan());
console.log('ok');
