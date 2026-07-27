import { useState, useRef, useCallback } from 'react';
import { X, Wifi, Server, Laptop, Smartphone, Camera, Tv, Plus, Trash2, Signal } from 'lucide-react';

type AP = {
  id: number;
  x: number;
  y: number;
  label: string;
};

const FLOOR_W = 600;
const FLOOR_H = 400;
const AP_RADIUS = 130;
const GRID = 20;

const ROOMS = [
  { x: 0, y: 0, w: 350, h: 200, label: 'Soggiorno' },
  { x: 350, y: 0, w: 250, h: 200, label: 'Cucina' },
  { x: 0, y: 200, w: 250, h: 200, label: 'Camera' },
  { x: 250, y: 200, w: 350, h: 200, label: 'Ufficio' },
];

const WALLS = [
  { x1: 350, y1: 0, x2: 350, y2: 200 },
  { x1: 0, y1: 200, x2: 600, y2: 200 },
  { x1: 250, y1: 200, x2: 250, y2: 400 },
];

const CLIENTS = [
  { x: 80, y: 60, icon: <Tv size={16} />, label: 'Smart TV' },
  { x: 280, y: 120, icon: <Laptop size={16} />, label: 'PC' },
  { x: 480, y: 80, icon: <Smartphone size={16} />, label: 'Mobile' },
  { x: 120, y: 320, icon: <Smartphone size={16} />, label: 'Mobile' },
  { x: 420, y: 340, icon: <Camera size={16} />, label: 'Camera IP' },
  { x: 520, y: 260, icon: <Laptop size={16} />, label: 'Laptop' },
];

function signalStrength(ap: AP, px: number, py: number): number {
  const dist = Math.sqrt((ap.x - px) ** 2 + (ap.y - py) ** 2);
  if (dist > AP_RADIUS) return 0;
  return Math.max(0, 1 - dist / AP_RADIUS);
}

function bestSignal(aps: AP[], px: number, py: number): number {
  return aps.reduce((best, ap) => Math.max(best, signalStrength(ap, px, py)), 0);
}

export default function WifiDemo({ onClose }: { onClose: () => void }) {
  const [aps, setAps] = useState<AP[]>([
    { id: 1, x: 175, y: 100, label: 'AP Soggiorno' },
    { id: 2, x: 425, y: 300, label: 'AP Ufficio' },
  ]);
  const [tab, setTab] = useState<'sim' | 'topo'>('sim');
  const floorRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(3);

  const handleFloorClick = useCallback((e: React.MouseEvent) => {
    if (!floorRef.current) return;
    const rect = floorRef.current.getBoundingClientRect();
    const scaleX = FLOOR_W / rect.width;
    const scaleY = FLOOR_H / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX / GRID) * GRID;
    const y = Math.round((e.clientY - rect.top) * scaleY / GRID) * GRID;
    const cx = Math.max(20, Math.min(FLOOR_W - 20, x));
    const cy = Math.max(20, Math.min(FLOOR_H - 20, y));
    setAps((prev) => [
      ...prev,
      { id: nextId.current++, x: cx, y: cy, label: `AP ${nextId.current - 1}` },
    ]);
  }, []);

  const removeAp = (id: number) => setAps((prev) => prev.filter((a) => a.id !== id));

  const coverage = (() => {
    let covered = 0;
    const total = (FLOOR_W / GRID) * (FLOOR_H / GRID);
    for (let x = 0; x < FLOOR_W; x += GRID) {
      for (let y = 0; y < FLOOR_H; y += GRID) {
        if (bestSignal(aps, x, y) > 0.15) covered++;
      }
    }
    return Math.round((covered / total) * 100);
  })();

  const clientsConnected = CLIENTS.filter((c) => bestSignal(aps, c.x, c.y) > 0.15).length;

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
            <h3 className="wifi-modal-title">UniFi Network — Demo Interattiva</h3>
            <p className="wifi-modal-sub">
              Simula la copertura Wi-Fi di una abitazione con access point Ubiquiti UniFi
            </p>
          </div>
        </div>

        <div className="wifi-tabs">
          <button
            className={tab === 'sim' ? 'active' : ''}
            onClick={() => setTab('sim')}
          >
            <Signal size={15} />
            Simulatore Copertura
          </button>
          <button
            className={tab === 'topo' ? 'active' : ''}
            onClick={() => setTab('topo')}
          >
            <Server size={15} />
            Schema di Rete
          </button>
        </div>

        {tab === 'sim' && (
          <div className="wifi-sim">
            <div className="wifi-stats">
              <div className="wifi-stat">
                <span className="wifi-stat-value">{aps.length}</span>
                <span className="wifi-stat-label">Access Point</span>
              </div>
              <div className="wifi-stat">
                <span className="wifi-stat-value">{coverage}%</span>
                <span className="wifi-stat-label">Copertura</span>
              </div>
              <div className="wifi-stat">
                <span className="wifi-stat-value">{clientsConnected}/{CLIENTS.length}</span>
                <span className="wifi-stat-label">Dispositivi coperti</span>
              </div>
            </div>

            <div className="wifi-floor-wrap">
              <div
                ref={floorRef}
                className="wifi-floor"
                onClick={handleFloorClick}
                style={{ width: FLOOR_W, height: FLOOR_H }}
              >
                <svg className="wifi-floor-svg" viewBox={`0 0 ${FLOOR_W} ${FLOOR_H}`}>
                  {ROOMS.map((r) => (
                    <g key={r.label}>
                      <rect
                        x={r.x}
                        y={r.y}
                        width={r.w}
                        height={r.h}
                        fill="rgba(0,0,0,0.02)"
                        stroke="rgba(0,0,0,0.08)"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                      />
                      <text
                        x={r.x + 10}
                        y={r.y + 22}
                        className="wifi-room-label"
                      >
                        {r.label}
                      </text>
                    </g>
                  ))}

                  {WALLS.map((w, i) => (
                    <line
                      key={i}
                      x1={w.x1}
                      y1={w.y1}
                      x2={w.x2}
                      y2={w.y2}
                      stroke="rgba(0,0,0,0.25)"
                      strokeWidth={4}
                      strokeLinecap="round"
                    />
                  ))}

                  <defs>
                    <radialGradient id="covGrad">
                      <stop offset="0%" stopColor="rgba(23,82,199,0.35)" />
                      <stop offset="60%" stopColor="rgba(23,82,199,0.12)" />
                      <stop offset="100%" stopColor="rgba(23,82,199,0)" />
                    </radialGradient>
                  </defs>

                  {aps.map((ap) => (
                    <circle
                      key={`cov-${ap.id}`}
                      cx={ap.x}
                      cy={ap.y}
                      r={AP_RADIUS}
                      fill="url(#covGrad)"
                    />
                  ))}

                  {CLIENTS.map((c, i) => {
                    const sig = bestSignal(aps, c.x, c.y);
                    const connected = sig > 0.15;
                    return (
                      <g key={i}>
                        <circle
                          cx={c.x}
                          cy={c.y}
                          r={14}
                          fill={connected ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.12)'}
                          stroke={connected ? 'var(--success)' : 'var(--error)'}
                          strokeWidth={1.5}
                        />
                      </g>
                    );
                  })}
                </svg>

                {CLIENTS.map((c, i) => {
                  const sig = bestSignal(aps, c.x, c.y);
                  const connected = sig > 0.15;
                  return (
                    <div
                      key={i}
                      className="wifi-client"
                      style={{
                        left: c.x - 12,
                        top: c.y - 12,
                        color: connected ? 'var(--success)' : 'var(--error)',
                      }}
                    >
                      {c.icon}
                    </div>
                  );
                })}

                {aps.map((ap) => (
                  <div
                    key={ap.id}
                    className="wifi-ap-marker"
                    style={{ left: ap.x - 16, top: ap.y - 16 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAp(ap.id);
                    }}
                    title={`${ap.label} — clicca per rimuovere`}
                  >
                    <Wifi size={18} />
                  </div>
                ))}
              </div>

              <div className="wifi-floor-hint">
                <Plus size={14} />
                Clicca sulla piantina per posizionare un access point — clicca su un AP per rimuoverlo
              </div>
            </div>

            {aps.length > 0 && (
              <div className="wifi-ap-list">
                {aps.map((ap) => (
                  <div key={ap.id} className="wifi-ap-item">
                    <span className="wifi-ap-dot" />
                    {ap.label}
                    <button onClick={() => removeAp(ap.id)} className="wifi-ap-remove">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'topo' && (
          <div className="wifi-topo">
            <svg viewBox="0 0 600 420" className="wifi-topo-svg">
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(23,82,199,0.5)" />
                  <stop offset="100%" stopColor="rgba(23,82,199,0.15)" />
                </linearGradient>
              </defs>

              {/* Internet */}
              <line x1="300" y1="70" x2="300" y2="120" stroke="url(#lineGrad)" strokeWidth="2" />
              <line x1="180" y1="195" x2="180" y2="250" stroke="url(#lineGrad)" strokeWidth="2" />
              <line x1="300" y1="195" x2="300" y2="250" stroke="url(#lineGrad)" strokeWidth="2" />
              <line x1="420" y1="195" x2="420" y2="250" stroke="url(#lineGrad)" strokeWidth="2" />
              <line x1="180" y1="310" x2="120" y2="360" stroke="url(#lineGrad)" strokeWidth="2" />
              <line x1="180" y1="310" x2="240" y2="360" stroke="url(#lineGrad)" strokeWidth="2" />
              <line x1="300" y1="310" x2="300" y2="360" stroke="url(#lineGrad)" strokeWidth="2" />
              <line x1="420" y1="310" x2="380" y2="360" stroke="url(#lineGrad)" strokeWidth="2" />
              <line x1="420" y1="310" x2="480" y2="360" stroke="url(#lineGrad)" strokeWidth="2" />

              {/* Internet cloud */}
              <ellipse cx="300" cy="40" rx="50" ry="25" fill="rgba(23,82,199,0.08)" stroke="var(--primary)" strokeWidth="1.5" />
              <text x="300" y="45" textAnchor="middle" className="wifi-topo-label">Internet</text>

              {/* Gateway */}
              <rect x="250" y="120" width="100" height="55" rx="10" fill="rgba(23,82,199,0.06)" stroke="var(--primary)" strokeWidth="1.5" />
              <text x="300" y="145" textAnchor="middle" className="wifi-topo-name">UniFi Gateway</text>
              <text x="300" y="162" textAnchor="middle" className="wifi-topo-sub">Dream Machine</text>

              {/* Switch */}
              <rect x="130" y="250" width="340" height="50" rx="8" fill="rgba(23,82,199,0.04)" stroke="rgba(23,82,199,0.4)" strokeWidth="1.5" />
              <text x="300" y="280" textAnchor="middle" className="wifi-topo-name">UniFi Switch PoE</text>

              {/* Access Points */}
              {[180, 300, 420].map((cx, i) => (
                <g key={i}>
                  <circle cx={cx} cy={310} r="22" fill="rgba(22,163,74,0.1)" stroke="var(--success)" strokeWidth="1.5" />
                  <text x={cx} y="315" textAnchor="middle" className="wifi-topo-ap">AP {i + 1}</text>
                </g>
              ))}

              {/* Clients */}
              {[
                { x: 120, label: 'TV' },
                { x: 240, label: 'PC' },
                { x: 300, label: 'Mobile' },
                { x: 380, label: 'Cam' },
                { x: 480, label: 'Laptop' },
              ].map((c, i) => (
                <g key={i}>
                  <rect x={c.x - 25} y="360" width="50" height="36" rx="6" fill="rgba(100,116,139,0.08)" stroke="rgba(100,116,139,0.3)" strokeWidth="1" />
                  <text x={c.x} y="383" textAnchor="middle" className="wifi-topo-client">{c.label}</text>
                </g>
              ))}
            </svg>

            <div className="wifi-topo-legend">
              <div className="wifi-topo-legend-item">
                <span className="wifi-topo-legend-dot primary" />
                UniFi Gateway — router, firewall e controller
              </div>
              <div className="wifi-topo-legend-item">
                <span className="wifi-topo-legend-dot blue" />
                UniFi Switch PoE — alimenta gli access point
              </div>
              <div className="wifi-topo-legend-item">
                <span className="wifi-topo-legend-dot green" />
                Access Point UniFi — copertura Wi-Fi
              </div>
              <div className="wifi-topo-legend-item">
                <span className="wifi-topo-legend-dot gray" />
                Dispositivi connessi — TV, PC, camere, mobile
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
