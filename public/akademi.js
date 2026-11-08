/* /akademi: jalur belajar EBT (6 modul) yang merangkai konten wiki yang ada, kuis pilihan ganda bersumber, lencana partisipasi.
   Data /data/akademi.json; fungsi murni akademi_hitung.js. Progres disimpan di peramban (localStorage), tanpa server: tidak ada data pribadi yang dikirim.
   INP: centang langkah dan pilihan jawaban berubah seketika; ubin, grafik, dan lencana menyusul lewat nanti(). */
import { t, angka, bahasa } from "/i18n.js";
import { esc, nanti, ikon, hantuHtml, galatHtml } from "/inti/umum.js";
import { khUbin } from "/inti/kh.js";
import { exHtml } from "/inti/komponen.js";
import { hlHtml } from "/inti/aksi_ex.js";
import { buktiHtml } from "/inti/bukti.js";
import { batang } from "/grafik.js";
import { KUNCI, hrefSumber, nilaiKuis, statusModul, berikutnya, lencana, bersihkanProgres } from "/akademi_hitung.js";

const $ = (id) => document.getElementById(id);
const N = (n, d = 0) => angka(n, { desimal: d });
const L = (o) => o?.[bahasa()] ?? o?.id ?? "";
const IK_LANGKAH = { topik: "topik", istilah: "kamus", metode: "metode", izin: "lencana", halaman: "tautan" };
const IK_TAHAP = { baru: "jam", jalan: "linimasa", siap: "survei", lulus: "medali" };
const PIL_TAHAP = { baru: "", jalan: "jm-pil-info", siap: "jm-pil-warn", lulus: "jm-pil-ok" };
const ex = (o) => exHtml({ tingkat: "h2", ...o });
const hip = () => buktiHtml("kajian");
const isi = $("adIsi");
isi.innerHTML = hantuHtml(6);

let D;
try { D = await fetch("/data/akademi.json", { credentials: "same-origin" }).then((r) => { if (!r.ok) throw new Error("data"); return r.json(); }); } catch (e) {
  isi.innerHTML = galatHtml("jaringan");
  isi.querySelector("[data-aksi=ulang]")?.addEventListener("click", () => location.reload());
  throw e;
}
const MODUL = new Map(D.modul.map((m) => [m.id, m]));
let P;
try { P = bersihkanProgres(JSON.parse(localStorage.getItem(KUNCI)), D); } catch (e) { P = bersihkanProgres(null, D); }
const simpan = () => { try { localStorage.setItem(KUNCI, JSON.stringify(P)); } catch (e) { /* mode privat: progres hanya selama halaman terbuka */ } };
const stat = (m) => statusModul(m, P, D.lulus_persen);

/* ---------- kepala ---------- */
function ubin() {
  const st = D.modul.map(stat), langkah = st.reduce((a, s) => a + s.selesai, 0), total = st.reduce((a, s) => a + s.total, 0);
  khUbin("adUbin", [
    { ikon: "akademi", nilai: N(D.modul.length), label: t("ad.u1") },
    { ikon: "centang", nilai: `${N(langkah)}/${N(total)}`, label: t("ad.u2") },
    { ikon: "survei", nilai: `${N(st.filter((s) => s.tahap === "lulus").length)}/${N(D.modul.length)}`, label: t("ad.u3") },
    { ikon: "medali", nilai: N(lencana(D, P).modul.length + (lencana(D, P).semua ? 1 : 0)), label: t("ad.u4") },
  ]);
}

/* ---------- jalur belajar ---------- */
const labelSumber = (s) => t("ad.sumber." + s.jenis);
function langkahHtml(m, l, i) {
  const id = `adl-${m.id}-${i}`, centang = P.langkah[m.id + "/" + i] === 1;
  return `<li class="ad-lg"><input type="checkbox" id="${id}" data-lg="${esc(m.id + "/" + i)}"${centang ? " checked" : ""}><label for="${id}"><span class="ad-lg-ik">${ikon(IK_LANGKAH[l.jenis] ?? "tautan", 16)}</span><span class="ad-lg-t">${esc(L(l.judul))}</span></label><a class="jm-tbl jm-tbl-kecil" href="${esc(hrefSumber(l))}" aria-label="${esc(t("ad.buka") + ": " + L(l.judul))}">${ikon("tautan", 14)}<span>${esc(t("ad.buka"))}</span></a></li>`;
}
function modulHtml(m, no, saran) {
  const s = stat(m);
  return `<article class="ad-modul ad-tk-${esc(m.warna)}${saran === m.id ? " ad-saran" : ""}" id="adm-${esc(m.id)}" data-m="${esc(m.id)}">
    <header><span class="ad-no">${no}</span><span class="ad-mik">${ikon(m.ikon, 22)}</span><div class="ad-mt"><h3>${esc(L(m.judul))}</h3><p>${esc(L(m.ringkas))}</p></div></header>
    <div class="ad-meta"><span class="ad-st jm-pil ${PIL_TAHAP[s.tahap]}" data-st>${ikon(IK_TAHAP[s.tahap], 14)}<span>${esc(t("ad.tahap." + s.tahap))}</span></span>
      <span class="ad-info">${ikon("jam", 14)}<span>${esc(t("ad.menit", { n: m.menit }))}</span></span><span class="ad-info">${ikon("survei", 14)}<span>${esc(t("ad.soal", { n: m.kuis.length }))}</span></span>
      ${saran === m.id ? `<span class="jm-pil jm-pil-info">${ikon("kompas", 14)}<span>${esc(t("ad.saran"))}</span></span>` : ""}</div>
    <ol class="ad-lgs">${m.langkah.map((l, i) => langkahHtml(m, l, i)).join("")}</ol>
    <footer><span class="ad-hit" data-hit>${esc(t("ad.langkah_selesai", { a: s.selesai, b: s.total }))}${s.terbaik != null ? " " + esc(t("ad.terbaik", { n: s.terbaik })) : ""}</span>
      <button type="button" class="jm-tbl jm-tbl-utama" data-kuis="${esc(m.id)}"${s.selesai === s.total ? "" : " aria-disabled=\"true\""}>${ikon("survei", 16)}<span>${esc(t(s.terbaik != null ? "ad.kuis.ulang" : "ad.kuis.mulai"))}</span></button></footer></article>`;
}
function segarkanKartu(m) {
  const k = $("adm-" + m.id), s = stat(m);
  if (!k) return;
  const pil = k.querySelector("[data-st]");
  pil.className = `ad-st jm-pil ${PIL_TAHAP[s.tahap]}`;
  pil.innerHTML = `${ikon(IK_TAHAP[s.tahap], 14)}<span>${esc(t("ad.tahap." + s.tahap))}</span>`;
  k.querySelector("[data-hit]").textContent = t("ad.langkah_selesai", { a: s.selesai, b: s.total }) + (s.terbaik != null ? " " + t("ad.terbaik", { n: s.terbaik }) : "");
  const tbl = k.querySelector("[data-kuis]");
  if (s.selesai === s.total) tbl.removeAttribute("aria-disabled"); else tbl.setAttribute("aria-disabled", "true");
}

/* ---------- skor dan lencana ---------- */
const LENCANA_IK = { "dasar-ebt": "tek-surya", "plts-atap": "bintang", perizinan: "lencana", pembiayaan: "kartu", karbon: "tek-panas", keselamatan: "perisai" };
function gambarRingkasan() {
  const lc = lencana(D, P);
  const rows = D.modul.map((m) => { const s = stat(m); return { label: L(m.judul), v: Math.max(0.5, s.terbaik ?? 0), teks: s.terbaik != null ? `${N(s.terbaik)}%` : t("ad.belum_kuis"), sorot: s.tahap === "lulus" }; });
  $("adGrafik").innerHTML = batang(rows, { maks: 100, ref: D.lulus_persen, teksRef: t("ad.lulus_ref", { n: D.lulus_persen }), label: t("ad.grafik.label") });
  $("adLencana").innerHTML = `<ul class="ad-lcs">${D.modul.map((m) => {
    const ada = lc.modul.includes(m.id);
    return `<li class="ad-lc ad-tk-${esc(m.warna)}${ada ? " ad-lc-ada" : ""}"><span class="ad-lc-ik">${ikon(ada ? "medali" : "kunci", 22)}</span><b>${esc(L(m.judul))}</b><small>${esc(t(ada ? "ad.lencana.ada" : "ad.lencana.belum"))}</small></li>`;
  }).join("")}<li class="ad-lc ad-tk-karbon${lc.semua ? " ad-lc-ada" : ""}"><span class="ad-lc-ik">${ikon(lc.semua ? "piala" : "kunci", 22)}</span><b>${esc(t("ad.lencana.semua"))}</b><small>${esc(t(lc.semua ? "ad.lencana.ada" : "ad.lencana.belum"))}</small></li></ul>`;
}
function rangka() {
  const saran = berikutnya(D, P);
  isi.innerHTML = [
    ex({ id: "adJalur", ikon: "akademi", topik: t("ad.ey.jalur"), judulHtml: hlHtml("ad.t.jalur", String(D.modul.length)), subHtml: esc(t("ad.s.jalur")),
      isiHtml: `<div class="ad-modul-w" id="adModul">${D.modul.map((m, i) => modulHtml(m, i + 1, saran)).join("")}</div>` }),
    ex({ id: "adSkor", ikon: "medali", topik: t("ad.ey.skor"), judulHtml: esc(t("ad.t.skor")), subHtml: esc(t("ad.s.skor", { n: D.lulus_persen })),
      isiHtml: `<div class="ad-grafik" id="adGrafik"></div><div id="adLencana"></div>
        <p class="ad-penafian">${ikon("peringatan", 16)}<span>${esc(t("ad.penafian"))}</span></p>
        <div class="ad-aksi"><button type="button" class="jm-tbl" id="adReset">${ikon("balik", 16)}<span>${esc(t("ad.reset"))}</span></button><span class="ad-bantu">${ikon("kunci", 14)}<span>${esc(t("ad.lokal"))}</span></span></div>` }),
    ex({ id: "adCara", ikon: "metode", topik: t("ad.ey.cara"), judulHtml: esc(t("ad.t.cara")) + " " + hip(), subHtml: esc(L(D.catatan)),
      isiHtml: `<ul class="ad-cara">${[1, 2, 3, 4].map((i) => `<li>${ikon(["daftar2", "centang", "survei", "medali"][i - 1], 18)}<p>${esc(t("ad.c." + i, { n: D.lulus_persen }))}</p></li>`).join("")}</ul>` }),
  ].join("");
  $("adModul").addEventListener("change", (e) => {
    const c = e.target.closest("input[data-lg]"); if (!c) return;
    if (c.checked) P.langkah[c.dataset.lg] = 1; else delete P.langkah[c.dataset.lg];
    simpan(); segarkanKartu(MODUL.get(c.dataset.lg.split("/")[0])); nanti(ringkas);
  });
  $("adModul").addEventListener("click", (e) => { const b = e.target.closest("[data-kuis]"); if (b && b.getAttribute("aria-disabled") !== "true") bukaKuis(b.dataset.kuis); else if (b) b.title = t("ad.kuis.terkunci"); });
  $("adReset").addEventListener("click", () => { if (!confirm(t("ad.reset.tanya"))) return; P = bersihkanProgres(null, D); simpan(); rangka(); ringkas(); });
}
function ringkas() { ubin(); gambarRingkasan(); }

/* ---------- kuis ---------- */
const HURUF = ["A", "B", "C", "D"];
function bukaKuis(id) {
  const m = MODUL.get(id), dlg = $("adDlg");
  dlg.innerHTML = `<header class="ad-d-h"><span class="ad-mik ad-tk-${esc(m.warna)}">${ikon(m.ikon, 22)}</span><div><h2 id="adDlgJ">${esc(L(m.judul))}</h2><p>${esc(t("ad.kuis.petunjuk", { n: D.lulus_persen }))}</p></div><button type="button" class="jm-tbl ad-d-x" data-tutup aria-label="${esc(t("ad.tutup"))}">${ikon("silang", 16)}</button></header>
    <form id="adKuis" class="ad-kuis" novalidate>${m.kuis.map((s, i) => `<div class="ad-s" role="group" aria-labelledby="ads-${i}"><p class="ad-sq" id="ads-${i}"><span class="ad-no">${i + 1}</span><b>${esc(L(s.q))}</b></p><div class="ad-op">${s.o.map((o, j) => `<label class="ad-o"><input type="radio" name="${esc(s.id)}" value="${j}"><span class="ad-o-k"><b>${HURUF[j]}</b><span>${esc(L(o))}</span><i class="ad-o-ik"></i></span></label>`).join("")}</div><div class="ad-fb" data-fb="${esc(s.id)}" hidden></div></div>`).join("")}
      <div class="ad-d-k"><p class="ad-pesan" id="adPesan" role="alert" hidden></p><div class="ad-hasil" id="adHasil" hidden></div><button type="submit" class="jm-tbl jm-tbl-utama" id="adPeriksa">${ikon("centang", 16)}<span>${esc(t("ad.periksa"))}</span></button></div></form>`;
  dlg.querySelector("#adKuis").addEventListener("submit", (e) => { e.preventDefault(); periksa(m); });
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
}
function periksa(m) {
  const form = $("adKuis"), jawab = {};
  for (const s of m.kuis) { const c = form.querySelector(`input[name="${CSS.escape(s.id)}"]:checked`); if (c) jawab[s.id] = +c.value; }
  const pesan = $("adPesan");
  if (Object.keys(jawab).length < m.kuis.length) { pesan.hidden = false; pesan.textContent = t("ad.belum_lengkap"); return; }
  pesan.hidden = true;
  const r = nilaiKuis(m, jawab, D.lulus_persen);
  const lama = P.kuis[m.id]?.terbaik ?? -1;
  if (r.persen > lama) P.kuis[m.id] = { terbaik: r.persen, waktu: Date.now() };
  simpan();
  for (const s of m.kuis) {
    const benar = jawab[s.id] === s.a, fb = form.querySelector(`[data-fb="${CSS.escape(s.id)}"]`), href = hrefSumber(s.sumber);
    form.querySelectorAll(`input[name="${CSS.escape(s.id)}"]`).forEach((inp) => {
      inp.disabled = true;
      const lab = inp.closest(".ad-o"), j = +inp.value;
      lab.classList.toggle("ad-o-benar", j === s.a); lab.classList.toggle("ad-o-salah", j === jawab[s.id] && !benar);
      lab.querySelector(".ad-o-ik").innerHTML = j === s.a ? ikon("centang", 18) : j === jawab[s.id] ? ikon("silang", 18) : "";
    });
    fb.hidden = false;
    fb.className = `ad-fb ${benar ? "ad-fb-benar" : "ad-fb-salah"}`;
    fb.innerHTML = `${ikon(benar ? "centang" : "peringatan", 16)}<p>${esc(t(benar ? "ad.benar" : "ad.salah", { j: HURUF[s.a] }))} <a href="${esc(href)}">${esc(t("ad.sumber_baca", { s: labelSumber(s.sumber) }))}</a></p>`;
  }
  const h = $("adHasil");
  h.hidden = false;
  h.innerHTML = `<span class="jm-pil ${r.lulus ? "jm-pil-ok" : "jm-pil-warn"}">${ikon(r.lulus ? "medali" : "peringatan", 16)}<b>${N(r.persen)}%</b><span>${esc(t("ad.hasil", { a: r.benar, b: r.total }))}</span></span><p>${esc(t(r.lulus ? "ad.lulus" : "ad.belum_lulus", { n: D.lulus_persen }))}</p>`;
  const tbl = $("adPeriksa");
  tbl.innerHTML = `${ikon("balik", 16)}<span>${esc(t("ad.kuis.ulang"))}</span>`;
  tbl.type = "button"; tbl.addEventListener("click", () => bukaKuis(m.id), { once: true });
  segarkanKartu(m); nanti(ringkas);
}
$("adDlg").addEventListener("click", (e) => { if (e.target.closest("[data-tutup]") || e.target === $("adDlg")) $("adDlg").close(); });

rangka();
ringkas();
document.addEventListener("jm:bahasa", () => location.reload());
