/*
# Create coverage_requests table

1. New Tables
- `coverage_requests`
  - `id` (uuid, primary key)
  - `customer_lat` (numeric, not null) — latitude of the checked point
  - `customer_lng` (numeric, not null) — longitude of the checked point
  - `address` (text, nullable) — searched address string if available
  - `status` (text, not null, default 'ko') — 'ko' for automatic negative reports, 'improvement_request' for user-submitted email requests
  - `ko_report` (jsonb, nullable) — summary of coverage results for KO cases (distances, reasons)
  - `customer_name` (text, nullable) — name for improvement requests
  - `customer_email` (text, nullable) — email for improvement requests
  - `customer_phone` (text, nullable) — phone for improvement requests
  - `message` (text, nullable) — user message for improvement requests
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `coverage_requests`.
- This is a public no-auth coverage checker, so anon + authenticated can INSERT and SELECT.
- UPDATE/DELETE restricted to authenticated (admin only).
*/

CREATE TABLE IF NOT EXISTS coverage_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_lat numeric NOT NULL,
  customer_lng numeric NOT NULL,
  address text,
  status text NOT NULL DEFAULT 'ko',
  ko_report jsonb,
  customer_name text,
  customer_email text,
  customer_phone text,
  message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coverage_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_coverage_requests" ON coverage_requests;
CREATE POLICY "anon_select_coverage_requests" ON coverage_requests
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_coverage_requests" ON coverage_requests;
CREATE POLICY "anon_insert_coverage_requests" ON coverage_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_coverage_requests" ON coverage_requests;
CREATE POLICY "auth_update_coverage_requests" ON coverage_requests
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_coverage_requests" ON coverage_requests;
CREATE POLICY "auth_delete_coverage_requests" ON coverage_requests
  FOR DELETE TO authenticated USING (true);
