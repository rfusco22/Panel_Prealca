'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { Button } from '@/components/ui/button';
import { Plus, X, Landmark, Trash2, Edit2, AlertCircle, Building2, ChevronDown, Check } from 'lucide-react';
import Image from 'next/image';

interface Banco {
  id: number;
  nombreBanco: string;
  numeroCuenta: string;
  titularCuenta: string;
  cedula: string;
}

const BANCOS_LIST = [
  { code: '0102', name: 'Banco de Venezuela (BDV)' },
  { code: '0163', name: 'Banco del Tesoro' },
  { code: '0166', name: 'Banco Agrícola de Venezuela' },
  { code: '0175', name: 'Banco Bicentenario del Pueblo' },
  { code: '0177', name: 'BANFANB' },
  { code: '0001', name: 'Banco Central de Venezuela' },
  { code: '0601', name: 'Instituto Municipal de Crédito Popular' },
  { code: '0104', name: 'Banco Venezolano de Crédito' },
  { code: '0105', name: 'Banco Mercantil' },
  { code: '0108', name: 'BBVA Provincial' },
  { code: '0114', name: 'Bancaribe' },
  { code: '0115', name: 'Banco Exterior' },
  { code: '0128', name: 'Banco Caroní' },
  { code: '0134', name: 'Banesco' },
  { code: '0137', name: 'Banco Sofitasa' },
  { code: '0138', name: 'Banco Plaza' },
  { code: '0146', name: 'Bangente' },
  { code: '0151', name: 'BFC Banco Fondo Común' },
  { code: '0156', name: '100% Banco' },
  { code: '0157', name: 'Del Sur' },
  { code: '0168', name: 'Bancrecer' },
  { code: '0169', name: 'Mi Banco' },
  { code: '0171', name: 'Banco Activo' },
  { code: '0172', name: 'Bancamiga' },
  { code: '0173', name: 'Banco Internacional de Desarrollo' },
  { code: '0174', name: 'Banplus' },
  { code: '0190', name: 'Citibank N.A.' },
  { code: '0191', name: 'BNC' },
];

// Métodos de pago que no son bancos venezolanos: no tienen código de 4
// dígitos ni cuenta de 16 dígitos, así que el número de cuenta se captura
// como texto libre (correo, teléfono, usuario, etc).
const METODOS_ESPECIALES = [
  { code: 'ZELLE', name: 'Zelle', special: true },
  { code: 'BINANCE', name: 'Binance', special: true },
];

const TODAS_LAS_OPCIONES = [...BANCOS_LIST, ...METODOS_ESPECIALES];

export default function RegistroBancosPage() {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBankSelectOpen, setIsBankSelectOpen] = useState(false);
  
  // Nuevos estados para edición
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const selectRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();

  const [formData, setFormData] = useState({
    bancoCodigo: '',
    numeroCuentaSufijo: '', 
    titularCuenta: '',
    documentoTipo: 'V', 
    documentoNumero: ''
  });

  useEffect(() => {
    fetchBancos();
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsBankSelectOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchBancos();
    };

    socket.on("bancos:created", handleUpdate);
    socket.on("bancos:updated", handleUpdate);
    socket.on("bancos:deleted", handleUpdate);

    return () => {
      socket.off("bancos:created", handleUpdate);
      socket.off("bancos:updated", handleUpdate);
      socket.off("bancos:deleted", handleUpdate);
    };
  }, [socket]);

  const fetchBancos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/bancos');
      if (!res.ok) throw new Error('Error al cargar bancos');
      const data = await res.json();
      setBancos(data);
    } catch (err) {
      setError('Error al cargar cuentas bancarias');
    } finally {
      setLoading(false);
    }
  };

  const handleTitularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    setFormData(prev => ({ ...prev, titularCuenta: value }));
  };

  const handleCuentaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 16);
    setFormData(prev => ({ ...prev, numeroCuentaSufijo: value }));
  };

  // Para Zelle/Binance el "número de cuenta" es texto libre (correo, teléfono,
  // usuario), no dígitos con longitud fija como en un banco venezolano.
  const handleCuentaEspecialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, numeroCuentaSufijo: e.target.value }));
  };

  const handleDocumentoNumeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, documentoNumero: value }));
  };

  const handleDocumentoTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, documentoTipo: e.target.value }));
  };

  const selectBank = (code: string) => {
    setFormData(prev => ({ ...prev, bancoCodigo: code }));
    setIsBankSelectOpen(false);
  };

  // --- LÓGICA DE EDICIÓN ---
  const handleEdit = (banco: Banco) => {
    // 1. Extraemos las partes. Zelle/Binance no llevan el prefijo de 4
    // dígitos de un banco venezolano: el número de cuenta completo es el
    // "sufijo" (correo, teléfono, usuario).
    const especial = METODOS_ESPECIALES.find(m => m.name === banco.nombreBanco);
    const prefix = especial ? especial.code : banco.numeroCuenta.substring(0, 4);
    const sufijo = especial ? banco.numeroCuenta : banco.numeroCuenta.substring(4);

    // Asumiendo formato "V-12345678"
    const docParts = banco.cedula.split('-');
    const docTipo = docParts.length > 1 ? docParts[0] : 'V';
    const docNum = docParts.length > 1 ? docParts[1] : banco.cedula;

    // 2. Llenamos el formulario
    setFormData({
      bancoCodigo: prefix,
      numeroCuentaSufijo: sufijo,
      titularCuenta: banco.titularCuenta,
      documentoTipo: docTipo,
      documentoNumero: docNum
    });

    // 3. Activamos modo edición y abrimos modal
    setEditingId(banco.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bancoCodigo) return alert("Por favor selecciona un banco.");

    const bancoSeleccionado = TODAS_LAS_OPCIONES.find(b => b.code === formData.bancoCodigo);
    const esEspecial = 'special' in (bancoSeleccionado || {}) && (bancoSeleccionado as any).special;

    if (esEspecial) {
      if (!formData.numeroCuentaSufijo.trim()) return alert("Ingresa el correo, teléfono o usuario de la cuenta.");
    } else if (formData.numeroCuentaSufijo.length !== 16) {
      return alert("Faltan dígitos en el número de cuenta.");
    }
    if (!formData.documentoNumero) return alert("Ingresa el número de Cédula/RIF.");

    const payload = {
      nombreBanco: bancoSeleccionado?.name || 'Desconocido',
      numeroCuenta: esEspecial ? formData.numeroCuentaSufijo.trim() : `${formData.bancoCodigo}${formData.numeroCuentaSufijo}`,
      titularCuenta: formData.titularCuenta.trim(),
      cedula: `${formData.documentoTipo}-${formData.documentoNumero}`
    };

    try {
      if (isEditing && editingId) {
        // ACTUALIZAR (PUT)
        const res = await fetch('/api/bancos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload })
        });
        if (!res.ok) throw new Error('Error al actualizar el banco');
        
        // Actualizar la tabla visualmente
        setBancos(bancos.map(b => b.id === editingId ? { id: editingId, ...payload } : b));
      } else {
        // CREAR (POST)
        const res = await fetch('/api/bancos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Error al guardar el banco');
        const data = await res.json();
        
        setBancos([{ id: data.id, ...payload }, ...bancos]);
      }
      cerrarModal();
    } catch (err) {
      setError(`Error al ${isEditing ? 'actualizar' : 'registrar'} el banco`);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar esta cuenta bancaria?')) {
      try {
        const res = await fetch(`/api/bancos?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Error al eliminar');
        setBancos(bancos.filter(b => b.id !== id));
      } catch (err) {
        setError('No se pudo eliminar el banco');
      }
    }
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData({ bancoCodigo: '', numeroCuentaSufijo: '', titularCuenta: '', documentoTipo: 'V', documentoNumero: '' });
  };

  const selectedBankData = TODAS_LAS_OPCIONES.find(b => b.code === formData.bancoCodigo);
  const esMetodoEspecial = !!(selectedBankData as any)?.special;

  return (
    <div className="max-w-6xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Cuentas Bancarias</h1>
          <p className="text-slate-500 mt-1">Gestiona las cuentas donde recibes los pagos de tus clientes.</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm px-5 py-2.5 flex items-center gap-2 transition-all font-medium"
        >
          <Plus size={18} />
          Nueva Cuenta
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 text-sm font-medium border border-red-100">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full mx-auto mb-4"></div>
          </div>
        ) : bancos.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Landmark className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Sin cuentas registradas</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
              Registra tu primera cuenta para empezar a operar.
            </p>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" className="rounded-lg shadow-sm">
              Registrar cuenta
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Banco</th>
                  <th className="px-6 py-4">Número de Cuenta</th>
                  <th className="px-6 py-4">Titular</th>
                  <th className="px-6 py-4">Documento</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bancos.map((banco) => {
                  const prefix = banco.numeroCuenta.substring(0, 4);

                  return (
                  <tr key={banco.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                      {/* Logo en la tabla */}
                      <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-center shrink-0 overflow-hidden p-1">
                        <Image 
                          src={`/bancos/${prefix}.png`} 
                          alt={banco.nombreBanco} 
                          width={28} 
                          height={28} 
                          className="object-contain w-full h-full"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                        />
                      </div>
                      {banco.nombreBanco}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-600 tracking-wide">{banco.numeroCuenta}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{banco.titularCuenta}</td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-500">{banco.cedula}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        
                        {/* BOTÓN EDITAR CONECTADO */}
                        <button 
                          onClick={() => handleEdit(banco)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>

                        <button onClick={() => handleDelete(banco.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL PREMIUM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={cerrarModal}></div>

          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            
            {/* Header del Modal */}
            <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                {/* Título Dinámico */}
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {isEditing ? 'Editar cuenta' : 'Añadir nueva cuenta'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {isEditing ? 'Modifica los datos bancarios del registro.' : 'Ingresa los datos bancarios para registro oficial.'}
                </p>
              </div>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-7">
              
              {/* 1. Selector de Banco */}
              <div className="space-y-2.5 relative" ref={selectRef}>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Institución Bancaria
                </label>
                
                <div 
                  onClick={() => setIsBankSelectOpen(!isBankSelectOpen)}
                  className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl cursor-pointer flex items-center justify-between hover:border-slate-300 transition-all shadow-sm"
                >
                  {selectedBankData ? (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-lg border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-1">
                        {esMetodoEspecial ? (
                          <Building2 className="w-5 h-5 text-slate-400" />
                        ) : (
                          <Image
                            src={`/bancos/${selectedBankData.code}.png`}
                            alt={selectedBankData.name}
                            width={36}
                            height={36}
                            className="object-contain w-full h-full"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                      </div>
                      <span className="text-base font-semibold text-slate-900">
                        {esMetodoEspecial ? selectedBankData.name : `${selectedBankData.code} - ${selectedBankData.name}`}
                      </span>
                    </div>
                  ) : (
                    <span className="text-base text-slate-400">Seleccionar institución...</span>
                  )}
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isBankSelectOpen ? 'rotate-180' : ''}`} />
                </div>

                {/* Dropdown Options */}
                {isBankSelectOpen && (
                  <div className="absolute top-[84px] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-[320px] overflow-y-auto py-2 animate-in fade-in">
                    {BANCOS_LIST.map((banco) => (
                      <div
                        key={banco.code}
                        onClick={() => selectBank(banco.code)}
                        className="px-5 py-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-lg border border-slate-100 shadow-sm flex items-center justify-center overflow-hidden shrink-0 p-1 opacity-90 group-hover:opacity-100 transition-opacity">
                            <Image
                              src={`/bancos/${banco.code}.png`}
                              alt={banco.name}
                              width={36}
                              height={36}
                              className="object-contain w-full h-full"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          </div>
                          <span className="text-base font-medium text-slate-700 group-hover:text-slate-900">
                            <span className="text-slate-400 mr-2 font-mono">{banco.code}</span>
                            {banco.name}
                          </span>
                        </div>
                        {formData.bancoCodigo === banco.code && <Check className="w-5 h-5 text-slate-800" />}
                      </div>
                    ))}
                    <div className="my-2 border-t border-slate-100" />
                    <div className="px-5 pt-1 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Otros métodos</div>
                    {METODOS_ESPECIALES.map((metodo) => (
                      <div
                        key={metodo.code}
                        onClick={() => selectBank(metodo.code)}
                        className="px-5 py-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5 text-slate-400" />
                          </div>
                          <span className="text-base font-medium text-slate-700 group-hover:text-slate-900">{metodo.name}</span>
                        </div>
                        {formData.bancoCodigo === metodo.code && <Check className="w-5 h-5 text-slate-800" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Número de Cuenta */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {esMetodoEspecial ? 'Correo, teléfono o usuario' : 'Número de Cuenta'}
                  </label>
                  {!esMetodoEspecial && (
                    <span className="text-xs font-semibold text-slate-400">
                      {formData.numeroCuentaSufijo.length} / 16 dígitos
                    </span>
                  )}
                </div>

                <div className={`flex rounded-xl border transition-all shadow-sm overflow-hidden ${
                  formData.bancoCodigo
                    ? 'border-slate-200 focus-within:border-slate-800 focus-within:ring-1 focus-within:ring-slate-800 bg-white'
                    : 'border-slate-100 bg-slate-50/50'
                }`}>
                  {esMetodoEspecial ? (
                    <input
                      type="text"
                      required
                      placeholder="Ej: correo@ejemplo.com o +58 412 0000000"
                      value={formData.numeroCuentaSufijo}
                      onChange={handleCuentaEspecialChange}
                      className="flex-1 px-5 py-3.5 bg-transparent focus:outline-none text-base text-slate-900 placeholder:text-slate-400"
                    />
                  ) : formData.bancoCodigo ? (
                    <>
                      <div className="px-5 py-3.5 bg-slate-50 border-r border-slate-200 text-slate-500 font-mono text-base flex items-center select-none font-semibold">
                        {formData.bancoCodigo}
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="0000000000000000"
                        value={formData.numeroCuentaSufijo}
                        onChange={handleCuentaChange}
                        className="flex-1 px-4 py-3.5 bg-transparent focus:outline-none font-mono text-base tracking-widest text-slate-900"
                      />
                    </>
                  ) : (
                    <div className="px-5 py-3.5 text-base text-slate-400 w-full select-none">
                      Seleccione una institución primero
                    </div>
                  )}
                </div>
              </div>

              {/* Fila Dividida: Titular y Documento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 3. Titular */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Titular de la Cuenta
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: PREALCA C.A."
                    value={formData.titularCuenta}
                    onChange={handleTitularChange}
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all text-base font-medium text-slate-900 shadow-sm placeholder:text-slate-400"
                  />
                </div>

                {/* 4. Cédula/RIF */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Documento de Identidad
                  </label>
                  <div className="flex rounded-xl border border-slate-200 focus-within:border-slate-800 focus-within:ring-1 focus-within:ring-slate-800 transition-all shadow-sm bg-white overflow-hidden">
                    <div className="relative border-r border-slate-200 bg-slate-50">
                      <select
                        value={formData.documentoTipo}
                        onChange={handleDocumentoTipoChange}
                        className="h-full pl-4 pr-8 py-3.5 bg-transparent font-bold text-base text-slate-700 focus:outline-none cursor-pointer appearance-none"
                      >
                        <option value="V">V</option>
                        <option value="J">J</option>
                        <option value="E">E</option>
                        <option value="P">P</option>
                        <option value="G">G</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="123456789"
                      value={formData.documentoNumero}
                      onChange={handleDocumentoNumeroChange}
                      className="flex-1 px-4 py-3.5 bg-transparent focus:outline-none font-mono text-base tracking-wide text-slate-900 placeholder:text-slate-400 placeholder:font-sans"
                    />
                  </div>
                </div>

              </div>

              {/* Actions */}
              <div className="pt-4 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3 border-t border-slate-100 mt-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={cerrarModal}
                  className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl px-6 py-6 text-base font-medium w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-8 py-6 shadow-md transition-all text-base font-medium w-full sm:w-auto"
                >
                  {isEditing ? 'Guardar cambios' : 'Guardar registro'}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}