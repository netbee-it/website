/*
# Create BTS table for FWA coverage

## Summary
Aggiunge una tabella `bts` per gestire le stazioni radio base (BTS) del network FWA.
Ogni BTS rappresenta una stazione che serve clienti in una zona geografica.
Usa PostGIS per la posizione (geography Point SRID 4326).

## New tables
- `bts`
  - `id` (uuid, primary key)
  - `name` (text, nome identificativo della BTS, es. "Canelli - Centro")
  - `geom` (geography Point, posizione geografica SRID 4326)
  - `lat` (numeric, latitudine in gradi decimali, ridondante per semplicità UI)
  - `lng` (numeric, longitudine in gradi decimali)
  - `antenna_height_m` (numeric, altezza antenna dal suolo in metri)
  - `frequency_ghz` (numeric, frequenza operativa in GHz, es. 5.6 per band C)
  - `tx_power_dbm` (numeric, potenza di trasmissione in dBm)
  - `azimuth_deg` (numeric, orientamento antenna in gradi 0-360, NULL = omnidirezionale)
  - `tilt_deg` (numeric, inclinazione elettrica/meccanica in gradi, default 0)
  - `max_range_km` (numeric, raggio massimo di copertura dichiarato in km)
  - `active` (boolean, se la BTS è operativa)
  - `notes` (text, note operative)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

## Security
- RLS abilitata su `bts`.
- Lettura (SELECT) pubblica (anon + authenticated): necessaria per la mappa di copertura pubblica.
- Scritture (INSERT/UPDATE/DELETE) solo authenticated: amministratori autenticati.
  Nota: l'app ha schermata di login quindi gli admin autenticati possono gestire BTS.

## Notes
1. La colonna `geom` viene popolata automaticamente da un trigger usando lat/lng.
   Questo evita di dover costruire il punto lato client e mantiene consistenza.
2. `lat` e `lng` sono mantenute come colonne numeriche separate per compattezza UI/filtri,
   pur essendo ridondanti con `geom`.
3. Trigger `bts_set_geom_from_latlng` aggiorna `geom` su INSERT/UPDATE di lat/lng.
*/

CREATE TABLE IF NOT EXISTS bts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  geom geography(Point, 4326),
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  antenna_height_m numeric NOT NULL DEFAULT 20,
  frequency_ghz numeric NOT NULL DEFAULT 5.6,
  tx_power_dbm numeric NOT NULL DEFAULT 23,
  azimuth_deg numeric,
  tilt_deg numeric NOT NULL DEFAULT 0,
  max_range_km numeric NOT NULL DEFAULT 15,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bts_lat_range CHECK (lat BETWEEN -90 AND 90),
  CONSTRAINT bts_lng_range CHECK (lng BETWEEN -180 AND 180),
  CONSTRAINT bts_azimuth_range CHECK (azimuth_deg IS NULL OR azimuth_deg BETWEEN 0 AND 360),
  CONSTRAINT bts_height_positive CHECK (antenna_height_m > 0),
  CONSTRAINT bts_range_positive CHECK (max_range_km > 0)
);

ALTER TABLE bts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_bts" ON bts;
CREATE POLICY "public_select_bts"
ON bts FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "auth_insert_bts" ON bts;
CREATE POLICY "auth_insert_bts"
ON bts FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_bts" ON bts;
CREATE POLICY "auth_update_bts"
ON bts FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_bts" ON bts;
CREATE POLICY "auth_delete_bts"
ON bts FOR DELETE
TO authenticated
USING (true);

-- Trigger per popolare geom da lat/lng automaticamente
CREATE OR REPLACE FUNCTION bts_set_geom_from_latlng()
RETURNS trigger AS $$
BEGIN
  NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bts_set_geom_trigger ON bts;
CREATE TRIGGER bts_set_geom_trigger
BEFORE INSERT OR UPDATE OF lat, lng ON bts
FOR EACH ROW
EXECUTE FUNCTION bts_set_geom_from_latlng();

-- Indici per performance
CREATE INDEX IF NOT EXISTS bts_geom_idx ON bts USING GIST (geom);
CREATE INDEX IF NOT EXISTS bts_active_idx ON bts (active);
CREATE INDEX IF NOT EXISTS bts_name_idx ON bts (name);
