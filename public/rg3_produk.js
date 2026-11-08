/* /rantai-global, tab Produk: katalog produk (modul, inverter, BESS, turbin) dan banding 2-4 produk berdampingan, sertifikasi pihak ketiga, tren teknologi.
   Sumber: produk.json, teknologi_tren.json, purnajual.json (bila ada). Pembanding murni: rantai_global_hitung.js. INP: tombol banding berubah seketika, tabel banding menyusul lewat nanti(). */
import { D, berisi, ex, t, esc, ikon, num, bukti, logoHtml, namaOrg, luar, cariSumber, kosongTab, urlGet, urlSet, sumberBerkas, daftarCelah, catatan, chip, warnaIdx, lbl } from "/rg3_umum.js";
import { nanti } from "/inti/umum.js";
import { cariHtml, pilihHtml } from "/inti/komponen.js";
import { pasangPilih } from "/inti/pilih.js";
import { bandingProduk } from "/rantai_global_hitung.js";
import { logoOrg } from "/inti/logo_org.js";
import { batangSvg, kolomSvg, garisSvg, legendaHtml, tipHtml } from "/info_hijau.js";

const KATEGORI = ["modul", "inverter", "bess", "turbin"], IK_KAT = { modul: "tek:surya", inverter: "petir", bess: "tek:penyimpanan", turbin: "tek:bayu" };
const KUNCI = { modul: ["daya_w_maks", "efisiensi_maks_persen", "garansi_kinerja_tahun"], inverter: ["daya_ac_kva", "efisiensi_maks_persen", "jumlah_mppt"], bess: ["energi_mwh_per_unit"], turbin: ["daya_mw", "diameter_rotor_m", "kelas_iec"] };
const SATUAN = { daya_w_min: "W", daya_w_maks: "W", efisiensi_maks_persen: "%", efisiensi_cec_persen: "%", koef_suhu_pmax_persen_per_c: "%/C", degradasi_tahun1_persen: "%", degradasi_tahunan_persen: "%", garansi_produk_tahun: "", garansi_kinerja_tahun: "", berat_kg: "kg", tegangan_sistem_v: "V", tegangan_dc_maks_v: "V", daya_ac_kva: "kVA", jumlah_mppt: "", energi_mwh_per_unit: "MWh", daya_mw: "MW", diameter_rotor_m: "m", luas_sapuan_m2: "m2", tkdn_persen: "%", tkdn_persen_min: "%" };
const MAKS = 4;
let sel = [], kat = "", q = "", panel;
const P = () => D.produk?.baris || [];
const skemaKat = (k) => D.produk?.skema_banding?.[k] || [];
const nilai = (p, k) => { const v = p.spesifikasi?.[k]; return v == null ? t("rg3.pr.belum") : typeof v === "number" ? num(v, v % 1 ? (Math.abs(v) < 10 ? 2 : 1) : 0) + (SATUAN[k] ? " " + SATUAN[k] : "") : String(v); };
const brs = (p) => `${p.merek} ${p.seri}`;
const buktiP = (p) => { const s = cariSumber(D.produk, p.bukti?.sumber_id); return bukti(p.bukti?.tingkat_bukti, { sumber: s ? s.penerbit : "", tanggal: p.bukti?.tanggal }); };
const logoUrl = (p) => { const u = logoOrg(p.org_id, p.org_nama, "")[0]; return u && u.startsWith("/img/") ? u : ""; };

function kartu(p) {
  const on = sel.includes(p.id), penuh = !on && (sel.length >= MAKS || (sel.length && kategoriSel() !== p.kategori));
  const spek = (KUNCI[p.kategori] || []).map((k) => `<div><dt>${esc(t("rg3.sp." + k))}</dt><dd>${esc(nilai(p, k))}</dd></div>`).join("");
  return `<article class="rg3-kartu rg3-produk${on ? " rg3-pilih" : ""}" data-id="${esc(p.id)}">
    <header class="rg3-k-kep">${logoHtml(p.org_id, p.org_nama, "")}<div><h3>${esc(brs(p))}</h3><p>${namaOrg(p.org_id, p.org_nama || p.merek)}</p></div></header>
    <div class="rg3-chips">${chip("rg3-kat-" + p.kategori, "", t("rg3.kat." + p.kategori))}${p.teknologi ? `<span class="rg3-lain">${esc(p.teknologi)}</span>` : ""}</div>
    <dl class="rg3-spek">${spek}<div><dt>${esc(t("rg3.sp.tkdn_persen"))}</dt><dd>${esc(nilai(p, "tkdn_persen"))}</dd></div></dl>
    <footer class="rg3-k-kaki">${buktiP(p)}${p.datasheet_url ? luar(p.datasheet_url, t("rg3.pr.datasheet")) : ""}<button type="button" class="rg3-banding" data-banding="${esc(p.id)}" aria-pressed="${on}"${penuh ? " disabled" : ""}>${ikon(on ? "centang" : "banding", 16)}<span>${esc(t(on ? "rg3.pr.dipilih" : "rg3.pr.banding"))}</span></button></footer>
  </article>`;
}
const kategoriSel = () => P().find((p) => p.id === sel[0])?.kategori || "";
const daftar = () => P().filter((p) => (!kat || p.kategori === kat) && (!q || brs(p).toLowerCase().includes(q.toLowerCase()) || (p.org_nama || "").toLowerCase().includes(q.toLowerCase())));

function katalog() {
  const L = daftar();
  document.getElementById("rg3-pr-kartu").innerHTML = L.length ? `<div class="rg3-kisi">${L.map(kartu).join("")}</div>` : `<p class="jm-kosong">${esc(t("rg3.pr.kosong"))}</p>`;
  document.getElementById("rg3-pr-hit").textContent = t("rg3.pr.hit", { n: num(L.length), m: num(P().length) });
}
function batangBanding() {
  const bar = document.getElementById("rg3-pr-bar"), pilih = sel.map((id) => P().find((p) => p.id === id)).filter(Boolean);
  bar.hidden = !pilih.length;
  bar.innerHTML = pilih.length ? `<span class="rg3-bar-t">${ikon("banding", 18)}<b>${esc(t("rg3.pr.terpilih", { n: pilih.length, m: MAKS }))}</b></span><span class="rg3-bar-c">${pilih.map((p) => `<button type="button" class="rg3-chip rg3-bar-x" data-banding="${esc(p.id)}">${esc(brs(p))}${ikon("silang", 14)}</button>`).join("")}</span><button type="button" class="jm-hapus" data-kosongkan="1">${ikon("silang", 16)}${esc(t("rg3.pr.kosongkan"))}</button>` : "";
}
function tabelBanding() {
  const el = document.getElementById("rg3-pr-hasil"), pilih = sel.map((id) => P().find((p) => p.id === id)).filter(Boolean);
  if (pilih.length < 2) { el.innerHTML = `<div class="jm-kosong rg3-kosong">${ikon("banding", 32)}<p>${esc(t(pilih.length ? "rg3.pr.min" : "rg3.pr.pilih"))}</p></div>`; return; }
  const skema = skemaKat(pilih[0].kategori), B = bandingProduk(pilih, skema), kolom = pilih.map((p) => `<th scope="col"><span class="rg3-th">${logoHtml(p.org_id, p.org_nama, "", "rg3-lg rg3-lg-k")}<b>${esc(brs(p))}</b></span></th>`).join("");
  const baris = B.map((r) => `<tr><th scope="row">${esc(t("rg3.sp." + r.kolom))}${r.satuan ? ` <small>${esc(r.satuan)}</small>` : ""}<small>${esc(t("rg3.pr.arah." + r.arah))}</small></th>${r.nilai.map((v, i) => `<td data-label="${esc(brs(pilih[i]))}" class="jm-num${r.terbaik[i] ? " rg3-terbaik" : ""}">${v == null ? `<span class="ih-kosong">${esc(t("rg3.pr.belum"))}</span>` : `<b>${esc(num(v, v % 1 ? 2 : 0))}</b>${r.terbaik[i] ? ikon("centang", 14) : r.selisih[i] ? `<small>${esc((r.selisih[i] > 0 ? "+" : "") + num(r.selisih[i], 1))}%</small>` : ""}`}</td>`).join("")}</tr>`).join("");
  const teks = (jud, f) => `<tr><th scope="row">${esc(t(jud))}</th>${pilih.map((p) => `<td data-label="${esc(brs(p))}">${f(p)}</td>`).join("")}</tr>`;
  el.innerHTML = `<div class="jm-gulir"><table class="jm-tabel rg3-banding-tabel" data-urut="tidak"><thead><tr><th scope="col">${esc(t("rg3.pr.spek"))}</th>${kolom}</tr></thead><tbody>${teks("rg3.pr.tek", (p) => esc(p.teknologi || "-"))}${baris}${skema.some((x) => x.kolom === "tkdn_persen") ? "" : teks("rg3.sp.tkdn_persen", (p) => esc(nilai(p, "tkdn_persen")))}${teks("rg3.pr.bukti", buktiP)}${teks("rg3.pr.datasheet", (p) => (p.datasheet_url ? luar(p.datasheet_url, t("rg3.pr.buka")) : "-"))}</tbody></table></div><div id="rg3-pr-bb" class="ih-bagan"></div>`;
  const utama = B[0], bb = document.getElementById("rg3-pr-bb");
  if (utama && utama.nilai.some((v) => v != null))
    bb.innerHTML = batangSvg({ el: bb, d: utama.nilai.some((v) => v % 1) ? 1 : 0, label: t("rg3.sp." + utama.kolom), satuan: utama.satuan, seri: [{ k: "n", kelas: "rg3-s-banding" }],
      baris: pilih.map((p, i) => ({ label: brs(p), logo: logoUrl(p), ikon: logoUrl(p) ? "" : "pabrik", tip: `${brs(p)}: ${utama.nilai[i] ?? "-"}`, sorot: utama.terbaik[i],
        th: tipHtml(brs(p), [[t("rg3.sp." + utama.kolom), utama.nilai[i] == null ? t("rg3.pr.belum") : `${num(utama.nilai[i], 2)} ${utama.satuan}`], ...(utama.selisih[i] ? [[t("rg3.pr.vs_terbaik"), `${num(utama.selisih[i], 1)}%`]] : [])], { img: "" }), bagian: [{ k: "n", nilai: utama.nilai[i] || 0 }] })) });
}
function simpan() { urlSet({ kat, pr: q, banding: sel.join(",") }); }
function toggle(id) {
  const p = P().find((x) => x.id === id); if (!p) return;
  if (sel.includes(id)) sel = sel.filter((x) => x !== id);
  else if (sel.length < MAKS && (!sel.length || kategoriSel() === p.kategori)) sel = [...sel, id];
  else return;
  for (const b of panel.querySelectorAll("[data-banding]")) if (b.closest(".rg3-produk")) { const on = sel.includes(b.dataset.banding), lain = !on && (sel.length >= MAKS || (sel.length && kategoriSel() !== P().find((x) => x.id === b.dataset.banding)?.kategori)); b.setAttribute("aria-pressed", String(on)); b.disabled = lain; b.closest(".rg3-produk").classList.toggle("rg3-pilih", on); b.querySelector("span").textContent = t(on ? "rg3.pr.dipilih" : "rg3.pr.banding"); }
  simpan(); batangBanding(); nanti(tabelBanding);
}

/* ---------- sertifikasi, tren teknologi, purna jual ---------- */
const sertifikasi = () => (D.produk?.sertifikasi_pihak_ketiga || []).map((s) => `<li class="rg3-baris">${logoHtml(s.org_id, s.org_nama, "")}<div><b>${esc(s.skema)}</b><p>${namaOrg(s.org_id, s.org_nama)}</p><small>${esc(s.pengumuman)}</small></div>${bukti(s.tingkat_bukti, { tanggal: s.tanggal })}${s.url ? luar(s.url, t("rg3.pr.buka")) : ""}</li>`).join("");
const TEKS_SEL = ["perc", "topcon", "hjt", "bc-topcon", "bc-hjt", "bc-semua", "tandem-si"];
function tren() {
  const d = D.tren; if (!d) return "";
  const pt = (d.pangsa_teknologi_sel?.titik || []), tahun = [...new Set(pt.map((x) => x.tahun))].sort(), seri = TEKS_SEL.filter((k) => pt.some((x) => x.teknologi === k));
  const kat = tahun.map((y) => { const L = pt.filter((x) => x.tahun === y), v = {}; L.forEach((x) => (v[x.teknologi] = x.persen)); const proy = L.some((x) => x.jenis); return { label: proy ? `${y}*` : String(y), nilai: v, tip: `${y}`, th: tipHtml(String(y) + (proy ? " (" + t("rg3.pr.proyeksi") + ")" : ""), seri.filter((k) => v[k] != null).map((k) => [lbl("rg3.tt.", k), `${num(v[k], 1)}%`])) }; });
  const em = (d.efisiensi_modul_produksi_massal?.titik || []), tek = [...new Set(em.map((x) => x.teknologi))];
  const garis = tek.map((k) => ({ id: k, kelas: "rg3-g-" + (warnaIdx(k) % 8), label: lbl("rg3.tt.", k), titik: em.filter((x) => x.teknologi === k).map((x) => ({ x: x.tahun, y: x.persen })) })).filter((s) => s.titik.length >= 2);
  const rek = Object.entries(d.rekor_efisiensi_sel_nrel || {}).filter(([k, v]) => Array.isArray(v) && v.length).map(([k, v]) => ({ k, ...v.at(-1) }));
  return { kat, seri, garis, rek };
}
function trenIsi() {
  const T = tren(); if (!T) return;
  const g1 = document.getElementById("rg3-tt-g1"), g2 = document.getElementById("rg3-tt-g2");
  if (g1 && T.kat.length) { document.getElementById("rg3-tt-l1").innerHTML = legendaHtml(T.seri.map((k) => ({ kelas: "rg3-s-tt-" + k, label: lbl("rg3.tt.", k) }))); g1.innerHTML = kolomSvg({ el: g1, kategori: T.kat, seri: T.seri.map((k) => ({ k, kelas: "rg3-s-tt-" + k })), satuan: "%", label: t("rg3.pr.tt.pangsa") }); }
  if (g2 && T.garis.length) { document.getElementById("rg3-tt-l2").innerHTML = legendaHtml(T.garis.map((s) => ({ id: s.id, kelas: s.kelas, label: s.label }))); g2.innerHTML = garisSvg({ el: g2, seri: T.garis, satuan: "%", label: t("rg3.pr.tt.efisiensi"), xTick: [...new Set(T.garis.flatMap((s) => s.titik.map((p) => p.x)))].sort() }); }
}
function purna() {
  const d = D.purnajual, M = d?.merek || [];
  if (!M.length) return "";
  const sm = (x) => bukti(x.tingkat_bukti, { sumber: cariSumber(d, x.sumber_id)?.penerbit || "", tanggal: x.tanggal || x.tanggal_akses || "" });
  const kartuM = (m) => `<article class="rg3-kartu"><header class="rg3-k-kep">${logoHtml(m.org_id, m.merek, "")}<div><h3>${namaOrg(m.org_id, m.merek)}</h3><p class="rg3-chips">${(m.kategori || []).map((k) => chip("rg3-kat-" + k, "", t("rg3.kat." + k))).join("")}</p></div></header>
    ${(m.layanan_lokal || []).length ? `<h4 class="rg3-sub-k">${esc(t("rg3.pr.pj.layanan"))}</h4><ul class="rg3-penyedia">${m.layanan_lokal.map((l) => `<li><span class="jm-kpi-ik">${ikon("lokasi", 16)}</span><div><b>${namaOrg(l.org_id, l.nama)}</b><small>${esc([l.peran, l.kota].filter(Boolean).join(", "))}</small></div>${sm(l)}</li>`).join("")}</ul>` : `<p class="rg3-catat">${esc(t("rg3.pr.pj.kosong"))}</p>`}
    ${(m.garansi || []).length ? `<h4 class="rg3-sub-k">${esc(t("rg3.pr.pj.garansi"))}</h4><ul class="rg3-penyedia">${m.garansi.map((g) => `<li><span class="jm-kpi-ik">${ikon("perisai", 16)}</span><div><small>${esc(g.uraian)}</small></div>${sm(g)}</li>`).join("")}</ul>` : ""}
    ${(m.kasus || []).length ? `<h4 class="rg3-sub-k">${esc(t("rg3.pr.pj.kasus"))}</h4><ul class="rg3-penyedia">${m.kasus.map((k) => `<li><span class="jm-kpi-ik">${ikon("peringatan", 16)}</span><div><small>${esc(k.ringkas)}</small>${k.relevansi_indonesia ? `<small>${esc(k.relevansi_indonesia)}</small>` : ""}</div>${sm(k)}</li>`).join("")}</ul>` : ""}</article>`;
  const lintas = (d.kasus_lintas || []).length ? `<h3 class="rg3-sub">${esc(t("rg3.pr.pj.lintas"))}</h3><ul class="rg3-daftar">${d.kasus_lintas.map((k) => `<li class="rg3-baris">${ikon("peringatan", 20)}<div><b>${esc(lbl("rg3.pr.pj.j.", k.jenis))}</b><small>${esc(k.ringkas)}</small>${k.catatan ? `<small>${esc(k.catatan)}</small>` : ""}</div>${sm(k)}</li>`).join("")}</ul>` : "";
  return ex({ id: "rg3-pr-pj", ikon: "lencana", topik: t("rg3.pr.ey.pj"), judulHtml: esc(t("rg3.pr.j.pj", { n: num(M.length), m: num(d.meta?.jumlah_layanan ?? M.reduce((s, x) => s + (x.layanan_lokal || []).length, 0)) })), subHtml: esc(t("rg3.pr.s.pj")),
    isiHtml: `<div class="rg3-kisi">${M.map(kartuM).join("")}</div>${lintas}${daftarCelah(d.celah)}`, kakiHtml: sumberBerkas(d) });
}

export function mulai(el) {
  panel = el;
  if (!berisi("produk")) { el.innerHTML = kosongTab("rg3.pr.kosong_data"); return; }
  kat = urlGet("kat"); q = urlGet("pr");
  sel = urlGet("banding").split(",").filter((id) => P().some((p) => p.id === id)).slice(0, MAKS);
  if (sel.length && P().find((p) => p.id === sel[0])) { const k0 = kategoriSel(); sel = sel.filter((id) => P().find((p) => p.id === id)?.kategori === k0); }
  const nK = (k) => P().filter((p) => p.kategori === k).length, T = tren();
  el.innerHTML = [
    ex({ id: "rg3-pr-katalog", ikon: "tab", topik: t("rg3.pr.ey.katalog"), judulHtml: esc(t("rg3.pr.j.katalog", { n: num(P().length), m: num(new Set(P().map((p) => p.merek)).size) })), subHtml: esc(t("rg3.pr.s.katalog")),
      isiHtml: `<div class="jm-saring rg3-saring rg3-saring-2">${cariHtml({ id: "rg3-pr-q", label: t("rg3.pr.f.q"), placeholder: t("rg3.pr.f.q") })}${pilihHtml({ id: "rg3-pr-kat", ikon: "jenis", label: t("rg3.pr.f.kat"), opsi: [["", t("rg3.pr.f.kat"), "jenis"], ...KATEGORI.filter(nK).map((k) => [k, t("rg3.kat." + k), IK_KAT[k], nK(k)])], nilai: kat })}<span class="jm-hitung" id="rg3-pr-hit" role="status" aria-live="polite"></span></div><div id="rg3-pr-bar" class="rg3-bar" hidden></div><div id="rg3-pr-kartu"></div>`, kakiHtml: sumberBerkas(D.produk) }),
    ex({ id: "rg3-pr-banding", ikon: "banding", topik: t("rg3.pr.ey.banding"), judulHtml: esc(t("rg3.pr.j.banding")), subHtml: esc(t("rg3.pr.s.banding")), isiHtml: `<div id="rg3-pr-hasil"></div>${catatan("rg3.pr.n.banding")}` }),
    (D.produk.sertifikasi_pihak_ketiga || []).length ? ex({ id: "rg3-pr-sert", ikon: "medali", topik: t("rg3.pr.ey.sert"), judulHtml: esc(t("rg3.pr.j.sert", { n: num(D.produk.sertifikasi_pihak_ketiga.length) })), subHtml: esc(t("rg3.pr.s.sert")), isiHtml: `<ul class="rg3-daftar">${sertifikasi()}</ul>` }) : "",
    T ? ex({ id: "rg3-pr-tren", ikon: "grafik", topik: t("rg3.pr.ey.tren"), judulHtml: esc(t("rg3.pr.j.tren")), subHtml: esc(t("rg3.pr.s.tren")),
      isiHtml: `<h3 class="rg3-sub">${esc(t("rg3.pr.tt.pangsa"))}</h3><div id="rg3-tt-l1"></div><div id="rg3-tt-g1" class="ih-bagan"></div><h3 class="rg3-sub">${esc(t("rg3.pr.tt.efisiensi"))}</h3><div id="rg3-tt-l2"></div><div id="rg3-tt-g2" class="ih-bagan"></div>
      ${T.rek.length ? `<h3 class="rg3-sub">${esc(t("rg3.pr.tt.rekor"))}</h3><ul class="rg3-ubin">${T.rek.map((r) => `<li class="rg3-ub"><span class="jm-kpi-ik">${ikon("medali", 18)}</span><b>${esc(num(r.persen, 2))}%</b><small>${esc(lbl("rg3.rk.", r.k))}</small><small>${esc(r.lembaga)}</small>${bukti(r.tingkat_bukti, { sumber: cariSumber(D.tren, r.sumber_id)?.penerbit || "" })}</li>`).join("")}</ul>` : ""}${catatan("rg3.pr.n.tren")}${daftarCelah(D.tren.meta?.celah)}`, kakiHtml: sumberBerkas(D.tren) }) : "",
    purna(),
  ].join("");
  document.getElementById("rg3-pr-q").value = q;
  pasangPilih();
  batangBanding(); katalog(); tabelBanding(); nanti(trenIsi);
  el.querySelector("#rg3-pr-q").addEventListener("input", (e) => { q = e.target.value.trim(); simpan(); nanti(katalog); });
  el.querySelector("#rg3-pr-kat").addEventListener("change", (e) => { kat = e.target.value; simpan(); nanti(katalog); });
  el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-banding]"); if (b && !b.disabled) { toggle(b.dataset.banding); return; }
    if (e.target.closest("[data-kosongkan]")) { const was = [...sel]; was.forEach(toggle); }
  });
}
