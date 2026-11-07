import { mulaiHalaman } from "/inti/kepala.js";
import { tombolKoreksi } from "/inti/koreksi.js";
import { khUbin } from "/inti/kh.js";
import { t, angka, tanggal } from "/i18n.js";
import { esc, nanti, debounce, hantuHtml, kosongHtml, galatHtml, ikon } from "/inti/umum.js";
import { cariHtml, pilihHtml, hapusHtml, exHtml, sumberHtml, unduhRegHtml, terkaitHtml } from "/inti/komponen.js";
import { tautOrg } from "/inti/tautan.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { penerbitHtml } from "/penerbit.js";
import { lapisAnggota, anggotaDl, muat, label, urlAman, norm, namaRegulasi, kelasStatus, SINGKAT } from "/publik.js";

const HAL = 25;
const S = { q: "", jenis: "", tahun: "", status: "", topik: "", tingkat: "", tampil: "daftar", hal: 1, uk: "", ua: 1 };
const KUNCI = Object.keys(S);
let D = null;

const tingkatDari = (r) => (r.jenis === "perda" ? "daerah" : "nasional");
const urut = (a, b) => (b.tahun || 0) - (a.tahun || 0) || String(b.tanggal_ditetapkan || "").localeCompare(String(a.tanggal_ditetapkan || ""));

function bacaUrl() {
  const p = new URLSearchParams(location.search);
  for (const k of KUNCI) if (p.has(k)) S[k] = k === "hal" ? Math.max(1, +p.get(k) || 1) : p.get(k);
  if (S.tampil !== "linimasa") S.tampil = "daftar";
  return p.get("id") || "";
}
function tulisUrl(id) {
  const u = new URL(location.href);
  for (const k of KUNCI) { const v = S[k]; const kosong = !v || (k === "tampil" && v === "daftar") || (k === "hal" && v === 1); kosong ? u.searchParams.delete(k) : u.searchParams.set(k, v); }
  id ? u.searchParams.set("id", id) : u.searchParams.delete("id");
  history.replaceState(null, "", u);
}

function saring() {
  const q = norm(S.q.trim());
  return D.baris.filter((r) => (!S.jenis || r.jenis === S.jenis) && (!S.tahun || String(r.tahun) === S.tahun) && (!S.status || r.status === S.status)
    && (!S.topik || (r.topik || []).includes(S.topik)) && (!S.tingkat || tingkatDari(r) === S.tingkat) && (!q || r._cari.includes(q))).sort(urut);
}

const adaFilter = () => !!(S.q || S.jenis || S.tahun || S.status || S.topik || S.tingkat);
function gambarSaring() {
  const hitung = (f) => [...new Set(D.baris.flatMap(f).filter(Boolean))];
  const p = (id, ik, semua, daftar) => pilihHtml({ id, ikon: ik, label: t(semua), opsi: [["", t(semua)], ...daftar], nilai: S[id] });
  const jenis = hitung((r) => [r.jenis]).map((v) => [v, label("reg.jenis.", v)]);
  const tahun = hitung((r) => [r.tahun]).sort((a, b) => b - a).map((v) => [String(v), String(v)]);
  const status = ["berlaku", "diubah", "dicabut"].map((v) => [v, label("reg.status.", v)]);
  const topik = hitung((r) => r.topik || []).map((v) => [v, label("reg.topik.", v)]).sort((a, b) => a[1].localeCompare(b[1]));
  const tingkat = ["nasional", "daerah"].map((v) => [v, label("reg.tingkat.", v)]);
  document.getElementById("saring").innerHTML = cariHtml({ id: "q", label: t("reg.cari") }) + p("jenis", "jenis", "reg.semua.jenis", jenis) + p("tahun", "tahun", "reg.semua.tahun", tahun) + p("status", "status", "reg.semua.status", status)
    + p("topik", "topik", "reg.semua.topik", topik) + p("tingkat", "tingkat", "reg.semua.tingkat", tingkat) + hapusHtml({ id: "hapus", label: t("jm.kosong.reset") });
  document.getElementById("q").value = S.q;
  document.getElementById("hapus").dataset.aksi = "reset";
  document.getElementById("hapus").hidden = !adaFilter();
  document.getElementById("tampil").innerHTML = ["daftar", "linimasa"].map((v) => `<button type="button" role="tab" data-tampil="${v}" aria-selected="${S.tampil === v}">${ikon(v === "daftar" ? "daftar2" : "linimasa", 18)}<span>${esc(t("reg.tampil." + v))}</span></button>`).join("");
}

const pil = (r) => `<span class="jm-pil ${kelasStatus(r.status)}">${esc(label("reg.status.", r.status))}</span>`;
const strip = () => `<span class="jm-strip" title="${esc(t("jm.belum"))}">-</span>`;
function barisHtml(r, i) {
  const no = i + 1, top = no <= 3 && S.hal === 1;
  return `<tr><td class="jm-no" data-label="${esc(t("reg.col.no"))}"><span class="jm-rank${top ? " jm-rank-top" : ""}">${no}</span></td>
    <td class="jm-id-sel" data-label="${esc(t("reg.col.aturan"))}"><span class="jm-id"><span><button type="button" data-id="${esc(r.id)}"><b>${esc(namaRegulasi(r))}</b></button><small title="${esc(r.judul)}">${esc(r.judul)}</small></span></span></td>
    <td class="jm-tengah jm-reg-pen" data-label="${esc(t("reg.col.penerbit"))}">${r.instansi_penerbit ? penerbitHtml(r.instansi_penerbit) : strip()}</td>
    <td class="jm-num" data-label="${esc(t("reg.col.tanggal"))}">${r.tanggal_ditetapkan ? esc(tanggal(r.tanggal_ditetapkan)) : strip()}</td>
    <td class="jm-tengah" data-label="${esc(t("reg.col.status"))}">${pil(r)}</td>
    <td class="jm-tengah jm-reg-dok" data-label="${esc(t("reg.col.dok"))}">${dokHtml(r)}</td></tr>`;
}

/* unduh naskah langsung (PDF resmi) + buka halaman sumber; pemilik 7 Nov 2026 */
const httpOk = (u) => /^https?:\/\//i.test(String(u || ""));
function dokHtml(r) {
  const pdf = httpOk(r.url_pdf) ? `<a class="jm-reg-ik" href="${esc(r.url_pdf)}" target="_blank" rel="noopener noreferrer" download title="${esc(t("reg.unduh"))}" aria-label="${esc(t("reg.unduh"))}: ${esc(namaRegulasi(r))}">${ikon("pdf", 18)}</a>` : "";
  const src = httpOk(r.url_sumber) ? `<a class="jm-reg-ik" href="${esc(r.url_sumber)}" target="_blank" rel="noopener noreferrer" title="${esc(t("reg.naskah"))}" aria-label="${esc(t("reg.naskah"))}: ${esc(namaRegulasi(r))}">${ikon("tautan", 18)}</a>` : "";
  return pdf || src ? `<span class="jm-reg-iks">${pdf}${src}</span>` : `<span class="jm-redup" title="${esc(t("reg.tanpa_dok"))}">-</span>`;
}

function gambarDaftar(rows) {
  const maks = Math.max(1, Math.ceil(rows.length / HAL));
  S.hal = Math.min(S.hal, maks);
  /* urut seluruh data sebelum dipotong halaman (pemilik: semua tabel bisa diurutkan) */
  const KUNCI = { aturan: (r) => namaRegulasi(r), penerbit: (r) => r.instansi_penerbit || "", tanggal: (r) => r.tanggal_ditetapkan || String(r.tahun || ""), status: (r) => r.status || "", dok: (r) => (r.url_pdf ? 2 : r.url_sumber ? 1 : 0) };
  if (S.uk && KUNCI[S.uk]) { const f = KUNCI[S.uk]; rows = [...rows].sort((a, b) => { const x = f(a), y = f(b); return (typeof x === "number" ? x - y : String(x).localeCompare(String(y), "id", { numeric: true })) * S.ua; }); }
  const potong = rows.slice((S.hal - 1) * HAL, S.hal * HAL);
  const th = (k, kelas = "", uk = "") => uk ? `<th class="${kelas}" aria-sort="${S.uk === uk ? (S.ua > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-uk="${uk}">${esc(t(k))}</button></th>` : `<th class="${kelas}">${esc(t(k))}</th>`;
  document.getElementById("isi").innerHTML = potong.length ? `<div class="jm-gulir"><table class="jm-tabel jm-tabel-tetap jm-reg-tabel" data-urut="tidak"><thead><tr>${th("reg.col.no", "jm-no")}${th("reg.col.aturan", "", "aturan")}${th("reg.col.penerbit", "", "penerbit")}${th("reg.col.tanggal", "", "tanggal")}${th("reg.col.status", "", "status")}${th("reg.col.dok", "", "dok")}</tr></thead><tbody>${potong.map((r, i) => barisHtml(r, (S.hal - 1) * HAL + i)).join("")}</tbody></table></div>` : kosongHtml("jm.kosong.cocok", { data: "reset", kunci: "jm.kosong.reset" });
  document.getElementById("hal").innerHTML = maks > 1 ? `<button type="button" class="jm-tbl jm-tbl-kecil" data-hal="-1"${S.hal <= 1 ? " disabled" : ""}>${esc(t("jm.sebelumnya"))}</button><span>${esc(t("jm.hal", { n: angka(S.hal) }))} / ${angka(maks)}</span><button type="button" class="jm-tbl jm-tbl-kecil" data-hal="1"${S.hal >= maks ? " disabled" : ""}>${esc(t("jm.berikutnya"))}</button>` : "";
}

/** Linimasa: grafik per tahun (klik = lompat), lalu tiap tahun = bilah lengket yang bisa dilipat + baris padat; relasi mengubah/mencabut jadi chip di bawah judul. */
const MAKS_TAHUN = 8, TAHUN_GRAFIK = 15;
const warnaStatus = { berlaku: "ok", diubah: "warn", dicabut: "bad" };
function itemHtml(r, tersembunyi) {
  const nama = (id) => { const x = D.byId.get(id); return x ? namaRegulasi(x) : id; };
  const chip = (ik) => {
    const teks = `${ik.jenis === "mengubah" ? "\u21bb" : "\u2715"} ${t("reg.tl." + ik.jenis)} ${nama(ik.ke)}`;
    return D.byId.has(ik.ke) ? `<button type="button" class="jm-tl-chip jm-tl-${ik.jenis}" data-id="${esc(ik.ke)}">${esc(teks)}</button>` : `<span class="jm-tl-chip jm-tl-${ik.jenis}">${esc(teks)}</span>`;
  };
  const rel = (r.ikatan || []).filter((x) => x.jenis === "mengubah" || x.jenis === "mencabut").map(chip).join("");
  const [hr, bln] = r.tanggal_ditetapkan ? tanggal(r.tanggal_ditetapkan).split(" ") : [];
  return `<li class="jm-lm-item jm-lm-s-${esc(warnaStatus[r.status] || "ok")}" data-id="${esc(r.id)}"${tersembunyi ? " hidden data-lebih" : ""}>
    <span class="jm-lm-tgl">${hr ? `<b>${esc(hr)}</b><small>${esc(bln || "")}</small>` : "-"}</span>
    <span class="jm-lm-jn jm-jn-${esc(r.jenis)}">${esc(SINGKAT[r.jenis] || label("reg.jenis.", r.jenis))}</span><b class="jm-lm-no">${esc(`${r.nomor}/${r.tahun}`)}</b>
    <span class="jm-lm-judul"><span class="jm-lm-j2" title="${esc(r.judul)}">${esc(r.judul)}</span>${rel ? `<span class="jm-tl-rel">${rel}</span>` : ""}</span>
    <span class="jm-lm-pen">${r.instansi_penerbit ? penerbitHtml(r.instansi_penerbit, 28) : "-"}</span>
    <span class="jm-lm-ting">${esc(label("reg.tingkat.", tingkatDari(r)))}</span><span class="jm-lm-sts">${pil(r)}</span><span class="jm-lm-dok">${unduhRegHtml(r)}</span></li>`;
}
/* kolom bertumpuk Nasional (bawah) + Daerah (atas) per tahun, SVG murni: kelas + atribut saja (CSP) */
function grafikTahun(per) {
  const ada = [...per.keys()].filter(Boolean), akhir = Math.max(...ada), M = innerWidth < 640, W = M ? 360 : 640, H = 150, B = H - 22, T = 22, n = TAHUN_GRAFIK, gap = W / n, bw = gap * 0.62;
  const ys = Array.from({ length: n }, (_, i) => akhir - n + 1 + i);
  const tot = (y) => (per.get(y) || []).length, mx = Math.max(1, ...ys.map(tot)), Y = (v) => (v / mx) * (B - T);
  const g = ys.map((y, i) => {
    const rs = per.get(y) || [], nas = rs.filter((r) => tingkatDari(r) === "nasional").length, dae = rs.length - nas, x = i * gap + (gap - bw) / 2, cx = x + bw / 2;
    const hn = Y(nas), hd = Y(dae), lab = M ? "'" + String(y).slice(2) : String(y);
    return `<g class="jm-lg-k${String(y) === S.tahun ? " jm-lg-pilih" : ""}" data-th="${y}" role="button" tabindex="0" aria-label="${y}: ${rs.length}"><rect class="jm-lg-hit" x="${(i * gap).toFixed(1)}" y="0" width="${gap.toFixed(1)}" height="${H}"/>`
      + (nas ? `<rect class="jm-lg-n" x="${x.toFixed(1)}" y="${(B - hn).toFixed(1)}" width="${bw.toFixed(1)}" height="${hn.toFixed(1)}" rx="2"/>` : "")
      + (dae ? `<rect class="jm-lg-d" x="${x.toFixed(1)}" y="${(B - hn - hd).toFixed(1)}" width="${bw.toFixed(1)}" height="${hd.toFixed(1)}" rx="2"/>` : "")
      + `<text class="jm-lg-v" x="${cx.toFixed(1)}" y="${(B - hn - hd - 5).toFixed(1)}" text-anchor="middle">${rs.length ? esc(angka(rs.length)) : ""}</text><text class="jm-lg-y" x="${cx.toFixed(1)}" y="${H - 6}" text-anchor="middle">${esc(lab)}</text></g>`;
  }).join("");
  return `<div class="jm-lg"><div class="jm-lg-kep"><h3>${ikon("tahun", 18)}<span>${esc(t("reg.tl.grafik"))}</span></h3><span class="jm-lg-leg"><i class="jm-lg-n"></i>${esc(label("reg.tingkat.", "nasional"))}<i class="jm-lg-d"></i>${esc(label("reg.tingkat.", "daerah"))}</span></div>`
    + `<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(t("reg.tl.grafik"))}" focusable="false">${g}<line class="jm-lg-dasar" x1="0" x2="${W}" y1="${B}" y2="${B}"/></svg></div>`;
}
function gambarLinimasa(rows) {
  document.getElementById("hal").innerHTML = "";
  const per = new Map();
  for (const r of rows) (per.get(r.tahun || 0) || per.set(r.tahun || 0, []).get(r.tahun || 0)).push(r);
  const tahun = [...per.keys()].sort((a, b) => b - a);
  if (!tahun.length) { document.getElementById("isi").innerHTML = kosongHtml("jm.kosong.cocok", { data: "reset", kunci: "jm.kosong.reset" }); return; }
  const chipN = (j, n) => (n ? `<span class="jm-tanda jm-tanda-${j}">${esc(t("reg.tl.n." + j, { n: angka(n) }))}</span>` : "");
  document.getElementById("isi").innerHTML = (tahun.some(Boolean) ? grafikTahun(per) : "") + `<div class="jm-lm">${tahun.map((y) => {
    const rs = per.get(y), ub = jml(rs, "mengubah"), cb = jml(rs, "mencabut");
    return `<section class="jm-lm-tahun" id="th-${y}" aria-label="${y || "-"}"><button type="button" class="jm-lm-th" data-lipat aria-expanded="true" aria-label="${esc(t("reg.tl.lipat"))} ${y || "-"}"><h3>${y || "-"}</h3><span class="jm-lm-pils">${chipN("terbit", rs.length)}${chipN("mengubah", ub)}${chipN("mencabut", cb)}</span>${ikon("panah-kanan", 18)}</button>
      <ol class="jm-lm-daftar">${rs.map((r, i) => itemHtml(r, i >= MAKS_TAHUN)).join("")}</ol>${rs.length > MAKS_TAHUN ? `<button type="button" class="jm-tbl jm-tbl-kecil jm-tl-lebih" data-lebih="${rs.length - MAKS_TAHUN}">${esc(t("reg.tl.lebih", { n: angka(rs.length - MAKS_TAHUN) }))}</button>` : ""}</section>`;
  }).join("")}</div>`;
}
const jml = (rs, j) => rs.reduce((n, r) => n + (r.ikatan || []).filter((x) => x.jenis === j).length, 0);

function gambarIsi() {
  const rows = saring();
  document.getElementById("hapus") && (document.getElementById("hapus").hidden = !adaFilter());
  document.getElementById("hitung").textContent = t("reg.hitung", { n: angka(rows.length), total: angka(D.baris.length) });
  const ex = document.getElementById("ex-reg"), tl = S.tampil === "linimasa";
  ex.querySelector(".jm-ex-ey").lastChild.textContent = t("reg.ex.ey." + S.tampil);
  ex.querySelector(".jm-ex-j").innerHTML = hlHtml("reg.ex.j", angka(rows.length), { total: angka(D.baris.length) });
  ex.querySelector(".jm-ex-sub").textContent = t("reg.ex.sub." + S.tampil);
  ex.querySelector("[data-jm-aksi=csv]")?.toggleAttribute("hidden", tl);
  (S.tampil === "linimasa" ? gambarLinimasa : gambarDaftar)(rows);
}

/* ---------- pelacak kebijakan: baru 90 hari, mengubah/mencabut, dalam pembahasan (tenggat: belum ada datanya, bagian tidak dibuat) ---------- */
const HARI = 90, MAKS_UBAH = 6;
const potong = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "\u2026" : s);
const tglReg = (r) => r.tanggal_diundangkan || r.tanggal_ditetapkan || "";
/* sel aturan lengkap: logo penerbit, kode, judul satu baris, tanggal, unduh */
const selReg = (id) => { const x = D.byId.get(id); if (!x) return `<div class="jm-pk-sel"><span class="jm-pk-nm">${esc(id)}</span></div>`;
  return `<div class="jm-pk-sel">${x.instansi_penerbit ? penerbitHtml(x.instansi_penerbit, 32).replace(/<span class="jm-pen-pendek">.*?<\/span>/, "") : ""}<div class="jm-pk-sel-t"><button type="button" class="jm-pk-nm" data-id="${esc(id)}">${esc(namaRegulasi(x))}</button><span class="jm-pk-jd" title="${esc(x.judul || "")}">${esc(x.judul || "")}</span><small>${ikon("kalender", 14)}${esc(tanggal(tglReg(x)) || String(x.tahun || ""))}</small></div>${unduhRegHtml(x)}</div>`; };
const ikId = (id) => { const x = D.byId.get(id); return x ? `<button type="button" class="jm-pk-nm" data-id="${esc(id)}">${esc(namaRegulasi(x))}</button>` : `<span class="jm-pk-nm">${esc(id)}</span>`; };
function pkBagian(ik, judul, sub, isi) {
  return `<section class="jm-pk-b"><h3>${ikon(ik, 18)}<span>${esc(judul)}</span></h3><p class="jm-pk-sub">${esc(sub)}</p>${isi}</section>`;
}
function pkBaru() {
  const akhir = D.baris.reduce((m, r) => (tglReg(r) > m ? tglReg(r) : m), "");
  if (!akhir) return "";
  const batas = new Date(akhir + "T00:00:00Z"); batas.setUTCDate(batas.getUTCDate() - HARI);
  const mulai = batas.toISOString().slice(0, 10);
  const baru = D.baris.filter((r) => tglReg(r) > mulai).sort((a, b) => tglReg(b).localeCompare(tglReg(a)));
  const kartu = (r) => `<li class="jm-pk-kartu"><div class="jm-pk-atas"><span class="jm-lm-jn jm-jn-${esc(r.jenis)}">${esc(SINGKAT[r.jenis] || label("reg.jenis.", r.jenis))}</span>${r.instansi_penerbit ? penerbitHtml(r.instansi_penerbit, 28) : ""}</div>
    <button type="button" class="jm-pk-nm" data-id="${esc(r.id)}">${esc(namaRegulasi(r))}</button><span class="jm-pk-jd" title="${esc(r.judul)}">${esc(r.judul)}</span>
    <div class="jm-pk-bawah"><span class="jm-pk-tgl">${ikon("kalender", 16)}${esc(tanggal(tglReg(r)))}</span>${unduhRegHtml(r)}</div></li>`;
  return pkBagian("tahun", t("reg.pk.baru"), t("reg.pk.baru.sub", { n: angka(HARI), tanggal: tanggal(akhir) }),
    baru.length ? `<ul class="jm-pk-kartu-daftar">${baru.map(kartu).join("")}</ul>` : `<p class="jm-pk-kosong">${esc(t("reg.pk.baru.kosong"))}</p>`);
}
function pkUbah() {
  const pasang = D.baris.filter((r) => (r.ikatan || []).some((x) => x.jenis === "mengubah" || x.jenis === "mencabut")).sort((a, b) => (tglReg(b) || String(b.tahun)).localeCompare(tglReg(a) || String(a.tahun))).slice(0, MAKS_UBAH);
  if (!pasang.length) return "";
  const baris = pasang.flatMap((r) => (r.ikatan || []).filter((x) => x.jenis === "mengubah" || x.jenis === "mencabut").slice(0, 2).map((x) =>
    `<li class="jm-pk-ub2" data-r="${esc(r.id)}" data-k="${esc(x.ke)}" data-j="${esc(x.jenis)}">${selReg(r.id)}<span class="jm-pk-aksi jm-tanda jm-tanda-${x.jenis}">${ikon("panah-kanan", 16)}${esc(t("reg.pk.kata." + x.jenis))}</span>${selReg(x.ke)}
      <p class="jm-pk-ring">${esc(potong(r.ringkasan || r.judul || "", 170))}</p><button type="button" class="jm-pk-lihat" data-pasang>${ikon("info", 16)}<span>${esc(t("reg.pk.lihat"))}</span>${ikon("panah-kanan", 16)}</button></li>`));
  return pkBagian("ubah", t("reg.pk.ubah"), t("reg.pk.ubah.sub"), `<ul class="jm-pk-ubah">${baris.join("")}</ul>`);
}
const LANGKAH = ["usul", "prolegnas", "pembahasan", "pengesahan", "diundangkan"];
function pkBahas(k) {
  const kartu = (e) => {
    const sekarang = LANGKAH.indexOf(e.tahap), s = e.sumber || {};
    const lgk = (e.langkah || LANGKAH).map((l, i) => `<li class="jm-pk-l${i < sekarang ? " jm-pk-l-lalu" : i === sekarang ? " jm-pk-l-kini" : ""}"${i === sekarang ? ' aria-current="step"' : ""}>${ikon(i < sekarang ? "centang" : i === sekarang ? "info" : "linimasa", 16)}<span>${esc(t("reg.pk.l." + l))}</span></li>`).join("");
    const src = urlAman(s.url) ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}${esc(s.label)}</a>` : `<span>${ikon("tautan", 16)}${esc(s.label)}</span>`;
    return `<li class="jm-pk-bh"><div class="jm-pk-atas"><span class="jm-lm-jn">${esc(label("reg.jenis.", e.jenis))}</span><b>${esc(e.nama)}</b></div>
      <p class="jm-pk-tahap">${esc(t("reg.pk.tahap"))}: <b>${esc(t("reg.pk.l." + e.tahap))}</b></p><ol class="jm-pk-langkah">${lgk}</ol>
      <p class="jm-pk-src">${src}<span class="jm-pk-tgl">${ikon("kalender", 16)}${esc(tanggal(e.tanggal))}</span>${s.diverifikasi_ke_dpr === false ? `<span class="jm-pil jm-pil-warn">${esc(t("reg.ruu.belum"))}</span>` : ""}</p></li>`;
  };
  return k.length ? pkBagian("regulasi", t("reg.pk.bahas"), t("reg.pk.bahas.sub"), `<ul class="jm-pk-bahas">${k.map(kartu).join("")}</ul>`) : "";
}
async function gambarRuu() {
  const el = document.getElementById("ruu");
  let k = [];
  try { k = (await muat("kebijakan_proses")).baris; } catch (e) { /* bagian pembahasan diam bila berkas gagal */ }
  const isi = pkBaru() + pkUbah() + pkBahas(k);
  el.innerHTML = isi ? exHtml({ id: "ex-pk", ikon: "regulasi", topik: t("reg.pk.ey"), judulHtml: esc(t("reg.pk.j")), subHtml: esc(t("reg.pk.sub")), aksiHtml: " ", isiHtml: `<div class="jm-pk">${isi}</div>` }) : "";
}

/* ---------- pop-up pasangan: ringkasan kedua aturan + apa yang diubah/dicabut + unduh ---------- */
function kartuReg(x, judulKunci) {
  const unduh = urlAman(x.url_pdf) ? `<a class="jm-tbl jm-tbl-kecil" href="${esc(x.url_pdf)}" target="_blank" rel="noopener noreferrer" download>${ikon("pdf", 16)}<span>${esc(t("reg.unduh"))}</span></a>` : "";
  const naskah = urlAman(x.url_sumber) ? `<a class="jm-tbl jm-tbl-kecil" href="${esc(x.url_sumber)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}<span>${esc(t("reg.naskah"))}</span></a>` : "";
  return `<article class="jm-rg-k"><p class="jm-rg-ey">${esc(t(judulKunci))}</p><div class="jm-rg-kep">${x.instansi_penerbit ? penerbitHtml(x.instansi_penerbit, 40) : ""}<div><b class="jm-rg-kode">${esc(namaRegulasi(x))}</b><small>${esc(tanggal(x.tanggal_ditetapkan) || String(x.tahun || ""))}</small></div></div>
    <h3>${esc(x.judul)}</h3><p class="jm-baris-meta">${pil(x)}</p><p class="jm-rg-ring">${esc(x.ringkasan || "-")}</p><div class="jm-rg-aksi">${unduh}${naskah}<button type="button" class="jm-tbl jm-tbl-kecil" data-id="${esc(x.id)}">${esc(t("reg.pop.detail"))}</button></div></article>`;
}
function pasangHtml(a, b, jenis) {
  return `<div class="jm-lembar-isi"><div class="jm-lembar-kepala"><div><p class="jm-baris-no">${esc(t("reg.pop.judul"))}</p><h2 id="pasang-j">${esc(t("reg.pop.ket." + jenis, { a: namaRegulasi(a), b: namaRegulasi(b) }))}</h2></div>
    <button type="button" class="iconbtn" data-aksi="tutup" aria-label="${esc(t("jm.tutup"))}">${ikon("tutup", 22)}</button></div>
    <div class="jm-rg-dua">${kartuReg(a, "reg.pop.a." + jenis)}<span class="jm-rg-tengah jm-tanda jm-tanda-${esc(jenis)}">${ikon("panah-kanan", 18)}${esc(t("reg.pk.kata." + jenis))}</span>${kartuReg(b, "reg.pop.b." + jenis)}</div>
    <section class="jm-rg-apa"><h3>${esc(t("reg.pop.apa." + jenis))}</h3><p>${esc(t("reg.pop.ket." + jenis, { a: namaRegulasi(a), b: namaRegulasi(b) }))} ${esc(t("reg.pop.rujuk"))}</p><p>${esc(potong(a.ringkasan || a.judul || "", 400))}</p></section></div>`;
}
function bukaPasang(ra, rk, j) {
  const a = D.byId.get(ra), b = D.byId.get(rk), dlg = document.getElementById("pasang");
  if (!a || !b) return;
  dlg.innerHTML = pasangHtml(a, b, j);
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
}

/* ---------- lembar profil ---------- */
function terkait(r) {
  const proyek = D.proyek.filter((p) => (p.regulasi_ids || []).includes(r.id) || (r.proyek_ids || []).includes(p.id));
  const program = D.program.filter((g) => (g.regulasi_ids || []).includes(r.id) || (r.program_ids || []).includes(g.id));
  return { proyek, program };
}
function profilHtml(r) {
  const nama = (id) => { const x = D.byId.get(id); return x ? `<button type="button" data-id="${esc(id)}">${esc(namaRegulasi(x))}</button>` : `<span>${esc(id)}</span>`; };
  const rantai = (judul, daftar, kunci, pasif) => (daftar?.length ? `<section><h3>${esc(t(judul))}</h3><ul class="jm-rantai">${daftar.map((x) => `<li><span class="jm-tanda jm-tanda-${x.jenis}">${esc(t((pasif ? "reg.tp." : "reg.tl.") + x.jenis))}</span>${nama(x[kunci])}</li>`).join("")}</ul></section>` : "");
  const { proyek, program } = terkait(r);
  const lain = (n) => (n > 8 ? ` <small>${esc(t("reg.lainnya", { n: angka(n - 8) }))}</small>` : "");
  const sat = (p) => esc(`${p.nama}${p.lokasi?.provinsi ? ", " + p.lokasi.provinsi : ""}`);
  const dd = (k, v) => (v ? `<dt>${esc(t(k))}</dt><dd>${v}</dd>` : "");
  return `<div class="jm-lembar-isi"><div class="jm-lembar-kepala"><div class="jm-rg-kep jm-rg-kep-b">${r.instansi_penerbit ? penerbitHtml(r.instansi_penerbit, 48) : ""}<div><p class="jm-baris-no">${esc(namaRegulasi(r))}</p><h2 id="lembar-j">${esc(r.judul)}</h2></div></div>
    <button type="button" class="iconbtn" data-aksi="tutup" aria-label="${esc(t("jm.tutup"))}">${ikon("tutup", 22)}</button></div>
    <div class="jm-baris-meta">${pil(r)}<span class="jm-pil">${esc(label("reg.tingkat.", tingkatDari(r)))}</span>${r.tanggal_ditetapkan ? `<span class="jm-pil">${ikon("kalender", 14)}${esc(tanggal(r.tanggal_ditetapkan))}</span>` : ""}</div>
    <p>${tombolKoreksi({ entitas: "regulasi", id: r.id, nama: namaRegulasi(r) })}</p>
    <dl class="jm-dl">${dd("reg.f.jenis", esc(label("reg.jenis.", r.jenis)))}${dd("reg.f.penerbit", tautOrg(r.instansi_penerbit))}${dd("reg.f.ditetapkan", esc(tanggal(r.tanggal_ditetapkan)))}${r.tanggal_diundangkan ? dd("reg.f.diundangkan", esc(tanggal(r.tanggal_diundangkan))) : ""}${dd("reg.f.topik", (r.topik || []).map((x) => esc(label("reg.topik.", x))).join(", "))}</dl>
    <section><h3>${esc(t("reg.f.ringkasan"))} ${/^\S+ \d+\/\d+ mengatur /.test(r.ringkasan || "") ? `<span class="jm-pil jm-pil-est">${esc(t("reg.otomatis"))}</span>` : ""}</h3><p>${esc(r.ringkasan || "-")}</p></section>
    ${r.posisi_meti ? `<section class="jm-posisi"><h3>${esc(t("reg.f.posisi"))}</h3><p>${esc(r.posisi_meti)}</p></section>` : ""}
    ${rantai("reg.rantai.ikatan", r.ikatan, "ke")}${rantai("reg.rantai.diikat", r.diikat_oleh, "dari", true)}
    ${proyek.length || program.length ? `<section><h3>${esc(t("reg.terkait"))}</h3><ul class="jm-rantai">${program.map((g) => `<li><span class="jm-pil">${esc(t("reg.program"))}</span>${esc(g.nama)}</li>`).join("")}${proyek.slice(0, 8).map((p) => `<li><span class="jm-pil">${esc(t("reg.proyek"))}</span>${sat(p)}</li>`).join("")}</ul>${lain(proyek.length)}</section>` : ""}
    <section><h3>${esc(t("reg.f.sumber"))}</h3><div class="jm-rg-aksi">${urlAman(r.url_pdf) ? `<a class="jm-tbl jm-tbl-kecil" href="${esc(r.url_pdf)}" target="_blank" rel="noopener noreferrer" download>${ikon("pdf", 16)}<span>${esc(t("reg.pdf"))}</span></a>` : ""}${urlAman(r.url_sumber) ? `<a class="jm-tbl jm-tbl-kecil" href="${esc(r.url_sumber)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}<span>${esc(t("reg.naskah"))}</span></a>` : ""}</div><p class="jm-rg-diambil">${esc(t("reg.diambil", { tanggal: tanggal(r.tanggal_ambil) }))}</p></section></div>`;
}
function bukaProfil(id) {
  const r = D.byId.get(id), dlg = document.getElementById("lembar");
  if (!r) return;
  dlg.innerHTML = profilHtml(r);
  terkaitHtml("regulasi", id).then((h) => { const a = dlg.querySelector(".jm-lembar-isi"); if (h && a && dlg.open && !a.querySelector("#terkait")) a.insertAdjacentHTML("beforeend", h); });
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
  tulisUrl(id);
  isiAnggota(id);
}
/* lapis anggota/pengurus: posisi_meti (sudah ditangani bila ada di data) dan sumber_posisi; tamu: diam */
const LAPIS_RG = lapisAnggota("regulasi");
async function isiAnggota(id) {
  const x = (await LAPIS_RG)?.get(id), dlg = document.getElementById("lembar");
  if (!x || !dlg.open || dlg.querySelector("#rgAnggota")) return;
  const isi = anggotaDl([["reg.f.posisi", typeof x.posisi_meti === "string" ? x.posisi_meti : ""], ["reg.ang.sumber", x.sumber_posisi]], esc);
  if (isi) dlg.querySelector(".jm-lembar-isi")?.insertAdjacentHTML("beforeend", `<section id="rgAnggota"><h3>${esc(t("reg.ang.judul"))}</h3>${isi}</section>`);
}

/* ---------- mulai ---------- */
async function muatData() {
  const isi = document.getElementById("isi");
  isi.innerHTML = hantuHtml(6);
  try {
    const [reg, proyek, program] = await Promise.all([muat("regulasi"), muat("proyek"), muat("program")]);
    D = { baris: reg.baris, byId: new Map(reg.baris.map((r) => [r.id, r])), proyek: proyek.baris, program: program.baris, diambil: reg.baris.reduce((m, r) => (r.tanggal_ambil > m ? r.tanggal_ambil : m), reg.dibangun_pada || "") };
    for (const r of D.baris) r._cari = norm(`${r.judul} ${namaRegulasi(r)} ${r.jenis} ${r.nomor} tahun ${r.tahun}`);
    return true;
  } catch (e) { isi.innerHTML = galatHtml("layanan"); return false; }
}
function gambarKepala() {
  const n = (s) => D.baris.filter((r) => r.status === s).length;
  khUbin("khUbin", [{ ikon: "regulasi", nilai: angka(D.baris.length), label: t("reg.n.total") }, { ikon: "centang", nilai: angka(n("berlaku")), label: label("reg.status.", "berlaku") }, { ikon: "ubah", nilai: angka(n("diubah")), label: label("reg.status.", "diubah") }, { ikon: "blokir", nilai: angka(n("dicabut")), label: label("reg.status.", "dicabut") }]);
}
function gambarSemua() {
  gambarKepala();
  gambarSaring(); gambarIsi(); gambarRuu();
  document.querySelector("#ex-reg .jm-ex-aksi").innerHTML = aksiHtml({ csv: true }) + sumberHtml(esc(t("reg.sumber", { tanggal: tanggal(D.diambil) })));
}

async function main() {
  await mulaiHalaman();
  document.getElementById("daftar-reg").innerHTML = exHtml({ id: "ex-reg", ikon: "regulasi", topik: t("reg.ex.ey.daftar"), judulHtml: "", subHtml: " ", aksiHtml: " ",
    isiHtml: `<div class="jm-saring" id="saring"></div><div class="jm-alat"><div class="jm-tab" role="tablist" id="tampil"></div><p class="jm-hitung sr" id="hitung" role="status"></p></div><div id="isi"></div><div class="jm-hal" id="hal"></div>` });
  const idAwal = bacaUrl();
  const mulai = async () => { if (await muatData()) { gambarSemua(); if (idAwal && D.byId.has(idAwal)) bukaProfil(idAwal); } };
  await mulai();
  if (!D) { document.getElementById("isi").addEventListener("click", (e) => e.target.closest("[data-aksi=ulang]") && mulai()); return; }

  const tunda = () => nanti(() => { tulisUrl(new URLSearchParams(location.search).get("id")); gambarIsi(); });
  const cariTunda = debounce(() => { S.hal = 1; tunda(); });
  document.getElementById("saring").addEventListener("input", (e) => { if (e.target.id === "q") { S.q = e.target.value; cariTunda(); } });
  document.getElementById("saring").addEventListener("change", (e) => { const k = e.target.id; if (k in S && k !== "q") { S[k] = e.target.value; S.hal = 1; tunda(); } });
  document.getElementById("saring").addEventListener("click", (e) => {
    if (!e.target.closest("[data-aksi=reset]")) return;
    Object.assign(S, { q: "", jenis: "", tahun: "", status: "", topik: "", tingkat: "", hal: 1 });
    for (const el of document.querySelectorAll("#saring select")) el.value = "";
    document.getElementById("q").value = ""; tunda();
  });
  document.getElementById("tampil").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tampil]"); if (!b) return;
    S.tampil = b.dataset.tampil; S.hal = 1;
    for (const x of document.querySelectorAll("#tampil button")) x.setAttribute("aria-selected", String(x === b)); // chrome urgent
    tunda();
  });
  const bukaDari = (e) => { if (e.target.closest("a")) return; const b = e.target.closest("[data-id]"); if (b) bukaProfil(b.dataset.id); };
  document.getElementById("isi").addEventListener("keydown", (e) => { const k = e.target.closest?.("[data-th]"); if (k && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); k.dispatchEvent(new MouseEvent("click", { bubbles: true })); } });
  document.getElementById("isi").addEventListener("click", (e) => {
    const ub = e.target.closest("button[data-uk]"); if (ub) { const k = ub.dataset.uk; S.ua = S.uk === k ? -S.ua : 1; S.uk = k; S.hal = 1; tunda(); return; }
    const lp = e.target.closest("[data-lipat]"); if (lp) { const buka = lp.getAttribute("aria-expanded") !== "true", sc = lp.closest(".jm-lm-tahun"); lp.setAttribute("aria-expanded", String(buka)); sc.classList.toggle("jm-lm-tutup", !buka); return; }
    const gk = e.target.closest("[data-th]"); if (gk) { const sc = document.getElementById("th-" + gk.dataset.th); if (sc) { sc.classList.remove("jm-lm-tutup"); sc.querySelector("[data-lipat]").setAttribute("aria-expanded", "true"); sc.scrollIntoView({ block: "start", behavior: "smooth" }); } return; }
    const lb = e.target.closest("[data-lebih]:not(li)"); if (lb) { lb.closest(".jm-lm-tahun").querySelectorAll("li[data-lebih]").forEach((x) => { x.hidden = false; }); lb.remove(); return; }
    bukaDari(e); if (e.target.closest("[data-aksi=reset]")) document.querySelector("#saring [data-aksi=reset]").click(); });
  document.getElementById("hal").addEventListener("click", (e) => {
    const b = e.target.closest("[data-hal]"); if (!b) return;
    S.hal += +b.dataset.hal; tunda(); nanti(() => document.getElementById("saring").scrollIntoView({ block: "start" }));
  });
  document.getElementById("ruu").addEventListener("click", (e) => {
    const ps = e.target.closest(".jm-pk-ub2");
    if (ps && !e.target.closest("a, button[data-id]")) { bukaPasang(ps.dataset.r, ps.dataset.k, ps.dataset.j); return; }
    bukaDari(e);
  });
  const dp = document.createElement("dialog");
  dp.className = "jm-lembar"; dp.id = "pasang"; dp.setAttribute("aria-labelledby", "pasang-j");
  document.body.append(dp);
  dp.addEventListener("click", (e) => {
    if (e.target === dp || e.target.closest("[data-aksi=tutup]")) { dp.close(); return; }
    const b = e.target.closest("button[data-id]"); if (b) { dp.close(); bukaProfil(b.dataset.id); }
  });
  const dlg = document.getElementById("lembar");
  dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest("[data-aksi=tutup]")) dlg.close(); else bukaDari(e); });
  dlg.addEventListener("close", () => tulisUrl(""));
  document.addEventListener("jm:bahasa", () => nanti(() => { gambarSemua(); const id = new URLSearchParams(location.search).get("id"); if (id && dlg.open) dlg.innerHTML = profilHtml(D.byId.get(id)); }));
}
main();
