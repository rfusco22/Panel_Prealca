'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FacturaForm, FacturaInitialData, splitFormaPago } from '@/components/forms/factura-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { aFechaInput } from '@/lib/fecha';

export default function EditFacturaPage() {
  const params = useParams();
  const id = params.id as string;

  const [initialData, setInitialData] = useState<FacturaInitialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/facturas?id=${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success || !d.factura) {
          setNotFound(true);
          return;
        }
        const f = d.factura;
        const { tipoPago, metodoPago } = splitFormaPago(f.formaPago);
        setInitialData({
          id: f.id,
          clienteId: String(f.clienteId),
          guiaDespachoId: f.guiaDespachoId ? String(f.guiaDespachoId) : undefined,
          tipoPago,
          metodoPago,
          comprobanteRetencion: f.comprobanteRetencion || '',
          subtotal: Number(f.subtotal) || 0,
          fechaVencimiento: aFechaInput(f.fechaVencimiento),
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/registro/facturas">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
            <ChevronLeft size={20} />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Editar Factura</h1>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          <Loader2 className="animate-spin mx-auto mb-3" size={24} />
          Cargando factura...
        </div>
      ) : notFound || !initialData ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          No se encontró la factura.
        </div>
      ) : (
        <FacturaForm initialData={initialData} />
      )}
    </div>
  );
}
