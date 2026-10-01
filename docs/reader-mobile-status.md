# Status implementasi Reader mobile

Tanggal: 30 September 2026. Implementasi sudah dirilis ke **Preview**: [preview.pixinia.web.id](https://preview.pixinia.web.id). Production belum diubah.

## Selesai

- Reader mobile dengan header ringkas, stack panel lebar penuh, toolbar bawah, navigasi panel, slider, counter panel dan bookmark posisi lokal per akun/cerita/node. Bookmark hanya dipulihkan bila ID panel masih ada.
- Sheet daftar bab yang pernah dilalui, aman dari draft, dengan tutup Escape, focus trap dan lock scroll latar.
- Pilihan bercabang dengan busy, pencegahan submit ganda, error/retry, pesan konflik progres dan jalur guest ke login. Baca ulang tidak mengulang RPC.
- Detail cerita dengan cover nyata/fallback, CTA mulai/lanjut, tab Bab/Tentang dan jumlah panel terbit yang dihitung dari sumber yang benar.
- Beranda dan pustaka dengan cerita terbit, kartu lanjut membaca, cover/fallback dan navigasi mobile rute yang ada.
- Layout tablet/desktop menjaga lebar komik. Perubahan style reader terlingkup agar preview/editor Studio tetap memakai tampilan sebelumnya.

## Bukti verifikasi

- `pnpm typecheck`: lulus.
- `pnpm lint`: lulus dengan satu peringatan `<img>` yang sudah ada di `LoadingImage` (sumber signed URL/legacy).
- `pnpm test`: 6 lulus, termasuk dua tes baru riwayat node dan posisi panel.
- `pnpm build`: lulus. Build dilakukan setelah dev server sempat berjalan, lalu dev server dinyalakan ulang untuk pemeriksaan browser.
- Browser lokal: beranda, detail `arsip-senja`, reader `jam-keenam`, sheet bab, guest choice → login dengan return URL berhasil. Tidak ada error console pada pemeriksaan ini.
- Deployment Preview `dpl_FiR3deFc9m91dzC7tMwAZZtE6bmd` berstatus READY. URL build: `https://pixinia-web-maa22vg4f-riananugrahs-projects.vercel.app`. Alias tetap telah dialihkan dari build lama ke build baru. `vercel curl` terautentikasi memeriksa beranda, detail, reader dan kontrol navigasi melalui build baru serta alias tetap. Browser anonim dialihkan ke login Vercel karena proteksi Preview.
- Viewport reader 320×568, 390×844, 768×1024 dan 1440×900: tidak ada overflow horizontal. Peramban menyesuaikan tinggi viewport aktual karena chrome aplikasinya.
- Detail cerita memperlihatkan `1 panel` sesuai contoh data aktif. Foto dan teks berasal dari data cerita contoh, bukan gambar referensi.

## Batas yang belum diverifikasi

- Akun penguji tidak tersedia dalam sesi browser, jadi mutasi pilihan saat signed-in, resume setelah login, konflik dua tab, ending aktual, pustaka berisi progres, dan keamanan RLS di deployment belum diuji end-to-end.
- Cerita contoh hanya memiliki satu panel. Navigasi beberapa panel, perubahan set gambar saat bookmark tersimpan, URL gambar kedaluwarsa, dan media error belum dapat diuji dengan fixture nyata; logika posisi dan riwayat sudah diuji unit.
- Uji perangkat fisik, zoom teks 200%, koneksi lambat dan regresi Studio secara interaktif belum dijalankan. Build dan pembatasan CSS memberi pemeriksaan awal, bukan bukti visual lengkap.
- Metadata episode published belum tersedia sebagai read model publik. Daftar bab menampilkan awal, posisi aktif, dan riwayat; grouping episode ditunda sampai proyeksi data terbit tersedia.
- Preview aktif; Production belum dideploy. Deployment Preview lama tetap tersimpan tanpa alias sebagai titik pemulihan.

## Reader upgrade — 1 October 2026

- Mobile reader now includes wallet balance, native modal navigation with map/list/read history, reading settings, and local panel bookmarks.
- Published graph metadata comes from `reader_story_edges`; locked panel assets and choice text remain protected by ownership checks.
- Paid choices require confirmation showing price, balance and remaining coins. Insufficient balance sends no purchase request. Request guards and stable retry IDs prevent duplicate submissions.
- Node unlock remains permanent, default cost 5 coins; welcome balance 100; chapter reset remains free. Switching chapters or resetting progress remounts pending choice state.
- Previously purchased chapters can be read again, with an explicit free action to activate another story path.
- Validation: 13 automated tests passed; typecheck and deployment build passed. Lint retains the existing LoadingImage img warning. Coin SQL regression and anonymous graph visibility checks passed with fixtures rolled back.
- Browser verified guest navigation, map links, purchase/reset dialog presentation using a removed UI-only fixture, and responsive widths 320, 390 and 1280. Authenticated browser transactions were not performed.
- Preview deployment `dpl_3juUR7aPjCRNLcwCzoCpZMmWCVi5` is READY at https://pixinia-web-5ntcl40cs-riananugrahs-projects.vercel.app and aliased to https://preview.pixinia.web.id. Reader HTTP 200 through deployment and alias; protected asset endpoint returns 404 for anonymous access. Production unchanged.
- This update supersedes the earlier visited-only chapter list limitation: published nodes and safe edges are now available, including locked nodes. Episode grouping still requires a published episode read model.
