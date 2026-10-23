# Paket Desain — Ruang Bersama

20 Oktober 2026 · Arah C dipilih pengguna · Implementasi React Native tersedia; review native menunggu recapture.

## Keputusan dan scope

Pengguna memilih **C — Ruang Bersama** melalui jawaban terstruktur. Referensi utamanya adalah [Beranda terpilih](../../.impeccable/mocks/decision/ruang-bersama.png), dengan persetujuan tersimpan pada [sidecar referensi](../../.impeccable/mocks/decision/ruang-bersama.json). Pilihan ini tidak perlu ditanyakan ulang.

Tujuan desain: pasangan memahami saldo serta aktivitas keluarga dan dapat mencatat transaksi dengan sedikit langkah. Mode: Operate. Gaya visual mengikuti kartu lapang, background hangat, aksen teal, font sistem, dan identitas anggota yang terlihat. Logo dan nama komersial final bukan bagian keputusan ini.

Token dan prinsip visual berada pada [DESIGN.md](../../DESIGN.md). Alur serta aturan field mengikuti [UI/UX](../UI-UX.md), business rule mengikuti [PRD](../PRD.md). Nilai token adalah baseline implementasi, bukan klaim hasil sampling pixel.

## Layar untuk ditinjau

Buka [pratinjau](preview.html?variant=C) untuk berpindah layar/kondisi melalui pemilih dan panah. Gambar bukan aplikasi berjalan; tombol di dalam gambar belum melakukan tindakan.

| Layar / kondisi | Mockup | Prompt lengkap | Status |
| --- | --- | --- | --- |
| Beranda terang | [PNG](../../.impeccable/mocks/decision/ruang-bersama.png) | [JSON](../../.impeccable/mocks/decision/ruang-bersama.json) | Referensi pilihan pengguna |
| Tambah pengeluaran | [PNG](../../.impeccable/mocks/ruang-bersama/pengeluaran-v2.png) | [JSON](../../.impeccable/mocks/ruang-bersama/pengeluaran-v2.json) | Rancangan turunan |
| Transfer dan biaya | [PNG](../../.impeccable/mocks/ruang-bersama/transfer.png) | [JSON](../../.impeccable/mocks/ruang-bersama/transfer.json) | Rancangan turunan |
| Daftar transaksi | [PNG](../../.impeccable/mocks/ruang-bersama/transaksi.png) | [JSON](../../.impeccable/mocks/ruang-bersama/transaksi.json) | Rancangan turunan |
| Anggaran | [PNG](../../.impeccable/mocks/ruang-bersama/anggaran.png) | [JSON](../../.impeccable/mocks/ruang-bersama/anggaran.json) | Rancangan turunan |
| Beranda gelap | [PNG](../../.impeccable/mocks/ruang-bersama/beranda-gelap.png) | [JSON](../../.impeccable/mocks/ruang-bersama/beranda-gelap.json) | Contoh tema gelap |
| Pengeluaran offline | [PNG](../../.impeccable/mocks/ruang-bersama/pengeluaran-offline.png) | [JSON](../../.impeccable/mocks/ruang-bersama/pengeluaran-offline.json) | Contoh gagal sebelum submit |

Semua mockup dibuat dengan imagegen bawaan menggunakan referensi visual yang dipilih pengguna; tidak menggunakan CLI/API fallback. Prompt persis dan sumber output disimpan dalam JSON serta metadata PNG. Pengeluaran versi awal dipertahankan sebagai referensi edit; gunakan pengeluaran-v2 untuk implementasi karena atribusi pencatat tidak lagi mempunyai chevron.

## Struktur dan perilaku utama

| Layar | Fokus, struktur, dan interaksi yang harus dipertahankan |
| --- | --- |
| Beranda | Identitas keluarga → saldo saat ini dan rekening → arus kas bulanan → anggaran → aktivitas. Tambah adalah aksi tersendiri, bukan tab. |
| Pengeluaran | Formulir fokus tanpa tab bar. Nominal → rekening → kategori → tanggal → catatan → identitas pencatat read-only → simpan. Pemasukan mewarisi struktur dengan kategori dan arah yang sesuai. |
| Transfer | Pokok → asal/tujuan berbeda → tanggal → biaya/kategori biaya → catatan → dampak kedua rekening → simpan. Bukan eksekusi transfer bank. |
| Daftar transaksi | Bulan, pencarian/filter, ringkasan, lalu baris per tanggal. Satu transfer tetap satu kejadian dengan rincian biaya. Pencatat dilabeli terpisah dari rekening. |
| Anggaran | Terpakai total → kategori dan progress → sisa → kategori belum dianggarkan → tambah. Sisa anggaran tidak dilabeli uang bebas dibelanjakan. |

Pada iOS, pertahankan tab/stack/sheet, safe area, serta back gesture. Pada Android, terjemahkan pola ke kontrol Material, system Back, dan FAB sesuai konteks. PNG menggunakan artboard mirip iOS untuk membandingkan visual; tidak membuktikan hasil Android ataupun kelayakan ukuran sentuh.

## Dataset contoh

Saldo awal bank Rp5.000.000; gaji Rp8.000.000; belanja Rp325.000; transfer ke e-wallet Rp500.000 dengan biaya Rp2.500. Saldo bank Rp12.172.500, e-wallet Rp500.000, total Rp12.672.500. Pemasukan Rp8.000.000, pengeluaran Rp327.500, arus kas Rp7.672.500.

Daftar contoh berisi transfer dan belanja pada 12 Oktober serta gaji pada 1 Oktober. Formulir bertanggal 20 Oktober adalah draft ilustratif terpisah dan belum mengubah daftar/saldo. Budi mencatat gaji/transfer; Sari mencatat belanja. Identitas pencatat diisi dari session pada aplikasi, bukan dipilih lewat field.

Contoh anggaran: Belanja Rp1.500.000 dan Biaya Admin Rp50.000; total batas Rp1.550.000, terpakai Rp327.500, sisa Rp1.222.500. Progress Belanja 21,67% ditampilkan 22%; Biaya Admin 5%. Pembulatan persentase tidak mengubah nominal.

## State yang harus diterapkan

- Sebelum submit: field dapat diedit; isian tidak hilang saat validasi gagal.
- Menyimpan: status pada tombol dan proteksi tap paralel, tanpa menampilkan sukses sebelum konfirmasi.
- Offline sebelum submit: “Belum tersimpan”, penjelasan koneksi, field tetap ada di memori, dan “Coba lagi”. Tidak menjanjikan antrean offline atau draft permanen.
- Timeout setelah submit: gunakan “Hasil penyimpanan belum diketahui”, pertahankan payload/kunci, dan retry request yang sama. Jangan menyalin pesan offline sebelum submit karena kemungkinan commit berbeda.
- Konflik koreksi: tampilkan nilai terbaru dan isian pengguna; tinjau sebelum mengirim dengan versi baru. Tidak ada overwrite otomatis.
- Sukses: tutup formulir setelah respons, tampilkan konfirmasi, dan refresh daftar/ringkasan.
- Kehilangan akses: hentikan konteks household, bersihkan data terkait, dan kembali ke pemilih ruang.
- Empty/loading/error baca: bedakan data nol yang benar dari kegagalan memuat; jangan mengganti error dengan saldo Rp0.

Untuk layout keyboard, nominal besar, font besar, screen reader, dan state lain yang belum tergambar, ikuti dokumen UI/UX dan uji pada implementasi native. Tidak ada animasi saldo bergulir; transisi mengikuti OS dan preferensi pengurangan animasi.

## Verifikasi token dan batas bukti

Perhitungan kontras token menggunakan relative luminance sRGB. Pasangan berikut memenuhi ambang teks normal 4,5:1:

| Pasangan | Rasio |
| --- | --- |
| Light text / surface | 12,61:1 |
| Light secondary text / surface | 6,51:1 |
| Light button text / primary | 6,28:1 |
| Light income / surface | 5,33:1 |
| Light expense / surface | 5,75:1 |
| Warning text / warning surface | 5,54:1 |
| Dark text / dark surface | 13,49:1 |
| Dark secondary / dark surface | 8,02:1 |
| Dark button text / dark primary | 8,28:1 |
| Dark expense / dark surface | 8,82:1 |

Ini pemeriksaan nilai token, bukan pengukuran kontras seluruh pixel gambar. Source React Native menggunakan palette terang/gelap arah C, font sistem, safe area, empat tab, dan pemilih tanggal native. Native font scaling, ukuran target, semantik, keyboard, Back, dan VoiceOver/TalkBack belum diuji.

Implementasi layar inti, autentikasi, dan pengelolaan keluarga tersedia di `apps/mobile`; mockup tetap menjadi referensi desain dengan lingkup persetujuan semula. Formulir konflik kini hanya menawarkan pemuatan seluruh versi server sebelum koreksi ulang, sehingga isian lama tidak dapat dipaksakan menggunakan versi server baru.

Capture aktual React Native Web pada viewport 390 × 844 dengan data QA: [autentikasi](../../.impeccable/review/web-auth.png), [Beranda terang](../../.impeccable/review/web-home-light.png), [Beranda gelap](../../.impeccable/review/web-home-dark.png), dan [formulir transaksi](../../.impeccable/review/web-transaction.png). Ini bukti render browser, bukan screenshot emulator/simulator/perangkat native. Android SDK/emulator dan simulator iOS tidak tersedia; disposisi review native adalah **recapture**, belum ship.

Palette dan radius sumber mempertahankan arah C. Perbedaan ukuran source terhadap baseline (nominal, bobot label, gutter/padding kartu, dan padding tombol) dicatat di DESIGN.md dan belum diselaraskan. Dokumentasi ini tidak memperluas persetujuan visual atau mengubah token. Mockup sendiri tidak menjalankan backend, migration, container, atau uang nyata.
