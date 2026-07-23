/*
# Create service_profiles table

1. Purpose
   Sostituisce la lista hardcoded dei profili internet con una tabella gestibile da admin.
   Permette creazione, modifica, eliminazione e attivazione/disattivazione dei profili annuali.

2. New Table: `service_profiles`
   - `id` (uuid, PK)
   - `code` (text, unique) — codice breve es. "NBEE100"
   - `label` (text) — nome visualizzato es. "NBEE 100"
   - `download_mbps` (int) — velocità download
   - `upload_mbps` (int) — velocità upload
   - `price_bimonthly` (numeric) — prezzo mensile con contratto bimestrale
   - `price_yearly` (numeric) — prezzo mensile con contratto annuale
   - `yearly_enabled` (bool, default false) — se false, il prezzo annuale non viene mostrato sul sito pubblico
   - `requires_coverage_check` (bool, default false) — profilo previa verifica copertura
   - `category` (text, default 'privati') — 'privati' o 'business'
   - `active` (bool, default true) — profilo visibile sul sito
   - `sort_order` (int, default 0) — ordinamento
   - `created_at`, `updated_at` (timestamptz)

3. Security
   - RLS enabled
   - SELECT: TO anon, authenticated (il sito pubblico deve leggere i profili attivi)
   - INSERT/UPDATE/DELETE: TO authenticated (solo admin autenticati)

4. Seed data
   Inserisce i 5 profili esistenti da docs/Profili.txt con yearly_enabled = false.
*/

CREATE TABLE IF NOT EXISTS service_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  label text NOT NULL,
  download_mbps integer NOT NULL,
  upload_mbps integer NOT NULL,
  price_bimonthly numeric NOT NULL,
  price_yearly numeric NOT NULL DEFAULT 0,
  yearly_enabled boolean NOT NULL DEFAULT false,
  requires_coverage_check boolean NOT NULL DEFAULT false,
  category text NOT NULL DEFAULT 'privati',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_profiles" ON service_profiles;
CREATE POLICY "anon_select_profiles" ON service_profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_profiles" ON service_profiles;
CREATE POLICY "auth_insert_profiles" ON service_profiles FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_profiles" ON service_profiles;
CREATE POLICY "auth_update_profiles" ON service_profiles FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_profiles" ON service_profiles;
CREATE POLICY "auth_delete_profiles" ON service_profiles FOR DELETE
  TO authenticated USING (true);

-- Seed data
INSERT INTO service_profiles (code, label, download_mbps, upload_mbps, price_bimonthly, price_yearly, yearly_enabled, requires_coverage_check, category, sort_order) VALUES
  ('NBEE50', 'NBEE 50', 50, 8, 28.00, 25.75, false, false, 'privati', 1),
  ('NBEE100', 'NBEE 100', 100, 16, 34.00, 31.50, false, false, 'privati', 2),
  ('NBEE200', 'NBEE 200', 200, 40, 42.00, 38.50, false, true, 'privati', 3),
  ('NBEE100_PRO', 'NBEE 100 Pro', 100, 24, 32.00, 29.50, false, false, 'business', 4),
  ('NBEE200_PRO', 'NBEE 200 Pro', 200, 50, 49.00, 38.50, false, true, 'business', 5)
ON CONFLICT (code) DO NOTHING;
