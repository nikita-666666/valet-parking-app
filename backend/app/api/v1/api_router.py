from fastapi import APIRouter
from app.api.v1.endpoints import (
    locations, 
    valet_sessions, 
    roles, 
    employees, 
    auth, 
    parkings, 
    subscription_templates, 
    subscriptions,
    client_requests,
    valet_auth,
    file_upload,
    setup,
    parking_tariffs,
    test_mobile
)

api_router = APIRouter()
api_router.include_router(valet_auth.router, prefix="/valet-auth", tags=["valet-auth"])
api_router.include_router(employees.router, prefix="/employees", tags=["employees"])
api_router.include_router(subscriptions.router, prefix="/subscriptions", tags=["subscriptions"])
api_router.include_router(subscription_templates.router, prefix="/subscription-templates", tags=["subscription-templates"])
api_router.include_router(locations.router, prefix="/locations", tags=["locations"])
api_router.include_router(valet_sessions.router, prefix="/valet-sessions", tags=["valet-sessions"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(parkings.router, prefix="/parkings", tags=["parkings"])
api_router.include_router(client_requests.router, prefix="/client-requests", tags=["client-requests"])
api_router.include_router(file_upload.router, prefix="/files", tags=["files"])
api_router.include_router(parking_tariffs.router, prefix="/parking-tariffs", tags=["parking-tariffs"])
api_router.include_router(test_mobile.router, prefix="/test", tags=["test"])

# Добавляем setup роутер
from app.api.v1.endpoints import setup
api_router.include_router(setup.router, prefix="/setup", tags=["setup"])

@api_router.get("/test")
async def test():
    return {"message": "API router is working"}

# Добавляем setup роутер
from app.api.v1.endpoints import setup
api_router.include_router(setup.router, prefix="/setup", tags=["setup"]) 