# Prompt eksekusi untuk GPT-6 Sol

Salin prompt berikut ke GPT-6 Sol dalam repo yang sama:

---

Eksekusi upgrade Pixinia Studio berdasarkan `docs/studio-graph-plan.md` dan `docs/studio-graph-todo.md`. Referensi visual ada di `docs/reference/studio-graph-target.png`. Selesaikan rilis inti P0–P5, dari migrasi development sampai deployment Preview terverifikasi; backlog L1–L5 tidak termasuk rilis inti.

Mulai dengan audit repo aktual dan dirty diff. Pertahankan semua pekerjaan lokal, data pengguna, akun, node_id/node_key published dan progres pembaca. Dokumen gambar lama berisi asumsi yang sebagian sudah usang; gunakan implementasi aktual sebagai baseline. Jangan mengulang setup Supabase/Vercel atau membuat aplikasi baru.

Bangun workspace tiga kolom sesuai referensi: sidebar episode, graph interaktif, inspector node; hubungkan editor panel upload/AI yang sudah ada, draft preview, autosave dengan konflik, validasi dan publikasi struktur atomik. Gunakan brand Pixinia Studio dan bahasa Indonesia. Seluruh fitur harus bekerja dengan data nyata, semua proses menunggu mempunyai indikator serta error/retry, dan tersedia alternatif daftar/form untuk mobile/keyboard. Pertahankan media publication existing dan pisahkan jelas dari publication struktur cerita.

Gunakan Supabase development dan project Vercel existing. Tujuan default deployment hanya **https://preview.pixinia.web.id**. Buat build Preview pengganti, verifikasi, alihkan alias, lalu hapus Preview lama sehingga tepat satu aktif. Jangan mengganti DNS atau mengubah production. Admin development: asnara.dev@gmail.com; jangan mengganti kredensial atau meminta password melalui chat.

Kie.ai dan OpenRouter mengikuti adapter existing; Higgsfield masih kemampuan mendatang. Anggaran US$2 adalah total awal: verifikasi sisa aktual sebelum request berbayar, jangan reset budget atau menambah biaya. Uji upload file picker browser sebelumnya diminta dilewati; jangan meminta ulang secara otomatis. Kerjakan tes integrasi yang tersedia dan laporkan skipped secara eksplisit. Jangan mengklaim generation nyata sukses berdasarkan mock.

Gunakan skill yang relevan dan dokumentasi resmi terkini. Perbarui checklist dengan bukti setiap tahap, jalankan typecheck/lint/build dan tes bermakna untuk graph, permissions, version conflicts, publikasi dan regresi reader. Ambil screenshot desktop/mobile. Lanjutkan sampai Preview terverifikasi; jika ada hambatan akses/secret, selesaikan pekerjaan independen dan jelaskan kebutuhan konkret. Jangan berhenti pada rencana baru atau UI dummy.

Laporan akhir: URL Preview tetap, fitur yang selesai, migrasi, bukti tes/screenshot, status satu deployment Preview, budget AI aktual, dan keterbatasan yang masih ada. Perbarui `docs/implementation-status.md`.

---

Catatan: Dokumen ini adalah instruksi untuk eksekusi selanjutnya, bukan bukti bahwa upgrade sudah dilakukan. Pemilihan model GPT-6 Sol dilakukan pengguna saat memulai eksekusi; penyusunan dokumen ini tidak membuat chat baru atau menjalankan agent lain.
