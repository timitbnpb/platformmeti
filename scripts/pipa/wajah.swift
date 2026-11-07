// Deteksi wajah (Vision, bawaan macOS). Pakai: swift wajah.swift berkas... -> satu baris JSON per berkas:
// {"f":path,"w":lebar,"h":tinggi,"w1":[x,y,lebar,tinggi]} piksel, asal kiri-atas; wajah terbesar saja; w1 null bila tak ada.
import Foundation
import Vision
import ImageIO

for p in CommandLine.arguments.dropFirst() {
  var out: [String: Any] = ["f": p, "w1": NSNull()]
  if let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: p) as CFURL, nil),
     let img = CGImageSourceCreateImageAtIndex(src, 0, nil) {
    let W = Double(img.width), H = Double(img.height)
    out["w"] = img.width; out["h"] = img.height
    let req = VNDetectFaceRectanglesRequest()
    try? VNImageRequestHandler(cgImage: img, options: [:]).perform([req])
    if let b = (req.results ?? []).max(by: { $0.boundingBox.width * $0.boundingBox.height < $1.boundingBox.width * $1.boundingBox.height }) {
      let r = b.boundingBox
      out["w1"] = [r.minX * W, (1 - r.maxY) * H, r.width * W, r.height * H]
    }
  }
  if let d = try? JSONSerialization.data(withJSONObject: out), let s = String(data: d, encoding: .utf8) { print(s) }
}
