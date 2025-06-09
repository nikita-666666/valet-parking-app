import logging
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("request_logger")

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Логируем входящий запрос
        logger.info(f"🔵 INCOMING: {request.method} {request.url}")
        logger.info(f"📱 Client IP: {request.client.host}")
        logger.info(f"🌐 User-Agent: {request.headers.get('user-agent', 'Unknown')}")
        logger.info(f"🔗 Origin: {request.headers.get('origin', 'No Origin')}")
        logger.info(f"📋 Headers: {dict(request.headers)}")
        
        # Обрабатываем запрос
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # Логируем ответ
            logger.info(f"✅ RESPONSE: {response.status_code} in {process_time:.3f}s")
            logger.info(f"📤 Response Headers: {dict(response.headers)}")
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(f"❌ ERROR after {process_time:.3f}s: {str(e)}")
            raise 