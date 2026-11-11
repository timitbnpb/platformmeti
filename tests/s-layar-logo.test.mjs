import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { LOGO_ORG_ADA } from "../public/inti/logo_org_ada.js";
test("daftar logo org ada = isi public/img/logo/org", () => {
  const ada = readdirSync(new URL("../public/img/logo/org/", import.meta.url)).filter((f) => f.endsWith(".png")).map((f) => f.slice(0, -4)).sort();
  assert.deepEqual([...LOGO_ORG_ADA].sort(), ada);
});
