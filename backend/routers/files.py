"""
File Manager - files.py
"""

from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from auth import get_current_user
from database import get_db
from models import FileRecord, User
from schemas import DeleteResponse, FileOut
import uuid
import aiofiles

router = APIRouter(prefix="/files", tags=["files"])

UPLOAD_DIR = Path("./uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_MIME_TYPES = {
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "text/csv",
}
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".txt", ".csv"}


@router.post("/upload", response_model=FileOut, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    original_name = file.filename or "unknown"
    suffix = Path(original_name).suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File type '{suffix}' is not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    mime_type = file.content_type or "application/octet-stream"

    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"MIME type '{mime_type}' is not allowed.",
        )

    contents = await file.read()
    size = len(contents)

    if size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the 10 MB limit (received {size / 1024 / 1024:.2f} MB)",
        )

    if size == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File is empty",
        )

    storage_key = f"{uuid.uuid4().hex}{suffix}"
    dest = UPLOAD_DIR / storage_key

    async with aiofiles.open(dest, "wb") as out_file:
        await out_file.write(contents)

    record = FileRecord(
        owner_id=current_user.id,
        original_name=original_name,
        storage_key=storage_key,
        mime_type=mime_type,
        size_bytes=size,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return record


@router.get("/", response_model=list[FileOut])
def list_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = (
        db.query(FileRecord)
        .filter(FileRecord.owner_id == current_user.id, FileRecord.deleted == False)
        .order_by(FileRecord.created_at.desc())
        .all()
    )
    return records


@router.get("/{file_id}/download")
async def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),):
    record = db.get(FileRecord, file_id)

    if not record or record.deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    
    if record.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    path = UPLOAD_DIR / record.storage_key

    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on disk")

    async def file_stream():
        async with aiofiles.open(path, "rb") as f:
            while chunk := await f.read(64 * 1024):  # 64 KB chunks
                yield chunk

    headers = {
        "Content-Disposition": f'attachment; filename="{record.original_name}"',
        "Content-Length": str(record.size_bytes),
    }

    return StreamingResponse(file_stream(), media_type=record.mime_type, headers=headers)


@router.delete("/{file_id}", response_model=DeleteResponse)
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.get(FileRecord, file_id)

    if not record or record.deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    if record.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    path = UPLOAD_DIR / record.storage_key

    if path.exists():
        path.unlink()

    record.deleted = True
    db.commit()

    return DeleteResponse(message="File deleted successfully")