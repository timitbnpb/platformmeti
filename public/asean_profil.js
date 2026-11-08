/* /asean: profil negara dalam dialog besar di tengah (?negara=ISO3 bisa dibagikan).
   Kepala + peringkat tampil seketika (urgent); ubin, grafik tren, dan data global (IRENA, target, skema, lelang, pemasok) menyusul lewat nanti(). */
import { esc, nanti, ikon, hantuHtml } from "/inti/umum.js";
import { t, ada, tanggal } from "/i18n.js";
import { buktiHtml } from "/inti/bukti.js";
import { logoOrg } from "/inti/logo_org.js";
import { muatData, batangHtml, pasangBar, num, amanUrl } from "/analisis.js";

const cache = {};
const muat = (f) => (cache[f] ||= muatData("global/" + f).catch(() => null));
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const lbl = (awalan, k) => (ada(awalan + k) ? t(awalan + k) : String(k).replace(/[-_]/g, " "));
const tanda = (v, d = 1) => (v > 0 ? "+" : "") + num(v, d);
const KATA = { air: 0, surya: 1, bayu_darat: 2, bayu_lepas_pantai: 3 };

export function pasangProfil({ data, M, iso2, namaN, sumber }) {
  const dlg = document.createElement("dialog");
  dlg.className = "jm-asp"; dlg.setAttribute("aria-labelledby", "aspJudul");
  document.body.append(dlg);
  let pemicu = null, aktif = "";
  const baris = (i) => data().baris.find((n) => n.iso3 === i);
  const nilai = (n, m) => n[M[m].nilai]?.nilai ?? null;
  const urut = (m) => data().baris.filter((n) => nilai(n, m) !== null).sort((a, b) => nilai(b, m) - nilai(a, m));
  const peringkat = (n, m) => urut(m).findIndex((x) => x.iso3 === n.iso3) + 1;
  const bendera = (n, u) => `<img class="jm-bd jm-asp-fl" src="/img/bendera/${iso2[n.iso3]}.svg" width="${u}" height="${Math.round(u * 0.75)}" alt="">`;
  const setUrl = (i) => { const u = new URL(location.href); if (i) u.searchParams.set("negara", i); else u.searchParams.delete("negara"); history.replaceState(null, "", u); };
  const cariPemicu = (i) => (pemicu?.isConnected ? pemicu : document.querySelector(`#grafik-band button[data-id="${i}"], #tabel-tren button[data-iso="${i}"]`));

  /* ---------- bagian bersama ---------- */
  const bag = (ik, judul, isi, kelas = "") => (isi ? `<section class="jm-asp-bag ${kelas}"><h3>${ikon(ik, 18)}<span>${esc(judul)}</span></h3>${isi}</section>` : "");
  const sumberLink = (u) => { const a = amanUrl(u); return a ? `<a class="jm-asp-src" href="${esc(a)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 14)}<span>${esc(host(a))}</span></a>` : ""; };
  const butir = (it) => `<li class="jm-asp-butir"><div class="jm-asp-bt"><b>${esc(it.uraian)}</b>${it.nilai ? `<span class="jm-asp-nilai">${esc(it.nilai)}${it.satuan ? " " + esc(it.satuan) : ""}${it.tahun ? ` (${esc(it.tahun)})` : ""}</span>` : ""}${it.catatan ? `<small class="jm-bantu">${esc(it.catatan)}</small>` : ""}</div><div class="jm-asp-sb">${buktiHtml(it.tingkat_bukti, { sumber: host(it.sumber_url), tanggal: it.tanggal })}${sumberLink(it.sumber_url)}</div></li>`;
  const daftar = (arr) => (arr?.length ? `<ul class="jm-asp-daftar">${arr.map(butir).join("")}</ul>` : "");
  const legenda = (arr) => `<p class="jm-asp-lgd">${arr.map(([kelas, teks]) => `<span><i class="jm-asp-sw ${kelas}"></i>${esc(teks)}</span>`).join("")}</p>`;

  /* ---------- kepala (urgent) ---------- */
  const kepala = (n) => `<header class="jm-asp-kepala"><button type="button" class="jm-asp-x" data-tutup aria-label="${esc(t("jm.tutup"))}" title="${esc(t("jm.tutup"))}">${ikon("tutup", 20)}</button>
    <div class="jm-asp-id">${bendera(n, 64)}<div><p class="jm-asp-ey">${ikon("asean", 16)}<span>${esc(t("asp.eyebrow"))}</span></p><h2 id="aspJudul">${esc(namaN(n))}</h2></div></div>
    <ul class="jm-asp-rank">${["bauran", "kapasitas", "akses"].filter((m) => nilai(n, m) !== null).map((m) => `<li><span>${esc(t("as.m." + m))}</span><b>${esc(t("as.peringkat", { r: peringkat(n, m), n: urut(m).length }))}</b></li>`).join("")}</ul></header>`;

  /* ---------- kartu metrik: ubin angka + tren kecil ---------- */
  const IK = { bauran: "tek-listrik", kapasitas: "tek-surya", akses: "status" };
  function tren(n, m) {
    const s = n[M[m].tren], idn = baris("IDN"), ref = m !== "kapasitas" && n.iso3 !== "IDN" ? idn[M[m].tren] : null;
    if (s.length < 2) return "";
    const semua = [...s, ...(ref || [])], t0 = Math.min(...semua.map((p) => p.tahun)), t1 = Math.max(...semua.map((p) => p.tahun));
    const W = 420, H = 200, L = 58, R = 14, T = 12, B = 28, ym = Math.max(...semua.map((p) => p.nilai)) * 1.1 || 1;
    const x = (a) => L + ((a - t0) / (t1 - t0 || 1)) * (W - L - R), y = (v) => T + (1 - v / ym) * (H - T - B);
    const grid = [0, 1, 2, 3, 4].map((i) => { const v = (ym * i) / 4; return `<line class="jm-an-grid" x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="jm-an-lbl" x="${L - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${esc(num(v, M[m].d))}</text>`; }).join("");
    const sb = [t0, Math.round((t0 + t1) / 2), t1].map((a) => `<text class="jm-an-lbl" x="${x(a).toFixed(1)}" y="${H - 8}" text-anchor="middle">${a}</text>`).join("");
    const seri = (arr, nama, kelas) => `<polyline class="${kelas}" points="${arr.map((p) => x(p.tahun).toFixed(1) + "," + y(p.nilai).toFixed(1)).join(" ")}"/>${arr.map((p) => `<circle class="${kelas}-t" cx="${x(p.tahun).toFixed(1)}" cy="${y(p.nilai).toFixed(1)}" r="5"><title>${esc(nama)}, ${p.tahun}: ${esc(num(p.nilai, M[m].d))} ${esc(M[m].satuan)}</title></circle>`).join("")}`;
    return `${ref ? legenda([["jm-asp-sw-n", namaN(n)], ["jm-asp-sw-id", namaN(idn)]]) : ""}<svg class="jm-an-garis jm-gx jm-asp-gr" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("as.tren_label", { metrik: t("as.m." + m) }) + ": " + namaN(n))}" focusable="false">${grid}${sb}${ref ? seri(ref, namaN(idn), "jm-asp-ref") : ""}${seri(s, namaN(n), "jm-asp-gar")}</svg>`;
  }
  function kartu(n, m) {
    const v = nilai(n, m); if (v === null) return "";
    const a = n[M[m].nilai], s = n[M[m].tren], idn = baris("IDN"), sat = M[m].satuan, meta = [`<li>${esc(t("as.tahun", { tahun: a.tahun }))}</li>`];
    if (s.length > 1) {
      const p = s[0], q = s[s.length - 1], d = m === "kapasitas" ? (p.nilai ? ((q.nilai - p.nilai) / p.nilai) * 100 : null) : q.nilai - p.nilai;
      if (d !== null) meta.push(`<li class="${d >= 0 ? "jm-asp-naik" : "jm-asp-turun"}">${esc(t(m === "kapasitas" ? "asp.ubah_pct" : "asp.ubah_pp", { v: tanda(d, m === "kapasitas" ? 0 : 1), tahun: p.tahun }))}</li>`);
    }
    if (n.iso3 === "IDN") meta.push(`<li>${esc(t("asp.acuan"))}</li>`);
    else if (nilai(idn, m) !== null) {
      const vi = nilai(idn, m), teks = m === "kapasitas" ? t("asp.vs_kali", { v: num(v / vi, v / vi < 1 ? 2 : 1) }) : t(v >= vi ? "asp.vs_atas" : "asp.vs_bawah", { v: num(Math.abs(v - vi), 1) });
      meta.push(`<li class="${v >= vi ? "jm-asp-naik" : "jm-asp-turun"}">${esc(teks)}</li>`);
    }
    return `<article class="jm-asp-kartu"><header><span class="jm-kpi-ik">${ikon(IK[m], 18)}</span><h3>${esc(t("as.m." + m))}</h3></header>
      <p class="jm-an-angka"><b>${esc(num(v, M[m].d))}</b><span>${esc(sat)}</span></p><ul class="jm-asp-meta">${meta.join("")}</ul>${tren(n, m)}${sumber(m)}</article>`;
  }

  /* ---------- data global (async, tiap bagian disembunyikan bila kosong) ---------- */
  function kapasitas(b, S) {
    const baru = Object.entries(b.kapasitas_mw).filter(([k]) => !k.startsWith("total_")).map(([k, deret]) => { const th = Object.keys(deret).map(Number).sort((p, q) => p - q), tt = th.at(-1); return { k, v: deret[tt], tt }; }).filter((r) => r.v > 0).sort((p, q) => q.v - p.v);
    if (!baru.length) return "";
    const rows = baru.map((r, i) => ({ label: lbl("asp.tek.", r.k), labelHtml: `<i class="jm-asp-sw jm-an-c${1 + (KATA[r.k] ?? i) % 4}"></i><span>${esc(lbl("asp.tek.", r.k))}</span>`, bagian: [{ nilai: r.v, kelas: "jm-an-c" + (1 + (KATA[r.k] ?? i) % 4) }], teks: `${num(r.v, 0)} MW (${r.tt})` }));
    const s = S.get(b.sumber_kapasitas_id);
    return bag("tek-surya", t("asp.s.kap"), `<div class="jm-asp-bukti">${buktiHtml(b.tingkat_bukti_kapasitas, { sumber: s?.penerbit || "IRENA", tanggal: s?.tanggal })}${sumberLink(s?.url)}</div>${batangHtml(rows, { label: t("asp.s.kap"), satuan: "MW" })}`);
  }
  function investasi(b, S) {
    const iv = b.investasi_publik_usd_juta_2023, th = iv ? Object.keys(iv.per_tahun).filter((k) => iv.per_tahun[k].ebt || iv.per_tahun[k].non_ebt).sort().slice(-8) : [];
    if (!th.length) return "";
    const rows = th.map((k) => { const r = iv.per_tahun[k]; return { label: k, bagian: [{ nilai: r.ebt || 0, kelas: "jm-an-c1" }, { nilai: r.non_ebt || 0, kelas: "jm-an-c2" }], teks: t("asp.invest.teks", { a: num(r.ebt || 0, 0), b: num(r.non_ebt || 0, 0) }) }; });
    const s = S.get(iv.sumber_id);
    return bag("analisis", t("asp.s.invest"), `<div class="jm-asp-bukti">${buktiHtml(iv.tingkat_bukti, { sumber: s?.penerbit || "IRENA", tanggal: s?.tanggal })}${sumberLink(s?.url)}<span class="jm-bantu">${esc(t("asp.invest.sat"))}</span></div>${legenda([["jm-an-c1", t("asp.invest.ebt")], ["jm-an-c2", t("asp.invest.non")]])}${batangHtml(rows, { label: t("asp.s.invest") })}`);
  }
  function lelang(L, iso) {
    const r = (L?.baris || []).filter((x) => x.iso2 === iso);
    if (!r.length) return "";
    const hg = (h, k) => (h ? `<span class="jm-asp-harga"><small>${esc(t("asp.lel." + k))}</small><b>${esc(num(h.nilai, 2))} ${esc(h.satuan)}</b></span>` : "");
    return bag("tabel", t("asp.s.lelang"), `<ul class="jm-asp-daftar">${r.map((x) => {
      const mw = x.kapasitas_dimenangkan_mw ?? x.kapasitas_ditawar_mw;
      return `<li class="jm-asp-butir"><div class="jm-asp-bt"><b>${esc(x.nama_lelang)}</b><span class="jm-asp-nilai">${esc([x.tahun, x.badan, lbl("asp.lt.", x.teknologi), mw ? num(mw, 0) + " MW" : "", lbl("asp.st.", x.status)].filter(Boolean).join(" | "))}</span><span class="jm-asp-hargas">${hg(x.harga_terendah, "min")}${hg(x.harga_rata2, "rata")}${hg(x.harga_tertinggi, "maks")}</span>${x.catatan ? `<small class="jm-bantu">${esc(x.catatan)}</small>` : ""}</div><div class="jm-asp-sb">${buktiHtml(x.tingkat_bukti, { sumber: host(x.sumber_url), tanggal: x.tanggal })}${sumberLink(x.sumber_url)}</div></li>`;
    }).join("")}</ul>`);
  }
  async function pemasok(iso, namaNegara) {
    const [P, S, Ln] = await Promise.all([muat("pelaku_global.json"), muat("pemasok_surya.json"), muat("pemasok_lain.json")]);
    const peta = new Map();
    const tambah = (id, nama, logo, peran) => { if (id && nama && !peta.has(nama.toLowerCase())) peta.set(nama.toLowerCase(), { id, nama, logo, peran }); };
    for (const b of P?.baris || []) if (b.negara_iso2 === iso) tambah(b.org_id, b.nama, b.logo, (b.peran || []).join(", "));
    for (const b of Ln?.baris || []) if (b.negara_iso2 === iso) tambah(b.organisasi_id, b.nama, b.logo, (b.segmen || []).map((s) => lbl("rg3.tek.", s)).join(", "));
    for (const b of S?.baris || []) if (b.negara_iso2 === iso) tambah(b.id, b.nama, b.logo, (b.segmen || []).join(", "));
    const l = [...peta.values()];
    if (!l.length) return "";
    const kartuOrg = (o) => { const u = logoOrg(o.id, o.nama, typeof o.logo === "string" ? o.logo : o.logo?.url || "")[0]; return `<li><a class="jm-asp-org" href="/o/${encodeURIComponent(o.id)}"><span class="jm-asp-logo">${u ? `<img src="${esc(u)}" alt="" loading="lazy" decoding="async" data-galat="hapus">` : ""}<b aria-hidden="true">${esc(o.nama.charAt(0).toUpperCase())}</b></span><span class="jm-asp-on"><b>${esc(o.nama)}</b>${o.peran ? `<small>${esc(o.peran)}</small>` : ""}</span></a></li>`; };
    return bag("gedung", t("asp.s.pemasok", { negara: namaNegara }), `<ul class="jm-asp-orgs">${l.slice(0, 12).map(kartuOrg).join("")}</ul><p class="jm-asp-lagi"><a class="jm-tbl" href="/rantai-global?tab=pemasok&amp;pneg=${esc(iso.toLowerCase())}">${ikon("globe", 16)}<span>${esc(t("asp.org.lihat", { n: l.length }))}</span></a></p>`);
  }
  async function global(n) {
    const kode = iso2[n.iso3].toUpperCase();
    const [NP, L] = await Promise.all([muat("negara_pembanding.json"), muat("lelang_dunia.json")]);
    if (aktif !== n.iso3) return;
    const b = NP?.baris.find((x) => x.iso3 === n.iso3), S = new Map((NP?.sumber || []).map((s) => [s.id, { ...s, penerbit: s.penerbit || s.judul }]));
    const bagian = [];
    if (b) bagian.push(kapasitas(b, S), bag("status", t("asp.s.target"), daftar(b.target)), bag("kalkulator", t("asp.s.skema"), daftar(b.skema)), bag("gedung", t("asp.s.lc"), daftar(b.local_content)), bag("kalkulator", t("asp.s.harga"), daftar(b.harga_ppa_fit)), bag("kalkulator", t("asp.s.biaya"), daftar(b.biaya_rata2)), investasi(b, S));
    bagian.push(lelang(L, kode));
    if (n.iso3 === "MYS" || n.iso3 === "SGP") bagian.push(bag("sambung", t("jr.dari.asean"), `<p class="jm-asp-lagi"><a class="jm-tbl" href="/jaringan?tab=lintas&amp;ln=${iso2[n.iso3]}">${ikon("menara", 16)}<span>${esc(t("jr.l.ey.daftar"))}</span></a></p>`));
    const isi = bagian.filter(Boolean).join("");
    const el = dlg.querySelector("#aspGlobal");
    if (el) { el.innerHTML = isi; el.hidden = !isi; pasangBar(el); }
    if (aktif !== n.iso3) return;
    const org = await pemasok(kode, namaN(n));
    const akhir = dlg.querySelector("#aspOrg");
    if (aktif === n.iso3 && akhir) { akhir.innerHTML = org; akhir.hidden = !org; }
  }

  /* ---------- buka / tutup ---------- */
  function isiTubuh(n) {
    if (aktif !== n.iso3) return;
    const k = ["bauran", "kapasitas", "akses"].map((m) => kartu(n, m)).join("");
    dlg.querySelector("#aspTubuh").innerHTML = `${k ? `<div class="jm-asp-kartu-baris">${k}</div>` : ""}<div id="aspGlobal" hidden></div><div id="aspOrg" hidden></div>`;
    global(n);
  }
  function gambar(n) {
    dlg.innerHTML = `${kepala(n)}<div class="jm-asp-bd" id="aspTubuh">${hantuHtml(3)}</div>`;
    nanti(() => isiTubuh(n));
  }
  function buka(i, el) {
    const n = baris(i); if (!n) return;
    pemicu = el || pemicu; aktif = i;
    gambar(n);
    setUrl(i);
    if (!dlg.open) dlg.showModal();
    dlg.scrollTop = 0;
  }
  dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest("[data-tutup]")) dlg.close(); });
  dlg.addEventListener("close", () => { const i = aktif; aktif = ""; setUrl(""); cariPemicu(i)?.focus(); });
  return {
    buka,
    segar: () => { const n = aktif && baris(aktif); if (n && dlg.open) gambar(n); },
    dariUrl: () => { const i = (new URLSearchParams(location.search).get("negara") || "").toUpperCase(); if (i) buka(i, null); },
  };
}
