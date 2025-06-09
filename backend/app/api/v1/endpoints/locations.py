from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.crud.location import location
from app.schemas.location import Location, LocationCreate, LocationUpdate

router = APIRouter()

@router.get("/", response_model=List[Location])
def read_locations(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Получить список локаций.
    """
    locations = location.get_multi(db, skip=skip, limit=limit)
    return locations

@router.post("/", response_model=Location)
def create_location(
    *,
    db: Session = Depends(get_db),
    location_in: LocationCreate,
):
    """
    Создать новую локацию.
    """
    location_obj = location.create(db=db, obj_in=location_in)
    return location_obj

@router.get("/{location_id}", response_model=Location)
def read_location(
    location_id: int,
    db: Session = Depends(get_db),
):
    """
    Получить информацию о конкретной локации.
    """
    location_obj = location.get(db=db, location_id=location_id)
    if not location_obj:
        raise HTTPException(status_code=404, detail="Location not found")
    return location_obj

@router.put("/{location_id}", response_model=Location)
def update_location(
    *,
    db: Session = Depends(get_db),
    location_id: int,
    location_in: LocationUpdate,
):
    """
    Обновить локацию.
    """
    location_obj = location.get(db=db, location_id=location_id)
    if not location_obj:
        raise HTTPException(status_code=404, detail="Location not found")
    location_obj = location.update(db=db, db_obj=location_obj, obj_in=location_in)
    return location_obj

@router.delete("/{location_id}", response_model=Location)
def delete_location(
    *,
    db: Session = Depends(get_db),
    location_id: int,
):
    """
    Удалить локацию.
    """
    location_obj = location.get(db=db, location_id=location_id)
    if not location_obj:
        raise HTTPException(status_code=404, detail="Location not found")
    location_obj = location.delete(db=db, location_id=location_id)
    return location_obj 