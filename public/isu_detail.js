/* /isu#<id>: rincian satu isu: ringkasan, linimasa, pihak dan posisinya, posisi METI (publik saja), regulasi, proyek, wilayah,
   peta pemangku ringkas, berita sumber, daftar sumber, isu terkait. Tautan entitas lewat inti/tautan.js (dua arah dengan panel Terkait). */
import { t } from "/i18n.js";
import { esc, ikon } from "/inti/umum.js";
import { exHtml, sumberHtml } from "/inti/komponen.js";
import { siapTautan, tautOrg, tautRegulasi, tautProyek, tautProvinsi, namaProvinsiKode } from "/inti/tautan.js";
import { petaKoroplet, pasangPeta } from "/peta_koroplet.js";
import { pasangTabel } from "/proyek_besar_umum.js";
import { N, tgl, pilTema, pilStatus, pilBukti, kartuIsu, TEMA } from "/isu_umum.js";
import { tanggal } from "/i18n.js";

const sumberLink = (i, n) => { const s = i.sumber[n]; return s ? `<a class="isu-sl" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" title="${esc(s.judul)}">${ikon("tautan", 14)}<span>${esc(s.penerbit)}</span></a>` : ""; };
const grup = (judulKunci, ik, isi, sub = "") => exHtml({ ikon: ik, topik: t(judulKunci), judulHtml: esc(t(judulKunci)), subHtml: sub, isiHtml: isi, tingkat: "h3" });
const chip = (h) => `<li class="isu-chip">${h}</li>`;

let beritaP;
const muatBerita = () => (beritaP ??= fetch("/data/berita.json").then((r) => r.json()).catch(() => { beritaP = null; return { baris: [] }; }));

export async function tampilDetail(el, D, id) {
  const i = D.baris.find((x) => x.id === id);
  if (!i) { el.innerHTML = `<div class="jm-kosong">${ikon("info", 32)}<p>${esc(t("isu.d.tidakada"))}</p><a class="jm-lihat" href="#nasional">${ikon("panah-kiri", 16)}<span>${esc(t("isu.d.kembali"))}</span></a></div>`; return; }
  await siapTautan("org", "regulasi", "proyek");
  const balik = i.tingkat === "daerah" ? "#daerah" : "#nasional";
  document.title = i.judul + " | Direktori METI";
  const catatan = ["lahan", "sosial", "lingkungan"].includes(i.tema) && i.bukti === "media" ? `<p class="isu-catatan">${ikon("info", 16)}<span>${esc(t("isu.d.catatan"))}</span></p>` : "";
  const kepala = `<a class="jm-lihat isu-kembali" href="${balik}">${ikon("panah-kiri", 16)}<span>${esc(t("isu.d.kembali"))}</span></a>
    <article class="isu-ringkas isu-t-${esc(i.tema)}"><span class="isu-lg isu-lg-b">${ikon(TEMA[i.tema] || "info", 32)}</span><div>
      <span class="isu-pil-baris">${pilTema(i.tema)}${pilStatus(i.status)}${pilBukti(i.bukti)}</span>
      <h2 class="isu-d-j">${esc(i.judul)}</h2><p class="isu-d-r">${esc(i.ringkas)}</p>${catatan}
      <p class="isu-meta"><span>${ikon("kalender", 14)}${esc(t("isu.d.diambil", { tgl: tanggal(D.tanggal_ambil) }))}</span><span>${ikon("buku", 14)}${esc(t("isu.k.sumber", { n: N(i.sumber.length) }))}</span></p>
    </div></article>`;
  const blok = [exHtml({ id: "isu-d-ringkas", ikon: "peringatan", topik: t("isu.d.ey"), judulHtml: esc(t("isu.d.ringkas")), subHtml: " ", aksiHtml: sumberHtml(esc(t("isu.metode"))), isiHtml: kepala })];
  if (i.konsultasi) blok.push(grup("isu.d.konsultasi", "palu", `<p>${esc(t("isu.d.konsultasi.s", { tahap: i.konsultasi.tahap, instansi: i.konsultasi.instansi }))}${i.konsultasi.tautan ? ` <a class="isu-sl" href="${esc(i.konsultasi.tautan)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 14)}<span>${esc(new URL(i.konsultasi.tautan).hostname.replace(/^www\./, ""))}</span></a>` : ""}</p>`));
  blok.push(grup("isu.d.lini", "linimasa", i.linimasa.length ? `<ol class="isu-lini isu-lini-d">${i.linimasa.map((e) => `<li class="isu-lini-li isu-t-${esc(i.tema)}"><time class="isu-lini-t" datetime="${esc(e.tanggal)}">${esc(tgl(e.tanggal))}</time><span class="isu-lini-titik" aria-hidden="true"></span><div class="isu-lini-k"><p>${esc(e.peristiwa)}</p>${e.sumber != null ? sumberLink(i, e.sumber) : ""}</div></li>`).join("")}</ol>` : `<p class="jm-kosong-teks">${esc(t("isu.d.lini.kosong"))}</p>`));
  if (i.posisi_meti) blok.push(grup("isu.d.meti", "bintang", `<blockquote class="isu-meti"><p>${esc(i.posisi_meti.ringkas)}</p><footer>${[i.posisi_meti.tanggal ? tgl(i.posisi_meti.tanggal) : "", i.posisi_meti.sumber_teks || (i.posisi_meti.sumber != null && i.sumber[i.posisi_meti.sumber] ? i.sumber[i.posisi_meti.sumber].penerbit : "")].filter(Boolean).map(esc).join(" - ")}</footer></blockquote>`, esc(t("isu.d.meti.s"))));
  blok.push(grup("isu.d.pihak", "orang", `<div id="isuPihak"></div>`));
  const ent = [];
  if (i.regulasi_ids.length) ent.push(`<h4 class="isu-sub">${ikon("regulasi", 16)}${esc(t("isu.d.regulasi"))}</h4><ul class="isu-chips">${i.regulasi_ids.map((r) => chip(tautRegulasi(r))).join("")}</ul>`);
  if (i.proyek_ids.length) ent.push(`<h4 class="isu-sub">${ikon("proyek", 16)}${esc(t("isu.d.proyek"))}</h4><ul class="isu-chips">${i.proyek_ids.map((r) => chip(tautProyek(r))).join("")}</ul>`);
  ent.push(`<h4 class="isu-sub">${ikon("wilayah", 16)}${esc(t("isu.d.wilayah"))}</h4>${i.prov.length ? `<ul class="isu-chips">${i.prov.map((k) => chip(tautProvinsi(k) + (i.wilayah.filter((w) => w.length === 4 && w.startsWith(k)).map((w) => ` <small class="isu-bps">BPS ${esc(w)}</small>`).join("")))).join("")}</ul>` : `<p class="isu-nas">${ikon("globe", 16)}${esc(t("isu.d.nasional"))}</p>`}`);
  blok.push(grup("isu.d.entitas", "tautan", ent.join("")));
  if (i.prov.length) blok.push(grup("isu.d.peta", "peta", `<div id="isuPetaKecil"></div>`, esc(t("isu.d.peta.s"))));
  blok.push(grup("isu.d.berita", "berita", `<div id="isuBerita"><p class="jm-kosong-teks">${esc(t("isu.d.berita.kosong"))}</p></div>`));
  blok.push(grup("isu.d.sumber", "buku", `<ol class="isu-sumber">${i.sumber.map((s, n) => `<li id="s${n}"><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"><b>${esc(s.judul)}</b></a><small>${esc([s.penerbit, s.tanggal ? tgl(s.tanggal) : ""].filter(Boolean).join(", "))}</small></li>`).join("")}</ol>`));
  const terkait = (i.terkait || []).map((x) => D.baris.find((b) => b.id === x)).filter(Boolean);
  if (terkait.length) blok.push(grup("isu.d.terkait", "tautan", `<ul class="isu-kartu-daftar">${terkait.map(kartuIsu).join("")}</ul>`));
  el.innerHTML = blok.join("");
  // pihak: tabel (tautan organisasi bila ada id)
  const kolom = [
    [null, "isu.c.pihak", (p) => `<span class="isu-pihak">${p.org_id ? tautOrg(p.org_id, p.nama) : esc(p.nama)}</span>`, "pb-c-n"],
    [null, "isu.d.peran", (p) => esc(p.peran), ""],
    [null, "isu.d.posisi", (p) => esc(p.posisi), "pb-c-posisi"],
    [null, "isu.c.sumber", (p) => (p.sumber != null ? sumberLink(i, p.sumber) : "-"), ""],
  ];
  if (i.pihak.length) pasangTabel(document.getElementById("isuPihak"), kolom, i.pihak, { k: null, arah: 1, hal: 1 });
  else document.getElementById("isuPihak").innerHTML = `<p class="jm-kosong-teks">${esc(t("isu.d.pihak.kosong"))}</p>`;
  // peta ringkas (SVG koroplet provinsi, klik ke profil wilayah)
  if (i.prov.length) {
    const data = new Map(i.prov.map((k) => [k, { kelas: 4, tip: namaProvinsiKode(k) }]));
    petaKoroplet({ data, nama: (k) => namaProvinsiKode(k), label: t("isu.d.peta"), legenda: [{ kelas: "inf-k4", teks: t("isu.d.wilayah") }] }).then((h) => {
      const w = document.getElementById("isuPetaKecil"); if (!w) return;
      w.innerHTML = h; pasangPeta(w, (k) => { if (data.has(k)) location.href = "/wilayah/" + k; });
    });
  }
  // berita sumber (tautan saja, tanpa foto)
  if (i.berita_ids.length) {
    const B = new Map((await muatBerita()).baris.map((b) => [b.id, b]));
    const ar = i.berita_ids.map((x) => B.get(x)).filter(Boolean);
    if (ar.length) document.getElementById("isuBerita").innerHTML = `<ul class="isu-berita">${ar.map((b) => `<li><a href="${esc(b.url)}" target="_blank" rel="noopener noreferrer"><b>${esc(b.judul)}</b></a><small>${esc([b.media, tanggal(String(b.terbit).slice(0, 10))].filter(Boolean).join(", "))}</small></li>`).join("")}</ul>`;
  }
}
