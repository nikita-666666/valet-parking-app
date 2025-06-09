from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.employee import Employee, EmployeeCreate, EmployeeUpdate, EmployeeList
from app.crud.employee import employee

router = APIRouter()

@router.get("/", response_model=List[EmployeeList])
def get_employees(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Получить список сотрудников.
    """
    return employee.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=Employee)
def create_employee(
    *,
    db: Session = Depends(deps.get_db),
    employee_in: EmployeeCreate,
):
    """
    Создать нового сотрудника.
    """
    db_employee = employee.get_by_email(db, email=employee_in.email)
    if db_employee:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    return employee.create(db=db, obj_in=employee_in)

@router.get("/{employee_id}", response_model=Employee)
def get_employee(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: int,
):
    """
    Получить сотрудника по ID.
    """
    db_employee = employee.get(db=db, id=employee_id)
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return db_employee

@router.put("/{employee_id}", response_model=Employee)
def update_employee(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: int,
    employee_in: EmployeeUpdate,
):
    """
    Обновить данные сотрудника.
    """
    db_employee = employee.get(db=db, id=employee_id)
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee.update(db=db, db_obj=db_employee, obj_in=employee_in)

@router.delete("/{employee_id}", response_model=Employee)
def delete_employee(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: int,
):
    """
    Деактивировать сотрудника (мягкое удаление).
    """
    db_employee = employee.get(db=db, id=employee_id)
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee.remove(db=db, id=employee_id)

@router.delete("/{employee_id}/hard", response_model=Employee)
def hard_delete_employee(
    *,
    db: Session = Depends(deps.get_db),
    employee_id: int,
):
    """
    Полностью удалить сотрудника (только если нет связанных данных).
    """
    db_employee = employee.get(db=db, id=employee_id)
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee.hard_delete(db=db, id=employee_id) 