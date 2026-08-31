'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X, Trash2, Edit2, AlertCircle, Truck, Hash, Tag, Car, Calendar, Palette } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { formatearFecha, hoyLocal } from '@/lib/fecha';
interface Unidad {
  id: number;
  numeroUnidad: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: string;
  color: string;
  polizaRcvNumero: string | null;
  polizaRcvVencimiento: string | null;
  rotNumero: string | null;
  rotVencimiento: string | null;
}

export default function AdminUnidadesPage() {
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Estado con los campos exactos que pediste
  const getToday = () => hoyLocal();

  const [formData, setFormData] = useState({
    numeroUnidad: '',
    placa: '',
    marca: '',
    modelo: '',
    ano: '',
    color: '',
    polizaRcvNumero: '',
    polizaRcvVencimiento: '',
    rotNumero: '',
    rotVencimiento: ''
  });

  const { socket } = useSocket();

  useEffect(() => {
    fetchUnidades();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchUnidades();
    };

    socket.on('unidades:created', handleUpdate);
    socket.on('unidades:updated', handleUpdate);
    socket.on('unidades:deleted', handleUpdate);
    return () => {
      socket.off('unidades:created', handleUpdate);
      socket.off('unidades:updated', handleUpdate);
      socket.off('unidades:deleted', handleUpdate);
    };
  }, [socket]);

  const fetchUnidades = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/unidades');
      if (!res.ok) throw new Error('Error al cargar unidades');
      const data = await res.json();
      setUnidades(data);
    } catch (err) {
      setError('Error al cargar las unidades de transporte');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Validaciones en tiempo real
    if (name === 'placa') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase() })); // Placa siempre en mayúsculas
    } else if (name === 'ano') {
      const soloNumeros = value.replace(/\D/g, '').slice(0, 4); // Año solo números y max 4 dígitos
      setFormData(prev => ({ ...prev, [name]: soloNumeros }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEdit = (unidad: Unidad) => {
    setFormData({
      numeroUnidad: unidad.numeroUnidad,
      placa: unidad.placa,
      marca: unidad.marca,
      modelo: unidad.modelo,
      ano: unidad.ano,
      color: unidad.color,
      polizaRcvNumero: unidad.polizaRcvNumero || '',
      polizaRcvVencimiento: unidad.polizaRcvVencimiento?.split('T')[0] || '',
      rotNumero: unidad.rotNumero || '',
      rotVencimiento: unidad.rotVencimiento?.split('T')[0] || ''
    });
    setEditingId(unidad.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación de campos vacíos
    if (!formData.numeroUnidad || !formData.placa || !formData.marca || !formData.modelo || !formData.ano || !formData.color) {
      return alert("Todos los campos son obligatorios.");
    }
    if (formData.ano.length !== 4) {
      return alert("El año debe tener exactamente 4 dígitos.");
    }

    try {
      if (isEditing && editingId) {
        // ACTUALIZAR (PUT)
        const res = await fetch('/api/unidades', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...formData })
        });
        if (!res.ok) throw new Error('Error al actualizar');
        
        setUnidades(unidades.map(u => u.id === editingId ? { id: editingId, ...formData } : u));
      } else {
        // CREAR (POST)
        const res = await fetch('/api/unidades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error('Error al guardar');
        const data = await res.json();
        
        setUnidades([{ id: data.id, ...formData }, ...unidades]);
      }
      cerrarModal();
    } catch (err) {
      setError(`Error al ${isEditing ? 'actualizar' : 'registrar'} la unidad`);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar esta unidad de transporte?')) {
      try {
        const res = await fetch(`/api/unidades?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Error al eliminar');
        setUnidades(unidades.filter(u => u.id !== id));
      } catch (err) {
        setError('No se pudo eliminar la unidad');
      }
    }
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData({ numeroUnidad: '', placa: '', marca: '', modelo: '', ano: '', color: '', polizaRcvNumero: '', polizaRcvVencimiento: '', rotNumero: '', rotVencimiento: '' });
  };

  return (
    <div className="max-w-6xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Unidades de Transporte</h1>
          <p className="text-slate-500 mt-1">Gestiona el detalle de tu flota de vehículos para la logística.</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm px-5 py-2.5 flex items-center gap-2 transition-all font-medium"
        >
          <Plus size={18} />
          Nueva Unidad
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 text-sm font-medium border border-red-100">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* --- TABLA --- */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full mx-auto mb-4"></div>
          </div>
        ) : unidades.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Sin unidades registradas</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
              Registra tu primer vehículo indicando su número, placa y características.
            </p>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" className="rounded-lg shadow-sm">
              Registrar vehículo
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">N° Unidad</th>
                  <th className="px-6 py-4">Placa</th>
                  <th className="px-6 py-4">Vehículo (Marca / Modelo)</th>
                  <th className="px-6 py-4">Año / Color</th>
                  <th className="px-6 py-4">Póliza RCV</th>
                  <th className="px-6 py-4">ROT</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unidades.map((unidad) => (
                  <tr key={unidad.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center shrink-0">
                          <Hash size={16} />
                        </div>
                        {unidad.numeroUnidad}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm tracking-wide text-blue-600 font-semibold">
                      <span className="bg-blue-50/50 px-2 py-1 rounded border border-blue-100">
                        {unidad.placa}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{unidad.marca}</span>
                        <span className="text-xs text-slate-500">{unidad.modelo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          {unidad.ano}
                        </span>
                        <span className="text-xs text-slate-500 capitalize">{unidad.color}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {unidad.polizaRcvNumero ? (
                        <div>
                          <span className="text-xs font-bold text-slate-700">{unidad.polizaRcvNumero}</span>
                          {unidad.polizaRcvVencimiento && (
                            <p className="text-[10px] text-slate-500 mt-0.5">Vence: {formatearFecha(unidad.polizaRcvVencimiento)}</p>
                          )}
                        </div>
                      ) : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      {unidad.rotNumero ? (
                        <div>
                          <span className="text-xs font-bold text-slate-700">{unidad.rotNumero}</span>
                          {unidad.rotVencimiento && (
                            <p className="text-[10px] text-slate-500 mt-0.5">Vence: {formatearFecha(unidad.rotVencimiento)}</p>
                          )}
                        </div>
                      ) : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(unidad)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(unidad.id)} 
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

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={cerrarModal}></div>

          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {isEditing ? 'Editar unidad' : 'Añadir nueva unidad'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {isEditing ? 'Modifica los datos del vehículo.' : 'Registra el detalle de un nuevo vehículo en la flota.'}
                </p>
              </div>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors shrink-0">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-5 sm:p-8 space-y-5 sm:space-y-6">
                
                {/* Datos del vehículo */}
                <div>
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Datos del vehículo</h4>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="col-span-2 sm:col-span-1 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">N° Unidad *</label>
                      <input
                        type="text"
                        name="numeroUnidad"
                        required
                        placeholder="01, U-05..."
                        value={formData.numeroUnidad}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all shadow-sm placeholder:text-slate-400"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Placa *</label>
                      <input
                        type="text"
                        name="placa"
                        required
                        placeholder="A12B34C"
                        value={formData.placa}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono font-bold text-blue-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal uppercase tracking-wider"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Marca *</label>
                      <input
                        type="text"
                        name="marca"
                        required
                        placeholder="Chevrolet, Toyota..."
                        value={formData.marca}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all shadow-sm placeholder:text-slate-400"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Modelo *</label>
                      <input
                        type="text"
                        name="modelo"
                        required
                        placeholder="NPR, Hilux..."
                        value={formData.modelo}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all shadow-sm placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Año *</label>
                      <input
                        type="text"
                        name="ano"
                        required
                        placeholder="2018"
                        value={formData.ano}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all shadow-sm placeholder:text-slate-400 placeholder:font-sans"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Color *</label>
                      <input
                        type="text"
                        name="color"
                        required
                        placeholder="Blanco, Rojo..."
                        value={formData.color}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all shadow-sm placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Documentación */}
                <div>
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Documentación</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    
                    {/* Póliza RCV */}
                    <div className="p-3 sm:p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                      <h5 className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">Póliza RCV</h5>
                      <div className="space-y-2.5">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Número</label>
                          <input
                            type="text"
                            name="polizaRcvNumero"
                            placeholder="Nro. póliza"
                            value={formData.polizaRcvNumero}
                            onChange={handleInputChange}
                            className="w-full px-3 sm:px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all shadow-sm placeholder:text-slate-400"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vencimiento</label>
                          <input
                            type="date"
                            name="polizaRcvVencimiento"
                            min={getToday()}
                            value={formData.polizaRcvVencimiento}
                            onChange={handleInputChange}
                            className="w-full px-3 sm:px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all shadow-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ROT */}
                    <div className="p-3 sm:p-4 bg-amber-50/50 rounded-xl border border-amber-100 space-y-3">
                      <h5 className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest">ROT</h5>
                      <div className="space-y-2.5">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Número</label>
                          <input
                            type="text"
                            name="rotNumero"
                            placeholder="Nro. ROT"
                            value={formData.rotNumero}
                            onChange={handleInputChange}
                            className="w-full px-3 sm:px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all shadow-sm placeholder:text-slate-400"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vencimiento</label>
                          <input
                            type="date"
                            name="rotVencimiento"
                            min={getToday()}
                            value={formData.rotVencimiento}
                            onChange={handleInputChange}
                            className="w-full px-3 sm:px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all shadow-sm"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="px-5 sm:px-8 py-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-3 bg-white shrink-0">
                <button 
                  type="button" 
                  onClick={cerrarModal}
                  className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isEditing ? 'Guardar cambios' : 'Registrar unidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}