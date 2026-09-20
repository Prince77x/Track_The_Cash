import datetime
from typing import Any, Dict, Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models import User

security = HTTPBearer(auto_error=False)


def get_demo_user(db: Session, username: str, password: Optional[str] = None) -> Optional[User]:
    if not settings.DEMO_MODE_ENABLED or username not in {"lea_user", "admin_user"}:
        return None

    user = db.query(User).filter(User.username == username).first()
    if user or password is None:
        return user

    expected_password = "lea_pass" if username == "lea_user" else "admin_pass"
    if password != expected_password:
        return None

    user = User(
        username=username,
        email=f"{username}@trackthecash.local",
        password_hash=hash_password(password),
        name="LEA Field Officer" if username == "lea_user" else "I4C Admin Analyst",
        mobile_no="0000000000",
        state="Uttar Pradesh",
        district="Lucknow",
        role="LEA" if username == "lea_user" else "ADMIN",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + (
        expires_delta or datetime.timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session token has expired") from exc
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token") from exc


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication token required")

    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("user_id")
    username = payload.get("sub")
    if not user_id and not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token claims")

    user = db.query(User).filter(User.id == user_id).first() if user_id else db.query(User).filter(User.username == username).first()
    if not user and username:
        demo_password = "lea_pass" if username == "lea_user" else "admin_pass"
        user = get_demo_user(db, username, demo_password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")
    return user


def require_authenticated(user: User = Depends(get_current_user)) -> User:
    return user


def require_role(required_role: str):
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role.upper() != required_role.upper():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"{required_role.upper()} role required")
        return user

    return dependency


def require_roles(*required_roles: str):
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role.upper() not in {role.upper() for role in required_roles}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient privileges")
        return user

    return dependency


def require_admin(user: User = Depends(get_current_user)) -> User:
    return require_role("ADMIN")(user)
