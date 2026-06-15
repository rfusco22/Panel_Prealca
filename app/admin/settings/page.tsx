'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const [exchangeRate, setExchangeRate] = useState<number>(35.0);
  const [manualRate, setManualRate] = useState<string>('35.0');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSaveRate = async () => {
    try {
      const rate = parseFloat(manualRate);
      if (isNaN(rate) || rate <= 0) {
        setSaveMessage('Por favor ingresa una tasa válida');
        return;
      }

      setExchangeRate(rate);
      setSaveMessage('Tasa de cambio actualizada correctamente');

      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage('Error al guardar la tasa');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Tasa de Cambio</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tasa Actual (Bs / $)
            </label>
            <p className="text-3xl font-bold text-blue-600">{exchangeRate.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">
              Esta tasa se utiliza para convertir montos en Bolívares a Dólares
            </p>
          </div>

          <div className="pt-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-4">Usar Tasa Manual</h3>
            <p className="text-sm text-gray-600 mb-4">
              Si prefieres no usar la API de tasas en tiempo real, puedes establecer una tasa manual:
            </p>

            <div className="flex gap-4">
              <input
                type="number"
                value={manualRate}
                onChange={(e) => setManualRate(e.target.value)}
                placeholder="Ingresa la tasa"
                step="0.01"
                min="0"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={handleSaveRate}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Guardar
              </Button>
            </div>

            {saveMessage && (
              <p className={`text-sm mt-2 ${
                saveMessage.includes('Error')
                  ? 'text-red-600'
                  : 'text-green-600'
              }`}>
                {saveMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuración de IVA</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Porcentaje de IVA
            </label>
            <p className="text-2xl font-semibold text-gray-900">16%</p>
            <p className="text-xs text-gray-500 mt-1">
              Se aplica a ingresos, egresos, guías y facturas (cuando está habilitado)
            </p>
          </div>

          <div className="pt-6 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Porcentaje de Retención (Contribuyentes Especiales)
            </label>
            <p className="text-2xl font-semibold text-gray-900">75%</p>
            <p className="text-xs text-gray-500 mt-1">
              Se retiene el 75% del IVA para clientes contribuyentes especiales
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Información del Sistema</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>Aplicación:</strong> PREALCA - Sistema de Gestión Empresarial</p>
          <p><strong>Versión:</strong> 1.0.0</p>
          <p><strong>Base de Datos:</strong> MySQL</p>
          <p><strong>API de Tasas:</strong> Integrada (Open Exchange Rates)</p>
          <p><strong>Última Sincronización:</strong> Hoy a las {new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-semibold text-yellow-900 mb-2">Configuraciones Futuras</h3>
        <ul className="list-disc list-inside text-yellow-800 space-y-1 text-sm">
          <li>Configurar logo y datos de empresa</li>
          <li>Personalizar plantillas de facturas</li>
          <li>Gestionar usuarios y permisos avanzados</li>
          <li>Sincronización con sistemas contables</li>
          <li>Backups automáticos</li>
        </ul>
      </div>
    </div>
  );
}
