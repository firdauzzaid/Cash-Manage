# Instruksi Agen — Aplikasi Keuangan Rumah Tangga

## Konteks proyek

- Produk mobile untuk banyak keluarga, dengan Android dan iOS sejak awal.
- Household adalah ruang keuangan bersama. Pengguna memiliki akun sendiri dan akses melalui keanggotaan household.
- MVP mencakup keanggotaan, rekening, pemasukan, pengeluaran, transfer, anggaran, laporan, riwayat perubahan, dan ekspor.
- Seluruh rekening dan transaksi dalam household terlihat oleh anggotanya. Ruang pribadi terpisah berada di luar MVP.
- Arah teknis awal: React Native, Expo, TypeScript, backend Node.js terpisah, dan PostgreSQL langsung tanpa Supabase. Rincian pilihan ada di `docs/TECH-STACK.md`; perubahan stack harus didasarkan pada kebutuhan task dan dijelaskan.
- Gunakan Docker untuk backend dan PostgreSQL, serta Docker Compose untuk lingkungan lokal. Data database harus berada di volume persisten; startup container tidak boleh mereset atau melakukan destructive seed.
- Integrasi bank, OCR, AI, monetisasi, dan sinkronisasi transaksi offline berada di luar MVP kecuali diminta.

## Urutan kerja

1. Baca seluruh `AGENTS.md` yang berlaku sebelum bekerja, termasuk instruksi direktori turunan untuk file yang akan disentuh.
2. Untuk setiap pekerjaan software engineering, pilih skill Matt Pocock terpasang yang paling relevan dengan jenis task, baca seluruh `SKILL.md`, lalu ikuti workflow-nya. Muat hanya skill yang relevan.
3. Untuk pekerjaan kode, gunakan Ponytail sebagai standar analisis dependency dan dampak perubahan. Gunakan level `full` untuk perubahan behavior, business logic, data flow, permission, shared code, bug, atau refactor. Analisis perubahan trivial dapat proporsional.
4. Sebelum mengubah kode, petakan caller, test, fixture, konfigurasi, dan export yang terdampak, serta risiko bagi pengguna dan data.
5. Gunakan Graphify sebelum memahami atau mengubah kode/arsitektur existing yang non-trivial. Lengkapi dengan pembacaan source langsung jika konteks Graphify belum cukup. Proyek kosong atau perubahan dokumentasi saja tidak membutuhkan pembuatan graph.
6. Setelah satu logical change pada kode selesai, update Graphify sebelum handoff agar graph sesuai source terakhir.
7. Untuk UI/UX, gunakan skill Impeccable dan jalankan `<skill-base-dir>/scripts/impeccable context` satu kali per sesi dari root proyek, sesuai petunjuk `SKILL.md`. Gunakan launcher `.cmd` jika diperlukan di Windows. Baca panduan native Android/iOS yang relevan.

## Batas perubahan

1. Pilih solusi paling sederhana yang menyelesaikan requirement sepenuhnya.
2. Jaga scope. Jangan melakukan refactor, cleanup, improvement, atau inisiasi lain yang tidak diminta.
3. Pertahankan behavior existing. Jangan mengubah kontrak interface, URL/deep link, schema, permission, UX flow, default value, atau behavior di luar kebutuhan task.
4. Ikuti architecture, convention, komponen, utility, dan dependency existing sebelum membuat pola baru.
5. Jangan menambah dependency jika kebutuhan dapat diselesaikan dengan stack existing.
6. Berhenti ketika acceptance criteria terpenuhi. Jangan melanjutkan improvement setelah task selesai.

## Aturan keuangan dan household

1. Terapkan otorisasi di server/database untuk setiap operasi berdasarkan keanggotaan household. Filter UI atau `household_id` dari client bukan bukti akses. Uji isolasi antar keluarga, termasuk laporan, ekspor, subscription realtime, dan lampiran jika tersedia.
2. Keanggotaan, role, dan undangan hanya dapat diubah oleh pihak berwenang. Undangan harus diterima pengguna tujuan dan memiliki masa berlaku. Pencabutan keanggotaan menghentikan akses berikutnya, termasuk subscription aktif.
3. Gunakan satu mata uang per household pada MVP, dengan IDR sebagai pilihan awal. Simpan dan hitung nominal menggunakan integer satuan terkecil atau decimal yang tepat; hindari floating-point untuk uang.
4. Transfer antar rekening dalam household bukan pemasukan atau pengeluaran. Kedua sisi transfer harus tersimpan secara atomik; biaya transfer adalah pengeluaran terpisah.
5. Saldo awal bukan pendapatan periode berjalan. Bedakan saldo rekening, pemasukan, pengeluaran, dan arus kas pada perhitungan dan tampilan.
6. Validasi nominal, tanggal, jenis transaksi, kategori, dan kepemilikan rekening di server/database. Semua referensi transaksi harus berada dalam household yang sama.
7. Cegah transaksi ganda akibat retry atau tap berulang. Deteksi perubahan bersamaan agar koreksi pengguna tidak tertimpa diam-diam. Pertahankan isian dan tampilkan status yang jelas saat penyimpanan gagal.
8. Rekam pelaku dan waktu pembuatan, perubahan, serta penghapusan transaksi. Perubahan keanggotaan tidak boleh menghapus histori keuangan atau atribusi pencatat.
9. Saldo, anggaran, laporan, dan ekspor harus memakai aturan perhitungan yang sama. Bedakan pencatat transaksi dari rekening pembayar.
10. Jaga kredensial dan data finansial dari log, fixture, serta repository. Kunci server yang melewati otorisasi database tidak boleh berada dalam aplikasi mobile.

## Perbaikan bug

1. Temukan root cause, bukan hanya gejala.
2. Sebelum mengedit, telusuri seluruh caller, komponen bersama, handler, utility, query, test, dan alur lain yang menggunakan pola yang sama.
3. Perbaiki seluruh kasus yang memiliki root cause yang sama.
4. Laporkan kasus yang terlihat mirip tetapi memiliki behavior berbeda; jangan otomatis mengubahnya.
5. Tambahkan atau jalankan test yang membuktikan bug tidak muncul kembali.

## Perlindungan data dan database

Data existing tidak boleh dianggap disposable, termasuk database lokal.

Tanpa persetujuan eksplisit pengguna, jangan:

- reset atau recreate database;
- menjalankan database reset, `DROP DATABASE`, atau `DROP SCHEMA`;
- melakukan truncate atau delete massal;
- menghapus database Docker volume;
- menjalankan destructive seed;
- membuat destructive migration; atau
- mengubah migration lama yang sudah pernah digunakan di shared, staging, atau production environment.

Gunakan migration forward-only dan non-destructive secara default. Sebelum migration, seed, atau mutation data berisiko:

1. Verifikasi environment dan target database.
2. Pahami dampaknya terhadap data existing.
3. Pilih solusi non-destructive dan siapkan backup serta rencana pemulihan yang sesuai risikonya.

Jika satu-satunya solusi berisiko kehilangan data: berhenti sebelum operasi tersebut, jelaskan risiko, dan minta persetujuan eksplisit. Persetujuan yang sudah diberikan untuk operasi dan target yang sama tetap berlaku.

Deploy, build, startup, CI/CD, Dockerfile, entrypoint, dan post-deploy tidak boleh mengandung database reset.

## Validasi dan performa

Uji secara proporsional terhadap risiko perubahan. Logika non-trivial baru harus memiliki test kecil yang bermakna atau self-check. Perubahan dokumentasi atau perubahan trivial tidak membutuhkan test aplikasi.

Prioritaskan test untuk:

- business logic dan perhitungan uang;
- permission, akses anggota, dan isolasi antar household;
- mutation data, atomic transfer, retry, serta konflik perubahan;
- database migration;
- shared behavior; dan
- bug regression.

Untuk perubahan mobile, periksa Android dan iOS sesuai dampaknya, termasuk navigasi, input nominal, keyboard, aksesibilitas, serta kondisi loading, kosong, dan gagal. Laporkan platform yang belum diuji.

Jalankan check yang diwajibkan proyek. Jangan mengklaim sesuatu sudah tervalidasi jika belum benar-benar dijalankan atau diperiksa. Setelah check relevan lulus, ulangi atau perluas hanya jika ada perubahan baru, kegagalan, atau kekhawatiran yang belum terselesaikan.

Optimasi hanya jika relevan terhadap task atau bottleneck. Prioritasnya:

1. Hilangkan pekerjaan, query, request, atau render yang tidak diperlukan.
2. Optimalkan query dan hindari N+1.
3. Gunakan pagination untuk dataset besar.
4. Minimalkan payload dan deduplicate request.
5. Gunakan caching bila data sering dibaca dan invalidasinya jelas. Cache data keuangan harus mengikuti perubahan transaksi dan pencabutan akses.
6. Lazy-load komponen atau media berat dan optimalkan image.
7. Tambah database index berdasarkan access pattern nyata.
8. Gunakan memoization, code splitting, CDN, atau background job bila memang dibutuhkan dan sesuai platform.

Jangan mengorbankan simplicity demi micro-optimization.

## Klarifikasi dan konteks proyek

Minta klarifikasi hanya jika ambiguitas dapat mengubah hasil secara material, seperti business rule, permission, destructive operation, data interpretation, scope, atau behavior yang memiliki beberapa pilihan valid. Tentukan detail lain dari codebase, test, dokumentasi, design system, atau convention existing. Hormati keputusan dan otorisasi pengguna yang sudah diberikan.

Baca dokumentasi berdasarkan jenis perubahan, jika file sudah tersedia:

- Product atau business rule: `PRODUCT.md` dan `docs/PRD.md`.
- Architecture, dependency, integration, data, atau deployment: `docs/TECH-STACK.md` dan `docs/ARCHITECTURE.md`.
- UI/UX: `DESIGN.md` dan brief permukaan yang relevan.
- Database: schema, migration, dan dokumentasi deployment yang relevan.

Jika dokumentasi belum tersedia, gunakan keputusan pengguna dalam percakapan dan konteks proyek di atas. Laporkan kekurangan yang memengaruhi task; jangan mengarang isi dokumen atau membuat seluruh dokumentasi di luar scope. Jangan membaca seluruh dokumentasi tanpa alasan.

Jika Graphify, Impeccable, test, build, atau tool wajib tidak tersedia atau gagal:

1. Laporkan perintah dan error atau keterbatasan yang relevan.
2. Jangan mengklaim proses berhasil.
3. Jangan membuat hasil tiruan. Gunakan fallback hanya jika workflow skill mengizinkannya dan jelaskan keterbatasannya.
4. Jangan memasang tool pengganti tanpa kebutuhan atau otorisasi.
5. Selesaikan pekerjaan independen yang tetap dapat dilakukan. Nyatakan bagian yang belum dapat divalidasi atau memerlukan keputusan pengguna.

Jika dua aturan proyek bertentangan, gunakan urutan berikut, dengan tetap mengikuti instruksi sistem, developer, dan pengguna yang berlaku:

1. Keselamatan data.
2. Security dan permission.
3. Correctness.
4. Scope / acceptance criteria.
5. Existing behavior.
6. Existing architecture.
7. Regression prevention.
8. Testing.
9. Performance.
10. Cleanup / improvement.

## Handoff

Laporkan perubahan, alasan, validasi yang benar-benar dilakukan, serta batasan atau risiko yang tersisa. Gunakan bahasa Indonesia kecuali diminta lain.

Prinsip kerja: Understand → Trace → Change minimally → Protect data → Test → Validate → Stop.
