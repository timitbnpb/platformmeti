/* namaBaku(s): nama KAPITAL PENUH dari sumber -> kapital judul Indonesia; singkatan baku dipertahankan; awalan
   "ANGGOTA UTAMA:" dibuang dan jenisnya dikembalikan terpisah. Murni, tanpa DOM. Mengembalikan { nama, jenis }. */
const SINGKATAN = new Set(("PT CV UD PLN ESDM METI BUMN BUMD PGE PLTP PLTS PLTA PLTU PLTB PLTD PLTBm PLTSa KDP WCS OPWAL FTP2 ID TF UGM BEM KM UI ITB IPB ITS UNDIP UNPAD USU UNAND UNHAS " +
  "RUPTL TKDN IPP EPC EBT EBTKE LPG BBM CSR ASEAN PBB RI DPR DPD NGO LSM APBN APBD KLHK KKP BMKG BPPT BRIN LIPI OJK BI BPK KPK USAID GIZ ADB IFC JICA UNDP UNEP IRENA IEA AS DKI DIY NTT NTB PDAM PGN BUMN MW GW kW AI IT PV DC AC").split(" "));
const KECIL = new Set(["dan", "di", "ke", "dari", "untuk", "yang", "dengan", "atau", "of", "and", "the", "in", "for"]);
const SPESIAL = { TBK: "Tbk", LTD: "Ltd", INC: "Inc", LLC: "LLC", CO: "Co", CORP: "Corp", PTE: "Pte", BHD: "Bhd", GMBH: "GmbH" };
const AWALAN = /^\s*ANGGOTA\s+(UTAMA|BIASA|LUAR\s+BIASA)\s*:\s*/i;

const judul = (w, awal) => {
  const huruf = w.replace(/[^A-Za-z]/g, "");
  if (!huruf || w !== w.toUpperCase()) return w; // angka/tanda atau sudah campuran: biarkan
  const inti = w.replace(/[^A-Za-z0-9]/g, "");
  if (SINGKATAN.has(inti)) return w;
  if (SPESIAL[inti]) return w.replace(inti, SPESIAL[inti]);
  if (!awal && KECIL.has(w.toLowerCase())) return w.toLowerCase();
  return w.toLowerCase().replace(/[a-z]/, (c) => c.toUpperCase()); // huruf pertama saja, "(PERSERO)" -> "(Persero)"
};

export function namaBaku(s) {
  let nama = String(s ?? "").trim(), jenis = "";
  const m = AWALAN.exec(nama);
  if (m) { jenis = m[1].toLowerCase().replace(/\s+/g, "-"); nama = nama.slice(m[0].length).trim(); }
  const kata = nama.split(/\s+/).filter(Boolean);
  const abjad = kata.filter((k) => /[A-Za-z]/.test(k));
  const kapital = abjad.filter((k) => k === k.toUpperCase()).length;
  // diubah bila mayoritas kata kapital dan ada >= 2 kata; satu kata pendek (<= 4 huruf) dianggap singkatan
  if (abjad.length >= 2 ? kapital * 2 > abjad.length : abjad.length === 1 && abjad[0].length > 4 && kapital === 1) {
    nama = kata.map((k, i) => k.split("-").map((p, j) => judul(p, i === 0 && j === 0)).join("-")).join(" ");
  }
  return { nama, jenis };
}
