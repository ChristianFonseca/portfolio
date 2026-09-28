-- Esquema del admin del portfolio (idempotente)
CREATE TABLE IF NOT EXISTS users (
  id            bigserial PRIMARY KEY,
  email         text UNIQUE NOT NULL,
  name          text NOT NULL DEFAULT '',
  password_hash text NOT NULL,
  -- 'admin' = todo (usuarios, configuración, contenido) · 'editor' = solo contenido y analítica
  role          text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'editor')),
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
-- Cada intento se reserva como 'pending' ANTES de llamar a Gemini y se cierra con su
-- desenlace (outcome): answered | truncated | blocked | empty | error. net_hash es la
-- clave del límite por IP (la IP en IPv4, el prefijo /64 en IPv6).
CREATE TABLE IF NOT EXISTS chat_questions (
  id             bigserial PRIMARY KEY,
  ip_hash        text NOT NULL,
  net_hash       text,
  locale         text NOT NULL DEFAULT 'en',
  question       text NOT NULL,
  answer         text NOT NULL DEFAULT '',
  model          text NOT NULL DEFAULT '',
  outcome        text NOT NULL DEFAULT 'answered',
  finish_reason  text NOT NULL DEFAULT '',
  tokens_in      int,
  tokens_out     int,
  tokens_thought int,
  history_turns  int,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_questions_ip_day_idx ON chat_questions (ip_hash, created_at);
CREATE INDEX IF NOT EXISTS chat_questions_net_day_idx ON chat_questions (net_hash, created_at);
CREATE INDEX IF NOT EXISTS chat_questions_created_idx ON chat_questions (created_at);
-- Lo que cuenta para los límites: así las filas 'error' no frenan el conteo de la admisión.
CREATE INDEX IF NOT EXISTS chat_questions_counted_idx ON chat_questions (created_at) WHERE outcome <> 'error';

-- Cuándo actuó un guardrail que no deja fila en chat_questions (límites, entradas
-- inválidas, errores de Gemini). Agregado por hora, tipo e IP.
CREATE TABLE IF NOT EXISTS chat_guard_events (
  id       bigserial PRIMARY KEY,
  bucket   timestamptz NOT NULL,
  kind     text NOT NULL,
  ip_hash  text NOT NULL DEFAULT '',
  status   int NOT NULL DEFAULT 0,
  n        int NOT NULL DEFAULT 1,
  first_ts timestamptz NOT NULL DEFAULT now(),
  last_ts  timestamptz NOT NULL DEFAULT now(),
  locale   text NOT NULL DEFAULT '',
  model    text NOT NULL DEFAULT '',
  detail   jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (bucket, kind, ip_hash, status)
);

CREATE INDEX IF NOT EXISTS chat_guard_events_bucket_idx ON chat_guard_events (bucket DESC);

-- Blog bilingüe (markdown por idioma; publicar exige ambos idiomas completos)
CREATE TABLE IF NOT EXISTS posts (
  id           serial PRIMARY KEY,
  slug         text UNIQUE NOT NULL,
  title        text NOT NULL DEFAULT '',
  title_es     text NOT NULL DEFAULT '',
  excerpt      text NOT NULL DEFAULT '',
  excerpt_es   text NOT NULL DEFAULT '',
  body         text NOT NULL DEFAULT '',
  body_es      text NOT NULL DEFAULT '',
  cover_image  text NOT NULL DEFAULT '',
  tags         jsonb NOT NULL DEFAULT '[]'::jsonb,
  published    boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_published_idx ON posts (published, published_at DESC);

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

-- Analítica de visitantes (módulo Analytics): eventos del sitio público con IP en claro
-- (retención configurable con purga automática) + hash para cruzar con chat_questions.
CREATE TABLE IF NOT EXISTS visitor_events (
  id         bigserial PRIMARY KEY,
  ts         timestamptz NOT NULL DEFAULT now(),
  session_id text,
  kind       text NOT NULL,
  path       text NOT NULL DEFAULT '',
  locale     text NOT NULL DEFAULT '',
  ip         inet,
  ip_hash    text,
  country    text NOT NULL DEFAULT '',
  ua         text NOT NULL DEFAULT '',
  referrer   text NOT NULL DEFAULT '',
  props      jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS visitor_events_ts_idx ON visitor_events (ts DESC);
CREATE INDEX IF NOT EXISTS visitor_events_kind_ts_idx ON visitor_events (kind, ts DESC);
CREATE INDEX IF NOT EXISTS visitor_events_session_idx ON visitor_events (session_id, ts);
CREATE INDEX IF NOT EXISTS visitor_events_ip_ts_idx ON visitor_events (ip, ts DESC);

-- Bitácora del admin (módulo Bitácora): quién hizo qué, desde qué IP.
CREATE TABLE IF NOT EXISTS admin_audit (
  id      bigserial PRIMARY KEY,
  ts      timestamptz NOT NULL DEFAULT now(),
  actor   text,
  action  text NOT NULL,
  target  text NOT NULL DEFAULT '',
  ok      boolean NOT NULL DEFAULT true,
  ip      inet,
  country text NOT NULL DEFAULT '',
  ua      text NOT NULL DEFAULT '',
  detail  jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS admin_audit_ts_idx ON admin_audit (ts DESC);
CREATE INDEX IF NOT EXISTS admin_audit_actor_ts_idx ON admin_audit (actor, ts DESC);
CREATE INDEX IF NOT EXISTS admin_audit_action_ts_idx ON admin_audit (action, ts DESC);
