import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const EARTH_RADIUS_M = 6_371_000;
const K_FACTOR = 4 / 3;
const R_EFFECTIVE_M = EARTH_RADIUS_M * K_FACTOR;
const SPEED_OF_LIGHT_M_S = 299_792_458;
const DEFAULT_CUSTOMER_ANTENNA_HEIGHT_M = 5;
const PATH_SAMPLE_POINTS = 60;
const FRESNEL_CLEARANCE_FACTOR = 0.6;
const ELEVATION_API = "https://api.opentopodata.org/v1/srtm90m";

interface Bts {
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
}

interface CoverageRequest {
  lat: number;
  lng: number;
  customer_antenna_height_m?: number;
}

interface CoverageResult {
  bts: Bts;
  distance_km: number;
  within_max_range: boolean;
  azimuth_ok: boolean;
  path_clear: boolean;
  fresnel_clearance_m: number | null;
  worst_obstruction_m: number | null;
  estimated_rssi_dbm: number | null;
  link_quality: "good" | "marginal" | "blocked" | "out_of_range";
  profile: { distance_m: number; terrain_m: number; los_m: number }[];
}

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

function bearingDeg(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function angularDifferenceDeg(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function destinationPoint(
  lat: number,
  lng: number,
  bearingDeg: number,
  distanceM: number,
): { lat: number; lng: number } {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const δ = distanceM / EARTH_RADIUS_M;
  const θ = toRad(bearingDeg);
  const φ1 = toRad(lat);
  const λ1 = toRad(lng);
  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ),
  );
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2),
    );
  return { lat: toDeg(φ2), lng: ((toDeg(λ2) + 540) % 360) - 180 };
}

function fresnelRadiusM(
  d1M: number,
  d2M: number,
  wavelengthM: number,
): number {
  return Math.sqrt((wavelengthM * d1M * d2M) / (d1M + d2M));
}

async function fetchElevations(
  points: { lat: number; lng: number }[],
): Promise<number[]> {
  if (points.length === 0) return [];
  const locations = points.map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join("|");
  const url = `${ELEVATION_API}?locations=${locations}`;
  const resp = await fetch(url, { method: "GET" });
  if (!resp.ok) {
    throw new Error(`Elevation API ${resp.status}: ${await resp.text()}`);
  }
  const json = await resp.json();
  if (!json.results || json.results.length !== points.length) {
    throw new Error("Elevation API returned mismatched results");
  }
  return json.results.map((r: { elevation: number | null }) =>
    r.elevation === null ? 0 : r.elevation,
  );
}

function computeProfile(
  bts: Bts,
  target: { lat: number; lng: number },
  customerAntennaM: number,
  elevations: number[],
): {
  pathClear: boolean;
  fresnelClearanceM: number;
  worstObstructionM: number;
  profile: { distance_m: number; terrain_m: number; los_m: number }[];
} {
  const totalDistanceM = haversineMeters(bts.lat, bts.lng, target.lat, target.lng);
  const wavelengthM = SPEED_OF_LIGHT_M_S / (bts.frequency_ghz * 1e9);
  const bearing = bearingDeg(bts.lat, bts.lng, target.lat, target.lng);

  const zBtsGround = elevations[0];
  const zCustomerGround = elevations[elevations.length - 1];
  const zBtsAntenna = zBtsGround + bts.antenna_height_m;
  const zCustomerAntenna = zCustomerGround + customerAntennaM;

  let pathClear = true;
  let minClearance = Infinity;
  let worstObstruction = 0;

  const profile: { distance_m: number; terrain_m: number; los_m: number }[] = [];
  for (let i = 1; i < elevations.length - 1; i++) {
    const d1 = (i / (elevations.length - 1)) * totalDistanceM;
    const d2 = totalDistanceM - d1;
    const t = i / (elevations.length - 1);

    const losHeightLinear = zBtsAntenna + t * (zCustomerAntenna - zBtsAntenna);
    const earthBulge = (d1 * d2) / (2 * R_EFFECTIVE_M);
    const losHeight = losHeightLinear - earthBulge;

    const terrain = elevations[i];
    const fresnelR = fresnelRadiusM(d1, d2, wavelengthM);
    const requiredClearance = FRESNEL_CLEARANCE_FACTOR * fresnelR;
    const clearance = losHeight - terrain - requiredClearance;

    if (clearance < 0) {
      pathClear = false;
      worstObstruction = Math.max(worstObstruction, -clearance);
    }
    minClearance = Math.min(minClearance, clearance);

    profile.push({
      distance_m: d1,
      terrain_m: terrain,
      los_m: losHeight,
    });
  }

  return {
    pathClear,
    fresnelClearanceM: minClearance === Infinity ? 0 : minClearance,
    worstObstructionM: worstObstruction,
    profile,
  };
}

function estimateRssiDbm(
  txPowerDbm: number,
  distanceKm: number,
  frequencyGhz: number,
): number {
  const distanceM = distanceKm * 1000;
  const fsplDb = 20 * Math.log10(distanceM) + 20 * Math.log10(frequencyGhz * 1e9) - 147.55;
  return txPowerDbm - fsplDb;
}

function classifyQuality(
  withinMaxRange: boolean,
  azimuthOk: boolean,
  pathClear: boolean,
  rssiDbm: number | null,
): CoverageResult["link_quality"] {
  if (!withinMaxRange) return "out_of_range";
  if (!azimuthOk || !pathClear) return "blocked";
  if (rssiDbm === null) return "marginal";
  if (rssiDbm >= -65) return "good";
  if (rssiDbm >= -75) return "marginal";
  return "marginal";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    let body: CoverageRequest;
    if (req.method === "GET") {
      const url = new URL(req.url);
      const lat = parseFloat(url.searchParams.get("lat") || "");
      const lng = parseFloat(url.searchParams.get("lng") || "");
      const cah = url.searchParams.get("customer_antenna_height_m");
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return new Response(
          JSON.stringify({ error: "lat and lng query params are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      body = {
        lat,
        lng,
        customer_antenna_height_m: cah ? parseFloat(cah) : undefined,
      };
    } else if (req.method === "POST") {
      body = await req.json();
    } else {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerAntennaM =
      body.customer_antenna_height_m ?? DEFAULT_CUSTOMER_ANTENNA_HEIGHT_M;
    if (
      typeof body.lat !== "number" ||
      typeof body.lng !== "number" ||
      body.lat < -90 || body.lat > 90 ||
      body.lng < -180 || body.lng > 180
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid coordinates" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing Supabase environment configuration");
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: btsList, error: btsError } = await supabase
      .from("bts")
      .select("*")
      .eq("active", true);

    if (btsError) throw new Error(`DB error: ${btsError.message}`);
    if (!btsList || btsList.length === 0) {
      return new Response(
        JSON.stringify({ results: [], message: "Nessuna BTS attiva configurata" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results: CoverageResult[] = [];
    for (const bts of btsList as Bts[]) {
      const distanceKm =
        haversineMeters(bts.lat, bts.lng, body.lat, body.lng) / 1000;
      const withinMaxRange = distanceKm <= bts.max_range_km;

      const pathBearing = bearingDeg(bts.lat, bts.lng, body.lat, body.lng);
      const azimuthOk =
        bts.azimuth_deg === null ||
        angularDifferenceDeg(pathBearing, bts.azimuth_deg) <= 60;

      if (!withinMaxRange || !azimuthOk) {
        results.push({
          bts,
          distance_km: Number(distanceKm.toFixed(2)),
          within_max_range: withinMaxRange,
          azimuth_ok: azimuthOk,
          path_clear: false,
          fresnel_clearance_m: null,
          worst_obstruction_m: null,
          estimated_rssi_dbm: withinMaxRange
            ? Number(estimateRssiDbm(bts.tx_power_dbm, distanceKm, bts.frequency_ghz).toFixed(1))
            : null,
          link_quality: classifyQuality(
            withinMaxRange,
            azimuthOk,
            false,
            withinMaxRange
              ? estimateRssiDbm(bts.tx_power_dbm, distanceKm, bts.frequency_ghz)
              : null,
          ),
          profile: [],
        });
        continue;
      }

      const points: { lat: number; lng: number }[] = [];
      for (let i = 0; i < PATH_SAMPLE_POINTS; i++) {
        const t = i / (PATH_SAMPLE_POINTS - 1);
        const distM = t * distanceKm * 1000;
        const p = destinationPoint(bts.lat, bts.lng, pathBearing, distM);
        points.push(p);
      }

      let elevations: number[];
      try {
        elevations = await fetchElevations(points);
      } catch (err) {
        results.push({
          bts,
          distance_km: Number(distanceKm.toFixed(2)),
          within_max_range: withinMaxRange,
          azimuth_ok: azimuthOk,
          path_clear: false,
          fresnel_clearance_m: null,
          worst_obstruction_m: null,
          estimated_rssi_dbm: null,
          link_quality: "blocked",
          profile: [],
        });
        console.error(`Elevation fetch failed for BTS ${bts.id}:`, err.message);
        continue;
      }

      const analysis = computeProfile(bts, body, customerAntennaM, elevations);
      const rssi = estimateRssiDbm(bts.tx_power_dbm, distanceKm, bts.frequency_ghz);

      results.push({
        bts,
        distance_km: Number(distanceKm.toFixed(2)),
        within_max_range: withinMaxRange,
        azimuth_ok: azimuthOk,
        path_clear: analysis.pathClear,
        fresnel_clearance_m: Number(analysis.fresnelClearanceM.toFixed(1)),
        worst_obstruction_m: analysis.worstObstructionM > 0
          ? Number(analysis.worstObstructionM.toFixed(1))
          : null,
        estimated_rssi_dbm: Number(rssi.toFixed(1)),
        link_quality: classifyQuality(withinMaxRange, azimuthOk, analysis.pathClear, rssi),
        profile: analysis.profile,
      });
    }

    results.sort((a, b) => {
      const order = { good: 0, marginal: 1, blocked: 2, out_of_range: 3 };
      const diff = order[a.link_quality] - order[b.link_quality];
      if (diff !== 0) return diff;
      return a.distance_km - b.distance_km;
    });

    return new Response(
      JSON.stringify({ results, customer: { lat: body.lat, lng: body.lng } }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("fwa-coverage error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
