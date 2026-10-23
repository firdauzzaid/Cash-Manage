# Tech Stack — Cash Flow

Versi 0.2 · 20 Oktober 2026 · Stack implementasi lokal; versi tepat dikunci pada `package-lock.json`.

Implementasi memakai Node 24, Expo SDK 58 / React Native 0.88 / React 19.3, Fastify 5, Better Auth dan adapter Expo 1.7.11, PostgreSQL 18, `pg`, node-pg-migrate, TanStack Query, serta modul native Expo. Source ada di `apps/` dan `packages/contracts/`. Docker image PostgreSQL/Node dipin digest. [Status pemeriksaan dan batas platform](IMPLEMENTATION.md) membedakan bundle dari pengujian perangkat.

## 1. Keputusan dan batas

Pengguna menetapkan PostgreSQL langsung tanpa Supabase, penggunaan Docker, dan Android/iOS sejak awal. React Native + Expo + TypeScript melanjutkan arah proposal awal. Tabel berikut menjelaskan peran stack; status pengujian aktual mengikuti dokumen implementasi. Test mobile pada tahap ini menggunakan Playwright untuk browser preview; Jest/React Native Testing Library dan pengujian perangkat belum dijalankan.

## 2. Stack yang direkomendasikan

| Area | Pilihan | Alasan / batas penggunaan |
| --- | --- | --- |
| Mobile | React Native + Expo + TypeScript strict | Satu codebase dengan perilaku native per OS |
| Navigasi | Expo Router | Route, stack, tab, dan deep link mengikuti ekosistem Expo |
| Kontrol UI | React Native core + kontrol/platform adapter dari Expo yang diperlukan | Gunakan kontrol native; belum memilih UI kit besar |
| Server state | TanStack Query | Cache memori, invalidasi, refetch, dan polling; key dipisah per pengguna/household |
| Form sederhana | React state dan komponen input proyek | Belum membutuhkan form framework global |
| Session mobile | Better Auth Expo adapter + expo-secure-store | Menangani session native melalui library, bukan penyimpanan token sembarang |
| Backend | Node.js LTS + Fastify + TypeScript | Satu proses backend modular dengan validasi schema dan structured logging |
| Autentikasi | Better Auth, email/password | Adapter PostgreSQL dan integrasi Fastify/Expo tersedia; konfigurasi tetap harus diverifikasi |
| Database | PostgreSQL 18 sebagai baseline major | Relasi, constraint, transaction, row lock, dan agregasi tepat; pin minor/security patch saat scaffold |
| Akses SQL | node-postgres (`pg`) | Query berparameter dan kontrol transaksi eksplisit; tidak menambah ORM pada MVP |
| Migration | node-pg-migrate | Migration terurut dan ditinjau, termasuk SQL schema auth; forward-only untuk environment berdata |
| Validasi | JSON Schema dari developer + validator bawaan Fastify | Tidak menerima schema dari pengguna; validasi server tetap sumber kebenaran |
| Dokumentasi interface | OpenAPI dari schema route melalui plugin Fastify yang kompatibel | Dibuat ketika handler ada, bukan kontrak otomatis yang diklaim sudah tersedia |
| Email | SMTP melalui adapter Nodemailer | Verifikasi/reset password; provider dan domain belum dipilih |
| Ekspor mobile | expo-file-system + expo-sharing | CSV sementara untuk dibagikan lewat mekanisme OS |
| Runtime dan deployment | Docker Engine/Desktop + Docker Compose | Backend dan PostgreSQL terpisah; volume persisten |
| Build mobile | EAS Build atau toolchain lokal yang sesuai | EAS direkomendasikan untuk build iOS dari tim yang bekerja di Windows; layanan ini bukan hosting backend |
| Test backend | node:test + Fastify inject + PostgreSQL test terpisah | Uji interface dan behavior database sungguhan |
| Test mobile | Jest Expo + React Native Testing Library | Alur formulir, error, permission, dan tampilan komponen |

Kegunaan dependency harus muncul saat fiturnya dibuat. Daftar ini bukan instruksi memasang semua paket sekaligus. Jangan menambah Redux, GraphQL, Redis, message broker, atau chart framework sebelum ada kebutuhan konkret.

## 3. Kebijakan versi dan kompatibilitas

1. Pilih Expo SDK stabil saat scaffolding, bukan canary/beta. Ikuti pasangan React/React Native yang didukung SDK, bukan memilih versi independen.
2. Pasang modul native memakai mekanisme kompatibilitas Expo. Pin dependency melalui lockfile dan gunakan install reproducible di CI/container.
3. Gunakan Node LTS yang masih didukung dan kompatibel dengan Expo/backend/library auth. Catat versi tepat pada konfigurasi repository ketika kode dibuat.
4. PostgreSQL 18 adalah major baseline, bukan klaim versi paling baru. Verifikasi dukungan host dan driver, lalu pin image minor/digest; upgrade major memerlukan rencana data.
5. Versioning Better Auth dan adapter Expo harus kompatibel. Generate schema dari versi yang benar-benar dipakai dan tinjau hasilnya sebelum apply.
6. Tentukan minimum Android/iOS dari matriks SDK dan kebutuhan pengguna pilot. Jangan menjanjikan minimum OS sebelum SDK dipilih.
7. Smoke test login, session cookie, reset link, share sheet, dan kontrol native pada kedua OS sebelum mengunci stack sebagai tervalidasi.

Dokumentasi upstream dapat berubah. Versi implementasi dikunci pada `package-lock.json`; ikuti matriks SDK saat upgrade dan jangan menyalin nomor “latest” secara independen.

## 4. Keamanan konfigurasi

Backend memakai secret terpisah per environment, termasuk koneksi database, secret autentikasi, SMTP, dan origin yang dipercaya. Nama env final mengikuti adapter yang dipakai; `.env.example` hanya memuat placeholder.

Mobile hanya menerima URL API publik, scheme/app ID, dan konfigurasi nonsecret. Variabel yang dibundel ke aplikasi tidak dapat dianggap rahasia. Kredensial PostgreSQL, SMTP, dan auth server tidak pernah berada di Expo public env atau image layer.

User DB runtime memiliki izin terbatas terhadap tabel yang dibutuhkan; migration memakai role terpisah. PostgreSQL berjalan pada network internal Docker. Backend memeriksa permission per household; penggunaan PostgreSQL tidak otomatis memberi autentikasi atau otorisasi aplikasi.

Rate limit auth memakai storage PostgreSQL melalui library; schema rate-limit ikut migration auth. Endpoint domain juga dibatasi pada ingress/API. Tentukan kebijakan rate limit lintas replica sebelum menambah replica; pembatas memori satu proses tidak cukup sebagai kebijakan global.

## 5. Rencana Docker

- `db`: official PostgreSQL image baseline 18, named volume persisten, health check, secret, tanpa port publik.
- `api`: multi-stage Dockerfile berbasis Node LTS yang dipin, non-root, health/readiness, pool koneksi terbatas.
- `migrate`: job eksplisit dari image backend dengan kredensial migration; bukan perintah startup API.
- `maintenance`: job terjadwal dari image backend untuk permintaan penghapusan dan housekeeping yang sudah diotorisasi; tidak membutuhkan queue platform terpisah.
- Pengembangan email dapat memakai inbox lokal bila diperlukan; bukan dependency production.

Compose tidak menggantikan backup, TLS, pengamanan host, atau upgrade database. Detail deployment/pemulihan ada di [Arsitektur](ARCHITECTURE.md).

## 6. Alasan memilih pendekatan ini

PostgreSQL memenuhi kebutuhan transaksi uang dan relasi household tanpa backend-as-a-service. Fastify memberi interface HTTP serta validasi yang cukup tanpa struktur framework yang besar. Better Auth dipilih agar credential/session tidak dirancang sendiri. SQL eksplisit membuat lock, agregasi saldo, dan integritas transfer mudah ditinjau.

Trade-off: tim bertanggung jawab atas deployment backend, patch keamanan, email, backup, session, dan monitoring. Docker memudahkan packaging, tetapi tidak menghilangkan pekerjaan operasi tersebut.

## 7. Referensi resmi

Pilihan di atas merupakan penilaian proyek; sumber berikut memverifikasi kemampuan teknologi, bukan bukti bahwa integrasinya telah diuji:

- [Expo SDK dan kompatibilitas paket](https://docs.expo.dev/versions/latest/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Node release lifecycle](https://nodejs.org/en/about/previous-releases)
- [Fastify validation/serialization](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/)
- [Better Auth PostgreSQL](https://better-auth.com/docs/adapters/postgresql)
- [Better Auth Expo](https://better-auth.com/docs/integrations/expo)
- [Better Auth database rate limiting](https://better-auth.com/docs/concepts/rate-limit)
- [TanStack Query React Native](https://tanstack.com/query/latest/docs/framework/react/react-native)
- [node-postgres](https://node-postgres.com/features/queries)
- [node-pg-migrate](https://salsita.github.io/node-pg-migrate/)
- [Docker volumes](https://docs.docker.com/engine/storage/volumes/)

Sumber diperiksa 20 Oktober 2026. Tidak ada biaya vendor, kapasitas, atau waktu build yang dijanjikan dalam rancangan ini.
