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

## Catatan proxy

API saat ini belum mempercayai header proxy. Sebelum pilot publik, trust proxy harus dibatasi pada subnet network Traefik yang sebenarnya; jangan mengaktifkan `trustProxy` untuk semua sumber atau mempercayai header dari internet secara langsung.
