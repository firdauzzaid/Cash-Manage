# Deployment pilot di VPS dengan Traefik

Konfigurasi ini menempatkan Cash Flow di `/opt/apps/cash-flow` dan memakai Traefik yang telah berjalan sebagai satu-satunya ingress HTTPS. Service API tidak memetakan port host. PostgreSQL hanya tersedia pada network Docker internal Cash Flow.

## Prasyarat

1. DNS `cashflow-api.kotagedejewellery.tech` mengarah ke IP VPS.
2. Nama network Docker Traefik telah diperiksa dengan:

   ```bash
   docker inspect traefik --format '{{range $name, $network := .NetworkSettings.Networks}}{{printf "%s\n" $name}}{{end}}'
   ```

3. Source aplikasi tersedia di `/opt/apps/cash-flow`.
4. SMTP production telah tersedia untuk email verifikasi dan reset kata sandi.

## Konfigurasi environment

Salin `.env.production.example` menjadi `.env`, lalu isi seluruh placeholder dengan nilai production. Buat password database dan secret auth dengan nilai heksadesimal acak, misalnya `openssl rand -hex 32` untuk password dan `openssl rand -hex 48` untuk secret auth.

`TRAEFIK_NETWORK` harus sama persis dengan network dari langkah prasyarat. Batasi akses file environment:

```bash
chmod 600 .env
```

## Email produksi dengan Resend

Untuk pilot, gunakan Resend melalui SMTP. Backend sudah memakai Nodemailer, sehingga tidak perlu menambah SDK atau mengubah source. Tambahkan domain pengirim khusus yang Anda kontrol, misalnya `mail.cashflow.kotagedejewellery.tech`, pada dashboard Resend. Salin record DNS SPF dan DKIM yang ditampilkan Resend persis ke DNS provider, lalu tunggu status domain menjadi terverifikasi. Jangan mengganti atau menambahkan record SPF sendiri bila domain tersebut telah memiliki email aktif.

Buat API key Resend khusus production, lalu simpan hanya di `.env` VPS:

```dotenv
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASSWORD=<Resend API key>
SMTP_FROM=Cash Flow <no-reply@mail.cashflow.kotagedejewellery.tech>
```

Restart API saja agar environment baru termuat, tanpa menyentuh PostgreSQL:

```bash
docker compose -f compose.production.yml --env-file .env up -d --no-deps --force-recreate api
```

Uji dengan mendaftarkan alamat email baru dan menyelesaikan verifikasi, lalu periksa log API dan activity feed Resend. Referensi: [SMTP Resend](https://resend.com/docs/send-with-smtp) dan [verifikasi domain Resend](https://resend.com/docs/dashboard/domains/introduction).

## Deploy pertama

```bash
cd /opt/apps/cash-flow
docker compose -f compose.production.yml config --quiet
docker compose -f compose.production.yml build api
docker compose -f compose.production.yml up -d db
docker compose -f compose.production.yml run --rm migrate
docker compose -f compose.production.yml up -d api
docker compose -f compose.production.yml ps
```

Migration tidak berjalan saat startup API. Jangan gunakan `docker compose down -v`, database reset, seed destruktif, atau hapus volume `cashflow_data`.

## Pemeriksaan

```bash
curl -f https://cashflow-api.kotagedejewellery.tech/health/live
curl -f https://cashflow-api.kotagedejewellery.tech/health/ready
docker compose -f compose.production.yml logs --tail=100 api
```

Uji pendaftaran dan email verifikasi sebelum memberi APK kepada tester. Sebelum pilot, konfigurasikan backup terenkripsi ke lokasi di luar VPS dan uji restore pada database terpisah.

## Deploy otomatis dari GitHub

Workflow `.github/workflows/deploy-production.yml` berjalan pada setiap push ke branch `main`. Ia memasang dependency, menjalankan typecheck dan pemeriksaan format, lalu menyalin source ke VPS dengan SSH/rsync. Environment `.env`, backup, dan artefak build lokal dikecualikan dari salinan.

Di VPS, jadikan skrip deploy dapat dijalankan dan siapkan folder backup terlebih dahulu:

```bash
cd /opt/apps/cash-flow
mkdir -p backups
chmod 700 backups
```

Tambahkan public key khusus GitHub Actions ke `~/.ssh/authorized_keys` milik pengguna deployment. Simpan private key pasangannya sebagai GitHub repository secret. Tambahkan empat repository secret berikut di GitHub: `CASHFLOW_DEPLOY_SSH_KEY`, `CASHFLOW_DEPLOY_KNOWN_HOSTS`, `CASHFLOW_DEPLOY_HOST`, dan `CASHFLOW_DEPLOY_USER`.

`CASHFLOW_DEPLOY_KNOWN_HOSTS` harus berisi host key VPS yang telah diverifikasi, bukan hasil host key yang diambil tanpa verifikasi saat workflow berjalan. Contoh pengambilannya dari komputer tepercaya:

```bash
ssh-keyscan -H nama-host-vps
```

Workflow tidak mengirim `.env` atau secret aplikasi ke GitHub. Setiap deploy memvalidasi Compose, membangun image API, menunggu PostgreSQL siap, membuat backup sebelum migration, menjalankan migration forward-only, menyalakan API, dan menunggu readiness berhasil.

Setiap deployment juga menyalin file `.release-version` berisi SHA commit GitHub yang dipasang. Bandingkan nilainya di VPS dengan SHA pada workflow GitHub untuk memastikan source release sama:

```bash
cd /opt/apps/cash-flow
cat .release-version
```

Backup default berada di `/opt/apps/cash-flow/backups`; atur `CASHFLOW_BACKUP_DIR` saat menjalankan skrip bila memakai lokasi lain. Lokasi ini harus disalin secara terenkripsi ke penyimpanan di luar VPS sebelum pilot publik.

## Catatan proxy

API saat ini belum mempercayai header proxy. Sebelum pilot publik, trust proxy harus dibatasi pada subnet network Traefik yang sebenarnya; jangan mengaktifkan `trustProxy` untuk semua sumber atau mempercayai header dari internet secara langsung.
