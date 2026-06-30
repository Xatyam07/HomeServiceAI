import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
import cloudinary
import cloudinary.uploader
from app.config import settings

router = APIRouter()

# Local upload directory setup
UPLOAD_DIR = "/code/static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    # 1. Try Cloudinary if configured
    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
        try:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET
            )
            # Upload using cloudinary.uploader
            upload_result = cloudinary.uploader.upload(
                file.file,
                resource_type="auto",
                folder="homesphere_docs"
            )
            return {"url": upload_result.get("secure_url")}
        except Exception as e:
            print(f"Cloudinary upload failed: {e}. Falling back to local storage.")
            
    # 2. Local Storage Fallback
    try:
        # Generate a unique name
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        dest_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save file contents
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return URL pointing to mounted static directory
        url = f"http://localhost:8000/static/uploads/{unique_filename}"
        return {"url": url}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload file in local storage: {str(e)}"
        )
