/* /admin tab Ringkasan (kunci tab tetap "hariini"): pita periode, Angka utama (periode vs pembanding), Perlu tindakan, Papan wilayah.
   Satu panggilan GET /api/admin/ringkas?dari=&sampai=. Kunci yang belum dikirim server (undefined/null) tampil "Belum ada data", bukan nol.
   INP: chrome pita (aria-pressed, label, tanggal) berubah sinkron di handler; ambil data dan gambar ulang menyusul lewat nanti(). */
import { t, angka, tanggal } from "/i18n.js";
import { esc, api, nanti, hantuHtml, ikon } from "/inti/umum.js";
import { kepalaTab, ubinKepala, keadaan, data } from "/admin_umum.js";

const KUNCI_SIMPAN = "meti.adm.periode";
const MODE = ["hari", "minggu", "bulan", "rentang", "12bln"];
const MAKS_HARI = 400;
/* [kunci data, ikon, tab tujuan] */
const KARTU = [
  ["pendaftar_baru", "orang", "persetujuan"], ["anggota_aktif", "daftar", "anggota"], ["koreksi_masuk", "ubah", "koreksi"],
  ["pesan_masuk", "surel", "pesan"], ["konsultasi_baru", "palu", "konsultasi"], ["langganan_baru", "berita", "langganan"],
  ["pengunjung", "analisis", "statistik"], ["portal_masuk", "centang", "portal"],
];
/* Perlu tindakan: [kunci antrean, ikon, tab, nada] */
const TINDAK = [
  ["pendaftar", "orang", "persetujuan", "bad"], ["bukti", "kartu", "persetujuan", "bad"], ["koreksi", "ubah", "koreksi", "warn"], ["portal", "centang", "portal", "warn"],
  ["pesan", "surel", "pesan", "info"], ["konsultasi", "palu", "konsultasi", "info"],
];
const PULAU = ["sumatera", "jawa", "kalimantan", "sulawesi", "bali", "maluku", "papua"];

/* ---------- tanggal (YYYY-MM-DD, zona WIB; hitung di UTC agar tak bergeser) ---------- */
const DAY = 86400000;
const keMs = (s) => Date.parse(s + "T00:00:00Z");
const keTgl = (ms) => new Date(ms).toISOString().slice(0, 10);
const tambahHari = (s, n) => keTgl(keMs(s) + n * DAY);
const tambahBulan = (s, n) => { const d = new Date(keMs(s)); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + n); return keTgl(d.getTime()); };
const akhirBulan = (s) => tambahHari(tambahBulan(s, 1), -1);
const hariIni = () => keTgl(Date.now() + 7 * 3600e3);
const senin = (s) => { const w = (new Date(keMs(s)).getUTCDay() + 6) % 7; return tambahHari(s, -w); };
const selisih = (a, b) => Math.round((keMs(b) - keMs(a)) / DAY) + 1;
const sah = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "") && !isNaN(keMs(s));

function rentangDari(mode, ref, ren) {
  if (mode === "hari") return [ref, ref];
  if (mode === "minggu") { const a = senin(ref); return [a, tambahHari(a, 6)]; }
  if (mode === "bulan") { const a = tambahBulan(ref, 0); return [a, akhirBulan(a)]; }
  if (mode === "12bln") return [tambahBulan(ref, -11), akhirBulan(ref)];
  return ren;
}
function geser(mode, ref, ren, arah) {
  if (mode === "hari") return { ref: tambahHari(ref, arah) };
  if (mode === "minggu") return { ref: tambahHari(ref, 7 * arah) };
  if (mode === "bulan") return { ref: tambahBulan(ref, arah) };
  if (mode === "12bln") return { ref: tambahBulan(ref, 12 * arah) };
  const n = selisih(ren[0], ren[1]);
  return { ren: [tambahHari(ren[0], n * arah), tambahHari(ren[1], n * arah)] };
}

const baca = () => { try { return JSON.parse(localStorage.getItem(KUNCI_SIMPAN) || "null"); } catch { return null; } };
const simpan = (o) => { try { localStorage.setItem(KUNCI_SIMPAN, JSON.stringify(o)); } catch { /* penyimpanan dilarang: abaikan */ } };

/* ---------- HTML kecil ---------- */
const taut = (ke) => `href="/admin?tab=${ke}" data-ke="${ke}"`;
const kosongKunci = (v) => v === undefined || v === null;
function pilDelta(n, banding) {
  if (kosongKunci(banding)) return `<span class="jm-pil">${esc(t("adm.rs.tanpa_banding"))}</span>`;
  if (!banding) return n ? `<span class="jm-pil jm-pil-ok">${esc(t("adm.rs.baru"))}</span>` : `<span class="jm-pil">${esc(t("adm.rs.tetap"))}</span>`;
  const p = (n - banding) / banding * 100;
  if (!Math.round(p)) return `<span class="jm-pil">${esc(t("adm.rs.tetap"))}</span>`;
  return `<span class="jm-pil ${p > 0 ? "jm-pil-ok" : "jm-pil-warn"}">${p > 0 ? "▲" : "▼"} ${esc(angka(Math.abs(p), { desimal: 0 }))}%</span>`;
}
const sel = (judul, tgl, nilai, pilHtml, kuat) => `<div class="jm-rs-sel${kuat ? " jm-rs-sel-kuat" : ""}"><small>${esc(judul)}</small><span class="jm-rs-tgl">${esc(tgl)}</span>${kosongKunci(nilai)
  ? `<span class="jm-pil jm-rs-nodata">${esc(t("adm.rs.belum"))}</span>` : `<strong class="${nilai ? "" : "jm-rs-nol"}">${esc(angka(nilai))}</strong>`}${pilHtml}</div>`;

export function panelHariIni(panel, { tabAda }) {
  const s = baca() || {};
  const H = hariIni();
  const K = {
    mode: MODE.includes(s.mode) ? s.mode : "hari", ref: H,
    ren: sah(s.dari) && sah(s.sampai) && s.dari <= s.sampai && selisih(s.dari, s.sampai) <= MAKS_HARI ? [s.dari, s.sampai] : [tambahHari(H, -6), H],
  };
  let urutan = 0;
  panel.innerHTML = `${kepalaTab("ringkasan", "adm.rs.ey", "adm.rs.j", "adm.rs.d").replace("jm-kh-tab", "jm-kh-tab jm-kh-gelap")}
    <div class="jm-rs-pita" id="rsPita"></div><div class="jm-adm-rapat" id="rsIsi">${hantuHtml(5)}</div>`;
  const pita = panel.querySelector("#rsPita"), isi = panel.querySelector("#rsIsi");

  const rentang = () => rentangDari(K.mode, K.ref, K.ren);
  const labelRentang = ([a, b]) => (a === b ? tanggal(a) : `${tanggal(a)} - ${tanggal(b)}`);

  function gambarPita() {
    const [a, b] = rentang();
    const n = geser(K.mode, K.ref, K.ren, 1), p = geser(K.mode, K.ref, K.ren, -1);
    const refBesok = rentangDari(K.mode, n.ref || K.ref, n.ren || K.ren)[0];
    const sblm = K.mode === "hari" ? "adm.rs.kemarin" : "adm.rs.sebelum", brkt = K.mode === "hari" ? "adm.rs.besok" : "adm.rs.berikut";
    const m0 = senin(K.mode === "rentang" ? a : K.ref);
    const strip = Array.from({ length: 7 }, (_, i) => {
      const d = tambahHari(m0, i), aktif = d >= a && d <= b;
      return `<button type="button" class="jm-rs-hari${d === H ? " jm-rs-ini" : ""}" data-rs-hari="${d}" aria-pressed="${aktif}"${d > H ? ' data-masa="1"' : ""}><small>${esc(t("adm.rs.h" + (i + 1)))}</small><b>${+d.slice(8)}</b></button>`;
    }).join("");
    pita.innerHTML = `<div class="jm-rs-mode" role="group" aria-label="${esc(t("adm.rs.periode"))}">${MODE.map((m) => `<button type="button" data-rs-mode="${m}" aria-pressed="${m === K.mode}">${esc(t("adm.rs.m." + m))}</button>`).join("")}</div>
      ${K.mode === "rentang" ? `<div class="jm-rs-ren"><label>${esc(t("adm.rs.dari"))}<input class="jm-isian" type="date" data-rs-dari value="${esc(K.ren[0])}" max="${esc(H)}"></label><label>${esc(t("adm.rs.sampai"))}<input class="jm-isian" type="date" data-rs-sampai value="${esc(K.ren[1])}" max="${esc(H)}"></label></div>` : ""}
      <div class="jm-rs-geser">
        <button type="button" class="jm-rs-nav" data-rs-geser="-1" aria-label="${esc(t(sblm))}">${ikon("panah-kiri", 18)}<span><small>${esc(t(sblm))}</small>${esc(labelRentang(rentangDari(K.mode, p.ref || K.ref, p.ren || K.ren)))}</span></button>
        <div class="jm-rs-kini" aria-live="polite"><small>${esc(t("adm.rs.periode"))}</small><b>${esc(labelRentang([a, b]))}</b>${a <= H && H <= b && K.mode === "hari" ? "" : `<button type="button" class="jm-rs-hariini" data-rs-ini>${esc(t("adm.rs.hari_ini"))}</button>`}</div>
        <button type="button" class="jm-rs-nav jm-rs-nav-kanan${refBesok > H ? " jm-rs-redup" : ""}" data-rs-geser="1" aria-label="${esc(t(brkt))}"><span><small>${esc(t(brkt))}</small>${esc(labelRentang(rentangDari(K.mode, n.ref || K.ref, n.ren || K.ren)))}</span>${ikon("panah-kanan", 18)}</button>
      </div>
      <div class="jm-rs-minggu"><button type="button" class="jm-rs-nav" data-rs-minggu="-1" aria-label="${esc(t("adm.rs.minggu_lalu"))}">${ikon("panah-kiri", 18)}</button><div class="jm-rs-strip">${strip}</div><button type="button" class="jm-rs-nav" data-rs-minggu="1" aria-label="${esc(t("adm.rs.minggu_depan"))}">${ikon("panah-kanan", 18)}</button></div>`;
  }

  /* chrome sinkron, lalu data menyusul */
  function terapkan() {
    gambarPita();
    const [a, b] = rentang();
    simpan({ mode: K.mode, dari: K.ren[0], sampai: K.ren[1] });
    const no = ++urutan;
    isi.setAttribute("aria-busy", "true");
    nanti(() => {
      if (no !== urutan || !isi.isConnected) return;
      Promise.all([api("/api/admin/ringkas?" + new URLSearchParams({ dari: a, sampai: b })).catch((e) => ({ galat: e.kode || "umum" })), data("kesegaran").catch(() => null)])
        .then(([r, kes]) => nanti(() => {
          if (no !== urutan || !isi.isConnected) return;
          isi.removeAttribute("aria-busy");
          isi.innerHTML = r.galat ? keadaan(r.galat) : gambar(r, kes, [a, b]);
        }));
    });
  }

  pita.addEventListener("click", (e) => {
    const m = e.target.closest("[data-rs-mode]"), g = e.target.closest("[data-rs-geser]"), h = e.target.closest("[data-rs-hari]"), w = e.target.closest("[data-rs-minggu]"), ini = e.target.closest("[data-rs-ini]");
    if (m) {
      if (m.dataset.rsMode === K.mode) return;
      if (m.dataset.rsMode === "rentang") K.ren = rentang();
      K.mode = m.dataset.rsMode;
    } else if (g) Object.assign(K, geser(K.mode, K.ref, K.ren, +g.dataset.rsGeser));
    else if (h) { K.mode = "hari"; K.ref = h.dataset.rsHari; }
    else if (w) { const d = tambahHari(senin(K.mode === "rentang" ? K.ren[0] : K.ref), 7 * +w.dataset.rsMinggu); K.mode = K.mode === "rentang" ? "hari" : K.mode; K.ref = d; }
    else if (ini) { K.ref = H; if (K.mode === "rentang") K.mode = "hari"; }
    else return;
    terapkan();
  });
  pita.addEventListener("change", (e) => {
    const d = pita.querySelector("[data-rs-dari]")?.value, s2 = pita.querySelector("[data-rs-sampai]")?.value;
    if (!e.target.matches("[data-rs-dari],[data-rs-sampai]") || !sah(d) || !sah(s2) || d > s2 || selisih(d, s2) > MAKS_HARI) return;
    K.ren = [d, s2];
    terapkan();
  });

  function gambar(r, kes, [a, b]) {
    const P = r.periode || {}, A = P.angka || {}, q = r.antrean || {};
    const bd = [P.banding_dari || tambahHari(a, -selisih(a, b)), P.banding_sampai || tambahHari(a, -1)];
    const labPer = labelRentang([a, b]), labBd = labelRentang(bd);
    const kartu = KARTU.filter(([, , ke]) => tabAda(ke)).map(([k, ik, ke]) => {
      const v = A[k] || {}, n = kosongKunci(A[k]) ? null : v.n;
      return `<section class="jm-rs-k"><a class="jm-rs-kh" ${taut(ke)}>${ikon(ik, 20)}<h3>${esc(t("adm.rs.k." + k))}</h3>${ikon("panah-kanan", 16)}</a>
        <div class="jm-rs-dua">${sel(t("adm.rs.periode"), labPer, n, kosongKunci(n) ? "" : pilDelta(n, v.banding), true)}${sel(t("adm.rs.pembanding"), labBd, kosongKunci(n) ? null : v.banding, "")}</div></section>`;
    }).join("");
    const basi = kes ? (kes.ringkas?.basi || 0) : 0;
    const tindak = [...TINDAK.filter(([, , ke]) => tabAda(ke)).map(([k, ik, ke, nada]) => [q[k] || 0, ik, ke, nada, t("adm.rs.t." + k), t("adm.rs.t." + k + ".s")]),
      ...(basi && tabAda("kesegaran") ? [[basi, "jam", "kesegaran", "bad", t("adm.rs.t.basi"), t("adm.rs.t.basi.s")]] : [])].filter((x) => x[0] > 0);
    const totalTindak = tindak.reduce((z, x) => z + x[0], 0);
    const pTindak = tindak.length ? `<aside class="jm-rs-tindak" aria-labelledby="rsTj"><h2 id="rsTj">${ikon("lonceng", 20)}${esc(t("adm.rs.tindak"))}<span class="jm-pil jm-pil-bad">${esc(angka(totalTindak))}</span></h2><ul>${tindak.map(([n, ik, ke, nada, j, sub]) => `<li><a ${taut(ke)}><b class="jm-rs-ang jm-rs-${nada}">${esc(angka(n))}</b><span class="jm-rs-tt"><strong>${esc(j)}</strong><small>${esc(sub)}</small></span>${ikon("panah-kanan", 16)}</a></li>`).join("")}</ul></aside>` : "";
    const sat = (kes && kes.ringkas) || {};
    ubinKepala(panel, [{ ikon: "lonceng", nilai: totalTindak, label: t("adm.hi.k.menunggu") }, { ikon: "orang", nilai: kosongKunci(A.pengunjung) ? "-" : A.pengunjung.n, label: t("adm.rs.k.pengunjung") }, { ikon: "centang", nilai: sat.basi || 0, label: t("adm.hi.k.data") }]);
    return `<div class="jm-rs-grid${tindak.length ? "" : " jm-rs-satu"}"><section class="jm-rs-utama" aria-labelledby="rsUj"><h2 id="rsUj" class="jm-rs-h">${ikon("ringkasan", 20)}${esc(t("adm.rs.utama"))}</h2><div class="jm-rs-kartu">${kartu}</div></section>${pTindak}</div>${papan(r.papan_wilayah)}`;
  }

  function papan(daftar) {
    const kepala = `<h2 id="rsPj" class="jm-rs-h">${ikon("wilayah", 20)}${esc(t("adm.rs.papan"))}</h2>`;
    if (!Array.isArray(daftar)) return `<section class="jm-rs-papan" aria-labelledby="rsPj">${kepala}<p class="jm-pil jm-rs-nodata">${esc(t("adm.rs.belum"))}</p></section>`;
    const grup = new Map();
    for (const w of daftar) { const p = String(w.pulau || "").trim() || "-"; if (!grup.has(p)) grup.set(p, []); grup.get(p).push(w); }
    const urut = (p) => { const i = PULAU.findIndex((x) => p.toLowerCase().startsWith(x)); return i < 0 ? 99 : i; };
    const isiP = [...grup].sort((x, y) => urut(x[0]) - urut(y[0])).map(([p, ws]) => `<div class="jm-rs-pulau"><h3>${esc(p)}<span class="jm-pil">${esc(angka(ws.length))}</span></h3><ul class="jm-rs-wil">${ws.map((w) => `<li><a ${taut("metiwilayah")}>
      <strong>${esc(w.nama)}</strong><small>${esc(t("adm.rs.kode", { k: w.kode_prov }))}</small>
      <span class="jm-rs-pils"><span class="jm-pil${w.anggota ? "" : " jm-rs-redup"}">${esc(t("adm.rs.anggota", { n: angka(w.anggota || 0) }))}</span>${w.menunggu ? `<span class="jm-pil jm-pil-warn">${esc(t("adm.rs.menunggu", { n: angka(w.menunggu) }))}</span>` : ""}<span class="jm-pil ${w.admin_ada ? "jm-pil-ok" : "jm-pil-bad"}">${esc(t(w.admin_ada ? "adm.rs.admin_ada" : "adm.rs.admin_belum"))}</span></span></a></li>`).join("")}</ul></div>`).join("");
    return `<section class="jm-rs-papan" aria-labelledby="rsPj">${kepala}${isiP || `<p class="jm-pil jm-rs-nodata">${esc(t("adm.rs.belum"))}</p>`}</section>`;
  }

  terapkan();
}
