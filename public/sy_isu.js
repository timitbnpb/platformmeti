/* /surya, tab Isu: isu kurasi modul (bahan baku, atap, program) digabung dengan lima isu program 100 GW dari program_analisis.json (dibaca runtime). Pihak yang berbicara ditulis;
   klaim berlabel media atau kata pihak, bukan fakta terverifikasi. Saringan tahap + tabel berhalaman; INP: saringan seketika, tabel menyusul lewat nanti(). */
import { X, L, t, ex, num, esc, ikon, bukti, buktiSy, kakiSy, luar, chip, tabel, kosongTab, catatan, muat } from "/sy_umum.js";

const TAHAP = [["bahan", "beliung"], ["atap", "panel-surya"], ["program", "bendera"]];
let tahap = "";
function semua() {
  const pa = (X.program?.baris || []).find((b) => b.program_id === X.sy.rujukan.program);
  return [...X.sy.isu.map((i) => ({ ...i, jenis: "kurasi" })),
    ...(pa?.isu || []).map((i, n) => ({ id: "pa-" + n, tahap: "program", tingkat: i.tingkat, judul: i.judul, isi: i.uraian, pihak: i.jenis, tingkat_bukti: i.bukti, url: i.url, jenis: "program_analisis" }))];
}
function tabelIsu() {
  const el = document.getElementById("sur-i-t"); if (!el) return;
  const baris = semua().filter((i) => !tahap || i.tahap === tahap);
  tabel(el, { satuan: "sur.u.isu", per: 5, urutAwal: 0, menurun: false, kolom: [
    { label: t("sur.c.tingkat"), v: (i) => ({ tinggi: 0, sedang: 1, rendah: 2 })[i.tingkat] ?? 3, f: (i) => `<span class="sur-baris sur-it-${esc(i.tingkat)}">${chip("sur-it-" + i.tingkat, "", t("sur.it." + i.tingkat))}</span>` },
    { label: t("sur.c.tahap"), v: (i) => i.tahap, f: (i) => chip("rg3-w" + (TAHAP.findIndex((x) => x[0] === i.tahap) + 1), ikon(TAHAP.find((x) => x[0] === i.tahap)?.[1] || "info", 14), t("sur.tab." + (i.tahap === "atap" || i.tahap === "program" ? "proyek" : i.tahap))) },
    { label: t("sur.c.isu"), v: (i) => L(i.judul), f: (i) => `<span class="rg3-idk"><b>${esc(L(i.judul))}</b><small>${esc(L(i.isi))}</small></span>` },
    { label: t("sur.c.pihak"), v: (i) => i.pihak || "", f: (i) => `<span class="rg3-teks">${esc(i.pihak || "-")}</span>` },
    { label: t("sur.c.bukti"), v: (i) => i.tingkat_bukti || "", f: (i) => (i.url ? bukti(i.tingkat_bukti, { sumber: new URL(i.url).hostname.replace(/^www\./, "") }) + " " + luar(i.url, t("sur.i.sumber")) : buktiSy(i)) },
  ], baris });
}
export async function mulai(el) {
  await muat(["program"]);
  const S = semua(), n = (k) => S.filter((x) => !k || x.tahap === k).length;
  el.innerHTML = ex({ id: "sur-i-isu", ikon: "peringatan", topik: t("sur.i.ey"), judulHtml: esc(t("sur.i.j", { n: num(n("")) })), subHtml: esc(t("sur.i.s")),
    isiHtml: `<div class="rg3-chips" role="group" aria-label="${esc(t("sur.i.f"))}">${[["", "daftar2"], ...TAHAP].map(([k, i]) => `<button type="button" class="rg3-chip rg3-chipb rg3-w${k ? TAHAP.findIndex((x) => x[0] === k) + 1 : 0}" data-t="${esc(k)}" aria-pressed="${tahap === k}">${ikon(i, 14)}<span>${esc(t(k ? "sur.i.t." + k : "sur.semua"))}</span> <i>${n(k)}</i></button>`).join("")}</div><div id="sur-i-t"></div>${catatan("sur.i.n")}`, kakiHtml: kakiSy(X.sy.isu.map((x) => x.sumber_id)) });
  tabelIsu();
  el.querySelector(".rg3-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-t]"); if (!b) return;
    tahap = b.dataset.t; for (const x of el.querySelectorAll("[data-t]")) x.setAttribute("aria-pressed", String(x.dataset.t === tahap));
    tabelIsu();
  });
}
