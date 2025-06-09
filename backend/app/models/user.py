from sqlalchemy import Column, Integer, String, Enum
from app.models.base import Base, TimestampMixin

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    phone = Column(String(20), unique=True)
    password_hash = Column(String(255))
    role = Column(Enum('admin', 'employee', 'client'), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    status = Column(Enum('active', 'inactive'), default='active')