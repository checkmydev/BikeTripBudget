-- ============================================================
-- Migration 001 — Move tables from public → EveBikeTrip schema
-- Projet Supabase : CheckMyDev
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. S'assurer que le schéma existe
CREATE SCHEMA IF NOT EXISTS "EveBikeTrip";

-- 2. Déplacer les tables (les policies RLS suivent automatiquement)
ALTER TABLE public.expenses SET SCHEMA "EveBikeTrip";
ALTER TABLE public.budgets  SET SCHEMA "EveBikeTrip";

-- 3. Donner les droits d'accès au rôle anonyme (utilisé par le client public)
GRANT USAGE ON SCHEMA "EveBikeTrip" TO anon, authenticated;
GRANT ALL   ON ALL TABLES    IN SCHEMA "EveBikeTrip" TO anon, authenticated;
GRANT ALL   ON ALL SEQUENCES IN SCHEMA "EveBikeTrip" TO anon, authenticated;

-- 4. Appliquer les mêmes droits aux objets créés dans le futur
ALTER DEFAULT PRIVILEGES IN SCHEMA "EveBikeTrip"
  GRANT ALL ON TABLES    TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA "EveBikeTrip"
  GRANT ALL ON SEQUENCES TO anon, authenticated;

-- ============================================================
-- ÉTAPE MANUELLE (Dashboard uniquement, pas faisable en SQL) :
--   Supabase Dashboard → Settings → API
--   → "Exposed schemas" → ajouter "EveBikeTrip"
--   Cela permet à PostgREST de router les requêtes vers ce schéma.
-- ============================================================
