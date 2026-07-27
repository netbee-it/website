import { X, Wifi, Server, Smartphone, Tv, Camera, Laptop, Radio, Shield, Gauge, Users, ArrowRight, Check } from 'lucide-react';

const FEATURES = [
  {
    icon: <Radio size={22} />,
    title: 'Copertura senza zone morte',
    desc: 'Più access point si coordinano per coprire ogni stanza, il giardino, il garage. Niente più angoli senza segnale.',
  },
  {
    icon: <ArrowRight size={22} />,
    title: 'Roaming fluido',
    desc: 'Passi da una stanza all\'altra senza scollegarti: il dispositivo salta automaticamente all\'AP più vicino, come col cellulare tra ripetitori.',
  },
  {
    icon: <Gauge size={22} />,
    title: 'Performance sempre alte',
    desc: 'Ogni access point gestisce centinaia di dispositivi contemporaneamente senza rallentamenti, anche con la famiglia tutta online.',
  },
  {
    icon: <Users size={22} />,
    title: 'Rete ospiti separata',
    desc: 'Una rete dedicata per visitatori e clienti, isolata dalla rete principale. Ideale per uffici, negozi e strutture ricettive.',
  },
  {
    icon: <Shield size={22} />,
    title: 'Sicurezza integrata',
    desc: 'Firewall, filtri e protezione minacce attivi per impostazione. I tuoi dati e dispositivi restano al sicuro.',
  },
  {
    icon: <Smartphone size={22} />,
    title: 'Gestione da app',
    desc: 'Vedi chi è connesso, blocchi dispositivi, crei reti temporanee e monitori le prestazioni direttamente dal telefono.',
  },
];

const TOPOLOGY = [
  {
    icon: <Server size={20} />,
    label: 'Gateway UniFi',
    sub: 'Router, firewall e controller',
    color: 'primary',
  },
  {
    icon: <Server size={20} />,
    label: 'Switch PoE',
    sub: 'Alimenta e collega gli access point',
    color: 'blue',
  },
  {
    icon: <Wifi size={20} />,
    label: 'Access Point',
    sub: 'Copertura Wi-Fi in ogni stanza',
    color: 'green',
  },
];

const CLIENTS = [
  { icon: <Tv size={18} />, label: 'Smart TV' },
  { icon: <Laptop size={18} />, label: 'PC' },
  { icon: <Smartphone size={18} />, label: 'Mobile' },
  { icon: <Camera size={18} />, label: 'Camera IP' },
  { icon: <Laptop size={18} />, label: 'Laptop' },
  { icon: <Smartphone size={18} />, label: 'Tablet' },
];

export default function WifiDemo({ onClose }: { onClose: () => void }) {
  return (
    <div className="wifi-modal-overlay" onClick={onClose}>
      <div className="wifi-modal" onClick={(e) => e.stopPropagation()}>
        <button className="wifi-modal-close" onClick={onClose} aria-label="Chiudi">
          <X size={20} />
        </button>

        <div className="wifi-modal-header">
          <div className="wifi-modal-icon">
            <Wifi size={22} />
          </div>
          <div>
            <h3 className="wifi-modal-title">Come funziona il WiFi Professionale</h3>
            <p className="wifi-modal-sub">
              Il sistema Ubiquiti UniFi che installiamo, spiegato semplice
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
              <div className="wifi-topo-clients-line" />
              {CLIENTS.map((c, i) => (
                <div key={i} className="wifi-topo-client-chip">
                  <span className="wifi-topo-client-icon">{c.icon}</span>
                  {c.label}
                </div>
              ))}
            </div>
            <p className="wifi-topo-caption">
              Un unico sistema gestisce Internet, la rete cablata e il Wi-Fi.
              Gli access point si parlano tra loro per darti segnale ovunque.
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
                Un solo sistema, gestito da app, niente più router scadenti del gestore
              </div>
              <div className="wifi-summary-item">
                <Check size={16} />
                Segnale stabile in ogni stanza, anche all\'aperto
              </div>
              <div className="wifi-summary-item">
                <Check size={16} />
                Rete ospiti, controllo genitori, sicurezza attiva
              </div>
              <div className="wifi-summary-item">
                <Check size={16} />
                Espandibile nel tempo: aggiungi AP dove serve, senza cambiare tutto
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
