from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_optional_db, require_roles
from app.core.constants import RolUsuario
from app.schemas.inventario import MovimientoCreate, MovimientoOut
from app.services.inventario_service import InventarioService

router = APIRouter(prefix="/movimientos", tags=["Movimientos"])


@router.post("", response_model=MovimientoOut, status_code=status.HTTP_201_CREATED)
def crear_movimiento(
    payload: MovimientoCreate,
    db: Optional[Session] = Depends(get_optional_db),
    current_user: dict = Depends(require_roles([RolUsuario.ADMIN, RolUsuario.OPERADOR])),
):
    servicio = InventarioService(db)
    payload.usuario = current_user["username"]
    return servicio.procesar_movimiento(payload)
