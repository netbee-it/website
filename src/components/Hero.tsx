import { ArrowRight, Clock, Wifi, Shield, Phone } from 'lucide-react';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-grid" />
      <div className="container">
        <div className="hero-content">
          <div className="hero-pills">
            <span className="hero-pill">
              <span className="hero-pill-dot" />
              Internet FWA Radio
            </span>
            <span className="hero-pill">
              <span className="hero-pill-dot" />
              WiFi Professionale
            </span>
            <span className="hero-pill">
              <span className="hero-pill-dot" />
              Videosorveglianza
            </span>
            <span className="hero-pill">
              <span className="hero-pill-dot" />
              Telefonia VoIP
            </span>
          </div>

          <h1 className="hero-title">
            Connettività professionale<br />
            per <span className="hero-title-accent">privati e aziende</span>
          </h1>

          <p className="hero-subtitle">
            Internet FWA ad alta velocità, reti WiFi su misura, fibra ottica,
            videosorveglianza intelligente e telefonia VoIP. NetBee porta la
            tecnologia dove serve, nel Monferrato e in provincia di Asti.
          </p>

          <div className="hero-cta">
            <a href="#internet" className="btn btn-white btn-lg">
              Scopri i Piani
              <ArrowRight size={18} />
            </a>
            <a href="#servizi" className="btn btn-ghost-white btn-lg">
              I Nostri Servizi
            </a>
          </div>

          <div className="hero-coverage-notice">
            <Clock size={15} />
            Verifica Copertura — Prossimamente disponibile
          </div>

          <div className="hero-features">
            <div className="hero-feature">
              <div className="hero-feature-value">
                <Wifi size={28} color="#E29743" />
              </div>
              <div className="hero-feature-label">Fino a 200 Mbps</div>
            </div>
            <div className="hero-feature">
              <div className="hero-feature-value">
                <Shield size={28} color="#E29743" />
              </div>
              <div className="hero-feature-label">Nessun vincolo<br />disponibile</div>
            </div>
            <div className="hero-feature">
              <div className="hero-feature-value">
                <Phone size={28} color="#E29743" />
              </div>
              <div className="hero-feature-label">Supporto<br />dedicato</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
