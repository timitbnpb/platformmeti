"""Ekstrak tabel HEESI 2025 (ESDM Pusdatin) -> public/data/resmi/*.json. Jalankan: python3 -I scripts/panen/resmi_heesi.py <heesi2025.pdf>
Sumber publik tanpa login: https://esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2025.pdf
Tiap tabel dicek terhadap baris Total di PDF; selisih > 0,5% membatalkan penulisan (jangan mengarang)."""
import json, os, re, subprocess, sys, datetime as dt
AKAR = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../.."))
KELUAR = os.path.join(AKAR, "public/data/resmi")
URL = "https://esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2025.pdf"
HAL = "Handbook of Energy & Economic Statistics of Indonesia (HEESI) 2025, Pusdatin Kementerian ESDM"
LISENSI = "Publikasi pemerintah terbuka; atribusi Kementerian ESDM (Pusdatin / Ditjen Ketenagalistrikan)"
TGL = dt.date.today().isoformat()
NUM = re.compile(r"^-?[\d,]+(\.\d+)?$")

def angka(t):
    t = t.strip()
    if t in ("-", "n.a", "n,a", "n.a."): return None
    return float(t.replace(",", "")) if NUM.match(t) else "x"

def baris_angka(teks):
    """Baris yang tokennya semua angka/strip -> list token (tanpa label)."""
    out = []
    for l in teks.splitlines():
        tk = l.split()
        if tk and all(angka(x) != "x" for x in tk): out.append([angka(x) for x in tk])
    return out

def baris_label(teks):
    """Baris 'label angka angka ...' -> (label, [angka])."""
    out = []
    for l in teks.splitlines():
        tk = l.split()
        i = len(tk)
        while i > 0 and angka(tk[i - 1]) != "x": i -= 1
        if i and i < len(tk): out.append((" ".join(tk[:i]), [angka(x) for x in tk[i:]]))
    return out

def cek(nama, a, b):
    if a is None or b is None: return
    if abs(a - b) > max(0.5, abs(b) * 0.005): raise SystemExit(f"GAGAL {nama}: hitung {a} vs PDF {b}")

def tulis(nama, judul, tabel, isi):
    d = {"lapis": "resmi", "jenis": nama, "judul": judul, "sumber": HAL, "tabel": tabel, "url": URL,
         "tanggal_ambil": TGL, "tingkat_bukti": "resmi", "lisensi": LISENSI, **isi}
    os.makedirs(KELUAR, exist_ok=True)
    with open(os.path.join(KELUAR, nama + ".json"), "w", encoding="utf8") as f:
        json.dump(d, f, ensure_ascii=False, indent=1); f.write("\n")
    print("tulis", nama)

def main(pdf):
    t = subprocess.run(["pdftotext", "-layout", pdf, "-"], capture_output=True, text=True, check=True).stdout.split("\f")
    P = lambda n: t[n - 1]

    # A. kapasitas pembangkit per provinsi 2025 (6.4.9) hlm PDF 134-135 (cetak 118-119)
    kiri = [(l, r) for l, r in baris_label(P(134)) if re.match(r"^\d{2}\s", l)]
    kanan = [r for r in baris_angka(P(135)) if len(r) == 10]
    tot_kiri = [r for l, r in baris_label(P(134)) if l.startswith("Total")][0]
    assert len(kiri) == 38 and len(kanan) == 39, (len(kiri), len(kanan))
    ka = ["plta", "plta_mini", "plta_mikro", "pltp", "plts", "pltb", "plt_biogas", "plt_biomassa"]
    kb = ["plt_biofuel", "plt_sampah", "pltd", "pltu", "pltg", "gasifikasi_batubara", "pltgu", "pltmg", "lainnya", "total"]
    prov = []
    for (lab, a), b in zip(kiri, kanan[:38]):
        kode, nama = lab.split(None, 1)
        r = {"kode": kode, "provinsi": nama.strip(), **dict(zip(ka, a)), **dict(zip(kb, b))}
        s = sum(v or 0 for k, v in r.items() if k not in ("kode", "provinsi", "total"))
        cek("kap " + nama, s, r["total"]); prov.append(r)
    for i, k in enumerate(ka): cek("kolom " + k, sum(p[k] or 0 for p in prov), tot_kiri[i])
    for i, k in enumerate(kb): cek("kolom " + k, sum(p[k] or 0 for p in prov), kanan[38][i])
    tulis("kapasitas_pembangkit_provinsi", "Kapasitas terpasang pembangkit per provinsi menurut jenis, 2025 (MW)", "HEESI 6.4.9, hlm 118-119",
          {"satuan": "MW", "tahun": 2025, "total": dict(zip(ka + kb, tot_kiri + kanan[38])), "baris": prov,
           "catatan": "Kode provinsi = Kemendagri; 38 provinsi. pltu=PLTU (steam PP), pltgu=gas-uap, pltmg=mesin gas. Kolom dijumlah dan dicocokkan ke baris Total PDF."})

    # B. SPKLU
    sp = [(l, r) for l, r in baris_label(P(131)) if len(r) == 2 and not l.startswith("Total")]
    tot = [r for l, r in baris_label(P(131)) if l.startswith("Total")][0]
    cek("spklu", sum(r[0] for _, r in sp), tot[0]); cek("tukar", sum(r[1] for _, r in sp), tot[1])
    kons = {int(r[0]): r[1] for r in baris_angka(P(130)) if len(r) == 2 and 2020 <= r[0] <= 2025}
    tulis("spklu_provinsi", "SPKLU dan stasiun penukaran baterai umum (SPBKLU) per provinsi, 2025", "HEESI 6.4.5-6.4.6, hlm 114-115",
          {"tahun": 2025, "satuan": "unit", "total": {"spklu": tot[0], "penukaran_baterai": tot[1]},
           "transaksi_spklu_gwh": {str(k): v for k, v in kons.items()},
           "baris": [{"provinsi": l, "spklu": r[0], "penukaran_baterai": r[1]} for l, r in sp],
           "catatan": "Nama provinsi mengikuti tabel sumber (mis. Papua Barat Daya); dicocokkan ke kode BPS di keluaran lewat peta nama."})

    # C. penjualan listrik per segmen tarif (6.4.4) hlm 128-129
    kiri = [r for r in baris_angka(P(128)) if len(r) == 9 and 2015 <= r[0] <= 2025]
    kanan = [r for r in baris_angka(P(129)) if len(r) == 7]
    assert len(kiri) == 11 and len(kanan) == 11, (len(kiri), len(kanan))
    rows = []
    for a, b in zip(kiri, kanan):
        pln = dict(zip(["rumah_tangga", "bisnis", "industri", "penerangan_jalan", "sosial", "pemerintah", "transportasi", "total"], a[1:]))
        non = dict(zip(["rumah_tangga", "bisnis", "industri", "publik", "transportasi", "total"], b[:6]))
        cek("pln %d" % a[0], sum(v for k, v in pln.items() if k != "total"), pln["total"])
        cek("grand %d" % a[0], pln["total"] + non["total"], b[6])
        rows.append({"tahun": int(a[0]), "pln_gwh": pln, "non_pln_gwh": non, "total_gwh": b[6]})
    tulis("konsumsi_listrik_sektor", "Konsumsi listrik per sektor/segmen tarif, PLN dan non-PLN, 2015-2025 (GWh)", "HEESI 6.4.4, hlm 112-113",
          {"satuan": "GWh", "baris": rows, "catatan": "Transportasi sejak 2020 termasuk transaksi SPKLU. Non-PLN = konsumsi listrik captive/izin usaha sendiri."})

    # D. harga energi per satuan energi (4.4) hlm 56-57
    kiri = [(str(int(r[0])), r[1:]) for r in baris_angka(re.sub(r"\b(20\d\d)[34]\)", r"\1", P(56))) if len(r) == 7 and 2015 <= r[0] <= 2025]
    kanan = [r for r in baris_angka(P(57)) if len(r) == 8]
    assert len(kiri) == 11 and len(kanan) == 11, (len(kiri), len(kanan))
    rows = []
    for (l, a), b in zip(kiri, kanan):
        th = int(l); k = ["bensin_ron90", "avtur", "minyak_tanah", "solar_cn48", "lpg_3kg", "lpg_12kg", "lpg_50kg"]
        v = a + b; d = {"tahun": th}
        for i, n in enumerate(k): d[n] = {"ribu_rp_per_boe": v[2 * i], "usd_per_boe": v[2 * i + 1]}
        rows.append(d)
    tulis("harga_bbm_lpg", "Harga energi di titik jual resmi per satuan energi (BBM, LPG), 2015-2025", "HEESI 4.4, hlm 40-41",
          {"satuan": "ribu Rp/BOE dan US$/BOE", "baris": rows,
           "catatan": "Harga per BOE (barel setara minyak), bukan per liter. Bensin RON 88 sebelum 2022, RON 90 sesudahnya. Catatan sumber: 2018 data revisi, 2024 revisi untuk batubara."})

    # E. konsumsi energi final per sektor (3.2.1) hlm 42-43
    kiri = baris_label(P(42)); kanan = baris_angka(P(43))
    nm = ["industri", "rumah_tangga", "komersial", "transportasi", "lainnya", "konsumsi_energi_final", "non_energi"]
    kiri = [r for l, r in kiri if len(r) == 5 and l != 'Sector'] + [r for r in baris_angka(P(42)) if len(r) == 5]
    kiri = sorted(kiri, key=lambda r: 0) if False else kiri
    kanan = [r for r in kanan if len(r) == 6][:7]
    assert len(kiri) == 7 and len(kanan) == 7, (len(kiri), len(kanan))
    th = list(range(2015, 2026)); ser = {n: dict(zip(map(str, th), a + b)) for n, a, b in zip(nm, kiri, kanan)}
    for y in map(str, th): cek("final " + y, sum(ser[n][y] for n in nm[:5]), ser["konsumsi_energi_final"][y])
    tulis("konsumsi_energi_final_sektor", "Konsumsi energi final per sektor (termasuk biomassa tradisional), 2015-2025", "HEESI 3.2.1, hlm 26-27",
          {"satuan": "ribu BOE", "seri": ser, "catatan": "Konsumsi energi final tidak termasuk pemanfaatan non-energi."})

    # F. pasokan energi primer (3.1) hlm 40-41
    kiri = [r for r in baris_angka(re.sub(r'\b(20\d\d)3\)', r'\1', P(40))) if len(r) == 8 and 2015 <= r[0] <= 2025]
    kanan = [r for r in baris_angka(P(41)) if len(r) == 8]
    assert len(kiri) == 11 and len(kanan) == 11, (len(kiri), len(kanan))
    k1 = ["batubara", "minyak_bumi", "gas_bumi", "plta", "panas_bumi", "plts", "bayu"]
    k2 = ["ebt_lain", "biomassa_tradisional", "biofuel", "biogas", "biomassa_industri", "pemanas_surya", "panas_bumi_langsung", "total"]
    rows = []
    for a, b in zip(kiri, kanan):
        d = {"tahun": int(a[0]), **dict(zip(k1, a[1:])), **dict(zip(k2, b))}
        cek("primer %d" % a[0], sum(v or 0 for k, v in d.items() if k not in ("tahun", "total")), d["total"]); rows.append(d)
    tulis("pasokan_energi_primer", "Pasokan energi primer per sumber, 2015-2025", "HEESI 3.1, hlm 24-25",
          {"satuan": "ribu BOE", "baris": rows, "catatan": "Sejak 2025 lampu jalan tenaga surya digolongkan ke EBT lain; 'n.a' disimpan null."})

    # G. penjualan BBM domestik (6.2.4) hlm 96-97
    kiri = []
    for l in P(96).splitlines():
        tk = l.split()
        if len(tk) > 5 and tk[0][0].isalpha() and all(angka(x) != "x" for x in tk[-5:]) and tk[1] != "Types" and tk[0] not in ("Sources", "Note"):
            kiri.append((" ".join(tk[:-5]), [angka(x) for x in tk[-5:]]))
    kanan = baris_angka(P(97))
    kanan = [r for r in kanan if len(r) == 6]
    assert len(kiri) == 14 and len(kanan) == 14, (len(kiri), len(kanan))
    ser = {}
    for (l, a), b in zip(kiri, kanan):
        ser[re.sub(r"\s*\d\)$", "", l)] = dict(zip(map(str, range(2015, 2026)), a + b))
    for y in map(str, range(2015, 2026)):
        cek("bbm " + y, sum(v for k, s in ser.items() if k != "Total Oil Fuel" for v in [s[y] or 0]), ser["Total Oil Fuel"][y])
    tulis("penjualan_bbm_domestik", "Penjualan BBM domestik per jenis, 2015-2025", "HEESI 6.2.4, hlm 80-81",
          {"satuan": "kiloliter", "seri": ser, "catatan": "Nama jenis mengikuti sumber (RON 88/90/92/95, Gasoil CN48/51/53, Bio Gasoil)."})

    # H. produksi listrik 2025 (6.4.2B) hlm 124-125
    rr = [r for r in baris_angka(re.sub(r"20255\)", "2025", P(124))) if len(r) >= 8]
    tulis("produksi_listrik_2025", "Produksi listrik 2025 menurut kelompok pemilik dan jenis pembangkit (GWh)", "HEESI 6.4.2B, hlm 108-109",
          {"satuan": "GWh", "pln": dict(zip(["plta", "plts", "pltp", "bioenergi", "pltu", "pltd", "pltg", "subtotal"], rr[0][1:])),
           "iuptls_ppu": dict(zip(["plta", "plts", "bioenergi", "pltu", "pltd", "pltg", "subtotal"], rr[1][1:8])), "total_gwh": rr[1][8],
           "pembelian_pln_dari_ipp_captive_ppu": dict(zip(["plta", "plts", "pltp", "bioenergi", "pltb", "pltu", "pltd", "pltg", "subtotal"], baris_angka(P(125))[0])),
           "catatan": "Sejak 2025 klasifikasi berdasar kepemilikan pembangkit (catatan 5 sumber). Total = PLN + IUPTLS/PPU."})

if __name__ == "__main__":
    main(sys.argv[1])
