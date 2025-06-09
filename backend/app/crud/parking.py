from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.parking import Parking
from app.models.parking_tariff import ParkingTariff
from app.schemas.parking import ParkingCreate, ParkingUpdate, ParkingTariffCreate

class CRUDParking(CRUDBase):
    def __init__(self):
        super().__init__(Parking)

    def get_with_tariffs(self, db: Session, *, id: int) -> Optional[Parking]:
        return db.query(Parking).filter(Parking.id == id).first()

    def get_by_location(self, db: Session, *, location_id: int) -> List[Parking]:
        return db.query(Parking).filter(Parking.location_id == location_id).all()

class CRUDParkingTariff(CRUDBase):
    def __init__(self):
        super().__init__(ParkingTariff)

    def get_active_by_parking(self, db: Session, *, parking_id: int) -> List[ParkingTariff]:
        return db.query(ParkingTariff).filter(
            ParkingTariff.parking_id == parking_id,
            ParkingTariff.is_active == True
        ).all()

parking = CRUDParking()
parking_tariff = CRUDParkingTariff() 