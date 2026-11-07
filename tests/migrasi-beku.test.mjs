// Migrasi yang sudah jalan tidak boleh disunting: hash SHA-256 berkas 0001-0027 dibekukan; awalan nomor unik.
// Perubahan skema = migrasi BARU (nomor berikutnya). Menambah berkas 0028+ tidak menyentuh uji ini.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");
const BEKU = {
  "0001_akun.sql": "d1634784787eaea5dbe52f3e8323d9798cc017a56657fb8e57b4179c03539551",
  "0002_jejak.sql": "0e3b2a0113e087def9e687b314617756ef8252fb74f9ca48c10fe1e800899436",
  "0003_entitas.sql": "601dce0397735dfd62341d337f0132b39968615530e2bbead09273dfd74635c4",
  "0004_koreksi.sql": "5dc09c25d3e736d6f2f029efbce9fdcb2208da2992e9e8bc38c08c70d856050d",
  "0005_riwayat.sql": "baf4b437aa935ddb5c2a82fcefa9d3e614acd59869408c1914e6d14cd11962af",
  "0006_laju.sql": "b1e7bff389e687288f670760d987598ec92b23a27f184fa32e00697b4b240ddd",
  "0007_program.sql": "46f6e02ff8780848375d2e0e890b7a17b3b3bf052b352ee1c3a6b27d2b84641e",
  "0008_program_ikatan.sql": "5fce25b605aa3e9dc02a0bd9c89c1fa62754b2e92f70d5b1e085617305db2041",
  "0009_anggota_ubah.sql": "81a04abba13022bab6c5ca38994e68dcfda00bc83d569f3648604a42acf03783",
  "0010_agenda_bukti.sql": "0cf15e68309af56e8e24a5d1574bb139e5a49f6536d2f204f43d301e1589749b",
  "0011_admin.sql": "15540ed6082105b2599ab2793fe112e24379e7cd344326776177789322e56568",
  "0012_pustaka.sql": "5ca5eef8fdf9483fed0468338ecb08779b6d924e837723ad00e8ecca754c7daa",
  "0013_event.sql": "8439445bfdfa1b5adaf23e4bec0160192e6643551d8450634b15a0a77fbb7780",
  "0014_newsletter.sql": "aa413844d625236b744a7d36a90c39a106fb23bd5e4a44185e09320a36a665ed",
  "0015_meti_wilayah.sql": "d9fc939547cf967419c2c8a1e6a67bf9d11534cf371b7290bfa52660b28992cc",
  "0016_pesan.sql": "91cdaff2846d782bf3376f32c25fa3651f18dad887cf0f598e8b5fb14a6194f2",
  "0017_kta.sql": "eda0aa1b1c91b576e2f86c988c1ed2bc14c2bf0e82ec8f19a747078d6e5a70ff",
  "0018_profil.sql": "918e428860fe87966635f91446852e66c918bf32f4b8b03791b9113f3b69193a",
  "0019_ikuti_portal.sql": "bdce90de96c967e5def489ea4e02e893a99de1d2d673b12a79394543ff3317ec",
  "0020_lalu_lintas.sql": "d9d98612bd7f83897f212257b4cbed6710d12a95ce189cd9954cc93f5743ccf4",
  "0021_pendaftaran.sql": "72c294992bef9ca4d7a6437c19a5a622c4c33bc10d1b1ddd9e6a6327b154030e",
  "0022_sosmed_feed.sql": "0c90d6283cf99a8d78d5b1ca8dee011bf624dcaa2e21758873a203dab1de1c6f",
  "0023_pendaftaran_kategori.sql": "ac2902763feaf6d691d2899501054113edb3c127466fe698001f948d2869b2b8",
  "0024_konsultasi.sql": "d95528c12f91ee5988aa270446e77a1a0aac02a905f2887d80c29256836c287b",
  "0025_beranda_keamanan.sql": "0cf6800d487679f464b88c226214b64610e518c2c4e6d9214a1986c24572873e",
  "0026_masuk_google.sql": "bbdba74d0ed6fca4fdb291e24de15edde117eecf1ccc63eb2526fa9bb069f90d",
  "0027_ikuti_topik.sql": "3f0819e9df82cd341206510e6d7fd1e61143bb2cf05d67f8eb65ab5130fcd963",
};
const berkas = readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();

test("awalan nomor migrasi unik", () => {
  const nomor = berkas.map((f) => f.slice(0, 4));
  assert.equal(new Set(nomor).size, nomor.length, "dua migrasi berbagi nomor: " + nomor.filter((n, i) => nomor.indexOf(n) !== i));
});

test("hash migrasi 0001-0027 beku", () => {
  assert.deepEqual(berkas.filter((f) => f.slice(0, 4) <= "0027" && !(f in BEKU)), [], "migrasi lama tak terdaftar");
  for (const [f, h] of Object.entries(BEKU)) {
    assert.ok(berkas.includes(f), "hilang: " + f);
    assert.equal(createHash("sha256").update(readFileSync(join(DIR, f))).digest("hex"), h, f + " disunting setelah dijalankan; buat migrasi baru");
  }
});
