import { useState, FormEvent, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Icon, LatLngExpression, LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search, Loader2, Radio, ArrowLeft, Check, X, AlertTriangle,
  MapPin, Zap, TrendingUp, Mail, Phone, User, Send, FileText,
} from 'lucide-react';
import { CoverageResult, checkCoverage } from '../lib/supabase';
import { supabase } from '../lib/supabase';

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

function Geolocate() {
  const map = useMap();
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 13, { duration: 1 });
      },
      () => {},
      { timeout: 8000, maximumAge: 60000 },
    );
  }, [map]);
  return null;
}

type View = 'search' | 'positive' | 'negative';

export default function Copertura() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [customerPos, setCustomerPos] = useState<{ lat: number; lng: number } | null>(null);
  const [results, setResults] = useState<CoverageResult[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<LatLngExpression | null>(null);
  const [view, setView] = useState<View>('search');
  const [koReportSent, setKoReportSent] = useState(false);
  const [improvementSent, setImprovementSent] = useState(false);
  const [improvementSending, setImprovementSending] = useState(false);

  // improvement request form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

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
      await runCheck(pos, query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore ricerca');
    }
    setSearching(false);
  };

  const runCheck = async (pos: { lat: number; lng: number }, address?: string) => {
    setChecking(true);
    setError(null);
    setResults(null);
    setKoReportSent(false);
    setImprovementSent(false);
    setView('search');
    try {
      const data = await checkCoverage(pos.lat, pos.lng);
      const res = data.results;
      setResults(res);
      const hasAnyReachable = res.some((r) => r.link_quality === 'good' || r.link_quality === 'marginal');
      if (hasAnyReachable) {
        setView('positive');
      } else {
        setView('negative');
        // automatic KO report
        await sendKoReport(pos, res, address);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore verifica copertura');
    }
    setChecking(false);
  };

  const sendKoReport = async (pos: { lat: number; lng: number }, res: CoverageResult[], address?: string) => {
    try {
      const koReport = res.map((r) => ({
        bts_id: r.bts.id,
        bts_name: r.bts.name,
        distance_km: r.distance_km,
        within_max_range: r.within_max_range,
        azimuth_ok: r.azimuth_ok,
        path_clear: r.path_clear,
        link_quality: r.link_quality,
        reason: !r.within_max_range
          ? 'Fuori raggio massimo'
          : !r.azimuth_ok
            ? 'Fuori settore antenna'
            : !r.path_clear
              ? 'Line-of-sight ostruita'
              : 'Segnale insufficiente',
      }));
      await supabase.from('coverage_requests').insert({
        customer_lat: pos.lat,
        customer_lng: pos.lng,
        address: address ?? null,
        status: 'ko',
        ko_report: koReport,
      });
      setKoReportSent(true);
    } catch {
      // silent — user doesn't need to see internal report errors
    }
  };

  const submitImprovement = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim() || !email.trim()) {
      setFormError('Nome ed email sono obbligatori.');
      return;
    }
    if (!customerPos) {
      setFormError('Posizione non disponibile. Esegui prima una verifica copertura.');
      return;
    }
    setImprovementSending(true);
    try {
      const { error: insertError } = await supabase.from('coverage_requests').insert({
        customer_lat: customerPos.lat,
        customer_lng: customerPos.lng,
        address: query || null,
        status: 'improvement_request',
        customer_name: name.trim(),
        customer_email: email.trim(),
        customer_phone: phone.trim() || null,
        message: message.trim() || null,
      });
      if (insertError) throw insertError;
      setImprovementSent(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Invio non riuscito. Riprova.');
    }
    setImprovementSending(false);
  };

  const reset = () => {
    setView('search');
    setResults(null);
    setCustomerPos(null);
    setQuery('');
    setKoReportSent(false);
    setImprovementSent(false);
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
    setFormError(null);
  };

  const bestResult = results?.find((r) => r.recommendation.recommended_profile !== null) ?? null;
  const reachableResults = results?.filter((r) => r.link_quality === 'good' || r.link_quality === 'marginal') ?? [];

  return (
    <div className="cop-page">
      <header className="cop-header">
        <div className="container cop-header-inner">
          <a href="/" className="cop-back">
            <ArrowLeft size={16} /> NetBee
          </a>
          <h1 className="cop-title">
            <Radio size={20} /> Verifica Copertura
          </h1>
        </div>
      </header>

      <main className="container cop-main">
        <div className="cop-intro">
          <p className="cop-lead">
            Inserisci il tuo indirizzo o clicca sulla mappa per verificare subito se la tua posizione
            è coperta dal servizio FWA NetBee.
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
            <MapContainer center={DEFAULT_CENTER} zoom={13} className="cop-map">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
              />
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                attribution='Esri, HERE, Garmin'
              />
              <ClickHandler onClick={(lat, lng) => {
                const pos = { lat, lng };
                setCustomerPos(pos);
                setQuery('');
                runCheck(pos);
              }} />
              <Geolocate />
              <FlyTo center={flyTarget} />
              {customerPos && (
                <Marker position={[customerPos.lat, customerPos.lng]} icon={customerIcon()} />
              )}
            </MapContainer>
            <div className="cop-map-hint">
              <MapPin size={14} /> Clicca sulla mappa per posizionare il punto da verificare
            </div>
          </div>

          <div className="cop-results">
            {checking ? (
              <div className="cop-empty">
                <Loader2 size={28} className="spin" />
                <p>Verifica copertura in corso…</p>
                <p className="cop-empty-sub">Analisi della posizione e del segnale</p>
              </div>
            ) : view === 'positive' && bestResult?.recommendation.recommended_profile ? (
              <PositiveResult
                result={bestResult}
                reachableCount={reachableResults.length}
                onReset={reset}
              />
            ) : view === 'negative' ? (
              <NegativeResult
                koReportSent={koReportSent}
                improvementSent={improvementSent}
                improvementSending={improvementSending}
                formError={formError}
                name={name}
                email={email}
                phone={phone}
                message={message}
                setName={setName}
                setEmail={setEmail}
                setPhone={setPhone}
                setMessage={setMessage}
                onSubmit={submitImprovement}
                onReset={reset}
              />
            ) : !customerPos ? (
              <div className="cop-empty">
                <Radio size={36} />
                <p>Inserisci un indirizzo o clicca sulla mappa per verificare la copertura.</p>
              </div>
            ) : (
              <div className="cop-empty">
                <AlertTriangle size={28} />
                <p>Nessun risultato disponibile.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function PositiveResult({
  result,
  reachableCount,
  onReset,
}: {
  result: CoverageResult;
  reachableCount: number;
  onReset: () => void;
}) {
  const p = result.recommendation.recommended_profile!;
  return (
    <div className="cop-positive">
      <div className="cop-verdict cop-verdict-ok">
        <Check size={28} />
        <div>
          <strong>Copertura disponibile</strong>
          <span>La tua posizione è raggiunta dal servizio NetBee{reachableCount > 1 ? ` da ${reachableCount} stazioni` : ''}.</span>
        </div>
      </div>

      <div className="cop-profile-card">
        <div className="cop-profile-card-head">
          <Zap size={20} />
          <h3>Profilo consigliato per te</h3>
        </div>
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
            {p.yearly_enabled && (
              <div className="cop-price-tag cop-price-yearly">
                <span className="cop-price-val">{p.price_yearly.toFixed(2)}€</span>
                <span className="cop-price-label">/mese · contratto annuale</span>
              </div>
            )}
          </div>
          {p.requires_coverage_check && (
            <div className="cop-profile-verified">
              <Check size={14} /> Copertura verificata per questa posizione
            </div>
          )}
        </div>
      </div>

      <a href="mailto:amministrazione@netbee.it?subject=Richiesta%20attivazione%20FWA" className="btn btn-primary btn-lg cop-cta">
        <Mail size={18} /> Contattaci per attivare il servizio
      </a>
      <button className="cop-link-btn" onClick={onReset}>Verifica un'altra posizione</button>
    </div>
  );
}

function NegativeResult({
  koReportSent,
  improvementSent,
  improvementSending,
  formError,
  name,
  email,
  phone,
  message,
  setName,
  setEmail,
  setPhone,
  setMessage,
  onSubmit,
  onReset,
}: {
  koReportSent: boolean;
  improvementSent: boolean;
  improvementSending: boolean;
  formError: string | null;
  name: string;
  email: string;
  phone: string;
  message: string;
  setName: (v: string) => void;
  setEmail: (v: string) => void;
  setPhone: (v: string) => void;
  setMessage: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onReset: () => void;
}) {
  if (improvementSent) {
    return (
      <div className="cop-negative">
        <div className="cop-verdict cop-verdict-ok">
          <Check size={28} />
          <div>
            <strong>Richiesta inviata</strong>
            <span>Grazie! Ti contatteremo appena possibile per valutare un'estensione della copertura nella tua zona.</span>
          </div>
        </div>
        <button className="btn btn-primary" onClick={onReset}>Verifica un'altra posizione</button>
      </div>
    );
  }

  return (
    <div className="cop-negative">
      <div className="cop-verdict cop-verdict-no">
        <AlertTriangle size={28} />
        <div>
          <strong>Copertura non disponibile</strong>
          <span>Al momento nessuna stazione raggiunge questa posizione in line-of-sight.</span>
        </div>
      </div>

      {koReportSent && (
        <div className="cop-ko-report">
          <FileText size={16} />
          <span>Report di non-copertura registrato automaticamente.</span>
        </div>
      )}

      <div className="cop-improve">
        <h3>Richiedi l'estensione della copertura</h3>
        <p className="cop-improve-sub">
          Inserisci i tuoi dati: verificheremo la fattibilità tecnica e ti contatteremo
          se ci sono sviluppi nella tua zona.
        </p>
        <form className="cop-form" onSubmit={onSubmit}>
          <div className="cop-form-row">
            <div className="cop-form-field">
              <label>Nome e cognome *</label>
              <div className="cop-form-input">
                <User size={16} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mario Rossi"
                  required
                />
              </div>
            </div>
          </div>
          <div className="cop-form-row cop-form-row-2">
            <div className="cop-form-field">
              <label>Email *</label>
              <div className="cop-form-input">
                <Mail size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mario.rossi@email.it"
                  required
                />
              </div>
            </div>
            <div className="cop-form-field">
              <label>Telefono</label>
              <div className="cop-form-input">
                <Phone size={16} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="348 1234567"
                />
              </div>
            </div>
          </div>
          <div className="cop-form-row">
            <div className="cop-form-field">
              <label>Messaggio</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Es. indirizzo preciso o note sulla zona da coprire"
                rows={3}
              />
            </div>
          </div>
          {formError && <div className="cop-form-error">{formError}</div>}
          <button type="submit" className="btn btn-primary btn-lg cop-cta" disabled={improvementSending}>
            {improvementSending ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
            Invia richiesta
          </button>
        </form>
      </div>

      <button className="cop-link-btn" onClick={onReset}>Verifica un'altra posizione</button>
    </div>
  );
}
