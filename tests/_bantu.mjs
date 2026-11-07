// Bantu uji bersama: D1 LOKAL NYATA (Miniflare/workerd), bukan mock.
// buatEnv() -> { env, tutup } (via wrangler getPlatformProxy) dengan env.DB berisi semua migrations/*.sql yang sudah diterapkan.
import { getPlatformProxy } from "wrangler";
import { readdirSync, readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const AKAR = join(dirname(fileURLToPath(import.meta.url)), "..");

// D1.exec() memecah per baris, jadi pecah sendiri: akhiri pernyataan di ";" paling ujung baris,
// kecuali di dalam badan TRIGGER (sampai baris "END;").
export function pecahSql(sql) {
  const hasil = [];
  let buf = "";
  for (const mentah of sql.split("\n")) {
    const baris = mentah.replace(/--.*$/, "").trimEnd();
    if (!baris.trim()) continue;
    buf += (buf ? "\n" : "") + baris;
    const trigger = /CREATE\s+TRIGGER/i.test(buf);
    if (baris.endsWith(";") && (!trigger || /\bEND;$/i.test(baris))) {
      hasil.push(buf);
      buf = "";
    }
  }
  if (buf.trim()) hasil.push(buf);
  return hasil;
}

export async function terapkanMigrasi(db) {
  const dir = join(AKAR, "migrations");
  const berkas = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of berkas) {
    for (const s of pecahSql(readFileSync(join(dir, f), "utf8"))) await db.prepare(s).run();
  }
  return berkas;
}

export async function buatEnv({ migrasi = true, tambahan = {} } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "jm-uji-"));
  const cfg = join(dir, "wrangler.jsonc");
  writeFileSync(cfg, JSON.stringify({
    name: "uji", main: "x.js", compatibility_date: "2026-11-01",
    d1_databases: [{ binding: "DB", database_name: "uji", database_id: "00000000-0000-0000-0000-000000000000" }],
  }));
  const proxy = await getPlatformProxy({ configPath: cfg, persist: { path: join(dir, "state") } });
  const DB = proxy.env.DB;
  if (migrasi) await terapkanMigrasi(DB);
  const env = {
    DB,
    IP_SALT: "garam-uji-tetap",
    ASSETS: { fetch: async (req) => new Response("aset:" + new URL(req.url).pathname, { status: 200 }) },
    ...tambahan,
  };
  return { env, tutup: async () => { await proxy.dispose(); rmSync(dir, { recursive: true, force: true }); } };
}

// Permintaan buatan. Origin default sama-situs; kirim { origin: null } untuk menghapusnya.
export function minta(jalur, { metode = "GET", badan, cookie, origin = "https://uji.test", ip = "203.0.113.7", header = {} } = {}) {
  const h = { ...header };
  if (badan !== undefined) h["content-type"] = "application/json";
  if (cookie) h.cookie = cookie;
  if (origin) h.origin = origin;
  if (ip) h["cf-connecting-ip"] = ip;
  if (metode !== "GET" && metode !== "HEAD") h["x-pb"] = h["x-pb"] ?? "1";
  return new Request("https://uji.test" + jalur, {
    method: metode,
    headers: h,
    body: badan === undefined ? undefined : typeof badan === "string" ? badan : JSON.stringify(badan),
  });
}

export const ambilCookie = (res, nama = "sesi") => {
  const s = res.headers.getSetCookie?.() ?? [res.headers.get("set-cookie")];
  const c = s.find((x) => x && x.startsWith(nama + "="));
  return c ? c.split(";")[0] : null;
};

// Sesi palsu untuk uji bermock tanpa D1: seluruh situs di balik login, jadi permintaan butuh cookie sah.
// DB palsu hanya menjawab bacaSesi (satu .first()); jangan dipakai bila uji menyentuh D1 lain.
export const COOKIE_PALSU = "sesi=" + "a".repeat(64);
export const DB_SESI_PALSU = { prepare: () => ({ bind: () => ({ first: async () => ({ id: 1, surel: "x@uji.test", nama: "Uji", peran: "anggota", cakupan_prov: null, bahasa: "id", status: "aktif", wajib_ganti: 0, sampai: 9999999999 }) }) }) };
