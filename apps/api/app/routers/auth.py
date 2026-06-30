from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import UserVerifyToken, UserCreate, UserResponse, TokenResponse
from app.models import User, ProviderProfile
from app.firebase import firebase_service
from app.security import create_access_token, create_refresh_token
from datetime import datetime

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

    # 2. Check if user already registered in PostgreSQL
    db_user = db.query(User).filter(User.firebase_uid == uid).first()
    
    if not db_user:
        # Enforce role mapping rules
        if email == "9369022460sa@gmail.com":
            role = "ADMIN"
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
        # Update login details
        db_user.last_login = datetime.utcnow()
        if picture:
            db_user.profile_photo = picture
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
            role = "ADMIN"
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

    if db_user.role == "PROVIDER":
        existing_profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == db_user.id).first()
        if not existing_profile:
            profile = ProviderProfile(
                user_id=db_user.id,
                category=dto.category or "Plumber",
                experience_yrs=dto.experience_yrs or 1,
                is_verified=(db_user.status == "APPROVED")
            )
            db.add(profile)
            db.commit()

    return db_user
