// types/moraTypes.ts
export interface ResultadoMora {
  updated?: number;
  error?: string;
}

export interface PrestamoParaMora {
  id: string;
  monto: number;
  fecha_vencimiento: string;
  estado: 'pendiente' | 'pagado' | 'vencido' | 'moroso';
  mora_aplicada: boolean;
  porcentaje_mora: number;
}