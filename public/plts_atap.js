/* Tab "PLTS atap" di /peluang (#plts-atap): golongan tarif + tagihan + provinsi -> kWp, produksi, penghematan, balik modal.
   Rumus di inti/plts_atap_rumus.js (fungsi murni); semua asumsi berlabel Hipotesis, hasil turunan berlabel EST. */
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon, hantuHtml, galatHtml } from "/inti/umum.js";
import { pilihHtml, sumberHtml } from "/inti/komponen.js";
import { kodeProv } from "/inti/prov_singkat.js";
import { muat, urlAman } from "/publik.js";
import { hitungPltsAtap, kelompokAsumsi } from "/inti/plts_atap_rumus.js";

const IK_KELOMPOK = { "rumah tangga": "beranda", bisnis: "gedung", industri: "tek:industri", pemerintah: "perisai", "layanan khusus": "info" };
const S = { gol: "", prov: "", tagihan: 1500000, harga: "" };
const akar = document.getElementById("pltsIsi");
let D = null;

const rp = (n) => (n >= 1e6 ? t("plts.rp_juta", { n: angka(n / 1e6, { desimal: 1 }) }) : t("plts.rp", { n: angka(Math.round(n)) }));
const est = () => `<span class="jm-pil jm-pil-est">${esc(t("kl.est"))}</span>`;
const hip = () => `<span class="jm-pil jm-pil-warn">${esc(t("kl.hipotesis"))}</span>`;

function hitung() {
  const g = D.tarif.find((x) => x.id === S.gol), pv = D.provinsi.find((x) => x.kode === S.prov);
  const as = structuredClone(D.asumsi), kel = kelompokAsumsi(g.kelompok);
  if (S.harga > 0) as[kel].harga_per_kwp_idr.nilai = S.harga;
  return { g, pv, as, kel, h: hitungPltsAtap({ tarif: g, tagihan: S.tagihan, pvout: pv.pvout_kwh_per_kwp_tahun, asumsi: as }) };
}

function kartu(ik, kunci, isi, sub = "") {
  return `<div class="jm-pa-ub"><span class="jm-kpi-ik">${ikon(ik, 18)}</span><p class="jm-pa-nilai"><b>${esc(isi)}</b></p><p class="jm-pa-lbl">${esc(t(kunci))} ${est()}</p>${sub ? `<small>${esc(sub)}</small>` : ""}</div>`;
}

function hasilHtml() {
  const { g, pv, as, kel, h } = hitung();
  if (!h) return `<div class="jm-kosong">${ikon("info", 32)}<p>${esc(t("plts.isi_tagihan"))}</p></div>`;
  const um = as.umum, a = as[kel];
  const umur = um.umur_tahun.nilai;
  const balik = h.balikModalTahun === null ? t("plts.balik_lebih", { n: angka(umur) }) : t("plts.tahun", { n: angka(h.balikModalTahun, { desimal: 1 }) });
  const peringatan = [
    h.dibatasiDaya ? t("plts.cap", { ideal: angka(h.kwpIdeal, { desimal: 1 }), batas: angka(h.batasKwp, { desimal: 1 }) }) : "",
    h.subsidi ? t("plts.subsidi") : "",
  ].filter(Boolean).map((p) => `<p class="jm-pa-war">${ikon("peringatan", 16)}<span>${esc(p)}</span></p>`).join("");
  const langkah = [
    t("plts.l1", { tagihan: rp(S.tagihan), tarif: angka(g.tarif_idr_per_kwh, { desimal: 2 }), kwh: angka(h.kwhBulan) }),
    t("plts.l2", { kwh: angka(h.kwhTahun), pv: angka(pv.pvout_kwh_per_kwp_tahun), porsi: angka(a.pakai_sendiri_persen.nilai), kwp: angka(h.kwpIdeal, { desimal: 1 }) }),
    t("plts.l3", { kwp: angka(h.kwp, { desimal: 1 }), prod: angka(h.produksiKwhTahun) }),
    t("plts.l4", { pakai: angka(h.pakaiSendiriKwhTahun), tarif: angka(g.tarif_idr_per_kwh, { desimal: 2 }), hemat: rp(h.penghematanTahun), om: rp(h.omTahun), bersih: rp(h.penghematanBersihTahun) }),
    t("plts.l5", { capex: rp(h.capex), harga: rp(a.harga_per_kwp_idr.nilai), degr: angka(um.degradasi_persen_per_tahun.nilai, { desimal: 1 }), inv: angka(um.ganti_inverter_tahun.nilai), balik }),
  ].map((x) => `<li>${esc(x)}</li>`).join("");
  return `<div class="jm-pa-ubin">${kartu("tek-surya", "plts.k.kwp", t("plts.kwp", { n: angka(h.kwp, { desimal: 1 }) }), t("plts.luas", { n: angka(h.luasM2) }))}
    ${kartu("grafik", "plts.k.produksi", t("plts.kwh_th", { n: angka(h.produksiKwhTahun) }), t("plts.pvout", { n: angka(pv.pvout_kwh_per_kwp_tahun), prov: pv.provinsi }))}
    ${kartu("kalkulator", "plts.k.hemat", t("plts.per_tahun", { n: rp(h.penghematanBersihTahun) }), t("plts.persen", { n: angka(h.persenTagihan) }))}
    ${kartu("kalender", "plts.k.balik", balik, t("plts.capex", { n: rp(h.capex) }))}</div>${peringatan}
    <details class="jm-pa-cara" open><summary>${ikon("metode", 18)}<span>${esc(t("plts.cara"))}</span></summary><ol>${langkah}</ol></details>`;
}

function asumsiHtml() {
  const baris = [];
  for (const [kel, grup] of Object.entries(D.asumsi)) for (const [k, v] of Object.entries(grup)) baris.push(`<tr><td data-label="${esc(t("plts.col.kelompok"))}">${esc(t("plts.kel." + kel))}</td><td data-label="${esc(t("plts.col.asumsi"))}">${esc(t("plts.as." + k))}</td><td class="jm-num" data-label="${esc(t("plts.col.nilai"))}">${esc(angka(v.nilai, { desimal: v.nilai % 1 ? 1 : 0 }))} ${esc(v.satuan)}</td><td class="jm-tengah" data-label="${esc(t("plts.col.label"))}">${hip()}</td></tr>`);
  return `<section class="jm-pa-bag"><h3>${ikon("daftar", 18)}<span>${esc(t("plts.asumsi"))}</span>${hip()}</h3><p class="jm-bantu">${esc(t("plts.asumsi_s"))}</p><div class="jm-gulir"><table class="jm-tabel jm-tabel-tetap" data-urut="tidak"><thead><tr>${["kelompok", "asumsi", "nilai", "label"].map((k) => `<th>${esc(t("plts.col." + k))}</th>`).join("")}</tr></thead><tbody>${baris.join("")}</tbody></table></div></section>`;
}

function aturanHtml() {
  const a = D.aturan, sumber = urlAman(a.url) ? `<a class="jm-tbl jm-tbl-kecil" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}<span>${esc(t("plts.naskah"))}</span></a>` : "";
  const butir = [t("plts.a1"), t("plts.a2"), t("plts.a3")].map((x) => `<li>${esc(x)}</li>`).join("");
  return `<section class="jm-pa-bag"><h3>${ikon("regulasi", 18)}<span>${esc(t("plts.aturan"))}</span><span class="jm-pil jm-pil-est">${esc(t("plts.ringkasan"))}</span></h3>
    <p class="jm-bantu">${esc(a.judul)}</p><ul class="jm-pa-butir">${butir}</ul><p class="jm-redup">${esc(t("plts.aturan_cat", { tanggal: tanggal(a.tanggal_periksa) }))}</p>${sumber}</section>`;
}

function kontrolHtml() {
  const kel = Object.keys(IK_KELOMPOK);
  const gol = D.tarif.slice().sort((x, y) => kel.indexOf(x.kelompok) - kel.indexOf(y.kelompok)).map((g) => [g.id, `${g.golongan} (${angka(g.tarif_idr_per_kwh, { desimal: 0 })}/kWh)`, IK_KELOMPOK[g.kelompok] || "info", "", t("plts.kel." + g.kelompok.replace(/ /g, "_"))]);
  const prov = D.provinsi.map((p) => [p.kode, p.provinsi, kodeProv(p.provinsi) ? "prov:" + kodeProv(p.provinsi) : "lokasi"]);
  return `<div class="jm-saring jm-pa-alat">${pilihHtml({ id: "paGol", ikon: "kartu", label: t("plts.gol"), opsi: gol, nilai: S.gol })}${pilihHtml({ id: "paProv", ikon: "lokasi", label: t("plts.prov"), opsi: prov, nilai: S.prov })}
    <label class="jm-pa-angka">${ikon("kalkulator", 18)}<span class="sr">${esc(t("plts.tagihan"))}</span><input id="paTagihan" type="number" inputmode="numeric" min="0" step="50000" value="${S.tagihan}" placeholder="${esc(t("plts.tagihan"))}" title="${esc(t("plts.tagihan"))}"></label>
    <label class="jm-pa-angka">${ikon("tek-surya", 18)}<span class="sr">${esc(t("plts.harga"))}</span><input id="paHarga" type="number" inputmode="numeric" min="0" step="500000" value="${S.harga || ""}" placeholder="${esc(t("plts.harga"))}" title="${esc(t("plts.harga"))}"></label></div>`;
}

async function gambar() {
  akar.innerHTML = hantuHtml(4);
  try { D = await muat("plts_atap_hitung"); } catch { akar.innerHTML = galatHtml("layanan"); return; }
  S.gol ||= (D.tarif.find((g) => g.id.endsWith("r_1_tr_2_200_va")) || D.tarif[0]).id;
  S.prov ||= (D.provinsi.find((p) => p.kode === "32") || D.provinsi[0]).kode;
  const celah = (D.meta?.celah || []).map((c) => `<li>${esc(c)}</li>`).join("");
  akar.innerHTML = `<p class="jm-bantu">${esc(t("plts.lead"))}</p>${kontrolHtml()}<div id="paHasil" aria-live="polite">${hasilHtml()}</div>${asumsiHtml()}${aturanHtml()}
    <p class="jm-redup">${sumberHtml(esc(t("plts.sumber", { tanggal: tanggal(D.meta?.tarif_terbaru || D.dibangun_pada) })))}</p><div class="jm-td-cat"><b>${esc(t("td.celah"))}</b><ul>${celah}</ul></div>`;
}
const segar = () => { document.getElementById("paHasil").innerHTML = hasilHtml(); };
akar.addEventListener("change", (e) => { if (e.target.id === "paGol") S.gol = e.target.value; else if (e.target.id === "paProv") S.prov = e.target.value; else return; segar(); });
akar.addEventListener("input", (e) => { if (e.target.id === "paTagihan") S.tagihan = +e.target.value || 0; else if (e.target.id === "paHarga") S.harga = +e.target.value || 0; else return; segar(); });
akar.addEventListener("click", (e) => e.target.closest("[data-aksi=ulang]") && gambar());
document.addEventListener("jm:bahasa", () => akar.isConnected && D && gambar());
await gambar();
