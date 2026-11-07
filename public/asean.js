/* /asean: 10 negara ASEAN, tiga metrik, tren 10 tahun, Indonesia disorot. Data statis /data/asean.json. */
import { mulaiHalaman } from "/inti/kepala.js";
import { nanti, esc, hantuHtml } from "/inti/umum.js";
import { t, tanggal } from "/i18n.js";
import { muatData, tampilGalat, pasangAksi, sumberHtml, kartuHtml, batangHtml, pasangBar, temuanHtml, heroVisual, ubinHtml, pil, num, saatBahasa } from "/analisis.js";

const $ = (id) => document.getElementById(id);
let d = null, metrik = "bauran", pilih = null;
const M = {
  bauran: { nilai: "bauran_persen", tren: "tren_bauran", satuan: "%", d: 1, sumber: "bauran" },
  kapasitas: { nilai: "kapasitas_ebt_mw", tren: "tren_kapasitas", satuan: "MW", d: 0, sumber: "kapasitas" },
  akses: { nilai: "akses_persen", tren: "tren_akses", satuan: "%", d: 1, sumber: "akses" },
};
const sumber = (m) => { const s = d.sumber[M[m].sumber]; return sumberHtml({ sumber: s.sumber, halaman: s.keterangan, url: s.url, tanggal: s.tanggal }); };
const ISO2 = { IDN: "id", VNM: "vn", PHL: "ph", THA: "th", MYS: "my", SGP: "sg", LAO: "la", KHM: "kh", MMR: "mm", BRN: "bn", TLS: "tl" };
const bendera = (n, u = 20) => `<img class="jm-bd${u > 20 ? " jm-bd-b" : ""}" src="/img/bendera/${ISO2[n.iso3]}.svg" width="${u}" height="${Math.round(u * 0.75)}" alt="" loading="lazy">`;
const ISO_URUT = Object.keys(ISO2);
const namaN = (n) => t("as.n." + n.iso3);
const nilaiN = (n, m) => n[M[m].nilai]?.nilai ?? null;
const urutan = (m) => d.baris.filter((n) => nilaiN(n, m) !== null).sort((a, b) => nilaiN(b, m) - nilaiN(a, m));
const peringkat = (m) => urutan(m).findIndex((n) => n.iso3 === "IDN") + 1;
const idn = () => d.baris.find((n) => n.iso3 === "IDN");

function jawab() {
  const i = idn();
  $("jawab").textContent = t("as.kh.lead");
  $("ubin").innerHTML = ubinHtml([
    { ikon: "analisis", ikonHtml: bendera(idn(), 32), nilai: `${peringkat("bauran")}/${urutan("bauran").length}`, label: t("as.kh.u1"), href: "#h-band" },
    { ikon: "peta", nilai: num(nilaiN(i, "bauran"), 1), satuan: "%", label: t("as.kh.u2"), href: "#h-band" },
    { ikon: "status", nilai: `${peringkat("kapasitas")}/${urutan("kapasitas").length}`, label: t("as.kh.u3"), href: "#h-tren" },
  ]);
}

function kartu() {
  const i = idn();
  $("kartu").innerHTML = ["bauran", "kapasitas", "akses"].map((m) => kartuHtml({
    ikonHtml: bendera(i, 32), ikon: { bauran: "analisis", kapasitas: "tabel", akses: "status" }[m], judul: t("as.k." + m), nilai: num(nilaiN(i, m), M[m].d), satuan: M[m].satuan,
    penyebut: t("as.peringkat", { r: peringkat(m), n: urutan(m).length }) + " | " + t("as.tahun", { tahun: i[M[m].nilai].tahun }), sumber: sumber(m),
  })).join("");
}

function band() {
  const m = metrik, ada = urutan(m), tanpa = d.baris.filter((n) => nilaiN(n, m) === null), i = idn();
  $("temuan-band").innerHTML = temuanHtml(t("as.t.band", { metrik: t("as.m." + m), r: peringkat(m), n: ada.length, v: num(nilaiN(i, m), M[m].d) + " " + M[m].satuan }), true);
  const baris = [...ada, ...tanpa].map((n) => {
    const v = nilaiN(n, m);
    return { id: n.iso3, pilih: pilih === n.iso3, label: namaN(n), labelHtml: `${bendera(n, n.iso3 === "IDN" ? 32 : 20)}<span>${esc(namaN(n))}</span>`, sorot: n.iso3 === "IDN", bagian: [{ nilai: v ?? 0, kelas: n.iso3 === "IDN" ? "jm-an-id" : "jm-an-c" + (1 + ISO_URUT.indexOf(n.iso3) % 4) }], teks: v === null ? t("an.tanpa_data") : `${num(v, M[m].d)} ${M[m].satuan} (${n[M[m].nilai].tahun})` };
  });
  $("grafik-band").innerHTML = batangHtml(baris, { label: t("as.m." + m), aksi: true, satuan: M[m].satuan === "%" ? "%" : "MW" })  + sumber(m);
  pasangBar($("grafik-band"));
}

function tren() {
  const m = metrik, seri = d.baris.filter((n) => n[M[m].tren].length > 1);
  const th = seri.flatMap((n) => n[M[m].tren].map((p) => p.tahun)), t0 = Math.min(...th), t1 = Math.max(...th);
  const ymaks = Math.max(...seri.flatMap((n) => n[M[m].tren].map((p) => p.nilai))) * 1.08;
  const W = Math.max(320, Math.round($("grafik-tren").clientWidth || 680)), H = W < 500 ? 260 : 300, L = 56, R = 76, T = 12, B = 28;
  const x = (a) => L + ((a - t0) / (t1 - t0)) * (W - L - R), y = (v) => T + (1 - v / ymaks) * (H - T - B);
  const kisi = [0, 1, 2, 3, 4].map((i) => ymaks * i / 4);
  const grid = kisi.map((v) => `<line class="jm-an-grid" x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="jm-an-lbl" x="${L - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${esc(num(v, M[m].d))}</text>`).join("");
  const sb = [t0, Math.round((t0 + t1) / 2), t1].map((a) => `<text class="jm-an-lbl" x="${x(a).toFixed(1)}" y="${H - 8}" text-anchor="middle">${a}</text>`).join("");
  // label ujung: urut menurut y, geser ke bawah minimal 14px dari label sebelumnya, garis penuntun tipis ke ujung garis
  const LX = W - R + 16, ly = new Map();
  let prev = -1e9;
  for (const n of [...seri].sort((a, b) => y(a[M[m].tren].at(-1).nilai) - y(b[M[m].tren].at(-1).nilai))) { const v = Math.max(y(n[M[m].tren].at(-1).nilai), prev + 14); ly.set(n.iso3, v); prev = v; }
  const garis = [...seri].sort((a, b) => (a.iso3 === "IDN") - (b.iso3 === "IDN") || (a.iso3 === pilih) - (b.iso3 === pilih)).map((n) => {
    const s = n[M[m].tren], id = n.iso3 === "IDN", a = s[s.length - 1], pts = s.map((p) => x(p.tahun).toFixed(1) + "," + y(p.nilai).toFixed(1)).join(" ");
    const titik = s.map((p) => `<circle class="jm-an-titik-tren" cx="${x(p.tahun).toFixed(1)}" cy="${y(p.nilai).toFixed(1)}" r="7"><title>${esc(namaN(n))}, ${p.tahun}: ${esc(num(p.nilai, M[m].d))} ${esc(M[m].satuan)}</title></circle>`).join("");
    return `<g class="jm-an-gars${id ? " jm-an-sorot" : ""}${n.iso3 === pilih ? " jm-an-pilih" : ""}" data-iso="${n.iso3}"><polyline points="${pts}"/><polyline class="jm-an-tangkap" points="${pts}"><title>${esc(namaN(n))}: ${esc(num(s[0].nilai, M[m].d))} ${esc(M[m].satuan)} (${s[0].tahun}), ${esc(num(a.nilai, M[m].d))} ${esc(M[m].satuan)} (${a.tahun})</title></polyline><polyline class="jm-an-penuntun" points="${x(a.tahun).toFixed(1)},${y(a.nilai).toFixed(1)} ${(LX - 4).toFixed(1)},${ly.get(n.iso3).toFixed(1)}"/><text class="jm-an-lbl" x="${LX}" y="${(ly.get(n.iso3) + 4).toFixed(1)}">${esc(n.iso3)}</text>${titik}</g>`;
  }).join("");
  const si = idn()[M[m].tren], pa = si[0], pb = si[si.length - 1];
  $("temuan-tren").innerHTML = temuanHtml(t("as.t.tren", { metrik: t("as.m." + m), a: num(pa.nilai, M[m].d) + " " + M[m].satuan, ta: pa.tahun, b: num(pb.nilai, M[m].d) + " " + M[m].satuan, tb: pb.tahun }));
  const dn = pilih && d.baris.find((n) => n.iso3 === pilih), sd = dn && dn[M[m].tren];
  const detail = sd && sd.length ? `<p class="jm-detail" role="status"><b>${esc(namaN(dn))}</b>: ${esc(num(sd[0].nilai, M[m].d))} ${esc(M[m].satuan)} (${sd[0].tahun}) &rarr; ${esc(num(sd[sd.length - 1].nilai, M[m].d))} ${esc(M[m].satuan)} (${sd[sd.length - 1].tahun})</p>` : "";
  $("grafik-tren").innerHTML = `<svg class="jm-an-garis jm-gx" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("as.tren_label", { metrik: t("as.m." + m) }))}" focusable="false">${grid}${sb}${garis}</svg>${detail}${sumber(m)}`;
  const ubah = (s) => { const a = s[0], b = s[s.length - 1]; return m === "kapasitas" ? (a.nilai ? `${num(((b.nilai - a.nilai) / a.nilai) * 100, 0)}%` : "-") : `${num(b.nilai - a.nilai, 1)} ${t("as.pp")}`; };
  $("tabel-tren").innerHTML = `<div class="jm-gulir"><table class="jm-tabel"><thead><tr><th>${esc(t("as.col.negara"))}</th><th>${esc(t("as.col.awal"))}</th><th>${esc(t("as.col.akhir"))}</th><th>${esc(t("as.col.ubah"))} ${pil("an.est")}</th></tr></thead><tbody>${seri.map((n) => {
    const s = n[M[m].tren], a = s[0], b = s[s.length - 1];
    return `<tr class="${n.iso3 === "IDN" ? "jm-an-baris-id" : ""}"><td data-label="${esc(t("as.col.negara"))}"><span class="jm-bd-n">${bendera(n, n.iso3 === "IDN" ? 32 : 20)}<span>${esc(namaN(n))}</span></span></td><td data-label="${esc(t("as.col.awal"))}" class="jm-num">${esc(num(a.nilai, M[m].d))} ${esc(M[m].satuan)} (${a.tahun})</td><td data-label="${esc(t("as.col.akhir"))}" class="jm-num">${esc(num(b.nilai, M[m].d))} ${esc(M[m].satuan)} (${b.tahun})</td><td data-label="${esc(t("as.col.ubah"))}" class="jm-num">${esc(ubah(s))}</td></tr>`;
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
  pasangAksi(["aksi-tren"]);
  gambar();
  saatBahasa(gambar);
  document.querySelector(".jm-tab").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-m]");
    if (!b || b.dataset.m === metrik) return;
    for (const x of b.parentElement.children) x.setAttribute("aria-selected", String(x === b));
    metrik = b.dataset.m;
    nanti(() => { band(); tren(); });
  });
  $("grafik-band").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-id]"); if (!b) return;
    pilih = pilih === b.dataset.id ? null : b.dataset.id;
    for (const x of $("grafik-band").querySelectorAll("button[data-id]")) x.setAttribute("aria-pressed", String(x.dataset.id === pilih));
    nanti(tren);
  });
  $("grafik-tren").addEventListener("click", (e) => {
    const g = e.target.closest("g[data-iso]"); if (!g) return;
    pilih = pilih === g.dataset.iso ? null : g.dataset.iso;
    for (const x of $("grafik-band").querySelectorAll("button[data-id]")) x.setAttribute("aria-pressed", String(x.dataset.id === pilih));
    nanti(tren);
  });
}
mulai();
