/* logo penerbit regulasi: satu helper untuk tabel, linimasa, dan lembar rinci. Tanpa teks tampak; nama lengkap di title + aria-label. */
import { esc } from "/inti/umum.js";
import "/inti/tautan_org.js";

export const PROV = { "aceh": 11, "sumatera utara": 12, "sumatera barat": 13, "riau": 14, "jambi": 15, "sumatera selatan": 16, "bengkulu": 17, "lampung": 18, "bangka belitung": 19, "kepulauan bangka belitung": 19, "kepulauan riau": 21,
  "daerah khusus ibukota jakarta": 31, "dki jakarta": 31, "jawa barat": 32, "jawa tengah": 33, "daerah istimewa yogyakarta": 34, "di yogyakarta": 34, "jawa timur": 35, "banten": 36, "bali": 51, "nusa tenggara barat": 52, "nusa tenggara timur": 53,
  "kalimantan barat": 61, "kalimantan tengah": 62, "kalimantan selatan": 63, "kalimantan timur": 64, "kalimantan utara": 65, "sulawesi utara": 71, "sulawesi tengah": 72, "sulawesi selatan": 73, "sulawesi tenggara": 74, "gorontalo": 75, "sulawesi barat": 76,
  "maluku": 81, "maluku utara": 82, "papua": 91, "papua barat": 92, "papua selatan": 93, "papua tengah": 94, "papua pegunungan": 95, "papua barat daya": 96 };
const LEMBAGA = { // kunci = slug nama penerbit -> berkas
  "pemerintah-pusat": "/img/penerbit/garuda.png",
  "presiden": "/img/penerbit/garuda.png",
  "kementerian-energi-dan-sumber-daya-mineral": "/img/logo/esdm.png",
  "kementerian-keuangan": "/img/logo/kemenkeu.png",
  "kementerian-lingkungan-hidup-dan-kehutanan": "/img/logo/kemenhut.png",
  "kementerian-investasi-dan-hilirisasi-badan-koordinasi-penanaman-modal": "/img/logo/bkpm.png",
  "badan-koordinasi-penanaman-modal": "/img/logo/bkpm.png",
  "kementerian-perindustrian": "/img/penerbit/kemenperin.png",
  "kementerian-perhubungan": "/img/penerbit/kemenhub.png",
  "kementerian-perdagangan": "/img/penerbit/kemendag.png",
  "kementerian-pekerjaan-umum-dan-perumahan-rakyat": "/img/penerbit/pupr.png",
  "kementerian-koordinator-bidang-kemaritiman-dan-investasi": "/img/penerbit/marves.png",
  "badan-pengawas-tenaga-nuklir": "/img/penerbit/bapeten.png",
  "badan-meteorologi-klimatologi-dan-geofisika": "/img/penerbit/bmkg.png",
  "badan-informasi-geospasial": "/img/penerbit/big.png",
};
export const GEDUNG = "/img/penerbit/gedung.svg";
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function logoUrl(nama) {
  const n = String(nama || "").trim(), k = n.toLowerCase();
  if (LEMBAGA[slug(k)]) return LEMBAGA[slug(k)];
  let m = k.match(/^pemerintah provinsi (.+)$/);
  if (m) return PROV[m[1]] ? `/img/provinsi/${PROV[m[1]]}.png` : GEDUNG;
  m = k.match(/^pemerintah (kabupaten|kota) (.+)$/);
  return m ? `/img/kabkota/${slug(m[1] + " " + m[2])}.png` : GEDUNG;
}
/* nama pendek untuk kartu seluler */
const SINGKAT_PEN = [[/^Pemerintah Pusat$/i, "Presiden RI"], [/Energi dan Sumber Daya Mineral/i, "Kementerian ESDM"], [/Lingkungan Hidup dan Kehutanan/i, "Kementerian LHK"], [/Badan Usaha Milik Negara/i, "Kementerian BUMN"], [/Pekerjaan Umum/i, "Kementerian PU"], [/Perencanaan Pembangunan Nasional|Bappenas/i, "Bappenas"], [/Koordinator Bidang Perekonomian/i, "Kemenko Perekonomian"], [/Koordinator Bidang Kemaritiman/i, "Kemenko Marves"], [/Dewan Perwakilan Rakyat/i, "DPR RI"], [/Otoritas Jasa Keuangan/i, "OJK"]];
export const namaPendek = (nama) => {
  const s = String(nama || ""); const k = SINGKAT_PEN.find(([re]) => re.test(s)); if (k) return k[1];
  return s.replace(/^Pemerintah Provinsi Daerah Istimewa /, "DI ").replace(/^Pemerintah Provinsi /, "Prov. ").replace(/^Pemerintah Kabupaten /, "Kab. ").replace(/^Pemerintah Kota /, "Kota ").replace(/^Kementerian /, "Kementerian ");
};

export function penerbitHtml(nama, ukuran = 32) {
  if (!nama) return "";
  const n = esc(nama);
  return `<span class="jm-pen" data-org-nama="${n}" title="${n}" role="img" aria-label="${n}"><img class="jm-pen-lg" src="${esc(logoUrl(nama))}" width="${ukuran}" height="${ukuran}" alt="" loading="lazy" decoding="async"><span class="jm-pen-pendek">${esc(namaPendek(nama))}</span></span>`;
}
/* berkas hilang -> ikon gedung (tanpa onerror inline: CSP) */
document.addEventListener("error", (e) => { const i = e.target; if (i && i.tagName === "IMG" && i.classList.contains("jm-pen-lg") && !i.src.endsWith("gedung.svg")) i.src = GEDUNG; }, true);

/* penerbit turunan: data kosong -> Keppres/Perpres/PP/Inpres selalu terbit atas nama Presiden (Pemerintah Pusat); selain itu dibiarkan kosong */
export const penerbitDari = (r) => r?.instansi_penerbit || (["keppres", "perpres", "pp", "inpres"].includes(r?.jenis) ? "Pemerintah Pusat" : "");
