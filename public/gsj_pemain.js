/* /gas, tab Pemain: PLN dan anak usaha, Pertamina NRE, Marubeni, pemasok turbin, PGN, regulator, pengguna HGBT, pengkritik; profil berlogo, fakta bersumber dari gas.json. */
import { B, t, ex, esc, ikon, tx, buktiS, kakiSumber, kosongTab, logoHtml, orgNama, orgLogo, tautOrg, siapTautan, naikkan } from "/gsj_umum.js";

export function mulai(el) {
  if (!B.gs) { el.innerHTML = kosongTab("gsj.kosong"); return; }
  const kartu = (p) => {
    const nama = orgNama(p.org_id, p.nama);
    return `<article class="gsj-pemain"><header class="gsj-pemain-k">${logoHtml(p.org_id, nama, p.org_id ? orgLogo(p.org_id) : "", "rg3-lg rg3-lg-b")}<div><h3>${p.org_id ? tautOrg(p.org_id, nama) : esc(nama)}</h3><p>${p.peran.map((r) => `<span class="jm-pil">${esc(t("gsj.peran." + r))}</span>`).join(" ")}</p></div></header>
      <ul class="gsj-daftar">${p.fakta.map((f) => `<li>${ikon("info", 16)}<div><p>${esc(tx(f.teks))}</p>${buktiS(f.sumber_id, f.tingkat_bukti)}</div></li>`).join("")}</ul></article>`;
  };
  el.innerHTML = ex({ id: "gsj-m-pemain", ikon: "gedung", topik: t("gsj.m.ey"), judulHtml: esc(t("gsj.m.j", { n: B.gs.pemain.length })), subHtml: esc(t("gsj.m.s")), isiHtml: `<div class="gsj-pemain-kisi">${B.gs.pemain.map(kartu).join("")}</div><p class="jm-bantu ih-catatan">${esc(t("gsj.m.n"))}</p>`, kakiHtml: kakiSumber(B.gs.pemain.flatMap((p) => p.fakta.map((f) => f.sumber_id))) });
  siapTautan("org").then(() => naikkan(el));
}
