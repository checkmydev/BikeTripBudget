-- Run this in the Supabase SQL Editor (schema: EveBikeTrip)

-- Monthly provisions: one row per (key, month, year)
CREATE TABLE IF NOT EXISTS savings_monthly (
  key     TEXT    NOT NULL,
  amount  NUMERIC NOT NULL DEFAULT 0,
  month   INTEGER NOT NULL,
  year    INTEGER NOT NULL,
  PRIMARY KEY (key, month, year)
);

-- Voyage savings items: one row per key (global, not per month)
CREATE TABLE IF NOT EXISTS savings_voyage (
  key      TEXT    PRIMARY KEY,
  amount   NUMERIC NOT NULL DEFAULT 0,
  received BOOLEAN NOT NULL DEFAULT FALSE
);

-- Trip settings: single row (months of travel, etc.)
CREATE TABLE IF NOT EXISTS savings_settings (
  id             TEXT PRIMARY KEY DEFAULT 'singleton',
  trip_months    INTEGER NOT NULL DEFAULT 10,
  current_savings NUMERIC NOT NULL DEFAULT 0
);
