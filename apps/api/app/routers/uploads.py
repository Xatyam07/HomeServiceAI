import os
import uuid
import shutil
import tempfile
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException
import cloudinary
import cloudinary.uploader

from app.config import settings

router = APIRouter()

# -----------------------------
# Temporary writable directory
# -----------------------------
UPLOAD_DIR = Path(tempfile.gettempdir()) / "homesphere_uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload file to Cloudinary if configured.
    Otherwise temporarily store it locally.
    """

    # =============================
    # Cloudinary Upload (Preferred)
    # =============================
    if (
        settings.CLOUDINARY_CLOUD_NAME
        and settings.CLOUDINARY_API_KEY
        and settings.CLOUDINARY_API_SECRET
    ):

        try:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True,
            )

            result = cloudinary.uploader.upload(
                file.file,
                resource_type="auto",
                folder="homesphere_uploads",
            )

            return {
                "success": True,
                "storage": "cloudinary",
                "url": result["secure_url"],
                "public_id": result["public_id"],
            }

        except Exception as e:
            print(f"Cloudinary upload failed: {e}")
            file.file.seek(0)

    # =============================
    # Local Temporary Storage
    # =============================
    try:

        extension = os.path.splitext(file.filename)[1]
        filename = f"{uuid.uuid4()}{extension}"

        destination = UPLOAD_DIR / filename

        with open(destination, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {
            "success": True,
            "storage": "local-temp",
            "filename": filename,
            "path": str(destination),
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}",
        )
