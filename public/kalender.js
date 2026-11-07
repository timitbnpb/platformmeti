import { mulaiHalaman } from "/inti/kepala.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, nanti, hantuHtml, kosongHtml, galatHtml } from "/inti/umum.js";
import { muat, label, urlAman } from "/publik.js";

const JENIS = ["seminar", "konferensi", "audiensi", "lokakarya", "regulasi", "tenggat"];
const S = { tampil: "bulan", jenis: "", bulan: "" }; // bulan = "YYYY-MM"
let D = null;

const bulanDari = (tgl) => tgl.slice(0, 7);
const namaBulan = (ym) => tanggal(ym + "-01", { gaya: "panjang" }).split(" ").slice(1).join(" ");
function geser(ym, n) { const [y, m] = ym.split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); return d.toISOString().slice(0, 7); }

function bacaUrl() {
  const p = new URLSearchParams(location.search);
  if (p.get("tampil") === "daftar") S.tampil = "daftar";
  if (JENIS.includes(p.get("jenis"))) S.jenis = p.get("jenis");
  if (/^\d{4}-\d{2}$/.test(p.get("bulan") || "")) S.bulan = p.get("bulan");
}
function tulisUrl() {
  const u = new URL(location.href);
  S.tampil === "daftar" ? u.searchParams.set("tampil", "daftar") : u.searchParams.delete("tampil");
  S.jenis ? u.searchParams.set("jenis", S.jenis) : u.searchParams.delete("jenis");
  S.bulan ? u.searchParams.set("bulan", S.bulan) : u.searchParams.delete("bulan");
  history.replaceState(null, "", u);
}

const sumberHtml = (b) => {
  const tgl = esc(tanggal(b.sumber.tanggal));
  return urlAman(b.sumber.url) ? `<a href="${esc(b.sumber.url)}" target="_blank" rel="noopener noreferrer">${esc(t("kal.sumber." + b.sumber.label))}</a> <span>${esc(t("kal.diambil", { tanggal: tgl }))}</span>` : `<span>${esc(t("kal.sumber." + b.sumber.label))}, ${esc(t("kal.diambil", { tanggal: tgl }))}</span>`;
};
const acaraHtml = (b) => `<li class="jm-acara" id="${esc(b.id)}"><span class="jm-acara-tgl">${esc(tanggal(b.tanggal))}</span><strong>${esc(b.judul)}</strong>
  <span class="jm-baris-meta"><span class="jm-pil">${esc(label("kal.jenis.", b.jenis))}</span>${b.mitra ? `<span>${esc(t("kal.mitra"))}: ${esc(b.mitra)}</span>` : ""}</span><span class="jm-sumber">${sumberHtml(b)}</span></li>`;

function gambarChrome() {
  document.getElementById("tampil").innerHTML = ["bulan", "daftar"].map((v) => `<button type="button" role="tab" data-tampil="${v}" aria-selected="${S.tampil === v}">${esc(t("kal.tampil." + v))}</button>`).join("");
  const sel = document.getElementById("jenis");
  sel.innerHTML = `<option value="">${esc(t("kal.semua"))}</option>${JENIS.map((j) => `<option value="${j}"${S.jenis === j ? " selected" : ""}>${esc(label("kal.jenis.", j))}</option>`).join("")}`;
  sel.setAttribute("aria-label", t("kal.semua"));
  document.getElementById("navbulan").hidden = S.tampil !== "bulan";
  document.getElementById("navbulan").innerHTML = `<div class="jm-nav-bulan"><button type="button" class="jm-tbl jm-tbl-kecil" data-geser="-1" aria-label="${esc(t("kal.sebelumnya"))}">&lsaquo;</button><strong>${esc(namaBulan(S.bulan))} ${S.bulan.slice(0, 4)}</strong><button type="button" class="jm-tbl jm-tbl-kecil" data-geser="1" aria-label="${esc(t("kal.berikutnya"))}">&rsaquo;</button></div>`;
}

function gridHtml(rows) {
  const [y, m] = S.bulan.split("-").map(Number);
  const awal = new Date(Date.UTC(y, m - 1, 1)), mulaiHari = (awal.getUTCDay() + 6) % 7, jml = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const per = new Map();
  for (const b of rows) (per.get(b.tanggal) || per.set(b.tanggal, []).get(b.tanggal)).push(b);
  let sel = "";
  for (let i = 0; i < mulaiHari; i++) sel += `<div class="jm-hari jm-hari-luar"></div>`;
  for (let h = 1; h <= jml; h++) {
    const tg = `${S.bulan}-${String(h).padStart(2, "0")}`;
    sel += `<div class="jm-hari"><b>${h}</b>${(per.get(tg) || []).map((b) => `<a href="#${esc(b.id)}" title="${esc(b.judul)}">${esc(b.judul)}</a>`).join("")}</div>`;
  }
  const kepala = [0, 1, 2, 3, 4, 5, 6].map((i) => `<div class="jm-bulan-nama">${esc(t("kal.hari." + i))}</div>`).join("");
  return `<div class="jm-bulan-tampil"><div class="jm-bulan" role="group" aria-label="${esc(namaBulan(S.bulan))}">${kepala}${sel}</div></div>`;
}

function gambarIsi() {
  const semua = D.baris.filter((b) => !S.jenis || b.jenis === S.jenis);
  const rows = S.tampil === "bulan" ? semua.filter((b) => bulanDari(b.tanggal) === S.bulan) : [...semua].reverse();
  document.getElementById("hitung").textContent = t("kal.hitung", { n: angka(rows.length), total: angka(D.baris.length) });
  document.getElementById("grid").innerHTML = S.tampil === "bulan" ? gridHtml(rows) : "";
  document.getElementById("isi").innerHTML = rows.length ? `<ul class="jm-daftar">${rows.map(acaraHtml).join("")}</ul>` : kosongHtml("kal.kosong");
}

async function main() {
  await mulaiHalaman();
  bacaUrl();
  const isi = document.getElementById("isi");
  const mulai = async () => {
    isi.innerHTML = hantuHtml(5);
    try { D = await muat("kalender"); } catch (e) { isi.innerHTML = galatHtml("layanan"); return; }
    if (!S.bulan) { const kini = new Date().toISOString().slice(0, 7); S.bulan = D.baris.some((b) => bulanDari(b.tanggal) === kini) ? kini : bulanDari(D.baris.filter((b) => b.tanggal <= kini).pop()?.tanggal || D.baris[D.baris.length - 1].tanggal); }
    document.getElementById("sumber").textContent = t("kal.catatan", { tanggal: tanggal(D.dibangun_pada) });
    gambarChrome(); gambarIsi();
  };
  await mulai();
  isi.addEventListener("click", (e) => e.target.closest("[data-aksi=ulang]") && mulai());
  const ulang = () => nanti(() => { tulisUrl(); gambarIsi(); });
  document.getElementById("tampil").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tampil]"); if (!b || !D) return;
    S.tampil = b.dataset.tampil;
    for (const x of document.querySelectorAll("#tampil button")) x.setAttribute("aria-selected", String(x === b)); // chrome urgent
    document.getElementById("navbulan").hidden = S.tampil !== "bulan"; ulang();
  });
  document.getElementById("jenis").addEventListener("change", (e) => { S.jenis = e.target.value; ulang(); });
  document.getElementById("navbulan").addEventListener("click", (e) => {
    const b = e.target.closest("[data-geser]"); if (!b) return;
    S.bulan = geser(S.bulan, +b.dataset.geser);
    document.querySelector("#navbulan strong").textContent = `${namaBulan(S.bulan)} ${S.bulan.slice(0, 4)}`; ulang();
  });
  document.addEventListener("jm:bahasa", () => D && nanti(() => { gambarChrome(); gambarIsi(); document.getElementById("sumber").textContent = t("kal.catatan", { tanggal: tanggal(D.dibangun_pada) }); }));
}
main();
