/* /surya, tab Proyek, bagian program PLTS 100 GW dan koperasi desa. Data baru (struktur, tahap pertama, biaya, tender PLN, pelaksana disebut sumber) = surya_modul.json;
   tonggak, pelaksana berlogo, dan proyek terlacak dibaca dari program_analisis.json; kurva tahunan dari neraca_pasokan.json (Hipotesis, bukan target resmi). */
import { X, L, t, ex, num, esc, ikon, bukti, buktiSy, kakiSy, luar, chip, tabel, kolomSvg, tipHtml, daftarCelah, catatan, logoHtml, namaOrg } from "/sy_umum.js";

const P = () => X.sy.program;
const PA = () => (X.program?.baris || []).find((b) => b.program_id === X.sy.rujukan.program);
export function bagianProgram() {
  const p = P(), pa = PA();
  const kartu = (l, v, u, b) => `<div class="rg3-kartu sur-ubin"><span class="jm-kh-lbl">${esc(l)}</span><p class="sur-angka"><b>${esc(v)}</b><span>${esc(u)}</span></p><span class="rg3-ab">${b}</span></div>`;
  const t1 = p.tahap_pertama;
  const ub = [
    kartu(t("sur.g.u.target", { th: p.target.tahun_selesai }), num(p.target.gw), "GWp", buktiSy(p.target)),
    ...p.struktur.map((s) => kartu(t("sur.g.u." + s.k), num(s.gw), "GWp", buktiSy(s))),
    kartu(t("sur.g.u.disetujui"), num(t1[0].gw), "GW", buktiSy(t1[0])), kartu(t("sur.g.u.gb", { n: t1[1].proyek }), num(t1[1].gw, 1), "GWp", buktiSy(t1[1])),
    kartu(t("sur.g.u.invest"), num(p.biaya.investasi_rp_triliun), t("sur.u.triliun"), buktiSy(p.biaya)), kartu(t("sur.g.u.bess"), `${num(p.bess.gw)} / ${num(p.bess.gwh)}`, "GW / GWh", buktiSy(p.bess)),
  ].join("");
  const tl = [...t1.map((x) => ({ tgl: x.tanggal, teks: L(x.ket), b: buktiSy(x), k: t("sur.g.t." + x.k) })), ...(pa?.tonggak || []).filter((x) => x.tgl >= "2026-04").map((x) => ({ tgl: x.tgl, teks: L(x.peristiwa), b: bukti(x.bukti, { sumber: new URL(x.url).hostname.replace(/^www\./, ""), tanggal: x.tgl }), k: t("sur.g.t.tonggak"), url: x.url }))].sort((a, b) => String(a.tgl).localeCompare(String(b.tgl)));
  return ex({ id: "sur-p-prog", ikon: "bendera", topik: t("sur.g.ey"), judulHtml: esc(t("sur.g.j", { g: num(p.target.gw) })), subHtml: esc(t("sur.g.s")),
    isiHtml: `<div class="rg3-kisi">${ub}</div><p class="rg3-info">${ikon("info", 18)}<span>${esc(L(p.struktur_catatan))}</span></p>
      <h3 class="rg3-sub">${esc(t("sur.g.h.tahun"))}</h3><p class="rg3-info rg3-info-bad">${ikon("tanya", 18)}<span>${esc(L(p.target.catatan))} ${bukti("hipotesis", { cara: t("sur.g.cara_hip") })}</span></p><div id="sur-g-th" class="ih-bagan"></div>
      <h3 class="rg3-sub">${esc(t("sur.g.h.tahap"))}</h3><ol class="sur-tl">${tl.map((x) => `<li class="sur-tl-i"><div class="sur-tl-t"><b>${esc(x.tgl)}</b>${chip("rg3-w1", "", x.k)}${x.b}</div><p>${esc(x.teks)}</p>${x.url ? `<p>${luar(x.url, t("sur.g.sumber"))}</p>` : ""}</li>`).join("")}</ol>
      <h3 class="rg3-sub">${esc(t("sur.g.h.proyek"))}</h3><div id="sur-g-pj"></div><p class="jm-bantu ih-catatan">${esc(L(p.proyek_catatan))}</p>
      <h3 class="rg3-sub">${esc(t("sur.g.h.tender"))}</h3><p class="jm-bantu">${esc(t("sur.g.tender", { n: p.tender_pln.nama, mw: num(p.tender_pln.mw_total), tgl: p.tender_pln.tanggal }))} ${buktiSy(p.tender_pln)}</p><div id="sur-g-td" class="ih-bagan"></div>
      <h3 class="rg3-sub">${esc(t("sur.g.h.pelaksana"))}</h3><div id="sur-g-pl"></div>
      <h3 class="rg3-sub">${esc(t("sur.g.h.lahan"))}</h3><p class="rg3-info">${ikon("peta", 18)}<span>${esc(L(p.lahan.catatan))} ${buktiSy(p.lahan)}</span></p><p class="rg3-info">${ikon("peringatan", 18)}<span>${esc(L(p.tantangan))} ${buktiSy(p.tantangan)}</span></p><p class="rg3-info rg3-info-ok">${ikon("info", 18)}<span>${esc(L(p.rekomendasi_iesr))} ${buktiSy(p.rekomendasi_iesr)}</span></p>
      <p class="jm-bantu">${esc(L(p.biaya.catatan))}</p>${daftarCelah(p.celah.map(L))}<p class="jm-bantu"><a class="rg3-tautan" href="/program">${esc(t("sur.g.ke_program"))}</a></p>`,
    kakiHtml: kakiSy([p.target.sumber_id, ...t1.map((x) => x.sumber_id), p.biaya.sumber_id, p.bess.sumber_id, p.lahan.sumber_id, p.tender_pln.sumber_id, ...p.pelaksana.map((x) => x.sumber_id)]) });
}
export function gambarProgram(el) {
  const p = P(), pa = PA();
  const g = el.querySelector("#sur-g-th"), h = X.neraca?.skenario?.plts100_mwp_per_tahun;
  if (g && h) g.innerHTML = kolomSvg({ el: g, satuan: "MWp", label: t("sur.g.h.tahun"), seri: [{ k: "n", kelas: "sur-s-hip" }],
    kategori: Object.entries(h).map(([th, v]) => ({ label: th, nilai: { n: v }, tip: `${th}: ${num(v, 0)} MWp`, th: tipHtml(th, [[t("sur.g.target_hip"), `${num(v, 0)} MWp`], [t("sur.c.bukti"), t("sur.hipotesis")]]) })) });
  const td = el.querySelector("#sur-g-td");
  if (td) td.innerHTML = `<ul class="sur-daftar">${p.tender_pln.wilayah.map((w) => `<li>${ikon("lokasi", 18)}<p><b>${esc(t("sur.g.w." + w.k))}</b> ${esc(num(w.mw))} MW</p></li>`).join("")}</ul>`;
  const pj = el.querySelector("#sur-g-pj");
  if (pj) tabel(pj, { satuan: "sur.u.proyek", per: 8, urutAwal: 2, menurun: true, kolom: [
    { label: t("sur.c.proyek"), v: (r) => r.nama, f: (r) => (r.id ? `<a class="rg3-tautan" href="/p/${encodeURIComponent(r.id)}"><b>${esc(r.nama)}</b></a>` : `<b>${esc(r.nama)}</b>`) },
    { label: t("sur.c.provinsi"), v: (r) => r.prov || "", f: (r) => esc(r.prov || "-") },
    { label: "MW", num: true, v: (r) => r.mw ?? -1, f: (r) => (r.mw != null ? `<b>${esc(num(r.mw, r.mw < 10 ? 2 : 0))}</b>` : "-") },
    { label: t("sur.c.status"), v: (r) => r.st || "", f: (r) => chip("sur-st-" + (r.st === "rencana" ? "warn" : r.st === "konstruksi" ? "info" : "x"), "", t("sur.st." + (r.st || "tidak-diketahui"))) },
    { label: t("sur.c.bukti"), v: (r) => r.b || "", f: (r) => bukti(r.b || "media", { sumber: r.s || "program_analisis.json" }) },
  ], baris: [...(pa?.proyek || []).map((r) => ({ id: r.id, nama: r.nama, prov: r.prov, mw: r.sat?.toLowerCase().startsWith("gw") ? r.kap * 1000 : r.kap, st: r.st, b: "media", s: "METI (RUPTL, materi publik)" })),
    ...p.proyek_disebut.filter((d) => !(pa?.proyek || []).some((r) => (d.proyek_id && r.id === d.proyek_id) || r.nama.toLowerCase().replace(/^plts\s+(terapung\s+)?/, "") === d.nama.toLowerCase().replace(/^plts\s+(terapung\s+)?/, ""))).map((d) => ({ id: d.proyek_id, nama: d.nama, prov: "", mw: d.mw, st: "", b: d.tingkat_bukti, s: "TaiyangNews" }))] });
  const pl = el.querySelector("#sur-g-pl");
  if (pl) pl.innerHTML = `<div class="rg3-kisi">${(pa?.pelaksana || []).map((x) => `<div class="rg3-kartu sur-ubin"><div class="rg3-k-kep">${logoHtml(x.org_id, x.nama, x.logo)}<div><b>${namaOrg(x.org_id, x.nama)}</b><p class="jm-bantu">${esc(L(x.peran))}</p></div></div></div>`).join("")}${p.pelaksana.filter((x) => !(pa?.pelaksana || []).some((y) => x.pihak.toLowerCase().includes(y.nama.toLowerCase()))).map((x) => `<div class="rg3-kartu sur-ubin"><div class="rg3-k-kep">${ikon("orang", 22)}<div><b>${esc(x.pihak)}</b><p class="jm-bantu">${esc(L(x.peran))}</p></div></div><span class="rg3-ab">${buktiSy(x)}</span></div>`).join("")}</div>`;
}
