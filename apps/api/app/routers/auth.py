from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import UserVerifyToken, UserCreate, UserResponse, TokenResponse
from app.models import User, ProviderProfile
from app.firebase import firebase_service
from datetime import datetime
from app.dependencies import get_current_user
from app.security import create_access_token, create_refresh_token

router = APIRouter()

@router.post("/verify", response_model=TokenResponse)
def verify_firebase_token(payload: UserVerifyToken, db: Session = Depends(get_db)):
    token = payload.id_token
    
    # 1. Decode token using initialized singleton
    try:
        decoded_token = firebase_service.verify_token(token)
        uid = decoded_token['uid']
        email = decoded_token.get('email', f"{uid}@homesphere.com")
        name = decoded_token.get('name', 'HomeSphere User')
        phone = decoded_token.get('phone_number')
        picture = decoded_token.get('picture')
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Firebase Token: {str(e)}"
        )

    # 2. Check if user already registered in PostgreSQL by UID or Email
    db_user = db.query(User).filter((User.firebase_uid == uid) | (User.email == email)).first()
    
    if not db_user:
        # Enforce role mapping rules
        if email == "9369022460sa@gmail.com":
            role = "SUPER_ADMIN"
            account_status = "ACTIVE"
        elif email == "xatyammishra07@gmail.com":
            role = "PROVIDER"
            account_status = "APPROVED"
        else:
            role = payload.role if payload.role in ["CUSTOMER", "PROVIDER"] else "CUSTOMER"
            account_status = "PENDING" if role == "PROVIDER" else "ACTIVE"

        # Create user record
        db_user = User(
            email=email,
            name=name,
            phone=phone,
            role=role,
            status=account_status,
            firebase_uid=uid,
            profile_photo=picture,
            last_login=datetime.utcnow()
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        # Initialize provider profile if they are a professional
        if role == "PROVIDER":
            existing_profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == db_user.id).first()
            if not existing_profile:
                profile = ProviderProfile(
                    user_id=db_user.id,
                    category="Plumber", # Default placeholder category
                    experience_yrs=1,
                    is_verified=(account_status == "APPROVED")
                )
                db.add(profile)
                db.commit()
    else:
        # Update login details and sync firebase_uid
        db_user.last_login = datetime.utcnow()
        db_user.firebase_uid = uid
        if db_user.email != email:
            db_user.email = email
        if email == "9369022460sa@gmail.com" and db_user.role != "SUPER_ADMIN":
            db_user.role = "SUPER_ADMIN"
            db_user.status = "ACTIVE"
        if email == "xatyammishra07@gmail.com" and db_user.role != "PROVIDER":
            db_user.role = "PROVIDER"
            db_user.status = "APPROVED"
        if picture:
            db_user.profile_photo = picture
        
        # Ensure provider profile is initialized
        if db_user.role == "PROVIDER":
            existing_profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == db_user.id).first()
            if not existing_profile:
                profile = ProviderProfile(
                    user_id=db_user.id,
                    category="Plumber",
                    experience_yrs=5,
                    is_verified=True,
                    is_available=True,
                    rating=4.8,
                    latitude=17.4485,
                    longitude=78.3741
                )
                db.add(profile)
        db.commit()
        db.refresh(db_user)

    # 3. Issue backend JWT tokens
    token_data = {
        "sub": str(db_user.id),
        "email": db_user.email,
        "role": db_user.role,
        "status": db_user.status
    }
    
    access = create_access_token(data=token_data)
    refresh = create_refresh_token(data={"sub": str(db_user.id)})

    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "user": db_user
    }

@router.post("/register-profile", response_model=UserResponse)
def register_user_profile(dto: UserCreate, db: Session = Depends(get_db)):
    # Legacy registry fallback support
    uid = f"local_{dto.email.split('@')[0]}"
    db_user = db.query(User).filter(User.email == dto.email).first()
    
    if not db_user:
        # Enforce email based role seeding
        if dto.email == "9369022460sa@gmail.com":
            role = "SUPER_ADMIN"
            status_val = "ACTIVE"
        elif dto.email == "xatyammishra07@gmail.com":
            role = "PROVIDER"
            status_val = "APPROVED"
        else:
            role = dto.role
            status_val = "PENDING" if role == "PROVIDER" else "ACTIVE"

        db_user = User(
            email=dto.email,
            name=dto.name,
            phone=dto.phone,
            role=role,
            status=status_val,
            firebase_uid=uid
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    else:
        # Update user name & phone
        db_user.name = dto.name or db_user.name
        db_user.phone = dto.phone or db_user.phone
        if dto.email == "9369022460sa@gmail.com" and db_user.role != "SUPER_ADMIN":
            db_user.role = "SUPER_ADMIN"
        db.commit()
        db.refresh(db_user)

    if db_user.role == "PROVIDER":
        existing_profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == db_user.id).first()
        if not existing_profile:
            profile = ProviderProfile(
                user_id=db_user.id,
                category=dto.category or "Plumber",
                experience_yrs=dto.experience_yrs or 1,
                hourly_rate=dto.hourly_rate or 150.0,
                skills=dto.skills,
                bio=dto.bio,
                address=dto.address,
                city=dto.city,
                aadhaar_url=dto.aadhaar_url,
                pan_url=dto.pan_url,
                selfie_url=dto.selfie_url,
                certificate_url=dto.certificate_url,
                is_verified=(db_user.status == "APPROVED")
            )
            db.add(profile)
        else:
            # Update existing profile
            existing_profile.category = dto.category or existing_profile.category
            existing_profile.experience_yrs = dto.experience_yrs or existing_profile.experience_yrs
            existing_profile.hourly_rate = dto.hourly_rate or existing_profile.hourly_rate
            existing_profile.skills = dto.skills or existing_profile.skills
            existing_profile.bio = dto.bio or existing_profile.bio
            existing_profile.address = dto.address or existing_profile.address
            existing_profile.city = dto.city or existing_profile.city
            existing_profile.aadhaar_url = dto.aadhaar_url or existing_profile.aadhaar_url
            existing_profile.pan_url = dto.pan_url or existing_profile.pan_url
            existing_profile.selfie_url = dto.selfie_url or existing_profile.selfie_url
            existing_profile.certificate_url = dto.certificate_url or existing_profile.certificate_url
            existing_profile.is_verified = (db_user.status == "APPROVED")
        db.commit()

    return db_user

@router.put("/testing/switch-category")
def switch_category(
    category: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if current_user.email.lower() != "xatyammishra07@gmail.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Testing mode is only available for the default test professional account."
        )
    
    try:
        profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
        if not profile:
            profile = ProviderProfile(
                user_id=current_user.id,
                category=category,
                experience_yrs=5,
                hourly_rate=350.0,
                city="Hyderabad",
                is_verified=True,
                is_available=True,
                rating=4.8,
                latitude=17.4485,
                longitude=78.3741
            )
            db.add(profile)
        else:
            profile.category = category
        
        current_user.status = "APPROVED"
        db.commit()
        return {"status": "SUCCESS", "message": f"Switched category to {category} successfully."}
    except Exception as e:
        import traceback
        from fastapi.responses import JSONResponse
        db.rollback()
        error_msg = str(e)
        details = traceback.format_exc()
        print(f"ERROR: Exception occurred in /testing/switch-category: {error_msg}\n{details}")
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": "Error switching category in database",
                "details": f"{error_msg}\n{details}"
            }
        )
