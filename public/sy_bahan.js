/* /surya, tab Bahan baku: pasir silika dan kuarsa Indonesia. Cadangan dan sumber daya (angka berbeda antar sumber ditampilkan berdampingan dengan tahunnya), sebaran provinsi
   yang memenuhi spesifikasi kaca dan panel surya, produksi, proyek hilir (Xinyi), arah kebijakan, dan celah ekspor (angka ekspor tidak ditaksir). */
import { X, L, t, ex, num, esc, ikon, bukti, buktiSy, kakiSy, tabel, batangSvg, tipHtml, ton, kosongTab, daftarCelah, catatan, chip, namaOrg, muat, bukaTab } from "/sy_umum.js";
import { nanti } from "/inti/umum.js";

const B = () => X.sy.bahan;
function grafikCadangan() {
  const el = document.getElementById("sur-b-g"); if (!el) return;
  const baris = B().nasional.map((r) => ({ label: L(r.label) + " " + r.per, ikon: r.jenis === "cadangan" ? "tabel" : "grafik", tip: `${L(r.label)} ${r.per}: ${ton(r.nilai)}`,
    th: tipHtml(L(r.label), [[t("sur.c.jenis"), t("sur.jenis." + r.jenis)], [t("sur.c.jumlah"), ton(r.nilai)], [t("sur.c.tahun"), r.per]]), bagian: [{ k: r.jenis === "cadangan" ? "cad" : "sd", nilai: r.nilai / 1e9 }] }));
  el.innerHTML = batangSvg({ el, d: 2, satuan: t("sur.u.miliar_t"), label: t("sur.b.j.g"), seri: [{ k: "cad", kelas: "rg3-s-dunia" }, { k: "sd", kelas: "rg3-s-banding" }], baris });
}
function tabelWilayah() {
  const el = document.getElementById("sur-b-w"); if (!el) return;
  const prov = new Map((X.atlas?.baris || []).map((b) => [b.kode, b.provinsi]));
  tabel(el, { satuan: "sur.u.prov", per: 8, urutAwal: 1, menurun: true, kolom: [
    { label: t("sur.c.provinsi"), v: (w) => w.nama, f: (w) => `<span class="sur-baris">${ikon("lokasi", 16)}<b>${esc(prov.get(w.kode_prov) || w.nama)}</b></span>` },
    { label: t("sur.c.sd_hipotetik"), num: true, v: (w) => w.sd_hipotetik_ton ?? -1, f: (w) => (w.sd_hipotetik_ton ? `${esc(t("sur.lebih"))} ${esc(ton(w.sd_hipotetik_ton))}` : esc(t("sur.tak_ada_angka"))) },
    { label: t("sur.c.spesifikasi"), v: (w) => (w.memenuhi_spesifikasi ? 1 : 0), f: (w) => (w.memenuhi_spesifikasi ? chip("sur-st-ok", ikon("info", 14), t("sur.memenuhi")) : "-") },
    { label: t("sur.c.catatan"), v: (w) => L(w.catatan), f: (w) => `<span class="rg3-teks">${esc(L(w.catatan) || "-")}</span>` },
    { label: t("sur.c.bukti"), v: (w) => w.tingkat_bukti, f: (w) => buktiSy(w) },
  ], baris: B().wilayah });
}
function hilir() {
  const el = document.getElementById("sur-b-h"); if (!el) return;
  el.innerHTML = `<div class="rg3-kisi">${B().hilir.map((h) => `<div class="rg3-kartu sur-ubin"><div class="rg3-k-kep">${ikon("pabrik", 22)}<b>${h.org_id ? namaOrg(h.org_id, L(h.nama)) : esc(L(h.nama))}</b></div>
    <p class="sur-angka"><b>US$ ${esc(num(h.nilai_usd_miliar, 1))}</b><span>${esc(t("sur.u.miliar_usd"))}</span></p>
    <p class="jm-bantu">${esc(L(h.catatan))}</p><span class="rg3-ab">${chip("sur-st-" + (h.status === "rencana" ? "info" : "warn"), "", t("sur.st." + h.status))}${buktiSy(h)}</span></div>`).join("")}</div>`;
}
export async function mulai(el) {
  await muat(["atlas", "org"]);
  const b = B(), p = b.produksi;
  el.innerHTML = [
    ex({ id: "sur-b-cad", ikon: "grafik", topik: t("sur.b.ey.cad"), judulHtml: esc(t("sur.b.j.cad")), subHtml: esc(t("sur.b.s.cad")),
      isiHtml: `<div id="sur-b-g" class="ih-bagan"></div><div class="rg3-kisi"><div class="rg3-kartu sur-ubin"><span class="jm-kh-lbl">${esc(t("sur.b.produksi", { th: p.tahun }))}</span><p class="sur-angka"><b>${esc(num(p.ton / 1e6, 1))}</b><span>${esc(t("sur.u.juta_t"))}</span></p><span class="rg3-ab">${buktiSy(p)}</span></div></div>${catatan("sur.b.n.cad")}`,
      kakiHtml: kakiSy(b.nasional.map((r) => r.sumber_id).concat(p.sumber_id)) }),
    ex({ id: "sur-b-wil", ikon: "peta", topik: t("sur.b.ey.wil"), judulHtml: esc(t("sur.b.j.wil", { n: num(b.wilayah.length) })), subHtml: esc(t("sur.b.s.wil")), isiHtml: `<div id="sur-b-w"></div>${catatan("sur.b.n.wil")}`, kakiHtml: kakiSy(b.wilayah.map((w) => w.sumber_id)) }),
    ex({ id: "sur-b-hil", ikon: "pabrik", topik: t("sur.b.ey.hil"), judulHtml: esc(t("sur.b.j.hil")), subHtml: esc(t("sur.b.s.hil")), isiHtml: `<div id="sur-b-h"></div><p class="jm-bantu"><a href="${esc(bukaTab("rantai"))}" data-pindah="rantai">${esc(t("sur.b.ke_rantai"))}</a></p>`, kakiHtml: kakiSy(b.hilir.map((h) => h.sumber_id)) }),
    ex({ id: "sur-b-keb", ikon: "palu", topik: t("sur.b.ey.keb"), judulHtml: esc(t("sur.b.j.keb")), subHtml: esc(t("sur.b.s.keb")),
      isiHtml: `<ul class="sur-daftar">${b.kebijakan.map((k) => `<li>${ikon("regulasi", 18)}<div><b>${esc(L(k.judul))}</b><p class="jm-bantu">${esc(L(k.isi))}</p>${buktiSy(k)}</div></li>`).join("")}</ul>`, kakiHtml: kakiSy(b.kebijakan.map((k) => k.sumber_id)) }),
    ex({ id: "sur-b-eks", ikon: "kapal", topik: t("sur.b.ey.eks"), judulHtml: esc(t("sur.b.j.eks")), subHtml: esc(t("sur.b.s.eks")),
      isiHtml: `<p class="rg3-info rg3-info-bad">${ikon("tanya", 18)}<span>${esc(L(b.ekspor.catatan))} ${bukti("", {})}</span></p>${daftarCelah(b.celah.map(L))}`, kakiHtml: kakiSy([b.ekspor.sumber_id]) }),
  ].join("");
  nanti(() => { grafikCadangan(); tabelWilayah(); hilir(); });
}
