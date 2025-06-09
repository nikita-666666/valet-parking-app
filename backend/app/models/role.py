from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Table, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

# Промежуточная таблица для связи многие-ко-многим между ролями и разрешениями
role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id', ondelete='CASCADE'), primary_key=True)
)

class Permission(Base, TimestampMixin):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), nullable=False, unique=True)  # Код разрешения (valet_mobile, valet_sessions, admin_panel)
    name = Column(String(255), nullable=False)  # Название разрешения
    description = Column(Text)  # Описание разрешения
    module = Column(String(100))  # Модуль системы (valet, admin, client)
    is_active = Column(Boolean, default=True)

    # Отношения
    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")

class Role(Base, TimestampMixin):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    is_system = Column(Boolean, default=False)  # Системная роль (нельзя удалить)

    # Отношения
    employees = relationship("Employee", back_populates="role")
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles") 