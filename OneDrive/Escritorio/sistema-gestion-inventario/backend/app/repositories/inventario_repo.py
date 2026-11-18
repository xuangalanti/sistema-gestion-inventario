import unicodedata
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.inventario import Movimiento, Producto, ProductoHistorial


def _normalizar_texto(texto: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", texto.lower().strip())
        if unicodedata.category(c) != "Mn"
    )


class InventarioRepository:
    def __init__(self, db: Session):
        self.db = db

    def listar_productos(self, categoria_nombre: Optional[str] = None) -> List[Producto]:
        query = self.db.query(Producto).options(joinedload(Producto.categoria))
        productos = query.order_by(Producto.nombre.asc()).all()

        if categoria_nombre:
            filtro = _normalizar_texto(categoria_nombre)
            productos = [
                p for p in productos
                if p.categoria and filtro in _normalizar_texto(p.categoria.nombre)
            ]
        return productos

    def obtener_producto_con_bloqueo(self, producto_id: int) -> Optional[Producto]:
        return (
            self.db.query(Producto)
            .filter(Producto.id_Producto == producto_id)
            .with_for_update()
            .first()
        )

    def registrar_movimiento(self, movimiento: Movimiento) -> Movimiento:
        self.db.add(movimiento)
        self.db.flush()
        return movimiento

    def registrar_historial(self, registro: ProductoHistorial) -> None:
        self.db.add(registro)
