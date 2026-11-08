#!/usr/bin/env node
// public/data/global/produk.json. Tanpa jaringan: node scripts/panen/produk_global.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { bangun } from './produk_global_lib.mjs';
const d = bangun();
fs.writeFileSync(fileURLToPath(new URL('../../public/data/global/produk.json', import.meta.url)), JSON.stringify(d) + '\n');
console.log('produk', d.baris.length);
