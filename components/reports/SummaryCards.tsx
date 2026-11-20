'use client';

interface SummaryCard {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}

// El tinte de la esquina sale del color del icono que ya traía cada tarjeta,
// así cada reporte conserva su paleta sin tener que tocarlos uno por uno.
const TINTES: Record<string, string> = {
  'bg-emerald-50': 'rgba(16, 185, 129, 0.18)',
  'bg-blue-50': 'rgba(59, 130, 246, 0.16)',
  'bg-cyan-50': 'rgba(6, 182, 212, 0.16)',
  'bg-purple-50': 'rgba(139, 92, 246, 0.16)',
  'bg-violet-50': 'rgba(139, 92, 246, 0.16)',
  'bg-orange-50': 'rgba(249, 115, 22, 0.16)',
  'bg-amber-50': 'rgba(245, 158, 11, 0.18)',
  'bg-red-50': 'rgba(239, 68, 68, 0.16)',
  'bg-rose-50': 'rgba(244, 63, 94, 0.16)',
};

export function SummaryCards({ cards }: { cards: SummaryCard[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className="superficie superficie-levanta indicador aparecer p-4"
          style={{
            ['--tinte' as any]: TINTES[card.color || ''] || 'rgba(148, 163, 184, 0.14)',
            // Entran de a una, de izquierda a derecha.
            ['--retraso' as any]: `${i * 60}ms`,
          }}
        >
          <div className="flex items-center gap-3">
            {card.icon && (
              <div className={`shrink-0 p-2.5 rounded-xl shadow-sm ring-1 ring-slate-100 ${card.color || 'bg-slate-100'}`}>
                {card.icon}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
              <p className="text-xl font-black tracking-tight text-slate-900 truncate">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
