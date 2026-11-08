/* /angin, tab Pemain: UPC Renewables, Vena Energy, Total Eren, Adaro, PLN, Siemens Gamesa, Siemens Indonesia, Kenertec; profil berlogo. Kapasitas dihitung dari proyek_terpadu.json lewat id proyek;
   fakta perusahaan membawa sumber dan tingkat bukti. */
import { B, muat, t, ex, num, esc, ikon, tx, buktiS, kakiSumber, kosongTab, orgLogoSel, orgNama, orgLogo, proyekById, jumlahMw, pil, siapTautan, naikkan, logoHtml, tautOrg } from "/ang_umum.js";

export async function mulai(el) {
  await muat(["pt", "org"]);
  if (!B.ang) { el.innerHTML = kosongTab("ang.kosong"); return; }
  const kartu = (p) => {
    const ps = [...new Set(p.proyek_ids)].map(proyekById).filter(Boolean), op = ps.filter((x) => x.status === "beroperasi"), rencana = ps.filter((x) => ["rencana", "konstruksi", "izin"].includes(x.status)), nama = orgNama(p.org_id);
    return `<article class="ang-pemain"><header class="ang-pemain-k">${logoHtml(p.org_id, nama, orgLogo(p.org_id), "rg3-lg rg3-lg-b")}<div><h3>${tautOrg(p.org_id, nama)}</h3><p>${p.peran.map((r) => `<span class="jm-pil">${esc(t("ang.peran." + r))}</span>`).join(" ")}</p></div></header>
      <dl class="ang-ang"><div><dt>${esc(t("ang.m.operasi"))}</dt><dd>${esc(num(jumlahMw(op), 0))} <small>MW</small></dd></div><div><dt>${esc(t("ang.m.rencana"))}</dt><dd>${esc(num(jumlahMw(rencana), 0))} <small>MW</small></dd></div><div><dt>${esc(t("ang.m.proyek"))}</dt><dd>${esc(num(ps.length, 0))}</dd></div></dl>
      <p class="jm-bantu">${esc(t("ang.m.dasar"))}</p>
      <ul class="ang-proyek">${ps.map((x) => `<li><span>${esc(x.nama)}</span><span>${pil("ang.st.", x.status)} <small>${x.mw != null ? esc(num(x.mw, 0)) + " MW" : ""}</small></span></li>`).join("")}</ul>
      <ul class="ang-daftar">${p.fakta.map((f) => `<li>${ikon("info", 16)}<div><p>${esc(tx(f.teks))}</p>${buktiS(f.sumber_id, f.tingkat_bukti)}</div></li>`).join("")}</ul></article>`;
  };
  el.innerHTML = ex({ id: "ang-m-pemain", ikon: "gedung", topik: t("ang.m.ey"), judulHtml: esc(t("ang.m.j", { n: B.ang.pemain.length })), subHtml: esc(t("ang.m.s")), isiHtml: `<div class="ang-pemain-kisi">${B.ang.pemain.map(kartu).join("")}</div><p class="jm-bantu ih-catatan">${esc(t("ang.m.n"))}</p>`, kakiHtml: kakiSumber(B.ang.pemain.flatMap((p) => p.fakta.map((f) => f.sumber_id))) });
  siapTautan("org").then(() => naikkan(el));
}
