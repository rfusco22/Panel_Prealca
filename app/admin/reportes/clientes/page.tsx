'use client';

import { useState, useEffect } from 'react';
import { Users, BarChart3, ArrowLeft, Download, FileText } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function formatBs(v: number) { return 'Bs. ' + v.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function formatUsd(v: number) { return '$ ' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }); }

export default function ReporteClientesPage() {
  const backHref = usePathname().replace(/\/clientes\/?$/, '');
  const [clientes, setClientes] = useState<any[]>([]);
  const [detalles, setDetalles] = useState<any[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const res = await fetch(`/api/reportes/clientes?${params}`);
    const data = await res.json();
    setClientes(data.clientes || []);
    setDetalles(data.detalles || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredDetalles = selected
    ? detalles.filter((d: any) => d.clienteNombre === selected.nombre)
    : detalles;

  const totalBs = clientes.reduce((s: number, c: any) => s + Number(c.totalIngresosBs || 0), 0);
  const totalM3 = clientes.reduce((s: number, c: any) => s + Number(c.totalM3 || 0), 0);
  const totalComisiones = clientes.reduce((s: number, c: any) => s + Number(c.totalComisiones || 0), 0);

  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    const wsData = [['Cliente', 'RIF', 'Vendedor', 'Ingresos (Bs)', 'IVA (Bs)', 'M³ Despachados', 'Comisiones']];
    clientes.forEach((c: any) => {
      wsData.push([c.nombre, c.rif, c.vendedor || '-', Number(c.totalIngresosBs).toFixed(2), Number(c.totalIvaBs).toFixed(2), Number(c.totalM3).toFixed(2), Number(c.totalComisiones).toFixed(2)]);
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, 'reporte_clientes.xlsx');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={backHref} className="p-2 hover:bg-slate-100 rounded-lg transition"><ArrowLeft size={20} className="text-slate-600" /></Link>
          <div className="p-2.5 bg-blue-50 rounded-xl"><Users className="w-5 h-5 text-blue-600" /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Reporte de Clientes</h1>
            <p className="text-xs text-slate-500">Estado de cuenta · Ingresos · Guías de despacho · Comisiones</p>
          </div>
        </div>
        <button onClick={exportExcel} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition">
          <Download size={16} /> Excel
        </button>
      </div>

      <div className="flex gap-3 items-end">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Desde</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-800" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hasta</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-800" />
        </div>
        <button onClick={fetchData} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition">Buscar</button>
        {(from || to) && <button onClick={() => { setFrom(''); setTo(''); }} className="text-slate-500 hover:text-slate-700 text-sm font-medium">Limpiar</button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">Total Ingresos (Bs)</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatBs(totalBs)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">Total M³ Despachados</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{Number(totalM3).toFixed(2)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">Total Comisiones</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{formatBs(totalComisiones)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Clientes ({clientes.length})</h3>
          {selected && (
            <button onClick={() => setSelected(null)} className="text-xs text-blue-600 hover:text-blue-800 font-semibold">Ver todos</button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Cliente</th>
                <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">RIF</th>
                <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Vendedor</th>
                <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase text-right">Ingresos (Bs)</th>
                <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase text-right">IVA (Bs)</th>
                <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase text-right">M³ Despachados</th>
                <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase text-right">Comisiones</th>
                <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c: any) => (
                <tr key={c.id} className={`border-t border-slate-100 hover:bg-blue-50/30 transition cursor-pointer ${selected?.id === c.id ? 'bg-blue-50' : ''}`}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{c.nombre}</td>
                  <td className="px-4 py-3 text-slate-500">{c.rif}</td>
                  <td className="px-4 py-3 text-slate-500">{c.vendedor || '-'}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{formatBs(Number(c.totalIngresosBs || 0))}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{formatBs(Number(c.totalIvaBs || 0))}</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-600">{Number(c.totalM3 || 0).toFixed(2)} M³</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatBs(Number(c.totalComisiones || 0))}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setSelected(selected?.id === c.id ? null : c)} className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                      {selected?.id === c.id ? 'Ocultar' : 'Ver detalle'}
                    </button>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">{loading ? 'Cargando...' : 'No hay datos'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && filteredDetalles.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Detalle: {selected.nombre} ({filteredDetalles.length} registros)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Tipo</th>
                  <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Documento</th>
                  <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Referencia</th>
                  <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase text-right">Monto (Bs)</th>
                  <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase text-right">Monto ($)</th>
                  <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {filteredDetalles.map((d: any, i: number) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">{d.tipo}</span></td>
                    <td className="px-4 py-2.5 text-slate-500">{d.documento || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-500">{d.referencia || '-'}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatBs(Number(d.montoBs || 0))}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-700">{formatUsd(Number(d.montoUsd || 0))}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs max-w-[200px] truncate">{d.descripcion || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
