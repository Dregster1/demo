'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';

interface Bien {
  id: string;
  nombre: string;
  valor: number;
  tipo: 'activo' | 'pasivo';
}

export default function Balance() {
  const [bienes, setBienes] = useState<Bien[]>([]);

  useEffect(() => {
    const fetchBienes = async () => {
      const { data, error } = await supabase
        .from('balance')
        .select('*')
        .order('valor', { ascending: false }); // Ordenamos por valor descendente
      
      if (data) setBienes(data);
      if (error) console.error('Error:', error);
    };

    fetchBienes();
  }, []);

  // Calcular totales
  const totalActivos = bienes
    .filter(b => b.tipo === 'activo')
    .reduce((sum, b) => sum + b.valor, 0);

  const totalPasivos = bienes
    .filter(b => b.tipo === 'pasivo')
    .reduce((sum, b) => sum + b.valor, 0);

  const balanceTotal = totalActivos - totalPasivos;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Balance General</h1>
      
      {/* Listado de bienes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        {bienes.map((bien) => (
          <div key={bien.id} className="bg-gray-800 rounded-lg p-5 shadow-md border border-gray-700">
            <h2 className="text-xl font-semibold text-blue-400 mb-2">{bien.nombre}</h2>
            <p className="text-gray-300">
              <span className="font-medium text-white">Valor:</span> Q{bien.valor.toLocaleString()}
            </p>
            <p className="text-gray-300">
              <span className="font-medium text-white">Tipo:</span> 
              <span className={bien.tipo === 'activo' ? 'text-green-400 ml-1' : 'text-red-400 ml-1'}>
                {bien.tipo}
              </span>
            </p>
          </div>
        ))}
      </div>

      {/* Resumen del balance */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Resumen</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-300">Total Activos:</p>
            <p className="text-green-400 text-xl font-bold">Q{totalActivos.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-300">Total Pasivos:</p>
            <p className="text-red-400 text-xl font-bold">Q{totalPasivos.toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-gray-300">Balance Total:</p>
          <p className={`text-xl font-bold ${
            balanceTotal >= 0 ? 'text-blue-400' : 'text-red-400'
          }`}>
            Q{balanceTotal.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}