'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Cliente {
  id: string;
  nombre: string;
  dpi: string;
  codigo_cliente: string | null;
  telefono: string;
  tipo: 'cliente' | 'acreedor';
  direccion: string; // Nuevo campo
  correo: string;    // Nuevo campo
  creado_en: string;
  actualizado_en?: string;
}

export default function ListaClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  // Estados para los filtros
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'cliente' | 'acreedor'>('todos');
  const [ordenFecha, setOrdenFecha] = useState<'reciente' | 'antiguo'>('reciente');

  useEffect(() => {
    obtenerClientes();
  }, [filtroTipo, ordenFecha]);

  const obtenerClientes = async () => {
    try {
      setLoading(true);
      setError('');
      
      let query = supabase
        .from('clientes')
        .select('*');

      // Aplicar filtro por tipo
      if (filtroTipo !== 'todos') {
        query = query.eq('tipo', filtroTipo);
      }

      // Aplicar orden por fecha
      query = query.order('creado_en', { ascending: ordenFecha === 'antiguo' });

      const { data, error: supabaseError } = await query;

      if (supabaseError) throw supabaseError;
      setClientes(data || []);

    } catch (err: any) {
      console.error('Error al obtener clientes:', err);
      setError(err.message || 'Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      return;
    }

    try {
      setDeletingId(id);
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClientes(clientes.filter(c => c.id !== id));
    } catch (err: any) {
      console.error('Error al eliminar cliente:', err);
      setError(err.message || 'Error al eliminar el cliente');
    } finally {
      setDeletingId(null);
    }
  };


  if (error) {
    return (
      <main className="p-6 bg-gray-900 min-h-screen text-white">
        <h1 className="text-3xl font-semibold mb-6 text-center">Lista de Clientes</h1>
        <div className="text-red-400 text-center mb-4">{error}</div>
        <button 
          onClick={obtenerClientes}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mx-auto block"
        >
          Reintentar
        </button>
      </main>
    );
  }

  return (
    <main className="p-6 bg-[#a1b98a] min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Lista de Clientes</h1>
        <Link 
          href="/clientes/nuevo"
          className="bg-green-700 hover:bg-green-900 text-white px-4 py-2 rounded"
        >
          Nuevo Cliente
        </Link>
      </div>

      {/* Sección de Filtros */}
      <div className="bg-[#1f2d1b] p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Filtros</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtro por Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Cliente</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as 'todos' | 'cliente' | 'acreedor')}
              className="w-full p-2 rounded bg-[#e6f2da] text-[#2d372f]"
            >
              <option value="todos">Todos</option>
              <option value="cliente">Clientes</option>
              <option value="acreedor">Acreedores</option>
            </select>
          </div>

          {/* Orden por Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Ordenar por Fecha</label>
            <select
              value={ordenFecha}
              onChange={(e) => setOrdenFecha(e.target.value as 'reciente' | 'antiguo')}
              className="w-full p-2 rounded bg-[#e6f2da] text-[#2d372f]"
            >
              <option value="reciente">Más recientes primero</option>
              <option value="antiguo">Más antiguos primero</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {clientes.length > 0 ? (
          clientes.map((cliente) => (
            <div
              key={cliente.id}
              className="bg-[#1f2d1b] rounded-lg p-5 shadow-md border border-gray-700 hover:border-yellow-400 transition duration-200 relative"
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-bold text-blue-400">{cliente.nombre}</h2>
                <span className={`text-xs px-2 py-1 rounded ${
                  cliente.tipo === 'cliente' ? 'bg-green-900 text-green-300' : 'bg-purple-900 text-purple-300'
                }`}>
                  {cliente.tipo}
                </span>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <p className="text-gray-300">
                  <span className="font-medium text-white">DPI:</span> {cliente.dpi}
                </p>
                {cliente.codigo_cliente && (
                  <p className="text-gray-300">
                    <span className="font-medium text-white">Código:</span> {cliente.codigo_cliente}
                  </p>
                )}
                <p className="text-gray-300">
                  <span className="font-medium text-white">Teléfono:</span> {cliente.telefono}
                </p>
                {/* Nuevos campos agregados aquí */}
                <p className="text-gray-300">
                  <span className="font-medium text-white">Dirección:</span> {cliente.direccion || 'No especificada'}
                </p>
                <p className="text-gray-300">
                  <span className="font-medium text-white">Correo:</span> {cliente.correo || 'No especificado'}
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  Registrado: {new Date(cliente.creado_en).toLocaleDateString()}
                </p>
                {cliente.actualizado_en && (
                  <p className="text-gray-500 text-xs">
                    Actualizado: {new Date(cliente.actualizado_en).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-700">
                <Link
                  href={`/clientes/editar/${cliente.id}`}
                  className="bg-[#d4a94c] hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                >
                  Editar
                </Link>
                <button
                  onClick={() => handleEliminar(cliente.id)}
                  disabled={deletingId === cliente.id}
                  className={`bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm ${
                    deletingId === cliente.id ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {deletingId === cliente.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-white py-8">
            No hay clientes registrados
          </div>
        )}
      </div>
    </main>
  );
}