import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { MovimientoFormPayload, Producto, TipoMovimiento } from '../../types/inventario';

interface MovimientoModalProps {
  isOpen: boolean;
  productos: Producto[];
  productoInicial?: Producto | null;
  tipoInicial?: TipoMovimiento;
  usuarioActual: string;
  onClose: () => void;
  onConfirm: (payload: MovimientoFormPayload) => void;
}

export const MovimientoModal: React.FC<MovimientoModalProps> = ({
  isOpen,
  productos,
  productoInicial,
  tipoInicial = 'ENTRADA',
  usuarioActual,
  onClose,
  onConfirm,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [productoId, setProductoId] = useState<number>(productos[0]?.id_Producto || 1);
  const [tipo, setTipo] = useState<TipoMovimiento>(tipoInicial);
  const [cantidad, setCantidad] = useState<number>(1);
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    if (productoInicial) {
      setProductoId(productoInicial.id_Producto);
    } else if (productos.length > 0) {
      setProductoId(productos[0].id_Producto);
    }
    setTipo(tipoInicial);
    setCantidad(1);
    setMotivo('');
    setBusqueda('');
  }, [productoInicial, tipoInicial, isOpen, productos]);

  if (!isOpen) return null;

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const productoSeleccionado = productos.find((p) => p.id_Producto === productoId);
  const stockDisponible = productoSeleccionado?.stock_actual ?? 0;

  const excedeStock = tipo === 'SALIDA' && cantidad > stockDisponible;
  const cantidadInvalida = !Number.isInteger(cantidad) || cantidad <= 0;
  const motivoFaltante = tipo === 'SALIDA' && motivo.trim().length === 0;
  const formularioInvalido = excedeStock || cantidadInvalida || motivoFaltante || !productoSeleccionado;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formularioInvalido) return;

    onConfirm({
      producto_id: productoId,
      tipo,
      cantidad,
      motivo: motivo.trim() || undefined,
      usuario: usuarioActual,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-lg font-bold text-slate-800">Registrar Movimiento de Stock</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Producto</label>
            <input
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="mb-1.5 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
            />
            <select
              value={productoId}
              onChange={(e) => setProductoId(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
            >
              {productosFiltrados.map((p) => (
                <option key={p.id_Producto} value={p.id_Producto}>
                  {p.nombre} (Stock disponible: {p.stock_actual})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Tipo de Movimiento
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setTipo('ENTRADA')}
                className={`rounded-md py-1.5 text-xs font-bold transition ${
                  tipo === 'ENTRADA'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Entrada (+)
              </button>
              <button
                type="button"
                onClick={() => setTipo('SALIDA')}
                className={`rounded-md py-1.5 text-xs font-bold transition ${
                  tipo === 'SALIDA'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Salida (-)
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Cantidad</label>
            <input
              type="number"
              min={1}
              step={1}
              max={tipo === 'SALIDA' ? stockDisponible : undefined}
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                excedeStock
                  ? 'border-red-500 bg-red-50 text-red-900'
                  : 'border-slate-300 text-slate-800 focus:border-blue-500'
              }`}
            />
            {excedeStock && (
              <p className="mt-1 text-xs font-semibold text-red-600">
                La cantidad supera el stock disponible de {stockDisponible} unidades
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Motivo {tipo === 'SALIDA' ? '(Obligatorio)' : '(Opcional)'}
            </label>
            <input
              type="text"
              placeholder={
                tipo === 'SALIDA'
                  ? 'Ej: Venta orden #104, ajuste por merma...'
                  : 'Ej: Reposición proveedor...'
              }
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Operación registrada por: <span className="font-bold text-slate-800">{usuarioActual}</span>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={formularioInvalido}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Confirmar Movimiento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
