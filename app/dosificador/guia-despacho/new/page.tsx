'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GuiaDespachoForm } from '@/components/forms/guia-despacho-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { printDocument, generateGuiaDespachoHtml, generatePrealcaHtml } from '@/lib/document-templates';

export default function NewGuiaDespachoPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Array<{ id: number; nombre: string; rif?: string; direccion?: string; telefono?: string }>>([]);
  // Refleja lo que devuelve GET /api/productos: id, resistencia, pulgada, unidad.
  // No trae "nombre", por eso es opcional y se arma a partir de los otros campos.
  const [productos, setProductos] = useState<Array<{ id: number; nombre?: string; resistencia?: string; pulgada?: string; unidad?: string }>>([]);
  const [unidades, setUnidades] = useState<Array<{ id: number; nombre: string; tipo: string; placa?: string }>>([]);
  const [choferes, setChoferes] = useState<Array<{ id: number; nombre: string }>>([]);
  const [pedidos, setPedidos] = useState<Array<{ id: number; clienteId: number; clienteNombre: string; productoId: number; productoNombre: string; totalM3: number; acumuladoM3: number; obra: string | null }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchClientes();
    fetchProductos();
    fetchUnidades();
    fetchChoferes();
    fetchPedidos();
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
      const raw = Array.isArray(data) ? data : [];
      setUnidades(raw.map((u: any) => ({
        id: u.id,
        nombre: u.marca || u.numeroUnidad || '',
        tipo: u.placa || '',
        placa: u.placa || '',
      })));
    } catch (err) {
      console.error('[v0] Error loading unidades:', err);
    }
  };

  const fetchChoferes = async () => {
    try {
      const res = await fetch('/api/choferes');
      const data = await res.json();
      setChoferes(data.success ? data.choferes : []);
    } catch (err) {
      console.error('[v0] Error loading choferes:', err);
    }
  };

  const fetchPedidos = async () => {
    try {
      const res = await fetch('/api/pedidos/available');
      const data = await res.json();
      setPedidos(data.success ? data.pedidos : []);
    } catch (err) {
      console.error('[v0] Error loading pedidos:', err);
    }
  };

  const handleSubmit = async (formData: any) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/guia-despacho', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, pedidoId: formData.pedidoId || null }),
      });

      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || 'Error al crear guía de despacho');
      }

      const cliente = clientes.find(c => c.id === Number(formData.clienteId));
      const producto = productos.find(p => p.id === Number(formData.productoId));
      const unidad = unidades.find(u => u.id === Number(formData.unidadId));
      const esPrealca = formData.tipo === 'Prealca';
      // numeroGuia arranca en 1 y es independiente del id real de la tabla
      // (ver sql/migracion_numero_guia.sql); las guías creadas antes de esa
      // migración no lo tienen, por eso el fallback al id de siempre.
      const guiaNumber = `GD-${result.numeroGuia ?? result.id}`;

      if (esPrealca) {
        printDocument(generatePrealcaHtml({
          guiaNumber,
          fecha: new Date().toISOString(),
          clienteNombre: cliente?.nombre || '',
          clienteRif: cliente?.rif || '',
          clienteDireccion: cliente?.direccion || '',
          clienteTelefono: cliente?.telefono || '',
          chofer: formData.chofer || '',
          placa: unidad?.placa || '',
          items: producto ? [{
            resistencia: producto.resistencia || '',
            pulgada: producto.pulgada || '',
            cantidad: Number(formData.cantidadM3),
          }] : [],
        }));
      } else {
        printDocument(generateGuiaDespachoHtml({
          guiaNumber,
          fecha: new Date().toISOString(),
          clienteNombre: cliente?.nombre || '',
          clienteRif: cliente?.rif || '',
          clienteDireccion: cliente?.direccion || '',
          chofer: formData.chofer || '',
          placa: unidad?.placa || '',
          vanM3: Number(formData.cantidadM3),
          deM3: 0,
          items: producto ? [{
            nombreProducto: producto.nombre || `${producto.resistencia || ''} - ${producto.pulgada || ''}`,
            resistencia: producto.resistencia || '',
            pulgada: producto.pulgada || '',
            cantidad: Number(formData.cantidadM3),
            unidadMedida: 'M³',
            precioUnitario: 0,
            subtotalItem: 0,
          }] : [],
          total: 0,
        }));
      }

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
        choferes={choferes}
        pedidos={pedidos}
      />
    </div>
  );
}
