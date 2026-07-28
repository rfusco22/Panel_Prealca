'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X, Trash2, Edit2, AlertCircle, Boxes, Scale, ChevronDown } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';

interface Agregado {
  id: number;
  nombre: string;
  unidadMedida: string;
}

const UNIDADES_MEDIDA = [
  'M³ (Metro Cúbico)',
  'Litro',
  'Metro',
  'Bolsa',
  'Tonelada',
  'Kilogramo'
];

export default function AdminAgregadosPage() {
  const [agregados, setAgregados] = useState<Agregado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    unidadMedida: UNIDADES_MEDIDA[0]
  });

  const { socket } = useSocket();

  useEffect(() => {
    fetchAgregados();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchAgregados();
    };

    socket.on('agregados:created', handleUpdate);
    socket.on('agregados:updated', handleUpdate);
    socket.on('agregados:deleted', handleUpdate);
    return () => {
      socket.off('agregados:created', handleUpdate);
      socket.off('agregados:updated', handleUpdate);
      socket.off('agregados:deleted', handleUpdate);
    };
  }, [socket]);

  const fetchAgregados = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/agregados');
      if (!res.ok) throw new Error('Error al cargar agregados');
      const data = await res.json();
      setAgregados(data);
    } catch (err) {
      setError('Error al cargar la lista de agregados');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (agregado: Agregado) => {
    setFormData({
      nombre: agregado.nombre,
      unidadMedida: agregado.unidadMedida
    });
    setEditingId(agregado.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.unidadMedida) {
      return alert("Todos los campos son obligatorios.");
    }

    try {
      if (isEditing && editingId) {
        // ACTUALIZAR (PUT)
        const res = await fetch('/api/agregados', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...formData })
        });
        if (!res.ok) throw new Error('Error al actualizar');
        
        setAgregados(agregados.map(a => a.id === editingId ? { id: editingId, ...formData } : a));
      } else {
        // CREAR (POST)
        const res = await fetch('/api/agregados', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error('Error al guardar');
        const data = await res.json();
        
        setAgregados([{ id: data.id, ...formData }, ...agregados]);
      }
      cerrarModal();
    } catch (err) {
      setError(`Error al ${isEditing ? 'actualizar' : 'registrar'} el agregado`);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este agregado del sistema?')) {
      try {
        const res = await fetch(`/api/agregados?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Error al eliminar');
        setAgregados(agregados.filter(a => a.id !== id));
      } catch (err) {
        setError('No se pudo eliminar el agregado');
      }
    }
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData({ nombre: '', unidadMedida: UNIDADES_MEDIDA[0] });
  };

  return (
    <div className="max-w-6xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Control de Agregados</h1>
          <p className="text-slate-500 mt-1">Gestiona los materiales y sus respectivas unidades de medida para producción.</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm px-5 py-2.5 flex items-center gap-2 transition-all font-medium"
        >
          <Plus size={18} />
          Nuevo Agregado
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 text-sm font-medium border border-red-100">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Tabla Minimalista */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full mx-auto mb-4"></div>
          </div>
        ) : agregados.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Boxes className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Sin agregados registrados</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
              Registra los materiales base para habilitar su uso en inventario y despachos.
            </p>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" className="rounded-lg shadow-sm">
              Registrar agregado
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nombre del Material</th>
                  <th className="px-6 py-4">Unidad de Medida</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agregados.map((agregado) => (
                  <tr key={agregado.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center shrink-0">
                          <Boxes size={16} />
                        </div>
                        {agregado.nombre}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700 tracking-wide font-mono">
                        {agregado.unidadMedida}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(agregado)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(agregado.id)} 
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
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

      {/* MODAL MODERNO MINIMALISTA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={cerrarModal}></div>

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[460px] overflow-visible animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {isEditing ? 'Editar agregado' : 'Añadir nuevo agregado'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Define el nombre del material y su unidad métrica base.
                </p>
              </div>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              
              {/* Campo Nombre */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  Nombre del Agregado
                </label>
                <input
                  type="text"
                  name="nombre"
                  required
                  placeholder="Ej: Arena Lavada, Piedra Picada..."
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all text-base font-medium text-slate-900 shadow-sm placeholder:text-slate-400"
                />
              </div>

              {/* Campo Unidad de Medida */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  Unidad de Medida
                </label>
                <div className="relative">
                  <select
                    name="unidadMedida"
                    value={formData.unidadMedida}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all text-base font-medium text-slate-900 shadow-sm appearance-none cursor-pointer"
                  >
                    {UNIDADES_MEDIDA.map(unidad => (
                      <option key={unidad} value={unidad}>{unidad}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={cerrarModal}
                  className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl px-6 py-6 text-base font-medium"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-8 py-6 shadow-md transition-all text-base font-medium"
                >
                  {isEditing ? 'Guardar cambios' : 'Registrar agregado'}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
