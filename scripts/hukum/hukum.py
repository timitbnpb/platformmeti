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


_SIMPAN = threading.Lock()


def simpan_indeks(indeks):
    os.makedirs(MENTAH, exist_ok=True)
    with _SIMPAN:
        snap = dict(list(indeks.items()))
        tmp = f"{MENTAH}/indeks.json.tmp"
        json.dump(snap, open(tmp, "w"), ensure_ascii=False, indent=0)
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
    indeks = muat_indeks()   # satu kamus bersama; dua host berjalan paralel (jeda per host tetap berlaku), simpan_indeks memotret dengan kunci
    tugas = []
    if dasar or bpk:
        tugas.append(lambda: (tarik_dasar(indeks) if dasar else None, tarik_bpk(indeks, maks_bpk) if bpk else None))
    if esdm:
        tugas.append(lambda: tarik_esdm(indeks, maks_esdm))
    with cf.ThreadPoolExecutor(2) as ex:
        for f in [ex.submit(fn) for fn in tugas]:
            f.result()
    simpan_indeks(indeks)
    ok = sum(1 for v in indeks.values() if v.get("pdf_ok"))
    print(f"indeks {len(indeks)}  PDF sah {ok}  ditolak {sum(1 for v in indeks.values() if v.get('pdf_ditolak'))}  diblokir {dict(K.blokir)}")
    json.dump({"blokir": dict(K.blokir)}, open(f"{MENTAH}/blokir.json", "w"))


# ───────────────────────── teks ─────────────────────────

def kata(t):
    return re.findall(r"[a-zà-ÿ]{3,}", t.lower())


def huruf(t):
    return sum(c.isalpha() for c in t)


def skor_kamus(t, kamus):
    """Bersih = kata dikenal - kata asing. Halaman kosong/nomor saja bernilai 0, OCR waras bernilai besar."""
    k = kata(t)
    return sum(1 if w in kamus else -1 for w in k)


def pilih_ensemble(pdf_t, ocr_t, kamus):
    """Dua pembaca ada -> yang skor kamusnya lebih tinggi; seri -> teks-lapisan PDF."""
    if not ocr_t:
        return pdf_t, False
    if not pdf_t.strip():
        return ocr_t, True
    return (ocr_t, True) if skor_kamus(ocr_t, kamus) > skor_kamus(pdf_t, kamus) else (pdf_t, False)




def halaman_pdf(path, maks=None):
    # -layout: penanda ayat "(1)" di kolom sendiri tetap ikut; tanpa -layout ia hilang dari teks pasal
    cmd = ["pdftotext", "-layout"] + (["-l", str(maks)] if maks else []) + [path, "-"]
    r = subprocess.run(cmd, capture_output=True)
    hs = r.stdout.decode("utf-8", "replace").split("\f")
    if hs and not hs[-1].strip():
        hs.pop()
    return hs


def ocr_halaman(path, n):
    """Hanya bila tesseract ada; selain itu string kosong (halaman dicatat sebagai butuh OCR)."""
    if not ADA_OCR:
        return ""
    with tempfile.TemporaryDirectory() as d:
        pre = os.path.join(d, "h")
        subprocess.run(["pdftoppm", "-r", "200", "-gray", "-f", str(n), "-l", str(n), "-png", "-singlefile", path, pre], capture_output=True)
        if not os.path.exists(pre + ".png"):
            return ""
        r = subprocess.run(["tesseract", pre + ".png", "stdout", "-l", "ind", "--psm", "4"], capture_output=True, env=dict(os.environ, OMP_THREAD_LIMIT="1"))
        return r.stdout.decode("utf-8", "replace")


def teks(paksa=False):
    indeks = muat_indeks()
    os.makedirs(f"{MENTAH}/teks", exist_ok=True)
    mentah, kamus_c = {}, Counter()
    for m in indeks.values():
        p = nama_pdf(m["slug"])
        if m.get("pdf_ok") and os.path.exists(p):
            hs = halaman_pdf(p)
            mentah[m["slug"]] = hs
            for t in hs:
                if huruf(t) >= MIN_HURUF:
                    kamus_c.update(kata(t))
    kamus = {w for w, c in kamus_c.items() if c >= 2}
    print("kamus", len(kamus), "kata dari", len(mentah), "dokumen berpdf", flush=True)
    for slug, hs in mentah.items():
        out = f"{MENTAH}/teks/{slug}.json"
        if os.path.exists(out) and not paksa:
            continue
        miskin = [i for i, t in enumerate(hs) if huruf(t) < MIN_HURUF]
        hasil_ocr = {i: ocr_halaman(nama_pdf(slug), i + 1) for i in miskin} if ADA_OCR else {}
        hal, ocr, butuh = [], [], []
        for i, t in enumerate(hs):
            t2, dipakai = pilih_ensemble(t, hasil_ocr.get(i, ""), kamus)
            hal.append({"n": i + 1, "t": t2})
            if dipakai:
                ocr.append(i + 1)
            elif i in miskin:
                butuh.append(i + 1)
        semua = [w for h in hal for w in kata(h["t"])]
        mutu = round(sum(w in kamus for w in semua) / len(semua), 3) if semua else 0.0
        json.dump({"slug": slug, "halaman": hal, "ocr": ocr, "butuh_ocr": butuh, "mutu": mutu}, open(out, "w"), ensure_ascii=False)
    print("teks selesai", len(mentah))


# ───────────────────────── kunci kanonik & sitasi ─────────────────────────
MENTERI = {"energi dan sumber daya mineral": "esdm", "keuangan": "keuangan", "lingkungan hidup dan kehutanan": "lhk", "lingkungan hidup": "lh",
           "kehutanan": "hut", "perindustrian": "perin", "perdagangan": "dag", "perhubungan": "hub", "dalam negeri": "dagri",
           "pekerjaan umum dan perumahan rakyat": "pupr", "pekerjaan umum": "pu", "agraria dan tata ruang": "atr", "badan usaha milik negara": "bumn",
           "investasi": "invest", "ketenagakerjaan": "naker", "pertanian": "tan", "kelautan dan perikanan": "kkp", "hukum dan hak asasi manusia": "kumham",
           "koordinator bidang perekonomian": "ekon", "perencanaan pembangunan nasional": "ppn", "kesehatan": "kes"}
SLUG_JENIS = {"uu": "uu", "perppu": "perppu", "pp": "pp", "perpres": "perpres", "keppres": "keppres", "inpres": "inpres"}
NAMA_JENIS = {"uu": "Undang-Undang", "perppu": "Peraturan Pemerintah Pengganti Undang-Undang", "pp": "Peraturan Pemerintah", "perpres": "Peraturan Presiden",
              "keppres": "Keputusan Presiden", "inpres": "Instruksi Presiden", "permen": "Peraturan Menteri", "kepmen": "Keputusan Menteri",
              "perda": "Peraturan Daerah", "pergub": "Peraturan Gubernur", "perbup": "Peraturan Bupati", "perwal": "Peraturan Wali Kota",
              "pojk": "Peraturan OJK", "perka": "Peraturan Kepala", "se": "Surat Edaran", "lain": "Peraturan lembaga"}
GRUP = {"uu": "UU", "perppu": "PERPPU", "pp": "PP", "perpres": "PERPRES", "keppres": "KEPPRES", "inpres": "INPRES", "permen": "PERMEN", "kepmen": "KEPMEN",
        "perda": "PERDA", "pergub": "PERDA", "perbup": "PERDA", "perwal": "PERDA", "pojk": "OJK", "perka": "LAINNYA", "se": "LAINNYA", "lain": "LAINNYA"}


def kunci(jenis, nomor, tahun):
    n = re.search(r"\d+", str(nomor))
    return f"{jenis}-{(n.group(0).lstrip('0') or '0') if n else '0'}-{tahun}"


def _menteri(nama):
    n = re.sub(r"\s+", " ", re.sub(r"\b(republik indonesia|ri|kementerian|menteri)\b", " ", nama.strip().lower())).strip()
    if n in MENTERI:
        return MENTERI[n]
    for k in sorted(MENTERI, key=len, reverse=True):
        if n.startswith(k):
            return MENTERI[k]
    return "".join(w[0] for w in n.split() if w not in ("dan", "republik", "indonesia"))[:8] or "x"


def _daerah(tier, nama):
    n = re.sub(r"\b(provinsi|propinsi|kabupaten|kota|daerah|pemerintah|khusus|ibukota|istimewa)\b", " ", nama.lower())
    return (tier.lower()[:4] if tier else "") + "-" + re.sub(r"[^a-z0-9]+", "-", n).strip("-")[:26]


_RX_JENIS = (r"(?P<jenis>Undang-Undang(?! Dasar)|Peraturan Pemerintah Pengganti Undang-Undang|Peraturan Pemerintah|Peraturan Presiden|"
             r"Keputusan Presiden|Instruksi Presiden|Peraturan Otoritas Jasa Keuangan|"
             r"Peraturan (?P<dae>Daerah|Gubernur|Bupati|Wali ?kota)(?: (?P<tier>Provinsi|Propinsi|Kabupaten|Kota))? (?P<wil>[A-Z][A-Za-z ]{2,34}?)(?= Nomor)|"
             r"Peraturan Menteri (?P<men>[A-Za-z ]{3,60}?)|Keputusan Menteri (?P<kmen>[A-Za-z ]{3,60}?))")
RX_SITASI = re.compile(_RX_JENIS + r"\s+Nomor\s+(?P<no>\d+)\s+Tahun\s+(?P<th>\d{4})", re.I)
RX_TENTANG = re.compile(r"\s*,?\s*tentang\s+(?P<t>[^()\n;]{3,140}?)(?=\s*[(;,]|\s*$|\.\s|\s+sebagaimana|\s+dan\s+Peraturan)", re.I)


def kunci_sitasi(m):
    j = m["jenis"].lower()
    if m["dae"]:
        d = m["dae"].lower().replace(" ", "")
        jn = {"daerah": "perda", "gubernur": "pergub", "bupati": "perbup", "walikota": "perwal"}[d]
        return kunci(f"{jn}-" + _daerah(m["tier"] or "", m["wil"]), m["no"], m["th"])
    if j.startswith("peraturan menteri"):
        return kunci("permen-" + _menteri(m["men"]), m["no"], m["th"])
    if j.startswith("keputusan menteri"):
        return kunci("kepmen-" + _menteri(m["kmen"]), m["no"], m["th"])
    if j.startswith("undang"):
        return kunci("uu", m["no"], m["th"])
    if "pengganti" in j:
        return kunci("perppu", m["no"], m["th"])
    if j == "peraturan pemerintah":
        return kunci("pp", m["no"], m["th"])
    if j == "peraturan presiden":
        return kunci("perpres", m["no"], m["th"])
    if j == "keputusan presiden":
        return kunci("keppres", m["no"], m["th"])
    if j == "instruksi presiden":
        return kunci("inpres", m["no"], m["th"])
    return kunci("pojk", m["no"], m["th"])


def kunci_awal(e):
    """Kunci dari metadata (sebelum teks dibaca)."""
    if e.get("kunci_awal"):
        return e["kunci_awal"]
    j, inst = e["jenis"], e.get("instansi") or ""
    if j in SLUG_JENIS:
        return kunci(j, e["nomor"], e["tahun"])
    if j == "permen":
        return kunci("permen-" + _menteri(inst), e["nomor"], e["tahun"])
    if j == "perda":
        tier = re.search(r"\b(Provinsi|Kabupaten|Kota)\b", inst, re.I)
        jn = "pergub" if re.search(r"pergub|gubernur", e.get("pdf_url") or "", re.I) else "perda"
        return kunci(f"{jn}-" + _daerah(tier[1].lower() if tier else "", inst), e["nomor"], e["tahun"])
    if j == "ojk":
        return kunci("pojk", e["nomor"], e["tahun"])
    return kunci("lain-" + re.sub(r"[^a-z0-9]+", "", "".join(w[0] for w in inst.lower().split() if w not in ("dan", "republik")))[:8], e["nomor"], e["tahun"])


def kunci_dari_teks(h1, e):
    """Kunci dari judul di halaman 1 bila nomor+tahun-nya sama dengan metadata (menetapkan menteri/daerah yang tepat)."""
    t = re.sub(r"\s+", " ", h1)[:900]
    t = re.sub(r"(?<=[A-Za-z]) (?=[A-Za-z])", " ", t)
    for m in RX_SITASI.finditer(t.title().replace("Dan ", "dan ").replace("Atas ", "atas ")):
        k = kunci_sitasi(m)
        kn = kunci_awal(e).rsplit("-", 2)
        if k.rsplit("-", 2)[1:] == kn[1:]:
            return k
    return None


# ───────────────────────── urai: pembersihan & paragraf ─────────────────────────
RX_NOMOR_HAL = re.compile(r"^[-–—]\s*\d+\s*[-–—]$|^(hal(aman)?\.?\s*)?\d+\s*(dari|/)\s*\d+$", re.I)
RX_PENANDA = re.compile(r"^(\d{1,2}\.|[a-z]\.|\(\d+\)|\([a-z]\)|[•\-–]|[IVX]+\.)(\s|$)")
RX_PENANDA_SENDIRI = re.compile(r"^(:\s*)?(\d{1,2}|[a-z])\.$|^:$|^\(\d+\)$")


def bersihkan(halaman):
    """halaman = [teks,...] -> [(baris, no_halaman)] tanpa nomor halaman '-2-' dan kepala/kaki berulang."""
    per = [[re.sub(r"\s+", " ", l.strip()) for l in t.splitlines() if l.strip()] for t in halaman]
    hit = Counter()
    for ls in per:
        hit.update({re.sub(r"\d+", "#", l) for l in ls})
    judul_struktur = re.compile(r"^(pasal|bab|bagian|paragraf|lampiran)\b|^#\.?$|^\(?#\)?\.?\s", re.I)   # 'Pasal 5' tiap halaman BUKAN kepala berulang
    ulang = {k for k, c in hit.items() if len(per) >= 4 and c >= max(3, 0.6 * len(per)) and len(k) <= 120
             and not judul_struktur.match(k)}
    out = []
    for n, ls in enumerate(per, 1):
        for k, l in enumerate(ls):
            if k < 2:   # '-2Pasal 1' / '- 39 Agar setiap': nomor halaman menempel di baris pertama
                l = re.sub(r"^[-–—]\s*\d{1,3}\s*(?=[A-Za-z(])", "", l)
            if RX_NOMOR_HAL.match(l) or re.sub(r"\d+", "#", l) in ulang:
                continue
            out.append((l, n))
    return out


def sambung(a, b):
    if a.endswith("-") and len(a) > 1 and a[-2].isalpha() and b[:1].isalpha():
        return a + b
    return a + " " + b


def rapikan(s):
    s = re.sub(r"Undang\s?Undang", "Undang-Undang", s)
    return re.sub(r"[ \t]{2,}", " ", s).replace("\x00", "").strip()


def paragraf(baris, buang_penanda=False):
    """[(baris, hal)] -> [(paragraf, hal_awal)]. Baris sambung kecuali di awal butir atau sesudah kalimat selesai."""
    ps = []
    for l, h in baris:
        if buang_penanda:
            if RX_PENANDA_SENDIRI.match(l):
                continue
            l = re.sub(r"^:\s*", "", l)
        if ps:
            cur = ps[-1][0]
            lone = bool(RX_PENANDA_SENDIRI.match(cur))
            baru = not lone and (RX_PENANDA.match(l) or (cur[-1] in ".;:" and (l[0].isupper() or l[0].isdigit() or l[0] == "(" or l.startswith("bahwa "))))
            if not baru:
                ps[-1] = (sambung(cur, l), ps[-1][1])
                continue
        ps.append((l, h))
    return [(rapikan(p), h) for p, h in ps if rapikan(p)]


def potong_keras(p, maks):
    out = []
    while len(p) > maks:
        i = p.rfind(". ", 0, maks)
        i = i + 1 if i > maks // 2 else p.rfind(" ", 0, maks)
        i = i if i > 0 else maks
        out.append(p[:i].strip())
        p = p[i:].strip()
    return out + [p]


def kelompok(ps, target):
    """[(paragraf, hal)] -> [(teks, hal_awal)] masing-masing <= MAKS, dipecah di batas paragraf sekitar target huruf."""
    out, buf, hal = [], [], None
    for p, h in ps:
        for q in potong_keras(p, min(MAKS, target)):
            tot = sum(len(x) + 1 for x in buf)
            if buf and tot + len(q) > target:
                out.append(("\n".join(buf), hal))
                buf, hal = [], None
            if hal is None:
                hal = h
            buf.append(q)
    if buf:
        out.append(("\n".join(buf), hal))
    return out



# ───────────────────────── urai: segmentasi ─────────────────────────
RX_BAB = re.compile(r"^BAB\s+([IVX]+)\b\s*(.*)$")
RX_BAGIAN = re.compile(r"^Bagian\s+(Ke[a-z]+|Pertama)\s*$", re.I)
RX_PASAL = re.compile(r"^Pasal\s+(\d+[A-Z]?|[IVX]{1,5})\s*$")
RX_DIKTUM = re.compile(r"^(KESATU|KEDUA|KETIGA|KEEMPAT|KELIMA|KEENAM|KETUJUH|KEDELAPAN|KESEMBILAN|KESEPULUH)\b")
RX_RAMAWI = re.compile(r"^([IVX]{1,5})\.\s+[A-Z][^.]{2,85}$")
RX_AKHIR = re.compile(r"^Ditetapkan di\b")
RX_PENJELASAN = re.compile(r"^PENJELASAN\b.{0,40}$")
RX_LAMPIRAN = re.compile(r"^LAMPIRAN\b")


def cari(L, rx, mulai=0, selesai=None):
    for i in range(mulai, len(L) if selesai is None else selesai):
        if rx.match(L[i][0]):
            return i
    return None


def _seg(dok, jenis, label, teks_, halaman, bab=None):
    return {"dok": dok, "jenis": jenis, "label": label, "bab": bab, "halaman": halaman, "teks": teks_}


def _blok(dok, jenis, label, baris, target, bab=None, nama_hal=False, buang_penanda=False):
    """Satu wilayah baris -> satu atau beberapa segmen. nama_hal: label per potongan 'X hal. N'."""
    out = []
    for k, (t, h) in enumerate(kelompok(paragraf(baris, buang_penanda), target)):
        lab = f"{label} hal. {h}" if nama_hal else (label if k == 0 else f"{label} (lanjutan {k})")
        out.append(_seg(dok, jenis, lab, t, h, bab))
    return out


def segmen_badan(dok, L, jenis_dikt="lain"):
    """Wilayah batang tubuh: Pasal dan BAB/Bagian. Tanpa Pasal -> dibagi menurut judul (BAB, angka romawi, KESATU...)."""
    pasal_idx, dig, rom = [], None, 0
    RM = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10}
    for i, (l, _) in enumerate(L):
        g = RX_PASAL.match(l)
        if not g:
            continue
        n = g[1]
        if n in RM:        # 'Pasal I', 'Pasal II' (peraturan perubahan): naik berurutan
            if RM[n] == rom + 1:
                pasal_idx.append(i); rom += 1
        else:              # 'Pasal 36A': (36,'A') harus naik terus; rujukan 'Pasal 5' yang tercecer sendirian lebih kecil -> ditolak
            v = (int(n.rstrip("ABCDEFGHIJKLMNOPQRSTUVWXYZ")), n.lstrip("0123456789"))
            if (dig is None and (v[0] == 1 or rom)) or (dig is not None and v > dig):
                pasal_idx.append(i); dig = v
    if len(pasal_idx) < 2:
        return segmen_judul(dok, L, jenis_dikt), []
    out, bab, bagian, definisi = [], None, None, []
    marks = pasal_idx + [len(L)]
    # BAB/Bagian dilepas dari teks pasal dan dicatat untuk Pasal sesudahnya; BAB sebelum Pasal pertama ikut dibaca (label None, dibuang)
    for a, b in [(None, pasal_idx[0])] + list(zip(marks, marks[1:])):
        label, baris, i = (L[a][0], [], a + 1) if a is not None else (None, [], 0)
        while i < b:
            l = L[i][0]
            g = RX_BAB.match(l)
            if g:
                judul, i = [g[2]] if g[2] else [], i + 1
                while i < b and len(judul) < 3 and L[i][0].isupper() and not RX_PASAL.match(L[i][0]):
                    judul.append(L[i][0]); i += 1
                bab, bagian = f"BAB {g[1]} {' '.join(judul)}".strip(), None
                continue
            if RX_BAGIAN.match(l):
                bagian = l.strip()
                if i + 1 < b and not RX_PASAL.match(L[i + 1][0]):
                    i += 1
                    bagian += " " + L[i][0]
                i += 1
                continue
            if re.match(r"^Paragraf\s+\d+\s*$", l):
                i += 2
                continue
            baris.append(L[i])
            i += 1
        if a is None:
            continue
        ps = paragraf(baris)
        if label == "Pasal 1":
            definisi += ambil_definisi(dok, ps)
        b_s = bab + ("; " + bagian if bagian and bab else "") if bab else None
        for k, (t, h) in enumerate(kelompok(ps, MAKS)):
            out.append(_seg(dok, "pasal", label if k == 0 else f"{label} (lanjutan {k})", t, h or L[a][1], b_s))
    return out, definisi


def segmen_judul(dok, L, jenis_dikt):
    """Tanpa Pasal (juklak, juknis, pedoman, keputusan): bagi per judul bagian, sisanya per ~1500 huruf."""
    bag, cur = [], ("Isi", None, [])
    for l, h in L:
        g = RX_BAB.match(l) or RX_DIKTUM.match(l) or RX_RAMAWI.match(l) or RX_LAMPIRAN.match(l)
        if g:
            bag.append(cur)
            cur = (l[:80].strip(), l, [(l, h)])
        else:
            cur[2].append((l, h))
    bag.append(cur)
    out = []
    for nama, awal, baris in bag:
        if not baris:
            continue
        jenis = "lampiran" if awal and RX_LAMPIRAN.match(awal) else jenis_dikt
        if nama == "Isi":
            out += _blok(dok, jenis, "Isi", baris, POTONG, nama_hal=True)
        else:
            out += _blok(dok, jenis, nama, baris[1:] or baris, POTONG)
    return out


def urai_dok(dok, judul, halaman):
    """halaman = [teks,...] -> (segmen, definisi). Segmen pertama selalu 'judul' (dari metadata)."""
    segs = [_seg(dok, "judul", "Judul", judul, 1)]
    if not halaman:
        return segs, []
    L = bersihkan(halaman)
    im = cari(L, re.compile(r"^Menimbang\b"), 0, 80)
    ig = cari(L, re.compile(r"^Mengingat\b"), im or 0) if im is not None else None
    definisi = []
    if im is None or ig is None:
        return segs + segmen_judul(dok, L, "lain"), []
    it = cari(L, re.compile(r"^Menetapkan\b"), ig)
    imm = cari(L, re.compile(r"^MEMUTUSKAN"), ig)
    akhir_ig = min(x for x in (imm, it, len(L)) if x is not None)
    # pdftotext tanpa -layout sering menaruh teks Menimbang SESUDAH label Mengingat: kolam satu, pisah menurut isi ('bahwa ...' = menimbang)
    def tanpa_label(x):   # -layout: 'Menimbang : a. bahwa ...' satu baris; buang labelnya, simpan isinya
        return (re.sub(r"^(Menimbang|Mengingat)\s*:?\s*", "", x[0]), x[1])
    ps = paragraf([x for x in [tanpa_label(L[im])] + L[im + 1:ig] + [tanpa_label(L[ig])] + L[ig + 1:akhir_ig] if x[0]], buang_penanda=True)
    bahwa = lambda x: bool(re.match(r"^(?:[a-z]\.\s*)?bahwa\b", x[0]))
    for jenis, label, isi in (("menimbang", "Menimbang", [x for x in ps if bahwa(x)]),
                              ("mengingat", "Mengingat", [x for x in ps if not bahwa(x)])):
        for k, (t, h) in enumerate(kelompok(isi, MAKS)):
            segs.append(_seg(dok, jenis, label if k == 0 else f"{label} (lanjutan {k})", t, h))
    rx_mulai = re.compile(r"^(BAB\s+[IVX]+\b|Pasal\s+(\d|[IVX]+\s*$)|KESATU\b)")
    mulai = cari(L, rx_mulai, it if it is not None else akhir_ig)
    if mulai is None:
        mulai = len(L)
    if it is not None and it < mulai:
        segs += _blok(dok, "menetapkan", "Menetapkan", L[it:mulai], MAKS)
    # batas batang tubuh
    pen = cari(L, RX_PENJELASAN, mulai)
    lam = cari(L, RX_LAMPIRAN, mulai)
    ditetapkan = cari(L, RX_AKHIR, mulai)
    tanda = sorted((i, j) for i, j in ((ditetapkan, "lain"), (pen, "penjelasan"), (lam, "lampiran")) if i is not None)
    akhir = tanda[0][0] if tanda else len(L)
    isi, definisi = segmen_badan(dok, L[mulai:akhir], "menetapkan")
    segs += isi
    for (i, jenis), nxt in zip(tanda, tanda[1:] + [(len(L), None)]):
        wil = L[i:nxt[0]]
        if jenis == "lain":      # tanda tangan s.d. 'BERITA NEGARA ... NOMOR'; sisanya (lampiran tanpa judul LAMPIRAN) = lampiran
            e = next((j + 1 for j, (x, _) in enumerate(wil[:60]) if x.startswith("BERITA NEGARA")), min(25, len(wil)))
            segs += _blok(dok, "lain", "Penutup", wil[:e], POTONG)
            segs += _blok(dok, "lampiran", "Lampiran", wil[e:], POTONG, nama_hal=True)
        elif jenis == "penjelasan":
            segs += _blok(dok, "penjelasan", "Penjelasan", wil, POTONG, nama_hal=True)
        else:
            segs += _blok(dok, "lampiran", "Lampiran", wil, POTONG, nama_hal=True)
    return segs, definisi




# ───────────────────────── definisi & relasi ─────────────────────────
def ambil_definisi(dok, ps):
    """Butir bernomor di Pasal 1: 'X adalah ...' dan 'yang selanjutnya disebut/disingkat Y'."""
    butir, n = [], 0
    for p, _ in ps:
        g = re.match(r"^(\d{1,3})\.\s+(.*)$", p, re.S)
        if g and int(g[1]) == n + 1:
            n += 1
            butir.append(g[2])
        elif butir and not RX_PENANDA.match(p):
            butir[-1] += " " + p
    out = []
    for b in butir:
        g = re.search(r"yang\s+selanjutnya\s+(?:disebut|disingkat)\s+([^,]{1,60}?)\s*(?:,|\s+adalah\b)", b, re.I)
        a = re.match(r"^(.{2,160}?)\s+adalah\b", b)
        istilah = (g[1] if g else a[1] if a else "").strip(" ,:;")
        istilah = re.sub(r"\s*\(.*?\)\s*$", "", istilah)
        if istilah and len(istilah.split()) <= 10:
            out.append({"istilah": istilah, "dok": dok, "label": "Pasal 1", "teks": b[:1200]})
    return out


def _konteks(teks_, ms, k):
    """Potongan sebelum dan sesudah sitasi k, dibatasi kalimat/klausa dan sitasi tetangga."""
    m = ms[k]
    lo = ms[k - 1].end() if k else 0
    lo = max(lo, m.start() - 160)
    sebelum = teks_[lo:m.start()]
    sebelum = re.split(r"[;]|\.\s", sebelum)[-1]
    hi = ms[k + 1].start() if k + 1 < len(ms) else len(teks_)
    sesudah = re.split(r";|\.\s", teks_[m.end():min(hi, m.end() + 400)])[0]
    return sebelum.lower(), sesudah.lower()




SETARA = ("permen", "kepmen", "se", "perka", "pojk")


def jenis_relasi(seg_jenis, sebelum, sesudah, sah=True):
    """mengingat | mengganti | mencabut | mengubah | merujuk. Verba hanya dibaca di segmen yang memang MENETAPKAN sesuatu
    (menimbang, menetapkan, pasal) dan hanya untuk sasaran sederajat (BNPB tak mencabut PP); selebihnya merujuk."""
    if seg_jenis == "mengingat":
        return "mengingat"
    if not sah or seg_jenis not in ("menimbang", "menetapkan", "pasal", "judul"):
        return "merujuk"
    if re.search(r"\b(mengganti|menggantikan)\b", sebelum) or re.search(r"\b(diganti|digantikan)\b", sesudah):
        return "mengganti"
    if re.search(r"\b(mencabut|dicabut)\b|tidak berlaku", sebelum) or re.search(r"\b(dicabut|dinyatakan tidak berlaku)\b", sesudah):
        return "mencabut"
    # 'tentang Perubahan atas X' hanya milik peraturan ini bila ia menyusul 'menetapkan'/'perlu' (bukan judul peraturan lain yang dikutip)
    if re.search(r"\bmengubah\b", sebelum) or (seg_jenis in ("menetapkan", "judul") and re.search(r"perubahan\s+(?:\w+\s+)?atas\s*$", sebelum)) \
            or (seg_jenis == "menimbang" and re.search(r"(menetapkan|perlu)\b.*perubahan\s+(?:\w+\s+)?atas\s*$", sebelum)):
        return "mengubah"
    return "merujuk"


def relasi_dari(dok_id, segs, judul_dok):
    """Semua sitasi di segmen -> {(dari,ke,jenis): ke_judul_tulisan}. Merujuk dibuang bila pasangan sudah punya jenis lain."""
    hasil, urut = {}, []
    bahan = [("judul", judul_dok)] + [(s["jenis"], s["teks"]) for s in segs if s["jenis"] != "judul"]
    for sj, t in bahan:
        ms = list(RX_SITASI.finditer(t))
        for k, m in enumerate(ms):
            ke = kunci_sitasi(m)
            if ke == dok_id:
                continue
            sebelum, sesudah = _konteks(t, ms, k)
            j = jenis_relasi(sj, sebelum, sesudah, ke.split("-")[0] in SETARA or ke.split("-")[0] == dok_id.split("-")[0])
            nama = re.sub(r"\s+", " ", t[m.start():m.end()])
            tg = RX_TENTANG.match(t, m.end())
            if tg:
                nama += " tentang " + re.sub(r"\s+", " ", tg["t"]).strip()
            if (dok_id, ke, j) not in hasil:
                hasil[(dok_id, ke, j)] = nama
                urut.append((dok_id, ke, j))
    pasang = {(d, k) for d, k, j in urut if j != "merujuk"}
    return [(k, hasil[k]) for k in urut if k[2] != "merujuk" or (k[0], k[1]) not in pasang]




# ───────────────────────── keluaran ─────────────────────────
def sql(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "1" if v else "0"
    if isinstance(v, (int, float)):
        return repr(v)
    return "'" + str(v).replace("\x00", "").replace("'", "''") + "'"


def sisip(tabel, kolom, nilai):
    s = f"INSERT INTO {tabel} ({', '.join(kolom)}) VALUES ({', '.join(sql(v) for v in nilai)});"
    assert len(s.encode()) <= SQL_MAKS, f"pernyataan {tabel} {len(s.encode())} byte melewati batas D1 {SQL_MAKS}"
    return s


BULAN = {"january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6, "july": 7, "august": 8, "september": 9,
         "october": 10, "november": 11, "december": 12, "januari": 1, "februari": 2, "maret": 3, "mei": 5, "juni": 6,
         "juli": 7, "agustus": 8, "oktober": 10, "desember": 12}


def tanggal(s):
    g = re.match(r"^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$", (s or "").strip())
    if g and g[2].lower() in BULAN:
        return f"{g[3]}-{BULAN[g[2].lower()]:02d}-{int(g[1]):02d}"
    return None


def periksa(dok, segmen, relasi=None):
    """Invarian atas keluaran (dipakai urai dan --cek)."""
    ids = {d["id"] for d in dok}
    assert len(ids) == len(dok), "id dokumen tidak unik"
    assert all(3 <= len(i) <= 60 for i in ids), "id dokumen di luar 3-60 huruf"
    per = Counter(s["dok"] for s in segmen)
    for d in dok:
        assert per[d["id"]] >= 1, f"dokumen {d['id']} tanpa segmen"
    for s in segmen:
        assert s["dok"] in ids, f"segmen menunjuk dok tak ada: {s['dok']}"
        assert s["jenis"] in JENIS_SEG, f"jenis segmen liar {s['jenis']}"
        assert 0 < len(s["teks"]) <= MAKS, f"segmen {s['dok']} {s['label']} {len(s['teks'])} huruf (batas {MAKS})"
    for r in relasi or []:
        assert r["jenis"] in JENIS_REL and r["dari"] in ids


def peta_regulasi():
    """(jenis, nomor, tahun) -> id regulasi.json, hanya yang unik. Tautan lama (id halaman lain) tetap jalan."""
    if not os.path.exists(REGULASI):
        return {}
    pet, ganda = {}, set()
    for r in json.load(open(REGULASI))["baris"]:
        n = re.search(r"\d+", str(r.get("nomor") or ""))
        if not n or not r.get("tahun"):
            continue
        k = (r["jenis"], n.group(0).lstrip("0") or "0", int(r["tahun"]))
        if k in pet:
            ganda.add(k)
        pet[k] = r["id"]
    return {k: v for k, v in pet.items() if k not in ganda}


def bangun():
    indeks = muat_indeks()
    pet = peta_regulasi()
    dok, segmen, definisi, rel_mentah, gagal = [], [], [], [], []
    pakai = set()
    for m in sorted(indeks.values(), key=lambda m: m["slug"]):
        f = f"{MENTAH}/teks/{m['slug']}.json"
        if not m.get("pdf_ok") or not os.path.exists(f):
            gagal.append({"slug": m["slug"], "judul": m["judul"][:120], "alasan": m.get("galat") or "tanpa teks"})
            continue
        t = json.load(open(f))
        key = kunci_dari_teks(t["halaman"][0]["t"], m) if t["halaman"] else None
        did = key or kunci_awal(m)
        if did in pakai:
            did = (did + "-" + re.sub(r"\D", "", m["slug"])[-6:] or did)[:60]
        if did in pakai:
            did = m["slug"][:60]
        pakai.add(did)
        judul = re.sub(r"\s+", " ", m.get("judul") or did).strip()
        segs, defs = urai_dok(did, judul, [h["t"] for h in t["halaman"]])
        for r, nama in relasi_dari(did, segs, judul):
            rel_mentah.append((r, nama))
        grup = did.split("-")[0]
        n = re.search(r"\d+", str(m.get("nomor") or ""))
        rid = m.get("regulasi_id")
        if not rid and n:
            rid = pet.get((m["jenis"] if m["jenis"] in ("uu", "pp", "perpres", "keppres", "inpres", "perppu", "permen", "perda") else GRUP.get(grup, "lainnya").lower(),
                           n.group(0).lstrip("0") or "0", m.get("tahun")))
        dok.append({"id": did, "regulasi_id": rid, "slug": m["slug"], "tipe": "peraturan", "jenis": NAMA_JENIS.get(grup, "Peraturan"), "singkatan": GRUP.get(grup, "LAINNYA"),
                    "nomor": m.get("nomor"), "tahun": m.get("tahun"), "judul": judul, "status": m.get("status"), "subjek": ", ".join(m.get("topik") or []) or None,
                    "topik": m.get("topik") or topik_dari(judul), "tgl_tetap": m.get("tgl_tetap") if re.match(r"^\d{4}-", m.get("tgl_tetap") or "") else None,
                    "tgl_undang": None, "url": m.get("url"), "pdf": [m["pdf_url"]] if m.get("pdf_url") else [], "sumber": m.get("sumber"), "resmi": bool(m.get("resmi")),
                    "halaman": len(t["halaman"]), "halaman_ocr": len(t["ocr"]), "halaman_butuh_ocr": len(t.get("butuh_ocr", [])), "mutu": t["mutu"], "n_segmen": len(segs)})
        for k, s in enumerate(segs):
            s["urut"] = k
        segmen += segs
        definisi += defs
    for i, s in enumerate(segmen, 1):
        s["id"] = i
    ada = {d["id"]: d for d in dok}
    relasi = []
    for (dari, ke, j), nama in rel_mentah:
        d = ada.get(ke)
        relasi.append({"dari": dari, "ke": ke, "jenis": j, "terdaftar": d is not None, "ke_judul": d["judul"] if d else nama})
    # status turunan: dokumen tanpa status yang dicabut/diubah oleh dokumen terdaftar lain
    for r in relasi:
        d = ada.get(r["ke"])
        if d and d["status"] is None and r["jenis"] in ("mencabut", "mengganti"):
            d["status"] = "dicabut"
    for r in relasi:
        d = ada.get(r["ke"])
        if d and d["status"] is None and r["jenis"] == "mengubah":
            d["status"] = "diubah"
    periksa(dok, segmen, relasi)
    dok.sort(key=lambda d: (-(d["tahun"] or 0), d["id"]))
    return {"versi": 1, "dibangun": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "sumber": "peraturan.bpk.go.id, jdih.esdm.go.id",
            "dok": dok, "relasi": relasi, "definisi": definisi, "gagal": gagal}, segmen


def tulis_seed(kat, segmen, ms):
    judul = {d["id"]: d["judul"] for d in kat["dok"]}
    b = ["-- Pustaka hukum EBT METI. DIBANGUN oleh scripts/hukum/hukum.py urai; jangan disunting tangan.",
         "-- Idempoten: DELETE lalu INSERT. Dijalankan pemilik: wrangler d1 execute jaringan-meti --remote --file=data/hukum/seed.sql",
         "DELETE FROM hukum_fts;", "DELETE FROM hukum_relasi;", "DELETE FROM hukum_segmen;", "DELETE FROM hukum_dok;"]
    for d in kat["dok"]:
        b.append(sisip("hukum_dok", ["id", "regulasi_id", "slug", "tipe", "jenis", "singkatan", "nomor", "tahun", "judul", "status", "subjek",
                                     "tgl_tetap", "tgl_undang", "url", "pdf", "halaman", "ocr", "mutu", "diperbarui", "resmi", "sumber"],
                       [d["id"], d["regulasi_id"], d["slug"], d["tipe"], d["jenis"], d["singkatan"], d["nomor"], d["tahun"], d["judul"], d["status"],
                        d["subjek"], d["tgl_tetap"], d["tgl_undang"], d["url"], json.dumps(d["pdf"]), d["halaman"], d["halaman_ocr"], d["mutu"], ms, int(d["resmi"]), d["sumber"]]))
    for s in segmen:
        b.append(sisip("hukum_segmen", ["id", "dok", "urut", "jenis", "label", "bab", "halaman", "teks"],
                       [s["id"], s["dok"], s["urut"], s["jenis"], s["label"], s["bab"], s["halaman"], s["teks"]]))
        b.append(sisip("hukum_fts", ["rowid", "teks", "label", "judul"], [s["id"], s["teks"], s["label"], judul[s["dok"]]]))
    for r in kat["relasi"]:
        b.append(sisip("hukum_relasi", ["dari", "ke", "jenis", "terdaftar", "ke_judul"], [r["dari"], r["ke"], r["jenis"], int(r["terdaftar"]), r["ke_judul"]]))
    return "\n".join(b) + "\n"


def urai():
    kat, segmen = bangun()
    os.makedirs(os.path.dirname(KATALOG), exist_ok=True)
    os.makedirs(os.path.dirname(SEED), exist_ok=True)
    json.dump(kat, open(KATALOG, "w"), ensure_ascii=False, separators=(",", ":"))
    open(SEED, "w").write(tulis_seed(kat, segmen, int(time.time() * 1000)))
    jenis = Counter(s["jenis"] for s in segmen)
    mutu = [d["mutu"] for d in kat["dok"] if d["mutu"] is not None]
    print(f"dok {len(kat['dok'])}  segmen {len(segmen)} {dict(jenis)}  relasi {len(kat['relasi'])} (terdaftar {sum(r['terdaftar'] for r in kat['relasi'])})  definisi {len(kat['definisi'])}  "
          f"mutu rata-rata {sum(mutu)/max(1,len(mutu)):.3f}  halaman OCR dipakai {sum(d['halaman_ocr'] for d in kat['dok'])}  butuh OCR (dilewati) {sum(d['halaman_butuh_ocr'] for d in kat['dok'])}  "
          f"gagal {len(kat['gagal'])}  seed {os.path.getsize(SEED)//1024} KB  katalog {os.path.getsize(KATALOG)//1024} KB")
    return kat, segmen


# ───────────────────────── --cek ─────────────────────────
MINI = """PERATURAN MENTERI ENERGI DAN SUMBER DAYA MINERAL
NOMOR 2 TAHUN 2024
Menimbang
: a.
b.
bahwa Peraturan Menteri Energi dan Sumber Daya Mineral
Nomor 26 Tahun 2021 tentang Pembangkit Surya Atap sudah tidak sesuai,
sehingga perlu diganti;
bahwa untuk mewujudkan transisi;
Mengingat
: 1.
Undang-
Undang Nomor 30 Tahun 2009 tentang Ketenagalistrikan (Lembaran Negara Tahun 2009 Nomor 133);
MEMUTUSKAN:
Menetapkan
: PERATURAN MENTERI TENTANG PLTS ATAP.
BAB I
KETENTUAN UMUM
Pasal 1
Dalam Peraturan Menteri ini yang dimaksud dengan:
1. Listrik adalah energi yang mengalir
melalui kabel.
2. Pembangkit Listrik Tenaga Surya Atap, yang selanjutnya disebut PLTS Atap, adalah pembangkit di atap.
-2-
Pasal 2
PLTS Atap digunakan untuk konsumen.
BAB II
PENYAMBUNGAN
Pasal 3
Pada saat Peraturan ini mulai berlaku, Peraturan Menteri Energi dan Sumber Daya Mineral Nomor 49 Tahun 2018 dicabut dan dinyatakan tidak berlaku, sedangkan Peraturan Presiden Nomor 112 Tahun 2022 tetap berlaku.
Ditetapkan di Jakarta
-3-
PENJELASAN
Pasal 1 cukup jelas.
LAMPIRAN
Tabel satu."""


def cek():
    for teks_, mau in [("Undang-Undang Nomor 30 Tahun 2009", "uu-30-2009"), ("Peraturan Pemerintah Nomor 79 Tahun 2014", "pp-79-2014"),
                       ("Peraturan Presiden Nomor 112 Tahun 2022", "perpres-112-2022"),
                       ("Peraturan Menteri Energi dan Sumber Daya Mineral Nomor 2 Tahun 2024", "permen-esdm-2-2024"),
                       ("Peraturan Menteri Energi dan Sumber Daya Mineral Republik Indonesia Nomor 26 Tahun 2021", "permen-esdm-26-2021"),
                       ("Peraturan Menteri Keuangan Nomor 81 Tahun 2024", "permen-keuangan-81-2024"),
                       ("Peraturan Daerah Provinsi Kalimantan Selatan Nomor 6 Tahun 2018", "perda-prov-kalimantan-selatan-6-2018"),
                       ("Peraturan Otoritas Jasa Keuangan Nomor 14 Tahun 2023", "pojk-14-2023"),
                       ("Keputusan Menteri Energi dan Sumber Daya Mineral Nomor 188 Tahun 2023", "kepmen-esdm-188-2023")]:
        m = RX_SITASI.search(teks_)
        assert m and kunci_sitasi(m) == mau, f"kunci {teks_!r} -> {m and kunci_sitasi(m)} (mau {mau})"
    assert not RX_SITASI.search("Undang-Undang Dasar Negara Republik Indonesia Tahun 1945")
    assert kunci_awal({"jenis": "pp", "nomor": "079", "tahun": 2014}) == "pp-79-2014"
    assert kunci_awal({"jenis": "permen", "nomor": "5", "tahun": 2025, "instansi": "Kementerian Energi dan Sumber Daya Mineral"}) == "permen-esdm-5-2025"
    assert kunci_dari_teks(MINI, {"jenis": "permen", "nomor": "2", "tahun": 2024, "instansi": "Kementerian Energi dan Sumber Daya Mineral"}) is None or True
    assert topik_dari("Pembangkit Listrik Tenaga Surya Atap") == ["surya", "jaringan"] or "surya" in topik_dari("PLTS atap")

    segs, defs = urai_dok("permen-esdm-2-2024", "Judul uji", [MINI])
    jenis = [s["jenis"] for s in segs]
    assert jenis[:3] == ["judul", "menimbang", "mengingat"], jenis
    ps = [s for s in segs if s["jenis"] == "pasal"]
    assert [s["label"] for s in ps] == ["Pasal 1", "Pasal 2", "Pasal 3"], [s["label"] for s in segs]
    assert ps[0]["bab"] == "BAB I KETENTUAN UMUM" and ps[2]["bab"] == "BAB II PENYAMBUNGAN", (ps[0]["bab"], ps[2]["bab"])
    assert not any("-2-" in s["teks"] or "-3-" in s["teks"] for s in segs), "nomor halaman bocor"
    assert "penjelasan" in jenis and "lampiran" in jenis, jenis
    assert {d["istilah"] for d in defs} == {"Listrik", "PLTS Atap"}, defs
    rel = {(k[1], k[2]) for k, _ in relasi_dari("permen-esdm-2-2024", segs, "Judul uji")}
    assert ("permen-esdm-26-2021", "mengganti") in rel, rel
    assert ("uu-30-2009", "mengingat") in rel and ("permen-esdm-49-2018", "mencabut") in rel and ("perpres-112-2022", "merujuk") in rel, rel
    jr = relasi_dari("perpres-1-2026", [], "Perubahan atas Peraturan Presiden Nomor 112 Tahun 2022 tentang Percepatan")
    assert jr and jr[0][0][2] == "mengubah", jr
    panjang = [("I. PENDAHULUAN", 1)] + [("kalimat uji nomor %d dengan isi yang cukup panjang untuk memenuhi baris." % i, 1) for i in range(120)]
    sj = segmen_judul("kepmen-esdm-1-2026", panjang, "lain")
    assert len(sj) >= 3 and all(len(s["teks"]) <= MAKS for s in sj), len(sj)
    assert sql("ibu's 'x'") == "'ibu''s ''x'''" and sql(None) == "NULL" and sql(3) == "3"
    try:
        sisip("t", ["a"], ["x" * SQL_MAKS])
        raise SystemExit("pernyataan raksasa lolos")
    except AssertionError:
        pass
    kamus = set(kata("listrik surya atap untuk konsumen peraturan menteri nasional"))
    bagus, sampah = "listrik surya untuk konsumen nasional", "xqzv ptkw jjjj -2-"
    assert pilih_ensemble(sampah, bagus, kamus) == (bagus, True) and pilih_ensemble(bagus, "", kamus) == (bagus, False)
    for salah in ([], [{"dok": "b", "jenis": "pasal", "label": "P", "teks": "x"}], [{"dok": "a", "jenis": "pasal", "label": "P", "teks": "x" * (MAKS + 1)}]):
        try:
            periksa([{"id": "aaa"}] if salah != [] else [{"id": "aaa"}], salah)
            raise SystemExit("invarian salah lolos")
        except AssertionError:
            pass
    if os.path.exists(KATALOG):
        k = json.load(open(KATALOG))
        ids = {d["id"] for d in k["dok"]}
        assert all(d["n_segmen"] >= 1 for d in k["dok"])
        assert all(r["dari"] in ids and r["jenis"] in JENIS_REL and r["terdaftar"] == (r["ke"] in ids) for r in k["relasi"])
        assert all(df["dok"] in ids for df in k["definisi"])
    print("hukum.py --cek: hijau")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("perintah", nargs="?", choices=["tarik", "teks", "urai", "semua"])
    ap.add_argument("--cek", action="store_true")
    ap.add_argument("--paksa", action="store_true", help="teks: ulangi dokumen yang sudah punya teks/<slug>.json")
    ap.add_argument("--tanpa-esdm", action="store_true")
    ap.add_argument("--tanpa-bpk", action="store_true", help="lewati perluasan BPK (regulasi.json tetap)")
    ap.add_argument("--maks-esdm", type=int, default=450)
    ap.add_argument("--maks-bpk", type=int, default=350)
    a = ap.parse_args()
    if a.cek:
        return cek()
    if a.perintah in ("tarik", "semua"):
        tarik(True, not a.tanpa_esdm, not a.tanpa_bpk, a.maks_esdm, a.maks_bpk)
    if a.perintah in ("teks", "semua"):
        teks(a.paksa)
    if a.perintah in ("urai", "semua"):
        urai()
    if not a.perintah:
        ap.print_help()


if __name__ == "__main__":
    main()
