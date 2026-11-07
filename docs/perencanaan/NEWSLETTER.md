# Langganan newsletter METI

Status 8 Nov 2026: pendaftaran, berhenti, dan daftar admin sudah jalan; **belum ada pengiriman surel** (K19: layanan surel belum dipilih).

## Yang ada
- `/langganan` (terbuka untuk tamu, pengecualian D19 di `src/worker.js`, juga asetnya) dan `/berhenti?t=<token>` (halaman yang sama, mode dari jalur).
- D1 `langganan` (migrasi 0014): surel unik huruf kecil, nama, instansi, minat (JSON: kebijakan, proyek, acara, kajian, lowongan), status `aktif|berhenti`, `token_berhenti` acak 64 hex, `setuju_pada` (bukti persetujuan UU PDP), `akun_id`. Tanpa IP.
- API: `POST /api/langganan` (terbuka; selalu 201 `{ok:true}` untuk masukan sah agar tidak membocorkan surel terdaftar; honeypot `situs_web`; laju 6/jam per ipHash), `POST /api/langganan/berhenti` (terbuka, token atau akun), `GET /api/langganan/saya` (akun), `GET /api/admin/langganan` (admin/super; `?format=csv` unduh, tercatat di jejak).
- Surel yang sudah aktif tidak ditimpa lewat formulir publik. Yang sudah berhenti diaktifkan lagi dan token diganti.
- Tautan sosial resmi: `public/inti/sosmed.js` (dipakai kaki, /langganan; siap dipakai Tentang, Siaran Pers, Event).

## Mengirim nanti
1. Pilih penyedia: Cloudflare Email Service (Workers `send_email`, hanya ke alamat terverifikasi sampai domain dikonfigurasi), atau penyedia API (Resend, Brevo, Amazon SES) dengan kunci sebagai rahasia Worker (`wrangler secret`), tidak pernah di repo.
2. Konfirmasi ganda (double opt-in): pendaftaran baru berstatus `menunggu` (tambah nilai ke CHECK lewat migrasi baru), surel berisi tautan `/konfirmasi?t=<token>` sekali pakai; hanya `aktif` yang menerima kiriman. Ini juga menutup celah orang mendaftarkan surel pihak lain.
3. Tiap surel memuat tautan berhenti `/berhenti?t=<token_berhenti>` dan header `List-Unsubscribe` (+ `List-Unsubscribe-Post`).
4. Kirim lewat cron Worker bertahap (batas per menit penyedia), pilih penerima menurut `minat`, catat ringkasan batch di `jejak`.
5. Domain pengirim: SPF, DKIM, DMARC lebih dulu.
