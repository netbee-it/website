import { useState, FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Radio, ArrowLeft, Lock, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NetBeeLogo from '../components/NetBeeLogo';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/admin';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-back">
          <ArrowLeft size={16} /> Torna al sito
        </Link>

        <div className="auth-logo">
          <NetBeeLogo height={56} variant="dark" />
        </div>

        <div className="auth-icon-wrap">
          <Radio size={26} />
        </div>

        <h1 className="auth-title">Area Amministrazione</h1>
        <p className="auth-subtitle">
          Accedi per gestire le stazioni BTS e gli utenti del network FWA.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span className="auth-field-label">Email</span>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@netbee.it"
              />
            </div>
          </label>

          <label className="auth-field">
            <span className="auth-field-label">Password</span>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            {loading && <Loader2 size={18} className="spin" />}
            Accedi
          </button>
        </form>

        <p className="auth-help">
          Non hai un account? Contatta un amministratore esistente per fartene creare uno.
        </p>
      </div>
    </div>
  );
}
