/* /surya, tab Kebijakan dan TKDN: kebijakan dagang yang menyentuh rantai surya (kebijakan_dagang.json, dibaca runtime), dampak ke ekspor Indonesia, regulasi inti (regulasi.json, id dirujuk),
   dan uji syarat TKDN modul/inverter dari sertifikat aktif (simulasi_tkdn.json + inti/simulasi_tkdn_rumus.js; hasil = Hipotesis). Simulator lengkap tetap di /rantai-global. INP: tabel dan hitung menyusul lewat nanti(). */
import { X, L, t, ex, num, esc, ikon, bukti, luar, bendera, chip, tabel, kolomSvg, legendaHtml, tipHtml, kosongTab, daftarCelah, catatan, muat, negaraSel, lbl } from "/sy_umum.js";
import { nanti } from "/inti/umum.js";

let rumus = null;
const KD = () => X.kebijakan?.baris || [];
const ST = (b) => (/berlaku|operasi/i.test(b.status || "") ? "ok" : /putusan|afirmatif|ditetapkan/i.test(b.status || "") ? "warn" : "x");
function tabelKebijakan() {
  const el = document.getElementById("sur-k-t"); if (!el) return;
  const S = new Map((X.kebijakan?.sumber || []).map((s) => [s.id, s]));
  tabel(el, { satuan: "sur.u.kebijakan", per: 6, urutAwal: 0, menurun: false, kolom: [
    { label: t("sur.c.negara"), v: (b) => b.negara, f: (b) => negaraSel(b.negara, 18) },
    { label: t("sur.c.jenis"), v: (b) => b.jenis, f: (b) => chip("rg3-w" + (b.jenis.length % 8), "", lbl("sur.kj.", b.jenis)) },
    { label: t("sur.c.produk"), v: (b) => b.produk, f: (b) => `<span class="rg3-idk"><b>${esc(b.produk)}</b><small>${esc(b.besaran || "")}</small></span>` },
    { label: t("sur.c.status"), v: (b) => b.status || "", f: (b) => `<span class="rg3-teks">${esc(b.status || "-")}</span>` },
    { label: t("sur.c.bukti"), v: (b) => b.tingkat_bukti || "", f: (b) => { const s = S.get(b.sumber_id); return bukti(b.tingkat_bukti, { sumber: s?.penerbit, tanggal: b.tanggal_putusan || b.tanggal, cara: s?.judul }); } },
  ], baris: KD() });
}
function dampak() {
  const el = document.getElementById("sur-k-d"); if (!el) return;
  const d = X.kebijakan?.dampak?.ekspor_surya_ke_as; if (!d?.length) return;
  el.innerHTML = kolomSvg({ el, satuan: t("sur.k.u.usd_juta"), label: t("sur.k.j.dampak"), seri: [{ k: "as", kelas: "rg3-s-dunia" }, { k: "lain", kelas: "rg3-s-banding" }],
    kategori: d.map((r) => ({ label: String(r.tahun), nilai: { as: r.usd_as / 1e6, lain: Math.max(0, r.usd_total - r.usd_as) / 1e6 }, tip: `${r.tahun}: ${num(r.usd_total / 1e6, 0)}`, th: tipHtml(String(r.tahun), [[t("sur.k.s.as"), `US$ ${num(r.usd_as / 1e6, 1)} ${t("sur.k.u.juta")}`], [t("sur.k.s.total"), `US$ ${num(r.usd_total / 1e6, 1)} ${t("sur.k.u.juta")}`]]) })) });
}
function tkdn() {
  const el = document.getElementById("sur-k-tk"); if (!el) return;
  const S = X.simulasi; if (!S?.sertifikat || !rumus) { el.innerHTML = kosongTab("sur.kosong_data"); return; }
  const m = S.asumsi.modul, sr = S.sertifikat.modul.tkdn_persen;
  const baris = S.syarat_uji.modul.map((v) => { const p = rumus.pasokan({ sertifikat: sr, kapasitasGw: m.kapasitas_gw_tahun?.nilai ?? null, kebutuhanGw: m.kebutuhan_gw_tahun.nilai }, v); return { v, ...p }; });
  tabel(el, { satuan: "sur.u.syarat", per: 4, urutAwal: 0, menurun: false, kolom: [
    { label: t("sur.k.c.syarat"), num: true, v: (r) => r.v, f: (r) => `<b>${r.v ? esc(t("rg3.k.f.syarat", { v: r.v })) : esc(t("sur.k.tanpa"))}</b>` },
    { label: t("sur.k.c.pangsa"), num: true, v: (r) => r.pangsa ?? -1, f: (r) => (r.pangsa != null ? `${esc(num(r.pangsa * 100, 0))}%` : "-") },
    { label: t("sur.k.c.lolos"), num: true, v: (r) => r.kapasitasLolosGw ?? -1, f: (r) => (r.kapasitasLolosGw != null ? `${esc(num(r.kapasitasLolosGw, 1))} GW` : "-") },
    { label: t("sur.k.c.butuh"), num: true, v: (r) => r.kebutuhanGw, f: (r) => `${esc(num(r.kebutuhanGw, 1))} GW` },
    { label: t("sur.k.c.cakupan"), num: true, v: (r) => r.cakupan ?? -1, f: (r) => (r.cakupan != null ? `<b>${esc(num(r.cakupan * 100, 0))}%</b>` : "-") },
    { label: t("sur.c.bukti"), v: () => "hipotesis", f: () => bukti("hipotesis", { cara: t("sur.k.cara_tkdn") }) },
  ], baris });
}
function regulasi() {
  const R = new Map((X.regulasi?.baris || []).map((r) => [r.id, r]));
  return X.sy.rujukan.regulasi.map((id) => R.get(id)).filter(Boolean).map((r) => `<li>${ikon("regulasi", 18)}<div><a class="rg3-tautan" href="/regulasi?id=${encodeURIComponent(r.id)}"><b>${esc(r.jenis.toUpperCase())} ${esc(r.nomor)}/${esc(r.tahun)}</b></a><p class="jm-bantu">${esc(r.judul)}</p>${bukti("resmi", { sumber: "peraturan.bpk.go.id", tanggal: r.tanggal_ambil })}</div></li>`).join("");
}
export async function mulai(el) {
  await muat(["kebijakan", "simulasi", "regulasi", "atap"]);
  try { rumus = await import("/inti/simulasi_tkdn_rumus.js"); } catch { rumus = null; }
  if (!KD().length && !X.simulasi) { el.innerHTML = kosongTab("sur.kosong_data"); return; }
  const neg = new Set(KD().map((b) => b.negara)).size, a = X.sy.atap;
  el.innerHTML = [
    KD().length ? ex({ id: "sur-k-dagang", ikon: "palu", topik: t("sur.k.ey.dagang"), judulHtml: esc(t("sur.k.j.dagang", { n: num(KD().length), m: num(neg) })), subHtml: esc(t("sur.k.s.dagang")),
      isiHtml: `<div id="sur-k-t"></div><h3 class="rg3-sub">${esc(t("sur.k.h.dampak"))}</h3>${legendaHtml([{ kelas: "rg3-s-dunia", label: t("sur.k.s.as") }, { kelas: "rg3-s-banding", label: t("sur.k.s.lain") }])}<div id="sur-k-d" class="ih-bagan"></div>${catatan("sur.k.n.dampak")}${daftarCelah((X.kebijakan.celah || []).slice(0, 2))}<p class="jm-bantu"><a class="rg3-tautan" href="/rantai-global?tab=kebijakan">${esc(t("sur.k.ke_dagang"))}</a></p>` }) : "",
    X.simulasi?.sertifikat ? ex({ id: "sur-k-tkdn", ikon: "kalkulator", topik: t("sur.k.ey.tkdn"), judulHtml: esc(t("sur.k.j.tkdn", { n: num(X.simulasi.sertifikat.modul.jumlah) })), subHtml: esc(t("sur.k.s.tkdn")),
      isiHtml: `<p class="rg3-info">${ikon("tanya", 18)}<span>${esc(t("sur.k.hip"))} ${bukti("hipotesis", { cara: t("sur.k.cara_tkdn") })}</span></p><div id="sur-k-tk"></div>${daftarCelah((X.simulasi.celah || []).slice(0, 2))}<p class="jm-bantu"><a class="rg3-tautan" href="/rantai-global?tab=kebijakan">${esc(t("sur.k.ke_sim"))}</a></p>` }) : "",
    ex({ id: "sur-k-reg", ikon: "regulasi", topik: t("sur.k.ey.reg"), judulHtml: esc(t("sur.k.j.reg")), subHtml: esc(t("sur.k.s.reg")),
      isiHtml: `<ul class="sur-daftar">${regulasi()}<li>${ikon("palu", 18)}<div><b>${esc(L(a.dasar.nama))}</b><p class="jm-bantu">${esc(a.dasar.tanggal)}</p></div></li></ul><p class="jm-bantu"><a class="rg3-tautan" href="/regulasi?topik=surya">${esc(t("sur.k.ke_reg"))}</a> <a class="rg3-tautan" href="/surya?tab=dasar#bab-12">${esc(t("sur.k.ke_topik"))}</a></p>` }),
  ].join("");
  nanti(() => { tabelKebijakan(); dampak(); tkdn(); });
}
