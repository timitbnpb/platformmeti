/* /admin tab Hari ini: antrean yang perlu ditangani (satu panggilan GET /api/admin/ringkas), pengunjung 24 jam, kesehatan data.
   Kartu bertaut ke tab terkait (data-ke dibaca admin.js). Angka nol tampil redup, bukan disembunyikan. */
import { t, angka, tanggal } from "/i18n.js";
import { esc, api, nanti, hantuHtml, ikon } from "/inti/umum.js";
import { kepalaTab, keadaan } from "/admin_umum.js";
import { ringkasKesehatan } from "/admin_kesehatan.js";

/* [kunci data, ikon, tab tujuan] */
const ANTREAN = [
  ["pendaftar", "orang", "persetujuan"], ["bukti", "kartu", "persetujuan"], ["koreksi", "ubah", "koreksi"], ["portal", "centang", "portal"],
  ["pesan", "surel", "pesan"], ["konsultasi", "palu", "konsultasi"], ["langganan", "berita", "langganan"],
];

const kartu = (ik, judul, isiHtml) => `<section class="jm-adm-kartu"><header class="jm-adm-kh">${ikon(ik, 20)}<h3>${esc(judul)}</h3></header><div class="jm-adm-isi">${isiHtml}</div></section>`;
const taut = (ke) => `href="/admin?tab=${ke}" data-ke="${ke}"`;

export function panelHariIni(panel, { tabAda }) {
  panel.innerHTML = `${kepalaTab("lonceng", "adm.hi.ey", "adm.hi.j", "adm.hi.d")}<div id="hiIsi">${hantuHtml(5)}</div>`;
  const isi = panel.querySelector("#hiIsi");
  Promise.all([api("/api/admin/ringkas").catch((e) => ({ galat: e.kode || "umum" })), ringkasKesehatan().catch(() => null)])
    .then(([r, kes]) => nanti(() => { if (isi.isConnected) isi.innerHTML = r.galat ? keadaan(r.galat) : gambar(r, kes); }));

  function gambar(r, kes) {
    const a = r.antrean;
    const total = ANTREAN.reduce((s, [k]) => s + (a[k] || 0), 0);
    const ubin = ANTREAN.filter(([, , ke]) => tabAda(ke)).map(([k, ik, ke]) =>
      `<li><a class="jm-hi-u${a[k] ? "" : " jm-adm-nol"}" ${taut(ke)}>${ikon(ik, 20)}<strong>${esc(angka(a[k] || 0))}</strong><span>${esc(t("adm.hi.a." + k))}</span></a></li>`).join("");
    const antrean = kartu("lonceng", t("adm.hi.antrean"), `<p class="jm-bantu">${esc(total ? t("adm.hi.total", { n: angka(total) }) : t("adm.hi.bersih"))}</p><ul class="jm-hi-daftar">${ubin}</ul>`);
    const p = r.pengunjung24;
    const tamu = kartu("linimasa", t("adm.hi.tamu"), `<ul class="jm-hi-daftar"><li><a class="jm-hi-u" ${taut("statistik")}>${ikon("orang", 20)}<strong>${esc(angka(p.orang))}</strong><span>${esc(t("adm.hi.orang"))}</span></a></li>
      <li><a class="jm-hi-u" ${taut("statistik")}>${ikon("info", 20)}<strong>${esc(angka(p.ai))}</strong><span>${esc(t("adm.hi.ai"))}</span></a></li></ul><p class="jm-bantu">${esc(t("adm.hi.tamu.sub"))}</p>`);
    let sehat;
    if (!kes) sehat = kartu("centang", t("adm.hi.sehat"), `<p class="jm-bantu">${esc(t("adm.hi.sehat.gagal"))}</p>`);
    else {
      const bermasalah = kes.jenis.filter(([, n]) => n);
      const jumlah = bermasalah.reduce((s, [, n]) => s + n, 0);
      const rinci = bermasalah.length ? `<ul class="jm-hi-daftar">${bermasalah.map(([k, n]) => `<li><a class="jm-hi-u" ${taut("kesehatan")}>${ikon("peringatan", 20)}<strong>${esc(angka(n))}</strong><span>${esc(t("keh.m." + k))}</span></a></li>`).join("")}</ul>` : "";
      sehat = kartu("centang", t("adm.hi.sehat"), `<p class="jm-bantu">${esc(jumlah ? t("adm.hi.sehat.n", { n: angka(jumlah), tgl: tanggal(String(kes.tgl || "").slice(0, 10)) }) : t("adm.hi.sehat.ok"))}</p>${rinci}`);
    }
    return `${antrean}${tamu}${sehat}`;
  }
}
