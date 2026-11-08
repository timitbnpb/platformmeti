// Pengayaan pemasok global SURYA setelah panen otomatis: (1) butir manual bersumber dari data/global/surya/pengayaan.json,
// (2) turunan dari data publik yang sudah bersumber: pabrik_dunia.json, kebijakan_dagang.json (AD/CVD), esg_rantai.json (UFLPA, sertifikasi).
// Idempoten: butir ber-`asal: "pengayaan"` dibuang lalu dibangun ulang tiap panggilan. Tanpa jaringan.
import path from 'node:path';
import { ROOT, bacaJson } from './global_pemasok.mjs';

const ASEAN = new Set(['VN', 'MY', 'TH', 'KH', 'LA', 'ID', 'SG', 'PH', 'MM', 'BN']);
const MILIK = ['kapasitas', 'pangsa_pasar', 'status_tier1', 'pabrik_indonesia', 'pabrik_asean', 'mitra_indonesia', 'proyek_indonesia', 'isu_dagang', 'esg'];
const TINGKAT_MEDIA = { media: 'via-pihak-ketiga' };
const pub = (f) => bacaJson(path.join(ROOT, 'public/data/global', f), {});

export function perkaya(baris, _tgl, { overlay = bacaJson(path.join(ROOT, 'data/global/surya/pengayaan.json'), { sumber: {}, baris: {} }), pabrik = pub('pabrik_dunia.json'), dagang = pub('kebijakan_dagang.json'), esg = pub('esg_rantai.json') } = {}) {
  const TGL = overlay.tanggal_periksa;
  const sb = (id) => {
    const s = overlay.sumber[id]; if (!s) throw new Error('sumber pengayaan tak dikenal: ' + id);
    return { sumber_url: s.url, sumber_judul: s.judul, sumber_penerbit: s.penerbit, tanggal_terbit: s.terbit, tanggal_periksa: TGL, tingkat_bukti: s.tingkat_bukti };
  };
  const pdSumber = (id) => (pabrik.sumber || []).find((s) => s.id === id);
  const urlDagang = (id) => (dagang.sumber || []).find((s) => s.id === id)?.url;
  const pdIni = new Set(Object.values(overlay.baris).flatMap((b) => (b.pabrik_indonesia || []).map((x) => x.pd_ganti).filter(Boolean)));
  const pdRef = (id) => (pabrik.baris || []).find((b) => b.id === id);

  // butir dari satu baris pabrik_dunia -> {tujuan, butir}
  const dariPabrik = (b, r) => {
    const bukti = (b.bukti || [])[0] || {}; const s = pdSumber(bukti.sumber_id);
    if (!s) return null;
    const k = b.kapasitas; const kap = k ? `${k.nilai} ${k.satuan}${k.cakupan ? ' (' + k.cakupan + ')' : ''}` : 'kapasitas tidak disebut';
    const dasar = { asal: 'pengayaan', sumber_url: s.url, sumber_judul: s.judul, sumber_penerbit: s.penerbit, tanggal_periksa: TGL, tingkat_bukti: TINGKAT_MEDIA[bukti.tingkat_bukti] || bukti.tingkat_bukti || 'via-pihak-ketiga', pabrik_dunia_id: b.id };
    if (b.negara_iso2 === 'ID' || (ASEAN.has(b.negara_iso2) && b.negara_iso2 !== 'ID')) {
      const tujuan = b.negara_iso2 === 'ID' ? 'pabrik_indonesia' : 'pabrik_asean';
      return { tujuan, butir: { ...dasar, kutipan: `${b.perusahaan}${b.kota ? ', ' + b.kota : ''}: ${kap}; status ${b.status}.${b.catatan ? ' ' + b.catatan : ''}`, negara_iso2: b.negara_iso2, kota: b.kota, segmen: b.segmen, kapasitas: b.kapasitas, kapasitas_rencana: b.kapasitas_rencana || null, status: b.status, badan_usaha: b.perusahaan } };
    }
    if ((b.segmen || []).includes('polisilikon') && k) {
      return { tujuan: 'kapasitas', butir: { ...dasar, kutipan: `Kapasitas polisilikon ${kap}, status ${b.status} (Bernreuter Research via media).${b.catatan ? ' ' + b.catatan : ''}`, segmen: ['polisilikon'], nilai: k.nilai, satuan: k.satuan, jenis: 'kapasitas-produksi', periode: '2024', cakupan: k.cakupan } };
    }
    return null;
  };

  for (const r of baris) {
    for (const f of MILIK) r[f] = (r[f] || []).filter((x) => x.asal !== 'pengayaan');
    const o = overlay.baris[r.nama] || {};
    // 1) butir manual
    for (const f of MILIK) for (const x of o[f] || []) {
      if (x.pd_ref) { const b = pdRef(x.pd_ref); const d = b && dariPabrik(b, r); if (d) r[d.tujuan].push(d.butir); continue; }
      const { sumber, ...sisa } = x; r[f].push({ ...sisa, ...sb(sumber), asal: 'pengayaan' });
    }
    // 2) turunan pabrik_dunia (org_id = id perusahaan), kecuali yang diganti butir manual
    for (const b of (pabrik.baris || []).filter((p) => p.org_id === r.id && !pdIni.has(p.id))) { const d = dariPabrik(b, r); if (d) r[d.tujuan].push(d.butir); }
    // 3) AD/CVD per perusahaan (kata kunci kurasi) dari kebijakan_dagang
    for (const pola of overlay.dagang_kunci?.[r.nama] || []) for (const b of dagang.baris || []) {
      if (!['antidumping', 'bea-imbalan'].includes(b.jenis)) continue;
      for (const s of (b.sasaran || []).filter((x) => x.perusahaan && x.perusahaan.toLowerCase().includes(pola.toLowerCase()))) {
        r.isu_dagang.push({ asal: 'pengayaan', jenis: b.jenis === 'antidumping' ? 'antidumping-AS' : 'bea-imbalan-AS', regulasi_id: b.id, negara_sasaran: s.negara, perusahaan_sasaran: s.perusahaan, tarif_pct: s.tarif_pct, setoran_tunai_pct: s.setoran_tunai_pct ?? null, status: b.status || null,
          kutipan: `Penetapan akhir ${b.jenis === 'antidumping' ? 'antidumping' : 'bea imbalan'} AS atas ${s.perusahaan}: ${s.tarif_pct} persen${s.catatan ? ' (' + s.catatan + ')' : ''}.`, sumber_url: urlDagang(b.sumber_id) || b.sumber_url, tanggal_periksa: b.tanggal || TGL, tingkat_bukti: 'resmi' });
      }
    }
    // 4) Section 301 (asal Tiongkok), tingkat negara-asal, bukan penetapan per perusahaan
    if (r.negara_iso2 === 'CN' && r.segmen.some((s) => ['polisilikon', 'wafer', 'sel', 'modul'].includes(s))) {
      r.isu_dagang.push({ asal: 'pengayaan', jenis: 'tarif-s301-AS', cakupan: 'negara-asal', kutipan: 'Tarif Section 301 AS atas sel surya, polisilikon, dan wafer asal Tiongkok (sel naik menjadi 50 persen sejak 2024); berlaku untuk produk asal negara ini, bukan penetapan per perusahaan.', ...sb('fr-s301') });
    }
    // 5) UFLPA (org_id = id perusahaan) dan sertifikasi ESG
    for (const e of esg.kerja_paksa?.entitas || []) if (e.org_id === r.id) {
      r.isu_dagang.push({ asal: 'pengayaan', jenis: 'uflpa-daftar-entitas', entitas: e.entitas, ditambahkan: e.ditambahkan, sektor: e.sektor, kutipan: `Entitas ${e.entitas} masuk Daftar Entitas UFLPA (DHS AS) pada ${e.ditambahkan}${e.catatan ? '. ' + e.catatan : ''}`, ...sb('dhs-uflpa'), catatan_sumber: 'ringkasan daftar dibaca lewat penjelajah; verifikasi keanggotaan langsung di laman DHS sebelum dipakai' });
    }
    for (const c of esg.sertifikasi || []) if (c.org_id === r.id) {
      const s = (esg.sumber || []).find((x) => x.id === c.sumber_id);
      if (s) r.esg.push({ asal: 'pengayaan', skema: c.skema, status: c.status, kutipan: `${c.skema}: ${c.detail}`, sumber_url: s.url, tanggal_periksa: s.tanggal_akses || TGL, tingkat_bukti: TINGKAT_MEDIA[s.tingkat_bukti] || s.tingkat_bukti || 'via-pihak-ketiga' });
    }
    // 6) koreksi kantor pusat Wikidata yang salah
    const alasan = overlay.hapus_kantor_pusat?.[r.nama];
    if (alasan && r.kantor_pusat) { r.kantor_pusat = null; r.fakta = r.fakta.filter((f) => f.medan !== 'kantor_pusat'); r.catatan_koreksi = alasan; }
  }
  return baris;
}

// CLI: terapkan ke berkas keluaran yang sudah ada (tanpa jaringan).  node scripts/pipa/global_surya_perkaya.mjs
if (import.meta.url === new URL(process.argv[1] || '', 'file://').href) {
  const { tulisJson } = await import('./global_pemasok.mjs');
  const OUT = path.join(ROOT, 'data/global/surya/perusahaan.json'), PUB = path.join(ROOT, 'public/data/global/pemasok_surya.json');
  const d = bacaJson(OUT); perkaya(d.baris); tulisJson(OUT, d); tulisJson(PUB, d);
  const n = (k) => d.baris.filter((r) => r[k].length).length;
  console.log(JSON.stringify(Object.fromEntries(MILIK.map((k) => [k, n(k)]))));
}
