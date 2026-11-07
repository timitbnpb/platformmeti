// GET /api/kelayakan/power?lat&lon (publik): proksi klimatologi NASA POWER, agar browser tak perlu connect-src ke host luar.
import * as hak from "./hak.js";
import { gagal, ipHash, json } from "./util.js";

const TTL = 30 * 86400;
const UBAH = { "ALLSKY_SFC_SW_DWN": 1, "WS50M": 1 };

async function power(req, env, ctx) {
  const q = new URL(req.url).searchParams;
  const lat = Number(q.get("lat")), lon = Number(q.get("lon"));
  // bbox Indonesia (longgar); dibulatkan 0,5 derajat agar kunci cache terbatas
  if (!q.get("lat") || !q.get("lon") || !Number.isFinite(lat) || !Number.isFinite(lon) || lat < -11.5 || lat > 6.5 || lon < 94 || lon > 141.5) return gagal("masukan_salah", 422);
  const la = (Math.round(lat * 2) / 2).toFixed(2), lo = (Math.round(lon * 2) / 2).toFixed(2);
  const kunci = new Request(`${new URL(req.url).origin}/api/kelayakan/power?lat=${la}&lon=${lo}`);
  const c = globalThis.caches?.default, kena = c && (await c.match(kunci));
  if (kena) return kena;
  const ip = await ipHash(env, req).catch(() => null);
  if (ip && (await hak.sistem.catatLaju(env, "cari:pw" + ip, 60)) > 20) return gagal("laju_terlampaui");
  try {
    const o = await fetch(`https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN,WS50M&community=RE&longitude=${lo}&latitude=${la}&format=JSON`, { signal: AbortSignal.timeout(10000) });
    if (!o.ok) return gagal("layanan");
    const d = await o.json(), p = d?.properties?.parameter;
    if (!p) return gagal("layanan");
    const res = json({ properties: { parameter: Object.fromEntries(Object.keys(UBAH).map((k) => [k, p[k]])) }, header: { range: String(d?.header?.range || "") } }, 200, { "cache-control": `public, max-age=${TTL}` });
    if (c) ctx?.waitUntil?.(c.put(kunci, res.clone()));
    return res;
  } catch { return gagal("layanan"); }
}

export const rute = { "GET /api/kelayakan/power": power };
