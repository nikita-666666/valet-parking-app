from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.parking import (
    Parking, ParkingCreate, ParkingUpdate,
    ParkingTariff, ParkingTariffCreate, ParkingTariffUpdate
)
from app.crud.parking import parking, parking_tariff

router = APIRouter()

@router.get("/", response_model=List[Parking])
def get_parkings(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Получить список парковок.
    """
    return parking.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=Parking)
def create_parking(
    *,
    db: Session = Depends(deps.get_db),
    parking_in: ParkingCreate,
):
    """
    Создать новую парковку.
    """
    return parking.create(db=db, obj_in=parking_in)

@router.get("/{parking_id}", response_model=Parking)
def get_parking(
    *,
    db: Session = Depends(deps.get_db),
    parking_id: int,
):
    """
    Получить парковку по ID.
    """
    result = parking.get(db=db, id=parking_id)
    if not result:
        raise HTTPException(status_code=404, detail="Parking not found")
    return result

@router.post("/{parking_id}/tariffs/", response_model=ParkingTariff)
def create_parking_tariff(
    *,
    db: Session = Depends(deps.get_db),
    parking_id: int,
    tariff_in: ParkingTariffCreate,
):
    """
    Добавить тариф для парковки.
    """
    if not parking.get(db=db, id=parking_id):
        raise HTTPException(status_code=404, detail="Parking not found")
    return parking_tariff.create(db=db, obj_in=tariff_in)

@router.get("/{parking_id}/tariffs/", response_model=List[ParkingTariff])
def get_parking_tariffs(
    *,
    db: Session = Depends(deps.get_db),
    parking_id: int,
):
    """
    Получить все активные тарифы парковки.
    """
    return parking_tariff.get_active_by_parking(db=db, parking_id=parking_id)

@router.put("/{parking_id}/tariffs/{tariff_id}", response_model=ParkingTariff)
def update_parking_tariff(
    *,
    db: Session = Depends(deps.get_db),
    parking_id: int,
    tariff_id: int,
    tariff_in: ParkingTariffUpdate,
):
    """
    Обновить тариф парковки.
    """
    db_parking = parking.get(db=db, id=parking_id)
    if not db_parking:
        raise HTTPException(status_code=404, detail="Parking not found")
        
    db_tariff = parking_tariff.get(db=db, id=tariff_id)
    if not db_tariff or db_tariff.parking_id != parking_id:
        raise HTTPException(status_code=404, detail="Tariff not found")
        
    return parking_tariff.update(db=db, db_obj=db_tariff, obj_in=tariff_in)

@router.delete("/{parking_id}/tariffs/{tariff_id}", response_model=ParkingTariff)
def delete_parking_tariff(
    *,
    db: Session = Depends(deps.get_db),
    parking_id: int,
    tariff_id: int,
):
    """
    Удалить тариф парковки.
    """
    db_parking = parking.get(db=db, id=parking_id)
    if not db_parking:
        raise HTTPException(status_code=404, detail="Parking not found")
        
    db_tariff = parking_tariff.get(db=db, id=tariff_id)
    if not db_tariff or db_tariff.parking_id != parking_id:
        raise HTTPException(status_code=404, detail="Tariff not found")
        
    return parking_tariff.remove(db=db, id=tariff_id) 