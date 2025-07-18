// components/GenerarEstadoCliente.tsx
'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import {EstadoClientePDF} from './EstadoClientePDF';
import { Prestamo, Pago } from '../types/types'; // Importar desde la ubicación central

interface GenerarEstadoClienteProps {
  prestamo: Prestamo;
  pagos: Pago[];
  className?: string; 
}

const GenerarEstadoCliente = ({ prestamo, pagos, className }: GenerarEstadoClienteProps) => {
  return (
    <div className={className}>
      <PDFDownloadLink
        document={<EstadoClientePDF prestamo={prestamo} pagos={pagos} />}
        fileName={`estado_cuenta_${prestamo.nombre}_${prestamo.id}.pdf`}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded inline-flex items-center"
      >
        {({ loading }) => (
          loading ? 'Generando PDF...' : 'Descargar Estado de Cuenta'
        )}
      </PDFDownloadLink>
    </div>
  );
};

export default GenerarEstadoCliente;