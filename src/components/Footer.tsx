import { Phone, MapPin, Mail } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <a href="#" className="footer-logo">
              <span className="logo-net">NET</span>
              <span className="logo-bee">BEE</span>
            </a>
            <p className="footer-brand-desc">
              Connettività FWA radio, reti WiFi professionali, fibra ottica,
              videosorveglianza e telefonia VoIP. Il partner tecnologico di
              fiducia nel Monferrato e in provincia di Asti.
            </p>
            <div className="footer-contact-items">
              <a href="tel:+3901411745884" className="footer-contact-item">
                <Phone size={14} />
                +39 0141 1745884
              </a>
              <a href="mailto:amministrazione@netbee.it" className="footer-contact-item">
                <Mail size={14} />
                amministrazione@netbee.it
              </a>
              <span className="footer-contact-item">
                <MapPin size={14} />
                Via Ottavio Riccadonna, 131 – Canelli (AT) 14053
              </span>
            </div>
          </div>

          <div>
            <div className="footer-col-title">Servizi</div>
            <ul className="footer-links">
              <li><a href="#internet">Internet FWA</a></li>
              <li><a href="#installazione">Installazione FWA</a></li>
              <li><a href="#servizi">WiFi Professionale</a></li>
              <li><a href="#servizi">Cablaggio Strutturato</a></li>
              <li><a href="#servizi">Fibra Ottica</a></li>
              <li><a href="#servizi">Videosorveglianza</a></li>
              <li><a href="#servizi">Telefonia VoIP</a></li>
            </ul>
          </div>

          <div>
            <div className="footer-col-title">Piani Internet</div>
            <ul className="footer-links">
              <li><a href="#internet">NBEE50 – Privati</a></li>
              <li><a href="#internet">NBEE100 – Privati</a></li>
              <li><a href="#internet">NBEE200 – Privati</a></li>
              <li><a href="#internet">NBEE100_PRO – Business</a></li>
              <li><a href="#internet">NBEE200_PRO – Business</a></li>
              <li><a href="#contatti">Aziende – Preventivo</a></li>
              <li><a href="#contatti">PA – Preventivo</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="footer-bottom-text">
            © {year} NetBee · N. iscrizione ROC 36441 · Canelli (AT)
          </span>
          <span className="footer-bottom-text">
            Tutti i prezzi sono IVA compresa
          </span>
        </div>
      </div>
    </footer>
  );
}
