'use client';

import { useState } from 'react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (res.ok) {
        console.log('Éxito, datos recibidos:', data);
        
        // Extraemos el rol (ajusta "data.role" o "data.user.role" según lo que devuelva tu API)
        const userRole = data.role || data.user?.role;

        // REDIRECCIÓN EXPLÍCITA POR ROL
        if (userRole === 'registro') {
          window.location.href = '/registro';
        } else if (userRole === 'admin') {
          window.location.href = '/admin';
        } else if (userRole === 'dosificador') {
          window.location.href = '/dosificador';
        } else if (data.redirect && data.redirect !== '/login') {
          // Fallback al redirect de la API solo si no es el "/login" erróneo
          window.location.href = data.redirect;
        } else {
          window.location.href = '/';
        }

      } else {
        setError(data.error || 'Credenciales inválidas.');
      }
    } catch (err) {
      setError('Error de conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-left">
      {error && (
        <div className="p-3 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 rounded-xl animate-fade-in">
          ⚠️ {error}
        </div>
      )}

      {/* Input de Email */}
      <div className="space-y-1.5 group">
        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 transition-colors group-focus-within:text-red-500">
          Correo Electrónico
        </label>
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@prealca.com"
            required
            disabled={isLoading}
            className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm font-medium transition-all outline-none placeholder:text-zinc-400 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 disabled:opacity-60"
          />
        </div>
      </div>

      {/* Input de Contraseña */}
      <div className="space-y-1.5 group">
        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          Contraseña
        </label>
        <div className="relative">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isLoading}
            className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm font-medium transition-all outline-none placeholder:text-zinc-400 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 disabled:opacity-60"
          />
        </div>
      </div>

      {/* Botón de Envío Súper Animado */}
      <button
        type="submit"
        disabled={isLoading}
        className="relative w-full h-12 overflow-hidden bg-zinc-900 text-white font-bold text-sm tracking-wide uppercase rounded-xl transition-all duration-300 hover:bg-red-600 active:scale-[0.99] disabled:pointer-events-none shadow-lg shadow-zinc-900/10 hover:shadow-red-600/20"
      >
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
            <span className="text-[10px] font-black tracking-widest text-zinc-400 animate-pulse">
              CONECTANDO CON PLANTA...
            </span>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-zinc-800 overflow-hidden">
              <div className="h-full w-1/3 bg-red-500 animate-progress-bar" />
            </div>
          </div>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Ingresar al Sistema
            <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        )}
      </button>
    </form>
  );
}