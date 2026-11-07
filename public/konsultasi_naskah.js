/* Penampil naskah forum Konsultasi: daftar isi kiri (lengket), naskah di tengah, panel diskusi kanan (lengket, lebar bisa ditarik; laci bawah di ponsel).
   Pilih teks -> menu melayang (sorot + komentar, usul ubah, coret, tambah). INP: klik/pilih mengubah chrome seketika, render berat lewat nanti(). */
import { t, angka, tanggal, tanggalDariUnix, jam } from "/i18n.js";
import { esc, api, nanti, debounce, ikon, hantuHtml, kosongHtml, galatHtml, galatTeks } from "/inti/umum.js";
import { pilihHtml } from "/inti/komponen.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { tombolIkuti, pasangIkuti } from "/inti/ikuti.js";
import { segmen, labelBagian, susunRekap } from "/inti/naskah.js";

const HAL = 15, UBAHAN = ["ubah", "coret", "tambah"], USULAN = [...UBAHAN, "butir_baru"];
const IK = { setuju: "centang", tanya: "info", usul: "ubah", sorot: "insight", komentar: "berita", ubah: "ubah", coret: "silang", tambah: "tambah", butir_baru: "daftar", umum: "kajian", dukung: "bintang", selesai: "centang", balas: "balik", sembunyi: "blokir", putus: "palu", rekap: "tabel", unduh: "unduh", cetak: "pdf", peserta: "orang" };
const IK_JENIS = { ruu: "palu", rpp: "regulasi", rperpres: "perisai", rpermen: "gedung", masukan: "surel" };
const KELAS_STATUS = { terbuka: "", diterima: "jm-pil-ok", ditolak: "jm-pil-bad", digabung: "jm-pil-warn" };
const inisial = (n) => (String(n || "?").trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("") || "?").toLocaleUpperCase();
const kunciLebar = "kf_lebar_panel";
const simpanLokal = (k, v) => { try { localStorage.setItem(k, v); } catch { /* mode privat: abaikan */ } };
const bacaLokal = (k) => { try { return localStorage.getItem(k); } catch { return null; } };

export async function bukaDokumen(akar, id, { tutup, bagianAwal = null }) {
  const S = { id, d: null, mode: "baca", skop: bagianAwal ? { b: bagianAwal } : { b: null }, saring: "semua", urut: "baru", hal: 1, form: null, aktif: null, balas: null, putus: null, sunting: null, rekap: null, pilih: null, laci: false, buka: null, nav: null, q: "", isiBuka: false, pre: "komentar", kunci: 0 };
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
  /* penanda jenis tanggapan cepat: dipetakan ke jenis "umum" yang sudah ada, ditandai awalan di isi */
  const MARKA = /^\[(setuju|tanya|usul)\]\s*/i;
  const penanda = (u) => (u.isi && u.jenis === "umum" ? (u.isi.match(MARKA)?.[1] || "").toLowerCase() : "");
  const bersih = (s) => String(s ?? "").replace(MARKA, "");
  const jn = (u) => penanda(u) || u.jenis;
  const statusButir = (b) => { const s = String(b.status_asal || "").toLowerCase(); return /priorit/.test(s) ? "prioritas" : /sampai/.test(s) ? "disampaikan" : ""; };
  const IKS = { prioritas: "peringatan", disampaikan: "centang" };
  const utasDi = (bid) => S.d.utas.filter((u) => !u.tersembunyi && (bid === "umum" ? u.bagian_id == null : u.bagian_id === bid));
  const angkaReaksi = (bid) => { const l = utasDi(bid); return { setuju: l.filter((u) => penanda(u) === "setuju").length, usul: l.filter((u) => UBAHAN.includes(u.jenis) || penanda(u) === "usul").length, komentar: l.filter((u) => !UBAHAN.includes(u.jenis) && !["setuju", "usul"].includes(penanda(u)) && u.jenis !== "butir_baru").length + l.filter((u) => u.jenis === "butir_baru").length, nama: [...new Set(l.map((u) => u.nama || t("kf.anggota")))] }; };
  function terlihat(b) {
    if (b.tingkat === "bab") return S.saring === "semua" && !S.q;
    if (S.saring === "prioritas" || S.saring === "disampaikan") { if (statusButir(b) !== S.saring) return false; }
    else if (S.saring === "diskusi" && !utasDi(b.id).length) return false;
    if (S.q) { const q = S.q.toLocaleLowerCase(); if (![b.nomor, b.judul, b.teks, b.rujukan].some((x) => String(x || "").toLocaleLowerCase().includes(q))) return false; }
    return true;
  }
  const reaksiHtml = (bid) => {
    const n = angkaReaksi(bid), buka = S.buka === bid;
    const tb = (j, ik, v) => `<button type="button" class="kf-reaksi" data-skop="${bid}" data-jenis="${j}" aria-expanded="${buka}">${ikon(ik, 16)}<span>${esc(t("kf.r." + j))}</span><b class="${v ? "" : "kf-nol"}">${angka(v)}</b></button>`;
    return `<footer class="kf-kaki"><div class="kf-reaksi-baris">${tb("setuju", "centang", n.setuju)}${tb("usul", "ubah", n.usul)}${tb("komentar", "berita", n.komentar)}</div>
      <div class="kf-avatar" aria-label="${esc(t("kf.n_peserta"))}">${n.nama.slice(0, 4).map((x) => `<span class="kf-av" title="${esc(x)}">${esc(inisial(x))}</span>`).join("")}${n.nama.length > 4 ? `<span class="kf-av kf-av-lebih">+${angka(n.nama.length - 4)}</span>` : ""}</div></footer>
      ${buka ? tanggapHtml(bid) : ""}`;
  };
  function bagianHtml(b) {
    const pilih = S.buka === b.id ? " kf-pilih" : "";
    if (b.tingkat === "bab") return `<section class="kf-bag kf-bag-bab" id="b${b.id}" data-b="${b.id}"><h3>${esc(labelBagian(b))}${b.judul ? ": " + esc(b.judul) : ""}</h3></section>`;
    const st = statusButir(b), isButir = S.d.dokumen.bentuk === "butir";
    const judul = isButir ? b.judul || "" : b.tingkat === "pasal" ? labelBagian(b) + (b.judul ? ": " + b.judul : "") : "";
    const pilStatus = st ? `<span class="jm-pil kf-st kf-st-${st}">${ikon(IKS[st], 14)}<span>${esc(b.status_asal)}</span></span>` : b.status_asal ? `<span class="jm-pil">${esc(b.status_asal)}</span>` : "";
    const meta = (ik, k, v) => `<li>${ikon(ik, 16)}<b>${esc(t(k))}</b><span>${esc(v)}</span></li>`;
    const mt = [b.rujukan && meta("regulasi", "kf.rujukan", b.rujukan), b.sumber_asal && meta("buku", "kf.sumber", b.sumber_asal), b.alasan && meta("info", "kf.alasan", b.alasan)].filter(Boolean).join("");
    return `<article class="kf-bag${pilih}" id="b${b.id}" data-b="${b.id}"><div class="kf-bag-kepala"><span class="kf-no${b.tingkat === "ayat" ? " kf-no-kecil" : ""}">${esc(b.nomor || "")}</span>${judul ? `<h3>${esc(judul)}</h3>` : ""}${pilStatus}</div>
      ${b.teks ? `${isButir ? `<p class="kf-label">${esc(t("kf.usulan_meti"))}</p>` : ""}<p class="kf-teks" data-teks="${b.id}">${teksHtml(b)}</p>` : ""}
      ${mt ? `<ul class="kf-meta-baris">${mt}</ul>` : ""}${reaksiHtml(b.id)}</article>`;
  }
  const umumHtml = () => `<article class="kf-bag kf-umum${S.buka === "umum" ? " kf-pilih" : ""}" id="bumum" data-b="umum"><div class="kf-bag-kepala"><span class="kf-no">${ikon("berita", 18)}</span><h3>${esc(t("kf.umum_judul"))}</h3></div><p class="kf-label">${esc(t("kf.umum_bantu"))}</p>${reaksiHtml("umum")}</article>`;

  const urlBagian = (id) => { const u = new URL(location.href); u.searchParams.set("kd", S.id); u.searchParams.set("kb", id); return u.pathname + u.search + u.hash; };
  function daftarIsi() {
    const butir = S.d.dokumen.bentuk === "butir";
    const baris = S.d.bagian.filter((b) => (butir || b.tingkat !== "ayat") && terlihat(b)).map((b) => {
      const n = utasDi(b.id).length, st = statusButir(b), cur = S.nav === b.id ? ' aria-current="true"' : "";
      const l = b.tingkat === "bab" ? labelBagian(b) + (b.judul ? ": " + b.judul : "") : butir ? b.judul || "" : labelBagian(b);
      return `<a href="${esc(urlBagian(b.id))}" data-isi="${b.id}" title="${esc(l)}"${cur} class="${b.tingkat === "bab" ? "kf-bab" : ""}">${b.tingkat === "bab" ? "" : `<span class="kf-nb">${esc(butir ? b.nomor : b.tingkat === "pasal" ? b.nomor : "")}</span>`}<span class="kf-nj">${esc(l)}</span>${st ? `<i class="kf-titik kf-titik-${st}" aria-hidden="true"></i>` : ""}${n ? `<span class="kf-n">${angka(n)}</span>` : ""}</a>`;
    }).join("");
    return `<button type="button" class="kf-isi-tgl" data-m="isi-tgl" aria-expanded="${S.isiBuka}">${ikon("daftar", 16)}<span>${esc(t("kf.daftar_isi"))}</span></button><div class="kf-isi-l"><h3>${esc(t("kf.daftar_isi"))}</h3>${baris}</div>`;
  }

  /* ---------- panel ---------- */
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
    const kepala = `<div class="kf-utas-kepala"><span class="kf-av" aria-hidden="true">${esc(inisial(u.nama))}</span><b>${esc(u.nama || t("kf.anggota"))}</b><span>${esc(waktu(u.dibuat))}</span><span class="jm-pil">${ikon(IK[jn(u)], 14)}${esc(t("kf.jenis." + jn(u)))}</span>${usul ? `<span class="jm-pil ${KELAS_STATUS[u.status]}">${esc(t("kf.status." + u.status))}</span>` : ""}${u.selesai ? `<span class="jm-pil jm-pil-ok">${ikon(IK.selesai, 14)}${esc(t("kf.selesai"))}</span>` : ""}${u.tersembunyi ? `<span class="jm-pil jm-pil-warn">${esc(t("kf.tersembunyi"))}</span>` : ""}</div>`;
    if (u.isi == null) return `<article class="kf-utas" data-u="${u.id}">${kepala}<p class="kf-sembunyi">${esc(t("kf.disembunyikan"))}</p></article>`;
    const ganti = u.teks_ganti ? `<p class="kf-ganti"><b>${esc(t(u.jenis === "tambah" ? (u.sisip === "sebelum" ? "kf.sisip_sebelum" : "kf.sisip_sesudah") : u.jenis === "butir_baru" ? "kf.butir_usul" : "kf.menjadi"))}</b> ${esc(u.teks_ganti)}</p>` : "";
    const kutip = u.kutipan ? `<p class="kf-kutip">${esc(u.kutipan)}</p>` : "";
    const lokasi = "";
    const aksi = `<div class="kf-aksi"><button type="button" data-m="balas" data-id="${u.id}">${ikon(IK.balas, 16)}<span>${esc(t("kf.balas"))}${u.balasan.length ? " " + angka(u.balasan.length) : ""}</span></button>
      ${usul ? `<button type="button" data-m="dukung" data-id="${u.id}" aria-pressed="${u.saya_dukung}">${ikon(IK.dukung, 16)}<span>${esc(t("kf.dukung"))} ${angka(u.dukung)}</span></button>` : ""}
      ${u.milik || staf() ? `<button type="button" data-m="selesai" data-id="${u.id}" aria-pressed="${u.selesai}">${ikon(IK.selesai, 16)}<span>${esc(t(u.selesai ? "kf.buka_lagi" : "kf.tandai_selesai"))}</span></button>` : ""}
      ${bisaSunting(u) ? `<button type="button" data-m="sunting" data-id="${u.id}">${ikon(IK.ubah, 16)}<span>${esc(t("kf.sunting"))}</span></button><button type="button" data-m="tarik" data-id="${u.id}">${ikon(IK.coret, 16)}<span>${esc(t("kf.tarik"))}</span></button>` : ""}
      ${staf() && usul ? `<button type="button" data-m="putus" data-id="${u.id}">${ikon(IK.putus, 16)}<span>${esc(t(u.status === "terbuka" ? "kf.putuskan" : "kf.ubah_putusan"))}</span></button>` : ""}
      ${staf() ? `<button type="button" data-m="sembunyi" data-id="${u.id}" data-ke="${u.tersembunyi ? 0 : 1}">${ikon(IK.sembunyi, 16)}<span>${esc(t(u.tersembunyi ? "kf.tampilkan" : "kf.sembunyikan"))}</span></button>` : ""}</div>`;
    const putusan = u.putusan || u.diputus_nama ? `<p class="jm-bantu">${esc(t("kf.putusan_oleh", { nama: u.diputus_nama || "-" }))}${u.putusan ? ": " + esc(u.putusan) : ""}${u.gabung_ke ? " " + esc(t("kf.digabung_ke", { n: u.gabung_ke })) : ""}</p>` : "";
    return `<article class="kf-utas${aktif}${u.selesai ? " kf-selesai" : ""}" data-u="${u.id}" id="u${u.id}">${kepala}${lokasi}${kutip}${ganti}
      ${ta ? formHtml("ubah-u", { label: t("kf.isi"), maks: 4000, bawaan: u.isi }) : `<p class="kf-isi-utas">${sebutHtml(bersih(u.isi))}</p>`}${putusan}${aksi}
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
  function tanggapHtml(bid) {
    const l = utasDi(bid).sort((a, b) => b.id - a.id), f = S.form;
    const komposer = f && (f.bagian_id ?? "umum") === bid ? composerHtml() : "";
    const pre = S.pre || "komentar";
    const radio = ["komentar", "setuju", "usul", "tanya"].map((v) => `<label><input type="radio" name="jn" value="${v}"${v === pre ? " checked" : ""}> ${esc(t("kf.t." + v))}</label>`).join("");
    return `<div class="kf-utas-wadah" id="t${bid}">${komposer}
      <form class="kf-form kf-cepat" data-form="cepat" data-b="${bid}" novalidate><div class="kf-radio" role="radiogroup" aria-label="${esc(t("kf.jenis_tanggapan"))}">${radio}</div>
        <textarea name="isi" maxlength="3900" rows="2" placeholder="${esc(t("kf.tulis_ph"))}" aria-label="${esc(t("kf.isi"))}"></textarea><div data-sebut></div><p class="jm-bantu" data-galat role="alert" hidden></p>
        <div class="kf-form-aksi"><button type="submit" class="jm-tbl jm-tbl-utama jm-tbl-kecil"><span>${esc(t("kf.kirim"))}</span></button></div></form>
      ${l.length ? l.map(utasHtml).join("") : `<p class="kf-kosong-satu">${esc(t("kf.kosong_satu"))}</p>`}</div>`;
  }

  const butir = () => S.d.dokumen.bentuk === "butir";
  function kepalaHtml() {
    const dk = S.d.dokumen, bag = S.d.bagian.filter((b) => b.tingkat !== "bab");
    const nama = new Set(); for (const u of S.d.utas) { if (u.tersembunyi) continue; nama.add(u.nama || ""); for (const r of u.balasan) nama.add(r.nama || ""); }
    const ub = (n, k) => `<li><b class="${n ? "" : "kf-nol"}">${angka(n)}</b><span>${esc(t(k))}</span></li>`;
    const pil = (ik, v) => `<span class="jm-pil">${ikon(ik, 14)}${esc(v)}</span>`;
    return `<header class="kf-kepala"><div class="kf-kepala-atas"><button type="button" class="jm-tbl jm-tbl-kecil" data-m="kembali">${ikon("panah-kiri", 16)}<span>${esc(t("kf.kembali"))}</span></button>${tombolIkuti({ jenis: "regulasi", id: "kons:" + dk.id, nama: dk.judul })}</div>
      <div class="kf-kepala-judul"><span class="kf-ik-besar">${ikon(IK_JENIS[dk.jenis] || "regulasi", 28)}</span><div><h2>${esc(dk.judul)}</h2><div class="kf-meta">${pil("palu", t("kf.jenis_dok." + dk.jenis))}${dk.instansi ? pil("gedung", dk.instansi) : ""}${dk.tenggat ? pil("kalender", `${t("kons.tenggat")}: ${tanggal(dk.tenggat)}`) : ""}</div></div></div>
      <ul class="kf-ubin">${ub(bag.length, "kf.u.butir")}${ub(bag.filter((b) => statusButir(b) === "prioritas").length, "kf.u.prioritas")}${ub(bag.filter((b) => statusButir(b) === "disampaikan").length, "kf.u.disampaikan")}${ub(S.d.utas.filter((u) => !u.tersembunyi).length, "kf.u.tanggapan")}${ub(nama.size, "kf.u.peserta")}</ul></header>
      <div class="jm-tab jm-tab-rata kf-mode" role="tablist" aria-label="${esc(t("kf.mode"))}">${["baca", "rekap"].map((m) => `<button type="button" role="tab" data-mode="${m}" aria-selected="${S.mode === m}">${ikon(m === "baca" ? "buku" : IK.rekap, 16)}<span>${esc(t("kf.mode." + m))}</span></button>`).join("")}</div>`;
  }
  function saringHtml() {
    const hit = { semua: 0, prioritas: 0, disampaikan: 0, diskusi: 0 };
    for (const b of S.d.bagian) if (b.tingkat !== "bab") { hit.semua++; if (statusButir(b)) hit[statusButir(b)]++; if (utasDi(b.id).length) hit.diskusi++; }
    return `<div class="kf-alat"><div class="jm-tab jm-tab-rata kf-saring-tab" role="tablist" aria-label="${esc(t("kf.saring"))}">${["semua", "prioritas", "disampaikan", "diskusi"].map((k) => `<button type="button" role="tab" data-saring="${k}" aria-selected="${S.saring === k}"><span>${esc(t("kf.sg." + k))}</span><b>${angka(hit[k])}</b></button>`).join("")}</div>
      <div class="kf-alat-baris"><label class="kf-cari">${ikon("cari", 16)}<input type="search" id="kfCari" class="jm-isian" value="${esc(S.q)}" placeholder="${esc(t("kf.cari_butir"))}" aria-label="${esc(t("kf.cari_butir"))}"></label>
      <button type="button" class="jm-tbl" data-baru="butir_baru">${ikon("tambah", 16)}<span>${esc(t("kf.usul_butir"))}</span></button></div></div>`;
  }
  function isiNaskah() {
    const l = S.d.bagian.filter(terlihat);
    return (l.length ? l.map(bagianHtml).join("") : `<div class="kf-bag">${kosongHtml("kf.tak_ada_butir")}</div>`) + (S.saring === "semua" || S.saring === "diskusi" ? umumHtml() : "");
  }
  let pengamat = null;
  function pasangPengamat() {
    pengamat?.disconnect();
    if (!("IntersectionObserver" in window)) return;
    pengamat = new IntersectionObserver((es) => {
      if (Date.now() < S.kunci) return;
      const e = es.filter((x) => x.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (e && e.target.dataset.b !== "umum") tandaiNav(Number(e.target.dataset.b));
    }, { rootMargin: "-80px 0px -70% 0px" });
    akar.querySelectorAll(".kf-bag[data-b]").forEach((x) => pengamat.observe(x));
  }
  function tandaiNav(bid) {
    S.nav = bid;
    for (const a of akar.querySelectorAll(".kf-isi a")) {
      const on = Number(a.dataset.isi) === bid;
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      if (on && a.offsetParent) { const w = a.closest(".kf-isi-l"); if (w && w.scrollHeight > w.clientHeight) w.scrollTop = a.offsetTop - w.clientHeight / 2; }
    }
  }
  function rangka() {
    const kosongNaskah = !S.d.bagian.length;
    if (S.mode === "rekap") { akar.innerHTML = kepalaHtml() + `<div id="kfRekap">${hantuHtml(4)}</div>`; pasangIkuti(akar); muatRekap(); return; }
    akar.innerHTML = kepalaHtml() + (kosongNaskah ? "" : saringHtml()) + `<div id="kfKabarLuar"></div><p id="kfKabar" class="jm-bantu" role="status" hidden></p><div class="kf-baca" id="kfBaca">
      <nav class="kf-isi" aria-label="${esc(t("kf.daftar_isi"))}">${kosongNaskah ? "" : daftarIsi()}</nav><div class="kf-naskah" id="kfNaskah">${kosongNaskah ? `<div class="kf-bag">${kosongHtml(butir() ? "kf.kosong_butir" : "kf.naskah_belum")}${staf() ? `<div class="kf-aksi"><button type="button" class="jm-tbl jm-tbl-utama" data-m="kelola">${ikon(IK.unduh, 16)}<span>${esc(t("kf.unggah_naskah"))}</span></button></div>` : ""}</div>` : isiNaskah()}</div></div>
      <div class="kf-menu-sorot" id="kfMenu" role="toolbar" aria-label="${esc(t("kf.menu"))}" hidden>${["komentar", "ubah", "coret", "tambah"].map((j) => `<button type="button" data-pilih="${j}">${ikon(IK[j], 16)}<span>${esc(t("kf.menu." + j))}</span></button>`).join("")}</div>`;
    pasangIkuti(akar); pasangPengamat();
  }
  /* render ulang naskah + daftar isi (mis. sesudah saring atau kiriman); tanpa menyentuh kepala */
  function gambarNaskah() {
    const el = akar.querySelector("#kfNaskah"); if (!el || !S.d.bagian.length) return;
    el.innerHTML = isiNaskah(); pasangMention(); pasangPengamat();
    const nv = akar.querySelector(".kf-isi"); if (nv) nv.innerHTML = daftarIsi();
  }
  const gambarPanel = gambarNaskah;

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
    S.form = { jenis, ...ekstra }; S.balas = S.putus = S.sunting = null;
    S.buka = ekstra.bagian_id ?? "umum"; sembunyiMenu(); getSelection()?.removeAllRanges?.();
    gambarNaskah();
    const k = akar.querySelector("#b" + S.buka); k?.scrollIntoView({ block: "nearest" });
    akar.querySelector(`#t${S.buka} form[data-form=baru] textarea`)?.focus();
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

  /* ---------- aksi ---------- */
  const segarkan = async (opsi = {}) => { if (await muat()) { gambarNaskah(); } };
  const galatForm = (form, e) => { const g = form.querySelector("[data-galat]"); if (g) { g.textContent = galatTeks(e.kode || "umum"); g.hidden = false; } form.querySelectorAll("button").forEach((b) => (b.disabled = false)); };
  const tulis = async (fn, form) => { form?.querySelectorAll("button").forEach((b) => (b.disabled = true)); try { await fn(); return true; } catch (e) { if (form) galatForm(form, e); else kabar(galatTeks(e.kode || "umum")); return false; } };
  const U = (n) => `/api/konsultasi/utas/${n}`, B = (n) => `/api/konsultasi/balasan/${n}`;

  akar.addEventListener("click", async (e) => {
    const c = e.target;
    let el;
    if ((el = c.closest("[data-aksi=ulang]"))) return bukaDokumen(akar, id, { tutup, bagianAwal });
    if ((el = c.closest("[data-mode]"))) { S.mode = el.dataset.mode; return nanti(rangka); }
    if ((el = c.closest("[data-pilih]"))) { const p = S.pilih; if (!p) return; return bukaForm(el.dataset.pilih === "komentar" ? "sorot" : el.dataset.pilih, { bagian_id: p.bagian, kutipan: p.kutipan, mulai: p.mulai, akhir: p.akhir }); }
    if ((el = c.closest("[data-saring]"))) { S.saring = el.dataset.saring; el.parentElement.querySelectorAll("[role=tab]").forEach((x) => x.setAttribute("aria-selected", String(x === el))); return nanti(gambarNaskah); }
    if ((el = c.closest("[data-baru]"))) return bukaForm(el.dataset.baru, {});
    if ((el = c.closest("[data-skop]"))) {
      const v = el.dataset.skop === "umum" ? "umum" : Number(el.dataset.skop), tutupLagi = S.buka === v && (S.pre === el.dataset.jenis || !el.dataset.jenis);
      S.pre = el.dataset.jenis || S.pre; S.buka = tutupLagi ? null : v; S.form = null;
      const k = el.closest(".kf-bag"); k?.querySelectorAll(".kf-reaksi").forEach((x) => x.setAttribute("aria-expanded", String(!tutupLagi)));
      return nanti(() => { gambarNaskah(); if (!tutupLagi) { const ta = akar.querySelector(`#t${v} form[data-form=cepat] textarea`); ta?.focus({ preventScroll: true }); } });
    }
    if ((el = c.closest("[data-isi]"))) {
      e.preventDefault(); const bid = Number(el.dataset.isi), tujuan = akar.querySelector("#b" + bid);
      S.kunci = Date.now() + 900; tandaiNav(bid); S.isiBuka = false; akar.querySelector(".kf-isi-tgl")?.setAttribute("aria-expanded", "false"); akar.querySelector(".kf-isi")?.classList.remove("kf-isi-buka");
      history.replaceState(null, "", urlBagian(bid)); // ?kb=, bukan #hash: hash dipakai tab halaman (#konsultasi)
      return tujuan?.scrollIntoView({ block: "start" });
    }
    if ((el = c.closest("mark[data-u],del[data-u],ins[data-u]"))) { S.aktif = Number(el.dataset.u); const u = S.d.utas.find((x) => x.id === S.aktif); S.buka = u ? u.bagian_id ?? "umum" : S.buka; return nanti(() => { gambarNaskah(); akar.querySelector("#u" + S.aktif)?.scrollIntoView({ block: "center" }); }); }
    if ((el = c.closest("[data-sebut-id]"))) return sisipSebut(el);
    const m = c.closest("[data-m]")?.dataset.m, tom = c.closest("[data-m]");
    if (!m) return;
    const nid = Number(tom.dataset.id);
    if (m === "kembali") return tutup();
    if (m === "isi-tgl") { S.isiBuka = !S.isiBuka; tom.setAttribute("aria-expanded", String(S.isiBuka)); return akar.querySelector(".kf-isi")?.classList.toggle("kf-isi-buka", S.isiBuka); }
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
  akar.addEventListener("input", debounce((e) => { if (e.target.id === "kfCari") { S.q = e.target.value.trim(); nanti(gambarNaskah); } }, 150));
  akar.addEventListener("keydown", (e) => { if (e.key === "Escape") { sembunyiMenu(); if (S.isiBuka) { S.isiBuka = false; akar.querySelector(".kf-isi")?.classList.remove("kf-isi-buka"); } } });
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
      if (await tulis(async () => { const r = await api(`/api/konsultasi/${encodeURIComponent(id)}/utas`, { metode: "POST", badan }); S.aktif = r.id; }, form)) { S.form = null; S.buka = f.bagian_id ?? "umum"; await segarkan(); }
    } else if (jenis === "cepat") {
      const jn2 = v("jn"), bid = form.dataset.b === "umum" ? null : Number(form.dataset.b);
      if (jn2 !== "setuju" && !wajib("isi")) return;
      const isi = (["setuju", "usul", "tanya"].includes(jn2) ? `[${jn2}] ` : "") + v("isi");
      const badan = { jenis: "umum", isi: isi.trim(), sebut: idSebut(v("isi")) };
      if (bid != null) badan.bagian_id = bid;
      if (await tulis(async () => { const r = await api(`/api/konsultasi/${encodeURIComponent(id)}/utas`, { metode: "POST", badan }); S.aktif = r.id; }, form)) { S.pre = "komentar"; await segarkan(); }
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
  if (bagianAwal) nanti(() => { tandaiNav(bagianAwal); akar.querySelector("#b" + bagianAwal)?.scrollIntoView({ block: "start" }); });
}
