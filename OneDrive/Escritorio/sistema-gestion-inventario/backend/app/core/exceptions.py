from fastapi import Request, status
from fastapi.responses import JSONResponse


class ReglaNegocioError(Exception):
    def __init__(self, mensaje: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.mensaje = mensaje
        self.status_code = status_code
        super().__init__(mensaje)


class StockInsuficienteError(ReglaNegocioError):
    def __init__(self, producto: str, disponible: int, solicitado: int):
        super().__init__(
            mensaje=f"Stock insuficiente para '{producto}'. Disponible: {disponible}, solicitado: {solicitado}.",
            status_code=status.HTTP_409_CONFLICT,
        )


async def regla_negocio_exception_handler(request: Request, exc: ReglaNegocioError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.mensaje},
    )
