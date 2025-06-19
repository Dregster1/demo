// components/ReciboPDF.tsx
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
    fontSize: 12,
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 5,
  },
  section: {
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold',
    width: '40%',
  },
  value: {
    width: '60%',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    marginVertical: 10,
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 10,
  },
  amount: {
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 5,
    textAlign: 'center',
  },
});

interface ReciboProps {
  prestamo: {
    nombre: string;
    dpi: string;
    codigo_cliente: string;
    monto: number;
    interes: number;
    total: number;
    fecha_inicio: string;
    numero_recibo: string;
  };
  pago: {
    numero: number;
    monto: number;
    fecha_pago: string;
    saldo_anterior: number;
    saldo_restante: number;
  };
}

export const ReciboPDF = ({ prestamo, pago }: ReciboProps) => (
  <Document>
    <Page size="A5" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>RECIBO DE PAGO PARCIAL</Text>
        <Text style={styles.subtitle}>No. {prestamo.numero_recibo}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Fecha:</Text>
          <Text style={styles.value}>{new Date(pago.fecha_pago).toLocaleDateString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Cliente:</Text>
          <Text style={styles.value}>{prestamo.nombre}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>DPI:</Text>
          <Text style={styles.value}>{prestamo.dpi || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Código Cliente:</Text>
          <Text style={styles.value}>{prestamo.codigo_cliente || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Pago No.:</Text>
          <Text style={styles.value}>{pago.numero}</Text>
        </View>
        
        <View style={{ marginVertical: 10 }}>
          <Text style={styles.amount}>MONTO DEL PAGO: Q {pago.monto.toFixed(2)}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Saldo anterior:</Text>
          <Text style={styles.value}>Q {pago.saldo_anterior.toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Saldo restante:</Text>
          <Text style={styles.value}>Q {pago.saldo_restante.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <Text>_________________________________</Text>
        <Text>Firma del cliente</Text>
        <Text style={{ marginTop: 20 }}>Gracias por su pago</Text>
      </View>
    </Page>
  </Document>
);