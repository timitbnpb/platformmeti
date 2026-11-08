/* /o/<id>: bagian-bagian isi profil organisasi (proyek, berita, pengurus, bagan relasi, navigasi). Dipakai o.js.
   Semua teks lewat t(); angka lewat angka(); tanpa gaya inline (CSP). Grafik SVG memakai tooltip bersama tip_grafik.js. */
import { t, angka, tanggal, ada } from "/i18n.js";
import { esc, ikon, nanti, fotoBerita } from "/inti/umum.js";
import { exHtml, sumberHtml } from "/inti/komponen.js";
import { aksiHtml } from "/inti/aksi_ex.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { pilTek, pilStatus } from "/inti/ikon_tek.js";
import { logoOrg } from "/inti/logo_org.js";
import { namaMedia, logoLokal } from "/inti/nama_media.js";
import { namaGelar } from "/inti/nama_baku.js";
import { hlHtml, lambang } from "/profil.js";
import "/inti/tip_grafik.js";

const inisial = (n) => String(n || "?").replace(/^(PT|CV|Yayasan|Pemerintah|Kementerian)\.?\s+/i, "").split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();
const tglKey = (s) => String(s || "").slice(0, 10);
const kecilHp = () => innerWidth < 640;

/* ---------- logo organisasi (gambar bila ada, inisial bila tidak) ---------- */
export const logoOrgHtml = (id, nama, l, k = "oj-lg") => { const u = logoOrg(id, nama, l)[0]; return `<span class="${k}">${u ? `<img src="${esc(u)}" alt="" loading="lazy" decoding="async" data-ini="${esc(inisial(nama))}">` : esc(inisial(nama))}</span>`; };

/* ---------- penomoran halaman di sisi layar: chrome nomor sinkron, isi ditunda sesudah satu bingkai ---------- */
function halamanan(el, daftar, per, render, satuan) {
  let hal = 1, isi = daftar;
  const gambar = () => { el.querySelector("[data-isi]").innerHTML = render(isi.slice((hal - 1) * per, hal * per)); el.querySelector("[data-nav]").innerHTML = paginasiHtml({ hal, total: isi.length, per, satuan }); };
  el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-nav] [data-hal]"); if (!b || b.disabled) return;
    hal = +b.dataset.hal; sorotHalaman(b, hal); nanti(gambar);
  });
  gambar();
  return { ganti(baru) { isi = baru; hal = 1; gambar(); } };
}
const wadahHalaman = (id) => `<div class="oj-hal" id="${id}"><div data-isi></div><div class="oj-pag" data-nav></div></div>`;

/* ---------- nama proyek: rapikan kapital dan kata ganda ("BESS BESS Smoothing", "PS Matenggeng PS") ---------- */
const SINGKAT = /^(bess|ps|pltu|plta|plts|pltp|pltb|pltbm|pltsa|pltmh|pltd|ipp|psn|cod|ebt)$/i;
export function rapiNama(n) {
  const kata = String(n || "").replace(/\s*\((?:cod\s*)?\d{4}\)/gi, "").replace(/\s+/g, " ").trim().split(" "), lihat = new Set();
  return kata.filter((w) => { const k = w.toLowerCase().replace(/[^a-z0-9]/g, ""); if (!k || !/[a-z]/.test(k)) return true; if (lihat.has(k)) return false; lihat.add(k); return true; })
    .map((w) => (SINGKAT.test(w) ? w.toUpperCase() : w)).join(" ");
}
const URUT_ST = ["dibatalkan", "tidak-diketahui", "rencana", "izin", "pendanaan", "konstruksi", "beroperasi"];
/* Gabung catatan bernama sama + teknologi sama untuk tampilan (data asli tidak diubah); simpan yang statusnya paling maju. */
export function gabungProyek(rows) {
  const peta = new Map();
  for (const r of rows) {
    const k = rapiNama(r.nama).toLowerCase() + "|" + r.tek, a = peta.get(k);
    if (!a) { peta.set(k, { ...r, nama: rapiNama(r.nama), ganda: [r.id] }); continue; }
    a.ganda.push(r.id);
    const lebih = URUT_ST.indexOf(r.st) > URUT_ST.indexOf(a.st) || (URUT_ST.indexOf(r.st) === URUT_ST.indexOf(a.st) && (r.kap ?? -1) > (a.kap ?? -1));
    if (lebih) Object.assign(a, { ...r, nama: a.nama, ganda: a.ganda });
  }
  return [...peta.values()];
}

/* ---------- grafik batang horizontal berwarna (kelas teknologi/status), tooltip kaya ---------- */
function batangSvg(baris, { label, satuan, pakaiMw }) {
  const total = baris.reduce((s, r) => s + r.v, 0), hp = kecilHp(), W = hp ? 300 : 540, L = hp ? 84 : 132, R = hp ? 46 : 70, rh = hp ? 30 : 28, H = baris.length * rh + 6, mx = Math.max(1, ...baris.map((r) => r.v));
  const g = baris.map((r, i) => {
    const y = 3 + i * rh, w = Math.max(3, (r.v / mx) * (W - L - R)), p = total ? Math.round((r.v / total) * 100) : 0;
    const tip = r.tip || (pakaiMw ? t("oj2.g.tip", { nama: r.nama, v: angka(Math.round(r.v)), n: angka(r.n), p: angka(p) }) : t("oj2.g.tip_n", { nama: r.nama, n: angka(r.n), p: angka(p) }));
    return `<text class="jm-gf-t1" x="${L - 8}" y="${y + 17}" text-anchor="end" font-size="${hp ? 11 : 12}">${esc(r.nama.length > (hp ? 12 : 18) ? r.nama.slice(0, hp ? 11 : 17) + "…" : r.nama)}</text>`
      + `<rect class="oj-fill ${esc(r.kelas)}" x="${L}" y="${y + 3}" width="${w.toFixed(1)}" height="${rh - 8}" rx="4" tabindex="0" data-tip="${esc(tip)}"/>`
      + `<text class="jm-gf-t1 jm-gf-tb" x="${(L + w + 6).toFixed(1)}" y="${y + 17}" font-size="12">${esc(angka(Math.round(r.v)))}${pakaiMw ? "" : ""}</text>`;
  }).join("");
  return `<svg class="jm-gf" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}" focusable="false">${g}</svg>`;
}
function grafikProyek(rows) {
  const pakaiMw = rows.some((r) => r.kap && /^MWp?$/i.test(r.sat));
  const agr = (kunci, nama, kls) => {
    const m = new Map();
    for (const r of rows) { const k = r[kunci] || "lain"; const a = m.get(k) || { v: 0, n: 0 }; a.n++; a.v += pakaiMw ? (r.kap && /^MWp?$/i.test(r.sat) ? r.kap : 0) : 1; m.set(k, a); }
    return [...m].map(([k, a]) => ({ k, nama: nama(k), v: a.v, n: a.n, kelas: kls(k) })).filter((x) => x.v > 0).sort((a, b) => b.v - a.v);
  };
  const tek = agr("tek", (k) => (ada("pj.tek.s." + k) ? t("pj.tek.s." + k) : ada("pj.tek." + k) ? t("pj.tek." + k) : t("oj2.tek.lain")), (k) => "jm-tek-" + k);
  const st = agr("st", (k) => t("pj.st." + k), (k) => "jm-st-" + k);
  const fig = (judulKunci, baris) => (baris.length ? `<figure class="oj-fig"><figcaption>${esc(t(judulKunci))}</figcaption>${batangSvg(baris, { label: t(judulKunci), pakaiMw })}</figure>` : "");
  const h = fig(pakaiMw ? "oj2.g.tek" : "oj2.g.tek_n", tek) + fig(pakaiMw ? "oj2.g.st" : "oj2.g.st_n", st);
  return h ? `<div class="oj-gfdua">${h}</div>` : "";
}

/* ---------- bagian proyek ---------- */
const kapTeks = (r) => (r.kap === null ? "-" : `${angka(r.kap)} ${r.sat}`);
function barisTabelProyek(r) {
  const lb = r.prov ? lambang(r.prov, 20) : "";
  return `<tr><td data-label="${esc(t("pj.c.nama"))}"><b><a class="pf-nm" href="/p/${esc(r.id)}">${esc(r.nama)}</a></b>${r.ganda.length > 1 ? ` <span class="oj-pil oj-pil-ganda" tabindex="0" title="${esc(t("oj2.dup.tip"))}">${esc(t("oj2.dup", { n: angka(r.ganda.length) }))}</span>` : ""}</td>`
    + `<td data-label="${esc(t("pj.c.tek"))}">${pilTek(r.tek)}</td><td data-label="${esc(t("pj.c.kap"))}" class="jm-num">${esc(kapTeks(r))}</td>`
    + `<td data-label="${esc(t("pj.c.prov"))}">${r.prov ? `<span class="pf-prov">${lb}<span>${esc(r.prov)}</span></span>` : "-"}</td><td data-label="${esc(t("pj.c.status"))}">${pilStatus(r.st)}</td><td data-label="${esc(t("pj.c.cod"))}" class="jm-tengah">${r.cod ?? "-"}</td></tr>`;
}

export function bagProyek({ rows, semua, nProv, sumber }) {
  if (!rows.length) return { html: "", pasang() {} };
  const gand = semua - rows.length, ada = rows.filter((r) => r.ada);
  const tepat = ada.filter((r) => r.presisi === "titik_persis").length, tek = [...new Set(ada.map((r) => r.tek))].filter(Boolean);
  const legenda = `<div class="oj-legenda" role="note"><b>${esc(t("oj2.leg"))}</b><span class="oj-leg-i"><i class="oj-leg-t oj-leg-pasti"></i>${esc(t("oj2.leg.tepat", { n: angka(tepat) }))}</span><span class="oj-leg-i"><i class="oj-leg-t"></i>${esc(t("oj2.leg.kira", { n: angka(ada.length - tepat) }))}</span>${rows.length - ada.length ? `<span class="oj-leg-i">${ikon("info", 14)}${esc(t("oj2.leg.tanpa", { n: angka(rows.length - ada.length) }))}</span>` : ""}<span class="oj-leg-tek">${tek.map((k) => pilTek(k)).join("")}</span></div>`;
  const peta = ada.length ? `<div class="oj-petabox"><div class="pf-peta" id="pfPeta" role="img" aria-label="${esc(t("pf.peta"))}"></div>${legenda}</div>` : "";
  const kol = [["pj.c.nama"], ["pj.c.tek"], ["pj.c.kap", "jm-num"], ["pj.c.prov"], ["pj.c.status"], ["pj.c.cod", "jm-tengah"]];
  const tabel = `<div class="jm-gulir"><table class="jm-tabel jm-tabel-tetap pf-tabel-proyek oj-tbl-proyek" data-urut="tidak"><thead><tr>${kol.map(([k, c]) => `<th scope="col"${c ? ` class="${c}"` : ""}>${esc(t(k))}</th>`).join("")}</tr></thead><tbody data-isi></tbody></table></div><div class="oj-pag" data-nav></div>`;
  const html = exHtml({
    id: "proyek", ikon: "proyek", topik: t("pf.ey.proyek"),
    judulHtml: hlHtml("pf.j.proyek", angka(rows.length), { n: angka(nProv) }),
    subHtml: gand > 0 ? esc(t("oj2.sub.ganda", { n: angka(gand) })) : "",
    aksiHtml: aksiHtml({ csv: true }) + sumberHtml(sumber),
    isiHtml: `<div class="oj-bag-isi">${grafikProyek(rows)}${peta}<div class="oj-hal" id="ojProyekHal">${tabel}</div></div>`,
  });
  return {
    html,
    pasang(akar) {
      const hal = akar.querySelector("#ojProyekHal"); if (!hal) return;
      halamanan(hal, rows, kecilHp() ? 5 : 10, (isi) => isi.map(barisTabelProyek).join(""), "jm.pag.u.proyek");
      akar.querySelector("#proyek")?.addEventListener("jm:csv", (e) => { e.detail.baris = [kol.map(([k]) => t(k)), ...rows.map((r) => [r.nama, r.tek, r.kap ?? "", r.sat, r.prov, r.st, r.cod ?? ""])]; });
      akar.addEventListener("error", (e) => { if (e.target.matches?.("img.pf-lb")) e.target.remove(); }, true);
    },
  };
}

/* ---------- berita: daftar ringkas berpaginasi + grafik jumlah per minggu ---------- */
const hari = (d) => d.toISOString().slice(0, 10);
const senin = (s) => { const d = new Date(tglKey(s) + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d; };
const rentang = (d) => { const e = new Date(d); e.setUTCDate(e.getUTCDate() + 6); return `${tanggal(hari(d))} - ${tanggal(hari(e))}`; };

function grafikMinggu(daftar) {
  const per = new Map();
  for (const b of daftar) { if (!b.terbit) continue; const k = hari(senin(b.terbit)); const a = per.get(k) || { n: 0, media: new Map() }; a.n++; const m = namaMedia(b.media); a.media.set(m, (a.media.get(m) || 0) + 1); per.set(k, a); }
  if (!per.size) return { html: "", minggu: [] };
  const awal = new Date([...per.keys()].sort()[0] + "T00:00:00Z"), akhir = new Date([...per.keys()].sort().at(-1) + "T00:00:00Z"), minggu = [];
  for (let d = new Date(akhir); d >= awal && minggu.length < 40; d.setUTCDate(d.getUTCDate() - 7)) minggu.unshift(hari(d));
  const hp = kecilHp(), W = hp ? 300 : 1100, H = hp ? 180 : 200, L = 28, B = H - 30, T = 22, mx = Math.max(1, ...minggu.map((k) => per.get(k)?.n || 0)), gap = (W - L - 6) / minggu.length, bw = Math.max(2, gap * 0.7);
  const Y = (v) => B - (v / mx) * (B - T), langkah = Math.max(1, Math.ceil(minggu.length / (hp ? 5 : 8)));
  let g = [0, 0.5, 1].map((f) => `<line class="jm-gf-grid" x1="${L}" x2="${W - 6}" y1="${Y(mx * f).toFixed(1)}" y2="${Y(mx * f).toFixed(1)}"/><text class="jm-gf-t2" x="${L - 5}" y="${(Y(mx * f) + 4).toFixed(1)}" text-anchor="end" font-size="${hp ? 11 : 13}">${esc(angka(Math.round(mx * f)))}</text>`).join("");
  minggu.forEach((k, i) => {
    const a = per.get(k), v = a?.n || 0, x = L + i * gap + (gap - bw) / 2, top = [...(a?.media || [])].sort((p, q) => q[1] - p[1]).slice(0, 3).map(([m, c]) => `${m} ${angka(c)}`).join(", ");
    g += `<rect class="oj-kolom${v ? "" : " oj-kolom-nol"}" data-minggu="${k}" x="${x.toFixed(1)}" y="${Y(v).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(3, B - Y(v)).toFixed(1)}" rx="2" tabindex="0" data-tip="${esc(t("oj2.g.minggu_tip", { r: rentang(new Date(k + "T00:00:00Z")), n: angka(v), top: top || "-" }))}"/>`;
    if (i % langkah === 0 || i === minggu.length - 1) g += `<text class="jm-gf-t2" x="${(x + bw / 2).toFixed(1)}" y="${B + 16}" text-anchor="middle" font-size="${hp ? 11 : 13}">${esc(tanggal(k).replace(/\s\d{4}$/, ""))}</text>`;
  });
  return { minggu, html: `<figure class="oj-fig oj-fig-lebar"><figcaption>${esc(t("oj2.g.minggu"))}</figcaption><svg class="jm-gf" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("oj2.g.minggu"))}" focusable="false">${g}</svg><p class="oj-saring" id="ojSaring" hidden><span></span><button type="button" class="oj-tb" data-saring-hapus>${esc(t("oj2.filter.hapus"))}</button></p></figure>` };
}

export function bagBerita({ daftar, foto, sumber }) {
  if (!daftar.length) return { html: "", pasang() {} };
  const urut = [...daftar].sort((a, b) => String(b.terbit).localeCompare(String(a.terbit))), gm = grafikMinggu(urut), terlihat = new Set();
  const kartu = (b) => {
    const f = fotoBerita(foto, b.id), pakai = f && !terlihat.has(foto[b.id]) ? (terlihat.add(foto[b.id]), f) : "", lg = logoLokal(b.media);
    const th = pakai ? `<span class="oj-bt-f"><img src="${esc(pakai)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-foto></span>` : `<span class="oj-bt-f oj-bt-ik">${ikon("berita", 22)}</span>`;
    const md = `<span class="oj-lg oj-lg-k">${lg ? `<img src="${esc(lg)}" alt="" loading="lazy" decoding="async" data-ini="${esc(inisial(namaMedia(b.media)))}">` : esc(inisial(namaMedia(b.media)))}</span>`;
    const isi = `${th}<span class="oj-bt-t"><b>${esc(b.judul)}</b><span class="oj-bt-m">${md}<span>${esc(namaMedia(b.media))}</span><time datetime="${esc(tglKey(b.terbit))}">${esc(tanggal(tglKey(b.terbit)))}</time></span></span>`;
    return `<li>${/^https?:\/\//.test(b.url || "") ? `<a href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">${isi}</a>` : `<div>${isi}</div>`}</li>`;
  };
  // kartu dibangun sekali agar foto yang sama tidak diulang di halaman lain
  const dibangun = urut.map((b) => ({ b, minggu: b.terbit ? hari(senin(b.terbit)) : "", html: kartu(b) }));
  const html = exHtml({
    id: "berita", ikon: "berita", topik: t("pf.ey.berita"),
    judulHtml: hlHtml("pf.j.berita", angka(daftar.length)),
    aksiHtml: aksiHtml({ csv: false }) + sumberHtml(sumber),
    isiHtml: `<div class="oj-bag-isi oj-berita">${gm.html}<div class="oj-hal" id="ojBeritaHal"><div data-isi></div><div class="oj-pag" data-nav></div></div></div>`,
  });
  return {
    html,
    pasang(akar) {
      const hal = akar.querySelector("#ojBeritaHal"); if (!hal) return;
      const ctl = halamanan(hal, dibangun, 8, (h) => `<ul class="oj-bt">${h.map((x) => x.html).join("")}</ul>`, "jm.pag.u.berita");
      const sar = akar.querySelector("#ojSaring"); let aktif = "";
      akar.querySelector("#berita")?.addEventListener("click", (e) => {
        const k = e.target.closest("rect[data-minggu]"), hapus = e.target.closest("[data-saring-hapus]");
        if (!k && !hapus) return;
        const baru = hapus || k.dataset.minggu === aktif ? "" : k.dataset.minggu;
        aktif = baru;
        akar.querySelectorAll("rect[data-minggu]").forEach((r) => r.classList.toggle("oj-kolom-aktif", r.dataset.minggu === baru));
        if (sar) { sar.hidden = !baru; if (baru) sar.firstElementChild.textContent = t("oj2.filter.minggu", { r: rentang(new Date(baru + "T00:00:00Z")) }); }
        nanti(() => ctl.ganti(baru ? dibangun.filter((x) => x.minggu === baru) : dibangun));
      });
      akar.addEventListener("error", (e) => { const im = e.target; if (im.matches?.("img[data-foto]")) im.closest(".oj-bt-f").classList.add("oj-bt-ik"), im.replaceWith(Object.assign(document.createElement("span"), { innerHTML: ikon("berita", 22) })); }, true);
    },
  };
}

/* ---------- pengurus: tab Semua/Direksi/Komisaris, foto bila ada, nama bergelar baku, peran berwarna, paginasi ---------- */
const fotoAman = (u) => (typeof u === "string" && /^\/img\/(orang|pengurus)\/[\w.-]+\.webp$/.test(u) ? u : "");
const KEL = (p) => {
  const j = p.jabatan || "";
  if (/komisaris|commissioner|dewan pengawas|supervisory/i.test(j)) return "komisaris";
  if (/\b(direktur|director|direksi|ceo|cfo|coo|cto)\b/i.test(j) && !/jenderal|general/i.test(j)) return "direksi";
  return p.jenis === "komisaris" ? "komisaris" : p.jenis === "direksi" ? "direksi" : "pimpinan";
};
const KELAS_PERAN = (j) => (/utama|president|chief|\bceo\b/i.test(j) ? "oj-pr-utama" : /independen|independent/i.test(j) ? "oj-pr-indep" : /komisaris|commissioner|pengawas/i.test(j) ? "oj-pr-kom" : /direktur|director|direksi/i.test(j) ? "oj-pr-dir" : "oj-pr-lain");
const IKON_PERAN = (j) => (/utama|president|chief|\bceo\b/i.test(j) ? "mahkota" : /independen|independent/i.test(j) ? "perisai" : /komisaris|commissioner|pengawas/i.test(j) ? "lencana" : "orang");

export function bagPengurus({ daftar, sumber }) {
  if (!daftar.length) return { html: "", pasang() {} };
  const urut = ["direksi", "komisaris", "pimpinan"], isi = daftar.map((p, i) => ({ ...p, kel: KEL(p), i })).sort((a, b) => urut.indexOf(a.kel) - urut.indexOf(b.kel) || (/utama/i.test(b.jabatan || "") - /utama/i.test(a.jabatan || "")) || a.i - b.i);
  const hit = (k) => isi.filter((p) => p.kel === k).length;
  const kartu = (p) => {
    const f = fotoAman(p.foto), nama = namaGelar(p.nama, p.gelar), ini = inisial(p.nama.replace(/^((dr|ir|prof|drs|h|hj)\.?\s+)+/i, "")), j = p.jabatan || t("pf.kel." + p.kel);
    const wajah = `<span class="oj-or-f">${f ? `<img src="${esc(f)}" alt="" width="72" height="72" loading="lazy" decoding="async" data-ini="${esc(ini)}">` : esc(ini)}</span>`;
    const nm = /^https?:\/\//.test(p.sumber_url || "") ? `<a class="oj-or-n" href="${esc(p.sumber_url)}" target="_blank" rel="noopener noreferrer">${esc(nama)}</a>` : `<b class="oj-or-n">${esc(nama)}</b>`;
    return `<li class="oj-or">${wajah}<span class="oj-or-t">${nm}<span class="oj-peran ${KELAS_PERAN(j)}">${ikon(IKON_PERAN(j), 14)}<span>${esc(j)}</span></span></span></li>`;
  };
  const tabs = [["semua", isi.length], ["direksi", hit("direksi")], ["komisaris", hit("komisaris")], ["pimpinan", hit("pimpinan")]].filter(([k, n]) => n && (k === "semua" || n < isi.length));
  const tab = tabs.length > 2 ? `<div class="jm-tab oj-tab" role="tablist" aria-label="${esc(t("pf.ey.pengurus"))}">${tabs.map(([k, n], i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-kel="${k}">${esc(k === "semua" ? t("oj2.kel.semua") : t("pf.kel." + k))}<b>${esc(angka(n))}</b></button>`).join("")}</div>` : "";
  const html = exHtml({
    id: "pengurus", ikon: "orang", topik: t("pf.ey.pengurus"),
    judulHtml: hlHtml("pf.j.pengurus", angka(isi.length)),
    aksiHtml: sumberHtml(sumber),
    isiHtml: `<div class="oj-bag-isi">${tab}<div class="oj-hal" id="ojOrangHal"><div data-isi></div><div class="oj-pag" data-nav></div></div></div>`,
  });
  return {
    html,
    pasang(akar) {
      const hal = akar.querySelector("#ojOrangHal"); if (!hal) return;
      const ctl = halamanan(hal, isi, 8, (h) => `<ul class="oj-orang">${h.map(kartu).join("")}</ul>`, "jm.pag.u.pengurus");
      akar.querySelector("#pengurus .oj-tab")?.addEventListener("click", (e) => {
        const b = e.target.closest("[data-kel]"); if (!b) return;
        b.parentElement.querySelectorAll("[data-kel]").forEach((x) => { x.setAttribute("aria-selected", String(x === b)); });
        nanti(() => ctl.ganti(b.dataset.kel === "semua" ? isi : isi.filter((p) => p.kel === b.dataset.kel)));
      });
      akar.addEventListener("error", (e) => { const im = e.target; if (im.matches?.(".oj-or-f img")) im.replaceWith(document.createTextNode(im.dataset.ini || "")); }, true);
    },
  };
}

/* ---------- bagan organisasi: induk di atas, organisasi ini, anak usaha dan anggota di bawah ---------- */
export function bagRelasi({ o, rel, sumber, S }) {
  if (!rel.length) return { html: "", pasang() {} };
  const simpul = (r) => {
    const nm = r.x?.nama || r.teks, ik = logoOrgHtml(r.x?.id, nm, r.x?.logo, "oj-lg oj-lg-s"), kat = r.x?.kategori?.label || "";
    const isi = `${ik}<span class="oj-sp-t"><b>${esc(nm)}</b>${kat ? `<small>${esc(kat)}</small>` : ""}</span>`;
    return `<li>${r.x ? `<a class="oj-sp" href="/o/${esc(r.x.id)}">${isi}</a>` : `<span class="oj-sp">${isi}</span>`}</li>`;
  };
  const grup = (peran) => rel.filter((r) => r.peran === peran);
  const induk = grup("induk"), anak = grup("anak"), sudah = new Set([...induk, ...anak].map((r) => r.x?.id || r.teks)), anggota = grup("anggota").filter((r) => !sudah.has(r.x?.id || r.teks));
  const atas = induk.length ? `<div class="oj-bg-baris"><span class="oj-bg-ket oj-peran oj-pr-dir">${ikon("direktori", 14)}<span>${esc(t("pf.peran.induk"))}</span></span><ul class="oj-sp-daftar">${induk.map(simpul).join("")}</ul></div><span class="oj-bg-garis" aria-hidden="true"></span>` : "";
  const pusat = `<div class="oj-bg-pusat"><span class="oj-sp oj-sp-ini">${logoOrgHtml(o.id, o.nama, o.logo, "oj-lg oj-lg-s")}<span class="oj-sp-t"><b>${esc(o.nama)}</b><small>${esc(t("oj2.bagan.ini"))}</small></span></span></div>`;
  const bawah = (judulK, daftar, kls) => (daftar.length ? `<span class="oj-bg-garis" aria-hidden="true"></span><div class="oj-bg-baris"><span class="oj-bg-ket oj-peran ${kls}">${ikon("direktori", 14)}<span>${esc(t(judulK))} (${esc(angka(daftar.length))})</span></span><div class="oj-hal" data-daftar="${esc(kls)}"><div data-isi></div><div class="oj-pag" data-nav></div></div></div>` : "");
  const html = exHtml({
    id: "relasi", ikon: "direktori", topik: t("pf.ey.relasi"), judulHtml: esc(t("pf.j.relasi")),
    aksiHtml: sumberHtml(sumber),
    isiHtml: `<div class="oj-bag-isi oj-bagan">${atas}${pusat}${bawah("pf.peran.anak", anak, "oj-pr-utama")}${bawah("pf.peran.anggota", anggota, "oj-pr-indep")}</div>`,
  });
  return {
    html,
    pasang(akar) {
      const per = 12, peta = { "oj-pr-utama": anak, "oj-pr-indep": anggota };
      akar.querySelectorAll("#relasi .oj-hal[data-daftar]").forEach((h) => { halamanan(h, peta[h.dataset.daftar], per, (isi) => `<ul class="oj-sp-daftar">${isi.map(simpul).join("")}</ul>`, "jm.pag.u.data"); if (peta[h.dataset.daftar].length <= per) h.querySelector("[data-nav]").remove(); });
    },
  };
}

/* ---------- navigasi loncat: hanya bagian yang tampil, ikon berbeda per bagian ---------- */
export function navLoncat(akar) {
  const peta = [["proyek", "proyek", "pf.ey.proyek"], ["program", "analisis", "pf.ey.program"], ["regulasi", "regulasi", "pf.ey.regulasi"], ["berita", "berita", "pf.ey.berita"], ["pengurus", "orang", "pf.ey.pengurus"], ["relasi", "direktori", "pf.ey.relasi"], ["terkait", "tautan", "terkait.ey"]];
  const ada = peta.filter(([id]) => akar.querySelector("#" + id));
  if (ada.length < 2) return;
  akar.insertAdjacentHTML("beforeend", `<nav class="oj-loncat" aria-label="${esc(t("oj2.nav"))}">${ada.map(([id, ik, k]) => `<a href="#${id}" data-loncat="${id}">${ikon(ik, 18)}<span>${esc(t(k))}</span></a>`).join("")}</nav>`);
  const nav = akar.querySelector(".oj-loncat");
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { nav.querySelectorAll("a").forEach((a) => a.classList.toggle("on", a.dataset.loncat === e.target.id)); } }, { rootMargin: "-40% 0px -55% 0px" });
  ada.forEach(([id]) => io.observe(akar.querySelector("#" + id)));
}

/* Terkait tidak mengulang organisasi yang sudah tampil di bagan relasi: buang kartunya, perbarui hitungan, buang tab kosong */
export function saringTerkait(akar, idRel) {
  const grup = akar.querySelector("#trp-org"); if (!grup) return;
  let sisa = 0;
  grup.querySelectorAll(".jm-tk").forEach((k) => { const h = k.getAttribute("href") || k.querySelector("a")?.getAttribute("href") || ""; if (idRel.has(decodeURIComponent(h.split("/o/")[1] || ""))) k.remove(); else sisa++; });
  if (sisa) { const b = akar.querySelector("#trt-org b"); if (b) b.textContent = angka(sisa); grup.dataset.jmTotal = sisa; return; }
  const tab = akar.querySelector("#trt-org"), lain = [...akar.querySelectorAll("#terkait [role=tab]")].find((x) => x !== tab);
  grup.remove(); tab.remove();
  if (lain) lain.click(); else akar.querySelector("#terkait")?.remove();
}

/* ---------- Paten & riset: karya OpenAlex per topik/tahun/negara (riset_kampus.json) + paten tertaut (paten.json) ---------- */
export function bagRiset({ k, paten, sumber }) {
  const pt = (paten || []).slice(0, 10);
  if (!k && !pt.length) return { html: "", pasang() {} };
  const fig = (kunci, baris) => (baris.length ? `<figure class="oj-fig"><figcaption>${esc(t(kunci))}</figcaption>${batangSvg(baris, { label: t(kunci), pakaiMw: false })}</figure>` : "");
  let grafik = "";
  if (k) {
    const tot = Object.values(k.per_topik).reduce((s, v) => s + v, 0) || 1;
    const topik = Object.entries(k.per_topik).filter(([, v]) => v).sort((a, b) => b[1] - a[1]).map(([x, v]) => { const nama = t("rp.tema." + x); return { nama, v, n: v, kelas: "jm-tek-" + x.replace("_", "-"), tip: t("rp.tip.topik", { nama, n: angka(v), p: angka(Math.round((v / tot) * 100)) }) }; });
    const tren = Object.entries(k.tren_tahunan || {}).map(([y, v]) => ({ nama: y, v, n: v, kelas: "jm-tek-surya", tip: t("rp.tip.tren", { nama: y, n: angka(v) }) }));
    const neg = (k.kolaborator_negara || []).slice(0, 8).map((c) => { const nama = new Intl.DisplayNames([document.documentElement.lang || "id"], { type: "region" }).of(c.iso2) || c.iso2; return { nama, v: c.karya, n: c.karya, kelas: "jm-tek-hidro", tip: t("rp.tip.negara", { nama, n: angka(c.karya) }) }; });
    grafik = `<div class="oj-gfdua">${fig("rp.g.topik", topik)}${fig("rp.g.tren", tren)}${fig("rp.g.negara", neg)}</div>`;
  }
  const tabel = pt.length ? `<div class="jm-tbl-bungkus"><table class="jm-tabel"><thead><tr><th>${esc(t("rp.kol.judul"))}</th><th>${esc(t("rp.kol.tahun"))}</th><th>${esc(t("rp.kol.status"))}</th></tr></thead><tbody>${pt.map((p) => `<tr><td><a href="${esc(p.tautan)}" target="_blank" rel="noopener noreferrer">${esc(p.judul)}</a></td><td>${esc(p.tahun ?? "")}</td><td>${esc(p.status ?? "")}</td></tr>`).join("")}</tbody></table></div>` : "";
  return {
    html: exHtml({ id: "riset", ikon: "analisis", topik: t("rp.ey"), judulHtml: hlHtml("rp.j", angka(k ? k.karya_energi_2019_sekarang : pt.length)), aksiHtml: sumberHtml(sumber), isiHtml: `<div class="oj-bag-isi">${grafik}${tabel}</div>` }),
    pasang() {},
  };
}
