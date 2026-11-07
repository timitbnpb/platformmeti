// Pencocok tokoh dan lembaga yang disebut di judul berita (murni; tanpa jaringan, tanpa isi artikel).
// Dipanggil dari scripts/pipa/potret.mjs. Hanya orang/lembaga yang sudah ada di daftar publik; nama ambigu (milik >1 id) tidak dicocokkan.
// Aturan sama untuk keduanya: kunci -> {id}; kunci yang dimiliki lebih dari satu id dibuang; kunci yang tercakup kunci lain yang lebih panjang dan cocok juga dibuang.
export const norm = (s) => ' ' + String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^0-9a-z]+/g, ' ').trim() + ' ';
const bersih = (s) => norm(String(s).replace(/\([^)]*\)/g, ' ').replace(/\b(PT|Tbk|Persero|CV|Perseroda)\b/gi, ' ')).trim();
const SEPERTI_JALAN = new Set(['jalan', 'jl', 'bandara', 'stadion', 'gedung', 'universitas', 'rs', 'rsud', 'sma', 'smp', 'sdn', 'terminal', 'pasar', 'taman']);
const MANTAN = new Set(['mantan', 'eks', 'bekas', 'former', 'ex', 'ahli', 'staf', 'khusus', 'bicara', 'sekretaris', 'jubir', 'stafsus', 'penasihat', 'utusan']); // bukan pejabatnya sendiri
const LANJUT = new Set(['ip', 'np', 'epi', 'icon', 'indonesia', 'nusantara', 'power', 'energy', 'geothermal', 'renewables', 'patra']);
const JABATAN_VAR = { 'direktur utama': ['direktur utama', 'dirut'], 'wakil direktur utama': ['wakil direktur utama', 'wakil dirut', 'wadirut'], 'ketua umum': ['ketua umum'], 'wakil menteri': ['wakil menteri', 'wamen'], menteri: ['menteri'] };

function cari(n, kunci) { // semua posisi kunci (sudah berpagar spasi) di n -> [{awal, akhir}]
  const out = []; let i = n.indexOf(kunci);
  while (i >= 0) { out.push({ awal: i, akhir: i + kunci.length - 1 }); i = n.indexOf(kunci, i + 1); }
  return out;
}
const sebelum = (n, pos) => n.slice(0, pos).trim().split(' ').pop();
const sesudah = (n, pos) => n.slice(pos).trim().split(' ')[0];

/** Buang kunci yang tercakup kunci lain yang lebih panjang (milik id lain) lalu kembalikan id unik. */
function putuskan(cocok, peta) { // cocok: [{kunci, ids:Set}]
  const sisa = cocok.filter((m) => !cocok.some((o) => o !== m && o.kunci.length > m.kunci.length && o.kunci.includes(m.kunci)));
  return [...new Set(sisa.flatMap((m) => (m.ids.size === 1 ? [...m.ids] : [])))];
}
const tambah = (peta, kunci, id, sifat) => { if (!kunci || kunci.trim().length < 3) return; const e = peta.get(kunci) || peta.set(kunci, { ids: new Set(), ...sifat }).get(kunci); e.ids.add(id); };

/** Indeks orang dari baris publik { id, nama, status, jabatan_terkini, organisasi_terkini }. */
export function bangunOrang(rows) {
  const nama = new Map(), jab = new Map(), tunggal = new Map(), hitung = new Map();
  for (const o of rows) for (const w of new Set(norm(o.nama).trim().split(' '))) hitung.set(w, (hitung.get(w) || 0) + 1);
  for (const o of rows) {
    const t = norm(o.nama).trim().split(' ').filter(Boolean);
    if (t.length >= 2) tambah(nama, ' ' + t.join(' ') + ' ', o.id);
    if (t.length >= 3 && (t[0] + t[t.length - 1]).length >= 9) tambah(nama, ` ${t[0]} ${t[t.length - 1]} `, o.id);
    const aktif = o.status === 'menjabat', jb = bersih(o.jabatan_terkini || '');
    if (aktif && /^(menteri|wakil menteri|direktur utama|presiden)/.test(jb)) for (const w of new Set([t[0], t[t.length - 1]])) if (w && w.length >= 5 && hitung.get(w) === 1) tambah(tunggal, w, o.id, { asli: String(o.nama).split(/\s+/).find((x) => norm(x).trim() === w) });
    if (!aktif || !jb) continue;
    if (/^(menteri|wakil menteri) /.test(jb) || /komisi/.test(jb) || /^kepala /.test(jb)) {
      tambah(jab, ` ${jb} `, o.id, { jab: true });
      if (/^wakil menteri /.test(jb)) tambah(jab, ` ${jb.replace('wakil menteri', 'wamen')} `, o.id, { jab: true });
      if (/ esdm$/.test(' ' + jb)) tambah(jab, ` ${jb.replace(/esdm$/, 'energi dan sumber daya mineral')} `, o.id, { jab: true });
    }
    const var_ = JABATAN_VAR[jb]; if (!var_) continue;
    const o_ = String(o.organisasi_terkini || ''), singkat = (/\(([A-Za-z]{2,10})\)/.exec(o_) || [])[1];
    for (const org of new Set([bersih(o_), singkat && singkat.toLowerCase(), bersih(o_.replace(/^Kementerian /, ''))].filter((x) => x && x.length >= 3))) for (const v of var_) tambah(jab, ` ${v} ${org} `, o.id, { jab: true });
  }
  return { nama, jab, tunggal };
}

/** id orang yang disebut di judul. */
export function orangDari(judul, idx) {
  const n = norm(judul), cocok = [];
  for (const [kunci, e] of idx.nama) for (const p of cari(n, kunci)) { if (SEPERTI_JALAN.has(sebelum(n, p.awal))) continue; cocok.push({ kunci, ids: e.ids }); break; }
  for (const [kunci, e] of idx.jab) for (const p of cari(n, kunci)) { if (MANTAN.has(sebelum(n, p.awal)) || LANJUT.has(sesudah(n, p.akhir + 1))) continue; cocok.push({ kunci, ids: e.ids }); break; }
  for (const [w, e] of idx.tunggal) if (e.asli && new RegExp('(?<![A-Za-z])' + e.asli + '(?![A-Za-z])').test(judul) && !cocok.some((m) => m.kunci.includes(' ' + w + ' '))) cocok.push({ kunci: ' ' + w + ' ', ids: e.ids });
  return putuskan(cocok);
}

/** Sinonim lembaga: [alias, nama baku lembaga (dibandingkan lewat bersih())]. Yang tidak ada di daftar publik dilewati. */
export const SINONIM_LEMBAGA = [['PGE', 'Pertamina Geothermal Energy'], ['Pertamina Geothermal', 'Pertamina Geothermal Energy'], ['PLN IP', 'PLN Indonesia Power'], ['PLN NP', 'PLN Nusantara Power'], ['PGN', 'Perusahaan Gas Negara'], ['IDXCarbon', 'Bursa Karbon Indonesia'], ['Denera', 'Daya Energi Bersih Nusantara'], ['Kementerian ESDM', 'Kementerian Energi dan Sumber Daya Mineral'], ['Pertamina NRE', 'Pertamina New & Renewable Energy']];

/** Indeks lembaga dari baris publik { id, nama, nama_lain, singkatan, kode_saham }. Singkatan pendek peka huruf besar; nama panjang tidak. */
export function bangunLembaga(rows, sinonim = SINONIM_LEMBAGA) {
  const frasa = new Map(), singkat = new Map();
  const abbr = (a, id) => { if (/^[A-Za-z0-9]{3,10}$/.test(a)) tambah(singkat, a, id); };
  const fr = (s, id) => { const k = norm(s); if (k.trim().length >= 8 || /\s/.test(k.trim()) && k.trim().length >= 6) tambah(frasa, bersih(s) && ' ' + bersih(s) + ' ', id); };
  const byNama = new Map(rows.map((o) => [bersih(o.nama), o.id]));
  for (const o of rows) {
    const nama = String(o.nama || '');
    if (/^[A-Z0-9]{3,6}$/.test(nama)) abbr(nama, o.id); else if (bersih(nama).length >= 8) fr(nama, o.id);
    for (const l of [].concat(o.nama_lain || [])) if (/^[A-Z0-9]{3,6}$/.test(l)) abbr(l, o.id); else fr(l, o.id);
    const p = /\(([A-Za-z]{3,10})\)/.exec(nama); if (p) abbr(p[1], o.id);
    if (o.singkatan) { if (/\s/.test(o.singkatan)) fr(o.singkatan, o.id); else abbr(o.singkatan, o.id); }
    if (o.kode_saham && o.kode_saham.length >= 4) abbr(o.kode_saham, o.id);
  }
  for (const [a, baku] of sinonim) { const id = byNama.get(bersih(baku)); if (!id) continue; if (/^[A-Z0-9]{3,10}$/.test(a)) abbr(a, id); else fr(a, id); }
  return { frasa, singkat };
}

/** id lembaga yang disebut di judul. */
export function lembagaDari(judul, idx) {
  const n = norm(judul), cocok = [];
  for (const [kunci, e] of idx.frasa) if (n.includes(kunci)) cocok.push({ kunci, ids: e.ids });
  for (const [a, e] of idx.singkat) if (new RegExp('(?<![A-Za-z0-9])' + a + '(?![A-Za-z0-9])').test(judul)) cocok.push({ kunci: ' ' + a.toLowerCase() + ' ', ids: e.ids });
  return putuskan(cocok);
}
