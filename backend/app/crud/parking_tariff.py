from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.parking_tariff import ParkingTariff
from app.schemas.parking_tariff import ParkingTariffCreate, ParkingTariffUpdate
import math

class CRUDParkingTariff:
    def get(self, db: Session, id: int) -> Optional[ParkingTariff]:
        return db.query(ParkingTariff).filter(ParkingTariff.id == id).first()

    def get_multi(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100,
        parking_id: Optional[int] = None,
        active_only: bool = True
    ) -> List[ParkingTariff]:
        query = db.query(ParkingTariff)
        
        # Временно убираем фильтрацию по parking_id, так как поле закомментировано в модели
        # if parking_id:
        #     query = query.filter(ParkingTariff.parking_id == parking_id)
        
        if active_only:
            query = query.filter(ParkingTariff.is_active == True)
        
        return query.offset(skip).limit(limit).all()

    def get_default_for_residents(self, db: Session, parking_id: Optional[int] = None) -> Optional[ParkingTariff]:
        """Получить тариф по умолчанию для резидентов"""
        query = db.query(ParkingTariff).filter(
            ParkingTariff.is_default_for_residents == True,
            ParkingTariff.is_active == True
        )
        # if parking_id:
        #     query = query.filter(ParkingTariff.parking_id == parking_id)
        return query.first()

    def get_default_for_guests(self, db: Session, parking_id: Optional[int] = None) -> Optional[ParkingTariff]:
        """Получить тариф по умолчанию для гостей"""
        query = db.query(ParkingTariff).filter(
            ParkingTariff.is_default_for_guests == True,
            ParkingTariff.is_active == True
        )
        # if parking_id:
        #     query = query.filter(ParkingTariff.parking_id == parking_id)
        return query.first()

    def get_by_type(self, db: Session, tariff_type: str, parking_id: int) -> List[ParkingTariff]:
        """Получить тарифы по типу"""
        return db.query(ParkingTariff).filter(
            # ParkingTariff.parking_id == parking_id,  # Временно убрано
            ParkingTariff.tariff_type == tariff_type,
            ParkingTariff.is_active == True
        ).all()

    def create(self, db: Session, *, obj_in: ParkingTariffCreate) -> ParkingTariff:
        # Если устанавливается тариф по умолчанию, сбрасываем флаг у других тарифов
        if obj_in.is_default_for_residents:
            db.query(ParkingTariff).filter(
                # ParkingTariff.parking_id == obj_in.parking_id
                ParkingTariff.is_active == True
            ).update({ParkingTariff.is_default_for_residents: False})
            
        if obj_in.is_default_for_guests:
            db.query(ParkingTariff).filter(
                # ParkingTariff.parking_id == obj_in.parking_id
                ParkingTariff.is_active == True
            ).update({ParkingTariff.is_default_for_guests: False})

        obj_data = obj_in.model_dump()
        db_obj = ParkingTariff(**obj_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, 
        db: Session, 
        *, 
        db_obj: ParkingTariff, 
        obj_in: ParkingTariffUpdate
    ) -> ParkingTariff:
        update_data = obj_in.model_dump(exclude_unset=True)
        
        # Если устанавливается тариф по умолчанию, сбрасываем флаг у других тарифов
        if update_data.get('is_default_for_residents'):
            db.query(ParkingTariff).filter(
                # ParkingTariff.parking_id == db_obj.parking_id,
                ParkingTariff.id != db_obj.id,
                ParkingTariff.is_active == True
            ).update({ParkingTariff.is_default_for_residents: False})
            
        if update_data.get('is_default_for_guests'):
            db.query(ParkingTariff).filter(
                # ParkingTariff.parking_id == db_obj.parking_id,
                ParkingTariff.id != db_obj.id,
                ParkingTariff.is_active == True
            ).update({ParkingTariff.is_default_for_guests: False})

        # Проверяем, изменилась ли стоимость
        price_changed = (
            'price_per_hour' in update_data or 
            'price_per_day' in update_data or
            'free_minutes' in update_data
        )

        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # Если изменилась стоимость, сбрасываем кеш для активных сессий
        if price_changed:
            self._reset_active_sessions_cost(db, db_obj.id)
        
        return db_obj
    
    def _reset_active_sessions_cost(self, db: Session, tariff_id: int):
        """Сбрасывает сохраненную стоимость для всех активных сессий с указанным тарифом"""
        from app.models.valet_session import ValetSession
        
        try:
            # Получаем все активные сессии с этим тарифом
            active_sessions = db.query(ValetSession).filter(
                ValetSession.tariff_id == tariff_id,
                ValetSession.status.in_(['created', 'car_accepted', 'en_route', 'parked', 'return_requested', 'return_accepted', 'return_started', 'return_delivering']),
                ValetSession.is_cost_final == False
            ).all()
            
            print(f"Сбрасываем кеш стоимости для {len(active_sessions)} активных сессий с тарифом {tariff_id}")
            
            for session in active_sessions:
                # Сбрасываем сохраненную стоимость, чтобы заставить пересчет
                session.calculated_cost = None
                session.cost_calculated_at = None
                session.cost_calculation_details = None
                db.add(session)
            
            db.commit()
            print(f"Стоимость будет пересчитана при следующем обращении к сессиям.")
            
        except Exception as e:
            print(f"Ошибка сброса кеша стоимости: {e}")
            db.rollback()

    def remove(self, db: Session, *, id: int) -> ParkingTariff:
        obj = db.query(ParkingTariff).get(id)
        db.delete(obj)
        db.commit()
        return obj

    def calculate_cost(
        self, 
        db: Session, 
        tariff_id: int, 
        duration_hours: float,
        has_subscription: bool = False
    ) -> dict:
        """Расчет стоимости парковки по тарифу"""
        tariff = self.get(db, tariff_id)
        if not tariff:
            raise ValueError(f"Тариф с ID {tariff_id} не найден")

        # Для резидентов с бесплатными тарифами
        if has_subscription and tariff.tariff_type == 'free':
            return {
                'tariff_name': tariff.name,
                'duration_hours': duration_hours,
                'free_minutes_used': min(duration_hours * 60, tariff.free_minutes or 999999),
                'billable_hours': 0,
                'total_cost': 0.0,
                'tariff_type': tariff.tariff_type,
                'breakdown': {
                    'reason': 'Бесплатная парковка для резидентов',
                    'tariff_description': tariff.description
                }
            }

        # Грейс-период (бесплатные минуты)
        free_hours = (tariff.free_minutes or 0) / 60
        billable_hours = max(0, duration_hours - free_hours)

        # Минимальные часы к оплате
        if billable_hours > 0 and billable_hours < tariff.minimum_hours:
            billable_hours = tariff.minimum_hours

        # Максимальные часы (если есть ограничение)
        if tariff.maximum_hours and billable_hours > tariff.maximum_hours:
            billable_hours = tariff.maximum_hours

        # Расчет стоимости
        billable_hours_rounded = billable_hours  # по умолчанию
        
        if tariff.tariff_type == 'daily' and tariff.price_per_day:
            # Суточный тариф
            days = math.ceil(billable_hours / 24)
            total_cost = days * tariff.price_per_day
            breakdown = {
                'type': 'daily',
                'days': days,
                'price_per_day': tariff.price_per_day,
                'calculation': f"{days} дн. × {tariff.price_per_day} ₽ = {total_cost} ₽"
            }
        else:
            # Почасовой тариф - округляем неполные часы вверх
            billable_hours_rounded = math.ceil(billable_hours) if billable_hours > 0 else 0
            total_cost = billable_hours_rounded * tariff.price_per_hour
            breakdown = {
                'type': 'hourly',
                'actual_hours': round(billable_hours, 2),
                'billable_hours': billable_hours_rounded,
                'price_per_hour': tariff.price_per_hour,
                'calculation': f"{billable_hours_rounded} ч. (округлено вверх) × {tariff.price_per_hour} ₽ = {round(total_cost, 2)} ₽"
            }

        if tariff.free_minutes:
            breakdown['free_minutes'] = f"Первые {tariff.free_minutes} мин. бесплатно"

        # Определяем финальные биллируемые часы
        final_billable_hours = billable_hours_rounded if tariff.tariff_type in ['hourly', 'vip'] else billable_hours

        return {
            'tariff_name': tariff.name,
            'duration_hours': duration_hours,
            'free_minutes_used': min(duration_hours * 60, tariff.free_minutes or 0),
            'billable_hours': final_billable_hours,
            'total_cost': round(total_cost, 2),
            'tariff_type': tariff.tariff_type,
            'breakdown': breakdown
        }

    def get_auto_tariff(
        self, 
        db: Session, 
        parking_id: Optional[int] = None, 
        has_subscription: bool = False
    ) -> Optional[ParkingTariff]:
        """Автоматическое определение тарифа на основе типа клиента"""
        if has_subscription:
            # Для резидентов - ищем тариф по умолчанию для резидентов
            tariff = self.get_default_for_residents(db)
            if not tariff:
                # Если нет специального тарифа для резидентов, берем резидентский тариф (ID 8)
                tariff = self.get(db, 8)
        else:
            # Для гостей - ищем тариф по умолчанию для гостей
            tariff = self.get_default_for_guests(db) 
            if not tariff:
                # Если нет специального тарифа для гостей, берем гостевой тариф (ID 9)
                tariff = self.get(db, 9)

        return tariff

parking_tariff = CRUDParkingTariff() 