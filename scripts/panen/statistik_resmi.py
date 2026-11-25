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

# ---------- edisi lama: Inggris (angka 1,234.56), font rusak (geser +29), judul tabel ----------
ANGKA_EN = re.compile(r'(?<![\w.,])-?\d{1,3}(?:,\d{3})*(?:\.\d+)?(?![\w.,])')
def swap(m): return m.group(0).replace(',', '\0').replace('.', ',').replace('\0', '.')
def geser(x): return ''.join(chr(ord(c) + 29) if 33 <= ord(c) + 29 <= 126 else c for c in x)
def normalkan(t):
    """Teks edisi Inggris -> format angka Indonesia; baris label 'Region of ...' yang fontnya rusak dipulihkan."""
    inggris = 'Energy Sold by Type of Customers' in t and 'Energi Terjual per Kelompok Pelanggan' not in t  # edisi dwibahasa (2024) tetap format Indonesia
    out = []
    ctl = lambda x: ''.join(chr(ord(c) + 29) if 0 < ord(c) < 32 and c not in '\t\n\f\r' else c for c in x)  # font rusak: \x03 = spasi, \x1a = '7', dst
    for g in t.split('\n'):
        if inggris:
            seg = re.split(r'\s{2,}', g.strip(), maxsplit=1)
            lab = seg[0]
            if '\x03' in lab or lab.startswith(('5HJLRQ', "'LVW", '*RURQWDOR', '*HQHUDWLRQ', '37-DYD')):
                # label dengan font rusak (semua karakter bergeser -29): geser balik per karakter; spasi nyata tetap
                dek = ''.join(' ' if c == '\x03' else (chr(ord(c) + 29) if c != ' ' and 33 <= ord(c) + 29 <= 126 else c) for c in lab)
                dek = re.sub(r'^(Region|Distribution|Dist|Generation)\.?[Oo]f(?=[A-Z])', lambda m: {'Region': 'Region of ', 'Distribution': 'Distribution of ', 'Dist': 'Dist. of ', 'Generation': 'Generation of '}[m.group(1)], dek)
                dek = re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', dek) if ' ' not in dek.strip()[:14] or re.match(r'^(Region|Distribution|Dist|Generation) of', dek) else dek
                dek = re.sub(r'\s+', ' ', dek).strip()
                if dek == 'Gorontalo': dek = '- Gorontalo'
                lead = g[:len(g) - len(g.lstrip())]
                g = lead + dek + (g[len(lead) + len(lab):] if len(seg) > 1 else '')
            if any(0 < ord(c) < 32 and c not in '\t\n\f\r' for c in g): g = ctl(g)
            g = ANGKA_EN.sub(swap, g)
        out.append(g)
    return '\n'.join(out), inggris

JUDUL = {  # judul tabel (Indonesia | Inggris); nomor tabel berbeda antar edisi
    'jual': r'(Energi Terjual per Kelompok Pelanggan|Energy Sold by Type of Customers)',
    'neraca': r'(Neraca Daya|Power Balance)',
    'saidi': r'(SAIDI dan SAIFI|SAIDI and SAIFI)',
    'trafo': r'(Jumlah dan Daya Terpasang Trafo Gardu Induk|Number and Total Capacity of Substation Transformers)',
    'prod': r'(Energi yang Diproduksi \(GWh\)|Energy Production by Type of Power Plant)',
}
def blok_judul(teks, kunci):
    """Isi tabel menurut JUDUL: judul pertama yang bukan baris daftar isi (daftar isi berakhir nomor halaman)."""
    L = teks.split('\n')
    c = [i for i, g in enumerate(L) if re.match(r'^\s*(?:Tabel|Table)\s+\d+\s*:\s*' + JUDUL[kunci], g, re.I) and not re.search(r'\s{2,}\d{1,3}\s*$', g)]
    if not c: return None, None
    s = c[0]; e = len(L)
    for j in range(s + 1, len(L)):
        if re.match(r'^\s*(?:Tabel|Table)\s+\d+\s*:', L[j], re.I): e = j; break
    return L[s:e], L[s]

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

PREFIX = re.compile(r'^(UIW|UID|UIK|UIKL|UIP|UIP3B|UIT|UIPLN|PLN|PT|PJB|Unit|Proyek|Luar|Jawa|Indonesia|-|Sub|Jumlah|\*|Wilayah|Region|Distribusi|Distribution|Dist\b|Kit\b|P3B|P2B|Penyaluran|Pembangkit|Transmisi|Transmission|Generation|Power Plant|Distributin|Sumatera Trans|Outside|Java|Transmission|Generation|Project|Main)', re.I)
def baris_pln(lines, n):
    """-> [{label, anak(bool), nilai[n]}]; label bertingkat digabung; yang tak pas n angka masuk gagal[]."""
    out, gagal, buf, prev = [], [], '', None
    mulai = False  # baris label-saja SEBELUM baris data pertama adalah header kolom, bukan label unit
    for g in lines[1:]:
        t = g.strip()
        if not mulai:
            tk = t.split(); k_ = len(tk)
            while k_ > 0 and NUM.match(tk[k_ - 1]): k_ -= 1
            if len(tk) - k_ >= 2 and k_ > 0: mulai = True
            else: continue
        if not t or re.match(r'^(PLN Statistics|Annual Data|Data Tahunan|Statistik PLN|Statistics PLN|Unit PLN / PLN Units|Energy Sold|Number and Installed|Energy Production|Data Tahunan|\d+\s+(?:Statistik PLN|PLN Statistics))', t) or re.search(r'Statistic[sk] PLN \d{4}\s*\d*$', t): continue
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
    return norma(re.sub(r'^(UIW|UID|PT|Wilayah|Distribusi|Region of|Distribution of|Dist\.? of|Dist\.?)\s+', '', label, flags=re.I))
EN = {'northsumatera': '12', 'westsumatera': '13', 'southsumatera': '16', 'riauarchipelago': '21', 'westkalimantan': '61', 'centralkalimantan': '62',
      'southkalimantan': '63', 'northsulawesi': '71', 'centralsulawesi': '72', 'southsulawesi': '73', 'southeastsulawesi': '74', 'westsulawesi': '76',
      'northmaluku': '82', 'westpapua': '92', 'centraljava': '33', 'eastjava': '35', 'westjava': '32', 'bangkabelitung': '19', 'westnusatenggara': '52',
      'eastnusatenggara': '53', 'diyogyakarta': '34', 'dkijakarta': '31', 'eastkalimantan': '64', 'northkalimantan': '65'}
def prov_label(label):
    k = kunci_label(label)
    return EN.get(k) or UNIT_SATU.get(k) or kode_prov(re.sub(r'^(UIW|UID|PT|Wilayah|Distribusi|Region of|Distribution of|Dist\.? of|Dist\.?)\s+', '', label, flags=re.I))

def petakan(baris):
    """Tambah 'unit' (induk), 'prov' (kode atau None). Unit tanpa anak dan satu-provinsi diberi kodenya."""
    res = []
    for i, r in enumerate(baris):
        r['label'] = re.sub(r'\s*\(%\)$|\s+%$', '', rapikan(r['label']))
        if r['anak']:
            r['prov'] = EN.get(norma(r['label'])) or kode_prov(r['label'])
            r['unit'] = res[-1]['unit'] if res and not res[-1]['anak'] else (res[-1]['unit'] if res else None)
        else:
            r['unit'] = r['label']
            ada_anak = i + 1 < len(baris) and baris[i + 1]['anak']
            r['prov'] = None if ada_anak else prov_label(r['label'])
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
INGGRIS = set()
def muat_pln():
    for th in range(2014, 2025):
        f = os.path.join(MENTAH, 'pln', 'pln-%d.pdf' % th)
        if os.path.exists(f) and os.path.getsize(f) > 100000:
            t = pdftext(f)
            if len(t) > 50000:
                PLN[th], ing = normalkan(t)
                if ing: INGGRIS.add(th)
            else: CELAH.append('Statistik PLN %d: PDF tidak terbaca/terpotong (teks %d byte).' % (th, len(t)))
        elif th == 2024: CELAH.append('Statistik PLN 2024: satu-satunya snapshot Wayback (20260212164311) terpotong crawler di 5.242.880 dari 8.503.625 byte (36 halaman utuh, tanpa xref/pohon halaman); qpdf dan pdftotext gagal memulihkan. Tidak ada angka PLN 2024 (SAIDI, MVA, beban puncak, penjualan per unit); ulangi bila ada snapshot utuh. Penjualan 2024 ada dari BPS-859-2024.')
        else: CELAH.append('Statistik PLN %d: berkas mentah belum ada/terpotong.' % th)

KV = ['500', '275', '150', '70', '<30']
NOMOR_TABEL = {th: {'jual': 6, 'neraca': 1, 'saidi': 16, 'trafo': 30, 'prod': 23} for th in (2021, 2022, 2023, 2024)}
# 2024: Tabel 6 punya kolom 'Lainnya (T,C,L)' (9 angka); Tabel 23 blok Produksi Sendiri halaman pertama hanya PLTA..PLTMG (kolom Surya/Bayu/Biomassa di blok halaman berikut tidak diambil)
NOMOR_TABEL[2024].update({'saidi_potong': 'Lama Gangguan', 'jual_n': 9, 'prod_n': 9, 'prod_jenis': ['PLTA', 'PLTM', 'PLTMH', 'PLTU', 'PLTG', 'PLTGU', 'PLTP', 'PLTD', 'PLTMG'], 'prod2_n': 14, 'prod2_jenis': ['PLTS', 'PLTB', 'PLT Biomassa']})
JENIS_EN = ['PLTA', 'PLTU', 'PLTG', 'PLTGU', 'PLTP', 'PLTD', 'PLTMG', 'PLTS', 'PLTB', 'PLTBM']  # urutan kolom edisi Inggris (Hydro, Steam, Gas Turbine, Combined Cycle, Geothermal, Diesel, Diesel Gas, Solar, Wind, Biomass)
TOTAL_LABEL = {'jawa', 'luarjawa', 'indonesia', 'java', 'outsidejava', 'total', 'jumlah'}
CEK = []   # hasil cek jumlah baris = total Indonesia

def modus_n(b):
    """Jumlah angka di ujung baris yang paling sering (tabel edisi lama: jumlah kolom berubah antar tahun)."""
    c = {}
    for g in b[1:]:
        tok = g.split(); k = len(tok)
        while k > 0 and NUM.match(tok[k - 1]): k -= 1
        if len(tok) - k >= 3 and k > 0: c[len(tok) - k] = c.get(len(tok) - k, 0) + 1
    return max(c, key=c.get) if c else 0

def cek_total(th, tabel, rows, kolom, nama_kolom=None):
    """(1) Jumlah baris tingkat atas (induk dan unit tunggal, tanpa Jawa/Luar Jawa/Indonesia) = baris Indonesia, per kolom.
    (2) Per induk: jumlah baris anak (provinsi) = baris induk; selisih = ketidakkonsistenan cetakan sumber sendiri."""
    nk = lambda j: nama_kolom[j] if nama_kolom and j < len(nama_kolom) else j
    tot = next((x for x in rows if norma(x['label']) == 'indonesia'), None)
    atas = [x for x in rows if not x['anak'] and norma(x['label']) not in TOTAL_LABEL]
    anak_bad = []
    for i, x in enumerate(rows):
        if x['anak'] or i + 1 >= len(rows) or not rows[i + 1]['anak']: continue
        ch = []
        for y in rows[i + 1:]:
            if not y['anak']: break
            ch.append(y)
        for j in kolom:
            if j >= len(x['nilai']) or x['nilai'][j] is None: continue
            jm = round(sum((y['nilai'][j] or 0) for y in ch), 2); d = round(jm - x['nilai'][j], 2)
            if abs(d) > 0.5: anak_bad.append({'induk': rapikan(x['label']), 'kolom': nk(j), 'jumlah_anak': jm, 'nilai_induk': x['nilai'][j], 'selisih': d})
    ent = {'tahun': th, 'tabel': tabel, 'baris_tingkat_atas': len(atas), 'induk_vs_anak_tidak_cocok': anak_bad}
    if tot is None:
        ent['status'] = 'tanpa baris Indonesia di tabel sumber'
    else:
        ok, salah = 0, []
        for j in kolom:
            if j >= len(tot['nilai']) or tot['nilai'][j] is None: continue
            jm = round(sum((x['nilai'][j] or 0) for x in atas), 2); d = round(jm - tot['nilai'][j], 2)
            if abs(d) <= 0.5: ok += 1
            else: salah.append({'kolom': nk(j), 'jumlah_baris': jm, 'total_indonesia': tot['nilai'][j], 'selisih': d})
        ent.update({'kolom_cocok': ok, 'kolom_tidak_cocok': len(salah), 'tidak_cocok': salah})
    CEK.append(ent)

def jenis_header(b, n, th):
    """Jenis pembangkit per kolom dari header tabel produksi (edisi Inggris: urutan baku)."""
    i = next((k for k, g in enumerate(b[1:], 1) if len(g.split()) >= n and sum(1 for q in g.split() if NUM.match(q)) >= max(3, n - 3)), len(b))
    h = ' '.join(b[1:i])
    for a_, b_ in (('PLT Surya', 'PLTS'), ('PLT Bayu', 'PLTB'), ('PLT Biomassa', 'PLTBM'), ('PLT Biomass', 'PLTBM')): h = h.replace(a_, b_)
    j = list(dict.fromkeys(re.findall(r'PLT[A-Z]*', h)))
    if len(j) == n: return j
    if th in INGGRIS and n <= len(JENIS_EN): return JENIS_EN[:n]
    return None

def ekstrak_pln(th):
    t = PLN[th]; src = 'PLN-STAT-%d' % th
    r = {k: [] for k in ('penjualan', 'produksi', 'beban', 'saidi', 'mva')}
    LAMA = th <= 2020  # edisi 2014-2020: tabel dicari menurut JUDUL (nomor dan bahasa berbeda antar edisi)
    NO = NOMOR_TABEL.get(th, {})
    def ambil(kunci, n, nama, potong=None):
        if LAMA:
            b, judul = blok_judul(t, kunci)
            no = int(re.search(r'\d+', judul).group(0)) if b else None
        else:
            no = NO[kunci]; b, judul = blok(t, no)
        if b is not None and potong:
            c = [i for i, g in enumerate(b) if re.search(potong, g)]
            if c: b = b[:c[0]]
        if b is None: CELAH.append('PLN %d (%s): tabel tidak ditemukan menurut judul.' % (th, nama)); return [], None, 0
        if not n: n = modus_n(b)
        rows, gagal = baris_pln(b, n)
        for lab, c in gagal: CELAH.append('PLN %d Tabel %d (%s): baris "%s" punya %d angka (harus %d), dilewati.' % (th, no, nama, lab[:50], c, n))
        return rows, no, n
    # penjualan per kelompok (GWh): RT, Industri, Bisnis, Sosial, GdgKantor, PJU, [Lainnya], Jumlah, %
    jn = NO.get('jual_n', 8)
    rows, no, n = ambil('jual', None if LAMA else jn, 'energi terjual')
    if rows:
        JK = ['rumah_tangga', 'industri', 'bisnis', 'sosial', 'gedung_kantor_pemerintah', 'penerangan_jalan'] + (['lainnya_tcl'] if n == 9 else [])
        if n < 8: CELAH.append('PLN %d Tabel %d (energi terjual): hanya %d kolom, tidak diurai.' % (th, no, n)); rows = []
        cek_total(th, 'penjualan (Tabel %d)' % no, rows, range(n - 1), JK + ['jumlah'])
        for x in petakan(rows):
            r['penjualan'].append({'tahun': th, 'tingkat': x['tingkat'], 'prov_kode': x['prov'], 'unit': x['unit'], 'baris': x['label'], 'gwh': jml(x['nilai'][len(JK)]),
                                   'per_kelompok_gwh': dict(zip(JK, [jml(v) for v in x['nilai'][:len(JK)]])),
                                   'src': src, 'st': 'sumber', 'catatan': 'Statistik PLN %d Tabel %d, kolom Jumlah (GWh)' % (th, no)})
    rows, no, n = ambil('neraca', 3, 'neraca daya')
    cek_total(th, 'neraca daya (Tabel %d)' % no if no else 'neraca daya', rows, (0, 1), ['kapasitas_terpasang', 'daya_mampu']) if rows else None
    for x in petakan(rows):
        r['beban'].append({'tahun': th, 'tingkat': x['tingkat'], 'sistem_pln': x['label'], 'unit': x['unit'], 'prov_kode': x['prov'], 'mw': jml(x['nilai'][2]),
                           'kapasitas_terpasang_mw': jml(x['nilai'][0]), 'daya_mampu_mw': jml(x['nilai'][1]), 'src': src, 'st': 'sumber',
                           'catatan': 'Statistik PLN %d Tabel %d Neraca Daya, kolom Beban Puncak (MW); beban puncak per unit PLN, tidak dijumlahkan; kapasitas = milik PLN, sewa, IPP' % (th, no)})
    rows, no, n = ambil('saidi', 2, 'SAIDI SAIFI', NO.get('saidi_potong'))
    for x in petakan(rows):
        r['saidi'].append({'tahun': th, 'tingkat': x['tingkat'], 'unit': x['unit'], 'baris': x['label'], 'prov_kode': x['prov'], 'saidi_jam': jml(x['nilai'][0]), 'saifi_kali': jml(x['nilai'][1]), 'src': src, 'st': 'sumber',
                           'catatan': 'Statistik PLN %d Tabel %d, jam atau kali per pelanggan' % (th, no)})
    rows, no, n = ambil('trafo', 12, 'trafo gardu induk')
    for x in rows:  # edisi Inggris: '1.871' (tiga desimal) ambigu antara pemisah ribuan gaya Indonesia dan desimal; tidak ditebak
        for i, v in enumerate(x['nilai']):
            if th in INGGRIS and v is not None and v != int(v) and len(repr(v).split('.')[1]) == 3:
                CELAH.append('PLN %d Tabel %d (trafo): baris "%s" kolom %d bernilai %s (tiga desimal di edisi Inggris, ambigu dengan pemisah ribuan), dikosongkan.' % (th, no, x['label'][:40], i + 1, v)); x['nilai'][i] = None
    if rows: cek_total(th, 'trafo (Tabel %d)' % no, rows, range(12), [('%s kV %s' % (KV[i // 2], 'unit' if i % 2 == 0 else 'MVA')) if i < 10 else ('jumlah unit' if i == 10 else 'jumlah MVA') for i in range(12)])
    for x in petakan(rows):
        v = x['nilai']
        for i, kv in enumerate(KV):
            u, m = v[2 * i], v[2 * i + 1]
            if not (u or m) and kv == '500' and x['tingkat'] == 'provinsi':
                # GITET 500 kV dicatat PLN di tingkat unit (UIT/UIP3B); provinsi bukan nol, tapi tanpa nilai
                r['mva'].append({'tahun': th, 'tingkat': 'provinsi', 'prov_kode': x['prov'], 'unit': x['unit'], 'baris': x['label'], 'kv': kv, 'unit_trafo': None, 'mva': None, 'src': src, 'st': 'sumber',
                                 'catatan': 'tercatat di tingkat unit (Statistik PLN %d Tabel %d tidak memuat %s kV per provinsi)' % (th, no, kv)})
            if u or m:
                r['mva'].append({'tahun': th, 'tingkat': x['tingkat'], 'prov_kode': x['prov'], 'unit': x['unit'], 'baris': x['label'], 'kv': kv, 'unit_trafo': jml(u), 'mva': jml(m), 'src': src, 'st': 'sumber',
                                 'catatan': 'Statistik PLN %d Tabel %d Jumlah dan Daya Terpasang Trafo Gardu Induk' % (th, no)})
    pn = NO.get('prod_n', 10)
    rows, no, n = ambil('prod', None if LAMA else pn, 'produksi per jenis', r'Sewa|Rent' if LAMA else 'Sewa Genset')
    JENIS = NO.get('prod_jenis', ['PLTA', 'PLTM', 'PLTMH', 'PLTU', 'PLTG', 'PLTGU', 'PLTP', 'PLTD', 'PLTMG', 'PLTS'])
    if LAMA and rows:
        b, _ = blok_judul(t, 'prod')
        JENIS = jenis_header(b, n, th)
        if JENIS is None: CELAH.append('PLN %d Tabel %d (produksi per jenis): %d kolom tapi header jenis tak terbaca, dilewati.' % (th, no, n)); rows = []
    if rows: cek_total(th, 'produksi per jenis (Tabel %d)' % no, rows, range(len(JENIS)), JENIS)
    prod = petakan(rows)
    for x in prod:
        for j, v in zip(JENIS, x['nilai']):
            if v is not None:
                r['produksi'].append({'tahun': th, 'tingkat': x['tingkat'], 'wilayah': x['label'], 'prov_kode': x['prov'], 'jenis': j, 'gwh': jml(v), 'src': src, 'st': 'sumber',
                                      'catatan': 'Statistik PLN %d Tabel %d, blok Produksi Sendiri (tanpa sewa genset dan pembelian)' % (th, no)})
    if NO.get('prod2_n'):
        # blok halaman berikut: baris tanpa label (urutan sama dengan blok pertama), n angka; hanya kolom Produksi Sendiri di depan yang diambil
        b, _ = blok(t, no)
        mulai = next((i for i, g in enumerate(b) if 'Sewa Genset' in g), None)
        sec = []
        for g in (b[mulai:] if mulai is not None else []):
            tok = g.split()
            if len(tok) == NO['prod2_n'] and all(NUM.match(q) for q in tok): sec.append(tok)
        if len(sec) != len(prod): CELAH.append('PLN %d Tabel %d blok kedua (Surya/Bayu/Biomassa): %d baris vs %d baris blok pertama, tidak diambil.' % (th, no, len(sec), len(prod)))
        else:
            for x, tok in zip(prod, sec):
                for j, v in zip(NO['prod2_jenis'], tok):
                    if angka(v) is not None:
                        r['produksi'].append({'tahun': th, 'tingkat': x['tingkat'], 'wilayah': x['label'], 'prov_kode': x['prov'], 'jenis': j, 'gwh': jml(angka(v)), 'src': src, 'st': 'sumber',
                                              'catatan': 'Statistik PLN %d Tabel %d, blok Produksi Sendiri halaman berikut (baris dipasangkan menurut urutan blok pertama)' % (th, no)})
    return r

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


# ---------- ESDM 2009-2020: produksi PLN nasional per jenis + total, energi primer nasional ----------
ESDM_EDISI = [  # (id, berkas, judul gatrik, URL berkas gatrik, tanggal unggah, kode jenis kolom bila urutan header cocok dengan data)
    ('DJK-STAT-2009', 'stat-2009-e6d5d', 2009, 'e6d5d-statistik-ketenagalistrikan-2009.pdf', '2018-12-18'),
    ('DJK-STAT-2010', 'stat-2010-83d90', 2010, '83d90-statistik-ketenagalistrikan-2010.pdf', '2019-10-21'),
    ('DJK-STAT-2012', 'stat-2012-430e7', 2012, '430e7-statistik-ketenagalistrikan-2012.pdf', '2019-10-21'),
    ('DJK-STAT-2013', 'stat-2013-56364', 2013, '56364-statistik-ketenagalistrikan-2013.pdf', '2018-12-18'),
    ('DJK-STAT-2014', 'stat-2014-b18c7', 2014, 'b18c7-statistik-ketenagalistrikan-2014.pdf', '2018-12-18'),
    ('DJK-STAT-2015', 'stat-2015-7ff0d', 2015, '7ff0d-statistik-ketenagalistrikan-2015.pdf', '2018-12-17'),
    ('DJK-STAT-2016', 'stat-2016-d3bbb', 2016, 'd3bbb-statistik-ketenagalistrikan-t.a.-2016.pdf', '2018-12-17'),
    ('DJK-STAT-2017', 'stat-2017-7ff5e', 2017, '7ff5e-statistik-ketenagalistrikan-t.a.-2017.pdf', '2019-10-21'),
    ('DJK-STAT-2018A', 'stat-2018-a9f2c', 2018, 'a9f2c-statistik-ketenagalistrikan-t.a.-2018.pdf', '2019-10-17'),
    ('DJK-STAT-2018B', 'stat-2018-92999', 2018, '92999-statistik-2018.pdf', '2021-03-15'),
    ('DJK-STAT-2019', 'stat-2019-c4053', 2019, 'c4053-statistik-2019-highres.pdf', '2021-03-15'),
    ('DJK-STAT-2020', 'stat-2020-ccf8b', 2020, 'ccf8b-8f7e7-20211110-statistik-2020-rev03.pdf', '2024-07-10'),
]
def num_campur(t):
    """Angka edisi ESDM: '10.004,86' | '10,004.86' | '9,109,937.0' | '4.841' (ribuan) | '-' (nol)."""
    if t == '-': return 0.0
    d, k = t.rfind('.'), t.rfind(',')
    if d >= 0 and k >= 0: dec = '.' if d > k else ','
    elif d >= 0: dec = '.' if t.count('.') == 1 and len(t) - d - 1 != 3 else None
    elif k >= 0: dec = ',' if t.count(',') == 1 and len(t) - k - 1 != 3 else None
    else: dec = None
    if dec is None: return float(t.replace('.', '').replace(',', ''))
    return float(t.replace(',' if dec == '.' else '.', '').replace(dec, '.'))
NUMC = re.compile(r'^(-|\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?|\d+(?:[.,]\d+)?)$')
def toks_num(g):
    t = g.split()
    return t if t and all(NUMC.match(x) for x in t) else None

KODE_JENIS = ['PLTA', 'PLTP', 'PLTU-M', 'PLTU-G', 'PLTU-B', 'PLTD', 'PLTG-M', 'PLTG-G', 'PLTGU-M', 'PLTGU-G', 'PLTM-G', 'PLTS', 'PLTB']
def ekstrak_esdm_deret():
    """Tabel 'Produksi dan Pembelian Tenaga Listrik PLN' (nasional, per tahun) tiap edisi: jumlah produksi, pembelian, total, dan
    per jenis hanya bila (a) edisi <= 2015 (urutan header cocok dengan data) dan (b) jumlah kolom jenis = 13 atau 9 yang terbaca.
    Validasi per baris: jumlah jenis = jumlah produksi, produksi + pembelian = total (toleransi 1,5 GWh)."""
    out, cek = [], []
    G = os.path.join(MENTAH, 'gatrik', 'deret')
    for sid, berkas, ed, _f, _tgl in ESDM_EDISI:
        f = os.path.join(G, berkas + '.txt')
        if not os.path.exists(f): CELAH.append('ESDM %s: teks tidak ada.' % sid); continue
        L = open(f, encoding='utf-8').read().split('\n')
        ti = [i for i, g in enumerate(L) if re.search(r'PRODUKSI DAN PEMBELIAN TENAGA LISTRIK PLN', g)]
        reg_i = next((i for i in reversed(ti) if sum(1 for g in L[i:i + 45] if re.match(r'^\s*(19|20)\d\d\s+[\d-]', g)) >= 3), None)
        if reg_i is None: CELAH.append('ESDM %s: tabel Produksi dan Pembelian Tenaga Listrik PLN tidak ditemukan.' % sid); continue
        yr = []
        for k in range(reg_i, reg_i + 45):
            m = re.match(r'^\s*((?:19|20)\d\d)\s+(.*)$', L[k])
            if m and toks_num(m.group(2)) and len(toks_num(m.group(2))) >= 6: yr.append((k, int(m.group(1)), toks_num(m.group(2))))
        n = len(yr); kmaks = max(len(x[2]) for x in yr)
        # blok kedua (kolom lanjutan di halaman/baris berikut): n baris angka-saja berurutan dengan jumlah token sama
        second = None
        j = yr[-1][0] + 1
        while j < min(len(L), yr[-1][0] + 140):
            run, jj = [], j
            while jj < len(L) and len(run) < n:
                if not L[jj].strip(): jj += 1; continue
                tk = toks_num(L[jj])
                if tk and len(tk) >= 4 and (not run or abs(len(tk) - len(run[0])) <= 2): run.append(tk); jj += 1
                else: break
            if len(run) == n: second = run; break
            j += 1
        mwh = ed == 2009 and any('9,109,937' in L[x[0]] for x in yr[:1])
        for idx, (k, th, tk) in enumerate(yr):
            for variant in ('satu', 'dua'):
                if variant == 'dua':
                    if second is None: break
                    tk2 = tk + second[idx]
                else: tk2 = tk
                try: v = [num_campur(x) for x in tk2]
                except ValueError: continue
                if mwh: v = [x / 1000.0 for x in v]
                tot = None; selisih = None
                if len(v) >= 4 and v[-1] > v[-3] > 0 and abs(v[-3] + v[-2] - v[-1]) <= 1.5:
                    tot = (v[-3], v[-2], v[-1]); jenis = v[:-3]; selisih = round(sum(jenis) - v[-3], 2)
                    if abs(selisih) > 1.5 and variant == 'satu' and second is not None: tot = None; continue  # coba gabung dengan blok kedua dulu
                if tot or (variant == 'dua'): break
            cek_r = {'edisi': sid, 'tahun': th, 'token': len(tk2)}
            if tot:
                rec = {'tahun': th, 'jumlah_produksi_gwh': round(tot[0], 2), 'pembelian_gwh': round(tot[1], 2), 'jumlah_gwh': round(tot[2], 2), 'per_jenis_gwh': None, 'satuan': 'GWh', 'src': sid, 'st': 'sumber',
                       'catatan': 'ESDM Statistik Ketenagalistrikan (edisi %s), tabel Produksi dan Pembelian Tenaga Listrik PLN (nasional); jumlah jenis = jumlah produksi dan produksi + pembelian = total (selisih <= 1,5 GWh)' % sid + ('; sumber dalam MWh, dibagi 1000' if mwh else '')}
                if abs(selisih) > 1.5:
                    rec['catatan'] = rec['catatan'].replace('; jumlah jenis = jumlah produksi dan', '; jumlah jenis TIDAK sama dengan jumlah produksi (selisih %s GWh; sumber sendiri tidak konsisten, per jenis tidak dibawa); ' % selisih).replace('produksi + pembelian = total (selisih <= 1,5 GWh)', 'produksi + pembelian = total (selisih <= 1,5 GWh)')
                    cek_r['catatan'] = 'total cocok, jumlah jenis selisih %s GWh' % selisih
                elif ed <= 2015 and len(jenis) == len(KODE_JENIS) and tk2 is not None:
                    rec['per_jenis_gwh'] = {c: round(x, 2) for c, x in zip(KODE_JENIS, jenis)}
                elif ed >= 2016:
                    rec['catatan'] += '; kolom per jenis tidak diambil: urutan kolom edisi >= 2016 tidak cocok dengan header (mis. 11.390,43 berada di bawah header PLTU-M tahun 2015 sementara PLTU-M 2014 = 722,98), pakai Statistik PLN untuk jenis'
                out.append(rec); cek_r['status'] = 'cocok'
            else:
                cek_r['status'] = 'tidak cocok (jumlah jenis/produksi/pembelian tidak konsisten atau kolom terpotong), baris tidak dibawa'
                cek_r['token_dibaca'] = len(tk2)
            cek.append(cek_r)
    # konsensus antar edisi: nilai jumlah_produksi tiap tahun harus sama di semua edisi; yang menyimpang dicatat dan tidak dibawa
    from collections import Counter
    modus = {th: Counter(r['jumlah_produksi_gwh'] for r in out if r['tahun'] == th).most_common(1)[0][0] for th in {r['tahun'] for r in out}}
    keep = []
    for r in out:
        if abs(r['jumlah_produksi_gwh'] - modus[r['tahun']]) > 1.5:
            cek.append({'edisi': r['src'], 'tahun': r['tahun'], 'status': 'menyimpang dari edisi lain (jumlah produksi %s vs %s di edisi lain; label tahun di edisi ini diduga bergeser), baris tidak dibawa' % (r['jumlah_produksi_gwh'], modus[r['tahun']])})
        else: keep.append(r)
    return keep, cek

def ekstrak_energi_primer():
    """ESDM Statistik 2010 Tabel 35: pemakaian energi primer nasional menurut jenis (SBM/BOE), 2003-2009; jumlah jenis = JUMLAH."""
    f = os.path.join(MENTAH, 'gatrik', 'deret', 'stat-2010-83d90.txt')
    L = open(f, encoding='utf-8').read().split('\n')
    i = next((k for k, g in enumerate(L) if re.match(r'^\s*TABEL 35\s*$', g)), None)
    if i is None: CELAH.append('ESDM 2010 Tabel 35 (energi primer) tidak ditemukan.'); return []
    out = []
    for g in L[i:i + 25]:
        m = re.match(r'^\s*((?:19|20)\d\d)\s+(.*)$', g)
        if not m: continue
        t = m.group(2).split()
        if len(t) != 7 or not all(re.fullmatch(r'\d{1,3}(?:\.\d{3})+', x) for x in t): continue
        v = [int(x.replace('.', '')) for x in t]
        if abs(sum(v[:6]) - v[6]) > 6: CELAH.append('ESDM 2010 Tabel 35 tahun %s: jumlah jenis %d != JUMLAH %d, baris tidak dibawa.' % (m.group(1), sum(v[:6]), v[6])); continue
        for jn, x in zip(['Minyak Bumi', 'Gas Bumi', 'Batubara', 'Tenaga Air', 'Panas Bumi', 'Biomassa'], v):
            out.append({'tahun': int(m.group(1)), 'jenis': jn, 'boe': x, 'jumlah_boe': v[6], 'src': 'DJK-STAT-2010', 'st': 'sumber',
                        'catatan': 'ESDM Statistik Ketenagalistrikan 2010 Tabel 35 Pemakaian Energi Primer Menurut Jenis (SBM/BOE), konsumsi energi primer nasional semua sektor, BUKAN bauran pembangkit listrik; jumlah jenis = JUMLAH'})
    return out

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
_W = 'https://web.archive.org/web/%sid_/%s'
for _th, _ts, _u, _tgl, _jd in (
        (2014, '20220331115710', 'https://web.pln.co.id/statics/uploads/2017/06/Statistik-PLN-2014_for-website-10-Juni-2015.pdf', '2015-06-10', 'Statistik PLN 2014'),
        (2015, '20220331115704', 'https://web.pln.co.id/statics/uploads/2017/06/Statistik-PLN-2015-English.pdf', '2017-06 (folder unggah)', 'Statistik PLN 2015 (English)'),
        (2016, '20220331115623', 'https://web.pln.co.id/statics/uploads/2017/05/Statistik2016.pdf', '2017-05 (folder unggah)', 'Statistik PLN 2016'),
        (2017, '20261005165302', 'https://www.pln.co.id/webapi/media/file/webkorp/asset/Statistik2017.pdf', None, 'Statistik PLN 2017 (edisi Inggris)'),
        (2018, '20200908084933', 'https://web.pln.co.id/statics/uploads/2019/07/Buku-Statistik-2018-vs-Indo-Final.pdf', '2019-07 (folder unggah)', 'Buku Statistik PLN 2018'),
        (2019, '20210807044915', 'https://web.pln.co.id/statics/uploads/2020/11/Statistik-Indonesia-2019.pdf', '2020-11 (folder unggah)', 'Statistik PLN 2019 (Indonesia)'),
        (2020, '20220224213228', 'https://web.pln.co.id/statics/uploads/2021/07/Statistik-PLN-2020.pdf', '2021-07 (folder unggah)', 'Statistik PLN 2020')):
    SUMBER.insert(_th - 2014, {'id': 'PLN-STAT-%d' % _th, 'judul': _jd, 'penerbit': 'PT PLN (Persero)', 'tanggal_terbit': _tgl, 'url': _u, 'arsip': _W % (_ts, _u)})
for _r in SUMBER: _r.update({'lisensi': 'publikasi PLN; hanya angka, atribusi PLN; salinan dari arsip Wayback Machine (situs web.pln.co.id tak terjangkau DNS publik)', 'tanggal_baca': TGL_BACA})
GATRIK = 'https://gatrik.esdm.go.id/gatrik/gatrik-api//storage/migrasi/download_index/files/'
for _th, _f, _tgl in ((2021, 'c4764-6e4c6-statistik-2021-rev-2-.pdf', '2024-07-10'), (2022, '72f25-web-publish-statistik-2022.pdf', '2024-04-02'), (2023, 'e6394-buku-statistik-ketenagalistrikan-2023-esdm-revised.pdf', '2024-10-03')):
    SUMBER.append({'id': 'DJK-STAT-%d' % _th, 'judul': 'Statistik Ketenagalistrikan Tahun %d' % _th, 'penerbit': 'Direktorat Jenderal Ketenagalistrikan, Kementerian ESDM', 'tanggal_terbit': _tgl + ' (tanggal unggah di gatrik)',
                   'url': GATRIK + _f, 'arsip': None, 'lisensi': 'publikasi pemerintah terbuka; hanya angka, atribusi Ditjen Gatrik ESDM', 'tanggal_baca': TGL_BACA})
for _id, _b, _ed, _f, _tgl in ESDM_EDISI:
    SUMBER.append({'id': _id, 'judul': 'Statistik Ketenagalistrikan (judul gatrik: Tahun %d)' % _ed, 'penerbit': 'Direktorat Jenderal Ketenagalistrikan, Kementerian ESDM', 'tanggal_terbit': _tgl + ' (tanggal unggah di gatrik)',
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
    prod_nas, cek_nas = ekstrak_esdm_deret()
    energi_primer = ekstrak_energi_primer()
    CELAH.append('BPS var 859: hanya tahun 2024 (halaman tabel SSR, tanpa kunci WebAPI); 34 provinsi, belum memuat provinsi pemekaran Papua 2022.')
    CELAH.append('Statistik PLN: baris dengan label provinsi memuat tingkat=provinsi; unit multi-provinsi tanpa rincian (mis. UIW Kalimantan Timur dan Utara) tingkat=unit atau induk, jangan dijumlah dengan baris provinsi.')
    CELAH.append('MVA trafo (Tabel 30): total Indonesia per tegangan = jumlah baris tingkat atas (induk dan unit tunggal, tanpa Jawa/Luar Jawa) 2014-2024 (pengecualian di catatan cek jumlah); 70 kV 2022 (110 vs 80 MVA di anak: Maluku, selisih 30) dan 2023 (130 vs 80, selisih 50) tak konsisten di sumber PLN sendiri antara induk dan anak. Provinsi tanpa nilai 500 kV bernilai null (catatan: tercatat di tingkat unit), bukan nol.')
    CELAH.append('Statistik PLN produksi: hanya blok Produksi Sendiri PLN per jenis (Tabel 23); sewa genset dan pembelian IPP tidak diekstrak (kolom terpisah halaman, tak sejajar). Bukan total produksi sistem.')
    CELAH.append('ESDM 2023: PDF tanpa lapisan teks; hanya Tabel 43 (SAIDI nasional) dan Tabel 44 (bauran) yang dibaca dari gambar halaman. Tabel lain 2023 (produksi, MVA, penjualan per wilayah) tidak diambil.')
    CELAH.append('Statistik ESDM 2021-2023: produksi per wilayah/provinsi tidak diekstrak (format sel gabung per jenis/sewa/beli); bauran energi primer PLN (persen) dan SAIDI/SAIFI nasional diambil.')
    CELAH.append('Faktor emisi: grid multi-provinsi (Jamali, Sumatera, Sulselbar, Sulutgo) hanya memuat provinsi yang tercetak sebaris dengan angka. FE 2011-2016 hanya Ex-Ante/Ex-Post (kolom om/bm kosong). Tak ada edisi resmi setelah 2019 di gatrik.')
    CELAH.append('SAIDI/SAIFI per UIW/UID hanya dari Statistik PLN; ESDM hanya nasional. Tidak ada angka per UP3/ULP.')
    CELAH.append('Beban puncak: per unit PLN dari Tabel 1 Neraca Daya; beban puncak sistem interkoneksi besar tidak terbit sebagai satu angka kecuali baris "Jawa", "Luar Jawa", "Indonesia" yang dicetak PLN.')
    if 2024 in PLN: CELAH.append('Statistik PLN 2024 dibaca dari salinan utuh Wayback 20260701111630 (Statistik2024.pdf, 8.503.625 byte, 106 hlm; www.pln.co.id live 503 saat dicek). Tabel 23 produksi 2024: hanya PLTA..PLTMG (blok halaman pertama); kolom PLT Surya/Bayu/Biomassa tidak diambil. Penjualan 2024 PLN punya kolom Lainnya (T,C,L); jumlah provinsi + Kaltim/Kaltara = total Indonesia 306.219,42 GWh.')
    CELAH.append('Statistik PLN 2025 (www.pln.co.id/webapi/media/file/webkorp/asset/Statistik-2025-2907.pdf, 76.192.226 byte): semua snapshot Wayback (20260913030335, 20260925103821, 20261009*, 20261010*) terpotong crawler di sekitar 15-16 MB (server menutup koneksi, tanpa xref/pohon halaman, pdfinfo gagal); situs live 503. Tidak ada angka PLN 2025; ulangi bila ada snapshot utuh.')
    CELAH.append('Statistik PLN 2014-2020 (Wayback web.pln.co.id dan www.pln.co.id/webapi): tabel dicari menurut JUDUL (Neraca Daya, Energi Terjual per Kelompok Pelanggan, SAIDI dan SAIFI, Trafo Gardu Induk, Energi yang Diproduksi), bukan nomor; nomor 1/6/16/23/30 kebetulan sama 2014-2024. Unit PLN edisi lama = Wilayah/Distribusi/Kit/P3B (bukan UIW/UID); 2014-2017 Kaltim dan Kaltara satu unit (tingkat unit, tanpa prov_kode).')
    CELAH.append('Statistik PLN 2017 dan 2015 hanya terbit/terarsip sebagai edisi Inggris (angka format 1,234.56 dibalik ke format Indonesia sebelum diurai; label unit berbahasa Inggris, mis. "Region of Aceh"). Edisi 2015: sebagian label baris berfont rusak (geser -29) dipulihkan seperlunya, spasi/ampersand pada label unit gabungan dapat hilang (angka tidak terpengaruh, lolos cek jumlah). Edisi 2017 trafo "Distribution of Bali" 150 kV MVA tertulis "1.871" (tiga desimal di edisi Inggris, ambigu) dikosongkan; jumlah baris tinggal selisih 1.871 MVA terhadap Indonesia.')
    CELAH.append('Cek jumlah (meta.cek_total): jumlah baris tingkat atas (induk dan unit tunggal, tanpa Jawa/Luar Jawa/Indonesia) = baris Indonesia, per kolom, toleransi 0,5. Penjualan cocok semua kolom (7, 2024: 8) untuk 2014-2024; trafo cocok 12 dari 12 kolom kecuali 2017 (150 kV MVA, Bali di atas) dan 2018 (150 kV MVA, selisih 1 MVA di cetakan PLN); 2022 dan 2023 cocok di tingkat atas tetapi induk Maluku vs anak berselisih 30 dan 50 MVA (70 kV, cetakan PLN); produksi per jenis cocok semua kolom berangka kecuali 2021 (tabel tanpa baris Indonesia, tidak dicek). Neraca daya: kapasitas terpasang dan daya mampu TIDAK dijumlah baris (unit PLN dan pembangkit saling tumpang tindih), selisih dicatat saja. induk_vs_anak_tidak_cocok = cetakan sumber sendiri tidak konsisten antara baris induk dan anak (mis. 2017 Dist. Central Java and Yogyakarta induk 25.126,93 vs anak 23.781,53 GWh); tidak diperbaiki.')
    CELAH.append('ESDM Statistik Ketenagalistrikan 2009-2020 via API gatrik (download-index-statistik): 12 berkas teks diunduh (2009, 2010, 2012-2017, dua edisi berjudul 2018 [a9f2c = data 2017, 92999 = data 2018], 2019, 2020); edisi judul 2011 TIDAK ada di API gatrik; tak satu pun PDF 2009-2020 berupa gambar (semua punya lapisan teks; hanya edisi 2023 berupa gambar). Judul gatrik "Tahun N" memuat data tahun N-1 pada edisi 2009-2017 (mis. judul 2012 = data 2011); tahun data dibaca dari judul tabel.')
    CELAH.append('ESDM produksi per bahan bakar/jenis pembangkit PER PROVINSI/WILAYAH (Tabel "Produksi Tenaga Listrik PLN per Jenis Pembangkit dan per Wilayah", dan "Pemakaian Bahan Bakar per Jenis Pembangkit per Wilayah") TIDAK diurai untuk 2008-2020: kolom 13-21 jenis bertingkat dua bahasa tersebar di 2-4 blok halaman, sel kosong (bukan "-") di edisi 2018-2020, label provinsi terpotong ke tiga baris, dan urutan kolom bergeser antar edisi; tanpa kolom jumlah per baris tidak ada cek yang memastikan sel tidak tergeser. Pengganti: produksi PLN per jenis per unit/provinsi 2014-2024 dari Statistik PLN Tabel 23 (cek jumlah lolos).')
    CELAH.append('ESDM produksi_nasional_pln_esdm: tabel nasional "Produksi dan Pembelian Tenaga Listrik PLN" per tahun 2000-2020; tiap baris divalidasi (produksi + pembelian = total, selisih <= 1,5 GWh) dan jumlah produksi tiap tahun dibandingkan antar edisi (satu nilai per tahun, kecuali baris 2006 dan 2007 di edisi 2012 yang menyimpang karena label tahun bergeser: dibuang dan dicatat di cek_esdm_nasional). per_jenis_gwh diisi hanya 2000-2014 dari edisi <= 2015 (urutan header cocok dan jumlah jenis = jumlah produksi); edisi >= 2016 tidak (urutan kolom bergeser: 2015 tertulis 11.390,43 di bawah PLTU-M padahal 2014 = 722,98), edisi 2015 baris 2014 jumlah jenis kurang 762,44 GWh (kolom PLTU sewa terhapus) maka hanya total. 2017-2020 hanya total (2017 dari edisi 2018A; edisi 2018B/2019 pasangan blok kolom tak terbaca untuk 2013-2019; edisi 2020 baris 2017 tak lolos). Jumlah produksi ESDM memuat sewa genset, tidak sebanding dengan blok Produksi Sendiri PLN.')
    CELAH.append('ESDM energi_primer_nasional_esdm: Tabel 35 edisi 2010, pemakaian energi primer NASIONAL semua sektor (SBM/BOE) menurut jenis 2003-2009, jumlah jenis = JUMLAH (lolos). Bukan bauran pembangkit listrik. Edisi 2009 memuat deret yang sama tetapi kolom Minyak Bumi terpotong dan 2008 tercatat 1.292.344.517 vs 1.183.204.585 di edisi 2010 (batubara 322.933.800 vs 205.492.060): tidak dibawa. Bauran energi primer PEMBANGKIT PLN (persen) hanya ada di edisi 2021 ke atas (2017-2023 sudah diambil); edisi 2012-2020 tidak memuat tabel bauran.')
    tahun_ok = sorted(PLN)
    return {
        'meta': {'versi': 1, 'dibuat_oleh': 'scripts/panen/statistik_resmi.py', 'tanggal_baca': TGL_BACA, 'tingkat_bukti': 'situs-sendiri',
                 'catatan': 'Kurasi angka dari publikasi resmi (PDF/HTML), tanpa tebakan; tiap baris memuat src ke sumber[].id dan st=sumber. Angka persis dari tabel; kutipan tabel di catatan. Kode provinsi = public/data/wilayah.json (Papua 91, Papua Barat 92), bukan kode BPS mentah.',
                 'tahun_pln_berhasil': tahun_ok, 'cek_total': CEK, 'cek_esdm_nasional': cek_nas, 'celah': CELAH},
        'sumber': [s for s in SUMBER if True],
        'penjualan_provinsi': pj + bps,
        'penjualan_unit_pln': pj_unit,
        'produksi_bahan_bakar': h['produksi'],
        'bauran_energi_primer_pln': bauran,
        'beban_puncak_sistem': h['beban'],
        'saidi_saifi': h['saidi'],
        'mva_provinsi_tegangan': h['mva'],
        'faktor_emisi_resmi': fe,
        'produksi_nasional_pln_esdm': prod_nas,
        'energi_primer_nasional_esdm': energi_primer,
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
