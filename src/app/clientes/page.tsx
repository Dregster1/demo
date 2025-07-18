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
  tiene_prestamo_activo?: boolean;

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
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [busquedaActiva, setBusquedaActiva] = useState(false);
  const [resultadosBusqueda, setResultadosBusqueda] = useState<Cliente[]>([]);

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

      if (filtroTipo !== 'todos') {
        query = query.eq('tipo', filtroTipo);
      }

      query = query.order('creado_en', { ascending: ordenFecha === 'antiguo' });

      const { data: clientesData, error: supabaseError } = await query;

      if (supabaseError) throw supabaseError;

      // Verificar préstamos por DPI y Nombre
      const clientesConPrestamos = await Promise.all(
        (clientesData || []).map(async (cliente) => {
          const { count } = await supabase
            .from('prestamos')
            .select('*', { count: 'exact' })
            .eq('dpi', cliente.dpi) // Campo DPI en préstamos
            .eq('nombre', cliente.nombre) // Campo nombre en préstamos
            .eq('archivado', false)
            .neq('estado', 'pagado');

          return {
            ...cliente,
            tiene_prestamo_activo: (count || 0) > 0
          };
        })
      );

      setClientes(clientesConPrestamos);

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

  const handleBuscar = async (termino: string) => {
    if (!termino.trim()) {
      setBusquedaActiva(false);
      setResultadosBusqueda([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .or(`nombre.ilike.%${termino}%,dpi.ilike.%${termino}%,codigo_cliente.ilike.%${termino}%`)
        .order('creado_en', { ascending: ordenFecha === 'antiguo' });

      if (error) throw error;

      // Verificar préstamos para los resultados de búsqueda
      const clientesConPrestamos = await Promise.all(
        (data || []).map(async (cliente) => {
          const { count } = await supabase
            .from('prestamos')
            .select('*', { count: 'exact' })
            .eq('dpi', cliente.dpi)
            .eq('nombre', cliente.nombre)
            .eq('archivado', false)
            .neq('estado', 'pagado');

          return {
            ...cliente,
            tiene_prestamo_activo: (count || 0) > 0
          };
        })
      );

      setResultadosBusqueda(clientesConPrestamos);
      setBusquedaActiva(true);
    } catch (err: any) {
      setError(err.message || 'Error al buscar clientes');
    } finally {
      setLoading(false);
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

      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre, dpi o codigo..."
            value={terminoBusqueda}
            onChange={(e) => {
              setTerminoBusqueda(e.target.value);
              handleBuscar(e.target.value);
            }}
            className="w-full p-2 pl-10 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {(busquedaActiva ? resultadosBusqueda : clientes).length > 0 ? (
          (busquedaActiva ? resultadosBusqueda : clientes).map((cliente) => (
            <div
              key={cliente.id}
              className="bg-[#1f2d1b] rounded-lg p-5 shadow-md border border-gray-700 hover:border-yellow-400 transition duration-200 relative"
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-bold text-blue-400">{cliente.nombre}</h2>

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
                <span
                  className={`px-2 py-1 text-xs rounded-full flex items-center ${cliente.tiene_prestamo_activo ? 'bg-red-900 text-red-300' : 'bg-gray-700 text-gray-300'
                    }`}
                  title={cliente.tiene_prestamo_activo ? 'Tiene préstamo(s) activo(s)' : 'Sin préstamos activos'}
                >
                  {cliente.tiene_prestamo_activo ? (
                    <>
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Con Préstamo activo
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Sin Préstamo activo
                    </>
                  )}
                </span>
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
                  className={`bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm ${deletingId === cliente.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  {deletingId === cliente.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-white py-8">
            {busquedaActiva ? 'No se encontraron clientes' : 'No hay clientes registrados'}
          </div>
        )}
      </div>
    </main>
  );
}