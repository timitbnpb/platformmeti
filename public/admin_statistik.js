/* /admin: tab Statistik. "Orang dan AI, dihitung terpisah" (GET /api/admin/lalin?r=) + statistik lama (cari, halaman: GET /api/admin/statistik?hari=N).
   Tanpa data pribadi: pengunjung = hash bergaram harian, tanpa IP; kata cari yang menyerupai surel/nomor disamarkan. */
import { t, ada, angka, tanggal, tanggalDariUnix, bahasa } from "/i18n.js";
import { esc, api, nanti, hantuHtml, kosongHtml, ikon } from "/inti/umum.js";
import { kepalaTab, ubinKepala, keadaan } from "/admin_umum.js";
import { exHtml } from "/inti/komponen.js";
import { pasangTabel } from "/admin_tabel.js";

const HARI = [7, 30, 90];
const RENTANG = [["24j", "lal.r.24j"], ["7h", "lal.r.7h"], ["30h", "lal.r.30h"], ["semua", "lal.r.semua"]];
const W = 640, H = 200, KIRI = 36, BAWAH = 22, ATAS = 8;
const samar = (s) => (/@|\d{6,}|https?:/i.test(s) ? t("sta.samar") : s);
const pct = (a, b) => (b > 0 ? angka((a / b) * 100, { desimal: 1 }) + "%" : "-");
const KOMPOSISI = [["orang", "lal.k.orang", 1], ["ai_jawab", "lal.k.ai_jawab", 3], ["ai_crawl", "lal.k.ai_crawl", 4], ["mesin_cari", "lal.k.mesin_cari", 5]];

/* ---------- grafik garis generik: titik = [{ label, v }] ---------- */
function garis(titik, kelas, judul) {
  const maks = Math.max(1, ...titik.map((d) => d.v)), n = titik.length;
  const x = (i) => KIRI + (n > 1 ? (i / (n - 1)) * (W - KIRI - 8) : 0), y = (v) => ATAS + (1 - v / maks) * (H - ATAS - BAWAH);
  const tick = [0, maks / 2, maks].map((v) => `<line class="sta-grid" x1="${KIRI}" x2="${W - 8}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="sta-sb" x="${KIRI - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${esc(angka(Math.round(v)))}</text>`).join("");
  const pts = titik.map((d, i) => `${x(i).toFixed(1)},${y(d.v).toFixed(1)}`).join(" ");
  const bulat = titik.map((d, i) => `<circle class="${kelas}-t" cx="${x(i).toFixed(1)}" cy="${y(d.v).toFixed(1)}" r="2.5"><title>${esc(d.label)}: ${esc(angka(d.v))}</title></circle>`).join("");
  return `<svg class="sta-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(judul)}" preserveAspectRatio="xMidYMid meet">${tick}
    <text class="sta-sb" x="${KIRI}" y="${H - 4}">${esc(titik[0].label)}</text><text class="sta-sb" x="${W - 8}" y="${H - 4}" text-anchor="end">${esc(titik[n - 1].label)}</text>
    <polyline class="${kelas}" fill="none" points="${pts}"/>${bulat}</svg>`;
}
const kartuGrafik = (judulKunci, ik, titik, kelas) => `<section class="jm-adm-kartu"><header class="jm-adm-kh">${ikon(ik, 20)}<h3>${esc(t(judulKunci))}</h3><span class="jm-hitung">${esc(angka(titik.reduce((s, d) => s + d.v, 0)))}</span></header><div class="jm-adm-isi">${titik.length ? garis(titik, kelas, t(judulKunci)) : kosongHtml("sta.kosong")}</div></section>`;

/* ---------- komposisi total: batang bertumpuk (grafik, bukan progress per baris) ---------- */
function komposisi(tot) {
  const jml = KOMPOSISI.reduce((s, [k]) => s + (tot[k] || 0), 0);
  let x = 0;
  const seg = jml ? KOMPOSISI.map(([k, , c]) => { const w = ((tot[k] || 0) / jml) * 100, r = `<rect class="sta-s${c}" x="${x.toFixed(3)}" y="0" width="${w.toFixed(3)}" height="10"><title>${esc(t("lal.k." + k))}: ${esc(angka(tot[k] || 0))}</title></rect>`; x += w; return r; }).join("") : "";
  const legenda = KOMPOSISI.map(([k, kk, c]) => `<li><i class="sta-b${c}"></i><span>${esc(t(kk))}</span><b>${esc(angka(tot[k] || 0))}</b><small>${esc(pct(tot[k] || 0, jml))}</small></li>`).join("");
  return { jml, html: `<svg class="sta-komp" viewBox="0 0 100 10" preserveAspectRatio="none" role="img" aria-label="${esc(t("lal.komposisi"))}"><rect class="sta-s0" x="0" y="0" width="100" height="10"/>${seg}</svg><ul class="sta-legenda sta-legenda-n">${legenda}</ul>` };
}
const kartuTotal = (judulKunci, ikn, tot, sub) => {
  const k = komposisi(tot);
  return `<section class="jm-adm-kartu"><header class="jm-adm-kh">${ikon(ikn, 20)}<h3>${esc(t(judulKunci))}</h3></header><div class="jm-adm-isi sta-total"><p class="jm-kh-angka"><b>${esc(angka(k.jml))}</b><span>${esc(t("lal.kunjungan"))}</span></p><p class="jm-bantu">${esc(sub)}</p>${k.html}</div></section>`;
};

/* ---------- label tabel ---------- */
const lab = (awal, k) => (ada(awal + k) ? t(awal + k) : k);
function negara(k) { try { return new Intl.DisplayNames([bahasa()], { type: "region" }).of(k) || k; } catch { return k; } }
const veri = (v) => (v === "terverifikasi" ? t("lal.v.terverifikasi") : v === "palsu" ? t("lal.v.palsu") : t("lal.v.tak"));
const tak = (k) => (k === "bot lain" ? t("lal.tak.bot") : k === "jaringan hosting/cloud" ? t("lal.tak.hosting") : k === "tanpa tanda peramban" ? t("lal.tak.tanpa") : k.startsWith("perayap palsu: ") ? t("lal.tak.palsu", { n: k.slice(15) }) : k);
const kolom2 = (kolomKunci, fn = (k) => esc(k)) => [
  { k: "kunci", judul: t(kolomKunci), nilai: (r) => String(r[0]), tampil: (r) => fn(r[0]) },
  { k: "n", judul: t("lal.c.jumlah"), num: true, nilai: (r) => r[1], tampil: (r) => esc(angka(r[1])) }];

const tabelKartu = (id, judulKunci, ik) => `<section class="jm-adm-kartu"><header class="jm-adm-kh">${ikon(ik, 20)}<h3>${esc(t(judulKunci))}</h3></header><div class="jm-adm-isi" id="${id}"></div></section>`;

/* ---------- tab ---------- */
export function panelStatistik(panel) {
  const S = { r: "7h", hari: 30, ctl: null, ctl2: null };
  panel.innerHTML = `${kepalaTab("analisis", "sta.ey", "sta.j", "sta.d")}
    <div class="jm-tab sta-seg" role="tablist" aria-label="${esc(t("lal.r.label"))}">${RENTANG.map(([k, kk]) => `<button type="button" role="tab" data-r="${k}" aria-selected="${k === S.r}" tabindex="${k === S.r ? 0 : -1}">${esc(t(kk))}</button>`).join("")}</div>
    <div id="sLalin" aria-live="polite"></div>
    <div class="sta-lama"><h3 class="jm-adm-sub">${ikon("cari", 20)}${esc(t("lal.lama"))}</h3>
    <div class="jm-bar jm-adm-bar1"><select data-ikon="tahun" class="jm-pilih" id="sHari" aria-label="${esc(t("sta.rentang"))}">${HARI.map((h) => `<option value="${h}"${h === S.hari ? " selected" : ""}>${esc(t("sta.hari", { n: h }))}</option>`).join("")}</select></div>
    <div id="sIsi" aria-live="polite"></div></div>`;
  const lalin = panel.querySelector("#sLalin"), isi = panel.querySelector("#sIsi");
  panel.addEventListener("change", (e) => { if (e.target.id === "sHari") { S.hari = +e.target.value; muatLama(); } });
  panel.addEventListener("click", (e) => {
    if (e.target.closest("[data-aksi=ulang]")) { muat(); muatLama(); return; }
    const b = e.target.closest("[data-r]");
    if (b && b.getAttribute("aria-selected") !== "true") {
      for (const x of panel.querySelectorAll(".sta-seg [data-r]")) { x.setAttribute("aria-selected", String(x === b)); x.tabIndex = x === b ? 0 : -1; } // chrome urgent
      S.r = b.dataset.r;
      muat();
    }
  });
  muat(); muatLama();

  async function muat() {
    if (S.ctl) S.ctl.abort();
    S.ctl = new AbortController();
    lalin.innerHTML = hantuHtml(5);
    let d;
    try { d = await api(`/api/admin/lalin?r=${S.r}`, { signal: S.ctl.signal }); } catch (e) { if (e.name !== "AbortError") lalin.innerHTML = keadaan(e.kode || "umum"); return; }
    nanti(() => gambar(d));
  }

  function gambar(d) {
    const dim = d.dim || {}, seri = d.seri || [];
    const jumlah = (k) => (d.rentang === "24j" ? d.total24[k] : seri.reduce((s, x) => s + (x[k] || 0), 0));
    ubinKepala(panel, [{ ikon: "orang", nilai: d.online, label: t("lal.kini.satuan") }, { ikon: "orang", nilai: jumlah("orang"), label: t("lal.u.orang") }, { ikon: "info", nilai: jumlah("ai_jawab"), label: t("lal.u.ai_jawab") }]);
    const sekarang = `<section class="jm-adm-kartu sta-kini"><header class="jm-adm-kh">${ikon("orang", 20)}<h3>${esc(t("lal.kini"))}</h3></header><div class="jm-adm-isi"><p class="jm-kh-angka"><b>${esc(angka(d.online))}</b><span>${esc(t("lal.kini.satuan"))}</span></p><div id="lKini"></div></div></section>`;
    const kartu = `<div class="jm-adm-dua">${kartuTotal("lal.t24", "linimasa", d.total24, t("lal.t24.sub"))}${kartuTotal("lal.tsemua", "kalender", d.sejak, t("lal.tsemua.sub", { tgl: tanggal(d.mulai) }))}</div>`;
    const ubin = [["orang", "orang", jumlah("orang")], ["tampilan", "berita", d.rentang === "24j" ? null : jumlah("tampilan")], ["ai_jawab", "info", jumlah("ai_jawab")], ["klik_ai", "tautan", jumlah("klik_ai")], ["ai_crawl", "analisis", jumlah("ai_crawl")], ["mesin_cari", "cari", jumlah("mesin_cari")]]
      .map(([k, ik, n]) => `<li>${ikon(ik, 20)}<b>${esc(angka(n))}</b><span>${esc(t("lal.u." + k))}</span></li>`).join("");
    const titik = (k) => (d.rentang === "24j" ? (d.per_jam || []).map((p) => ({ label: p.jam + ":00", v: p[k] || 0 })) : seri.map((p) => ({ label: tanggal(p.tgl), v: p[k] || 0 })));
    const grafikIsi = `<div class="sta-tiga">${kartuGrafik("lal.g.orang", "orang", titik("orang"), "sta-g1")}${kartuGrafik("lal.g.ai", "info", titik("ai_jawab"), "sta-g3")}${kartuGrafik("lal.g.klik", "tautan", titik("klik_ai"), "sta-g4")}</div>`;
    const sumber = d.rentang === "24j" ? t("lal.dim.24j") : "";
    lalin.innerHTML = `${sekarang}${kartu}
      <h3 class="jm-adm-sub">${ikon("analisis", 20)}${esc(t("lal.ubin"))}</h3><ul class="sta-ubin">${ubin}</ul>
      ${grafikIsi}
      ${sumber ? `<p class="jm-bantu">${esc(sumber)}</p>` : ""}
      <div class="sta-masonry">${[["lHal", "lal.t.halaman", "berita"], ["lRuj", "lal.t.rujukan", "tautan"], ["lKan", "lal.t.kanal", "topik"], ["lNeg", "lal.t.negara", "wilayah"], ["lPer", "lal.t.perangkat", "laptop"], ["lAgen", "lal.t.agen", "info"], ["lAih", "lal.t.ai_halaman", "berita"], ["lBot", "lal.t.jalur_bot", "direktori"], ["lCr", "lal.t.crawler", "analisis"], ["lTak", "lal.t.tak", "blokir"]].map((x) => tabelKartu(...x)).join("")}</div>
      ${exHtml({ ikon: "metode", topik: t("sta.ey"), tingkat: "h3", judulHtml: esc(t("lal.cara")), subHtml: esc(t("lal.cara.sub")), isiHtml: `<ul class="sta-cara">${[1, 2, 3, 4, 5, 6].map((i) => `<li>${esc(t("lal.cara." + i))}</li>`).join("")}</ul><p class="jm-bantu">${esc(d.rentang_ip.operator ? t("lal.ip.ada", { n: d.rentang_ip.operator, tgl: tanggalDariUnix(d.rentang_ip.diambil) }) : t("lal.ip.kosong"))}</p>` })}`;
    const q = (id) => lalin.querySelector("#" + id);
    const lihat = (id, kolomK, daftar, fn, per = 10) => pasangTabel(q(id), { kolom: kolom2(kolomK, fn), baris: daftar || [], per, satuan: "jm.pag.u.data" });
    q("lKini").innerHTML = d.buka.length ? `<ul class="sta-daftar">${d.buka.map(([j, n]) => `<li><span>${esc(j)}</span><b>${esc(angka(n))}</b></li>`).join("")}</ul>` : `<p class="jm-bantu">${esc(t("lal.kini.kosong"))}</p>`;
    lihat("lHal", "lal.c.halaman", dim.halaman);
    lihat("lRuj", "lal.c.rujukan", dim.rujukan, (k) => esc(k === "(langsung)" ? t("lal.langsung") : k));
    lihat("lKan", "lal.c.kanal", dim.kanal, (k) => esc(lab("lal.kanal.", k)));
    lihat("lNeg", "lal.c.negara", dim.negara, (k) => esc(k === "?" ? t("lal.tak_tahu") : negara(k)));
    lihat("lPer", "lal.c.perangkat", dim.perangkat, (k) => esc(lab("lal.perangkat.", k)));
    lihat("lAgen", "lal.c.asisten", dim.ai_agen, (k) => { const [n, v] = k.split("|"); return `${esc(n)} <span class="jm-pil ${v === "terverifikasi" ? "jm-pil-ok" : "jm-pil-mati"}">${esc(veri(v))}</span>`; });
    lihat("lAih", "lal.c.halaman", dim.ai_halaman);
    lihat("lBot", "lal.c.halaman", dim.jalur_bot);
    lihat("lTak", "lal.c.alasan", dim.tak, (k) => esc(tak(k)));
    const cr = (dim.perayap || []).map(([k, n]) => { const [j, nama, v] = k.split("|"); return { j, nama, v, n }; });
    pasangTabel(q("lCr"), { per: 10, satuan: "jm.pag.u.data", baris: cr, kolom: [
      { k: "nama", judul: t("lal.c.perayap"), nilai: (r) => r.nama, tampil: (r) => esc(r.nama) },
      { k: "j", judul: t("lal.c.jenis"), nilai: (r) => t("lal.jenis." + r.j), tampil: (r) => `<span class="jm-pil">${esc(t("lal.jenis." + r.j))}</span>` },
      { k: "v", judul: t("lal.c.status"), nilai: (r) => r.v, tampil: (r) => `<span class="jm-pil ${r.v === "terverifikasi" ? "jm-pil-ok" : "jm-pil-mati"}">${esc(veri(r.v))}</span>` },
      { k: "n", judul: t("lal.c.jumlah"), num: true, nilai: (r) => r.n, tampil: (r) => esc(angka(r.n)) }] });
  }

  /* ---------- statistik lama: halaman dan pencarian ---------- */
  async function muatLama() {
    if (S.ctl2) S.ctl2.abort();
    S.ctl2 = new AbortController();
    isi.innerHTML = hantuHtml(3);
    let d;
    try { d = await api(`/api/admin/statistik?hari=${S.hari}`, { signal: S.ctl2.signal }); } catch (e) { if (e.name !== "AbortError") isi.innerHTML = keadaan(e.kode || "umum"); return; }
    nanti(() => {
      const h = d.harian || [];
      const titik = (k) => h.map((p) => ({ label: tanggal(p.tanggal), v: p[k] || 0 }));
      isi.innerHTML = `<div class="jm-adm-dua">${kartuGrafik("sta.halaman", "berita", titik("halaman"), "sta-g1")}${kartuGrafik("sta.cari", "cari", titik("cari"), "sta-g2")}</div>
        <div class="sta-masonry">${tabelKartu("sHal", "sta.top_halaman", "berita")}${tabelKartu("sCari", "sta.top_cari", "cari")}</div>`;
      const baris = (a, f) => (a || []).map((r) => [f(r.kunci), r.jumlah]);
      pasangTabel(isi.querySelector("#sHal"), { kolom: kolom2("sta.c.halaman"), baris: baris(d.halaman, String), per: 10, satuan: "jm.pag.u.data" });
      pasangTabel(isi.querySelector("#sCari"), { kolom: kolom2("sta.c.kata"), baris: baris(d.cari, (k) => samar(String(k))), per: 10, satuan: "jm.pag.u.data" });
    });
  }
}
