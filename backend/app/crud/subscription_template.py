from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.subscription_template import SubscriptionTemplate
from app.schemas.subscription_template import SubscriptionTemplateCreate, SubscriptionTemplateUpdate

class CRUDSubscriptionTemplate:
    def get(self, db: Session, template_id: int) -> Optional[SubscriptionTemplate]:
        return db.query(SubscriptionTemplate).filter(SubscriptionTemplate.id == template_id).first()

    def get_multi(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100,
        location_id: Optional[int] = None
    ) -> List[SubscriptionTemplate]:
        query = db.query(SubscriptionTemplate)
        if location_id:
            query = query.filter(SubscriptionTemplate.location_id == location_id)
        return query.offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: SubscriptionTemplateCreate) -> SubscriptionTemplate:
        db_obj = SubscriptionTemplate(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, 
        db: Session, 
        *, 
        db_obj: SubscriptionTemplate, 
        obj_in: SubscriptionTemplateUpdate
    ) -> SubscriptionTemplate:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

subscription_template = CRUDSubscriptionTemplate() 