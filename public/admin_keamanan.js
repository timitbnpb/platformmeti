/* /admin tab Keamanan (admin dan super): sesi aktif semua akun + cabut, riwayat gagal masuk 30 hari, matriks hak hanya-baca.
   Server: GET /api/admin/keamanan/{sesi,gagal,matriks}, DELETE /api/admin/keamanan/sesi/:sid, DELETE /api/admin/akun/:id/sesi.
   Cabut perlu dua klik (tombol berubah jadi "Yakin?" selama 4 detik). Semua nilai di-escape. */
import { t, angka, tanggal, tanggalDariUnix, jam, ada } from "/i18n.js";
import { esc, api, nanti, hantuHtml, ikon, pesanHtml, galatTeks } from "/inti/umum.js";
import { kepalaTab, keadaan } from "/admin_umum.js";
import { pasangTabel } from "/admin_tabel.js";

const kapan = (u) => (u ? `<span class="jm-nowrap">${esc(tanggal(tanggalDariUnix(u)))}<small>${esc(jam(u))}</small></span>` : "-");
const nama = () => { try { return new Intl.DisplayNames([document.documentElement.lang || "id"], { type: "region" }); } catch { return null; } };
const labelPeran = (p) => (ada("peran." + p) ? t("peran." + p) : p);
const slugKode = (k) => (k === "-" ? "nol" : k.replace(/[^A-Za-z]+/g, "_"));
const kartu = (id, ik, judul, sub, isiHtml) => `<section class="jm-adm-kartu" id="${id}"><header class="jm-adm-kh">${ikon(ik, 20)}<h3>${esc(judul)}</h3></header><div class="jm-adm-isi">${sub ? `<p class="jm-bantu">${esc(sub)}</p>` : ""}${isiHtml}</div></section>`;

export function panelKeamanan(panel, saya) {
  panel.innerHTML = `${kepalaTab("kunci", "kam.ey", "kam.j", "kam.d")}<div id="kamStatus" aria-live="polite"></div>
    ${kartu("kamSesi", "orang", t("kam.sesi"), t("kam.sesi.d"), `<div id="kamSesiIsi">${hantuHtml(4)}</div>`)}
    ${kartu("kamGagal", "peringatan", t("kam.gagal"), t("kam.gagal.d"), `<div id="kamGagalIsi">${hantuHtml(4)}</div>`)}
    ${kartu("kamMatriks", "perisai", t("kam.matriks"), t("kam.matriks.d"), `<div id="kamMatriksIsi">${hantuHtml(4)}</div>`)}`;
  const $ = (i) => panel.querySelector("#" + i);
  const super_ = saya.peran === "super";
  let sesi = [];

  /* ---------- sesi aktif ---------- */
  async function muatSesi() {
    let d;
    try { d = await api("/api/admin/keamanan/sesi"); } catch (e) { $("kamSesiIsi").innerHTML = keadaan(e.kode || "umum"); return; }
    sesi = d.baris || [];
    nanti(gambarSesi);
  }
  function gambarSesi() {
    const el = $("kamSesiIsi");
    if (!el) return;
    const negara = nama();
    const milikSaya = new Set(sesi.filter((s) => s.ini).map((s) => s.akun_id)); // akun yang sedang dipakai tidak dicabut semuanya dari sini
    const boleh = (s) => !s.ini && (super_ || s.peran !== "super");
    const wadah = document.createElement("div");
    el.replaceChildren(wadah);
    pasangTabel(wadah, {
      per: 10, satuan: "kam.satuan.sesi", kosong: "kam.sesi.kosong", awal: { k: "dibuat", arah: -1 },
      baris: sesi,
      kolom: [
        { k: "nama", judul: t("kam.k.akun"), tampil: (s) => `<strong>${esc(s.nama)}</strong><small>${esc(s.surel)}</small>` },
        { k: "peran", judul: t("admin.f.peran"), nilai: (s) => labelPeran(s.peran), tampil: (s) => esc(labelPeran(s.peran)) },
        { k: "perangkat", judul: t("kam.k.perangkat"), nilai: (s) => s.perangkat || "", tampil: (s) => (s.perangkat ? `${esc(s.perangkat)}${s.jenis ? `<small>${esc(t("kam.jenis." + s.jenis))}</small>` : ""}` : esc(t("kam.tak_dikenal"))) },
        { k: "lokasi", judul: t("kam.k.lokasi"), nilai: (s) => [s.kota, s.negara].filter(Boolean).join(", "), tampil: (s) => esc([s.kota, s.wilayah, s.negara && negara ? negara.of(s.negara) : s.negara].filter(Boolean).join(", ") || "-") },
        { k: "dibuat", judul: t("kam.k.mulai"), num: true, tampil: (s) => kapan(s.dibuat) },
        { k: "aktif", judul: t("kam.k.aktif"), num: true, tampil: (s) => kapan(s.aktif) },
        { k: "aksi", judul: t("admin.k.aksi"), nilai: (s) => (s.ini ? 0 : 1), tampil: (s) => (s.ini ? `<span class="jm-pil jm-pil-ok">${esc(t("kam.ini"))}</span>`
          : boleh(s) ? `<div class="jm-sel-aksi"><button type="button" class="jm-tbl jm-tbl-kecil jm-tbl-bahaya" data-kam="cabut" data-sid="${esc(s.sid)}">${ikon("blokir", 16)}<span>${esc(t("kam.cabut"))}</span></button>${milikSaya.has(s.akun_id) ? "" : `<button type="button" class="jm-tbl jm-tbl-kecil" data-kam="semua" data-id="${esc(s.akun_id)}">${ikon("keluar", 16)}<span>${esc(t("kam.cabut_semua"))}</span></button>`}</div>` : "-") },
      ],
    });
  }

  /* ---------- gagal masuk ---------- */
  async function muatGagal() {
    let d;
    try { d = await api("/api/admin/keamanan/gagal"); } catch (e) { $("kamGagalIsi").innerHTML = keadaan(e.kode || "umum"); return; }
    nanti(() => {
      const el = $("kamGagalIsi");
      if (!el) return;
      const wadah = document.createElement("div");
      el.innerHTML = `<ul class="jm-hi-daftar"><li><div class="jm-hi-u"><strong>${esc(angka(d.total))}</strong><span>${esc(t("kam.gagal.total"))}</span></div></li><li><div class="jm-hi-u"><strong>${esc(angka(d.ip_unik))}</strong><span>${esc(t("kam.gagal.ip"))}</span></div></li></ul>`;
      el.append(wadah);
      pasangTabel(wadah, {
        per: 10, satuan: "kam.satuan.gagal", kosong: "kam.gagal.kosong", awal: { k: "waktu", arah: -1 }, baris: d.baris,
        kolom: [
          { k: "waktu", judul: t("kam.k.waktu"), num: true, tampil: (r) => kapan(r.waktu) },
          { k: "surel", judul: t("kam.k.surel"), nilai: (r) => r.surel || "", tampil: (r) => esc(r.surel || "-") },
          { k: "ip", judul: t("kam.k.ip"), nilai: (r) => r.ip || "", tampil: (r) => `<code>${esc(r.ip || "-")}</code>` },
        ],
      });
      if (d.total > d.baris.length) el.insertAdjacentHTML("beforeend", `<p class="jm-bantu">${esc(t("kam.gagal.potong", { n: angka(d.baris.length) }))}</p>`);
    });
  }

  /* ---------- matriks hak ---------- */
  async function muatMatriks() {
    let d;
    try { d = await api("/api/admin/keamanan/matriks"); } catch (e) { $("kamMatriksIsi").innerHTML = keadaan(e.kode || "umum"); return; }
    nanti(() => {
      const el = $("kamMatriksIsi");
      if (!el) return;
      const wadah = document.createElement("div");
      el.replaceChildren(wadah);
      const jenis = (j) => (ada("kam.jns." + j) ? t("kam.jns." + j) : j);
      pasangTabel(wadah, {
        per: 12, satuan: "kam.satuan.jenis", baris: d.jenis,
        kolom: [
          { k: "jenis", judul: t("kam.k.sumber"), nilai: (r) => jenis(r.jenis), tampil: (r) => `<strong>${esc(jenis(r.jenis))}</strong>` },
          ...d.peran.map((p, i) => ({
            k: "p" + i, judul: labelPeran(p), nilai: (r) => r.sel[i].aksi.length,
            tampil: (r) => { const s = r.sel[i]; return `<span class="jm-pil ${s.kode === "-" ? "jm-pil-mati" : s.kode.startsWith("T") ? "jm-pil-ok" : ""}" title="${esc(s.aksi.map((a) => t("kam.aksi." + a)).join(", ") || t("kam.tanpa_aksi"))}">${esc(t("kam.kode." + slugKode(s.kode)))}</span>`; },
          })),
        ],
      });
    });
  }

  /* ---------- cabut ---------- */
  const kabari = (jenis, teks) => { $("kamStatus").innerHTML = teks ? pesanHtml(jenis, teks) : ""; };
  panel.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-kam]");
    if (!b) return;
    if (b.dataset.yakin !== "1") { // klik pertama: minta tegas
      b.dataset.yakin = "1";
      b.querySelector("span").textContent = t("kam.yakin");
      setTimeout(() => { if (b.isConnected) { delete b.dataset.yakin; b.querySelector("span").textContent = t(b.dataset.kam === "cabut" ? "kam.cabut" : "kam.cabut_semua"); } }, 4000);
      return;
    }
    b.disabled = true;
    kabari("ok", "");
    try {
      await api(b.dataset.kam === "cabut" ? `/api/admin/keamanan/sesi/${encodeURIComponent(b.dataset.sid)}` : `/api/admin/akun/${encodeURIComponent(b.dataset.id)}/sesi`, { metode: "DELETE" });
      kabari("ok", t("kam.dicabut"));
      muatSesi();
    } catch (err) { b.disabled = false; kabari("galat", galatTeks(err.kode || "umum")); }
  });

  muatSesi(); muatGagal(); muatMatriks();
}
