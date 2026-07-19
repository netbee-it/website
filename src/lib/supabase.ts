import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface Bts {
  id: string;
  name: string;
  lat: number;
  lng: number;
  antenna_height_m: number;
  frequency_ghz: number;
  tx_power_dbm: number;
  azimuth_deg: number | null;
  tilt_deg: number;
  max_range_km: number;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type BtsInput = Omit<Bts, 'id' | 'created_at' | 'updated_at'>;

export interface CoverageProfilePoint {
  distance_m: number;
  terrain_m: number;
  los_m: number;
}

export interface CoverageResult {
  bts: Bts;
  distance_km: number;
  within_max_range: boolean;
  azimuth_ok: boolean;
  path_clear: boolean;
  fresnel_clearance_m: number | null;
  worst_obstruction_m: number | null;
  estimated_rssi_dbm: number | null;
  link_quality: 'good' | 'marginal' | 'blocked' | 'out_of_range';
  profile: CoverageProfilePoint[];
}

export interface CoverageResponse {
  results: CoverageResult[];
  customer: { lat: number; lng: number };
  message?: string;
}

export async function checkCoverage(
  lat: number,
  lng: number,
  customerAntennaHeightM = 5,
): Promise<CoverageResponse> {
  const url = `${supabaseUrl}/functions/v1/fwa-coverage`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify({ lat, lng, customer_antenna_height_m: customerAntennaHeightM }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Copertura API ${resp.status}: ${text}`);
  }
  const json = await resp.json();
  if (json.error) throw new Error(json.error);
  return json as CoverageResponse;
}
