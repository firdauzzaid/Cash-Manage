# Eksplorasi visual Cash Flow

Status: pengguna memilih **C — Ruang Bersama** pada 20 Oktober 2026. Alternatif lain disimpan sebagai riwayat eksplorasi. Data sintetis mengikuti docs/UI-UX.md. Tidak ada backend atau data sungguhan.

Pertanyaan: struktur Beranda mana yang paling membantu pasangan membaca saldo dan arus kas, lalu menambah transaksi dengan cepat?

Tujuh sumber struktur yang dipertimbangkan, berurutan menurut kedekatan dengan pengguna:

1. Buku kas keluarga: baris jurnal dan saldo yang dapat ditelusuri.
2. Agenda bulanan: periode dan rangkuman yang mengikuti ritme evaluasi keluarga.
3. Label penyimpanan rumah: kelompok rekening dan kategori yang mudah ditemukan.
4. Amplop anggaran: batas kategori dan sisa peruntukan.
5. Aktivitas percakapan keluarga: pencatat dan urutan kejadian bersama.
6. Ringkasan tagihan bulanan: total utama, dua kolom angka, dan rincian bergaris.
7. Penunjuk arah layanan publik: alur transfer asal–tujuan yang jelas.

Seed Impeccable a3eba4d9 menetapkan kandidat 6 sebagai arah awal. Tidak ada keputusan pengguna yang digantikan oleh seed. Arah Buku Kas tetap tersedia sebagai alternatif; Ruang Bersama adalah pembanding yang kompetitif pada keakraban pengguna. Kandidat lain hanya menjadi eksplorasi, tidak diimplementasikan sekaligus.

Output tahap ini adalah mockup visual. Gambar bukan screenshot aplikasi berjalan, bukan bukti aksesibilitas, dan tidak boleh dipakai sebagai UI raster dalam aplikasi produksi. Alur dan nominal tetap mengikuti PRD serta UI-UX.

Palet alternatif lain tetap merupakan eksplorasi. Arah C menjadi acuan DESIGN.md dan rancangan formulir transaksi, transfer, daftar transaksi, serta anggaran. Persetujuan arah visual tidak menyatakan aplikasi sudah diimplementasikan atau tervalidasi.

## Artefak untuk ditinjau

Buka [pratinjau lokal](preview.html), atau buka file tersebut langsung dari file explorer. Tambahkan `?variant=A`, `B`, `C`, atau `D` untuk membuka varian tertentu. Panah pada bar bawah dan tombol keyboard mengganti gambar, bukan melakukan transaksi keuangan.

| Pilihan | Mockup | Prompt lengkap |
| --- | --- | --- |
| A — Ringkasan Bulanan | [PNG](../../.impeccable/mocks/decision/ringkasan.png) | [JSON](../../.impeccable/mocks/decision/ringkasan.json) |
| B — Buku Kas | [PNG](../../.impeccable/mocks/decision/buku-kas.png) | [JSON](../../.impeccable/mocks/decision/buku-kas.json) |
| C — Ruang Bersama | [PNG](../../.impeccable/mocks/decision/ruang-bersama.png) | [JSON](../../.impeccable/mocks/decision/ruang-bersama.json) |
| D — Format Standar | [PNG](../../.impeccable/mocks/decision/standar.png) | [JSON](../../.impeccable/mocks/decision/standar.json) |

Semua PNG dihasilkan melalui tool imagegen bawaan. Prompt lengkap setiap gambar tersimpan dalam sidecar JSON dengan basename yang sama dan tertanam pada metadata PNG; hanya arah C memiliki `approved: true` sesuai pilihan pengguna. Output sumber dipertahankan di folder generated_images Codex dan salinan proyek ada pada path tabel di atas.

Ini pembanding mockup Beranda, bukan prototype alur aplikasi yang dapat menyimpan input. [Paket Ruang Bersama](RUANG-BERSAMA.md) melanjutkan arah C ke layar inti, mode gelap, dan contoh gagal menyimpan. Belum ada validasi native. Istilah “akun” yang muncul pada mockup D harus diterjemahkan menjadi “rekening” pada implementasi sesuai GLOSSARY.md. Tanggal riwayat ilustratif tidak mengubah contoh total dalam dokumen.

