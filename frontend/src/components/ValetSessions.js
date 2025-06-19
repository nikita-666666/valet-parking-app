import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, InputGroup, Tab, Tabs, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCar, 
    faSearch, 
    faPlus, 
    faClock, 
    faMapMarkerAlt,
    faParking,
    faUser,
    faIdCard,
    faRubleSign,
    faUserTie,
    faPhoneAlt,
    faEye,
    faCheckCircle,
    faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { formatDateTime, formatLogDateTime, calculateDuration } from '../utils/dateUtils';
import api from '../services/api';
import { API_CONFIG } from '../config/api';

const ValetSessions = () => {
    const [sessions, setSessions] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('sessions');
    const [selectedSession, setSelectedSession] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [sessionLogs, setSessionLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [tariffs, setTariffs] = useState([]);
    const [sessionCosts, setSessionCosts] = useState({});
    const [loadingCosts, setLoadingCosts] = useState({});
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentSession, setPaymentSession] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSessions();
        loadEmployees();
        loadTariffs();
    }, []);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(API_CONFIG.endpoints.valetSessions);
            setSessions(response.data);
        } catch (error) {
            console.error('Ошибка при загрузке валет-сессий:', error);
            setError('Не удалось загрузить список валет-сессий');
        } finally {
            setLoading(false);
        }
    };

    const loadEmployees = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/employees`);
            setEmployees(response.data.filter(emp => emp.role?.name === 'valet' && emp.is_active));
        } catch (error) {
            console.error('Ошибка загрузки сотрудников:', error);
        }
    };

    const loadTariffs = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
            const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/parking-tariffs/`, config);
            const activeTariffs = response.data.filter(tariff => tariff.is_active);
            setTariffs(activeTariffs);
        } catch (error) {
            console.error('Ошибка загрузки тарифов:', error);
        }
    };

    const loadSessionCost = async (sessionId) => {
        if (loadingCosts[sessionId]) return;
        
        setLoadingCosts(prev => ({ ...prev, [sessionId]: true }));
        try {
            const token = localStorage.getItem('token');
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
            const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-sessions/${sessionId}/calculate-cost`, config);
            setSessionCosts(prev => ({ ...prev, [sessionId]: response.data }));
        } catch (error) {
            console.error('Ошибка расчета стоимости:', error);
            setSessionCosts(prev => ({ ...prev, [sessionId]: { cost: 0, message: 'Ошибка расчета' } }));
        } finally {
            setLoadingCosts(prev => ({ ...prev, [sessionId]: false }));
        }
    };

    const updateSessionTariff = async (sessionId, tariffId) => {
        try {
            const token = localStorage.getItem('token');
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
            await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-sessions/${sessionId}/tariff?tariff_id=${tariffId}`, {}, config);
            // Перезагружаем сессии и стоимость
            fetchSessions();
            loadSessionCost(sessionId);
        } catch (error) {
            console.error('Ошибка обновления тарифа:', error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'created': return 'secondary';
            case 'car_accepted': return 'dark';
            case 'en_route': return 'secondary';
            case 'parked': return 'dark';
            case 'return_requested': return 'outline-dark';
            case 'return_accepted': return 'warning';
            case 'return_started': return 'info';
            case 'return_delivering': return 'primary';
            case 'completed': return 'success';
            case 'cancelled': return 'secondary';
            default: return 'outline-secondary';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'created': return 'Создан';
            case 'car_accepted': return 'Принят';
            case 'en_route': return 'В пути на парковку';
            case 'parked': return 'Припаркован';
            case 'return_requested': return 'Запрошена подача';
            case 'return_accepted': return 'Запрос принят';
            case 'return_started': return 'Подача начата';
            case 'return_delivering': return 'Подается';
            case 'completed': return 'Выдан';
            case 'cancelled': return 'Отменен';
            default: return status;
        }
    };

    const updateSessionStatus = async (sessionId, newStatus, employeeId = null) => {
        try {
            const updateData = { status: newStatus };
            if (employeeId) {
                updateData.employee_id = employeeId;
            }
            
            await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-sessions/${sessionId}`, updateData);
            fetchSessions();
        } catch (error) {
            console.error('Ошибка обновления статуса:', error);
        }
    };

    const assignEmployee = async (sessionId, employeeId) => {
        await updateSessionStatus(sessionId, 'returning', employeeId);
        setShowAssignModal(false);
        setSelectedSession(null);
    };

    const openSessionDetail = async (session) => {
        setSelectedSession(session);
        setShowDetailModal(true);
        await loadSessionLogs(session.id);
    };

    const loadSessionLogs = async (sessionId) => {
        setLoadingLogs(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-sessions/${sessionId}/logs`);
            setSessionLogs(response.data);
        } catch (error) {
            console.error('Ошибка загрузки логов:', error);
            // В случае ошибки показываем базовые логи на основе текущей сессии
            const session = selectedSession;
            const employeeName = getEmployeeName(session?.employee_id) || 'Неизвестный сотрудник';
            
            const mockLogs = [
                {
                    id: 1,
                    action: 'created',
                    description: 'Валет-сессия создана',
                    employee_name: employeeName,
                    timestamp: session?.created_at || new Date().toISOString(),
                    details: 'Ответственный за приём'
                }
            ];
            
            if (session?.status !== 'created') {
                mockLogs.push({
                    id: 2,
                    action: 'car_accepted',
                    description: 'Принял автомобиль',
                    employee_name: employeeName,
                    timestamp: session?.updated_at || session?.created_at || new Date().toISOString(),
                    details: 'Тариф: Valet Гостевой'
                });
            }
            
            setSessionLogs(mockLogs);
        }
        setLoadingLogs(false);
    };

    const getCarColor = (carModel) => {
        if (carModel?.toLowerCase().includes('bmw')) return '#1e90ff';
        if (carModel?.toLowerCase().includes('mercedes')) return '#333333';
        if (carModel?.toLowerCase().includes('audi')) return '#ff4444';
        if (carModel?.toLowerCase().includes('porsche')) return '#ff8800';
        if (carModel?.toLowerCase().includes('land rover') || carModel?.toLowerCase().includes('range rover')) return '#228B22';
        return '#666666';
    };

    const getEmployeeName = (employeeId) => {
        const employee = employees.find(emp => emp.id === employeeId);
        return employee ? employee.full_name : 'Не назначен';
    };

    const openPhoto = (photo) => {
        setSelectedPhoto(photo);
        setShowPhotoModal(true);
    };

    const requestCarReturn = async (cardNumber) => {
        try {
            const token = localStorage.getItem('token');
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-sessions/request-return/${cardNumber}`, 
                {}, 
                config
            );
            
            if (response.data.requires_payment) {
                // Нужна оплата - открываем модальное окно
                const session = sessions.find(s => s.id === response.data.session_id);
                setPaymentSession({
                    ...session,
                    total_cost: response.data.total_cost,
                    paid_amount: response.data.paid_amount,
                    remaining_amount: response.data.remaining_amount
                });
                setPaymentAmount(response.data.remaining_amount.toString());
                setShowPaymentModal(true);
                return;
            }
            
            if (response.data.success) {
                alert(`Подача автомобиля ${response.data.car_number} запрошена`);
                fetchSessions(); // Обновляем список
            }
        } catch (error) {
            console.error('Ошибка запроса подачи:', error);
            alert('Ошибка при запросе подачи автомобиля');
        }
    };

    const processPayment = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
            
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-sessions/${paymentSession.id}/payment`,
                {
                    payment_method: paymentMethod,
                    amount: parseFloat(paymentAmount)
                },
                config
            );
            
            if (response.data.success) {
                alert(response.data.message);
                setShowPaymentModal(false);
                setPaymentSession(null);
                fetchSessions(); // Обновляем список
                
                // Если оплачено полностью, можем сразу запросить подачу
                if (response.data.payment_status === 'paid') {
                    requestCarReturn(paymentSession.client_card_number);
                }
            }
        } catch (error) {
            console.error('Ошибка оплаты:', error);
            alert('Ошибка при обработке оплаты');
        }
    };

    const SessionCostDisplay = ({ session }) => {
        useEffect(() => {
            // Не рассчитываем стоимость для завершенных сессий, если она уже есть
            if (session.status === 'completed' && session.calculated_cost) {
                return;
            }
            
            if (session.id && !sessionCosts[session.id] && !loadingCosts[session.id]) {
                loadSessionCost(session.id);
            }
        }, [session.id]);

        const cost = sessionCosts[session.id];
        const loading = loadingCosts[session.id];

        if (loading) {
            return <div className="small text-muted">Расчет...</div>;
        }

        if (!cost) {
            return null;
        }

        if (cost.message && cost.cost === 0) {
            return <div className="small text-muted">{cost.message}</div>;
        }

        const calculation = cost.calculation || {};
        const totalCost = calculation.total_cost || cost.cost || 0;
        const durationHours = calculation.duration_hours || 0;
        const billableHours = calculation.billable_hours || 0;

        return (
            <div className="small">
                <div className="d-flex align-items-center fw-bold">
                    <FontAwesomeIcon icon={faRubleSign} className="me-1" />
                    {totalCost}₽
                </div>
                {durationHours > 0 && (
                    <div className="text-muted" style={{fontSize: '0.7rem'}}>
                        {Math.floor(durationHours)}ч {Math.round((durationHours % 1) * 60)}м
                    </div>
                )}
            </div>
        );
    };

    const renderPhotos = (photos, title, placeholderCount = 0) => {
        if (!photos || photos.length === 0) {
            if (placeholderCount === 0) return null;
            
            return (
                <div className="mb-4">
                    <h6 className="text-muted mb-3">{title}</h6>
                    <div className="d-flex flex-wrap gap-2">
                        {Array.from({length: placeholderCount}).map((_, index) => (
                            <div
                                key={index}
                                className="border border-dashed rounded d-flex align-items-center justify-content-center"
                                style={{
                                    width: '80px',
                                    height: '60px',
                                    backgroundColor: '#f8f9fa'
                                }}
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-muted" />
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="mb-4">
                <h6 className="text-muted mb-3">{title} ({photos.length})</h6>
                <div className="d-flex flex-wrap gap-2">
                    {photos.map((photo, index) => (
                        <div
                            key={photo.id || index}
                            className="border rounded position-relative"
                            style={{
                                width: '80px',
                                height: '60px',
                                cursor: 'pointer',
                                overflow: 'hidden'
                            }}
                            onClick={() => openPhoto(photo)}
                        >
                            <img
                                src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${photo.url}`}
                                alt={`${title} ${index + 1}`}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                            <div
                                className="position-absolute top-0 start-0 bg-dark text-white d-flex align-items-center justify-content-center"
                                style={{
                                    width: '20px',
                                    height: '16px',
                                    fontSize: '10px'
                                }}
                            >
                                {index + 1}
                            </div>
                        </div>
                    ))}
                    
                    {/* Кнопка добавления (заглушка для дизайна) */}
                    <div
                        className="border border-dashed rounded d-flex align-items-center justify-content-center"
                        style={{
                            width: '80px',
                            height: '60px',
                            backgroundColor: '#f8f9fa'
                        }}
                    >
                        <FontAwesomeIcon icon={faPlus} className="text-muted" />
                    </div>
                </div>
            </div>
        );
    };

    const filteredSessions = sessions.filter(session =>
        session.car_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.car_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const allSessions = filteredSessions.filter(session => 
        ['created', 'car_accepted', 'en_route', 'parked', 'completed'].includes(session.status)
    );
    
    const returnRequests = filteredSessions.filter(session => 
        ['return_requested', 'return_accepted', 'return_started', 'return_delivering'].includes(session.status)
    );

    const renderSessionCard = (session, showReturnActions = false) => (
        <Card 
            key={session.id} 
            className={`mb-3 border-0 shadow-sm ${session.status === 'completed' ? 'opacity-75' : ''}`} 
            style={{
                cursor: 'pointer',
                backgroundColor: session.status === 'completed' ? '#f8f9fa' : 'white'
            }} 
            onClick={() => openSessionDetail(session)}
        >
            <Card.Body>
                <Row className="align-items-center">
                    {/* Фото автомобиля */}
                    <Col xs={2} md={1}>
                        <div 
                            className="rounded"
                            style={{
                                width: '60px',
                                height: '60px',
                                backgroundColor: '#f8f9fa',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid #e9ecef',
                                overflow: 'hidden'
                            }}
                        >
                            {session.photos && session.photos.length > 0 ? (
                                <img
                                    src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${session.photos[0].url}`}
                                    alt={`${session.car_number}`}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                    onError={(e) => {
                                        // Fallback к иконке если фото не загружается
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div 
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    display: session.photos && session.photos.length > 0 ? 'none' : 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <FontAwesomeIcon 
                                    icon={faCar} 
                                    size="2x" 
                                    style={{color: getCarColor(session.car_model)}}
                                />
                            </div>
                        </div>
                    </Col>

                    {/* Информация об автомобиле */}
                    <Col xs={6} md={3}>
                        <div>
                            <h5 className="mb-1 d-flex align-items-center">
                                {session.car_number}
                                {session.has_subscription && (
                                    <Badge bg="success" className="ms-2" style={{fontSize: '10px'}}>
                                        Резидент
                                    </Badge>
                                )}
                                <div 
                                    className="ms-2 rounded"
                                    style={{
                                        width: '12px',
                                        height: '12px',
                                        backgroundColor: getCarColor(session.car_model)
                                    }}
                                />
                                <span className="ms-2 text-muted fs-6">
                                    {session.car_model}
                                </span>
                            </h5>
                            <div className="d-flex align-items-center text-muted small">
                                <FontAwesomeIcon icon={faIdCard} className="me-1" />
                                {session.client_card_number || session.session_number}
                                <FontAwesomeIcon icon={faClock} className="ms-3 me-1" />
                                {formatDateTime(session.created_at)}
                            </div>
                            {session.has_subscription && (
                                <div className="small text-success">
                                    <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                                    Бесплатная парковка
                                </div>
                            )}
                        </div>
                    </Col>

                    {/* Локация */}
                    <Col xs={4} md={2}>
                        <div className="d-flex align-items-center">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-muted" />
                            <div>
                                <div className="small text-muted">Жилой Квартал Prime Park</div>
                                {session.parking_spot && (
                                    <div className="small">{session.parking_spot}</div>
                                )}
                                {session.parking_card && (
                                    <div className="small text-info">Карта: {session.parking_card}</div>
                                )}
                            </div>
                        </div>
                    </Col>

                    {/* Клиент и статус */}
                    <Col md={3} className="d-none d-md-block">
                        {session.client_name && (
                            <div className="d-flex align-items-center text-muted small mb-1">
                                <FontAwesomeIcon icon={faUser} className="me-2" />
                                {session.client_name}
                            </div>
                        )}
                                                    {showReturnActions && session.employee_id && (
                            <div className="d-flex align-items-center text-muted small mb-1">
                                <FontAwesomeIcon icon={faUserTie} className="me-2" />
                                На подачу назначен {getEmployeeName(session.employee_id)}
                            </div>
                        )}
                        {session.notes && (
                            <div className="small text-muted text-truncate">
                                {session.notes}
                            </div>
                        )}
                    </Col>

                    {/* Статус и действия */}
                    <Col xs={12} md={3} className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-2 flex-wrap">
                            <div className="text-end">
                                <Badge 
                                    bg={getStatusColor(session.status)}
                                    className="px-3 py-2 rounded-pill d-block mb-1"
                                    style={{fontSize: '0.875rem'}}
                                >
                                    {getStatusText(session.status)}
                                </Badge>
                                <SessionCostDisplay session={session} />
                            </div>
                            
                            {/* Кнопки действий */}
                            {showReturnActions && session.status === 'return_requested' && (
                                <Button
                                    size="sm"
                                    variant="success"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedSession(session);
                                        setShowAssignModal(true);
                                    }}
                                >
                                    Назначить ответственный
                                </Button>
                            )}
                            
                            {showReturnActions && session.status === 'returning' && (
                                <Button
                                    size="sm"
                                    variant="outline-success"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        updateSessionStatus(session.id, 'completed');
                                    }}
                                >
                                    Подтвердить выдачу
                                </Button>
                            )}
                            
                            {!showReturnActions && session.status === 'created' && (
                                <Button
                                    size="sm"
                                    variant="outline-success"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        updateSessionStatus(session.id, 'car_accepted');
                                    }}
                                >
                                    Принять
                                </Button>
                            )}
                            
                            {!showReturnActions && session.status === 'car_accepted' && (
                                <Button
                                    size="sm"
                                    variant="outline-warning"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        updateSessionStatus(session.id, 'en_route');
                                    }}
                                >
                                    В путь
                                </Button>
                            )}
                            
                            {!showReturnActions && session.status === 'en_route' && (
                                <Button
                                    size="sm"
                                    variant="outline-success"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        updateSessionStatus(session.id, 'parked');
                                    }}
                                >
                                    Припарковать
                                </Button>
                            )}
                            
                            {!showReturnActions && session.status === 'parked' && (
                                <Button
                                    size="sm"
                                    variant="outline-primary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        requestCarReturn(session.client_card_number);
                                    }}
                                >
                                    Запросить подачу
                                </Button>
                            )}
                        </div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Загрузка...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger" role="alert">
                {error}
            </div>
        );
    }

    return (
        <div style={{backgroundColor: '#f8f9fa', minHeight: '100vh'}}>
            <Container className="py-4" style={{maxWidth: '1200px'}}>
                <div className="mb-4">
                    <h1 className="mb-0" style={{color: '#2c3e50'}}>Валет-сессии</h1>
                </div>

                <Tabs activeKey={activeTab} onSelect={(tab) => setActiveTab(tab)} className="mb-4">
                    <Tab eventKey="sessions" title="Сессии">
                        <div className="mb-3">
                            <InputGroup style={{maxWidth: '400px'}}>
                                <InputGroup.Text>
                                    <FontAwesomeIcon icon={faSearch} />
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Поиск сессии"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </div>

                        <div className="space-y-3">
                            {allSessions.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <FontAwesomeIcon icon={faCar} size="3x" className="mb-3 opacity-50" />
                                    <p>Нет сессий</p>
                                </div>
                            ) : (
                                allSessions.map((session) => renderSessionCard(session, false))
                            )}
                        </div>
                    </Tab>
                    
                    <Tab eventKey="requests" title={`Запросы ${returnRequests.length > 0 ? `(${returnRequests.length})` : ''}`}>
                        <div className="mb-3">
                            <InputGroup style={{maxWidth: '400px'}}>
                                <InputGroup.Text>
                                    <FontAwesomeIcon icon={faSearch} />
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Поиск запроса"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </div>

                        <div className="space-y-3">
                            {returnRequests.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <FontAwesomeIcon icon={faArrowRight} size="3x" className="mb-3 opacity-50" />
                                    <p>Нет запросов на подачу автомобилей</p>
                                </div>
                            ) : (
                                returnRequests.map((session) => renderSessionCard(session, true))
                            )}
                        </div>
                    </Tab>
                </Tabs>

                {/* Модальное окно назначения сотрудника */}
                <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Назначить ответственного</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {selectedSession && (
                            <>
                                <div className="mb-3">
                                    <h6>Автомобиль: {selectedSession.car_number} ({selectedSession.car_model})</h6>
                                    <p className="text-muted">Карта: {selectedSession.client_card_number}</p>
                                </div>
                                
                                <div className="mb-3">
                                    <Form.Label>Выберите валета для подачи:</Form.Label>
                                    <div className="d-grid gap-2">
                                        {employees.map((employee) => (
                                            <Button
                                                key={employee.id}
                                                variant="outline-primary"
                                                className="text-start d-flex align-items-center"
                                                onClick={() => assignEmployee(selectedSession.id, employee.id)}
                                            >
                                                <FontAwesomeIcon icon={faUserTie} className="me-3" />
                                                <div>
                                                    <div>{employee.full_name}</div>
                                                    <small className="text-muted">{employee.email}</small>
                                                </div>
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
                            Отмена
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Модальное окно детальной информации о сессии */}
                <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="xl" centered>
                    <Modal.Header closeButton>
                        <Modal.Title>
                            Валет сессия ID {selectedSession?.id}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{maxHeight: '80vh', overflowY: 'auto'}}>
                        {selectedSession && (
                            <Row>
                                {/* Основная информация */}
                                <Col md={8}>
                                    <div className="mb-4">
                                        <h6 className="text-muted mb-3">Основные</h6>
                                        
                                        <Card className="border-0 bg-light mb-3">
                                            <Card.Body>
                                                <h6>Детали сессии</h6>
                                                <Row>
                                                    <Col md={6}>
                                                        <div className="mb-2">
                                                            <strong>Номер:</strong> {selectedSession.car_number}
                                                        </div>
                                                        <div className="mb-2">
                                                            <strong>Марка и цвет:</strong> {selectedSession.car_model}
                                                            <span 
                                                                className="ms-2 rounded"
                                                                style={{
                                                                    display: 'inline-block',
                                                                    width: '16px',
                                                                    height: '16px',
                                                                    backgroundColor: getCarColor(selectedSession.car_model)
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="mb-2">
                                                            <strong>ID валет-карты:</strong> {selectedSession.client_card_number}
                                                        </div>
                                                        <div className="mb-2">
                                                            <strong>Тип клиента:</strong> 
                                                            {selectedSession.has_subscription ? (
                                                                <Badge bg="success" className="ms-2">
                                                                    <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                                                                    Резидент (Бесплатно)
                                                                </Badge>
                                                            ) : (
                                                                <Badge bg="warning" className="ms-2">
                                                                    Гостевой (Почасовой тариф)
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </Col>
                                                    <Col md={6}>
                                                        <div className="mb-2">
                                                            <strong>Парковочная карта:</strong> {selectedSession.parking_card || 'Не указана'}
                                                        </div>
                                                        <div className="mb-2">
                                                            <strong>Парковочное место:</strong> {selectedSession.parking_spot || 'Не указано'}
                                                        </div>
                                                        <div className="mb-2">
                                                            <strong>Комментарий:</strong> {selectedSession.notes || '-'}
                                                        </div>
                                                    </Col>
                                                </Row>
                                                <Row className="mt-3">
                                                    <Col md={6}>
                                                        <div className="mb-2">
                                                            <strong>Тариф:</strong> 
                                                            <Form.Select 
                                                                size="sm" 
                                                                className="mt-1"
                                                                value={selectedSession.tariff_id || ''}
                                                                onChange={(e) => {
                                                                    if (e.target.value) {
                                                                        updateSessionTariff(selectedSession.id, parseInt(e.target.value));
                                                                    }
                                                                }}
                                                            >
                                                                <option value="">Выберите тариф</option>
                                                                {tariffs.length === 0 ? (
                                                                    <option disabled>Тарифы загружаются...</option>
                                                                ) : (
                                                                    tariffs.map(tariff => (
                                                                        <option key={tariff.id} value={tariff.id}>
                                                                            {tariff.name} ({tariff.tariff_type})
                                                                        </option>
                                                                    ))
                                                                )}
                                                            </Form.Select>

                                                        </div>
                                                    </Col>
                                                    <Col md={6}>
                                                                                                <div className="mb-2">
                                            <strong>Длительность:</strong> {calculateDuration(selectedSession.created_at, selectedSession.status === 'completed' ? selectedSession.updated_at : null)}
                                            <div className="small text-muted">
                                                Создано: {selectedSession.created_at}<br/>
                                                Обновлено: {selectedSession.updated_at || 'текущее время'}
                                            </div>
                                        </div>
                                                                                                <div className="mb-2">
                                            <strong>Стоимость:</strong> 
                                            <div className="mt-1">
                                                <SessionCostDisplay session={selectedSession} />
                                            </div>
                                        </div>
                                        {selectedSession.payment_status && selectedSession.calculated_cost > 0 && (
                                            <div className="mb-2">
                                                <strong>Оплата:</strong>
                                                <div className="mt-1">
                                                    <div className="small">
                                                        Оплачено: {selectedSession.paid_amount || 0}₽ из {selectedSession.calculated_cost}₽
                                                    </div>
                                                    {selectedSession.payment_method && (
                                                        <div className="small text-muted">
                                                            Способ: {selectedSession.payment_method}
                                                        </div>
                                                    )}
                                                    {selectedSession.payment_date && (
                                                        <div className="small text-muted">
                                                            Дата: {formatDateTime(selectedSession.payment_date)}
                                                        </div>
                                                    )}
                                                    {selectedSession.payment_reference && (
                                                        <div className="small text-muted">
                                                            Номер: {selectedSession.payment_reference}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                                    </Col>
                                                </Row>
                                            </Card.Body>
                                        </Card>

                                        {/* Статус */}
                                        <div className="d-flex align-items-center mb-3">
                                            <span className="me-3"><strong>Статус:</strong></span>
                                            <Form.Select style={{maxWidth: '300px'}}>
                                                <option>{getStatusText(selectedSession.status)}</option>
                                            </Form.Select>
                                        </div>

                                        {/* Данные сессии */}
                                        <h6 className="text-muted mb-3">Данные сессии</h6>
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <div><strong>Дата и время принятия:</strong></div>
                                                <div>{formatDateTime(selectedSession.created_at)}</div>
                                            </Col>
                                            <Col md={6}>
                                                <div><strong>Валет ведущий сессию:</strong></div>
                                                <div>{selectedSession.employee ? selectedSession.employee.full_name : 'Не назначен'}</div>
                                            </Col>
                                        </Row>
                                        {selectedSession.request_accepted_by && (
                                            <Row className="mb-3">
                                                <Col md={12}>
                                                    <div><strong>Валет принявший запрос:</strong></div>
                                                    <div>{selectedSession.request_accepted_by.full_name}</div>
                                                </Col>
                                            </Row>
                                        )}

                                        {/* Фотографии по этапам */}
                                        {renderPhotos(selectedSession.photos, "Фото при приеме", 4)}
                                        {renderPhotos(selectedSession.parking_photos, "Фото с парковки", 2)}
                                        {renderPhotos(selectedSession.return_start_photos, "Фото перед подачей")}
                                        {renderPhotos(selectedSession.return_delivery_photos, "Фото подачи клиенту")}

                                        {/* Подача */}
                                        <h6 className="text-muted mb-3">Подача</h6>
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Подать к</Form.Label>
                                                    <Form.Control type="datetime-local" />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Выдано клиенту</Form.Label>
                                                    <Form.Control type="datetime-local" />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Валет</Form.Label>
                                                    <Form.Select>
                                                        <option>Выберите валета</option>
                                                        {employees.map((employee) => (
                                                            <option key={employee.id} value={employee.id}>
                                                                {employee.full_name}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </div>
                                </Col>

                                {/* Лог событий */}
                                <Col md={4}>
                                    <div className="border-start ps-4">
                                        <h6 className="text-muted mb-3">Лог событий</h6>
                                        
                                        {loadingLogs ? (
                                            <div className="text-center py-3">
                                                <div className="spinner-border spinner-border-sm" />
                                            </div>
                                        ) : (
                                            <div className="timeline">
                                                {sessionLogs.map((log, index) => (
                                                    <div key={log.id} className="timeline-item mb-3">
                                                        <div className="d-flex">
                                                            <div className="me-3">
                                                                <div 
                                                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                                                    style={{
                                                                        width: '24px',
                                                                        height: '24px',
                                                                        backgroundColor: log.action === 'created' ? '#6c757d' : 
                                                                               log.action === 'car_accepted' ? '#0d6efd' :
                                                                               log.action === 'parked' ? '#198754' : '#ffc107',
                                                                        fontSize: '12px'
                                                                    }}
                                                                >
                                                                    {log.action === 'created' && '✓'}
                                                                    {log.action === 'car_accepted' && '🚗'}
                                                                    {log.action === 'photo_added' && '📷'}
                                                                    {log.action === 'parked' && '🅿️'}
                                                                </div>
                                                                {index < sessionLogs.length - 1 && (
                                                                    <div 
                                                                        className="bg-secondary"
                                                                        style={{
                                                                            width: '2px',
                                                                            height: '40px',
                                                                            marginLeft: '11px',
                                                                            marginTop: '4px'
                                                                        }}
                                                                    />
                                                                )}
                                                            </div>
                                                            <div className="flex-grow-1">
                                                                <div className="fw-semibold">{log.employee_name}</div>
                                                                <div className="small text-muted mb-1">
                                                                    {formatLogDateTime(log.timestamp)}
                                                                </div>
                                                                <div className="small">{log.description}</div>
                                                                {log.details && (
                                                                    <div className="small text-muted">{log.details}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Col>
                            </Row>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="dark">
                            Обновить
                        </Button>
                        <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                            Отмена
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Модальное окно для просмотра фото */}
                <Modal show={showPhotoModal} onHide={() => setShowPhotoModal(false)} size="lg" centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Просмотр фото</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="text-center p-0">
                        {selectedPhoto && (
                            <>
                                <img 
                                    src={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${selectedPhoto.url}`} 
                                    alt="Фото автомобиля"
                                    style={{
                                        width: '100%',
                                        maxHeight: '70vh',
                                        objectFit: 'contain'
                                    }}
                                />
                                <div className="p-3 text-muted small border-top">
                                    <Row>
                                        <Col md={6}>
                                            <div><strong>Время:</strong> {selectedPhoto.timestamp ? new Date(selectedPhoto.timestamp).toLocaleString('ru-RU') : 'Неизвестно'}</div>
                                            {selectedPhoto.name && <div><strong>Файл:</strong> {selectedPhoto.name}</div>}
                                        </Col>
                                        <Col md={6}>
                                            {selectedPhoto.size && <div><strong>Размер:</strong> {(selectedPhoto.size / 1024 / 1024).toFixed(2)} MB</div>}
                                            {selectedPhoto.type && <div><strong>Тип:</strong> {selectedPhoto.type}</div>}
                                            {selectedPhoto.category && <div><strong>Категория:</strong> {selectedPhoto.category}</div>}
                                        </Col>
                                    </Row>
                                </div>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowPhotoModal(false)}>
                            Закрыть
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Модальное окно оплаты */}
                <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Оплата парковки</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {paymentSession && (
                            <>
                                <div className="mb-3">
                                    <h6>Автомобиль: {paymentSession.car_number} ({paymentSession.car_model})</h6>
                                    <p className="text-muted">Карта: {paymentSession.client_card_number}</p>
                                </div>
                                
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between">
                                        <span>Общая стоимость:</span>
                                        <strong>{paymentSession.total_cost}₽</strong>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span>Уже оплачено:</span>
                                        <span>{paymentSession.paid_amount}₽</span>
                                    </div>
                                    <hr />
                                    <div className="d-flex justify-content-between">
                                        <span><strong>К доплате:</strong></span>
                                        <strong className="text-danger">{paymentSession.remaining_amount}₽</strong>
                                    </div>
                                </div>
                                
                                <div className="mb-3">
                                    <Form.Label>Способ оплаты:</Form.Label>
                                    <Form.Select 
                                        value={paymentMethod} 
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    >
                                        <option value="cash">Наличные</option>
                                        <option value="card">Банковская карта</option>
                                        <option value="online">Онлайн-платеж</option>
                                        <option value="transfer">Безналичный перевод</option>
                                    </Form.Select>
                                </div>
                                
                                <div className="mb-3">
                                    <Form.Label>Сумма к оплате:</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={paymentSession.remaining_amount}
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                    />
                                    <Form.Text className="text-muted">
                                        Максимум: {paymentSession.remaining_amount}₽
                                    </Form.Text>
                                </div>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
                            Отмена
                        </Button>
                        <Button 
                            variant="success" 
                            onClick={processPayment}
                            disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                        >
                            Оплатить {paymentAmount}₽
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Container>
        </div>
    );
};

export default ValetSessions; 