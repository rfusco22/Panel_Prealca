'use client';

import { useEffect, useState } from 'react';
import { Package, ArrowDown, ArrowUp, Box, ChevronDown, ChevronUp } from 'lucide-react';

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

export default function DosificadorStockPage() {
  const [materiaPrima, setMateriaPrima] = useState<MateriaPrima[]>([]);
  const [productos, setProductos] = useState<StockProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);

  useEffect(() => {
    fetchStock();
  }, []);

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

  const getStockColor = (stock: number) => {
    if (stock <= 0) return 'text-red-600 bg-red-50';
    if (stock < 50) return 'text-amber-600 bg-amber-50';
    return 'text-emerald-600 bg-emerald-50';
  };

  const getStockBadge = (stock: number) => {
    if (stock <= 0) return { label: 'AGOTADO', color: 'bg-red-100 text-red-700' };
    if (stock < 50) return { label: 'BAJO', color: 'bg-amber-100 text-amber-700' };
    return { label: 'DISPONIBLE', color: 'bg-emerald-100 text-emerald-700' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500 animate-pulse">Cargando stock...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Stock Disponible</h1>
        <p className="text-sm text-slate-500 mt-1">
          Inventario calculado por materia prima y fórmula de cada producto
        </p>
      </div>

      {/* Materia Prima */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Materia Prima Disponible
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">Agregado</th>
                <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase">Entradas</th>
                <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase">Consumido</th>
                <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase">Disponible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materiaPrima.map((mp) => (
                <tr key={mp.agregadoId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-sm text-slate-900">{mp.agregadoNombre}</div>
                    <div className="text-xs text-slate-500">{mp.unidadMedida}</div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-slate-600">{Number(mp.totalEntradas).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-sm text-amber-600">{Number(mp.totalConsumido).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${getStockColor(Number(mp.disponible))}`}>
                      {Number(mp.disponible).toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
              {materiaPrima.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-400">
                    No hay materia prima registrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock por Producto */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Stock por Producto
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cantidad máxima producible según materia prima disponible
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">Producto</th>
                <th className="text-center px-6 py-3 text-xs font-bold text-slate-500 uppercase">Fórmula</th>
                <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase">Despachado</th>
                <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase">Stock</th>
                <th className="text-center px-6 py-3 text-xs font-bold text-slate-500 uppercase">Estado</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productos.map((prod) => {
                const badge = getStockBadge(Number(prod.stockDisponible));
                const isExpanded = expandedProduct === prod.productoId;
                return (
                  <>
                    <tr key={prod.productoId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center">
                            <Box size={18} className="text-green-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-slate-900">{prod.productoNombre}</div>
                            <div className="text-xs text-slate-500">{prod.unidad}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs text-slate-500">{prod.totalAgregados} agregado{prod.totalAgregados !== 1 ? 's' : ''}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-slate-600">
                        {Number(prod.totalDespachado).toFixed(2)} M³
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-lg font-bold ${getStockColor(Number(prod.stockDisponible))}`}>
                          {Number(prod.stockDisponible).toFixed(2)} M³
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-2 py-4">
                        {prod.formula.length > 0 && (
                          <button
                            onClick={() => setExpandedProduct(isExpanded ? null : prod.productoId)}
                            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp size={16} className="text-slate-400" />
                            ) : (
                              <ChevronDown size={16} className="text-slate-400" />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && prod.formula.length > 0 && (
                      <tr key={`${prod.productoId}-detail`}>
                        <td colSpan={6} className="px-6 py-4 bg-slate-50">
                          <div className="ml-12">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-3">Composición de Fórmula</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {prod.formula.map((f, idx) => {
                                const disp = Number(f.disponible);
                                const color = disp <= 0 ? 'border-red-200 bg-red-50' : disp < Number(f.cantidadRequerida) ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50';
                                return (
                                  <div key={idx} className={`rounded-lg border p-3 ${color}`}>
                                    <div className="font-semibold text-sm text-slate-900">{f.agregadoNombre}</div>
                                    <div className="text-xs text-slate-500 mt-1">
                                      Requiere: <span className="font-bold">{f.cantidadRequerida}</span> {f.unidadMedida}/M³
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      Disponible: <span className="font-bold">{Number(disp).toFixed(2)}</span> {f.unidadMedida}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {productos.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">
                    No hay productos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
