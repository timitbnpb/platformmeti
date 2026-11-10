/* /event/<slug>: poster, latar belakang, video, foto, berita; panel: waktu, lokasi + peta mini, penyelenggara, Daftar (RSVP), bagikan, QR, kalender, hitung mundur, tag, contact person. */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, nanti, ikon, hantuHtml, kosongHtml, galatHtml, galatTeks, api } from "/inti/umum.js";
import { exHtml, sumberHtml, terkaitHtml } from "/inti/komponen.js";
import { muat, label, urlAman } from "/publik.js";
import { khSisi } from "/inti/kh.js";
import { svgSosmed } from "/inti/sosmed.js";
import { muatAcara, hariIni, hariKe, urlEvent, urlMutlak, posterHtml, pilJenis, pilStatus, lokasiTeks, jamTeks, tglRentang, selesai, topikDari, tagHtml, bagikanHtml, pasangSalin,
  gcalUrl, unduhIcs, qrSvg, logoMitra, mitraHtml, pemutarHtml, pasangPemutar, durasiTeks, thumbUrl, utc, IKON_JENIS } from "/event_umum.js";

const slug = decodeURIComponent(location.pathname.split("/").filter(Boolean)[1] || "");
let B = null, API = null, WAKTU = 0;
const baris = (ik, k, isiHtml) => (isiHtml ? `<li>${ikon(ik, 20)}<span><small>${esc(t(k))}</small>${isiHtml}</span></li>` : "");

/* ---------- hitung mundur ---------- */
function mundurHtml() {
  if (selesai(B)) return `<div class="ev-mundur ev-mundur-selesai">${pilStatus(B)}</div>`;
  const sel = ["hari", "jam", "menit", "detik"].map((k) => `<div><b data-md="${k}">0</b><small>${esc(t("ev.md." + k))}</small></div>`).join("");
  return `<div class="ev-mundur" role="timer" aria-label="${esc(t("ev.md.label"))}">${sel}</div>`;
}
function tik() {
  const el = document.querySelector(".ev-mundur:not(.ev-mundur-selesai)");
  if (!el) { clearInterval(WAKTU); return; }
  const mulai = utc(B.tanggal) - 7 * 3600e3; // 00:00 WIB hari pertama
  const sisa = Math.max(0, Math.floor((mulai - Date.now()) / 1000));
  const d = { hari: Math.floor(sisa / 86400), jam: Math.floor(sisa % 86400 / 3600), menit: Math.floor(sisa % 3600 / 60), detik: sisa % 60 };
  for (const k in d) el.querySelector(`[data-md=${k}]`).textContent = String(d[k]).padStart(k === "hari" ? 1 : 2, "0");
  if (sisa === 0) { el.classList.add("ev-mundur-mulai"); }
}

/* ---------- RSVP ---------- */
const sayaDaftar = () => (API?.saya || []).find((d) => d.event_id === slug);
const aturAcara = () => API?.atur?.[slug] || null;
function sisaKuota() { const a = aturAcara(); if (!a || a.kuota == null) return null; const mine = sayaDaftar(); return Math.max(0, a.kuota - (API.terdaftar[slug] || 0) + (mine && mine.status === "terdaftar" ? mine.jumlah : 0)); }
function rsvpHtml() {
  if (selesai(B)) return "";
  const a = aturAcara(), mine = sayaDaftar(), sisa = sisaKuota();
  const buka = a && a.terbuka && !(a.batas && hariIni() > a.batas);
  const luar = B.daftar_url && urlAman(B.daftar_url) ? `<a class="jm-tbl" href="${esc(B.daftar_url)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 18)}<span>${esc(t("ev.daftar_luar"))}</span></a>` : "";
  if (!API) return `<div class="ev-rsvp">${luar}</div>`;
  if (mine && mine.status === "terdaftar") return `<div class="ev-rsvp ev-rsvp-ok"><p>${ikon("centang", 18)}<span>${esc(t("ev.rsvp.ok", { n: angka(mine.jumlah) }))}</span></p><div class="ev-rsvp-aksi"><button type="button" class="jm-tbl jm-tbl-kecil" data-rsvp="buka">${ikon("ubah", 16)}<span>${esc(t("ev.rsvp.ubah"))}</span></button><button type="button" class="jm-tbl jm-tbl-kecil jm-tbl-bahaya" data-rsvp="batal">${ikon("silang", 16)}<span>${esc(t("ev.rsvp.batal"))}</span></button></div></div>`;
  if (!buka) return `<div class="ev-rsvp"><p class="ev-rsvp-info">${ikon("info", 16)}<span>${esc(t(a && a.terbuka ? "ev.rsvp.lewat" : "ev.rsvp.tutup"))}</span></p>${luar}</div>`;
  const batas = a.batas ? `<small>${esc(t("ev.rsvp.batas", { tanggal: tanggal(a.batas) }))}</small>` : "";
  const kuota = sisa === null ? "" : `<small>${esc(t("ev.rsvp.sisa", { n: angka(sisa), total: angka(a.kuota) }))}</small>`;
  return `<div class="ev-rsvp"><button type="button" class="jm-tbl jm-tbl-utama ev-daftar" data-rsvp="buka"${sisa === 0 ? " disabled" : ""}>${ikon("kalender-bintang", 18)}<span>${esc(t(sisa === 0 ? "ev.rsvp.penuh" : "ev.rsvp.daftar"))}</span></button>${kuota}${batas}${luar}</div>`;
}
function dialog() {
  let d = document.getElementById("evDlg");
  if (d) return d;
  d = document.createElement("dialog");
  d.id = "evDlg"; d.className = "jm-dlg ev-dlg"; d.setAttribute("aria-labelledby", "evDlgJ");
  document.body.append(d);
  d.addEventListener("click", (e) => { if (e.target === d || e.target.closest("[data-tutup]")) d.close(); });
  d.addEventListener("submit", kirim);
  return d;
}
function formHtml() {
  const mine = sayaDaftar(), terakhir = [...(API.saya || [])].filter((x) => x.instansi || x.telepon).sort((a, c) => c.waktu - a.waktu)[0] || {};
  const sisa = sisaKuota(), maks = Math.min(20, sisa ?? 20) || 1;
  const f = (id, k, isi, kls = "") => `<div class="jm-medan ${kls}"><label for="${id}">${esc(t(k))}</label>${isi}</div>`;
  return `<form class="ev-form" novalidate><header class="ev-dlg-kep"><h2 id="evDlgJ">${esc(t(mine && mine.status === "terdaftar" ? "ev.rsvp.ubah_j" : "ev.rsvp.j"))}</h2><button type="button" class="ev-bulat" data-tutup aria-label="${esc(t("jm.tutup"))}">${ikon("tutup", 18)}</button></header>
    <p class="jm-bantu">${esc(B.judulTampil)} - ${esc(tglRentang(B))}</p>
    ${f("rNama", "ev.f.nama", `<input class="jm-isian" id="rNama" value="${esc(API.akun.nama)}" readonly>`)}${f("rSurel", "ev.f.surel", `<input class="jm-isian" id="rSurel" value="${esc(API.akun.surel)}" readonly>`)}
    ${f("rInstansi", "ev.f.instansi", `<input class="jm-isian" id="rInstansi" name="instansi" maxlength="120" autocomplete="organization" value="${esc((mine || terakhir).instansi || "")}">`)}
    ${f("rTelepon", "ev.f.telepon", `<input class="jm-isian" id="rTelepon" name="telepon" type="tel" maxlength="20" autocomplete="tel" inputmode="tel" value="${esc((mine || terakhir).telepon || "")}">`)}
    ${f("rJumlah", "ev.f.jumlah", `<input class="jm-isian" id="rJumlah" name="jumlah" type="number" min="1" max="${maks}" value="${mine ? mine.jumlah : 1}" required>`)}
    ${f("rCatatan", "ev.f.catatan", `<textarea class="jm-isian" id="rCatatan" name="catatan" rows="3" maxlength="500">${esc(mine?.catatan || "")}</textarea>`)}
    <p class="ev-dlg-galat" id="rGalat" role="alert" hidden></p>
    <div class="ev-dlg-aksi"><button type="button" class="jm-tbl" data-tutup>${esc(t("jm.batal"))}</button><button type="submit" class="jm-tbl jm-tbl-utama" id="rKirim">${esc(t("ev.rsvp.kirim"))}</button></div></form>`;
}
async function muatApi() { try { API = await api("/api/event"); } catch { API = null; } }
async function bukaForm() {
  if (!API) await muatApi();
  if (!API) { const d = dialog(); d.innerHTML = galatHtml("layanan"); d.showModal(); return; }
  const d = dialog(); d.innerHTML = formHtml(); d.showModal(); d.querySelector("#rInstansi")?.focus();
}
async function kirim(e) {
  e.preventDefault();
  const f = e.target, g = f.querySelector("#rGalat"), tbl = f.querySelector("#rKirim");
  const jumlah = Number(f.jumlah.value);
  g.hidden = true;
  if (!Number.isInteger(jumlah) || jumlah < 1 || jumlah > Number(f.jumlah.max)) { g.textContent = t("galat.masukan_salah"); g.hidden = false; return; }
  tbl.disabled = true;
  try {
    await api(`/api/event/${encodeURIComponent(slug)}/daftar`, { metode: "POST", badan: { jumlah, instansi: f.instansi.value, telepon: f.telepon.value, catatan: f.catatan.value } });
    await muatApi(); document.getElementById("evDlg").close(); segarkanPanel();
  } catch (err) { g.textContent = galatTeks(err.kode || "umum"); g.hidden = false; tbl.disabled = false; if (err.kode === "kuota_penuh" || err.kode === "pendaftaran_tutup") { await muatApi(); segarkanPanel(); } }
}
async function batal() {
  const d = dialog();
  d.innerHTML = `<form class="ev-form" method="dialog"><header class="ev-dlg-kep"><h2 id="evDlgJ">${esc(t("ev.rsvp.batal_j"))}</h2></header><p>${esc(t("ev.rsvp.batal_tanya"))}</p><p class="ev-dlg-galat" id="rGalat" role="alert" hidden></p>
    <div class="ev-dlg-aksi"><button type="button" class="jm-tbl" data-tutup>${esc(t("ev.rsvp.tidak"))}</button><button type="button" class="jm-tbl jm-tbl-bahaya" id="rYa">${esc(t("ev.rsvp.ya_batal"))}</button></div></form>`;
  d.showModal();
  d.querySelector("#rYa").addEventListener("click", async () => {
    try { await api(`/api/event/${encodeURIComponent(slug)}/daftar`, { metode: "DELETE" }); await muatApi(); d.close(); segarkanPanel(); }
    catch (err) { const g = d.querySelector("#rGalat"); g.textContent = galatTeks(err.kode || "umum"); g.hidden = false; }
  });
}
function segarkanPanel() { const r = document.querySelector(".ev-rsvp"); if (r) r.outerHTML = rsvpHtml() || '<div class="ev-rsvp"></div>'; const k = document.getElementById("evKontak"); if (k) k.innerHTML = kontakIsi(); }

/* ---------- panel samping ---------- */
function kontakIsi() {
  const a = aturAcara(), k = (a && a.kontak) || { nama: t("ev.cp.sekretariat"), surel: "meti.ires@gmail.com" };
  const wa = k.wa ? k.wa.replace(/[^0-9]/g, "").replace(/^0/, "62") : "";
  const peran = k.peran ? `<small>${esc(k.peran)}</small>` : "";
  const surel = k.surel ? `<a class="ev-bulat" href="mailto:${esc(k.surel)}" aria-label="${esc(k.surel)}" title="${esc(k.surel)}">${ikon("surel", 18)}</a>` : "";
  const lwa = wa ? `<a class="ev-bulat" href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(t("ev.bagi.wa"))}" title="${esc(t("ev.bagi.wa"))}">${ikon("whatsapp", 18)}</a>` : "";
  return `<p><b>${esc(k.nama)}</b>${peran}</p><div class="ev-cp-aksi">${surel}${lwa}</div>`;
}
function panelHtml() {
  const pen = B.daftarPen.map((n) => ({ n })), mit = B.daftarMitra.map((n) => ({ n }));
  const peta = B.lokasi && B.lokasi.lat != null ? `<div class="ev-peta" id="evPeta" role="img" aria-label="${esc(t("ev.peta"))}"></div><a class="ev-peta-tautan" href="https://www.google.com/maps/search/?api=1&query=${B.lokasi.lat},${B.lokasi.lon}" target="_blank" rel="noopener noreferrer">${esc(t("ev.peta_buka"))}</a>` : "";
  const tags = [...new Set([...topikDari(`${B.judul} ${B.deskripsi || ""}`)])].slice(0, 5).map((k) => tagHtml(k)).join("") + (B.keterbukaan ? `<span class="ev-tag">${ikon("kunci", 14)}${esc(t("ev.terbuka." + B.keterbukaan))}</span>` : "") + (B.seri ? `<span class="ev-tag">${ikon("linimasa", 14)}${esc(t("ev.seri." + B.seri))}</span>` : "");
  const sos = [B.instagram && B.instagram[0] && ["instagram", B.instagram[0]], B.youtube && ["youtube", B.youtube], B.situs && ["tautan", B.situs]].filter(Boolean).filter(([, u]) => urlAman(u));
  return `<aside class="ev-sisi" aria-label="${esc(t("ev.panel"))}">
    ${mundurHtml()}
    <ul class="ev-info">${baris("tahun", "ev.tanggal", `<b>${esc(t("kal.hari." + hariKe(B.tanggal)))}, ${esc(tglRentang(B))}</b>`)}${baris("jejak", "ev.waktu", `<b>${esc(jamTeks(B) || t("ev.waktu_menyusul"))}</b>`)}${baris("lokasi", "ev.lokasi", lokasiTeks(B) ? `<b>${esc(lokasiTeks(B))}</b>` : `<b>${esc(t("ev.waktu_menyusul"))}</b>`)}${baris(IKON_JENIS[B.jenis] || "jenis", "ev.kategori", pilJenis(B.jenis))}</ul>
    ${peta}
    <div class="ev-blok"><h3>${esc(t("ev.penyelenggara"))}</h3><ul class="ev-mitras" id="evPen">${pen.map((x) => mitraHtml(x.n, "")).join("") || `<li class="ev-mitra">-</li>`}</ul>${mit.length ? `<h3>${esc(t("ev.mitra"))}</h3><ul class="ev-mitras" id="evMit">${mit.map((x) => mitraHtml(x.n, "")).join("")}</ul>` : ""}</div>
    <div class="ev-rsvp"></div>
    <div class="ev-blok ev-kal"><a class="jm-tbl jm-tbl-kecil" href="${esc(gcalUrl(B))}" target="_blank" rel="noopener noreferrer">${ikon("kalender", 16)}<span>${esc(t("kal.pop.gcal"))}</span></a><button type="button" class="jm-tbl jm-tbl-kecil" data-ics>${ikon("unduh", 16)}<span>${esc(t("kal.pop.ics"))}</span></button></div>
    <div class="ev-blok"><h3>${esc(t("ev.bagikan"))}</h3>${bagikanHtml(urlMutlak(B), B.judulTampil)}<div class="ev-qr" id="evQr" aria-live="polite"></div><small>${esc(t("ev.qr_bantu"))}</small></div>
    ${tags ? `<div class="ev-blok"><h3>${esc(t("ev.tag"))}</h3><div class="ev-tags">${tags}</div></div>` : ""}
    <div class="ev-blok"><h3>${ikon("orang", 16)}<span>${esc(t("ev.cp"))}</span></h3><div id="evKontak">${kontakIsi()}</div></div>
    ${sos.length ? `<div class="ev-blok ev-sos">${sos.map(([ik, u]) => `<a class="ev-bulat" href="${esc(u)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(t("ev.sos." + ik))}" title="${esc(t("ev.sos." + ik))}">${svgSosmed(ik === "tautan" ? "web" : ik, 18)}</a>`).join("")}</div>` : ""}</aside>`;
}

/* ---------- isi utama ---------- */
async function isiUtama() {
  const bagian = [];
  if (B.deskripsi || B.tema) bagian.push(exHtml({ id: "ev-latar", ikon: "info", topik: t("ev.latar.ey"), judulHtml: esc(t("ev.latar.j")), isiHtml: `${B.deskripsi ? `<p class="ev-isi">${esc(B.deskripsi)}</p>` : ""}${B.tema ? `<blockquote class="ev-tema"><small>${esc(t("ev.tema"))}</small>${esc(B.tema)}</blockquote>` : ""}${B.tanggal_catatan ? `<p class="jm-bantu">${ikon("info", 14)} ${esc(B.tanggal_catatan)}</p>` : ""}`,
    aksiHtml: sumberHtml((B.sumber || []).map((s) => (urlAman(s.url) ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(label("kal.sumber.", s.label))}</a>` : esc(label("kal.sumber.", s.label)))).join(", ")) }));
  else bagian.push(exHtml({ id: "ev-latar", ikon: "info", topik: t("ev.latar.ey"), judulHtml: esc(t("ev.latar.j")), isiHtml: kosongHtml("ev.latar.kosong") }));
  const [vk, gal, ber] = await Promise.all([muat("video_kanal").catch(() => null), muat("galeri").catch(() => null), muat("berita").catch(() => null)]);
  const vids = (B.video_ids || []).map((id) => vk?.baris.find((v) => v.id === id)).filter(Boolean);
  if (vids.length) bagian.push(exHtml({ id: "ev-video", ikon: "video", topik: t("ev.video.ey"), judulHtml: esc(t("ev.video.j")), subHtml: esc(t("ev.video.sub")),
    isiHtml: `<div class="ev-video" id="evVideo">${pemutarHtml(vids[0])}<ul class="ev-video-daftar">${vids.map((v) => `<li><a href="/video/${esc(v.id)}"><img src="${esc(thumbUrl(v.id))}" alt="" loading="lazy" decoding="async" width="160" height="90"><span>${esc(v.judul)}${v.durasi_detik ? `<small>${esc(durasiTeks(v.durasi_detik))}</small>` : ""}</span></a></li>`).join("")}</ul></div>` }));
  const fotos = (gal?.baris || []).filter((f) => f.event === slug && (!B.poster || f.file !== B.poster.file));
  if (fotos.length) bagian.push(exHtml({ id: "ev-foto", ikon: "gambar", topik: t("ev.foto.ey"), judulHtml: esc(t("ev.foto.j")),
    isiHtml: `<ul class="ev-foto">${fotos.map((f) => `<li><a href="/galeri?acara=${esc(slug)}#foto-${esc(f.id)}"><img src="${esc(f.file)}" alt="${esc(f.judul)}" loading="lazy" decoding="async"></a></li>`).join("")}</ul><p class="jm-bantu">${esc(t("ev.foto.hak", { hak: fotos[0].hak }))}</p>` }));
  const kunci = (B.kata_kunci || []).map((k) => k.toLowerCase());
  const terkait = kunci.length ? (ber?.baris || []).filter((n) => kunci.some((k) => n.judul.toLowerCase().includes(k))).sort((a, c) => c.terbit.localeCompare(a.terbit)).slice(0, 6) : [];
  const luar = (B.berita || []).filter((n) => urlAman(n.url));
  if (terkait.length || luar.length) bagian.push(exHtml({ id: "ev-berita", ikon: "berita", topik: t("ev.berita.ey"), judulHtml: esc(t("ev.berita.j")),
    isiHtml: `<ul class="ev-berita">${[...luar.map((n) => `<li><a href="${esc(n.url)}" target="_blank" rel="noopener noreferrer"><span>${esc(t("ev.berita.liputan", { media: n.label }))}</span>${ikon("tautan", 14)}</a></li>`), ...terkait.map((n) => `<li><a href="${esc(n.url)}" target="_blank" rel="noopener noreferrer"><span>${esc(n.judul)}</span><small>${esc(n.media)} - ${esc(tanggal(n.terbit.slice(0, 10)))}</small></a></li>`)].join("")}</ul>` }));
  if (B.sponsor) {
    const sp = await import("/event.js").then((m) => m.sponsorAcara(slug)).catch(() => "");
    if (sp) bagian.splice(1, 0, exHtml({ id: "sponsor", ikon: "bintang", topik: t("ev.sponsor.ey"), judulHtml: esc(t("ev.sponsor.j")), isiHtml: sp }));
  }
  return bagian.join("");
}

async function muatPeta() {
  const el = document.getElementById("evPeta");
  if (!el) return;
  try {
    const [{ muatMapLibre }, { rapikanPeta }] = await Promise.all([import("/inti/maplibre.js"), import("/inti/peta_indonesia.js")]);
    await muatMapLibre();
    const gelap = (document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
    const c = [B.lokasi.lon, B.lokasi.lat];
    const peta = new maplibregl.Map({ container: el, style: "https://tiles.openfreemap.org/styles/" + (gelap ? "dark" : "positron"), center: c, zoom: 12, interactive: false, attributionControl: { compact: true } });
    peta.on("style.load", () => { try { rapikanPeta(peta); } catch { /* gaya lain: biarkan */ } });
    new maplibregl.Marker().setLngLat(c).addTo(peta);
    peta.on("load", () => peta.resize());
    requestAnimationFrame(() => peta.resize());
  } catch { el.classList.add("ev-peta-gagal"); }
}

async function gambar() {
  const isi = document.getElementById("isi");
  document.getElementById("judul").textContent = B.judulTampil;
  document.title = `${B.judulTampil} | Event METI`;
  document.getElementById("lead").textContent = [tglRentang(B), lokasiTeks(B)].filter(Boolean).join(" - ");
  const mitra = [].concat(B.penyelenggara || B.mitra || []).join(", ");
  khSisi(".jm-kh", B.poster
    ? { gambar: { src: B.poster.file, alt: B.judulTampil, judul: label("kal.jenis.", B.jenis), poster: true } }
    : { fakta: [{ ikon: "kalender", label: t("kh.tgl"), nilai: tglRentang(B) }, { ikon: "lokasi", label: t("kh.lokasi"), nilai: lokasiTeks(B) }, { ikon: "jenis", label: t("kh.jenis"), nilai: label("kal.jenis.", B.jenis) }, { ikon: "orang", label: t("kh.mitra"), nilai: mitra }] });
  isi.innerHTML = `<div class="ev-detail-kisi"><div class="ev-utama"><figure class="ev-besar">${posterHtml(B, "ev-poster-besar")}${B.poster ? `<figcaption class="jm-bantu">${esc(t("ev.poster.hak", { hak: B.poster.hak }))}${urlAman(B.poster.url_sumber) ? ` <a href="${esc(B.poster.url_sumber)}" target="_blank" rel="noopener noreferrer">${esc(t("ev.poster.sumber"))}</a>` : ""}</figcaption>` : ""}</figure><div id="evBagian">${hantuHtml(3)}</div></div>${panelHtml()}</div>`;
  document.querySelector(".ev-rsvp").outerHTML = rsvpHtml() || '<div class="ev-rsvp"></div>';
  tik(); clearInterval(WAKTU); WAKTU = setInterval(tik, 1000);
  qrSvg(urlMutlak(B)).then((s) => { const q = document.getElementById("evQr"); if (q) q.innerHTML = s; }, () => {});
  for (const [id, daftar] of [["evPen", B.daftarPen], ["evMit", B.daftarMitra]]) {
    const ul = document.getElementById(id);
    if (ul) Promise.all(daftar.map(async (n) => mitraHtml(n, await logoMitra(n)))).then((h) => { if (ul.isConnected && h.length) ul.innerHTML = h.join(""); });
  }
  nanti(muatPeta);
  document.getElementById("evBagian").innerHTML = (await isiUtama()) + (await terkaitHtml("event", slug));
}

async function main() {
  const saya = await mulaiHalaman();
  const isi = document.getElementById("isi");
  isi.innerHTML = hantuHtml(6);
  pasangSalin(); pasangPemutar();
  let semua;
  try { semua = await muatAcara(); } catch { isi.innerHTML = galatHtml("layanan"); return; }
  B = semua.find((b) => b.slug === slug);
  if (!B) { document.getElementById("judul").textContent = t("ev.tidak_ada"); isi.innerHTML = kosongHtml("ev.tidak_ada_isi", { kunci: "ev.semua", data: "semua" }); return; }
  if (!saya || saya.masuk !== false) await muatApi();
  await gambar();
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-rsvp],[data-ics],[data-aksi=semua]");
    if (!b) return;
    if (b.dataset.rsvp === "buka") bukaForm(); else if (b.dataset.rsvp === "batal") batal(); else if ("ics" in b.dataset) unduhIcs(B); else location.href = "/event";
  });
  document.addEventListener("jm:bahasa", () => B && gambar());
}
main();
