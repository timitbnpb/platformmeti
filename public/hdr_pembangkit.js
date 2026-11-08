/* /hidro, tab Pembangkit: PLTA besar dan PLTM/PLTMH dari proyek_terpadu.json (gabungan GEM, RUPTL, proyek.json): kapasitas, pemilik berlogo, COD. Saringan status dan kelas ukuran; grafik MW per status dan 10 proyek terbesar. */
import { B, t, ex, num, esc, ikon, bukti, kakiSumber, tabel, batangSvg, kolomSvg, tipHtml, kosongTab, pil, orgLogoSel, orgLogo, proyekHidro, jumlahMw, siapTautan, naikkan, luar, catatan } from "/hdr_umum.js";
import { nanti } from "/inti/umum.js";

let st = "", kl = "";
const urut = () => B.hd.rujukan.status_urut;
const SERI = { beroperasi: "hdr-s-op", konstruksi: "hdr-s-kon", izin: "hdr-s-izin", rencana: "hdr-s-ren", lain: "hdr-s-lain" };
function saring() { return proyekHidro().filter((p) => (!st || p.status === st) && (!kl || p.kelas === kl)); }
function tabProyek() {
  const el = document.getElementById("hdr-b-tab"); if (!el) return;
  tabel(el, { satuan: "hdr.u.proyek", per: 10, urutAwal: 3, menurun: true, kolom: [
    { label: t("hdr.c.pembangkit"), v: (p) => p.nama, f: (p) => `<span class="rg3-idk"><b>${p.url ? `<a class="rg3-tautan" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.nama)}</a>` : esc(p.nama)}</b><small>${esc(p.prov || "")}</small></span>` },
    { label: t("hdr.c.kelas"), v: (p) => p.kelas, f: (p) => pil("hdr.kelas.", p.kelas) },
    { label: t("hdr.c.status"), v: (p) => p.status, f: (p) => pil("hdr.st.", p.status) },
    { label: t("hdr.c.mw"), num: true, v: (p) => p.mw ?? -1, f: (p) => (p.mw != null ? `<b>${esc(num(p.mw, p.mw % 1 ? 1 : 0))}</b>` : "-") },
    { label: t("hdr.c.pemilik"), v: (p) => p.pemilik?.nama || "", f: (p) => (p.pemilik?.nama ? orgLogoSel(p.pemilik.org_id, p.pemilik.nama) : "-") },
    { label: t("hdr.c.cod"), num: true, v: (p) => p.cod_terbaru ?? p.cod_rencana ?? 0, f: (p) => (p.cod_terbaru || p.cod_rencana ? `<span class="rg3-idk"><b>${esc(String(p.cod_terbaru ?? p.cod_rencana))}</b><small>${esc(p.cod_jenis === "aktual" ? t("hdr.cod.aktual") : t("hdr.cod.rencana"))}</small></span>` : "-") },
    { label: t("hdr.c.bukti"), v: (p) => p.status_sumber?.jenis || "", f: (p) => bukti({ ruptl: "resmi", gem: "via-pihak-ketiga" }[p.status_sumber?.jenis] || "media", { sumber: t("hdr.sj." + (p.status_sumber?.jenis || "x")), tanggal: p.status_sumber?.tanggal || "" }) },
  ], baris: saring() });
}
function grafik() {
  const a = document.getElementById("hdr-b-g1"), b = document.getElementById("hdr-b-g2"); if (!a || !b) return;
  const P = saring(), ks = ["beroperasi", "konstruksi", "izin", "rencana"];
  a.innerHTML = kolomSvg({ el: a, satuan: "GW", label: t("hdr.p.j.status"), seri: [{ k: "v", kelas: "hdr-s-mw" }],
    kategori: ks.map((s) => { const q = P.filter((p) => p.status === s), mw = jumlahMw(q); return { label: t("hdr.st." + s), nilai: { v: mw / 1000 }, tip: t("hdr.st." + s), th: tipHtml(t("hdr.st." + s), [["MW", num(mw, 0)], [t("hdr.p.n_label"), String(q.length)]]) }; }) });
  const top = [...P].filter((p) => p.mw != null).sort((x, y) => y.mw - x.mw).slice(0, 10);
  b.innerHTML = batangSvg({ el: b, d: 0, satuan: "MW", label: t("hdr.p.j.top"), seri: Object.entries(SERI).map(([k, kelas]) => ({ k, kelas })),
    baris: top.map((p) => ({ label: p.nama, logo: p.pemilik?.org_id ? orgLogo(p.pemilik.org_id) : "", tip: p.nama, th: tipHtml(p.nama, [["MW", num(p.mw, 0)], [t("hdr.c.status"), t("hdr.st." + p.status)], [t("hdr.c.provinsi"), p.prov || "-"]]), bagian: [{ k: SERI[p.status] ? p.status : "lain", nilai: p.mw }] })) });
}
export function mulai(el) {
  if (!B.hd || !B.pt) { el.innerHTML = kosongTab("hdr.kosong"); return; }
  const P = proyekHidro(), per = urut().map((s) => [s, P.filter((p) => p.status === s)]).filter(([, a]) => a.length);
  const ubin = per.map(([s, a]) => `<div class="rg3-kartu"><div class="rg3-k-kep">${ikon("air-energi", 22)}<b>${esc(t("hdr.st." + s))}</b></div><p class="hdr-angka">${esc(num(jumlahMw(a), 0))} <small>MW</small></p><p class="jm-bantu">${esc(t("hdr.p.n", { n: a.length }))}</p></div>`).join("");
  const opsiSt = [["", t("hdr.semua"), P.length], ...per.map(([s, a]) => [s, t("hdr.st." + s), a.length])];
  const opsiKl = [["", t("hdr.semua"), P.length], ...["besar", "mini", "x"].map((k) => [k, t("hdr.kelas." + k), P.filter((p) => p.kelas === k).length])].filter((o) => o[2] > 0);
  const chips = (nama, opsi, cur, label) => `<div class="rg3-chips" role="group" aria-label="${esc(label)}">${opsi.map(([k, l, n]) => `<button type="button" class="rg3-chip rg3-chipb" data-${nama}="${esc(k)}" aria-pressed="${cur === k}"><span>${esc(l)}</span> <i>${n}</i></button>`).join("")}</div>`;
  el.innerHTML = [
    ex({ id: "hdr-b-ringkas", ikon: "petir", topik: t("hdr.p.ey.ringkas"), judulHtml: esc(t("hdr.p.j.ringkas", { n: P.length, mw: num(jumlahMw(P), 0) })), subHtml: esc(t("hdr.p.s.ringkas")), isiHtml: `<div class="rg3-kisi">${ubin}</div>`, kakiHtml: kakiSumber(["ruptl"]) }),
    ex({ id: "hdr-b-daftar", ikon: "tabel", topik: t("hdr.p.ey.daftar"), judulHtml: esc(t("hdr.p.j.daftar")), subHtml: esc(t("hdr.p.s.daftar", { batas: B.hd.rujukan.kelas_batas_mw })),
      isiHtml: `${chips("st", opsiSt, st, t("hdr.p.f"))}${chips("kl", opsiKl, kl, t("hdr.p.fk"))}<div id="hdr-b-g1" class="hdr-grafik"></div><div id="hdr-b-g2" class="hdr-grafik"></div><div id="hdr-b-tab"></div>${catatan("hdr.p.n.daftar")}` }),
  ].join("");
  grafik(); tabProyek();
  el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-st],[data-kl]"); if (!b) return;
    if ("st" in b.dataset) { st = b.dataset.st; for (const x of el.querySelectorAll("[data-st]")) x.setAttribute("aria-pressed", String(x.dataset.st === st)); }
    else { kl = b.dataset.kl; for (const x of el.querySelectorAll("[data-kl]")) x.setAttribute("aria-pressed", String(x.dataset.kl === kl)); }
    nanti(() => { grafik(); tabProyek(); });
  });
  siapTautan("org", "proyek").then(() => naikkan(el));
}
