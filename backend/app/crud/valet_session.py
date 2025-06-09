from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.valet_session import ValetSession
from app.schemas.valet_session import ValetSessionCreate, ValetSessionUpdate
from app.crud.parking_tariff import parking_tariff
from datetime import datetime
from decimal import Decimal
import random
import string

class CRUDValetSession:
    def get(self, db: Session, id: int) -> Optional[ValetSession]:
        return db.query(ValetSession).filter(ValetSession.id == id).first()

    def get_active_by_location(
        self, 
        db: Session, 
        location_id: int
    ) -> List[ValetSession]:
        return db.query(ValetSession).filter(
            ValetSession.location_id == location_id,
            ValetSession.status.in_(['created', 'car_accepted', 'parked', 'return_requested', 'returning'])
        ).all()

    def get_by_employee(
        self, 
        db: Session, 
        employee_id: int,
        status: Optional[str] = None
    ) -> List[ValetSession]:
        query = db.query(ValetSession).filter(ValetSession.employee_id == employee_id)
        if status:
            query = query.filter(ValetSession.status == status)
        return query.all()

    def get_multi(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[ValetSession]:
        return db.query(ValetSession).offset(skip).limit(limit).all()

    def _assign_auto_tariff(self, db: Session, session_data: dict) -> int:
        """Автоматически назначает тариф на основе типа клиента"""
        is_resident = session_data.get('has_subscription', False)
        
        if is_resident:
            # Для резидентов - ищем тариф по умолчанию для резидентов (ID 8)
            tariff = parking_tariff.get_default_for_residents(db)
            if not tariff:
                # Резервный вариант - тариф ID 8 "Резидент - Бесплатно"
                tariff = parking_tariff.get(db, 8)
        else:
            # Для гостей - ищем тариф по умолчанию для гостей (ID 9) 
            tariff = parking_tariff.get_default_for_guests(db)
            if not tariff:
                # Резервный вариант - тариф ID 9 "Гостевой - Стандарт"
                tariff = parking_tariff.get(db, 9)
        
        return tariff.id if tariff else (8 if is_resident else 9)

    def _calculate_and_save_cost(self, db: Session, session: ValetSession, finalize: bool = False) -> ValetSession:
        """Рассчитывает и сохраняет стоимость сессии"""
        if not session.tariff_id:
            return session
            
        try:
            # Получаем тариф
            tariff = parking_tariff.get(db, session.tariff_id)
            if not tariff:
                return session
                
            # Рассчитываем стоимость
            end_time = datetime.utcnow() if not finalize else session.updated_at
            cost_result = parking_tariff.calculate_cost(
                tariff=tariff,
                start_time=session.created_at,
                end_time=end_time
            )
            
            # Сохраняем результат
            session.calculated_cost = Decimal(str(cost_result.get('cost', 0)))
            session.cost_calculation_details = cost_result.get('calculation', {})
            session.cost_calculated_at = datetime.utcnow()
            
            if finalize:
                session.is_cost_final = True
                
            db.add(session)
            db.commit()
            db.refresh(session)
            
        except Exception as e:
            print(f"Ошибка расчета стоимости для сессии {session.id}: {e}")
            
        return session

    def create(self, db: Session, *, obj_in: ValetSessionCreate) -> ValetSession:
        obj_data = obj_in.model_dump()
        
        # Временно убираем employee_id если он равен несуществующему ID
        if obj_data.get('employee_id') and obj_data['employee_id'] == 1:
            # Проверяем, существует ли сотрудник с таким ID
            from app.models.employee import Employee
            employee = db.query(Employee).filter(Employee.id == obj_data['employee_id']).first()
            if not employee:
                obj_data['employee_id'] = None
        
        # Автоматически назначаем тариф если не указан
        if not obj_data.get('tariff_id'):
            tariff_id = self._assign_auto_tariff(db, obj_data)
            if tariff_id:
                obj_data['tariff_id'] = tariff_id
        
        # Генерируем номер сессии если не указан
        if not obj_data.get('session_number'):
            obj_data['session_number'] = self._generate_session_number()
        
        # Конвертируем списки фотографий в строки URL-ов (разделенные запятыми)
        if obj_data.get('photos'):
            obj_data['car_photos_urls'] = ','.join([photo['url'] for photo in obj_data['photos']])
            del obj_data['photos']
        if obj_data.get('parking_photos'):
            obj_data['parking_photos_urls'] = ','.join([photo['url'] for photo in obj_data['parking_photos']])
            del obj_data['parking_photos']
        if obj_data.get('return_start_photos'):
            obj_data['return_start_photos_urls'] = ','.join([photo['url'] for photo in obj_data['return_start_photos']])
            del obj_data['return_start_photos']
        if obj_data.get('return_delivery_photos'):
            obj_data['return_delivery_photos_urls'] = ','.join([photo['url'] for photo in obj_data['return_delivery_photos']])
            del obj_data['return_delivery_photos']
        
        # Удаляем любые оставшиеся поля с фотографиями, которых нет в модели
        photo_fields_to_remove = ['photos', 'parking_photos', 'return_start_photos', 'return_delivery_photos']
        for field in photo_fields_to_remove:
            if field in obj_data:
                del obj_data[field]
        
        db_obj = ValetSession(**obj_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # Для новых сессий устанавливаем минимальную стоимость на основе тарифа
        if db_obj.tariff_id:
            tariff = parking_tariff.get(db, db_obj.tariff_id)
            if tariff:
                if tariff.tariff_type == 'free':
                    db_obj.calculated_cost = Decimal('0.00')
                elif tariff.tariff_type == 'hourly':
                    # Минимум 1 час для почасовых тарифов
                    db_obj.calculated_cost = Decimal(str(tariff.price_per_hour or 0))
                elif tariff.tariff_type == 'daily':
                    # Минимум 1 день для суточных тарифов  
                    db_obj.calculated_cost = Decimal(str(tariff.price_per_day or 0))
                else:
                    # Для VIP и других - минимум 1 час
                    db_obj.calculated_cost = Decimal(str(tariff.price_per_hour or 0))
                
                db_obj.cost_calculated_at = datetime.utcnow()
                db_obj.cost_calculation_details = {
                    "tariff_type": tariff.tariff_type,
                    "tariff_name": tariff.name,
                    "initial_cost": True,
                    "price_per_hour": float(tariff.price_per_hour or 0),
                    "price_per_day": float(tariff.price_per_day or 0),
                    "minimum_charge": float(db_obj.calculated_cost)
                }
                
                db.add(db_obj)
                db.commit()
                db.refresh(db_obj)
        
        return db_obj

    def _generate_session_number(self) -> str:
        """Генерирует уникальный номер сессии"""
        return ''.join(random.choices(string.digits, k=6))

    def update(self, db: Session, *, db_obj: ValetSession, obj_in: ValetSessionUpdate) -> ValetSession:
        update_data = obj_in.model_dump(exclude_unset=True)
        
        # Конвертируем списки фотографий в строки URL-ов
        if 'photos' in update_data and update_data['photos'] is not None:
            update_data['car_photos_urls'] = ','.join([photo['url'] for photo in update_data['photos']])
            del update_data['photos']
        if 'parking_photos' in update_data and update_data['parking_photos'] is not None:
            update_data['parking_photos_urls'] = ','.join([photo['url'] for photo in update_data['parking_photos']])
            del update_data['parking_photos']
        if 'return_start_photos' in update_data and update_data['return_start_photos'] is not None:
            update_data['return_start_photos_urls'] = ','.join([photo['url'] for photo in update_data['return_start_photos']])
            del update_data['return_start_photos']
        if 'return_delivery_photos' in update_data and update_data['return_delivery_photos'] is not None:
            update_data['return_delivery_photos_urls'] = ','.join([photo['url'] for photo in update_data['return_delivery_photos']])
            del update_data['return_delivery_photos']
        
        # Удаляем любые оставшиеся поля с фотографиями, которых нет в модели
        photo_fields_to_remove = ['photos', 'parking_photos', 'return_start_photos', 'return_delivery_photos']
        for field in photo_fields_to_remove:
            if field in update_data:
                del update_data[field]
        
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # Пересчитываем стоимость при обновлении (кроме завершенных сессий)
        finalize_cost = update_data.get('status') == 'completed'
        if not db_obj.is_cost_final:
            db_obj = self._calculate_and_save_cost(db, db_obj, finalize=finalize_cost)
        
        return db_obj

    def update_status(
        self, 
        db: Session, 
        *, 
        session_id: int, 
        new_status: str,
        parking_spot: Optional[str] = None,
        notes: Optional[str] = None
    ) -> ValetSession:
        db_obj = self.get(db, session_id)
        if db_obj:
            db_obj.status = new_status
            if parking_spot:
                db_obj.parking_spot = parking_spot
            if notes:
                db_obj.notes = notes
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            
            # Пересчитываем стоимость
            finalize_cost = new_status == 'completed'
            if not db_obj.is_cost_final:
                db_obj = self._calculate_and_save_cost(db, db_obj, finalize=finalize_cost)
        return db_obj

    def update_tariff(self, db: Session, *, session_id: int, tariff_id: int) -> ValetSession:
        """Обновляет тариф сессии и пересчитывает стоимость"""
        db_obj = self.get(db, session_id)
        if db_obj and not db_obj.is_cost_final:
            db_obj.tariff_id = tariff_id
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            
            # Пересчитываем стоимость с новым тарифом
            db_obj = self._calculate_and_save_cost(db, db_obj)
        return db_obj

    def recalculate_cost(self, db: Session, *, session_id: int, finalize: bool = False) -> ValetSession:
        """Принудительно пересчитывает стоимость сессии"""
        db_obj = self.get(db, session_id)
        if db_obj:
            db_obj = self._calculate_and_save_cost(db, db_obj, finalize=finalize)
        return db_obj

    def remove(self, db: Session, *, id: int) -> ValetSession:
        obj = db.query(ValetSession).get(id)
        db.delete(obj)
        db.commit()
        return obj

valet_session = CRUDValetSession() 