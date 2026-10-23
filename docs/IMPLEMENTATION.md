# Status implementasi Cash Flow

20 Oktober 2026 · MVP lokal/pilot teknis. PostgreSQL langsung, tanpa Supabase. Source mobile Android/iOS tersedia; belum ada APK/IPA yang ditandatangani atau rilis toko aplikasi.

## Fitur yang tersedia

- Daftar/login email-password, verifikasi, kirim ulang verifikasi, reset password, logout, session native melalui SecureStore.
- Banyak keluarga per pengguna; satu konteks aktif; owner/member; undangan terikat email 7 hari; pencabutan akses; alih kepemilikan; keluar/nonaktif keluarga.
- Rekening dengan saldo awal/tanggal, kategori income/expense, koreksi dan arsip master data.
- Pemasukan, pengeluaran, transfer dan biaya sebagai satu kejadian atomik; koreksi versi; soft delete; audit pelaku/waktu.
- Saldo, arus kas, kategori, anggaran bulanan, filter/pagination, penelusuran transaksi dari kategori, ekspor CSV.
- Tema Ruang Bersama terang/gelap, empat tab, modal transaksi, pemilih native, tanggal platform, status simpan dan retry.
- Penghapusan akun durable: credentials/session dihapus, histori bersama dipertahankan dengan pencatat `Pengguna dihapus`.
- Docker API non-root, PostgreSQL persisten, migrasi eksplisit forward-only, database test terpisah, inbox email lokal.

## Pemeriksaan yang telah dijalankan

| Pemeriksaan | Bukti / cakupan |
| --- | --- |
| TypeScript | `npm run typecheck`, API + mobile + shared contracts |
| Backend | 13 pemeriksaan `node:test`, termasuk suite PostgreSQL nyata, tanpa reset database |
| Kompatibilitas Expo | `expo-doctor apps/mobile`: 20/20 |
| Bundle | `expo export --platform all`: Android, iOS, dan browser; bukan kompilasi binary native |
| Docker build | Multi-stage build berhasil, dependency runtime backend 125 audited packages dan 0 advisori pada snapshot pemeriksaan |
| SQL migration | 000–003 diterapkan pada development/test; run berikutnya no-op |
| UI browser | Pendaftaran/verifikasi/login, keluarga/rekening, pengeluaran/CSV, respons simpan terputus + retry tanpa duplikasi, dua household dan profil tanpa keluarga aktif; API sungguhan |
| Backup/restore | Dump PostgreSQL dipulihkan ke database baru `cashflow_restore_20261020070944730`; snapshot 3 household, 3 transaksi, 6 user terverifikasi |
| Persistensi/recovery | Recreate container `db` mempertahankan volume dan jumlah record snapshot; API kembali ready |
| Format | `npm run format:check` |

Backend memeriksa isolasi read/write antar keluarga, referensi lintas tenant, saldo awal bukan income, transfer/fee tepat, idempotency bersamaan, payload berbeda, konflik versi, soft delete, anggaran/CSV/audit, email undangan salah/expired/revoked, owner invariant, pencabutan sesi lewat reset/logout, serta penghapusan akun dan atribusi historis. Test menghasilkan data acak baru dan mempertahankan data run sebelumnya.

Regresi navigasi dikunci dalam alur UI: gateway `/` dan beranda `/home` memiliki path berbeda agar perubahan guard household tidak memicu siklus redirect. Respons transaksi yang diputus setelah commit diuji dengan retry kunci yang sama; saldo tetap Rp974.000 dan tidak terpotong dua kali.

Capture `.impeccable/review/web-*.png` adalah React Native Web dengan data **QA**, bukan screenshot Android/iOS. Label dan kontrol berasal dari kode native; mockup PNG tidak dijadikan layar aplikasi. Angka QA bukan data pengguna atau hasil koneksi bank.

## Implementasi yang lebih sederhana dari rancangan awal

- Query aktif dipoll setiap 15 detik saat foreground, dengan refetch ketika kembali aktif/reconnect. Revision disimpan atomik tetapi belum dipakai untuk polling metadata saja.
- API dan worker penghapusan memakai PostgreSQL yang sama, sehingga penghilangan auth/profil dapat dilakukan dalam satu transaksi, dengan antrean durable untuk retry.
- Ringkasan laporan menampilkan seluruh keluarga per periode. Filter rekening/kategori/jenis/pencatat/catatan diterapkan pada daftar transaksi dan CSV; teks layar menjelaskan cakupan ringkasan.
- OpenAPI dihasilkan dari route Fastify dan envelope request; rincian validasi domain ada pada shared types, handler, dan pengujian, belum seluruhnya diterjemahkan menjadi JSON Schema field-level/OpenAPI.
- Tidak menambah ORM, Redis, broker, bank sync, OCR, AI, push, atau database keuangan offline. Formulir/draft dan cache keuangan hanya dalam memori; draft tidak bertahan setelah aplikasi dimatikan paksa.

## Gate sebelum publik

1. Uji binary nyata Android/iOS: login/session SecureStore, deep link verifikasi/reset, keyboard, date picker, back gesture, share sheet, font besar, TalkBack/VoiceOver, kehilangan jaringan, pencabutan akses, dan light/dark. Mesin kerja Windows ini belum memiliki Android SDK/emulator; simulator iOS memerlukan macOS. Bundle dan browser tidak memvalidasi hal-hal tersebut.
2. Lengkapi domain HTTPS, hosting, application ID final, SMTP produksi, kontak dukungan, privacy policy, dan kebijakan retensi/purge/backup. Halaman `/account-deletion` saat ini menjelaskan cara mengajukan penghapusan dari aplikasi.
3. Jadwal backup terenkripsi di luar host, uji pemulihan terjadwal, target RPO/RTO, monitoring, rate limit global bila menambah replica, dan benchmark dataset pilot.
4. Tinjau advisori tooling Expo sebelum build/distribusi. Snapshot `npm audit` root masih melaporkan 20 high (termasuk rantai dampak) dari `braces <=3.0.3` dan `node-forge <=1.4.0`; registry belum menyediakan versi patch yang lebih baru saat diperiksa. Rantai ini berada pada tooling Metro/Expo, dikeluarkan dari image backend. Jangan menganggap root audit bersih. Nodemailer telah diperbarui, UUID xcode memakai versi CJS 11.1.1, dan React dipin sesuai pasangan SDK.

Panduan menjalankan ada pada [README](../README.md), prosedur migration/backup/penghapusan pada [operasi](OPERATIONS.md). Status ini mencatat verifikasi yang benar-benar dijalankan dan tidak menyatakan aplikasi siap produksi.
