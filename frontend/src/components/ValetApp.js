import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Form, Alert, Row, Col, Badge, InputGroup, ListGroup, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCar, faCamera, faCheck, faTimes, faParking, faSearch, faUser, faChevronDown, faPlus, faEye } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const ValetApp = () => {
    const [sessions, setSessions] = useState([]);
    const [formData, setFormData] = useState({
        car_number: '',
        car_model: '',
        client_name: '',
        client_phone: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-sessions`);
            setSessions(response.data);
        } catch (error) {
            console.error('Ошибка загрузки сессий:', error);
            showAlert('Ошибка загрузки сессий', 'danger');
        }
    };

    // Поиск абонементов в фоновом режиме - БЕЗ открытия модального окна
    const searchSubscriptions = async (carNumber) => {
        if (carNumber.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearchLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/subscriptions/search/${carNumber}`);
            setSearchResults(response.data);
            // ВАЖНО: НЕ вызываем setShowModal(true) здесь!
        } catch (error) {
            console.error('Ошибка поиска абонементов:', error);
            setSearchResults([]);
        }
        setSearchLoading(false);
    };

    // Обработка изменения номера автомобиля
    const handleCarNumberChange = (e) => {
        const carNumber = e.target.value.toUpperCase();
        setFormData({...formData, car_number: carNumber});
        
        // Поиск абонементов БЕЗ открытия модального окна
        searchSubscriptions(carNumber);
    };

    // ЕДИНСТВЕННАЯ функция, которая может открыть модальное окно
    const handleShowSubscriptions = () => {
        console.log('Кнопка А нажата, открываем модальное окно'); // Для отладки
        setShowModal(true);
    };

    // Заполнение формы данными из абонемента
    const fillFromSubscription = (subscription) => {
        setFormData({
            ...formData,
            car_number: subscription.car_number,
            car_model: subscription.car_model || '',
            client_name: `${subscription.client_name} ${subscription.client_surname}`.trim(),
            client_phone: subscription.client_phone || '',
            client_card_number: subscription.client_card_number,
            notes: subscription.client_build && subscription.client_appartament ? 
                `Резидент: ${subscription.client_name}, Корп. ${subscription.client_build}, кв. ${subscription.client_appartament}` :
                `Резидент: ${subscription.client_name}`
        });
        setShowModal(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const sessionData = {
                ...formData,
                parking_id: 1,
                employee_id: 1
            };
            
            const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-sessions`, sessionData);
            setSessions([response.data, ...sessions]);
            
            // Очищаем форму
            setFormData({
                car_number: '',
                car_model: '',
                client_name: '',
                client_phone: '',
                notes: ''
            });
            setSearchResults([]);
            setShowModal(false); // Убеждаемся что модальное окно закрыто
            
            showAlert('Автомобиль успешно принят!', 'success');
        } catch (error) {
            console.error('Ошибка создания сессии:', error);
            let errorMessage = 'Ошибка при приеме автомобиля';
            
            if (error.response?.data) {
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data.detail) {
                    if (Array.isArray(error.response.data.detail)) {
                        errorMessage = error.response.data.detail.map(err => `${err.loc?.join(' → ')}: ${err.msg}`).join('; ');
                    } else {
                        errorMessage = error.response.data.detail;
                    }
                }
            }
            showAlert(errorMessage, 'danger');
        }
        
        setLoading(false);
    };

    const updateSessionStatus = async (sessionId, status) => {
        try {
            await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-sessions/${sessionId}`, { status });
            loadSessions();
            showAlert(`Статус обновлен на "${getStatusText(status)}"`, 'success');
        } catch (error) {
            console.error('Ошибка обновления статуса:', error);
            showAlert('Ошибка обновления статуса', 'danger');
        }
    };

    const showAlert = (message, type) => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 5000);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'created': return 'warning';
            case 'parked': return 'success';
            case 'completed': return 'secondary';
            case 'cancelled': return 'danger';
            default: return 'primary';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'created': return 'Принят';
            case 'parked': return 'Запарковано';
            case 'completed': return 'Выдан';
            case 'cancelled': return 'Отменен';
            default: return status;
        }
    };

    // Функция очистки формы
    const clearForm = () => {
        setFormData({
            car_number: '',
            car_model: '',
            client_name: '',
            client_phone: '',
            notes: ''
        });
        setSearchResults([]);
        setShowModal(false); // Закрываем модальное окно при очистке
    };

    return (
        <Container fluid className="p-3 bg-light min-vh-100">
            <div className="mb-4 text-center">
                <h2 className="text-dark mb-1">Приём автомобиля</h2>
                <p className="text-muted small">Передайте клиенту карту и заполните все данные</p>
            </div>

            {alert.show && (
                <Alert variant={alert.type} dismissible onClose={() => setAlert({...alert, show: false})}>
                    {alert.message}
                </Alert>
            )}

            <Row className="justify-content-center">
                <Col lg={6} md={8}>
                    <Card className="shadow-sm border-0">
                        <Card.Body className="p-4">
                            <Form onSubmit={handleSubmit}>
                                {/* Номер автомобиля с индикатором */}
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold text-dark">Номер автомобиля</Form.Label>
                                    <div className="position-relative">
                                        <InputGroup>
                                            <Form.Control
                                                type="text"
                                                value={formData.car_number}
                                                onChange={handleCarNumberChange}
                                                required
                                                placeholder="А777"
                                                style={{
                                                    fontSize: '1.5rem', 
                                                    fontWeight: 'bold',
                                                    textAlign: 'left',
                                                    height: '60px',
                                                    paddingLeft: '20px'
                                                }}
                                            />
                                            
                                            {/* Кнопка "А" появляется ТОЛЬКО при найденных результатах */}
                                            {searchResults.length > 0 && !searchLoading && (
                                                <Button
                                                    variant="success"
                                                    onClick={handleShowSubscriptions} // ЕДИНСТВЕННОЕ место где открывается модальное окно
                                                    style={{
                                                        width: '60px',
                                                        height: '60px',
                                                        fontSize: '1.5rem',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    А
                                                </Button>
                                            )}
                                            
                                            {/* Спиннер во время поиска */}
                                            {searchLoading && (
                                                <div 
                                                    className="d-flex align-items-center justify-content-center bg-secondary"
                                                    style={{
                                                        width: '60px',
                                                        height: '60px',
                                                        borderRadius: '0 0.375rem 0.375rem 0'
                                                    }}
                                                >
                                                    <span className="spinner-border spinner-border-sm text-white" />
                                                </div>
                                            )}
                                        </InputGroup>
                                    </div>
                                </Form.Group>

                                {/* Остальные поля остаются без изменений */}
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold text-dark">Марка и цвет автомобиля</Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            type="text"
                                            value={formData.car_model}
                                            onChange={(e) => setFormData({...formData, car_model: e.target.value})}
                                            placeholder="Audi"
                                            className="border-end-0"
                                            style={{fontSize: '1.1rem'}}
                                        />
                                        <InputGroup.Text className="bg-white border-start-0">
                                            <FontAwesomeIcon icon={faSearch} className="text-muted" />
                                        </InputGroup.Text>
                                        <div 
                                            className="border border-start-0"
                                            style={{
                                                width: '50px',
                                                backgroundColor: '#000',
                                                borderRadius: '0 0.375rem 0.375rem 0'
                                            }}
                                        />
                                    </InputGroup>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold text-dark">Имя клиента</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.client_name}
                                        onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                                        placeholder="Александр Арбузов"
                                        style={{fontSize: '1.1rem'}}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold text-dark">Телефон</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        value={formData.client_phone}
                                        onChange={(e) => setFormData({...formData, client_phone: e.target.value})}
                                        placeholder="+79989999999"
                                        style={{fontSize: '1.1rem'}}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold text-dark">Фото (минимум 4)</Form.Label>
                                    <div className="d-flex">
                                        <Button 
                                            variant="outline-secondary" 
                                            className="border-2 border-dashed"
                                            style={{
                                                width: '80px',
                                                height: '80px',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faPlus} size="2x" className="text-muted" />
                                        </Button>
                                    </div>
                                    <small className="text-muted mt-1 d-block">
                                        Нажмите для добавления фото<br/>
                                        Сделайте фото всех сторон автомобиля
                                    </small>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold text-dark">Комментарий (опционально)</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={formData.notes}
                                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                        placeholder="Состояние автомобиля, особенности..."
                                        style={{fontSize: '1rem'}}
                                    />
                                </Form.Group>

                                <div className="d-flex gap-3">
                                    <Button 
                                        variant="outline-danger"
                                        size="lg"
                                        className="flex-grow-1"
                                        style={{borderRadius: '50px'}}
                                        onClick={clearForm}
                                    >
                                        <FontAwesomeIcon icon={faTimes} className="me-2" />
                                    </Button>
                                    
                                    <Button 
                                        type="submit" 
                                        variant="success" 
                                        size="lg" 
                                        disabled={loading}
                                        className="flex-grow-1"
                                        style={{
                                            borderRadius: '50px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" />
                                                Обрабатываем...
                                            </>
                                        ) : (
                                            'Автомобиль принят'
                                        )}
                                    </Button>
                                </div>
                                
                                <div className="text-center mt-3">
                                    <small className="text-muted">Следующее действие: парковка автомобиля</small>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Модальное окно - открывается ТОЛЬКО при клике на кнопку "А" */}
            <Modal 
                show={showModal} 
                onHide={() => setShowModal(false)} 
                size="lg"
                backdrop="static" // Предотвращает закрытие по клику вне окна
            >
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title>Найдено {searchResults.length} абонемента</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{maxHeight: '70vh', overflowY: 'auto'}}>
                    {searchResults.map((sub, index) => (
                        <Card key={index} className="mb-3 border-0 shadow-sm">
                            <Card.Body>
                                <div className="mb-3">
                                    <h6 className="text-muted mb-1">РЕЗИДЕНТ</h6>
                                    <h5 className="mb-0">{sub.client_name} {sub.client_surname}, {sub.client_build}, {sub.client_appartament}</h5>
                                </div>
                                
                                <div className="mb-3">
                                    <h6 className="text-muted mb-1">АВТОМОБИЛЬ</h6>
                                    <p className="mb-0">{sub.car_model} <span className="fw-bold">{sub.car_number}</span></p>
                                </div>
                                
                                <div className="mb-3">
                                    <h6 className="text-muted mb-1">ВАЛЕТ-КАРТА</h6>
                                    <p className="mb-0">{sub.client_card_number || 'N/A'}</p>
                                </div>
                                
                                <div className="mb-3">
                                    <h6 className="text-muted mb-1">СРОК ДЕЙСТВИЯ</h6>
                                    <p className="mb-0">
                                        с {sub.start_date ? new Date(sub.start_date).toLocaleDateString('ru-RU') : 'N/A'} по {sub.end_date ? new Date(sub.end_date).toLocaleDateString('ru-RU') : 'N/A'}
                                    </p>
                                </div>
                                
                                <div className="d-grid">
                                    <Button 
                                        variant="success" 
                                        onClick={() => fillFromSubscription(sub)}
                                        size="lg"
                                    >
                                        Подставить данные
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    ))}
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default ValetApp; 