/* Turunan organisasi untuk sensus (/direktori tab Organisasi) dan profil /o/<id>: satu perhitungan, dua layar.
   Sumber: organisasi.json, proyek.json, anggota_asosiasi.json, rantai_org.json (opsional). Semua angka turunan: "min" (hanya proyek tertaut)
   atau EST; skor yakin = Hipotesis (rumus tertulis di i18n so.cara.*). Tidak menambah angka yang tak ada di data. */
import { muat } from "/publik.js";

export const TEK = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "penyimpanan", "hidrogen"];
export const NORM = (n) => String(n || "").toLowerCase().replace(/\([^)]*\)/g, " ").replace(/\b(pt|tbk|persero|cv)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
export const domain = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const BOBOT_BUKTI = { resmi: 1, "situs-sendiri": 0.8, sedang: 0.6, cuplikan: 0.5, "kata-pihak": 0.4, "via-pihak-ketiga": 0.4, rendah: 0.2 };
const PERAN_SURAT = /^(info|contact|kontak|humas|sekretariat|secretariat|sekretaris|corsec|corporate|ir|cs|customercare|admin|office|hello|media|ppid|layanan|sales|marketing|support|pr)\b/i;

const mwDari = (p) => { const k = (p.kapasitas || []).find((c) => /^MWp?$/.test(c.satuan) && Number.isFinite(c.nilai)); return k ? k.nilai : 0; };
/* Sektor dari proyek tertaut: teknologi ber-MW terbesar (jumlah proyek bila MW kosong); bila >1 teknologi dan yang terbesar < 60% jadi "lintas". Tanpa proyek: kepakaran. */
export const TEK_PROYEK = [...TEK, "nuklir"];
export function sektorProyek(ps) {
  const mw = new Map(), n = new Map();
  for (const p of ps) { if (!TEK_PROYEK.includes(p.teknologi)) continue; mw.set(p.teknologi, (mw.get(p.teknologi) || 0) + mwDari(p)); n.set(p.teknologi, (n.get(p.teknologi) || 0) + 1); }
  if (!n.size) return "";
  const pakaiMw = [...mw.values()].some((v) => v > 0), ukur = pakaiMw ? mw : n, total = [...ukur.values()].reduce((a, b) => a + b, 0);
  const [top, nilai] = [...ukur.entries()].sort((a, b) => b[1] - a[1])[0];
  return n.size > 1 && nilai / total < 0.6 ? "lintas" : top;
}
/* BUMN induk (Persero, langsung di bawah negara/Danantara) bekerja di banyak teknologi: selalu "lintas" (pemilik 8 Nov 2026).
   Anak usaha BUMN (mis. Pertamina NRE, PLN Indonesia Power) tetap memakai sektor unggulan dari portofolionya. */
export const bumnInduk = (o, anak) => o.kategori?.kode === "bumn" && !anak && !/\b(perum|jasa tirta)\b/i.test(o.nama) && (/\bpersero\b/i.test(o.nama) || !o.induk || /^danantara$/i.test(o.induk));
export const sektorDari = (o) => (o.kepakaran || []).find((k) => TEK.includes(k)) || "lain";
export const suratPeran = (o) => (o.kontak?.surel || []).filter((e) => PERAN_SURAT.test(String(e).split("@")[0]));
export const teleponKantor = (o) => (o.kontak?.telepon || []).filter((x) => typeof x === "string" && x.trim());

export function skorYakin(o, nProyek) {
  const kolom = [o.lokasi?.kota, o.situs, o.deskripsi, o.tahun_berdiri, o.logo, o.kontak, nProyek || null];
  const isi = kolom.filter(Boolean).length / kolom.length;
  const sm = o.sumber || [], dom = new Set(sm.map((s) => domain(s.url)).filter(Boolean));
  const bukti = sm.length ? sm.reduce((a, s) => a + (BOBOT_BUKTI[s.tingkat_bukti] ?? 0.3), 0) / sm.length : 0;
  const skor = Math.round((0.4 * isi + 0.3 * Math.min(1, dom.size / 3) + 0.3 * bukti) * 100) / 100;
  return { skor, isi, domain: dom.size, bukti };
}

let cache;
export function muatSensus() {
  return (cache ||= (async () => {
    const [org, proyek, asos, rantai] = await Promise.all([muat("organisasi"), muat("proyek"), muat("anggota_asosiasi").catch(() => null), muat("rantai_org").catch(() => null)]);
    const pr = new Map(proyek.baris.map((p) => [p.id, p])), ke = new Map();
    for (const p of proyek.baris) for (const x of Object.values(p.pihak || {}).flat()) if (x.organisasi_id) (ke.get(x.organisasi_id) || ke.set(x.organisasi_id, new Set()).get(x.organisasi_id)).add(p.id);
    const aplsi = new Set((asos?.baris?.aplsi?.anggota || []).map(NORM)), nama = new Map(org.baris.map((o) => [NORM(o.nama), o]));
    const baris = org.baris.map((o) => {
      const ids = new Set([...(o.proyek_ids || []), ...(ke.get(o.id) || [])]), ps = [...ids].map((i) => pr.get(i)).filter(Boolean);
      const prov = new Set(ps.map((p) => p.lokasi?.provinsi).filter(Boolean));
      const yakin = skorYakin(o, ps.length);
      const anak = (o.keanggotaan || []).some((k) => k.jenis === "bagian_dari") || (!!o.induk && nama.has(NORM(o.induk)) && nama.get(NORM(o.induk)).id !== o.id);
      return { o, id: o.id, nm: o.nama, sek: bumnInduk(o, anak) ? "lintas" : sektorProyek(ps) || sektorDari(o), ps, nProy: ps.length, mw: ps.reduce((s, p) => s + mwDari(p), 0), nProv: prov.size, aplsi: aplsi.has(NORM(o.nama)),
        anak, yakin };
    });
    baris.sort((a, b) => b.nProy - a.nProy || b.mw - a.mw || b.yakin.skor - a.yakin.skor || a.nm.localeCompare(b.nm));
    baris.forEach((r, i) => { r.rank = i + 1; });
    return { baris, per: new Map(baris.map((r) => [r.id, r])), org, proyek, rantai, tgl: org.dibangun_pada, tglProyek: proyek.dibangun_pada };
  })());
}

/* "Sebanding di sektor": tetangga peringkat dalam sektor yang sama (dua di atas, tiga di bawah), tanpa dirinya. */
export function sebanding(S, r, n = 5) {
  const sama = S.baris.filter((x) => x.sek === r.sek), i = sama.indexOf(r);
  const dari = Math.max(0, Math.min(i - 2, sama.length - n - 1));
  return sama.filter((x) => x !== r).slice(dari, dari + n);
}
