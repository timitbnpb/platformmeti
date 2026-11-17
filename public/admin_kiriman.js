/* /admin: tab Kiriman (F65-206..208). Antrean foto tonggak proyek, minat listrik hijau, dan kebutuhan dana proyek; admin menyetujui atau menolak (alasan wajib).
   Hak ditegakkan di server (admin, super). Segmen jenis dan status berubah seketika; isi tabel menyusul. */
import { t, angka, tanggal } from "/i18n.js";
import { esc, api, nanti, hantuHtml, kosongHtml, galatHtml, ikon, galatTeks } from "/inti/umum.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { PROV } from "/inti/prov_singkat.js";
import { SATUAN_UNIT, PUTUSAN } from "/inti/minat_enum.js";
import { pilihHtml } from "/inti/komponen.js";

const JENIS = [["foto", "gambar"], ["hijau", "petir"], ["dana", "kartu"], ["mentor", "akademi"], ["minta", "orang"], ["lencana", "perisai"], ["laporan", "bendera"], ["unit", "transaksi"], ["stan", "gedung"], ["fakta", "tanya"]], STATUS = ["menunggu", "disetujui", "ditolak", "ditarik"];
const PIL = { menunggu: "jm-pil-warn", disetujui: "jm-pil-ok", ditolak: "jm-pil-bad", ditarik: "" };
const tgl = (u) => tanggal(new Date(u * 1000).toISOString().slice(0, 10));
const uang = (n, mu) => `${mu === "USD" ? "US$" : "Rp"} ${angka(n)}`;
/* Nama dari potret (D1 hanya menyimpan id). Server tidak memeriksa apakah organisasi pengirim adalah pihak proyeknya, jadi itu ditampilkan di sini supaya peninjau menilai. */
const NAMA = { org: null, pro: null };
async function muatNama() {
  if (NAMA.org) return;
  const ambil = (f) => fetch("/data/" + f, { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : { baris: [] })).catch(() => ({ baris: [] }));
  const [o, p] = await Promise.all([ambil("organisasi.json"), ambil("proyek.json")]);
  NAMA.org = new Map(o.baris.map((x) => [x.id, x])); NAMA.pro = new Map(p.baris.map((x) => [x.id, x]));
}
const pihak = (oid, pid) => { const o = NAMA.org?.get(oid), p = NAMA.pro?.get(pid); return !!(o && p) && ((o.proyek_ids || []).includes(pid) || Object.values(p.pihak || {}).flat().some((x) => x?.organisasi_id === oid)); };
const asalHtml = (r) => `<a href="/p/${encodeURIComponent(r.proyek_id)}">${esc(NAMA.pro?.get(r.proyek_id)?.nama || r.proyek_id)}</a>, ${esc(t("akr.oleh_org"))} <a href="/o/${encodeURIComponent(r.organisasi_id)}">${esc(NAMA.org?.get(r.organisasi_id)?.nama || r.organisasi_id)}</a>
  <span class="jm-pil ${pihak(r.organisasi_id, r.proyek_id) ? "jm-pil-ok" : "jm-pil-warn"}">${ikon(pihak(r.organisasi_id, r.proyek_id) ? "centang" : "peringatan", 14)}<span>${esc(t(pihak(r.organisasi_id, r.proyek_id) ? "akr.pihak_ya" : "akr.pihak_tidak"))}</span></span>`;
const luar = (u, teks) => (/^https:\/\//.test(u || "") ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(teks)}</a>` : "");
const sumberJson = (v) => { try { const a = JSON.parse(v || "[]"); return Array.isArray(a) ? a : []; } catch { return []; } };
const ISI = {
  unit: (r) => `<span><b>${esc(t("mu.arah." + r.arah))} ${esc(t("mu.jenis." + r.jenis))}, ${esc(angka(r.volume))} ${SATUAN_UNIT[r.jenis]}</b><small>${esc(PROV[r.prov]?.[0] || r.prov)}${r.rujukan ? ", " + esc(t((r.jenis === "rec" ? "pj.tek." : "mu.reg.") + r.rujukan)) : ""}, ${r.organisasi_id ? `<a href="/o/${encodeURIComponent(r.organisasi_id)}">${esc(NAMA.org?.get(r.organisasi_id)?.nama || r.organisasi_id)}</a>` : esc(t("mu.org_tanpa"))}. ${esc(r.uraian)}</small></span>`,
  stan: (r) => `<span><b>${esc(r.organisasi)}</b><small><a href="/event/${encodeURIComponent(r.event_id)}">${esc(r.event_id)}</a>, ${esc(r.kebutuhan)}</small></span>`,
  fakta: (r) => `<span><b>${esc(r.kutipan)}</b><small>${esc(t("cf.penutur", { nama: r.penutur, tgl: tanggal(r.tanggal) }))} ${luar(r.sumber_url, t("cf.sumber_klaim"))}${r.putusan ? `. ${esc(t("cf.putusan." + r.putusan))}: ${esc(r.penjelasan)} ${sumberJson(r.sumber).map((u, i) => luar(u, t("cf.sumber_n", { n: i + 1 }))).join(" ")}` : ""}</small></span>`,
  lencana: (r) => `<span><b>${esc(t("kr.lc.jenis." + r.jenis))}</b><small><a href="/o/${encodeURIComponent(r.organisasi_id)}">${esc(NAMA.org?.get(r.organisasi_id)?.nama || r.organisasi_id)}</a>, ${esc(r.uraian)} <a href="${esc(/^https:\/\//.test(r.bukti_url) ? r.bukti_url : "#")}" target="_blank" rel="noopener noreferrer">${esc(t("kr.lc.bukti"))}</a></small></span>`,
  laporan: (r) => `<span><b><a href="/p/${encodeURIComponent(r.proyek_id)}">${esc(NAMA.pro?.get(r.proyek_id)?.nama || r.proyek_id)}</a></b><small>${esc(r.isi)}</small></span>`,
  mentor: (r) => `<span><b>${esc(t("bid.n." + r.bidang))}</b><small>${esc(r.uraian)}</small></span>`,
  minta: (r) => `<span><b>${esc(t("akr.minta.ke", { id: r.mentor_id }))}</b><small>${esc(r.pesan)}</small></span>`,
  foto: (r) => `<a href="/api/proyek-foto/${r.id}" target="_blank" rel="noopener"><img class="akr-foto" src="/api/proyek-foto/${r.id}" alt="${esc(r.keterangan)}" width="96" height="72" loading="lazy"></a><span><b>${esc(r.keterangan)}</b><small>${asalHtml(r)}</small></span>`,
  hijau: (r) => `<span><b>${esc(r.perusahaan)}</b><small>${esc(PROV[r.prov]?.[0] || r.prov)}, ${esc(angka(r.mwh_tahun))} MWh, ${esc(String(r.tahun_mulai))}${r.catatan ? ", " + esc(r.catatan) : ""}</small></span>`,
  dana: (r) => `<span><b>${esc(uang(r.jumlah, r.mata_uang))}</b> ${esc(t("kr.dana.jenis." + r.jenis))}<small>${asalHtml(r)} ${esc(r.uraian)}</small></span>`,
};

export function panelKiriman(el) {
  const S = { jenis: "foto", status: "menunggu", hal: 1, d: null };
  const seg = (nama, daftar, aktif, label, ik) => `<div class="jm-tab jm-tab-rata" role="tablist" aria-label="${esc(t(label))}">${daftar.map((x) => { const k = Array.isArray(x) ? x[0] : x; return `<button type="button" role="tab" data-${nama}="${k}" aria-selected="${k === aktif}">${Array.isArray(x) ? ikon(x[1], 16) : ""}<span>${esc(t(ik + k))}</span></button>`; }).join("")}</div>`;
  el.innerHTML = `<header class="jm-adm-bhd"><div><h3>${esc(t("akr.j"))}</h3><p class="jm-bantu">${esc(t("akr.bantu"))}</p></div></header>
    ${seg("jenis", JENIS, S.jenis, "akr.jenis", "akr.jn.")}${seg("status", STATUS, S.status, "akr.status", "kr.st.")}<div id="akrHost"></div>`;
  const host = el.querySelector("#akrHost");
  async function muat() {
    host.innerHTML = hantuHtml(4);
    try { S.d = await api(`/api/admin/kiriman?jenis=${S.jenis}&status=${S.status}&hal=${S.hal}`); } catch (e) { host.innerHTML = galatHtml(e.kode || "umum"); return; }
    if (["foto", "dana", "lencana", "laporan", "unit"].includes(S.jenis) && S.d.baris.length) await muatNama();
    nanti(gambar);
  }
  function gambar() {
    const { baris, total, per } = S.d;
    if (!baris.length) { host.innerHTML = kosongHtml("akr.kosong"); return; }
    host.innerHTML = `<div class="jm-gulir"><table class="jm-tabel" data-urut="tidak"><thead><tr>${["isi", "pengirim", "tgl", "status", "aksi"].map((k) => `<th scope="col">${esc(t("akr.c." + k))}</th>`).join("")}</tr></thead><tbody>${baris.map((r) => `<tr>
      <td data-l="${esc(t("akr.c.isi"))}"><span class="akr-isi">${ISI[S.jenis](r)}</span></td><td data-l="${esc(t("akr.c.pengirim"))}">${esc(r.pengirim || "-")}</td><td class="jm-nowrap" data-l="${esc(t("akr.c.tgl"))}">${esc(tgl(r.dibuat))}</td>
      <td data-l="${esc(t("akr.c.status"))}"><span class="jm-pil ${PIL[r.status]}">${esc(t("kr.st." + r.status))}</span>${r.alasan ? `<small>${esc(r.alasan)}</small>` : ""}</td>
      <td data-l="${esc(t("akr.c.aksi"))}">${r.status === "menunggu" ? `<span class="akr-aksi">${S.jenis === "fakta" ? `<button type="button" class="jm-tbl jm-tbl-kecil jm-tbl-utama" data-vonis="${r.id}">${ikon("ubah", 14)}<span>${esc(t("cf.adm.tulis"))}</span></button>` : `<button type="button" class="jm-tbl jm-tbl-kecil jm-tbl-utama" data-putus="setuju:${r.id}">${ikon("centang", 14)}<span>${esc(t("akr.setuju"))}</span></button>`}<button type="button" class="jm-tbl jm-tbl-kecil" data-putus="tolak:${r.id}">${ikon("silang", 14)}<span>${esc(t("akr.tolak"))}</span></button></span>` : "-"}</td></tr>`).join("")}</tbody></table></div>
      ${paginasiHtml({ hal: S.hal, total, per })}`;
  }
  el.addEventListener("click", async (e) => {
    const j = e.target.closest("[data-jenis],[data-status]");
    if (j) { // chrome dulu, data menyusul
      const kunci = j.dataset.jenis ? "jenis" : "status"; S[kunci] = j.dataset[kunci]; S.hal = 1;
      for (const b of j.parentElement.children) b.setAttribute("aria-selected", String(b === j));
      return void nanti(muat);
    }
    const h = e.target.closest(".jm-pag-b[data-hal]");
    if (h) { S.hal = +h.dataset.hal; sorotHalaman(h, S.hal); return void nanti(muat); }
    if (e.target.closest("[data-aksi=ulang]")) return void muat();
    const v = e.target.closest("[data-vonis]");
    if (v) return void bukaVonis(v.dataset.vonis);
    const p = e.target.closest("[data-putus]");
    if (!p) return;
    const [aksi, id] = p.dataset.putus.split(":");
    let alasan;
    if (aksi === "tolak") { alasan = prompt(t("akr.alasan_tanya")); if (alasan == null) return; if (alasan.trim().length < 3) return alert(t("akr.alasan_wajib")); }
    p.disabled = true;
    try { await api(`/api/admin/kiriman/${S.jenis}/${id}`, { metode: "POST", badan: aksi === "tolak" ? { aksi, alasan: alasan.trim() } : { aksi } }); muat(); }
    catch (x) { p.disabled = false; alert(galatTeks(x.kode)); }
  });
  /* F65-306: putusan redaksi atas klaim. Wajib enum, penjelasan, dan minimal satu tautan sumber https (server menolak selain itu). */
  function bukaVonis(id) {
    document.getElementById("akrVonis")?.remove();
    const f = (fid, label, attr, tag = "input") => `<label class="akr-f"><span>${esc(label)}</span><${tag} id="${fid}" ${attr}>${tag === "textarea" ? "</textarea>" : ""}</label>`;
    document.body.insertAdjacentHTML("beforeend", `<dialog id="akrVonis" class="akr-vonis" aria-labelledby="akrVonisJ"><form method="dialog" novalidate><h3 id="akrVonisJ">${esc(t("cf.adm.j"))}</h3>
      <div class="akr-f"><span>${esc(t("cf.adm.putusan"))}</span>${pilihHtml({ id: "akrVP", ikon: "tanya", label: t("cf.adm.putusan"), opsi: PUTUSAN.map((k) => [k, t("cf.putusan." + k)]), nilai: "tidak_pasti" })}</div>
      ${f("akrVT", t("cf.adm.penjelasan"), 'rows="6" maxlength="1500" required', "textarea")}${f("akrVS1", t("cf.adm.sumber1"), 'type="url" inputmode="url" maxlength="600" placeholder="https://" required')}${f("akrVS2", t("cf.adm.sumber2"), 'type="url" inputmode="url" maxlength="600" placeholder="https://"')}
      <p id="akrVPs" class="jm-bantu" role="alert" hidden></p>
      <div class="akr-aksi"><button type="button" class="jm-tbl jm-tbl-utama" data-simpan>${ikon("centang", 16)}<span>${esc(t("cf.adm.simpan"))}</span></button><button type="submit" class="jm-tbl">${esc(t("cf.adm.batal"))}</button></div></form></dialog>`);
    const d = document.getElementById("akrVonis"), $ = (i) => d.querySelector("#" + i);
    d.addEventListener("close", () => d.remove());
    d.querySelector("[data-simpan]").addEventListener("click", async (ev) => {
      const tbl = ev.currentTarget, ps = $("akrVPs"), sumber = [$("akrVS1").value.trim(), $("akrVS2").value.trim()].filter(Boolean);
      if ($("akrVT").value.trim().length < 20 || !sumber.length) { ps.hidden = false; ps.textContent = t("cf.adm.kurang"); return; }
      tbl.disabled = true;
      try { await api(`/api/admin/cek-fakta/${id}`, { metode: "POST", badan: { putusan: $("akrVP").value, penjelasan: $("akrVT").value, sumber } }); d.close(); muat(); }
      catch (x) { tbl.disabled = false; ps.hidden = false; ps.textContent = galatTeks(x.kode); }
    });
    d.showModal();
  }
  muat();
}
