import os
import uuid
import shutil
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import cloudinary
import cloudinary.uploader

from app.config import settings

router = APIRouter()

# -----------------------------
# Temporary writable directory (Render-safe)
# -----------------------------
UPLOAD_DIR = Path(tempfile.gettempdir()) / "homesphere_uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    folder: Optional[str] = Form(None),
    old_public_id: Optional[str] = Form(None),
):
    """
    Upload file directly to Cloudinary under mapped folders.
    If replacing an existing file, deletes the old public_id from Cloudinary first.
    """

    # 1. Cloudinary Upload Backend (Preferred and standard for Production)
    if (
        settings.CLOUDINARY_CLOUD_NAME
        and settings.CLOUDINARY_API_KEY
        and settings.CLOUDINARY_API_SECRET
    ):
        try:
            # Delete old image if public_id is provided
            if old_public_id:
                try:
                    cloudinary.uploader.destroy(old_public_id)
                    print(f"Deleted old Cloudinary asset: {old_public_id}")
                except Exception as del_err:
                    print(f"Warning: Failed to delete old Cloudinary asset {old_public_id}: {del_err}")

            # Define folder name, fallback if none provided
            target_folder = folder if folder else "homesphere_general"

            result = cloudinary.uploader.upload(
                file.file,
                resource_type="auto",
                folder=target_folder,
            )

            return {
                "success": True,
                "storage": "cloudinary",
                "url": result["secure_url"],
                "public_id": result["public_id"],
            }

        except Exception as e:
            print(f"Cloudinary upload failed: {e}. Attempting fallback...")
            file.file.seek(0)

    # 2. Local Temporary Storage Fallback (Render-safe tmp)
    try:
        extension = os.path.splitext(file.filename)[1]
        filename = f"{uuid.uuid4()}{extension}"
        destination = UPLOAD_DIR / filename

        with open(destination, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # In production local temporary storage cannot serve files, but we return a mockup url for test/development
        temp_url = f"https://api.homesphere.ai/static/temp/{filename}"

        return {
            "success": True,
            "storage": "local-temp",
            "url": temp_url,
            "filename": filename,
            "path": str(destination),
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}",
        )
