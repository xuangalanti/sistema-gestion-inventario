import React from 'react';
import { AlertTriangle, ArrowDownToLine, Filter } from 'lucide-react';
import { Producto } from '../../types/inventario';

interface LowStockBannerProps {
  productos: Producto[];
  soloAfectados: boolean;
  onToggleFiltroAfectados: () => void;
  onRegistrarEntrada: (producto: Producto) => void;
  puedeOperar: boolean;
}

export const LowStockBanner: React.FC<LowStockBannerProps> = ({
  productos,
  soloAfectados,
  onToggleFiltroAfectados,
  onRegistrarEntrada,
  puedeOperar,
}) => {
  const criticos = productos
    .filter((p) => p.stock_actual <= p.stock_minimo)
    .sort((a, b) => a.stock_actual - b.stock_actual);

  if (criticos.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-amber-200/80 p-2 text-amber-900">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-amber-950">
              Atención: {criticos.length}{' '}
              {criticos.length === 1 ? 'producto requiere' : 'productos requieren'} reposición
            </h2>
            <p className="text-xs text-amber-800">
              Artículos por debajo o igual a su umbral mínimo configurado.
            </p>
          </div>
        </div>

        <button
          onClick={onToggleFiltroAfectados}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
            soloAfectados
              ? 'bg-amber-900 text-white'
              : 'border border-amber-400 bg-white text-amber-900 hover:bg-amber-100'
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          {soloAfectados ? 'Mostrando afectados (Ver todos)' : 'Ver productos afectados'}
        </button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {criticos.map((prod) => (
          <div
            key={prod.id_Producto}
            className="flex items-center justify-between rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs"
          >
            <div>
              <p className="font-semibold text-slate-800">{prod.nombre}</p>
              <p className={prod.stock_actual === 0 ? 'font-bold text-red-600' : 'text-amber-700'}>
                Stock: {prod.stock_actual} / Mín: {prod.stock_minimo}
              </p>
            </div>
            {puedeOperar && (
              <button
                onClick={() => onRegistrarEntrada(prod)}
                className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1.5 font-medium text-white hover:bg-emerald-700"
              >
                <ArrowDownToLine className="h-3.5 w-3.5" />
                Registrar Entrada
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
