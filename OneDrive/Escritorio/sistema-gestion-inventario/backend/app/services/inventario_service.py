from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.constants import TipoMovimiento
from app.core.exceptions import ReglaNegocioError, StockInsuficienteError
from app.models.inventario import Movimiento, ProductoHistorial
from app.repositories.inventario_repo import InventarioRepository, _normalizar_texto
from app.schemas.inventario import (
    CategoriaOut,
    MovimientoCreate,
    ProductoOut,
    ProductoUpdate,
)

MOCK_PRODUCTOS: List[ProductoOut] = [
    ProductoOut(
        id_Producto=1,
        nombre="Laptop Dell Latitude 5440",
        precio_unitario=1250.00,
        stock_actual=8,
        stock_minimo=5,
        categoria=CategoriaOut(id_Categoria=1, nombre="Electrónica", descripcion="Equipos y hardware"),
    ),
    ProductoOut(
        id_Producto=2,
        nombre="Teclado Mecánico Keychron K2",
        precio_unitario=95.50,
        stock_actual=3,
        stock_minimo=5,
        categoria=CategoriaOut(id_Categoria=1, nombre="Electrónica", descripcion="Equipos y hardware"),
    ),
    ProductoOut(
        id_Producto=3,
        nombre="Campera Térmica Operativa",
        precio_unitario=65.00,
        stock_actual=0,
        stock_minimo=4,
        categoria=CategoriaOut(id_Categoria=2, nombre="Ropa", descripcion="Indumentaria laboral"),
    ),
    ProductoOut(
        id_Producto=4,
        nombre="Café en Grano Tostado 1kg",
        precio_unitario=24.00,
        stock_actual=18,
        stock_minimo=6,
        categoria=CategoriaOut(id_Categoria=3, nombre="Alimentos", descripcion="Insumos de cafetería"),
    ),
]


class InventarioService:
    def __init__(self, db: Optional[Session] = None):
        self.db = db
        self.repo = InventarioRepository(db) if db is not None else None

    def obtener_productos(self, categoria: Optional[str] = None) -> List[ProductoOut]:
        if settings.USE_MOCK_DB or self.repo is None:
            if not categoria:
                return MOCK_PRODUCTOS
            filtro = _normalizar_texto(categoria)
            return [
                p for p in MOCK_PRODUCTOS
                if filtro in _normalizar_texto(p.categoria.nombre)
            ]

        productos_db = self.repo.listar_productos(categoria_nombre=categoria)
        return [ProductoOut.model_validate(p) for p in productos_db]

    def procesar_movimiento(self, payload: MovimientoCreate) -> Movimiento:
        if self.db is None or self.repo is None:
            raise ReglaNegocioError("Base de datos no conectada en modo mock.")

        try:
            producto = self.repo.obtener_producto_con_bloqueo(payload.producto_id)
            if not producto:
                raise ReglaNegocioError(f"El producto con ID {payload.producto_id} no existe.", status_code=404)

            if payload.tipo == TipoMovimiento.SALIDA:
                if not payload.motivo or not payload.motivo.strip():
                    raise ReglaNegocioError("El motivo es obligatorio al registrar una salida de stock.")
                if producto.stock_actual < payload.cantidad:
                    raise StockInsuficienteError(
                        producto=producto.nombre,
                        disponible=producto.stock_actual,
                        solicitado=payload.cantidad,
                    )
                producto.stock_actual -= payload.cantidad
            else:
                producto.stock_actual += payload.cantidad

            nuevo_movimiento = Movimiento(
                producto_id=payload.producto_id,
                tipo=payload.tipo,
                cantidad=payload.cantidad,
                motivo=payload.motivo,
                usuario=payload.usuario,
            )
            self.repo.registrar_movimiento(nuevo_movimiento)
            self.db.commit()
            self.db.refresh(nuevo_movimiento)
            return nuevo_movimiento

        except Exception:
            self.db.rollback()
            raise

    def editar_producto(self, producto_id: int, payload: ProductoUpdate, usuario: str) -> ProductoOut:
        if self.db is None or self.repo is None:
            raise ReglaNegocioError("Base de datos no conectada en modo mock.")

        try:
            producto = self.repo.obtener_producto_con_bloqueo(producto_id)
            if not producto:
                raise ReglaNegocioError("Producto no encontrado.", status_code=404)

            if payload.nombre is not None and payload.nombre != producto.nombre:
                self.repo.registrar_historial(
                    ProductoHistorial(
                        producto_id=producto.id_Producto,
                        campo_modificado="nombre",
                        valor_anterior=producto.nombre,
                        valor_nuevo=payload.nombre,
                        usuario=usuario,
                    )
                )
                producto.nombre = payload.nombre

            if payload.precio_unitario is not None and payload.precio_unitario != producto.precio_unitario:
                if payload.precio_unitario <= 0:
                    raise ReglaNegocioError("El precio unitario debe ser mayor a 0.")
                self.repo.registrar_historial(
                    ProductoHistorial(
                        producto_id=producto.id_Producto,
                        campo_modificado="precio_unitario",
                        valor_anterior=str(producto.precio_unitario),
                        valor_nuevo=str(payload.precio_unitario),
                        usuario=usuario,
                    )
                )
                producto.precio_unitario = payload.precio_unitario

            if payload.stock_minimo is not None:
                producto.stock_minimo = payload.stock_minimo

            self.db.commit()
            self.db.refresh(producto)
            return ProductoOut.model_validate(producto)

        except Exception:
            self.db.rollback()
            raise
