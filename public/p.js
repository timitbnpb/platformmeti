/* /p/<id>: profil publik proyek dari /data/proyek.json (lapis publik) + program, organisasi, regulasi, berita. */
import { ikonTek } from "/inti/ikon_tek.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { tombolKoreksi } from "/inti/koreksi.js";
import { tombolIkuti, pasangIkuti } from "/inti/ikuti.js";
import { muatPembaruan } from "/inti/pembaruan.js";
import { khUbinHtml, khFaktaHtml } from "/inti/kh.js";
import { hantuHtml } from "/inti/umum.js";
import { terkaitHtml } from "/inti/komponen.js";
import { tautOrg } from "/inti/tautan.js";
import { t, angka, esc, ikon, muat, urlAman, label, hlHtml, pilTek, pilStatus, idJalur, provHtml, lambang, inisial, barisProyek, kapTeks, kepalaHtml, metaItem, statHtml, seksi, tabel, td, tabelBerita, tabelRegulasi, tabelSumber, kartuProgram, petaTitik, galatHtml, ringkasTgl, tglSel, TAHUN } from "/profil.js";

import { peristiwaProyek, peristiwaProyekHtml } from "/peristiwa_komitmen.js";
import { diperbaruiHtml, pasangRiwayat } from "/inti/riwayat.js";

const akar = document.getElementById("profil");

function pihak(p, orgById) {
  const baris = Object.entries(p.pihak || {}).flatMap(([peran, a]) => (a || []).filter((x) => x.nilai).map((x) => ({ peran, nama: x.nilai, org: x.organisasi_id && orgById.get(x.organisasi_id), catatan: x.catatan })));
  if (!baris.length) return "";
  return tabel([["pf.c.peran"], ["pf.c.organisasi"], ["pf.c.ket"]], baris.map((b) => `<tr>${td("pf.c.peran", `<span class="jm-pil">${esc(label("pf.peran.", b.peran))}</span>`)}${td("pf.c.organisasi", `<b>${tautOrg(b.org ? b.org.id : b.nama, b.org ? b.org.nama : b.nama)}</b>`)}${td("pf.c.ket", esc(b.catatan || "-"))}</tr>`).join(""), "pf-tabel-pihak");
}

/* Linimasa tahap mendatar: Rencana, Konstruksi, COD target, COD aktual. Hanya bila ada peristiwa bertanggal. */
function linimasa(r) {
  const p = r.p, w = p.waktu || {}, cods = (p.cod_target || []).map((c) => c.nilai).filter(Number.isFinite);
  if (!w.persetujuan && !w.penutupan && !cods.length) return "";
  const urutSt = { rencana: 1, konstruksi: 2, beroperasi: 3 }, n = urutSt[r.st] || 0;
  const telat = r.cod !== null && r.cod < TAHUN && r.st !== "beroperasi" ? TAHUN - r.cod : 0;
  const tahap = [
    ["rencana", "rencana", w.persetujuan ? ringkasTgl(w.persetujuan) : "-", t("pf.t.persetujuan"), n >= 1],
    ["konstruksi", "konstruksi", w.penutupan ? ringkasTgl(w.penutupan) : "-", t("pf.t.penutupan"), n >= 2],
    ["cod", "pendanaan", cods.length ? [...new Set(cods)].sort().join(", ") : "-", telat ? t("pf.l.telat", { n: angka(telat) }) : t("pf.t.cod_target"), false],
    ["aktual", "beroperasi", r.st === "beroperasi" ? t("pf.t.beroperasi") : "-", r.st === "beroperasi" ? t("pf.l.aktual_tak") : t("pf.t.cod_aktual"), n >= 3],
  ];
  return `<ol class="pf-tahap">${tahap.map(([k, ik, nilai, ket, selesai], i) => `<li class="${selesai ? "selesai" : ""}${k === "cod" && telat ? " telat" : ""}"><span class="pf-tahap-ik">${ikon(k === "cod" ? "kalender" : k === "aktual" ? "centang" : k === "rencana" ? "daftar" : "proyek", 20)}</span><b>${esc(t("pf.t." + (k === "cod" ? "cod_target" : k === "aktual" ? "cod_aktual" : k)))}</b><span class="pf-tahap-v">${esc(nilai)}</span><small>${esc(ket)}</small></li>`).join("")}</ol>`;
}

async function mulai() {
  akar.innerHTML = hantuHtml(6);
  const id = idJalur();
  let proyek, org, prog, reg, ber, foto;
  try { [proyek, org, prog, reg, ber, foto] = await Promise.all(["proyek", "organisasi", "program", "regulasi", "berita"].map(muat).concat(muat("berita_foto").catch(() => ({})))); } catch { akar.innerHTML = galatHtml("pf.galat"); return; }
  const p = proyek.baris.find((x) => x.id === id);
  if (!p) { akar.innerHTML = galatHtml("pf.p.tak"); return; }
  const r = barisProyek(p);
  document.title = `${r.nama} | ${t("pf.situs")}`;
  const orgById = new Map(org.baris.map((x) => [x.id, x]));
  const programs = prog.baris.filter((g) => r.program.includes(g.id));
  const regs = reg.baris.filter((x) => (p.regulasi_ids || []).includes(x.id) || programs.some((g) => (g.regulasi_ids || []).includes(x.id)));
  const beritas = ber.baris.filter((x) => (p.berita_ids || []).includes(x.id) || (x.proyek_ids || []).includes(id));
  const L = p.lokasi || {}, kab = Array.isArray(L.kabupaten_kota) ? L.kabupaten_kota.map((x) => x.nilai).join(", ") : "";
  const persis = r.presisi === "titik_persis";
  const dibangun = proyek.dibangun_pada;
  const sumber = esc(t("pf.sumber_data", { tanggal: ringkasTgl(dibangun) }));

  const pil = `${pilTek(r.tek)}${pilStatus(r.st)}${p.nama_perlu_tinjau ? `<span class="jm-pil jm-pil-warn">${esc(t("pj.tinjau"))}</span>` : ""}`;
  const meta = (r.kap !== null ? metaItem("analisis", esc(kapTeks(r))) : "") + (r.prov ? metaItem("peta", `${lambang(r.prov, 18)}${esc([kab, r.prov].filter(Boolean).join(", "))}`) : "") + (r.cod !== null ? metaItem("kalender", esc(t("pf.cod_target", { tahun: r.cod }))) : "");
  const stat = [
    r.kap !== null && { ik: "analisis", nilai: kapTeks(r), label: t("pf.s.kap_proyek") },
    r.cod !== null && { ik: "kalender", nilai: String(r.cod), label: t("pj.c.cod") },
    programs.length && { ik: "regulasi", nilai: angka(programs.length), label: t("pf.s.program") },
    regs.length && { ik: "regulasi", nilai: angka(regs.length), label: t("pf.s.regulasi") },
    beritas.length && { ik: "berita", nilai: angka(beritas.length), label: t("pf.s.berita") },
  ].filter(Boolean);
  const ringkasan = seksi({ id: "ringkasan", ik: "info", topik: t("pf.ey.ringkasan"), judulHtml: r.kap !== null ? hlHtml("pf.j.p_kap", kapTeks(r), { nama: r.nama }) : esc(t("pf.j.p_profil", { nama: r.nama })), subHtml: esc(t("pf.sub.ringkasan_p")), isiHtml: stat.length ? statHtml(stat) : "", sumber });
  const lokasi = r.ada || r.prov ? seksi({ id: "lokasi", ik: "peta", topik: t("pf.ey.lokasi"), judulHtml: hlHtml("pf.j.lokasi", r.prov || kab), subHtml: esc(label("pj.presisi.", r.presisi)),
    isiHtml: (r.ada ? `<div class="pf-peta pf-peta-satu" id="pfPeta" role="img" aria-label="${esc(t("pf.peta"))}"></div>` : "") + (!persis ? `<p class="pf-perkiraan">${ikon("info", 16)}<span>${esc(t("pf.perkiraan_ket", { prov: r.prov || "-" }))}</span></p>` : ""), sumber: esc(L.sumber ? `${L.sumber.jenis}, ${L.sumber.lisensi || ""} ${L.sumber.catatan || ""}`.trim() : t("pf.sumber_data", { tanggal: ringkasTgl(dibangun) })) }) : "";
  const pihakHtml = pihak(p, orgById);

  const terkait = await terkaitHtml("proyek", id);
  const peristiwa = await peristiwaProyek(id);
  const sisi = stat.length ? khUbinHtml(stat.slice(0, 3).map((x) => ({ ikon: x.ik, nilai: x.nilai, label: x.label })))
    : khFaktaHtml([{ ikon: "proyek", label: t("kh.jenis"), nilai: label("pj.tek.", r.tek) }, { ikon: "peta", label: t("kh.lokasi"), nilai: [kab, r.prov].filter(Boolean).join(", ") }]);
  akar.innerHTML = kepalaHtml({ avatar: `<span class="pf-av pf-av-tek">${ikonTek(r.tek)}</span>`, nama: r.nama, pil, meta, balik: ["/proyek", t("pf.ke_proyek")], sisi })
    + `<div class="pf-bagian">${ringkasan}${lokasi}`
    + seksi({ id: "pihak", ik: "orang", topik: t("pf.ey.pihak"), judulHtml: esc(t("pf.j.pihak")), isiHtml: pihakHtml, csv: true, sumber })
    + seksi({ id: "program", ik: "regulasi", topik: t("pf.ey.program"), judulHtml: hlHtml("pf.j.program", angka(programs.length)), isiHtml: kartuProgram(programs.map((g) => ({ g }))), csv: false, sumber })
    + seksi({ id: "linimasa", ik: "linimasa", topik: t("pf.ey.linimasa"), judulHtml: esc(t("pf.j.linimasa")), isiHtml: linimasa(r), csv: false, sumber })
    + seksi({ id: "peristiwa", ik: "berita", topik: t("pe.p.ey"), judulHtml: hlHtml("pe.p.judul", angka(peristiwa.length)), isiHtml: peristiwaProyekHtml(peristiwa), csv: false, sumber: esc(t("pe.p.sumber")) })
    + seksi({ id: "regulasi", ik: "regulasi", topik: t("pf.ey.regulasi"), judulHtml: hlHtml("pf.j.regulasi", angka(regs.length)), isiHtml: tabelRegulasi(regs), csv: true, sumber: esc(t("pf.sumber_data", { tanggal: ringkasTgl(reg.dibangun_pada) })) })
    + seksi({ id: "berita", ik: "berita", topik: t("pf.ey.berita"), judulHtml: hlHtml("pf.j.berita", angka(beritas.length)), isiHtml: tabelBerita(beritas, foto), csv: false, sumber: esc(t("pf.sumber_data", { tanggal: ringkasTgl(ber.dibangun_pada) })) })
    + terkait
    + seksi({ id: "sumber", ik: "tautan", topik: t("pf.ey.sumber"), judulHtml: esc(t("pf.j.sumber")), isiHtml: tabelSumber(p.sumber, new Map(ber.baris.map((b) => [b.url, b.judul]))), csv: true, sumber })
    + `</div>`;
  akar.querySelector(".pf-kepala-teks")?.insertAdjacentHTML("beforeend", `<p class="pf-koreksi">${tombolKoreksi({ entitas: "proyek", id, nama: r.nama })} ${tombolIkuti({ jenis: "proyek", id, nama: r.nama })}</p>`);
  akar.querySelector(".pf-kepala-teks")?.insertAdjacentHTML("beforeend", diperbaruiHtml({ jenis: "proyek", id, nama: r.nama, tgl: dibangun }));
  pasangRiwayat(akar);
  pasangIkuti(akar); muatPembaruan("proyek", id, akar.querySelector(".pf-bagian"));
  petaTitik(document.getElementById("pfPeta"), [r], { zoomSatu: persis ? 11 : 6, klik: false });
}
mulaiHalaman().then(mulai);
