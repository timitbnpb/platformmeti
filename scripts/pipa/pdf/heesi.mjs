// Adapter HEESI 2025 (Handbook of Energy and Economic Statistics of Indonesia): bauran energi primer (3.1), kapasitas pembangkit on-grid per jenis per tahun (6.4.1A), kapasitas per provinsi 2025 (6.4.9).
import { token, angkaEn } from '../ekstrak_pdf.mjs';

const tahunDari = (s) => { const m = /^(20[12]\d)\d?\)?$/.exec(s); return m ? Number(m[1]) : null; };

/** Baris "tahun v1 ... vN" dari satu halaman, berhenti di penanda 'Off Grid'. Mengembalikan [{tahun, nilai[]}]. */
export function barisTahun(teks, n, { sampai } = {}) {
  const keluar = [];
  for (const g of teks.split('\n')) {
    if (sampai && sampai.test(g)) break;
    const t = token(g), y = tahunDari(t[0] || '');
    if (!y || t.length !== n + 1) continue;
    const v = t.slice(1).map(angkaEn);
    if (v.some(Number.isNaN)) continue;
    keluar.push({ tahun: y, nilai: v });
  }
  return keluar;
}

/** Baris provinsi HEESI 6.4.9: "kode Nama Provinsi v1..v8" (v = angka atau '-'). */
export function barisProvinsi(teks, n) {
  const keluar = [];
  for (const g of teks.split('\n')) {
    const t = token(g);
    if (!/^\d{2}$/.test(t[0] || '') && t[0] !== 'Total') continue;
    let i = 1; const nama = [];
    while (i < t.length && !/^(-|-?[\d,]+(\.\d+)?)$/.test(t[i])) nama.push(t[i++]);
    const v = t.slice(i).map(angkaEn);
    if (t[0] === 'Total' ? v.length !== n : !nama.length || v.length !== n) continue;
    if (v.some(Number.isNaN)) continue;
    keluar.push({ kode: t[0] === 'Total' ? 'total' : t[0], nama: t[0] === 'Total' ? 'Total' : nama.join(' '), nilai: v });
  }
  return keluar;
}

/** Blok kanan tabel tanpa kolom tahun: baris bernilai saja (n kolom), urut sama dengan blok kiri. */
export function barisTanpaTahun(teks, n) {
  const keluar = [];
  for (const g of teks.split('\n')) {
    const t = token(g);
    if (t.length !== n || !/^(-|n\.a|[\d,]+(\.\d+)?)$/.test(t[0])) continue;
    const v = t.map(angkaEn);
    if (!v.some(Number.isNaN)) keluar.push(v);
  }
  return keluar;
}

const cari = (halaman, judul, dari = 30) => { const i = halaman.findIndex((p, k) => k >= dari && p.includes(judul)); return i < 0 ? null : i; };
const kol = (pasang) => pasang.map(([k, label]) => ({ k, label, tipe: 'angka' }));
const peta = (kunci, nilai) => Object.fromEntries(kunci.map((k, i) => [k, nilai[i]]));

export default {
  id: 'heesi-2025', judul: 'Handbook of Energy and Economic Statistics of Indonesia 2025', penerbit: 'Kementerian ESDM', tanggal_dokumen: '2026-08', versi: 'edisi 2025 (data 2015-2025)',
  sumber_url: 'https://www.esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2025.pdf',
  unduh_url: 'https://www.esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2025.pdf',
  berkas: 'heesi-2025.pdf', catatan: 'Tanggal dokumen dari metadata PDF (Agustus 2026). Tahun berfootnote (2024 revisi, 2025 sementara) mengikuti catatan di buku.',
  ekstrak(halaman) {
    const tabel = [];
    // 3.1 bauran energi primer: dua blok tabel (7 + 8 kolom) pada dua halaman berurutan; digabung per tahun
    const b1 = cari(halaman, '3.1        Primary Energy Supply by Sources') ?? cari(halaman, 'Primary Energy Supply by Sources');
    if (b1 != null) {
      const A = barisTahun(halaman[b1], 7), B = barisTanpaTahun(halaman[b1 + 1], 8);
      const K1 = ['batubara', 'minyak_bumi', 'gas_bumi', 'hidro', 'panas_bumi', 'surya', 'bayu'], K2 = ['ebt_lain', 'biomassa_tradisional', 'biofuel', 'biogas', 'biomassa_industri', 'pemanas_air_surya', 'panas_bumi_langsung', 'total'];
      const baris = A.length === B.length ? A.map((a, i) => ({ tahun: a.tahun, ...peta(K1, a.nilai), ...peta(K2, B[i]), halaman: b1 + 1 })) : [];
      tabel.push({ id: 'bauran-primer', judul: 'Pasokan energi primer menurut sumber (bauran)', satuan: 'ribu BOE', catatan: 'Tabel 3.1; kolom kanan tabel ada di halaman berikutnya (hlm ' + (b1 + 2) + ').',
        kolom: [{ k: 'tahun', label: 'Tahun', tipe: 'teks' }, ...kol([['batubara', 'Batubara'], ['minyak_bumi', 'Minyak bumi'], ['gas_bumi', 'Gas bumi'], ['hidro', 'Hidro'], ['panas_bumi', 'Panas bumi'], ['surya', 'Surya'], ['bayu', 'Bayu'], ['ebt_lain', 'EBT lain'], ['biomassa_tradisional', 'Biomassa tradisional'], ['biofuel', 'Biofuel'], ['biogas', 'Biogas'], ['biomassa_industri', 'Biomassa industri'], ['pemanas_air_surya', 'Pemanas air surya'], ['panas_bumi_langsung', 'Panas bumi langsung'], ['total', 'Total']])], baris });
    }
    // 6.4.1A kapasitas on-grid per jenis per tahun (MW)
    const c = cari(halaman, '6.4.1A Power Plant Installed Capacity');
    if (c != null) {
      const K = ['hidro', 'uap_batubara', 'gas', 'gas_uap', 'panas_bumi', 'diesel', 'mesin_gas', 'bayu'];
      tabel.push({ id: 'kapasitas-on-grid', judul: 'Kapasitas terpasang pembangkit on-grid menurut jenis', satuan: 'MW', catatan: 'Tabel 6.4.1A, blok On Grid.',
        kolom: [{ k: 'tahun', label: 'Tahun', tipe: 'teks' }, ...kol([['hidro', 'PLTA'], ['uap_batubara', 'PLTU'], ['gas', 'PLTG'], ['gas_uap', 'PLTGU'], ['panas_bumi', 'PLTP'], ['diesel', 'PLTD'], ['mesin_gas', 'PLTMG'], ['bayu', 'PLTB']])],
        baris: barisTahun(halaman[c], 8, { sampai: /Off Grid/ }).map((r) => ({ tahun: r.tahun, ...peta(K, r.nilai), halaman: c + 1 })) });
    }
    // 6.4.9 kapasitas per provinsi 2025 (MW)
    const p = cari(halaman, '6.4.9 Power Plant Installed Capacity by Province 2025');
    if (p != null) {
      const K = ['hidro', 'mini_hidro', 'mikro_hidro', 'panas_bumi', 'surya', 'bayu', 'biogas', 'biomassa'];
      const baris = [];
      for (const hl of [p, p + 1]) for (const r of barisProvinsi(halaman[hl], 8)) if (!baris.some((b) => b.kode === r.kode)) baris.push({ kode: r.kode, provinsi: r.nama, ...peta(K, r.nilai), halaman: hl + 1 });
      tabel.push({ id: 'kapasitas-provinsi-2025', judul: 'Kapasitas terpasang pembangkit EBT per provinsi, 2025', satuan: 'MW', catatan: 'Tabel 6.4.9; nama provinsi dalam bahasa Inggris seperti di buku.',
        kolom: [{ k: 'kode', label: 'Kode', tipe: 'teks' }, { k: 'provinsi', label: 'Provinsi', tipe: 'teks' }, ...kol([['hidro', 'PLTA'], ['mini_hidro', 'PLTM'], ['mikro_hidro', 'PLTMH'], ['panas_bumi', 'PLTP'], ['surya', 'PLTS'], ['bayu', 'PLTB'], ['biogas', 'Biogas'], ['biomassa', 'Biomassa']])], baris });
    }
    return tabel;
  },
};
