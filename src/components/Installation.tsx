import { Check, X, ArrowRight } from 'lucide-react';

const included = [
  'Montaggio antenna FWA',
  'Fissaggio su parete, balcone o palo TV esistente',
  'Posa cavo di rete (lunghezza illimitata, fino alla prima presa)',
  'Router Wi-Fi 6 AX1800 Keenetic Sprinter SE incluso',
];

const excluded = [
  "Installazione pali dedicati per l'antenna",
  "Posa di tubazioni o canaline esterne",
];

export default function Installation() {
  return (
    <section id="installazione" className="installation-section">
      <div className="container">
        <div className="installation-header">
          <span className="section-badge accent">Installazione</span>
          <h2 className="section-title">Installazione FWA Radio</h2>
          <p className="section-subtitle">
            Scelta tra due opzioni di installazione, incluso router Wi-Fi 6 AX1800
            Keenetic Sprinter SE.
          </p>
        </div>

        <div className="installation-grid">
          {/* Standard */}
          <div className="install-card standard">
            <div className="install-label">Opzione Standard</div>
            <div className="install-price">190€</div>
            <div className="install-price-sub">Pagamento unico</div>
            <div className="install-vincolo">
              <Check size={13} strokeWidth={3} />
              Nessun vincolo contrattuale
            </div>

            <div className="install-features-title">Cosa è compreso</div>
            <ul className="install-list">
              {included.map((item, i) => (
                <li key={i} className="install-list-item">
                  <Check className="install-icon-check" size={18} strokeWidth={2.5} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="install-exclusions-title">Non compreso</div>
            <ul className="install-list">
              {excluded.map((item, i) => (
                <li key={i} className="install-list-item">
                  <X className="install-icon-x" size={18} strokeWidth={2} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <a href="#contatti" className="btn btn-primary" style={{ marginTop: '24px' }}>
              Scegli Standard
              <ArrowRight size={16} />
            </a>
          </div>

          {/* Promo */}
          <div className="install-card promo">
            <div style={{
              position: 'absolute',
              top: '-14px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--accent)',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700,
              padding: '4px 16px',
              borderRadius: '100px',
              whiteSpace: 'nowrap',
            }}>
              Risparmia 91€
            </div>
            <div className="install-label">Opzione Promo</div>
            <div className="install-price">99€</div>
            <div className="install-price-sub">Pagamento unico</div>
            <div className="install-vincolo">
              Con vincolo contrattuale di 24 mesi
            </div>

            <div className="install-features-title">Cosa è compreso</div>
            <ul className="install-list">
              {included.map((item, i) => (
                <li key={i} className="install-list-item">
                  <Check className="install-icon-check" size={18} strokeWidth={2.5} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="install-exclusions-title">Non compreso</div>
            <ul className="install-list">
              {excluded.map((item, i) => (
                <li key={i} className="install-list-item">
                  <X className="install-icon-x" size={18} strokeWidth={2} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <a href="#contatti" className="btn btn-white" style={{ marginTop: '24px' }}>
              Scegli Promo
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
