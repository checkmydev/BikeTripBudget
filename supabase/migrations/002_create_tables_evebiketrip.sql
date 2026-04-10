-- ============================================================
-- BikeTripBudget — Création des tables dans le schéma EveBikeTrip
-- Projet Supabase : CheckMyDev
-- À exécuter dans : Dashboard → SQL Editor
-- ============================================================

-- 0. Créer le schéma s'il n'existe pas encore
CREATE SCHEMA IF NOT EXISTS "EveBikeTrip";

-- ============================================================
-- TABLE : expenses
-- ============================================================
CREATE TABLE "EveBikeTrip".expenses (
  id             TEXT        PRIMARY KEY,
  amount         NUMERIC     NOT NULL,
  currency       TEXT        NOT NULL DEFAULT 'EUR',
  category_id    TEXT        NOT NULL,
  description    TEXT        NOT NULL DEFAULT '',
  date           DATE        NOT NULL,
  photo_data_url TEXT,
  receipt_text   TEXT,
  payment_method TEXT        NOT NULL DEFAULT 'cash'
                             CHECK (payment_method IN ('cash', 'card', 'other')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE : budgets
-- ============================================================
CREATE TABLE "EveBikeTrip".budgets (
  id       TEXT    PRIMARY KEY,
  month    INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year     INTEGER NOT NULL CHECK (year >= 2000),
  amount   NUMERIC NOT NULL DEFAULT 0,
  currency TEXT    NOT NULL DEFAULT 'EUR',
  CONSTRAINT budgets_year_month_unique UNIQUE (year, month)
);

-- ============================================================
-- RLS (Row Level Security) — accès public en lecture/écriture
-- ============================================================
ALTER TABLE "EveBikeTrip".expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EveBikeTrip".budgets  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon full access" ON "EveBikeTrip".expenses
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon full access" ON "EveBikeTrip".budgets
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- DROITS PostgREST
-- ============================================================
GRANT USAGE ON SCHEMA "EveBikeTrip" TO anon, authenticated;
GRANT ALL   ON ALL TABLES    IN SCHEMA "EveBikeTrip" TO anon, authenticated;
GRANT ALL   ON ALL SEQUENCES IN SCHEMA "EveBikeTrip" TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA "EveBikeTrip"
  GRANT ALL ON TABLES    TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA "EveBikeTrip"
  GRANT ALL ON SEQUENCES TO anon, authenticated;

-- ============================================================
-- ÉTAPE MANUELLE après ce script :
--   Dashboard → Settings → API → "Exposed schemas"
--   → ajouter "EveBikeTrip"
-- ============================================================
