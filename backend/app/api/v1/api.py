from fastapi import APIRouter

from app.api.v1.endpoints import employees, auth, subscriptions, valet_sessions, init_data, roles, file_upload

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(employees.router, prefix="/employees", tags=["employees"])
api_router.include_router(subscriptions.router, prefix="/subscriptions", tags=["subscriptions"])
api_router.include_router(valet_sessions.router, prefix="/valet-sessions", tags=["valet-sessions"])
api_router.include_router(init_data.router, prefix="/init", tags=["init"])
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])
api_router.include_router(file_upload.router, prefix="/files", tags=["files"]) 