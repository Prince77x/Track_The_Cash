from fastapi import APIRouter, HTTPException, status
from backend.app.schemas import LoginRequest, LoginResponse
from backend.app.auth import DEMO_USERS, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest):
    user = DEMO_USERS.get(request.username)
    if not user or user["password"] != request.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    access_token = create_access_token(
        data={"sub": request.username, "role": user["role"]}
    )
    return LoginResponse(
        access_token=access_token,
        role=user["role"],
        expires_in=28800
    )
