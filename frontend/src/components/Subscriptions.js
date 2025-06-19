import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, InputGroup, Tab, Tabs, Modal, Table, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSearch, 
    faPlus, 
    faDownload,
    faChevronDown,
    faCalendarAlt,
    faLock,
    faEdit
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('subscriptions');
  const [showModal, setShowModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    template_id: '',
    client_name: '',
    client_surname: '',
    client_phone: '',
    client_build: '',
    client_appartament: '',
        client_card_number: '',
    car_number: '',
    car_model: '',
    start_date: '',
        valet_notes: '',
        parking_floor: '',
        parking_spot: '',
        payment_type: 'online'
    });
    const [createType, setCreateType] = useState('subscription');
    const [templateFormData, setTemplateFormData] = useState({
        name: '',
        description: '',
        sale_conditions: '',
        online_payment: 'yes',
        min_duration_months: 1,
        max_duration_months: 1,
        price_per_month: '',
        location_id: 1
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [subscriptionsRes, templatesRes] = await Promise.all([
                axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/subscriptions/`),
                axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/subscription-templates/`)
            ]);
            setSubscriptions(subscriptionsRes.data);
            setTemplates(templatesRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            setLoading(false);
        }
    };

    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
        
        // Устанавливаем только ID шаблона, остальные поля заполняются из шаблона
        setFormData({
            ...formData,
            template_id: template.id
        });
    };

    const calculateEndDate = (startDate, durationMonths) => {
        if (!startDate || !durationMonths) return '';
        const start = new Date(startDate);
        const end = new Date(start);
        end.setMonth(end.getMonth() + parseInt(durationMonths));
        return end.toISOString().split('T')[0];
    };

    const calculateTotalCost = () => {
        if (!selectedTemplate || !formData.start_date) return '0';
        const duration = selectedTemplate.max_duration_months || 1;
        const pricePerMonth = selectedTemplate.price_per_month || 0;
        return (duration * pricePerMonth).toFixed(0);
    };

  const handleSubmit = async (e) => {
    e.preventDefault();
        
        // Проверяем обязательные поля
        if (!selectedTemplate) {
            alert('Выберите шаблон абонемента');
            return;
        }
        
        if (!formData.client_name || !formData.client_surname || !formData.car_number) {
            alert('Заполните все обязательные поля');
            return;
        }
        
        // Вычисляем дату окончания
        const endDate = calculateEndDate(formData.start_date, selectedTemplate.max_duration_months);
        
        // Подготавливаем данные для отправки
        const submitData = {
            template_id: parseInt(formData.template_id),
            client_name: formData.client_name.trim(),
            client_surname: formData.client_surname.trim(),
            client_phone: formData.client_phone || '',
            client_build: formData.client_build ? parseInt(formData.client_build) : null,
            client_appartament: formData.client_appartament || '',
            client_card_number: formData.client_card_number || `${formData.client_build || '0'}-${formData.client_appartament || '0'}`,
            car_number: formData.car_number.trim(),
            car_model: formData.car_model || '',
            start_date: formData.start_date,
            end_date: endDate,
            location_id: 1,
            status: 'active'
        };

        console.log('Отправляемые данные:', submitData);

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/subscriptions/`, 
                submitData
            );
            console.log('Ответ сервера:', response.data);
            
      setShowModal(false);
            loadData();
            
            // Очищаем форму
      setFormData({
        template_id: '',
        client_name: '',
        client_surname: '',
        client_phone: '',
        client_build: '',
        client_appartament: '',
                client_card_number: '',
        car_number: '',
        car_model: '',
        start_date: '',
                valet_notes: '',
                parking_floor: '',
                parking_spot: '',
                payment_type: 'online'
            });
            setSelectedTemplate(null);
        } catch (error) {
            console.error('Ошибка создания абонемента:', error);
            if (error.response?.data?.detail) {
                console.error('Детали ошибки:', error.response.data.detail);
                alert(`Ошибка: ${JSON.stringify(error.response.data.detail)}`);
            } else {
                alert('Произошла ошибка при создании абонемента');
            }
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active': return <Badge bg="success">Активный</Badge>;
            case 'expired': return <Badge bg="warning">Истёк</Badge>;
            case 'cancelled': return <Badge bg="danger">Отменен</Badge>;
            default: return <Badge bg="secondary">{status}</Badge>;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ru-RU');
    };

    const handleCreateClick = () => {
        setCreateType(activeTab === 'templates' ? 'template' : 'subscription');
        setShowModal(true);
    };

    const handleTemplateSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/subscription-templates/`, templateFormData);
            setShowModal(false);
            loadData();
            // Очищаем форму шаблона
            setTemplateFormData({
                name: '',
                description: '',
                sale_conditions: '',
                online_payment: 'yes',
                min_duration_months: 1,
                max_duration_months: 1,
                price_per_month: '',
                location_id: 1
            });
        } catch (error) {
            console.error('Ошибка создания шаблона:', error);
        }
    };

  return (
        <div style={{backgroundColor: '#f8f9fa', minHeight: '100vh'}}>
            <Container className="py-4" style={{maxWidth: '1200px'}}>
                <div className="mb-4">
                    <h1 className="mb-0" style={{color: '#2c3e50'}}>Клиенты</h1>
                </div>
                
          <div className="d-flex justify-content-between align-items-center mb-4">
                    <div></div>
                    <div className="d-flex gap-2">
                        <Button variant="outline-secondary" className="d-flex align-items-center">
                            <FontAwesomeIcon icon={faDownload} className="me-2" />
                            Скачать Excel
                        </Button>
                        <Button 
                            variant="dark" 
                            className="d-flex align-items-center"
                            onClick={handleCreateClick}
                        >
                            <FontAwesomeIcon icon={faPlus} className="me-2" />
                            Создать
            </Button>
                    </div>
                </div>

                <Tabs activeKey={activeTab} onSelect={(tab) => setActiveTab(tab)} className="mb-4">
                    <Tab eventKey="subscriptions" title="Абонементы">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <Dropdown>
                                <Dropdown.Toggle variant="outline-secondary" className="d-flex align-items-center">
                                    Все объекты
                                    <FontAwesomeIcon icon={faChevronDown} className="ms-2" />
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item>Все объекты</Dropdown.Item>
                                    <Dropdown.Item>Жилой Квартал Prime Park</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>

                            <InputGroup style={{maxWidth: '300px'}}>
                                <InputGroup.Text>
                                    <FontAwesomeIcon icon={faSearch} />
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Найти"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
          </div>

                        <Card className="border-0 shadow-sm">
                            <Table responsive className="mb-0">
                                <thead className="bg-light">
              <tr>
                                    <th>№</th>
                                    <th>Название</th>
                                    <th>Срок</th>
                                    <th>Статус</th>
                <th>Клиент</th>
                                    <th>Авто</th>
                                    <th>Дата создания</th>
                                    <th>Дата активации</th>
                                    <th>Дата окончания</th>
              </tr>
            </thead>
            <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="9" className="text-center py-4">
                                                <div className="spinner-border" role="status">
                                                    <span className="visually-hidden">Загрузка...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : subscriptions.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="text-center py-4 text-muted">
                                                Абонементы не найдены
                                            </td>
                                        </tr>
                                    ) : (
                                        subscriptions
                                            .filter(sub => 
                                                sub.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                sub.car_number?.toLowerCase().includes(searchTerm.toLowerCase())
                                            )
                                            .map((subscription) => (
                <tr key={subscription.id}>
                  <td>{subscription.id}</td>
                  <td>
                                            <div>
                                                <div className="fw-medium">
                                                    {templates.find(t => t.id === subscription.template_id)?.name || 'Неизвестный шаблон'}
                                                </div>
                                            </div>
                  </td>
                                        <td>1 месяц</td>
                                        <td>{getStatusBadge(subscription.status)}</td>
                                        <td>{subscription.client_name} {subscription.client_surname}</td>
                                        <td>
                                            <div>
                                                <div>{subscription.car_model}</div>
                                                <small className="text-muted">{subscription.car_number}</small>
                                            </div>
                  </td>
                                        <td>{formatDate(subscription.created_at)}</td>
                                        <td>{formatDate(subscription.start_date)}</td>
                                        <td>{formatDate(subscription.end_date)}</td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </Table>
                    </Card>
                </Tab>

                <Tab eventKey="templates" title="Шаблоны">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Dropdown>
                            <Dropdown.Toggle variant="outline-secondary" className="d-flex align-items-center">
                                Все объекты
                                <FontAwesomeIcon icon={faChevronDown} className="ms-2" />
                            </Dropdown.Toggle>
                        </Dropdown>

                        <InputGroup style={{maxWidth: '300px'}}>
                            <InputGroup.Text>
                                <FontAwesomeIcon icon={faSearch} />
                            </InputGroup.Text>
                            <Form.Control
                                type="text"
                                placeholder="Найти"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </div>

                    <Card className="border-0 shadow-sm">
                        <Table responsive className="mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th>№</th>
                                    <th>Название и описание</th>
                                    <th>Условия</th>
                                    <th>Стоимость</th>
                                    <th>Длительность</th>
                                    <th>Дата создания</th>
                                    <th>Дата обновления</th>
                                </tr>
                            </thead>
                            <tbody>
                                {templates.map((template) => (
                                    <tr key={template.id}>
                                        <td>{template.id}</td>
                                        <td>
                                            <div>
                                                <div className="fw-medium">{template.name}</div>
                                                <small className="text-muted">{template.description}</small>
                                            </div>
                  </td>
                                        <td>{template.sale_conditions || 'https://primeparking.ru/ofertaparking'}</td>
                                        <td>{template.price_per_month} ₽</td>
                                        <td>{template.max_duration_months} {template.max_duration_months === 1 ? 'день' : 'дней'}</td>
                                        <td>{formatDate(template.created_at)}</td>
                                        <td>{formatDate(template.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
      </Card>
                </Tab>

                <Tab eventKey="clients" title="Клиенты">
                    <div className="text-center py-5 text-muted">
                        <p>Список клиентов будет отображаться здесь</p>
                    </div>
                </Tab>
            </Tabs>

            {/* Модальное окно */}
            <Modal 
                show={showModal} 
                onHide={() => {
                    setShowModal(false);
                    setSelectedTemplate(null);
                    setCreateType('subscription');
                    setFormData({
                        template_id: '',
                        client_name: '',
                        client_surname: '',
                        client_phone: '',
                        client_build: '',
                        client_appartament: '',
                        client_card_number: '',
                        car_number: '',
                        car_model: '',
                        start_date: '',
                        valet_notes: '',
                        parking_floor: '',
                        parking_spot: '',
                        payment_type: 'online'
                    });
                    setTemplateFormData({
                        name: '',
                        description: '',
                        sale_conditions: '',
                        online_payment: 'yes',
                        min_duration_months: 1,
                        max_duration_months: 1,
                        price_per_month: '',
                        location_id: 1
                    });
                }}
                size="lg"
                centered
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fs-5 fw-bold">
                        {createType === 'template' ? 'Создание шаблона' : 'Создание абонемента'}
                    </Modal.Title>
        </Modal.Header>
        <Modal.Body>
                    {createType === 'template' ? (
                        // Форма создания шаблона
                        <Form onSubmit={handleTemplateSubmit}>
                            <div className="d-flex">
                                <div className="bg-light p-3 rounded me-3" style={{minWidth: '250px'}}>
                                    <div className="d-flex align-items-center mb-3">
                                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                                        <span className="fw-bold">Ввод данных</span>
                                    </div>
                                </div>

                                <div className="flex-grow-1">
                                    <Row className="mb-3">
                                        <Col>
                                            <Form.Label className="fw-bold">Объект</Form.Label>
                                            <Dropdown>
                                                <Dropdown.Toggle variant="outline-secondary" className="w-100">
                                                    Жилой Квартал Prime Park
                                                    <FontAwesomeIcon icon={faChevronDown} className="ms-2" />
                                                </Dropdown.Toggle>
                                            </Dropdown>
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col>
                                            <Form.Label className="fw-bold">Тип парковки</Form.Label>
                                            <Dropdown>
                                                <Dropdown.Toggle variant="outline-secondary" className="w-100">
                                                    Валет-паркинг
                                                    <FontAwesomeIcon icon={faChevronDown} className="ms-2" />
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu className="w-100">
                                                    <Dropdown.Item>Валет-паркинг</Dropdown.Item>
                                                    <Dropdown.Item>Приват-паркинг</Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col>
                                            <Form.Label>Введите название</Form.Label>
                                            <Form.Control 
                                                value={templateFormData.name}
                                                onChange={(e) => setTemplateFormData({...templateFormData, name: e.target.value})}
                                                placeholder="Введите название"
                                                required
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col>
                                            <Form.Label>Описание для клиента</Form.Label>
                                            <Form.Control 
                                                as="textarea"
                                                rows={3}
                                                value={templateFormData.description}
                                                onChange={(e) => setTemplateFormData({...templateFormData, description: e.target.value})}
                                                placeholder="Введите описание"
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col>
                                            <Form.Label>Условия продажи</Form.Label>
                                            <Form.Control 
                                                as="textarea"
                                                rows={3}
                                                value={templateFormData.sale_conditions}
                                                onChange={(e) => setTemplateFormData({...templateFormData, sale_conditions: e.target.value})}
                                                placeholder="Введите условия"
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col>
                                            <Form.Label>Онлайн-оплата</Form.Label>
                                            <Dropdown>
                                                <Dropdown.Toggle variant="outline-secondary" className="w-100">
                                                    {templateFormData.online_payment === 'yes' ? 'Доступна' : 'Недоступна'}
                                                    <FontAwesomeIcon icon={faChevronDown} className="ms-2" />
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu className="w-100">
                                                    <Dropdown.Item onClick={() => setTemplateFormData({...templateFormData, online_payment: 'yes'})}>
                                                        Доступна
                                                    </Dropdown.Item>
                                                    <Dropdown.Item onClick={() => setTemplateFormData({...templateFormData, online_payment: 'no'})}>
                                                        Недоступна
                                                    </Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col>
                                            <Form.Label>Доступ к услугам</Form.Label>
                                            <Dropdown>
                                                <Dropdown.Toggle variant="outline-secondary" className="w-100">
                                                    Не доступны
                                                    <FontAwesomeIcon icon={faChevronDown} className="ms-2" />
                                                </Dropdown.Toggle>
                                            </Dropdown>
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col md={4}>
                                            <Form.Label>Формат времени</Form.Label>
                                            <Dropdown>
                                                <Dropdown.Toggle variant="outline-secondary" className="w-100">
                                                    Дни
                                                    <FontAwesomeIcon icon={faChevronDown} className="ms-2" />
                                                </Dropdown.Toggle>
                                            </Dropdown>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Label>Минимальный срок</Form.Label>
                                            <Form.Control 
                                                type="number"
                                                value={templateFormData.min_duration_months}
                                                onChange={(e) => setTemplateFormData({...templateFormData, min_duration_months: parseInt(e.target.value)})}
                                                placeholder="Введите минимальный срок"
                                            />
                                        </Col>
                                        <Col md={4}>
                                            <Form.Label>Максимальный срок</Form.Label>
                                            <Form.Control 
                                                type="number"
                                                value={templateFormData.max_duration_months}
                                                onChange={(e) => setTemplateFormData({...templateFormData, max_duration_months: parseInt(e.target.value)})}
                                                placeholder="Введите максимальный срок"
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col>
                                            <Form.Label>Стоимость за день</Form.Label>
                                            <Form.Control 
                                                type="number"
                                                step="0.01"
                                                value={templateFormData.price_per_month}
                                                onChange={(e) => setTemplateFormData({...templateFormData, price_per_month: e.target.value})}
                                                placeholder="Введите стоимость (₽)"
                                                required
                                            />
                                        </Col>
                                    </Row>
                                </div>
                            </div>

                            <div className="d-flex justify-content-end gap-2 mt-4">
                                <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
                                    Отмена
                                </Button>
                                <Button variant="dark" type="submit">
                                    Создать
                                </Button>
                            </div>
                        </Form>
                    ) : (
                        // Существующая форма создания абонемента
          <Form onSubmit={handleSubmit}>
                            <div className="d-flex">
                                {/* Левая панель - Ввод данных */}
                                <div className="bg-light p-3 rounded me-3" style={{minWidth: '250px'}}>
                                    <div className="d-flex align-items-center mb-3">
                                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                                        <span className="fw-bold">Ввод данных</span>
                                    </div>
                                </div>

                                {/* Основная форма */}
                                <div className="flex-grow-1">
                                    {/* Выбор шаблона */}
                                    <div className="mb-4">
                                        <Form.Label className="fw-bold">Шаблон</Form.Label>
                                        <Dropdown>
                                            <Dropdown.Toggle 
                                                variant="outline-secondary" 
                                                className="w-100 d-flex justify-content-between align-items-center"
                                            >
                                                {selectedTemplate ? selectedTemplate.name : 'Шаблон абонемента'}
                                                <FontAwesomeIcon icon={faChevronDown} />
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu className="w-100">
                {templates.map(template => (
                                                    <Dropdown.Item 
                                                        key={template.id}
                                                        onClick={() => handleTemplateSelect(template)}
                                                    >
                    {template.name}
                                                    </Dropdown.Item>
                                                ))}
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </div>

                                    {selectedTemplate && (
                                        <>
                                            {/* Данные абонемента */}
                                            <div className="mb-4">
                                                <h6 className="fw-bold mb-3">Данные абонемента</h6>
                                                
                                                <Row className="mb-3">
                                                    <Col md={6}>
                                                        <Form.Label>Тип</Form.Label>
                                                        <InputGroup>
                                                            <Form.Control 
                                                                value={selectedTemplate.name.includes('Валет') ? 'Валет-паркинг' : 'Приват-паркинг'}
                                                                readOnly 
                                                            />
                                                            <InputGroup.Text>
                                                                <FontAwesomeIcon icon={faLock} />
                                                            </InputGroup.Text>
                                                        </InputGroup>
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Label>Название</Form.Label>
                                                        <InputGroup>
                                                            <Form.Control 
                                                                value={selectedTemplate.name}
                                                                readOnly 
                                                            />
                                                            <InputGroup.Text>
                                                                <FontAwesomeIcon icon={faLock} />
                                                            </InputGroup.Text>
                                                        </InputGroup>
                                                    </Col>
                                                </Row>

                                                <Row className="mb-3">
                                                    <Col>
                                                        <Form.Label>Описание для клиента</Form.Label>
                                                        <Form.Control 
                                                            as="textarea" 
                                                            rows={3}
                                                            value={selectedTemplate.description || ''}
                                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                                        />
                                                    </Col>
                                                </Row>

                                                <Row className="mb-3">
                                                    <Col md={6}>
                                                        <Form.Label>Срок абонемента</Form.Label>
                                                        <InputGroup>
                                                            <Form.Control 
                                                                value={selectedTemplate.max_duration_months || 1}
                                                                readOnly
                                                            />
                                                            <InputGroup.Text>Месяцев</InputGroup.Text>
                                                        </InputGroup>
                                                    </Col>
                                                </Row>

                                                <Row className="mb-3">
                                                    <Col md={6}>
                                                        <Form.Label>Дата активации</Form.Label>
                                                        <InputGroup>
                                                            <Form.Control 
                                                                type="date"
                                                                value={formData.start_date}
                                                                onChange={(e) => setFormData({
                                                                    ...formData, 
                                                                    start_date: e.target.value
                                                                })}
                                                                required
                                                            />
                                                            <InputGroup.Text>
                                                                <FontAwesomeIcon icon={faCalendarAlt} />
                                                            </InputGroup.Text>
                                                        </InputGroup>
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Label>Дата окончания</Form.Label>
                                                        <InputGroup>
                                                            <Form.Control 
                                                                value={calculateEndDate(formData.start_date, selectedTemplate.max_duration_months)}
                                                                readOnly
                                                            />
                                                            <InputGroup.Text>
                                                                <FontAwesomeIcon icon={faLock} />
                                                            </InputGroup.Text>
                                                        </InputGroup>
                                                    </Col>
                                                </Row>

                                                <Row className="mb-3">
                                                    <Col md={6}>
                                                        <Form.Label>ValetCard ID</Form.Label>
                                                        <Form.Control 
                                                            value={formData.client_card_number}
                                                            onChange={(e) => setFormData({...formData, client_card_number: e.target.value})}
                                                            placeholder="Автоматически: {корпус}-{квартира}"
                                                        />
                                                        <Form.Text className="text-muted">
                                                            Если не заполнено, будет сгенерировано автоматически
                                                        </Form.Text>
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Label>PIN</Form.Label>
                                                        <Form.Control 
                                                            value={formData.pin || ''}
                                                            onChange={(e) => setFormData({...formData, pin: e.target.value})}
                                                            placeholder="Введите PIN"
                                                        />
                                                    </Col>
                                                </Row>

                                                <Row className="mb-3">
                                                    <Col md={6}>
                                                        <Form.Label>Этаж</Form.Label>
                                                        <Form.Control 
                                                            value={formData.parking_floor}
                                                            onChange={(e) => setFormData({...formData, parking_floor: e.target.value})}
                                                            placeholder="Номер этажа"
                                                        />
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Label>Место</Form.Label>
                                                        <Form.Control 
                                                            value={formData.parking_spot}
                                                            onChange={(e) => setFormData({...formData, parking_spot: e.target.value})}
                                                            placeholder="Номер места"
                                                        />
                                                    </Col>
                                                </Row>

                                                <Row className="mb-3">
                                                    <Col>
                                                        <Form.Label>Информация для валетов</Form.Label>
                                                        <Form.Control 
                                                            as="textarea"
                                                            value={formData.valet_notes}
                                                            onChange={(e) => setFormData({...formData, valet_notes: e.target.value})}
                                                            placeholder="Дополнительная информация"
                                                        />
                                                    </Col>
                                                </Row>

                                                <Row className="mb-3">
                                                    <Col md={6}>
                                                        <Form.Label>Тип оплаты</Form.Label>
                                                        <Dropdown>
                                                            <Dropdown.Toggle variant="outline-secondary" className="w-100">
                                                                {formData.payment_type === 'online' ? 'Онлайн' : 'Наличные'}
                                                            </Dropdown.Toggle>
                                                            <Dropdown.Menu className="w-100">
                                                                <Dropdown.Item onClick={() => setFormData({...formData, payment_type: 'online'})}>
                                                                    Онлайн
                                                                </Dropdown.Item>
                                                                <Dropdown.Item onClick={() => setFormData({...formData, payment_type: 'cash'})}>
                                                                    Наличные
                                                                </Dropdown.Item>
                                                            </Dropdown.Menu>
                                                        </Dropdown>
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Label>Итоговая стоимость</Form.Label>
                                                        <InputGroup>
                                                            <Form.Control 
                                                                value={`${calculateTotalCost()} Р`}
                                                                readOnly
                                                            />
                                                            <InputGroup.Text>
                                                                <FontAwesomeIcon icon={faLock} />
                                                            </InputGroup.Text>
                                                        </InputGroup>
                                                    </Col>
                                                </Row>

                                                <Row className="mb-4">
                                                    <Col>
                                                        <Form.Label>Доступ к услугам</Form.Label>
                                                        <Dropdown>
                                                            <Dropdown.Toggle variant="outline-secondary" className="w-100">
                                                                Не доступны
                                                            </Dropdown.Toggle>
                                                            <Dropdown.Menu className="w-100">
                                                                <Dropdown.Item>Не доступны</Dropdown.Item>
                                                                <Dropdown.Item>Доступны</Dropdown.Item>
                                                            </Dropdown.Menu>
                                                        </Dropdown>
                                                    </Col>
                                                </Row>
                                            </div>

                                            {/* Данные клиента */}
                                            <div className="mb-4">
                                                <h6 className="fw-bold mb-3">Данные клиента</h6>
                                                
                                                <Row className="mb-3">
                                                    <Col md={6}>
                                                        <Form.Label>Имя <span className="text-danger">*</span></Form.Label>
              <Form.Control
                value={formData.client_name}
                onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                                                            placeholder="Введите имя"
                required
              />
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Label>Фамилия <span className="text-danger">*</span></Form.Label>
              <Form.Control
                value={formData.client_surname}
                onChange={(e) => setFormData({...formData, client_surname: e.target.value})}
                                                            placeholder="Введите фамилию"
                required
              />
                                                    </Col>
                                                </Row>

                                                <Row className="mb-3">
                                                    <Col md={6}>
                                                        <Form.Label>Телефон</Form.Label>
              <Form.Control
                value={formData.client_phone}
                onChange={(e) => setFormData({...formData, client_phone: e.target.value})}
                                                            placeholder="+7 ("
                required
              />
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Label>Здание</Form.Label>
              <Form.Control
                value={formData.client_build}
                onChange={(e) => setFormData({...formData, client_build: e.target.value})}
                                                            placeholder="Введите номер здания"
                                                        />
                                                    </Col>
                                                </Row>

                                                <Row className="mb-3">
                                                    <Col>
                                                        <Form.Label>Квартира</Form.Label>
              <Form.Control
                value={formData.client_appartament}
                onChange={(e) => setFormData({...formData, client_appartament: e.target.value})}
                                                            placeholder="Введите номер квартиры"
                                                        />
                                                    </Col>
                                                </Row>
                                            </div>

                                            {/* Автомобиль */}
                                            <div className="mb-4">
                                                <h6 className="fw-bold mb-3">Автомобиль</h6>
                                                
                                                <Row className="mb-3">
                                                    <Col>
                                                        <Form.Label>Номер <span className="text-danger">*</span></Form.Label>
              <Form.Control
                value={formData.car_number}
                onChange={(e) => setFormData({...formData, car_number: e.target.value})}
                                                            placeholder="Введите номер автомобиля"
                required
              />
                                                    </Col>
                                                </Row>

                                                <Row className="mb-3">
                                                    <Col>
                                                        <Form.Label>Марка и цвет</Form.Label>
              <Form.Control
                value={formData.car_model}
                onChange={(e) => setFormData({...formData, car_model: e.target.value})}
                                                            placeholder="Например: Toyota Camry, белый"
                required
              />
                                                    </Col>
                                                </Row>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="d-flex justify-content-end gap-2 mt-4">
                                <Button 
                                    variant="outline-secondary" 
                                    onClick={() => setShowModal(false)}
                                >
                Отмена
              </Button>
                                <Button 
                                    variant="dark" 
                                    type="submit"
                                    disabled={!selectedTemplate}
                                >
                Создать
              </Button>
            </div>
          </Form>
                    )}
        </Modal.Body>
      </Modal>
    </Container>
    </div>
  );
};

export default Subscriptions; 