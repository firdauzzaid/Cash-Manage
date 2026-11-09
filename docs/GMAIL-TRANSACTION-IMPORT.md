# Usulan Impor Notifikasi Transaksi Gmail

Status: implementasi pilot tersedia atas persetujuan produk. Koneksi Gmail tetap fitur opt-in, kandidat selalu memerlukan tinjauan pengguna, dan verifikasi compliance Google masih menjadi release gate.

## Keputusan

Secara teknis fitur ini dapat dibuat, tetapi Gmail **bukan sumber kebenaran transaksi** dan tidak cocok dijadikan fitur otomatis pertama aplikasi. Notifikasi email dapat terlambat, berubah format, digandakan dalam thread, tidak terkirim, atau tidak memberi konteks yang cukup untuk membedakan pengeluaran, transfer, top-up, refund, dan pembayaran yang dibatalkan. Karena itu, hasil ekstraksi harus selalu menjadi **draf untuk dikonfirmasi pengguna**, bukan transaksi yang langsung memengaruhi saldo, anggaran, maupun laporan.

Rekomendasi produk adalah bertahap:

1. Tambahkan dahulu tindakan _"Buat transaksi dari notifikasi"_ secara manual: pengguna menyalin/berbagi isi notifikasi dan aplikasi mengisi nominal, tanggal, merchant, serta catatan bila dapat dikenali; pengguna memilih rekening/kategori lalu menekan Simpan. Ini memberi manfaat yang sama pada iOS dan Android tanpa memberikan akses kotak masuk.
2. Validasi parser melalui daftar pengirim/template yang didukung (misalnya tiap e-wallet/bank), dengan tampilan _"perlu ditinjau"_ bila nilai atau tipe tidak pasti. Jangan memakai AI untuk membuat transaksi final tanpa konfirmasi.
3. Hanya bila penggunaan langkah 1 terbukti bernilai, tawarkan koneksi Gmail sebagai fitur opt-in terpisah. Hubungkan ke profil pengguna, bukan langsung ke household, karena satu inbox dapat berisi informasi yang tidak pantas dibagikan otomatis kepada anggota household lain.

## Implikasi Gmail

Untuk membaca isi notifikasi, `gmail.metadata` tidak cukup karena hanya memberi label dan header; mengambil body pesan memerlukan `gmail.readonly` atau `gmail.modify`. Keduanya adalah scope **restricted**. Scope yang sempit tetap tidak dapat membatasi Google OAuth hanya kepada sender tertentu; pembatasan sender/label harus ditegakkan aplikasi setelah memperoleh akses. [Format pesan Gmail](https://developers.google.com/workspace/gmail/api/reference/rest/v1/Format), [scope Gmail](https://developers.google.com/workspace/gmail/api/auth/scopes)

Pada aplikasi publik, scope restricted membutuhkan verifikasi OAuth. Bila data restricted diakses dari atau melalui server pihak ketiga, Google mensyaratkan security assessment tahunan. Google juga mengharuskan scope minimum, consent kontekstual, penyimpanan token aman, pencabutan token saat tidak diperlukan, privacy policy, dan penggunaan data hanya untuk fitur yang jelas bagi pengguna. Kelayakan use case keuangan ini untuk scope Gmail perlu dikonfirmasi saat proses verification; jangan berasumsi akan otomatis disetujui hanya karena ada fitur impor. [Kebijakan OAuth](https://developers.google.com/identity/protocols/oauth2/policies), [restricted scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification), [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), [kebijakan akses Gmail](https://developers.google.com/workspace/workspace-api-user-data-developer-policy)

## Rancangan teknis bila tahap koneksi Gmail disetujui

```text
Pengguna memberi consent -> Backend menyimpan refresh token terenkripsi
-> worker memindai histori query transaksi secara bertahap
-> Gmail History API mengambil email baru sejak cursor terakhir
-> parser menghasilkan kandidat -> pengguna meninjau dan menyimpan
-> endpoint transaksi yang ada melakukan validasi household, idempotency, audit
```

- OAuth dilakukan melalui browser sistem ke backend HTTPS; mobile tidak menyimpan client secret atau refresh token. Simpan refresh token terenkripsi per koneksi, dengan key yang dikelola terpisah; batasi akses runtime dan jangan masukkan body email/token ke log, audit, analytics, atau ekspor.
- Implementasi menyimpan hanya ID pesan Gmail, ID koneksi, `historyId`, cursor halaman, progres histori, kandidat hasil parser, dan kode error aman. Sistem mengambil metadata subjek/cuplikannya untuk parsing lalu tidak menyimpan salinan penuh isi email.
- Sediakan layar _Kelola koneksi_: status, daftar sender yang aktif, sinkronisasi manual, cabut akses, dan hapus data impor. Saat revoke/hapus akun, revoke token ke Google lalu hapus token, state sinkronisasi, dan data mentah/draf sesuai kebijakan retensi. Kegagalan token tidak boleh memengaruhi transaksi yang sudah disimpan.
- Draf hanya boleh terlihat oleh pembuatnya hingga dikonfirmasi. Setelah disimpan, gunakan endpoint transaksi saat ini agar membership, rekening/kategori satu household, `Idempotency-Key`, versioning, serta audit yang sudah ada tetap berlaku.

Implementasi pilot melakukan polling `history.list` setiap 15 menit setelah histori awal selesai. Cursor `historyId` yang kedaluwarsa (404) memulai pemindaian histori penuh kembali. `users.watch` dan Pub/Sub tetap opsi peningkatan bila latensi 15 menit tidak lagi memadai; notifikasi push harus tetap diproses dengan `history.list`, bukan dianggap detail transaksi. [Gmail push notifications](https://developers.google.com/workspace/gmail/api/guides/push), [sinkronisasi Gmail](https://developers.google.com/workspace/gmail/api/guides/sync)

Untuk pilot kecil, lebih sederhana gunakan tombol **Sinkronkan sekarang** atau polling server terbatas setelah consent, kemudian baru gunakan `watch` ketika kebutuhan otomatis benar-benar terbukti. Query Gmail dapat mempersempit pemindaian berdasarkan sender, tanggal, atau label, namun tetap perlu parser dan deduplikasi di sisi aplikasi. [Filtering Gmail](https://developers.google.com/workspace/gmail/api/guides/filtering)

## Kriteria penerimaan sebelum rilis

- Tidak ada transaksi yang tercatat otomatis tanpa konfirmasi pengguna, dan email yang ambigu menghasilkan draf/error yang jelas.
- Satu email yang diproses ulang hanya menghasilkan satu draf/transaksi; perubahan status refund atau pembatalan tidak menimpa transaksi awal diam-diam.
- Pengguna dapat cabut koneksi dan menghapus data impor; token dan isi email tidak muncul di log, crash report, atau backup yang tidak terenkripsi.
- Household B tidak dapat membaca draf, koneksi, maupun hasil impor milik pengguna/household A.
- Uji template nyata untuk tiap provider yang didukung, beserta nominal negatif/biaya, transfer antar rekening, refund, thread duplikat, token revoked, `historyId` 404, dan polling retry. Query generik saat ini bersifat konservatif; template provider belum dapat diklaim didukung sebelum corpus pengujian tersedia.

## Batas rekomendasi

Tidak merekomendasikan membaca notifikasi Android sebagai alternatif lintas platform: iOS tidak membuka notifikasi aplikasi lain untuk dibaca aplikasi pihak ketiga. Integrasi langsung ke bank/e-wallet mungkin lebih akurat bila tersedia melalui mitra yang berizin, tetapi bukan solusi generik MVP dan harus dinilai terpisah untuk cakupan provider, kontrak, biaya, consent, serta regulasi. Kesimpulan tentang variasi format dan semantik email di atas adalah inferensi desain dari sifat pesan email; perlu dibuktikan dengan corpus notifikasi yang pengguna izinkan untuk diuji.
