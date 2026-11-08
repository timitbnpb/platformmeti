#!/usr/bin/env node
// public/data/global/esg_rantai.json. Tanpa jaringan: node scripts/panen/esg_rantai.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { bangun } from './esg_rantai_lib.mjs';
const d = bangun();
fs.writeFileSync(fileURLToPath(new URL('../../public/data/global/esg_rantai.json', import.meta.url)), JSON.stringify(d) + '\n');
console.log('uflpa', d.meta.entitas_uflpa, 'sertifikasi', d.meta.sertifikasi);
