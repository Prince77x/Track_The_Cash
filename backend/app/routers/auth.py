from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas import LoginRequest, LoginResponse
from backend.app.models import LEAOfficer, utc_now
from backend.app.auth import DEMO_USERS, create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    username = request.username.strip()
    password = request.password

    # 1. Check in-memory demo users first (fast path for judge evaluation)
    if username in DEMO_USERS:
        demo_user = DEMO_USERS[username]
        if demo_user["password"] == password:
            access_token = create_access_token(
                data={
                    "sub": username,
                    "role": demo_user["role"],
                    "full_name": demo_user.get("full_name", username)
                }
            )
            return LoginResponse(
                access_token=access_token,
                role=demo_user["role"],
                expires_in=28800
            )

    # 2. Check dynamic database LEA Officers
    try:
        officer = db.query(LEAOfficer).filter_by(username=username).first()
        if officer:
            if not officer.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Officer account is deactivated. Contact National Administrator."
                )
            if verify_password(password, officer.password_hash):
                officer.last_active_at = utc_now()
                db.commit()

                access_token = create_access_token(
                    data={
                        "sub": officer.username,
                        "role": officer.role or "lea",
                        "full_name": officer.full_name,
                        "officer_id": officer.officer_id
                    }
                )
                return LoginResponse(
                    access_token=access_token,
                    role=officer.role or "lea",
                    expires_in=28800
                )
    except HTTPException:
        raise
    except Exception:
        pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password"
    )
