/* Tab "Integritas" pada /karbon: bendera "perlu verifikasi" per proyek karbon (data publik, bahasa netral). Dipasang: integritas(elemen).
   Bendera bukan tuduhan; tiap bendera memuat fakta, sumber, tanggal, dan tombol hak jawab (formulir koreksi). */
import { esc, ikon } from "/inti/umum.js";
import { t, tanggal } from "/i18n.js";
import { exHtml, pilihHtml, hitungHtml } from "/inti/komponen.js";
import { aksiHtml, hlHtml } from "/inti/aksi_ex.js";
import { bukaKoreksi } from "/inti/koreksi.js";
import { muatJson, pilTingkat, pasangCss } from "/klaim_lahan_ui.js";

const RANK = { tinggi: 3, perhatian: 2, info: 1 };

export async function integritas(el) {
  pasangCss();
  let D, K;
  try { [D, K] = await Promise.all([muatJson("/data/integritas_karbon.json"), muatJson("/data/klaim_lahan.json")]); } catch (e) { el.innerHTML = `<p class="kl2-kos">${esc(t("kl2.i.gagal"))}</p>`; return; }
  const tk = Object.fromEntries(D.jenis.map((j) => [j.id, j.tingkat])), ik = Object.fromEntries(D.jenis.map((j) => [j.id, j.ikon]));
  const prov = (kode) => (kode ? K.provinsi[kode]?.nama || kode : "-");
  const sektor = [...new Set(D.baris.map((b) => b.teknologi).filter(Boolean))].sort();
  const provs = [...new Set(D.baris.map((b) => b.prov).filter(Boolean))].sort((a, b) => prov(a).localeCompare(prov(b)));
  const filter = `<div class="kl2-saring">
    ${pilihHtml({ id: "kl2-fj", ikon: "peringatan", label: t("kl2.i.f_jenis"), opsi: [["", t("kl2.i.semua_jenis"), "peringatan"], ...D.jenis.map((j) => [j.id, t("kl2.i.j." + j.id), j.ikon])] })}
    ${pilihHtml({ id: "kl2-fp", ikon: "wilayah", label: t("kl2.i.f_prov"), opsi: [["", t("kl2.i.semua_prov"), "wilayah"], ...provs.map((p) => [p, prov(p), "prov:" + prov(p)])] })}
    ${pilihHtml({ id: "kl2-fs", ikon: "jenis", label: t("kl2.i.f_sektor"), opsi: [["", t("kl2.i.semua_sektor"), "jenis"], ...sektor.map((s) => [s, s.replace(/-/g, " "), "tek:" + s])] })}</div>`;
  const hitung = Object.entries(D.hitung).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<div class="kl2-u">${pilTingkat(tk[k], t("kl2.i.j." + k))}<b>${n}</b><small>${esc(t("kl2.i.proyek"))}</small></div>`).join("");
  const tidak = D.tidak_diperiksa.map((x) => `<p><b>${esc(t("kl2.i.td." + x.id))}</b>: ${esc(x.alasan)}</p>`).join("");
  el.innerHTML = exHtml({ id: "integritas", ikon: "perisai", topik: t("kl2.i.ey"), judulHtml: hlHtml("kl2.i.j", String(D.dengan_bendera), { total: D.jumlah_proyek }), subHtml: `${esc(t("kl2.i.sub"))} <span class="kl2-hip">${esc(t("kl2.hip"))}</span>`, aksiHtml: aksiHtml({ csv: false }),
    isiHtml: `<div class="kl2-ubin">${hitung}</div>${filter}<p class="kl2-x">${hitungHtml({ id: "kl2-n", teks: "" })}</p><div id="kl2-tbl"></div><div class="kl2-kartu kl2-atas"><h3>${ikon("info", 18)}${esc(t("kl2.i.td"))}</h3><div class="kl2-fk kl2-polos">${tidak}<p><small>${esc(D.catatan)}</small></p></div></div>` });
  const tbl = el.querySelector("#kl2-tbl"), nilai = (i) => el.querySelector(i).value;
  const gambar = () => {
    const j = nilai("#kl2-fj"), p = nilai("#kl2-fp"), s = nilai("#kl2-fs");
    const b = D.baris.filter((r) => (!p || r.prov === p) && (!s || r.teknologi === s) && (!j || r.bendera.some((x) => x.jenis === j)))
      .sort((a, c) => Math.max(0, ...c.bendera.map((x) => RANK[tk[x.jenis]])) - Math.max(0, ...a.bendera.map((x) => RANK[tk[x.jenis]])) || a.nama.localeCompare(c.nama));
    el.querySelector("#kl2-n").textContent = t("kl2.i.n", { n: b.length });
    tbl.innerHTML = b.length ? `<table class="kl2-tbl"><colgroup><col class="kl2-k1"><col class="kl2-k2"><col class="kl2-k3"></colgroup><thead><tr><th>${esc(t("kl2.i.c_proyek"))}</th><th>${esc(t("kl2.i.c_wilayah"))}</th><th>${esc(t("kl2.i.c_bendera"))}</th></tr></thead><tbody>${b.map((r) => `<tr data-id="${esc(r.id)}" tabindex="0"><td><b>${esc(r.nama)}</b><br><small class="kl2-x">${esc(r.registri)} ${esc(r.registri_id || "")}</small></td><td>${esc(prov(r.prov))}${r.teknologi ? `<br><small class="kl2-x">${esc(r.teknologi.replace(/-/g, " "))}</small>` : ""}</td><td><div class="kl2-bn">${r.bendera.map((x) => pilTingkat(tk[x.jenis], t("kl2.i.j." + x.jenis))).join("")}</div></td></tr>`).join("")}</tbody></table>` : `<p class="kl2-kos">${esc(t("kl2.i.kosong"))}</p>`;
  };
  el.addEventListener("change", (e) => { if (e.target.id?.startsWith("kl2-f")) gambar(); });
  const rinci = (id) => {
    const r = D.baris.find((x) => x.id === id); if (!r) return;
    const d = document.createElement("dialog"); d.className = "kl2-bd";
    d.innerHTML = `<article><header><h2 class="kl2-h2">${esc(r.nama)}</h2><small class="kl2-x">${esc([`${r.registri} ${r.registri_id || ""}`.trim(), r.prov ? prov(r.prov) : ""].filter(Boolean).join(" - "))}</small></header>
      ${r.bendera.map((x) => `<div class="kl2-fk">${pilTingkat(tk[x.jenis], t("kl2.i.j." + x.jenis))}<p>${esc(x.fakta)}</p><small>${esc(t("kl2.i.sumber"))}: ${x.sumber.url ? `<a href="${esc(x.sumber.url)}" target="_blank" rel="noopener noreferrer">${esc(x.sumber.judul)}</a>` : esc(x.sumber.judul)} - ${esc(tanggal(x.tanggal))} - ${esc(t("kl2.i.perlu"))}</small></div>`).join("")}
      <p class="kl2-x">${esc(t("kl2.i.hak_jawab"))}</p>
      <div class="jm-aksi"><button type="button" class="jm-tbl jm-tbl-utama" data-k="1">${ikon("ubah", 16)} ${esc(t("kl2.i.koreksi"))}</button><button type="button" class="jm-tbl" data-x="1">${esc(t("jm.tutup"))}</button></div></article>`;
    d.addEventListener("click", (e) => { if (e.target.closest("[data-x]") || e.target === d) d.close(); if (e.target.closest("[data-k]")) { d.close(); bukaKoreksi({ entitas: "proyek", id: r.id, nama: r.nama }); } });
    d.addEventListener("close", () => d.remove()); document.body.append(d); d.showModal();
  };
  tbl.addEventListener("click", (e) => { const tr = e.target.closest("tr[data-id]"); if (tr) rinci(tr.dataset.id); });
  tbl.addEventListener("keydown", (e) => { if (e.key === "Enter") { const tr = e.target.closest("tr[data-id]"); if (tr) rinci(tr.dataset.id); } });
  gambar();
}
