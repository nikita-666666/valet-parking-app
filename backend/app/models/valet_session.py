from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, JSON, Boolean, DECIMAL
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin

class ValetSession(Base, TimestampMixin):
    __tablename__ = "valet_sessions"

    id = Column(Integer, primary_key=True, index=True)
    # parking_id = Column(Integer, ForeignKey('parkings.id'), nullable=False) # Временно убрано
    employee_id = Column(Integer, ForeignKey('employees.id'), nullable=True)  # Валет ведущий сессию
    request_accepted_by_id = Column(Integer, ForeignKey('employees.id'), nullable=True)  # Валет принявший запрос
    car_number = Column(String(20), nullable=False)
    car_model = Column(String(100))
    car_color = Column(String(50))
    client_name = Column(String(100))
    client_phone = Column(String(20))
    client_card_number = Column(String(20))
    parking_spot = Column(String(50))
    parking_card = Column(String(50))  # Номер парковочной карты
    has_subscription = Column(Boolean, default=False)  # Есть ли активный абонемент
    notes = Column(Text)
    status = Column(String(20), default="created")
    session_number = Column(String(10))
    tariff_id = Column(Integer, ForeignKey('parking_tariffs.id'))
    photo_url = Column(String(255))
    # Поля для URL-ов фотографий (разделенные запятыми)
    car_photos_urls = Column(Text, nullable=True)  # URL-ы фото при приеме
    parking_photos_urls = Column(Text, nullable=True)  # URL-ы фото с парковки  
    return_start_photos_urls = Column(Text, nullable=True)  # URL-ы фото перед подачей
    return_delivery_photos_urls = Column(Text, nullable=True)  # URL-ы фото подачи клиенту
    
    # Поля для хранения стоимости
    calculated_cost = Column(DECIMAL(10, 2), nullable=True, default=0.00)  # Рассчитанная стоимость
    cost_calculation_details = Column(JSON, nullable=True)  # Детали расчета стоимости
    cost_calculated_at = Column(DateTime, nullable=True)  # Когда был произведен расчет
    is_cost_final = Column(Boolean, default=False)  # Финальна ли стоимость (для завершенных сессий)
    
    # Поля для оплаты
    payment_status = Column(String(20), default="pending")  # pending, paid, partial
    payment_method = Column(String(50), nullable=True)  # cash, card, online, etc.
    paid_amount = Column(DECIMAL(10, 2), nullable=True, default=0.00)  # Сумма оплаты
    payment_date = Column(DateTime, nullable=True)  # Дата оплаты
    payment_reference = Column(String(100), nullable=True)  # Номер транзакции/чека

    employee = relationship("Employee", foreign_keys=[employee_id], back_populates="valet_sessions")
    request_accepted_by = relationship("Employee", foreign_keys=[request_accepted_by_id])
    tariff = relationship("ParkingTariff", foreign_keys=[tariff_id])
    logs = relationship("ValetSessionLog", back_populates="session")

class ValetSessionLog(Base, TimestampMixin):
    __tablename__ = "valet_session_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('valet_sessions.id'), nullable=False)
    employee_id = Column(Integer, ForeignKey('employees.id'), nullable=True)
    action = Column(String(50), nullable=False)  # created, car_accepted, en_route, parked, return_requested, returning, completed
    description = Column(String(255), nullable=False)
    details = Column(Text, nullable=True)

    session = relationship("ValetSession", back_populates="logs")
    employee = relationship("Employee")