from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
import os
import uuid
from pathlib import Path
import shutil
from typing import List
import mimetypes

router = APIRouter()

# Директория для хранения фотографий валет-сессий
UPLOAD_DIR = Path("uploads/valet_photos")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Разрешенные типы файлов
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def is_valid_image(filename: str) -> bool:
    """Проверка является ли файл изображением"""
    ext = Path(filename).suffix.lower()
    return ext in ALLOWED_EXTENSIONS

@router.post("/upload-photo")
async def upload_photo(file: UploadFile = File(...)):
    """
    Загрузка фотографии для валет-сессии.
    Возвращает URL для доступа к файлу.
    """
    # Проверка типа файла
    if not is_valid_image(file.filename):
        raise HTTPException(
            status_code=400, 
            detail=f"Недопустимый тип файла. Разрешены: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Проверка размера файла
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"Файл слишком большой. Максимальный размер: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Генерация уникального имени файла
    file_ext = Path(file.filename).suffix.lower()
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Сохранение файла
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка сохранения файла: {str(e)}")
    
    # Возвращаем URL для доступа к файлу
    file_url = f"/api/v1/files/valet_photos/{unique_filename}"
    
    return {
        "success": True,
        "file_url": file_url,
        "filename": unique_filename,
        "original_name": file.filename,
        "size": len(contents),
        "content_type": file.content_type
    }

@router.post("/upload-photos")
async def upload_multiple_photos(files: List[UploadFile] = File(...)):
    """
    Загрузка нескольких фотографий одновременно.
    """
    if len(files) > 20:  # Лимит на количество файлов
        raise HTTPException(status_code=400, detail="Слишком много файлов. Максимум 20 за раз.")
    
    results = []
    errors = []
    
    for file in files:
        try:
            # Проверка типа файла
            if not is_valid_image(file.filename):
                errors.append(f"{file.filename}: недопустимый тип файла")
                continue
            
            # Проверка размера файла
            contents = await file.read()
            if len(contents) > MAX_FILE_SIZE:
                errors.append(f"{file.filename}: файл слишком большой")
                continue
            
            # Генерация уникального имени файла
            file_ext = Path(file.filename).suffix.lower()
            unique_filename = f"{uuid.uuid4()}{file_ext}"
            file_path = UPLOAD_DIR / unique_filename
            
            # Сохранение файла
            with open(file_path, "wb") as buffer:
                buffer.write(contents)
            
            # Добавляем результат
            file_url = f"/api/v1/files/valet_photos/{unique_filename}"
            results.append({
                "file_url": file_url,
                "filename": unique_filename,
                "original_name": file.filename,
                "size": len(contents),
                "content_type": file.content_type
            })
            
        except Exception as e:
            errors.append(f"{file.filename}: {str(e)}")
    
    return {
        "success": len(results) > 0,
        "uploaded_files": results,
        "errors": errors,
        "total_uploaded": len(results),
        "total_errors": len(errors)
    }

@router.get("/valet_photos/{filename}")
async def get_photo(filename: str):
    """
    Получение фотографии по имени файла.
    """
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    # Определяем MIME-тип файла
    mime_type, _ = mimetypes.guess_type(str(file_path))
    if not mime_type:
        mime_type = "image/jpeg"
    
    return FileResponse(
        path=str(file_path),
        media_type=mime_type,
        filename=filename
    )

@router.delete("/valet_photos/{filename}")
async def delete_photo(filename: str):
    """
    Удаление фотографии.
    """
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    try:
        os.remove(file_path)
        return {"success": True, "message": f"Файл {filename} удален"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка удаления файла: {str(e)}") 