/* /jaringan, tab Pemain: unit PLN, kontraktor EPC, pemasok trafo/HVDC/gardu global (berbendera), dan produsen kabel. Semua org_id dari organisasi.json,
   pemasok global dari global/pemasok_lain.json (segmen jaringan). INP: hanya render daftar, tanpa handler berat. */
import { D, ex, t, esc, ikon, num, L, catatan, daftarCelah, kosongTab, logoHtml, orgHref, bendera, sumberLink } from "/jr_umum.js";
import { pemainJaringan } from "/jaringan_hitung.js";

const kartu = (o) => `<li class="jr-org"><a class="jr-org-a" href="${orgHref(o.id) || "#"}">${logoHtml(o.id, o.nama, o.logo, "rg3-lg")}<span><b>${esc(o.nama)}</b>${o.negara ? `<small class="rg3-neg">${bendera(o.negara, 16)}</small>` : ""}</span></a></li>`;
const grup = (id, ik, kunci, arr) => (arr.length ? ex({ id, ikon: ik, topik: t("jr.p.ey." + kunci), judulHtml: esc(t("jr.p.j." + kunci, { n: num(arr.length) })), subHtml: esc(t("jr.p.s." + kunci)), isiHtml: `<ul class="jr-orgs">${arr.map(kartu).join("")}</ul>` }) : "");

export function mulai(el) {
  if (!D.m?.pemain || !D.org) { el.innerHTML = kosongTab("jr.kosong_data"); return; }
  const p = pemainJaringan(D.m, D.org, D.lain);
  const total = p.pln.length + p.epc.length + p.kabel.length + p.global.length;
  el.innerHTML = [
    `<div class="rg3-info rg3-info-ok">${ikon("info", 18)}<p>${esc(L(D.m.pemain.peran_ruptl))} ${sumberLink("ruptl-2025")}</p></div>`,
    `<ul class="rg3-ubin"><li class="rg3-ub"><b>${esc(num(total))}</b><small>${esc(t("jr.p.u_total"))}</small></li><li class="rg3-ub"><b>${esc(num(p.global.length))}</b><small>${esc(t("jr.p.u_global"))}</small></li><li class="rg3-ub"><b>${esc(num(new Set(p.global.map((g) => g.negara)).size))}</b><small>${esc(t("jr.p.u_negara"))}</small></li></ul>`,
    grup("jr-p-pln", "gedung", "pln", p.pln),
    grup("jr-p-epc", "pabrik", "epc", p.epc),
    grup("jr-p-global", "globe", "global", p.global),
    grup("jr-p-kabel", "tek-listrik", "kabel", p.kabel),
    `<p class="jm-bantu ih-catatan">${esc(L(D.m.pemain.unit_pln_ket))}</p>${daftarCelah([t("jr.p.celah")])}`,
  ].join("");
}
