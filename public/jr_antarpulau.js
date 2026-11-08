/* /jaringan, tab Interkoneksi antar-pulau: Sumatera-Jawa HVDC, Kalimantan-Jawa, Sumba-Bali-Jawa, Jawa-Bali, Sumatera-Batam-Bintan dan tautan pulau kecil.
   Sumber: jaringan_modul.json (antar_pulau, dari RUPTL V.9 dan V.11.2). Status pakai chip berwarna per nilai. INP: filter status seketika, daftar menyusul lewat nanti(). */
import { D, ex, t, esc, ikon, num, L, chipStatus, buktiSumber, catatan, daftarCelah, kosongTab, urlGet, urlSet, sumberBerkas } from "/jr_umum.js";
import { urutStatus, ringkasAntarPulau, KELAS_STATUS } from "/jaringan_hitung.js";
import { nanti } from "/inti/umum.js";
import { batangSvg, legendaHtml, tabel, tipHtml } from "/info_hijau.js";

let st = "";
const A = () => D.m.antar_pulau;
const lihat = () => A().filter((x) => !st || x.status === st).sort((a, b) => urutStatus(a.status) - urutStatus(b.status));

function kartu(x) {
  return `<li class="jr-kartu jr-kartu-${KELAS_STATUS[x.status] || "info"}">
    <div class="jr-kartu-kep"><span class="jr-ik">${ikon(x.kelompok === "super-grid" ? "petir" : "sambung", 20)}</span><div><h3>${esc(L(x.nama))}</h3>
    <p>${chipStatus(x.status)}${x.tegangan_kv ? `<span class="rg3-lain">${esc(num(x.tegangan_kv))} kV</span>` : ""}${x.kapasitas_mw ? `<span class="rg3-lain">${esc(num(x.kapasitas_mw))} MW</span>` : ""}${x.cod ? `<span class="rg3-lain">${esc(t("jr.cod"))} ${esc(String(x.cod))}</span>` : ""}</p></div></div>
    <p class="jr-kartu-t">${esc(L(x.ket))}</p><p class="jr-kartu-r">${esc(x.dari)} ${ikon("sambung", 14)} ${esc(x.ke)}${x.teknologi ? ` <small>${esc(x.teknologi)}</small>` : ""}</p>
    <p class="jr-kartu-b">${buktiSumber(x.bukti, x.sumber_id)}${x.garis ? `<a class="rg3-tautan" href="/jaringan?tab=peta&amp;ruas=${esc(x.id)}">${esc(t("jr.lihat_peta"))}</a>` : ""}</p></li>`;
}
function daftar() { document.getElementById("jr-a-d").innerHTML = `<ul class="jr-kisi">${lihat().map(kartu).join("")}</ul>`; }
function kapasitas() {
  const el = document.getElementById("jr-a-k"), B = A().filter((x) => x.kapasitas_mw).sort((a, b) => b.kapasitas_mw - a.kapasitas_mw), ss = [...new Set(B.map((x) => x.status))];
  document.getElementById("jr-a-kl").innerHTML = legendaHtml(ss.map((s) => ({ kelas: "jr-s-" + s, label: t("jr.st." + s) })));
  el.innerHTML = batangSvg({ el, d: 0, label: t("jr.a.kapasitas"), satuan: "MW", seri: ss.map((s) => ({ k: s, kelas: "jr-s-" + s })),
    baris: B.map((x) => ({ label: L(x.nama), ikon: "sambung", kelasIkon: "jr-s-" + x.status, tip: `${L(x.nama)}: ${num(x.kapasitas_mw)} MW`, th: tipHtml(L(x.nama), [[t("jr.status"), t("jr.st." + x.status)], [t("jr.kap"), `${num(x.kapasitas_mw)} MW`], [t("jr.cod"), x.cod || "-"]]), bagian: [{ k: x.status, nilai: x.kapasitas_mw }] })) });
}
function tabelSemua() {
  tabel(document.getElementById("jr-a-tb"), { satuan: "jr.a.u", per: 8, urutAwal: 1, menurun: false, kolom: [
    { label: t("jr.a.nama"), v: (x) => L(x.nama), f: (x) => `<b>${esc(L(x.nama))}</b><small class="rg3-catat">${esc(x.dari)} - ${esc(x.ke)}</small>` },
    { label: t("jr.status"), v: (x) => urutStatus(x.status), f: (x) => chipStatus(x.status) },
    { label: "kV", num: true, v: (x) => x.tegangan_kv, f: (x) => (x.tegangan_kv ? esc(num(x.tegangan_kv)) : "-") },
    { label: t("jr.kap") + " (MW)", num: true, v: (x) => x.kapasitas_mw, f: (x) => (x.kapasitas_mw ? esc(num(x.kapasitas_mw)) : "-") },
    { label: t("jr.cod"), num: true, v: (x) => x.cod, f: (x) => (x.cod ? esc(String(x.cod)) : "-") },
    { label: t("jr.bukti"), v: (x) => x.bukti, f: (x) => buktiSumber(x.bukti, x.sumber_id) },
  ], baris: A() });
}

export function mulai(el) {
  if (!A()?.length) { el.innerHTML = kosongTab("jr.kosong_data"); return; }
  const r = ringkasAntarPulau(D.m); st = Object.keys(r.per).includes(urlGet("as")) ? urlGet("as") : "";
  const chips = Object.entries(r.per).sort((a, b) => urutStatus(a[0]) - urutStatus(b[0]));
  el.innerHTML = [
    ex({ id: "jr-a-daftar", ikon: "sambung", topik: t("jr.a.ey.daftar"), judulHtml: esc(t("jr.a.j.daftar", { n: num(r.n) })), subHtml: esc(t("jr.a.s.daftar")),
      isiHtml: `<div class="rg3-chips jr-filter" id="jr-a-f" role="group" aria-label="${esc(t("jr.status"))}"><button type="button" class="rg3-chip rg3-chipb jr-st-semua" data-st="" aria-pressed="${st === ""}">${esc(t("jr.semua"))} <i>${esc(num(r.n))}</i></button>${chips.map(([s, n]) => `<button type="button" class="rg3-chip rg3-chipb jr-st-${s}" data-st="${s}" aria-pressed="${st === s}">${esc(t("jr.st." + s))} <i>${esc(num(n))}</i></button>`).join("")}</div><div id="jr-a-d"></div>`, kakiHtml: sumberBerkas(D.m) }),
    ex({ id: "jr-a-kap", ikon: "petir", topik: t("jr.a.ey.kap"), judulHtml: esc(t("jr.a.j.kap")), subHtml: esc(t("jr.a.s.kap")), isiHtml: `<div id="jr-a-kl"></div><div id="jr-a-k" class="ih-bagan"></div>${catatan("jr.a.n.kap")}` }),
    ex({ id: "jr-a-tabel", ikon: "tabel", topik: t("jr.a.ey.tabel"), judulHtml: esc(t("jr.a.j.tabel")), subHtml: esc(t("jr.a.s.tabel")), isiHtml: `<div id="jr-a-tb"></div>${daftarCelah(D.m.meta?.celah?.slice(0, 1))}` }),
  ].join("");
  daftar(); nanti(kapasitas); nanti(tabelSemua);
  el.querySelector("#jr-a-f").addEventListener("click", (e) => {
    const b = e.target.closest("[data-st]"); if (!b) return;
    st = b.dataset.st; urlSet({ as: st });
    for (const x of el.querySelectorAll("#jr-a-f [data-st]")) x.setAttribute("aria-pressed", String(x.dataset.st === st)); // chrome urgent
    nanti(daftar);
  });
}
