/* /panas-bumi, tab Pemain: PGE, Star Energy, Supreme Energy, Medco, Sarulla; profil berlogo. Kapasitas dihitung dari proyek_terpadu.json lewat id proyek; fakta perusahaan membawa sumber dan tingkat bukti. */
import { B, t, ex, num, esc, ikon, tx, buktiS, kakiSumber, kosongTab, orgLogoSel, orgBaris, orgNama, proyekById, jumlahMw, pil, siapTautan, naikkan, logoHtml, orgLogo, tautOrg } from "/pbm_umum.js";

export function mulai(el) {
  if (!B.pb) { el.innerHTML = kosongTab("pbm.kosong"); return; }
  const kartu = (p) => {
    const ps = p.proyek_ids.map(proyekById).filter(Boolean), op = ps.filter((x) => x.status === "beroperasi"), rencana = ps.filter((x) => ["rencana", "konstruksi", "izin"].includes(x.status));
    const nama = orgNama(p.org_id);
    return `<article class="pbm-pemain"><header class="pbm-pemain-k">${logoHtml(p.org_id, nama, orgLogo(p.org_id), "rg3-lg rg3-lg-b")}<div><h3>${tautOrg(p.org_id, nama)}</h3><p>${p.peran.map((r) => `<span class="jm-pil">${esc(t("pbm.peran." + r))}</span>`).join(" ")}</p></div></header>
      <dl class="pbm-ang"><div><dt>${esc(t("pbm.m.operasi"))}</dt><dd>${esc(num(jumlahMw(op), 0))} <small>MW</small></dd></div><div><dt>${esc(t("pbm.m.rencana"))}</dt><dd>${esc(num(jumlahMw(rencana), 0))} <small>MW</small></dd></div><div><dt>${esc(t("pbm.m.proyek"))}</dt><dd>${esc(num(ps.length, 0))}</dd></div></dl>
      <p class="jm-bantu">${esc(t("pbm.m.dasar"))}</p>
      <ul class="pbm-proyek">${ps.map((x) => `<li><span>${esc(x.nama)}</span><span>${pil("pbm.st.", x.status)} <small>${x.mw != null ? esc(num(x.mw, 0)) + " MW" : ""}</small></span></li>`).join("")}</ul>
      <ul class="pbm-daftar">${p.fakta.map((f) => `<li>${ikon("info", 16)}<div><p>${esc(tx(f.teks))}</p>${buktiS(f.sumber_id, f.tingkat_bukti)}</div></li>`).join("")}</ul></article>`;
  };
  el.innerHTML = ex({ id: "pbm-m-pemain", ikon: "gedung", topik: t("pbm.m.ey"), judulHtml: esc(t("pbm.m.j", { n: B.pb.pemain.length })), subHtml: esc(t("pbm.m.s")), isiHtml: `<div class="pbm-pemain-kisi">${B.pb.pemain.map(kartu).join("")}</div><p class="jm-bantu ih-catatan">${esc(t("pbm.m.n"))}</p>`, kakiHtml: kakiSumber(B.pb.pemain.flatMap((p) => p.fakta.map((f) => f.sumber_id))) });
  siapTautan("org").then(() => naikkan(el));
}
