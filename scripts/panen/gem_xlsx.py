"""GEM xlsx -> JSON baris Indonesia (stdlib saja; tanpa makro, tanpa openpyxl).

Pakai: python3 -I scripts/panen/gem_xlsx.py <folder-xlsx> <folder-keluaran>
Berkas unduhan = data tak tepercaya: hanya dibaca sebagai zip+XML, tidak dieksekusi.
Keluaran: <keluar>/<kunci>.json = {"berkas","lembar":{nama:{"kolom":[...],"baris":[{kolom:nilai}]}}}
Lisensi GEM: CC BY 4.0 (atribusi wajib). Data mentah tidak masuk repo (data-panen/gem/).
"""
import sys, os, re, json, zipfile
import xml.etree.ElementTree as ET

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
RNS = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
KUNCI = {'solar': 'Solar', 'wind': 'Wind', 'hydropower': 'Hydropower', 'geothermal': 'Geothermal', 'coal': 'Coal-Plant'}


def kol_idx(ref):
    n = 0
    for c in re.match(r'[A-Z]+', ref).group(0):
        n = n * 26 + ord(c) - 64
    return n - 1


def baca_ss(z):
    ss = []
    if 'xl/sharedStrings.xml' not in z.namelist():
        return ss
    with z.open('xl/sharedStrings.xml') as f:
        for _, el in ET.iterparse(f):
            if el.tag == NS + 'si':
                ss.append(''.join(t.text or '' for t in el.iter(NS + 't')))
                el.clear()
    return ss


def lembar_daftar(z):
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    rel = {r.get('Id'): r.get('Target') for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
    out = []
    for s in wb.iter(NS + 'sheet'):
        t = rel[s.get(RNS + 'id')].lstrip('/')
        out.append((s.get('name'), t if t.startswith('xl/') else 'xl/' + t))
    return out


def baca_lembar(z, path, ss):
    kolom, baris, n_total = None, [], 0
    with z.open(path) as f:
        for _, el in ET.iterparse(f):
            if el.tag != NS + 'row':
                continue
            v = {}
            for c in el.iter(NS + 'c'):
                x = c.find(NS + 'v')
                if c.get('t') == 'inlineStr':
                    val = ''.join(t.text or '' for t in c.iter(NS + 't'))
                elif x is None or x.text is None:
                    continue
                elif c.get('t') == 's':
                    val = ss[int(x.text)]
                else:
                    val = x.text
                v[kol_idx(c.get('r'))] = val
            el.clear()
            if kolom is None:
                if v:
                    kolom = [v.get(i, '').strip() for i in range(max(v) + 1)]
                continue
            n_total += 1
            d = {kolom[i]: s for i, s in v.items() if i < len(kolom) and kolom[i] and s != ''}
            if any(k.lower().startswith('country/area') and d[k].strip().lower() == 'indonesia' for k in d):
                baris.append(d)
    return {'kolom': kolom or [], 'baris_total': n_total, 'baris': baris}


def main(masuk, keluar):
    os.makedirs(keluar, exist_ok=True)
    for fn in sorted(os.listdir(masuk)):
        if not fn.lower().endswith('.xlsx'):
            continue
        kunci = next((k for k, v in KUNCI.items() if v.lower() in fn.lower()), None)
        if not kunci:
            continue
        with zipfile.ZipFile(os.path.join(masuk, fn)) as z:
            ss = baca_ss(z)
            hasil = {'berkas': fn, 'lembar': {}}
            for nama, path in lembar_daftar(z):
                if nama.lower() in ('about',):
                    continue
                hasil['lembar'][nama] = baca_lembar(z, path, ss)
        with open(os.path.join(keluar, kunci + '.json'), 'w', encoding='utf-8') as f:
            json.dump(hasil, f, ensure_ascii=False)
        print(kunci, {k: (len(v['baris']), v['baris_total']) for k, v in hasil['lembar'].items()})


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
