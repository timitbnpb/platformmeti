/* Fungsi murni layar /direktori (satu berkas supaya aturan _headers tidak bertambah): tingkat penerima, saringan sektor multi-pilih,
   analisa keahlian pakar. Dimuat sebelum direktori.js (skrip klasik, menempel ke window); diuji di tests/direktori.test.mjs. */

/* Klasifikasi tingkat penerima proyek pendanaan: pusat, daerah, nonpem (non-pemerintah), belum.
   Murni fungsi nama + (opsional) data lembaga. */
(function (akar) {
  const DAERAH = /\b(pemerintah daerah|pemda|provinsi|province|kabupaten|regency|kota|city of|dinas|pemprov|pemkab|pemkot|gubernur|bupati|wali ?kota|bappeda|desa)\b/i;
  const PUSAT = /\b(kementerian|kemen[a-z]*|ministry|directorate general|dirjen|bappenas|national development planning|pln|pertamina|esdm|ebtke|brin|badan (nasional|riset|pusat|pengkajian)|dewan energi nasional|bank indonesia|ojk|danantara|bumn)\b/i;
  const NONPEM = /\b(universit[a-z]*|institut|kampus|college|ngo|lsm|foundation|yayasan|united nations|un[a-z]*|undp|irena|iea|iesr|world bank|asian development|bank dunia|adb|jica|giz|ltd|inc|corporation|pt|cv|koperasi|asosiasi|association)\b/i;
  function tingkatPenerima(nama, lembaga) {
    const n = String(nama || "").trim();
    if (!n) return "belum";
    if (lembaga && lembaga.kategori) {
      if (lembaga.kategori === "pemerintah") return lembaga.kab || /^(pemerintah|dinas)/i.test(n) ? "daerah" : (lembaga.skala === "nasional" || lembaga.skala === "pusat" ? "pusat" : (DAERAH.test(n) ? "daerah" : "pusat"));
      if (lembaga.kategori === "bumn") return "pusat";
      return "nonpem";
    }
    if (DAERAH.test(n)) return "daerah";
    if (PUSAT.test(n)) return "pusat";
    if (NONPEM.test(n)) return "nonpem";
    return "belum";
  }
  akar.tingkatPenerima = tingkatPenerima;
  if (typeof module !== "undefined" && module.exports) module.exports = {tingkatPenerima};
})(typeof window !== "undefined" ? window : globalThis);

/* Saringan pilihan sektor multi-pilih (OR): kosong = semua. */
(function (akar) {
  function cocokSektor(pilihan, sektor) {
    const p = [...(pilihan || [])]; if (!p.length) return true;
    const r = new Set(Array.isArray(sektor) ? sektor : sektor instanceof Set ? [...sektor] : []);
    return p.some(k => r.has(k));
  }
  /* "surya,bayu" atau "surya" -> himpunan kunci yang sah, tanpa duplikat */
  function bacaSektor(teks, sah) { const s = new Set(sah || []); return [...new Set(String(teks || "").split(",").map(t => t.trim()).filter(t => t && (!sah || s.has(t))))]; }
  function tulisSektor(pilihan) { return [...(pilihan || [])].join(","); }
  /* klik pil: kunci kosong = kosongkan, selain itu masuk/keluar himpunan; mengembalikan himpunan baru */
  function togglePilihan(pilihan, k) { const b = new Set(pilihan || []); if (!k) return new Set(); b.has(k) ? b.delete(k) : b.add(k); return b; }
  akar.togglePilihan = togglePilihan; akar.cocokSektor = cocokSektor; akar.bacaSektor = bacaSektor; akar.tulisSektor = tulisSektor;
  if (typeof module !== "undefined" && module.exports) module.exports = {...(module.exports || {}), cocokSektor, bacaSektor, tulisSektor, togglePilihan};
})(typeof window !== "undefined" ? window : globalThis);

/* Analisa keahlian pakar dari histori karyanya (judul + topik + kata kunci OpenAlex): sektor energi, tahap, wilayah kajian, tren.
   Aturan kata kunci, bukan model: tiap label membawa karya buktinya supaya bisa diperiksa.
   ponytail: wilayah hanya tingkat provinsi dan kota besar; kab/kota menyusul bila diminta. */
(function (akar) {
  const norm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const K = (...w) => new RegExp("\\b(" + w.join("|") + ")", "i");
  /* kunci = kunci SEKTOR (ALG 2.1) */
  const SEKTOR = {
    surya: K("solar", "photovoltaic", "pv\\b", "surya", "fotovoltaik", "plts"),
    bayu: K("wind (power|energy|turbine|farm)", "bayu", "angin", "pltb"),
    air: K("hydropower", "hydroelectric", "micro-?hydro", "mini-?hydro", "pembangkit listrik tenaga air", "plta", "pltmh"),
    "panas-bumi": K("geothermal", "panas bumi", "pltp"),
    bioenergi: K("biomass", "biofuel", "biodiesel", "bioethanol", "biogas", "bioenergy", "biomassa", "bioenergi", "bahan bakar nabati", "pltbm"),
    laut: K("ocean energy", "tidal", "wave energy", "ocean thermal", "otec", "energi laut", "arus laut"),
    hidrogen: K("hydrogen", "hidrogen", "fuel cell", "electroly[sz]er", "ammonia"),
    penyimpanan: K("battery", "batteries", "energy storage", "baterai", "penyimpanan energi", "pumped storage"),
    jaringan: K("smart grid", "microgrid", "mini-?grid", "transmission", "grid integration", "power system", "jaringan listrik", "transmisi"),
    efisiensi: K("energy efficiency", "energy saving", "demand response", "efisiensi energi", "konservasi energi"),
    "kendaraan-listrik": K("electric vehicle", "electric mobility", "charging station", "kendaraan listrik", "motor listrik", "spklu"),
    "sampah-energi": K("waste-to-energy", "waste to energy", "refuse-derived", "landfill gas", "sampah jadi energi", "psel"),
  };
  const FASE = {
    riset: [K("model", "simulation", "experiment", "prototype", "material", "efficiency of", "optimi[sz]ation", "eksperimen", "purwarupa", "simulasi"), "Teknologi dan riset"],
    kebijakan: [K("policy", "regulation", "governance", "transition", "roadmap", "planning", "kebijakan", "regulasi", "transisi", "perencanaan", "tarif"), "Kebijakan dan regulasi"],
    pembiayaan: [K("financ", "invest", "cost", "tariff", "subsid", "feasibility", "economic", "pembiayaan", "investasi", "biaya", "kelayakan", "keekonomian"), "Pembiayaan dan keekonomian"],
    penerapan: [K("deploy", "implementation", "rural electrification", "off-grid", "community", "case study", "operation", "penerapan", "implementasi", "elektrifikasi", "desa", "operasi"), "Penerapan dan operasi"],
  };
  const PROV = {
    "Aceh": ["aceh", "banda aceh"], "Sumatera Utara": ["sumatera utara", "north sumatra", "medan", "nias", "toba"], "Sumatera Barat": ["sumatera barat", "west sumatra", "padang", "mentawai"],
    "Kepulauan Riau": ["kepulauan riau", "riau islands", "batam"], "Riau": ["riau", "pekanbaru"], "Jambi": ["jambi"], "Sumatera Selatan": ["sumatera selatan", "south sumatra", "palembang"],
    "Bengkulu": ["bengkulu"], "Lampung": ["lampung"], "Kepulauan Bangka Belitung": ["bangka", "belitung"], "DKI Jakarta": ["jakarta"], "Banten": ["banten", "serang", "tangerang"],
    "Jawa Barat": ["jawa barat", "west java", "bandung", "bogor", "cirebon", "garut", "sukabumi", "pangandaran"], "Jawa Tengah": ["jawa tengah", "central java", "semarang", "solo", "surakarta", "demak"],
    "DI Yogyakarta": ["yogyakarta", "jogja", "bantul", "sleman"], "Jawa Timur": ["jawa timur", "east java", "surabaya", "malang"],
    "Bali": ["bali"], "Nusa Tenggara Barat": ["nusa tenggara barat", "west nusa tenggara", "lombok", "sumbawa", "bima"], "Nusa Tenggara Timur": ["nusa tenggara timur", "east nusa tenggara", "kupang", "flores", "sumba", "timor"],
    "Kalimantan Barat": ["kalimantan barat", "west kalimantan", "pontianak"], "Kalimantan Tengah": ["kalimantan tengah", "central kalimantan", "palangka ?raya"], "Kalimantan Selatan": ["kalimantan selatan", "south kalimantan", "banjarmasin"],
    "Kalimantan Timur": ["kalimantan timur", "east kalimantan", "samarinda", "balikpapan"], "Kalimantan Utara": ["kalimantan utara", "north kalimantan"],
    "Sulawesi Utara": ["sulawesi utara", "north sulawesi", "manado"], "Gorontalo": ["gorontalo"], "Sulawesi Tengah": ["sulawesi tengah", "central sulawesi", "palu"],
    "Sulawesi Barat": ["sulawesi barat", "west sulawesi", "mamuju"], "Sulawesi Selatan": ["sulawesi selatan", "south sulawesi", "makassar"], "Sulawesi Tenggara": ["sulawesi tenggara", "southeast sulawesi", "kendari"],
    "Maluku Utara": ["maluku utara", "north maluku", "ternate"], "Maluku": ["maluku", "ambon"], "Papua": ["papua", "jayapura"],
  };
  /* Kepulauan Riau dan Maluku Utara didaftar sebelum Riau dan Maluku; teks yang sudah cocok dihapus supaya tidak terhitung dua kali */
  const PROV_RE = Object.entries(PROV).map(([p, ws]) => [p, new RegExp("\\b(" + ws.join("|") + ")\\b", "g")]);
  const teksKarya = k => norm([k.judul, ...(k.topik || []), ...(k.kunci || [])].join(" | "));
  function tambah(peta, kunci, label, k) { const e = peta.get(kunci) || {kunci, label, n: 0, bukti: []}; e.n++; e.bukti.push(k); peta.set(kunci, e); }
  /* bukti: karya terbaru dulu, paling banyak 3 */
  const urut = peta => [...peta.values()].sort((a, b) => b.n - a.n || a.label.localeCompare(b.label, "id")).map(e => ({kunci: e.kunci, label: e.label, n: e.n, bukti: e.bukti.sort((a, b) => (+b.tahun || 0) - (+a.tahun || 0)).slice(0, 3).map(x => ({id: x.id, judul: x.judul, tahun: x.tahun}))}));
  function analisaKeahlian(karya, opsi) {
    const min = (opsi && opsi.min) || 2, L = Array.isArray(karya) ? karya.filter(k => k && k.judul) : [];
    const jenis = new Map(), fase = new Map(), wilayah = new Map();
    for (const k of L) {
      const t = teksKarya(k), j = norm(k.judul);
      for (const [kunci, re] of Object.entries(SEKTOR)) if (re.test(t)) tambah(jenis, kunci, kunci, k);
      for (const [kunci, [re, label]] of Object.entries(FASE)) if (re.test(t)) tambah(fase, kunci, label, k);
      /* wilayah dari judul saja: topik OpenAlex tidak memuat nama tempat */
      let sisa = j; for (const [p, re] of PROV_RE) { const b = sisa.replace(re, " "); if (b !== sisa) { tambah(wilayah, p, p, k); sisa = b; } }
    }
    const saring = arr => arr.filter(e => e.n >= min);
    /* tren: sektor teratas pada separuh karya lama vs 5 tahun terakhir */
    const bertahun = L.filter(k => +k.tahun).sort((a, b) => a.tahun - b.tahun), akhir = bertahun.length ? +bertahun[bertahun.length - 1].tahun : 0;
    const puncak = arr => { const m = new Map(); for (const k of arr) { const t = teksKarya(k); for (const [kunci, re] of Object.entries(SEKTOR)) if (re.test(t)) m.set(kunci, (m.get(kunci) || 0) + 1); }
      return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 2).map(([kunci, n]) => ({kunci, n})); };
    const kini = bertahun.filter(k => +k.tahun > akhir - 5), dulu = bertahun.filter(k => +k.tahun <= akhir - 5);
    const tren = dulu.length >= 3 && kini.length >= 3 ? {dulu: {dari: +dulu[0].tahun, sampai: +dulu[dulu.length - 1].tahun, jenis: puncak(dulu)}, kini: {dari: akhir - 4, sampai: akhir, jenis: puncak(kini)}} : null;
    return {karya: L.length, jenis: saring(urut(jenis)), fase: saring(urut(fase)), wilayah: saring(urut(wilayah)), tren};
  }
  akar.analisaKeahlian = analisaKeahlian;
  if (typeof module !== "undefined" && module.exports) module.exports = {...(module.exports || {}), analisaKeahlian};
})(typeof window !== "undefined" ? window : globalThis);
