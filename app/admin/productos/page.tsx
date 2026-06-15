'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ProductosTable } from '@/components/tables/productos-table';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface Producto {
  id: number;
  nombre: string;
  resistencia?: string;
  descripcion?: string;
}

export default function AdminProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      // API call would go here
      setProductos([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar productos';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setProductos(productos.filter(p => p.id !== id));
    } catch (err) {
      console.error('[v0] Error deleting producto:', err);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
        <Link href="/admin/productos/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
            <Plus size={20} />
            Nuevo Producto
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      ) : (
        <ProductosTable
          data={productos}
          onDelete={handleDelete}
          editLink={(id) => `/admin/productos/${id}/edit`}
        />
      )}
    </div>
  );
}
