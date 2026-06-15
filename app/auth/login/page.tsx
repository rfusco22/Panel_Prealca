import { LoginForm } from '@/components/auth/login-form';
import Image from 'next/image';

// Importación estática del logo para optimización de caché
import logoPrealca from '@/public/logo.jpeg';

export const metadata = {
  title: 'Iniciar sesión - PREALCA',
  description: 'Accede al Portal de Gestión de Concreto Premezclado de PREALCA',
};

export default function LoginPage() {
  return (
    // Estructura adaptada para ocultar el video en móviles/tabletas verticales y mostrarlo en pantallas grandes (xl)
    <div className="min-h-screen w-full flex flex-col xl:grid xl:grid-cols-12 bg-zinc-50/30 font-sans text-gray-900 overflow-x-hidden select-none">
      
      {/* 1. COLUMNA IZQUIERDA: VIDEO EN VIVO PREMIUM (Visible en Laptops y Monitores Escritorio) */}
      <div className="hidden xl:flex xl:col-span-6 relative flex-col items-center justify-center p-12 bg-white overflow-hidden border-r border-zinc-200">
        
        {/* VIDEO DE FONDO: Concreto líquido en movimiento e infinitivo */}
        <video
  key="login-video" // Agregamos una key para forzar el refresco
  autoPlay
  loop
  muted
  playsInline
  className="absolute inset-0 z-0 w-full h-full object-cover pointer-events-none select-none"
  preload="auto" // Forzamos la precarga
>
  <source src="/login2.mp4" type="video/mp4" />
</video>

        {/* CAPA DE DEGRADADO SUTIL: Añade un acabado premium de iluminación */}
        <div className="absolute inset-0 bg-radial-gradient(circle_at_50%_50%,_transparent_60%,_rgba(255,255,255,0.1)_100%) z-10 pointer-events-none" />

        {/* CONTENEDOR DE ELEMENTOS FLOTANTES (Abajo del logo integrado del video) */}
        <div className="absolute bottom-20 z-20 flex flex-col items-center w-full text-center animate-fade-in duration-1000">
          
          {/* Tag de estado operativo interactivo */}
          {/* <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-bold bg-white/95 border border-zinc-200/80 text-zinc-700 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md transition-all duration-300 hover:scale-[1.02]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            PLANTA AUTOMATIZADA • EN VIVO
          </div> */}
        </div>

        {/* Marcador inferior de pie de página industrial */}
        <div className="absolute bottom-6 left-12 right-12 z-20 flex justify-between text-[10px] font-mono text-zinc-400 tracking-widest bg-white/90 border border-zinc-200/60 backdrop-blur-xs px-4 py-1.5 rounded-xl shadow-xs">
          <span>SISTEMA DE GESTIÓN DE MEZCLAS</span>
          <span>© {new Date().getFullYear()} PREALCA C.A.</span>
        </div>
      </div>

      {/* 2. COLUMNA DERECHA: INTERFAZ DE INGRESO FLEXIBLE (Móvil, Tablet e iPad Pro) */}
      <div className="flex-1 flex xl:col-span-6 items-center justify-center p-6 sm:p-12 md:p-24 bg-white relative">
        
        {/* Fondo limpio y unificado en tabletas */}
        <div className="absolute inset-0 bg-zinc-50/40 xl:hidden z-0" />

        <div className="w-full max-w-md my-auto space-y-8 relative z-10 animate-fade-in-up duration-500">
          
          {/* Cabecera de bienvenida al portal */}
          <div className="space-y-3 text-center">
            
            {/* LOGO PARA DISPOSITIVOS QUE NO MUESTRAN LA COLUMNA DE VIDEO (Móvil e iPad Pro) */}
            <div className="xl:hidden flex flex-col items-center mb-8">
              <div className="relative w-44 h-44 bg-white p-5 rounded-[2rem] border border-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex items-center justify-center transition-transform duration-300 hover:scale-105">
                <Image
                  src={logoPrealca}
                  alt="PREALCA"
                  priority
                  className="object-contain max-w-full max-h-full h-auto w-auto"
                />
              </div>
              <div className="h-1 w-14 bg-red-600 rounded-full mt-4" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight uppercase">
              Iniciar Sesión
            </h1>
            <p className="text-sm text-zinc-500 font-medium">
              ¡Hola! Bienvenido a tu Portal de Gestión <span className="text-red-600 font-bold tracking-wide">PREALCA</span>
            </p>
          </div>

          {/* Bloque contenedor del formulario reactivo */}
          <div className="bg-white xl:bg-transparent rounded-3xl border border-zinc-200/60 xl:border-none p-6 sm:p-10 xl:p-0 shadow-[0_15px_40px_rgba(0,0,0,0.02)] xl:shadow-none transition-all">
            <LoginForm />
          </div>

          {/* PANEL DE CREDENCIALES DE DEMOSTRACIÓN */}
          {/* <div className="bg-zinc-50/80 border border-zinc-200/60 rounded-2xl p-5 transition-all hover:bg-zinc-100/60 shadow-2xs">
            <div className="flex items-center gap-2 mb-3.5">
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                Credenciales del Sistema (Demostración)
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-2 font-mono text-xs text-zinc-600">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-white border border-zinc-200/50 shadow-3xs hover:border-zinc-300 transition-colors">
                <span><strong className="text-zinc-900 font-bold">Admin:</strong> admin@prealca.com</span>
                <span className="text-zinc-400 font-semibold">password123</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-white border border-zinc-200/50 shadow-3xs hover:border-zinc-300 transition-colors">
                <span><strong className="text-zinc-900 font-bold">Registro:</strong> cris@prealca.com</span>
                <span className="text-zinc-400 font-semibold">password123</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-white border border-zinc-200/50 shadow-3xs hover:border-zinc-300 transition-colors">
                <span><strong className="text-zinc-900 font-bold">Doc:</strong> andry@prealca.com</span>
                <span className="text-zinc-400 font-semibold">password123</span>
              </div>
            </div>
          </div> */}

        </div>
      </div>

    </div>
  );
}