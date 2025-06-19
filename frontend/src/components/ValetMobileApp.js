import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Form, Alert, Modal, Badge, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCar, 
    faCamera, 
    faUser, 
    faBars, 
    faSignOutAlt,
    faHistory,
    faClipboardList,
    faBell,
    faToggleOn,
    faToggleOff,
    faCheck,
    faHome,
    faPlus,
    faCogs,
    faHandPaper,
    faExclamationTriangle,
    faClock,
    faParking,
    faMapMarkerAlt,
    faPalette,
    faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

// Утилиты для работы с фото
const capturePhoto = () => {
    return new Promise((resolve, reject) => {
        // Создаем input для выбора файла
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Использовать основную камеру
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) {
                reject(new Error('Файл не выбран'));
                return;
            }

            // Проверяем размер файла (не более 10MB)
            if (file.size > 10 * 1024 * 1024) {
                reject(new Error('Файл слишком большой (максимум 10MB)'));
                return;
            }

            // Проверяем тип файла
            if (!file.type.startsWith('image/')) {
                reject(new Error('Выбранный файл не является изображением'));
                return;
            }

            resolve({
                file,
                type: file.type,
                name: file.name
            });
        };

        // Симулируем клик для открытия диалога выбора файла
        input.click();
    });
};

// Конвертация base64 в Blob
const base64ToBlob = (base64Data, contentType = '') => {
    const byteCharacters = atob(base64Data.split(',')[1]);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
};

const ValetMobileApp = () => {
    const [currentView, setCurrentView] = useState('dashboard');
    const [employee, setEmployee] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [carForm, setCarForm] = useState({
        client_card_number: '',
        car_number: '',
        car_model: '',
        car_color: '#ffffff',
        client_name: '',
        client_phone: '',
        photos: [],
        notes: '',
        has_subscription: false
    });
    const [isOnShift, setIsOnShift] = useState(true);
    const [notifications, setNotifications] = useState(false);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
    const [foundSubscriptions, setFoundSubscriptions] = useState([]);
    const [showSubscriptionsModal, setShowSubscriptionsModal] = useState(false);
    const [searchingSubscriptions, setSearchingSubscriptions] = useState(false);
    const [activeSessions, setActiveSessions] = useState([]);
    const [currentSession, setCurrentSession] = useState(null);
    const [parkingPhotos, setParkingPhotos] = useState([]);
    const [showParkingModal, setShowParkingModal] = useState(false);
    const [parkingData, setParkingData] = useState({
        parking_spot: '',
        parking_card: '',
        photos: [],
        notes: ''
    });
    const [showReturnStartModal, setShowReturnStartModal] = useState(false);
    const [showReturnDeliveryModal, setShowReturnDeliveryModal] = useState(false);
    const [returnData, setReturnData] = useState({
        photos: [],
        notes: ''
    });
    const [showBrandsModal, setShowBrandsModal] = useState(false);
    const [showColorsModal, setShowColorsModal] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    // Палитра 10 самых популярных цветов автомобилей
    const carColors = [
        { name: 'Белый', value: '#FFFFFF' },
        { name: 'Черный', value: '#000000' },
        { name: 'Серый', value: '#808080' },
        { name: 'Серебристый', value: '#C0C0C0' },
        { name: 'Красный', value: '#DC143C' },
        { name: 'Синий', value: '#1E90FF' },
        { name: 'Зеленый', value: '#228B22' },
        { name: 'Бежевый', value: '#F5F5DC' },
        { name: 'Желтый', value: '#FFD700' },
        { name: 'Коричневый', value: '#8B4513' }
    ];

    // Популярные марки автомобилей с реальными логотипами
    const popularBrands = [
        { name: 'BMW', logo: 'https://logo.clearbit.com/bmw.com', fallback: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/bmw.svg', color: '#0066CC' },
        { name: 'Mercedes-Benz', logo: 'https://logo.clearbit.com/mercedes-benz.com', fallback: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/mercedes.svg', color: '#000000' },
        { name: 'Audi', logo: 'https://logo.clearbit.com/audi.com', fallback: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/audi.svg', color: '#BB0A30' },
        { name: 'Toyota', logo: 'https://logo.clearbit.com/toyota.com', fallback: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/toyota.svg', color: '#EB0A1E' },
        { name: 'Lexus', logo: 'https://logo.clearbit.com/lexus.com', fallback: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/lexus.svg', color: '#1C1C1C' },
        { name: 'Volkswagen', logo: 'https://logo.clearbit.com/vw.com', fallback: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/volkswagen.svg', color: '#003F7F' },
        { name: 'Skoda', logo: 'https://logo.clearbit.com/skoda-auto.com', fallback: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/skoda.svg', color: '#4BA82E' },
        { name: 'Hyundai', logo: 'https://logo.clearbit.com/hyundai.com', fallback: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/hyundai.svg', color: '#002C5F' },
        { name: 'Kia', logo: 'https://logo.clearbit.com/kia.com', fallback: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/kia.svg', color: '#05141F' },
        { name: 'Nissan', logo: 'https://logo.clearbit.com/nissan.com', fallback: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/nissan.svg', color: '#C3002F' },
        { name: 'Honda', logo: 'https://logo.clearbit.com/honda.com', fallback: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/honda.svg', color: '#E60012' },
        { name: 'Mazda', logo: 'https://logo.clearbit.com/mazda.com', fallback: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/mazda.svg', color: '#1B305C' },
        { name: 'Ford', logo: 'https://logo.clearbit.com/ford.com', fallback: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/ford.svg', color: '#003478' },
        { name: 'Chevrolet', logo: 'https://logo.clearbit.com/chevrolet.com', fallback: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/chevrolet.svg', color: '#FFC72C' },
        { name: 'Renault', logo: 'https://logo.clearbit.com/renault.com', fallback: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/renault.svg', color: '#FFCC00' },
        { name: 'Peugeot', logo: 'https://logo.clearbit.com/peugeot.com', fallback: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/peugeot.svg', color: '#1F2937' },
        { name: 'Citroen', logo: 'https://logo.clearbit.com/citroen.com', fallback: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/citroen.svg', color: '#7C2E3E' },
        { name: 'Volvo', logo: 'https://logo.clearbit.com/volvo.com', fallback: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/volvo.svg', color: '#003F7F' }
    ];

    // Мобильные стили
    const mobileStyles = {
        app: {
            minHeight: '100vh',
            backgroundColor: '#f8f9fa',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            position: 'relative',
            paddingBottom: '80px'
        },
        header: {
            backgroundColor: '#007bff',
            color: 'white',
            padding: '15px 20px',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        },
        content: {
            padding: '20px 15px',
            minHeight: 'calc(100vh - 140px)'
        },
        bottomNav: {
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'white',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '10px 0',
            zIndex: 1000,
            boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
        },
        navItem: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '8px 12px',
            color: '#6c757d',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'all 0.2s'
        },
        navItemActive: {
            color: '#007bff',
            backgroundColor: '#e3f2fd'
        },
        card: {
            border: 'none',
            borderRadius: '15px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            marginBottom: '20px'
        },
        actionCard: {
            border: 'none',
            borderRadius: '15px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            marginBottom: '15px',
            cursor: 'pointer',
            transition: 'all 0.3s'
        },
        button: {
            borderRadius: '25px',
            padding: '12px 30px',
            fontWeight: '600',
            textTransform: 'none',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        },
        formControl: {
            borderRadius: '10px',
            border: '2px solid #e0e0e0',
            padding: '12px 15px',
            fontSize: '16px'
        }
    };

    useEffect(() => {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        } else {
            const meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            document.head.appendChild(meta);
        }

        document.addEventListener('gesturestart', function (e) {
            e.preventDefault();
        });

        checkAuth();
    }, []);

    useEffect(() => {
        if (isAuthenticated && employee) {
            loadActiveSessions();
        }
    }, [isAuthenticated, employee]);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        
        try {
            if (!token) {
                setIsAuthenticated(false);
                setIsInitializing(false);
                return;
            }

            // Устанавливаем токен в axios по умолчанию
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Проверяем, не делали ли мы недавно проверку токена
            const lastCheck = localStorage.getItem('lastAuthCheck');
            const now = Date.now();
            if (lastCheck && (now - parseInt(lastCheck)) < 5 * 60 * 1000) { // 5 минут
                // Если проверка была недавно и у нас есть данные сотрудника - пропускаем проверку
                if (employee) {
                    setIsAuthenticated(true);
                    setIsInitializing(false);
                    return;
                }
            }

            const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // Сохраняем время последней успешной проверки
            localStorage.setItem('lastAuthCheck', now.toString());
            
            setEmployee(response.data);
            setIsAuthenticated(true);
            setIsInitializing(false);
        } catch (error) {
            console.error('Ошибка проверки авторизации:', error);
            
            // Только удаляем токен если это ошибка 401 (Unauthorized)
            if (error.response?.status === 401) {
                setIsAuthenticated(false);
                localStorage.removeItem('token');
                localStorage.removeItem('lastAuthCheck');
                delete axios.defaults.headers.common['Authorization'];
            } else {
                // При других ошибках (сеть, сервер) - не выходим из системы
                console.warn('Временная ошибка сети, токен сохранен');
                // Если токен есть, но сервер недоступен - считаем что авторизованы
                if (token) {
                    setIsAuthenticated(true);
                }
            }
            setIsInitializing(false);
        }
    };

    const loadActiveSessions = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-sessions/active`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setActiveSessions(response.data);
        } catch (error) {
            console.error('Ошибка загрузки активных сессий:', error);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-auth/login`, loginForm);
            
            if (response.data.access_token) {
                localStorage.setItem('token', response.data.access_token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
            }
            
            setEmployee(response.data.employee);
            setIsAuthenticated(true);
            showAlert('Добро пожаловать!', 'success');
        } catch (error) {
            showAlert(error.response?.data?.detail || 'Ошибка авторизации', 'danger');
        }
        
        setLoading(false);
    };

    const handleLogout = async () => {
        try {
            await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-auth/logout`);
            setIsAuthenticated(false);
            setEmployee(null);
            setCurrentView('dashboard');
            localStorage.removeItem('token');
        } catch (error) {
            console.error('Ошибка выхода:', error);
        }
    };

    const showAlert = (message, type) => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 5000);
    };


    // Функции для работы с фотографиями
    const handlePhotoCapture = async (photoType = 'car') => {
        try {
            setUploadingPhoto(true);
            
            // Создаем скрытый input для выбора фото
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.capture = 'environment'; // Задняя камера на мобильных
            
            return new Promise((resolve, reject) => {
                input.onchange = async (event) => {
                    const file = event.target.files[0];
                    if (!file) {
                        setUploadingPhoto(false);
                        resolve(null);
                        return;
                    }

                    try {
                        // Проверяем размер файла (максимум 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                            showAlert('Файл слишком большой. Максимальный размер: 5MB', 'warning');
                            setUploadingPhoto(false);
                            resolve(null);
                            return;
                        }

                        // Создаем FormData для загрузки на сервер
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('category', photoType);

                        // Загружаем файл на сервер
                        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/files/upload-photo`, {
                            method: 'POST',
                            body: formData,
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            }
                        });

                        if (!response.ok) {
                            throw new Error('Ошибка загрузки фото на сервер');
                        }

                        const result = await response.json();
                        
                        // Проверяем успешность загрузки
                        if (!result.success) {
                            throw new Error(result.detail || 'Ошибка загрузки фото');
                        }

                        const photoData = {
                            id: result.id || Date.now().toString(),
                            url: result.file_url,
                            filename: result.filename,
                            original_name: result.original_name,
                            size: result.size,
                            content_type: result.content_type,
                            timestamp: new Date().toISOString(),
                            category: photoType
                        };

                        setUploadingPhoto(false);
                        resolve(photoData);
                    } catch (error) {
                        console.error('Ошибка обработки фото:', error);
                        showAlert(error.message || 'Ошибка загрузки фото на сервер', 'danger');
                        setUploadingPhoto(false);
                        reject(error);
                    }
                };
                
                input.oncancel = () => {
                    setUploadingPhoto(false);
                    resolve(null);
                };
                
                input.click();
            });
        } catch (error) {
            console.error('Ошибка захвата фото:', error);
            showAlert('Ошибка захвата фото', 'danger');
            setUploadingPhoto(false);
            return null;
        }
    };

    // Добавление фото к автомобилю при приемке
    const addCarPhoto = async () => {
        const photo = await handlePhotoCapture('car');
        if (photo) {
            setCarForm({
                ...carForm,
                photos: [...carForm.photos, photo]
            });
        }
    };

    // Пересъемка фото автомобиля
    const retakeCarPhoto = async (index) => {
        const photo = await handlePhotoCapture('car');
        if (photo) {
            const newPhotos = [...carForm.photos];
            newPhotos[index] = photo;
            setCarForm({
                ...carForm,
                photos: newPhotos
            });
        }
    };

    // Удаление фото автомобиля
    const removeCarPhoto = (index) => {
                    if (carForm.photos.filter(p => p && p.url).length > 4) {
            const newPhotos = carForm.photos.filter((_, i) => i !== index);
            setCarForm({
                ...carForm,
                photos: newPhotos
            });
        }
    };

    // Добавление фото парковки
    const addParkingPhoto = async () => {
        const photo = await handlePhotoCapture('parking');
        if (photo) {
            setParkingData({
                ...parkingData,
                photos: [...parkingData.photos, photo]
            });
        }
    };

    // Добавление фото для подачи
    const addReturnPhoto = async () => {
        const photo = await handlePhotoCapture('return');
        if (photo) {
            setReturnData({
                ...returnData,
                photos: [...returnData.photos, photo]
            });
        }
    };

    // Функция поиска абонементов
    const searchSubscriptions = async (carNumber) => {
        if (carNumber.length < 3) {
            setFoundSubscriptions([]);
            setCarForm(prev => ({ ...prev, has_subscription: false }));
            return;
        }
        
        setSearchingSubscriptions(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/subscriptions/search/${carNumber}`);
            if (response.data && response.data.length > 0) {
                setFoundSubscriptions(response.data);
                // Автоматически помечаем как имеющий абонемент, если найдены активные абонементы
                setCarForm(prev => ({ ...prev, has_subscription: true }));
            } else {
                setFoundSubscriptions([]);
                setCarForm(prev => ({ ...prev, has_subscription: false }));
            }
        } catch (error) {
            console.error('Ошибка поиска абонементов:', error);
            setFoundSubscriptions([]);
            setCarForm(prev => ({ ...prev, has_subscription: false }));
        }
        setSearchingSubscriptions(false);
    };

    // Обработчик изменения номера автомобиля
    const handleCarNumberChange = (value) => {
        const formattedValue = value.toUpperCase();
        setCarForm({...carForm, car_number: formattedValue});
        
        if (formattedValue.length >= 3) {
            searchSubscriptions(formattedValue);
        } else {
            setFoundSubscriptions([]);
        }
    };

    // Выбор абонемента
    const selectSubscription = (subscription) => {
        setCarForm(prev => ({
            ...prev,
            car_number: subscription.car_number,
            car_model: subscription.car_model,
            car_color: subscription.car_color || '#FFFFFF',
            client_name: subscription.client_name,
            client_phone: subscription.client_phone,
            has_subscription: true // Добавляем это поле
        }));
        setFoundSubscriptions([]);
        setShowSubscriptionsModal(false);
    };

    // Генерация номера карты
    const generateCardNumber = () => {
        const cardNumber = Math.floor(10000000 + Math.random() * 90000000).toString();
        setCarForm({...carForm, client_card_number: cardNumber});
    };

    // Принятие автомобиля
    const handleAcceptCar = async (e) => {
        e.preventDefault();
        
        if (!carForm.client_card_number?.trim()) {
            showAlert('Укажите номер карты клиента!', 'warning');
            return;
        }
        
        if (!carForm.car_number?.trim()) {
            showAlert('Укажите номер автомобиля!', 'warning');
            return;
        }
        
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            // Подготавливаем данные для отправки
            const requestData = {
                client_card_number: carForm.client_card_number.trim(),
                car_number: carForm.car_number.trim(),
                car_model: carForm.car_model?.trim() || '',
                car_color: carForm.car_color || '#FFFFFF',
                client_name: carForm.client_name?.trim() || '',
                client_phone: carForm.client_phone?.trim() || '',
                notes: carForm.notes?.trim() || '',
                employee_id: employee?.id || 1,
                status: "en_route", // Сразу меняем статус на "в пути на парковку"
                has_subscription: carForm.has_subscription || false,
                photos: carForm.photos.map(photo => ({
                    id: photo.id,
                    url: photo.url,
                    filename: photo.filename || '',
                    original_name: photo.original_name || '',
                    size: photo.size || 0,
                    content_type: photo.content_type || 'image/jpeg',
                    category: 'car'
                }))
            };

            console.log('Отправляем данные:', requestData);

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-sessions/`, 
                requestData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            // Сохраняем созданную сессию и подготавливаем данные для парковки
            const createdSession = response.data;
            setCurrentSession(createdSession);
            setParkingData({
                parking_spot: '',
                parking_card: '',
                photos: [],
                notes: ''
            });

            showAlert('Автомобиль принят! Теперь укажите место парковки.', 'success');
            setCurrentView('dashboard');
            setCarForm({
                client_card_number: '',
                car_number: '',
                car_model: '',
                client_name: '',
                client_phone: '',
                car_color: '#ffffff',
                photos: [],
                notes: '',
                has_subscription: false
            });
            
            // Открываем модальное окно парковки
            setShowParkingModal(true);
            
            await loadActiveSessions();
        } catch (error) {
            console.error('Ошибка при приеме автомобиля:', error);
            showAlert(error.response?.data?.detail || 'Ошибка при приеме автомобиля', 'danger');
        } finally {
            setLoading(false);
        }
    };

    // Обновление статуса сессии
    const updateSessionStatus = async (sessionId, newStatus) => {
        try {
            // Если парковка - показываем модальное окно для ввода данных
            if (newStatus === 'parked') {
                const session = activeSessions.find(s => s.id === sessionId);
                if (!session) {
                    showAlert('Сессия не найдена', 'danger');
                    return;
                }
                setCurrentSession(session);
                setParkingData({
                    parking_spot: '',
                    photos: [],
                    notes: ''
                });
                setShowParkingModal(true);
                return;
            }
            
            // Если начало подачи - показываем модальное окно для фото с парковки
            if (newStatus === 'return_started') {
                const session = activeSessions.find(s => s.id === sessionId);
                setCurrentSession(session);
                setReturnData({
                    photos: [],
                    notes: ''
                });
                setShowReturnStartModal(true);
                return;
            }
            
            // Если подача к клиенту - показываем модальное окно для фото подачи
            if (newStatus === 'return_delivering') {
                const session = activeSessions.find(s => s.id === sessionId);
                setCurrentSession(session);
                setReturnData({
                    photos: [],
                    notes: ''
                });
                setShowReturnDeliveryModal(true);
                return;
            }
            
            const token = localStorage.getItem('token');
            await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-sessions/${sessionId}`, 
                { status: newStatus },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            loadActiveSessions();
            showAlert('Статус обновлен!', 'success');
        } catch (error) {
            console.error('Ошибка обновления статуса:', error);
            showAlert('Ошибка обновления статуса', 'danger');
        }
    };

    // Подтверждение парковки с данными
    const confirmParking = async () => {
        if (!currentSession) {
            showAlert('Сессия не найдена', 'danger');
            return;
        }

        if (!parkingData?.parking_spot?.trim()) {
            showAlert('Укажите место парковки!', 'warning');
            return;
        }
        
        if (!parkingData?.photos?.length || parkingData.photos.filter(p => p && p.url).length < 2) {
            showAlert('Добавьте минимум 2 фото с парковки!', 'warning');
            return;
        }
        
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            // Логируем исходные данные фотографий
            console.log('Исходные фото:', parkingData.photos);
            
            // Подготавливаем данные для отправки
            const parkingPhotos = parkingData.photos
                .filter(photo => photo && photo.url)
                .map(photo => {
                    // Логируем каждое фото перед преобразованием
                    console.log('Обрабатываем фото:', photo);
                    return {
                        id: photo.id || String(Date.now()),
                        url: photo.url.startsWith('/') ? photo.url : `/${photo.url}`, // Изменено с file_url на url
                        filename: photo.filename || '',
                        original_name: photo.original_name || '',
                        size: photo.size || 0,
                        content_type: photo.content_type || 'image/jpeg',
                        category: 'parking',
                        timestamp: photo.timestamp || new Date().toISOString()
                    };
                });

            const requestData = {
                status: 'parked',
                parking_spot: parkingData.parking_spot.trim(),
                notes: parkingData.notes?.trim() || '',
                photos: parkingPhotos
            };

            // Логируем финальные данные запроса
            console.log('Отправляем данные:', JSON.stringify(requestData, null, 2));
            
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-sessions/${currentSession.id}`, 
                requestData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data) {
                console.log('Ответ сервера:', response.data);
            }
            
            showAlert('Автомобиль успешно припаркован!', 'success');
            setShowParkingModal(false);
            setCurrentSession(null);
            setParkingData({
                parking_spot: '',
                photos: [],
                notes: ''
            });
            
            await loadActiveSessions();
        } catch (error) {
            console.error('Ошибка при парковке:', error);
            console.error('Детали ошибки:', error.response?.data);
            
            let errorMessage = 'Ошибка при парковке автомобиля';
            
            if (error.response?.data) {
                const errorData = error.response.data;
                console.log('Полные данные ошибки:', errorData);
                
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (errorData.detail) {
                    if (Array.isArray(errorData.detail)) {
                        // Логируем каждую ошибку в массиве
                        errorData.detail.forEach((err, index) => {
                            console.log(`Ошибка ${index + 1}:`, err);
                        });
                        errorMessage = errorData.detail.map(err => {
                            if (err.msg) {
                                return `${err.msg} (поле: ${err.loc ? err.loc.join('.') : 'неизвестно'})`;
                            }
                            return err;
                        }).join(', ');
                    } else if (typeof errorData.detail === 'string') {
                        errorMessage = errorData.detail;
                    } else if (typeof errorData.detail === 'object') {
                        errorMessage = Object.values(errorData.detail).flat().join(', ');
                    }
                }
            }
            
            showAlert(errorMessage, 'danger');
        } finally {
            setLoading(false);
        }
    };

    // Подтверждение начала подачи с фото с парковки
    const confirmReturnStart = async () => {
        if (returnData.photos.length < 2) {
            showAlert('Добавьте минимум 2 фото автомобиля на парковке перед подачей!', 'warning');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-sessions/${currentSession.id}`, 
                { 
                    status: 'return_started',
                    notes: returnData.notes
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            setShowReturnStartModal(false);
            setCurrentSession(null);
            setReturnData({ photos: [], notes: '' });
            
            loadActiveSessions();
            showAlert('Начата подача автомобиля!', 'success');
        } catch (error) {
            console.error('Ошибка начала подачи:', error);
            showAlert('Ошибка подтверждения начала подачи', 'danger');
        }
    };

    // Подтверждение подачи к клиенту с фото
    const confirmReturnDelivery = async () => {
        if (returnData.photos.length < 1) {
            showAlert('Добавьте фото подачи автомобиля клиенту!', 'warning');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-sessions/${currentSession.id}`, 
                { 
                    status: 'return_delivering',
                    notes: returnData.notes
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            setShowReturnDeliveryModal(false);
            setCurrentSession(null);
            setReturnData({ photos: [], notes: '' });
            
            loadActiveSessions();
            showAlert('Автомобиль подается клиенту!', 'success');
        } catch (error) {
            console.error('Ошибка подачи:', error);
            showAlert('Ошибка подтверждения подачи', 'danger');
        }
    };

    // Мобильная нижняя навигация
    const MobileBottomNav = () => (
        <div style={mobileStyles.bottomNav}>
            <div 
                style={{
                    ...mobileStyles.navItem,
                    ...(currentView === 'dashboard' ? mobileStyles.navItemActive : {})
                }}
                onClick={() => setCurrentView('dashboard')}
            >
                <FontAwesomeIcon icon={faHome} size="lg" />
                <small style={{ marginTop: '4px' }}>Главная</small>
            </div>
            <div 
                style={{
                    ...mobileStyles.navItem,
                    ...(currentView === 'acceptCar' ? mobileStyles.navItemActive : {})
                }}
                onClick={() => setCurrentView('acceptCar')}
            >
                <FontAwesomeIcon icon={faPlus} size="lg" />
                <small style={{ marginTop: '4px' }}>Принять</small>
            </div>
            <div 
                style={{
                    ...mobileStyles.navItem,
                    ...(currentView === 'menu' ? mobileStyles.navItemActive : {})
                }}
                onClick={() => setCurrentView('menu')}
            >
                <FontAwesomeIcon icon={faCogs} size="lg" />
                <small style={{ marginTop: '4px' }}>Меню</small>
            </div>
        </div>
    );

    // Экран загрузки при инициализации
    if (isInitializing) {
        return (
            <div style={mobileStyles.app}>
                <div style={mobileStyles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FontAwesomeIcon icon={faCar} className="me-2" />
                        <h4 style={{ margin: 0 }}>Валет</h4>
                    </div>
                </div>
                
                <div style={{...mobileStyles.content, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <Card style={mobileStyles.card}>
                        <Card.Body style={{ padding: '50px 20px', textAlign: 'center' }}>
                            <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                                <span className="visually-hidden">Загрузка...</span>
                            </div>
                            <h5>Загрузка...</h5>
                            <p className="text-muted">Проверяем авторизацию</p>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        );
    }

    // Экран логина
    if (!isAuthenticated) {
        return (
            <div style={mobileStyles.app}>
                <div style={mobileStyles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FontAwesomeIcon icon={faCar} className="me-2" />
                        <h4 style={{ margin: 0 }}>Валет</h4>
                    </div>
                </div>
                
                <div style={mobileStyles.content}>
                    {alert.show && (
                        <Alert variant={alert.type} style={{ borderRadius: '10px', marginBottom: '20px' }}>
                            {alert.message}
                        </Alert>
                    )}
                    
                    <Card style={mobileStyles.card}>
                        <Card.Body style={{ padding: '30px 20px' }}>
                            <div className="text-center mb-4">
                                <FontAwesomeIcon icon={faUser} size="3x" className="text-primary mb-3" />
                                <h3>Вход в систему</h3>
                                <p className="text-muted">Введите ваши данные для доступа</p>
                            </div>
                            
                            <Form onSubmit={handleLogin}>
                                <Form.Group className="mb-3">
                                    <Form.Control
                                        type="email"
                                        placeholder="Email"
                                        value={loginForm.email}
                                        onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                                        required
                                        style={mobileStyles.formControl}
                                    />
                                </Form.Group>
                                
                                <Form.Group className="mb-4">
                                    <Form.Control
                                        type="password"
                                        placeholder="Пароль"
                                        value={loginForm.password}
                                        onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                                        required
                                        style={mobileStyles.formControl}
                                    />
                                </Form.Group>
                                
                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    size="lg" 
                                    disabled={loading}
                                    style={{
                                        ...mobileStyles.button,
                                        width: '100%'
                                    }}
                                >
                                    {loading ? 'Вход...' : 'Войти'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div style={mobileStyles.app} className="mobile-app">
            {/* Мобильный хедер */}
            <div style={mobileStyles.header} className="mobile-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div className="bg-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                             style={{width: '40px', height: '40px', color: '#007bff', fontSize: '1.2rem', fontWeight: 'bold'}}>
                            {employee?.full_name?.charAt(0) || employee?.name?.charAt(0) || 'V'}
                        </div>
                        <div>
                            <h6 style={{ margin: 0, color: 'white' }}>{employee?.full_name || employee?.name}</h6>
                            <small style={{ opacity: 0.8, color: 'white' }}>Жилой Квартал Prime Park</small>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FontAwesomeIcon 
                            icon={isOnShift ? faToggleOn : faToggleOff} 
                            size="lg"
                            style={{ 
                                color: isOnShift ? '#28a745' : '#6c757d',
                                cursor: 'pointer'
                            }}
                            onClick={() => setIsOnShift(!isOnShift)}
                        />
                        <FontAwesomeIcon 
                            icon={faBars} 
                            style={{ cursor: 'pointer', color: 'white' }}
                            onClick={() => setCurrentView('menu')}
                        />
                    </div>
                </div>
            </div>

            {/* Контент */}
            <div style={mobileStyles.content} className="mobile-content mobile-fade-in">
                {alert.show && (
                    <Alert variant={alert.type} style={{ borderRadius: '10px', marginBottom: '20px' }} className="mobile-alert">
                        {alert.message}
                    </Alert>
                )}

                {/* Главная страница */}
                {currentView === 'dashboard' && (
                    <div>
                        {/* Принять автомобиль - главная кнопка */}
                        <Card style={mobileStyles.actionCard} className="mobile-card mobile-elevated" onClick={() => setCurrentView('acceptCar')}>
                            <Card.Body className="text-center py-4">
                                <FontAwesomeIcon icon={faCar} size="2x" className="text-primary mb-2" />
                                <h5 className="mb-0">Принять автомобиль</h5>
                                <small className="text-muted">Передайте клиенту карту и заполните все данные</small>
                            </Card.Body>
                        </Card>

                        {/* Активные сессии - только автомобили в пути на парковку */}
                        {activeSessions.filter(s => s.status === 'en_route').length > 0 && (
                            <>
                                <h6 className="text-muted mb-3">Автомобили в пути на парковку:</h6>
                                {activeSessions.filter(s => s.status === 'en_route').map((session) => (
                                    <Card key={session.id} style={mobileStyles.card} className="mobile-card mobile-elevated">
                                        <Card.Body>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <div className="fw-bold">
                                                        {session.car_number}
                                                        {session.has_subscription && (
                                                            <Badge bg="success" className="ms-2" style={{fontSize: '10px'}}>
                                                                Резидент
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <small className="text-muted">{session.car_model}</small>
                                                    {session.has_subscription && (
                                                        <div className="small text-success">Бесплатная парковка</div>
                                                    )}
                                                </div>
                                                <div className="text-end">
                                                    {session.status === 'en_route' && (
                                                        <Button 
                                                            variant="success" 
                                                            size="sm"
                                                            onClick={() => updateSessionStatus(session.id, 'parked')}
                                                            style={{fontSize: '12px', padding: '8px 15px'}}
                                                        >
                                                            <FontAwesomeIcon icon={faParking} className="me-2" />
                                                            Припарковать
                                                        </Button>
                                                    )}
                                                </div>
                                                                                                                                        <div className="text-end">
                                        {session.status === 'requested' && (
                                            <Button 
                                                variant="warning" 
                                                size="sm"
                                                onClick={() => updateSessionStatus(session.id, 'return_requested')}
                                                style={{fontSize: '12px', padding: '8px 15px'}}
                                            >
                                                <FontAwesomeIcon icon={faCheck} className="me-2" />
                                                Принять запрос
                                            </Button>
                                        )}
                                        {session.status === 'return_requested' && (
                                            <Button 
                                                variant="info" 
                                                size="sm"
                                                onClick={() => updateSessionStatus(session.id, 'return_accepted')}
                                                style={{fontSize: '12px', padding: '8px 15px'}}
                                            >
                                                <FontAwesomeIcon icon={faCheck} className="me-2" />
                                                Подтвердить принятие
                                            </Button>
                                        )}
                                        {session.status === 'return_accepted' && (
                                            <Button 
                                                variant="info" 
                                                size="sm"
                                                onClick={() => updateSessionStatus(session.id, 'return_started')}
                                                style={{fontSize: '12px', padding: '8px 15px'}}
                                            >
                                                <FontAwesomeIcon icon={faCar} className="me-2" />
                                                Начать подачу
                                            </Button>
                                        )}
                                        {session.status === 'return_started' && (
                                            <Button 
                                                variant="primary" 
                                                size="sm"
                                                onClick={() => updateSessionStatus(session.id, 'return_delivering')}
                                                style={{fontSize: '12px', padding: '8px 15px'}}
                                            >
                                                <FontAwesomeIcon icon={faHandPaper} className="me-2" />
                                                Подать к клиенту
                                            </Button>
                                        )}
                                        {session.status === 'return_delivering' && (
                                            <Button 
                                                variant="success" 
                                                size="sm"
                                                onClick={() => updateSessionStatus(session.id, 'completed')}
                                                style={{fontSize: '12px', padding: '8px 15px'}}
                                            >
                                                <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                                                Подтвердить выдачу
                                            </Button>
                                        )}

                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </>
                        )}

                        {/* Запросы на подачу */}
                        {/* Запросы на подачу - только счетчик, клик открывает отдельный экран */}
                        <Card 
                            style={mobileStyles.actionCard} 
                            className="mobile-card mobile-elevated" 
                            onClick={() => setCurrentView('returnRequests')}
                        >
                            <Card.Body className="text-center py-4">
                                <FontAwesomeIcon icon={faHandPaper} size="2x" className="text-warning mb-2" />
                                <h5 className="mb-0">Запросы на подачу: 
                                    <Badge bg={activeSessions.filter(s => ['requested', 'return_requested', 'return_accepted', 'return_started', 'return_delivering'].includes(s.status)).length > 0 ? 'warning' : 'secondary'} className="ms-2">
                                        {activeSessions.filter(s => ['requested', 'return_requested', 'return_accepted', 'return_started', 'return_delivering'].includes(s.status)).length}
                                    </Badge>
                                </h5>
                                <small className="text-muted">Нажмите для просмотра запросов</small>
                            </Card.Body>
                        </Card>

                        {/* Запросы на услуги */}
                        <Card style={mobileStyles.card} className="mobile-card mobile-elevated">
                            <Card.Body className="text-center py-4">
                                <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="text-info mb-2" />
                                <h5 className="mb-0">Запросы на услуги: <Badge bg="primary">0</Badge></h5>
                            </Card.Body>
                        </Card>

                        {/* История смен */}
                        <Card style={mobileStyles.actionCard} className="mobile-card mobile-elevated" onClick={() => setCurrentView('history')}>
                            <Card.Body className="text-center py-4">
                                <FontAwesomeIcon icon={faHistory} size="2x" className="text-secondary mb-2" />
                                <h5 className="mb-0">История ваших смен</h5>
                            </Card.Body>
                        </Card>
                    </div>
                )}
                    {currentView === 'returnRequests' && (
                    <div>
                        <Card style={mobileStyles.card} className="mobile-card mobile-elevated">
                            <Card.Header style={{ backgroundColor: '#ffc107', color: 'white', borderRadius: '15px 15px 0 0' }}>
                                <h5 className="mb-0 text-center">Запросы на подачу автомобилей</h5>
                                <small className="d-block text-center mt-1" style={{opacity: 0.9}}>
                                    Клиенты запросили подачу {activeSessions.filter(s => ['requested', 'return_requested'].includes(s.status)).length} автомобиля(ей)
                                </small>
                            </Card.Header>
                            <Card.Body style={{ padding: '20px' }}>
                                {activeSessions.filter(s => ['requested', 'return_requested', 'return_accepted', 'return_started', 'return_delivering'].includes(s.status)).length > 0 ? (
                                    activeSessions.filter(s => ['requested', 'return_requested', 'return_accepted', 'return_started', 'return_delivering'].includes(s.status)).map((session) => (
                                        <Card key={session.id} className="mb-3 border-warning">
                                            <Card.Body>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <div className="fw-bold text-warning">{session.car_number}</div>
                                                        <small className="text-muted">{session.car_model}</small>
                                                        <br />
                                                        <small className="text-muted">Карта: {session.client_card_number}</small>
                                                        <br />
                                                        <small className="text-muted">Клиент: {session.client_name}</small>
                                                    </div>
                                                    <div className="text-end">
                                                        {session.status === 'requested' && (
                                                            <Button 
                                                                variant="warning" 
                                                                size="sm"
                                                                onClick={() => updateSessionStatus(session.id, 'return_requested')}
                                                                style={{fontSize: '12px', padding: '8px 15px'}}
                                                            >
                                                                <FontAwesomeIcon icon={faCheck} className="me-2" />
                                                                Принять запрос
                                                            </Button>
                                                        )}
                                                        {session.status === 'return_requested' && (
                                                            <Button 
                                                                variant="info" 
                                                                size="sm"
                                                                onClick={() => updateSessionStatus(session.id, 'return_accepted')}
                                                                style={{fontSize: '12px', padding: '8px 15px'}}
                                                            >
                                                                <FontAwesomeIcon icon={faCheck} className="me-2" />
                                                                Подтвердить принятие
                                                            </Button>
                                                        )}
                                                        {session.status === 'return_accepted' && (
                                                            <Button 
                                                                variant="info" 
                                                                size="sm"
                                                                onClick={() => updateSessionStatus(session.id, 'return_started')}
                                                                style={{fontSize: '12px', padding: '8px 15px'}}
                                                            >
                                                                <FontAwesomeIcon icon={faCar} className="me-2" />
                                                                Начать подачу
                                                            </Button>
                                                        )}
                                                        {session.status === 'return_started' && (
                                                            <Button 
                                                                variant="primary" 
                                                                size="sm"
                                                                onClick={() => updateSessionStatus(session.id, 'return_delivering')}
                                                                style={{fontSize: '12px', padding: '8px 15px'}}
                                                            >
                                                                <FontAwesomeIcon icon={faHandPaper} className="me-2" />
                                                                Подать к клиенту
                                                            </Button>
                                                        )}
                                                        {session.status === 'return_delivering' && (
                                                            <Button 
                                                                variant="success" 
                                                                size="sm"
                                                                onClick={() => updateSessionStatus(session.id, 'completed')}
                                                                style={{fontSize: '12px', padding: '8px 15px'}}
                                                            >
                                                                <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                                                                Подтвердить выдачу
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="text-center text-muted py-4">
                                        <FontAwesomeIcon icon={faHandPaper} size="3x" className="mb-3" />
                                        <h6>Нет запросов на подачу</h6>
                                        <p>Все автомобили находятся на парковке</p>
                                    </div>
                                )}
                                
                                <Button
                                    variant="outline-primary"
                                    onClick={() => setCurrentView('dashboard')}
                                    style={{borderRadius: '25px', width: '100%', marginTop: '20px'}}
                                >
                                    Назад к главной
                                </Button>
                            </Card.Body>
                        </Card>
                    </div>
                )}
                {/* Экран принятия автомобиля */}
                {currentView === 'acceptCar' && (
                    <Card style={mobileStyles.card} className="mobile-card mobile-elevated">
                        <Card.Header style={{ backgroundColor: '#007bff', color: 'white', borderRadius: '15px 15px 0 0' }}>
                            <h5 className="mb-0 text-center">Приём автомобиля</h5>
                            <small className="d-block text-center mt-1" style={{opacity: 0.9}}>Передайте клиенту карту и заполните все данные</small>
                        </Card.Header>
                        <Card.Body style={{ padding: '25px' }} className="mobile-card-body">
                            <Form onSubmit={handleAcceptCar}>
                                {/* Номер карты клиента */}
                                <Form.Group className="mb-3">
                                    <Form.Label>Номер карты клиента</Form.Label>
                                    <div style={{display: 'flex', gap: '10px'}}>
                                        <Form.Control
                                            type="text"
                                            placeholder="123456"
                                            value={carForm.client_card_number}
                                            onChange={(e) => setCarForm({...carForm, client_card_number: e.target.value})}
                                            required
                                            style={{...mobileStyles.formControl, flex: 1}}
                                            className="mobile-form-control"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline-secondary"
                                            onClick={generateCardNumber}
                                            style={{borderRadius: '10px', padding: '12px 15px'}}
                                        >
                                            Генерировать
                                        </Button>
                                    </div>
                                </Form.Group>

                                {/* Номер автомобиля */}
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">
                                        Номер автомобиля
                                        {carForm.has_subscription && (
                                            <Badge bg="success" className="ms-2">
                                                <FontAwesomeIcon icon={faCheck} className="me-1" />
                                                Резидент
                                            </Badge>
                                        )}
                                    </Form.Label>
                                    <div style={{display: 'flex', gap: '10px'}}>
                                        <Form.Control
                                            type="text"
                                            placeholder="А777"
                                            value={carForm.car_number}
                                            onChange={(e) => handleCarNumberChange(e.target.value)}
                                            required
                                            style={{
                                                ...mobileStyles.formControl, 
                                                flex: 1, 
                                                fontSize: '18px', 
                                                fontWeight: 'bold', 
                                                textAlign: 'center',
                                                borderColor: carForm.has_subscription ? '#28a745' : '#e0e0e0'
                                            }}
                                            className="mobile-form-control"
                                        />
                                        {foundSubscriptions.length > 0 && !searchingSubscriptions && (
                                            <Button
                                                type="button"
                                                variant="success"
                                                onClick={() => setShowSubscriptionsModal(true)}
                                                style={{borderRadius: '10px', padding: '12px 15px', fontWeight: 'bold'}}
                                            >
                                                А
                                            </Button>
                                        )}
                                        {searchingSubscriptions && (
                                            <div style={{padding: '12px 15px', borderRadius: '10px', backgroundColor: '#f8f9fa'}}>
                                                <div className="spinner-border spinner-border-sm"></div>
                                            </div>
                                        )}
                                    </div>
                                    {carForm.has_subscription && (
                                        <small className="text-success">
                                            <FontAwesomeIcon icon={faCheck} className="me-1" />
                                            Найден активный абонемент - бесплатная парковка
                                        </small>
                                    )}
                                </Form.Group>

                                {/* Марка и цвет автомобиля - в одной строчке */}
                                <Form.Group className="mb-3">
                                    <Form.Label>Марка и цвет автомобиля</Form.Label>
                                    <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
                                        {/* Марка автомобиля */}
                                        <div style={{flex: 1, display: 'flex', gap: '8px'}}>
                                            <Form.Control
                                                type="text"
                                                placeholder="BMW X5"
                                                value={carForm.car_model}
                                                onChange={(e) => setCarForm({...carForm, car_model: e.target.value})}
                                                style={{...mobileStyles.formControl, flex: 1}}
                                                className="mobile-form-control"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline-secondary"
                                                onClick={() => setShowBrandsModal(true)}
                                                style={{borderRadius: '10px', padding: '12px 15px'}}
                                                title="Выбрать популярную марку"
                                            >
                                                <FontAwesomeIcon icon={faBars} />
                                            </Button>
                                        </div>
                                        
                                        {/* Цвет автомобиля */}
                                        <div 
                                            onClick={() => setShowColorsModal(true)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '15px 20px',
                                                backgroundColor: carForm.car_color,
                                                borderRadius: '15px',
                                                border: '2px solid #e0e0e0',
                                                minHeight: '54px',
                                                minWidth: '60px',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                                transition: 'all 0.2s'
                                            }}
                                            title="Выбрать цвет автомобиля"
                                        >
                                        </div>
                                    </div>
                                    <small className="text-muted mt-1">Введите марку или выберите из списка, нажмите на цветной квадрат для выбора цвета</small>
                                </Form.Group>



                                {/* Фото */}
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold">
                                        Фото автомобиля (минимум 4)
                                                                        <Badge bg={carForm.photos.filter(p => p && p.url).length >= 4 ? 'success' : 'danger'} className="ms-2">
                                    {carForm.photos.filter(p => p && p.url).length}/4+
                                        </Badge>
                                    </Form.Label>
                                    <div 
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(4, 1fr)',
                                            gap: '10px',
                                            padding: '15px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '15px',
                                            border: '2px solid #e0e0e0'
                                        }}
                                    >
                                        {/* Основные 4 фото */}
                                        {[0, 1, 2, 3].map((index) => {
                                            const photo = carForm.photos[index];
                                            return (
                                                <div
                                                    key={index}
                                                    style={{
                                                        aspectRatio: '1',
                                                        border: photo ? '2px solid #28a745' : '2px dashed #ccc',
                                                        borderRadius: '12px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        backgroundColor: photo ? '#d4edda' : '#f8f9fa',
                                                        transition: 'all 0.2s',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                        color: '#155724',
                                                        position: 'relative',
                                                        overflow: 'hidden'
                                                    }}
                                                    onClick={() => {
                                                        if (photo && photo.url) {
                                                            setSelectedPhoto(photo);
                                                            setShowPhotoModal(true);
                                                        } else {
                                                            if (photo) {
                                                                retakeCarPhoto(index);
                                                            } else {
                                                                addCarPhoto();
                                                            }
                                                        }
                                                    }}
                                                >
                                                    {photo && photo.url ? (
                                                        <img
                                                            src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${photo.url}`}
                                                            alt={`Фото ${index + 1}`}
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover'
                                                            }}
                                                        />
                                                    ) : (
                                                        <div style={{textAlign: 'center'}}>
                                                            <FontAwesomeIcon icon={faCamera} size="2x" className="mb-2" />
                                                            <div>Фото {index + 1}</div>
                                                        </div>
                                                    )}

                                                    {/* Индикатор загрузки */}
                                                    {uploadingPhoto && (
                                                        <div
                                                            style={{
                                                                position: 'absolute',
                                                                top: 0,
                                                                left: 0,
                                                                right: 0,
                                                                bottom: 0,
                                                                backgroundColor: 'rgba(0,0,0,0.5)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: 'white'
                                                            }}
                                                        >
                                                            <div className="spinner-border spinner-border-sm"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Дополнительные фотографии */}
                                    {carForm.photos.length > 4 && (
                                        <div 
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(4, 1fr)',
                                                gap: '10px',
                                                padding: '15px',
                                                marginTop: '10px',
                                                backgroundColor: '#fff',
                                                borderRadius: '15px',
                                                border: '2px dashed #e0e0e0'
                                            }}
                                        >
                                            {carForm.photos.slice(4).map((photo, index) => (
                                                <div
                                                    key={photo.id || index + 4}
                                                    style={{
                                                        aspectRatio: '1',
                                                        border: '2px solid #28a745',
                                                        borderRadius: '12px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        backgroundColor: '#d4edda',
                                                        transition: 'all 0.2s',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                        color: '#155724',
                                                        position: 'relative',
                                                        overflow: 'hidden'
                                                    }}
                                                    onClick={() => {
                                                        setSelectedPhoto(photo);
                                                        setShowPhotoModal(true);
                                                    }}
                                                >
                                                    <img
                                                        src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${photo.url}`}
                                                        alt={`Дополнительное фото ${index + 5}`}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />

                                                    {/* Кнопка удаления */}
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            top: '-5px',
                                                            right: '-5px',
                                                            width: '20px',
                                                            height: '20px',
                                                            backgroundColor: '#dc3545',
                                                            color: 'white',
                                                            borderRadius: '50%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '10px',
                                                            cursor: 'pointer',
                                                            border: '2px solid white',
                                                            zIndex: 2
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeCarPhoto(index + 4);
                                                        }}
                                                    >
                                                        ×
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Кнопка добавления */}
                                            <div
                                                style={{
                                                    aspectRatio: '1',
                                                    border: '2px dashed #007bff',
                                                    borderRadius: '12px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    backgroundColor: 'white',
                                                    transition: 'all 0.2s',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    color: '#007bff'
                                                }}
                                                onClick={addCarPhoto}
                                            >
                                                <FontAwesomeIcon icon={faPlus} size="lg" className="mb-1" />
                                                <span>Добавить</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Кнопка добавления первого дополнительного фото */}
                                    {carForm.photos.length === 4 && (
                                        <div 
                                            style={{
                                                marginTop: '10px',
                                                padding: '15px',
                                                backgroundColor: '#fff',
                                                borderRadius: '15px',
                                                border: '2px dashed #e0e0e0'
                                            }}
                                        >
                                            <div
                                                style={{
                                                    aspectRatio: '4',
                                                    border: '2px dashed #007bff',
                                                    borderRadius: '12px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    backgroundColor: 'white',
                                                    transition: 'all 0.2s',
                                                    fontSize: '14px',
                                                    fontWeight: 'bold',
                                                    color: '#007bff'
                                                }}
                                                onClick={addCarPhoto}
                                            >
                                                <FontAwesomeIcon icon={faPlus} size="lg" className="mb-1" />
                                                <span>Добавить дополнительное фото</span>
                                            </div>
                                        </div>
                                    )}

                                    <small className="text-muted mt-2">
                                        Минимум 4 фото: спереди, сзади, слева, справа. Можете добавить больше при необходимости.
                                        {carForm.photos.length > 4 && <span className="text-info"> Нажмите × на дополнительном фото чтобы удалить его.</span>}
                                    </small>
                                </Form.Group>

                                {/* Заметки */}
                                <Form.Group className="mb-4">
                                    <Form.Label>Заметки (опционально)</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={carForm.notes}
                                        onChange={(e) => setCarForm({...carForm, notes: e.target.value})}
                                        placeholder="Состояние автомобиля, особенности, ценные вещи в салоне..."
                                        style={mobileStyles.formControl}
                                        className="mobile-form-control"
                                    />
                                </Form.Group>

                                {/* Кнопки */}
                                <div style={{display: 'grid', gap: '10px'}}>
                                    <Button 
                                        type="submit"
                                        variant="success"
                                        size="lg"
                                        disabled={loading}
                                        style={{
                                            ...mobileStyles.button,
                                            width: '100%'
                                        }}
                                        className="mobile-button"
                                    >
                                        {loading ? 'Обрабатываем...' : (
                                            <>
                                                <FontAwesomeIcon icon={faCar} className="me-2" />
                                                Принять автомобиль
                                            </>
                                        )}
                                    </Button>
                                    
                                    <Button
                                        type="button"
                                        variant="outline-secondary"
                                        onClick={() => setCurrentView('dashboard')}
                                        style={{borderRadius: '25px'}}
                                    >
                                        Отмена
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                )}

                {/* История смен */}
                {currentView === 'history' && (
                    <div>
                        <Card style={mobileStyles.card} className="mobile-card mobile-elevated">
                            <Card.Header style={{ backgroundColor: '#6c757d', color: 'white', borderRadius: '15px 15px 0 0' }}>
                                <h5 className="mb-0 text-center">История ваших смен</h5>
                            </Card.Header>
                            <Card.Body style={{ padding: '25px' }}>
                                <div className="text-center text-muted">
                                    <FontAwesomeIcon icon={faClock} size="3x" className="mb-3" />
                                    <p>История смен будет доступна в следующих версиях приложения</p>
                                </div>
                                <Button
                                    variant="outline-primary"
                                    onClick={() => setCurrentView('dashboard')}
                                    style={{borderRadius: '25px', width: '100%'}}
                                >
                                    Назад к главной
                                </Button>
                            </Card.Body>
                        </Card>
                    </div>
                )}

                {/* Меню */}
                {currentView === 'menu' && (
                    <div>
                        <Card style={mobileStyles.card} className="mobile-card mobile-elevated">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-4 p-3 border rounded">
                                    <span>Ваш статус: На месте</span>
                                    <FontAwesomeIcon 
                                        icon={isOnShift ? faToggleOn : faToggleOff} 
                                        size="2x" 
                                        className={isOnShift ? 'text-success' : 'text-secondary'}
                                        onClick={() => setIsOnShift(!isOnShift)}
                                        style={{cursor: 'pointer'}}
                                    />
                                </div>

                                <div className="d-flex justify-content-between align-items-center mb-4 p-3 border rounded">
                                    <span>Уведомления в телеграмм</span>
                                    <FontAwesomeIcon 
                                        icon={notifications ? faToggleOn : faToggleOff} 
                                        size="2x" 
                                        className={notifications ? 'text-success' : 'text-secondary'}
                                        onClick={() => setNotifications(!notifications)}
                                        style={{cursor: 'pointer'}}
                                    />
                                </div>

                                <div style={{display: 'grid', gap: '10px'}}>
                                    <Button variant="primary" size="lg" onClick={handleLogout}>
                                        Завершить смену
                                    </Button>
                                    <Button variant="outline-secondary" onClick={() => setCurrentView('dashboard')}>
                                        Назад к главной
                                    </Button>
                                </div>

                                <div className="text-center mt-4">
                                    <small className="text-muted">v 1.1.9</small>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                )}
            </div>

            {/* Нижняя навигация */}
            <MobileBottomNav />

            {/* Модальное окно подтверждения парковки */}
            <Modal show={showParkingModal} onHide={() => setShowParkingModal(false)} size="lg">
                <Modal.Header closeButton className="bg-success text-white">
                    <Modal.Title>
                        <FontAwesomeIcon icon={faParking} className="me-2" />
                        Подтверждение парковки
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{maxHeight: '70vh', overflowY: 'auto'}}>
                    {currentSession && (
                        <>
                            <div className="mb-3 p-3 bg-light rounded">
                                <h6 className="text-success mb-2">Автомобиль принят вами:</h6>
                                <div className="d-flex align-items-center">
                                    <FontAwesomeIcon icon={faCar} size="2x" className="text-primary me-3" />
                                    <div>
                                        <div className="fw-bold">{currentSession.car_number}</div>
                                        <div className="text-muted">{currentSession.car_model}</div>
                                        <div className="small text-muted">Карта: {currentSession.client_card_number}</div>
                                        <div className="small text-success">Валет: {employee?.full_name || employee?.name}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Место парковки и карта */}
                            <div className="mb-3">
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">
                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                                        Место парковки
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Например: Р4-309, Уровень 2, Сектор А"
                                        value={parkingData?.parking_spot || ''}
                                        onChange={(e) => setParkingData(prev => ({...prev, parking_spot: e.target.value}))}
                                        required
                                        style={mobileStyles.formControl}
                                    />
                                    <small className="text-muted">Укажите точное место где припаркован автомобиль</small>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">
                                        <FontAwesomeIcon icon={faParking} className="me-2" />
                                        Парковочная карта
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Например: P001, 1234, A-15"
                                        value={parkingData?.parking_card || ''}
                                        onChange={(e) => setParkingData(prev => ({...prev, parking_card: e.target.value}))}
                                        required
                                        style={mobileStyles.formControl}
                                    />
                                    <small className="text-muted">Укажите номер карты, которой была оплачена парковка</small>
                                </Form.Group>
                            </div>

                            {/* Фото с парковки */}
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">
                                    <FontAwesomeIcon icon={faCamera} className="me-2" />
                                    Фото с парковки (минимум 2)
                                </Form.Label>
                                <div className="d-flex flex-wrap gap-2 mb-2">
                                    {[1, 2, 3, 4].map((num) => {
                                        const photo = parkingData?.photos?.[num - 1];
                                        return (
                                            <div
                                                key={num}
                                                onClick={async () => {
                                                    const photoData = await handlePhotoCapture('parking');
                                                    if (photoData) {
                                                        setParkingData(prev => {
                                                            const newPhotos = [...(prev.photos || [])];
                                                            newPhotos[num - 1] = photoData;
                                                            return {
                                                                ...prev,
                                                                photos: newPhotos
                                                            };
                                                        });
                                                    }
                                                }}
                                                style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    border: '2px dashed #28a745',
                                                    borderRadius: '10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    backgroundColor: '#f8f9fa',
                                                    position: 'relative',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                {photo?.url ? (
                                                    <img 
                                                        src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${photo.url}`}
                                                        alt={`Фото парковки ${num}`}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedPhoto(photo);
                                                            setShowPhotoModal(true);
                                                        }}
                                                        title="Нажмите для просмотра"
                                                    />
                                                ) : (
                                                    <FontAwesomeIcon icon={faCamera} size="2x" className="text-muted" />
                                                )}
                                                {num <= 2 && !photo?.url && (
                                                    <div 
                                                        style={{
                                                            position: 'absolute',
                                                            top: '-8px',
                                                            right: '-8px',
                                                            backgroundColor: '#dc3545',
                                                            color: 'white',
                                                            borderRadius: '50%',
                                                            width: '20px',
                                                            height: '20px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        !
                                                    </div>
                                                )}
                                                {uploadingPhoto && (
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            right: 0,
                                                            bottom: 0,
                                                            backgroundColor: 'rgba(0,0,0,0.5)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white'
                                                        }}
                                                    >
                                                        <div className="spinner-border spinner-border-sm"></div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <small className="text-muted">
                                    Сделайте фото автомобиля на парковочном месте. Первые 2 фото обязательны.
                                </small>
                                <div className="mt-2">
                                    <Badge bg={parkingData?.photos?.filter(p => p && p.url)?.length >= 2 ? 'success' : 'danger'}>
                                        Загружено: {parkingData?.photos?.filter(p => p && p.url)?.length || 0} из 2 обязательных
                                    </Badge>
                                </div>
                            </Form.Group>

                            {/* Дополнительные заметки */}
                            <Form.Group className="mb-3">
                                <Form.Label>Дополнительные заметки</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={parkingData?.notes || ''}
                                    onChange={(e) => setParkingData(prev => ({...prev, notes: e.target.value}))}
                                    placeholder="Особенности парковки, состояние автомобиля..."
                                    style={mobileStyles.formControl}
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button 
                        variant="success" 
                        onClick={confirmParking}
                        disabled={
                            !parkingData?.parking_spot?.trim() || 
                            !parkingData?.parking_card?.trim() || 
                            !parkingData?.photos?.filter(p => p && p.url)?.length || 
                            parkingData.photos.filter(p => p && p.url).length < 2 ||
                            loading
                        }
                        className="rounded-pill"
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Сохранение...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faParking} className="me-2" />
                                Подтвердить парковку
                            </>
                        )}
                    </Button>
                    <Button 
                        variant="outline-secondary" 
                        onClick={() => setShowParkingModal(false)}
                        disabled={loading}
                        className="rounded-pill"
                    >
                        Отмена
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Модальное окно начала подачи автомобиля */}
            <Modal show={showReturnStartModal} onHide={() => setShowReturnStartModal(false)} size="lg">
                <Modal.Header closeButton className="bg-info text-white">
                    <Modal.Title>
                        <FontAwesomeIcon icon={faCar} className="me-2" />
                        Начало подачи автомобиля
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{maxHeight: '70vh', overflowY: 'auto'}}>
                    {currentSession && (
                        <>
                            <div className="mb-3 p-3 bg-light rounded">
                                <h6 className="text-info mb-2">Автомобиль для подачи:</h6>
                                <div className="d-flex align-items-center">
                                    <FontAwesomeIcon icon={faCar} size="2x" className="text-primary me-3" />
                                    <div>
                                        <div className="fw-bold">{currentSession.car_number}</div>
                                        <div className="text-muted">{currentSession.car_model}</div>
                                        <div className="small text-muted">Карта: {currentSession.client_card_number}</div>
                                        <div className="small text-success">Место: {currentSession.parking_spot || 'Не указано'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Фото автомобиля на парковке перед подачей */}
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">
                                    <FontAwesomeIcon icon={faCamera} className="me-2" />
                                    Фото автомобиля на парковке (минимум 2)
                                </Form.Label>
                                <div className="d-flex flex-wrap gap-2 mb-2">
                                    {[1, 2, 3, 4].map((num) => {
                                        const photo = returnData?.photos?.[num - 1];
                                        return (
                                            <div
                                                key={num}
                                                onClick={async () => {
                                                    const photoData = await handlePhotoCapture('return_start');
                                                    if (photoData) {
                                                        setReturnData(prev => {
                                                            const newPhotos = [...(prev.photos || [])];
                                                            newPhotos[num - 1] = photoData;
                                                            return {
                                                                ...prev,
                                                                photos: newPhotos
                                                            };
                                                        });
                                                    }
                                                }}
                                                style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    border: '2px dashed #17a2b8',
                                                    borderRadius: '10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    backgroundColor: '#f8f9fa',
                                                    position: 'relative',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                {photo?.url ? (
                                                    <img 
                                                        src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${photo.url}`}
                                                        alt={`Фото ${num}`}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedPhoto(photo);
                                                            setShowPhotoModal(true);
                                                        }}
                                                        title="Нажмите для просмотра"
                                                    />
                                                ) : (
                                                    <FontAwesomeIcon icon={faCamera} size="2x" className="text-muted" />
                                                )}
                                                {num <= 2 && !photo?.url && (
                                                    <div 
                                                        style={{
                                                            position: 'absolute',
                                                            top: '-8px',
                                                            right: '-8px',
                                                            backgroundColor: '#dc3545',
                                                            color: 'white',
                                                            borderRadius: '50%',
                                                            width: '20px',
                                                            height: '20px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        !
                                                    </div>
                                                )}
                                                {uploadingPhoto && (
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            right: 0,
                                                            bottom: 0,
                                                            backgroundColor: 'rgba(0,0,0,0.5)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white'
                                                        }}
                                                    >
                                                        <div className="spinner-border spinner-border-sm"></div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <small className="text-muted">
                                    Сделайте фото автомобиля перед тем как забрать с парковки.
                                </small>
                                <div className="mt-2">
                                    <Badge bg={returnData?.photos?.filter(p => p && p.url)?.length >= 2 ? 'success' : 'danger'}>
                                        Загружено: {returnData?.photos?.filter(p => p && p.url)?.length || 0} из 2 обязательных
                                    </Badge>
                                </div>
                            </Form.Group>

                            {/* Заметки */}
                            <Form.Group className="mb-3">
                                <Form.Label>Заметки</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={returnData?.notes || ''}
                                    onChange={(e) => setReturnData(prev => ({...prev, notes: e.target.value}))}
                                    placeholder="Состояние автомобиля при забирании с парковки..."
                                    style={mobileStyles.formControl}
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button 
                        variant="info" 
                        onClick={confirmReturnStart}
                        disabled={!returnData?.photos?.filter(p => p && p.url)?.length || returnData.photos.filter(p => p && p.url).length < 2 || loading}
                        style={{borderRadius: '25px'}}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Сохранение...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faCar} className="me-2" />
                                Начать подачу
                            </>
                        )}
                    </Button>
                    <Button 
                        variant="outline-secondary" 
                        onClick={() => setShowReturnStartModal(false)}
                        disabled={loading}
                        style={{borderRadius: '25px'}}
                    >
                        Отмена
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Модальное окно выбора марки автомобиля */}
            <Modal show={showBrandsModal} onHide={() => setShowBrandsModal(false)} size="lg">
                <Modal.Header closeButton className="bg-info text-white">
                    <Modal.Title>
                        <FontAwesomeIcon icon={faCar} className="me-2" />
                        Популярные марки автомобилей
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{maxHeight: '70vh', overflowY: 'auto', padding: '0'}}>
                    <div style={{ padding: '10px' }}>
                        {popularBrands.map((brand, index) => (
                            <div
                                key={brand.name}
                                onClick={() => {
                                    setCarForm({...carForm, car_model: brand.name});
                                    setShowBrandsModal(false);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '15px 20px',
                                    borderRadius: '12px',
                                    marginBottom: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: '#f8f9fa',
                                    border: '2px solid transparent',
                                    transition: 'all 0.2s',
                                    fontSize: '16px',
                                    fontWeight: '500'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = '#e3f2fd';
                                    e.currentTarget.style.borderColor = '#007bff';
                                    e.currentTarget.style.transform = 'translateX(5px)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                                    e.currentTarget.style.borderColor = 'transparent';
                                    e.currentTarget.style.transform = 'translateX(0)';
                                }}
                            >
                                <div 
                                    style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '12px',
                                        backgroundColor: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginRight: '15px',
                                        padding: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                        border: '2px solid #f0f0f0',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <img 
                                        src={brand.logo}
                                        alt={brand.name}
                                        style={{
                                            width: '28px',
                                            height: '28px',
                                            objectFit: 'contain',
                                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onError={(e) => {
                                            // Try fallback image first
                                            if (e.target.src !== brand.fallback) {
                                                e.target.src = brand.fallback;
                                            } else {
                                                // If fallback also fails, show text
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                            }
                                        }}
                                    />
                                    <div 
                                        style={{
                                            display: 'none',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            color: brand.color,
                                            textAlign: 'center'
                                        }}
                                    >
                                        {brand.name.charAt(0)}
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', color: '#333' }}>
                                        {brand.name}
                                    </div>
                                    <small style={{ color: '#666' }}>
                                        Нажмите для выбора
                                    </small>
                                </div>
                                <FontAwesomeIcon 
                                    icon={faCheck} 
                                    style={{ 
                                        color: '#007bff',
                                        opacity: carForm.car_model === brand.name ? 1 : 0,
                                        transition: 'opacity 0.2s'
                                    }} 
                                />
                            </div>
                        ))}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setShowBrandsModal(false)}>
                        Закрыть
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Модальное окно выбора цвета автомобиля */}
            <Modal show={showColorsModal} onHide={() => setShowColorsModal(false)} size="sm">
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title>
                        Выберите цвет
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{padding: '20px'}}>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(5, 1fr)', 
                        gap: '12px'
                    }}>
                        {carColors.map((color) => (
                            <div
                                key={color.value}
                                onClick={() => {
                                    setCarForm({...carForm, car_color: color.value});
                                    setShowColorsModal(false);
                                }}
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    backgroundColor: color.value,
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    border: carForm.car_color === color.value ? '4px solid #007bff' : '2px solid #e0e0e0',
                                    transition: 'all 0.2s',
                                    boxShadow: carForm.car_color === color.value ? '0 4px 15px rgba(0,123,255,0.4)' : '0 2px 8px rgba(0,0,0,0.1)',
                                    transform: carForm.car_color === color.value ? 'scale(1.05)' : 'scale(1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                title={color.name}
                            >
                                {carForm.car_color === color.value && (
                                    <FontAwesomeIcon 
                                        icon={faCheck} 
                                        style={{ 
                                            color: color.value === '#FFFFFF' ? '#007bff' : '#fff',
                                            fontSize: '16px',
                                            textShadow: color.value === '#FFFFFF' ? 'none' : '1px 1px 2px rgba(0,0,0,0.5)'
                                        }} 
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </Modal.Body>
            </Modal>

            {/* Модальное окно подачи к клиенту */}
            <Modal show={showReturnDeliveryModal} onHide={() => setShowReturnDeliveryModal(false)} size="lg">
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title>
                        <FontAwesomeIcon icon={faHandPaper} className="me-2" />
                        Подача автомобиля клиенту
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{maxHeight: '70vh', overflowY: 'auto'}}>
                    {currentSession && (
                        <>
                            <div className="mb-3 p-3 bg-light rounded">
                                <h6 className="text-primary mb-2">Подача клиенту:</h6>
                                <div className="d-flex align-items-center">
                                    <FontAwesomeIcon icon={faCar} size="2x" className="text-primary me-3" />
                                    <div>
                                        <div className="fw-bold">{currentSession.car_number}</div>
                                        <div className="text-muted">{currentSession.car_model}</div>
                                        <div className="small text-muted">Карта: {currentSession.client_card_number}</div>
                                        <div className="small text-muted">Клиент: {currentSession.client_name}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Фото подачи клиенту */}
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">
                                    <FontAwesomeIcon icon={faCamera} className="me-2" />
                                    Фото подачи автомобиля (минимум 1)
                                </Form.Label>
                                <div className="d-flex flex-wrap gap-2 mb-2">
                                    {[1, 2].map((num) => {
                                        const photo = returnData?.photos?.[num - 1];
                                        return (
                                            <div
                                                key={num}
                                                onClick={async () => {
                                                    const photoData = await handlePhotoCapture('return_delivery');
                                                    if (photoData) {
                                                        setReturnData(prev => {
                                                            const newPhotos = [...(prev.photos || [])];
                                                            newPhotos[num - 1] = photoData;
                                                            return {
                                                                ...prev,
                                                                photos: newPhotos
                                                            };
                                                        });
                                                    }
                                                }}
                                                style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    border: '2px dashed #007bff',
                                                    borderRadius: '10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    backgroundColor: '#f8f9fa',
                                                    position: 'relative',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                {photo?.url ? (
                                                    <img 
                                                        src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${photo.url}`}
                                                        alt={`Фото ${num}`}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedPhoto(photo);
                                                            setShowPhotoModal(true);
                                                        }}
                                                        title="Нажмите для просмотра"
                                                    />
                                                ) : (
                                                    <FontAwesomeIcon icon={faCamera} size="2x" className="text-muted" />
                                                )}
                                                {num === 1 && !photo?.url && (
                                                    <div 
                                                        style={{
                                                            position: 'absolute',
                                                            top: '-8px',
                                                            right: '-8px',
                                                            backgroundColor: '#dc3545',
                                                            color: 'white',
                                                            borderRadius: '50%',
                                                            width: '20px',
                                                            height: '20px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        !
                                                    </div>
                                                )}
                                                {uploadingPhoto && (
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            right: 0,
                                                            bottom: 0,
                                                            backgroundColor: 'rgba(0,0,0,0.5)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white'
                                                        }}
                                                    >
                                                        <div className="spinner-border spinner-border-sm"></div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <small className="text-muted">
                                    Сделайте фото момента подачи автомобиля клиенту.
                                </small>
                                <div className="mt-2">
                                    <Badge bg={returnData?.photos?.filter(p => p && p.url)?.length >= 1 ? 'success' : 'danger'}>
                                        Загружено: {returnData?.photos?.filter(p => p && p.url)?.length || 0} из 1 обязательного
                                    </Badge>
                                </div>
                            </Form.Group>

                            {/* Заметки */}
                            <Form.Group className="mb-3">
                                <Form.Label>Заметки о подаче</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={returnData?.notes || ''}
                                    onChange={(e) => setReturnData(prev => ({...prev, notes: e.target.value}))}
                                    placeholder="Особенности подачи, состояние автомобиля при выдаче..."
                                    style={mobileStyles.formControl}
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button 
                        variant="primary" 
                        onClick={confirmReturnDelivery}
                        disabled={!returnData?.photos?.filter(p => p && p.url)?.length || loading}
                        style={{borderRadius: '25px'}}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Сохранение...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faHandPaper} className="me-2" />
                                Подать клиенту
                            </>
                        )}
                    </Button>
                    <Button 
                        variant="outline-secondary" 
                        onClick={() => setShowReturnDeliveryModal(false)}
                        disabled={loading}
                        style={{borderRadius: '25px'}}
                    >
                        Отмена
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Модальное окно с найденными абонементами */}
            <Modal show={showSubscriptionsModal} onHide={() => setShowSubscriptionsModal(false)} size="lg">
                <Modal.Header closeButton className="bg-success text-white">
                    <Modal.Title>
                        Найдено {foundSubscriptions.length} абонемент(ов)
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{maxHeight: '70vh', overflowY: 'auto'}}>
                    {foundSubscriptions.map((subscription, index) => (
                        <Card key={subscription.id} className="mb-3 border-success">
                            <Card.Body>
                                <Row>
                                    <Col md={6}>
                                        <h6 className="text-success">РЕЗИДЕНТ</h6>
                                        <p className="mb-1"><strong>{subscription.client_name} {subscription.client_surname}</strong></p>
                                        
                                        <h6 className="text-muted mt-3">АВТОМОБИЛЬ</h6>
                                        <p className="mb-1">{subscription.car_model} <strong>{subscription.car_number}</strong></p>
                                        
                                        <h6 className="text-muted mt-3">АДРЕС</h6>
                                        <p className="mb-1">Корп. {subscription.client_build || 'null'}, кв. {subscription.client_appartament || 'null'}</p>
                                    </Col>
                                    <Col md={6}>
                                        <h6 className="text-muted">СРОК ДЕЙСТВИЯ</h6>
                                        <p className="mb-1">
                                            с {subscription.start_date ? new Date(subscription.start_date).toLocaleDateString('ru-RU') : 'N/A'} по {subscription.end_date ? new Date(subscription.end_date).toLocaleDateString('ru-RU') : 'N/A'}
                                        </p>
                                        
                                        <h6 className="text-muted mt-3">ТЕЛЕФОН</h6>
                                        <p className="mb-1">{subscription.client_phone || 'Не указан'}</p>
                                    </Col>
                                </Row>
                                <div className="d-grid mt-3">
                                    <Button 
                                        variant="success" 
                                        onClick={() => selectSubscription(subscription)}
                                        size="lg"
                                    >
                                        Подставить данные
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    ))}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setShowSubscriptionsModal(false)}>
                        Закрыть
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Модальное окно просмотра фото */}
            <Modal show={showPhotoModal} onHide={() => setShowPhotoModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Просмотр фото</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center p-0">
                    {selectedPhoto && (
                        <img 
                            src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${selectedPhoto.url}`}
                            alt="Фото автомобиля"
                            style={{
                                width: '100%',
                                maxHeight: '70vh',
                                objectFit: 'contain'
                            }}
                        />
                    )}
                    {selectedPhoto && (
                        <div className="p-3 text-muted small">
                            <div>Загружено: {selectedPhoto.timestamp ? new Date(selectedPhoto.timestamp).toLocaleString('ru-RU') : 'Неизвестно'}</div>
                            {selectedPhoto.original_name && <div>Файл: {selectedPhoto.original_name}</div>}
                            {selectedPhoto.filename && <div>Сохранен как: {selectedPhoto.filename}</div>}
                            {selectedPhoto.size && <div>Размер: {(selectedPhoto.size / 1024 / 1024).toFixed(2)} MB</div>}
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default ValetMobileApp;