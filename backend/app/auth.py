import datetime
from typing import Optional, Dict, Any
import jwt
import bcrypt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models import LEAOfficer, CitizenUser, AuditLog, utc_now

security = HTTPBearer(auto_error=False)

# Hardcoded demo users for fast SIH hackathon evaluation
DEMO_USERS = {
    "lea_user": {"password": "lea_pass", "role": "lea", "full_name": "Insp. Vikram Rathore"},
    "admin_user": {"password": "admin_pass", "role": "admin", "full_name": "Director S. Verma"},
    "demo_citizen": {"password": "citizen123", "role": "user", "full_name": "Rohan Mehta", "public_user_id": "TTC-USER-00124"}
}


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        # Fallback for plain demo passwords if any
        return plain_password == hashed_password


def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token has expired"
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )


def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required"
        )
    token = credentials.credentials
    payload = decode_access_token(token)
    username = payload.get("sub")
    role = payload.get("role")
    if username is None or role is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims"
        )
    return {
        "username": username,
        "role": role,
        "full_name": payload.get("full_name", username),
        "officer_id": payload.get("officer_id", None),
        "public_user_id": payload.get("public_user_id", None) or payload.get("user_id", None),
        "email": payload.get("email", None)
    }


def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return user


def require_citizen(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user.get("role") not in ["user", "citizen", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Citizen portal access required"
        )
    return user


def require_authenticated(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    return user


def record_audit(
    db: Session,
    admin_user: str,
    action: str,
    resource: str,
    resource_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: str = "127.0.0.1"
) -> AuditLog:
    """Helper to persist audit logs for all administrative actions."""
    log_entry = AuditLog(
        timestamp=utc_now(),
        admin_user=admin_user,
        action=action,
        resource=resource,
        resource_id=resource_id,
        details=details or {},
        ip_address=ip_address
    )
    db.add(log_entry)
    db.commit()
    return log_entry
