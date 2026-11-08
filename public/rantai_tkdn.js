/* /rantai-global, tab "Indonesia dan TKDN" (menggantikan halaman /rantai): peta pabrik, kebutuhan RUPTL, TKDN per kategori, sertifikat TKDN.
   Kerangka HTML ditulis di sini, logika di rantai.js (dijalankan saat diimpor, sesudah kerangka terpasang). */
import { terapkanDom } from "/i18n.js";

const KERANGKA = `
<section id="rtKh" class="jm-kh jm-rt-kh" aria-labelledby="rtKhJ">
  <div class="jm-kh-teks">
    <h2 id="rtKhJ" data-i18n="rt.judul">Rantai pasok energi terbarukan</h2>
    <p id="rtJawab" class="jm-kh-lead"></p>
  </div>
  <div class="jm-kh-ubin" id="rtUbin" aria-live="polite"></div>
  <div class="jm-rt-gbr"><img id="gbr-tek" src="/img/beranda/surya-cirata.webp" alt="" width="640" height="480" decoding="async"></div>
</section>
<div class="jm-tab jm-rt-tek" id="seg-tek" role="tablist" aria-label="Teknologi" data-i18n-attr="aria-label:rt.f_tek"></div>
<section class="jm-ex" aria-labelledby="h-komp">
  <header class="jm-ex-hd"><div class="jm-ex-teks"><span class="jm-ex-ey"><svg class="jm-ik" width="14" height="14" aria-hidden="true" focusable="false"><use href="/img/ikon.svg#i-rantai"/></svg><span data-i18n="rt.ey.komp">Komponen</span></span><h2 class="jm-ex-j" id="temuan-komp"></h2><p class="jm-ex-sub" id="h-komp" data-i18n="rt.komp">Komponen utama dan pemasok dalam negeri</p></div><div class="jm-ex-aksi" id="src-komp"></div></header>
  <div class="jm-ex-bd"><div id="komp"></div></div>
</section>
<section class="jm-ex" data-surya aria-labelledby="h-peta">
  <header class="jm-ex-hd"><div class="jm-ex-teks"><span class="jm-ex-ey"><svg class="jm-ik" width="14" height="14" aria-hidden="true" focusable="false"><use href="/img/ikon.svg#i-peta"/></svg><span data-i18n="an.ey.peta">Peta pabrik</span></span><h2 class="jm-ex-j" id="temuan-peta"></h2><p class="jm-ex-sub" id="h-peta" data-i18n="rt.peta">Lokasi pabrik modul</p></div><div class="jm-ex-aksi" id="aksi-peta"><!-- aksiHtml({csv,png,pdf,bagi}) --></div></header>
  <div class="jm-ex-bd">
  <div class="jm-wl-bingkai jm-rt-bingkai">
  <div class="jm-an-chip">
      <div class="jm-tab" id="seg-pasar" role="tablist" aria-label="Pasar" data-i18n-attr="aria-label:rt.f_pasar">
        <button type="button" role="tab" data-p="" aria-selected="true"><svg class="jm-ik" width="18" height="18" aria-hidden="true" focusable="false"><use href="/img/ikon.svg#i-daftar"/></svg><span data-i18n="rt.semua">Semua</span></button>
        <button type="button" role="tab" data-p="lokal" aria-selected="false"><svg class="jm-ik" width="18" height="18" aria-hidden="true" focusable="false"><use href="/img/ikon.svg#i-wilayah"/></svg><span data-i18n="rt.pasar.lokal">Lokal</span></button>
        <button type="button" role="tab" data-p="ekspor" aria-selected="false"><svg class="jm-ik" width="18" height="18" aria-hidden="true" focusable="false"><use href="/img/ikon.svg#i-asean"/></svg><span data-i18n="rt.pasar.ekspor">Ekspor</span></button>
        <button type="button" role="tab" data-p="keduanya" aria-selected="false"><svg class="jm-ik" width="18" height="18" aria-hidden="true" focusable="false"><use href="/img/ikon.svg#i-rantai"/></svg><span data-i18n="rt.pasar.keduanya">Lokal dan ekspor</span></button>
      </div>
      <div class="jm-tab" id="seg-apamsi" role="tablist" aria-label="APAMSI" data-i18n-attr="aria-label:rt.f_apamsi">
        <button type="button" role="tab" data-a="" aria-selected="true"><svg class="jm-ik" width="18" height="18" aria-hidden="true" focusable="false"><use href="/img/ikon.svg#i-orang"/></svg><span data-i18n="rt.apamsi_semua">Semua anggota</span></button>
        <button type="button" role="tab" data-a="ya" aria-selected="false"><svg class="jm-ik" width="18" height="18" aria-hidden="true" focusable="false"><use href="/img/ikon.svg#i-centang"/></svg><span data-i18n="rt.apamsi_ya">Anggota APAMSI</span></button>
        <button type="button" role="tab" data-a="tidak" aria-selected="false"><svg class="jm-ik" width="18" height="18" aria-hidden="true" focusable="false"><use href="/img/ikon.svg#i-silang"/></svg><span data-i18n="rt.apamsi_tidak">Bukan anggota</span></button>
      </div>
    </div>
    <div id="peta-pabrik" class="jm-rt-peta" role="region" aria-label="Peta" data-i18n-attr="aria-label:rt.peta_label"></div>
    <button type="button" class="jm-rt-reset" id="reset-peta">Seluruh Indonesia</button>
    <div id="legenda-peta" class="jm-wl-legenda jm-rt-leg"></div>
    <div id="tip-kota" class="jm-wl-tip jm-rt-tip" role="status" hidden></div>
    <aside id="kota-panel" class="jm-rt-laci" aria-live="polite" hidden></aside>
  </div>
  <div id="tabel-kota"></div>
  <div id="sumber-peta"></div>
</div>
</section>
<section id="kartu" data-surya class="jm-an-kartu-baris" aria-label="Ringkasan" data-i18n-attr="aria-label:an.ringkasan"></section>
<section class="jm-ex" data-surya aria-labelledby="h-keb">
  <header class="jm-ex-hd"><div class="jm-ex-teks"><span class="jm-ex-ey"><svg class="jm-ik" width="14" height="14" aria-hidden="true" focusable="false"><use href="/img/ikon.svg#i-proyek"/></svg><span data-i18n="an.ey.keb">Kebutuhan</span></span><h2 class="jm-ex-j" id="temuan-keb"></h2><p class="jm-ex-sub" id="h-keb" data-i18n="rt.kebutuhan">Kebutuhan program dan kapasitas pabrikan per tahun</p></div><div class="jm-ex-aksi" id="aksi-keb"><!-- aksiHtml({csv,png,pdf,bagi}) --></div></header>
  <div class="jm-ex-bd">
  <div class="jm-tab" role="tablist" aria-label="Horizon" data-i18n-attr="aria-label:rt.horizon">
      <button type="button" role="tab" data-h="5" aria-selected="false"><svg class="jm-ik" width="18" height="18" aria-hidden="true" focusable="false"><use href="/img/ikon.svg#i-tahun"/></svg><span data-i18n="rt.h5">5 tahun</span></button>
      <button type="button" role="tab" data-h="8" aria-selected="false"><svg class="jm-ik" width="18" height="18" aria-hidden="true" focusable="false"><use href="/img/ikon.svg#i-tahun"/></svg><span data-i18n="rt.h8">8 tahun</span></button>
      <button type="button" role="tab" data-h="10" aria-selected="true"><svg class="jm-ik" width="18" height="18" aria-hidden="true" focusable="false"><use href="/img/ikon.svg#i-tahun"/></svg><span data-i18n="rt.h10">10 tahun</span></button>
    </div>

  <div id="grafik-keb"></div>
</div>
</section>
<section class="jm-ex" data-surya aria-labelledby="h-tkdn">
  <header class="jm-ex-hd"><div class="jm-ex-teks"><span class="jm-ex-ey"><svg class="jm-ik" width="14" height="14" aria-hidden="true" focusable="false"><use href="/img/ikon.svg#i-analisis"/></svg><span data-i18n="an.ey.tkdn">Sebaran TKDN</span></span><h2 class="jm-ex-j" id="temuan-tkdn"></h2><p class="jm-ex-sub" id="h-tkdn" data-i18n="rt.tkdn">Sebaran TKDN pabrikan</p></div><div class="jm-ex-aksi" id="aksi-tkdn"><!-- aksiHtml({csv,png,pdf,bagi}) --></div></header>
  <div class="jm-ex-bd">

  <div id="grafik-tkdn"></div>
</div>
</section>
<section class="jm-ex" aria-labelledby="h-tabel">
  <header class="jm-ex-hd"><div class="jm-ex-teks"><span class="jm-ex-ey"><svg class="jm-ik" width="14" height="14" aria-hidden="true" focusable="false"><use href="/img/ikon.svg#i-tabel"/></svg><span data-i18n="an.ey.tabel">Daftar pabrikan</span></span><h2 class="jm-ex-j" id="temuan-tabel"></h2><p class="jm-ex-sub" id="h-tabel" data-i18n="rt.tabel">Daftar pabrikan dan pemasok komponen</p></div><div class="jm-ex-aksi" id="aksi-tabel"><!-- aksiHtml({csv,png,pdf,bagi}) --></div></header>
  <div class="jm-ex-bd">

  <div class="jm-saring" id="saring"></div>
  <div id="tabel"></div>
</div>
</section>
<div id="rt2-pasok" class="rt2-slot"></div>
<div id="rt2-sisa" class="rt2-slot"></div>
<section class="jm-ex" aria-labelledby="h-cara">
  <header class="jm-ex-hd"><div class="jm-ex-teks"><span class="jm-ex-ey"><svg class="jm-ik" width="14" height="14" aria-hidden="true" focusable="false"><use href="/img/ikon.svg#i-metode"/></svg><span data-i18n="an.ey.metode">Metode</span></span>
    <h2 class="jm-ex-j" id="h-cara" data-i18n="an.cara">Cara menghitung</h2></div></header>
  <div class="jm-ex-bd jm-an-cara" id="cara"></div>
</section>
<section class="jm-ex" aria-labelledby="h-kutip" hidden data-rel="tidak">
  <header class="jm-ex-hd"><div class="jm-ex-teks"><span class="jm-ex-ey"><svg class="jm-ik" width="14" height="14" aria-hidden="true" focusable="false"><use href="/img/ikon.svg#i-tautan"/></svg><span data-i18n="an.ey.kutip">Kutipan</span></span>
    <h2 class="jm-ex-j" id="h-kutip" data-i18n="an.kutip">Cara mengutip</h2></div></header>
  <div class="jm-ex-bd"><p id="kutip"></p></div>
</section>
`;
export async function mulai(panel) {
  panel.innerHTML = KERANGKA;
  terapkanDom(panel);
  await import("/rantai.js");
}
