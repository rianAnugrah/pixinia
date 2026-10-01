# Checklist eksekusi Reader — GPT-6 Sol

Status: implementasi lokal selesai; lihat [bukti dan batas](reader-mobile-status.md). Ikuti [rencana utama](reader-mobile-plan.md). Centang hanya setelah ada bukti.

## 0. Baseline
- [x] Baca instruksi repo aktif, git diff dan referensi; pertahankan pekerjaan lokal.
- [ ] Catat shell, kontrak akses, RPC, sumber media dan status database sebenarnya.
- [ ] Siapkan cerita uji published: linear, branching, ending, kosong, label panjang dan media gagal.
- [x] Simpan hasil checks awal dan inspeksi visual browser.

## 1. Reader mobile
- [x] Pisahkan shell baca tanpa mengubah URL dan shell Studio/auth.
- [x] Panel full-width, rasio asli, caption terbaca, state loading/error/retry.
- [x] Header ringkas, toolbar, counter aktif, slider dan panah antar-panel.
- [x] Safe-area, 100dvh, ruang toolbar dan nol horizontal overflow pada viewport yang diuji.
- [ ] Periksa shared stack di editor dan preview Studio.

## 2. Pilihan dan progres mobile
- [x] Choice multiline, target sentuh, busy, submit ganda, retry dan conflict handling di kode.
- [ ] Guest → login → kembali, start vs resume, ending vs konten tidak tersedia: guest → login teruji; sisanya perlu akun penguji.
- [ ] Bookmark panel lokal tervalidasi, reload, back/forward, pergantian akun/media: implementasi ada; fixture multipanel belum tersedia.
- [x] Baca ulang tidak memutasi progres; tidak ada next chapter berdasarkan sort node.
- [x] Tes helper riwayat/posisi panel dan inspeksi mobile P0.

## 3. Journey mobile
- [x] Detail cerita: cover, CTA, Bab/Tentang dan status berdasarkan data.
- [x] Fallback daftar bab yang dilalui; hitungan panel nyata.
- [x] Beranda/pustaka: cover, lanjut membaca dan nav untuk rute existing.
- [ ] Alur lengkap beranda → reader → choice → resume lolos mobile.

## 4. Responsive setelah mobile lolos
- [ ] Tablet 768/1024, desktop 1440 dan landscape 844×390: 768×1024 dan 1440×900 diperiksa; landscape belum.
- [x] Batas lebar komik dan pilihan tetap mudah digunakan pada viewport yang diuji.
- [ ] Keyboard, focus dialog, kontras, reduced-motion, zoom teks 200%: implementasi focus dan reduced-motion ada; audit lengkap belum.

## 5. Penutupan
- [x] Lint, typecheck, test, build; catat satu lint warning yang tidak memblokir.
- [ ] Screenshot empat layar mobile + reader tablet/desktop, bukti alur dan error.
- [x] Catat file berubah, tidak ada migrasi baru, keterbatasan dan pekerjaan tersisa di status.
- [x] Deployment Preview dilakukan setelah pengguna memintanya; build READY dan alias tetap diverifikasi. Production belum diubah.
