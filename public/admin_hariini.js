/* /admin tab Hari ini: antrean yang perlu ditangani (satu panggilan GET /api/admin/ringkas), pengunjung 24 jam, kesehatan data.
   Kartu bertaut ke tab terkait (data-ke dibaca admin.js). Angka nol tampil redup, bukan disembunyikan. */
import { t, angka, tanggal } from "/i18n.js";
import { esc, api, nanti, hantuHtml, ikon } from "/inti/umum.js";
import { kepalaTab, ubinKepala, keadaan } from "/admin_umum.js";
import { ringkasKesehatan } from "/admin_kesehatan.js";

/* [kunci data, ikon, tab tujuan] */
const ANTREAN = [
  ["pendaftar", "orang", "persetujuan"], ["bukti", "kartu", "persetujuan"], ["koreksi", "ubah", "koreksi"], ["portal", "centang", "portal"],
  ["pesan", "surel", "pesan"], ["konsultasi", "palu", "konsultasi"], ["langganan", "berita", "langganan"],
];

const kartu = (ik, judul, isiHtml) => `<section class="jm-adm-kartu"><header class="jm-adm-kh">${ikon(ik, 20)}<h3>${esc(judul)}</h3></header><div class="jm-adm-isi">${isiHtml}</div></section>`;
const taut = (ke) => `href="/admin?tab=${ke}" data-ke="${ke}"`;
/* ubin seragam: ikon dan angka sebaris, label satu baris; 0 redup, >0 menonjol */
const ubin = (ik, n, label, ke, tebal) => `<li><a class="jm-hi-u${tebal ? " jm-hi-aktif" : " jm-adm-nol"}" ${taut(ke)}><span class="jm-hi-ang">${ikon(ik, 20)}<strong>${esc(typeof n === "number" ? angka(n) : n)}</strong></span><span class="jm-hi-lbl">${esc(label)}</span></a></li>`;
const ubah = (a, b) => (b > 0 ? `${a >= b ? "+" : "-"}${angka(Math.abs(a - b) / b * 100, { desimal: 0 })}%` : "-");

export function panelHariIni(panel, { tabAda }) {
  panel.innerHTML = `${kepalaTab("lonceng", "adm.hi.ey", "adm.hi.j", "adm.hi.d")}<div class="jm-adm-rapat" id="hiIsi">${hantuHtml(5)}</div>`;
  const isi = panel.querySelector("#hiIsi");
  Promise.all([api("/api/admin/ringkas").catch((e) => ({ galat: e.kode || "umum" })), ringkasKesehatan().catch(() => null), api("/api/admin/lalin?r=7h").catch(() => null), api("/api/admin/lalin?r=24j").catch(() => null)])
    .then(([r, kes, l7, l24]) => nanti(() => { if (isi.isConnected) isi.innerHTML = r.galat ? keadaan(r.galat) : gambar(r, kes, l7, l24); }));

  function gambar(r, kes, l7, l24) {
    const a = r.antrean || {};
    const total = ANTREAN.reduce((s, [k]) => s + (a[k] || 0), 0);
    const u = ANTREAN.filter(([, , ke]) => tabAda(ke)).map(([k, ik, ke]) => ubin(ik, a[k] || 0, t("adm.hi.a." + k), ke, a[k])).join("");
    const antrean = kartu("lonceng", t("adm.hi.antrean"), `<p class="jm-bantu">${esc(total ? t("adm.hi.total", { n: angka(total) }) : t("adm.hi.bersih"))}</p><ul class="jm-hi-grid jm-hi-g7">${u}</ul>`);
    const p = r.pengunjung24 || {};
    const seri = (l7 && l7.seri) || [], kini = seri.at(-1), lalu = seri.at(-2);
    const teratas = l24 && l24.dim && l24.dim.halaman && l24.dim.halaman[0];
    const tamu = kartu("linimasa", t("adm.hi.tamu"), `<ul class="jm-hi-grid jm-hi-g4">${ubin("orang", p.orang, t("adm.hi.orang"), "statistik", p.orang)}${ubin("info", p.ai, t("adm.hi.ai"), "statistik", p.ai)}
      ${ubin("berita", teratas ? teratas[0] : "-", t("adm.hi.teratas"), "statistik", teratas)}${ubin("analisis", kini && lalu ? ubah(kini.orang || 0, lalu.orang || 0) : "-", t("adm.hi.banding"), "statistik", kini && lalu)}</ul><p class="jm-bantu">${esc(t("adm.hi.tamu.sub"))}</p>`);
    let sehat, jumlah = 0;
    if (!kes) sehat = kartu("centang", t("adm.hi.sehat"), `<p class="jm-bantu">${esc(t("adm.hi.sehat.gagal"))}</p>`);
    else {
      const bermasalah = kes.jenis.filter(([, n]) => n);
      jumlah = bermasalah.reduce((s, [, n]) => s + n, 0);
      const rinci = bermasalah.length ? `<ul class="jm-hi-grid jm-hi-g4">${bermasalah.map(([k, n]) => ubin("peringatan", n, t("keh.m." + k), "kesehatan", n)).join("")}</ul>` : "";
      sehat = kartu("centang", t("adm.hi.sehat"), `<p class="jm-bantu">${esc(jumlah ? t("adm.hi.sehat.n", { n: angka(jumlah), tgl: tanggal(String(kes.tgl || "").slice(0, 10)) }) : t("adm.hi.sehat.ok"))}</p>${rinci}`);
    }
    ubinKepala(panel, [{ ikon: "lonceng", nilai: total, label: t("adm.hi.k.menunggu") }, { ikon: "orang", nilai: p.orang, label: t("adm.hi.k.orang") }, { ikon: "centang", nilai: jumlah, label: t("adm.hi.k.data") }]);
    return `${antrean}${tamu}${sehat}`;
  }
}
