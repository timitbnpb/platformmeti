/* /admin: tab METI Wilayah. Admin memilih status per provinsi (satu sumber), menyunting profil, dan menyetujui tiap tahap pengajuan
   (diajukan -> ditinjau -> SK terbit -> pelantikan -> berdiri) atau menolak. Hak ditegakkan di server (hak.js); jejak audit otomatis.
   INP: tombol berubah seketika; tabel digambar lewat nanti(). */
import { t, tanggalDariUnix } from "/i18n.js";
import { esc, api, nanti, debounce, hantuHtml, galatTeks, pesanHtml, ikon, kosongHtml } from "/inti/umum.js";
import { cariHtml, pilihHtml, hitungHtml } from "/inti/komponen.js";
import { kepalaTab, keadaan } from "/admin_umum.js";

const STATUS = ["berdiri", "segera", "rencana", "belum"];
const TAHAP = ["diajukan", "ditinjau", "sk_terbit", "pelantikan", "berdiri"];
const KOLOM = [["ketua", 120], ["sekretaris", 120], ["bendahara", 120], ["sekretariat", 300], ["kontak_surel", 254], ["kontak_telp", 20], ["sk_nomor", 120], ["masa_bakti", 40], ["sumber", 300]];
const TGL = ["sk_tanggal", "tgl_pelantikan", "status_per"];
const BIDANG_STD = ["kebijakan", "organisasi", "riset-sdm", "industri-pembiayaan", "energi-daerah", "kepemudaan"];
const labelBidang = (b) => (BIDANG_STD.includes(b) ? t("mw.bidang." + b) : b);

export async function panelMetiWilayah(el) {
  if (!document.querySelector("link[href=\"/meti-wilayah.css\"]")) document.head.append(Object.assign(document.createElement("link"), { rel: "stylesheet", href: "/meti-wilayah.css" }));
  el.innerHTML = kepalaTab("wilayah", "adm.mw.ey", "adm.mw.j", "adm.mw.d") + `<div id="mwHost">${hantuHtml(5)}</div><div id="mwStatus" aria-live="polite"></div>`;
  const host = el.querySelector("#mwHost"), dlg = document.getElementById("dlg");
  const kabar = (j, tk) => { el.querySelector("#mwStatus").innerHTML = tk ? pesanHtml(j, tk) : ""; };
  let D = null, kat = null, cari = "", saringSt = "", wilJadi = [];

  async function muat() {
    try {
      [D, kat] = await Promise.all([api("/api/admin/meti-wilayah"), kat || fetch("/data/meti-wilayah.json").then((r) => r.json())]);
    } catch (e) { host.innerHTML = keadaan(e.kode || "umum"); return; }
    nanti(gambar);
  }
  const nama = (k) => kat.provinsi.find((p) => p.kode === k)?.nama || k;

  const PIL = { berdiri: "jm-pil-ok", segera: "jm-pil-warn", rencana: "jm-pil-warn", belum: "jm-pil-mati" };
  const tile = (ik, n, k, kls) => `<div class="jm-adm-tile ${kls}">${ikon(ik, 24)}<strong>${esc(n)}</strong><small>${esc(t(k))}</small></div>`;

  function gambar() {
    const per = new Map(D.wilayah.map((w) => [w.kode_prov, w]));
    wilJadi = kat.provinsi.map((p) => ({ kode_prov: p.kode, status: "belum", ...per.get(p.kode) }));
    const jum = (st) => wilJadi.filter((w) => w.status === st).length;
    const ajuan = D.ajuan.length ? D.ajuan.map(ajuanHtml).join("") : `<div class="jm-kosong">${ikon("daftar", 32)}<p><strong>${esc(t("adm.mw.ajuan_kosong"))}</strong></p><p class="jm-bantu">${esc(t("adm.mw.ajuan_kosong_d"))}</p></div>`;
    host.innerHTML = `<div class="jm-adm-tiles">${tile("centang", jum("berdiri"), "adm.mw.t.berdiri", "jm-tile-ok")}${tile("daftar", D.ajuan.length, "adm.mw.t.ajuan", "jm-tile-warn")}${tile("blokir", jum("belum"), "adm.mw.t.belum", "jm-tile-mati")}</div>
      <section class="jm-adm-kartu"><header class="jm-adm-kh">${ikon("daftar", 20)}<h3>${esc(t("adm.mw.ajuan"))}</h3><span class="jm-hitung">${esc(String(D.ajuan.length))}</span></header><div class="jm-adm-isi">${ajuan}</div></section>
      <section class="jm-adm-kartu"><header class="jm-adm-kh">${ikon("wilayah", 20)}<h3>${esc(t("adm.mw.wilayah"))}</h3>${hitungHtml({ id: "mwHitung", teks: "" })}</header>
        <div class="jm-adm-isi"><div class="jm-saring jm-ag-bar">${cariHtml({ id: "mwCari", label: t("adm.mw.cari") })}
          ${pilihHtml({ id: "mwSt", ikon: "status", label: t("adm.mw.f.saring"), opsi: [["", t("adm.mw.semua_status")], ...STATUS.map((v) => [v, t("mw.st." + v)])], nilai: saringSt })}</div>
        <div id="mwTabel"></div></div></section>`;
    host.querySelector("#mwCari").value = cari;
    isiWil();
  }

  function isiWil() {
    const q = cari.toLowerCase(), baris = wilJadi.filter((w) => (!saringSt || w.status === saringSt) && (!q || nama(w.kode_prov).toLowerCase().includes(q)));
    host.querySelector("#mwHitung").textContent = t("adm.mw.n", { n: baris.length });
    const th = (k) => `<th scope="col">${esc(t(k))}</th>`;
    const ring = (v, m) => { const x = String(v || ""); return x.length > m ? x.slice(0, m - 1) + "…" : x; };
    host.querySelector("#mwTabel").innerHTML = baris.length ? `<div class="jm-gulir"><table class="jm-tabel jm-mw-tabel"><thead><tr>${th("adm.mw.c.prov")}${th("adm.mw.c.status")}${th("adm.mw.c.ketua")}${th("adm.mw.c.sumber")}${th("adm.mw.c.aksi")}</tr></thead><tbody>${baris.map((w) => `<tr>
      <td data-l="${esc(t("adm.mw.c.prov"))}"><span class="jm-mw-nm"><img src="/img/provinsi/${esc(w.kode_prov)}.png" width="24" height="24" alt="" loading="lazy" decoding="async"><strong>${esc(nama(w.kode_prov))}</strong></span></td>
      <td data-l="${esc(t("adm.mw.c.status"))}"><span class="jm-pil ${PIL[w.status] || ""}">${esc(t("mw.st." + w.status))}</span></td>
      <td data-l="${esc(t("adm.mw.c.ketua"))}">${w.ketua ? esc(ring(w.ketua, 28)) : '<span class="jm-adm-mati">' + esc(t("mw.st.belum")) + "</span>"}</td>
      <td data-l="${esc(t("adm.mw.c.sumber"))}">${w.sumber ? `<span title="${esc(w.sumber)}">${esc(ring(w.sumber, 36))}</span>${w.status_per ? `<small>${esc(w.status_per)}</small>` : ""}` : '<span class="jm-adm-mati">' + esc(t("mw.st.belum")) + "</span>"}</td>
      <td class="jm-mw-aksi" data-l="${esc(t("adm.mw.c.aksi"))}"><button type="button" class="jm-tbl jm-tbl-kecil" data-aksi="sunting" data-k="${esc(w.kode_prov)}" aria-label="${esc(t("adm.mw.sunting"))}: ${esc(nama(w.kode_prov))}" title="${esc(t("adm.mw.sunting"))}">${ikon("ubah", 16)}</button></td></tr>`).join("")}</tbody></table></div>` : kosongHtml("jm.kosong.cocok");
  }
  const cariTunda = debounce(isiWil);
  host.addEventListener("input", (e) => { if (e.target.id === "mwCari") { cari = e.target.value.trim(); cariTunda(); } });
  host.addEventListener("change", (e) => { if (e.target.id === "mwSt") { saringSt = e.target.value; nanti(isiWil); } });

  function ajuanHtml(a) {
    const idx = TAHAP.indexOf(a.status), buka = idx >= 0 && idx < TAHAP.length - 1, isi = a.isi || {};
    const berkas = (a.berkas || []).map((b, i) => `<li><a href="/api/meti-wilayah/ajuan/${a.id}/berkas/${i}">${esc(b.nama)}</a> <small>${esc((b.ukuran / 1048576).toFixed(1))} MB</small></li>`).join("");
    return `<details class="jm-ex mw-adm-ajuan"><summary><b>#${a.id} ${esc(nama(a.kode_prov))}</b> <span class="jm-pil${a.status === "ditolak" ? " jm-pil-bad" : a.status === "berdiri" ? " jm-pil-ok" : ""}">${esc(t("mw.tahap." + a.status))}</span> <small>${esc(a.akun_nama || "-")} (${esc(a.akun_surel || "-")}), ${esc(tanggalDariUnix(a.waktu))}</small></summary>
      <dl class="mw-dl"><div><dt>${esc(t("mw.ketua"))}</dt><dd>${esc(isi.ketua || "-")}</dd></div><div><dt>${esc(t("mw.sekretaris"))}</dt><dd>${esc(isi.sekretaris || "-")}</dd></div><div><dt>${esc(t("mw.bendahara"))}</dt><dd>${esc(isi.bendahara || "-")}</dd></div>
        <div><dt>${esc(t("mw.sekretariat"))}</dt><dd>${esc(isi.sekretariat || "-")}</dd></div><div><dt>${esc(t("mw.f.formatur"))}</dt><dd>${esc((isi.formatur || []).join(", ") || "-")}</dd></div>
        <div><dt>${esc(t("mw.f.bidang"))}</dt><dd>${esc((isi.bidang || []).map(labelBidang).join(", "))}</dd></div><div><dt>${esc(t("adm.mw.kontak_pengaju"))}</dt><dd>${esc(isi.kontak || "-")}</dd></div></dl>
      ${berkas ? `<ul class="mw-daftar">${berkas}</ul>` : ""}${a.catatan ? `<p class="jm-bantu">${esc(a.catatan)}</p>` : ""}
      <div class="mw-aksi">${buka ? `<button type="button" class="jm-tbl jm-tbl-utama" data-aksi="tahap" data-id="${a.id}" data-ke="${TAHAP[idx + 1]}">${esc(t("adm.mw.setujui", { tahap: t("mw.tahap." + TAHAP[idx + 1]) }))}</button><button type="button" class="jm-tbl" data-aksi="tolak" data-id="${a.id}">${esc(t("adm.mw.tolak"))}</button>` : ""}</div></details>`;
  }

  const field = (id, kunci, nilai = "", mks = 120, tipe = "text") => `<div class="jm-medan jm-ambang"><input class="jm-isian" id="${id}" type="${tipe}" maxlength="${mks}" placeholder=" " value="${esc(nilai)}"><label for="${id}">${esc(t(kunci))}</label></div>`;
  function bukaDlg(html, onOk) {
    dlg.innerHTML = `<form class="jm-form" method="dialog" id="mwDlg">${html}<div id="mwDlgPesan" aria-live="polite"></div><div class="mw-aksi"><button type="submit" class="jm-tbl jm-tbl-utama" id="mwOk">${esc(t("adm.mw.simpan"))}</button><button type="button" class="jm-tbl" data-aksi="batal">${esc(t("jm.batal"))}</button></div></form>`;
    const f = dlg.querySelector("#mwDlg");
    dlg.querySelector("[data-aksi=batal]").addEventListener("click", () => dlg.close());
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const ok = f.querySelector("#mwOk"); ok.disabled = true;
      try { await onOk(f); dlg.close(); kabar("ok", t("adm.mw.tersimpan")); await muat(); }
      catch (err) { dlg.querySelector("#mwDlgPesan").innerHTML = pesanHtml("galat", err.status === 409 ? t("adm.mw.konflik") : galatTeks(err.kode || "umum")); ok.disabled = false; }
    });
    if (!dlg.open) dlg.showModal();
  }

  function sunting(kode) {
    const w = D.wilayah.find((x) => x.kode_prov === kode) || { status: "belum", bidang: [] };
    const opsi = STATUS.map((s) => `<option value="${s}"${w.status === s ? " selected" : ""} data-ikon="status">${esc(t("mw.st." + s))}</option>`).join("");
    bukaDlg(`<h2 id="dlgJudul">${esc(t("mw.nama", { prov: nama(kode) }))}</h2>
      <div class="jm-medan"><label for="f_status">${esc(t("mw.status"))}</label><select class="jm-isian" id="f_status" data-ikon="status">${opsi}</select></div>
      ${KOLOM.map(([k, m]) => field("f_" + k, "adm.mw.f." + k, w[k] || "", m)).join("")}
      ${TGL.map((k) => field("f_" + k, "adm.mw.f." + k, w[k] || "", 10, "date")).join("")}
      ${field("f_bidang", "adm.mw.f.bidang", (w.bidang || []).join("; "), 1200)}<p class="jm-bantu">${esc(t("adm.mw.f.bidang_bantu"))}</p>`, async (f) => {
      const badan = { status: f.querySelector("#f_status").value, bidang: f.querySelector("#f_bidang").value.split(";").map((x) => x.trim()).filter(Boolean) };
      for (const [k] of KOLOM) badan[k] = f.querySelector("#f_" + k).value.trim() || null;
      for (const k of TGL) badan[k] = f.querySelector("#f_" + k).value || null;
      await api("/api/admin/meti-wilayah/" + encodeURIComponent(kode), { metode: "PATCH", badan });
    });
  }

  function tahap(id, ke) {
    const sk = ke === "sk_terbit", pel = ke === "pelantikan";
    bukaDlg(`<h2 id="dlgJudul">${esc(t("adm.mw.setujui", { tahap: t("mw.tahap." + ke) }))}</h2>
      ${sk ? field("t_sk_nomor", "adm.mw.f.sk_nomor", "", 120) + field("t_sk_tanggal", "adm.mw.f.sk_tanggal", "", 10, "date") + field("t_masa_bakti", "adm.mw.f.masa_bakti", "", 40) : ""}
      ${pel ? field("t_tgl_pelantikan", "adm.mw.f.tgl_pelantikan", "", 10, "date") : ""}${field("t_catatan", "adm.mw.f.catatan", "", 1000)}`, async (f) => {
      const v = (i) => f.querySelector("#" + i)?.value.trim() || null;
      await api(`/api/admin/meti-wilayah/ajuan/${id}/tahap`, { metode: "POST", badan: { ke, sk_nomor: v("t_sk_nomor"), sk_tanggal: v("t_sk_tanggal"), masa_bakti: v("t_masa_bakti"), tgl_pelantikan: v("t_tgl_pelantikan"), catatan: v("t_catatan") } });
    });
  }
  function tolak(id) {
    bukaDlg(`<h2 id="dlgJudul">${esc(t("adm.mw.tolak"))}</h2>${field("t_catatan", "adm.mw.f.catatan_tolak", "", 1000)}`, async (f) => {
      const c = f.querySelector("#t_catatan").value.trim();
      if (!c) throw new Error("kosong");
      await api(`/api/admin/meti-wilayah/ajuan/${id}/tahap`, { metode: "POST", badan: { ke: "ditolak", catatan: c } });
    });
  }

  host.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-aksi]");
    if (!b) return;
    if (b.dataset.aksi === "sunting") sunting(b.dataset.k);
    else if (b.dataset.aksi === "tahap") tahap(Number(b.dataset.id), b.dataset.ke);
    else if (b.dataset.aksi === "tolak") tolak(Number(b.dataset.id));
  });
  muat();
}
