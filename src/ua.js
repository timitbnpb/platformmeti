// ua.js: ringkasan perangkat dari User-Agent dan lokasi tingkat kota dari request.cf. UA mentah dan IP TIDAK disimpan; hanya ringkasannya.
const bersih = (v, maks = 60) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, maks) : "") || null;

export function ringkasUA(ua) {
  const u = typeof ua === "string" ? ua.slice(0, 400) : "";
  const jenis = /iPad|Tablet/i.test(u) || (/Android/i.test(u) && !/Mobile/i.test(u)) ? "tablet" : /Mobi|iPhone|Android/i.test(u) ? "ponsel" : "desktop";
  const peramban = /Edg(e|A|iOS)?\//.test(u) ? "Edge" : /OPR\/|Opera/.test(u) ? "Opera" : /SamsungBrowser/.test(u) ? "Samsung Internet" : /Firefox\/|FxiOS/.test(u) ? "Firefox"
    : /Chrome\/|CriOS/.test(u) ? "Chrome" : /Safari\//.test(u) ? "Safari" : null;
  const os = /iPhone/.test(u) ? "iPhone" : /iPad/.test(u) ? "iPad" : /Android/.test(u) ? "Android" : /Windows/.test(u) ? "Windows" : /Mac OS X|Macintosh/.test(u) ? "macOS"
    : /CrOS/.test(u) ? "ChromeOS" : /Linux|X11/.test(u) ? "Linux" : null;
  return { perangkat: peramban && os ? `${peramban} di ${os}` : peramban || os || null, jenis };
}

// Hanya kota, wilayah (provinsi), negara (kode 2 huruf) dari cf; tanpa koordinat.
export function lokasiCf(cf) {
  const negara = typeof cf?.country === "string" && /^[A-Za-z]{2}$/.test(cf.country) ? cf.country.toUpperCase() : null;
  return { kota: bersih(cf?.city), wilayah: bersih(cf?.region), negara };
}

export const infoSesi = (req) => ({ ...ringkasUA(req.headers.get("user-agent")), ...lokasiCf(req.cf) });
