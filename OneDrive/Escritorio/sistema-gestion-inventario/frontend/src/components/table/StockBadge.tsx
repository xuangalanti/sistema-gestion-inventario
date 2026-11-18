import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface StockBadgeProps {
  stockActual: number;
  stockMinimo: number;
}

export const StockBadge: React.FC<StockBadgeProps> = ({ stockActual, stockMinimo }) => {
  if (stockActual === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">
        <XCircle className="h-3.5 w-3.5" />
        Sin Stock / Crítico
      </span>
    );
  }

  if (stockActual <= stockMinimo) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
        <AlertTriangle className="h-3.5 w-3.5" />
        Stock Bajo
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Óptimo
    </span>
  );
};
