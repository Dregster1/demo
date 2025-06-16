'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';

interface Cliente {
  id: number;
  nombre: string;
  correo?: string;
  direccion?: string;
  telefono: string;
  tipo: 'cliente' | 'acreedor';
}

export default function ListaClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    const fetchClientes = async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('id', { ascending: false });
      
      if (data) setClientes(data);
      if (error) console.error('Error:', error);
    };

    fetchClientes();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Lista de Clientes / Acreedores</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {clientes.map((cliente) => (
          <div key={cliente.id} className="bg-gray-800 rounded-lg p-5 shadow-md border border-gray-700">
            <h2 className="text-xl font-semibold text-blue-400 mb-2">{cliente.nombre}</h2>
            <p className="text-gray-300">
              <span className="font-medium text-white">Teléfono:</span> {cliente.telefono}
            </p>
            <p className="text-gray-300">
              <span className="font-medium text-white">Tipo:</span> {cliente.tipo}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}