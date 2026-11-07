/* Tab "PLTS atap" di /peluang (#plts-atap): golongan tarif + tagihan + provinsi -> kWp, produksi, penghematan, balik modal.
   Rumus di inti/plts_atap_rumus.js (fungsi murni); semua asumsi berlabel Hipotesis, hasil turunan berlabel EST. */
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon, hantuHtml, galatHtml } from "/inti/umum.js";
import { pilihHtml, sumberHtml, exHtml } from "/inti/komponen.js";
import { kodeProv } from "/inti/prov_singkat.js";
import { muat, urlAman } from "/publik.js";
import { hitungPltsAtap, kelompokAsumsi } from "/inti/plts_atap_rumus.js";

const IK_KELOMPOK = { "rumah tangga": "beranda", bisnis: "gedung", industri: "tek:industri", pemerintah: "perisai", "layanan khusus": "info" };
const S = { gol: "", prov: "", tagihan: 1500000, harga: "", ov: {} };
const akar = document.getElementById("pltsIsi");
let D = null;

const rp = (n) => (n >= 1e6 ? t("plts.rp_juta", { n: angka(n / 1e6, { desimal: 1 }) }) : t("plts.rp", { n: angka(Math.round(n)) }));
const est = () => `<span class="jm-pil jm-pil-est">${esc(t("kl.est"))}</span>`;
const hip = () => `<span class="jm-pil jm-pil-warn">${esc(t("kl.hipotesis"))}</span>`;

function hitung() {
  const g = D.tarif.find((x) => x.id === S.gol), pv = D.provinsi.find((x) => x.kode === S.prov);
  const as = structuredClone(D.asumsi), kel = kelompokAsumsi(g.kelompok);
  for (const [k2, grup] of Object.entries(S.ov)) for (const [k3, v] of Object.entries(grup)) if (as[k2]?.[k3]) as[k2][k3].nilai = v;
  if (S.harga > 0) as[kel].harga_per_kwp_idr.nilai = S.harga;
  return { g, pv, as, kel, h: hitungPltsAtap({ tarif: g, tagihan: S.tagihan, pvout: pv.pvout_kwh_per_kwp_tahun, asumsi: as }) };
}

function kartu(ik, kunci, nilai, satuan, sub = "") {
  return `<div class="jm-pa-ub"><span class="jm-kpi-ik">${ikon(ik, 18)}</span><div class="jm-pa-ub-t"><p class="jm-pa-lbl"><span>${esc(t(kunci))}</span>${est()}</p><p class="jm-pa-nilai"><b>${esc(nilai)}</b>${satuan ? ` <small>${esc(satuan)}</small>` : ""}</p>${sub ? `<small class="jm-pa-sub">${esc(sub)}</small>` : ""}</div></div>`;
}

function hasilHtml() {
  const { g, pv, as, kel, h } = hitung();
  if (!h) return { hasil: `<div class="jm-kosong">${ikon("info", 32)}<p>${esc(t("plts.isi_tagihan"))}</p></div>`, cara: "" };
  const um = as.umum, a = as[kel];
  const umur = um.umur_tahun.nilai;
  const balik = h.balikModalTahun === null ? t("plts.balik_lebih", { n: angka(umur) }) : t("plts.tahun", { n: angka(h.balikModalTahun, { desimal: 1 }) });
  const peringatan = [
    h.dibatasiDaya ? t("plts.cap", { ideal: angka(h.kwpIdeal, { desimal: 1 }), batas: angka(h.batasKwp, { desimal: 1 }) }) : "",
    h.subsidi ? t("plts.subsidi") : "",
  ].filter(Boolean).map((p) => `<p class="jm-pa-war">${ikon("peringatan", 18)}<span>${esc(p)}</span></p>`).join("");
  const langkah = [
    ["kalkulator", "f1", t("plts.l1", { tagihan: rp(S.tagihan), tarif: angka(g.tarif_idr_per_kwh, { desimal: 2 }), kwh: angka(h.kwhBulan) })],
    ["tek-surya", "f2", t("plts.l2", { kwh: angka(h.kwhTahun), pv: angka(pv.pvout_kwh_per_kwp_tahun), porsi: angka(a.pakai_sendiri_persen.nilai), kwp: angka(h.kwpIdeal, { desimal: 1 }) })],
    ["perisai", "f3", t("plts.l3", { kwp: angka(h.kwp, { desimal: 1 }), prod: angka(h.produksiKwhTahun) })],
    ["grafik", "f4", t("plts.l4", { pakai: angka(h.pakaiSendiriKwhTahun), tarif: angka(g.tarif_idr_per_kwh, { desimal: 2 }), hemat: rp(h.penghematanTahun), om: rp(h.omTahun), bersih: rp(h.penghematanBersihTahun) })],
    ["kalender", "f5", t("plts.l5", { capex: rp(h.capex), harga: rp(a.harga_per_kwp_idr.nilai), degr: angka(um.degradasi_persen_per_tahun.nilai, { desimal: 1 }), inv: angka(um.ganti_inverter_tahun.nilai), balik })],
  ].map(([ik, f, x], i) => `<li class="jm-pa-lg"><span class="jm-pa-lg-n">${i + 1}</span><div><p class="jm-pa-lg-r">${ikon(ik, 16)}<code>${esc(t("plts." + f))}</code></p><p>${esc(x)}</p></div></li>`).join("");
  const hasil = `<div class="jm-pa-ubin">${kartu("tek-surya", "plts.k.kwp", angka(h.kwp, { desimal: 1 }), t("plts.u.kwp"), t("plts.luas", { n: angka(h.luasM2) }))}
    ${kartu("grafik", "plts.k.produksi", angka(h.produksiKwhTahun), t("plts.u.kwh_th"), t("plts.pvout", { n: angka(pv.pvout_kwh_per_kwp_tahun), prov: pv.provinsi }))}
    ${kartu("kalkulator", "plts.k.hemat", rp(h.penghematanBersihTahun), t("plts.u.th"), t("plts.persen", { n: angka(h.persenTagihan) }))}
    ${kartu("kalender", "plts.k.balik", h.balikModalTahun === null ? t("plts.lebih", { n: angka(umur) }) : angka(h.balikModalTahun, { desimal: 1 }), t("plts.u.tahun"), t("plts.capex", { n: rp(h.capex) }))}</div>${peringatan ? `<div class="jm-pa-wars">${peringatan}</div>` : ""}`;
  return { hasil, cara: `<ol class="jm-pa-langkah">${langkah}</ol>` };
}

function asumsiHtml() {
  const isiBaris = Object.entries(D.asumsi).map(([kel, grup]) => `<tr class="jm-pa-grup"><th colspan="3" scope="colgroup">${esc(t("plts.kel." + kel))}</th></tr>` + Object.entries(grup).map(([k, v]) => {
    const nilai = S.ov[kel]?.[k] ?? v.nilai;
    return `<tr><td data-label="${esc(t("plts.col.asumsi"))}">${esc(t("plts.as." + k))}</td><td class="jm-num" data-label="${esc(t("plts.col.nilai"))}"><input class="jm-pa-as" type="text" inputmode="decimal" data-kel="${esc(kel)}" data-k="${esc(k)}" value="${esc(angka(nilai, { desimal: nilai % 1 ? 2 : 0 }))}" aria-label="${esc(t("plts.as." + k))}"></td><td data-label="${esc(t("plts.col.satuan"))}">${esc(v.satuan)}</td></tr>`;
  }).join("")).join("");
  return `<p class="jm-bantu">${esc(t("plts.asumsi_s"))}</p><div class="jm-gulir"><table class="jm-tabel jm-tabel-tetap jm-pa-tab" data-urut="tidak"><thead><tr>${["asumsi", "nilai", "satuan"].map((k) => `<th scope="col">${esc(t("plts.col." + k))}</th>`).join("")}</tr></thead><tbody>${isiBaris}</tbody></table></div>`;
}

function aturanHtml() {
  const a = D.aturan, sumber = urlAman(a.url) ? `<a class="jm-tbl jm-tbl-kecil" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}<span>${esc(t("plts.naskah"))}</span></a>` : "";
  const butir = [t("plts.a1"), t("plts.a2"), t("plts.a3")].map((x) => `<li>${esc(x)}</li>`).join("");
  return `<p class="jm-bantu">${esc(a.judul)}</p><ul class="jm-pa-butir">${butir}</ul><p class="jm-redup">${esc(t("plts.aturan_cat", { tanggal: tanggal(a.tanggal_periksa) }))}</p>${sumber}`;
}

const medan = (id, ik, label, nilai) => `<div class="jm-pa-f"><label class="jm-pa-fl" for="${id}">${ikon(ik, 16)}<span>${esc(label)}</span></label><div class="jm-pa-angka"><span class="jm-pa-rp">${esc(t("plts.rp_sim"))}</span><input id="${id}" type="text" inputmode="numeric" autocomplete="off" value="${nilai ? esc(angka(nilai)) : ""}" placeholder="${esc(id === "paHarga" ? t("plts.opsional") : t("plts.contoh"))}"></div></div>`;
function kontrolHtml() {
  const kel = Object.keys(IK_KELOMPOK);
  const gol = D.tarif.slice().sort((x, y) => kel.indexOf(x.kelompok) - kel.indexOf(y.kelompok)).map((g) => [g.id, `${g.golongan} (${angka(g.tarif_idr_per_kwh, { desimal: 0 })}/kWh)`, IK_KELOMPOK[g.kelompok] || "info", "", t("plts.kel." + g.kelompok.replace(/ /g, "_"))]);
  const prov = D.provinsi.map((p) => [p.kode, p.provinsi, kodeProv(p.provinsi) ? "prov:" + kodeProv(p.provinsi) : "lokasi"]);
  return `<div class="jm-saring jm-pa-alat">${pilihHtml({ id: "paGol", ikon: "kartu", label: t("plts.gol"), opsi: gol, nilai: S.gol })}${pilihHtml({ id: "paProv", ikon: "lokasi", label: t("plts.prov"), opsi: prov, nilai: S.prov })}${medan("paTagihan", "kalkulator", t("plts.tagihan"), S.tagihan)}${medan("paHarga", "tek-surya", t("plts.harga"), S.harga)}</div>`;
}

async function gambar() {
  akar.innerHTML = hantuHtml(4);
  try { D = await muat("plts_atap_hitung"); } catch { akar.innerHTML = galatHtml("layanan"); return; }
  S.gol ||= (D.tarif.find((g) => g.id.endsWith("r_1_tr_2_200_va")) || D.tarif[0]).id;
  S.prov ||= (D.provinsi.find((p) => p.kode === "32") || D.provinsi[0]).kode;
  const celah = (D.meta?.celah || []).map((c) => `<li>${esc(c)}</li>`).join("");
  const sum = sumberHtml(esc(t("plts.sumber", { tanggal: tanggal(D.meta?.tarif_terbaru || D.dibangun_pada) })));
  const h = hasilHtml();
  akar.innerHTML = exHtml({ id: "paEx1", ikon: "kalkulator", topik: t("pel.tab.plts"), judulHtml: esc(t("plts.ex.j")), subHtml: `${esc(t("plts.lead"))} ${hip()}`, aksiHtml: sum })
    + exHtml({ id: "paEx2", ikon: "grafik", topik: t("plts.ex.hasil"), judulHtml: esc(t("plts.ex.hasil.j")), subHtml: est(), isiHtml: `<div id="paHasil" aria-live="polite">${h.hasil}</div>` })
    + exHtml({ id: "paEx3", ikon: "metode", topik: t("plts.cara"), judulHtml: esc(t("plts.cara")), subHtml: `${est()} ${hip()}`, isiHtml: `<div id="paCara">${h.cara}</div>` })
    + exHtml({ id: "paEx4", ikon: "daftar", topik: t("plts.asumsi"), judulHtml: esc(t("plts.asumsi.j")), subHtml: hip(), isiHtml: asumsiHtml() })
    + exHtml({ id: "paEx5", ikon: "regulasi", topik: t("plts.aturan"), judulHtml: esc(t("plts.aturan")), subHtml: `<span class="jm-pil jm-pil-est">${esc(t("plts.ringkasan"))}</span>`, isiHtml: aturanHtml(), kakiHtml: celah ? `<b>${esc(t("td.celah"))}</b><ul class="jm-pa-celah">${celah}</ul>` : "" });
  const hd = akar.querySelector("#paEx1 .jm-ex-hd");
  hd.insertAdjacentHTML("beforeend", `<div class="jm-pa-kp">${kontrolHtml()}</div>`);
}
const segar = () => { const h = hasilHtml(); document.getElementById("paHasil").innerHTML = h.hasil; document.getElementById("paCara").innerHTML = h.cara; };
akar.addEventListener("change", (e) => { if (e.target.id === "paGol") S.gol = e.target.value; else if (e.target.id === "paProv") S.prov = e.target.value; else return; segar(); });
const angkaBersih = (v) => +String(v).replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "") || 0;
akar.addEventListener("input", (e) => {
  const el = e.target;
  if (el.id === "paTagihan" || el.id === "paHarga") {
    const n = +el.value.replace(/\D/g, "");
    el.value = n ? angka(n) : "";
    if (el.id === "paTagihan") S.tagihan = n; else S.harga = n;
  } else if (el.classList.contains("jm-pa-as")) {
    const n = angkaBersih(el.value);
    (S.ov[el.dataset.kel] ||= {})[el.dataset.k] = n;
  } else return;
  segar();
});
akar.addEventListener("click", (e) => e.target.closest("[data-aksi=ulang]") && gambar());
document.addEventListener("jm:bahasa", () => akar.isConnected && D && gambar());
await gambar();
