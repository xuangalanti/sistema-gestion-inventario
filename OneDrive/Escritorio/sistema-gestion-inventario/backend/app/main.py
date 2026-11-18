import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, movimientos, productos
from app.core.config import settings
from app.core.exceptions import ReglaNegocioError, regla_negocio_exception_handler
from app.core.logging_config import logger

app = FastAPI(
    title="API Sistema de Gestión de Inventario",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(ReglaNegocioError, regla_negocio_exception_handler)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
    logger.info(
        "HTTP Request",
        extra={
            "extra_data": {
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
            }
        },
    )
    return response


app.include_router(auth.router)
app.include_router(productos.router)
app.include_router(movimientos.router)
