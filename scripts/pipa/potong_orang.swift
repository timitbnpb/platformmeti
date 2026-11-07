// Potong ulang foto orang jadi potret transparan yang rapi (macOS 14+, Vision).
//   potong_orang berkas-masuk.(png|jpg|webp) berkas-keluar.png [--perbaiki]
//   potong_orang --kontak keluar.png sebelum.webp sesudah.webp [sebelum sesudah ...]   (lembar kontak, latar #0A5C47)
//   potong_orang --selftest
// Langkah: segmentasi orang (VNGenerateForegroundInstanceMask) -> erosi alfa 1 px -> feather ~1,6 px
// -> defringe (warna tepi dari piksel dalam terdekat, bukan campuran putih) -> framing 3:4 (kepala di sepertiga atas).
// --perbaiki: tanpa pembesaran, ukuran asli dipertahankan, framing tidak diubah.
// Keluaran PNG RGBA; pengodean webp: cwebp -q 85 -alpha_q 90 ; sumber asli METI: data-panen/lembaga/foto/meti/*.png.
import Foundation
import Vision
import ImageIO
import CoreGraphics
import UniformTypeIdentifiers

struct Img { var w: Int; var h: Int; var r: [Float]; var g: [Float]; var b: [Float]; var a: [Float] }

func muat(_ p: String) -> Img? {
  guard let s = CGImageSourceCreateWithURL(URL(fileURLWithPath: p) as CFURL, nil),
        let c = CGImageSourceCreateImageAtIndex(s, 0, nil) else { return nil }
  let w = c.width, h = c.height
  var buf = [UInt8](repeating: 0, count: w * h * 4)
  let cs = CGColorSpaceCreateDeviceRGB()
  buf.withUnsafeMutableBytes { raw in
    let ctx = CGContext(data: raw.baseAddress, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: cs,
                        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    ctx.draw(c, in: CGRect(x: 0, y: 0, width: w, height: h))
  }
  var im = Img(w: w, h: h, r: [], g: [], b: [], a: [])
  let n = w * h
  im.r = [Float](repeating: 0, count: n); im.g = im.r; im.b = im.r; im.a = im.r
  for i in 0..<n {
    let a = Float(buf[i * 4 + 3]) / 255
    im.a[i] = a
    if a > 0 { im.r[i] = Float(buf[i * 4]) / 255 / a; im.g[i] = Float(buf[i * 4 + 1]) / 255 / a; im.b[i] = Float(buf[i * 4 + 2]) / 255 / a }
  }
  return im
}

func keCG(_ im: Img, latar: (Float, Float, Float)? = nil) -> CGImage {
  let n = im.w * im.h
  var buf = [UInt8](repeating: 0, count: n * 4)
  for i in 0..<n {
    let a = im.a[i]
    var r = im.r[i], g = im.g[i], b = im.b[i]
    if let l = latar { r = r * a + l.0 * (1 - a); g = g * a + l.1 * (1 - a); b = b * a + l.2 * (1 - a) }
    let k: Float = latar != nil ? 1 : a
    let al: Float = latar != nil ? 1 : a
    buf[i * 4] = UInt8(max(0, min(255, (r * k * 255).rounded())))
    buf[i * 4 + 1] = UInt8(max(0, min(255, (g * k * 255).rounded())))
    buf[i * 4 + 2] = UInt8(max(0, min(255, (b * k * 255).rounded())))
    buf[i * 4 + 3] = UInt8(max(0, min(255, (al * 255).rounded())))
  }
  let data = Data(buf) as CFData
  return CGImage(width: im.w, height: im.h, bitsPerComponent: 8, bitsPerPixel: 32, bytesPerRow: im.w * 4,
                 space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue),
                 provider: CGDataProvider(data: data)!, decode: nil, shouldInterpolate: true, intent: .defaultIntent)!
}

func simpanPNG(_ c: CGImage, _ p: String) {
  let d = CGImageDestinationCreateWithURL(URL(fileURLWithPath: p) as CFURL, UTType.png.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(d, c, nil); CGImageDestinationFinalize(d)
}

// ---- operator alfa (murni, diuji di selftest) ----
func erosi(_ a: [Float], _ w: Int, _ h: Int, _ r: Int) -> [Float] {
  var o = a
  for _ in 0..<r {
    let s = o
    for y in 0..<h { for x in 0..<w {
      var m = s[y * w + x]
      if x > 0 { m = min(m, s[y * w + x - 1]) }; if x < w - 1 { m = min(m, s[y * w + x + 1]) }
      if y > 0 { m = min(m, s[(y - 1) * w + x]) }; if y < h - 1 { m = min(m, s[(y + 1) * w + x]) }
      o[y * w + x] = m
    } }
  }
  return o
}
func lebarkan(_ a: [Float], _ w: Int, _ h: Int, _ r: Int) -> [Float] { erosi(a.map { 1 - $0 }, w, h, r).map { 1 - $0 } }

func feather(_ a: [Float], _ w: Int, _ h: Int, sigma: Float) -> [Float] {
  let rad = Int((sigma * 3).rounded(.up))
  var k = (-rad...rad).map { exp(-Float($0 * $0) / (2 * sigma * sigma)) }
  let sk = k.reduce(0, +); k = k.map { $0 / sk }
  var t = a, o = a
  for y in 0..<h { for x in 0..<w {
    var s: Float = 0
    for j in -rad...rad { s += k[j + rad] * a[y * w + min(w - 1, max(0, x + j))] }
    t[y * w + x] = s } }
  for y in 0..<h { for x in 0..<w {
    var s: Float = 0
    for j in -rad...rad { s += k[j + rad] * t[min(h - 1, max(0, y + j)) * w + x] }
    o[y * w + x] = s } }
  return o
}

/// Defringe: tiap piksel yang bukan "padat" (alfa < ambang) memakai warna rata-rata piksel padat terdekat (BFS multi-sumber),
/// sehingga tepi setengah transparan tidak membawa warna putih/latar lama.
func defringe(_ r: inout [Float], _ g: inout [Float], _ b: inout [Float], padat: [Bool], _ w: Int, _ h: Int) {
  var dist = [Int](repeating: -1, count: w * h)
  var q: [Int] = []
  for i in 0..<(w * h) where padat[i] { dist[i] = 0; q.append(i) }
  if q.isEmpty { return }
  var head = 0
  let nr = r, ng = g, nb = b
  var sr = [Float](repeating: 0, count: w * h), sg = sr, sb = sr, sn = [Float](repeating: 0, count: w * h)
  for i in q { sr[i] = nr[i]; sg[i] = ng[i]; sb[i] = nb[i]; sn[i] = 1 }
  while head < q.count {
    let i = q[head]; head += 1
    let x = i % w, y = i / w
    for (dx, dy) in [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)] {
      let nx = x + dx, ny = y + dy
      if nx < 0 || ny < 0 || nx >= w || ny >= h { continue }
      let j = ny * w + nx
      if dist[j] == -1 { dist[j] = dist[i] + 1; q.append(j) }
      if dist[j] == dist[i] + 1 { sr[j] += sr[i] / max(sn[i], 1) ; sg[j] += sg[i] / max(sn[i], 1); sb[j] += sb[i] / max(sn[i], 1); sn[j] += 1 }
    }
  }
  for i in 0..<(w * h) where !padat[i] && sn[i] > 0 { r[i] = sr[i] / sn[i]; g[i] = sg[i] / sn[i]; b[i] = sb[i] / sn[i] }
}

// ---- Vision ----
func maskOrang(_ im: Img) -> [Float]? {
  let cg = keCG(im, latar: (0.5, 0.5, 0.5))
  let h = VNImageRequestHandler(cgImage: cg, options: [:])
  let req = VNGenerateForegroundInstanceMaskRequest()
  guard (try? h.perform([req])) != nil, let o = req.results?.first, !o.allInstances.isEmpty,
        let pb = try? o.generateScaledMaskForImage(forInstances: o.allInstances, from: h) else { return nil }
  CVPixelBufferLockBaseAddress(pb, .readOnly); defer { CVPixelBufferUnlockBaseAddress(pb, .readOnly) }
  let W = CVPixelBufferGetWidth(pb), H = CVPixelBufferGetHeight(pb), bpr = CVPixelBufferGetBytesPerRow(pb)
  guard W == im.w, H == im.h, let base = CVPixelBufferGetBaseAddress(pb) else { return nil }
  var m = [Float](repeating: 0, count: W * H)
  for y in 0..<H { let row = base.advanced(by: y * bpr).assumingMemoryBound(to: Float.self); for x in 0..<W { m[y * W + x] = row[x] } }
  return m
}

func wajah(_ im: Img) -> CGRect? {
  let cg = keCG(im, latar: (0.5, 0.5, 0.5))
  let req = VNDetectFaceRectanglesRequest()
  try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
  guard let b = (req.results ?? []).max(by: { $0.boundingBox.width < $1.boundingBox.width }) else { return nil }
  let r = b.boundingBox
  return CGRect(x: r.minX * Double(im.w), y: (1 - r.maxY) * Double(im.h), width: r.width * Double(im.w), height: r.height * Double(im.h))
}

func iou(_ a: [Float], _ b: [Float]) -> Float {
  var i: Float = 0, u: Float = 0
  for k in 0..<a.count { let x = a[k] > 0.5, y = b[k] > 0.5; if x && y { i += 1 }; if x || y { u += 1 } }
  return u == 0 ? 0 : i / u
}

func proses(_ im0: Img, perbaiki: Bool, log: inout String) -> Img {
  var im = im0
  let w = im.w, h = im.h, n = w * h
  let punyaAlfa = im.a.contains { $0 < 0.98 }
  let mv = maskOrang(im)
  var a = im.a
  if let m = mv {
    if punyaAlfa {
      let k = iou(m, im.a)
      // bentuk asli sudah transparan: pakai maskernya hanya bila sebangun (>= 0,85); kalau tidak, alfa lama dibersihkan saja
      if k >= 0.85 { let near = lebarkan(im.a, w, h, 2); for i in 0..<n { a[i] = m[i] * near[i] }; log += "vision+alfa(iou \(String(format: "%.2f", k))) " }
      else { log += "alfa-lama(iou \(String(format: "%.2f", k))) " }
    } else { a = m; log += "vision " }
  } else { log += "alfa-lama(tanpa vision) " }
  // sisa bintik terpisah ikut terbuang oleh erosi + feather; erosi 1 px lalu feather
  let padat = erosi(a, w, h, 3).map { $0 > 0.97 }
  a = erosi(a, w, h, 1)
  a = feather(a, w, h, sigma: 1.1)
  for i in 0..<n { a[i] = min(1, max(0, (a[i] - 0.06) / 0.88)) } // buang ekor halo tipis
  var r = im.r, g = im.g, b = im.b
  defringe(&r, &g, &b, padat: padat, w, h)
  im.a = a; im.r = r; im.g = g; im.b = b
  return im
}

func bingkai(_ im: Img) -> Img {
  let w = im.w, h = im.h
  guard let f = wajah(im) else { return im }
  var Hc = min(Double(h), Double(f.height) / 0.24)
  var Wc = Hc * 0.75
  if Wc > Double(w) { Wc = Double(w); Hc = Wc / 0.75 }
  let cx = Double(f.midX)
  let x0 = max(0, min(Double(w) - Wc, cx - Wc / 2))
  let y0 = max(0, min(Double(h) - Hc, Double(f.midY) - 0.30 * Hc))
  let cw = Int(Wc.rounded()), ch = Int((Wc * 4 / 3).rounded())
  let scale = min(640.0 / Double(cw), 1.5)
  let ow = Int((Double(cw) * scale).rounded()), oh = Int((Double(cw) * scale * 4 / 3).rounded())
  // potong + skala dengan CoreGraphics (alfa tak-premultiply -> pakai premultiplied lalu kembalikan)
  let cg = keCG(im)
  guard let crop = cg.cropping(to: CGRect(x: x0, y: y0, width: Double(cw), height: Double(ch))) else { return im }
  var buf = [UInt8](repeating: 0, count: ow * oh * 4)
  buf.withUnsafeMutableBytes { raw in
    let ctx = CGContext(data: raw.baseAddress, width: ow, height: oh, bitsPerComponent: 8, bytesPerRow: ow * 4,
                        space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    ctx.interpolationQuality = .high
    ctx.draw(crop, in: CGRect(x: 0, y: 0, width: ow, height: oh))
  }
  var o = Img(w: ow, h: oh, r: [], g: [], b: [], a: [])
  let n = ow * oh
  o.r = [Float](repeating: 0, count: n); o.g = o.r; o.b = o.r; o.a = o.r
  for i in 0..<n {
    let a = Float(buf[i * 4 + 3]) / 255; o.a[i] = a
    if a > 0 { o.r[i] = Float(buf[i * 4]) / 255 / a; o.g[i] = Float(buf[i * 4 + 1]) / 255 / a; o.b[i] = Float(buf[i * 4 + 2]) / 255 / a }
  }
  return o
}

func kontak(_ keluar: String, _ pasang: [(String, String)]) {
  let tw = 200, th = 267, gap = 8, kolom = 6
  let bar = (pasang.count + kolom - 1) / kolom
  let W = kolom * (2 * tw + 3 * gap), H = bar * (th + gap) + gap
  var canvas = Img(w: W, h: H, r: [Float](repeating: 10 / 255.0, count: W * H), g: [Float](repeating: 92 / 255.0, count: W * H), b: [Float](repeating: 71 / 255.0, count: W * H), a: [Float](repeating: 1, count: W * H))
  var buf = [UInt8](repeating: 255, count: W * H * 4)
  for i in 0..<(W * H) { buf[i * 4] = 10; buf[i * 4 + 1] = 92; buf[i * 4 + 2] = 71 }
  _ = canvas; canvas.a = []
  buf.withUnsafeMutableBytes { raw in
    let ctx = CGContext(data: raw.baseAddress, width: W, height: H, bitsPerComponent: 8, bytesPerRow: W * 4, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    ctx.interpolationQuality = .high
    for (k, (s, t)) in pasang.enumerated() {
      let cx = (k % kolom) * (2 * tw + 3 * gap) + gap, cy = H - ((k / kolom) + 1) * (th + gap)
      for (j, p) in [s, t].enumerated() {
        guard let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: p) as CFURL, nil), let c = CGImageSourceCreateImageAtIndex(src, 0, nil) else { continue }
        let sc = min(Double(tw) / Double(c.width), Double(th) / Double(c.height))
        let dw = Double(c.width) * sc, dh = Double(c.height) * sc
        ctx.draw(c, in: CGRect(x: Double(cx + j * (tw + gap)) + (Double(tw) - dw) / 2, y: Double(cy) + (Double(th) - dh) / 2, width: dw, height: dh))
      }
    }
  }
  let c = CGContext(data: &buf, width: W, height: H, bitsPerComponent: 8, bytesPerRow: W * 4, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!.makeImage()!
  simpanPNG(c, keluar)
}

func selftest() {
  let w = 20, h = 20
  // lingkaran putih-opak: tepi setengah transparan berwarna putih, isi merah -> setelah defringe tepi tidak putih
  var r = [Float](repeating: 1, count: w * h), g = r, b = r
  var a = [Float](repeating: 0, count: w * h)
  for y in 0..<h { for x in 0..<w { let d = hypot(Float(x) - 9.5, Float(y) - 9.5); if d < 6 { r[y * w + x] = 1; g[y * w + x] = 0; b[y * w + x] = 0; a[y * w + x] = 1 } else if d < 7.5 { a[y * w + x] = 0.5 } } }
  let padat = erosi(a, w, h, 1).map { $0 > 0.97 }
  defringe(&r, &g, &b, padat: padat, w, h)
  for i in 0..<(w * h) where a[i] > 0 { assert(g[i] < 0.01 && b[i] < 0.01, "defringe: piksel tepi masih putih") }
  let e = erosi(a, w, h, 1); assert(e.filter { $0 > 0.9 }.count < a.filter { $0 > 0.9 }.count, "erosi harus mengecil")
  let f = feather(a, w, h, sigma: 1.1); assert(abs(f.reduce(0, +) - a.reduce(0, +)) < 1.0, "feather menjaga massa alfa")
  assert(f.contains { $0 > 0.05 && $0 < 0.95 }, "feather menghasilkan peralihan")
  print("potong_orang selftest ok")
}

let args = Array(CommandLine.arguments.dropFirst())
if args.first == "--selftest" { selftest() }
else if args.first == "--kontak", args.count >= 4 {
  var ps: [(String, String)] = []; var i = 2
  while i + 1 < args.count { ps.append((args[i], args[i + 1])); i += 2 }
  kontak(args[1], ps)
} else if args.count >= 2 {
  guard let im = muat(args[0]) else { FileHandle.standardError.write("gagal baca \(args[0])\n".data(using: .utf8)!); exit(1) }
  let perbaiki = args.contains("--perbaiki")
  var log = ""
  var o = proses(im, perbaiki: perbaiki, log: &log)
  if !perbaiki { o = bingkai(o) }
  simpanPNG(keCG(o), args[1])
  print("\(args[0]) -> \(o.w)x\(o.h) \(log)")
} else { print("pakai: lihat kepala berkas") }
