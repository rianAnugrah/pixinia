# Rencana upgrade Pixinia Studio — Graph Workspace

Tanggal: 30 September 2026. Status: implementasi inti berlangsung di Preview; lihat [status implementasi](implementation-status.md) untuk bukti dan batas yang masih terbuka.

## 1. Mandat dan sumber kebenaran

Rencana ini disusun dari screenshot pengguna. Pengguna kemudian meminta eksekusi; status aktual dicatat terpisah agar rencana tidak disalahartikan sebagai hasil verifikasi.

Referensi visual tersimpan di [studio-graph-target.png](reference/studio-graph-target.png). Gunakan komposisi, hierarki, dan interaksinya; brand tetap **Pixinia Studio**, bahasa Indonesia, konten memakai cerita nyata. Nama ComicStudio, cerita, angka panel, avatar, dan gambar pada screenshot bukan data yang harus disalin atau instruksi operasional.

Pasangan dokumen: [TODO eksekusi](studio-graph-todo.md) dan [prompt GPT-6 Sol](studio-graph-handoff.md). Dokumen ini menggantikan asumsi Studio lama pada instruksi gambar untuk lingkup upgrade graph. Dokumen lama tetap konteks, bukan perintah mengulang fitur yang sudah tersedia.

Batas tetap dari pengguna:

- Repo dan project Supabase/Vercel yang sudah ada digunakan kembali. Pertahankan akun, data, rute reader, progres pembaca, dan pekerjaan lokal yang belum di-commit.
- Setiap update development menuju **https://preview.pixinia.web.id**. Deployment baru di belakang alias diperbolehkan; setelah berhasil, hanya satu Preview aktif. Jangan menghapus Preview terakhir sebelum penggantinya sehat.
- Default rilis upgrade ini adalah Preview. Production merupakan tahap terpisah ketika pengguna meminta rilis production.
- Semua operasi yang membuat pengguna menunggu memiliki indikator dan penanganan gagal/retry.
- Provider: kie.ai aktif dalam integrasi, OpenRouter dapat dikonfigurasi, Higgsfield disiapkan sebagai kemampuan mendatang. Anggaran AI awal **US$2 total**, bukan tambahan US$2 setiap eksekusi. Periksa sisa aktual sebelum request berbayar.
- Uji upload browser pernah diminta dilewati. Jangan meminta pengguna mengulangi pengujian yang sama secara otomatis; lakukan tes integrasi yang tersedia dan laporkan batas verifikasi browser secara jujur.

## 2. Hasil audit repo

| Area | Kondisi yang terbaca dari kode | Implikasi |
|---|---|---|
| Stack | Next.js 15.5.26 App Router, React, TypeScript, pnpm; belum ada library graph | Tambah library khusus graph tanpa upgrade framework sekaligus |
| Studio cerita | `src/app/admin/stories/[slug]/page.tsx`: daftar node, form tambah node/pilihan | Ganti dengan workspace graph berbasis data nyata |
| Mutasi graph | `src/app/admin/actions.ts`: create story/node/choice | Perlu update/delete/order, transaksi draft, konflik, validasi dan publish graph |
| Domain | `stories`, `story_nodes`, `story_choices` | Node lama disebut chapter; belum ada pengelompokan episode |
| Media | `chapter_image_sets`, `chapter_images`, editor gambar dan API upload/generate | Pakai ulang lifecycle draft/published dan job; jangan membuat pipeline kedua |
| Izin | `requireStaff()` menerima editor/admin; migrasi editorial mencabut UPDATE/DELETE tabel cerita | Tombol graph harus didukung RPC berizin; membuka CRUD umum bukan solusi |
| Reader | `src/lib/data.ts`, `/read/[slug]/[nodeKey]`, RPC progres | Jaga ID/node_key dan relasi pilihan agar progres tetap valid |
| Shell | Root layout memasang Navbar dan footer publik pada semua halaman | Pisahkan layout publik dan Studio tanpa mengubah URL publik |
| UX tunggu | BusyStatus, SubmitButton, LoadingImage, route loading tersedia | Reuse dan lengkapi pada canvas, save, inspector, panel dan publish |

Status remote harus diverifikasi ulang saat eksekusi. Catatan terakhir: development Supabase `avvkbocpqkquzbsvaoeb`, production `etdjnilavmdugyzufmex`, Vercel `pixinia-web-id`; admin development `asnara.dev@gmail.com`. Kehadiran admin production belum terverifikasi. Jangan menganggap peran development berlaku di production.

## 3. Cakupan rilis dan menu referensi

**Rilis inti (wajib sampai selesai):** shell Studio, daftar cerita/ringkasan, episode sebagai grup, Story Graph, inspector node/pilihan, editor panel terintegrasi, pustaka media cerita dari aset yang ada, job AI, preview draft, validasi dan publikasi graph, loading/error, aksesibilitas dan rilis Preview.

| Menu referensi | Implementasi rilis inti |
|---|---|
| Dashboard / Comics | `/admin` sebagai daftar cerita dan ringkasan hitungan nyata |
| Overview | Ringkasan cerita, status, jumlah episode/node/ending/panel dan tautan pekerjaan |
| Episodes / Chapters kiri | Pengelompokan dan urutan episode; tidak mengganti identitas node lama |
| Story Graph | Workspace utama dengan filter episode atau seluruh cerita |
| Scenes | Tampilan daftar node yang juga menjadi alternatif graph untuk keyboard/mobile |
| Assets / Media | Pustaka thumbnail panel cerita, filter asal upload/AI, status, tautan ke editor sumber |
| AI Generation | Form dan riwayat job yang sudah ada, terikat ke node terpilih |
| Publish Settings | Validasi graph, review perubahan, publish graph dan status media yang terpisah jelas |
| Characters | Backlog lanjutan: CRUD karakter dan referensi gambar; sembunyikan menu pada rilis inti |
| Translations | Backlog lanjutan: locale, versi terjemahan dan review; sembunyikan menu |
| Analytics | Backlog lanjutan: definisi event dan agregasi; jangan tampilkan metrik palsu |
| Notification bell | Omit pada rilis inti; status job/save tampil di tempat relevan |

Tidak perlu menyalin semua menu screenshot sebagai tombol kosong. Menu lanjutan bukan syarat rilis inti dan tidak boleh dinyatakan sudah selesai.

## 4. Spesifikasi visual dan responsif

- Desktop 1440–1536 px: topbar sekitar 60–64 px, sidebar 232–248 px, inspector 304–336 px; canvas mengambil ruang tersisa. Workspace setinggi viewport, scroll terpisah pada sidebar/inspector, tanpa footer publik.
- Warna awal: latar `#0c1218`, panel `#131b24`, surface `#1d2834`, border `#344252`, teks `#f3f6fa`, muted `#a7b5c4`, biru `#5688ff`, ungu `#a66aff`, start hijau `#3ec9a3`. Verifikasi kontras; nilai ini target desain, bukan hasil pengukuran screenshot.
- Topbar: brand Pixinia Studio, navigasi inti, pencarian cerita/node, identitas akun. Pencarian memiliki empty/loading/error, debounce dan pembatalan hasil usang.
- Sidebar: kembali ke daftar cerita, cover/nama/status cerita, navigasi lokal, daftar episode bernomor, tambah episode. Episode terpilih diberi latar biru gelap.
- Canvas: grid titik halus, node card thumbnail berukuran sekitar 220–240 × 120–148 px, judul, key, badge start/ending, jumlah panel dan status draft/media. Thumbnail dari panel nyata, fallback bermakna jika kosong.
- Pilihan: garis melengkung berpanah dengan label berbentuk pill; warna biru/merah/ungu sebagai dekorasi pilihan, bukan asumsi baik/buruk. Label dan arah wajib terbaca tanpa mengandalkan warna.
- Toolbar: judul episode/cerita, status, save state, undo/redo lokal, zoom -/+, persentase, fit view, fullscreen, auto-layout, tambah node. Mini-map dapat ditutup dan tidak menutupi kontrol.
- Inspector: tab Detail/Preview; cover, key, judul, ringkasan, jenis/start, hitungan panel dan Edit panel, daftar pilihan beserta target/urutan/edit/hapus, tags dan catatan internal.
- 1024–1279 px: sidebar bisa diciutkan, inspector drawer. Di bawah 768 px: default daftar node, graph opsional layar penuh, inspector bottom sheet; semua aksi juga tersedia tanpa drag.
- Ikon memakai lucide-react yang sudah ada. Jangan mengambil aset anime dari screenshot; pakai media cerita/fixture berlisensi yang tersedia.

## 5. Semantik domain dan data baru

Istilah final: **Cerita → Episode (grup) → Node/adegan bercabang → Panel gambar**. `story_nodes.node_type='episode'` tetap dipertahankan untuk kompatibilitas, meskipun UI menyebutnya Node biasa. Rute lama `/chapters/[nodeId]` tetap berfungsi sebagai editor panel node.

Rancangan berikut adalah keputusan implementasi yang harus diwujudkan lewat migrasi baru, dengan detail SQL dikonfirmasi dari schema aktual:

1. `story_episodes`: id, story_id, title, sort_order, timestamps. Satu grup awal “Episode 1” untuk seluruh node setiap cerita lama; jangan menebak pembagian cerita dari node_key. Pengelompokan bersifat editorial, tidak mengubah urutan baca. Hapus episode hanya jika kosong atau seluruh anggota sudah dipindahkan dalam transaksi.
2. `studio_graph_drafts`: satu per story, version bigint, base publication version, created_by/updated_by, timestamps. Seluruh mutasi memakai expectedVersion dan mengunci draft yang sama.
3. `studio_graph_nodes`: draft_id, stable node_id yang menunjuk story_nodes, episode_id, node_key, title, synopsis, node_type, is_start, tags, private_notes, x/y, deleted flag. Composite constraints memastikan story/episode/draft/node seinduk. Node baru membuat identitas story_nodes berstatus draft secara terkontrol, kemudian menambah data draft. Data publik node yang sudah terbit tidak ditimpa ketika mengedit.
4. `studio_graph_choices`: draft_id, stable choice_id, source/target node_id, label, description, sort_order, display_color, condition_json yang dipertahankan, deleted flag. Endpoint harus berada di graph cerita yang sama. Jangan menghapus kondisi lama saat menyimpan label. UI rilis inti tidak menyediakan editor bahasa kondisi baru.
5. `studio_graph_publications`: story_id, version, snapshot graph tervalidasi, actor, published_at; staff-only. Snapshot menyimpan struktur editorial untuk audit/pemulihan, bukan URL bertanda tangan atau secret. Tidak perlu fitur riwayat visual penuh pada rilis inti.

Posisi node dan notes/tags editorial tidak perlu disalin ke tabel publik. Viewport/selection boleh disimpan lokal per akun+story+episode; posisi node harus tersimpan server. Tambahkan index pada draft, story, episode dan source/target.

**Publikasi sebagai proyeksi kompatibel:** reader terus memakai `story_nodes` dan `story_choices`. RPC publish satu transaksi memvalidasi graph utuh, memeriksa expectedVersion, memperbarui kolom konten publik, merekonsiliasi pilihan dengan ID stabil, memperbarui status, menulis snapshot, dan menaikkan publication version. Perubahan graph yang masih draft tidak terlihat reader.

Publikasi mencakup satu cerita penuh; filter episode bukan batas transaksi. Hanya satu start global per cerita. Endpoint berbeda episode pada cerita sama boleh, tampil sebagai tautan lintas episode; endpoint cerita lain ditolak.

**Kompatibilitas pembaca:** node_id dan node_key published tidak dapat diganti/dihapus pada rilis inti. Node published dapat diedit isinya melalui draft, tetapi penghapusan ditolak agar progres lama tidak kehilangan lokasi. Penghapusan node draft harus mengecek referensi dan meminta konfirmasi daftar edge yang ikut dihapus. Node baru jangan langsung masuk katalog publik. Revalidasi reader/katalog setelah publish. Pertahankan ID choice yang tidak berubah.

**Media terpisah secara eksplisit:** `chapter_image_sets` tetap memiliki lifecycle dan publication sendiri; graph publish tidak diam-diam menerbitkan gambar draft. Tombol UI dibedakan “Terbitkan struktur cerita” dan “Terbitkan panel node”. Validasi publish graph menolak node baru tanpa media published siap baca, kecuali node teks yang memang didukung reader dan ditandai secara eksplisit; default rilis ini semua node komik perlu media. Dukung media seed legacy sebagai media valid. Inspector memperlihatkan perbedaan draft/terbit dan jumlah panel dari versi yang tepat.

Editor/admin dapat mengubah draft; hanya admin dapat publish. Seluruh tabel studio baru staff-only dengan RLS dan grants sesuai kebutuhan, tanpa pembacaan anonim. RPC privileged wajib validasi sesi, role, kepemilikan relasi, search_path dan EXECUTE grants. Jangan membuka UPDATE/DELETE umum hanya untuk melewati editorial guards. Catatan internal, prompt dan biaya tidak masuk payload reader.

## 6. Arsitektur aplikasi dan kontrak operasi

- Root layout hanya html/body/global styles. Pindah Navbar/footer publik ke route group `(public)` yang menjaga URL; `/admin/layout.tsx` menjadi shell Studio dengan pemeriksaan server. Hindari dua root html/body dan regresi redirect Auth.
- Route utama tetap `/admin/stories/[slug]`, query `view=graph|overview|episodes|scenes|media|ai|publish`, `episode=<uuid|all>` dan `node=<uuid>`. Validasi query; perubahan pilihan node tidak memuat ulang seluruh graph. Deep link membuka inspector yang benar.
- Server Component memuat sesi, cerita dan snapshot graph awal. Client island graph lazy-load, memakai `@xyflow/react` dan satu adapter layout `@dagrejs/dagre`. Verifikasi versi kompatibel dan pin di lockfile; jangan menambah framework UI/state lain tanpa kebutuhan terbukti.
- Usulan folder: `src/components/studio/{studio-shell,story-workspace,story-graph,graph-node,graph-edge,node-inspector,choice-editor,episode-list,panel-drawer,graph-toolbar,graph-validation}.tsx` dan `src/lib/studio/{types,graph-validation,graph-layout,graph-data}.ts`.
- Endpoint `GET/PATCH /api/studio/graph`, `POST /api/studio/graph/publish`, dengan schema request/response TypeScript tervalidasi server; detail boleh disatukan ke Server Actions jika semantics setara. Jangan memakai response redirect HTML sebagai error JSON API.
- GET menerima storyId dan mengembalikan draftVersion, publicationVersion, nodes, choices, episodes, panel counts dan provider capabilities. Thumbnail signed URL dibuat server setelah izin, memiliki strategi refresh saat kedaluwarsa.
- PATCH menerima `{ storyId, expectedVersion, mutationId, operations }`. Operasi: create/update/delete node draft, moveNodes batch, create/update/delete/reorder choice, setStart, create/update/reorder/delete episode. UUID/input bounds divalidasi; mutasi atomik dan idempotent. Response mengembalikan versi baru serta ID/hasil canonical. Konflik version -> 409 beserta versi aktual tanpa menimpa edit lokal.
- Publish menerima storyId, expectedVersion, mutationId; mengembalikan publicationVersion atau daftar temuan dengan node/choice terkait. 401 belum login, 403 tanpa izin, 422 input/graph tidak valid, 409 konflik, 5xx kegagalan aman. Pesan pengguna berbahasa Indonesia.
- Reuse `chapter-image-editor.tsx`, API `/api/studio/images`, `/api/studio/generate`, `image-providers.ts`, dan RPC image set. Pisahkan komponen editor bila perlu tanpa menghapus route standalone lama.
- Query graph dibatch; jangan satu fetch panel/job per node. Batasi thumbnail dan lazy-load gambar; inspector mengambil detail node saat diperlukan. DTO graph tidak memuat bytes gambar atau seluruh riwayat job.

## 7. Interaksi, autosave, dan graph rules

Klik node membuka inspector; double-click/Edit panel membuka drawer editor panel. Tambah node membuka form, tidak langsung membuat record kosong. Drag connection membuka form label lalu menyimpan choice. Pindah target pilihan dan reorder tersedia lewat form/tombol keyboard.

Drag node disimpan pada drag-end; perubahan metadata memakai debounce sekitar 700 ms dan tombol Simpan. Satu antrean mutasi per draft, expectedVersion diperbarui dari respons; jangan mengirim request pada setiap pointer move. Pembaruan lokal optimistic ditandai belum tersimpan. Setelah sukses tampil “Tersimpan”; gagal tetap menyimpan input lokal dan menyediakan retry. Refresh setelah save harus memulihkan posisi/metadata. Navigasi dengan perubahan belum tersimpan memberi pilihan simpan/buang/tetap. Draft sementara lokal jika digunakan harus scoped akun+story dan dibersihkan saat logout, tidak memuat signed URL/secret.

Undo/redo terbatas pada operasi editorial sesi aktif melalui inverse operation yang dikirim dengan version check; tidak membatalkan tagihan AI, file storage, atau publication. Shortcut diabaikan saat fokus input. Konflik dua tab menghentikan antrean dan menawarkan muat versi server atau salin edit lokal; jangan silent last-write-wins.

Validasi draft dapat toleran terhadap graph belum selesai; validasi publish wajib:

- Tepat satu start, minimal satu ending, node_key unik, label choice tidak kosong, target valid dalam cerita.
- Semua node aktif dapat dicapai dari start, setiap non-ending memiliki pilihan keluar dan jalan ke ending; ending tidak memiliki pilihan keluar.
- Graph rilis inti berupa DAG: tolak self-loop dan siklus baru. Jika audit menemukan siklus legacy, jangan menghapusnya; tampilkan temuan dan blok publish sampai perbaikan editorial eksplisit. Membaca cerita lama tetap berjalan.
- Dua pilihan dengan target sama boleh jika label berbeda; duplicate source+target+label ditolak. Urutan deterministik dan unik per source.
- Batas panjang input, ukuran payload, jumlah operasi batch dan koordinat finite ditetapkan serta dibagikan UI/server. Uji graph 100 node/150 pilihan sebagai baseline, lalu gunakan pagination/level detail bila audit konten jauh lebih besar.
- Auto-layout mengubah posisi saja, menyimpan sebagai satu batch, dapat di-undo; jangan otomatis menata ulang setiap fetch. Thumbnail/panel counts tidak boleh mengubah posisi node.

## 8. Loading, error, AI dan aksesibilitas

| Proses | Indikator dan hasil gagal |
|---|---|
| Route/graph awal | Skeleton shell/canvas + status memuat; retry jika fetch gagal |
| Inspector / pencarian | Skeleton lokal, abaikan hasil request node lama, empty state bermakna |
| Gambar thumbnail/panel | Placeholder berukuran tetap, load/error; cek cached image dan reset state ketika src berubah |
| Autosave | Belum tersimpan → menyimpan → tersimpan/gagal/konflik; jangan spinner tanpa akhir |
| Upload | Tahap persiapan/upload/finalisasi per file, hasil parsial, retry tanpa duplikasi |
| AI | Antre/proses/menyimpan hasil/selesai/gagal; polling terbatas, resume setelah refresh |
| Publish / layout berat | Status lokal, nonaktifkan submit duplikat, error mengarah ke node bermasalah |

Kie tetap memakai adapter existing `gpt-image-2-text-to-image`. Jangan mengubah endpoint/model atau memicu generasi berbayar untuk sekadar mengisi screenshot. OpenRouter hanya bisa dipilih jika server menyatakan configured; Higgsfield menampilkan belum tersedia bila ditampilkan. Kegagalan tidak boleh fallback berbayar tanpa budget. Gunakan mock untuk tes UI/state, catat terpisah dari hasil provider nyata.

Focus terlihat, label tombol ikon, role/status live yang tidak spam setiap polling, reduced motion, kontras memadai. Dialog mengunci fokus, Escape menutup, fokus kembali ke pemicu. Semua operasi graph punya alternatif daftar/form; swipe tidak boleh membuat halaman mobile tidak dapat digulir. Tidak ada UI yang hanya bergantung hover/warna.

## 9. Tahapan, dependensi, dan bukti kelulusan

| Tahap | Deliverable | Syarat selesai |
|---|---|---|
| P0 audit | Inventaris schema/role/env/dirty diff, baseline screenshots dan data | Asumsi dikonfirmasi tanpa membocorkan secret |
| P1 fondasi | Episode/draft/publication schema, backfill dan kontrak typed | ID lama utuh, public read identik, RLS dan konflik teruji |
| P2 shell + graph | Workspace responsif, graph nyata, list fallback dan inspector read-only | Visual sesuai komposisi, navigasi dan load state berfungsi |
| P3 editing | Mutasi node/choice/episode, posisi, autosave, undo, validator | CRUD round-trip dan dua tab konflik teruji |
| P4 media + publish | Editor panel/draft preview/job dan publish graph atomik | Draft tidak bocor; reader menerima graph terbit; AI tidak regress |
| P5 QA + rilis | Tests, screenshot, deployment dan catatan status | Alias tetap sehat; tepat satu Preview; hasil tes jujur |

Kerjakan vertical slice graph read-only setelah fondasi, lalu satu operasi end-to-end sebelum seluruh CRUD. Jangan menunggu seluruh UI selesai untuk membuktikan API/izin. Tiap tahap memperbarui checklist dan bukti. Tidak ada estimasi waktu wajib; urutan dan gate di atas adalah kontrol penyelesaian.

## 10. Pengujian dan rilis

Tambahkan runner test yang sesuai bila belum tersedia; repo belum memiliki script test. Tes bermakna: graph validator (diamond, unreachable, cycles, cross-story, start/ending), transactional publish rollback, idempotency, optimistic version conflict, RLS anonymous/reader/editor/admin melalui API/DB, upload/job regressions dengan fixture. Jangan hanya menguji bahwa komponen menampilkan string implementasinya.

Skenario penerimaan: buka cerita existing → filter episode → pilih node → edit judul/catatan → drag → tambah node → tambah/reorder pilihan → refresh → buka panel editor → preview draft → validasi → publish sebagai admin → reader mengikuti cabang dengan ID/progres lama tetap benar. Uji kegagalan save offline, respons terlambat, konflik dua tab, gambar cached/error dan sesi habis. Pengujian file picker browser yang pernah dilewati tetap dicatat skipped kecuali pengguna mengubah instruksi.

Jalankan `pnpm typecheck`, `pnpm lint`, `pnpm build` dan tes baru yang relevan. Bandingkan screenshot pada 1536×1024, 1280×800 dan 390×844; simpan bukti aktual dan pastikan console/network tanpa error aplikasi. Uji 100 node/150 edge untuk drag/zoom/selection dan responsive layout; catat mesin/browser bila melaporkan pengukuran.

Migrasi development dahulu, additive/backward-compatible, tidak mengedit migration yang sudah diterapkan, tidak reset/seed destruktif. Deployment Preview memakai Supabase development. Setelah build READY, alihkan alias tetap, smoke test auth/Studio/reader, kemudian hapus hanya Preview lama dalam project yang benar. Jika deployment baru gagal, pertahankan alias/build lama. Jangan menyentuh production atau record DNS yang sudah benar.

Rollback aplikasi: alias ke build sehat sebelumnya sebelum cleanup; setelah cleanup perlu redeploy sumber yang diketahui sehat. Simpan identitas source/build dan hasil migrasi. Rollback schema mengutamakan forward fix dan pemulihan backup yang diverifikasi; jangan drop tabel berisi data. Snapshot graph bukan backup lengkap database/Storage.

Laporan akhir menyebut URL tetap, fitur yang selesai, migrasi, tes/bukti, budget AI yang benar-benar dipakai, fitur lanjutan yang belum dibuat, dan batas pengujian. Update `docs/implementation-status.md` tanpa mengklaim production telah berubah.

## 11. Rujukan implementasi

- [React Flow: dokumentasi resmi](https://reactflow.dev/learn) — graph interaktif, custom nodes/edges, controls, minimap; cek API versi terpasang saat eksekusi.
- [Next.js App Router](https://nextjs.org/docs/app) — cek layout, route groups dan batas client/server saat implementasi.
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) — cek policy, grants dan RPC terhadap schema aktual.
- Skill Next.js/Supabase/Vercel yang relevan dibaca saat eksekusi. Akses indeks changelog Supabase melalui web gagal saat penyusunan rencana; pelaksana perlu memverifikasi dokumentasi terkini sebelum menulis migrasi, bukan menganggap API baru telah dikonfirmasi.
