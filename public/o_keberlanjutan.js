/* /o/<id>: bagian Keberlanjutan (laporan resmi per tahun, metrik bersumber, grafik tren interaktif, pasar modal hijau). Data: /data/keberlanjutan.json (kunci org_id).
   Teks lewat t() (kunci kbl.*); tanpa gaya inline; tooltip grafik lewat data-tip (inti/tip_grafik.js). */
import { t, angka, tanggal } from "/i18n.js";
import { esc, ikon, nanti } from "/inti/umum.js";
import { exHtml, sumberHtml } from "/inti/komponen.js";
import { khUbinHtml } from "/inti/kh.js";
import { buktiHtml } from "/inti/bukti.js";
import { hlHtml } from "/profil.js";
import "/inti/tip_grafik.js";

const SERI = ["emisi_s1", "emisi_s2", "emisi_s3", "intensitas"];
const akhir = (rows) => rows.slice().sort((a, b) => b.tahun - a.tahun)[0];
const aman = (u) => (/^https:\/\//.test(u || "") ? u : "");
const num = (v) => angka(v, { desimal: v !== 0 && Math.abs(v) < 0.1 ? 4 : Number.isInteger(v) || Math.abs(v) >= 100 ? 0 : 2 });
const fmt = (r) => `${num(r.nilai)} ${r.satuan}`;

function grafik(rows, kunci) {
  const d = rows.filter((r) => r.kunci === kunci).sort((a, b) => a.tahun - b.tahun);
  if (!d.length) return `<p class="kbl-kosong">${esc(t("kbl.tak_ada"))}</p>`;
  const W = 520, H = 200, L = 8, R = 8, T = 22, B = 30, mx = Math.max(...d.map((r) => r.nilai)) * 1.1 || 1;
  const X = (i) => (d.length === 1 ? W / 2 : L + 30 + (i * (W - L - R - 60)) / (d.length - 1)), Y = (v) => H - B - (v / mx) * (H - B - T);
  const garis = d.length > 1 ? `<polyline class="kbl-garis" points="${d.map((r, i) => `${X(i).toFixed(1)},${Y(r.nilai).toFixed(1)}`).join(" ")}"/>` : "";
  const titik = d.map((r, i) => {
    const tip = t("kbl.g.tip", { tahun: r.tahun, v: fmt(r), s: r.catatan || t("kbl.g.resmi") });
    return `<circle class="kbl-titik" cx="${X(i).toFixed(1)}" cy="${Y(r.nilai).toFixed(1)}" r="6" tabindex="0" data-tip="${esc(tip)}"/><text class="jm-gf-t2" x="${X(i).toFixed(1)}" y="${H - 10}" text-anchor="middle" font-size="12">${r.tahun}</text><text class="jm-gf-t1" x="${X(i).toFixed(1)}" y="${(Y(r.nilai) - 10).toFixed(1)}" text-anchor="middle" font-size="12">${esc(num(r.nilai))}</text>`;
  }).join("");
  return `<svg class="jm-gf" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("kbl.k." + kunci))}" focusable="false"><line class="jm-gf-grid" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/>${garis}${titik}</svg>`;
}

export function bagKeberlanjutan({ data, sumber }) {
  if (!data) return { html: "", pasang() {} };
  const rows = data.metrik || [], lap = (data.laporan || []).slice().sort((a, b) => b.tahun - a.tahun);
  const ubin = [];
  const s1 = akhir(rows.filter((r) => r.kunci === "emisi_s1")), it = akhir(rows.filter((r) => r.kunci === "intensitas")), tk = akhir(rows.filter((r) => r.kunci === "tenaga_kerja")), kp = akhir(rows.filter((r) => r.kunci === "kapasitas_ebt"));
  if (s1) ubin.push({ ikon: "karbon", nilai: num(s1.nilai), satuan: s1.satuan, label: `${t("kbl.k.emisi_s1")} ${s1.tahun}` });
  if (it) ubin.push({ ikon: "grafik", nilai: num(it.nilai), satuan: it.satuan, label: `${t("kbl.k.intensitas")} ${it.tahun}` });
  if (kp) ubin.push({ ikon: "petir", nilai: num(kp.nilai), satuan: kp.satuan, label: `${t("kbl.k.kapasitas_ebt")} ${kp.tahun}` });
  if (tk) ubin.push({ ikon: "orang", nilai: num(tk.nilai), label: `${t("kbl.k.tenaga_kerja")} ${tk.tahun}` });
  ubin.push({ ikon: "pdf", nilai: angka(lap.length), label: t("kbl.n_lap") });
  const tabs = SERI.filter((k) => rows.some((r) => r.kunci === k));
  const tab = tabs.length ? `<div class="jm-tab kbl-tab" role="tablist" aria-label="${esc(t("kbl.pilih"))}">${tabs.map((k, i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-k="${k}">${esc(t("kbl.k." + k))}</button>`).join("")}</div><figure class="oj-fig"><figcaption id="kblCap">${esc(t("kbl.k." + tabs[0]))}</figcaption><div id="kblGraf">${grafik(rows, tabs[0])}</div></figure>` : "";
  const daftar = lap.length ? `<ul class="kbl-lap">${lap.map((l) => { const u = aman(l.url), pdf = /\.pdf(\?|$)/i.test(u); return `<li>${ikon(pdf ? "pdf" : "tautan", 18)}<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(l.judul || t("kbl.lap." + l.jenis, { tahun: l.tahun }))}</a><span class="kbl-th">${esc(String(l.tahun))}</span>${buktiHtml(l.bukti, { sumber: u, tanggal: l.tanggal, tag: "span" })}</li>`; }).join("")}</ul>` : "";
  const chip = (a) => a.map((x) => `<span class="jm-pil">${esc(x.nama || x.pihak)} ${esc(String(x.tahun))}</span>`).join("");
  const meta = (data.standar?.length ? `<p class="kbl-meta"><b>${esc(t("kbl.standar"))}</b>${chip(data.standar)}</p>` : "")
    + (data.penjaminan?.length ? `<p class="kbl-meta"><b>${esc(t("kbl.jamin"))}</b>${chip(data.penjaminan)}</p>` : "")
    + (data.target?.length ? `<p class="kbl-meta"><b>${esc(t("kbl.target"))}</b>${data.target.map((x) => `<a href="${esc(aman(x.sumber))}" target="_blank" rel="noopener noreferrer">${esc(x.teks)}</a>`).join(", ")}</p>` : "");
  const pasar = (data.pasar || []).length ? `<h3 class="kbl-h3">${esc(t("kbl.pasar"))}</h3><ul class="kbl-lap">${data.pasar.map((p) => `<li>${ikon("transaksi", 18)}<a href="${esc(aman(p.sumber))}" target="_blank" rel="noopener noreferrer">${esc(t("kbl.p." + p.jenis))} (${esc(p.tanggal)})</a><span class="kbl-th">${esc(p.nilai ? angka(p.nilai / (p.mata_uang === "IDR" ? 1e12 : 1e6), { desimal: 2 }) + (p.mata_uang === "IDR" ? " T IDR" : " juta " + p.mata_uang) : "-")}</span>${buktiHtml(p.bukti, { sumber: p.sumber, tanggal: p.tanggal_periksa, tag: "span" })}<small>${esc([p.penggunaan, p.catatan].filter(Boolean).join(". "))}</small></li>`).join("")}</ul>` : "";
  const html = exHtml({
    id: "keberlanjutan", ikon: "karbon", topik: t("kbl.ey"),
    judulHtml: hlHtml("kbl.j", angka(lap.length)),
    subHtml: esc(t("kbl.sub")),
    aksiHtml: sumberHtml(sumber),
    isiHtml: `<div class="oj-bag-isi">${khUbinHtml(ubin)}${tab}${daftar}${meta}${pasar}</div>`,
  });
  return {
    html,
    pasang(akar) {
      akar.querySelector("#keberlanjutan .kbl-tab")?.addEventListener("click", (e) => {
        const b = e.target.closest("[data-k]"); if (!b) return;
        b.parentElement.querySelectorAll("[data-k]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
        nanti(() => { akar.querySelector("#kblGraf").innerHTML = grafik(rows, b.dataset.k); akar.querySelector("#kblCap").textContent = t("kbl.k." + b.dataset.k); });
      });
    },
  };
}
