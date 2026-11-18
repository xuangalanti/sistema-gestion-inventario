from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import get_optional_db, require_roles
from app.core.constants import RolUsuario
from app.schemas.inventario import ProductoOut, ProductoUpdate
from app.services.inventario_service import InventarioService

router = APIRouter(prefix="/productos", tags=["Productos"])


@router.get("", response_model=List[ProductoOut])
def listar_productos(
    categoria: Optional[str] = Query(
        None,
        description="Filtrar productos por nombre de categoría (ej: electronica)",
    ),
    db: Optional[Session] = Depends(get_optional_db),
):
    servicio = InventarioService(db)
    return servicio.obtener_productos(categoria=categoria)


@router.patch("/{producto_id}", response_model=ProductoOut)
def actualizar_producto(
    producto_id: int,
    payload: ProductoUpdate,
    db: Optional[Session] = Depends(get_optional_db),
    current_user: dict = Depends(require_roles([RolUsuario.ADMIN])),
):
    servicio = InventarioService(db)
    return servicio.editar_producto(
        producto_id=producto_id,
        payload=payload,
        usuario=current_user["username"],
    )
