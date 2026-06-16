import { RegisterForm } from '@/components/auth/register-form';

export default function RegistroPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl">
        <h1 className="text-2xl font-black uppercase mb-6">Crear Nuevo Usuario</h1>
        <RegisterForm />
      </div>
    </div>
  );
}