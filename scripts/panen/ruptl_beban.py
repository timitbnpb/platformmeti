#!/usr/bin/env python3
"""Ekstrak proyeksi kebutuhan energi dan beban puncak RUPTL PLN 2025-2034 ke data/kembaran/ruptl_beban.json.
Tiga lapis, semuanya angka tertulis di sumber (RUPTL-2025, url di data/kembaran/terbitan.json):
  wilayah  : Tabel 5.67-5.72 (penjualan GWh per kelompok pelanggan) + Tabel 5.73 (beban puncak non-coincident MW)
  sistem   : Tabel 5.82-5.125 Neraca Daya, bagian "1. KEBUTUHAN" (penjualan, produksi, faktor beban, beban puncak), RE Base dan ARED
  provinsi : Tabel x.8 "Proyeksi Kebutuhan Tenaga Listrik" tiap lampiran A1-A15, B1-B7, C1-C12 (penjualan, produksi, beban puncak, pelanggan)
Mentah di luar repo: <MENTAH>/ruptl.pdf, dibaca `pdftotext -layout`. Hanya stdlib + pdftotext. Angka Indonesia: titik = ribuan, koma = desimal.
Yang gagal diurai atau tak lolos cek dicatat di `gagal`, tidak ditebak. Pakai: python3 scripts/panen/ruptl_beban.py [--mentah=DIR] [--teks=berkas.txt]
"""
import json, os, re, subprocess, sys

AKAR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MENTAH = next((a[9:] for a in sys.argv if a.startswith('--mentah=')), os.path.expanduser('~/Developer/platformmeti-mentah/kj16'))
TEKS = next((a[7:] for a in sys.argv if a.startswith('--teks=')), None)
TGL_BACA = '2026-11-25'
TAHUN = list(range(2025, 2035))

if TEKS: teks = open(TEKS, encoding='utf-8').read()
else: teks = subprocess.run(['pdftotext', '-layout', os.path.join(MENTAH, 'ruptl.pdf'), '-'], capture_output=True, text=True, check=True).stdout
baris = teks.split('\n')
hal, h = [], 1
for b in baris:
    h += b.count('\f'); hal.append(h)

NUM = r'-|\d[\d.]*(?:,\d+)?%?'
def angka(s):
    s = s.rstrip('%')
    return 0 if s == '-' else float(s.replace('.', '').replace(',', '.'))
def angka_baris(s):
    return [angka(t) for t in re.findall(NUM, s)]
def satuan(v): return int(v) if v == int(v) else v

gagal = []

# ---------------- wilayah: Tabel 5.67-5.73
wilayah = {}
NAMA_W = {'5.67': 'Indonesia', '5.68': 'Sumatera', '5.69': 'Jawa-Madura-Bali', '5.70': 'Kalimantan', '5.71': 'Sulawesi', '5.72': 'Maluku, Papua dan Nusa Tenggara'}
for i, b in enumerate(baris):
    m = re.match(r'^\s*Tabel (5\.6[7-9]|5\.7[0-2]) Proyeksi Penjualan', b)
    if not m or i < 21000: continue
    k = m.group(1); isi = {}
    for j in range(i + 1, i + 30):
        if re.match(r'^\s*(Tabel|Gambar)\b', baris[j]): break
        r = re.match(r'^\s*(Rumah Tangga|Bisnis|Publik|Industri|Total|Pertumbuhan \(%\))((?:\s+(?:' + NUM + r')){10})\s*$', baris[j])
        if r: isi[r.group(1)] = angka_baris(r.group(2))
    if 'Total' not in isi: gagal.append({'tabel': k, 'alasan': 'baris Total tak terbaca', 'hal': hal[i]}); continue
    kel = [isi[x] for x in ('Rumah Tangga', 'Bisnis', 'Publik', 'Industri') if x in isi]
    sal = [f'{TAHUN[t]}: jumlah {sum(v[t] for v in kel):g} != total {isi["Total"][t]:g}' for t in range(10) if abs(sum(v[t] for v in kel) - isi['Total'][t]) > 1.01]
    if sal: gagal.append({'tabel': k, 'alasan': 'jumlah kelompok pelanggan tak cocok total (angka sumber dipertahankan): ' + '; '.join(sal), 'hal': hal[i]})
    wilayah[NAMA_W[k]] = {'penjualan_gwh': {'rumah_tangga': isi.get('Rumah Tangga'), 'bisnis': isi.get('Bisnis'), 'publik': isi.get('Publik'), 'industri': isi.get('Industri'), 'total': isi['Total']},
                          'pertumbuhan_pct': isi.get('Pertumbuhan (%)'), 'sumber_tabel': f'Tabel {k} (hal. PDF {hal[i]})'}
beban_w = None
for i, b in enumerate(baris):
    if re.match(r'^\s*Tabel 5\.73 Proyeksi Beban Puncak', b) and i > 21000:
        beban_w = {}
        for j in range(i + 1, i + 14):
            r = re.match(r'^\s*(Sumatera|Jawa, Madura, Bali|Kalimantan|Sulawesi|Holding)((?:\s+(?:' + NUM + r')){10})\s*$', baris[j])
            if r: beban_w[r.group(1)] = angka_baris(r.group(2))
            elif re.match(r'^\s*Maluku, Papua, Nusa\s*$', baris[j]):  # label terpecah: angka di baris berikutnya, "Tenggara" di baris sesudahnya
                r2 = re.match(r'^\s*((?:(?:' + NUM + r')\s+){9}(?:' + NUM + r'))\s*$', baris[j + 1])
                if r2: beban_w['Maluku, Papua, Nusa Tenggara'] = angka_baris(r2.group(1))
        pt = hal[i]; break
if beban_w:
    peta = {'Sumatera': 'Sumatera', 'Jawa, Madura, Bali': 'Jawa-Madura-Bali', 'Kalimantan': 'Kalimantan', 'Sulawesi': 'Sulawesi', 'Maluku, Papua, Nusa Tenggara': 'Maluku, Papua dan Nusa Tenggara'}
    for k, v in peta.items():
        if k in beban_w and v in wilayah: wilayah[v]['beban_puncak_noncoincident_mw'] = beban_w[k]
        else: gagal.append({'tabel': '5.73', 'alasan': f'baris {k} tak terbaca'})
    if 'Holding' in beban_w:
        wilayah['Indonesia']['beban_puncak_noncoincident_mw'] = beban_w['Holding']
    for v in wilayah.values():
        if 'beban_puncak_noncoincident_mw' in v: v['sumber_tabel'] += f'; beban puncak Tabel 5.73 (hal. PDF {pt})'
else: gagal.append({'tabel': '5.73', 'alasan': 'tabel tak ditemukan'})

# ---------------- sistem: Neraca Daya
sistem = []
TITEL = re.compile(r'^\s*Tabel (5\.(?:8[2-9]|9[0-9]|1[0-2][0-9])) Neraca Daya Sistem (.+?) Tahun 2025-2034\s*[-–(]*\s*\(?(?:Skenario )?(RE Base|ARED)\)?\s*$')
BARIS_S = re.compile(r'^\s*[a-g]\.\s+(.+?)\s{2,}(GWh|MW|%)((?:\s+(?:' + NUM + r')){10})\s*$')
for i, b in enumerate(baris):
    m = TITEL.match(b)
    if not m or i < 22000: continue
    tb, nama, skn = m.groups(); isi = {}
    # judul Timor dengan Kupang Baru memuat frasa tambahan; tetap dicatat apa adanya
    for j in range(i + 1, i + 40):
        if re.match(r'^\s*2\.\s+PASOKAN', baris[j]): break
        r = BARIS_S.match(baris[j])
        if not r: continue
        lab = r.group(1).strip(); v = angka_baris(r.group(3))
        if re.match(r'Penjualan$', lab): isi['penjualan_gwh'] = v
        elif re.match(r'Pertumbuhan Penjualan|Pertumbuhan demand', lab): isi['pertumbuhan_penjualan_pct'] = v
        elif re.match(r'Produksi$', lab): isi['produksi_gwh'] = v
        elif re.match(r'Faktor Beban', lab): isi['faktor_beban_pct'] = v
        elif re.match(r'Beban Puncak \(?Bruto', lab): isi['beban_puncak_bruto_mw'] = v
        elif re.match(r'Beban Puncak Neto$', lab): isi['beban_puncak_neto_mw'] = v
        elif re.match(r'Pertumbuhan Beban Puncak', lab): isi['pertumbuhan_beban_puncak_pct'] = v
    wajib = ['penjualan_gwh', 'produksi_gwh', 'beban_puncak_neto_mw']
    miss = [x for x in wajib if x not in isi]
    if miss: gagal.append({'tabel': tb, 'alasan': 'baris tak terbaca: ' + ', '.join(miss), 'hal': hal[i]})
    if all(x in isi for x in wajib[:2]):
        bad = [TAHUN[t] for t in range(10) if isi['penjualan_gwh'][t] > isi['produksi_gwh'][t]]
        if bad: gagal.append({'tabel': tb, 'alasan': 'penjualan > produksi pada ' + ', '.join(map(str, bad)) + ' (angka sumber dipertahankan)', 'hal': hal[i]})
    if 'beban_puncak_bruto_mw' in isi and 'beban_puncak_neto_mw' in isi:
        bad = [TAHUN[t] for t in range(10) if isi['beban_puncak_neto_mw'][t] > isi['beban_puncak_bruto_mw'][t]]
        if bad: gagal.append({'tabel': tb, 'alasan': 'beban puncak neto > bruto pada ' + ', '.join(map(str, bad)), 'hal': hal[i]})
    sistem.append({'nama': nama.strip(), 'skenario': skn, 'judul_tabel': b.strip(), 'sumber_tabel': f'Tabel {tb} (hal. PDF {hal[i]})', **isi})

# ---------------- provinsi: Tabel x.8
jar = json.load(open(os.path.join(AKAR, 'data/kembaran/ruptl_jaringan.json'), encoding='utf-8'))['provinsi']
PETA = {p['lampiran']: p for p in jar}  # lampiran -> kode/nama (sudah dipetakan ke public/data/wilayah.json di ruptl_jaringan.py)
T8 = re.compile(r'^\s*Tabel ([ABC]\d+)\.([78])\.?\s+Proyeksi Kebutuhan Tenaga Listrik')
BR = re.compile(r'^\s*(20[23]\d)\s+(' + NUM + r')\s+(' + NUM + r')\s+(' + NUM + r')\s+(' + NUM + r')\s+(\d[\d.]*)\s*$')
provinsi, ada = [], set()
for i, b in enumerate(baris):
    m = T8.match(b)
    if not m or i < 35000: continue
    lamp, no = m.groups()
    if lamp in ada or (lamp[0] != 'B' and no != '8') or (lamp == 'B5' and no != '7') or (lamp != 'B5' and no != '8'): continue
    urut = []
    for j in range(i + 1, i + 40):
        if re.match(r'^\s*(Tabel|Gambar)\b', baris[j]) and j > i + 1: break
        r = BR.match(baris[j])
        if r: urut.append((int(r.group(1)), [angka(g) for g in r.groups()[1:]]))
    ada.add(lamp)
    label = [t for t, _ in urut]; catat = None
    if label == [2024] + TAHUN or label == TAHUN: thn = dict(urut)
    elif len(urut) == 10:  # label tahun sumber salah ketik: baca urutan baris sebagai 2025-2034, catat
        thn = {t: v for t, (_, v) in zip(TAHUN, urut)}
        catat = 'label tahun di sumber: ' + ','.join(map(str, label)) + '; dibaca berurutan sebagai 2025-2034'
        if label[0] == 2024: catat += ' (baris pertama 7.899 GWh = 7,8% di atas prognosa 2024 7.327 GWh pada Tabel B7.1, jadi baris itu 2025)'
        gagal.append({'tabel': f'{lamp}.{no}', 'alasan': catat, 'hal': hal[i]})
    else: gagal.append({'tabel': f'{lamp}.{no}', 'alasan': 'tahun terbaca: ' + ','.join(map(str, label)), 'hal': hal[i]}); continue
    pj = PETA.get(lamp)
    if not pj: gagal.append({'tabel': f'{lamp}.{no}', 'alasan': 'lampiran tak ada di ruptl_jaringan.json'}); continue
    bad = [t for t in TAHUN if thn[t][1] > thn[t][2]]
    if bad: gagal.append({'tabel': f'{lamp}.{no}', 'alasan': 'penjualan > produksi pada ' + ', '.join(map(str, bad)) + ' (angka sumber dipertahankan)', 'hal': hal[i]})
    o = {'lampiran': lamp, 'nama': pj['nama'], 'pertumbuhan_ekonomi_pct': [thn[t][0] for t in TAHUN], 'penjualan_gwh': [thn[t][1] for t in TAHUN],
         'produksi_gwh': [thn[t][2] for t in TAHUN], 'beban_puncak_mw': [thn[t][3] for t in TAHUN], 'pelanggan': [thn[t][4] for t in TAHUN],
         'sumber_tabel': f'Tabel {lamp}.{no} (hal. PDF {hal[i]})'}
    if catat: o['catatan'] = catat
    if 2024 in thn: o['realisasi_2024'] = {'penjualan_gwh': thn[2024][1], 'produksi_gwh': thn[2024][2], 'beban_puncak_mw': thn[2024][3], 'pelanggan': thn[2024][4]}
    for k in ('kode', 'kode_gabungan'):
        if k in pj: o[k] = pj[k]
    provinsi.append(o)
for l in PETA:
    if l not in ada: gagal.append({'tabel': l, 'alasan': 'tabel proyeksi kebutuhan tak ditemukan'})
provinsi.sort(key=lambda p: (p['lampiran'][0], int(p['lampiran'][1:])))

# cek silang: jumlah penjualan provinsi per pulau vs Tabel 5.68-5.72 (2025)
PULAU = {'Sumatera': 'A', 'Jawa-Madura-Bali': 'B'}
silang = []
for pl, hf in PULAU.items():
    if pl in wilayah:
        js = sum(p['penjualan_gwh'][0] for p in provinsi if p['lampiran'][0] == hf and int(p['lampiran'][1:]) <= (10 if hf == 'A' else 99))
        silang.append({'wilayah': pl, 'tahun': 2025, 'jumlah_provinsi_gwh': js, 'tabel_wilayah_gwh': wilayah[pl]['penjualan_gwh']['total'][0], 'catatan': 'jumlah penjualan lampiran A1-A10 (Sumatera) atau B1-B7 (Jawa-Madura-Bali) dibanding total Tabel 5.68/5.69'})

out = {'meta': {
    'sumber': 'RUPTL-2025', 'judul': 'RUPTL PT PLN (Persero) 2025-2034: proyeksi kebutuhan energi dan beban puncak per wilayah, sistem, dan provinsi',
    'diambil': TGL_BACA, 'tahun': TAHUN,
    'skema': {'wilayah': '{nama: {penjualan_gwh{rumah_tangga,bisnis,publik,industri,total}, pertumbuhan_pct, beban_puncak_noncoincident_mw, sumber_tabel}} 10 angka per deret (2025-2034)',
              'sistem[]': '{nama, skenario(RE Base|ARED), penjualan_gwh, produksi_gwh, faktor_beban_pct, beban_puncak_bruto_mw|null, beban_puncak_neto_mw, pertumbuhan_*_pct, sumber_tabel} 10 angka per deret',
              'provinsi[]': '{lampiran, kode|kode_gabungan, nama[], pertumbuhan_ekonomi_pct, penjualan_gwh, produksi_gwh, beban_puncak_mw, pelanggan, realisasi_2024?, sumber_tabel}'},
    'satuan': {'penjualan_gwh': 'GWh', 'produksi_gwh': 'GWh', 'beban_puncak_mw': 'MW', 'pelanggan': 'pelanggan'},
    'catatan': 'Lapis wilayah dari Bab V.4 (Tabel 5.67-5.73); lapis sistem dari bagian KEBUTUHAN tiap Tabel Neraca Daya 5.82-5.125 (beberapa sistem hanya memuat beban puncak neto, ada yang membulatkan persen ke bilangan bulat, sesuai sumber); lapis provinsi dari Tabel x.8 tiap lampiran (B5 = Tabel B5.7). Beban puncak non-coincident wilayah bukan jumlah beban puncak sistem. Lampiran gabungan Papua (C9, C10) tak dipecah per provinsi. Bagian 2024 hanya ada bila tabel sumber memuatnya.',
    'cek_silang_penjualan': silang, 'jumlah_sistem': len(sistem), 'jumlah_provinsi': len(provinsi)},
    'wilayah': wilayah, 'sistem': sistem, 'provinsi': provinsi, 'gagal': gagal}
dst = os.path.join(AKAR, 'data/kembaran/ruptl_beban.json')
open(dst, 'w', encoding='utf-8').write(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
print(dst, len(wilayah), 'wilayah,', len(sistem), 'sistem,', len(provinsi), 'provinsi,', len(gagal), 'gagal')
for g in gagal: print(' GAGAL', g)
