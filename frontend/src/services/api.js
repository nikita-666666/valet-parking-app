import axios from 'axios';
import { API_CONFIG } from '../config/api';

const VALET_TOKEN_KEY = 'valet_token';
const AUTH_TOKEN_KEY = 'token';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Добавляем перехватчик для установки токена авторизации и обработки FormData
api.interceptors.request.use(
    (config) => {
        // Проверяем, является ли запрос для валет-авторизации
        const isValetAuth = config.url.includes('/valet-auth/');
        
        // Получаем соответствующий токен
        const token = isValetAuth ? 
            localStorage.getItem(VALET_TOKEN_KEY) : 
            localStorage.getItem(AUTH_TOKEN_KEY);

        console.log('API Request:', {
            url: config.url,
            method: config.method,
            isValetAuth,
            hasToken: !!token,
            contentType: config.headers['Content-Type']
        });

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Если данные являются FormData, преобразуем их в URLSearchParams
        if (config.data instanceof FormData) {
            const searchParams = new URLSearchParams();
            for (const [key, value] of config.data) {
                searchParams.append(key, value);
            }
            config.data = searchParams;
            config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            console.log('API Request: Converted FormData to URLSearchParams');
        }

        return config;
    },
    (error) => {
        console.error('API Request Error:', {
            message: error.message,
            stack: error.stack
        });
        return Promise.reject(error);
    }
);

// Добавляем перехватчик для обработки ошибок
api.interceptors.response.use(
    (response) => {
        console.log('API Response:', {
            url: response.config.url,
            status: response.status,
            statusText: response.statusText,
            hasData: !!response.data
        });
        return response;
    },
    (error) => {
        console.error('API Response Error:', {
            url: error.config?.url,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });

        // Если ошибка 401 (Unauthorized)
        if (error.response?.status === 401) {
            // Определяем, какой токен нужно удалить
            const isValetAuth = error.config.url.includes('/valet-auth/');
            if (isValetAuth) {
                localStorage.removeItem(VALET_TOKEN_KEY);
                console.log('API: Removed valet token due to 401');
            } else {
                localStorage.removeItem(AUTH_TOKEN_KEY);
                console.log('API: Removed auth token due to 401');
            }
        }
        
        return Promise.reject(error);
    }
);

export default api; 