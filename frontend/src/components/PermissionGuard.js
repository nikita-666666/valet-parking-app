import React, { useEffect, useState, useCallback } from 'react';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../services/permissions';
import { Spinner, Alert } from 'react-bootstrap';

const PermissionGuard = ({ 
    permission, 
    permissions, 
    requireAll = false, 
    children, 
    fallback = null,
    showLoading = true
}) => {
    const [hasAccess, setHasAccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const checkPermissions = useCallback(async () => {
        try {
            console.log('PermissionGuard: Starting permission check', {
                permission,
                permissions,
                requireAll
            });
            
            setLoading(true);
            setError(null);
            let access = false;
            
            if (permission) {
                // Проверка одного разрешения
                console.log('PermissionGuard: Checking single permission:', permission);
                access = await hasPermission(permission);
                console.log('PermissionGuard: Single permission check result:', access);
            } else if (permissions && permissions.length > 0) {
                // Проверка множественных разрешений
                console.log('PermissionGuard: Checking multiple permissions:', {
                    permissions,
                    requireAll
                });
                
                if (requireAll) {
                    // Требуются ВСЕ разрешения
                    access = await hasAllPermissions(permissions);
                    console.log('PermissionGuard: All permissions check result:', access);
                } else {
                    // Требуется ЛЮБОЕ из разрешений
                    access = await hasAnyPermission(permissions);
                    console.log('PermissionGuard: Any permission check result:', access);
                }
            } else {
                // Если разрешения не указаны, разрешаем доступ
                console.log('PermissionGuard: No permissions specified, granting access');
                access = true;
            }
            
            console.log('PermissionGuard: Setting access result:', access);
            setHasAccess(access);
        } catch (error) {
            console.error('PermissionGuard: Error checking permissions:', {
                message: error.message,
                stack: error.stack,
                permission,
                permissions
            });
            setError(error);
            setHasAccess(false);
        } finally {
            setLoading(false);
        }
    }, [permission, permissions, requireAll]);

    useEffect(() => {
        console.log('PermissionGuard: Effect triggered, checking permissions');
        checkPermissions();
    }, [checkPermissions]);

    if (loading) {
        return showLoading ? (
            <div className="d-flex justify-content-center align-items-center p-3">
                <Spinner animation="border" variant="primary" size="sm" />
                <span className="ms-2">Проверка доступа...</span>
            </div>
        ) : null;
    }

    if (error) {
        console.log('PermissionGuard: Showing error message:', error.message);
        return (
            <Alert variant="danger" className="m-3">
                Ошибка при проверке разрешений: {error.message || 'Неизвестная ошибка'}
            </Alert>
        );
    }

    console.log('PermissionGuard: Rendering final result', {
        hasAccess,
        showingFallback: !hasAccess
    });

    return hasAccess ? children : fallback;
};

export default PermissionGuard; 