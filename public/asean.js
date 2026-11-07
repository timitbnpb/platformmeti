/* /asean: 10 negara ASEAN, tiga metrik, tren 10 tahun, Indonesia disorot. Data statis /data/asean.json. */
import { mulaiHalaman } from "/inti/kepala.js";
import { nanti, esc, hantuHtml } from "/inti/umum.js";
import { t, tanggal } from "/i18n.js";
import { muatData, tampilGalat, sumberHtml, kartuHtml, batangSvg, pil, num, saatBahasa } from "/analisis.js";

const $ = (id) => document.getElementById(id);
let d = null, metrik = "bauran";
const M = {
  bauran: { nilai: "bauran_persen", tren: "tren_bauran", satuan: "%", d: 1, sumber: "bauran" },
  kapasitas: { nilai: "kapasitas_ebt_mw", tren: "tren_kapasitas", satuan: "MW", d: 0, sumber: "kapasitas" },
  akses: { nilai: "akses_persen", tren: "tren_akses", satuan: "%", d: 1, sumber: "akses" },
};
const sumber = (m) => { const s = d.sumber[M[m].sumber]; return sumberHtml({ sumber: s.sumber, halaman: s.keterangan, url: s.url, tanggal: s.tanggal }); };
const nilaiN = (n, m) => n[M[m].nilai]?.nilai ?? null;
const urutan = (m) => d.baris.filter((n) => nilaiN(n, m) !== null).sort((a, b) => nilaiN(b, m) - nilaiN(a, m));
const peringkat = (m) => urutan(m).findIndex((n) => n.iso3 === "IDN") + 1;
const idn = () => d.baris.find((n) => n.iso3 === "IDN");

function jawab() {
  const i = idn();
  $("jawab").textContent = t("as.jawab", { r: peringkat("bauran"), n: urutan("bauran").length, v: num(nilaiN(i, "bauran"), 1), tahun: i.bauran_persen.tahun, rk: peringkat("kapasitas"), nk: urutan("kapasitas").length, ra: peringkat("akses"), na: urutan("akses").length });
}

function kartu() {
  const i = idn();
  $("kartu").innerHTML = ["bauran", "kapasitas", "akses"].map((m) => kartuHtml({
    judul: t("as.m." + m), nilai: num(nilaiN(i, m), M[m].d), satuan: M[m].satuan,
    penyebut: t("as.peringkat", { r: peringkat(m), n: urutan(m).length }) + " | " + t("as.tahun", { tahun: i[M[m].nilai].tahun }), sumber: sumber(m),
  })).join("");
}

function band() {
  const m = metrik, ada = urutan(m), tanpa = d.baris.filter((n) => nilaiN(n, m) === null);
  const baris = [...ada, ...tanpa].map((n) => {
    const v = nilaiN(n, m);
    return { label: n.nama, sorot: n.iso3 === "IDN", bagian: [{ nilai: v ?? 0, kelas: n.iso3 === "IDN" ? "jm-an-b1" : "jm-an-b4" }], teks: v === null ? t("an.tanpa_data") : `${num(v, M[m].d)} ${M[m].satuan} (${n[M[m].nilai].tahun})` };
  });
  $("grafik-band").innerHTML = batangSvg(baris, { label: t("as.m." + m) });
  $("sumber-band").innerHTML = sumber(m);
}

function tren() {
  const m = metrik, seri = d.baris.filter((n) => n[M[m].tren].length > 1);
  const th = seri.flatMap((n) => n[M[m].tren].map((p) => p.tahun)), t0 = Math.min(...th), t1 = Math.max(...th);
  const ymaks = Math.max(...seri.flatMap((n) => n[M[m].tren].map((p) => p.nilai))) * 1.08;
  const W = 680, H = 300, L = 56, R = 70, T = 12, B = 28;
  const x = (a) => L + ((a - t0) / (t1 - t0)) * (W - L - R), y = (v) => T + (1 - v / ymaks) * (H - T - B);
  const kisi = [0, 1, 2, 3, 4].map((i) => ymaks * i / 4);
  const grid = kisi.map((v) => `<line class="jm-an-grid" x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="jm-an-lbl" x="${L - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${esc(num(v, M[m].d))}</text>`).join("");
  const sb = [t0, Math.round((t0 + t1) / 2), t1].map((a) => `<text class="jm-an-lbl" x="${x(a).toFixed(1)}" y="${H - 8}" text-anchor="middle">${a}</text>`).join("");
  const garis = [...seri].sort((a, b) => (a.iso3 === "IDN") - (b.iso3 === "IDN")).map((n) => {
    const s = n[M[m].tren], id = n.iso3 === "IDN", a = s[s.length - 1];
    return `<g class="${id ? "jm-an-gars jm-an-sorot" : "jm-an-gars"}"><polyline points="${s.map((p) => x(p.tahun).toFixed(1) + "," + y(p.nilai).toFixed(1)).join(" ")}"/><text class="jm-an-lbl" x="${(x(a.tahun) + 5).toFixed(1)}" y="${(y(a.nilai) + 4).toFixed(1)}">${esc(n.iso3)}</text></g>`;
  }).join("");
  $("grafik-tren").innerHTML = `<svg class="jm-an-garis" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("as.tren_label", { metrik: t("as.m." + m) }))}" focusable="false">${grid}${sb}${garis}</svg>${sumber(m)}`;
  const ubah = (s) => { const a = s[0], b = s[s.length - 1]; return m === "kapasitas" ? (a.nilai ? `${num(((b.nilai - a.nilai) / a.nilai) * 100, 0)}%` : "-") : `${num(b.nilai - a.nilai, 1)} ${t("as.pp")}`; };
  $("tabel-tren").innerHTML = `<div class="jm-gulir"><table class="jm-tabel"><thead><tr><th>${esc(t("as.col.negara"))}</th><th>${esc(t("as.col.awal"))}</th><th>${esc(t("as.col.akhir"))}</th><th>${esc(t("as.col.ubah"))} ${pil("an.est")}</th></tr></thead><tbody>${seri.map((n) => {
    const s = n[M[m].tren], a = s[0], b = s[s.length - 1];
    return `<tr class="${n.iso3 === "IDN" ? "jm-an-baris-id" : ""}"><td data-l="${esc(t("as.col.negara"))}">${esc(n.nama)}</td><td data-l="${esc(t("as.col.awal"))}" class="jm-nowrap">${esc(num(a.nilai, M[m].d))} ${esc(M[m].satuan)} (${a.tahun})</td><td data-l="${esc(t("as.col.akhir"))}" class="jm-nowrap">${esc(num(b.nilai, M[m].d))} ${esc(M[m].satuan)} (${b.tahun})</td><td data-l="${esc(t("as.col.ubah"))}" class="jm-nowrap">${esc(ubah(s))}</td></tr>`;
  }).join("")}</tbody></table></div>`;
}

function cara() {
  $("cara").innerHTML = `<p>${esc(t("as.cara1"))}</p><p>${esc(t("as.cara2"))}</p><p>${esc(t("as.cara3"))}</p>`;
  $("kutip").textContent = t("as.kutip", { tanggal: tanggal(d.dibangun_pada, { gaya: "panjang" }) });
}

function gambar() { jawab(); kartu(); band(); tren(); cara(); }

async function mulai() {
  await mulaiHalaman();
  $("kartu").innerHTML = hantuHtml(2);
  try { d = await muatData("asean.json"); } catch (e) { tampilGalat($("kartu"), mulai); return; }
  gambar();
  saatBahasa(gambar);
  document.querySelector(".jm-an-sakelar").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-m]");
    if (!b || b.dataset.m === metrik) return;
    for (const x of b.parentElement.children) x.setAttribute("aria-pressed", String(x === b));
    metrik = b.dataset.m;
    nanti(() => { band(); tren(); });
  });
}
mulai();
