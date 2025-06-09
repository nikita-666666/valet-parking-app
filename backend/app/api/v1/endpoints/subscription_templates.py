from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.crud.subscription_template import subscription_template
from app.schemas.subscription_template import (
    SubscriptionTemplate,
    SubscriptionTemplateCreate,
    SubscriptionTemplateUpdate
)

router = APIRouter()

@router.get("/", response_model=List[SubscriptionTemplate])
def read_subscription_templates(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    location_id: Optional[int] = None,
):
    """
    Получить список шаблонов подписок.
    """
    templates = subscription_template.get_multi(
        db, 
        skip=skip, 
        limit=limit,
        location_id=location_id
    )
    return templates

@router.post("/", response_model=SubscriptionTemplate)
def create_subscription_template(
    *,
    db: Session = Depends(get_db),
    template_in: SubscriptionTemplateCreate,
):
    """
    Создать новый шаблон подписки.
    """
    template = subscription_template.create(db=db, obj_in=template_in)
    return template

@router.get("/{template_id}", response_model=SubscriptionTemplate)
def read_subscription_template(
    template_id: int,
    db: Session = Depends(get_db),
):
    """
    Получить информацию о конкретном шаблоне подписки.
    """
    template = subscription_template.get(db=db, template_id=template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Subscription template not found")
    return template

@router.put("/{template_id}", response_model=SubscriptionTemplate)
def update_subscription_template(
    *,
    db: Session = Depends(get_db),
    template_id: int,
    template_in: SubscriptionTemplateUpdate,
):
    """
    Обновить шаблон подписки.
    """
    template = subscription_template.get(db=db, template_id=template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Subscription template not found")
    template = subscription_template.update(
        db=db, 
        db_obj=template, 
        obj_in=template_in
    )
    return template 