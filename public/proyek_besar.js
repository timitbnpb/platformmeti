/* /proyek-besar: proyek >= 100 MW dipisah menurut kekuatan bukti. Data = /data/proyek_besar.json (scripts/pipa/proyek_besar.mjs). */
import { t, tanggal } from "/i18n.js";
import { esc, galatHtml, ikon } from "/inti/umum.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { khUbin } from "/inti/kh.js";
import { exHtml, sumberHtml } from "/inti/komponen.js";
import { aksiHtml } from "/inti/aksi_ex.js";
import { pilTek, pilStatus } from "/inti/ikon_tek.js";
import { siapTautan } from "/inti/tautan.js";
import { num, labTek, hl, estPil, muatPotret, selProv, selNamaProyek, selPemilik, selSumber, pasangTabel } from "/proyek_besar_umum.js";

const $ = (id) => document.getElementById(id);
await mulaiHalaman();
siapTautan("org");
let D;
try { D = await muatPotret(); } catch (e) {
  $("pbIsi").innerHTML = galatHtml("jaringan");
  $("pbIsi").querySelector("[data-aksi=ulang]")?.addEventListener("click", () => location.reload());
  throw e;
}

const TIER = ["beroperasi", "ppa", "ruptl", "est"];
const IK = { beroperasi: "centang", ppa: "pdf", ruptl: "regulasi", est: "analisis" };
const sel = {
  nama: ["nama", "pj.c.nama", (r) => selNamaProyek(r) + (r.prov ? `<div class="pb-prov">${selProv(r.prov)}</div>` : "")], /* provinsi di baris kedua */ tek: ["tek", "pj.c.tek", (r) => pilTek(r.tek), "jm-tengah"],   pem: ["pemilik", "pj.c.pemilik", selPemilik], mw: ["mw", "pj.c.kap", (r) => `${num(r.mw)} <span class="jm-pj-sat">${esc(r.sat)}</span>`, "jm-num"],
  st: ["status", "pj.c.status", (r) => pilStatus(r.status), "jm-tengah"], cod: ["cod", "pj.c.cod", (r) => (r.cod ?? "-"), "jm-tengah"],
  thn: ["tahun_operasi", "pb.c.tahun_operasi", (r) => (r.tahun_operasi ?? "-"), "jm-tengah"],
  kon: ["kerja_kon", "pb.c.kerja_kon", (r) => (r.kerja ? `${num(r.kerja.konstruksi)} <span class="jm-pj-sat">${esc(t("pb.u.tahun_orang"))}</span> ${estPil()}` : "-"), "jm-num"],
  om: ["kerja_om", "pb.c.kerja_om", (r) => (r.kerja ? `${num(r.kerja.om)} <span class="jm-pj-sat">${esc(t("pb.u.orang"))}</span> ${estPil()}` : "-"), "jm-num"],
  src: [null, "pj.c.sumber", selSumber, "jm-tengah"],
};
const KOLOM = {
  beroperasi: [sel.nama, sel.tek, sel.pem, sel.mw, sel.thn, sel.om, sel.src],
  ppa: [sel.nama, sel.tek, sel.pem, sel.mw, sel.cod, sel.kon, sel.src],
  ruptl: [sel.nama, sel.tek, sel.pem, sel.mw, sel.st, sel.cod, sel.kon, sel.src],
  est: [sel.nama, sel.tek, sel.pem, sel.mw, sel.st, sel.cod, sel.kon, sel.src],
};
for (const k of TIER) for (const r of D.besar[k]) { r.kerja_kon = r.kerja ? r.kerja.konstruksi : null; r.kerja_om = r.kerja ? r.kerja.om : null; }

const jmlProyek = TIER.reduce((a, k) => a + D.besar[k].length, 0), jmlMW = TIER.reduce((a, k) => a + D.jumlah_mw[k], 0);
const tanpaKap = D.sel_kosong.kapasitas.belum_bersumber + D.sel_kosong.kapasitas.di_luar_cakupan;
const sumber = sumberHtml(esc(t("pb.sumber", { tgl: tanggal(D.dibangun_pada, { gaya: "panjang" }) })));

khUbin("pbAngka", [
  { ikon: "proyek", nilai: num(jmlProyek), label: t("pb.k.proyek", { mw: D.ambang_mw }) },
  { ikon: "analisis", nilai: num(jmlMW), satuan: "MW", label: t("pb.k.mw") },
  { ikon: "centang", nilai: num(D.jumlah_mw.beroperasi), satuan: "MW", label: t("pb.t.beroperasi") },
  { ikon: "blokir", nilai: num(D.dikeluarkan.length), label: t("pb.k.keluar") },
]);

const kotak = `<aside class="pb-kotak" aria-labelledby="pbTidak"><h2 id="pbTidak">${ikon("peringatan", 18)}<span>${esc(t("pb.tidak.j"))}</span></h2><ul>${[1, 2, 3, 4].map((i) => `<li>${esc(t("pb.tidak." + i, { n: num(tanpaKap), mw: D.ambang_mw, total: num(D.jumlah_proyek) }))}</li>`).join("")}</ul><p><a href="/metode#apa-isi-angka">${esc(t("pb.tidak.metode"))}</a></p></aside>`;

const seksiTier = (k) => exHtml({ id: "pb-" + k, ikon: IK[k], topik: t("pb.t." + k), judulHtml: `${hl(num(D.besar[k].length))} ${esc(t("pb.t.j"))}, ${hl(num(D.jumlah_mw[k]))} MW`, subHtml: esc(t("pb.cat." + k)),
  aksiHtml: aksiHtml({ csv: true }) + sumber, isiHtml: `<div id="pbT-${k}"></div>` });

const kerjaTab = (id, judul) => `<div class="pb-kerja-blok"><h3>${esc(t(judul))}</h3><div id="${id}"></div></div>`;
const seksiKerja = exHtml({ id: "pb-kerja", ikon: "orang", topik: t("pb.kerja.ey"), judulHtml: `${esc(t("pb.kerja.j"))} ${estPil()}`, subHtml: esc(t("pb.kerja.s", { pengali: num(D.kerja.pengali.nilai) })), aksiHtml: aksiHtml({ csv: false }) + sumber,
  isiHtml: `<div class="pb-kerja">${kerjaTab("pbKProv", "pb.kerja.prov")}${kerjaTab("pbKTek", "pb.kerja.tek")}</div><p class="jm-bantu">${esc(t("pb.kerja.cat"))} <a href="/metode#faktor-kerja">${esc(t("pb.kerja.faktor"))}</a></p>` });

$("pbIsi").innerHTML = kotak + TIER.map(seksiTier).join("") + seksiKerja;

for (const k of TIER) pasangTabel($("pbT-" + k), KOLOM[k], D.besar[k], { k: "mw", arah: -1, hal: 1, turun: ["mw", "kerja_kon", "kerja_om", "tahun_operasi"] }, "pb.kosong");

/* ringkasan tenaga kerja: baris = provinsi / teknologi */
const kolomKerja = (kunciKamus, selNama) => [["kunci", kunciKamus, selNama], ["n", "pb.c.proyek", (r) => num(r.n), "jm-num"], ["mw", "pj.c.kap", (r) => `${num(r.mw)} <span class="jm-pj-sat">MW</span>`, "jm-num"],
  ["konstruksi", "pb.kerja.kon_pipa", (r) => num(r.konstruksi), "jm-num"], ["om", "pb.kerja.om_ada", (r) => num(r.om), "jm-num"]];
pasangTabel($("pbKProv"), kolomKerja("pj.c.prov", (r) => selProv(r.kunci)), D.kerja.per_provinsi, { k: "konstruksi", arah: -1, hal: 1, turun: ["n", "mw", "konstruksi", "om"] });
pasangTabel($("pbKTek"), kolomKerja("pj.c.tek", (r) => pilTek(r.kunci)), D.kerja.per_teknologi, { k: "konstruksi", arah: -1, hal: 1, turun: ["n", "mw", "konstruksi", "om"] });

/* CSV: semua baris tiap tabel tingkat bukti */
for (const k of TIER) $("pb-" + k).addEventListener("jm:csv", (e) => {
  e.detail.baris = [[t("pj.c.nama"), t("pj.c.tek"), t("pj.c.prov"), t("pj.c.pemilik"), t("pj.c.kap"), t("pj.c.satuan"), t("pj.c.status"), t("pj.c.cod"), t("pb.c.kerja_kon") + " (EST)", t("pb.c.kerja_om") + " (EST)", t("pj.c.sumber")],
    ...D.besar[k].map((r) => [r.nama, labTek(r.tek), r.prov, r.pemilik, r.mw, r.sat, r.status, r.cod ?? "", r.kerja ? r.kerja.konstruksi : "", r.kerja ? r.kerja.om : "", r.sumber_url])];
}, true);
