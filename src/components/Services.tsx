import { Wifi, Cable, Zap, Camera, Phone, Check, Building2, Home } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

const voipAddons = [
  { label: 'Numero VoIP', price: '6€/mese' },
  { label: 'Attivazione nuovo numero', price: '10€ una tantum' },
  { label: 'Portabilità numero', price: '25€ una tantum' },
  { label: 'IP Pubblico Statico', price: '5€/mese' },
];

const services = [
  {
    id: 'wifi',
    icon: <Wifi size={26} />,
    iconClass: 'blue',
    title: 'WiFi Professionale',
    desc: 'Progettiamo e realizziamo impianti Wi-Fi per abitazioni, uffici, negozi, capannoni e strutture ricettive. Soluzioni Ubiquiti UniFi e Keenetic per prestazioni elevate e copertura stabile.',
    features: [
      'Analisi tecnica degli ambienti e studio copertura ottimale',
      'Installazione access point e controller centralizzato',
      'Reti guest, VLAN, controllo accessi e hotspot',
      'Dal piccolo appartamento al grande magazzino',
      'Scalabilità e sicurezza garantite',
    ],
  },
  {
    id: 'cablaggio',
    icon: <Cable size={26} />,
    iconClass: 'cyan',
    title: 'Cablaggio Strutturato',
    desc: 'Impianti di cablaggio strutturato per abitazioni, uffici, negozi e ambienti industriali. Installazione ordinata, affidabile e pronta per supportare qualsiasi tipo di rete.',
    features: [
      'Cavi Ethernet Cat.6 / Cat.6A / Cat.7',
      'Terminazioni su patch panel, prese a muro e armadi rack',
      'Etichettatura e test di funzionamento',
      'Certificazione impianto disponibile su richiesta',
    ],
  },
  {
    id: 'fibra',
    icon: <Zap size={26} />,
    iconClass: 'orange',
    title: 'Fibra Ottica',
    desc: 'Interventi su reti in fibra ottica monomodale e multimodale in contesti aziendali e residenziali. Precisione, ordine e performance elevate.',
    features: [
      'Posa e giunzione di fibre ottiche',
      'Cassetti ottici, box e distribuzioni FTTH',
      'Terminazioni SC/LC e altri standard',
      'Misurazioni, test di continuità e attenuazione',
      'Certificazione impianto su richiesta',
    ],
  },
  {
    id: 'voip',
    icon: <Phone size={26} />,
    iconClass: 'green',
    title: 'Telefonia VoIP',
    desc: 'Centralini VoIP professionali in cloud, self-hosting o on-premise. Telefoni cordless DECT e IP da scrivania per ogni esigenza aziendale.',
    features: [
      'Centralino: gestione interni, code, IVR multilivello',
      'Segreteria personalizzata con inoltro via email',
      'Integrazione con qualunque operatore SIP trunk',
      'Telefoni cordless DECT con roaming automatico',
      'Telefoni IP da scrivania con audio HD e PoE',
    ],
    addons: true,
  },
];

function ServiceCard({ service, delay }: { service: (typeof services)[0]; delay: number }) {
  const ref = useScrollReveal();
  return (
    <div
      ref={ref}
      className="service-card reveal"
      style={{ transitionDelay: `${delay * 0.1}s` }}
    >
      <div className={`service-icon-wrap ${service.iconClass}`}>
        {service.icon}
      </div>
      <h3 className="service-title">{service.title}</h3>
      <p className="service-desc">{service.desc}</p>
      <ul className="service-features">
        {service.features.map((f, i) => (
          <li key={i} className="service-feature">
            <Check size={14} className="service-check" strokeWidth={2.5} />
            {f}
          </li>
        ))}
      </ul>
      {service.addons && (
        <div className="voip-addons" style={{ borderTopColor: 'var(--border)' }}>
          <div className="voip-addons-title" style={{ color: 'var(--text-secondary)' }}>
            Opzioni aggiuntive
          </div>
          <div className="voip-addon-list">
            {voipAddons.map((a) => (
              <div key={a.label} className="voip-addon-item" style={{ color: 'var(--text-secondary)' }}>
                <span>{a.label}</span>
                <span className="voip-addon-price" style={{ color: 'var(--accent-dark)' }}>
                  {a.price}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Services() {
  const headerRef = useScrollReveal();
  const cctvRef = useScrollReveal();

  return (
    <section id="servizi" className="services-section">
      <div className="container">
        <div ref={headerRef} className="services-header reveal">
          <span className="section-badge">Servizi</span>
          <h2 className="section-title">Tutto quello di cui hai bisogno</h2>
          <p className="section-subtitle">
            Soluzioni complete per la connettività, la sicurezza e la comunicazione
            di privati, aziende e Pubblica Amministrazione.
          </p>
        </div>

        <div className="services-grid">
          {services.map((service, i) => (
            <ServiceCard key={service.id} service={service} delay={i + 1} />
          ))}

          {/* Featured: Videosorveglianza */}
          <div
            ref={cctvRef}
            className="service-card featured-service reveal"
            style={{ transitionDelay: '0.5s' }}
          >
            <div className="service-icon-wrap white">
              <Camera size={26} />
            </div>
            <h3 className="service-title">Videosorveglianza Professionale</h3>
            <p className="service-desc">
              Tecnologia intelligente per la tua sicurezza, ovunque serva. Impianti
              scalabili con IA integrata, controllo remoto e piena conformità
              normativa GDPR.
            </p>

            <div className="service-cctv-grid">
              <div className="service-cctv-block">
                <h4>
                  <Home size={14} />
                  Privati e Business
                </h4>
                <ul className="service-features">
                  {[
                    'Telecamere IP HD fino a 4K con visione notturna',
                    'IA: riconoscimento persone e movimenti reali',
                    'Notifiche intelligenti, zero falsi allarmi',
                    'Controllo remoto da smartphone, tablet o PC',
                    'Registrazione locale continua o su evento',
                  ].map((f, i) => (
                    <li key={i} className="service-feature">
                      <Check size={14} className="service-check" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="service-cctv-block">
                <h4>
                  <Building2 size={14} />
                  Pubblica Amministrazione
                </h4>
                <ul className="service-features">
                  {[
                    'Telecamere HD con zoom ottico e ottica panoramica',
                    'Lettura targhe automatica (es. Traffic Scanner)',
                    'Monitoraggio continuo stato dispositivi',
                    'Accesso multi-utente con livelli di autorizzazione',
                    'Supporto GDPR, DPIA, cartellonistica e privacy',
                  ].map((f, i) => (
                    <li key={i} className="service-feature">
                      <Check size={14} className="service-check" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="voip-addons">
              <div className="voip-addons-title">Servizio completo incluso</div>
              <div className="voip-addon-list">
                {[
                  'Sopralluogo e consulenza tecnica',
                  'Progetto personalizzato',
                  'Installazione pulita e ordinata',
                  'Formazione e supporto',
                ].map((item) => (
                  <div key={item} className="voip-addon-item">
                    <Check size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
