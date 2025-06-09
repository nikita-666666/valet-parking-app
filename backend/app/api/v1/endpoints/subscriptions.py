from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud.subscription import subscription
from app.models.subscription import Subscription as SubscriptionModel
from app.schemas.subscription import (
    Subscription as SubscriptionSchema,
    SubscriptionCreate,
    SubscriptionUpdate
)
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[SubscriptionSchema])
def get_subscriptions(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Получить список подписок.
    """
    try:
        results = subscription.get_multi(db, skip=skip, limit=limit)
        logger.info(f"Found {len(results)} subscriptions")
        
        # Проверим данные перед сериализацией
        for item in results:
            logger.info(f"Processing subscription: {item.__dict__}")
            
        return results
    except Exception as e:
        logger.error(f"Error in get_subscriptions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=SubscriptionSchema)
def create_subscription(
    *,
    db: Session = Depends(deps.get_db),
    subscription_in: SubscriptionCreate,
):
    """
    Создать новую подписку.
    """
    return subscription.create(db=db, obj_in=subscription_in)

@router.get("/{subscription_id}", response_model=SubscriptionSchema)
def read_subscription(
    subscription_id: int,
    db: Session = Depends(deps.get_db),
):
    """
    Получить информацию о конкретной подписке.
    """
    subscription_obj = subscription.get(db=db, subscription_id=subscription_id)
    if not subscription_obj:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return subscription_obj

@router.put("/{subscription_id}", response_model=SubscriptionSchema)
def update_subscription(
    *,
    db: Session = Depends(deps.get_db),
    subscription_id: int,
    subscription_in: SubscriptionUpdate,
):
    """
    Обновить подписку.
    """
    subscription_obj = subscription.get(db=db, subscription_id=subscription_id)
    if not subscription_obj:
        raise HTTPException(status_code=404, detail="Subscription not found")
    subscription_obj = subscription.update(
        db=db, 
        db_obj=subscription_obj, 
        obj_in=subscription_in
    )
    return subscription_obj

@router.delete("/{subscription_id}", response_model=SubscriptionSchema)
def delete_subscription(
    *,
    db: Session = Depends(deps.get_db),
    subscription_id: int,
):
    """
    Удалить подписку.
    """
    subscription_obj = subscription.get(db=db, subscription_id=subscription_id)
    if not subscription_obj:
        raise HTTPException(status_code=404, detail="Subscription not found")
    subscription_obj = subscription.delete(db=db, subscription_id=subscription_id)
    return subscription_obj

@router.get("/search/{car_number}")
def search_subscriptions_by_car_number(
    car_number: str,
    db: Session = Depends(deps.get_db)
):
    """
    Поиск абонементов по номеру автомобиля
    """
    subscriptions = db.query(SubscriptionModel).filter(
        SubscriptionModel.car_number.ilike(f"%{car_number}%"),
        SubscriptionModel.status == 'active'
    ).all()
    
    result = []
    for sub in subscriptions:
        # Получаем template отдельным запросом если нужно
        template_name = None
        if sub.template_id:
            from app.models.subscription_template import SubscriptionTemplate
            template = db.query(SubscriptionTemplate).filter(SubscriptionTemplate.id == sub.template_id).first()
            template_name = template.name if template else None
        
        result.append({
            "id": sub.id,
            "client_name": sub.client_name,
            "client_surname": sub.client_surname,
            "client_card_number": sub.client_card_number,
            "car_number": sub.car_number,
            "car_model": sub.car_model,
            "start_date": sub.start_date.strftime("%d.%m.%Y") if sub.start_date else None,
            "end_date": sub.end_date.strftime("%d.%m.%Y") if sub.end_date else None,
            "client_phone": sub.client_phone,
            "client_build": sub.client_build,
            "client_appartament": sub.client_appartament,
            "visits_used": sub.visits_used,
            "status": sub.status.value if hasattr(sub.status, 'value') else sub.status,
            "subscription_type": template_name
        })
    
    return result 