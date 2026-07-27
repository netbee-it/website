import { X, Camera, Shield, Eye, Bell, Smartphone, HardDrive, Wifi, Moon, Sun, PersonStanding, Car, Check, ArrowRight, Video } from 'lucide-react';

const FEATURES = [
  {
    icon: <Eye size={22} />,
    title: 'Riconosce persone e veicoli',
    desc: 'La telecamera distingue una persona da un animale, un veicolo da un\'ombra. Notifiche pertinenti, niente falsi allarmi.',
  },
  {
    icon: <Bell size={22} />,
    title: 'Avvisi sul telefono',
    desc: 'Ricevi una notifica istantanea quando rileva un movimento reale. Decidi tu cosa segnalare: persone, veicoli, o entrambi.',
  },
  {
    icon: <Moon size={22} />,
    title: 'Visione notturna sempre nitida',
    desc: 'Con visione IR integrata le telecamere vedono anche al buio totale, con immagini chiare a qualsiasi ora.',
  },
  {
    icon: <Smartphone size={22} />,
    title: 'Controlli da app',
    desc: 'Vedi le telecamere in diretta, rivedi le registrazioni, scarica un filmato: tutto dall\'app, ovunque tu sia.',
  },
  {
    icon: <HardDrive size={22} />,
    title: 'Registrazione locale sicura',
    desc: 'I filmati restano su un recorder in casa o in azienda, non su server di terzi. I tuoi dati restano tuoi.',
  },
  {
    icon: <Shield size={22} />,
    title: 'Privacy e GDPR',
    desc: 'Cartellonistica, configurazione e gestione dei dati conformi alla normativa. Per privati, aziende e PA.',
  },
];

const TOPOLOGY = [
  {
    icon: <Wifi size={20} />,
    label: 'UniFi Network',
    sub: 'Rete e alimentazione delle telecamere',
    color: 'primary',
  },
  {
    icon: <HardDrive size={20} />,
    label: 'UniFi Network Video',
    sub: 'Recorder centrale per le registrazioni',
    color: 'blue',
  },
  {
    icon: <Camera size={20} />,
    label: 'Telecamere UniFi',
    sub: 'In ogni punto strategico',
    color: 'green',
  },
];

const SCENARIOS = [
  {
    icon: <PersonStanding size={18} />,
    label: 'Rilevamento persona',
    desc: 'Notifica quando una persona entra in un\'area definita',
  },
  {
    icon: <Car size={18} />,
    label: 'Lettura targhe',
    desc: 'Riconosce e registra le targhe dei veicoli in transito',
  },
  {
    icon: <Sun size={18} />,
    label: 'Visione diurna',
    desc: 'Dettagli nitidi anche in controluce grazie all\'HDR',
  },
  {
    icon: <Moon size={18} />,
    label: 'Visione notturna',
    desc: 'Infrarossi integrati per vedere al buio completo',
  },
];

export default function CctvDemo({ onClose }: { onClose: () => void }) {
  return (
    <div className="wifi-modal-overlay" onClick={onClose}>
      <div className="wifi-modal" onClick={(e) => e.stopPropagation()}>
        <button className="wifi-modal-close" onClick={onClose} aria-label="Chiudi">
          <X size={20} />
        </button>

        <div className="wifi-modal-header">
          <div className="wifi-modal-icon">
            <Video size={22} />
          </div>
          <div>
            <h3 className="wifi-modal-title">Come funziona la Videosorveglianza</h3>
            <p className="wifi-modal-sub">
              Il sistema Ubiquiti UniFi Protect che installiamo, spiegato semplice
            </p>
          </div>
        </div>

        <div className="wifi-showcase">
          {/* Topology diagram */}
          <div className="wifi-topo-showcase">
            <div className="wifi-topo-chain">
              {TOPOLOGY.map((node, i) => (
                <div key={i} className="wifi-topo-node-wrap">
                  <div className={`wifi-topo-node wifi-topo-node-${node.color}`}>
                    {node.icon}
                  </div>
                  <span className="wifi-topo-node-label">{node.label}</span>
                  <span className="wifi-topo-node-sub">{node.sub}</span>
                  {i < TOPOLOGY.length - 1 && (
                    <div className="wifi-topo-connector">
                      <ArrowRight size={18} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="wifi-topo-clients">
              {SCENARIOS.map((s, i) => (
                <div key={i} className="wifi-topo-client-chip">
                  <span className="wifi-topo-client-icon">{s.icon}</span>
                  {s.label}
                </div>
              ))}
            </div>
            <p className="wifi-topo-caption">
              Le telecamere si collegano alla rete UniFi e registrano su un recorder locale.
              Vedi tutto dall'app, con notifiche intelligenti che filtrano i falsi allarmi.
            </p>
          </div>

          {/* Features grid */}
          <div className="wifi-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="wifi-feature-card">
                <div className="wifi-feature-icon">{f.icon}</div>
                <h4 className="wifi-feature-title">{f.title}</h4>
                <p className="wifi-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="wifi-summary">
            <div className="wifi-summary-title">In sintesi</div>
            <div className="wifi-summary-items">
              <div className="wifi-summary-item">
                <Check size={16} />
                Telecamere che riconoscono persone e veicoli, non solo movimento
              </div>
              <div className="wifi-summary-item">
                <Check size={16} />
                Notifiche sul telefono, solo per eventi reali
              </div>
              <div className="wifi-summary-item">
                <Check size={16} />
                Registrazione locale: i filmati restano da te, non in cloud
              </div>
              <div className="wifi-summary-item">
                <Check size={16} />
                Tutto dall'app, in diretta e in registrazione, giorno e notte
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
