// Adapter Kepmen ESDM Besaran BPP Pembangkitan PT PLN (Persero): pindaian -> OCR Vision (scripts/pipa/ocr_pdf.swift), SEMUA baris OCR berstatus periksa-silang.
// Periksa-silang: Rp/kWh dibagi kurs rata-rata (diturunkan dari median seluruh baris) harus sama dengan sen US$/kWh; selisih > 1,5% atau angka tak terbaca = perlu_tinjau.
// Transkripsi tinjauan manusia ada di data/peluang/bpp.json; adapter ini menambah sitasi halaman dan penanda OCR.
import { angkaId } from '../ekstrak_pdf.mjs';

const KEPMEN = [
  { berkas: 'pk-kepmen-esdm-1404-2017.pdf', nomor: '1404 K/20/MEM/2017', tahun_bpp: 2016, ditetapkan: '2017-03-27' },
  { berkas: 'pk-kepmen-esdm-55-2019.pdf', nomor: '55 K/20/MEM/2019', tahun_bpp: 2018, ditetapkan: '2019-03-29' },
  { berkas: 'pk-kepmen-esdm-169-2021.pdf', nomor: '169.K/HK.02/MEM.M/2021', tahun_bpp: 2020, ditetapkan: '2021-09-08' },
];
const NOMOR = /^([A-Za-z]|\d{1,2})(\.\d{1,2})*\.?$/; // penomoran baris: a, b.2.1, 3
const MIRIP = /^[\d.,łlI|]+$/; // sel yang mirip angka (OCR menukar 1 dengan ł)
const rapikan = (s) => s.replace(/[łlI|]/g, '1').replace(/\s+/g, '');

/** Satu halaman OCR -> baris mentah {sistem, rp, cent, tinjau}. Baris wilayah tanpa angka dilewati. */
export function barisBpp(teks) {
  const keluar = [];
  const baris = String(teks).split('\n').map((g) => g.split(/\s{2,}/).map((x) => x.trim()).filter(Boolean));
  for (const sel of baris) {
    // gabung "2.349   ,75" -> "2.349,75"
    for (let i = sel.length - 1; i > 0; i--) if (/^,\d+$/.test(sel[i]) && /^[\d.]+$/.test(sel[i - 1])) { sel.splice(i - 1, 2, sel[i - 1] + sel[i]); }
    let n = 0; while (n < 2 && n < sel.length - 1 && MIRIP.test(sel[sel.length - 1 - n])) n++;
    if (!n) continue;
    const angkaSel = sel.slice(sel.length - n), namaSel = sel.slice(0, sel.length - n);
    if (!namaSel.length) continue;
    let nama = namaSel.join(' ').split(/\s+/);
    while (nama.length > 1 && NOMOR.test(nama[0])) nama.shift();
    nama = nama.join(' ').replace(/^[.\s]+/, '');
    if (!/[A-Za-z]{3}/.test(nama) || /^(NO|WILAYAH|\(Rp|BPP|Keterangan)/i.test(nama)) continue;
    const [rpS, cS] = n === 2 ? angkaSel : [angkaSel[0], null];
    const baru = (s) => { if (s == null) return null; const bersih = rapikan(s), v = angkaId(bersih); return Number.isFinite(v) ? v : NaN; };
    keluar.push({ sistem: nama, rp: baru(rpS), cent: baru(cS), asal: sel.join(' | ') });
  }
  return keluar;
}

export function selesaikan(mentah) {
  const sehat = mentah.filter((b) => Number.isFinite(b.rp) && Number.isFinite(b.cent) && b.cent > 0).map((b) => b.rp / b.cent * 100).sort((a, z) => a - z);
  const kurs = sehat.length ? sehat[Math.floor(sehat.length / 2)] : null;
  return mentah.map((b) => {
    let { rp, cent } = b, tinjau = true;
    const rpOk = Number.isFinite(rp), cOk = Number.isFinite(cent);
    if (kurs && rpOk && cOk) tinjau = Math.abs(rp / kurs * 100 - cent) / cent > 0.015;
    else if (kurs && rpOk && !cOk) cent = Math.round(rp / kurs * 10000) / 100; // sen diturunkan dari Rp
    else if (kurs && !rpOk && cOk) rp = Math.round(cent * kurs / 100 * 100) / 100;
    return { sistem: b.sistem, rp: Number.isFinite(rp) ? rp : null, cent: Number.isFinite(cent) ? cent : null, kurs: kurs ? Math.round(kurs) : null, tinjau };
  });
}

const kolom = [{ k: 'sistem', label: 'Sistem / sub sistem', tipe: 'teks' }, { k: 'bpp_rp_kwh', label: 'BPP (Rp/kWh)', tipe: 'angka' }, { k: 'bpp_cent_kwh', label: 'BPP (sen US$/kWh)', tipe: 'angka' }];

export default {
  id: 'kepmen-bpp-pembangkitan', judul: 'Kepmen ESDM Besaran BPP Pembangkitan PT PLN (Persero), tahun BPP 2016, 2018, 2020', penerbit: 'Kementerian ESDM', tanggal_dokumen: '2021-09-08', versi: 'BPP 2016 (1404 K/20/MEM/2017), 2018 (55 K/20/MEM/2019), 2020 (169.K/HK.02/MEM.M/2021)',
  sumber_url: 'https://jdih.esdm.go.id/', unduh_url: null, ocr: true, berkas: KEPMEN.map((k) => k.berkas),
  catatan: 'Berkas pindaian (OCR Vision macOS). Halaman = halaman PDF salinan pustaka METI; tautan "hlm" tidak ke PDF karena JDIH ESDM tidak menyediakan URL berkas tetap. Baris berstatus perlu tinjau gagal periksa-silang Rp terhadap sen US$.',
  ekstrak(halamanSemua) {
    return KEPMEN.map((k, i) => {
      const hal = halamanSemua[i], awal = hal.findIndex((p) => /LAMPIRAN/.test(p.slice(0, 120)));
      const baris = [];
      for (let h = Math.max(awal, 0); h < hal.length; h++) for (const r of selesaikan(barisBpp(hal[h]))) baris.push({ sistem: r.sistem, bpp_rp_kwh: r.rp, bpp_cent_kwh: r.cent, halaman: h + 1, ...(r.tinjau ? { perlu_tinjau: true } : {}) });
      return { id: `bpp-${k.tahun_bpp}`, judul: `BPP Pembangkitan tahun ${k.tahun_bpp} (Kepmen ${k.nomor}, ditetapkan ${k.ditetapkan})`, satuan: 'Rp/kWh dan sen US$/kWh', catatan: `Hasil OCR berkas ${k.berkas}.`, kolom, baris };
    });
  },
};
