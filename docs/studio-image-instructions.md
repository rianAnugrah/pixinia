# Instruksi GPT-6 Sol: gambar per chapter di Studio Pixinia

## Permintaan pengguna dan batas pekerjaan

Kerjakan implementasi, pengujian, dan deployment peningkatan Studio agar admin dapat menambah beberapa gambar pada setiap chapter melalui upload manual atau generate AI. Pengguna sudah mempunyai akun admin **asnara.dev@gmail.com**. Verifikasi akses akun tersebut; jangan membuat ulang akun, mengganti password, atau mempromosikan email lain.

Chapter dalam aplikasi ini adalah `story_nodes`. Selesaikan alur Studio → gambar tersimpan → review/publish → reader menampilkan gambar dalam urutan yang benar. Dokumen ini merupakan fokus pekerjaan terbaru, sedangkan `CONVERSION_INSTRUCTIONS.md` dan `docs/reference/` adalah konteks rencana lebih luas. Jangan memperluas pekerjaan ke pembayaran, motion comic, audio, atau konversi ulang seluruh aplikasi.

## Kondisi awal yang harus diperiksa kembali

- Repo: `K:\GIT\pixinia`, Next.js App Router, TypeScript, pnpm. Periksa `git status`, instruksi repo, package scripts, dan perubahan terbaru sebelum mengedit. Pertahankan pekerjaan pengguna.
- Supabase development: `avvkbocpqkquzbsvaoeb`; production: `etdjnilavmdugyzufmex`.
- Vercel project: `pixinia-web-id`. Preview yang sudah berhasil dibangun: `https://pixinia-web-dl3fq3qya-riananugrahs-projects.vercel.app`.
- Preview/Development memakai Supabase development; Production dikonfigurasi memakai Supabase production. Migrasi dan seed terakhir baru diverifikasi di development. Jangan menganggap production sudah siap.
- Admin di atas dikonfirmasi pengguna tersedia; periksa keberadaan dan role di environment target tanpa mengubah kredensial.
- Baca `src/app/admin/actions.ts`, `src/app/admin/stories/[slug]/page.tsx`, `src/lib/admin.ts`, `src/lib/data.ts`, halaman reader, seluruh `supabase/migrations/`, dan `supabase/seed.sql`.
- Gunakan skill Supabase serta skill Vercel yang relevan. Verifikasi dokumentasi resmi provider sebelum mengimplementasikan API yang dapat berubah.

Studio saat ini hanya membuat story, node, dan choice. Belum ada pengelolaan gambar, job AI aktif, review/publish UI, atau preview media privat. Jangan menyebut fitur selesai hanya karena tombol/form sudah dibuat.

## Hasil yang harus tersedia di UI

1. Daftar chapter memiliki tombol **Kelola gambar** menuju editor chapter, misalnya `/admin/stories/[slug]/chapters/[nodeId]`. Tampilkan nama cerita, nama chapter, status draft/published, dan tautan kembali.
2. Editor memiliki dua tindakan jelas: **Upload gambar** dan **Generate dengan AI**. Gambar yang sudah tersimpan ditampilkan sebagai daftar/grid thumbnail dengan urutan yang jelas.
3. Upload beberapa JPEG, PNG, atau WebP sekaligus, melalui file picker dan drag-and-drop. Tampilkan progres setiap file, pesan validasi, hasil sukses/gagal, dan retry file gagal tanpa menggandakan file sukses.
4. Admin dapat mengurutkan gambar, mengganti gambar, menghapus gambar dari draft, dan mengedit alt text, caption, dialogue, serta speaker. Sediakan tombol naik/turun yang dapat dioperasikan keyboard meskipun drag-and-drop juga tersedia.
5. Generate AI menerima prompt, konteks chapter, gaya visual, dan rasio gambar yang didukung provider. Tampilkan status antre/proses/gagal/selesai, retry yang jelas, serta estimasi biaya bila provider menyediakannya. Referensi karakter/gambar boleh ditambahkan jika provider mendukungnya dengan benar.
6. Hasil AI masuk sebagai gambar draft untuk diperiksa; tidak langsung terbit. Admin dapat menerima hasil, mengedit metadata, mengurutkannya bersama upload manual, atau membuangnya.
7. Preview menampilkan chapter seperti reader, termasuk seluruh gambar sesuai urutan. Sediakan review dan publikasi yang terkontrol; tampilkan perbedaan versi kerja dan versi terbit.
8. UI berbahasa Indonesia, responsif, mengikuti tampilan Pixinia, dengan keadaan kosong, loading, error, dan sukses yang jelas. Refresh halaman tidak menghilangkan pekerjaan yang sudah disimpan atau status job.

## Model data dan publikasi

Selesaikan desain data sebelum membuat UI yang bergantung padanya, lalu implementasikan sebagai migrasi baru; jangan mengedit ulang migrasi yang sudah diterapkan.

- Saat ini `story_asset_panels.panel_order` unik hanya dalam satu `asset_id`, sedangkan reader menggabungkan panel dari beberapa asset dan mengurutkan `panel_order`. Ini tidak cukup untuk urutan gambar per chapter.
- Buat urutan unik dan deterministik dalam satu versi chapter. Pilihan yang disarankan: revisi media chapter dengan daftar panel berurutan yang menunjuk asset gambar. Tetapkan satu asset untuk satu file; pisahkan identitas asset, urutan panel, dan versi publikasi.
- Backfill delapan panel seed tanpa kehilangan gambar, caption, atau rute reader. Pertahankan dukungan asset lokal yang sudah ada.
- Pastikan seluruh referensi story, node, revisi, panel, dan asset sesuai induknya melalui constraint dan validasi server. Reorder harus atomik, menangani pertukaran posisi, dan mendeteksi konflik dari dua tab/admin menggunakan version check atau mekanisme setara.
- Editing chapter yang sudah terbit membuat versi kerja; reader tetap memakai versi terbit sampai publikasi berhasil. Publikasi memvalidasi kelengkapan seluruh gambar, status review, metadata wajib, dan izin, lalu mengganti versi aktif secara atomik.
- Migrasi `editorial_guards` saat ini mencabut UPDATE/DELETE dari authenticated dan membatasi insert pada parent story draft. Alur baru harus mendukung revisi chapter pada cerita yang sudah terbit tanpa membuka akses tulis umum. Jangan menonaktifkan RLS atau sekadar memberi semua staff akses mengubah status published.
- Simpan provenance upload/AI, pembuat, waktu, model/provider, dan hasil review. Simpan prompt, error internal, dan detail biaya di tabel/kolom yang tidak ikut terekspos kepada publik.
- `story_assets` mewajibkan lokasi storage atau referensi external. Job yang baru antre belum merupakan asset siap baca: simpan job terpisah sampai file tersedia, atau ubah lifecycle dengan constraint yang sengaja dirancang dan diuji.

## Upload, Storage, dan keamanan

- Otorisasi setiap operasi di server memakai sesi Auth dan pemeriksaan role aktual. Reader biasa dan anonymous tidak boleh membuat job, menulis file, reorder, menghapus, atau publish.
- Gunakan signed upload URL yang diterbitkan server setelah validasi untuk upload browser langsung ke Storage privat, sehingga file besar tidak melewati body Server Action. Batasi ukuran, jumlah file, format, dimensi, dan prefix path; cocokkan batas UI, API, dan bucket.
- Jangan hanya percaya ekstensi atau Content-Type. Validasi signature/decode file sebelum finalisasi. Tolak SVG upload, file rusak, konten non-gambar, dan payload berlebihan; SVG seed lokal yang sudah ada tetap boleh dibaca.
- Path dibuat server dengan ID acak dan identitas story/chapter yang tervalidasi. Jangan menerima path, user ID, status approved, atau URL remote sembarang dari klien sebagai sumber kebenaran.
- Buat kebijakan `storage.objects` yang sesuai. Draft menggunakan bucket privat dan preview signed URL berumur pendek setelah otorisasi. Jangan menaruh draft dalam bucket publik.
- Tentukan delivery versi terbit secara eksplisit. Jika memakai bucket publik, hanya salin file yang sudah disetujui dengan key immutable dan akui bahwa URL publik tidak terlindungi RLS tabel. Untuk pencabutan akses yang ketat gunakan delivery privat yang mengotorisasi versi aktif. Jangan menganggap perubahan status database mencabut URL publik lama.
- Finalisasi upload harus idempotent; tangani kegagalan antara upload dan insert DB. Bersihkan orphan setelah grace period, dan jangan menghapus file yang masih dirujuk versi terbit. Replacement menggunakan key baru.
- RPC privileged memakai pemeriksaan role dan hubungan objek, search_path aman, serta EXECUTE grants terbatas. Jika service key diperlukan, simpan hanya di server dan tetap lakukan otorisasi; jangan pernah memakai `NEXT_PUBLIC_` untuk secret.

## Generate AI yang benar-benar berjalan

1. Periksa integrasi yang sudah ada dan nama environment variable tanpa mencetak nilainya. Pilih provider/model yang benar-benar mendukung image generation; jangan menganggap endpoint text chat otomatis menghasilkan gambar.
2. Buat adapter provider di server dan dokumentasikan env yang dibutuhkan dalam `.env.example`. API key tidak boleh masuk browser, repository, log, atau respons error. Konfigurasi secret melalui environment Vercel yang sesuai.
3. Jika kredensial/provider belum tersedia, selesaikan upload manual dan integrasi AI yang dapat dikonfigurasi. Tampilkan status **AI belum dikonfigurasi** beserta kebutuhan setup; jangan mengembalikan gambar placeholder sebagai hasil AI sukses. Minta informasi provider atau kredensial melalui mekanisme aman hanya bila belum tersedia. Sebelum uji yang berbayar, pastikan batas biaya yang disetujui pengguna; jangan mengarang budget.
4. Gunakan job persisten untuk generation yang dapat melewati umur request Vercel. Inspeksi scaffolding `production_jobs` sebelum menambah tabel baru. Pilih worker/queue yang benar-benar dijalankan dan dikonfigurasi; fire-and-forget dalam request bukan mekanisme durable.
5. Simpan job ID, idempotency key, provider request ID, status, attempt, dan error yang aman. Tangani timeout, bounded retries, claim/lease bila ada banyak worker, serta rekonsiliasi job macet. Verifikasi webhook jika digunakan.
6. Cegah double click menghasilkan dua tagihan. Jangan otomatis mengulang request yang mungkin sudah diterima provider sebelum memeriksa statusnya. Terapkan batas concurrency, jumlah gambar, dan biaya; failure melepas reservasi yang sesuai.
7. Ambil output hanya dari sumber provider yang tervalidasi, validasi file, lalu simpan ke Storage privat milik aplikasi. Jangan bergantung pada URL hasil provider yang kedaluwarsa. Job selesai hanya setelah asset/panel tersimpan dengan benar; hasil berstatus perlu review.
8. Uji setidaknya satu generation nyata ketika kredensial dan budget tersedia. Bedakan pengujian mock dari pengujian provider nyata di laporan akhir.

## Integrasi reader

Perbarui query dan rendering di `src/lib/data.ts` serta halaman reader agar membaca versi media terbit yang aktif dan urutan per chapter, bukan mengandalkan urutan per asset. Pastikan hanya konten dengan story/node yang memenuhi aturan publikasi dapat dibaca publik. Gunakan alt text yang disimpan, ukuran/aspect ratio untuk mengurangi pergeseran layout, dan loading gambar yang sesuai. Preview admin memakai versi kerja dengan otorisasi terpisah; jangan membuat query publik bisa membaca draft lewat parameter URL.

## Urutan implementasi dan deployment

1. Audit keadaan terbaru, akses admin, migrasi, kebijakan Storage, environment, dan provider. Catat desain revisi/order dan pekerjaan yang benar-benar diperlukan.
2. Implementasikan migrasi, backfill, otorisasi, upload/finalisasi, editor dan preview. Buktikan upload manual berjalan sebelum mengintegrasikan provider AI.
3. Implementasikan durable job AI, review/publish, dan pembacaan revisi terbit. Tambahkan tes untuk batas keamanan serta kegagalan nyata.
4. Terapkan migrasi pada development terlebih dahulu. Jalankan `pnpm typecheck`, `pnpm lint`, `pnpm build`, serta tes yang relevan. Periksa UI desktop/mobile dan console/network errors.
5. Deploy preview; pastikan redirect Auth mencakup URL tersebut. Uji browser → API → database/Storage → reader menggunakan akun admin dan pembaca biasa. Jangan mencetak kredensial atau meminta password admin lewat chat; pengguna dapat login langsung bila perlu.
6. Setelah preview lulus, persiapkan production sesuai otorisasi deployment pengguna sebelumnya. Periksa data/migrasi production aktual dan backup sebelum perubahan; jangan menjalankan seed destruktif atau menimpa konten. Terapkan migrasi kompatibel, konfigurasi Storage, worker/provider dan Auth redirect production, serta verifikasi admin pada environment itu.
7. Buat build production baru memakai environment production. Jangan mempromosikan bundle preview yang memiliki nilai `NEXT_PUBLIC_SUPABASE_*` development tertanam. Deploy pada project Vercel yang sudah ada dan smoke test domain production.
8. Jika akses akun, secret, atau budget merupakan penghambat, selesaikan bagian independen, sebutkan tindakan spesifik yang dibutuhkan, dan laporkan batas hasil. Jangan mengklaim production selesai tanpa verifikasi.

## Kriteria penerimaan dan pengujian

- Admin memilih chapter, upload tiga gambar, mengubah urutan serta alt/caption, refresh, lalu melihat data tetap benar.
- Admin dapat mengedit gambar chapter pada cerita yang sudah terbit tanpa mengubah tampilan publik sebelum publish.
- Generation nyata menghasilkan satu file tersimpan dan dapat digabungkan dengan upload manual; kegagalan provider dapat dipahami dan retry tidak menggandakan hasil/tagihan. Jika provider belum dapat diuji, tandai kriteria ini belum terpenuhi.
- Preview dan reader setelah publish menampilkan gambar dengan urutan persis sama. Chapter lain dan pilihan cerita tetap berfungsi.
- Uji anonymous, reader, dan staff melalui API langsung, bukan hanya tombol UI. Tolak ID chapter/asset dari cerita lain, forged path, direct status update, akses draft, file palsu/terlalu besar, dan operasi tanpa sesi.
- Uji reorder bersamaan, duplicate submit/finalize, upload parsial, job timeout, kegagalan penyimpanan hasil AI, serta publish saat file belum siap. Publik tidak melihat revisi setengah jadi.
- Regresi: katalog, login/logout, mulai cerita, pilihan cabang, progres, dan ending. Periksa `apply_story_choice` tidak mengizinkan pengguna tanpa progress melompati start; perbaiki jika pengujian membuktikan masalah dan catat perubahan.
- Tidak ada secret dalam git/browser/log. Tidak ada draft yang dapat diambil lewat URL publik. Migrasi/backfill mempertahankan seed dan data pengguna.

## Hasil akhir yang dilaporkan

Berikan URL aplikasi/preview, rute Studio, daftar migrasi, pengaturan environment yang dibutuhkan (nama saja), cara menjalankan worker, bukti tes manual/otomatis, dan status generation nyata. Perbarui README serta `docs/implementation-status.md`. Jelaskan bagian belum selesai secara spesifik. Jangan menyebut keseluruhan plan telah selesai karena fokus tugas ini adalah gambar per chapter.

## Prompt siap pakai

> Kerjakan `docs/studio-image-instructions.md` sampai implementasi dan pengujian selesai. Admin saya sudah ada: asnara.dev@gmail.com. Fokuskan Studio agar setiap chapter bisa memiliki beberapa gambar dari upload manual maupun generate AI, bisa diurutkan, dipreview, direview, dan dipublikasikan ke reader. Gunakan repo dan project Supabase/Vercel yang sudah ada, pertahankan data serta akun, dan lanjutkan sampai deployment terverifikasi sesuai instruksi. Jangan berhenti pada rencana atau UI dummy. Laporkan hambatan akses/provider/budget secara konkret tanpa membocorkan secret.
