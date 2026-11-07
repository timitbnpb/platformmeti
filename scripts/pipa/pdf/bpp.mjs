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

const SAMPAH = /^(NO\b|WILAYAH|SISTEM\/|\(Rp|BPP|Keterangan|PRESIDEN|MENTERI|SALINAN|LAMPIRAN|Ditetapkan|Pada tanggal)|Rp\)|^[-\s\d]*$/i;
const seimbang = (n) => (n.match(/\(/g) || []).length <= (n.match(/\)/g) || []).length;
const TERBUKA = (n) => !seimbang(n) || /,$/.test(n) || /\b(DAN|dan|IBUKOTA|SULAWESI)$/.test(n); // nama terpotong ke baris OCR berikutnya
const potongNomor = (teks) => { const k = teks.split(/\s+/); while (k.length > 1 && (NOMOR.test(k[0]) || /^[IVX]+\.$/.test(k[0]))) k.shift(); return k.join(' ').replace(/^[.\s]+/, ''); };

/** Rapikan label hasil OCR: salah baca huruf, singkatan dalam kurung, kurung/koma terpotong. {nama, ragu} (ragu = potongan tak bisa disambung). */
export function rapikanLabel(mentah) {
  let nama = String(mentah).replace(/\s+/g, ' ').replace(/-\s*\d+\s*-$/, '').trim();
  nama = nama.replace(/^T(?=Pulau )/, '').replace(/^br /, '').replace('Selavar', 'Selayar').replace(/\s*\([A-Z0-9]{3,}\)\s*$/, '');
  nama = nama.replace(/^SUB SISTEM/i, (m) => m.toUpperCase().startsWith('SUB S') ? 'SUBSISTEM' : m).replace(/^DAERAH KHUSUS IBUKOTA( JAKARTA)?$/, 'DKI JAKARTA');
  nama = nama.replace(/^SUBSISTEM KEPULAUAN KECIL$/, 'Sub sistem kepulauan kecil').replace(/^SUBSISTEM KECIL LAINNYA$/, 'Sub sistem kecil lainnya');
  let ragu = false;
  if (!seimbang(nama)) { nama += ')'; ragu = true; }
  if (/,$/.test(nama)) { nama = nama.slice(0, -1); ragu = true; }
  return { nama, ragu };
}

/** Satu halaman OCR -> baris mentah {sistem, rp, cent, tinjau}. Baris wilayah tanpa angka dilewati; nama yang terpotong disambung dengan baris OCR berdampingan. */
export function barisBpp(teks) {
  const keluar = [];
  let tunda = '';
  const baris = String(teks).split('\n').map((g) => g.split(/\s{2,}/).map((x) => x.trim()).filter(Boolean));
  for (const sel of baris) {
    // gabung "2.349   ,75" -> "2.349,75"
    for (let i = sel.length - 1; i > 0; i--) if (/^,\d+$/.test(sel[i]) && /^[\d.]+$/.test(sel[i - 1])) { sel.splice(i - 1, 2, sel[i - 1] + sel[i]); }
    let n = 0; while (n < 2 && n < sel.length - 1 && MIRIP.test(sel[sel.length - 1 - n])) n++;
    if (!n) {
      const g = potongNomor(sel.join(' '));
      if (!g || SAMPAH.test(g) || !/[A-Za-z]{2}/.test(g)) continue;
      const akhir = keluar[keluar.length - 1];
      if (akhir && !akhir.sambung && TERBUKA(akhir.sistem)) { akhir.sistem = `${akhir.sistem} ${g}`; akhir.sambung = TERBUKA(akhir.sistem) || /^\(/.test(g); continue; }
      if (akhir && akhir.sambung && /^\(|^[A-Z ,()]+$/.test(g)) { akhir.sistem = `${akhir.sistem} ${g}`; akhir.sambung = false; continue; }
      if (!seimbang(g)) tunda = g; // hanya kurung terbuka; judul wilayah tanpa angka tidak disambung ke baris sesudahnya
      continue;
    }
    const angkaSel = sel.slice(sel.length - n), namaSel = sel.slice(0, sel.length - n);
    if (!namaSel.length) continue;
    let nama = potongNomor(namaSel.join(' '));
    if (!/[A-Za-z]{3}/.test(nama) || /^(NO|WILAYAH|\(Rp|BPP(?! PEMBANGKITAN NASIONAL)|Keterangan)/i.test(nama)) continue; // baris BPP nasional dipertahankan: pembanding selisih di layar
    if (tunda) { nama = `${tunda} ${nama}`; tunda = ''; }
    const [rpS, cS] = n === 2 ? angkaSel : [angkaSel[0], null];
    const baru = (s) => { if (s == null) return null; const bersih = rapikan(s), v = angkaId(bersih); return Number.isFinite(v) ? v : NaN; };
    keluar.push({ sistem: nama, rp: baru(rpS), cent: baru(cS), asal: sel.join(' | '), sambung: false });
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
    const l = rapikanLabel(b.sistem);
    return { sistem: l.nama, rp: Number.isFinite(rp) ? rp : null, cent: Number.isFinite(cent) ? cent : null, kurs: kurs ? Math.round(kurs) : null, tinjau: tinjau || l.ragu };
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
