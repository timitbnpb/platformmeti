// Uji asap live: hanya jalan bila UJI_LIVE=1 (menyentuh situs produksi, GET saja); `npm run uji` tetap offline.
import test from "node:test";
import {spawnSync} from "node:child_process";

test("uji asap live lulus", {skip: process.env.UJI_LIVE !== "1" && "set UJI_LIVE=1 untuk menjalankan"}, () => {
  const r = spawnSync(process.execPath, ["scripts/mesin/uji_asap_live.mjs"], {encoding: "utf8", timeout: 600000});
  if (r.status !== 0) throw new Error(r.stdout.slice(-2000) + r.stderr.slice(-500));
});
