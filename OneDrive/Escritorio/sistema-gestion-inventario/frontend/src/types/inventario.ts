export type TipoMovimiento = 'ENTRADA' | 'SALIDA';
export type RolUsuario = 'ADMIN' | 'OPERADOR' | 'LECTURA';

export interface Categoria {
  id_Categoria: number;
  nombre: string;
  descripcion?: string;
}

export interface Producto {
  id_Producto: number;
  nombre: string;
  precio_unitario: number;
  stock_actual: number;
  stock_minimo: number;
  categoria: Categoria;
}

export interface MovimientoFormPayload {
  producto_id: number;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo?: string;
  usuario: string;
}
