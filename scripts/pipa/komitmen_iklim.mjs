#!/usr/bin/env node
// Komitmen iklim korporat berkantor pusat di Indonesia: SBTi (companies-excel.xlsx publik) + RE100 (tabel anggota publik)
// -> public/data/komitmen_iklim.json. Hanya fakta komitmen (nama, sektor, status, tahun, tautan); tanpa teks target panjang.
//   node scripts/pipa/komitmen_iklim.mjs --ambil   unduh ke data-panen/komitmen/ (UA METI, robots dicek, jeda >= 2 dtk)
//   node scripts/pipa/komitmen_iklim.mjs           bangun dari cache; --selftest uji murni
// Batas: RE100 hanya memuat kolom HQ, bukan "beroperasi di Indonesia"; SBTi `location` = negara kantor pusat.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIR = path.join(ROOT, 'data-panen/komitmen');
const UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)';
const U_SBTI = 'https://files.sciencebasedtargets.org/production/files/companies-excel.xlsx';
const H_SBTI = 'https://sciencebasedtargets.org/target-dashboard';
const U_RE100 = 'https://www.there100.org/re100-members';
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
const lepas = (s) => String(s ?? '').replace(/&(amp|quot|lt|gt|#39|#x27);/g, (_, k) => ({ amp: '&', quot: '"', lt: '<', gt: '>', '#39': "'", '#x27': "'" }[k])).replace(/\s+/g, ' ').trim();

const kolIdx = (ref) => [...ref.match(/^[A-Z]+/)[0]].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;

/** xlsx (zip+XML) -> { kolom, baris:[{kolom:nilai}] } untuk lembar pertama; tanpa eksekusi apa pun. */
export function bacaXlsx(berkas, saring) {
  const unzip = (p) => execFileSync('unzip', ['-p', berkas, p], { maxBuffer: 1 << 30, encoding: 'utf8' });
  const ss = [...unzip('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => lepas([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')));
  const xml = unzip('xl/worksheets/sheet1.xml');
  let kolom = null; const baris = [];
  for (const rm of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const v = [];
    for (const c of rm[1].matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const x = /<v>([\s\S]*?)<\/v>/.exec(c[3] || ''); if (!x) continue;
      v[kolIdx(c[1])] = /t="s"/.test(c[2]) ? ss[+x[1]] : lepas(x[1]);
    }
    if (!kolom) { kolom = v.map((s) => s || ''); continue; }
    const d = {}; v.forEach((s, i) => { if (kolom[i] && s !== undefined && s !== '') d[kolom[i]] = s; });
    if (!saring || saring(d)) baris.push(d);
  }
  return { kolom, baris };
}

// Tanggal Excel (hari sejak 1899-12-30) -> ISO.
const serial = (v) => (v && +v > 20000 ? new Date(Date.UTC(1899, 11, 30) + Math.floor(+v) * 864e5).toISOString().slice(0, 10) : null);

export function sbtiBaris(d, tgl) {
  return {
    id: 'sbti_' + Math.round(+d.sbti_id), registri: 'SBTi', nama: d.company_name, sektor: d.sector || null, tipe_organisasi: d.organization_type || null,
    status_jangka_pendek: d.near_term_status || null, klasifikasi_jangka_pendek: d.near_term_target_classification || null, tahun_sasaran_jangka_pendek: d.near_term_target_year ? +d.near_term_target_year || d.near_term_target_year : null,
    status_net_zero: d.net_zero_status || null, tahun_net_zero: d.net_zero_year ? +d.net_zero_year || d.net_zero_year : null,
    diperbarui_sumber: serial(d.date_updated),
    sumber_url: H_SBTI, tanggal_periksa: tgl, tingkat_bukti: 'resmi',
  };
}

/** Tabel anggota RE100 (HTML publik): baris dengan data-hq. */
export function re100Baris(html, tgl) {
  const out = [];
  for (const m of html.matchAll(/<tr class="re100-mr-row"([^>]*)>([\s\S]*?)<\/tr>/g)) {
    const a = (k) => (new RegExp(`data-${k}="([^"]*)"`).exec(m[1]) || [])[1] || '';
    const nama = lepas((/class="re100-mr-name">([\s\S]*?)<\/span>/.exec(m[2]) || [])[1]);
    if (!nama) continue;
    out.push({ nama, hq: lepas(a('hq')), sektor: lepas(a('industry')) || null, tahun_gabung: +a('join') || null, tahun_target: +a('target') || null });
  }
  return out;
}

export function bangun(sbtiRows, re100Rows, tgl) {
  const sb = sbtiRows.filter((d) => d.location === 'Indonesia' && d.sbti_id && d.company_name).map((d) => sbtiBaris(d, tgl)).sort((a, b) => a.nama.localeCompare(b.nama));
  const re = re100Rows.filter((r) => r.hq === 'Indonesia').map((r, i) => ({ id: 're100_' + String(r.nama).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), registri: 'RE100', nama: r.nama, sektor: r.sektor, tahun_gabung: r.tahun_gabung, tahun_target_100persen: r.tahun_target, sumber_url: U_RE100, tanggal_periksa: tgl, tingkat_bukti: 'resmi' }));
  const baris = [...sb, ...re];
  return {
    lapis: 'publik', dibangun_pada: tgl, jumlah: baris.length,
    sumber: [
      { id: 's-sbti', judul: 'SBTi Companies Taking Action (companies-excel.xlsx), baris location = Indonesia', penerbit: 'Science Based Targets initiative', url: H_SBTI, unduhan: U_SBTI, tahun: +tgl.slice(0, 4) },
      { id: 's-re100', judul: 'RE100 Members (tabel anggota), baris HQ = Indonesia', penerbit: 'RE100 / The Climate Group & CDP', url: U_RE100, tahun: +tgl.slice(0, 4) },
    ],
    meta: { sbti: sb.length, re100: re.length, sbti_total_dunia: sbtiRows.length, re100_total_dunia: re100Rows.length, celah: ['Hanya perusahaan berkantor pusat di Indonesia; perusahaan asing yang beroperasi di Indonesia tidak tercakup (RE100 tidak memuat negara operasi).', 'Teks target lengkap SBTi sengaja tidak disalin: baca di sumber.'] },
    baris,
  };
}

async function ambil() {
  fs.mkdirSync(DIR, { recursive: true });
  for (const [host, u, f] of [['https://www.there100.org', U_RE100, 're100.html'], ['https://files.sciencebasedtargets.org', U_SBTI, 'sbti.xlsx']]) {
    if (host.includes('there100')) { const rb = await fetch(host + '/robots.txt', { headers: { 'User-Agent': UA } }); const t = rb.ok ? await rb.text() : ''; if (/Disallow:\s*\/\s*$/m.test(t.split(/user-agent:/i).find((b) => /^\s*\*/.test(b)) || '')) throw new Error('robots melarang ' + host); await tidur(2100); }
    const r = await fetch(u, { headers: { 'User-Agent': UA } });
    if (r.status === 403 || r.status === 429) throw new Error(`${u} -> ${r.status}: berhenti`);
    if (!r.ok) throw new Error(`${u} -> ${r.status}`);
    fs.writeFileSync(path.join(DIR, f), Buffer.from(await r.arrayBuffer())); await tidur(2100);
  }
}

function selftest() {
  const html = '<tr class="re100-mr-row" data-name="x" data-join="2026" data-target="2050" data-industry="Manufacturing" data-hq="Indonesia"><td><span class="re100-mr-name">APP &amp; Co</span></td></tr><tr class="re100-mr-row" data-hq="Japan" data-join="2026" data-target="2040" data-industry="Retain"><td><span class="re100-mr-name">Toyota</span></td></tr>';
  const r = re100Baris(html, 'x'); assert.equal(r.length, 2); assert.equal(r[0].nama, 'APP & Co');
  const o = bangun([{ sbti_id: '1', company_name: 'PT A', location: 'Indonesia', near_term_status: 'Targets set', sector: 'Energy' }, { sbti_id: '2', company_name: 'B', location: 'Japan' }], r, '2026-11-08');
  assert.equal(o.jumlah, 2); assert.ok(o.baris.every((b) => b.sumber_url && b.tanggal_periksa && b.tingkat_bukti));
  assert.equal(kolIdx('AB3'), 27); assert.equal(serial('45666.04'), '2025-01-09'); assert.equal(o.baris[0].id, 'sbti_1');
  console.log('selftest ok');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) selftest();
  else {
    if (process.argv.includes('--ambil')) await ambil();
    const fx = path.join(DIR, 'sbti.xlsx'), fh = path.join(DIR, 're100.html');
    const tgl = fs.statSync(fx).mtime.toISOString().slice(0, 10);
    const sb = bacaXlsx(fx).baris, re = re100Baris(fs.readFileSync(fh, 'utf8'), tgl);
    if (sb.length < 1000 || re.length < 100) throw new Error(`bentuk tak wajar: sbti ${sb.length}, re100 ${re.length}`);
    const out = bangun(sb, re, tgl);
    fs.writeFileSync(path.join(ROOT, 'public/data/komitmen_iklim.json'), JSON.stringify(out) + '\n');
    console.error('sbti', out.meta.sbti, 're100', out.meta.re100, 'dunia', out.meta.sbti_total_dunia, out.meta.re100_total_dunia);
  }
}
