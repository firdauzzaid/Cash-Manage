# Graph Report - cash-flow  (2026-11-02)

## Corpus Check
- 108 files · ~847,405 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .example 2, .css 1)

## Summary
- 718 nodes · 1646 edges · 45 communities (38 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d0b4c824`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ui.tsx
- fail
- package.json
- mobile/package.json
- 001_domain.sql
- Desain Database — Cash Flow
- dependencies
- index.ts
- expo
- 000_auth.sql
- Product Requirements Document — Cash Flow
- backup.mjs
- Arsitektur Sistem — Cash Flow
- Rancangan UI/UX — Cash Flow
- README.md
- api/package.json
- backup-production.sh
- contracts/package.json
- Cash Flow
- Deployment pilot di VPS dengan Traefik
- compilerOptions
- Tech Stack — Cash Flow
- contracts/tsconfig.json
- deploy-production.sh
- api/tsconfig.json
- mobile/tsconfig.json
- Instruksi Agen — Aplikasi Keuangan Rumah Tangga
- Paket Desain — Ruang Bersama
- Panduan Desain — Cash Flow
- Operasi Cash Flow
- app.ts
- access.ts
- Status implementasi Cash Flow
- Cash Flow
- Riset Sumber Publik untuk Impor Notifikasi Transaksi
- db-init.sh
- PRODUCT.md
- Riset Export Statement Provider untuk Impor Transaksi
- css.d.ts
- reports.ts
- gmail.ts
- Usulan Impor Notifikasi Transaksi Gmail
- server.ts

## God Nodes (most connected - your core abstractions)
1. `useColors()` - 42 edges
2. `useApp()` - 36 edges
3. `fail()` - 35 edges
4. `Copy()` - 35 edges
5. `Button()` - 34 edges
6. `Screen()` - 28 edges
7. `react` - 25 edges
8. `LoadState()` - 24 edges
9. `Field()` - 22 edges
10. `Title()` - 21 edges

## Surprising Connections (you probably didn't know these)
- ``transactions`` --references--> `transactions()`  [INFERRED]
  docs/DATABASE.md → apps/api/src/reports.ts
- `3. Konvensi` --references--> `text()`  [INFERRED]
  docs/DATABASE.md → apps/api/src/validation.ts
- ``categories`` --references--> `version()`  [INFERRED]
  docs/DATABASE.md → apps/api/src/validation.ts
- ``financial_accounts`` --references--> `version()`  [INFERRED]
  docs/DATABASE.md → apps/api/src/validation.ts
- ``household_invitations`` --references--> `version()`  [INFERRED]
  docs/DATABASE.md → apps/api/src/validation.ts

## Import Cycles
- None detected.

## Communities (45 total, 7 thin omitted)

### Community 0 - "ui.tsx"
Cohesion: 0.08
Nodes (108): AuditField, AuditScreen(), entities, fields(), kinds, names, value(), apps_mobile_app_global (+100 more)

### Community 1 - "fail"
Cohesion: 0.17
Nodes (25): audit(), existing(), owner(), actor(), fail(), HttpError, reference(), remove() (+17 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (36): devDependencies, @playwright/test, prettier, tsx, @types/node, typescript, engines, node (+28 more)

### Community 3 - "mobile/package.json"
Cohesion: 0.06
Nodes (30): devDependencies, @types/react, better-auth, @better-auth/expo, @cashflow/contracts, main, name, private (+22 more)

### Community 4 - "001_domain.sql"
Cohesion: 0.14
Nodes (31): account_effects, audit_events, audit_page, budgets, categories, category_active_name, check_household_owner(), deletion_requests (+23 more)

### Community 5 - "Desain Database — Cash Flow"
Cohesion: 0.10
Nodes (25): budgets(), version(), 10. Index awal dan migrasi, 11. Validasi desain dan sumber, 1. Pilihan model, 2. ERD, 4. Identitas dan household, 5. Rekening dan kategori (+17 more)

### Community 6 - "dependencies"
Cohesion: 0.08
Nodes (26): dependencies, better-auth, @better-auth/expo, @cashflow/contracts, expo, expo-clipboard, expo-constants, expo-crypto (+18 more)

### Community 7 - "index.ts"
Cohesion: 0.10
Nodes (15): Account, Audit, Budget, Category, Household, Invitation, Kind, MAX_MONEY (+7 more)

### Community 8 - "expo"
Cohesion: 0.07
Nodes (27): backgroundColor, foregroundImage, adaptiveIcon, package, web, projectId, expo, android (+19 more)

### Community 9 - "000_auth.sql"
Cohesion: 0.36
Nodes (8): "auth_accounts", auth_accounts_userId_idx, "auth_rate_limits", "auth_sessions", auth_sessions_userId_idx, "auth_users", "auth_verifications", auth_verifications_identifier_idx

### Community 10 - "Product Requirements Document — Cash Flow"
Cohesion: 0.15
Nodes (13): 10. Skenario verifikasi wajib, 11. Urutan implementasi dan release gate, 12. Referensi, 1. Tujuan dan status keputusan, 2. Pengguna dan pekerjaan utama, 3. Scope MVP, 4. Permission, 5. Business rule (+5 more)

### Community 11 - "backup.mjs"
Cohesion: 0.09
Nodes (16): target, ref_node_child_process, ref_node_fs, ref_node_http, ref_node_path, node-pg-migrate, ref_node_url, @playwright/test (+8 more)

### Community 12 - "Arsitektur Sistem — Cash Flow"
Cohesion: 0.17
Nodes (12): 10. Operasi, backup, dan pemulihan, 11. Validasi dan sumber, 1. Gambaran sistem, 2. Modul dan interface, 3. Struktur repository yang direncanakan, 4. Autentikasi dan trust, 5. Alur menulis transaksi, 6. Kontrak HTTP awal (+4 more)

### Community 13 - "Rancangan UI/UX — Cash Flow"
Cohesion: 0.17
Nodes (12): 10. Empty, loading, error, dan data ekstrem, 11. Kriteria tinjauan desain, 1. Arsitektur informasi, 2. Daftar layar, 3. Onboarding dan undangan, 4. Beranda dan wireframe, 5. Formulir transaksi, 6. State formulir dan koreksi bersama (+4 more)

### Community 15 - "api/package.json"
Cohesion: 0.06
Nodes (33): dependencies, better-auth, @better-auth/expo, @cashflow/contracts, fastify, @fastify/cors, @fastify/rate-limit, @fastify/swagger (+25 more)

### Community 17 - "contracts/package.json"
Cohesion: 0.20
Nodes (9): main, name, private, scripts, build, typecheck, type, types (+1 more)

### Community 18 - "Cash Flow"
Cohesion: 0.20
Nodes (10): Brand Commitments, Capabilities and Constraints, Cash Flow, Evidence on Hand, Operating Context, Platform, Product Principles, Product Purpose (+2 more)

### Community 19 - "Deployment pilot di VPS dengan Traefik"
Cohesion: 0.20
Nodes (9): Catatan proxy, Deploy otomatis dari GitHub, Deploy pertama, Deployment pilot di VPS dengan Traefik, Email produksi dengan Resend, Halaman publik dan verifikasi Gmail, Konfigurasi environment, Pemeriksaan (+1 more)

### Community 20 - "compilerOptions"
Cohesion: 0.22
Nodes (8): compilerOptions, esModuleInterop, module, moduleResolution, resolveJsonModule, skipLibCheck, strict, target

### Community 21 - "Tech Stack — Cash Flow"
Cohesion: 0.25
Nodes (8): 1. Keputusan dan batas, 2. Stack yang direkomendasikan, 3. Kebijakan versi dan kompatibilitas, 4. Keamanan konfigurasi, 5. Rencana Docker, 6. Alasan memilih pendekatan ini, 7. Referensi resmi, Tech Stack — Cash Flow

### Community 22 - "contracts/tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, declaration, outDir, rootDir, extends, include, ../../tsconfig.json

### Community 24 - "api/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.json

### Community 25 - "mobile/tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, paths, strict, extends, include, expo/tsconfig.base

### Community 26 - "Instruksi Agen — Aplikasi Keuangan Rumah Tangga"
Cohesion: 0.18
Nodes (10): Aturan keuangan dan household, Batas perubahan, Handoff, Instruksi Agen — Aplikasi Keuangan Rumah Tangga, Klarifikasi dan konteks proyek, Konteks proyek, Perbaikan bug, Perlindungan data dan database (+2 more)

### Community 27 - "Paket Desain — Ruang Bersama"
Cohesion: 0.29
Nodes (7): Dataset contoh, Keputusan dan scope, Layar untuk ditinjau, Paket Desain — Ruang Bersama, State yang harus diterapkan, Struktur dan perilaku utama, Verifikasi token dan batas bukti

### Community 28 - "Panduan Desain — Cash Flow"
Cohesion: 0.33
Nodes (6): Arah visual, Hierarki informasi, Interaksi dan umpan balik, Komponen, Panduan Desain — Cash Flow, Tema dan batas verifikasi

### Community 29 - "Operasi Cash Flow"
Cohesion: 0.33
Nodes (6): Backup dan pemulihan, Lingkungan dan kredensial, Migration dan startup, Observabilitas dan batas operasi, Operasi Cash Flow, Penghapusan akun

### Community 30 - "app.ts"
Cohesion: 0.21
Nodes (17): createApp(), Config, configFromEnv(), createAuth(), Mail, gmailConfigFromEnv(), secret(), accountDeletionPage() (+9 more)

### Community 31 - "access.ts"
Cohesion: 0.24
Nodes (15): access(), Actor, canonical(), mutate(), read(), transaction(), apps_api_src_db_database, apps_api_src_db_poolclient (+7 more)

### Community 32 - "Status implementasi Cash Flow"
Cohesion: 0.40
Nodes (5): Fitur yang tersedia, Gate sebelum publik, Implementasi yang lebih sederhana dari rancangan awal, Pemeriksaan yang telah dijalankan, Status implementasi Cash Flow

### Community 33 - "Cash Flow"
Cohesion: 0.40
Nodes (5): Cash Flow, Menjalankan lokal, Pemeriksaan, Pratinjau browser, Struktur

### Community 34 - "Riset Sumber Publik untuk Impor Notifikasi Transaksi"
Cohesion: 0.33
Nodes (5): Field kandidat dan aturan keselamatan, Kesimpulan, Rekap per provider, Rekomendasi langkah berikutnya, Riset Sumber Publik untuk Impor Notifikasi Transaksi

### Community 38 - "PRODUCT.md"
Cohesion: 0.29
Nodes (4): Artefak untuk ditinjau, Eksplorasi visual Cash Flow, Keuangan Rumah Tangga, Language

### Community 39 - "Riset Export Statement Provider untuk Impor Transaksi"
Cohesion: 0.33
Nodes (5): Batas penting, Kesimpulan, Rekap, Rekomendasi produk, Riset Export Statement Provider untuk Impor Transaksi

### Community 41 - "reports.ts"
Cohesion: 0.17
Nodes (13): Context, accounts(), csv(), csvCell(), period(), summary(), transactions(), apps_mobile_src_transaction_import_notificationdraft (+5 more)

### Community 42 - "gmail.ts"
Cohesion: 0.23
Nodes (15): beginGmailAuthorization(), challenge(), decrypt(), digest(), encrypt(), finishGmailAuthorization(), gmail(), GmailConfig (+7 more)

### Community 43 - "Usulan Impor Notifikasi Transaksi Gmail"
Cohesion: 0.29
Nodes (6): Batas rekomendasi, Implikasi Gmail, Keputusan, Kriteria penerimaan sebelum rilis, Rancangan teknis bila tahap koneksi Gmail disetujui, Usulan Impor Notifikasi Transaksi Gmail

### Community 44 - "server.ts"
Cohesion: 0.18
Nodes (10): { Pool }, syncGmailConnections(), pool, config, gmailTimer, pool, timer, transport (+2 more)

## Knowledge Gaps
- **321 isolated node(s):** `name`, `version`, `private`, `type`, `build` (+316 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 353 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Desain Database — Cash Flow` connect `Desain Database — Cash Flow` to `README.md`, `access.ts`?**
  _High betweenness centrality (0.207) - this node is a cross-community bridge._
- **Why does `3. Konvensi` connect `access.ts` to `fail`, `Desain Database — Cash Flow`?**
  _High betweenness centrality (0.195) - this node is a cross-community bridge._
- **Why does `uuid()` connect `access.ts` to `fail`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _321 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ui.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07730496453900709 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._
- **Should `mobile/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._