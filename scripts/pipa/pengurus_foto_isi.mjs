#!/usr/bin/env node
// Isi field foto di public/data/pengurus-meti.json dari berkas public/img/pengurus/<slug>.webp lewat sambungPengurusMeti (potret.mjs).
// Tidak menyentuh orang_id (pprof kosong) dan tidak menimpa foto yang sudah ada. Pakai: node scripts/pipa/pengurus_foto_isi.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sambungPengurusMeti } from './potret.mjs';

const AKAR = fileURLToPath(new URL('../..', import.meta.url)), F = AKAR + 'public/data/pengurus-meti.json';
const h = sambungPengurusMeti(JSON.parse(fs.readFileSync(F, 'utf8')), [], new Set(), (sl) => fs.existsSync(AKAR + 'public/img/pengurus/' + sl + '.webp'));
fs.writeFileSync(F, JSON.stringify(h, null, 1) + '\n');
const semua = [...Object.values(h.unit).flat(), ...h.bidang.flatMap((b) => b.anggota)].filter((o) => o.nama);
console.log(JSON.stringify({ orang: semua.length, berfoto: semua.filter((o) => o.foto).length }));
