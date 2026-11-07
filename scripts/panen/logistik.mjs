#!/usr/bin/env node
// public/data/global/logistik.json. Tanpa jaringan: node scripts/panen/logistik.mjs (angka ditranskripsi di logistik_lib.mjs).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { bangun } from './logistik_lib.mjs';
const d = bangun();
const out = fileURLToPath(new URL('../../public/data/global/logistik.json', import.meta.url));
fs.mkdirSync(fileURLToPath(new URL('../../public/data/global/', import.meta.url)), { recursive: true });
fs.writeFileSync(out, JSON.stringify(d) + '\n');
console.log('tahap', d.tahap.length, 'rute', d.rute.length, 'epc', d.pemain.epc.length);
