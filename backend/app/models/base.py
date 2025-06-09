from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from sqlalchemy import Column, DateTime
import pytz

Base = declarative_base()

def moscow_now():
    """Возвращает текущее время в московском часовом поясе"""
    moscow_tz = pytz.timezone('Europe/Moscow')
    return datetime.now(moscow_tz)

class TimestampMixin:
    created_at = Column(DateTime, default=moscow_now, nullable=False)
    updated_at = Column(DateTime, default=moscow_now, onupdate=moscow_now, nullable=False)

