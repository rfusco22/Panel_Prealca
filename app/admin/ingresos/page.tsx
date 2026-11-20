'use client';

import { useState, useEffect } from 'react';
import { IngresoForm } from '@/components/forms/ingreso-form';
import { Plus, X, TrendingUp, Pencil, DollarSign, Receipt, Droplets } from 'lucide-react';
import { formatearFecha } from '@/lib/fecha';
import { ComprobanteLinks } from '@/components/comprobante-links';
function formatBs(v: number) { return v.toLocaleString('es-VE', { minimumFractionDigits: 2 }) + ' Bs'; }
function formatUsd(v: number) { return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

/**
 * Tarjeta de indicador. El relieve sale de las clases compartidas de
 * globals.css (.superficie / .indicador): sombra en capas, un degradado de
 * fondo y una inclinación mínima al pasar el mouse. El color lo pone cada
 * tarjeta con --tinte, así la grilla no queda toda del mismo tono.
 */
function Indicador({ etiqueta, valor, detalle, icono, tinte, retraso }: {
  etiqueta: string; valor: string; detalle?: string;
  icono: React.ReactNode; tinte: string; retraso: number;
}) {
  return (
    <div
      className="superficie superficie-levanta indicador aparecer p-5"
      style={{ ['--tinte' as any]: tinte, ['--retraso' as any]: `${retraso}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{etiqueta}</p>
          <p className="mt-1.5 text-2xl font-black tracking-tight text-slate-900 truncate">{valor}</p>
          {detalle && <p className="mt-1 text-xs font-medium text-slate-400">{detalle}</p>}
        </div>
        <div className="shrink-0 rounded-xl bg-white/80 p-2.5 shadow-sm ring-1 ring-slate-100">{icono}</div>
      </div>
    </div>
  );
}

export default function IngresosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ingresos, setIngresos] = useState<any[]>([]);
  // Ingreso que se está editando. null = el modal es de alta.
  const [editando, setEditando] = useState<any | null>(null);

  const fetchIngresos = async () => {
    try {
      const res = await fetch('/api/ingresos');
      const result = await res.json();
      const lista = Array.isArray(result) ? result : (result.data || result.ingresos || []);
      // precioBs, montoIva y precioDivisa son DECIMAL: mysql2 los devuelve como
      // string. Sin convertirlos, el .toFixed() de la columna en $ tiraba
      // "toFixed is not a function" con el primer ingreso real, y la página se
      // caía. No se había visto porque la tabla estaba vacía.
      setIngresos(lista.map((ing: any) => ({
        ...ing,
        precioDivisa: Number(ing.precioDivisa || 0),
        totalBs: Number(ing.precioBs || 0) + Number(ing.montoIva || 0),
      })));
    } catch (err) {
      console.error('Error cargando ingresos:', err);
    }
  };

  useEffect(() => {
    fetchIngresos();
  }, []);

  // Alta y edición pasan por acá: si el formulario manda un id, es edición.
  const handleGuardar = async (data: any) => {
    try {
      const esEdicion = !!data.id;
      const res = await fetch('/api/ingresos', {
        method: esEdicion ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || 'Error al guardar el ingreso');
      }
      await fetchIngresos();
      setTimeout(() => cerrarModal(), 1500);
    } catch (err: any) {
      throw err;
    }
  };

  const totalBs = ingresos.reduce((s, i) => s + (i.totalBs || 0), 0);
  const totalUsd = ingresos.reduce((s, i) => s + (Number(i.precioDivisa) || 0), 0);
  const totalM3 = ingresos.reduce((s, i) => s + (Number(i.m3) || 0), 0);

  const abrirAlta = () => { setEditando(null); setIsModalOpen(true); };
  const abrirEdicion = (ingreso: any) => { setEditando(ingreso); setIsModalOpen(true); };
  const cerrarModal = () => { setIsModalOpen(false); setEditando(null); };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="aparecer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 ring-1 ring-emerald-600/20">
            <TrendingUp size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Historial de Ingresos</h1>
            <p className="text-slate-500 mt-0.5 text-sm">Registra y verifica los pagos de clientes y operaciones.</p>
          </div>
        </div>
        <button
          onClick={abrirAlta}
          className="accion group bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 py-3 flex items-center gap-2 font-semibold shadow-lg shadow-slate-900/20"
        >
          <Plus size={18} className="transition-transform duration-200 group-hover:rotate-90" /> Nuevo Ingreso
        </button>
      </div>

      {/* Resumen: cuatro números que se leen de un vistazo, cada uno con su
          propio tinte para no tener que leer la etiqueta para ubicarlos. */}
      {ingresos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Indicador
            etiqueta="Total cobrado" valor={formatBs(totalBs)}
            detalle={`${ingresos.length} ${ingresos.length === 1 ? 'ingreso' : 'ingresos'}`}
            icono={<DollarSign size={18} className="text-emerald-600" />}
            tinte="rgba(16, 185, 129, 0.18)" retraso={0}
          />
          <Indicador
            etiqueta="Total en divisa" valor={formatUsd(totalUsd)}
            icono={<DollarSign size={18} className="text-blue-600" />}
            tinte="rgba(59, 130, 246, 0.16)" retraso={60}
          />
          <Indicador
            etiqueta="Volumen" valor={`${totalM3.toFixed(2)} M³`}
            icono={<Droplets size={18} className="text-cyan-600" />}
            tinte="rgba(6, 182, 212, 0.16)" retraso={120}
          />
          <Indicador
            etiqueta="Registros" valor={String(ingresos.length)}
            detalle="en el historial"
            icono={<Receipt size={18} className="text-violet-600" />}
            tinte="rgba(139, 92, 246, 0.16)" retraso={180}
          />
        </div>
      )}

      {/* Tabla */}
      <div className="superficie aparecer overflow-hidden" style={{ ['--retraso' as any]: '240ms' }}>
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="encabezado-fijo">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Banco</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Cliente</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Vendedor</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">M³</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Monto (Bs)</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Monto ($)</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Tipo</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Comprobante</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Editar</th>
              </tr>
            </thead>
            <tbody>
              {ingresos.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-16 text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-slate-300 ring-1 ring-slate-100"><Receipt size={22} /></div>
                  <p className="mt-3 font-semibold text-slate-500">No hay ingresos registrados</p>
                  <p className="text-sm text-slate-400">Los cobros que registres aparecen acá.</p>
                </td></tr>
              ) : ingresos.map((ing) => (
                <tr key={ing.id} className="fila-interactiva border-b border-slate-100">
                  <td className="px-4 py-3 text-slate-700">{formatearFecha(ing.createdAt || ing.fecha)}</td>
                  <td className="px-4 py-3 text-slate-700">{ing.banco}</td>
                  <td className="px-4 py-3 text-slate-700">{ing.nombreCliente}</td>
                  <td className="px-4 py-3 text-slate-700">{ing.vendedor || '—'}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{ing.m3 || '—'}</td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-900">{formatBs(ing.totalBs || 0)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-emerald-600">${(ing.precioDivisa || 0).toFixed(4)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${ing.tipoDocumento === 'ANTICIPO' ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-blue-50 text-blue-700 ring-blue-200'}`}>
                      {ing.tipoDocumento || 'Factura'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ComprobanteLinks comprobantes={ing.comprobantes} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => abrirEdicion(ing)}
                      className="accion p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                      title="Editar ingreso"
                    >
                      <Pencil size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={cerrarModal} />
          <div className="superficie relative rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {editando ? `Editar Ingreso #${editando.id}` : 'Registro de Ingreso'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {editando
                    ? 'Los cambios quedan registrados en la auditoría, con los valores anteriores.'
                    : 'Registra los datos bancarios y asocia la operación al cliente.'}
                </p>
              </div>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-slate-700 p-2 rounded-full transition-colors bg-slate-50 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-white">
              {/* La key fuerza un formulario nuevo por ingreso: si no, al abrir
                  otro quedarían los valores del anterior. */}
              <IngresoForm
                key={editando ? `editar-${editando.id}` : 'nuevo'}
                ingreso={editando || undefined}
                onAdd={handleGuardar}
                onClose={cerrarModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
