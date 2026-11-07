// OCR PDF pindaian (PDFKit + Vision, bawaan macOS). Pakai: swift ocr_pdf.swift berkas.pdf > teks.txt
// Keluaran: teks tiap halaman dipisah karakter form-feed (\u{0C}), sama seperti pdftotext, supaya nomor halaman sejajar.
import Foundation
import PDFKit
import Vision

guard CommandLine.arguments.count > 1, let doc = PDFDocument(url: URL(fileURLWithPath: CommandLine.arguments[1])) else { exit(1) }
for i in 0..<doc.pageCount {
  guard let page = doc.page(at: i) else { continue }
  let r = page.bounds(for: .mediaBox), s: CGFloat = 2.5
  let w = Int(r.width * s), h = Int(r.height * s)
  guard let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0, space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGImageAlphaInfo.none.rawValue) else { continue }
  ctx.setFillColor(gray: 1, alpha: 1); ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
  ctx.scaleBy(x: s, y: s); page.draw(with: .mediaBox, to: ctx)
  var teks = ""
  if let img = ctx.makeImage() {
    let req = VNRecognizeTextRequest(); req.recognitionLevel = .accurate; req.recognitionLanguages = ["id-ID", "en-US"]; req.usesLanguageCorrection = false
    try? VNImageRequestHandler(cgImage: img, options: [:]).perform([req])
    // urut baris: atas ke bawah, lalu kiri ke kanan; satu baris = kotak dengan y berdekatan
    let obs = (req.results ?? []).sorted { $0.boundingBox.midY > $1.boundingBox.midY }
    var baris: [[VNRecognizedTextObservation]] = []
    for o in obs { if var b = baris.last, abs(b[0].boundingBox.midY - o.boundingBox.midY) < 0.008 { b.append(o); baris[baris.count - 1] = b } else { baris.append([o]) } }
    teks = baris.map { $0.sorted { $0.boundingBox.minX < $1.boundingBox.minX }.compactMap { $0.topCandidates(1).first?.string }.joined(separator: "   ") }.joined(separator: "\n")
  }
  print(teks + "\u{0C}", terminator: "")
}
