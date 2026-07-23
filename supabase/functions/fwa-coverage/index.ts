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

const CLIENT = {
  tx_power_dbm: 22,
  antenna_gain_dbi: 26,
  rx_sensitivity_dbm: -96,
  cable_loss_db: 0.5,
} as const;

const MCS_TABLE: { threshold_db: number; modulation: string; efficiency: number }[] = [
  { threshold_db: 3, modulation: "BPSK 1/2", efficiency: 0.5 },
  { threshold_db: 6, modulation: "QPSK 1/2", efficiency: 1.0 },
  { threshold_db: 9, modulation: "QPSK 3/4", efficiency: 1.5 },
  { threshold_db: 12, modulation: "16QAM 1/2", efficiency: 2.0 },
  { threshold_db: 15, modulation: "16QAM 3/4", efficiency: 3.0 },
  { threshold_db: 18, modulation: "64QAM 2/3", efficiency: 4.0 },
  { threshold_db: 21, modulation: "64QAM 3/4", efficiency: 4.5 },
  { threshold_db: 24, modulation: "64QAM 5/6", efficiency: 5.0 },
  { threshold_db: 27, modulation: "256QAM 3/4", efficiency: 6.0 },
  { threshold_db: 30, modulation: "256QAM 5/6", efficiency: 6.67 },
];

interface Bts {
  id: string;
  name: string;
  lat: number;
  lng: number;
  antenna_height_m: number;
  frequency_ghz: number;
  tx_power_dbm: number;
  antenna_gain_dbi: number;
  rx_sensitivity_dbm: number;
  cable_loss_db: number;
  azimuth_deg: number | null;
  tilt_deg: number;
  max_range_km: number;
  active: boolean;
  notes: string | null;
}

interface ServiceProfile {
  id: string;
  code: string;
  label: string;
  download_mbps: number;
  upload_mbps: number;
  price_bimonthly: number;
  price_yearly: number;
  yearly_enabled: boolean;
  requires_coverage_check: boolean;
  category: string;
  active: boolean;
  sort_order: number;
}

interface CoverageRequest {
  lat: number;
  lng: number;
  customer_antenna_height_m?: number;
}

interface LinkBudgetDetails {
  eirp_dbm: number;
  fspl_db: number;
  other_losses_db: number;
  received_power_dbm: number;
  fade_margin_db: number;
  mcs_index: number;
  modulation: string;
  estimated_throughput_mbps: { down: number; up: number };
  fresnel_clearance_m: number | null;
  worst_obstruction_m: number | null;
}

interface ProfileRecommendation {
  recommended_profile: ServiceProfile | null;
  achievable_download_mbps: number;
  achievable_upload_mbps: number;
  confidence: "high" | "medium" | "low";
  reason: string;
}

interface CoverageResult {
  bts: Bts;
  distance_km: number;
  within_max_range: boolean;
  azimuth_ok: boolean;
  path_clear: boolean;
  link_quality: "good" | "marginal" | "blocked" | "out_of_range";
  link_budget: LinkBudgetDetails | null;
  recommendation: ProfileRecommendation;
  profile: { distance_m: number; terrain_m: number; los_m: number }[];
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

function bearingDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dLambda = toRad(lng2 - lng1);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function angularDifferenceDeg(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function destinationPoint(lat: number, lng: number, bearing: number, distanceM: number): { lat: number; lng: number } {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const delta = distanceM / EARTH_RADIUS_M;
  const theta = toRad(bearing);
  const phi1 = toRad(lat);
  const lambda1 = toRad(lng);
  const phi2 = Math.asin(Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(theta));
  const lambda2 = lambda1 + Math.atan2(Math.sin(theta) * Math.sin(delta) * Math.cos(phi1), Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2));
  return { lat: toDeg(phi2), lng: ((toDeg(lambda2) + 540) % 360) - 180 };
}

function fresnelRadiusM(d1M: number, d2M: number, wavelengthM: number): number {
  return Math.sqrt((wavelengthM * d1M * d2M) / (d1M + d2M));
}

async function fetchElevations(points: { lat: number; lng: number }[]): Promise<number[]> {
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
  return json.results.map((r: { elevation: number | null }) => (r.elevation === null ? 0 : r.elevation));
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

    profile.push({ distance_m: d1, terrain_m: terrain, los_m: losHeight });
  }

  return {
    pathClear,
    fresnelClearanceM: minClearance === Infinity ? 0 : minClearance,
    worstObstructionM: worstObstruction,
    profile,
  };
}

function computeLinkBudget(
  bts: Bts,
  distanceKm: number,
  pathClear: boolean,
  fresnelClearanceM: number | null,
  worstObstructionM: number | null,
): LinkBudgetDetails {
  const distanceM = distanceKm * 1000;
  const freqHz = bts.frequency_ghz * 1e9;
  const fsplDb = 20 * Math.log10(distanceM) + 20 * Math.log10(freqHz) - 147.55;

  const eirpDbm = bts.tx_power_dbm + bts.antenna_gain_dbi - bts.cable_loss_db;

  const otherLossesDb = Math.min(3, 0.5 * distanceKm);

  const receivedPowerDbm = eirpDbm - fsplDb - otherLossesDb - CLIENT.cable_loss_db + CLIENT.antenna_gain_dbi;

  const fadeMarginDb = receivedPowerDbm - CLIENT.rx_sensitivity_dbm;

  let mcsIndex = 0;
  for (let i = 0; i < MCS_TABLE.length; i++) {
    if (fadeMarginDb >= MCS_TABLE[i].threshold_db) mcsIndex = i;
  }
  const modulation = MCS_TABLE[mcsIndex].modulation;
  const efficiency = MCS_TABLE[mcsIndex].efficiency;

  const rawCapacity = 200;
  const down = Math.round(rawCapacity * (efficiency / 6.67) * 0.55);
  const up = Math.round(down * 0.4);

  return {
    eirp_dbm: Number(eirpDbm.toFixed(1)),
    fspl_db: Number(fsplDb.toFixed(1)),
    other_losses_db: Number(otherLossesDb.toFixed(1)),
    received_power_dbm: Number(receivedPowerDbm.toFixed(1)),
    fade_margin_db: Number(fadeMarginDb.toFixed(1)),
    mcs_index: mcsIndex,
    modulation,
    estimated_throughput_mbps: { down, up },
    fresnel_clearance_m: fresnelClearanceM,
    worst_obstruction_m: worstObstructionM,
  };
}

function classifyQuality(
  withinMaxRange: boolean,
  azimuthOk: boolean,
  pathClear: boolean,
  fadeMarginDb: number | null,
): CoverageResult["link_quality"] {
  if (!withinMaxRange) return "out_of_range";
  if (!azimuthOk || !pathClear) return "blocked";
  if (fadeMarginDb === null) return "marginal";
  if (fadeMarginDb >= 20) return "good";
  if (fadeMarginDb >= 10) return "marginal";
  return "blocked";
}

function recommendProfile(
  linkQuality: CoverageResult["link_quality"],
  throughputDown: number,
  throughputUp: number,
  profiles: ServiceProfile[],
): ProfileRecommendation {
  const deratedDown = throughputDown * 0.8;
  const deratedUp = throughputUp * 0.8;

  if (linkQuality === "blocked" || linkQuality === "out_of_range") {
    return {
      recommended_profile: null,
      achievable_download_mbps: throughputDown,
      achievable_upload_mbps: throughputUp,
      confidence: "low",
      reason: "Nessuna copertura disponibile in questa posizione.",
    };
  }

  const confidence = linkQuality === "good" ? "high" : "medium";

  const eligible = profiles
    .filter((p) => p.active && p.category === "privati")
    .sort((a, b) => a.download_mbps - b.download_mbps);

  let best: ServiceProfile | null = null;
  for (const p of eligible) {
    if (deratedDown >= p.download_mbps && deratedUp >= p.upload_mbps) {
      best = p;
    }
  }

  if (!best) {
    return {
      recommended_profile: null,
      achievable_download_mbps: throughputDown,
      achievable_upload_mbps: throughputUp,
      confidence,
      reason: "Segnale insufficiente per i profili disponibili. Richiede sopralluogo tecnico.",
    };
  }

  const reason = linkQuality === "good"
    ? `Copertura ottima — profilo consigliato: ${best.label} (${best.download_mbps}/${best.upload_mbps} Mbps).`
    : `Copertura marginale — profilo consigliato: ${best.label}. Richiede sopralluogo di conferma.`;

  return {
    recommended_profile: best,
    achievable_download_mbps: throughputDown,
    achievable_upload_mbps: throughputUp,
    confidence,
    reason,
  };
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
      body = { lat, lng, customer_antenna_height_m: cah ? parseFloat(cah) : undefined };
    } else if (req.method === "POST") {
      body = await req.json();
    } else {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerAntennaM = body.customer_antenna_height_m ?? DEFAULT_CUSTOMER_ANTENNA_HEIGHT_M;
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

    const { data: profileList, error: profileError } = await supabase
      .from("service_profiles")
      .select("*")
      .order("sort_order");

    if (profileError) throw new Error(`DB error: ${profileError.message}`);

    const profiles: ServiceProfile[] = (profileList ?? []) as ServiceProfile[];

    if (!btsList || btsList.length === 0) {
      return new Response(
        JSON.stringify({ results: [], customer: { lat: body.lat, lng: body.lng }, message: "Nessuna BTS attiva configurata" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results: CoverageResult[] = [];
    for (const bts of btsList as Bts[]) {
      const distanceKm = haversineMeters(bts.lat, bts.lng, body.lat, body.lng) / 1000;
      const withinMaxRange = distanceKm <= bts.max_range_km;

      const pathBearing = bearingDeg(bts.lat, bts.lng, body.lat, body.lng);
      const azimuthOk = bts.azimuth_deg === null || angularDifferenceDeg(pathBearing, bts.azimuth_deg) <= 60;

      if (!withinMaxRange || !azimuthOk) {
        const lb = computeLinkBudget(bts, distanceKm, false, null, null);
        results.push({
          bts,
          distance_km: Number(distanceKm.toFixed(2)),
          within_max_range: withinMaxRange,
          azimuth_ok: azimuthOk,
          path_clear: false,
          link_quality: classifyQuality(withinMaxRange, azimuthOk, false, null),
          link_budget: lb,
          recommendation: recommendProfile("out_of_range", lb.estimated_throughput_mbps.down, lb.estimated_throughput_mbps.up, profiles),
          profile: [],
        });
        continue;
      }

      const points: { lat: number; lng: number }[] = [];
      for (let i = 0; i < PATH_SAMPLE_POINTS; i++) {
        const t = i / (PATH_SAMPLE_POINTS - 1);
        const distM = t * distanceKm * 1000;
        points.push(destinationPoint(bts.lat, bts.lng, pathBearing, distM));
      }

      let elevations: number[];
      try {
        elevations = await fetchElevations(points);
      } catch (err) {
        const lb = computeLinkBudget(bts, distanceKm, false, null, null);
        results.push({
          bts,
          distance_km: Number(distanceKm.toFixed(2)),
          within_max_range: withinMaxRange,
          azimuth_ok: azimuthOk,
          path_clear: false,
          link_quality: "blocked",
          link_budget: lb,
          recommendation: recommendProfile("blocked", lb.estimated_throughput_mbps.down, lb.estimated_throughput_mbps.up, profiles),
          profile: [],
        });
        console.error(`Elevation fetch failed for BTS ${bts.id}:`, err.message);
        continue;
      }

      const analysis = computeProfile(bts, body, customerAntennaM, elevations);
      const lb = computeLinkBudget(
        bts,
        distanceKm,
        analysis.pathClear,
        Number(analysis.fresnelClearanceM.toFixed(1)),
        analysis.worstObstructionM > 0 ? Number(analysis.worstObstructionM.toFixed(1)) : null,
      );
      const quality = classifyQuality(withinMaxRange, azimuthOk, analysis.pathClear, lb.fade_margin_db);

      results.push({
        bts,
        distance_km: Number(distanceKm.toFixed(2)),
        within_max_range: withinMaxRange,
        azimuth_ok: azimuthOk,
        path_clear: analysis.pathClear,
        link_quality: quality,
        link_budget: lb,
        recommendation: recommendProfile(quality, lb.estimated_throughput_mbps.down, lb.estimated_throughput_mbps.up, profiles),
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
