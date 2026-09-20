/*
# Arabic Learning App — Initial Schema

1. New Tables
- `lessons` — top-level units (e.g. "Greetings"). Has title, description, display order.
- `words` — vocabulary entries belonging to a lesson. Each has English, Arabic,
  transliteration, an example sentence pair, and display order.
- `word_progress` — per-word learning state for the single-tenant app. Tracks
  status (new → learning → reviewed), correct/wrong counts, and last practiced time.

2. Security
- Enable RLS on all three tables.
- This is a single-tenant app with NO sign-in screen, so all policies use
  `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` because
  the data is intentionally public/shared.

3. Notes
- `word_progress` uses a unique constraint on `word_id` so upserts work cleanly.
- Seed data for two lessons with several words each is inserted after table
  creation so the app has content immediately.
*/

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lessons" ON lessons;
CREATE POLICY "anon_select_lessons" ON lessons FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lessons" ON lessons;
CREATE POLICY "anon_insert_lessons" ON lessons FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lessons" ON lessons;
CREATE POLICY "anon_update_lessons" ON lessons FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_lessons" ON lessons;
CREATE POLICY "anon_delete_lessons" ON lessons FOR DELETE
  TO anon, authenticated USING (true);

-- Words table
CREATE TABLE IF NOT EXISTS words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  english text NOT NULL,
  arabic text NOT NULL,
  transliteration text NOT NULL DEFAULT '',
  example_en text NOT NULL DEFAULT '',
  example_ar text NOT NULL DEFAULT '',
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE words ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_words" ON words;
CREATE POLICY "anon_select_words" ON words FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_words" ON words;
CREATE POLICY "anon_insert_words" ON words FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_words" ON words;
CREATE POLICY "anon_update_words" ON words FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_words" ON words;
CREATE POLICY "anon_delete_words" ON words FOR DELETE
  TO anon, authenticated USING (true);

-- Word progress table (single-tenant, one row per word)
CREATE TABLE IF NOT EXISTS word_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id uuid NOT NULL UNIQUE REFERENCES words(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'new',
  correct_count integer NOT NULL DEFAULT 0,
  wrong_count integer NOT NULL DEFAULT 0,
  last_practiced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('new', 'learning', 'reviewed'))
);

ALTER TABLE word_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_word_progress" ON word_progress;
CREATE POLICY "anon_select_word_progress" ON word_progress FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_word_progress" ON word_progress;
CREATE POLICY "anon_insert_word_progress" ON word_progress FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_word_progress" ON word_progress;
CREATE POLICY "anon_update_word_progress" ON word_progress FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_word_progress" ON word_progress;
CREATE POLICY "anon_delete_word_progress" ON word_progress FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_words_lesson_id ON words(lesson_id);
CREATE INDEX IF NOT EXISTS idx_word_progress_word_id ON word_progress(word_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons("order");
CREATE INDEX IF NOT EXISTS idx_words_order ON words("order");

-- Seed data: Lessons
INSERT INTO lessons (title, description, "order") VALUES
  ('Greetings', 'Common Arabic greetings and introductions', 1),
  ('Family', 'Words for family members and relationships', 2),
  ('Everyday Objects', 'Useful everyday objects around the home', 3)
ON CONFLICT DO NOTHING;

-- Seed data: Words for Lesson 1 (Greetings)
INSERT INTO words (lesson_id, english, arabic, transliteration, example_en, example_ar, "order")
SELECT id, v.english, v.arabic, v.transliteration, v.example_en, v.example_ar, v."order"
FROM lessons, (VALUES
  ('Hello', 'مرحبا', 'marhaban', 'Hello, how are you?', 'مرحبا، كيف حالك؟', 1),
  ('Peace (greeting)', 'السلام عليكم', 'assalamu alaikum', 'Peace be upon you', 'السلام عليكم', 2),
  ('Thank you', 'شكرا', 'shukran', 'Thank you very much', 'شكرا جزيلا', 3),
  ('Goodbye', 'مع السلامة', 'ma as-salama', 'Goodbye, see you soon', 'مع السلامة، أراك قريبا', 4),
  ('Yes', 'نعم', 'nam', 'Yes, that is correct', 'نعم، هذا صحيح', 5),
  ('No', 'لا', 'la', 'No, thank you', 'لا، شكرا', 6)
) AS v(english, arabic, transliteration, example_en, example_ar, "order")
WHERE lessons.title = 'Greetings'
ON CONFLICT DO NOTHING;

-- Seed data: Words for Lesson 2 (Family)
INSERT INTO words (lesson_id, english, arabic, transliteration, example_en, example_ar, "order")
SELECT id, v.english, v.arabic, v.transliteration, v.example_en, v.example_ar, v."order"
FROM lessons, (VALUES
  ('Father', 'أب', 'ab', 'My father is kind', 'أبي طيب', 1),
  ('Mother', 'أم', 'umm', 'My mother is wonderful', 'أمي رائعة', 2),
  ('Brother', 'أخ', 'akh', 'My brother is tall', 'أخي طويل', 3),
  ('Sister', 'أخت', 'ukht', 'My sister is smart', 'أختي ذكية', 4),
  ('Son', 'ابن', 'ibn', 'My son is young', 'ابني صغير', 5),
  ('Daughter', 'ابنة', 'ibna', 'My daughter is beautiful', 'ابنتي جميلة', 6)
) AS v(english, arabic, transliteration, example_en, example_ar, "order")
WHERE lessons.title = 'Family'
ON CONFLICT DO NOTHING;

-- Seed data: Words for Lesson 3 (Everyday Objects)
INSERT INTO words (lesson_id, english, arabic, transliteration, example_en, example_ar, "order")
SELECT id, v.english, v.arabic, v.transliteration, v.example_en, v.example_ar, v."order"
FROM lessons, (VALUES
  ('House', 'بيت', 'bayt', 'The house is big', 'البيت كبير', 1),
  ('Book', 'كتاب', 'kitab', 'The book is new', 'الكتاب جديد', 2),
  ('Door', 'باب', 'bab', 'The door is open', 'الباب مفتوح', 3),
  ('Car', 'سيارة', 'sayyara', 'The car is fast', 'السيارة سريعة', 4),
  ('Water', 'ماء', 'ma', 'The water is cold', 'الماء بارد', 5),
  ('Food', 'طعام', 'taam', 'The food is delicious', 'الطعام لذيذ', 6)
) AS v(english, arabic, transliteration, example_en, example_ar, "order")
WHERE lessons.title = 'Everyday Objects'
ON CONFLICT DO NOTHING;
