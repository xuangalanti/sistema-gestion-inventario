import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Producto } from '../../types/inventario';

interface StockBarChartProps {
  productos: Producto[];
}

export const StockBarChart: React.FC<StockBarChartProps> = ({ productos }) => {
  const data = productos.map((p) => ({
    nombre: p.nombre.length > 22 ? `${p.nombre.slice(0, 22)}...` : p.nombre,
    stock: p.stock_actual,
    minimo: p.stock_minimo,
  }));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800">Stock Actual por Producto</h3>
          <p className="text-xs text-slate-500">
            Comparativa de existencias frente a línea de referencia mínima (5 u.)
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis
              type="category"
              dataKey="nombre"
              width={150}
              tick={{ fontSize: 12, fill: '#334155' }}
            />
            <Tooltip
              formatter={(value: number) => [`${value} unidades`, 'Stock Actual']}
              contentStyle={{ borderRadius: '8px', borderColor: '#cbd5e1' }}
            />
            <ReferenceLine
              x={5}
              stroke="#d97706"
              strokeDasharray="4 4"
              label={{ value: 'Ref. Mín (5)', position: 'top', fill: '#b45309', fontSize: 11 }}
            />
            <Bar dataKey="stock" radius={[0, 4, 4, 0]} barSize={22}>
              {data.map((entry, index) => {
                const color =
                  entry.stock === 0
                    ? '#dc2626'
                    : entry.stock <= entry.minimo
                    ? '#f59e0b'
                    : '#10b981';
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
