/* /baterai-ev: perakit isi satu tab. Urutan bagian sama di semua tahap (kapasitas, pemain, peta, harga, ekspor, kebijakan, isu) dengan sisipan khas tahap.
   INP: markup dibangun sekali, tabel/peta/grafik menyusul lewat nanti(). */
import { X, t, kosongTab, tahapData } from "/be_umum.js";
import { nanti } from "/inti/umum.js";
import { pasangPilih } from "/inti/pilih.js";
import { bagianPemain, pasangPemain, bagianPeta, gambarPeta } from "/be_pemain.js";
import { bagianKapasitas, bagianHarga, gambarHarga, bagianEkspor, pasangEkspor, bagianKebijakan, bagianIsu, bagianCelah } from "/be_bagian.js";
import * as E from "/be_ekstra.js";
import { bagianNeraca, pasangNeraca } from "/be_neraca.js";
import { ex, esc } from "/be_umum.js";

const IKON_PIN = { tambang: "beliung", olah: "pabrik", prekursor: "labu", sel: "baterai", kendaraan: "mobil", pengisian: "colokan", bess: "sistem-listrik", daur: "daur" };
const pindah = (k) => ex({ id: "bev-bess-ke-neraca", ikon: "banding", topik: t("bev.ey.neraca"), judulHtml: esc(t("bev.j.ke_neraca")), subHtml: esc(t("bev.s.ke_neraca")), isiHtml: `<button type="button" class="jm-tbl" data-pindah="sel">${esc(t("bev.nr.buka"))}</button>` });

export async function mulai(el, id) {
  if (id === "ringkasan" || id === "dasar") { await (await import(`/tek_${id}.js?k=penyimpanan`)).mulai(el); return; }
  if (!X.be || !tahapData(id)) { el.innerHTML = kosongTab("bev.kosong_data"); return; }
  const dulu = { tambang: [E.bagianImporKritis()], olah: [E.bagianCaptive()], sel: [bagianNeraca()], kendaraan: [E.bagianPenjualan()], pengisian: [E.bagianSpklu()], bess: [pindah()], daur: [] }[id] || [];
  const stlh = { sel: [E.bagianTkdn("sel"), E.bagianJejak()], bess: [E.bagianTkdn("bess")] }[id] || [];
  el.innerHTML = [bagianKapasitas(id), ...dulu, bagianPemain(id), bagianPeta(id), bagianHarga(id), bagianEkspor(id), ...stlh, bagianKebijakan(id), bagianIsu(id), bagianCelah(id)].join("");
  pasangPilih();
  pasangPemain(id, el);
  nanti(() => {
    gambarHarga(id, el); pasangEkspor(id, el); gambarPeta(id, el, IKON_PIN[id]);
    if (id === "olah") E.gambarCaptive(el);
    if (id === "sel") { pasangNeraca(el); E.gambarTkdn("sel", el); E.gambarJejak(el); }
    if (id === "bess") E.gambarTkdn("bess", el);
    if (id === "kendaraan") E.gambarPenjualan(el);
    if (id === "pengisian") E.gambarSpklu(el);
  });
}
