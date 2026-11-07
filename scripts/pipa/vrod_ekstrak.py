"""Ekstrak baris Indonesia dari VROD registry files (xlsx, CC BY 4.0, Berkeley) tanpa pustaka luar.
pakai: python3 vrod_ekstrak.py <vrod.xlsx> <keluaran.json>
Sheet yang dibaca: Verra VCS Projects/Issuances/Retirements, Gold Projects/Issuances/Retirements."""
import json, re, sys, zipfile
import xml.etree.ElementTree as ET
NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
RNS = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
SHEET = ['Verra VCS Projects', 'Verra VCS Issuances', 'Verra VCS Retirements', 'Gold Projects', 'Gold Issuances', 'Gold Retirements']

def kolom(ref):
    n = 0
    for ch in re.match(r'[A-Z]+', ref).group(0): n = n * 26 + ord(ch) - 64
    return n - 1

def baca(z, path, ss):
    h = None
    for _, el in ET.iterparse(z.open(path)):
        if el.tag != NS + 'row': continue
        v = {}
        for c in el.findall(NS + 'c'):
            t = c.get('t'); x = c.find(NS + 'v')
            if t == 'inlineStr': val = ''.join(i.text or '' for i in c.iter(NS + 't'))
            elif x is None: continue
            elif t == 's': val = ss[int(x.text)]
            elif t in ('str', 'e', 'b'): val = x.text
            else:
                try: val = float(x.text); val = int(val) if val == int(val) else val
                except ValueError: val = x.text
            v[kolom(c.get('r'))] = val
        el.clear()
        if h is None: h = [v.get(i) for i in range(max(v) + 1)] if v else None; continue
        yield {h[i]: v[i] for i in v if i < len(h) and h[i]}

def main(src, out):
    z = zipfile.ZipFile(src)
    ss = [''.join(t.text or '' for t in si.iter(NS + 't')) for _, si in ET.iterparse(z.open('xl/sharedStrings.xml')) if si.tag == NS + 'si']
    wb = ET.parse(z.open('xl/workbook.xml')).getroot()
    rel = {r.get('Id'): r.get('Target') for r in ET.parse(z.open('xl/_rels/workbook.xml.rels')).getroot()}
    hasil = {}
    for s in wb.find(NS + 'sheets'):
        if s.get('name') not in SHEET: continue
        p = rel[s.get(RNS + 'id')]; p = p.lstrip('/') if p.startswith('/') else 'xl/' + p
        kc = 'Country'
        hasil[s.get('name')] = [r for r in baca(z, p, ss) if str(r.get(kc, '')).strip().lower() == 'indonesia']
        print(s.get('name'), len(hasil[s.get('name')]), file=sys.stderr)
    json.dump(hasil, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)

if __name__ == '__main__': main(sys.argv[1], sys.argv[2])
