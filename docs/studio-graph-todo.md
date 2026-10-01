# TODO eksekusi — Pixinia Studio Graph

Status: **implementasi inti sudah tersedia di development; QA dan beberapa kemampuan lanjutan masih terbuka**. Plan: [studio-graph-plan.md](studio-graph-plan.md). Referensi: [gambar target](reference/studio-graph-target.png). Rincian bukti dan batas: [implementation-status.md](implementation-status.md).

Aturan: tandai `[x]` hanya setelah implementasi dan bukti lulus. Catat path tes/screenshot, migration, hasil command atau deployment pada log di bawah; blocked/skipped tidak dihitung selesai. Ikuti urutan dependensi P0 → P1 → P2 → P3 → P4 → P5.

## P0 — Audit dan baseline

- [ ] P0.1 Baca instruksi repo, plan ini, status implementasi, schema/migrations dan seluruh dirty diff; pertahankan perubahan pengguna.
- [ ] P0.2 Verifikasi project development/production, Vercel project dan alias tetap; inventaris nama env tanpa nilainya.
- [ ] P0.3 Verifikasi role admin development dan perilaku editor; jangan membuat ulang akun/password.
- [ ] P0.4 Catat jumlah/ID cerita, node, pilihan, image sets, progress dan status migration sebagai baseline.
- [ ] P0.5 Audit graph existing: start, ending, siklus, kondisi pilihan, media legacy, relasi progress.
- [ ] P0.6 Jalankan baseline typecheck/lint/build; bedakan masalah existing dari regresi baru.
- [ ] P0.7 Ambil baseline Studio desktop/mobile dan konfirmasi sisa budget sebelum tes AI nyata.

Gate: baseline dan setiap perbedaan dari plan tercatat sebelum perubahan schema.

## P1 — Data, kontrak, keamanan

- [ ] P1.1 Finalisasi diagram relasi episode/draft/node/choice/publication dan DTO, berdasarkan kolom aktual.
- [ ] P1.2 Buat migration baru lewat CLI untuk tabel/index/constraints/version; jangan edit migration terapan.
- [ ] P1.3 Backfill satu Episode 1 per story dan snapshot draft dari node/choice existing, menjaga semua ID/key/kondisi/progres.
- [ ] P1.4 Terapkan RLS staff-only untuk data editorial; validasi grants/RPC auth/role/search_path.
- [ ] P1.5 Implementasikan GET graph dengan counts batch dan signed thumbnails; tidak ada N+1.
- [ ] P1.6 Implementasikan antrean mutasi server atomik, expectedVersion, mutationId/idempotency, error typed.
- [ ] P1.7 Implementasikan validasi same-story/same-draft, start unik, input bounds dan urutan choice.
- [ ] P1.8 Implementasikan publish projection transaction + snapshot audit; editor ditolak, admin diperbolehkan.
- [ ] P1.9 Tolak delete/rename key node published; hapus draft dengan referensi secara aman.
- [ ] P1.10 Uji backfill dan pembacaan publik sebelum/sesudah, RLS langsung, konflik dua writer dan rollback transaksi.

Gate: data lama utuh; draft tidak bisa dibaca publik; mutasi gagal tidak meninggalkan state parsial.

## P2 — Shell dan graph visual

- [ ] P2.1 Pisahkan layout publik dan Studio tanpa perubahan URL/metadata/Auth redirect.
- [ ] P2.2 Implementasikan token dark theme, topbar, sidebar dan inspector mengikuti screenshot.
- [ ] P2.3 Tambah dependency graph/layout yang kompatibel dan commit lockfile saat commit diotorisasi.
- [ ] P2.4 Render graph node/edge nyata dengan key, thumbnail, counts, badge dan pilihan berlabel.
- [ ] P2.5 Tambah zoom/fit/fullscreen/minimap/auto-layout dengan empty/error/loading state.
- [ ] P2.6 Hubungkan pemilihan node ke inspector dan deep link query; response lama tidak mengganti selection baru.
- [ ] P2.7 Tambah episode list/filter, whole-story view dan tautan lintas episode.
- [ ] P2.8 Tambah daftar Scenes sebagai fallback keyboard/mobile dan pencarian cerita/node.
- [ ] P2.9 Pastikan shell 1536/1280/390 px berfungsi tanpa overflow atau panel saling menutup.

Gate: workspace menyerupai komposisi referensi dengan data repo, semua menu aktif menuju fitur nyata.

## P3 — Editor graph

- [ ] P3.1 CRUD node draft: title/key/synopsis/type/start/tags/private notes, empty validation.
- [ ] P3.2 Create/edit/reconnect/delete/reorder choice, label/target/color dan kondisi existing dipertahankan.
- [ ] P3.3 CRUD/reorder episode dan perpindahan node antarepisode yang atomik.
- [ ] P3.4 Simpan posisi drag-end sebagai batch; auto-layout tidak mengubah konten/choice.
- [ ] P3.5 Autosave debounce, satu mutation queue, save status, retry, navigation dirty guard.
- [ ] P3.6 Tangani konflik dua tab (409), session expiry, offline dan request terlambat tanpa hilangnya input.
- [ ] P3.7 Undo/redo editorial via inverse operation; pengecualian publish/AI/storage jelas.
- [ ] P3.8 Validator reachability/start/ending/cycles/cross-story/duplicates dengan tautan ke node bermasalah.
- [ ] P3.9 Uji create → edit → reload → posisi/metadata/urutan benar, termasuk pilihan menuju episode lain.

Gate: semua edit round-trip server dan reload; graph invalid tidak dapat diterbitkan.

## P4 — Media, AI, preview, publication

- [ ] P4.1 Embed editor panel dalam drawer, pertahankan route standalone lama.
- [ ] P4.2 Thumbnail/counts mengikuti draft atau published secara jelas, mendukung seed legacy.
- [ ] P4.3 Preview node memakai komponen reader reusable dan akses draft staff-only.
- [ ] P4.4 Pustaka media cerita: filter asal/status/node, navigasi ke panel asal, loading dan error.
- [ ] P4.5 Reuse upload/finalize/reorder/metadata/image-publish APIs; tangani sukses parsial/retry/idempotency.
- [ ] P4.6 Integrasikan AI form/jobs provider capabilities, budget tersisa, refresh status, retry aman.
- [ ] P4.7 OpenRouter unavailable jika belum configured; Higgsfield tidak menawarkan generation palsu.
- [ ] P4.8 Review perubahan dan daftar validasi sebelum Terbitkan struktur cerita; status panel terpisah.
- [ ] P4.9 Publish atomik memperbarui reader, tidak membocorkan notes/prompt/draft, tidak memutus progress lama.
- [ ] P4.10 Uji published graph tetap sama selama edit draft, gagal publish rollback, sukses publish cabang baru terbaca.

Gate: graph, panel, job dan reader terhubung; tidak hanya UI dummy. Tandai tes provider nyata terpisah dari mock.

## P5 — QA dan deployment Preview

- [ ] P5.1 Tambah dan jalankan unit graph validator + integration permissions/version/idempotency/publication tests.
- [ ] P5.2 Jalankan regresi katalog/Auth/mulai cerita/pilihan/progres/ending dan media API.
- [ ] P5.3 Uji seluruh indikator tunggu, cached/new src image, error/retry dan duplicate-click protection.
- [ ] P5.4 Uji keyboard, focus dialogs, reduced motion, mobile list fallback dan ukuran target klik.
- [ ] P5.5 Uji graph 100 node/150 choices dan periksa fetch/render berlebihan saat drag/selection.
- [ ] P5.6 Simpan screenshot desktop 1536×1024, 1280×800, mobile 390×844; cek console/network errors aplikasi.
- [ ] P5.7 Catat uji file picker browser skipped sesuai instruksi pengguna; laporkan bukti integrasi penggantinya.
- [ ] P5.8 Jalankan typecheck/lint/build + tests; perbaiki regresi, dokumentasikan warning existing.
- [ ] P5.9 Terapkan migration development dan verifikasi data/RLS; backup atau snapshot sesuai perubahan aktual.
- [ ] P5.10 Deploy memakai environment Preview; tunggu READY dan uji app sebelum memindah alias.
- [ ] P5.11 Arahkan `preview.pixinia.web.id` ke build sehat, cek auth/Studio/reader melalui alias tersebut.
- [ ] P5.12 Hapus hanya Preview lama setelah verifikasi; pastikan tepat satu Preview aktif, production utuh.
- [ ] P5.13 Update implementation-status, catat source/build/migrations/rollback dan laporan fitur serta batas tes.

Gate akhir: seluruh rilis inti berjalan di URL tetap dengan bukti. Jangan menyatakan E2E upload/AI nyata lulus jika belum dijalankan.

## Backlog lanjutan — bukan blocker rilis inti

- [ ] L1 Characters: schema per story, profil/referensi privat, node-character linking, CRUD dan RLS; adapter provider hanya menerima referensi jika didukung.
- [ ] L2 Translations: locale dan sumber versi, terjemahan title/dialogue/choice, review stale translation dan publish locale.
- [ ] L3 Analytics: spesifikasi event consent/retensi, agregasi read/choice/ending per story, akses staff, metrik nyata.
- [ ] L4 Kolaborasi realtime: presence, locking/merge dan audit; tidak mengganti version check yang sudah ada.
- [ ] L5 Publish lintas graph+panel sebagai satu release snapshot jika diminta; rilis inti memakai dua lifecycle eksplisit.

## Log eksekusi (diisi pelaksana)

| ID/tanggal | Status | Perubahan dan bukti | Hambatan/tindak lanjut |
|---|---|---|---|
| Penyusunan 2026-09-30 | Dokumen siap | Plan, TODO, handoff dan screenshot tersimpan | Implementasi menyusul |
| Eksekusi 2026-09-30 | Sebagian selesai | Graph React Flow, draft/version/idempotency dan publish RPC, RLS, preview draft, tes validator dan deployment Preview awal | Checklist rinci di atas masih audit terbuka; uji upload browser dan request AI berbayar tidak dilakukan |
