import os
import uuid
import mimetypes
from pathlib import Path
from fastapi import UploadFile, HTTPException

EVIDENCE_DIR = Path("/app/data/evidence")
if not os.path.exists("/app/data"):
    # Fallback for local development outside docker container
    EVIDENCE_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "evidence"

EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".webp", ".pdf", ".txt", ".csv",
    ".docx", ".xlsx", ".mp4", ".json", ".zip"
}

ALLOWED_MIME_PREFIXES = {
    "image/", "application/pdf", "text/", "video/mp4",
    "application/vnd.openxmlformats-officedocument",
    "application/zip", "application/x-zip-compressed", "application/json"
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def validate_file(file: UploadFile) -> str:
    """Validate file extension and size."""
    filename = file.filename or "evidence.dat"
    ext = Path(filename).suffix.lower()
    
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File extension '{ext}' is not allowed. Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )
    return ext


async def save_evidence_file(file: UploadFile, user_id: str, complaint_id: str) -> dict:
    """Save an uploaded evidence file safely with uuid naming."""
    ext = validate_file(file)
    file_id = f"EV-{uuid.uuid4().hex[:12].upper()}"
    saved_filename = f"{file_id}{ext}"
    
    # User / complaint subfolder for organization
    target_folder = EVIDENCE_DIR / user_id
    target_folder.mkdir(parents=True, exist_ok=True)
    file_path = target_folder / saved_filename
    
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed limit of {MAX_FILE_SIZE // (1024 * 1024)}MB"
        )
        
    with open(file_path, "wb") as f:
        f.write(content)
        
    mime_type, _ = mimetypes.guess_type(file.filename or "")
    if not mime_type:
        mime_type = file.content_type or "application/octet-stream"
        
    return {
        "file_id": file_id,
        "original_filename": file.filename or "evidence.dat",
        "saved_path": str(file_path),
        "file_size": len(content),
        "file_type": mime_type
    }


def get_evidence_path(saved_path: str) -> Path:
    """Verify and retrieve the path to the evidence file."""
    path = Path(saved_path)
    if not path.exists():
        # Check relative fallback
        rel_path = EVIDENCE_DIR / path.name
        if rel_path.exists():
            return rel_path
        raise HTTPException(status_code=404, detail="Evidence file not found on disk")
    return path
