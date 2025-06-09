from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from app.models.base import Base, TimestampMixin

class Employee(Base, TimestampMixin):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"))
    is_active = Column(Boolean, default=True)
    available_locations = Column(String(255))  # Список ID локаций через запятую
    telegram_id = Column(String(100))  # Для связи с телеграм ботом
    
    # Отношения - используем строковые ссылки для избежания circular imports
    role = relationship("Role", back_populates="employees")
    valet_sessions = relationship("ValetSession", foreign_keys="[ValetSession.employee_id]", back_populates="employee")
    accepted_requests = relationship("ValetSession", foreign_keys="[ValetSession.request_accepted_by_id]")
    
    @hybrid_property
    def full_name(self):
        return f"{self.first_name} {self.last_name}" 