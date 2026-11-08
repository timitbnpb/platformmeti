// Logika daftar buang paket serah terima (fungsi murni, tanpa git).
import test from "node:test";
import assert from "node:assert/strict";
import { cocok, pisah, cariTemuan } from "../scripts/serah/paket.mjs";

test("cocok: folder di mana pun, akhiran nama, jalur persis", () => {
  assert.ok(cocok(".claude/agents/x.md", ".claude/"));
  assert.ok(cocok("docs/internal/a.md", "docs/internal/"));
  assert.ok(cocok("x/raw/a.json", "raw/"));
  assert.ok(!cocok("src/rawan/a.js", "raw/"));
  assert.ok(cocok("a/b/agenda.bundle", "*.bundle"));
  assert.ok(!cocok("bundle.js", "*.bundle"));
  assert.ok(cocok("AGENTS.md", "AGENTS.md"));
  assert.ok(!cocok("docs/AGENTS.md", "AGENTS.md"));
});
test("pisah: berkas internal terbuang, sisanya utuh", () => {
  const r = pisah(["src/worker.js", "AGENTS.md", "CLAUDE.md", "Claude outputs/a.pdf", "docs/ATURAN-PEMILIK.md", "docs/perencanaan/PRD.md", "artefak/x.json"]);
  assert.deepEqual(r.simpan, ["src/worker.js", "docs/perencanaan/PRD.md"]);
  assert.equal(r.buang.length, 5);
});
test("cariTemuan: jalur lokal, proyek lain, gmail", () => {
  assert.equal(cariTemuan("a", "aman").length, 0);
  assert.equal(cariTemuan("a", "/Users/x dan Poskokarhutla dan a@gmail.com").length, 3);
});
