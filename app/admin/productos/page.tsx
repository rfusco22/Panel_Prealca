'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X, Trash2, Edit2, AlertCircle, Package, Layers, Beaker, ShieldAlert, Check } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';

interface FormulaItem {
  agregadoId: number;
  nombre: string;
  cantidad: number | string;
  unidadMedida: string;
}

interface Producto {
  id: number;
  resistencia: string;
  pulgada: string;
  unidad: string;
  formula: FormulaItem[];
}

interface AgregadoDB {
  id: number;
  nombre: string;
  unidadMedida: string;
}

export default function AdminProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [agregadosDisponibles, setAgregadosDB] = useState<AgregadoDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    resistencia: '',
    pulgada: '',
    unidad: 'M3'
  });
  
  // Estado Dinámico para la Fórmula
  const [formulaData, setFormulaData] = useState<FormulaItem[]>([]);

  const { socket } = useSocket();

  useEffect(() => {
    initData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      initData();
    };

    socket.on('productos:created', handleUpdate);
    socket.on('productos:updated', handleUpdate);
    socket.on('productos:deleted', handleUpdate);
    return () => {
      socket.off('productos:created', handleUpdate);
      socket.off('productos:updated', handleUpdate);
      socket.off('productos:deleted', handleUpdate);
    };
  }, [socket]);

  const initData = async () => {
    try {
      setLoading(true);
      const resProd = await fetch('/api/productos');
      const dataProd = await resProd.json();
      
      const resAgregados = await fetch('/api/agregados');
      const dataAgregados = await resAgregados.json();

      setProductos(Array.isArray(dataProd) ? dataProd : []);
      setAgregadosDB(Array.isArray(dataAgregados) ? dataAgregados : []);
    } catch (err) {
      setError('Error al sincronizar datos del módulo.');
    } finally {
      setLoading(false);
    }
  };

  const handleBaseInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- MÉTODOS DE LA FÓRMULA ---
  const agregarItemAFormula = () => {
    if (agregadosDisponibles.length === 0) return alert("Primero debes registrar agregados en su sección correspondiente.");
    
    const primerAgregado = agregadosDisponibles[0];
    const nuevoRow: FormulaItem = {
      agregadoId: primerAgregado.id,
      nombre: primerAgregado.nombre,
      cantidad: '',
      unidadMedida: primerAgregado.unidadMedida
    };

    setFormulaData([...formulaData, nuevoRow]);
  };

  const removerItemDeFormula = (index: number) => {
    setFormulaData(formulaData.filter((_, i) => i !== index));
  };

  const handleFormulaRowChange = (index: number, agregadoIdSeleccionado: number) => {
    const aggInfo = agregadosDisponibles.find(a => a.id === Number(agregadoIdSeleccionado));
    if (!aggInfo) return;

    setFormulaData(formulaData.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          agregadoId: aggInfo.id,
          nombre: aggInfo.nombre,
          unidadMedida: aggInfo.unidadMedida
        };
      }
      return item;
    }));
  };

  const handleCantidadRowChange = (index: number, cantidad: string) => {
    setFormulaData(formulaData.map((item, i) => {
      if (i === index) {
        return { ...item, cantidad: cantidad };
      }
      return item;
    }));
  };

  // --- ACTIONS ---
  const handleEdit = (producto: Producto) => {
    setFormData({
      resistencia: producto.resistencia,
      pulgada: producto.pulgada,
      unidad: producto.unidad
    });
    setFormulaData(producto.formula || []);
    setEditingId(producto.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.resistencia || !formData.pulgada) return alert("Campos básicos obligatorios.");

    for (const item of formulaData) {
      if (!item.cantidad || Number(item.cantidad) <= 0) {
        return alert("Por favor, asigna una cantidad válida a cada componente de la fórmula.");
      }
    }

    const payload = {
      ...formData,
      formula: formulaData.map(f => ({ agregadoId: f.agregadoId, cantidad: Number(f.cantidad) }))
    };

    try {
      if (isEditing && editingId) {
        const res = await fetch('/api/productos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload })
        });
        if (!res.ok) throw new Error('Error al actualizar');
      } else {
        const res = await fetch('/api/productos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Error al guardar');
      }
      initData();
      cerrarModal();
    } catch (err) {
      setError('Error al procesar el producto.');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este producto? Se borrará su fórmula asociada por completo.')) {
      try {
        const res = await fetch(`/api/productos?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Error al eliminar');
        setProductos(productos.filter(p => p.id !== id));
      } catch (err) {
        setError('No se pudo eliminar el producto');
      }
    }
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData({ resistencia: '', pulgada: '', unidad: 'M3' });
    setFormulaData([]);
  };

  return (
    <div className="max-w-6xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Catálogo de Productos</h1>
          <p className="text-slate-500 mt-1">Configura las mezclas con sus dosificaciones estructurales exactas.</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm px-5 py-2.5 flex items-center gap-2 transition-all font-medium"
        >
          <Plus size={18} />
          Nuevo Producto
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 text-sm font-medium border border-red-100">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Tabla Principal Mejorada (DISEÑO PREMIUM) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full mx-auto mb-4"></div>
          </div>
        ) : productos.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Sin productos registrados</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
              Registra mezclas agregando su resistencia, tamaño en pulgadas y su fórmula base.
            </p>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" className="rounded-lg shadow-sm">
              Crear Producto
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Resistencia</th>
                  <th className="px-6 py-4">Pulgada</th>
                  <th className="px-6 py-4">Unidad</th>
                  <th className="px-6 py-4">Composición de Fórmula</th>
                  <th className="px-6 py-4 text-right">Accciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productos.map((producto) => (
                  <tr key={producto.id} className="hover:bg-slate-50/80 transition-colors group align-middle">
                    
                    {/* Columna: Resistencia (Con Icono Premium) */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-slate-50 text-blue-600 rounded-xl border border-blue-100/50 flex items-center justify-center shrink-0 shadow-sm">
                          <Layers size={18} className="drop-shadow-sm" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm tracking-wide">{producto.resistencia}</span>
                        </div>
                      </div>
                    </td>

                    {/* Columna: Medida (Pulgada) */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100/80 border border-slate-200/50 text-xs font-semibold text-slate-700 shadow-sm">
                        {producto.pulgada} "
                      </span>
                    </td>

                    {/* Columna: Unidad Base */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-slate-50 text-slate-500 font-mono text-xs font-medium border border-slate-100">
                        {producto.unidad}
                      </span>
                    </td>

                    {/* Columna: Fórmula Dinámica (DISEÑO PILLS/ETIQUETAS) */}
                    <td className="px-6 py-4 max-w-md">
                      {producto.formula && producto.formula.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {producto.formula.map((f, idx) => (
                            <div 
                              key={idx} 
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm text-xs group-hover:border-blue-200 transition-colors"
                            >
                              <span className="font-semibold text-slate-700">{f.nombre}</span>
                              <div className="w-px h-3 bg-slate-200"></div> {/* Línea separadora */}
                              <div className="flex items-baseline gap-1">
                                <span className="font-mono font-bold text-blue-600">{Number(f.cantidad)}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                  {f.unidadMedida.split(' ')[0]}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-100/50 text-xs text-orange-600 font-medium shadow-sm">
                          <ShieldAlert size={14} /> Sin componentes asignados
                        </span>
                      )}
                    </td>

                    {/* Columna: Acciones */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(producto)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(producto.id)} 
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL MAESTRO FLUIDO (MAX-W-2XL) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={cerrarModal}></div>

          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {isEditing ? 'Editar producto estructural' : 'Añadir nuevo producto'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">Configura las dimensiones bases e integra su dosificación.</p>
              </div>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-slate-700 p-2 rounded-full transition-colors bg-slate-50 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            {/* Formulario Scrolleable por si la fórmula es larga */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
              
              {/* Bloque 1: Parámetros Básicos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resistencia</label>
                  <input
                    type="text"
                    name="resistencia"
                    required
                    placeholder="Ej: BS-250, BS-300"
                    value={formData.resistencia}
                    onChange={handleBaseInputChange}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm font-medium text-slate-900 shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pulgada</label>
                  <input
                    type="text"
                    name="pulgada"
                    required
                    placeholder="Ej: 1, 3/4, 1/2"
                    value={formData.pulgada}
                    onChange={handleBaseInputChange}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm font-medium text-slate-900 shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unidad Base</label>
                  <input
                    type="text"
                    name="unidad"
                    disabled
                    value={formData.unidad}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 cursor-not-allowed select-none font-mono shadow-sm"
                  />
                </div>
              </div>

              {/* Bloque 2: Constructor de Fórmulas (Dinámico) */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 rounded-md">
                      <Beaker className="w-4 h-4 text-blue-600" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Composición de la Fórmula</h4>
                  </div>
                  <Button
                    type="button"
                    onClick={agregarItemAFormula}
                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border border-blue-200/60 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
                  >
                    <Plus size={14} /> Añadir agregado
                  </Button>
                </div>

                {formulaData.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-200 bg-slate-50 rounded-xl p-8 text-center">
                    <p className="text-sm text-slate-500 font-medium">
                      No se han asignado agregados a este producto.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Haz clic en el botón de arriba para comenzar a construir la fórmula.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formulaData.map((item, index) => (
                      <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-1">
                        
                        {/* Selector de Agregado */}
                        <div className="flex-1 w-full space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Material / Agregado</span>
                          <select
                            value={item.agregadoId}
                            onChange={(e) => handleFormulaRowChange(index, Number(e.target.value))}
                            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-semibold text-slate-700 cursor-pointer transition-all"
                          >
                            {agregadosDisponibles.map(a => (
                              <option key={a.id} value={a.id}>{a.nombre}</option>
                            ))}
                          </select>
                        </div>

                        {/* Input Cantidad */}
                        <div className="w-full sm:w-40 space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proporción</span>
                          <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                            <input
                              type="text"
                              required
                              placeholder="0.00"
                              value={item.cantidad}
                              onChange={(e) => handleCantidadRowChange(index, e.target.value.replace(/[^0-9.]/g, ''))}
                              className="w-full px-3 py-2 bg-transparent font-mono text-sm focus:outline-none font-bold text-slate-900 placeholder:text-slate-300"
                            />
                            <div className="px-2.5 bg-slate-50 border-l border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 select-none">
                              {item.unidadMedida.split(' ')[0]}
                            </div>
                          </div>
                        </div>

                        {/* Eliminar fila */}
                        <button
                          type="button"
                          onClick={() => removerItemDeFormula(index)}
                          className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg self-end sm:self-center transition-colors mt-2 sm:mt-[22px] border border-transparent hover:border-red-100"
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Footer Interno */}
              <div className="pt-6 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={cerrarModal}
                  className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl px-6 py-5 text-sm font-medium transition-colors w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-8 py-5 shadow-md transition-all text-sm font-semibold w-full sm:w-auto"
                >
                  {isEditing ? 'Guardar cambios' : 'Guardar producto'}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}