-- Esquema del admin del portfolio (idempotente)
CREATE TABLE IF NOT EXISTS users (
  id            bigserial PRIMARY KEY,
  email         text UNIQUE NOT NULL,
  name          text NOT NULL DEFAULT '',
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sections (
  id         serial PRIMARY KEY,
  slug       text UNIQUE NOT NULL,
  kind       text NOT NULL,
  title      text NOT NULL DEFAULT '',
  title_es   text NOT NULL DEFAULT '',
  position   int NOT NULL DEFAULT 0,
  visible    boolean NOT NULL DEFAULT true,
  -- data = { "en": {...}, "es": {...} }
  data       jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  key   text PRIMARY KEY,
  value jsonb NOT NULL
);

-- Preguntas del chat público. La IP se guarda SOLO seudonimizada (HMAC-SHA256),
-- suficiente para rate-limiting y analítica sin almacenar datos personales en claro.
CREATE TABLE IF NOT EXISTS chat_questions (
  id         bigserial PRIMARY KEY,
  ip_hash    text NOT NULL,
  locale     text NOT NULL DEFAULT 'en',
  question   text NOT NULL,
  answer     text NOT NULL DEFAULT '',
  model      text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_questions_ip_day_idx ON chat_questions (ip_hash, created_at);

CREATE INDEX IF NOT EXISTS sections_order_idx ON sections (visible, position);

CREATE TABLE IF NOT EXISTS assets (
  id            bigserial PRIMARY KEY,
  filename      text UNIQUE NOT NULL,
  original_name text NOT NULL DEFAULT '',
  mime          text NOT NULL DEFAULT 'image/webp',
  width         int,
  height        int,
  size_bytes    int,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS section_revisions (
  id         bigserial PRIMARY KEY,
  section_id int NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  data       jsonb NOT NULL,
  saved_by   text,
  saved_at   timestamptz NOT NULL DEFAULT now()
);
