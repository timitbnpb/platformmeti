#!/usr/bin/env python3
"""Ekstrak rencana transmisi (kms) dan gardu induk (MVA) per provinsi dari Lampiran A-C RUPTL PLN 2025-2034
(skenario RE Base) ke data/kembaran/ruptl_jaringan.json. Sumber: RUPTL-2025 (url di data/kembaran/terbitan.json).

Mentah (di luar repo): <MENTAH>/ruptl.pdf, dibaca dengan `pdftotext -layout`. Hanya stdlib + pdftotext. Beban puncak per sistem TIDAK diekstrak (kalimatnya tak selalu menyebut provinsi; sudah ada di terbitan.json angka_pln).
Tabel "Rekapitulasi Rencana Pembangunan ... Skenario RE Base" per provinsi; baris yang gagal diurai atau tak
lolos pemeriksaan jumlah dicatat di `gagal`, tidak ditebak. Angka Indonesia: titik = ribuan, koma = desimal.
Pakai: python3 scripts/panen/ruptl_jaringan.py [--mentah=DIR] [--teks=berkas.txt]
"""
import json, os, re, subprocess, sys

AKAR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MENTAH = next((a[9:] for a in sys.argv if a.startswith('--mentah=')), os.path.expanduser('~/Developer/platformmeti-mentah/kj16'))
TEKS = next((a[7:] for a in sys.argv if a.startswith('--teks=')), None)
TGL_BACA = '2026-11-25'
TAHUN = list(range(2025, 2035))

WIL = json.load(open(os.path.join(AKAR, 'public/data/wilayah.json'), encoding='utf-8'))['baris']
def norma(s): return re.sub(r'[^a-z]', '', s.lower())
PROV = {norma(b['nama']): b['kode'] for b in WIL}
ALIAS = {'diyogyakarta': '34', 'didiyogyakarta': '34', 'daerahistimewayogyakarta': '34', 'dkijakarta': '31',
         'kepulauanbangkabelitung': '19', 'kepulauanriau': '21'}
def kode_prov(n):
    n = norma(n)
    return ALIAS.get(n) or PROV.get(n)

if TEKS: teks = open(TEKS, encoding='utf-8').read()
else: teks = subprocess.run(['pdftotext', '-layout', os.path.join(MENTAH, 'ruptl.pdf'), '-'], capture_output=True, text=True, check=True).stdout
baris = teks.split('\n')
# halaman PDF per baris (form feed = pindah halaman)
hal, h = [], 1
for b in baris:
    h += b.count('\f'); hal.append(h)

# ---- lampiran -> provinsi
LAMP = {}  # 'A1' -> [nama, ...]
for i, b in enumerate(baris):
    m = re.match(r'^(A\d+)\.\s+PROVINSI\s+(.+?)\s*$', b)
    if m and 35000 < i < 35300: LAMP[m.group(1)] = [m.group(2).title()]
    m = re.match(r'^\s*LAMPIRAN ([BC])\.(\d+)\s*$', b)
    if m:
        blok = ' '.join(x.strip() for x in baris[i + 1:i + 7])
        mm = re.search(r'DI PROVINSI (.+?)(?:\s+[BC]\d+\.\d+|$)', blok)
        if mm: LAMP[m.group(1) + m.group(2)] = [p.strip() for p in re.split(r',| DAN ', re.sub(r'\s*\((DIY|DKI)\)', '', mm.group(1)).replace('DAN PAPUA\n', '')) if p.strip()]
# gabungan Papua: nama yang terpotong antar baris ("PAPUA" + "SELATAN") dirakit tangan dari judul lampiran
LAMP['C9'] = ['Papua', 'Papua Pegunungan', 'Papua Tengah', 'Papua Selatan']
LAMP['C10'] = ['Papua Barat', 'Papua Barat Daya']
LAMP = {k: [{'DKI Jakarta': 'DKI Jakarta', 'Daerah Khusus Ibukota (Dki) Jakarta': 'DKI Jakarta'}.get(n, n) for n in v] for k, v in LAMP.items()}

TITEL = re.compile(r'^\s*Tabel ([ABC]\d+)\.(\d+)(?:\.[ab])?\.?\s+Rekapitulasi (?:Rincian )?Rencana (?:Pembangunan|Pengembangan) (?:Jaringan )?(Transmisi|Gardu Induk|GI 150 kV)')
BARIS = re.compile(r'^\s*([\d/]+\s?kV(?:\s?AC/DC)?\*?|[\d/]+\*?|Jumlah|Total)((?:\s+(?:-|\d[\d.]*(?:,\d+)?\*?)){1,11})\s*$')
TOK = re.compile(r'-|\d[\d.]*(?:,\d+)?\*?')
def angka(s): return 0 if s == '-' else float(s.replace('.', '').replace(',', '.'))
def kunci(l):
    l = re.sub(r'\s*kV|\*', '', l.strip()); return 'total' if l in ('Jumlah', 'Total') else l.replace(' AC/DC', ' AC/DC')

hasil, gagal = {}, []
for i, b in enumerate(baris):
    m = TITEL.match(b)
    if not m: continue
    judul = b + ' ' + baris[i + 1]
    if 'RE Base' not in judul or 'ARED' in judul: continue
    lamp, no, jenis = m.group(1), m.group(2), 'kms' if m.group(3) == 'Transmisi' else 'mva'
    if lamp not in LAMP: gagal.append({'tabel': f'{lamp}.{no}', 'alasan': 'lampiran tak dikenal'}); continue
    mentah, refs, seg = [], {}, 0
    for j in range(i + 1, min(i + 45, len(baris))):
        if re.match(r'^\s*(Tabel|Gambar)\b', baris[j]) and j > i + 1: break
        hd = [x.end() for x in re.finditer(r'20[23]\d', baris[j])]
        if len(hd) >= 10 and not BARIS.match(baris[j]): seg += 1; refs[seg] = ('hdr', hd + [len(baris[j].rstrip())]); continue  # header (diulang tiap halaman)
        r = BARIS.match(baris[j])
        if not r: continue
        ts = [(x.group().rstrip('*'), r.start(2) + x.end()) for x in TOK.finditer(r.group(2))]
        mentah.append((kunci(r.group(1)), ts, '*' in r.group(2), seg))
        if len(ts) == 11 and refs.get(seg, ('',))[0] != 'baris': refs[seg] = ('baris', [e for _, e in ts])
    isi, bintang = {}, False
    for k, ts, bt, sg in mentah:
        ref = refs.get(sg, (0, None))[1]
        bintang |= bt
        if len(ts) == 11: isi[k] = [angka(t) for t, _ in ts]; continue
        if ref is None: gagal.append({'tabel': f'{lamp}.{no}', 'alasan': f'baris {k} berisi sel kosong tanpa baris acuan kolom', 'hal': hal[i]}); continue
        v, pakai = [0.0] * 11, set()
        for t, e in ts:
            c = min(range(11), key=lambda q: abs(ref[q] - e))
            if c in pakai: gagal.append({'tabel': f'{lamp}.{no}', 'alasan': f'baris {k}: dua angka jatuh ke kolom yang sama', 'hal': hal[i]})
            pakai.add(c); v[c] = angka(t)
        isi[k] = v  # sel kosong di sumber dibaca 0 (sama dengan "-")
    kel = hasil.setdefault(lamp, {'nama': LAMP[lamp], 'kms': None, 'mva': None, 'tabel': {}})
    if 'total' not in isi: gagal.append({'tabel': f'{lamp}.{no}', 'alasan': 'baris total tak terbaca', 'hal': hal[i]}); continue
    if kel[jenis] is not None: gagal.append({'tabel': f'{lamp}.{no}', 'alasan': 'tabel RE Base ganda', 'hal': hal[i]}); continue
    # cek: tiap baris tahun-jumlah = kolom total; kolom tahun = baris total (toleransi 1: pembulatan "107,8" vs "108")
    sal = []
    for k, v in isi.items():
        if abs(sum(v[:10]) - v[10]) > 1.01: sal.append(f'baris {k}: jumlah tahun {sum(v[:10]):g} != {v[10]:g}')
    ks = [v for k, v in isi.items() if k != 'total']
    for t in range(11):
        if abs(sum(v[t] for v in ks) - isi['total'][t]) > 1.01: sal.append(f'kolom {(TAHUN + ["total"])[t]}: jumlah {sum(v[t] for v in ks):g} != total {isi["total"][t]:g}')
    if sal: gagal.append({'tabel': f'{lamp}.{no}', 'alasan': 'jumlah tak cocok dengan baris total (angka sumber, tidak diubah): ' + '; '.join(sal), 'hal': hal[i]})
    kel[jenis] = isi; kel['tabel'][jenis] = f'Tabel {lamp}.{no} (hal. PDF {hal[i]})' + (' - total bertanda * (catatan sumber: tidak termasuk lingkup ISJ)' if bintang else '')

provinsi = []
for lamp in sorted(hasil, key=lambda x: (x[0], int(x[1:]))):
    o = hasil[lamp]; kodes = [kode_prov(n) for n in o['nama']]
    if any(k is None for k in kodes): gagal.append({'tabel': lamp, 'alasan': 'nama provinsi tak terpetakan: ' + ', '.join(o['nama'])}); continue
    for jenis in ('kms', 'mva'):
        if o[jenis] is None: gagal.append({'tabel': lamp, 'alasan': f'tabel {jenis} RE Base tak ditemukan'})
    provinsi.append({'lampiran': lamp, 'kode': kodes[0] if len(kodes) == 1 else None, 'kode_gabungan': kodes if len(kodes) > 1 else None, 'nama': o['nama'],
                     'kms': o['kms'], 'mva': o['mva'], 'sumber_tabel': o['tabel']})
for p in provinsi:
    for k in ('kode', 'kode_gabungan'):
        if p[k] is None: del p[k]
ada = {l for p in provinsi for l in [p['lampiran']]}
tanpa = sorted(l for l in LAMP if l not in hasil)
out = {'meta': {'sumber': 'RUPTL-2025', 'judul': 'RUPTL PT PLN (Persero) 2025-2034, Lampiran A-C: rekapitulasi rencana pembangunan transmisi dan gardu induk per provinsi, skenario RE Base',
                'diambil': TGL_BACA, 'skenario': 'RE Base', 'tahun': TAHUN, 'satuan': {'kms': 'kms (km sirkit)', 'mva': 'MVA'},
                'catatan': 'Tabel "Rekapitulasi Rencana Pembangunan Jaringan Transmisi/Gardu Induk Skenario RE Base" di tiap lampiran provinsi (A1-A15 Sumatera dan Kalimantan, B1-B7 Jawa-Madura-Bali, C1-C12 Sulawesi-Maluku-Papua-Nusa Tenggara); nomor tabel dan halaman PDF di sumber_tabel tiap provinsi. Nilai per baris: 10 angka (2025-2034) lalu total; kunci tegangan transmisi "500","275","150","70", gardu "150/20" dst. Lampiran gabungan Papua (C9, C10) tak dipecah per provinsi. Kolom "total" dibandingkan dengan jumlah baris; selisih dicatat di gagal, angka sumber dipertahankan.',
                'lampiran_tanpa_tabel': tanpa, 'jumlah_provinsi': len(provinsi)},
       'provinsi': provinsi, 'gagal': gagal}
dst = os.path.join(AKAR, 'data/kembaran/ruptl_jaringan.json')
open(dst, 'w', encoding='utf-8').write(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
print(dst, len(provinsi), 'lampiran,', len(gagal), 'gagal,')
for g in gagal: print(' GAGAL', g)
