-- =============================================================
-- Salud Familiar — Supabase PostgreSQL Schema
-- Ejecutar completo en Supabase SQL Editor (desde cero)
-- =============================================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- Perfiles de usuario
-- access_code   : SHA-256 del PIN de 4 dígitos (null = sin PIN)
-- recovery_code : SHA-256 de la palabra de recuperación
-- -------------------------------------------------------------
create table profiles (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,
  age           integer     not null check (age > 0 and age < 130),
  weight_kg     numeric(5,2) not null,
  height_cm     numeric(5,2) not null,
  sex           text        not null check (sex in ('male','female')),
  activity      text        not null default 'sedentary'
                            check (activity in ('sedentary','light','moderate','active','very_active')),
  notes         text,
  access_code   text,       -- SHA-256 del PIN de 4 dígitos (null = perfil libre)
  recovery_code text,       -- SHA-256 de la palabra de recuperación
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- -------------------------------------------------------------
-- Mediciones de presión arterial
-- -------------------------------------------------------------
create table blood_pressure_readings (
  id           uuid        primary key default gen_random_uuid(),
  profile_id   uuid        not null references profiles(id) on delete cascade,
  systolic     integer     not null check (systolic between 60 and 300),
  diastolic    integer     not null check (diastolic between 40 and 200),
  pulse        integer     check (pulse between 30 and 250),
  measured_at  timestamptz not null default now(),
  notes        text,
  created_at   timestamptz not null default now()
);

-- -------------------------------------------------------------
-- Preguntas para el médico
-- question_key : clave i18n para preguntas predefinidas (null = personalizada)
-- custom_text  : texto libre para preguntas del usuario
-- profile_id   : null = pregunta global predefinida
-- -------------------------------------------------------------
create table doctor_questions (
  id           uuid        primary key default gen_random_uuid(),
  profile_id   uuid        references profiles(id) on delete cascade,
  question_key text,
  custom_text  text,
  is_checked   boolean     not null default false,
  sort_order   integer     not null default 0,
  created_at   timestamptz not null default now()
);

-- -------------------------------------------------------------
-- Índices
-- -------------------------------------------------------------
create index bp_readings_profile_id_idx  on blood_pressure_readings(profile_id);
create index bp_readings_measured_at_idx on blood_pressure_readings(measured_at desc);
create index doctor_questions_profile_id_idx on doctor_questions(profile_id);

-- -------------------------------------------------------------
-- Migraciones — ejecutar en Supabase SQL Editor si la tabla ya existe
-- -------------------------------------------------------------
-- ALTER TABLE profiles
--   ADD COLUMN IF NOT EXISTS phone_whatsapp    TEXT,
--   ADD COLUMN IF NOT EXISTS callmebot_api_key TEXT;

-- ALTER TABLE profiles
--   ADD COLUMN IF NOT EXISTS health_goal TEXT NOT NULL DEFAULT 'maintain'
--   CHECK (health_goal IN ('lose_weight', 'maintain', 'gain_muscle'));

-- -------------------------------------------------------------
-- Análisis diarios generados por IA (Coach)
-- -------------------------------------------------------------
-- CREATE TABLE IF NOT EXISTS daily_analyses (
--   id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
--   profile_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
--   analysis_date date        NOT NULL,
--   total_calories integer    NOT NULL DEFAULT 0,
--   cal_target    integer     NOT NULL DEFAULT 0,
--   analysis_text text,
--   recommendations jsonb,
--   tomorrow_plan text,
--   motivation    text,
--   food_count    integer     NOT NULL DEFAULT 0,
--   created_at    timestamptz NOT NULL DEFAULT now(),
--   updated_at    timestamptz NOT NULL DEFAULT now(),
--   UNIQUE (profile_id, analysis_date)
-- );
-- CREATE INDEX IF NOT EXISTS daily_analyses_profile_id_idx ON daily_analyses(profile_id);
-- CREATE INDEX IF NOT EXISTS daily_analyses_date_idx ON daily_analyses(analysis_date DESC);

-- -------------------------------------------------------------
-- Hábitos diarios
-- -------------------------------------------------------------
create table if not exists habits (
  id          uuid        primary key default gen_random_uuid(),
  profile_id  uuid        not null references profiles(id) on delete cascade,
  name        text        not null,
  emoji       text        not null default '✅',
  is_active   boolean     not null default true,
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists habit_logs (
  id             uuid  primary key default gen_random_uuid(),
  habit_id       uuid  not null references habits(id) on delete cascade,
  profile_id     uuid  not null references profiles(id) on delete cascade,
  completed_date date  not null,
  created_at     timestamptz not null default now(),
  unique (habit_id, completed_date)
);

-- -------------------------------------------------------------
-- Diario de comidas
-- -------------------------------------------------------------
create table if not exists food_logs (
  id                 uuid        primary key default gen_random_uuid(),
  profile_id         uuid        not null references profiles(id) on delete cascade,
  logged_at          timestamptz not null default now(),
  meal_type          text        not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  description        text        not null,
  calories_estimated integer,
  image_url          text,
  notes              text,
  created_at         timestamptz not null default now()
);

create index if not exists habits_profile_id_idx         on habits(profile_id);
create index if not exists habit_logs_profile_id_idx     on habit_logs(profile_id);
create index if not exists habit_logs_completed_date_idx on habit_logs(completed_date);
create index if not exists food_logs_profile_id_idx      on food_logs(profile_id);
create index if not exists food_logs_logged_at_idx       on food_logs(logged_at desc);

-- -------------------------------------------------------------
-- Intentos de login fallidos (brute force protection)
-- Ejecutar en Supabase SQL Editor
-- -------------------------------------------------------------
create table if not exists login_attempts (
  id           uuid        primary key default gen_random_uuid(),
  identifier   text        not null,  -- phone normalizado o 'recovery:<profile_id>'
  attempted_at timestamptz not null default now()
);

create index if not exists login_attempts_identifier_idx
  on login_attempts (identifier, attempted_at desc);

alter table login_attempts enable row level security;

create policy "allow_insert_attempts" on login_attempts
  for insert to anon with check (true);

create policy "allow_select_attempts" on login_attempts
  for select to anon using (true);

create policy "allow_delete_attempts" on login_attempts
  for delete to anon using (true);

-- -------------------------------------------------------------
-- Migración: macronutrientes en food_logs
-- Ejecutar en Supabase SQL Editor
-- -------------------------------------------------------------
-- ALTER TABLE food_logs
--   ADD COLUMN IF NOT EXISTS protein_g integer,
--   ADD COLUMN IF NOT EXISTS carbs_g   integer,
--   ADD COLUMN IF NOT EXISTS fat_g     integer,
--   ADD COLUMN IF NOT EXISTS fiber_g   integer;

-- -------------------------------------------------------------
-- Row Level Security (desactivado para uso familiar sin auth)
-- Activar si en el futuro se agrega autenticación real.
-- -------------------------------------------------------------
-- alter table profiles               enable row level security;
-- alter table blood_pressure_readings enable row level security;
-- alter table doctor_questions        enable row level security;
