from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password
from app.api.deps import get_current_user
from app.db.models import User, UserRole, RentalPreference
from app.schemas.user import UserResponse
from app.schemas.profile import ProfileUpdate, PreferenceBase, PreferenceResponse, PasswordChange, MessageResponse

router = APIRouter()

# Same minimum as registration (UserCreate); bcrypt only uses the first 72 bytes of a password
MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_BYTES = 72

@router.get("/", response_model=UserResponse)
def get_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role = db.query(UserRole.role).filter(UserRole.user_id == current_user.id).first()
    return {
        **UserResponse.model_validate(current_user).model_dump(),
        "role": role[0] if role else None,
    }

@router.put("/", response_model=UserResponse)
def update_profile(profile_in: ProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if profile_in.first_name: current_user.first_name = profile_in.first_name
    if profile_in.last_name: current_user.last_name = profile_in.last_name
    if profile_in.phone: current_user.phone = profile_in.phone
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/change-password", response_model=MessageResponse)
def change_password(data: PasswordChange, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Change the logged-in user's password. Requires the current password."""
    if not current_user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account signs in with Google and has no password to change.",
        )
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")
    if len(data.new_password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"New password must be at least {MIN_PASSWORD_LENGTH} characters.",
        )
    if len(data.new_password.encode("utf-8")) > MAX_PASSWORD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="New password is too long (maximum 72 characters).",
        )
    if data.new_password == data.current_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password.",
        )

    current_user.password_hash = get_password_hash(data.new_password)
    current_user.updated_at = func.now()
    db.commit()
    return {"message": "Password changed successfully."}

@router.get("/preferences", response_model=PreferenceResponse)
def get_preferences(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pref = db.query(RentalPreference).filter(RentalPreference.user_id == current_user.id).first()
    if not pref:
        return PreferenceResponse()
    return pref

@router.put("/preferences", response_model=PreferenceResponse)
def update_preferences(pref_in: PreferenceBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pref = db.query(RentalPreference).filter(RentalPreference.user_id == current_user.id).first()
    if not pref:
        pref = RentalPreference(user_id=current_user.id)
        db.add(pref)
    
    if pref_in.property_type is not None: pref.property_type = pref_in.property_type
    if pref_in.budget_min is not None: pref.budget_min = pref_in.budget_min
    if pref_in.budget_max is not None: pref.budget_max = pref_in.budget_max
    if pref_in.city is not None: pref.city = pref_in.city
    if pref_in.furnishing_status is not None: pref.furnishing_status = pref_in.furnishing_status
    
    db.commit()
    db.refresh(pref)
    return pref