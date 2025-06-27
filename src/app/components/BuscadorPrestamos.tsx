// components/BuscadorPrestamos.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';

interface Prestamo {
  id: string;
  nombre: string;
  monto: number;
  estado: string;
  // ... otros campos que necesites
}

interface BuscadorPrestamosProps {
  onResultados: (resultados: Prestamo[]) => void;
  onCargando: (cargando: boolean) => void;
  onError: (error: string) => void;
}

export default function BuscadorPrestamos({ 
  onResultados, 
  onCargando, 
  onError 
}: BuscadorPrestamosProps) {
  const [terminoBusqueda, setTerminoBusqueda] = useState('');

  useEffect(() => {
    const buscarPrestamos = async () => {
      if (terminoBusqueda.trim() === '') {
        onResultados([]);
        return;
      }

      try {
        onCargando(true);
        onError('');

        const { data, error } = await supabase
          .from('prestamos')
          .select('*')
          .ilike('nombre', `%${terminoBusqueda}%`)
          .order('creado_en', { ascending: false });

        if (error) throw error;

        onResultados(data || []);
      } catch (err: any) {
        onError(err.message || 'Error al buscar préstamos');
      } finally {
        onCargando(false);
      }
    };

    // Debounce para evitar muchas solicitudes
    const timer = setTimeout(buscarPrestamos, 300);
    return () => clearTimeout(timer);
  }, [terminoBusqueda, onResultados, onCargando, onError]);

  return (
    <div className="mb-6">
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar préstamos por nombre..."
          value={terminoBusqueda}
          onChange={(e) => setTerminoBusqueda(e.target.value)}
          className="w-full p-3 pl-10 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
        <div className="absolute left-3 top-3 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </div>
  );
}