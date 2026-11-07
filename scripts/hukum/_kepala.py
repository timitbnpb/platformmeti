"""Pustaka hukum EBT METI: tarik -> teks -> urai (segmen, relasi, definisi) -> katalog.json + seed.sql.

Arsitektur ditiru dari Pustaka Hukum Posko (poskokarhutla scripts/bnpb/hukum.py). Python 3 stdlib + pdftotext (poppler).
Dijalankan dengan `python3 -I` bila membaca berkas unduhan.

  tarik   regulasi.json (496 baris, PDF BPK) lalu perluasan: JDIH ESDM + peraturan.bpk.go.id (subjek energi) -> data-panen/hukum/
  teks    pdf -> data-panen/hukum/teks/<slug>.json (per halaman; halaman miskin teks dicatat sebagai butuh OCR; tesseract opsional)
  urai    teks -> public/data/hukum/katalog.json + data/hukum/seed.sql
  semua   tarik, teks, urai
Pakai:  python3 -I scripts/hukum/hukum.py urai   |   python3 -I scripts/hukum/hukum.py --cek

Aturan panen: UA METI-Network-research, robots.txt dipatuhi, jeda >= 2 dtk per host, berhenti di 403/429, tanpa login/CAPTCHA.
Mentah (PDF, teks) di data-panen/hukum/ (gitignore); hanya katalog dan seed yang masuk repo.
"""
import argparse, concurrent.futures as cf, datetime as dt, glob, html, json, os, re, shutil, subprocess, sys, tempfile, threading, time
import urllib.error, urllib.parse, urllib.request, urllib.robotparser
from collections import Counter

AB = os.path.dirname(os.path.abspath(__file__))
AKAR = os.path.normpath(os.path.join(AB, "../.."))
MENTAH = os.path.join(AKAR, "data-panen/hukum")
KATALOG = os.path.join(AKAR, "public/data/hukum/katalog.json")
SEED = os.path.join(AKAR, "data/hukum/seed.sql")
REGULASI = os.path.join(AKAR, "public/data/regulasi.json")
UA = "METI-Network-research/0.1 (+https://platformmeti.timitbnpb.workers.dev)"
JEDA = 2.2           # detik per host (aturan: >= 2)
MAKS = 6000          # huruf per segmen (kontrak D1)
POTONG = 1500        # lampiran, penjelasan, bagian tanpa Pasal
MIN_HURUF = 40       # halaman dengan huruf lebih sedikit dari ini = miskin teks (butuh OCR)
SQL_MAKS = 100_000   # byte per pernyataan D1
JENIS_SEG = ("judul", "menimbang", "mengingat", "menetapkan", "pasal", "penjelasan", "lampiran", "lain")
JENIS_REL = ("mengingat", "mencabut", "mengganti", "mengubah", "merujuk")
ADA_OCR = shutil.which("tesseract") is not None


# ───────────────────────── tarik: klien sopan ─────────────────────────
class Sopan:
    """Satu klien: robots.txt, jeda per host, berhenti di 403/429 (host dicatat diblokir)."""
    def __init__(self):
        self.terakhir, self.kunci, self.robots, self.blokir = {}, {}, {}, {}
        self.l = threading.Lock()

    def _robot(self, host, skema):
        if host not in self.robots:
            rp = urllib.robotparser.RobotFileParser()
            try:
                req = urllib.request.Request(f"{skema}://{host}/robots.txt", headers={"User-Agent": UA})
                with urllib.request.urlopen(req, timeout=30) as r:
                    isi = r.read().decode("utf-8", "replace")
                rp.parse(isi.splitlines() if "<html" not in isi[:300].lower() else [])
            except Exception:
                rp.parse([])
            self.robots[host] = rp
        return self.robots[host]

    def ambil(self, url, biner=False, tries=2):
        u = urllib.parse.urlparse(url)
        host = u.netloc
        if host in self.blokir:
            return None
        with self.l:
            kunci = self.kunci.setdefault(host, threading.Lock())
        with kunci:
            if not self._robot(host, u.scheme).can_fetch(UA, url):
                print("  robots melarang", url, flush=True)
                return None
            for coba in range(tries):
                tunggu = self.terakhir.get(host, 0) + JEDA - time.time()
                if tunggu > 0:
                    time.sleep(tunggu)
                try:
                    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
                    with urllib.request.urlopen(req, timeout=90) as r:
                        d = r.read()
                    self.terakhir[host] = time.time()
                    return d if biner else d.decode("utf-8", "replace")
                except urllib.error.HTTPError as e:
                    self.terakhir[host] = time.time()
                    if e.code in (403, 429):
                        self.blokir[host] = e.code
                        print(f"  BERHENTI {host}: HTTP {e.code}", flush=True)
                        return None
                    if e.code in (404, 410):
                        return None
                except Exception as e:
                    self.terakhir[host] = time.time()
                    print("  gagal", coba, url[:100], str(e)[:60], flush=True)
                    time.sleep(3)
            return None


K = Sopan()


def teks_html(s):
    s = re.sub(r"<script.*?</script>|<style.*?</style>", "", s, flags=re.S)
    return [l.strip() for l in html.unescape(re.sub(r"<[^>]+>", "\n", s)).splitlines() if l.strip()]


def host_resmi(url):
    h = urllib.parse.urlparse(url or "").netloc.lower()
    return h, h.endswith(".go.id")


ENERGI = re.compile(r"energi|listrik|ketenagalistrikan|panas\s*bumi|bioenergi|bahan\s*bakar\s*nabati|biodiesel|bioetanol|karbon|emisi|"
                    r"surya|\bbayu\b|\bangin\b|hidro|biomassa|biogas|sampah|pembangkit|tingkat\s*komponen\s*dalam\s*negeri|tkdn|konservasi|efisiensi|"
                    r"kendaraan\s*bermotor\s*listrik|baterai|hidrogen|nuklir|gas\s*bumi|iklim|insentif|pajak", re.I)
KATA_CARI = ["energi terbarukan", "ketenagalistrikan", "panas bumi", "bioenergi", "konservasi energi", "efisiensi energi", "nilai ekonomi karbon",
             "kendaraan bermotor listrik", "tingkat komponen dalam negeri", "pembangkit listrik tenaga surya", "jual beli tenaga listrik",
             "usaha penyediaan tenaga listrik", "energi baru", "kebijakan energi nasional", "rencana umum energi", "bahan bakar nabati",
             "tenaga air", "biomassa", "hidrogen", "penyimpanan energi", "insentif perpajakan energi", "karbon", "tenaga angin"]
TOPIK_KATA = {"surya": r"surya|plts", "angin": r"\bangin\b|\bbayu\b", "hidro": r"\bhidro\b|tenaga air|plta", "panas_bumi": r"panas\s*bumi",
              "bioenergi": r"bioenergi|biomassa|biogas|biodiesel|nabati|bioetanol", "karbon": r"karbon|emisi|iklim", "efisiensi": r"konservasi|efisiensi",
              "tkdn": r"komponen dalam negeri|tkdn", "hidrogen": r"hidrogen", "nuklir": r"nuklir", "penyimpanan": r"baterai|penyimpanan",
              "jaringan": r"ketenagalistrikan|tenaga listrik|jual beli", "insentif": r"insentif|pajak|fiskal", "kendaraan_listrik": r"kendaraan.*listrik"}


def topik_dari(judul):
    return [k for k, rx in TOPIK_KATA.items() if re.search(rx, judul or "", re.I)]


def simpan_indeks(indeks):
    os.makedirs(MENTAH, exist_ok=True)
    tmp = f"{MENTAH}/indeks.json.tmp"
    json.dump(indeks, open(tmp, "w"), ensure_ascii=False, indent=0)
    os.replace(tmp, f"{MENTAH}/indeks.json")


def muat_indeks():
    f = f"{MENTAH}/indeks.json"
    return json.load(open(f)) if os.path.exists(f) else {}


def pdf_sah(data):
    return bool(data) and data[:5] == b"%PDF-"


def cocok_nomor(fp, nomor, tahun):
    """Halaman 1 (atau 2) memuat NOMOR n dan tahun y yang cocok. Tanpa teks (pindaian) = tidak bisa diperiksa -> False."""
    hs = halaman_pdf(fp, 2)
    t = re.sub(r"\s+", " ", " ".join(hs[:2])).upper()
    if huruf(t) < MIN_HURUF:
        return False, "halaman 1 tanpa teks (pindaian), tidak dapat diperiksa"
    n = re.search(r"\d+", str(nomor or ""))
    if not n:
        return False, "nomor tidak berangka"
    n = n.group(0).lstrip("0") or "0"
    ada_n = re.search(r"N[O0]M[O0]R\s*[:.]?\s*0*" + n + r"\b", t) or re.search(r"\bNO\.?\s*0*" + n + r"\b", t) or re.search(r"\b0*" + n + r"\s*/?\s*(?:TAHUN|TH\.?)\s*" + str(tahun), t)
    ada_t = str(tahun) in t
    if ada_n and ada_t:
        return True, ""
    return False, f"halaman 1 tidak memuat NOMOR {n} TAHUN {tahun}"


def nama_pdf(slug):
    return os.path.join(MENTAH, "pdf", slug + ".pdf")


def unduh(e):
    """Unduh PDF entri e (e['pdf_url']) dan periksa nomor/tahun. Mengubah e di tempat."""
    if e.get("pdf_ok") is not None or not e.get("pdf_url"):
        return
    os.makedirs(f"{MENTAH}/pdf", exist_ok=True)
    p = nama_pdf(e["slug"])
    if not (os.path.exists(p) and pdf_sah(open(p, "rb").read(5))):
        d = K.ambil(e["pdf_url"], biner=True)
        if not pdf_sah(d):
            e["pdf_ok"], e["galat"] = False, "unduhan gagal atau bukan PDF"
            return
        open(p, "wb").write(d)
    ok, why = cocok_nomor(p, e.get("nomor"), e.get("tahun"))
    e["pdf_ok"], e["galat"] = ok, why or None
    if not ok:
        e["pdf_ditolak"] = True


def entri_dasar(r):
    jenis = r["jenis"]
    inst = r.get("instansi_penerbit") or ""
    e = {"slug": r["id"], "regulasi_id": r["id"], "jenis": jenis, "nomor": str(r.get("nomor") or ""), "tahun": r.get("tahun"),
         "judul": r["judul"], "instansi": inst, "status": r.get("status"), "tgl_tetap": r.get("tanggal_ditetapkan"),
         "url": r.get("url_sumber"), "pdf_url": r.get("url_pdf"), "topik": r.get("topik") or [], "sumber_awal": "regulasi.json"}
    e["sumber"], e["resmi"] = host_resmi(e["url"] or e["pdf_url"])
    return e


def tarik_dasar(indeks, batas=None):
    baris = json.load(open(REGULASI))["baris"]
    n = 0
    for r in baris:
        if r["id"] in indeks and indeks[r["id"]].get("pdf_ok") is not None:
            continue
        e = indeks.setdefault(r["id"], entri_dasar(r))
        unduh(e)
        n += 1
        if n % 10 == 0:
            simpan_indeks(indeks)
            print(f"  dasar {n}: ok {sum(1 for v in indeks.values() if v.get('pdf_ok'))}", flush=True)
        if K.blokir.get("peraturan.bpk.go.id"):
            break
    simpan_indeks(indeks)


# ── perluasan: JDIH ESDM (utama untuk EBT) ──
ESDM = "https://jdih.esdm.go.id"


def tarik_esdm(indeks, maks=450):
    """Daftar pencarian judul /dokumen/peraturan (Yii): item memuat 'X Nomor N Tahun Y tentang Z' dan tautan unduh."""
    sudah = {v.get("kunci_awal") for v in indeks.values()}
    baru = 0
    for kata_ in KATA_CARI:
        for hal in range(1, 6):
            q = urllib.parse.urlencode({"DokumenSearch[judul]": kata_, "per-page": 50, "page": hal})
            h = K.ambil(f"{ESDM}/dokumen/peraturan?{q}")
            if not h:
                break
            items = re.findall(r'<div class="item" data-key="(\d+)">(.*?)</div></div></div></div></div>', h, flags=re.S) or \
                [(m.group(1), m.group(0)) for m in re.finditer(r'<div class="item" data-key="(\d+)">.*?(?=<div class="item" data-key=|</div>\s*<div class="summary|$)', h, flags=re.S)]
            if not items:
                break
            for did, blok in items:
                t = re.search(r'href="/dokumen/view\?id=\d+"[^>]*>(.*?)</a>', blok, flags=re.S)
                if not t:
                    continue
                judul_penuh = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", t.group(1)))).strip()
                m = RX_SITASI.search(judul_penuh)
                if not m:
                    continue
                key = kunci_sitasi(m)
                tg = RX_TENTANG.match(judul_penuh, m.end())
                judul = (tg["t"] if tg else judul_penuh).strip(" .")
                if not ENERGI.search(judul) or key in sudah or key in indeks:
                    continue
                dl = re.search(r'href="(/dokumen/download\?id=[^"]+)"', blok)
                if not dl:
                    continue
                e = {"slug": "esdm-" + did, "regulasi_id": None, "kunci_awal": key, "jenis": key.split("-")[0], "nomor": m["no"], "tahun": int(m["th"]),
                     "judul": judul, "instansi": "", "status": None, "tgl_tetap": None, "url": f"{ESDM}/dokumen/view?id={did}",
                     "pdf_url": ESDM + html.unescape(dl.group(1)), "topik": topik_dari(judul), "sumber_awal": "jdih.esdm.go.id"}
                e["sumber"], e["resmi"] = host_resmi(e["url"])
                indeks[e["slug"]] = e
                sudah.add(key)
                unduh(e)
                baru += 1
                if baru % 10 == 0:
                    simpan_indeks(indeks)
                    print(f"  esdm {baru}", flush=True)
                if baru >= maks or K.blokir.get("jdih.esdm.go.id"):
                    simpan_indeks(indeks)
                    return
            if len(items) < 50:
                break
    simpan_indeks(indeks)


# ── perluasan: peraturan.bpk.go.id (cadangan dan tambahan) ──
BPK = "https://peraturan.bpk.go.id"


def tarik_bpk(indeks, maks=350, maks_perda=120):
    sudah_id = {re.search(r"/Details/(\d+)", v.get("url") or "") and re.search(r"/Details/(\d+)", v["url"]).group(1) for v in indeks.values()}
    sudah = {v.get("kunci_awal") for v in indeks.values()} | set(indeks)
    baru = perda = 0
    for kata_ in KATA_CARI:
        for hal in range(1, 8):
            q = urllib.parse.urlencode({"keywords": kata_, "jenis": "", "entitas": "", "tahun": "", "nomor": "", "p": hal})
            h = K.ambil(f"{BPK}/Search?{q}")
            if not h:
                break
            kartu = re.findall(r'href="/Details/(\d+)/([^"]+)">\s*(.*?)\s*</a>.*?<a href="/Details/\d+/[^"]+">\s*(.*?)\s*</a>', h, flags=re.S)
            if not kartu:
                break
            for did, slug, nama, judul in kartu:
                nama = re.sub(r"\s+", " ", html.unescape(nama)).strip()
                judul = re.sub(r"\s+", " ", html.unescape(judul)).strip()
                if did in sudah_id or not ENERGI.search(judul):
                    continue
                m = RX_SITASI.search(nama)
                if not m:
                    continue
                key = kunci_sitasi(m)
                if key in sudah:
                    continue
                if key.startswith(("perda", "pergub", "perbup", "perwal")):
                    if perda >= maks_perda:
                        continue
                    perda += 1
                d = K.ambil(f"{BPK}/Details/{did}/{slug}")
                if not d:
                    continue
                dl = re.search(r'href="(/Download/[^"]+\.pdf)"', d, flags=re.I)
                L = teks_html(d)
                st = None
                if "Status" in L and L.index("Status") + 1 < len(L):
                    st = {"berlaku": "berlaku", "tidak berlaku": "dicabut"}.get(L[L.index("Status") + 1].lower())
                if st == "berlaku" and any(x.startswith("Diubah dengan") for x in L):
                    st = "diubah"
                tgl = next((re.search(r"(\d{1,2} \w+ \d{4})", l)[1] for l in L if "mulai berlaku pada tanggal" in l and re.search(r"(\d{1,2} \w+ \d{4})", l)), None)
                e = {"slug": "bpk-" + did, "regulasi_id": None, "kunci_awal": key, "jenis": key.split("-")[0], "nomor": m["no"], "tahun": int(m["th"]),
                     "judul": judul, "instansi": "", "status": st, "tgl_tetap": tanggal(tgl) if tgl else None, "url": f"{BPK}/Details/{did}/{slug}",
                     "pdf_url": BPK + urllib.parse.quote(urllib.parse.unquote(dl.group(1)), safe="/%") if dl else None,
                     "topik": topik_dari(judul), "sumber_awal": "peraturan.bpk.go.id"}
                e["sumber"], e["resmi"] = host_resmi(e["url"])
                indeks[e["slug"]] = e
                sudah.add(key); sudah_id.add(did)
                unduh(e)
                baru += 1
                if baru % 10 == 0:
                    simpan_indeks(indeks)
                    print(f"  bpk {baru}", flush=True)
                if baru >= maks or K.blokir.get("peraturan.bpk.go.id"):
                    simpan_indeks(indeks)
                    return
            if len(kartu) < 5:
                break
    simpan_indeks(indeks)


def tarik(dasar=True, esdm=True, bpk=True, maks_esdm=450, maks_bpk=350):
    indeks = muat_indeks()
    kunci_i = threading.Lock()
    tugas = []
    # Dua host berjalan paralel (jeda per host tetap berlaku). Tiap tugas menulis ke salinan lalu digabung.
    if dasar or bpk:
        tugas.append(("bpk", lambda i: (tarik_dasar(i) if dasar else None, tarik_bpk(i, maks_bpk) if bpk else None)))
    if esdm:
        tugas.append(("esdm", lambda i: tarik_esdm(i, maks_esdm)))
    hasil = {}
    def jalan(nama, fn):
        lokal = json.loads(json.dumps(indeks))
        fn(lokal)
        hasil[nama] = lokal
    with cf.ThreadPoolExecutor(2) as ex:
        for f in [ex.submit(jalan, n, fn) for n, fn in tugas]:
            f.result()
    gab = dict(indeks)
    for lokal in hasil.values():
        for k, v in lokal.items():
            if k not in gab or (gab[k].get("pdf_ok") is None and v.get("pdf_ok") is not None):
                gab[k] = v
    simpan_indeks(gab)
    ok = sum(1 for v in gab.values() if v.get("pdf_ok"))
    print(f"indeks {len(gab)}  PDF sah {ok}  ditolak {sum(1 for v in gab.values() if v.get('pdf_ditolak'))}  diblokir {dict(K.blokir)}")
    json.dump({"blokir": dict(K.blokir)}, open(f"{MENTAH}/blokir.json", "w"))


# ───────────────────────── teks ─────────────────────────
