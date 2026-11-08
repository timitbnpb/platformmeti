/* Bagian data tertaut (aturan pemilik: tiap data baru tertaut dua arah). Dipakai /o/<id>, /p/<id>, /wilayah/<kode>.
   Satu bagian ringkas per sumber, hilang bila kosong. Teks lewat t() (kunci td.*); nilai data lewat esc(); tanpa gaya inline. */
import { t, angka, ada, tanggal } from "/i18n.js";
import { esc } from "/inti/umum.js";
import { exHtml, sumberHtml, lihatSemuaHtml } from "/inti/komponen.js";
import { hlHtml } from "/inti/aksi_ex.js";
import { muat } from "/publik.js";

const ambil = (n) => muat(n).catch(() => null);
const urut = (a, f) => [...a].sort((x, y) => f(y) - f(x));
const slug = (k) => (ada("td.s." + k) ? t("td.s." + k) : String(k || "").replace(/[-_]+/g, " ").replace(/^./, (c) => c.toUpperCase()));
const daftarSlug = (a, n = 5) => (a || []).slice(0, n).map((k) => `<span class="jm-pil">${esc(slug(k))}</span>`).join(" ");
const tgl = (s) => (s ? tanggal(String(s).slice(0, 10)) : "-");
const nama = (iso) => { try { return new Intl.DisplayNames([document.documentElement.lang || "id"], { type: "region" }).of(String(iso).toUpperCase()); } catch { return String(iso || ""); } };
const bendera = (iso) => (/^[a-z]{2}$/i.test(iso || "") ? `<span class="td-neg"><img class="td-bd" src="/img/bendera/${esc(String(iso).toLowerCase())}.svg" width="20" height="15" alt="" loading="lazy" decoding="async"><span>${esc(nama(iso))}</span></span>` : "-");
const usd = (v) => (v == null ? "-" : t("td.usd", { n: angka(v, { desimal: v < 10 ? 1 : 0 }) }));
const th = (k, kls = "") => `<th scope="col"${kls ? ` class="${kls}"` : ""}>${esc(t(k))}</th>`;
const td = (k, isi, kls = "") => `<td data-label="${esc(t(k))}"${kls ? ` class="${kls}"` : ""}>${isi}</td>`;
const tbl = (kolom, baris) => `<div class="jm-gulir"><table class="jm-tabel jm-tabel-tetap"><thead><tr>${kolom.map(([k, c]) => th(k, c)).join("")}</tr></thead><tbody>${baris.join("")}</tbody></table></div>`;
const taut = (href, teks) => `<a href="${esc(href)}">${esc(teks)}</a>`;

/* satu bagian exhibit; n = jumlah baris (0 = bagian disembunyikan) */
function bagian({ id, ik, topik, j, n, hl, isi, tglData, lihat, sub }) {
  if (!n) return "";
  return exHtml({
    id, ikon: ik, topik: t(topik), judulHtml: hlHtml(j, hl ?? angka(n)), subHtml: sub ? esc(t(sub)) : "",
    aksiHtml: tglData ? sumberHtml(esc(t("pf.sumber_data", { tanggal: tgl(tglData) }))) : "",
    isiHtml: isi, kakiHtml: lihat ? lihatSemuaHtml(lihat[0], t(lihat[1])) : "",
  });
}

/* ================= /o/<id> ================= */
export async function bagianOrg(id, { proyekAda } = {}) {
  const [pg, wte, lain, sur, trx, kar, plt, pb, ob] = await Promise.all(["global/pelaku_global", "global/pemasok_wte", "global/pemasok_lain", "global/pemasok_surya", "transaksi", "karbon_registri", "pltu", "global/pembiayaan_luar", "obligasi_hijau"].map(ambil));
  const bn = await ambil("bioenergi");
  const out = [];

  /* peran global */
  const gl = (pg?.baris || []).filter((b) => b.org_id === id);
  if (gl.length) {
    const kartu = gl.map((b) => {
      const ikat = [...new Map((b.proyek_indonesia || []).map((x) => [x.proyek_id, x])).values()].filter((x) => !proyekAda || proyekAda.has(x.proyek_id)).slice(0, 8);
      return `<div class="td-kartu"><dl class="pf-satu"><div><dt>${esc(t("td.negara"))}</dt><dd>${bendera(b.negara_iso2)}</dd></div>`
        + `<div><dt>${esc(t("td.kelompok"))}</dt><dd>${esc(slug(b.kelompok))}</dd></div>`
        + `<div><dt>${esc(t("td.peran"))}</dt><dd>${daftarSlug(b.peran)}</dd></div>`
        + `<div><dt>${esc(t("td.topik"))}</dt><dd>${daftarSlug(b.topik, 8)}</dd></div>`
        + (b.tahun_berdiri ? `<div><dt>${esc(t("td.berdiri"))}</dt><dd>${esc(String(b.tahun_berdiri))}</dd></div>` : "")
        + `</dl>${ikat.length ? `<p class="td-ikat"><b>${esc(t("td.ikat"))}</b> ${ikat.map((x) => `${taut("/p/" + encodeURIComponent(x.proyek_id), x.nama || x.proyek_id)} <small>${esc(slug(x.peran))}</small>`).join("; ")}</p>` : ""}</div>`;
    }).join("");
    out.push(bagian({ id: "peran-global", ik: "globe", topik: "td.ey.global", j: "td.j.global", n: gl.length, isi: kartu, tglData: pg.dibangun_pada, lihat: ["/rantai-global", "td.lihat.rantai"] }));
  }

  /* ekosistem baterai dan kendaraan listrik */
  const [be, hili] = await Promise.all(["baterai_ev", "hilirisasi"].map(ambil));
  const bt = [];
  for (const th of be?.tahap || []) for (const p of th.pemain || []) if ([p.org_id, ...(p.org_lain || [])].includes(id)) bt.push({ tab: th.id, nama: p.nama, st: p.status });
  for (const b of hili?.baris || []) if ((b.pemilik || []).some((p) => p.org_id === id)) { const tab = b.rantai === "sel" ? "sel" : b.rantai === "smelter" || b.jenis === "hpal" ? "olah" : ""; if (tab) bt.push({ tab, nama: b.nama, st: b.status }); }
  if (bt.length) {
    const baris = bt.map((p) => `<tr>${td("td.c.tahap", taut("/baterai-ev?tab=" + encodeURIComponent(p.tab), t("bev.tab." + p.tab)))}${td("td.c.proyek", esc(p.nama))}${td("td.c.status", ada("bev.st." + p.st) ? esc(t("bev.st." + p.st)) : "-")}</tr>`);
    out.push(bagian({ id: "baterai-ev", ik: "baterai", topik: "td.ey.baterai", j: "td.j.baterai", n: bt.length, isi: tbl([["td.c.tahap"], ["td.c.proyek"], ["td.c.status"]], baris), tglData: be?.dibangun_pada, lihat: ["/baterai-ev", "td.lihat.baterai"] }));
  }

  /* pemasok (surya / sampah-energi / rantai lain) */
  const pas = [];
  for (const b of (sur?.baris || []).filter((x) => x.id === id)) pas.push({ tab: "surya", neg: b.negara_iso2, seg: b.segmen, prod: b.segmen, ind: (b.proyek_indonesia || []).length });
  for (const b of (wte?.baris || []).filter((x) => x.id === id || x.organisasi_id_ada === id)) pas.push({ tab: "wte", neg: b.negara, seg: b.teknologi, prod: b.komponen, ind: (b.indonesia || []).length });
  for (const b of (lain?.baris || []).filter((x) => x.organisasi_id === id)) pas.push({ tab: (b.segmen || [])[0] || "lain", neg: b.negara_iso2, seg: b.segmen, prod: b.subsegmen?.length ? b.subsegmen : b.produk, ind: (b.proyek_indonesia || []).length });
  if (pas.length) {
    const baris = pas.map((p) => `<tr>${td("td.c.rantai", taut("/rantai-global?tab=" + encodeURIComponent(p.tab), slug(p.tab)))}${td("td.c.negara", bendera(p.neg))}${td("td.c.segmen", daftarSlug(p.seg))}${td("td.c.produk", daftarSlug(p.prod, 6))}${td("td.c.ind", p.ind ? esc(angka(p.ind)) : "-", "jm-num")}</tr>`);
    out.push(bagian({ id: "pemasok", ik: "pabrik", topik: "td.ey.pemasok", j: "td.j.pemasok", n: pas.length, isi: tbl([["td.c.rantai"], ["td.c.negara"], ["td.c.segmen"], ["td.c.produk"], ["td.c.ind", "jm-num"]], baris), tglData: lain?.dibangun_pada || wte?.dibangun_pada, lihat: ["/rantai-global", "td.lihat.rantai"] }));
  }

  /* bioenergi: peran pemain di rantai bioenergi (rujukan bioenergi.json, tab tujuan) */
  const R = bn?.rujukan || {}, peranBio = [["produsen_fame", "fame", "biodiesel"], ["produsen_etanol", "etanol", "bioetanol"], ["pemasok_biomassa", "biomassa", "listrik"], ["operator", "cofiring", "listrik"], ["asosiasi", "asosiasi", "biodiesel"], ["pabrikan_global", "pabrikan", "biodiesel"]]
    .filter(([k]) => (R[k] || []).includes(id)).map(([, p, tab]) => [p, tab]);
  if ((bn?.saf?.org_ids || []).includes(id)) peranBio.push(["saf", "saf"]);
  if ((bn?.pelet?.org_ids || []).includes(id)) peranBio.push(["pelet", "pelet"]);
  if ((bn?.biogas?.pltbg || []).some((u) => (u.org_ids || []).includes(id))) peranBio.push(["biogas", "biogas"]);
  out.push(bagian({ id: "bioenergi", ik: "bioenergi", topik: "td.ey.bio", j: "td.j.bio", n: peranBio.length, tglData: bn?.dibangun_pada, lihat: ["/bioenergi", "td.lihat.bio2"],
    isi: tbl([["td.c.peran"], ["td.c.rantai"]], peranBio.map(([p, tab]) => `<tr>${td("td.c.peran", esc(t("td.bio.p." + p)))}${td("td.c.rantai", taut("/bioenergi?tab=" + tab, t("bn.tab." + tab)))}</tr>`)) }));

  /* transaksi */
  const tr = urut((trx?.baris || []).filter((b) => (b.pihak || []).some((p) => p.org_id === id)), (b) => Date.parse(b.tanggal) || 0);
  out.push(bagian({ id: "transaksi", ik: "transaksi", topik: "td.ey.transaksi", j: "td.j.transaksi", n: tr.length, tglData: trx?.dibangun_pada, lihat: ["/transaksi", "td.lihat.transaksi"],
    isi: tbl([["td.c.tanggal"], ["td.c.jenis"], ["td.c.aset"], ["td.c.peran"], ["td.c.nilai", "jm-num"]], tr.map((b) => `<tr>${td("td.c.tanggal", esc(tgl(b.tanggal)))}${td("td.c.jenis", esc(slug(b.jenis)))}${td("td.c.aset", esc(b.aset || "-"))}${td("td.c.peran", esc(slug((b.pihak.find((p) => p.org_id === id) || {}).peran)))}${td("td.c.nilai", b.nilai?.usd_juta != null ? esc((b.nilai.est ? "~" : "") + usd(b.nilai.usd_juta)) : "-", "jm-num")}</tr>`)) }));

  /* karbon: proyek yang dikembangkan */
  const kr = (kar?.baris || []).filter((b) => b.organisasi_id === id);
  out.push(bagian({ id: "karbon", ik: "karbon", topik: "td.ey.karbon", j: "td.j.karbon", n: kr.length, tglData: kar?.dibangun_pada, lihat: ["/karbon", "td.lihat.karbon"],
    isi: tbl([["td.c.proyek"], ["td.c.registri"], ["td.c.sektor"], ["td.c.status"]], kr.map((b) => {
      const r = Array.isArray(b.registri) ? b.registri[0] : null;
      return `<tr>${td("td.c.proyek", esc(b.nama))}${td("td.c.registri", r?.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.nama + " " + r.id)}</a>` : esc(r ? r.nama : "-"))}${td("td.c.sektor", esc(slug(b.sektor)))}${td("td.c.status", esc(slug(b.status)))}</tr>`;
    })) }));

  /* obligasi dan sukuk hijau yang diterbitkan */
  const og = urut((ob?.baris || []).filter((b) => b.penerbit_org_id === id), (b) => b.tahun || 0);
  out.push(bagian({ id: "obligasi-hijau", ik: "kartu", topik: "td.ey.obligasi", j: "td.j.obligasi", n: og.length, tglData: ob?.dibangun_pada, lihat: ["/keuangan-hijau#obligasi", "td.lihat.obligasi"],
    isi: tbl([["td.c.instrumen"], ["td.c.tahun"], ["td.c.nilai", "jm-num"], ["td.c.kupon", "jm-num"], ["td.c.tenor", "jm-num"], ["td.c.bukti"]], og.map((b) => `<tr>${td("td.c.instrumen", b.sumber_url ? `<a href="${esc(b.sumber_url)}" target="_blank" rel="noopener noreferrer">${esc(b.instrumen)}</a>` : esc(b.instrumen))}${td("td.c.tahun", esc(String(b.tahun || "-")))}${td("td.c.nilai", b.nilai == null ? "-" : esc(angka(b.nilai, { desimal: b.nilai % 1 ? 1 : 0 }) + " " + (b.satuan_nilai || "")), "jm-num")}${td("td.c.kupon", b.kupon_persen == null ? "-" : esc(angka(b.kupon_persen, { desimal: 2 }) + "%"), "jm-num")}${td("td.c.tenor", b.tenor_tahun == null ? "-" : esc(t("td.tenor_th", { n: angka(b.tenor_tahun, { desimal: b.tenor_tahun % 1 ? 1 : 0 }) })), "jm-num")}${td("td.c.bukti", esc(slug(b.tingkat_bukti)))}</tr>`)) }));

  /* PLTU milik */
  const pl = urut((plt?.baris || []).filter((b) => b.pemilik?.org_id === id), (b) => b.mw_operasi || 0);
  out.push(bagian({ id: "pltu", ik: "industri", topik: "td.ey.pltu", j: "td.j.pltu", n: pl.length, tglData: plt?.dibangun_pada, lihat: ["/peta?l=pltu", "td.lihat.peta"],
    isi: tbl([["td.c.pltu"], ["td.c.mw", "jm-num"], ["td.c.tahun"], ["td.c.prov"], ["td.c.persen", "jm-num"]], pl.map((b) => `<tr>${td("td.c.pltu", esc(b.nama))}${td("td.c.mw", esc(angka(b.mw_operasi || 0)), "jm-num")}${td("td.c.tahun", esc(String(b.th_awal || "-")))}${td("td.c.prov", b.prov_kode ? taut("/wilayah/" + b.prov_kode, b.kab || b.prov_kode) : "-")}${td("td.c.persen", b.pemilik.persen != null ? esc(angka(b.pemilik.persen) + "%") : "-", "jm-num")}</tr>`)) }));

  /* pembiayaan luar */
  const idb = new Set(pb?.per_organisasi?.[id] || []);
  const pbs = urut((pb?.baris || []).filter((b) => idb.has(b.id)), (b) => b.nilai_usd_juta || 0).slice(0, 25);
  out.push(bagian({ id: "pembiayaan-luar", ik: "berlian", topik: "td.ey.biaya", j: "td.j.biaya", n: idb.size ? pbs.length : 0, tglData: pb?.dibangun_pada,
    isi: tbl([["td.c.proyek"], ["td.c.pemberi"], ["td.c.tahun"], ["td.c.teknologi"], ["td.c.nilai", "jm-num"]], pbs.map((b) => `<tr>${td("td.c.proyek", b.proyek_id ? taut("/p/" + encodeURIComponent(b.proyek_id), b.nama) : esc(b.nama))}${td("td.c.pemberi", esc(b.pemberi || "-"))}${td("td.c.tahun", esc(String(b.tahun || "-")))}${td("td.c.teknologi", esc(slug(b.teknologi)))}${td("td.c.nilai", esc(usd(b.nilai_usd_juta)), "jm-num")}</tr>`)) }));

  /* lelang dan pengadaan EBT (tertaut dua arah dengan /lelang) */
  const lel = await ambil("lelang");
  const ll = urut((lel?.putaran || []).filter((p) => [...(p.pemenang || []), ...(p.peserta || []), p.penyelenggara].some((o) => o.org_id === id)), (p) => Date.parse(p.tanggal.length === 4 ? p.tanggal + "-01-01" : p.tanggal.length === 7 ? p.tanggal + "-01" : p.tanggal) || 0);
  out.push(bagian({ id: "lelang", ik: "lelang", topik: "td.ey.lelang", j: "td.j.lelang", n: ll.length, tglData: lel?.dibangun_pada, lihat: ["/lelang", "td.lihat.lelang"],
    isi: tbl([["lel.c.tgl"], ["lel.c.putaran"], ["lel.c.tahap"], ["lel.c.skema"]], ll.map((p) => `<tr>${td("lel.c.tgl", esc(p.tanggal))}${td("lel.c.putaran", taut("/lelang#putaran", p.nama))}${td("lel.c.tahap", esc(t("lel.tahap." + p.tahap)))}${td("lel.c.skema", esc(t("lel.skema." + p.skema)))}</tr>`)) }));
  return out.join("");
}

/* ================= /p/<id> ================= */
export async function bagianProyek(id) {
  const [pg, pb, ps, kp, rs] = await Promise.all(["global/pelaku_global", "global/pembiayaan_luar", "psel", "karbon_proyek", "risiko_proyek"].map(ambil));
  const out = [];

  /* pemangku global */
  const per = pg?.per_proyek?.[id] || [], byOrg = new Map((pg?.baris || []).map((b) => [b.org_id, b]));
  out.push(bagian({ id: "pemangku-global", ik: "globe", topik: "td.ey.global", j: "td.j.p_global", n: per.length, tglData: pg?.dibangun_pada, lihat: ["/rantai-global", "td.lihat.rantai"],
    isi: tbl([["td.c.organisasi"], ["td.c.peran"], ["td.c.negara"]], per.map((x) => { const b = byOrg.get(x.org_id); return `<tr>${td("td.c.organisasi", taut("/o/" + encodeURIComponent(x.org_id), b?.nama || x.org_id))}${td("td.c.peran", esc(slug(x.peran)))}${td("td.c.negara", bendera(b?.negara_iso2))}</tr>`; })) }));

  /* pembiayaan luar */
  const idb = new Set(pb?.per_proyek?.[id] || []);
  const pbs = urut((pb?.baris || []).filter((b) => idb.has(b.id)), (b) => b.nilai_usd_juta || 0);
  out.push(bagian({ id: "pembiayaan-luar", ik: "berlian", topik: "td.ey.biaya", j: "td.j.p_biaya", n: pbs.length, tglData: pb?.dibangun_pada,
    isi: tbl([["td.c.pemberi"], ["td.c.penerima"], ["td.c.tahun"], ["td.c.nilai", "jm-num"]], pbs.map((b) => `<tr>${td("td.c.pemberi", b.pemberi_org_id ? taut("/o/" + encodeURIComponent(b.pemberi_org_id), b.pemberi) : esc(b.pemberi || "-"))}${td("td.c.penerima", b.penerima_org_id ? taut("/o/" + encodeURIComponent(b.penerima_org_id), b.penerima) : esc(b.penerima || "-"))}${td("td.c.tahun", esc(String(b.tahun || "-")))}${td("td.c.nilai", esc(usd(b.nilai_usd_juta)), "jm-num")}</tr>`)) }));

  /* PSEL */
  const pl = (ps?.baris || []).filter((b) => b.proyek_id === id);
  out.push(bagian({ id: "psel", ik: "energi-baru", topik: "td.ey.psel", j: "td.j.psel", n: pl.length, tglData: ps?.dibangun_pada, lihat: ["/energi-baru", "td.lihat.eb"],
    isi: tbl([["td.c.kota"], ["td.c.kap"], ["td.c.status"], ["td.c.pengembang"]], pl.map((b) => `<tr>${td("td.c.kota", esc([b.kota, b.provinsi].filter(Boolean).join(", ")))}${td("td.c.kap", b.kapasitas_ton_hari?.[0] != null ? esc(t("td.ton_hari", { n: angka(b.kapasitas_ton_hari[0]) })) : "-")}${td("td.c.status", esc(slug(b.status)))}${td("td.c.pengembang", (b.pengembang || []).map((x) => (x.organisasi_id ? taut("/o/" + encodeURIComponent(x.organisasi_id), x.nama) : esc(x.nama))).join("; ") || "-")}</tr>`)) }));

  /* karbon */
  const kb = (kp?.baris || []).filter((b) => b.proyek_id === id);
  out.push(bagian({ id: "karbon", ik: "karbon", topik: "td.ey.karbon", j: "td.j.p_karbon", n: kb.length, tglData: kp?.dibangun_pada, lihat: ["/karbon", "td.lihat.karbon"],
    isi: tbl([["td.c.proyek"], ["td.c.registri"], ["td.c.pengembang"], ["td.c.status"]], kb.map((b) => `<tr>${td("td.c.proyek", esc(b.nama))}${td("td.c.registri", b.sumber_url ? `<a href="${esc(b.sumber_url)}" target="_blank" rel="noopener noreferrer">${esc(slug(b.registri))}</a>` : esc(slug(b.registri)))}${td("td.c.pengembang", b.organisasi_id ? taut("/o/" + encodeURIComponent(b.organisasi_id), b.pengembang) : esc(b.pengembang || "-"))}${td("td.c.status", esc(slug(b.status)))}</tr>`)) }));

  /* risiko */
  const rk = (rs?.baris || []).filter((b) => b.id === id && b.skor != null);
  out.push(bagian({ id: "risiko", ik: "peringatan", topik: "td.ey.risiko", j: "td.j.risiko", n: rk.length, tglData: rs?.dibangun_pada, lihat: ["/risiko", "td.lihat.risiko"],
    isi: tbl([["td.c.skor", "jm-num"], ["td.c.kelas"], ["td.c.hutan"], ["td.c.gambut"], ["td.c.bahaya"]], rk.map((b) => `<tr>${td("td.c.skor", esc(angka(b.skor)), "jm-num")}${td("td.c.kelas", esc(slug(b.kelas)))}${td("td.c.hutan", esc(b.komponen?.hutan?.ket || "-"))}${td("td.c.gambut", esc(b.komponen?.gambut?.ket || "-"))}${td("td.c.bahaya", esc(b.komponen?.bahaya?.ket || "-"))}</tr>`)) }));
  /* lelang dan pengadaan EBT (tertaut dua arah dengan /lelang) */
  const lel = await ambil("lelang");
  const ll = urut((lel?.putaran || []).filter((p) => (p.proyek_id || []).includes(id)), (p) => Date.parse(p.tanggal.length === 4 ? p.tanggal + "-01-01" : p.tanggal.length === 7 ? p.tanggal + "-01" : p.tanggal) || 0);
  out.push(bagian({ id: "lelang", ik: "lelang", topik: "td.ey.lelang", j: "td.j.p_lelang", n: ll.length, tglData: lel?.dibangun_pada, lihat: ["/lelang", "td.lihat.lelang"],
    isi: tbl([["lel.c.tgl"], ["lel.c.putaran"], ["lel.c.tahap"], ["lel.c.skema"]], ll.map((p) => `<tr>${td("lel.c.tgl", esc(p.tanggal))}${td("lel.c.putaran", taut("/lelang#putaran", p.nama))}${td("lel.c.tahap", esc(t("lel.tahap." + p.tahap)))}${td("lel.c.skema", esc(t("lel.skema." + p.skema)))}</tr>`)) }));
  return out.join("");
}

/* ================= /wilayah/<kode> ================= */
export async function bagianWilayah(kode, namaProv) {
  const [atlas, bio, psn, kaw, sis, plt, isu, akses] = await Promise.all(["potensi_atlas", "riset/biomassa", "psn", "kawasan", "sistem_pln", "pltu", "isu", "akses_energi"].map(ambil));
  const out = [], k = String(kode), nm = String(namaProv || "").toLowerCase();

  const a = (atlas?.baris || []).find((b) => String(b.kode) === k);
  if (a) out.push(bagian({ id: "atlas", ik: "kompas", topik: "td.ey.atlas", j: "td.j.atlas", n: 1, hl: angka(a.pvout_kwh_per_kwp_tahun), tglData: String(a.tahun), sub: "td.sub.atlas",
    isi: `<dl class="pf-satu"><div><dt>${esc(t("td.pvout"))}</dt><dd>${esc(angka(a.pvout_kwh_per_kwp_tahun))} kWh/kWp</dd></div><div><dt>GHI</dt><dd>${esc(angka(a.ghi_kwh_per_m2_tahun))} kWh/m²</dd></div><div><dt>DNI</dt><dd>${esc(angka(a.dni_kwh_per_m2_tahun))} kWh/m²</dd></div><div><dt>${esc(t("td.suhu"))}</dt><dd>${esc(angka(a.suhu_udara_c))} °C</dd></div></dl>`, lihat: ["/peluang", "td.lihat.peluang"] }));

  const bm = (bio?.baris || []).find((b) => String(b.kode_prov) === k);
  if (bm) out.push(bagian({ id: "biomassa", ik: "tek-bio", topik: "td.ey.biomassa", j: "td.j.biomassa", n: bm.mw_termal_setara_est ? 1 : 0, hl: angka(Math.round(bm.mw_termal_setara_est || 0)), tglData: bio.dibangun_pada, lihat: ["/bioenergi?tab=bahan", "td.lihat.bio"],
    isi: `<dl class="pf-satu"><div><dt>${esc(t("td.sawit"))}</dt><dd>${esc(angka(bm.luas_sawit_ha))} ha</dd></div><div><dt>CPO</dt><dd>${esc(angka(bm.cpo_ton))} t</dd></div><div><dt>${esc(t("td.energi"))}</dt><dd>${esc(angka(bm.energi_tj_per_tahun_est))} TJ/${esc(t("td.tahun"))} (${esc(t("td.est"))})</dd></div><div><dt>RUPTL / RUEN</dt><dd>${esc(angka(bm.ruptl_bioenergi_mw ?? 0))} / ${esc(angka(bm.ruen_bioenergi_mw ?? 0))} MW</dd></div></dl>` }));

  const ps = (psn?.baris || []).filter((b) => (b.prov_kode || []).map(String).includes(k));
  out.push(bagian({ id: "psn", ik: "mahkota", topik: "td.ey.psn", j: "td.j.psn", n: ps.length, tglData: psn?.dibangun_pada, lihat: ["/program#psn", "td.lihat.psn"],
    isi: tbl([["td.c.proyek"], ["td.c.sektor"], ["td.c.status"], ["td.c.cod"]], ps.slice(0, 20).map((b) => `<tr>${td("td.c.proyek", taut("/program#" + encodeURIComponent(b.id), b.nama))}${td("td.c.sektor", esc(slug(b.sektor)))}${td("td.c.status", esc(slug(b.status)))}${td("td.c.cod", esc(String(b.cod || "-")))}</tr>`)) }));

  const kw = (kaw?.baris || []).filter((b) => String(b.provinsi || "").toLowerCase() === nm);
  out.push(bagian({ id: "kawasan", ik: "kawasan", topik: "td.ey.kawasan", j: "td.j.kawasan", n: kw.length, tglData: kaw?.meta?.diperbarui, lihat: ["/kawasan", "td.lihat.kawasan"],
    isi: tbl([["td.c.kawasan"], ["td.c.jenis"], ["td.c.sektor"], ["td.c.status"]], kw.slice(0, 20).map((b) => `<tr>${td("td.c.kawasan", esc(b.nama))}${td("td.c.jenis", esc(String(b.jenis || "").toUpperCase()))}${td("td.c.sektor", esc(b.sektor || "-"))}${td("td.c.status", esc(slug(b.status)))}</tr>`)) }));

  const si = (sis?.baris || []).filter((b) => (b.provinsi || []).some((x) => String(x.kode) === k));
  out.push(bagian({ id: "sistem", ik: "sistem-listrik", topik: "td.ey.sistem", j: "td.j.sistem", n: si.length, tglData: sis?.dibangun_pada, lihat: ["/sistem", "td.lihat.sistem"],
    isi: tbl([["td.c.sistem"], ["td.c.kap", "jm-num"], ["td.c.beban", "jm-num"], ["td.c.ebt", "jm-num"]], si.map((b) => `<tr>${td("td.c.sistem", taut("/sistem", b.nama?.[document.documentElement.lang] || b.nama?.id || b.singkat))}${td("td.c.kap", b.kapasitas_mw?.total != null ? esc(angka(b.kapasitas_mw.total) + " MW") : "-", "jm-num")}${td("td.c.beban", b.beban_puncak_mw?.[0] != null ? esc(angka(b.beban_puncak_mw[0]) + " MW") : "-", "jm-num")}${td("td.c.ebt", b.bauran_ebt_persen != null ? esc(angka(b.bauran_ebt_persen) + "%") : "-", "jm-num")}</tr>`)) }));

  const pl = urut((plt?.baris || []).filter((b) => String(b.prov_kode ?? b.prov) === k), (b) => b.mw_operasi || 0);
  out.push(bagian({ id: "pltu", ik: "industri", topik: "td.ey.pltu", j: "td.j.w_pltu", n: pl.length, tglData: plt?.dibangun_pada, lihat: [`/peta?l=pltu`, "td.lihat.peta"],
    isi: tbl([["td.c.pltu"], ["td.c.mw", "jm-num"], ["td.c.tahun"], ["td.c.pemilik"]], pl.slice(0, 20).map((b) => `<tr>${td("td.c.pltu", esc(b.nama))}${td("td.c.mw", esc(angka(b.mw_operasi || 0)), "jm-num")}${td("td.c.tahun", esc(String(b.th_awal || "-")))}${td("td.c.pemilik", b.pemilik?.org_id ? taut("/o/" + encodeURIComponent(b.pemilik.org_id), b.pemilik.nama) : esc(b.pemilik?.nama || "-"))}</tr>`)) }));

  const is = (isu?.baris || []).filter((b) => (b.prov || []).map(String).includes(k));
  out.push(bagian({ id: "isu", ik: "peringatan", topik: "td.ey.isu", j: "td.j.isu", n: is.length, tglData: isu?.dibangun_pada, lihat: ["/isu", "td.lihat.isu"],
    isi: tbl([["td.c.isu"], ["td.c.tema"], ["td.c.status"], ["td.c.terbaru"]], is.slice(0, 15).map((b) => `<tr>${td("td.c.isu", taut("/isu#" + encodeURIComponent(b.id), b.judul))}${td("td.c.tema", esc(slug(b.tema)))}${td("td.c.status", esc(slug(b.status)))}${td("td.c.terbaru", esc(tgl(b.terbaru)))}</tr>`)) }));

  const ak = (akses?.provinsi || []).find((b) => String(b.kode) === k);
  if (ak) out.push(bagian({ id: "akses", ik: "petir", topik: "td.ey.akses", j: "td.j.akses", n: 1, hl: angka(ak.re_persen, { desimal: 1 }) + "%", tglData: akses.dibangun_pada, lihat: ["/akses-energi", "td.lihat.akses"],
    isi: `<dl class="pf-satu"><div><dt>${esc(t("td.re"))} ${esc(String(ak.re_tahun || ""))}</dt><dd>${esc(angka(ak.re_persen, { desimal: 1 }))}%</dd></div><div><dt>${esc(t("td.desa"))}</dt><dd>${esc(angka(ak.jumlah_desa || 0))}</dd></div><div><dt>${esc(t("td.desa_belum"))}</dt><dd>${esc(angka(ak.desa_belum_2024 ?? 0))}</dd></div></dl>` }));
  return out.join("");
}
