import { Phone, MapPin, Mail, ArrowRight } from 'lucide-react';

export default function Contact() {
  return (
    <section id="contatti" className="contact-section">
      <div className="container">
        <div className="contact-inner">
          <div className="contact-text">
            <span className="section-badge">Contatti</span>
            <h2 className="section-title">Parliamo del tuo progetto</h2>
            <p className="section-subtitle">
              Siamo a tua disposizione per sopralluoghi, preventivi e consulenze
              tecniche. Contattaci per trovare la soluzione più adatta alle tue
              esigenze.
            </p>

            <div className="contact-items">
              <div className="contact-item">
                <div className="contact-item-icon">
                  <Phone size={20} />
                </div>
                <div>
                  <div className="contact-item-label">Telefono</div>
                  <div className="contact-item-value">
                    <a href="tel:+39 01411745884">+39 0141 1745884</a>
                  </div>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-item-icon">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="contact-item-label">Email</div>
                  <div className="contact-item-value">
                    <a href="mailto:amministrazione@netbee.it">
                      amministrazione@netbee.it
                    </a>
                  </div>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-item-icon">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="contact-item-label">Sede</div>
                  <div className="contact-item-value">
                    Via Ottavio Riccadonna, 131<br />
                    Canelli (AT) – 14053
                  </div>
                </div>
              </div>
            </div>

            <a href="mailto:amministrazione@netbee.it" className="btn btn-primary btn-lg">
              Invia un messaggio
              <ArrowRight size={18} />
            </a>
          </div>

          <div className="contact-map-placeholder">
            <div className="contact-map-icon">
              <MapPin size={32} />
            </div>
            <div className="contact-map-address">
              Via Ottavio Riccadonna, 131
            </div>
            <div className="contact-map-city">
              Canelli (AT) – 14053
            </div>
            <a
              href="https://maps.google.com/?q=Via+Ottavio+Riccadonna+131+Canelli+AT"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{ marginTop: '8px' }}
            >
              Apri in Maps
              <ArrowRight size={15} />
            </a>
            <div className="contact-roc">
              N. iscrizione ROC 36441
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
