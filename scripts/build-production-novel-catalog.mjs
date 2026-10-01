import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Production catalog companion to the authored Peta Langit yang Retak seed.
// The fixed title matrix is intentionally data-driven so the SQL stays compact.
const genres = [
  { genre: "fantasi", tags: ["sihir", "dunia tersembunyi", "pilihan bercabang"], left: ["Atlas", "Mahkota", "Perpustakaan", "Menara", "Penenun", "Pewaris", "Gerbang", "Naga", "Bulan", "Peta"], right: ["Musim Terakhir", "Kota Terapung", "Bahasa Naga", "Tujuh Gerbang", "Laut Kaca", "Pohon Ingatan", "Kerajaan Abu", "Bintang Jatuh", "Sungai Waktu", "Langit Kedua"] },
  { genre: "romansa", tags: ["slow burn", "pertemuan kembali", "pilihan hati"], left: ["Surat", "Kopi", "Musim", "Jarak", "Janji", "Stasiun", "Hujan", "Foto", "Rumah", "Lagu"], right: ["yang Tak Terkirim", "di Ujung Kota", "untuk Hari Senin", "Sebelum Pagi", "Nomor Sebelas", "yang Kita Lupa", "di Musim Hujan", "dari Seberang", "Setelah Perpisahan", "di Jendela Timur"] },
  { genre: "petualangan", tags: ["ekspedisi", "persahabatan", "peta rahasia"], left: ["Ekspedisi", "Kompas", "Kapal", "Jejak", "Tim", "Pencari", "Pelabuhan", "Lembah", "Pulau", "Kafilah"], right: ["ke Ujung Peta", "dan Kota Hilang", "di Laut Utara", "melewati Tujuh Badai", "Tanpa Nama", "di Negeri Pasang", "dan Jam Pasir", "di Balik Kabut", "menuju Matahari", "yang Menghilang"] },
  { genre: "drama", tags: ["keluarga", "rahasia masa lalu", "pilihan hidup"], left: ["Rumah", "Nama", "Foto", "Keluarga", "Kebun", "Warisan", "Meja", "Pulang", "Tahun", "Kamar"], right: ["di Gang Melati", "yang Tertinggal", "Hari Minggu", "di Lantai Dua", "Sebelum Senja", "yang Tak Selesai", "untuk Tiga Saudara", "dan Suara Hujan", "di Kota Kecil", "Tanpa Alamat"] },
  { genre: "misteri", tags: ["investigasi", "petunjuk tersembunyi", "teka-teki"], left: ["Kasus", "Arsip", "Jam", "Detektif", "Kode", "Lorong", "Saksi", "Surat", "Kunci", "Hotel"], right: ["Kamar Kosong", "Pukul Tiga", "di Rumah Kaca", "yang Terhapus", "Nomor Terakhir", "di Kota Kabut", "Tanpa Bayangan", "dari Tahun Lalu", "di Lantai Tujuh", "yang Tak Ada"] },
  { genre: "horor", tags: ["rumah angker", "rahasia", "survival"], left: ["Rumah", "Bisikan", "Penjaga", "Malam", "Cermin", "Desa", "Lift", "Kamar", "Lonceng", "Bayangan"], right: ["di Ujung Jalan", "dari Lantai Bawah", "Pukul Dua Belas", "yang Mengetuk", "Tanpa Wajah", "di Balik Dinding", "yang Tidak Tidur", "dari Sumur Tua", "di Hari Ketujuh", "yang Mengingat"] },
  { genre: "fiksi-ilmiah", tags: ["masa depan", "kecerdasan buatan", "dilema teknologi"], left: ["Protokol", "Koloni", "Sinyal", "Orbit", "Ingatan", "Mesin", "Kapten", "Kota", "Algoritma", "Stasiun"], right: ["Fajar Buatan", "di Planet Kesembilan", "dari Bumi Lama", "Tanpa Awak", "yang Terbangun", "di Ujung Orbit", "dan Manusia Terakhir", "di Tahun 2140", "di Sisi Gelap", "yang Memilih"] },
  { genre: "slice-of-life", tags: ["kehidupan sehari-hari", "persahabatan", "tumbuh bersama"], left: ["Toko Roti", "Klub", "Apartemen", "Kebun", "Kelas", "Kucing", "Warung", "Tetangga", "Peron", "Jendela"], right: ["Buka Pukul Enam", "di Atap Sekolah", "Lantai Empat", "di Musim Semi", "Setelah Bel Pulang", "Pulang Sendiri", "di Sudut Gang", "yang Selalu Menyala", "Nomor Terakhir", "Menghadap Timur"] },
  { genre: "aksi", tags: ["konspirasi", "misi rahasia", "kejar-kejaran"], left: ["Operasi", "Kurir", "Tim", "Agen", "Kode", "Pemburu", "Benteng", "Saksi", "Target", "Jalur"], right: ["Tengah Malam", "di Kota Bawah", "Tanpa Jejak", "Sebelum Fajar", "Nomor Nol", "yang Berkhianat", "di Zona Merah", "dari Dalam", "Terakhir", "di Garis Batas"] },
  { genre: "komedi", tags: ["komedi situasi", "salah paham", "teman sekamar"], left: ["Kos", "Kantor", "Kafe", "Klub", "Tetangga", "Rapat", "Koki", "Ketua", "Asrama", "Kucing"], right: ["Penuh Kejutan", "dan Tiga Kunci", "Tanpa Rencana", "Pukul Delapan", "yang Salah Alamat", "Mencari Wi-Fi", "dengan Menu Rahasia", "Salah Pilih", "di Hari Senin", "Jadi Bos"] },
];

const hooks = {
  fantasi: ["seorang kartografer muda menemukan peta yang mengubah kota setiap kali seseorang berbohong", "seorang pewaris tanpa sihir harus menyatukan wilayah yang kehilangan musim", "seorang penjaga perpustakaan mendengar buku-buku memanggil nama pemilik masa depannya"],
  romansa: ["dua mantan sahabat menerima surat yang sama dari diri mereka sepuluh tahun mendatang", "seorang pemilik kedai kopi dan pelanggan tetapnya bertukar catatan di balik struk", "dua orang yang selalu berpapasan di stasiun menemukan tiket dengan tanggal yang sama"],
  petualangan: ["sekelompok teman mengikuti peta warisan menuju pulau yang berpindah mengikuti pasang", "seorang pemandu harus membawa para penjelajah melewati lembah yang menghapus jejak", "seorang kurir membawa kompas rusak yang selalu menunjuk ke orang hilang"],
  drama: ["tiga saudara pulang untuk menjual rumah dan menemukan surat yang mengubah cerita keluarga", "seorang penjaga kebun merawat tempat yang menyimpan pesan dari para tetangga", "sebuah foto lama mempertemukan kembali keluarga yang lama menghindari satu sama lain"],
  misteri: ["seorang arsiparis menemukan laporan kasus yang mencatat kejadian sehari sebelum terjadi", "jam kota berhenti setiap malam tepat saat seorang warga menghilang", "seorang detektif amatir menerima petunjuk dari saksi yang tidak tercatat pernah ada"],
  horor: ["penghuni baru mendengar ketukan dari kamar yang tidak tercantum pada denah", "sebuah desa mengulang malam yang sama setiap kali lonceng dibunyikan", "penjaga gedung menemukan lantai tambahan yang hanya muncul pada rekaman kamera"],
  "fiksi-ilmiah": ["awak koloni menerima sinyal dari kapal mereka sendiri yang baru akan diluncurkan", "sebuah kota menghapus satu kenangan warga setiap kali sistemnya mencegah bencana", "seorang teknisi menemukan bahwa kecerdasan buatan stasiun menyembunyikan satu planet"],
  "slice-of-life": ["para penghuni apartemen membentuk klub kecil untuk membantu satu sama lain melewati perubahan", "seorang siswa mengelola kebun atap dan mengenal teman-teman melalui catatan tanaman", "pemilik toko roti malam menjadi tempat singgah orang-orang yang kehilangan arah"],
  aksi: ["seorang kurir terseret misi untuk mengantar bukti sebelum kota dikunci", "tim kecil memburu sumber sinyal yang mematikan seluruh kamera kota", "seorang agen yang ingin pensiun harus memilih siapa yang layak dipercaya"],
  komedi: ["teman-teman kos salah mengira paket misterius sebagai hadiah lomba dan membuat kekacauan", "seorang pegawai baru ditunjuk memimpin tim paling tidak teratur di kantor", "kafe kecil menjalankan menu rahasia yang setiap hari diciptakan pelanggan"],
};
const leads = ["Nara", "Bima", "Sena", "Laras", "Dira", "Raka", "Tara", "Aksa", "Mira", "Jati", "Kirana", "Rumi", "Damar", "Sora", "Alya", "Niko", "Aruna", "Bayu", "Kei", "Mawar"];
const settings = ["kota pesisir yang lampunya sering padam", "kawasan lama di balik stasiun", "desa yang dikelilingi kebun teh", "apartemen yang selalu ramai menjelang senja", "kepulauan kecil di utara", "kota baru yang dibangun mengitari bendungan", "lorong pertokoan yang akan segera digusur", "perbatasan antara hutan dan kota", "stasiun yang hanya sibuk saat hujan", "lingkungan sekolah di atas bukit"];
const beats = [
  ["Sebuah tanda kecil mengubah rencana hari itu", "Teman seperjalanan menawarkan penjelasan yang belum tentu benar", "Satu pintu terbuka, sementara jalan lain mulai tertutup", "Petunjuk lama memberi arti baru pada kejadian pagi tadi", "Tokoh utama menemukan bahwa seseorang telah menyiapkan tempat untuknya", "Kesepakatan sederhana ternyata memiliki konsekuensi", "Malam membawa kabar yang tidak bisa ditunda", "Sebuah pilihan menyatukan dua orang yang berbeda tujuan", "Kebenaran muncul dari benda yang hampir dibuang", "Pagi datang bersama keputusan yang harus dipertanggungjawabkan"],
  ["Perjalanan membawa mereka ke tempat yang pernah disebut dalam cerita", "Seseorang mengakui bagian kecil dari rahasia yang disimpan", "Bantuan datang dari arah yang paling tidak diduga", "Tokoh utama menguji kepercayaan dengan satu pertanyaan", "Rencana berubah ketika bukti baru ditemukan", "Satu pilihan memberi harapan, pilihan lain menjaga keselamatan", "Mereka belajar membaca petunjuk yang tersembunyi dalam kebiasaan", "Kesalahpahaman lama akhirnya mendapat konteks", "Sebuah kehilangan membuat tujuan terasa lebih dekat", "Mereka menyusun langkah berikutnya bersama-sama"],
  ["Kabar yang tiba mengubah cara mereka melihat lawan", "Dua jalur berbeda membawa mereka pada saksi yang sama", "Tokoh utama harus memilih antara cepat dan benar", "Sebuah benda sederhana menyimpan pesan yang tertunda", "Keputusan yang dibuat bersama diuji oleh keadaan", "Mereka kembali ke tempat awal dengan pertanyaan baru", "Jawaban tidak menghapus luka, tetapi memberi arah", "Seseorang menawarkan jalan pintas dengan harga tertentu", "Mereka melihat akibat pilihan dari sudut pandang lain", "Satu janji menjadi pegangan saat rencana runtuh"],
  ["Persiapan terakhir mengungkap siapa yang masih ragu", "Tokoh utama membagikan kebenaran yang selama ini dipendam", "Jalan menuju akhir terbuka lewat kerja sama", "Satu pengakuan mengubah arti sebuah perpisahan", "Mereka menghadapi akibat tanpa mencari kambing hitam", "Pilihan lama kembali sebagai kesempatan memperbaiki", "Masa depan belum pasti, tetapi tidak lagi terasa asing", "Sebuah pesan kecil sampai kepada orang yang tepat", "Mereka menyusun kehidupan setelah badai mereda", "Hari baru dimulai dengan keberanian yang lebih tenang"],
  ["Sisa perjalanan menjadi ruang untuk memahami perubahan", "Tokoh utama menepati janji dengan caranya sendiri", "Teman-teman memilih tujuan masing-masing tanpa memutus ikatan", "Tempat yang sama terasa berbeda setelah semua yang terjadi", "Mereka membicarakan hal yang dulu selalu dihindari", "Sebuah kebiasaan baru menggantikan rasa takut", "Kabar dari kejauhan membuka kemungkinan lain", "Tokoh utama menerima bahwa tidak semua pertanyaan selesai", "Kenangan terakhir memberi warna pada langkah berikutnya", "Mereka menutup satu bab dan membuka lembar baru"],
];
const choices = ["Ikuti petunjuk itu", "Tanya orang yang dipercaya", "Periksa jalan yang belum dicoba", "Beri waktu sebelum memutuskan", "Cari jawaban bersama", "Ambil risiko yang sudah dihitung", "Kembali ke tempat semula", "Percayai bukti yang ada"];
const safe = (value) => value.replaceAll("'", "''");
const slug = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const books = [];
for (let gi = 0; gi < genres.length; gi++) {
  const g = genres[gi];
  for (let j = 0; j < 10; j++) {
    if (books.length === 99) break;
    const title = `${g.left[j]} ${g.right[(j * 3 + gi) % 10]}`;
    const number = books.length + 2; // seed 1 is the authored Peta Langit yang Retak story.
    const hook = hooks[g.genre][(j + gi) % hooks[g.genre].length];
    books.push({
      slug: slug(title), title, genre: g.genre, tags: g.tags,
      tagline: `${hook[0].toUpperCase()}${hook.slice(1)}.`,
      hook, lead: leads[(number * 7 + gi) % leads.length], setting: settings[(number + gi * 2) % settings.length],
      chapterCount: 20 + ((number * 11) % 31),
      branching: number % 4 === 0 ? 1 : number % 4 === 1 ? 2 : 3,
      linear: number % 4 === 0,
    });
  }
}

const data = JSON.stringify(books).replaceAll("$novel_books$", "");
const sql = `-- Generated by scripts/build-production-novel-catalog.mjs.
-- Inserts 99 additional Indonesian Web Novels; pair with the authored Peta Langit yang Retak seed for 100 total.
-- Idempotent: existing slugs are skipped without changing stories or reader progress.
do $novel_books_seed$
declare
  v_books jsonb := $novel_books$${data}$novel_books$::jsonb;
  b jsonb;
  v_story uuid;
  v_ep_ids uuid[];
  v_node_ids uuid[];
  v_n integer;
  v_degree integer;
  v_i integer;
  v_j integer;
  v_merge integer;
  v_source integer;
  v_target integer;
  v_edges jsonb;
  v_choice_labels text[] := array['Ikuti petunjuk itu','Tanya orang yang dipercaya','Periksa jalan yang belum dicoba','Beri waktu sebelum memutuskan','Cari jawaban bersama','Ambil risiko yang sudah dihitung','Kembali ke tempat semula','Percayai bukti yang ada'];
  v_title_fragments text[] := array['Tanda Pertama','Pertemuan Tak Terduga','Petunjuk yang Tertinggal','Percakapan Penting','Jalan yang Berubah','Keputusan Kecil','Kabar dari Jauh','Rahasia Terbuka','Hari yang Menentukan','Langkah Berikutnya'];
  v_nodes jsonb;
  v_choices jsonb;
  v_episodes jsonb;
  v_graph jsonb;
  v_body text;
  v_act integer;
  v_chapter_title text;
begin
  for b in select value from jsonb_array_elements(v_books) loop
    if exists(select 1 from public.stories where slug=b->>'slug') then
      raise notice 'Skipped existing novel slug: %', b->>'slug';
      continue;
    end if;
    v_n := (b->>'chapterCount')::integer;
    v_degree := (b->>'branching')::integer;
    v_node_ids := array(select gen_random_uuid() from generate_series(1,v_n));
    v_ep_ids := array(select gen_random_uuid() from generate_series(1,5));
    v_edges := '[]'::jsonb;

    -- Begin with a forward linear path. Selected stories replace spans with real forks
    -- that converge, and all branched stories finish at two or three distinct endings.
    if coalesce((b->>'linear')::boolean,false) then
      for v_i in 1..v_n-1 loop
        v_edges := v_edges || jsonb_build_array(jsonb_build_object('s',v_i,'t',v_i+1,'label',v_choice_labels[((v_i*3)::integer % array_length(v_choice_labels,1))+1]));
      end loop;
    else
      for v_i in 1..v_n-1 loop
        v_edges := v_edges || jsonb_build_array(jsonb_build_object('s',v_i,'t',v_i+1,'label',v_choice_labels[((v_i*3)::integer % array_length(v_choice_labels,1))+1]));
      end loop;
      -- Converging forks use disjoint spans. At least four chapters remain for the final endings.
      v_i := 2;
      while v_i + v_degree + 1 < v_n - v_degree loop
        v_merge := v_i + v_degree + 1;
        v_edges := (select coalesce(jsonb_agg(e), '[]'::jsonb) from jsonb_array_elements(v_edges) e where (e->>'s')::integer <> v_i and not ((e->>'s')::integer between v_i+1 and v_i+v_degree));
        for v_j in 1..v_degree loop
          v_edges := v_edges || jsonb_build_array(jsonb_build_object('s',v_i,'t',v_i+v_j,'label',v_choice_labels[((v_i+v_j*2) % array_length(v_choice_labels,1))+1]));
          v_edges := v_edges || jsonb_build_array(jsonb_build_object('s',v_i+v_j,'t',v_merge,'label',v_choice_labels[((v_i+v_j*3) % array_length(v_choice_labels,1))+1]));
        end loop;
        v_i := v_merge + 1;
      end loop;
      -- Replace the final linear tail with distinct ending nodes.
      v_source := v_n - v_degree;
      v_edges := (select coalesce(jsonb_agg(e), '[]'::jsonb) from jsonb_array_elements(v_edges) e where (e->>'s')::integer < v_source);
      for v_j in 1..v_degree loop
        v_edges := v_edges || jsonb_build_array(jsonb_build_object('s',v_source,'t',v_source+v_j,'label',v_choice_labels[((v_source+v_j*2) % array_length(v_choice_labels,1))+1]));
      end loop;
    end if;

    insert into public.stories(slug,title,tagline,description,default_format,status,visibility,published_at,genres,tags)
    values(b->>'slug',b->>'title',b->>'tagline',
      format('%s Kisah %s berlangsung di %s. Setiap bab membuka petunjuk, hubungan, atau konsekuensi baru; keputusan pembaca menentukan jalur yang diambil dan bagaimana perjalanan berakhir.',
        b->>'lead',b->>'hook',b->>'setting'),
      'web_novel','published','public',now(),array[b->>'genre'],array(select jsonb_array_elements_text(b->'tags')))
    returning id into v_story;

    insert into public.story_nodes(id,story_id,node_key,title,synopsis,node_type,is_start,status,sequence_hint,unlock_cost)
    select v_node_ids[g.i],v_story,format('bab-%s',lpad(g.i::text,2,'0')),
      case when not coalesce((b->>'linear')::boolean,false) and g.i > v_n-v_degree then format('Akhir %s',g.i-(v_n-v_degree)) else format('Bab %s: %s',g.i,v_title_fragments[((g.i*3)::integer % array_length(v_title_fragments,1))+1]) end,
      format('%s menghadapi babak %s dari perjalanan di %s.',b->>'lead',g.i,b->>'setting'),
      case when (coalesce((b->>'linear')::boolean,false) and g.i=v_n) or (not coalesce((b->>'linear')::boolean,false) and g.i > v_n-v_degree) then 'ending' else 'episode' end,
      g.i=1,'published',g.i,case when g.i=1 then 0 else 5 end
    from generate_series(1,v_n) g(i);

    for v_i in 1..v_n loop
      v_act := least(5,ceil(v_i::numeric/(v_n::numeric/5)));
      v_chapter_title := v_title_fragments[((v_i*3)::integer % array_length(v_title_fragments,1))+1];
      v_body := format('%s Di %s, %s berhadapan dengan satu babak baru: %s. %s menjadi petunjuk yang tak bisa diabaikan. Ia mencatat detail kecil, mengingat percakapan sebelumnya, dan mencoba memahami siapa yang akan terkena akibat jika ia bertindak terlalu cepat. Tempat itu terasa akrab sekaligus berubah; orang-orang yang ditemui membawa harapan dan alasan masing-masing. Tidak semua penjelasan cocok, tetapi setiap pertemuan memberi potongan gambaran yang lebih utuh.',
        b->>'tagline',b->>'setting',b->>'lead',v_chapter_title,b->>'hook') || chr(10) || chr(10) || format('Menjelang akhir hari, %s melihat bahwa persoalannya tidak selesai dengan menemukan satu jawaban. Ia perlu menentukan cara melangkah bersama orang-orang yang telah mempercayainya. Sebuah pilihan membuka kemungkinan baru, sementara pilihan lain menjaga sesuatu yang belum siap dilepaskan. Ia menyimpan bukti, menyampaikan apa yang diketahui, lalu menghadapi konsekuensi dengan tenang. Perjalanan berlanjut, dan makna dari keputusan hari ini akan terlihat pada bab berikutnya.',b->>'lead');
      insert into public.story_node_prose_drafts(node_id,body) values(v_node_ids[v_i],v_body);
      insert into public.story_node_prose_publications(node_id,body) values(v_node_ids[v_i],v_body);
    end loop;

    insert into public.story_choices(story_id,node_id,next_node_id,label,sort_order)
    select v_story,v_node_ids[(e->>'s')::integer],v_node_ids[(e->>'t')::integer],e->>'label',
      row_number() over(partition by e->>'s' order by (e->>'t')::integer)::integer
    from jsonb_array_elements(v_edges) e;

    v_episodes := jsonb_build_array(
      jsonb_build_object('id',v_ep_ids[1],'title','Bagian I: Pertemuan','sortOrder',1),
      jsonb_build_object('id',v_ep_ids[2],'title','Bagian II: Jejak','sortOrder',2),
      jsonb_build_object('id',v_ep_ids[3],'title','Bagian III: Perubahan','sortOrder',3),
      jsonb_build_object('id',v_ep_ids[4],'title','Bagian IV: Keputusan','sortOrder',4),
      jsonb_build_object('id',v_ep_ids[5],'title','Bagian V: Kelanjutan','sortOrder',5));
    select jsonb_agg(jsonb_build_object('id',n.id,'key',n.node_key,'title',n.title,'synopsis',coalesce(n.synopsis,''),
      'type',n.node_type,'start',n.is_start,
      'episodeId',v_ep_ids[least(5,ceil(n.sequence_hint::numeric/(v_n::numeric/5)))],
      'x',null,'y',null,'tags','[]'::jsonb,'notes','') order by n.sequence_hint)
    into v_nodes from public.story_nodes n where n.story_id=v_story;
    select jsonb_agg(jsonb_build_object('id',c.id,'source',c.node_id,'target',c.next_node_id,
      'label',c.label,'description','','sortOrder',c.sort_order,'color','blue','condition','{}'::jsonb)
      order by n.sequence_hint,c.sort_order)
    into v_choices from public.story_choices c join public.story_nodes n on n.id=c.node_id where c.story_id=v_story;
    v_graph := jsonb_build_object('episodes',v_episodes,'nodes',v_nodes,'choices',coalesce(v_choices,'[]'::jsonb));
    insert into public.studio_graph_drafts(story_id,version,publication_version,graph) values(v_story,1,0,v_graph);
    update public.studio_graph_drafts set publication_version=1 where story_id=v_story;
    insert into public.studio_graph_publications(story_id,version,graph) values(v_story,1,v_graph);
  end loop;
end $novel_books_seed$;
`;

const output = fileURLToPath(new URL("../supabase/seeds/production-99-web-novels.sql", import.meta.url));
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, sql, "utf8");
process.stdout.write(`Generated ${output}: ${books.length} novels, ${Math.min(...books.map((book) => book.chapterCount))}–${Math.max(...books.map((book) => book.chapterCount))} chapters each.\n`);
