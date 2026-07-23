import { useState, useCallback, useRef, FormEvent, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import { Icon, LatLngExpression, LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Loader2, Radio, ArrowLeft, Check, X, AlertTriangle, Signal, MapPin, Zap, TrendingUp } from 'lucide-react';
import { Bts, CoverageResult, checkCoverage, supabase } from '../lib/supabase';

const DEFAULT_CENTER: LatLngExpression = [44.7286, 8.0314];

function customerIcon(): Icon {
  return new Icon({
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26">
        <path d="M13 1 L25 24 L1 24 Z" fill="#e29743" stroke="#fff" stroke-width="2"/>
        <circle cx="13" cy="18" r="3" fill="#fff"/>
      </svg>`,
    )}`,
    iconSize: [26, 26],
    iconAnchor: [13, 24],
  });
}

function btsIcon(quality: CoverageResult['link_quality']): Icon {
  const color = quality === 'good' ? '#16a34a' : quality === 'marginal' ? '#e29743' : '#94a3b8';
  return new Icon({
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="12" fill="${color}" stroke="#fff" stroke-width="2"/>
        <circle cx="14" cy="14" r="4" fill="#fff"/>
      </svg>`,
    )}`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function FlyTo({ center }: { center: LatLngExpression | null }) {
  const map = useMap();
  if (center) {
    map.flyTo(center, 13, { duration: 0.8 });
  }
  return null;
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const QUALITY_LABELS: Record<CoverageResult['link_quality'], string> = {
  good: 'Ottima',
  marginal: 'Marginale',
  blocked: 'Ostruita',
  out_of_range: 'Fuori portata',
};

export default function Copertura() {
  const [btsList, setBtsList] = useState<Bts[]>([]);
  const [loadingBts, setLoadingBts] = useState(true);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [customerPos, setCustomerPos] = useState<{ lat: number; lng: number } | null>(null);
  const [results, setResults] = useState<CoverageResult[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<LatLngExpression | null>(null);
  const [selectedResult, setSelectedResult] = useState<CoverageResult | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const loadBts = useCallback(async () => {
    const { data, error } = await supabase
      .from('bts')
      .select('id,name,lat,lng,antenna_height_m,frequency_ghz,tx_power_dbm,antenna_gain_dbi,rx_sensitivity_dbm,cable_loss_db,azimuth_deg,tilt_deg,max_range_km,active')
      .eq('active', true)
      .order('name');
    if (error) throw new Error('Errore caricamento BTS');
    setBtsList((data ?? []) as Bts[]);
    setLoadingBts(false);
  }, []);

  useEffect(() => {
    loadBts().catch((e) => { setError(e.message); setLoadingBts(false); });
  }, [loadBts]);

  const geocode = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query + ', Piemonte, Italia')}`;
      const resp = await fetch(url, { headers: { 'Accept-Language': 'it' } });
      if (!resp.ok) throw new Error('Ricerca indirizzo non disponibile');
      const data = await resp.json();
      if (!data || data.length === 0) {
        setError('Indirizzo non trovato. Prova con una località più generica o clicca sulla mappa.');
        setSearching(false);
        return;
      }
      const { lat, lon } = data[0];
      const pos = { lat: parseFloat(lat), lng: parseFloat(lon) };
      setCustomerPos(pos);
      setFlyTarget([pos.lat, pos.lng]);
      await runCheck(pos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore ricerca');
    }
    setSearching(false);
  };

  const runCheck = async (pos: { lat: number; lng: number }) => {
    setChecking(true);
    setError(null);
    setResults(null);
    setSelectedResult(null);
    try {
      const data = await checkCoverage(pos.lat, pos.lng);
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore verifica copertura');
    }
    setChecking(false);
  };

  const handleMapClick = (lat: number, lng: number) => {
    const pos = { lat, lng };
    setCustomerPos(pos);
    setQuery('');
    runCheck(pos);
  };

  const handleProfileView = (r: CoverageResult) => {
    setSelectedResult(r);
    setTimeout(() => {
      profileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  };

  const bestResult = results?.find((r) => r.recommendation.recommended_profile !== null) ?? null;
  const hasAnyReachable = results?.some((r) => r.link_quality === 'good' || r.link_quality === 'marginal') ?? false;

  return (
    <div className="cop-page">
      <header className="cop-header">
        <div className="container cop-header-inner">
          <a href="/" className="cop-back">
            <ArrowLeft size={16} /> NetBee
          </a>
          <h1 className="cop-title">
            <Signal size={20} /> Verifica Copertura FWA
          </h1>
        </div>
      </header>

      <main className="container cop-main">
        <div className="cop-intro">
          <p className="cop-lead">
            Inserisci il tuo indirizzo o clicca sulla mappa per verificare la copertura FWA
            dalle stazioni BTS NetBee. Il calcolo considera distanza, orientamento antenna,
            profilo altimetrico del terreno (DEM SRTM 90m) e clearance della zona di Fresnel.
          </p>
        </div>

        <form className="cop-search" onSubmit={geocode}>
          <div className="cop-search-input">
            <Search size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Via Roma 1, Canelli, AT"
              disabled={searching}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={searching || !query.trim()}>
            {searching ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
            Verifica
          </button>
        </form>

        {error && (
          <div className="cop-error">
            <AlertTriangle size={18} />
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        <div className="cop-layout">
          <div className="cop-map-wrap">
            <MapContainer center={DEFAULT_CENTER} zoom={9} className="cop-map">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
              <ClickHandler onClick={handleMapClick} />
              <FlyTo center={flyTarget} />
              {btsList.map((b) => {
                const r = results?.find((x) => x.bts.id === b.id);
                return (
                  <Marker
                    key={b.id}
                    position={[b.lat, b.lng]}
                    icon={btsIcon(r?.link_quality ?? 'out_of_range')}
                  >
                  </Marker>
                );
              })}
              {btsList.map((b) => (
                <Circle
                  key={`c-${b.id}`}
                  center={[b.lat, b.lng]}
                  radius={b.max_range_km * 1000}
                  pathOptions={{ color: '#1752c7', weight: 1, opacity: 0.4, fillOpacity: 0.05 }}
                />
              ))}
              {customerPos && (
                <Marker position={[customerPos.lat, customerPos.lng]} icon={customerIcon()}>
                </Marker>
              )}
            </MapContainer>
            <div className="cop-map-hint">
              <MapPin size={14} /> Clicca sulla mappa per posizionare il cliente
            </div>
          </div>

          <div className="cop-results">
            {loadingBts ? (
              <div className="cop-empty"><Loader2 size={24} className="spin" /></div>
            ) : !customerPos ? (
              <div className="cop-empty">
                <Radio size={36} />
                <p>Inserisci un indirizzo o clicca sulla mappa per verificare la copertura.</p>
                <p className="cop-empty-sub">{btsList.length} BTS attive nel network</p>
              </div>
            ) : checking ? (
              <div className="cop-empty">
                <Loader2 size={28} className="spin" />
                <p>Calcolo copertura in corso…</p>
                <p className="cop-empty-sub">Analisi profilo altimetrico e zona di Fresnel</p>
              </div>
            ) : results && results.length > 0 ? (
              <>
                <div className={`cop-summary ${hasAnyReachable ? 'ok' : 'no'}`}>
                  {hasAnyReachable && bestResult?.recommendation.recommended_profile ? (
                    <>
                      <Check size={22} />
                      <div>
                        <strong>Copertura disponibile</strong>
                        <span>
                          Profilo consigliato: {bestResult.recommendation.recommended_profile.label} ({bestResult.recommendation.recommended_profile.download_mbps}/{bestResult.recommendation.recommended_profile.upload_mbps} Mbps)
                        </span>
                      </div>
                    </>
                  ) : hasAnyReachable ? (
                    <>
                      <AlertTriangle size={22} />
                      <div>
                        <strong>Connessione marginale</strong>
                        <span>Segnale presente ma richiede sopralluogo tecnico di conferma</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={22} />
                      <div>
                        <strong>Copertura non disponibile</strong>
                        <span>Nessuna BTS raggiunge questa posizione in line-of-sight</span>
                      </div>
                    </>
                  )}
                </div>

                {bestResult?.recommendation.recommended_profile && (
                  <div className="cop-profile-card">
                    <div className="cop-profile-card-head">
                      <Zap size={20} />
                      <h3>Profilo consigliato per te</h3>
                    </div>
                    {(() => {
                      const p = bestResult.recommendation.recommended_profile;
                      return (
                        <div className="cop-profile-card-body">
                          <div className="cop-profile-name">{p.label}</div>
                          <div className="cop-profile-speeds">
                            <span><TrendingUp size={16} /> {p.download_mbps} Mbps download</span>
                            <span><TrendingUp size={16} className="rotate-180" /> {p.upload_mbps} Mbps upload</span>
                          </div>
                          <div className="cop-profile-prices">
                            <div className="cop-price-tag">
                              <span className="cop-price-val">{p.price_bimonthly.toFixed(2)}€</span>
                              <span className="cop-price-label">/mese · contratto bimestrale</span>
                            </div>
                            <div className="cop-price-tag cop-price-yearly">
                              <span className="cop-price-val">{p.price_yearly.toFixed(2)}€</span>
                              <span className="cop-price-label">/mese · contratto annuale</span>
                            </div>
                          </div>
                          {p.requires_coverage_check && (
                            <div className="cop-profile-verified">
                              <Check size={14} /> Copertura verificata per questa posizione
                            </div>
                          )}
                          <div className="cop-profile-confidence">
                            Affidabilità: {bestResult.recommendation.confidence === 'high' ? 'Alta' : 'Media'}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <ul className="cop-bts-list">
                  {results.map((r) => (
                    <li
                      key={r.bts.id}
                      className={`cop-bts-item q-${r.link_quality}${selectedResult?.bts.id === r.bts.id ? ' selected' : ''}`}
                      onClick={() => handleProfileView(r)}
                    >
                      <div className="cop-bts-status">
                        <span className={`cop-q-dot q-${r.link_quality}`} />
                      </div>
                      <div className="cop-bts-main">
                        <div className="cop-bts-name">
                          {r.bts.name}
                          <span className={`cop-q-tag q-${r.link_quality}`}>{QUALITY_LABELS[r.link_quality]}</span>
                        </div>
                        <div className="cop-bts-meta">
                          {r.distance_km} km · {r.bts.frequency_ghz} GHz
                          {r.recommendation.recommended_profile && ` · ${r.recommendation.recommended_profile.label}`}
                        </div>
                        <div className="cop-bts-detail">
                          {!r.within_max_range && <span>Fuori raggio massimo ({r.bts.max_range_km} km)</span>}
                          {r.within_max_range && !r.azimuth_ok && <span>Fuori settore antenna</span>}
                          {r.within_max_range && r.azimuth_ok && !r.path_clear && (
                            <span>
                              Line-of-sight ostruita
                              {r.link_budget?.worst_obstruction_m !== null && r.link_budget?.worst_obstruction_m !== undefined && ` (${r.link_budget.worst_obstruction_m}m)`}
                            </span>
                          )}
                          {r.within_max_range && r.azimuth_ok && r.path_clear && (
                            <span>
                              LOS libera · clearance Fresnel {r.link_budget?.fresnel_clearance_m ?? 0}m
                            </span>
                          )}
                        </div>
                      </div>
                      {r.profile.length > 0 && (
                        <button className="cop-profile-btn" title="Vedi profilo altimetrico">
                          <ArrowLeft size={14} className="rotate-180" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="cop-empty">
                <AlertTriangle size={28} />
                <p>Nessun risultato disponibile.</p>
              </div>
            )}
          </div>
        </div>

        {selectedResult && selectedResult.profile.length > 0 && (
          <div className="cop-profile" ref={profileRef}>
            <div className="cop-profile-head">
              <h3>Profilo altimetrico — {selectedResult.bts.name}</h3>
              <button onClick={() => setSelectedResult(null)} className="icon-btn"><X size={16} /></button>
            </div>
            <CoverageChart result={selectedResult} />
            <div className="cop-profile-legend">
              <span><i className="legend-line los" /> Linea di vista (LOS)</span>
              <span><i className="legend-line terrain" /> Terreno (DEM)</span>
              <span>Distanza totale: {selectedResult.distance_km} km</span>
              <span>Frequenza: {selectedResult.bts.frequency_ghz} GHz</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function CoverageChart({ result }: { result: CoverageResult }) {
  const W = 800;
  const H = 240;
  const PAD_L = 48;
  const PAD_R = 16;
  const PAD_T = 16;
  const PAD_B = 32;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const profile = result.profile;
  const maxDist = profile[profile.length - 1]?.distance_m ?? 1;
  const allHeights = [...profile.map((p) => p.terrain_m), ...profile.map((p) => p.los_m)];
  const zBtsGround = profile[0] ? profile[0].terrain_m : 0;
  const zBtsAntenna = zBtsGround + result.bts.antenna_height_m;
  const zCustomer = profile[profile.length - 1]
    ? profile[profile.length - 1].terrain_m + 5
    : 0;
  allHeights.push(zBtsAntenna, zCustomer);
  const minH = Math.min(...allHeights) - 10;
  const maxH = Math.max(...allHeights) + 10;
  const hRange = maxH - minH || 1;

  const x = (d: number) => PAD_L + (d / maxDist) * innerW;
  const y = (h: number) => PAD_T + innerH - ((h - minH) / hRange) * innerH;

  const losPts = [
    { distance_m: 0, los_m: zBtsAntenna },
    ...profile.map((p) => ({ distance_m: p.distance_m, los_m: p.los_m })),
    { distance_m: maxDist, los_m: zCustomer },
  ];
  const terrainPts = [
    { distance_m: 0, terrain_m: zBtsGround },
    ...profile.map((p) => ({ distance_m: p.distance_m, terrain_m: p.terrain_m })),
    { distance_m: maxDist, terrain_m: profile[profile.length - 1]?.terrain_m ?? zBtsGround },
  ];

  const losPath = `M ${losPts.map((p) => `${x(p.distance_m).toFixed(1)} ${y(p.los_m).toFixed(1)}`).join(' L ')}`;
  const terrainPath = `M ${terrainPts.map((p) => `${x(p.distance_m).toFixed(1)} ${y(p.terrain_m).toFixed(1)}`).join(' L ')} L ${x(maxDist)} ${PAD_T + innerH} L ${PAD_L} ${PAD_T + innerH} Z`;

  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => minH + (i / yTicks) * hRange);
  const xTicks = 5;
  const xTickVals = Array.from({ length: xTicks + 1 }, (_, i) => (i / xTicks) * maxDist);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="cop-chart" preserveAspectRatio="xMidYMid meet">
      {ticks.map((t, i) => (
        <g key={`y${i}`}>
          <line x1={PAD_L} y1={y(t)} x2={W - PAD_R} y2={y(t)} stroke="#e2e8f0" strokeWidth="1" />
          <text x={PAD_L - 6} y={y(t) + 3} textAnchor="end" fontSize="10" fill="#64748b">{Math.round(t)}m</text>
        </g>
      ))}
      {xTickVals.map((d, i) => (
        <g key={`x${i}`}>
          <text x={x(d)} y={H - PAD_B + 16} textAnchor="middle" fontSize="10" fill="#64748b">
            {(d / 1000).toFixed(1)}km
          </text>
        </g>
      ))}
      <path d={terrainPath} fill="rgba(23,82,199,0.08)" stroke="#1752c7" strokeWidth="1.5" />
      <path d={losPath} fill="none" stroke="#e29743" strokeWidth="1.8" strokeDasharray="4 3" />
      <circle cx={x(0)} cy={y(zBtsAntenna)} r="4" fill="#1752c7" />
      <circle cx={x(maxDist)} cy={y(zCustomer)} r="4" fill="#e29743" />
    </svg>
  );
}
