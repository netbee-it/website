import { Check, X, ArrowRight } from 'lucide-react';
import { ServiceProfile } from '../lib/supabase';

type BillingType = 'bimestrale' | 'annuale';

function priceFor(profile: ServiceProfile, billing: BillingType): number {
  return billing === 'bimestrale'
    ? profile.price_bimonthly
    : profile.yearly_enabled
      ? profile.price_yearly
      : profile.price_bimonthly;
}

function fmt(n: number): string {
  return n.toFixed(2).replace('.', ',');
}

export default function PlanComparison({
  profiles,
  billing,
}: {
  profiles: ServiceProfile[];
  billing: BillingType;
}) {
  if (profiles.length === 0) return null;

  const rows: { label: string; render: (p: ServiceProfile) => React.ReactNode }[] = [
    {
      label: 'Prezzo mensile',
      render: (p) => (
        <strong className="cmp-price">{fmt(priceFor(p, billing))}€</strong>
      ),
    },
    {
      label: 'Tipo di contratto',
      render: (p) =>
        billing === 'annuale' && p.yearly_enabled ? 'Annuale' : 'Bimestrale',
    },
    {
      label: 'Download',
      render: (p) => `${p.download_mbps} Mbps`,
    },
    {
      label: 'Upload',
      render: (p) => `${p.upload_mbps} Mbps`,
    },
    {
      label: 'Router Wi-Fi 6 incluso',
      render: () => <Yes />,
    },
    {
      label: 'Assistenza tecnica dedicata',
      render: () => <Yes />,
    },
    {
      label: 'Verifica copertura richiesta',
      render: (p) => (p.requires_coverage_check ? <Yes /> : <No />),
    },
  ];

  return (
    <div className="cmp-wrap">
      <div className="cmp-scroll">
        <table className="cmp-table">
          <thead>
            <tr>
              <th className="cmp-row-label">Caratteristica</th>
              {profiles.map((p) => (
                <th key={p.id} className="cmp-col-header">
                  <div className="cmp-col-name">{p.label}</div>
                  <div className="cmp-col-speed">
                    {p.download_mbps} Mbps
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'cmp-row-alt' : ''}>
                <td className="cmp-row-label">{row.label}</td>
                {profiles.map((p) => (
                  <td key={p.id} className="cmp-cell">
                    {row.render(p)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="cmp-row-cta">
              <td className="cmp-row-label" />
              {profiles.map((p) => (
                <td key={p.id} className="cmp-cell">
                  <a href="#contatti" className="btn btn-outline cmp-cta">
                    Scegli
                    <ArrowRight size={15} />
                  </a>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Yes() {
  return (
    <span className="cmp-yes">
      <Check size={16} strokeWidth={3} />
    </span>
  );
}

function No() {
  return (
    <span className="cmp-no">
      <X size={16} strokeWidth={3} />
    </span>
  );
}
