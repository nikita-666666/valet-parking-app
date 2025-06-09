from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class PermissionBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    module: Optional[str] = None
    is_active: bool = True

class PermissionCreate(PermissionBase):
    pass

class PermissionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    module: Optional[str] = None
    is_active: Optional[bool] = None

class Permission(PermissionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True

class RoleCreate(RoleBase):
    permission_ids: Optional[List[int]] = []

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    permission_ids: Optional[List[int]] = None

class Role(RoleBase):
    id: int
    is_system: bool = False
    permissions: List[Permission] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RoleSimple(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True 