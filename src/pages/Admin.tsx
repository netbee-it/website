import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon, LatLngExpression, LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Plus, Pencil, Trash2, X, Save, Loader2, Radio, LogOut, MapPin,
  ArrowLeft, AlertCircle, Users, UserPlus, Shield,
} from 'lucide-react';
import { supabase, Bts, BtsInput } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import NetBeeLogo from '../components/NetBeeLogo';

const DEFAULT_CENTER: LatLngExpression = [44.7286, 8.0314];

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

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface FormState {
  name: string;
  lat: string;
  lng: string;
  antenna_height_m: string;
  frequency_ghz: string;
  tx_power_dbm: string;
  azimuth_deg: string;
  tilt_deg: string;
  max_range_km: string;
  active: boolean;
  notes: string;
}

const emptyForm: FormState = {
  name: '', lat: '', lng: '', antenna_height_m: '20', frequency_ghz: '5.6',
  tx_power_dbm: '23', azimuth_deg: '', tilt_deg: '0', max_range_km: '15',
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
    azimuth_deg: f.azimuth_deg.trim() === '' ? null : parseFloat(f.azimuth_deg),
    tilt_deg: parseFloat(f.tilt_deg),
    max_range_km: parseFloat(f.max_range_km),
    active: f.active,
    notes: f.notes.trim() === '' ? null : f.notes.trim(),
  };
}

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
  const [tab, setTab] = useState<'bts' | 'users'>('bts');
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingUser, setSavingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: '/admin' }, replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) loadBts();
  }, [user, loadBts]);

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
                        {b.frequency_ghz}GHz · r={b.max_range_km}km
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
            <MapContainer center={DEFAULT_CENTER} zoom={9} className="admin-map-container">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
              <ClickHandler onClick={pickOnMap} />
              {btsList.map((b) => (
                <Marker key={b.id} position={[b.lat, b.lng]} icon={btsIcon(b.active)}>
                  <Popup>
                    <strong>{b.name}</strong><br />
                    {b.frequency_ghz} GHz · h{b.antenna_height_m}m · r{b.max_range_km}km<br />
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

function Link({ to, className, children }: { to: string; className?: string; children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <a href={to} className={className} onClick={(e) => { e.preventDefault(); navigate(to); }}>
      {children}
    </a>
  );
}

export default Admin