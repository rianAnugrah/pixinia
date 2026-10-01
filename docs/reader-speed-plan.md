# Rencana peningkatan kecepatan dan kelancaran reader

Tanggal: 1 Oktober 2026. Status: rencana implementasi, belum dieksekusi.
Berlaku untuk komik dan Web Novel, mobile dahulu. Pertahankan navigasi Bab: Continue, Awal Bab, bab terbuka; cabang lain di Peta cabang.

## Tujuan dan ukuran keberhasilan

- Gratis atau sudah dimiliki: satu ketukan, tanpa konfirmasi biaya.
- Berbayar: ketuk pilihan, lalu satu tombol konfirmasi dalam popup kecil; tidak ada dialog besar atau backdrop yang menutupi cerita.
- Membaca ulang langsung membuka konten; tidak perlu reset untuk sekadar membaca.
- Target awal pada perangkat mobile dan profil jaringan 4G yang sama: respons visual <100 ms; p75 perpindahan bab hingga teks/panel pertama siap <=1 detik untuk konten yang sudah disiapkan, <=2 detik tanpa prefetch. Ini target, bukan hasil pengukuran.
- Target penurunan p75 waktu perpindahan minimal 50% dari baseline. Catat p95 agar kasus loading lama tidak tertutup rata-rata.
- Tidak ada saldo ganda terpotong, progres hilang, loading macet, atau konten premium bocor.

## Temuan dari kode saat ini

1. `src/components/coin-action.tsx`: `begin()` selalu membuka `ReaderDialog`, termasuk cost 0. Ini menambah langkah pada reset dan aktivasi bab.
2. `src/components/reader-actions.tsx`: pilihan gratis sudah langsung dieksekusi; pilihan berbayar memakai dialog besar. Jangan mengubah perilaku gratis yang sudah benar.
3. `reader-actions.tsx`, `coin-action.tsx`, dan `story-start.tsx` menggabungkan `router.push()` dengan `router.refresh()` setelah mutasi. Perlu tracing untuk memastikan permintaan ulang yang tidak perlu dan menghindari data progres usang.
4. `src/app/read/[slug]/[nodeKey]/page.tsx`: story → node → auth → navigation/access → izin baca → konten → gambar/prosa berjalan dalam beberapa tahap serial. Ada query yang dapat berjalan bersama dan data yang tidak perlu menghalangi konten utama.
5. `src/lib/reader-navigation.ts` mengambil seluruh node, edges, ownership, wallet, dan progres setiap pembukaan bab. Peta bukan kebutuhan kritis untuk menampilkan paragraf/panel pertama.
6. `src/lib/coins.ts` mengambil unlock node milik user lintas cerita. Perlu dibatasi pada cerita aktif dalam query yang tetap menghormati otorisasi.
7. `src/lib/data.ts`: signing URL dilakukan per gambar; loader umum juga mengambil aset/panel untuk novel yang hanya membutuhkan prosa dan pilihan.
8. `src/components/loading-image.tsx`: semua gambar memakai lazy loading, termasuk gambar pertama; retry reader dapat me-reload seluruh halaman.

Temuan ini kandidat bottleneck berdasarkan kode. Belum ada pengukuran latency produksi atau pembuktian bagian mana yang paling dominan.

## Perilaku UX yang dituju

| Aksi | Perilaku |
| --- | --- |
| Continue / baca ulang bab terbuka | Langsung masuk ke bab, tanpa RPC reset atau konfirmasi |
| Mulai cerita gratis | Satu ketukan, simpan progres lalu masuk |
| Pilihan gratis / tujuan sudah dimiliki | Satu ketukan, validasi dan simpan pilihan lalu navigasi |
| Unlock berbayar | Popup ringkas dekat tombol: harga, saldo → sisa, `Buka · 5 coin`, `Batal` |
| Coin kurang | Popup ringkas menampilkan kekurangan dan tautan wallet; tidak mengirim transaksi |
| Harga/saldo berubah sejak ditampilkan | Tampilkan nilai terbaru; jangan otomatis menerima harga lebih tinggi |
| Reset gratis | Satu ketukan pada tombol yang jelas menyebut konsekuensinya; tanpa konfirmasi coin |
| Pilih jalur dari bab lama | Setelah dukungan backend siap, satu aksi gabungan mengaktifkan bab dan menerapkan pilihan; tidak ada langkah reset terpisah |

Popup harus non-modal, terjangkau ibu jari, tidak keluar viewport, mendukung keyboard/Escape, fokus kembali ke pemicu, serta mengumumkan error melalui live region. Gunakan satu komponen konfirmasi bersama agar gate unlock, pilihan, dan awal cerita konsisten. Pada layar sempit popup bisa melebar mengikuti area pilihan, bukan menjadi dialog layar penuh.

Reset masih dapat mengubah riwayat jalur aktif. Tampilkan penjelasan singkat tepat di dekat tombol sebelum diklik. Jangan menjanjikan Undo tanpa snapshot dan pemulihan progres yang benar. Reset dan baca ulang tidak boleh menghapus ownership.

## Urutan implementasi

### P0 — Ukur baseline dan hilangkan langkah berlebih

1. Instrumentasi klik → RPC selesai → route siap → paragraf/panel pertama siap. Pisahkan durasi auth, data reader, signing, transfer gambar, dan render. Jangan merekam isi cerita atau identitas pribadi dalam event performa.
2. Rekam minimal 20 transisi tiap skenario: gratis, owned, berbayar, baca ulang; komik dan novel. Pisahkan cold/warm serta cache aktif/nonaktif; dokumentasikan perangkat, jaringan, wilayah, dan ukuran sampel. Laporkan p75/p95 sebagai baseline awal.
3. `CoinAction`: jika gratis dan user memenuhi syarat, eksekusi langsung. Nilai biaya yang belum tersedia jangan dianggap 0. Tetap gunakan pemeriksaan server.
4. Ganti konfirmasi biaya besar dengan popup bersama. Pertahankan perlindungan double-click dan request ID retry.
5. Feedback lokal pada pilihan yang diklik; isi bab tetap terlihat. Hilangkan pesan sukses perantara yang menambah transisi sebelum navigasi.
6. Buat satu mekanisme penyelesaian mutasi: navigasi ke tujuan dengan data terbaru, atau refresh bila tetap pada route yang sama. Hindari push+refresh tanpa alasan; pastikan cache tujuan yang diprefetch sebelum pembelian tidak menampilkan gate lama.
7. Tampilkan status segera, indikator loading setelah sekitar 150–200 ms agar aksi cepat tidak berkedip. Timeout harus berakhir dengan error dan retry, tidak meninggalkan tombol terkunci.

### P1 — Kurangi waktu tunggu data dan aset

1. Mulai auth bersama pengambilan story; jalankan query independen secara paralel sesudah dependensinya tersedia. Jangan melewati pemeriksaan akses untuk mempercepat konten berbayar.
2. Pisahkan data reader inti (konten, choices, current progress, saldo/harga relevan) dari data peta lengkap. Muat peta dan library graph ketika dibuka; cache metadata publik per versi publikasi cerita.
3. Buat loader khusus novel: prosa + pilihan, tanpa aset komik. Untuk komik gunakan image set terbit terlebih dahulu, baru fallback aset lama jika memang diperlukan.
4. Batch signing URL gambar jika didukung SDK terpasang. Periksa dokumentasi versi saat implementasi. Pertahankan masa berlaku dan otorisasi; retry URL kedaluwarsa hanya untuk aset terkait.
5. Prioritaskan panel pertama dengan eager loading/fetch priority; panel berikutnya lazy. Pertahankan dimensi/aspect ratio agar halaman tidak bergeser. Gunakan variasi resolusi mobile dan format terkompresi setelah membandingkan kualitas dialog/teks komik.
6. Deduplicate fetch identik dalam satu request. Metadata publik dapat di-cache dengan invalidasi publish; wallet, ownership, progres, dan URL privat tidak boleh memakai shared cache antar-user.
7. Jika query masih dominan setelah optimasi, buat query/RPC reader teragregasi dengan kontrol akses dan kolom minimum. Putuskan berdasarkan trace, bukan asumsi semua query harus menjadi satu RPC.
8. Periksa kedekatan region aplikasi dengan database dan storage dari konfigurasi nyata; pindah region hanya bila data latency mendukung.

### P2 — Transisi baca yang terasa langsung

1. Prefetch terbatas saat pembaca mendekati akhir bab atau menyentuh pilihan: satu hingga dua tujuan gratis/owned. Jangan mengunduh seluruh pohon cabang.
2. Untuk locked node hanya prefetch metadata yang boleh diakses. Konten privat baru disiapkan setelah unlock disahkan server.
3. Hormati Save-Data/koneksi lambat bila tersedia, batasi byte prefetch, dan hentikan pekerjaan yang tidak relevan. Hindari unduhan gambar besar yang bersaing dengan bab aktif.
4. Pertahankan shell reader dan posisi scroll selama request. Skeleton hanya di area konten tujuan bila belum siap; hindari flash halaman loading umum untuk setiap transisi.
5. Pembayaran dan mutasi progres harus berhasil sebelum perpindahan dianggap selesai. Optimistic state hanya untuk feedback sementara, bukan bukti ownership atau saldo akhir.
6. Gabungkan aktivasi bab lama + pemilihan cabang dalam transaksi atomik. Tentukan expected progress version, validasi edge/source, access, harga dan saldo, lalu kembalikan progres/saldo terbaru. Konflik tab lain harus bisa dipulihkan tanpa menimpa progres diam-diam.

## Ketepatan transaksi

- Server menentukan biaya efektif: gratis, owned, premium, atau diskon; UI hanya menampilkan estimasi terakhir.
- Saldo dan unlock ditulis atomik. Konfirmasi membawa harga yang disetujui; perubahan harga memerlukan persetujuan ulang.
- Gunakan idempotency untuk transaksi berbayar dan request retry, termasuk alur choice yang sekarang belum mengirim request ID eksplisit. Audit fungsi database sebelum mengubah kontraknya.
- Timeout tidak membuktikan transaksi gagal. Retry harus merekonsiliasi hasil lama, bukan membeli ulang.
- Invalidasi hanya data yang berubah. Pembelian dari perangkat lain, logout, reset, dan publish baru tidak boleh meninggalkan cache akses yang salah.

## Verifikasi dan rollout

- Uji gratis, owned, premium harga 0, coin kurang, harga berubah, double-click, timeout setelah commit, retry, back/forward, dua tab, dan baca ulang dari peta.
- Uji bahwa Continue tetap mengarah ke progres aktif, bukan bab lama yang sedang dilihat; daftar Bab tetap mengikuti desain terakhir.
- Bandingkan request count, transferred bytes, click-to-content, LCP awal dan layout shift sebelum/sesudah, dengan kondisi yang sama. Optimasi tidak dianggap selesai hanya karena spinner lebih singkat.
- Jalankan typecheck, lint, pengujian navigasi/transaksi, build, lalu uji browser mobile untuk komik dan novel di Preview.
- Kirim P0, P1, lalu P2 secara terpisah ke Preview agar dampak terukur dan mudah ditelusuri. Pertahankan jalur rollback per tahap.
- Target pelaksanaan awal: P0 1–2 hari, P1 2–3 hari, P2 2–3 hari termasuk pengukuran dan regresi. Perkiraan perlu disesuaikan sesudah baseline.

## Prioritas handoff

Mulai dari P0. Hasil pertama yang harus terlihat: aksi gratis satu ketukan, popup biaya ringkas, tidak ada loading macet, dan laporan baseline. Berikutnya turunkan latency nyata lewat P1. Kerjakan prefetch serta aktivasi cabang atomik P2 setelah transaksi dan invalidasi cache terbukti benar.
