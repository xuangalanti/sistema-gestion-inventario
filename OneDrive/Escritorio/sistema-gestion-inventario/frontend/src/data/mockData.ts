import { Producto } from '../types/inventario';

export const INITIAL_MOCK_PRODUCTOS: Producto[] = [
  {
    id_Producto: 1,
    nombre: 'Laptop Dell Latitude 5440',
    precio_unitario: 1250.0,
    stock_actual: 8,
    stock_minimo: 5,
    categoria: { id_Categoria: 1, nombre: 'Electrónica' },
  },
  {
    id_Producto: 2,
    nombre: 'Teclado Mecánico Keychron K2',
    precio_unitario: 95.5,
    stock_actual: 3,
    stock_minimo: 5,
    categoria: { id_Categoria: 1, nombre: 'Electrónica' },
  },
  {
    id_Producto: 3,
    nombre: 'Campera Térmica Operativa',
    precio_unitario: 65.0,
    stock_actual: 0,
    stock_minimo: 4,
    categoria: { id_Categoria: 2, nombre: 'Ropa' },
  },
  {
    id_Producto: 4,
    nombre: 'Café en Grano Tostado 1kg',
    precio_unitario: 24.0,
    stock_actual: 18,
    stock_minimo: 6,
    categoria: { id_Categoria: 3, nombre: 'Alimentos' },
  },
];
