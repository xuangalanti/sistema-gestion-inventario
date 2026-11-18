from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.core.constants import RolUsuario
from app.core.security import create_access_token

router = APIRouter(prefix="/auth", tags=["Autenticación"])


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(payload: LoginRequest):
    usuarios_demo = {
        "admin": ("admin12345", RolUsuario.ADMIN),
        "operador": ("operador123", RolUsuario.OPERADOR),
        "lectura": ("lectura1234", RolUsuario.LECTURA),
    }
    user_record = usuarios_demo.get(payload.username)
    if not user_record or user_record[0] != payload.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas.",
        )
    token = create_access_token({"sub": payload.username, "rol": user_record[1].value})
    return {"access_token": token, "token_type": "bearer", "rol": user_record[1].value}
