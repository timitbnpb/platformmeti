/* /otorisasi: Portal otorisasi METI, dua kunci. Tab mengikuti peran: Masukkan data (admin, super), Menunggu otorisasi (pengurus, super),
   Dokumen sah (semua), Riwayat (pengurus, admin, super). Hak ditegakkan di server (src/naskah.js, trigger DB); di sini hanya tampilan.
   INP: klik hanya mengganti chrome seketika (state + aria), isi berat dirender lewat nanti(). Semua nilai di-escape. */
import { t, tanggal, tanggalDariUnix, angka, ada } from "/i18n.js";
import { api, esc, ikon, nanti, debounce, hantuHtml, kosongHtml, galatHtml, pesanHtml } from "/inti/umum.js";
import { mulaiHalaman } from "/inti/kepala.js";
import { cariHtml, pilihHtml } from "/inti/komponen.js";

const saya = await mulaiHalaman();
const akar = document.getElementById("isi");
const peran = saya?.peran;
const MASUK = ["admin", "super"], PUTUS = ["pengurus", "super"], STAF = ["pengurus", "admin", "super"];
const JENIS = ["notulensi", "bahan", "kajian", "keputusan", "laporan", "lainnya"];
const MAKS_DOK = 50 * 1048576;
const PIL = { draf: "jm-pil-mati", menunggu: "jm-pil-warn", revisi: "jm-pil-warn", disahkan: "jm-pil-ok", ditolak: "jm-pil-bad", ditarik: "jm-pil-bad" };

const TAB = [
  ["masuk", "ot.tab.masuk", "ubah", MASUK.includes(peran)],
  ["tunggu", "ot.tab.tunggu", "perisai", PUTUS.includes(peran)],
  ["sah", "ot.tab.sah", "centang", true],
  ["riwayat", "ot.tab.riwayat", "jejak", STAF.includes(peran)],
].filter((x) => x[3]);

const S = { tab: "", daftar: {}, cari: "", jenis: "", pilih: null, form: null, antrean: 0, ctl: null };
const pil = (s) => `<span class="jm-pil ${PIL[s] || ""}">${esc(t("ot.s." + s))}</span>`;
const tgl = (iso) => (iso ? esc(tanggal(iso)) : "-");
const tglU = (u) => (u ? esc(tanggal(tanggalDariUnix(u))) : "-");
const urlItem = (b) => (b.sumber === "naskah" ? `/api/naskah/${encodeURIComponent(b.ref)}` : `/api/otorisasi/${b.sumber}/${encodeURIComponent(b.ref)}`);
const urlAksi = (b, a) => `${urlItem(b)}/${a}`;
const kunci = (b) => `${b.sumber}:${b.ref}`;

/* ---------- pemuatan ---------- */
async function muat(tab) {
  if (S.ctl) S.ctl.abort();
  S.ctl = new AbortController();
  const o = { signal: S.ctl.signal };
  const nask = async (q) => ((await api("/api/naskah" + q, o)).baris || []).map((b) => ({ ...b, sumber: "naskah" }));
  const konten = async (q) => ((await api("/api/otorisasi" + q, o)).baris || []);
  if (tab === "masuk") return (await nask("?status=draf")).concat(await nask("?status=revisi"));
  if (tab === "tunggu") return (await nask("?status=menunggu")).concat(await konten("?status=menunggu"));
  if (tab === "sah") return nask("?status=disahkan");
  return (await nask("")).concat(STAF.includes(peran) ? await konten("") : []);
}
async function muatAntrean() {
  if (!PUTUS.includes(peran)) return;
  try {
    const n = ((await api("/api/naskah?status=menunggu")).baris || []).filter((b) => !b.milikku).length + ((await api("/api/otorisasi?status=menunggu")).baris || []).filter((b) => !b.milikku).length;
    S.antrean = n;
    const el = akar.querySelector("#otAntrean");
    if (el) { el.textContent = angka(n); el.hidden = !n; }
  } catch { /* lencana opsional */ }
}

/* ---------- rangka ---------- */
function rangka() {
  akar.innerHTML = `<div class="jm-tab" role="tablist" aria-label="${esc(t("ot.tab.label"))}">${TAB.map(([k, kt, ik]) => `<button type="button" role="tab" id="tab-${k}" data-tab="${k}" aria-selected="${k === S.tab}" tabindex="${k === S.tab ? 0 : -1}">${ikon(ik, 18)}<span>${esc(t(kt))}</span>${k === "tunggu" ? `<span class="ot-lencana" id="otAntrean"${S.antrean ? "" : " hidden"}>${angka(S.antrean)}</span>` : ""}</button>`).join("")}</div>
    <section class="ot-kolom" id="otPanel" role="tabpanel" aria-labelledby="tab-${S.tab}"></section><div id="otStatus" aria-live="polite"></div>`;
}
const kabar = (jenis, teks) => { const e = akar.querySelector("#otStatus"); if (e) e.innerHTML = teks ? pesanHtml(jenis, teks) : ""; };

async function buka(tab) {
  S.tab = tab; S.pilih = null; S.form = null; S.cari = ""; S.jenis = "";
  rangka();
  const p = akar.querySelector("#otPanel");
  p.innerHTML = hantuHtml(4);
  try { S.daftar[tab] = await muat(tab); } catch (e) { if (e.name === "AbortError") return; p.innerHTML = galatHtml(e.kode || "umum"); return; }
  nanti(() => { isiPanel(); muatAntrean(); });
}

function bar(dengan = true) {
  if (!dengan) return "";
  return `<div class="ot-bar">${cariHtml({ id: "otCari", label: t("ot.cari") })}${pilihHtml({ id: "otJenis", ikon: "jenis", label: t("ot.f.jenis"), opsi: [["", t("ot.semua")], ...JENIS.map((j) => [j, t("ot.j." + j)])], nilai: S.jenis })}</div>`;
}
const saring = (daftar) => daftar.filter((b) => (!S.jenis || b.jenis === S.jenis) && (!S.cari || `${b.judul} ${b.ringkasan || ""}`.toLowerCase().includes(S.cari)));

function tabel(daftar, kolomAksi = false) {
  if (!daftar.length) return kosongHtml(S.tab === "tunggu" ? "ot.kosong.tunggu" : S.tab === "masuk" ? "ot.kosong.masuk" : "ot.kosong.umum");
  const th = (k) => `<th scope="col">${esc(t("ot.k." + k))}</th>`;
  return `<div class="jm-gulir"><table class="jm-tabel"><thead><tr>${th("tgl")}${th("sumber")}${th("judul")}${STAF.includes(peran) ? th("pembuat") : ""}${th("status")}</tr></thead><tbody>${daftar.map((b) => `<tr class="ot-baris" data-k="${esc(kunci(b))}" tabindex="0"${S.pilih && kunci(S.pilih) === kunci(b) ? ' aria-current="true"' : ""}>
    <td class="jm-nowrap" data-l="${esc(t("ot.k.tgl"))}">${tgl(b.tanggal)}</td>
    <td data-l="${esc(t("ot.k.sumber"))}"><span class="jm-pil">${esc(t("ot.src." + b.sumber))}</span> <small>${esc(ada("ot.j." + b.jenis) ? t("ot.j." + b.jenis) : ada("sp.jenis." + b.jenis) ? t("sp.jenis." + b.jenis) : b.jenis)}</small></td>
    <td data-l="${esc(t("ot.k.judul"))}"><button type="button" class="ot-judul" data-buka="${esc(kunci(b))}">${esc(b.judul)}</button></td>
    ${STAF.includes(peran) ? `<td data-l="${esc(t("ot.k.pembuat"))}">${esc(b.pembuat || "-")}</td>` : ""}
    <td data-l="${esc(t("ot.k.status"))}">${pil(b.status)}${b.versi > 1 ? ` <small>${esc(t("ot.versi", { n: b.versi }))}</small>` : ""}</td></tr>`).join("")}</tbody></table></div>`;
}

function isiPanel() {
  const p = akar.querySelector("#otPanel");
  if (!p) return;
  const d = S.daftar[S.tab] || [];
  if (S.tab === "masuk" && S.form) { p.innerHTML = formHtml(S.form); return; }
  const tombolBaru = S.tab === "masuk" ? `<div class="ot-bar"><span class="ot-ruang"></span><button type="button" class="jm-tbl jm-tbl-utama" data-aksi="baru">${ikon("tambah", 16)}${esc(t("ot.b.baru"))}</button></div>` : "";
  p.innerHTML = `${tombolBaru}${S.tab === "masuk" ? "" : bar()}<div id="otTabel">${tabel(saring(d))}</div><div id="otDetail"></div>`;
  if (S.pilih) isiDetail();
}
function isiTabel() { const e = akar.querySelector("#otTabel"); if (e) e.innerHTML = tabel(saring(S.daftar[S.tab] || [])); }

/* ---------- detail ---------- */
async function bukaDetail(k) {
  const b = (S.daftar[S.tab] || []).find((x) => kunci(x) === k);
  if (!b) return;
  S.pilih = b;
  akar.querySelectorAll(".ot-baris").forEach((tr) => tr.toggleAttribute("aria-current", tr.dataset.k === k));
  const e = akar.querySelector("#otDetail");
  if (e) e.innerHTML = hantuHtml(3);
  try { S.pilih = { ...b, ...(await api(urlItem(b))) , sumber: b.sumber }; } catch (x) { if (e) e.innerHTML = galatHtml(x.kode || "umum"); return; }
  nanti(() => { isiDetail(); akar.querySelector("#otDetail")?.scrollIntoView({ block: "nearest" }); });
}
function aksiHtml(b) {
  const jenis = PUTUS.includes(peran) && b.status === "menunggu";
  const catat = `<div class="ot-catatan-box jm-medan"><label for="otCat">${esc(t("ot.cat.label"))}</label><textarea class="jm-isian" id="otCat" maxlength="4000" placeholder="${esc(t("ot.cat.ph"))}"></textarea></div>`;
  if (jenis && b.milikku) return `<p class="pt-catatan">${ikon("info", 16)}<span>${esc(t("ot.milik"))}</span></p>`;
  if (jenis) return `${catat}<div class="ot-aksi"><button type="button" class="jm-tbl jm-tbl-utama" data-aksi="setujui">${ikon("centang", 16)}${esc(t("ot.b.setujui"))}</button><button type="button" class="jm-tbl" data-aksi="revisi">${ikon("ubah", 16)}${esc(t("ot.b.revisi"))}</button><button type="button" class="jm-tbl" data-aksi="tolak">${ikon("silang", 16)}${esc(t("ot.b.tolak"))}</button><button type="button" class="jm-tbl" data-aksi="catatan">${ikon("tambah", 16)}${esc(t("ot.b.catat"))}</button></div>`;
  if (b.sumber === "naskah" && b.status === "disahkan" && MASUK.includes(peran)) return `${catat}<div class="ot-aksi"><button type="button" class="jm-tbl" data-aksi="tarik">${ikon("blokir", 16)}${esc(t("ot.b.tarik"))}</button></div>`;
  return "";
}
function isiDetail() {
  const e = akar.querySelector("#otDetail"), b = S.pilih;
  if (!e || !b) return;
  const unduh = b.sumber === "naskah" ? (b.lampiran ? `/api/naskah/${encodeURIComponent(b.ref)}/unduh` : "") : b.lampiran_url || "";
  const lamp = b.lampiran ? (b.lampiran.nama || t("ot.lampiran")) : "";
  const cat = (b.catatan || []).map((c) => `<li class="ot-l-${esc(c.jenis)}"><b>${esc(t("ot.cj." + c.jenis))}</b><small>${esc(c.nama ? c.nama + ", " : "")}${esc(t("peran." + c.peran))} / ${esc(t("ot.versi", { n: c.versi }))} / ${tglU(c.kapan)}</small>${c.isi ? `<p>${esc(c.isi)}</p>` : ""}</li>`).join("");
  e.innerHTML = `<article class="ot-detail" aria-labelledby="otDJudul"><div class="ot-meta">${pil(b.status)}<span class="jm-pil">${esc(t("ot.src." + b.sumber))}</span>${b.versi > 1 ? `<small>${esc(t("ot.versi", { n: b.versi }))}</small>` : ""}${b.pembuat ? `<small>${esc(t("ot.pembuat", { nama: b.pembuat }))}${b.penyunting && b.penyunting !== b.pembuat ? ` / ${esc(t("ot.penyunting", { nama: b.penyunting }))}` : ""}</small>` : ""}</div>
    <h3 id="otDJudul">${esc(b.judul)}</h3>
    ${b.ringkasan ? `<p>${esc(b.ringkasan)}</p>` : ""}
    ${b.isi ? `<pre class="ot-isi">${esc(b.isi)}</pre>` : ""}
    ${unduh ? `<a class="jm-tbl" href="${esc(unduh)}" download>${ikon("unduh", 18)}${esc(t("ot.b.unduh"))}${lamp ? `: ${esc(lamp)}` : ""}</a>` : ""}
    ${cat ? `<div><b>${esc(t("ot.linimasa"))}</b><ol class="ot-linimasa">${cat}</ol></div>` : ""}
    ${S.tab === "riwayat" ? "" : aksiHtml(b)}</article>`;
}

/* ---------- aksi status ---------- */
async function aksi(a) {
  const b = S.pilih;
  if (!b) return;
  const isi = (akar.querySelector("#otCat")?.value || "").trim();
  if (["tolak", "revisi", "tarik", "catatan"].includes(a) && isi.length < 3) { kabar("galat", t("ot.cat.wajib")); akar.querySelector("#otCat")?.focus(); return; }
  kabar("ok", "");
  akar.querySelectorAll(".ot-aksi button").forEach((x) => { x.disabled = true; });
  try {
    const badan = isi ? { catatan: isi } : {};
    if (b.sumber !== "naskah") badan.versi = b.versi; // versi yang dibaca pemutus; beda dengan server = 409
    await api(urlAksi(b, a), { metode: "POST", badan });
    kabar("ok", t("ot.ok." + a));
    S.pilih = null;
    if (a === "catatan") { await bukaDetailUlang(b); return; }
    S.daftar[S.tab] = await muat(S.tab);
    nanti(() => { isiPanel(); muatAntrean(); });
  } catch (e) {
    akar.querySelectorAll(".ot-aksi button").forEach((x) => { x.disabled = false; });
    if (e.status === 409 && b.sumber !== "naskah") { await bukaDetailUlang(b); kabar("galat", t("ot.galat.versi")); return; } // isi berubah: muat ulang agar dibaca lagi
    kabar("galat", t(e.status === 403 ? "ot.galat.403" : e.status === 409 ? "ot.galat.409" : "ot.galat.umum"));
  }
}
async function bukaDetailUlang(b) { S.pilih = b; await bukaDetail(kunci(b)); }

/* ---------- formulir (kunci pertama) ---------- */
function formHtml(f) {
  const isian = (id, k, isi, penuh = false) => `<div class="jm-medan${penuh ? " jm-penuh" : ""}"><label for="${id}">${esc(t(k))}</label>${isi}</div>`;
  const lamp = f.lampiran ? `<p><small>${esc(t("ot.lampiran.ada", { nama: f.lampiran.nama }))}</small></p>` : "";
  return `<form class="ot-form" id="otForm" novalidate><h3>${esc(t(f.ref ? "ot.form.ubah" : "ot.form.baru"))}</h3>
    <div class="jm-form-grid">
      ${isian("otfJenis", "ot.f.jenis", `<select class="jm-pilih" id="otfJenis" data-ikon="jenis">${JENIS.map((j) => `<option value="${j}"${f.jenis === j ? " selected" : ""}>${esc(t("ot.j." + j))}</option>`).join("")}</select>`)}
      ${isian("otfTgl", "ot.f.tanggal", `<input class="jm-isian" id="otfTgl" type="date" value="${esc(f.tanggal || "")}" required>`)}
      ${isian("otfJudul", "ot.f.judul", `<input class="jm-isian" id="otfJudul" maxlength="300" value="${esc(f.judul || "")}" required>`, true)}
      ${isian("otfRing", "ot.f.ringkasan", `<input class="jm-isian" id="otfRing" maxlength="1500" value="${esc(f.ringkasan || "")}">`, true)}
      ${isian("otfIsi", "ot.f.isi", `<textarea class="jm-isian" id="otfIsi" maxlength="40000">${esc(f.isi || "")}</textarea>`, true)}
      ${isian("otfLamp", "ot.f.lampiran", `<input class="jm-isian" id="otfLamp" type="file" accept=".pdf,.pptx,.docx,.xlsx">${lamp}`, true)}
    </div>
    ${f.status === "revisi" && f.catatanRevisi ? `<p class="pt-catatan">${ikon("info", 16)}<span><b>${esc(t("ot.cj.revisi"))}:</b> ${esc(f.catatanRevisi)}</span></p>` : ""}
    <div class="ot-aksi"><button type="button" class="jm-tbl jm-tbl-utama" data-aksi="simpan">${ikon("centang", 16)}${esc(t("ot.b.simpan"))}</button>
      ${f.ref ? `<button type="button" class="jm-tbl" data-aksi="ajukan">${ikon("panah-kanan", 16)}${esc(t("ot.b.ajukan"))}</button>` : ""}
      <button type="button" class="jm-tbl" data-aksi="batal">${esc(t("ot.b.batal"))}</button></div></form>`;
}
async function bukaForm(b) {
  if (!b) { S.form = { jenis: "notulensi", tanggal: new Date().toISOString().slice(0, 10) }; isiPanel(); return; }
  try {
    const d = await api(`/api/naskah/${encodeURIComponent(b.ref)}`);
    S.form = { ...d, catatanRevisi: [...(d.catatan || [])].reverse().find((c) => c.jenis === "revisi")?.isi || "" };
    isiPanel();
  } catch (e) { kabar("galat", t("ot.galat.umum")); }
}
async function simpan(ajukan) {
  const g = (id) => akar.querySelector("#" + id);
  const badan = { jenis: g("otfJenis").value, judul: g("otfJudul").value.trim(), tanggal: g("otfTgl").value, ringkasan: g("otfRing").value.trim() || null, isi: g("otfIsi").value || null };
  const berkas = g("otfLamp").files[0];
  if (badan.judul.length < 5 || !badan.tanggal) { kabar("galat", t("ot.galat.isian")); return; }
  if (berkas && berkas.size > MAKS_DOK) { kabar("galat", t("ot.galat.besar")); return; }
  akar.querySelectorAll(".ot-aksi button").forEach((x) => { x.disabled = true; });
  try {
    let ref = S.form.ref;
    if (ref) await api(`/api/naskah/${encodeURIComponent(ref)}`, { metode: "PATCH", badan });
    else ref = (await api("/api/naskah", { metode: "POST", badan })).ref;
    if (berkas) {
      const r = await fetch(`/api/naskah/${encodeURIComponent(ref)}/lampiran?nama=${encodeURIComponent(berkas.name)}`, { method: "PUT", credentials: "same-origin", headers: { "x-pb": "1" }, body: berkas });
      if (!r.ok) throw Object.assign(new Error("lampiran"), { status: r.status });
    }
    if (ajukan) await api(`/api/naskah/${encodeURIComponent(ref)}/ajukan`, { metode: "POST", badan: {} });
    S.form = null;
    kabar("ok", t(ajukan ? "ot.ok.ajukan" : "ot.ok.simpan"));
    S.daftar.masuk = await muat("masuk");
    nanti(() => { isiPanel(); muatAntrean(); });
  } catch (e) {
    akar.querySelectorAll(".ot-aksi button").forEach((x) => { x.disabled = false; });
    kabar("galat", t(e.status === 415 ? "ot.galat.tipe" : e.status === 409 ? "ot.galat.409" : "ot.galat.umum"));
  }
}

/* ---------- peristiwa ---------- */
const cariTunda = debounce(() => isiTabel());
akar.addEventListener("click", (e) => {
  const tab = e.target.closest("[data-tab]");
  if (tab) { buka(tab.dataset.tab); return; }
  const a = e.target.closest("[data-aksi]");
  if (a) {
    const v = a.dataset.aksi;
    if (v === "baru") bukaForm(null);
    else if (v === "batal") { S.form = null; isiPanel(); }
    else if (v === "simpan") simpan(false);
    else if (v === "ajukan") simpan(true);
    else if (v === "ulang") buka(S.tab);
    else aksi(v);
    return;
  }
  const k = e.target.closest("[data-buka]")?.dataset.buka || e.target.closest("tr[data-k]")?.dataset.k;
  if (k) {
    if (S.tab === "masuk") { const b = (S.daftar.masuk || []).find((x) => kunci(x) === k); if (b) bukaForm(b); } else bukaDetail(k);
  }
});
akar.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.matches?.("tr[data-k]")) e.target.click();
  const tabs = [...akar.querySelectorAll("[role=tab]")];
  const i = tabs.indexOf(document.activeElement);
  if (i >= 0 && (e.key === "ArrowRight" || e.key === "ArrowLeft")) { const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); n.click(); }
});
akar.addEventListener("input", (e) => { if (e.target.id === "otCari") { S.cari = e.target.value.trim().toLowerCase(); cariTunda(); } });
akar.addEventListener("change", (e) => { if (e.target.id === "otJenis") { S.jenis = e.target.value; isiTabel(); } });

buka(TAB.some((x) => x[0] === location.hash.slice(1)) ? location.hash.slice(1) : TAB.find((x) => x[0] === "tunggu") ? "tunggu" : TAB[0][0]);
