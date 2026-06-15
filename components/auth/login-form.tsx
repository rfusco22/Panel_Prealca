'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Asegúrate de importar Link

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulación de autenticación profesional y fluida
    setTimeout(() => {
      if (email && password) {
        // Simular éxito con redirección
        console.log('Autenticado en PREALCA:', { email });
        setIsLoading(false);
        // router.push('/dashboard'); // Descomentar cuando tengas la ruta lista
      } else {
        setError('Por favor, introduce credenciales válidas.');
        setIsLoading(false);
      }
    }, 1800); // Retraso intencional para lucir la animación de carga industrial
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
        <div className="flex justify-between items-center">
  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
    Contraseña
  </label>
  {/* CAMBIA ESTO: */}
  <Link 
    href="/auth/forget" 
    className="text-xs font-semibold text-zinc-400 hover:text-red-600 transition-colors"
  >
    ¿La olvidaste?
  </Link>
</div>
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

      {/* Recordar sesión Checkbox */}
      <div className="flex items-center space-x-2 py-1">
        <input
          type="checkbox"
          id="remember"
          className="w-4 h-4 rounded border-zinc-300 text-red-600 focus:ring-red-500/20 accent-red-500 cursor-pointer"
        />
        <label htmlFor="remember" className="text-xs font-medium text-zinc-500 cursor-pointer select-none">
          Mantener sesión activa en esta estación
        </label>
      </div>

      {/* Botón de Envío Súper Animado */}
      <button
        type="submit"
        disabled={isLoading}
        className="relative w-full h-12 overflow-hidden bg-zinc-900 text-white font-bold text-sm tracking-wide uppercase rounded-xl transition-all duration-300 hover:bg-red-600 active:scale-[0.99] disabled:pointer-events-none shadow-lg shadow-zinc-900/10 hover:shadow-red-600/20"
      >
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
            {/* Texto de carga industrial */}
            <span className="text-[10px] font-black tracking-widest text-zinc-400 animate-pulse">
              CONECTANDO CON PLANTA...
            </span>
            {/* Línea de carga fluida tipo flujo de concreto */}
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