'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';

interface Prestamo {
  id: number;
  nombre: string;
  telefono: string;
  monto: number;
  interes: number;
  plazo: number;
  fechaInicio: string;
}

export default function ListaPrestamos() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const obtenerPrestamos = async () => {
      const { data, error } = await supabase
        .from('prestamos')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error(error);
        setError('Error al obtener los préstamos');
      } else {
        setPrestamos(data || []);
      }
    };

    obtenerPrestamos();
  }, []);

  return (
    <main className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-semibold mb-6 text-center">Lista de Préstamos</h1>

      {error && (
        <p className="text-center text-red-400 mb-4">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {prestamos.map((prestamo) => (
          <div
            key={prestamo.id}
            className="bg-gray-800 rounded-lg p-5 shadow-md border border-gray-700 hover:border-blue-500 transition duration-200"
          >
            <h2 className="text-xl font-bold text-blue-400 mb-2">{prestamo.nombre}</h2>
            <p className="text-sm text-gray-300">
              Teléfono: <span className="text-white">{prestamo.telefono}</span>
            </p>
            <p className="text-sm text-gray-300">
              Monto: <span className="text-white">Q{prestamo.monto.toFixed(2)}</span>
            </p>
            <p className="text-sm text-gray-300">
              Interés: <span className="text-white">{prestamo.interes}%</span>
            </p>
            <p className="text-sm text-gray-300">
              Plazo: <span className="text-white">{prestamo.plazo} meses</span>
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Inicio: {new Date(prestamo.fechaInicio).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
