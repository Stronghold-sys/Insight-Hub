-- =========================================================
-- RECREATE SCHEMAS: JURNAL, LIBRARY, DAN RLS
-- =========================================================

-- Nonaktifkan sementara replication role agar cascading drop lancar
SET session_replication_role = 'replica';

-- ---------------------------------------------------------
-- 1. DROP TABEL LAMA (JIKA ADA)
-- ---------------------------------------------------------
DROP TABLE IF EXISTS journal_tags CASCADE;
DROP TABLE IF EXISTS journal_media CASCADE;
DROP TABLE IF EXISTS journal_history CASCADE;
DROP TABLE IF EXISTS journal_versions CASCADE;
DROP TABLE IF EXISTS journal_categories CASCADE;
DROP TABLE IF EXISTS journals CASCADE;
DROP TABLE IF EXISTS journal_entries CASCADE;

DROP TABLE IF EXISTS library_bookmarks CASCADE;
DROP TABLE IF EXISTS library_read_history CASCADE;
DROP TABLE IF EXISTS library_featured CASCADE;
DROP TABLE IF EXISTS library_tags CASCADE;
DROP TABLE IF EXISTS library_podcasts CASCADE;
DROP TABLE IF EXISTS library_guides CASCADE;
DROP TABLE IF EXISTS library_videos CASCADE;
DROP TABLE IF EXISTS library_books CASCADE;
DROP TABLE IF EXISTS library_articles CASCADE;
DROP TABLE IF EXISTS library_categories CASCADE;

-- ---------------------------------------------------------
-- 2. TABEL JURNAL (PRIVATE)
-- ---------------------------------------------------------
CREATE TABLE journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  mood VARCHAR(50) NOT NULL,
  category_id VARCHAR(50),
  visibility VARCHAR(50) DEFAULT 'private',
  is_favorite BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_journals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE journal_categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE journal_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  tag_name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE journal_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE journal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  changed_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE journal_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  version_number INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- 3. TABEL LIBRARY (GLOBAL)
-- ---------------------------------------------------------
CREATE TABLE library_categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE library_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id VARCHAR(50) REFERENCES library_categories(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image TEXT,
  author_name VARCHAR(100),
  author_avatar TEXT,
  is_trending BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  read_time VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE library_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id VARCHAR(50) REFERENCES library_categories(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(100),
  description TEXT,
  cover_image TEXT,
  buy_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE library_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id VARCHAR(50) REFERENCES library_categories(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  thumbnail TEXT,
  duration VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE library_guides (
  id VARCHAR(50) PRIMARY KEY,
  category_id VARCHAR(50) REFERENCES library_categories(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  read_time VARCHAR(20),
  difficulty VARCHAR(30),
  tips JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE library_podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id VARCHAR(50) REFERENCES library_categories(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  duration VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE library_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type VARCHAR(50) NOT NULL, -- 'article', 'guide', etc.
  item_id VARCHAR(50) NOT NULL,
  tag_name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE library_featured (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type VARCHAR(50) NOT NULL,
  item_id VARCHAR(50) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- 4. TABEL USER LIBRARY ACTIVITY (PRIVATE)
-- ---------------------------------------------------------
CREATE TABLE library_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL, -- 'article', 'guide', 'template'
  item_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_bookmark UNIQUE (user_id, item_type, item_id)
);

CREATE TABLE library_read_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL,
  item_id VARCHAR(50) NOT NULL,
  progress_percent INT DEFAULT 100,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Kembalikan replication role ke origin
SET session_replication_role = 'origin';

-- ---------------------------------------------------------
-- 5. KONFIGURASI ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------

-- A. Aktifkan RLS untuk Tabel Jurnal
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_versions ENABLE ROW LEVEL SECURITY;

-- B. Buat Policy Owner untuk Tabel Jurnal (hanya pemilik yang bisa akses)
DROP POLICY IF EXISTS journals_owner_policy ON journals;
CREATE POLICY journals_owner_policy ON journals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS journal_tags_owner_policy ON journal_tags;
CREATE POLICY journal_tags_owner_policy ON journal_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM journals 
      WHERE journals.id = journal_tags.journal_id AND journals.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS journal_media_owner_policy ON journal_media;
CREATE POLICY journal_media_owner_policy ON journal_media
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM journals 
      WHERE journals.id = journal_media.journal_id AND journals.user_id = auth.uid()
    )
  );

-- C. Aktifkan RLS untuk Tabel Library Bookmarks & History (Private)
ALTER TABLE library_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_read_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bookmarks_owner_policy ON library_bookmarks;
CREATE POLICY bookmarks_owner_policy ON library_bookmarks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS read_history_owner_policy ON library_read_history;
CREATE POLICY read_history_owner_policy ON library_read_history
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- D. Aktifkan RLS untuk Tabel Library Global (Bisa dibaca semua user, tulis hanya admin)
ALTER TABLE library_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_featured ENABLE ROW LEVEL SECURITY;

-- Buat policy SELECT publik
CREATE POLICY select_public_categories ON library_categories FOR SELECT USING (true);
CREATE POLICY select_public_articles ON library_articles FOR SELECT USING (true);
CREATE POLICY select_public_books ON library_books FOR SELECT USING (true);
CREATE POLICY select_public_videos ON library_videos FOR SELECT USING (true);
CREATE POLICY select_public_guides ON library_guides FOR SELECT USING (true);
CREATE POLICY select_public_podcasts ON library_podcasts FOR SELECT USING (true);
CREATE POLICY select_public_tags ON library_tags FOR SELECT USING (true);
CREATE POLICY select_public_featured ON library_featured FOR SELECT USING (true);

-- Buat policy Write admin
-- (Untuk kemudahan, db direct pooler bypasses RLS, tapi postgREST REST API akan ter-block kec. admin auth)
CREATE POLICY admin_write_categories ON library_categories FOR ALL TO authenticated USING (auth.jwt()->>'role' = 'admin');
CREATE POLICY admin_write_articles ON library_articles FOR ALL TO authenticated USING (auth.jwt()->>'role' = 'admin');
CREATE POLICY admin_write_books ON library_books FOR ALL TO authenticated USING (auth.jwt()->>'role' = 'admin');
CREATE POLICY admin_write_videos ON library_videos FOR ALL TO authenticated USING (auth.jwt()->>'role' = 'admin');
CREATE POLICY admin_write_guides ON library_guides FOR ALL TO authenticated USING (auth.jwt()->>'role' = 'admin');
CREATE POLICY admin_write_podcasts ON library_podcasts FOR ALL TO authenticated USING (auth.jwt()->>'role' = 'admin');

-- ---------------------------------------------------------
-- 6. SEED DATA GLOBAL (LIBRARY)
-- ---------------------------------------------------------
INSERT INTO library_categories (id, name, description) VALUES
  ('komunikasi', 'Komunikasi Efektif', 'Tips dan cara menyampaikan perasaan secara asertif'),
  ('boundaries', 'Batas Diri (Boundaries)', 'Cara membuat dan mempertahankan batasan sehat dalam relasi'),
  ('konflik', 'Resolusi Konflik', 'Strategi keluar dari pertengkaran dan meredam ketegangan emosi'),
  ('apologi', 'Permintaan Maaf', 'Seni memulihkan kepercayaan pasca kesalahan'),
  ('relasi', 'Dinamika Relasi', 'Memahami tipe kelekatan dan pola hubungan');

-- Seed mini guides (6 items)
INSERT INTO library_guides (id, category_id, title, description, read_time, difficulty, tips) VALUES
  ('g1', 'apologi', 'Cara Minta Maaf yang Beneran (Tanpa "Tapi")', 'Akui kesalahan secara spesifik, validasi dampak perasaan dia, tawarkan solusi nyata, dan singkirkan kata "tapi". Permintaan maaf sejati bukan tentang kamu, tapi tentang dampak ke orang lain.', '4 menit', 'Mudah', '[
    "Sebut apa yang kamu lakukan dengan spesifik",
    "Jangan defensif / kasih alasan",
    "Tanya apa yang dia butuhkan",
    "Komit untuk berubah, bukan janji kosong"
  ]'),
  ('g2', 'boundaries', 'Set Boundaries Tanpa Terasa Jahat', 'Batas diri bukan bentuk penolakan, tapi bentuk self-respect. Jelasin kebutuhanmu dengan "I statement", bukan tuduhan. Konsistensi jauh lebih penting daripada cara penyampaiannya.', '5 menit', 'Sedang', '[
    "Mulai dari batas kecil dulu",
    "Gunakan \"Aku butuh...\" bukan \"Kamu selalu...\"",
    "Oke untuk nolak tanpa penjelasan panjang",
    "Batas bisa berubah sesuai konteks"
  ]'),
  ('g3', 'konflik', 'Keluar dari Loop Silent Treatment', 'Diam yang berkepanjangan lebih merusak dari konflik terbuka. Minta jeda yang punya kepastian: "Aku butuh 30 menit, setelah itu kita ngobrol." Diam tanpa batas = penghukuman.', '6 menit', 'Sedang', '[
    "Bedakan diam untuk recharge vs diam untuk hukum",
    "Kasih kepastian kapan kamu kembali",
    "Hadapi masalahnya, bukan orang-nya",
    "Bicarakan pola ini saat suasana hati netral"
  ]'),
  ('g4', 'komunikasi', 'Cara Dengerin yang Beneran (Active Listening)', 'Mendengarkan bukan menunggu giliran bicara. Fokus ke perasaan dan kebutuhan di balik kata-kata. Tahan dorongan untuk langsung kasih solusi atau perbandingan.', '5 menit', 'Mudah', '[
    "Kontak mata, bukan scroll HP",
    "Parafrase apa yang kamu dengar",
    "Tanya \"Apa yang kamu butuhkan dari aku sekarang?\"",
    "Jangan buru-buru kasih solusi"
  ]'),
  ('g5', 'komunikasi', 'Cara Ekspresikan Perasaan Tanpa Menyalahkan', 'Gunakan formula: "Aku merasa [emosi] ketika [situasi] karena aku butuh [kebutuhan]." Ini jauh lebih efektif dari "Kamu selalu..." yang bikin orang defensif.', '4 menit', 'Mudah', '[
    "Fokus ke perasaan KAMU, bukan perilaku mereka",
    "Hindari kata \"selalu\" dan \"tidak pernah\"",
    "Ungkap kebutuhan, bukan tuntutan",
    "Pilih waktu yang tepat — jangan saat lagi panas"
  ]'),
  ('g6', 'relasi', 'Deteksi Red Flag vs Deal Breaker', 'Red flag adalah pola yang perlu diperhatikan. Deal breaker adalah hal yang nggak bisa kamu kompromikan. Tahu bedanya biar kamu bisa evaluasi hubungan dengan lebih jernih.', '7 menit', 'Sedang', '[
    "Catat pola, bukan insiden satu kali",
    "Bedakan deal breaker vs ketidaknyamanan sementara",
    "Red flag bisa berubah kalau ada kemauan bersama",
    "Deal breaker tidak perlu penjelasan ke siapapun"
  ]');

-- Seed templates (6 articles mapped as communication templates)
-- Kita seed ke library_articles agar bisa diakses dinamis
INSERT INTO library_articles (category_id, title, slug, excerpt, content, author_name, read_time, is_trending) VALUES
  ('apologi', 'Template Chat: Setelah Ngomong Kasar atau Nada Tinggi', 'template-apologi-nada-tinggi', 'Bantuan kalimat asertif untuk memulihkan keadaan setelah lepas kendali emosi.', 'Gue minta maaf ya tadi sempat ngomong dengan nada yang nggak enak. Gue sadar itu bikin lo nggak nyaman dan terluka. Gue lagi overwhelmed tadi, tapi itu bukan alasan buat ngomong kayak gitu. Kalau lo mau, bisa cerita apa yang paling bikin lo terluka biar gue lebih paham?', 'Insight Team', '2 menit', true),
  ('boundaries', 'Template Chat: Butuh Waktu Sendiri Tanpa Drama', 'template-me-time-boundaries', 'Kalimat penjelas yang tenang untuk meminta ruang pribadi secara asertif.', 'Gue sayang sama lo, tapi malam ini gue beneran butuh waktu sendiri dulu buat recharge. Bukan karena marah sama lo — gue cuma butuh ruang sebentar. Kita lanjut ngobrol besok ya, makasih udah ngerti.', 'Insight Team', '2 menit', false),
  ('konflik', 'Template Chat: Bahas Pola yang Sering Muncul', 'template-konfrontasi-pola-relasi', 'Cara asertif mengajak pasangan duduk bersama menyelesaikan pertengkaran berulang.', 'Bisa ngobrol bentar nggak? Ada sesuatu yang mau gue share dan gue harap kita bisa bahas dengan tenang. Gue ngerasa [emosi] setiap kali [situasi] terjadi, dan gue butuh kita cari solusi bareng. Lo ada waktu kapan?', 'Insight Team', '3 menit', true),
  ('komunikasi', 'Template Chat: Minta Reassurance / Kabar', 'template-minta-kabar-anxious', 'Cara asertif meminta kabar tanpa terkesan mengontrol.', 'Gue tau lo lagi sibuk dan gue nggak mau nge-pressure. Cuma, kalau lo sempet kasih update singkat soal gimana kita ini, itu bakal bantu gue nggak overthinking. Gue butuh kepastian buat bisa tenang, bukan buat mengontrol lo.', 'Insight Team', '2 menit', false),
  ('konflik', 'Template Chat: Setelah Konflik Besar yang Belum Selesai', 'template-rekonsiliasi-pasca-konflik', 'Kalimat pembuka yang menurunkan ego untuk memulai kembali percakapan pasca bertengkar hebat.', 'Gue masih memikirkan pertengkaran kita kemarin. Gue nggak mau itu jadi tembok di antara kita. Gue mau kita sama-sama cari jalan keluar — bukan siapa yang menang. Kalau lo juga mau, kita bisa ngobrol pelan-pelan kapan lo siap.', 'Insight Team', '3 menit', false);
