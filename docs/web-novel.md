# Web Novel di Pixinia

Studio sekarang menawarkan format **Komik** dan **Web Novel** saat membuat cerita. Cerita lama tetap Komik. Katalog menyediakan filter Semua, Komik, dan Web Novel.

Untuk Web Novel, buat node dan pilihan pada Story Graph seperti biasa. Simpan graph agar node tersedia, lalu buka editor naskah dari daftar di bagian atas Studio atau melalui tab Naskah pada node. Pisahkan paragraf dengan baris kosong. Editor dapat menyimpan draft; admin menerbitkan naskah per node. Setelah semua node memiliki naskah terbit, admin dapat menerbitkan struktur cerita. Server juga menolak publikasi graph Web Novel bila ada node tanpa naskah.

Reader menampilkan paragraf dengan tipografi dan pengaturan ukuran teks. Navigasi bab, peta cabang, progres, pilihan, unlock permanen, saldo coin, dan reset gratis memakai alur yang sama dengan komik. Naskah draft hanya dapat dibaca staf. Naskah terbit hanya dapat dibaca jika node sudah terbuka; akses ini diperiksa oleh RLS `coin_can_read_node`.

Perubahan schema berada pada migrasi `20261001061216_web_novel_content.sql` dan `20261001062304_web_novel_publish_guard.sql`. Keduanya diterapkan pada Supabase Development. Uji SQL dengan transaksi rollback memastikan naskah node terkunci tidak terlihat anonim, naskah gratis terlihat, draft tidak dapat dibaca anonim, dan publikasi graph gagal tanpa naskah lalu berhasil sesudahnya.

Belum ada contoh Web Novel yang diterbitkan. Kategori tersebut akan kosong sampai tim Studio membuat dan menerbitkan cerita pertama. Production database belum diubah.

Preview aktif: https://preview.pixinia.web.id (deployment `dpl_BY4cWrj1XLrfZGvtmgD1fXrAHyz3`, READY). Build, typecheck, lint, dan 14 tes otomatis lulus; lint hanya melaporkan peringatan `<img>` yang sudah ada pada `LoadingImage`. Pemeriksaan mobile pada lebar 390 px menunjukkan filter Web Novel dan empty state tanpa overflow horizontal.
