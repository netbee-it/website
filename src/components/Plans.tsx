import { useState, useEffect } from 'react';
import { Check, ArrowRight, Loader2 } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { supabase, ServiceProfile } from '../lib/supabase';

type BillingType = 'bimestrale' | 'annuale';
type ClientType = 'privati' | 'business';

function PlanCard({
  profile,
  billing,
}: {
  profile: ServiceProfile;
  billing: BillingType;
}) {
  const price =
    billing === 'bimestrale'
      ? profile.price_bimonthly
      : profile.yearly_enabled
        ? profile.price_yearly
        : profile.price_bimonthly;
  const contractLabel =
    billing === 'bimestrale' ? 'Contratto bimestrale' : 'Contratto annuale';

  return (
    <div className="plan-card">
      <div className="plan-name">{profile.label}</div>
      <div className="plan-speed">
        {profile.download_mbps} <span>Mbps download</span>
      </div>
      <div className="plan-upload">Upload fino a {profile.upload_mbps} Mbps</div>

      <div className="plan-price">
        <span className="plan-price-amount">{price.toFixed(2).replace('.', ',')}€</span>
        <span className="plan-price-period">/mese</span>
      </div>
      <div className="plan-price-note">{contractLabel} · IVA compresa</div>

      <div className="plan-divider" />

      <ul className="plan-features">
        <li className="plan-feature">
          <span className="plan-feature-icon">
            <Check size={11} strokeWidth={3} />
          </span>
          Download fino a {profile.download_mbps} Mbps
        </li>
        <li className="plan-feature">
          <span className="plan-feature-icon">
            <Check size={11} strokeWidth={3} />
          </span>
          Upload fino a {profile.upload_mbps} Mbps
        </li>
        <li className="plan-feature">
          <span className="plan-feature-icon">
            <Check size={11} strokeWidth={3} />
          </span>
          Router Wi-Fi 6 incluso
        </li>
        <li className="plan-feature">
          <span className="plan-feature-icon">
            <Check size={11} strokeWidth={3} />
          </span>
          Assistenza tecnica dedicata
        </li>
      </ul>

      {profile.requires_coverage_check && (
        <div className="plan-note">Previa verifica copertura</div>
      )}

      <a href="#contatti" className="btn btn-outline" style={{ marginTop: '8px' }}>
        Attiva ora
        <ArrowRight size={16} />
      </a>
    </div>
  );
}

export default function Plans() {
  const [billing, setBilling] = useState<BillingType>('bimestrale');
  const [clientType, setClientType] = useState<ClientType>('privati');
  const [profiles, setProfiles] = useState<ServiceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const headerRef = useScrollReveal();

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('service_profiles')
        .select('*')
        .eq('active', true)
        .order('sort_order');
      if (!error) setProfiles((data ?? []) as ServiceProfile[]);
      setLoading(false);
    };
    load();
  }, []);

  const hasYearly = profiles.some((p) => p.yearly_enabled);
  const filtered = profiles.filter((p) => p.category === clientType);

  if (loading) {
    return (
      <section id="internet" className="plans-section">
        <div className="container">
          <div className="admin-empty">
            <Loader2 size={28} className="spin" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="internet" className="plans-section">
      <div className="container">
        <div ref={headerRef} className="plans-header reveal">
          <span className="section-badge">Connettività Internet</span>
          <h2 className="section-title">Piani FWA Radio</h2>
          <p className="section-subtitle">
            Internet ad alta velocità via radio per la tua casa o attività.
            Nessuna infrastruttura cablata richiesta.
          </p>

          {hasYearly && (
            <div style={{ marginTop: '32px' }}>
              <div className="billing-toggle">
                <button
                  className={billing === 'bimestrale' ? 'active' : ''}
                  onClick={() => setBilling('bimestrale')}
                >
                  Bimestrale
                </button>
                <button
                  className={billing === 'annuale' ? 'active' : ''}
                  onClick={() => setBilling('annuale')}
                >
                  Annuale
                </button>
              </div>
              {billing === 'annuale' && (
                <p className="billing-save">Risparmia fino al 10% con il contratto annuale</p>
              )}
            </div>
          )}
        </div>

        <div className="plans-tabs">
          <button
            className={`plans-tab${clientType === 'privati' ? ' active' : ''}`}
            onClick={() => setClientType('privati')}
          >
            Privati
          </button>
          <button
            className={`plans-tab${clientType === 'business' ? ' active' : ''}`}
            onClick={() => setClientType('business')}
          >
            Small Business
          </button>
        </div>

        <div className="plans-grid">
          {filtered.map((profile) => (
            <PlanCard key={profile.id} profile={profile} billing={billing} />
          ))}
        </div>

        <div className="plans-enterprise">
          <div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Aziende &amp; Pubblica Amministrazione
            </div>
            <div className="plans-enterprise-title">
              Hai esigenze particolari?
            </div>
            <p className="plans-enterprise-sub">
              Per aziende strutturate e Pubblica Amministrazione offriamo soluzioni
              dedicate con SLA garantiti, IP pubblici statici e assistenza prioritaria.
            </p>
          </div>
          <div className="plans-enterprise-actions">
            <a href="#contatti" className="btn btn-white">
              Richiedi Preventivo
              <ArrowRight size={16} />
            </a>
            <a href="#contatti" className="btn btn-ghost-white">
              Contattaci
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
