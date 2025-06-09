from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.sql import or_

from app.api.deps import get_db, get_current_user_optional
from app.crud.valet_session import valet_session
from app.crud.parking_tariff import parking_tariff
from app.schemas.valet_session import (
    ValetSession,
    ValetSessionCreate,
    ValetSessionUpdate,
    ValetSessionList,
    PhotoData,
    PaymentRequest,
    PaymentResponse
)
from app.models.valet_session import ValetSession as ValetSessionModel, ValetSessionLog
from app.models.employee import Employee


router = APIRouter()

def convert_urls_to_photos(urls_string: str) -> List[PhotoData]:
    """Преобразует строку URL-ов в массив объектов PhotoData"""
    if not urls_string or urls_string is None:
        return []
    
    urls = [url.strip() for url in urls_string.split(',') if url.strip()]
    photos = []
    
    for i, url in enumerate(urls):
        photos.append(PhotoData(
            id=str(i + 1),
            url=url,
            filename=url.split('/')[-1] if '/' in url else url,
            original_name=url.split('/')[-1] if '/' in url else url,
            timestamp=None,
            category=None
        ))
    
    return photos

def enhance_session_with_photos(session: ValetSessionModel) -> dict:
    """Добавляет массивы фотографий к объекту сессии и данные о сотрудниках"""
    
    # Проверяем и получаем employee
    employee_data = None
    if session.employee_id and session.employee:
        employee_data = {
            "id": session.employee.id,
            "full_name": session.employee.full_name,
            "email": session.employee.email
        }
    
    # Проверяем и получаем request_accepted_by
    request_accepted_by_data = None
    if hasattr(session, 'request_accepted_by_id') and session.request_accepted_by_id and session.request_accepted_by:
        request_accepted_by_data = {
            "id": session.request_accepted_by.id,
            "full_name": session.request_accepted_by.full_name,
            "email": session.request_accepted_by.email
        }
    
    # Проверяем и получаем tariff
    tariff_data = None
    if session.tariff_id and session.tariff:
        tariff_data = {
            "id": session.tariff.id,
            "name": session.tariff.name,
            "tariff_type": session.tariff.tariff_type,
            "price_per_hour": float(session.tariff.price_per_hour or 0),
            "price_per_day": float(session.tariff.price_per_day or 0)
        }
    
    session_dict = {
        "id": session.id,
        # "parking_id": session.parking_id, # Временно убрано
        "employee_id": session.employee_id,
        "request_accepted_by_id": getattr(session, 'request_accepted_by_id', None),
        "car_number": session.car_number,
        "car_model": session.car_model,
        "car_color": session.car_color,
        "client_name": session.client_name,
        "client_phone": session.client_phone,
        "client_card_number": session.client_card_number,
        "parking_spot": session.parking_spot,
        "parking_card": getattr(session, 'parking_card', None),
        "has_subscription": getattr(session, 'has_subscription', False),
        "notes": session.notes,
        "status": session.status,
        "session_number": session.session_number,
        "tariff_id": session.tariff_id,
        "photo_url": session.photo_url,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "updated_at": session.updated_at.isoformat() if session.updated_at else None,
        "calculated_cost": float(session.calculated_cost) if session.calculated_cost else None,
        "cost_calculation_details": getattr(session, 'cost_calculation_details', None),
        "cost_calculated_at": session.cost_calculated_at.isoformat() if getattr(session, 'cost_calculated_at', None) else None,
        "is_cost_final": getattr(session, 'is_cost_final', False),
        "photos": convert_urls_to_photos(getattr(session, 'car_photos_urls', None)),
        "parking_photos": convert_urls_to_photos(getattr(session, 'parking_photos_urls', None)),
        "return_start_photos": convert_urls_to_photos(getattr(session, 'return_start_photos_urls', None)),
        "return_delivery_photos": convert_urls_to_photos(getattr(session, 'return_delivery_photos_urls', None)),
        "employee": employee_data,
        "request_accepted_by": request_accepted_by_data,
        "tariff": tariff_data
    }
    return session_dict

def create_session_log(db: Session, session_id: int, employee_id: int, action: str, description: str, details: str = None):
    """Создать запись в логе сессии"""
    log = ValetSessionLog(
        session_id=session_id,
        employee_id=employee_id,
        action=action,
        description=description,
        details=details
    )
    db.add(log)
    db.commit()
    return log

def get_action_description(action: str) -> str:
    """Получить описание действия на русском языке"""
    action_descriptions = {
        'created': 'Валет-сессия создана',
        'car_accepted': 'Принял автомобиль',
        'en_route': 'В пути на парковку',
        'parked': 'Автомобиль припаркован',
        'return_requested': 'Клиент запросил подачу автомобиля',
        'return_accepted': 'Валет принял запрос на подачу',
        'return_started': 'Валет начал подачу автомобиля',
        'return_delivering': 'Валет подает автомобиль клиенту',
        'completed': 'Автомобиль выдан клиенту',
        'cancelled': 'Сессия отменена'
    }
    return action_descriptions.get(action, action)

@router.post("/", response_model=ValetSession)
def create_valet_session(
    *,
    db: Session = Depends(get_db),
    valet_session_in: ValetSessionCreate,
):
    """
    Создать новую валет-сессию
    """
    # Проверяем, нет ли уже активной сессии с этим номером карты
    active_statuses = ['created', 'car_accepted', 'en_route', 'parked', 'return_requested', 'return_accepted', 'return_started', 'return_delivering']
    
    existing_session = db.query(ValetSessionModel).filter(
        ValetSessionModel.client_card_number == valet_session_in.client_card_number,
        ValetSessionModel.status.in_(active_statuses)
    ).first()
    
    if existing_session:
        raise HTTPException(
            status_code=400, 
            detail=f"Карта {valet_session_in.client_card_number} уже используется в активной сессии (автомобиль {existing_session.car_number})"
        )
    
    # Автоматически определяем тариф, если он не указан
    if not valet_session_in.tariff_id:
        auto_tariff = parking_tariff.get_auto_tariff(
            db=db,
            # parking_id=valet_session_in.parking_id, # Временно убрано
            has_subscription=getattr(valet_session_in, 'has_subscription', False)
        )
        if auto_tariff:
            valet_session_in.tariff_id = auto_tariff.id
    
    valet_session_obj = valet_session.create(db=db, obj_in=valet_session_in)
    
    # Создаем запись в логе
    tariff_details = None
    if valet_session_obj.tariff_id:
        tariff = parking_tariff.get(db=db, id=valet_session_obj.tariff_id)
        if tariff:
            client_type = "резидент" if getattr(valet_session_obj, 'has_subscription', False) else "гость"
            tariff_details = f"Тип клиента: {client_type}, Тариф: {tariff.name}"
    
    create_session_log(
        db=db,
        session_id=valet_session_obj.id,
        employee_id=valet_session_obj.employee_id,
        action='created',
        description=get_action_description('created'),
        details=tariff_details or 'Ответственный за приём'
    )
    
    return enhance_session_with_photos(valet_session_obj)

@router.get("/location/{location_id}/active", response_model=List[ValetSession])
def get_active_sessions(
    location_id: int,
    db: Session = Depends(get_db),
):
    """
    Получить все активные сессии для локации.
    """
    return valet_session.get_active_by_location(db=db, location_id=location_id)

@router.get("/active", response_model=List[ValetSession])
def get_all_active_sessions(
    db: Session = Depends(get_db),
):
    """
    Получить все активные сессии (не в статусе completed, cancelled).
    """
    active_statuses = ['created', 'car_accepted', 'en_route', 'parked', 'return_requested', 'return_accepted', 'return_started', 'return_delivering']
    sessions = db.query(ValetSessionModel).filter(
        ValetSessionModel.status.in_(active_statuses)
    ).order_by(ValetSessionModel.id.desc()).limit(200).all()
    return [enhance_session_with_photos(session) for session in sessions]

@router.get("/check-card/{card_number}")
def check_card_active_session(
    card_number: str,
    db: Session = Depends(get_db),
):
    """
    Проверить, есть ли активная сессия с указанным номером карты.
    """
    active_statuses = ['created', 'car_accepted', 'en_route', 'parked', 'return_requested', 'return_accepted', 'return_started', 'return_delivering']
    
    active_session = db.query(ValetSessionModel).filter(
        ValetSessionModel.client_card_number == card_number,
        ValetSessionModel.status.in_(active_statuses)
    ).first()
    
    if active_session:
        return {
            "has_active_session": True,
            "session_id": active_session.id,
            "car_number": active_session.car_number,
            "status": active_session.status
        }
    else:
        return {
            "has_active_session": False
        }

@router.get("/employee/{employee_id}", response_model=List[ValetSession])
def get_employee_sessions(
    employee_id: int,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Получить сессии сотрудника.
    """
    return valet_session.get_by_employee(db=db, employee_id=employee_id, status=status)

@router.put("/{id}", response_model=ValetSession)
def update_valet_session(
    *,
    db: Session = Depends(get_db),
    id: int,
    valet_session_in: ValetSessionUpdate,
):
    """
    Обновить валет-сессию
    """
    valet_session_obj = valet_session.get(db=db, id=id)
    if not valet_session_obj:
        raise HTTPException(status_code=404, detail="Валет-сессия не найдена")
    
    # Сохраняем старый статус для сравнения
    old_status = valet_session_obj.status
    
    valet_session_obj = valet_session.update(db=db, db_obj=valet_session_obj, obj_in=valet_session_in)
    
    # Если статус изменился, создаем запись в логе и выполняем дополнительные действия
    if hasattr(valet_session_in, 'status') and valet_session_in.status and valet_session_in.status != old_status:
        details = None
        if valet_session_in.status == 'car_accepted':
            details = 'Тариф: Valet Гостевой'
        elif valet_session_in.status == 'parked':
            details = f'Место: {valet_session_obj.parking_spot or "-1,309,р4/ключница"}'
            
            # Автоматически рассчитываем стоимость при парковке для гостей
            if valet_session_obj.tariff_id and not valet_session_obj.has_subscription:
                try:
                    from datetime import datetime
                    from decimal import Decimal
                    import asyncio
                    
                    # Рассчитываем и сохраняем стоимость
                    cost_response = asyncio.run(calculate_session_cost(valet_session_obj.id, db))
                    if cost_response.get('cost', 0) > 0:
                        valet_session_obj.calculated_cost = Decimal(str(cost_response['cost']))
                        valet_session_obj.cost_calculation_details = cost_response.get('calculation', {})
                        valet_session_obj.cost_calculated_at = datetime.utcnow()
                        valet_session_obj.payment_status = "pending"
                        db.add(valet_session_obj)
                        db.commit()
                        
                        # Добавляем лог о расчете стоимости
                        create_session_log(
                            db=db,
                            session_id=valet_session_obj.id,
                            employee_id=valet_session_obj.employee_id,
                            action='cost_calculated',
                            description=f'Рассчитана стоимость: {cost_response["cost"]}₽',
                            details=f'Тариф: {valet_session_obj.tariff.name if valet_session_obj.tariff else "Неизвестно"}'
                        )
                except Exception as e:
                    print(f"Ошибка расчета стоимости при парковке: {e}")
                    
        elif valet_session_in.status == 'return_requested':
            details = f'Карта: {valet_session_obj.client_card_number}'
        elif valet_session_in.status == 'return_accepted':
            details = f'Валет принял запрос клиента'
        elif valet_session_in.status == 'return_started':
            details = f'Валет забрал автомобиль с парковки'
        elif valet_session_in.status == 'return_delivering':
            details = f'Автомобиль подается к месту выдачи'
        elif valet_session_in.status == 'completed':
            details = f'Автомобиль передан клиенту'
        
        create_session_log(
        db=db, 
            session_id=valet_session_obj.id,
            employee_id=valet_session_obj.employee_id,
            action=valet_session_in.status,
            description=get_action_description(valet_session_in.status),
            details=details
        )
    
    return enhance_session_with_photos(valet_session_obj)

@router.get("/", response_model=List[ValetSession])
def get_valet_sessions(
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
):
    """
    Получить список валет сессий с возможностью поиска и фильтрации.
    """
    # Загружаем сессии с связанными данными о сотрудниках и тарифах
    query = db.query(ValetSessionModel).options(
        joinedload(ValetSessionModel.employee),
        joinedload(ValetSessionModel.request_accepted_by),
        joinedload(ValetSessionModel.tariff)
    )
    
    if search:
        query = query.filter(
            or_(
                ValetSessionModel.car_number.ilike(f"%{search}%"),
                ValetSessionModel.car_model.ilike(f"%{search}%"),
                ValetSessionModel.client_name.ilike(f"%{search}%")
            )
        )
    
    if status:
        query = query.filter(ValetSessionModel.status == status)
    
    # Оптимизированная сортировка по ID (быстрее чем по timestamp)
    # и ограничиваем количество записей сразу
    query = query.order_by(ValetSessionModel.id.desc())
    
    sessions = query.offset(skip).limit(limit).all()
    return [enhance_session_with_photos(session) for session in sessions] 

@router.get("/{id}", response_model=ValetSession)
def read_valet_session(
    *,
    db: Session = Depends(get_db),
    id: int,
):
    """
    Получить валет-сессию по ID с данными о сотрудниках
    """
    # Загружаем сессию с связанными данными о сотрудниках и тарифе
    valet_session_obj = db.query(ValetSessionModel).options(
        joinedload(ValetSessionModel.employee),
        joinedload(ValetSessionModel.request_accepted_by),
        joinedload(ValetSessionModel.tariff)
    ).filter(ValetSessionModel.id == id).first()
    
    if not valet_session_obj:
        raise HTTPException(status_code=404, detail="Валет-сессия не найдена")
    
    # Отладочная информация (временно)
    # print(f"DEBUG: Session {id} - employee_id={valet_session_obj.employee_id}, employee object={valet_session_obj.employee}")
    # print(f"DEBUG: Session {id} - request_accepted_by_id={valet_session_obj.request_accepted_by_id}, request_accepted_by object={valet_session_obj.request_accepted_by}")
    # print(f"DEBUG: Session {id} - tariff_id={valet_session_obj.tariff_id}, tariff object={valet_session_obj.tariff}")
    
    return enhance_session_with_photos(valet_session_obj)

@router.delete("/{id}", response_model=ValetSession)
def delete_valet_session(
    *,
    db: Session = Depends(get_db),
    id: int,
):
    """
    Удалить валет-сессию
    """
    valet_session_obj = valet_session.get(db=db, id=id)
    if not valet_session_obj:
        raise HTTPException(status_code=404, detail="Валет-сессия не найдена")
    valet_session_obj = valet_session.remove(db=db, id=id)
    return valet_session_obj

@router.get("/by-card/{card_number}", response_model=ValetSession)
def get_session_by_card(
    card_number: str,
    db: Session = Depends(get_db),
):
    """
    Найти валет-сессию по номеру карты клиента.
    Возвращает активную сессию (любую кроме завершенных и отмененных).
    """
    # Ищем любую активную сессию с этой картой
    active_statuses = ['created', 'car_accepted', 'en_route', 'parked', 'return_requested', 'return_accepted', 'return_started', 'return_delivering']
    
    session = db.query(ValetSessionModel).filter(
        ValetSessionModel.client_card_number == card_number,
        ValetSessionModel.status.in_(active_statuses)
    ).order_by(ValetSessionModel.id.desc()).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Автомобиль с таким номером карты не найден или уже выдан")
    
    return enhance_session_with_photos(session)

@router.get("/{session_id}/logs")
def get_session_logs(
    session_id: int,
    db: Session = Depends(get_db),
):
    """
    Получить лог событий валет-сессии.
    """
    # Проверим, существует ли сессия и загружаем связанные данные
    session = db.query(ValetSessionModel).options(
        joinedload(ValetSessionModel.employee)
    ).filter(ValetSessionModel.id == session_id).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Валет-сессия не найдена")
    
    # Получаем логи с JOIN к Employee для получения полного имени
    logs = db.query(ValetSessionLog, Employee).outerjoin(
        Employee, ValetSessionLog.employee_id == Employee.id
    ).filter(
        ValetSessionLog.session_id == session_id
    ).order_by(ValetSessionLog.id.desc()).limit(100).all()
    
    # Если логов нет, создаем базовые логи для существующих сессий
    if not logs:
        # Создаем базовые логи на основе статуса сессии
        base_logs = []
        
        # Лог создания
        base_logs.append({
            "id": 1,
            "action": "created",
            "description": "Валет-сессия создана",
            "employee_name": session.employee.full_name if session.employee else "Неизвестно",
            "timestamp": session.created_at.isoformat() if session.created_at else None,
            "details": "Ответственный за приём"
        })
        
        if session.status in ['car_accepted', 'en_route', 'parked', 'return_requested', 'return_accepted', 'return_started', 'return_delivering']:
            base_logs.append({
                "id": 2,
                "action": "car_accepted",
                "description": "Принял автомобиль",
                "employee_name": session.employee.full_name if session.employee else "Неизвестно",
                "timestamp": session.created_at.isoformat() if session.created_at else None,
                "details": "Тариф: Valet Гостевой"
            })
        
        if session.status in ['parked', 'return_requested', 'return_accepted', 'return_started', 'return_delivering']:
            base_logs.append({
                "id": 3,
                "action": "parked",
                "description": "Автомобиль припаркован",
                "employee_name": session.employee.full_name if session.employee else "Неизвестно",
                "timestamp": session.updated_at.isoformat() if session.updated_at else session.created_at.isoformat(),
                "details": f"Место: {session.parking_spot or '-1,309,р4/ключница'}"
            })
        
        return base_logs
    
    # Форматируем логи из базы данных
    result = []
    for log_tuple in logs:
        log = log_tuple[0]  # ValetSessionLog
        employee = log_tuple[1]  # Employee (может быть None)
        
        employee_name = employee.full_name if employee else "Система"
        
        result.append({
            "id": log.id,
            "action": log.action,
            "description": log.description,
            "employee_name": employee_name,
            "timestamp": log.created_at.isoformat(),
            "details": log.details
        })
    
    return result 

@router.post("/request-return/{card_number}")
def request_car_return(
    card_number: str,
    db: Session = Depends(get_db),
):
    """
    Запросить подачу автомобиля по номеру карты клиента.
    Проверяет оплату перед разрешением подачи.
    """
    # Ищем активную сессию с этой картой
    session = db.query(ValetSessionModel).filter(
        ValetSessionModel.client_card_number == card_number,
        ValetSessionModel.status.in_(['parked'])  # Можно запросить только припаркованные авто
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=404, 
            detail="Автомобиль с таким номером карты не найден на парковке или еще не припаркован"
        )
    
    # Проверяем наличие неоплаченной стоимости
    if session.calculated_cost and session.calculated_cost > 0:
        paid_amount = session.paid_amount or 0
        remaining_amount = session.calculated_cost - paid_amount
        
        if remaining_amount > 0 and session.payment_status != 'paid':
            return {
                "success": False,
                "requires_payment": True,
                "message": f"Необходимо оплатить парковку: {remaining_amount}₽",
                "session_id": session.id,
                "car_number": session.car_number,
                "total_cost": float(session.calculated_cost),
                "paid_amount": float(paid_amount),
                "remaining_amount": float(remaining_amount),
                "payment_status": session.payment_status
            }
    
    # Обновляем статус на "запрошена подача"
    session.status = 'return_requested'
    db.commit()
    
    # Создаем запись в логе
    create_session_log(
        db=db,
        session_id=session.id,
        employee_id=session.employee_id,  # используем того же валета
        action='return_requested',
        description='Клиент запросил подачу автомобиля',
        details=f'Карта: {card_number}'
    )
    
    return {
        "success": True,
        "message": f"Подача автомобиля {session.car_number} запрошена",
        "session_id": session.id,
        "car_number": session.car_number,
        "status": session.status,
        "payment_status": session.payment_status
    }

@router.get("/{session_id}/calculate-cost")
async def calculate_session_cost(
    session_id: int,
    db: Session = Depends(get_db)
):
    """Рассчитывает стоимость сессии в реальном времени"""
    from datetime import datetime
    from decimal import Decimal
    import math
    
    session = valet_session.get(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Сессия не найдена")
    
    # Если нет тарифа, возвращаем нулевую стоимость
    if not session.tariff_id:
        return {
            "cost": 0,
            "message": "Тариф не назначен",
            "calculation": {}
        }
    
    # Получаем тариф
    tariff = parking_tariff.get(db, session.tariff_id)
    if not tariff:
        return {
            "cost": 0,
            "message": "Тариф не найден",
            "calculation": {}
        }
    
    # Рассчитываем длительность
    start_time = session.created_at
    
    # Для завершенных/отмененных сессий используем время завершения, иначе текущее время
    if session.status in ['completed', 'cancelled']:
        end_time = session.updated_at or start_time
        is_final_cost = True
    else:
        end_time = datetime.utcnow()
        is_final_cost = False
    
    duration = end_time - start_time
    duration_hours = duration.total_seconds() / 3600
    duration_minutes = duration.total_seconds() / 60
    
    # Рассчитываем стоимость в зависимости от типа тарифа
    if tariff.tariff_type == 'free':
        cost = 0
        calculation = {
            "tariff_type": "free",
            "tariff_name": tariff.name,
            "duration_hours": duration_hours,
            "total_cost": 0,
            "message": "Бесплатная парковка"
        }
    
    elif tariff.tariff_type == 'hourly':
        # Вычитаем бесплатные минуты
        free_minutes = tariff.free_minutes or 0
        billable_minutes = max(0, duration_minutes - free_minutes)
        billable_hours = billable_minutes / 60
        
        # Округляем вверх - любая часть часа = полный час
        billable_hours_rounded = max(1, math.ceil(billable_hours)) if billable_hours > 0 else 1
        
        cost = billable_hours_rounded * float(tariff.price_per_hour or 0)
        
        calculation = {
            "tariff_type": "hourly",
            "tariff_name": tariff.name,
            "duration_hours": duration_hours,
            "duration_minutes": duration_minutes,
            "free_minutes": free_minutes,
            "billable_minutes": billable_minutes,
            "billable_hours": billable_hours,
            "billable_hours_rounded": billable_hours_rounded,
            "price_per_hour": float(tariff.price_per_hour or 0),
            "total_cost": cost
        }
    
    elif tariff.tariff_type == 'daily':
        days = max(1, math.ceil(duration_hours / 24))
        cost = days * float(tariff.price_per_day or 0)
        
        calculation = {
            "tariff_type": "daily",
            "tariff_name": tariff.name,
            "duration_hours": duration_hours,
            "days": days,
            "price_per_day": float(tariff.price_per_day or 0),
            "total_cost": cost
        }
    
    else:  # vip или другие
        free_minutes = tariff.free_minutes or 0
        billable_minutes = max(0, duration_minutes - free_minutes)
        billable_hours = billable_minutes / 60
        billable_hours_rounded = max(1, math.ceil(billable_hours)) if billable_hours > 0 else 1
        
        cost = billable_hours_rounded * float(tariff.price_per_hour or 0)
        
        calculation = {
            "tariff_type": tariff.tariff_type,
            "tariff_name": tariff.name,
            "duration_hours": duration_hours,
            "duration_minutes": duration_minutes,
            "free_minutes": free_minutes,
            "billable_minutes": billable_minutes,
            "billable_hours": billable_hours,
            "billable_hours_rounded": billable_hours_rounded,
            "price_per_hour": float(tariff.price_per_hour or 0),
            "total_cost": cost
        }
    
    # Сохраняем рассчитанную стоимость в БД
    try:
        session.calculated_cost = Decimal(str(cost))
        session.cost_calculation_details = calculation
        session.cost_calculated_at = datetime.utcnow()
        session.is_cost_final = is_final_cost
        
        db.add(session)
        db.commit()
    except Exception as e:
        print(f"Ошибка сохранения стоимости: {e}")
    
    # Добавляем информацию о статусе расчета
    calculation["is_final"] = is_final_cost
    calculation["end_time"] = end_time.isoformat()
    calculation["status_message"] = "Финальная стоимость (сессия завершена)" if is_final_cost else "Текущая стоимость (время идет)"
    
    return {
        "cost": cost,
        "calculation": calculation,
        "calculated_at": datetime.utcnow().isoformat(),
        "is_final": is_final_cost
    }

@router.put("/{session_id}/tariff")
async def update_session_tariff(
    session_id: int,
    tariff_id: int = Query(..., description="ID нового тарифа"),
    db: Session = Depends(get_db)
):
    """Обновляет тариф сессии и пересчитывает стоимость"""
    session = valet_session.get(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Сессия не найдена")
    
    if session.is_cost_final:
        raise HTTPException(status_code=400, detail="Нельзя изменить тариф для завершенной сессии")
    
    # Проверяем, что тариф существует
    tariff = parking_tariff.get(db, tariff_id)
    if not tariff:
        raise HTTPException(status_code=404, detail="Тариф не найден")
    
    # Обновляем тариф и пересчитываем стоимость
    updated_session = valet_session.update_tariff(db, session_id=session_id, tariff_id=tariff_id)
    
    return {"message": "Тариф обновлен", "new_cost": float(updated_session.calculated_cost or 0)}

@router.post("/{session_id}/finalize-cost")
async def finalize_session_cost(
    session_id: int,
    db: Session = Depends(get_db)
):
    """Финализирует стоимость сессии (для завершенных сессий)"""
    session = valet_session.get(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Сессия не найдена")
    
    if session.status != 'completed':
        raise HTTPException(status_code=400, detail="Можно финализировать стоимость только для завершенных сессий")
    
    # Финализируем стоимость
    updated_session = valet_session.recalculate_cost(db, session_id=session_id, finalize=True)
    
    return {
        "message": "Стоимость финализирована",
        "final_cost": float(updated_session.calculated_cost or 0),
        "calculation": updated_session.cost_calculation_details
    }

@router.post("/{session_id}/payment", response_model=PaymentResponse)
async def process_payment(
    session_id: int,
    payment_request: PaymentRequest,
    db: Session = Depends(get_db)
):
    """
    Обработать оплату парковки
    """
    from datetime import datetime
    from decimal import Decimal
    
    session = valet_session.get(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Сессия не найдена")
    
    if not session.calculated_cost or session.calculated_cost <= 0:
        raise HTTPException(status_code=400, detail="Нет стоимости для оплаты")
    
    # Определяем сумму для оплаты
    amount_to_pay = payment_request.amount or session.calculated_cost
    current_paid = session.paid_amount or Decimal('0.00')
    remaining_amount = session.calculated_cost - current_paid
    
    if amount_to_pay > remaining_amount:
        raise HTTPException(
            status_code=400, 
            detail=f"Сумма превышает задолженность. К доплате: {remaining_amount}₽"
        )
    
    # Обновляем данные об оплате
    new_paid_total = current_paid + amount_to_pay
    session.paid_amount = new_paid_total
    session.payment_method = payment_request.payment_method
    session.payment_date = datetime.utcnow()
    session.payment_reference = payment_request.payment_reference
    
    # Определяем статус оплаты
    new_remaining = session.calculated_cost - new_paid_total
    if new_remaining <= 0:
        session.payment_status = "paid"
    elif new_paid_total > 0:
        session.payment_status = "partial"
    else:
        session.payment_status = "pending"
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Создаем запись в логе
    create_session_log(
        db=db,
        session_id=session.id,
        employee_id=session.employee_id,
        action='payment_received',
        description=f'Получена оплата {amount_to_pay}₽',
        details=f'Способ: {payment_request.payment_method}, Остаток: {new_remaining}₽'
    )
    
    return PaymentResponse(
        success=True,
        message=f"Оплата {amount_to_pay}₽ получена" + (
            ". Оплачено полностью!" if session.payment_status == "paid" 
            else f". Остаток к доплате: {new_remaining}₽"
        ),
        session_id=session.id,
        paid_amount=amount_to_pay,
        remaining_amount=new_remaining,
        payment_status=session.payment_status
    ) 