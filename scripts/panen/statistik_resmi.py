#!/usr/bin/env python3
"""Ekstrak statistik resmi (Statistik PLN 2021-2024, Statistik Ketenagalistrikan ESDM, BPS var 859,
Faktor Emisi GRK Gatrik) dari berkas mentah ke data/kembaran/statistik.json.

Mentah (di luar repo): <MENTAH>/statistik/{pln,gatrik,bps}/. Unduh dilakukan terpisah (Wayback, API gatrik, BPS);
skrip ini hanya MEMBACA mentah. Hanya stdlib + pdftotext (poppler). Angka persis dari tabel; baris yang
gagal diurai dicatat di meta.celah, tidak ditebak.
Pakai: python3 scripts/panen/statistik_resmi.py [--mentah=DIR]
"""
import json, os, re, subprocess, sys, datetime

AKAR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MENTAH = next((a[9:] for a in sys.argv if a.startswith('--mentah=')), os.path.expanduser('~/Developer/platformmeti-mentah/statistik'))
TGL_BACA = '2026-11-25'
CELAH = []

# ---------- kode provinsi (kode repo = public/data/wilayah.json) ----------
WIL = json.load(open(os.path.join(AKAR, 'public/data/wilayah.json')))['baris']
def norma(s): return re.sub(r'[^a-z]', '', s.lower())
PROV = {norma(b['nama']): b['kode'] for b in WIL}
ALIAS = {'diyogyakarta': '34', 'didiyogyakarta': '34', 'daerahistimewayogyakarta': '34', 'yogyakarta': '34', 'dkijakarta': '31',
         'bangkabelitung': '19', 'kepbangkabelitung': '19', 'kepulauanbangkabelitung': '19', 'kepriau': '21', 'kepri': '21',
         'kalselteng': None, 'nusatenggarabarat': '52', 'ntb': '52', 'ntt': '53', 'jakartaraya': '31', 'jakarta': '31'}
def kode_prov(nama):
    n = norma(nama)
    if n in ALIAS: return ALIAS[n]
    return PROV.get(n)

# unit PLN yang persis satu provinsi (sub-baris "- Provinsi" dipakai bila ada)
UNIT_SATU = {'aceh': '11', 'sumaterautara': '12', 'sumaterabarat': '13', 'bangkabelitung': '19', 'lampung': '18', 'kalimantanbarat': '61',
             'bali': '51', 'nusatenggarabarat': '52', 'nusatenggaratimur': '53', 'jawatimur': '35', 'jawabarat': '32', 'banten': '36',
             'jakartaraya': '31', 'plnbatam': '21'}

# ---------- angka format Indonesia ----------
NUM = re.compile(r'^(-|-?\d{1,3}(\.\d{3})+(,\d+)?|-?\d+(,\d+)?|-?\d+\.\d{1,2})$')
def angka(t):
    if t == '-': return None
    if re.fullmatch(r'-?\d+\.\d{1,2}', t): return float(t)  # titik desimal nyasar (mis. 226.90 di PDF 2022)
    return float(t.replace('.', '').replace(',', '.'))
def jml(x):
    return None if x is None else (int(x) if x == int(x) and abs(x) < 1e15 else x)

def pdftext(pdf, layout=True):
    r = subprocess.run(['pdftotext'] + (['-layout'] if layout else []) + [pdf, '-'], capture_output=True, text=True)
    return r.stdout

# ---------- blok tabel Statistik PLN ----------
def blok(teks, no):
    """Baris-baris tabel 'Tabel <no> :' (kemunculan TERAKHIR = isi, bukan daftar isi) sampai 'Tabel N :' berikut."""
    L = teks.split('\n')
    idx = [i for i, g in enumerate(L) if re.match(r'^\s*Tabel(?:/Table)?\s+%d\s*:' % no, g, re.I)]
    if not idx: return None, None
    s = idx[-1]
    e = len(L)
    for j in range(s + 1, len(L)):
        if re.match(r'^\s*Tabel(?:/Table)?\s+\d+\s*:', L[j], re.I): e = j; break
    return L[s:e], L[s]

PREFIX = re.compile(r'^(UIW|UID|UIK|UIKL|UIP|UIP3B|UIT|UIPLN|PLN|PT|PJB|Unit|Proyek|Luar|Jawa|Indonesia|-|Sub|Jumlah|\*)', re.I)
def baris_pln(lines, n):
    """-> [{label, anak(bool), nilai[n]}]; label bertingkat digabung; yang tak pas n angka masuk gagal[]."""
    out, gagal, buf, prev = [], [], '', None
    for g in lines[1:]:
        t = g.strip()
        if not t or re.match(r'^(Statistik PLN|Statistics PLN|Unit PLN / PLN Units|Energy Sold|Number and Installed|Energy Production|Data Tahunan|\d+\s+Statistik PLN)', t) or re.search(r'Statistic[sk] PLN \d{4}\s*\d*$', t): continue
        tok = t.split()
        k = len(tok)
        while k > 0 and NUM.match(tok[k - 1]): k -= 1
        nums, label = tok[k:], ' '.join(tok[:k]).strip()
        # kolom satuan seperti "MVA" bukan angka, tidak ditangani di sini
        if not nums:
            if PREFIX.match(label) and not label.startswith('*'):
                if buf: buf += ' ' + label
                else: buf = label
            elif prev is not None and not re.match(r'^(Tabel|Satuan|Jam/|Kali/|\(|\*|Catatan|Rumah|Industri|Data)', label):
                prev['label'] += ' ' + label  # sambungan label baris sebelumnya
            continue
        if buf:
            label = (buf + ' ' + label).strip(); buf = ''
        elif not PREFIX.match(label) and prev is not None:
            prev['label'] += ' ' + label
            continue
        anak = label.startswith('- ')
        r = {'label': label[2:].strip() if anak else label, 'anak': anak, 'nilai': nums}
        if len(nums) != n:
            gagal.append((r['label'], len(nums)))
            prev = None
            continue
        r['nilai'] = [angka(x) for x in nums]
        out.append(r); prev = r
    return out, gagal

def rapikan(label):
    return re.sub(r'\s+', ' ', re.sub(r'\bU(i)(w|d|k|kl|p|t)\b', lambda m: 'UI' + m.group(2).upper(), label, flags=re.I).replace('Pln ', 'PLN ')).replace(', dan', ' dan').replace(',', ', ').replace(',  ', ', ').strip()
def kunci_label(label):
    return norma(re.sub(r'^(UIW|UID|PT)\s+', '', label, flags=re.I))

def petakan(baris):
    """Tambah 'unit' (induk), 'prov' (kode atau None). Unit tanpa anak dan satu-provinsi diberi kodenya."""
    res = []
    for i, r in enumerate(baris):
        r['label'] = re.sub(r'\s*\(%\)$|\s+%$', '', rapikan(r['label']))
        if r['anak']:
            r['prov'] = kode_prov(r['label'])
            r['unit'] = res[-1]['unit'] if res and not res[-1]['anak'] else (res[-1]['unit'] if res else None)
        else:
            r['unit'] = r['label']
            ada_anak = i + 1 < len(baris) and baris[i + 1]['anak']
            r['prov'] = None if ada_anak else UNIT_SATU.get(kunci_label(r['label']))
            r['induk'] = ada_anak
        r['tingkat'] = 'provinsi' if r['prov'] else ('induk' if r.get('induk') else 'unit')
        res.append(r)
    return res

def induk_dengan_anak(baris):
    s = set()
    for r in baris:
        if r['anak']: s.add(r['unit'])
    return s

# ---------- ekstrak per tahun ----------
PLN = {}
def muat_pln():
    for th in (2021, 2022, 2023, 2024):
        f = os.path.join(MENTAH, 'pln', 'pln-%d.pdf' % th)
        if os.path.exists(f) and os.path.getsize(f) > 100000:
            t = pdftext(f)
            if len(t) > 50000: PLN[th] = t
            else: CELAH.append('Statistik PLN %d: PDF tidak terbaca/terpotong (teks %d byte).' % (th, len(t)))
        elif th == 2024: CELAH.append('Statistik PLN 2024: satu-satunya snapshot Wayback (20260212164311) terpotong crawler di 5.242.880 dari 8.503.625 byte (36 halaman utuh, tanpa xref/pohon halaman); qpdf dan pdftotext gagal memulihkan. Tidak ada angka PLN 2024 (SAIDI, MVA, beban puncak, penjualan per unit); ulangi bila ada snapshot utuh. Penjualan 2024 ada dari BPS-859-2024.')
        else: CELAH.append('Statistik PLN %d: berkas mentah belum ada/terpotong.' % th)

KV = ['500', '275', '150', '70', '<30']
def ekstrak_pln(th):
    t = PLN[th]; src = 'PLN-STAT-%d' % th
    r = {k: [] for k in ('penjualan', 'produksi', 'beban', 'saidi', 'mva')}
    def ambil(no, n, nama, potong=None):
        b, judul = blok(t, no)
        if b is not None and potong:
            c = [i for i, g in enumerate(b) if potong in g]
            if c: b = b[:c[0]]
        if b is None: CELAH.append('PLN %d Tabel %d (%s): tabel tidak ditemukan.' % (th, no, nama)); return []
        rows, gagal = baris_pln(b, n)
        for lab, c in gagal: CELAH.append('PLN %d Tabel %d (%s): baris "%s" punya %d angka (harus %d), dilewati.' % (th, no, nama, lab[:50], c, n))
        return petakan(rows)
    NOMOR = NOMOR_TABEL[th]
    # penjualan per kelompok (GWh): RT, Industri, Bisnis, Sosial, GdgKantor, PJU, Jumlah, %
    JK = ['rumah_tangga', 'industri', 'bisnis', 'sosial', 'gedung_kantor_pemerintah', 'penerangan_jalan'] + (['lainnya_tcl'] if NOMOR.get('jual_n', 8) == 9 else [])
    for x in ambil(NOMOR['jual'], NOMOR.get('jual_n', 8), 'energi terjual'):
        r['penjualan'].append({'tahun': th, 'tingkat': x['tingkat'], 'prov_kode': x['prov'], 'unit': x['unit'] if not x['anak'] else x['unit'], 'baris': x['label'], 'gwh': jml(x['nilai'][len(JK)]),
                               'per_kelompok_gwh': dict(zip(JK, [jml(v) for v in x['nilai'][:len(JK)]])),
                               'src': src, 'st': 'sumber', 'catatan': 'Statistik PLN %d Tabel %d, kolom Jumlah (GWh)' % (th, NOMOR['jual'])})
    for x in ambil(NOMOR['neraca'], 3, 'neraca daya'):
        r['beban'].append({'tahun': th, 'tingkat': x['tingkat'], 'sistem_pln': x['label'], 'unit': x['unit'], 'prov_kode': x['prov'], 'mw': jml(x['nilai'][2]),
                           'kapasitas_terpasang_mw': jml(x['nilai'][0]), 'daya_mampu_mw': jml(x['nilai'][1]), 'src': src, 'st': 'sumber',
                           'catatan': 'Statistik PLN %d Tabel %d Neraca Daya, kolom Beban Puncak (MW); beban puncak per unit PLN, tidak dijumlahkan; kapasitas = milik PLN, sewa, IPP' % (th, NOMOR['neraca'])})
    for x in ambil(NOMOR['saidi'], 2, 'SAIDI SAIFI', NOMOR.get('saidi_potong')):
        r['saidi'].append({'tahun': th, 'tingkat': x['tingkat'], 'unit': x['unit'], 'baris': x['label'], 'prov_kode': x['prov'], 'saidi_jam': jml(x['nilai'][0]), 'saifi_kali': jml(x['nilai'][1]), 'src': src, 'st': 'sumber',
                           'catatan': 'Statistik PLN %d Tabel %d, jam atau kali per pelanggan' % (th, NOMOR['saidi'])})
    for x in ambil(NOMOR['trafo'], 12, 'trafo gardu induk'):
        v = x['nilai']
        for i, kv in enumerate(KV):
            u, m = v[2 * i], v[2 * i + 1]
            if u or m:
                r['mva'].append({'tahun': th, 'tingkat': x['tingkat'], 'prov_kode': x['prov'], 'unit': x['unit'], 'baris': x['label'], 'kv': kv, 'unit_trafo': jml(u), 'mva': jml(m), 'src': src, 'st': 'sumber',
                                 'catatan': 'Statistik PLN %d Tabel %d Jumlah dan Daya Terpasang Trafo Gardu Induk' % (th, NOMOR['trafo'])})
    prod = ambil(NOMOR['prod'], NOMOR.get('prod_n', 10), 'produksi per jenis', 'Sewa Genset')
    JENIS = NOMOR.get('prod_jenis', ['PLTA', 'PLTM', 'PLTMH', 'PLTU', 'PLTG', 'PLTGU', 'PLTP', 'PLTD', 'PLTMG', 'PLTS'])
    for x in prod:
        for j, v in zip(JENIS, x['nilai']):
            if v is not None:
                r['produksi'].append({'tahun': th, 'tingkat': x['tingkat'], 'wilayah': x['label'], 'prov_kode': x['prov'], 'jenis': j, 'gwh': jml(v), 'src': src, 'st': 'sumber',
                                      'catatan': 'Statistik PLN %d Tabel %d, blok Produksi Sendiri (tanpa sewa genset dan pembelian)' % (th, NOMOR['prod'])})
    return r

NOMOR_TABEL = {th: {'jual': 6, 'neraca': 1, 'saidi': 16, 'trafo': 30, 'prod': 23} for th in (2021, 2022, 2023, 2024)}
# 2024: Tabel 6 punya kolom 'Lainnya (T,C,L)' (9 angka); Tabel 23 blok Produksi Sendiri halaman pertama hanya PLTA..PLTMG (kolom Surya/Bayu/Biomassa di blok halaman berikut tidak diambil)
NOMOR_TABEL[2024].update({'saidi_potong': 'Lama Gangguan', 'jual_n': 9, 'prod_n': 9, 'prod_jenis': ['PLTA', 'PLTM', 'PLTMH', 'PLTU', 'PLTG', 'PLTGU', 'PLTP', 'PLTD', 'PLTMG']})

# ---------- Faktor Emisi GRK (Gatrik) ----------
def fnum(t):
    t = t.strip()
    if re.fullmatch(r'N/A\*{0,3}|-', t): return None
    if re.fullmatch(r'\d+[.,]\d+', t): return float(t.replace(',', '.'))
    raise ValueError(t)
FNUM = re.compile(r'^(N/A\*{0,3}|-|\d+[.,]\d+)$')
FE_KOL = {  # kolom angka setelah provinsi, dari kiri
    2019: ['total_pembangkit', 'om', 'bm', 'cm', 'cm_ex_post_075', 'cm_ex_ante_050', 'cm_ex_ante_075'],
    2018: ['om', 'om_ex_ante', 'bm', 'cm', 'cm_ex_post_075', 'cm_ex_ante_050', 'cm_ex_ante_075'],
    2017: ['om', 'bm', 'cm', 'cm_ex_post_075', 'cm_ex_ante_050', 'cm_ex_ante_075'],
    2016: ['cm_ex_ante', 'cm'], 2015: ['cm_ex_ante', 'cm'],
}
def ekstrak_fe():
    out = []
    G = os.path.join(MENTAH, 'gatrik')
    for th, kol in FE_KOL.items():
        f = os.path.join(G, 'fe-%d.pdf' % th)
        if not os.path.exists(f): CELAH.append('Faktor emisi %d: berkas tidak ada.' % th); continue
        urut = []  # ('r', baris) atau ('p', nama provinsi) sesuai urutan di halaman
        for g in pdftext(f).split('\n'):
            m = re.match(r'^\s*(\d{1,3})\s+(\S.*)$', g)
            if not m:
                continue
            tok = m.group(2).split()
            k = len(tok); nilai = []
            # kolom jumlah pembangkit (bilangan bulat) hanya di 2019
            while k > 0 and len(nilai) < len(kol) and (FNUM.match(tok[k - 1]) or (th == 2019 and len(nilai) == len(kol) - 1 and re.fullmatch(r'\d+', tok[k - 1]))):
                nilai.insert(0, tok[k - 1]); k -= 1
            if len(nilai) != len(kol): continue
            bagian = [b for b in re.split(r'\s{2,}', m.group(2).rsplit(None, len(nilai))[0].strip() if len(tok) > len(nilai) else '') if b]
            nama = bagian[0] if bagian else ''
            prov = bagian[1] if len(bagian) > 1 else None
            r = {'tahun': th, 'sistem': nama, 'provinsi': prov, 'om': None, 'bm': None, 'cm': None, 'satuan': 'ton CO2/MWh',
                 'src': 'ESDM-FE-%d' % th, 'st': 'sumber'}
            for c, v in zip(kol, nilai):
                r[c] = int(v) if c == 'total_pembangkit' else fnum(v)
            if not prov or nama.lower() in ('jamali', 'sumatera', 'sulselbar', 'sulutgo'): r['catatan_provinsi'] = 'grid multi-provinsi: daftar provinsi bertingkat di tabel sumber tidak diurai; kolom provinsi hanya yang sebaris dengan angka (bila ada)'
            r['catatan'] = 'cm = %s; Gatrik Nilai Faktor Emisi GRK %d' % ('CM ex-post (OM 0,5 / BM 0,5)' if th >= 2017 else 'kolom Ex-Post', th)
            urut.append(('r', r))
        baris = [x[1] for x in urut if x[0] == 'r']
        for r in baris:
            if not r['sistem']: CELAH.append('Faktor emisi %d: ada baris tanpa nama sistem, dilewati.' % th)
            else: out.append(r)
        n = len(baris)
        if n < 20: CELAH.append('Faktor emisi %d: hanya %d baris terurai.' % (th, n))
    # 2011-2014: EF ex-ante/ex-post per tahun 2014..2010
    f = os.path.join(G, 'fe-2011-2014.pdf')
    if os.path.exists(f):
        for g in pdftext(f).split('\n'):
            m = re.match(r'^\s*(\d{1,2})\s+(\S.*?)\s{2,}((?:(?:\d[.,]?\d+|-)\s*){10})\s*$', g)
            if not m: continue
            nilai = m.group(3).split()
            for i, th in enumerate((2014, 2013, 2012, 2011, 2010)):
                if th == 2010: continue
                ante, post = nilai[2 * i], nilai[2 * i + 1]
                r = {'tahun': th, 'sistem': m.group(2).strip(), 'provinsi': None, 'om': None, 'bm': None, 'cm': None, 'cm_ex_ante': None, 'satuan': 'ton CO2/MWh',
                     'src': 'ESDM-FE-2011-2014', 'st': 'sumber', 'catatan': 'Tabel EF 2010-2014 (Ex-Ante/Ex-Post); nama sistem di kurung memuat lokasi'}
                for nm, v in (('cm_ex_ante', ante), ('cm', post)):
                    if v == '-': r[nm] = None
                    elif re.fullmatch(r'\d,\d{3}', v): r[nm] = float(v.replace(',', '.'))
                    else: r[nm] = None; CELAH.append('Faktor emisi %d %s: angka "%s" tanpa koma desimal di sumber, dikosongkan (tidak ditebak).' % (th, r['sistem'], v))
                out.append(r)
    else: CELAH.append('Faktor emisi 2011-2014: berkas tidak ada.')
    return out

# ---------- BPS var 859 ----------
def ekstrak_bps():
    f = os.path.join(MENTAH, 'bps', 't859.html')
    t = open(f, encoding='utf-8').read().replace('\\"', '"')
    dc = json.loads(re.search(r'"datacontent":(\{[^}]*\})', t).group(1))
    ver = {v['val']: v['label'] for v in json.loads(re.search(r'"vervar":(\[[^\]]*\])', t).group(1))}
    th = re.search(r'"tahun":\[\{"val":(\d+),"label":"(\d{4})"', t)
    tahun, tval = int(th.group(2)), th.group(1)
    out = []
    for key, v in dc.items():
        m = re.fullmatch(r'(\d+)859(\d+)%s0' % tval, key)
        if not m: CELAH.append('BPS 859: kunci "%s" tak dikenali.' % key); continue
        vv = int(m.group(1))
        lab = ver.get(vv)
        if vv == 9999: out.append({'tahun': tahun, 'prov_kode': None, 'wilayah': 'Indonesia', 'gwh': v, 'src': 'BPS-859-%d' % tahun, 'st': 'sumber', 'catatan': 'BPS tabel 859 baris Indonesia (total, untuk cek jumlah)'}); continue
        kode = kode_prov(lab or '')
        if not kode: CELAH.append('BPS 859: label "%s" (kode BPS %s) tak terpetakan ke kode repo.' % (lab, vv)); continue
        out.append({'tahun': tahun, 'prov_kode': kode, 'wilayah': lab, 'gwh': v, 'src': 'BPS-859-%d' % tahun, 'st': 'sumber',
                    'catatan': 'BPS tabel dinamis var 859 Listrik yang Didistribusikan Menurut Provinsi (GWh); kode BPS %s dipetakan ke kode repo lewat nama; angka %d sementara' % (vv, tahun)})
    return out

# ---------- ESDM: bauran energi primer PLN + SAIDI/SAIFI nasional ----------
BAURAN_LABEL = ['BBM (+BBN)', 'Gas', 'Batubara', 'BBN', 'Air', 'Panas Bumi', 'Biomassa', 'EBT lainnya (angin, dll)']
def pct(x):
    return float(x.replace(',', '.').rstrip('%'))
def ekstrak_esdm(edisi, teks, bauran_no, saidi_no):
    """Bauran PLN (persen) dan SAIDI/SAIFI nasional dari teks pdftotext -layout buku ESDM edisi `edisi`."""
    src = 'DJK-STAT-%d' % edisi
    bauran, saidi = [], []
    L = teks.split('\n')
    i = next((j for j, g in enumerate(L) if re.match(r'^\s*TABEL\s+%d\s*$' % bauran_no, g, re.I)), None)
    if i is None: CELAH.append('ESDM %d: Tabel %d (bauran energi primer PLN) tidak ditemukan.' % (edisi, bauran_no))
    else:
        thn = [int(x) for x in re.findall(r'\b(20\d\d)\b', ' '.join(L[i + 1:i + 6]))]
        for lab in BAURAN_LABEL:
            kunci = lab.split(' (')[0] if lab != 'EBT lainnya (angin, dll)' else None
            for j in range(i + 1, i + 40):
                g = L[j]
                if kunci and re.match(r'^\s*%s(\s*\(\+BBN\))?\s+[\d-]' % re.escape(kunci), g) or (kunci is None and re.match(r'^\s+[\d,]+%.*', g) and 'EBT lainnya' in L[j - 1]):
                    v = re.findall(r'[\d,]+%|(?<!\S)-(?!\S)', g)
                    if 0 < len(v) <= len(thn):
                        # sel kosong di tahun awal (mis. Biomassa) tidak tercetak: sejajarkan ke kanan (tahun terbaru), sesuai letak kolom di teks
                        for t, x in zip(thn[len(thn) - len(v):], v):
                            if x != '-': bauran.append({'tahun': t, 'jenis': lab, 'persen': pct(x), 'src': src, 'st': 'sumber', 'catatan': 'ESDM Statistik Ketenagalistrikan %d Tabel %d Bauran Energi Primer Pembangkit Listrik PT PLN (energi primer, persen)' % (edisi, bauran_no)})
                    else: CELAH.append('ESDM %d Tabel %d: baris "%s" punya %d nilai untuk %d tahun, dilewati.' % (edisi, bauran_no, lab, len(v), len(thn)))
                    break
            else: CELAH.append('ESDM %d Tabel %d: baris "%s" tidak ditemukan.' % (edisi, bauran_no, lab))
    k = next((j for j, g in enumerate(L) if re.match(r'^\s*TABEL\s+%d\s*$' % saidi_no, g, re.I)), None)
    if k is None: CELAH.append('ESDM %d: Tabel %d (SAIDI SAIFI) tidak ditemukan.' % (edisi, saidi_no))
    else:
        kep = next((g for g in L[k + 1:k + 8] if 'SAIDI' in g and 'SAIFI' in g and 'NILAI' not in g.upper()), '')
        if not kep: CELAH.append('ESDM %d Tabel %d: urutan kolom SAIDI/SAIFI tak terbaca.' % (edisi, saidi_no))
        saidi_dulu = kep.index('SAIDI') < kep.index('SAIFI') if kep else True
        for g in L[k + 1:k + 40]:
            m = re.match(r'^\s*(20\d\d)\*?\s+([\d,]+)\*?\s+([\d,]+)\*?\s*$', g)
            if m:
                a, b = float(m.group(2).replace(',', '.')), float(m.group(3).replace(',', '.'))
                saidi.append({'tahun': int(m.group(1)), 'unit': 'Nasional (ESDM)', 'saidi_jam': a if saidi_dulu else b, 'saifi_kali': b if saidi_dulu else a,
                              'src': src, 'st': 'sumber', 'catatan': 'ESDM Statistik Ketenagalistrikan %d Tabel %d, nilai nasional; tanda * di sumber (angka sementara) tidak dibawa' % (edisi, saidi_no)})
    return bauran, saidi

SUMBER = [
    {'id': 'PLN-STAT-2021', 'judul': 'Statistik PLN 2021 (Final 29-7-22)', 'penerbit': 'PT PLN (Persero)', 'tanggal_terbit': '2022-07-29',
     'url': 'https://web.pln.co.id/statics/uploads/2022/08/Statistik-PLN-2021-29-7-22-Final.pdf', 'arsip': 'https://web.archive.org/web/20221120092254id_/https://web.pln.co.id/statics/uploads/2022/08/Statistik-PLN-2021-29-7-22-Final.pdf'},
    {'id': 'PLN-STAT-2022', 'judul': 'Statistik PLN 2022 (Final)', 'penerbit': 'PT PLN (Persero)', 'tanggal_terbit': '2023-05',
     'url': 'https://web.pln.co.id/statics/uploads/2023/05/Statistik-PLN-2022-Final.pdf', 'arsip': 'https://web.archive.org/web/20240706142137id_/https://web.pln.co.id/statics/uploads/2023/05/Statistik-PLN-2022-Final.pdf'},
    {'id': 'PLN-STAT-2023', 'judul': 'Statistik PLN 2023 (Indonesia)', 'penerbit': 'PT PLN (Persero)', 'tanggal_terbit': '2025-09',
     'url': 'https://web.pln.co.id/statics/uploads/2025/09/Statistik-PLN-2023-Ind.pdf', 'arsip': 'https://web.archive.org/web/20260208090156id_/https://web.pln.co.id/statics/uploads/2025/09/Statistik-PLN-2023-Ind.pdf'},
    {'id': 'PLN-STAT-2024', 'judul': 'Statistik PLN 2024', 'penerbit': 'PT PLN (Persero)', 'tanggal_terbit': '2025-09',
     'url': 'https://www.pln.co.id/webapi/media/file/webkorp/asset/Statistik2024.pdf', 'arsip': 'https://web.archive.org/web/20260701111630id_/https://www.pln.co.id/webapi/media/file/webkorp/asset/Statistik2024.pdf'},
]
for _r in SUMBER: _r.update({'lisensi': 'publikasi PLN; hanya angka, atribusi PLN; salinan dari arsip Wayback Machine (situs web.pln.co.id tak terjangkau DNS publik)', 'tanggal_baca': TGL_BACA})
GATRIK = 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/'
for _th, _f, _tgl in ((2021, 'c4764-6e4c6-statistik-2021-rev-2-.pdf', '2024-07-10'), (2022, '72f25-web-publish-statistik-2022.pdf', '2024-04-02'), (2023, 'e6394-buku-statistik-ketenagalistrikan-2023-esdm-revised.pdf', '2024-10-03')):
    SUMBER.append({'id': 'DJK-STAT-%d' % _th, 'judul': 'Statistik Ketenagalistrikan Tahun %d' % _th, 'penerbit': 'Direktorat Jenderal Ketenagalistrikan, Kementerian ESDM', 'tanggal_terbit': _tgl + ' (tanggal unggah di gatrik)',
                   'url': GATRIK + _f, 'arsip': None, 'lisensi': 'publikasi pemerintah terbuka; hanya angka, atribusi Ditjen Gatrik ESDM', 'tanggal_baca': TGL_BACA})
SUMBER.append({'id': 'BPS-859-2024', 'judul': 'Listrik yang Didistribusikan Menurut Provinsi (GWh), tahun 2024 (angka sementara)', 'penerbit': 'Badan Pusat Statistik',
               'tanggal_terbit': '2026-02-05 (last_update tabel)', 'url': 'https://www.bps.go.id/id/statistics-table/2/ODU5IzI=/listrik-yang-didistribusikan-menurut-provinsi-gwh-.html', 'arsip': None,
               'lisensi': 'S&K BPS: bebas pakai, wajib kutip BPS + judul + tanggal akses + tautan', 'tanggal_baca': TGL_BACA})
_FE = {2019: ('96d7c-nilai-fe-grk-sistem-ketenagalistrikan-tahun-2019.pdf', '2021-09-02'), 2018: ('acb83-nilai-faktor-emisi-grk-sistem-ketenagalistrikan-2018_new.pdf', '2020-06-22'),
       2017: ('8beca-emisi-grk-tahun-2017.pdf', '2020-06-16'), 2016: ('28be7-faktor-emisi-grk-tahun-2016.pdf', '2018-12-18'), 2015: ('381b3-faktor-emisi-grk-tahun-2015.pdf', '2018-12-18')}
for _th, (_f, _tgl) in _FE.items():
    SUMBER.append({'id': 'ESDM-FE-%d' % _th, 'judul': 'Faktor Emisi GRK Sistem Ketenagalistrikan Tahun %d' % _th, 'penerbit': 'Direktorat Jenderal Ketenagalistrikan, Kementerian ESDM', 'tanggal_terbit': _tgl + ' (tanggal unggah di gatrik)',
                   'url': GATRIK + _f, 'arsip': None, 'lisensi': 'publikasi pemerintah terbuka; atribusi Ditjen Gatrik ESDM', 'tanggal_baca': TGL_BACA})
SUMBER.append({'id': 'ESDM-FE-2011-2014', 'judul': 'Faktor Emisi GRK Tahun 2011-2014 (memuat 2010-2014)', 'penerbit': 'Direktorat Jenderal Ketenagalistrikan, Kementerian ESDM', 'tanggal_terbit': '2018-12-18 (tanggal unggah di gatrik)',
               'url': GATRIK + '4b4f8-faktor-emisi-grk-tahun-2011-2014.pdf', 'arsip': None, 'lisensi': 'publikasi pemerintah terbuka; atribusi Ditjen Gatrik ESDM', 'tanggal_baca': TGL_BACA})

def main():
    muat_pln()
    h = {k: [] for k in ('penjualan', 'produksi', 'beban', 'saidi', 'mva')}
    for th in sorted(PLN):
        e = ekstrak_pln(th)
        for k in h: h[k] += e[k]
    bauran = []
    for ed, (nb, ns) in ((2021, (33, 32)), (2022, (35, 34)), (2023, (None, None))):
        if ed == 2023:
            bauran += bauran_2023(); h['saidi'] += saidi_2023(); continue
        t = open(os.path.join(MENTAH, 'gatrik', 'statistik-%d.txt' % ed), encoding='utf-8').read()
        b, sd = ekstrak_esdm(ed, t, nb, ns); bauran += b; h['saidi'] += sd
    pj = [r for r in h['penjualan'] if r['tingkat'] == 'provinsi']
    pj_unit = [r for r in h['penjualan'] if r['tingkat'] != 'provinsi']
    bps = ekstrak_bps()
    fe = ekstrak_fe()
    CELAH.append('BPS var 859: hanya tahun 2024 (halaman tabel SSR, tanpa kunci WebAPI); 34 provinsi, belum memuat provinsi pemekaran Papua 2022.')
    CELAH.append('Statistik PLN: baris dengan label provinsi memuat tingkat=provinsi; unit multi-provinsi tanpa rincian (mis. UIW Kalimantan Timur dan Utara) tingkat=unit atau induk, jangan dijumlah dengan baris provinsi.')
    CELAH.append('Statistik PLN produksi: hanya blok Produksi Sendiri PLN per jenis (Tabel 23); sewa genset dan pembelian IPP tidak diekstrak (kolom terpisah halaman, tak sejajar). Bukan total produksi sistem.')
    CELAH.append('ESDM 2023: PDF tanpa lapisan teks; hanya Tabel 43 (SAIDI nasional) dan Tabel 44 (bauran) yang dibaca dari gambar halaman. Tabel lain 2023 (produksi, MVA, penjualan per wilayah) tidak diambil.')
    CELAH.append('Statistik ESDM 2021-2023: produksi per wilayah/provinsi tidak diekstrak (format sel gabung per jenis/sewa/beli); bauran energi primer PLN (persen) dan SAIDI/SAIFI nasional diambil.')
    CELAH.append('Faktor emisi: grid multi-provinsi (Jamali, Sumatera, Sulselbar, Sulutgo) hanya memuat provinsi yang tercetak sebaris dengan angka. FE 2011-2016 hanya Ex-Ante/Ex-Post (kolom om/bm kosong). Tak ada edisi resmi setelah 2019 di gatrik.')
    CELAH.append('SAIDI/SAIFI per UIW/UID hanya dari Statistik PLN; ESDM hanya nasional. Tidak ada angka per UP3/ULP.')
    CELAH.append('Beban puncak: per unit PLN dari Tabel 1 Neraca Daya; beban puncak sistem interkoneksi besar tidak terbit sebagai satu angka kecuali baris "Jawa", "Luar Jawa", "Indonesia" yang dicetak PLN.')
    if 2024 in PLN: CELAH.append('Statistik PLN 2024 dibaca dari salinan utuh Wayback 20260701111630 (Statistik2024.pdf, 8.503.625 byte, 106 hlm; www.pln.co.id live 503 saat dicek). Tabel 23 produksi 2024: hanya PLTA..PLTMG (blok halaman pertama); kolom PLT Surya/Bayu/Biomassa tidak diambil. Penjualan 2024 PLN punya kolom Lainnya (T,C,L); jumlah provinsi + Kaltim/Kaltara = total Indonesia 306.219,42 GWh.')
    tahun_ok = sorted(PLN)
    return {
        'meta': {'versi': 1, 'dibuat_oleh': 'scripts/panen/statistik_resmi.py', 'tanggal_baca': TGL_BACA, 'tingkat_bukti': 'situs-sendiri',
                 'catatan': 'Kurasi angka dari publikasi resmi (PDF/HTML), tanpa tebakan; tiap baris memuat src ke sumber[].id dan st=sumber. Angka persis dari tabel; kutipan tabel di catatan. Kode provinsi = public/data/wilayah.json (Papua 91, Papua Barat 92), bukan kode BPS mentah.',
                 'tahun_pln_berhasil': tahun_ok, 'celah': CELAH},
        'sumber': [s for s in SUMBER if True],
        'penjualan_provinsi': pj + bps,
        'penjualan_unit_pln': pj_unit,
        'produksi_bahan_bakar': h['produksi'],
        'bauran_energi_primer_pln': bauran,
        'beban_puncak_sistem': h['beban'],
        'saidi_saifi': h['saidi'],
        'mva_provinsi_tegangan': h['mva'],
        'faktor_emisi_resmi': fe,
    }

# ESDM 2023: PDF tanpa lapisan teks (gambar). Tabel 43 hlm 56 dan Tabel 44 hlm 57 dibaca dari gambar halaman (OCR dicek manual terhadap render halaman).
def bauran_2023():
    tahun = [2017, 2018, 2019, 2020, 2021, 2022, 2023]
    baris = {'BBM (+BBN)': [6.00, 6.04, 4.18, 3.67, 3.95, 3.54, 3.58], 'Gas': [22.92, 21.70, 21.40, 16.80, 17.16, 15.96, 17.31],
             'Batubara': [58.41, 60.28, 62.98, 66.30, 66.01, 67.21, 67.05], 'BBN': [0.40, 0.41, 0.57, 0.77, 0.77, 0.81, 0.93],
             'Air': [7.39, 6.37, 6.01, 7.16, 6.90, 7.35, 6.17], 'Panas Bumi': [5.03, 5.30, 5.11, 5.73, 5.55, 5.48, 5.24],
             'Biomassa': [None, None, None, 0.12, 0.23, 0.32, 0.45], 'EBT lainnya (angin, dll)': [0.25, 0.31, 0.33, 0.22, 0.19, 0.16, 0.20]}
    return [{'tahun': t, 'jenis': j, 'persen': v, 'src': 'DJK-STAT-2023', 'st': 'sumber',
             'catatan': 'ESDM Statistik Ketenagalistrikan 2023 Tabel 44 hlm 57 (PDF berupa gambar; nilai dibaca dari render halaman)'} for j, vs in baris.items() for t, v in zip(tahun, vs) if v is not None]
def saidi_2023():
    return [{'tahun': 2023, 'unit': 'Nasional (ESDM)', 'saidi_jam': 5.64, 'saifi_kali': 4.27, 'src': 'DJK-STAT-2023', 'st': 'sumber',
             'catatan': 'ESDM Statistik Ketenagalistrikan 2023 Tabel 43 hlm 56, nilai nasional (PDF berupa gambar; dibaca dari OCR halaman, cocok dengan narasi 5,64 jam dan 4,27 kali)'}]

if __name__ == '__main__':
    o = main()
    pakai = {r['src'] for k, v in o.items() if isinstance(v, list) and k != 'sumber' for r in v}
    o['sumber'] = [s for s in o['sumber'] if s['id'] in pakai]
    ids = {s['id'] for s in o['sumber']}
    for k, v in o.items():
        if isinstance(v, list) and k != 'sumber':
            salah = [r for r in v if r.get('src') not in ids or r.get('st') != 'sumber']
            assert not salah, '%s: %d baris tanpa src/st=sumber valid, contoh %s' % (k, len(salah), salah[0])
    out = os.path.join(AKAR, 'data/kembaran/statistik.json')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    json.dump(o, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    open(out, 'a').write('\n')
    for k, v in o.items():
        if isinstance(v, list): print(k, len(v))
    print('\n'.join(o['meta']['celah']))
