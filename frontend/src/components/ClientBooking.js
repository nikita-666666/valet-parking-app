import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Form, Alert, Row, Col, Modal, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCar, 
    faPhone, 
    faUser, 
    faMapMarkerAlt, 
    faCheck, 
    faClock, 
    faShieldAlt, 
    faQrcode,
    faIdCard,
    faArrowLeft,
    faSearch,
    faCarSide,
    faHome,
    faCalendarPlus,
    faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const ClientBooking = () => {
    const [cardNumber, setCardNumber] = useState('');
    const [carInfo, setCarInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [showTimerModal, setShowTimerModal] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(15 * 60); // 15 минут в секундах
    const [deliveryStatus, setDeliveryStatus] = useState('return_requested');
    const [ticket, setTicket] = useState('');
    const [pinCode, setPinCode] = useState('');
    const [activeInput, setActiveInput] = useState('ticket'); // 'ticket' или 'pinCode'
    const [showTimer, setShowTimer] = useState(false);

    // Обновленные стили с новой цветовой схемой
    const mobileStyles = {
        container: {
            backgroundColor: '#121212',
            minHeight: '100vh',
            color: '#FFFFFF',
            fontFamily: 'SF Pro Text, -apple-system, Ubuntu, sans-serif'
        },
        header: {
            padding: '12px 16px',
            display: 'grid',
            gridTemplateColumns: '32px 1fr 80px',
            alignItems: 'center',
            borderBottom: '1px solid rgba(179, 152, 122, 0.2)',
            backgroundColor: '#1C1C1E',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            gap: '8px'
        },
        headerTitle: {
            fontFamily: 'Ubuntu',
            fontWeight: 500,
            fontSize: '16px',
            lineHeight: '100%',
            letterSpacing: '0%',
            color: '#FFFFFF',
            textAlign: 'center',
            margin: 0,
            gridColumn: '2',
            justifySelf: 'center'
        },
        backButton: {
            color: '#B3987A',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            width: '32px',
            height: '32px',
            gridColumn: '1'
        },
        headerIcons: {
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gridColumn: '3'
        },
        headerIcon: {
            color: '#B3987A',
            cursor: 'pointer',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        content: {
            padding: '20px 16px',
            backgroundColor: '#121212'
        },
        title: {
            fontFamily: 'Ubuntu',
            fontWeight: 500,
            fontSize: '24px',
            marginBottom: '30px',
            color: '#FFFFFF'
        },
        inputGroup: {
            marginBottom: '20px'
        },
        inputLabel: {
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '14px',
            marginBottom: '8px'
        },
        input: {
            width: '100%',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#FFFFFF',
            fontSize: '16px',
            padding: '8px 0',
            outline: 'none'
        },
        keypadContainer: {
            backgroundColor: '#202020EB',
            padding: '20px 16px',
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px'
        },
        keypad: {
            marginTop: '20px'
        },
        keypadRow: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 117px)',
            gap: '8px',
            marginBottom: '8px',
            justifyContent: 'center'
        },
        keypadButton: {
            width: '117px',
            height: '47px',
            backgroundColor: '#383738',
            border: 'none',
            borderRadius: '5px',
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 0'
        },
        keypadNumber: {
            fontFamily: 'SF Pro Display, -apple-system',
            fontWeight: 400,
            fontSize: '25px',
            lineHeight: '100%',
            letterSpacing: '0.29px',
            textAlign: 'center',
            margin: 0
        },
        keypadButtonText: {
            fontFamily: 'SF Pro Text, -apple-system',
            fontWeight: 700,
            fontSize: '10px',
            lineHeight: '100%',
            letterSpacing: '2px',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.3)',
            marginTop: '2px'
        },
        findButton: {
            width: '100%',
            padding: '16px',
            backgroundColor: '#B3987A',
            border: 'none',
            borderRadius: '12px',
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '20px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: 'SF Pro Text, -apple-system',
            lineHeight: '120%',
            letterSpacing: '0%',
            textAlign: 'center'
        },
        loadingGradient: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, #FFFFFF 30%, #F5F5F5 50%, #FFFFFF 70%)',
            backgroundSize: '200% 100%',
            animation: 'gradientMove 1.5s infinite linear'
        },
        '@keyframes gradientMove': {
            '0%': {
                backgroundPosition: '100% 50%'
            },
            '100%': {
                backgroundPosition: '-100% 50%'
            }
        },
        app: {
            minHeight: '100vh',
            background: '#383738',
            fontFamily: 'Ubuntu, sans-serif',
            position: 'relative',
            paddingBottom: '80px'
        },
        header: {
            backgroundColor: '#383738',
            padding: '20px',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            borderBottom: '1px solid rgba(179, 152, 122, 0.2)'
        },
        headerTitle: {
            fontFamily: 'Ubuntu',
            fontWeight: 500,
            fontSize: '20px',
            lineHeight: '100%',
            letterSpacing: '0%',
            color: '#B3987A'
        },
        headerSubtitle: {
            fontFamily: 'Ubuntu',
            fontWeight: 400,
            fontSize: '14px',
            lineHeight: '18px',
            letterSpacing: '0%',
            color: '#B3987A'
        },
        bottomNav: {
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#383738',
            borderTop: '1px solid rgba(179, 152, 122, 0.2)',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '15px 0',
            zIndex: 1000,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.3)'
        },
        navItem: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '10px 15px',
            color: '#B3987A',
            cursor: 'pointer',
            borderRadius: '15px',
            transition: 'all 0.3s',
            minWidth: '80px'
        },
        navItemActive: {
            backgroundColor: 'rgba(179, 152, 122, 0.2)',
            transform: 'translateY(-3px)',
            boxShadow: '0 4px 15px rgba(179, 152, 122, 0.3)'
        },
        card: {
            border: 'none',
            borderRadius: '20px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
            backgroundColor: '#383738',
            marginBottom: '20px',
            border: '1px solid rgba(179, 152, 122, 0.1)'
        },
        button: {
            borderRadius: '25px',
            padding: '15px 30px',
            fontFamily: 'Ubuntu',
            fontWeight: 500,
            fontSize: '16px',
            lineHeight: '100%',
            letterSpacing: '0%',
            boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
            border: 'none',
            transition: 'all 0.3s'
        },
        primaryButton: {
            background: '#B3987A',
            color: '#383738',
            fontWeight: 'bold'
        },
        successButton: {
            background: '#B3987A',
            color: '#383738',
            fontWeight: 'bold'
        },
        formControl: {
            borderRadius: '15px',
            border: '2px solid rgba(179, 152, 122, 0.2)',
            padding: '15px 20px',
            fontFamily: 'Ubuntu',
            fontWeight: 400,
            fontSize: '14px',
            lineHeight: '18px',
            letterSpacing: '0%',
            backgroundColor: 'rgba(56, 55, 56, 0.9)',
            color: '#ffffff'
        },
        text: {
            primary: {
                fontFamily: 'Ubuntu',
                fontWeight: 500,
                fontSize: '20px',
                lineHeight: '100%',
                letterSpacing: '0%',
                color: '#B3987A'
            },
            secondary: {
                fontFamily: 'Ubuntu',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '18px',
                letterSpacing: '0%',
                color: '#B3987A'
            }
        },
        carInfoCard: {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '20px',
            marginTop: '30px',
            marginBottom: '30px'
        },
        carInfoRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px',
            color: '#FFFFFF',
            fontSize: '14px',
            opacity: 0.8
        },
        submitButton: {
            width: '100%',
            padding: '16px',
            backgroundColor: '#B3987A',
            border: 'none',
            borderRadius: '12px',
            color: '#000000',
            fontSize: '16px',
            fontWeight: 500,
            marginTop: 'auto',
            cursor: 'pointer'
        }
    };

    useEffect(() => {
        // Настройка viewport для мобильного опыта
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        } else {
            const meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            document.head.appendChild(meta);
        }

        // Предотвращение зума на iOS
        document.addEventListener('gesturestart', function (e) {
            e.preventDefault();
        });
    }, []);

    const handleCardSearch = async () => {
        if (!cardNumber.trim()) {
            showAlert('Введите номер карты', 'warning');
            return;
        }

        setLoading(true);
        try {
            console.log('🔍 Поиск автомобиля по карте:', cardNumber);
            const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-sessions/by-card/${cardNumber}`);
            
            console.log('📋 Найден автомобиль:', response.data);
            
            if (response.data) {
                setCarInfo(response.data);
                showAlert('Автомобиль найден! Вы можете запросить подачу.', 'success');
            } else {
                showAlert('Автомобиль с таким номером карты не найден', 'warning');
                setCarInfo(null);
            }
        } catch (error) {
            console.error('❌ Ошибка поиска автомобиля:', error);
            showAlert('Автомобиль с таким номером карты не найден', 'warning');
            setCarInfo(null);
        }
        setLoading(false);
    };

    // Функция для расчета времени на парковке
    const calculateParkingDuration = (createdAt) => {
        if (!createdAt) return '00ч 00м';
        
        const created = new Date(createdAt);
        const now = new Date();
        const diffInMinutes = Math.floor((now - created) / (1000 * 60));
        
        const hours = Math.floor(diffInMinutes / 60);
        const minutes = diffInMinutes % 60;
        
        return `${String(hours).padStart(2, '0')}ч ${String(minutes).padStart(2, '0')}м`;
    };

    const handleSearch = async () => {
        if (!ticket) {
            window.alert('Введите номер билета');
            return;
        }
        
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-sessions/by-card/${ticket}`);
            
            console.log('Search response:', response.data);

            if (response.data) {
                setCarInfo({
                    id: response.data.id,
                    carModel: response.data.car_model || 'Не указано',
                    carNumber: response.data.car_number || 'Не указано',
                    status: response.data.status || 'parked',
                    parkingTime: calculateParkingDuration(response.data.created_at),
                    client_card_number: response.data.client_card_number
                });
            } else {
                window.alert('Автомобиль не найден. Проверьте номер билета.');
                setCarInfo(null);
            }
        } catch (error) {
            console.error('Ошибка поиска:', error);
            window.alert('Ошибка при поиске автомобиля. Попробуйте еще раз.');
            setCarInfo(null);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestCar = async () => {
        if (!carInfo || !carInfo.client_card_number) {
            console.error('Отсутствует номер карты клиента');
            window.alert('Ошибка: не найден номер карты клиента');
            return;
        }

        setLoading(true);
        try {
            console.log('Requesting car return for card:', carInfo.client_card_number);
            
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-sessions/request-return/${carInfo.client_card_number}`
            );

            console.log('Request car response:', response.data);

            if (response.data.success) {
                setShowTimer(true);
                setTimeRemaining(10 * 60); // 10 минут
                setDeliveryStatus('return_requested');
                // Обновляем статус в информации о машине
                setCarInfo(prev => ({
                    ...prev,
                    status: 'return_requested'
                }));
                // Запускаем таймер
                startDeliveryTimer();
            } else {
                window.alert('Не удалось запросить подачу автомобиля. Попробуйте еще раз.');
            }
        } catch (error) {
            console.error('Ошибка запроса подачи:', error);
            window.alert('Ошибка при запросе подачи автомобиля.');
        } finally {
            setLoading(false);
        }
    };

    const requestCarDeliveryAfterPayment = async () => {
        try {
            console.log('🚗 Отправляем РЕАЛЬНЫЙ запрос на подачу после оплаты для карты:', cardNumber);
            
            // Делаем реальный запрос на подачу автомобиля
            const deliveryResponse = await axios.post(
                `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-sessions/request-return/${cardNumber}`
            );
            
            console.log('📨 Ответ от backend на запрос подачи:', deliveryResponse.data);
            
            if (deliveryResponse.data.success) {
                // Успешный запрос подачи - запускаем таймер
                setDeliveryStatus('return_requested');
                setTimeRemaining(15 * 60);
                setShowTimerModal(true);
                setCarInfo({...carInfo, status: 'return_requested'});
                startDeliveryTimer();
                showAlert('Запрос на подачу автомобиля отправлен!', 'success');
            } else {
                showAlert('Ошибка при запросе подачи автомобиля', 'danger');
            }
        } catch (error) {
            console.error('❌ Ошибка запроса подачи после оплаты:', error);
            showAlert('Ошибка при запросе подачи автомобиля', 'danger');
        }
    };

    const handlePayment = async () => {
        if (!paymentInfo) return;

        setLoading(true);
        try {
            console.log('💳 Отправляем оплату для сессии:', paymentInfo.sessionId, 'сумма:', paymentInfo.remainingAmount);
            
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-sessions/${paymentInfo.sessionId}/payment`,
                {
                    payment_method: 'client_app',
                    amount: paymentInfo.remainingAmount
                }
            );
            
            console.log('📨 Ответ на оплату:', response.data);
            
            if (response.data.success) {
                setShowPaymentModal(false);
                showAlert(response.data.message, 'success');
                
                // После успешной оплаты отправляем РЕАЛЬНЫЙ запрос на подачу
                if (response.data.payment_status === 'paid') {
                    console.log('✅ Оплата прошла успешно, запрашиваем подачу');
                    await requestCarDeliveryAfterPayment();
                }
            }
        } catch (error) {
            console.error('❌ Ошибка оплаты:', error);
            showAlert('Ошибка при обработке оплаты', 'danger');
        }
        setLoading(false);
    };

    const startDeliveryTimer = () => {
        let timerInterval;
        let statusInterval;

        // Запускаем таймер обратного отсчета
        timerInterval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timerInterval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Запускаем проверку статуса
        statusInterval = setInterval(async () => {
            if (carInfo?.client_card_number) {
                try {
                    const response = await axios.get(
                        `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-sessions/by-card/${carInfo.client_card_number}`
                    );
                    
                    const newStatus = response.data.status;
                    console.log('Новый статус:', newStatus);
                    
                    setDeliveryStatus(newStatus);
                    setCarInfo(prev => ({
                        ...prev,
                        status: newStatus
                    }));
                    
                    // Если статус завершен, останавливаем все таймеры
                    if (newStatus === 'completed') {
                        clearInterval(timerInterval);
                        clearInterval(statusInterval);
                        setTimeRemaining(0);
                        setShowTimer(false);
                    }
                } catch (error) {
                    console.error('Ошибка получения статуса:', error);
                }
            }
        }, 3000);

        // Возвращаем функцию очистки
        return () => {
            clearInterval(timerInterval);
            clearInterval(statusInterval);
        };
    };

    const showAlert = (message, type) => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: '', type: 'info' }), 8000);
    };

    const getStatusText = (status) => {
        const statusMap = {
            'parked': 'На парковке',
            'return_requested': 'Запрос подачи',
            'return_accepted': 'Валет идет к авто',
            'return_started': 'Подача начата',
            'return_delivering': 'В пути',
            'completed': 'Завершено'
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'return_requested': return '#d4af37';
            case 'return_accepted': return '#f4e87c';
            case 'return_started': return '#daa520';
            case 'return_delivering': return '#ffd700';
            case 'completed': return '#ffed4a';
            default: return '#d4af37';
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const resetToStart = () => {
        setCardNumber('');
        setCarInfo(null);
        setAlert({ show: false, message: '', type: 'info' });
        setShowPaymentModal(false);
        setPaymentInfo(null);
        setShowTimerModal(false);
        setTimeRemaining(15 * 60);
        setDeliveryStatus('return_requested');
    };

    // Круговой таймер
    const CircularTimer = ({ timeRemaining, totalTime, status }) => {
        const progress = ((totalTime - timeRemaining) / totalTime) * 100;
        const circumference = 2 * Math.PI * 90; // радиус 90
        const strokeDashoffset = circumference - (progress / 100) * circumference;

        return (
            <div className="text-center" style={{ position: 'relative', display: 'inline-block' }}>
                <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
                    {/* Фоновый круг */}
                    <circle
                        cx="100"
                        cy="100"
                        r="90"
                        stroke="rgba(212, 175, 55, 0.2)"
                        strokeWidth="8"
                        fill="transparent"
                    />
                    {/* Прогресс круг */}
                    <circle
                        cx="100"
                        cy="100"
                        r="90"
                        stroke={getStatusColor(status)}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        style={{
                            transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease',
                            filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.8))'
                        }}
                    />
                </svg>
                {/* Контент по центру */}
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: 'white'
                    }}
                >
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px', color: '#d4af37' }}>
                        {formatTime(timeRemaining)}
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9, color: '#ffffff' }}>
                        {getStatusText(status)}
                    </div>
                </div>
            </div>
        );
    };

    // Упрощенная нижняя навигация - только получение автомобиля
    const MobileBottomNav = () => (
        <div style={mobileStyles.bottomNav}>
            <div 
                style={{
                    ...mobileStyles.navItem,
                    ...mobileStyles.navItemActive,
                    margin: '0 auto'
                }}
            >
                <FontAwesomeIcon icon={faIdCard} size="lg" />
                <small style={{ ...mobileStyles.text.secondary, marginTop: '6px' }}>
                    Получить автомобиль
                </small>
            </div>
        </div>
    );

    const handleNumberClick = (number) => {
        if (activeInput === 'ticket') {
            setTicket(prev => prev + number);
        } else {
            setPinCode(prev => prev + number);
        }
    };

    const handleBackspace = () => {
        if (activeInput === 'ticket') {
            setTicket(prev => prev.slice(0, -1));
        } else {
            setPinCode(prev => prev.slice(0, -1));
        }
    };

    const keypadLetters = {
        2: 'ABC',
        3: 'DEF',
        4: 'GHI',
        5: 'JKL',
        6: 'MNO',
        7: 'PQRS',
        8: 'TUV',
        9: 'WXYZ'
    };

    // Компонент таймера
    const Timer = () => {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        const totalTime = 10 * 60; // 10 минут в секундах
        const progress = ((totalTime - timeRemaining) / totalTime) * 100;

        return (
            <div style={{
                textAlign: 'center',
                padding: '20px',
                backgroundColor: 'rgba(179, 152, 122, 0.1)',
                borderRadius: '15px',
                marginTop: '20px'
            }}>
                <h3 style={{
                    color: '#B3987A',
                    marginBottom: '20px',
                    fontFamily: 'Ubuntu',
                    fontSize: '20px'
                }}>
                    Время подачи машины
                </h3>
                
                <div style={{
                    position: 'relative',
                    width: '200px',
                    height: '200px',
                    margin: '0 auto'
                }}>
                    <svg width="200" height="200" viewBox="0 0 200 200">
                        {/* Фоновый круг */}
                        <circle
                            cx="100"
                            cy="100"
                            r="90"
                            fill="none"
                            stroke="#383738"
                            strokeWidth="10"
                        />
                        {/* Прогресс */}
                        <circle
                            cx="100"
                            cy="100"
                            r="90"
                            fill="none"
                            stroke="#B3987A"
                            strokeWidth="10"
                            strokeDasharray={`${2 * Math.PI * 90}`}
                            strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
                            transform="rotate(-90 100 100)"
                            style={{ transition: 'stroke-dashoffset 1s linear' }}
                        />
                    </svg>
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '40px',
                            fontWeight: 'bold',
                            color: '#FFFFFF',
                            fontFamily: 'Ubuntu'
                        }}>
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </div>
                        <div style={{
                            fontSize: '12px',
                            color: '#B3987A',
                            marginTop: '5px'
                        }}>
                            {getStatusText(deliveryStatus)}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={mobileStyles.container}>
            <div style={mobileStyles.header}>
                <button style={mobileStyles.backButton}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                </button>
                <h1 style={mobileStyles.headerTitle}>Заявка Valet</h1>
                <div style={mobileStyles.headerIcons}>
                    <div style={mobileStyles.headerIcon}>
                        <FontAwesomeIcon icon={faPhone} />
                    </div>
                    <div style={mobileStyles.headerIcon}>
                        <FontAwesomeIcon icon={faInfoCircle} />
                    </div>
                </div>
            </div>

            <div style={mobileStyles.content}>
                <h1 style={mobileStyles.title}>Подача автомобиля</h1>

                <div style={mobileStyles.inputGroup} onClick={() => setActiveInput('ticket')}>
                    <div style={mobileStyles.inputLabel}>*Ticket</div>
                    <input
                        type="text"
                        value={ticket}
                        readOnly
                        style={mobileStyles.input}
                        placeholder="PP"
                    />
                </div>

                <div style={mobileStyles.inputGroup} onClick={() => setActiveInput('pinCode')}>
                    <div style={mobileStyles.inputLabel}>*Pin Code</div>
                    <input
                        type="text"
                        value={pinCode}
                        readOnly
                        style={mobileStyles.input}
                    />
                </div>

                {!carInfo && (
                    <div style={mobileStyles.keypadContainer}>
                        <button 
                            onClick={handleSearch}
                            disabled={loading || !ticket}
                            style={{
                                ...mobileStyles.findButton,
                                opacity: loading || !ticket ? 0.5 : 1
                            }}
                        >
                            {loading ? (
                                <>
                                    <div style={mobileStyles.loadingGradient} />
                                    <span style={{ position: 'relative', zIndex: 1 }}>Please wait...</span>
                                </>
                            ) : (
                                'Найти'
                            )}
                        </button>

                        <div style={mobileStyles.keypad}>
                            {[
                                [1, 2, 3],
                                [4, 5, 6],
                                [7, 8, 9],
                                ['', 0, 'backspace']
                            ].map((row, rowIndex) => (
                                <div key={rowIndex} style={mobileStyles.keypadRow}>
                                    {row.map((key, keyIndex) => {
                                        if (key === '') return <div key={keyIndex} />;
                                        if (key === 'backspace') {
                                            return (
                                                <button
                                                    key={keyIndex}
                                                    onClick={handleBackspace}
                                                    style={mobileStyles.keypadButton}
                                                >
                                                    <span style={mobileStyles.keypadNumber}>✕</span>
                                                </button>
                                            );
                                        }
                                        return (
                                            <button
                                                key={keyIndex}
                                                onClick={() => handleNumberClick(key)}
                                                style={mobileStyles.keypadButton}
                                            >
                                                <span style={mobileStyles.keypadNumber}>{key}</span>
                                                {keypadLetters[key] && (
                                                    <span style={mobileStyles.keypadButtonText}>
                                                        {keypadLetters[key]}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {carInfo && !showTimer && (
                    <>
                        <div style={{
                            ...mobileStyles.carInfoCard,
                            backgroundColor: 'rgba(179, 152, 122, 0.1)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(179, 152, 122, 0.2)'
                        }}>
                            <div style={{
                                ...mobileStyles.carInfoRow,
                                color: '#B3987A',
                                opacity: 1
                            }}>
                                <span>Марка автомобиля</span>
                                <span>{carInfo.carModel}</span>
                            </div>
                            <div style={{
                                ...mobileStyles.carInfoRow,
                                color: '#B3987A',
                                opacity: 1
                            }}>
                                <span>Госномер</span>
                                <span>{carInfo.carNumber}</span>
                            </div>
                            <div style={{
                                ...mobileStyles.carInfoRow,
                                color: '#B3987A',
                                opacity: 1
                            }}>
                                <span>Статус</span>
                                <span>{getStatusText(carInfo.status)}</span>
                            </div>
                            <div style={{
                                ...mobileStyles.carInfoRow,
                                color: '#B3987A',
                                opacity: 1,
                                marginBottom: 0
                            }}>
                                <span>Время на паркинге</span>
                                <span>{carInfo.parkingTime}</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleRequestCar}
                            disabled={loading || carInfo.status !== 'parked'}
                            style={{
                                ...mobileStyles.submitButton,
                                marginTop: '20px',
                                background: '#B3987A',
                                color: '#000000',
                                fontFamily: 'Ubuntu',
                                fontWeight: 500,
                                fontSize: '16px',
                                opacity: carInfo.status !== 'parked' ? 0.5 : 1
                            }}
                        >
                            {loading ? 'Подождите...' : 'Подать машину'}
                        </button>
                    </>
                )}

                {showTimer && <Timer />}
            </div>
        </div>
    );
};

export default ClientBooking; 