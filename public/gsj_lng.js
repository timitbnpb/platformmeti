/* /gas, tab LNG dan FSRU: terminal regasifikasi (FSRU, darat), kilang LNG ekspor, mini-LNG, kargo PLN EPI; dari gas.json. Saringan jenis, kapasitas nominal (mtpa) bergrafik. */
import { B, t, ex, num, esc, ikon, tx, bukti, buktiS, kakiSumber, tabel, batangSvg, tipHtml, kosongTab, daftarCelah, orgLogoSel, pil, catatan, siapTautan, naikkan, luar, chip, warnaIdx } from "/gsj_umum.js";
import { nanti } from "/inti/umum.js";

let jenis = "";
const JENIS = ["fsru", "darat", "ekspor"];
function tabTerminal() {
  const el = document.getElementById("gsj-l-tab"); if (!el) return;
  const baris = B.gs.lng.terminal.filter((x) => !jenis || x.jenis === jenis);
  tabel(el, { satuan: "gsj.u.terminal", per: 8, urutAwal: 0, menurun: false, kolom: [
    { label: t("gsj.c.terminal"), v: (x) => x.nama, f: (x) => `<span class="rg3-idk"><b>${esc(x.nama)}</b><small>${esc(x.lokasi)}</small></span>` },
    { label: t("gsj.c.jenis"), v: (x) => x.jenis, f: (x) => chip("rg3-w" + warnaIdx(x.jenis), "", t("gsj.l.j." + x.jenis)) },
    { label: t("gsj.c.status"), v: (x) => x.status, f: (x) => pil("gsj.st.", x.status) },
    { label: t("gsj.c.kapasitas"), v: (x) => x.mtpa ?? x.regas_mmscfd ?? -1, num: true, f: (x) => [x.mtpa != null ? `<b>${esc(num(x.mtpa, 1))}</b> <small>mtpa</small>` : "", x.regas_mmscfd != null ? `<b>${esc(num(x.regas_mmscfd, 0))}</b> <small>MMSCFD</small>` : "", x.penyimpanan_m3 != null ? `<small>${esc(num(x.penyimpanan_m3, 0))} m3</small>` : ""].filter(Boolean).join("<br>") || `<span class="jm-bantu">${esc(t("gsj.belum_ada"))}</span>` },
    { label: t("gsj.c.pemilik"), v: (x) => x.pemilik.nama, f: (x) => (x.pemilik.nama ? orgLogoSel(x.pemilik.org_id, x.pemilik.nama) : `<span class="jm-bantu">${esc(t("gsj.belum_ada"))}</span>`) },
    { label: t("gsj.c.catatan"), v: () => "", f: (x) => `<span class="rg3-teks">${esc(tx(x.ket))}</span>` },
    { label: t("gsj.c.bukti"), v: (x) => x.tingkat_bukti, f: (x) => buktiS(x.sumber_id, x.tingkat_bukti) },
  ], baris });
}
function grafik() {
  const g = document.getElementById("gsj-l-g"); if (!g) return;
  const baris = B.gs.lng.terminal.filter((x) => x.mtpa != null).sort((a, b) => b.mtpa - a.mtpa);
  g.innerHTML = batangSvg({ el: g, d: 1, satuan: "mtpa", label: t("gsj.l.g.label"), seri: [{ k: "n", kelas: "gsj-s-gas" }],
    baris: baris.map((x) => ({ label: x.nama, tip: x.nama, th: tipHtml(x.nama, [["mtpa", num(x.mtpa, 1)], [t("gsj.c.jenis"), t("gsj.l.j." + x.jenis)], [t("gsj.c.status"), t(`gsj.st.${x.status}`)]]), bagian: [{ k: "n", nilai: x.mtpa }] })) });
}
export function mulai(el) {
  if (!B.gs) { el.innerHTML = kosongTab("gsj.kosong"); return; }
  const L = B.gs.lng, mini = L.mini, pi = (L.pendanaan_ids || []).map((id) => (B.pi?.baris || []).find((b) => b.id === id)).filter(Boolean);
  const opsi = [["", t("gsj.semua"), L.terminal.length], ...JENIS.map((k) => [k, t("gsj.l.j." + k), L.terminal.filter((x) => x.jenis === k).length])];
  el.innerHTML = [
    ex({ id: "gsj-l-term", ikon: "kapal", topik: t("gsj.l.ey.term"), judulHtml: esc(t("gsj.l.j.term", { n: L.terminal.length })), subHtml: esc(t("gsj.l.s.term")),
      isiHtml: `<div id="gsj-l-g" class="ih-bagan gsj-grafik"></div><div class="rg3-chips" role="group" aria-label="${esc(t("gsj.l.f"))}">${opsi.map(([k, l, n]) => `<button type="button" class="rg3-chip rg3-chipb" data-j="${esc(k)}" aria-pressed="${jenis === k}"><span>${esc(l)}</span> <i>${n}</i></button>`).join("")}</div><div id="gsj-l-tab"></div>${catatan("gsj.l.n.term")}`,
      kakiHtml: kakiSumber(["voi-lampung", "baird-jawa1", "woodmac-arun", "jakpost-nrs", "jakpost-badak", "porttech-lng"]) }),
    ex({ id: "gsj-l-mini", ikon: "kapal", topik: t("gsj.l.ey.mini"), judulHtml: esc(t("gsj.l.j.mini", { n: mini.length })), subHtml: esc(t("gsj.l.s.mini")),
      isiHtml: `<p>${mini.map((m) => pil("gsj.l.m.", m.k.toLowerCase())).join(" ")}</p><p class="jm-bantu">${esc(tx(L.mini_ket))}</p>${buktiS(mini[0].sumber_id, mini[0].tingkat_bukti)}<ul class="gsj-daftar">${[L.kargo].map((x) => `<li>${ikon("info", 18)}<div><p>${esc(tx(x.teks))}</p>${buktiS(x.sumber_id, x.tingkat_bukti)}</div></li>`).join("")}</ul>`,
      kakiHtml: kakiSumber(["petromindo-6lng", "pgj-minilng"]) }),
    ex({ id: "gsj-l-rujuk", ikon: "tautan", topik: t("gsj.l.ey.rujuk"), judulHtml: esc(t("gsj.l.j.rujuk")), subHtml: esc(t("gsj.l.s.rujuk")),
      isiHtml: `<ul class="gsj-daftar">${pi.map((b) => `<li>${ikon("kartu", 18)}<div><p><b>${esc(b.nama)}</b></p><p class="jm-bantu">${esc(b.pemberi || "")}${b.nilai_usd != null ? ", US$ " + esc(num(b.nilai_usd, 0)) : ""}</p>${bukti("via-pihak-ketiga", { sumber: "pendanaan_internasional.json (IATI)", tanggal: B.pi?.dibangun_pada || "" })}</div></li>`).join("") || `<li>${ikon("tanya", 18)}<div><p>${esc(t("gsj.belum_ada"))}</p></div></li>`}</ul>${daftarCelah(B.gs.celah.slice(3, 4))}`,
      kakiHtml: "" }),
  ].join("");
  grafik(); tabTerminal();
  el.querySelector(".rg3-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-j]"); if (!b) return;
    jenis = b.dataset.j; for (const x of el.querySelectorAll("[data-j]")) x.setAttribute("aria-pressed", String(x.dataset.j === jenis));
    nanti(tabTerminal);
  });
  siapTautan("org").then(() => naikkan(el));
}
