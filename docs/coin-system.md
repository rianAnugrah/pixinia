# Sistem coin

Implementasi development / Preview, 1 Oktober 2026.

- Setiap akun baru dan akun yang sudah ada menerima 100 coin, satu kali, tercatat sebagai welcome grant.
- Setiap node memiliki harga default 5 coin, termasuk bab awal. Admin dapat mengubah harga per node dan penanda premium.
- Unlock permanen: membaca ulang tidak memotong saldo. Reset dari bab yang dimiliki gratis; reset menghapus riwayat jalur aktif, mempertahankan seluruh pembelian, dan mengaktifkan bab tersebut untuk memilih cabang lagi.
- Komik premium dapat dibeli sekaligus dengan harga admin; pembelian membuka semua node komik tersebut. Harga awal komik premium 5 coin, dapat diubah sebelum menandainya premium.
- Reward dibuat admin, dibeli dengan coin di Akun, lalu masuk antrean pemberian manual admin. Nama dan harga saat transaksi disimpan; mengubah katalog tidak mengubah klaim lama.
- Tambahan coin hanya melalui admin. Belum ada top-up pembayaran, earning, atau monetisasi coin.
- Staff membaca gratis untuk pekerjaan editorial. Wallet admin tetap menerima welcome grant.
- Progres lama diberikan ownership tanpa potongan saldo agar pengguna tidak kehilangan bab yang telah dilalui.

## Halaman

`/account`: saldo, 30 transaksi terbaru, reward aktif, dan klaim terbaru.

`/admin/coins`: tambahan saldo manual dengan UUID user dan catatan audit; saran 500 wallet terbaru; harga node/komik dan premium; katalog serta pemberian reward; 50 transaksi terbaru. Halaman dan RPC mutasi admin menolak role reader/editor.

Reader menampilkan gate sebelum mengambil panel berbayar. Pilihan menampilkan harga tujuan dan konfirmasi sebelum pemotongan. Bab yang dibeli langsung dari katalog dapat diaktifkan menggunakan reset gratis.

## Database dan media

Migrasi development `avvkbocpqkquzbsvaoeb`:

- `20261001003445_coin_wallets.sql`
- `20261001005606_coin_audit_indexes.sql`

Wallet, ledger, ownership, reward dan klaim memiliki RLS. Client hanya dapat membaca data yang diizinkan; perubahan saldo hanya melalui RPC yang memeriksa sesi. Semua debit/credit mengunci wallet user, mencatat ledger, dan menyimpan ownership/progres/klaim dalam transaksi yang sama. Request ID menjaga retry unlock, reset, redeem dan credit; pilihan lama ditolak setelah progres berpindah tanpa potongan kedua.

Media published tetap memerlukan ownership melalui restrictive RLS, termasuk Storage. `story-public` menjadi bucket privat; cover published mendapat signed URL lewat route cover yang memvalidasi path. Gambar demo dipindahkan dari `public/comic` ke `content/comic` dan disajikan melalui route yang memakai sesi RLS user. Build trace memuat seluruh delapan SVG. Signed URL baru berlaku 300 detik.

Perubahan ini tidak dapat menarik kembali gambar yang sudah disimpan pembaca. Signed URL lama dapat berlaku sampai TTL asalnya habis. Deployment Preview lama masih menyimpan demo SVG publik; bukan target alias Preview saat rilis baru selesai. Production belum menerima migrasi coin.

## Verifikasi

- `supabase/tests/coin-wallets.sql` lulus di development, seluruh fixture rollback: welcome 100; isolation wallet; larangan direct write; start/choice/unlock berulang; reset gratis dan ownership tetap; saldo tidak cukup tanpa debit/ownership; reward retry dan fulfillment; admin credit retry; premium comic; editor/reader/anon menolak operasi admin atau pembelian tanpa sesi; ledger sama dengan saldo.
- Typecheck dan build lokal lulus. Enam unit test proyek lulus. Lint tidak memiliki error, satu peringatan `<img>` pada LoadingImage yang sudah ada.
- Browser guest: reader gate, harga 5 coin, redirect login, daftar seluruh bab, viewport 390, tanpa error console. Endpoint aset tanpa ownership dan path SVG publik lama mengembalikan 404.
- Advisor: foreign key baru sudah diberi index; informasi unused index wajar untuk fitur baru. RPC SECURITY DEFINER dilaporkan karena sengaja callable, tetapi memiliki pemeriksaan auth/ownership/admin dan search_path kosong. Helper ada di schema privat dengan execute client dicabut. Temuan Auth dan editorial yang sudah ada tidak diubah. Panduan [advisor RPC](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
- Uji browser authenticated belum dijalankan: automatic approval review menolak akun uji development dengan password karena membuat akun/kredensial permanen tanpa izin khusus. Pertanyaan izin disampaikan; tidak membuat akun tersebut. Tes role dan transaksi authenticated sudah lulus melalui SQL yang di-rollback. Concurrency lintas sesi belum diuji secara empiris; setiap mutasi memakai row lock wallet.

## Deployment

Build coin READY: `dpl_6JubAwsi4MALo6VpauUCM1PkMtRT`, [Preview build](https://pixinia-web-otdba7jay-riananugrahs-projects.vercel.app). Pemeriksaan `vercel curl` reader mendapat HTTP 200 dengan tombol unlock dan harga 5 coin. Preview dilindungi login Vercel. Production tidak diperbarui.

Alias [Preview tetap](https://preview.pixinia.web.id) sudah diarahkan ke build coin dan diverifikasi HTTP 200. Route aset tanpa ownership dan URL demo publik lama diverifikasi 404 pada build remote.

## Perbaikan navigasi reader

Bug tombol tetap loading setelah pindah bab berasal dari state client `busyId` yang dipertahankan React ketika route dinamis mengganti props. Reset pada bab yang sama juga mempertahankan state tersebut. Pilihan kini memiliki lifecycle berdasarkan story, node dan `user_story_progress.updated_at`; perpindahan bab dan reset membuang state loading/error sebelumnya. Kontrol panel memiliki key per node agar indeks panel sebelumnya tidak terbawa ke bab baru.

`tests/reader-actions.test.mjs` menjalankan komponen React asli dengan router/RPC stub. Sebelum perbaikan, dua tes gagal pada tombol yang tetap disabled; sesudah perbaikan, navigasi beruntun dan reset pada node yang sama mengaktifkan tombol kembali serta menghapus konflik lama. Rerender tanpa perubahan progres tetap mempertahankan status busy untuk mencegah klik ganda. Delapan tes proyek lulus; typecheck dan lint lulus dengan peringatan gambar yang sudah ada. Tidak ada migrasi atau perubahan biaya coin untuk perbaikan ini. Tes komponen ini tidak mengklaim browser authenticated end-to-end.

Rilis perbaikan reader: `dpl_4BACVSBE4aTMu7rvRGN9dkWKf5xh` READY, alias Preview tetap diperbarui. Reader pada alias mendapat HTTP 200 dan bundle client diverifikasi memiliki key state berdasarkan node/progressVersion.

## Published branch-map metadata

Migration `20261001013535_reader_branch_map.sql` adds `reader_story_edges`, applied to Development only. It exposes distinct source/target IDs only for unconditional edges between published nodes of published public stories. No panel, image, paid choice text, draft or private-story data is returned. It intentionally uses SECURITY DEFINER to read topology independently of purchased choice-content RLS; anonymous/authenticated execution is explicitly granted. The corresponding Supabase public SECURITY DEFINER advisor notice is expected for this narrow metadata projection (https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable). Anonymous checks confirmed seeded edges are available while paid choices and assets remain hidden. All regression fixtures were rolled back.

Reader purchase confirmation now shows current balance, cost and remaining balance; insufficient funds makes no mutation. Retry reuses the same request ID. Free resets and persistent unlock ownership are unchanged.
