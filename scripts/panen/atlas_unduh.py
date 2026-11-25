#!/usr/bin/env python3
"""Unduh atlas potensi surya/angin Indonesia ke <MENTAH>/atlas/ (CC BY 4.0; lihat lisensi di bawah).
  - Global Solar Atlas v2 (World Bank / Solargis), PVOUT tahunan rata-rata jangka panjang, kWh/kWp/tahun.
    Zip negara 349 MB dibaca LEWAT HTTP Range: hanya PVOUT.tif (+ .xml) yang diambil, bukan seluruh zip.
  - Global Wind Atlas v4 (DTU / World Bank), kecepatan angin 100 m (m/s), GeoTIFF negara via globalwindatlas.info.
Pakai: python3 scripts/panen/atlas_unduh.py <dirMentah>   (default ../platformmeti-mentah)
Tanpa dependensi di luar stdlib. Satu permintaan per berkas; tak ada otomasi HTTP ke 1001startup.id."""
import io, os, sys, time, urllib.request, urllib.error, zipfile

UA = 'METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)'  # sama dengan scripts/pipa/data_transmisi.mjs
JEDA = 2.0  # detik antar permintaan

def req(url, **h):
    time.sleep(JEDA)
    return urllib.request.Request(url, headers={'User-Agent': UA, **h})

ZIP = 'Indonesia_GISdata_LTAym_YearlyMonthlyTotals_GlobalSolarAtlas-v2_GEOTIFF.zip'
GSA = 'https://api.globalsolaratlas.info/download/Indonesia/' + ZIP
GWA = 'https://globalwindatlas.info/api/gis/country/IDN/wind-speed/100'

class _NoRedir(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None

def lokasi(url):  # URL bertanda tangan S3 (kedaluwarsa 15 menit) dari 302
    try: urllib.request.build_opener(_NoRedir).open(req(url))
    except urllib.error.HTTPError as e:
        if e.code in (301, 302): return e.headers['Location']
        raise
    return url

class HttpRange(io.RawIOBase):
    def __init__(s, url):
        s.u = lokasi(url); r = urllib.request.urlopen(req(s.u, Range='bytes=0-0'))
        s.n = int(r.headers['Content-Range'].split('/')[1]); s.p = 0
    def seekable(s): return True
    def readable(s): return True
    def tell(s): return s.p
    def seek(s, o, w=0): s.p = o if w == 0 else s.p + o if w == 1 else s.n + o; return s.p
    def readinto(s, b):
        if s.p >= s.n: return 0
        e = min(s.n - 1, s.p + len(b) - 1)
        d = urllib.request.urlopen(req(s.u, Range='bytes=%d-%d' % (s.p, e))).read()
        b[:len(d)] = d; s.p += len(d); return len(d)

def main():
    mentah = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..', '..', 'platformmeti-mentah')
    out = os.path.join(mentah, 'atlas'); os.makedirs(out, exist_ok=True)
    z = zipfile.ZipFile(io.BufferedReader(HttpRange(GSA), 1 << 20))
    for i in z.infolist():
        if i.filename.endswith('/PVOUT.tif') or i.filename.endswith('/PVOUT.tif.xml'):
            with open(os.path.join(out, 'GSA_PVOUT.tif' + ('.xml' if i.filename.endswith('.xml') else '')), 'wb') as f: f.write(z.read(i))
    dst = os.path.join(out, 'IDN_wind-speed_100m.tif')
    if not os.path.exists(dst):
        with urllib.request.urlopen(req(GWA)) as r, open(dst + '.tmp', 'wb') as f:
            jenis = r.headers.get('Content-Type', '')
            if 'tiff' not in jenis and 'octet-stream' not in jenis: sys.exit('GWA: tipe tak terduga ' + jenis)
            while True:
                b = r.read(1 << 20)
                if not b: break
                f.write(b)
        with open(dst + '.tmp', 'rb') as f: kepala = f.read(4)
        if kepala not in (b'II*\x00', b'MM\x00*') or os.path.getsize(dst + '.tmp') < (1 << 20):
            os.remove(dst + '.tmp'); sys.exit('GWA: bukan GeoTIFF utuh')
        os.rename(dst + '.tmp', dst)
    print('ok', out)

if __name__ == '__main__': main()
