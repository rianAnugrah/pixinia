# Pixinia

Platform komik bercabang berbasis Next.js dan Supabase. Repo ini sedang dikonversi dari situs company profile. Implementasi saat ini mencakup katalog, cerita contoh delapan node, reader pilihan, Auth, progres, dan form dasar untuk membuat cerita/node/choice draft. Produksi AI, motion comic, entitlement premium, pembayaran, dan publikasi editorial masih perlu diselesaikan sebelum aplikasi memenuhi seluruh plan.

## Setup lokal

1. Gunakan Node.js yang kompatibel dengan Next.js 15.5 dan pnpm. Jalankan `pnpm install`.
2. Salin `.env.example` ke `.env.local` dan isi URL serta publishable key proyek Supabase development. Jangan commit `.env.local`.
3. Terapkan migrasi dalam `supabase/migrations/` berurutan pada proyek development, lalu jalankan `supabase/seed.sql`.
4. Konfigurasikan redirect Auth Supabase untuk URL lokal, preview, dan production.
5. Jalankan `pnpm dev`; buka `http://localhost:3000`.
6. Jalankan `pnpm typecheck`, `pnpm lint`, dan `pnpm build` sebelum deploy.

Skema awal hanya memberi staff izin membuat konten draft. Publikasi seed dilakukan oleh migrasi/SQL admin. Jangan memberi editor akses update status langsung dari browser. Pembaca menggunakan RPC `start_story` dan `apply_story_choice` untuk progres. Admin pertama dipromosikan dengan SQL setelah akun emailnya terverifikasi.

Rencana lengkap: [CONVERSION_INSTRUCTIONS.md](CONVERSION_INSTRUCTIONS.md). Status implementasi dan kekurangan: [docs/implementation-status.md](docs/implementation-status.md). Dokumen plan asli ada di `docs/reference/`.

Instruksi pekerjaan berikutnya untuk GPT-6 Sol: [gambar per chapter di Studio](docs/studio-image-instructions.md), mencakup upload manual, generate AI, urutan gambar, preview, review/publish, dan deployment.
