from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.config import settings
from app.core.constants import RolUsuario
from app.core.database import get_db
from app.core.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_optional_db():
    if settings.USE_MOCK_DB:
        yield None
        return
    yield from get_db()


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación requerido.",
        )
    try:
        payload = decode_access_token(credentials.credentials)
        return {"username": payload["sub"], "rol": RolUsuario(payload["rol"])}
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado.",
        )


def require_roles(roles_permitidos: List[RolUsuario]):
    def role_checker(user: dict = Depends(get_current_user)) -> dict:
        if user["rol"] not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tenés permisos suficientes para realizar esta acción.",
            )
        return user

    return role_checker
