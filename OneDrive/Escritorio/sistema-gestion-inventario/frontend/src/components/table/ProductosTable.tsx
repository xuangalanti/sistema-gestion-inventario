import React from 'react';
import { ArrowLeftRight, Edit3, History } from 'lucide-react';
import { Producto, RolUsuario } from '../../types/inventario';
import { StockBadge } from './StockBadge';

interface ProductosTableProps {
  productos: Producto[];
  rolActual: RolUsuario;
  onRegistrarMovimiento: (producto: Producto) => void;
  onEditarProducto: (producto: Producto) => void;
  onVerHistorial: (producto: Producto) => void;
}

export const ProductosTable: React.FC<ProductosTableProps> = ({
  productos,
  rolActual,
  onRegistrarMovimiento,
  onEditarProducto,
  onVerHistorial,
}) => {
  const puedeOperar = rolActual === 'ADMIN' || rolActual === 'OPERADOR';
  const esAdmin = rolActual === 'ADMIN';

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3 text-right">Precio Unitario</th>
              <th className="px-4 py-3 text-center">Stock Actual</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {productos.map((prod) => (
              <tr key={prod.id_Producto} className="hover:bg-slate-50/80">
                <td className="px-4 py-3 font-semibold text-slate-800">{prod.nombre}</td>
                <td className="px-4 py-3 text-slate-600">
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium">
                    {prod.categoria.nombre}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-700">
                  ${prod.precio_unitario.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-bold text-slate-800">{prod.stock_actual}</span>
                  <span className="ml-1 text-xs text-slate-400">(mín {prod.stock_minimo})</span>
                </td>
                <td className="px-4 py-3">
                  <StockBadge stockActual={prod.stock_actual} stockMinimo={prod.stock_minimo} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    {puedeOperar && (
                      <button
                        onClick={() => onRegistrarMovimiento(prod)}
                        title="Registrar Movimiento"
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        Movimiento
                      </button>
                    )}
                    {esAdmin && (
                      <button
                        onClick={() => onEditarProducto(prod)}
                        title="Editar Producto"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Editar
                      </button>
                    )}
                    <button
                      onClick={() => onVerHistorial(prod)}
                      title="Ver Historial"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      <History className="h-3.5 w-3.5" />
                      Historial
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
