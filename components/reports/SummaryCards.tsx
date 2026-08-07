'use client';

interface SummaryCard {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}

export function SummaryCards({ cards }: { cards: SummaryCard[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            {card.icon && (
              <div className={`p-2 rounded-lg ${card.color || 'bg-slate-100'}`}>
                {card.icon}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.label}</p>
              <p className="text-lg font-bold text-slate-900">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
