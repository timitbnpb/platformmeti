/* /rantai-global, tab Pemasok: kartu berlogo dan bendera, saringan teknologi/segmen/negara, tautan /o/. Sumber: pemasok_surya, pemasok_lain, pemasok_wte.
   INP: saringan berubah seketika; kartu dan grafik menyusul lewat nanti(). */
import { D, ex, t, esc, ikon, num, chipTek, chipSeg, labelSeg, bendera, namaNegara, logoHtml, namaOrg, luar, bukti, kosongTab, urlGet, urlSet, sumberBerkas } from "/rg3_umum.js";
import { nanti, debounce } from "/inti/umum.js";
import { cariHtml, pilihHtml, hapusHtml, hitungHtml } from "/inti/komponen.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { pasangPilih } from "/inti/pilih.js";
import { batangSvg, legendaHtml, tipHtml } from "/info_hijau.js";

const PER = 12, TEK = ["surya", "penyimpanan", "bayu", "hidro", "panas-bumi", "hidrogen", "jaringan", "bioenergi", "biomassa-sampah"];
const URUT_BUKTI = ["resmi", "situs-sendiri", "media", "via-pihak-ketiga", "kata-pihak"];
let semua = [], saring = { q: "", tek: "", seg: "", neg: "" }, hal = 1, panel;

const terbaik = (arr) => (arr || []).filter((x) => x?.tingkat_bukti).sort((a, b) => URUT_BUKTI.indexOf(a.tingkat_bukti) - URUT_BUKTI.indexOf(b.tingkat_bukti))[0] || null;
function rekam(b, sumber) {
  const tek = new Set(), seg = new Set();
  if (sumber === "surya") { for (const s of b.segmen) { if (s === "bess") tek.add("penyimpanan"); else tek.add("surya"); seg.add(s); } }
  else if (sumber === "wte") { tek.add("biomassa-sampah"); (b.komponen || []).forEach((s) => seg.add(s)); }
  else for (const s of b.segmen) {
    tek.add(["biomassa", "biogas", "biofuel"].includes(s) ? "bioenergi" : s);
    if (["biomassa", "biogas", "biofuel"].includes(s)) seg.add(s);
    (b.subsegmen || []).forEach((x) => seg.add(x));
  }
  const bk = terbaik(b.fakta) || terbaik(b.sumber) || b.sumber?.[0] || null;
  return {
    id: b.id, nama: b.nama, iso: String(b.negara_iso2 || b.negara || "").toLowerCase(), tek: [...tek], seg: [...seg], logo: typeof b.logo === "string" ? b.logo : b.logo?.url || "", situs: b.situs, tahun: b.tahun_berdiri || null,
    indo: !!((b.pabrik_indonesia || []).length || (b.mitra_indonesia || []).length || (b.proyek_indonesia || []).length || (b.indonesia || []).length || b.halaman_indonesia),
    tkdn: b.tkdn?.tkdn_persen_maks ?? null, bukti: bk?.tingkat_bukti || "", bTgl: bk?.tanggal_periksa || bk?.tanggal || "", bUrl: bk?.sumber_url || bk?.url || "", sumber,
  };
}
const bangun = () => { semua = [...(D.surya?.baris || []).map((b) => rekam(b, "surya")), ...(D.lain?.baris || []).map((b) => rekam(b, "lain")), ...(D.wte?.baris || []).map((b) => rekam(b, "wte"))]; };
const lolos = (r, s = saring) => (!s.q || r.nama.toLowerCase().includes(s.q.toLowerCase())) && (!s.tek || r.tek.includes(s.tek)) && (!s.seg || r.seg.includes(s.seg)) && (!s.neg || r.iso === s.neg);
const daftar = () => semua.filter((r) => lolos(r));

function opsi() {
  const hitung = (f) => { const m = new Map(); for (const r of semua) for (const k of [].concat(f(r))) if (k) m.set(k, (m.get(k) || 0) + 1); return m; };
  const tk = hitung((r) => r.tek), sg = hitung((r) => r.seg), ng = hitung((r) => r.iso);
  const O = {
    tek: [["", t("rg3.p.f.tek"), "tek:jaringan"], ...TEK.filter((k) => tk.has(k)).map((k) => [k, t("rg3.tek." + k), "tek:" + k, tk.get(k)])],
    seg: [["", t("rg3.p.f.seg"), "jenis"], ...[...sg].sort((a, b) => b[1] - a[1]).map(([k, n]) => [k, labelSeg(k), "jenis", n])],
    neg: [["", t("rg3.p.f.neg"), "globe"], ...[...ng].sort((a, b) => namaNegara(a[0]).localeCompare(namaNegara(b[0]))).map(([k, n]) => [k, namaNegara(k), "img:/img/bendera/" + k + ".svg", n])],
  };
  return O;
}

function kartu(r) {
  const nama = namaOrg(r.id, r.nama), chipsSeg = r.seg.slice(0, 4).map((s) => chipSeg(s)).join("") + (r.seg.length > 4 ? `<span class="rg3-lain">+${r.seg.length - 4}</span>` : "");
  const fakta = [r.tahun ? ["kalender", t("rg3.p.berdiri"), String(r.tahun)] : null, r.indo ? ["pabrik", t("rg3.p.indo"), t("rg3.p.ada")] : null, r.tkdn != null ? ["lencana", t("rg3.p.tkdn"), num(r.tkdn, 1) + "%"] : null].filter(Boolean);
  return `<article class="rg3-kartu">
    <header class="rg3-k-kep">${logoHtml(r.id, r.nama, r.logo)}<div><h3>${nama}</h3><p class="rg3-neg">${bendera(r.iso, 18)}<span>${esc(namaNegara(r.iso))}</span></p></div></header>
    <div class="rg3-chips">${r.tek.map(chipTek).join("")}${chipsSeg}</div>
    ${fakta.length ? `<dl class="rg3-fakta">${fakta.map(([ik, a, v]) => `<div>${ikon(ik, 16)}<dt>${esc(a)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
    <footer class="rg3-k-kaki">${bukti(r.bukti, { sumber: r.bUrl ? new URL(r.bUrl).hostname.replace(/^www\./, "") : "", tanggal: r.bTgl })}${r.situs ? luar(r.situs, t("rg3.p.situs")) : ""}</footer>
  </article>`;
}

function grafik() {
  const el = document.getElementById("rg3-p-g"), L = daftar(), per = new Map();
  if (!el) return;
  for (const r of L) { const o = per.get(r.iso) || { iso: r.iso, n: 0, tek: {} }; o.n++; for (const k of r.tek) o.tek[k] = (o.tek[k] || 0) + 1; per.set(r.iso, o); }
  const top = [...per.values()].sort((a, b) => b.n - a.n).slice(0, 12), ada = TEK.filter((k) => top.some((o) => o.tek[k]));
  document.getElementById("rg3-p-leg").innerHTML = legendaHtml(ada.map((k) => ({ kelas: "rg3-s-" + k, label: t("rg3.tek." + k) })));
  el.innerHTML = top.length ? batangSvg({ el, d: 0, label: t("rg3.p.ey.neg"), satuan: t("rg3.p.u"), seri: TEK.map((k) => ({ k, kelas: "rg3-s-" + k })),
    baris: top.map((o) => ({ label: namaNegara(o.iso), bendera: o.iso, tip: `${namaNegara(o.iso)}: ${o.n}`, th: tipHtml(namaNegara(o.iso), [[t("rg3.p.jumlah"), String(o.n)], ...ada.filter((k) => o.tek[k]).map((k) => [t("rg3.tek." + k), String(o.tek[k])])], { img: `/img/bendera/${o.iso}.svg` }), bagian: ada.map((k) => ({ k, nilai: o.tek[k] || 0 })) })) }) : "";
}
function kartuIsi() {
  const L = daftar(), mak = Math.max(1, Math.ceil(L.length / PER)); hal = Math.min(hal, mak);
  document.getElementById("rg3-p-hit").textContent = t("rg3.p.hit", { n: num(L.length), m: num(semua.length) });
  document.getElementById("rg3-p-hapus").hidden = !(saring.q || saring.tek || saring.seg || saring.neg);
  document.getElementById("rg3-p-kartu").innerHTML = L.length ? `<div class="rg3-kisi">${L.slice((hal - 1) * PER, hal * PER).map(kartu).join("")}</div>${paginasiHtml({ hal, total: L.length, per: PER, satuan: "rg3.p.u" })}` : `<p class="jm-kosong">${esc(t("rg3.p.kosong"))}</p>`;
}
const simpanUrl = () => urlSet({ pq: saring.q, ptek: saring.tek, pseg: saring.seg, pneg: saring.neg, phal: hal > 1 ? hal : "" });
const segar = () => { simpanUrl(); nanti(() => { kartuIsi(); grafik(); }); };

export function mulai(el) {
  panel = el;
  if (!semua.length) bangun();
  if (!semua.length) { el.innerHTML = kosongTab("rg3.p.kosong_data"); return; }
  saring = { q: urlGet("pq"), tek: urlGet("ptek"), seg: urlGet("pseg"), neg: urlGet("pneg") }; hal = +urlGet("phal") || 1;
  const O = opsi(), nSum = new Set(semua.map((r) => r.iso)).size;
  el.innerHTML = [
    ex({ id: "rg3-p-bagan", ikon: "globe", topik: t("rg3.p.ey.neg"), judulHtml: esc(t("rg3.p.j.neg", { n: num(semua.length), m: num(nSum) })), subHtml: esc(t("rg3.p.s.neg")), isiHtml: `<div id="rg3-p-leg"></div><div id="rg3-p-g" class="ih-bagan"></div>`, kakiHtml: sumberBerkas(D.surya) }),
    ex({ id: "rg3-p-daftar", ikon: "gedung", topik: t("rg3.p.ey.daftar"), judulHtml: esc(t("rg3.p.j.daftar")), subHtml: esc(t("rg3.p.s.daftar")),
      isiHtml: `<div class="jm-saring rg3-saring">${cariHtml({ id: "rg3-p-q", label: t("rg3.p.f.q"), placeholder: t("rg3.p.f.q") })}${pilihHtml({ id: "rg3-p-tek", ikon: "tek:jaringan", label: t("rg3.p.f.tek"), opsi: O.tek, nilai: saring.tek })}${pilihHtml({ id: "rg3-p-seg", ikon: "jenis", label: t("rg3.p.f.seg"), opsi: O.seg, nilai: saring.seg })}${pilihHtml({ id: "rg3-p-neg", ikon: "globe", label: t("rg3.p.f.neg"), opsi: O.neg, nilai: saring.neg })}${hapusHtml({ id: "rg3-p-hapus", label: t("rg3.p.f.hapus") })}${hitungHtml({ id: "rg3-p-hit", teks: "" })}</div><div id="rg3-p-kartu"></div>` }),
  ].join("");
  document.getElementById("rg3-p-q").value = saring.q;
  pasangPilih();
  grafik(); kartuIsi();
  const ubah = (kunci) => (e) => { saring[kunci] = e.target.value; hal = 1; segar(); };
  el.querySelector("#rg3-p-q").addEventListener("input", debounce((e) => { saring.q = e.target.value.trim(); hal = 1; segar(); }, 150));
  for (const [id, k] of [["rg3-p-tek", "tek"], ["rg3-p-seg", "seg"], ["rg3-p-neg", "neg"]]) el.querySelector("#" + id).addEventListener("change", ubah(k));
  el.querySelector("#rg3-p-hapus").addEventListener("click", () => {
    saring = { q: "", tek: "", seg: "", neg: "" }; hal = 1; el.querySelector("#rg3-p-q").value = "";
    for (const id of ["rg3-p-tek", "rg3-p-seg", "rg3-p-neg"]) { const s = el.querySelector("#" + id); s.value = ""; s.dispatchEvent(new Event("jm:segar")); }
    segar();
  });
  el.querySelector("#rg3-p-kartu").addEventListener("click", (e) => { const h = e.target.closest("[data-hal]"); if (!h || h.disabled) return; hal = +h.dataset.hal; sorotHalaman(h, hal); simpanUrl(); nanti(kartuIsi); });
}
