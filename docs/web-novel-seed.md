# Peta Langit yang Retak

Seed Web Novel orisinal berbahasa Indonesia tentang Mira yang berpindah dari lift apartemennya ke Lentara. Ia mencari jalan pulang ketika pintu antar dunia merobek langit Lentara. Tavi, Sera, Ruun, dan para penjaga pintu memberi sudut pandang berbeda; pilihan pembaca menentukan cara kedua dunia berhubungan.

- **33 bab/node** dalam lima bagian: Pintu yang Salah, Peta dan Ingatan, Langit yang Terkoyak, Harga Sebuah Pulang, Tiga Fajar.
- **56 pilihan** dengan cabang yang bertemu kembali; semua 33 node dapat dicapai dari awal, tanpa siklus atau jalan buntu.
- **Tiga ending:** Fajar untuk Semua, Rumah dengan Dua Pintu, Nama yang Tinggal.
- Bab pembuka gratis. Bab lain berbiaya **5 coin** per unlock permanen, memakai sistem coin yang sudah ada. Reset jalur tetap gratis.

Sumber naskah dan pilihan ada di [content/web-novel/peta-langit-yang-retak.mjs](../content/web-novel/peta-langit-yang-retak.mjs). Jalankan `node scripts/build-web-novel-seed.mjs` untuk memvalidasi graph dan menghasilkan [supabase/seeds/peta-langit-yang-retak.sql](../supabase/seeds/peta-langit-yang-retak.sql). SQL seed bersifat idempotent: bila slug sudah ada, ia tidak mengubah naskah, graph, atau progres pembaca. Seed telah diterapkan pada Supabase **Development** yang dipakai Preview; Production belum diubah.

Detail cerita di Preview: https://preview.pixinia.web.id/stories/peta-langit-yang-retak. Naskah pembuka dapat dibaca tanpa login; bab lain menunjukkan gate unlock. Validasi SQL memastikan 33 naskah terbit, 56 pilihan, tiga ending, 33 node terjangkau, nol siklus/jalan buntu, dan anon hanya dapat membaca naskah bab gratis.
