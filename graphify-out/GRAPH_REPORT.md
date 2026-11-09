# Graph Report - cash-flow  (2026-11-09)

## Corpus Check
- 112 files · ~851,456 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .example 2, .css 1)

## Summary
- 740 nodes · 1694 edges · 51 communities (40 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4b5fd676`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ui.tsx
- package.json
- gmail.ts
- 001_domain.sql
- fail
- expo
- dependencies
- Desain Database — Cash Flow
- mobile/package.json
- index.ts
- app.ts
- backup.mjs
- api/package.json
- Product Requirements Document — Cash Flow
- README.md
- Arsitektur Sistem — Cash Flow
- Rancangan UI/UX — Cash Flow
- Instruksi Agen — Aplikasi Keuangan Rumah Tangga
- Deployment pilot di VPS dengan Traefik
- contracts/package.json
- Cash Flow
- access.ts
- 000_auth.sql
- compilerOptions
- PRODUCT.md
- Tech Stack — Cash Flow
- contracts/tsconfig.json
- api/tsconfig.json
- mobile/tsconfig.json
- integration.test.ts
- reports.ts
- Paket Desain — Ruang Bersama
- Usulan Impor Notifikasi Transaksi Gmail
- Panduan Desain — Cash Flow
- Operasi Cash Flow
- Riset Sumber Publik untuk Impor Notifikasi Transaksi
- Riset Export Statement Provider untuk Impor Transaksi
- server.ts
- Status implementasi Cash Flow
- scripts
- Cash Flow
- css.d.ts
- db-init.sh
- backup-production.sh
- deploy-production.sh
- devDependencies

## God Nodes (most connected - your core abstractions)
1. `useColors()` - 43 edges
2. `fail()` - 39 edges
3. `useApp()` - 36 edges
4. `Copy()` - 35 edges
5. `Button()` - 35 edges
6. `Screen()` - 28 edges
7. `react` - 25 edges
8. `LoadState()` - 24 edges
9. `Field()` - 23 edges
10. `Title()` - 22 edges

## Surprising Connections (you probably didn't know these)
- ``transactions`` --references--> `transactions()`  [INFERRED]
  docs/DATABASE.md → apps/api/src/reports.ts
- ``categories`` --references--> `version()`  [INFERRED]
  docs/DATABASE.md → apps/api/src/validation.ts
- ``financial_accounts`` --references--> `version()`  [INFERRED]
  docs/DATABASE.md → apps/api/src/validation.ts
- ``household_invitations`` --references--> `version()`  [INFERRED]
  docs/DATABASE.md → apps/api/src/validation.ts
- ``household_members`` --references--> `version()`  [INFERRED]
  docs/DATABASE.md → apps/api/src/validation.ts

## Import Cycles
- None detected.

## Communities (51 total, 11 thin omitted)

### Community 0 - "ui.tsx"
Cohesion: 0.07
Nodes (115): AuditField, AuditScreen(), entities, fields(), kinds, names, value(), apps_mobile_app_global (+107 more)

### Community 1 - "package.json"
Cohesion: 0.05
Nodes (36): devDependencies, @playwright/test, prettier, tsx, @types/node, typescript, engines, node (+28 more)

### Community 2 - "gmail.ts"
Cohesion: 0.17
Nodes (21): beginGmailAuthorization(), challenge(), connectionActive(), decrypt(), digest(), encrypt(), failureCode(), finishGmailAuthorization() (+13 more)

### Community 3 - "001_domain.sql"
Cohesion: 0.12
Nodes (32): account_effects, audit_events, audit_page, budgets, categories, category_active_name, check_household_owner(), deletion_requests (+24 more)

### Community 4 - "fail"
Cohesion: 0.15
Nodes (32): access(), audit(), existing(), owner(), fail(), HttpError, deleteCategoryPermanently(), reclassifyCategory() (+24 more)

### Community 5 - "expo"
Cohesion: 0.07
Nodes (27): backgroundColor, foregroundImage, adaptiveIcon, package, web, projectId, expo, android (+19 more)

### Community 6 - "dependencies"
Cohesion: 0.08
Nodes (26): dependencies, better-auth, @better-auth/expo, @cashflow/contracts, expo, expo-clipboard, expo-constants, expo-crypto (+18 more)

### Community 7 - "Desain Database — Cash Flow"
Cohesion: 0.10
Nodes (25): budgets(), version(), 10. Index awal dan migrasi, 11. Validasi desain dan sumber, 1. Pilihan model, 2. ERD, 4. Identitas dan household, 5. Rekening dan kategori (+17 more)

### Community 8 - "mobile/package.json"
Cohesion: 0.10
Nodes (20): better-auth, @better-auth/expo, @cashflow/contracts, main, name, private, version, expo (+12 more)

### Community 9 - "index.ts"
Cohesion: 0.10
Nodes (16): Account, Audit, Budget, Category, Household, Invitation, Kind, MAX_MONEY (+8 more)

### Community 10 - "app.ts"
Cohesion: 0.19
Nodes (18): read(), createApp(), actor(), Config, configFromEnv(), createAuth(), Mail, { Pool } (+10 more)

### Community 11 - "backup.mjs"
Cohesion: 0.11
Nodes (15): target, ref_node_child_process, ref_node_fs, ref_node_http, ref_node_path, node-pg-migrate, ref_node_url, directory (+7 more)

### Community 13 - "api/package.json"
Cohesion: 0.06
Nodes (33): dependencies, better-auth, @better-auth/expo, @cashflow/contracts, fastify, @fastify/cors, @fastify/rate-limit, @fastify/swagger (+25 more)

### Community 14 - "Product Requirements Document — Cash Flow"
Cohesion: 0.15
Nodes (13): 10. Skenario verifikasi wajib, 11. Urutan implementasi dan release gate, 12. Referensi, 1. Tujuan dan status keputusan, 2. Pengguna dan pekerjaan utama, 3. Scope MVP, 4. Permission, 5. Business rule (+5 more)

### Community 16 - "Arsitektur Sistem — Cash Flow"
Cohesion: 0.17
Nodes (12): 10. Operasi, backup, dan pemulihan, 11. Validasi dan sumber, 1. Gambaran sistem, 2. Modul dan interface, 3. Struktur repository yang direncanakan, 4. Autentikasi dan trust, 5. Alur menulis transaksi, 6. Kontrak HTTP awal (+4 more)

### Community 17 - "Rancangan UI/UX — Cash Flow"
Cohesion: 0.17
Nodes (12): 10. Empty, loading, error, dan data ekstrem, 11. Kriteria tinjauan desain, 1. Arsitektur informasi, 2. Daftar layar, 3. Onboarding dan undangan, 4. Beranda dan wireframe, 5. Formulir transaksi, 6. State formulir dan koreksi bersama (+4 more)

### Community 18 - "Instruksi Agen — Aplikasi Keuangan Rumah Tangga"
Cohesion: 0.20
Nodes (10): Aturan keuangan dan household, Batas perubahan, Handoff, Instruksi Agen — Aplikasi Keuangan Rumah Tangga, Klarifikasi dan konteks proyek, Konteks proyek, Perbaikan bug, Perlindungan data dan database (+2 more)

### Community 19 - "Deployment pilot di VPS dengan Traefik"
Cohesion: 0.20
Nodes (9): Catatan proxy, Deploy otomatis dari GitHub, Deploy pertama, Deployment pilot di VPS dengan Traefik, Email produksi dengan Resend, Halaman publik dan verifikasi Gmail, Konfigurasi environment, Pemeriksaan (+1 more)

### Community 20 - "contracts/package.json"
Cohesion: 0.20
Nodes (9): main, name, private, scripts, build, typecheck, type, types (+1 more)

### Community 21 - "Cash Flow"
Cohesion: 0.20
Nodes (10): Brand Commitments, Capabilities and Constraints, Cash Flow, Evidence on Hand, Operating Context, Platform, Product Principles, Product Purpose (+2 more)

### Community 22 - "access.ts"
Cohesion: 0.26
Nodes (11): Actor, canonical(), mutate(), transaction(), apps_api_src_db_database, apps_api_src_db_poolclient, lockHouseholds(), processDeletions() (+3 more)

### Community 23 - "000_auth.sql"
Cohesion: 0.36
Nodes (8): "auth_accounts", auth_accounts_userId_idx, "auth_rate_limits", "auth_sessions", auth_sessions_userId_idx, "auth_users", "auth_verifications", auth_verifications_identifier_idx

### Community 24 - "compilerOptions"
Cohesion: 0.22
Nodes (8): compilerOptions, esModuleInterop, module, moduleResolution, resolveJsonModule, skipLibCheck, strict, target

### Community 25 - "PRODUCT.md"
Cohesion: 0.29
Nodes (4): Artefak untuk ditinjau, Eksplorasi visual Cash Flow, Keuangan Rumah Tangga, Language

### Community 26 - "Tech Stack — Cash Flow"
Cohesion: 0.25
Nodes (8): 1. Keputusan dan batas, 2. Stack yang direkomendasikan, 3. Kebijakan versi dan kompatibilitas, 4. Keamanan konfigurasi, 5. Rencana Docker, 6. Alasan memilih pendekatan ini, 7. Referensi resmi, Tech Stack — Cash Flow

### Community 27 - "contracts/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, declaration, outDir, rootDir, extends, include, ../../tsconfig.json

### Community 28 - "api/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.json

### Community 29 - "mobile/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, paths, strict, extends, include, expo/tsconfig.base

### Community 30 - "integration.test.ts"
Cohesion: 0.16
Nodes (9): GmailConfig, call(), user(), apps_mobile_src_transaction_import_notificationdraft, packages_contracts_dist_index_notificationdraft, ref_node_assert, ref_node_crypto, ref_node_test (+1 more)

### Community 31 - "reports.ts"
Cohesion: 0.29
Nodes (9): Context, accounts(), csv(), csvCell(), period(), summary(), transactions(), packages_contracts_dist_index_validdate (+1 more)

### Community 33 - "Paket Desain — Ruang Bersama"
Cohesion: 0.29
Nodes (7): Dataset contoh, Keputusan dan scope, Layar untuk ditinjau, Paket Desain — Ruang Bersama, State yang harus diterapkan, Struktur dan perilaku utama, Verifikasi token dan batas bukti

### Community 34 - "Usulan Impor Notifikasi Transaksi Gmail"
Cohesion: 0.29
Nodes (6): Batas rekomendasi, Implikasi Gmail, Keputusan, Kriteria penerimaan sebelum rilis, Rancangan teknis bila tahap koneksi Gmail disetujui, Usulan Impor Notifikasi Transaksi Gmail

### Community 35 - "Panduan Desain — Cash Flow"
Cohesion: 0.33
Nodes (6): Arah visual, Hierarki informasi, Interaksi dan umpan balik, Komponen, Panduan Desain — Cash Flow, Tema dan batas verifikasi

### Community 36 - "Operasi Cash Flow"
Cohesion: 0.33
Nodes (6): Backup dan pemulihan, Lingkungan dan kredensial, Migration dan startup, Observabilitas dan batas operasi, Operasi Cash Flow, Penghapusan akun

### Community 37 - "Riset Sumber Publik untuk Impor Notifikasi Transaksi"
Cohesion: 0.33
Nodes (5): Field kandidat dan aturan keselamatan, Kesimpulan, Rekap per provider, Rekomendasi langkah berikutnya, Riset Sumber Publik untuk Impor Notifikasi Transaksi

### Community 38 - "Riset Export Statement Provider untuk Impor Transaksi"
Cohesion: 0.33
Nodes (5): Batas penting, Kesimpulan, Rekap, Rekomendasi produk, Riset Export Statement Provider untuk Impor Transaksi

### Community 39 - "server.ts"
Cohesion: 0.29
Nodes (7): syncGmailConnections(), config, gmailTimer, pool, timer, transport, nodemailer

### Community 40 - "Status implementasi Cash Flow"
Cohesion: 0.40
Nodes (5): Fitur yang tersedia, Gate sebelum publik, Implementasi yang lebih sederhana dari rancangan awal, Pemeriksaan yang telah dijalankan, Status implementasi Cash Flow

### Community 41 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, eas-build-post-install, export, start, typecheck

### Community 42 - "Cash Flow"
Cohesion: 0.40
Nodes (5): Cash Flow, Menjalankan lokal, Pemeriksaan, Pratinjau browser, Struktur

## Knowledge Gaps
- **325 isolated node(s):** `name`, `version`, `private`, `type`, `build` (+320 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 362 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Desain Database — Cash Flow` connect `Desain Database — Cash Flow` to `fail`, `README.md`?**
  _High betweenness centrality (0.202) - this node is a cross-community bridge._
- **Why does `3. Konvensi` connect `fail` to `Desain Database — Cash Flow`?**
  _High betweenness centrality (0.191) - this node is a cross-community bridge._
- **Why does `uuid()` connect `fail` to `access.ts`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _325 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ui.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07207207207207207 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Should `001_domain.sql` be split into smaller, more focused modules?**
  _Cohesion score 0.12380952380952381 - nodes in this community are weakly interconnected._