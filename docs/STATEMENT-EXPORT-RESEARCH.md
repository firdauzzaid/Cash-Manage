# Riset Export Statement Provider untuk Impor Transaksi

Status: riset desain. Cakupan hanya fitur yang didokumentasikan publik oleh provider; tidak menyimpulkan adanya API atau format file yang tidak dipublikasikan.

## Kesimpulan

Untuk akun konsumen, sumber resmi saat ini hanya membuktikan export **PDF** pada DANA dan download e-Statement pada myBCA (format individu tidak dinyatakan sebagai CSV/XLS). GoPay dan OVO mendokumentasikan riwayat/bukti transaksi, tetapi bukan export transaksi konsumen terstruktur. Tidak ada sumber yang mendukung implementasi impor CSV/XLS lintas-provider untuk MVP.

PDF dapat menjadi bukti yang lebih baik daripada email, tetapi bukan input impor yang aman tanpa parser PDF/provider-specific dan fixture nyata. Karena format PDF dapat berubah dan memuat data sensitif, jangan menambahkan OCR atau parser PDF otomatis pada MVP.

## Rekap

| Provider             | Fitur resmi konsumen                                                                                                                                                                                                                 | Format yang terbukti                                                                      | Kelayakan impor terstruktur                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| GoPay                | Riwayat dengan status, waktu/tanggal, ID transaksi, dan Order ID; pengguna dapat membagikan bukti bayar. [Riwayat GoPay](https://gopay.co.id/bantuan/tentang-gopay/bagaimana-cara-melihat-riwayat-transaksi-gopay)                   | Tidak dinyatakan sebagai CSV/XLS/PDF export konsumen.                                     | Tidak layak saat ini. Gunakan salin/berbagi bukti sebagai draf manual. |
| DANA                 | Statement untuk periode pilihan memuat jenis, status, tanggal/waktu, nominal, dan merchant/penerima; laporan dapat diunduh sebagai PDF. [Riwayat DANA](https://www.dana.id/blog/riwayat-transaksi-dana/)                             | PDF.                                                                                      | Belum layak untuk import otomatis; PDF bukan kontrak data terstruktur. |
| OVO                  | Ketentuan publik membahas riwayat transaksi dan status; dokumentasi email laporan yang ditemukan hanya untuk merchant. [Ketentuan OVO](https://ovo.id/syarat-ketentuan?webview=true), [FAQ merchant](https://www.ovo.id/faqmerchant) | Tidak ada export konsumen terstruktur yang didokumentasikan.                              | Tidak layak saat ini.                                                  |
| BCA / myBCA individu | e-Statement dapat diunduh untuk periode bulanan dan mencakup arus dana masuk/keluar; histori sejak 2016 tersedia. [e-Statement myBCA](https://www.bca.co.id/id/Individu/layanan/e-banking/mybca/e-statement)                         | Download tersedia, tetapi format file akun individu tidak disebutkan pada halaman produk. | Tunda sampai pengguna menyampaikan file contoh yang telah disamarkan.  |

## Batas penting

- myBCA Bisnis mendokumentasikan export PDF untuk e-Statement. [Panduan myBCA Bisnis](https://www.bca.co.id/-/media/Files/Bisnis/Layanan/e-banking/myBCA-Bisnis/20250901-buku-panduan-mybca-bisnis)
- Fitur Business Sub Account BCA juga mendokumentasikan pilihan PDF, XLSX, CSV, dan TXT, tetapi hanya untuk nasabah/fitur bisnis tersebut. Ini bukan bukti kemampuan untuk akun konsumen. [BCA Business Sub Account](https://www.bca.co.id/id/informasi/edukatips/2026/04/23/09/58/business-sub-account-rupiah-bantu-nasabah-bisnis-merapikan-alokasi-keuangan)
- Format export, kolom, dan periodenya dapat berubah. Setiap importer harus mengidentifikasi format dan versi, lalu berhenti dengan pesan yang jelas jika tidak cocok.

## Rekomendasi produk

1. Pertahankan impor teks notifikasi manual sebagai satu-satunya fitur yang diproses aplikasi saat ini.
2. Jika pengguna dapat menyediakan file statement yang telah disamarkan, lakukan riset per-provider dan uji parser hanya untuk format serta versi file yang benar-benar terbukti.
3. Bila nanti mengimpor file, jadikan hasilnya draf privat dengan deduplikasi, ringkasan perubahan, dan konfirmasi pengguna. Jangan langsung membuat transaksi, khususnya untuk transfer, top up, refund, atau status selain sukses.
4. Jangan memakai OCR untuk PDF dan jangan mencoba endpoint internal aplikasi provider. Keduanya di luar MVP dan tidak stabil/berisiko.
