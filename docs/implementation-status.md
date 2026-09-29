# Status implementasi Pixinia

Tanggal: 29 September 2026.

## Sudah dibuat

- Dua project Supabase pada organisasi Pixinia, region Singapore:
  - development: `avvkbocpqkquzbsvaoeb`
  - production: `etdjnilavmdugyzufmex`
- Migrasi development: `initial_schema`, `function_privileges`, `editorial_guards`.
- Seed development `Arsip Senja`: 8 node, 10 pilihan, 2 ending, 8 panel ilustrasi SVG orisinal.
- Next.js 15.5.26, React 19.3.0, SSR Supabase, katalog, halaman cerita, reader, Auth, pustaka, akun, dan studio dasar untuk draft.
- Existing Vercel project `pixinia-web-id` telah ditemukan. Environment Production menunjuk proyek Supabase production; Preview dan Development menunjuk development.
- Build produksi dan typecheck lulus. Smoke test lokal `/`, `/stories/arsip-senja`, dan `/read/arsip-senja/jam-keenam` mengembalikan HTTP 200 dan konten seed.
- Deployment preview berhasil: https://pixinia-web-dl3fq3qya-riananugrahs-projects.vercel.app. Smoke test katalog melalui Vercel CLI berhasil; pengujian browser Auth/Studio lengkap belum dilakukan.
- Redirect Auth development untuk localhost dan preview tersebut sudah disimpan. SMTP belum diverifikasi.
- Pengguna mengonfirmasi akun admin `asnara.dev@gmail.com` sudah tersedia. Keberadaan/role perlu diverifikasi kembali pada environment target, terutama production.

## Belum selesai / belum terverifikasi

- Pengujian end-to-end signup/login/progres dan Studio dengan pengguna nyata.
- Konfigurasi Auth redirect/SMTP untuk URL deploy akhir.
- CRUD lengkap, upload media, graph validation, review, publish/unpublish terkontrol.
- Pipeline AI, provider gambar, render motion comic, pembatasan biaya, entitlement, pembayaran.
- Migrasi dan seed production, verifikasi RLS lintas peran, backup/recovery.
- Status push branch terbaru, deployment production, dan smoke test alur lengkap pada URL Vercel.

Fokus pekerjaan berikutnya sesuai permintaan pengguna: [gambar per chapter di Studio](studio-image-instructions.md), melalui upload manual dan generate AI. Dokumen instruksi sudah dibuat; fitur tersebut belum diimplementasikan.

Peringatan: status ini bukan klaim bahwa seluruh plan sudah terpenuhi. Production domain `pixinia.web.id` masih melayani situs lama sampai deployment baru lolos uji dan dipromosikan.
