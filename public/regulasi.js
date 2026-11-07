import { mulaiHalaman } from "/inti/kepala.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, nanti, debounce, hantuHtml, kosongHtml, galatHtml, ikon } from "/inti/umum.js";
import { muat, label, urlAman, norm, namaRegulasi, kelasStatus } from "/publik.js";

const HAL = 25;
const S = { q: "", jenis: "", tahun: "", status: "", topik: "", tingkat: "", tampil: "daftar", hal: 1 };
const KUNCI = Object.keys(S);
let D = null;

const tingkatDari = (r) => (r.jenis === "perda" ? "daerah" : "nasional");
const urut = (a, b) => (b.tahun || 0) - (a.tahun || 0) || String(b.tanggal_ditetapkan || "").localeCompare(String(a.tanggal_ditetapkan || ""));

function bacaUrl() {
  const p = new URLSearchParams(location.search);
  for (const k of KUNCI) if (p.has(k)) S[k] = k === "hal" ? Math.max(1, +p.get(k) || 1) : p.get(k);
  if (S.tampil !== "linimasa") S.tampil = "daftar";
  return p.get("id") || "";
}
function tulisUrl(id) {
  const u = new URL(location.href);
  for (const k of KUNCI) { const v = S[k]; const kosong = !v || (k === "tampil" && v === "daftar") || (k === "hal" && v === 1); kosong ? u.searchParams.delete(k) : u.searchParams.set(k, v); }
  id ? u.searchParams.set("id", id) : u.searchParams.delete("id");
  history.replaceState(null, "", u);
}

function saring() {
  const q = norm(S.q.trim());
  return D.baris.filter((r) => (!S.jenis || r.jenis === S.jenis) && (!S.tahun || String(r.tahun) === S.tahun) && (!S.status || r.status === S.status)
    && (!S.topik || (r.topik || []).includes(S.topik)) && (!S.tingkat || tingkatDari(r) === S.tingkat) && (!q || r._cari.includes(q))).sort(urut);
}

const opsi = (nilai, teks, pilih) => `<option value="${esc(nilai)}"${pilih === nilai ? " selected" : ""}>${esc(teks)}</option>`;
function pilih(id, kunciSemua, nilai, daftar, aktif) {
  return `<select class="jm-pilih" id="${id}" data-k="${id}" aria-label="${esc(t(kunciSemua))}">${opsi("", t(kunciSemua), aktif)}${daftar.map(([v, l]) => opsi(v, l, aktif)).join("")}</select>`;
}
function gambarSaring() {
  const hitung = (f) => [...new Set(D.baris.flatMap(f).filter(Boolean))];
  const jenis = hitung((r) => [r.jenis]).map((v) => [v, label("reg.jenis.", v) ]);
  const tahun = hitung((r) => [r.tahun]).sort((a, b) => b - a).map((v) => [String(v), String(v)]);
  const status = ["berlaku", "diubah", "dicabut"].map((v) => [v, label("reg.status.", v)]);
  const topik = hitung((r) => r.topik || []).map((v) => [v, label("reg.topik.", v)]).sort((a, b) => a[1].localeCompare(b[1]));
  const tingkat = ["nasional", "daerah"].map((v) => [v, label("reg.tingkat.", v)]);
  document.getElementById("saring").innerHTML = `
    <label class="jm-cari"><span class="sr">${esc(t("reg.cari"))}</span>${ikon("cari")}<input class="jm-isian" type="search" id="q" value="${esc(S.q)}" placeholder="${esc(t("reg.cari"))}" autocomplete="off"></label>
    ${pilih("jenis", "reg.semua.jenis", 0, jenis, S.jenis)}${pilih("tahun", "reg.semua.tahun", 0, tahun, S.tahun)}${pilih("status", "reg.semua.status", 0, status, S.status)}
    ${pilih("topik", "reg.semua.topik", 0, topik, S.topik)}${pilih("tingkat", "reg.semua.tingkat", 0, tingkat, S.tingkat)}
    <button type="button" class="jm-tbl" data-aksi="reset">${esc(t("jm.kosong.reset"))}</button>`;
  document.getElementById("tampil").innerHTML = ["daftar", "linimasa"].map((v) => `<button type="button" role="tab" data-tampil="${v}" aria-selected="${S.tampil === v}">${esc(t("reg.tampil." + v))}</button>`).join("");
}

const pil = (r) => `<span class="jm-pil ${kelasStatus(r.status)}">${esc(label("reg.status.", r.status))}</span>`;
function barisHtml(r) {
  return `<li><button type="button" class="jm-baris" data-id="${esc(r.id)}"><span class="jm-baris-no">${esc(namaRegulasi(r))}</span><span class="jm-baris-judul">${esc(r.judul)}</span>
    <span class="jm-baris-meta">${pil(r)}<span>${esc(r.instansi_penerbit || "-")}</span><span>${esc(tanggal(r.tanggal_ditetapkan))}</span></span></button></li>`;
}

function gambarDaftar(rows) {
  const maks = Math.max(1, Math.ceil(rows.length / HAL));
  S.hal = Math.min(S.hal, maks);
  const potong = rows.slice((S.hal - 1) * HAL, S.hal * HAL);
  document.getElementById("isi").innerHTML = potong.length ? `<ul class="jm-daftar">${potong.map(barisHtml).join("")}</ul>` : kosongHtml("jm.kosong.cocok", { data: "reset", kunci: "jm.kosong.reset" });
  document.getElementById("hal").innerHTML = maks > 1 ? `<button type="button" class="jm-tbl jm-tbl-kecil" data-hal="-1"${S.hal <= 1 ? " disabled" : ""}>${esc(t("jm.sebelumnya"))}</button><span>${esc(t("jm.hal", { n: angka(S.hal) }))} / ${angka(maks)}</span><button type="button" class="jm-tbl jm-tbl-kecil" data-hal="1"${S.hal >= maks ? " disabled" : ""}>${esc(t("jm.berikutnya"))}</button>` : "";
}

/** Linimasa: per tahun, terbit (baris di tahun itu) + mengubah/mencabut (ikatan baris itu, dicatat pada tahun penerbit pengubah). */
function gambarLinimasa(rows) {
  document.getElementById("hal").innerHTML = "";
  const per = new Map();
  const tahunDari = (y) => per.get(y) || per.set(y, { terbit: [], mengubah: [], mencabut: [] }).get(y);
  for (const r of rows) {
    const y = r.tahun || 0; tahunDari(y).terbit.push(r);
    for (const ik of r.ikatan || []) if (ik.jenis === "mengubah" || ik.jenis === "mencabut") tahunDari(y)[ik.jenis].push({ oleh: r, ke: ik.ke });
  }
  const tahun = [...per.keys()].sort((a, b) => b - a);
  if (!tahun.length) { document.getElementById("isi").innerHTML = kosongHtml("jm.kosong.cocok", { data: "reset", kunci: "jm.kosong.reset" }); return; }
  const tombol = (id, teks) => `<button type="button" data-id="${esc(id)}">${esc(teks)}</button>`;
  const nama = (id) => { const x = D.byId.get(id); return x ? namaRegulasi(x) : id; };
  const tanda = (j, n) => (n ? `<span class="jm-tanda jm-tanda-${j}">${esc(t("reg.tl." + j))} ${angka(n)}</span>` : "");
  document.getElementById("isi").innerHTML = `<div class="jm-linimasa">${tahun.map((y, i) => {
    const p = per.get(y);
    const li = [
      ...p.terbit.map((r) => `<li><span class="jm-tanda jm-tanda-terbit">${esc(t("reg.tl.terbit"))}</span>${tombol(r.id, namaRegulasi(r))}<span>${esc(r.judul)}</span></li>`),
      ...p.mengubah.map((x) => `<li><span class="jm-tanda jm-tanda-mengubah">${esc(t("reg.tl.mengubah"))}</span>${tombol(x.oleh.id, namaRegulasi(x.oleh))}<span>${esc(t("reg.tl.atas"))}</span>${D.byId.has(x.ke) ? tombol(x.ke, nama(x.ke)) : `<span>${esc(x.ke)}</span>`}</li>`),
      ...p.mencabut.map((x) => `<li><span class="jm-tanda jm-tanda-mencabut">${esc(t("reg.tl.mencabut"))}</span>${tombol(x.oleh.id, namaRegulasi(x.oleh))}<span>${esc(t("reg.tl.atas"))}</span>${D.byId.has(x.ke) ? tombol(x.ke, nama(x.ke)) : `<span>${esc(x.ke)}</span>`}</li>`),
    ].join("");
    return `<details class="jm-tahun"${i < 2 ? " open" : ""}><summary>${y || "-"} ${tanda("terbit", p.terbit.length)}${tanda("mengubah", p.mengubah.length)}${tanda("mencabut", p.mencabut.length)}</summary><ul>${li}</ul></details>`;
  }).join("")}</div>`;
}

function gambarIsi() {
  const rows = saring();
  document.getElementById("hitung").textContent = t("reg.hitung", { n: angka(rows.length), total: angka(D.baris.length) });
  (S.tampil === "linimasa" ? gambarLinimasa : gambarDaftar)(rows);
}

/* ---------- RUU EBET ---------- */
const adalahRuu = (r) => r.jenis === "ruu" || /^RUU\b|rancangan undang-undang/i.test(r.judul || "");
async function gambarRuu() {
  const el = document.getElementById("ruu");
  const baris = D.baris.find(adalahRuu);
  let tahap = baris ? label("reg.status.", baris.status) : "", sumber = "";
  if (baris) sumber = urlAman(baris.url_sumber) ? `<a href="${esc(baris.url_sumber)}" target="_blank" rel="noopener noreferrer">${esc(t("reg.naskah"))}</a>` : "";
  else {
    // belum ada baris RUU di berkas regulasi: tahap diturunkan dari agenda publik METI (audiensi RDPU Komisi XII), diberi pil belum diverifikasi
    try {
      const k = (await muat("kalender")).baris.filter((b) => /RUU EBET/i.test(b.judul)).sort((a, b) => b.tanggal.localeCompare(a.tanggal))[0];
      if (!k) { el.innerHTML = ""; return; }
      tahap = t("reg.ruu.tahap");
      sumber = `<span class="jm-sumber">${esc(t("reg.ruu.sumber", { tanggal: tanggal(k.tanggal), mitra: k.mitra }))}</span> <span class="jm-pil jm-pil-warn">${esc(t("reg.ruu.belum"))}</span>`;
    } catch (e) { el.innerHTML = ""; return; }
  }
  el.innerHTML = `<section class="jm-kartu jm-sorot" aria-labelledby="ruu-j"><h2 id="ruu-j">${esc(t("reg.ruu.judul"))} <span class="jm-pil">${esc(t("reg.ruu.label"))}</span></h2>
    <p>${esc(baris ? baris.judul : t("reg.ruu.nama"))}</p><p><strong>${esc(t("reg.ruu.tahap_label"))}:</strong> ${esc(tahap)}</p><p>${sumber}</p></section>`;
}

/* ---------- lembar profil ---------- */
function terkait(r) {
  const proyek = D.proyek.filter((p) => (p.regulasi_ids || []).includes(r.id) || (r.proyek_ids || []).includes(p.id));
  const program = D.program.filter((g) => (g.regulasi_ids || []).includes(r.id) || (r.program_ids || []).includes(g.id));
  return { proyek, program };
}
function profilHtml(r) {
  const nama = (id) => { const x = D.byId.get(id); return x ? `<button type="button" data-id="${esc(id)}">${esc(namaRegulasi(x))}</button>` : `<span>${esc(id)}</span>`; };
  const rantai = (judul, daftar, kunci, pasif) => (daftar?.length ? `<section><h3>${esc(t(judul))}</h3><ul class="jm-rantai">${daftar.map((x) => `<li><span class="jm-tanda jm-tanda-${x.jenis}">${esc(t((pasif ? "reg.tp." : "reg.tl.") + x.jenis))}</span>${nama(x[kunci])}</li>`).join("")}</ul></section>` : "");
  const { proyek, program } = terkait(r);
  const lain = (n) => (n > 8 ? ` <small>${esc(t("reg.lainnya", { n: angka(n - 8) }))}</small>` : "");
  const sat = (p) => esc(`${p.nama}${p.lokasi?.provinsi ? ", " + p.lokasi.provinsi : ""}`);
  const dd = (k, v) => (v ? `<dt>${esc(t(k))}</dt><dd>${v}</dd>` : "");
  return `<div class="jm-lembar-isi"><div class="jm-lembar-kepala"><div><p class="jm-baris-no">${esc(namaRegulasi(r))}</p><h2 id="lembar-j">${esc(r.judul)}</h2></div>
    <button type="button" class="iconbtn" data-aksi="tutup" aria-label="${esc(t("jm.tutup"))}">${ikon("tutup", 22)}</button></div>
    <div class="jm-baris-meta">${pil(r)}<span class="jm-pil">${esc(label("reg.tingkat.", tingkatDari(r)))}</span></div>
    <dl class="jm-dl">${dd("reg.f.jenis", esc(label("reg.jenis.", r.jenis)))}${dd("reg.f.penerbit", esc(r.instansi_penerbit))}${dd("reg.f.ditetapkan", esc(tanggal(r.tanggal_ditetapkan)))}${r.tanggal_diundangkan ? dd("reg.f.diundangkan", esc(tanggal(r.tanggal_diundangkan))) : ""}${dd("reg.f.topik", (r.topik || []).map((x) => esc(label("reg.topik.", x))).join(", "))}</dl>
    <section><h3>${esc(t("reg.f.ringkasan"))} ${/^\S+ \d+\/\d+ mengatur /.test(r.ringkasan || "") ? `<span class="jm-pil jm-pil-est">${esc(t("reg.otomatis"))}</span>` : ""}</h3><p>${esc(r.ringkasan || "-")}</p></section>
    ${r.posisi_meti ? `<section class="jm-posisi"><h3>${esc(t("reg.f.posisi"))}</h3><p>${esc(r.posisi_meti)}</p></section>` : ""}
    ${rantai("reg.rantai.ikatan", r.ikatan, "ke")}${rantai("reg.rantai.diikat", r.diikat_oleh, "dari", true)}
    ${proyek.length || program.length ? `<section><h3>${esc(t("reg.terkait"))}</h3><ul class="jm-rantai">${program.map((g) => `<li><span class="jm-pil">${esc(t("reg.program"))}</span>${esc(g.nama)}</li>`).join("")}${proyek.slice(0, 8).map((p) => `<li><span class="jm-pil">${esc(t("reg.proyek"))}</span>${sat(p)}</li>`).join("")}</ul>${lain(proyek.length)}</section>` : ""}
    <section><h3>${esc(t("reg.f.sumber"))}</h3><p class="jm-baris-meta">${urlAman(r.url_sumber) ? `<a href="${esc(r.url_sumber)}" target="_blank" rel="noopener noreferrer">${esc(t("reg.naskah"))}</a>` : ""}${urlAman(r.url_pdf) ? `<a href="${esc(r.url_pdf)}" target="_blank" rel="noopener noreferrer">${esc(t("reg.pdf"))}</a>` : ""}<span>${esc(t("reg.diambil", { tanggal: tanggal(r.tanggal_ambil) }))}</span></p></section></div>`;
}
function bukaProfil(id) {
  const r = D.byId.get(id), dlg = document.getElementById("lembar");
  if (!r) return;
  dlg.innerHTML = profilHtml(r);
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
  tulisUrl(id);
}

/* ---------- mulai ---------- */
async function muatData() {
  const isi = document.getElementById("isi");
  isi.innerHTML = hantuHtml(6);
  try {
    const [reg, proyek, program] = await Promise.all([muat("regulasi"), muat("proyek"), muat("program")]);
    D = { baris: reg.baris, byId: new Map(reg.baris.map((r) => [r.id, r])), proyek: proyek.baris, program: program.baris, diambil: reg.baris.reduce((m, r) => (r.tanggal_ambil > m ? r.tanggal_ambil : m), reg.dibangun_pada || "") };
    for (const r of D.baris) r._cari = norm(`${r.judul} ${namaRegulasi(r)} ${r.jenis} ${r.nomor} tahun ${r.tahun}`);
    return true;
  } catch (e) { isi.innerHTML = galatHtml("layanan"); return false; }
}
function gambarSemua() {
  gambarSaring(); gambarIsi(); gambarRuu();
  document.getElementById("sumber").textContent = t("reg.sumber", { tanggal: tanggal(D.diambil) });
}

async function main() {
  await mulaiHalaman();
  const idAwal = bacaUrl();
  const mulai = async () => { if (await muatData()) { gambarSemua(); if (idAwal && D.byId.has(idAwal)) bukaProfil(idAwal); } };
  await mulai();
  if (!D) { document.getElementById("isi").addEventListener("click", (e) => e.target.closest("[data-aksi=ulang]") && mulai()); return; }

  const tunda = () => nanti(() => { tulisUrl(new URLSearchParams(location.search).get("id")); gambarIsi(); });
  const cariTunda = debounce(() => { S.hal = 1; tunda(); });
  document.getElementById("saring").addEventListener("input", (e) => { if (e.target.id === "q") { S.q = e.target.value; cariTunda(); } });
  document.getElementById("saring").addEventListener("change", (e) => { const k = e.target.dataset.k; if (k) { S[k] = e.target.value; S.hal = 1; tunda(); } });
  document.getElementById("saring").addEventListener("click", (e) => {
    if (!e.target.closest("[data-aksi=reset]")) return;
    Object.assign(S, { q: "", jenis: "", tahun: "", status: "", topik: "", tingkat: "", hal: 1 });
    for (const el of document.querySelectorAll("#saring select")) el.value = "";
    document.getElementById("q").value = ""; tunda();
  });
  document.getElementById("tampil").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tampil]"); if (!b) return;
    S.tampil = b.dataset.tampil; S.hal = 1;
    for (const x of document.querySelectorAll("#tampil button")) x.setAttribute("aria-selected", String(x === b)); // chrome urgent
    tunda();
  });
  const bukaDari = (e) => { const b = e.target.closest("[data-id]"); if (b) bukaProfil(b.dataset.id); };
  document.getElementById("isi").addEventListener("click", (e) => { bukaDari(e); if (e.target.closest("[data-aksi=reset]")) document.querySelector("#saring [data-aksi=reset]").click(); });
  document.getElementById("hal").addEventListener("click", (e) => {
    const b = e.target.closest("[data-hal]"); if (!b) return;
    S.hal += +b.dataset.hal; tunda(); nanti(() => document.getElementById("saring").scrollIntoView({ block: "start" }));
  });
  const dlg = document.getElementById("lembar");
  dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest("[data-aksi=tutup]")) dlg.close(); else bukaDari(e); });
  dlg.addEventListener("close", () => tulisUrl(""));
  document.addEventListener("jm:bahasa", () => nanti(() => { gambarSemua(); const id = new URLSearchParams(location.search).get("id"); if (id && dlg.open) dlg.innerHTML = profilHtml(D.byId.get(id)); }));
}
main();
