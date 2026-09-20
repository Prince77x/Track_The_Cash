from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.auth import create_access_token, get_current_user, get_demo_user, hash_password, require_roles, verify_password
from backend.app.database import get_db
from backend.app.models import User
from backend.app.schemas import LoginRequest, LoginResponse, UserCreate, UserOut

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])
legacy_router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter((User.username == payload.username) | (User.email == payload.email)).first():
        raise HTTPException(status_code=400, detail="Username or email already exists")

    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
        name=payload.name,
        mobile_no=payload.mobile_no,
        state=payload.state,
        district=payload.district,
        address=payload.address,
        role=payload.role.upper(),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user:
        user = get_demo_user(db, request.username, request.password)
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    token = create_access_token({"sub": user.username, "user_id": user.id, "role": user.role.upper()})
    return LoginResponse(access_token=token, role=user.role.lower(), expires_in=28800)


@legacy_router.post("/login", response_model=LoginResponse)
def legacy_login(request: LoginRequest, db: Session = Depends(get_db)):
    return login(request, db)


@router.get("/me", response_model=UserOut)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@legacy_router.get("/me", response_model=UserOut)
def legacy_get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/admin-check")
def admin_check(_: User = Depends(require_roles("ADMIN"))):
    return {"ok": True}


@legacy_router.get("/admin-check")
def legacy_admin_check(_: User = Depends(require_roles("ADMIN"))):
    return {"ok": True}
