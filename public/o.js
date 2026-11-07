/* /o/<id>: profil publik organisasi dari /data/organisasi.json (lapis publik) + proyek, program, regulasi, berita, orang. */
import { mulaiHalaman } from "/inti/kepala.js";
import { tombolKoreksi } from "/inti/koreksi.js";
import { tombolIkuti, pasangIkuti } from "/inti/ikuti.js";
import { muatPembaruan } from "/inti/pembaruan.js";
import { hantuHtml } from "/inti/umum.js";
import { terkaitHtml } from "/inti/komponen.js";
import { muatSensus } from "/inti/org_sensus.js";
import { ringkasHtml, pasangRingkas } from "/o_ringkas.js";
import { gabungProyek, saringTerkait, bagProyek, bagBerita, bagPengurus, bagRelasi, navLoncat } from "/o_bagian.js";
import { t, angka, esc, muat, norm, hlHtml, idJalur, barisProyek, seksi, tabelRegulasi, kartuProgram, petaTitik, galatHtml, pasangLogoCadangan, ringkasTgl } from "/profil.js";

const akar = document.getElementById("profil");


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

function tabelProgram(prog, rows) {
  const ag = new Map();
  for (const r of rows) for (const g of r.program) { const a = ag.get(g) || { n: 0, kap: 0 }; a.n++; a.kap += r.kap ?? 0; ag.set(g, a); }
  const daftar = prog.filter((g) => ag.has(g.id));
  return { n: daftar.length, html: kartuProgram(daftar.map((g) => ({ g, stat: [t("pf.prog.proyek", { n: angka(ag.get(g.id).n) }), ag.get(g.id).kap ? angka(ag.get(g.id).kap) + " MW" : ""].filter(Boolean).join(", ") }))) };
}

async function mulai() {
  akar.innerHTML = hantuHtml(6);
  const id = idJalur();
  let org, proyek, prog, reg, berT, orang, mitra, foto;
  try {
    [org, proyek, prog, reg, berT, orang, mitra, foto] = await Promise.all(["organisasi", "proyek", "program", "regulasi", "berita", "orang", "mitra-meti"].map(muat).concat(muat("berita_foto").catch(() => ({}))));
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
  const beritas = berT.baris.filter((x) => (x.organisasi_ids || []).includes(id) || (o.berita_ids || []).includes(x.id));
  const p0 = new Map();
  const orangId = new Map(orang.baris.map((p) => [p.id, p]));
  for (const p of o.pengurus || []) { const q = orangId.get(p.orang_id) || {}; p0.set(p.orang_id || p.nama, { nama: p.nama, gelar: q.gelar, jabatan: p.jabatan, jenis: q.jenis, foto: p.foto || q.foto || (q.id ? `/img/orang/${q.id}.webp` : ""), sumber_url: p.sumber_url }); }
  for (const p of orang.baris) if (p.organisasi_id === id && !p0.has(p.id)) p0.set(p.id, { nama: p.nama, gelar: p.gelar, jabatan: p.jabatan_terkini, jenis: p.jenis, foto: p.foto || `/img/orang/${p.id}.webp`, sumber_url: "" });
  const pengurus = [...p0.values()];
  const rel = relasi(o, org.baris), progT = tabelProgram(prog.baris, rows);
  const anggotaMeti = o.meti || new Set((org.baris.find((x) => x.id === "l_41bf1f0b41")?.anggota || []).map((a) => a.organisasi_id)).has(id) || (mitra.anggota || []).some((a) => norm(o.nama).includes(norm(a.nama)));

  const S = await muatSensus();
  const sumberRingkas = esc(t("pf.sumber_data", { tanggal: ringkasTgl(o.diperiksa || org.dibangun_pada) }));
  const tampilProyek = gabungProyek(rows);
  const pro = bagProyek({ rows: tampilProyek, semua: rows.length, nProv, sumber: sumberRingkas });
  const ber = bagBerita({ daftar: beritas, foto: foto || {}, sumber: esc(t("pf.sumber_data", { tanggal: ringkasTgl(berT.dibangun_pada) })) });
  const pen = bagPengurus({ daftar: pengurus, sumber: esc(t("pf.sumber_data", { tanggal: ringkasTgl(orang.dibangun_pada) })) });
  const rl = bagRelasi({ o, rel, sumber: sumberRingkas, S });

  const terkait = await terkaitHtml("org", id, { kecuali: ["proyek", "berita", "regulasi", "orang", "program"] });
  akar.innerHTML = `<div class="oj">${ringkasHtml({ ...o, meti: anggotaMeti }, S, { tombolIkuti, tombolKoreksi })}</div>`
    + `<div class="pf-bagian oj-bag">${pro.html}`
    + seksi({ id: "program", ik: "analisis", topik: t("pf.ey.program"), judulHtml: hlHtml("pf.j.program", angka(progT.n)), isiHtml: progT.html, csv: false, sumber: sumberRingkas })
    + seksi({ id: "regulasi", ik: "regulasi", topik: t("pf.ey.regulasi"), judulHtml: hlHtml("pf.j.regulasi", angka(regs.length)), isiHtml: tabelRegulasi(regs), csv: true, sumber: esc(t("pf.sumber_data", { tanggal: ringkasTgl(reg.dibangun_pada) })) })
    + ber.html + pen.html + rl.html + terkait
    + `</div>`;
  pasangRingkas(akar, o);
  pro.pasang(akar); ber.pasang(akar); pen.pasang(akar); rl.pasang(akar);
  pasangIkuti(akar); muatPembaruan("organisasi", id, akar.querySelector(".pf-bagian"));
  pasangLogoCadangan(akar);
  petaTitik(document.getElementById("pfPeta"), tampilProyek, {});
  saringTerkait(akar, new Set(rel.map((r) => r.x?.id).filter(Boolean)));
  navLoncat(akar);
}
mulaiHalaman().then(mulai);
