# Operasi Cash Flow

## Lingkungan dan kredensial

Compose memakai project `cash-flow`. Database development `cashflow` dan test `cashflow_test` memiliki volume berbeda. Seluruh port database dan Mailpit hanya terikat ke loopback. API memakai port 4310 untuk akses perangkat development. Compose ini untuk lokal; deployment publik memerlukan TLS/reverse proxy dan konfigurasi environment tersendiri.

`cashflow_admin` menjalankan migration. `cashflow_app` menjalankan aplikasi tanpa hak DDL. Audit hanya dapat dibaca/ditambahkan oleh role runtime. File `.env` diabaikan Git; `scripts/setup-env.mjs` mempertahankan file yang sudah ada. Jangan mengubah password env pada database existing tanpa rotasi role yang terencana: init script hanya berjalan ketika volume benar-benar baru.

`NODE_ENV=development` ditetapkan eksplisit dalam Compose lokal. Untuk produksi gunakan `NODE_ENV=production`, URL HTTPS, trusted origins spesifik, SMTP nyata, secret berbeda, batas koneksi yang sesuai, dan image yang sudah diperiksa. Origin `exp://**` hanya dipercaya dalam development. Server tidak mempercayai header IP dari client: IP autentikasi berasal dari koneksi Fastify. Konfigurasi proxy tepercaya harus ditinjau bila memakai ingress; jangan mengaktifkan trust proxy sembarang.

## Migration dan startup

```powershell
docker compose run --rm migrate
docker compose up -d api
```

Job menampilkan host/port/nama database tanpa password, memakai advisory lock migration dan urutan migration. Startup API hanya memeriksa readiness; tidak menjalankan migration atau seed. Migration lama yang sudah diterapkan dipertahankan. Perubahan schema berikutnya memakai file baru. SQL auth awal dihasilkan dari Better Auth 1.7.11 melalui `scripts/generate-auth.ts`, bukan schema password buatan sendiri.

## Backup dan pemulihan

```powershell
node scripts/backup.mjs
node scripts/backup.mjs --verify-restore
```

Target tetap adalah service `db` proyek ini dan database `cashflow`. Archive `pg_dump -Fc` ditulis ke `backups/`, diabaikan Git. Mode verifikasi membuat database **baru** `cashflow_restore_<timestamp>`, melakukan restore, dan menampilkan jumlah household/transaksi/user. Database hasil restore dibiarkan untuk inspeksi; tidak ada drop otomatis. Tidak ada restore yang menimpa database existing.

Archive lokal belum dienkripsi dan bukan backup produksi. Sebelum publik, tetapkan enkripsi, penyimpanan di luar host, akses terbatas, retensi, jadwal, RPO/RTO, serta prosedur restore dan penghapusan dalam backup. Jangan menyimpan dump dalam repository atau membagikannya sebagai lampiran umum.

## Penghapusan akun

Pemilik harus mengalihkan kepemilikan atau menonaktifkan household terlebih dahulu. Endpoint meminta konfirmasi password melalui Better Auth dan menyimpan permintaan durable. Akses domain langsung diblokir setelah diterima. API memproses batch setiap 30 detik; job `docker compose run --rm maintenance` dapat memproses antrean yang sama secara manual.

Worker menggunakan row lock profil dan household, lalu dalam satu transaksi PostgreSQL: mencabut keanggotaan, mengganti nama profil menjadi `Pengguna dihapus`, melepas identitas login, menghapus auth user beserta credentials/session melalui FK cascade, membersihkan verification terkait, dan menyelesaikan request. Tidak ada penghapusan catatan transaksi bersama. Kegagalan rollback dan dicoba kembali; error yang disimpan berupa kode, bukan data pribadi. Nama/email login dan credentials dihapus; catatan bebas/ekspor terdahulu tetap merupakan data bersama sesuai keputusan pengguna.

Halaman `/account-deletion` menjelaskan langkah di aplikasi. Halaman ini belum merupakan kebijakan privasi final: kontak dukungan publik dan retensi backup harus ditetapkan sebelum distribusi toko aplikasi. Nonaktif household saat ini berupa soft delete; belum ada jadwal purge permanen.

## Observabilitas dan batas operasi

Readiness: `/health/ready`, liveness: `/health/live`. Request body, cookie, token pada URL verifikasi, dan nominal keuangan tidak dicetak dalam access log. Error domain mengembalikan kode stabil dan pesan pengguna. Log kegagalan internal hanya mencetak kode. Jangan mengaktifkan logging header/body/token di proxy atau SMTP.

Auth rate limit memakai PostgreSQL. Domain rate limit masih per proses Fastify; jalankan satu replica pada pilot dan tetapkan kebijakan ingress/global sebelum menambah replica. Perubahan antar perangkat memakai polling query aktif setiap 15 detik, refetch foreground/reconnect; belum memakai revision-only polling atau push. CSV dibatasi 50.000 baris dan ditangani dalam memori; batasi periode jika melampaui batas.

Lakukan pemeriksaan advisori dependency lagi sebelum setiap rilis. `npm audit` tidak boleh dianggap bersih hanya karena build berhasil. Advisori tanpa patch pada tooling Expo dicatat dalam status implementasi; jangan memakai `audit fix --force` yang merusak pasangan SDK secara otomatis.
