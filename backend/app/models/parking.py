from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class Parking(Base, TimestampMixin):
    __tablename__ = "parkings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    parking_type = Column(String(50))  # открытая, закрытая, подземная и т.д.
    floor_count = Column(Integer)  # этажность
    total_spaces = Column(Integer)  # количество мест
    location_id = Column(Integer, ForeignKey('locations.id'), nullable=True)
    
    # Отношения
    location = relationship("Location", back_populates="parkings")
    # tariffs = relationship("ParkingTariff", back_populates="parking") # Временно убрано
    # valet_sessions = relationship("ValetSession", back_populates="parking") # Временно убрано 