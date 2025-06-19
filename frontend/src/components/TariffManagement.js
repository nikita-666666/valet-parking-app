import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Badge, Alert, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faPlus, 
    faEdit, 
    faTrash, 
    faDollarSign, 
    faClock, 
    faUsers,
    faUserTie,
    faToggleOn,
    faToggleOff,
    faCalculator,
    faCopy,
    faCheck,
    faTimes
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const TariffManagement = ({ parkingId = 1 }) => {
    const [tariffs, setTariffs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTariff, setEditingTariff] = useState(null);
    const [showCalculatorModal, setShowCalculatorModal] = useState(false);
    const [calculatorData, setCalculatorData] = useState({
        tariffId: null,
        hours: 1,
        hasSubscription: false
    });
    const [calculationResult, setCalculationResult] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        tariff_type: 'hourly',
        price_per_hour: 0,
        price_per_day: 0,
        minimum_hours: 1,
        maximum_hours: '',
        free_minutes: 0,
        is_active: true,
        is_default_for_residents: false,
        is_default_for_guests: false
    });

    const tariffTypes = [
        { value: 'free', label: 'Бесплатный' },
        { value: 'hourly', label: 'Почасовой' },
        { value: 'daily', label: 'Суточный' },
        { value: 'vip', label: 'VIP' }
    ];

    useEffect(() => {
        loadTariffs();
    }, [parkingId]);

    const loadTariffs = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/parking-tariffs/?parking_id=${parkingId}&active_only=false`);
            setTariffs(response.data);
        } catch (error) {
            console.error('Ошибка загрузки тарифов:', error);
            showAlert('Ошибка загрузки тарифов', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (message, type) => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 5000);
    };

    const getTariffTypeInfo = (type) => {
        return tariffTypes.find(t => t.value === type) || { label: type };
    };

    const openCreateModal = () => {
        setEditingTariff(null);
        setFormData({
            name: '',
            description: '',
            tariff_type: 'hourly',
            price_per_hour: 0,
            price_per_day: 0,
            minimum_hours: 1,
            maximum_hours: '',
            free_minutes: 0,
            is_active: true,
            is_default_for_residents: false,
            is_default_for_guests: false
        });
        setShowModal(true);
    };

    const openEditModal = (tariff) => {
        setEditingTariff(tariff);
        setFormData({
            name: tariff.name,
            description: tariff.description || '',
            tariff_type: tariff.tariff_type,
            price_per_hour: tariff.price_per_hour,
            price_per_day: tariff.price_per_day || 0,
            minimum_hours: tariff.minimum_hours,
            maximum_hours: tariff.maximum_hours || '',
            free_minutes: tariff.free_minutes,
            is_active: tariff.is_active,
            is_default_for_residents: tariff.is_default_for_residents,
            is_default_for_guests: tariff.is_default_for_guests
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                parking_id: parkingId,
                maximum_hours: formData.maximum_hours || null
            };

            if (editingTariff) {
                await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/parking-tariffs/${editingTariff.id}`, payload);
                showAlert('Тариф успешно обновлен', 'success');
            } else {
                await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/parking-tariffs/`, payload);
                showAlert('Тариф успешно создан', 'success');
            }
            
            setShowModal(false);
            loadTariffs();
        } catch (error) {
            console.error('Ошибка сохранения тарифа:', error);
            showAlert('Ошибка сохранения тарифа', 'danger');
        }
    };

    const deleteTariff = async (tariffId) => {
        if (window.confirm('Вы уверены, что хотите удалить этот тариф?')) {
            try {
                await axios.delete(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/parking-tariffs/${tariffId}`);
                showAlert('Тариф успешно удален', 'success');
                loadTariffs();
            } catch (error) {
                console.error('Ошибка удаления тарифа:', error);
                showAlert('Ошибка удаления тарифа', 'danger');
            }
        }
    };

    const setAsDefault = async (tariffId, forResidents) => {
        try {
            const endpoint = forResidents ? 'set-default-residents' : 'set-default-guests';
            await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/parking-tariffs/${tariffId}/${endpoint}`);
            showAlert(`Тариф установлен как тариф по умолчанию для ${forResidents ? 'резидентов' : 'гостей'}`, 'success');
            loadTariffs();
        } catch (error) {
            console.error('Ошибка установки тарифа по умолчанию:', error);
            showAlert('Ошибка установки тарифа по умолчанию', 'danger');
        }
    };

    const openCalculator = (tariff) => {
        setCalculatorData({
            tariffId: tariff.id,
            hours: 1,
            hasSubscription: false
        });
        setCalculationResult(null);
        setShowCalculatorModal(true);
    };

    const calculateCost = async () => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/parking-tariffs/calculate`, {
                tariff_id: calculatorData.tariffId,
                duration_hours: calculatorData.hours,
                has_subscription: calculatorData.hasSubscription
            });
            setCalculationResult(response.data);
        } catch (error) {
            console.error('Ошибка расчета стоимости:', error);
            showAlert('Ошибка расчета стоимости', 'danger');
        }
    };

    const duplicateTariff = async (tariff) => {
        const newTariff = {
            ...tariff,
            name: `${tariff.name} (копия)`,
            is_default_for_residents: false,
            is_default_for_guests: false,
            parking_id: parkingId
        };
        delete newTariff.id;
        delete newTariff.created_at;
        delete newTariff.updated_at;

        try {
            await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/parking-tariffs/`, newTariff);
            showAlert('Тариф успешно скопирован', 'success');
            loadTariffs();
        } catch (error) {
            console.error('Ошибка копирования тарифа:', error);
            showAlert('Ошибка копирования тарифа', 'danger');
        }
    };

    return (
        <div style={{backgroundColor: '#f8f9fa', minHeight: '100vh'}}>
            <Container className="py-4" style={{maxWidth: '1200px'}}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="mb-0" style={{color: '#2c3e50'}}>Тарифы</h1>
                    <Button variant="outline-primary" onClick={openCreateModal}>
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        Добавить тариф
                    </Button>
                </div>

                {alert.show && (
                    <Alert variant={alert.type} className="mb-3">
                        {alert.message}
                    </Alert>
                )}

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Загрузка...</span>
                        </div>
                    </div>
                ) : (
                    <Row>
                        {tariffs.map((tariff) => {
                            const typeInfo = getTariffTypeInfo(tariff.tariff_type);
                            return (
                                <Col md={6} lg={4} key={tariff.id} className="mb-4">
                                    <Card className={`h-100 border ${!tariff.is_active ? 'opacity-75' : ''}`} style={{borderColor: '#e9ecef'}}>
                                        <Card.Body className="p-3">
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <div>
                                                    <h6 className="mb-1" style={{color: '#2c3e50'}}>{tariff.name}</h6>
                                                    <small className="text-muted">{typeInfo.label}</small>
                                                </div>
                                                <div className="d-flex gap-1">
                                                    {tariff.is_default_for_residents && (
                                                        <Badge bg="light" text="dark" className="border">Резиденты</Badge>
                                                    )}
                                                    {tariff.is_default_for_guests && (
                                                        <Badge bg="light" text="dark" className="border">Гости</Badge>
                                                    )}
                                                    <FontAwesomeIcon 
                                                        icon={tariff.is_active ? faToggleOn : faToggleOff}
                                                        className={tariff.is_active ? 'text-success' : 'text-muted'}
                                                        size="lg"
                                                    />
                                                </div>
                                            </div>
                                            
                                            {tariff.description && (
                                                <p className="text-muted small mb-3">{tariff.description}</p>
                                            )}
                                            
                                            <div className="mb-3">
                                                {tariff.tariff_type === 'free' ? (
                                                    <div className="text-success fw-bold">Бесплатно</div>
                                                ) : (
                                                    <>
                                                        {tariff.price_per_hour > 0 && (
                                                            <div className="mb-1">
                                                                <span className="fw-bold">{tariff.price_per_hour} ₽</span>
                                                                <span className="text-muted">/час</span>
                                                            </div>
                                                        )}
                                                        {tariff.price_per_day > 0 && (
                                                            <div className="mb-1">
                                                                <span className="fw-bold">{tariff.price_per_day} ₽</span>
                                                                <span className="text-muted">/сутки</span>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            <div className="small text-muted mb-3">
                                                {tariff.free_minutes > 0 && (
                                                    <div>Бесплатно: {tariff.free_minutes} мин</div>
                                                )}
                                                <div>Минимум: {tariff.minimum_hours} ч</div>
                                                {tariff.maximum_hours && (
                                                    <div>Максимум: {tariff.maximum_hours} ч</div>
                                                )}
                                            </div>

                                            <div className="d-flex gap-1 flex-wrap">
                                                <Button 
                                                    variant="outline-secondary" 
                                                    size="sm"
                                                    onClick={() => openEditModal(tariff)}
                                                    title="Редактировать"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </Button>
                                                <Button 
                                                    variant="outline-secondary" 
                                                    size="sm"
                                                    onClick={() => openCalculator(tariff)}
                                                    title="Калькулятор"
                                                >
                                                    <FontAwesomeIcon icon={faCalculator} />
                                                </Button>
                                                <Button 
                                                    variant="outline-secondary" 
                                                    size="sm"
                                                    onClick={() => duplicateTariff(tariff)}
                                                    title="Копировать"
                                                >
                                                    <FontAwesomeIcon icon={faCopy} />
                                                </Button>
                                                <Button 
                                                    variant="outline-secondary" 
                                                    size="sm"
                                                    onClick={() => setAsDefault(tariff.id, true)}
                                                    disabled={tariff.is_default_for_residents}
                                                    title="По умолчанию для резидентов"
                                                >
                                                    <FontAwesomeIcon icon={faUsers} />
                                                </Button>
                                                <Button 
                                                    variant="outline-secondary" 
                                                    size="sm"
                                                    onClick={() => setAsDefault(tariff.id, false)}
                                                    disabled={tariff.is_default_for_guests}
                                                    title="По умолчанию для гостей"
                                                >
                                                    <FontAwesomeIcon icon={faUserTie} />
                                                </Button>
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm"
                                                    onClick={() => deleteTariff(tariff.id)}
                                                    title="Удалить"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}

                {/* Модальное окно создания/редактирования тарифа */}
                <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>
                            {editingTariff ? 'Редактировать тариф' : 'Создать тариф'}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={handleSubmit}>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Название тарифа</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Тип тарифа</Form.Label>
                                        <Form.Select
                                            value={formData.tariff_type}
                                            onChange={(e) => setFormData({...formData, tariff_type: e.target.value})}
                                        >
                                            {tariffTypes.map(type => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Label>Описание</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                />
                            </Form.Group>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Цена за час (₽)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            value={formData.price_per_hour}
                                            onChange={(e) => setFormData({...formData, price_per_hour: parseFloat(e.target.value) || 0})}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Цена за сутки (₽)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            value={formData.price_per_day}
                                            onChange={(e) => setFormData({...formData, price_per_day: parseFloat(e.target.value) || 0})}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Минимум часов</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.minimum_hours}
                                            onChange={(e) => setFormData({...formData, minimum_hours: parseInt(e.target.value) || 1})}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Максимум часов</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.maximum_hours}
                                            onChange={(e) => setFormData({...formData, maximum_hours: e.target.value})}
                                            placeholder="Без ограничений"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Бесплатные минуты</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.free_minutes}
                                            onChange={(e) => setFormData({...formData, free_minutes: parseInt(e.target.value) || 0})}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={4}>
                                    <Form.Check
                                        type="checkbox"
                                        label="Тариф активен"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                    />
                                </Col>
                                <Col md={4}>
                                    <Form.Check
                                        type="checkbox"
                                        label="По умолчанию для резидентов"
                                        checked={formData.is_default_for_residents}
                                        onChange={(e) => setFormData({...formData, is_default_for_residents: e.target.checked})}
                                    />
                                </Col>
                                <Col md={4}>
                                    <Form.Check
                                        type="checkbox"
                                        label="По умолчанию для гостей"
                                        checked={formData.is_default_for_guests}
                                        onChange={(e) => setFormData({...formData, is_default_for_guests: e.target.checked})}
                                    />
                                </Col>
                            </Row>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Отмена
                        </Button>
                        <Button variant="primary" onClick={handleSubmit}>
                            {editingTariff ? 'Обновить' : 'Создать'}
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Модальное окно калькулятора стоимости */}
                <Modal show={showCalculatorModal} onHide={() => setShowCalculatorModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Калькулятор стоимости</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Количество часов</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.1"
                                        value={calculatorData.hours}
                                        onChange={(e) => setCalculatorData({...calculatorData, hours: parseFloat(e.target.value) || 0})}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Тип клиента</Form.Label>
                                    <Form.Select
                                        value={calculatorData.hasSubscription}
                                        onChange={(e) => setCalculatorData({...calculatorData, hasSubscription: e.target.value === 'true'})}
                                    >
                                        <option value="false">Гостевой</option>
                                        <option value="true">Резидент</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Button variant="primary" onClick={calculateCost} className="w-100 mb-3">
                            <FontAwesomeIcon icon={faCalculator} className="me-2" />
                            Рассчитать стоимость
                        </Button>

                        {calculationResult && (
                            <Card>
                                <Card.Body>
                                    <h6>Результат расчета:</h6>
                                    <p><strong>Тариф:</strong> {calculationResult.tariff_name}</p>
                                    <p><strong>Длительность:</strong> {calculationResult.duration_hours} ч.</p>
                                    <p><strong>К оплате:</strong> {calculationResult.billable_hours} ч.</p>
                                    <h5 className="text-primary">
                                        <strong>Итого: {calculationResult.total_cost} ₽</strong>
                                    </h5>
                                    {calculationResult.breakdown && (
                                        <div className="small text-muted">
                                            <p>{calculationResult.breakdown.calculation || calculationResult.breakdown.reason}</p>
                                            {calculationResult.breakdown.free_minutes && (
                                                <p>{calculationResult.breakdown.free_minutes}</p>
                                            )}
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCalculatorModal(false)}>
                            Закрыть
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Container>
        </div>
    );
};

export default TariffManagement; 