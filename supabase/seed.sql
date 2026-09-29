-- Original editorial seed. Idempotent and free to read.
insert into public.stories(id, slug, title, tagline, description, status, visibility, published_at)
values ('10000000-0000-4000-8000-000000000001', 'arsip-senja', 'Arsip Senja',
  'Satu kota. Satu jam yang hilang. Dua akhir yang menunggumu.',
  'Saat seluruh jam di kota berhenti pada pukul enam, Nara menemukan peta menuju Arsip Senja. Keputusanmu menentukan apakah waktu kembali bergerak atau kota selamanya terjebak dalam senja.',
  'published', 'public', now())
on conflict (id) do update set title = excluded.title, tagline = excluded.tagline, description = excluded.description;

insert into public.story_nodes(id, story_id, node_key, title, synopsis, node_type, is_start, status) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','jam-keenam','Jam Keenam','Saat lonceng keenam berbunyi, semua orang membeku kecuali Nara.','episode',true,'published'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','menara-kaca','Menara Kaca','Di puncak menara, sebuah pesan terukir pada kaca yang tidak memantulkan bayangan.','episode',false,'published'),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','pasar-sunyi','Pasar Sunyi','Pasar yang ramai pagi tadi kini menyimpan satu pedagang yang masih bergerak.','episode',false,'published'),
('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000001','sungai-balik','Sungai Balik','Air mengalir ke arah hulu, membawa ingatan yang bukan milik Nara.','episode',false,'published'),
('20000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000001','ruang-peta','Ruang Peta','Peta kota berubah setiap kali Nara berkedip.','episode',false,'published'),
('20000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000001','pintu-arsip','Pintu Arsip','Dua jalan kembali menjadi satu di depan pintu yang tidak punya kunci.','episode',false,'published'),
('20000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-000000000001','fajar-baru','Fajar Baru','Nara mengembalikan waktu. Kota terbangun dengan kenangan yang baru.','ending',false,'published'),
('20000000-0000-4000-8000-000000000008','10000000-0000-4000-8000-000000000001','senja-abadi','Senja Abadi','Nara memilih menjaga satu momen, dan kota belajar hidup di dalamnya.','ending',false,'published')
on conflict (id) do update set title = excluded.title, synopsis = excluded.synopsis;

insert into public.story_choices(id,story_id,node_id,next_node_id,label,sort_order) values
('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','Naik ke Menara Kaca',1),
('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','Cari jawaban di pasar',2),
('30000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000004','Ikuti cahaya menuju sungai',1),
('30000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000005','Baca peta di dinding',2),
('30000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000004','Percayai si pedagang',1),
('30000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000005','Ambil peta yang ditinggalkan',2),
('30000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000006','Kembali ke pusat kota',1),
('30000000-0000-4000-8000-000000000008','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000006','Ikuti garis merah di peta',1),
('30000000-0000-4000-8000-000000000009','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000006','20000000-0000-4000-8000-000000000007','Lepaskan jam yang rusak',1),
('30000000-0000-4000-8000-000000000010','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000006','20000000-0000-4000-8000-000000000008','Simpan satu momen selamanya',2)
on conflict (id) do update set label = excluded.label, sort_order = excluded.sort_order;

insert into public.story_assets(id,story_id,node_id,format,asset_type,external_provider,external_asset_id,status,alt_text) values
('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','comic','panel','local','/comic/jam-keenam.svg','published','Kota berhenti saat matahari senja'),
('40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','comic','panel','local','/comic/menara-kaca.svg','published','Menara kaca di bawah langit merah'),
('40000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003','comic','panel','local','/comic/pasar-sunyi.svg','published','Pasar tanpa gerak'),
('40000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000004','comic','panel','local','/comic/sungai-balik.svg','published','Sungai memantulkan warna senja'),
('40000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000005','comic','panel','local','/comic/ruang-peta.svg','published','Peta bercahaya di ruang gelap'),
('40000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000006','comic','panel','local','/comic/pintu-arsip.svg','published','Pintu bercahaya menuju arsip'),
('40000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000007','comic','panel','local','/comic/fajar-baru.svg','published','Matahari pagi menyinari kota'),
('40000000-0000-4000-8000-000000000008','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000008','comic','panel','local','/comic/senja-abadi.svg','published','Langit senja abadi di atas kota')
on conflict (id) do update set alt_text = excluded.alt_text;

insert into public.story_asset_panels(id,asset_id,panel_order,speaker,dialogue,caption) values
('50000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001',1,'Nara','Kenapa semua orang diam?','Jarum jam berhenti tepat pukul enam.'),
('50000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000002',1,'Nara','Bayanganku tidak ada di kaca ini.','Sebuah panah menunjuk ke sungai dan ruang peta.'),
('50000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000003',1,'Pedagang','Waktu tidak hilang. Seseorang menyimpannya.','Hanya satu orang lain yang masih dapat bergerak.'),
('50000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000004',1,'Nara','Airnya mengalir mundur… seperti ingatanku.','Di permukaan air tampak pintu yang belum pernah ia lihat.'),
('50000000-0000-4000-8000-000000000005','40000000-0000-4000-8000-000000000005',1,'Nara','Setiap jalan ternyata menuju pintu yang sama.','Peta menunjukkan pusat kota dalam cahaya keemasan.'),
('50000000-0000-4000-8000-000000000006','40000000-0000-4000-8000-000000000006',1,'Penjaga Arsip','Kembalikan waktu, atau simpan hari ini selamanya.','Tidak ada pilihan tanpa harga.'),
('50000000-0000-4000-8000-000000000007','40000000-0000-4000-8000-000000000007',1,'Nara','Selamat pagi.','Detik pertama terdengar lagi di seluruh kota.'),
('50000000-0000-4000-8000-000000000008','40000000-0000-4000-8000-000000000008',1,'Nara','Kalau satu momen bisa tetap indah, biarlah ini milik kita.','Senja tidak pernah berakhir, tetapi kota terus bercerita.')
on conflict (id) do update set dialogue = excluded.dialogue, caption = excluded.caption;
