import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import Image from 'next/image';
import logoPrealca from '@/public/logo.jpeg';
import bgConcrete from '@/public/bg-concrete.png';

export const metadata = {
  title: 'Recuperar Contraseña - PREALCA',
  description: 'Recupera el acceso a tu cuenta en el Portal de Gestión de PREALCA',
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen w-full flex flex-col xl:grid xl:grid-cols-12 bg-zinc-50/30 font-sans text-gray-900 overflow-x-hidden">
      
      {/* 1. COLUMNA IZQUIERDA: IDENTIDAD VISUAL (Mismo estilo que Login) */}
      <div className="hidden xl:flex xl:col-span-6 relative flex-col items-center justify-center p-12 bg-zinc-900 overflow-hidden border-r border-zinc-200">
        <div className="absolute inset-0 z-0 w-full h-full pointer-events-none">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover object-center scale-[1.05] filter blur-xs brightness-95">
            <source src="/login.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="absolute inset-0 bg-white/10 z-10 backdrop-blur-3xs" />
        
        {/* Logo estático centrado */}
        <div className="relative z-20 w-80 h-80 bg-white border border-zinc-200/80 rounded-[2.5rem] p-8 shadow-2xl flex items-center justify-center">
          <Image src={logoPrealca} alt="PREALCA" priority className="object-contain max-w-full max-h-full" />
        </div>
      </div>

      {/* 2. COLUMNA DERECHA: FORMULARIO DE RECUPERACIÓN */}
      <div className="flex-1 flex xl:col-span-6 items-center justify-center p-6 sm:p-12 md:p-24 bg-white relative">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          
          <div className="space-y-3 text-center md:text-left">
            <h1 className="text-3xl font-black text-zinc-900 uppercase">¿Olvidaste tu contraseña?</h1>
            <p className="text-sm text-zinc-500 font-medium">
              Ingresa el correo electrónico asociado a tu cuenta y te enviaremos las instrucciones para restablecer tu acceso.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-zinc-200/60 p-6 sm:p-10 shadow-sm">
             <ForgotPasswordForm />
          </div>

          <a href="/login" className="block text-center text-xs font-bold text-zinc-400 hover:text-red-600 transition-colors uppercase tracking-widest">
            ← Volver al inicio de sesión
          </a>
        </div>
      </div>
    </div>
  );
}