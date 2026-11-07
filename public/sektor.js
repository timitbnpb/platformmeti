/* /sektor: peta sektor organisasi EBT (per teknologi dan per peran rantai nilai); /sektor?id=<id>: satu sektor.
   Hitungan dari organisasi.json dan proyek.json; investasi = jumlah nilai_investasi USD proyek terkait (turunan, berpil EST).
   Rute dibuat statis (query) agar src/worker.js tidak berubah. */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, hantuHtml, ikon } from "/inti/umum.js";
import { IKON_TEK } from "/inti/ikon_tek.js";
import { logoOrgSatu } from "/inti/logo_org.js";
import { paginasiHtml } from "/inti/paginasi.js";
import { muat } from "/publik.js";
import { tampilGalat, saatBahasa, pil, ubinHtml } from "/analisis.js";

const $ = (id) => document.getElementById(id);
const TEK = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "penyimpanan", "hidrogen"];
const WARNA_TEK = { surya: "surya", bayu: "bayu", hidro: "hidro", "panas-bumi": "panas", bioenergi: "bio", "biomassa-sampah": "sampah", penyimpanan: "simpan", hidrogen: "hidrogen" };
/* peran rantai nilai: kategori K19(d) + subjenis (peran_rantai); satu organisasi boleh masuk beberapa peran */
const PERAN = {
  pengembang: { ik: "proyek", w: "surya", f: (o) => hasAny(o.peran_rantai, ["pengembang", "IPP", "operator"]) },
  pemasok: { tek: "industri", w: "industri", f: (o) => hasAny(o.peran_rantai, ["manufaktur", "produsen BBN"]) },
  epc: { tek: "jaringan", w: "jaringan", f: (o) => hasAny(o.peran_rantai, ["EPC", "konsultan"]) },
  pendana: { tek: "pembiayaan", w: "biaya", f: (o) => o.kategori?.kode === "keuangan" || hasAny(o.peran_rantai, ["pembiaya"]) },
  pemerintah: { tek: "kebijakan", w: "kebijakan", f: (o) => ["kementerian-lembaga", "pemda"].includes(o.kategori?.kode) },
  riset: { ik: "buku", w: "listrik", f: (o) => ["perguruan-tinggi", "think-tank"].includes(o.kategori?.kode) },
  asosiasi: { ik: "tautan", w: "adil", f: (o) => ["asosiasi", "lsm-yayasan"].includes(o.kategori?.kode) },
};
const hasAny = (a, l) => (a || []).some((x) => l.includes(x));
const nama = (id) => (TEK.includes(id) ? t("an.tek." + id) : t("sk.peran." + id));
const ikonSektor = (id) => {
  const p = PERAN[id], w = TEK.includes(id) ? WARNA_TEK[id] : p?.w;
  const g = TEK.includes(id) ? IKON_TEK[id] : p?.tek ? IKON_TEK[p.tek] : ikon(p.ik, 20);
  return `<span class="jm-sk-ik jm-sk-w-${w}" aria-hidden="true">${g}</span>`;
};
const NORM = (n) => String(n || "").toLowerCase().replace(/\([^)]*\)/g, " ").replace(/\b(pt|tbk|persero|cv)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
let ORG, PROY, SEK, ASOS, aplsiSet = new Set(), filter = new Set(), urutan = { k: "org", arah: -1 }, hal = 1, sumbu = "tek";
const PER = 25;

function hitung() {
  const pr = new Map(PROY.baris.map((p) => [p.id, p]));
  const mwP = (p) => { const k = (p.kapasitas || []).find((c) => /^MWp?$/.test(c.satuan) && Number.isFinite(c.nilai)); return k ? k.nilai : 0; };
  const usd = (p) => (p.nilai_investasi || []).filter((v) => v.satuan === "USD" && Number.isFinite(v.nilai)).reduce((s, v) => Math.max(s, v.nilai), 0);
  const baris = ORG.baris.map((o) => {
    const ps = (o.proyek_ids || []).map((i) => pr.get(i)).filter(Boolean);
    return { o, ps, mw: ps.reduce((s, p) => s + mwP(p), 0), usd: ps.reduce((s, p) => s + usd(p), 0) };
  });
  const sek = new Map();
  const tambah = (id, r) => (sek.get(id) || sek.set(id, { id, rows: [] }).get(id)).rows.push(r);
  for (const r of baris) {
    for (const k of r.o.kepakaran || []) if (TEK.includes(k)) tambah(k, r);
    for (const [id, p] of Object.entries(PERAN)) if (p.f(r.o)) tambah(id, r);
  }
  for (const s of sek.values()) {
    const u = new Map(); for (const r of s.rows) for (const p of r.ps) u.set(p.id, p);
    s.org = s.rows.length; s.berproyek = s.rows.filter((r) => r.ps.length).length; s.proyek = u.size;
    s.mw = [...u.values()].reduce((a, p) => a + mwP(p), 0); s.usd = [...u.values()].reduce((a, p) => a + usd(p), 0);
  }
  SEK = sek;
  aplsiSet = new Set((ASOS?.baris?.aplsi?.anggota || []).map(NORM));
}
const diAplsi = (o) => aplsiSet.has(NORM(o.nama));
const uang = (v) => (v ? (v >= 1e9 ? t("sk.jt", { n: angka(v / 1e9, { desimal: 1 }) }) : t("sk.jt2", { n: angka(Math.round(v / 1e6)) })) : "-");
const tgl = () => tanggal(ORG.dibangun_pada || PROY.dibangun_pada);
const urutBy = (a, k, arah) => [...a].sort((x, y) => (typeof x[k] === "string" ? x[k].localeCompare(y[k]) : (x[k] || 0) - (y[k] || 0)) * arah || String(x.nm || x.id).localeCompare(String(y.nm || y.id)));
const th = (k, kunci, num) => `<th scope="col" class="${num ? "jm-sk-n" : ""}" aria-sort="${urutan.k === k ? (urutan.arah > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-sk-th" data-urut="${k}" aria-label="${esc(t("sk.urut", { k: t(kunci) }))}">${esc(t(kunci))}</button></th>`;
const kolom = (kunci, v, num) => `<td data-label="${esc(t(kunci))}"${num ? ' class="jm-sk-n"' : ""}>${v}</td>`;
const angkaSel = (n) => (n ? esc(angka(n)) : '<span class="jm-sk-dim">-</span>');

function halamanSemua() {
  const ids = (sumbu === "tek" ? TEK : Object.keys(PERAN)).filter((i) => SEK.has(i));
  const ada = [...SEK.values()], uniq = new Set(ORG.baris.map((o) => o.id));
  const besar = [...ada].sort((a, b) => b.org - a.org).slice(0, 3).map((s) => `${nama(s.id)} (${angka(s.org)})`).join(", ");
  $("judul").textContent = t("sk.judul");
  $("jawab").textContent = t("sk.lead", { tgl: tgl(), n: angka(uniq.size), m: angka(ada.length), besar });
  $("aksi").innerHTML = `<a href="/direktori?tampil=lembaga">${ikon("direktori", 18)}${esc(t("sk.ke_direktori"))}</a><a href="/wilayah">${ikon("peta", 18)}${esc(t("sk.ke_peta"))}</a><a href="/proyek">${ikon("proyek", 18)}${esc(t("sk.ke_proyek"))}</a>`;
  const totProy = new Set(ORG.baris.flatMap((o) => o.proyek_ids || [])).size;
  $("ubin").innerHTML = ubinHtml([{ href: "/direktori?tampil=lembaga", ikon: "gedung", nilai: angka(uniq.size), label: t("sk.u.org") }, { href: "/proyek", ikon: "proyek", nilai: angka(totProy), label: t("sk.u.proyek") }]);
  const rows = urutBy(ids.map((i) => ({ ...SEK.get(i), nm: nama(i) })), urutan.k === "nm" ? "nm" : urutan.k, urutan.arah);
  $("skIsi").innerHTML = `<div class="jm-sk-seg" role="group" aria-label="${esc(t("sk.sumbu"))}"><button type="button" data-sumbu="tek" aria-pressed="${sumbu === "tek"}">${esc(t("sk.sumbu.tek"))}</button><button type="button" data-sumbu="peran" aria-pressed="${sumbu === "peran"}">${esc(t("sk.sumbu.peran"))}</button></div>
  <section class="jm-sk-kartu"><h2>${esc(t("sk.semua"))}</h2><div class="jm-sk-tab jm-gulir"><table class="jm-tabel"><thead><tr>${th("nm", "sk.k.sektor")}${th("org", "sk.k.org", 1)}${th("berproyek", "sk.k.berproyek", 1)}${th("mw", "sk.k.mw", 1)}${th("proyek", "sk.k.proyek", 1)}${th("usd", "sk.k.invest", 1)}</tr></thead><tbody>${rows.map((s) => `<tr><td data-label="${esc(t("sk.k.sektor"))}"><span class="jm-sk-nm">${ikonSektor(s.id)}<a href="/sektor?id=${esc(s.id)}">${esc(s.nm)}</a></span></td>${kolom("sk.k.org", angkaSel(s.org), 1)}${kolom("sk.k.berproyek", angkaSel(s.berproyek), 1)}${kolom("sk.k.mw", angkaSel(Math.round(s.mw)), 1)}${kolom("sk.k.proyek", angkaSel(s.proyek), 1)}${kolom("sk.k.invest", s.usd ? `${esc(uang(s.usd))}<span class="jm-sk-pil">${pil("an.est", "info")}</span>` : '<span class="jm-sk-dim">-</span>', 1)}</tr>`).join("")}</tbody></table></div></section>${aplsiSet.size ? `<section class="jm-sk-kartu"><h2>${esc(t("sk.program"))}</h2><ul class="jm-sk-grid"><li><a class="jm-sk-kt" href="/sektor?program=aplsi"><span class="jm-sk-lg">${ikon("tautan", 20)}</span><span>${esc(t("sk.program.aplsi"))}</span></a></li></ul></section>` : ""}`;
}

function halamanSatu(id) {
  const s = SEK.get(id);
  if (!s) { $("judul").textContent = t("sk.tak_dikenal"); $("jawab").textContent = ""; $("ubin").innerHTML = ""; $("aksi").innerHTML = ""; $("skIsi").innerHTML = `<p><a href="/sektor">${esc(t("sk.semua_link"))}</a></p>`; return; }
  $("judul").textContent = t("sk.h1", { nama: nama(id) });
  $("jawab").textContent = t("sk.lead2", { tgl: tgl(), n: angka(s.org), nama: nama(id), p: angka(s.berproyek), mw: angka(Math.round(s.mw)) });
  $("aksi").innerHTML = `<a href="/sektor">${ikon("direktori", 18)}${esc(t("sk.semua_link"))}</a>`;
  $("ubin").innerHTML = ubinHtml([
    { href: "/direktori?tampil=lembaga", ikon: "gedung", nilai: angka(s.org), label: t("sk.u.org") },
    { href: "/proyek", ikon: "proyek", nilai: angka(s.proyek), label: t("sk.u.proyek") },
    { href: "/proyek", ikon: "analisis", nilai: angka(Math.round(s.mw)), label: t("sk.u.mw") },
    { href: "/proyek", ikon: "pembiayaan", nilai: s.usd ? uang(s.usd) : "-", label: t("sk.u.invest"), turunan: !!s.usd },
  ]);
  const cnt = { proyek: s.rows.filter((r) => r.ps.length).length, situs: s.rows.filter((r) => r.o.situs).length, aplsi: s.rows.filter((r) => diAplsi(r.o)).length };
  const lolos = (r) => (!filter.has("proyek") || r.ps.length) && (!filter.has("situs") || r.o.situs) && (!filter.has("aplsi") || diAplsi(r.o));
  const chips = `<div class="jm-sk-chip" role="group">${["proyek", "situs", ...(aplsiSet.size ? ["aplsi"] : [])].map((f) => `<button type="button" class="jm-pil" data-filter="${f}" aria-pressed="${filter.has(f)}">${esc(t("sk.f." + f, { n: angka(cnt[f]) }))}</button>`).join("")}<span class="jm-sk-dim">${esc(t("sk.f.tampil", { n: angka(s.rows.filter(lolos).length) }))}</span></div>`;
  const data = s.rows.filter(lolos).map((r) => ({ o: r.o, nm: r.o.nama, kota: r.o.lokasi?.kota || "", n: r.ps.length, mw: Math.round(r.mw) }));
  const k = urutan.k === "org" ? "nm" : urutan.k, a = urutBy(data, k, urutan.k === "org" ? 1 : urutan.arah), dari = (hal - 1) * PER;
  const tek = (o) => (o.kepakaran || []).filter((x) => TEK.includes(x)).map((x) => t("an.tek." + x)).join(", ");
  const baris = a.slice(dari, dari + PER).map((r) => { const lg = logoOrgSatu(r.o.id, r.o.nama, r.o.logo);
    return `<tr><td data-label="${esc(t("sk.k.nama"))}"><span class="jm-sk-nm"><span class="jm-sk-lg">${lg ? `<img src="${esc(lg)}" alt="" loading="lazy" width="36" height="36">` : ikon("gedung", 20)}</span><a href="/o/${esc(r.o.id)}">${esc(r.nm)}</a>${diAplsi(r.o) ? `<a class="jm-pil jm-sk-pil" href="/sektor?program=aplsi">${esc(t("sk.lencana.aplsi"))}</a>` : ""}</span></td>${kolom("sk.k.sektor", esc(tek(r.o)) || '<span class="jm-sk-dim">-</span>')}${kolom("sk.k.lokasi", esc([r.o.lokasi?.kota, r.o.lokasi?.provinsi].filter(Boolean).join(", ")) || '<span class="jm-sk-dim">-</span>')}${kolom("sk.k.proyek", angkaSel(r.n), 1)}${kolom("sk.k.mw", angkaSel(r.mw), 1)}</tr>`; }).join("");
  $("skIsi").innerHTML = `<section class="jm-sk-kartu"><h2>${esc(t("sk.tabel_org"))}</h2>${chips}<div class="jm-sk-tab jm-gulir"><table class="jm-tabel"><thead><tr>${th("org", "sk.k.nama")}<th scope="col">${esc(t("sk.k.sektor"))}</th>${th("kota", "sk.k.lokasi")}${th("n", "sk.k.proyek", 1)}${th("mw", "sk.k.mw", 1)}</tr></thead><tbody>${baris}</tbody></table></div>${paginasiHtml({ hal, total: a.length, per: PER, satuan: "sk.pag" })}</section>`;
}

function halamanProgram(kode) {
  const A = ASOS?.baris?.[kode];
  if (!A) { $("judul").textContent = t("sk.p.tak_ada"); $("jawab").textContent = ""; $("ubin").innerHTML = ""; $("aksi").innerHTML = ""; $("skIsi").innerHTML = `<p><a href="/sektor">${esc(t("sk.semua_link"))}</a></p>`; return; }
  const peta = new Map(ORG.baris.map((o) => [NORM(o.nama), o])), ada = [], belum = [];
  for (const n of A.anggota) (peta.has(NORM(n)) ? ada : belum).push(n);
  const nm = t("sk.program.aplsi");
  $("judul").textContent = t("sk.p.judul", { nama: "APLSI" });
  $("jawab").textContent = t("sk.p.lead", { nama: "APLSI", tgl: tanggal(A.tanggal_baca), n: angka(A.anggota.length), d: angka(ada.length), b: angka(belum.length) });
  $("aksi").innerHTML = `<a href="/sektor">${ikon("direktori", 18)}${esc(t("sk.semua_link"))}</a><a href="${esc(A.sumber_url)}" rel="noopener noreferrer" target="_blank">${ikon("tautan", 18)}${esc(t("sk.p.sumber"))}</a>`;
  $("ubin").innerHTML = ubinHtml([{ href: "/sektor?program=aplsi", ikon: "gedung", nilai: angka(A.anggota.length), label: nm }, { href: "/direktori?tampil=lembaga", ikon: "direktori", nilai: angka(ada.length), label: t("sk.p.ada") }]);
  const kartu = ada.map((n) => { const o = peta.get(NORM(n)), lg = logoOrgSatu(o.id, o.nama, o.logo); return `<li><a class="jm-sk-kt" href="/o/${esc(o.id)}"><span class="jm-sk-lg">${lg ? `<img src="${esc(lg)}" alt="" loading="lazy" width="36" height="36">` : ikon("gedung", 20)}</span><span>${esc(o.nama)}</span></a></li>`; }).join("");
  const tbl = (kep, baris) => `<div class="jm-sk-tab jm-gulir"><table class="jm-tabel"><thead><tr>${kep.map((k) => `<th scope="col">${esc(t(k))}</th>`).join("")}</tr></thead><tbody>${baris}</tbody></table></div>`;
  const tidak = Object.entries(ASOS.tidak_terbaca || {}).map(([k, v]) => `<tr><td data-label="${esc(t("sk.p.nama"))}">${esc(t("sk.p.nama_asos." + k))}</td><td data-label="${esc(t("sk.p.alasan"))}">${esc(v)}</td></tr>`).join("");
  $("skIsi").innerHTML = `<section class="jm-sk-kartu"><h2>${esc(t("sk.p.ada"))}</h2><ul class="jm-sk-grid">${kartu}</ul></section>
  <section class="jm-sk-kartu"><h2>${esc(t("sk.p.belum"))}</h2><p class="jm-sk-dim">${esc(t("sk.p.belum.ket"))}</p>${belum.length ? tbl(["sk.p.nama", "sk.p.dikata"], belum.map((n) => `<tr><td data-label="${esc(t("sk.p.nama"))}">${esc(n)}</td><td data-label="${esc(t("sk.p.dikata"))}">${esc(nm)}</td></tr>`).join("")) : ""}</section>
  ${tidak ? `<section class="jm-sk-kartu"><h2>${esc(t("sk.p.tidak"))}</h2>${tbl(["sk.p.nama", "sk.p.alasan"], tidak)}</section>` : ""}`;
}
function gambar() { const q = new URLSearchParams(location.search), id = q.get("id"); if (q.get("program")) halamanProgram(q.get("program")); else if (id) halamanSatu(id); else halamanSemua(); }

await mulaiHalaman();
$("skIsi").innerHTML = hantuHtml(5);
try { [ORG, PROY] = await Promise.all([muat("organisasi"), muat("proyek")]); } catch { ORG = null; }
ASOS = await muat("anggota_asosiasi").catch(() => null);
if (!ORG || !PROY) tampilGalat($("skIsi"), () => location.reload()); else {
  hitung(); gambar(); saatBahasa(gambar);
  $("skIsi").addEventListener("error", (e) => { const im = e.target; if (im.tagName === "IMG") im.replaceWith(Object.assign(document.createElement("span"), { innerHTML: ikon("gedung", 20) }).firstChild); }, true);
  $("skIsi").addEventListener("click", (e) => {
    const b = e.target.closest("[data-sumbu],[data-urut],[data-hal],[data-filter]"); if (!b) return;
    if (b.dataset.filter) { filter.has(b.dataset.filter) ? filter.delete(b.dataset.filter) : filter.add(b.dataset.filter); hal = 1; }
    if (b.dataset.sumbu) { sumbu = b.dataset.sumbu; urutan = { k: "org", arah: -1 }; }
    else if (b.dataset.urut) { const k = b.dataset.urut; urutan = { k, arah: urutan.k === k ? -urutan.arah : k === "nm" || k === "kota" ? 1 : -1 }; hal = 1; }
    else if (b.dataset.hal) hal = Number(b.dataset.hal);
    gambar();
  });
}
