'use client';

import { useRouter } from 'next/navigation';
import { OrdenCompraForm } from '@/components/forms/orden-compra-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { printDocument, generateOrdenCompraHtml } from '@/lib/document-templates';

export default function NewOrdenCompraPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const res = await fetch('/api/orden-compra', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!result.success) {
      throw new Error(result.error || 'Error al crear orden de compra');
    }

    const proveedorRes = await fetch(`/api/proveedores?id=${data.proveedorId}`);
    const proveedorData = await proveedorRes.json();
    const proveedor = proveedorData.proveedor || proveedorData;
    const productoRes = await fetch('/api/productos');
    const productoData = await productoRes.json();
    const productos = Array.isArray(productoData) ? productoData : productoData.productos || [];
    const producto = productos.find((p: any) => p.id === Number(data.productoId));

    const subtotal = Number(data.cantidadM3) * Number(data.precioM3);

    printDocument(generateOrdenCompraHtml({
      poNumber: `OC-${result.id}`,
      fecha: data.fecha || new Date().toISOString(),
      tipo: data.tipo,
      proveedorNombre: proveedor.nombre || 'N/A',
      proveedorRif: proveedor.rif || 'N/A',
      proveedorDireccion: proveedor.direccion || 'N/A',
      proveedorContacto: proveedor.contacto || 'N/A',
      proveedorTelefono: proveedor.telefono || 'N/A',
      items: [{
        nombreMaterial: producto?.nombre || data.tipo,
        cantidad: Number(data.cantidadM3),
        unidadMedida: 'M³',
        precioUnitario: Number(data.precioM3),
        subtotalItem: subtotal,
      }],
      total: Number(data.total),
    }));

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
        <h1 className="text-3xl font-bold text-gray-900">Nueva Orden de Compra</h1>
      </div>

      <OrdenCompraForm onSubmit={handleSubmit} />
    </div>
  );
}
