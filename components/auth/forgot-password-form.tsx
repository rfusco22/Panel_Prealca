'use client';

import { useState } from 'react';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    // Aquí iría tu llamada a la API
    setTimeout(() => setStatus('success'), 2000);
  };

  if (status === 'success') {
    return (
      <div className="text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          ✓
        </div>
        <h3 className="font-bold text-zinc-900">Correo enviado</h3>
        <p className="text-xs text-zinc-500">Revisa tu bandeja de entrada. Hemos enviado un enlace para restablecer tu contraseña.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase text-zinc-500">Correo Electrónico</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-zinc-200 focus:border-red-600 focus:ring-4 focus:ring-red-600/10 outline-none transition-all"
          placeholder="usuario@prealca.com"
        />
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full h-12 bg-zinc-900 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
      >
        {status === 'loading' ? 'Enviando...' : 'Enviar instrucciones'}
      </button>
    </form>
  );
}