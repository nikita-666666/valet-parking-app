from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.crud.parking_tariff import parking_tariff
from app.schemas.parking_tariff import (
    ParkingTariff,
    ParkingTariffCreate,
    ParkingTariffUpdate,
    TariffCalculationRequest,
    TariffCalculationResponse
)

router = APIRouter()

@router.get("/", response_model=List[ParkingTariff])
def get_tariffs(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    parking_id: int = None,
    active_only: bool = True
):
    """
    Получить список тарифов
    """
    tariffs = parking_tariff.get_multi(
        db=db, 
        skip=skip, 
        limit=limit,
        parking_id=parking_id,
        active_only=active_only
    )
    return tariffs

@router.get("/by-type/{tariff_type}", response_model=List[ParkingTariff])
def get_tariffs_by_type(
    tariff_type: str,
    parking_id: int,
    db: Session = Depends(get_db)
):
    """
    Получить тарифы по типу (hourly, daily, free, vip)
    """
    tariffs = parking_tariff.get_by_type(db=db, tariff_type=tariff_type, parking_id=parking_id)
    return tariffs

@router.get("/defaults/residents/{parking_id}", response_model=ParkingTariff)
def get_default_residents_tariff(
    parking_id: int,
    db: Session = Depends(get_db)
):
    """
    Получить тариф по умолчанию для резидентов
    """
    tariff = parking_tariff.get_default_for_residents(db=db, parking_id=parking_id)
    if not tariff:
        raise HTTPException(status_code=404, detail="Тариф для резидентов не найден")
    return tariff

@router.get("/defaults/guests/{parking_id}", response_model=ParkingTariff)
def get_default_guests_tariff(
    parking_id: int,
    db: Session = Depends(get_db)
):
    """
    Получить тариф по умолчанию для гостей
    """
    tariff = parking_tariff.get_default_for_guests(db=db, parking_id=parking_id)
    if not tariff:
        raise HTTPException(status_code=404, detail="Тариф для гостей не найден")
    return tariff

@router.get("/auto/{parking_id}")
def get_auto_tariff(
    parking_id: int,
    has_subscription: bool = False,
    db: Session = Depends(get_db)
):
    """
    Автоматическое определение тарифа на основе типа клиента
    """
    tariff = parking_tariff.get_auto_tariff(
        db=db, 
        parking_id=parking_id, 
        has_subscription=has_subscription
    )
    if not tariff:
        raise HTTPException(
            status_code=404, 
            detail=f"Подходящий тариф для {'резидентов' if has_subscription else 'гостей'} не найден"
        )
    return tariff

@router.post("/calculate", response_model=TariffCalculationResponse)
def calculate_tariff_cost(
    *,
    db: Session = Depends(get_db),
    calculation_request: TariffCalculationRequest
):
    """
    Расчет стоимости парковки по тарифу
    """
    try:
        result = parking_tariff.calculate_cost(
            db=db,
            tariff_id=calculation_request.tariff_id,
            duration_hours=calculation_request.duration_hours,
            has_subscription=calculation_request.has_subscription
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/", response_model=ParkingTariff)
def create_tariff(
    *,
    db: Session = Depends(get_db),
    tariff_in: ParkingTariffCreate
):
    """
    Создать новый тариф
    """
    tariff = parking_tariff.create(db=db, obj_in=tariff_in)
    return tariff

@router.get("/{id}", response_model=ParkingTariff)
def get_tariff(
    *,
    db: Session = Depends(get_db),
    id: int
):
    """
    Получить тариф по ID
    """
    tariff = parking_tariff.get(db=db, id=id)
    if not tariff:
        raise HTTPException(status_code=404, detail="Тариф не найден")
    return tariff

@router.put("/{id}", response_model=ParkingTariff)
def update_tariff(
    *,
    db: Session = Depends(get_db),
    id: int,
    tariff_in: ParkingTariffUpdate
):
    """
    Обновить тариф
    """
    tariff = parking_tariff.get(db=db, id=id)
    if not tariff:
        raise HTTPException(status_code=404, detail="Тариф не найден")
    tariff = parking_tariff.update(db=db, db_obj=tariff, obj_in=tariff_in)
    return tariff

@router.delete("/{id}", response_model=ParkingTariff)
def delete_tariff(
    *,
    db: Session = Depends(get_db),
    id: int
):
    """
    Удалить тариф
    """
    tariff = parking_tariff.get(db=db, id=id)
    if not tariff:
        raise HTTPException(status_code=404, detail="Тариф не найден")
    tariff = parking_tariff.remove(db=db, id=id)
    return tariff

@router.post("/{id}/set-default-residents")
def set_default_residents_tariff(
    *,
    db: Session = Depends(get_db),
    id: int
):
    """
    Установить тариф как тариф по умолчанию для резидентов
    """
    tariff = parking_tariff.get(db=db, id=id)
    if not tariff:
        raise HTTPException(status_code=404, detail="Тариф не найден")
    
    update_data = ParkingTariffUpdate(is_default_for_residents=True)
    tariff = parking_tariff.update(db=db, db_obj=tariff, obj_in=update_data)
    return {"message": "Тариф установлен как тариф по умолчанию для резидентов"}

@router.post("/{id}/set-default-guests")
def set_default_guests_tariff(
    *,
    db: Session = Depends(get_db),
    id: int
):
    """
    Установить тариф как тариф по умолчанию для гостей
    """
    tariff = parking_tariff.get(db=db, id=id)
    if not tariff:
        raise HTTPException(status_code=404, detail="Тариф не найден")
    
    update_data = ParkingTariffUpdate(is_default_for_guests=True)
    tariff = parking_tariff.update(db=db, db_obj=tariff, obj_in=update_data)
    return {"message": "Тариф установлен как тариф по умолчанию для гостей"} 