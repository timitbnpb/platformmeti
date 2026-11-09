/* /admin: tab Agenda (K20, JM-F11). Bukti kegiatan METI: tempat, notulensi, foto. Hak ditegakkan di server (DT §4.4).
   INP: klik baris/tombol mengubah chrome seketika; kisi foto dan tabel dirender lewat nanti(). */
import { t, ada, angka, tanggal } from "/i18n.js";
import { cariHtml, pilihHtml, hitungHtml } from "/inti/komponen.js";
import { esc, api, nanti, debounce, hantuHtml, kosongHtml, galatHtml, galatTeks, ikon, pesanHtml, GalatApi } from "/inti/umum.js";

const MAKS_NOTULEN = 30000;
const SISI = 2000;
const TIPE = ["image/jpeg", "image/png", "image/webp"];
const DOK_EKS = ["pdf", "pptx", "docx", "xlsx"];
const MAKS_DOK = 20 * 1024 * 1024;
const MIME_DOK = { pdf: "application/pdf", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
const JENIS_BARU = ["audiensi", "seminar", "konferensi", "lokakarya", "rapat", "kunjungan", "lainnya"];
const ekstensi = (n) => (String(n).split(".").pop() || "").toLowerCase();
const ukuranTeks = (b) => (b >= 1048576 ? t("pu.mb", { n: angka(Math.round(b / 104857.6) / 10) }) : t("pu.kb", { n: angka(Math.max(1, Math.round(b / 1024))) }));
const label = (j) => (ada("kal.jenis." + j) ? t("kal.jenis." + j) : j || "");

export function panelAgenda(el, saya) {
  const bisaTulis = !!saya && ["admin", "super"].includes(saya.peran); // kurator: baca saja (keputusan pemilik)
  const S = { acara: null, bukti: new Map(), cari: "", jenis: "", notulen: "", urut: "tgl", arah: -1, ref: "", ctl: null };
  const $ = (id) => el.querySelector("#" + id);
  const dlg = document.getElementById("dlg");
  const kabar = (jenis, teks) => { const s = $("agStatus"); if (s) s.innerHTML = teks ? pesanHtml(jenis, teks) : ""; };

  el.innerHTML = `<div id="agHost"></div><div id="agStatus" aria-live="polite"></div>`;
  const host = $("agHost");
  host.addEventListener("click", klik);
  host.addEventListener("input", masuk);
  host.addEventListener("change", ubah);
  const cariTunda = debounce(() => isiTabel());
  muatDaftar();

  /* GET /api/agenda: daftar butir (ref, foto_n, dok_n, ada_notulensi); kunci lama {bukti:[...]} tetap dibaca */
  const butirAgenda = (ag) => (Array.isArray(ag) ? ag : (ag && (ag.daftar || ag.kegiatan || ag.items)) || []).map((x) => ({ ...x, ref: x.ref || x.kegiatan_ref }));
  const petaBukti = (ag) => new Map([...((ag && Array.isArray(ag.bukti) ? ag.bukti : []).map((x) => ({ ...x, ref: x.kegiatan_ref }))), ...butirAgenda(ag)]
    .map((x) => [x.ref, { ref: x.ref, ada_notulensi: !!x.ada_notulensi, jumlah_foto: x.foto_n ?? x.jumlah_foto ?? 0, dok_n: x.dok_n ?? 0 }]));

  async function muatDaftar() {
    if (S.ctl) S.ctl.abort();
    S.ctl = new AbortController();
    host.innerHTML = hantuHtml(5);
    try {
      const [kal, ag] = await Promise.all([
        fetch("/data/kalender.json", { signal: S.ctl.signal }).then((r) => { if (!r.ok) throw new GalatApi("layanan", r.status); return r.json(); }),
        api("/api/agenda", { signal: S.ctl.signal }),
      ]);
      const arsip = (kal.baris || []).filter((b) => b.sumber && (b.sumber.label === "arsip-meti" || (/^ac_/.test(b.id || "") && Array.isArray(b.sumber) && b.sumber.some((x) => x && x.label === "situs-meti")))).map((b) => ({ ...b, sumber_tipe: "arsip" }));
      const ada = new Set(arsip.map((b) => b.id));
      const tambahan = butirAgenda(ag).filter((x) => (x.sumber === "admin" || /^k-/.test(x.ref)) && !ada.has(x.ref))
        .map((x) => ({ id: x.ref, judul: x.judul, tanggal: x.tanggal, tanggal_selesai: x.tanggal_selesai, jenis: x.jenis, tempat: x.tempat, sumber_tipe: "admin" }));
      S.acara = [...arsip, ...tambahan].sort((a, c) => c.tanggal.localeCompare(a.tanggal));
      S.bukti = petaBukti(ag);
    } catch (e) {
      if (e.name === "AbortError") return;
      host.innerHTML = galatHtml(e.kode || "umum");
      return;
    }
    nanti(rangkaDaftar);
  }

  function rangkaDaftar() {
    S.ref = "";
    const jenis = [...new Set(S.acara.map((b) => b.jenis).filter(Boolean))].sort();
    host.innerHTML = `<section class="jm-adm-kartu"><header class="jm-adm-kh">${ikon("kalender", 20)}<h3>${esc(t("adm.agenda.judul_kartu"))}</h3>${hitungHtml({ id: "agHitung", teks: "" })}${bisaTulis ? `<button type="button" class="jm-tbl jm-tbl-utama jm-tbl-kecil jm-ag-tambah" data-m="tambah">${ikon("tambah", 16)}${esc(t("adm.agenda.tambah"))}</button>` : ""}</header>
      <div class="jm-adm-isi"><div class="jm-saring jm-ag-bar">${cariHtml({ id: "agCari", label: t("adm.agenda.cari") })}
        ${pilihHtml({ id: "agJenis", ikon: "jenis", label: t("adm.agenda.f.jenis"), opsi: [["", t("adm.agenda.semua_jenis")], ...jenis.map((j) => [j, label(j)])], nilai: S.jenis })}
        ${pilihHtml({ id: "agNot", ikon: "status", label: t("adm.agenda.f.notulen"), opsi: [["", t("adm.agenda.semua_notulen")], ["ada", t("adm.agenda.notulen_ada")], ["belum", t("adm.agenda.notulen_belum")]], nilai: S.notulen })}</div>
      <div id="agDaftar" aria-live="polite"></div></div></section>`;
    $("agCari").value = S.cari;
    isiTabel();
  }

  const blokTgl = (iso) => { const [h, ...sisa] = tanggal(iso).split(" "); return `<span class="jm-ag-tgl"><b>${esc(h)}</b><small>${esc(sisa.join(" "))}</small></span>`; };
  /* status jelas: pil hijau berikon + teks pendek bila ada, pil abu bila belum; tooltip memuat keterangan lengkap */
  const ikonStatus = (ok, ik, teks, pendek) => `<span class="jm-pil ${ok ? "jm-pil-ok" : "jm-pil-mati"} jm-ag-st" title="${esc(teks)}">${ikon(ik, 14)}<span>${esc(pendek)}</span><span class="sr">${esc(teks)}</span></span>`;

  function isiTabel() {
    const d = $("agDaftar");
    if (!d) return;
    const q = S.cari.toLowerCase();
    const baris = S.acara.filter((b) => (!q || b.judul.toLowerCase().includes(q)) && (!S.jenis || b.jenis === S.jenis)
      && (!S.notulen || !!(S.bukti.get(b.id) || {}).ada_notulensi === (S.notulen === "ada")));
    baris.sort((a, c) => S.arah * (S.urut === "judul" ? a.judul.localeCompare(c.judul) : a.tanggal.localeCompare(c.tanggal)));
    $("agHitung").textContent = t("adm.agenda.n", { n: angka(baris.length) });
    if (!baris.length) { d.innerHTML = kosongHtml("jm.kosong.cocok"); return; }
    const th = (k, urut) => `<th scope="col"${urut ? "" : " data-urut=tidak"}${urut ? ` aria-sort="${S.urut === urut ? (S.arah > 0 ? "ascending" : "descending") : "none"}"` : ""}>${urut ? `<button type="button" class="jm-adm-urut" data-m="urut" data-k="${urut}">${esc(t("adm.agenda.k." + k))}</button>` : esc(t("adm.agenda.k." + k))}</th>`;
    d.innerHTML = `<div class="jm-gulir"><table class="jm-tabel jm-ag-tabel"><thead><tr>${th("tgl", "tgl")}${th("judul", "judul")}${th("jenis")}${th("sumber")}${th("foto")}${th("dok")}${th("notulen")}</tr></thead><tbody>${baris.map((b) => {
      const x = S.bukti.get(b.id), n = x ? x.jumlah_foto || 0 : 0, dn = x ? x.dok_n || 0 : 0, nt = !!(x && x.ada_notulensi);
      return `<tr class="jm-ag-baris" data-ref="${esc(b.id)}" tabindex="0">
        <td class="jm-nowrap" data-l="${esc(t("adm.agenda.k.tgl"))}">${blokTgl(b.tanggal)}</td>
        <td data-l="${esc(t("adm.agenda.k.judul"))}"><button type="button" class="jm-adm-nm" data-m="buka" data-ref="${esc(b.id)}"><strong>${esc(b.judul)}</strong></button>${b.mitra ? `<small class="jm-ag-mitra">${esc(b.mitra)}</small>` : ""}</td>
        <td data-l="${esc(t("adm.agenda.k.jenis"))}"><span class="jm-pil">${esc(label(b.jenis))}</span></td>
        <td data-l="${esc(t("adm.agenda.k.sumber"))}"><span class="jm-pil">${esc(t("adm.agenda.sumber." + b.sumber_tipe))}</span></td>
        <td class="jm-ag-c" data-l="${esc(t("adm.agenda.k.foto"))}">${ikonStatus(n > 0, "gambar", n ? t("adm.agenda.foto_n", { n: angka(n) }) : t("adm.agenda.foto_nol"), n ? angka(n) : t("adm.agenda.st_belum"))}</td>
        <td class="jm-ag-c" data-l="${esc(t("adm.agenda.k.dok"))}">${ikonStatus(dn > 0, "pdf", dn ? t("adm.agenda.dok_n", { n: angka(dn) }) : t("adm.agenda.dok_nol"), dn ? angka(dn) : t("adm.agenda.st_belum"))}</td>
        <td class="jm-ag-c" data-l="${esc(t("adm.agenda.k.notulen"))}">${ikonStatus(nt, "daftar", t(nt ? "adm.agenda.notulen_ada" : "adm.agenda.notulen_belum"), t(nt ? "adm.agenda.st_ada" : "adm.agenda.st_belum"))}</td></tr>`;
    }).join("")}</tbody></table></div>`;
  }

  /* ---------- penyunting ---------- */

  async function bukaEditor(ref) {
    const acara = S.acara.find((b) => b.id === ref);
    if (!acara) return;
    S.ref = ref;
    host.innerHTML = hantuHtml(4); // chrome seketika
    let det;
    try { det = await api("/api/agenda/" + encodeURIComponent(ref)); } catch (e) { host.innerHTML = galatHtml(e.kode || "umum"); return; }
    if (S.ref !== ref) return;
    nanti(() => gambarEditor(acara, det));
  }

  function gambarEditor(acara, det) {
    const b = det.bukti || {};
    host.dataset.ref = acara.id;
    const info = (ik, k, v) => (v ? `<li>${ikon(ik, 18)}<span><small>${esc(t(k))}</small><b>${esc(v)}</b></span></li>` : "");
    const milik = /^k-/.test(acara.id), kg = det.kegiatan || acara;
    const ro = bisaTulis ? "" : " readonly";
    const infoKartu = milik && bisaTulis
      ? `<div class="jm-adm-isi jm-form"><div class="jm-medan"><label for="kgNama">${esc(t("adm.agenda.f.nama"))}</label><input class="jm-isian" id="kgNama" maxlength="200" autocomplete="off" value="${esc(kg.judul || "")}"></div>
          <div class="jm-ag-dua"><div class="jm-medan"><label for="kgTgl">${esc(t("adm.agenda.f.tgl"))}</label><input class="jm-isian" id="kgTgl" type="date" value="${esc(kg.tanggal || "")}"></div>
          <div class="jm-medan"><label for="kgAkhir">${esc(t("adm.agenda.f.tgl_akhir"))}</label><input class="jm-isian" id="kgAkhir" type="date" value="${esc(kg.tanggal_selesai || "")}"></div></div>
          <div class="jm-medan"><label for="kgTempat">${esc(t("adm.agenda.tempat"))}</label><input class="jm-isian" id="kgTempat" maxlength="200" autocomplete="off" value="${esc(kg.tempat || b.tempat || "")}"></div>
          <div class="jm-medan"><label for="kgJenis">${esc(t("adm.agenda.fj"))}</label>${pilihHtml({ id: "kgJenis", ikon: "jenis", label: t("adm.agenda.fj"), opsi: JENIS_BARU.map((j) => [j, label(j)]), nilai: kg.jenis || "lainnya" })}</div>
          <div class="jm-aksi"><button type="button" class="jm-tbl jm-tbl-utama" data-m="simpan-keg" id="kgSimpan">${ikon("centang", 18)}${esc(t("adm.agenda.simpan_info"))}</button><button type="button" class="jm-tbl jm-tbl-bahaya" data-m="hapus-keg">${ikon("silang", 18)}${esc(t("adm.agenda.hapus_keg"))}</button></div></div>`
      : `<ul class="jm-ag-info">${info("daftar", "adm.agenda.k.judul", acara.judul)}${info("kalender", "adm.agenda.k.tgl", tanggal(acara.tanggal) + (acara.tanggal_selesai && acara.tanggal_selesai !== acara.tanggal ? " - " + tanggal(acara.tanggal_selesai) : ""))}${info("orang", "adm.agenda.k.mitra", acara.mitra)}${info("jenis", "adm.agenda.k.jenis", label(acara.jenis))}${milik ? info("lokasi", "adm.agenda.tempat", acara.tempat || b.tempat) : ""}</ul>`;
    const tempatMedan = milik && bisaTulis ? "" : `<div class="jm-medan"><label for="agTempat">${ikon("lokasi", 16)} ${esc(t("adm.agenda.tempat"))}</label><input class="jm-isian" id="agTempat" maxlength="200" autocomplete="off"${ro} value="${esc(b.tempat || "")}"></div>`;
    host.innerHTML = `<div class="jm-ag-ed">
      <form id="agForm" novalidate><div class="jm-ag-kol">
        <div class="jm-ag-kiri">
          <section class="jm-adm-kartu"><header class="jm-adm-kh">${ikon("info", 20)}<h3>${esc(t("adm.agenda.info"))}</h3></header>${infoKartu}</section>
          <section class="jm-adm-kartu"><header class="jm-adm-kh">${ikon("daftar2", 20)}<h3>${esc(t("adm.agenda.notulen"))}</h3></header>
            <div class="jm-adm-isi jm-form">${tempatMedan}
            <div class="jm-medan"><label for="agNotulen">${esc(t("adm.agenda.notulen"))}</label>
              <textarea class="jm-isian jm-ag-teks" id="agNotulen" rows="9" maxlength="${MAKS_NOTULEN}"${ro}>${esc(b.notulensi || "")}</textarea>
              <small class="jm-bantu" id="agHitungK" aria-live="polite"></small></div></div></section>
          ${dokKartu("meti")}
        </div>
        <div class="jm-ag-kiri">
        <section class="jm-adm-kartu jm-ag-foto" aria-labelledby="agFotoJ"><header class="jm-adm-kh">${ikon("gambar", 20)}<h3 id="agFotoJ">${esc(t("adm.agenda.foto"))}</h3></header>
          <div class="jm-adm-isi">${bisaTulis ? `<label class="jm-ag-zona" for="agBerkas">${ikon("unduh", 28)}<strong>${esc(t("adm.agenda.zona"))}</strong><small>${esc(t("adm.agenda.zona_bantu"))}</small>
            <input class="sr" id="agBerkas" type="file" multiple accept="image/jpeg,image/png,image/webp"></label>` : ""}
          <p class="jm-bantu" id="agProgres" role="status"></p>
          <div class="jm-ag-kisi" id="agKisi"></div></div></section>
          ${dokKartu("eksternal")}
        </div></div>
        ${bisaTulis ? `<div class="jm-ag-kaki"><button type="button" class="jm-tbl" data-m="kembali">${ikon("panah-kiri", 18)}${esc(t("adm.agenda.kembali"))}</button><button type="submit" class="jm-tbl jm-tbl-utama" id="agSimpan">${ikon("centang", 18)}${esc(t("jm.simpan"))}</button></div>`
          : `<div class="jm-ag-kaki jm-ag-kaki-satu"><button type="button" class="jm-tbl" data-m="kembali">${ikon("panah-kiri", 18)}${esc(t("adm.agenda.kembali"))}</button></div>`}
      </form></div>`;
    S.dok = det.dokumen || [];
    dokDaftar();
    hitungKar();
    kisi(det.foto || []);
  }

  const hitungKar = () => { const a = $("agNotulen"), h = $("agHitungK"); if (a && h) h.textContent = t("adm.agenda.karakter", { n: angka(a.value.length), maks: angka(MAKS_NOTULEN) }); };

  function kisi(foto) {
    const k = $("agKisi");
    if (!k) return;
    k.innerHTML = foto.length ? foto.map((f) => `<figure class="jm-ag-f" data-id="${esc(f.id)}">
        <img src="/api/agenda/foto/${encodeURIComponent(f.id)}" alt="${esc(f.keterangan || t("adm.agenda.foto"))}" loading="lazy" decoding="async">
        <div class="jm-medan"><label class="sr" for="agK${esc(f.id)}">${esc(t("adm.agenda.keterangan"))}</label>
          <input class="jm-isian" id="agK${esc(f.id)}" data-ket="${esc(f.id)}" maxlength="300" autocomplete="off"${bisaTulis ? "" : " readonly"} placeholder="${esc(t("adm.agenda.keterangan"))}" value="${esc(f.keterangan || "")}"></div>
        ${bisaTulis ? `<button type="button" class="jm-tbl jm-tbl-kecil jm-tbl-bahaya" data-m="hapus" data-id="${esc(f.id)}">${ikon("silang", 16)}${esc(t("adm.agenda.hapus"))}</button>` : ""}</figure>`).join("")
      : `<div class="jm-kosong">${ikon("gambar", 32)}<p>${esc(t("adm.agenda.foto_kosong"))}</p></div>`;
  }

  async function muatFoto() {
    try { const det = await api("/api/agenda/" + encodeURIComponent(S.ref)); kisi(det.foto || []); await segarkanRingkas(); } catch (e) { kabar("galat", galatTeks(e.kode || "umum")); }
  }
  async function segarkanRingkas() {
    try { S.bukti = petaBukti(await api("/api/agenda")); } catch (e) {}
  }

  /* perkecil di canvas: sisi terpanjang 2000 px, JPEG 0,85; EXIF ikut terbuang */
  async function perkecil(berkas) {
    const bm = await createImageBitmap(berkas);
    const skala = Math.min(1, SISI / Math.max(bm.width, bm.height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(bm.width * skala));
    c.height = Math.max(1, Math.round(bm.height * skala));
    const g = c.getContext("2d");
    g.fillStyle = "white"; // PNG/WebP transparan tidak jadi hitam di JPEG
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(bm, 0, 0, c.width, c.height);
    if (bm.close) bm.close();
    return new Promise((ok, gagal) => c.toBlob((b) => (b ? ok(b) : gagal(new Error("blob"))), "image/jpeg", 0.85));
  }

  async function unggah(daftar) {
    const berkas = [...daftar].filter((f) => TIPE.includes(f.type));
    const prog = $("agProgres");
    if (!berkas.length) { kabar("galat", galatTeks("salah-masukan")); return; }
    kabar("ok", "");
    let gagal = 0;
    for (let i = 0; i < berkas.length; i++) {
      prog.textContent = t("adm.agenda.progres", { n: angka(i + 1), total: angka(berkas.length) });
      try {
        const blob = await perkecil(berkas[i]);
        const r = await fetch(`/api/agenda/${encodeURIComponent(S.ref)}/foto?keterangan=`, { method: "POST", credentials: "same-origin", headers: { "x-pb": "1", "content-type": "image/jpeg" }, body: blob });
        if (!r.ok) throw new GalatApi(r.status === 413 ? "terlalu-besar" : r.status === 429 ? "terlalu-sering" : r.status === 403 ? "dilarang" : "umum", r.status);
      } catch (e) { gagal++; kabar("galat", galatTeks(e.kode || "umum")); if (e.status === 429 || e.status === 403) break; }
    }
    prog.textContent = gagal ? "" : t("adm.agenda.selesai", { n: angka(berkas.length) });
    const inp = $("agBerkas"); if (inp) inp.value = "";
    await muatFoto();
  }

  /* ---------- dokumen METI dan eksternal ---------- */

  const IK_DOK = { pdf: "pdf", pptx: "presentasi", docx: "teks", xlsx: "tabel" };
  function dokKartu(asal) {
    const eks = asal === "eksternal";
    const tulis = bisaTulis ? `<div class="jm-ag-dok-atas">
        ${eks ? `<div class="jm-medan"><label for="dkDari">${esc(t("adm.agenda.dok.dari"))}</label><input class="jm-isian" id="dkDari" maxlength="200" autocomplete="off"></div>
        <div class="jm-ag-dua"><div class="jm-medan"><label for="dkAkses">${esc(t("adm.agenda.dok.akses"))}</label>${pilihHtml({ id: "dkAkses", ikon: "status", label: t("adm.agenda.dok.akses"), opsi: [["pengurus", t("adm.agenda.dok.akses_pengurus")], ["anggota", t("adm.agenda.dok.akses_anggota")]], nilai: "pengurus" })}</div>
        <label class="jm-ag-cek"><input type="checkbox" id="dkResmi"><span>${esc(t("adm.agenda.dok.resmi"))}</span></label></div>
        <div class="jm-ag-dua" id="dkResmiMedan" hidden><div class="jm-medan"><label for="dkPenerbit">${esc(t("adm.agenda.dok.penerbit"))}</label><input class="jm-isian" id="dkPenerbit" maxlength="200" autocomplete="off"></div>
        <div class="jm-medan"><label for="dkTerbit">${esc(t("adm.agenda.dok.terbit"))}</label><input class="jm-isian" id="dkTerbit" type="date"></div></div>
        <small class="jm-bantu" id="dkResmiBantu" hidden>${esc(t("adm.agenda.dok.resmi_bantu"))}</small>` : ""}
        <label class="jm-ag-zona" for="dk-${asal}">${ikon("unduh", 28)}<strong>${esc(t("adm.agenda.dok.zona"))}</strong><small>${esc(t("adm.agenda.dok.zona_bantu"))}</small>
          <input class="sr" id="dk-${asal}" data-dok="${asal}" type="file" multiple accept=".pdf,.pptx,.docx,.xlsx"></label></div>` : "";
    return `<section class="jm-adm-kartu jm-ag-dok" aria-labelledby="dkJ-${asal}"><header class="jm-adm-kh">${ikon(eks ? "tautan" : "buku", 20)}<h3 id="dkJ-${asal}">${esc(t("adm.agenda.dok." + asal))}</h3></header>
      <div class="jm-adm-isi"><p class="jm-bantu">${esc(t("adm.agenda.dok." + asal + "_bantu"))}</p>${tulis}
        <p class="jm-bantu" id="dkProgres-${asal}" role="status"></p><div class="jm-ag-dok-daftar" id="dkDaftar-${asal}"></div></div></section>`;
  }
  function dokBaris(d) {
    const e = ekstensi(d.nama_berkas), eks = d.asal === "eksternal", id = esc(d.id);
    const ro = bisaTulis ? "" : " readonly";
    const meta = [ukuranTeks(d.ukuran || 0), eks && d.dari ? t("adm.agenda.dok.dari_n", { nama: d.dari }) : "", eks ? t(d.akses === "anggota" ? "adm.agenda.dok.akses_anggota" : "adm.agenda.dok.akses_pengurus") : ""].filter(Boolean).join(" | ");
    const resmi = eks && d.sumber_resmi ? `<span class="jm-pil jm-pil-ok">${esc(t("adm.agenda.dok.resmi_pil"))}</span>` : "";
    return `<article class="jm-ag-dk" data-did="${id}"><div class="jm-ag-dk-kepala">${ikon(IK_DOK[e] || "pdf", 24)}<div><b>${esc(d.nama_berkas)}</b> ${resmi}<small>${esc(meta)}</small></div>
        <a class="jm-tbl jm-tbl-kecil" href="/api/agenda/dokumen/${encodeURIComponent(d.id)}" download>${ikon("unduh", 16)}${esc(t("adm.agenda.dok.unduh"))}</a></div>
      <div class="jm-medan"><label class="sr" for="dkK${id}">${esc(t("adm.agenda.dok.ket"))}</label><input class="jm-isian" id="dkK${id}" data-dket="${id}" maxlength="300" autocomplete="off"${ro} placeholder="${esc(t("adm.agenda.dok.ket"))}" value="${esc(d.keterangan || "")}"></div>
      ${eks && bisaTulis ? `<div class="jm-ag-dua"><div class="jm-medan"><label for="dkA${id}">${esc(t("adm.agenda.dok.akses"))}</label><select data-ikon="status" class="jm-pilih" id="dkA${id}" data-dakses="${id}"><option value="pengurus"${d.akses === "anggota" ? "" : " selected"}>${esc(t("adm.agenda.dok.akses_pengurus"))}</option><option value="anggota"${d.akses === "anggota" ? " selected" : ""}>${esc(t("adm.agenda.dok.akses_anggota"))}</option></select></div>
        <label class="jm-ag-cek"><input type="checkbox" data-dresmi="${id}"${d.sumber_resmi ? " checked" : ""}><span>${esc(t("adm.agenda.dok.resmi"))}</span></label></div>
        ${d.sumber_resmi ? `<div class="jm-ag-dua"><div class="jm-medan"><label for="dkP${id}">${esc(t("adm.agenda.dok.penerbit"))}</label><input class="jm-isian" id="dkP${id}" data-dpen="${id}" maxlength="200" value="${esc(d.penerbit || "")}"></div><div class="jm-medan"><label for="dkT${id}">${esc(t("adm.agenda.dok.terbit"))}</label><input class="jm-isian" id="dkT${id}" type="date" data-dterbit="${id}" value="${esc(d.tanggal_terbit || "")}"></div></div>` : ""}` : ""}
      ${bisaTulis ? `<button type="button" class="jm-tbl jm-tbl-kecil jm-tbl-bahaya" data-m="hapus-dok" data-id="${id}">${ikon("silang", 16)}${esc(t("adm.agenda.hapus"))}</button>` : ""}</article>`;
  }
  function dokDaftar() {
    for (const asal of ["meti", "eksternal"]) {
      const k = $("dkDaftar-" + asal);
      if (!k) continue;
      const l = (S.dok || []).filter((d) => d.asal === asal);
      k.innerHTML = l.length ? l.map(dokBaris).join("") : `<div class="jm-kosong">${ikon("pdf", 32)}<p>${esc(t("adm.agenda.dok.kosong"))}</p></div>`;
    }
  }
  async function muatDok() {
    try { const det = await api("/api/agenda/" + encodeURIComponent(S.ref)); S.dok = det.dokumen || []; dokDaftar(); await segarkanRingkas(); } catch (e) { kabar("galat", galatTeks(e.kode || "umum")); }
  }
  const galatDok = (status, kode) => (status === 413 ? t("adm.agenda.dok.g413") : status === 415 ? t("adm.agenda.dok.g415") : status === 422 ? t("adm.agenda.dok.g422") : galatTeks(kode || "umum"));

  async function unggahDok(asal, daftar) {
    const prog = $("dkProgres-" + asal);
    const berkas = [...daftar];
    const eks = asal === "eksternal", resmi = eks && $("dkResmi") && $("dkResmi").checked;
    kabar("ok", "");
    if (resmi && !$("dkPenerbit").value.trim()) { kabar("galat", t("adm.agenda.dok.g422")); return; }
    let gagal = 0;
    for (let i = 0; i < berkas.length; i++) {
      const f = berkas[i];
      prog.textContent = t("adm.agenda.dok.progres", { n: angka(i + 1), total: angka(berkas.length) });
      if (!DOK_EKS.includes(ekstensi(f.name))) { gagal++; kabar("galat", t("adm.agenda.dok.g415")); continue; }
      if (f.size > MAKS_DOK) { gagal++; kabar("galat", t("adm.agenda.dok.g413")); continue; }
      const q = new URLSearchParams({ asal, nama: f.name });
      if (eks) {
        q.set("akses", resmi ? "anggota" : $("dkAkses").value);
        if ($("dkDari").value.trim()) q.set("dari", $("dkDari").value.trim());
      }
      try {
        const r = await fetch(`/api/agenda/${encodeURIComponent(S.ref)}/dokumen?${q}`, { method: "POST", credentials: "same-origin", headers: { "x-pb": "1", "content-type": MIME_DOK[ekstensi(f.name)] }, body: f });
        if (!r.ok) throw new GalatApi("umum", r.status);
        if (resmi) {
          const { id } = await r.json();
          await api("/api/agenda/dokumen/" + encodeURIComponent(id), { metode: "PATCH", badan: { sumber_resmi: true, penerbit: $("dkPenerbit").value.trim(), tanggal_terbit: $("dkTerbit").value || null } });
        }
      } catch (e) { gagal++; kabar("galat", galatDok(e.status, e.kode)); if (e.status === 429 || e.status === 403) break; }
    }
    prog.textContent = gagal ? "" : t("adm.agenda.dok.selesai", { n: angka(berkas.length) });
    const inp = $("dk-" + asal); if (inp) inp.value = "";
    await muatDok();
  }
  async function ubahDok(id, badan) {
    try { await api("/api/agenda/dokumen/" + encodeURIComponent(id), { metode: "PATCH", badan }); kabar("ok", t("adm.agenda.tersimpan")); await muatDok(); }
    catch (e) { kabar("galat", galatDok(e.status, e.kode)); await muatDok(); }
  }
  async function hapusDok(id) {
    const a = host.querySelector(`.jm-ag-dk[data-did="${CSS.escape(String(id))}"]`);
    if (a) a.setAttribute("aria-busy", "true");
    try { await api("/api/agenda/dokumen/" + encodeURIComponent(id), { metode: "DELETE" }); kabar("ok", t("adm.agenda.dok.terhapus")); await muatDok(); }
    catch (e) { if (a) a.removeAttribute("aria-busy"); kabar("galat", galatTeks(e.kode || "umum")); }
  }

  /* ---------- tambah, ubah, hapus kegiatan ---------- */

  function formTambah() {
    S.ref = "";
    kabar("ok", "");
    host.innerHTML = `<section class="jm-adm-kartu"><header class="jm-adm-kh">${ikon("tambah", 20)}<h3>${esc(t("adm.agenda.tambah_judul"))}</h3></header>
      <form class="jm-adm-isi jm-form" id="kgForm" novalidate>
        <div class="jm-medan"><label for="kgNama">${esc(t("adm.agenda.f.nama"))}</label><input class="jm-isian" id="kgNama" maxlength="200" autocomplete="off" required></div>
        <div class="jm-ag-dua"><div class="jm-medan"><label for="kgTgl">${esc(t("adm.agenda.f.tgl"))}</label><input class="jm-isian" id="kgTgl" type="date" required></div>
        <div class="jm-medan"><label for="kgAkhir">${esc(t("adm.agenda.f.tgl_akhir"))}</label><input class="jm-isian" id="kgAkhir" type="date"></div></div>
        <div class="jm-medan"><label for="kgTempat">${esc(t("adm.agenda.tempat"))}</label><input class="jm-isian" id="kgTempat" maxlength="200" autocomplete="off"></div>
        <div class="jm-medan"><label for="kgJenis">${esc(t("adm.agenda.fj"))}</label>${pilihHtml({ id: "kgJenis", ikon: "jenis", label: t("adm.agenda.fj"), opsi: JENIS_BARU.map((j) => [j, label(j)]), nilai: "lainnya" })}</div>
        <div class="jm-aksi"><button type="button" class="jm-tbl" data-m="kembali">${ikon("panah-kiri", 18)}${esc(t("jm.batal"))}</button><button type="submit" class="jm-tbl jm-tbl-utama" id="kgBuat">${ikon("centang", 18)}${esc(t("adm.agenda.tambah_simpan"))}</button></div>
      </form></section>`;
  }
  function badanKegiatan() {
    const judul = $("kgNama").value.trim(), tanggal_ = $("kgTgl").value, akhir = $("kgAkhir").value, tempat = $("kgTempat").value.trim();
    if (!judul || !tanggal_) return { galat: t("adm.agenda.g_wajib") };
    if (akhir && akhir < tanggal_) return { galat: t("adm.agenda.g_urut") };
    return { badan: { judul, tanggal: tanggal_, tanggal_selesai: akhir || null, tempat: tempat || null, jenis: $("kgJenis").value || "lainnya" } };
  }
  async function buatKegiatan() {
    const { badan, galat } = badanKegiatan();
    if (galat) { kabar("galat", galat); return; }
    const tbl = $("kgBuat"); tbl.disabled = true; kabar("ok", "");
    try {
      const r = await api("/api/agenda/kegiatan", { metode: "POST", badan });
      S.acara.unshift({ id: r.ref, judul: badan.judul, tanggal: badan.tanggal, tanggal_selesai: badan.tanggal_selesai, jenis: badan.jenis, tempat: badan.tempat, sumber_tipe: "admin" });
      kabar("ok", t("adm.agenda.keg_dibuat"));
      await bukaEditor(r.ref);
    } catch (e) { tbl.disabled = false; kabar("galat", galatTeks(e.kode || "umum")); }
  }
  async function simpanKegiatan() {
    const { badan, galat } = badanKegiatan();
    if (galat) { kabar("galat", galat); return; }
    const tbl = $("kgSimpan"); tbl.disabled = true; kabar("ok", "");
    try {
      await api("/api/agenda/kegiatan/" + encodeURIComponent(S.ref), { metode: "PATCH", badan });
      const a = S.acara.find((x) => x.id === S.ref);
      if (a) Object.assign(a, badan);
      kabar("ok", t("adm.agenda.tersimpan"));
    } catch (e) { kabar("galat", galatTeks(e.kode || "umum")); }
    tbl.disabled = false;
  }
  async function hapusKegiatan() {
    const ref = S.ref;
    try {
      await api("/api/agenda/kegiatan/" + encodeURIComponent(ref), { metode: "DELETE" });
      S.acara = S.acara.filter((x) => x.id !== ref);
      S.bukti.delete(ref);
      kabar("ok", t("adm.agenda.keg_terhapus"));
      nanti(rangkaDaftar);
    } catch (e) { kabar("galat", galatTeks(e.kode || "umum")); }
  }

  /* ---------- dialog bawaan untuk konfirmasi hapus (bukan confirm()) ---------- */

  const TEKS_HAPUS = { foto: ["adm.agenda.hapus_judul", "adm.agenda.hapus_isi"], dok: ["adm.agenda.dok.hapus_judul", "adm.agenda.dok.hapus_isi"], keg: ["adm.agenda.hapus_keg_judul", "adm.agenda.hapus_keg_isi"] };
  function konfirmasi(jenis, id) {
    const [j, i] = TEKS_HAPUS[jenis];
    dlg.innerHTML = `<div class="jm-form"><h2 id="dlgJudul">${esc(t(j))}</h2><p>${esc(t(i))}</p>
      <div class="jm-aksi"><button type="button" class="jm-tbl jm-tbl-bahaya" data-ag="ya">${esc(t("adm.agenda.hapus"))}</button><button type="button" class="jm-tbl" data-aksi="batal">${esc(t("jm.batal"))}</button></div></div>`;
    const tangan = (e) => {
      if (!e.target.closest('[data-ag="ya"]')) return;
      dlg.removeEventListener("click", tangan);
      dlg.close();
      if (jenis === "foto") hapusFoto(id); else if (jenis === "dok") hapusDok(id); else hapusKegiatan();
    };
    dlg.addEventListener("click", tangan);
    dlg.addEventListener("close", () => dlg.removeEventListener("click", tangan), { once: true });
    if (!dlg.open) dlg.showModal();
  }

  async function hapusFoto(id) {
    const f = host.querySelector(`.jm-ag-f[data-id="${CSS.escape(String(id))}"]`);
    if (f) f.setAttribute("aria-busy", "true");
    try { await api("/api/agenda/foto/" + encodeURIComponent(id), { metode: "DELETE" }); kabar("ok", t("adm.agenda.terhapus")); await muatFoto(); }
    catch (e) { if (f) f.removeAttribute("aria-busy"); kabar("galat", galatTeks(e.kode || "umum")); }
  }

  async function simpan() {
    const tbl = $("agSimpan");
    if (!bisaTulis || !tbl) return;
    tbl.disabled = true;
    kabar("ok", "");
    const tempat = ($("agTempat") || $("kgTempat")).value.trim(), notulensi = $("agNotulen").value;
    try {
      await api("/api/agenda/" + encodeURIComponent(S.ref), { metode: "PUT", badan: { tempat: tempat || null, notulensi: notulensi.trim() ? notulensi : null } });
      kabar("ok", t("adm.agenda.tersimpan"));
      await segarkanRingkas();
    } catch (e) { kabar("galat", galatTeks(e.kode || "umum")); }
    tbl.disabled = false;
  }

  /* ---------- penangan ---------- */

  function masuk(e) {
    if (e.target.id === "agCari") { S.cari = e.target.value.trim(); cariTunda(); }
    else if (e.target.id === "agNotulen") hitungKar();
  }
  /* penerbit + tanggal terbit dari baris dokumen; kotak centang baru (tanpa penerbit) membuka isian lewat render ulang */
  function bacaResmi(id) {
    const pen = host.querySelector(`[data-dpen="${CSS.escape(String(id))}"]`), tb = host.querySelector(`[data-dterbit="${CSS.escape(String(id))}"]`);
    if (!pen) { const d = (S.dok || []).find((z) => String(z.id) === String(id)); S.dok = (S.dok || []).map((z) => (z === d ? { ...z, sumber_resmi: true, akses: "anggota" } : z)); dokDaftar(); return null; }
    return pen.value.trim() ? { sumber_resmi: true, penerbit: pen.value.trim(), tanggal_terbit: (tb && tb.value) || null } : null;
  }
  async function ubah(e) {
    const x = e.target;
    if (x.id === "agJenis" || x.id === "agNot") { S[x.id === "agJenis" ? "jenis" : "notulen"] = x.value; nanti(isiTabel); }
    else if (x.id === "agBerkas") { if (x.files.length && bisaTulis) unggah(x.files); }
    else if (x.dataset.dok) { if (x.files.length && bisaTulis) unggahDok(x.dataset.dok, x.files); }
    else if (x.id === "dkResmi") { const on = x.checked; $("dkResmiMedan").hidden = !on; $("dkResmiBantu").hidden = !on; if (on) { const a = $("dkAkses"); a.value = "anggota"; a.disabled = true; } else $("dkAkses").disabled = false; }
    else if (x.dataset.dket) ubahDok(x.dataset.dket, { keterangan: x.value.trim() });
    else if (x.dataset.dakses) ubahDok(x.dataset.dakses, { akses: x.value });
    else if (x.dataset.dresmi) {
      if (!x.checked) ubahDok(x.dataset.dresmi, { sumber_resmi: false });
      else { const p = bacaResmi(x.dataset.dresmi); if (p) ubahDok(x.dataset.dresmi, p); else { x.checked = false; kabar("galat", t("adm.agenda.dok.g422")); } }
    }
    else if (x.dataset.dpen || x.dataset.dterbit) {
      const id = x.dataset.dpen || x.dataset.dterbit, p = bacaResmi(id);
      if (p) ubahDok(id, p); else kabar("galat", t("adm.agenda.dok.g422"));
    }
    else if (x.dataset.ket) {
      if (!bisaTulis) return;
      try { await api("/api/agenda/foto/" + encodeURIComponent(x.dataset.ket), { metode: "PATCH", badan: { keterangan: x.value.trim() } }); kabar("ok", t("adm.agenda.tersimpan")); }
      catch (err) { kabar("galat", galatTeks(err.kode || "umum")); }
    }
  }
  function klik(e) {
    const b = e.target.closest("button");
    if (!b) {
      const tr = e.target.closest("tr[data-ref]");
      if (tr) bukaEditor(tr.dataset.ref);
      return;
    }
    if (b.dataset.aksi === "ulang") { S.ref ? bukaEditor(S.ref) : muatDaftar(); return; }
    switch (b.dataset.m) {
      case "urut": S.arah = S.urut === b.dataset.k ? -S.arah : 1; S.urut = b.dataset.k; nanti(isiTabel); break;
      case "buka": bukaEditor(b.dataset.ref); break;
      case "kembali": kabar("ok", ""); nanti(rangkaDaftar); break;
      case "hapus": konfirmasi("foto", b.dataset.id); break;
      case "hapus-dok": konfirmasi("dok", b.dataset.id); break;
      case "hapus-keg": konfirmasi("keg"); break;
      case "simpan-keg": simpanKegiatan(); break;
      case "tambah": formTambah(); break;
    }
  }
  host.addEventListener("dragover", (e) => { const z = e.target.closest(".jm-ag-zona"); if (z) { e.preventDefault(); z.classList.add("jm-ag-zona-on"); } });
  host.addEventListener("dragleave", (e) => { const z = e.target.closest(".jm-ag-zona"); if (z) z.classList.remove("jm-ag-zona-on"); });
  host.addEventListener("drop", (e) => {
    const z = e.target.closest(".jm-ag-zona");
    if (!z) return;
    e.preventDefault(); z.classList.remove("jm-ag-zona-on");
    if (!e.dataTransfer.files.length || !bisaTulis) return;
    const dk = z.querySelector("[data-dok]");
    dk ? unggahDok(dk.dataset.dok, e.dataTransfer.files) : unggah(e.dataTransfer.files);
  });
  host.addEventListener("submit", (e) => { if (e.target.id === "agForm") { e.preventDefault(); simpan(); } else if (e.target.id === "kgForm") { e.preventDefault(); buatKegiatan(); } });
  host.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches && e.target.matches("tr[data-ref]")) bukaEditor(e.target.dataset.ref); });
}
