'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BuscadorPrestamos from '@/app/components/BuscadorPrestamos';



interface Prestamo {
  id: string;
  nombre: string;
  dpi: string;
  codigo_cliente: string | null;
  telefono: string;
  monto: number;
  interes: number;
  plazo: number;
  fecha_inicio: string;
  porcentaje_mora: number;
  mora_aplicada: boolean;
  monto_mora: number;
  estado: 'pendiente' | 'pagado' | 'vencido' | 'moroso';
  creado_en: string;
  fecha_vencimiento: string;
}

export default function ListaPrestamos() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [busquedaActiva, setBusquedaActiva] = useState(false);
  const [resultadosBusqueda, setResultadosBusqueda] = useState<Prestamo[]>([]);
  const router = useRouter();
  const [moraInfo, setMoraInfo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [ordenMonto, setOrdenMonto] = useState<'mayor' | 'menor' | null>(null);
  const [ordenFecha, setOrdenFecha] = useState<'reciente' | 'antiguo'>('reciente');
  const [vista, setVista] = useState<'tarjetas' | 'lista'>('tarjetas');

  useEffect(() => {
    cargarPrestamos();
  }, [filtroEstado, ordenMonto, ordenFecha]);



  const cargarPrestamos = async () => {
    try {
      setLoading(true);
      setError('');

      let query = supabase
        .from('prestamos')
        .select('*');

      // Aplicar filtro de estado
      if (filtroEstado !== 'todos') {
        query = query.eq('estado', filtroEstado);
      }

      // Aplicar ordenamiento
      if (ordenMonto) {
        query = query.order('monto', { ascending: ordenMonto === 'menor' });
      } else {
        // Cambiado para ordenar por fecha_inicio en lugar de creado_en
        query = query.order('fecha_inicio', { ascending: ordenFecha === 'antiguo' });
      }

      const { data, error } = await query;

      if (error) throw error;
      setPrestamos(data || []);

    } catch (err: any) {
      console.error('Error al cargar préstamos:', err);
      setError(err.message || 'Error al cargar los préstamos');
    } finally {
      setLoading(false);
    }


  };



  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este préstamo?')) {
      return;
    }

    try {
      setDeletingId(id);
      const { error } = await supabase
        .from('prestamos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPrestamos(prestamos.filter(p => p.id !== id));
    } catch (err: any) {
      console.error('Error al eliminar préstamo:', err);
      setError(err.message || 'Error al eliminar el préstamo');
    } finally {
      setDeletingId(null);
    }
  };

  const handleBuscar = async (termino: string) => {
    if (!termino.trim()) {
      setBusquedaActiva(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prestamos')
        .select('*')
        .ilike('nombre', `%${termino}%`);

      if (error) throw error;

      setResultadosBusqueda(data || []);
      setBusquedaActiva(true);
    } catch (err: any) {
      setError(err.message || 'Error al buscar préstamos');
    } finally {
      setLoading(false);
    }
  };


  if (error) {
    return (
      <main className="p-6 bg-[#a1b98a] min-h-screen text-white">
        <h1 className="text-3xl font-semibold mb-6 text-center">Lista de Préstamos</h1>
        <div className="text-red-400 text-center mb-4">{error}</div>
        <button
          onClick={cargarPrestamos}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mx-auto block"
        >
          Reintentar
        </button>
      </main>
    );
  }

  return (
    <main className="p-6 bg-[#94ab7e] min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        

        <div className="flex items-center gap-4">
          {/* Toggle de vista */}
          <div className="flex items-center bg-[#1f2d1b] p-1 rounded-lg">
            <button
              onClick={() => setVista('tarjetas')}
              className={`px-3 py-1 rounded-md ${vista === 'tarjetas' ? 'bg-[#3a5a40] text-white' : 'text-gray-300'}`}
            >
              <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Tarjetas
            </button>
            <button
              onClick={() => setVista('lista')}
              className={`px-3 py-1 rounded-md ${vista === 'lista' ? 'bg-[#3a5a40] text-white' : 'text-gray-300'}`}
            >
              <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Lista
            </button>
          </div>

          <Link
            href="/prestamos/nuevo"
            className="bg-green-700 hover:bg-green-900 text-white px-4 py-2 rounded"
          >
            Nuevo Préstamo
          </Link>
        </div>
      </div>

      {/* Sección de Filtros */}
      <div className="bg-[#1f2d1b] p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Filtros</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro por Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full p-2 rounded bg-[#e6f2da] text-[#2d372f]"
            >
              <option value="todos">Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="pagado">Pagados</option>
              <option value="vencido">Vencidos</option>
            </select>
          </div>

          {/* Orden por Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Ordenar por Monto</label>
            <select
              value={ordenMonto || ''}
              onChange={(e) => setOrdenMonto(e.target.value ? e.target.value as 'mayor' | 'menor' : null)}
              className="w-full p-2 rounded bg-[#e6f2da] text-[#2d372f]"
            >
              <option value="">Sin orden</option>
              <option value="mayor">Mayor a menor</option>
              <option value="menor">Menor a mayor</option>
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
              <option value="reciente">Más recientes</option>
              <option value="antiguo">Más antiguos</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre..."
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

      {/* Lista de Préstamos */}
      {vista === 'tarjetas' ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {(busquedaActiva ? resultadosBusqueda : prestamos).length > 0 ? (
          (busquedaActiva ? resultadosBusqueda : prestamos).map((prestamo) => (
            <div
              key={prestamo.id}
              className={`bg-[#1f2d1b] border-[#75ad69] rounded-lg p-5 shadow-black border ${prestamo.estado === 'vencido' ? 'border-red-500' :
                prestamo.estado === 'pagado' ? 'border-green-500' : 'border-black'
                } hover:border-yellow-400 transition duration-200 relative`}
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-bold text-[#8fc57e]">{prestamo.nombre}</h2>
                <span className={`text-xs px-2 py-1 rounded ${prestamo.estado === 'vencido' ? 'bg-red-900 text-red-300' :
                  prestamo.estado === 'pagado' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'
                  }`}>
                  {prestamo.estado.toUpperCase()}
                </span>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <p className="text-gray-300">
                  <span className="font-medium text-white">DPI:</span> {prestamo.dpi}
                </p>
                {prestamo.codigo_cliente && (
                  <p className="text-gray-300">
                    <span className="font-medium text-white">Código:</span> {prestamo.codigo_cliente}
                  </p>
                )}
                <p className="text-gray-300">
                  <span className="font-medium text-white">Teléfono:</span> {prestamo.telefono}
                </p>
                <p className="text-gray-300">
                  <span className="font-medium text-white">Monto:</span> Q{prestamo.monto.toFixed(2)}
                </p>
                <p className="text-gray-300">
                  <span className="font-medium text-white">Interés:</span> {prestamo.interes}%
                </p>
                <p className="text-gray-300">
                  <span className="font-medium text-white">Plazo:</span> {prestamo.plazo} meses
                </p>
                {(prestamo.estado === 'vencido' || prestamo.estado === 'moroso') && (
                  <>
                    <p className="text-red-300">
                      <span className="font-medium text-white">Mora:</span> {prestamo.porcentaje_mora || 0}%
                    </p>
                    <p className="text-red-300">
                      <span className="font-medium text-white">Monto mora:</span> Q{(prestamo.monto_mora || 0).toFixed(2)}
                    </p>
                    <p className="text-red-400 font-medium">
                      <span className="font-medium text-white">Total a pagar:</span> Q{(Number(prestamo.monto) + Number(prestamo.monto_mora || 0)).toFixed(2)}
                    </p>
                  </>
                )}
                <p className="text-gray-400">
                  <span className="font-medium text-white">Inicio:</span> {new Date(prestamo.fecha_inicio).toLocaleDateString()}
                </p>
                <p className="text-gray-400">
                  <span className="font-medium text-white">Vencimiento:</span> {new Date(prestamo.fecha_vencimiento).toLocaleDateString()}
                </p>
                <p className="text-gray-500 text-xs">
                  <span className="font-medium">Registrado:</span> {new Date(prestamo.creado_en).toLocaleDateString()}
                </p>
              </div>
                
              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-700">
                <Link
                  href={`/prestamos/editar/${prestamo.id}`}
                  className="bg-[#d4a94c] hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                >
                  Editar
                </Link>
                <button
                  onClick={() => handleEliminar(prestamo.id)}
                  disabled={deletingId === prestamo.id}
                  className={`bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm ${deletingId === prestamo.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  {deletingId === prestamo.id ? 'Eliminando...' : 'Eliminar'}
                </button>
                <Link
                  href={`/prestamos/${prestamo.id}/proyeccion`}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
                >
                  Proyección
                </Link>
              </div>
            </div>
          ))
         ) : (
            <div className="col-span-full text-center text-white py-8">
              {busquedaActiva ? 'No se encontraron préstamos' : 'No hay préstamos registrados'}
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Vista de lista optimizada para móviles */}
          <div className="md:hidden space-y-3">
      {(busquedaActiva ? resultadosBusqueda : prestamos).map((prestamo) => (
        <div key={prestamo.id} className="bg-[#1f2d1b] p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg">{prestamo.nombre}</h3>
            <span className={`text-xs px-2 py-1 rounded ${
              prestamo.estado === 'pagado' ? 'bg-green-900 text-green-300' :
              prestamo.estado === 'moroso' ? 'bg-red-900 text-red-300' :
              'bg-blue-900 text-blue-300'
            }`}>
              {prestamo.estado}
            </span>
          </div>
          
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-400">Monto</p>
              <p>Q{prestamo.monto.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-400">Vencimiento</p>
              <p>{new Date(prestamo.fecha_vencimiento).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-400">Interés</p>
              <p>{prestamo.interes}%</p>
            </div>
            <div>
              <p className="text-gray-400">Plazo</p>
              <p>{prestamo.plazo} meses</p>
            </div>
          </div>
          
          {/* Acciones para móvil */}
          <div className="mt-3 flex justify-end space-x-2">
            <Link
              href={`/prestamos/editar/${prestamo.id}`}
              className="bg-[#d4a94c] hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
            >
              Editar
            </Link>
            <button
              onClick={() => handleEliminar(prestamo.id)}
              disabled={deletingId === prestamo.id}
              className={`bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm ${
                deletingId === prestamo.id ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {deletingId === prestamo.id ? 'Eliminando...' : 'Eliminar'}
            </button>
            <Link
              href={`/prestamos/${prestamo.id}/proyeccion`}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
            >
              Proyección
            </Link>
          </div>
        </div>
      ))}
    </div>

    {/* Vista desktop - Tabla */}
    <div className="hidden md:block bg-[#1f2d1b] rounded-lg shadow-lg">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-[#2d3b27]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cliente</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Monto</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Estado</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Vencimiento</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {(busquedaActiva ? resultadosBusqueda : prestamos).map((prestamo) => (
            <tr key={prestamo.id} className="hover:bg-[#2d3b27]">
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm font-medium">{prestamo.nombre}</div>
                <div className="text-xs text-gray-400">{prestamo.dpi}</div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm">Q{prestamo.monto.toFixed(2)}</div>
                {prestamo.mora_aplicada && (
                  <div className="text-xs text-red-400">+ Q{prestamo.monto_mora?.toFixed(2)}</div>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  prestamo.estado === 'pagado' ? 'bg-green-900 text-green-300' :
                  prestamo.estado === 'moroso' ? 'bg-red-900 text-red-300' :
                  'bg-blue-900 text-blue-300'
                }`}>
                  {prestamo.estado}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                {new Date(prestamo.fecha_vencimiento).toLocaleDateString()}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex space-x-2">
                  <Link
                    href={`/prestamos/editar/${prestamo.id}`}
                    className="bg-[#d4a94c] hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleEliminar(prestamo.id)}
                    disabled={deletingId === prestamo.id}
                    className={`bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm ${
                      deletingId === prestamo.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {deletingId === prestamo.id ? 'Eliminando...' : 'Eliminar'}
                  </button>
                  <Link
                    href={`/prestamos/${prestamo.id}/proyeccion`}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Proyección
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}
    </main>
  );
}