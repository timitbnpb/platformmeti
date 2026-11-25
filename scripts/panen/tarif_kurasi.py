#!/usr/bin/env python3
"""Kurasi tarif tenaga listrik PLN per golongan (Rp/kWh) ke data/kembaran/tarif.json.
Sumber utama: dokumen PLN "Penetapan Penyesuaian Tarif Tenaga Listrik (Tariff Adjustment) Bulan Oktober - Desember 2026" (13 golongan non-subsidi,
ditandatangani Dirut PLN 22 Oktober 2026), PDF hasil pindai tanpa lapisan teks: angka dibaca dari gambar (pdftoppm, dilihat langsung), lalu ditulis tangan di sini.
Mentah (di luar repo): <MENTAH>/tarif/tw4_2026.pdf. Tarif 24 golongan bersubsidi TIDAK ada di dokumen itu dan tidak dikutip.
Pakai: python3 scripts/panen/tarif_kurasi.py
"""
import json, os, sys

AKAR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BACA = '2026-11-25'
SUMBER = [
    {'id': 'PLN-TARIF-2026-TW4', 'jenis': 'dokumen', 'judul': 'Penetapan Penyesuaian Tarif Tenaga Listrik (Tariff Adjustment) Bulan Oktober - Desember 2026', 'penerbit': 'PT PLN (Persero)',
     'url': 'https://www.pln.co.id/webapi/media/file/webkorp/asset/TARIFF-ADJUSTMENT-Okt-Des-2026.pdf', 'tanggal_terbit': '2026-10-22', 'tanggal_baca': BACA,
     'lisensi': 'dokumen publik PT PLN (Persero); hanya angka tarif dikutip; atribusi PLN',
     'catatan': 'Halaman tautan: https://www.pln.co.id/customer-en/electricity-tariffs-en/tariff-adjustment-en (bagian Quarter 4 2026). PDF 1 halaman, hasil pindai gambar; 13 golongan reguler dan kolom pra bayar.'},
    {'id': 'PLN-PR-2026-TW4-TETAP', 'jenis': 'siaran-pers', 'judul': 'Q4 2026 Electricity Tariffs Remains, PLN Supports Indonesian Economic Growth', 'penerbit': 'PT PLN (Persero)',
     'url': 'https://www.pln.co.id/q4-2026-electricity-tariffs-unchanged', 'tanggal_terbit': '2026-10-14', 'tanggal_baca': BACA, 'lisensi': 'hak cipta PT PLN (Persero); hanya fakta dikutip; atribusi PLN',
     'catatan': 'Pemerintah mempertahankan tarif Oktober-Desember 2026 untuk 13 golongan non-subsidi dan 24 golongan bersubsidi (tarif tetap).'},
    {'id': 'ESDM-PR-2026-038', 'jenis': 'siaran-pers', 'judul': 'Jaga Daya Beli, Menteri ESDM: Tarif Listrik Tidak Naik', 'penerbit': 'Kementerian ESDM',
     'url': 'https://www.esdm.go.id/id/media-center/arsip-berita/jaga-daya-beli-menteri-esdm-tarif-listrik-tidak-naik', 'tanggal_terbit': '2026-06-30', 'tanggal_baca': BACA, 'lisensi': 'publikasi pemerintah (Kementerian ESDM); hanya fakta dikutip; atribusi penerbit',
     'catatan': 'Siaran Pers 038.Pers/04/SJI/2026: tarif Triwulan III 2026 (Jul-Sep) tetap; dasar Permen ESDM No. 7 Tahun 2024; parameter Feb-Apr 2026: kurs Rp16.959,32/USD, ICP USD96,12/barel, inflasi 0,21%, HBA USD70/ton.'},
    {'id': 'ESDM-PR-2025-077', 'jenis': 'siaran-pers', 'judul': 'Pemerintah Putuskan Tarif Listrik Triwulan IV 2025 Tetap', 'penerbit': 'Kementerian ESDM',
     'url': 'https://www.esdm.go.id/id/media-center/arsip-berita/pemerintah-putuskan-tarif-listrik-triwulan-iv-2025-tetap-', 'tanggal_terbit': '2025-09-24', 'tanggal_baca': BACA, 'lisensi': 'publikasi pemerintah (Kementerian ESDM); hanya fakta dikutip; atribusi penerbit',
     'catatan': 'Siaran Pers 077.Pers/04/SJI/2025: tertulis penyesuaian tarif terakhir dilakukan Triwulan III 2022 untuk R-2, R-3 (3.500 VA ke atas) dan P-1, P-2, P-3; golongan lain terakhir pada 2020.'},
]
RM = {'*': 'RM1 = 40 jam nyala x daya tersambung (kVA) x biaya pemakaian', '**': 'RM2 = 40 jam nyala x daya tersambung (kVA) x biaya pemakaian LWBP', '***': 'RM3 = 40 jam nyala x daya tersambung (kVA) x biaya pemakaian WBP dan LWBP'}
S = 'PLN-TARIF-2026-TW4'
def reg(no, kode, golongan, daya, tarif, pra, rm):  # golongan reguler: satu tarif Rp/kWh
    return {'no': no, 'kode': kode, 'golongan': golongan, 'batas_daya': daya, 'bentuk': 'reguler', 'rp_per_kwh': tarif, 'pra_bayar_rp_per_kwh': pra, 'rekening_minimum': RM[rm], 'src': S, 'st': 'sumber'}
def blok(no, kode, golongan, daya, wbp, lwbp, kvarh, rm, faktor, mult):  # tegangan menengah/tinggi: blok WBP/LWBP + kVArh
    return {'no': no, 'kode': kode, 'golongan': golongan, 'batas_daya': daya, 'bentuk': 'blok', 'lwbp_rp_per_kwh': lwbp, 'wbp_rp_per_kwh_dasar': wbp, 'faktor_pengali_wbp': faktor, 'wbp_rumus': mult,
            'kvarh_rp_per_kvarh': kvarh, 'pra_bayar_rp_per_kwh': None, 'rekening_minimum': RM[rm], 'src': S, 'st': 'sumber'}
GOL = [
    reg(1, 'R-1/TR', 'Rumah tangga kecil', '900 VA-RTM', 1352.00, 1352.00, '*'),
    reg(2, 'R-1/TR', 'Rumah tangga kecil', '1.300 VA', 1444.70, 1444.70, '*'),
    reg(3, 'R-1/TR', 'Rumah tangga kecil', '2.200 VA', 1444.70, 1444.70, '*'),
    reg(4, 'R-2/TR', 'Rumah tangga menengah', '3.500 VA s.d. 5.500 VA', 1699.53, 1699.53, '*'),
    reg(5, 'R-3/TR, TM', 'Rumah tangga besar', '6.600 VA ke atas', 1699.53, 1699.53, '*'),
    reg(6, 'B-2/TR', 'Bisnis menengah', '6.600 VA s.d. 200 kVA', 1444.70, 1444.70, '*'),
    blok(7, 'B-3/TM, TT', 'Bisnis besar', 'di atas 200 kVA', 1035.78, 1035.78, 1114.74, '**', 'K', 'WBP = K x 1.035,78'),
    blok(8, 'I-3/TM', 'Industri menengah', 'di atas 200 kVA', 1035.78, 1035.78, 1114.74, '**', 'K', 'WBP = K x 1.035,78'),
    blok(9, 'I-4/TT', 'Industri besar', '30.000 kVA ke atas', 996.74, 996.74, 996.74, '***', None, 'WBP dan LWBP sama (996,74)'),
    reg(10, 'P-1/TR', 'Kantor pemerintah (kecil)', '6.600 VA s.d. 200 kVA', 1699.53, 1699.53, '*'),
    blok(11, 'P-2/TM', 'Kantor pemerintah (menengah)', 'di atas 200 kVA', 1415.01, 1415.01, 1522.88, '**', 'K', 'WBP = K x 1.415,01'),
    reg(12, 'P-3/TR', 'Penerangan jalan umum', None, 1699.53, 1699.53, '*'),
    {'no': 13, 'kode': 'L/TR, TM, TT', 'golongan': 'Layanan khusus', 'batas_daya': None, 'bentuk': 'blok', 'lwbp_rp_per_kwh': None, 'wbp_rp_per_kwh_dasar': None, 'faktor_pengali_wbp': 'N',
     'wbp_rumus': 'WBP dan LWBP = N x 1.644,52', 'dasar_rp_per_kwh': 1644.52, 'kvarh_rp_per_kvarh': None, 'kvarh_rumus': 'N x 1.644,52', 'pra_bayar_rp_per_kwh': None, 'rekening_minimum': None, 'src': S, 'st': 'sumber'},
]

def main():
    ids = {s['id'] for s in SUMBER}
    gagal = [f"golongan {g['no']}: src {g['src']} tak ada" for g in GOL if g['src'] not in ids]
    for kode in ('R-1/TR', 'R-2/TR', 'R-3/TR, TM', 'B-2/TR', 'B-3/TM, TT', 'I-3/TM', 'I-4/TT', 'P-1/TR'):
        if not any(g['kode'] == kode for g in GOL): gagal.append('golongan wajib hilang: ' + kode)
    if gagal: print('GAGAL', gagal); sys.exit(1)
    out = {'meta': {'judul': 'Tarif tenaga listrik PLN per golongan (non-subsidi, reguler) berlaku Oktober-Desember 2026 (Triwulan IV 2026)', 'dibuat_oleh': 'scripts/panen/tarif_kurasi.py', 'tanggal_baca': BACA, 'tingkat_bukti': 'sumber',
                    'berlaku': {'tahun': 2026, 'triwulan': 4, 'dari': '2026-10-01', 'sampai': '2026-12-31', 'ditetapkan_pln': '2026-10-22',
                                'catatan': 'Judul dokumen: "Bulan Oktober - Desember 2026". Siaran pers PLN 14 Okt 2026 menyatakan tarif tetap (tidak naik) dibanding triwulan sebelumnya; tarif Triwulan III 2026 juga tetap (ESDM 30 Jun 2026).'},
                    'dasar_hukum': 'Peraturan Menteri ESDM No. 7 Tahun 2024 tentang Tarif Tenaga Listrik yang Disediakan oleh PT PLN (Persero), penyesuaian tiap tiga bulan untuk 13 golongan non-subsidi (kurs, ICP, inflasi, HBA). Teks peraturannya tidak dibuka.',
                    'satuan': {'rp_per_kwh': 'Rp/kWh', 'kvarh_rp_per_kvarh': 'Rp/kVArh', 'pra_bayar_rp_per_kwh': 'Rp/kWh (token)'},
                    'skema': {'sumber[]': '{id, jenis, judul, penerbit, url, tanggal_terbit, tanggal_baca, lisensi, catatan}',
                              'golongan[]': '{no, kode, golongan(nama umum, bukan istilah dokumen), batas_daya, bentuk(reguler|blok), rp_per_kwh | lwbp_rp_per_kwh + wbp_rumus + faktor_pengali_wbp, kvarh_rp_per_kvarh, pra_bayar_rp_per_kwh, rekening_minimum, src, st}'},
                    'catatan': 'WBP = waktu beban puncak, LWBP = luar WBP; K = faktor pembanding WBP terhadap LWBP (1,4 <= K <= 2) ditetapkan Direksi PLN per sistem setempat, nilainya tidak ada di dokumen. N pada golongan L juga faktor yang tidak dijabarkan di dokumen. Biaya kVArh dikenakan bila faktor daya rata-rata bulanan di bawah 0,85. Kolom "golongan" (nama umum) ditambahkan kurator dari kode tarif, bukan dari dokumen yang hanya memuat kode.',
                    'celah': ['Tarif 24 golongan bersubsidi (mis. R-1 450 VA, R-1 900 VA subsidi, S, U, I-1, B-1) tidak ada di dokumen dan tidak dikutip; sumber hanya menyatakan tarifnya tetap.',
                              'Biaya beban (Rp/kVA/bulan) hanya bertanda rekening minimum di dokumen; angkanya tidak tertulis.',
                              'Tarif rata-rata per golongan atau nasional (Rp/kWh) tidak terbit dalam dokumen ini; angka biaya pokok penyediaan (BPP) ada di sistem_pln/statistik, bukan di sini.',
                              'Riwayat tarif triwulan sebelumnya tidak dikutip kecuali pernyataan ESDM bahwa penyesuaian terakhir R-2, R-3, P-1, P-2, P-3 terjadi pada Triwulan III 2022 dan golongan lain pada 2020 (ESDM-PR-2025-077).',
                              'PDF sumber berupa pindai gambar; angka dibaca dari gambar resolusi 150 dan 230 dpi dan diperiksa dua kali, bukan dari lapisan teks.'],
                    'jumlah_golongan': len(GOL)},
           'sumber': SUMBER, 'golongan': GOL}
    dst = os.path.join(AKAR, 'data/kembaran/tarif.json')
    open(dst, 'w', encoding='utf-8').write(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
    print(dst, len(GOL), 'golongan,', len(SUMBER), 'sumber')

main()
