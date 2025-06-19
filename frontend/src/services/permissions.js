import api from './api';
import { API_CONFIG } from '../config/api';

// Кеш разрешений пользователя
let userPermissions = null;
let permissionsError = null;
let permissionsRetryCount = 0;
let permissionsPromise = null;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 секунда

// Получить разрешения текущего пользователя
export const getUserPermissions = async () => {
    // Если уже есть кешированные разрешения, возвращаем их
    if (userPermissions) {
        console.log('Permissions: Using cached permissions');
        return userPermissions;
    }
    
    // Если уже есть активный запрос, возвращаем его промис
    if (permissionsPromise) {
        console.log('Permissions: Using existing promise');
        return permissionsPromise;
    }
    
    if (permissionsError && permissionsRetryCount >= MAX_RETRY_ATTEMPTS) {
        console.error('Permissions: Max retry attempts reached');
        return [];
    }
    
    // Создаем новый промис для запроса разрешений
    permissionsPromise = (async () => {
        try {
            permissionsRetryCount++;
            console.log(`Permissions: Attempt #${permissionsRetryCount} to fetch permissions`);
            
            const response = await api.get(API_CONFIG.endpoints.auth.permissions);
            userPermissions = response.data || [];
            console.log('Permissions: Successfully fetched permissions:', userPermissions);
            permissionsError = null;
            permissionsRetryCount = 0;
            return userPermissions;
        } catch (error) {
            console.error('Permissions: Error fetching permissions:', error);
            permissionsError = error;
            
            // Если ошибка 401 или 403, значит проблема с авторизацией
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                console.log('Permissions: Authorization error');
                return [];
            }
            
            // Для других ошибок пробуем повторить запрос
            if (permissionsRetryCount < MAX_RETRY_ATTEMPTS) {
                console.log(`Permissions: Retrying in ${RETRY_DELAY}ms...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                // Сбрасываем промис перед повторной попыткой
                permissionsPromise = null;
                return getUserPermissions();
            }
            
            return [];
        } finally {
            // Сбрасываем промис после завершения запроса
            permissionsPromise = null;
        }
    })();
    
    return permissionsPromise;
};

// Проверить, есть ли у пользователя разрешение
export const hasPermission = async (permissionCode) => {
    console.log('Permissions: Checking permission:', permissionCode);
    const permissions = await getUserPermissions();
    const hasAccess = permissions.includes(permissionCode);
    console.log('Permissions: Access result for', permissionCode, ':', hasAccess);
    return hasAccess;
};

// Проверить, есть ли у пользователя хотя бы одно из разрешений
export const hasAnyPermission = async (permissionCodes) => {
    console.log('Permissions: Checking any of permissions:', permissionCodes);
    const permissions = await getUserPermissions();
    const hasAccess = permissionCodes.some(code => permissions.includes(code));
    console.log('Permissions: Access result for any of', permissionCodes, ':', hasAccess);
    return hasAccess;
};

// Проверить, есть ли у пользователя все разрешения
export const hasAllPermissions = async (permissionCodes) => {
    console.log('Permissions: Checking all permissions:', permissionCodes);
    const permissions = await getUserPermissions();
    const hasAccess = permissionCodes.every(code => permissions.includes(code));
    console.log('Permissions: Access result for all of', permissionCodes, ':', hasAccess);
    return hasAccess;
};

// Очистить кеш разрешений (при logout)
export const clearPermissionsCache = () => {
    console.log('Permissions: Clearing permissions cache');
    userPermissions = null;
    permissionsError = null;
    permissionsRetryCount = 0;
    permissionsPromise = null;
};

// Принудительно обновить разрешения (для отладки)
export const refreshPermissions = async () => {
    console.log('Permissions: Forcing permissions refresh');
    userPermissions = null;
    permissionsPromise = null;
    return await getUserPermissions();
};

// Константы разрешений
export const PERMISSIONS = {
    // Админ панель
    ADMIN_DASHBOARD_VIEW: 'admin.dashboard.view',
    ADMIN_USERS_MANAGE: 'admin.users.manage',
    ADMIN_ROLES_MANAGE: 'admin.roles.manage',
    ADMIN_SYSTEM_SETTINGS: 'admin.system.settings',
    ADMIN_SETTINGS_MANAGE: 'admin.settings.manage',
    
    // Валет
    VALET_SESSIONS_VIEW: 'valet.sessions.view',
    VALET_SESSIONS_MANAGE: 'valet.sessions.manage',
    VALET_CAR_ACCEPT: 'valet.car.accept',
    VALET_CAR_PARK: 'valet.car.park',
    VALET_CAR_RETURN: 'valet.car.return',
    VALET_PHOTOS_UPLOAD: 'valet.photos.upload',
    
    // Клиенты
    CLIENT_VIEW: 'client.view',
    CLIENT_MANAGE: 'client.manage',
    CLIENT_SUBSCRIPTIONS_VIEW: 'client.subscriptions.view',
    CLIENT_SUBSCRIPTIONS_MANAGE: 'client.subscriptions.manage',
    
    // Парковка
    PARKING_SPOTS_VIEW: 'parking.spots.view',
    PARKING_SPOTS_MANAGE: 'parking.spots.manage',
    
    // Отчеты
    REPORTS_VIEW: 'reports.view',
    REPORTS_EXPORT: 'reports.export'
}; 