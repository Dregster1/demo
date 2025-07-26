'use client';

import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { Prestamo, Pago } from '../types/types';

// Registrar fuentes
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf' },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc9.ttf', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12, lineHeight: 1.5 },
  header: { marginBottom: 20, textAlign: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  section: { marginBottom: 15 },
  subtitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  table: {
    width: '100%', marginTop: 10,
    borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf',
  },
  tableRow: { flexDirection: 'row' },
  tableColHeader: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    backgroundColor: '#f0f0f0',
    padding: 5,
    fontWeight: 'bold',
  },
  tableCol: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    padding: 5,
  },
  paid: { color: 'green' },
  pending: { color: '#d97706' },
  overdue: { color: 'red' },
});

interface EstadoClientePDFProps {
  prestamo: Prestamo;
  pagos: Pago[];
}

export const EstadoClientePDF = ({ prestamo, pagos }: EstadoClientePDFProps) => {
  const totalPagos = pagos?.length || 0;
  const pagados = pagos?.filter(p => p.estado === 'pagado').length || 0;
  const pendientes = pagos?.filter(p => p.estado === 'pendiente').length || 0;
  const vencidos = pagos?.filter(p => p.estado === 'vencido').length || 0;
  const moraTotal = pagos?.reduce((sum, p) => sum + (typeof p.monto_mora === 'number' ? p.monto_mora : 0), 0) || 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Encabezado */}
        <View style={styles.header}>
          <Text style={styles.title}>Estado de Cuenta del Cliente</Text>
          <Text>Generado el: {new Date().toLocaleDateString()}</Text>
        </View>

        {/* Información del Cliente */}
        <View style={styles.section}>
          <Text style={styles.subtitle}>Información del Cliente</Text>
          <Text>Nombre: {prestamo.nombre || 'No especificado'}</Text>
          <Text>DPI: {prestamo.dpi || 'No especificado'}</Text>
          <Text>Teléfono: {prestamo.telefono || 'No especificado'}</Text>
          <Text>Código: {prestamo.codigo_cliente || 'No especificado'}</Text>
        </View>

        {/* Detalles del Préstamo */}
        <View style={styles.section}>
          <Text style={styles.subtitle}>Detalles del Préstamo</Text>
          <Text>Monto: Q{typeof prestamo.monto === 'number' ? prestamo.monto.toFixed(2) : 'N/A'}</Text>
          <Text>Interés: {prestamo.interes}% ({prestamo.tipo_interes === 'sobre_saldos' ? 'Sobre saldos' : 'Fijo'})</Text>
          <Text>Plazo: {prestamo.frecuencia_pago || 'No especificado'}</Text>
          <Text>Fecha de inicio: {prestamo.fecha_inicio ? new Date(prestamo.fecha_inicio).toLocaleDateString() : 'No especificada'}</Text>
          <Text>Estado actual: {prestamo.estado?.toUpperCase() || 'N/A'}</Text>
        </View>

        {/* Resumen de Pagos */}
        <View style={styles.section}>
          <Text style={styles.subtitle}>Resumen de Pagos</Text>
          <Text>Total pagos: {totalPagos}</Text>
          <Text>Pagados: {pagados}</Text>
          <Text>Pendientes: {pendientes}</Text>
          <Text>Vencidos: {vencidos}</Text>
          {prestamo.estado === 'moroso' && (
            <Text>Mora acumulada: Q{moraTotal.toFixed(2)}</Text>
          )}
        </View>

        {/* Tabla de Pagos */}
        <View style={styles.section}>
          <Text style={styles.subtitle}>Detalle de Pagos</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}><Text>No.</Text></View>
              <View style={styles.tableColHeader}><Text>Fecha</Text></View>
              <View style={styles.tableColHeader}><Text>Monto</Text></View>
              <View style={styles.tableColHeader}><Text>Capital</Text></View>
              <View style={styles.tableColHeader}><Text>Estado</Text></View>
            </View>

            {(pagos || []).map((pago) => (
              <View key={pago.id || `${pago.numero}-${pago.fecha}`} style={styles.tableRow}>
                <View style={styles.tableCol}><Text>{pago.numero ?? '—'}</Text></View>
                <View style={styles.tableCol}><Text>{pago.fecha ? new Date(pago.fecha).toLocaleDateString() : '—'}</Text></View>
                <View style={styles.tableCol}><Text>Q{typeof pago.monto === 'number' ? pago.monto.toFixed(2) : '—'}</Text></View>
                <View style={styles.tableCol}>
                  <Text>
                    Q{typeof pago.capital === 'number'
                      ? pago.capital.toFixed(2)
                      : (typeof pago.monto === 'number' && typeof pago.interes === 'number'
                        ? (pago.monto - pago.interes).toFixed(2)
                        : '—')}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={
                    pago.estado === 'pagado' ? styles.paid :
                      pago.estado === 'vencido' ? styles.overdue :
                        styles.pending
                  }>
                    {pago.estado?.toUpperCase() || '—'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Pie de página */}
        <View style={[styles.section, { marginTop: 20 }]}>
          <Text>_________________________________</Text>
          <Text>Firma del cliente</Text>
        </View>
      </Page>
    </Document>
  );
};
