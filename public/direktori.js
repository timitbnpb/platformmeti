/* /direktori: direktori Jaringan METI untuk anggota ke atas (cek sesi di router). Data dari GET /api/direktori (R2 potret anggota; src/direktori.js).
   Baris pakar = [id, nama, kampus, [sektor], h, karya, sitasi, orcid, [topik], foto, idSinta, prodi, subjek, status (s terdaftar SINTA,
   x tidak ada, "" belum dicek), logo kampus]. Semua teks dari luar di-escape. Port dari akademisi.js (KP D3, ADR-05: kelas .ak-*). */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  /* proyek, regulasi, wilayah punya satu rumah sendiri: tautan ?tampil= lama dialihkan, id ikut terbawa */
  const RUMAH = {proyek: "/proyek", regulasi: "/regulasi", wilayah: "/wilayah"};
  function aliheLama() { const qs = new URLSearchParams(location.search), k = qs.get("tampil") || (location.hash.match(/^#(?:tampil=)?(proyek|regulasi|wilayah)\b/) || [])[1]; if (!RUMAH[k]) return false;
    const id = qs.get("id") || qs.get(k) || (k === "wilayah" ? qs.get("prov") || qs.get("wilayah") : "") || (location.hash.match(/[#&]id=([^&]+)/) || [])[1] || (/^#(?!tampil=)(?!(?:proyek|regulasi|wilayah)\b)./.test(location.hash) ? decodeURIComponent(location.hash.slice(1)) : "");
    location.replace(RUMAH[k] + (!id ? "" : k === "proyek" ? "#" + encodeURIComponent(id) : k === "regulasi" ? "?id=" + encodeURIComponent(id) : "?prov=" + encodeURIComponent(id.split("|")[0]))); return true; }
  if (aliheLama()) return;
  /* kamus i18n (public/i18n.js, kunci dir.*) */
  const t = (k, v) => (globalThis.JM && JM.ada && JM.ada(k) ? JM.t(k, v) : k);
  /* CSP tanpa style= inline: template memakai data-st, diterapkan lewat CSSOM (cssText) begitu node masuk DOM; nilai warna = var(--token) */
  /* daftar putih properti + nilai: warna dari data tidak bisa menyelundupkan deklarasi lain (position:fixed dst.) */
  const ST_PROP = new Set(["--gw", "--n", "--w0", "--w", "-webkit-line-clamp", "background", "color", "fill", "height", "width"]), ST_NILAI = /^[#\w\s.%(),-]{1,80}$/;
  const terapSt = n => { if (n.nodeType !== 1) return; for (const e of n.matches("[data-st]") ? [n, ...n.querySelectorAll("[data-st]")] : n.querySelectorAll("[data-st]")) {
    for (const d of e.getAttribute("data-st").split(";")) { const i = d.indexOf(":"), k = d.slice(0, i).trim(), v = d.slice(i + 1).trim(); if (i > 0 && ST_PROP.has(k) && ST_NILAI.test(v) && !/url\(/i.test(v)) e.style.setProperty(k, v); }
    e.removeAttribute("data-st"); } };
  new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) terapSt(n); }).observe(document.documentElement, {childList: true, subtree: true});
  document.addEventListener("keydown", e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { const c = document.getElementById("akCari"); if (c) { e.preventDefault(); c.focus(); c.select(); } } });
  document.addEventListener("mouseover", e => { const b = e.target.closest?.(".ak-kbtn"); if (b) b.title = b.textContent.trim(); });
  /* warna untuk MapLibre dan kanvas tidak mengenal var(): selesaikan token ke nilai terhitung (ikut tema) */
  const rv = c => { const m = /^var\((--[\w-]+)\)$/.exec(String(c)); return m ? getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim() || "gray" : c; };
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
  const angka = n => (globalThis.JM && JM.angka ? JM.angka(Number(n || 0)) : String(Number(n || 0)));
  const fmt1 = n => (globalThis.JM && JM.angka ? JM.angka(Number(n), {desimal: 1}) : String(Math.round(Number(n) * 10) / 10));
  const nol = n => n == null || n === "" || Number.isNaN(Number(n)) ? "\u2013" : angka(n);
  const inisial = n => n.replace(/[^\p{L} ]/gu, "").split(/\s+/).filter(w => w.length > 1).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
  const LUAR = 'target="_blank" rel="noopener noreferrer"';
  const PER_HAL = 24;
  const RE_KAMPUS = /universitas|university|institut|institute|politeknik|polytechnic|sekolah tinggi|akademi|college|school/i;
  const jenisK = k => k === "Afiliasi belum diketahui" ? "l" : RE_KAMPUS.test(k) ? "k" : "l";
  /* SEKTOR = taksonomi kepakaran K16 (19 kode, dua kelompok). Label ID tertanam = utang i18n. Warna hanya token. */
  const SEKTOR = {
    "surya": ["Surya", '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>', "var(--accent-isi)"],
    "bayu": ["Bayu (angin)", '<path d="M12 12V21M12 12V3M12 12l7.5 4M12 12l-7.5 4"/><circle cx="12" cy="12" r="1.6"/>', "var(--accent-isi)"],
    "hidro": ["Hidro", '<path d="M12 3s-5 6-5 9a5 5 0 0 0 10 0c0-3-5-9-5-9z"/><path d="M2 21c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1 2-1 4-1"/>', "var(--accent-isi)"],
    "panas-bumi": ["Panas bumi", '<path d="m3 20 6-10 2 3 2-4 8 11z"/><path d="M12 6c0-2 1-3 3-3M10 5c-1-1-1-2 0-3"/>', "var(--accent-isi)"],
    "bioenergi": ["Bioenergi", '<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19c3-4 6-6 10-8"/>', "var(--accent-isi)"],
    "biomassa-sampah": ["Biomassa dan sampah", '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>', "var(--accent-isi)"],
    "nuklir": ["Nuklir", '<circle cx="12" cy="12" r="2"/><path d="M12 4a8 8 0 0 1 6.9 4M4 12a8 8 0 0 1 4-6.9M12 20a8 8 0 0 1-6.9-4M20 12a8 8 0 0 1-4 6.9"/>', "var(--accent-isi)"],
    "hidrogen": ["Hidrogen", '<circle cx="8" cy="12" r="3"/><circle cx="16" cy="12" r="3"/><path d="M11 12h2"/>', "var(--accent-isi)"],
    "laut": ["Energi laut", '<path d="M2 16c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2"/><path d="M2 11c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2"/>', "var(--accent-isi)"],
    "penyimpanan": ["Penyimpanan", '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10v4M7 10v4M11 10v4"/>', "var(--accent-isi)"],
    "jaringan": ["Jaringan", '<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M11 7.3 6 16.8M13 7.3l5 9.5M7.5 19h9"/>', "var(--accent-isi)"],
    "efisiensi": ["Efisiensi", '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>', "var(--accent-isi)"],
    "elektrifikasi": ["Elektrifikasi", '<path d="M13 3 6 13h5l-1 8 7-10h-5z"/>', "var(--accent-isi)"],
    "karbon": ["Karbon", '<path d="M7 15a4 4 0 1 1 1-8 5 5 0 0 1 9 2 3 3 0 0 1 0 6z"/>', "var(--accent-isi)"],
    "pembiayaan": ["Pembiayaan", '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5c0-1 1-1.5 2.5-1.5s2.5.6 2.5 1.7c0 2.3-5 1.3-5 3.6 0 1 1 1.7 2.5 1.7s2.5-.6 2.5-1.5M12 6.5v1.5M12 16v1.5"/>', "var(--accent-isi)"],
    "kebijakan": ["Kebijakan", '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>', "var(--accent-isi)"],
    "industri": ["Industri", '<path d="M3 21V9l6 4V9l6 4V5h6v16z"/>', "var(--accent-isi)"],
    "transisi-adil": ["Transisi adil", '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M15.5 14.5c3 0 5.5 1.7 5.5 4.5"/>', "var(--accent-isi)"],
    "riset-data": ["Riset dan data", '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', "var(--accent-isi)"],
  };
  const SEKTOR_GRUP = [["Teknologi", ["surya", "bayu", "hidro", "panas-bumi", "bioenergi", "biomassa-sampah", "nuklir", "hidrogen", "laut", "penyimpanan", "jaringan", "efisiensi", "elektrifikasi"]], ["Lintas bidang", ["karbon", "pembiayaan", "kebijakan", "industri", "transisi-adil", "riset-data"]]];
  const SEKTOR_TERKAIT = new Set();
  const ikon = (d, w) => `<svg class="ak-ikon" viewBox="0 0 24 24" aria-hidden="true" data-st="--w:${w}">${d}</svg>`;
  const pilSektor = (r, utama) => { const [l, d, w] = SEKTOR[r] || [r, "", "var(--ink2)"];
    return `<span class="ak-r${utama ? " utama" : ""}" data-st="--w0:${w}">${d ? ikon(d, w) : ""}${esc(l)}</span>`; };
  /* judul HURUF BESAR SEMUA dari sumber jadi Huruf Judul; nama jurnal OpenAlex "A/A" kembar diambil satu */
  const KECIL = new Set("a an and as at by for from in into of on or the to with via di dan untuk dari pada yang ke dengan atau dalam terhadap sebagai oleh".split(" "));
  const rapiJudul = t => { t = String(t || "").trim(); if (!t || /\p{Ll}/u.test(t) || t.length < 16) return t;
    return t.toLowerCase().replace(/[\p{L}\d][\p{L}\d'’-]*/gu, (w, i) => i && KECIL.has(w) && !/[:\u2013\u2014]\s*$/.test(t.slice(0, i)) ? w : w[0].toUpperCase() + w.slice(1)); };
  const rapiJurnal = t => { const p = String(t || "").split("/"), n = x => x.trim().toLowerCase().replace(/^the\s+/, "");
    return p.length === 2 && n(p[0]) === n(p[1]) ? p[0].trim() : String(t || ""); };
  const METRIK = [[4, "h-index", "Pengaruh riset", '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'],
    [5, "Karya", "Publikasi ilmiah", '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>'],
    [6, "Sitasi", "Dikutip peneliti lain", '<path d="M7 7h4v6H5v-2c0-2 1-4 2-4zM15 7h4v6h-6v-2c0-2 1-4 2-4z"/>']];
  const metrik = o => `<div class="ak-metrik">${METRIK.map(([i, l, t, d]) => `<div title="${t}"><span class="ak-mlabel">${ikon(d, "currentColor")}${l}</span><b>${nol(o[i])}</b></div>`).join("")}</div>`;

  const st = {q: "", prov: new Set(), kampus: new Set(), prodi: "", sumber: "", urut: 4, sektor: new Set(), bidang: "", hal: 1, kJenis: "k", baru: false};
  let baruSet = new Set();
  let semua = [], hasil = [], perK = {}, tunda = 0;
  /* logo kampus: dari data pakar, lalu field logo di kampus.json (dibaca lewat Proxy supaya semua pemakai logoK ikut) */
  const logoK = new Proxy({}, {get: (t, k) => t[k] || (typeof k === "string" ? kampusInfo?.[k]?.logo : undefined)});
  const PROV = {11: "Aceh", 12: "Sumatera Utara", 13: "Sumatera Barat", 14: "Riau", 15: "Jambi", 16: "Sumatera Selatan", 17: "Bengkulu", 18: "Lampung", 19: "Kepulauan Bangka Belitung", 21: "Kepulauan Riau",
    31: "DKI Jakarta", 32: "Jawa Barat", 33: "Jawa Tengah", 34: "DI Yogyakarta", 35: "Jawa Timur", 36: "Banten", 51: "Bali", 52: "Nusa Tenggara Barat", 53: "Nusa Tenggara Timur",
    61: "Kalimantan Barat", 62: "Kalimantan Tengah", 63: "Kalimantan Selatan", 64: "Kalimantan Timur", 65: "Kalimantan Utara", 71: "Sulawesi Utara", 72: "Sulawesi Tengah", 73: "Sulawesi Selatan",
    74: "Sulawesi Tenggara", 75: "Gorontalo", 76: "Sulawesi Barat", 81: "Maluku", 82: "Maluku Utara", 91: "Papua", 92: "Papua Barat", 93: "Papua Selatan", 94: "Papua Tengah", 95: "Papua Pegunungan", 96: "Papua Barat Daya"};
  let kampusInfo = {}, kontak = {}, peta = new Map(), dp = new Set(), tokenS = 0, sibuk = false;
  const DP_KEY = "ak-dp", PERLU_KEY = "ak-dp-perlu";
  const nanti = f => { let s = 0; const go = () => { if (!s++) f(); }; requestAnimationFrame(() => requestAnimationFrame(go)); setTimeout(go, 120); };
  const provK = k => kampusInfo[k]?.prov || null, provO = o => provK(o[2]);
  const provNama = v => PROV[v] || "";
  /* provinsi, kampus, sektor: multi pilih (Set); kosong = semua. "?" = lokasi belum diketahui */
  const cocokProv = o => !st.prov.size || st.prov.has(provO(o) || "?");
  const cocokProvK = k => !st.prov.size || st.prov.has(provK(k) || "?");
  /* tandai centang di daftar pop-up tanpa menggambar ulang (gulir daftar tetap) */
  const tandai = (box, kunci, s) => box.querySelectorAll("button[role=option]").forEach(b => b.setAttribute("aria-selected", String(b.dataset[kunci] ? s.has(b.dataset[kunci]) : !s.size)));
  /* L10: himpunan saringan multi-pilih per tab (lihat msTandai dan seterusnya) */
  const MSG = {}, dalam = (s, v) => !s.size || [].concat(v).some(y => s.has(y));
  const balik = (s, v) => { const t = new Set(v ? s : []); if (v) t.has(v) ? t.delete(v) : t.add(v); return t; };
  const emailOk = e => typeof e === "string" && /^[^\s@<>"']+@[^\s@<>"']+$/.test(e);
  const IKON_PIN = '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>', IKON_MAIL = '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    IKON_TANDA = '<path d="M6 4h12v17l-6-4-6 4z"/>', IKON_WEB = '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>';
  /* email: dari ORCID (kontak.json), kalau tidak ada email resmi kampus; tak ada keduanya = null */
  const emailDari = o => { const a = [].concat(kontak[o[0]]?.email || []).filter(emailOk); if (a.length) return {list: a, sumber: "ORCID"};
    const k = [].concat(kampusInfo[o[2]]?.email || []).filter(emailOk); return k.length ? {list: k, sumber: "Email kampus"} : null; };

  /* foto pakar: foto induk, lalu foto_pakar.json (dimuat malas), jika tidak ada siluet netral (bukan inisial) */
  const FOTO_PAKAR = new Map(); let fotoPakarMuat = false;
  const muatFotoPakar = () => { if (fotoPakarMuat) return; fotoPakarMuat = true; ambilData("foto_pakar").then(d => { if (d && typeof d === "object" && !Array.isArray(d)) for (const [k, v] of Object.entries(d)) if (urlOk(v?.foto_url)) FOTO_PAKAR.set(k.replace(/^https?:\/\/openalex\.org\//, ""), v.foto_url); }); };
  /* avatar inisial: warna deterministik per nama dari 5 pasangan token METI (AA); foto bila ada */
  const ciNama = n => { let h = 0; for (const c of String(n || "")) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 5; };
  const foto = (o, besar) => { const u = o[9] || FOTO_PAKAR.get(o[0]);
    return u ? `<img class="ak-foto${besar ? " besar" : ""}" src="${esc(u)}" alt="" loading="lazy" referrerpolicy="no-referrer" data-inisial="${esc(inisial(o[1]))}" data-ci="${ciNama(o[1])}">` : `<span class="ak-foto ak-ini ak-ci${ciNama(o[1])}${besar ? " besar" : ""}" aria-hidden="true">${esc(inisial(o[1]))}</span>`; };
  /* institusi dulu, prodi (bila ada) sebagai label di bawahnya */
  const sub = o => `<p>${esc(o[2])}</p>${o[11] ? `<span class="ak-prodi">${esc(prodiDari(o))}</span>` : ""}`;
  const logo = o => urlOk(o[14] || logoK[o[2]]) ? `<img class="ak-logo" src="${esc(urlOk(o[14] || logoK[o[2]]))}" alt="Logo ${esc(o[2])}" loading="lazy" referrerpolicy="no-referrer">` : "";
  const sosok = (o, besar) => `<span class="ak-sosok${besar ? " besar" : ""}">${foto(o, besar)}${logo(o)}</span>`;
  const logoKecil = k => denganBintang(urlOk(logoK[k]) ? `<img class="ak-klogo" src="${esc(urlOk(logoK[k]))}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<span class="ak-klogo kosong" aria-hidden="true">${ikon(IK_KAMPUS, "currentColor")}</span>`, "K:" + k);

  /* kartu: foto bulat berlogo kampus dan nama; di bawahnya label yang bisa diklik
     untuk menyaring (institusi, prodi, sektor), lalu metrik. Kartu = div berperan tombol supaya label di dalamnya boleh jadi tombol. */
  /* F: teks sumber wiki ("== Judul ==", [[a|b]], {{...}}, <ref>) dibersihkan di satu tempat */
  const bersihWiki = t => String(t ?? "").replace(/<ref[^>]*>.*?<\/ref>|<ref[^>]*\/>/gis, " ").replace(/\{\{[^{}]*\}\}/g, " ").replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1").replace(/'{2,}/g, "").replace(/<[^>]+>/g, " ").replace(/=+\s*[^=\n]*?\s*=+/g, " ").replace(/=+/g, " ").replace(/^\s*waktu baca\s*\d+\s*menit\s*/i, "").replace(/^[^.\n]{2,60}\((?:antara|kompas|detik|cnn|tempo|liputan6|republika|kumparan|[^)]{2,25})\)\s*[-\u2013\u2014]\s*/i, "").replace(/\s*(\.{3}|…)\s*$/, "").replace(/\s+/g, " ").trim();
  /* C: tag (prodi, subjek, bidang) huruf kalimat; HURUF BESAR SEMUA diturunkan, singkatan <=5 huruf tanpa vokal atau yang dikenal tetap */
  const SINGKATAN = /^(GIS|SIG|ITB|UGM|IPB|UI|UNS|ITS|UIN|II|III|IV|S\d|D\d|IT|AI)$/;
  const KECIL_TAG = new Set(["dan", "di", "dari", "untuk", "ke", "pada", "dengan", "atau", "yang"]);
  const tagKal = t => { t = String(t ?? "").replace(/\s+/g, " ").trim(); if (!t || /\p{Ll}/u.test(t)) return t;
    return t.split(" ").map((w, i) => { const b = w.replace(/[^\p{L}\d]/gu, ""); if (SINGKATAN.test(b) || (b.length <= 5 && !/[AIUEO]/.test(b) && b.length > 1)) return w; const k = w.toLowerCase(); return i && KECIL_TAG.has(k) ? k : k.replace(/\p{L}/u, c => c.toUpperCase()); }).join(" "); };
  /* daftar pil tag: urut menurun, maks 12 lalu "+n lainnya", hitungan di pil abu kecil */
  const pilTags = (rows, maks = 12) => { const a = rows.map(r => Array.isArray(r) ? r : [r]).filter(r => r[0]); if (a.some(r => r[1] != null)) a.sort((x, y) => (y[1] || 0) - (x[1] || 0));
    return a.slice(0, maks).map(([t, n]) => `<span class="ak-lbl-prodi">${esc(tagKal(t))}${n != null ? `<small class="ak-tn">${angka(n)}</small>` : ""}</span>`).join("") + (a.length > maks ? `<span class="ak-r">+${angka(a.length - maks)} lainnya</span>` : ""); };
  const prodiDari = o => o[11] ? tagKal(o[11].replace(/\s*\((S\d|D\d|Sp-?\d)\)$/, "")) : "";
  let AF = null;
  const afOk = id => dlist(AF?.[id]).filter(a => a && a.nama_lembaga);
  function muatAfiliasi() { ambilData("afiliasi").then(d => { if (!d || typeof d !== "object" || Array.isArray(d)) return; AF = d; semua.forEach(o => { const a = afOk(o[0]); if (a.length) o._cari += " " + a.map(x => x.nama_lembaga).join(" ").toLowerCase(); }); gambar(false); }); }
  const IK_JUGA = '<path d="M3 21h18M5 21V8l7-4 7 4v13M9 12h.01M15 12h.01M9 16h.01M15 16h.01"/>';
  /* afiliasi lain: satu baris teks kecil "Juga di: AGU, IABI +2", bukan pil navy besar */
  const afPil = o => { const k = nrm(o[2]), a = afOk(o[0]).filter(x => nrm(x.nama_lembaga) !== k); if (!a.length) return "";
    const pendek = x => x.singkatan || (x.nama_lembaga.length > 22 ? "" : x.nama_lembaga) || x.nama_lembaga;
    return `<small class="ak-juga" title="${esc(a.map(x => x.nama_lembaga).join(", "))}">${ikon(IK_JUGA, "currentColor")}<span>Juga di:</span> ${a.slice(0, 2).map(x => x.lembaga_id ? `<button type="button" data-lb="${esc(x.lembaga_id)}" title="Profil ${esc(x.nama_lembaga)}">${esc(pendek(x))}</button>` : `<button type="button" data-fq="${esc(x.nama_lembaga)}" title="Saring pakar berafiliasi ${esc(x.nama_lembaga)}">${esc(pendek(x))}</button>`).join(", ")}${a.length > 2 ? ` <b>+${a.length - 2}</b>` : ""}</small>`; };
  const kartu = (o, i) => { const prodi = prodiDari(o);
    return `<div class="ak-orang" role="button" tabindex="0" data-i="${i}" aria-label="Buka profil ${esc(o[1])}">
      <label class="ak-pilih" title="Tambah ke daftar pendek"><input type="checkbox" data-dp="${esc(o[0])}" aria-label="Tambah ${esc(o[1])} ke daftar pendek"${dp.has(o[0]) ? " checked" : ""}><span class="ak-cek"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg></span></label>
      <span class="ak-atas">${sosok(o)}<span class="ak-nama"><h3>${esc(o[1])}</h3>${o[13] === "s" || o[15] === "diaspora" || baruSet.has(o[0]) ? `<span class="ak-lencana">${baruSet.has(o[0]) ? `<em class="ak-l-baru">Baru</em>` : ""}${o[13] === "s" ? `<em class="ak-l-sinta">SINTA</em>` : ""}${o[15] === "diaspora" ? (DIA.get(o[0]) ? `<em class="ak-l-negara" title="Berkarya di luar negeri">${esc(bendera(DIA.get(o[0])))} ${esc(NEGARA_NAMA[DIA.get(o[0])] || DIA.get(o[0]))}</em>` : "") : ""}</span>` : ""}</span></span>
      <span class="ak-kartu-label">
        <button type="button" class="ak-lbl-inst" data-kp="${esc(o[2])}" title="Profil kampus ${esc(o[2])}">${esc(o[2])}</button>
        ${prodi ? `<button type="button" class="ak-lbl-prodi" data-fk="prodi" data-v="${esc(prodi)}" title="Saring program studi ini">${esc(prodi)}</button>` : ""}
      </span>
      ${afPil(o)}<span class="ak-pil">${o[3].slice(0, 3).map((r, j) => `<button type="button" class="ak-r${j === 0 ? " utama" : ""}" data-fk="sektor" data-v="${esc(r)}" data-st="--w0:${(SEKTOR[r] || [])[2] || "var(--ink2)"}">${(SEKTOR[r] || [])[1] ? ikon(SEKTOR[r][1], SEKTOR[r][2]) : ""}${esc((SEKTOR[r] || [r])[0])}</button>`).join("")}${o[3].length > 3 ? `<span class="ak-r">+${o[3].length - 3}</span>` : ""}</span>
      ${metrik(o)}
    </div>`; };

  /* kolom 16 "asing" (perbarui.py: karier mayoritas di luar negeri): keluar dari daftar, tetap ketemu lewat cari nama */
  const asing = o => o[15] === "asing";
  function saring() {
    const q = st.q.toLowerCase();
    hasil = semua.filter(o => cocokProv(o) && (!st.sektor.size || o[3].some(r => st.sektor.has(r))) && (!st.bidang || o[3].includes(st.bidang)) && (!st.kampus.size || st.kampus.has(o[2])) && (!st.prodi || prodiDari(o) === st.prodi)
      && (!st.baru || baruSet.has(o[0])) && (st.sumber === "d" ? o[15] === "diaspora" : (q || st.baru || (st.sumber === "s" ? o[13] === "s" : !asing(o) && (st.sumber === "" || o[13] !== "x")))) && (!q || o._cari.includes(q)));   // cari nama = semua sumber
    const u = st.urut;
    hasil.sort(u === 1 ? (a, b) => a[1].localeCompare(b[1], "id") : (a, b) => b[u] - a[u] || b[4] - a[4]);
    st.hal = 1;
    chromeSaring();
    gambar(false);
  }
  /* chrome filter (chip, label tombol) diperbarui seketika di jalur klik; saring() yang berat lewat nanti */
  function chromeSaring() {
    $("akBd")?._label?.();
    $("akPIsi").innerHTML = `<em>${esc(st.prodi || "Semua program studi")}</em>`;
  }

  function gambar(gulir) {
    const nHal = Math.max(1, Math.ceil(hasil.length / PER_HAL)), a = (st.hal - 1) * PER_HAL;
    $("akDaftar").innerHTML = hasil.slice(a, a + PER_HAL).map((o, j) => kartu(o, a + j)).join("");
    $("akHampa").hidden = hasil.length > 0;
    $("akHal").innerHTML = navHal(st.hal, hasil.length, PER_HAL, "pakar");
    if (gulir) document.querySelector(".ak-hasil").scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start"});
  }

  /* ---------- pemilih kampus dan lembaga ---------- */
  function daftarKampus() {
    const q = $("akKQ").value.trim().toLowerCase();
    const isi = Object.entries(perK).filter(([k]) => jenisK(k) === st.kJenis && cocokProvK(k) && (!q || k.toLowerCase().includes(q))).sort((a, b) => b[1] - a[1]);
    const semuaBtn = `<button type="button" role="option" data-k="" aria-selected="${!st.kampus.size}"><span>${st.kJenis === "k" ? "Semua universitas dan kampus" : "Semua lembaga"}</span></button>`;
    $("akKDaftar").innerHTML = (q ? "" : semuaBtn) + (isi.length ? isi.slice(0, 300).map(([k, n]) =>
      `<button type="button" role="option" data-k="${esc(k)}" aria-selected="${st.kampus.has(k)}">${logoKecil(k)}<span>${esc(k)}</span><small>${angka(n)}</small></button>`).join("")
      : `<p>Tidak ada ${st.kJenis === "k" ? "kampus" : "lembaga"} bernama itu.</p>`);
    document.querySelectorAll("#akKJenis button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.j === st.kJenis)));
  }
  function bukaKampus(buka) {
    $("akKPop").hidden = !buka; $("akKBtn").setAttribute("aria-expanded", String(buka));
    if (buka) { $("akKQ").value = ""; daftarKampus(); $("akKQ").focus(); }
  }
  const lepasProdi = () => { if (st.prodi && !semua.some(o => cocokProv(o) && (!st.kampus.size || st.kampus.has(o[2])) && prodiDari(o) === st.prodi)) st.prodi = ""; };   // prodi yang tidak ada di pilihan ini dilepas
  const isiKampus = () => { const n = st.kampus.size, k = [...st.kampus][0];
    $("akKIsi").innerHTML = !n ? "<em>Semua kampus dan lembaga</em>" : n === 1 ? `${logoKecil(k)}<em>${esc(k)}</em>` : `<em>${angka(n)} kampus dan lembaga</em>`; };
  function aturKampus(s) { st.kampus = s; lepasProdi(); isiKampus(); saring(); }
  function pilihKampus(k) { aturKampus(new Set(k ? [k] : [])); bukaKampus(false); }

  /* ---------- pemilih provinsi: lewat kampus.json; tanpa data = disembunyikan ---------- */
  function daftarProv() {
    const q = $("akVQ").value.trim().toLowerCase(), n = {};
    semua.forEach(o => { const v = provO(o) || "?"; n[v] = (n[v] || 0) + 1; });
    const isi = Object.entries(n).filter(([v]) => v !== "?" && (!q || provNama(v).toLowerCase().includes(q))).sort((a, b) => b[1] - a[1]);
    const btn = (v, t, c) => `<button type="button" role="option" data-v="${v}" aria-selected="${v ? st.prov.has(v) : !st.prov.size}">${/^\d{2}$/.test(v) ? lambangHtml(lambangUrl(v, ""), 22) : ""}<span>${esc(t)}</span>${c != null ? `<small>${angka(c)}</small>` : ""}</button>`;
    $("akVDaftar").innerHTML = (q ? "" : btn("", "Semua provinsi")) + isi.map(([v, c]) => btn(v, provNama(v) || v, c)).join("")
      + (n["?"] && (!q || "lokasi belum diketahui".includes(q)) ? btn("?", "Lokasi belum diketahui", n["?"]) : "") + (!isi.length && q ? "<p>Tidak ada provinsi bernama itu.</p>" : "");
  }
  function bukaProv(buka) {
    $("akVPop").hidden = !buka; $("akVBtn").setAttribute("aria-expanded", String(buka));
    if (buka) { $("akVQ").value = ""; daftarProv(); $("akVQ").focus(); }
  }
  const labelProv = v => v === "?" ? "Lokasi belum diketahui" : v ? provNama(v) || v : "Semua provinsi";
  const isiProv = () => { const s = [...st.prov]; $("akVIsi").innerHTML = `<em>${esc(s.length > 1 ? `${angka(s.length)} provinsi` : labelProv(s[0] || ""))}</em>`; };
  function aturProv(s) {
    st.prov = s; isiProv();
    const kp = new Set([...st.kampus].filter(cocokProvK)); if (kp.size !== st.kampus.size) { st.kampus = kp; isiKampus(); }   // kampus di luar provinsi terpilih dilepas
    lepasProdi(); saring();
  }
  function pilihProv(v) { aturProv(new Set(v ? [v] : [])); bukaProv(false); }

  /* ---------- pemilih program studi: daftar ikut kampus terpilih ---------- */
  function daftarProdi() {
    const q = $("akPQ").value.trim().toLowerCase(), n = {};
    semua.forEach(o => { const p = prodiDari(o); if (p && cocokProv(o) && (!st.kampus.size || st.kampus.has(o[2]))) n[p] = (n[p] || 0) + 1; });
    const isi = Object.entries(n).filter(([p]) => !q || p.toLowerCase().includes(q)).sort((a, b) => b[1] - a[1]);
    $("akPDaftar").innerHTML = (q ? "" : `<button type="button" role="option" data-p="" aria-selected="${!st.prodi}"><span>Semua program studi</span></button>`)
      + (isi.length ? isi.slice(0, 300).map(([p, c]) => `<button type="button" role="option" data-p="${esc(p)}" aria-selected="${p === st.prodi}"><span>${esc(p)}</span><small>${angka(c)}</small></button>`).join("")
      : `<p>Tidak ada program studi bernama itu.</p>`);
  }
  function bukaProdi(buka) {
    $("akPPop").hidden = !buka; $("akPBtn").setAttribute("aria-expanded", String(buka));
    if (buka) { $("akPQ").value = ""; daftarProdi(); $("akPQ").focus(); }
  }

  /* ---------- lembar detail ---------- */
  /* karya paling banyak dikutip dari OpenAlex lewat worker (kunci API di secret); gagal = bagian tetap tersembunyi */
  let karyaId = "";
  /* grafik area per tahun, SVG tulisan tangan: kurva halus (Catmull-Rom), angka di atas tiap titik, sumbu tahun di bawah */
  function grafik(seri, judul, warna) {
    const per = new Map(seri.map(([t, v]) => [+t, v])), th = [...per.keys()];   // tahun tanpa data diisi nol supaya sumbu berurutan
    seri = th.length ? Array.from({length: Math.max(...th) - Math.min(...th) + 1}, (_, i) => [Math.min(...th) + i, per.get(Math.min(...th) + i) ?? 0]) : seri;
    seri = seri.slice(Math.max(0, seri.findIndex(x => x[1] > 0)));   // tahun nol di awal dipangkas
    const W = 940, H = 190, kiri = 14, kanan = 14, atas = 28, bawah = 26, n = seri.length, maks = Math.max(1, ...seri.map(x => x[1]));
    const X = i => kiri + (n === 1 ? (W - kiri - kanan) / 2 : i * (W - kiri - kanan) / (n - 1)), Y = v => atas + (1 - v / maks) * (H - atas - bawah);
    const t = seri.map(([th, v], i) => [X(i), Y(v)]), dasar = H - bawah;
    /* kurva monoton (Fritsch-Carlson): tidak menembus di bawah nol atau di atas puncak antara dua titik */
    const dx = t.slice(1).map((p, i) => p[0] - t[i][0]), m = t.slice(1).map((p, i) => (p[1] - t[i][1]) / dx[i]);
    const tg = t.map((_, i) => i === 0 ? m[0] : i === n - 1 ? m[n - 2] : m[i - 1] * m[i] <= 0 ? 0 : 3 * (dx[i - 1] + dx[i]) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]));
    let d = `M${t[0][0]},${t[0][1]}`;
    for (let i = 0; i < n - 1; i++) d += ` C${t[i][0] + dx[i] / 3},${t[i][1] + (tg[i] || 0) * dx[i] / 3} ${t[i + 1][0] - dx[i] / 3},${t[i + 1][1] - (tg[i + 1] || 0) * dx[i] / 3} ${t[i + 1][0]},${t[i + 1][1]}`;
    /* label: tahun paling banyak ~14, angka di titik bertanda (tiap langkah, puncak, terakhir) */
    const langkah = Math.max(1, Math.ceil(n / 14)), iMaks = seri.findIndex(x => x[1] === maks), tandai = i => i % langkah === 0 || i === n - 1 || i === iMaks;
    const satuan = judul.startsWith("Sitasi") ? "sitasi" : judul.startsWith("Artikel") ? "artikel" : "karya";
    const g = "g" + Math.random().toString(36).slice(2, 8);
    const lebar = n === 1 ? W : (W - kiri - kanan) / (n - 1);
    return `<figure class="ak-grafik" data-seri="${esc(JSON.stringify(seri.map(([th, v], i) => [th, v, t[i][0], t[i][1]])))}" data-w="${W}" data-h="${H}" data-st="--gw:${warna}"><figcaption>${judul}</figcaption><div class="ak-gcap"><em>${seri[0][0]} sampai ${seri[n - 1][0]}</em><span>Puncak ${seri[iMaks][0]}: <b>${angka(maks)}</b> ${satuan}</span></div><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${judul}">
      <defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${warna}" stop-opacity=".26"/><stop offset="1" stop-color="${warna}" stop-opacity="0"/></linearGradient></defs>
      ${[.5, 1].map(f => `<line x1="${kiri}" x2="${W - kanan}" y1="${Y(maks * f)}" y2="${Y(maks * f)}" class="ak-gr-garis"/>`).join("")}
      <line x1="${kiri}" x2="${W - kanan}" y1="${dasar}" y2="${dasar}" class="ak-gr-dasar"/>
      <path d="${d} L${t[n - 1][0]},${dasar} L${t[0][0]},${dasar}Z" fill="url(#${g})"/><path d="${d}" fill="none" stroke="${warna}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      <line class="ak-gr-bantu" x1="0" x2="0" y1="${atas - 8}" y2="${dasar}"/><circle class="ak-gr-sorot" r="5.5" cx="0" cy="0" fill="${warna}" stroke="var(--card)" stroke-width="2.5"/>
      ${t.map(([x, y], i) => tandai(i) ? `<circle cx="${x}" cy="${y}" r="3.4" fill="var(--card)" stroke="${warna}" stroke-width="2"/><text x="${x}" y="${y - 10}" class="ak-gr-nilai" data-st="fill:${warna}">${angka(seri[i][1])}</text><text x="${x}" y="${H - 6}" class="ak-gr-tahun">${seri[i][0]}</text>` : "").join("")}
      ${t.map(([x], i) => `<rect class="ak-gr-hit" data-i="${i}" x="${x - lebar / 2}" y="0" width="${lebar}" height="${H}"/>`).join("")}
    </svg><div class="ak-gr-tip" hidden></div></figure>`;
  }
  /* sorot grafik: tahun terdekat dengan penunjuk mendapat garis bantu, titik, dan tooltip; keluar = sembunyi */
  function sorotGrafik(e) {
    const r = e.target.closest?.(".ak-gr-hit"), fig = e.target.closest?.(".ak-grafik");
    if (!fig) return;
    if (!r) { fig.classList.remove("aktif"); fig.querySelector(".ak-gr-tip").hidden = true; return; }
    const seri = fig._seri || (fig._seri = JSON.parse(fig.dataset.seri)), [th, v, x, y] = seri[+r.dataset.i], prev = seri[+r.dataset.i - 1];
    const bantu = fig.querySelector(".ak-gr-bantu"), sorot = fig.querySelector(".ak-gr-sorot"), tip = fig.querySelector(".ak-gr-tip");
    bantu.setAttribute("x1", x); bantu.setAttribute("x2", x); sorot.setAttribute("cx", x); sorot.setAttribute("cy", y);
    const beda = prev ? v - prev[1] : null;
    tip.innerHTML = `<b>${th}</b><span><i></i>${angka(v)}</span>${beda != null ? `<small class="${beda > 0 ? "naik" : beda < 0 ? "turun" : ""}">${beda > 0 ? "▲" : beda < 0 ? "▼" : "="} ${angka(Math.abs(beda))} dari ${prev[0]}</small>` : ""}`;
    const svg = fig.querySelector("svg").getBoundingClientRect(), fb = fig.getBoundingClientRect(), k = svg.width / +fig.dataset.w;
    tip.hidden = false; fig.classList.add("aktif");
    const px = svg.left - fb.left + x * k, py = svg.top - fb.top + y * k, tw = tip.offsetWidth;
    tip.style.left = Math.min(Math.max(px - tw / 2, 6), fb.width - tw - 6) + "px"; tip.style.top = (py - tip.offsetHeight - 14) + "px";
  }

  /* rincian SINTA (panen): tabel Scopus vs GScholar, grafik Scopus per tahun, artikel berkuartil, ringkasan dari data bersumber */
  async function rinciSinta(o) {
    let x; try { const r = await fetch("/api/direktori/sinta/" + encodeURIComponent(o[10]), {credentials: "same-origin"}); if (!r.ok) return; x = await r.json(); } catch (e) { return; }
    if (karyaId !== o[0]) return;
    const tglS = x.diperiksa || x.tanggal || x.diambil || "", kakiS = el => { if (tglS && el && !el.querySelector(".ak-lkaki-s")) el.querySelector(".ak-disi, div")?.insertAdjacentHTML("beforeend", `<p class="ak-lkaki-s">Sumber: SINTA dan Scopus, diperiksa ${esc(tglID(tglS))}</p>`); };
    const T = x.tabel || {}, BARIS = [["Article", "Artikel"], ["Citation", "Sitasi"], ["Cited Document", "Dokumen dikutip"], ["H-Index", "h-index"], ["i10-Index", "i10-index"], ["G-Index", "G-index"]];
    const ada = BARIS.filter(([k]) => T[k]);
    if (ada.length) {
      const skor = x.skor?.["SINTA Score Overall"];
      $("akMetrik").querySelector("div").innerHTML = `<table class="jm-tabel ak-tabel"><thead><tr><th></th><th><em class="sc">Scopus</em></th><th><em class="gs">Google Scholar</em></th></tr></thead>
        <tbody>${ada.map(([k, l]) => `<tr><td>${l}</td><td>${angka(T[k][0] ?? 0)}</td><td>${angka(T[k][1] ?? 0)}</td></tr>`).join("")}</tbody></table>
        ${skor != null ? `<div class="ak-skor"><div><b>${angka(skor)}</b><span>Skor SINTA</span></div>${x.skor?.["SINTA Score 3Yr"] != null ? `<div><b>${angka(x.skor["SINTA Score 3Yr"])}</b><span>Skor SINTA 3 tahun</span></div>` : ""}</div>` : ""}`;
      $("akMetrik").hidden = false; kakiS($("akMetrik"));
    }
    const sc = x.grafik?.["scopus-chart-articles"];
    if (sc?.length > 1) {
      const gr = $("akTahunan"), lama = gr.querySelector(".ak-grafik2");
      lama.insertAdjacentHTML("afterbegin", grafik(sc.map(([t, v]) => [t, v]), "Artikel Scopus per tahun", "var(--meti-oranye)"));
      lama.querySelectorAll(".ak-grafik").forEach(f => { if (f.querySelector("figcaption").textContent === "Karya terbit per tahun") f.remove(); });
      gr.hidden = false; kakiS(gr);
    }
    if (x.artikel?.length) {
      const IKJ = '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>';
      $("akScopus").querySelector("ol").innerHTML = x.artikel.map(k => { const u = (k.urutan || "").match(/(\d+) of (\d+)/);
        return barisKarya({...k, q: (k.kuartil || "").match(/^Q(\d)/)?.[1], jenis: /Conference/i.test(k.kuartil || "") ? "Prosiding" : /Journal/i.test(k.kuartil || "") ? "Jurnal" : /Book/i.test(k.kuartil || "") ? "Buku" : "",
          urutan: u && +u[1] > 0 ? u[1] : null, jumlah_penulis: u?.[2]}); }).join("");
      $("akScopus").hidden = false; kakiS($("akScopus"));
    }
    /* ringkasan: hanya merangkai fakta yang ada di data, tanpa klaim tambahan */
    const kal = [`${o[1]} tercatat di ${o[2]}${x.prodi ? `, ${x.prodi.replace(/^(S\d|D\d|Sp-?\d) - (.*)$/, "program studi $2 ($1)")}` : ""}.`];
    if (x.subjek?.length) kal.push(`Bidang yang dicantumkan di SINTA: ${x.subjek.join(", ")}.`);
    if (T.Article) kal.push(`Tercatat ${angka(T.Article[0] ?? 0)} artikel di Scopus dengan h-index ${angka(T["H-Index"]?.[0] ?? 0)} dan ${angka(T.Article[1] ?? 0)} karya di Google Scholar dengan h-index ${angka(T["H-Index"]?.[1] ?? 0)}.`);
    const q1 = (x.artikel || []).filter(k => /^Q1/.test(k.kuartil || "")).length;
    if (x.artikel?.length) kal.push(`${q1 ? `${q1} dari ${x.artikel.length} artikel Scopus terbarunya terbit di jurnal Q1. ` : ""}Artikel terbaru terbit di ${x.artikel[0].terbitan || "jurnal bereputasi"} (${x.artikel[0].tahun}).`);
    $("akRingkas").querySelector("p").textContent = kal.join(" ");
    $("akRingkas").hidden = false;
  }
  /* navigasi halaman bersama: daftar pakar dan daftar karya memakai bentuk yang sama */
  function navHal(hal, total, per, benda) {
    const nHal = Math.max(1, Math.ceil(total / per)), a = (hal - 1) * per;
    if (!total) return "";
    const awal = Math.max(1, Math.min(hal - 2, nHal - 4)), jendela = Array.from({length: Math.min(5, nHal)}, (_, i) => awal + i);
    const nomor = [...new Set([...(awal > 1 ? [1] : []), ...jendela, ...(awal + 4 < nHal ? [nHal] : [])])];
    let isi = `<button type="button" class="ak-hal-arah" data-h="${hal - 1}" ${hal === 1 ? "disabled" : ""}>‹ Sebelumnya</button>`, prev = 0;
    for (const n of nomor) { if (n - prev > 1) isi += "<span>…</span>"; isi += `<button type="button" data-h="${n}"${n === hal ? ' aria-current="page"' : ""}>${angka(n)}</button>`; prev = n; }
    isi += `<button type="button" class="ak-hal-arah" data-h="${hal + 1}" ${hal === nHal ? "disabled" : ""}>Berikutnya ›</button>`;
    return `<p><b>${angka(total)}</b> ${benda}<span>menampilkan ${angka(a + 1)}–${angka(Math.min(a + per, total))}</span></p>${nHal > 1 ? `<div>${isi}</div>` : ""}`;
  }
  const IKJ = '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>';
  const IKL = {jenis: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/>', orang: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/>',
    tahun: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>', kuartil: '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>'};
  /* satu baris karya (OpenAlex atau Scopus): judul + label berikon di kiri, kutipan di kolom kanan */
  const barisKarya = k => `<li><a href="${esc(k.url)}" ${LUAR}><span class="ak-kisi"><b>${esc(rapiJudul(k.judul))}</b>
      <span class="ak-klabel">${k.q ? `<em class="q q${k.q}">${ikon(IKL.kuartil, "var(--on-brand)")}Q${k.q}</em>` : ""}${k.jenis ? `<em class="j">${ikon(IKL.jenis, "var(--on-brand)")}${esc(k.jenis)}</em>` : ""}${k.terbitan ? `<em class="t" title="${esc(rapiJurnal(k.terbitan))}">${ikon(IKJ, "currentColor")}<span>${esc(rapiJurnal(k.terbitan))}</span></em>` : ""}${k.urutan ? `<em>${ikon(IKL.orang, "currentColor")}Penulis ke-${k.urutan} dari ${k.jumlah_penulis}</em>` : ""}${k.tahun ? `<em>${ikon(IKL.tahun, "currentColor")}${k.tahun}</em>` : ""}</span></span>
      <span class="ak-kangka"><b>${angka(k.sitasi ?? 0)}</b><small>kutipan</small></span></a></li>`;
  const kst = {hal: 1, urut: "sitasi", jenis: "", cari: ""};
  /* analisa keahlian (permintaan pemilik 2 Nov 2026): sampai 200 karya terbaru dari OpenAlex, disimpulkan analisaKeahlian() (fungsi_direktori.js, aturan kata kunci).
     Tiap label bisa diklik untuk melihat karya buktinya; label otomatis, bukan penilaian. */
  const KH_BARIS = [["jenis", "Sektor"], ["fase", "Tahap"], ["wilayah", "Wilayah kajian"]];
  let khData = null;
  async function keahlian(o) {
    khData = null;
    let j; try { const r = await fetch(`/api/direktori/keahlian/${encodeURIComponent(o[0])}`, {credentials: "same-origin"}); if (!r.ok) return; j = await r.json(); } catch (e) { return; }
    const sek = $("akKeahlian"); if (karyaId !== o[0] || !sek) return;
    const ks = dlist(j.results).filter(w => !/^(dataset|paratext|erratum|retraction|peer-review)$/.test(w.type || "")).map(w => ({id: String(w.id || "").split("/").pop(), judul: w.title, tahun: w.publication_year, topik: dlist(w.topics).map(t => t.display_name), kunci: dlist(w.keywords).map(k => k.display_name)}));
    const h = window.analisaKeahlian(ks); if (!KH_BARIS.some(([k]) => h[k].length)) return;
    khData = h;
    const pil = (k, e) => k === "jenis" && SEKTOR[e.kunci] ? pilSektor(e.kunci).replace("<span", `<button type="button" data-kh="${k}|${esc(e.kunci)}" aria-pressed="false"`).replace(/<\/span>$/, ` <small>${angka(e.n)}</small></button>`)
      : `<button type="button" class="ak-r" data-kh="${k}|${esc(e.kunci)}" aria-pressed="false">${esc(kapital(e.label))} <small>${angka(e.n)}</small></button>`;
    const nmJ = k => (SEKTOR[k] || [kapital(k)])[0], tren = h.tren && h.tren.dulu.jenis.length && h.tren.kini.jenis.length
      ? `<div class="ak-kh-baris"><span class="ak-kh-lbl">Tren</span><p class="ak-kh-tren">${(() => { const d = h.tren.dulu.jenis.map(x => nmJ(x.kunci)).join(", "), k = h.tren.kini.jenis.map(x => nmJ(x.kunci)).join(", ");
        return d === k ? `Tetap di <b>${esc(k)}</b> pada ${h.tren.dulu.dari}–${h.tren.kini.sampai}` : `${h.tren.dulu.dari}–${h.tren.dulu.sampai}: <b>${esc(d)}</b><br>${h.tren.kini.dari}–${h.tren.kini.sampai}: <b>${esc(k)}</b>`; })()}</p></div>` : "";
    sek.querySelector(".ak-disi").innerHTML = `${KH_BARIS.filter(([k]) => h[k].length).map(([k, l]) => `<div class="ak-kh-baris"><span class="ak-kh-lbl">${l}</span><div class="ak-pil">${h[k].slice(0, 8).map(e => pil(k, e)).join("")}</div></div>`).join("")}${tren}
      <ol class="ak-karya ak-kh-bukti" hidden></ol>
      <small class="ak-lper">Label otomatis dari judul, topik, dan kata kunci ${angka(h.karya)} karya terbaru di OpenAlex; angka = jumlah karya yang cocok dengan label. Klik label untuk melihat karya buktinya.</small>`;
    sek.hidden = false;
    sek.querySelector(".ak-disi").onclick = e => { const b = e.target.closest("button[data-kh]"); if (!b) return;
      const [k, kunci] = b.dataset.kh.split("|"), on = b.getAttribute("aria-pressed") !== "true", ol = sek.querySelector(".ak-kh-bukti");
      sek.querySelectorAll("button[data-kh]").forEach(x => x.setAttribute("aria-pressed", String(x === b && on)));
      const e2 = on && khData[k].find(x => x.kunci === kunci);
      ol.innerHTML = e2 ? e2.bukti.map(x => `<li><a href="https://openalex.org/${esc(x.id)}" ${LUAR}><span class="ak-kisi"><b>${esc(rapiJudul(x.judul))}</b></span><span class="ak-kangka"><b>${esc(String(x.tahun || ""))}</b></span></a></li>`).join("") : "";
      ol.hidden = !e2; };
  }
  let karyaTunda = 0;
  /* ORCID publik: tautan muncul, riwayat pendidikan dan pekerjaan sebagai lini masa, biografi apa adanya (berlabel sumbernya) */
  function orcid(x, id) {
    $("akTautan").insertAdjacentHTML("beforeend", `<a href="https://orcid.org/${esc(id)}" ${LUAR}>ORCID${ikon('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>', "currentColor")}</a>`);
    /* linimasa: kartu per jenis berikon; tahun sebagai pil di kolom kiri, peran tebal, unit dan institusi di bawahnya; jabatan berjalan bertitik penuh */
    const IKG = {p: '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c2 2 10 2 12 0v-5M22 9v6"/>', k: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>'};
    const garis = (l, judul, j) => l.length ? `<div class="ak-garis ak-garis-${j}"><h4><svg viewBox="0 0 24 24" aria-hidden="true">${IKG[j]}</svg>${judul}<small>${l.length}</small></h4><ol>${l.map(r => { const kini = r.mulai && !r.selesai && j === "k";
      return `<li${kini ? ' class="kini"' : ""}><span class="ak-gthn">${r.mulai || "-"}${r.selesai ? `–${r.selesai}` : kini ? "–kini" : ""}</span><div><b>${esc(r.peran || r.unit || r.institusi)}</b><small>${esc([r.peran || r.unit ? r.unit : "", r.institusi].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", "))}</small></div></li>`; }).join("")}</ol></div>` : "";
    const isi = (x.biografi ? `<p class="ak-bio">${esc(x.biografi)}</p>` : "") + `<div class="ak-garis2">${garis(x.pendidikan, "Pendidikan", "p")}${garis(x.pekerjaan, "Pekerjaan dan jabatan", "k")}</div>`;
    if (!x.biografi && !x.pendidikan.length && !x.pekerjaan.length) return;
    const sek = $("akOrcid"); sek.querySelector(".ak-disi").innerHTML = isi; sek.hidden = false;
  }
  async function karya(o, awal = true) {
    karyaId = o[0];
    if (awal) Object.assign(kst, {hal: 1, urut: "sitasi", jenis: "", cari: ""});
    const q = new URLSearchParams({hal: kst.hal, urut: kst.urut, ...(kst.jenis && {jenis: kst.jenis}), ...(kst.cari && {cari: kst.cari}), ...(awal && o[7] && {orcid: o[7]})});
    const sek = $("akKarya"); if (!awal && sek) sek.querySelector("ol").style.opacity = ".5";
    let j; try { const r = await fetch(`/api/direktori/karya/${encodeURIComponent(o[0])}?${q}`, {credentials: "same-origin"}); if (!r.ok) return; j = await r.json(); } catch (e) { return; }
    if (karyaId !== o[0] || !sek) return;
    const gr = $("akTahunan");
    if (awal && gr && j.tahunan?.length > 1) {
      const box = gr.querySelector("div"), adaScopus = [...box.querySelectorAll("figcaption")].some(f => f.textContent.startsWith("Artikel Scopus per tahun"));   // SINTA lebih panjang: menang
      box.insertAdjacentHTML("beforeend", (adaScopus ? "" : grafik(j.tahunan.map(x => [x[0], x[1]]), "Karya terbit per tahun", "var(--meti-oranye)")) + grafik(j.tahunan.map(x => [x[0], x[2]]), "Sitasi per tahun", "var(--data2)"));
      gr.hidden = false;
    }
    if (awal && j.orcid?.publik) orcid(j.orcid, o[7]);
    if (awal && !j.karya?.length) return;
    const ol = sek.querySelector("ol"); ol.style.opacity = "";
    ol.innerHTML = j.karya.length ? j.karya.map(barisKarya).join("") : `<li class="ak-khampa">Tidak ada karya yang cocok.</li>`;
    $("akKHal").innerHTML = navHal(j.hal || kst.hal, Math.min(j.jumlah || 0, 50 * (j.per_hal || 8)), j.per_hal || 8, "karya");
    sek.hidden = false;
    if (awal) {   // pasang kendali saringan sekali per lembar
      sek.querySelector(".ak-ksaring").addEventListener("click", e => { const b = e.target.closest("button[data-k]"); if (!b) return;
        kst[b.dataset.k] = b.dataset.v; kst.hal = 1; b.parentElement.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); karya(o, false); });
      sek.querySelector("input").addEventListener("input", e => { clearTimeout(karyaTunda); karyaTunda = setTimeout(() => { kst.cari = e.target.value.trim(); kst.hal = 1; karya(o, false); }, 350); });
      $("akKHal").addEventListener("click", e => { const b = e.target.closest("button[data-h]"); if (!b || b.disabled) return; kst.hal = +b.dataset.h; karya(o, false); sek.scrollIntoView({block: "start", behavior: "smooth"}); });
    }
  }

  const dpTombol = id => `<button type="button" data-dp-t="${esc(id)}" aria-pressed="${dp.has(id)}" class="ak-dptog ak-ib" title="${dp.has(id) ? "Ada di daftar pendek" : "Tambah ke daftar pendek"}" aria-label="${dp.has(id) ? "Ada di daftar pendek" : "Tambah ke daftar pendek"}">${ikon(IKON_TANDA, "currentColor")}</button>`;
  const kontakHtml = o => { const e = emailDari(o), ms = typeof medsosPasang === "function" ? medsosPasang(kontak[o[0]] || {}) : ""; if (!e && !ms) return "";
    return (e ? `<div class="ak-kontak">${ikon(IKON_MAIL, "currentColor")}${e.list.map(m => `<a href="mailto:${esc(m)}">${esc(m)}</a>`).join("")}<em class="ak-sumber">${e.sumber}</em></div>` : "") + (ms ? `<div class="ak-lkontak ak-lk-putih">${ms}</div>` : ""); };

  /* ---------- daftar pendek ---------- */
  const dpSimpan = () => { try { localStorage.setItem(DP_KEY, JSON.stringify([...dp])); } catch (e) {} };
  const modeL = () => tampilSkrg === "lembaga", setDp = () => modeL() ? dpl : dp;
  function dpSegarkan() {
    const n = setDp().size; $("akDpN").textContent = angka(n); $("akDpNoun").textContent = modeL() ? "lembaga" : "pakar"; $("akDpBar").hidden = !n; document.body.classList.toggle("ak-ada-dp", n > 0);
    if (!n) { $("akDpMenu").hidden = true; document.querySelector('[data-dpa="unduh"]').setAttribute("aria-expanded", "false"); }
    document.querySelectorAll("input[data-dp]").forEach(c => { c.checked = dp.has(c.dataset.dp); });
    document.querySelectorAll("input[data-dpl]").forEach(c => { c.checked = dpl.has(c.dataset.dpl); });
    document.querySelectorAll("[data-dpl-t]").forEach(b => { const a = dpl.has(b.dataset.dplT); b.setAttribute("aria-pressed", String(a)); b.title = b.ariaLabel = a ? "Ada di daftar pendek" : "Tambah ke daftar pendek"; });
    document.querySelectorAll("[data-dp-t]").forEach(b => { const a = dp.has(b.dataset.dpT); b.setAttribute("aria-pressed", String(a)); b.title = b.ariaLabel = a ? "Ada di daftar pendek" : "Tambah ke daftar pendek"; });
  }
  function dpUbah(id, ada) { if (ada) dp.add(id); else dp.delete(id); dpSimpan(); dpSegarkan(); if ($("akSheet").dataset.mode === "dp" && !$("akSheet").hidden) daftarDp(); }
  function dpTambahBanyak(ors) { ors.forEach(o => dp.add(o[0])); dpSimpan(); dpSegarkan(); pesanDp(`${angka(ors.length)} pakar ditambahkan`); }
  let pesanT = 0;
  function pesanDp(t) { $("akDpPesan").textContent = t; clearTimeout(pesanT); if (t) pesanT = setTimeout(() => { $("akDpPesan").textContent = ""; }, 4000); }

  /* lembar bawah bersama: daftar pendek dan profil kampus. Kepala tampil seketika, isi berat ditunda. */
  function bukaSheet(mode, kepala, isiFn) {
    const sh = $("akSheet"), tk = ++tokenS; sh.dataset.mode = mode;
    $("akSIsi").innerHTML = kepala + '<div class="ak-dtubuh" id="akSTubuh"><div class="ak-hantu"></div></div>';
    sh.hidden = false; document.body.style.overflow = "hidden"; sh.querySelector(".ak-x").focus();
    nanti(() => { if (tk === tokenS && !sh.hidden) $("akSTubuh").innerHTML = isiFn(); });
  }
  function tutupSheet() { $("akSheet").hidden = true; tokenS++; $("akTip").hidden = true; if ($("akLembar").hidden) document.body.style.overflow = ""; }
  const metrikK = a => `<div class="ak-metrik">${a.map(([l, d, n]) => `<div><span class="ak-mlabel">${ikon(d, "currentColor")}${l}</span><b>${angka(n)}</b></div>`).join("")}</div>`;
  const IK_ORANG = '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c3 0 5.5 2 5.5 5"/>';
  /* baris pakar kaya: foto + lencana logo kampus, nama, SINTA, prodi, sektor, tiga metrik rata tengah; klik = profil pakar */
  const barisPk = (o, attr, alasan) => { if (typeof alasan !== "string") alasan = "";   // .map(barisPk) mengirim indeks + larik, bukan alasan
    return `<li class="ak-pkb"><button type="button" class="ak-sbuka ak-pkbtn" ${typeof attr === "string" ? attr : `data-buka="${esc(o[0])}"`}><span class="ak-sosok">${foto(o)}</span><span class="ak-pkn"><span class="ak-pkt"><b>${esc(o[1])}</b>${o[13] === "s" ? '<em class="ak-l-sinta">SINTA</em>' : ""}</span><small title="${esc([prodiDari(o), o[2]].filter(Boolean).join(", "))}">${esc([prodiDari(o), o[2]].filter(Boolean).join(", "))}</small><span class="ak-pkr">${o[3].slice(0, 2).map(r => `<span class="ak-r" data-st="--w0:${(SEKTOR[r] || [])[2] || "var(--ink2)"}">${(SEKTOR[r] || [])[1] ? ikon(SEKTOR[r][1], SEKTOR[r][2]) : ""}${esc((SEKTOR[r] || [r])[0])}</span>`).join("")}${o[3].length > 2 ? `<span class="ak-r ak-r-n">+${o[3].length - 2}</span>` : ""}</span>${alasan ? `<small class="ak-pk-alasan">${esc(alasan)}</small>` : ""}</span><span class="ak-pkm">${METRIK.map(([n, l]) => `<span><small>${l}</small><b>${nol(o[n])}</b></span>`).join("")}</span></button></li>`; };
  const barisTkRow = (x, attr) => { const l = (x.lembaga_id && lbMap.get(x.lembaga_id)) || (x.lembaga ? lbArr.find(y => namaLb(y).includes(nrm(x.lembaga))) : null), lg = l ? chainLogo(l).find(u => urlOk(u)) : "";
    const afil = x.lembaga && !/^[-–\s]*$/.test(x.lembaga) ? `<span class="ak-mp ak-mp-l">${lg ? `<img src="${esc(lg)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ikon(IK_GEDUNG, "currentColor")}${esc(potong(x.lembaga, 34))}</span>` : "";
    const pk = pakarSama(x);
    return `<li class="ak-pkb"><button type="button" class="ak-sbuka ak-pkbtn ak-pkbtn-tk" ${attr}><span class="ak-sosok">${fotoTk(x)}</span><span class="ak-pkn"><span class="ak-pkt"><b>${esc(x.nama)}</b>${bintangI(l ? "L:" + l.id : "")}</span><small title="${esc(x.peran || "")}">${esc(x.peran || "")}</small><span class="ak-pkr">${x.peran_energi ? pilPeranKb(x.peran_energi) : ""}${x.jenis ? pilMini(IK_ORANG, kapital(x.jenis)) : ""}${afil}</span></span>${pk ? `<span class="ak-pkm">${METRIK.map(([n, lb]) => `<span><small>${lb}</small><b>${nol(pk[n])}</b></span>`).join("")}</span>` : ""}</button></li>`; };
  const URUT_PK = [[4, "h-index", METRIK[0][3]], [5, "Karya", METRIK[1][3]], [6, "Sitasi", METRIK[2][3]]]; let topPk = [];
  /* kotak cari di lembar kampus: nama atau prodi; tanpa kata kunci tampil 10 teratas, dengan kata kunci sampai 50 yang cocok */
  let KPQ = "";
  const nrmQ = t => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cocokKpq = o => !KPQ || nrmQ(o[1] + " " + (prodiDari(o) || "")).includes(KPQ);
  const urutPk = n => { const a = topPk.filter(cocokKpq); return a.length ? `<ol class="ak-sdaftar ak-pkl">${a.sort((x, y) => y[n] - x[n] || y[4] - x[4]).slice(0, KPQ ? 50 : 10).map(barisPk).join("")}</ol>` : '<p class="ak-khampa">Tidak ada pakar yang cocok.</p>'; };
  const bagTopPk = ors => { topPk = ors; KPQ = ""; return `<section class="ak-dbagian"><div class="ak-disi"><div class="ak-bh"><div class="ak-bh-j"><h3>Pakar <small class="ak-hit" id="akKpN">${angka(ors.length)}</small></h3></div><div class="ak-urut" role="group" aria-label="Urutkan">${URUT_PK.map(([n, l, d], j) => `<button type="button" data-urut="${n}" aria-pressed="${j === 0}">${ikon(d, "currentColor")}${l}</button>`).join("")}</div></div><div id="akKpFil"></div>${cariKotak("akKpQ", "Cari pakar di kampus ini")}<div id="akTopPk">${urutPk(4)}</div></div></section>`; };
  const KOLASI = new Intl.Collator("id", {numeric: true});
  document.addEventListener("click", e => { const th = e.target.closest(".ak-bpt th[data-s]"); if (th) { const tb = th.closest("table"), n = th.dataset.s, naik = th.getAttribute("aria-sort") !== "ascending"; tb.querySelectorAll("th").forEach(x => x.setAttribute("aria-sort", "none")); th.setAttribute("aria-sort", naik ? "ascending" : "descending");
      nanti(() => { const tr = [...tb.tBodies[0].rows].sort((a, b) => (naik ? 1 : -1) * KOLASI.compare(a.dataset["k" + n], b.dataset["k" + n])); tb.tBodies[0].append(...tr); }); return; }
    const b = e.target.closest("[data-urut]"); if (!b) return; b.parentNode.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); const n = +b.dataset.urut; nanti(() => { $("akTopPk").innerHTML = urutPk(n); }); });
  const kecil = o => `<button type="button" class="ak-sbuka" data-buka="${esc(o[0])}">${foto(o)}<span><b>${esc(o[1])}</b><small>${esc(prodiDari(o) || o[2])}</small></span></button>`;
  let dpUrut = "pilih";
  const IK_UNDUH = '<path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14"/>', IK_SALINK = '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>', IK_HAPUS = '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>';
  function daftarDp() {
    let ors = [...dp].map(id => peta.get(id)).filter(Boolean);
    const tubuh = $("akSTubuh"); if (!tubuh) return;
    if (!ors.length) { tubuh.innerHTML = `<div class="ak-kosong-dp">${ikon(IK_ORANG, "currentColor")}<p>Belum ada pakar di daftar pendek. Tandai pakar dari daftar atau profil untuk menyusun daftar pendek.</p></div>`; const sm = $("akSJudul")?.nextElementSibling; if (sm) sm.innerHTML = "Kosong"; return; }
    if (dpUrut === "hindex") ors = ors.slice().sort((a, b) => b[4] - a[4]); else if (dpUrut === "kampus") ors = ors.slice().sort((a, b) => a[2].localeCompare(b[2], "id") || b[4] - a[4]);
    const kam = new Set(ors.map(o => o[2])), per = {}; ors.forEach(o => o[3].forEach(r => { per[r] = (per[r] || 0) + 1; }));
    const ring = Object.entries(per).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([r, n]) => `<span class="ak-r" data-st="--w0:${(SEKTOR[r] || [])[2] || "var(--ink2)"}">${(SEKTOR[r] || [])[1] ? ikon(SEKTOR[r][1], SEKTOR[r][2]) : ""}${esc((SEKTOR[r] || [r])[0])}<small class="ak-tn">${angka(n)}</small></span>`).join("");
    const sm = $("akSJudul")?.nextElementSibling; if (sm) sm.innerHTML = `<b>${angka(ors.length)}</b> pakar dari <b>${angka(kam.size)}</b> kampus`;
    const rr = $("akDpRingkas"); if (rr) rr.innerHTML = ring;
    tubuh.innerHTML = `<div class="ak-urut" role="group" aria-label="Urutkan daftar pendek">${[["pilih", "Urutan dipilih", IK_UNDUH.replace(/.*/, '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>')], ["hindex", "h-index", METRIK[0][3]], ["kampus", "Kampus", IK_KAMPUS]].map(([v, l, d]) => `<button type="button" data-dpu="${v}" aria-pressed="${v === dpUrut}">${ikon(d, "currentColor")}${l}</button>`).join("")}</div>
${(() => { const baris = (o, n) => barisPk(o).replace('<li class="ak-pkb">', `<li class="ak-pkb">${n ? `<span class="ak-no">${n}</span>` : ""}`).replace("</li>", `<button type="button" class="ak-ib ak-dphapus" data-hapus="${esc(o[0])}" title="Hapus dari daftar pendek" aria-label="Hapus ${esc(o[1])} dari daftar pendek">${ikon('<path d="M6 6l12 12M18 6 6 18"/>', "currentColor")}</button></li>`);
        if (dpUrut === "kampus") { const g = new Map(); ors.forEach(o => (g.get(o[2]) || g.set(o[2], []).get(o[2])).push(o)); return [...g].map(([k, a]) => `<h4 class="ak-dpgrup">${logoKecil(k)}<b>${esc(k)}</b><small class="ak-hit">${angka(a.length)}</small></h4><ol class="ak-sdaftar ak-pkl ak-dpl">${a.sort((x, y) => y[4] - x[4]).map(o => baris(o)).join("")}</ol>`).join(""); }
        return `<ol class="ak-sdaftar ak-pkl ak-dpl${dpUrut === "pilih" ? " ak-dpno" : ""}">${ors.map((o, n) => baris(o, dpUrut === "pilih" ? n + 1 : 0)).join("")}</ol>`; })()}
      <div class="ak-dpfoot"><button type="button" data-dpx="xlsx">${ikon(IK_UNDUH, "currentColor")}Unduh Excel</button><button type="button" data-dpx="pdf">${ikon(IK_UNDUH, "currentColor")}Unduh PDF</button><button type="button" data-dpx="salin">${ikon(IK_SALINK, "currentColor")}Salin kontak</button><button type="button" data-dpx="kosong">${ikon(IK_HAPUS, "currentColor")}Kosongkan</button></div>`;
  }
  function lihatDp() {
    bukaSheet("dp", `<div class="ak-dkepala"><div class="ak-dk-atas"><div class="ak-nama"><h2 id="akSJudul">Daftar pendek pakar</h2><p><b>${angka(dp.size)}</b> pakar terpilih</p></div></div><div class="ak-pil ak-mps" id="akDpRingkas"></div></div>`, () => { daftarDp(); return $("akSTubuh").innerHTML; });
  }
  document.addEventListener("click", e => { const u = e.target.closest("[data-dpu]"); if (u) { dpUrut = u.dataset.dpu; nanti(daftarDp); u.parentNode.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === u))); return; }
    const x = e.target.closest("[data-dpx]"); if (!x) return; const a = x.dataset.dpx;
    if (a === "kosong") { dp.clear(); dpSimpan(); dpSegarkan(); nanti(daftarDp); return; }
    if (a === "salin") { const em = [...dp].map(id => peta.get(id)).filter(Boolean).map(o => emailDari(o)?.list[0]).filter(Boolean); try { navigator.clipboard.writeText(em.join("; ")); pesanDp(em.length ? `${angka(em.length)} email kampus disalin` : "Tidak ada email tercatat"); } catch (er) {} return; }
    nanti(() => eksporDp(a)); });
  const urlHost = w => String(w).replace(/^https?:\/\//i, "").replace(/\/$/, "");
  /* nama prodi disatukan: huruf kecil, "&" = "dan", "sumberdaya" = "sumber daya", spasi ganda dibuang */
  const kunciProdi = t => String(t).toLowerCase().replace(/&/g, " dan ").replace(/sumberdaya/g, "sumber daya").replace(/[^\p{L}\d ]/gu, " ").replace(/\s+/g, " ").trim();
  const judulProdi = t => String(t).replace(/&/g, "dan").replace(/\s+/g, " ").trim().split(" ").map((w, i) => { const b = w.replace(/[^\p{L}\d]/gu, ""), k = w.toLowerCase(); if (SINGKATAN.test(b) || (b.length > 1 && b === b.toUpperCase() && b.length <= 4 && !/[AIUEO]/.test(b))) return w; return i && KECIL_TAG.has(k) ? k : k.replace(/\p{L}/u, c => c.toUpperCase()); }).join(" ");
  const barisProdi = (e, mx, k) => `<button type="button" class="ak-prb" data-kprodi="${esc(e.v)}" data-kp-k="${esc(k)}" title="${esc(judulProdi(e.v))}, ${angka(e.n)} pakar. Klik untuk menyaring."><span class="ak-prb-n">${esc(judulProdi(e.v))}</span><i class="ak-prb-b"><u data-st="width:${Math.max(3, e.n / mx * 100).toFixed(1)}%"></u></i><b>${angka(e.n)}</b></button>`;
  const barProdi = (pr, k) => { const mx = pr[0]?.n || 1, atas = pr.slice(0, 10).map(e => barisProdi(e, mx, k)).join(""), lagi = pr.length > 10 ? (() => { const n = "lz" + (++lazyN); LAZY.set(n, () => `<div class="ak-prgrid">${pr.slice(10).map(e => barisProdi(e, mx, k)).join("")}</div>`); return `<details class="ak-terh-lagi" data-lazy="${n}"><summary>Lihat semua (${angka(pr.length)})</summary><div class="ak-lazyisi"></div></details>`; })() : ""; return `<div class="ak-prgrid">${atas}</div>${lagi}`; };
  /* "Pakar per sektor" di lembar kampus: batang multi-pilih (OR) menyaring daftar pakar di bawahnya, tanpa menutup lembar atau menggulir */
  let KPSET = new Set(), KPORS = [];
  function segarKp() {
    const on = KPSET.size > 0, fil = on ? KPORS.filter(o => o[3].some(r => KPSET.has(r))) : KPORS;
    document.querySelectorAll("#akSheet [data-kpt]").forEach(el => { const a = KPSET.has(el.dataset.kpt); el.setAttribute("aria-pressed", String(a)); el.classList.toggle("ak-bsel", a); el.classList.toggle("ak-bredup", on && !a); });
    topPk = fil; const n = +($("akSheet").querySelector("[data-urut][aria-pressed=true]")?.dataset.urut || 4);
    if ($("akTopPk")) $("akTopPk").innerHTML = fil.length ? urutPk(n) : '<p class="ak-khampa">Tidak ada pakar di sektor terpilih.</p>';
    if ($("akKpN")) $("akKpN").textContent = angka(KPQ ? fil.filter(cocokKpq).length : fil.length);
    if ($("akKpFil")) $("akKpFil").innerHTML = on ? `<div class="ak-pil ak-mps">${[...KPSET].map(r => `<button type="button" class="ak-mp ak-mp-x" data-kpx="${esc(r)}" title="Hapus saringan">${esc((SEKTOR[r] || [r])[0])} &times;</button>`).join("")}<button type="button" class="ak-mp ak-mp-b ak-mp-sem" data-kpx="semua">Hapus semua</button></div>` : "";
  }
  let kpqT = 0; document.addEventListener("input", e => { if (e.target.id !== "akKpQ") return; clearTimeout(kpqT); kpqT = setTimeout(() => { KPQ = nrmQ(e.target.value.trim()); segarKp(); }, 150); });
  document.addEventListener("click", e => { const b = e.target.closest("[data-kpt]"), x = e.target.closest("[data-kpx]"); if (!b && !x) return; e.stopPropagation();
    if (b) KPSET.has(b.dataset.kpt) ? KPSET.delete(b.dataset.kpt) : KPSET.add(b.dataset.kpt); else if (x.dataset.kpx === "semua") KPSET.clear(); else KPSET.delete(x.dataset.kpx);
    b?.setAttribute("aria-pressed", String(KPSET.has(b.dataset.kpt))); nanti(segarKp); }, true);
  document.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.matches?.("[data-kpt]")) { e.preventDefault(); e.target.click(); } });
  function profilKampus(k) {
    const info = kampusInfo[k] || {}, ors = semua.filter(o => o[2] === k), karyaN = ors.reduce((a, o) => a + (o[5] || 0), 0), sitasiN = ors.reduce((a, o) => a + (o[6] || 0), 0);
    const web = typeof info.web === "string" && info.web ? (/^https?:\/\//i.test(info.web) ? info.web : "https://" + info.web) : "", em = [].concat(info.email || []).filter(emailOk)[0];
    const lokasi = [info.kab || info.kota, provNama(info.prov)].filter((v, n, a) => v && a.indexOf(v) === n).join(", ");
    const gm = Number.isFinite(info.lat) && Number.isFinite(info.lon) ? `https://www.google.com/maps/search/?api=1&query=${info.lat},${info.lon}` : "", pLok = lokasi || gm ? (gm ? `<a class="ak-ptl ak-ptl-lok" href="${esc(gm)}" ${LUAR} title="Buka di Google Maps" aria-label="Buka ${esc(lokasi)} di Google Maps">${ikon(IKON_PIN, "currentColor")}${esc(lokasi || "Lihat di peta")}</a>` : `<span class="ak-ptl">${ikon(IKON_PIN, "currentColor")}${esc(lokasi)}</span>`) : "";
    const pil = [pLok, web && `<a class="ak-ptl" href="${esc(web)}" ${LUAR}>${ikon(IKON_WEB, "currentColor")}${esc(urlHost(web))}</a>`, em && `<a class="ak-ptl" href="mailto:${esc(em)}">${ikon(IKON_MAIL, "currentColor")}${esc(em)}</a>`].filter(Boolean).join("");
    const kepala = `<div class="ak-dkepala"><div class="ak-dk-atas">${logoKecil(k)}<div class="ak-nama"><h2 id="akSJudul">${esc(k)}</h2></div>${metrikK([["Pakar", IK_ORANG, ors.length], ["Karya", METRIK[1][3], karyaN], ["Sitasi", METRIK[2][3], sitasiN]])}</div><div class="ak-pil ak-kaksi">${pilStrat("K:" + k)}${pil}<button type="button" class="ak-ib" data-sa="tambah" title="Tambah ke daftar pendek" aria-label="Tambah ke daftar pendek">${ikon(IKON_TANDA, "currentColor")}</button><button type="button" class="ak-ib" data-sa="lihat" title="Lihat semua pakar" aria-label="Lihat semua pakar">${ikon(IK_ORANG, "currentColor")}</button></div></div>`;
    KPSET = new Set(); KPORS = ors;
    bukaSheet("kampus", kepala, () => {
      const per = {}, prodi = {}; ors.forEach(o => { o[3].forEach(r => { per[r] = (per[r] || 0) + 1; }); const p = prodiDari(o); if (p) { const kn = kunciProdi(p), e = prodi[kn] ||= {n: 0, v: {}}; e.n++; e.v[p] = (e.v[p] || 0) + 1; } });
      const baris = Object.entries(per).sort((a, b) => b[1] - a[1]), mx = baris[0]?.[1] || 1;
      const top = ors.slice().sort((a, b) => b[4] - a[4] || b[6] - a[6]).slice(0, 10), pr = Object.values(prodi).map(e => ({n: e.n, v: Object.entries(e.v).sort((a, b) => b[1] - a[1])[0][0]})).sort((a, b) => b.n - a.n);
      const bag = (j, isi) => `<section class="ak-dbagian"><div class="ak-disi"><h3>${j}</h3>${isi}</div></section>`;
      return alasanStrat("K:" + k) + (baris.length ? bag("Pakar per sektor", `<div class="ak-bars">${baris.map(([r, n]) => { const [l, d, w] = SEKTOR[r] || [r, "", "var(--ink2)"];
          return barHtml({warna: w, lebar: n / mx * 100, nilai: angka(n), persen: persenTxt(n, ors.length), label: (d ? ikon(d, w) : "") + esc(l), attr: `data-t="${esc(l)}" data-n="${n}" data-p="${Math.round(n / ors.length * 100)}" data-tot="${ors.length}" data-kpt="${esc(r)}" role="button" aria-pressed="false"`}); }).join("")}</div><p class="ak-lkaki-s">Satu pakar bisa lebih dari satu sektor, jadi persentase tidak berjumlah 100.</p>`) : "")
        + bagTopPk(ors)
        + (pr.length ? bag(`Program studi terkait <small class="ak-hit">${angka(pr.length)}</small>`, barProdi(pr, k)) : "")
        + '<div id="akSPs"></div><div id="akSJur"></div><div id="akSTs"></div><div id="akSGr"></div>';
    });
    $("akSheet").dataset.k = k; terhubungDi("K:" + k);
    const tk = tokenS;
    /* unit kajian kampus (pusat studi terverifikasi berinduk kampus ini), mis. CIMTROP di Universitas Palangka Raya */
    ambilData("pusat_studi").then(d => { if (!Array.isArray(d)) return; if (!psArr.length) psArr = d.filter(x => x && x.nama && x.nama_terverifikasi === true);
      const ps = psArr.filter(x => x.induk === k || INDUK_PS[x.induk] === k); if (!ps.length) return;
      const isi = (coba = 0) => { if (tk !== tokenS) return; const el = $("akSPs"); if (!el) { if (coba < 20) nanti(() => isi(coba + 1)); return; }
        el.outerHTML = `<section class="ak-dbagian"><div class="ak-disi"><h3>Unit kajian <small class="ak-hit">${angka(ps.length)}</small></h3><div class="ak-psgrid">${ps.map(kartuPs).join("")}</div></div></section>`; };
      nanti(() => isi()); });
    /* identitas kampus (ROR, Wikidata) dan penulis energi terbarukan GARUDA yang belum ada di direktori pakar (lembaga_ekstra.kampus) */
    ambilData("lembaga_ekstra").then(d => { const e = d?.kampus?.[k]; if (!e || tk !== tokenS) return;
      const idn = [urlOk(e.ror) && `<a class="ak-mp ak-mp-a" href="${esc(urlOk(e.ror))}" ${LUAR}>${ikon(IK_LUAR, "currentColor")}ROR</a>`, /^Q\d+$/.test(e.wikidata || "") && `<a class="ak-mp ak-mp-a" href="https://www.wikidata.org/wiki/${e.wikidata}" ${LUAR}>${ikon(IK_LUAR, "currentColor")}Wikidata</a>`].filter(Boolean);
      const gr = dlist(e.garuda).filter(g => g.nama);
      if (!idn.length && !gr.length) return;
      isiNanti(() => tk === tokenS, "akSGr", (idn.length ? `<section class="ak-dbagian"><div class="ak-disi"><h3>Identitas kampus</h3><div class="ak-pil ak-mps">${idn.join("")}</div></div></section>` : "")
        + (gr.length ? `<section class="ak-dbagian"><div class="ak-disi"><h3>Calon pakar dari jurnal GARUDA <small class="ak-hit">${angka(gr.length)}</small></h3><ul class="ak-lsumber">${gr.map(g => `<li><b>${esc(g.nama)}</b>${g.artikel ? ` <small class="ak-lper">${esc(angka(g.artikel) + " artikel energi terbarukan")}</small>` : ""}${g.contoh ? `<br><small class="ak-lper">${esc(g.contoh)}</small>` : ""}</li>`).join("")}</ul><small class="ak-lper">Sumber GARUDA Kemendikbudristek, artikel energi terbarukan 2018 sampai 2026; belum tercatat di direktori pakar</small></div></section>` : "")); });
    /* tesis, disertasi, dan skripsi energi terbarukan dari repositori kampus (OAI-PMH, panen 31 Okt 2026) */
    ambilData("tesis").then(d => { const a = dlist(d?.[k]); if (!a.length || tk !== tokenS) return;
      isiNanti(() => tk === tokenS, "akSTs", `<section class="ak-dbagian"><div class="ak-disi"><h3>Tesis dan skripsi energi terbarukan <small class="ak-hit">${angka(a.length)}</small></h3><ul class="ak-lsumber">${a.slice(0, 15).map(t => `<li>${urlOk(t.url) ? tautanLuar(urlOk(t.url), esc(t.judul)) : esc(t.judul)} <small class="ak-lper">${esc([t.penulis, t.jenjang, t.tahun].filter(Boolean).join(", "))}</small></li>`).join("")}</ul><small class="ak-lper">Sumber repositori kampus lewat OAI-PMH; disaring dari judul, jadi daftar ini belum lengkap${a.length > 15 ? `; menampilkan 15 terbaru dari ${angka(a.length)}` : ""}</small></div></section>`); });
    ambilData("jurnal").then(d => { const js = Array.isArray(d) ? jurnalKampus(d).get(k) || [] : [];
      if (!js.length) return;
      const isi = (coba = 0) => { if (tk !== tokenS) return; const el = $("akSJur"); if (!el) { if (coba < 20) nanti(() => isi(coba + 1)); return; }
        el.outerHTML = `<section class="ak-dbagian"><div class="ak-disi"><h3>Jurnal energi terbarukan terbitan ${esc(k)}<small> ${angka(js.length)}</small></h3><div class="ak-jgrid">${js.map(kartuJur).join("")}</div></div></section>`; };
      nanti(() => isi()); });
  }

  /* jurnal -> kampus/lembaga penerbit: domain situs jurnal (subdomain kampus), lalu nama kampus terpanjang di teks penerbit, lalu alias penerbit berbahasa Inggris.
     Jurnal penerbit swasta, asosiasi, dan lembaga di luar data kampus belum punya rumah; tampil lagi saat direktori lembaga dibangun (docs/perencanaan). */
  const ALIAS_PENERBIT = [[/Indonesia Defense University/i, "Universitas Pertahanan"], [/National Research and Innovation Agency/i, "Badan Riset dan Inovasi Nasional"],
    [/Institut Teknologi Nasional, Bandung/i, "Institut Teknologi Nasional Bandung"], [/Diponegoro University/i, "Universitas Diponegoro"],
    [/Marine Geological Institute/i, "Balai Besar Survei dan Pemetaan Geologi Kelautan"], [/Sumber Daya Manusia Geologi/i, "Badan Geologi"]];
  const hostDari = u => { try { return new URL(/^https?:\/\//i.test(u) ? u : "https://" + u).hostname.toLowerCase().replace(/^www\./, ""); } catch (e) { return ""; } };
  let jurIdx = null;
  function jurnalKampus(d) {
    if (jurIdx?.d === d) return jurIdx.m;
    const dom = Object.entries(kampusInfo).map(([n, v]) => [hostDari(typeof v?.web === "string" ? v.web : ""), n]).filter(([h]) => h).sort((a, b) => b[0].length - a[0].length);
    const nama = Object.keys(kampusInfo).sort((a, b) => b.length - a.length), m = new Map();
    for (const j of d) { if (!j || !j.nama) continue;
      const h = hostDari(urlOk(j.web)), pen = String(j.penerbit || ""), pl = pen.toLowerCase();
      const k = (h && dom.find(([x]) => h === x || h.endsWith("." + x))?.[1]) || nama.find(n => n.length > 5 && pl.includes(n.toLowerCase())) || ALIAS_PENERBIT.find(([r]) => r.test(pen))?.[1];
      if (k) { if (!m.has(k)) m.set(k, []); m.get(k).push(j); } }
    jurIdx = {d, m}; return m;
  }
  const kartuJur = j => { const w = urlOk(j.web), issn = dlist(j.issn);
    return `<article class="ak-jk"${w ? ` role="link" tabindex="0" ${hrefAttr(w)}` : ""}><div class="ak-jkatas"><span class="ak-jav" aria-hidden="true">${ikon(IKJ, "currentColor")}</span><div class="ak-jnama"><h4>${esc(j.nama)}</h4>${j.penerbit ? `<p>${esc(j.penerbit)}</p>` : ""}</div>${j.doaj ? '<em class="ak-jdoaj" title="Terindeks Directory of Open Access Journals">DOAJ</em>' : ""}</div>
      ${dlist(j.subjek).length ? `<div class="ak-pil">${pilTags(dlist(j.subjek), 3)}</div>` : ""}
      <div class="ak-jkbawah">${issn.length ? `<span class="ak-issn"><b>ISSN</b>${issn.map(esc).join(", ")}</span>` : "<span></span>"}${w ? `<a class="ak-lnk" href="${esc(w)}" ${LUAR}>${ikon(IKON_WEB, "currentColor")}Kunjungi jurnal</a>` : ""}</div></article>`; };

  /* ---------- ekspor daftar pendek: pustaka dimuat malas saat klik, versi sama dengan unduh_tabel.js ---------- */
  const NAVY = [5, 28, 44], NAVY_HEX = "051C2C";
  const LIB = {
    xlsx: ["https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js", () => window.XLSX, "sha384-vtjasyidUo0kW94K5MXDXntzOJpQgBKXmE7e2Ga4LG0skTTLeBi97eFAXsqewJjw"],
    docx: ["https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js", () => window.docx, "sha384-4xaIisuLEy2lo2HkB2C4rEf7v8jbTb2kuogX6TkuEt9feTWKBSFSOzsqNNbV+sKh"],
    pdf: ["https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", () => window.jspdf, "sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk"],
    tabel: ["https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js", () => window.jspdf?.jsPDF?.API?.autoTable, "sha384-fCAW/rDWORTbQXSiB7mOg0QtQ5c+r0f544y6XoKjuVva0nMBlCpNUjiFeG5iMdS3"]};
  const janji = {};
  const muat = k => janji[k] ||= new Promise((ok, gagal) => { const [src, ada, sri] = LIB[k]; if (ada()) return ok();
    const sc = document.createElement("script"); if (sri) { sc.integrity = sri; sc.crossOrigin = "anonymous"; } sc.src = src; sc.onload = ok; sc.onerror = () => { delete janji[k]; gagal(new Error("Gagal memuat pustaka " + k)); }; document.head.append(sc); });
  const KOL = ["No", "Nama", "Kampus", "Program studi", "Provinsi", "Sektor", "h-index", "Karya", "Sitasi", "Email", "ORCID", "SINTA"];
  const urlOrcid = v => /^https?:/.test(v) ? v : "https://orcid.org/" + v;
  function dataDp() {
    const wib = new Date(Date.now() + 7 * 36e5), iso = wib.toISOString().slice(0, 10), perlu = $("akDpPerlu").value.trim();
    const baris = [...dp].map(id => peta.get(id)).filter(Boolean).map((o, i) => { const e = emailDari(o);
      return [i + 1, o[1], o[2], prodiDari(o), provNama(provO(o)), o[3].map(r => (SEKTOR[r] || [r])[0]).join(", "), o[4] || 0, o[5] || 0, o[6] || 0,
        e ? e.list.join("; ") + (e.sumber === "Email kampus" ? " (kampus)" : "") : "", o[7] ? urlOrcid(o[7]) : "", o[10] ? "https://sinta.kemdiktisaintek.go.id/authors/profile/" + o[10] : ""]; });
    return {judul: "Daftar Pendek Pakar Energi terbarukan", iso, perlu, baris, berkas: "daftar-pendek-pakar", kol: KOL, lebar: [5, 26, 34, 28, 18, 28, 9, 9, 10, 32, 38, 48], kanan: [0, 6, 7, 8],
      tanggal: tglID(wib.toISOString().slice(0, 10)) + ", " + wib.toISOString().slice(11, 16).replace(":", ".") + " WIB"};
  }
  async function xlsx(L) { await muat("xlsx"); const X = window.XLSX, wb = X.utils.book_new();
    const ws = X.utils.aoa_to_sheet([[L.judul], [L.tanggal], ...(L.perlu ? [["Keperluan: " + L.perlu]] : []), [], L.kol, ...L.baris]);
    ws["!cols"] = L.lebar.map(w => ({wch: w}));
    L.kol.forEach((_, c) => { const h = ws[X.utils.encode_cell({r: L.perlu ? 4 : 3, c})]; if (h) h.s = {alignment: {horizontal: "center", vertical: "center"}, font: {bold: true}}; });   // ponytail: SheetJS CE mengabaikan gaya sel; kepala baru benar-benar rata tengah bila pustaka diganti yang mendukung gaya (xlsx-js-style/ExcelJS) X.utils.book_append_sheet(wb, ws, "Daftar pendek");
    return new Blob([X.write(wb, {bookType: "xlsx", type: "array"})], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}); }
  async function docx(L) { await muat("docx"); const D = window.docx, P = (x, o = {}) => new D.Paragraph({spacing: {after: 80}, ...o, children: [new D.TextRun({text: x, ...(o.run || {})})]});
    const KANAN = new Set(L.kanan);
    const sel = (x, i, kepala) => new D.TableCell({shading: kepala ? {type: D.ShadingType.CLEAR, fill: NAVY_HEX, color: "auto"} : undefined, margins: {top: 40, bottom: 40, left: 60, right: 60},
      children: [new D.Paragraph({alignment: kepala ? D.AlignmentType.CENTER : KANAN.has(i) ? D.AlignmentType.RIGHT : D.AlignmentType.LEFT, children: [new D.TextRun({text: String(x), bold: kepala, color: kepala ? "FFFFFF" : undefined, size: 14})]})]});
    const anak = [P(L.judul, {run: {bold: true, size: 36, color: NAVY_HEX}}), P(L.tanggal), ...(L.perlu ? [P("Keperluan: " + L.perlu, {run: {bold: true}})] : []),
      new D.Table({width: {size: 100, type: D.WidthType.PERCENTAGE}, rows: [new D.TableRow({tableHeader: true, children: L.kol.map((x, i) => sel(x, i, true))}), ...L.baris.map(r => new D.TableRow({cantSplit: true, children: r.map((x, i) => sel(x, i))}))]})];
    return D.Packer.toBlob(new D.Document({sections: [{properties: {page: {size: {orientation: D.PageOrientation.LANDSCAPE}, margin: {top: 720, bottom: 720, left: 720, right: 720}}}, children: anak}]})); }
  async function pdf(L) { await muat("pdf"); await muat("tabel"); const d = new window.jspdf.jsPDF({unit: "pt", format: "a4", orientation: "landscape"});
    d.setFont("helvetica", "bold").setFontSize(18).setTextColor(...NAVY).text(L.judul, 36, 44);
    d.setFont("helvetica", "normal").setFontSize(10).setTextColor(60).text(L.tanggal, 36, 62); let y = 76;
    if (L.perlu) { d.setFont("helvetica", "bold").text("Keperluan: " + L.perlu, 36, y); y += 14; }
    d.autoTable({startY: y + 6, margin: {left: 36, right: 36, bottom: 36}, head: [L.kol], body: L.baris, styles: {fontSize: 7, cellPadding: 3, textColor: 30, overflow: "linebreak"},
      headStyles: {fillColor: NAVY, textColor: 255, fontStyle: "bold", halign: "center"}, columnStyles: Object.fromEntries(L.kanan.map(i => [i, i ? {halign: "right"} : {halign: "right", cellWidth: 22}]))});
    return d.output("blob"); }
  /* PDF daftar pendek pakar: halaman cetak HTML meniru bahasa visual pangantara/lib/pdf/kit.ts (band navy gradien, garis aksen 2 px, kepala kolom navy rata tengah berulang, zebra, grid, "Hal n dari m"); foto dan logo tampil tanpa CORS lewat iframe + window.print() */
  const CSS_CETAK = `@page{size:A4 landscape;margin:12mm 12mm 16mm;@bottom-left{content:"Direktori METI. Sumber data: OpenAlex, SINTA, ORCID";font:8px Roboto,Arial,sans-serif;color:var(--line-ctl)}@bottom-right{content:"Hal " counter(page) " dari " counter(pages);font:8px Roboto,Arial,sans-serif;color:var(--line-ctl)}}
*{box-sizing:border-box}body{margin:0;font:9.5px/1.35 Roboto,Arial,Helvetica,sans-serif;color:var(--data1);-webkit-print-color-adjust:exact;print-color-adjust:exact}
svg.ak-ikon{width:10px;height:10px;fill:none;stroke:var(--w,currentColor);stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;flex:none}
.band{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;background:linear-gradient(90deg,var(--data1),var(--data5));color:var(--on-brand);border-radius:6px 6px 0 0;padding:12px 16px 11px}.band .br{font-size:8.5px;letter-spacing:normal;text-transform:none;opacity:.8;margin-bottom:3px}.band h1{margin:0;font-size:19px;line-height:1.15}
.band dl{display:flex;gap:22px;margin:0}.band dt{font-size:8px;text-transform:none;letter-spacing:normal;opacity:.75}.band dd{margin:1px 0 0;font-size:11px;font-weight:700}.aksen{height:2px;background:var(--data5);margin-bottom:8px}
.perlu{margin:0 0 6px;font-weight:700}.pilr{margin:0 0 8px}.pil{display:inline-flex;align-items:center;gap:3px;border-radius:999px;padding:1px 7px;font-size:8.5px;font-weight:700;color:var(--w);background:color-mix(in srgb,var(--w) 12%,var(--on-brand));margin:0 3px 3px 0}.pil small{font-weight:800}
table{width:100%;border-collapse:collapse}thead{display:table-header-group}th{background:var(--data1);color:var(--on-brand);text-align:center;font-weight:700;font-size:8.5px;padding:5px 5px;border:1px solid var(--data1)}
td{padding:4px 5px;border:1px solid var(--soft-hijau);vertical-align:middle}tr{break-inside:avoid}tbody tr:nth-child(even) td{background:var(--surface)}td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}td.c{text-align:center}tr.kg td{background:var(--soft-biru)!important;font-weight:800;font-size:10px}
.o{display:flex;align-items:center;gap:6px}.ft{position:relative;overflow:hidden;width:28px;height:28px;border-radius:50%;background:var(--soft-biru);flex:none;display:grid;place-items:center;color:var(--line-ctl)}.ft img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.ft svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.5}
.nm{font-weight:800}.sinta{margin-left:4px;font-size:7px;font-weight:800;color:var(--on-brand);background:var(--ok);border-radius:999px;padding:1px 5px;vertical-align:1px}.pr{color:var(--line-ctl);font-size:8.5px}
.k{display:flex;align-items:center;gap:4px}.k img{width:16px;height:16px;object-fit:contain;flex:none}.em{overflow-wrap:anywhere}
h2.sek{break-before:page;margin:0 0 6px;font-size:13px;color:var(--data1)}.kisi{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.kartu{break-inside:avoid;border:1px solid var(--soft-hijau);border-radius:6px;padding:8px;display:grid;gap:5px;align-content:start}.kartu .o{align-items:flex-start;gap:8px}.kartu .ft{width:44px;height:44px}.kartu .ft svg{width:24px;height:24px}
h4{margin:0 0 2px;font-size:8px;letter-spacing:normal;text-transform:none;color:var(--line-ctl);text-align:center}.kar{margin:0;padding-left:12px;font-size:8.5px}.kar span{color:var(--line-ctl)}`;
  const potongC = (t, n) => { t = String(t || ""); return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t; };
  async function cetakDp() {
    const ors0 = [...dp].map(id => peta.get(id)).filter(Boolean); if (!ors0.length) return;
    const L = dataDp(), ors = dpUrut === "hindex" ? ors0.slice().sort((a, b) => b[4] - a[4]) : dpUrut === "kampus" ? ors0.slice().sort((a, b) => a[2].localeCompare(b[2], "id") || b[4] - a[4]) : ors0;
    const rd = await ambilData("riset").catch(() => null); if (rd) indeksRiset(dlist(Array.isArray(rd) ? rd : rd?.riset));
    const kam = new Set(ors.map(o => o[2])), per = {}; ors.forEach(o => o[3].forEach(r => { per[r] = (per[r] || 0) + 1; }));
    const pilR = (r, n) => { const [l, d, w] = SEKTOR[r] || [r, "", "var(--ink2)"]; return `<span class="pil" data-st="--w:${w}">${d ? ikon(d, w) : ""}${esc(l)}${n != null ? ` <small>${angka(n)}</small>` : ""}</span>`; };
    const fotoC = o => { const fo = o[9] || FOTO_PAKAR.get(o[0]); return `<span class="ft"><svg viewBox="0 0 24 24">${SIL}</svg>${fo ? `<img src="${esc(fo)}" alt="" referrerpolicy="no-referrer" data-galat="hapus">` : ""}</span>`; };
    const kampusC = k => { const lg = urlOk(logoK[k]); return `<span class="k">${lg ? `<img src="${esc(lg)}" alt="" referrerpolicy="no-referrer">` : ""}<span>${esc(k)}</span></span>`; };
    const namaC = o => `<span class="nm">${esc(o[1])}</span>${o[13] === "s" ? '<span class="sinta">SINTA</span>' : ""}`;
    const kontakC = o => { const e = emailDari(o); return [e ? `${esc(e.list.join(", "))}${e.sumber === "Email kampus" ? " (kampus)" : ""}` : "", o[7] ? "ORCID " + esc(String(o[7]).replace(/^https?:\/\/orcid\.org\//, "")) : "", o[10] ? "SINTA " + esc(o[10]) : ""].filter(Boolean).join("<br>"); };
    const baris = (o, i) => `<tr><td class="c">${i}</td><td><div class="o">${fotoC(o)}<div>${namaC(o)}${o[11] ? `<div class="pr">${esc(prodiDari(o))}</div>` : ""}</div></div></td><td>${kampusC(o[2])}</td><td>${o[3].slice(0, 3).map(r => pilR(r)).join("")}</td><td class="n">${angka(o[4] || 0)}</td><td class="n">${angka(o[5] || 0)}</td><td class="n">${angka(o[6] || 0)}</td><td class="em">${kontakC(o)}</td></tr>`;
    let no = 0; const kol = ["No", "Pakar", "Kampus", "Sektor", "h-index", "Karya", "Sitasi", "Kontak"];
    const g = new Map(); if (dpUrut === "kampus") ors.forEach(o => (g.get(o[2]) || g.set(o[2], []).get(o[2])).push(o));
    const tb = dpUrut === "kampus" ? [...g].map(([k, a]) => `<tr class="kg"><td colspan="8">${kampusC(k)}</td></tr>${a.map(o => baris(o, ++no)).join("")}`).join("") : ors.map(o => baris(o, ++no)).join("");
    const kartu = o => { const kr = (pakarRiset.get(o[0]) || []).slice().sort((a, b) => (b.sitasi || 0) - (a.sitasi || 0)).slice(0, 3);
      return `<div class="kartu"><div class="o">${fotoC(o)}<div>${namaC(o)}${o[11] ? `<div class="pr">${esc(prodiDari(o))}</div>` : ""}${kampusC(o[2])}</div></div>${kr.length ? `<div><h4>Karya teratas</h4><ol class="kar">${kr.map(x => `<li>${esc(potongC(rapiJudul(x.judul), 90))} <span>${x.tahun || ""}</span></li>`).join("")}</ol></div>` : ""}</div>`; };
    const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${esc(L.judul)}</title><style>${CSS_CETAK}</style></head><body><div class="band"><div><div class="br">Direktori METI</div><h1>${esc(L.judul)}</h1></div><dl><div><dt>Pakar</dt><dd>${angka(ors.length)}</dd></div><div><dt>Kampus</dt><dd>${angka(kam.size)}</dd></div><div><dt>Dicetak</dt><dd>${esc(L.tanggal.replace(/^[^,]+, /, "").replace(/^(\d+ \w+ \d+), /, "$1 "))}</dd></div></dl></div><div class="aksen"></div>${L.perlu ? `<p class="perlu">Keperluan: ${esc(L.perlu)}</p>` : ""}<div class="pilr">${Object.entries(per).sort((a, b) => b[1] - a[1]).map(([r, n]) => pilR(r, n)).join("")}</div>
      <table><colgroup><col data-st="width:4%"><col data-st="width:24%"><col data-st="width:17%"><col data-st="width:16%"><col data-st="width:6%"><col data-st="width:6%"><col data-st="width:7%"><col data-st="width:20%"></colgroup><thead><tr>${kol.map(k => `<th>${k}</th>`).join("")}</tr></thead><tbody>${tb}</tbody></table>
      ${ors.length <= 20 ? `<h2 class="sek">Ringkasan per pakar</h2><div class="kisi">${ors.map(kartu).join("")}</div>` : ""}</body></html>`;
    window.__htmlCetakDp = html; await cetakHalaman(html);
  }
  /* halaman cetak bersama (pakar, lembaga): iframe tanpa CORS, tunggu gambar lewat addEventListener, lalu print */
  async function cetakHalaman(html) {
    const f = document.createElement("iframe"); f.setAttribute("aria-hidden", "true"); f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0"; f.srcdoc = html; document.body.append(f);
    await new Promise(r => { f.addEventListener("load", r, {once: true}); });
    const im = [...f.contentDocument.images]; im.forEach(i => i.complete && !i.naturalWidth && i.remove()); await Promise.race([Promise.all(im.map(i => i.complete ? 0 : new Promise(r => { i.addEventListener("load", r); i.addEventListener("error", r); }))), new Promise(r => setTimeout(r, 6000))]);
    f.contentWindow.addEventListener("afterprint", () => f.remove()); f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => f.isConnected && f.remove(), 120000);
  }
  /* tabel cetak umum: band navy, ringkasan, kepala navy rata tengah berulang, zebra; sel berupa HTML siap pakai */
  const CSS_CETAK_TBL = `.lg{width:22px;height:22px;object-fit:contain;flex:none;border-radius:4px;background:var(--on-brand)}.lgk{width:22px;height:22px;border-radius:4px;background:var(--soft-biru);color:var(--line-ctl);display:grid;place-items:center;flex:none}.lgk svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.6}.o2{display:flex;align-items:center;gap:7px}.dua{color:var(--line-ctl);font-size:8.5px}`;
  const cetakTabel = ({judul, tanggal, perlu, band, kol, lebar, baris, catatan, sumber = "direktori lembaga mitra"}) => {
    const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${esc(judul)}</title><style>${CSS_CETAK.replace("Sumber data: OpenAlex, SINTA, ORCID", "Sumber data: " + sumber)}${CSS_CETAK_TBL}</style></head><body><div class="band"><div><div class="br">Direktori METI</div><h1>${esc(judul)}</h1></div><dl>${band.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}<div><dt>Dicetak</dt><dd>${esc(tanggal.replace(/^[^,]+, /, "").replace(/^(\d+ \w+ \d+), /, "$1 "))}</dd></div></dl></div><div class="aksen"></div>${perlu ? `<p class="perlu">Keperluan: ${esc(perlu)}</p>` : ""}
      <table><colgroup>${lebar.map(w => `<col data-st="width:${w}%">`).join("")}</colgroup><thead><tr>${kol.map(k => `<th>${esc(k)}</th>`).join("")}</tr></thead><tbody>${baris.map((r, i) => `<tr><td class="c">${i + 1}</td>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>${catatan ? `<p class="dua">${esc(catatan)}</p>` : ""}</body></html>`;
    return cetakHalaman(html);
  };
  const lgCetak = x => { const u = chainLogo(x).map(urlOk).find(Boolean) || [...logoOrg(x.nama, x.id)].find(u => urlOk(u)); return u ? `<img class="lg" src="${esc(new URL(urlOk(u), location.href).href)}" alt="" referrerpolicy="no-referrer">` : `<span class="lgk"><svg viewBox="0 0 24 24">${IK_GEDUNG}</svg></span>`; };
  const kontakCetak = x => [strs(x.telepon).slice(0, 2).map(telF).join(", "), strs(x.email).slice(0, 1).join(", "), urlOk(x.web) ? hostDari2(urlOk(x.web)) : ""].filter(Boolean).map(esc).join("<br>");
  async function cetakDpl() {
    const L = dataDpl(), ls = [...dpl].map(id => lbMap.get(id)).filter(Boolean); if (!ls.length) return;
    const prov = new Set(ls.map(x => x.prov).filter(Boolean));
    return cetakTabel({judul: L.judul, tanggal: L.tanggal, perlu: L.perlu, band: [["Lembaga", angka(ls.length)], ...(prov.size ? [["Provinsi", angka(prov.size)]] : [])], kol: ["No", "Lembaga", "Kategori", "Wilayah", "Kontak", "Diperiksa"], lebar: [4, 32, 14, 18, 24, 8],
      baris: ls.map(x => [`<div class="o2">${lgCetak(x)}<div><span class="nm">${esc(x.nama)}</span>${x.singkatan ? `<div class="pr">${esc(x.singkatan)}</div>` : ""}</div></div>`, esc(KAT[x.kategori]?.[0] || x.kategori || ""), esc([x.kab, provT(x.prov)].filter(Boolean).join(", ") || kapital(SKALA_L[x._skala] || x._skala || "nasional")), `<span class="em">${kontakCetak(x)}</span>`, esc(x.diperiksa ? tglID(x.diperiksa) : "")]), catatan: "Sumber: direktori lembaga mitra; tiap nomor bertaut ke sumbernya di layar."});
  }
  let bpCetakData = null;
  const FORMAT = {xlsx, docx, pdf};
  async function eksporDp(f) {
    if (sibuk || !setDp().size) return; sibuk = true; pesanDp("Menyiapkan berkas"); await new Promise(r => setTimeout(r, 0));
    if (f === "pdf") { try { await (modeL() ? cetakDpl() : cetakDp()); pesanDp("Jendela cetak dibuka, pilih Simpan sebagai PDF"); } catch (e) { console.error(e); pesanDp(e.message || "Gagal membuat berkas"); } finally { sibuk = false; } return; }
    try { const L = modeL() ? dataDpl() : dataDp(); try { localStorage.setItem(PERLU_KEY, L.perlu); } catch (e) {}
      const blob = await FORMAT[f](L), u = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = u; a.download = `${L.berkas}-${L.iso}.${f}`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4e4); pesanDp("Berkas siap"); }
    catch (e) { console.error(e); pesanDp(e.message || "Gagal membuat berkas"); }
    finally { sibuk = false; } }

  /* tubuh pakar hanya memuat yang belum ada di kepala: prodi dan kanal medsos (email, kampus, sektor, SINTA sudah di kepala) */
  const barisPakar = o => { const ms = medsosPasang(kontak[o[0]] || {}), sinta = o[10] ? `https://sinta.kemdiktisaintek.go.id/authors/profile/${o[10]}` : "";
    const isi = barisB("Program studi", o[11] ? `<b>${esc(prodiDari(o))}</b>` : "", o[11] ? (sinta || "") : "") + (ms ? `<div class="ak-bl2"><span class="ak-bk">Medsos</span><div class="ak-bn"><div class="ak-lkontak">${ms}</div></div></div>` : "");
    return isi ? `<div class="ak-bgrup">${isi}</div>` : ""; };
  const akhirPakar = o => { const urls = [`https://openalex.org/${o[0]}`, o[10] && `https://sinta.kemdiktisaintek.go.id/authors/profile/${o[10]}`, o[7] && urlOrcid(o[7]), urlOk(kampusInfo[o[2]]?.web)], e = emailDari(o),
      yk = yakinOrang(urls, [["peran", prodiDari(o)], ["foto", o[9]], ["email", e], ["sektor", o[3].length]], null), sj = semua.filter(y => y[0] !== o[0] && y[3].some(r => o[3].includes(r))).sort((a, b) => ((provO(b) === provO(o)) - (provO(a) === provO(o))) || b[4] - a[4]).slice(0, 6);
    const alasan = y => { const sama = y[3].filter(r => o[3].includes(r)).map(r => (SEKTOR[r] || [r])[0]).slice(0, 2); return [sama.length ? "sektor sama: " + sama.join(", ") : "", y[2] === o[2] ? "kampus sama" : ""].filter(Boolean).join("; "); };
    const sj2 = semua.filter(y => y[0] !== o[0] && y[3].some(r => o[3].includes(r))).sort((a, b) => ((provO(b) === provO(o)) - (provO(a) === provO(o))) || b[4] - a[4]).slice(0, 18);
    const baris = sj2.map(y => barisPk(y, undefined, alasan(y)));
    const lagi = baris.length > 6 ? (() => { const n = "lz" + (++lazyN); LAZY.set(n, () => `<ol class="ak-sdaftar ak-pkl ak-pkl-2s">${baris.slice(6).join("")}</ol>`); return `<details class="ak-terh-lagi" data-lazy="${n}"><summary>Lihat semua ${angka(baris.length)}</summary><div class="ak-lazyisi"></div></details>`; })() : "";
    return bagB("Pakar sejenis", baris.length ? `<ol class="ak-sdaftar ak-pkl ak-pkl-2s">${baris.slice(0, 6).join("")}</ol>${lagi}` : ""); };  const kiprahHtml = tk => riwayatTk(tk) + pendidikanTk(tk) + (dlist(tk?.kiprah).length ? `<section class="ak-dbagian"><h3>Kiprah EBET</h3><ol class="ak-linimasa">${dlist(tk.kiprah).slice().sort((p, q) => (+q.tahun || 0) - (+p.tahun || 0)).map(k => `<li${k.tahun ? "" : ' class="tanpa-th"'}><b>${esc(k.tahun || "")}</b><span>${esc(bersihWiki(k.teks))} ${cip(k.sumber_url)}</span></li>`).join("")}</ol></section>` : "");
  function buka(o, tk) {
    tk = tk || tkArr.find(t => t.pakar_id === o[0]) || tkArr.find(t => !t.pakar_id && pakarSama(t) === o); if (tk && !o[9] && urlOk(tk.foto_url)) o[9] = urlOk(tk.foto_url);
    const IK = {buka: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'};
    const tautan = [[`https://openalex.org/${o[0]}`, "OpenAlex"], o[10] && [`https://sinta.kemdiktisaintek.go.id/authors/profile/${o[10]}`, "SINTA"],
[`https://scholar.google.com/scholar?q=${encodeURIComponent('"' + o[1] + '"')}`, "Google Scholar"]].filter(Boolean);
    const status = o[13] === "s" ? ["ok", "Terdaftar di SINTA"] : o[13] === "x" ? ["", "Tidak ditemukan di SINTA"] : ["", "Belum dicocokkan dengan SINTA"];
    /* kepala lembar: foto, nama, institusi, label (prodi, SINTA, sektor) dan metrik semuanya di pita navy */
    const em = emailDari(o);
    $("akDIsi").innerHTML = `<div class="ak-dkepala ak-dk-pk"><div class="ak-pk-grid"><div class="ak-pk-foto">${sosok(o, true)}</div>
        <div class="ak-pk-tengah"><h2 id="akDNama">${esc(o[1])}</h2><p class="ak-pk-kp"><button type="button" class="ak-kp ak-kp-pil" data-kp="${esc(o[2])}" title="Buka profil kampus">${ikon(IK_KAMPUS, "currentColor")}${esc(o[2])}</button></p>
          <div class="ak-pil ak-mps">${status[0] === "ok" ? `<span class="ak-mp ak-mp-sinta">${ikon('<path d="m5 12 5 5 9-10"/>', "currentColor")}SINTA</span>` : `<span class="ak-mp ak-mp-redup">${esc(status[1])}</span>`}${tk ? pilPeranKb(tk.peran_energi) : ""}${o[15] === "diaspora" ? '<span class="ak-mp ak-mp-sinta">Diaspora</span>' : ""}${o[3].slice(0, 3).map(r => pilSektor(r)).join("")}${em ? `<a class="ak-mp ak-mp-a" href="mailto:${esc(em.list[0])}" title="Email kampus, bukan pribadi" aria-label="Email kampus, bukan pribadi">${ikon(IKON_MAIL, "currentColor")}Email</a>` : ""}${o[7] ? `<a class="ak-mp ak-mp-a" href="${esc(urlOrcid(o[7]))}" ${LUAR} title="ORCID" aria-label="ORCID">ORCID</a>` : ""}</div></div>
        <div class="ak-pk-angka">${metrik(o)}</div></div>
        <div class="ak-pojok">${dpTombol(o[0])}${koreksiBtn("pakar", o[0])}</div>${tk?.alasan ? `<p class="ak-rata ak-ringk">${esc(bersihWiki(tk.alasan))}</p>` : ""}<div class="ak-korw"></div></div>
      <div class="ak-dtubuh">${barisPakar(o)}${kiprahHtml(tk)}
        ${o[12] ? `<section class="ak-dbagian"><h3>Bidang menurut SINTA</h3><p>${esc(o[12])}</p></section>` : ""}
        <section class="ak-dbagian"><h3>Topik riset utama</h3><div class="ak-topik">${o[8].map(t => `<span>${ikon('<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>', "currentColor")}${esc(t)}</span>`).join("")}</div></section>
        <section class="ak-dbagian" id="akKeahlian" hidden><h3>Bidang keahlian EBET</h3><div></div></section>
        <section class="ak-dbagian" id="akOrcid" hidden><h3>Pendidikan dan riwayat jabatan</h3></section>
        <section class="ak-dbagian" id="akRingkas" hidden><h3>Ringkasan</h3><p></p></section>
        <section class="ak-dbagian" id="akMetrik" hidden><h3>Metrik publikasi menurut SINTA</h3><div></div></section>
        <section class="ak-dbagian" id="akTahunan" hidden><h3>Rekam jejak per tahun</h3><div class="ak-grafik2"></div></section>
        <section class="ak-dbagian" id="akScopus" hidden><h3>Artikel Scopus terbaru</h3><ol class="ak-karya"></ol></section>
        <section class="ak-dbagian" id="akKarya" hidden><h3>Karya ilmiah</h3>
          <div class="ak-ksaring"><div class="ak-seg" role="group" aria-label="Jenis karya"><button type="button" data-k="jenis" data-v="" aria-pressed="true">Semua</button><button type="button" data-k="jenis" data-v="jurnal" aria-pressed="false">Jurnal</button><button type="button" data-k="jenis" data-v="prosiding" aria-pressed="false">Prosiding</button><button type="button" data-k="jenis" data-v="buku" aria-pressed="false">Buku</button></div>
            <label class="ak-cari ak-kcari2"><span class="sr">Cari judul karya</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="search" autocomplete="off" placeholder="Cari judul karya"></label>
            <div class="ak-seg" role="group" aria-label="Urutkan karya"><span class="ak-seg-lbl">Urutkan</span><button type="button" data-k="urut" data-v="sitasi" aria-pressed="true">Paling dikutip</button><button type="button" data-k="urut" data-v="terbaru" aria-pressed="false">Terbaru</button></div></div>
          <ol class="ak-karya"></ol><nav id="akKHal" class="ak-hal" aria-label="Halaman daftar karya"></nav></section>
        <section class="ak-dbagian" id="akAfl" hidden><h3>Afiliasi lain</h3><div></div></section>
        <section class="ak-dbagian" id="akBukuP" hidden><h3>Buku</h3><div></div></section>
        <section class="ak-dbagian" id="akBrP" hidden><h3>Berita terkait</h3><div></div></section>
        <section class="ak-dbagian" id="akRisetW" hidden><h3>Riset wilayah</h3><div class="ak-wchip"></div></section>
        <section class="ak-dbagian" id="akKolab" hidden><h3>Sering menulis bersama</h3><ol class="ak-sdaftar"></ol></section>
        <div id="akPkAkhir">${akhirPakar(o)}</div>${tk ? tautanTk(tk) : ""}
        <section class="ak-dbagian"><h3>Profil di luar</h3><div class="ak-tautan" id="akTautan">${tautan.map(([u, n]) => `<a href="${esc(u)}" ${LUAR}>${n}${ikon(IK.buka, "currentColor")}</a>`).join("")}</div></section>
      </div>`;
    /* tiap bagian jadi kontainer yang bisa dilipat; id dan hidden ikut pindah supaya pengisi async tetap menemukannya */
    for (const sc of $("akDIsi").querySelectorAll("section.ak-dbagian")) {
      const d = document.createElement("details"), sum = document.createElement("summary"), isi = document.createElement("div");
      d.className = "ak-dbagian"; if (sc.id) d.id = sc.id; d.hidden = sc.hidden; d.open = true; isi.className = "ak-disi";
      sum.append(sc.querySelector("h3")); isi.append(...sc.childNodes); d.append(sum, isi); sc.replaceWith(d);
    }
    $("akLembar").hidden = false;
    document.body.style.overflow = "hidden";
    karya(o); keahlian(o);
    if (o[10]) rinciSinta(o);
    extraPakar(o); terhubungDi("P:" + o[0]);
    $("akLembar").querySelector(".ak-dlg").scrollTop = 0;
    $("akLembar").querySelector(".ak-x").focus();
  }
  function tutup() { $("akLembar").hidden = true; document.body.style.overflow = ""; }

  function siapkan(d) {
    const per = {};
    perK = {};
    semua.forEach(o => { o[3].forEach(r => { per[r] = (per[r] || 0) + 1; }); perK[o[2]] = (perK[o[2]] || 0) + 1; if (o[14] && !logoK[o[2]]) logoK[o[2]] = o[14]; });
    semua.forEach(o => { if (!o[14] && logoK[o[2]]) o[14] = logoK[o[2]]; });   // logo kampus dipinjam dari rekan sekampus yang sudah tercocokkan SINTA
    const kampus = Object.keys(perK).filter(k => jenisK(k) === "k").length;
    const IK = ['<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c3 0 5.5 2 5.5 5"/>', IK_GEDUNG, KAT.inovasi[1], IKP.data];
    /* statistik hero: angka nyata dari ringkas.json (potret); tanpa potret: dihitung dari data yang termuat */
    const TIL = [["proyek", "akProyekN", "/proyek", '<path d="M3 21V9l6 4V9l6 4V5h6v16z"/>'], ["MW tercatat", "akMwN", "/proyek", '<path d="M13 3 6 13h5l-1 8 7-10h-5z"/>'], ["organisasi", "akLembagaN", "lembaga", IK_GEDUNG], ["orang", "akTokohN", "tokoh", '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'],
      ...(semua.length ? [["pakar", "akPakarN", "pakar", IK[0]]] : []), ["regulasi", "akRegN", "/regulasi", IKJ], ["program", "akProgN", "/proyek", IKP.data], ["berita", "akBeritaN", "/berita", '<path d="M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M7 9h7M7 13h7M7 16h4"/>']];
    $("akAngka").innerHTML = TIL.map(([l, id, go, ic]) => `<div role="${go[0] === "/" ? "link" : "button"}" tabindex="0" data-go="${go}"><svg viewBox="0 0 24 24" aria-hidden="true">${ic}</svg><b id="${id}">${id === "akPakarN" ? angka(semua.length) : "..."}</b><span>${l}</span></div>`).join("");
    $("akAngka").style.setProperty("--n", TIL.length);
    const isi = (id, n) => { const e = $(id); if (e) e.textContent = n == null ? "-" : angka(n); };
    nanti(() => ambilData("ringkas").then(r => { const h = r?.hitung || {}, mw = dlist(r?.kartu).find(k => k.kode === "kapasitas");
      isi("akProyekN", h.proyek); isi("akMwN", mw?.nilai); isi("akLembagaN", h.organisasi); isi("akTokohN", h.orang); isi("akRegN", h.regulasi); isi("akProgN", h.program); isi("akBeritaN", h.berita);
      if (!r) [["lembaga", "akLembagaN"], ["tokoh", "akTokohN"]].forEach(([nm, id]) => ambilData(nm).then(d => isi(id, dlist(d).length))); }));
    const goTil = e => { const t = e.target.closest("[data-go]"); if (!t || (e.type === "keydown" && e.key !== "Enter")) return; if (t.dataset.go[0] === "/") location.assign(t.dataset.go); else if (t.dataset.go === "tokoh") { pilihKelompok("profesional"); tampil("pakar"); } else if (t.dataset.go === "pakar") { pilihKelompok("akademisi"); tampil("pakar"); } else tampil(t.dataset.go); };
    $("akAngka").addEventListener("click", goTil); $("akAngka").addEventListener("keydown", goTil);
    const bdIk = r => { const x = SEKTOR[r]; return x ? [x[1], x[2]] : null };
    $("akBdSlot")?.remove();   // dropdown bidang keahlian dibuang: bidang lintas sektor belum didefinisikan di ALG
    segarSektor();
  }

  function segmen(id, kunci, ubah) {
    $(id).addEventListener("click", e => {
      const b = e.target.closest("button[data-v]"); if (!b) return;
      st[kunci] = ubah(b.dataset.v);
      $(id).querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      nanti(() => { saring(); if (kunci === "sumber") segarSektor(); });   // angka bilah sektor ikut sumber (Semua/SINTA/...)
    });
  }

  /* ---------- tampilan lain: data staf dari /api/direktori/data/<nama>, dimuat saat tampilannya dibuka (404/503 = disembunyikan) ---------- */
  const TAMPIL_KEY = "ak-tampil";
  const DATA = {};
  /* adapter Pustaka: /data/pustaka.json (statis) -> bentuk "dokumen" tab; tiap butir menaut ke /pustaka?id= */
  const adaptDok = d => dlist(d?.baris).map(x => ({id: x.id, judul: x.judul, jenis: x.jenis, tahun: parseInt(String(x.tanggal || "").slice(0, 4), 10) || 0, penerbit: x.penerbit || "", sektor: x.kepakaran || [], url: "/pustaka?id=" + encodeURIComponent(x.id)}));
  const ambilLama = n => DATA[n] ||= fetch(n === "dokumen" ? "/data/pustaka.json" : n === "inovasi" ? "/data/inovasi.json" : `/api/direktori/data/${n}`, {credentials: "same-origin"}).then(r => r.ok ? r.json() : null).catch(() => null).then(x => { if (n === "dokumen" && x) x = adaptDok(x); if (x == null) delete DATA[n]; return x; });
  const urlDok = d => /^\/pustaka\?id=[\w%.-]+$/.test(d.url || "") ? d.url : urlOk(d.url) || urlOk(d.sumber_url);
  /* ---- potret baru (SKEMA-POTRET.md): organisasi, orang, proyek, regulasi dari /api/direktori/potret/<benda> (publik+anggota[+pengurus] sudah digabung Worker); diadaptasi ke bentuk layar ---- */
  const PB = {};
  const potretBaru = b => PB[b] ||= fetch(`/api/direktori/potret/${b}`, {credentials: "same-origin"}).then(r => r.ok ? r.json() : null).catch(() => null);
  const kodeSektor = a => [...new Set((Array.isArray(a) ? a : []).map(x => typeof x === "string" ? x : x?.kode).filter(k => SEKTOR[k]))];
  let PROV_KODE = null; const provKode = nama => { if (!PROV_KODE) PROV_KODE = Object.fromEntries(Object.entries(PROV).map(([k, v]) => [String(v).toLowerCase(), k])); return PROV_KODE[String(nama || "").toLowerCase()] || ""; };
  const fotoUrl = f => { if (/^\/img\/(orang|pengurus)\/[a-z0-9_-]+\.(webp|jpg|png)$/.test(f)) return f; const b = String(f?.berkas || f || "").split("/").pop(); return /^[a-z]{1,3}_[a-z0-9]{4,40}\.(jpg|jpeg|png|webp)$/.test(b) ? "/api/gambar/foto/" + b : ""; };
  const adaptOrg = o => { const L = o.lokasi || {}, ki = o.kontak_internal || {}; return {id: o.id, nama: JM.namaBaku(o.nama).nama, singkatan: o.singkatan || "", alias: dlist(o.nama_lain), kategori: o.kategori?.kode || "", skala: "", prov: provKode(L.provinsi), kab: L.kota || "", lat: L.lat, lon: L.lng, presisi: L.presisi || "", lokasi_sumber: L.presisi && L.presisi !== "tepat" ? (L.presisi === "kota" ? "perkiraan pusat kota/kabupaten (bukan alamat kantor)" : "perkiraan pusat provinsi (bukan alamat kantor)") : "", alamat: L.alamat || "", web: o.situs || "", logo: o.logo || "",
    sektor: kodeSektor(o.kepakaran), bidang: dlist(o.peran_rantai).map(String), meti: o.meti || (o.anggota_meti || o.keanggotaan_meti ? "anggota" : (EH_METI.test(o.nama || "") ? "pengurus" : null)), didirikan: o.tahun_berdiri, induk: typeof o.induk === "string" ? o.induk : "", diperiksa: o.diperiksa || "", telepon: dlist(ki.telepon), email: dlist(ki.surel), ringkasan: "",
    sumber: dlist(o.sumber).filter(x => x?.url).map(x => ({butir: "profil", url: x.url, diperiksa: x.tanggal})), anggota_meti: o.anggota_meti || o.keanggotaan_meti || null, pengurus_foto: dlist(o.pengurus_foto), pengurus_ormawa: dlist(o.pengurus_ormawa), _org: o}; };
  /* toggle keanggotaan METI (Semua, Anggota METI termasuk pengurus, Belum anggota) dengan hitungan; field meti = "pengurus" | "anggota" | null */
  const cocokMeti = (v, x) => !v || (v === "anggota" ? !!x.meti : !x.meti);
  const segMeti = (id, arr, aktif) => { const n = {"": arr.length, anggota: arr.filter(x => x.meti).length, belum: arr.filter(x => !x.meti).length};
    return `<div class="ak-seg ak-segmeti" id="${id}" role="group" aria-label="${esc(t("dir.meti.judul"))}">${[["", t("dir.meti.semua")], ["anggota", t("dir.meti.anggota")], ["belum", t("dir.meti.belum")]].map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${v === (aktif || "")}"><span class="ak-sl">${esc(l)}</span><small>${angka(n[v])}</small></button>`).join("")}</div>`; };
  const segarMeti = (id, arr) => { const b = $(id); if (!b) return; const n = {"": arr.length, anggota: arr.filter(x => x.meti).length, belum: arr.filter(x => !x.meti).length}; b.querySelectorAll("button").forEach(x => { x.querySelector("small").textContent = angka(n[x.dataset.v]); }); };
  /* organisasi METI (pengurus/anggota): kartu memakai logo kecil, bukan pil panjang */
  const EH_METI = /^(masyarakat energi terbarukan indonesia|meti)\b/i;
  /* gelar di awal nama ("MSc Elrika Hamdi", "Dr. Ir. Budi") dipisah dari nama tampil */
  const RE_GELAR_AWAL = /^((?:prof|dr|dra|drs|ir|h|hj|msc|m\.?\s?sc|mt|m\.?\s?t|st|s\.?\s?t|se|s\.?\s?e|mm|m\.?\s?m|mba|phd|ph\.?\s?d|ipu|m\.?\s?eng)\.?,?\s+)+/i;
  const pecahGelar = n => { const s = String(n || "").trim(), m = s.match(RE_GELAR_AWAL); return m && s.length > m[0].length ? {nama: s.slice(m[0].length).trim(), gelar: m[0].trim().replace(/,$/, "")} : {nama: s, gelar: ""}; };
  /* afiliasi orang: organisasi utama (jabatan berlaku bukan METI), organisasi lain, jabatan METI; sumber jabatan[] (publik) + afiliasi[] (lapis anggota) */
  const afilOrang = o => { const isM = n => EH_METI.test(n || ""), pil = new Map(), jb = dlist(o.jabatan);
    const tambah = (nama, id, jab, kini) => { if (!nama || isM(nama)) return; const k = id || nrm(nama), e = pil.get(k); if (!e) pil.set(k, {nama, id: id || "", jab: jab || "", kini: !!kini}); else { if (kini && !e.kini) Object.assign(e, {jab: jab || e.jab, kini: true}); if (!e.id && id) e.id = id; } };
    tambah(o.organisasi_terkini, o.organisasi_id, o.jabatan_terkini, true);
    jb.forEach(j => tambah(j.organisasi, j.organisasi_id, j.jabatan, j.kini)); dlist(o.afiliasi).forEach(a => tambah(a.organisasi, a.organisasi_id, a.jabatan, true));
    const semua = [...pil.values()].sort((a, b) => b.kini - a.kini), mj = (jb.find(j => isM(j.organisasi) && j.kini) || jb.find(j => isM(j.organisasi)) || {}).jabatan || (isM(o.organisasi_terkini) ? o.jabatan_terkini : "") || "";
    return semua.length || mj ? {utama: semua[0]?.kini ? semua[0] : null, lain: semua.filter((e, i) => i || !semua[0].kini), semua, mj} : null; };
  const adaptOrang = o => { const pg = pecahGelar(o.nama); return {id: o.id, nama: pg.nama, gelar_awal: pg.gelar, meti: o.meti || (EH_METI.test(o.organisasi_terkini || "") ? "pengurus" : null), peran: o.jabatan_terkini || "", jenis: o.kelompok?.kode || "", lembaga: o.organisasi_terkini || "", lembaga_id: o.organisasi_id || "", afil: afilOrang(o), afiliasi: afilOrang(o)?.semua.map(e => ({nama_lembaga: e.nama})) || [], sektor: kodeSektor(o.kepakaran), prov: o.wilayah ? (o.wilayah.lingkup === "nasional" ? "nasional" : o.wilayah.provinsi || "") : "", wilayah: o.wilayah || null, kelompok_label: o.kelompok?.label || "", peran_energi: "",
    alasan: "", pernah_birokrasi: !!o.pernah_birokrasi, riwayat: dlist(o.jabatan).map(j => ({jabatan: j.jabatan, lembaga: j.organisasi, mulai: j.mulai, selesai: j.kini ? "" : j.selesai || "", sumber_url: j.sumber_url})), pendidikan: dlist(o.pendidikan), kiprah: dlist(o.kiprah),
    tautan: dlist(o.tautan).map(t => ({jenis: t.jenis === "profil-resmi" ? "web" : t.jenis, url: t.url})), foto_url: fotoUrl(o.foto), sumber: o.sumber_url ? [{butir: "profil", url: o.sumber_url, diperiksa: o.diperiksa}] : [], diperiksa: o.diperiksa || ""}; };
  /* METI Wilayah (berdiri atau segera) sebagai entri kategori "meti-wilayah": kontak resmi kantor, tertaut ke /meti-wilayah/<kode>. Gagal = tanpa entri. */
  const orgWilayahMeti = async () => { try {
    const [k, a] = await Promise.all([fetch("/data/meti-wilayah.json", {credentials: "same-origin"}).then(r => r.json()), fetch("/api/meti-wilayah", {credentials: "same-origin", headers: {"x-pb": "1"}}).then(r => r.ok ? r.json() : null)]);
    const nm = Object.fromEntries(dlist(k.provinsi).map(p => [p.kode, p.nama]));
    return dlist(a && a.wilayah).filter(w => nm[w.kode_prov] && (w.status === "berdiri" || w.status === "segera")).map(w => ({id: "mw_" + w.kode_prov, nama: "METI Wilayah " + nm[w.kode_prov], singkatan: "", alias: [], kategori: "meti-wilayah", skala: "provinsi", prov: w.kode_prov, kab: "", lat: null, lon: null, presisi: "", lokasi_sumber: "", alamat: w.sekretariat || "", web: location.origin + "/meti-wilayah/" + w.kode_prov, logo: "", sektor: [], bidang: [], meti: "pengurus", didirikan: null, induk: "", diperiksa: w.status_per || "", telepon: w.kontak_telp ? [w.kontak_telp] : [], email: w.kontak_surel ? [w.kontak_surel] : [], ringkasan: "", sumber: [], anggota_meti: null, pengurus_foto: [], pengurus_ormawa: [], _org: {}}));
  } catch (e) { return []; } };
  const ADAPTER = {lembaga: ["organisasi", async p => [...dlist(p.baris).map(adaptOrg), ...await orgWilayahMeti()]], tokoh: ["orang", p => dlist(p.baris).map(adaptOrang)], proyek: ["proyek", p => dlist(p.baris)], regulasi: ["regulasi", p => ({baris: dlist(p.baris), posisi_topik: dlist(p.posisi_topik)})], ringkas: ["ringkas", p => p]};
  const ambilData = n => ADAPTER[n] ? DATA[n] ||= potretBaru(ADAPTER[n][0]).then(p => p && (p.baris || n === "ringkas") ? ADAPTER[n][1](p) : (n === "proyek" || n === "regulasi" || n === "ringkas" ? null : ambilLama(n))).then(x => { if (x == null) delete DATA[n]; return x; }) : ambilLama(n);
  const urlOk = u => typeof u === "string" && /^(https?:\/\/|\/api\/gambar\/(logo|foto)\/|\/img\/logo\/)/i.test(u.trim()) ? u.trim() : "";
  const urlDoi = d => d ? urlOk(/^https?:\/\//i.test(d) ? d : "https://doi.org/" + String(d).replace(/^doi:\s*/i, "")) : "";
  const urlOA = id => id ? urlOk(/^https?:\/\//i.test(id) ? id : "https://openalex.org/" + id) : "";
  const tglID = s => { if (!s) return ""; if (/^\d{4}$/.test(String(s))) return String(s); const d = new Date(String(s).slice(0, 10) + "T00:00:00Z");
    return isNaN(d) ? String(s) : (globalThis.JM && JM.tanggal ? JM.tanggal(String(s).slice(0, 10), {gaya: "panjang"}) : String(s).slice(0, 10)); };
  const provT = v => PROV[v] || (v == null ? "" : String(v));
  const kapital = s => s ? s[0].toUpperCase() + s.slice(1) : "";
  const dlist = a => Array.isArray(a) ? a : [];
  /* bulatkan dulu, lalu naik satuan bila hasilnya >= 1000 (tidak ada "1.000 juta") */
  const SATUAN = [[1e12, "triliun"], [1e9, "miliar"], [1e6, "juta"]];
  const ringkasUang = (n, awal) => { n = Number(n) || 0; for (let i = SATUAN.length - 1; i >= 0; i--) { if (n < SATUAN[i][0]) continue; let k = i, v = Math.round(n / SATUAN[k][0] * 10) / 10; while (v >= 1000 && k > 0) { k--; v = Math.round(n / SATUAN[k][0] * 10) / 10; } return `${awal} ${angka(v)} ${SATUAN[k][1]}`; } return awal + " " + angka(Math.round(n)); };
  const rpRingkas = n => ringkasUang(n, "Rp");
  const IK_KAMPUS = '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c2 2 10 2 12 0v-5"/>', IK_SEMUA = '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>';
  const lbl = (c, ik, t) => `<em${c ? ` class="${c}"` : ""} title="${esc(t)}">${ik ? ikon(ik, "currentColor") : ""}<span>${esc(t)}</span></em>`;
  const hantuHtml = '<div class="ak-hantu"></div>';
  const kosongHtml = () => "";   // pemilik: tanpa kotak galat; tab yang datanya tak ada disembunyikan (lihat sembunyiTab)
  const cariKotak = (id, ph) => `<label class="ak-cari"><span class="sr">${ph}</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="${id}" type="search" autocomplete="off" placeholder="${ph}"></label>`;
  /* pilihan "Semua" selalu paling kiri (aturan pemilik); tombol aktif awal tetap butir pertama aslinya */
  const segHtml = (id, judul, a) => { const v0 = a[0]?.[0], b = [...a.filter(x => /^semua\b/i.test(x[1])), ...a.filter(x => !/^semua\b/i.test(x[1]))]; return `<div class="ak-seg" id="${id}" role="group" aria-label="${judul}">${b.map(([v, l, ik]) => `<button type="button" data-v="${esc(v)}" aria-pressed="${v === v0}">${ik ? `<svg class="ak-ikon" viewBox="0 0 24 24" aria-hidden="true">${ik}</svg>` : ""}${l}</button>`).join("")}</div>`; };
  const chipsSektor = rows => `<button type="button" data-r="" aria-pressed="true">${ikon(IK_SEMUA, "currentColor")}Semua sektor</button>` + rows.map(([r, n]) => { const [l, ic, w] = SEKTOR[r] || [r, "", "var(--ink2)"];
    return `<button type="button" data-r="${esc(r)}" aria-pressed="false">${ic ? ikon(ic, w) : ""}${esc(l)}<span>${angka(n)}</span></button>`; }).join("");
  const setChip = (id, v) => $(id).querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.r === v)));
  const setSeg = (id, v) => $(id).querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === v)));
  const tabelHtml = (kol, baris) => `<div class="ak-tw jm-gulir"><table class="jm-tabel ak-t2"><thead><tr>${kol.map(([l, c]) => `<th class="${c || ""}">${l}</th>`).join("")}</tr></thead><tbody>${baris.map(r => `<tr>${r.map((x, i) => `<td class="${kol[i][1] || ""}">${x}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const tautanLuar = (u, t) => u ? `<a href="${esc(u)}" ${LUAR}>${t}</a>` : "";
  const hostLabel = u => esc(urlHost(u));

  /* pemilih bergaya kampus (tombol + popup bercari). opsi() = [[nilai, label, jumlah]]; mengembalikan fungsi penyegar label */
  const opsiBtn = (v, l, c, a, ik) => `<button type="button" role="option" data-v="${esc(v)}" aria-selected="${a}">${ik || ""}<span>${esc(l)}</span>${c != null ? `<small>${angka(c)}</small>` : ""}</button>`;
  const htmlPilih = (id, ik, cari) => `<div class="ak-kampus-pilih" id="${id}" data-gen><button type="button" class="ak-kbtn" aria-haspopup="listbox" aria-expanded="false"><svg class="ak-ikon ak-kik" viewBox="0 0 24 24" aria-hidden="true">${ik}</svg><span><em></em></span><svg class="ak-panah" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><div class="ak-kpop" hidden><label class="ak-kcari"><span class="sr">${cari}</span><input type="search" autocomplete="off" placeholder="${cari}"></label><div class="ak-kdaftar" role="listbox" aria-label="${cari}"></div></div></div>`;
  function pasangPilih(id, {opsi, nilai, pilih, semua, ik, lg, multi}) {
    if (!lg && /provinsi/i.test(semua || "")) lg = v => /^\d{2}$/.test(String(v)) ? [lambangUrl(String(v), "")] : null;   // pemilih provinsi: lambang provinsi tiap opsi
    const k = $(id), btn = k.querySelector(".ak-kbtn"), pop = k.querySelector(".ak-kpop"), q = k.querySelector("input"), dft = k.querySelector(".ak-kdaftar");
    const label = () => { const v = nilai(); let t; if (multi) { const a = [...v].map(y => opsi().find(x => x[0] === y)?.[1] || y); t = !a.length ? semua : a.length <= 2 ? a.join(", ") : a.length + " dipilih"; } else t = v ? (opsi().find(x => x[0] === v)?.[1] || v) : semua; k.querySelector(".ak-kbtn > span").innerHTML = `<em>${esc(t)}</em>`; };
    const dflt = btn.querySelector(".ak-kik")?.innerHTML || "", dik = (v, semuaOpsi) => { const lu = !semuaOpsi && lg ? lg(v) : null; if (lu && lu.length) return /^\/lambang\//.test(lu[0]) ? lambangHtml(lu[0], 22) : lgoIkon(lu, IK_GEDUNG, "var(--ink2)", 1); const sp = !semuaOpsi && ik ? ik(v) : null; return sp ? `<svg class="ak-ikon ak-opik" viewBox="0 0 24 24" aria-hidden="true" data-st="--w:${sp[1]}">${sp[0]}</svg>` : semuaOpsi && ik ? `<svg class="ak-ikon ak-opik" viewBox="0 0 24 24" aria-hidden="true">${IK_SEMUA}</svg>` : dflt ? `<svg class="ak-ikon ak-opik" viewBox="0 0 24 24" aria-hidden="true">${dflt}</svg>` : ""; };
    if (multi) { dft.setAttribute("aria-multiselectable", "true"); if (!k.querySelector(".ak-kselesai")) { const f = document.createElement("div"); f.className = "ak-kselesai"; f.innerHTML = '<button type="button">Selesai</button>'; pop.append(f); f.firstChild.addEventListener("click", () => tutupP()); } }
    const isi = () => { const t = q.value.trim().toLowerCase(), cur = nilai(), on = x => multi ? cur.has(x) : x === cur, o = opsi().filter(x => !t || x[1].toLowerCase().includes(t));
      dft.innerHTML = (t ? "" : opsiBtn("", semua, null, multi ? !cur.size : !cur, dik(null, true))) + (o.length ? o.slice(0, 300).map(x => opsiBtn(x[0], x[1], x[2], on(x[0]), dik(x[0]))).join("") : "<p>Tidak ada yang cocok.</p>"); };
    const tutupP = () => { pop.hidden = true; btn.setAttribute("aria-expanded", "false"); };
    btn.addEventListener("click", () => { const b = pop.hidden; document.querySelectorAll(".ak-kampus-pilih[data-gen]").forEach(x => x._tutup?.());
      if (b) { pop.hidden = false; btn.setAttribute("aria-expanded", "true"); q.value = ""; isi(); q.focus(); } });
    q.addEventListener("input", isi);
    dft.addEventListener("click", e => { const b = e.target.closest("button[data-v]"); if (!b) return; if (multi) { const y = dft.scrollTop; pilih(b.dataset.v); label(); isi(); dft.scrollTop = y; return; } tutupP(); pilih(b.dataset.v); label(); });
    k._tutup = tutupP; label(); return label;
  }
  document.addEventListener("click", e => { if (!e.target.isConnected) return; document.querySelectorAll(".ak-kampus-pilih[data-gen]").forEach(x => { if (!x.contains(e.target)) x._tutup?.(); }); });
  document.addEventListener("keydown", e => { if (e.key !== "Escape") return; const a = [...document.querySelectorAll(".ak-kampus-pilih[data-gen] .ak-kpop:not([hidden])")];
    if (!a.length) return; e.stopImmediatePropagation(); a.forEach(p => p.parentElement._tutup()); });
  const pasangHal = (id, fn) => $(id).addEventListener("click", e => { const b = e.target.closest("button[data-h]"); if (b && !b.disabled) fn(+b.dataset.h); });
  const gulirKe = id => $(id).scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start"});

  /* ----- riset daerah: indeks sekali, saring sesuai permintaan ----- */
  const R = {rset: new Set(), prov: "", kab: "", sektor: "", sumber: "", q: "", hal: 1}, RPER = 20;
  let risetArr = null, risetHasil = [], pakarRiset = new Map(), risetProv = {}, risetKab = {}, risetSektor = {}, risetSegar = null, rtok = 0;
  function indeksRiset(arr) {
    if (risetArr) return;
    risetArr = dlist(arr).filter(x => x && x.judul);
    for (const x of risetArr) {
      const w = new Set();
      for (const a of dlist(x.wilayah)) { if (!a || !a.prov) continue; w.add(String(a.prov)); if (a.kab) w.add(a.prov + "|" + a.kab); }
      x._w = w;
      for (const key of w) { const i = key.indexOf("|"); if (i < 0) risetProv[key] = (risetProv[key] || 0) + 1; else { const p = key.slice(0, i), kb = key.slice(i + 1); (risetKab[p] ||= {})[kb] = (risetKab[p][kb] || 0) + 1; } }
      x._cari = [x.judul, dlist(x.penulis).join(" "), x.jurnal, x.kampus].filter(Boolean).join(" ").toLowerCase();
      for (const r of dlist(x.sektor)) risetSektor[r] = (risetSektor[r] || 0) + 1;
      for (const id of dlist(x.pakar)) { if (!pakarRiset.has(id)) pakarRiset.set(id, []); pakarRiset.get(id).push(x); }
    }
    risetArr.sort((a, b) => (b.sitasi || 0) - (a.sitasi || 0) || (b.tahun || 0) - (a.tahun || 0));
  }
  function saringRiset() {
    const q = R.q.toLowerCase(), key = R.kab ? R.prov + "|" + R.kab : R.prov;
    risetHasil = risetArr.filter(x => (!key || x._w.has(key)) && cocokSektor(R.rset, dlist(x.sektor)) && (!R.sumber || (R.sumber === "int") === (x.sumber === "openalex")) && (!q || x._cari.includes(q)));
  }
  function barisRiset(x, i) {
    const pk = dlist(x.pakar).map(id => peta.get(id)).filter(Boolean), nm = new Set(pk.map(o => o[1].toLowerCase())), rp = dlist(x.sektor), w = (SEKTOR[rp[0]] || [])[2] || "var(--data1)";
    const lain = dlist(x.penulis).filter(n => !nm.has(String(n).toLowerCase())), tampil = [...pk.slice(0, 3).map(o => ({o})), ...lain.slice(0, Math.max(0, 3 - Math.min(pk.length, 3))).map(n => ({n}))], sisa = pk.length + lain.length - tampil.length;
    const meta = [x.jurnal && rapiJurnal(x.jurnal), x.tahun].filter(Boolean).join(", ");
    return `<li class="ak-rr2" role="button" tabindex="0" data-ri="${i}" aria-label="Buka ringkasan ${esc(rapiJudul(x.judul))}" data-st="--w0:${w}"><span class="ak-rr2-ik">${ikon(IKJ, "currentColor")}</span><div class="ak-rr2-m"><b class="ak-rr2-j">${esc(rapiJudul(x.judul))}</b>
      <div class="ak-rr2-meta">${esc(meta)}${x.oa ? '<span class="ak-mp ak-mp-sinta">Akses terbuka</span>' : ""}${rp.slice(0, 2).map(r => pilSektor(r)).join("")}</div>
      ${tampil.length ? `<div class="ak-rr2-p">${tampil.map(t => t.o ? `<button type="button" class="ak-rr2-pk" data-pk="${esc(t.o[0])}" title="Buka profil pakar"><span class="ak-sosok">${foto(t.o)}</span><b>${esc(t.o[1])}</b></button>` : `<span>${esc(t.n)}</span>`).join(", ")}${sisa > 0 ? `<small> +${angka(sisa)} penulis lain</small>` : ""}</div>` : ""}</div>
      ${x.sitasi != null ? `<span class="ak-rr2-k"><b>${angka(x.sitasi)}</b><small>kutipan</small></span>` : ""}</li>`;
  }
  function gambarRiset(gulir) {
    const n = risetHasil.length, a = (R.hal - 1) * RPER, wil = R.kab ? `${R.kab}, ${provT(R.prov)}` : R.prov ? provT(R.prov) : "Indonesia";
    $("akRJ").innerHTML = `<b>${angka(n)}</b> riset${R.rset.size ? " " + esc([...R.rset].map(k => (SEKTOR[k] || [k])[0].toLowerCase()).join(" dan ")) : ""} tentang ${esc(wil)}`;
    $("akRL").innerHTML = n ? `<ol class="ak-rlist">${risetHasil.slice(a, a + RPER).map((x, j) => barisRiset(x, a + j)).join("")}</ol>` : `<p class="ak-khampa">Tidak ada riset yang cocok. Longgarkan saringan.</p>`;
    $("akRH").innerHTML = navHal(R.hal, n, RPER, "riset");
    { const q2 = R.q.toLowerCase(), key = R.kab ? R.prov + "|" + R.kab : R.prov, c = {}; risetArr.forEach(x => { if ((!key || x._w.has(key)) && (!R.sumber || (R.sumber === "int") === (x.sumber === "openalex")) && (!q2 || x._cari.includes(q2))) for (const r of dlist(x.sektor)) c[r] = (c[r] || 0) + 1; }); kemasChip("akRR", c); }
    if (gulir) gulirKe("akRJ");
  }
  /* L45: ringkasan kebijakan per sektor dan provinsi (POST /api/direktori/ringkasan, Workers AI dari abstrak, cache R2 30 hari) */
  let rkSibuk = false, rktok = 0;
  const PESAN_RK = {401: "Masuk dulu sebagai anggota.", 400: "Pilihan sektor atau provinsi tidak sah.", 404: "Riset terlalu sedikit untuk diringkas. Pilih sektor atau provinsi yang lebih luas.", 429: "Batas ringkasan per jam tercapai. Coba lagi nanti.", 503: "Ringkasan otomatis belum tersedia.", 502: "Ringkasan gagal disusun. Coba lagi nanti."};
  function segarRk() { const b = $("akRRk"), n = $("akRRn"); if (!b) return; rktok++; b.disabled = !R.sektor || rkSibuk;
    n.textContent = R.sektor ? `${(SEKTOR[R.sektor] || [R.sektor])[0]}, ${R.prov ? provT(R.prov) : "seluruh Indonesia"}` : "Pilih satu sektor dulu"; $("akRRh").innerHTML = ""; }
  async function ringkasTemuan() {
    if (!R.sektor || rkSibuk) return; rkSibuk = true; const tk = ++rktok, h = $("akRRh"); $("akRRk").disabled = true; h.innerHTML = hantuHtml;
    let r, d; try { r = await fetch("/api/direktori/ringkasan", {method: "POST", credentials: "same-origin", headers: {"content-type": "application/json"}, body: JSON.stringify({sektor: R.sektor, prov: R.prov})}); d = await r.json().catch(() => ({})); } catch (e) { r = null; }
    rkSibuk = false; $("akRRk").disabled = !R.sektor; if (tk !== rktok) return;
    if (!r || !r.ok) { h.innerHTML = `<p class="ak-panel ak-rcatat">${esc(PESAN_RK[r?.status] || d?.galat || "Gagal memuat ringkasan. Periksa koneksi lalu coba lagi.")}</p>`; return; }
    nanti(() => { if (tk !== rktok) return;
      const kr = new Map(dlist(d.karya).map(k => [k.id, k])), tautan = id => { const k = kr.get(id), x = risetArr?.find(y => String(y.id || "").includes(id)), u = (x && (urlOk(x.url) || urlDoi(x.doi))) || urlOA(id);
        return u ? `<a class="ak-cip" href="${esc(u)}" ${LUAR} title="${esc(k?.judul || id)}">Sumber${k?.tahun ? " " + esc(k.tahun) : ""}</a>` : ""; };
      h.innerHTML = `<section class="ak-panel ak-lA"><div class="ak-pil"><span class="ak-r utama" data-st="--w0:var(--meti-oranye)">Ringkasan otomatis</span>${d.cache ? '<span class="ak-izin contoh">Dari simpanan</span>' : ""}${d.dibuat ? `<span class="ak-prodi">Dibuat ${esc(tglID(d.dibuat))}</span>` : ""}</div>
        <h2 class="ak-judulv"><b>${angka(dlist(d.temuan).length)}</b> temuan kunci, ${esc((SEKTOR[d.sektor] || [d.sektor])[0].toLowerCase())}, ${d.prov ? esc(provT(d.prov)) : "seluruh Indonesia"}</h2>
        <ol class="ak-rbutir ak-rkl">${dlist(d.temuan).map(t => `<li><span class="ak-rata">${esc(t.teks)}</span> ${dlist(t.karya).map(tautan).join(" ")}</li>`).join("")}</ol>
        ${dlist(d.implikasi).length ? `<div class="ak-rsimpul"><h4>Implikasi untuk pengembangan energi terbarukan</h4><ul class="ak-rbutir">${d.implikasi.map(t => `<li>${esc(t)}</li>`).join("")}</ul></div>` : ""}
        <p class="ak-lkaki">Ringkasan otomatis dari abstrak, periksa karya aslinya. Sumber: ${angka(dlist(d.karya).length)} riset teratas menurut sitasi dan kebaruan di tab Riset daerah (OpenAlex).</p></section>`; });
  }
  function bangunRiset(p) {
    p.innerHTML = `<div class="ak-saring"><div class="ak-alat">${cariKotak("akRQ", "Cari judul, penulis, jurnal, atau kampus")}</div>
      <div class="ak-baris">${htmlPilih("akRP", IKON_PIN, "Cari provinsi")}${htmlPilih("akRK", IKON_PIN, "Cari kabupaten atau kota")}</div>
      ${segHtml("akRS", "Sumber riset", [["", "Semua sumber", IK_SEMUA], ["int", "Jurnal internasional", IKJ], ["lokal", "Repositori kampus", IK_KAMPUS]])}
      <div id="akRR" class="ak-chip" role="group" aria-label="Sektor bahaya">${chipsSektor(Object.entries(risetSektor).sort((a, b) => b[1] - a[1]))}</div>
      <div class="ak-rkbaris"><button type="button" class="ak-tbl" id="akRRk" disabled>Ringkas temuan</button><span class="ak-tanda" id="akRRn"></span></div></div>
      <div id="akRRh"></div>
      <div class="ak-hasil" id="akRHasil"><h2 class="ak-judulv" id="akRJ"></h2><div id="akRL"></div><nav id="akRH" class="ak-hal" aria-label="Halaman daftar riset" aria-live="polite"></nav></div>`;
    const jalan = gulir => { const t = ++rtok; segarRk(); nanti(() => { if (t !== rtok) return; saringRiset(); gambarRiset(gulir); }); };
    $("akRRk").addEventListener("click", ringkasTemuan);
    const kabBox = () => { $("akRK").hidden = !(R.prov && risetKab[R.prov]); };
    const lP = pasangPilih("akRP", {semua: "Semua provinsi", nilai: () => R.prov, opsi: () => Object.entries(risetProv).sort((a, b) => b[1] - a[1]).map(([v, c]) => [v, provT(v), c]),
      pilih: v => { R.prov = v; R.kab = ""; R.hal = 1; kabBox(); lK(); jalan(false); }});
    const lK = pasangPilih("akRK", {semua: "Semua kabupaten dan kota", nilai: () => R.kab, opsi: () => Object.entries(risetKab[R.prov] || {}).sort((a, b) => b[1] - a[1]).map(([v, c]) => [v, v, c]),
      pilih: v => { R.kab = v; R.hal = 1; jalan(false); }});
    let tt = 0;
    $("akRQ").addEventListener("input", e => { clearTimeout(tt); tt = setTimeout(() => { R.q = e.target.value.trim(); R.hal = 1; jalan(false); }, 250); });
    $("akRS").addEventListener("click", e => { const b = e.target.closest("button[data-v]"); if (!b) return; R.sumber = b.dataset.v; R.hal = 1; setSeg("akRS", R.sumber); jalan(false); });
    $("akRR").addEventListener("click", e => { const b = e.target.closest("button[data-r]"); if (!b) return; R.rset = togglePilihan(R.rset, b.dataset.r); R.sektor = R.rset.size === 1 ? [...R.rset][0] : ""; R.hal = 1; tandaiPil("akRR", R.rset); nanti(() => jalan(false)); });
    pasangHal("akRH", h => { R.hal = h; gambarRiset(true); });
    const bukaR = e => { if (e.target.closest("[data-pk],a")) return; const li = e.target.closest("[data-ri]"); if (li) sheetRiset(risetHasil[+li.dataset.ri]); };
    $("akRL").addEventListener("click", bukaR);
    $("akRL").addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-ri]")) { e.preventDefault(); bukaR(e); } });
    risetSegar = () => { $("akRQ").value = R.q; lP(); lK(); kabBox(); tandaiPil("akRR", R.rset); setSeg("akRS", R.sumber); jalan(false); };
    risetSegar();
  }
  /* lembar riset: kepala seketika; ringkasan, penjelasan, kesimpulan (Workers AI dari abstrak), abstrak asli, topik, sitasi per tahun dimuat dari worker */
  const IK_LUAR = '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>', IK_PDF = '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M12 11v6m-3-3 3 3 3-3"/>';
  let risetId = "";
  /* data tambahan karya dari OpenAlex langsung (tanpa kunci): abstrak dari indeks terbalik, topik, penulis berafiliasi, pendana, sitasi per tahun */
  const abstrakDari = ix => { if (!ix || typeof ix !== "object") return ""; const a = []; for (const [w, ps] of Object.entries(ix)) for (const p of ps) a[p] = w; return a.filter(Boolean).join(" "); };
  const OAFIELD = "abstract_inverted_index,topics,keywords,authorships,primary_location,open_access,counts_by_year,referenced_works_count,related_works,funders,sustainable_development_goals";
  const ambilOA = wid => Promise.resolve(null).then(o => o && ({abstrak: abstrakDari(o.abstract_inverted_index), topik: dlist(o.topics).map(t => ({nama: t.display_name, bidang: t.field?.display_name || ""})), kunci: dlist(o.keywords).map(k => k.display_name).filter(Boolean),
    tahunan: dlist(o.counts_by_year).map(c => [c.year, c.cited_by_count]), pdf: urlOk(o.open_access?.oa_url) || "", oa: !!o.open_access?.is_oa, penulis: dlist(o.authorships).map(a => ({nama: a.author?.display_name || "", id: String(a.author?.id || "").replace("https://openalex.org/", ""), inst: dlist(a.institutions).map(i => ({nama: i.display_name, negara: i.country_code}))})),
    pendana: dlist(o.funders).map(f => f.display_name).filter(Boolean), sdg: dlist(o.sustainable_development_goals).map(g => g.display_name).filter(Boolean), rujukan: o.referenced_works_count || 0, terkait: dlist(o.related_works).length}));
  function sheetRiset(x) {
    if (!x) return;
    const u = urlOk(x.url) || urlDoi(x.doi) || urlOA(x.id), wid = String(x.id || "").match(/W\d{4,12}/)?.[0] || "", tk = risetId = wid || x.judul;
    const pk = dlist(x.pakar).map(id => peta.get(id)).filter(Boolean), nPen = Math.max(dlist(x.penulis).length, pk.length), wil = dlist(x.wilayah).filter(w => w && w.prov);
    const kepala = `<div class="ak-dkepala ak-rkepala"><div class="ak-dk-atas"><div class="ak-nama"><h2 id="akSJudul">${esc(rapiJudul(x.judul))}</h2><p>${esc([x.jurnal && rapiJurnal(x.jurnal), x.tahun].filter(Boolean).join(", "))}</p></div>
        <div class="ak-metrik ak-mt-t">${[["Kutipan", METRIK[2][3], angka(x.sitasi ?? 0)], ["Penulis", IK_ORANG, angka(nPen)], ["Pakar", IK_ORANG, angka(pk.length)], ["Tahun", IKL.tahun, x.tahun || "-"]].map(([l, d, v]) => `<div><span class="ak-mlabel">${ikon(d, "currentColor")}${l}</span><b>${esc(String(v))}</b></div>`).join("")}</div></div>
      <div class="ak-pil ak-mps">${dlist(x.sektor).map(r => pilSektor(r)).join("")}${x.oa ? '<span class="ak-mp ak-mp-sinta">Akses terbuka</span>' : ""}${u ? `<a class="ak-mp ak-mp-a" href="${esc(u)}" ${LUAR} title="Buka naskah" aria-label="Buka naskah">${ikon(IK_LUAR, "currentColor")}Buka naskah</a>` : ""}<span id="akRPdf"></span></div></div>`;
    bukaSheet("riset", kepala, () => `<div id="akRAb"></div><div id="akRAi"></div><div id="akRLain"></div><div id="akRPen"></div><div id="akRLem"></div><div id="akRPend"></div>`
      + (wil.length ? bagS("Wilayah kajian", `<div class="ak-pil ak-mps">${wil.slice(0, 12).map(w => `<span class="ak-mp">${lambangHtml(lambangUrl(String(w.prov), w.kab || ""), 14)}${esc(w.kab ? `${w.kab}, ${provT(w.prov)}` : provT(w.prov))}</span>`).join("")}</div>`) : ""));
    $("akSheet").dataset.k = "";
    /* penulis: yang ada di direktori memakai baris pakar seragam, lainnya teks biasa (diperkaya afiliasi dari OpenAlex bila tersedia) */
    const tulisPenulis = oa => { const el = $("akRPen"); if (!el) return; const pkNama = new Set(pk.map(o => o[1].toLowerCase())), ls = oa?.penulis?.length ? oa.penulis : dlist(x.penulis).map(n => ({nama: String(n), inst: []})).filter(a => a.nama);
      const lain = ls.filter(a => !pkNama.has(a.nama.toLowerCase())), kam = new Map(); ls.forEach(a => a.inst.forEach(i => { if (i.nama) kam.set(i.nama, (kam.get(i.nama) || 0) + 1); }));
      el.innerHTML = (pk.length || lain.length ? bagS(`Penulis, ${angka(ls.length || nPen)}`, `${pk.length ? `<ol class="ak-sdaftar ak-pkl ak-pkl-2s">${pk.map(o => barisPk(o)).join("")}</ol>` : ""}${lain.length ? `<ul class="ak-rpen">${lain.slice(0, 24).map(a => `<li><b>${esc(a.nama)}</b>${a.inst[0] ? `<small>${esc(potong(a.inst[0].nama, 60))}</small>` : ""}</li>`).join("")}${lain.length > 24 ? `<li><small>+${angka(lain.length - 24)} penulis lain</small></li>` : ""}</ul>` : ""}`) : "")
        ; const ll = $("akRLem"); if (ll && kam.size) ll.innerHTML = bagS(`Lembaga penulis, ${angka(kam.size)}`, `<div class="ak-ublg">${[...kam].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([n, c]) => `<div class="ak-ubl2">${lgoIkon(logoPemUrl(n), IK_GEDUNG, "var(--data1)")}<span><b>${esc(potong(n, 44))}</b><small>${angka(c)} penulis</small></span></div>`).join("")}</div>`); };
    tulisPenulis(null);
    if (!wid) return;
    Promise.all([fetch("/api/direktori/riset/" + wid, {credentials: "same-origin"}).then(r => r.ok ? r.json() : null).catch(() => null), ambilOA(wid)]).then(([d0, oa]) => nanti(() => {
      if (risetId !== tk || $("akSheet").hidden) return;
      const d = Object.assign({}, oa || {}, d0 || {}); if (oa) { for (const f of ["abstrak", "topik", "kunci", "tahunan", "pdf"]) if (!d0 || !(d0[f]?.length)) d[f] = oa[f]; }
      const ab = $("akRAb"), ai = $("akRAi"), ln = $("akRLain"); if (!ab || !ai || !ln) return;
      if (d.abstrak) ab.innerHTML = bagS("Abstrak", `<p class="ak-rata ak-ket-t" data-st="--n:6" data-ket="1" title="Klik untuk selengkapnya">${esc(d.abstrak)}</p>`);
      if (d.ai) ai.innerHTML = bagS(`Ringkasan <span class="ak-mp ak-mp-redup">ringkasan mesin</span>`.replace(/<[^>]+>/g, "").trim(), `<p class="ak-rata">${esc(d.ai.ringkasan)}</p>${dlist(d.ai.penjelasan).length ? `<ul class="ak-rbutir">${d.ai.penjelasan.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}${d.ai.kesimpulan ? `<p class="ak-rata"><b>Kesimpulan.</b> ${esc(d.ai.kesimpulan)}</p>` : ""}<small class="ak-lper">Ringkasan mesin dari abstrak. Periksa naskah asli sebelum dikutip.</small>`);
      if (d.pdf && $("akRPdf")) $("akRPdf").innerHTML = `<a class="ak-mp ak-mp-a" href="${esc(d.pdf)}" ${LUAR} title="Unduh PDF">${ikon(IK_PDF, "currentColor")}PDF</a>`;
      ln.innerHTML = (dlist(d.tahunan).length > 1 ? bagS("Kutipan per tahun", grafik(d.tahunan, "Sitasi per tahun", "var(--meti-oranye)")) : "")
        + (dlist(d.topik).length || dlist(d.kunci).length ? bagS("Topik dan kata kunci", `<div class="ak-pil ak-mps">${dlist(d.topik).map(t => `<span class="ak-mp" title="${esc(t.bidang)}">${esc(t.nama)}</span>`).join("")}${dlist(d.kunci).slice(0, 12).map(k => `<span class="ak-mp ak-mp-redup">${esc(kapital(k))}</span>`).join("")}</div>`) : "");
      if (oa) { tulisPenulis(oa); if ($("akRPend") && oa.pendana.length) $("akRPend").innerHTML = bagS("Pendana", `<div class="ak-pil ak-mps">${oa.pendana.map(f => `<span class="ak-mp">${ikon(IK_UANG, "currentColor")}${esc(f)}</span>`).join("")}</div>`); }
    }));
  }
  function setWilRiset(prov, kab) { Object.assign(R, {rset: new Set(), prov, kab, sektor: "", sumber: "", q: "", hal: 1}); if (risetSegar) risetSegar(); }

  /* ----- kejadian besar ----- */
  const K = {jset: new Set(), jenis: "", hal: 1}, KPER = 18;
  let kejArr = [], kejHasil = [];
  const lokasiKej = k => [...dlist(k.kab), ...dlist(k.prov).map(provT)].filter(Boolean).join(", ");
  const pakarKej = k => dlist(k.riset?.pakar).filter(p => p && peta.has(p.id));
  function gambarKej(gulir) {
    kejHasil = kejArr.filter(k => cocokSektor(K.jset, [k.jenis]));
    const n = kejHasil.length, a = (K.hal - 1) * KPER;
    $("akKjJ").innerHTML = `<b>${angka(n)}</b> ${esc(t("dir.isu.satuan"))}${K.jenis ? ` ${esc((SEKTOR[K.jenis] || [K.jenis])[0].toLowerCase())}` : ""}${DATA._kejDiperbarui ? `<em class="ak-tanda">Diperbarui ${esc(tglID(DATA._kejDiperbarui))}</em>` : ""}`;
    $("akKjL").innerHTML = kejHasil.slice(a, a + KPER).map((k, j) => { const lok = lokasiKej(k), r = k.riset, rr = SEKTOR[k.jenis] || [], w = rr[2] || "var(--ink2)", nK = r ? (r.works_total ?? dlist(r.works).length) : 0, nP = r ? pakarKej(k).length : 0, pv0 = dlist(k.prov)[0];
      return `<article class="ak-kjk2" role="button" tabindex="0" data-kj="${a + j}" aria-label="Buka ${esc(k.nama)}" data-st="--w0:${w}">
        <div class="ak-kj2-a"><span class="ak-kj2-ik">${rr[1] ? ikon(rr[1], "var(--on-brand)") : ""}</span><span class="ak-mp ak-kj2-j">${esc((rr[0] || kapital(k.jenis || "")))}</span><span class="ak-kj2-tgl">${esc(tglID(k.tanggal) || "")}</span>${k.jejak ? '<span class="ak-izin berlaku" title="Kronologi, dampak, pelajaran, dokumen, dan riset sesudahnya">Jejak lengkap</span>' : ""}</div>
        <h3>${esc(k.nama)}</h3>${lok ? `<p class="ak-kj2-l">${pv0 ? lambangHtml(lambangUrl(pv0, ""), 14) : ikon(IKON_PIN, "currentColor")}<span>${esc(lok)}</span></p>` : ""}
        <div class="ak-kj2-u"><div class="${nK ? "" : "nol"}">${ikon(IKL.jenis, "currentColor")}<b>${angka(nK)}</b><span>karya</span></div><div class="${nP ? "" : "nol"}">${ikon(IK_ORANG, "currentColor")}<b>${angka(nP)}</b><span>pakar</span></div></div></article>`; }).join("");
    $("akKjH").innerHTML = navHal(K.hal, n, KPER, "kejadian");
    if (gulir) gulirKe("akKjJ");
  }
  const bagS = (j, isi) => `<section class="ak-dbagian"><div class="ak-disi"><h3>${j}</h3>${isi}</div></section>`;
  /* jejak kejadian: ringkasan, angka dampak, kronologi, respons, pelajaran (berhasil, kurang, strategi berlabel analisis), dokumen, riset sesudahnya; tiap butir bersumber */
  const besar = (v, sat) => { const s = String(sat || ""), uang = /^(Rp|US\$)/.test(s); if (!uang) return `<b>${angka(v)}</b><small>${esc(s)}</small>`;
    const [b, t] = v >= 1e12 ? [1e12, "triliun"] : v >= 1e9 ? [1e9, "miliar"] : v >= 1e6 ? [1e6, "juta"] : [1, ""]; return `<b>${esc(s.split(" ")[0])} ${String(Math.round(v / b * 10) / 10).replace(".", ",")}</b><small>${t}${s.includes(" ") ? " " + esc(s.split(" ").slice(1).join(" ")) : ""}</small>`; };
  const daftarSm = (a, f) => `<ul class="ak-jj-ul">${a.map(x => `<li>${f(x)}</li>`).join("")}</ul>`;
  function jejakHtml(j) {
    if (!j) return "";
    const pl = j.pelajaran || {}, ok = dlist(pl.bagus), kr = dlist(pl.kurang), st = dlist(pl.strategi);
    const kol = (judul, cls, a, f) => a.length ? `<div class="ak-jj-pl ${cls}"><h4>${judul}</h4><ol>${a.map((x, i) => `<li>${f(x, i)}</li>`).join("")}</ol></div>` : "";
    const smb = x => dlist(x.sumber).map(cip).join("");
    return (j.ringkasan ? bagS("Ringkasan", `<p class="ak-rata">${esc(j.ringkasan)}</p>`) : "")
      + (dlist(j.dampak).length ? bagS("Angka dampak", `<div class="ak-jj-dmp">${dlist(j.dampak).filter(d => Number.isFinite(d.nilai)).map(d => `<a href="${esc(urlOk(d.sumber) || "#")}" ${LUAR} title="Sumber: ${esc(hostDari2(urlOk(d.sumber) || ""))}"><strong class="ak-jj-v">${besar(d.nilai, d.satuan)}</strong><em>${esc(d.label)}</em></a>`).join("")}</div>`) : "")
      + (dlist(j.kronologi).length ? bagS("Kronologi", `<ol class="ak-linimasa ak-jj-kr">${dlist(j.kronologi).map(c => `<li><b>${esc(tglID(c.tanggal) || c.tanggal || "")}</b><span>${esc(c.teks)} ${cip(c.sumber)}</span></li>`).join("")}</ol>`) : "")
      + (dlist(j.respons).length ? bagS("Respons dan pemulihan", daftarSm(dlist(j.respons), x => `${esc(x.teks)} ${cip(x.sumber)}`)) : "")
      + (ok.length || kr.length || st.length ? bagS("Pelajaran", `<div class="ak-jj-pls">${kol("Yang berhasil", "ok", ok, x => `${esc(x.teks)} ${smb(x)}`)}${kol("Yang kurang", "kr", kr, x => `${esc(x.teks)} ${smb(x)}`)}${kol('Strategi untuk kejadian berikutnya <em class="ak-izin contoh" title="Disusun dari butir berhasil dan kurang di sebelahnya, bukan kutipan dokumen">Analisis</em>', "st", st, x => `${esc(x.teks)}${dlist(x.dasar).length ? ` <small class="ak-lper">dasar: ${dlist(x.dasar).map(d => { const [g, n] = String(d).split(":"); return (g === "bagus" ? "berhasil " : "kurang ") + (Number(n) + 1); }).join(", ")}</small>` : ""}`)}</div>`) : "")
      + (dlist(j.dokumen).length ? bagS("Dokumen kaji cepat dan evaluasi", daftarBkr(dlist(j.dokumen).map(q => barisKaya({attr: hrefAttr(urlOk(q.url)), logo: lgoIkon([], IKJ, "var(--data1)"), nama: q.judul, pil: pilJenis(q.jenis) + (q.tahun ? pilMini(IKL.tahun, String(q.tahun)) : "") + (q.penerbit ? `<span class="ak-lper">${esc(q.penerbit)}</span>` : "")})))) : "")
      + (dlist(j.riset).length ? bagS("Riset kunci sesudah kejadian", `<ol class="ak-jj-rs">${dlist(j.riset).map(w => `<li><div class="ak-jj-rsk">${tautanLuar(urlOk(w.url), `<b>${esc(w.judul)}</b>`) || `<b>${esc(w.judul)}</b>`}<small>${esc(w.penulis || "")}${w.tahun ? ", " + esc(w.tahun) : ""}</small></div>${w.temuan ? `<p>${esc(w.temuan)}</p>` : ""}</li>`).join("")}</ol>`) : "");
  }
  function sheetKej(k) {
    const lok = lokasiKej(k), r = k.riset, rr = SEKTOR[k.jenis] || [], prv = dlist(k.prov).map(String);
    const kepala = `<div class="ak-dkepala"><div class="ak-dk-atas"><span class="ak-kj2-ik" data-st="--w0:${rr[2] || "var(--ink2)"};width:44px;height:44px">${rr[1] ? ikon(rr[1], "var(--on-brand)") : ""}</span><div class="ak-nama"><h2 id="akSJudul">${esc(k.nama)}</h2><p>${esc(tglID(k.tanggal))}${lok ? (k.tanggal ? ", " : "") + esc(lok) : ""}</p></div></div><div class="ak-pil">${pilSektor(k.jenis)}</div></div>`;
    bukaSheet("kejadian", kepala, () => {
      const pk = r ? pakarKej(k).slice(0, 10) : [], kr = r ? dlist(r.works).slice().sort((a, b) => (b.sitasi || 0) - (a.sitasi || 0)).slice(0, 10) : [];
      const sama = semua.filter(o => o[3].includes(k.jenis)), prov = sama.filter(o => prv.includes(String(provO(o)))).sort((a, b) => b[4] - a[4]).slice(0, 6), pakarId = new Set(pk.map(q => q.id)), nas = sama.filter(o => !pakarId.has(o[0]) && !prov.includes(o)).sort((a, b) => b[4] - a[4]).slice(0, 5);
      const lb = lbArr.filter(x => x.kategori !== "penerbit" && prv.includes(String(x.prov))).slice(0, 8);
      return jejakHtml(k.jejak) + (kr.length ? bagS(`Karya riset tertaut, ${angka(r.works_total ?? dlist(r.works).length)}`, `<ol class="ak-karya">${kr.map(w => barisKarya({url: urlDoi(w.doi) || urlOA(w.id), judul: w.judul, tahun: w.tahun, terbitan: w.jurnal, sitasi: w.sitasi})).join("")}</ol>`) : "")
        + (pk.length ? bagS("Pakar penulis di direktori", `<ol class="ak-sdaftar ak-pkl ak-pkl-2s">${pk.map(p => barisPk(peta.get(p.id))).join("")}</ol>`) : "")
        + (prov.length ? bagS(`Pakar ${esc((rr[0] || k.jenis || "").toLowerCase())} di provinsi ini`, `<ol class="ak-sdaftar ak-pkl ak-pkl-2s">${prov.map(o => barisPk(o)).join("")}</ol>`) : "")
        + (nas.length ? bagS(`Pakar ${esc((rr[0] || k.jenis || "").toLowerCase())} teratas nasional`, `<ol class="ak-sdaftar ak-pkl ak-pkl-2s">${nas.map(o => barisPk(o)).join("")}</ol>`) : "")
        + (lb.length ? bagS("Lembaga di lokasi", daftarBkr(lb.map(x => barisLb(x)))) : "") + '<div id="akKjPl"></div><div id="akKjSd"></div><div id="akKjBr"></div><div id="akKjDk"></div>';
    });
    $("akSheet").dataset.k = ""; const tk = tokenS;
    ambilData("temuan_riset").then(T => { const h = T ? pilarRiset(T.kejadian?.[k.id], T, "Temuan riset tentang kejadian ini") : ""; if (h) isiNanti(() => tk === tokenS, "akKjPl", h); });
    ambilData("sistem_data").then(d => { const a = dlist(Array.isArray(d) ? d : d?.sistem).filter(q => strs(q.sektor).includes(k.jenis)).slice(0, 6); if (a.length) isiNanti(() => tk === tokenS, "akKjSd", bagS(`Sistem data untuk ${esc((rr[0] || k.jenis || "").toLowerCase())}`, daftarBkr(a.map(q => barisSd(q))))); });
    ambilData("berita").then(d => { const tok = nrm(k.nama).split(" ").filter(w => w.length >= 5), a = dlist(Array.isArray(d) ? d : d?.berita).filter(b => tok.some(t => nrm(b.judul).includes(t))).slice(0, 5); if (a.length) isiNanti(() => tk === tokenS, "akKjBr", bagS("Berita terkait", `<ul class="ak-brt">${a.map(brtBaris).join("")}</ul>`)); });
    ambilData("dokumen").then(d => { const a = dlist(Array.isArray(d) ? d : d?.dokumen).filter(q => wilDok(q).some(w => prv.includes(String(w.prov))) && /renkon|laporan|kajian|RPB|krb/i.test(String(q.jenis))).slice(0, 5); if (a.length) isiNanti(() => tk === tokenS, "akKjDk", bagS("Dokumen terkait", daftarBkr(a.map(q => barisKaya({attr: hrefAttr(urlOk(q.url)), logo: lgoIkon([], IKJ, "var(--data1)"), nama: q.judul, pil: pilJenis(q.jenis) + (q.tahun ? pilMini(IKL.tahun, String(q.tahun)) : "")}))))); });
  }
  function bangunKej(p, d) {
    DATA._kejDiperbarui = d.diperbarui || "";
    kejArr = dlist(d.kejadian).filter(k => k && k.nama).sort((a, b) => String(b.tanggal || "").localeCompare(String(a.tanggal || "")));
    const n = {}; kejArr.forEach(k => { if (k.jenis) n[k.jenis] = (n[k.jenis] || 0) + 1; });
    p.innerHTML = `<div class="ak-saring"><div id="akKjC" class="ak-chip" role="group" aria-label="Sektor">${chipsSektor(Object.entries(n).sort((a, b) => b[1] - a[1]))}</div></div>
      <div class="ak-hasil"><h2 class="ak-judulv" id="akKjJ"></h2><div class="ak-kjgrid" id="akKjL"></div><nav id="akKjH" class="ak-hal" aria-label="Halaman kejadian" aria-live="polite"></nav></div>`;
    $("akKjC").addEventListener("click", e => { const b = e.target.closest("button[data-r]"); if (!b) return; K.jset = togglePilihan(K.jset, b.dataset.r); K.jenis = K.jset.size === 1 ? [...K.jset][0] : ""; K.hal = 1; tandaiPil("akKjC", K.jset); nanti(() => gambarKej(false)); });
    pasangHal("akKjH", h => { K.hal = h; gambarKej(true); });
    const buka1 = e => { const c = e.target.closest("[data-kj]"); if (c && kejHasil[+c.dataset.kj]) sheetKej(kejHasil[+c.dataset.kj]); };
    $("akKjL").addEventListener("click", buka1);
    $("akKjL").addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.dataset.kj != null) { e.preventDefault(); buka1(e); } });
    tandaiPil("akKjC", K.jset); gambarKej(false);
  }

  /* ----- jurnal ----- */
  const J = {q: "", hal: 1}, JPER = 25;
  let jurArr = [], jurHasil = [];
  function gambarJur(gulir) {
    const q = J.q.toLowerCase(); jurHasil = jurArr.filter(j => !q || j._cari.includes(q));
    const n = jurHasil.length, a = (J.hal - 1) * JPER;
    $("akJJ").innerHTML = `<b>${angka(n)}</b> jurnal energi terbarukan`;
    $("akJL").innerHTML = n ? `<div class="ak-jgrid">${jurHasil.slice(a, a + JPER).map(kartuJur).join("")}</div>` : `<p class="ak-khampa">Tidak ada jurnal yang cocok.</p>`;
    $("akJH").innerHTML = navHal(J.hal, n, JPER, "jurnal");
    if (gulir) gulirKe("akJJ");
  }
  function bangunJur(p, d) {
    jurArr = d.filter(j => j && j.nama).map(j => Object.assign(j, {_cari: [j.nama, j.penerbit, ...dlist(j.issn), ...dlist(j.subjek)].filter(Boolean).join(" ").toLowerCase()}));
    p.innerHTML = `<div class="ak-saring"><div class="ak-alat">${cariKotak("akJQ", "Cari nama jurnal, penerbit, ISSN, atau subjek")}</div></div>
      <div class="ak-hasil"><h2 class="ak-judulv" id="akJJ"></h2><div id="akJL"></div><nav id="akJH" class="ak-hal" aria-label="Halaman daftar jurnal" aria-live="polite"></nav></div>`;
    let tt = 0; $("akJQ").addEventListener("input", e => { clearTimeout(tt); tt = setTimeout(() => { J.q = e.target.value.trim(); J.hal = 1; nanti(() => gambarJur(false)); }, 250); });
    pasangHal("akJH", h => { J.hal = h; gambarJur(true); });
    gambarJur(false);
  }

  /* ----- pusat studi: hanya yang namanya terverifikasi ----- */
  const PS = {fs: {prov: new Set()}}; MSG.ps = {st: PS.fs, f: ["prov"], h: () => {}, g: () => gambarPs(), lab: (f, v) => provT(v)};
  let psArr = [];
  function gambarPs() {
    const l = psArr.filter(x => dalam(PS.fs.prov, [x.prov])), grup = {};
    l.forEach(x => { (grup[x.prov || ""] ||= []).push(x); });
    $("akPJ").innerHTML = `<b>${angka(l.length)}</b> pusat studi energi terbarukan${msAda("ps") ? " " + msChips("ps") : ""}`; msTandai("ps");
    $("akPL").innerHTML = Object.entries(grup).sort((a, b) => (provT(a[0]) || "~").localeCompare(provT(b[0]) || "~", "id")).map(([pv, a]) =>
      `<section class="ak-psgrup"><h3 class="ak-psh">${esc(provT(pv) || "Provinsi belum diketahui")}<small>${angka(a.length)}</small></h3><div class="ak-psgrid">${a.sort((x, y) => x.nama.localeCompare(y.nama, "id")).map(kartuPs).join("")}</div></section>`).join("")
      || `<p class="ak-khampa">Tidak ada pusat studi di provinsi ini.</p>`;
  }
  /* nama induk di data pusat studi yang ditulis lain di data pakar: disamakan supaya logo dan profil kampus ketemu */
  const INDUK_PS = {"IPB University": "Institut Pertanian Bogor", "Bina Nusantara University": "Universitas Bina Nusantara", "UIN Sultan Syarif Kasim Riau": "Universitas Islam Negeri Sultan Syarif Kasim Riau",
    "UIN Sunan Kalijaga Yogyakarta": "Universitas Islam Negeri Sunan Kalijaga", "UIN Walisongo Semarang": "Universitas Islam Negeri Walisongo Semarang", "Universitas Khairun": "Khairun University",
    "Universitas Kristen Satya Wacana": "Satya Wacana Christian University", "Universitas Maritim Raja Ali Haji": "Universitas Maritim Raja Ali Haji (UMRAH)",
    "Universitas Negeri Manado": "Manado State University", "Universitas Pertahanan Republik Indonesia": "Universitas Pertahanan"};
  const pilFokus = f => { const k = Object.keys(SEKTOR).find(r => (SEKTOR[r][0] || "").toLowerCase() === String(f).toLowerCase() || r === String(f).toLowerCase()); return k ? pilSektor(k) : pilMini(IKL.jenis, kapital(String(f))); };
  function kartuPs(x) {
    const ix = psArr.indexOf(x);
    x = x.induk && INDUK_PS[x.induk] && !perK[x.induk] ? {...x, induk: INDUK_PS[x.induk]} : x;
    const inst = x.kontak_level === "institusi", web = urlOk(x.web), em = emailOk(x.email) ? x.email : "", tel = typeof x.telepon === "string" ? x.telepon.trim() : "";
    const ada = x.induk && (perK[x.induk] || kampusInfo[x.induk]);
    return `<article class="ak-psk ak-ps" role="button" tabindex="0" data-ps="${ix}" aria-label="Buka ${esc(x.nama)}"><div class="ak-psatas">${x.induk ? logoKecil(x.induk) : ""}<h4>${esc(x.nama)}${x.singkatan ? ` <small>(${esc(x.singkatan)})</small>` : ""}</h4></div>
      <div class="ak-pil ak-mps">${x.induk ? (ada ? `<button type="button" class="ak-mp ak-mp-b" data-kp="${esc(x.induk)}" title="Profil kampus">${ikon(IK_KAMPUS, "currentColor")}${esc(x.induk)}</button>` : pilMini(IK_KAMPUS, x.induk)) : ""}${x.kota ? pilMini(IKON_PIN, x.kota) : ""}${dlist(x.fokus).slice(0, 5).map(pilFokus).join("")}</div>
      ${kontakIkon([web ? ikL(web, IKON_WEB, "Situs " + web, hostDari2(web), 1) : "", em ? ikL("mailto:" + em, IKON_MAIL, (inst ? "Email kampus " : "Email ") + em) : "", tel ? ikL("tel:" + tel.replace(/[^\d+]/g, ""), IK_TEL, (inst ? "Telepon kampus " : "Telepon ") + tel) : "", urlOk(x.sumber_url) ? ikL(x.sumber_url.trim(), IK_LUAR, "Sumber", "", 1) : ""])}</article>`;
  }
  function sheetPs(x0) {
    const x = x0.induk && INDUK_PS[x0.induk] && !perK[x0.induk] ? {...x0, induk: INDUK_PS[x0.induk]} : x0, web = urlOk(x.web), em = emailOk(x.email) ? x.email : "", tel = typeof x.telepon === "string" ? x.telepon.trim() : "", fk = dlist(x.fokus), rk = fk.map(f => Object.keys(SEKTOR).find(r => (SEKTOR[r][0] || "").toLowerCase() === String(f).toLowerCase())).filter(Boolean);
    const kepala = `<div class="ak-dkepala"><div class="ak-dk-atas">${x.induk ? logoKecil(x.induk) : ""}<div class="ak-nama"><h2 id="akSJudul">${esc(x.nama)}${x.singkatan ? ` <small>(${esc(x.singkatan)})</small>` : ""}</h2><p>${x.induk ? `<button type="button" class="ak-pk" data-kp="${esc(x.induk)}">${esc(x.induk)}</button>` : ""}${x.kota ? `, ${esc(x.kota)}` : ""}</p></div></div><div class="ak-pil ak-mps">${fk.map(pilFokus).join("")}${web ? `<a class="ak-mp ak-mp-a" href="${esc(web)}" ${LUAR}>${ikon(IKON_WEB, "currentColor")}${esc(hostDari2(web))}</a>` : ""}${em ? `<a class="ak-mp ak-mp-a" href="mailto:${esc(em)}" title="${esc(em)}">${ikon(IKON_MAIL, "currentColor")}Email</a>` : ""}${tel ? `<a class="ak-mp ak-mp-a" href="${esc(telHref(tel))}">${ikon(IK_TEL, "currentColor")}${esc(telF(tel))}</a>` : ""}</div></div>`;
    bukaSheet("detail", kepala, () => {
      const pk = x.induk ? semua.filter(o => o[2] === x.induk && (!rk.length || o[3].some(r => rk.includes(r)))).sort((a, b) => b[4] - a[4]).slice(0, 8) : [];
      return (pk.length ? bagB(`Pakar kampus ini dengan sektor yang cocok, ${angka(pk.length)} orang`, `<ol class="ak-sdaftar ak-pkl ak-pkl-2s">${pk.map(o => barisPk(o)).join("")}</ol>`) : "") + '<div id="akPsAs"></div><div id="akPsIn"></div>';
    });
    $("akSheet").dataset.k = ""; const tk = tokenS;
    if (x.induk) { ambilData("aset_riset").then(d => { const a = dlist(d).filter(q => q && nrm(String(q.pemilik || "")).includes(nrm(x.induk))); if (a.length) isiNanti(() => tk === tokenS, "akPsAs", bagB(`Aset riset kampus ini, ${angka(a.length)}`, `<div class="ak-psgrid">${a.slice(0, 6).map(kartuAs).join("")}</div>`)); });
      ambilData("inovasi").then(d => { const a = dlist(Array.isArray(d) ? d : d?.inovasi).filter(q => dlist(q.pembuat).some(b => b.nama && nrm(b.nama).includes(nrm(x.induk)))); if (a.length) isiNanti(() => tk === tokenS, "akPsIn", bagB(`Inovasi kampus ini, ${angka(a.length)}`, daftarBkr(a.slice(0, 8).map(q => barisInovasi(q))))); }); }
  }
  function bangunPs(p, d) {
    psArr = d.filter(x => x && x.nama && x.nama_terverifikasi === true);
    if (!psArr.length) throw new Error("kosong");
    const n = {}; psArr.forEach(x => { n[x.prov || ""] = (n[x.prov || ""] || 0) + 1; });
    p.innerHTML = `${segHtml("akPS", "Tampilan pusat studi", [["pusat", "Pusat studi", IK_KAMPUS], ["aset", "Aset riset", KAT.riset[1]]])}<div id="akPsA" class="ak-tampilan"></div><div id="akPsB" class="ak-tampilan" hidden></div>`;
    $("akPS").addEventListener("click", e => { const b = e.target.closest("button[data-v]"); if (b) subPs(b.dataset.v); });
    const bukaPs = e => { if (e.target.closest("a, button")) return; const c = e.target.closest("[data-ps]"); if (c && psArr[+c.dataset.ps]) sheetPs(psArr[+c.dataset.ps]); };
    p.addEventListener("click", bukaPs); p.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.dataset?.ps != null) { e.preventDefault(); bukaPs(e); } });
    asSiap = false;
    $("akPsA").innerHTML = `<div class="ak-saring"><div class="ak-baris">${htmlPilih("akPP", IKON_PIN, "Cari provinsi")}</div></div>
      <div class="ak-hasil"><h2 class="ak-judulv" id="akPJ"></h2><div id="akPL"></div></div>`;
    msPilih("akPP", "ps", "prov", {semua: "Semua provinsi", opsi: () => Object.entries(n).filter(([v]) => v).sort((a, b) => b[1] - a[1]).map(([v, c]) => [v, provT(v), c])});
    $("akPL").addEventListener("click", e => { const kp = e.target.closest("[data-kp]"); if (kp) profilKampus(kp.dataset.kp); });
    gambarPs(); subPs(psSub);
  }

  /* ----- pengadaan kajian: pagu rencana (SIRUP), bukan nilai kontrak ----- */
  const A = {fs: {prov: new Set(), tahun: new Set(), jenis: new Set()}, hal: 1}, APER = 25; MSG.pg = {st: A.fs, f: ["prov", "tahun", "jenis"], h: () => { A.hal = 1; }, g: () => gambarPeng(false), lab: (f, v) => f === "prov" ? provT(v) : kapital(String(v))};
  let pengArr = [], pengHasil = [];
  function gambarPeng(gulir) {
    pengHasil = pengArr.filter(x => dalam(A.fs.prov, [x.prov]) && dalam(A.fs.tahun, [String(x.tahun)]) && dalam(A.fs.jenis, [x.jenis]));
    const n = pengHasil.length, a = (A.hal - 1) * APER, total = pengHasil.reduce((s, x) => s + (Number(x.nilai_rp) || 0), 0);
    const wil = [A.fs.tahun.size && "tahun " + [...A.fs.tahun].sort().join(", "), A.fs.prov.size ? "di " + [...A.fs.prov].map(provT).join(", ") : !A.fs.tahun.size ? "di seluruh Indonesia" : ""].filter(Boolean).join(" ");
    $("akGJ").innerHTML = `<b>${esc(rpRingkas(total))}</b> pagu kajian energi ${esc(wil)}<em class="ak-tanda">Rencana pengadaan (SIRUP), bukan nilai kontrak</em>${msAda("pg") ? " " + msChips("pg") : ""}`; msTandai("pg");
    $("akGL").innerHTML = n ? tabelHtml([["Tahun", "c"], ["Instansi"], ["Judul"], ["Provinsi"], ["Pagu", "r"], ["Metode"]], pengHasil.slice(a, a + APER).map(x => { const u = urlOk(x.url);
      return [esc(x.tahun ?? ""), esc(x.instansi || ""), u ? tautanLuar(u, esc(x.judul)) : esc(x.judul), esc([x.kab, provT(x.prov)].filter(Boolean).join(", ")), x.nilai_rp != null ? "Rp " + angka(x.nilai_rp) : "Tidak tercatat", esc(x.metode || "")]; })) : `<p class="ak-khampa">Tidak ada pengadaan yang cocok.</p>`;
    $("akGH").innerHTML = navHal(A.hal, n, APER, "pengadaan");
    if (gulir) gulirKe("akGJ");
  }
  function bangunPeng(p, d) {
    pengArr = d.filter(x => x && x.judul).sort((a, b) => (b.tahun || 0) - (a.tahun || 0) || (b.nilai_rp || 0) - (a.nilai_rp || 0));
    const hit = f => { const n = {}; pengArr.forEach(x => { const v = f(x); if (v != null && v !== "") n[v] = (n[v] || 0) + 1; }); return n; };
    const nP = hit(x => x.prov), nT = hit(x => x.tahun), nJ = hit(x => x.jenis);
    p.innerHTML = `<div class="ak-saring"><div class="ak-baris ak-baris3">${htmlPilih("akGP", IKON_PIN, "Cari provinsi")}${htmlPilih("akGT", '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>', "Cari tahun")}${htmlPilih("akGE", IKL.jenis, "Cari jenis")}</div></div>
      <div class="ak-hasil"><h2 class="ak-judulv" id="akGJ"></h2><div id="akGL"></div><nav id="akGH" class="ak-hal" aria-label="Halaman daftar pengadaan" aria-live="polite"></nav></div>`;
    const ubah = (k, v) => { A[k] = v; A.hal = 1; nanti(() => gambarPeng(false)); };
    msPilih("akGP", "pg", "prov", {semua: "Semua provinsi", opsi: () => Object.entries(nP).sort((a, b) => b[1] - a[1]).map(([v, c]) => [v, provT(v), c])});
    msPilih("akGT", "pg", "tahun", {semua: "Semua tahun", opsi: () => Object.entries(nT).sort((a, b) => b[0] - a[0]).map(([v, c]) => [v, v, c])});
    msPilih("akGE", "pg", "jenis", {semua: "Semua jenis", opsi: () => Object.entries(nJ).sort((a, b) => b[1] - a[1]).map(([v, c]) => [v, kapital(v), c])});
    pasangHal("akGH", h => { A.hal = h; gambarPeng(true); });
    gambarPeng(false);
  }

  /* ----- lembaga mitra (docs/perencanaan): daftar, profil, analisa, proyek mitra; aset riset di tab Pusat studi -----
     Data staf dari /api/direktori/data/{lembaga,lembaga_3w,aset_riset} (R2). Layar membaca apa adanya; satu-satunya hitungan klien adalah agregat analisa. */
  const IK_TEL = '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>', IK_WA = '<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z"/><path d="M9 9c0 3 3 6 6 6l1-1.5-2-1-1 .8c-1-.5-2-1.5-2.5-2.5l.8-1-1-2z"/>';
  const IK_GEDUNG = '<path d="M4 21V8l8-5 8 5v13"/><path d="M9 21v-6h6v6M8 10h.01M16 10h.01"/>', IK_BAR = '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', IK_UANG = '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 15h2"/>';
  /* KAT = kategori organisasi K19d (14). Label ID tertanam = utang i18n; warna hanya token. 'penerbit' = pseudo-kategori jurnal kampus. */
  const IK_PIN2 = '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>';
  const KAT = {
    "bumn": ["BUMN", IK_GEDUNG, "var(--data1)"],
    "bumd": ["BUMD", IK_GEDUNG, "var(--data2)"],
    "swasta": ["Swasta", '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>', "var(--data3)"],
    "internasional": ["Internasional", '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>', "var(--data4)"],
    "kementerian-lembaga": ["Kementerian dan lembaga", IK_GEDUNG, "var(--data5)"],
    "pemda": ["Pemerintah daerah", IK_PIN2, "var(--data1)"],
    "perguruan-tinggi": ["Perguruan tinggi", '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c2 2 10 2 12 0v-5"/>', "var(--data2)"],
    "think-tank": ["Think tank", '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>', "var(--data3)"],
    "lsm-yayasan": ["LSM dan yayasan", '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M15.5 14.5c3 0 5.5 1.7 5.5 4.5"/>', "var(--data4)"],
    "donor": ["Donor", '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5c0-1 1-1.5 2.5-1.5s2.5.6 2.5 1.7c0 2.3-5 1.3-5 3.6 0 1 1 1.7 2.5 1.7s2.5-.6 2.5-1.5M12 6.5v1.5M12 16v1.5"/>', "var(--data5)"],
    "asosiasi": ["Asosiasi", '<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M11 7.3 6 16.8M13 7.3l5 9.5M7.5 19h9"/>', "var(--data1)"],
    "keuangan": ["Keuangan", '<path d="M3 10h18M5 10V7l7-4 7 4v3M6 10v8M10 10v8M14 10v8M18 10v8M4 21h16"/>', "var(--data2)"],
    "ormawa": ["Organisasi mahasiswa", '<path d="M12 3 3 8l9 5 9-5zM7 11v5c1.5 1.5 8.5 1.5 10 0v-5"/>', "var(--data3)"],
    "meti-wilayah": ["METI Wilayah", IK_PIN2, "var(--data2)"],
    "koperasi": ["Koperasi", '<path d="M12 20s-8-5-8-11a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 6-8 11-8 11z"/>', "var(--data4)"],
    penerbit: ["Penerbit jurnal", IKJ, "var(--data5)"]};
  Object.defineProperty(KAT, "inovasi", {value: KAT["think-tank"]}); Object.defineProperty(KAT, "riset", {value: KAT["perguruan-tinggi"]});   // alias ikon, tidak ikut daftar kategori
  const BIDANG = ["tanggap darurat", "SAR", "logistik", "kesehatan", "psikososial", "air dan sanitasi", "hunian", "pangan", "pendidikan", "perlindungan", "rehab-rekon", "PRB dan kesiapsiagaan", "pendanaan", "komunikasi", "data dan pemetaan", "riset"];
  const SKALA_L = {nasional: "Nasional", provinsi: "Provinsi", "kab/kota": "Kabupaten dan kota", internasional: "Internasional", regional: "Regional"};
  const KURS_USD = 18150, KURS_TGL = "30 Oktober 2026";   // kurs pasar open.er-api.com pada tanggal itu, tertulis di layar; perbarui bersama data bulanan
  const nrm = s => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const skalaKey = s => { s = String(s || "").toLowerCase().trim(); return /kab|kota/.test(s) ? "kab/kota" : s; };
  const norm62 = t => { const d = String(t).replace(/\D/g, ""); return d.startsWith("0") ? "62" + d.slice(1) : d; };
  const telF = t => { const d = norm62(t); if (!d.startsWith("62") || d.length < 9) return String(t);
    const r = d.slice(2), a = r[0] === "8" ? 3 : ["21", "22", "24", "31", "61"].includes(r.slice(0, 2)) ? 2 : 3, s = r.slice(a);
    return `+62 ${r.slice(0, a)}-${s.length > 4 ? s.slice(0, s.length - 4) + "-" + s.slice(-4) : s}`; };
  const telHref = t => /^\s*0/.test(String(t)) ? "tel:+" + norm62(t) : "tel:" + String(t).replace(/[^\d+]/g, ""), waHref = t => "https://wa.me/" + norm62(t);
  const strs = a => dlist(a).filter(v => typeof v === "string" && v.trim()).map(v => v.trim());
  const kabProv = x => [x.kab, provT(x.prov)].filter(Boolean).join(", ");
  const chainLogo = x => (window.JM?.logoOrg ? window.JM.logoOrg(x.id, x.nama, x.logo) : [x.logo]).filter(u => urlOkLogo(u));   /* resolver bersama /inti/logo_org.js */
  /* partner strategis: bintang emas dari strategis.json (kunci simpul graf L:/K:/G:) */
  let STRAT = null; const STAR_D = '<path d="m12 2.5 2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.8z"/>';
  const stratAktif = () => PT.lapis.strat && STRAT && Object.keys(STRAT).length > 0;
  const stratOn = () => PT.lapis.strat && STRAT && Object.keys(STRAT).length > 0;
  const strat = k => STRAT?.[k]?.bintang ? STRAT[k] : null;
  const bintangI = k => strat(k) ? `<i class="ak-bintang" title="Partner strategis" aria-label="Partner strategis"><svg viewBox="0 0 24 24" aria-hidden="true">${STAR_D}</svg></i>` : "";
  const denganBintang = (html, k) => strat(k) ? `<span class="ak-bw">${html}${bintangI(k)}</span>` : html;
  const pilStrat = k => strat(k) ? `<span class="ak-pstrat"><svg viewBox="0 0 24 24" aria-hidden="true">${STAR_D}</svg>Partner strategis</span>` : "";
  /* alasan strategis jadi ubin: angka besar di depan, label pendek di bawah */
  const ubinAlasan = v => { const m = String(v).match(/\d[\d.]*/); if (!m) return null; const n = m[0], t = String(v).toLowerCase();
    const lab = /pakar dan tokoh/.test(t) ? "pakar dan tokoh" : /mendanai/.test(t) ? "proyek didanai" : /sistem, inovasi/.test(t) ? "sistem dan inovasi" : /induk dari/.test(t) ? "cabang" : /rekam jejak/.test(t) ? "rekam jejak" : /simpul/.test(t) ? "simpul terhubung" : String(v).replace(m[0], "").replace(/\s+/g, " ").trim();
    return [n, lab, /pakar dan tokoh/.test(t) ? IK_ORANG : /mendanai|rekam jejak/.test(t) ? IK_JBT : /sistem, inovasi/.test(t) ? IK_BKU : IK_NET, String(v)]; };
  const IK_BKU = '<path d="M3 7h18v13H3zM8 7V4h8v3M3 13h18"/>', IK_JBT = '<path d="M2 12l5-4 4 2 4-2 5 4-6 6-3-2-3 2zM7 8l5 5"/>', IK_NET = '<circle cx="12" cy="5" r="2.2"/><circle cx="5" cy="18" r="2.2"/><circle cx="19" cy="18" r="2.2"/><path d="M12 7.2v4.3M12 11.5 6 16.2M12 11.5l6 4.7"/>';
  const alasanStrat = k => { const t = strat(k), a = dlist(t?.alasan).map(ubinAlasan).filter(Boolean); return t ? `<section class="ak-dbagian ak-strat"><div class="ak-disi"><h3>${ikon(STAR_D, "currentColor")}Mengapa partner strategis</h3>${a.length ? `<div class="ak-strip" data-st="--n:${a.length}">${a.map(([n, l, ik, ket]) => `<button type="button" data-lompat="${esc(l)}" title="${esc(ket)}, klik untuk melihat">${ikon(ik, "currentColor")}<span><b>${esc(n)}</b><small>${esc(l)}</small></span></button>`).join("")}</div>` : '<p class="ak-khampa">Masuk peringkat teratas menurut keterhubungan di direktori.</p>'}</div></section>` : ""; };
  /* ubin alasan strategis: klik melompat ke bagian profil yang memuat rinciannya */
  const LOMPAT = [[/pakar|tokoh/, /pakar|anggota|tokoh|alumni|orang|bekerja/], [/sistem|inovasi|aset|jurnal/, /sistem|inovasi|aset|jurnal|produk/], [/rekam|bantuan|penghargaan|kemitraan|proyek|dana/, /rekam|pendana|proyek|bantuan|penghargaan|mitra|dana/], [/simpul|cabang/, /jaringan|terhubung|cabang|induk/]];
  document.addEventListener("click", e => { const b = e.target.closest("[data-lompat]"); if (!b) return; const lab = b.dataset.lompat.toLowerCase(), cari = (LOMPAT.find(([k]) => k.test(lab)) || [, /terhubung/])[1];
    const akar = b.closest("[role=dialog], .ak-sheet, #akDrawer, .ak-lembar, .ak-modal") || document, sek = [...akar.querySelectorAll(".ak-bg, .ak-dbagian, section")].find(x => !x.contains(b) && cari.test((x.querySelector("h3, summary")?.textContent || "").toLowerCase()));
    if (!sek) return; if (sek.tagName === "DETAILS") sek.open = true; sek.scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start"}); sek.classList.add("ak-sorot"); setTimeout(() => sek.classList.remove("ak-sorot"), 1600); });
  const muatStrat = () => { if (STRAT) return; STRAT = {}; ambilData("strategis").then(d => { if (!d || typeof d !== "object" || Array.isArray(d)) return; STRAT = d; nanti(() => { if (lbArr.length && $("akLL")) { saringLb(); gambarLb(false); } segarPeta(); }); }); };
  const logoLb = x => { const k = KAT[x.kategori] || [x.kategori, KAT.riset[1], "var(--ink2)"]; return denganBintang(lgoIkon(chainLogo(x), k[1], k[2]), "L:" + x.id); };
  const pilKat = k => { const [l, d, w] = KAT[k] || [k, "", "var(--ink2)"]; return `<span class="ak-r utama" data-st="--w0:${w}">${d ? ikon(d, w) : ""}${esc(l)}</span>`; };
  const sumberButir = (x, butir) => dlist(x.sumber).find(s => s && s.butir === butir && urlOk(s.url));
  const lSum = (u, tgl) => u ? `<a class="ak-cip" href="${esc(u)}" ${LUAR} title="${esc(tgl ? "Diperiksa " + tglID(tgl) : "Buka sumber")}">${esc(hostDari2(u) || "sumber")}</a>` : "";
  const hostDari2 = u => { try { return new URL(u).hostname.toLowerCase().replace(/^www\./, ""); } catch (e) { return ""; } };
  const pihak3 = (x, u) => { const h = hostDari2(u), w = hostDari2(urlOk(x.web) || ""); return h && !/\.(go|or|ac|mil)\.id$|\.go\.id$/.test(h) && !(w && (h === w || h.endsWith("." + w) || w.endsWith("." + h))) ? '<small class="ak-izin contoh" title="Sumber bukan domain lembaga atau situs resmi pemerintah">Direktori pihak ketiga</small>' : ""; };
  const lSumB = (x, butir) => { const s = sumberButir(x, butir); return s ? lSum(urlOk(s.url), s.diperiksa) + pihak3(x, urlOk(s.url)) : ""; };
  const kItem = (x, butir, ik, lab, href, teks) => `<span class="ak-kt"><a class="ak-lnk" href="${esc(href)}"${href.startsWith("http") ? " " + LUAR : ""}>${ikon(ik, "currentColor")}<em>${lab}</em>${esc(teks)}</a></span>`;
  const IK_SALIN = '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>';
  const hubBtn = (ik, lab, href, teks, ext) => `<div class="ak-hubw"><a class="ak-hubk" href="${esc(href)}"${ext ? ` ${LUAR}` : ""}><span class="ak-hubi">${ikon(ik, "currentColor")}</span><span class="ak-hubt"><small>${lab}</small><b>${esc(teks)}</b></span></a><button type="button" class="ak-salin" data-salin="${esc(teks)}" title="Salin" aria-label="Salin ${esc(lab)}">${ikon(IK_SALIN, "currentColor")}</button></div>`;
  const pendekSos = (k, u) => { try { const U = new URL(u), ps = U.pathname.split("/").filter(Boolean), seg = (/^(user|c|channel)$/i.test(ps[0] || "") ? ps[1] : ps[0]) || "";   // youtube.com/user/Nama, /c/Nama
    return ["instagram", "tiktok", "x", "youtube", "facebook"].includes(k) && seg && !/^(profile\.php|pages|groups)$/i.test(seg) ? (seg.startsWith("@") ? seg : "@" + seg) : U.hostname.replace(/^www\./, ""); } catch (e) { return ""; } };
  const potong = (t, n) => { t = String(t || ""); return t.length > n ? t.slice(0, n - 1).trimEnd() + "..." : t; };
  const sosBtn = (k, u) => `<a class="ak-sos" href="${esc(u)}" ${LUAR} title="${esc(u)}" aria-label="${esc(kapital(k))}"><span class="ak-sosi">${ikon(IKM[k] || IKON_WEB, "currentColor")}</span><small>${esc(potong(pendekSos(k, u), 22))}</small></a>`;
  const sosMs = x => Object.entries({...(x.medsos && typeof x.medsos === "object" ? x.medsos : {}), ...(x.linkedin ? {linkedin: x.linkedin} : {}), ...(x.medsos_resmi && typeof x.medsos_resmi === "object" ? x.medsos_resmi : {})}).filter(([, v]) => urlOk(v)).map(([k, v]) => sosBtn(k, urlOk(v))).join("");
  const KB_SUMBER = new Set(["telepon", "wa", "email", "web", "linkedin", "instagram", "tiktok", "facebook", "x", "youtube"]);
  function kontakLb(x, semua) {
    const web = urlOk(x.web), hub = [...strs(x.telepon).map(t => hubBtn(IK_TEL, "Telepon", telHref(t), telF(t))), ...strs(x.wa).map(t => hubBtn(IK_WA, "WhatsApp", waHref(t), telF(t), 1)), ...strs(x.email).filter(emailOk).map(m => hubBtn(IKON_MAIL, "Email", "mailto:" + m, m))], sos = (web ? sosBtn("web", web) : "") + sosMs(x);
    if (!hub.length && !sos) return "";
    const hs = [...new Set(dlist(x.sumber).filter(sv => sv && KB_SUMBER.has(sv.butir) && urlOk(sv.url)).map(sv => urlOk(sv.url)))], dom = new Map(); hs.forEach(u => { const h = hostDari2(u); if (h && !dom.has(h)) dom.set(h, u); });
    const p3 = hs.some(u => pihak3(x, u));
    return `<div class="ak-kontak2">${hub.length ? `<div class="ak-hub">${hub.join("")}</div>` : ""}${sos ? `<div class="ak-sosrow">${sos}</div>` : ""}${dom.size ? `<small class="ak-lper ak-ksum">Sumber kontak: ${[...dom].map(([h, u]) => `<a href="${esc(u)}" ${LUAR}>${esc(h)}</a>`).join(", ")}${x.diperiksa ? `, diperiksa ${esc(tglID(x.diperiksa))}` : ""}${p3 ? ' <span class="ak-izin contoh">Direktori pihak ketiga</span>' : ""}</small>` : ""}</div>`; }
  const izinStatus = z => { if (!z || typeof z !== "object") return null;
    if (z.status === "dicabut") return ["dicabut", "Izin dicabut"];
    const d = z.berlaku_sampai ? new Date(String(z.berlaku_sampai).slice(0, 10) + "T23:59:59Z") : null;
    if (z.status === "habis" || (d && !isNaN(d) && d < new Date())) return ["habis", "Izin habis"];
    return z.status === "berlaku" || d ? ["berlaku", "Izin berlaku"] : ["belum", "Izin belum diperiksa"]; };
  const pilIzin = x => { const s = izinStatus(x.izin); if (!s) return "";
    return `<span class="ak-izin ${s[0]}" title="${esc([x.izin.jenis, x.izin.nomor, x.izin.berlaku_sampai && "berlaku sampai " + tglID(x.izin.berlaku_sampai)].filter(Boolean).join(", "))}">${s[1]}</span>`; };
  const izinPilLb = x => { const z = x.izin, st = izinStatus(z); if (!st) return ""; const t = [z.nomor && "SK " + z.nomor, z.berlaku_sampai && "berlaku s.d. " + tglID(z.berlaku_sampai)].filter(Boolean).join(", ");
    return `<span class="ak-izin ${st[0]}" title="${esc([z.jenis, t].filter(Boolean).join(", "))}">${esc(t ? "Izin " + t : st[1])}</span>`; };
  const pilMitra = x => x.mitra_meti?.bukti ? `<span class="ak-izin mitra" title="${esc([x.mitra_meti.bukti, x.mitra_meti.tahun].filter(Boolean).join(", "))}">Mitra METI</span>` : "";
  const pilContoh = () => "";
  const basi = x => x.diperiksa && Date.now() - new Date(String(x.diperiksa).slice(0, 10)).getTime() > 183 * 864e5;
  const lbPeriksa = x => x.diperiksa ? `<small class="ak-lper${basi(x) ? " basi" : ""}">Diperiksa ${esc(tglID(x.diperiksa))}${basi(x) ? ", lebih dari 6 bulan lalu" : ""}</small>` : "";
  const waktuMaks = a => a.map(x => String(x.diperiksa || "")).filter(Boolean).sort().pop() || "";

  const urlPeta = x => { const q = x.lokasi_sumber === "alamat" && Number.isFinite(x.lat) && Number.isFinite(x.lon) ? `${x.lat},${x.lon}` : [x.alamat, x.kab, provT(x.prov)].filter(Boolean).join(", "); return q ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q) : ""; };
  const tautPeta = (x, ringkas) => { const u = urlPeta(x); return u && (x.alamat || (Number.isFinite(x.lat) && Number.isFinite(x.lon))) ? `<a class="ak-lsum ak-gmaps" href="${esc(u)}" ${LUAR} title="Buka di Google Maps" aria-label="Buka di Google Maps">${ikon(IKON_PIN, "currentColor")}</a>` : ""; };
  /* ---- kartu proyek (3W dan pendanaan): judul dinormalkan, sektor tanpa kode DAC, pelaksana dirapikan ---- */
  const STOP_ID = new Set("a an and as at by for from in into of on or the to with via di dan untuk dari pada yang ke dengan atau dalam terhadap sebagai oleh".split(" ")), AKR = new Set("who fao ilo iom un undp usaid unicef wfp unhcr unesco ocha jica koica giz kfw adb aiib ngo ngos redd wash covid hiv aids gef gcf lipi brin ipb ugm itb world bank".split(" ").filter(w => w.length <= 5));
  const SEKTOR_ID = {"11120": "Fasilitas dan pelatihan pendidikan", "11182": "Riset pendidikan", "11220": "Pendidikan dasar", "11231": "Kecakapan hidup remaja", "11430": "Pelatihan teknis tingkat lanjut", "12110": "Kebijakan kesehatan", "12182": "Riset kesehatan", "12191": "Layanan kesehatan medis", "12196": "Statistik kesehatan", "12220": "Layanan kesehatan dasar", "12240": "Gizi dasar", "12250": "Pengendalian penyakit menular", "12261": "Pendidikan kesehatan", "12310": "Penyakit tidak menular", "12340": "Promosi kesehatan mental", "12350": "Pencegahan penyakit tidak menular lain", "13010": "Kebijakan kependudukan", "13020": "Kesehatan reproduksi", "13030": "Keluarga berencana", "13081": "Tenaga kesehatan reproduksi", "13096": "Data dan statistik kependudukan", "14010": "Kebijakan sumber daya air", "14015": "Perlindungan sumber daya air", "14030": "Air minum dan sanitasi dasar", "14031": "Air minum dasar", "14032": "Sanitasi dasar", "14040": "Pengembangan daerah aliran sungai", "14081": "Pendidikan air dan sanitasi", "15110": "Kebijakan sektor publik", "15111": "Manajemen keuangan publik", "15112": "Desentralisasi dan pemerintah daerah", "15113": "Antikorupsi", "15114": "Mobilisasi pendapatan daerah", "15126": "Statistik dan data", "15130": "Pengembangan hukum dan peradilan", "15142": "Pengawasan makroekonomi", "15143": "Pengawasan perpajakan", "15150": "Partisipasi demokratis dan masyarakat sipil", "15152": "Lembaga legislatif", "15153": "Media dan informasi", "15160": "Hak asasi manusia", "15170": "Organisasi dan gerakan perempuan", "15180": "Kekerasan terhadap perempuan", "15185": "Pemerintahan daerah", "16010": "Perlindungan sosial", "16011": "Jaminan sosial", "16050": "Bantuan multisektor layanan dasar", "16062": "Kapasitas statistik", "16066": "Budaya", "21010": "Kebijakan transportasi", "21011": "Infrastruktur transportasi", "22040": "Teknologi informasi dan komunikasi", "23110": "Kebijakan energi", "23111": "Kebijakan energi", "23112": "Regulasi energi", "23183": "Efisiensi energi", "23210": "Pembangkit energi terbarukan", "23231": "Pembangkit tenaga surya", "23631": "Jaringan listrik", "23642": "Mobilitas listrik", "24010": "Kebijakan keuangan", "24030": "Lembaga keuangan formal", "24040": "Keuangan mikro", "25010": "Kebijakan bisnis", "25030": "Layanan pengembangan usaha", "31110": "Kebijakan pertanian", "31120": "Pengembangan pertanian", "31150": "Input pertanian", "31161": "Produksi tanaman pangan", "31163": "Peternakan", "31165": "Pembangunan pertanian alternatif", "31166": "Penyuluhan pertanian", "31181": "Pendidikan pertanian", "31182": "Riset pertanian", "31193": "Layanan keuangan pertanian", "31210": "Kebijakan kehutanan", "31220": "Pengembangan kehutanan", "31261": "Kayu bakar dan arang", "31281": "Pendidikan kehutanan", "31282": "Riset kehutanan", "31291": "Layanan kehutanan", "31310": "Kebijakan perikanan", "31320": "Pengembangan perikanan", "31381": "Pendidikan perikanan", "32110": "Kebijakan industri", "32161": "Agroindustri", "32182": "Riset teknologi", "33110": "Kebijakan perdagangan", "33181": "Pendidikan perdagangan", "33210": "Pariwisata", "41010": "Kebijakan lingkungan", "41020": "Perlindungan atmosfer", "41030": "Keanekaragaman hayati", "41040": "Pelestarian situs", "41050": "Pengendalian air", "41081": "Pendidikan lingkungan", "41082": "Riset lingkungan", "43010": "Pembangunan multisektor", "43030": "Pembangunan perkotaan", "43040": "Pembangunan perdesaan", "43050": "Pembangunan alternatif", "43060": "Pengurangan risiko", "43071": "Ketahanan pangan", "43072": "Akses pangan", "43073": "Keamanan pangan", "43082": "Lembaga riset multisektor", "52010": "Bantuan pangan", "72010": "Bantuan material darurat", "72011": "Layanan kesehatan dasar darurat", "72012": "Pendidikan darurat", "72040": "Bantuan pangan darurat", "72050": "Koordinasi bantuan", "73010": "Rekonstruksi", "74010": "Pencegahan", "74020": "Kesiapsiagaan multi-bahaya", "91010": "Biaya administrasi donor", "99810": "Sektor tidak ditentukan", "99820": "Promosi kesadaran pembangunan"};
  const kataAkr = w => w.length <= 5 && (!/[AEIOU]/.test(w) || AKR.has(w.toLowerCase()));
  const kalimat = t => { t = String(t || "").trim(); if (!t) return ""; if (/[a-z]/.test(t) || t.length < 12) return t;
    return t.toLowerCase().replace(/[a-z0-9'’-]+/gi, (w, i) => { const u = w.toUpperCase(); if (kataAkr(u) && /[A-Z]/.test(u) && !STOP_ID.has(w)) return u; return i === 0 ? w[0].toUpperCase() + w.slice(1) : w; }); };
  const judulCase = t => { t = String(t || "").trim(); if (/[a-z]/.test(t)) return t; return t.toLowerCase().replace(/[a-z0-9'’-]+/gi, (w, i) => (kataAkr(w.toUpperCase()) && !STOP_ID.has(w)) ? w.toUpperCase() : (i && STOP_ID.has(w) ? w : w[0].toUpperCase() + w.slice(1))); };
  const sektorNama = v => { const m = String(v || "").match(/^(\d{4,5})\s*(.*)$/); if (!m) return kalimat(v); return SEKTOR_ID[m[1]] || kalimat(m[2]); };
  const pelaksanaList = v => [...new Set((Array.isArray(v) ? v : String(v || "").split(";")).map(x => String(x).trim()).filter(x => x && !/redacted/i.test(x)).map(judulCase))];   // IATI menulis "Supplier Name Redacted" untuk penerima yang dirahasiakan: dibuang
  const tahunSaja = (a, b) => { const t = [...new Set([a, b].filter(Boolean).map(t => String(t).slice(0, 4)))]; return t.join("–"); };
  const dari3w = p => ({id: p.id, judul: p.judul, donor: p.donor, pelaksana: p.pelaksana, sektor: p.sektor, prov: p.prov, usd: p.nilai_usd, asli: p.nilai_asli, mata: p.mata_uang_asli, mulai: p.mulai, selesai: p.selesai, status: p.status, url: p.sumber_url, ringkasan_id: p.ringkasan_id, judul_en: p.judul_en, salur: p.nilai_salur_usd, dok: p.tautan_dokumen});
  const dariDana = x => ({id: x.id, judul: x.nama, donor: x.pemberi, pelaksana: x.pelaksana?.length ? x.pelaksana : x.penerima, sektor: x.sektor || [], ringkasan_id: x.ringkasan_id, judul_en: x.judul_en, salur: x.nilai_salur_usd, prov: x.prov, usd: x.nilai_usd, asli: x.nilai, mata: x.mata_uang, mulai: x.tahun, selesai: x.selesai, status: x.status, url: urlOk(x.url) || urlOk(dlist(x.sumber)[0]?.url)});
  const CATATAN_PROYEK = () => `laporan donor ke IATI (proyek mitra 3W), bisa tidak lengkap. Rupiah dihitung dengan kurs Rp ${angka(KURS_USD)} per US$ (${KURS_TGL}).`;
  const gridProyek = (a, tanpaKurs) => `<div class="ak-pjg">${a.map(p => kartuPj(p)).join("")}</div>`;
  /* ---- daftar ---- */
  const lbMs = () => { MSG.lb = {st: LB.fs, f: ["prov", "skala", "bidang"], h: () => { LB.hal = 1; }, g: () => { saringLb(); gambarLb(false); }, lab: (f, v) => f === "prov" ? provT(v) : f === "skala" ? (SKALA_L[v] || kapital(v)) : kapital(String(v))}; };
  const LB = {katSet: new Set(), q: "", fs: {prov: new Set(), skala: new Set(), bidang: new Set()}, kat: "", sub: "", sensor: false, hal: 1}, LPER = 24;
  let lbArr = [], lbMap = new Map(), lbCabang = new Map(), lbHasil = [], ltok = 0, lbSub = "peta", dpl = new Set();
  const DPL_KEY = "ak-dpl";
  const bacaDpl = () => { try { return new Set(JSON.parse(localStorage.getItem(DPL_KEY)) || []); } catch (e) { return new Set(); } };
  const RE_NAMA = [];   // pola nama lembaga -> sektor; diisi dari data METI bila perlu
  const RE_SENSOR = [];
  function turunSektor(x) {
    const m = new Map(), add = (r, a) => { if (!m.has(r)) m.set(r, a); };
    strs(x.sektor).forEach(r => add(r, "sektor tercatat di laman lembaga"));
    dlist(x.sensor).forEach(sn => RE_SENSOR.forEach(([re, rs]) => { if (re.test(sn?.jenis || "")) rs.forEach(r => add(r, `punya ${sn.jenis}`)); }));
    const t = [x.nama, x.singkatan, x.sub, ...strs(x.alias)].join(" "); RE_NAMA.forEach(([re, rs, l]) => { if (re.test(t)) rs.forEach(r => add(r, `lembaga ${l}`)); });
    return m;
  }
  const alasanLb = x => { if (!GL.r) return ""; for (const r of glList()) { const v = x._rum?.get(r); if (v) return v; } return ""; };
  async function perkayaSektor() {
    const [iv, sd] = await Promise.all([ambilData("inovasi"), ambilData("sistem_data")]);
    dlist(Array.isArray(iv) ? iv : iv?.inovasi).forEach(i => dlist(i.pembuat).forEach(b => { const x = lbMap.get(b.lembaga_id); if (x) strs(i.sektor).forEach(r => { if (!x._rum.has(r)) x._rum.set(r, `pembuat ${i.nama}`); }); }));
    dlist(Array.isArray(sd) ? sd : sd?.sistem).forEach(i => { const x = lbMap.get(i.lembaga_id); if (x) strs(i.sektor).forEach(r => { if (!x._rum.has(r)) x._rum.set(r, `pemilik ${i.nama}`); }); });
    if (GL.r && $("akLJ")) { saringLb(); gambarLb(false); }
    ambilBrc(() => { if ($("akLJ")) gambarLb(false); if ($("akTkL")) gambarTk(false); if ($("akInL")) gambarIn(false); });
  }
  function indeksLb(d) {
    lbArr = dlist(Array.isArray(d) ? d : d?.lembaga).filter(x => x && x.id && x.nama); lbMap = new Map(); lbCabang = new Map();
    for (const x of lbArr) { lbMap.set(x.id, x); if (x.induk) { if (!lbCabang.has(x.induk)) lbCabang.set(x.induk, []); lbCabang.get(x.induk).push(x); }
      x.prov = x.prov == null || x.prov === "" ? null : String(x.prov); x._skala = skalaKey(x.skala);
      x._cari = [x.nama, x.singkatan, x.kab, x.sub, ...strs(x.alias)].filter(Boolean).join(" ").toLowerCase(); }
    lbArr.sort((a, b) => a.nama.localeCompare(b.nama, "id")); lbArr.forEach(x => { x._rum = turunSektor(x); }); nanti(perkayaSektor);
    for (const x of lbArr) x._skor = [strs(x.telepon).length, strs(x.wa).length, strs(x.email).length, urlOk(x.web), x.alamat, x.pimpinan?.nama, x.izin, strs(x.bidang).length, urlOk(x.logo), Number.isFinite(x.lat)].filter(Boolean).length;
    lbArr.slice().sort((a, b) => b._skor - a._skor).forEach((x, i) => { x._rank = i + 1; });
    for (const a of sub1(lbArr, x => x.kategori).values()) a.slice().sort((p, q) => q._skor - p._skor).forEach((x, i) => { x._rankK = i + 1; x._nK = a.length; });
    dpl = new Set([...bacaDpl()].filter(id => lbMap.has(id)));
  }
  const hitungLbL = (L, f) => { const n = {}; L.forEach(x => { const k = f(x); if (k) n[k] = (n[k] || 0) + 1; }); return n; };
  const hitungLb = f => { const n = {}; lbArr.forEach(x => { const v = f(x); for (const k of [].concat(v)) if (k != null && k !== "") n[k] = (n[k] || 0) + 1; }); return n; };
  /* grup pil saring multi-pilih: chrome (aria-pressed) diset seketika, "" = semua */
  /* angka tiap pil dihitung ulang dalam saringan aktif lainnya (faceted); pil 0 redup */
  const kemasChip = (id, cnt) => document.querySelectorAll(`#${id} button[data-r]`).forEach(b => { const k = b.dataset.r; if (k === "") return; const n = cnt[k] || 0, sp = b.querySelector("span"); if (sp) sp.textContent = angka(n); if (n === 0 && b.getAttribute("aria-pressed") !== "true") b.setAttribute("data-nol", ""); else b.removeAttribute("data-nol"); });
  const tandaiPil = (id, set) => document.querySelectorAll(`#${id} button[data-r]`).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.r === "" ? !set.size : set.has(b.dataset.r))));
  const chipsKat = rows => `<button type="button" data-r="" aria-pressed="true">${ikon(IK_SEMUA, "currentColor")}Semua kategori</button>` + rows.map(([k, n]) => { const [l, ic, w] = KAT[k] || [k, "", "var(--ink2)"];
    return `<button type="button" data-r="${esc(k)}" aria-pressed="false">${ic ? ikon(ic, w) : ""}${esc(l)}<span>${angka(n)}</span></button>`; }).join("");
  /* pola kartu pakar dipakai semua kartu direktori: foto/logo bulat, nama, lencana status, pil navy dan biru muda, sektor, 3 metrik */
  const BRC = new Map(); let brcMuat = false;
  const ambilBrc = cb => { if (brcMuat) return; brcMuat = true; ambilData("berita").then(d => { dlist(Array.isArray(d) ? d : d?.berita).forEach(b => dlist(b?.entitas).forEach(e => BRC.set(e.jenis + ":" + e.id, (BRC.get(e.jenis + ":" + e.id) || 0) + 1))); cb?.(); }); };
  const IKP = {kontak: IK_TEL, cabang: IK_GEDUNG, sensor: IK_BAR, berita: '<path d="M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M7 9h7M7 13h7M7 16h4"/>', kiprah: '<path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.3 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/>', medsos: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 11 7.6-4M8.2 13l7.6 4"/>',
    lokasi: IKON_PIN, tahun: IKL.tahun, bantuan: '<path d="M12 20s-8-5-8-11a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 6-8 11-8 11z"/>', data: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/>', frek: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', uang: IK_UANG, proyek: IK_BAR, tenggat: IKL.tahun};
  const sosokPola = (logoUrl, nama, badge) => `<span class="ak-sosok"><span class="ak-foto ak-fl">${urlOk(logoUrl) ? `<img src="${esc(urlOk(logoUrl))}" alt="" loading="lazy" referrerpolicy="no-referrer" data-inisial="${esc(inisial(nama))}">` : esc(inisial(nama))}</span>${urlOk(badge) ? `<img class="ak-logo" src="${esc(urlOk(badge))}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ""}</span>`;
  const kartuPola = ({attr, cek, extra, sosok, nama, status, navy, navyLb, biru, sektor, metrik = [], ket2 = "", meti = false, gelar = "", wil = "", afil = ""}) => { const rp = strs(sektor), mt = metrik.filter(([k, l, v]) => v !== "-" && v !== "0" && v !== 0 && v !== "").map(([k, l, v, t]) => `<div title="${esc(l)}"><span class="ak-mlabel">${ikon(IKP[k], "currentColor")}${esc(l)}</span><b${t ? ' class="t"' : ""}>${esc(v)}</b></div>`).join("");
    return `<div class="ak-orang" role="button" tabindex="0" ${attr} aria-label="Buka ${esc(nama)}"${gelar ? ` title="${esc(gelar + " " + nama)}"` : ""}>${cek || ""}${extra || ""}<span class="ak-atas">${meti ? sosok.replace(/<\/span>$/, `<img class="ak-logo ak-mt-logo" src="/img/logo-meti-tanda.png" width="24" height="24" alt="" title="${esc(t(meti === "pengurus" ? "dir.pengurus_meti" : "dir.anggota_meti"))}"></span>`) : sosok}<span class="ak-nama"><h3>${esc(nama)}</h3>${status ? `<span class="ak-lencana"><em class="ak-l-${status[0]}">${esc(status[1])}</em></span>` : ""}${wil}</span></span>
      ${afil || `<span class="ak-kartu-label">${navy && navy !== "-" && !meti ? `<button type="button" class="ak-lbl-inst" ${navyLb ? `data-lb="${esc(navyLb)}" title="Buka profil ${esc(navy)}"` : `data-fq="${esc(navy)}" title="Cari ${esc(navy)}"`}>${esc(navy)}</button>` : ""}${biru && biru !== "-" ? `<button type="button" class="ak-lbl-prodi${String(biru).length > 26 ? " ak-dua" : ""}" data-fq="${esc(biru)}" title="Cari ${esc(biru)}">${esc(biru)}</button>` : ""}</span>`}
      ${ket2}<span class="ak-pil">${rp.slice(0, 3).map((r, j) => `<button type="button" class="ak-r${j === 0 ? " utama" : ""}" data-rpn="${esc(r)}" data-st="--w0:${(SEKTOR[r] || [])[2] || "var(--ink2)"}">${(SEKTOR[r] || [])[1] ? ikon(SEKTOR[r][1], SEKTOR[r][2]) : ""}${esc((SEKTOR[r] || [r])[0])}</button>`).join("")}${rp.length > 3 ? `<span class="ak-r">+${rp.length - 3}</span>` : ""}</span>
      <div class="ak-metrik">${mt}</div></div>`; };
  /* sheetDetail dipensiunkan: lembar sistem data kini sheetSd (di dekat kartuSd) */
  const cekPola = (id, ada) => `<label class="ak-pilih" title="Tambah ke daftar pendek"><input type="checkbox" data-dpl="${esc(id)}" aria-label="Tambah ke daftar pendek"${ada ? " checked" : ""}><span class="ak-cek"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg></span></label>`;
  function saringLb() {
    const q = LB.q.toLowerCase();
    if (LB.kat && !LB.katSet.size) LB.katSet = new Set([LB.kat]);
    lbHasil = lbArr.filter(x => cocokMeti(LB.meti, x) && dalam(LB.fs.prov, [x.prov]) && cocokSektor(LB.katSet, [x.kategori]) && dalam(LB.fs.skala, [x._skala]) && dalam(LB.fs.bidang, strs(x.bidang)) && (!LB.sensor || dlist(x.sensor).length > 0) && (!LB.strat || strat("L:" + x.id)) && (!LB.sub || String(x.sub || "").toLowerCase() === LB.sub) && (!GL.r || glList().some(r => x._rum.has(r)) || x._rum.size === 0) && (!q || x._cari.includes(q)));
    lbHasil.sort((a, b) => !!strat("L:" + b.id) - !!strat("L:" + a.id) || (strat("L:" + b.id)?.skor || 0) - (strat("L:" + a.id)?.skor || 0));
  }
  const grupLb = x => GL.r ? (glList().some(r => x._rum.has(r)) ? "k" : "l") : "";
  function gambarLb(gulir) {
    if (GL.r) lbHasil.sort((a, b) => (grupLb(a) === "k" ? 0 : 1) - (grupLb(b) === "k" ? 0 : 1) || a.nama.localeCompare(b.nama, "id"));
    const n = lbHasil.length, a = (LB.hal - 1) * LPER, wil = LB.fs.prov.size ? ` di ${[...LB.fs.prov].map(provT).join(" dan ")}` : "", kat = LB.katSet.size ? ` ${[...LB.katSet].map(k => (KAT[k] || [k])[0].toLowerCase()).join(" dan ")}` : "";
    $("akLJ").innerHTML = `<b>${angka(n)}</b> lembaga${esc(kat)}${esc(wil)}${msAda("lb") ? " " + msChips("lb") : ""}`; msTandai("lb");
    $("akLL").innerHTML = n ? lbHasil.slice(a, a + LPER).map((x, j) => { const g = grupLb(x), h = g && (j === 0 || grupLb(lbHasil[a + j - 1]) !== g) ? `<h3 class="ak-lgrp">${g === "k" ? "Khusus " + esc(namaGL().toLowerCase()) : "Lintas sektor"}</h3>` : ""; return h + kartuLb(x, a + j); }).join("") : hampa("lembaga");
    $("akLH").innerHTML = navHal(LB.hal, n, LPER, "lembaga");
    { const kS = LB.katSet, kk = LB.kat, hs = lbHasil; LB.katSet = new Set(); LB.kat = ""; let c = {}; try { saringLb(); lbHasil.forEach(x => { c[x.kategori] = (c[x.kategori] || 0) + 1; }); } finally { LB.katSet = kS; LB.kat = kk; lbHasil = hs; } kemasChip("akLC", c); }
    if (gulir) gulirKe("akLJ");
  }
  function bangunDaftarLb(el) {
    lbMs();
    el.innerHTML = `<div class="ak-saring"><div class="ak-alat">${cariKotak("akLQ", "Cari nama, singkatan, atau kota")}${segMeti("akLM", lbArr, LB.meti)}<button id="akLStr" class="ak-tog" type="button" aria-pressed="false">${ikon(STAR_D, "currentColor")}Strategis</button><button id="akLSn" class="ak-tog" type="button" aria-pressed="false">${ikon(IK_BAR, "currentColor")}Punya sensor</button></div>
      <div class="ak-baris ak-baris3">${htmlPilih("akLP", IKON_PIN, "Cari provinsi")}${htmlPilih("akLSk", IK_GEDUNG, "Cari skala")}${htmlPilih("akLB", IKL.jenis, "Cari bidang kegiatan")}</div><div class="ak-baris" id="akLSubW" hidden>${htmlPilih("akLSub", IK_UANG, "Cari sub-kategori dunia usaha")}</div>
      <div id="akLC" class="ak-chip" role="group" aria-label="Kategori lembaga">${chipsKat(Object.entries(hitungLb(x => x.kategori)).filter(([k]) => k !== "penerbit").sort((a, b) => b[1] - a[1]))}</div></div>
      <div class="ak-hasil"><h2 class="ak-judulv" id="akLJ"></h2><div class="ak-daftar ak-orggrid" id="akLL"></div><nav id="akLH" class="ak-hal" aria-label="Halaman daftar lembaga" aria-live="polite"></nav></div>`;
    $("akLM").addEventListener("click", e => { const b = e.target.closest("button[data-v]"); if (!b) return; LB.meti = b.dataset.v; setSeg("akLM", LB.meti); LB.hal = 1; jalan(false); });
    const jalan = gulir => { const t = ++ltok; nanti(() => { if (t !== ltok) return; saringLb(); gambarLb(gulir); }); };
    const opsi = (f, lab) => () => Object.entries(hitungLb(f)).sort((a, b) => b[1] - a[1]).map(([v, c]) => [v, lab(v), c]);
    const ubah = (k, v) => { LB[k] = v; LB.hal = 1; jalan(false); };
    msPilih("akLP", "lb", "prov", {semua: "Semua provinsi", opsi: opsi(x => x.prov, provT)});
    msPilih("akLSk", "lb", "skala", {semua: "Semua skala", opsi: opsi(x => x._skala, v => SKALA_L[v] || kapital(v))});
    msPilih("akLB", "lb", "bidang", {semua: "Semua bidang kegiatan", opsi: opsi(x => strs(x.bidang), kapital)});
    $("akLStr").addEventListener("click", () => { LB.strat = !LB.strat; $("akLStr").setAttribute("aria-pressed", String(LB.strat)); LB.hal = 1; jalan(false); });
    $("akLSn").addEventListener("click", () => { LB.sensor = !LB.sensor; $("akLSn").setAttribute("aria-pressed", String(LB.sensor)); LB.hal = 1; jalan(false); });
    pasangPilih("akLSub", {ik: () => LB.kat && KAT[LB.kat] ? [KAT[LB.kat][1], KAT[LB.kat][2]] : null, semua: "Semua sub-kategori dunia usaha", nilai: () => LB.sub, opsi: () => Object.entries(hitungLbL(lbArr.filter(x => x.kategori === LB.kat), x => String(x.sub || "").toLowerCase())).sort((a, b) => b[1] - a[1]).map(([v, c]) => [v, kapital(v), c]), pilih: v => ubah("sub", v)});
    let tt = 0; $("akLQ").addEventListener("input", e => { clearTimeout(tt); tt = setTimeout(() => ubah("q", e.target.value.trim()), 250); });
    const terapKat = arr => { LB.katSet = new Set(arr); LB.kat = arr.length === 1 ? arr[0] : ""; tandaiPil("akLC", LB.katSet); $("akLSubW").hidden = !(arr.length === 1 && ["swasta", "lsm-yayasan"].includes(arr[0])); LB.sub = ""; LB.hal = 1;
      try { const u = new URL(location.href); arr.length ? u.searchParams.set("kat", tulisSektor(LB.katSet)) : u.searchParams.delete("kat"); history.replaceState(null, "", u); } catch (er) {} jalan(false); };
    $("akLC").addEventListener("click", e => { const b = e.target.closest("button[data-r]"); if (!b) return; const baru = togglePilihan(LB.katSet, b.dataset.r); tandaiPil("akLC", baru); nanti(() => terapKat([...baru])); });
    { const dk = bacaSektor(new URLSearchParams(location.search).get("kat"), Object.keys(KAT)); if (dk.length && !LB.katSet.size) { LB.katSet = new Set(dk); LB.kat = dk.length === 1 ? dk[0] : ""; tandaiPil("akLC", LB.katSet); } else if (LB.katSet.size) tandaiPil("akLC", LB.katSet); }
    pasangHal("akLH", h => { LB.hal = h; gambarLb(true); });
    const bukaK = e => { if (e.target.closest(".ak-pilih")) { if (e.target.tagName === "INPUT") dplUbah(e.target.dataset.dpl, e.target.checked); return; }
      if (e.target.closest("a")) return; const c = e.target.closest("[data-li]"); if (c && lbHasil[+c.dataset.li]) bukaLb(lbHasil[+c.dataset.li]); };
    $("akLL").addEventListener("click", bukaK);
    $("akLL").addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-li]")) { e.preventDefault(); bukaK(e); } });
    jalan(false);
  }

  /* ---- daftar pendek lembaga: bilah dan mesin ekspor pakar dipakai bersama ---- */
  const dplSimpan = () => { try { localStorage.setItem(DPL_KEY, JSON.stringify([...dpl])); } catch (e) {} };
  function dplUbah(id, ada) { if (ada) dpl.add(id); else dpl.delete(id); dplSimpan(); dpSegarkan(); if ($("akSheet").dataset.mode === "dpl" && !$("akSheet").hidden) daftarDpl(); }
  const pilMini = (ik, t, w) => t ? `<span class="ak-mp"${w ? ` data-st="--w0:${esc(w)}"` : ""}>${ik ? ikon(ik, w || "currentColor") : ""}${esc(t)}</span>` : "";
  const pilLok = x => (x.kab ? pilMini(IKON_PIN, x.kab) : "") + (x.prov ? pilMini(IKON_PIN, provT(x.prov)) : "");
  const dplTombol = id => `<button type="button" data-dpl-t="${esc(id)}" aria-pressed="${dpl.has(id)}" class="ak-dptog ak-ib" title="${dpl.has(id) ? "Ada di daftar pendek" : "Tambah ke daftar pendek"}" aria-label="${dpl.has(id) ? "Ada di daftar pendek" : "Tambah ke daftar pendek"}">${ikon(IKON_TANDA, "currentColor")}</button>`;
  function daftarDpl() {
    const ls = [...dpl].map(id => lbMap.get(id)).filter(Boolean);
    if (!ls.length) { tutupSheet(); return; }
    $("akSJudul").nextElementSibling.querySelector("b").textContent = angka(ls.length);
    $("akSTubuh").innerHTML = `<ol class="ak-sdaftar">${ls.map(x => `<li><button type="button" class="ak-sbuka" data-lb="${esc(x.id)}">${logoLb(x)}<span><b>${esc(x.nama)}</b><small>${esc(KAT[x.kategori]?.[0] || x.kategori)}</small></span></button><button type="button" class="ak-shapus" data-hapusl="${esc(x.id)}" aria-label="Hapus ${esc(x.nama)} dari daftar pendek"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></li>`).join("")}</ol>`;
  }
  function lihatDpl() { bukaSheet("dpl", `<div class="ak-dkepala"><div class="ak-dk-atas"><div class="ak-nama"><h2 id="akSJudul">Daftar pendek lembaga</h2><p><b>${angka(dpl.size)}</b> lembaga terpilih</p></div></div></div>`, () => { daftarDpl(); return $("akSTubuh").innerHTML; }); }
  const KOL_L = ["No", "Nama", "Singkatan", "Kategori", "Provinsi", "Kota", "Telepon", "WA", "Email", "Situs", "Sumber kontak", "Izin", "Mitra METI", "Diperiksa"];
  function dataDpl() {
    const wib = new Date(Date.now() + 7 * 36e5), iso = wib.toISOString().slice(0, 10), perlu = $("akDpPerlu").value.trim();
    const baris = [...dpl].map(id => lbMap.get(id)).filter(Boolean).map((x, i) => [i + 1, x.nama, x.singkatan || "", KAT[x.kategori]?.[0] || x.kategori, provT(x.prov), x.kab || "", strs(x.telepon).map(telF).join("; "), strs(x.wa).map(telF).join("; "),
      strs(x.email).join("; "), urlOk(x.web), [...new Set(dlist(x.sumber).map(s => urlOk(s?.url)).filter(Boolean))].join(" "), izinStatus(x.izin)?.[1] || "", x.mitra_meti?.bukti ? [x.mitra_meti.bukti, x.mitra_meti.tahun].filter(Boolean).join(", ") : "", x.diperiksa ? tglID(x.diperiksa) : ""]);
    return {judul: "Daftar Pendek Lembaga Mitra", iso, perlu, baris, berkas: "daftar-pendek-lembaga", kol: KOL_L, lebar: [5, 34, 14, 22, 18, 20, 24, 24, 30, 30, 60, 16, 26, 18], kanan: [0],
      tanggal: tglID(wib.toISOString().slice(0, 10)) + ", " + wib.toISOString().slice(11, 16).replace(":", ".") + " WIB"};
  }

  /* ---- profil lembaga (L41) ---- */
  const isiNanti = (cek, id, html) => { const c = (n = 0) => { if (!cek()) return; const el = $(id); if (!el) { if (n < 20) nanti(() => c(n + 1)); return; } el.outerHTML = html; }; nanti(c); };
  const namaLb = x => [...new Set([x.nama, x.singkatan, ...strs(x.alias)].map(nrm).filter(s => s.length >= 3))];
  /* jurnal yang penerbitnya sama dengan nama/singkatan/alias lembaga: sama persis, atau salah satu nama (>= 4 huruf) muncul utuh sebagai kata di teks penerbit */
  function jurnalLembaga(d, x) {
    const nm = namaLb(x);
    return dlist(d).filter(j => { const pen = " " + nrm(j?.penerbit) + " "; return pen.trim() && nm.some(n => pen.trim() === n || (n.length >= 4 && pen.includes(" " + n + " "))); });
  }
  const proyekLembaga = (d, x) => { const nm = new Set(namaLb(x)); return dlist(d).filter(p => p && [].concat(p.pelaksana, p.donor).some(v => nm.has(nrm(v)))); };
  const usdR = n => ringkasUang(n, "US$");
  const tabelProyek = (a, tanpaKurs) => gridProyek(a.map(dari3w), tanpaKurs);
  /* ---- profil lengkap (PRD 6.15): baris berlabel dengan cip domain, bagian bergaris, jaringan, keyakinan, sumber, sebanding ---- */
  const cip = u => { const h = hostDari2(urlOk(u) || ""); return h ? `<a class="ak-cip" href="${esc(urlOk(u))}" ${LUAR}>${esc(h)}</a>` : ""; };
  const barisB = (label, nilai, u, catatan) => nilai ? `<div class="ak-bl2"><span class="ak-bk">${esc(label)}</span><div class="ak-bn"><span>${nilai}${u ? " " + cip(u) : ""}</span>${catatan ? `<small>${esc(catatan)}</small>` : ""}</div></div>` : "";
  /* "Peran kini" hanya bila jabatannya masih berjalan; jabatan bertahun selesai atau berkata mantan/pernah = "Pernah menjabat" */
  const labelPeran = p => { const t = String(p || ""), th = [...t.matchAll(/(\d{4})\s*[-–]\s*(\d{4})/g)].map(m => +m[2]), kini = new Date().getFullYear();
    const lampau = /^(mantan|eks|pernah)\b/i.test(t.trim()) || (th.length && Math.max(...th) < kini && !/\bsejak\b/i.test(t));
    return lampau ? "Pernah menjabat" : "Peran"; };
  const bagB = (judul, isi) => isi ? `<section class="ak-bg"><h3><i class="ak-kotak"></i>${esc(judul)}</h3>${isi}</section>` : "";
  const BUKTI = {resmi: "RESMI", iati: "IATI", berita: "BERITA", "pihak-ketiga": "PIHAK KETIGA"};
  const miniJar = a => `<div class="ak-minijar">${a.map(j => { const y = j.ke_id && lbMap.get(j.ke_id), thn = j.tanggal ? String(j.tanggal).slice(0, 4) : "", u = urlOk(j.sumber_url);
    const isi = `${y ? logoLb(y) : lgoIkon([], IK_GEDUNG, "var(--data1)")}<span><b>${esc(y ? judulCase(y.nama) : j.ke_nama || "")}</b><small>${esc([y ? kabProv(y) : "", thn, j.bukti && j.bukti !== "resmi" ? (BUKTI[j.bukti] || "").toLowerCase() : ""].filter(Boolean).join(", "))}</small></span>`;
    return y ? `<button type="button" class="ak-mj" data-lb="${esc(y.id)}">${isi}${u ? "" : ""}</button>` : `<div class="ak-mj">${isi}${u ? `<a class="ak-gmaps" href="${esc(u)}" ${LUAR} title="Sumber" aria-label="Sumber">${ikon(IK_LUAR, "currentColor")}</a>` : ""}</div>`; }).join("")}</div>`;
  const linkJar = j => `<li><span class="ak-izin ${j.bukti === "resmi" ? "berlaku" : j.bukti === "pihak-ketiga" ? "contoh" : "mitra"}">${esc(BUKTI[j.bukti] || "BUKTI")}</span> <small class="ak-lper">${esc(kapital(j.relasi || ""))}</small> ${j.ke_id && lbMap.has(j.ke_id) ? `<button type="button" class="ak-pk" data-lb="${esc(j.ke_id)}">${esc(lbMap.get(j.ke_id).nama)}</button>` : `<b>${esc(j.ke_nama || "")}</b>`} ${cip(j.sumber_url)}${j.tanggal ? ` <small class="ak-lper">${esc(tglID(j.tanggal))}</small>` : ""}</li>`;
  document.addEventListener("input", e => { const q = e.target.closest?.("[data-grupcari]"); if (!q) return; const g = q.closest(".ak-disi"), t = nrm(q.value);
    g.querySelectorAll("details[data-lazy]").forEach(d => { if (t && d.dataset.lazy) { const f = LAZY.get(d.dataset.lazy); if (f) { LAZY.delete(d.dataset.lazy); d.querySelector(".ak-lazyisi").innerHTML = f(); } } });
    g.querySelectorAll("details.ak-prov-g").forEach(d => { let ada = false; d.querySelectorAll(".ak-bkr,.ak-pkb").forEach(r => { const ok = !t || nrm(r.textContent).includes(t); r.hidden = !ok; if (ok) ada = true; }); d.hidden = !!t && !ada; if (t && ada) d.open = true; }); });
  document.addEventListener("click", e => { const w = e.target.closest("[data-wl]"); if (!w) return; const [pv, kab] = String(WL.kode || "").split("|"), k = w.dataset.wl;
    if (k === "pakar") { st.prov = new Set([pv]); pkSub = "akademisi"; tampil("pakar"); nanti(() => { chromeSaring?.(); isiProv?.(); saring(); }); return; }
    Object.assign(LB, {fs: {prov: new Set(pv ? [pv] : []), skala: new Set(), bidang: new Set()}, kab: kab || "", q: "", strat: k === "strat", hal: 1, katSet: new Set(), kat: "", sub: "", sensor: false}); lbMs(); delete sudah.lembaga; lbSub = "daftar"; tampil("lembaga"); setTimeout(() => { try { subLb("daftar"); } catch (er) {} }, 700); });
  let NAMA_IDX = null; const namaIdx = () => { if (!NAMA_IDX || NAMA_IDX.n !== lbArr.length) { NAMA_IDX = new Map(); NAMA_IDX.n = lbArr.length; for (const z of lbArr) for (const k of namaLb(z)) if (!NAMA_IDX.has(k)) NAMA_IDX.set(k, z.id); } return NAMA_IDX; };
  const LAZY = new Map(); let lazyN = 0;
  document.addEventListener("toggle", e => { const d = e.target; if (!d.matches?.("details[data-lazy]") || !d.open) return; const f = LAZY.get(d.dataset.lazy); if (f) { LAZY.delete(d.dataset.lazy); nanti(() => { d.querySelector(".ak-lazyisi").innerHTML = f(); }); } }, true);
  function jaringanTurunan(x, w3, pd) {
    const nm = new Set(namaLb(x)), cocok = v => nm.has(nrm(v)), a = [];
    const bukaId = n => { const y = namaIdx().get(nrm(n)); return y ? {ke_id: y} : {ke_nama: n}; };
    if (x.induk && lbMap.has(x.induk)) a.push({relasi: "induk", ke_id: x.induk, bukti: "resmi"});
    (lbCabang.get(x.id) || []).slice(0, 15).forEach(c => a.push({relasi: "cabang", ke_id: c.id, bukti: "resmi"}));
    dlist(w3).forEach(p => { if ([].concat(p.pelaksana).some(cocok) && p.donor) a.push({relasi: "pendana", ...bukaId(p.donor), bukti: "iati", sumber_url: p.sumber_url, tanggal: p.mulai}); if (cocok(p.donor) && p.pelaksana) a.push({relasi: "penerima", ...bukaId(String(p.pelaksana)), bukti: "iati", sumber_url: p.sumber_url, tanggal: p.mulai}); });
    dlist(Array.isArray(pd) ? pd : pd?.pendanaan).forEach(p => { if (p.lembaga_id === x.id || cocok(p.pemberi)) a.push({relasi: "penerima", ke_nama: p.penerima || strs(p.pelaksana).join(", "), bukti: "resmi", sumber_url: p.url, tanggal: p.tahun && String(p.tahun)}); if (cocok(p.penerima) || strs(p.pelaksana).some(cocok)) a.push({relasi: "pendana", ...bukaId(p.pemberi), bukti: "resmi", sumber_url: p.url, tanggal: p.tahun && String(p.tahun)}); });
    return a.filter(j => (j.ke_id || j.ke_nama) && j.ke_id !== x.id && !nm.has(nrm(j.ke_nama || "")));
  }
  const yakinHtml = y => { if (!y) return ""; const lv = y.label === "tinggi" ? 3 : y.label === "sedang" ? 2 : y.label ? 1 : (y.skor >= .7 ? 3 : y.skor >= .4 ? 2 : 1), nama = ["", "Rendah", "Sedang", "Tinggi"][lv], w = ["", "var(--bad)", "var(--meti-oranye)", "var(--ok)"][lv], al = strs(y.alasan);
    return `<div class="ak-yakin2"><div class="ak-yl" data-st="color:${w}">${nama}</div><div class="ak-yseg">${[1, 2, 3].map(k => `<i data-st="background:${k <= lv ? w : "var(--line)"}"></i>`).join("")}</div>${al[0] ? `<p class="ak-rata">${esc(String(al[0]).replace(/\d{4}-\d{2}-\d{2}/g, d => tglID(d)))}</p>` : ""}${(() => { const tdk = al.slice(1, 4).map(t => String(t)).filter(t => /\b0 (persen|dari)\b|belum|tidak|rendah/i.test(t)); return tdk.length ? `<p class="ak-lper ak-yring">Perlu dilengkapi: ${esc(tdk.map(t => t.replace(/^kelengkapan:\s*/i, "").replace(/^belum ada\s*/i, "")).join("; ").slice(0, 140))}</p>` : ""; })()}</div>`; };
  const RESMI_RE = /\.go\.id|\.ac\.id|\.mil\.id|orcid\.org|sinta|wikidata\.org|openalex\.org|\.edu(\/|$)/i;
  function yakinOrang(urls, lengkap, tgl) {
    const u = urls.filter(Boolean), porsi = u.length ? u.filter(x => RESMI_RE.test(x)).length / u.length : 0, kel = lengkap.length ? lengkap.filter(a => a[1]).length / lengkap.length : 0;
    const umur = tgl ? (Date.now() - new Date(String(tgl).slice(0, 10)).getTime()) / 864e5 : null, segar = umur == null || isNaN(umur) ? .5 : umur < 183 ? 1 : umur < 365 ? .5 : .2, skor = Math.round((.5 * porsi + .35 * kel + .15 * segar) * 100) / 100;
    return {skor, label: skor >= .7 ? "tinggi" : skor >= .4 ? "sedang" : "rendah", alasan: [`${Math.round(porsi * 100)}% sumber dari laman resmi, institusi, atau katalog ilmiah (${u.length} sumber)`, `Kelengkapan: ${lengkap.filter(a => a[1]).map(a => a[0]).join(", ") || "belum ada"}${lengkap.some(a => !a[1]) ? `; belum ada ${lengkap.filter(a => !a[1]).map(a => a[0]).join(", ")}` : ""}`, tgl ? `Diperiksa ${tglID(tgl)}` : "Tanggal periksa belum tercatat"]};
  }
  /* satu komponen Sumber untuk semua profil: sebaris satu tautan, ikon jenis, host tebal, judul dari jalur, ikon luar */
  const IK_BUKU = '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M9 7h6"/>', IK_KORAN = '<path d="M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2"/><path d="M7 9h7M7 13h7"/>';
  const judulJalur = u => { try { const U = new URL(u), s = U.pathname.split("/").filter(Boolean).filter(t => !/^(id|en|berita|news|read|detail|\d{1,4})$/i.test(t)).pop() || ""; const t = decodeURIComponent(s).replace(/\.[a-z0-9]{2,5}$/i, "").split(/[-_+]+/).filter((w, i, z) => !(i === z.length - 1 && z.length > 3 && /^(?=.*[A-Z])(?=.*[a-z])\S{3,7}$/.test(w) && /[A-Z]/.test(w.slice(1)))).join(" ").trim(); return t ? kapital(t) : ""; } catch (e) { return ""; } };
  const ikSumber = (h, u) => /wikipedia|wikidata/.test(h) ? IK_BUKU : /\.go\.id$|\.gov$|\.mil\.id$/.test(h) ? IK_LUAR : /detik|kompas|republika|antaranews|tempo|cnn|liputan6|tribun|kumparan|rmol|tirto|bbc|reuters|mongabay|\/(berita|news|read)\//.test(h + u) ? IK_KORAN : IK_LUAR;
  const sumberRapi = urls => { const m = new Map(); urls.forEach(u => { u = urlOk(u); if (u) m.set(u.replace(/\/$/, ""), u); });
    return m.size ? `<ul class="ak-sumb">${[...m.values()].map(u => { const h = hostDari2(u), t = judulJalur(u); return `<li><a href="${esc(u)}" ${LUAR} title="${esc(u)}">${ikon(ikSumber(h, u), "currentColor")}<b>${esc(h || u)}</b><span>${esc(t)}</span>${ikon(IK_LUAR, "currentColor")}</a></li>`; }).join("")}</ul>` : ""; };
  const sumberList0 = sumberRapi;
  const sumberUnik = x => { const m = new Map(); [...dlist(x.sumber).map(s => s?.url), x.web, x.pimpinan?.sumber_url, x.izin?.sumber_url, x.mitra_meti?.sumber_url, x.sdm?.sumber_url, ...dlist(x.kapasitas).map(k => k?.sumber_url), ...dlist(x.potensi_bantuan).map(k => k?.sumber_url), ...dlist(x.sensor).map(k => k?.sumber_url)].forEach(u => { u = urlOk(u); if (u) m.set(u, hostDari2(u)); }); return [...m]; };
  const sumberList = sumberRapi;
  const sumberHtmlLama = x => sumberRapi(sumberUnik(x).map(a => a[0]));
  /* SUNTING (staf saja): usulan koreksi ke POST /api/koreksi {entitas, jenis, usulan, sumber_url}; tidak mengubah data, masuk antrean kurator */
  const stafSunting = () => ["pengurus", "kurator", "admin", "super"].includes(globalThis.JM?.saya?.peran);
  const eidDari = key => { const [j, ...r] = String(key).split(":"), id = r.join(":"), x = j === "P" ? tkArr.find(q => q.pakar_id === id) : j === "T" ? tkArr.find(q => q.id === id) : j === "L" ? lbMap.get(id) : null; return Number.isInteger(x?.eid) ? x.eid : null; };
  const koreksiBtn = (jenis, id) => { const e = stafSunting() && eidDari({pakar: "P:", tokoh: "T:", lembaga: "L:"}[jenis] + id); return e ? `<button type="button" class="ak-ib" data-kor="${e}" title="${esc(t("dir.koreksi.sunting"))}" aria-label="${esc(t("dir.koreksi.sunting"))}">${ikon('<path d="M4 21v-4L17 4l4 4L8 21z"/>', "currentColor")}</button>` : ""; };
  const formKor = () => "";
  const apiJ = (u, metode, badan) => fetch(u, {method: metode || "GET", credentials: "same-origin", headers: {"x-pb": "1", ...(badan ? {"content-type": "application/json"} : {})}, body: badan ? JSON.stringify(badan) : undefined});
  document.addEventListener("click", e => { const b = e.target.closest("[data-kor]"); if (!b) return; const w = b.closest(".ak-dkepala")?.querySelector(".ak-korw"); if (!w) return;
    if (w.firstElementChild) { w.textContent = ""; return; }
    w.innerHTML = `<form class="ak-kor" data-korf="${esc(b.dataset.kor)}"><label>${esc(t("dir.koreksi.jenis"))}<select data-ikon="jenis" name="jenis"><option value="ubah">${esc(t("dir.koreksi.ubah"))}</option><option value="tambah">${esc(t("dir.koreksi.tambah"))}</option></select></label><label>${esc(t("dir.koreksi.usulan"))}<textarea name="usulan" required maxlength="1000" rows="3"></textarea></label><label>${esc(t("dir.koreksi.sumber"))}<input name="sumber_url" type="url" required placeholder="https://"></label><button type="submit" class="ak-tbl">${esc(t("dir.koreksi.kirim"))}</button><span role="status"></span></form>`; w.querySelector("textarea").focus(); });
  document.addEventListener("submit", async e => { const f = e.target.closest("[data-korf]"); if (!f) return; e.preventDefault(); const st2 = f.querySelector("[role=status]"), v = Object.fromEntries(new FormData(f)); st2.textContent = t("dir.memuat"); f.querySelector("button").disabled = true;
    try { const r = await apiJ("/api/koreksi", "POST", {entitas: +f.dataset.korf, jenis: v.jenis, usulan: v.usulan, sumber_url: v.sumber_url}); st2.textContent = r.ok ? t("dir.koreksi.terkirim") : t("dir.galat"); if (r.ok) f.reset(); } catch (er) { st2.textContent = t("dir.galat"); } f.querySelector("button").disabled = false; });
  const kirimKoreksi = () => {};
  /* rakitan profil dipakai dua wadah: lembar bawah (daftar) dan panel kanan (peta) */
  /* PENGURUS METI (lapis anggota): foto pengurus dari R2 potret/anggota/foto, nama dan jabatan dari catatan orang; hak cipta di tautan sumber */
  const pengurusMeti = x => { const a = dlist(x.pengurus_foto), om = dlist(x.pengurus_ormawa);
    const foto = a.length ? bagB("Pengurus METI", `<ul class="ak-pgr">${a.map(p => { const o = tkArr.find(q => q.id === p.orang_id), u = fotoUrl(p); const nm = o?.nama || p.orang_id;
      return `<li>${u ? `<img src="${esc(u)}" alt="${esc(nm)}" loading="lazy" width="72" height="72">` : `<span class="ak-foto ak-ini ak-ci${ciNama(nm)}" aria-hidden="true">${esc(inisial(nm))}</span>`}<b>${o ? `<button type="button" class="ak-pk" data-tkid="${esc(p.orang_id)}">${esc(nm)}</button>` : esc(nm)}</b><small>${esc(o?.peran || "")}</small>${urlOk(p.sumber_url) ? `<a class="ak-lper" href="${esc(urlOk(p.sumber_url))}" ${LUAR}>Foto: ${esc(hostDari2(urlOk(p.sumber_url)))}</a>` : ""}</li>`; }).join("")}</ul>`) : "";
    return foto + (om.length ? bagB("Pengurus organisasi", `<ul class="ak-lsumber">${om.map(p => `<li><b>${esc(p.nama)}</b>${p.jabatan ? ` <small class="ak-lper">${esc(p.jabatan)}</small>` : ""}</li>`).join("")}</ul>`) : ""); };
  function rakitLb(x, panel) {
    const lok = kabProv(x), web = urlOk(x.web), induk = x.induk && lbMap.get(x.induk), pre = panel ? "akDr" : "akLb";
    const ps = x.pimpinan, z = x.izin, mb = x.mitra_meti, bid = strs(x.bidang), kon = kontakLb(x, true), sb = sumberButir(x, "web")?.url || x.web;
    const ring = ringkasLb(x), bp = false;
    const kepala = `<div class="ak-dkepala"><div class="ak-dk-atas">${logoLb(x)}<div class="ak-nama"><h2 id="${panel ? "akDrNama" : "akSJudul"}">${esc(x.nama)}</h2>${(() => { const sub = x.badan_hukum || (x.singkatan && nrm(x.singkatan) !== nrm(x.nama) ? x.singkatan : "") || [x.sub && kapital(x.sub), x.kab].filter(Boolean).join(", "); return sub && nrm(sub) !== nrm(x.nama) ? `<p>${esc(sub)}</p>` : ""; })()}<div class="ak-fakta">${pilKat(x.kategori)}${lok ? ikon(IKON_PIN, "currentColor") + `<span>${esc(lok)}</span>` : ""}${x.didirikan ? `<span>Didirikan ${esc(x.didirikan)}</span>` : ""}</div></div>${panel ? "" : (() => { const it = [["Sejak", IKL.tahun, x.didirikan ? String(x.didirikan).slice(0, 4) : ""], ["Inovasi", KAT.inovasi[1], dlist(x.inovasi_produk).length ? angka(dlist(x.inovasi_produk).length) : ""], ["Sensor", IK_BAR, dlist(x.sensor).length ? angka(dlist(x.sensor).length) : ""]].filter(r => r[2]).slice(0, 4); return it.length ? `<div class="ak-metrik ak-mt-t">${it.map(([l, d, v]) => `<div><span class="ak-mlabel">${ikon(d, "currentColor")}${l}</span><b>${esc(v)}</b></div>`).join("")}</div>` : ""; })()}<div class="ak-pojok">${dplTombol(x.id)}${koreksiBtn("lembaga", x.id)}</div></div>
      <div class="ak-pil ak-mps">${pilStrat("L:" + x.id)}${pilMini(IKON_PIN, "Wilayah kerja: " + (SKALA_L[x._skala] || kapital(x.skala || "")))}${pilIzin(x)}${pilMitra(x)}${pilContoh(x)}${web ? `<a class="ak-mp ak-mp-a" href="${esc(web)}" ${LUAR} title="Buka situs">${ikon(IK_LUAR, "currentColor")}${esc(urlHost(web))}</a>` : ""}</div>
      ${ring ? `<p class="ak-rata ak-ringk" data-st="-webkit-line-clamp:2">${esc(ring)}</p>` : ""}<div id="${pre}Kor" class="ak-korw"></div></div>`;
    const tubuh = () => alasanStrat("L:" + x.id) + `<div class="ak-bgrup">`
      + barisB("Pimpinan", ps?.nama ? `<b>${esc(ps.nama)}</b>${ps.jabatan ? ` <span class="ak-jab">${esc(ps.jabatan)}</span>` : ""}${urlOk(ps.sumber_url) ? ` <a class="ak-ik-l" href="${esc(urlOk(ps.sumber_url))}" ${LUAR} title="Sumber" aria-label="Sumber">${ikon(IK_LUAR, "currentColor")}</a>` : ""}` : "", "")
      + barisB("Didirikan", x.didirikan ? `<b>${esc(x.didirikan)}</b>` : "", sumberButir(x, "didirikan")?.url)
      + barisB("Badan hukum dan izin", x.badan_hukum || z ? `<b>${esc(x.badan_hukum || "")}</b> ${z ? pilIzin(x) : ""}` : "", z?.sumber_url, z ? [z.jenis, z.nomor && "nomor " + z.nomor, z.berlaku_sampai && "berlaku sampai " + tglID(z.berlaku_sampai)].filter(Boolean).join(", ") : "")
      + barisB("Mitra METI", mb?.bukti ? `<b>${esc(mb.bukti)}</b>` : "", mb?.sumber_url, mb?.tahun ? String(mb.tahun) : "")
      + barisB("SDM", x.sdm?.jumlah != null ? `<b>${esc(angka(x.sdm.jumlah))}</b> ${esc(x.sdm.jenis || "")}` : "", x.sdm?.sumber_url, x.sdm?.tanggal ? "Dibaca " + tglID(x.sdm.tanggal) : "")
      + dlist(x.kapasitas).map((k, i) => barisB(i ? "" : "Kapasitas", esc(k.teks || ""), k.sumber_url)).join("")
      + `</div>` + (bp ? bagB("Kontak dan alamat", (kon || `<small class="ak-lper">Belum ada kontak resmi</small> ${koreksiBtn("lembaga", x.id)}`) + (x.alamat || Number.isFinite(x.lat) ? `<p class="ak-alamat">${ikon(IKON_PIN, "currentColor")}<span>${x.alamat ? `<a href="${esc(urlPeta(x))}" ${LUAR}>${esc(x.alamat)}</a>` : esc(lok)}</span></p>` : "") + (kon ? "" : `<small class="ak-lper ak-ksum">${sumberRapi(sumberUnik(x).map(a => a[0]))}${x.diperiksa ? ` Diperiksa ${esc(tglID(x.diperiksa))}` : ""}</small>`)) + `<div id="${pre}Bp"></div>` : bagB("Kontak", (kon || `<small class="ak-lper">Belum ada kontak resmi</small> ${koreksiBtn("lembaga", x.id)}`)))
      + bagB("Rekam jejak", dlist(x.potensi_bantuan).length ? `<ul class="ak-rj">${dlist(x.potensi_bantuan).map(pb => { const tk = String(pb.teks || "").replace(/\s*\((judul|judul;[^)]*)\)\s*/gi, " ").replace(/\s+/g, " ").trim(), judulSaja = /\(judul/i.test(String(pb.teks || "")); return `<li><div class="ak-rj-a">${pb.tahun ? `<span class="ak-mp">${esc(pb.tahun)}</span>` : ""}${pb.kejadian ? `<b>${esc(pb.kejadian)}</b>` : ""}${pb.otomatis ? '<span class="ak-mp ak-mp-redup">Dicocokkan otomatis dari berita</span>' : ""}${judulSaja ? '<span class="ak-mp ak-mp-redup">Ringkasan judul</span>' : ""}${urlOk(pb.sumber_url) ? `<a class="ak-ik-l" href="${esc(urlOk(pb.sumber_url))}" ${LUAR} title="Sumber" aria-label="Sumber">${ikon(IK_LUAR, "currentColor")}</a>` : ""}</div><p>${esc(tk)}</p></li>`; }).join("")}</ul>` : "")
      + bagB("Bidang", bid.length || strs(x.sektor).length ? `<div class="ak-pil ak-mps">${bid.map(b => pilMini(IKL.jenis, kapital(String(b).trim()))).join("")}${strs(x.sektor).map(r => pilSektor(r)).join("")}</div>` : "")
      + (dlist(x.sensor).length ? bagB("Sensor", daftarBkr(dlist(x.sensor).map(barisSensor))) : "")
      + (dlist(x.inovasi_produk).length ? bagB("Inovasi", daftarBkr(dlist(x.inovasi_produk).map(barisProduk))) : "")
      + `<div id="${pre}Izin"></div><div id="${pre}Kap"></div><div id="${pre}Sd"></div><div id="${pre}Dana"></div><div id="${pre}Proy"></div><div id="${pre}Jur"></div>`
      + bagB("Kantor pusat", !bp && (x.alamat || Number.isFinite(x.lat)) ? `<p>${x.alamat ? `<a href="${esc(urlPeta(x))}" ${LUAR}>${esc(x.alamat)}</a>` : esc(lok)} ${tautPeta(x)} ${cip(sumberButir(x, "alamat")?.url)}</p>${x.lokasi_sumber ? `<small class="ak-lper">Titik peta ditentukan dari ${esc(x.lokasi_sumber)}</small>` : ""}` : "")
      + `<div id="${pre}Brt"></div>`
      + (bp ? "" : bagB("Sumber", sumberRapi(sumberUnik(x).map(a => a[0])) + lbPeriksa(x)))
      + pengurusMeti(x) + bagB("Lembaga sejenis", (() => { const sama = y => y.id !== x.id && y.kategori === x.kategori, tier = y => (!x.sub || String(y.sub || "").toLowerCase() === String(x.sub).toLowerCase() ? 0 : 2) + (x.prov && y.prov === x.prov ? 0 : 1);
        const a = lbArr.filter(sama).sort((p, q) => tier(p) - tier(q) || q._skor - p._skor).slice(0, 6);
        return a.length ? daftarBkr(a.map(barisLb)) : ""; })());
    const isiAsync = cek => {
      ambilData("berita").then(d => { const h = brtHtml("lembaga", x.id, d); if (h) isiNanti(cek, pre + "Brt", h); });
      ambilData("lembaga_ekstra").then(d => { const e = d?.lembaga?.[x.id], h = izinLb(e), k = kapLb(e); if (h) isiNanti(cek, pre + "Izin", h); if (k) isiNanti(cek, pre + "Kap", k); });
      ambilData("proyek_mitra").then(d => { const a = Array.isArray(d) ? proyekLembaga(d, x) : []; if (a.length) isiNanti(cek, pre + "Proy", bagB(`Proyek mitra (3W) ${angka(a.length)}`, `${tabelProyek(a.slice(0, 20))}<span class="ak-tanda">Data dilaporkan donor ke IATI, bisa tidak lengkap</span>`)); });
      ambilData("pendanaan").then(d => { const a = dlist(Array.isArray(d) ? d : d?.pendanaan).filter(y => y.lembaga_id === x.id); if (a.length) { const pr = a.filter(y => y.jenis_entri === "proyek"), sk = a.filter(y => y.jenis_entri !== "proyek"); isiNanti(cek, pre + "Dana", bagB(`Pendanaan ${angka(a.length)}`, (sk.length ? daftarBkr(sk.slice(0, 10).map(y => barisDana(y))) : "") + (pr.length ? gridProyek(pr.slice(0, 12).map(dariDana)) : ""))); } });
      ambilData("sistem_data").then(d => { const a = dlist(Array.isArray(d) ? d : d?.sistem).filter(y => y.lembaga_id === x.id); if (a.length) isiNanti(cek, pre + "Sd", bagB(`Sistem data ${angka(a.length)}`, daftarBkr(a.map(barisSd)))); });
      ambilData("jurnal").then(d => { const a = Array.isArray(d) ? jurnalLembaga(d, x) : []; if (a.length) isiNanti(cek, pre + "Jur", bagB(`Jurnal terbitan ${x.singkatan || x.nama} ${angka(a.length)}`, `<div class="ak-jgrid">${a.map(kartuJur).join("")}</div>`)); });
    };
    return {kepala, tubuh, isiAsync};
  }
  /* izin, badan hukum, daftar hitam LKPP, dan identitas silang (lembaga_ekstra, panen 30 Okt 2026); semua dicocokkan dari nama, jadi sumbernya ditulis */
  const IZIN_L = {"laz berizin": "LAZ berizin Kemenag", "baznas resmi": "BAZNAS resmi", "laz direkomendasikan baznas": "Direkomendasikan BAZNAS", "izin pub tercatat di laman lembaga": "Izin PUB tertulis di laman lembaga", "izin laz berakhir": "Izin LAZ Kemenag sudah berakhir"};
  const izinLb = () => "";
  /* armada (kantor SAR) dan dana energi terbarukan dari laporan tahunan lembaga filantropi (lembaga_ekstra, panen 31 Okt 2026) */
  const kapLb = () => "";
  function bukaLb(x) {
    const r = rakitLb(x, false); bukaSheet("lembaga", r.kepala, r.tubuh); $("akSheet").dataset.k = ""; const tk = tokenS; r.isiAsync(() => tk === tokenS); terhubungDi("L:" + x.id);
  }
  let drTok = 0;
  function bukaDrawer(x) {
    const r = rakitLb(x, true), d = $("akDrawer"), tk = ++drTok; d.hidden = false;
    $("akDrIsi").innerHTML = r.kepala + '<div class="ak-dtubuh" id="akDrTubuh"><div class="ak-hantu"></div></div>'; d.scrollTop = 0;
    nanti(() => { if (tk === drTok) { $("akDrTubuh").innerHTML = r.tubuh(); r.isiAsync(() => tk === drTok && !d.hidden); terhubungDi("L:" + x.id); } });
  }
  const tutupDrawerAman = () => { const d = $("akDrawer"); if (d) tutupDrawer(); };
  const tutupDrawer = () => { drTok++; $("akDrawer").hidden = true; };

  /* ---- analisa (L42): peta di atas indeks risiko provinsi, kesenjangan wilayah, matriks provinsi x bidang, komposisi ---- */
  let risikoP = null, geoP = null;
  const ambilJson = u => fetch(u).then(r => r.ok ? r.json() : null).catch(() => null);
  const kelasWarna = ["var(--warn-bg)", "var(--data4)", "var(--meti-oranye)", "var(--bad)"];

  /* ---- proyek mitra / 3W (L43) ---- */
  const PJ = {q: "", fs: {prov: new Set(), donor: new Set(), sektor: new Set(), status: new Set()}, hal: 1}, PJPER = 25; MSG.pj = {st: PJ.fs, f: ["prov", "donor", "sektor", "status"], h: () => { PJ.hal = 1; }, g: () => gambarPj(false), lab: (f, v) => f === "prov" ? provT(v) : f === "sektor" ? sektorNama(v) : String(v)};
  let pjArr = [], pjHasil = [], pjSiap = false, pjtok = 0;
  function gambarPj(gulir) {
    pjHasil = pjArr.filter(p => dalam(PJ.fs.prov, strs(p.prov)) && dalam(PJ.fs.donor, [p.donor]) && dalam(PJ.fs.sektor, strs(p.sektor)) && dalam(PJ.fs.status, [stLabel(p.status)]) && (!PJ.q || p._cari.includes(PJ.q.toLowerCase())));
    const n = pjHasil.length, a = (PJ.hal - 1) * PJPER, total = pjHasil.reduce((s, p) => s + (Number(p.nilai_usd) || 0), 0);
    $("akPjJ").innerHTML = `<b>${angka(n)}</b> proyek mitra, nilai <b>${esc(usdR(total))}</b>${msAda("pj") ? " " + msChips("pj") : ""}`; msTandai("pj");
    $("akPjL").innerHTML = n ? tabelProyek(pjHasil.slice(a, a + PJPER), true) + `<p class="ak-lkaki">Sumber: ${CATATAN_PROYEK()}</p>` : hampa("proyek");
    $("akPjH").innerHTML = navHal(PJ.hal, n, PJPER, "proyek");
    if (gulir) gulirKe("akPjJ");
  }
  function bangunProyek(el) {
    if (pjSiap) return; pjSiap = true; el.innerHTML = hantuHtml;
    ambilData("proyek_mitra").then(d => nanti(() => {
      if (!Array.isArray(d) || !d.length) { pjSiap = false; el.innerHTML = kosongHtml("Proyek mitra"); return; }
      pjArr = d.filter(p => p && p.judul).map(p => Object.assign(p, {donor: donorBaku(p.donor), _cari: [p.judul, p.donor, p.pelaksana, ...strs(p.sektor)].filter(Boolean).join(" ").toLowerCase()})).sort((a, b) => (b.nilai_usd || 0) - (a.nilai_usd || 0));
      const hit = f => { const n = {}; pjArr.forEach(p => { for (const k of [].concat(f(p))) if (k) n[k] = (n[k] || 0) + 1; }); return n; }, nP = hit(p => strs(p.prov)), nD = hit(p => p.donor), nS = hit(p => strs(p.sektor));
      el.innerHTML = `<div class="ak-saring"><div class="ak-alat">${cariKotak("akPjQ", "Cari judul, donor, pelaksana, atau sektor")}</div>
        <div class="ak-baris ak-baris4">${htmlPilih("akPjP", IKON_PIN, "Cari provinsi")}${htmlPilih("akPjD", IK_UANG, "Cari donor")}${htmlPilih("akPjS", IKL.jenis, "Cari sektor")}${htmlPilih("akPjSt", IK_BAR, "Cari status")}</div></div>
        <div class="ak-hasil"><h2 class="ak-judulv" id="akPjJ"></h2><div id="akPjL"></div><nav id="akPjH" class="ak-hal" aria-label="Halaman daftar proyek" aria-live="polite"></nav></div>`;
      const jalan = () => { const t = ++pjtok; nanti(() => { if (t === pjtok) gambarPj(false); }); }, ubah = (k, v) => { PJ[k] = v; PJ.hal = 1; jalan(); };
      msPilih("akPjP", "pj", "prov", {semua: "Semua provinsi", opsi: () => Object.entries(nP).sort((a, b) => b[1] - a[1]).map(([v, c]) => [v, provT(v), c])});
      msPilih("akPjD", "pj", "donor", {semua: "Semua donor", opsi: () => Object.entries(nD).sort((a, b) => b[1] - a[1]).map(([v, c]) => [v, v, c])});
      msPilih("akPjSt", "pj", "status", {semua: "Semua status", opsi: () => { const n = {}; pjArr.forEach(p => { const l = stLabel(p.status); if (l) n[l] = (n[l] || 0) + 1; }); return Object.entries(n).sort((a, b) => b[1] - a[1]).map(([v, c]) => [v, v, c]); }, ik: v => { const w = Object.values(STATUS_ID).find(x => x[0] === v)?.[1]; return w ? ['<circle cx="12" cy="12" r="6"/>', w] : null; }});
      msPilih("akPjS", "pj", "sektor", {semua: "Semua sektor", opsi: () => Object.entries(nS).sort((a, b) => b[1] - a[1]).map(([v, c]) => [v, sektorNama(v), c]).filter(x => x[1] && !/^\d+$/.test(x[1]))});
      let tt = 0; $("akPjQ").addEventListener("input", e => { clearTimeout(tt); tt = setTimeout(() => ubah("q", e.target.value.trim()), 250); });
      pasangHal("akPjH", h => { PJ.hal = h; gambarPj(true); });
      gambarPj(false); }));
  }

  /* ---- peta berlogo (L4P, PRD 6.1a): MapLibre dimuat malas; pin logo = marker HTML terbatas per viewport (decluttering), sisanya titik di circle layer ---- */
  /* MapLibre GL 4.7.1 vendor lokal (/vendor/maplibre), satu jalur muat lewat inti/maplibre.js (CSP script-src 'self') */

  const PULAU = {"Sumatera": ["11", "12", "13", "14", "15", "16", "17", "18", "19", "21"], "Jawa-Bali": ["31", "32", "33", "34", "35", "36", "51"], "Kalimantan": ["61", "62", "63", "64", "65"],
    "Sulawesi": ["71", "72", "73", "74", "75", "76"], "Nusa Tenggara": ["52", "53"], "Maluku-Papua": ["81", "82", "91", "92", "93", "94", "95", "96"]};
  const WARNA_SENSOR = {seismik: "var(--meti-oranye)", pasut: "var(--data5)", gnss: "var(--line-ctl)", cuaca: "var(--line-ctl)", hidrologi: "var(--data5)", "gunung api": "var(--bad)", buoy: "var(--data2)", satelit: "var(--ink2)"};
  const BIRU = ["var(--soft-biru)", "var(--line)", "var(--data3)", "var(--data5)", "var(--data5)"], MERAH = ["var(--bad-bg)", "var(--warn-bg)", "var(--data4)", "var(--meti-oranye)", "var(--bad)"];
  const PT = {map: null, mode: "pin", kat: new Set(), sens: "", lapis: {lembaga: true, kampus: true, pusat: false, proyek: false, sensor: false, strat: !/[?&]strat=0/.test(location.search)}, pulau: "", tingkat: "prov", ukuran: "jumlah", pins: new Map(), geoProv: null, kabCache: {}, pusatArr: [], proyekArr: [], sensorArr: [], snOff: new Set(), items: [], itemsCho: [], siap: false};
  const bbox = f => { let a = 180, b = 90, c = -180, d = -90; const w = g => { if (typeof g[0] === "number") { a = Math.min(a, g[0]); c = Math.max(c, g[0]); b = Math.min(b, g[1]); d = Math.max(d, g[1]); } else g.forEach(w); }; w(f.geometry.coordinates); return [a, b, c, d]; };
  const kunciKab = n => { n = String(n || ""); return (/^kota\b/i.test(n) ? "K:" : "") + nrm(n.replace(/^(kabupaten|kab\.?|kota|administrasi)\s+/i, "")); };
  const bobot = x => (x._skala === "nasional" || x._skala === "internasional" ? 3 : 0) + (lbCabang.get(x.id)?.length || 0) * .5 + (x._skor || 0) * .4 + (urlOk(x.logo) ? 2 : 0);
  const adaKontak = x => strs(x.telepon).length + strs(x.wa).length + strs(x.email).length > 0;
  /* singkatan generik (Dinas, Kantor, Balai) tidak membedakan daerah: label pin memakai nama lengkap yang dipendekkan */
  const SING_GENERIK = /^(Dinas|Kantor|Balai|Badan|Asosiasi|Pusat)$/i;
  const labelPin = x => { const sg = x.singkatan; if (!sg) return x.nama; if (!SING_GENERIK.test(sg.trim()) && !(/^BMKG$/i.test(sg.trim()) && x._skala !== "nasional" && x._skala !== "internasional")) return sg;
    const n = String(x.nama).replace(/\bKabupaten\b/g, "Kab.").replace(/\bProvinsi\s+/g, "").replace(/\s*\(.*?\)\s*/g, " ").replace(/\s+/g, " ").trim(); return n.length > 30 ? n.slice(0, 29) + "\u2026" : n; };
  function itemPeta() {
    const L = [];
    /* lapisan Strategis berdiri sendiri: Mitra/Kampus dimatikan, partner strategis tetap tampil */
    if (!PT.cent && !PT.centMuat) { PT.centMuat = true; geoProvinsi().then(() => nanti(segarPeta)).catch(() => {}); }
    /* lembaga tanpa koordinat: pusat provinsi sebagai perkiraan (presisi "provinsi"), seperti peta proyek */
    const tt = x => Number.isFinite(x.lat) && Number.isFinite(x.lon) ? x : (x.prov && PT.cent?.[x.prov] ? {lat: PT.cent[x.prov][1], lon: PT.cent[x.prov][0], presisi: "provinsi"} : null);
    if (PT.lapis.lembaga || PT.lapis.strat) for (const x of lbArr) { const p = tt(x); if (p && (PT.lapis.lembaga || strat("L:" + x.id)) && x.kategori !== "penerbit" && (!PT.kat.size || PT.kat.has(x.kategori)))
      L.push({key: "l:" + x.id, jenis: "lembaga", lat: p.lat, lon: p.lon, nama: labelPin(x), tip: x.nama + (p.presisi && p.presisi !== "tepat" ? " (lokasi perkiraan)" : ""), perkiraan: !!p.presisi && p.presisi !== "tepat", ini: inisPin(x.singkatan || x.nama), sub: KAT[x.kategori]?.[0] || x.kategori, logo: chainLogo(x), ik: (KAT[x.kategori] || [])[1], warna: (KAT[x.kategori] || [])[2] || "var(--ink2)", redup: !!GL.r && x._rum.size > 0 && !glList().some(r => x._rum.has(r)), w: bobot(x) + (strat("L:" + x.id) ? 30 : 0), bintang: !!strat("L:" + x.id), buka: () => bukaLb(x)}); }   // pemilik: lembaga dibuka sebagai pop-up seperti kampus
    if (PT.lapis.kampus || PT.lapis.strat) for (const [k, v] of Object.entries(kampusInfo)) if ((PT.lapis.kampus || strat("K:" + k)) && (!PT.kat.size || PT.kat.has("kampus")) && Number.isFinite(v?.lat) && Number.isFinite(v?.lon))
      L.push({key: "k:" + k, jenis: "kampus", lat: v.lat, lon: v.lon, nama: k, tip: k, sub: "Kampus", ik: IK_KAMPUS, logo: [urlOk(logoK[k])].filter(Boolean), warna: "var(--data1)", w: 1 + (perK[k] || 0) / 8 + (strat("K:" + k) ? 30 : 0), bintang: !!strat("K:" + k), buka: () => profilKampus(k)});
    if (PT.lapis.pusat) PT.pusatArr.forEach((x, i) => { const v = kampusInfo[x.induk]; if (Number.isFinite(v?.lat)) L.push({key: "p:" + i, jenis: "pusat", lat: v.lat + (i % 5) * .004, lon: v.lon + (i % 7) * .004, nama: x.singkatan || x.nama, tip: x.nama, sub: "Pusat studi", ik: IK_KAMPUS, logo: [urlOk(logoK[x.induk])].filter(Boolean), warna: "var(--ok)", w: .5, buka: () => profilKampus(x.induk)}); });
    if (PT.lapis.proyek) PT.proyekArr.forEach(x => { const o = x.lokasi || {}; if (Number.isFinite(o.lat) && Number.isFinite(o.lng)) L.push({key: "j:" + x.id, jenis: "proyek", lat: o.lat, lon: o.lng, nama: x.nama, tip: x.nama + (o.presisi && o.presisi !== "tepat" ? " (titik perkiraan)" : ""), sub: "Proyek", ik: IK_BAR, warna: "var(--meti-oranye)", w: .3, label: false, buka: () => location.assign("/proyek#" + encodeURIComponent(x.id))}); });
    /* titik berkoordinat identik digabung jadi satu pin bertumpuk "N lembaga": satu pin = satu item, tidak ada label, logo, atau klik yang tercampur */
    const kel = new Map(); L.forEach(it => { if (it.jenis === "pusat" || it.jenis === "proyek" || it.bintang) return; const k = it.lat.toFixed(4) + "," + it.lon.toFixed(4); (kel.get(k) || kel.set(k, []).get(k)).push(it); });
    const gabung = new Set(), grup = [];
    kel.forEach((a, k) => { if (a.length < 2) return; a.forEach(it => gabung.add(it)); const kw = a.slice().sort((x, y) => y.w - x.w);
      grup.push({key: "g:" + k, jenis: "grup", lat: a[0].lat, lon: a[0].lon, nama: `${a.length} lembaga`, tip: `${a.length} lembaga dan kampus di titik yang sama`, sub: "Titik bersama", ik: IK_GEDUNG, logo: [], warna: "var(--data1)", w: kw[0].w + a.length, bintang: a.some(x => x.bintang), ref: kw, buka: () => bukaGrupPin(kw)}); });
    return L.filter(it => !gabung.has(it)).concat(grup);
  }
  /* baris modal titik bersama: pil hanya kategori + kota + sektor utama (provinsi = kota di titik yang sama, dibuang) */
  const barisLbGrup = y => { const k = KAT[y.kategori] || [y.kategori, KAT.riset[1], "var(--ink2)"], r0 = strs(y.sektor)[0];
    return barisKaya({attr: `data-lb="${esc(y.id)}"`, logo: logoLb(y), nama: judulCase(y.nama) + (y.singkatan && !nrm(y.nama).includes(nrm(y.singkatan)) ? ` (${y.singkatan})` : ""), pil: pilMini(k[1], k[0], k[2]) + (y.kab ? pilMini(IKON_PIN, y.kab) : "") + (r0 ? pilSektor(r0) : "")}); };
  function bukaGrupPin(a) {
    bukaSheet("detail", `<div class="ak-dkepala"><div class="ak-dk-atas"><span class="ak-lgo ak-lgo-k ak-lgo-grup" data-st="--w0:var(--data1)">${ikon(IK_GEDUNG, "var(--data1)")}</span><div class="ak-nama"><h2 id="akSJudul">${angka(a.length)} lembaga di titik yang sama</h2><p>Koordinat peta identik, pilih salah satu untuk membuka profilnya.</p></div></div></div>`, () => daftarBkr(a.map(it => { if (it.jenis === "lembaga") { const x = lbMap.get(it.key.slice(2)); if (x) return barisLbGrup(x); } return barisKaya({attr: `data-kp="${esc(it.tip)}"`, logo: logoKecil(it.tip), nama: it.tip, sub: "Kampus"}); })));
  }
  const geoPts = a => ({type: "FeatureCollection", features: a.map(i => ({type: "Feature", properties: {key: i.key, warna: rv(i.warna), op: i.redup ? .2 : 1}, geometry: {type: "Point", coordinates: [i.lon, i.lat]}}))});
  /* sensor: warna menurut jenis (palet Okabe-Ito, aman buta warna), bentuk menurut pemilik jaringan: lingkaran BMKG, berlian BIG, segitiga internasional */
  let snTok = 0;
  const SN_KLS = [];   // lapisan sensor asal (jaringan) dinonaktifkan; menunggu data METI bila ada
  const snKls = s => /muka air sungai/i.test(s.jenis || "") ? (/SIHKA/i.test(s.jaringan || "") ? "tmas" : "tmad") : /muka laut|pasang/i.test(s.jenis || "") ? (s.pemilik === "big" ? "mlg" : "mlb") : /^IA\b/.test(s.jaringan || "") ? "ia" : "int";
  const snSvg = (b, w, k) => `<svg viewBox="0 0 20 20" width="${k || 16}" height="${k || 16}" aria-hidden="true">${b === "c" ? '<circle cx="10" cy="10" r="7"/>' : b === "t" ? '<path d="M10 2.5 18 16.5H2z"/>' : '<path d="M10 1.5 18.5 10 10 18.5 1.5 10z"/>'}</svg>`.replace("<svg ", `<svg fill="${w}" stroke="var(--on-brand)" stroke-width="1.6" `);
  const snIkon = (m, k) => { const [id, , w, b] = SN_KLS.find(x => x[0] === k), n = "sn-" + id; if (m.hasImage(n)) return; const c = document.createElement("canvas"); c.width = c.height = 32; const g = c.getContext("2d"); g.fillStyle = rv(w); g.strokeStyle = rv("var(--on-brand)"); g.lineWidth = 3; g.beginPath();
    if (b === "c") g.arc(16, 16, 11, 0, 7); else if (b === "t") { g.moveTo(16, 4); g.lineTo(29, 27); g.lineTo(3, 27); g.closePath(); } else { g.moveTo(16, 3); g.lineTo(29, 16); g.lineTo(16, 29); g.lineTo(3, 16); g.closePath(); } g.stroke(); g.fill(); m.addImage(n, g.getImageData(0, 0, 32, 32), {pixelRatio: 2}); };
  const geoSens = () => ({type: "FeatureCollection", features: PT.sensorArr.filter(s => (!PT.sens || s.jenis === PT.sens) && !PT.snOff.has(snKls(s)) && Number.isFinite(s.lat) && Number.isFinite(s.lon)).map(s => ({type: "Feature", properties: {id: s.id, nama: s.nama, jenis: s.jenis, jaringan: s.jaringan || "", pemilik: s.pemilik || "", status: s.status || "", ikon: "sn-" + snKls(s), warna: WARNA_SENSOR[s.jenis] || "var(--ink2)"}, geometry: {type: "Point", coordinates: [s.lon, s.lat]}}))});
  function segarSnLeg() { const k = $("akSnLeg"); if (!k) return; const aktif = PT.lapis.sensor && PT.sensorArr.length; k.hidden = !aktif; if (!aktif) return; const n = {}; PT.sensorArr.forEach(x => { const c = snKls(x); n[c] = (n[c] || 0) + 1; });
    k.classList.toggle("lipat", !!PT.snLipat); k.innerHTML = `<h4 role="button" tabindex="0" data-snlipat="1" aria-expanded="${!PT.snLipat}">Jaringan sensor, ${angka(PT.sensorArr.length)} titik<svg class="ak-panah" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></h4>` + SN_KLS.filter(x => n[x[0]]).map(([id, l, w, b]) => `<button type="button" data-sn="${id}" aria-pressed="${!PT.snOff.has(id)}" title="Klik untuk menampilkan atau menyembunyikan">${snSvg(b, w, 10)}<span>${esc(l)}</span><b>${angka(n[id])}</b></button>`).join(""); }
  /* tip hover dan lembar titik sensor: ikon kelas + nama stasiun, pil kelas, baris berlabel (jaringan, pemilik berlogo, status) */
  const PEMILIK_SN = {bmkg: "BMKG", pupr: "Kementerian PU", big: "BIG", pemda: "Pemerintah daerah"};
  const infoSn = p => { const id = String(p.ikon || "").replace(/^sn-/, ""), k = SN_KLS.find(x => x[0] === id) || SN_KLS[1], ow = p.pemilik && lbMap.get(p.pemilik), nm = ow ? ow.singkatan || ow.nama : PEMILIK_SN[p.pemilik] || (p.pemilik ? String(p.pemilik).toUpperCase() : "Jaringan internasional"),
      lg = ow ? chainLogo(ow) : logoPemUrl(PEMILIK_SN[p.pemilik] || nm), lama = /lebih dari|lama|nonaktif|tidak aktif|mati/i.test(p.status || "") && !/^(pos duga air )?aktif/i.test(p.status || ""), kls = k[1].replace(/\s*\(.*?\)\s*/g, " ").trim();
    return {k, kls, nm, lg, ow, lama, st: p.status ? (lama ? "Bacaan lama" : "Aktif") : ""}; };
  const barisSn = (ik, lab, isi) => isi ? `<div>${ikon(ik, "currentColor")}<dt>${lab}</dt><dd>${isi}</dd></div>` : "";
  const tipSensor = p => { const f = infoSn(p), lgo = f.lg.length ? lgoIkon(f.lg, IK_GEDUNG, "var(--data1)", 1) : "";
    return `<div class="ak-tipw ak-tips"><div class="ak-tips-h">${snSvg(f.k[3], f.k[2], 20)}<b>${esc(p.nama)}</b></div><span class="ak-mp ak-tips-k" data-st="--w0:${f.k[2]}">${esc(f.kls)}</span>
      <dl>${barisSn(IK_BAR, "Jaringan", p.jaringan ? esc(p.jaringan) : "")}${barisSn(IK_GEDUNG, "Pemilik", `<span class="ak-tips-o">${lgo}${esc(f.nm)}</span>`)}${barisSn(IKL.tahun, "Status", f.st ? `<span class="ak-tips-s"><i class="${f.lama ? "lama" : "aktif"}"></i>${f.st}</span>` : "")}</dl></div>`; };
  function lembarSensor(p) { const f = infoSn(p), x = (PT.sensorArr || []).find(y => y.id === p.id) || {}, u = urlOk(x.sumber_url);
    bukaSheet("detail", `<div class="ak-dkepala"><div class="ak-dk-atas"><span class="ak-lgo ak-lgo-k" data-st="--w0:${f.k[2]};background:${f.k[2]}">${snSvg(f.k[3], "var(--on-brand)", 26)}</span><div class="ak-nama"><h2 id="akSJudul">${esc(p.nama)}</h2><div class="ak-pil"><span class="ak-mp ak-tips-k" data-st="--w0:${f.k[2]}">${esc(f.kls)}</span>${f.st ? `<span class="ak-mp"><i class="ak-tips-d ${f.lama ? "lama" : "aktif"}"></i>${f.st}</span>` : ""}</div></div></div></div>`,
      () => bagB("Keterangan", `<div class="ak-bgrup">${barisB("Jaringan", esc(p.jaringan || ""))}${barisB("Pengelola", esc(x.pengelola || ""))}${barisB("Pemilik", esc(f.nm))}${barisB("Jenis", esc(kapital(p.jenis || "")))}${barisB("Status", esc(p.status || ""))}${barisB("Koordinat", Number.isFinite(x.lat) ? `<a href="https://www.google.com/maps/search/?api=1&query=${x.lat},${x.lon}" ${LUAR}>${x.lat.toFixed(4)}, ${x.lon.toFixed(4)}</a>` : "")}${barisB("Diperiksa", x.diperiksa ? esc(tglID(x.diperiksa)) : "")}</div>`) + bagB("Sumber", u ? sumberRapi([u]) : "") + (f.ow ? bagB("Pemilik di direktori", daftarBkr([barisLb(f.ow)])) : ""));
    $("akSheet").dataset.k = ""; }
  const inisPin = n => { const k = String(n || "").replace(/\([^)]*\)/g, " ").split(/[\s/-]+/).filter(w => /^[A-Za-z0-9]/.test(w) && !/^(PT|CV|Tbk|dan|of|the|Persero)$/i.test(w)); return (k.length > 1 && String(n).length > 6 ? k.slice(0, 2).map(w => w[0]).join("") : (k[0] || "?").slice(0, 3)).toUpperCase(); };
  const elPin = i => { const b = document.createElement("button"); b.type = "button"; b.className = "ak-pin" + (i.redup ? " redup" : ""); b.title = i.tip; b.setAttribute("aria-label", i.tip || i.nama || "");
    b.innerHTML = `<span class="ak-pinlogo" data-st="--w0:${esc(i.warna)}">${i.ini ? `<b class="ak-pini">${esc(i.ini)}</b>` : ikon(i.ik || IK_GEDUNG, i.warna)}${(() => { const a = [].concat(i.logo || []).filter(u => urlOkLogo(u)); return a.length ? `<img src="${esc(urlOk(a[0]))}" alt="" referrerpolicy="no-referrer" loading="lazy" data-next="${esc(a.slice(1).join("|"))}">` : ""; })()}</span>${i.bintang ? bintangI(i.key.replace(/^l:/, "L:").replace(/^k:/, "K:")) : ""}<span class="ak-pinlabel${i.label === false ? " sembunyi" : ""}">${esc(i.nama)}</span>`;
    b.addEventListener("click", e => { e.stopPropagation(); i.buka(); }); return b; };
  /* decluttering: urut bobot, tolak pin yang kotaknya menimpa pin terpilih; batas jumlah menurut zoom */
  const _kv = document.createElement("canvas").getContext("2d"); _kv.font = "700 12px sans-serif"; const ukurTeks = t => _kv.measureText(t).width;
  function gambarPin() {
    const m = PT.map; if (!m || !PT.siap) return;
    const z = m.getZoom(), b = m.getBounds(), kotak = [], pilih = [], lebar = i => 40 + Math.min(ukurTeks(String(i.nama)) + 18, 168);
    const tabrak = (p, w) => kotak.some(k => p.x - 19 < k[2] && p.x - 19 + w > k[0] && p.y - 20 < k[3] && p.y + 20 > k[1]);
    /* tanpa angka: semua lembaga selalu pin logo. Pin yang berdekatan (sel 40 px) disebar melingkar bertingkat dalam piksel layar */
    const dalam = PT.items.filter(i => b.contains([i.lon, i.lat])), sel = new Map();
    dalam.forEach(i => { const p = m.project([i.lon, i.lat]), k = Math.floor(p.x / 40) + "," + Math.floor(p.y / 40); (sel.get(k) || sel.set(k, []).get(k)).push(i); });
    sel.forEach(a => { a.sort((x, y) => String(x.key).localeCompare(String(y.key))); a.forEach((i, n) => { if (a.length < 2) { i._off = [0, 0]; return; } let c = 8, g = 1, j = n; while (j >= c) { j -= c; g++; c = 8 * g; } const t = -Math.PI / 2 + 2 * Math.PI * j / Math.min(c, a.length - (n - j)), r = 26 * g; i._off = [Math.round(r * Math.cos(t)), Math.round(r * Math.sin(t))]; }); });
    /* label nama hanya untuk pin yang tidak bertabrakan (atau zoom >= 7); sisanya tampil saat hover/fokus */
    for (const i of dalam.sort((a, c) => c.w - a.w)) { const p0 = m.project([i.lon, i.lat]), p = {x: p0.x + i._off[0], y: p0.y + i._off[1]}, w = lebar(i), t = tabrak(p, w); i._tl = t && z < 7; kotak.push([p.x - 19, p.y - 20, p.x - 19 + (t ? 40 : w), p.y + 20]); pilih.push(i); }
    const ada = new Set(pilih.map(i => i.key));
    for (const [k, mk] of PT.pins) { const it = pilih.find(i => i.key === k); if (!it || mk._tl !== it._tl || mk._off !== String(it._off)) { mk.remove(); PT.pins.delete(k); } }
    for (const i of pilih) if (!PT.pins.has(i.key)) { const it = i._tl ? {...i, label: false} : i, mk = new maplibregl.Marker({element: elPin(it), anchor: "left", offset: [-19 + (i._off?.[0] || 0), i._off?.[1] || 0]}).setLngLat([i.lon, i.lat]).addTo(m); mk._tl = i._tl; mk._off = String(i._off); PT.pins.set(i.key, mk); }
  }
  let pinT = 0; const jadwalPin = () => { cancelAnimationFrame(pinT); pinT = requestAnimationFrame(() => nanti(gambarPin)); };
  function segarLayerBtn() { const a = $("akPtLayer"); if (!a) return; const set = (ly, n) => { const b = a.querySelector(`[data-ly="${ly}"]`); if (!b) return; b.hidden = !(n > 0); let sm = b.querySelector("small"); if (!sm) { sm = document.createElement("small"); b.append(sm); } sm.textContent = angka(n); };
    set("strat", STRAT ? Object.values(STRAT).filter(v => v?.bintang).length : 0); set("pusat", PT.pusatArr.length); set("sensor", PT.sensorArr.length); }
  function segarPeta() {   // dipanggil setelah lapisan/kategori/data berubah
    const m = PT.map; if (!m || !PT.siap) return; segarLayerBtn();
    PT.items = itemPeta(); if (PT.fitKat) { PT.fitKat = false; const ks = PT.kat.size ? PT.items : []; if (ks.length) { const lo = ks.map(i => i.lon), la = ks.map(i => i.lat); m.fitBounds([[Math.min(...lo) - .5, Math.min(...la) - .5], [Math.max(...lo) + .5, Math.max(...la) + .5]], {padding: innerWidth > 700 ? {top: 80, bottom: 50, left: Math.round(($("akPita")?.getBoundingClientRect().width || 340) + 36), right: 70} : {top: 70, bottom: 260, left: 40, right: 40}, maxZoom: 9, duration: 400}); } } if (!PT.fitStrat && stratOn()) { const st2 = PT.items.filter(i => i.bintang && i.lon > 94 && i.lon < 142 && i.lat > -12 && i.lat < 7); if (st2.length) { PT.fitStrat = true; const lo = st2.map(i => i.lon), la = st2.map(i => i.lat); m.fitBounds([[Math.min(...lo) - 1, Math.min(...la) - 1], [Math.max(...lo) + 1, Math.max(...la) + 1]], {padding: innerWidth > 700 ? {top: 80, bottom: 50, left: Math.round(($("akPita")?.getBoundingClientRect().width || 340) + 36), right: 70} : {top: 70, bottom: 260, left: 40, right: 40}, animate: false, maxZoom: 6}); } } m.getSource("pts")?.setData(geoPts(PT.items)); m.getSource("sns")?.setData(geoSens());
    for (const mk of PT.pins.values()) mk.remove(); PT.pins.clear(); gambarPin();
    const vis = (id, v) => { if (m.getLayer(id)) m.setLayoutProperty(id, "visibility", v ? "visible" : "none"); };
    vis("pts-dot", PT.mode === "pin"); vis("sns-dot", PT.lapis.sensor); segarSnLeg();
    document.querySelectorAll("#akPtLayer [data-ly]").forEach(b => b.setAttribute("aria-pressed", String(!!PT.lapis[b.dataset.ly])));
  }
  /* kartu tip wilayah peta: judul, angka ukuran terpilih dengan satuan, lalu baris fakta berlabel */
  /* lambang wilayah (lambang_wilayah.json: {prov: {kode: {logo}}, kab: {"kode|Nama Kab": {logo}}}), dimuat malas, opsional */
  const muatLambang = () => Promise.resolve();
  const lambangUrl = (kode, kab) => !kab && /^\d{2}$/.test(String(kode)) ? `/img/provinsi/${kode}.png` : "";   // berkas hilang -> ikon pin (pendengar error di bawah)
  const lambangHtml = (url, px) => url ? `<img class="ak-lw" src="${esc(url)}" alt="" width="${px}" height="${px}" loading="lazy" referrerpolicy="no-referrer">` : `<span class="ak-lw ak-lw0" data-st="width:${px}px;height:${px}px">${ikon(IKON_PIN, "currentColor")}</span>`;
  const turunanLb = x => /^(stasiun|balai|pos |kantor sar|lpp rri|rri |tvri|unit )/i.test(String(x.nama || "")) || /^(bmkg|sar|rri)$/i.test(String(x.sub || ""));
  const tipLogos = a => { const pakai = new Set(), hasil = [], skor = x => (strat("L:" + x.id) ? 1000 : 0) + (terhLb(x.id)[0] || 0) + bobot(x), urut = a.slice().sort((p, q) => skor(q) - skor(p)), kat = new Set();
    const ambil = x => { const k = (chainLogo(x)[0] || x.id); if (pakai.has(k) || hasil.length >= 5) return false; pakai.add(k); hasil.push(x); return true; };
    urut.forEach(x => { if (!kat.has(x.kategori) && !turunanLb(x) && ambil(x)) kat.add(x.kategori); }); urut.forEach(x => { if (!turunanLb(x)) ambil(x); }); urut.forEach(x => ambil(x)); return hasil; };
  const tipTerbesar = a => { const pool = a.filter(x => !turunanLb(x)); return (pool.length ? pool : a).slice().sort((p, q) => ((strat("L:" + q.id) ? 1000 : 0) + (terhLb(q.id)[0] || 0) + bobot(q)) - ((strat("L:" + p.id) ? 1000 : 0) + (terhLb(p.id)[0] || 0) + bobot(p)))[0]; };
  const tipWilayah = r => {
    const prov = r.key && r.key.includes("|") ? "" : r.kode, a = dlist(r.a), jml = {}; a.forEach(x => { jml[x.kategori] = (jml[x.kategori] || 0) + 1; });
    const kats = Object.entries(jml).sort((p, q) => q[1] - p[1]), tot = a.length || 1;
    const orang = prov ? semua.filter(o => String(provO(o)) === String(prov)).length : 0, pj = prov ? PT.proyekArr.filter(x => x.lokasi?.provinsi === provT(prov)).length : 0;
    const ubin = [["Lembaga", r.n], ["Orang", orang], ["Proyek", pj]].filter(([, v]) => v > 0);
    const top = a.slice().sort((p, q) => ((strat("L:" + q.id) ? 1000 : 0) + (terhLb(q.id)[0] || 0) + bobot(q)) - ((strat("L:" + p.id) ? 1000 : 0) + (terhLb(p.id)[0] || 0) + bobot(p))).slice(0, 3);
    return `<div class="ak-tipw ak-tipw2"><div class="ak-tw-h">${lambangHtml(lambangUrl(prov, ""), 32)}<b>${esc(r.nama)}</b><span class="ak-tw-l">Lihat semua</span></div>
      ${ubin.length ? `<div class="ak-tw-u">${ubin.map(([l, v]) => `<div><b>${angka(v)}</b><small>${l}</small></div>`).join("")}</div>` : ""}
      ${kats.length ? pilKatP(kats) : ""}
      ${top.length ? `<div class="ak-tw-t"><small>Terbesar</small>${top.map(x => `<div class="ak-tw-r">${logoLb(x).replace('class="ak-lgo"', 'class="ak-lgo kecil"')}<b>${esc(x.nama)}</b><em>${esc((KAT[x.kategori] || [x.kategori])[0])}</em></div>`).join("")}</div>` : ""}</div>`; };
  /* peta dasar tanpa papan nomor jalan (mis. "3367"); nama jalan tetap tampil (keputusan pemilik) */
  /* label negara tetangga disembunyikan dan area di luar Indonesia diredam (kode sama dengan /proyek) */
  const INDONESIA = {type: "MultiPolygon", coordinates: [[[[94.8, 6.2], [97.8, 5.9], [100.8, 2.6], [102.6, 1.9], [104.5, 0.5], [106, -3], [106, -5], [124.9, -8], [124.9, -11.5], [105, -11.5], [94.5, -6.5], [94.8, 6.2]]], [[[108.8, 2.1], [111, 1.2], [114.5, 1.7], [115.8, 3.9], [117.8, 4.3], [119, 1], [119, -4.5], [108, -4.5], [108, 0], [108.8, 2.1]]], [[[118.5, 2.5], [125, 5], [128, 4.5], [135, 1], [141, 0], [141, -9.5], [128.5, -9.5], [128.5, -7.3], [125, -7.5], [119, -6], [118.5, 2.5]]]]};
  async function redamLuar(m) {
    let idLabel; for (const ly of m.getStyle()?.layers || []) if (ly.type === "symbol") { idLabel ||= ly.id; if (ly["source-layer"] === "place") m.setFilter(ly.id, ly.filter ? ["all", ly.filter, ["within", INDONESIA]] : ["within", INDONESIA]); }
    const g = await geoProvinsi().catch(() => null); if (!g || !m.getStyle() || m.getSource("luar")) return;
    const luar = [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]]]; for (const f of g.features) for (const poli of f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) luar.push(poli[0]);
    m.addSource("luar", {type: "geojson", data: {type: "Feature", geometry: {type: "Polygon", coordinates: luar}}});
    m.addLayer({id: "luar-redam", type: "fill", source: "luar", paint: {"fill-color": getComputedStyle(document.documentElement).getPropertyValue("--paper").trim() || "#fff", "fill-opacity": .72}}, idLabel);
  }
  const sembunyikanJalan = m => { for (const ly of m.getStyle()?.layers || []) if (ly.type === "symbol" && /shield|road_number|ref/i.test(ly.id)) m.setLayoutProperty(ly.id, "visibility", "none"); };
  const tipPeta = (e, html) => { const t = $("akTip"); if (!html) { t.hidden = true; return; } t.innerHTML = html; t.hidden = false; const x = e.originalEvent.clientX, y = e.originalEvent.clientY;
    t.style.left = Math.min(Math.max(8, x + 12), innerWidth - t.offsetWidth - 8) + "px"; t.style.top = Math.max(8, y - t.offsetHeight - 12) + "px"; };
  const sub1 = (L, f) => { const m = new Map(); L.forEach(x => { const k = f(x); if (k == null) return; (m.get(k) || m.set(k, []).get(k)).push(x); }); return m; };

  /* ---- pita wilayah ---- */
  /* sidebar kiri peta Lembaga: tabel wilayah yang bisa diurut, turun Indonesia > provinsi > kab/kota > lembaga */
  const SDP = {prov: "", kab: "", urut: "tot", arah: -1, q: "", lipat: false};
  const adaKontakLb = x => strs(x.telepon).length || strs(x.wa).length || strs(x.email).length;
  const kabInti = k => nrm(String(k || "").replace(/^(kabupaten|kota|kab\.?)\s+/i, ""));
  const pakarKab = (prov, kab) => { let n = 0; for (const [k, c] of Object.entries(perK)) { const v = kampusInfo[k]; if (v && String(v.prov) === String(prov) && v.kota && kabInti(v.kota) === kabInti(kab)) n += c; } return n; };
  let rowsCache = {k: ""};
  function barisSide() {
    const L = lbArr.filter(x => x.kategori !== "penerbit"), q = nrm(SDP.q);
    if (SDP.kab) return {lb: L.filter(x => x.prov === SDP.prov && x.kab === SDP.kab && (!q || nrm(x.nama).includes(q))).sort((a, b) => a.nama.localeCompare(b.nama, "id"))};
    const ck = SDP.prov + "|" + lbArr.length + "|" + (STRAT ? 1 : 0);
    if (rowsCache.k !== ck) rowsCache = {k: ck, rows: [...sub1(SDP.prov ? L.filter(x => x.prov === SDP.prov && x.kab) : L.filter(x => x.prov), x => SDP.prov ? x.kab : x.prov)].map(([k, a]) => { const pem = a.filter(x => x.kategori === "pemerintah").length, lsm = a.filter(x => ["lsm-yayasan", "koperasi", "asosiasi", "ormawa"].includes(x.kategori)).length, kamp = Object.values(kampusInfo).filter(v => v && (SDP.prov ? String(v.prov) === String(SDP.prov) && kunciKab(v.kab || "") === kunciKab(k) : String(v.prov) === String(k) || provNama(v.prov) === provT(k))).length;
      return ({k, nama: SDP.prov ? k : provT(k), n: a.length, pem, kamp, lsm, tot: pem + kamp + lsm, kon: a.filter(adaKontakLb).length, pk: SDP.prov ? pakarKab(SDP.prov, k) : semua.filter(o => String(provO(o)) === String(k)).length}); })};
    const rows = rowsCache.rows.slice(), u = SDP.urut, d = SDP.arah; rows.sort((a, b) => u === "nama" ? d * -a.nama.localeCompare(b.nama, "id") : d * (a[u] - b[u]) || a.nama.localeCompare(b.nama, "id"));
    return {rows: rows.filter(r => !q || nrm(r.nama).includes(q))};
  }
  /* pil kategori: maks 3 terbesar + "+n" (title berisi rincian sisanya); m = [[kategori, jumlah], ...] terurut */
  const labKat = k => (CHIP_KAT.find(c => c[0] === k) || [])[1] || (KAT[k] || [k])[0];
  const pilKatP = (m, maks = 3) => `<span class="ak-sdp-k">${m.slice(0, maks).map(([k, n]) => `<span class="ak-sdp-p"><i data-st="background:${(KAT[k] || [])[2] || "var(--ink2)"}"></i>${esc(labKat(k))} <b>${angka(n)}</b></span>`).join("")}${m.length > maks ? `<span class="ak-sdp-p ak-sdp-p-n" title="${esc(m.slice(maks).map(([k, n]) => labKat(k) + " " + angka(n)).join(", "))}">+${angka(m.length - maks)}</span>` : ""}</span>`;
  /* deret ikon kategori kecil + angka, tanpa bingkai; maks 4 terbesar lalu "+n" (title berisi sisanya) */
  const ikKatP = (m, maks = 4) => `<span class="ak-sdp-k">${m.slice(0, maks).map(([k, n]) => { const kk = KAT[k] || []; return `<span class="ak-sdp-i" title="${esc(labKat(k))}">${ikon(kk[1] || KAT.riset[1], kk[2] || "var(--ink2)")}<b>${angka(n)}</b></span>`; }).join("")}${m.length > maks ? `<span class="ak-sdp-s" title="${esc(m.slice(maks).map(([k, n]) => labKat(k) + " " + angka(n)).join(", "))}">+${angka(m.length - maks)}</span>` : ""}</span>`;
  function isiSide() {
    const L = lbArr.filter(x => x.kategori !== "penerbit"), b = barisSide();
    const rt = [`<button type="button" data-sd-naik="id">Indonesia</button>`]; if (SDP.prov) rt.push(`<button type="button" data-sd-naik="prov">${esc(provT(SDP.prov))}</button>`); if (SDP.kab) rt.push(`<span>${esc(SDP.kab)}</span>`);
    { const bk = $("akSideBack"); bk.hidden = !SDP.prov; bk.dataset.sdNaik = SDP.kab ? "prov" : "id"; }
    const tot = SDP.kab ? b.lb.length : SDP.prov ? L.filter(x => x.prov === SDP.prov).length : L.length;
    $("akSideJ").textContent = SDP.kab || (SDP.prov ? provT(SDP.prov) : "Indonesia"); $("akSideN").textContent = `${angka(tot)} lembaga`;
    if (b.lb) { const grup = new Map(); b.lb.forEach(x => { const g = grup.get(x.kategori) || []; g.push(x); grup.set(x.kategori, g); });
      $("akSideT").innerHTML = `<div class="ak-sdl-lb">${[...grup].sort((a, c) => c[1].length - a[1].length).map(([kat, a]) => { const k = KAT[kat] || [kat || "Lainnya", KAT.riset[1], "var(--ink2)"];
        return `<h4 class="ak-sdl-h">${ikon(k[1], k[2])}<span>${esc(kapital(k[0]))}</span><em>${angka(a.length)}</em></h4>` + a.map(x => `<button type="button" data-sd-lb="${esc(x.id)}">${logoLb(x).replace('class="ak-lgo"', 'class="ak-lgo kecil"')}<span><b>${esc(judulCase(x.nama))}</b>${x.kab || x.kota ? `<small>${ikon(IKON_PIN, "currentColor")}${esc(x.kab || x.kota)}</small>` : ""}</span></button>`).join(""); }).join("") || '<p class="ak-khampa">Tidak ada lembaga.</p>'}</div>`; return; }
    const hit = new Map(); L.forEach(x => { const k = SDP.prov ? (x.prov === SDP.prov ? x.kab : null) : x.prov; if (!k) return; const m = hit.get(k) || hit.set(k, {}).get(k); m[x.kategori] = (m[x.kategori] || 0) + 1; });
    const KOL = [["swasta", "Swasta"], ["kementerian-lembaga", "Kementerian dan lembaga"], ["bumn", "BUMN"], ["pemda", "Pemda"], ["perguruan-tinggi", "Perguruan tinggi"]], pakai = new Set(KOL.map(c => c[0]));
    const sel = (m, k) => k === "lain" ? Object.entries(m).reduce((u, [c, n]) => u + (pakai.has(c) ? 0 : n), 0) : m[k] || 0;
    const uk = SDP.uK || "tot", ar = SDP.aK || -1, nilai = (r, k) => k === "nama" ? r.nama : k === "tot" ? r.n : sel(hit.get(r.k) || {}, k);
    const rows = b.rows.filter(r => r.n > 0).sort((p, q) => uk === "nama" ? ar * -p.nama.localeCompare(q.nama, "id") : ar * (nilai(p, uk) - nilai(q, uk)) || q.n - p.n || p.nama.localeCompare(q.nama, "id"));
    const th = (k, lab, ik, w) => `<th scope="col" data-sd-ku="${k}" aria-sort="${uk === k ? (ar > 0 ? "ascending" : "descending") : "none"}" title="${esc(lab)}"><button type="button" aria-label="Urutkan ${esc(lab)}">${ik ? ikon(ik, "currentColor") : esc(lab)}</button></th>`;
    $("akSideT").innerHTML = `<div class="ak-sdleg" aria-label="Keterangan ikon">${KOL.map(([k, l]) => `<span>${ikon((KAT[k] || [])[1] || KAT.riset[1], "currentColor")}${esc(l)}</span>`).join("")}<span>${ikon('<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>', "currentColor")}Lainnya</span></div><table class="jm-tabel ak-sdtab"><thead><tr>${th("nama", "Provinsi")}${KOL.map(([k, l]) => th(k, l, (KAT[k] || [])[1] || KAT.riset[1])).join("")}${th("lain", "Lainnya", '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>')}${th("tot", "Total")}</tr></thead><tbody>${rows.map(r => { const m = hit.get(r.k) || {}, c = k => { const n = sel(m, k); return `<td>${n ? angka(n) : '<span class="ak-sdtab-0">-</span>'}</td>`; };
      return `<tr data-sd-baris="${esc(r.k)}" tabindex="0"><th scope="row"><span class="ak-sdtab-n">${lambangHtml(lambangUrl(SDP.prov ? "" : r.k, SDP.prov), 24)}<b>${esc(SDP.prov && !/^(kota|kab\.?|kabupaten) /i.test(r.nama) ? "Kab. " + r.nama : r.nama)}</b></span></th>${KOL.map(([k]) => c(k)).join("")}${c("lain")}<td class="ak-sdtab-t">${angka(r.n)}</td></tr>`; }).join("") || '<tr><td colspan="8"><p class="ak-khampa">Tidak ada wilayah.</p></td></tr>'}</tbody></table>`;
  }
  async function terbangKab(kab) { const m = PT.map, a = lbArr.filter(x => x.prov === SDP.prov && x.kab === kab && Number.isFinite(x.lat)); if (!a.length) return; const lo = a.map(x => x.lon), la = a.map(x => x.lat); m.fitBounds([[Math.min(...lo) - .01, Math.min(...la) - .01], [Math.max(...lo) + .01, Math.max(...la) + .01]], {padding: 80, maxZoom: 11}); }
  /* lebar sidebar dan drawer bisa digeser (min 300px, maks 60% layar), tersimpan di localStorage */
  const LEBAR_KEY = {side: "ak-lebar-side", drawer: "ak-lebar-drawer"};
  const bacaLebar = k => { try { return +localStorage.getItem(LEBAR_KEY[k]) || 0; } catch (e) { return 0; } };
  function aturLebar() { const sw = bacaLebar("side"), dw = bacaLebar("drawer"); if (sw) $("akPita").style.width = sw + "px"; if (dw) $("akDrawer").style.width = Math.max(360, Math.min(innerWidth * .7, dw)) + "px"; }
  document.addEventListener("pointerdown", e => { const g = e.target.closest?.("[data-grip]"); if (!g) return; e.preventDefault(); const k = g.dataset.grip, el = k === "side" ? $("akPita") : $("akDrawer"), mulaiX = e.clientX, w0 = el.getBoundingClientRect().width, maks = innerWidth * (k === "drawer" ? .7 : .6), min = k === "drawer" ? 360 : 300;
    g.setPointerCapture?.(e.pointerId); const gerak = ev => { const dx = ev.clientX - mulaiX, w = Math.max(min, Math.min(maks, k === "side" ? w0 + dx : w0 - dx)); el.style.width = w + "px"; };
    const lepas = () => { removeEventListener("pointermove", gerak); removeEventListener("pointerup", lepas); try { localStorage.setItem(LEBAR_KEY[k], String(Math.round(el.getBoundingClientRect().width))); } catch (er) {} PT.map?.resize(); };
    addEventListener("pointermove", gerak); addEventListener("pointerup", lepas); });
  function pitaPeta() {
    if (!$("akSideT")) { $("akPita").className = "ak-side"; $("akPita").innerHTML = `<div class="ak-side-label" id="akSideLabel"><button type="button" class="ak-sl-back" id="akSideBack" data-sd-naik="id" hidden title="${esc(t("dir.peta.naik"))}" aria-label="${esc(t("dir.peta.naik"))}">${ikon('<path d="m15 6-6 6 6 6"/>', "currentColor")}</button><b id="akSideJ"></b><span id="akSideN"></span><button type="button" class="ak-sl-lipat" id="akSideLipat" aria-expanded="true" aria-label="${esc(t("dir.peta.lipat"))}" title="${esc(t("dir.peta.lipat"))}">${ikon('<path d="m6 9 6 6 6-6"/>', "currentColor")}</button></div><div class="ak-side-h">
      <div class="ak-sr-w"><label class="ak-cari"><span class="sr">${esc(t("dir.peta.cari"))}</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="akSideQ" type="search" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="akSaran" aria-autocomplete="list" placeholder="${esc(t("dir.peta.cari"))}"></label><div class="ak-saran" id="akSaran" role="listbox" hidden></div></div><div class="ak-ukd" id="akSideUk" hidden><button type="button" class="ak-ukb" aria-haspopup="listbox" aria-expanded="false"><span></span><svg class="ak-panah" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><div class="ak-ukm" role="listbox" hidden></div></div></div><div class="ak-side-t" id="akSideT"></div><div class="ak-sideleg" id="akSideLeg" hidden></div>`;
      $("akPita").insertAdjacentHTML("afterend", '<button type="button" class="ak-side-buka" id="akSideBuka" hidden>Panel</button>');
    }
    if (!$("akGripSide")) { $("akPita").insertAdjacentHTML("beforeend", '<div class="ak-grip" id="akGripSide" data-grip="side" role="separator" aria-orientation="vertical" aria-label="Geser lebar panel"></div>'); $("akDrawer").insertAdjacentHTML("afterbegin", '<div class="ak-grip ak-grip-kiri" data-grip="drawer" role="separator" aria-orientation="vertical" aria-label="Geser lebar profil"></div>'); aturLebar();
      if (innerWidth > 700) import("/inti/panel_geser.js").then(({geserPanel}) => {   /* panel melayang di atas peta wajib bisa digeser (aturan pemilik) */
        $("akDrawer").insertAdjacentHTML("afterbegin", '<div class="ak-dr-g" role="group" aria-label="Geser panel"></div>');
        geserPanel($("akPita"), {kunci: "samping", batas: $("akPita").parentElement}); geserPanel($("akDrawer"), {kunci: "profil", batas: $("akDrawer").parentElement});
        const pp = $("akPtPanel"); if (pp) geserPanel(pp, {kunci: "kabkota", batas: pp.parentElement});
        const kt = $("akPtKontrol"); if (kt) geserPanel(kt, {kunci: "kontrol", batas: kt.parentElement});
      }).catch(() => {}); }
    { const ly = $("akPtLayer"), h = document.querySelector("#akPita .ak-side-h"); if (ly && h && ly.parentElement !== h) h.appendChild(ly); if (ly) for (const [k, t] of [["strat", "Strategis"], ["sensor", "Sensor"], ["lembaga", "Mitra"]]) { const b = ly.querySelector(`[data-ly="${k}"]`); const tn = b && [...b.childNodes].find(n => n.nodeType === 3 && n.textContent.trim()); if (tn) tn.textContent = t; } }
    isiSide();
  }
  async function geoProvinsi() { if (!PT.geoProv) PT.geoProv = await ambilJson("/geo/provinsi.json"); if (!PT.cent && PT.geoProv?.features) { PT.cent = {}; for (const f of PT.geoProv.features) { const b = bbox(f); PT.cent[String(f.properties.kode)] = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; } } return PT.geoProv; }
  const padAwal = () => innerWidth > 700 ? {top: 104, bottom: 24, left: 492, right: 60} : {top: 110, bottom: Math.round(innerHeight * .46) + 8, left: 10, right: 10};   /* seluruh Indonesia pas di area kanan panel */
  async function terbangKe(k) {
    const m = PT.map; if (k === "id") { m.fitBounds([[94, -11.5], [141.5, 6.5]], {padding: padAwal()}); return; }
    const g = await geoProvinsi(), f = g?.features.find(f => String(f.properties.kode) === k); if (f) { const b = bbox(f); m.fitBounds([[b[0], b[1]], [b[2], b[3]]], {padding: 60, maxZoom: 9}); }
  }

  /* ---- choropleth (provinsi atau kab/kota) ---- */
  async function muatKab(kode) { if (!PT.kabCache[kode]) PT.kabCache[kode] = ambilJson(`/geo/kabupaten/${kode}.json`).then(g => g ? g.features.map(f => (f.properties.kode = kode, f)) : []); return PT.kabCache[kode]; }
  function kuantil(v, n = 5) { const s = v.filter(x => x > 0).sort((a, b) => a - b); if (!s.length) return []; return Array.from({length: n - 1}, (_, i) => s[Math.min(s.length - 1, Math.floor(s.length * (i + 1) / n))]); }
  const UKURAN = [["jumlah", "Jumlah lembaga", IK_GEDUNG], ["kontak", "Berkontak", IK_TEL], ["perjuta", "Per juta penduduk", IK_ORANG], ["gap", "Kesenjangan risiko", '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/>']];
  function segarUk() { const k = $("akSideUk"); if (!k) return; const dis = v => $("akPtUkuran")?.querySelector(`[data-v="${v}"]`)?.disabled, u = UKURAN.find(x => x[0] === PT.ukuran) || UKURAN[0];
    k.querySelector(".ak-ukb > span").innerHTML = `${ikon(u[2], "currentColor")}<b>${esc(u[1])}</b>`;
    k.querySelector(".ak-ukm").innerHTML = UKURAN.map(([v, l, d]) => `<button type="button" role="option" data-uk="${v}" aria-selected="${v === PT.ukuran}"${dis(v) ? " disabled" : ""}>${ikon(d, "currentColor")}${l}</button>`).join(""); }
  document.addEventListener("click", e => { const k = $("akSideUk"); if (!k) return; const b = e.target.closest(".ak-ukb"), o = e.target.closest("[data-uk]"), m = k.querySelector(".ak-ukm");
    if (o && k.contains(o)) { $("akPtUkuran").querySelector(`[data-v="${o.dataset.uk}"]`)?.click(); m.hidden = true; k.querySelector(".ak-ukb").setAttribute("aria-expanded", "false"); setTimeout(segarUk, 0); return; }
    if (b && k.contains(b)) { m.hidden = !m.hidden; b.setAttribute("aria-expanded", String(!m.hidden)); return; }
    m.hidden = true; });
  async function petaCho() {
    const m = PT.map, prov = PT.tingkat === "prov", kodes = PT.pulau ? PULAU[PT.pulau] : Object.keys(PROV), tok = ++PT.chot;
    let fs = prov ? ((await geoProvinsi())?.features || []).filter(f => kodes.includes(String(f.properties.kode))) : (await Promise.all(kodes.map(muatKab))).flat();
    if (tok !== PT.chot) return;
    const L = lbArr.filter(x => x.kategori !== "penerbit" && x.prov), grup = sub1(L, x => prov ? x.prov : (x.kab ? x.prov + "|" + kunciKab(x.kab) : null));
    /* indeks risiko asal dibuang: kesenjangan dan per-juta-penduduk menunggu data METI (F2) */
    const sp = null; if (tok !== PT.chot) return;
    const reg = fs.map(f => { const kode = String(f.properties.kode), key = prov ? kode : kode + "|" + kunciKab(f.properties.kab), a = grup.get(key) || [], e = sp?.get(kode);
      return {f, key, nama: prov ? provT(kode) : f.properties.kab, kode, a, n: a.length, kontak: a.filter(adaKontak).length, pj: e ? a.length / (e.pend / 1e6) : null, risiko: e?.risiko ?? null, top: a.slice().sort((p, q) => bobot(q) - bobot(p))[0]}; });
    if (sp) { const pr = r => { const v = reg.map(x => x.risiko).filter(x => x != null).sort((a, b) => a - b); return v.length ? v.filter(x => x <= r).length / v.length : 0; }, pj = reg.map(x => x.pj).filter(x => x != null).sort((a, b) => a - b);
      reg.forEach(x => { x.gap = x.risiko == null || x.pj == null ? null : pr(x.risiko) - pj.filter(v => v <= x.pj).length / pj.length; }); }
    const uk = PT.ukuran, nilai = x => uk === "jumlah" ? x.n : uk === "kontak" ? x.kontak : uk === "perjuta" ? x.pj : x.gap, merah = uk === "gap", pal = merah ? MERAH : BIRU;
    const vals = reg.map(nilai).filter(v => v != null), br = merah ? kuantil(vals.map(v => v + 1)).map(v => v - 1) : kuantil(vals), kelas = v => v == null || (!merah && v <= 0) ? -1 : br.filter(b => v >= b).length;
    reg.forEach(x => { x.v = nilai(x); x.k = kelas(x.v); x.warna = x.k < 0 ? "var(--soft-hijau)" : pal[Math.min(4, x.k)]; });
    PT.reg = reg;
    const feats = reg.map(x => ({type: "Feature", properties: {i: reg.indexOf(x), warna: rv(x.warna)}, geometry: x.f.geometry}));
    m.getSource("cho").setData({type: "FeatureCollection", features: feats});
    const fmt = v => v == null ? "tidak tersedia" : uk === "perjuta" ? fmt1($1) : uk === "gap" ? (v > 0 ? "+" : "") + fmt1($1) : angka(v), sat = {jumlah: "lembaga", kontak: "lembaga berkontak", perjuta: "lembaga per juta penduduk", gap: "selisih persentil risiko dan mitra"}[uk];
    PT.fmt = fmt; PT.sat = sat;
    const punya = reg.filter(x => x.n > 0).length, rank = reg.filter(x => x.v != null).sort((a, b) => b.v - a.v).slice(0, 15), ed = [-Infinity, ...br];
    { const pta = $("akPtIsi")?.closest(".ak-pta"); let lb = pta?.querySelector("#akLegBawah"); if (pta && !lb) { pta.insertAdjacentHTML("beforeend", '<div class="ak-legbawah" id="akLegBawah" aria-label="Legenda peta"></div>'); lb = pta.querySelector("#akLegBawah"); }
      if (lb) lb.innerHTML = `<b>${esc(kapital(sat))} per ${prov ? "provinsi" : "kab/kota"}</b><span><i data-st="background:var(--soft-hijau)"></i>${merah ? "Data tidak tersedia" : "Tidak ada"}</span>${pal.map((c, i) => `<span><i data-st="background:${c}"></i>${i === 0 ? "Terendah" : i === 4 ? "Tertinggi" : br[i - 1] != null ? "dari " + esc(fmt(br[i - 1])) : ""}</span>`).join("")}`; }
    $("akPtIsi").innerHTML = `<p class="ak-rata">Jumlah ${prov ? "provinsi" : "kab/kota"} yang punya lembaga mitra, menurut ukuran yang dipilih.</p>
      <p class="ak-ptcakup"><b>${angka(punya)}</b> dari ${angka(reg.length)} ${prov ? "provinsi" : "kab/kota"} punya minimal satu lembaga mitra</p>
      <div class="ak-legenda2"><span><i data-st="background:var(--soft-hijau)"></i>${merah ? "Data tidak tersedia" : "Tidak ada"}</span>${pal.map((c, i) => `<span><i data-st="background:${c}"></i>${i === 0 ? "Terendah" : i === 4 ? "Tertinggi" : ""}${br[i - 1] != null && i && i < 4 ? "dari " + esc(fmt(br[i - 1])) : ""}</span>`).join("")}</div>
      <ol class="ak-rank">${rank.map(x => `<li><button type="button" data-rg="${reg.indexOf(x)}">${x.top ? logoLb(x.top) : '<span class="ak-klogo kosong" aria-hidden="true">-</span>'}<span><b>${esc(x.nama)}</b><small>${esc(x.top ? x.top.singkatan || x.top.nama : "Belum ada lembaga")}</small></span><em>${esc(fmt(x.v))}</em></button></li>`).join("")}</ol>
      <small class="ak-lper">Satuan: ${esc(sat)}. Sumber: direktori lembaga mitra${sp ? `; penduduk dan indeks risiko dari risiko kecamatan (data ${esc(tglID(rk.hari))})` : ""}; batas wilayah BIG.</small>`;
    $("akPtUkuran").querySelectorAll("button").forEach(b => { b.disabled = !prov && (b.dataset.v === "perjuta" || b.dataset.v === "gap"); });
    segarUk(); $("akSideLeg").hidden = true; const _legLama = `<div class="ak-slbar">${[["var(--soft-hijau)", "Tidak ada"], ...pal.map((c, i) => [c, i === 0 ? "Rendah" : i === 4 ? "Tinggi" : ""])].map(([c, t]) => `<span><i data-st="background:${c}"></i>${t}</span>`).join("")}</div><small>${esc(sat)}</small>`;
    PT.itemsCho = reg.filter(x => x.top && Number.isFinite(x.top.lat)).map(x => ({key: "c:" + x.key, lat: (bbox(x.f)[1] + bbox(x.f)[3]) / 2, lon: (bbox(x.f)[0] + bbox(x.f)[2]) / 2, nama: x.top.singkatan || x.top.nama, tip: x.top.nama, logo: urlOk(x.top.logo), warna: (KAT[x.top.kategori] || [])[2] || "var(--ink2)", w: x.n, label: false, buka: () => bukaDrawer(x.top)}));
    for (const mk of PT.pins.values()) mk.remove(); PT.pins.clear(); gambarPin();
    if (PT.pulau || !prov) { const bs = fs.map(bbox); if (bs.length) m.fitBounds([[Math.min(...bs.map(b => b[0])), Math.min(...bs.map(b => b[1]))], [Math.max(...bs.map(b => b[2])), Math.max(...bs.map(b => b[3]))]], {padding: 40}); }
  }
  function modePeta(cho) {
    PT.mode = cho ? "cho" : "pin"; const m = PT.map; $("akPtPanel").hidden = !cho; if ($("akSideUk")) { $("akSideUk").hidden = !cho; $("akSideLeg").hidden = !cho; } $("akSideMode") && setSeg("akSideMode", cho ? "cho" : "pin");
    for (const id of ["cho-fill", "cho-line"]) m.setLayoutProperty(id, "visibility", cho ? "visible" : "none");
    if (cho) { if (PT.tingkat === "kab" && !PT.pulau) { PT.pulau = "Jawa-Bali"; setSeg("akPtPulau", PT.pulau); } nanti(petaCho); } else segarPeta();
  }
  /* ---- pencarian di peta: lembaga, kampus, sensor, wilayah; indeks dibuat sekali per perubahan data ---- */
  let SR = {k: "", idx: [], aktif: -1, hasil: [], sorot: null, pop: null};
  const SR_GRUP = [["lb", "Lembaga"], ["k", "Kampus"], ["sn", "Sensor"], ["w", "Wilayah"]], SR_KUOTA = {lb: 3, k: 2, sn: 1, w: 2};
  function indeksSaran() {
    const k = lbArr.length + "|" + Object.keys(kampusInfo).length + "|" + PT.sensorArr.length; if (SR.k === k) return SR.idx; SR.k = k; const a = [];
    for (const x of lbArr) if (x.kategori !== "penerbit" && x.nama) { const kat = KAT[x.kategori]?.[0] || x.kategori || "", pv = provT(x.prov); a.push({t: "lb", x, nama: x.nama, sing: x.singkatan || "", meta: [kapital(kat), x.kab].filter(Boolean).join(", "), lat: x.lat, lon: x.lon, h: nrm([x.nama, x.singkatan, x.kab, pv].join(" "))}); }
    for (const [n, v] of Object.entries(kampusInfo)) a.push({t: "k", k: n, nama: n, sing: "", meta: ["Kampus", v?.kota].filter(Boolean).join(", "), lat: v?.lat, lon: v?.lon, h: nrm([n, v?.kota, provT(v?.prov)].join(" "))});
    for (const s of PT.sensorArr) a.push({t: "sn", s, nama: s.nama || "Sensor", sing: "", meta: ["Sensor", s.jaringan || s.jenis].filter(Boolean).join(", "), lat: s.lat, lon: s.lon, h: nrm([s.nama, s.jaringan, s.jenis].join(" "))});
    for (const [kd, n] of Object.entries(PROV)) a.push({t: "w", kode: kd, nama: n, sing: "", meta: "Provinsi", h: nrm(n)});
    const sudah = new Set(); for (const x of lbArr) if (x.prov && x.kab && !sudah.has(x.prov + "|" + x.kab)) { sudah.add(x.prov + "|" + x.kab); a.push({t: "w", kode: x.prov, kab: x.kab, nama: x.kab, sing: "", meta: "Kab/kota, " + provT(x.prov), h: nrm(x.kab + " " + provT(x.prov))}); }
    a.forEach(e => { e.n = nrm(e.nama); e.sg = nrm(e.sing); }); return SR.idx = a;
  }
  function cariSaran(q) {
    const qn = nrm(q); if (qn.length < 2) return []; const tok = qn.split(" "), out = [];
    for (const e of indeksSaran()) { let sk; if (e.sg === qn || e.n.startsWith(qn)) sk = 0; else if (e.n.includes(" " + qn)) sk = 1; else if (e.n.includes(qn) || (e.sg && e.sg.includes(qn))) sk = 2; else if (tok.every(w => (" " + e.h).includes(" " + w))) sk = 3; else continue; out.push({e, sk}); }
    out.sort((a, b) => a.sk - b.sk || (b.e.lat != null) - (a.e.lat != null) || a.e.nama.length - b.e.nama.length);
    const pakai = [], sisa = [], n = {}; for (const o of out) { n[o.e.t] = (n[o.e.t] || 0) + 1; (n[o.e.t] <= SR_KUOTA[o.e.t] ? pakai : sisa).push(o); }
    const semua = pakai.concat(sisa.slice(0, Math.max(0, 8 - pakai.length))).map(o => o.e), urut = SR_GRUP.map(g => g[0]);
    return semua.sort((a, b) => urut.indexOf(a.t) - urut.indexOf(b.t));
  }
  const ikonSaran = e => e.t === "lb" ? lgoIkon(chainLogo(e.x), (KAT[e.x.kategori] || KAT.riset)[1], (KAT[e.x.kategori] || [0, 0, "var(--ink2)"])[2], true)
    : e.t === "k" ? lgoIkon([urlOk(logoK[e.k])].filter(Boolean), IK_KAMPUS, "var(--data1)", true)
    : e.t === "sn" ? (() => { const f = SN_KLS.find(x => x[0] === snKls(e.s)) || SN_KLS[1]; return `<span class="ak-sr-sn">${snSvg(f[3], f[2], 20)}</span>`; })()
    : lambangHtml(e.kab ? "" : lambangUrl(e.kode, ""), 24);
  function isiSaran() {
    const box = $("akSaran"), q = $("akSideQ").value; SR.hasil = cariSaran(q); SR.aktif = -1; const buka = qn => { box.hidden = !qn; $("akSideQ").setAttribute("aria-expanded", String(!!qn)); };
    if (nrm(q).length < 2) { box.innerHTML = ""; buka(false); return; }
    if (!SR.hasil.length) { box.innerHTML = '<p class="ak-sr-kosong">Tidak ada yang cocok.</p>'; buka(true); return; }
    let g = "", h = ""; SR.hasil.forEach((e, i) => { if (e.t !== g) { g = e.t; h += `<h4 class="ak-sr-h">${SR_GRUP.find(x => x[0] === g)[1]}</h4>`; }
      h += `<button type="button" role="option" id="akSr${i}" data-sr="${i}" aria-selected="false">${ikonSaran(e)}<span><b>${esc(e.nama)}</b><small>${esc(e.meta)}</small></span></button>`; });
    box.innerHTML = h; buka(true);
  }
  function sorotSaran(i) { SR.aktif = i; const box = $("akSaran"); box.querySelectorAll("[data-sr]").forEach(b => b.setAttribute("aria-selected", String(+b.dataset.sr === i)));
    const b = i >= 0 && box.querySelector(`[data-sr="${i}"]`); $("akSideQ").setAttribute("aria-activedescendant", b ? b.id : ""); if (b) { if (b.offsetTop < box.scrollTop) box.scrollTop = b.offsetTop - 4; else if (b.offsetTop + b.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = b.offsetTop + b.offsetHeight - box.clientHeight + 4; } }
  function lepasSorot() { SR.sorot?.remove(); SR.pop?.remove(); SR.sorot = SR.pop = null; }
  function bukaProfilSaran(e) { if (e.t === "lb") bukaLb(e.x); else if (e.t === "k") profilKampus(e.k); else if (e.t === "sn") lembarSensor({id: e.s.id, nama: e.s.nama, jenis: e.s.jenis, jaringan: e.s.jaringan || "", pemilik: e.s.pemilik || "", status: e.s.status || "", ikon: "sn-" + snKls(e.s)}); }
  function pilihSaran(e) {
    const m = PT.map; $("akSaran").hidden = true; $("akSideQ").setAttribute("aria-expanded", "false"); lepasSorot();
    if (e.t === "w") { SDP.prov = e.kode; SDP.kab = e.kab || ""; if (e.kab) terbangKab(e.kab); else terbangKe(e.kode); nanti(isiSide); return; }
    if (!m || !Number.isFinite(e.lat) || !Number.isFinite(e.lon)) { bukaProfilSaran(e); return; }   // tanpa koordinat: langsung profil
    const lebar = innerWidth <= 700 ? {bottom: Math.round(innerHeight * .4)} : {left: Math.round(($("akPita")?.getBoundingClientRect().width || 320) + 24)};
    m.flyTo({center: [e.lon, e.lat], zoom: e.t === "sn" ? 12 : 14, padding: lebar, essential: true});
    const cincin = document.createElement("div"); cincin.className = "ak-sorot"; SR.sorot = new maplibregl.Marker({element: cincin}).setLngLat([e.lon, e.lat]).addTo(m);
    const el = document.createElement("div"); el.className = "ak-sr-pop"; el.innerHTML = `${ikonSaran(e)}<span><b>${esc(e.nama)}</b><small>${esc(e.meta)}</small></span><button type="button" title="Buka profil" aria-label="Buka profil ${esc(e.nama)}">${ikon('<path d="M5 12h14M13 6l6 6-6 6"/>', "currentColor")}</button>`;
    el.addEventListener("click", () => bukaProfilSaran(e));
    SR.pop = new maplibregl.Popup({closeButton: false, closeOnClick: false, offset: 16, maxWidth: "280px", className: "ak-sr-popw"}).setLngLat([e.lon, e.lat]).setDOMContent(el).addTo(m);
  }
  function pasangCariPeta() {
    const q = $("akSideQ"), box = $("akSaran"); let tq = 0;
    q.addEventListener("input", () => { clearTimeout(tq); tq = setTimeout(() => nanti(isiSaran), 120); });
    q.addEventListener("focus", () => { if (nrm(q.value).length >= 2 && box.innerHTML) { box.hidden = false; q.setAttribute("aria-expanded", "true"); } });
    q.addEventListener("keydown", ev => { const n = SR.hasil.length;
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") { if (box.hidden) isiSaran(); if (!SR.hasil.length) return; ev.preventDefault(); sorotSaran(ev.key === "ArrowDown" ? (SR.aktif + 1) % SR.hasil.length : (SR.aktif - 1 + SR.hasil.length) % SR.hasil.length); }
      else if (ev.key === "Enter") { if (box.hidden) return; ev.preventDefault(); const e = SR.hasil[SR.aktif >= 0 ? SR.aktif : 0]; if (e) pilihSaran(e); }
      else if (ev.key === "Escape") { if (!box.hidden) { box.hidden = true; q.setAttribute("aria-expanded", "false"); } else { lepasSorot(); q.value = ""; } } });
    box.addEventListener("mousedown", ev => ev.preventDefault());   // fokus tetap di kotak cari
    box.addEventListener("click", ev => { const b = ev.target.closest("[data-sr]"); if (b) pilihSaran(SR.hasil[+b.dataset.sr]); });
    document.addEventListener("click", ev => { if (!ev.target.closest(".ak-sr-w")) { box.hidden = true; q.setAttribute("aria-expanded", "false"); } });
    PT.map.on("dragstart", lepasSorot);
  }
  /* pemilih lapisan peta: kisi chip multi-pilih (Semua + tiap kategori organisasi + Proyek), titik warna kategori dan hitungan */
  const CHIP_KAT = [["bumn", "BUMN"], ["swasta", "Swasta/IPP"], ["internasional", "Internasional"], ["asosiasi", "Asosiasi"], ["kementerian-lembaga", "Kementerian/Lembaga"], ["pemda", "Pemda"], ["bumd", "BUMD"], ["perguruan-tinggi", "Perguruan tinggi"], ["think-tank", "Think tank"], ["lsm-yayasan", "LSM/Yayasan"], ["koperasi", "Koperasi"], ["ormawa", "Organisasi mahasiswa"], ["donor", "Donor"], ["keuangan", "Keuangan"]];
  function chipKategori(el) {
    const ada = x => Number.isFinite(x.lat) && Number.isFinite(x.lon), nk = Object.values(kampusInfo).filter(v => Number.isFinite(v?.lat)).length;
    const hit = k => lbArr.filter(x => x.kategori === k).length + (k === "perguruan-tinggi" ? nk : 0);   /* total per kategori, bukan hanya yang berkoordinat */
    const IK_PROY = '<path d="M3 21V9l6 4V9l6 4V5h6v16z"/>', IK_LAIN = '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>', IK_LAPIS = '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>';
    const chip = (k, l, n, w, ic) => `<button type="button" data-kk="${k}" aria-pressed="false">${ikon(ic || (KAT[k] || [])[1] || IK_TITIK, w)}<span>${esc(l)}</span><small>${angka(n)}</small></button>`;   /* ikon di tiap chip dan pilihan (aturan pemilik) */
    const kontrol = document.createElement("div"); kontrol.className = "ak-kontrol"; kontrol.id = "akPtKontrol"; kontrol.setAttribute("role", "group"); kontrol.setAttribute("aria-label", t("dir.peta.lapisan"));
    kontrol.innerHTML = `<div class="ak-kontrol-h">${ikon(IK_LAPIS, "currentColor")}<b>${esc(t("dir.peta.lapisan"))}</b></div><div class="ak-kontrol-i"></div>`;   /* kepala = pegangan geser (panel_geser.js) */
    const box = document.createElement("div"); box.className = "ak-kchips"; box.id = "akPtKChip"; box.setAttribute("role", "group"); box.setAttribute("aria-label", t("dir.peta.lapisan"));
    const kats = [...CHIP_KAT, ...Object.keys(hitungLb(x => x.kategori)).filter(k => k !== "penerbit" && !CHIP_KAT.some(c => c[0] === k)).map(k => [k, (KAT[k] || [k])[0]])].filter(([k]) => hit(k)).sort((a, c) => hit(c[0]) - hit(a[0])), tops = kats.slice(0, 5), sisa = kats.slice(5);
    box.innerHTML = chip("", t("dir.peta.semua"), lbArr.filter(x => x.kategori !== "penerbit").length + nk, "currentColor", IK_SEMUA) + tops.map(([k, l]) => chip(k, ({"swasta": "Swasta", "kementerian-lembaga": "K/L", "ormawa": "Ormawa", "perguruan-tinggi": "Kampus"})[k] || l, hit(k), (KAT[k] || [])[2] || "var(--ink2)")).join("")
      + (sisa.length ? `<button type="button" data-kl="1" aria-expanded="false" aria-haspopup="true">${ikon(IK_LAIN, "currentColor")}<span>${esc(t("dir.peta.lainnya"))}</span><small>${angka(sisa.length)}</small><svg class="ak-panah" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>` : "");   /* proyek punya halaman sendiri (/proyek); tidak dilapis di peta organisasi (pemilik 8 Nov 2026) */
    const menu = document.createElement("div"); menu.className = "ak-kmenu"; menu.id = "akPtKMenu"; menu.hidden = true; menu.setAttribute("role", "group"); menu.setAttribute("aria-label", t("dir.peta.lainnya"));
    menu.innerHTML = sisa.map(([k, l]) => chip(k, l, hit(k), (KAT[k] || [])[2] || "var(--ink2)")).join("");
    kontrol.querySelector(".ak-kontrol-i").append(box, menu); (el.querySelector(".ak-ptaisi") || el).append(kontrol);
    const segar = () => { const pk = b => { const k = b.dataset.kk; b.setAttribute("aria-pressed", String(k === "" ? !PT.kat.size && !PT.lapis.proyek : k === "proyek" ? PT.lapis.proyek : PT.kat.has(k))); }; box.querySelectorAll("button[data-kk]").forEach(pk); menu.querySelectorAll("button").forEach(pk); const lb = box.querySelector("[data-kl]"); if (lb) lb.setAttribute("aria-pressed", String(sisa.some(([k]) => PT.kat.has(k)))); };
    ambilData("proyek").then(d => { PT.proyekArr = dlist(d).filter(x => x?.lokasi && Number.isFinite(x.lokasi.lat)); const s = box.querySelector('[data-kk="proyek"] small'); if (s) s.textContent = angka(PT.proyekArr.length); if (PT.lapis.proyek) nanti(segarPeta); });
    const tutup = () => { menu.hidden = true; box.querySelector("[data-kl]")?.setAttribute("aria-expanded", "false"); };
    const klik = e => { const l = e.target.closest("button[data-kl]"); if (l) { e.stopPropagation(); menu.hidden = !menu.hidden; l.setAttribute("aria-expanded", String(!menu.hidden)); return; } const b = e.target.closest("button[data-kk]"); if (!b) return; const k = b.dataset.kk;
      if (k === "") { PT.kat.clear(); PT.lapis.proyek = false; tutup(); } else if (k === "proyek") PT.lapis.proyek = !PT.lapis.proyek;
      else for (const z of k === "perguruan-tinggi" ? [k, "kampus"] : [k]) PT.kat.has(k) ? PT.kat.delete(z) : PT.kat.add(z);
      segar(); PT.fitKat = !!PT.kat.size; nanti(segarPeta); };
    box.addEventListener("click", klik); menu.addEventListener("click", klik); document.addEventListener("click", e => { if (!menu.hidden && !e.target.closest("#akPtKMenu")) tutup(); });
    segar();
  }
  async function bangunPeta(el) {
    el.innerHTML = `<div class="ak-pta"><div class="ak-pita" id="akPita" role="group" aria-label="Wilayah"></div>
      <div class="ak-ptaisi"><div id="akMap" class="ak-map" role="application" aria-label="Peta lembaga mitra"></div>
        <div class="ak-ptlayer" id="akPtLayer" role="group" aria-label="Lapisan peta"><button type="button" data-ly="pusat" aria-pressed="false" hidden>${ikon(IK_KAMPUS, "currentColor")}Pusat studi</button><button type="button" data-ly="strat" aria-pressed="${PT.lapis.strat}">${ikon(STAR_D, "currentColor")}Partner strategis</button><button type="button" data-ly="sensor" aria-pressed="false" hidden>${ikon(IK_BAR, "currentColor")}Sensor</button>
          <div hidden id="akPtSensW">${htmlPilih("akPtSens", IK_BAR, "Cari jenis sensor")}</div></div>
        <div class="ak-snleg" id="akSnLeg" hidden></div><aside class="ak-ptpanel" id="akPtPanel" hidden><h3>Lembaga di tiap kab/kota</h3>
          ${segHtml("akPtPulau", "Pulau", [["", "Semua pulau"], ...Object.keys(PULAU).map(k => [k, k])])}${segHtml("akPtTingkat", "Tingkat", [["prov", "Provinsi"], ["kab", "Kab/kota"]])}${segHtml("akPtUkuran", "Ukuran", [["jumlah", "Jumlah lembaga"], ["kontak", "Berkontak"], ["perjuta", "Per juta penduduk"], ["gap", "Kesenjangan risiko"]])}
          <div id="akPtIsi">${hantuHtml}</div></aside>
        <aside class="ak-drawer" id="akDrawer" role="dialog" aria-labelledby="akDrNama" hidden><button type="button" class="ak-drtutup" id="akDrTutup">${ikon('<path d="M6 6l12 12M18 6 6 18"/>', "currentColor")}Tutup</button><div id="akDrIsi"></div></aside></div></div>`;
    chipKategori(el);
    pitaPeta();
    $("akPita").addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches?.("tr[data-sd-baris]")) e.target.click(); });
    { const sr = $("akSideQ")?.closest(".ak-sr-w"); if (sr) { sr.id = "akPtCari"; $("akPtKontrol").querySelector(".ak-kontrol-i").prepend(sr); } }   /* kotak cari satu panel dengan chip kategori (tiru Posko), tetap ada walau panel dilipat */
    try { await muatMapLib(); } catch (e) { $("akMap").innerHTML = '<p class="ak-khampa">Peta tidak bisa dimuat. Periksa koneksi lalu muat ulang.</p>'; return; }
    const gelap = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    const m = PT.map = new maplibregl.Map({container: "akMap", style: "https://tiles.openfreemap.org/styles/" + (gelap ? "dark" : "positron"), bounds: [[94, -11.5], [141.5, 6.5]], fitBoundsOptions: {padding: padAwal()}, minZoom: 3, maxZoom: 16, dragRotate: false, pitchWithRotate: false,
      attributionControl: {compact: true, customAttribution: "Batas wilayah BIG"}});
    m.addControl(new maplibregl.NavigationControl({showCompass: false}), "bottom-right"); m.addControl(new maplibregl.GeolocateControl({positionOptions: {enableHighAccuracy: false}}), "bottom-right");
    PT.chot = 0; m.once("load", () => { m.resize(); sembunyikanJalan(m); redamLuar(m); if (!PT.fitStrat) m.fitBounds([[94, -11.5], [141.5, 6.5]], {padding: padAwal(), animate: false}); }); taruhSeg("peta"); new ResizeObserver(() => m.resize()).observe($("akMap"));
    pasangPilih("akPtSens", {semua: "Semua jenis sensor", nilai: () => PT.sens, opsi: () => Object.entries(sub1(PT.sensorArr, s => s.jenis)).map(([k, a]) => [k, kapital(k), a.length]).sort((a, b) => b[2] - a[2]), pilih: v => { PT.sens = v; nanti(segarPeta); }});
    $("akPtLayer").addEventListener("click", e => { const b = e.target.closest("[data-ly]"); if (!b) return; PT.lapis[b.dataset.ly] = !PT.lapis[b.dataset.ly]; if (b.dataset.ly === "strat") { try { const u = new URL(location.href); PT.lapis.strat ? u.searchParams.delete("strat") : u.searchParams.set("strat", "0"); history.replaceState(null, "", u); } catch (er) {} } b.setAttribute("aria-pressed", String(PT.lapis[b.dataset.ly]));
      $("akPtSensW").hidden = !PT.lapis.sensor; if (b.dataset.ly === "pusat" && PT.lapis.pusat && !PT.pusatArr.length) ambilData("pusat_studi").then(d => { PT.pusatArr = dlist(d).filter(x => x && x.nama && x.nama_terverifikasi === true); nanti(segarPeta); }); nanti(segarPeta); });
    const lipat = v => { SDP.lipat = v; $("akPita").classList.toggle("lipat", v); $("akSideLabel").classList.toggle("lipat", v); $("akSideLipat").setAttribute("aria-expanded", String(!v)); $("akSideBuka").hidden = true; setTimeout(() => m.resize(), 250); };
    $("akSideLabel").addEventListener("click", e => { if (e.target.closest("#akSideLipat")) lipat(!SDP.lipat); });   /* kepala = pegangan geser; hanya tombol lipat yang melipat */

    pasangCariPeta();
    $("akPita").addEventListener("click", e => {
      const u = e.target.closest("[data-sd-urut]"); if (u) { const k = u.dataset.sdUrut; SDP.arah = SDP.urut === k ? -SDP.arah : (k === "nama" ? 1 : -1); SDP.urut = k; document.querySelectorAll("#akSideT th").forEach(th => { const ik = th.querySelector("[data-sd-urut]")?.dataset.sdUrut, on = ik === k; th.setAttribute("aria-sort", on ? (SDP.arah > 0 ? "ascending" : "descending") : "none"); const i = th.querySelector("i"); if (i) i.innerHTML = on ? (SDP.arah > 0 ? "&#9650;" : "&#9660;") : ""; }); nanti(isiSide); return; }
      const n = e.target.closest("[data-sd-naik]"); if (n) { if (n.dataset.sdNaik === "id") { SDP.prov = ""; SDP.kab = ""; terbangKe("id"); } else { SDP.kab = ""; terbangKe(SDP.prov); } SDP.q = ""; $("akSideQ").value = ""; nanti(isiSide); return; }
      const ku = e.target.closest("[data-sd-ku]"); if (ku) { const k = ku.dataset.sdKu; SDP.aK = (SDP.uK || "tot") === k ? -(SDP.aK || -1) : (k === "nama" ? 1 : -1); SDP.uK = k; isiSide(); return; }
      const r = e.target.closest("[data-sd-baris]"); if (r) { const k = r.dataset.sdBaris; SDP.q = ""; $("akSideQ").value = ""; if (!SDP.prov) { SDP.prov = k; terbangKe(k); } else { SDP.kab = k; terbangKab(k); } nanti(isiSide); return; }
      const l = e.target.closest("[data-sd-lb]"); if (l) { const x = lbMap.get(l.dataset.sdLb); if (x) bukaDrawer(x); } });
    const seg = (id, k) => $(id).addEventListener("click", e => { const b = e.target.closest("button[data-v]"); if (!b || b.disabled) return; PT[k] = b.dataset.v; setSeg(id, b.dataset.v);
      if (k === "tingkat" && b.dataset.v === "kab" && !PT.pulau) { PT.pulau = "Jawa-Bali"; setSeg("akPtPulau", PT.pulau); } if (k === "tingkat" && b.dataset.v === "kab" && (PT.ukuran === "perjuta" || PT.ukuran === "gap")) { PT.ukuran = "jumlah"; setSeg("akPtUkuran", "jumlah"); } nanti(petaCho); });
    seg("akPtPulau", "pulau"); seg("akPtTingkat", "tingkat"); seg("akPtUkuran", "ukuran");
    $("akPtIsi").addEventListener("click", e => { const b = e.target.closest("[data-rg]"); const r = b && PT.reg?.[+b.dataset.rg]; if (r) { const bb = bbox(r.f); m.fitBounds([[bb[0], bb[1]], [bb[2], bb[3]]], {padding: 60, maxZoom: 10}); } });
    $("akDrTutup").addEventListener("click", tutupDrawer);
    $("akSnLeg").addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-snlipat]")) { e.preventDefault(); e.target.click(); } });
    $("akSnLeg").addEventListener("click", e => { if (e.target.closest("[data-snlipat]")) { PT.snLipat = !PT.snLipat; segarSnLeg(); return; } const b = e.target.closest("[data-sn]"); if (!b) return; const id = b.dataset.sn; PT.snOff.has(id) ? PT.snOff.delete(id) : PT.snOff.add(id); b.setAttribute("aria-pressed", String(!PT.snOff.has(id))); const t = ++snTok; nanti(() => { if (t === snTok) m.getSource("sns")?.setData(geoSens()); }); });
    const pasangLapis = () => {
      m.addSource("pts", {type: "geojson", data: geoPts([])}); m.addSource("sns", {type: "geojson", data: geoSens()}); m.addSource("cho", {type: "geojson", data: {type: "FeatureCollection", features: []}});
      m.addLayer({id: "cho-fill", type: "fill", source: "cho", layout: {visibility: "none"}, paint: {"fill-color": ["get", "warna"], "fill-opacity": 0}});   // pemilik: tanpa warna sebaran; lapisan tetap untuk tip wilayah
      m.addLayer({id: "cho-line", type: "line", source: "cho", layout: {visibility: "none"}, paint: {"line-color": rv("var(--data5)"), "line-opacity": .9, "line-width": ["interpolate", ["linear"], ["zoom"], 4, 1.3, 8, 2.2]}});   // batas wilayah selalu terlihat
      m.addLayer({id: "cho-sorot", type: "line", source: "cho", filter: ["==", ["get", "i"], -1], paint: {"line-color": rv("var(--sorot)"), "line-width": 2.6}});   // wilayah di bawah kursor
      SN_KLS.forEach(x => snIkon(m, x[0]));
      m.addLayer({id: "sns-dot", type: "symbol", source: "sns", layout: {visibility: "none", "icon-image": ["get", "ikon"], "icon-size": ["interpolate", ["linear"], ["zoom"], 3, .26, 6, .38, 9, .56, 12, .8], "icon-allow-overlap": true, "icon-ignore-placement": true}});
      m.addLayer({id: "pts-dot", type: "circle", source: "pts", paint: {"circle-color": ["get", "warna"], "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 3, 10, 6], "circle-stroke-color": rv("var(--on-brand)"), "circle-stroke-width": 1, "circle-opacity": ["get", "op"]}});
    };
    m.on("load", () => {
      pasangLapis();
      PT.siap = true; segarPeta(); nanti(() => modePeta(true)); nanti(() => modePeta(true));
      m.on("moveend", jadwalPin);
      m.on("mousemove", "pts-dot", e => { const i = PT.items.find(x => x.key === e.features[0].properties.key); m.getCanvas().style.cursor = "pointer"; tipPeta(e, i && `<b>${esc(i.sub)}</b><span>${esc(i.tip)}</span>`); });
      m.on("mouseleave", "pts-dot", () => { m.getCanvas().style.cursor = ""; $("akTip").hidden = true; });
      m.on("click", "pts-dot", e => PT.items.find(x => x.key === e.features[0].properties.key)?.buka());
      m.on("mousemove", "sns-dot", e => { m.getCanvas().style.cursor = "pointer"; tipPeta(e, tipSensor(e.features[0].properties)); });
      m.on("mouseleave", "sns-dot", () => { m.getCanvas().style.cursor = ""; $("akTip").hidden = true; });
      m.on("click", "sns-dot", e => lembarSensor(e.features[0].properties));
      m.on("mousemove", "cho-fill", e => { if (e.originalEvent?.target?.closest?.(".maplibregl-marker")) { $("akTip").hidden = true; return; }   // kursor di atas pin: tip wilayah tidak muncul
        const titik = ["sns-dot", "pts-dot"].filter(l => m.getLayer(l)); if (titik.length && m.queryRenderedFeatures(e.point, {layers: titik}).length) return;   // titik sensor/lembaga di atas wilayah: tip titik yang menang
        const i = e.features[0].properties.i, r = PT.reg?.[i]; m.setFilter("cho-sorot", ["==", ["get", "i"], i]); if (r) tipPeta(e, tipWilayah(r)); });
      m.on("mouseleave", "cho-fill", () => { $("akTip").hidden = true; m.setFilter("cho-sorot", ["==", ["get", "i"], -1]); });
      ambilData("pusat_studi").then(d => { PT.pusatArr = dlist(d).filter(x => x && x.nama && x.nama_terverifikasi === true); nanti(segarPeta); });
    });
    m.on("style.load", () => { if (!PT.siap) return; pasangLapis(); segarPeta(); nanti(() => modePeta(true)); });
    /* tema terang/gelap: gaya dasar diganti (diff:false) lalu lapisan dipasang ulang pada style.load */
    const gelapKini = () => document.documentElement.dataset.theme ? document.documentElement.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    let gelapPeta = gelapKini(); const gantiGayaPeta = () => { const g = gelapKini(); if (g === gelapPeta) return; gelapPeta = g; PT.siap && m.setStyle("https://tiles.openfreemap.org/styles/" + (g ? "dark" : "positron"), {diff: false}); };
    new MutationObserver(gantiGayaPeta).observe(document.documentElement, {attributes: true, attributeFilter: ["data-theme"]}); matchMedia("(prefers-color-scheme: dark)").addEventListener("change", gantiGayaPeta);
  }
  const muatMapLib = () => import("/inti/maplibre.js").then(m => m.muatMapLibre());

  /* ---- tab Lembaga: tiga sub-tampilan, dibangun saat dibuka ---- */
  const SUBL = {peta: ["akLbPeta", bangunPeta], daftar: ["akLbDaftar", bangunDaftarLb], proyek: ["akLbProyek", bangunProyek]}, subLBangun = {};
  function taruhSeg(v) { const seg = $("akLS"), isi = $("akLbPeta")?.querySelector(".ak-ptaisi"); if (!seg) return; $("akv-lembaga").classList.toggle("ak-lbpeta", v === "peta"); }
  function subLb(v) {
    if (v === "analisa" || v === "proyek") v = "daftar";
    lbSub = v; setSeg("akLS", v); taruhSeg(v);
    for (const [k, [id]] of Object.entries(SUBL)) $(id).hidden = k !== v;
    if (!subLBangun[v]) { subLBangun[v] = true; nanti(() => SUBL[v][1]($(SUBL[v][0]))); }
    dpSegarkan();
  }
  function bangunLembaga(p, d) {
    indeksLb(d); Object.keys(subLBangun).forEach(k => delete subLBangun[k]); pjSiap = false; Object.assign(LB, {katSet: new Set(), q: "", fs: {prov: new Set(), skala: new Set(), bidang: new Set()}, kat: "", sub: "", sensor: false, hal: 1}); lbMs(); PT.map?.remove(); Object.assign(PT, {map: null, siap: false, pins: new Map(), mode: "pin"}); tutupDrawerAman(); Object.assign(PJ, {q: "", prov: "", donor: "", sektor: "", hal: 1});
    p.innerHTML = `${segHtml("akLS", "Sub-tampilan lembaga", [["peta", "Peta", IKON_PIN], ["daftar", "Daftar", IK_GEDUNG]])}<div id="akLbPeta" class="ak-tampilan"></div><div id="akLbDaftar" class="ak-tampilan" hidden></div><div id="akLbAnalisa" class="ak-tampilan" hidden></div><div id="akLbProyek" class="ak-tampilan" hidden></div>`;
    $("akLS").addEventListener("click", e => { const b = e.target.closest("button[data-v]"); if (b) subLb(b.dataset.v); });
    subLb(lbSub);
  }

  /* ---- aset riset (L46), sub-tampilan di tab Pusat studi ---- */
  const AS = {q: "", fs: {jenis: new Set(), prov: new Set(), pemilik: new Set(), sektor: new Set()}, hal: 1}, ASPER = 24; MSG.as = {st: AS.fs, f: ["jenis", "prov", "pemilik", "sektor"], h: () => { AS.hal = 1; }, g: () => gambarAs(false), lab: (f, v) => f === "prov" ? provT(v) : f === "sektor" ? (SEKTOR[v] || [v])[0] : kapital(String(v))};
  let asArr = [], asHasil = [], asSiap = false, astok = 0;
  const kontakIkon = (it) => { const a = it.filter(Boolean); return a.length ? `<div class="ak-qrow ak-kk2">${a.join("")}</div>` : ""; };
  const ikL = (href, d, tt, teks, ext) => `<a class="ak-qk${teks ? " ak-qk-t" : ""}" href="${esc(href)}"${ext ? ` ${LUAR}` : ""} title="${esc(tt)}" aria-label="${esc(tt)}">${ikon(d, "currentColor")}${teks ? `<span>${esc(teks)}</span>` : ""}</a>`;
  const IK_ASET = () => ({drone: IKJENIS.drone, server: IKJENIS.sistem, satelit: IKJENIS.satelit, air: '<path d="M12 3s6 6.2 6 10.5a6 6 0 0 1-12 0C6 9.2 12 3 12 3z"/>', gelombang: '<path d="M2 12h4l2-6 4 12 3-9 2 3h5"/>', mikroskop: '<path d="M8 3h4v8H8zM10 11v3M6 21h12M9 17a4 4 0 0 0 8-4M7 17h4"/>', tanah: '<path d="M3 8c3-2 6 2 9 0s6-2 9 0M3 13c3-2 6 2 9 0s6-2 9 0M3 18c3-2 6 2 9 0s6-2 9 0"/>'});
  const ikAset = j => { const I = IK_ASET(); j = String(j || "").toLowerCase(); return /drone|uav/.test(j) ? I.drone : /komputer|hpc|server|data/.test(j) ? I.server : /satelit|stasiun bumi|penginderaan/.test(j) ? I.satelit : /air|limnolog|hidro/.test(j) ? I.air : /seismik|gelombang|sensor/.test(j) ? I.gelombang : /tanah|geoteknik/.test(j) ? I.tanah : I.mikroskop; };
  const unitPendek = a => [a.pemilik, String(a.unit || "").split(",")[0].trim()].filter(Boolean).join(", ");
  const kartuAs = a => { const web = urlOk(a.web), em = emailOk(a.kontak?.email) ? a.kontak.email : "", tel = typeof a.kontak?.telepon === "string" ? a.kontak.telepon.trim() : "";
    const lg = lgoIkon(logoPemilik(a.pemilik).concat(logoPemUrl(a.pemilik)), KAT.riset[1], "var(--data2)"), rp = strs(a.sektor);
    return `<article class="ak-psk ak-as" role="button" tabindex="0" data-as="${asArr.indexOf(a)}" aria-label="Buka ${esc(a.nama)}"><div class="ak-as-h">${lg}<div><h4>${esc(a.nama)}</h4><small>${esc(unitPendek(a))}</small></div></div>
      <div class="ak-pil ak-mps">${pilMini(ikAset(a.jenis), kapital(a.jenis || "aset"), "var(--data2)")}${a.kota ? pilMini(IKON_PIN, a.kota) : ""}${a.bisa_disewa === true ? '<span class="ak-izin berlaku">Bisa disewa</span>' : a.bisa_disewa === false ? '<span class="ak-izin contoh">Tidak disewakan</span>' : ""}${rp.slice(0, 2).map(r => pilSektor(r)).join("")}${rp.length > 2 ? `<span class="ak-r ak-r-n">+${rp.length - 2}</span>` : ""}${pilContoh(a)}</div>
      ${a.guna_energi ? `<p class="ak-as-guna">${esc(a.guna_energi)}</p>` : ""}
      ${kontakIkon([tel ? ikL(telHref(tel), IK_TEL, "Telepon " + telF(tel)) : "", em ? ikL("mailto:" + em, IKON_MAIL, "Email " + em) : "", web ? ikL(web, IKON_WEB, "Situs " + web, hostDari2(web), 1) : "", urlOk(a.sumber_url) ? ikL(urlOk(a.sumber_url), IK_LUAR, "Sumber", "", 1) : "", a.diperiksa ? `<span class="ak-info" title="Diperiksa ${esc(tglID(a.diperiksa))}${a.guna_ket ? ". " + esc(a.guna_ket) : ""}" aria-label="Info pemeriksaan">${ikon('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>', "currentColor")}</span>` : ""])}</article>`; };
  function sheetAs(a) {
    const web = urlOk(a.web), em = emailOk(a.kontak?.email) ? a.kontak.email : "", tel = typeof a.kontak?.telepon === "string" ? a.kontak.telepon.trim() : "", lok = [a.kota, provT(a.prov)].filter(Boolean).join(", "), lay = a.layanan ? (typeof a.layanan === "string" ? a.layanan : strs(a.layanan).join(", ")) : "";
    bukaSheet("detail", `<div class="ak-dkepala"><div class="ak-dk-atas">${lgoIkon(logoPemilik(a.pemilik).concat(logoPemUrl(a.pemilik)), KAT.riset[1], "var(--data2)")}<div class="ak-nama"><h2 id="akSJudul">${esc(a.nama)}</h2><p>${(() => { const l = lbDariNama(a.pemilik), kp = !l && kampusDariNama(a.pemilik); return l ? `<button type="button" class="ak-pk" data-lb="${esc(l.id)}">${esc(a.pemilik)}</button>` : kp ? `<button type="button" class="ak-pk" data-kp="${esc(kp)}">${esc(a.pemilik)}</button>` : esc(a.pemilik || ""); })()}${a.unit ? `, ${esc(a.unit)}` : ""}</p></div></div><div class="ak-pil ak-mps">${pilMini(ikAset(a.jenis), kapital(a.jenis || "aset"), "var(--data2)")}${lok ? pilMini(IKON_PIN, lok) : ""}${strs(a.sektor).map(r => pilSektor(r)).join("")}${web ? `<a class="ak-mp ak-mp-a" href="${esc(web)}" ${LUAR}>${ikon(IKON_WEB, "currentColor")}${esc(hostDari2(web))}</a>` : ""}${em ? `<a class="ak-mp ak-mp-a" href="mailto:${esc(em)}">${ikon(IKON_MAIL, "currentColor")}Email</a>` : ""}${tel ? `<a class="ak-mp ak-mp-a" href="${esc(telHref(tel))}">${ikon(IK_TEL, "currentColor")}${esc(telF(tel))}</a>` : ""}</div></div>`,
      () => (lay ? bagB("Layanan", `<p class="ak-rata">${esc(lay)}</p>`) : "") + (a.guna_energi ? bagB("Berguna untuk", `<p class="ak-rata">${esc(a.guna_energi)}</p>${a.guna_ket ? `<small class="ak-lper">${esc(a.guna_ket)}</small>` : ""}`) : "") + (a.diperiksa ? bagB("Pemeriksaan", lbPeriksa(a)) : ""));
    $("akSheet").dataset.k = "";
  }
  function gambarAs(gulir) {
    asHasil = asArr.filter(a => dalam(AS.fs.jenis, [a.jenis]) && dalam(AS.fs.prov, [String(a.prov)]) && dalam(AS.fs.pemilik, [a.pemilik]) && dalam(AS.fs.sektor, strs(a.sektor)) && (!AS.q || a._cari.includes(AS.q.toLowerCase())));
    const n = asHasil.length, p0 = (AS.hal - 1) * ASPER;
    $("akAsJ").innerHTML = `<b>${angka(n)}</b> aset riset${msAda("as") ? " " + msChips("as") : ""}`; msTandai("as");
    $("akAsL").innerHTML = n ? `<div class="ak-psgrid">${asHasil.slice(p0, p0 + ASPER).map(kartuAs).join("")}</div>` : `<p class="ak-khampa">Tidak ada aset yang cocok.</p>`;
    $("akAsH").innerHTML = navHal(AS.hal, n, ASPER, "aset");
    if (gulir) gulirKe("akAsJ");
  }
  function bangunAset(el) {
    if (asSiap) return; asSiap = true; el.innerHTML = hantuHtml;
    ambilData("aset_riset").then(d => nanti(() => {
      if (!Array.isArray(d) || !d.length) { asSiap = false; el.innerHTML = kosongHtml("Aset riset"); return; }
      asArr = d.filter((a, i, arr) => a && a.nama && arr.findIndex(b => b && nrm(b.nama) === nrm(a.nama) && nrm(b.kota || "") === nrm(a.kota || "")) === i).map(a => Object.assign(a, {prov: a.prov == null ? "" : String(a.prov), _cari: [a.nama, a.jenis, a.pemilik, a.unit, a.kota, typeof a.layanan === "string" ? a.layanan : strs(a.layanan).join(" ")].filter(Boolean).join(" ").toLowerCase()}));
      const hit = f => { const n = {}; asArr.forEach(a => { const k = f(a); if (k) n[k] = (n[k] || 0) + 1; }); return n; }, nJ = hit(a => a.jenis), nP = hit(a => a.prov), nM = hit(a => a.pemilik);
      el.innerHTML = `<div class="ak-saring"><div class="ak-alat">${cariKotak("akAsQ", "Cari nama alat, pemilik, atau layanan")}</div>
        <div class="ak-baris ak-baris4">${htmlPilih("akAsRp", IK_SEMUA, "Cari sektor")}${htmlPilih("akAsJn", IKL.jenis, "Cari jenis")}${htmlPilih("akAsP", IKON_PIN, "Cari provinsi")}${htmlPilih("akAsM", IK_GEDUNG, "Cari pemilik")}</div></div>
        <div class="ak-hasil"><h2 class="ak-judulv" id="akAsJ"></h2><div id="akAsL"></div><nav id="akAsH" class="ak-hal" aria-label="Halaman daftar aset" aria-live="polite"></nav></div>`;
      const jalan = () => { const t = ++astok; nanti(() => { if (t === astok) gambarAs(false); }); }, ubah = (k, v) => { AS[k] = v; AS.hal = 1; jalan(); };
      msPilih("akAsJn", "as", "jenis", {semua: "Semua jenis", opsi: () => Object.entries(nJ).sort((a, b) => b[1] - a[1]).map(([v, c]) => [v, kapital(v), c])});
      msPilih("akAsP", "as", "prov", {semua: "Semua provinsi", opsi: () => Object.entries(nP).sort((a, b) => b[1] - a[1]).map(([v, c]) => [v, provT(v), c])});
      msPilih("akAsRp", "as", "sektor", {ik: k => SEKTOR[k] ? [SEKTOR[k][1], SEKTOR[k][2]] : null, semua: "Semua sektor", opsi: () => Object.entries(hit(a => strs(a.sektor))).sort((a, b) => b[1] - a[1]).map(([v, c]) => [v, (SEKTOR[v] || [v])[0], c])});
      msPilih("akAsM", "as", "pemilik", {lg: logoPemilik, semua: "Semua pemilik", opsi: () => Object.entries(nM).sort((a, b) => b[1] - a[1]).map(([v, c]) => [v, v, c])});
      let tt = 0; $("akAsQ").addEventListener("input", e => { clearTimeout(tt); tt = setTimeout(() => ubah("q", e.target.value.trim()), 250); });
      pasangHal("akAsH", h => { AS.hal = h; gambarAs(true); });
      const bukaAs = e => { if (e.target.closest("a, button, [data-ket]")) return; const c = e.target.closest("[data-as]"); if (c && asArr[+c.dataset.as]) sheetAs(asArr[+c.dataset.as]); };
      $("akAsL").addEventListener("click", bukaAs); $("akAsL").addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.dataset?.as != null) { e.preventDefault(); bukaAs(e); } });
      gambarAs(false); }));
  }
  let psSub = "pusat";
  function subPs(v) { psSub = v; setSeg("akPS", v); $("akPsA").hidden = v !== "pusat"; $("akPsB").hidden = v !== "aset"; if (v === "aset") nanti(() => bangunAset($("akPsB"))); }

  /* ---- tombol dummy (DUMMY.md): dua ikon, Super Admin saja, isi mengikuti tab yang terbuka; data contoh hidup di klien, tanpa tulis ke server ---- */
  /* uji layar (tests/agen/direktori-layar.test.mjs) memakai data contoh yang sama dengan tombol dummy, supaya contoh dan layar tidak menyimpang */
  /* ---- tab Inovasi (L4I, PRD 6.7): ringkasan, saringan, kartu, peta penerapan ---- */
  const STATUS_IN = {"purwarupa": "var(--line-ctl)", "uji lapangan": "var(--meti-oranye)", "terpasang": "var(--ok)", "dikomersialkan": "var(--data5)", "berhenti": "var(--bad)"};
  /* kesiapan dari TKT 1-9: siap dipakai bila tercantum di e-Katalog atau TKT 8-9 */
  const SIAP_IN = {"siap dipakai": "var(--ok)", "diuji di lapangan": "var(--meti-oranye)", "laboratorium": "var(--line-ctl)", "belum dinilai": "var(--line)"};
  const siapIn = x => x.ekatalog_url || x.trl >= 8 ? "siap dipakai" : x.trl >= 5 ? "diuji di lapangan" : x.trl >= 1 ? "laboratorium" : "belum dinilai";
  const TKT_DESK = ["", "Prinsip dasar diamati", "Konsep teknologi dirumuskan", "Bukti konsep di laboratorium", "Komponen divalidasi di laboratorium", "Komponen divalidasi di lingkungan relevan", "Purwarupa diuji di lingkungan relevan", "Purwarupa diuji di lingkungan nyata", "Sistem lengkap teruji dan memenuhi syarat", "Terbukti dipakai berulang atau dijual"];
  const tktHtml = x => { if (!x.trl && !x.trl_kurang) return ""; const s = siapIn(x), w = SIAP_IN[s], bk = dlist(x.trl_bukti), pg = dlist(x.pengguna);
    return `<div class="ak-tktn"><div class="ak-tktn-k"><b>${x.trl ? "TKT " + esc(x.trl) : "Belum dinilai"}</b><em class="ak-izin" data-st="background:${w}">${esc(kapital(s))}</em>${x.trl_dasar === "perkiraan" ? '<em class="ak-izin contoh" title="Dinilai dari bukti publik dengan rubrik TKT, bukan angka resmi pembuat">Perkiraan</em>' : x.trl_dasar === "resmi" ? '<em class="ak-izin berlaku">Resmi</em>' : ""}</div>
      <ol class="ak-tktn-tg" aria-label="Tangga TKT 1 sampai 9">${TKT_DESK.slice(1).map((d, i) => `<li class="${i < (x.trl || 0) ? "isi" : ""}" data-st="--w0:${w}" title="TKT ${i + 1}: ${d}">${i + 1}</li>`).join("")}</ol>
      ${x.trl ? `<p class="ak-ket">${esc(TKT_DESK[x.trl] || "")}.</p>` : ""}
      ${bk.length ? `<ul class="ak-tktn-bk">${bk.map(b => `<li><b>TKT ${esc(b.tingkat)}</b><span>${esc(b.teks)}</span>${cip(b.url)}</li>`).join("")}</ul>` : ""}
      ${x.trl_kurang ? `<p class="ak-lper"><b>Untuk naik satu tingkat:</b> ${esc(x.trl_kurang)}</p>` : ""}
      <p class="ak-lper"><b>E-Katalog:</b> ${urlOk(x.ekatalog_url) ? tautanLuar(urlOk(x.ekatalog_url), "tercantum, buka halaman produk") : "belum ditemukan"}</p>
      ${pg.length ? `<div class="ak-pil"><small class="ak-lper">Pengguna</small>${pg.map(g => urlOk(g.url) ? tautanLuar(urlOk(g.url), esc(g.nama)) : `<span class="ak-prodi">${esc(g.nama)}</span>`).join("")}</div>` : ""}</div>`; };
  const IN = {sektor: "", jenis: "", status: "", prov: "", pembuat: "", q: "", hal: 1}, INPER = 18;
  let inArr = [], inHasil = [], intok = 0, inMap = null;
  const inProv = x => dlist(x.penerapan).map(p => p?.prov).filter(Boolean).map(String);
  const kartuIn = x => { const pb = dlist(x.pembuat), web = urlOk(x.web), sm = dlist(x.sumber).filter(s => s && urlOk(s.url));
    return `<article class="ak-psk" id="in-${esc(x.id)}"><div class="ak-psatas"><h4>${esc(x.nama)}</h4></div>
      <div class="ak-pil">${x.status ? `<span class="ak-izin" data-st="background:${STATUS_IN[x.status] || "var(--ink2)"}">${esc(kapital(x.status))}</span>` : ""}${x.jenis ? `<span class="ak-prodi">${esc(kapital(x.jenis))}</span>` : ""}${x.tahun ? `<span class="ak-prodi">${esc(x.tahun)}</span>` : ""}${strs(x.sektor).map(r => pilSektor(r)).join("")}${pilContoh(x)}</div>
      ${x.ringkasan ? `<p class="ak-rata">${esc(x.ringkasan)}</p>` : ""}
      ${pb.length ? `<div class="ak-pil"><small class="ak-lper">Pembuat</small>${pb.map(b => b.lembaga_id && lbMap.has(b.lembaga_id) ? `<button type="button" class="ak-pk" data-lb="${esc(b.lembaga_id)}">${esc(b.nama)}</button>` : `<span class="ak-prodi">${esc(b.nama)}</span>`).join("")}</div>` : ""}
      ${dlist(x.penerapan).length ? `<div class="ak-pil"><small class="ak-lper">Penerapan</small>${dlist(x.penerapan).map(p => Number.isFinite(p.lat) ? `<a class="ak-pk" href="https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}" ${LUAR} title="${esc(p.keterangan || "Buka di Google Maps")}">${ikon(IKON_PIN, "currentColor")}${esc(p.lokasi || "Lokasi")}${p.tahun ? ", " + esc(p.tahun) : ""}</a>` : `<span class="ak-prodi">${esc(p.lokasi || "")}</span>`).join("")}</div>` : ""}
      ${strs(x.mitra).length ? `<p class="ak-lper">Mitra: ${esc(strs(x.mitra).join(", "))}</p>` : ""}${dlist(x.paten).length ? `<p class="ak-lper">Paten: ${dlist(x.paten).map(t => urlOk(t.sumber_url) ? tautanLuar(urlOk(t.sumber_url), esc(t.nomor)) : esc(t.nomor)).join(", ")}</p>` : ""}
      ${x.klaim ? `<p class="ak-lper"><span class="ak-izin contoh">Klaim pembuat</span> ${esc(x.klaim)}</p>` : ""}
      <div class="ak-lfoot">${web ? `<a class="ak-lnk" href="${esc(web)}" ${LUAR}>${ikon(IKON_WEB, "currentColor")}<em>Situs</em>${esc(urlHost(web))}</a>` : ""}${sm.map(s => lSum(urlOk(s.url), x.diperiksa)).join("")}<button type="button" class="ak-pk" data-brt="inovasi:${esc(x.id)}">Berita terkait</button>${lbPeriksa(x)}</div></article>`; };
  /* lembar inovasi: kepala navy (foto/ikon, pil, angka kunci), kartu Tentang, Fakta, Dokumentasi, Dipakai di, Berita, Sumber */
  const lbDariNama = n => { const k = nrm(n); return k ? lbArr.find(y => namaLb(y).includes(k)) || null : null; };
  const pilLbKlik = (id, nama) => { const l = (id && lbMap.get(id)) || lbDariNama(nama); return l ? `<button type="button" class="ak-mp ak-mp-l ak-pk" data-lb="${esc(l.id)}">${lgoIkon(chainLogo(l), IK_GEDUNG, "var(--ink2)", 1)}${esc(potong(nama, 60))}</button>` : `<span class="ak-mp ak-mp-l">${lgoIkon(logoOrg(nama, null), IK_GEDUNG, "var(--ink2)", 1)}${esc(potong(nama, 60))}</span>`; };
  const fkIn = (l, v) => v ? `<div class="ak-in-f"><span class="ak-mlabel">${l}</span><div>${v}</div></div>` : "";
  let lbCoba = false;
  const lbDulu = (x, f) => { if (lbArr.length || lbCoba) return false; lbCoba = true; ambilData("lembaga").then(l => { if (l && !lbArr.length) indeksLb(l); f(x); }); return true; };
  const sheetIn = x => {
    if (lbDulu(x, sheetIn)) return;
    const w = (SEKTOR[strs(x.sektor)[0]] || [])[2] || "var(--data5)", foto = !x.foto_blokir && urlOk(x.foto_url), web = urlOk(x.web), pb = dlist(x.pembuat), np = dlist(x.penerapan), pt = dlist(x.paten), [pendek, panjang] = namaInovasi(x);
    const met = [["Sejak", IKL.tahun, x.tahun], ["Lokasi pakai", IKON_PIN, np.length ? angka(np.length) : ""], ["TKT", IK_BAR, x.trl], ["Paten", IKL.jenis, pt.length ? angka(pt.length) : ""]].filter(r => r[2]);
    const kepala = `<div class="ak-dkepala"><div class="ak-dk-atas"><span class="ak-infoto" data-st="--w0:${w}">${ikon(ikJenis(x.jenis), w)}${foto ? `<img src="${esc(foto)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ""}</span><div class="ak-nama"><h2 id="akSJudul">${esc(pendek)}</h2>${panjang ? `<p>${esc(panjang)}</p>` : ""}<div class="ak-pil">${pilStatus(x.status, STATUS_IN[x.status])}${pilJenis(x.jenis)}${strs(x.sektor).map(r => pilSektor(r)).join("")}${pilContoh(x)}</div></div>${met.length ? `<div class="ak-metrik ak-mt-t">${met.map(([l, d, v]) => `<div><span class="ak-mlabel">${ikon(d, "currentColor")}${l}</span><b>${esc(v)}</b></div>`).join("")}</div>` : ""}<div class="ak-pojok">${web ? `<a class="ak-ib" href="${esc(web)}" ${LUAR} title="Buka situs resmi" aria-label="Buka situs resmi">${ikon(IK_LUAR, "currentColor")}</a>` : ""}${koreksiBtn("inovasi", x.id)}</div></div><div class="ak-korw"></div></div>`;
    const fakta = [fkIn("Pembuat", pb.map(b => pilLbKlik(b.lembaga_id, b.nama)).join("")), fkIn("Mitra", strs(x.mitra).map(m => pilLbKlik(null, m)).join("")), fkIn("Jenis teknologi", x.jenis ? esc(kapital(x.jenis)) : ""), fkIn("Sektor", strs(x.sektor).map(r => pilSektor(r)).join("")), fkIn("Tahun", x.tahun ? esc(x.tahun) : ""),
      fkIn("Paten", pt.map(t => urlOk(t.sumber_url) ? tautanLuar(urlOk(t.sumber_url), esc(t.nomor)) : esc(t.nomor)).join(", ")), fkIn("SNI", x.sni ? esc(x.sni === true ? "Ada" : x.sni) : ""), fkIn("E-katalog", urlOk(x.ekatalog_url) ? tautanLuar(urlOk(x.ekatalog_url), "Buka") : ""), fkIn("Harga", x.harga ? esc(x.harga) : "")].join("");
    const dok = [web && [web, IKON_WEB, "Situs resmi"], ...pt.map(t => urlOk(t.sumber_url) && [urlOk(t.sumber_url), IKL.jenis, "Paten " + (t.nomor || "")]), urlOk(x.brosur) && [urlOk(x.brosur), IK_PDF, "Brosur"], urlOk(x.dokumen) && [urlOk(x.dokumen), IK_PDF, "Dokumen"], urlOk(x.doi) && [urlOk(x.doi), IKL.jenis, "DOI"]].filter(Boolean);
    const dokHtml = (foto ? `<a class="ak-in-gal" href="${esc(urlOk(x.foto_halaman) || foto)}" ${LUAR} title="Buka sumber foto"><img src="${esc(foto)}" alt="" loading="lazy" referrerpolicy="no-referrer">${x.foto_kredit ? `<small>Foto: ${esc(x.foto_kredit)}</small>` : ""}</a>` : "") + (dok.length ? `<div class="ak-in-ubin">${dok.map(([u, d, t]) => `<a href="${esc(u)}" ${LUAR}>${ikon(d, "currentColor")}<span><b>${esc(t)}</b><small>${esc(hostDari2(u))}</small></span>${ikon(IK_LUAR, "currentColor")}</a>`).join("")}</div>` : "");
    const pakai = np.length ? `<ul class="ak-in-pakai">${np.map(p => `<li>${Number.isFinite(p.lat) ? `<a class="ak-gmaps" href="https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}" ${LUAR} title="Buka di Google Maps" aria-label="Buka di Google Maps">${ikon(IKON_PIN, "currentColor")}</a>` : `<span class="ak-gmaps">${ikon(IKON_PIN, "currentColor")}</span>`}<div><b>${esc(p.lokasi || "Lokasi")}</b>${p.tahun ? ` <small class="ak-lper">${esc(p.tahun)}</small>` : ""}${p.keterangan ? `<p class="ak-ket">${esc(p.keterangan)}</p>` : ""}${cip(p.sumber_url)}</div></li>`).join("")}</ul>` : "";
    const srcs = [...dlist(x.sumber).map(s => s?.url), web, ...pt.map(t => t.sumber_url)];
    bukaSheet("inovasi", kepala, () => bagB("Tentang", x.ringkasan ? `<p class="ak-rata">${esc(x.ringkasan)}</p>` : "") + bagB("Fakta", fakta ? `<div class="ak-in-fg">${fakta}</div>` : "") + bagB("Kesiapan teknologi", tktHtml(x)) + bagB("Dokumentasi", dokHtml) + bagB("Dipakai di", pakai) + (x.klaim ? bagB("Klaim pembuat", `<p class="ak-rata">${esc(x.klaim)}</p>`) : "") + '<div id="akInBrt"></div>' + bagB("Sumber", sumberRapi(srcs) + lbPeriksa(x)));
    $("akSheet").dataset.k = ""; terhubungDi("I:" + x.id); const tk = tokenS; ambilData("berita").then(d => { const h = brtHtml("inovasi", x.id, d); if (h) isiNanti(() => tk === tokenS, "akInBrt", h); });
  };
  document.addEventListener("click", e => { if (e.target.closest("[data-inclear]")) { IN.sektor = ""; IN.hal = 1; nanti(() => gambarIn(false)); } });
  /* L10: saringan multi-pilih untuk batang ringkasan, dropdown, dan pil aktif; satu himpunan per bidang, tanpa gulir otomatis.
     MSG[tab] = {st: objek berisi Set per bidang, f: bidang, h: reset halaman, g: gambar ulang, lab: (bidang, nilai) => teks} */
  function msTandai(tab) { const m = MSG[tab]; if (!m) return; document.querySelectorAll(`[data-bar^="${tab}|"]`).forEach(el => { const [, f, ...v] = el.dataset.bar.split("|"); if (!m.f.includes(f)) return; const on = m.st[f].has(v.join("|")); el.setAttribute("aria-pressed", String(on)); el.classList.toggle("ak-bsel", on); el.classList.toggle("ak-bredup", !on && m.st[f].size > 0); }); m.lbl?.forEach(l => l()); }
  function msUbah(tab, f, v) { const m = MSG[tab]; m.st[f] = togglePilihan(m.st[f], v); m.h(); msTandai(tab); nanti(m.g); }
  const msAda = tab => MSG[tab].f.some(f => MSG[tab].st[f].size);
  const msChips = tab => { const m = MSG[tab]; return m.f.flatMap(f => [...m.st[f]].map(v => `<button type="button" class="ak-mp ak-mp-x" data-msx="${esc(tab + "|" + f + "|" + v)}" title="Hapus saringan">${esc(m.lab(f, v))} &times;</button>`)).join("") + (msAda(tab) ? `<button type="button" class="ak-mp ak-mp-b ak-mp-sem" data-msx="${tab}|*">Hapus semua</button>` : ""); };
  /* dropdown multi: pil "Semua" mengosongkan, tiap butir menyalakan/mematikan */
  const msPilih = (id, tab, f, o) => { const l = pasangPilih(id, Object.assign({multi: true, nilai: () => MSG[tab].st[f], pilih: v => msUbah(tab, f, v)}, o)); (MSG[tab].lbl ||= []).push(l); return l; };
  document.addEventListener("click", e => { const x = e.target.closest("[data-msx]"); if (!x) return; const [tab, f, ...v] = x.dataset.msx.split("|"), m = MSG[tab]; if (!m) return;
    if (f === "*") m.f.forEach(k => m.st[k] = new Set()); else m.st[f] = togglePilihan(m.st[f], v.join("|")); m.h(); msTandai(tab); nanti(m.g); });
  const labelIn = (f, v) => f === "sektor" ? (SEKTOR[v] || [v])[0] : f === "prov" ? provT(v) : kapital(String(v));
  function gambarIn(gulir) {
    inHasil = inArr.filter(x => cocokSektor(IN.fs.sektor, strs(x.sektor)) && dalam(IN.fs.jenis, [x.jenis]) && dalam(IN.fs.status, [x.status]) && dalam(IN.fs.prov, inProv(x)) && dalam(IN.fs.pembuat, dlist(x.pembuat).map(b => b.jenis)) && dalam(IN.fs.siap, [siapIn(x)]) && (!IN.q || x._cari.includes(IN.q.toLowerCase())));
    const n = inHasil.length, a = (IN.hal - 1) * INPER;
    const pilIn = msChips("in");
    $("akInJ").innerHTML = `<b>${angka(n)}</b> inovasi energi terbarukan${pilIn ? ` ${pilIn}` : ""}`; msTandai("in");
    $("akInL").innerHTML = n ? `<div class="ak-daftar ak-prodgrid">${inHasil.slice(a, a + INPER).map(kartuInP).join("")}</div>` : hampa("inovasi");
    $("akInH").innerHTML = navHal(IN.hal, n, INPER, "inovasi");
    petaIn(); if (gulir) gulirKe("akInJ");
  }
  function petaIn() {
    if (!inMap?.siap) return; const f = inHasil.flatMap(x => dlist(x.penerapan).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lon)).map(p => ({type: "Feature", properties: {id: x.id, nama: x.nama, lokasi: p.lokasi || "", status: x.status || "", warna: STATUS_IN[x.status] || "var(--ink2)"}, geometry: {type: "Point", coordinates: [p.lon, p.lat]}})));
    inMap.m.getSource("inv").setData({type: "FeatureCollection", features: f});
  }
  async function bangunInovasi(p, d) {
    if (!lbArr.length) { const l = await ambilData("lembaga"); if (l) indeksLb(l); }
    inArr = dlist(Array.isArray(d) ? d : d?.inovasi).filter(x => x && x.id && x.nama).map(x => Object.assign(x, {_cari: [x.nama, x.ringkasan, x.jenis, ...dlist(x.pembuat).map(b => b.nama), ...strs(x.mitra)].filter(Boolean).join(" ").toLowerCase()}));
    Object.assign(IN, {fs: {sektor: new Set(), jenis: new Set(), status: new Set(), prov: new Set(), pembuat: new Set(), siap: new Set()}, sektor: "", jenis: "", status: "", prov: "", pembuat: "", q: "", hal: 1}); inMap = null; aplikasiPre("in", IN.fs); MSG["in"] = {st: IN.fs, f: ["sektor", "jenis", "status", "prov", "pembuat", "siap"], h: () => { IN.hal = 1; }, g: () => gambarIn(false), lab: labelIn};
    const hit = f => { const n = {}; inArr.forEach(x => { for (const k of [].concat(f(x))) if (k) n[k] = (n[k] || 0) + 1; }); return n; }, nR = hit(x => strs(x.sektor)), nJ = hit(x => x.jenis), nS = hit(x => x.status), nP = hit(inProv), nB = hit(x => [...new Set(dlist(x.pembuat).map(b => b.jenis))]), nK = hit(siapIn);
    const bar = (n, warna, lab, field) => batang(Object.entries(n).sort((a, b) => b[1] - a[1]), {tab: "in", field, warna, lab, tot: inArr.length, sat: "inovasi"});
    p.innerHTML = `<section class="ak-panel ak-lA"><div class="ak-pil"><span class="ak-r utama" data-st="--w0:var(--meti-oranye)">Ringkasan</span></div><h2 class="ak-judulv"><b>${angka(inArr.length)}</b> inovasi energi terbarukan, <b>${angka(nS.terpasang || 0)}</b> terpasang</h2>
        <div class="ak-komp"><div><h3 class="ak-lh">Per sektor</h3>${bar(nR, r => (SEKTOR[r] || [])[2] || "var(--ink2)", r => namaSektor(r), "sektor")}</div><div><h3 class="ak-lh">Per jenis teknologi</h3>${bar(nJ, () => "var(--data5)", kapital, "jenis")}</div></div>
        <div class="ak-komp"><div><h3 class="ak-lh">Per status</h3>${bar(nS, k => STATUS_IN[k] || "var(--ink2)", kapital, "status")}</div><div><h3 class="ak-lh">Per kesiapan teknologi (TKT)</h3>${bar(nK, k => SIAP_IN[k] || "var(--ink2)", kapital, "siap")}</div></div>
        <p class="ak-lkaki">Sumber: direktori inovasi energi terbarukan, tiap butir bertaut ke sumbernya. Klaim kinerja hanya dikutip dari pembuat. Lokasi hanya yang tertulis di sumber.</p></section>
      <div class="ak-saring"><div class="ak-alat">${cariKotak("akInQ", "Cari nama inovasi, pembuat, atau mitra")}</div>
        <div class="ak-baris ak-baris3">${htmlPilih("akInRp", IKON_PIN, "Cari sektor")}${htmlPilih("akInJn", IKL.jenis, "Cari jenis teknologi")}${htmlPilih("akInSt", IK_BAR, "Cari status")}</div>
        <div class="ak-baris">${htmlPilih("akInPv", IKON_PIN, "Cari provinsi penerapan")}${htmlPilih("akInPb", IK_GEDUNG, "Cari jenis pembuat")}</div></div>
      <div class="ak-hasil"><h2 class="ak-judulv" id="akInJ"></h2><div id="akInL"></div><nav id="akInH" class="ak-hal" aria-label="Halaman daftar inovasi" aria-live="polite"></nav></div>`;
    const jalan = () => { const t = ++intok; nanti(() => { if (t === intok) gambarIn(false); }); }, ubah = (k, v) => { IN[k] = v; IN.hal = 1; jalan(); }, op = (n, lab) => () => Object.entries(n).sort((a, b) => b[1] - a[1]).map(([v, c]) => [v, lab(v), c]);
    msPilih("akInRp", "in", "sektor", {semua: "Semua sektor", opsi: op(nR, r => (SEKTOR[r] || [r])[0])});
    msPilih("akInJn", "in", "jenis", {semua: "Semua jenis teknologi", opsi: op(nJ, kapital)});
    msPilih("akInSt", "in", "status", {semua: "Semua status", opsi: op(nS, kapital)});
    msPilih("akInPv", "in", "prov", {semua: "Semua provinsi penerapan", opsi: op(nP, provT)});
    msPilih("akInPb", "in", "pembuat", {semua: "Semua jenis pembuat", opsi: op(nB, kapital)});
    let tt = 0; $("akInQ").addEventListener("input", e => { clearTimeout(tt); tt = setTimeout(() => ubah("q", e.target.value.trim()), 250); });
    pasangHal("akInH", h => { IN.hal = h; gambarIn(true); });
    p.addEventListener("click", e => { const b = e.target.closest("[data-inpeta]"); if (!b || !inMap?.siap) return; const [la, lo] = b.dataset.inpeta.split(",").map(Number); inMap.m.flyTo({center: [lo, la], zoom: 9}); $("akInMap").scrollIntoView({block: "center"}); });
    const tip = $("akTip"); p.addEventListener("pointermove", e => { const t = e.target.closest("[data-tt]"); if (!t) { if (!e.target.closest(".maplibregl-canvas")) tip.hidden = true; return; }
      tip.innerHTML = `<b>${esc(t.dataset.tt)}</b><span><i data-st="background:${esc(t.dataset.tc)}"></i>${esc(t.dataset.tv)}</span><small>${esc(t.dataset.tk)}</small>`; tip.hidden = false; tip.style.left = Math.min(e.clientX + 12, innerWidth - tip.offsetWidth - 8) + "px"; tip.style.top = Math.max(8, e.clientY - tip.offsetHeight - 12) + "px"; });
    p.addEventListener("pointerleave", () => { tip.hidden = true; });
    gambarIn(false);
    return;   /* peta layar penuh tab Inovasi dihapus atas permintaan pemilik 30 Okt 2026; lokasi ada di lembar inovasi. Pulihkan: hapus baris ini dan kembalikan #akInMap */
    try { await muatMapLib(); } catch (e) { $("akInMap").innerHTML = '<p class="ak-khampa">Peta tidak bisa dimuat.</p>'; return; }
    const m = new maplibregl.Map({container: "akInMap", style: "https://tiles.openfreemap.org/styles/positron", bounds: [[94, -11.5], [141.5, 6.5]], fitBoundsOptions: {padding: padAwal()}, minZoom: 3, dragRotate: false, pitchWithRotate: false, attributionControl: {compact: true}});
    m.addControl(new maplibregl.NavigationControl({showCompass: false}), "bottom-right"); inMap = {m, siap: false}; m.once("load", () => m.resize()); new ResizeObserver(() => m.resize()).observe($("akInMap"));
    m.on("load", () => { m.addSource("inv", {type: "geojson", data: {type: "FeatureCollection", features: []}});
      m.addLayer({id: "inv-dot", type: "circle", source: "inv", paint: {"circle-color": ["get", "warna"], "circle-radius": 7, "circle-stroke-color": rv("var(--on-brand)"), "circle-stroke-width": 2}});
      m.on("mousemove", "inv-dot", e => { const pr = e.features[0].properties; m.getCanvas().style.cursor = "pointer"; tipPeta(e, `<b>${esc(kapital(pr.status))}</b><span>${esc(pr.nama)}</span><small>${esc(pr.lokasi)}</small>`); });
      m.on("mouseleave", "inv-dot", () => { m.getCanvas().style.cursor = ""; $("akTip").hidden = true; });
      m.on("click", "inv-dot", e => { const id = e.features[0].properties.id, x = inArr.find(y => y.id === id); if (!x) return; IN.q = ""; Object.assign(IN, {sektor: "", jenis: "", status: "", prov: "", pembuat: "", hal: 1}); Object.keys(IN.fs).forEach(k => IN.fs[k] = new Set()); IN.q = x.nama.toLowerCase(); $("akInQ").value = x.nama; nanti(() => { gambarIn(false); gulirKe("akInJ"); }); });
      inMap.siap = true; petaIn(); });
  }

  /* ---- tab Sistem data (L4D, PRD 6.8): sistem dan sumber data lembaga lain, mana yang bisa diambil ---- */
  const AKSES = {"terbuka": ["Terbuka tanpa login", "var(--ok)"], "api-terbuka": ["API terbuka", "var(--data5)"], "api-kunci": ["API berkunci gratis", "var(--data5)"], "login": ["Perlu login", "var(--meti-oranye)"], "permohonan": ["Permohonan resmi", "var(--line-ctl)"], "tertutup": ["Tertutup", "var(--bad)"]};
  const SD = {sektor: "", akses: "", pemilik: "", jenis: "", pakai: "", q: "", hal: 1}, SDPER = 18;
  let sdArr = [], sdHasil = [], sdtok = 0;
  const siapAmbil = x => (x.akses === "terbuka" || x.akses === "api-terbuka") && !x.dipakai_pantau;
  const IK_API = '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>';
  const ikBtn = (lab, ik, attr, tag) => `<${tag || "a"} class="ak-ikb" ${attr} title="${esc(lab)}" aria-label="${esc(lab)}">${ikon(ik, "currentColor")}</${tag || "a"}>`;
  /* lembar sistem data: kepala navy (logo pemilik, nama, pil, tombol ikon) lalu kartu Tentang, Fakta, Pemilik, Sumber; Terhubung menyusul */
  function sheetSd(x) {
    const [al, aw] = AKSES[x.akses] || [x.akses || "Akses belum tercatat", "var(--ink2)"], portal = urlOk(x.portal_url), api = urlOk(x.api_url), sm = sumberRapi(dlist(x.sumber).map(s => s && s.url));
    const own = (x.lembaga_id && lbMap.get(x.lembaga_id)) || (x.pemilik && lbArr.find(y => namaLb(y).includes(nrm(x.pemilik)))), h = hostDari2(portal || api || "");
    const logos = [...logoOrg(x.pemilik, own?.id || x.lembaga_id)].filter(Boolean);
    const fk = [["Jenis data", strs(x.jenis_data).map(kapital).join(", "), "jenis_data"], ["Isi/Sensor", strs(x.sensor).join(", "), "sensor"], ["Cakupan", x.cakupan, "cakupan"], ["Rentang", x.rentang, "rentang"], ["Pembaruan", x.frekuensi, "frekuensi"], ["Format", strs(x.format).join(", "), "format"], ["Lisensi", x.lisensi, "lisensi"], ["Cara akses", x.cara_minta]].filter(r => r[1]);
    const belum = fk.some(r => r[2] && !strs(x.diverifikasi).includes(r[2])), tg = x.diperiksa ? ", diperiksa " + tglID(x.diperiksa) : "";
    const kep = `<div class="ak-dkepala"><div class="ak-dk-atas">${lgoIkon(logos, IK_DB, aw).replace('class="ak-lgo"', 'class="ak-lgo ak-lgo-b"')}<div class="ak-nama"><h2 id="akSJudul">${esc(x.nama)}</h2>${x.kepanjangan ? `<p>${esc(x.kepanjangan)}</p>` : ""}</div></div>
      <div class="ak-pil"><span class="ak-izin" data-st="background:${aw}">${esc(al)}</span>${x.status ? `<span class="ak-izin ${x.status === "hidup" ? "berlaku" : "dicabut"}">${esc(kapital(x.status))}</span>` : ""}${strs(x.sektor).map(r => pilSektor(r)).join("")}${pilContoh(x)}</div>
      <div class="ak-sdik">${portal ? ikBtn("Buka portal", IK_LUAR, `href="${esc(portal)}" ${LUAR}`) : ""}${api ? ikBtn("Buka API", IK_API, `href="${esc(api)}" ${LUAR}`) : ""}${portal || api ? ikBtn("Salin URL", IK_SALIN, `data-salin="${esc(portal || api)}"`, "button").replace("<button", '<button type="button"') : ""}</div></div>`;
    const bag = (j, isi) => isi ? `<section class="ak-dbagian"><div class="ak-disi"><h3>${j}</h3>${isi}</div></section>` : "";
    const pem = x.pemilik ? (own ? `<button type="button" class="ak-pk" data-lb="${esc(own.id)}">${esc(x.pemilik)}</button>` : `<span class="ak-prodi">${esc(x.pemilik)}</span>`) : "";
    bukaSheet("detail", kep, () => bag("Tentang", x.uraian ? `<p class="ak-rata">${esc(x.uraian)}</p>` : "")
      + bag("Fakta", fk.length ? `<dl class="ak-fkg">${fk.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl><p class="ak-lper">${belum ? "Isi belum dicocokkan ke halaman sumber" : "Isi sudah dicocokkan ke halaman sumber"}${esc(tg)}</p>` : "")
      + bag("Pemilik", pem) + bag("Sumber", sm));
    $("akSheet").dataset.k = ""; terhubungDi("S:" + x.id);
  }
  function gambarSd(gulir) {
    sdHasil = sdArr.filter(x => (!SD.cakupan || (SD.cakupan === "intl") === !!x.cakupan_internasional) && dalam(SD.fs.sektor, strs(x.sektor)) && dalam(SD.fs.akses, [x.akses]) && dalam(SD.fs.pemilik, [x.pemilik]) && dalam(SD.fs.jenis, strs(x.jenis_data)) && (!SD.pakai || (SD.pakai === "sudah") === !!x.dipakai_pantau) && (!SD.q || x._cari.includes(SD.q.toLowerCase())));
    const n = sdHasil.length, a = (SD.hal - 1) * SDPER;
    $("akSdJ").innerHTML = `<b>${angka(n)}</b> sistem dan sumber data${msAda("sd") ? " " + msChips("sd") : ""}`; msTandai("sd");
    $("akSdL").innerHTML = n ? `<div class="ak-daftar ak-sdgrid">${sdHasil.slice(a, a + SDPER).map(kartuSdP).join("")}</div>` : hampa("sistem");
    $("akSdH").innerHTML = navHal(SD.hal, n, SDPER, "sistem");
    if (gulir) gulirKe("akSdJ");
  }
  async function bangunSd(p, d) {
    if (!lbArr.length) { const l = await ambilData("lembaga"); if (l) indeksLb(l); }
    sdArr = dlist(Array.isArray(d) ? d : d?.sistem).filter(x => x && x.id && x.nama).map(x => Object.assign(x, {_cari: [x.nama, x.kepanjangan, x.pemilik, x.uraian, ...strs(x.jenis_data), ...strs(x.sensor)].filter(Boolean).join(" ").toLowerCase()}));
    Object.assign(SD, {cakupan: "", fs: {sektor: new Set(), akses: new Set(), pemilik: new Set(), jenis: new Set()}, pakai: "", q: "", hal: 1}); aplikasiPre("sd", SD.fs); MSG.sd = {st: SD.fs, f: ["sektor", "akses", "pemilik", "jenis"], h: () => { SD.hal = 1; }, g: () => gambarSd(false), lab: (f, v) => f === "sektor" ? (SEKTOR[v] || [v])[0] : f === "akses" ? (AKSES[v] || [v])[0] : kapital(String(v))};
    const hit = f => { const n = {}; sdArr.forEach(x => { for (const k of [].concat(f(x))) if (k) n[k] = (n[k] || 0) + 1; }); return n; }, nA = hit(x => x.akses), nR = hit(x => strs(x.sektor)), nP = hit(x => x.pemilik), nJ = hit(x => strs(x.jenis_data)), belum = sdArr.filter(siapAmbil);
    const bar = (n, warna, lab, maks, field) => batang(Object.entries(n).sort((a, b) => b[1] - a[1]).slice(0, maks || 99), {tab: "sd", field, warna, lab, tot: sdArr.length, sat: "sistem"});
    p.innerHTML = `<section class="ak-panel ak-lA"><div class="ak-pil"><span class="ak-r utama" data-st="--w0:var(--data5)">Ringkasan</span></div>
        <div class="ak-komp"><div><h3 class="ak-lh">Per akses</h3>${bar(nA, k => (AKSES[k] || [])[1] || "var(--ink2)", k => (AKSES[k] || [k])[0], 0, "akses")}</div><div><h3 class="ak-lh">Per sektor</h3>${bar(hit(x => strs(x.sektor)), r => (SEKTOR[r] || [])[2] || "var(--ink2)", r => namaSektor(r), 0, "sektor")}</div></div>
        <div><h3 class="ak-lh">Per pemilik (sepuluh terbanyak)</h3>${bar(nP, () => "var(--data5)", k => k, 10, "pemilik")}</div>
        <div><h3 class="ak-lh">Bisa langsung diambil, belum dipakai</h3><div class="ak-pil">${belum.slice(0, 30).map(x => `<span class="ak-prodi" title="${esc(x.pemilik || "")}">${esc(x.nama)}</span>`).join("") || '<span class="ak-lper">Tidak ada.</span>'}</div></div>
        <p class="ak-lkaki">Sumber: direktori sistem data; akses diuji hanya dengan membuka halaman atau endpoint publik. Tanggal periksa tercatat di tiap kartu.</p></section>
      <div class="ak-saring">${segHtml("akSdCk", "Cakupan", [["", "Semua", IK_SEMUA], ["nas", "Nasional", IKON_PIN], ["intl", "Internasional", IK_DB]])}<div class="ak-alat">${cariKotak("akSdQ", "Cari sistem, pemilik, atau jenis data")}</div>
        <div class="ak-baris ak-baris3">${htmlPilih("akSdRp", IKON_PIN, "Cari sektor")}${htmlPilih("akSdAk", IK_BAR, "Cari akses")}${htmlPilih("akSdPm", IK_GEDUNG, "Cari pemilik")}</div>
        <div class="ak-baris">${htmlPilih("akSdJn", IKL.jenis, "Cari jenis data")}</div></div>
      <div class="ak-hasil"><h2 class="ak-judulv" id="akSdJ"></h2><div id="akSdL"></div><nav id="akSdH" class="ak-hal" aria-label="Halaman daftar sistem" aria-live="polite"></nav></div><div id="akSdKode"></div>`;
    ambilData("kode_terbuka").then(k => { const a = dlist(k?.repo).filter(r => urlOk(r.url)), el = $("akSdKode"); if (!a.length || !el) return;
      el.innerHTML = bagW("Kode terbuka energi terbarukan di GitHub", `<div class="ak-bpt jm-gulir"><table class="jm-tabel"><thead><tr><th>Repositori</th><th>Uraian</th><th>Bintang</th><th>Bahasa</th><th>Terakhir aktif</th></tr></thead><tbody>${a.slice(0, 60).map(r => `<tr><td>${tautanLuar(urlOk(r.url), esc(r.repo))}${r.jenis_pemilik === "org" ? ` <span class="ak-mp">Organisasi</span>` : ""}</td><td>${esc(potong(r.deskripsi || "", 110))}</td><td class="ak-n">${angka(r.bintang)}</td><td>${esc(r.bahasa || "")}</td><td>${r.terakhir_aktif ? esc(tglID(r.terakhir_aktif)) : ""}</td></tr>`).join("")}</tbody></table></div>`,
        `pencarian repositori GitHub (kata kunci energi terbarukan), disaring ke yang bertopik energi terbarukan, diperiksa ${tglID(k.diperiksa)}; bintang = tanda disukai pengguna GitHub, bukan ukuran mutu`, a.length); });
    const jalan = () => { const t = ++sdtok; nanti(() => { if (t === sdtok) gambarSd(false); }); }, ubah = (k, v) => { SD[k] = v; SD.hal = 1; jalan(); }, op = (n, lab) => () => Object.entries(n).sort((a, b) => b[1] - a[1]).map(([v, c]) => [v, lab(v), c]);
    msPilih("akSdRp", "sd", "sektor", {semua: "Semua sektor", opsi: op(nR, r => (SEKTOR[r] || [r])[0])});
    msPilih("akSdAk", "sd", "akses", {semua: "Semua akses", opsi: op(nA, k => (AKSES[k] || [k])[0])});
    msPilih("akSdPm", "sd", "pemilik", {lg: logoPemilik, semua: "Semua pemilik", opsi: op(nP, k => k)});
    msPilih("akSdJn", "sd", "jenis", {semua: "Semua jenis data", opsi: op(nJ, kapital)});
    $("akSdCk").addEventListener("click", e => { const b = e.target.closest("button[data-v]"); if (!b) return; setSeg("akSdCk", b.dataset.v); ubah("cakupan", b.dataset.v); }); setSeg("akSdCk", "");
    let tt = 0; $("akSdQ").addEventListener("input", e => { clearTimeout(tt); tt = setTimeout(() => ubah("q", e.target.value.trim()), 250); });
    pasangHal("akSdH", h => { SD.hal = h; gambarSd(true); });
    const tip = $("akTip"); p.addEventListener("pointermove", e => { const t = e.target.closest("[data-tt]"); if (!t) { tip.hidden = true; return; }
      tip.innerHTML = `<b>${esc(t.dataset.tt)}</b><span><i data-st="background:${esc(t.dataset.tc)}"></i>${esc(t.dataset.tv)}</span><small>${esc(t.dataset.tk)}</small>`; tip.hidden = false; tip.style.left = Math.min(e.clientX + 12, innerWidth - tip.offsetWidth - 8) + "px"; tip.style.top = Math.max(8, e.clientY - tip.offsetHeight - 12) + "px"; });
    p.addEventListener("pointerleave", () => { tip.hidden = true; });
    gambarSd(false);
  }

  /* ---- pilih sektor global (berlaku di semua tab) ---- */
  const SIL = '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>';
  const GL = {r: "", set: new Set()}, glList = () => [...GL.set], cocokGL = arr => cocokSektor(GL.set, arr), namaGL = () => [...GL.set].map(k => namaSektor(k)).join(", "), GLR = () => glList()[0] || "";   /* GL.r = teks gabungan untuk cek aktif */ let pkSub = "tokoh", TKKEL = "profesional";
  const GLB = [["", "Semua sektor"], ...SEKTOR_GRUP.flatMap(g => g[1].map(k => [k, SEKTOR[k][0]]))];
  const BIDANG_PK = [];   // bidang keahlian lintas sektor belum didefinisikan di ALG: dropdown disembunyikan
  /* bilah sektor di atas = satu-satunya saringan sektor; angkanya mengikuti tab aktif */
  let sbMemo = {k: "", c: {}, tot: null}, saringKotor = false;
  function segarSektor() {
    const v = tampilSkrg; let c = {}, tot = null, a = null;
    if (v === "pakar") a = pkSub === "tokoh" || pkSub === "diaspora" ? tkView.filter(x => !TKKEL || x.jenis === TKKEL) : semua.filter(o => st.sumber === "s" ? o[13] === "s" : !asing(o) && (st.sumber === "" || o[13] !== "x"));
    else a = {lembaga: lbArr, proyek: prArr, inovasi: inArr, sistem_data: sdArr, pustaka: bkArr.concat(puArr), berita: brArr, pendanaan: pdArr}[v];
    const kk = [v, pkSub, st.sumber, a?.length || 0].join("|");
    if (sbMemo.k === kk) { c = sbMemo.c; tot = sbMemo.tot; } else { if (a && a.length) { tot = a.length; a.forEach(x => (Array.isArray(x) ? x[3] : strs(x.sektor)).forEach(r => { c[r] = (c[r] || 0) + 1; })); } sbMemo = {k: kk, c, tot}; }
    const chip = ([k, l]) => { const ic = SEKTOR[k], n = k ? (tot == null ? null : c[k] || 0) : tot;
      return `<button type="button" data-r="${esc(k)}" aria-pressed="${k === "" ? !GL.set.size : GL.set.has(k)}"${n === 0 ? " data-nol" : ""}${` title="${esc(l)}${n != null ? ": " + angka(n) : ""}"`}>${ic ? ikon(ic[1], ic[2]) : ikon(IK_SEMUA, "currentColor")}<span class="ak-sl">${esc(l)}</span>${n != null ? `<span class="ak-sn">${angka(n)}</span>` : ""}</button>`; };
    $("akSektor").innerHTML = SEKTOR_GRUP.map(([jd, ks], i) => `<div class="ak-sg"><span class="ak-sg-h">${ikon(i === 0 ? '<path d="M13 2 5 14h6l-1 8 8-12h-6z"/>' : '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8 7l3 9M16 7l-3 9M8.5 6h7"/>', "currentColor")}<span>${esc(jd)}</span><em>${ks.length}</em></span><div class="ak-sg-b">${(i === 0 ? chip(GLB[0]) : "") + ks.map(k => chip([k, SEKTOR[k][0]])).join("")}</div></div>`).join("");
  }
  const namaSektor = r => (GLB.find(x => x[0] === r) || [r, (SEKTOR[r] || [kapital(r)])[0]])[1];
  /* multi-pilih: GL.set = himpunan sektor terpilih (OR). Chrome (aria-pressed) diset seketika oleh pemanggil, saring lewat nanti. */
  function setSektorSet(arr) {
    GL.set = new Set(arr); GL.r = tulisSektor(GL.set); st.sektor = new Set(glList()); K.hal = 1;
    document.querySelectorAll("#akSektor button[data-r]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.r === "" ? !GL.set.size : GL.set.has(b.dataset.r))));
    for (const v of ["lembaga", "pendanaan", "sistem_data", "pustaka", "berita", "tokoh"]) delete sudah[v];
    try { const u = new URL(location.href); GL.set.size ? u.searchParams.set("sektor", GL.r) : u.searchParams.delete("sektor"); history.replaceState(null, "", u); } catch (e) {}
    if (tampilSkrg === "pakar") saring(); else saringKotor = true; if (MUAT[tampilSkrg]) nanti(() => bukaView(tampilSkrg === "pakar" ? "tokoh" : tampilSkrg));
    nanti(segarSektor);
  }
  const setSektor = r => setSektorSet(r ? [r] : []);
  /* ---- gelombang 2: tokoh publik, pustaka, profil wilayah ---- */
  const wilKunci = (p, k) => k ? p + "|" + k : p;
  const wilTeks = w => { const [p, k] = String(w).split("|"); return k ? `${k}, ${provT(p)}` : provT(p); };
  const bagW = (judul, isi, sumber, n) => !isi ? "" : `<section class="ak-panel ak-lA${/^Ringkasan/.test(judul) ? " ak-rw" : ""}"><h2 class="ak-judulv">${judul}${n != null ? `<small class="ak-lper"> ${angka(n)}</small>` : ""}</h2>${isi}<p class="ak-lkaki">Sumber: ${sumber}</p></section>`;

  /* ---- tokoh publik (segmen di tab Pakar) ---- */
  const TK = {q: "", fs: {jenis: new Set(), prov: new Set()}, hal: 1}, TKPER = 18;
  let tkArr = [], tkView = [], tkHasil = [], tktok = 0, tkMode = "";
  /* tokoh tanpa foto: pakai foto pakar bernama sama persis (tanpa gelar/diakritik) bila unik; dipetakan sekali */
  const PERAN_KB = {"pengambil kebijakan": "var(--data1)", "pemimpin respons": "var(--bad)", "pelaksana teknis": "var(--data5)", "komunikator": "var(--meti-oranye)", "donatur": "var(--meti-oranye)", "penggerak relawan": "var(--ok)", "peneliti/ahli": "var(--line-ctl)", "pemuka masyarakat": "var(--warn)"};
  const pilPeranKb = t => { const k = String(t || "").toLowerCase(); return k ? `<span class="ak-izin" data-st="background:${PERAN_KB[k] || "var(--ink2)"}">${esc(kapital(k))}</span>` : ""; };
  const namaInti = n => nrm(String(n || "").replace(/,.*$/, " ").replace(/\b(prof|dr|drs|dra|ir|h|hj|dipl|ing|m\.?sc|ph\.?d|s\.?t|m\.?t|s\.?si|m\.?si|s\.?e|m\.?e|m\.?a|b\.?sc)\b\.?/gi, " "));
  let PK_NAMA = null; const pakarSama = x => { if (x.pakar_id && peta.has(x.pakar_id)) return peta.get(x.pakar_id); if (!PK_NAMA) { PK_NAMA = new Map(); semua.forEach(o => { const k = namaInti(o[1]); if (k) PK_NAMA.set(k, PK_NAMA.has(k) ? null : o); }); } return PK_NAMA.get(namaInti(x.nama)) || null; };
  const fotoTk = (x, besar) => { const pk = !urlOk(x.foto_url) && pakarSama(x), u = urlOk(x.foto_url) || (pk && pk[9]), ci = ciNama(x.nama); return u ? `<img class="ak-foto${besar ? " besar" : ""}" src="${esc(u)}" alt="" loading="lazy" referrerpolicy="no-referrer" data-inisial="${esc(inisial(x.nama))}" data-ci="${ci}">` : `<span class="ak-foto ak-ini ak-ci${ci}${besar ? " besar" : ""}" aria-hidden="true">${esc(inisial(x.nama))}</span>`; };
  const chipWil = w => w?.label ? `<span class="ak-wil" title="${esc(w.lengkap || w.label)}">${ikon(w.lingkup === "nasional" ? IKON_WEB : IKON_PIN, "currentColor")}${esc(w.label)}</span>` : "";
  const afilAttr = e => e.id ? `data-lb="${esc(e.id)}"` : `data-fq="${esc(e.nama)}"`;
  const afilHtml = x => { const a = x.afil; if (!a) return ""; const lg = e => lgoIkon(chainLogo({id: e.id, nama: e.nama}), IK_GEDUNG, "var(--data1)", 1), u = a.utama, jab = u ? u.jab : "";
    return `<span class="ak-af">${u ? `<button type="button" class="ak-af-u" ${afilAttr(u)} title="${esc(u.nama)}">${lg(u)}<span>${esc(u.nama)}</span></button>` : ""}${jab ? `<span class="ak-af-j">${esc(jab)}</span>` : ""}${a.mj && x.meti ? `<span class="ak-af-m">${esc(a.mj)}</span>` : ""}`
      + (a.lain.length ? `<span class="ak-af-l" aria-label="${esc(t("dir.af.lain"))}">${a.lain.slice(0, 3).map(e => `<button type="button" class="ak-af-b" ${afilAttr(e)} title="${esc(e.nama + (e.jab ? ", " + e.jab : "") + (e.kini ? "" : " (" + t("dir.af.dulu") + ")"))}" aria-label="${esc(e.nama)}">${lg(e)}</button>`).join("")}${a.lain.length > 3 ? `<span class="ak-r ak-r-n" title="${esc(a.lain.slice(3).map(e => e.nama).join(", "))}">+${angka(a.lain.length - 3)}</span>` : ""}</span>` : "") + `</span>`; };
  const kartuTk = (x, i) => kartuPola({afil: afilHtml(x), meti: x.meti || "", gelar: x.gelar_awal || "", attr: `data-tk="${i}"`, sosok: `<span class="ak-sosok">${fotoTk(x)}</span>`, nama: x.nama, status: x.kelompok_label ? (TKKEL ? null : ["kel", x.kelompok_label]) : (x.jenis && x.jenis !== TKKEL ? ["sinta", kapital(x.jenis)] : null), wil: chipWil(x.wilayah), navy: x.lembaga || x.institusi, navyLb: x.lembaga_id || ((x.lembaga || x.institusi) && lbArr.find(y => namaLb(y).includes(nrm(x.lembaga || x.institusi)))?.id) || "", biru: x.peran, sektor: x.sektor, ket2: (x.negara ? `<span class="ak-lencana"><em class="ak-l-diaspora">${esc(NEGARA_NAMA[x.negara] || x.negara)}</em></span>` : "") + (pakarSama(x) ? '<span class="ak-lencana"><em class="ak-l-sinta">Juga pakar</em></span>' : "") + ((x.peran_energi || x.alasan) ? `<span class="ak-tk-ket">${x.peran_energi ? `<b>${esc(kapital(x.peran_energi))}</b> ` : ""}${esc(bersihWiki(x.alasan || ""))}</span>` : ""),
    metrik: []});   // pemilik: kartu tokoh tanpa angka kiprah/medsos
  function sheetTk(x) {
    if (lbDulu(x, sheetTk)) return;
    { const ps = pakarSama(x); if (ps) { tutupSheet(); buka(ps, x); return; } }
    const web = urlOk(x.web), wd = /^Q\d+$/.test(x.wikidata || "") ? `https://www.wikidata.org/wiki/${x.wikidata}` : "", lem = x.lembaga && lbArr.find(y => namaLb(y).includes(nrm(x.lembaga))), srcs = [...dlist(x.sumber).map(s => s?.url), web, wd, ...dlist(x.kiprah).map(k => k.sumber_url), ...Object.values(x.medsos_resmi || {})];
    const yk = x.yakin || yakinOrang(srcs, [["peran", x.peran], ["foto", urlOk(x.foto_url)], ["situs resmi", web], ["kiprah", dlist(x.kiprah).length]], x.diperiksa), kon = medsosPasang(x) + (web ? kItem(x, "web", IKON_WEB, "Situs", web, urlHost(web)) : "");
    const ahli = !!x.pakar_id || /peneliti|ahli/i.test(x.peran_energi || ""), pkSm = pakarSama(x), ring = x.alasan ? bersihWiki(x.alasan) : `${x.nama}${x.peran ? ` berperan sebagai ${x.peran}` : ""}${x.lembaga ? ` di ${x.lembaga}` : ""}.`;
    const sj = tkArr.filter(y => y.id !== x.id && strs(y.sektor).some(r => strs(x.sektor).includes(r))).sort((a, b) => (String(b.prov) === String(x.prov)) - (String(a.prov) === String(x.prov)) || dlist(b.kiprah).length - dlist(a.kiprah).length).slice(0, 6);
    const thn = Math.max(0, ...dlist(x.kiprah).map(k => +k.tahun || 0)), met = [["Kiprah", IKL.jenis, dlist(x.kiprah).length ? angka(dlist(x.kiprah).length) : ""], ["Terakhir", IKL.tahun, thn || ""]].filter(r => r[2]);
    bukaSheet("tokoh", `<div class="ak-dkepala"><div class="ak-dk-atas">${fotoTk(x, true)}<div class="ak-nama"><h2 id="akSJudul">${esc(x.nama)}</h2><p>${esc([x.peran, x.lembaga].filter(Boolean).join(", "))}</p><div class="ak-pil">${pilMini(IK_ORANG, kapital(x.peran_energi || ""), PERAN_KB[String(x.peran_energi || "").toLowerCase()])}${pilMini(IKL.jenis, kapital(x.jenis || ""))}${x.prov ? pilMini(IKON_PIN, provT(x.prov)) : ""}${strs(x.sektor).map(r => pilSektor(r)).join("")}${pilContoh(x)}</div></div>${met.length ? `<div class="ak-metrik ak-mt-t">${met.map(([l, d, v]) => `<div><span class="ak-mlabel">${ikon(d, "currentColor")}${l}</span><b>${esc(v)}</b></div>`).join("")}</div>` : ""}<div class="ak-pojok">${web ? `<a class="ak-ib" href="${esc(web)}" ${LUAR} title="Situs resmi" aria-label="Situs resmi">${ikon(IK_LUAR, "currentColor")}</a>` : ""}${koreksiBtn("tokoh", x.id)}</div></div>
      <p class="ak-ringk">${esc(ring)}</p>${pkSm ? `<div class="ak-pil"><button type="button" class="ak-rbtn ak-rbtn-b" data-pk="${esc(pkSm[0])}">Juga pakar: lihat profil akademik</button></div>` : ""}<div class="ak-korw"></div></div>`,
      () => riwayatTk(x) + pendidikanTk(x) + (pkSm ? bagB("Profil akademik", `<p class="ak-ket">${esc(pkSm[2])}${prodiDari(pkSm) ? ", " + esc(prodiDari(pkSm)) : ""}</p>${metrik(pkSm)}<div class="ak-pil">${pilTags(pkSm[8], 8)}</div>`) : "") + bagB("KIPRAH EBET", dlist(x.kiprah).length ? `<ol class="ak-linimasa">${dlist(x.kiprah).slice().sort((p, q) => (+q.tahun || 0) - (+p.tahun || 0)).map(k => `<li><b>${esc(k.tahun || "")}</b><span>${esc(bersihWiki(k.teks))} ${cip(k.sumber_url)}</span></li>`).join("")}</ol>` : "") + (f => f.trim() ? bagB("Fakta", `<div class="ak-in-fg">${f}</div>`) : "")(`${fkIn("Afiliasi lain", dlist(x.afiliasi).map(a => pilLbKlik(null, a.nama_lembaga || a)).join(""))}${fkIn(ahli ? "Keahlian dan sektor" : "Sektor terkait", strs(x.sektor).map(r => pilSektor(r)).join(""))}${fkIn("Kontak", kon ? `<div class="ak-lkontak">${kon}</div>` : "")}`)
        + tautanTk(x) + kanalTk(x) + '<div id="akTkBuku"></div><div id="akTkBrt"></div>' + bagB("Sumber", sumberList(srcs))
        + bagB("Tokoh sejenis", sj.length ? `<ol class="ak-sdaftar ak-pkl">${sj.map(y => barisTkRow(y, `data-tks="${esc(y.id)}"`)).join("")}</ol>` : ""));
    $("akSheet").dataset.k = ""; terhubungDi("T:" + x.id); const tk = tokenS; ambilData("berita").then(d => { const h = brtHtml("tokoh", x.id, d); if (h) isiNanti(() => tk === tokenS, "akTkBrt", h); }); ambilData("buku").then(d => { const h = bukuOrang("tokoh", x.id, d); if (h) isiNanti(() => tk === tokenS, "akTkBuku", h); });
  }
  /* riwayat jabatan: linimasa vertikal, tahun di kiri, jabatan tebal + lembaga berlogo di kanan, "Kini" bila belum selesai */
  const riwayatTk = x => { const a = dlist(x?.riwayat).filter(r => r && (r.jabatan || r.lembaga)).slice().sort((p, q) => (+String(q.mulai).slice(0, 4) || 0) - (+String(p.mulai).slice(0, 4) || 0)); if (!a.length) return "";
    const th = v => String(v || "").slice(0, 4);
    return `<section class="ak-dbagian"><div class="ak-disi"><h3>Riwayat jabatan</h3><ol class="ak-riw">${a.map(r => { const y = r.lembaga && lbArr.find(z => namaLb(z).includes(nrm(r.lembaga))), lg = y ? logoLb(y).replace('class="ak-lgo"', 'class="ak-lgo kecil"') : (r.lembaga && logoPemUrl(r.lembaga).length ? lgoIkon(logoPemUrl(r.lembaga), IK_GEDUNG, "var(--data1)", 1) : ""), kini = !r.selesai;
      return `<li><span class="ak-riw-t">${esc(th(r.mulai) || "?")}${kini || th(r.selesai) === th(r.mulai) ? "" : ` \u2013 ${esc(th(r.selesai))}`}</span><div class="ak-riw-i"><span class="ak-riw-j"><b>${esc(r.jabatan || "")}</b>${kini ? '<span class="ak-izin berlaku">Kini</span>' : ""}</span>${r.lembaga ? `<span class="ak-riw-l">${lg}${y ? `<button type="button" class="ak-pk" data-lb="${esc(y.id)}">${esc(r.lembaga)}</button>` : esc(r.lembaga)}</span>` : ""}</div>${urlOk(r.sumber_url) ? `<a class="ak-riw-s" href="${esc(urlOk(r.sumber_url))}" ${LUAR} title="Sumber: ${esc(hostDari2(urlOk(r.sumber_url)))}" aria-label="Sumber: ${esc(hostDari2(urlOk(r.sumber_url)))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg></a>` : ""}</li>`; }).join("")}</ol></div></section>`; };
  /* PENDIDIKAN (baru, bukan dari asal): linimasa gelar, bidang, institusi (tertaut ke profil lembaga bila ada), tahun, sumber */
  const srcIkon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';
  const pendidikanTk = x => { const a = dlist(x?.pendidikan).filter(r => r && (r.institusi || r.bidang)).slice().sort((p, q) => (+String(q.selesai || q.mulai).slice(0, 4) || 0) - (+String(p.selesai || p.mulai).slice(0, 4) || 0)); if (!a.length) return "";
    const th = v => String(v || "").slice(0, 4);
    return `<section class="ak-dbagian"><div class="ak-disi"><h3>${esc(t("dir.pendidikan", {}))}</h3><ol class="ak-riw">${a.map(r => { const y = r.institusi && lbArr.find(z => namaLb(z).includes(nrm(r.institusi))), u = urlOk(r.sumber_url);
      return `<li><span class="ak-riw-t">${esc(th(r.mulai) || "?")}${th(r.selesai) && th(r.selesai) !== th(r.mulai) ? ` \u2013 ${esc(th(r.selesai))}` : ""}</span><div class="ak-riw-i"><span class="ak-riw-j"><b>${esc([r.jenjang, r.bidang].filter(Boolean).join(", "))}</b>${r.gelar ? `<span class="ak-izin">${esc(r.gelar)}</span>` : ""}</span>${r.institusi ? `<span class="ak-riw-l">${y ? `<button type="button" class="ak-pk" data-lb="${esc(y.id)}">${esc(r.institusi)}</button>` : esc(r.institusi)}</span>` : ""}</div>${u ? `<a class="ak-riw-s" href="${esc(u)}" ${LUAR} title="Sumber: ${esc(hostDari2(u))}" aria-label="Sumber: ${esc(hostDari2(u))}">${srcIkon}</a>` : ""}</li>`; }).join("")}</ol></div></section>`; };
  /* TAUTAN (baru): LinkedIn, X, situs, Scholar; hanya https, dibuka di tab baru */
  const TAUTAN_JENIS = {linkedin: ["LinkedIn", '<path d="M5 9v10M5 5v.01M10 19v-6a3 3 0 0 1 6 0v6M10 9v10"/>'], x: ["X", '<path d="M5 5l14 14M19 5 5 19"/>'], web: ["Situs", IKON_WEB], scholar: ["Scholar", '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c2 2 10 2 12 0v-5"/>']};
  const tautanTk = x => { const a = dlist(x?.tautan).filter(r => r && urlOk(r.url) && /^https:/i.test(r.url)); if (!a.length) return "";
    return `<section class="ak-dbagian"><div class="ak-disi"><h3>${esc(t("dir.tautan", {}))}</h3><div class="ak-tautan">${a.map(r => { const j = TAUTAN_JENIS[r.jenis] || [kapital(r.jenis || "Tautan"), IK_LUAR]; return `<a href="${esc(r.url)}" ${LUAR}>${ikon(j[1], "currentColor")}${esc(j[0])}${ikon(IK_LUAR, "currentColor")}</a>`; }).join("")}</div></div></section>`; };
  const kanalTk = () => "";   // kanal donasi asal dibuang (bukan domain METI)
  function gambarTk(gulir) {
    segarMeti("akTkM", tkView.filter(x => !TKKEL || x.jenis === TKKEL));
    tkHasil = tkView.filter(x => (!TKKEL || x.jenis === TKKEL) && cocokMeti(TK.meti, x) && (!GL.set.size || cocokGL(strs(x.sektor))) && dalam(TK.fs.jenis, [x.jenis]) && dalam(TK.fs.prov, [String(x.prov)]) && (!TK.q || x._cari.includes(TK.q.toLowerCase())));
    const n = tkHasil.length, a = (TK.hal - 1) * TKPER;
    $("akTkJ").innerHTML = `<b>${angka(n)}</b> ${esc(KEL_LABEL[TKKEL] || "orang")}${msAda("tk") ? " " + msChips("tk") : ""}`; msTandai("tk");
    $("akTkL").innerHTML = n ? `<div class="ak-daftar">${tkHasil.slice(a, a + TKPER).map((x, j) => kartuTk(x, a + j)).join("")}</div>` : hampa("tokoh");
    $("akTkH").innerHTML = navHal(TK.hal, n, TKPER, "tokoh");
    if (gulir) gulirKe("akTkJ");
  }
  function bangunTokoh(p, d, dia) {
    const arr = dlist(Array.isArray(d) ? d : d?.tokoh).filter(x => x && x.id && x.nama).map(x => Object.assign(x, {_cari: [x.nama, x.peran, x.lembaga, x.institusi, x.negara, ...dlist(x.afiliasi).map(a => a.nama_lembaga)].filter(Boolean).join(" ").toLowerCase()}));
    /* urutan: sesuai urutan data */
    const UTAMA_TK = [], AKHIR_TK = [];
    const bobotTk = x => { const u = UTAMA_TK.indexOf(x.id); if (u >= 0) return u; const z = AKHIR_TK.indexOf(x.id); if (z >= 0) return 100 + z; const pr = String(x.peran || ""), aktif = labelPeran(pr) !== "Pernah menjabat"; return aktif ? 10 : 20; };
    arr.sort((a, b) => bobotTk(a) - bobotTk(b));
    if (!dia) tkArr = arr; tkView = arr; tkMode = dia ? "diaspora" : "tokoh";
    Object.assign(TK, {q: "", meti: "", fs: {jenis: new Set(), prov: new Set()}, hal: 1}); MSG.tk = {st: TK.fs, f: ["jenis", "prov"], h: () => { TK.hal = 1; }, g: () => gambarTk(false), lab: (f, v) => f === "prov" ? (v === "nasional" ? "Nasional" : provT(v)) : kapital(String(v))};
    const hit = f => { const n = {}; tkView.forEach(x => { const k = f(x); if (k) n[k] = (n[k] || 0) + 1; }); return n; }, nJ = hit(x => x.jenis), nP = hit(x => x.prov == null ? "" : String(x.prov));
    p.innerHTML = `<div class="ak-saring"><div class="ak-alat">${cariKotak("akTkQ", "Cari nama, peran, atau lembaga")}</div>${segMeti("akTkM", tkView.filter(x => !TKKEL || x.jenis === TKKEL), TK.meti)}<div class="ak-baris">${htmlPilih("akTkJn", IKL.jenis, "Cari jenis tokoh")}${htmlPilih("akTkP", IKON_PIN, "Cari wilayah")}</div></div>
      <div class="ak-hasil"><h2 class="ak-judulv" id="akTkJ"></h2><div id="akTkL"></div><nav id="akTkH" class="ak-hal" aria-label="Halaman daftar tokoh" aria-live="polite"></nav></div>`;
    const jalan = () => { const t = ++tktok; nanti(() => { if (t === tktok) gambarTk(false); }); }, ubah = (k, v) => { TK[k] = v; TK.hal = 1; jalan(); };
    /* ikon per jenis tokoh: [path svg, warna] */
    const IK_TKJ = {pejabat: ['<path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6"/>', "var(--data1)"], "mantan pejabat": ['<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', "var(--ink2)"], "figur publik peduli": ['<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>', "var(--bad)"], "peneliti non-kampus": ['<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/>', "var(--line-ctl)"], "tokoh agama": ['<path d="M12 3v4M10 5h4M6 21V11l6-4 6 4v10M10 21v-4h4v4"/>', "var(--ok)"], "komunikator publik": ['<path d="M3 11v2h3l5 4V7L6 11H3zM15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>', "var(--data5)"], "filantropis/donatur": ['<path d="M12 2v20M17 6H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H6"/>', "var(--meti-oranye)"], praktisi: ['<path d="m14 7 3-3 3 3-3 3M17 4l-9 9-3 1 1-3 9-9M4 20h16"/>', "var(--data5)"]};
    msPilih("akTkJn", "tk", "jenis", {ik: v => IK_TKJ[String(v).toLowerCase()] || null, semua: "Semua jenis", opsi: () => Object.entries(nJ).sort((a, b) => b[1] - a[1]).map(([v, c]) => [v, kapital(v), c])});
    msPilih("akTkP", "tk", "prov", {semua: "Wilayah: Semua", opsi: () => Object.entries(nP).filter(([v]) => v).sort((a, b) => (b[0] === "nasional") - (a[0] === "nasional") || b[1] - a[1]).map(([v, c]) => [v, v === "nasional" ? "Nasional" : provT(v), c])});
    $("akTkM").addEventListener("click", e => { const b = e.target.closest("button[data-v]"); if (!b) return; TK.meti = b.dataset.v; setSeg("akTkM", TK.meti); TK.hal = 1; jalan(); });
    let tt = 0; $("akTkQ").addEventListener("input", e => { clearTimeout(tt); tt = setTimeout(() => ubah("q", e.target.value.trim()), 250); });
    pasangHal("akTkH", h => { TK.hal = h; gambarTk(true); });
    const buka1 = e => { const c = e.target.closest("[data-tk]"); if (c && tkHasil[+c.dataset.tk]) sheetTk(tkHasil[+c.dataset.tk]); };
    $("akTkL").addEventListener("click", buka1); $("akTkL").addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-tk]")) { e.preventDefault(); buka1(e); } });
    gambarTk(false);
  }
  const NEGARA_NAMA = {ES: "Spanyol", RU: "Rusia", HU: "Hungaria", TW: "Taiwan", KR: "Korea Selatan", TH: "Thailand", SA: "Arab Saudi", CN: "Tiongkok", AE: "Uni Emirat Arab", HK: "Hong Kong", SD: "Sudan", PH: "Filipina", DZ: "Aljazair", TR: "Turki", BN: "Brunei", AT: "Austria", BE: "Belgia", CH: "Swiss", SE: "Swedia", NO: "Norwegia", DK: "Denmark", FI: "Finlandia", IT: "Italia", PL: "Polandia", CZ: "Ceko", IE: "Irlandia", PT: "Portugal", IN: "India", PK: "Pakistan", BD: "Bangladesh", VN: "Vietnam", AU: "Australia", US: "Amerika Serikat", GB: "Inggris", NL: "Belanda", DE: "Jerman", JP: "Jepang", SG: "Singapura", MY: "Malaysia", CA: "Kanada", FR: "Prancis", NZ: "Selandia Baru", KR: "Korea Selatan", CH: "Swiss", SE: "Swedia", NO: "Norwegia", BE: "Belgia", IT: "Italia", AT: "Austria", DK: "Denmark", FI: "Finlandia", AE: "Uni Emirat Arab", SA: "Arab Saudi", CN: "Tiongkok", HK: "Hong Kong", TW: "Taiwan", TH: "Thailand", IN: "India"};
  /* diaspora masuk daftar akademisi: dimuat malas sekali; yang openalex id-nya sudah ada hanya diberi tanda, yang belum ditambahkan sebagai baris pakar */
  const DIA = new Map(); let diaMuat = false;
  function muatDiaspora() { if (diaMuat) return; diaMuat = true; ambilData("diaspora").then(d => { const a = dlist(Array.isArray(d) ? d : d?.diaspora); if (!a.length) return;
    a.forEach(x => { const id = String(x.openalex_id || "").replace(/^https?:\/\/openalex\.org\//, ""), o = id && peta.get(id); if (o) { o[15] = "diaspora"; if (!o[9] && urlOk(x.foto_url)) o[9] = urlOk(x.foto_url); DIA.set(o[0], x.negara || ""); return; }
      const nid = id || "dia-" + x.id, r = [nid, x.nama, x.institusi || x.lembaga || "", strs(x.sektor), null, dlist(x.karya_indonesia).length || null, null, x.orcid || "", [], urlOk(x.foto_url) || null, null, "", "", "x", null, "diaspora"]; r._cari = [x.nama, x.institusi, x.negara].filter(Boolean).join(" ").toLowerCase(); semua.push(r); peta.set(nid, r); DIA.set(nid, x.negara || ""); });
    nanti(() => { saring(); segarSektor(); }); }); }
  function pasangPkSeg(v) {
    if (pkSub === "diaspora") { pkSub = "akademisi"; st.sumber = "d"; setSeg("akS", "d"); }
    const ada = v === "pakar"; $("akPkSeg").hidden = !ada; const tok = ada && pkSub === "tokoh";
    $("akIsi").hidden = !ada || tok; $("akv-tokoh").hidden = !tok;
    if (tok && tkMode !== "tokoh") { delete sudah.tokoh; bukaView("tokoh"); }
    setSeg("akPkSeg", TKKEL); letakSektor();
  }
  const KEL_LABEL = {profesional: "profesional", praktisi: "praktisi", akademisi: "akademisi dan pakar", "tokoh-publik": "tokoh publik", "aktivis-tokoh-daerah": "aktivis dan tokoh daerah"};
  function pilihKelompok(v) { TKKEL = v; pkSub = v === "akademisi" && semua.length ? "akademisi" : "tokoh"; TK.hal = 1; if ($("akTkL")) gambarTk(false); setSeg("akPkSeg", v); pasangPkSeg("pakar"); }

  /* ---- pustaka dokumen ---- */
  const PU = {fs: {jenis: new Set(), prov: new Set(), tahun: new Set()}, q: "", hal: 1}, PUPER = 25, JENIS_DOK = ["regulasi", "KRB", "RPB", "renkon", "R3P", "Jitupasna", "laporan kejadian", "kajian", "SOP", "rencana aksi"];
  let puArr = [], puHasil = [], putok = 0;
  const wilDok = d => dlist(d.wilayah).filter(w => w && w.prov);
  function gambarPu(gulir) {
    puHasil = puArr.filter(d => dalam(PU.fs.jenis, [d.jenis]) && dalam(PU.fs.prov, wilDok(d).map(w => String(w.prov))) && dalam(PU.fs.tahun, [String(d.tahun)]) && (!GL.r || cocokGL(strs(d.sektor))) && (!PU.q || d._cari.includes(PU.q.toLowerCase())));
    const n = puHasil.length, a = (PU.hal - 1) * PUPER;
    $("akPuJ").innerHTML = `<b>${angka(n)}</b> dokumen${glT()}${msAda("pu") ? " " + msChips("pu") : ""}`; msTandai("pu");
    $("akPuL").innerHTML = n ? `<ul class="ak-dokl">${puHasil.slice(a, a + PUPER).map(d => { const u = urlDok(d), wl = wilDok(d).slice(0, 3);
      return `<li class="ak-dokr"${u ? ` role="link" tabindex="0" ${hrefAttr(u)}` : ""}><span class="ak-dikon" aria-hidden="true">${ikon('<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>', "currentColor")}</span><div class="ak-dokm"><b>${u ? tautanLuar(u, esc(d.judul)) : esc(d.judul)}</b><div class="ak-pil"><span class="ak-prodi">${esc(kapital(d.jenis || "dokumen"))}</span>${d.tahun ? `<span class="ak-lper">${esc(d.tahun)}</span>` : ""}${wl.map(w => `<button type="button" class="ak-pk" data-wl="${esc(wilKunci(String(w.prov), w.kab || ""))}">${esc(wilTeks(wilKunci(String(w.prov), w.kab || "")))}</button>`).join("")}${pilContoh(d)}</div></div>${u ? `<a class="ak-rbtn ak-rbtn-b" href="${esc(u)}" ${LUAR}>Buka</a>` : ""}</li>`; }).join("")}</ul>` : hampa("dokumen");
    $("akPuH").innerHTML = navHal(PU.hal, n, PUPER, "dokumen");
    if (gulir) gulirKe("akPuJ");
  }
  function bangunPustaka(p, d) {
    puArr = dlist(Array.isArray(d) ? d : d?.dokumen).filter(x => x && x.judul).map(x => Object.assign(x, {_cari: [x.judul, x.jenis, ...wilDok(x).map(w => w.kab)].filter(Boolean).join(" ").toLowerCase()})).sort((a, b) => (b.tahun || 0) - (a.tahun || 0));
    Object.assign(PU, {fs: {jenis: new Set(), prov: new Set(), tahun: new Set()}, q: "", hal: 1}); MSG.pu = {st: PU.fs, f: ["jenis", "prov", "tahun"], h: () => { PU.hal = 1; }, g: () => gambarPu(false), lab: (f, v) => f === "prov" ? provT(v) : String(v)};
    const hit = f => { const n = {}; puArr.forEach(x => { for (const k of [].concat(f(x))) if (k) n[k] = (n[k] || 0) + 1; }); return n; }, nJ = hit(x => x.jenis), nP = hit(x => wilDok(x).map(w => String(w.prov))), nT = hit(x => x.tahun);
    p.innerHTML = `${segHtml("akPuS", "Sub-tampilan pustaka", [["buku", "Buku", IKJ], ["dok", "Dokumen", IKJ]])}<div id="akPuDok" class="ak-tampilan" hidden></div><div id="akPuBuku" class="ak-tampilan"></div>`;
    $("akPuS").addEventListener("click", e => { const b = e.target.closest("button[data-v]"); if (!b) return; setSeg("akPuS", b.dataset.v); $("akPuDok").hidden = b.dataset.v !== "dok"; $("akPuBuku").hidden = b.dataset.v !== "buku"; if (b.dataset.v === "buku" && !$("akBkJ")) nanti(() => bangunBuku($("akPuBuku"))); });
    $("akPuDok").innerHTML = `<div class="ak-saring"><div class="ak-alat">${cariKotak("akPuQ", "Cari judul atau kab/kota")}</div><div class="ak-baris ak-baris3">${htmlPilih("akPuJn", IKL.jenis, "Cari jenis dokumen")}${htmlPilih("akPuP", IKON_PIN, "Cari provinsi")}${htmlPilih("akPuT", IKL.tahun, "Cari tahun")}</div></div>
      <div class="ak-hasil"><h2 class="ak-judulv" id="akPuJ"></h2><div id="akPuL"></div><nav id="akPuH" class="ak-hal" aria-label="Halaman daftar dokumen" aria-live="polite"></nav></div>`;
    const jalan = () => { const t = ++putok; nanti(() => { if (t === putok) gambarPu(false); }); }, ubah = (k, v) => { PU[k] = v; PU.hal = 1; jalan(); };
    msPilih("akPuJn", "pu", "jenis", {semua: "Semua jenis", opsi: () => JENIS_DOK.map(j => [j, j, nJ[j] || 0]).concat(Object.entries(nJ).filter(([j]) => !JENIS_DOK.includes(j)).map(([j, c]) => [j, kapital(j), c]))});
    msPilih("akPuP", "pu", "prov", {semua: "Semua provinsi", opsi: () => Object.entries(nP).sort((a, b) => b[1] - a[1]).map(([v, c]) => [v, provT(v), c])});
    msPilih("akPuT", "pu", "tahun", {semua: "Semua tahun", opsi: () => Object.entries(nT).sort((a, b) => b[0] - a[0]).map(([v, c]) => [v, v, c])});
    let tt = 0; $("akPuQ").addEventListener("input", e => { clearTimeout(tt); tt = setTimeout(() => ubah("q", e.target.value.trim()), 250); });
    pasangHal("akPuH", h => { PU.hal = h; gambarPu(true); });
    gambarPu(false);
  }

  /* ---- tab Wilayah (F-W2, bagian F0): hitungan pakar dan lembaga per provinsi dari data direktori; potensi, kapasitas, dan skor menyusul di F2 (JM-F06) ---- */
  const WL = {kode: ""};
  async function bangunWilayah(p) {
    if (!lbArr.length) { const l = await ambilData("lembaga"); if (l) indeksLb(l); }
    const baris = Object.keys(PROV).map(k => ({k, pk: semua.filter(o => String(provO(o)) === k).length, lb: lbArr.filter(x => String(x.prov) === k).length})).filter(r => r.pk || r.lb).sort((a, b) => b.pk + b.lb - a.pk - a.lb);
    p.innerHTML = `<section class="ak-panel"><h2 class="ak-judulv">${esc(t("dir.wilayah.judul"))}</h2>` + (baris.length ? `<div class="ak-tw jm-gulir"><table class="jm-tabel ak-t2"><thead><tr><th>${esc(t("dir.wilayah.provinsi"))}</th><th class="r">${esc(t("dir.wilayah.pakar"))}</th><th class="r">${esc(t("dir.wilayah.lembaga"))}</th></tr></thead><tbody>${baris.map(r => `<tr><td><button type="button" class="ak-pk" data-wlp="${esc(r.k)}">${esc(provT(r.k))}</button></td><td class="r">${angka(r.pk)}</td><td class="r">${angka(r.lb)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="ak-khampa">${esc(t("dir.wilayah.kosong"))}</p>`) + `<p class="ak-lkaki">${esc(t("dir.wilayah.catatan"))}</p></section>`;
    p.addEventListener("click", e => { const b = e.target.closest("[data-wlp]"); if (!b) return; st.prov = new Set([b.dataset.wlp]); isiProv(); tampil("pakar"); nanti(saring); });
  }

  /* ---- berita (L4B): daftar kartu bergaya portal berita, tertaut ke entitas ---- */
  const KAT_BERITA = ["kerja sama", "bantuan dan respons", "peluncuran inovasi", "uji dan penerapan", "pendanaan dan hibah", "penghargaan", "penunjukan jabatan", "kebijakan", "riset dan publikasi", "hukum dan izin", "lainnya"];
  const JENIS_ENT = {lembaga: "Lembaga", tokoh: "Tokoh", pakar: "Pakar", inovasi: "Inovasi"};
  const BR = {fs: {kat: new Set(), jenis: new Set(), media: new Set()}, ent: "", dari: "", sampai: "", q: "", hal: 1}, BRPER = 15;
  let brArr = [], brHasil = [], brtok = 0;
  const entBr = e => { if (!e) return null; if (e.jenis === "lembaga") { const x = lbMap.get(e.id); return x && {nama: x.nama, logo: logoLb(x), buka: () => bukaLb(x)}; }
    if (e.jenis === "tokoh") { const x = tkArr.find(t => t.id === e.id); return x && {nama: x.nama, logo: `<span class="ak-sosok">${fotoTk(x)}</span>`, buka: () => sheetTk(x)}; }
    if (e.jenis === "pakar") { const o = peta.get(e.id); return o && {nama: o[1], logo: `<span class="ak-sosok">${foto(o)}</span>`, buka: () => buka(o)}; }
    if (e.jenis === "inovasi") return {nama: "Inovasi", logo: `<span class="ak-klogo kosong" aria-hidden="true">${ikon(KAT.inovasi[1], "currentColor")}</span>`, buka: () => { IN.q = ""; tampil("inovasi"); }}; return null; };
  function kartuBr(b, i) {
    const u = urlOk(b.url), foto = urlOk(BFOTO?.[b.id]?.foto_url || b.foto_url), ents = dlist(b.entitas).map((e, idx) => [idx, entBr(e)]).filter(q => q[1]);
    /* entitas sejenis yang banyak diringkas jadi satu chip ("Basarnas (6 kantor)") */
    const grp = new Map(); ents.forEach(q => { const k = /^kantor sar/i.test(q[1].nama) ? "Basarnas" : q[1].nama.split(" ").slice(0, 2).join(" "); (grp.get(k) || grp.set(k, []).get(k)).push(q); });
    const chips = []; grp.forEach((a, k) => { if (a.length >= 3) chips.push({idx: a[0][0], e: a[0][1], label: k === "Basarnas" ? `Basarnas (${a.length} kantor)` : `${k} (${a.length})`}); else a.forEach(q => chips.push({idx: q[0], e: q[1], label: q[1].nama})); });
    const th = foto ? `<img src="${esc(foto)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : (chips[0] ? chips[0].e.logo : ikon(IK_KORAN, "currentColor"));
    const rg = b.ringkas && !/memberitakan|diberitakan/i.test(b.ringkas) && nrm(b.ringkas) !== nrm(b.judul) ? b.ringkas : "";
    return `<article class="ak-brk2"${u ? ` role="link" tabindex="0" ${hrefAttr(u)}` : ""}><span class="ak-brk2-t${foto ? " foto" : ""}">${th}</span><div class="ak-brk2-m"><h3>${esc(b.judul)}</h3>
      <div class="ak-brk2-meta">${[b.media, tglID(b.tanggal)].filter(Boolean).map(esc).join(", ")}${b.kategori ? `<span class="ak-mp ak-mp-kat">${esc(kapital(b.kategori))}</span>` : ""}${pilContoh(b)}</div>${rg ? `<p class="ak-brk2-r">${esc(rg)}</p>` : ""}
      <div class="ak-brk2-e">${chips.slice(0, 3).map(c => `<button type="button" class="ak-brk2-c" data-bre="${i}:${c.idx}" title="${esc(c.e.nama)}">${c.e.logo}<span>${esc(potong(c.label, 30))}</span></button>`).join("")}${chips.length > 3 ? `<span class="ak-r ak-r-n">+${chips.length - 3}</span>` : ""}${strs(b.sektor).slice(0, 2).map(r => pilSektor(r)).join("")}</div></div>
      ${u ? `<span class="ak-brk2-x" aria-hidden="true">${ikon(IK_LUAR, "currentColor")}</span>` : ""}</article>`;
  }
  function gambarBr(gulir) {
    const q = BR.q.toLowerCase();
    brHasil = brArr.filter(b => dalam(BR.fs.kat, [b.kategori]) && dalam(BR.fs.media, [b.media]) && (!GL.r || cocokGL(strs(b.sektor))) && (!BR.ent || dlist(b.entitas).some(e => e.jenis + ":" + e.id === BR.ent)) && dalam(BR.fs.jenis, dlist(b.entitas).map(e => e.jenis))
      && (!BR.dari || String(b.tanggal) >= BR.dari) && (!BR.sampai || String(b.tanggal).slice(0, 10) <= BR.sampai) && (!q || b._cari.includes(q)));
    const n = brHasil.length, a = (BR.hal - 1) * BRPER, e = BR.ent ? entBr({jenis: BR.ent.split(":")[0], id: BR.ent.slice(BR.ent.indexOf(":") + 1)}) : null;
    $("akBrJ").innerHTML = `<b>${angka(n)}</b> berita${glT()}${msAda("br") ? " " + msChips("br") : ""}${e ? ` tentang ${esc(e.nama)} <button type="button" class="ak-pk" data-brlepas="1">Lepas saringan</button>` : ""}`;
    $("akBrL").innerHTML = n ? `<div class="ak-brlist">${brHasil.slice(a, a + BRPER).map((b, j) => kartuBr(b, a + j)).join("")}</div>` : hampa("berita");
    $("akBrH").innerHTML = navHal(BR.hal, n, BRPER, "berita");
    msTandai("br"); if (gulir) gulirKe("akBrJ");
  }
  async function bangunBerita(p, d) {
    if (!lbArr.length) { const l = await ambilData("lembaga"); if (l) indeksLb(l); }
    if (!tkArr.length) { const t = await ambilData("tokoh"); if (t) tkArr = dlist(Array.isArray(t) ? t : t?.tokoh); }
    brArr = dlist(Array.isArray(d) ? d : d?.berita).filter(b => b && b.judul).map((b, i) => Object.assign(b, {_i: i, _cari: [b.judul, b.ringkas, b.media].filter(Boolean).join(" ").toLowerCase()})).sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)));
    const ent = BR.ent; Object.assign(BR, {fs: {kat: new Set(), jenis: new Set(), media: new Set()}, dari: "", sampai: "", q: "", hal: 1, ent}); MSG.br = {st: BR.fs, f: ["kat", "jenis", "media"], h: () => { BR.hal = 1; }, g: () => gambarBr(false), lab: (f, v) => f === "jenis" ? (JENIS_ENT[v] || v) : kapital(String(v))};
    const nM = {}; brArr.forEach(b => { if (b.media) nM[b.media] = (nM[b.media] || 0) + 1; }); const nK = {}; brArr.forEach(b => { if (b.kategori) nK[b.kategori] = (nK[b.kategori] || 0) + 1; });
    p.innerHTML = `<div class="ak-saring"><div class="ak-alat">${cariKotak("akBrQ", "Cari judul, ringkasan, atau media")}</div>
      <div class="ak-baris ak-baris3">${htmlPilih("akBrK", IKL.jenis, "Cari kategori")}${htmlPilih("akBrE", IK_GEDUNG, "Cari jenis entitas")}${htmlPilih("akBrM", IKJ, "Cari media")}</div>
      <div class="ak-baris"><label class="ak-tgl"><span>Dari tanggal</span><input id="akBrDr" type="date"></label><label class="ak-tgl"><span>Sampai tanggal</span><input id="akBrSd" type="date"></label></div></div>
      <div class="ak-hasil"><h2 class="ak-judulv" id="akBrJ"></h2><div id="akBrL"></div><nav id="akBrH" class="ak-hal" aria-label="Halaman daftar berita" aria-live="polite"></nav></div>`;
    const jalan = () => { const t = ++brtok; nanti(() => { if (t === brtok) gambarBr(false); }); }, ubah = (k, v) => { BR[k] = v; BR.hal = 1; jalan(); };
    msPilih("akBrK", "br", "kat", {semua: "Semua kategori", opsi: () => KAT_BERITA.filter(k => nK[k]).map(k => [k, kapital(k), nK[k]])});
    msPilih("akBrE", "br", "jenis", {semua: "Semua entitas", opsi: () => Object.entries(JENIS_ENT).map(([k, l]) => [k, l, brArr.filter(b => dlist(b.entitas).some(e => e.jenis === k)).length])});
    msPilih("akBrM", "br", "media", {semua: "Semua media", opsi: () => Object.entries(nM).sort((a, b) => b[1] - a[1]).map(([v, c]) => [v, v, c])});
    $("akBrDr").addEventListener("change", e => ubah("dari", e.target.value)); $("akBrSd").addEventListener("change", e => ubah("sampai", e.target.value));
    let tt = 0; $("akBrQ").addEventListener("input", e => { clearTimeout(tt); tt = setTimeout(() => ubah("q", e.target.value.trim()), 250); });
    pasangHal("akBrH", h => { BR.hal = h; gambarBr(true); });
    $("akBrL").addEventListener("click", e => { const b = e.target.closest("[data-bre]"); if (!b) return; const [i, j] = b.dataset.bre.split(":").map(Number); entBr(dlist(brHasil[i]?.entitas)[j])?.buka(); });
    $("akBrJ").addEventListener("click", e => { if (e.target.closest("[data-brlepas]")) { BR.ent = ""; BR.hal = 1; jalan(); } });
    gambarBr(false);
  }
  /* bagian BERITA TERKAIT di profil: maks 5, "lihat semua" membuka tab Berita tersaring ke entitas itu */
  let BFOTO = null; const muatBFoto = () => { if (BFOTO) return; BFOTO = {}; ambilData("berita_foto").then(d => { if (d && typeof d === "object" && !Array.isArray(d)) BFOTO = d; }); };
  const brtBaris = b => { const f = urlOk(BFOTO?.[b.id]?.foto_url), u = urlOk(b.url), th = f ? `<img src="${esc(f)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ikon(IK_KORAN, "currentColor");
    return `<li class="ak-brt-r"><${u ? `a href="${esc(u)}" ${LUAR}` : "span"} class="ak-brt-t${f ? "" : " kosong"}">${th}</${u ? "a" : "span"}><div><${u ? `a href="${esc(u)}" ${LUAR}` : "b"} class="ak-brt-j">${esc(b.judul)}</${u ? "a" : "b"}><small>${esc([b.media, tglID(b.tanggal)].filter(Boolean).join(", "))}</small></div></li>`; };
  const brtHtml = (jenis, id, d) => { const a = dlist(Array.isArray(d) ? d : d?.berita).filter(b => dlist(b?.entitas).some(e => e.jenis === jenis && e.id === id)).sort((x, y) => String(y.tanggal).localeCompare(String(x.tanggal)));
    return a.length ? bagS(`Berita terkait<small> ${angka(a.length)}</small>`, `<ul class="ak-brt">${a.slice(0, 5).map(brtBaris).join("")}</ul>${a.length > 5 ? `<button type="button" class="ak-rbtn ak-rbtn-b ak-kecilb" data-brt="${esc(jenis + ":" + id)}">${ikon(IK_KORAN, "currentColor")}Lihat semua ${angka(a.length)} berita</button>` : ""}`) : ""; };
  const lihatBerita = ent => { BR.ent = ent; BR.hal = 1; delete sudah.berita; tutupSheet(); tutupDrawerAman(); tutup(); tampil("berita"); };
  /* ikon medsos: glyph garis sederhana, bukan logo merek */
  const IKM = {instagram: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><path d="M16.8 7.2h.01"/>', tiktok: '<path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.4 2.3 2 3.8 4.5 4"/>', facebook: '<path d="M14 21v-8h3l.5-3.5H14V7.5c0-1 .5-1.8 2-1.8h1.6V3c-.6 0-1.7-.2-2.9-.2C12 2.8 10.4 4.4 10.4 7v2.5H7.5V13h2.9v8z"/>',
    x: '<path d="M5 4l14 16M19 4 5 20"/>', youtube: '<rect x="3" y="6" width="18" height="12" rx="4"/><path d="m10.5 9.5 4 2.5-4 2.5z"/>', linkedin: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 11v5M8 8h.01M12 16v-5M12 13c0-1.5 1-2 2-2s2 .6 2 2v3"/>'};
  const medsosPasang = x => { const h = sosMs(x); return h ? `<div class="ak-sosrow">${h}</div>` : ""; };

  /* ---- pendanaan (L4F, PRD 6.14): skema yang bisa dilamar dan proyek yang sudah mengalir ---- */
  /* ikon per jenis dana, warnanya sama dengan grafik */
  const IK_DANA = {"pinjaman": '<path d="M3 10h18M5 10V7l7-4 7 4v3M6 10v8M10 10v8M14 10v8M18 10v8M3 21h18"/>', "hibah G2G": '<path d="M4 21V4M4 4h11l-2 4 2 4H4"/>', "hibah multilateral": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>', "dana iklim": '<path d="M7 17a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a4 4 0 0 1-1 8z"/><path d="M9 20l1-2M13 20l1-2"/>', "dana riset": '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7 15h10"/>', "instrumen domestik": '<path d="M4 21V9l8-6 8 6v12z"/><path d="M9 21v-6h6v6"/>', "asuransi risiko": '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m9 12 2 2 4-4"/>'};
  const JENIS_DANA = {"pinjaman": "var(--data5)", "hibah G2G": "var(--ok)", "hibah multilateral": "var(--data5)", "dana iklim": "var(--line-ctl)", "dana riset": "var(--meti-oranye)", "instrumen domestik": "var(--ink2)", "asuransi risiko": "var(--line-ctl)"};
  const PD = {sumberP: "", tingkat: "", sub: "skema", jenis: "", pemberi: "", sasaran: "", status: "", prov: "", q: "", hal: 1}, PDPER = 18;
  /* nama donor baku: satu donor satu nama (World Bank = Bank Dunia, ADB = Asian Development Bank) */
  const DONOR_BAKU = {"world bank": "Bank Dunia", "the world bank": "Bank Dunia", "bank dunia": "Bank Dunia", "bank dunia (ibrd/ida)": "Bank Dunia", "world bank trust funds": "Bank Dunia", "international bank for reconstruction and development": "Bank Dunia", "adb": "Asian Development Bank (ADB)", "asian development bank": "Asian Development Bank (ADB)", "aiib": "Asian Infrastructure Investment Bank (AIIB)", "islamic development bank": "Islamic Development Bank (IsDB)", "jica": "JICA", "japan international cooperation agency": "JICA", "jica / jst": "JICA", "ministry of foreign affairs in japan": "Kementerian Luar Negeri Jepang", "pemerintah jepang": "Kementerian Luar Negeri Jepang", "afd": "AFD (Badan Pembangunan Prancis)", "agence française de développement": "AFD (Badan Pembangunan Prancis)", "federal ministry for economic cooperation and development (bmz)": "BMZ Jerman", "federal ministry for economic cooperation and development": "BMZ Jerman", "kfw untuk bmz jerman": "BMZ Jerman", "gis / bmz jerman": "BMZ Jerman", "giz / bmz jerman": "BMZ Jerman", "germany - federal foreign office": "Kementerian Luar Negeri Jerman", "green climate fund": "Green Climate Fund (GCF)", "gcf": "Green Climate Fund (GCF)", "global environment facility": "Global Environment Facility (GEF)", "uk - foreign, commonwealth development office (fcdo)": "FCDO Inggris", "fcdo": "FCDO Inggris", "united nations development programme": "UNDP", "world health organization": "WHO", "united nations population fund": "UNFPA", "unicef": "UNICEF", "world food programme": "WFP", "food and agriculture organization (fao)": "FAO", "international organization for migration (iom)": "IOM", "swiss agency for development and cooperation (sdc)": "SDC Swiss", "sdc": "SDC Swiss", "ministry of foreign affairs, denmark": "Kementerian Luar Negeri Denmark", "ministry for foreign affairs of finland": "Kementerian Luar Negeri Finlandia", "ministry of foreign affairs of the netherlands": "Kementerian Luar Negeri Belanda", "new zealand ministry of foreign affairs and trade": "MFAT Selandia Baru", "mfat": "MFAT Selandia Baru", "australia aid": "DFAT Australia", "dfat": "DFAT Australia", "department of foreign affairs and trade": "DFAT Australia", "directorate-general for european civil protection and humanitarian aid operations (echo)": "ECHO Uni Eropa", "echo": "ECHO Uni Eropa", "european commission - directorate-general for international partnerships": "Uni Eropa", "uni eropa": "Uni Eropa", "norad - norwegian agency for development cooperation": "Norad Norwegia", "foreign affairs, trade and development canada (dfatd)": "Global Affairs Canada", "international development research centre": "IDRC Kanada", "korea international cooperation agency": "KOICA", "koica": "KOICA", "office for government policy coordination": "Pemerintah Korea Selatan (OPC)"};
  const donorBaku = n => { if (typeof n !== "string") return n; const k = n.trim().toLowerCase(); return DONOR_BAKU[k] || DONOR_BAKU[k.replace(/\s*\([^)]*\)\s*/g, " ").trim()] || n; };
  let pdArr = [], pdHasil = [], pdtok = 0;
  const nilaiAsli = x => x.nilai != null ? `${x.mata_uang && x.mata_uang !== "USD" ? esc(x.mata_uang) + " " : "US$ "}${esc(angka(x.nilai))}` : "";
  const skUmum = x => x.isi_status === "sebagian" || /pengetahuan umum/i.test(x.isi_catatan || "");
  const skBesaran = x => nilaiAsli(x) || (x.besaran ? esc(x.besaran) : "");
  const skCara = x => (Array.isArray(x.cara) ? x.cara : String(x.cara || "").split(/\n|;\s+|(?<=\.)\s+(?=\d+[.)]\s)/)).map(t => String(t).replace(/^\s*\d+[.)]\s*/, "").trim()).filter(Boolean);
  const lencanaUmum = x => skUmum(x) ? `<span class="ak-umum" title="${esc(x.isi_catatan || "Sebagian isi ditulis dari pengetahuan umum")}">${ikon('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>', "currentColor")}Ringkasan umum, periksa laman resmi</span>` : "";
  const kartuSkema = (x, i) => `<article class="ak-psk"><div class="ak-psatas"><h4>${esc(x.nama)}</h4>${skUmum(x) ? `<span class="ak-umum ak-umum-i" title="Ringkasan umum, periksa laman resmi">${ikon('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>', "currentColor")}</span>` : ""}</div>
    <div class="ak-pil"><span class="ak-izin" data-st="background:${JENIS_DANA[x.jenis] || "var(--ink2)"}">${esc(kapital(x.jenis || "skema"))}</span>${x.status ? `<span class="ak-prodi">${esc(kapital(x.status))}</span>` : ""}${strs(x.sektor).map(r => pilSektor(r)).join("")}${pilContoh(x)}</div>
    <div class="ak-pil"><small class="ak-lper">Pemberi</small>${x.lembaga_id && lbMap.has(x.lembaga_id) ? `<button type="button" class="ak-pk" data-lb="${esc(x.lembaga_id)}">${esc(x.pemberi)}</button>` : `<span class="ak-prodi">${esc(x.pemberi || "Tidak tercatat")}</span>`}</div>
    <dl class="ak-sdl">${[["Sasaran", strs(x.sasaran).join(", ")], ["Besaran", skBesaran(x)], ["Tenggat", x.tenggat]].filter(r => r[1]).map(([k, v]) => `<dt>${k}</dt><dd>${typeof v === "string" && k === "Besaran" ? v : esc(v)}</dd>`).join("")}</dl>
    <details class="ak-cara"><summary class="ak-rbtn ak-rbtn-b">Cara mengajukan</summary><div class="ak-disi">${skCara(x).length ? `<ol class="ak-langkah">${skCara(x).map(t => `<li>${esc(t)}</li>`).join("")}</ol>` : '<p class="ak-khampa">Cara belum tercatat.</p>'}<div class="ak-lkontak">${strs(x.kontak?.email).filter(emailOk).map(m => `<span class="ak-kt"><a class="ak-lnk" href="mailto:${esc(m)}">${ikon(IKON_MAIL, "currentColor")}<em>Email</em>${esc(m)}</a></span>`).join("")}${strs(x.kontak?.telepon).map(t => `<span class="ak-kt"><a class="ak-lnk" href="${esc(telHref(t))}">${ikon(IK_TEL, "currentColor")}<em>Telepon</em>${esc(telF(t))}</a></span>`).join("")}${urlOk(x.url) ? `<span class="ak-kt"><a class="ak-lnk" href="${esc(urlOk(x.url))}" ${LUAR}>${ikon(IKON_WEB, "currentColor")}<em>Situs resmi</em>${esc(urlHost(x.url))}</a></span>` : ""}</div></div></details>
    <div class="ak-lfoot">${dlist(x.sumber).filter(s => urlOk(s?.url)).map(s => lSum(urlOk(s.url), x.diperiksa)).join("")}${lbPeriksa(x)}</div></article>`;
  const barisProyek = x => { const d = urlOk(x.url) || urlOk(dlist(x.sumber)[0]?.url);
    return [d ? tautanLuar(d, esc(x.nama)) : esc(x.nama), esc(x.pemberi || ""), esc(x.penerima || strs(x.pelaksana).join(", ")), `${nilaiAsli(x) || "Tidak tercatat"}${x.nilai_usd != null && x.mata_uang && x.mata_uang !== "USD" ? `<small class="ak-lper"> ${esc(usdR(x.nilai_usd))}</small>` : ""}`, esc([x.tahun, x.selesai].filter(Boolean).join(" sampai ")), esc(kapital(x.status || "")),
      `<span title="${esc(strs(x.prov).map(provT).join(", "))}">${esc(strs(x.prov).map(provT).join(", "))}</span>`, esc(strs(x.sektor).map(r => (SEKTOR[r] || [r])[0]).join(", "))]; };
  const KOL_PROYEK = [["Proyek"], ["Pemberi"], ["Penerima"], ["Nilai", "r"], ["Tahun", "n"], ["Status"], ["Provinsi", "n"], ["Sektor", "n"]];
  const bendera = c => /^[A-Za-z]{2}$/.test(c || "") ? String.fromCodePoint(...[...c.toUpperCase()].map(ch => 127397 + ch.charCodeAt(0))) : "";
  let ngArr = null;
  /* rincian bantuan negara: kartu per kejadian (tahun, kejadian, nilai, penerima berlabel), bisa diurutkan */
  const kejadianID = t => String(t || "").replace(/\(tanpa label emergensi\)/i, "(bantuan umum, tanpa kejadian tertentu)").replace(/\s+-\s+/g, ", ").replace(/\b([A-Z]{3,})\b/g, w => w[0] + w.slice(1).toLowerCase());
  const rincianNg = (a, urut) => { const r = a.slice().sort(urut === "tahun" ? (x, y) => (+y.tahun || 0) - (+x.tahun || 0) : (x, y) => (+y.usd || 0) - (+x.usd || 0));
    const mx = Math.max(1, ...r.map(x => +x.usd || 0));
    return `<div class="ak-seg ak-rng-urut" role="group" aria-label="Urutkan rincian"><button type="button" data-rng="nilai" aria-pressed="${urut !== "tahun"}">${ikon(IK_UANG, "currentColor")}Nilai terbesar</button><button type="button" data-rng="tahun" aria-pressed="${urut === "tahun"}">${ikon(IKP.tahun, "currentColor")}Terbaru</button></div>
      <ol class="ak-rng">${r.map(x => { const pn = strs(x.penerima); return `<li><div class="ak-rng-a"><span class="ak-rng-th">${esc(x.tahun ?? "")}</span><b>${esc(kejadianID(x.kejadian))}</b><span class="ak-rng-v">${esc(usdR(+x.usd || 0))}</span></div>
        <i class="ak-rng-b"><u data-st="width:${Math.max(2, (+x.usd || 0) / mx * 100).toFixed(1)}%"></u></i>
        ${pn.length ? `<div class="ak-rng-p"><span>Penerima</span>${pn.map(v => { const y = lbArr.find(z => namaLb(z).includes(nrm(v.replace(/,\s*government of$/i, "")))); const t = v.replace(/^Indonesia, Government of$/i, "Pemerintah Indonesia"); return y ? `<button type="button" class="ak-mp" data-lb="${esc(y.id)}">${ikon(IK_GEDUNG, "currentColor")}${esc(t)}</button>` : `<span class="ak-mp">${ikon(IK_GEDUNG, "currentColor")}${esc(t)}</span>`; }).join("")}${urlOk(x.sumber_url) ? `<a class="ak-rng-s" href="${esc(urlOk(x.sumber_url))}" ${LUAR} title="Sumber: FTS OCHA">FTS ↗</a>` : ""}</div>` : ""}</li>`; }).join("")}</ol>`; };
  document.addEventListener("click", e => { const b = e.target.closest("[data-rng]"); if (!b) return; const box = b.closest(".ak-bg, .ak-dbagian, section"); const n = ngArr?.find(x => document.getElementById("akSJudul")?.textContent.includes(x.negara)); if (!box || !n) return;
    const host = b.closest(".ak-rng-urut").parentElement; host.innerHTML = rincianNg(dlist(n.rincian), b.dataset.rng); });
  const namaFts = v => String(v || "").replace(/^(.*), Government of$/i, (m, a) => "Pemerintah " + ({Indonesia: "Indonesia", Japan: "Jepang", "United States": "Amerika Serikat", Australia: "Australia", Germany: "Jerman", "United Kingdom": "Inggris"}[a] || a));
  const BENTUK_W = {"Tunai": "var(--ok)", "Barang/in-kind": "var(--meti-oranye)", "Jasa": "var(--line-ctl)", "Lainnya": "var(--ink2)"}, STATUS_FTS = {"Dibayar": "var(--ok)", "Komitmen": "var(--data5)", "Janji": "var(--meti-oranye)"};
  const ringkasNg = n => { const r = n.ringkas || {}, kol = (j, a) => a.length ? `<div><h4 class="ak-lh">${j}</h4><div class="ak-bars">${a.map(([l, v, w]) => barHtml({warna: w || "var(--data5)", lebar: v / Math.max(1, a[0][1]) * 100, nilai: esc(usdR(v)), persen: "", label: esc(l)})).join("")}</div></div>` : "";
    const bt = Object.entries(r.bentuk || {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v, BENTUK_W[k]]);
    return `<div class="ak-komp">${kol("Pemberi", dlist(r.pemberi_teratas).slice(0, 6).map(x => [namaFts(x.nama), +x.usd || 0]))}${kol("Bentuk bantuan", bt)}${kol("Penerima", dlist(r.penerima_teratas).slice(0, 6).map(x => [namaFts(x.nama), +x.usd || 0]))}</div>${n.ringkas_catatan ? `<p class="ak-lkaki-s">${esc(n.ringkas_catatan)}</p>` : ""}`; };
  const aliranNg = (a, urut) => { const r = a.slice().sort(urut === "tahun" ? (x, y) => String(y.tanggal || y.tahun).localeCompare(String(x.tanggal || x.tahun)) : (x, y) => (+y.usd || 0) - (+x.usd || 0)), mx = Math.max(1, ...r.map(x => +x.usd || 0));
    return `<div class="ak-seg ak-rng-urut" role="group" aria-label="Urutkan aliran"><button type="button" data-aln="nilai" aria-pressed="${urut !== "tahun"}">${ikon(IK_UANG, "currentColor")}Nilai terbesar</button><button type="button" data-aln="tahun" aria-pressed="${urut === "tahun"}">${ikon(IKP.tahun, "currentColor")}Terbaru</button></div>
      <ol class="ak-rng">${r.slice(0, 60).map(x => `<li><div class="ak-rng-a"><span class="ak-rng-th">${esc(x.tahun ?? "")}</span><b>${esc(x.kejadian || "Bantuan umum")}</b><span class="ak-rng-v">${esc(usdR(+x.usd || 0))}</span></div>
        <i class="ak-rng-b"><u data-st="width:${Math.max(2, (+x.usd || 0) / mx * 100).toFixed(1)}%"></u></i>
        <div class="ak-rng-p"><span>Pemberi</span><span class="ak-mp">${ikon(IK_GEDUNG, "currentColor")}${esc(x.badan_terdeteksi || namaFts(x.pemberi))}</span>${x.bentuk ? pilStatus(x.bentuk, BENTUK_W[x.bentuk] || "var(--ink2)") : ""}${x.status ? pilStatus(x.status, STATUS_FTS[x.status] || "var(--ink2)") : ""}${strs(x.sektor).slice(0, 2).map(t => `<span class="ak-mp">${esc(t)}</span>`).join("")}</div>
        ${strs(x.penerima).length ? `<div class="ak-rng-p"><span>Penerima</span>${strs(x.penerima).slice(0, 4).map(v => { const t = namaFts(v), y = lbArr.find(z => namaLb(z).includes(nrm(t))); return y ? `<button type="button" class="ak-mp" data-lb="${esc(y.id)}">${ikon(IK_GEDUNG, "currentColor")}${esc(t)}</button>` : `<span class="ak-mp">${ikon(IK_GEDUNG, "currentColor")}${esc(t)}</span>`; }).join("")}${strs(x.daerah_disebut).map(d => `<span class="ak-mp">${ikon(IKON_PIN, "currentColor")}${esc(d)}</span>`).join("")}${urlOk(x.sumber_url) ? `<a class="ak-rng-s" href="${esc(urlOk(x.sumber_url))}" ${LUAR}>FTS ↗</a>` : ""}</div>` : ""}
        ${strs(x.juga_untuk_negara).length ? `<small class="ak-lper">Satu aliran untuk ${angka(strs(x.juga_untuk_negara).length + 1)} negara; nilai penuh, bukan porsi Indonesia.</small>` : ""}</li>`).join("")}</ol>${r.length > 60 ? `<p class="ak-lkaki-s">Menampilkan 60 dari ${angka(r.length)} aliran.</p>` : ""}`; };
  document.addEventListener("click", e => { const b = e.target.closest("[data-aln]"); if (!b) return; const n = ngArr?.find(x => document.getElementById("akSJudul")?.textContent.includes(x.negara)); if (!n) return; b.closest(".ak-rng-urut").parentElement.innerHTML = aliranNg(dlist(n.aliran), b.dataset.aln); });
  function sheetNegara(n) {
    const kb = n.kedubes || {}, web = urlOk(kb.web), ids = new Set(strs(n.proyek_pendanaan_ids)), pr = pdArr.filter(x => ids.has(x.id));
    bukaSheet("negara", `<div class="ak-dkepala"><div class="ak-dk-atas"><div class="ak-nama"><h2 id="akSJudul">${esc(bendera(n.iso2))} ${esc(n.negara)}</h2><p><b>${esc(usdR(n.total_usd_kemanusiaan_id || 0))}</b> bantuan kemanusiaan ke Indonesia</p></div></div></div>`, () =>
      bagS("Badan bantuan", strs(n.badan).length ? `<div class="ak-pil">${strs(n.badan).map(b => { const y = lbArr.find(z => namaLb(z).includes(nrm(b))); return y ? `<button type="button" class="ak-pk" data-lb="${esc(y.id)}">${esc(b)}</button>` : `<span class="ak-prodi">${esc(b)}</span>`; }).join("")}</div>` : '<p class="ak-khampa">Belum ada data.</p>')
      + bagS("Bantuan per tahun", (() => { const t = {}; dlist(n.rincian).forEach(r => { if (r.tahun) t[r.tahun] = (t[r.tahun] || 0) + (+r.usd || 0); }); const th = Object.keys(t).sort(); if (!th.length) return ""; const mx = Math.max(...Object.values(t));
          return `<div class="ak-thn" role="list">${th.map(y => `<div class="ak-thn-k" role="listitem" tabindex="0" data-t="${esc(y)}" data-n="${esc(usdR(t[y]))}" title="${esc(y)}: ${esc(usdR(t[y]))}"><i data-st="height:${Math.max(3, t[y] / mx * 100).toFixed(1)}%"></i><small>${esc(String(y).slice(2))}</small><b>${esc(usdR(t[y]))}</b></div>`).join("")}</div><p class="ak-lkaki-s">Arahkan kursor ke batang untuk melihat nilainya. Sumber: FTS OCHA.</p>`; })())
      + (n.ringkas ? bagS("Siapa memberi, dalam bentuk apa, ke siapa", ringkasNg(n)) : "")
      + bagS(`Rincian aliran bantuan <small class="ak-hit">${angka(dlist(n.aliran).length || dlist(n.rincian).length)}</small>`, dlist(n.aliran).length ? aliranNg(dlist(n.aliran), "nilai") : dlist(n.rincian).length ? rincianNg(dlist(n.rincian), "nilai") : '<p class="ak-khampa">Belum ada rincian.</p>')
      + bagS("Proyek pendanaan", pr.length ? gridProyek(pr.map(dariDana)) : '<p class="ak-khampa">Belum ada proyek tertaut.</p>')
      + bagS("Kedutaan besar", web || kb.email || kb.telepon ? `<div class="ak-lkontak">${kb.telepon ? `<span class="ak-kt"><a class="ak-lnk" href="${esc(telHref(kb.telepon))}">${ikon(IK_TEL, "currentColor")}<em>Telepon</em>${esc(telF(kb.telepon))}</a></span>` : ""}${emailOk(kb.email) ? `<span class="ak-kt"><a class="ak-lnk" href="mailto:${esc(kb.email)}">${ikon(IKON_MAIL, "currentColor")}<em>Email</em>${esc(kb.email)}</a></span>` : ""}${web ? `<span class="ak-kt"><a class="ak-lnk" href="${esc(web)}" ${LUAR}>${ikon(IKON_WEB, "currentColor")}<em>Situs</em>${esc(urlHost(web))}</a></span>` : ""}</div>` : '<p class="ak-khampa">Belum ada kontak.</p>')
      + bagS("Sumber", `${sumberRapi(dlist(n.sumber).map(x => x?.url || x)) || "<p class=\"ak-khampa\">Tidak ada sumber tercatat.</p>"}`));
    $("akSheet").dataset.k = "";
  }
  async function gambarNegara() {
    $("akPdJ").innerHTML = ""; $("akPdH").innerHTML = ""; $("akPdL").innerHTML = hantuHtml; if (!ngArr) { const d = await ambilData("negara_donor"); ngArr = dlist(Array.isArray(d) ? d : d?.negara).filter(n => n && n.negara).sort((a, b) => (b.total_usd_kemanusiaan_id || 0) - (a.total_usd_kemanusiaan_id || 0)); }
    if (PD.sub !== "negara") return; const mx = Math.max(1, ...ngArr.map(n => n.total_usd_kemanusiaan_id || 0)), tot = ngArr.reduce((a, n) => a + (n.total_usd_kemanusiaan_id || 0), 0);
    $("akPdJ").innerHTML = `<b>${esc(usdR(tot))}</b> bantuan kemanusiaan dari ${angka(ngArr.length)} negara donor`;
    $("akPdL").innerHTML = ngArr.length ? `<div class="ak-bars">${ngArr.map((n, i) => { const v = n.total_usd_kemanusiaan_id || 0, pt = persenTxt(v, tot); return barHtml({cls: "ak-ngr", warna: "var(--data5)", lebar: v / mx * 100, nilai: esc(usdR(v)), persen: pt, label: `${i + 1}. ${esc(bendera(n.iso2))} ${esc(n.negara)}`,
      attr: `role="button" data-ng="${i}" data-tt="${esc(n.negara)}" data-tv="${esc(usdR(v))}" data-tk="${esc(angka(strs(n.badan).length) + " badan bantuan, klik untuk profil")}" data-tc="var(--data5)"`}); }).join("")}</div>` : kosongHtml("Negara donor");
  }
  const cocokPd = x => (!PD.sumberP || (x._sumber || "dir") === PD.sumberP) && dalam(PD.fs.jenis, [x.jenis]) && dalam(PD.fs.pemberi, [x.pemberi]) && dalam(PD.fs.sasaran, strs(x.sasaran)) && dalam(PD.fs.status, [x.status])
    && dalam(PD.fs.prov, strs(x.prov)) && dalam(PD.fs.kolab, [x.kolaborasi ? "ya" : "tidak"]) && dalam(PD.fs.peran, [x.meti_bisa]) && (!PD.q || x._cari.includes(PD.q.toLowerCase()));
  /* kartu Ringkasan mengikuti sub-tampilan, chip sektor, dan saringan; dibangun ulang tiap pilihan berubah */
  let rtok2 = 0;
  async function isiRingkasPd() { const t = ++rtok2, H = $("akPdRH"), S = $("akPdStack"); if (!H || !S) return;
    const sub = PD.sub, rp = v => `\u2248 ${rpRingkas(v * KURS_USD)}`;
    if (sub === "negara") { if (!ngArr) { const d = await ambilData("negara_donor"); ngArr = dlist(Array.isArray(d) ? d : d?.negara).filter(n => n && n.negara).sort((a, b) => (b.total_usd_kemanusiaan_id || 0) - (a.total_usd_kemanusiaan_id || 0)); }
      if (t !== rtok2) return; const tot = ngArr.reduce((a, n) => a + (n.total_usd_kemanusiaan_id || 0), 0), top = ngArr.slice(0, 8), mx = Math.max(1, top[0]?.total_usd_kemanusiaan_id || 0);
      H.innerHTML = `<b>${esc(usdR(tot))}</b> bantuan kemanusiaan dari ${angka(ngArr.length)} negara donor`;
      S.innerHTML = `<div class="ak-bars">${top.map(n => { const v = n.total_usd_kemanusiaan_id || 0; return barHtml({cls: "ak-ngr", warna: "var(--data5)", lebar: v / mx * 100, nilai: esc(usdR(v)), persen: persenTxt(v, tot), label: `${esc(bendera(n.iso2))} ${esc(n.negara)}`, attr: `data-tt="${esc(n.negara)}" data-tv="${esc(usdR(v))}" data-tk="${esc(angka(strs(n.badan).length) + " badan bantuan")}" data-tc="var(--data5)"`}); }).join("")}</div>`; return; }
    if (sub === "skema") { const sk = pdArr.filter(x => (x.jenis_entri || "skema") === "skema" && cocokPd(x)), per = new Map(), kj = PD.fs.jenis; PD.fs.jenis = new Set(); const skB = pdArr.filter(x => (x.jenis_entri || "skema") === "skema" && cocokPd(x)); PD.fs.jenis = kj;   /* batang tetap memuat semua jenis supaya bisa ditambah */
      skB.forEach(x => { const k = x.jenis || "lain"; per.set(k, (per.get(k) || 0) + 1); });
      const rows = [...per].sort((a, b) => b[1] - a[1]), mx = rows[0]?.[1] || 1;
      H.innerHTML = `<b>${angka(sk.length)}</b> skema pendanaan bisa dilamar`;
      S.innerHTML = rows.length ? `<div class="ak-bars">${rows.map(([k, c]) => barHtml({cls: "ak-brx", warna: JENIS_DANA[k] || "var(--ink2)", lebar: c / mx * 100, nilai: angka(c), persen: persenTxt(c, skB.length), label: esc(kapital(k)), attr: `data-bar="dn|jenis|${esc(k)}" data-tt="${esc(kapital(k))}" data-tv="${angka(c)} skema" data-tk="${esc([...new Set(skB.filter(x => (x.jenis || "lain") === k).map(x => x.pemberi).filter(Boolean))].slice(0, 3).join("; "))}" data-tc="${JENIS_DANA[k] || "var(--ink2)"}"`})).join("")}</div>` : `<p class="ak-khampa">Belum ada skema untuk saringan ini.</p>`; msTandai("dn"); return; }
    const pr = pdArr.filter(x => x.jenis_entri === "proyek" && cocokPd(x)), tot = pr.reduce((a, x) => a + (Number(x.nilai_usd) || 0), 0);
    H.innerHTML = `<b>${esc(usdR(tot))}</b> nilai ${angka(pr.length)} proyek pendanaan energi terbarukan`;
    S.innerHTML = tumpukPemberi(pr); }
  function gambarPd(gulir) {
    $("akPdSaring").hidden = PD.sub === "negara"; isiRingkasPd(); if (PD.sub === "negara") { gambarNegara(); return; }
    const skema = PD.sub === "skema";
    pdHasil = pdArr.filter(x => (x.jenis_entri || "skema") === (skema ? "skema" : "proyek") && (!PD.tingkat || tingkatSet(x).has(PD.tingkat)) && cocokPd(x));
    const n = pdHasil.length, a = (PD.hal - 1) * PDPER, tot = pdHasil.reduce((s, x) => s + (Number(x.nilai_usd) || 0), 0);
    $("akPdJ").innerHTML = `<b>${angka(n)}</b> ${skema ? "skema pendanaan" : "proyek pendanaan"}${!skema ? `, nilai <b>${esc(usdR(tot))}</b>` : ""}${msAda("dn") ? " " + msChips("dn") : ""}${PD.tingkat && !skema ? ` <button type="button" class="ak-mp ak-mp-b" data-pdclear="1" title="Hapus saringan tingkat penerima">${esc(TINGKAT.find(t => t[0] === PD.tingkat)?.[1] || "")} &times;</button>` : ""}`;
    $("akPdL").innerHTML = n ? (skema ? `<div class="ak-daftar ak-orggrid">${pdHasil.slice(a, a + PDPER).map(kartuSkemaP).join("")}</div>` : gridProyek(pdHasil.slice(a, a + PDPER).map(dariDana))) : hampa("entri");
    $("akPdH").innerHTML = navHal(PD.hal, n, PDPER, skema ? "skema" : "proyek");
    if (gulir) gulirKe("akPdJ");
  }
  /* tingkat penerima proyek: pusat, daerah, non-pemerintah, belum tercatat (tingkatPenerima di tingkat_penerima.js) */
  const TINGKAT = [["pusat", "Pemerintah pusat", "var(--data5)"], ["daerah", "Pemerintah daerah", "var(--data2)"], ["nonpem", "Non-pemerintah", "var(--meti-oranye)"], ["belum", "Belum tercatat", "var(--line-ctl)"]];
  const penerimaProy = x => { const dx = dariDana(x); const a = pelaksanaList(dx.pelaksana); return a.length ? a : []; };
  const tingkatDari = nm => tingkatPenerima(nm, lbArr.find(z => namaLb(z).includes(nrm(nm))));
  let reStk = null; const TS = new WeakMap();
  const tingkatSet = x => { let v = TS.get(x); if (!v) { const a = penerimaProy(x); v = new Set(a.length ? a.map(tingkatDari) : ["belum"]); TS.set(x, v); } return v; };
  function tumpukPemberi(pr) {
    const sel = pr.filter(x => Number(x.nilai_usd) > 0), per = new Map();
    sel.forEach(x => { const a = penerimaProy(x), t = a.length ? a.map(tingkatDari) : ["belum"], bagi = (Number(x.nilai_usd) || 0) / t.length, e = per.get(x.pemberi) || per.set(x.pemberi, {tot: 0, n: 0, seg: {}}).get(x.pemberi); e.tot += Number(x.nilai_usd) || 0; e.n++;
      new Set(t).forEach(k => { const c = e.seg[k] ||= {usd: 0, n: 0, p: []}; c.usd += bagi * t.filter(z => z === k).length; c.n++; c.p.push([x.nama, bagi * t.filter(z => z === k).length]); }); });
    const rows = [...per].sort((a, b) => b[1].tot - a[1].tot).slice(0, 10), mx = rows[0]?.[1].tot || 1, tot = {};
    sel.forEach(x => { const a = penerimaProy(x), t = a.length ? a.map(tingkatDari) : ["belum"]; t.forEach(k => { const c = tot[k] ||= {usd: 0, n: new Set()}; c.usd += (Number(x.nilai_usd) || 0) / t.length; c.n.add(x.id || x.nama); }); });
    const sum = TINGKAT.filter(([k]) => tot[k]).map(([k, l]) => `${l.replace("Pemerintah ", "").toLowerCase()} ${usdR(tot[k].usd)} (${angka(tot[k].n.size)})`);
    const rp = v => `\u2248 ${rpRingkas(v * KURS_USD)}`;
    const baris = rows.map(([nm, e]) => { const lid = pdArr.find(x => x.pemberi === nm && x.lembaga_id)?.lembaga_id, ys = lbArr.filter(z => namaLb(z).includes(nrm(nm)) || nrm(nm).includes(nrm(z.singkatan || "@@"))), y = lbMap.get(lid) || ys.find(z => urlOk(z.logo)) || ys[0], lo = logoOrg(nm, y?.id).filter(u => urlOk(u)), lg = lo.length ? lgoIkon(lo, IK_GEDUNG, "var(--data1)") : y && urlOk(y.logo) ? logoLb(y) : (() => { const g = GRAFNOW && Object.entries(GRAFNOW.simpul).find(([id, v]) => id[0] === "L" && v.logo && urlOkLogo(v.logo) && nrm(v.n || "").includes(nrm(nm))); return g ? lgoIkon([g[1].logo], IK_GEDUNG, "var(--data1)") : y ? logoLb(y) : logoDonor(nm, null); })();
      const segs = TINGKAT.filter(([k]) => e.seg[k]).map(([k, l, w]) => { const c = e.seg[k], top = c.p.sort((a, b) => b[1] - a[1]).slice(0, 3).map(q => potong(q[0], 48)).join("; ");
        return `<button type="button" class="ak-stk-s" data-stk="${esc(nm)}|${k}" data-st="width:${(c.usd / mx * 100).toFixed(2)}%;background:${w}" data-tt="${esc(l)}, ${esc(nm)}" data-tv="${angka(c.n)} proyek, ${esc(usdR(c.usd))} (${esc(rp(c.usd))}), ${Math.round(c.usd / e.tot * 100)}% dari pemberi" data-tk="${esc(top)}" data-tc="${w}" aria-label="${esc(l)}: ${angka(c.n)} proyek, ${esc(usdR(c.usd))}"></button>`; }).join("");
      return `<div class="ak-stk-r"><div class="ak-stk-n">${lg}<b title="${esc(nm)}">${esc(judulCase(nm))}</b></div><div class="ak-stk-b">${segs}</div><div class="ak-stk-v"><b>${esc(usdR(e.tot))}</b><small>${esc(rp(e.tot))}</small><small>${angka(e.n)} proyek</small></div></div>`; }).join("");
    const jn = [...new Set(pdArr.filter(x => x.jenis_entri === "proyek").map(x => x.jenis).filter(Boolean))], js = PD.fs.jenis;
    if (!sel.length) return `<p class="ak-khampa">Belum ada proyek bernilai untuk saringan ini.</p>`;
    return `<div class="ak-seg ak-stk-jn" role="group" aria-label="Jenis dana"><button type="button" data-stkj="" aria-pressed="${!js.size}">${ikon(IK_SEMUA, "currentColor")}Semua</button>${jn.map(j => `<button type="button" data-stkj="${esc(j)}" aria-pressed="${js.has(j)}">${ikon(IK_DANA[j] || IK_UANG, "currentColor")}${esc(kapital(j))}</button>`).join("")}</div>
      <div class="ak-stk-leg">${TINGKAT.map(([k, l, w]) => `<span><i data-st="background:${w}"></i>${l}</span>`).join("")}</div><div class="ak-stk">${baris}</div>`; }
  async function bangunDana(p, d) {
    if (!lbArr.length) { const l = await ambilData("lembaga"); if (l) indeksLb(l); }
    pdArr = dlist(Array.isArray(d) ? d : d?.pendanaan).filter(x => x && x.nama).map(x => Object.assign(x, {pemberi: donorBaku(x.pemberi), _sumber: "dir", _cari: [x.nama, x.pemberi, x.penerima, ...strs(x.pelaksana), ...strs(x.sasaran)].filter(Boolean).join(" ").toLowerCase()}));
    /* proyek mitra (laporan donor IATI, lembaga_3w) digabung ke daftar proyek; proyek yang sama dengan entri direktori (judul + pemberi mirip) tidak digandakan */
    try { const w3 = await ambilData("proyek_mitra"), kunci = x => nrm(String(x.nama || x.judul || "")).slice(0, 40) + "|" + nrm(String(donorBaku(x.pemberi || x.donor) || "")).split(" ")[0], ada = new Set(pdArr.filter(x => x.jenis_entri === "proyek").map(kunci));
      dlist(Array.isArray(w3) ? w3 : w3?.proyek).filter(q => q && q.judul && !ada.has(kunci(q))).forEach(q => { const x = {id: q.id, nama: q.judul, pemberi: donorBaku(q.donor), pelaksana: q.pelaksana, penerima: q.pelaksana, prov: q.prov, sektor: q.sektor, nilai_usd: q.nilai_usd, nilai: q.nilai_asli, mata_uang: q.mata_uang_asli, tahun: q.mulai, selesai: q.selesai, status: q.status, url: q.sumber_url, jenis_entri: "proyek", jenis: "", _sumber: "iati", ringkasan_id: q.ringkasan_id, judul_en: q.judul_en, nilai_salur_usd: q.nilai_salur_usd}; x._cari = [x.nama, x.pemberi, ...strs(x.pelaksana), ...strs(x.sektor)].filter(Boolean).join(" ").toLowerCase(); pdArr.push(x); }); } catch (e) {}
    let labPm = null; ngArr = null; Object.assign(PD, {sumberP: "", tingkat: "", fs: {jenis: new Set(), pemberi: new Set(), sasaran: new Set(), status: new Set(), prov: new Set(), kolab: new Set(), peran: new Set()}, q: "", hal: 1}); aplikasiPre("dn", PD.fs); MSG.dn = {st: PD.fs, f: ["jenis", "pemberi", "sasaran", "status", "prov", "kolab", "peran"], h: () => { PD.hal = 1; }, g: () => { sinkKb(); gambarPd(false); }, lab: (f, v) => f === "prov" ? provT(v) : f === "kolab" ? "Riset bersama internasional" : kapital(String(v))};
    const sinkKb = () => { const b = $("akPdKb"); if (!b) return; b.querySelector("[data-kb=\"\"]").setAttribute("aria-pressed", String(!PD.fs.kolab.size)); b.querySelector("[data-kb=ya]").setAttribute("aria-pressed", String(PD.fs.kolab.has("ya"))); };
    const pr = pdArr.filter(x => x.jenis_entri === "proyek"), hit = f => { const n = {}; pdArr.forEach(x => { for (const k of [].concat(f(x))) if (k) n[k] = (n[k] || 0) + 1; }); return n; };
    const jum = f => { const n = {}; pr.forEach(x => { const k = f(x); if (k) n[k] = (n[k] || 0) + (Number(x.nilai_usd) || 0); }); return n; };
    const bar = (n, warna, field) => batang(Object.entries(n).filter(r => r[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 10), {tab: "dn", field, warna, lab: kapital, fmt: usdR});
    const totP = pr.reduce((s, x) => s + (Number(x.nilai_usd) || 0), 0);
    p.innerHTML = `${segHtml("akPdS", "Sub-tampilan pendanaan", [["skema", "Skema", IK_UANG], ["proyek", "Proyek", IK_BAR], ["negara", "Negara donor", IK_GEDUNG]])}
      <section class="ak-panel ak-lA"><div class="ak-pil"><span class="ak-r utama" data-st="--w0:var(--ok)">Ringkasan</span></div><h2 class="ak-judulv" id="akPdRH"></h2>
        <div id="akPdStack"></div>
        <p class="ak-lkaki">Sumber: direktori pendanaan, tiap entri bertaut ke sumbernya. Proyek dengan banyak penerima dibagi rata nilainya ke penerimanya. Rupiah dengan kurs Rp ${angka(KURS_USD)} per US$ (${KURS_TGL}).</p></section>
      <div class="ak-saring" id="akPdSaring"><div class="ak-alat">${cariKotak("akPdQ", "Cari nama, pemberi, atau penerima")}</div>${segHtml("akPdSrc", "Sumber proyek", [["", "Semua sumber", IK_SEMUA], ["dir", "Direktori pendanaan", IK_UANG], ["iati", "Laporan donor IATI", IK_DB]])}
        <div class="ak-seg" id="akPdKb" role="group" aria-label="Riset bersama internasional" hidden><button type="button" data-kb="" aria-pressed="true">${ikon(IK_SEMUA, "currentColor")}Semua</button><button type="button" data-kb="ya" aria-pressed="false">${ikon(IK_ORANG, "currentColor")}Riset bersama internasional</button></div>
        <div class="ak-baris ak-baris5">${htmlPilih("akPdJn", IK_UANG, "Cari jenis")}${htmlPilih("akPdPm", IK_GEDUNG, "Cari pemberi")}${htmlPilih("akPdSs", IK_GEDUNG, "Cari sasaran")}${htmlPilih("akPdSt", IK_BAR, "Cari status")}${htmlPilih("akPdPv", IKON_PIN, "Cari provinsi")}${htmlPilih("akPdPb", IK_ORANG, "Cari peran METI")}</div></div>
      <div class="ak-hasil"><h2 class="ak-judulv" id="akPdJ"></h2><div id="akPdL"></div><nav id="akPdH" class="ak-hal" aria-label="Halaman daftar pendanaan" aria-live="polite"></nav></div>`;
    const isiStk = () => { isiRingkasPd(); };
    reStk = isiStk;
    $("akPdJ").addEventListener("click", e => { if (e.target.closest("[data-pdclear]")) { PD.tingkat = ""; PD.hal = 1; nanti(() => gambarPd(false)); } });
    $("akPdStack").addEventListener("click", e => { const j = e.target.closest("[data-stkj]"); if (j) { e.stopPropagation(); msUbah("dn", "jenis", j.dataset.stkj); return; }
      const sg = e.target.closest("[data-stk]"); if (!sg) return; const [nm, k] = sg.dataset.stk.split("|"); PD.sub = "proyek"; PD.fs.pemberi = new Set([nm]); PD.tingkat = k; PD.hal = 1; setSeg("akPdS", "proyek"); labPm?.(); nanti(() => { gambarPd(false); $("akPdSaring").scrollIntoView({block: "start", behavior: "smooth"}); }); });
    const jalan = () => { const t = ++pdtok; nanti(() => { if (t === pdtok) gambarPd(false); }); }, ubah = (k, v) => { PD[k] = v; PD.hal = 1; jalan(); }, op = (field, f, lab) => () => { const keep = PD.fs[field], skema = PD.sub === "skema"; PD.fs[field] = new Set(); const n = {}; try { pdArr.filter(x => (x.jenis_entri || "skema") === (skema ? "skema" : "proyek") && (!PD.tingkat || tingkatSet(x).has(PD.tingkat)) && cocokPd(x)).forEach(x => { for (const k of [].concat(f(x))) if (k) n[k] = (n[k] || 0) + 1; }); } finally { PD.fs[field] = keep; } return Object.entries(n).sort((a, b) => b[1] - a[1]).map(([v, c]) => [v, lab(v), c]); };
    msPilih("akPdJn", "dn", "jenis", {ik: v => IK_DANA[v] ? [IK_DANA[v], JENIS_DANA[v]] : null, semua: "Semua jenis", opsi: op("jenis", x => x.jenis, kapital)}); labPm = msPilih("akPdPm", "dn", "pemberi", {semua: "Semua pemberi", opsi: op("pemberi", x => x.pemberi, v => v), pilih: v => { PD.tingkat = ""; msUbah("dn", "pemberi", v); }});
    msPilih("akPdSs", "dn", "sasaran", {semua: "Semua sasaran", opsi: op("sasaran", x => strs(x.sasaran), kapital)}); msPilih("akPdSt", "dn", "status", {semua: "Semua status", opsi: op("status", x => x.status, kapital)});
    msPilih("akPdPv", "dn", "prov", {semua: "Semua provinsi", opsi: op("prov", x => strs(x.prov), provT)}); msPilih("akPdPb", "dn", "peran", {semua: "Semua peran METI", opsi: op("peran", x => x.meti_bisa, v => (PERAN_B[v] || [kapital(v)])[0])});
    $("akPdKb").addEventListener("click", e => { const b = e.target.closest("[data-kb]"); if (!b) return; if (b.dataset.kb === "") { PD.fs.kolab = new Set(); PD.hal = 1; sinkKb(); jalan(); } else msUbah("dn", "kolab", "ya"); });
    const tampilKb = () => { const sk = PD.sub === "skema"; if (!sk && (PD.fs.kolab.size || PD.fs.peran.size)) { PD.fs.kolab = new Set(); PD.fs.peran = new Set(); sinkKb(); msTandai("dn"); } $("akPdKb").hidden = !(sk && pdArr.some(x => x.kolaborasi)); $("akPdPb").hidden = !(sk && pdArr.some(x => x.meti_bisa)); }; tampilKb();
    $("akPdS").addEventListener("click", e => { const b = e.target.closest("button[data-v]"); if (!b) return; PD.sub = b.dataset.v; PD.hal = 1; setSeg("akPdS", PD.sub); $("akPdSrc").hidden = PD.sub !== "proyek"; tampilKb(); jalan(); });
    $("akPdSrc").hidden = PD.sub !== "proyek"; setSeg("akPdSrc", PD.sumberP); $("akPdSrc").addEventListener("click", e => { const b = e.target.closest("button[data-v]"); if (!b) return; PD.sumberP = b.dataset.v; PD.hal = 1; setSeg("akPdSrc", PD.sumberP); jalan(); });
    let tt = 0; $("akPdQ").addEventListener("input", e => { clearTimeout(tt); tt = setTimeout(() => ubah("q", e.target.value.trim()), 250); }); pasangHal("akPdH", h => { PD.hal = h; gambarPd(true); });
    const tip = $("akTip"); p.addEventListener("pointermove", e => { const t = e.target.closest("[data-tt]"); if (!t) { tip.hidden = true; return; }
      tip.innerHTML = `<b>${esc(t.dataset.tt)}</b><span><i data-st="background:${esc(t.dataset.tc)}"></i>${esc(t.dataset.tv)}</span><small>${esc(t.dataset.tk)}</small>`; tip.hidden = false; tip.style.left = Math.min(e.clientX + 12, innerWidth - tip.offsetWidth - 8) + "px"; tip.style.top = Math.max(8, e.clientY - tip.offsetHeight - 12) + "px"; });
    p.addEventListener("pointerleave", () => { tip.hidden = true; });
    const bukaN = e => { const c = e.target.closest("[data-ng]"); if (c && ngArr?.[+c.dataset.ng]) sheetNegara(ngArr[+c.dataset.ng]); }; $("akPdL").addEventListener("click", bukaN); $("akPdL").addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-ng]")) { e.preventDefault(); bukaN(e); } });
    setSeg("akPdS", PD.sub); gambarPd(false);
  }

  const bukuOrang = (jenis, id, d) => { const a = dlist(Array.isArray(d) ? d : d?.buku).filter(b => dlist(b.penulis).some(p => p[jenis + "_id"] === id)); return a.length ? bagB(`Buku ${angka(a.length)}`, `<ul class="ak-lsumber">${a.slice(0, 8).map(b => `<li>${urlOk(b.url) ? tautanLuar(urlOk(b.url), esc(b.judul)) : esc(b.judul)} <small class="ak-lper">${esc([b.penerbit, b.tahun].filter(Boolean).join(", "))}</small></li>`).join("")}</ul>`) : ""; };
  /* ---- buku: sub-tampilan di tab Pustaka ---- */
  const BK = {jenis: "", akses: "", tahun: "", penerbit: "", q: "", hal: 1}, BKPER = 18;
  let bkArr = [], bkHasil = [], bktok = 0;
  const ringkasBk = b => { const t = bersihWiki(b.ringkas || ""); return t && !/^karya jenis\b.*dicatat dari katalog/i.test(t) && !/^karya jenis\b/i.test(t) ? t : ""; };
  const smpBk = b => { const r = strs(b.sektor)[0], [rl, rd, rw] = SEKTOR[r] || ["", "", "var(--data1)"], u = urlOk(b.sampul_url) || (() => { const f = String(b.sampul_lokal || "").split("/").pop(); return /^[a-f0-9]{16,64}\.(png|jpe?g|webp)$/.test(f) ? "/api/direktori/gambar/" + f : ""; })();
    return `<span class="ak-bsmp" data-st="--w0:${rw}">${rd ? ikon(rd, "currentColor").replace('class="ak-ikon"', 'class="ak-ikon ak-bsmp-ik"') : ""}<b>${esc(b.judul)}</b><small>${esc(b.penerbit || "")}</small>${u ? `<img class="ak-bsmp-img" src="${esc(u)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ""}</span>`; };
  const penulisBk = (b, semua) => { const pn = dlist(b.penulis), tampil = semua ? pn : pn.slice(0, 1), tt = p => p.pakar_id && peta.has(p.pakar_id) ? `<button type="button" class="ak-pk" data-pk="${esc(p.pakar_id)}">${esc(p.nama)}</button>` : p.tokoh_id ? `<button type="button" class="ak-pk" data-tkid="${esc(p.tokoh_id)}">${esc(p.nama)}</button>` : esc(p.nama);
    return tampil.map(tt).join(", ") + (!semua && pn.length > 1 ? ` <button type="button" class="ak-pk" data-bk="${b._i}">dkk.</button>` : ""); };
  const kartuBk = b => `<article class="ak-bk3" role="button" tabindex="0" data-bk="${b._i}" aria-label="Buka ${esc(b.judul)}"><button type="button" class="ak-bk3-smp" data-bk="${b._i}" aria-label="Rincian ${esc(b.judul)}">${smpBk(b)}</button>
      <h4><button type="button" data-bk="${b._i}">${esc(b.judul)}</button></h4>
      <p class="ak-bk3-pn">${penulisBk(b)}</p>
      <small class="ak-lper">${esc([b.penerbit, b.tahun].filter(Boolean).join(", "))}</small>
      <div class="ak-pil">${b.jenis ? `<span class="ak-prodi">${esc(kapital(b.jenis))}</span>` : ""}${b.akses ? `<span class="ak-izin ${/terbuka/i.test(b.akses) ? "berlaku" : "contoh"}">${esc(kapital(b.akses))}</span>` : ""}${strs(b.sektor).slice(0, 1).map(r => pilSektor(r)).join("")}</div></article>`;
  function sheetBk(b) {
    const u = urlOk(b.url) || dlist(b.sumber).map(x => urlOk(x?.url || x)).find(Boolean), rg = ringkasBk(b), src = dlist(b.sumber).map(x => urlOk(x?.url || x)).filter(Boolean);
    bukaSheet("detail", `<div class="ak-dkepala"><div class="ak-dk-atas"><span class="ak-bk3-smp ak-bk3-besar">${smpBk(b)}</span><div class="ak-nama"><h2 id="akSJudul">${esc(b.judul)}</h2>${b.subjudul ? `<p>${esc(b.subjudul)}</p>` : ""}<p>${esc([b.penerbit, b.tahun].filter(Boolean).join(", "))}</p></div></div>
      <div class="ak-pil">${b.jenis ? `<span class="ak-prodi">${esc(kapital(b.jenis))}</span>` : ""}${b.akses ? `<span class="ak-prodi">${esc(kapital(b.akses))}</span>` : ""}${strs(b.sektor).map(r => pilSektor(r)).join("")}</div>
      ${u ? `<div class="ak-pil"><a class="ak-rbtn ak-rbtn-utama" href="${esc(u)}" ${LUAR}>${ikon(IK_LUAR, "currentColor")}Buka buku</a></div>` : ""}</div>`,
      () => (rg ? `<div class="ak-disi"><p class="ak-rata">${esc(rg)}</p></div>` : "") + `<div class="ak-disi"><dl class="ak-lbr"><div><dt>Penulis</dt><dd>${penulisBk(b, true) || "-"}</dd></div>${b.penerbit ? `<div><dt>Penerbit</dt><dd class="ak-dd-lg">${lgoIkon(logoOrg(b.penerbit, null), IK_GEDUNG, "var(--ink2)", 1)}${esc(b.penerbit)}</dd></div>` : ""}${b.tahun ? `<div><dt>Tahun</dt><dd>${esc(b.tahun)}</dd></div>` : ""}${strs(b.isbn).length ? `<div><dt>ISBN</dt><dd>${esc(strs(b.isbn).join(", "))}</dd></div>` : ""}</dl></div>` + (src.length ? bagB("Sumber", sumberRapi(src)) : ""));
    $("akSheet").dataset.k = ""; }
  function gambarBk(gulir) {
    bkHasil = bkArr.filter(b => dalam(BK.fs.sektor, strs(b.sektor)) && dalam(BK.fs.jenis, [b.jenis]) && dalam(BK.fs.akses, [b.akses]) && dalam(BK.fs.tahun, [String(b.tahun)]) && dalam(BK.fs.penerbit, [b.penerbit]) && (!GL.r || cocokGL(strs(b.sektor))) && (!BK.q || b._cari.includes(BK.q.toLowerCase())));
    const n = bkHasil.length, a = (BK.hal - 1) * BKPER;
    $("akBkJ").innerHTML = `<b>${angka(n)}</b> buku${glT()}${msAda("bk") ? " " + msChips("bk") : ""}`; msTandai("bk"); $("akBkL").innerHTML = n ? `<div class="ak-psgrid ak-bkgrid">${bkHasil.slice(a, a + BKPER).map(kartuBk).join("")}</div>` : hampa("buku"); $("akBkH").innerHTML = navHal(BK.hal, n, BKPER, "buku");
    if (gulir) gulirKe("akBkJ");
  }
  async function bangunBuku(el) {
    el.innerHTML = hantuHtml; const d = await ambilData("buku"); bkArr = dlist(Array.isArray(d) ? d : d?.buku).filter(b => b && b.judul).map((b, i) => Object.assign(b, {_i: i, _cari: [b.judul, b.subjudul, b.penerbit, ...dlist(b.penulis).map(p => p.nama), ...strs(b.isbn)].filter(Boolean).join(" ").toLowerCase()}));
    if (!bkArr.length) { el.innerHTML = kosongHtml("Buku"); return; }
    Object.assign(BK, {fs: {sektor: new Set(), jenis: new Set(), akses: new Set(), tahun: new Set(), penerbit: new Set()}, q: "", hal: 1}); aplikasiPre("bk", BK.fs); MSG.bk = {st: BK.fs, f: ["sektor", "jenis", "akses", "tahun", "penerbit"], h: () => { BK.hal = 1; }, g: () => gambarBk(false), lab: (f, v) => f === "sektor" ? (SEKTOR[v] || [v])[0] : kapital(String(v))};
    const hit = f => { const n = {}; bkArr.forEach(b => { for (const k of [].concat(f(b))) if (k) n[k] = (n[k] || 0) + 1; }); return n; }, nR = hit(b => strs(b.sektor)), nPn = {}; bkArr.forEach(b => dlist(b.penulis).forEach(p => { const k = p.nama; if (k) { (nPn[k] ||= {n: 0, p}).n++; } }));
    const top = Object.values(nPn).sort((a, b) => b.n - a.n).slice(0, 8), mx = Math.max(1, ...Object.values(nR));
    el.innerHTML = `<section class="ak-panel ak-lA"><div class="ak-pil"><span class="ak-r utama" data-st="--w0:var(--warn)">Ringkasan</span></div><h2 class="ak-judulv"><b>${angka(bkArr.length)}</b> buku energi terbarukan dari ${angka(Object.keys(nPn).length)} penulis</h2>
      <div class="ak-komp"><div><h3 class="ak-lh">Per sektor</h3>${batang(Object.entries(nR).sort((a, b) => b[1] - a[1]), {tab: "bk", field: "sektor", warna: r => (SEKTOR[r] || [])[2], lab: r => namaSektor(r), tot: bkArr.length, sat: "buku"})}</div>
      <div><h3 class="ak-lh">Penulis paling produktif</h3><div class="ak-pil">${top.map(t => { const pid = t.p.pakar_id && peta.has(t.p.pakar_id) ? t.p.pakar_id : "", tk = !pid && t.p.tokoh_id ? tkArr.find(y => y.id === t.p.tokoh_id) : null, o = pid ? peta.get(pid) : null, l = !pid && !t.p.tokoh_id ? lbArr.find(y => namaLb(y).includes(nrm(t.p.nama))) : null;
        const lg = (o ? [o[9] || FOTO_PAKAR.get(o[0]), logoK[o[2]]] : tk ? [tk.foto_url || tk.foto] : logoOrg(t.p.nama, l?.id)).filter(u => urlOk(u)), g = lg[0] ? `<img src="${esc(urlOk(lg[0]))}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ikon(pid || t.p.tokoh_id ? IK_ORANG : IK_GEDUNG, "currentColor"), isi = `${g}<span>${esc(t.p.nama)}</span><em>${angka(t.n)}</em>`;
        return pid ? `<button type="button" class="ak-pnl" data-pk="${esc(pid)}">${isi}</button>` : t.p.tokoh_id ? `<button type="button" class="ak-pnl" data-tkid="${esc(t.p.tokoh_id)}">${isi}</button>` : l ? `<button type="button" class="ak-pnl" data-lb="${esc(l.id)}">${isi}</button>` : `<span class="ak-pnl">${isi}</span>`; }).join("")}</div></div></div>
      <p class="ak-lkaki">Sumber: direktori buku; tiap butir bertaut ke sumbernya.</p></section>
      <div class="ak-saring"><div class="ak-alat">${cariKotak("akBkQ", "Cari judul, penulis, penerbit, atau ISBN")}</div><div class="ak-baris ak-baris3">${htmlPilih("akBkJn", IKL.jenis, "Cari jenis")}${htmlPilih("akBkAk", IKON_WEB, "Cari akses")}${htmlPilih("akBkTh", IKL.tahun, "Cari tahun")}</div><div class="ak-baris">${htmlPilih("akBkPb", IK_GEDUNG, "Cari penerbit")}</div></div>
      <div class="ak-hasil"><h2 class="ak-judulv" id="akBkJ"></h2><div id="akBkL"></div><nav id="akBkH" class="ak-hal" aria-label="Halaman daftar buku" aria-live="polite"></nav></div>`;
    const jalan = () => { const t = ++bktok; nanti(() => { if (t === bktok) gambarBk(false); }); }, ubah = (k, v) => { BK[k] = v; BK.hal = 1; jalan(); }, op = (f, lab) => () => Object.entries(hit(f)).sort((a, b) => b[1] - a[1]).map(([v, c]) => [v, lab(v), c]);
    msPilih("akBkJn", "bk", "jenis", {semua: "Semua jenis", opsi: op(b => b.jenis, kapital)}); msPilih("akBkAk", "bk", "akses", {semua: "Semua akses", opsi: op(b => b.akses, kapital)});
    msPilih("akBkTh", "bk", "tahun", {semua: "Semua tahun", opsi: op(b => b.tahun, v => v)}); msPilih("akBkPb", "bk", "penerbit", {lg: v => logoOrg(v, null), semua: "Semua penerbit", opsi: op(b => b.penerbit, v => v)});
    let tt = 0; $("akBkQ").addEventListener("input", e => { clearTimeout(tt); tt = setTimeout(() => ubah("q", e.target.value.trim()), 250); }); pasangHal("akBkH", h => { BK.hal = h; gambarBk(true); });
    const tip = $("akTip"); el.addEventListener("pointermove", e => { const t = e.target.closest("[data-tt]"); if (!t) { tip.hidden = true; return; } tip.innerHTML = `<b>${esc(t.dataset.tt)}</b><span><i data-st="background:${esc(t.dataset.tc)}"></i>${esc(t.dataset.tv)}</span><small>${esc(t.dataset.tk)}</small>`; tip.hidden = false; tip.style.left = Math.min(e.clientX + 12, innerWidth - tip.offsetWidth - 8) + "px"; tip.style.top = Math.max(8, e.clientY - tip.offsetHeight - 12) + "px"; });
    el.addEventListener("pointerleave", () => { tip.hidden = true; }); el.addEventListener("click", e => { if (e.target.closest("a,[data-pk],[data-lb],[data-tkid]")) return; const t = e.target.closest("[data-bk]"); if (t && bkArr[+t.dataset.bk]) sheetBk(bkArr[+t.dataset.bk]); }); gambarBk(false);
  }

  /* ---- bentuk kartu menurut sifat: organisasi, produk, layanan, peluang; baris untuk dokumen. Tiap kartu menerangkan APA itu. ---- */
  const IK_DB = '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>';
  const IKJENIS = {sensor: '<circle cx="12" cy="12" r="2.2"/><path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9M4.6 4.6a10.5 10.5 0 0 0 0 14.8M19.4 4.6a10.5 10.5 0 0 1 0 14.8"/>', ews: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0"/>', aplikasi: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    model: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9.5 3v4M14.5 3v4M9.5 17v4M14.5 17v4M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4"/>', drone: '<circle cx="5.5" cy="6" r="2.5"/><circle cx="18.5" cy="6" r="2.5"/><circle cx="5.5" cy="18" r="2.5"/><circle cx="18.5" cy="18" r="2.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/>', satelit: '<rect x="9" y="9" width="6" height="6" rx="1"/><path d="M3 9l4 4M17 11l4 4M7 3l4 4M13 17l4 4"/>',
    material: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12 4 7.5"/>', alat: '<path d="M14.5 6a4 4 0 0 0-5 5L3 17.5 6.5 21l6.5-6.5a4 4 0 0 0 5-5l-3 3-2.5-.5-.5-2.5z"/>', sistem: IK_DB, lain: KAT.inovasi[1]};
  const ikJenis = j => { j = String(j || "").toLowerCase(); return IKJENIS[/sensor/.test(j) ? "sensor" : /ews|sirene|peringatan/.test(j) ? "ews" : /aplikasi|app/.test(j) ? "aplikasi" : /model|ai\b/.test(j) ? "model" : /drone/.test(j) ? "drone" : /satelit/.test(j) ? "satelit" : /material/.test(j) ? "material" : /alat/.test(j) ? "alat" : /sistem|informasi/.test(j) ? "sistem" : "lain"]; };
  /* ----- temuan riset per empat pilar (prediksi, penanganan, teknologi, dampak) dari pembacaan mendalam abstrak karya pakar ----- */
  const PILAR = [["prediksi", "Prediksi", IK_BAR, "var(--data5)"], ["penanganan", "Penanganan", IK_ORANG, "var(--ok)"], ["teknologi", "Teknologi dan inovasi", '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/>', "var(--line-ctl)"], ["dampak", "Dampak", IK_GEDUNG, "var(--bad)"]];
  function pilarRiset(ids, T, judul) {
    const m = T._m ||= new Map(dlist(T.temuan).map(x => [x.id, x])), a = [...new Set(dlist(ids))].map(i => m.get(i)).filter(Boolean)
      .sort((x, y) => ({tinggi: 0, sedang: 1, rendah: 2}[x.kualitas] ?? 3) - ({tinggi: 0, sedang: 1, rendah: 2}[y.kualitas] ?? 3) || (y.tahun || 0) - (x.tahun || 0));
    if (!a.length) return "";
    const blok = ([k, l, ik, w]) => { const b = a.filter(x => x.pilar.includes(k)).slice(0, 4); if (!b.length) return "";
      return `<div class="ak-pilar"><h4 data-st="--w0:${w}">${ikon(ik, w)}${esc(l)} <small class="ak-hit">${angka(a.filter(x => x.pilar.includes(k)).length)}</small></h4><ul class="ak-lsumber">${b.map(x => {
        const ang = k === "prediksi" || k === "dampak" ? dlist(x.angka).filter(n => k === "prediksi" ? n.jenis !== "statistik" : n.jenis === "statistik").slice(0, 2) : [];
        const pk = dlist(x.pakar).map(i => peta.get(i)).filter(Boolean).slice(0, 2);
        return `<li>${esc(k === "teknologi" && x.teknologi ? x.teknologi : k === "penanganan" && x.rekomendasi ? x.rekomendasi : x.temuan)}${ang.length ? `<br><span class="ak-pil">${ang.map(n => pilMini(ik, `${n.besaran}: ${n.nilai}${n.satuan ? " " + n.satuan : ""}`, w)).join("")}</span>` : ""}<br><small class="ak-lper">${urlOk(x.doi) ? tautanLuar(urlOk(x.doi), esc(x.judul)) : esc(x.judul)}${x.tahun ? `, ${esc(x.tahun)}` : ""}${pk.length ? ", " + pk.map(o => `<button type="button" class="ak-rk-b" data-pk="${esc(o[0])}">${esc(o[1])}</button>`).join(", ") : ""}</small></li>`; }).join("")}</ul></div>`; };
    return `<section class="ak-dbagian"><div class="ak-disi"><h3>${esc(judul)} <small class="ak-hit">${angka(a.length)}</small></h3><div class="ak-pilar-g">${PILAR.map(blok).join("")}</div><small class="ak-lper">Ringkasan ditulis ulang dari abstrak karya pakar direktori (OpenAlex); angka hanya yang disebut penulis dan belum diuji di sistem ini; klik judul untuk membaca karyanya</small></div></section>`;
  }
  const lgoIkon = (logo, path, warna, kecil) => { const a = [].concat(logo).filter(u => urlOkLogo(u)); return `<span class="ak-lgo${kecil ? " kecil" : ""}" data-st="--w0:${esc(warna)}">${ikon(path, warna)}${a.length ? `<img src="${esc(urlOk(a[0]))}" alt="" loading="lazy" referrerpolicy="no-referrer" data-next="${esc(a.slice(1).join("|"))}">` : ""}</span>`; };
  const ket = (t, n) => (t = bersihWiki(t)) ? `<p class="ak-ket"${n ? ` data-st="--n:${n}"` : ""}>${esc(t)}</p>` : "";
  /* uraian generik "<nama> adalah ..." yang hanya mengulang nama dan kategori tidak ditampilkan; yang bermakna tetap */
  const generikLb = (x, t) => { t = typeof t === "string" ? t : ""; const n = String(x.nama || "").trim(); return !t || (t.startsWith(n) && / adalah /i.test(t)) || /^\s*$/.test(t); };
  const ringkasLb = x => { try { if (!x.ringkasan && !x.uraian) return ""; const t = penjelasanLb(x); return typeof t === "string" && !generikLb(x, t) ? t : ""; } catch (e) { return ""; } };
  function penjelasanLb(x) {
    const tt = x.ringkasan || x.uraian; if (tt) return tt;
    const lok = kabProv(x), bid = strs(x.bidang).slice(0, 4).join(", ");
    return `${x.nama} adalah ${(KAT[x.kategori] || [x.kategori])[0].toLowerCase()}${lok ? " yang berkedudukan di " + lok : ""}${bid ? ", bergerak di bidang " + bid : ""}.`;   // teks tertanam = utang i18n
  }
  function kartuLb(x, i) {
    const [kl, ik, w] = KAT[x.kategori] || [x.kategori, KAT.riset[1], "var(--ink2)"], lok = kabProv(x), tel = strs(x.telepon)[0], wa = strs(x.wa)[0], em = strs(x.email).filter(emailOk)[0], web = urlOk(x.web), pt = urlPeta(x) && (x.alamat || Number.isFinite(x.lat)) ? urlPeta(x) : "";
    const q = (href, ikp, lab, ext) => `<a class="ak-qk" href="${esc(href)}"${ext ? ` ${LUAR}` : ""} title="${esc(lab)}" aria-label="${esc(lab)}">${ikon(ikp, "currentColor")}</a>`;
    const qs = [tel && q(telHref(tel), IK_TEL, "Telepon " + telF(tel)), wa && q(waHref(wa), IK_WA, "WhatsApp " + telF(wa), 1), em && q("mailto:" + em, IKON_MAIL, "Email " + em), web && q(web, IKON_WEB, "Situs " + urlHost(web), 1), pt && q(pt, IKON_PIN, "Buka di Google Maps", 1)].filter(Boolean).join("");
    return `<article class="ak-org" role="button" tabindex="0" data-li="${i}" aria-label="Buka profil ${esc(x.nama)}">${cekPola(x.id, dpl.has(x.id))}
      <div class="ak-orghead">${denganBintang(lgoIkon(chainLogo(x), ik, w), "L:" + x.id)}<div><h3>${esc(judulCase(x.nama))}${x.singkatan && nrm(x.singkatan) !== nrm(x.nama) && !nrm(x.nama).includes(nrm(x.singkatan)) ? ` <span>(${esc(x.singkatan)})</span>` : ""}</h3></div></div>
      ${ket(ringkasLb(x), 3)}${qs ? `<div class="ak-qrow">${qs}</div>` : ""}<div class="ak-pil ak-mps">${pilMini(ik, kl, w)}${pilLok(x)}${izinPilLb(x)}${pilMitra(x)}${x.didirikan ? pilMini(IKL.tahun, "Sejak " + String(x.didirikan).slice(0, 4)) : ""}${terhLb(x.id)[0] ? pilMini(IK_ORANG, angka(terhLb(x.id)[0]) + " pakar") : ""}${pilContoh(x)}</div></article>`;
  }
  /* BARIS KAYA: satu komponen untuk semua daftar ringkas (pop-up kelompok, lembaga sejenis, sistem/inovasi/pendanaan/proyek di profil).
     kiri logo/ikon 44px; tengah nama tebal, "oleh <logo> pembuat", penjelasan 2 baris, pil; kanan satu fakta kunci + panah. */
  /* logo organisasi (pemberi dana, pemilik, pembuat) dari graf.json: dicocokkan lewat id lembaga atau nama ternormalkan tanpa kurung */
  const GRAFLOGO = new Map(); let grafMuat = false;
  const kunciOrg = n => nrm(String(n || "").replace(/\([^)]*\)/g, " "));
  const muatGrafLogo = () => { if (grafMuat) return; grafMuat = true; ambilData("graf").then(g => { if (!g?.simpul) return; for (const [id, v] of Object.entries(g.simpul)) if (v?.logo && urlOkLogo(v.logo)) { GRAFLOGO.set(id, v.logo); const k = kunciOrg(v.n); if (k && !GRAFLOGO.has("n:" + k)) GRAFLOGO.set("n:" + k, v.logo); } }); };
  const urlOkLogo = u => /^\/api\/gambar\/logo\/[a-f0-9]{16,64}\.(png|jpe?g|webp)$/.test(String(u)) || /^\/img\/logo\/(org\/)?[A-Za-z0-9_-]+\.png$/.test(String(u));   // logo hanya dari R2 kita (CSP img-src self; tanpa hotlink, R10 8.13)
  const LOGO_DONOR = {"nasa": "https://commons.wikimedia.org/wiki/Special:FilePath/NASA_logo.svg?width=128", "noaa": "https://commons.wikimedia.org/wiki/Special:FilePath/NOAA_logo.svg?width=128", "bank dunia": "https://commons.wikimedia.org/wiki/Special:FilePath/The_World_Bank_logo.svg?width=128", "world bank": "https://commons.wikimedia.org/wiki/Special:FilePath/The_World_Bank_logo.svg?width=128", "adb": "https://commons.wikimedia.org/wiki/Special:FilePath/Asian_Development_Bank_logo.svg?width=128", "asian development bank": "https://commons.wikimedia.org/wiki/Special:FilePath/Asian_Development_Bank_logo.svg?width=128", "jica": "https://commons.wikimedia.org/wiki/Special:FilePath/Japan_International_Cooperation_Agency_logo.svg?width=128", "usaid": "https://commons.wikimedia.org/wiki/Special:FilePath/USAID-Identity.svg?width=128", "undp": "https://commons.wikimedia.org/wiki/Special:FilePath/UNDP_logo.svg?width=128", "unicef": "https://commons.wikimedia.org/wiki/Special:FilePath/Logo_of_UNICEF.svg?width=128", "who": "https://commons.wikimedia.org/wiki/Special:FilePath/World_Health_Organization_Logo.svg?width=128", "iom": "https://commons.wikimedia.org/wiki/Special:FilePath/IOM_logo.svg?width=128", "gcf": "https://commons.wikimedia.org/wiki/Special:FilePath/Green_Climate_Fund_logo.svg?width=128", "islamic development bank": "https://commons.wikimedia.org/wiki/Special:FilePath/Islamic_Development_Bank_Logo.svg?width=128", "isdb": "https://commons.wikimedia.org/wiki/Special:FilePath/Islamic_Development_Bank_Logo.svg?width=128"};
  const logoDonorUrl = n => LOGO_DONOR[nrm(String(n || "").replace(/\(.*?\)/g, " ")).trim()] || "";
  const logoOrg = (nama, id) => { const l = id && lbMap.get(id); const a = l ? chainLogo(l) : []; const g = GRAFLOGO.get("L:" + id) || GRAFLOGO.get("n:" + kunciOrg(nama)); const r = (g && !a.length ? [g] : a).filter(u => urlOk(u)); const pm = logoPemUrl(nama); if (r.length) return [...new Set([...r, ...pm])]; return pm.length ? pm : [logoDonorUrl(nama)].filter(Boolean); };   /* logo_pemilik jadi cadangan terakhir bila logo lembaga gagal dimuat */
  const stLabel = t => { const k = String(t || "").toLowerCase().trim(); return k ? (STATUS_ID[k]?.[0] || kapital(k)) : ""; };
  const STATUS_ID = {implementation: ["Berjalan", "var(--ok)"], finalisation: ["Penyelesaian", "var(--ink2)"], penyelesaian: ["Penyelesaian", "var(--ink2)"], completion: ["Selesai", "var(--ink2)"], active: ["Berjalan", "var(--ok)"], berjalan: ["Berjalan", "var(--ok)"], closed: ["Selesai", "var(--ink2)"], selesai: ["Selesai", "var(--ink2)"], pipeline: ["Persiapan", "var(--meti-oranye)"], persiapan: ["Persiapan", "var(--meti-oranye)"], dropped: ["Batal", "var(--bad)"], batal: ["Batal", "var(--bad)"]};
  const pilStatusId = t => { const [l, w] = STATUS_ID[String(t || "").toLowerCase()] || [kapital(String(t || "")), "var(--ink2)"]; return t ? pilStatus(l, w) : ""; };
  const pilSektorN = rs => { rs = strs(rs); return rs.slice(0, 3).map(r => pilSektor(r)).join("") + (rs.length > 3 ? `<span class="ak-r">+${rs.length - 3}</span>` : ""); };
  const pilStatus = (t, w) => t ? `<span class="ak-izin" data-st="background:${esc(w || "var(--ink2)")}">${esc(kapital(t))}</span>` : "";
  const pilJenis = t => t ? `<span class="ak-lbl-prodi">${esc(kapital(t))}</span>` : "";
  const ALIAS_KAMPUS = {"ipb university": "Institut Pertanian Bogor", "ipb": "Institut Pertanian Bogor", "ugm": "Universitas Gadjah Mada", "itb": "Institut Teknologi Bandung", "its": "Institut Teknologi Sepuluh Nopember", "ui": "Universitas Indonesia", "unsyiah": "Universitas Syiah Kuala", "brin": "Badan Riset dan Inovasi Nasional", "badan riset dan inovasi nasional": "Badan Riset dan Inovasi Nasional"};
  const kampusDariNama = n => { const k = nrm(n); if (!k) return ""; if (ALIAS_KAMPUS[k] && (perK[ALIAS_KAMPUS[k]] || kampusInfo[ALIAS_KAMPUS[k]])) return ALIAS_KAMPUS[k]; const ks = Object.keys(perK).concat(Object.keys(kampusInfo)); return ks.find(x => nrm(x) === k) || (k.length >= 10 ? ks.find(x => { const m = nrm(x); return m.length >= 10 && (m.includes(k) || k.includes(m)); }) : "") || ""; };
  const logoPemilik = n => { const l = lbDariNama(n), kp = !l && kampusDariNama(n); const a = l ? chainLogo(l) : kp ? [urlOk(logoK[kp])].filter(Boolean) : logoOrg(n, null); return a.length ? a : logoPemUrl(n); };
  const olehHtml = (id, nama) => { if (GRUPAKTIF && (GRUPAKTIF.field === "pemilik" || GRUPAKTIF.field === "pemberi") && nrm(GRUPAKTIF.value) === nrm(nama || "")) return ""; const n0 = nama || (id && lbMap.get(id)?.nama), l = (id && lbMap.get(id)) || (n0 && lbArr.find(y => namaLb(y).includes(nrm(n0)))), n = n0 || l?.nama; if (!n) return ""; const k = l && (KAT[l.kategori] || KAT.riset), kp = !l && kampusDariNama(n);
    if (kp) return `<small class="ak-bkr-o">oleh ${lgoIkon([urlOk(logoK[kp])].filter(Boolean), IK_KAMPUS, "var(--data1)", 1)}<button type="button" class="ak-pk" data-kp="${esc(kp)}">${esc(potong(n, 56))}</button></small>`;
    return `<small class="ak-bkr-o">oleh ${l ? lgoIkon(chainLogo(l), k[1], k[2], 1) + `<button type="button" class="ak-pk" data-lb="${esc(l.id)}">${esc(potong(n, 56))}</button>` : lgoIkon(logoOrg(n, null), IK_GEDUNG, "var(--ink2)", 1) + `<span>${esc(potong(n, 56))}</span>`}</small>`; };
  const barisKaya = ({attr = "", logo, nama, sub = "", subHtml = "", oleh = "", jelas = "", pil = "", fakta = "", fakta2 = ""}) =>
    `<div class="ak-bkr"${attr ? ` role="button" tabindex="0" ${attr} aria-label="Buka ${esc(nama)}"` : ""}><span class="ak-bkr-l">${logo}</span><div class="ak-bkr-t"><b class="ak-bkr-n">${esc(nama)}</b>${subHtml ? `<small class="ak-bkr-s ak-kepada">${subHtml}</small>` : sub ? `<small class="ak-bkr-s">${esc(sub)}</small>` : ""}${oleh}${jelas ? ket(jelas, 2) : ""}${pil ? `<span class="ak-pil">${pil}</span>` : ""}</div><span class="ak-bkr-r"><span class="ak-bkr-f">${fakta ? `<b>${esc(fakta)}</b>` : ""}${fakta2 ? `<small>${esc(fakta2)}</small>` : ""}</span>${attr ? '<svg class="ak-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>' : ""}</span></div>`;
  const daftarBkr = a => a.length && a.every(h => h.startsWith('<li class="ak-pkb"')) ? `<ol class="ak-sdaftar ak-pkl${a.some(h => h.includes('class="ak-pkm"')) ? "" : " ak-pkl-2"}">${a.join("")}</ol>` : `<div class="ak-bkl">${a.join("")}</div>`;
  const hrefAttr = u => u ? `data-href="${esc(u)}"` : "";
  const warnaStatus = t => /berjalan|aktif|terpasang|hidup/i.test(t) ? "var(--ok)" : /selesai|penyelesaian|tutup/i.test(t) ? "var(--data5)" : "var(--ink2)";
  let GRAFNOW = null;
  const terhLb = id => { const lis = GRAFNOW?.adj.get("L:" + id) || []; let p = 0, n = 0; lis.forEach(e => { if (e.to[0] === "P") p++; else if (e.to[0] === "I") n++; }); return [p, n]; };
  /* ringkas: dipakai di daftar yang sudah dikelompokkan per kategori dalam satu wilayah, jadi pil kategori dan lokasi tidak diulang; kab/kota jadi baris abu-abu */
  const barisLb = (y, attr, ringkas) => { const k = KAT[y.kategori] || [y.kategori, KAT.riset[1], "var(--ink2)"];
    const [tp, ti] = terhLb(y.id); return barisKaya({attr: typeof attr === "string" ? attr : `data-lb="${esc(y.id)}"`, fakta: tp ? `${angka(tp)} pakar` : "", fakta2: ti ? `${angka(ti)} inovasi` : "", logo: logoLb(y), nama: judulCase(y.nama) + (y.singkatan && !nrm(y.nama).includes(nrm(y.singkatan)) ? ` (${y.singkatan})` : ""), sub: ringkas ? String(y.kab || "") : "", jelas: ringkas ? "" : ringkasLb(y), pil: ringkas ? pilIzin(y) + pilMitra(y) : pilMini(k[1], k[0], k[2]) + pilLok(y) + pilIzin(y) + pilMitra(y) + (y.didirikan ? pilMini(IKL.tahun, "Sejak " + String(y.didirikan).slice(0, 4)) : "") + pilSektorN(y.sektor)}); };
  /* thumbnail inovasi 56 px: foto (cover) bila ada, selain itu ikon jenis di kotak berwarna sektor pertama */
  const inThumb = (x, w) => { const f = urlOk(x.foto_url); return `<span class="ak-th56" data-st="--w0:${esc(w)}">${ikon(ikJenis(x.jenis), "currentColor")}${f && !x.foto_blokir ? `<img src="${esc(f)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ""}</span>`; };
  const olehPlain = pb => { const n = pb?.nama; if (!n) return ""; const l = (pb.lembaga_id && lbMap.get(pb.lembaga_id)) || lbArr.find(y => namaLb(y).includes(nrm(n))), kp = !l && kampusDariNama(n), lg = l ? chainLogo(l).find(u => urlOk(u)) : kp ? urlOk(logoK[kp]) : "";
    const ik = lg ? `<img class="ak-ol-lg" src="${esc(lg)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : "", at = l ? `data-lb="${esc(l.id)}"` : kp ? `data-kp="${esc(kp)}"` : "";
    return `<span class="ak-oleh">oleh ${ik}${at ? `<button type="button" class="ak-oleh-n" ${at}>${esc(n)}</button>` : `<span>${esc(n)}</span>`}</span>`; };
  const barisInovasi = (x, attr) => { const pb = dlist(x.pembuat)[0], w = (SEKTOR[strs(x.sektor)[0]] || [])[2] || "var(--data5)", np = dlist(x.penerapan).length;
    const [pdk, pjg0] = namaInovasi(x), pjg = pjg0 && nrm(pjg0) !== nrm(pb?.nama || "") && nrm(pjg0) !== nrm(pb?.singkatan || "@@") ? pjg0 : "";
    return barisKaya({attr: typeof attr === "string" ? attr : `data-inid="${esc(x.id)}"`, logo: inThumb(x, w), nama: pdk, sub: pjg, oleh: olehPlain(pb),
      jelas: x.ringkasan || `${kapital(x.jenis || "inovasi")}${x.tahun ? ", sejak " + x.tahun : ""}.`, pil: pilStatus(x.status, STATUS_IN[x.status]) + pilJenis(x.jenis) + pilSektorN(x.sektor) + (x.trl ? pilMini(IK_BAR, "TKT " + x.trl) : "") + (dlist(x.paten).length || x.paten === true ? pilMini(IKL.jenis, "Paten") : "") + (x.tahun ? pilMini(IKL.tahun, "Sejak " + x.tahun) : "") + (np ? pilMini(IKON_PIN, angka(np) + " lokasi pakai") : "") + pilContoh(x)}); };
  /* logo pemilik sistem data: lembaga di direktori, lalu logo_pemilik.json (nama pemilik persis), lalu ikon; pemilik ganda "A dan B" = dua logo kecil bertumpuk */
  let LOGO_PEM = null; const muatLogoPem = () => { if (LOGO_PEM) return; LOGO_PEM = {}; ambilData("logo_pemilik").then(d => { if (d && typeof d === "object" && !Array.isArray(d)) { LOGO_PEM = d; nanti(() => { try { if ($("akPjL")) gambarPj(false); if ($("akPdL")) gambarPd(false); if ($("akLL") && lbHasil.length) gambarLb(false); } catch (er) {} }); } }); };
  const ALIAS_ORG = {"badan perencanaan pembangunan nasional": "Bappenas", "kementerian ppn": "Bappenas", "brr": "BRR NAD-Nias", "badan rehabilitasi dan rekonstruksi": "BRR NAD-Nias", "kantor menteri negara lingkungan hidup": "KLHK", "kementerian lingkungan hidup": "KLHK", "klh": "KLHK", "kementerian lingkungan hidup dan kehutanan": "KLHK", "world bank": "World Bank", "bank dunia": "World Bank", "asian development bank": "ADB", "kementerian kehutanan": "Kementerian Lingkungan Hidup", "kementerian pu": "Kementerian PU", "noaa": "NOAA NCEI"};
  /* satu resolver logo organisasi untuk seluruh halaman: lembaga di direktori, logo_pemilik (nama persis), alias umum; kosong = pemanggil memakai ikon/inisial */
  const logoPemUrl = n => { n = String(n || "").trim(); const e = LOGO_PEM?.[n]; if (urlOk(e?.logo)) return [e.logo];
    const al = ALIAS_ORG[nrm(n)] || ALIAS_ORG[nrm(n.replace(/\([^)]*\)/g, " "))]; if (al && urlOk(LOGO_PEM?.[al]?.logo)) return [LOGO_PEM[al].logo];
    const y = n && lbArr.find(z => namaLb(z).includes(nrm(n))); if (y) { const c = chainLogo(y); if (c.length) return c; }
    const g = n && GRAFNOW && Object.entries(GRAFNOW.simpul).find(([id, v]) => id[0] === "L" && v.logo && urlOkLogo(v.logo) && nrm(v.n || "") === nrm(n)); return g ? [g[1].logo] : []; };
  const logoSd = (x, own, aw) => { if (own) return lgoIkon(chainLogo(own), IK_DB, aw); const a = logoPemUrl(x.pemilik); if (a.length) return lgoIkon(a, IK_DB, aw);
    const bagi = String(x.pemilik || "").split(/\s+dan\s+|\s*[\/;&]\s*/).map(t => t.trim()).filter(Boolean).slice(0, 2); if (bagi.length > 1) { const l = bagi.map(logoPemUrl); if (l.some(z => z.length)) return `<span class="ak-lg2">${l.map(z => lgoIkon(z, IK_DB, aw, true)).join("")}</span>`; }
    return lgoIkon([], IK_DB, aw); };
  const barisSd = (x, attr) => { const own = x.lembaga_id && lbMap.get(x.lembaga_id), [al, aw] = AKSES[x.akses] || [x.akses || "Akses belum tercatat", "var(--ink2)"], nJ = strs(x.jenis_data).length;
    return barisKaya({attr: typeof attr === "string" ? attr : `data-sd="${esc(x.id)}"`, logo: logoSd(x, own, aw), nama: x.nama, sub: x.kepanjangan, oleh: olehHtml(x.lembaga_id, x.pemilik),
      jelas: x.uraian || `${x.nama} menyediakan data ${strs(x.jenis_data).slice(0, 4).join(", ") || "energi terbarukan"}.`, pil: pilStatus(al, aw) + pilJenis(strs(x.jenis_data)[0]) + pilSektorN(x.sektor) + pilContoh(x), fakta: nJ ? `${angka(nJ)} jenis data` : ""}); };
  /* "Kepada <logo> A, <logo> B +n": pelaksana dicocokkan ke lembaga, bisa diklik ke profilnya */
  const kepadaHtml = (pel, tambah) => { const a = pel.filter(v => !/^(republic of )?indonesia$|^pemerintah indonesia$/i.test(String(v).trim())); const bagian = a.slice(0, 2).map(v => { const k = nrm(v), l = lbArr.find(y => namaLb(y).includes(k) || (y.singkatan && nrm(y.singkatan) === k)); const kt = l && (KAT[l.kategori] || KAT.riset);
      const lg = lgoIkon(l ? chainLogo(l) : logoOrg(v, null), kt ? kt[1] : IK_GEDUNG, kt ? kt[2] : "var(--ink2)", 1);
      return lg + (l ? `<button type="button" class="ak-pk" data-lb="${esc(l.id)}">${esc(potong(l.singkatan || v, 40))}</button>` : `<span>${esc(potong(v, 40))}</span>`); });
    const t = [tambah].filter(Boolean).join(", "); if (!bagian.length) return esc(t);
    return `Kepada ${bagian.join(" ")}${a.length > 2 ? ` <b>+${a.length - 2}</b>` : ""}${t ? ", " + esc(t) : ""}`; };
  const SASARAN_ID = {pinjaman: "Pinjaman", hibah: "Hibah", "bantuan teknis": "Bantuan teknis"};
  const barisDana = x => { const l = (x.lembaga_id && lbMap.get(x.lembaga_id)) || (x.pemberi && lbArr.find(y => namaLb(y).includes(nrm(x.pemberi)))), w = JENIS_DANA[x.jenis] || "var(--ok)", u = urlOk(x.url) || urlOk(dlist(x.sumber)[0]?.url);
    const pel = pelaksanaList(x.pelaksana?.length ? x.pelaksana : []).filter(v => !/^(republic of )?indonesia$/i.test(String(v).trim())), rn = strs(x.sektor).map(r => (SEKTOR[r] || [r])[0].toLowerCase());
    const jelas = x.uraian || x.ringkasan || (x.jenis_entri === "proyek" ? `${kapital(x.jenis || "Pendanaan")}${rn.length ? " untuk energi terbarukan " + rn.slice(0, 3).join(", ") : " energi terbarukan"}.` : `${x.pemberi || "Pemberi"} menyediakan ${x.jenis || "pendanaan"}${strs(x.sasaran).length ? " untuk " + strs(x.sasaran).join(", ") : ""}.`);
    const baris2 = [pel.length ? "Pelaksana: " + pel.slice(0, 2).join(", ") + (pel.length > 2 ? ` +${pel.length - 2}` : "") : "", tahunSaja(x.tahun, x.selesai), strs(x.prov).slice(0, 1).map(provT).join("")].filter(Boolean).join(", ");
    return barisKaya({attr: x.jenis_entri === "skema" ? `data-sk="${esc(x.id)}"` : hrefAttr(u), logo: lgoIkon(logoOrg(x.pemberi, l?.id || x.lembaga_id), IK_UANG, w), nama: x.nama, subHtml: kepadaHtml(pel, [tahunSaja(x.tahun, x.selesai), strs(x.prov).slice(0, 1).map(provT).join("")].filter(Boolean).join(", ")), oleh: olehHtml(l?.id || x.lembaga_id, x.pemberi),
      jelas, pil: pilStatusId(x.status) + pilJenis(x.jenis || x.jenis_entri) + pilContoh(x), fakta: x.nilai_usd != null ? usdR(x.nilai_usd) : "", fakta2: x.tahun ? `Tanda tangan ${x.tahun}` : ""}); };
  /* kartu proyek mitra: pemberi + status di atas, judul, nilai besar, lalu fakta berlabel (penerima, periode, sektor, provinsi) */
  const warnaNama = n => { let h = 0; for (const c of String(n)) h = (h * 31 + c.charCodeAt(0)) % 360; return `hsl(${h} 45% 38%)`; };
  const logoDonor = (nama, id) => { const a = logoOrg(nama, id).filter(u => urlOk(u)), ini = String(nama || "?").replace(/\([^)]*\)/g, "").split(/\s+/).filter(w => /^\p{L}/u.test(w)).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
    return `<span class="ak-lgo kecil ak-lgo-d" data-st="--w0:${warnaNama(nama)}"><b class="ak-ini">${esc(ini)}</b>${a.length ? `<img src="${esc(urlOk(a[0]))}" alt="" loading="lazy" referrerpolicy="no-referrer" data-next="${esc(a.slice(1).join("|"))}">` : ""}</span>`; };
  const nonLatin = t => /[^\u0000-\u024F\u2000-\u206F\u00A0-\u00FF]/.test(String(t || ""));
  const simpulInfo = id => { if (!GRAFNOW) return null; const t = id[0], rid = id.slice(2), v = GRAFNOW.simpul[id]; if (t === "L" && lbMap.has(rid)) { const y = lbMap.get(rid); return {nama: judulCase(y.nama), logo: logoLb(y), attr: `data-lb="${esc(y.id)}"`}; }
    if (t === "K") return {nama: rid, logo: logoKecil(rid), attr: `data-kp="${esc(rid)}"`}; if (!v) return null;
    return {nama: v.n || rid, logo: v.logo && urlOkLogo(v.logo) ? lgoIkon([v.logo], IK_GEDUNG, "var(--data1)") : logoDonor(v.n, null), attr: ATTR_NODE[t] ? ATTR_NODE[t](rid) : ""}; };
  /* profil = simpul profil yang sedang dibuka (Terhubung): pemberi atau penerima yang sama dengan profil itu tidak diulang di tiap kartu */
  const kartuPj = (p, profil, simpul) => { const gl = GRAFNOW?.adj.get(simpul || "J:" + p.id) || [], eDon = gl.find(e => !e.out && /mendanai/.test(e.rel)), gDon = simpulInfo(eDon?.to || ""), gPel = gl.filter(e => e.out && /dilaksanakan/.test(e.rel) && e.to !== profil).map(e => simpulInfo(e.to)).filter(Boolean);
    const nDon = nrm(gDon?.nama || p.donor || "");
    return kartuPj0(p, gDon, gPel.filter(g => !nDon || nrm(g.nama) !== nDon), !!profil && eDon?.to === profil); };
  const kartuPj0 = (p, gDon, gPel, tanpaDonor) => { const l = p.donor && lbArr.find(y => namaLb(y).includes(nrm(p.donor)) || nrm(p.donor).includes(nrm(y.singkatan || "@@"))), nD = [gDon?.nama, p.donor].filter(Boolean).map(nrm), pel = pelaksanaList(p.pelaksana).filter(v => !/^(republic of )?indonesia$|^pemerintah indonesia$/i.test(v) && !nD.includes(nrm(v))), sek = [...new Set(strs(p.sektor).map(sektorNama).filter(Boolean))], pv = strs(p.prov).map(provT), u = urlOk(p.url), th = tahunSaja(p.mulai, p.selesai);
    const asli = nonLatin(p.judul), en = p.judul_en || p.judul_inggris || "", judul = (asli || /^[A-Z0-9 .,()\-:&\/]+$/.test(String(p.judul || "")) && en) && en ? en : p.judul;
    const chipPel = v => { const y = lbArr.find(z => namaLb(z).includes(nrm(v))); return y ? `<button type="button" class="ak-pjk-pn" data-lb="${esc(y.id)}" title="Profil ${esc(y.nama)}">${logoLb(y).replace('class="ak-lgo"', 'class="ak-lgo kecil"')}<span>${esc(potong(v, 34))}</span></button>` : `<span class="ak-pjk-pn ak-pjk-pn0">${logoPemUrl(v).length ? lgoIkon(logoPemUrl(v), IK_GEDUNG, "var(--data1)", 1) : ""}<span>${esc(potong(v, 34))}</span></span>`; };
    const fakta = [[IKP.tahun, "Periode", th], [IK_BAR, "Sektor", sek.slice(0, 2).join(", ")], [IKON_PIN, "Provinsi", pv.slice(0, 2).join(", ")]].filter(r => r[2]);
    return `<article class="ak-pjk"${u ? ` role="link" tabindex="0" ${hrefAttr(u)}` : ""}><div class="ak-pjk-a">${tanpaDonor ? "" : `${gDon && /<img/.test(gDon.logo) ? gDon.logo : logoDonor(p.donor, l?.id)}<span class="ak-pjk-d">${esc(gDon ? gDon.nama : p.donor ? judulCase(p.donor) : "Pemberi tidak tercatat")}</span>`}${pilStatusId(p.status)}</div>
      <h4 class="ak-pjk-j" title="${esc(kalimat(judul))}">${esc(kalimat(judul))}</h4>${asli && !en ? '<span class="ak-mp ak-pjk-asli">Judul asli</span>' : ""}
      ${p.usd != null ? `<div class="ak-pjk-n"><b>${esc(usdR(p.usd))}</b><small>\u2248 ${esc(rpRingkas(p.usd * KURS_USD))}</small>${p.salur ? `<small class="ak-salur">tersalur ${esc(usdR(p.salur))}</small>` : ""}</div>` : ""}
      ${p.ringkasan_id ? `<p class="ak-pjk-r">${esc(p.ringkasan_id)}</p>` : ""}
      ${gPel.length ? `<div class="ak-pjk-pel"><small>Penerima</small><div>${gPel.slice(0, 2).map(g => `<button type="button" class="ak-pjk-pn" ${g.attr} title="${esc(g.nama)}">${g.logo}<span>${esc(potong(g.nama, 34))}</span></button>`).join("")}${gPel.length > 2 ? `<span class="ak-r ak-r-n">+${gPel.length - 2}</span>` : ""}</div></div>` : pel.length ? `<div class="ak-pjk-pel"><small>Penerima</small><div>${pel.slice(0, 2).map(chipPel).join("")}${pel.length > 2 ? `<span class="ak-r ak-r-n">+${pel.length - 2}</span>` : ""}</div></div>` : ""}
      ${fakta.length ? `<dl class="ak-pjk-f">${fakta.map(([ik, k, v]) => `<div>${ikon(ik, "currentColor")}<dt>${k}</dt><dd title="${esc(v)}">${esc(v)}</dd></div>`).join("")}</dl>` : ""}</article>`; };
  const barisPjKaya = p => { const l = p.donor && lbArr.find(y => namaLb(y).includes(nrm(p.donor)) || nrm(p.donor).includes(nrm(y.singkatan || "@@"))), pel = pelaksanaList(p.pelaksana), sek = [...new Set(strs(p.sektor).map(sektorNama).filter(Boolean))], pv = strs(p.prov).map(provT);
    /* donor ditulis singkat (FCDO, bukan "UK - Foreign, Commonwealth Development Office (FCDO)"); sektor cukup sebagai pil, tanpa kalimat "Sektor: ..." yang mengulang */
    const dPendek = p.donor && ((String(p.donor).match(/\(([A-Z][A-Za-z&]{1,12})\)\s*$/) || [])[1] || l?.singkatan || judulCase(p.donor));
    return barisKaya({attr: hrefAttr(urlOk(p.url)), logo: lgoIkon(logoOrg(p.donor, l?.id), IK_UANG, "var(--data5)"), nama: kalimat(p.judul), oleh: olehHtml(l?.id, dPendek),
      subHtml: kepadaHtml(pel, tahunSaja(p.mulai, p.selesai)), jelas: "", pil: pilStatusId(p.status) + sek.slice(0, 2).map(pilJenis).join("") + pv.slice(0, 1).map(t => `<span class="ak-ptl ak-ptl2">${ikon(IKON_PIN, "currentColor")}${esc(t)}</span>`).join(""), fakta: p.usd != null ? usdR(p.usd) : "", fakta2: p.mulai ? `Mulai ${String(p.mulai).slice(0, 4)}` : ""}); };
  
  const barisSensor = sn => { const u = urlOk(sn.portal_url) || urlOk(sn.sumber_url);
    return barisKaya({attr: hrefAttr(u), logo: lgoIkon([], IKJENIS.sensor, "var(--data5)"), nama: kapital(sn.jenis || "Sensor"), jelas: sn.cakupan || "", pil: sn.data_terbuka ? pilStatus("Data terbuka", "var(--ok)") : pilStatus("Data tidak terbuka", "var(--ink2)"), fakta: sn.jumlah != null ? `${angka(sn.jumlah)} unit` : ""}); };
  const barisProduk = pr => barisKaya({attr: hrefAttr(urlOk(pr.sumber_url)), logo: lgoIkon([], ikJenis(pr.jenis || pr.nama), (SEKTOR[strs(pr.sektor)[0]] || [])[2] || "var(--data5)"), nama: pr.nama || "", jelas: pr.uraian || "", pil: pilJenis(pr.jenis) + pilSektorN(pr.sektor), fakta: pr.tahun ? `Sejak ${pr.tahun}` : ""});
  const namaInovasi = x => { const n = String(x.nama || ""), m = n.match(/^(.+?)\s*\((.+)\)\s*$/) || n.match(/^([^\-–]{2,22}?)\s+[\-–]\s+(.+)$/); return x.singkatan ? [x.singkatan, n] : m ? [m[1], m[2]] : [n, ""]; };
  const kartuInP = (x, i) => { const pb = dlist(x.pembuat)[0], l = pb?.lembaga_id && lbMap.get(pb.lembaga_id), w = (SEKTOR[strs(x.sektor)[0]] || [])[2] || "var(--data5)", [pendek, panjang] = namaInovasi(x), np = dlist(x.penerapan).length;
    const jelas = x.ringkasan || `${kapital(x.jenis || "inovasi")}${strs(x.sektor).length ? " untuk " + strs(x.sektor).map(r => (SEKTOR[r] || [r])[0].toLowerCase()).join(", ") : ""}${pb ? ", dibuat " + pb.nama : ""}${x.tahun ? ", sejak " + x.tahun : ""}.`;
    const foot = [np ? `Diterapkan di ${angka(np)} lokasi` : "", x.tahun ? `Sejak ${x.tahun}` : "", x.trl ? `TKT ${x.trl}${x.trl_dasar === "perkiraan" ? " (perkiraan)" : ""}` : ""].filter(Boolean);
    return `<article class="ak-prod" role="button" tabindex="0" data-in="${i}" aria-label="Buka ${esc(x.nama)}"><div class="ak-prod-top" data-st="--w0:${w}">${ikon(ikJenis(x.jenis), w)}${urlOk(x.foto_url) && !x.foto_blokir ? `<img class="ak-prod-foto" src="${esc(urlOk(x.foto_url))}" alt="" loading="lazy" referrerpolicy="no-referrer">${x.foto_kredit ? (urlOk(x.foto_halaman) ? `<a class="ak-prod-kredit" href="${esc(urlOk(x.foto_halaman))}" ${LUAR}>Foto: ${esc(x.foto_kredit)}</a>` : `<span class="ak-prod-kredit">Foto: ${esc(x.foto_kredit)}</span>`) : ""}` : ""}${x.status ? `<em class="ak-izin" data-st="background:${STATUS_IN[x.status] || "var(--ink2)"}">${esc(kapital(x.status))}</em>` : ""}</div>
      <div class="ak-prod-body"><h3>${esc(pendek)}</h3>${panjang ? `<small class="ak-lper">${esc(potong(panjang, 80))}</small>` : ""}${ket(jelas, 3)}${pb ? (() => { const l2 = l || lbDariNama(pb.nama), kp = !l2 && kampusDariNama(pb.nama), lg = l2 ? chainLogo(l2) : kp ? [urlOk(logoK[kp])].filter(Boolean) : logoOrg(pb.nama, null), nm = `<span title="${esc(pb.nama)}">${esc(potong(pb.nama, 52))}</span>`;
        return `<div class="ak-pbrow">${lgoIkon(lg, l2 ? (KAT[l2.kategori] || KAT.riset)[1] : kp ? IK_KAMPUS : IK_GEDUNG, l2 ? (KAT[l2.kategori] || KAT.riset)[2] : "var(--data1)", 1)}${l2 ? `<button type="button" class="ak-pk" data-lb="${esc(l2.id)}">${nm}</button>` : kp ? `<button type="button" class="ak-pk" data-kp="${esc(kp)}">${nm}</button>` : nm}</div>`; })() : ""}
      <div class="ak-pil">${strs(x.sektor).slice(0, 3).map(r => `<button type="button" class="ak-r ak-rk" data-rpn="${esc(r)}" data-st="--w0:${(SEKTOR[r] || [])[2] || "var(--ink2)"}">${(SEKTOR[r] || [])[1] ? ikon(SEKTOR[r][1], SEKTOR[r][2]) : ""}${esc((SEKTOR[r] || [r])[0])}</button>`).join("")}${strs(x.sektor).length > 3 ? `<span class="ak-r ak-rk">+${strs(x.sektor).length - 3}</span>` : ""}</div>${foot.length ? `<div class="ak-ftr">${esc(foot.join(", "))}</div>` : ""}</div></article>`; };
  const kartuSdP = x => { const own = (x.lembaga_id && lbMap.get(x.lembaga_id)) || (x.pemilik && lbArr.find(y => namaLb(y).includes(nrm(x.pemilik)))), [al, aw] = AKSES[x.akses] || [x.akses || "Akses belum tercatat", "var(--ink2)"], portal = urlOk(x.portal_url), api = urlOk(x.api_url), intl = !!x.cakupan_internasional;
    const h = hostDari2(portal || api || ""), logos = [...logoOrg(x.pemilik, own?.id || x.lembaga_id)].filter(Boolean);
    const jelas = (intl && x.relevansi_indonesia) || x.uraian || `${x.nama} menyediakan data ${strs(x.jenis_data).slice(0, 4).join(", ") || "energi terbarukan"}.`, jd = strs(x.jenis_data), iso = String(x.iso2 || x.negara_iso2 || "").toUpperCase();
    const oleh = x.pemilik ? `<small class="ak-lper ak-sd-o">${intl && iso ? `<span class="ak-bendera" title="${esc(x.negara || iso)}">${esc(bendera(iso))} ${esc(iso)}</span> ` : ""}${own ? `<button type="button" class="ak-pk" data-lb="${esc(own.id)}">${esc(potong(x.pemilik, 48))}</button>` : `<span>${esc(potong(x.pemilik, 48))}</span>`}</small>` : "";
    return `<article class="ak-org ak-sdk" role="button" tabindex="0" data-sd="${esc(x.id)}" aria-label="Buka ${esc(x.nama)}"><div class="ak-orghead">${lgoIkon(logos, IK_DB, aw)}<div><h3>${esc(x.nama)}</h3>${x.kepanjangan ? `<small class="ak-lper ak-sd-k">${esc(x.kepanjangan)}</small>` : ""}${oleh}</div></div>
      ${ket(jelas, 2)}<div class="ak-pil ak-sd-jd">${jd.slice(0, 3).map(t => `<span class="ak-jd">${esc(kapital(t))}</span>`).join("")}${jd.length > 3 ? `<span class="ak-jd">+${jd.length - 3}</span>` : ""}</div>
      <div class="ak-sd-kaki"><span class="ak-pil"><span class="ak-izin" data-st="background:${aw}">${esc(al)}</span>${pilContoh(x)}</span><span class="ak-sd-ln">${portal ? `<a class="ak-ln-k" href="${esc(portal)}" ${LUAR}>Portal ↗</a>` : ""}${api ? `<a class="ak-ln-k" href="${esc(api)}" ${LUAR}>API ↗</a>` : ""}</span></div></article>`; };
  /* kartu dan lembar SKEMA pendanaan: logo pemberi, pil jenis berwarna, hanya fakta yang terisi */
  const skOk = v => v != null && String(v).trim() !== "" && !/ikuti pengumuman|lihat syarat di situs|^-+$/i.test(String(v).trim());
  const skFakta = x => [["Besaran", IK_UANG, x.nilai != null ? nilaiAsli(x) : ""], ["Sasaran", IK_ORANG, strs(x.sasaran).map(kapital).join(", ")], [x.siklus ? "Siklus" : "Tenggat", IKP.tahun, skOk(x.siklus) ? x.siklus : skOk(x.tenggat) ? x.tenggat : ""], ["Penerima", IK_GEDUNG, dlist(x.contoh_penerima_indonesia).map(c => typeof c === "string" ? c : c?.nama).filter(Boolean).slice(0, 3).join(", ")]].filter(r => skOk(r[2]));
  const skPemberi = x => { const l = (x.lembaga_id && lbMap.get(x.lembaga_id)) || (x.pemberi && lbArr.find(y => namaLb(y).includes(nrm(x.pemberi)))), iso = String(x.iso2 || x.negara_iso2 || l?.negara_iso2 || "").toUpperCase(); return {l, iso, negara: x.negara || x.negara_pemberi || ""}; };
  const PERAN_B = {pengusul: ["Pengusul", "var(--ok)"], mitra: ["Mitra", "var(--data5)"], "pengguna hasil": ["Pengguna hasil", "var(--ink2)"]};
  const pilPeranB = x => PERAN_B[x.meti_bisa] ? `<span class="ak-izin" data-st="background:${PERAN_B[x.meti_bisa][1]}">METI bisa: ${PERAN_B[x.meti_bisa][0]}</span>` : "";
  const lencRB = x => x.kolaborasi ? '<span class="ak-izin" data-st="background:var(--data5)">Riset bersama</span>' : "";
  const mitraNeg = x => strs(x.mitra_negara).map(n => { const iso = Object.keys(NEGARA_NAMA).find(k => NEGARA_NAMA[k] === String(n).replace(/\s*\(.*\)$/, "")); return (iso ? bendera(iso) + " " : "") + n; });
  const kartuSkemaP = x => { const {l, iso, negara} = skPemberi(x), w = JENIS_DANA[x.jenis] || "var(--ok)", jelas = x.uraian || `${x.pemberi || "Pemberi"} menyediakan ${x.jenis || "pendanaan"}${strs(x.sasaran).length ? " untuk " + strs(x.sasaran).join(", ") : ""}.`, f = skFakta(x);
    return `<article class="ak-org ak-skm" role="button" tabindex="0" data-sk="${esc(x.id)}" aria-label="Buka ${esc(x.nama)}"><div class="ak-orghead">${lgoIkon(logoOrg(x.pemberi, l?.id || x.lembaga_id), IK_UANG, w)}<div><h3>${esc(x.nama)}</h3><small class="ak-lper">${iso ? esc(bendera(iso)) + " " : ""}${esc(x.pemberi || "")}${negara ? ", " + esc(negara) : ""}</small></div></div>
      <div class="ak-pil">${pilStatus(x.jenis || "skema", w)}${lencRB(x)}${pilPeranB(x)}${pilContoh(x)}</div>${x.kolaborasi && mitraNeg(x).length ? `<small class="ak-lper">Mitra: ${esc(mitraNeg(x).slice(0, 2).join(", "))}</small>` : ""}${ket(jelas, 2)}
      ${f.length ? `<ul class="ak-fk">${f.map(([k, ik, v]) => `<li><span>${ikon(ik, "currentColor")}${k}</span><b>${typeof v === "string" && k === "Besaran" ? v : esc(v)}</b></li>`).join("")}</ul>` : ""}
      <span class="ak-sk-cara">Cara mengajukan</span></article>`; };
  function lembarSkema(x) {
    const {l, iso, negara} = skPemberi(x), w = JENIS_DANA[x.jenis] || "var(--ok)", u = urlOk(x.url) || urlOk(dlist(x.sumber)[0]?.url), f = [["Besaran", skBesaran(x)], ["Sasaran", strs(x.sasaran).map(kapital).join(", ")], ["Siklus", x.siklus], ["Tenggat", x.tenggat], ["Mitra negara", x.kolaborasi ? mitraNeg(x).join(", ") : ""], ["Syarat", x.syarat_singkat]].filter(r => skOk(r[1]));
    const langkah = (Array.isArray(x.cara) ? x.cara : String(x.cara || "").split(/\n|;\s+|(?<=\.)\s+(?=\d+[.)]\s)/)).map(t => String(t).replace(/^\s*\d+[.)]\s*/, "").trim()).filter(skOk);
    const kep = `<div class="ak-dkepala"><div class="ak-dk-atas">${lgoIkon(logoOrg(x.pemberi, l?.id || x.lembaga_id), IK_UANG, w).replace('class="ak-lgo"', 'class="ak-lgo ak-lgo-b"')}<div class="ak-nama"><h2 id="akSJudul">${esc(x.nama)}</h2><p>${iso ? esc(bendera(iso)) + " " : ""}${l ? `<button type="button" class="ak-pk" data-lb="${esc(l.id)}">${esc(x.pemberi)}</button>` : esc(x.pemberi || "")}${negara ? ", " + esc(negara) : ""}</p></div></div>
      <div class="ak-pil">${pilStatus(x.jenis || "skema", w)}${x.status ? pilStatusId(x.status) : ""}${lencRB(x)}${pilPeranB(x)}${pilContoh(x)}</div>
      <div class="ak-pil">${lencanaUmum(x)}${u ? `<a class="ak-rbtn ak-rbtn-utama" href="${esc(u)}" ${LUAR}>Buka laman resmi ↗</a>` : ""}${langkah.length ? '<button type="button" class="ak-rbtn ak-rbtn-b" data-skcara="1">Cara mengajukan</button>' : ""}</div></div>`;
    const bag = (j, isi, id) => isi ? `<section class="ak-dbagian"${id ? ` id="${id}"` : ""}><div class="ak-disi"><h3>${j}</h3>${isi}</div></section>` : "";
    const kon = [...strs(x.kontak?.email).filter(emailOk).map(m => `<span class="ak-kt"><a class="ak-lnk" href="mailto:${esc(m)}">${ikon(IKON_MAIL, "currentColor")}<em>Email</em>${esc(m)}</a></span>`), ...strs(x.kontak?.telepon).map(t => `<span class="ak-kt"><a class="ak-lnk" href="${esc(telHref(t))}">${ikon(IK_TEL, "currentColor")}<em>Telepon</em>${esc(telF(t))}</a></span>`)].join("");
    const cp = dlist(x.contoh_penerima_indonesia).map(c => typeof c === "string" ? {nama: c} : c).filter(c => c?.nama).map(c => { const ly = (c.lembaga_id && lbMap.get(c.lembaga_id)) || lbArr.find(y => namaLb(y).includes(nrm(c.nama))); return ly ? barisLb(ly) : barisKaya({logo: lgoIkon([], IK_GEDUNG, "var(--data1)"), nama: c.nama, jelas: c.keterangan || "", fakta: c.tahun ? String(c.tahun) : ""}); });
    const rel = pdArr.filter(y => y.id !== x.id && y.jenis_entri === "proyek" && x.pemberi && y.pemberi === x.pemberi).slice(0, 8);
    const src = sumberRapi(dlist(x.sumber).map(sv => sv?.url));
    bukaSheet("detail", kep, () => bag("Ringkasan", (skOk(x.uraian) ? `<p class="ak-rata">${esc(x.uraian)}</p>` : "") + (f.length ? `<dl class="ak-lbr">${f.map(([k, v]) => `<div><dt>${k}</dt><dd>${k === "Besaran" ? kapital(v) : esc(kapital(v))}</dd></div>`).join("")}</dl>` : ""))
      + bag("Cara mengajukan", langkah.length ? `<ol class="ak-langkah">${langkah.map(t => `<li>${esc(t)}</li>`).join("")}</ol>` : "", "akSkCara") + bag("Kontak", kon ? `<div class="ak-lkontak">${kon}</div>` : "")
      + '<div id="akSkCocok"></div>' + bag("Contoh penerima di Indonesia", cp.length ? daftarBkr(cp) : "") + bag("Proyek terkait dari pemberi yang sama", rel.length ? gridProyek(rel.map(dariDana)) : "")
      + bag("Sumber", src) + (x.diperiksa ? `<p class="ak-lper ak-skd-p">Diperiksa ${esc(tglID(x.diperiksa))}</p>` : ""));
    $("akSheet").dataset.k = ""; terhubungDi("D:" + x.id); const tk = tokenS;
    Promise.resolve(null).then(wd => { const h = cocokSkema(x, wd); if (h) isiNanti(() => tk === tokenS, "akSkCocok", h); });
  }
  /* siapa yang paling cocok mengajukan (permintaan pemilik 31 Okt 2026): pakar menurut sektor dan kata kunci di topiknya, kampus asal pakar itu,
     dan lembaga sejenis */
  function cocokSkema(x, wd) {
    const rp = strs(x.sektor), kw = [...strs(x.kata_kunci), ...String(x.bidang || "").split(/[,;]/)].map(t => nrm(t)).filter(t => t.length >= 4), sas = nrm(strs(x.sasaran).join(" ") + " " + strs(x.syarat_pemohon).join(" "));
    if (!rp.length && !kw.length) return "";
    const skor = o => { if (!provO(o)) return 0; const top = nrm(strs(o[8]).join(" ")), h = kw.filter(t => top.includes(t)).length, r = strs(o[3]).filter(z => rp.includes(z)).length; return h || (r && !kw.length) ? 3 * h + r + Math.log1p(o[4] || 0) * .3 : 0; };   /* hanya pakar berkampus Indonesia; kata kunci lebih berat dari sektor */
    const pk = semua.map(o => [o, skor(o)]).filter(r => r[1] > 0).sort((a, b) => b[1] - a[1]), H = [];
    if (pk.length) H.push(`<h4 class="ak-dpgrup ak-katj">${ikon(IK_ORANG, "currentColor")}<b>Pakar</b><small class="ak-hit">${angka(pk.length)}</small></h4><ol class="ak-sdaftar ak-pkl ak-pkl-2s">${pk.slice(0, 6).map(([o]) => barisPk(o)).join("")}</ol>`);
    if (/kampus|universit|perguruan|akademi|peneliti|research/.test(sas) || !sas) { const km = new Map(); pk.slice(0, 80).forEach(([o]) => km.set(o[2], (km.get(o[2]) || 0) + 1));
      const top = [...km].sort((a, b) => b[1] - a[1]).slice(0, 6); if (top.length) H.push(`<h4 class="ak-dpgrup ak-katj">${ikon(IK_KAMPUS, "currentColor")}<b>Kampus</b></h4><div class="ak-pil">${top.map(([k, n]) => `<button type="button" class="ak-mp ak-mp-b" data-kp="${esc(k)}">${esc(k)} <b>${angka(n)}</b></button>`).join("")}</div>`); }
    if (/lsm|ngo|masyarakat sipil|organisasi|civil|yayasan|komunitas/.test(sas)) { const lb = lbArr.filter(y => /lsm-yayasan|koperasi|asosiasi|ormawa/.test(y.kategori) && strs(y.sektor).some(r => rp.includes(r))).sort((a, b) => (b._skor || 0) - (a._skor || 0)).slice(0, 6);
      if (lb.length) H.push(`<h4 class="ak-dpgrup ak-katj">${ikon(IK_GEDUNG, "currentColor")}<b>Lembaga</b></h4>${daftarBkr(lb.map(barisLb))}`); }
    return H.length ? `<section class="ak-dbagian"><div class="ak-disi"><h3>Cocok mengajukan</h3>${H.join("")}<p class="ak-lper">Dicocokkan dari kata kunci dan sektor skema terhadap topik pakar berkampus di Indonesia, kampus asal pakar itu dan lembaga sejenis.</p></div></section>` : "";
  }
  /* grafik ringkasan bisa diklik: daftar butir kelompok dengan penjelasannya, plus tombol saring */
  let PRE = null, GRUPAKTIF = null;
  const aplikasiPre = (tab, obj) => { if (PRE?.tab === tab && obj[PRE.field] instanceof Set) { obj[PRE.field] = new Set([PRE.value]); PRE = null; } };
  const GRUP = {
    sd: {judul: "sistem data", arr: () => sdArr, kel: (x, f) => f === "sektor" ? strs(x.sektor) : f === "akses" ? [x.akses] : [x.pemilik], view: "sistem_data"},
    "in": {judul: "inovasi", arr: () => inArr, kel: (x, f) => f === "sektor" ? strs(x.sektor) : [x[f]], view: "inovasi"},
    dn: {judul: "proyek pendanaan", arr: () => pdArr.filter(x => x.jenis_entri === "proyek"), kel: (x, f) => [x[f]], view: "pendanaan"},
    lb: {judul: "lembaga", arr: () => lbArr.filter(x => x.kategori !== "penerbit"), kel: (x, f) => [f === "kategori" ? x.kategori : x._skala], view: "lembaga"},
    bk: {judul: "buku", arr: () => bkArr, kel: (x, f) => strs(x.sektor), view: "pustaka"}};
  const itemGrup = (tab, x) => tab === "sd" ? barisSd(x) : tab === "in" ? barisInovasi(x) : tab === "dn" ? barisDana(x) : tab === "lb" ? barisLb(x)
    : barisKaya({attr: hrefAttr(urlOk(x.url)), logo: lgoIkon([], IKJ, (SEKTOR[strs(x.sektor)[0]] || [])[2] || "var(--data1)"), nama: x.judul, jelas: x.ringkas, pil: pilJenis(x.jenis) + pilSektorN(x.sektor), fakta: [x.penerbit, x.tahun].filter(Boolean).join(", ")});
  /* pop-up kelompok: kepala navy berikon, ringkasan pil berangka yang menyaring isi, lalu baris kaya */
  const SEK_FIELD = {sd: "akses", "in": "status", dn: "status", bk: "jenis"};
  function sekGrup() { const {tab, field} = GRUPAKTIF, f = tab === "lb" ? (field === "kategori" ? "_skala" : "kategori") : SEK_FIELD[tab]; return f && f !== field ? f : ""; }
  const sekNilai = (x, f) => f === "jenis" ? [x.jenis] : GRUP[GRUPAKTIF.tab].kel(x, f);
  const sekInfo = (f, v) => f === "status" ? (STATUS_ID[String(v).toLowerCase()] || [kapital(String(v)), STATUS_IN[v] || "var(--ink2)"]) : f === "akses" ? [(AKSES[v] || [v])[0], (AKSES[v] || [])[1] || "var(--ink2)"] : f === "kategori" ? [(KAT[v] || [v])[0], (KAT[v] || [])[2] || "var(--ink2)"] : f === "_skala" ? [kapital(String(SKALA_L[v] || v)), "var(--ink2)"] : [kapital(String(v || "")), "var(--ink2)"];
  function isiGrup() {
    const G = GRUPAKTIF, f = sekGrup(), n = {}; if (f) G.a.forEach(x => { for (const v of sekNilai(x, f)) if (v) n[v] = (n[v] || 0) + 1; });
    const ring = f && Object.keys(n).length > 1 ? `<div class="ak-gring" role="group" aria-label="Saring isi">${Object.entries(n).sort((a, b) => b[1] - a[1]).map(([v, c]) => { const [l, w] = sekInfo(f, v); return `<button type="button" class="ak-gpil" data-gf="${esc(v)}" aria-pressed="${G.gf.has(v)}" data-st="--w0:${w}"><i data-st="background:${w}"></i>${esc(l)}<b>${angka(c)}</b></button>`; }).join("")}</div>` : "";
    const a = G.gf.size ? G.a.filter(x => sekNilai(x, f).some(z => G.gf.has(z))) : G.a;
    return ring + daftarBkr(a.slice(0, 60).map(x => itemGrup(G.tab, x))) + (a.length > 60 ? `<p class="ak-lper">Menampilkan 60 dari ${angka(a.length)}. Saring daftar untuk melihat semuanya.</p>` : "");
  }
  const MUAT_GRUP = {sd: ["sistem_data", "sistem", a => { sdArr = a; }], "in": ["inovasi", "inovasi", a => { inArr = a; }], dn: ["pendanaan", "pendanaan", a => { pdArr = a; }]};
  function grupSheet(tab, field, value) {
    const g = GRUP[tab]; if (!g) return;
    if (!g.arr().length && MUAT_GRUP[tab]) { const [n, kunci, set] = MUAT_GRUP[tab]; ambilData(n).then(d => { const a = dlist(Array.isArray(d) ? d : d?.[kunci]); if (a.length) { set(a); grupSheet(tab, field, value); } }); return; }   /* kelompok dari tab lain: muat dulu supaya lembar tidak kosong */
    const a = g.arr().filter(x => g.kel(x, field).includes(value)); GRUPAKTIF = {tab, field, value, a, gf: new Set()};
    const lab = field === "sektor" ? (SEKTOR[value] || [value])[0] : field === "akses" ? (AKSES[value] || [value])[0] : field === "kategori" ? (KAT[value] || [value])[0] : kapital(String(SKALA_L[value] || value));
    const own = (field === "pemilik" || field === "pemberi") && lbArr.find(y => namaLb(y).includes(nrm(value)));
    const w = field === "sektor" ? (SEKTOR[value] || [])[2] : field === "akses" ? (AKSES[value] || [])[1] : field === "kategori" ? (KAT[value] || [])[2] : field === "status" ? STATUS_IN[value] : field === "jenis" && tab === "dn" ? JENIS_DANA[value] : "var(--data5)";
    bukaSheet("grup", `<div class="ak-dkepala"><div class="ak-dk-atas">${own ? logoLb(own) : (field === "pemilik" || field === "pemberi") && logoOrg(value, null).length ? lgoIkon(logoOrg(value, null), IK_GEDUNG, "var(--data1)") : `<span class="ak-lgo ak-lgo-k" data-st="--w0:${esc(w || "var(--data5)")}">${ikBar(field, value)}</span>`}<div class="ak-nama"><h2 id="akSJudul">${esc(lab)}</h2><p><b>${angka(a.length)}</b> ${g.judul}${own ? ` <button type="button" class="ak-pk" data-lb="${esc(own.id)}">Profil lembaga</button>` : ""}</p></div></div>${(() => { const st = tab === "in" ? [["Pembuat", IK_ORANG, new Set(a.flatMap(x => dlist(x.pembuat).map(b => b.nama))).size], ["TRL 7 ke atas", IK_BAR, a.filter(x => +x.trl >= 7).length], ["Sudah dipakai", IKON_PIN, a.filter(x => dlist(x.penerapan).length).length]] : tab === "lb" ? [["Berkontak", IK_TEL, a.filter(adaKontakLb).length], ["Strategis", STAR_D, a.filter(x => strat("L:" + x.id)).length], ["Provinsi", IKON_PIN, new Set(a.map(x => x.prov).filter(Boolean)).size]] : tab === "sd" ? [["Pemilik", IK_GEDUNG, new Set(a.map(x => x.pemilik).filter(Boolean)).size], ["Data terbuka", IK_DB, a.filter(x => /terbuka/.test(x.akses || "")).length], ["Dipakai", IK_BAR, a.filter(x => x.dipakai_pantau).length]] : []; return st.some(r => r[2]) ? `<div class="ak-metrik ak-mt-t">${st.map(([l, d, n]) => `<div><span class="ak-mlabel">${ikon(d, "currentColor")}${l}</span><b>${angka(n)}</b></div>`).join("")}</div>` : ""; })()}<button type="button" class="ak-ib ak-ib-saring" data-grapply="1" title="Saring daftar ke kelompok ini" aria-label="Saring daftar ke kelompok ini">${ikon('<path d="M3 5h18l-7 8v6l-4 2v-8z"/>', "currentColor")}</button></div></div>`, isiGrup);
    $("akSheet").dataset.k = "";
  }
  document.addEventListener("click", e => {
    const gg = e.target.closest("[data-g]"); if (gg && !e.target.closest("button[data-lb]")) { e.stopPropagation(); sheetG(gg.dataset.g); return; }
    const lt = e.target.closest(".ak-linimasa li span"); if (lt && !e.target.closest("a")) { lt.classList.toggle("terbuka"); return; }
    const sc = e.target.closest("[data-skcara]"); if (sc) { e.stopPropagation(); $("akSkCara")?.scrollIntoView({behavior: "smooth", block: "start"}); return; }
    const gf = e.target.closest("[data-gf]"); if (gf && GRUPAKTIF) { e.stopPropagation(); const v = gf.dataset.gf; GRUPAKTIF.gf = togglePilihan(GRUPAKTIF.gf, v); gf.parentElement.querySelectorAll("[data-gf]").forEach(b => b.setAttribute("aria-pressed", String(GRUPAKTIF.gf.has(b.dataset.gf)))); nanti(() => { const t = $("akSTubuh"); if (t) t.innerHTML = isiGrup(); }); return; }
    const ap = e.target.closest("[data-grapply]"); if (ap && GRUPAKTIF) { e.stopPropagation(); const {tab, field, value} = GRUPAKTIF, g = GRUP[tab]; tutupSheet();
      if (tab === "bk") { pustakaSub = "buku"; setSektor(value); return; }
      PRE = {tab, field: tab === "lb" ? (field === "kategori" ? "kat" : "skala") : field, value}; if (tab === "dn") PD.sub = "proyek"; if (tab === "lb") lbSub = "daftar"; delete sudah[g.view]; tampil(g.view); bukaView(g.view); return; }
    const br = e.target.closest("[data-bar]"); if (br) { const [tab, field, ...v] = br.dataset.bar.split("|"); if (MSG[tab]?.f.includes(field)) { e.stopPropagation(); msUbah(tab, field, v.join("|")); return; }   /* pemilik: memilih batang tidak menggulir halaman */
      grupSheet(tab, field, v.join("|")); } }, true);
  document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches?.("[data-bar]")) { e.preventDefault(); e.target.click(); } });
  let pustakaSub = "dok";

  /* grafik batang universal: label berikon, nilai lengkap (di luar batang bila pendek), bisa diklik/Enter, tooltip tetap */
  const IKAKSES = {"terbuka": '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>', "api-terbuka": '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>', "api-kunci": '<circle cx="8" cy="12" r="3.5"/><path d="M11.5 12H21M17 12v3M20 12v2"/>', "login": '<circle cx="9" cy="8" r="3"/><path d="M3 19c0-3 2.5-5 6-5"/><rect x="14" y="13" width="7" height="6" rx="1.5"/><path d="M15.5 13v-1.5a2 2 0 0 1 4 0V13"/>', "permohonan": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>', "tertutup": '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'};
  function ikBar(f, k) {
    if (f === "sektor") { const r = SEKTOR[k]; return r ? ikon(r[1], r[2]) : ""; }
    if (f === "akses") return ikon(IKAKSES[k] || IK_DB, (AKSES[k] || [])[1] || "currentColor");
    if (f === "kategori") { const c = KAT[k]; return c ? ikon(c[1], c[2]) : ""; }
    if (f === "jenis" && IN_TAB()) return ikon(ikJenis(k), "var(--data5)");
    if (f === "jenis") return ikon(IK_UANG, JENIS_DANA[k] || "currentColor");
    if (f === "status") return `<i class="ak-dot" data-st="background:${STATUS_IN[k] || "var(--ink2)"}"></i>`;
    if (f === "pemilik" || f === "pemberi") { const y = lbArr.find(z => namaLb(z).includes(nrm(k))); return y ? logoLb(y).replace('class="ak-lgo"', 'class="ak-lgo kecil"') : lgoIkon(logoOrg(k, null), f === "pemberi" ? IK_UANG : IK_GEDUNG, "var(--ink2)", 1); }
    return ikon(IK_GEDUNG, "currentColor");
  }
  let barTabAktif = "";
  const IN_TAB = () => barTabAktif === "in";
  /* satu baris batang untuk semua grafik: label berikon, batang tipis 10px, angka tebal + persen kecil di kanan */
  const persenTxt = (c, tot) => { const p = tot ? c / tot * 100 : 0; return (p > 0 && p < 1 ? "<1" : angka(Math.round(p))) + "%"; };
  const barHtml = ({attr = "", cls = "", warna, label, lebar, nilai, persen}) => `<div class="ak-br ${cls}" tabindex="0" ${attr} data-st="--w0:${warna}"><span class="ak-bl">${label}</span><span class="ak-bt"><i data-st="width:${Math.max(3, Math.min(100, lebar))}%"></i></span><span class="ak-bv"><b>${nilai}</b>${persen ? `<small>(${persen})</small>` : ""}</span></div>`;
  function batang(rows, o) {
    barTabAktif = o.tab; const mx = Math.max(1, ...rows.map(r => r[1])), tot = o.tot || rows.reduce((a, r) => a + r[1], 0);
    return `<div class="ak-bars">${rows.map(([k, c]) => { const w = o.warna(k) || "var(--ink2)", l = o.lab(k), v = o.fmt ? o.fmt(c) : angka(c), pt = persenTxt(c, tot);
      return barHtml({cls: "ak-brx", warna: w, lebar: c / mx * 100, nilai: esc(v), persen: pt, label: ikBar(o.field, k) + esc(l),
        attr: `role="button" data-bar="${esc(o.tab + "|" + o.field + "|" + k)}" data-tt="${esc(l)}" data-tv="${esc(v + (o.sat ? " " + o.sat : ""))}" data-tk="${esc(pt + " dari total. Klik untuk daftar")}" data-tc="${esc(w)}"`}); }).join("")}</div>`; }
  /* keadaan kosong menyebut saringan aktif dan menawarkan jalan keluar */
  const TOTAL_NOUN = {lembaga: () => lbArr.length, inovasi: () => inArr.length, sistem: () => sdArr.length, dokumen: () => puArr.length, buku: () => bkArr.length, berita: () => brArr.length, tokoh: () => tkArr.length, proyek: () => pdArr.length, skema: () => pdArr.length};
  const hampa = noun => { const tot = (TOTAL_NOUN[noun] || (() => 0))();
    return `<div class="ak-hampa2"><p class="ak-khampa">${GL.r ? `Belum ada ${esc(noun)} untuk ${esc(namaGL())}.` : `Tidak ada ${esc(noun)} yang cocok dengan saringan ini.`}${tot ? ` ${angka(tot)} ${esc(noun)} tersedia tanpa saringan ini.` : ""}</p><div class="ak-pil">${GL.r ? '<button type="button" class="ak-rbtn ak-rbtn-b" data-semuasektor="1">Tampilkan semua sektor</button>' : ""}<button type="button" class="ak-rbtn" data-hapussaring="1">Hapus semua saringan</button></div></div>`; };
  const glT = () => GL.r ? " " + esc(namaGL()) : "";
  /* ----- pengalih tampilan ----- */
  const VIEW = {
    pakar: ["Orang", IK_ORANG], lembaga: ["Organisasi", IK_GEDUNG], proyek: ["Proyek", '<path d="M3 21V9l6 4V9l6 4V5h6v16z"/>'], regulasi: ["Regulasi", IKJ], wilayah: ["Wilayah", IKON_PIN], inovasi: ["Inovasi", KAT.inovasi[1]], sistem_data: ["Sistem data", '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>'], pendanaan: ["Pendanaan", IK_UANG], pustaka: ["Pustaka", IKJ], berita: ["Berita", '<path d="M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M7 9h7M7 13h7M7 16h4"/>'], riset: ["Riset", IKON_PIN], kejadian: ["Jejak isu", '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/>'],
    pusat: ["Pusat studi", '<path d="M4 21V8l8-5 8 5v13"/><path d="M9 21v-6h6v6M8 10h.01M16 10h.01"/>']};
  /* Tab Jurnal disembunyikan 30 Okt 2026: jurnal kini tampil di profil kampus/lembaga penerbitnya (jurnalKampus). Pulihkan tab:
     jurnal: ["Jurnal", IKJ] di VIEW dan jurnal: ["jurnal", bangunJur, d => Array.isArray(d) && d.length] di MUAT. */
  /* Pengadaan kajian disembunyikan atas permintaan pemilik 30 Okt 2026. Pulihkan: tambah lagi ke VIEW dan MUAT
     pengadaan: ["Pengadaan kajian", '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 15h2"/>'] dan pengadaan: ["pengadaan", bangunPeng, d => Array.isArray(d) && d.length] */
  DATA.wilayah = Promise.resolve([{}]);
  const MUAT = {proyek: ["proyek", bangunProyekBaru, d => Array.isArray(d) && d.length], regulasi: ["regulasi", bangunRegulasi, d => Array.isArray(d?.baris) && d.baris.length], pendanaan: ["pendanaan", bangunDana, d => Array.isArray(d?.pendanaan ?? d) && (d?.pendanaan ?? d).length], wilayah: ["wilayah", bangunWilayah, () => true], pustaka: ["dokumen", bangunPustaka, d => Array.isArray(d?.dokumen ?? d) && (d?.dokumen ?? d).length > 0], berita: ["berita", bangunBerita, d => Array.isArray(d?.berita ?? d) && (d?.berita ?? d).length], tokoh: ["tokoh", bangunTokoh, d => Array.isArray(d?.tokoh ?? d) && (d?.tokoh ?? d).length], sistem_data: ["sistem_data", bangunSd, d => Array.isArray(d?.sistem ?? d) && (d?.sistem ?? d).length], inovasi: ["inovasi", bangunInovasi, d => Array.isArray(d?.inovasi ?? d) && (d?.inovasi ?? d).length], lembaga: ["lembaga", bangunLembaga, d => Array.isArray(d?.lembaga ?? d) && (d?.lembaga ?? d).length], riset: ["riset", (p, d) => { indeksRiset(d); bangunRiset(p); }, d => Array.isArray(d) && d.length], kejadian: ["jejak_isu", bangunKej, d => Array.isArray(d?.kejadian) && d.kejadian.length],
    pusat: ["pusat_studi", bangunPs, d => Array.isArray(d) && d.length]};
  const sudah = {};
  let tampilSkrg = "pakar";
  const bacaTampil = () => { try { const v = localStorage.getItem(TAMPIL_KEY); return RUMAH[v] ? null : v; } catch (e) { return null; } };
  /* tab yang datanya gagal/kosong hilang dari bilah (tanpa kotak galat); sub-tab yang gagal dilepas, tab tanpa sub-tab tersisa jatuh ke Orang */
  function sembunyiTab(view) {
    const tab = TABS.find(k => k === view || (SUBTAB[k] || []).some(x => x[2] === view)); if (!tab || tab === "pakar" || tab === "lembaga") return;
    const sisa = (SUBTAB[tab] || []).filter(x => x[2] !== view); SUBTAB[tab] && (SUBTAB[tab] = sisa);
    if (sisa.length) { if (tabSkrg === tab && tampilSkrg === view) tampil(tab, sisa[0][0]); return; }
    const b = $("akTampil").querySelector(`[data-t="${tab}"]`); if (b) b.hidden = true; if (tabSkrg === tab) tampil("pakar");
  }
  const TAB_DATA = ["inovasi", "riset", "sistem_data", "pendanaan", "pustaka"];
  const tabAda = tab => { const m = MUAT[tab]; return m ? ambilData(m[0]).then(d => { try { return !!m[2](d); } catch (e) { return false; } }) : Promise.resolve(false); };
  function bukaView(v) {
    const [nama, bangun, sah] = MUAT[v], p = $("akv-" + v);
    if (sudah[v]) return;
    sudah[v] = true; p.innerHTML = hantuHtml;
    const gagal = () => { delete sudah[v]; p.innerHTML = ""; sembunyiTab(v); };
    ambilData(nama).then(d => { if (!sah(d)) { gagal(); return; } nanti(() => { try { p.innerHTML = ""; bangun(p, d); segarSektor(); } catch (e) { console.error(e); delete sudah[v]; p.innerHTML = ""; sembunyiTab(v); } }); });
  }
  function pasangTampil(v, sub) {
    muatLogoPem(); pasangCari(); nanti(() => siapGraf().then(() => { if ($("akLL") && lbHasil.length) gambarLb(false); if ($("akPjL") && typeof gambarPj === "function") gambarPj(false); if ($("akPdStack") && reStk) reStk(); })); nanti(muatGrafLogo); nanti(muatFotoPakar); nanti(muatStrat); nanti(muatDiaspora); nanti(muatBFoto); nanti(muatLambang); nanti(muatLogoPem);
    segarSektor(); $("akSektor").hidden = false;
    $("akSektor").addEventListener("click", e => { const b = e.target.closest("button[data-r]"); if (!b) return; const k = b.dataset.r, baru = new Set(GL.set); if (!k) baru.clear(); else baru.has(k) ? baru.delete(k) : baru.add(k);
      document.querySelectorAll("#akSektor button[data-r]").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.r === "" ? !baru.size : baru.has(x.dataset.r)))); nanti(() => setSektorSet([...baru])); });
    $("akPkSeg").addEventListener("click", e => { const b = e.target.closest("button[data-v]"); if (b) pilihKelompok(b.dataset.v); });
    $("akTampil").innerHTML = TABS.map(k => `<button type="button" data-t="${k}" aria-pressed="false">${ikon(VIEW[k][1], "currentColor")}${TAB_LABEL[k] || VIEW[k][0]}</button>`).join("");
    TAB_DATA.forEach(k => { const b = $("akTampil").querySelector(`[data-t="${k}"]`); if (b) b.hidden = true; if (k !== "pustaka") tabAda(k).then(ok => { if (ok && b) b.hidden = false; }); });   // tab data muncul hanya bila datanya termuat
    $("akSubTab").addEventListener("click", e => { const b = e.target.closest("button[data-v]"); if (b) tampil(tabSkrg, b.dataset.v); });
    document.querySelectorAll(".ak-tabpanah").forEach(b => b.addEventListener("click", () => $("akTampil").scrollBy({left: +b.dataset.d * 220, behavior: "smooth"})));
    $("akTampil").hidden = false;
    $("akTampil").addEventListener("click", e => { const b = e.target.closest("button[data-t]"); if (b) tampil(b.dataset.t); });
    periksaSub();
    const tujuan = VIEW[v] || LAMA[v] ? v : "pakar", tabT = (LAMA[tujuan] || [tujuan])[0];
    if (tabT === "pustaka") { location.replace("/pustaka"); return; }   /* pemilik 8 Nov 2026: Pustaka satu rumah di /pustaka */
    if (TAB_DATA.includes(tabT)) tabAda(tabT).then(ok => tampil(ok ? tujuan : "pakar", ok ? sub : "")); else tampil(tujuan, sub);   // tautan ke tab tanpa data jatuh ke Orang
  }
  const INTRO = {};   // kalimat pembuka dimatikan (pemilik 30 Okt 2026)
  function setBuka(v) { const el = $("akBuka"); if (el) el.hidden = true; return; /* kalimat pembuka dihilangkan atas permintaan pemilik 30 Okt 2026; pulihkan: hapus baris ini */ const t = INTRO[v]; if (!t) { el.hidden = true; return; } if (typeof t === "string") { el.textContent = t + "."; el.hidden = false; return; }
    el.textContent = t[0] + "."; el.hidden = false; ambilData(t[1]).then(d => { const a = dlist(Array.isArray(d) ? d : d && Object.values(d).find(Array.isArray)), tg = a.map(x => String(x?.diperiksa || "")).filter(Boolean).sort().pop(); if (tampilSkrg === v) el.textContent = t[0] + (tg ? `; diperiksa ${tglID(tg)}` : "") + "."; }); }
  /* 8 tab utama; Pustaka dan Riset punya sub-tab. ?tampil= lama (berita, riset, kejadian, pusat, aset) diarahkan ke tab+sub baru */
  const TABS = ["pakar", "lembaga", "inovasi", "riset", "sistem_data", "pendanaan", "pustaka"], TAB_LABEL = {riset: "Riset", pakar: "Orang", lembaga: "Organisasi"};
  const SUBTAB = {pustaka: [["dok", "Dokumen", "pustaka"], ["buku", "Buku", "pustaka"], ["berita", "Berita", "berita"]], riset: [["riset", "Riset", "riset"], ["jejak-isu", "Jejak isu", "kejadian"], ["pusat", "Pusat studi", "pusat"], ["aset", "Aset riset", "pusat"]]};
  const LAMA = {berita: ["pustaka", "berita"], riset: ["riset", "riset"], kejadian: ["riset", "jejak-isu"], "jejak-isu": ["riset", "jejak-isu"], pusat: ["riset", "pusat"], aset: ["riset", "aset"], pustaka: ["pustaka", "dok"], buku: ["pustaka", "buku"], dokumen: ["pustaka", "dok"], tokoh: ["pakar", ""]};
  let tabSkrg = "pakar";
  /* sub-tab yang datanya kosong dilepas dari bilah; tiap tab dan sub-tab berikon 18px */
  const SUB_DATA = {dok: "dokumen", buku: "buku", berita: "berita", riset: "riset", "jejak-isu": "jejak_isu", pusat: "pusat_studi", aset: "aset_riset"};
  const adaIsi = d => Array.isArray(d) ? d.length > 0 : !!d && typeof d === "object" && Object.values(d).some(v => Array.isArray(v) && v.length);
  const ikSub = (tab, v) => ikon((VIEW[v] || VIEW[tab] || VIEW.pakar)[1], "currentColor");
  const gambarSub = sub => { const sl = SUBTAB[tabSkrg], b = $("akSubTab"); b.hidden = !sl || sl.length < 2; if (sl) b.innerHTML = sl.map(([k, l, v]) => `<button type="button" data-v="${k}" aria-pressed="${k === sub}">${ikSub(tabSkrg, v)}${l}</button>`).join(""); };
  function periksaSub() { for (const tab of Object.keys(SUBTAB)) for (const [k] of SUBTAB[tab].slice()) ambilData(SUB_DATA[k]).then(d => { if (adaIsi(d)) return; const sl = SUBTAB[tab]; if (!sl || sl.length < 2) return; SUBTAB[tab] = sl.filter(x => x[0] !== k);
    if (tabSkrg === tab) { const ada = SUBTAB[tab].some(x => x[0] === (new URL(location.href).searchParams.get("sub"))); ada ? gambarSub(new URL(location.href).searchParams.get("sub")) : tampil(tab, SUBTAB[tab][0][0]); } }); }
  const sinkron = (id, val, n = 0) => { const b = document.querySelector(`#${id} [data-v="${val}"]`); if (b) { if (b.getAttribute("aria-pressed") !== "true") b.click(); } else if (n < 40) setTimeout(() => sinkron(id, val, n + 1), 150); };
  /* urutan: tab utama, sub-tab (sub-tab di dalam panel ikut dihitung), baru pilihan sektor */
  /* segmen sub-tampilan tiap view (Peta/Daftar/Proyek mitra, Skema/Proyek/Negara donor, dst.) dipindah ke wadah kepala navy, hanya yang view aktif tampil; panel sektor tetap di bawah kepala */
  /* pilihan sektor hanya tampil di tab yang benar-benar disaringnya; Riset daerah punya chip sektor sendiri, Aset riset, Pusat studi, dan Wilayah tidak disaring */
  const SEKTOR_VIEW = new Set(["pakar", "proyek", "pustaka", "dok", "buku", "berita"]);
  function letakSektor() { const bp = document.querySelector(".ak-bpanel"), ak = document.querySelector(".ak"), nav = document.querySelector(".ak-kepala-nav"); if (!bp || !ak || !nav) return;
    document.querySelectorAll("[id^=akv-]").forEach(v => { const f = v.firstElementChild; if (f?.matches?.(".ak-seg")) { const vw = v.id.slice(4); nav.querySelectorAll(`[data-hero-view="${vw}"]`).forEach(lama => lama.remove()); if (f.id) nav.querySelectorAll(`#${CSS.escape(f.id)}`).forEach(lama => lama.remove());   // panel digambar ulang: segmen lama dibuang, jangan menumpuk
      f.dataset.heroView = vw; f.classList.remove("ak-segmeng"); nav.append(f); } });
    nav.querySelectorAll("[data-hero-view]").forEach(e => { e.hidden = e.dataset.heroView !== tampilSkrg; });
    if (ak.firstElementChild !== bp) ak.prepend(bp);
    bp.hidden = !SEKTOR_VIEW.has(tampilSkrg);   // satu-satunya penentu visibilitas panel sektor
    if (bp.hidden && GL.set.size) nanti(() => { if (bp.hidden && GL.set.size) setSektorSet([]); }); }   // panel tersembunyi = saringan sektor dilepas, ?sektor= tidak terbawa ke tab lain
  /* panel diisi asinkron: tiap kali isi panel tingkat atas berganti, letak pilihan sektor dihitung ulang */
  const amatPanel = new MutationObserver(() => letakSektor());
  document.querySelectorAll("[id^=akv-]").forEach(v => amatPanel.observe(v, {childList: true}));
  function tampil(v, sub) {
    if (sub === "analisa") sub = "daftar"; if (v === "lembaga" && sub === "proyek") { v = "pendanaan"; sub = "proyek"; PD.sub = "proyek"; }
    const [tab, sb] = LAMA[v] || [v, ""], sl = SUBTAB[tab]; sub = sub || sb; if (sl && !sl.some(x => x[0] === sub)) sub = sl[0][0];
    const view = sl ? sl.find(x => x[0] === sub)[2] : tab; tabSkrg = tab;
    tampilSkrg = view;
    $("akTampil").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.t === tab)));
    $("akTampil").querySelector(`[aria-pressed=true]`)?.scrollIntoView({block: "nearest", inline: "center"});
    gambarSub(sub);
    $("akIsi").hidden = view !== "pakar";
    Object.keys(MUAT).forEach(k => { $("akv-" + k).hidden = k !== view; });
    nanti(() => { dpSegarkan(); setBuka(view); segarSektor(); if (view === "pakar" && saringKotor) { saringKotor = false; saring(); } });
    try { const u = new URL(location.href); if (tab === "pakar") u.searchParams.delete("tampil"); else u.searchParams.set("tampil", tab); sl ? u.searchParams.set("sub", sub) : u.searchParams.delete("sub"); history.replaceState(null, "", u); localStorage.setItem(TAMPIL_KEY, tab); } catch (e) {}
    pasangPkSeg(view); letakSektor(); { const bp = document.querySelector(".ak-bpanel"); if (bp) bp.classList.toggle("ak-sembunyi", view === "wilayah"); } if (view !== "pakar") nanti(async () => { await bukaView(view); letakSektor(); });
    if (sub === "dok" || sub === "buku") sinkron("akPuS", sub); else if (sub === "pusat" || sub === "aset") sinkron("akPS", sub);
  }

  /* ----- baru bulan ini: pil di kartu dan saringan ----- */
  async function muatBaru() {
    const d = await ambilData("baru"), ids = dlist(d?.baru).filter(id => peta.has(id));
    if (!ids.length) return;
    baruSet = new Set(ids); $("akBaruN").textContent = angka(ids.length); $("akBaruTog").hidden = false; gambar(false);
  }

  /* ----- bagian tambahan di dialog pakar: riset wilayah dan penulis bersama ----- */
  function extraPakar(o) {
    const id = o[0];
    ambilData("pakar_ekstra").then(d => { const x = d?.[id], el = $("akDIsi"); if (!x || karyaId !== id || !el) return;
      if (x.orcid && !o[7] && !$("akTautan")?.querySelector('a[href*="orcid.org"]')) $("akTautan")?.insertAdjacentHTML("beforeend", `<a href="https://orcid.org/${esc(x.orcid)}" ${LUAR}>ORCID${ikon(IK_LUAR, "currentColor")}</a>`);
      if (dlist(x.dana).length) { el.querySelector(".ak-dana-p")?.remove();
        el.insertAdjacentHTML("beforeend", `<section class="ak-bg ak-dana-p"><h3><i class="ak-kotak"></i>PENYANDANG DANA RISET</h3><ul class="ak-lsumber">${dlist(x.dana).filter(f => f.nama && f.karya).map(f => `<li><b>${esc(f.nama)}</b> <small class="ak-lper">${esc(`${angka(f.karya)} karya${f.tahun ? ", terakhir " + f.tahun : ""}`)}</small>${f.contoh?.url && urlOk(f.contoh.url) ? ` <small class="ak-lper">${tautanLuar(urlOk(f.contoh.url), esc(f.contoh.judul || "contoh karya"))}</small>` : ""}</li>`).join("")}</ul><small class="ak-lper">Sumber OpenAlex, dari pernyataan pendanaan di makalah (Crossref Funder Registry); hanya karya 2015 ke atas</small></section>`); }
      if (x.jabatan) { el.querySelector(".ak-jabatan-p")?.remove(); const j = x.jabatan, th = (a, b) => [a, b].filter(Boolean).map(v => String(v).slice(0, 4)).join(" sampai ");
        el.insertAdjacentHTML("beforeend", `<section class="ak-bg ak-jabatan-p"><h3><i class="ak-kotak"></i>RIWAYAT JABATAN</h3><ul class="ak-lsumber">${j.sekarang ? `<li><b>${esc(j.sekarang.organisasi)}</b> <small class="ak-lper">${esc(["sekarang", j.sekarang.negara, j.sekarang.mulai ? "sejak " + String(j.sekarang.mulai).slice(0, 4) : ""].filter(Boolean).join(", "))}</small></li>` : ""}${dlist(j.riwayat).filter(r => !j.sekarang || r.organisasi !== j.sekarang.organisasi || r.selesai).map(r => `<li>${esc(r.organisasi)} <small class="ak-lper">${esc([r.peran, r.negara, th(r.mulai, r.selesai)].filter(Boolean).join(", "))}</small></li>`).join("")}</ul><small class="ak-lper">${urlOk(j.sumber_url) ? tautanLuar(urlOk(j.sumber_url), /orcid/.test(j.sumber_url) ? "Sumber ORCID" : "Sumber OpenAlex") : "Sumber ORCID"}, diisi sendiri oleh pakar</small></section>`); }
      if (dlist(x.dataset).length) { el.querySelector(".ak-dataset-p")?.remove();
        el.insertAdjacentHTML("beforeend", `<section class="ak-bg ak-dataset-p"><h3><i class="ak-kotak"></i>DATASET TERBUKA</h3><ul class="ak-lsumber">${dlist(x.dataset).map(t => `<li>${urlOk(t.url) ? tautanLuar(urlOk(t.url), esc(t.judul)) : esc(t.judul)} <small class="ak-lper">${esc([t.repositori, t.tahun].filter(Boolean).join(", "))}</small></li>`).join("")}</ul><small class="ak-lper">Dicocokkan lewat ORCID pembuat dataset</small></section>`); }
      /* bidang keahlian dan rekan penulis di direktori (OpenAlex, karya energi terbarukan 2015 ke atas) */
      if (dlist(x.topik).length) { el.querySelector(".ak-topik-p")?.remove();
        el.insertAdjacentHTML("beforeend", `<section class="ak-bg ak-topik-p"><h3><i class="ak-kotak"></i>BIDANG KEAHLIAN EBET</h3><ul class="ak-lsumber">${dlist(x.topik).filter(t => t.nama).map(t => `<li><b>${esc(t.nama)}</b>${t.karya ? ` <small class="ak-lper">${esc(angka(t.karya) + " karya")}</small>` : ""}</li>`).join("")}</ul><small class="ak-lper">Sumber OpenAlex, topik karya pakar; hanya topik energi terbarukan</small></section>`); }
      const rek = dlist(x.rekan).map(r => [r, peta.get(r.id)]).filter(([, p]) => p);
      if (rek.length) { el.querySelector(".ak-rekan-p")?.remove();
        el.insertAdjacentHTML("beforeend", `<section class="ak-bg ak-rekan-p"><h3><i class="ak-kotak"></i>REKAN PENULIS DI DIREKTORI</h3><ul class="ak-lsumber">${rek.map(([r, p]) => `<li><button type="button" class="ak-rk-b" data-buka="${esc(p[0])}">${esc(p[1])}</button> <small class="ak-lper">${esc(`${p[2]}, ${angka(r.karya)} karya bersama${r.tahun ? ", terakhir " + r.tahun : ""}`)}</small></li>`).join("")}</ul><small class="ak-lper">Sumber OpenAlex, karya energi terbarukan bersama sejak 2015</small></section>`); }
      if (!dlist(x.paten).length) return; el.querySelector(".ak-paten-p")?.remove();
      el.insertAdjacentHTML("beforeend", `<section class="ak-bg ak-paten-p"><h3><i class="ak-kotak"></i>PATEN</h3><ul class="ak-lsumber">${dlist(x.paten).map(p => `<li>${urlOk(p.sumber_url) ? tautanLuar(urlOk(p.sumber_url), esc(kapital(String(p.judul).toLowerCase()))) : esc(p.judul)} <small class="ak-lper">${esc([p.status === "diberi" ? "Paten diberi" : ["Permohonan", p.status].filter(Boolean).join(" "), p.jenis, p.nomor, tglID(p.tanggal), p.pemegang].filter(Boolean).join(", "))}</small></li>`).join("")}</ul><small class="ak-lper">Sumber PDKI DJKI; penemu dicocokkan dari nama dan afiliasi</small></section>`); });
    ambilData("tokoh").then(d => { const tkh = dlist(Array.isArray(d) ? d : d?.tokoh).find(x => x.pakar_id === id), el = $("akDIsi"); if (!tkh || karyaId !== id || !el || !dlist(tkh.kiprah).length) return; el.querySelector(".ak-kiprah-tk")?.remove();
      el.insertAdjacentHTML("beforeend", `<section class="ak-bg ak-kiprah-tk"><h3><i class="ak-kotak"></i>KIPRAH EBET</h3>${tkh.peran_energi ? pilPeranKb(tkh.peran_energi) : ""}<ol class="ak-linimasa">${dlist(tkh.kiprah).slice().sort((p, q) => (+q.tahun || 0) - (+p.tahun || 0)).map(k => `<li${k.tahun ? "" : ' class="tanpa-th"'}><b>${esc(k.tahun || "")}</b><span>${esc(bersihWiki(k.teks))} ${cip(k.sumber_url)}</span></li>`).join("")}</ol></section>`); });
    ambilData("buku").then(d => { const a = dlist(Array.isArray(d) ? d : d?.buku).filter(b => dlist(b.penulis).some(p => p.pakar_id === id)), sek = $("akBukuP"); if (!a.length || karyaId !== id || !sek) return;
      sek.querySelector("div").innerHTML = `<ul class="ak-lsumber">${a.slice(0, 8).map(b => `<li>${urlOk(b.url) ? tautanLuar(urlOk(b.url), esc(b.judul)) : esc(b.judul)} <small class="ak-lper">${esc([b.penerbit, b.tahun].filter(Boolean).join(", "))}</small></li>`).join("")}</ul>`; sek.hidden = false; });
    ambilData("afiliasi").then(d => { const a = dlist(d?.[id]).filter(x => x && x.nama_lembaga), sek = $("akAfl"); if (!a.length || karyaId !== id || !sek) return;
      sek.querySelector("div").innerHTML = `<div class="ak-afg">${a.map(x => { const th = [x.mulai, x.selesai].filter(Boolean), per = kapital(String(x.peran || x.peran_asli || "").trim());
        const isi = `${lgoIkon(logoOrg(x.nama_lembaga, x.lembaga_id), IK_GEDUNG, "var(--line-ctl)")}<span class="ak-afg-t"><b>${esc(x.nama_lembaga)}</b><span class="ak-pil">${per ? `<span class="ak-mp">${ikon(IK_ORANG, "currentColor")}${esc(per)}</span>` : ""}${th.length ? `<span class="ak-mp">${ikon(IKP.tahun, "currentColor")}${th.length > 1 ? esc(th.join(" sampai ")) : "Sejak " + esc(th[0])}</span>` : ""}</span></span>`;
        return x.lembaga_id ? `<button type="button" class="ak-afg-i" data-lb="${esc(x.lembaga_id)}">${isi}</button>` : `<div class="ak-afg-i">${isi}</div>`; }).join("")}</div>`; sek.hidden = false; });
    ambilData("berita").then(d => { const a = dlist(Array.isArray(d) ? d : d?.berita).filter(b => dlist(b?.entitas).some(e => e.jenis === "pakar" && e.id === id)).sort((x, y) => String(y.tanggal).localeCompare(String(x.tanggal))), sek = $("akBrP"); if (!a.length || karyaId !== id || !sek) return;
      sek.querySelector("div").innerHTML = `<ul class="ak-lsumber">${a.slice(0, 5).map(b => `<li>${urlOk(b.url) ? tautanLuar(urlOk(b.url), esc(b.judul)) : esc(b.judul)} <small class="ak-lper">${esc([b.media, tglID(b.tanggal)].filter(Boolean).join(", "))}</small></li>`).join("")}</ul>${a.length > 5 ? `<button type="button" class="ak-pk" data-brt="pakar:${esc(id)}">Lihat semua ${angka(a.length)} berita</button>` : ""}`; sek.hidden = false; });
    ambilData("riset").then(d => { if (!Array.isArray(d) || karyaId !== id) return; nanti(() => {
      indeksRiset(d); const a = pakarRiset.get(id) || [], sek = $("akRisetW"); if (!a.length || karyaId !== id || !sek) return;
      const n = {}; for (const x of a) for (const key of new Set(dlist(x.wilayah).filter(w => w && w.prov).map(w => w.kab ? w.prov + "|" + w.kab : String(w.prov)))) n[key] = (n[key] || 0) + 1;
      const top = Object.entries(n).sort((x, y) => y[1] - x[1]).slice(0, 10);
      if (!top.length) return;
      sek.querySelector(".ak-wchip").innerHTML = top.map(([key, c]) => { const i = key.indexOf("|"), lab = i < 0 ? provT(key) : `${key.slice(i + 1)}, ${provT(key.slice(0, i))}`;
        return `<button type="button" class="ak-wc" data-rw="${esc(key)}" title="Lihat riset wilayah ini">${ikon(IKON_PIN, "currentColor")}${esc(lab)}<small>${angka(c)}</small></button>`; }).join("");
      sek.hidden = false; }); });
    ambilData("kolaborasi").then(d => { if (!d || typeof d !== "object" || !Object.hasOwn(d, id) || karyaId !== id) return;
      const l = dlist(d[id]).filter(x => x && peta.has(x.id)).sort((x, y) => (y.n || 0) - (x.n || 0)).slice(0, 8), sek = $("akKolab"); if (!l.length || !sek) return;
      sek.querySelector("ol").innerHTML = l.map(x => { const p = peta.get(x.id), ct = dlist(x.contoh)[0]?.judul;
        return `<li><button type="button" class="ak-sbuka" data-pk="${esc(p[0])}"${ct ? ` title="${esc(ct)}"` : ""}>${foto(p)}<span><b>${esc(p[1])}</b><small>${esc(p[2])}</small></span></button><em class="ak-hp"><b>${angka(x.n)}</b> karya bersama</em></li>`; }).join("");
      sek.hidden = false; });
  }
  document.addEventListener("click", e => {
    if (e.target.closest("[data-semuasektor]")) { e.stopPropagation(); nanti(() => setSektor("")); return; }
    if (e.target.closest("[data-hapussaring]")) { e.stopPropagation(); nanti(() => setSektor("")); return; }
    const sl = e.target.closest("[data-salin]"); if (sl) { e.stopPropagation(); try { navigator.clipboard.writeText(sl.dataset.salin); sl.classList.add("ok"); setTimeout(() => sl.classList.remove("ok"), 1200); } catch (er) {} return; }
    const pm = e.target.closest("[data-pelmore]"); if (pm) { e.stopPropagation(); pm.nextElementSibling.hidden = false; pm.remove(); return; }
    const rp = e.target.closest("[data-rpn]"); if (rp) { e.stopPropagation(); nanti(() => setSektor(rp.dataset.rpn)); return; }
    const tki = e.target.closest("[data-tkid]"); if (tki) { e.stopPropagation(); const x = tkArr.find(t => t.id === tki.dataset.tkid); if (x) sheetTk(x); return; }
    const lbk = e.target.closest("[data-lb]"); if (lbk && !lbk.closest("#akSheet")) { e.stopPropagation(); (async () => { if (!lbArr.length) { const l = await ambilData("lembaga"); if (l) indeksLb(l); } const x = lbMap.get(lbk.dataset.lb); if (x) bukaLb(x); })(); return; }
    const fq = e.target.closest("[data-fq]"); if (fq) { e.stopPropagation(); const i = document.querySelector(".ak-tampilan:not([hidden]) input[type=search]") || (!$("akIsi").hidden && $("akQ")); if (i) { i.value = fq.dataset.fq; i.dispatchEvent(new Event("input", {bubbles: true})); i.scrollIntoView({block: "center"}); } return; }
    if (e.target.closest("a,button,.ak-pilih")) return;
    const c = e.target.closest("[data-in],[data-inid],[data-sd],[data-sk],[data-href]"); if (!c) return;
    if (c.dataset.href) { window.open(c.dataset.href, "_blank", "noopener"); return; }
    if (c.dataset.inid) { (async () => { let x = inArr.find(y => y.id === c.dataset.inid); if (!x) { const d = await ambilData("inovasi"); x = dlist(Array.isArray(d) ? d : d?.inovasi).find(y => y.id === c.dataset.inid); } if (x) sheetIn(x); })(); return; }
    if (c.dataset.in != null) { const x = inHasil[+c.dataset.in]; if (x) sheetIn(x); } else if (c.dataset.sd) { (async () => { let x = sdArr.find(y => y.id === c.dataset.sd); if (!x) { const d = await ambilData("sistem_data"); x = dlist(Array.isArray(d) ? d : d?.sistem).find(y => y.id === c.dataset.sd); } if (x) { sheetSd(x); } })(); } else { (async () => { let x = pdArr.find(y => y.id === c.dataset.sk); if (!x) { const d = await ambilData("pendanaan"); x = dlist(Array.isArray(d) ? d : d?.pendanaan).find(y => y.id === c.dataset.sk); } if (x) lembarSkema(x); })(); } }, true);
  document.addEventListener("load", e => { const i = e.target; if (i.tagName === "IMG" && i.closest?.(".ak-pinlogo") && (i.naturalWidth < 10 || i.naturalHeight < 10)) i.remove(); }, true);
  document.addEventListener("click", e => { const k = e.target.closest?.("[data-ket]"); if (k && !e.target.closest("a, button")) k.classList.toggle("terbuka"); });
  document.addEventListener("error", e => {
    if (e.target.tagName === "IMG" && e.target.classList?.contains("ak-lw")) { const sp = document.createElement("span"); sp.className = "ak-lw ak-lw0"; sp.style.cssText = `width:${e.target.width}px;height:${e.target.width}px`; sp.innerHTML = ikon(IKON_PIN, "currentColor"); e.target.replaceWith(sp); return; } if (e.target.matches?.(".ak-prod-foto")) e.target.remove(); }, true);   /* foto gagal muat: kembali ke area warna sektor */
  document.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.matches?.("[data-in],[data-inid],[data-sd],[data-sk],[data-href],[data-lb].ak-bkr,article[data-bk]")) { e.preventDefault(); e.target.click(); } });
  document.addEventListener("click", e => {
    const pk = e.target.closest("[data-pk]"); if (pk) { const o = peta.get(pk.dataset.pk); if (o) buka(o); return; }
    const tks = e.target.closest("[data-tks]"); if (tks) { const x = tkArr.find(y => y.id === tks.dataset.tks); if (x) sheetTk(x); return; }
    const wl = e.target.closest("[data-wl],[data-wlbuka]"); if (wl) { location.assign("/wilayah?prov=" + encodeURIComponent(String(wl.dataset.wlbuka || wl.dataset.wl).split("|")[0])); return; }
    const bt = e.target.closest("[data-brt]"); if (bt) { lihatBerita(bt.dataset.brt); return; }
    const rw = e.target.closest("[data-rw]"); if (rw) { const [p, k] = rw.dataset.rw.split("|"); tutup(); setWilRiset(p, k || ""); tampil("riset"); }
  });


  /* ---- tab Proyek (K17): daftar + peta dari potret/proyek; presisi lokasi dan sumber ditampilkan jujur ---- */
  const PRJ = {q: "", sub: "daftar", hal: 1, status: "", prov: ""}, PRJPER = 20;
  let prArr = [], prHasil = [], prPeta = null;
  const stProy = x => String(dlist(x.status)[0]?.nilai || ""), kapProy = x => { const k = dlist(x.kapasitas)[0]; return k && Number.isFinite(+k.nilai) ? `${fmt1(+k.nilai)} ${k.satuan || "MW"}` : ""; };
  const pihakP = (x, j) => dlist(x.pihak?.[j]).map(p => p?.nilai).filter(Boolean);
  const mapsUrl = x => Number.isFinite(x.lokasi?.lat) && Number.isFinite(x.lokasi?.lng) ? `https://www.google.com/maps/search/?api=1&query=${x.lokasi.lat},${x.lokasi.lng}` : "";
  const IK_MAPS = '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>';
  const mapsBtn = x => { const u = mapsUrl(x); return u ? `<a class="ak-ib ak-maps" href="${esc(u)}" ${LUAR} title="Buka di Google Maps" aria-label="Buka ${esc(x.nama)} di Google Maps">${ikon(IK_MAPS, "currentColor")}</a>` : ""; };
  const lokProy = x => [x.lokasi?.kabupaten_kota, x.lokasi?.provinsi].filter(Boolean).join(", ");
  const kartuProyek = (x, i) => `<article class="ak-pjk ak-pr" role="button" tabindex="0" data-pr="${i}" aria-label="Buka ${esc(x.nama)}"><div class="ak-pil">${pilSektor(x.teknologi)}${stProy(x) ? `<span class="ak-izin">${esc(kapital(stProy(x)))}</span>` : ""}${kapProy(x) ? pilMini(IKP.data, kapProy(x)) : ""}</div><h3>${esc(x.nama)}</h3><p class="ak-lper">${esc(lokProy(x) || "Lokasi belum diketahui")}${x.lokasi?.presisi === "provinsi" ? " (titik pusat provinsi)" : ""}</p><div class="ak-pil">${pihakP(x, "pemilik").slice(0, 2).map(n => pilMini(IK_GEDUNG, n)).join("")}${mapsBtn(x)}</div></article>`;
  function saringProyek() { const q = PRJ.q.toLowerCase(); prHasil = prArr.filter(x => (!q || x._cari.includes(q)) && (!PRJ.status || stProy(x) === PRJ.status) && (!PRJ.prov || x.lokasi?.provinsi === PRJ.prov) && (!GL.set.size || cocokGL(x.sektor))); }
  function gambarProyek(gulir) {
    saringProyek(); const n = prHasil.length, a = (PRJ.hal - 1) * PRJPER, mw = prHasil.reduce((s, x) => s + (+dlist(x.kapasitas)[0]?.nilai || 0), 0);
    $("akPrJ").innerHTML = `<b>${angka(n)}</b> proyek${mw ? `, kapasitas tercatat <b>${angka(Math.round(mw))}</b> MW (MW dan MWp, nilai pertama per proyek)` : ""}`;
    $("akPrL").innerHTML = n ? `<div class="ak-pjg">${prHasil.slice(a, a + PRJPER).map((x, j) => kartuProyek(x, a + j)).join("")}</div>` : hampa("proyek");
    $("akPrH").innerHTML = navHal(PRJ.hal, n, PRJPER, "proyek");
    if (PT_PR.map) nanti(petaProyekSegar);
    if (gulir) gulirKe("akPrJ");
  }
  const PT_PR = {map: null, siap: false};
  function geoProyek() { return {type: "FeatureCollection", features: prHasil.filter(x => Number.isFinite(x.lokasi?.lat) && Number.isFinite(x.lokasi?.lng)).map(x => ({type: "Feature", properties: {i: prArr.indexOf(x)}, geometry: {type: "Point", coordinates: [x.lokasi.lng, x.lokasi.lat]}}))}; }
  function petaProyekSegar() { const m = PT_PR.map; if (!m || !PT_PR.siap) return; m.getSource("prj")?.setData(geoProyek()); $("akPrN").textContent = t("dir.peta.ditempatkan", {n: angka(geoProyek().features.length), m: angka(prHasil.length)}).replace("lembaga", "proyek"); }
  async function bangunPetaProyek() {
    if (PT_PR.map) { PT_PR.map.resize(); petaProyekSegar(); return; }
    try { await muatMapLib(); } catch (e) { $("akPrMap").innerHTML = '<p class="ak-khampa">Peta tidak bisa dimuat.</p>'; return; }
    const gelap = () => document.documentElement.dataset.theme ? document.documentElement.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    let g0 = gelap(); const m = PT_PR.map = new maplibregl.Map({container: "akPrMap", style: "https://tiles.openfreemap.org/styles/" + (g0 ? "dark" : "positron"), bounds: [[94, -11.5], [141.5, 6.5]], minZoom: 3, maxZoom: 16, dragRotate: false, pitchWithRotate: false, attributionControl: {compact: true}});
    m.addControl(new maplibregl.NavigationControl({showCompass: false}), "bottom-right");
    const lapis = () => { m.addSource("prj", {type: "geojson", data: geoProyek(), cluster: true, clusterRadius: 38, clusterMaxZoom: 9});
      m.addLayer({id: "prj-k", type: "circle", source: "prj", filter: ["has", "point_count"], paint: {"circle-color": rv("var(--data2)"), "circle-radius": ["step", ["get", "point_count"], 14, 10, 18, 40, 26], "circle-stroke-color": rv("var(--on-brand)"), "circle-stroke-width": 2}});
      m.addLayer({id: "prj-kn", type: "symbol", source: "prj", filter: ["has", "point_count"], layout: {"text-field": ["get", "point_count_abbreviated"], "text-font": ["Noto Sans Bold"], "text-size": 12}, paint: {"text-color": rv("var(--on-brand)")}});
      m.addLayer({id: "prj-t", type: "circle", source: "prj", filter: ["!", ["has", "point_count"]], paint: {"circle-color": rv("var(--accent-isi)"), "circle-radius": 7, "circle-stroke-color": rv("var(--on-brand)"), "circle-stroke-width": 2}}); };
    m.on("load", () => { lapis(); PT_PR.siap = true; petaProyekSegar();
      m.on("click", "prj-k", e => { const f = m.queryRenderedFeatures(e.point, {layers: ["prj-k"]})[0]; m.getSource("prj").getClusterExpansionZoom(f.properties.cluster_id).then(z => m.easeTo({center: f.geometry.coordinates, zoom: z + .5})).catch(() => {}); });
      m.on("click", "prj-t", e => { const x = prArr[e.features[0].properties.i]; if (x) sheetProyek(x); });
      for (const l of ["prj-k", "prj-t"]) { m.on("mouseenter", l, () => { m.getCanvas().style.cursor = "pointer"; }); m.on("mouseleave", l, () => { m.getCanvas().style.cursor = ""; }); } });
    m.on("style.load", () => { if (PT_PR.siap) { lapis(); petaProyekSegar(); } });
    const ganti = () => { const g = gelap(); if (g === g0 || !PT_PR.siap) return; g0 = g; m.setStyle("https://tiles.openfreemap.org/styles/" + (g ? "dark" : "positron"), {diff: false}); };
    new MutationObserver(ganti).observe(document.documentElement, {attributes: true, attributeFilter: ["data-theme"]}); matchMedia("(prefers-color-scheme: dark)").addEventListener("change", ganti);
    new ResizeObserver(() => m.resize()).observe($("akPrMap"));
  }
  const tglProy = a => dlist(a).map(v => `${esc(String(v.nilai))}${v.catatan ? ` <small class="ak-lper">${esc(v.catatan)}</small>` : ""}`).join(", ");
  function sheetProyek(x) {
    const mu = mapsUrl(x), srcs = [...dlist(x.sumber).map(s => s?.url), x.lokasi?.sumber?.url];
    const kepala = `<div class="ak-dkepala"><div class="ak-dk-atas"><div class="ak-nama"><h2 id="akSJudul">${esc(x.nama)}</h2><p>${esc(lokProy(x))}</p><div class="ak-pil">${pilSektor(x.teknologi)}${stProy(x) ? `<span class="ak-izin">${esc(kapital(stProy(x)))}</span>` : ""}${kapProy(x) ? pilMini(IKP.data, kapProy(x)) : ""}</div></div><div class="ak-pojok">${mu ? `<a class="ak-ib" href="${esc(mu)}" ${LUAR} title="Buka di Google Maps" aria-label="Buka di Google Maps">${ikon(IK_MAPS, "currentColor")}</a>` : ""}</div></div></div>`;
    bukaSheet("proyek", kepala, () => {
      const org = n => { const id = (dlist(x.pihak?.pemilik).concat(dlist(x.pihak?.epc), dlist(x.pihak?.pembeli)).find(p => p?.nilai === n) || {}).organisasi_id, y = id && lbMap.get(id); return y ? `<button type="button" class="ak-pk" data-lb="${esc(id)}">${esc(n)}</button>` : esc(n); };
      const baris = (j, l) => { const a = pihakP(x, j); return a.length ? barisB(l, a.map(n => `<b>${org(n)}</b>`).join(", ")) : ""; };
      const rows = [barisB("Teknologi", `<b>${esc((SEKTOR[x.teknologi] || [x.teknologi])[0])}</b>`), dlist(x.kapasitas).length ? barisB("Kapasitas", dlist(x.kapasitas).map(k => `<b>${esc(fmt1(+k.nilai))} ${esc(k.satuan || "")}</b>${k.catatan ? ` <small class="ak-lper">${esc(k.catatan)}</small>` : ""}`).join("; ")) : "",
        dlist(x.status).length ? barisB("Status", dlist(x.status).map(v => `<b>${esc(kapital(v.nilai))}</b>`).join(", ")) : "", dlist(x.cod_target).length ? barisB("Target COD", `<b>${tglProy(x.cod_target)}</b>`) : "", dlist(x.cod_aktual).length ? barisB("COD aktual", `<b>${tglProy(x.cod_aktual)}</b>`) : "",
        dlist(x.nilai_investasi).length ? barisB("Nilai investasi", dlist(x.nilai_investasi).map(v => `<b>${esc(String(v.nilai))} ${esc(v.satuan || v.mata_uang || "")}</b>`).join("; ")) : "", baris("pemilik", "Pemilik"), baris("epc", "EPC"), baris("pembeli", "Pembeli listrik"),
        barisB("Lokasi", `<b>${esc(lokProy(x) || "-")}</b>${x.lokasi?.presisi ? ` <small class="ak-lper">presisi: ${esc(x.lokasi.presisi)}${x.lokasi?.sumber?.catatan ? "; " + esc(x.lokasi.sumber.catatan) : ""}</small>` : ""}`, urlOk(x.lokasi?.sumber?.url))].filter(Boolean).join("");
      const ang = [dlist(x.skema_kerjasama).length && barisB("Skema kerja sama", dlist(x.skema_kerjasama).map(v => `<b>${esc(v.nilai ?? v)}</b>`).join(", ")), dlist(x.pemberi_dana).length && barisB("Pemberi dana", dlist(x.pemberi_dana).map(v => `<b>${esc(v.nilai ?? v)}</b>`).join(", ")), dlist(x.financial_close).length && barisB("Financial close", `<b>${tglProy(x.financial_close)}</b>`), dlist(x.tanggal_ppa).length && barisB("Tanggal PPA", `<b>${tglProy(x.tanggal_ppa)}</b>`)].filter(Boolean).join("");
      return bagB("Ringkasan proyek", `<div class="ak-bgrup">${rows}</div>`) + (ang ? bagB("Data anggota METI", `<div class="ak-bgrup">${ang}</div>`) : "") + (dlist(x.konflik).length || dlist(x.catatan).length ? bagB("Catatan pengurus", `<ul class="ak-lsumber">${[...dlist(x.catatan), ...dlist(x.konflik)].map(v => `<li>${esc(typeof v === "string" ? v : JSON.stringify(v))}</li>`).join("")}</ul>`) : "")
        + '<div id="akPrReg"></div>' + bagB("Sumber", sumberList(srcs)); });
    $("akSheet").dataset.k = ""; const tk = tokenS;
    if (dlist(x.regulasi_ids).length) ambilData("regulasi").then(r => { const a = dlist(x.regulasi_ids).map(id => dlist(r?.baris).find(q => q.id === id)).filter(Boolean); if (a.length) isiNanti(() => tk === tokenS, "akPrReg", bagB("Regulasi terkait", `<ul class="ak-lsumber">${a.slice(0, 12).map(q => `<li><b>${esc(q.judul)}</b> <small class="ak-lper">${esc(String(q.jenis || "").toUpperCase())} ${esc(q.nomor || "")}/${esc(q.tahun || "")}</small></li>`).join("")}</ul>`)); });
  }
  function bangunProyekBaru(p, d) {
    prArr = dlist(d).filter(x => x && x.id && x.nama).map(x => Object.assign(x, {sektor: kodeSektor([x.teknologi]), _cari: [x.nama, x.teknologi, lokProy(x), ...pihakP(x, "pemilik"), ...pihakP(x, "epc")].filter(Boolean).join(" ").toLowerCase()}));
    const nS = {}, nP = {}; prArr.forEach(x => { const s = stProy(x); if (s) nS[s] = (nS[s] || 0) + 1; const v = x.lokasi?.provinsi; if (v) nP[v] = (nP[v] || 0) + 1; });
    Object.assign(PRJ, {q: "", sub: "daftar", hal: 1, status: "", prov: ""});
    p.innerHTML = `<div class="ak-saring"><div class="ak-alat">${cariKotak("akPrQ", "Cari proyek, teknologi, lokasi, atau pemilik")}</div>
      <div class="ak-filgrid">${selectIsi("akPrSt", "Semua status", Object.entries(nS).sort((a, b) => b[1] - a[1]))}${selectIsi("akPrPv", "Semua provinsi", Object.entries(nP).sort((a, b) => b[1] - a[1]))}</div>
      ${segHtml("akPrSub", "Tampilan proyek", [["daftar", "Daftar", IKL.jenis], ["peta", "Peta", IK_MAPS]])}</div>
      <div class="ak-hasil"><h2 class="ak-judulv" id="akPrJ"></h2><div id="akPrL"></div><nav id="akPrH" class="ak-hal" aria-label="Halaman daftar proyek" aria-live="polite"></nav>
      <div id="akPrPeta" class="ak-prpeta" hidden><div id="akPrMap" class="ak-map" role="application" aria-label="Peta proyek"></div><p class="ak-ptn" id="akPrN" role="status" aria-live="polite"></p></div></div>`;
    let tt = 0; $("akPrQ").addEventListener("input", e => { clearTimeout(tt); tt = setTimeout(() => { PRJ.q = e.target.value.trim(); PRJ.hal = 1; gambarProyek(false); }, 120); });
    $("akPrSt").addEventListener("change", e => { PRJ.status = e.target.value; PRJ.hal = 1; nanti(() => gambarProyek(false)); });
    $("akPrPv").addEventListener("change", e => { PRJ.prov = e.target.value; PRJ.hal = 1; nanti(() => gambarProyek(false)); });
    $("akPrSub").addEventListener("click", e => { const b = e.target.closest("button[data-v]"); if (!b) return; PRJ.sub = b.dataset.v; setSeg("akPrSub", PRJ.sub); const pt = PRJ.sub === "peta"; $("akPrL").hidden = pt; $("akPrH").hidden = pt; $("akPrPeta").hidden = !pt; if (pt) nanti(bangunPetaProyek); });
    pasangHal("akPrH", h => { PRJ.hal = h; gambarProyek(true); });
    const buka1 = e => { const c = e.target.closest("[data-pr]"); if (c && !e.target.closest("a") && prHasil[+c.dataset.pr]) sheetProyek(prHasil[+c.dataset.pr]); };
    $("akPrL").addEventListener("click", buka1); $("akPrL").addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.dataset.pr != null) { e.preventDefault(); buka1(e); } });
    gambarProyek(false);
  }
  const selectIsi = (id, semuaTeks, rows) => `<label class="ak-sel"><span class="sr">${esc(semuaTeks)}</span><select data-ikon="topik" id="${id}" title="${esc(semuaTeks)}"><option value="">${esc(semuaTeks)}</option>${rows.map(([v, c]) => `<option value="${esc(v)}">${esc(kapital(String(v)))} (${angka(c)})</option>`).join("")}</select></label>`;

  /* ---- tab Regulasi (K17): daftar, status, dan posisi METI (lapis anggota ke atas) ---- */
  const RG = {q: "", status: "", jenis: "", hal: 1}, RGPER = 20; let rgArr = [], rgHasil = [], rgMap = new Map();
  const labelReg = x => `${String(x.jenis || "").toUpperCase().replace(/-/g, " ")} ${x.nomor || ""}${x.tahun ? "/" + x.tahun : ""}`.trim();
  const pilStatReg = s => `<span class="ak-izin${/berlaku/i.test(s) ? " berlaku" : /cabut/i.test(s) ? " dicabut" : ""}">${esc(kapital(String(s || "-")))}</span>`;
  const kartuReg = (x, i) => `<article class="ak-pjk ak-rg" role="button" tabindex="0" data-rg="${i}" aria-label="Buka ${esc(x.judul)}"><div class="ak-pil"><span class="ak-mp">${esc(labelReg(x))}</span>${pilStatReg(x.status)}${x.posisi_meti ? `<span class="ak-izin mitra">Posisi METI</span>` : ""}</div><h3>${esc(x.judul)}</h3><p class="ak-lper">${esc(x.instansi_penerbit || "")}${x.tanggal_ditetapkan ? ", " + esc(tglID(x.tanggal_ditetapkan)) : ""}</p>${x.ringkasan ? `<p class="ak-ket ak-rg-r">${esc(x.ringkasan)}</p>` : ""}</article>`;
  function gambarReg(gulir) {
    const q = RG.q.toLowerCase(); rgHasil = rgArr.filter(x => (!q || x._cari.includes(q)) && (!RG.status || x.status === RG.status) && (!RG.jenis || x.jenis === RG.jenis));
    const n = rgHasil.length, a = (RG.hal - 1) * RGPER;
    $("akRgJ").innerHTML = `<b>${angka(n)}</b> regulasi`;
    $("akRgL").innerHTML = n ? `<div class="ak-pjg">${rgHasil.slice(a, a + RGPER).map((x, j) => kartuReg(x, a + j)).join("")}</div>` : hampa("regulasi");
    $("akRgH").innerHTML = navHal(RG.hal, n, RGPER, "regulasi"); if (gulir) gulirKe("akRgJ");
  }
  function sheetReg(x) {
    const nm = id => rgMap.get(id)?.judul || id, ik = (a, l) => dlist(a).length ? barisB(l, dlist(a).map(v => `<b>${esc(nm(v.ke || v.dari))}</b> <small class="ak-lper">${esc(v.jenis || "")}</small>`).join("; ")) : "";
    const kepala = `<div class="ak-dkepala"><div class="ak-dk-atas"><div class="ak-nama"><h2 id="akSJudul">${esc(x.judul)}</h2><p>${esc(labelReg(x))}${x.instansi_penerbit ? ", " + esc(x.instansi_penerbit) : ""}</p><div class="ak-pil">${pilStatReg(x.status)}${dlist(x.topik).map(v => pilMini(IKJ, kapital(String(v).replace(/_/g, " ")))).join("")}</div></div></div></div>`;
    bukaSheet("regulasi", kepala, () => bagB("Posisi METI", x.posisi_meti ? `<p class="ak-rata">${esc(typeof x.posisi_meti === "string" ? x.posisi_meti : JSON.stringify(x.posisi_meti))}</p>${x.sumber_posisi ? `<small class="ak-lper">Sumber posisi: ${esc(typeof x.sumber_posisi === "string" ? x.sumber_posisi : "")}</small>` : ""}` : "")
      + bagB("Ringkasan", x.ringkasan ? `<p class="ak-rata">${esc(x.ringkasan)}</p>` : "") + bagB("Pasal kunci", x.pasal_kunci ? `<p class="ak-rata">${esc(typeof x.pasal_kunci === "string" ? x.pasal_kunci : JSON.stringify(x.pasal_kunci))}</p>` : "")
      + bagB("Keterkaitan", `<div class="ak-bgrup">${ik(x.ikatan, "Mengubah atau mencabut")}${ik(x.diikat_oleh, "Diubah atau dicabut oleh")}${dlist(x.proyek_ids).length ? barisB("Proyek terkait", `<b>${angka(dlist(x.proyek_ids).length)}</b>`) : ""}</div>`.replace('<div class="ak-bgrup"></div>', ""))
      + bagB("Sumber", sumberList([x.url_sumber, x.url_pdf])));
  }
  function bangunRegulasi(p, d) {
    rgArr = dlist(d?.baris).filter(x => x && x.id && x.judul).map(x => Object.assign(x, {_cari: [x.judul, x.nomor, x.tahun, x.jenis, x.instansi_penerbit, ...dlist(x.topik)].filter(Boolean).join(" ").toLowerCase()})); rgMap = new Map(rgArr.map(x => [x.id, x]));
    const nS = {}, nJ = {}; rgArr.forEach(x => { if (x.status) nS[x.status] = (nS[x.status] || 0) + 1; if (x.jenis) nJ[x.jenis] = (nJ[x.jenis] || 0) + 1; }); Object.assign(RG, {q: "", status: "", jenis: "", hal: 1});
    p.innerHTML = `<div class="ak-saring"><div class="ak-alat">${cariKotak("akRgQ", "Cari judul, nomor, atau instansi")}</div><div class="ak-filgrid">${selectIsi("akRgSt", "Semua status", Object.entries(nS).sort((a, b) => b[1] - a[1]))}${selectIsi("akRgJn", "Semua jenis", Object.entries(nJ).sort((a, b) => b[1] - a[1]))}</div></div>
      <div class="ak-hasil"><h2 class="ak-judulv" id="akRgJ"></h2><div id="akRgL"></div><nav id="akRgH" class="ak-hal" aria-label="Halaman daftar regulasi" aria-live="polite"></nav></div>`;
    let tt = 0; $("akRgQ").addEventListener("input", e => { clearTimeout(tt); tt = setTimeout(() => { RG.q = e.target.value.trim(); RG.hal = 1; gambarReg(false); }, 120); });
    $("akRgSt").addEventListener("change", e => { RG.status = e.target.value; RG.hal = 1; nanti(() => gambarReg(false)); }); $("akRgJn").addEventListener("change", e => { RG.jenis = e.target.value; RG.hal = 1; nanti(() => gambarReg(false)); });
    pasangHal("akRgH", h => { RG.hal = h; gambarReg(true); });
    const buka1 = e => { const c = e.target.closest("[data-rg]"); if (c && rgHasil[+c.dataset.rg]) sheetReg(rgHasil[+c.dataset.rg]); };
    $("akRgL").addEventListener("click", buka1); $("akRgL").addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.dataset.rg != null) { e.preventDefault(); buka1(e); } });
    gambarReg(false);
  }

  /* ----- TERHUBUNG: tetangga di graf.json dikelompokkan per relasi, tiap kelompok baris kaya ----- */
  let GRAF = null;
  const siapGraf = () => GRAF ||= ambilData("graf").then(g => { const adj = new Map(); if (g?.sisi) for (const [a, b, rel, src] of g.sisi) { (adj.get(a) || adj.set(a, []).get(a)).push({to: b, rel, src, out: true}); (adj.get(b) || adj.set(b, []).get(b)).push({to: a, rel, src, out: false}); } return (GRAFNOW = {simpul: g?.simpul || {}, adj}); });
  const JENIS_NODE = {pakar: "Pakar", lembaga: "Lembaga", organisasi: "Organisasi", buku: "Buku", kampus: "Kampus", proyek: "Proyek", dokumen: "Dokumen", inovasi: "Inovasi", sistem: "Sistem data", dana: "Skema dana", jurnal: "Jurnal", aset: "Aset riset", tokoh: "Tokoh", paten: "Paten"};
  const ANGGOTA_RE = /^(anggota|pengurus|ketua|lainnya|dewan redaksi|tim ahli|editor|managing editor|editor-in-chief)/i;
  function judulTerh(rel, out, nb) {
    const r = String(rel).toLowerCase(), N = nb[0];
    if (/muncul bersama/.test(r)) return "Sering disebut bersama di berita";
    if (r === "bekerja di") return out ? "Bekerja di" : "Pakar yang bekerja di sini";
    if (/^(dewan redaksi|editor|managing editor|editor-in-chief)/.test(r) && N === "U") return out ? "Dewan redaksi" : "Dewan redaksi jurnal ini";
    if (ANGGOTA_RE.test(r)) return out ? "Anggota dan pengurus" : "Anggota dan pengurus";
    if (r === "menulis") return out ? "Menulis buku" : "Penulis dan penerbit";
    if (r === "menerbitkan") return out ? (N === "U" ? "Jurnal terbitan" : "Dokumen terbitan") : "Diterbitkan oleh";
    if (r === "membuat") return out ? "Inovasi buatan" : "Pembuat";
    if (r === "memiliki") return out ? "Sistem dan aset milik" : "Pemilik";
    if (r === "memberi") return out ? "Memberi dana (skema)" : "Pemberi dana";
    if (r === "mendanai") return out ? "Mendanai proyek" : "Didanai oleh";
    if (r === "mendanai riset") return out ? "Mendanai riset" : "Didanai oleh";
    if (r === "dilaksanakan oleh") return out ? "Dilaksanakan oleh" : "Proyek yang dilaksanakan";
    if (r === "cabang dari") return out ? "Induk" : "Cabang";
    if (r === "menemukan") return out ? "Paten" : "Penemu";
    if (r === "memegang paten") return out ? "Paten yang dipegang" : "Pemegang paten";
    if (r === "menyalurkan bantuan") return out ? "Menyalurkan bantuan ke" : "Menerima bantuan dari";
    if (r === "memberi penghargaan") return out ? "Memberi penghargaan ke" : "Penghargaan dari";
    if (r === "kepala pelaksana" || r === "berperan di") return out ? "Berperan di" : "Tokoh terkait";
    return kapital(rel);
  }
  const ATTR_NODE = {L: id => `data-lb="${esc(id)}"`, P: id => `data-pk="${esc(id)}"`, T: id => `data-tkid="${esc(id)}"`, K: id => `data-kp="${esc(id)}"`, I: id => `data-inid="${esc(id)}"`, S: id => `data-sd="${esc(id)}"`, D: id => `data-sk="${esc(id)}"`, G: id => `data-g="${esc("G:" + id)}"`};
  const IKON_NODE = {pakar: IK_ORANG, lembaga: IK_GEDUNG, organisasi: IK_GEDUNG, buku: IKJ, kampus: IK_KAMPUS, proyek: IK_UANG, dokumen: IKJ, inovasi: KAT.inovasi[1], sistem: IK_DB, dana: IK_UANG, jurnal: IKJ, aset: KAT.riset[1], tokoh: IK_ORANG, paten: IKJ};
  let W3MAP = null;
  const proyNode = id => { const t = id[0], rid = id.slice(2); if (t === "J") { const p = W3MAP?.get(rid); return p ? dari3w(p) : null; } if (t === "D") { const x = pdArr.find(y => y.id === rid); return x && x.jenis_entri === "proyek" ? dariDana(x) : null; } return null; };
  function barisNode(id, v) { const t = id[0], rid = id.slice(2), j = v.j;
    { const py = proyNode(id); if (py) return barisPjKaya(py); }
    try {
      if (t === "P" && peta.has(rid)) return barisPk(peta.get(rid));
      if (t === "L" && lbMap.has(rid)) return barisLb(lbMap.get(rid));
      if (t === "T") { const x = tkArr.find(y => y.id === rid); if (x) return barisTkRow(x, `data-tkid="${esc(rid)}"`); }
      if (t === "I") { const x = inArr.find(y => y.id === rid); if (x) return barisInovasi(x); }
      if (t === "S") { const x = sdArr.find(y => y.id === rid); if (x) return barisSd(x); }
      if (t === "D") { const x = pdArr.find(y => y.id === rid); if (x) return barisDana(x); }
    } catch (e) { /* jatuh ke baris umum */ }
    if (t === "K") { const kk = kampusInfo[rid] || {}, n = perK[rid] || 0; return barisKaya({attr: ATTR_NODE.K(rid), logo: denganBintang(lgoIkon([urlOk(logoK[rid])].filter(Boolean), IK_KAMPUS, "var(--data1)"), "K:" + rid), nama: rid, pil: pilMini(IK_KAMPUS, "Kampus") + (kk.kab || kk.kota ? pilMini(IKON_PIN, kk.kab || kk.kota) : "") + (strat("K:" + rid) ? pilStrat("K:" + rid) : ""), fakta: n ? `${angka(n)} pakar` : "", fakta2: (() => { const e = GRAFNOW?.adj.get("K:" + rid) || []; const i = e.filter(x => x.to[0] === "I").length, j = e.filter(x => x.to[0] === "R" || x.to[0] === "S").length; return i ? `${angka(i)} inovasi` : j ? `${angka(j)} jurnal dan sistem` : ""; })()}); }
    const ok = ATTR_NODE[t] && !(t === "P") && !(t === "T") && !(t === "L" && lbArr.length) && !(t === "I" && inArr.length) && !(t === "S" && sdArr.length) && !(t === "D" && pdArr.length);
    const logo = denganBintang(lgoIkon(v.logo && urlOkLogo(v.logo) ? [v.logo] : (t === "L" && lbMap.get(rid) ? chainLogo(lbMap.get(rid)) : (t === "K" ? [urlOk(logoK[rid])].filter(Boolean) : [])), IKON_NODE[j] || IK_GEDUNG, "var(--data1)"), t === "K" ? "K:" + rid : "L:" + rid);
    if (t === "G") { const lbn = lbDariNama(v.n); if (lbn) return barisLb(lbn); }
    const lg2 = t === "G" && !(v.logo && urlOkLogo(v.logo)) ? logoOrg(v.n, null) : [];
    return barisKaya({attr: ok ? ATTR_NODE[t](rid) : "", logo: lg2.length ? denganBintang(lgoIkon(lg2, IKON_NODE[j] || IK_GEDUNG, "var(--data1)"), "L:" + rid) : logo, nama: v.n || rid, pil: pilMini(IKON_NODE[j] || IK_GEDUNG, kapital(j === "lembaga" ? "lembaga" : j || "organisasi"))}); }
  async function htmlTerhubung(key) {
    const G = await siapGraf(), lis = G.adj.get(key); if (!lis?.length) return "";
    /* baris Terhubung menjelaskan isinya: muat data per jenis simpul yang ada, lalu pakai pembangun baris yang sama dengan tab-nya */
    const jenisAda = new Set(lis.map(e => e.to[0])), muatJenis = async (c, arr, nama, kunci, tetapkan) => { if (jenisAda.has(c) && !arr().length) { const d = await ambilData(nama); const a = dlist(Array.isArray(d) ? d : d?.[kunci]).filter(x => x && x.id); if (a.length) tetapkan(a); } };
    if (jenisAda.has("L") && !lbArr.length) { const l = await ambilData("lembaga"); if (l && !lbArr.length) indeksLb(l); }
    if (jenisAda.has("J") && !W3MAP) { const d = await ambilData("proyek_mitra"); W3MAP = new Map(dlist(Array.isArray(d) ? d : d?.proyek).filter(x => x && x.id).map(x => [x.id, x])); }
    await Promise.all([muatJenis("I", () => inArr, "inovasi", "inovasi", a => { inArr = a; }), muatJenis("S", () => sdArr, "sistem_data", "sistem", a => { sdArr = a; }), muatJenis("D", () => pdArr, "pendanaan", "pendanaan", a => { pdArr = a; }), muatJenis("T", () => tkArr, "tokoh", "tokoh", a => { tkArr = a; })]);
    const grup = new Map(); for (const e of lis) { const v = G.simpul[e.to]; if (!v || /sama/i.test(e.rel)) continue; const jd = judulTerh(e.rel, e.out, e.to); if (key[0] === "K" && jd === "Pakar yang bekerja di sini") continue; if (key[0] === "P" && e.rel === "menemukan") continue;   /* paten pakar sudah tampil lengkap di bagian Paten */ (grup.get(jd) || grup.set(jd, new Map()).get(jd)).set(e.to, v); }
    const urut0 = [...grup].sort((a, b) => (/berita/.test(a[0]) ? 1 : 0) - (/berita/.test(b[0]) ? 1 : 0) || b[1].size - a[1].size);
    /* lembaga yang mendanai sekaligus melaksanakan proyek yang sama: satu kelompok, bukan dua daftar kembar */
    const kembar = new Map(), urut = []; for (const [jd, m] of urut0) { const k = [...m.keys()].sort().join("|"), ada = kembar.get(k); if (ada) { ada[0] = ada[0] === "Mendanai proyek" && jd === "Proyek yang dilaksanakan" ? "Mendanai dan melaksanakan proyek" : ada[0] + " dan " + jd.toLowerCase(); continue; } const e = [jd, m]; kembar.set(k, e); urut.push(e); }
    return urut.map(([jd0, m]) => { const a = [...m], jd = jd0;
      const pyAll = a.every(([id]) => (id[0] === "J" || id[0] === "D") && proyNode(id)); let totP = 0;
      if (pyAll) { a.sort((x, y) => (proyNode(y[0])?.usd || 0) - (proyNode(x[0])?.usd || 0)); totP = a.reduce((q, e) => q + (proyNode(e[0])?.usd || 0), 0); }
      const tulis = (arr) => pyAll ? `<div class="ak-pjg">${arr.map(([id]) => kartuPj(proyNode(id), key, id)).join("")}</div>` : daftarBkr(arr.map(([id, v]) => barisNode(id, v)));
      let isi;
      if (a.length > 30 && a.every(([id]) => id[0] === "L")) { const pv = new Map(); a.forEach(e => { const k = lbMap.get(e[0].slice(2))?.prov || ""; (pv.get(k) || pv.set(k, []).get(k)).push(e); });
        isi = `<label class="ak-cari ak-grup-cari"><span class="sr">Cari di kelompok ini</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="search" autocomplete="off" placeholder="Cari di kelompok ini" data-grupcari></label>`
          + [...pv].sort((x, y) => y[1].length - x[1].length).map(([k, arr]) => { const n = "lz" + (++lazyN); LAZY.set(n, () => tulis(arr)); return `<details class="ak-terh-lagi ak-prov-g" data-lazy="${n}"><summary>${esc(k ? provT(k) : "Provinsi tidak tercatat")} <small class="ak-hit">${angka(arr.length)}</small></summary><div class="ak-lazyisi"></div></details>`; }).join(""); }
      else isi = tulis(a.slice(0, 8)) + (a.length > 8 ? (() => { const n = "lz" + (++lazyN); LAZY.set(n, () => tulis(a.slice(8, 120))); return `<details class="ak-terh-lagi" data-lazy="${n}"><summary>Lihat semua ${angka(a.length)}</summary><div class="ak-lazyisi"></div></details>`; })() : "");
      return `<section class="ak-dbagian ak-terh-g"><div class="ak-disi"><h3>${esc(jd)} <small class="ak-hit">${pyAll ? `${angka(a.length)} proyek${totP ? ", " + esc(usdR(totP)) : ""}` : angka(a.length)}</small></h3>${isi}</div></section>`; }).join(""); }  let terhKey = "";
  /* Riwayat dengan METI: rute /api/riwayat (PG, AD, SA) milik modul lain; belum dihubungkan di F0 */
  /* RIWAYAT DENGAN METI (internal, lapis pengurus): GET/POST /api/riwayat, PATCH/DELETE /api/riwayat/:id (DT 4.3); gagal/403/404 = bagian disembunyikan */
  const RW_JENIS = ["undangan", "narasumber", "audiensi", "mou", "sponsor", "kegiatan", "kerja-sama", "keanggotaan", "lainnya"];
  const rwBaris = r => `<li class="ak-rw-b" data-rwid="${esc(r.id)}"><span class="ak-rw-t">${esc(tglID(r.tanggal) || r.tanggal)}${r.tanggal_selesai ? ` – ${esc(tglID(r.tanggal_selesai))}` : ""}</span><div><div class="ak-pil"><em class="ak-izin">${esc(kapital(String(r.jenis || "").replace(/-/g, " ")))}</em></div><b>${esc(r.judul)}</b>${r.catatan ? `<p class="ak-ket">${esc(r.catatan)}</p>` : ""}${r.penilaian ? `<small class="ak-lper">${esc(t("dir.riwayat.nilai"))} ${angka(r.penilaian)}/5</small>` : ""}</div>${r.milik ? `<button type="button" class="ak-ib" data-rwhapus="${esc(r.id)}" title="${esc(t("dir.riwayat.hapus"))}" aria-label="${esc(t("dir.riwayat.hapus"))}">${ikon('<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>', "currentColor")}</button>` : ""}</li>`;
  const rwForm = eid => `<form class="ak-rw-f" data-rweid="${eid}"><select data-ikon="jenis" name="jenis" aria-label="${esc(t("dir.riwayat.jenis"))}">${RW_JENIS.map(k => `<option value="${k}">${esc(kapital(k.replace(/-/g, " ")))}</option>`).join("")}</select>
      <input type="date" name="tanggal" required aria-label="${esc(t("dir.riwayat.tanggal"))}"><input type="date" name="tanggal_selesai" aria-label="${esc(t("dir.riwayat.selesai"))}">
      <input type="text" name="judul" required maxlength="200" placeholder="${esc(t("dir.riwayat.judul"))}" aria-label="${esc(t("dir.riwayat.judul"))}">
      <select data-ikon="status" name="penilaian" aria-label="${esc(t("dir.riwayat.nilai"))}"><option value="">${esc(t("dir.riwayat.tanpaNilai"))}</option>${[5, 4, 3, 2, 1].map(n => `<option value="${n}">${n}</option>`).join("")}</select>
      <textarea name="catatan" maxlength="2000" rows="2" placeholder="${esc(t("dir.riwayat.catatan"))}" aria-label="${esc(t("dir.riwayat.catatan"))}"></textarea><button type="submit" class="ak-tbl">${esc(t("dir.riwayat.simpan"))}</button><span class="ak-rw-msg" role="status"></span></form>`;
  async function riwayatDi(key, el) {
    if (!stafSunting() || !el) return; const eid = eidDari(key); if (eid == null) return;
    let d = null; try { const r = await apiJ("/api/riwayat?target=" + eid); if (!r.ok) return; d = await r.json(); } catch (e) { return; }
    const a = dlist(Array.isArray(d) ? d : d?.riwayat);
    el.querySelector(".ak-rwmeti")?.remove();
    el.insertAdjacentHTML("beforeend", `<section class="ak-bg ak-rwmeti" data-rwk="${esc(key)}"><h3><i class="ak-kotak"></i>${esc(t("dir.riwayat.judulBagian"))} <small class="ak-hit">${angka(a.length)}</small><span class="ak-izin contoh" title="${esc(t("dir.riwayat.internalTip"))}">${esc(t("dir.riwayat.internal"))}</span></h3>
      ${a.length ? `<ol class="ak-rw-l">${a.map(rwBaris).join("")}</ol>` : `<p class="ak-ket">${esc(t("dir.riwayat.kosong"))}</p>`}
      <details class="ak-rw-tambah"><summary>${esc(t("dir.riwayat.tambah"))}</summary>${rwForm(eid)}</details></section>`);
  }
  document.addEventListener("submit", async e => { const f = e.target.closest(".ak-rw-f"); if (!f) return; e.preventDefault();
    const v = Object.fromEntries(new FormData(f)), msg = f.querySelector(".ak-rw-msg"), sec = f.closest(".ak-rwmeti"), body = {target_id: +f.dataset.rweid, jenis: v.jenis, tanggal: v.tanggal, judul: v.judul, catatan: v.catatan || null, penilaian: v.penilaian ? +v.penilaian : null};
    if (v.tanggal_selesai) body.tanggal_selesai = v.tanggal_selesai;
    msg.textContent = t("dir.memuat"); f.querySelector("button").disabled = true;
    try { const r = await apiJ("/api/riwayat", "POST", body); if (!r.ok) throw new Error("x"); riwayatDi(sec.dataset.rwk, sec.parentElement); }
    catch (er) { msg.textContent = t("dir.galat"); f.querySelector("button").disabled = false; } });
  document.addEventListener("click", async e => { const b = e.target.closest("[data-rwhapus]"); if (!b || !confirm(t("dir.riwayat.konfirmasiHapus"))) return;
    const r = await apiJ("/api/riwayat/" + encodeURIComponent(b.dataset.rwhapus), "DELETE").catch(() => null); if (r?.ok) b.closest(".ak-rw-b").remove(); });

  function terhubungDi(key) {
    terhKey = key; const tk = tokenS, tkD = drTok;
    htmlTerhubung(key).then(h => { if (terhKey !== key) return; const cari = (n = 0) => { const el = [...document.querySelectorAll("#akSTubuh,#akDrTubuh,#akDIsi")].find(e => !e.closest("[hidden]") && e.offsetParent !== null);
        if (!el) { if (n < 25) setTimeout(() => cari(n + 1), 120); return; } if (el.id === "akSTubuh" && el.querySelector(".ak-hantu") && n < 25) { setTimeout(() => cari(n + 1), 120); return; }
        el.querySelector(".ak-terh")?.remove(); if (h) el.insertAdjacentHTML("beforeend", `<section class="ak-bg ak-terh"><h3><i class="ak-kotak"></i>Terhubung</h3>${h}</section>`); riwayatDi(key, el); }; cari(); }); }
  function sheetG(gid) { const nama = gid; siapGraf().then(async G => { const v = G.simpul[gid]; if (!v) return; bukaSheet("detail", `<div class="ak-dkepala"><div class="ak-dk-atas">${lgoIkon(v.logo && urlOkLogo(v.logo) ? [v.logo] : [], IK_GEDUNG, "var(--data1)")}<div class="ak-nama"><h2 id="akSJudul">${esc(v.n)}</h2><p>Organisasi</p></div></div></div>`, () => ""); $("akSheet").dataset.k = ""; terhubungDi(gid); }); }
  /* ----- satu kotak cari untuk semua tab: indeks dimuat malas sekali, tanpa diakritik, hasil dikelompokkan per jenis ----- */
  const nrmCari = t => String(t ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
  const CARI_GRUP = [["pakar", "Pakar", "pakar"], ["tokoh", "Tokoh publik", "pakar"], ["lembaga", "Lembaga", "lembaga"], ["kampus", "Kampus", "pakar"], ["inovasi", "Inovasi", "inovasi"], ["sistem_data", "Sistem data", "sistem_data"], ["pendanaan", "Pendanaan", "pendanaan"], ["dokumen", "Dokumen", "pustaka"], ["buku", "Buku", "pustaka"], ["berita", "Berita", "pustaka"], ["wilayah", "Wilayah", "wilayah"]];
  let CARI_IDX = null, cariAktif = -1;
  const siapCari = () => CARI_IDX ||= (async () => {
    const [tk, lb, inv, sd, pd, dk, bk, br] = await Promise.all(["tokoh", "lembaga", "inovasi", "sistem_data", "pendanaan", "dokumen", "buku", "berita"].map(ambilData));
    const L = (d, k) => dlist(Array.isArray(d) ? d : d?.[k]), I = [], tambah = (t, id, n, extra, kota, sumber) => I.push({t, id, n, ex: extra, k: kota || "", s: nrmCari([n, extra, kota, sumber].filter(Boolean).join(" "))});
    L(tk, "tokoh").forEach(x => { tambah("tokoh", x.id, x.nama, x.peran, x.lembaga, strs(x.sektor).join(" ")); I[I.length - 1].pid = x.pakar_id || ""; });
    L(lb, "lembaga").forEach(x => tambah("lembaga", x.id, x.nama, (KAT[x.kategori] || [x.kategori])[0], x.kab || (x.prov ? provT(x.prov) : ""), [x.singkatan, ...strs(x.alias), ...strs(x.bidang)].join(" ")));
    L(inv, "inovasi").forEach(x => tambah("inovasi", x.id, x.nama, kapital(x.jenis || ""), "", [x.singkatan, dlist(x.pembuat)[0]?.nama, ...strs(x.sektor)].join(" ")));
    L(sd, "sistem").forEach(x => tambah("sistem_data", x.id, x.nama, "Sistem data", "", [x.kepanjangan, x.pemilik].join(" ")));
    L(pd, "pendanaan").forEach(x => tambah("pendanaan", x.id, x.nama, kapital(x.jenis || x.jenis_entri || ""), "", x.pemberi));
    L(dk, "dokumen").forEach(x => tambah("dokumen", x.id, x.judul, kapital(x.jenis || "Dokumen"), x.tahun ? String(x.tahun) : "", x.penerbit));
    L(bk, "buku").forEach(x => tambah("buku", x.id, x.judul, "Buku", x.tahun ? String(x.tahun) : "", [x.penerbit, x.subjudul].join(" ")));
    L(br, "berita").forEach(x => tambah("berita", x.id || x.url, x.judul, x.media || x.sumber_nama || "Berita", "", ""));
    Object.entries(PROV).forEach(([k, v]) => tambah("wilayah", k, v, "Provinsi", "", ""));
    Object.entries(perK || {}).forEach(([k, c]) => tambah("kampus", k, k, `${angka(c)} pakar`, "", kampusInfo[k]?.kota));
    return I; })();
  const cariLogo = (r, o) => r.t === "pakar" ? foto(o) : r.t === "lembaga" ? (lbMap.get(r.id) ? logoLb(lbMap.get(r.id)) : lgoIkon([], IK_GEDUNG, "var(--data1)")) : r.t === "kampus" ? logoKecil(r.id) : lgoIkon([], (VIEW[(CARI_GRUP.find(g => g[0] === r.t) || [0, 0, "pakar"])[2]] || VIEW.pakar)[1], "var(--data1)");
  const cariBaris = r => { const o = r.t === "pakar" ? peta.get(r.id) : null, at = `data-cr="${esc(r.t + "|" + r.id)}"`;
    try {
      if (o) return barisPk(o, at);
      if (r.t === "tokoh") { const x = tkArr.find(y => y.id === r.id); if (x) return barisTkRow(x, at); }
      if (r.t === "lembaga" && lbMap.has(r.id)) return barisLb(lbMap.get(r.id), at);
      if (r.t === "inovasi") { const x = inArr.find(y => y.id === r.id); if (x) return barisInovasi(x, at); }
      if (r.t === "sistem_data") { const x = sdArr.find(y => y.id === r.id); if (x) return barisSd(x, at); }
    } catch (e) { /* jatuh ke baris umum */ }
    return barisKaya({attr: at, logo: cariLogo(r, o), nama: r.n, jelas: "", pil: r.ex ? pilJenis(r.ex) : "", fakta: r.k}); };  function jalankanCari(q) {
    const box = $("akCariPanel"), nq = nrmCari(q), kata = nq.split(" ");
    if (nq.length < 2) { box.hidden = true; box.innerHTML = ""; return; }
    Promise.all([siapCari(), siapGraf(), tkArr.length ? 0 : ambilData("tokoh").then(t => { if (t && !tkArr.length) tkArr = dlist(Array.isArray(t) ? t : t?.tokoh); }), inArr.length ? 0 : ambilData("inovasi").then(t => { if (t && !inArr.length) inArr = dlist(Array.isArray(t) ? t : t?.inovasi); }), sdArr.length ? 0 : ambilData("sistem_data").then(t => { if (t && !sdArr.length) sdArr = dlist(Array.isArray(t) ? t : t?.sistem); })]).then(([I]) => { if (nrmCari($("akCari").value) !== nq) return;
      const g = {}; kata.length || 0;
      const cocok = s => kata.every(k => s.includes(k)); 
      semua.forEach(o => { if (cocok(o._normCari ||= nrmCari(o._cari))) (g.pakar ||= []).push({t: "pakar", id: o[0], n: o[1], ex: o[2], k: prodiDari(o)}); });
      I.forEach(r => { if (cocok(r.s)) (g[r.t] ||= []).push(r); });
      if (g.tokoh && g.pakar) { const pid = new Set(g.pakar.map(r => r.id)); g.tokoh = g.tokoh.filter(r => !(r.pid && pid.has(r.pid))); if (!g.tokoh.length) delete g.tokoh; }
      const html = CARI_GRUP.filter(([t]) => g[t]?.length).map(([t, l, tab]) => `<section class="ak-cr-g"><h3>${l}<small>${angka(g[t].length)}</small></h3>${daftarBkr(g[t].slice(0, 5).map(r => r.t === "pakar" ? cariBaris(r) : cariBaris(r)))}${g[t].length > 5 ? `<button type="button" class="ak-cr-all" data-crall="${t}|${esc(q)}">Lihat semua ${angka(g[t].length)}</button>` : ""}</section>`).join("");
      box.innerHTML = html || `<p class="ak-khampa">Tidak ada hasil untuk "${esc(q)}".</p>`; box.hidden = false; cariAktif = -1; });
  }
  function bukaHasilCari(tipe, id, q) {
    $("akCariPanel").hidden = true; const t = tipe;
    const isiTab = (n = 0) => { const i = document.querySelector(".ak-tampilan:not([hidden]) input[type=search]") || (!$("akIsi").hidden && $("akQ")); if (i && i.offsetParent) { i.value = q; i.dispatchEvent(new Event("input", {bubbles: true})); i.scrollIntoView({block: "center"}); } else if (n < 40) setTimeout(() => isiTab(n + 1), 150); };
    if (id != null) {
      if (t === "pakar") { const o = peta.get(id); if (o) buka(o); return; }
      if (t === "kampus") { profilKampus(id); return; }
      if (t === "wilayah") { location.assign("/wilayah?prov=" + encodeURIComponent(String(id).split("|")[0])); return; }
      if (t === "lembaga") { (async () => { if (!lbArr.length) { const l = await ambilData("lembaga"); if (l) indeksLb(l); } const x = lbMap.get(id); if (x) bukaLb(x); })(); return; }
      /* inovasi, sistem data, pendanaan, tokoh: buka lembarnya langsung lewat penangan klik global yang sama dengan kartu */
      const at = {inovasi: "inid", sistem_data: "sd", pendanaan: "sk", tokoh: "tkid"}[t];
      if (at) { const f = document.createElement("i"); f.hidden = true; f.dataset[at] = id; document.body.append(f); f.click(); f.remove(); return; }
      if (t === "buku") { const x = bkArr.find(b => b.id === id); if (x) { sheetBk(x); return; } }
      q = (CARI_IDX && null) || q;
    }
    const [tab, sub] = {pakar: ["pakar"], tokoh: ["pakar"], lembaga: ["lembaga", ""], inovasi: ["inovasi"], sistem_data: ["sistem_data"], pendanaan: ["pendanaan"], dokumen: ["pustaka", "dok"], buku: ["pustaka", "buku"], berita: ["pustaka", "berita"], wilayah: ["wilayah"], kampus: ["pakar"]}[t];
    if (t === "tokoh") pkSub = "tokoh"; else if (t === "pakar" || t === "kampus") pkSub = "akademisi";
    tampil(tab, sub); if (t === "lembaga") { lbSub = "daftar"; sinkron("akLS", "daftar"); } isiTab();
  }
  function pasangCari() {
    const inp = $("akCari"), box = $("akCariPanel"); let tm = 0;
    inp.addEventListener("input", () => { clearTimeout(tm); tm = setTimeout(() => nanti(() => jalankanCari(inp.value)), 120); });
    inp.addEventListener("focus", () => { siapCari(); if (inp.value.trim().length >= 2 && box.innerHTML) box.hidden = false; });
    const butir = () => [...box.querySelectorAll("[data-cr],[data-crall]")];
    const tandaiAktif = () => { const a = butir(); a.forEach((e, i) => e.classList.toggle("aktif", i === cariAktif)); a[cariAktif]?.scrollIntoView({block: "nearest"}); };
    inp.addEventListener("keydown", e => { const a = butir();
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (!a.length) return; cariAktif = (cariAktif + (e.key === "ArrowDown" ? 1 : -1) + a.length) % a.length; tandaiAktif(); }
      else if (e.key === "Enter") { const el = a[cariAktif] || a[0]; if (el) { e.preventDefault(); el.click(); } }
      else if (e.key === "Escape") { box.hidden = true; inp.blur(); } });
    box.addEventListener("click", e => { const h = e.target.closest("[data-cr]"); if (h) { if (e.target.closest("button[data-lb]")) return; const [t, ...r] = h.dataset.cr.split("|"); bukaHasilCari(t, r.join("|"), inp.value.trim()); return; }
      const all = e.target.closest("[data-crall]"); if (all) { const [t, ...r] = all.dataset.crall.split("|"); bukaHasilCari(t, null, r.join("|")); } });
    document.addEventListener("click", e => { if (!e.target.closest(".ak-cari-besar")) box.hidden = true; });
    document.addEventListener("keydown", e => { if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) && !document.activeElement?.isContentEditable) { e.preventDefault(); inp.focus(); inp.select(); } });
  }
  /* catatan orang (riwayat, pendidikan, kiprah, tautan) dimuat di awal supaya lembar pakar langsung memuatnya */
  const muatTokohAwal = async () => { if (tkArr.length) return; const d = await ambilData("tokoh"); tkArr = dlist(Array.isArray(d) ? d : d?.tokoh).filter(x => x && x.id && x.nama).map(x => Object.assign(x, {_cari: [x.nama, x.peran, x.lembaga, x.institusi, x.negara, ...dlist(x.afiliasi).map(a => a.nama_lembaga)].filter(Boolean).join(" ").toLowerCase()})); };
  async function mulai() {
    $("akMuat").innerHTML = '<div class="ak-hantu"></div>'.repeat(6);
    const galat = t => { $("akMuat").textContent = ""; $("akGalat").textContent = t; $("akGalat").hidden = false; };
    let r;
    try { r = await fetch("/api/direktori", {credentials: "same-origin"}); } catch (e) { galat("Gagal memuat data. Periksa koneksi lalu muat ulang halaman."); return; }
    $("akMuat").textContent = "";
    if (r.status === 401) { $("akMasuk").hidden = false; return; }
    if (!r.ok) { galat((await r.json().catch(() => ({}))).galat || `Gagal memuat (${r.status})`); return; }
    const d = await r.json();
    /* nama instansi pemerintah Indonesia dari OpenAlex masih berbahasa Inggris: tampilkan nama resminya */
    const INDO = {"Ministry of Public Works, Republic of Indonesia": "Kementerian Pekerjaan Umum", "Ministry of Public Works and Housing": "Kementerian Pekerjaan Umum", "Ministry of Environment and Forestry, Republic of Indonesia": "Kementerian Lingkungan Hidup dan Kehutanan", "Ministry of Environment and Forestry": "Kementerian Lingkungan Hidup dan Kehutanan", "Ministry of Agriculture": "Kementerian Pertanian", "Indonesian Agency for Agricultural Research and Development": "Badan Litbang Pertanian", "National Nuclear Energy Agency of Indonesia": "Badan Tenaga Nuklir Nasional", "Indonesian Oil Palm Research Institute": "Pusat Penelitian Kelapa Sawit", "Ministry of Finance": "Kementerian Keuangan", "Ministry of Education and Culture": "Kementerian Pendidikan dan Kebudayaan", "Ministry of Religious Affairs": "Kementerian Agama", "Ministry of Population and Family Planning": "Badan Kependudukan dan Keluarga Berencana Nasional", "Ministry of Research, Technology and Higher Education": "Kementerian Riset, Teknologi, dan Pendidikan Tinggi", "Indonesian Pediatric Society": "Ikatan Dokter Anak Indonesia", "National Institute of Science and Technology": "Institut Sains dan Teknologi Nasional", "Pertamina (Indonesia)": "Pertamina", "PT. Riset Perkebunan Nusantara": "Riset Perkebunan Nusantara", "Sekolah Tingi Pertanian Kutai Timur": "Sekolah Tinggi Pertanian Kutai Timur", "Tamansiswa Palembang University": "Universitas Tamansiswa Palembang", "Southeast Asian Regional Centre for Tropical Biology": "SEAMEO BIOTROP", "Gatot Soebroto Army Hospital": "Rumah Sakit Pusat Angkatan Darat Gatot Soebroto", "Informatics and Business Institute Darmajaya": "Institut Informatika Dan Bisnis Darmajaya", "Widya Karya Catholic University": "Universitas Katolik Widya Karya", "Sunan Kalijaga State Islamic University Yogyakarta": "Universitas Islam Negeri Sunan Kalijaga", "Manado State University": "Universitas Negeri Manado", "Mercu Buana University": "Universitas Mercu Buana", "Siliwangi University": "Universitas Siliwangi", "University of Surabaya": "Universitas Surabaya", "Pakuan University": "Universitas Pakuan", "UIN Sunan Ampel Surabaya": "Universitas Islam Negeri Sunan Ampel Surabaya", "Muhammadiyah University Purwokerto": "Universitas Muhammadiyah Purwokerto", "Duta Wacana Christian University": "Universitas Kristen Duta Wacana", "Walisongo State Islamic University": "Universitas Islam Negeri Walisongo Semarang", "Muhammadiyah University of Ponorogo": "Universitas Muhammadiyah Ponorogo", "University of Sarjanawiyata Tamansiswa": "Universitas Sarjanawiyata Tamansiswa", "Janabadra University": "Universitas Janabadra", "University of August 17, 1945 Banyuwangi": "Universitas 17 Agustus 1945 Banyuwangi", "Nasional University": "Universitas Nasional", "Serang Raya University": "Universitas Serang Raya", "Institute of Transportation and Logistic Trisakti": "Institut Transportasi dan Logistik Trisakti", "Trilogi University": "Universitas Trilogi", "University of HKBP Nommensen": "Universitas HKBP Nommensen", "Artha Wacana Christian University": "Universitas Kristen Artha Wacana", "De La Salle Catholic University": "Universitas Katolik De La Salle Manado", "Sanata Dharma University": "Universitas Sanata Dharma", "University of Bunda Mulia": "Universitas Bunda Mulia", "Bina Bangsa Getsempena University": "Universitas Bina Bangsa Getsempena", "Bogor Agricultural Development Polytechnic": "Politeknik Pembangunan Pertanian Bogor", "Widya Gama Mahakam University": "Universitas Widya Gama Mahakam Samarinda", "University of Darussalam Gontor": "Universitas Darussalam Gontor", "Surya University": "Universitas Surya", "IAIN Kudus": "Institut Agama Islam Negeri Kudus"};
    d.orang.forEach(o => { if (INDO[o[2]]) o[2] = INDO[o[2]]; });
    semua = d.orang.map(o => Object.assign(o, {_cari: [o[1], o[2], o[11], o[12], ...o[8], ...o[3]].join(" ").toLowerCase()}));
    siapkan(d);
    /* kampus.json dan kontak.json bisa belum ada (404/503): fitur provinsi dan email diam-diam hilang */
    const ambil = async u => { try { const x = await fetch(u, {credentials: "same-origin"}); return x.ok ? await x.json() : null; } catch (e) { return null; } };
    const [kj, kt] = await Promise.all([ambil("/api/direktori/kampus"), ambil("/api/direktori/kontak")]);
    kampusInfo = kj && typeof kj === "object" && !Array.isArray(kj) ? kj : {}; kontak = kt && typeof kt === "object" && !Array.isArray(kt) ? kt : {};
    peta = new Map(semua.map(o => [o[0], o]));
    try { dp = new Set((JSON.parse(localStorage.getItem(DP_KEY)) || []).filter(id => peta.has(id))); $("akDpPerlu").value = localStorage.getItem(PERLU_KEY) || ""; } catch (e) { dp = new Set(); }
    if (Object.values(kampusInfo).some(v => v?.prov)) $("akVBox").hidden = false;
    /* tautan dalam: ?prov=32&sektor=surya saring daftar, ?pakar=<id OpenAlex> membuka dialog pakar (id tak dikenal diabaikan) */
    const qs = new URLSearchParams(location.search); if (qs.get("wilayah")) WL.kode = qs.get("wilayah"); { const dp = bacaSektor(qs.get("sektor"), GLB.map(x => x[0]).filter(Boolean)); if (dp.length) { GL.set = new Set(dp); GL.r = tulisSektor(GL.set); st.sektor = new Set(glList()); } }
    const pv = qs.get("prov"), pk = qs.get("pakar");
    if (pv && !$("akVBox").hidden) { st.prov = new Set(pv.split(",").filter(v => PROV[v] || v === "?")); isiProv(); }   // ?prov=32,33 boleh banyak
    $("akIsi").hidden = false;
    $("akQ").addEventListener("input", () => { clearTimeout(tunda); tunda = setTimeout(() => { st.q = $("akQ").value.trim(); saring(); }, 200); });
    segmen("akS", "sumber", v => v);
    segmen("akU", "urut", v => +v);
    $("akHal").addEventListener("click", e => { const b = e.target.closest("button[data-h]"); if (!b || b.disabled) return; st.hal = +b.dataset.h; b.setAttribute("aria-current", "page"); nanti(() => gambar(true)); });
    $("akKBtn").addEventListener("click", () => bukaKampus($("akKPop").hidden));
    $("akKQ").addEventListener("input", daftarKampus);
    $("akKJenis").addEventListener("click", e => { const b = e.target.closest("button[data-j]"); if (!b) return; st.kJenis = b.dataset.j; daftarKampus(); $("akKQ").focus(); });
    $("akKDaftar").addEventListener("click", e => { const b = e.target.closest("button[data-k]"); if (!b) return; const s = balik(st.kampus, b.dataset.k); tandai($("akKDaftar"), "k", s); st.kampus = s; isiKampus(); nanti(() => aturKampus(s)); });
    $("akVBtn").addEventListener("click", () => bukaProv($("akVPop").hidden));
    $("akVQ").addEventListener("input", daftarProv);
    $("akVDaftar").addEventListener("click", e => { const b = e.target.closest("button[data-v]"); if (!b) return; const s = balik(st.prov, b.dataset.v); tandai($("akVDaftar"), "v", s); st.prov = s; isiProv(); nanti(() => aturProv(s)); });
    $("akPBtn").addEventListener("click", () => bukaProdi($("akPPop").hidden));
    $("akPQ").addEventListener("input", daftarProdi);
    $("akPDaftar").addEventListener("click", e => { const b = e.target.closest("button[data-p]"); if (b) { st.prodi = b.dataset.p; bukaProdi(false); chromeSaring(); nanti(saring); } });
    document.addEventListener("click", e => {
      const w = e.target.closest(".ak-kampus-pilih");
      if (!$("akKPop").hidden && w !== $("akKPop").parentElement) bukaKampus(false);
      if (!$("akPPop").hidden && w !== $("akPPop").parentElement) bukaProdi(false);
      if (!$("akVPop").hidden && w !== $("akVPop").parentElement) bukaProv(false);
      if (!$("akDpMenu").hidden && !e.target.closest("#akDpMenu,[data-dpa=unduh]")) { $("akDpMenu").hidden = true; document.querySelector("[data-dpa=unduh]").setAttribute("aria-expanded", "false"); }
    });
    /* label di kartu menyaring; klik di bagian lain kartu membuka profil */
    $("akDaftar").addEventListener("click", e => {
      if (e.target.closest(".ak-pilih")) { if (e.target.tagName === "INPUT") dpUbah(e.target.dataset.dp, e.target.checked); return; }
      const kp = e.target.closest("[data-kp]"); if (kp) { profilKampus(kp.dataset.kp); return; }
      const f = e.target.closest("[data-fk]");
      if (f) { const v = f.dataset.v;
        st[f.dataset.fk] = st[f.dataset.fk] instanceof Set ? new Set([v]) : v; chromeSaring(); isiKampus(); isiProv();
        nanti(() => { saring(); }); return; }
      const b = e.target.closest(".ak-orang"); if (b) buka(hasil[+b.dataset.i]);
    });
    $("akDaftar").addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("ak-orang")) { e.preventDefault(); buka(hasil[+e.target.dataset.i]); } });
    $("akLembar").addEventListener("click", e => { if (e.target.closest("[data-tutup]")) { tutup(); return; }
      const t = e.target.closest("[data-dp-t]"); if (t) { dpUbah(t.dataset.dpT, !dp.has(t.dataset.dpT)); return; }
      const bk = e.target.closest(".ak-rk-b[data-buka]"); if (bk) { const o = peta.get(bk.dataset.buka); if (o) buka(o); return; }
      const kp = e.target.closest("[data-kp]"); if (kp) profilKampus(kp.dataset.kp); });
    /* bilah daftar pendek */
    $("akDpBar").addEventListener("click", e => {
      const a = e.target.closest("[data-dpa]"), f = e.target.closest("[data-dpf]");
      if (f) { $("akDpMenu").hidden = true; document.querySelector("[data-dpa=unduh]").setAttribute("aria-expanded", "false"); nanti(() => eksporDp(f.dataset.dpf)); return; }
      if (!a) return;
      if (a.dataset.dpa === "lihat") (modeL() ? lihatDpl : lihatDp)();
      else if (a.dataset.dpa === "kosong") { if (modeL()) { dpl.clear(); dplSimpan(); } else { dp.clear(); dpSimpan(); } dpSegarkan(); }
      else { const buka = $("akDpMenu").hidden; $("akDpMenu").hidden = !buka; a.setAttribute("aria-expanded", String(buka)); if (buka) $("akDpPerlu").focus(); } });
    /* lembar bawah */
    $("akSheet").addEventListener("click", e => {
      if (e.target.closest("[data-tutup-s]")) { tutupSheet(); return; }
      const h = e.target.closest("[data-hapus]"); if (h) { dpUbah(h.dataset.hapus, false); return; }
      const hl = e.target.closest("[data-hapusl]"); if (hl) { dplUbah(hl.dataset.hapusl, false); return; }
      const tl = e.target.closest("[data-dpl-t]"); if (tl) { dplUbah(tl.dataset.dplT, !dpl.has(tl.dataset.dplT)); return; }
      const lb = e.target.closest("[data-lb]"); if (lb) { const x = lbMap.get(lb.dataset.lb); if (x) bukaLb(x); return; }
      const b = e.target.closest("[data-buka]"); if (b) { const o = peta.get(b.dataset.buka); tutupSheet(); if (o) buka(o); return; }
      const krm = e.target.closest("[data-ksektor]"); if (krm) { const kk = krm.dataset.kpK; st.kJenis = jenisK(kk); pilihKampus(kk); st.prodi = ""; st.bidang = krm.dataset.ksektor; $("akBd")?._label?.(); tutupSheet(); chromeSaring(); isiKampus(); nanti(() => { saring(); document.querySelector(".ak-hasil")?.scrollIntoView({block: "start"}); }); return; }
      const kpr = e.target.closest("[data-kprodi]"); if (kpr) { const kk = kpr.dataset.kpK; st.kJenis = jenisK(kk); pilihKampus(kk); st.prodi = kpr.dataset.kprodi; tutupSheet(); chromeSaring(); isiKampus(); nanti(() => { saring(); document.querySelector(".ak-hasil")?.scrollIntoView({block: "start"}); }); return; }
      const sa = e.target.closest("[data-sa]"); if (!sa) return;
      const k = $("akSheet").dataset.k;
      if (sa.dataset.sa === "tambah") dpTambahBanyak(semua.filter(o => o[2] === k).sort((x, y) => y[4] - x[4] || y[6] - x[6]).slice(0, 10));
      else { st.kJenis = jenisK(k); if (st.prov.size && !cocokProvK(k)) pilihProv(""); pilihKampus(k); tutupSheet(); } });
    /* tooltip batang sektor: berlaku untuk pointer dan fokus papan ketik */
    const tipBar = (e, br) => { const tip = $("akTip"); if (!br) { tip.hidden = true; return; }
      tip.innerHTML = `<b>${esc(br.dataset.t)}</b><span><i data-st="background:${br.style.getPropertyValue("--w0")}"></i>${angka(br.dataset.n)} pakar</span><small>${esc(br.dataset.p)}% dari ${angka(br.dataset.tot)} pakar kampus</small>`;
      tip.hidden = false; const r = br.getBoundingClientRect(), x = e.clientX ?? r.left + 40, y = e.clientY ?? r.top;
      tip.style.left = Math.min(Math.max(8, x + 12), innerWidth - tip.offsetWidth - 8) + "px"; tip.style.top = Math.max(8, y - tip.offsetHeight - 12) + "px"; };
    $("akSheet").addEventListener("pointermove", e => tipBar(e, e.target.closest(".ak-br")));
    $("akSheet").addEventListener("pointerleave", () => { $("akTip").hidden = true; });
    $("akSheet").addEventListener("focusin", e => { const b = e.target.closest(".ak-br"); if (b) tipBar({}, b); });
    $("akSheet").addEventListener("focusout", () => { $("akTip").hidden = true; });
    $("akLembar").addEventListener("pointermove", sorotGrafik); $("akSheet").addEventListener("pointermove", sorotGrafik);
    $("akLembar").addEventListener("pointerleave", () => document.querySelectorAll(".ak-grafik.aktif").forEach(f => { f.classList.remove("aktif"); f.querySelector(".ak-gr-tip").hidden = true; }));
    $("akLembar").addEventListener("pointerout", e => { const f = e.target.closest?.(".ak-grafik"); if (f && !f.contains(e.relatedTarget)) { f.classList.remove("aktif"); f.querySelector(".ak-gr-tip").hidden = true; } });
    document.addEventListener("keydown", e => {
      if (e.key !== "Escape") return;
      if ($("akDrawer") && !$("akDrawer").hidden && $("akSheet").hidden) tutupDrawer(); else if (!$("akSheet").hidden) tutupSheet(); else if (!$("akDpMenu").hidden) { $("akDpMenu").hidden = true; document.querySelector("[data-dpa=unduh]").setAttribute("aria-expanded", "false"); } else if (!$("akLembar").hidden) tutup(); else if (!$("akVPop").hidden) { bukaProv(false); $("akVBtn").focus(); } else if (!$("akKPop").hidden) { bukaKampus(false); $("akKBtn").focus(); } else if (!$("akPPop").hidden) { bukaProdi(false); $("akPBtn").focus(); }
    });
    $("akReset").addEventListener("click", () => {
      Object.assign(st, {q: "", sektor: new Set(), bidang: "", sumber: "", prodi: "", baru: false, prov: new Set()}); $("akBaruTog").setAttribute("aria-pressed", "false"); $("akQ").value = ""; isiProv();
      $("akS").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.v === "")));
      pilihKampus("");
    });
    saring(); dpSegarkan();
    $("akBaruTog").addEventListener("click", () => { st.baru = !st.baru; $("akBaruTog").setAttribute("aria-pressed", String(st.baru)); nanti(saring); });
    nanti(muatBaru); nanti(muatAfiliasi);   // tombol dummy 🧪/🧹 disembunyikan atas permintaan pemilik 31 Okt; pulihkan: nanti(pasangDummyAk)
    await muatTokohAwal().catch(() => {});
    pasangTampil((qs.get("tampil") || (!pk && !pv && bacaTampil()) || "pakar"), qs.get("sub") || "");
    if (qs.get("tampil") === "lembaga" && (qs.get("sub") === "analisa" || qs.get("sub") === "daftar")) { let n = 0; const t = setInterval(() => { if ($("akLS") && lbArr.length) { clearInterval(t); subLb("daftar"); } else if (++n > 40) clearInterval(t); }, 300); }
    const o = pk && peta.get(pk); if (o) nanti(() => buka(o));
  }

  // foto gagal dimuat (Scholar menghapus/menolak): ganti lingkaran inisial; logo gagal: buang
  document.addEventListener("error", e => {
    const img = e.target;
    if (img.tagName !== "IMG") return;
    if (img.closest?.(".ak-lgo")) { const n = (img.dataset.next || "").split("|").filter(Boolean); if (n.length) { img.dataset.next = n.slice(1).join("|"); img.src = n[0]; } else img.remove(); return; }
    if (img.classList.contains("ak-fav") || img.classList.contains("ak-bsmp-img")) { img.remove(); return; }
    if (img.closest?.(".ak-pinlogo")) { const n = (img.dataset.next || "").split("|").filter(Boolean); if (n.length) { img.dataset.next = n.slice(1).join("|"); img.src = n[0]; } else img.remove(); return; }
    if (img.classList.contains("ak-logo") || img.classList.contains("ak-klogo") || img.classList.contains("ak-sampul-logo")) { img.remove(); return; }
    const sp = img.parentElement?.classList.contains("ak-sampul") ? img.parentElement : null;
    if (sp && img === sp.firstElementChild) { sp.classList.add("kosong"); const i = document.createElement("span"); i.className = "ak-sampul-inisial"; i.textContent = img.dataset.inisial || ""; img.replaceWith(i); return; }
    if (!img.classList.contains("ak-foto")) return;
    const s = document.createElement("span"); s.className = img.className + (img.dataset.ci ? " ak-ini ak-ci" + img.dataset.ci : ""); if (img.dataset.inisial) s.textContent = img.dataset.inisial; else s.innerHTML = SIL; s.setAttribute("aria-hidden", "true");
    img.replaceWith(s);
  }, true);

  /* semua deretan pilihan wajib berikon: tombol .ak-seg tanpa ikon dilengkapi menurut teksnya */
  const IKON_SEG = {semua: IK_SEMUA, jurnal: IKL.jenis, prosiding: IKL.jenis, buku: IKL.jenis, "paling dikutip": METRIK[2][3], terbaru: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', titik: IKON_PIN, sebaran: IK_SEMUA, provinsi: IKON_PIN, "kab/kota": IKON_PIN, dokumen: IKL.jenis, berita: IKL.jenis, peta: IKON_PIN, daftar: IKL.jenis, analisa: METRIK[0][3], "proyek mitra": IK_UANG, pusat: IK_KAMPUS, aset: KAT.riset[1], "pusat studi": IK_KAMPUS};
  const IK_TITIK = '<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="8.5"/>';
  let hiasT = 0;
  function hiasSeg() { cancelAnimationFrame(hiasT); hiasT = requestAnimationFrame(() => document.querySelectorAll(".ak-seg button:not([data-ik]), .ak-subtab button:not([data-ik])").forEach(b => { b.dataset.ik = "1"; if (b.querySelector("svg")) return; const t = b.textContent.trim().toLowerCase(), d = IKON_SEG[t] || IKON_SEG[t.split(" ")[0]] || IK_TITIK; b.insertAdjacentHTML("afterbegin", ikon(d, "currentColor")); })); }
  new MutationObserver(hiasSeg).observe(document.body, {childList: true, subtree: true}); hiasSeg();
  /* logo pin yang terlalu kecil atau kosong (favicon 16px, piksel transparan) dibuang supaya ikon kategori tampil */
  document.addEventListener("error", e => { const i = e.target; if (i.tagName === "IMG" && i.classList?.contains("ak-lw")) { const px = i.getAttribute("width") || 20, sp = document.createElement("span"); sp.className = "ak-lw ak-lw0"; sp.style.cssText = `width:${px}px;height:${px}px`; sp.innerHTML = ikon(IKON_PIN, "currentColor"); i.replaceWith(sp); } }, true);
  document.addEventListener("load", e => { const img = e.target; if (img.tagName === "IMG" && img.closest?.(".ak-pinlogo") && (img.naturalWidth < 24 || img.naturalHeight < 24)) img.remove(); }, true);
  mulai();
})();
