/* Konten beranda dari pengelola (/api/konten-beranda). Tak tersedia atau kunci null = pakai perilaku bawaan. */
let janji = null;
export const kontenBeranda = () => (janji ||= fetch("/api/konten-beranda", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)).catch(() => null).then((d) => d || {}));
/** daftar id dari kunci; larik kosong bila tak ada. Item sorotan berbentuk {jenis, id}. */
export const daftarKonten = (d, kunci) => { let v = d?.[kunci]; if (typeof v === "string") { try { v = JSON.parse(v); } catch (e) { v = null; } } return Array.isArray(v) ? v : []; };
