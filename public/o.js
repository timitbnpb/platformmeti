/* /o/<id>: profil publik organisasi dari /data/organisasi.json (lapis publik) + proyek, program, regulasi, berita, orang. */
import { mulaiHalaman } from "/inti/kepala.js";
import { hantuHtml } from "/inti/umum.js";
import { t, angka, esc, ikon, muat, norm, urlAman, hlHtml, pilTek, idJalur, provHtml, lambang, inisial, barisProyek, kapTeks, kepalaHtml, metaItem, statHtml, seksi, tabel, td, tabelProyek, tabelBerita, tabelRegulasi, tabelSumber, petaTitik, galatHtml, pasangLogoCadangan, ringkasTgl } from "/profil.js";

const akar = document.getElementById("profil");
const MAKS_REL = 60;

const avatar = (o) => (o.logo ? `<img class="pf-logo" src="${esc(o.logo)}" data-ini="${esc(inisial(o.nama))}" alt="" width="88" height="88" decoding="async">` : `<span class="pf-av">${esc(inisial(o.nama))}</span>`);
const orgLink = (o) => `<a class="pf-nm" href="/o/${esc(o.id)}">${esc(o.nama)}</a>`;

function relasi(o, semua) {
  const urutId = new Map(semua.map((x) => [x.id, x])), namaKe = new Map(semua.map((x) => [norm(x.nama), x]));
  const baris = [], lihat = new Set();
  const tambah = (peran, x, teks) => { const k = peran + (x?.id || teks); if (lihat.has(k)) return; lihat.add(k); baris.push({ peran, x, teks: x ? x.nama : teks }); };
  if (o.induk) tambah("induk", namaKe.get(norm(o.induk)), o.induk);
  for (const k of o.keanggotaan || []) { const x = urutId.get(k.organisasi_id); if (x) tambah("induk", x); }
  const nm = norm(o.nama);
  for (const x of semua) {
    if (x.id === o.id) continue;
    if ((x.keanggotaan || []).some((k) => k.organisasi_id === o.id) || (x.induk && norm(x.induk) === nm)) tambah("anak", x);
  }
  for (const a of o.anggota || []) { const x = urutId.get(a.organisasi_id); if (x) tambah("anggota", x); }
  return baris;
}

function tabelRelasi(baris) {
  if (!baris.length) return "";
  const tampil = baris.slice(0, MAKS_REL * 2);
  const html = tabel([["pf.c.peran"], ["pf.c.organisasi"], ["pf.c.kategori"]], tampil.map((r) => `<tr>${td("pf.c.peran", `<span class="jm-pil">${esc(t("pf.peran." + r.peran))}</span>`)}${td("pf.c.organisasi", r.x ? orgLink(r.x) : esc(r.teks))}${td("pf.c.kategori", esc(r.x?.kategori?.label || "-"))}</tr>`).join(""), "pf-tabel-rel");
  return html + (baris.length > tampil.length ? `<p class="jm-bantu">${esc(t("pf.lagi", { n: angka(baris.length - tampil.length) }))}</p>` : "");
}

function tabelProgram(prog, rows) {
  const ag = new Map();
  for (const r of rows) for (const g of r.program) { const a = ag.get(g) || { n: 0, kap: 0 }; a.n++; a.kap += r.kap ?? 0; ag.set(g, a); }
  const daftar = prog.filter((g) => ag.has(g.id));
  if (!daftar.length) return { html: "", n: 0 };
  return { n: daftar.length, html: tabel([["pf.c.program"], ["pf.c.proyek", "jm-num"], ["pf.c.kap", "jm-num"]], daftar.map((g) => `<tr>${td("pf.c.program", `<span class="jm-id"><b><a class="pf-nm" href="/proyek#program-${esc(g.id)}">${esc(g.nama)}</a></b><small>${esc(g.ringkas || "")}</small></span>`)}${td("pf.c.proyek", `<span data-urut="${ag.get(g.id).n}">${esc(angka(ag.get(g.id).n))}</span>`, "jm-num")}${td("pf.c.kap", `<span data-urut="${ag.get(g.id).kap}">${ag.get(g.id).kap ? esc(angka(ag.get(g.id).kap) + " MW") : "-"}</span>`, "jm-num")}</tr>`).join(""), "pf-tabel-prog") };
}

function tabelPengurus(daftar) {
  if (!daftar.length) return "";
  return tabel([["pf.c.nama"], ["pf.c.jabatan"]], daftar.map((p) => `<tr>${td("pf.c.nama", `<b>${esc(p.nama)}</b>`)}${td("pf.c.jabatan", esc(p.jabatan || "-"))}</tr>`).join(""), "pf-tabel-pengurus");
}

async function mulai() {
  akar.innerHTML = hantuHtml(6);
  const id = idJalur();
  let org, proyek, prog, reg, ber, orang, mitra;
  try {
    [org, proyek, prog, reg, ber, orang, mitra] = await Promise.all(["organisasi", "proyek", "program", "regulasi", "berita", "orang", "mitra-meti"].map(muat));
  } catch { akar.innerHTML = galatHtml("pf.galat"); return; }
  const o = org.baris.find((x) => x.id === id);
  if (!o) { akar.innerHTML = galatHtml("pf.o.tak"); return; }
  document.title = `${o.nama} | ${t("pf.situs")}`;

  const idProyek = new Set(o.proyek_ids || []);
  for (const p of proyek.baris) if (Object.values(p.pihak || {}).flat().some((x) => x.organisasi_id === id)) idProyek.add(p.id);
  const rows = proyek.baris.filter((p) => idProyek.has(p.id)).map(barisProyek).sort((a, b) => (b.kap ?? -1) - (a.kap ?? -1) || a.nama.localeCompare(b.nama));
  const nProv = new Set(rows.map((r) => r.prov).filter(Boolean)).size;
  const kapMw = rows.filter((r) => r.kap !== null && /^MWp?$/i.test(r.sat)).reduce((s, r) => s + r.kap, 0);

  const ids = new Set(rows.flatMap((r) => r.p.regulasi_ids || []));
  const regs = reg.baris.filter((x) => ids.has(x.id) || (x.instansi_penerbit && norm(x.instansi_penerbit) === norm(o.nama)));
  const beritas = ber.baris.filter((x) => (x.organisasi_ids || []).includes(id) || (o.berita_ids || []).includes(x.id));
  const p0 = new Map();
  for (const p of o.pengurus || []) p0.set(p.orang_id || p.nama, { nama: p.nama, jabatan: p.jabatan });
  for (const p of orang.baris) if (p.organisasi_id === id && !p0.has(p.id)) p0.set(p.id, { nama: [p.gelar, p.nama].filter(Boolean).join(" "), jabatan: p.jabatan_terkini });
  const pengurus = [...p0.values()];
  const rel = relasi(o, org.baris), progT = tabelProgram(prog.baris, rows);
  const anggotaMeti = o.meti || new Set((org.baris.find((x) => x.id === "l_41bf1f0b41")?.anggota || []).map((a) => a.organisasi_id)).has(id) || (mitra.anggota || []).some((a) => norm(o.nama).includes(norm(a.nama)));

  const L = o.lokasi || {}, tempat = [L.kota, L.provinsi].filter((v, i, a) => v && a.indexOf(v) === i).join(", ");
  const url = urlAman(o.situs);
  const meta = (tempat ? metaItem("peta", `${L.provinsi ? lambang(L.provinsi, 18) : ""}${esc(tempat)}`) : "")
    + (url ? metaItem("tautan", `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""))}</a>`) : "")
    + (o.induk ? metaItem("direktori", esc(o.induk)) : "");
  const pil = `<span class="jm-pil">${esc(o.kategori?.label || "-")}</span>${anggotaMeti ? `<span class="jm-pil jm-pil-ok pf-meti">${ikon("centang", 14)}${esc(t("pf.meti"))}</span>` : ""}`;

  const dibangun = proyek.dibangun_pada || org.dibangun_pada;
  const sumberRingkas = esc(t("pf.sumber_data", { tanggal: ringkasTgl(o.diperiksa || org.dibangun_pada) }));
  const stat = [
    rows.length && { ik: "proyek", nilai: angka(rows.length), label: t("pf.s.proyek") },
    kapMw && { ik: "analisis", nilai: `${angka(kapMw)} MW`, label: t("pf.s.kap"), est: true },
    nProv && { ik: "wilayah", nilai: angka(nProv), label: t("pf.s.prov") },
    progT.n && { ik: "regulasi", nilai: angka(progT.n), label: t("pf.s.program") },
    regs.length && { ik: "regulasi", nilai: angka(regs.length), label: t("pf.s.regulasi") },
    beritas.length && { ik: "berita", nilai: angka(beritas.length), label: t("pf.s.berita") },
    pengurus.length && { ik: "orang", nilai: angka(pengurus.length), label: t("pf.s.pengurus") },
  ].filter(Boolean);
  const kep = (o.kepakaran || []).length ? `<p class="pf-kep">${o.kepakaran.map(pilTek).join(" ")}</p>` : "";
  const ringkasan = seksi({ id: "ringkasan", ik: "info", topik: t("pf.ey.ringkasan"), judulHtml: rows.length ? hlHtml("pf.j.o_proyek", angka(rows.length), { nama: o.nama }) : esc(t("pf.j.o_profil", { nama: o.nama })), subHtml: esc(t("pf.sub.ringkasan")), isiHtml: (stat.length ? statHtml(stat) : "") + kep, sumber: sumberRingkas });

  const proyekSek = rows.length ? seksi({ id: "proyek", ik: "proyek", topik: t("pf.ey.proyek"), judulHtml: hlHtml("pf.j.proyek", angka(rows.length), { n: angka(nProv) }),
    isiHtml: (rows.some((r) => r.ada) ? `<div class="pf-peta" id="pfPeta" role="img" aria-label="${esc(t("pf.peta"))}"></div><p class="jm-bantu pf-peta-ket">${esc(t("pj.presisi.ket", { pasti: angka(rows.filter((r) => r.presisi === "titik_persis").length), kira: angka(rows.filter((r) => r.ada && r.presisi !== "titik_persis").length), tanpa: angka(rows.filter((r) => !r.ada).length) }))}</p>` : "") + tabelProyek(rows), csv: true, sumber: sumberRingkas }) : "";

  akar.innerHTML = kepalaHtml({ avatar: avatar(o), nama: o.nama, pil, meta, balik: ["/", t("pf.ke_beranda")] })
    + `<div class="pf-bagian">${ringkasan}${proyekSek}`
    + seksi({ id: "program", ik: "regulasi", topik: t("pf.ey.program"), judulHtml: hlHtml("pf.j.program", angka(progT.n)), isiHtml: progT.html, csv: true, sumber: sumberRingkas })
    + seksi({ id: "regulasi", ik: "regulasi", topik: t("pf.ey.regulasi"), judulHtml: hlHtml("pf.j.regulasi", angka(regs.length)), isiHtml: tabelRegulasi(regs), csv: true, sumber: esc(t("pf.sumber_data", { tanggal: ringkasTgl(reg.dibangun_pada) })) })
    + seksi({ id: "berita", ik: "berita", topik: t("pf.ey.berita"), judulHtml: hlHtml("pf.j.berita", angka(beritas.length)), isiHtml: tabelBerita(beritas), csv: true, sumber: esc(t("pf.sumber_data", { tanggal: ringkasTgl(ber.dibangun_pada) })) })
    + seksi({ id: "pengurus", ik: "orang", topik: t("pf.ey.pengurus"), judulHtml: hlHtml("pf.j.pengurus", angka(pengurus.length)), isiHtml: tabelPengurus(pengurus), csv: true, sumber: esc(t("pf.sumber_data", { tanggal: ringkasTgl(orang.dibangun_pada) })) })
    + seksi({ id: "relasi", ik: "direktori", topik: t("pf.ey.relasi"), judulHtml: esc(t("pf.j.relasi")), isiHtml: tabelRelasi(rel), csv: true, sumber: sumberRingkas })
    + seksi({ id: "sumber", ik: "tautan", topik: t("pf.ey.sumber"), judulHtml: esc(t("pf.j.sumber")), isiHtml: tabelSumber(o.sumber), csv: true, sumber: sumberRingkas })
    + `</div>`;
  pasangLogoCadangan(akar);
  petaTitik(document.getElementById("pfPeta"), rows);
}
mulaiHalaman().then(mulai);
