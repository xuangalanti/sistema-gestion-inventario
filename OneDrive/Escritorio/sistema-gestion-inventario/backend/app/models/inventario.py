from datetime import datetime, timezone
from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from app.core.constants import RolUsuario, TipoMovimiento
from app.core.database import Base


class Categoria(Base):
    __tablename__ = "categorias"

    id_Categoria = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(100), nullable=False, unique=True)
    descripcion = Column(Text, nullable=True)

    productos = relationship("Producto", back_populates="categoria")


class Producto(Base):
    __tablename__ = "productos"

    id_Producto = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(150), nullable=False)
    categoria_id = Column(
        Integer,
        ForeignKey("categorias.id_Categoria", ondelete="RESTRICT"),
        nullable=False,
    )
    precio_unitario = Column(Numeric(10, 2), nullable=False)
    stock_actual = Column(Integer, nullable=False, default=0)
    stock_minimo = Column(Integer, nullable=False, default=5)

    categoria = relationship("Categoria", back_populates="productos")
    movimientos = relationship("Movimiento", back_populates="producto")
    historial = relationship("ProductoHistorial", back_populates="producto")

    __table_args__ = (
        CheckConstraint("stock_actual >= 0", name="check_stock_no_negativo"),
        CheckConstraint("stock_minimo >= 0", name="check_stock_minimo_no_negativo"),
        CheckConstraint("precio_unitario > 0", name="check_precio_unitario_positivo"),
    )


class Movimiento(Base):
    __tablename__ = "movimientos"

    id_Movimiento = Column(Integer, primary_key=True, index=True, autoincrement=True)
    producto_id = Column(
        Integer,
        ForeignKey("productos.id_Producto", ondelete="RESTRICT"),
        nullable=False,
    )
    tipo = Column(SQLEnum(TipoMovimiento), nullable=False)
    cantidad = Column(Integer, nullable=False)
    fecha = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    motivo = Column(String(255), nullable=True)
    usuario = Column(String(100), nullable=False)

    producto = relationship("Producto", back_populates="movimientos")

    __table_args__ = (
        CheckConstraint("cantidad > 0", name="check_movimiento_cantidad_positiva"),
    )


class ProductoHistorial(Base):
    __tablename__ = "productos_historial"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    producto_id = Column(
        Integer,
        ForeignKey("productos.id_Producto", ondelete="RESTRICT"),
        nullable=False,
    )
    campo_modificado = Column(String(50), nullable=False)
    valor_anterior = Column(String(255), nullable=False)
    valor_nuevo = Column(String(255), nullable=False)
    fecha_cambio = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    usuario = Column(String(100), nullable=False)

    producto = relationship("Producto", back_populates="historial")


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(80), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    rol = Column(SQLEnum(RolUsuario), nullable=False, default=RolUsuario.LECTURA)
