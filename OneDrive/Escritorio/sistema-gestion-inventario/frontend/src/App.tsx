import React, { useEffect, useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { LowStockBanner } from './components/alerts/LowStockBanner';
import { StockBarChart } from './components/charts/StockBarChart';
import { MovimientoModal } from './components/modals/MovimientoModal';
import { ProductosTable } from './components/table/ProductosTable';
import { INITIAL_MOCK_PRODUCTOS } from './data/mockData';
import { MovimientoFormPayload, Producto, RolUsuario, TipoMovimiento } from './types/inventario';

const API_URL = 'http://localhost:8000';

export function App() {
  const [productos, setProductos] = useState<Producto[]>(INITIAL_MOCK_PRODUCTOS);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('');
  const [soloAfectados, setSoloAfectados] = useState<boolean>(false);
  const [rolActual, setRolActual] = useState<RolUsuario>('ADMIN');

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [productoModal, setProductoModal] = useState<Producto | null>(null);
  const [tipoModal, setTipoModal] = useState<TipoMovimiento>('ENTRADA');

  useEffect(() => {
    const query = categoriaFiltro ? `?categoria=${encodeURIComponent(categoriaFiltro)}` : '';
    fetch(`${API_URL}/productos${query}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: Producto[]) => setProductos(data))
      .catch(() => {
        if (!categoriaFiltro) {
          setProductos(INITIAL_MOCK_PRODUCTOS);
        } else {
          setProductos(
            INITIAL_MOCK_PRODUCTOS.filter(
              (p) => p.categoria.nombre.toLowerCase() === categoriaFiltro.toLowerCase()
            )
          );
        }
      });
  }, [categoriaFiltro]);

  const categoriasUnicas = Array.from(
    new Set(INITIAL_MOCK_PRODUCTOS.map((p) => p.categoria.nombre))
  );

  const productosVisibles = soloAfectados
    ? productos.filter((p) => p.stock_actual <= p.stock_minimo)
    : productos;

  const abrirModalMovimiento = (prod: Producto | null, tipo: TipoMovimiento = 'ENTRADA') => {
    setProductoModal(prod);
    setTipoModal(tipo);
    setModalOpen(true);
  };

  const handleConfirmarMovimiento = (payload: MovimientoFormPayload) => {
    setProductos((prev) =>
      prev.map((p) => {
        if (p.id_Producto !== payload.producto_id) return p;
        const delta = payload.tipo === 'ENTRADA' ? payload.cantidad : -payload.cantidad;
        return { ...p, stock_actual: Math.max(0, p.stock_actual + delta) };
      })
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-blue-600 p-2 text-white">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Control de Inventario</h1>
              <p className="text-xs text-slate-500">Gestión de productos, stock y movimientos</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500">Rol activo:</span>
              <select
                value={rolActual}
                onChange={(e) => setRolActual(e.target.value as RolUsuario)}
                className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-semibold text-slate-700"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="OPERADOR">OPERADOR</option>
                <option value="LECTURA">LECTURA</option>
              </select>
            </div>

            {rolActual !== 'LECTURA' && (
              <button
                onClick={() => abrirModalMovimiento(null, 'ENTRADA')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Nuevo Movimiento
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        <LowStockBanner
          productos={productos}
          soloAfectados={soloAfectados}
          onToggleFiltroAfectados={() => setSoloAfectados((prev) => !prev)}
          onRegistrarEntrada={(prod) => abrirModalMovimiento(prod, 'ENTRADA')}
          puedeOperar={rolActual !== 'LECTURA'}
        />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-800">Listado de Productos</h2>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600">Filtrar por categoría:</label>
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="">Todas las categorías</option>
              {categoriasUnicas.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-6">
          <ProductosTable
            productos={productosVisibles}
            rolActual={rolActual}
            onRegistrarMovimiento={(prod) => abrirModalMovimiento(prod, 'ENTRADA')}
            onEditarProducto={(prod) => alert(`Modo edición (ADMIN): ${prod.nombre}`)}
            onVerHistorial={(prod) => alert(`Historial de auditoría de: ${prod.nombre}`)}
          />

          <StockBarChart productos={productosVisibles} />
        </div>
      </main>

      <MovimientoModal
        isOpen={modalOpen}
        productos={productos}
        productoInicial={productoModal}
        tipoInicial={tipoModal}
        usuarioActual={`usuario_${rolActual.toLowerCase()}`}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmarMovimiento}
      />
    </div>
  );
}

export default App;
