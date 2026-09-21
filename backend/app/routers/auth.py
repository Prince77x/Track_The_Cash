import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas import LoginRequest, LoginResponse, CitizenRegisterRequest
from backend.app.models import LEAOfficer, CitizenUser, utc_now
from backend.app.auth import DEMO_USERS, create_access_token, verify_password, hash_password

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
                    "full_name": demo_user.get("full_name", username),
                    "public_user_id": demo_user.get("public_user_id", None)
                }
            )
            return LoginResponse(
                access_token=access_token,
                role=demo_user["role"],
                expires_in=28800,
                public_user_id=demo_user.get("public_user_id", None),
                full_name=demo_user.get("full_name", username)
            )

    # 2. Check dynamic database LEA Officers
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
                expires_in=28800,
                full_name=officer.full_name
            )

    # 3. Check dynamic database Citizen Users
    citizen = db.query(CitizenUser).filter(
        (CitizenUser.username == username) | (CitizenUser.email == username)
    ).first()
    if citizen:
        if not citizen.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Citizen account has been deactivated. Please reach out to Citizen Grievance Cell."
            )
        if verify_password(password, citizen.password_hash):
            citizen.last_login_at = utc_now()
            db.commit()

            access_token = create_access_token(
                data={
                    "sub": citizen.username,
                    "role": "user",
                    "full_name": citizen.full_name,
                    "public_user_id": citizen.public_user_id,
                    "email": citizen.email
                }
            )
            return LoginResponse(
                access_token=access_token,
                role="user",
                expires_in=28800,
                public_user_id=citizen.public_user_id,
                full_name=citizen.full_name,
                email=citizen.email
            )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials. Verify your username/email and password."
    )


@router.post("/register", response_model=LoginResponse)
def register_citizen(req: CitizenRegisterRequest, db: Session = Depends(get_db)):
    # Check if username or email already exists
    existing_user = db.query(CitizenUser).filter(
        (CitizenUser.username == req.username) | (CitizenUser.email == req.email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email is already registered."
        )

    # Generate public citizen ID
    public_id = f"TTC-USER-{uuid.uuid4().hex[:6].upper()}"
    new_citizen = CitizenUser(
        public_user_id=public_id,
        username=req.username.strip(),
        email=req.email.strip().lower(),
        phone=req.phone.strip() if req.phone else None,
        full_name=req.full_name.strip(),
        password_hash=hash_password(req.password),
        role="user",
        state=req.state.strip(),
        district=req.district.strip(),
        city=req.city.strip() if req.city else req.district.strip(),
        address=req.address.strip() if req.address else "",
        is_active=True,
        is_verified=True,
        created_at=utc_now(),
        updated_at=utc_now(),
        last_login_at=utc_now()
    )
    db.add(new_citizen)
    db.commit()
    db.refresh(new_citizen)

    # Auto-generate access token
    access_token = create_access_token(
        data={
            "sub": new_citizen.username,
            "role": "user",
            "full_name": new_citizen.full_name,
            "public_user_id": new_citizen.public_user_id,
            "email": new_citizen.email
        }
    )

    return LoginResponse(
        access_token=access_token,
        role="user",
        expires_in=28800,
        public_user_id=new_citizen.public_user_id,
        full_name=new_citizen.full_name,
        email=new_citizen.email
    )
