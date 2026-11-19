/* iuran_layar.js (F65-301): perpanjangan iuran mandiri di /kta dan antrean bukti di /admin (tab KTA). Data dari /api/iuran*.
   Jumlah iuran selalu dari server. Jalur yang belum aktif (bayar online tanpa kunci penyedia, bukti tanpa rekening) tidak ditampilkan sama sekali.
   Semua teks dari server (nama, alasan tolak) hanya masuk lewat esc. */
import { t, angka, tanggal } from "/i18n.js";
import { api, esc, ikon, nanti, galatTeks, hantuHtml, kosongHtml, galatHtml, pesanHtml } from "/inti/umum.js";

const MAKS_BUKTI = 5 * 1024 * 1024;
const PIL = { menunggu: "", lunas: "jm-pil-ok", gagal: "jm-pil-warn", ditolak: "jm-pil-bad" };
const rp = (n) => "Rp " + angka(n);
const tgl = (detik) => tanggal(new Date(detik * 1000).toISOString().slice(0, 10));
const pilStatus = (s) => `<span class="jm-pil ${PIL[s] ?? ""}">${esc(t("iu.st." + s))}</span>`;

/* ---------- /kta: bagian "Perpanjang keanggotaan" ---------- */
export async function pasangIuran(w, dlg) {
  let d;
  try { d = await api("/api/iuran"); } catch (e) { w.replaceChildren(); return; }   // fitur belum aktif atau galat: bagian tidak tampil
  if (!d.boleh && !d.riwayat.length) { w.replaceChildren(); return; }
  const menunggu = d.riwayat.find((r) => r.status === "menunggu" && r.jalur === "bukti");
  const bayar = !d.boleh ? "" : `<dl class="kta-dl"><div><dt>${esc(t("kta.kartu.berlaku"))}</dt><dd>${esc(tanggal(d.kta.berlaku_sampai, { gaya: "panjang" }))}</dd></div><div><dt>${esc(t("iu.tarif"))}</dt><dd><b>${esc(rp(d.tarif))}</b></dd></div></dl>
    <p class="kta-bantu">${esc(t("iu.ket"))}</p>
    ${d.online ? `<div class="kta-aksi"><button type="button" class="jm-tbl jm-tbl-utama" data-iu="online">${ikon("kartu", 18)}<span>${esc(t("iu.online"))}</span></button></div>` : ""}
    ${!d.bukti ? "" : menunggu ? `<p class="kta-bantu" role="status">${pilStatus("menunggu")} ${esc(t("iu.bukti.menunggu"))}</p>` : `<div class="iu-bukti"><h3>${esc(t("iu.bukti.j"))}</h3>
      <p class="kta-bantu">${esc(t("iu.bukti.rek", { bank: d.rekening.bank || "-", nomor: d.rekening.nomor, nama: d.rekening.nama || "-", jumlah: rp(d.tarif) }))}${d.rekening.catatan ? " " + esc(d.rekening.catatan) : ""}</p>
      <label class="iu-berkas"><span>${esc(t("iu.bukti.pilih"))}</span><input type="file" id="iuBerkas" accept="image/jpeg,image/png,image/webp,application/pdf"></label>
      <div class="kta-aksi"><button type="button" class="jm-tbl" data-iu="bukti">${ikon("unduh", 18)}<span>${esc(t("iu.bukti.kirim"))}</span></button></div></div>`}`;
  const riwayat = !d.riwayat.length ? "" : `<h3>${esc(t("iu.riwayat"))}</h3><div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr>${["tanggal", "jalur", "jumlah", "status", "aksi"].map((k) => `<th scope="col">${esc(t("iu.c." + k))}</th>`).join("")}</tr></thead><tbody>${d.riwayat.map((r) => `<tr>
      <td data-label="${esc(t("iu.c.tanggal"))}">${esc(tgl(r.dibuat))}</td><td data-label="${esc(t("iu.c.jalur"))}">${esc(t("iu.jalur." + r.jalur))}</td><td class="jm-num" data-label="${esc(t("iu.c.jumlah"))}">${esc(rp(r.gross))}</td>
      <td data-label="${esc(t("iu.c.status"))}">${pilStatus(r.status)}${r.alasan ? `<small>${esc(r.alasan)}</small>` : ""}</td>
      <td data-label="${esc(t("iu.c.aksi"))}">${r.status === "lunas" ? `<button type="button" class="jm-tbl jm-tbl-kecil" data-iu-bb="${esc(r.id)}">${ikon("pdf", 16)}<span>${esc(t("iu.bb.buka"))}</span></button>` : ""}</td></tr>`).join("")}</tbody></table></div>`;
  w.innerHTML = `<section class="kta-panel iu-panel" aria-labelledby="iuJudul"><h2 id="iuJudul">${ikon("kalender", 22)}<span>${esc(t("iu.j"))}</span></h2>${bayar}${riwayat}<div id="iuPesan" aria-live="polite"></div></section>`;
  const pesan = (j, tk) => { w.querySelector("#iuPesan").innerHTML = tk ? pesanHtml(j, tk) : ""; };
  w.onclick = async (e) => {
    const b = e.target.closest("[data-iu]"), bb = e.target.closest("[data-iu-bb]");
    if (bb) return nanti(() => bukaBukti(dlg, bb.dataset.iuBb, pesan));
    if (!b || b.disabled) return;
    b.disabled = true; b.setAttribute("aria-busy", "true");   // chrome urgent
    try {
      if (b.dataset.iu === "online") { const r = await api("/api/iuran/bayar-online", { metode: "POST", badan: {} }); location.assign(r.url); return; }
      const f = w.querySelector("#iuBerkas")?.files?.[0];
      if (!f) { pesan("galat", t("iu.bukti.kosong")); return; }
      if (f.size > MAKS_BUKTI) { pesan("galat", t("iu.bukti.besar")); return; }
      const r = await fetch("/api/iuran/bukti", { method: "POST", credentials: "same-origin", headers: { "x-pb": "1", "content-type": "application/octet-stream" }, body: f });
      if (!r.ok) { let kode = "umum"; try { kode = (await r.json()).kode || kode; } catch { /* tanpa badan */ } throw Object.assign(new Error(kode), { kode, status: r.status }); }
      await pasangIuran(w, dlg);
      w.querySelector("#iuPesan").innerHTML = pesanHtml("ok", t("iu.bukti.ok"));
    } catch (err) { pesan("galat", err.status === 415 ? t("iu.bukti.tipe") : galatTeks(err.kode || "umum")); }
    finally { if (b.isConnected) { b.disabled = false; b.removeAttribute("aria-busy"); } }
  };
}

/* Bukti pembayaran iuran yang bisa dicetak (bukan faktur pajak: data pajak METI tidak ada di platform). */
async function bukaBukti(dlg, id, pesan) {
  let k;
  try { k = await api(`/api/iuran/${encodeURIComponent(id)}/bukti-bayar`); } catch (e) { return pesan("galat", galatTeks(e.kode || "umum")); }
  const baris = [["nomor", k.nomor], ["tanggal", tanggal(k.tanggal, { gaya: "panjang" })], ["nama", k.nama], ["kta", k.nomor_kta || "-"], ["kategori", t("iu.jenis." + k.jenis)], ["jumlah", rp(k.gross)],
    ["status", t("iu.st." + k.status)], ["jalur", t("iu.jalur." + k.jalur)], ["berlaku", k.berlaku_sampai ? tanggal(k.berlaku_sampai, { gaya: "panjang" }) : "-"]];
  dlg.innerHTML = `<div class="iu-bb"><h2 id="dlgJudul">${esc(t("iu.bb.j"))}</h2><p class="iu-bb-org">${esc(t("iu.bb.org"))}</p>
    <dl class="kta-dl">${baris.map(([l, v]) => `<div><dt>${esc(t("iu.bb." + l))}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl><p class="kta-bantu">${esc(t("iu.bb.catatan"))}</p>
    <div class="kta-aksi iu-bb-aksi"><button type="button" class="jm-tbl jm-tbl-utama" data-cetak>${ikon("pdf", 18)}<span>${esc(t("iu.bb.cetak"))}</span></button><button type="button" class="jm-tbl" data-tutup>${esc(t("iu.bb.tutup"))}</button></div></div>`;
  dlg.onclick = (e) => {
    if (e.target.closest("[data-tutup]")) return dlg.close();
    if (e.target.closest("[data-cetak]")) { document.documentElement.classList.add("iu-cetak"); print(); document.documentElement.classList.remove("iu-cetak"); }
  };
  dlg.showModal();
}

/* ---------- /admin, tab KTA: antrean bukti perpanjangan ---------- */
export function panelIuranAdmin(el) {
  async function muat() {
    el.innerHTML = hantuHtml(2);
    let d;
    try { d = await api("/api/admin/iuran"); } catch (e) { el.innerHTML = e.status === 503 ? "" : galatHtml(e.kode || "umum"); return; }
    const kepala = `<h3 class="iu-adm-j">${ikon("kalender", 18)}<span>${esc(t("iu.adm.j"))}</span></h3><p class="jm-bantu">${esc(t("iu.adm.ket"))}</p>`;
    if (!d.baris.length) { el.innerHTML = kepala + kosongHtml("iu.adm.kosong"); return; }
    el.innerHTML = kepala + `<div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr>${["anggota", "tanggal", "jalur", "jumlah", "status", "aksi"].map((k) => `<th scope="col">${esc(t("iu.c." + k))}</th>`).join("")}</tr></thead><tbody>${d.baris.map((r) => `<tr>
      <td data-label="${esc(t("iu.c.anggota"))}"><b>${esc(r.nama)}</b><small>${esc(r.nomor_kta || "-")}, ${esc(t("iu.jenis." + r.jenis))}, ${esc(t("kta.kartu.berlaku"))} ${esc(r.kta_sampai ? tanggal(r.kta_sampai) : "-")}</small></td>
      <td data-label="${esc(t("iu.c.tanggal"))}">${esc(tgl(r.dibuat))}</td><td data-label="${esc(t("iu.c.jalur"))}">${esc(t("iu.jalur." + r.jalur))}</td><td class="jm-num" data-label="${esc(t("iu.c.jumlah"))}">${esc(rp(r.gross))}</td>
      <td data-label="${esc(t("iu.c.status"))}">${pilStatus(r.status)}${r.alasan ? `<small>${esc(r.alasan)}</small>` : ""}</td>
      <td data-label="${esc(t("iu.c.aksi"))}">${r.ada_bukti ? `<a class="jm-tbl jm-tbl-kecil" href="/api/iuran/${esc(r.id)}/bukti" target="_blank" rel="noopener noreferrer">${ikon("gambar", 16)}<span>${esc(t("iu.adm.lihat"))}</span></a>` : ""}${r.status === "menunggu" && r.jalur === "bukti" ? `<button type="button" class="jm-tbl jm-tbl-kecil jm-tbl-utama" data-iu-a="setuju" data-id="${esc(r.id)}">${ikon("centang", 16)}<span>${esc(t("iu.adm.setuju"))}</span></button><button type="button" class="jm-tbl jm-tbl-kecil" data-iu-a="tolak" data-id="${esc(r.id)}">${ikon("silang", 16)}<span>${esc(t("iu.adm.tolak"))}</span></button>` : ""}</td></tr>`).join("")}</tbody></table></div>`;
  }
  el.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-iu-a]"); if (!b || b.disabled) return;
    let alasan;
    if (b.dataset.iuA === "tolak") { alasan = prompt(t("iu.adm.alasan")); if (alasan == null) return; if (alasan.trim().length < 3) return alert(t("iu.adm.alasan_wajib")); }
    else if (!confirm(t("iu.adm.yakin"))) return;
    b.disabled = true;
    try { await api(`/api/admin/iuran/${encodeURIComponent(b.dataset.id)}`, { metode: "POST", badan: alasan ? { aksi: "tolak", alasan: alasan.trim() } : { aksi: "setuju" } }); muat(); }
    catch (err) { b.disabled = false; alert(galatTeks(err.kode || "umum")); }
  });
  muat();
}
