from sqlalchemy import Column, Integer, String, Enum, ForeignKey
from app.models.base import Base, TimestampMixin

class Photo(Base, TimestampMixin):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, index=True)
    valet_session_id = Column(Integer, ForeignKey('valet_sessions.id'))
    photo_url = Column(String(255))
    photo_type = Column(Enum('before', 'after'))