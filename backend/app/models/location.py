from sqlalchemy import Column, Integer, String, Text, Enum, Float
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Location(Base, TimestampMixin):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    description = Column(Text)
    status = Column(Enum('active', 'inactive'), default='active')

    # Добавляем связь с парковками
    parkings = relationship("Parking", back_populates="location")