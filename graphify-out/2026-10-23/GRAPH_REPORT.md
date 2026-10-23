# Graph Report - cash-flow  (2026-10-23)

## Corpus Check
- 99 files · ~727,791 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .example 2, .css 1)

## Summary
- 640 nodes · 1470 edges · 36 communities (29 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a8660313`
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
- api/package.json
- Product Requirements Document — Cash Flow
- backup.mjs
- Arsitektur Sistem — Cash Flow
- Rancangan UI/UX — Cash Flow
- README.md
- 000_auth.sql
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
- Paket Desain — Ruang Bersama
- Panduan Desain — Cash Flow
- Operasi Cash Flow
- Status implementasi Cash Flow
- Cash Flow
- db-init.sh
- PRODUCT.md
- css.d.ts

## God Nodes (most connected - your core abstractions)
1. `useColors()` - 39 edges
2. `fail()` - 35 edges
3. `useApp()` - 34 edges
4. `Copy()` - 34 edges
5. `Button()` - 34 edges
6. `Screen()` - 27 edges
7. `react` - 25 edges
8. `LoadState()` - 24 edges
9. `Title()` - 21 edges
10. `Field()` - 21 edges

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

## Communities (36 total, 7 thin omitted)

### Community 0 - "ui.tsx"
Cohesion: 0.08
Nodes (103): AuditField, AuditScreen(), entities, fields(), kinds, names, value(), apps_mobile_app_global (+95 more)

### Community 1 - "fail"
Cohesion: 0.07
Nodes (65): access(), Actor, audit(), canonical(), Context, existing(), mutate(), owner() (+57 more)

### Community 2 - "package.json"
Cohesion: 0.06
Nodes (35): devDependencies, @playwright/test, prettier, tsx, @types/node, typescript, engines, node (+27 more)

### Community 3 - "mobile/package.json"
Cohesion: 0.07
Nodes (26): devDependencies, @types/react, better-auth, @better-auth/expo, @cashflow/contracts, main, name, private (+18 more)

### Community 4 - "001_domain.sql"
Cohesion: 0.17
Nodes (26): account_effects, audit_events, audit_page, budgets, categories, category_active_name, check_household_owner(), deletion_requests (+18 more)

### Community 5 - "Desain Database — Cash Flow"
Cohesion: 0.10
Nodes (25): budgets(), version(), 10. Index awal dan migrasi, 11. Validasi desain dan sumber, 1. Pilihan model, 2. ERD, 4. Identitas dan household, 5. Rekening dan kategori (+17 more)

### Community 6 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, better-auth, @better-auth/expo, @cashflow/contracts, expo, expo-constants, expo-crypto, expo-file-system (+17 more)

### Community 7 - "index.ts"
Cohesion: 0.11
Nodes (13): Account, Audit, Budget, Category, Household, Invitation, Kind, MAX_MONEY (+5 more)

### Community 8 - "expo"
Cohesion: 0.08
Nodes (23): package, web, projectId, expo, android, extra, ios, name (+15 more)

### Community 9 - "api/package.json"
Cohesion: 0.05
Nodes (36): dependencies, better-auth, @better-auth/expo, @cashflow/contracts, fastify, @fastify/cors, @fastify/rate-limit, @fastify/swagger (+28 more)

### Community 10 - "Product Requirements Document — Cash Flow"
Cohesion: 0.08
Nodes (23): Aturan keuangan dan household, Batas perubahan, Handoff, Instruksi Agen — Aplikasi Keuangan Rumah Tangga, Klarifikasi dan konteks proyek, Konteks proyek, Perbaikan bug, Perlindungan data dan database (+15 more)

### Community 11 - "backup.mjs"
Cohesion: 0.09
Nodes (16): target, ref_node_child_process, ref_node_fs, ref_node_http, ref_node_path, node-pg-migrate, ref_node_url, @playwright/test (+8 more)

### Community 12 - "Arsitektur Sistem — Cash Flow"
Cohesion: 0.17
Nodes (12): 10. Operasi, backup, dan pemulihan, 11. Validasi dan sumber, 1. Gambaran sistem, 2. Modul dan interface, 3. Struktur repository yang direncanakan, 4. Autentikasi dan trust, 5. Alur menulis transaksi, 6. Kontrak HTTP awal (+4 more)

### Community 13 - "Rancangan UI/UX — Cash Flow"
Cohesion: 0.17
Nodes (12): 10. Empty, loading, error, dan data ekstrem, 11. Kriteria tinjauan desain, 1. Arsitektur informasi, 2. Daftar layar, 3. Onboarding dan undangan, 4. Beranda dan wireframe, 5. Formulir transaksi, 6. State formulir dan koreksi bersama (+4 more)

### Community 15 - "000_auth.sql"
Cohesion: 0.36
Nodes (8): "auth_accounts", auth_accounts_userId_idx, "auth_rate_limits", "auth_sessions", auth_sessions_userId_idx, "auth_users", "auth_verifications", auth_verifications_identifier_idx

### Community 17 - "contracts/package.json"
Cohesion: 0.20
Nodes (9): main, name, private, scripts, build, typecheck, type, types (+1 more)

### Community 18 - "Cash Flow"
Cohesion: 0.20
Nodes (10): Brand Commitments, Capabilities and Constraints, Cash Flow, Evidence on Hand, Operating Context, Platform, Product Principles, Product Purpose (+2 more)

### Community 19 - "Deployment pilot di VPS dengan Traefik"
Cohesion: 0.25
Nodes (7): Catatan proxy, Deploy otomatis dari GitHub, Deploy pertama, Deployment pilot di VPS dengan Traefik, Konfigurasi environment, Pemeriksaan, Prasyarat

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

### Community 27 - "Paket Desain — Ruang Bersama"
Cohesion: 0.29
Nodes (7): Dataset contoh, Keputusan dan scope, Layar untuk ditinjau, Paket Desain — Ruang Bersama, State yang harus diterapkan, Struktur dan perilaku utama, Verifikasi token dan batas bukti

### Community 28 - "Panduan Desain — Cash Flow"
Cohesion: 0.33
Nodes (6): Arah visual, Hierarki informasi, Interaksi dan umpan balik, Komponen, Panduan Desain — Cash Flow, Tema dan batas verifikasi

### Community 29 - "Operasi Cash Flow"
Cohesion: 0.33
Nodes (6): Backup dan pemulihan, Lingkungan dan kredensial, Migration dan startup, Observabilitas dan batas operasi, Operasi Cash Flow, Penghapusan akun

### Community 32 - "Status implementasi Cash Flow"
Cohesion: 0.40
Nodes (5): Fitur yang tersedia, Gate sebelum publik, Implementasi yang lebih sederhana dari rancangan awal, Pemeriksaan yang telah dijalankan, Status implementasi Cash Flow

### Community 33 - "Cash Flow"
Cohesion: 0.40
Nodes (5): Cash Flow, Menjalankan lokal, Pemeriksaan, Pratinjau browser, Struktur

### Community 38 - "PRODUCT.md"
Cohesion: 0.29
Nodes (4): Artefak untuk ditinjau, Eksplorasi visual Cash Flow, Keuangan Rumah Tangga, Language

## Knowledge Gaps
- **294 isolated node(s):** `name`, `version`, `private`, `type`, `build` (+289 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 321 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Desain Database — Cash Flow` connect `Desain Database — Cash Flow` to `fail`, `README.md`?**
  _High betweenness centrality (0.234) - this node is a cross-community bridge._
- **Why does `3. Konvensi` connect `fail` to `Desain Database — Cash Flow`?**
  _High betweenness centrality (0.219) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _294 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ui.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08136011670968465 - nodes in this community are weakly interconnected._
- **Should `fail` be split into smaller, more focused modules?**
  _Cohesion score 0.07191358024691358 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `mobile/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._