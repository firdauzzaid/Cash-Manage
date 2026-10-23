---
name: Cash Flow — Quiet Ledger
description: Ledger household dengan hero emerald menyatu, lembar ivory, dan aksi mint di pusat navigasi.
colors:
  primary: "#126A59"
  primary-deep: "#0B4038"
  on-primary: "#FFFFFF"
  hero: "#103E36"
  background: "#F3F5F0"
  surface: "#FFFFFF"
  soft: "#E7F0EA"
  text: "#112D28"
  text-secondary: "#63736D"
  border: "#D7E1DA"
  outline: "#71827A"
  dark-border: "#34504A"
  dark-outline: "#68827A"
  accent: "#C7A15C"
  income: "#137A4E"
  expense: "#B33F36"
  warning: "#7B540B"
typography:
  amount:
    { fontFamily: "system", fontSize: "36px", fontWeight: 700, lineHeight: 1.2 }
  title:
    {
      fontFamily: "system",
      fontSize: "24px",
      fontWeight: 700,
      lineHeight: 1.25,
    }
  body:
    {
      fontFamily: "system",
      fontSize: "16px",
      fontWeight: 400,
      lineHeight: 1.45,
    }
rounded: { control: "14px", card: "16px", sheet: "28px" }
spacing:
  { xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "20px", xxl: "28px" }
---

# Panduan Desain — Cash Flow

Versi 0.4 · Quiet Ledger · 23 Oktober 2026.

Cash Flow adalah ruang keuangan bersama yang terasa tenang dan tepercaya. Desain memprioritaskan angka, konteks household, dan tindakan berikutnya. Nama produk masih merupakan nama kerja. Aturan produk tetap mengikuti [PRD](docs/PRD.md) dan alur tetap mengikuti [UI/UX](docs/UI-UX.md).

## Arah visual

Gunakan emerald gelap sebagai jangkar untuk momen orientasi: masuk, memilih household, saldo, dan konteks keluarga. Latar mineral-putih menjaga layar data tetap ringan. Aksi utama memakai emerald; aksi pendukung memakai permukaan hijau pucat; brass dipakai hemat untuk penanda merek, bukan status finansial.

Beranda adalah referensi komposisi utama: nama household, periode, dan saldo berada dalam satu hero emerald tanpa header tab bawaan. Lembar ivory menyatu tepat di bawah hero dan berisi arus kas dua kolom, anggaran, transaksi terbaru, lalu rekening. Jangan menggantinya dengan kartu saldo terpisah atau memindahkan rekening ke atas arus kas.

Layar pilih atau buat household mengikuti kontinuitas yang sama: hero emerald untuk identitas pengguna dan konteks, lalu lembar ivory untuk daftar ruang, undangan, formulir pembuatan, serta tindakan akun. Jangan menggunakan kartu sambutan terpisah atau tumpukan tombol penuh untuk memilih ruang.

Layar masuk memakai bidang emerald penuh sebagai orientasi merek dan lembar formulir mineral-putih yang muncul dari bawah dengan radius atas 28. Tidak ada kartu hero atau kartu formulir terpisah. Lembar ini berisi satu CTA primer, tautan daftar dan bantuan, kontrol tampilkan/sembunyikan kata sandi, serta penanda privasi singkat. Warna autofill browser harus tetap memakai token permukaan aplikasi. Layar ini tidak memakai scroll pada viewport mobile standar; saat keyboard terbuka, keyboard avoiding view menjaga field aktif tetap terlihat.

Satu kartu hero boleh menjadi fokus setiap layar. Setelah itu, kelompokkan data hanya bila kelompoknya membantu pemindaian. Daftar transaksi tetap berupa baris berurutan di dalam satu permukaan, bukan tumpukan kartu yang seragam.

## Hierarki informasi

1. Household dan periode aktif.
2. Nominal utama dengan label yang menjelaskan artinya.
3. Aksi utama sesuai tugas: catat, simpan, undang, atau ekspor.
4. Rincian dan metadata, termasuk rekening, pencatat, serta status.

Navigation bar selalu memiliki lima posisi visual: Beranda, Transaksi, aksi tambah di tengah, Anggaran, dan Anggota. Aksi tambah adalah kontrol pusat yang membuka formulir transaksi; ia bukan tab dan tidak boleh muncul lagi sebagai FAB atau tombol header.

Saldo tercatat dan arus kas periode selalu dibedakan. Warna tidak menjadi satu-satunya pembeda: pemasukan, pengeluaran, transfer, kondisi anggaran, dan status simpan memiliki teks atau ikon pendamping.

## Komponen

- **Hero Beranda**: bidang emerald yang menyatukan pemilih household, periode, pemisah brass, dan saldo. Lembar konten ivory menempel pada sisi bawahnya dengan radius atas 28.
- **Arus kas**: dua kolom setara dengan pemisah tipis, ikon arah, total, dan maksimum tiga rincian pemasukan atau lima rincian pengeluaran. Kategori selebihnya digabung sebagai “Lainnya”.
- **Card**: permukaan putih dengan radius 16, padding 16–20, bayangan lembut hanya untuk memisahkan kelompok dari latar.
- **Button**: tinggi minimum 48, radius 14. Primer memakai emerald; sekunder memakai hijau pucat dengan teks emerald.
- **Field dan pilihan**: label selalu tampak, fokus memakai outline emerald, sheet pilihan ber-radius 28.
- **Baris transaksi**: ikon jenis, nama, rekening, nominal, tanggal, dan pencatat. Nominal rata kanan memakai digit tabular bila tersedia.
- **Progress anggaran**: nominal dan sisa wajib hadir bersama batang progress.

Gunakan font sistem agar mengikuti iOS dan Android serta font scaling pengguna. Nominal penting tidak disingkat. Kontrol, field, dan tombol memiliki label aksesibel; target sentuh mengikuti pedoman platform.

## Interaksi dan umpan balik

Tekanan tombol memberi respons singkat melalui perubahan opacity/scale. Simpan mengunci tap paralel, mencegah kirim saat offline, dan menampilkan konfirmasi berhasil yang tetap terlihat saat pengguna kembali ke halaman sebelumnya. Error mempertahankan isian, memisahkan kondisi offline dari hasil simpan yang belum diketahui, dan tidak mengklaim keberhasilan sebelum respons server. Data terakhir yang masih tampil setelah pemuatan ulang gagal diberi penanda tersendiri. Tindakan berisiko menggunakan label aksi yang spesifik pada konfirmasi, bukan label umum.

Formulir adalah tugas fokus tanpa tab bar. Tab bar menampilkan empat tujuan dan satu aksi tambah di tengah. Aksi tambah berada di dalam batas navigation bar, bukan sebagai FAB yang menutupi konten dan bukan tombol header. Sheet, date picker, back gesture, safe area, keyboard, dan system Back mengikuti perilaku platform.

## Tema dan batas verifikasi

Tema gelap mempertahankan emerald sebagai jangkar dengan teks terang dan kontras memadai; ia bukan sekadar inversi otomatis. Pemeriksaan browser dapat memvalidasi struktur dan alur web, tetapi verifikasi iOS/Android, keyboard, font besar, VoiceOver, dan TalkBack masih memerlukan perangkat atau emulator.

Dokumen [Ruang Bersama](docs/design/RUANG-BERSAMA.md) menyimpan keputusan dan mockup arah sebelumnya. Quiet Ledger menggantikan token dan aturan implementasinya.
