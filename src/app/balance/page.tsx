'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Bien {
  id: string;
  nombre: string;
  valor: number;
  tipo: 'activo' | 'pasivo';
  fecha_creacion: string;
}

export default function Balance() {
  const [bienes, setBienes] = useState<Bien[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    obtenerBienes();
  }, []);

  const obtenerBienes = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data, error: supabaseError } = await supabase
        .from('balance')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (supabaseError) throw supabaseError;

      setBienes(data || []);
    } catch (err: any) {
      console.error('Error al obtener bienes:', err);
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) {
      return;
    }

    try {
      setDeletingId(id);
      const { error } = await supabase
        .from('balance')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBienes(bienes.filter(b => b.id !== id));
    } catch (err: any) {
      console.error('Error al eliminar:', err);
      setError(err.message || 'Error al eliminar el registro');
    } finally {
      setDeletingId(null);
    }
  };

  // Calcular totales
  const activos = bienes.filter(b => b.tipo === 'activo');
  const pasivos = bienes.filter(b => b.tipo === 'pasivo');

  const totalActivos = activos.reduce((sum, b) => sum + b.valor, 0);
  const totalPasivos = pasivos.reduce((sum, b) => sum + b.valor, 0);
  const balanceTotal = totalActivos - totalPasivos;



  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-[#a1b98a] border border-red-700 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-4">Error al cargar los datos</h2>
          <p className="mb-4">{error}</p>
          <button 
            onClick={obtenerBienes}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="p-6 bg-[#a1b98a] min-h-screen text-white">
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Balance General</h1>
        <Link 
          href="/balance/nuevo"
          className="bg-green-700 hover:bg-green-900 text-white px-4 py-2 rounded"
        >
          Añadir Registro
        </Link>
      </div>

      {/* Resumen del balance - Ahora aparece primero */}
      <div className="bg-[#1f2d1b] rounded-lg p-6 border border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Resumen</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-900/20 p-4 rounded border border-green-800">
            <p className="text-gray-300">Total Activos</p>
            <p className="text-green-400 text-2xl font-bold">Q{totalActivos.toLocaleString()}</p>
          </div>
          <div className="bg-red-900/20 p-4 rounded border border-red-800">
            <p className="text-gray-300">Total Pasivos</p>
            <p className="text-red-400 text-2xl font-bold">Q{totalPasivos.toLocaleString()}</p>
          </div>
          <div className={`p-4 rounded border ${
            balanceTotal >= 0 ? 'bg-blue-900/20 border-blue-800' : 'bg-red-900/20 border-red-800'
          }`}>
            <p className="text-gray-300">Balance Total</p>
            <p className={`text-2xl font-bold ${
              balanceTotal >= 0 ? 'text-blue-400' : 'text-red-400'
            }`}>
              Q{balanceTotal.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Sección de Activos */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Activos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {activos.length > 0 ? (
            activos.map((bien) => (
              <div key={bien.id} className="bg-[#1f2d1b] rounded-lg p-5 shadow-md border border-gray-700 hover:border-green-500 transition duration-200 relative">
                <h3 className="text-xl font-semibold text-green-400 mb-2">{bien.nombre}</h3>
                <p className="text-gray-300">
                  <span className="font-medium text-white">Valor:</span> Q{bien.valor.toLocaleString()}
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  Registrado: {new Date(bien.fecha_creacion).toLocaleDateString()}
                </p>
                
                <div className="flex justify-end space-x-2 pt-3 mt-3 border-t border-gray-700">
                  <Link
                    href={`/balance/editar/${bien.id}`}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleEliminar(bien.id)}
                    disabled={deletingId === bien.id}
                    className={`bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm ${
                      deletingId === bien.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {deletingId === bien.id ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-white py-4">
              No hay activos registrados
            </div>
          )}
        </div>
      </div>

      {/* Sección de Pasivos */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Pasivos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {pasivos.length > 0 ? (
            pasivos.map((bien) => (
              <div key={bien.id} className="bg-[#1f2d1b] rounded-lg p-5 shadow-md border border-gray-700 hover:border-red-500 transition duration-200 relative">
                <h3 className="text-xl font-semibold text-red-400 mb-2">{bien.nombre}</h3>
                <p className="text-gray-300">
                  <span className="font-medium text-white">Valor:</span> Q{bien.valor.toLocaleString()}
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  Registrado: {new Date(bien.fecha_creacion).toLocaleDateString()}
                </p>
                
                <div className="flex justify-end space-x-2 pt-3 mt-3 border-t border-gray-700">
                  <Link
                    href={`/balance/editar/${bien.id}`}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleEliminar(bien.id)}
                    disabled={deletingId === bien.id}
                    className={`bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm ${
                      deletingId === bien.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {deletingId === bien.id ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-white py-4">
              No hay pasivos registrados
            </div>
          )}
        </div>
      </div>
    </div>
    </main>
  );
}