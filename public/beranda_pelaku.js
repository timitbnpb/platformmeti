/* Exhibit "Pelaku" di beranda: grafik komposisi jenis + satu kartu per jenis (ikon, angka, persen, deret logo/monogram), bertaut ke direktori tersaring. */
import { t, angka } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { sumberHtml, exHtml, lihatSemuaHtml } from "/inti/komponen.js";
import { logoOrg } from "/inti/logo_org.js";

const S = (d) => `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
/* [kode, warna token, ikon] satu ikon per jenis, tidak ada yang kembar */
const JENIS = [
  ["bumn", "--data1", S('<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6zM9 12l2 2 4-4"/>')],
  ["swasta", "--data5", S('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>')],
  ["internasional", "--info", S('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>')],
  ["asosiasi", "--data2", S('<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M11 7.3 6 16.8M13 7.3l5 9.5M7.5 19h9"/>')],
  ["kementerian-lembaga", "--warn", S('<path d="m14 4 6 6-3 3-6-6zM10 8l-6 6 3 3 6-6zM3 21h9"/>')],
  ["koperasi", "--ok", S('<path d="M8 13V5a1.5 1.5 0 0 1 3 0v6M11 10V4a1.5 1.5 0 0 1 3 0v7M14 10V6a1.5 1.5 0 0 1 3 0v8c0 4-2 7-6 7s-6-2-7-5l-2-4a1.5 1.5 0 0 1 2.5-1.5L8 14"/>')],
  ["ormawa", "--data3", S('<path d="M2 9l10-5 10 5-10 5zM6 11v5c3 3 9 3 12 0v-5"/>')],
  ["perguruan-tinggi", "--data4", S('<path d="M3 10l9-6 9 6zM5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>')],
  ["think-tank", "--bad", S('<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M8 10h4"/>')],
];
/* satu logo per keluarga induk (PLN dan anak usahanya memakai tanda yang sama) */
const KELUARGA = /^(?:pt\.?\s+)?(pln|pertamina|medco|pgn|telkom)\b/i;
const kunciLogo = (o, u) => (KELUARGA.exec(String(o.nama).trim())?.[1] || "").toLowerCase() || u;
/** Logo yang pasti ada (data atau peta resmi); berkas /logo/org/<id> tanpa catatan data dianggap belum ada. */
const logoPasti = (o) => { const u = logoOrg(o.id, o.nama, o.logo)[0]; return o.logo || (u && !u.includes("/logo/org/")) ? u : ""; };
const singkat = (n) => String(n).replace(/^PT\.?\s+/i, "").replace(/\s*\((persero|tbk)\)/gi, "").replace(/\s+(tbk|\(persero\))$/i, "").replace(/\s*\(.*$/, "").trim();
const MAKS = 5;
const mono = (n) => { const w = String(n).split(/\s+/).filter((x) => /^[A-Za-z0-9]/.test(x)); const a = w.length > 1 ? w[0][0] + w[1][0] : (w[0] || "?").slice(0, 2); return a[0].toUpperCase() + a.slice(1).toLowerCase(); };

/** org: baris organisasi; pro: katalog proyek (untuk mengurutkan logo menurut kapasitas). */
export function pelakuHtml(org, pro) {
  const mw = new Map(pro.baris.map((p) => [p.id, p.kapasitas?.[0]?.nilai || 0]));
  const skor = (o) => (o.proyek_ids || []).reduce((s, i) => s + (mw.get(i) || 0), 0);
  const kartu = JENIS.map(([k, warna, ik]) => {
    const isi = org.filter((o) => o.kategori?.kode === k).sort((a, b) => skor(b) - skor(a));
    const lihat = new Set(), logo = isi.filter((o) => { const u = logoPasti(o), kc = u && kunciLogo(o, u); return kc && !lihat.has(kc) && lihat.add(kc); });
    const polos = isi.filter((o) => !logo.includes(o) && !lihat.has(kunciLogo(o, "")));
    const tampil = [...logo, ...polos].slice(0, MAKS);
    return { k, warna, ik, n: isi.length, tampil, sisa: isi.length - tampil.length, nama: isi.slice(0, 3).map((o) => singkat(o.nama)) };
  }).filter((x) => x.n);
  const total = kartu.reduce((s, x) => s + x.n, 0), tanpa = org.length - total;
  const pct = (n) => angka(total ? (n / total) * 100 : 0, { desimal: 1 });
  const href = (k) => `/direktori?tampil=lembaga&amp;kat=${encodeURIComponent(k)}`;
  const tile = (o) => { const n = singkat(o.nama), u = logoPasti(o); return `<span class="jm-pel-lo" title="${esc(n)}"><span class="jm-pel-mn">${esc(mono(n))}</span>${u ? `<img src="${esc(u)}" width="40" height="40" alt="" loading="lazy" decoding="async" data-galat="hapus">` : ""}</span>`; };
  const bar = `<div class="jm-pel-bar" role="list" aria-label="${esc(t("beranda.pel.aria"))}">${kartu.map((x) => `<a class="jm-pel-seg jm-pel-${x.k}" role="listitem" data-k="${x.k}" data-tip="${esc(t("beranda.pel.tip", { jenis: t("beranda.pel." + x.k), n: angka(x.n), p: pct(x.n) }))}" data-n="${x.n}" href="${href(x.k)}" aria-label="${esc(t("beranda.pel." + x.k))}: ${esc(angka(x.n))}"></a>`).join("")}</div>`;
  const legenda = `<ul class="jm-pel-leg">${kartu.map((x) => `<li class="jm-pel-${x.k}" data-k="${x.k}"><i></i><span>${esc(t("beranda.pel." + x.k))}</span><b>${esc(pct(x.n))}%</b></li>`).join("")}</ul>`;
  const sel = tanpa > 0 ? `<p class="jm-pel-sel" title="${esc(t("beranda.pel.sel", { n: angka(tanpa), total: angka(org.length), jenis: angka(total) }))}">${ikon("info", 14)}<span>${esc(t("beranda.pel.sel.k", { n: angka(tanpa) }))}</span></p>` : "";
  const grafik = `<div class="jm-pel-grafik">${bar}<div class="jm-pel-bawah">${legenda}${sel}</div><div class="jm-pel-tip" hidden></div></div>`;
  const kartuHtml = `<ul class="jm-pel">${kartu.map((x) => `<li><a class="jm-pel-k jm-pel-${x.k}" data-k="${x.k}" href="${href(x.k)}" aria-label="${esc(t("beranda.pel." + x.k))}: ${esc(angka(x.n))}"><span class="jm-pel-hd"><span class="jm-pel-ik">${x.ik}</span><span class="jm-pel-t"><b class="jm-pel-n">${esc(angka(x.n))}</b><span class="jm-pel-l">${esc(t("beranda.pel." + x.k))}</span></span><span class="jm-pil jm-pel-p" title="${esc(t("beranda.pel.persen", { p: pct(x.n) }))}">${esc(pct(x.n))}%</span></span><span class="jm-pel-lg">${x.tampil.map(tile).join("")}${x.sisa > 0 ? `<span class="jm-pel-lo jm-pel-plus" title="${esc(t("beranda.eko.lain", { n: angka(x.sisa) }))}">+${esc(angka(x.sisa))}</span>` : ""}</span></a></li>`).join("")}</ul>`;
  return exHtml({ kelas: "jm-pel-ex", tingkat: "h2", ikon: "orang", topik: t("beranda.s02.ey"), judulHtml: esc(t("beranda.pel.j", { n: angka(total), k: angka(kartu.length) })), subHtml: esc(t("beranda.s02.p")), aksiHtml: lihatSemuaHtml("/direktori?tampil=lembaga", t("beranda.eko.semua", { n: angka(org.length) })) + sumberHtml(esc(t("beranda.eko_sumber"))), isiHtml: grafik + kartuHtml });
}

/** Interaksi grafik komposisi: tooltip mengambang + sorot kartu/segmen/legenda dengan jenis yang sama. */
export function pasangPelaku(akar) {
  const ex = akar.querySelector(".jm-pel-ex"); if (!ex || ex.dataset.pasang) return; ex.dataset.pasang = "1";
  ex.querySelectorAll(".jm-pel-seg").forEach((e) => { e.style.flexGrow = e.dataset.n; });
  const tip = ex.querySelector(".jm-pel-tip"), graf = ex.querySelector(".jm-pel-grafik");
  const sorot = (k) => ex.querySelectorAll("[data-k]").forEach((e) => e.classList.toggle("jm-pel-redup", !!k && e.dataset.k !== k));
  const masuk = (e) => { const el = e.target.closest?.("[data-k]"); if (!el) return; sorot(el.dataset.k); if (!el.dataset.tip) return; const r = el.getBoundingClientRect(), g = graf.getBoundingClientRect(); tip.textContent = el.dataset.tip; tip.hidden = false; tip.style.setProperty("--x", Math.min(Math.max(r.left - g.left + r.width / 2, 90), g.width - 90) + "px"); };
  const keluar = () => { sorot(null); tip.hidden = true; };
  ex.addEventListener("pointerover", masuk); ex.addEventListener("focusin", masuk);
  ex.addEventListener("pointerleave", keluar); ex.addEventListener("focusout", keluar);
}
