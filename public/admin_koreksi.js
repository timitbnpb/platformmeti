/* /admin: tab Koreksi (antrean usulan perbaikan) dan tab Jejak audit. Server: /api/admin/koreksi, /api/admin/jejak.
   INP: filter berubah seketika; render tabel menyusul lewat nanti(). */
import { t, ada, tanggal, tanggalDariUnix, jam } from "/i18n.js";
import { esc, api, nanti, hantuHtml, kosongHtml, galatTeks, ikon, pesanHtml } from "/inti/umum.js";
import { logoOrgSatu } from "/inti/logo_org.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { data, kepalaTab, ubinKepala, keadaan, aman, detik } from "/admin_umum.js";
import { nilaiKolom, labelKolom } from "/inti/koreksi.js";

const STATUS = ["baru", "setuju", "tolak"];
const BERKAS = { organisasi: "organisasi", proyek: "proyek", regulasi: "regulasi", orang: "orang" };
const tgl = (w) => { const d = detik(w); return Number.isFinite(d) ? `<span data-urut="${d}">${esc(tanggal(tanggalDariUnix(d)))}<small>${esc(jam(d))}</small></span>` : "-"; };
const pilSt = (s) => `<span class="jm-pil ${s === "setuju" ? "jm-pil-ok" : s === "tolak" ? "jm-pil-bad" : "jm-pil-warn"}">${esc(ada("kor.s." + s) ? t("kor.s." + s) : s)}</span>`;
const href = (ent, id, rec) => (ent === "organisasi" ? "/o/" + encodeURIComponent(id) : ent === "proyek" ? "/p/" + encodeURIComponent(id) : ent === "regulasi" ? "/regulasi?id=" + encodeURIComponent(id) : rec?.organisasi_id ? "/o/" + encodeURIComponent(rec.organisasi_id) : "");

/* pencarian entitas dari data publik (nama + logo); gagal diam: tampil id */
async function peta(baris) {
  const perlu = [...new Set(baris.map((r) => r.entitas).filter((e) => BERKAS[e]))], hasil = {};
  await Promise.all(perlu.map(async (e) => { try { hasil[e] = new Map((await data(BERKAS[e])).baris.map((x) => [x.id, x])); } catch (err) { hasil[e] = new Map(); } }));
  return hasil;
}

function entitasSel(r, P) {
  const rec = P[r.entitas]?.get(r.entitas_id), nama = rec ? rec.nama || rec.judul : r.entitas_id, h = href(r.entitas, r.entitas_id, rec);
  const lg = r.entitas === "organisasi" ? logoOrgSatu(r.entitas_id, nama, rec?.logo) : "";
  const ini = lg ? `<img class="jm-adm-lg" src="${esc(lg)}" width="28" height="28" alt="" loading="lazy">` : `<span class="jm-adm-lg jm-adm-lg-ik">${ikon(r.entitas === "proyek" ? "proyek" : r.entitas === "regulasi" ? "regulasi" : r.entitas === "orang" ? "orang" : "direktori", 16)}</span>`;
  return `<span class="jm-adm-ent">${ini}<span class="jm-adm-id">${h ? `<a href="${esc(h)}">${esc(nama)}</a>` : `<b>${esc(nama)}</b>`}<small>${esc(ada("kor.e." + r.entitas) ? t("kor.e." + r.entitas) : r.entitas)}</small></span></span>`;
}

/* ---------------- Koreksi ---------------- */
export function panelKoreksi(panel) {
  const S = { status: "baru", hal: 1, baris: [], total: 0, galat: null, ctl: null, P: {}, pilih: null };
  panel.innerHTML = `${kepalaTab("ubah", "kor.tab.ey", "kor.tab.j", "kor.tab.d")}
    <div class="jm-bar jm-adm-bar1"><select data-ikon="status" class="jm-pilih" id="kStatus" aria-label="${esc(t("kor.f.status"))}">${STATUS.map((s) => `<option value="${s}"${s === S.status ? " selected" : ""}>${esc(t("kor.s." + s))}</option>`).join("")}</select></div>
    <div id="kDaftar" aria-live="polite"></div><div class="jm-hal" id="kHal"></div>
    <dialog class="jm-dlg" id="kTinjau" aria-labelledby="kTinjauJ"></dialog>`;
  const $ = (i) => panel.querySelector("#" + i), dlg = $("kTinjau");
  panel.addEventListener("change", (e) => { if (e.target.id === "kStatus") { S.status = e.target.value; S.hal = 1; muat(); } });
  panel.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const a = b.dataset.aksi;
    if (b?.dataset.hal) { S.hal = +b.dataset.hal; sorotHalaman(b, S.hal); muat(); } else if (a === "ulang") muat();
    else if (a === "setuju" || a === "tolak") tinjau(a, S.baris.find((r) => String(r.id) === b.dataset.id));
    else if (a === "batal") dlg.close();
  });
  dlg.addEventListener("submit", kirim);
  muat(); muatRingkas();
  async function muatRingkas() {
    const n = await Promise.all(STATUS.map((x) => api(`/api/admin/koreksi?status=${x}&hal=1`).then((d) => d.total ?? (d.baris || []).length).catch(() => 0)));
    ubinKepala(panel, STATUS.map((x, i) => ({ ikon: ["lonceng", "centang", "silang"][i], nilai: n[i], label: t("kor.k." + x) })));
  }

  async function muat() {
    if (S.ctl) S.ctl.abort();
    S.ctl = new AbortController();
    $("kDaftar").innerHTML = hantuHtml(5);
    try {
      const d = await api(`/api/admin/koreksi?status=${S.status}&hal=${S.hal}`, { signal: S.ctl.signal });
      S.baris = d.baris || []; S.total = d.total ?? S.baris.length; S.galat = null;
      S.P = await peta(S.baris);
    } catch (e) { if (e.name === "AbortError") return; S.galat = e.kode || "umum"; S.baris = []; }
    nanti(gambar);
  }

  function gambar() {
    const el = $("kDaftar"); if (!el) return;
    if (S.galat) el.innerHTML = keadaan(S.galat);
    else if (!S.baris.length) el.innerHTML = kosongHtml("kor.kosong_antrean");
    else {
      const baris = S.baris.map((r) => {
        const rec = S.P[r.entitas]?.get(r.entitas_id), kini = r.nilai_sekarang ?? nilaiKolom(rec, r.kolom), u = aman(r.sumber_url);
        const aksi = r.status && r.status !== "baru" ? pilSt(r.status) : `<div class="jm-sel-aksi"><button type="button" class="jm-tbl jm-tbl-kecil jm-tbl-utama" data-aksi="setuju" data-id="${esc(r.id)}">${ikon("centang", 16)}${esc(t("kor.setujui"))}</button><button type="button" class="jm-tbl jm-tbl-kecil jm-tbl-bahaya" data-aksi="tolak" data-id="${esc(r.id)}">${ikon("silang", 16)}${esc(t("kor.tolak"))}</button></div>`;
        return `<tr><td data-l="${esc(t("kor.c.entitas"))}">${entitasSel(r, S.P)}</td><td data-l="${esc(t("kor.c.kolom"))}">${esc(labelKolom(r.kolom))}</td>
          <td data-l="${esc(t("kor.c.banding"))}"><div class="jm-adm-banding"><span><small>${esc(t("kor.f.sekarang"))}</small>${esc(kini || t("kor.kosong"))}</span><span class="jm-adm-usul"><small>${esc(t("kor.f.usulan"))}</small>${esc(r.nilai_usulan)}</span></div></td>
          <td data-l="${esc(t("kor.c.alasan"))}">${esc(r.alasan || "-")}</td>
          <td data-l="${esc(t("kor.c.sumber"))}">${u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(u.replace(/^https?:\/\/(www\.)?/, "").slice(0, 40))}</a>` : "-"}</td>
          <td class="jm-nowrap" data-l="${esc(t("kor.c.waktu"))}">${tgl(r.dibuat ?? r.waktu)}</td><td data-l="${esc(t("admin.k.aksi"))}">${aksi}</td></tr>`;
      }).join("");
      el.innerHTML = `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>${["kor.c.entitas", "kor.c.kolom", "kor.c.banding", "kor.c.alasan", "kor.c.sumber", "kor.c.waktu"].map((k) => `<th scope="col">${esc(t(k))}</th>`).join("")}<th scope="col" data-urut="tidak">${esc(t("admin.k.aksi"))}</th></tr></thead><tbody>${baris}</tbody></table></div>`;
    }
    $("kHal").innerHTML = paginasiHtml({ hal: S.hal, total: S.total, per: 50, satuan: "jm.pag.u.koreksi" });
  }

  function tinjau(aksi, r) {
    if (!r) return;
    S.pilih = { aksi, id: r.id };
    dlg.innerHTML = `<form class="jm-form" id="kForm"><h2 id="kTinjauJ">${esc(t(aksi === "setuju" ? "kor.setujui" : "kor.tolak"))}</h2><p class="jm-bantu">${esc(t("kor.konfirm"))}</p>
      <div class="jm-medan"><label for="kCatatan">${esc(t("kor.catatan"))}</label><textarea class="jm-isian" id="kCatatan" rows="3" maxlength="500"></textarea></div><div id="kPesan"></div>
      <div class="jm-aksi"><button type="submit" class="jm-tbl ${aksi === "setuju" ? "jm-tbl-utama" : "jm-tbl-bahaya"}">${esc(t(aksi === "setuju" ? "kor.setujui" : "kor.tolak"))}</button><button type="button" class="jm-tbl" data-aksi="batal">${esc(t("jm.batal"))}</button></div></form>`;
    dlg.showModal();
  }
  async function kirim(e) {
    e.preventDefault();
    const tbl = e.target.querySelector("button[type=submit]");
    tbl.disabled = true;
    try {
      await api(`/api/admin/koreksi/${encodeURIComponent(S.pilih.id)}`, { metode: "POST", badan: { aksi: S.pilih.aksi, catatan: dlg.querySelector("#kCatatan").value.trim() } });
      dlg.close(); muat();
    } catch (err) { tbl.disabled = false; dlg.querySelector("#kPesan").innerHTML = pesanHtml("galat", err.kode === "fitur_belum_aktif" ? t("adm.belum_aktif") : err.status === 409 ? t("kor.sudah_diputus") : galatTeks(err.kode || "umum")); }
  }
}

/* ---------------- Jejak audit ---------------- */
const JENIS = ["", "koreksi", "akun", "entitas", "konten", "masuk"];
const IK_AKSI = { tinjau: "centang", buat: "tambah", tambah: "tambah", ubah: "ubah", setuju: "centang", tolak: "silang", hapus: "blokir", masuk: "masuk", keluar: "keluar", nonaktif: "blokir" };
export function panelAudit(panel) {
  const S = { jenis: "", hal: 1, baris: [], galat: null, ctl: null };
  panel.innerHTML = `${kepalaTab("jejak", "aud.ey", "aud.j", "aud.d")}
    <div class="jm-bar jm-adm-bar1"><select data-ikon="jenis" class="jm-pilih" id="aJenis" aria-label="${esc(t("aud.f.jenis"))}">${JENIS.map((j) => `<option value="${j}">${esc(t(j ? "aud.jenis." + j : "aud.semua"))}</option>`).join("")}</select></div>
    <div id="aDaftar" aria-live="polite"></div><div class="jm-hal" id="aHal"></div>`;
  const $ = (i) => panel.querySelector("#" + i);
  panel.addEventListener("change", (e) => { if (e.target.id === "aJenis") { S.jenis = e.target.value; S.hal = 1; muat(); } });
  panel.addEventListener("click", (e) => {
    const b = e.target.closest("button"), a = b?.dataset.aksi;
    if (b?.dataset.hal) { S.hal = +b.dataset.hal; sorotHalaman(b, S.hal); muat(); } else if (a === "ulang" || a === "reset") { if (a === "reset") { S.jenis = ""; $("aJenis").value = ""; S.hal = 1; } muat(); }
  });
  muat();

  async function muat() {
    if (S.ctl) S.ctl.abort();
    S.ctl = new AbortController();
    $("aDaftar").innerHTML = hantuHtml(5);
    try { const d = await api(`/api/admin/jejak?jenis=${encodeURIComponent(S.jenis)}&hal=${S.hal}`, { signal: S.ctl.signal }); S.baris = d.baris || []; S.galat = null; } catch (e) { if (e.name === "AbortError") return; S.galat = e.kode || "umum"; S.baris = []; }
    const b = S.baris;
    ubinKepala(panel, [{ ikon: "jejak", nilai: b.length >= 50 ? "50+" : b.length, label: t("aud.k.n") }, { ikon: "orang", nilai: new Set(b.map((r) => r.akun_nama ?? r.akun ?? r.akun_id)).size, label: t("aud.k.akun") }, { ikon: "ubah", nilai: new Set(b.map((r) => r.aksi)).size, label: t("aud.k.aksi") }]);
    nanti(gambar);
  }
  function gambar() {
    const el = $("aDaftar"); if (!el) return;
    if (S.galat) el.innerHTML = keadaan(S.galat);
    else if (!S.baris.length) el.innerHTML = kosongHtml("jm.kosong.cocok", S.jenis ? { data: "reset", kunci: "jm.kosong.reset" } : null);
    else {
      el.innerHTML = `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>${["jejak.k.waktu", "aud.c.akun", "jejak.k.aksi", "aud.c.entitas", "aud.c.ringkas"].map((k) => `<th scope="col">${esc(t(k))}</th>`).join("")}</tr></thead><tbody>${S.baris.map((r) => `<tr>
        <td class="jm-nowrap" data-l="${esc(t("jejak.k.waktu"))}">${tgl(r.waktu)}</td><td data-l="${esc(t("aud.c.akun"))}">${esc(r.akun_nama ?? r.akun ?? (r.akun_id != null ? "#" + r.akun_id : t("jejak.sistem")))}</td>
        <td data-l="${esc(t("jejak.k.aksi"))}"><span class="jm-adm-aksi">${ikon(IK_AKSI[r.aksi] || "jejak", 16)}${esc(ada("aud.aksi." + r.aksi) ? t("aud.aksi." + r.aksi) : r.aksi)}</span></td>
        <td data-l="${esc(t("aud.c.entitas"))}">${esc(r.entitas || "-")}${r.entitas_id ? `<small>${esc("#" + r.entitas_id)}</small>` : ""}</td><td data-l="${esc(t("aud.c.ringkas"))}">${esc(r.ringkas || "-")}</td></tr>`).join("")}</tbody></table></div>`;
    }
    $("aHal").innerHTML = paginasiHtml({ hal: S.hal, per: 50, n: S.baris.length, ada: S.baris.length >= 50, satuan: "jm.pag.u.data" });
  }
}
