-- ============================================================
-- MIGRATION: assessment_attempt_questions
-- Random Question Engine — per-attempt question ordering
-- Semua kolom VARCHAR agar kompatibel dengan tabel existing
-- ============================================================

CREATE TABLE IF NOT EXISTS assessment_attempt_questions (
  id            VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id    VARCHAR(36)  NOT NULL,
  question_id   VARCHAR(36)  NOT NULL,
  display_order INT          NOT NULL,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),

  -- Satu pertanyaan hanya muncul sekali per session
  CONSTRAINT uq_aq_session_question UNIQUE (session_id, question_id),
  -- Satu display_order hanya dipakai sekali per session
  CONSTRAINT uq_aq_session_order    UNIQUE (session_id, display_order)
);

-- Index untuk query cepat berdasarkan session + urutan tampil
CREATE INDEX IF NOT EXISTS idx_aq_session_order
  ON assessment_attempt_questions (session_id, display_order ASC);

-- Index untuk lookup question_id -> display_order (untuk resume)
CREATE INDEX IF NOT EXISTS idx_aq_session_question
  ON assessment_attempt_questions (session_id, question_id);

-- Row Level Security
ALTER TABLE assessment_attempt_questions ENABLE ROW LEVEL SECURITY;

-- Policy: user hanya bisa lihat data session miliknya sendiri
DROP POLICY IF EXISTS "Users can read own attempt questions" ON assessment_attempt_questions;
CREATE POLICY "Users can read own attempt questions"
  ON assessment_attempt_questions FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM assessment_sessions
      WHERE user_id = auth.uid()::text
    )
  );

-- Policy: service role bisa insert/update/delete (dipakai oleh server-side API)
DROP POLICY IF EXISTS "Service role can manage attempt questions" ON assessment_attempt_questions;
CREATE POLICY "Service role can manage attempt questions"
  ON assessment_attempt_questions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
