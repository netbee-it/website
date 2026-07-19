import { useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

type BillingType = 'bimestrale' | 'annuale';
type ClientType = 'privati' | 'business';

const privatiPlans = [
  {
    id: 'nbee50',
    name: 'NBEE50',
    download: 50,
    upload: 8,
    bmgDown: 5,
    bmgUp: 3,
    priceBimestrale: 28.0,
    priceAnnuale: 25.75,
    featured: false,
    note: null,
  },
  {
    id: 'nbee100',
    name: 'NBEE100',
    download: 100,
    upload: 16,
    bmgDown: null,
    bmgUp: null,
    priceBimestrale: 34.0,
    priceAnnuale: 31.5,
    featured: true,
    note: null,
  },
  {
    id: 'nbee200',
    name: 'NBEE200',
    download: 200,
    upload: 40,
    bmgDown: null,
    bmgUp: null,
    priceBimestrale: 42.0,
    priceAnnuale: 38.5,
    featured: false,
    note: 'Previa verifica copertura',
  },
];

const businessPlans = [
  {
    id: 'nbee100pro',
    name: 'NBEE100_PRO',
    download: 100,
    upload: 24,
    bmgDown: null,
    bmgUp: null,
    priceBimestrale: 32.0,
    priceAnnuale: 29.5,
    featured: true,
    note: null,
  },
  {
    id: 'nbee200pro',
    name: 'NBEE200_PRO',
    download: 200,
    upload: 50,
    bmgDown: null,
    bmgUp: null,
    priceBimestrale: 49.0,
    priceAnnuale: 38.5,
    featured: false,
    note: 'Previa verifica copertura',
  },
];

function PlanCard({
  plan,
  billing,
}: {
  plan: (typeof privatiPlans)[0];
  billing: BillingType;
}) {
  const price =
    billing === 'bimestrale' ? plan.priceBimestrale : plan.priceAnnuale;
  const contractLabel =
    billing === 'bimestrale' ? 'Contratto bimestrale' : 'Contratto annuale';

  return (
    <div className={`plan-card${plan.featured ? ' featured' : ''}`}>
      {plan.featured && <div className="plan-badge">Più richiesto</div>}
      <div className="plan-name">{plan.name}</div>
      <div className="plan-speed">
        {plan.download} <span>Mbps download</span>
      </div>
      <div className="plan-upload">Upload fino a {plan.upload} Mbps</div>

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
          Download fino a {plan.download} Mbps
        </li>
        <li className="plan-feature">
          <span className="plan-feature-icon">
            <Check size={11} strokeWidth={3} />
          </span>
          Upload fino a {plan.upload} Mbps
        </li>
        {plan.bmgDown && (
          <li className="plan-feature">
            <span className="plan-feature-icon">
              <Check size={11} strokeWidth={3} />
            </span>
            BMG: {plan.bmgDown}/{plan.bmgUp} Mbps
          </li>
        )}
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

      {plan.note && <div className="plan-note">{plan.note}</div>}

      <a href="#contatti" className={`btn ${plan.featured ? 'btn-primary' : 'btn-outline'}`} style={{ marginTop: '8px' }}>
        Attiva ora
        <ArrowRight size={16} />
      </a>
    </div>
  );
}

export default function Plans() {
  const [billing, setBilling] = useState<BillingType>('bimestrale');
  const [clientType, setClientType] = useState<ClientType>('privati');
  const plans = clientType === 'privati' ? privatiPlans : businessPlans;
  const headerRef = useScrollReveal();

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
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} billing={billing} />
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
