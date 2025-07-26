// components/GenerarEstadoCliente.tsx
'use client';

import {EstadoClientePDF} from './EstadoClientePDF';
import { Prestamo, Pago } from '../types/types'; 
import { saveAs } from 'file-saver';
import { pdf } from '@react-pdf/renderer';
import { useState } from 'react';// Importar desde la ubicación central

interface GenerarEstadoClienteProps {
  prestamo: Prestamo;
  pagos: Pago[];
  pagosListos: boolean; // 🔥 <--- lo necesitas desde el estado principal
  className?: string;
}


const GenerarEstadoCliente = ({ prestamo, pagos, className }: GenerarEstadoClienteProps) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!prestamo || !pagos || pagos.length === 0) return;

    setLoading(true);
    try {
      const blob = await pdf(<EstadoClientePDF prestamo={prestamo} pagos={pagos} />).toBlob();
      saveAs(blob, `estado_cuenta_${prestamo.nombre}_${prestamo.id}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Revisa consola.');
    }
    setLoading(false);
  };

  return (
    <div className={className}>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded inline-flex items-center"
      >
        {loading ? 'Generando PDF...' : 'Descargar Estado de Cuenta'}
      </button>
    </div>
  );
};

export default GenerarEstadoCliente;