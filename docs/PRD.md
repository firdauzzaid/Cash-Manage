# Product Requirements Document — Cash Flow

Versi 0.2 · 20 Oktober 2026 · Requirement MVP; [status implementasi dan pemeriksaan](IMPLEMENTATION.md) dicatat terpisah.

## 1. Tujuan dan status keputusan

Keluarga membutuhkan satu catatan keuangan yang dapat digunakan bersama tanpa menggabungkan login atau menyusun ulang rekap dari chat. Produk membantu menjawab: berapa saldo tercatat, berapa pemasukan/pengeluaran bulan ini, dan kategori mana yang mendekati batas anggaran.

Keputusan pengguna: produk untuk banyak keluarga; Android dan iOS sejak awal; Cash Flow sebagai nama kerja; PostgreSQL langsung tanpa Supabase; menggunakan Docker; arah visual C — Ruang Bersama. Pengguna menyetujui bahwa penghapusan akun mempertahankan catatan bersama dengan pencatat “Pengguna dihapus”. Cakupan MVP mengikuti proposal awal yang diterima dan [AGENTS.md](../AGENTS.md).

Detail berikut adalah **baseline implementasi** yang diteruskan setelah persetujuan pengguna. Daftar ini merupakan requirement, bukan klaim bahwa semua acceptance criteria perangkat sudah tervalidasi:

| ID | Baseline |
| --- | --- |
| D-01 | Seorang pengguna dapat menjadi anggota beberapa household; satu household dipilih sebagai konteks aktif di aplikasi. Data tidak digabung antar household. |
| D-02 | Dua role: owner dan member. Keduanya boleh mengoreksi seluruh data keuangan bersama; administrasi anggota hanya owner. |
| D-03 | Login email/password, email terverifikasi, undangan terikat email tujuan dan berlaku 7 hari. |
| D-04 | Household MVP menggunakan IDR tanpa pecahan rupiah. Zona waktu dipilih saat membuat household; default usulan Asia/Jakarta, bukan mengikuti timezone server. |
| D-05 | Periode anggaran adalah bulan kalender. Tidak ada rollover atau periode mengikuti tanggal gajian. |
| D-06 | Pembaruan antar perangkat melalui polling metadata setiap 15 detik saat foreground, serta refresh ketika aplikasi kembali aktif. |
| D-07 | Batas nominal setiap transaksi, biaya, saldo awal absolut, dan anggaran adalah Rp1.000.000.000.000; total laporan dapat melebihi batas per item. |

## 2. Pengguna dan pekerjaan utama

| Pengguna | Kebutuhan |
| --- | --- |
| Pengguna baru | Mulai mencatat sendiri, atau menerima undangan keluarga |
| Owner | Mengelola ruang bersama, anggota, dan perpindahan kepemilikan |
| Member | Mencatat transaksi dan memahami kondisi keuangan bersama |

Pencatat transaksi tidak selalu orang yang melakukan pembayaran. Aplikasi tidak menebak pembayar dari identitas login.

## 3. Scope MVP

| ID | Kebutuhan | Acceptance criteria utama |
| --- | --- | --- |
| F-01 | Akun | Daftar, verifikasi email, login, logout, pemulihan password, dan pengajuan penghapusan akun tersedia. Session dicabut saat logout. |
| F-02 | Household | Pengguna membuat ruang, memilih konteks aktif, dan melihat nama household di layar keuangan. Membuat household sekaligus menetapkan satu owner. |
| F-03 | Keanggotaan | Owner mengundang email tertentu; penerima login dengan email terverifikasi yang cocok. Undangan kedaluwarsa/dicabut tidak dapat digunakan. |
| F-04 | Rekening | Tambah bank/tunai/e-wallet, nama, saldo awal, tanggal mulai pencatatan; edit dan arsipkan. Saldo negatif diperbolehkan dengan penjelasan. |
| F-05 | Transaksi | Tambah, detail, koreksi, dan hapus pemasukan/pengeluaran/transfer. Tanggal, nominal, rekening, dan kategori yang sesuai wajib valid. |
| F-06 | Kategori | Kategori awal disediakan per household. Anggota dapat menambah, mengganti nama, dan mengarsipkan; kategori historis tetap dapat dibaca. |
| F-07 | Anggaran | Satu batas per kategori pengeluaran per bulan. Tampilkan terpakai, sisa, dan status melewati anggaran. |
| F-08 | Ringkasan | Tampilkan saldo saat ini terpisah dari pemasukan, pengeluaran, dan arus kas periode. Angka mengikuti aturan B-01 sampai B-12. |
| F-09 | Riwayat dan pencarian | Filter periode, jenis, rekening, kategori, dan pencatat; pencarian catatan/nama kategori; hasil dipaginasi. |
| F-10 | Kolaborasi | Perangkat lain memperoleh pembaruan sesuai D-06. Identitas pencatat dan pengubah terakhir terlihat. Konflik koreksi tidak ditimpa diam-diam. |
| F-11 | Ekspor | Ekspor CSV sesuai filter, termasuk identitas household, jenis, rekening asal/tujuan, biaya, dan penjelasan efek transaksi. |
| F-12 | Riwayat perubahan | Tersedia pelaku, waktu, dan perubahan nilai penting. Penghapusan transaksi tidak menghapus jejak audit. |

Bukan MVP: ruang pribadi terpisah, koneksi bank, saldo aktual bank, OCR/struk, AI, utang/piutang, kartu kredit, investasi, multi-currency, split bill, approval transaksi, push notification, transaksi berulang, target tabungan, dan offline sync.

## 4. Permission

Semua permission membutuhkan akun aktif, email terverifikasi, dan keanggotaan aktif di household terkait, kecuali proses onboarding atau undangan milik penerima.

| Operasi | Owner | Member | Nonanggota |
| --- | --- | --- | --- |
| Membaca data keuangan, audit keuangan, dan ekspor | Ya | Ya | Tidak |
| Menambah/mengoreksi/menghapus transaksi bersama | Ya | Ya | Tidak |
| Mengelola rekening, kategori, dan anggaran | Ya | Ya | Tidak |
| Mengubah nama household | Ya | Tidak | Tidak |
| Mengundang, mencabut undangan, mengeluarkan member | Ya | Tidak | Tidak |
| Membaca email undangan dan audit administrasi | Ya | Tidak | Tidak |
| Mengalihkan kepemilikan | Ya, ke member aktif | Tidak | Tidak |
| Keluar dari household | Setelah transfer kepemilikan | Ya | Tidak berlaku |
| Menghapus household | Ya, konfirmasi eksplisit | Tidak | Tidak |

Household aktif memiliki tepat satu owner. Anggota yang keluar dapat diundang kembali. Penggantian owner, keluar, dan penghapusan akun tidak boleh menghasilkan household aktif tanpa owner.

## 5. Business rule

| ID | Aturan |
| --- | --- |
| B-01 | Semua rekening dalam household adalah catatan bersama. Undangan menjelaskan bahwa anggota dapat membaca, mengekspor, serta mengoreksi catatan keuangan yang sudah ada. |
| B-02 | Pemasukan menambah rekening; pengeluaran mengurangi rekening. Nominal utama selalu positif; jenis transaksi menentukan arah. |
| B-03 | Transfer hanya antar rekening berbeda dalam household yang sama. Nominal pokok tidak memengaruhi total pemasukan/pengeluaran. Biaya mengurangi rekening asal dan masuk pengeluaran. |
| B-04 | Saldo awal tidak masuk pemasukan. Saldo awal dan tanggal awal dapat dikoreksi dengan version check dan audit; tanggal tidak boleh melewati transaksi paling awal rekening. |
| B-05 | Tanggal transaksi berupa tanggal lokal household, tidak boleh sebelum tanggal awal rekening atau setelah tanggal hari ini di household. Transaksi mendatang bukan fitur tagihan. |
| B-06 | Penghapusan transaksi membatalkan efek finansialnya, tetap menyimpan audit, dan diperlakukan sebagai soft delete. Tidak ada tombol hapus permanen atau restore transaksi di MVP. |
| B-07 | Arsip tidak menghapus histori. Rekening diarsipkan tetap masuk total saldo; tidak dapat dipilih untuk transaksi baru. Koreksi historis boleh mempertahankan referensi arsip, tetapi referensi pengganti harus aktif. |
| B-08 | Kategori bertipe pemasukan atau pengeluaran, dan jenisnya tidak dapat diubah. Transfer tidak mempunyai kategori pokok; biaya wajib punya kategori pengeluaran jika nilainya lebih dari nol. |
| B-09 | Anggaran hanya untuk kategori pengeluaran. Pengeluaran biaya transfer ikut anggaran kategori biaya. Nilai sisa negatif ditampilkan apa adanya. |
| B-10 | Retry dengan kunci dan payload sama menghasilkan satu mutation. Kunci sama dengan payload berbeda ditolak. Edit/hapus memerlukan versi terakhir. |
| B-11 | Periode laporan menggunakan tanggal transaksi, dengan batas awal inklusif dan akhir eksklusif. Waktu audit disimpan sebagai waktu absolut dan ditampilkan dalam zona household. |
| B-12 | Saldo saat ini menghitung semua transaksi valid sampai hari ini; bukan saldo pada akhir periode filter. Arus kas periode = pemasukan periode − pengeluaran periode. |

Contoh: saldo awal bank Rp5.000.000 dan e-wallet Rp0. Pindahkan Rp500.000 dengan biaya Rp2.500. Saldo bank menjadi Rp4.497.500, e-wallet Rp500.000, pengeluaran Rp2.500, dan pemasukan Rp0. Angka ini wajib sama di dashboard, laporan, dan ekspor.

## 6. Alur utama

1. Daftar → verifikasi email → buat household atau buka undangan.
2. Buat household → pilih zona waktu → tambah rekening dan saldo awal → beranda.
3. Tambah transaksi → validasi → simpan → tampilkan hasil terkonfirmasi dan perbarui ringkasan.
4. Owner membagikan tautan undangan → penerima login/verifikasi → melihat cakupan berbagi → menerima → household tersedia.
5. Tinjau anggaran/laporan → buka kategori → telusuri transaksi penyusunnya.

Undangan tidak harus dikirim otomatis melalui email pada MVP: owner dapat membagikan tautan melalui share sheet. Mengetahui URL/ID undangan saja tidak memberikan akses; kecocokan email terverifikasi tetap wajib.

## 7. Kondisi gagal dan akses

- Tidak ada internet sebelum simpan: beri penjelasan, pertahankan formulir dalam memori. Jangan mengklaim sudah tersimpan.
- Timeout sesudah request dikirim: status hasil belum diketahui; retry dengan kunci yang sama sampai hasil terkonfirmasi.
- Session berakhir: minta login ulang sebelum mengirim kembali formulir; jangan kirim mutation sebagai pengguna lain.
- Versi konflik: tampilkan data server dan isian pengguna untuk dibandingkan; tawarkan memuat ulang atau mengajukan ulang dengan versi baru setelah ditinjau.
- Akses dicabut: request berikutnya ditolak; hentikan polling, bersihkan cache household dan draft, lalu pindah ke pemilih household.
- Data yang sudah diunduh atau diekspor tidak dapat ditarik kembali dari perangkat lain. Tidak menjanjikan penghapusan jarak jauh ketika perangkat offline.
- Laporan kosong: tampilkan nol hanya setelah pembacaan sukses. Kegagalan memuat tidak boleh ditampilkan sebagai saldo nol.

## 8. Privasi dan lifecycle

Pengguna bisa mengajukan penghapusan akun dari aplikasi. Owner memilih alih kepemilikan atau penghapusan household yang dikelolanya; jangan menghapus catatan keluarga lain hanya karena pencatatnya keluar.

Desain memisahkan identitas login dari atribusi historis, sehingga akun dapat dihapus dan atribusi dibaca sebagai “Pengguna dihapus”. Penghapusan household memerlukan konfirmasi nama household dan penjelasan dampak kepada anggota.

Kebijakan final tentang retensi catatan bersama, audit, backup, penghilangan data pribadi dalam catatan bebas, dan tenggat pemrosesan penghapusan harus disahkan sebelum peluncuran publik. Rancangan ini tidak mengklaim pemenuhan kewajiban hukum tertentu. Sediakan halaman publik permintaan penghapusan akun dan privacy policy sebagai bagian rilis, bukan portal web penuh.

## 9. Target kualitas dan pengukuran

Target berikut adalah hipotesis yang akan diukur, bukan hasil benchmark:

- Pengguna pilot dapat menyelesaikan transaksi rutin dalam 15 detik setelah rekening/kategori tersedia.
- Endpoint baca/tulis umum ditargetkan p95 < 1 detik pada server dengan dataset pilot yang disepakati; waktu jaringan seluler dilaporkan terpisah.
- Perubahan muncul pada perangkat aktif lain dalam satu interval polling ditambah latensi request pada koneksi sehat.
- Tidak ada perbedaan perhitungan antara transaksi sumber, ringkasan, anggaran, dan ekspor pada skenario pengujian.
- Pilot mengukur keberhasilan onboarding, frekuensi pencatatan bersama, kegagalan simpan, dan kesalahan yang dilaporkan tanpa merekam isi keuangan sebagai analytics.

## 10. Skenario verifikasi wajib

| ID | Bukti yang harus tersedia sebelum rilis |
| --- | --- |
| AC-01 | Pengguna household A gagal membaca/mengubah ID rekening, transaksi, laporan, audit, dan ekspor household B. |
| AC-02 | Transfer contoh pada bagian 5 menghasilkan angka yang tepat; kegagalan di tengah operasi tidak menyimpan sebagian efek. |
| AC-03 | Dua request bersamaan dengan kunci sama membuat satu transaksi; payload berbeda mendapat konflik. |
| AC-04 | Dua anggota mengedit versi yang sama: hanya satu berhasil, yang lain menerima konflik tanpa kehilangan isian. |
| AC-05 | Retry setelah respons terputus menemukan hasil mutation yang sudah commit. |
| AC-06 | Penghapusan transaksi memperbarui saldo/anggaran dan meninggalkan audit dalam commit yang sama. |
| AC-07 | Dua proses transfer owner/keluar/pencabutan tidak meninggalkan household aktif tanpa owner. |
| AC-08 | Undangan email salah, kedaluwarsa, dicabut, atau diterima bersamaan tidak memberikan akses yang salah. |
| AC-09 | Login, verifikasi email, reset password, logout, dan deep link lulus di Android dan iOS. |
| AC-10 | Formulir tetap terbaca pada font besar, keyboard terbuka, screen reader, light mode, dan dark mode. |
| AC-11 | Restart/recreate container mempertahankan data database. Backup berhasil dipulihkan pada database terpisah. |
| AC-12 | Penghapusan akun dapat diajukan dan diproses ulang setelah kegagalan tanpa merusak histori household lain. |

## 11. Urutan implementasi dan release gate

1. Scaffold mobile/backend, Docker Compose, PostgreSQL, migrasi awal, serta health check.
2. Autentikasi, profil, household, undangan, dan pengujian permission.
3. Rekening/kategori, transaksi atomik, idempotency, version check, dan audit.
4. Ringkasan, anggaran, filter, ekspor, serta polling antar perangkat.
5. Penghapusan akun, privacy policy, operasi backup/restore, pengujian dua platform, lalu pilot.

Sebelum implementasi: tinjau baseline D-01–D-07 dan rancangan UI/UX. Sebelum rilis publik: tetapkan domain/aplikasi ID, penyedia SMTP/hosting, versi minimum OS yang kompatibel, kebijakan retensi, kapasitas pilot, target pemulihan, dan bukti seluruh acceptance criteria. Tidak perlu memutuskan monetisasi untuk membangun MVP.

## 12. Referensi

Perencanaan lifecycle akun mempertimbangkan [panduan penghapusan akun Apple](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion) dan [persyaratan penghapusan akun Google Play](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en), diperiksa 20 Oktober 2026. Periksa ulang persyaratan distribusi ketika akan merilis.
