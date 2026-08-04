'use client';

import { useState, useEffect } from 'react';
import { Truck, ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';

function formatBs(v: number) { return 'Bs. ' + v.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function formatUsd(v: number) { return '$ ' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }); }

export default function ReporteProveedoresPage() {
  const [proveedores, setProveedores] = useState<any[]>([]);
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
    const res = await fetch(`/api/reportes/proveedores?${params}`);
    const data = await res.json();
    setProveedores(data.proveedores || []);
    setDetalles(data.detalles || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredDetalles = selected
    ? detalles.filter((d: any) => d.proveedorNombre === selected.nombre)
    : detalles;

  const totalBs = proveedores.reduce((s: number, p: any) => s + Number(p.totalEgresosBs || 0), 0);
  const totalUsd = proveedores.reduce((s: number, p: any) => s + Number(p.totalEgresosUsd || 0), 0);

  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    const wsData = [['Proveedor', 'RIF', 'Egresos (Bs)', 'Egresos ($)', 'N° Egresos', 'Órdenes Compra']];
    proveedores.forEach((p: any) => {
      wsData.push([p.nombre, p.rif, Number(p.totalEgresosBs).toFixed(2), Number(p.totalEgresosUsd).toFixed(4), p.totalEgresos, p.totalOrdenesCompra]);
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Proveedores');
    XLSX.writeFile(wb, 'reporte_proveedores.xlsx');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/reportes" className="p-2 hover:bg-slate-100 rounded-lg transition"><ArrowLeft size={20} className="text-slate-600" /></Link>
          <div className="p-2.5 bg-orange-50 rounded-xl"><Truck className="w-5 h-5 text-orange-600" /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Reporte de Proveedores</h1>
            <p className="text-xs text-slate-500">Estado de cuenta · Egresos · Órdenes de compra</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">Total Egresos (Bs)</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatBs(totalBs)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">Total Egresos ($)</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{formatUsd(totalUsd)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Proveedores ({proveedores.length})</h3>
          {selected && <button onClick={() => setSelected(null)} className="text-xs text-blue-600 hover:text-blue-800 font-semibold">Ver todos</button>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Proveedor</th>
                <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">RIF</th>
                <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase text-right">Egresos (Bs)</th>
                <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase text-right">Egresos ($)</th>
                <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase text-center">N° Egresos</th>
                <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase text-center">Órdenes Compra</th>
                <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.map((p: any, i: number) => (
                <tr key={i} className={`border-t border-slate-100 hover:bg-orange-50/30 transition cursor-pointer ${selected?.nombre === p.nombre ? 'bg-orange-50' : ''}`}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{p.nombre}</td>
                  <td className="px-4 py-3 text-slate-500">{p.rif}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{formatBs(Number(p.totalEgresosBs || 0))}</td>
                  <td className="px-4 py-3 text-right text-emerald-700">{formatUsd(Number(p.totalEgresosUsd || 0))}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{p.totalEgresos}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{p.totalOrdenesCompra}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setSelected(selected?.nombre === p.nombre ? null : p)} className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                      {selected?.nombre === p.nombre ? 'Ocultar' : 'Ver detalle'}
                    </button>
                  </td>
                </tr>
              ))}
              {proveedores.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">{loading ? 'Cargando...' : 'No hay datos'}</td></tr>
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
                  <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Fecha</th>
                  <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Clasificación</th>
                  <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Subcategoría</th>
                  <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Referencia</th>
                  <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase text-right">Monto (Bs)</th>
                  <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase text-right">Monto ($)</th>
                  <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {filteredDetalles.map((d: any, i: number) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-4 py-2.5 text-slate-600">{d.fecha ? new Date(d.fecha).toLocaleDateString('es-VE') : '-'}</td>
                    <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-bold">{d.clasificacionGasto}</span></td>
                    <td className="px-4 py-2.5 text-slate-500">{d.subCategoria || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-500">{d.referencia || '-'}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatBs(Number(d.montoBs || 0))}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-700">{formatUsd(Number(d.montoDivisa || 0))}</td>
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
