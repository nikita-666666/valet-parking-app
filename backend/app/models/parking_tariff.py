from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class ParkingTariff(Base, TimestampMixin):
    __tablename__ = "parking_tariffs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # Название тарифа
    description = Column(Text)  # Подробное описание тарифа
    tariff_type = Column(String(20), nullable=False, default='hourly')  # hourly, daily, free, vip
    price_per_hour = Column(Float, nullable=False, default=0.0)  # Цена за час
    price_per_day = Column(Float, default=0.0)  # Цена за день (для суточных тарифов)
    minimum_hours = Column(Integer, default=1)  # Минимальное количество часов
    maximum_hours = Column(Integer)  # Максимальное количество часов (для ограниченных тарифов)
    free_minutes = Column(Integer, default=0)  # Бесплатные минуты (грейс-период)
    is_active = Column(Boolean, default=True)  # Активен ли тариф
    is_default_for_residents = Column(Boolean, default=False)  # Тариф по умолчанию для резидентов
    is_default_for_guests = Column(Boolean, default=False)  # Тариф по умолчанию для гостей
    # parking_id = Column(Integer, ForeignKey('parkings.id'), nullable=False) # Временно убрано
    
    # Отношения
    # parking = relationship("Parking", back_populates="tariffs") # Временно убрано 