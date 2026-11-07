/* /o/<id>: profil publik organisasi dari /data/organisasi.json (lapis publik) + proyek, program, regulasi, berita, orang. */
import { mulaiHalaman } from "/inti/kepala.js";
import { tombolKoreksi } from "/inti/koreksi.js";
import { tombolIkuti, pasangIkuti } from "/inti/ikuti.js";
import { muatPembaruan } from "/inti/pembaruan.js";
import { hantuHtml } from "/inti/umum.js";
import { khUbinHtml, khGambarHtml, khFaktaHtml } from "/inti/kh.js";
import { terkaitHtml } from "/inti/komponen.js";
import { t, angka, esc, ikon, muat, norm, urlAman, hlHtml, pilTek, idJalur, provHtml, lambang, inisial, barisProyek, kapTeks, kepalaHtml, metaItem, statHtml, seksi, tabel, td, tabelProyek, tabelBerita, tabelRegulasi, tabelSumber, kartuProgram, petaTitik, galatHtml, pasangLogoCadangan, ringkasTgl } from "/profil.js";

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
  return { n: daftar.length, html: kartuProgram(daftar.map((g) => ({ g, stat: [t("pf.prog.proyek", { n: angka(ag.get(g.id).n) }), ag.get(g.id).kap ? angka(ag.get(g.id).kap) + " MW" : ""].filter(Boolean).join(", ") }))) };
}

const KEL_PENGURUS = (j) => (/komisaris|commissioner|dewan pengawas|supervisory/i.test(j || "") ? "komisaris" : /\b(direktur|director|direksi|ceo|cfo|coo|cto)\b/i.test(j || "") && !/jenderal|general/i.test(j || "") ? "direksi" : "pimpinan");
const fotoAman = (u) => (typeof u === "string" && /^\/img\/(orang|pengurus)\/[\w.-]+\.webp$/.test(u) ? u : "");
function kartuOrang(p) {
  const f = fotoAman(p.foto), url = urlAman(p.sumber_url), ini = esc(inisial(p.nama.replace(/^((dr|ir|prof|drs|h|hj)\.?\s+)+/i, "")));
  const wajah = `<span class="pf-orang-f">${f ? `<img src="${esc(f)}" alt="" width="64" height="64" loading="lazy" decoding="async" data-ini="${ini}">` : ini}</span>`;
  const nama = url ? `<a class="pf-orang-n" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(p.nama)}</a>` : `<b class="pf-orang-n">${esc(p.nama)}</b>`;
  return `<li class="pf-orang-k">${wajah}<span class="pf-orang-t">${nama}<span class="pf-orang-j">${esc(p.jabatan || "-")}</span><span class="jm-pil pf-orang-g">${esc(t("pf.kel." + KEL_PENGURUS(p.jabatan)))}</span></span></li>`;
}
function tabelPengurus(daftar) {
  if (!daftar.length) return "";
  const urut = ["direksi", "komisaris", "pimpinan"], u = daftar.map((p, i) => ({ p, i, k: urut.indexOf(KEL_PENGURUS(p.jabatan)) })).sort((a, b) => a.k - b.k || a.i - b.i);
  return `<ul class="pf-orang">${u.map((x) => kartuOrang(x.p)).join("")}</ul>`;
}

async function mulai() {
  akar.innerHTML = hantuHtml(6);
  const id = idJalur();
  let org, proyek, prog, reg, ber, orang, mitra, foto;
  try {
    [org, proyek, prog, reg, ber, orang, mitra, foto] = await Promise.all(["organisasi", "proyek", "program", "regulasi", "berita", "orang", "mitra-meti"].map(muat).concat(muat("berita_foto").catch(() => ({}))));
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
  for (const p of o.pengurus || []) p0.set(p.orang_id || p.nama, { nama: p.nama, jabatan: p.jabatan, foto: p.foto, sumber_url: p.sumber_url });
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

  const terkait = await terkaitHtml("org", id);
  const sisi = stat.length ? khUbinHtml(stat.slice(0, 3).map((x) => ({ ikon: x.ik, nilai: x.nilai, label: x.label }))) : o.logo ? khGambarHtml({ logo: o.logo, judul: o.nama }) : khFaktaHtml([{ ikon: "direktori", label: t("kh.jenis"), nilai: o.kategori?.label }, { ikon: "peta", label: t("kh.lokasi"), nilai: tempat }]);
  akar.innerHTML = kepalaHtml({ avatar: avatar(o), nama: o.nama, pil, meta, balik: ["/", t("pf.ke_beranda")], sisi })
    + `<div class="pf-bagian">${ringkasan}${proyekSek}`
    + seksi({ id: "program", ik: "regulasi", topik: t("pf.ey.program"), judulHtml: hlHtml("pf.j.program", angka(progT.n)), isiHtml: progT.html, csv: false, sumber: sumberRingkas })
    + seksi({ id: "regulasi", ik: "regulasi", topik: t("pf.ey.regulasi"), judulHtml: hlHtml("pf.j.regulasi", angka(regs.length)), isiHtml: tabelRegulasi(regs), csv: true, sumber: esc(t("pf.sumber_data", { tanggal: ringkasTgl(reg.dibangun_pada) })) })
    + seksi({ id: "berita", ik: "berita", topik: t("pf.ey.berita"), judulHtml: hlHtml("pf.j.berita", angka(beritas.length)), isiHtml: tabelBerita(beritas, foto), csv: false, sumber: esc(t("pf.sumber_data", { tanggal: ringkasTgl(ber.dibangun_pada) })) })
    + seksi({ id: "pengurus", ik: "orang", topik: t("pf.ey.pengurus"), judulHtml: hlHtml("pf.j.pengurus", angka(pengurus.length)), isiHtml: tabelPengurus(pengurus), csv: false, sumber: esc(t("pf.sumber_data", { tanggal: ringkasTgl(orang.dibangun_pada) })) })
    + seksi({ id: "relasi", ik: "direktori", topik: t("pf.ey.relasi"), judulHtml: esc(t("pf.j.relasi")), isiHtml: tabelRelasi(rel), csv: true, sumber: sumberRingkas })
    + terkait
    + seksi({ id: "sumber", ik: "tautan", topik: t("pf.ey.sumber"), judulHtml: esc(t("pf.j.sumber")), isiHtml: tabelSumber(o.sumber, new Map(ber.baris.map((b) => [b.url, b.judul]))), csv: true, sumber: sumberRingkas })
    + `</div>`;
  akar.querySelector(".pf-kepala-teks")?.insertAdjacentHTML("beforeend", `<p class="pf-koreksi">${tombolKoreksi({ entitas: "organisasi", id, nama: o.nama })} ${tombolIkuti({ jenis: "organisasi", id, nama: o.nama })}</p>`);
  pasangIkuti(akar); muatPembaruan("organisasi", id, akar.querySelector(".pf-bagian"));
  pasangLogoCadangan(akar);
  akar.querySelectorAll(".pf-orang-f img").forEach((im) => im.addEventListener("error", () => im.replaceWith(document.createTextNode(im.dataset.ini || "")), { once: true }));
  petaTitik(document.getElementById("pfPeta"), rows);
}
mulaiHalaman().then(mulai);
