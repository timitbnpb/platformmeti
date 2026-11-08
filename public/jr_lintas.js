/* /jaringan, tab ASEAN Power Grid dan lintas negara: Sumatera-Semenanjung Malaysia, Kalimantan Barat-Sarawak (beroperasi), Kalimantan-Sabah,
   Sumatera/Batam-Singapura, ditambah proyek impor listrik Singapura (EMA). Bendera negara di setiap kartu.
   Sumber: jaringan_modul.json (lintas_negara). Angka per perusahaan ekspor berstatus media (EMA tidak terbaca langsung). INP: filter seketika, grafik lewat nanti(). */
import { D, ex, t, esc, ikon, num, L, chipStatus, buktiSumber, catatan, daftarCelah, kosongTab, urlGet, urlSet, sumberBerkas, bendera, namaNegara, namaOrg, logoHtml, chip, sumberLink, bukti } from "/jr_umum.js";
import { ringkasEkspor } from "/jaringan_hitung.js";
import { nanti } from "/inti/umum.js";
import { batangSvg, kolomSvg, legendaHtml, tabel, tipHtml } from "/info_hijau.js";

const LN = () => D.m.lintas_negara;
const EKS = () => LN().ekspor_singapura;
let neg = "";

function kartu(x) {
  const pot = x.kapasitas_potensi_gw ? `<span class="rg3-lain">${esc(t("jr.l.potensi"))} ${esc(num(x.kapasitas_potensi_gw[0], 1))}-${esc(num(x.kapasitas_potensi_gw[1], 1))} GW</span>` : "";
  return `<li class="jr-kartu jr-negara-${x.negara}">
    <div class="jr-kartu-kep"><span class="jr-bdr">${bendera(x.negara, 40)}</span><div><h3>${esc(L(x.nama))}</h3><p>${chipStatus(x.status)}<span class="rg3-neg">${bendera(x.negara, 16)}<span>${esc(namaNegara(x.negara))}</span></span>${x.tegangan_kv ? `<span class="rg3-lain">${esc(num(x.tegangan_kv))} kV</span>` : ""}${x.kapasitas_mw ? `<span class="rg3-lain">${esc(num(x.kapasitas_mw))} MW</span>` : ""}${pot}${x.tahun ? `<span class="rg3-lain">${esc(String(x.tahun))}</span>` : ""}</p></div></div>
    <p class="jr-kartu-t">${esc(L(x.ket))}</p><p class="jr-kartu-r">${esc(x.pihak.join(" - "))}${x.panjang_km ? ` <small>${esc(num(x.panjang_km))} km</small>` : ""}${x.teknologi ? ` <small>${esc(x.teknologi)}</small>` : ""}</p>
    <p class="jr-kartu-b">${buktiSumber(x.bukti, x.sumber_id)}<a class="rg3-tautan" href="/jaringan?tab=peta&amp;ruas=${esc(x.id)}">${esc(t("jr.lihat_peta"))}</a><a class="rg3-tautan" href="/asean?negara=${x.negara === "my" ? "MYS" : "SGP"}">${esc(t("jr.l.profil"))}</a></p></li>`;
}
function daftar() {
  const l = LN().negara.filter((x) => !neg || x.negara === neg);
  document.getElementById("jr-l-d").innerHTML = `<ul class="jr-kisi">${l.map(kartu).join("")}</ul>`;
}
function proyekEkspor() {
  const el = document.getElementById("jr-l-e"), P = [...EKS().proyek].sort((a, b) => b.gw - a.gw), izin = ["conditional-licence", "conditional-approval"];
  document.getElementById("jr-l-el").innerHTML = legendaHtml(izin.map((s) => ({ kelas: "jr-s-" + s, label: t("jr.izin." + s) })));
  el.innerHTML = batangSvg({ el, d: 1, label: t("jr.l.proyek"), satuan: "GW", seri: izin.map((s) => ({ k: s, kelas: "jr-s-" + s })),
    baris: P.map((p) => ({ label: p.pengembang, bendera: "sg", tip: `${p.pengembang}: ${p.gw} GW`, th: tipHtml(p.pengembang, [[t("jr.l.izin"), t("jr.izin." + p.izin)], [t("jr.kap"), `${num(p.gw, 1)} GW${p.gw_turunan ? " *" : ""}`], [t("jr.l.tanggal"), p.tanggal], ...(p.mitra ? [[t("jr.l.mitra"), p.mitra]] : []), ...(p.cod_target ? [[t("jr.l.cod_target"), p.cod_target]] : [])], { img: "/img/bendera/sg.svg" }), bagian: [{ k: p.izin, nilai: p.gw }] })) });
}
function tabelEkspor() {
  tabel(document.getElementById("jr-l-tb"), { satuan: "jr.l.u", per: 8, urutAwal: 2, menurun: true, kolom: [
    { label: t("jr.l.pengembang"), v: (p) => p.pengembang, f: (p) => `<span class="rg3-org">${p.org_id?.[0] ? logoHtml(p.org_id[0], p.pengembang, "", "rg3-lg rg3-lg-k") : logoHtml("", p.pengembang, "", "rg3-lg rg3-lg-k")}<span class="rg3-idk"><b>${p.org_id?.[0] ? namaOrg(p.org_id[0], p.pengembang) : esc(p.pengembang)}</b>${p.mitra ? `<small>${esc(p.mitra)}</small>` : ""}</span></span>` },
    { label: t("jr.l.izin"), v: (p) => p.izin, f: (p) => chip("jr-izin-" + p.izin, "", t("jr.izin." + p.izin)) },
    { label: "GW", num: true, v: (p) => p.gw, f: (p) => `<b>${esc(num(p.gw, 1))}</b>${p.gw_turunan ? " *" : ""}` },
    { label: t("jr.l.tanggal"), v: (p) => p.tanggal, f: (p) => esc(p.tanggal) },
    { label: t("jr.bukti"), v: (p) => p.bukti, f: (p) => buktiSumber(p.bukti, p.sumber_id) },
  ], baris: EKS().proyek });
}
function garisWaktu() {
  return `<ol class="jr-waktu">${EKS().tonggak.map((x) => `<li><span class="jr-waktu-t">${bendera("sg", 16)}<b>${esc(x.tanggal)}</b></span><p>${esc(L(x.teks))}</p>${buktiSumber(x.bukti, x.sumber_id)}</li>`).join("")}</ol>`;
}

export function mulai(el) {
  if (!LN()?.negara?.length) { el.innerHTML = kosongTab("jr.kosong_data"); return; }
  neg = ["my", "sg"].includes(urlGet("ln")) ? urlGet("ln") : "";
  const e = ringkasEkspor(D.m), apg = LN().apg, negaraAda = [...new Set(LN().negara.map((x) => x.negara))];
  const ub = [[t("jr.l.u_lisensi"), `${num(e.lisensi, 1)} GW`], [t("jr.l.u_setuju"), `${num(e.persetujuan, 1)} GW`], [t("jr.l.u_target"), `${num(e.target, 0)} GW`], [t("jr.l.u_ltms"), `${num(apg.ltms.mw_2025)} MW`]];
  el.innerHTML = [
    `<ul class="rg3-ubin">${ub.map(([l, v]) => `<li class="rg3-ub"><b>${esc(v)}</b><small>${esc(l)}</small></li>`).join("")}</ul>`,
    ex({ id: "jr-l-daftar", ikon: "asean", topik: t("jr.l.ey.daftar"), judulHtml: esc(t("jr.l.j.daftar", { n: num(LN().negara.length) })), subHtml: esc(t("jr.l.s.daftar")),
      isiHtml: `<div class="rg3-chips jr-filter" id="jr-l-f" role="group" aria-label="${esc(t("jr.l.negara"))}"><button type="button" class="rg3-chip rg3-chipb jr-st-semua" data-ln="" aria-pressed="${neg === ""}">${esc(t("jr.semua"))}</button>${negaraAda.map((n) => `<button type="button" class="rg3-chip rg3-chipb" data-ln="${n}" aria-pressed="${neg === n}">${bendera(n, 16)}<span>${esc(namaNegara(n))}</span></button>`).join("")}</div><div id="jr-l-d"></div>${catatan("jr.l.n.daftar")}`, kakiHtml: sumberBerkas(D.m) }),
    ex({ id: "jr-l-apg", ikon: "globe", topik: t("jr.l.ey.apg"), judulHtml: esc(t("jr.l.j.apg")), subHtml: esc(t("jr.l.s.apg")),
      isiHtml: `<div class="rg3-info rg3-info-ok">${ikon("info", 18)}<p>${esc(L(apg.ket))}</p></div><div class="rg3-info">${ikon("sambung", 18)}<p><span class="jr-rute">${apg.ltms.jalur.map((n) => bendera(n, 20)).join(ikon("panah-kanan", 14))}</span> ${esc(L(apg.ltms.ket))} ${buktiSumber(apg.ltms.bukti, apg.ltms.sumber_id)}</p></div><div class="rg3-info">${ikon("tabel", 18)}<p>${esc(L(apg.aims3.ket))} ${buktiSumber(apg.aims3.bukti, apg.aims3.sumber_id)}</p></div>` }),
    ex({ id: "jr-l-ekspor", ikon: "kartu", topik: t("jr.l.ey.ekspor"), judulHtml: esc(t("jr.l.j.ekspor", { n: num(e.n), gw: num(e.total, 1) })), subHtml: esc(t("jr.l.s.ekspor", { t: num(e.target, 0) })),
      isiHtml: `<div id="jr-l-el"></div><div id="jr-l-e" class="ih-bagan"></div><div id="jr-l-tb"></div><p class="jm-bantu ih-catatan">${esc(t("jr.l.n.turunan"))}</p><h3 class="rg3-sub">${esc(t("jr.l.tonggak"))}</h3>${garisWaktu()}<p class="jm-bantu ih-catatan">${esc(L(EKS().catatan))}</p><p class="jm-bantu ih-catatan">${sumberLink("ema-singa-2025")} ${sumberLink("solarquarter-2024")} ${sumberLink("ecobusiness-sg-2024")}</p>${daftarCelah(D.m.meta?.celah?.slice(3, 4))}` }),
  ].join("");
  daftar(); nanti(proyekEkspor); nanti(tabelEkspor);
  el.querySelector("#jr-l-f").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-ln]"); if (!b) return;
    neg = b.dataset.ln; urlSet({ ln: neg });
    for (const x of el.querySelectorAll("#jr-l-f [data-ln]")) x.setAttribute("aria-pressed", String(x.dataset.ln === neg));
    nanti(daftar);
  });
}
void kolomSvg; void bukti;
