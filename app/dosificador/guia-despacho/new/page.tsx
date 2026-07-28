'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GuiaDespachoForm } from '@/components/forms/guia-despacho-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { printDocument, generateGuiaDespachoHtml } from '@/lib/document-templates';

export default function NewGuiaDespachoPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Array<{ id: number; nombre: string; rif?: string; direccion?: string }>>([]);
  const [productos, setProductos] = useState<Array<{ id: number; nombre: string; resistencia?: string }>>([]);
  const [unidades, setUnidades] = useState<Array<{ id: number; nombre: string; tipo: string; placa?: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchClientes();
    fetchProductos();
    fetchUnidades();
  }, []);

  const fetchClientes = async () => {
    try {
      const res = await fetch('/api/clientes');
      const data = await res.json();
      if (data.success) setClientes(data.clientes);
    } catch (err) {
      console.error('[v0] Error loading clientes:', err);
    }
  };

  const fetchProductos = async () => {
    try {
      const res = await fetch('/api/productos');
      const data = await res.json();
      setProductos(Array.isArray(data) ? data : data.productos || []);
    } catch (err) {
      console.error('[v0] Error loading productos:', err);
    }
  };

  const fetchUnidades = async () => {
    try {
      const res = await fetch('/api/unidades');
      const data = await res.json();
      setUnidades(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[v0] Error loading unidades:', err);
    }
  };

  const handleSubmit = async (formData: any) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/guia-despacho', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || 'Error al crear guía de despacho');
      }

      const cliente = clientes.find(c => c.id === Number(formData.clienteId));
      const producto = productos.find(p => p.id === Number(formData.productoId));
      const unidad = unidades.find(u => u.id === Number(formData.unidadId));
      const subtotal = Number(formData.cantidadM3) * Number(formData.precioM3);

      printDocument(generateGuiaDespachoHtml({
        guiaNumber: `GD-${result.id}`,
        fecha: new Date().toISOString(),
        clienteNombre: cliente?.nombre || 'N/A',
        clienteRif: cliente?.rif || 'N/A',
        clienteDireccion: cliente?.direccion || 'N/A',
        chofer: formData.chofer || 'N/A',
        placa: unidad?.placa || 'N/A',
        items: [{
          nombreProducto: producto?.nombre || formData.tipo,
          cantidad: Number(formData.cantidadM3),
          unidadMedida: 'M³',
          precioUnitario: Number(formData.precioM3),
          subtotalItem: subtotal,
        }],
        total: Number(formData.total),
      }));

      router.push('/dosificador/guia-despacho');
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/dosificador/guia-despacho">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
            <ChevronLeft size={20} />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Nueva Guía de Despacho</h1>
      </div>

      <GuiaDespachoForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        clientes={clientes}
        productos={productos}
        unidades={unidades}
      />
    </div>
  );
}
