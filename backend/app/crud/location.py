from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.location import Location
from app.schemas.location import LocationCreate, LocationUpdate

class CRUDLocation:
    def get(self, db: Session, location_id: int) -> Optional[Location]:
        return db.query(Location).filter(Location.id == location_id).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[Location]:
        return db.query(Location).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: LocationCreate) -> Location:
        db_obj = Location(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: Location, obj_in: LocationUpdate) -> Location:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, *, location_id: int) -> Location:
        obj = db.query(Location).get(location_id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj

location = CRUDLocation() 