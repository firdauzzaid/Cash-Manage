import type { FastifyReply } from "fastify";

const email = "zhofronfirdaus@gmail.com";
const updated = "2 November 2026";

function page(title: string, active: string, content: string) {
  const nav = [
    ["/", "Beranda"],
    ["/privacy", "Privasi"],
    ["/terms", "Ketentuan"],
    ["/account-deletion", "Hapus akun"],
  ]
    .map(
      ([href, label]) =>
        `<a href="${href}"${active === href ? ' aria-current="page"' : ""}>${label}</a>`,
    )
    .join("");
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#103E36"><title>${title} · Cash Flow</title><style>
    :root{color-scheme:light;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#112D28;background:#F3F5F0;line-height:1.55}*{box-sizing:border-box}body{margin:0}a{color:#0B4038;text-underline-offset:.18em}a:focus-visible{outline:3px solid #C7A15C;outline-offset:3px}header{background:#103E36;color:#fff;padding:1.25rem max(1.25rem,calc((100vw - 68rem)/2));}header>div,main,footer{max-width:68rem;margin:auto}.brand{display:flex;align-items:center;gap:.7rem;font-size:1.1rem;font-weight:760;letter-spacing:-.02em}.mark{width:1.9rem;height:1.9rem;border-radius:.6rem;background:#C7A15C;display:grid;place-items:center;color:#103E36;font-size:1.05rem}nav{display:flex;gap:1rem;flex-wrap:wrap;margin-top:1rem}nav a{color:#fff;text-decoration:none;padding-bottom:.15rem;border-bottom:1px solid transparent}nav a[aria-current=page]{border-color:#C7A15C}main{padding:clamp(2.5rem,7vw,5.5rem) max(1.25rem,calc((100vw - 68rem)/2));max-width:72rem}article{max-width:46rem}h1,h2{color:#103E36;line-height:1.16;letter-spacing:-.035em}h1{font-size:clamp(2.3rem,6vw,4.8rem);margin:0 0 1.2rem}h2{font-size:1.45rem;margin:2.8rem 0 .7rem}p,li{max-width:68ch}.lead{font-size:clamp(1.15rem,2.4vw,1.4rem);color:#34504A}.rule{height:1px;background:#D7E1DA;margin:2.6rem 0}.facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:#D7E1DA;margin:2.3rem 0}.facts>div{background:#fff;padding:1.2rem}.facts strong{display:block;color:#0B4038;margin-bottom:.25rem}.notice{background:#E7F0EA;border-radius:1rem;padding:1.25rem 1.35rem;margin:2rem 0}.action{display:inline-block;background:#126A59;color:#fff;text-decoration:none;border-radius:.85rem;padding:.8rem 1rem;font-weight:700}footer{border-top:1px solid #D7E1DA;padding:2rem max(1.25rem,calc((100vw - 68rem)/2));color:#63736D;font-size:.94rem}@media (max-width:34rem){.facts{grid-template-columns:1fr}nav{gap:.7rem 1rem}}
  </style></head><body><header><div><div class="brand"><span class="mark" aria-hidden="true">CF</span> Cash Flow</div><nav aria-label="Navigasi publik">${nav}</nav></div></header><main><article>${content}</article></main><footer>Cash Flow dioperasikan oleh Zhofron Firdaus · Dukungan: <a href="mailto:${email}">${email}</a></footer></body></html>`;
}

export function sendPublicPage(reply: FastifyReply, html: string) {
  return reply
    .header(
      "content-security-policy",
      "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    )
    .header("x-content-type-options", "nosniff")
    .header("referrer-policy", "strict-origin-when-cross-origin")
    .type("text/html; charset=utf-8")
    .send(html);
}

export function homepage() {
  return page(
    "Cash Flow",
    "/",
    `<h1>Catatan keuangan keluarga, lebih tenang.</h1><p class="lead">Cash Flow membantu anggota household mencatat pemasukan, pengeluaran, transfer, dan anggaran bersama dari perangkat masing-masing.</p><div class="facts"><div><strong>Untuk household</strong>Rekening dan transaksi terlihat oleh anggota household yang aktif.</div><div><strong>Catatan, bukan bank</strong>Cash Flow tidak memindahkan uang atau terhubung langsung ke rekening bank.</div></div><h2>Impor notifikasi Gmail bersifat pilihan</h2><p>Bila Anda memilih menghubungkan Gmail, aplikasi hanya memproses pesan yang Anda beri label <em>Cash Flow</em>. Hasilnya menjadi kandidat yang harus Anda tinjau, lengkapi, dan simpan sendiri—tidak ada transaksi yang dicatat otomatis.</p><p class="notice">Sebelum menghubungkan Gmail, baca <a href="/privacy">Kebijakan Privasi</a> dan Anda dapat memutuskan koneksi Gmail kapan saja dari aplikasi.</p><a class="action" href="/privacy">Baca kebijakan privasi</a>`,
  );
}

export function privacyPage() {
  return page(
    "Kebijakan Privasi",
    "/privacy",
    `<h1>Kebijakan Privasi</h1><p class="lead">Berlaku sejak ${updated}. Kebijakan ini menjelaskan cara Cash Flow menggunakan data untuk menyediakan pencatatan keuangan household.</p><h2>Pengelola dan kontak</h2><p>Cash Flow dioperasikan oleh Zhofron Firdaus. Untuk pertanyaan privasi atau permintaan terkait data, hubungi <a href="mailto:${email}">${email}</a>.</p><h2>Data yang kami proses</h2><p>Kami memproses nama, alamat email, sesi login, keanggotaan household, rekening, transaksi, anggaran, undangan, dan riwayat perubahan yang diperlukan agar fitur aplikasi berjalan. Data financial household dapat dilihat oleh anggota aktif household tersebut.</p><h2>Jika Anda menghubungkan Gmail</h2><p>Dengan persetujuan Anda, Cash Flow meminta akses baca Gmail untuk memproses notifikasi yang Anda beri label <em>Cash Flow</em>. Sistem mengambil metadata yang diperlukan untuk membuat kandidat nominal, tanggal, dan catatan transaksi. Kandidat tidak menjadi transaksi sampai Anda meninjaunya dan menyimpannya.</p><p>Kami menyimpan alamat Gmail yang terhubung, refresh token yang dienkripsi, serta kandidat transaksi yang dihasilkan. Kami tidak menyimpan salinan penuh isi email. Anda dapat memutuskan koneksi Gmail dari Profil; tindakan ini menghapus koneksi dan kandidat Gmail yang terkait.</p><h2>Penggunaan dan perlindungan data</h2><p>Data dipakai untuk menyediakan fitur Cash Flow yang terlihat di aplikasi, menjaga keamanan layanan, dan menangani kegagalan teknis. Kami tidak menjual data atau menggunakannya untuk iklan. Akses server dibatasi dan kredensial Gmail disimpan terenkripsi.</p><h2>Retensi dan penghapusan</h2><p>Data akun disimpan selama akun aktif. Anda dapat mengajukan penghapusan melalui aplikasi atau mengikuti <a href="/account-deletion">petunjuk penghapusan akun</a>. Permintaan diproses paling lambat 30 hari. Login, sesi, undangan terkait, dan koneksi Gmail dihapus; transaksi yang telah dibagikan pada household tetap tersimpan dengan pencatat bernama “Pengguna dihapus”.</p><p>Backup operasional disimpan dengan akses terbatas dan ditargetkan dihapus dalam waktu paling lama 90 hari. Pastikan konfigurasi backup operasional Anda memenuhi retensi ini sebelum layanan dibuka untuk publik.</p><h2>Perubahan kebijakan</h2><p>Jika kebijakan ini berubah secara material, kami akan memperbarui tanggal berlaku di halaman ini. Penggunaan berkelanjutan setelah perubahan berarti Anda menyetujui kebijakan yang diperbarui.</p>`,
  );
}

export function termsPage() {
  return page(
    "Ketentuan Layanan",
    "/terms",
    `<h1>Ketentuan Layanan</h1><p class="lead">Berlaku sejak ${updated}. Dengan menggunakan Cash Flow, Anda menyetujui ketentuan berikut.</p><h2>Tujuan layanan</h2><p>Cash Flow adalah alat pencatatan keuangan household. Layanan ini bukan bank, penyedia pembayaran, penasihat keuangan, atau jaminan bahwa catatan Anda selalu sama dengan saldo bank atau e-wallet.</p><h2>Akun dan household</h2><p>Anda bertanggung jawab menjaga kredensial akun dan ketepatan data yang dimasukkan. Anda memahami bahwa anggota aktif household dapat melihat rekening, transaksi, anggaran, serta riwayat perubahan dalam household tersebut.</p><h2>Gmail</h2><p>Koneksi Gmail bersifat opsional. Hubungkan hanya akun Gmail yang berhak Anda akses dan beri label <em>Cash Flow</em> hanya pada notifikasi yang ingin diproses. Anda dapat memutuskan koneksi kapan saja. Penggunaan Gmail juga tunduk pada <a href="https://policies.google.com/terms" rel="noopener noreferrer">Ketentuan Google</a>.</p><h2>Ketersediaan</h2><p>Kami berupaya menjaga layanan tersedia dan aman, tetapi layanan dapat berubah, terganggu, atau dihentikan untuk pemeliharaan. Simpan catatan penting dan periksa transaksi sebelum mengambil keputusan keuangan.</p><h2>Penghapusan akun</h2><p>Anda dapat meminta penghapusan akun. Catatan keuangan bersama tetap dipertahankan secara pseudonim agar riwayat household tetap konsisten. Lihat <a href="/account-deletion">petunjuk penghapusan akun</a>.</p><h2>Kontak dan perubahan</h2><p>Hubungi <a href="mailto:${email}">${email}</a> untuk pertanyaan. Ketentuan dapat diperbarui; tanggal berlaku pada halaman ini menunjukkan versi terbaru.</p>`,
  );
}

export function accountDeletionPage() {
  return page(
    "Penghapusan Akun",
    "/account-deletion",
    `<h1>Hapus akun Cash Flow</h1><p class="lead">Anda dapat mengajukan penghapusan akun langsung dari aplikasi.</p><h2>Langkah penghapusan</h2><ol><li>Buka aplikasi Cash Flow.</li><li>Buka Keluarga, lalu Akun saya.</li><li>Pilih Hapus akun dan konfirmasikan kata sandi.</li></ol><p>Jika Anda pemilik household, alihkan kepemilikan atau hapus household yang Anda miliki terlebih dahulu.</p><h2>Dampaknya</h2><p>Login, sesi, undangan terkait, dan koneksi Gmail Anda dihapus. Catatan keuangan yang telah dibagikan tetap disimpan untuk anggota household lain dengan pencatat “Pengguna dihapus”. File yang telah diekspor berada di luar kendali aplikasi.</p><p>Jika tidak dapat masuk, gunakan Atur ulang kata sandi di aplikasi atau hubungi <a href="mailto:${email}">${email}</a>. Permintaan penghapusan diproses paling lambat 30 hari.</p><p class="notice">Baca rincian retensi data di <a href="/privacy">Kebijakan Privasi</a>.</p>`,
  );
}
