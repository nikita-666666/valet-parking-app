from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
from .role import Role

class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    role_id: Optional[int] = None
    is_active: Optional[bool] = True
    available_locations: Optional[str] = None
    telegram_id: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    password: str

class EmployeeUpdate(EmployeeBase):
    password: Optional[str] = None

class EmployeeInDB(EmployeeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    role: Role

    class Config:
        from_attributes = True

class Employee(EmployeeInDB):
    hashed_password: str

class EmployeeList(EmployeeBase):
    id: int
    
    class Config:
        from_attributes = True 