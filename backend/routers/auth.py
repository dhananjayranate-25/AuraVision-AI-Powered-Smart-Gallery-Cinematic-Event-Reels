from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Any
import jwt
from bson import ObjectId
from datetime import datetime

from models import UserCreate, UserResponse, Token
from database import get_database
from utils import get_password_hash, verify_password, create_access_token, SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    # Bypassing real JWT validation for MVP local testing
    return {"id": "mock_admin_123", "is_admin": True, "email": "admin@example.com", "full_name": "Demo Admin"}

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    db = get_database()
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user.dict()
    user_dict["password"] = get_password_hash(user_dict["password"])
    user_dict["created_at"] = datetime.utcnow()
    user_dict["is_admin"] = True # Defaulting to admin for testing, usually this should be controlled
    
    result = await db.users.insert_one(user_dict)
    
    return {
        "id": str(result.inserted_id),
        "email": user.email,
        "full_name": user.full_name,
        "is_admin": user_dict["is_admin"],
        "created_at": user_dict["created_at"]
    }

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = get_database()
    user = await db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user
