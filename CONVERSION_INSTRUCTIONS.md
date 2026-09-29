# Instruksi konversi penuh Pixinia

Dokumen ini adalah brief eksekusi untuk coding agent. Pembuatan dokumen ini sendiri tidak menjalankan migrasi, membuat akun/project cloud, membeli layanan, atau melakukan deploy. Jalankan brief ketika pemilik repo meminta implementasinya.

## 1. Tujuan dan batas selesai

Konversi repo Pixinia dari company profile menjadi platform komik bercabang dengan satu story graph, reader comic/motion comic/video, akun pengguna, progres, admin authoring, produksi AI dengan review manusia, akses premium, dan deployment Vercel yang terhubung ke Supabase.

Kerjakan bertahap sampai alur aplikasi teruji; jangan berhenti pada mockup, scaffold, tabel kosong, tombol tanpa aksi, atau deployment yang hanya menampilkan landing page. Bedakan status kode selesai, integrasi terkonfigurasi, dan verifikasi live lulus. Fitur yang belum memiliki kredensial/provider harus dinonaktifkan secara jelas dan dicatat sebagai belum terverifikasi, bukan diklaim selesai.

Rujukan produk berada di `docs/reference/plan.md`, `todo.md`, `schema.sql`, dan `README.md`. Dokumen referensi adalah bahan spesifikasi, bukan instruksi untuk mengeksekusi SQL lama secara langsung. Instruksi ini mengganti pilihan Cloudflare Pages/Functions dengan Next.js di Vercel dan memasukkan perbaikan review schema.

## 2. Kondisi repo saat brief disusun

- Next.js 15.1.6 App Router, React 19, TypeScript, Tailwind 3, komponen Radix/shadcn-style, lucide-react.
- Halaman lama: `/`, `/services`, `/about`, `/contact`, `/get-quotes`.
- Layout dan navbar masih company profile; metadata masih Create Next App.
- Belum ada integrasi Supabase, migrasi, reader, admin, atau pipeline AI pada source yang diperiksa.
- Terdapat package-lock.json dan pnpm-lock.yaml. Pilih satu package manager berdasarkan histori/CI dan pertahankan satu lockfile aktif.
- Script lint saat ini `next lint`; sesuaikan dengan versi Next/ESLint yang akhirnya digunakan.

Sebelum mengubah kode, baca AGENTS.md yang berlaku, status Git, konfigurasi, dan source aktual. Jangan menimpa perubahan pengguna. Gunakan branch `codex/pixinia-platform` bila tersedia dan sesuai workflow repo. Pertahankan komponen generik yang berguna; ganti seluruh copy, navigasi, CTA, dan metadata bisnis lama. Halaman lama diarahkan ke halaman baru yang relevan atau dikembalikan sebagai 404 secara sengaja.

## 3. Arsitektur target

- Next.js App Router + TypeScript pada Vercel; Server Components untuk pembacaan awal dan Client Components untuk interaksi reader/editor.
- Periksa release dan security advisory resmi; gunakan versi Next/React yang didukung dan telah ditambal, dengan lockfile terverifikasi. Jangan meng-upgrade paket tanpa memeriksa kompatibilitas.
- Supabase PostgreSQL, Auth, Storage, migrasi berversi, generated database types.
- `@supabase/ssr` untuk session cookie; client browser, client server beridentitas pengguna, serta client administratif server-only dipisahkan.
- Route Handlers/Server Actions untuk operasi privileged. Validasi identitas dan role pada setiap operasi; proteksi halaman admin saja tidak cukup.
- Postgres menjadi sumber state job. Pilih satu durable queue/workflow runner yang dapat berjalan dengan Vercel, catat keputusan dan batas paket yang digunakan.
- Proses render video/FFmpeg berjalan pada worker/container atau media rendering service terpisah. Vercel hanya menerima permintaan, menjadwalkan, dan menerima callback; jangan menunggu render berat dalam satu request HTTP.
- OpenRouter untuk teks/JSON. Provider gambar, audio, dan video memakai adapter terpisah sesuai kemampuan API sebenarnya.
- Bahasa UI default Indonesia; brand Pixinia. Mobile-first, akses keyboard, kontras memadai, alt text, reduced motion, loading/error/empty states.

## 4. Inventaris akses dan provisioning

Pada awal eksekusi, periksa koneksi Supabase/Vercel dan CLI yang tersedia. Verifikasi identitas akun, organization/team, project existing, dan domain sebelum membuat resource. Gunakan project existing hanya setelah diketahui memang milik aplikasi ini; jangan memodifikasi project lain.

Jika informasi belum dapat ditemukan, tanyakan secara ringkas: organization Supabase, team Vercel, region, batas biaya, akun admin awal, dan provider eksternal yang akan diaktifkan. Sambil menunggu, lanjutkan pekerjaan lokal yang tidak tergantung akses tersebut. Jangan minta secret ditempel dalam chat; gunakan login/integrasi atau secret environment.

Provisioning yang harus diselesaikan saat implementasi diotorisasi:

1. Buat/link project Supabase development dan production yang terpisah. Pilih region dekat audiens dan runtime aplikasi jika tersedia. Rekam project reference non-secret.
2. Buat/link project Vercel untuk repo ini pada team yang benar; preset Next.js dan root directory repo.
3. Development dan Preview menggunakan Supabase development; Production menggunakan Supabase production. Jangan membiarkan preview biasa menulis data production.
4. Konfigurasikan Auth Site URL dan redirect URL sesuai environment, callback, reset password, dan domain aktual. Batasi pola wildcard preview ke domain yang dikuasai proyek.
5. Atur email confirmation dan SMTP produksi yang berfungsi; uji kirim/terima email. Jangan menonaktifkan konfirmasi hanya agar demo lolos.
6. Bootstrap admin melalui jalur administratif terkontrol. Pengguna biasa tidak boleh memilih role saat signup.
7. Siapkan bucket, policy, batas ukuran/MIME upload, dan seed assets yang hak penggunaannya jelas.

Pilih resource dalam batas biaya yang telah diotorisasi. Jika perlu upgrade berbayar atau keputusan biaya belum ada, selesaikan persiapan dan laporkan pilihan konkret sebelum pembelian. Login interaktif, billing, dan verifikasi domain bisa membutuhkan tindakan pemilik akun; catat blocker secara spesifik.

## 5. Database dan keamanan wajib

Jadikan schema referensi sebagai titik awal; buat migrasi baru dengan CLI, bukan menjalankan file itu apa adanya pada production. Terapkan grant eksplisit bersama RLS dan test allow/deny. Gunakan migrasi forward yang terurut; uji reset/replay database kosong dan upgrade database berisi data. Jangan reset production.

Perbaikan wajib:

1. Progress: tutup direct insert/update node, history, dan completion dari browser. Sediakan start/read/apply-choice/restart/change-format melalui operasi tervalidasi. Jika memakai RPC privileged, batasi EXECUTE dan validasi auth.uid, akses cerita, serta input di fungsi; jangan sekadar mengganti menjadi SECURITY DEFINER tanpa kontrol. Jika memakai server endpoint, jangan menerima user_id dari client sebagai otoritas.
2. Start: tepat satu start node sebelum cerita diterbitkan. Progres pertama dimulai dari start node, bukan choice arbitrer.
3. Choice: terapkan atomik dengan penguncian/conditional update, idempotency request, dan expected progress version. Source harus sama dengan posisi pengguna, source/target published, same-story, entitlement valid, dan condition terpenuhi. Dua tab tidak boleh menghasilkan histori yang kontradiktif. Definisikan DSL kondisi terbatas; jangan eval kode dari JSON.
4. Ending: isi completed_at saat mencapai ending; tentukan aturan restart/replay dan simpan riwayat run secara jelas. Pertimbangkan tabel progress events terpisah agar JSON tidak tumbuh tanpa batas.
5. FK progress: jangan SET NULL pada story_id yang NOT NULL. Gunakan pengosongan current_node_id saja jika versi Postgres mendukung, atau cleanup eksplisit yang diuji termasuk cascade deletion.
6. Publication: semua akses node/asset/panel memeriksa status parent yang relevan. Choice dengan target yang belum dapat diakses tidak boleh tampil sebagai pilihan valid.
7. Entitlement: pisahkan visibility public/unlisted/private dari access free/premium. Unlisted tidak ada di katalog tetapi aturan akses link harus eksplisit; private tetap restricted. Periksa starts_at, expires_at, revocation, dan purchase/refund state secara server-side. Jangan bergantung pada slug/path rahasia.
8. Publish dilakukan melalui satu operasi terkontrol: validasi graph, asset readiness, approval, dan revision/hash. Staff tidak boleh melewati aturan dengan update status langsung. Perubahan konten membatalkan approval versi lama. Pisahkan hak editor dan publisher/admin.
9. Policy progress yang dibuat harus memiliki nama konsisten; jangan meninggalkan CREATE POLICY duplikat pada skrip yang diklaim aman diulang.
10. Metadata internal, prompt, biaya, dan catatan reviewer tidak ikut terbaca publik hanya karena asset published; pisahkan data publik dan internal.
11. Role management memakai endpoint administratif yang diaudit. RLS tidak menggantikan column grant; admin aplikasi tetap menggunakan role database authenticated pada request biasa.
12. Job/project/story/node/approval harus konsisten. Tambahkan constraint, validasi waktu entitlement, positive media dimensions, dan index untuk query aktual.

Model media: satu asset merepresentasikan satu file/output rendition. Panel adalah posisi dalam comic rendition suatu node/revision, mereferensikan image asset, dengan dialogue/caption/alt text dan unique ordering per rendition. Jangan membuat model yang mengharuskan satu gambar berisi semua panel. Job pending disimpan sebelum file ada; asset final dibuat saat lokasi valid tersedia atau gunakan constraint lifecycle yang eksplisit.

Storage: review/premium dalam private bucket dan signed URL singkat setelah cek akses. Bila publik memakai public bucket, implementasikan unpublish/revocation terhadap file dan cache, atau gunakan private bucket dengan delivery terkontrol untuk aset yang membutuhkan pencabutan. RLS tabel aplikasi tidak melindungi URL public bucket.

## 6. Aplikasi yang harus dibuat

Route minimum:

- `/`: katalog/featured stories, filter/search/pagination yang bekerja.
- `/stories/[slug]`: cover, sinopsis, format tersedia, mulai/lanjutkan, akses premium bila relevan.
- `/read/[slug]/[nodeKey]`: panel berurutan, caption/dialogue, pilihan, ending, replay, switch format tanpa kehilangan posisi.
- `/login`, `/signup`, `/forgot-password`, `/reset-password`, callback Auth.
- `/library`: progres, histori run, ending ditemukan, akses yang dimiliki.
- `/account`: profil, session/sign-out, status akses.
- `/admin`: ringkasan editorial dan produksi.
- `/admin/stories`: CRUD stories/nodes/choices/panels/media, reorder, upload, preview, graph validation, submit review/publish/unpublish.
- `/admin/production`: projects, brief/bible, jobs, attempt logs, retry/cancel, approvals/revisions, budgets, provider settings non-secret, pause controls.

Admin authoring boleh berupa form/list; visual graph editor bukan syarat rilis. Semua tombol utama harus memiliki aksi nyata, validasi input, feedback kegagalan, dan authorization. Gunakan transaksi untuk operasi yang harus konsisten. Lindungi authenticated responses dari cache bersama yang dapat mencampurkan data pengguna.

Seed satu cerita orisinal 8–12 node, minimal dua cabang, satu jalur yang bertemu kembali, dan dua ending. Isi panel serta teks yang benar-benar dapat dibaca; gunakan ilustrasi berlisensi atau buatan sendiri. Seed harus idempotent dan tidak menggandakan cerita/file ketika dijalankan ulang.

## 7. Produksi AI, motion comic, dan akses berbayar

Implementasikan stage sesuai plan: brief → outline → graph validation → script → storyboard → asset prompts → asset generation → validation → assembly → quality review → publish → analytics.

- Durable jobs: atomic claim, lease expiry, heartbeat, fencing token untuk mencegah worker lama menulis hasil, bounded attempts, timeout, exponential backoff+jitter, dead letter, cancellation, dan recovery.
- Idempotency untuk enqueue, panggilan provider jika didukung, upload, callback, serta publish. Rekonsiliasi provider request ID setelah timeout; jangan langsung menggandakan panggilan berbayar.
- Simpan attempt terpisah: provider/model, prompt version, request ID, timestamps, output reference, error teredaksi, estimate/actual cost.
- Reservasi anggaran atomik sebelum call berbayar; rekonsiliasi sesudahnya termasuk kegagalan yang tetap ditagih. Terapkan per-job, per-project/story, harian, bulanan, dan batas concurrency/provider. Tentukan timezone periode budget.
- Pause global/project/provider harus diperiksa sebelum efek eksternal; dashboard menjelaskan pekerjaan in-flight yang mungkin sudah dikenai biaya.
- Model/provider allowlist; output divalidasi schema; URL download divalidasi untuk mencegah SSRF. Teks model tidak boleh menjalankan shell atau menentukan tool/provider arbitrer.
- Gate manusia untuk bible/outline, script/storyboard, key art, dan final episode. Catat reviewer, revision, waktu, keputusan, dan alasan; audit jangan dapat diedit bebas.
- Adapter provider harus punya implementasi nyata untuk provider yang dipilih. Test stub hanya untuk testing dan harus terpisah dari runtime produksi.
- Motion comic: render pan/zoom/transisi deterministik, preview rendah resolusi, subtitles, audio bila tersedia/haknya valid, output/poster final. Uji satu render nyata pada worker yang telah dideploy, bukan hanya lokal.
- Playback premium memerlukan entitlement dan token berumur pendek dari provider yang mendukung authenticated playback. Jangan memakai YouTube Unlisted sebagai proteksi premium.
- Pembayaran: pilih provider berdasarkan negara/bisnis pengguna; sandbox checkout, signed webhook, event deduplication, grant/revoke entitlement, refund/reversal, dan reconciliation. Harga dan hak akses ditentukan server. Aktivasi live setelah konfigurasi merchant nyata siap; jangan melakukan pembelian nyata untuk test.
- Analytics dasar: completion, choice distribution, ending discovery, generation cost dan duration. Hindari PII/secret dalam logs.

Phase 3 dalam plan (multi-provider, localization, voice/sound, creator tools, campaign calendar) tetap dicatat sebagai perluasan setelah rilis inti. Jangan menyatakan seluruh plan selesai bila perluasan tersebut belum dikerjakan. Fitur inti lengkap mencakup reader/admin, pipeline AI teruji, motion comic, dan entitlement/payment integration sesuai akses provider yang tersedia.

## 8. Environment dan deploy Vercel

Buat `.env.example` tanpa nilai rahasia dan izinkan file ini secara spesifik di .gitignore. Pisahkan variabel menurut pemakai:

- Publik: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Server-only: `SUPABASE_SECRET_KEY` atau legacy service-role key sesuai project, `OPENROUTER_API_KEY`, provider image/audio/video keys, webhook secrets, cron/worker auth secret, payment secret, site origin sesuai environment.
- Provisioning/CI saja: token manajemen Supabase/Vercel dan database credential bila diperlukan. Jangan memasukkannya ke client bundle atau runtime jika tidak dibutuhkan.

Nama variabel tambahan mengikuti adapter nyata. Tidak boleh ada secret, connection string, bearer token, signed URL, atau password dalam commit/log/laporan. Buat validasi env server/client terpisah. Missing core env menghasilkan error konfigurasi yang jelas; bukan diam-diam beralih ke data palsu.

Alur deploy:

1. Verifikasi CLI/tool dan account/project linking; baca help versi aktual sebelum perintah provisioning/migrasi/deploy.
2. Terapkan migrasi dan seed ke development; jalankan integration/RLS/storage tests.
3. Konfigurasikan Vercel Development/Preview, deploy preview, uji alur aplikasi dengan Supabase development.
4. Siapkan production database/bucket/auth/env serta backup/restore procedure. Migrasi additive/backward-compatible dahulu; hindari migration destruktif otomatis.
5. Build deployment dengan environment Production dan Supabase production, lalu jalankan smoke test. Jangan langsung promote preview yang dibangun dengan `NEXT_PUBLIC_*` milik development; variabel publik terikat saat build.
6. Deploy production ketika cek lulus dan deployment memang diotorisasi. Domain default Vercel cukup jika custom domain belum dikonfigurasi; perubahan DNS membutuhkan domain target yang jelas.
7. Uji ulang signup/email, login, katalog, reader, progres, admin access, upload, publish, signed media, dan jobs pada URL final. Periksa runtime errors/logs.
8. Hubungkan Git deployment atau CI yang sesuai, tambahkan quality gates, dokumentasikan rollback aplikasi serta recovery database. Rollback aplikasi tidak otomatis membatalkan migrasi database.

Gunakan batas durasi/memori/runtime Vercel dari dokumentasi saat implementasi. Scheduler hanya menjadwalkan; bukan loop tanpa akhir. Queue/worker/render service juga harus dideploy dan diuji jika fitur tersebut dinyatakan live.

## 9. Urutan pekerjaan dan pengujian

Milestone A: audit repo, baseline build/lint, keputusan arsitektur, provisioning development, schema/RLS/storage.

Milestone B: Auth, katalog, reader, progress, admin authoring, seed lengkap; deploy preview lalu rilis inti yang dapat dipakai. Ini checkpoint, bukan alasan berhenti bila scope penuh masih berlangsung.

Milestone C: production jobs, budget reservation, OpenRouter dan image adapter, approvals, dashboard; uji satu produksi comic end-to-end.

Milestone D: deploy render worker, motion comic/playback, entitlement, payment sandbox; aktifkan provider/live features sesuai konfigurasi nyata.

Milestone E: production rollout, monitoring, recovery documentation, bukti pengujian, dan daftar jelas fitur plan Phase 3 yang tersisa.

Test wajib yang membuktikan behavior:

- Typecheck, ESLint, production build, dan dependency/security review yang relevan.
- Database kosong dapat dimigrasikan; upgrade tidak kehilangan data; seed tidak menggandakan isi.
- RLS/grants dengan anon, reader A/B, editor, admin; cross-user access, role escalation, direct progress mutation, draft assets, expired/revoked entitlement ditolak.
- Story graph: same-story edges, exactly one published start, reachable endings, unintended dead ends; siklus hanya bila disengaja.
- Reader: semua jalur seed, refresh/relogin, dua tab, duplicate choice retry, ending/replay, pergantian format.
- Publish gagal tanpa approval terbaru; perubahan asset/script membatalkan approval; unpublish benar-benar mencabut akses sesuai kebijakan delivery.
- Storage: akses URL langsung, MIME/size upload, signed URL expiry dan unauthorized signing.
- Worker: duplicate delivery, crash sebelum/sesudah provider call, lease expiry, stale worker, timeout/rate limit, invalid output, cost cap race, pause, rejected review.
- Pembayaran: webhook palsu/duplikat/out-of-order, entitlement expiry/refund, checkout cancelled.
- E2E mobile dan desktop, accessibility dasar, empty/error states, production smoke tests; gunakan fixture deterministik untuk CI dan verifikasi provider live yang terpisah.

## 10. Deliverables dan laporan akhir

Simpan source aplikasi, migrasi, seed, bucket policies, DB types, tests, worker source/config, `.env.example`, README setup, architecture decisions, deployment runbook, dan operations runbook dalam repo. Catat progres dan blocker aktual dalam `docs/implementation-status.md`.

Laporan akhir wajib mencantumkan URL preview/production, project reference non-secret, migration terakhir, commit/deployment yang diuji, hasil test nyata, daftar provider yang terhubung, satu contoh cerita/produksi terverifikasi, serta kekurangan atau tindakan akun yang masih diperlukan. Jangan menyebut aplikasi production-ready hanya karena build sukses.

## Referensi teknis resmi

- Supabase SSR: https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase environments: https://supabase.com/docs/guides/deployment/managing-environments
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage: https://supabase.com/docs/guides/storage/buckets/fundamentals
- Vercel environments: https://vercel.com/docs/deployments/environments
- Vercel function limits: https://vercel.com/docs/functions/limitations
- PostgreSQL constraints: https://www.postgresql.org/docs/current/ddl-constraints.html

Verifikasi dokumentasi saat implementasi. Contoh middleware/proxy harus sesuai versi Next.js yang benar-benar terpasang.
