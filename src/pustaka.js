// pustaka.js: daftar dokumen, unduh bertanggung jawab (log + persetujuan sekali), rekap Admin. D1 hanya lewat hak.js.
// Metadata dari aset statis (/data/pustaka.json + /data/pustaka_ulasan.json); berkas di R2 BERKAS kunci pustaka/<id>[--<berkas>].<ext>.
// Tautan unduh R2 hanya keluar dari POST berautentikasi, berumur 2 menit, terikat akun + dokumen + berkas (HMAC); tak pernah ada di data publik.
import * as hak from "./hak.js";
import { bacaBody, Galat, gagal, json, perlu, PRIVAT, samaTetap } from "./util.js";

const ADM = ["admin", "super"];
const RE_ID = /^[A-Za-z0-9_.-]{1,120}$/, RE_BERKAS = /^[a-z0-9-]{1,40}$/;
const RE_TELEPON = /^[0-9+ ()-]{6,20}$/;
const UMUR_TAUTAN = 120;
const BATAS_UNDUH_JAM = 60;
const MIME = { pdf: "application/pdf", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", doc: "application/msword", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };

const katalog = new WeakMap(); // per binding ASSETS, hidup selama isolate
async function muatKatalog(env, req) {
  if (katalog.has(env.ASSETS)) return katalog.get(env.ASSETS);
  const ambil = async (jalur) => {
    const r = await env.ASSETS.fetch(new Request(new URL(jalur, req.url)));
    if (!r.ok) throw new Galat("layanan");
    try { return await r.json(); } catch { throw new Galat("layanan"); }
  };
  const [dasar, ulasan] = await Promise.all([ambil("/data/pustaka.json"), ambil("/data/pustaka_ulasan.json").catch(() => ({ dokumen: [], ulasan: {} }))]);
  const peta = new Map();
  for (const d of [...(dasar.baris || []), ...(ulasan.dokumen || [])]) {
    if (d.lapis !== "publik" || d.rahasia) continue; // hanya lapis publik; rahasia tak pernah dilayani
    const u = ulasan.ulasan?.[d.id] || {};
    const berkas = (u.berkas || (d.format ? [{ id: "utama", nama: null, format: d.format, ukuran: d.ukuran ?? null, halaman: d.halaman ?? null, r2: false }] : [])).map((b) => ({ ...b }));
    peta.set(d.id, { id: d.id, judul: d.judul, jenis: d.jenis, penerbit: d.penerbit ?? null, tanggal: d.tanggal ?? null, bahasa: d.bahasa ?? null, format: d.format ?? null, ukuran: d.ukuran ?? null, halaman: d.halaman ?? null,
      url: typeof d.url === "string" && /^https:\/\//.test(d.url) ? d.url : null, berkas });
  }
  katalog.set(env.ASSETS, peta);
  return peta;
}
const kunciR2 = (d, b) => `pustaka/${d.id}${b.id === "utama" ? "" : "--" + b.id}.${b.format}`;

const heksa = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
async function tandai(env, pesan) {
  const r = env.PUSTAKA_RAHASIA || env.ICS_RAHASIA || env.IP_SALT;
  if (!r) throw new Galat("layanan");
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode("pustaka|" + r), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return heksa(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(pesan)));
}
const pesanTautan = (akunId, d, b, exp) => `${akunId}|${d.id}|${b.id}|${exp}`;

export const rute = {
  // Daftar ringkas untuk kisi + angka unduhan (agregat saja) + data akun untuk mengisi dialog unduh.
  "GET /api/pustaka": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const [peta, jumlah, profil] = await Promise.all([muatKatalog(env, req), hak.pustakaJumlah(env, akun), hak.pustakaProfil(env, akun)]);
    const dokumen = [...peta.values()].map((d) => ({
      id: d.id, jenis: d.jenis, penerbit: d.penerbit, tanggal: d.tanggal, bahasa: d.bahasa, format: d.format, ukuran: d.ukuran, halaman: d.halaman,
      jumlah_unduh: jumlah?.[d.id] ?? 0, bisa_unduh: !!d.url || d.berkas.some((b) => b.r2),
      berkas: d.berkas.map((b) => ({ id: b.id, nama: b.nama ?? null, format: b.format, ukuran: b.ukuran ?? null, halaman: b.halaman ?? null })),
    }));
    return json({ dokumen, saya: { nama: akun.nama, surel: akun.surel, instansi: profil?.instansi ?? null, telepon: profil?.telepon ?? null, pernah: !!profil?.pernah, tujuan: profil?.tujuan ?? null } }, 200, PRIVAT);
  },

  // Catat unduhan lalu kembalikan tujuan unduh. Pertama kali: tujuan + persetujuan wajib; sesudahnya cukup satu klik.
  "POST /api/pustaka/:id/unduh": async (req, env, ctx, p) => {
    const akun = perlu(p);
    if (!RE_ID.test(p.params.id)) return gagal("tidak_ditemukan");
    const b = await bacaBody(req, 2048);
    const berkasId = b.berkas == null ? "utama" : b.berkas;
    if (typeof berkasId !== "string" || !RE_BERKAS.test(berkasId)) return gagal("masukan_salah", 422);
    const kosong = (v) => v == null || v === "";
    if (!kosong(b.instansi) && !(typeof b.instansi === "string" && b.instansi.trim().length >= 1 && b.instansi.trim().length <= 120)) return gagal("masukan_salah", 422);
    if (!kosong(b.telepon) && !(typeof b.telepon === "string" && RE_TELEPON.test(b.telepon.trim()))) return gagal("masukan_salah", 422);
    if (b.tujuan != null && !hak.TUJUAN_PUSTAKA.includes(b.tujuan)) return gagal("masukan_salah", 422);
    const peta = await muatKatalog(env, req);
    const d = peta.get(p.params.id);
    if (!d) return gagal("tidak_ditemukan");
    const berkas = d.berkas.find((x) => x.id === berkasId);
    if (!berkas) return gagal("tidak_ditemukan");
    if ((await hak.catatLaju(env, "unduh:" + akun.id, 3600)) > BATAS_UNDUH_JAM) return gagal("laju_terlampaui");
    const profil = await hak.pustakaProfil(env, akun);
    if (!profil) return gagal("layanan");
    let tujuan = b.tujuan;
    if (!profil.pernah) { if (!tujuan || b.setuju !== true) return gagal("persetujuan_wajib", 422); }
    else tujuan = tujuan ?? profil.tujuan ?? "lainnya";

    // Tujuan unduh: R2 bila berkasnya ada, selain itu tautan sumber resmi; tak ada keduanya = tidak dicatat.
    let via = null;
    if (berkas.r2 && env.BERKAS && (await env.BERKAS.head(kunciR2(d, berkas)))) via = "r2";
    else if (berkasId === "utama" && d.url) via = "sumber";
    if (!via) return gagal("berkas_belum_ada");

    await hak.pustakaCatat(env, akun, {
      dokumenId: d.id, berkasId, tujuan, via,
      instansi: profil.instansi ? null : kosong(b.instansi) ? null : b.instansi.trim(),
      telepon: profil.telepon ? null : kosong(b.telepon) ? null : b.telepon.trim(),
    });
    if (via === "sumber") return json({ via, url: d.url }, 200, PRIVAT);
    const exp = Math.floor(Date.now() / 1000) + UMUR_TAUTAN;
    const mac = await tandai(env, pesanTautan(akun.id, d, berkas, exp));
    return json({ via, url: `/api/pustaka/${encodeURIComponent(d.id)}/berkas/${berkas.id}?t=${exp}.${mac}` }, 200, PRIVAT);
  },

  // Stream dari R2; hanya dengan tautan hasil POST di atas (akun sama, belum kedaluwarsa).
  "GET /api/pustaka/:id/berkas/:bid": async (req, env, ctx, p) => {
    const akun = perlu(p);
    const m = (new URL(req.url).searchParams.get("t") || "").match(/^(\d{10})\.([0-9a-f]{64})$/);
    if (!m || !RE_ID.test(p.params.id) || !RE_BERKAS.test(p.params.bid)) return gagal("dilarang");
    if (Number(m[1]) < Date.now() / 1000) return gagal("dilarang");
    const d = (await muatKatalog(env, req)).get(p.params.id);
    const berkas = d?.berkas.find((x) => x.id === p.params.bid);
    if (!berkas || !berkas.r2) return gagal("tidak_ditemukan");
    if (!samaTetap(await tandai(env, pesanTautan(akun.id, d, berkas, m[1])), m[2])) return gagal("dilarang");
    const o = await env.BERKAS?.get(kunciR2(d, berkas));
    if (!o) return gagal("berkas_belum_ada");
    const nama = `${d.id}${berkas.id === "utama" ? "" : "-" + berkas.id}.${berkas.format}`.replace(/[^A-Za-z0-9._-]/g, "_");
    return new Response(o.body, { status: 200, headers: { "content-type": MIME[berkas.format] || "application/octet-stream", "content-disposition": `attachment; filename="${nama}"`, ...PRIVAT } });
  },

  // Admin: rekap per dokumen + daftar unduhan (akun, dokumen, tujuan, waktu).
  "GET /api/admin/pustaka/unduhan": async (req, env, ctx, p) => {
    const akun = perlu(p, ADM);
    const r = await hak.pustakaRekap(env, akun, new URL(req.url).searchParams.get("hal") ?? 1);
    return r ? json(r, 200, PRIVAT) : json({ galat: "Fitur belum aktif.", kode: "fitur_belum_aktif" }, 503, PRIVAT);
  },
};
