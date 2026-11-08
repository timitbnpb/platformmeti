/* /indeks-keyakinan: survei triwulanan keyakinan bisnis EBT. Data lewat /api/keyakinan (src/keyakinan.js, hak.js, migrasi 0031).
   Agregat hanya bila n >= 5 (server yang menyaring; klien menampilkan apa adanya). INP: pilihan skala berubah seketika (CSS :checked);
   grafik tren digambar ulang lewat nanti(). */
import { mulaiHalaman } from "/inti/kepala.js";
import { t, angka } from "/i18n.js";
import { esc, nanti, ikon, hantuHtml, galatHtml, api, galatTeks } from "/inti/umum.js";
import { khUbin } from "/inti/kh.js";
import { exHtml, pilihHtml } from "/inti/komponen.js";
import { hlHtml, kabar } from "/inti/aksi_ex.js";
import { buktiHtml } from "/inti/bukti.js";
import { pasangPilih } from "/inti/pilih.js";
import { batang, garis } from "/grafik.js";

await mulaiHalaman();
const $ = (id) => document.getElementById(id);
const N = (n, d = 0) => angka(n, { desimal: d });
const IK_BUTIR = { kondisi: "insight", pipeline: "proyek", pembiayaan: "kartu", perizinan: "lencana", harga: "tag", regulasi: "regulasi", investasi: "transaksi", tenaga: "koper" };
const TAUT_BUTIR = { kondisi: "/insight", pipeline: "/proyek#terpadu", pembiayaan: "/investasi#pembiayaan", perizinan: "/perizinan", harga: "/investasi#biaya", regulasi: "/regulasi", investasi: "/transaksi", tenaga: "/kerja" };
const SKALA = [[1, "silang"], [2, "peringatan"], [3, "info"], [4, "centang"], [5, "bintang"]]; // ikon per opsi
const hip = () => buktiHtml("hipotesis");
const ex = (o) => exHtml({ tingkat: "h2", ...o });
const namaPeriode = (p) => { const [th, q] = p.split("-Q"); return t("ky.periode", { q, tahun: th }); };
const isi = $("kyIsi");
isi.innerHTML = hantuHtml(6);

let D;
try { D = await api("/api/keyakinan"); } catch (e) {
  isi.innerHTML = e.kode === "fitur_belum_aktif" ? `<div class="ky-kosong">${ikon("info", 28)}<p>${esc(t("ky.belum_aktif"))}</p></div>` : galatHtml(e.kode === "jaringan" ? "jaringan" : "umum");
  isi.querySelector("[data-aksi=ulang]")?.addEventListener("click", () => location.reload());
  throw e;
}
const BUTIR = D.butir;
let TERLIHAT = D.agregat.filter((a) => !a.tersembunyi);
const iniDari = () => D.agregat.find((a) => a.periode === D.periode) ?? { periode: D.periode, n: 0, tersembunyi: true };
const S = { pilih: Object.fromEntries(BUTIR.map((k) => [k, D.jawaban?.[k] ?? 0])), butir: "" };

function ubin() {
  const ini = iniDari();
  khUbin("kyUbin", [
    { ikon: "kalender", nilai: namaPeriode(D.periode), label: t("ky.u1") },
    { ikon: "orang", nilai: N(ini.n), label: t("ky.u2") },
    { ikon: "survei", nilai: N(BUTIR.length), label: t("ky.u3") },
    { ikon: ini.tersembunyi ? "kunci" : "grafik", nilai: ini.tersembunyi ? t("ky.u4.tutup") : N(ini.indeks, 1), label: t("ky.u4") },
  ]);
}
ubin();

/* ---------- survei ---------- */
const opsiHtml = (k, [v, ik]) => `<label class="ky-opsi ky-v${v}"><input type="radio" name="ky-${esc(k)}" value="${v}"${S.pilih[k] === v ? " checked" : ""} required><span class="ky-opsi-k">${ikon(ik, 18)}<b>${v}</b><span>${esc(t("ky.skala." + v))}</span></span></label>`;
const butirHtml = (k, i) => `<div class="ky-butir ky-tk-${k}" role="group" aria-labelledby="kyl-${k}"><span class="ky-ik">${ikon(IK_BUTIR[k], 20)}</span><span class="ky-no">${i + 1}</span><span class="ky-q" id="kyl-${k}"><b>${esc(t("ky.b." + k))}</b><small>${esc(t("ky.q." + k))}</small></span><div class="ky-skala" role="radiogroup" aria-labelledby="kyl-${k}">${SKALA.map((o) => opsiHtml(k, o)).join("")}</div></div>`;

function rangka() {
  const sudah = D.jawaban != null;
  isi.innerHTML = [
    ex({ id: "kySurvei", ikon: "survei", topik: t("ky.ey.survei"), judulHtml: hlHtml("ky.t.survei", namaPeriode(D.periode)), subHtml: esc(t(sudah ? "ky.s.survei.ubah" : "ky.s.survei")),
      isiHtml: `<form id="kyForm" class="ky-form" novalidate>${BUTIR.map(butirHtml).join("")}
        <div class="ky-kirim"><p class="ky-hitung" id="kyHitung" role="status"></p><button type="submit" class="jm-tbl jm-tbl-utama" id="kyKirim">${ikon("centang", 16)}<span>${esc(t(sudah ? "ky.kirim.ubah" : "ky.kirim"))}</span></button></div>
        <p class="ky-pesan" id="kyPesan" role="alert" hidden></p></form>
        <p class="ky-bantu">${ikon("kunci", 14)}<span>${esc(t("ky.privasi", { n: D.n_min }))}</span></p>` }),
    ex({ id: "kyIndeks", ikon: "grafik", topik: t("ky.ey.indeks"), judulHtml: `<span id="kyJIndeks"></span>`, subHtml: esc(t("ky.s.indeks")), isiHtml: `<div id="kyIndeksIsi"></div>` }),
    ex({ id: "kyTren", ikon: "linimasa", topik: t("ky.ey.tren"), judulHtml: esc(t("ky.t.tren")) + " " + hip(), subHtml: esc(t("ky.s.tren")),
      aksiHtml: "", isiHtml: `<div class="ky-saring" id="kySaring"></div><div class="ky-grafik" id="kyTrenIsi"></div>` }),
    ex({ id: "kyMetode", ikon: "metode", topik: t("ky.ey.metode"), judulHtml: esc(t("ky.t.metode")) + " " + hip(), subHtml: esc(t("ky.s.metode")),
      isiHtml: `<ul class="ky-met">${[1, 2, 3, 4].map((i) => `<li>${ikon(["kalkulator", "kunci", "perisai", "peringatan"][i - 1], 18)}<p>${esc(t("ky.m." + i, { n: D.n_min }))}</p></li>`).join("")}</ul>
        <div class="ky-taut">${BUTIR.map((k) => `<a class="jm-tbl jm-tbl-kecil ky-tk-${k}" href="${TAUT_BUTIR[k]}">${ikon(IK_BUTIR[k], 14)}<span>${esc(t("ky.b." + k))}</span></a>`).join("")}<a class="jm-tbl jm-tbl-kecil" href="/indeks">${ikon("grafik", 14)}<span>${esc(t("ky.taut.indeks"))}</span></a></div>` }),
  ].join("");
  $("kyForm").addEventListener("change", (e) => { const r = e.target.closest("input[type=radio]"); if (!r) return; S.pilih[r.name.slice(3)] = +r.value; hitungIsi(); });
  $("kyForm").addEventListener("submit", (e) => { e.preventDefault(); kirim(); });
  hitungIsi();
}
function hitungIsi() { $("kyHitung").textContent = t("ky.terisi", { a: N(Object.values(S.pilih).filter(Boolean).length), b: N(BUTIR.length) }); }
async function kirim() {
  const pesan = $("kyPesan");
  if (Object.values(S.pilih).some((v) => !v)) { pesan.hidden = false; pesan.textContent = t("ky.belum_lengkap"); return; }
  pesan.hidden = true;
  const tbl = $("kyKirim"); tbl.setAttribute("aria-busy", "true"); tbl.disabled = true;
  try {
    await api("/api/keyakinan", { metode: "POST", badan: S.pilih });
    kabar(t("ky.tersimpan"));
    const baru = await api("/api/keyakinan");
    D = baru; TERLIHAT = D.agregat.filter((a) => !a.tersembunyi);
    ubin(); gambarHasil();
    tbl.querySelector("span").textContent = t("ky.kirim.ubah");
  } catch (e) { pesan.hidden = false; pesan.textContent = galatTeks(e.kode); }
  finally { tbl.removeAttribute("aria-busy"); tbl.disabled = false; }
}

/* ---------- hasil ---------- */
const tertutup = (a) => `<div class="ky-kosong">${ikon("kunci", 28)}<p>${esc(t("ky.tutup", { n: a.n, m: D.n_min }))}</p></div>`;
function gambarHasil() {
  const a = iniDari();
  const lihat = a.tersembunyi ? D.agregat.find((x) => !x.tersembunyi) : a; // periode terbaru yang boleh tampil
  $("kyJIndeks").innerHTML = lihat ? hlHtml("ky.t.indeks", N(lihat.indeks, 1), { periode: namaPeriode(lihat.periode) }) + " " + hip() : esc(t("ky.t.indeks0"));
  if (!lihat) { $("kyIndeksIsi").innerHTML = tertutup(a); }
  else {
    const rows = BUTIR.map((k) => ({ label: t("ky.b." + k), v: Math.max(0.5, lihat.butir[k]), teks: N(lihat.butir[k], 1), sorot: false }));
    const urut = [...rows].sort((x, y) => y.v - x.v); urut[0].sorot = true;
    $("kyIndeksIsi").innerHTML = `${a.tersembunyi ? `<p class="ky-bantu">${ikon("info", 14)}<span>${esc(t("ky.tutup_ini", { n: a.n, m: D.n_min }))}</span></p>` : ""}
      <div class="ky-ringkas"><span class="jm-pil ky-indeks ${lihat.indeks >= 55 ? "jm-pil-ok" : lihat.indeks >= 45 ? "jm-pil-info" : "jm-pil-warn"}"><b>${N(lihat.indeks, 1)}</b><span>${esc(t(lihat.indeks >= 55 ? "ky.arah.naik" : lihat.indeks >= 45 ? "ky.arah.netral" : "ky.arah.turun"))}</span></span><span class="ky-n">${ikon("orang", 14)}<span>${esc(t("ky.n", { n: lihat.n }))}</span></span></div>
      <div class="ky-grafik">${batang(urut, { maks: 100, ref: 50, teksRef: t("ky.netral"), label: t("ky.grafik.butir") })}</div>`;
  }
  const saring = $("kySaring");
  saring.innerHTML = TERLIHAT.length >= 2 ? pilihHtml({ id: "kyButir", ikon: "survei", label: t("ky.f.butir"), opsi: [["", t("ky.f.semua"), "grafik"], ...BUTIR.map((k) => [k, t("ky.b." + k), IK_BUTIR[k]])] }) : "";
  pasangPilih();
  $("kyButir")?.addEventListener("change", () => { S.butir = $("kyButir").value; nanti(gambarTren); });
  gambarTren();
}
function gambarTren() {
  const asc = [...TERLIHAT].reverse(), el = $("kyTrenIsi");
  if (asc.length < 2) { el.innerHTML = `<div class="ky-kosong">${ikon("linimasa", 28)}<p>${esc(t("ky.tren0"))}</p></div>`; return; }
  const lab = asc.map((a) => a.periode.replace("-", " "));
  const seri = [{ nama: t("ky.indeks"), v: asc.map((a) => a.indeks), sorot: !S.butir }];
  if (S.butir) seri.push({ nama: t("ky.b." + S.butir), v: asc.map((a) => a.butir[S.butir]), sorot: true });
  el.innerHTML = garis(lab, seri, { d: 1, label: t("ky.grafik.tren") });
}

rangka();
gambarHasil();
document.addEventListener("jm:bahasa", () => location.reload());
