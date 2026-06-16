'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RegisterForm() {
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    nombre: '', 
    role: 'registro' // Valor por defecto
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/auth/crear_users', {
      method: 'POST',
      body: JSON.stringify(formData),
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      alert('Usuario creado con éxito');
      router.push('/auth/login');
    } else {
      const data = await res.json();
      alert(data.error || 'Error al crear usuario');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre */}
      <div>
        <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Nombre Completo</label>
        <input 
          required 
          className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-red-600 outline-none transition-all"
          onChange={(e) => setFormData({...formData, nombre: e.target.value})}
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Correo Electrónico</label>
        <input 
          type="email" 
          required 
          className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-red-600 outline-none transition-all"
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
      </div>

      {/* Contraseña */}
      <div>
        <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Contraseña</label>
        <input 
          type="password" 
          required 
          className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-red-600 outline-none transition-all"
          onChange={(e) => setFormData({...formData, password: e.target.value})}
        />
      </div>

      {/* Rol */}
      <div>
        <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1">Rol de Acceso</label>
        <select 
          className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-red-600 outline-none transition-all font-bold text-zinc-700"
          value={formData.role}
          onChange={(e) => setFormData({...formData, role: e.target.value})}
        >
          <option value="registro">Operador de Registro</option>
          <option value="documentador">Documentador</option>
          <option value="admin">Administrador</option>
        </select>
      </div>

      {/* Botón */}
      <button 
        disabled={loading}
        className="w-full h-12 bg-zinc-900 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all active:scale-[0.99] disabled:opacity-50"
      >
        {loading ? 'Procesando registro...' : 'Registrarse en Sistema'}
      </button>
    </form>
  );
}