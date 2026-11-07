import { mulaiHalaman } from "/inti/kepala.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, nanti, debounce, hantuHtml, galatHtml, ikon } from "/inti/umum.js";
import { cariHtml, pilihHtml, hapusHtml, hitungHtml, exHtml, sumberHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { volumeSvg, batangMendatar, jumlahJendela } from "/berita_grafik.js";
import { muat, label, urlAman, norm, namaRegulasi } from "/publik.js";
import { IKON_TEK as IKT } from "/inti/ikon_tek.js";
import { LOGO_ORG } from "/beranda_data.js";
import { petaHtml, pasangPeta, agregat } from "/berita_peta.js";

const LANJUT = 30;
const HARI = 86400000;
const S = { mode: "hari", tab: "berita", q: "", tek: "", media: "", periode: "", bahasa: "", org: "", n: LANJUT };
let DIBANGUN = "", PRG = [], REG = [], B = null, V = null, FOTO = {}, ORG = new Map(), SEKARANG = Date.now();

const umur = (iso) => (SEKARANG - Date.parse(iso)) / HARI;
const tek = (k) => label("brt.tek.", k);
const baris = () => (S.tab === "berita" ? B : V);

function saring() {
  const q = norm(S.q.trim()), mak = S.periode ? +S.periode : 0;
  return baris().filter((r) => (!S.tek || (r.kepakaran || []).some((k) => S.tek.split(",").includes(k))) && (!S.media || (r.media || r.kanal) === S.media) && (!S.org || (r.organisasi_ids || []).includes(S.org))
    && (!S.bahasa || r.bahasa === S.bahasa) && (!mak || umur(r.terbit) <= mak) && (!q || r._cari.includes(q)));
}

function opsiTab() {
  const dari = (f) => [...new Set(baris().map(f).filter(Boolean))].sort((a, b) => a.localeCompare(b)).map((v) => [v, v]);
  return {
    tek: [["", t("brt.f.tek")], ...[...new Set(B.flatMap((r) => r.kepakaran || []))].map((k) => [k, tek(k)]).sort((a, b) => a[1].localeCompare(b[1])), ...(S.tek.includes(",") ? [[S.tek, S.tek.split(",").map(tek).join(" + ")]] : [])],
    media: [["", t(S.tab === "berita" ? "brt.f.media" : "brt.f.kanal")], ...dari((r) => r.media || r.kanal)],
    periode: [["", t("brt.f.periode")], ...["7", "30", "90"].map((v) => [v, t("brt.p." + v)])],
    bahasa: [["", t("brt.f.bahasa")], ["id", t("brt.b.id")], ["en", t("brt.b.en")]],
  };
}
function gambarSaring() {
  const o = opsiTab();
  document.getElementById("saring").innerHTML = cariHtml({ id: "f-q", label: t("brt.cari") })
    + pilihHtml({ id: "f-tek", ikon: "topik", label: t("brt.f.tek"), opsi: o.tek, nilai: S.tek })
    + pilihHtml({ id: "f-media", ikon: "jenis", label: t(S.tab === "berita" ? "brt.f.media" : "brt.f.kanal"), opsi: o.media, nilai: S.media })
    + pilihHtml({ id: "f-periode", ikon: "tahun", label: t("brt.f.periode"), opsi: o.periode, nilai: S.periode })
    + pilihHtml({ id: "f-bahasa", ikon: "bahasa", label: t("brt.f.bahasa"), opsi: o.bahasa, nilai: S.bahasa })
    + hapusHtml({ id: "f-hapus", label: t("jm.hapus_filter") }) + hitungHtml({ id: "f-hitung", teks: "" });
  document.getElementById("f-q").value = S.q;
  aturSaring();
}
/** Teknologi dan bahasa hanya untuk berita (video tidak berlabel). */
function aturSaring() {
  const v = S.tab === "video";
  for (const id of ["f-tek", "f-bahasa"]) document.getElementById(id).closest("label").hidden = v;
  document.getElementById("f-hapus").hidden = !(S.q || S.org || S.tek || S.media || S.periode || (!v && S.bahasa));
}
function gambarTab() {
  document.getElementById("tab").innerHTML = ["berita", "video"].map((k) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${S.tab === k}">${ikon(k, 18)}<span>${esc(t("brt.tab." + k))}</span></button>`).join("");
}
const TEMA_IKON = { kebijakan: "regulasi", pembiayaan: "analisis", "transisi-adil": "orang", karbon: "insight", industri: "tabel", elektrifikasi: "tek-listrik", efisiensi: "analisis" };
const TEK_WARNA = new Set(["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "penyimpanan", "nuklir"]);
const ikTek = (k) => IKT[k] || ikon(TEMA_IKON[k] || "tek-listrik", 18);
const klsTek = (k) => "jm-tek-" + (TEK_WARNA.has(k) ? k : "lain");
const inisialMedia = (m) => (String(m).replace(/^www\./, "").split(".")[0].replace(/[^a-z0-9]/gi, "").slice(0, 2) || "?").toUpperCase();
const PROGRAM = { "plts-100gw": [/100\s*GW/i, "100 GW"], b50: [/\bB-?50\b|biodiesel/i, "B50"], e20: [/\bE-?20\b|etanol/i, "E20"], jetp: [/\bJETP\b/i, "JETP"], wte: [/\bPSEL\b|waste to energy|\bWtE\b|sampah.{0,25}(energi|listrik)|(energi|listrik).{0,25}sampah/i, "sampah"], ruptl: [/RUPTL/i, "RUPTL"], psn: [/\bPSN\b|Proyek Strategis Nasional/i, "PSN"] };
const JENIS_REG = { uu: "uu", perpres: "perpres", pp: "pp", permen: "permen", perppu: "perppu", keppres: "keppres", inpres: "inpres", kepmen: "kepmen" };
const RX_REG = /\b(UU|Perpres|PP|Permen|Perppu|Keppres|Inpres|Kepmen)\s*(?:ESDM\s*)?(?:No\.?|Nomor)?\s*(\d{1,3})\s*(?:\/|\s*Tahun\s*)\s*(\d{4})/gi;
const regulasiDisebut = () => { const m = new Map(); for (const r of B) for (const x of r.judul.matchAll(RX_REG)) { const g = REG.find((q) => q.jenis === JENIS_REG[x[1].toLowerCase()] && String(q.nomor) === x[2] && String(q.tahun) === x[3]); if (g) m.set(g.id, { g, n: (m.get(g.id)?.n || 0) + 1 }); } return [...m.values()].sort((a, b) => b.n - a.n); };
/** Perubahan 7 hari terakhir terhadap 7 hari sebelumnya (kosong bila sebelumnya nol). */
const tren = (f) => { const ak = Date.parse(B[0].terbit), d = (r) => (ak - Date.parse(r.terbit)) / HARI; const a = B.filter((r) => f(r) && d(r) < 7).length, b = B.filter((r) => f(r) && d(r) >= 7 && d(r) < 14).length; return b ? Math.round((a / b - 1) * 100) : null; };
const urutHitung = (f) => { const m = new Map(); for (const r of B) for (const k of f(r)) m.set(k, (m.get(k) || 0) + 1); return [...m].sort((a, b) => b[1] - a[1]); };

function gambarPeta() {
  const A = agregat(B), est = `<span class="jm-pil jm-pil-est">${esc(t("an.est"))}</span>`;
  const el = document.getElementById("r-peta");
  if (!A.prov.length) { el.innerHTML = ""; return; }
  el.innerHTML = exHtml({ id: "ex-peta", ikon: "wilayah", topik: t("brt.ex.peta.ey"), tingkat: "h2", judulHtml: hlHtml("brt.ex.peta.j", A.prov[0].nama, { n: angka(A.berlokasi) }),
    subHtml: `${esc(t("brt.ex.peta.sub", { p: angka(Math.round(A.berlokasi / B.length * 100)) }))} ${est}`, isiHtml: petaHtml(),
    aksiHtml: aksiHtml({ csv: false }) + sumberHtml(`${esc(t("brt.sumber.peta"))} ${esc(tanggal(DIBANGUN))}.`) });
  pasangPeta(B, { onCari: (nama) => cariKe(nama) });
}
function cariKe(q) { ubah(() => { S.tab = "berita"; S.q = q; gambarTab(); gambarSaring(); }); document.getElementById("ex-semua").scrollIntoView({ block: "start" }); }

function gambarRingkas() {
  const ak = B[0].terbit, est = `<span class="jm-pil jm-pil-est">${esc(t("an.est"))}</span>`;
  const sumber = (kunci) => sumberHtml(`${esc(t(kunci || "brt.sumber"))} ${esc(tanggal(DIBANGUN))}.`);
  const ex = (o) => { const { sumberKunci, ...r } = o; return exHtml({ tingkat: "h2", ...r, aksiHtml: aksiHtml({ csv: false }) + sumber(sumberKunci) }); };
  const mode = `<span class="brt-mode" id="mode">${["hari", "minggu"].map((m) => `<button type="button" class="brt-chip" data-mode="${m}" aria-pressed="${S.mode === m}">${esc(t("brt.g.per_" + m))}</button>`).join("")}</span>`;
  document.getElementById("r-volume").innerHTML = ex({ id: "ex-volume", ikon: "berita", topik: t("brt.ex.vol.ey"), judulHtml: hlHtml("brt.ex.vol.j", angka(jumlahJendela(B, S.mode, ak)), { rentang: t("brt.ex.r_" + S.mode) }),
    subHtml: `${esc(t("brt.ex.vol.sub", { unit: t("brt.ex.u_" + S.mode), n: angka(B.length) }))}${mode}`, isiHtml: volumeSvg(B, S.mode, ak) });
  const tekTop = urutHitung((r) => r.kepakaran || []).slice(0, 10), medTop = urutHitung((r) => [r.media]).slice(0, 8), orgTop = urutHitung((r) => r.organisasi_ids || []).slice(0, 8);
  const prg = PRG.map((p) => [p, B.filter((r) => PROGRAM[p.id]?.[0].test(r.judul)).length]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]);
  const reg = regulasiDisebut();
  const logo = (id, nama) => { const s = LOGO_ORG[id]; return `<span class="brt-lg">${s ? `<img src="/img/logo/${s}.png" width="22" height="22" alt="" loading="lazy">` : esc(inisialMedia(nama))}</span>`; };
  let h = ex({ id: "ex-teknologi", ikon: "topik", topik: t("brt.ex.tek.ey"), judulHtml: hlHtml("brt.ex.tek.j", tek(tekTop[0][0])), subHtml: `${esc(t("brt.ex.tek.sub"))} ${est}`,
    isiHtml: batangMendatar(tekTop.map(([k, v]) => [tek(k), v, k, { ikon: ikTek(k), kelas: klsTek(k), tren: tren((r) => (r.kepakaran || []).includes(k)) }]), "topik") });
  if (orgTop.length && ORG.size) h += ex({ id: "ex-pelaku", ikon: "orang", topik: t("brt.ex.org.ey"), judulHtml: hlHtml("brt.ex.org.j", ORG.get(orgTop[0][0]) || ""), subHtml: esc(t("brt.ex.org.sub")), sumberKunci: "brt.sumber.tag",
    isiHtml: batangMendatar(orgTop.filter(([id]) => ORG.has(id)).map(([id, v]) => [ORG.get(id), v, id, { ikon: logo(id, ORG.get(id)) }]), "org") });
  if (prg.length) h += ex({ id: "ex-program", ikon: "proyek", topik: t("brt.ex.prg.ey"), judulHtml: hlHtml("brt.ex.prg.j", prg[0][0].nama), subHtml: `${esc(t("brt.ex.prg.sub"))} ${est}`, sumberKunci: "brt.sumber.tag",
    isiHtml: batangMendatar(prg.map(([p, v]) => [p.nama, v, PROGRAM[p.id][1], { ikon: ikon("proyek", 18) }]), "cari") });
  if (reg.length) h += ex({ id: "ex-regulasi", ikon: "regulasi", topik: t("brt.ex.reg.ey"), judulHtml: hlHtml("brt.ex.reg.j", namaRegulasi(reg[0].g)), subHtml: `${esc(t("brt.ex.reg.sub"))} ${est}`, sumberKunci: "brt.sumber.tag",
    isiHtml: batangMendatar(reg.slice(0, 8).map((x) => [namaRegulasi(x.g), x.n, namaRegulasi(x.g), { ikon: ikon("regulasi", 18) }]), "cari") });
  h += ex({ id: "ex-media", ikon: "jenis", topik: t("brt.ex.med.ey"), judulHtml: hlHtml("brt.ex.med.j", medTop[0][0]), subHtml: esc(t("brt.ex.med.sub")),
    isiHtml: batangMendatar(medTop.map(([k, v]) => [k, v, k, { ikon: `<span class="brt-lg">${esc(inisialMedia(k))}</span>` }]), "media") });
  document.getElementById("r-lain").innerHTML = h;
}
function gambarAngka() {
  const item = (v, k, ik) => `<div>${ikon(ik, 20)}<dd>${angka(v)}</dd><dt>${esc(t(k))}</dt></div>`;
  document.getElementById("angka").innerHTML = item(B.length, "brt.n.berita", "berita") + item(new Set(B.map((r) => r.media)).size, "brt.n.media", "jenis") + item(B.filter((r) => umur(r.terbit) <= 30).length, "brt.n.30", "tahun") + item(V.length, "brt.n.video", "video");
}

const FOTO_URL = (r) => urlAman(FOTO[r.id] || "");
const ikonSampul = (r) => ikTek((r.kepakaran || [])[0]);
/** Gambar sampul; tanpa foto = latar bermerek dengan ikon teknologi (tidak pernah inisial). Gambar gagal dimuat dicopot oleh penangan error. */
const sampul = (r, kelas, w, h, tag = false) => { const f = FOTO_URL(r); return `<span class="brt-sampul ${kelas}">${ikonSampul(r)}${f ? `<img src="${esc(f)}" width="${w}" height="${h}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : ""}${tag ? pil(r) : ""}</span>`; };
const tautan = (r, isi, kelas) => `<a class="${kelas}" href="${esc(urlAman(r.url))}" target="_blank" rel="noopener noreferrer" title="${esc(t("brt.buka"))}">${isi}</a>`;
const metaHtml = (r) => `<p class="brt-meta">${esc(r.media)}, ${esc(tanggal(r.terbit.slice(0, 10)))}</p>`;
const pil = (r) => (r.kepakaran?.[0] ? `<span class="brt-pil">${esc(tek(r.kepakaran[0]))}</span>` : "");
const tagHtml = (r, n = 2) => (r.kepakaran || []).slice(0, n).map((k) => `<button type="button" class="brt-tek" data-topik="${esc(k)}">${esc(tek(k))}</button>`).join("");
const orgHtml = (r) => (r.organisasi_ids || []).map((id) => ORG.get(id)).filter(Boolean).slice(0, 2).map((nama) => `<a class="brt-org" href="/direktori?tampil=lembaga">${esc(nama)}</a>`).join("");
const kartu = (r) => `<li class="brt-kartu-b">${tautan(r, sampul(r, "brt-s169", 400, 225, true) + `<span class="brt-cb"><span class="brt-judul">${esc(r.judul)}</span>${metaHtml(r)}</span>`, "brt-card")}</li>`;
const kecil = (r) => `<li class="brt-kartu-b">${tautan(r, sampul(r, "brt-s32", 96, 64) + `<span class="brt-cb"><span class="brt-judul">${esc(r.judul)}</span>${metaHtml(r)}</span>`, "brt-card brt-card-h")}</li>`;
const BAGIAN = [["surya", ["surya"]], ["panas", ["panas-bumi"]], ["bio", ["bioenergi", "biomassa-sampah"]], ["kebijakan", ["kebijakan", "pembiayaan", "transisi-adil"]]];
const dalamBagian = (ks) => B.filter((r) => umur(r.terbit) <= 90 && (r.kepakaran || []).some((k) => ks.includes(k)));
const urutFoto = (xs) => [...xs.filter(FOTO_URL), ...xs.filter((r) => !FOTO_URL(r))];
const kepalaBagian = (kunci, p, lihat) => `<header class="brt-sh"><h2>${esc(t("brt.sek." + kunci))}</h2>${p ? `<p class="brt-sub">${esc(p)}</p>` : ""}${lihat || ""}</header>`;
function gambarBagian() {
  const el = document.getElementById("bagian"), terbaru = B.filter((r) => umur(r.terbit) <= 90);
  const sor = urutFoto(B.slice(0, 40)).slice(0, 5), [lead, ...sisi] = sor;
  let html = `<section class="brt-bagian"><div class="jm-wadah">${kepalaBagian("sorotan", "")}
    <div class="brt-sorot"><article class="brt-lead-k">${tautan(lead, sampul(lead, "brt-s169", 800, 450, true) + `<span class="brt-cb"><span class="brt-judul brt-judul-b">${esc(lead.judul)}</span>${metaHtml(lead)}</span>`, "brt-card")}</article>
    <ul class="brt-sisi">${sisi.map(kecil).join("")}</ul></div></div></section>`;
  BAGIAN.forEach(([kunci, ks], i) => {
    const xs = dalamBagian(ks); if (!xs.length) return;
    const lihat = `<button type="button" class="brt-semua" data-lihat="${esc(ks.join(","))}">${esc(t("brt.lihat", { n: angka(xs.length) }))} &rarr;</button>`;
    html += `<section class="brt-bagian"><div class="jm-wadah">${kepalaBagian(kunci, t("brt.sek.p", { n: angka(xs.length) }), lihat)}<ul class="brt-grid-k">${urutFoto(xs.slice(0, 16)).slice(0, 4).map(kartu).join("")}</ul></div></section>`;
  });
  el.innerHTML = html;
}
const GRUP = [["hari", (u) => u < 1], ["minggu", (u) => u < 7], ["bulan", (u) => u < 30], ["lama", () => true]];
const grupDari = (iso) => { const u = umur(iso); return GRUP.find(([, f]) => f(u))[0]; };

function itemBerita(r) {
  const chips = tagHtml(r) + orgHtml(r);
  return `<li class="brt-item">${tautan(r, sampul(r, "brt-s32", 96, 64), "brt-gbr")}<div>${tautan(r, esc(r.judul), "brt-judul")}${metaHtml(r)}${chips ? `<div class="brt-label">${chips}</div>` : ""}</div></li>`;
}
function durasi(d) { const j = Math.floor(d / 3600), m = Math.floor((d % 3600) / 60), s = String(d % 60).padStart(2, "0"); return j ? `${j}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`; }
function itemVideo(r) {
  const lencana = r.jenis === "resmi" ? "jm-pil-ok" : "";
  return `<li><a class="brt-kartu" href="${esc(urlAman(r.url))}" target="_blank" rel="noopener noreferrer" title="${esc(t("brt.buka"))}">
    <span class="brt-gambar"><img src="https://i.ytimg.com/vi/${encodeURIComponent(r.id)}/mqdefault.jpg" width="320" height="180" alt="" loading="lazy" decoding="async">${r.durasi_detik ? `<span class="brt-durasi">${durasi(r.durasi_detik)}</span>` : ""}</span>
    <span class="brt-judul">${esc(r.judul)}</span>
    <span class="brt-meta"><span>${esc(r.kanal)}</span><span class="jm-pil ${lencana}">${esc(t("brt." + r.jenis))}</span><span>${esc(tanggal(r.terbit.slice(0, 10)))}</span></span></a></li>`;
}

function gambarIsi() {
  const rows = saring();
  document.getElementById("f-hitung").textContent = t("brt.hitung", { n: angka(rows.length), total: angka(baris().length) });
  document.querySelector("#ex-semua .jm-ex-j").innerHTML = hlHtml("brt.ex.semua.j", angka(rows.length), { total: angka(baris().length), jenis: t("brt.tab." + S.tab).toLowerCase() });
  const el = document.getElementById("isi");
  if (!rows.length) { el.innerHTML = `<p class="brt-lead">${esc(t("brt.kosong"))}</p>`; return; }
  const potong = rows.slice(0, S.n);
  let html;
  if (S.tab === "video") html = `<ul class="brt-video">${potong.map(itemVideo).join("")}</ul>`;
  else {
    html = "";
    let g = "";
    for (const r of potong) {
      const k = grupDari(r.terbit);
      if (k !== g) { html += `${g ? "</ul>" : ""}<h3 class="brt-grup">${esc(t("brt.g." + k))}</h3><ul class="brt-daftar">`; g = k; }
      html += itemBerita(r);
    }
    html += "</ul>";
  }
  if (rows.length > S.n) html += `<div class="brt-lagi"><button type="button" class="jm-tbl" data-aksi="lagi">${esc(t("brt.lagi", { n: angka(Math.min(LANJUT, rows.length - S.n)) }))}</button></div>`;
  el.innerHTML = html;
}

function tulisUrl() {
  const u = new URL(location.href);
  for (const k of ["tab", "q", "tek", "media", "periode", "bahasa"]) { const v = S[k]; !v || (k === "tab" && v === "berita") ? u.searchParams.delete(k) : u.searchParams.set(k, v); }
  history.replaceState(null, "", u);
}
/** Chrome sinkron, daftar berat sesudah satu bingkai tercat. */
function ubah(sinkron) {
  S.n = LANJUT; sinkron && sinkron(); aturSaring(); tulisUrl(); nanti(gambarIsi);
}

async function mulai() {
  document.getElementById("isi").innerHTML = hantuHtml(6);
  try {
    const [b, v, f] = await Promise.all([muat("berita"), muat("video"), muat("berita_foto").catch(() => ({}))]);
    FOTO = f || {};
    SEKARANG = Date.now();
    B = b.baris.map((r) => ({ ...r, _cari: norm(`${r.judul} ${r.media}`) })).sort((x, y) => y.terbit.localeCompare(x.terbit));
    V = v.baris.map((r) => ({ ...r, _cari: norm(`${r.judul} ${r.kanal}`) })).sort((x, y) => y.terbit.localeCompare(x.terbit));
    DIBANGUN = b.dibangun_pada;
    document.querySelector("#semua .jm-ex-aksi").innerHTML = aksiHtml({ csv: false }) + sumberHtml(`${esc(t("brt.sumber"))} ${esc(tanggal(DIBANGUN))}.`);
  } catch { document.getElementById("isi").innerHTML = galatHtml(); return; }
  const p = new URLSearchParams(location.search);
  for (const k of Object.keys(S)) if (p.has(k) && k !== "n") S[k] = p.get(k);
  if (S.tab !== "video") S.tab = "berita";
  gambarAngka(); gambarBagian(); gambarRingkas(); gambarTab(); gambarSaring(); gambarIsi();
  gambarPeta();
  Promise.all([muat("organisasi"), muat("program").catch(() => ({ baris: [] })), muat("regulasi").catch(() => ({ baris: [] }))]).then(([o, p, r]) => { ORG = new Map(o.baris.map((x) => [x.id, x.singkatan || x.nama])); PRG = p.baris; REG = r.baris; gambarBagian(); gambarRingkas(); gambarIsi(); }).catch(() => {});
}

(async () => {
  await mulaiHalaman();
  document.getElementById("semua").innerHTML = exHtml({ id: "ex-semua", ikon: "berita", topik: t("brt.ex.semua.ey"), judulHtml: "", subHtml: esc(t("brt.ex.semua.sub")),
    isiHtml: `<div class="jm-tab" role="tablist" id="tab"></div><div class="jm-saring" id="saring"></div><div id="isi" role="tabpanel"></div>`, aksiHtml: " " });
  document.getElementById("isi").addEventListener("click", (e) => {
    if (e.target.closest("[data-aksi=ulang]")) return mulai();
    if (e.target.closest("[data-aksi=lagi]")) { S.n += LANJUT; return nanti(gambarIsi); }
    const c = e.target.closest("[data-topik]"); if (c) { ubah(() => { S.tek = c.dataset.topik; document.getElementById("f-tek").value = S.tek; }); }
  });
  document.getElementById("tab").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]"); if (!b || b.dataset.tab === S.tab) return;
    ubah(() => { S.tab = b.dataset.tab; S.media = ""; if (S.tab === "video") { S.tek = ""; S.bahasa = ""; } gambarTab(); gambarSaring(); });
  });
  document.getElementById("ringkasan").addEventListener("click", (e) => { const b = e.target.closest("[data-mode]"); if (!b) return; S.mode = b.dataset.mode; for (const x of b.parentElement.children) x.setAttribute("aria-pressed", String(x === b)); nanti(gambarRingkas); });
  document.querySelector("main").addEventListener("click", (e) => {
    if (e.target.closest("#isi, #saring, #tab")) return;
    const c = e.target.closest("[data-cari]"); if (c && !c.closest("#brPn")) return cariKe(c.dataset.cari);
    const k = e.target.closest("[data-topik],[data-media],[data-lihat],[data-org]"); if (!k) return;
    ubah(() => { S.tab = "berita"; if (k.dataset.lihat) S.tek = k.dataset.lihat; else if (k.dataset.topik) S.tek = k.dataset.topik; else if (k.dataset.org) S.org = k.dataset.org; else S.media = k.dataset.media; gambarTab(); gambarSaring(); });
    document.getElementById("ex-semua").scrollIntoView({ block: "start" });
  });
  addEventListener("error", (e) => { if (e.target.tagName === "IMG" && e.target.closest(".brt-sampul")) e.target.remove(); }, true);
  const cariTunda = debounce(() => ubah(() => {}), 120);
  const sr = document.getElementById("saring");
  sr.addEventListener("input", (e) => { if (e.target.id === "f-q") { S.q = e.target.value; cariTunda(); } });
  sr.addEventListener("change", (e) => { const k = e.target.id.slice(2); if (e.target.id.startsWith("f-") && k in S && k !== "q") ubah(() => { S[k] = e.target.value; }); });
  sr.addEventListener("click", (e) => { if (e.target.closest("#f-hapus")) ubah(() => { Object.assign(S, { q: "", tek: "", media: "", periode: "", bahasa: "", org: "" }); gambarSaring(); }); });
  await mulai();
})();
