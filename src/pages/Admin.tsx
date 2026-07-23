import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import { Icon, LatLngExpression, LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Plus, Pencil, Trash2, X, Save, Loader2, Radio, LogOut, MapPin,
  ArrowLeft, AlertCircle, Users, UserPlus, Shield, Search, Gauge, Zap, Tag,
  Satellite, Map as MapIcon, Signal,
} from 'lucide-react';
import { supabase, Bts, BtsInput, CoverageResult, ServiceProfile, ServiceProfileInput, ProfileRecommendationRule, ProfileRecommendationRuleInput, checkCoverage } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import NetBeeLogo from '../components/NetBeeLogo';

const DEFAULT_CENTER: LatLngExpression = [44.7286, 8.0314];

const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_ATTR = 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics';
const LABELS_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
const LABELS_ATTR = 'Esri, HERE, Garmin';
const STREET_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const STREET_ATTR = '&copy; OpenStreetMap &copy; CARTO';

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

function btsIcon(active: boolean): Icon {
  return new Icon({
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="12" fill="${active ? '#1752c7' : '#94a3b8'}" stroke="#fff" stroke-width="2"/>
        <circle cx="14" cy="14" r="4" fill="#fff"/>
      </svg>`,
    )}`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

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

interface FormState {
  name: string;
  lat: string;
  lng: string;
  antenna_height_m: string;
  frequency_ghz: string;
  tx_power_dbm: string;
  antenna_gain_dbi: string;
  rx_sensitivity_dbm: string;
  cable_loss_db: string;
  azimuth_deg: string;
  tilt_deg: string;
  max_range_km: string;
  active: boolean;
  notes: string;
}

const emptyForm: FormState = {
  name: '', lat: '', lng: '', antenna_height_m: '20', frequency_ghz: '5.6',
  tx_power_dbm: '29', antenna_gain_dbi: '20', rx_sensitivity_dbm: '-96', cable_loss_db: '0.5',
  azimuth_deg: '', tilt_deg: '0', max_range_km: '15',
  active: true, notes: '',
};

function formFromBts(b: Bts): FormState {
  return {
    name: b.name,
    lat: String(b.lat),
    lng: String(b.lng),
    antenna_height_m: String(b.antenna_height_m),
    frequency_ghz: String(b.frequency_ghz),
    tx_power_dbm: String(b.tx_power_dbm),
    antenna_gain_dbi: String(b.antenna_gain_dbi),
    rx_sensitivity_dbm: String(b.rx_sensitivity_dbm),
    cable_loss_db: String(b.cable_loss_db),
    azimuth_deg: b.azimuth_deg === null ? '' : String(b.azimuth_deg),
    tilt_deg: String(b.tilt_deg),
    max_range_km: String(b.max_range_km),
    active: b.active,
    notes: b.notes ?? '',
  };
}

function formToInput(f: FormState): BtsInput {
  return {
    name: f.name.trim(),
    lat: parseFloat(f.lat),
    lng: parseFloat(f.lng),
    antenna_height_m: parseFloat(f.antenna_height_m),
    frequency_ghz: parseFloat(f.frequency_ghz),
    tx_power_dbm: parseFloat(f.tx_power_dbm),
    antenna_gain_dbi: parseFloat(f.antenna_gain_dbi),
    rx_sensitivity_dbm: parseFloat(f.rx_sensitivity_dbm),
    cable_loss_db: parseFloat(f.cable_loss_db),
    azimuth_deg: f.azimuth_deg.trim() === '' ? null : parseFloat(f.azimuth_deg),
    tilt_deg: parseFloat(f.tilt_deg),
    max_range_km: parseFloat(f.max_range_km),
    active: f.active,
    notes: f.notes.trim() === '' ? null : f.notes.trim(),
  };
}

interface ProfileFormState {
  code: string;
  label: string;
  download_mbps: string;
  upload_mbps: string;
  price_bimonthly: string;
  price_yearly: string;
  yearly_enabled: boolean;
  requires_coverage_check: boolean;
  category: 'privati' | 'business';
  active: boolean;
  sort_order: string;
}

const emptyProfileForm: ProfileFormState = {
  code: '', label: '', download_mbps: '50', upload_mbps: '8',
  price_bimonthly: '28', price_yearly: '25', yearly_enabled: false,
  requires_coverage_check: false, category: 'privati', active: true, sort_order: '1',
};

function profileFormFromProfile(p: ServiceProfile): ProfileFormState {
  return {
    code: p.code,
    label: p.label,
    download_mbps: String(p.download_mbps),
    upload_mbps: String(p.upload_mbps),
    price_bimonthly: String(p.price_bimonthly),
    price_yearly: String(p.price_yearly),
    yearly_enabled: p.yearly_enabled,
    requires_coverage_check: p.requires_coverage_check,
    category: p.category as 'privati' | 'business',
    active: p.active,
    sort_order: String(p.sort_order),
  };
}

function profileFormToInput(f: ProfileFormState): ServiceProfileInput {
  return {
    code: f.code.trim().toUpperCase(),
    label: f.label.trim(),
    download_mbps: parseInt(f.download_mbps, 10),
    upload_mbps: parseInt(f.upload_mbps, 10),
    price_bimonthly: parseFloat(f.price_bimonthly),
    price_yearly: parseFloat(f.price_yearly),
    yearly_enabled: f.yearly_enabled,
    requires_coverage_check: f.requires_coverage_check,
    category: f.category,
    active: f.active,
    sort_order: parseInt(f.sort_order, 10) || 0,
  };
}

const QUALITY_LABELS: Record<CoverageResult['link_quality'], string> = {
  good: 'Ottima',
  marginal: 'Marginale',
  blocked: 'Ostruita',
  out_of_range: 'Fuori portata',
};

export default function Admin() {
  const { user, loading: authLoading, signOut, session } = useAuth();
  const navigate = useNavigate();
  const [btsList, setBtsList] = useState<Bts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Bts | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tab, setTab] = useState<'bts' | 'tech' | 'profiles' | 'users'>('bts');
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingUser, setSavingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Technical coverage check state
  const [techQuery, setTechQuery] = useState('');
  const [techSearching, setTechSearching] = useState(false);
  const [techPos, setTechPos] = useState<{ lat: number; lng: number } | null>(null);
  const [techResults, setTechResults] = useState<CoverageResult[] | null>(null);
  const [techChecking, setTechChecking] = useState(false);
  const [techError, setTechError] = useState<string | null>(null);
  const [techCah, setTechCah] = useState('5');
  const [mapType, setMapType] = useState<'satellite' | 'street'>('satellite');

  // Profiles state
  const [profileList, setProfileList] = useState<ServiceProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ServiceProfile | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormState>(emptyProfileForm);
  const [savingProfile, setSavingProfile] = useState(false);
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);

  // Recommendation rules state
  const [ruleList, setRuleList] = useState<ProfileRecommendationRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [editingRule, setEditingRule] = useState<ProfileRecommendationRule | null>(null);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [ruleForm, setRuleForm] = useState({ min_dbm: '-65', profile_id: '', label: '', sort_order: '1', active: true });
  const [savingRule, setSavingRule] = useState(false);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);

  const loadBts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('bts').select('*').order('name');
    if (error) {
      setError(error.message);
    } else {
      setBtsList((data ?? []) as Bts[]);
    }
    setLoading(false);
  }, []);

  const loadProfiles = useCallback(async () => {
    setLoadingProfiles(true);
    setError(null);
    const { data, error } = await supabase.from('service_profiles').select('*').order('sort_order');
    if (error) {
      setError(error.message);
    } else {
      setProfileList((data ?? []) as ServiceProfile[]);
    }
    setLoadingProfiles(false);
  }, []);

  const loadRules = useCallback(async () => {
    setLoadingRules(true);
    setError(null);
    const { data, error } = await supabase.from('profile_recommendation_rules').select('*').order('min_dbm', { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setRuleList((data ?? []) as ProfileRecommendationRule[]);
    }
    setLoadingRules(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: '/admin' }, replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) loadBts();
  }, [user, loadBts]);

  useEffect(() => {
    if (user && tab === 'profiles') {
      loadProfiles();
      loadRules();
    }
  }, [user, tab, loadProfiles, loadRules]);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setError(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`;
      const resp = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ''}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Admin users API ${resp.status}: ${txt}`);
      }
      const json = await resp.json();
      setAdminUsers(json.users ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore caricamento utenti');
    } finally {
      setLoadingUsers(false);
    }
  }, [session]);

  useEffect(() => {
    if (user && tab === 'users') loadUsers();
  }, [user, tab, loadUsers]);

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setSavingUser(true);
    setError(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email: newEmail.trim(), password: newPassword }),
      });
      if (!resp.ok) {
        const txt = await resp.json().catch(() => ({ error: resp.statusText }));
        throw new Error(txt.error || `Errore ${resp.status}`);
      }
      setNewEmail('');
      setNewPassword('');
      setShowUserForm(false);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore creazione utente');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (u: AdminUser) => {
    if (!confirm(`Eliminare l'account ${u.email}? L'accesso verrà revocato immediatamente.`)) return;
    setDeletingUserId(u.id);
    setError(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?id=${u.id}`;
      const resp = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ''}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
      });
      if (!resp.ok) {
        const txt = await resp.json().catch(() => ({ error: resp.statusText }));
        throw new Error(txt.error || `Errore ${resp.status}`);
      }
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore eliminazione utente');
    } finally {
      setDeletingUserId(null);
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (b: Bts) => {
    setEditing(b);
    setForm(formFromBts(b));
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const pickOnMap = (lat: number, lng: number) => {
    setForm((f) => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const input = formToInput(form);
    if (!input.name || Number.isNaN(input.lat) || Number.isNaN(input.lng)) {
      setError('Nome, latitudine e longitudine sono obbligatori.');
      setSaving(false);
      return;
    }
    let err;
    if (editing) {
      ({ error: err } = await supabase.from('bts').update(input).eq('id', editing.id));
    } else {
      ({ error: err } = await supabase.from('bts').insert(input));
    }
    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }
    setSaving(false);
    closeForm();
    await loadBts();
  };

  const handleDelete = async (b: Bts) => {
    if (!confirm(`Eliminare la BTS "${b.name}"? L'operazione non è reversibile.`)) return;
    setDeletingId(b.id);
    const { error } = await supabase.from('bts').delete().eq('id', b.id);
    if (error) setError(error.message);
    else await loadBts();
    setDeletingId(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  // Technical coverage check handlers
  const techGeocode = async (e: FormEvent) => {
    e.preventDefault();
    if (!techQuery.trim()) return;
    setTechSearching(true);
    setTechError(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(techQuery + ', Piemonte, Italia')}`;
      const resp = await fetch(url, { headers: { 'Accept-Language': 'it' } });
      if (!resp.ok) throw new Error('Ricerca indirizzo non disponibile');
      const data = await resp.json();
      if (!data || data.length === 0) {
        setTechError('Indirizzo non trovato.');
        setTechSearching(false);
        return;
      }
      const { lat, lon } = data[0];
      const pos = { lat: parseFloat(lat), lng: parseFloat(lon) };
      setTechPos(pos);
      await runTechCheck(pos);
    } catch (err) {
      setTechError(err instanceof Error ? err.message : 'Errore ricerca');
    }
    setTechSearching(false);
  };

  const runTechCheck = async (pos: { lat: number; lng: number }) => {
    setTechChecking(true);
    setTechError(null);
    setTechResults(null);
    try {
      const data = await checkCoverage(pos.lat, pos.lng, parseFloat(techCah) || 5);
      setTechResults(data.results);
    } catch (err) {
      setTechError(err instanceof Error ? err.message : 'Errore verifica copertura');
    }
    setTechChecking(false);
  };

  const handleTechMapClick = (lat: number, lng: number) => {
    const pos = { lat, lng };
    setTechPos(pos);
    setTechQuery('');
    runTechCheck(pos);
  };

  // Profile CRUD handlers
  const openNewProfile = () => {
    setEditingProfile(null);
    setProfileForm(emptyProfileForm);
    setShowProfileForm(true);
  };

  const openEditProfile = (p: ServiceProfile) => {
    setEditingProfile(p);
    setProfileForm(profileFormFromProfile(p));
    setShowProfileForm(true);
  };

  const closeProfileForm = () => {
    setShowProfileForm(false);
    setEditingProfile(null);
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setError(null);
    const input = profileFormToInput(profileForm);
    if (!input.code || !input.label) {
      setError('Codice e nome sono obbligatori.');
      setSavingProfile(false);
      return;
    }
    let err;
    if (editingProfile) {
      ({ error: err } = await supabase.from('service_profiles').update(input).eq('id', editingProfile.id));
    } else {
      ({ error: err } = await supabase.from('service_profiles').insert(input));
    }
    if (err) {
      setError(err.message);
      setSavingProfile(false);
      return;
    }
    setSavingProfile(false);
    closeProfileForm();
    await loadProfiles();
  };

  const handleDeleteProfile = async (p: ServiceProfile) => {
    if (!confirm(`Eliminare il profilo "${p.label}"? L'operazione non è reversibile.`)) return;
    setDeletingProfileId(p.id);
    const { error } = await supabase.from('service_profiles').delete().eq('id', p.id);
    if (error) setError(error.message);
    else await loadProfiles();
    setDeletingProfileId(null);
  };

  // Recommendation rules CRUD
  const openNewRule = () => {
    setEditingRule(null);
    setRuleForm({ min_dbm: '-65', profile_id: profileList[0]?.id ?? '', label: '', sort_order: String(ruleList.length + 1), active: true });
    setShowRuleForm(true);
  };

  const openEditRule = (r: ProfileRecommendationRule) => {
    setEditingRule(r);
    setRuleForm({ min_dbm: String(r.min_dbm), profile_id: r.profile_id, label: r.label, sort_order: String(r.sort_order), active: r.active });
    setShowRuleForm(true);
  };

  const closeRuleForm = () => {
    setShowRuleForm(false);
    setEditingRule(null);
  };

  const handleRuleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSavingRule(true);
    setError(null);
    const input: ProfileRecommendationRuleInput = {
      min_dbm: parseFloat(ruleForm.min_dbm),
      profile_id: ruleForm.profile_id,
      label: ruleForm.label.trim(),
      sort_order: parseInt(ruleForm.sort_order, 10) || 0,
      active: ruleForm.active,
    };
    if (!input.profile_id) {
      setError('Seleziona un profilo.');
      setSavingRule(false);
      return;
    }
    let err;
    if (editingRule) {
      ({ error: err } = await supabase.from('profile_recommendation_rules').update(input).eq('id', editingRule.id));
    } else {
      ({ error: err } = await supabase.from('profile_recommendation_rules').insert(input));
    }
    if (err) {
      setError(err.message);
      setSavingRule(false);
      return;
    }
    setSavingRule(false);
    closeRuleForm();
    await loadRules();
  };

  const handleDeleteRule = async (r: ProfileRecommendationRule) => {
    if (!confirm(`Eliminare la regola "${r.label}"?`)) return;
    setDeletingRuleId(r.id);
    const { error } = await supabase.from('profile_recommendation_rules').delete().eq('id', r.id);
    if (error) setError(error.message);
    else await loadRules();
    setDeletingRuleId(null);
  };

  if (authLoading) {
    return (
      <div className="admin-loading">
        <Loader2 size={28} className="spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="container admin-header-inner">
          <a href="/" className="admin-logo-link">
            <NetBeeLogo height={40} variant="dark" />
          </a>
          <div className="admin-header-title">
            <Radio size={18} />
            <span>Gestione BTS</span>
          </div>
          <div className="admin-header-actions">
            <Link to="/copertura" className="btn btn-outline btn-sm">
              <MapPin size={15} /> Verifica Copertura
            </Link>
            <button onClick={handleSignOut} className="admin-signout">
              <LogOut size={15} /> Esci
            </button>
          </div>
        </div>
      </header>

      <main className="container admin-main">
        <div className="admin-section-head">
          <div>
            <Link to="/" className="admin-back-link">
              <ArrowLeft size={14} /> Sito pubblico
            </Link>
            <h1 className="admin-h1">Pannello di amministrazione</h1>
            <p className="admin-sub">Connesso come {user.email}</p>
          </div>
          <div className="admin-tabs">
            <button
              className={`admin-tab${tab === 'bts' ? ' active' : ''}`}
              onClick={() => setTab('bts')}
            >
              <Radio size={15} /> Stazioni BTS
            </button>
            <button
              className={`admin-tab${tab === 'tech' ? ' active' : ''}`}
              onClick={() => setTab('tech')}
            >
              <Gauge size={15} /> Verifica Tecnica
            </button>
            <button
              className={`admin-tab${tab === 'profiles' ? ' active' : ''}`}
              onClick={() => setTab('profiles')}
            >
              <Tag size={15} /> Profili
            </button>
            <button
              className={`admin-tab${tab === 'users' ? ' active' : ''}`}
              onClick={() => setTab('users')}
            >
              <Users size={15} /> Amministratori
            </button>
          </div>
        </div>

        {error && (
          <div className="admin-error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {tab === 'bts' && (
          <>
            <div className="admin-section-head">
              <div>
                <h2 className="admin-h2">Stazioni BTS</h2>
                <p className="admin-sub">
                  {btsList.length} BTS configurate · {btsList.filter((b) => b.active).length} attive
                </p>
              </div>
              <button className="btn btn-primary" onClick={openNew}>
                <Plus size={18} /> Aggiungi BTS
              </button>
            </div>

            <div className="admin-layout">
              <div className="admin-list">
                {loading ? (
                  <div className="admin-empty"><Loader2 size={24} className="spin" /></div>
                ) : btsList.length === 0 ? (
                  <div className="admin-empty">
                    <Radio size={32} />
                    <p>Nessuna BTS configurata.</p>
                    <button className="btn btn-primary" onClick={openNew}>
                      <Plus size={18} /> Aggiungi la prima BTS
                    </button>
                  </div>
                ) : (
                  <ul className="bts-list">
                    {btsList.map((b) => (
                      <li key={b.id} className={`bts-item${b.active ? '' : ' inactive'}`}>
                        <div className="bts-item-status">
                          <span className={`bts-status-dot ${b.active ? 'on' : 'off'}`} />
                        </div>
                        <div className="bts-item-main">
                          <div className="bts-item-name">{b.name}</div>
                          <div className="bts-item-meta">
                            {b.lat.toFixed(5)}, {b.lng.toFixed(5)} · h={b.antenna_height_m}m ·
                            {b.frequency_ghz}GHz · {b.tx_power_dbm}dBm · {b.antenna_gain_dbi}dBi · r={b.max_range_km}km
                            {b.azimuth_deg !== null && ` · az=${b.azimuth_deg}°`}
                          </div>
                          {b.notes && <div className="bts-item-notes">{b.notes}</div>}
                        </div>
                        <div className="bts-item-actions">
                          <button onClick={() => openEdit(b)} className="icon-btn" title="Modifica">
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(b)}
                            className="icon-btn danger"
                            title="Elimina"
                            disabled={deletingId === b.id}
                          >
                            {deletingId === b.id ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="admin-map">
                <MapContainer center={DEFAULT_CENTER} zoom={13} className="admin-map-container">
                  {mapType === 'satellite' ? (
                    <>
                      <TileLayer url={SATELLITE_URL} attribution={SATELLITE_ATTR} />
                      <TileLayer url={LABELS_URL} attribution={LABELS_ATTR} />
                    </>
                  ) : (
                    <TileLayer url={STREET_URL} attribution={STREET_ATTR} />
                  )}
                  <button
                    className="map-type-toggle"
                    onClick={() => setMapType(mapType === 'satellite' ? 'street' : 'satellite')}
                    title={mapType === 'satellite' ? 'Passa a mappa stradale' : 'Passa a satellite'}
                  >
                    {mapType === 'satellite' ? <MapIcon size={18} /> : <Satellite size={18} />}
                  </button>
                  <ClickHandler onClick={pickOnMap} />
                  <Geolocate />
                  {btsList.map((b) => (
                    <Circle
                      key={`c-${b.id}`}
                      center={[b.lat, b.lng]}
                      radius={b.max_range_km * 1000}
                      pathOptions={{ color: '#1752c7', weight: 1, opacity: 0.5, fillOpacity: 0.08 }}
                    />
                  ))}
                  {btsList.map((b) => (
                    <Marker key={b.id} position={[b.lat, b.lng]} icon={btsIcon(b.active)}>
                      <Popup>
                        <strong>{b.name}</strong><br />
                        {b.frequency_ghz} GHz · h{b.antenna_height_m}m · {b.antenna_gain_dbi}dBi · r{b.max_range_km}km<br />
                        {b.active ? 'Attiva' : 'Disattivata'}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
                <div className="admin-map-hint">Clicca sulla mappa per prelevare coordinate</div>
              </div>
            </div>
          </>
        )}

        {tab === 'tech' && (
          <div className="admin-tech">
            <div className="admin-section-head">
              <div>
                <h2 className="admin-h2">Verifica Tecnica Copertura</h2>
                <p className="admin-sub">Calcolo link budget completo con parametri LTU Rocket + LTU LR</p>
              </div>
            </div>

            <div className="admin-tech-layout">
              <div className="admin-tech-left">
                <form className="cop-search" onSubmit={techGeocode}>
                  <div className="cop-search-input">
                    <Search size={18} />
                    <input
                      type="text"
                      value={techQuery}
                      onChange={(e) => setTechQuery(e.target.value)}
                      placeholder="Indirizzo o località"
                      disabled={techSearching}
                    />
                  </div>
                  <label className="admin-tech-cah">
                    <span>Antenna cliente (m)</span>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={techCah}
                      onChange={(e) => setTechCah(e.target.value)}
                      style={{ width: '70px' }}
                    />
                  </label>
                  <button type="submit" className="btn btn-primary" disabled={techSearching || !techQuery.trim()}>
                    {techSearching ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
                    Verifica
                  </button>
                </form>

                {techError && (
                  <div className="admin-error-banner">
                    <AlertCircle size={18} />
                    <span>{techError}</span>
                    <button onClick={() => setTechError(null)}><X size={16} /></button>
                  </div>
                )}

                {techChecking ? (
                  <div className="admin-empty"><Loader2 size={28} className="spin" /><p>Calcolo link budget in corso…</p></div>
                ) : techResults && techResults.length > 0 ? (
                  <div className="admin-tech-results">
                    {techResults.map((r) => (
                      <TechResultCard key={r.bts.id} result={r} />
                    ))}
                  </div>
                ) : techPos ? (
                  <div className="admin-empty"><Radio size={28} /><p>Nessun risultato.</p></div>
                ) : (
                  <div className="admin-empty">
                    <Gauge size={32} />
                    <p>Inserisci un indirizzo o clicca sulla mappa per il calcolo tecnico del link budget.</p>
                  </div>
                )}
              </div>

              <div className="admin-tech-right">
                <MapContainer center={DEFAULT_CENTER} zoom={13} className="admin-map-container">
                  {mapType === 'satellite' ? (
                    <>
                      <TileLayer url={SATELLITE_URL} attribution={SATELLITE_ATTR} />
                      <TileLayer url={LABELS_URL} attribution={LABELS_ATTR} />
                    </>
                  ) : (
                    <TileLayer url={STREET_URL} attribution={STREET_ATTR} />
                  )}
                  <button
                    className="map-type-toggle"
                    onClick={() => setMapType(mapType === 'satellite' ? 'street' : 'satellite')}
                    title={mapType === 'satellite' ? 'Passa a mappa stradale' : 'Passa a satellite'}
                  >
                    {mapType === 'satellite' ? <MapIcon size={18} /> : <Satellite size={18} />}
                  </button>
                  <ClickHandler onClick={handleTechMapClick} />
                  <Geolocate />
                  {btsList.map((b) => (
                    <Circle
                      key={`c-${b.id}`}
                      center={[b.lat, b.lng]}
                      radius={b.max_range_km * 1000}
                      pathOptions={{ color: '#1752c7', weight: 1, opacity: 0.5, fillOpacity: 0.08 }}
                    />
                  ))}
                  {btsList.map((b) => (
                    <Marker key={b.id} position={[b.lat, b.lng]} icon={btsIcon(b.active)}>
                      <Popup>
                        <strong>{b.name}</strong><br />
                        {b.frequency_ghz} GHz · {b.antenna_gain_dbi}dBi
                      </Popup>
                    </Marker>
                  ))}
                  {techPos && (
                    <Marker position={[techPos.lat, techPos.lng]} icon={customerIcon()}>
                      <Popup>
                        <strong>Posizione cliente</strong><br />
                        {techPos.lat.toFixed(5)}, {techPos.lng.toFixed(5)}
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
                <div className="admin-map-hint">
                  <MapPin size={14} /> Clicca sulla mappa per posizionare il cliente
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'profiles' && (
          <>
          <div className="admin-users">
            <div className="admin-section-head">
              <div>
                <h2 className="admin-h2">Profili Internet</h2>
                <p className="admin-sub">
                  {profileList.length} profili configurati · {profileList.filter((p) => p.active).length} attivi
                </p>
              </div>
              <button className="btn btn-primary" onClick={openNewProfile}>
                <Plus size={18} /> Aggiungi profilo
              </button>
            </div>

            {loadingProfiles ? (
              <div className="admin-empty"><Loader2 size={24} className="spin" /></div>
            ) : profileList.length === 0 ? (
              <div className="admin-empty">
                <Tag size={32} />
                <p>Nessun profilo configurato.</p>
                <button className="btn btn-primary" onClick={openNewProfile}>
                  <Plus size={18} /> Aggiungi il primo profilo
                </button>
              </div>
            ) : (
              <ul className="bts-list">
                {profileList.map((p) => (
                  <li key={p.id} className={`bts-item${p.active ? '' : ' inactive'}`}>
                    <div className="bts-item-status">
                      <span className={`bts-status-dot ${p.active ? 'on' : 'off'}`} />
                    </div>
                    <div className="bts-item-main">
                      <div className="bts-item-name">{p.label} <span className="profile-code-badge">{p.code}</span></div>
                      <div className="bts-item-meta">
                        {p.download_mbps}/{p.upload_mbps} Mbps · {p.price_bimonthly.toFixed(2)}€/mese (bim.)
                        {p.yearly_enabled && ` · ${p.price_yearly.toFixed(2)}€/mese (ann.)`}
                        {' · '}<span className="profile-cat-badge">{p.category}</span>
                        {p.requires_coverage_check && ' · previa copertura'}
                      </div>
                    </div>
                    <div className="bts-item-actions">
                      <button onClick={() => openEditProfile(p)} className="icon-btn" title="Modifica">
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteProfile(p)}
                        className="icon-btn danger"
                        title="Elimina"
                        disabled={deletingProfileId === p.id}
                      >
                        {deletingProfileId === p.id ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recommendation Rules */}
          <div className="admin-rules-section">
            <div className="admin-section-head">
              <div>
                <h3 className="admin-h3">Regole profilo consigliato</h3>
                <p className="admin-sub">
                  Associa la potenza del segnale ricevuto (dBm) al profilo da consigliare. Le regole sono valutate dalla più restrittiva alla meno restrittiva.
                </p>
              </div>
              <button className="btn btn-primary" onClick={openNewRule} disabled={profileList.length === 0}>
                <Plus size={18} /> Aggiungi regola
              </button>
            </div>

            {loadingRules ? (
              <div className="admin-empty"><Loader2 size={24} className="spin" /></div>
            ) : ruleList.length === 0 ? (
              <div className="admin-empty">
                <Signal size={32} />
                <p>Nessuna regola configurata. Il sistema userà il calcolo automatico basato su throughput.</p>
              </div>
            ) : (
              <ul className="bts-list">
                {ruleList.map((r) => {
                  const profile = profileList.find((p) => p.id === r.profile_id);
                  return (
                    <li key={r.id} className={`bts-item${r.active ? '' : ' inactive'}`}>
                      <div className="bts-item-status">
                        <span className={`bts-status-dot ${r.active ? 'on' : 'off'}`} />
                      </div>
                      <div className="bts-item-main">
                        <div className="bts-item-name">
                          ≥ {r.min_dbm} dBm {r.label && <span className="profile-code-badge">{r.label}</span>}
                        </div>
                        <div className="bts-item-meta">
                          Profilo: {profile ? `${profile.label} (${profile.download_mbps}/${profile.upload_mbps} Mbps)` : 'Profilo eliminato'}
                        </div>
                      </div>
                      <div className="bts-item-actions">
                        <button onClick={() => openEditRule(r)} className="icon-btn" title="Modifica">
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(r)}
                          className="icon-btn danger"
                          title="Elimina"
                          disabled={deletingRuleId === r.id}
                        >
                          {deletingRuleId === r.id ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          </>
        )}

        {tab === 'users' && (
          <div className="admin-users">
            <div className="admin-section-head">
              <div>
                <h2 className="admin-h2">Amministratori</h2>
                <p className="admin-sub">{adminUsers.length} account con accesso al pannello</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowUserForm(true)}>
                <UserPlus size={18} /> Nuovo amministratore
              </button>
            </div>

            {loadingUsers ? (
              <div className="admin-empty"><Loader2 size={24} className="spin" /></div>
            ) : adminUsers.length === 0 ? (
              <div className="admin-empty"><Users size={32} /><p>Nessun utente.</p></div>
            ) : (
              <ul className="bts-list">
                {adminUsers.map((u) => (
                  <li key={u.id} className="bts-item">
                    <div className="bts-item-status">
                      <Shield size={16} className="admin-user-shield" />
                    </div>
                    <div className="bts-item-main">
                      <div className="bts-item-name">{u.email}</div>
                      <div className="bts-item-meta">
                        Creato {new Date(u.created_at).toLocaleDateString('it-IT')}
                        {u.last_sign_in_at && ` · ultimo accesso ${new Date(u.last_sign_in_at).toLocaleString('it-IT')}`}
                        {u.id === user.id && ' · (tu)'}
                      </div>
                    </div>
                    <div className="bts-item-actions">
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="icon-btn danger"
                        title="Elimina account"
                        disabled={u.id === user.id || deletingUserId === u.id}
                      >
                        {deletingUserId === u.id ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>

      {showForm && (
        <div className="modal-backdrop" onClick={closeForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{editing ? 'Modifica BTS' : 'Nuova BTS'}</h2>
              <button onClick={closeForm} className="icon-btn"><X size={18} /></button>
            </div>
            <form className="bts-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <label className="form-field">
                  <span>Nome *</span>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="Canelli - Centro"
                  />
                </label>
                <label className="form-field form-check">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  <span>Attiva</span>
                </label>
              </div>

              <div className="form-row form-row-2">
                <label className="form-field">
                  <span>Latitudine *</span>
                  <input
                    value={form.lat}
                    onChange={(e) => setForm({ ...form, lat: e.target.value })}
                    required
                    step="0.000001"
                    placeholder="44.7286"
                  />
                </label>
                <label className="form-field">
                  <span>Longitudine *</span>
                  <input
                    value={form.lng}
                    onChange={(e) => setForm({ ...form, lng: e.target.value })}
                    required
                    step="0.000001"
                    placeholder="8.0314"
                  />
                </label>
              </div>

              <div className="form-row form-row-3">
                <label className="form-field">
                  <span>Altezza antenna (m)</span>
                  <input
                    type="number" step="0.1" min="0"
                    value={form.antenna_height_m}
                    onChange={(e) => setForm({ ...form, antenna_height_m: e.target.value })}
                  />
                </label>
                <label className="form-field">
                  <span>Frequenza (GHz)</span>
                  <input
                    type="number" step="0.01" min="0"
                    value={form.frequency_ghz}
                    onChange={(e) => setForm({ ...form, frequency_ghz: e.target.value })}
                  />
                </label>
                <label className="form-field">
                  <span>Potenza TX (dBm)</span>
                  <input
                    type="number" step="0.1"
                    value={form.tx_power_dbm}
                    onChange={(e) => setForm({ ...form, tx_power_dbm: e.target.value })}
                  />
                </label>
              </div>

              <div className="form-row form-row-3">
                <label className="form-field">
                  <span>Guadagno antenna (dBi)</span>
                  <input
                    type="number" step="0.1" min="0"
                    value={form.antenna_gain_dbi}
                    onChange={(e) => setForm({ ...form, antenna_gain_dbi: e.target.value })}
                  />
                </label>
                <label className="form-field">
                  <span>Sensibilità RX (dBm)</span>
                  <input
                    type="number" step="0.1"
                    value={form.rx_sensitivity_dbm}
                    onChange={(e) => setForm({ ...form, rx_sensitivity_dbm: e.target.value })}
                  />
                </label>
                <label className="form-field">
                  <span>Perdite cavo (dB)</span>
                  <input
                    type="number" step="0.1" min="0"
                    value={form.cable_loss_db}
                    onChange={(e) => setForm({ ...form, cable_loss_db: e.target.value })}
                  />
                </label>
              </div>

              <div className="form-row form-row-3">
                <label className="form-field">
                  <span>Azimuth (°, vuoto=omni)</span>
                  <input
                    type="number" step="0.1" min="0" max="360"
                    value={form.azimuth_deg}
                    onChange={(e) => setForm({ ...form, azimuth_deg: e.target.value })}
                  />
                </label>
                <label className="form-field">
                  <span>Tilt (°)</span>
                  <input
                    type="number" step="0.1"
                    value={form.tilt_deg}
                    onChange={(e) => setForm({ ...form, tilt_deg: e.target.value })}
                  />
                </label>
                <label className="form-field">
                  <span>Raggio max (km)</span>
                  <input
                    type="number" step="0.1" min="0"
                    value={form.max_range_km}
                    onChange={(e) => setForm({ ...form, max_range_km: e.target.value })}
                  />
                </label>
              </div>

              <label className="form-field">
                <span>Note</span>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Posizione antenna, tipo, proprietario, ecc."
                />
              </label>

              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={closeForm}>Annulla</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                  {editing ? 'Salva modifiche' : 'Crea BTS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProfileForm && (
        <div className="modal-backdrop" onClick={closeProfileForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{editingProfile ? 'Modifica profilo' : 'Nuovo profilo'}</h2>
              <button onClick={closeProfileForm} className="icon-btn"><X size={18} /></button>
            </div>
            <form className="bts-form" onSubmit={handleProfileSubmit}>
              <div className="form-row form-row-2">
                <label className="form-field">
                  <span>Codice *</span>
                  <input
                    value={profileForm.code}
                    onChange={(e) => setProfileForm({ ...profileForm, code: e.target.value })}
                    required
                    placeholder="NBEE100"
                  />
                </label>
                <label className="form-field">
                  <span>Nome visualizzato *</span>
                  <input
                    value={profileForm.label}
                    onChange={(e) => setProfileForm({ ...profileForm, label: e.target.value })}
                    required
                    placeholder="NBEE 100"
                  />
                </label>
              </div>

              <div className="form-row form-row-2">
                <label className="form-field">
                  <span>Download (Mbps)</span>
                  <input
                    type="number" min="1"
                    value={profileForm.download_mbps}
                    onChange={(e) => setProfileForm({ ...profileForm, download_mbps: e.target.value })}
                  />
                </label>
                <label className="form-field">
                  <span>Upload (Mbps)</span>
                  <input
                    type="number" min="1"
                    value={profileForm.upload_mbps}
                    onChange={(e) => setProfileForm({ ...profileForm, upload_mbps: e.target.value })}
                  />
                </label>
              </div>

              <div className="form-row form-row-2">
                <label className="form-field">
                  <span>Prezzo bimestrale (€/mese)</span>
                  <input
                    type="number" step="0.01" min="0"
                    value={profileForm.price_bimonthly}
                    onChange={(e) => setProfileForm({ ...profileForm, price_bimonthly: e.target.value })}
                  />
                </label>
                <label className="form-field">
                  <span>Prezzo annuale (€/mese)</span>
                  <input
                    type="number" step="0.01" min="0"
                    value={profileForm.price_yearly}
                    onChange={(e) => setProfileForm({ ...profileForm, price_yearly: e.target.value })}
                    disabled={!profileForm.yearly_enabled}
                  />
                </label>
              </div>

              <div className="form-row form-row-3">
                <label className="form-field">
                  <span>Categoria</span>
                  <select
                    value={profileForm.category}
                    onChange={(e) => setProfileForm({ ...profileForm, category: e.target.value as 'privati' | 'business' })}
                  >
                    <option value="privati">Privati</option>
                    <option value="business">Business</option>
                  </select>
                </label>
                <label className="form-field">
                  <span>Ordine</span>
                  <input
                    type="number" min="0"
                    value={profileForm.sort_order}
                    onChange={(e) => setProfileForm({ ...profileForm, sort_order: e.target.value })}
                  />
                </label>
                <div className="form-field form-check-group">
                  <label className="form-field form-check">
                    <input
                      type="checkbox"
                      checked={profileForm.active}
                      onChange={(e) => setProfileForm({ ...profileForm, active: e.target.checked })}
                    />
                    <span>Attivo</span>
                  </label>
                  <label className="form-field form-check">
                    <input
                      type="checkbox"
                      checked={profileForm.yearly_enabled}
                      onChange={(e) => setProfileForm({ ...profileForm, yearly_enabled: e.target.checked })}
                    />
                    <span>Annuale</span>
                  </label>
                  <label className="form-field form-check">
                    <input
                      type="checkbox"
                      checked={profileForm.requires_coverage_check}
                      onChange={(e) => setProfileForm({ ...profileForm, requires_coverage_check: e.target.checked })}
                    />
                    <span>Previa copert.</span>
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={closeProfileForm}>Annulla</button>
                <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                  {savingProfile ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                  {editingProfile ? 'Salva modifiche' : 'Crea profilo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRuleForm && (
        <div className="modal-backdrop" onClick={closeRuleForm}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{editingRule ? 'Modifica regola' : 'Nuova regola'}</h2>
              <button onClick={closeRuleForm} className="icon-btn"><X size={18} /></button>
            </div>
            <form className="bts-form" onSubmit={handleRuleSubmit}>
              <label className="form-field">
                <span>Potenza minima ricevuta (dBm) *</span>
                <input
                  type="number"
                  step="0.1"
                  value={ruleForm.min_dbm}
                  onChange={(e) => setRuleForm({ ...ruleForm, min_dbm: e.target.value })}
                  required
                  placeholder="-55"
                />
                <small className="form-hint">Es. -55 = segnale forte, -75 = segnale debole</small>
              </label>
              <label className="form-field">
                <span>Profilo consigliato *</span>
                <select
                  value={ruleForm.profile_id}
                  onChange={(e) => setRuleForm({ ...ruleForm, profile_id: e.target.value })}
                  required
                >
                  <option value="">— Seleziona —</option>
                  {profileList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} ({p.download_mbps}/{p.upload_mbps} Mbps)
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Etichetta (descrizione)</span>
                <input
                  value={ruleForm.label}
                  onChange={(e) => setRuleForm({ ...ruleForm, label: e.target.value })}
                  placeholder="Segnale ottimo"
                />
              </label>
              <div className="form-row form-row-2">
                <label className="form-field">
                  <span>Ordine</span>
                  <input
                    type="number" min="0"
                    value={ruleForm.sort_order}
                    onChange={(e) => setRuleForm({ ...ruleForm, sort_order: e.target.value })}
                  />
                </label>
                <label className="form-field form-check">
                  <input
                    type="checkbox"
                    checked={ruleForm.active}
                    onChange={(e) => setRuleForm({ ...ruleForm, active: e.target.checked })}
                  />
                  <span>Attiva</span>
                </label>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={closeRuleForm}>Annulla</button>
                <button type="submit" className="btn btn-primary" disabled={savingRule}>
                  {savingRule ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                  {editingRule ? 'Salva modifiche' : 'Crea regola'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUserForm && (
        <div className="modal-backdrop" onClick={() => setShowUserForm(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Nuovo amministratore</h2>
              <button onClick={() => setShowUserForm(false)} className="icon-btn"><X size={18} /></button>
            </div>
            <form className="bts-form" onSubmit={handleCreateUser}>
              <label className="form-field">
                <span>Email</span>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  placeholder="nuovo.admin@netbee.it"
                />
              </label>
              <label className="form-field">
                <span>Password (min 6 caratteri)</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                />
              </label>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowUserForm(false)}>Annulla</button>
                <button type="submit" className="btn btn-primary" disabled={savingUser}>
                  {savingUser ? <Loader2 size={18} className="spin" /> : <UserPlus size={18} />}
                  Crea account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TechResultCard({ result: r }: { result: CoverageResult }) {
  const lb = r.link_budget;
  const rec = r.recommendation;
  const qColor = r.link_quality === 'good' ? '#16a34a' : r.link_quality === 'marginal' ? '#e29743' : '#dc2626';

  return (
    <div className="admin-tech-card" style={{ borderLeftColor: qColor }}>
      <div className="admin-tech-card-head">
        <h3>{r.bts.name}</h3>
        <span className={`cop-q-tag q-${r.link_quality}`}>{QUALITY_LABELS[r.link_quality]}</span>
      </div>

      <div className="admin-tech-grid">
        <div className="admin-tech-section">
          <h4>Parametri BTS</h4>
          <dl>
            <dt>Distanza</dt><dd>{r.distance_km} km</dd>
            <dt>Entro raggio max</dt><dd>{r.within_max_range ? 'Sì' : 'No'} ({r.bts.max_range_km} km)</dd>
            <dt>Settore antenna</dt><dd>{r.azimuth_ok ? 'OK' : 'Fuori settore'}</dd>
            <dt>Frequenza</dt><dd>{r.bts.frequency_ghz} GHz</dd>
            <dt>Altezza antenna</dt><dd>{r.bts.antenna_height_m} m</dd>
            <dt>TX power</dt><dd>{r.bts.tx_power_dbm} dBm</dd>
            <dt>Guadagno antenna</dt><dd>{r.bts.antenna_gain_dbi} dBi</dd>
            <dt>Sensibilità RX</dt><dd>{r.bts.rx_sensitivity_dbm} dBm</dd>
            <dt>Perdite cavo</dt><dd>{r.bts.cable_loss_db} dB</dd>
          </dl>
        </div>

        {lb ? (
          <div className="admin-tech-section">
            <h4>Link Budget (downlink BTS→CPE)</h4>
            <dl>
              <dt>EIRP</dt><dd>{lb.eirp_dbm} dBm</dd>
              <dt>FSPL</dt><dd>{lb.fspl_db} dB</dd>
              <dt>Altre perdite</dt><dd>{lb.other_losses_db} dB</dd>
              <dt>Potenza ricevuta</dt><dd>{lb.received_power_dbm} dBm</dd>
              <dt>Fade margin</dt><dd style={{ color: lb.fade_margin_db >= 20 ? '#16a34a' : lb.fade_margin_db >= 10 ? '#e29743' : '#dc2626' }}>{lb.fade_margin_db} dB</dd>
              <dt>MCS index</dt><dd>{lb.mcs_index}</dd>
              <dt>Modulazione</dt><dd>{lb.modulation}</dd>
              <dt>Throughput stimato (down)</dt><dd>{lb.estimated_throughput_mbps.down} Mbps</dd>
              <dt>Throughput stimato (up)</dt><dd>{lb.estimated_throughput_mbps.up} Mbps</dd>
            </dl>
          </div>
        ) : (
          <div className="admin-tech-section">
            <h4>Link Budget</h4>
            <p style={{ color: '#94a3b8' }}>Non calcolabile — BTS fuori portata o ostruita</p>
          </div>
        )}

        {lb && (
          <div className="admin-tech-section">
            <h4>Fresnel / LOS</h4>
            <dl>
              <dt>Path clear</dt><dd>{r.path_clear ? 'Sì' : 'No'}</dd>
              <dt>Clearance Fresnel</dt><dd>{lb.fresnel_clearance_m ?? '—'} m</dd>
              <dt>Peggior ostruzione</dt><dd>{lb.worst_obstruction_m !== null ? `${lb.worst_obstruction_m} m` : 'Nessuna'}</dd>
            </dl>
          </div>
        )}

        <div className="admin-tech-section">
          <h4>Profilo consigliato (sito pubblico)</h4>
          {rec.recommended_profile ? (
            <div className="admin-tech-rec">
              <Zap size={16} />
              <div>
                <strong>{rec.recommended_profile.label}</strong>
                <span>{rec.recommended_profile.download_mbps}/{rec.recommended_profile.upload_mbps} Mbps</span>
                <span>
                  {rec.recommended_profile.price_bimonthly.toFixed(2)}€/mese (bim.)
                  {rec.recommended_profile.yearly_enabled && ` · ${rec.recommended_profile.price_yearly.toFixed(2)}€/mese (ann.)`}
                </span>
              </div>
            </div>
          ) : (
            <p style={{ color: '#94a3b8' }}>{rec.reason}</p>
          )}
          <p className="admin-tech-rec-reason">{rec.reason}</p>
        </div>
      </div>
    </div>
  );
}

function Link({ to, className, children }: { to: string; className?: string; children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <a href={to} className={className} onClick={(e) => { e.preventDefault(); navigate(to); }}>
      {children}
    </a>
  );
}
