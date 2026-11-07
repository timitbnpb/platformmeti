/* Penampil naskah forum Konsultasi: daftar isi kiri (lengket), naskah di tengah, panel diskusi kanan (lengket, lebar bisa ditarik; laci bawah di ponsel).
   Pilih teks -> menu melayang (sorot + komentar, usul ubah, coret, tambah). INP: klik/pilih mengubah chrome seketika, render berat lewat nanti(). */
import { t, angka, tanggal, tanggalDariUnix, jam } from "/i18n.js";
import { esc, api, nanti, debounce, ikon, hantuHtml, kosongHtml, galatHtml, galatTeks } from "/inti/umum.js";
import { pilihHtml } from "/inti/komponen.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { tombolIkuti, pasangIkuti } from "/inti/ikuti.js";
import { segmen, labelBagian, susunRekap } from "/inti/naskah.js";

const HAL = 15, UBAHAN = ["ubah", "coret", "tambah"], USULAN = [...UBAHAN, "butir_baru"];
const IK = { sorot: "insight", komentar: "berita", ubah: "ubah", coret: "silang", tambah: "tambah", butir_baru: "daftar", umum: "kajian", dukung: "bintang", selesai: "centang", balas: "balik", sembunyi: "blokir", putus: "palu", rekap: "tabel", unduh: "unduh", cetak: "pdf", peserta: "orang" };
const KELAS_STATUS = { terbuka: "", diterima: "jm-pil-ok", ditolak: "jm-pil-bad", digabung: "jm-pil-warn" };
const inisial = (n) => (String(n || "?").trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("") || "?").toLocaleUpperCase();
const kunciLebar = "kf_lebar_panel";
const simpanLokal = (k, v) => { try { localStorage.setItem(k, v); } catch { /* mode privat: abaikan */ } };
const bacaLokal = (k) => { try { return localStorage.getItem(k); } catch { return null; } };

export async function bukaDokumen(akar, id, { tutup, bagianAwal = null }) {
  const S = { id, d: null, mode: "baca", skop: bagianAwal ? { b: bagianAwal } : { b: null }, saring: "semua", urut: "baru", hal: 1, form: null, aktif: null, balas: null, putus: null, sunting: null, rekap: null, pilih: null, laci: false };
  akar.innerHTML = hantuHtml(5);
  const kabar = (teks) => { const k = akar.querySelector("#kfKabar"); if (k) { k.textContent = teks || ""; k.hidden = !teks; } };
  const muat = async () => {
    try { S.d = await api("/api/konsultasi/" + encodeURIComponent(id)); }
    catch (e) { akar.innerHTML = galatHtml(e.status === 404 ? "tidak-ada" : e.kode || "umum"); return false; }
    return true;
  };
  if (!(await muat())) { akar.addEventListener("click", (e) => { if (e.target.closest("[data-aksi=ulang]")) bukaDokumen(akar, id, { tutup, bagianAwal }); }, { once: true }); return; }

  const utasBagian = (bid) => S.d.utas.filter((u) => u.bagian_id === bid && !u.tersembunyi && ["sorot", "komentar", ...UBAHAN].includes(u.jenis));
  const hitung = (bid) => S.d.utas.filter((u) => u.bagian_id === bid && !u.tersembunyi).length;
  const staf = () => S.d.saya.putus;
  const label = (() => { let pasal = ""; const m = new Map(); for (const b of S.d.bagian) { if (b.tingkat === "pasal") pasal = b.nomor; m.set(b.id, labelBagian(b, pasal) + (b.judul && b.tingkat !== "ayat" ? ": " + b.judul : "")); } return m; })();

  /* ---------- naskah ---------- */
  function teksHtml(b) {
    const us = utasBagian(b.id);
    let o = 0, h = "";
    for (const s of segmen(b.teks, us)) {
      const d = s.utas ? ` data-u="${s.utas}"` : "", a = S.aktif && S.aktif === s.utas ? " kf-aktif" : "";
      if (s.kelas === "sisip") { h += `<ins data-o="${o}"${d} class="kf-ins${a}" aria-label="${esc(t("kf.sisip_label"))}">${esc(s.baru)}</ins>`; continue; }
      const tag = s.kelas === "sorot" ? "mark" : s.kelas === "coret" ? "del" : "span";
      h += `<${tag} data-o="${o}"${d}${a ? ` class="${a.trim()}"` : ""}>${esc(s.t)}</${tag}>`;
      if (s.kelas === "coret" && s.baru) h += `<ins data-o="${o + s.t.length}"${d} class="kf-ins${a}" aria-label="${esc(t("kf.ganti_label"))}">${esc(s.baru)}</ins>`;
      o += s.t.length;
    }
    return h;
  }
  function bagianHtml(b) {
    const pilih = S.skop.b === b.id ? " kf-pilih" : "", n = hitung(b.id);
    const diskusi = `<button type="button" class="jm-tbl jm-tbl-kecil" data-skop="${b.id}" aria-pressed="${S.skop.b === b.id}">${ikon(IK.umum, 16)}<span>${esc(t("kf.diskusi_n", { n: angka(n) }))}</span></button>`;
    if (b.tingkat === "bab") return `<section class="kf-bag kf-bag-bab" id="b${b.id}" data-b="${b.id}"><h3>${esc(labelBagian(b))}${b.judul ? ": " + esc(b.judul) : ""}</h3></section>`;
    if (S.d.dokumen.bentuk === "butir") {
      return `<article class="kf-bag${pilih}" id="b${b.id}" data-b="${b.id}"><div class="kf-bag-kepala"><h3>${esc(b.nomor)}. ${esc(b.judul || "")}</h3>${b.status_asal ? `<span class="jm-pil">${esc(b.status_asal)}</span>` : ""}${diskusi}</div>
        <p class="kf-teks" data-teks="${b.id}">${teksHtml(b)}</p>
        <div class="kf-butir"><dl>${b.rujukan ? `<dt>${esc(t("kf.rujukan"))}</dt><dd>${esc(b.rujukan)}</dd>` : ""}${b.alasan ? `<dt>${esc(t("kf.alasan"))}</dt><dd>${esc(b.alasan)}</dd>` : ""}${b.sumber_asal ? `<dt>${esc(t("kf.sumber"))}</dt><dd>${esc(b.sumber_asal)}</dd>` : ""}</dl></div></article>`;
    }
    const kepala = b.tingkat === "pasal" ? `<h3>${esc(labelBagian(b))}</h3>` : `<span class="kf-ayat-no">${esc(b.nomor)}</span>`;
    return `<article class="kf-bag${pilih}" id="b${b.id}" data-b="${b.id}"><div class="kf-bag-kepala">${kepala}${diskusi}</div>${b.teks ? `<p class="kf-teks" data-teks="${b.id}">${teksHtml(b)}</p>` : ""}</article>`;
  }
  function daftarIsi() {
    const hit = new Map();
    for (const u of S.d.utas) if (!u.tersembunyi && u.bagian_id) hit.set(u.bagian_id, (hit.get(u.bagian_id) || 0) + 1);
    const butir = S.d.dokumen.bentuk === "butir";
    const baris = S.d.bagian.filter((b) => butir || b.tingkat !== "ayat").map((b) => {
      const l = butir ? `${b.nomor}. ${b.judul || ""}` : labelBagian(b) + (b.tingkat === "bab" && b.judul ? ": " + b.judul : "");
      return `<a href="#b${b.id}" data-isi="${b.id}" class="${b.tingkat === "bab" ? "kf-bab" : ""}">${esc(l)}${hit.get(b.id) ? `<span class="kf-n">${angka(hit.get(b.id))}</span>` : ""}</a>`;
    }).join("");
    return `<h3>${esc(t("kf.daftar_isi"))}</h3>${baris}`;
  }

  /* ---------- panel ---------- */
  const semuaUtas = () => {
    const bm = S.skop.b === "umum" ? (u) => u.bagian_id == null : S.skop.b ? (u) => u.bagian_id === S.skop.b : () => true;
    let l = S.d.utas.filter(bm);
    const f = S.saring;
    if (f === "saya") l = l.filter((u) => u.milik);
    else if (f === "terbuka") l = l.filter((u) => u.status === "terbuka" && !u.selesai);
    else if (f === "diterima" || f === "ditolak") l = l.filter((u) => u.status === f);
    l = l.slice().sort(S.urut === "dukungan" ? (a, b) => b.dukung - a.dukung || b.id - a.id : (a, b) => b.id - a.id);
    return l;
  };
  const waktu = (u) => `${tanggal(tanggalDariUnix(u))}, ${jam(u)}`;
  const bisaSunting = (x) => x.milik && x.status !== "ditarik" && Date.now() / 1000 - x.dibuat < S.d.menit_sunting * 60;
  const sebutHtml = (s) => esc(s).replace(/@(\S+)/g, '<span class="kf-sebut">@$1</span>');
  function balasanHtml(u) {
    if (!u.balasan.length) return "";
    return `<ul class="kf-balas">${u.balasan.map((r) => `<li><div class="kf-utas-kepala"><b>${esc(r.nama || t("kf.anggota"))}</b><span>${esc(waktu(r.dibuat))}</span>${r.tersembunyi ? `<span class="jm-pil jm-pil-warn">${esc(t("kf.tersembunyi"))}</span>` : ""}</div>
      ${r.isi == null ? `<p class="kf-sembunyi">${esc(t("kf.disembunyikan"))}</p>` : `<p class="kf-isi-utas">${sebutHtml(r.isi)}</p>`}
      <div class="kf-aksi">${bisaSunting(r) ? `<button type="button" data-m="sunting-b" data-id="${r.id}">${ikon(IK.ubah, 16)}<span>${esc(t("kf.sunting"))}</span></button><button type="button" data-m="tarik-b" data-id="${r.id}">${ikon(IK.coret, 16)}<span>${esc(t("kf.tarik"))}</span></button>` : ""}
      ${staf() ? `<button type="button" data-m="sembunyi-b" data-id="${r.id}" data-ke="${r.tersembunyi ? 0 : 1}">${ikon(IK.sembunyi, 16)}<span>${esc(t(r.tersembunyi ? "kf.tampilkan" : "kf.sembunyikan"))}</span></button>` : ""}</div></li>`).join("")}</ul>`;
  }
  const formHtml = (kunci, { label: lab, mulai = "", maks = 2000, bawaan = "" } = {}) => `<form class="kf-form" data-form="${kunci}" novalidate><label>${esc(lab)}<textarea name="isi" maxlength="${maks}" required>${esc(bawaan)}</textarea></label><div data-sebut></div><p class="jm-bantu" data-galat role="alert" hidden></p><div class="kf-form-aksi"><button type="button" class="jm-tbl" data-m="batal">${esc(t("jm.batal"))}</button><button type="submit" class="jm-tbl jm-tbl-utama">${esc(t("kf.kirim"))}</button></div></form>`;
  function putusHtml(u) {
    const kandidat = S.d.utas.filter((x) => x.status === "diterima" && x.id !== u.id && USULAN.includes(x.jenis));
    return `<form class="kf-putus" data-form="putus" data-id="${u.id}" novalidate><div class="kf-radio" role="radiogroup" aria-label="${esc(t("kf.putusan"))}">${["diterima", "ditolak", ...(kandidat.length ? ["digabung"] : [])].map((a, i) => `<label><input type="radio" name="aksi" value="${a}"${i ? "" : " checked"}> ${esc(t("kf.status." + a))}</label>`).join("")}</div>
      ${kandidat.length ? `<label>${esc(t("kf.gabung_ke"))}<select name="gabung_ke" class="jm-isian" data-asli>${kandidat.map((x) => `<option value="${x.id}">#${x.id} ${esc(t("kf.jenis." + x.jenis))}: ${esc((x.teks_ganti || x.kutipan || x.isi || "").slice(0, 40))}</option>`).join("")}</select></label>` : ""}
      <label>${esc(t("kf.catatan"))}<textarea name="catatan" maxlength="1000"></textarea></label><p class="jm-bantu" data-galat role="alert" hidden></p>
      <div class="kf-form-aksi"><button type="button" class="jm-tbl" data-m="batal">${esc(t("jm.batal"))}</button><button type="submit" class="jm-tbl jm-tbl-utama">${esc(t("kf.simpan_putusan"))}</button></div></form>`;
  }
  function utasHtml(u) {
    const usul = USULAN.includes(u.jenis), aktif = S.aktif === u.id ? " kf-aktif" : "", ta = S.sunting === "u" + u.id;
    const kepala = `<div class="kf-utas-kepala"><span class="kf-av" aria-hidden="true">${esc(inisial(u.nama))}</span><b>${esc(u.nama || t("kf.anggota"))}</b><span>${esc(waktu(u.dibuat))}</span><span class="jm-pil">${ikon(IK[u.jenis], 14)}${esc(t("kf.jenis." + u.jenis))}</span>${usul ? `<span class="jm-pil ${KELAS_STATUS[u.status]}">${esc(t("kf.status." + u.status))}</span>` : ""}${u.selesai ? `<span class="jm-pil jm-pil-ok">${ikon(IK.selesai, 14)}${esc(t("kf.selesai"))}</span>` : ""}${u.tersembunyi ? `<span class="jm-pil jm-pil-warn">${esc(t("kf.tersembunyi"))}</span>` : ""}</div>`;
    if (u.isi == null) return `<article class="kf-utas" data-u="${u.id}">${kepala}<p class="kf-sembunyi">${esc(t("kf.disembunyikan"))}</p></article>`;
    const ganti = u.teks_ganti ? `<p class="kf-ganti"><b>${esc(t(u.jenis === "tambah" ? (u.sisip === "sebelum" ? "kf.sisip_sebelum" : "kf.sisip_sesudah") : u.jenis === "butir_baru" ? "kf.butir_usul" : "kf.menjadi"))}</b> ${esc(u.teks_ganti)}</p>` : "";
    const kutip = u.kutipan ? `<p class="kf-kutip">${esc(u.kutipan)}</p>` : "";
    const lokasi = u.bagian_id && S.skop.b !== u.bagian_id ? `<button type="button" class="jm-tbl jm-tbl-kecil" data-skop="${u.bagian_id}">${esc(label.get(u.bagian_id) || "")}</button>` : "";
    const aksi = `<div class="kf-aksi"><button type="button" data-m="balas" data-id="${u.id}">${ikon(IK.balas, 16)}<span>${esc(t("kf.balas"))}${u.balasan.length ? " " + angka(u.balasan.length) : ""}</span></button>
      ${usul ? `<button type="button" data-m="dukung" data-id="${u.id}" aria-pressed="${u.saya_dukung}">${ikon(IK.dukung, 16)}<span>${esc(t("kf.dukung"))} ${angka(u.dukung)}</span></button>` : ""}
      ${u.milik || staf() ? `<button type="button" data-m="selesai" data-id="${u.id}" aria-pressed="${u.selesai}">${ikon(IK.selesai, 16)}<span>${esc(t(u.selesai ? "kf.buka_lagi" : "kf.tandai_selesai"))}</span></button>` : ""}
      ${bisaSunting(u) ? `<button type="button" data-m="sunting" data-id="${u.id}">${ikon(IK.ubah, 16)}<span>${esc(t("kf.sunting"))}</span></button><button type="button" data-m="tarik" data-id="${u.id}">${ikon(IK.coret, 16)}<span>${esc(t("kf.tarik"))}</span></button>` : ""}
      ${staf() && usul ? `<button type="button" data-m="putus" data-id="${u.id}">${ikon(IK.putus, 16)}<span>${esc(t(u.status === "terbuka" ? "kf.putuskan" : "kf.ubah_putusan"))}</span></button>` : ""}
      ${staf() ? `<button type="button" data-m="sembunyi" data-id="${u.id}" data-ke="${u.tersembunyi ? 0 : 1}">${ikon(IK.sembunyi, 16)}<span>${esc(t(u.tersembunyi ? "kf.tampilkan" : "kf.sembunyikan"))}</span></button>` : ""}</div>`;
    const putusan = u.putusan || u.diputus_nama ? `<p class="jm-bantu">${esc(t("kf.putusan_oleh", { nama: u.diputus_nama || "-" }))}${u.putusan ? ": " + esc(u.putusan) : ""}${u.gabung_ke ? " " + esc(t("kf.digabung_ke", { n: u.gabung_ke })) : ""}</p>` : "";
    return `<article class="kf-utas${aktif}${u.selesai ? " kf-selesai" : ""}" data-u="${u.id}" id="u${u.id}">${kepala}${lokasi}${kutip}${ganti}
      ${ta ? formHtml("ubah-u", { label: t("kf.isi"), maks: 4000, bawaan: u.isi }) : `<p class="kf-isi-utas">${sebutHtml(u.isi)}</p>`}${putusan}${aksi}
      ${S.putus === u.id ? putusHtml(u) : ""}${balasanHtml(u)}${S.balas === u.id ? formHtml("balas", { label: t("kf.balasan_anda") }) : ""}</article>`;
  }
  function composerHtml() {
    const f = S.form;
    if (!f) return "";
    const usul = USULAN.includes(f.jenis), butirBaru = f.jenis === "butir_baru";
    const kutip = f.kutipan ? `<p class="kf-kutip">${esc(f.kutipan)}</p>` : "";
    const ganti = ["ubah", "tambah", "butir_baru"].includes(f.jenis) ? `<label>${esc(t(f.jenis === "tambah" ? "kf.teks_sisip" : f.jenis === "butir_baru" ? "kf.teks_butir" : "kf.teks_pengganti"))}<textarea name="teks_ganti" maxlength="6000" required></textarea></label>` : "";
    const sisip = f.jenis === "tambah" ? `<div class="kf-radio" role="radiogroup" aria-label="${esc(t("kf.sisip_posisi"))}">${["sebelum", "sesudah"].map((v, i) => `<label><input type="radio" name="sisip" value="${v}"${i ? " checked" : ""}> ${esc(t("kf.sisip_" + v))}</label>`).join("")}</div>` : "";
    const judulButir = butirBaru ? `<label>${esc(t("kf.judul_butir"))}<input name="kutipan" class="jm-isian" maxlength="300"></label>` : "";
    return `<form class="kf-form" data-form="baru" novalidate><h3>${ikon(IK[f.jenis], 18)}<span>${esc(t("kf.jenis." + f.jenis))}</span></h3>${kutip}${judulButir}${ganti}${sisip}
      <label>${esc(t(usul ? "kf.alasan_wajib" : "kf.isi"))}<textarea name="isi" maxlength="4000" required></textarea></label><div data-sebut></div><p class="jm-bantu" data-galat role="alert" hidden></p>
      <div class="kf-form-aksi"><button type="button" class="jm-tbl" data-m="batal">${esc(t("jm.batal"))}</button><button type="submit" class="jm-tbl jm-tbl-utama">${esc(t("kf.kirim"))}</button></div></form>`;
  }
  function panelHtml() {
    const l = semuaUtas(), awalH = (S.hal - 1) * HAL, tampil = l.slice(awalH, awalH + HAL);
    const skop = S.skop.b === "umum" ? t("kf.skop_umum") : S.skop.b ? label.get(S.skop.b) || "" : t("kf.skop_semua");
    return `<div class="kf-lebar" id="kfLebar" role="separator" aria-orientation="vertical" tabindex="0" aria-label="${esc(t("kf.lebarkan"))}"></div>
      <div class="kf-panel-kepala"><h3>${ikon(IK.umum, 18)}<span>${esc(t("kf.diskusi"))}</span><button type="button" class="jm-tbl jm-tbl-kecil kf-panel-tutup kf-ujung" data-m="laci">${ikon("tutup", 16)}<span>${esc(t("jm.tutup"))}</span></button></h3>
        <div class="kf-meta"><span class="jm-pil">${esc(skop)}</span>${S.skop.b ? `<button type="button" class="jm-hapus" data-skop="">${ikon("silang", 16)}${esc(t("kf.semua_bagian"))}</button>` : ""}</div>
        <div class="kf-saring">${pilihHtml({ id: "kfSaring", ikon: "status", label: t("kf.saring"), nilai: S.saring, opsi: ["semua", "saya", "terbuka", "diterima", "ditolak"].map((v) => [v, t("kf.saring." + v)]) })}${pilihHtml({ id: "kfUrut", ikon: "tahun", label: t("kf.urut"), nilai: S.urut, opsi: [["baru", t("kf.urut.baru")], ["dukungan", t("kf.urut.dukungan")]] })}</div>
        <div class="kf-aksi"><button type="button" class="jm-tbl jm-tbl-kecil" data-baru="umum">${ikon(IK.komentar, 16)}<span>${esc(t(S.skop.b && S.skop.b !== "umum" ? "kf.diskusi_pasal" : "kf.diskusi_umum"))}</span></button><button type="button" class="jm-tbl jm-tbl-kecil" data-baru="butir_baru">${ikon(IK.butir_baru, 16)}<span>${esc(t("kf.usul_butir"))}</span></button></div>
        <p id="kfKabar" class="jm-bantu" role="status" hidden></p></div>
      <div class="kf-panel-isi" id="kfIsi">${composerHtml()}${tampil.length ? tampil.map(utasHtml).join("") : kosongHtml("kf.kosong_diskusi")}${paginasiHtml({ hal: S.hal, total: l.length, per: HAL, satuan: "kf.pag_u" })}</div>`;
  }
  const butir = () => S.d.dokumen.bentuk === "butir";
  function rangka() {
    const dk = S.d.dokumen, kosongNaskah = !S.d.bagian.length;
    const bar = `<div class="kf-bar"><button type="button" class="jm-tbl jm-tbl-kecil" data-m="kembali">${ikon("panah-kiri", 16)}<span>${esc(t("kf.kembali"))}</span></button><h2>${esc(dk.judul)}</h2>
${tombolIkuti({ jenis: "regulasi", id: "kons:" + dk.id, nama: dk.judul })}
      <div class="jm-tab jm-tab-rata kf-mode" role="tablist" aria-label="${esc(t("kf.mode"))}">${["baca", "rekap"].map((m) => `<button type="button" role="tab" data-mode="${m}" aria-selected="${S.mode === m}">${ikon(m === "baca" ? "buku" : IK.rekap, 16)}<span>${esc(t("kf.mode." + m))}</span></button>`).join("")}</div></div>`;
    if (S.mode === "rekap") { akar.innerHTML = bar + `<div id="kfRekap">${hantuHtml(4)}</div>`; pasangIkuti(akar); muatRekap(); return; }
    const naskah = kosongNaskah ? `<div class="kf-bag">${kosongHtml(butir() ? "kf.kosong_butir" : "kf.naskah_belum")}${staf() ? `<div class="kf-aksi"><button type="button" class="jm-tbl jm-tbl-utama" data-m="kelola">${ikon(IK.unduh, 16)}<span>${esc(t("kf.unggah_naskah"))}</span></button></div>` : ""}</div>` : S.d.bagian.map(bagianHtml).join("");
    akar.innerHTML = bar + `<div id="kfKabarLuar"></div><div class="kf-baca${S.laci ? " kf-buka" : ""}" id="kfBaca">
      <nav class="kf-isi" aria-label="${esc(t("kf.daftar_isi"))}">${kosongNaskah ? "" : daftarIsi()}</nav><div class="kf-naskah" id="kfNaskah">${naskah}</div>
      <aside class="kf-panel" id="kfPanel" aria-label="${esc(t("kf.diskusi"))}">${panelHtml()}</aside>
      <button type="button" class="kf-tombol-panel" data-m="laci">${ikon(IK.umum, 18)}<span>${esc(t("kf.diskusi_n", { n: angka(S.d.utas.filter((u) => !u.tersembunyi).length) }))}</span></button></div>
      <div class="kf-menu-sorot" id="kfMenu" role="toolbar" aria-label="${esc(t("kf.menu"))}" hidden>${["komentar", "ubah", "coret", "tambah"].map((j) => `<button type="button" data-pilih="${j}">${ikon(IK[j], 16)}<span>${esc(t("kf.menu." + j))}</span></button>`).join("")}</div>`;
    pasangIkuti(akar);
    const pn = akar.querySelector("#kfPanel"), w = Number(bacaLokal(kunciLebar));
    if (pn && w >= 300 && w <= 760) pn.style.width = w + "px";
    pasangLebar();
  }
  function gambarPanel() { const p = akar.querySelector("#kfPanel"); if (p) { p.innerHTML = panelHtml(); pasangMention(); } }
  function gambarNaskah() { const el = akar.querySelector("#kfNaskah"); if (el && S.d.bagian.length) el.innerHTML = S.d.bagian.map(bagianHtml).join(""); }

  /* ---------- rekap ---------- */
  async function muatRekap() {
    const el = akar.querySelector("#kfRekap");
    try { S.rekap = await api(`/api/konsultasi/${encodeURIComponent(id)}/rekap`); }
    catch (e) { if (el) el.innerHTML = galatHtml(e.kode || "umum"); return; }
    if (!el) return;
    const r = S.rekap, kolom = r.dokumen.bentuk === "butir" ? ["no", "topik", "rujukan", "awal", "usulan", "alasan"] : ["pasal", "asli", "usulan", "alasan"];
    const sel = (b) => (r.dokumen.bentuk === "butir"
      ? [b.label.replace(/^Butir\s*/, ""), esc(b.judul), esc(b.rujukan), esc(b.asli), b.berubah ? `<b>${esc(b.usulan)}</b>` : esc(b.usulan), esc(b.alasan)]
      : [esc(b.label), esc(b.asli), `<b>${esc(b.usulan)}</b>`, esc(b.alasan)]);
    const baris = r.baris;
    el.innerHTML = `<div class="kf-rekap"><p class="jm-bantu">${esc(t("kf.rekap_bantu", { n: angka(baris.filter((b) => b.berubah).length) }))}</p>
      <div class="kf-ekspor">${r.bisa_ekspor ? `<a class="jm-tbl" href="/api/konsultasi/${encodeURIComponent(id)}/rekap.docx" download>${ikon(IK.unduh, 16)}<span>${esc(t("kf.unduh_docx"))}</span></a>` : ""}<button type="button" class="jm-tbl" data-m="cetak">${ikon(IK.cetak, 16)}<span>${esc(t("kf.simpan_pdf"))}</span></button></div>
      ${baris.length ? `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>${kolom.map((k) => `<th scope="col">${esc(t("kf.rk." + k))}</th>`).join("")}</tr></thead><tbody>${baris.map((b) => `<tr class="${b.berubah ? "" : "jm-redup"}">${sel(b).map((c, i) => `<td data-l="${esc(t("kf.rk." + kolom[i]))}">${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : kosongHtml("kf.rekap_kosong")}</div>`;
  }

  /* ---------- pilih teks -> menu melayang ---------- */
  function bacaPilihan() {
    const sel = getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
    const r = sel.getRangeAt(0), p = (r.commonAncestorContainer.nodeType === 3 ? r.commonAncestorContainer.parentElement : r.commonAncestorContainer)?.closest?.("[data-teks]");
    if (!p || !akar.contains(p)) return null;
    let a = null, b = null;
    for (const s of p.querySelectorAll("[data-o]:not(ins)")) {
      if (!r.intersectsNode(s)) continue;
      const len = s.textContent.length, o = Number(s.dataset.o);
      const lokal = (kont, off, awal) => (!s.contains(kont) ? (awal ? 0 : len) : kont.nodeType === 3 ? off : off ? len : 0);
      const x = o + lokal(r.startContainer, r.startOffset, true), y = o + lokal(r.endContainer, r.endOffset, false);
      a = a == null ? x : Math.min(a, x); b = b == null ? y : Math.max(b, y);
    }
    if (a == null || b <= a) return null;
    const bg = S.d.bagian.find((x) => x.id === Number(p.dataset.teks));
    let teks = bg.teks.slice(a, b);
    const lead = teks.length - teks.trimStart().length; a += lead; teks = teks.trim(); b = a + teks.length;
    if (!teks) return null;
    return { bagian: bg.id, mulai: a, akhir: b, kutipan: teks.slice(0, 1200), rect: r.getBoundingClientRect() };
  }
  const sembunyiMenu = () => { const m = akar.querySelector("#kfMenu"); if (m) m.hidden = true; };
  const periksaPilihan = debounce(() => {
    const m = akar.querySelector("#kfMenu"); if (!m || !akar.isConnected) return;
    const p = bacaPilihan();
    S.pilih = p;
    if (!p) { m.hidden = true; return; }
    m.hidden = false;
    const lb = innerWidth <= 900;
    if (!lb) { const w = m.offsetWidth || 360; m.style.left = Math.max(8, Math.min(p.rect.left, innerWidth - w - 8)) + "px"; m.style.top = (p.rect.bottom + 8 + 48 > innerHeight ? Math.max(8, p.rect.top - 56) : p.rect.bottom + 8) + "px"; }
  }, 150);
  const selChange = () => periksaPilihan();
  document.addEventListener("selectionchange", selChange);
  akar.addEventListener("jm:lepas", () => document.removeEventListener("selectionchange", selChange));
  new MutationObserver(() => { if (!akar.isConnected) document.removeEventListener("selectionchange", selChange); }).observe(document.body, { childList: true, subtree: true });

  function bukaForm(jenis, ekstra = {}) {
    S.form = { jenis, ...ekstra }; S.balas = S.putus = S.sunting = null; S.hal = 1;
    S.laci = true; sembunyiMenu(); getSelection()?.removeAllRanges?.();
    akar.querySelector("#kfBaca")?.classList.add("kf-buka");
    gambarPanel();
    akar.querySelector("#kfIsi textarea")?.focus();
  }

  /* ---------- @sebut ---------- */
  const sebutDipilih = new Map(); // nama -> id (per sesi tampilan)
  function pasangMention() {
    akar.querySelectorAll("textarea[name=isi]").forEach((ta) => {
      if (ta._mn) return; ta._mn = true;
      const cari = debounce(async () => {
        const m = ta.value.slice(0, ta.selectionStart).match(/@([^\s@]{2,40})$/);
        const wadah = ta.closest("form").querySelector("[data-sebut]");
        if (!m) { wadah.innerHTML = ""; return; }
        try {
          const d = await api("/api/konsultasi/anggota?q=" + encodeURIComponent(m[1]));
          wadah.innerHTML = d.baris.length ? `<ul class="kf-sebut-daftar" role="listbox" aria-label="${esc(t("kf.sebut"))}">${d.baris.map((a) => `<li><button type="button" role="option" data-sebut-id="${a.id}" data-sebut-nama="${esc(a.nama)}">${esc(a.nama)}</button></li>`).join("")}</ul>` : "";
        } catch { wadah.innerHTML = ""; }
      }, 220);
      ta.addEventListener("input", cari);
    });
  }
  function sisipSebut(tombol) {
    const form = tombol.closest("form"), ta = form.querySelector("textarea[name=isi]"), nama = tombol.dataset.sebutNama;
    const pos = ta.selectionStart, awal = ta.value.slice(0, pos).replace(/@[^\s@]*$/, "@" + nama + " ");
    ta.value = awal + ta.value.slice(pos); ta.selectionStart = ta.selectionEnd = awal.length;
    sebutDipilih.set(nama, Number(tombol.dataset.sebutId));
    form.querySelector("[data-sebut]").innerHTML = ""; ta.focus();
  }
  const idSebut = (teks) => [...sebutDipilih].filter(([n]) => teks.includes("@" + n)).map(([, i]) => i);

  /* ---------- lebar panel ---------- */
  function pasangLebar() {
    const h = akar.querySelector("#kfLebar"), baca = akar.querySelector("#kfBaca");
    if (!h || !baca) return;
    const atur = (px) => { const w = Math.max(300, Math.min(760, Math.round(px))); akar.querySelector("#kfPanel").style.width = w + "px"; return w; };
    let mulai = null;
    h.addEventListener("pointerdown", (e) => { mulai = { x: e.clientX, w: akar.querySelector("#kfPanel").offsetWidth }; h.setPointerCapture(e.pointerId); h.classList.add("kf-tarik"); });
    h.addEventListener("pointermove", (e) => { if (mulai) requestAnimationFrame(() => atur(mulai.w + (mulai.x - e.clientX))); });
    const lepas = (e) => { if (!mulai) return; mulai = null; h.classList.remove("kf-tarik"); simpanLokal(kunciLebar, String(akar.querySelector("#kfPanel").offsetWidth)); };
    h.addEventListener("pointerup", lepas); h.addEventListener("pointercancel", lepas);
    h.addEventListener("keydown", (e) => { const s = { ArrowLeft: 24, ArrowRight: -24 }[e.key]; if (!s) return; e.preventDefault(); simpanLokal(kunciLebar, String(atur(akar.querySelector("#kfPanel").offsetWidth + s))); });
  }

  /* ---------- aksi ---------- */
  const segarkan = async (opsi = {}) => { if (await muat()) { S.laci = opsi.laci ?? S.laci; gambarNaskah(); gambarPanel(); const di = akar.querySelector(".kf-isi"); if (di) di.innerHTML = S.d.bagian.length ? daftarIsi() : ""; } };
  const galatForm = (form, e) => { const g = form.querySelector("[data-galat]"); if (g) { g.textContent = galatTeks(e.kode || "umum"); g.hidden = false; } form.querySelectorAll("button").forEach((b) => (b.disabled = false)); };
  const tulis = async (fn, form) => { form?.querySelectorAll("button").forEach((b) => (b.disabled = true)); try { await fn(); return true; } catch (e) { if (form) galatForm(form, e); else kabar(galatTeks(e.kode || "umum")); return false; } };
  const U = (n) => `/api/konsultasi/utas/${n}`, B = (n) => `/api/konsultasi/balasan/${n}`;

  akar.addEventListener("click", async (e) => {
    const c = e.target;
    let el;
    if ((el = c.closest("[data-aksi=ulang]"))) return bukaDokumen(akar, id, { tutup, bagianAwal });
    if ((el = c.closest("[data-hal]"))) { S.hal = Number(el.dataset.hal); sorotHalaman(el, S.hal); return nanti(() => { gambarPanel(); akar.querySelector("#kfIsi")?.scrollTo?.(0, 0); }); }
    if ((el = c.closest("[data-mode]"))) { S.mode = el.dataset.mode; return nanti(rangka); }
    if ((el = c.closest("[data-pilih]"))) { const p = S.pilih; if (!p) return; return bukaForm(el.dataset.pilih === "komentar" ? "sorot" : el.dataset.pilih, { bagian_id: p.bagian, kutipan: p.kutipan, mulai: p.mulai, akhir: p.akhir }); }
    if ((el = c.closest("[data-baru]"))) return bukaForm(el.dataset.baru, el.dataset.baru === "umum" && S.skop.b && S.skop.b !== "umum" ? { bagian_id: S.skop.b } : {});
    if ((el = c.closest("[data-skop]"))) { const v = el.dataset.skop; S.skop = { b: v === "" ? null : v === "umum" ? "umum" : Number(v) }; S.hal = 1; S.laci = true; akar.querySelector("#kfBaca")?.classList.add("kf-buka"); akar.querySelectorAll(".kf-bag").forEach((x) => x.classList.toggle("kf-pilih", Number(x.dataset.b) === S.skop.b)); return nanti(gambarPanel); }
    if ((el = c.closest("[data-isi]"))) { S.skop = { b: Number(el.dataset.isi) }; akar.querySelectorAll(".kf-isi a").forEach((a) => a.removeAttribute("aria-current")); el.setAttribute("aria-current", "true"); akar.querySelectorAll(".kf-bag").forEach((x) => x.classList.toggle("kf-pilih", Number(x.dataset.b) === S.skop.b)); return nanti(gambarPanel); }
    if ((el = c.closest("mark[data-u],del[data-u],ins[data-u]"))) { S.aktif = Number(el.dataset.u); S.laci = true; akar.querySelector("#kfBaca")?.classList.add("kf-buka"); const u = S.d.utas.find((x) => x.id === S.aktif); if (u) S.skop = { b: u.bagian_id ?? "umum" }; return nanti(() => { gambarNaskah(); gambarPanel(); akar.querySelector("#u" + S.aktif)?.scrollIntoView({ block: "center" }); }); }
    if ((el = c.closest("[data-sebut-id]"))) return sisipSebut(el);
    const m = c.closest("[data-m]")?.dataset.m, tom = c.closest("[data-m]");
    if (!m) return;
    const nid = Number(tom.dataset.id);
    if (m === "kembali") return tutup();
    if (m === "laci") { S.laci = !S.laci; return akar.querySelector("#kfBaca")?.classList.toggle("kf-buka", S.laci); }
    if (m === "batal") { S.form = S.balas = S.putus = S.sunting = null; return gambarPanel(); }
    if (m === "cetak") return print();
    if (m === "kelola") { const { bukaKelola } = await import("/konsultasi_kelola.js"); return bukaKelola(S.d.dokumen, { selesai: () => segarkan() }); }
    if (m === "balas") { S.balas = S.balas === nid ? null : nid; S.form = S.putus = S.sunting = null; gambarPanel(); return akar.querySelector(`#u${nid} textarea`)?.focus(); }
    if (m === "putus") { S.putus = S.putus === nid ? null : nid; S.balas = S.form = S.sunting = null; return gambarPanel(); }
    if (m === "sunting") { S.sunting = "u" + nid; S.balas = S.putus = S.form = null; return gambarPanel(); }
    if (m === "sunting-b") { const r = S.d.utas.flatMap((u) => u.balasan).find((x) => x.id === nid); const baru = prompt(t("kf.sunting_balasan"), r?.isi || ""); if (baru == null || !baru.trim()) return; if (await tulis(() => api(B(nid), { metode: "PATCH", badan: { isi: baru } }))) segarkan(); return; }
    if (m === "dukung") { const u = S.d.utas.find((x) => x.id === nid); u.saya_dukung = !u.saya_dukung; u.dukung += u.saya_dukung ? 1 : -1; tom.setAttribute("aria-pressed", String(u.saya_dukung)); tom.querySelector("span").textContent = `${t("kf.dukung")} ${angka(u.dukung)}`; // chrome urgent
      try { const r = await api(U(nid) + "/dukung", { metode: "POST", badan: { ya: u.saya_dukung } }); u.dukung = r.dukung; u.saya_dukung = r.saya_dukung; } catch (er) { u.saya_dukung = !u.saya_dukung; u.dukung += u.saya_dukung ? 1 : -1; kabar(galatTeks(er.kode || "umum")); }
      return nanti(gambarPanel); }
    if (m === "selesai") { if (await tulis(() => api(U(nid) + "/selesai", { metode: "POST", badan: { selesai: tom.getAttribute("aria-pressed") !== "true" } }))) segarkan(); return; }
    if (m === "tarik") { if (!confirm(t("kf.tarik_tanya"))) return; if (await tulis(() => api(U(nid), { metode: "DELETE" }))) segarkan(); return; }
    if (m === "tarik-b") { if (!confirm(t("kf.tarik_tanya"))) return; if (await tulis(() => api(B(nid), { metode: "DELETE" }))) segarkan(); return; }
    if (m === "sembunyi" || m === "sembunyi-b") { if (await tulis(() => api((m === "sembunyi" ? U(nid) : B(nid)) + "/sembunyi", { metode: "POST", badan: { sembunyi: tom.dataset.ke === "1" } }))) segarkan(); return; }
  });
  akar.addEventListener("change", (e) => {
    if (e.target.id === "kfSaring") { S.saring = e.target.value; S.hal = 1; nanti(gambarPanel); }
    else if (e.target.id === "kfUrut") { S.urut = e.target.value; S.hal = 1; nanti(gambarPanel); }
  });
  akar.addEventListener("keydown", (e) => { if (e.key === "Escape") { sembunyiMenu(); if (S.laci && innerWidth <= 900) { S.laci = false; akar.querySelector("#kfBaca")?.classList.remove("kf-buka"); } } });
  akar.addEventListener("submit", async (e) => {
    const form = e.target.closest("form[data-form]"); if (!form) return;
    e.preventDefault();
    const fd = new FormData(form), jenis = form.dataset.form, v = (k) => String(fd.get(k) ?? "").trim();
    const wajib = (k) => { if (!v(k)) { galatForm(form, { kode: "salah-masukan" }); return false; } return true; };
    if (jenis === "baru") {
      const f = S.form; if (!wajib("isi")) return;
      if (["ubah", "tambah", "butir_baru"].includes(f.jenis) && !wajib("teks_ganti")) return;
      const badan = { jenis: f.jenis, isi: v("isi"), sebut: idSebut(v("isi")) };
      if (f.bagian_id != null) badan.bagian_id = f.bagian_id;
      if (f.kutipan && f.jenis !== "butir_baru") Object.assign(badan, { kutipan: f.kutipan, mulai: f.mulai, akhir: f.akhir });
      if (f.jenis === "butir_baru" && v("kutipan")) badan.kutipan = v("kutipan");
      if (fd.has("teks_ganti")) badan.teks_ganti = v("teks_ganti");
      if (f.jenis === "tambah") badan.sisip = v("sisip");
      if (await tulis(async () => { const r = await api(`/api/konsultasi/${encodeURIComponent(id)}/utas`, { metode: "POST", badan }); S.aktif = r.id; }, form)) { S.form = null; S.saring = "semua"; S.skop = { b: f.bagian_id ?? (f.jenis === "butir_baru" ? null : "umum") }; await segarkan({ laci: true }); }
    } else if (jenis === "balas") {
      if (!wajib("isi")) return;
      if (await tulis(() => api(U(S.balas) + "/balasan", { metode: "POST", badan: { isi: v("isi"), sebut: idSebut(v("isi")) } }), form)) { S.balas = null; await segarkan(); }
    } else if (jenis === "ubah-u") {
      if (!wajib("isi")) return;
      const nid = Number(S.sunting.slice(1));
      if (await tulis(() => api(U(nid), { metode: "PATCH", badan: { isi: v("isi") } }), form)) { S.sunting = null; await segarkan(); }
    } else if (jenis === "putus") {
      const aksi = v("aksi");
      if (aksi !== "diterima" && !v("catatan")) return galatForm(form, { kode: "salah-masukan" });
      if (await tulis(() => api(U(form.dataset.id) + "/putus", { metode: "POST", badan: { aksi, catatan: v("catatan") || null, gabung_ke: aksi === "digabung" ? Number(v("gabung_ke")) : null } }), form)) { S.putus = null; await segarkan(); }
    }
  });
  rangka();
  pasangMention();
  if (bagianAwal) nanti(() => akar.querySelector("#b" + bagianAwal)?.scrollIntoView({ block: "start" }));
}
