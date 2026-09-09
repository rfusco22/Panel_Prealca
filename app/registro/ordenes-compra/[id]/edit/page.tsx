'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { OrdenCompraForm, OrdenCompraInitialData } from '@/components/forms/orden-compra-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { aFechaInput } from '@/lib/fecha';

export default function EditOrdenCompraPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [initialData, setInitialData] = useState<OrdenCompraInitialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/orden-compra?id=${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success || !d.orden) {
          setNotFound(true);
          return;
        }
        const o = d.orden;
        setInitialData({
          id: o.id,
          fecha: aFechaInput(o.fecha),
          tipo: o.tipo,
          proveedorId: o.proveedorId,
          productoId: o.productoId,
          cantidadM3: Number(o.cantidadM3),
          precioM3: Number(o.precioM3),
          ivaAplicado: !!o.ivaAplicado,
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: any) => {
    const res = await fetch('/api/orden-compra', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!result.success) {
      throw new Error(result.error || 'Error al actualizar orden de compra');
    }

    router.push('/registro/ordenes-compra');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/registro/ordenes-compra">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
            <ChevronLeft size={20} />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Editar Orden de Compra</h1>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          <Loader2 className="animate-spin mx-auto mb-3" size={24} />
          Cargando orden de compra...
        </div>
      ) : notFound || !initialData ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          No se encontró la orden de compra.
        </div>
      ) : (
        <OrdenCompraForm onSubmit={handleSubmit} initialData={initialData} />
      )}
    </div>
  );
}
