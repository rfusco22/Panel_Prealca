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
        
        const userRole = data.role || data.user?.role;

        if (userRole === 'registro') {
          window.location.href = '/registro';
        } else if (userRole === 'admin') {
          window.location.href = '/admin';
        } else if (userRole === 'dosificador') {
          window.location.href = '/dosificador';
        } else if (data.redirect && data.redirect !== '/login') {
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
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      {error && (
        <div className="p-4 text-sm font-semibold bg-red-50 text-red-600 border border-red-200 rounded-2xl animate-fade-in flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
          Correo Electrónico
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="usuario@prealca.com"
          required
          disabled={isLoading}
          className="w-full h-14 px-5 rounded-2xl border-2 border-zinc-200 bg-white text-sm font-medium transition-all outline-none placeholder:text-zinc-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 disabled:opacity-60"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={isLoading}
          className="w-full h-14 px-5 rounded-2xl border-2 border-zinc-200 bg-white text-sm font-medium transition-all outline-none placeholder:text-zinc-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="relative w-full h-14 overflow-hidden bg-zinc-900 text-white font-bold text-sm tracking-wide uppercase rounded-2xl transition-all duration-300 hover:bg-red-600 active:scale-[0.98] disabled:pointer-events-none shadow-xl shadow-zinc-900/20 hover:shadow-red-600/30"
      >
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
            <span className="text-[11px] font-black tracking-widest text-zinc-400 animate-pulse">
              CONECTANDO...
            </span>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-zinc-800 overflow-hidden">
              <div className="h-full w-1/3 bg-red-500 animate-progress-bar" />
            </div>
          </div>
        ) : (
          <span className="flex items-center justify-center gap-3">
            Ingresar al Sistema
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        )}
      </button>
    </form>
  );
}
