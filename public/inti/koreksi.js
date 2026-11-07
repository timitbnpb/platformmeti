/* Laporkan koreksi: tombol + modal form -> POST /api/koreksi. Dipakai /o/, /p/, regulasi, dan admin (Kesehatan data).
   Umpan balik tampil di dalam dialog (dialog modal menutupi toast). */
import { t } from "/i18n.js";
import { esc, ikon, api, galatTeks, pesanHtml } from "/inti/umum.js";

const KOLOM = {
  organisasi: ["nama", "situs", "kategori", "induk", "provinsi", "kota", "logo"],
  proyek: ["nama", "teknologi", "kapasitas", "status", "cod_target", "provinsi", "pengembang", "koordinat"],
  regulasi: ["judul", "status", "tanggal_ditetapkan", "instansi_penerbit", "url_pdf", "url_sumber"],
  orang: ["nama", "jabatan_terkini", "organisasi_terkini"],
};
const BERKAS = { organisasi: "organisasi", proyek: "proyek", regulasi: "regulasi", orang: "orang" };
const AMBIL = {
  provinsi: (o) => o.lokasi?.provinsi, kota: (o) => o.lokasi?.kota, kategori: (o) => o.kategori?.label,
  kapasitas: (p) => (p.kapasitas?.[0] ? `${p.kapasitas[0].nilai} ${p.kapasitas[0].satuan}` : ""),
  status: (p) => (Array.isArray(p.status) ? p.status[0]?.nilai : p.status),
  cod_target: (p) => (p.cod_target || []).map((c) => c.nilai).join(", "),
  pengembang: (p) => (p.pihak?.pemilik || []).map((x) => x.nilai).join(", "),
  koordinat: (p) => (p.lokasi?.lat != null ? `${p.lokasi.lat}, ${p.lokasi.lng}` : ""),
};
export const kolomEntitas = (e) => KOLOM[e] || [];
/** nilai kolom yang tampil di data sekarang ("" bila kosong). */
export const nilaiKolom = (rec, kolom) => { const v = rec ? (AMBIL[kolom] ? AMBIL[kolom](rec) : rec[kolom]) : ""; return v == null ? "" : String(v); };
export const labelKolom = (k) => t("kor.k." + k);

const cache = {};
const muat = (e) => (cache[e] ||= fetch(`/data/${BERKAS[e]}.json`).then((r) => r.json()).catch(() => ({ baris: [] })));

export const tombolKoreksi = ({ entitas, id, nama, kolom = "" }) =>
  `<button type="button" class="jm-tbl jm-tbl-kecil jm-koreksi-tbl" data-koreksi="1" data-ent="${esc(entitas)}" data-eid="${esc(id)}" data-nama="${esc(nama || "")}" data-kolom="${esc(kolom)}">${ikon("ubah", 16)}${esc(t(kolom ? "kor.usulkan" : "kor.tombol"))}</button>`;

let dlg = null;
function dialog() {
  if (dlg) return dlg;
  dlg = document.createElement("dialog");
  dlg.className = "jm-dlg jm-koreksi";
  dlg.setAttribute("aria-labelledby", "korJudul");
  document.body.append(dlg);
  dlg.addEventListener("click", (e) => { if (e.target.closest("[data-aksi=batal]") || e.target === dlg) dlg.close(); });
  dlg.addEventListener("change", (e) => { if (e.target.id === "korKolom") sekarang(); });
  dlg.addEventListener("submit", kirim);
  return dlg;
}
let rec = null;
function sekarang() {
  const k = dlg.querySelector("#korKolom").value, v = nilaiKolom(rec, k), el = dlg.querySelector("#korNow");
  el.textContent = v || t("kor.kosong");
}

export async function bukaKoreksi({ entitas, id, nama, kolom }) {
  const d = dialog();
  const kolomOk = KOLOM[entitas] || [];
  rec = null;
  d.innerHTML = `<form class="jm-form" id="korForm" novalidate data-ent="${esc(entitas)}" data-eid="${esc(id)}">
    <h2 id="korJudul">${esc(t("kor.judul"))}</h2><p class="jm-bantu">${esc(nama || id)}</p>
    <div class="jm-medan"><label for="korKolom">${esc(t("kor.f.kolom"))}</label><select class="jm-pilih" id="korKolom">${kolomOk.map((k) => `<option value="${k}"${k === kolom ? " selected" : ""}>${esc(labelKolom(k))}</option>`).join("")}</select></div>
    <div class="jm-medan"><span class="jm-bantu">${esc(t("kor.f.sekarang"))}</span><strong id="korNow">-</strong></div>
    <div class="jm-medan"><label for="korNilai">${esc(t("kor.f.usulan"))}</label><textarea class="jm-isian" id="korNilai" rows="2" maxlength="500" required></textarea></div>
    <div class="jm-medan"><label for="korAlasan">${esc(t("kor.f.alasan"))}</label><textarea class="jm-isian" id="korAlasan" rows="3" maxlength="1000" required></textarea></div>
    <div class="jm-medan"><label for="korSumber">${esc(t("kor.f.sumber"))}</label><input class="jm-isian" id="korSumber" type="url" inputmode="url" autocomplete="off" maxlength="500" placeholder="https://"></div>
    <div id="korPesan"></div>
    <div class="jm-aksi"><button type="submit" class="jm-tbl jm-tbl-utama" id="korKirim">${esc(t("kor.kirim"))}</button><button type="button" class="jm-tbl" data-aksi="batal">${esc(t("jm.batal"))}</button></div></form>`;
  if (!d.open) d.showModal();
  const semua = await muat(entitas);
  rec = (semua.baris || []).find((r) => r.id === id) || null;
  if (d.open) sekarang();
}

async function kirim(e) {
  e.preventDefault();
  const f = e.target, $ = (i) => f.querySelector("#" + i);
  const badan = { entitas: f.dataset.ent, entitas_id: f.dataset.eid, kolom: $("korKolom").value, nilai_usulan: $("korNilai").value.trim(), alasan: $("korAlasan").value.trim() };
  const u = $("korSumber").value.trim();
  if (u) { if (!/^https?:\/\//i.test(u)) { $("korPesan").innerHTML = pesanHtml("galat", t("kor.url_salah")); return; } badan.sumber_url = u; }
  if (!badan.nilai_usulan || !badan.alasan) { $("korPesan").innerHTML = pesanHtml("galat", galatTeks("salah-masukan")); return; }
  const tbl = $("korKirim");
  tbl.disabled = true;
  try {
    await api("/api/koreksi", { metode: "POST", badan });
    f.innerHTML = `<h2 id="korJudul">${esc(t("kor.terima_kasih"))}</h2>${pesanHtml("ok", t("kor.terkirim"))}<div class="jm-aksi"><button type="button" class="jm-tbl jm-tbl-utama" data-aksi="batal">${esc(t("jm.tutup"))}</button></div>`;
  } catch (err) {
    tbl.disabled = false;
    $("korPesan").innerHTML = pesanHtml("galat", err.kode === "fitur_belum_aktif" ? t("adm.belum_aktif") : err.status === 429 ? t("kor.laju") : galatTeks(err.kode || "umum"));
  }
}

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-koreksi]");
  if (b) bukaKoreksi({ entitas: b.dataset.ent, id: b.dataset.eid, nama: b.dataset.nama, kolom: b.dataset.kolom });
});
