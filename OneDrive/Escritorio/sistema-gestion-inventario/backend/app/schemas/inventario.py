from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.core.constants import TipoMovimiento


class CategoriaOut(BaseModel):
    id_Categoria: int
    nombre: str
    descripcion: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProductoOut(BaseModel):
    id_Producto: int
    nombre: str
    precio_unitario: Decimal
    stock_actual: int
    stock_minimo: int
    categoria: CategoriaOut

    model_config = ConfigDict(from_attributes=True)


class ProductoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=150)
    precio_unitario: Optional[Decimal] = Field(None, gt=0)
    stock_minimo: Optional[int] = Field(None, ge=0)
    categoria_id: Optional[int] = None


class MovimientoCreate(BaseModel):
    producto_id: int
    tipo: TipoMovimiento
    cantidad: int = Field(..., gt=0)
    motivo: Optional[str] = Field(None, max_length=255)
    usuario: str = Field(..., min_length=1, max_length=100)


class MovimientoOut(BaseModel):
    id_Movimiento: int
    producto_id: int
    tipo: TipoMovimiento
    cantidad: int
    fecha: datetime
    motivo: Optional[str] = None
    usuario: str

    model_config = ConfigDict(from_attributes=True)
