// app/registro/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import Link from 'next/link';

// app/registro/page.tsx
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
  archivado: boolean;
  fecha_archivado?: string;
}

export default function RegistroPrestamos() {
  const [prestamosArchivados, setPrestamosArchivados] = useState<Prestamo[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [busquedaActiva, setBusquedaActiva] = useState(false);
  const [resultadosBusqueda, setResultadosBusqueda] = useState<Prestamo[]>([]);
  const [error, setError] = useState('');
    const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  
  
  useEffect(() => {
    cargarPrestamosArchivados();
  }, []);

  const cargarPrestamosArchivados = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prestamos')
        .select('*')
        .eq('archivado', true)
        .order('fecha_archivado', { ascending: false });

      if (error) throw error;
      setPrestamosArchivados(data || []);
    } catch (error) {
      console.error('Error al cargar préstamos archivados:', error);
    } finally {
      setLoading(false);
    }
  };

  const restaurarPrestamo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('prestamos')
        .update({ archivado: false, fecha_archivado: null })
        .eq('id', id);

      if (error) throw error;
      setPrestamosArchivados(prestamosArchivados.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error al restaurar préstamo:', error);
    }
  };

  const eliminarPermanente = async (id: string) => {
    if (!confirm('¿Eliminar permanentemente este préstamo archivado?')) return;
    
    try {
      const { error } = await supabase
        .from('prestamos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPrestamosArchivados(prestamosArchivados.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error al eliminar préstamo:', error);
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
        .ilike('nombre', `%${termino}%`)
        .eq('archivado', true);

      if (error) throw error;

      setResultadosBusqueda(data || []);
      setBusquedaActiva(true);
    } catch (err: any) {
      setError(err.message || 'Error al buscar préstamos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 bg-[#94ab7e] min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold">Registro de Préstamos Archivados</h1>
        <Link href="/prestamos" className="bg-blue-700 hover:bg-blue-900 text-white px-4 py-2 rounded">
          Volver a Préstamos
        </Link>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {(busquedaActiva ? resultadosBusqueda : prestamosArchivados).map((prestamo) => (


          <div key={prestamo.id} className="bg-[#1f2d1b] border border-gray-600 rounded-lg p-5">
            <div>
              <h2 className="text-xl font-bold text-[#8fc57e]">{prestamo.nombre}</h2>  
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
            
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => restaurarPrestamo(prestamo.id)}
                className="bg-green-600 hover:bg-green-800 text-white px-3 py-1 rounded text-sm"
              >
                Restaurar
              </button>
              <button
                onClick={() => eliminarPermanente(prestamo.id)}
                className="bg-red-600 hover:bg-red-800 text-white px-3 py-1 rounded text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
        
      </div>
      
    </main>
  );
}   