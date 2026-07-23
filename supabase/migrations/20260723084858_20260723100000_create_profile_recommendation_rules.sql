/*
  # Create profile_recommendation_rules table

  Maps signal strength (received_power_dbm) thresholds to service profiles.
  The edge function picks the first rule (ordered by min_dbm DESC) whose
  received_power_dbm >= rule.min_dbm. If no rule matches, falls back to
  the old throughput-based logic.

  Columns:
  - id (uuid PK)
  - min_dbm (numeric) — minimum received power in dBm to trigger this rule
  - profile_id (uuid FK -> service_profiles.id)
  - label (text) — short description shown in admin, e.g. "Segnale ottimo"
  - sort_order (int, default 0)
  - active (bool, default true)
  - created_at, updated_at (timestamptz)
*/

CREATE TABLE IF NOT EXISTS profile_recommendation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_dbm numeric NOT NULL,
  profile_id uuid NOT NULL REFERENCES service_profiles(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profile_recommendation_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_rules" ON profile_recommendation_rules;
CREATE POLICY "anon_select_rules" ON profile_recommendation_rules FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_rules" ON profile_recommendation_rules;
CREATE POLICY "auth_insert_rules" ON profile_recommendation_rules FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_rules" ON profile_recommendation_rules;
CREATE POLICY "auth_update_rules" ON profile_recommendation_rules FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_rules" ON profile_recommendation_rules;
CREATE POLICY "auth_delete_rules" ON profile_recommendation_rules FOR DELETE
  TO authenticated USING (true);

-- Seed default rules based on the existing profiles
-- NBEE200 (200/40) requires strongest signal, NBEE100 (100/16) medium, NBEE50 (50/8) weakest
INSERT INTO profile_recommendation_rules (min_dbm, profile_id, label, sort_order, active)
SELECT -55.0, id, 'Segnale ottimo (≥ -55 dBm)', 1, true
FROM service_profiles WHERE code = 'NBEE200'
UNION ALL
SELECT -65.0, id, 'Segnale buono (≥ -65 dBm)', 2, true
FROM service_profiles WHERE code = 'NBEE100'
UNION ALL
SELECT -75.0, id, 'Segnale sufficiente (≥ -75 dBm)', 3, true
FROM service_profiles WHERE code = 'NBEE50'
ON CONFLICT DO NOTHING;
