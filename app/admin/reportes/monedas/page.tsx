'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Globe } from 'lucide-react';
import { SummaryCards } from '@/components/reports/SummaryCards';
import { ExportButtons } from '@/components/reports/ExportButtons';
import { LineChartCard } from '@/components/reports/ReportCharts';

function formatBs(v: number) { return v.toLocaleString('es-VE', { minimumFractionDigits: 2 }) + ' Bs'; }

export default function ConversionMonedasPage() {
  const [rate, setRate] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/bcv');
        const data = await res.json();
        const promedio = Number(data.promedio) || 0;
        const compra = Number(data.compra) || promedio;
        const venta = Number(data.venta) || promedio;
        setRate({ nombre: 'Oficial', compra, venta, promedio });
        setHistory([{ name: 'Actual', value: promedio }]);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchData();
  }, []);

  const excelData = {
    title: 'Conversión de Monedas',
    columns: ['Tipo', 'Compra', 'Venta', 'Promedio'],
    data: rate ? [[rate.nombre, rate.compra, rate.venta, rate.promedio]] : [],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Conversión de Monedas</h1>
          <p className="text-sm text-slate-500">Tasa de cambio oficial del BCV</p>
        </div>
        <ExportButtons excelData={excelData} />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando tasa de cambio...</div>
      ) : rate ? (
        <>
          <SummaryCards cards={[
            { label: 'Dólar Oficial', value: formatBs(rate.promedio), icon: <DollarSign size={18} className="text-emerald-600" />, color: 'bg-emerald-50' },
            { label: 'Compra', value: formatBs(rate.compra), icon: <TrendingUp size={18} className="text-blue-600" />, color: 'bg-blue-50' },
            { label: 'Venta', value: formatBs(rate.venta), icon: <TrendingUp size={18} className="text-purple-600" />, color: 'bg-purple-50' },
          ]} />

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Tasa de Cambio Oficial (BCV)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-xs font-bold text-emerald-600 uppercase">Compra</p>
                <p className="text-2xl font-black text-emerald-800">{formatBs(rate.compra)}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-xs font-bold text-blue-600 uppercase">Promedio</p>
                <p className="text-2xl font-black text-blue-800">{formatBs(rate.promedio)}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <p className="text-xs font-bold text-purple-600 uppercase">Venta</p>
                <p className="text-2xl font-black text-purple-800">{formatBs(rate.venta)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChartCard title="Tasa de Cambio" data={history} lines={['value']} />
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-slate-400">No se pudo obtener la tasa de cambio</div>
      )}
    </div>
  );
}
