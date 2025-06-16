export interface Client {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  tipo: 'cliente' | 'acreedor';
  creado_en: Date; // puede ser Date si lo parseas
}
