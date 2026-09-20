'use client';

import { useState, useEffect } from 'react';
import { Truck, Gauge, Users, AlertTriangle, ArrowLeft, HardHat, FileText, Layers, Coins } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DateRangePicker, QuickDateFilters } from '@/components/reports/DateRangePicker';
import { SummaryCards } from '@/components/reports/SummaryCards';
import { ExportButtons } from '@/components/reports/ExportButtons';
import { BarChartCard, PieChartCard } from '@/components/reports/ReportCharts';
import { diasHasta, formatearFechaCorta } from '@/lib/fecha';

// Los reportes que faltan (clientes, materia prima, comisiones) se suman acá
// a medida que se implementen, sin crear una página nueva por cada uno.
// Ver issue #7.
const REPORTES = [
  { id: 'm3', label: 'Metros cúbicos despachados' },
  { id: 'resistencia', label: 'Despacho por resistencia' },
  { id: 'clientes-top', label: 'Principales clientes' },
  { id: 'comisiones', label: 'Comisiones de vendedores' },
  { id: 'viajes', label: 'Viajes por trompero' },
];

/** Carga un tipo de reporte del endpoint genérico y expone el estado. */
function useReporte(type: string, from: string, to: string) {
  const [res, setRes] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const params = new URLSearchParams({ type });
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      try {
        const r = await fetch(`/api/reportes?${params}`);
        const d = await r.json();
        setRes(d.success ? d : null);
      } catch (e) {
        console.error(e);
        setRes(null);
      }
      setLoading(false);
    };
    fetchData();
  }, [type, from, to]);

  return { res, loading };
}

function Cargando() {
  return <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">Cargando reporte...</div>;
}

function MetrosCubicos({ from, to }: { from: string; to: string }) {
  const { res, loading } = useReporte('m3', from, to);
  if (loading) return <Cargando />;
  if (!res) return <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">No se pudo cargar el reporte</div>;

  const { data: meses, porTipo, porObra, summary } = res;

  const excelData = {
    title: 'Metros cúbicos despachados',
    columns: ['Mes', 'Guías', 'M³ Total', 'Promedio M³'],
    data: meses.map((r: any) => [r.mes, r.guias, Number(r.totalM3).toFixed(2), (r.guias > 0 ? r.totalM3 / r.guias : 0).toFixed(2)]),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-slate-500">
          Mide lo despachado según las guías, no lo facturado.
        </p>
        <ExportButtons excelData={excelData} />
      </div>

      <SummaryCards cards={[
        { label: 'Total M³', value: Number(summary.totalM3).toFixed(2), icon: <Gauge size={18} className="text-emerald-600" />, color: 'bg-emerald-50' },
        { label: 'Guías', value: summary.totalGuias, icon: <FileText size={18} className="text-blue-600" />, color: 'bg-blue-50' },
        { label: 'Promedio M³/guía', value: Number(summary.promedioM3).toFixed(2), icon: <Gauge size={18} className="text-slate-600" />, color: 'bg-slate-50' },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartCard title="M³ por mes" data={summary.m3PorMes} />
        <PieChartCard title="M³ por tipo" data={summary.m3PorTipo} />
      </div>

      <TablaSimple
        titulo="Por mes"
        columnas={['Mes', 'Guías', 'M³ Total', 'Prom. M³']}
        filas={meses.map((r: any) => [r.mes, r.guias, Number(r.totalM3).toFixed(2), (r.guias > 0 ? r.totalM3 / r.guias : 0).toFixed(2)])}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TablaSimple
          titulo="Por tipo"
          columnas={['Tipo', 'Guías', 'M³ Total']}
          filas={porTipo.map((r: any) => [r.tipo, r.guias, Number(r.totalM3).toFixed(2)])}
        />
        <TablaSimple
          titulo="Por obra"
          columnas={['Obra', 'Guías', 'M³ Total']}
          filas={porObra.map((r: any) => [r.obra, r.guias, Number(r.totalM3).toFixed(2)])}
        />
      </div>
    </div>
  );
}

function PorResistencia({ from, to }: { from: string; to: string }) {
  const { res, loading } = useReporte('resistencia', from, to);
  if (loading) return <Cargando />;
  if (!res) return <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">No se pudo cargar el reporte</div>;

  const { data, detalle, summary } = res;

  const excelData = {
    title: 'Despacho por resistencia',
    columns: ['Resistencia', 'Guías', 'M³ Total', '% del período'],
    data: data.map((r: any) => [r.resistencia, r.guias, Number(r.totalM3).toFixed(2), Number(r.porcentaje).toFixed(1) + '%']),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportButtons excelData={excelData} />
      </div>

      <SummaryCards cards={[
        { label: 'Total M³', value: Number(summary.totalM3).toFixed(2), icon: <Gauge size={18} className="text-emerald-600" />, color: 'bg-emerald-50' },
        { label: 'Guías', value: summary.totalGuias, icon: <FileText size={18} className="text-blue-600" />, color: 'bg-blue-50' },
        { label: 'Resistencias', value: summary.resistencias, icon: <Layers size={18} className="text-purple-600" />, color: 'bg-purple-50' },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartCard title="M³ por resistencia" data={summary.m3PorResistencia} />
        <PieChartCard title="Participación por resistencia" data={summary.m3PorResistencia} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Por resistencia</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Resistencia</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Guías</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">M³ Total</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">% del período</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Sin despachos en el período seleccionado</td></tr>
              ) : data.map((r: any, i: number) => (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{r.resistencia}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{r.guias}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{Number(r.totalM3).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, r.porcentaje)}%` }} />
                      </div>
                      <span className="text-slate-600 tabular-nums w-12 text-right">{Number(r.porcentaje).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TablaSimple
        titulo="Detalle por resistencia y pulgada"
        columnas={['Resistencia', 'Pulgada', 'Guías', 'M³ Total']}
        filas={detalle.map((r: any) => [r.resistencia, r.pulgada, r.guias, Number(r.totalM3).toFixed(2)])}
      />
    </div>
  );
}

/** Tabla de solo lectura, para los desgloses que no necesitan nada especial. */
function TablaSimple({ titulo, columnas, filas }: { titulo: string; columnas: string[]; filas: (string | number)[][] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">{titulo}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              {columnas.map((c, i) => (
                <th key={i} className={`px-4 py-3 font-semibold text-slate-600 ${i === 0 ? 'text-left' : 'text-right'}`}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 ? (
              <tr><td colSpan={columnas.length} className="px-4 py-8 text-center text-slate-400">Sin datos para el período seleccionado</td></tr>
            ) : filas.map((fila, i) => (
              <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                {fila.map((celda, j) => (
                  <td key={j} className={`px-4 py-3 ${j === 0 ? 'text-left font-medium text-slate-900' : 'text-right text-slate-700'}`}>{celda}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComisionesVendedores({ from, to }: { from: string; to: string }) {
  const { res, loading } = useReporte('comisiones', from, to);
  const [verDetalle, setVerDetalle] = useState(false);

  if (loading) return <Cargando />;
  if (!res) return <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">No se pudo cargar el reporte</div>;

  const { data, detalle, summary } = res;
  const fmt = (v: number) => v.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const excelData = {
    title: 'Comisiones de vendedores',
    columns: ['Vendedor', 'Operaciones', 'Venta Bs', 'Comisión Bs', 'Venta $', 'Comisión $', 'M³'],
    data: data.map((r: any) => [
      r.vendedor, r.operaciones,
      Number(r.ventaBs).toFixed(2), Number(r.comisionBs).toFixed(2),
      Number(r.ventaUsd).toFixed(2), Number(r.comisionUsd).toFixed(2),
      Number(r.totalM3).toFixed(2),
    ]),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs text-slate-500 max-w-lg">
          La comisión se devenga cuando entra la plata, y se paga en la moneda en que se cobró.
          Por eso los totales en Bs y en $ van separados: sumarlos daría un número sin sentido.
        </p>
        <ExportButtons excelData={excelData} />
      </div>

      <SummaryCards cards={[
        { label: 'Comisión total Bs', value: fmt(Number(summary.totalComisionBs)), icon: <Coins size={18} className="text-emerald-600" />, color: 'bg-emerald-50' },
        { label: 'Comisión total $', value: fmt(Number(summary.totalComisionUsd)), icon: <Coins size={18} className="text-blue-600" />, color: 'bg-blue-50' },
        { label: 'Vendedores', value: summary.vendedores, icon: <Users size={18} className="text-purple-600" />, color: 'bg-purple-50' },
        { label: 'Operaciones', value: summary.operaciones, icon: <FileText size={18} className="text-slate-600" />, color: 'bg-slate-50' },
      ]} />

      {summary.operaciones === 0 && (
        <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <AlertTriangle size={18} className="text-slate-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600">
            No hay ingresos cargados en el período, así que no hay comisiones que calcular.
            Este reporte se llena a medida que se registren los cobros.
          </p>
        </div>
      )}

      {summary.operaciones > 0 && <BarChartCard title="Comisión en Bs por vendedor" data={summary.comisionPorVendedorBs} />}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Por vendedor</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Vendedor</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Ops.</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Venta Bs</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Comisión Bs</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Venta $</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Comisión $</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Sin comisiones en el período seleccionado</td></tr>
              ) : data.map((r: any, i: number) => (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{r.vendedor}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{r.operaciones}</td>
                  <td className="px-4 py-3 text-right text-slate-600 tabular-nums">{fmt(Number(r.ventaBs))}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-700 tabular-nums">{fmt(Number(r.comisionBs))}</td>
                  <td className="px-4 py-3 text-right text-slate-600 tabular-nums">{fmt(Number(r.ventaUsd))}</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-700 tabular-nums">{fmt(Number(r.comisionUsd))}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.opsPorcentaje > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{r.opsPorcentaje} por %</span>}
                      {r.opsMontoFijo > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{r.opsMontoFijo} monto fijo</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detalle.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <button onClick={() => setVerDetalle(v => !v)} className="w-full p-4 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition">
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-900">Detalle por operación</h3>
              <p className="text-xs text-slate-400 mt-0.5">De dónde sale el monto de cada vendedor</p>
            </div>
            <span className="text-xs font-semibold text-blue-600">{verDetalle ? 'Ocultar' : `Ver ${detalle.length}`}</span>
          </button>
          {verDetalle && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Fecha</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Vendedor</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Cliente</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Ref.</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600">Moneda</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Venta</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Comisión</th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.map((r: any) => {
                    const esBs = r.moneda === 'BS';
                    return (
                      <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatearFechaCorta(r.fecha)}</td>
                        <td className="px-4 py-3 text-slate-700">{r.vendedor}</td>
                        <td className="px-4 py-3 text-slate-600">{r.nombreCliente}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs font-mono">{r.referencia}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{esBs ? 'Bs' : '$'}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 tabular-nums">{fmt(esBs ? r.precioBs : r.precioDivisa)}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums">
                          {fmt(esBs ? r.comisionBs : r.comisionUsd)}
                          <span className="text-[10px] font-normal text-slate-400 ml-1">
                            {r.comisionPorcentaje !== null ? `(${r.comisionPorcentaje}%)` : '(fijo)'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PrincipalesClientes({ from, to }: { from: string; to: string }) {
  const { res, loading } = useReporte('clientes-top', from, to);
  const [orden, setOrden] = useState<'m3' | 'bs'>('m3');
  const [topN, setTopN] = useState(10);

  if (loading) return <Cargando />;
  if (!res) return <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">No se pudo cargar el reporte</div>;

  const { data, summary } = res;
  const ordenados = [...data].sort((a: any, b: any) =>
    orden === 'm3' ? b.totalM3 - a.totalM3 : b.totalBs - a.totalBs
  );
  const visibles = ordenados.slice(0, topN);

  const fmtBs = (v: number) => v.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const excelData = {
    title: 'Principales clientes',
    columns: ['Cliente', 'RIF', 'Vendedor', 'Guías', 'M³', '% M³', 'Monto Bs', 'Monto $'],
    data: ordenados.map((r: any) => [
      r.cliente, r.rif || '—', r.vendedor || '—', r.guias,
      Number(r.totalM3).toFixed(2), Number(r.porcentajeM3).toFixed(1) + '%',
      Number(r.totalBs).toFixed(2), Number(r.totalDivisa).toFixed(2),
    ]),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ordenar por</label>
            <select value={orden} onChange={e => setOrden(e.target.value as 'm3' | 'bs')}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-800 bg-white">
              <option value="m3">M³ despachados</option>
              <option value="bs">Monto en Bs</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mostrar</label>
            <select value={topN} onChange={e => setTopN(Number(e.target.value))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-800 bg-white">
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={9999}>Todos</option>
            </select>
          </div>
        </div>
        <ExportButtons excelData={excelData} />
      </div>

      <SummaryCards cards={[
        { label: 'Total M³', value: Number(summary.totalM3).toFixed(2), icon: <Gauge size={18} className="text-emerald-600" />, color: 'bg-emerald-50' },
        { label: 'Clientes con despacho', value: summary.clientes, icon: <Users size={18} className="text-blue-600" />, color: 'bg-blue-50' },
        { label: 'Concentración top 3', value: Number(summary.concentracionTop3).toFixed(1) + '%', icon: <Layers size={18} className="text-amber-600" />, color: 'bg-amber-50' },
        { label: 'Monto Bs', value: fmtBs(Number(summary.totalBs)), icon: <FileText size={18} className="text-slate-600" />, color: 'bg-slate-50' },
      ]} />

      {summary.totalBs === 0 && (
        <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <AlertTriangle size={18} className="text-slate-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600">
            Las columnas de monto están en cero porque todavía no hay ingresos cargados en el período.
            El ranking por M³ sí sale de las guías de despacho.
          </p>
        </div>
      )}

      <BarChartCard title={`Top ${Math.min(topN, 10)} por M³`} data={summary.m3PorCliente} />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Ranking de clientes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">#</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Cliente</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Vendedor</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Guías</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">M³</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">% M³</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Monto Bs</th>
              </tr>
            </thead>
            <tbody>
              {visibles.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Sin movimientos en el período seleccionado</td></tr>
              ) : visibles.map((r: any, i: number) => (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-400 tabular-nums">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {r.cliente}
                    {r.clienteId === null && (
                      <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">sin despacho</span>
                    )}
                    <div className="text-[11px] text-slate-400 font-normal">{r.rif || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{r.vendedor || '—'}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{r.guias}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{Number(r.totalM3).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, r.porcentajeM3)}%` }} />
                      </div>
                      <span className="text-slate-600 tabular-nums w-11 text-right">{Number(r.porcentajeM3).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700 tabular-nums">{fmtBs(Number(r.totalBs))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ViajesPorTrompero({ from, to }: { from: string; to: string }) {
  const [data, setData] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const params = new URLSearchParams({ type: 'viajes' });
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      try {
        const res = await fetch(`/api/reportes?${params}`);
        const d = await res.json();
        if (d.success) {
          setData(d.data || []);
          setUnidades(d.unidades || []);
          setSummary(d.summary);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchData();
  }, [from, to]);

  const excelData = {
    title: 'Viajes por trompero',
    columns: ['Chofer', 'Cédula', 'Viajes', 'M³ Total', 'Promedio M³', 'Unidades'],
    data: data.map(r => [
      r.chofer || 'Sin chofer',
      r.cedula || '—',
      r.viajes,
      Number(r.totalM3).toFixed(2),
      Number(r.promedioM3).toFixed(2),
      r.unidadesDistintas,
    ]),
  };

  // Cruce con la ficha del chofer, que recién es posible desde que la guía
  // guarda chofer_id: si maneja con la licencia o el certificado vencido, se
  // muestra acá al lado de sus viajes.
  const documentoVencido = (fecha: string | null) => {
    if (!fecha) return null;
    const dias = diasHasta(fecha);
    if (dias === null) return null;
    if (dias < 0) return { texto: `vencido hace ${Math.abs(dias)}d`, clase: 'bg-red-100 text-red-700' };
    if (dias <= 30) return { texto: `vence en ${dias}d`, clase: 'bg-amber-100 text-amber-700' };
    return null;
  };

  if (loading) {
    return <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">Cargando viajes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportButtons excelData={excelData} />
      </div>

      {summary && (
        <SummaryCards cards={[
          { label: 'Total Viajes', value: summary.totalViajes, icon: <Truck size={18} className="text-blue-600" />, color: 'bg-blue-50' },
          { label: 'Total M³', value: Number(summary.totalM3).toFixed(2), icon: <Gauge size={18} className="text-emerald-600" />, color: 'bg-emerald-50' },
          { label: 'Choferes', value: summary.choferes, icon: <Users size={18} className="text-purple-600" />, color: 'bg-purple-50' },
          { label: 'Promedio M³/viaje', value: Number(summary.promedioM3).toFixed(2), icon: <Gauge size={18} className="text-slate-600" />, color: 'bg-slate-50' },
        ]} />
      )}

      {summary?.sinVincular > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Hay <strong>{summary.sinVincular} viaje(s)</strong> de guías cuyo chofer no quedó vinculado a una ficha.
            Aparecen igual en la lista, pero conviene asignarles el chofer para que el conteo quede completo.
          </p>
        </div>
      )}

      {summary && <BarChartCard title="Viajes por chofer" data={summary.viajesPorChofer} />}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Detalle por chofer</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Chofer</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Cédula</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Viajes</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">M³ Total</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Prom. M³</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Unidades</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Documentos</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Sin viajes en el período seleccionado</td></tr>
              ) : data.map((r, i) => {
                const licencia = documentoVencido(r.licenciaVencimiento);
                const certificado = documentoVencido(r.certificadoVencimiento);
                return (
                  <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <HardHat size={14} className="text-slate-400 shrink-0" />
                        {r.chofer || 'Sin chofer'}
                        {r.choferId === null && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">sin vincular</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{r.cedula || '—'}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">{r.viajes}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{Number(r.totalM3).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{Number(r.promedioM3).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{r.unidadesDistintas}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {licencia && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${licencia.clase}`}>Licencia {licencia.texto}</span>}
                        {certificado && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${certificado.clase}`}>Cert. médico {certificado.texto}</span>}
                        {!licencia && !certificado && r.choferId !== null && <span className="text-xs text-slate-400">En regla</span>}
                        {r.choferId === null && <span className="text-xs text-slate-400">—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Viajes por unidad</h3>
          <p className="text-xs text-slate-400 mt-0.5">Para cruzar con el mantenimiento de la flota</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Unidad</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Placa</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Viajes</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">M³ Total</th>
              </tr>
            </thead>
            <tbody>
              {unidades.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Sin datos para el período seleccionado</td></tr>
              ) : unidades.map((u, i) => (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {u.numeroUnidad ? `#${u.numeroUnidad}` : <span className="text-slate-400">Sin unidad asignada</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{u.placa || '—'}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{u.viajes}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{Number(u.totalM3).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ReportesOperativosPage() {
  const backHref = usePathname().replace(/\/operativos\/?$/, '');
  const [reporte, setReporte] = useState('m3');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={backHref} className="p-2 hover:bg-slate-100 rounded-lg transition">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div className="p-2.5 bg-cyan-50 rounded-xl"><Truck className="w-5 h-5 text-cyan-600" /></div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reportes Operativos</h1>
          <p className="text-xs text-slate-500">Producción y despacho · Filtros por período</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reporte</label>
          <select
            value={reporte}
            onChange={e => setReporte(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-800 bg-white min-w-[220px]"
          >
            {REPORTES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>
        <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
        <QuickDateFilters onChange={(f, t) => { setFrom(f); setTo(t); }} />
      </div>

      {reporte === 'm3' && <MetrosCubicos from={from} to={to} />}
      {reporte === 'resistencia' && <PorResistencia from={from} to={to} />}
      {reporte === 'clientes-top' && <PrincipalesClientes from={from} to={to} />}
      {reporte === 'comisiones' && <ComisionesVendedores from={from} to={to} />}
      {reporte === 'viajes' && <ViajesPorTrompero from={from} to={to} />}
    </div>
  );
}
