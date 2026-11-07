/* /proyek: dua bagian keputusan. J = pelacak proyek bermasalah, N = pipeline RUPTL untuk investor.
   Modul mandiri: proyek.js memanggil pasangKeputusan(SEMUA, wadah) sekali. Data = potret /data/*.json.
   INP: chrome filter/ubin/urut berubah seketika; badan tabel digambar ulang lewat nanti(). */
import { t, ada, angka, tanggal, bahasa } from "/i18n.js";
import { esc, nanti, debounce, ikon } from "/inti/umum.js";
import { sumberHtml, exHtml } from "/inti/komponen.js";
import { pilTek, pilStatus } from "/inti/ikon_tek.js";
import { PROV } from "/penerbit.js";
import { tautOrg, siapTautan } from "/inti/tautan.js";
import { logoOrgSatu } from "/inti/logo_org.js";
import { aksiHtml } from "/inti/aksi_ex.js";

const BATAS = 15, UJUNG = "…", TAHUN = new Date().getFullYear();
const TEKS = ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "penyimpanan", "nuklir"];
const GOL = [["a", "kalender"], ["b", "blokir"], ["c", "linimasa"]];
const SIS = ["sum", "jmb", "kal", "smpnt"];
const JAM = '<svg class="jm-ikt jm-ikt-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
const num = (n, d) => angka(n, { desimal: d ?? (Number.isInteger(n) ? 0 : 1) });
const hl = (n) => `<span class="jm-hl">${esc(n)}</span>`;
const estPil = () => `<span class="jm-pil jm-pil-est">${esc(t("pj.est"))}</span>`;
const labTek = (k) => (ada("pj.tek." + k) ? t("pj.tek." + k) : k || "-");
const lambang = (prov) => { const k = PROV[String(prov || "").trim().toLowerCase()]; return k ? `<img src="/img/provinsi/${k}.png" width="18" height="18" alt="" loading="lazy" decoding="async">` : ""; };
const selProv = (p) => (p ? `<span class="jm-pj-provsel">${lambang(p)}<span>${esc(p)}</span></span>` : "-");
const ambil = (u) => fetch(u, { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error(u); return r.json(); });
const urlAman = (u) => (/^https?:\/\//i.test(u || "") ? u : "");
const kosongBanding = (v) => v === null || v === "" || v === undefined;
const bandingkan = (k, a) => (x, y) => {
  const u = x[k], v = y[k];
  if (u === v) return String(x.nama).localeCompare(y.nama);
  if (kosongBanding(u)) return 1;
  if (kosongBanding(v)) return -1;
  return (typeof u === "number" ? u - v : String(u).localeCompare(String(v))) * a;
};

/* tabel urut + bertahap; kolom = [kunciUrut|null, kunciKamus, sel(r), kelas] */
function tabel(el, kolom, rows, S, kosong) {
  rows = rows.slice().sort(bandingkan(S.k, S.arah));
  if (!rows.length) { el.innerHTML = `<div class="jm-kosong">${ikon("info", 32)}<p>${esc(t(kosong))}</p></div>`; return; }
  const kepala = kolom.map(([k, kt]) => `<th scope="col"${k ? ` aria-sort="${S.k === k ? (S.arah > 0 ? "ascending" : "descending") : "none"}"` : ""}>${k ? `<button type="button" class="jm-urut" data-u="${k}">${esc(t(kt))}</button>` : esc(t(kt))}</th>`).join("");
  const maks = Math.max(1, Math.ceil(rows.length / BATAS)); S.hal = Math.min(Math.max(1, S.hal || 1), maks);
  const dari = (S.hal - 1) * BATAS;
  const badan = rows.slice(dari, dari + BATAS).map((r) => `<tr>${kolom.map(([, kt, f, kls]) => `<td data-label="${esc(t(kt))}"${kls ? ` class="${kls}"` : ""}>${f(r)}</td>`).join("")}</tr>`).join("");
  el.innerHTML = `<div class="jm-gulir"><table class="jm-tabel jm-kp-tabel"><thead><tr>${kepala}</tr></thead><tbody>${badan}</tbody></table></div>
    ${pager(S.hal, maks, dari + 1, Math.min(dari + BATAS, rows.length), rows.length)}`;
}
/* kolom Pengembang: logo kecil + nama perusahaan (tautan /o/<id> bila ada di organisasi) + pil status di bawahnya */
const kelompok = (b) => (b.peng === "IPP" ? "ipp" : b.peng ? "pln" : "tak");
function pengHtml(b) {
  if (!b.peng) return `<span class="jm-bantu">${esc(t("kp.peng.tak"))}</span>`;
  const anak = b.peng === "SH-PLN", pil = anak ? t("kp.peng.anak") : b.peng;
  const d = b.dev;
  let nama;
  if (d) {
    const logo = d.org_id ? logoOrgSatu(d.org_id, d.nama) : "";
    const teks = d.org_id ? tautOrg(d.org_id, d.nama) : esc(d.nama);
    nama = `<span class="jm-kp-dev">${logo ? `<img class="jm-kp-dev-logo" src="${esc(logo)}" alt="" width="22" height="22" loading="lazy" data-galat="hapus">` : ""}<span class="jm-kp-dev-nama">${teks}</span></span>`;
  } else if (b.peng === "IPP") nama = `<span class="jm-bantu jm-kp-dev-nama">${esc(t("kp.peng.ipp_tak"))}</span>`;
  else nama = anak ? "" : `<span class="jm-kp-dev-nama">${"PT PLN (Persero)"}</span>`;
  return `<span class="jm-kp-peng-sel">${nama}<span class="jm-kp-peng jm-kp-peng-${kelompok(b)}">${esc(pil)}</span></span>`;
}
/* paginasi bernomor: panah ikon, nomor dengan elipsis, "a-b dari n"; tanpa kunci i18n baru (jm.sebelumnya/berikutnya sudah ada) */
function pager(hal, maks, a, b, total) {
  const set = new Set([1, maks, hal - 1, hal, hal + 1]); if (hal <= 3) [2, 3].forEach((x) => set.add(x)); if (hal >= maks - 2) [maks - 1, maks - 2].forEach((x) => set.add(x));
  let nomor = "", prev = 0;
  for (const n of [...set].filter((x) => x >= 1 && x <= maks).sort((x, y) => x - y)) { if (n - prev > 1) nomor += `<span class="jm-hal-elips" aria-hidden="true">${UJUNG}</span>`; nomor += `<button type="button" class="jm-hal-no" data-hal="${n}"${n === hal ? ' aria-current="page"' : ""} aria-label="${esc(t("jm.hal", { n: angka(n) }))}">${num(n)}</button>`; prev = n; }
  const panah = (ik, h, kunci, mati) => `<button type="button" class="jm-hal-no jm-hal-panah" data-hal="${h}" aria-label="${esc(t(kunci))}"${mati ? " disabled" : ""}>${ikon(ik, 16)}</button>`;
  return `<nav class="jm-hal jm-hal-no-bar" aria-label="${esc(t("jm.hal", { n: angka(hal) }))}"><span class="jm-hal-info">${num(a)}-${num(b)} ${esc(t("jm.dari"))} ${num(total)}</span>${maks > 1 ? `<span class="jm-hal-daftar">${panah("panah-kiri", hal - 1, "jm.sebelumnya", hal <= 1)}${nomor}${panah("panah-kanan", hal + 1, "jm.berikutnya", hal >= maks)}</span>` : ""}</nav>`;
}
function urutKlik(sec, S, gambar, kananDulu) {
  sec.addEventListener("click", (e) => {
    const u = e.target.closest("[data-u]"), l = e.target.closest("[data-hal]");
    if (u) {
      const k = u.dataset.u;
      S.hal = 1; S.arah = S.k === k ? -S.arah : (kananDulu.includes(k) ? -1 : 1); S.k = k;
      for (const th of sec.querySelectorAll("th[aria-sort]")) th.setAttribute("aria-sort", th.contains(u) ? (S.arah > 0 ? "ascending" : "descending") : "none");
      nanti(gambar);
    } else if (l && !l.disabled) { S.hal = +l.dataset.hal; nanti(gambar); }
  });
}
const pilihHtml = (id, ik, label, opsi, nilai) => `<label class="jm-pil-pilih">${ikon(ik, 18)}<span class="sr">${esc(label)}</span><select id="${id}" data-ikon="${esc(ik)}">${opsi.map(([v, l, oi]) => `<option value="${esc(v)}"${oi ? ` data-ikon="${esc(oi)}"` : ""}${v === nilai ? " selected" : ""}>${esc(l)}</option>`).join("")}</select></label>`;

export async function pasangKeputusan(SEMUA, wadah, tglProyek) {
  let rup, ber, png = { baris: {} };
  try { [rup, ber] = await Promise.all([ambil("/data/ruptl.json"), ambil("/data/berita.json")]); } catch { return; }
  try { png = await ambil("/data/ruptl_pengembang.json"); } catch { /* pendamping opsional: tanpa itu kolom memakai label status */ }
  siapTautan("org");

  /* ---------- J: proyek bermasalah ---------- */
  const awal = new Date(); awal.setFullYear(awal.getFullYear() - 1);
  const batas = awal.toISOString().slice(0, 10);
  const beritaId = new Map(ber.baris.map((b) => [b.id, b]));
  const kabar = new Map();
  const catat = (id, b) => { const tg = String(b.terbit || "").slice(0, 10); const k = kabar.get(id); if (tg && (!k || tg > k.tgl)) kabar.set(id, { tgl: tg, url: urlAman(b.url), judul: b.judul }); };
  for (const b of ber.baris) for (const id of b.proyek_ids || []) catat(id, b);
  for (const r of SEMUA) for (const id of r.p.berita_ids || []) if (beritaId.has(id)) catat(r.id, beritaId.get(id));
  const JR = [];
  for (const r of SEMUA) {
    const k = kabar.get(r.id) || null, gol = [];
    const berhenti = r.st !== "beroperasi" && (r.st === "dibatalkan" || (r.p.status || []).some((s) => /tunda|henti|mangkrak/i.test(s.status_asli || "")));
    if (r.telat > 0 && r.st !== "dibatalkan") gol.push("a");
    if (berhenti) gol.push("b");
    if (!["beroperasi", "dibatalkan"].includes(r.st) && (!k || k.tgl < batas)) gol.push("c");
    if (gol.length) JR.push({ ...r, gol, kab: k, kabTgl: k ? k.tgl : null });
  }
  const J = { gol: "", tek: "", prov: "", k: "telat", arah: -1, hal: 1 };
  const jTampil = () => JR.filter((r) => (!J.gol || r.gol.includes(J.gol)) && (!J.tek || r.tek === J.tek) && (!J.prov || r.prov === J.prov));
  const selGol = (r) => r.gol.map((g) => `<span class="jm-kp-gol jm-kp-gol-${g}">${ikon(GOL.find((x) => x[0] === g)[1], 14)}<span>${esc(t("kp.g." + g))}</span></span>`).join("");
  const kolomJ = [
    ["nama", "pj.c.nama", (r) => `<b><a class="jm-pj-nm" href="/p/${esc(r.id)}">${esc(r.nama)}</a></b>`],
    ["tek", "pj.c.tek", (r) => pilTek(r.tek), "jm-tengah"],
    ["prov", "pj.c.prov", (r) => selProv(r.prov)],
    ["kap", "pj.c.kap", (r) => (r.kap === null ? "-" : `${num(r.kap)} <span class="jm-pj-sat">${esc(r.sat)}</span>`), "jm-num"],
    ["cod", "pj.c.cod", (r) => (r.cod === null ? "-" : r.cod), "jm-tengah"],
    ["telat", "pj.c.telat", (r) => (r.telat ? `<span class="jm-pil-telat${r.telat >= 2 ? " jm-pil-telat-b" : ""}">${JAM}<span>${esc(t("pj.telat.singkat", { n: r.telat }))}</span></span> ${estPil()}` : "-"), "jm-tengah"],
    [null, "kp.c.gol", selGol],
    ["kabTgl", "kp.c.kabar", (r) => (r.kab ? `<span class="jm-kp-kabar">${esc(tanggal(r.kab.tgl))}${r.kab.url ? ` <a href="${esc(r.kab.url)}" target="_blank" rel="noopener noreferrer">${esc(r.kab.judul)}</a>` : ""}</span>` : `<span class="jm-bantu">${esc(t("kp.kabar.nol"))}</span>`)],
  ];
  const secJ = document.createElement("div");
  const jUbin = () => {
    $j("kpJUbin").innerHTML = GOL.map(([g, ik]) => `<button type="button" class="jm-kp-ub" data-g="${g}" aria-pressed="${J.gol === g}"><span class="jm-kpi-ik">${ikon(ik, 18)}</span><b>${esc(num(JR.filter((r) => r.gol.includes(g)).length))}</b><span>${esc(t("kp.g." + g))}</span></button>`).join("");
    $j("kpJHapus").hidden = !(J.gol || J.tek || J.prov);
  };
  const $j = (id) => secJ.querySelector("#" + id);
  const jTabel = () => tabel($j("kpJTab"), kolomJ, jTampil(), J, "jm.kosong.cocok");
  const jGambar = () => {
    const n = JR.length, teks = [...new Set(JR.map((r) => r.tek).filter(Boolean))].sort(), provs = [...new Set(JR.map((r) => r.prov).filter(Boolean))].sort();
    secJ.innerHTML = exHtml({
      id: "exMasalah", ikon: "peringatan", topik: t("kp.j.ey"), judulHtml: `${hl(num(n))} ${esc(t("kp.j.j"))}`, subHtml: esc(t("kp.j.s", { tahun: TAHUN })),
      aksiHtml: aksiHtml({ csv: true }) + sumberHtml(esc(t("kp.j.sumber", { p: tanggal(tglProyek), b: tanggal(ber.dibangun_pada) }))),
      isiHtml: `<div class="jm-kp-ubin" id="kpJUbin"></div>
        <div class="jm-saring" role="group" aria-label="${esc(t("kp.j.ey"))}">
          ${pilihHtml("kpJTek", "jenis", t("pj.f.tek"), [["", t("pj.f.tek")], ...teks.map((k) => [k, labTek(k), "tek:" + k])], J.tek)}
          ${pilihHtml("kpJProv", "peta", t("pj.f.provinsi"), [["", t("pj.f.provinsi")], ...provs.map((p) => [p, p, PROV[p.trim().toLowerCase()] ? "prov:" + PROV[p.trim().toLowerCase()] : ""])], J.prov)}
          <button type="button" class="jm-hapus" id="kpJHapus" hidden>${ikon("silang", 18)}<span>${esc(t("jm.kosong.reset"))}</span></button>
        </div>
        <div id="kpJTab"></div>
        <p class="jm-bantu jm-kp-metode"><b>${esc(t("kp.metode"))}</b> ${esc(t("kp.j.metode", { tahun: TAHUN }))}</p>`,
    });
    jUbin(); jTabel();
  };
  secJ.addEventListener("click", (e) => {
    const g = e.target.closest("[data-g]");
    if (g) { J.gol = J.gol === g.dataset.g ? "" : g.dataset.g; J.hal = 1; jUbin(); nanti(jTabel); }
    if (e.target.closest("#kpJHapus")) { Object.assign(J, { gol: "", tek: "", prov: "", hal: 1 }); $j("kpJTek").value = ""; $j("kpJProv").value = ""; jUbin(); nanti(jTabel); }
  });
  secJ.addEventListener("change", (e) => {
    if (e.target.id === "kpJTek") J.tek = e.target.value; else if (e.target.id === "kpJProv") J.prov = e.target.value; else return;
    J.hal = 1; jUbin(); nanti(jTabel);
  });
  urutKlik(secJ, J, jTabel, ["kap", "telat", "kabTgl"]);
  secJ.addEventListener("jm:csv", (e) => {
    e.detail.baris = [[t("pj.c.nama"), t("pj.c.tek"), t("pj.c.prov"), t("pj.c.kap"), t("pj.c.satuan"), t("pj.c.cod"), t("pj.c.telat") + " (EST)", t("kp.c.gol"), t("kp.c.kabar"), "URL"],
      ...jTampil().sort(bandingkan(J.k, J.arah)).map((r) => [r.nama, labTek(r.tek), r.prov, r.kap ?? "", r.kap === null ? "" : r.sat, r.cod ?? "", r.telat || "", r.gol.map((g) => t("kp.g." + g)).join("; "), r.kabTgl || "", r.kab ? r.kab.url : ""])];
  }, true);

  /* ---------- N: pipeline RUPTL ---------- */
  const RB = rup.baris.map((b) => ({ ...b, nama: b.nama, mw: b.kapasitas_mw ?? 0, prov: b.provinsi || "", cod: (b.cod_tahun || []).join(", "), codMin: (b.cod_tahun || [])[0] ?? null, peng: b.pengembang_status || "", dev: png.baris[b.id] || null, sis: b.regional || "" }));
  const jumMW = (rows) => rows.reduce((s, b) => s + b.mw, 0);
  const N = { ipp: false, sis: "", prov: "", k: "mw", arah: -1, hal: 1 };
  const nTampil = () => RB.filter((b) => (!N.ipp || b.peng === "IPP") && (!N.sis || b.sis === N.sis) && (!N.prov || b.prov === N.prov));
  const namaTbl = (b) => (b.proyek_id ? `<b><a class="jm-pj-nm" href="/p/${esc(b.proyek_id)}">${esc(b.nama)}</a></b>` : `<b>${esc(b.nama)}</b>`);
  const kolomN = [
    ["nama", "pj.c.nama", namaTbl],
    ["teknologi", "pj.c.tek", (b) => pilTek(b.teknologi), "jm-tengah"],
    ["sis", "kp.c.sis", (b) => esc(t("kp.s." + b.sis))],
    ["prov", "pj.c.prov", (b) => (b.prov ? selProv(b.prov) : esc(t("kp.prov.gab")))],
    ["mw", "kp.c.mw", (b) => num(b.mw), "jm-num"],
    ["codMin", "pj.c.cod", (b) => esc(b.cod || "-"), "jm-tengah"],
    ["peng", "kp.c.peng", pengHtml, "jm-kp-sel-peng"],
    ["status", "pj.c.status", (b) => pilStatus(b.status), "jm-tengah"],
  ];
  const secN = document.createElement("div");
  const $n = (id) => secN.querySelector("#" + id);
  const nTabel = () => tabel($n("kpNTab"), kolomN, nTampil(), N, "jm.kosong.cocok");
  /* grafik: lebar mengikuti wadah, font nyata (bukan skala viewBox) */
  const perTahun = () => {
    const m = new Map();
    for (const b of RB) { const ys = b.cod_tahun || []; for (const y of ys) { const o = m.get(y) || {}; o[b.teknologi] = (o[b.teknologi] || 0) + b.mw / ys.length; m.set(y, o); } }
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  };
  const grafik = () => {
    const el = $n("kpNGraf"); if (!el) return;
    const data = perTahun(), W = Math.max(300, el.clientWidth || 720), H = 300, ml = 46, mr = 8, mt = 14, mb = 28;
    const tot = data.map(([, o]) => Object.values(o).reduce((s, v) => s + v, 0)), mx = Math.max(...tot, 1);
    const langkah = [250, 500, 1000, 2000, 2500, 5000].find((s) => mx / s <= 5) || 5000, atas = Math.ceil(mx / langkah) * langkah;
    const pw = W - ml - mr, ph = H - mt - mb, pita = pw / data.length, bw = Math.min(56, pita * 0.64), y = (v) => mt + ph - (v / atas) * ph;
    let s = `<svg class="jm-kp-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(t("kp.n.grafik"))}">`;
    for (let v = 0; v <= atas; v += langkah) s += `<line class="jm-kp-gr" x1="${ml}" x2="${W - mr}" y1="${y(v)}" y2="${y(v)}"/><text class="jm-kp-sb" x="${ml - 6}" y="${y(v) + 4}" text-anchor="end">${esc(angka(v))}</text>`;
    data.forEach(([th, o], i) => {
      const x = ml + pita * i + (pita - bw) / 2; let dasar = 0;
      for (const k of TEKS) { const v = o[k]; if (!v) continue; s += `<rect class="jm-kp-s jm-kp-s-${k}" x="${x}" y="${y(dasar + v)}" width="${bw}" height="${Math.max(0.5, y(dasar) - y(dasar + v))}"/>`; dasar += v; }
      s += `<text class="jm-kp-sb" x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${th}</text>`;
      const ring = TEKS.filter((k) => o[k]).map((k) => `${labTek(k)} ${num(o[k], 0)}`).join(", ");
      s += `<rect class="jm-kp-hit" tabindex="0" role="img" data-i="${i}" x="${ml + pita * i}" y="${mt}" width="${pita}" height="${ph + mb - 4}" aria-label="${esc(t("kp.n.tip", { tahun: th, mw: num(tot[i], 0) }) + ": " + ring)}"/>`;
    });
    el.querySelector(".jm-kp-wrap").innerHTML = s + "</svg>";
    el.__data = data; el.__tot = tot;
  };
  const tip = (el, hit) => {
    const tp = $n("kpNTip"), i = +hit.dataset.i, [th, o] = el.__data[i];
    tp.innerHTML = `<b>${esc(t("kp.n.tip", { tahun: th, mw: num(el.__tot[i], 0) }))}</b><ul>${TEKS.filter((k) => o[k]).map((k) => `<li><i class="jm-kp-s-${k}"></i><span>${esc(labTek(k))}</span><b>${esc(num(o[k], 0))}</b></li>`).join("")}</ul>`;
    const a = hit.getBoundingClientRect(), w = el.getBoundingClientRect();
    tp.hidden = false;
    const lebar = tp.offsetWidth, kiri = Math.min(Math.max(a.left - w.left + a.width / 2 - lebar / 2, 0), w.width - lebar);
    tp.style.left = kiri + "px";
  };
  const nGambar = () => {
    const tot = jumMW(RB), per = { ipp: 0, ippK: 0, pln: 0, tak: 0 }, cnt = { ipp: 0, ippK: 0, pln: 0, tak: 0 };
    for (const b of RB) { const k = kelompok(b) === "ipp" ? (b.status === "konstruksi" ? "ippK" : "ipp") : kelompok(b); per[k] += b.mw; cnt[k]++; }
    const sist = SIS.filter((s) => RB.some((b) => b.sis === s)), provs = [...new Set(RB.map((b) => b.prov).filter(Boolean))].sort();
    const ub = [["ipp", "tingkat"], ["ippK", "status"], ["pln", "perisai"], ["tak", "info"]];
    secN.innerHTML = exHtml({
      id: "exPipa", ikon: "analisis", topik: t("kp.n.ey"), judulHtml: `${hl(num(tot, 0))} ${esc(t("kp.n.j"))}`, subHtml: esc(t("kp.n.s", { n: num(RB.length) })),
      aksiHtml: aksiHtml({ csv: true }) + sumberHtml(`<a href="${esc(urlAman(rup.sumber[0].url))}" target="_blank" rel="noopener noreferrer">${esc(t("kp.n.dok"))}</a>, ${esc(tanggal(rup.meta.diperbarui))}. ${esc(t("kp.n.celah"))}`),
      isiHtml: `<div class="jm-kp-ubin">${ub.map(([k, ik]) => `<div class="jm-kp-ub jm-kp-ub-d"><span class="jm-kpi-ik">${ikon(ik, 18)}</span><b>${esc(num(per[k], 0))} <small>MW</small></b><span>${esc(t("kp.n.u." + k))}</span><small>${esc(t("kp.n.proyek", { n: num(cnt[k]) }))}</small></div>`).join("")}</div>
        <h3 class="jm-kp-h3">${esc(t("kp.n.grafik"))}</h3>
        <ul class="jm-kp-leg">${TEKS.filter((k) => RB.some((b) => b.teknologi === k)).map((k) => `<li>${pilTek(k)}</li>`).join("")}</ul>
        <div class="jm-kp-grafik" id="kpNGraf"><div class="jm-kp-wrap"></div><div class="jm-kp-tip" id="kpNTip" role="tooltip" hidden></div></div>
        <h3 class="jm-kp-h3">${esc(t("kp.n.tabel"))}</h3>
        <div class="jm-saring" role="group" aria-label="${esc(t("kp.n.tabel"))}">
          ${pilihHtml("kpNSis", "wilayah", t("kp.f.sis"), [["", t("kp.f.sis")], ...sist.map((s) => [s, t("kp.s." + s)])], N.sis)}
          ${pilihHtml("kpNProv", "peta", t("pj.f.provinsi"), [["", t("pj.f.provinsi")], ...provs.map((p) => [p, p, PROV[p.trim().toLowerCase()] ? "prov:" + PROV[p.trim().toLowerCase()] : ""])], N.prov)}
          <button type="button" class="jm-kp-tog" id="kpNIpp" aria-pressed="${N.ipp}">${ikon("centang", 16)}<span>${esc(t("kp.f.ipp"))}</span></button>
        </div>
        <div id="kpNTab"></div>
        <p class="jm-bantu jm-kp-metode"><b>${esc(t("kp.metode"))}</b> ${esc(t("kp.n.metode"))}</p>`,
    });
    nTabel(); nanti(grafik);
  };
  secN.addEventListener("click", (e) => {
    if (e.target.closest("#kpNIpp")) { N.ipp = !N.ipp; N.hal = 1; $n("kpNIpp").setAttribute("aria-pressed", String(N.ipp)); nanti(nTabel); }
  });
  secN.addEventListener("change", (e) => {
    if (e.target.id === "kpNSis") N.sis = e.target.value; else if (e.target.id === "kpNProv") N.prov = e.target.value; else return;
    N.hal = 1; nanti(nTabel);
  });
  const graf = () => secN.querySelector("#kpNGraf");
  secN.addEventListener("pointerover", (e) => { const h = e.target.closest(".jm-kp-hit"); if (h) tip(graf(), h); });
  secN.addEventListener("focusin", (e) => { const h = e.target.closest(".jm-kp-hit"); if (h) tip(graf(), h); });
  const sembunyi = () => { const tp = secN.querySelector("#kpNTip"); if (tp) tp.hidden = true; };
  secN.addEventListener("pointerleave", sembunyi); secN.addEventListener("focusout", sembunyi);
  urutKlik(secN, N, nTabel, ["mw"]);
  secN.addEventListener("jm:csv", (e) => {
    e.detail.baris = [[t("pj.c.nama"), t("pj.c.tek"), t("kp.c.sis"), t("pj.c.prov"), t("kp.c.mw"), t("pj.c.cod"), t("kp.c.peng"), t("pj.c.status"), "ID"],
      ...nTampil().sort(bandingkan(N.k, N.arah)).map((b) => [b.nama, labTek(b.teknologi), t("kp.s." + b.sis), b.prov, b.mw, b.cod, b.dev ? b.dev.nama : b.peng, b.status, b.proyek_id || ""])];
  }, true);
  window.addEventListener("resize", debounce(grafik, 150));

  const semua = () => { jGambar(); nGambar(); };
  wadah.replaceChildren(secJ, secN);
  semua();
  document.addEventListener("jm:bahasa", () => nanti(semua));
}
