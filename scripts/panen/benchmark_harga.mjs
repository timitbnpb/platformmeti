#!/usr/bin/env node
// public/data/global/benchmark_harga.json. Tanpa jaringan: node scripts/panen/benchmark_harga.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { bangun } from './benchmark_harga_lib.mjs';
const d = bangun();
fs.writeFileSync(fileURLToPath(new URL('../../public/data/global/benchmark_harga.json', import.meta.url)), JSON.stringify(d) + '\n');
console.log('produk', d.produk.length);
