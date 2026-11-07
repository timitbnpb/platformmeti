// public/data/rantai_pasok.json: rantai pasok lintas teknologi dari berkas publik yang sudah ada (tanpa jaringan).
//   node scripts/pipa/rantai_pasok.mjs        -> tulis public/data/rantai_pasok.json
// Sumber: rantai_plts.json (modul surya, DJEBTKE), tkdn.json (sertifikat TKDN Kemenperin), penyedia_teknologi.json.
// Komponen tanpa pemasok lokal terbaca = celah (bukan "tidak ada"); teknologi dengan < 5 pemasok = tipis.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baca = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'public/data', f), 'utf8'));

// Komponen per teknologi. tkdn: pola nama produk di tkdn.json; peny: kategori_layanan di penyedia_teknologi.json; modul: daftar DJEBTKE.
export const KOMPONEN = {
  surya: ['modul', 'sel_wafer', 'kaca_frame', 'rangka', 'floater', 'inverter'],
  bayu: ['bilah', 'menara', 'nacelle', 'gearbox_generator'],
  hidro: ['turbin_hidro', 'generator', 'pipa_pesat'],
  panas_bumi: ['turbin_uap', 'pipa_uap', 'kepala_sumur'],
  bioenergi: ['digester', 'boiler_gasifier'],
  baterai: ['sel', 'pack', 'bms_pcs'],
  hidrogen: ['elektroliser', 'tangki_tekan'],
  jaringan: ['inverter', 'panel_tr', 'trafo', 'kabel'],
};
const TKDN = [ // [teknologi, komponen, pola produk, kategori tkdn.json (opsional)]
  ['surya', 'rangka', /penyangga|rangka|solar mont/i], ['surya', 'floater', /floater|pelampung/i],
  ['surya', 'inverter', /^inverter$/i, 'inverter'], ['jaringan', 'inverter', /^inverter$/i, 'inverter'],
  ['jaringan', 'panel_tr', /panel listrik/i], ['hidro', 'turbin_hidro', /guide vane/i],
  ['baterai', 'pack', /bater|battery/i, 'baterai'],
];
const PENY = [ // [teknologi, komponen, kategori_layanan]
  ['baterai', 'sel', 'produsen baterai/komponen'],
];

const lokasi = (l) => ({ kota: l?.kota || null, provinsi: l?.provinsi || null });
const dalamNegeri = (p) => !!p.provinsi;

export function bangun({ plts, tkdn, peny }, tanggal, adaLogo = () => false, adaOrg = () => true) {
  const penyById = new Map(peny.baris.map((b) => [b.organisasi_id || b.id, b]));
  const T = {};
  for (const [id, ks] of Object.entries(KOMPONEN)) T[id] = { id, komponen: ks.map((k) => ({ id: k, pemasok: [] })) };
  const taruh = (tek, kom, p) => {
    const k = T[tek].komponen.find((x) => x.id === kom);
    const ada = k.pemasok.find((x) => x.id === p.id);
    if (ada) { ada.tkdn = Math.max(ada.tkdn ?? -1, p.tkdn ?? -1) < 0 ? null : Math.max(ada.tkdn ?? -1, p.tkdn ?? -1); return; }
    k.pemasok.push(p);
  };
  for (const x of plts.pabrikan) taruh('surya', 'modul', { id: x.id, org_id: x.id, nama: x.nama, kota: x.kota, provinsi: x.provinsi, mwp: x.mwp, tkdn: x.tkdn, pasar: x.pasar, apamsi: !!x.apamsi, bmp: x.bmp, sumber: 'rantai_plts' });
  for (const b of tkdn.baris) {
    const rule = TKDN.filter(([, , re, kat]) => re.test(b.produk) && (!kat || b.kategori === kat));
    const p = penyById.get(b.produsen_org_id);
    for (const [tek, kom] of rule) {
      const l = lokasi(p?.lokasi);
      taruh(tek, kom, { id: b.produsen_org_id || b.id, org_id: b.produsen_org_id || null, nama: b.produsen, ...l, provinsi: l.provinsi || b.provinsi || null, mwp: null, tkdn: b.tkdn_persen, sumber: 'tkdn' });
    }
  }
  for (const b of peny.baris) for (const [tek, kom, kat] of PENY) {
    if (!b.kategori_layanan.includes(kat)) continue;
    taruh(tek, kom, { id: b.organisasi_id || b.id, org_id: b.organisasi_id || null, nama: b.nama, ...lokasi(b.lokasi), mwp: null, tkdn: b.sertifikasi?.tkdn_persen_terbaik ?? null, sumber: 'penyedia' });
  }
  const keluar = Object.values(T).map((t) => {
    for (const k of t.komponen) { k.pemasok = k.pemasok.filter(dalamNegeri).map((p) => ({ ...p, org_id: p.org_id && adaOrg(p.org_id) ? p.org_id : null, logo: p.org_id && adaLogo(p.org_id) ? p.org_id : null })); k.pemasok.sort((a, b) => (b.mwp ?? 0) - (a.mwp ?? 0) || (b.tkdn ?? 0) - (a.tkdn ?? 0) || a.nama.localeCompare(b.nama)); }
    const uniq = new Set(t.komponen.flatMap((k) => k.pemasok.map((p) => p.id)));
    return { id: t.id, tipis: uniq.size < 5, pemasok_unik: uniq.size, celah: t.komponen.filter((k) => !k.pemasok.length).map((k) => k.id), komponen: t.komponen };
  });
  return {
    lapis: 'publik', dibangun_pada: tanggal,
    sumber: [
      { id: 'djebtke', judul: plts.sumber.judul, tanggal: plts.sumber.tanggal },
      { id: 'tkdn', judul: tkdn.sumber[0].judul + ', ' + tkdn.sumber[0].penerbit, tanggal: tkdn.dibangun_pada },
      { id: 'penyedia', judul: 'Daftar penyedia teknologi METI (public/data/penyedia_teknologi.json)', tanggal: peny.dibangun_pada },
    ],
    catatan: 'Celah = komponen tanpa pemasok dalam negeri yang terbaca di sumber di atas, bukan bukti tidak ada. Teknologi bertanda tipis punya kurang dari 5 pemasok terbaca.',
    teknologi: keluar,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const org = new Set(baca('organisasi.json').baris.map((o) => o.id));
  const j = bangun({ plts: baca('rantai_plts.json'), tkdn: baca('tkdn.json'), peny: baca('penyedia_teknologi.json') }, new Date().toISOString().slice(0, 10), (id) => fs.existsSync(path.join(ROOT, 'public/img/logo/org', id + '.png')), (id) => org.has(id));
  fs.writeFileSync(path.join(ROOT, 'public/data/rantai_pasok.json'), JSON.stringify(j));
  console.log(j.teknologi.map((t) => `${t.id}: ${t.pemasok_unik} pemasok, celah ${t.celah.length}${t.tipis ? ' (tipis)' : ''}`).join('\n'));
}
