# Cash Flow

<!-- impeccable:product-schema 1 -->

Status: konteks produk untuk rancangan MVP, 20 Oktober 2026. Cash Flow adalah nama kerja yang dipilih pengguna; nama komersial, logo, dan identitas visual final belum ditentukan.

## Platform

adaptive

Aplikasi mobile Android dan iOS sejak awal. Perilaku navigasi, kontrol, aksesibilitas, serta penanganan keyboard mengikuti masing-masing OS. Peluncuran pertama berfokus pada ponsel; pengalaman tablet khusus belum termasuk scope.

## Stack

React Native, Expo, dan TypeScript adalah arah awal dari proposal yang diterima. Pengguna menetapkan PostgreSQL langsung, tanpa Supabase, serta penggunaan Docker. Backend dan database berjalan dalam container; build mobile tetap memakai toolchain Android/iOS. Backend Node.js terpisah dan pilihan library pendukung merupakan rekomendasi teknis dalam [Tech Stack](docs/TECH-STACK.md), belum dependency yang terpasang.

## Users

Pasangan dan anggota keluarga yang mencatat serta meninjau keuangan bersama melalui akun dan perangkat masing-masing. Produk melayani banyak household dengan data yang terpisah.

## Product Purpose

Membantu keluarga mengetahui uang masuk, pengeluaran, saldo tercatat, dan sisa anggaran tanpa saling meminta rekap manual. Pengguna dapat mulai sendiri, lalu mengundang pasangan.

## Operating Context

Pencatatan dilakukan setelah menerima atau membelanjakan uang, sering kali dari ponsel dengan waktu terbatas. Peninjauan bersama dilakukan selama bulan berjalan dan ketika mengevaluasi anggaran bulanan. Pencatatan awal bersifat manual; saldo tercatat bukan hasil pembacaan langsung dari bank.

## Capabilities and Constraints

- MVP: household dan anggota, rekening, transaksi, transfer, anggaran bulanan, dashboard/laporan, riwayat perubahan, dan ekspor.
- Data dalam household dibagikan kepada anggotanya. Rekening pribadi tersembunyi harus berada dalam ruang terpisah pada pengembangan berikutnya.
- Satu mata uang per household, dengan IDR sebagai pilihan awal. Simpan transaksi membutuhkan koneksi internet; formulir tidak hilang saat request gagal.
- Integrasi bank, offline sync, OCR, AI, utang/piutang, kartu kredit, monetisasi, dan ruang pribadi terpisah belum termasuk MVP.
- Detail baru dalam dokumen rancangan ditandai sebagai baseline rekomendasi, bukan hasil riset pengguna atau fitur yang sudah dibangun.

## Brand Commitments

Nama kerja: Cash Flow. Bahasa produk awal: Indonesia. Pengguna memilih arah visual **C — Ruang Bersama** pada 20 Oktober 2026: permukaan hangat, kartu putih, aksen teal, dan identitas anggota keluarga. Mark aplikasi berupa atap rumah dengan dua aliran keuangan bersama berwarna emerald, mint, dan brass. Nama komersial final belum ditentukan. Rancangan tetap memprioritaskan kejelasan angka dan kenyamanan pencatatan bersama.

## Evidence on Hand

Kebutuhan dan proposal yang diterima berasal dari percakapan pengguna. Belum ada kode aplikasi, wawancara keluarga, data penggunaan, aset merek, atau hasil pengujian perangkat. Contoh nominal dalam dokumentasi adalah skenario sintetis.

[Eksplorasi visual](docs/design/EXPLORATIONS.md) memuat empat mockup Beranda berbasis data contoh. Arah C dipilih pengguna; mockup merupakan referensi desain, bukan screenshot aplikasi berjalan.

## Product Principles

1. Angka konsisten dan dapat ditelusuri.
2. Anggota memahami data apa yang dibagikan sebelum bergabung.
3. Pencatatan singkat, dengan penanganan kegagalan yang jelas.
4. Data antar keluarga terpisah pada setiap operasi.

Detail requirement dan keputusan baseline berada di [PRD](docs/PRD.md). Istilah baku berada di [Glosarium](GLOSSARY.md).
