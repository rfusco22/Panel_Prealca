import { LoginForm } from '@/components/auth/login-form';

export const metadata = {
  title: 'Iniciar sesión - PREALCA',
  description: 'Accede a tu cuenta de PREALCA',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">PREALCA</h1>
            <p className="text-gray-600">Sistema de Gestión Empresarial</p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Iniciar sesión</h2>
            <LoginForm />
          </div>

          <div className="border-t pt-6 text-center text-sm text-gray-600">
            <p>Credenciales de demostración:</p>
            <div className="mt-3 space-y-1 text-xs bg-gray-50 p-3 rounded">
              <p><strong>Admin:</strong> admin@prealca.com / password123</p>
              <p><strong>Registro:</strong> cris@prealca.com / password123</p>
              <p><strong>Documentador:</strong> andry@prealca.com / password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
