'use client';

import { useEffect, useState, Fragment } from 'react';
import { Package, Box, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';

interface MateriaPrima {
  agregadoId: number;
  agregadoNombre: string;
  unidadMedida: string;
  totalEntradas: number;
  totalConsumido: number;
  disponible: number;
}

interface FormulaItem {
  agregadoNombre: string;
  cantidadRequerida: number;
  unidadMedida: string;
  disponible: number;
}

interface StockProducto {
  productoId: number;
  productoNombre: string;
  resistencia: string;
  pulgada: string;
  unidad: string;
  stockDisponible: number;
  totalDespachado: number;
  totalAgregados: number;
  formula: FormulaItem[];
}

export default function StockPage() {
  const [materiaPrima, setMateriaPrima] = useState<MateriaPrima[]>([]);
  const [productos, setProductos] = useState<StockProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [tab, setTab] = useState<'productos' | 'materiaPrima'>('productos');

  const { socket } = useSocket();

  useEffect(() => {
    fetchStock();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchStock();
    socket.on('materia-prima:created', handleUpdate);
    socket.on('guia-despacho:created', handleUpdate);
    socket.on('guia-despacho:deleted', handleUpdate);
    socket.on('productos:created', handleUpdate);
    socket.on('productos:updated', handleUpdate);
    return () => {
      socket.off('materia-prima:created', handleUpdate);
      socket.off('guia-despacho:created', handleUpdate);
      socket.off('guia-despacho:deleted', handleUpdate);
      socket.off('productos:created', handleUpdate);
      socket.off('productos:updated', handleUpdate);
    };
  }, [socket]);

  const fetchStock = async () => {
    try {
      const res = await fetch('/api/stock');
      const data = await res.json();
      if (data.success) {
        setMateriaPrima(data.materiaPrima);
        setProductos(data.productos);
      }
    } catch (error) {
      console.error('Error fetching stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (stock: number) => {
    if (stock <= 0) return { label: 'Agotado', cls: 'bg-red-100 text-red-700 border border-red-200' };
    if (stock < 200) return { label: 'Limitado', cls: 'bg-amber-50 text-amber-700 border border-amber-200' };
    return { label: 'Disponible', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
  };

  const getMateriaPrimaBadge = (cantidad: number) => {
    if (cantidad <= 0) return { label: 'Agotado', cls: 'bg-red-100 text-red-700 border border-red-200' };
    if (cantidad < 100) return { label: 'Bajo', cls: 'bg-amber-50 text-amber-700 border border-amber-200' };
    return { label: 'Normal', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
  };

  const getMaterialLimitante = (formula: FormulaItem[]) => {
    if (!formula || formula.length === 0) return 'Sin fórmula';
    let minRatio = Infinity;
    let limitante = '';
    for (const f of formula) {
      const disp = Number(f.disponible);
      const req = Number(f.cantidadRequerida);
      if (req > 0) {
        const ratio = disp / req;
        if (ratio < minRatio) {
          minRatio = ratio;
          limitante = f.agregadoNombre;
        }
      }
    }
    return limitante || 'Ninguno';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500 animate-pulse">Cargando inventario...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inventario por Producto</h1>
        <p className="text-sm text-slate-500 mt-1">
          Estado del stock calculado por materia prima y fórmula de cada producto
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('productos')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'productos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Box size={14} className="inline mr-1.5" />
          Por Producto
        </button>
        <button
          onClick={() => setTab('materiaPrima')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'materiaPrima' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Package size={14} className="inline mr-1.5" />
          Materia Prima
        </button>
      </div>

      {/* Tab: Por Producto */}
      {tab === 'productos' && (
        <>
          {/* Leyenda de estados */}
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-500 font-medium">Estado:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Disponible (&gt;200 M³)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Limitado (1-200 M³)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Agotado (0 M³)
            </span>
          </div>

          {/* Tabla de Productos */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Producto</th>
                    <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">M³ Disponibles</th>
                    <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Despachado</th>
                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Material Limitante</th>
                    <th className="text-center px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productos.map((prod) => {
                    const stock = Number(prod.stockDisponible);
                    const badge = getEstadoBadge(stock);
                    const isExpanded = expandedProduct === prod.productoId;
                    const limitante = getMaterialLimitante(prod.formula);
                    return (
                      <Fragment key={prod.productoId}>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-900">{prod.productoNombre}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`font-bold ${stock <= 0 ? 'text-red-600' : stock < 200 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {stock.toFixed(2)} M³
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-slate-600">
                            {Number(prod.totalDespachado).toFixed(2)} M³
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-sm ${limitante !== 'Ninguno' && limitante !== 'Sin fórmula' ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>
                              {limitante}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-2 py-4">
                            {prod.formula.length > 0 && (
                              <button
                                onClick={() => setExpandedProduct(isExpanded ? null : prod.productoId)}
                                className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                              >
                                {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                              </button>
                            )}
                          </td>
                        </tr>
                        {isExpanded && prod.formula.length > 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 bg-slate-50/80">
                              <div className="ml-8">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Composición de Fórmula</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {prod.formula.map((f, idx) => {
                                    const disp = Number(f.disponible);
                                    const req = Number(f.cantidadRequerida);
                                    const ratio = req > 0 ? disp / req : 0;
                                    const color = disp <= 0 ? 'border-red-200 bg-red-50/50' : ratio < 1 ? 'border-amber-200 bg-amber-50/50' : 'border-emerald-200 bg-emerald-50/50';
                                    return (
                                      <div key={idx} className={`rounded-lg border p-3 ${color}`}>
                                        <div className="font-semibold text-xs text-slate-900">{f.agregadoNombre}</div>
                                        <div className="text-[11px] text-slate-500 mt-1">
                                          Requiere: <span className="font-bold">{req}</span> {f.unidadMedida}/M³
                                        </div>
                                        <div className="text-[11px] text-slate-500">
                                          Disponible: <span className="font-bold">{disp.toFixed(2)}</span> {f.unidadMedida}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                  {productos.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Package size={32} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">No hay productos registrados</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Tab: Materia Prima */}
      {tab === 'materiaPrima' && (
        <>
          {/* Leyenda */}
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-500 font-medium">Estado:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Normal (&gt;100)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Bajo (1-100)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Agotado (0)
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Material</th>
                    <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Entradas</th>
                    <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Consumido</th>
                    <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Disponible</th>
                    <th className="text-center px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materiaPrima.map((mp) => {
                    const disp = Number(mp.disponible);
                    const badge = getMateriaPrimaBadge(disp);
                    return (
                      <tr key={mp.agregadoId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{mp.agregadoNombre}</div>
                          <div className="text-xs text-slate-400">{mp.unidadMedida}</div>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-600">{Number(mp.totalEntradas).toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-amber-600">{Number(mp.totalConsumido).toFixed(2)}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-bold ${disp <= 0 ? 'text-red-600' : disp < 100 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {disp.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {materiaPrima.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Package size={32} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">No hay materia prima registrada</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
