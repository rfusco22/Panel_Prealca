'use client';

import { useState, useEffect } from 'react';
import { Building2, ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';

function formatBs(v: number) { return 'Bs. ' + v.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function formatUsd(v: number) { return '$ ' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }); }

export default function ReporteBancosPage() {
  const [bancos, setBancos] = useState<any[]>([]);
  const [movIngresos, setMovIngresos] = useState<any[]>([]);
  const [movEgresos, setMovEgresos] = useState<any[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const res = await fetch(`/api/reportes/bancos?${params}`);
    const data = await res.json();
    setBancos(data.bancos || []);
    setMovIngresos(data.movimientosIngresos || []);
    setMovEgresos(data.movimientosEgresos || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const movimientosBanco = selected
    ? [
        ...movIngresos.filter((m: any) => m.banco === selected.nombreBanco).map((m: any) => ({ ...m, tipo: 'Ingreso' })),
        ...movEgresos.filter((m: any) => m.banco === selected.nombreBanco).map((m: any) => ({ ...m, tipo: 'Egreso', montoBs: m.montoBs, montoUsd: m.montoDivisa })),
      ].sort((a: any, b: any) => (b.fecha || '').localeCompare(a.fecha || ''))
    : [];

  const totalIngresosBs = bancos.reduce((s: number, b: any) => s + Number(b.ingresosBs || 0), 0);
  const totalEgresosBs = bancos.reduce((s: number, b: any) => s + Number(b.egresosBs || 0), 0);
  const totalSaldoBs = totalIngresosBs - totalEgresosBs;

  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    const wsData = [['Banco', 'Cuenta', 'Titular', 'Ingresos (Bs)', 'Ingresos ($)', 'Egresos (Bs)', 'Egresos ($)', 'Saldo (Bs)', 'Saldo ($)']];
    bancos.forEach((b: any) => {
      wsData.push([b.nombreBanco, b.numeroCuenta, b.titularCuenta, Number(b.ingresosBs).toFixed(2), Number(b.ingresosUsd).toFixed(4), Number(b.egresosBs).toFixed(2), Number(b.egresosUsd).toFixed(4), Number(b.saldoBs).toFixed(2), Number(b.saldoUsd).toFixed(4)]);
    });
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Bancos');
    XLSX.writeFile(wb, 'reporte_bancos.xlsx');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/reportes" className="p-2 hover:bg-slate-100 rounded-lg transition"><ArrowLeft size={20} className="text-slate-600" /></Link>
          <div className="p-2.5 bg-emerald-50 rounded-xl"><Building2 className="w-5 h-5 text-emerald-600" /></div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Conciliación Bancaria</h1>
            <p className="text-xs text-slate-500">Relación del estado de cuenta contra ingresos y egresos</p>
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
          <p className="text-2xl font-black text-emerald-600 mt-1">{formatBs(totalIngresosBs)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">Total Egresos (Bs)</p>
          <p className="text-2xl font-black text-red-600 mt-1">{formatBs(totalEgresosBs)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">Saldo Neto (Bs)</p>
          <p className={`text-2xl font-black mt-1 ${totalSaldoBs >= 0 ? 'text-slate-900' : 'text-red-600'}`}>{formatBs(totalSaldoBs)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Bancos ({bancos.length})</h3>
          {selected && <button onClick={() => setSelected(null)} className="text-xs text-blue-600 hover:text-blue-800 font-semibold">Ver todos</button>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Banco</th>
                <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">N° Cuenta</th>
                <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase text-right">Ingresos (Bs)</th>
                <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase text-right">Egresos (Bs)</th>
                <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase text-right">Saldo (Bs)</th>
                <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase text-right">Saldo ($)</th>
                <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {bancos.map((b: any) => (
                <tr key={b.id} className={`border-t border-slate-100 hover:bg-emerald-50/30 transition cursor-pointer ${selected?.id === b.id ? 'bg-emerald-50' : ''}`}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{b.nombreBanco}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">****{b.numeroCuenta?.slice(-4)}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatBs(Number(b.ingresosBs || 0))}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">{formatBs(Number(b.egresosBs || 0))}</td>
                  <td className={`px-4 py-3 text-right font-bold ${Number(b.saldoBs || 0) >= 0 ? 'text-slate-900' : 'text-red-600'}`}>{formatBs(Number(b.saldoBs || 0))}</td>
                  <td className="px-4 py-3 text-right text-emerald-700">{formatUsd(Number(b.saldoUsd || 0))}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setSelected(selected?.id === b.id ? null : b)} className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                      {selected?.id === b.id ? 'Ocultar' : 'Ver movimientos'}
                    </button>
                  </td>
                </tr>
              ))}
              {bancos.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">{loading ? 'Cargando...' : 'No hay bancos registrados'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && movimientosBanco.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Movimientos: {selected.nombreBanco} ({movimientosBanco.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Fecha</th>
                  <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Tipo</th>
                  <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Titular</th>
                  <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Referencia</th>
                  <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase text-right">Monto (Bs)</th>
                  <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase text-right">Monto ($)</th>
                  <th className="px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {movimientosBanco.map((m: any, i: number) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-4 py-2.5 text-slate-600">{m.fecha ? new Date(m.fecha).toLocaleDateString('es-VE') : '-'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${m.tipo === 'Ingreso' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{m.tipo}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{m.titular || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-500">{m.referencia || '-'}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatBs(Number(m.montoBs || 0))}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-700">{formatUsd(Number(m.montoUsd || 0))}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs max-w-[200px] truncate">{m.descripcion || '-'}</td>
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
