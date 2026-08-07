'use client';

import { useState } from 'react';
import { IngresoForm } from '@/components/forms/ingreso-form';
import { Plus, X, TrendingUp } from 'lucide-react';

function formatBs(v: number) { return v.toLocaleString('es-VE', { minimumFractionDigits: 2 }) + ' Bs'; }

export default function IngresosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ingresos, setIngresos] = useState<any[]>([]);

  const handleAdd = (data: any) => {
    setIngresos(prev => [{ ...data, id: Date.now(), fecha: new Date().toISOString() }, ...prev]);
    setTimeout(() => setIsModalOpen(false), 1500);
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Historial de Ingresos</h1>
          <p className="text-slate-500 mt-1">Registra y verifica los pagos de clientes y operaciones.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm px-5 py-2.5 flex items-center gap-2 transition-all font-medium">
          <Plus size={18} /> Nuevo Ingreso
        </button>
      </div>

      {/* Resumen */}
      {ingresos.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <TrendingUp size={20} className="text-emerald-600" />
          <div>
            <p className="text-sm font-bold text-emerald-800">{ingresos.length} ingresos registrados</p>
            <p className="text-xs text-emerald-600">Total: {formatBs(ingresos.reduce((s, i) => s + (i.totalBs || 0), 0))}</p>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Banco</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Cliente</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Vendedor</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">M³</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Monto (Bs)</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Monto ($)</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Tipo</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Comprobante</th>
              </tr>
            </thead>
            <tbody>
              {ingresos.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">No hay ingresos registrados</td></tr>
              ) : ingresos.map((ing) => (
                <tr key={ing.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{new Date(ing.fecha).toLocaleDateString('es-VE')}</td>
                  <td className="px-4 py-3 text-slate-700">{ing.banco}</td>
                  <td className="px-4 py-3 text-slate-700">{ing.nombreCliente}</td>
                  <td className="px-4 py-3 text-slate-700">{ing.vendedor || '—'}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{ing.m3 || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">{formatBs(ing.totalBs || 0)}</td>
                  <td className="px-4 py-3 text-right text-emerald-700">${(ing.precioDivisa || 0).toFixed(4)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ing.tipoDocumento === 'ANTICIPO' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {ing.tipoDocumento || 'Factura'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {ing.comprobantes?.length > 0 ? (
                      <span className="text-emerald-600 text-xs font-semibold">{ing.comprobantes.length} archivo(s)</span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Registro de Ingreso</h3>
                <p className="text-sm text-slate-500 mt-1">Registra los datos bancarios y asocia la operación al cliente.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-2 rounded-full transition-colors bg-slate-50 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-white">
              <IngresoForm onAdd={handleAdd} onClose={() => setIsModalOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
