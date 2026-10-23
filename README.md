# Cash Flow

Aplikasi pencatatan keuangan bersama untuk banyak keluarga, Android dan iOS. Implementasi MVP memakai Expo/React Native, Fastify, Better Auth, PostgreSQL langsung, dan Docker. Arah visual: **Ruang Bersama**.

Setiap anggota memakai akun sendiri. Rekening, pemasukan, pengeluaran, transfer dengan biaya, anggaran, laporan, dan audit dibagikan dalam keluarga. Owner mengelola undangan, anggota, dan kepemilikan. Penghapusan akun mempertahankan histori dengan nama **Pengguna dihapus**, sesuai keputusan pengguna.

## Menjalankan lokal

Prasyarat: Node.js 24, Docker Desktop dengan Linux containers. Di PowerShell gunakan `npm.cmd` jika execution policy memblokir `npm.ps1`.

```powershell
npm.cmd run setup
npm.cmd ci
npm.cmd run build
docker compose up -d db mailpit
docker compose build api
docker compose run --rm migrate
docker compose up -d api
npm.cmd run dev:mobile
```

`setup` membuat `.env` dengan secret acak hanya jika file belum ada. Database menggunakan named volume persisten. Migration dijalankan eksplisit, bukan saat startup API. Tidak ada reset, truncate, atau seed otomatis.

| Layanan | Alamat lokal |
| --- | --- |
| API/readiness | http://localhost:4310/health/ready |
| OpenAPI | http://localhost:4310/openapi.json |
| Inbox verifikasi/reset development | http://localhost:8027 |
| PostgreSQL development | `127.0.0.1:54387`, database `cashflow` |
| PostgreSQL test, profile `test` | `127.0.0.1:54388`, database `cashflow_test` |

Untuk ponsel fisik, ubah `EXPO_PUBLIC_API_URL` **dan** `BETTER_AUTH_URL` dalam `.env` ke alamat komputer yang dapat dijangkau ponsel, misalnya `http://192.168.1.10:4310`. Android emulator biasanya memakai `http://10.0.2.2:4310`. Recreate **hanya API** dengan `docker compose up -d --force-recreate api` setelah perubahan env; mulai ulang Expo. Jangan masukkan secret server ke variabel `EXPO_PUBLIC_*`. Expo Go membutuhkan versi yang mendukung SDK 58; build native memerlukan toolchain lokal atau EAS.

Daftar melalui aplikasi, buka email verifikasi di Mailpit, lalu masuk. Mailpit menyimpan email lokal dan tidak mengirim email ke penerima eksternal. Untuk produksi ganti SMTP, URL HTTPS, origins, application ID, dan pengaturan distribusi; lihat [operasi](docs/OPERATIONS.md).

## Pratinjau browser

```powershell
npm.cmd run export -w @cashflow/mobile
npm.cmd run preview
```

Buka http://localhost:8081. Ini menjalankan UI React Native Web untuk peninjauan lokal. Hasilnya tidak menggantikan pengujian Android/iOS. Data QA dari pengujian UI diberi nama **Keluarga QA · Data pengujian** dan memakai email acak `@cashflow.example`.

## Pemeriksaan

```powershell
docker compose --profile test up -d test-db
npm.cmd run migrate:test
npm.cmd run typecheck
npm.cmd test
npm.cmd run format:check
npm.cmd run export -w @cashflow/mobile
npm.cmd run test:ui
```

Integration test menolak target selain database `cashflow_test`, membuat identitas/data baru per run, dan tidak menghapus data lama. Test UI memakai API development dan Mailpit lokal, serta Chrome yang sudah terpasang. Atur `CHROME_PATH` jika lokasinya berbeda. Snapshot pemeriksaan dan batas validasi dicatat di [status implementasi](docs/IMPLEMENTATION.md).

## Struktur

- `apps/mobile`: layar native, autentikasi, pemilih keluarga, query cache dalam memori, polling foreground, formulir dan ekspor OS.
- `apps/api`: autentikasi, otorisasi keluarga, transaksi uang, laporan, dan pemrosesan penghapusan akun.
- `packages/contracts`: DTO, format rupiah dengan BigInt, validasi uang/tanggal bersama.
- `migrations`: SQL forward-only; schema auth dihasilkan dari Better Auth yang dipasang.
- `compose.yaml`, `Dockerfile`, `docker/`: lingkungan lokal dan image backend non-root.
- `tests/ui`: pengujian alur browser nyata, tanpa mock API.

Dokumen produk: [PRD](docs/PRD.md), [database](docs/DATABASE.md), [arsitektur](docs/ARCHITECTURE.md), [stack](docs/TECH-STACK.md), [UI/UX](docs/UI-UX.md), [desain](DESIGN.md), [glosarium](GLOSSARY.md).

Status: MVP untuk pengujian lokal/pilot teknis; belum merupakan rilis App Store/Play Store. Pemeriksaan native, kebijakan retensi/backup, domain produksi, SMTP, dan advisori tooling yang masih terbuka merupakan gate sebelum peluncuran publik.
# Cash-Manage
