#!/usr/bin/env node
// public/data/harga_komponen.json. Tanpa jaringan: node scripts/panen/harga_komponen.mjs (angka ditranskripsi di harga_komponen_lib.mjs).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { bangun } from './harga_komponen_lib.mjs';
const d = bangun();
fs.writeFileSync(fileURLToPath(new URL('../../public/data/harga_komponen.json', import.meta.url)), JSON.stringify(d) + '\n');
console.log('deret', d.deret.length);
