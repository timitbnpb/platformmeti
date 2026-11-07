/* Seksi Pakar profil provinsi: baris berfoto (siluet bila belum ada), kampus berlogo dengan nama baku Indonesia, topik pil berwarna,
   h-index berlencana, urut per kolom + paginasi, klik membuka profil pakar di direktori. Data: /data/wilayah/<kode>.json (pakar), riset_kampus.json (logo). */
import { esc, ikon, nanti } from "/inti/umum.js";
import { t, ada } from "/i18n.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { pilTek } from "/inti/ikon_tek.js";
import { num, muatData } from "/analisis.js";

const PER = 10, TOPIK_MAKS = 3;
/* nama kampus bahasa Inggris dari OpenAlex -> nama baku Indonesia (aturan umum + pengecualian) */
const KHUSUS = {
  "Bandung Institute of Technology": "Institut Teknologi Bandung", "Sumatera Institute of Technology": "Institut Teknologi Sumatera", "Indonesia University of Education": "Universitas Pendidikan Indonesia",
  "Indonesia Open University": "Universitas Terbuka", "Satya Wacana Christian University": "Universitas Kristen Satya Wacana", "Binus University": "Universitas Bina Nusantara",
  "National Research and Innovation Agency": "BRIN", "Indonesian Institute of Sciences": "BRIN (eks LIPI)", "Center for International Forestry Research": "CIFOR", "Pertamina (Indonesia)": "Pertamina",
  "Association of Southeast Asian Nations": "ASEAN", "Nano Center Indonesia": "Nano Center Indonesia", "Islamic University of Indonesia": "Universitas Islam Indonesia", "Islamic University of Riau": "Universitas Islam Riau",
};
export function namaKampus(en) {
  const s = String(en || "").trim();
  if (!s) return "";
  if (KHUSUS[s]) return KHUSUS[s];
  let m;
  if ((m = s.match(/^State University of (.+)$/i)) || (m = s.match(/^(.+) State University$/i))) return "Universitas Negeri " + m[1];
  if ((m = s.match(/^University of (.+)$/i)) || (m = s.match(/^(.+) University$/i))) return "Universitas " + m[1];
  return s;
}
const logoPeta = new Map();
/** muat pemetaan nama kampus -> logo (riset_kampus.json); gagal = hanya ikon */
export async function muatRujukPakar() {
  try {
    for (const k of (await muatData("riset_kampus.json")).baris || []) if (k.organisasi_id?.[0]) logoPeta.set(k.nama, `/img/logo/org/${k.organisasi_id[0]}.png`);
  } catch (e) { /* tanpa logo: ikon gedung */ }
}
const idOa = (u) => (String(u || "").match(/\/(A\d+)\/?$/) || [])[1] || "";
const href = (o) => (idOa(o.url) ? `/direktori?tampil=pakar&pakar=${encodeURIComponent(idOa(o.url))}` : o.url || "");
const tingkat = (h) => (h >= 20 ? "a" : h >= 10 ? "b" : "c");
const kos = (alasan) => `<span class="jm-wp-kos" title="${esc(alasan)}" aria-label="${esc(alasan)}">-</span>`;
/* nama dengan token berulang persis ("Irianto Irianto") ditampilkan sekali */
const namaRapi = (n) => { const a = String(n).trim().split(/\s+/); return a.length === 2 && a[0].toLowerCase() === a[1].toLowerCase() ? a[0] : String(n); };

let PK = null;
const S = { uk: "h", ua: -1, hal: 1 };
const kunci = { nama: (o) => o._n, inst: (o) => o._i, h: (o) => o.h };
function urut() {
  const f = kunci[S.uk];
  return [...PK.rows].sort((a, z) => {
    const x = f(a), y = f(z);
    return ((x == null) - (y == null)) || (x == null ? 0 : (typeof x === "number" ? x - y : String(x).localeCompare(String(y), "id")) * S.ua) || z.h - a.h;
  });
}
const avatar = (o) => (o.foto
  ? `<img class="jm-wp-av" src="${esc(o.foto)}" alt="" width="40" height="40" loading="lazy" referrerpolicy="no-referrer" data-oa="${esc(idOa(o.url))}">`
  : `<span class="jm-wp-av jm-wp-av-sil" data-oa="${esc(idOa(o.url))}" title="${esc(t("wp.pk.tanpa_foto"))}">${ikon("orang", 22)}</span>`);
const kampus = (o) => {
  if (!o.institusi) return kos(t("wp.kos"));
  const lg = logoPeta.get(o.institusi);
  return `<span class="jm-wp-ki"><span class="jm-wp-kg">${lg ? `<img src="${esc(lg)}" alt="" width="28" height="28" loading="lazy">` : ikon("wisuda", 18)}</span><span>${esc(o._i)}</span></span>`;
};
const topik = (o) => {
  if (!o.topik?.length) return kos(t("wp.kos"));
  const sisa = o.topik.length - TOPIK_MAKS;
  return `<span class="jm-wp-tps">${o.topik.slice(0, TOPIK_MAKS).map(pilTek).join("")}${sisa > 0 ? `<span class="jm-wp-sisa" title="${esc(o.topik.slice(TOPIK_MAKS).map((k) => (ada("wp.topik." + k) ? t("wp.topik." + k) : k)).join(", "))}">${esc(t("wp.pk.lagi", { n: sisa }))}</span>` : ""}</span>`;
};
function barisHtml(a) {
  const L = (k) => esc(t(k));
  return a.map((o) => `<tr class="jm-wp-px-r" data-href="${esc(href(o))}"><td data-label="${L("wp.col.nama")}" class="jm-wp-px-n"><span class="jm-wp-px-nm">${avatar(o)}<a href="${esc(href(o))}" aria-label="${esc(t("wp.pk.buka", { nama: o._n }))}">${esc(o._n)}</a></span></td>`
    + `<td data-label="${L("wp.col.inst")}">${kampus(o)}</td><td data-label="${L("wp.col.topik")}">${topik(o)}</td>`
    + `<td data-label="${L("wp.col.h")}" class="jm-num">${o.h == null ? kos(t("wp.kos")) : `<span class="jm-wp-h jm-wp-h-${tingkat(o.h)}" title="${esc(t("wp.pk.h.tip", { h: num(o.h), tingkat: t("wp.pk.h." + tingkat(o.h)) }))}">${ikon("bintang", 14)}<b>${esc(num(o.h))}</b></span>`}</td></tr>`).join("");
}
function gambar(akar) {
  const a = urut().slice((S.hal - 1) * PER, S.hal * PER);
  akar.querySelector("tbody").innerHTML = barisHtml(a);
  akar.querySelector(".jm-wp-px-pag").innerHTML = paginasiHtml({ hal: S.hal, total: PK.rows.length, per: PER, satuan: "jm.pag.u.pakar" });
  isiFoto(akar);
}
const th = (k, label, kls = "") => `<th scope="col" class="${kls}" aria-sort="${S.uk === k ? (S.ua > 0 ? "ascending" : "descending") : "none"}"><button type="button" class="jm-urut" data-uk="${k}">${esc(label)}</button></th>`;
const ub = (ik, label, nilai, sub) => `<li class="jm-wp-pu">${ikon(ik, 22)}<span><small>${esc(label)}</small><b>${nilai}</b>${sub ? `<em>${esc(sub)}</em>` : ""}</span></li>`;

export function pakarHtml(p, d, H) {
  const x = d?.pakar; if (!x?.daftar?.length) return "";
  PK = { rows: x.daftar.map((o) => ({ ...o, _n: namaRapi(o.nama), _i: namaKampus(o.institusi) })) };
  S.uk = "h"; S.ua = -1; S.hal = 1;
  const per = new Map(); for (const o of PK.rows) if (o._i) per.set(o._i, (per.get(o._i) || 0) + 1);
  const top = [...per].sort((a, z) => z[1] - a[1])[0], hMaks = Math.max(0, ...PK.rows.map((o) => o.h || 0));
  const ringkas = `<ul class="jm-wp-pus" aria-label="${esc(t("wp.pk.ringkas"))}">${ub("orang", t("wp.pk.u.n"), esc(num(x.jumlah)), t("wp.pk.u.n.sub", { n: num(PK.rows.length) }))}`
    + ub("wisuda", t("wp.pk.u.kampus"), esc(num(per.size)), t("wp.pk.u.kampus.sub", { n: num(PK.rows.length) }))
    + (top ? ub("gedung", t("wp.pk.u.top"), esc(top[0]), t("wp.pk.u.top.n", { n: num(top[1]) })) : "")
    + ub("bintang", t("wp.pk.u.h"), esc(num(hMaks)), PK.rows.find((o) => o.h === hMaks)?._n || "") + "</ul>";
  const tb = `<div class="jm-gulir"><table class="jm-tabel jm-wp-px" data-urut-terpasang="1"><thead><tr>${th("nama", t("wp.col.nama"))}${th("inst", t("wp.col.inst"))}<th scope="col" data-urut="tidak">${esc(t("wp.col.topik"))}</th>${th("h", t("wp.col.h"), "jm-num")}</tr></thead><tbody>${barisHtml(urut().slice(0, PER))}</tbody></table></div><div class="jm-wp-px-pag">${paginasiHtml({ hal: 1, total: PK.rows.length, per: PER, satuan: "jm.pag.u.pakar" })}</div>`;
  return H.seksi({ id: "pakar", ikon: "orang", topik: t("wp.ey.pakar"), judulHtml: H.hlHtml("wp.j.pakar", num(x.jumlah), { nama: p.nama, n: num(x.daftar.length) }), aksiHtml: H.aksiHtml({ csv: true }) + H.sumberDari({ sumber: x.sumber, url: x.url, tanggal: x.tanggal }), isiHtml: ringkas + `<div class="jm-wp-px-w">${tb}</div>`, kakiHtml: `<p class="jm-bantu">${esc(t("wp.cat.pakar"))}</p>` });
}

/* foto pakar dari potret (bila tersedia): isi sesudah tercat, siluet tetap bila tidak ada */
let FOTO = null;
async function muatFoto() {
  if (FOTO) return FOTO;
  FOTO = new Map();
  try {
    const r = await fetch("/api/direktori/potret/foto_pakar", { credentials: "same-origin" });
    const j = r.ok ? await r.json() : null;
    if (j && typeof j === "object" && !Array.isArray(j)) for (const [k, v] of Object.entries(j)) if (/^https?:\/\//i.test(v?.foto_url || "")) FOTO.set(k.replace(/^https?:\/\/openalex\.org\//, ""), v.foto_url);
  } catch (e) { /* siluet */ }
  return FOTO;
}
async function isiFoto(akar) {
  const f = await muatFoto();
  if (!f.size) return;
  for (const el of akar.querySelectorAll(".jm-wp-av-sil")) {
    const u = f.get(el.dataset.oa); if (!u) continue;
    const img = new Image(40, 40); img.className = "jm-wp-av"; img.alt = ""; img.loading = "lazy"; img.referrerPolicy = "no-referrer"; img.dataset.oa = el.dataset.oa;
    img.onload = () => el.replaceWith(img); img.src = u;
  }
}

export function pasangPakar(akar) {
  const w = akar.querySelector(".jm-wp-px-w"); if (!w || !PK) return;
  w.addEventListener("click", (e) => {
    const u = e.target.closest(".jm-urut");
    if (u) {
      const k = u.dataset.uk; S.ua = S.uk === k ? -S.ua : k === "h" ? -1 : 1; S.uk = k; S.hal = 1;
      for (const h of w.querySelectorAll("th[aria-sort]")) h.setAttribute("aria-sort", h === u.closest("th") ? (S.ua > 0 ? "ascending" : "descending") : "none");
      nanti(() => gambar(w)); return;
    }
    const b = e.target.closest(".jm-pag [data-hal]");
    if (b) { if (b.disabled) return; S.hal = +b.dataset.hal; sorotHalaman(b, S.hal); nanti(() => gambar(w)); return; }
    const tr = e.target.closest("tr[data-href]");
    if (tr && tr.dataset.href && !e.target.closest("a,button")) location.assign(tr.dataset.href);
  });
  isiFoto(w);
}
