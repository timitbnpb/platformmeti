/* /galeri#sosmed: kartu akun resmi (inti/sosmed.js) + feed terbaru METI: YouTube (RSS), Instagram/Facebook (Meta Graph API resmi), LinkedIn (kurasi admin).
   Semua lewat /api/sosmed/feed yang diisi cron Worker; tanpa scraping. Pihak ketiga (YouTube, LinkedIn) baru dimuat setelah kartu diklik. */
import { t, tanggal, bahasa } from "/i18n.js";
import { esc, ikon, api, nanti, hantuHtml, kosongHtml, galatHtml } from "/inti/umum.js";
import { exHtml } from "/inti/komponen.js";
import { paginasiHtml, sorotHalaman } from "/inti/paginasi.js";
import { SOSMED, svgSosmed } from "/inti/sosmed.js";
import { urlAman } from "/publik.js";
import { muatVideo } from "/video_umum.js";
import { thumbUrl } from "/event_umum.js";

const PER = 9;
const NAMA = Object.fromEntries(SOSMED.map((s) => [s.kunci, s.nama]));
const URL_AKUN = Object.fromEntries(SOSMED.map((s) => [s.kunci, s.url]));
const SEG = ["semua", ...SOSMED.map((s) => s.kunci)];
const embedLinkedin = (u) => { const m = u.match(/(?:activity|share|ugcPost)[:-](\d{10,25})/); return m ? "https://www.linkedin.com/embed/feed/update/urn:li:" + (/ugcPost/.test(u) ? "ugcPost" : /share/.test(u) ? "share" : "activity") + ":" + m[1] : ""; };

/* tanggal relatif ("3 hari lalu"); lebih dari setahun jatuh ke tanggal biasa */
function relatif(s) {
  const d = Date.parse(s + "T00:00:00Z"); if (!d) return "";
  const hari = Math.round((d - Date.now()) / 864e5);
  if (hari < -365) return tanggal(s);
  const f = new Intl.RelativeTimeFormat(bahasa(), { numeric: "auto" });
  return Math.abs(hari) < 30 ? f.format(hari, "day") : f.format(Math.round(hari / 30), "month");
}

const profilHtml = () => `<ul class="sos-profil">${SOSMED.map((s) => `<li class="sos-kartu sos-${s.kunci}"><span class="sos-ik">${svgSosmed(s.kunci, 28)}</span><b>${esc(s.nama)}</b><p>${esc(t("sos.d." + s.kunci))}</p><a class="jm-tbl jm-tbl-kecil" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}<span>${esc(t("sos.ikuti"))}</span></a></li>`).join("")}</ul>`;

const segmenHtml = (aktif) => `<div class="jm-tab jm-tab-rata sos-seg" role="tablist" aria-label="${esc(t("sos.seg"))}">${SEG.map((k) => `<button type="button" role="tab" data-seg="${k}" aria-label="${esc(k === "semua" ? t("sos.semua") : NAMA[k])}" aria-selected="${k === aktif}" tabindex="${k === aktif ? 0 : -1}">${k === "semua" ? ikon("daftar", 18) : svgSosmed(k, 18)}<span>${esc(k === "semua" ? t("sos.semua") : NAMA[k].replace(" METI", ""))}</span></button>`).join("")}</div>`;

function kartuHtml(p, i) {
  const gb = p.platform === "youtube" ? thumbUrl(p.uid, "hqdefault") : p.gambar && /^sosmed\/[\w.-]+$/.test(p.gambar) ? "/api/sosmed/gambar?k=" + encodeURIComponent(p.gambar) : "";
  const isi = `${gb ? `<img src="${esc(gb)}" alt="" loading="lazy" decoding="async" width="320" height="240">` : ""}<span class="sos-logo">${svgSosmed(p.platform, 16)}<span>${esc((NAMA[p.platform] || "").replace(" METI", ""))}</span></span>${p.platform === "youtube" ? `<span class="sos-main">${ikon("putar", 40)}</span>` : ""}${gb ? "" : `<span class="sos-ik sos-ik-besar">${svgSosmed(p.platform, 36)}</span>`}`;
  const label = esc(t("sos.buka", { judul: p.judul }));
  const media = p.platform === "instagram" || p.platform === "facebook"
    ? `<a class="sos-med" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" aria-label="${label}">${isi}</a>`
    : `<button type="button" class="sos-med" data-i="${i}" aria-label="${label}">${isi}</button>`;
  return `<li class="sos-post sos-${esc(p.platform)}">${media}<div class="sos-isi"><p>${esc(p.judul)}</p><small>${esc(NAMA[p.platform])} - <time datetime="${esc(p.tanggal)}">${esc(relatif(p.tanggal))}</time></small></div></li>`;
}

function kosongPlatform(seg, meta) {
  const belum = (seg === "instagram" || seg === "facebook") && !meta;
  return `<div class="jm-kosong">${ikon("info", 32)}<p>${esc(t(belum ? "sos.belum" : "sos.kosong"))}</p><a class="jm-tbl" href="${esc(URL_AKUN[seg])}" target="_blank" rel="noopener noreferrer">${ikon("tautan", 16)}<span>${esc(t("sos.ikuti"))}</span></a></div>`;
}

export async function mulai() {
  const isi = document.getElementById("isiSosmed");
  isi.innerHTML = hantuHtml(3);
  let semua = [], meta = false;
  try {
    const d = await api("/api/sosmed/feed"); meta = d.meta;
    semua = d.baris.filter((p) => urlAman(p.url) && NAMA[p.platform]);
    if (!semua.some((p) => p.platform === "youtube")) { // cron belum jalan: potret kanal YouTube yang sudah ada di repo
      const v = (await muatVideo().catch(() => ({ semua: [] }))).semua.filter((x) => x.segmen === "meti").slice(0, 12);
      semua.push(...v.map((x) => ({ platform: "youtube", uid: x.id, judul: x.judul, tanggal: x.tanggal, url: "https://www.youtube.com/watch?v=" + x.id })));
    }
  } catch { isi.innerHTML = galatHtml("layanan"); return; }
  semua.sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  const S = { seg: "semua", hal: 1, tampil: [] };
  isi.innerHTML =
    exHtml({ id: "sos-profil", ikon: "tautan", topik: t("sos.profil.ey"), judulHtml: esc(t("sos.profil.j")), subHtml: esc(t("sos.profil.sub")), isiHtml: profilHtml() }) +
    exHtml({ id: "sos-feed", ikon: "bintang", topik: t("sos.feed.ey"), judulHtml: esc(t("sos.feed.j")), subHtml: esc(t("sos.feed.sub")), isiHtml: segmenHtml(S.seg) + `<div id="sosIsi" aria-live="polite"></div>` });
  const wadah = document.getElementById("sosIsi");
  const gambar = () => {
    S.tampil = semua.filter((p) => S.seg === "semua" || p.platform === S.seg);
    if (!S.tampil.length) { wadah.innerHTML = S.seg === "semua" ? kosongHtml("sos.kosong") : kosongPlatform(S.seg, meta); return; }
    const dari = (S.hal - 1) * PER;
    wadah.innerHTML = `<ul class="sos-feed">${S.tampil.slice(dari, dari + PER).map((p, j) => kartuHtml(p, dari + j)).join("")}</ul>${paginasiHtml({ hal: S.hal, total: S.tampil.length, per: PER, satuan: "sos.u" })}`;
  };
  gambar();

  isi.addEventListener("click", (e) => {
    const sg = e.target.closest("[data-seg]");
    if (sg) { // chrome kontrol urgent, kisi berat menyusul
      S.seg = sg.dataset.seg; S.hal = 1;
      for (const b of isi.querySelectorAll("[data-seg]")) { const on = b === sg; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; }
      nanti(gambar); return;
    }
    const h = e.target.closest("[data-hal]");
    if (h && !h.disabled) { S.hal = Number(h.dataset.hal); sorotHalaman(h, S.hal); nanti(() => { gambar(); document.getElementById("sos-feed").scrollIntoView({ block: "start" }); }); return; }
    const b = e.target.closest("button.sos-med");
    if (!b) return;
    const p = S.tampil[Number(b.dataset.i)], f = document.createElement("iframe");
    const src = p.platform === "youtube" ? "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(p.uid) + "?autoplay=1&rel=0" : embedLinkedin(p.url);
    if (!src) { window.open(p.url, "_blank", "noopener,noreferrer"); return; }
    f.src = src; f.className = "sos-embed"; f.title = p.judul; f.allow = "autoplay; encrypted-media; picture-in-picture"; f.setAttribute("allowfullscreen", ""); f.referrerPolicy = "no-referrer";
    f.setAttribute("sandbox", "allow-scripts allow-same-origin allow-popups allow-presentation");
    if (p.platform === "linkedin") b.parentElement.classList.add("sos-tinggi");
    b.replaceWith(f);
  });
}
mulai();
