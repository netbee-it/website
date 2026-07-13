import { Wifi, Cable, Zap, Camera, Phone, Check, Building2, Home } from 'lucide-react';

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
    featured: false,
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
    featured: false,
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
    featured: false,
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
      'IP Pubblico Statico disponibile (+5€/mese)',
    ],
    featured: false,
  },
  {
    id: 'cctv',
    icon: <Camera size={26} />,
    iconClass: 'white',
    title: 'Videosorveglianza',
    desc: 'Dalla casa privata al centro urbano, soluzioni di videosorveglianza affidabili con IA integrata. Impianti scalabili e conformi GDPR.',
    features: [],
    featured: true,
  },
];

export default function Services() {
  return (
    <section id="servizi" className="services-section">
      <div className="container">
        <div className="services-header">
          <span className="section-badge">Servizi</span>
          <h2 className="section-title">Tutto quello di cui hai bisogno</h2>
          <p className="section-subtitle">
            Soluzioni complete per la connettività, la sicurezza e la comunicazione
            di privati, aziende e Pubblica Amministrazione.
          </p>
        </div>

        <div className="services-grid">
          {/* Regular services */}
          {services.filter((s) => !s.featured).map((service) => (
            <div key={service.id} className="service-card">
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
            </div>
          ))}

          {/* Featured: Videosorveglianza — full-width card */}
          <div className="service-card featured-service">
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
          </div>
        </div>
      </div>
    </section>
  );
}
