from enum import Enum


class TipoMovimiento(str, Enum):
    ENTRADA = "ENTRADA"
    SALIDA = "SALIDA"


class RolUsuario(str, Enum):
    ADMIN = "ADMIN"
    OPERADOR = "OPERADOR"
    LECTURA = "LECTURA"
