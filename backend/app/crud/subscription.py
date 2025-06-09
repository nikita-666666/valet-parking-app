from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.subscription import Subscription
from app.schemas.subscription import SubscriptionCreate, SubscriptionUpdate
from fastapi.encoders import jsonable_encoder
from app.crud.base import CRUDBase
from sqlalchemy import text
import logging

logger = logging.getLogger(__name__)

class CRUDSubscription(CRUDBase[Subscription, SubscriptionCreate, SubscriptionUpdate]):
    def get(self, db: Session, subscription_id: int) -> Optional[Subscription]:
        return db.query(Subscription).filter(Subscription.id == subscription_id).first()

    def get_multi(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100
    ) -> List[Subscription]:
        try:
            query = db.query(self.model)
            total = query.count()
            logger.info(f"Total subscriptions in database: {total}")
            
            results = query.offset(skip).limit(limit).all()
            logger.info(f"Retrieved {len(results)} subscriptions")
            
            if results:
                logger.info(f"First subscription data: {vars(results[0])}")
            
            return results
        except Exception as e:
            logger.error(f"Error in get_multi: {e}", exc_info=True)
            raise

    def create(self, db: Session, *, obj_in: SubscriptionCreate) -> Subscription:
        db_obj = Subscription(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, 
        db: Session, 
        *, 
        db_obj: Subscription, 
        obj_in: SubscriptionUpdate
    ) -> Subscription:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, *, subscription_id: int) -> Subscription:
        obj = db.query(Subscription).get(subscription_id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj

subscription = CRUDSubscription(Subscription) 