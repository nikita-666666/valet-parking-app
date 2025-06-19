import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Modal, Form, Alert, Badge, Row, Col, Tab, Tabs } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUser, 
    faPlus, 
    faEdit, 
    faTrash, 
    faUserTie, 
    faEnvelope,
    faIdBadge,
    faUsers,
    faCheckCircle,
    faTimesCircle,
    faEye,
    faEyeSlash,
    faShield,
    faCrown,
    faKey,
    faCheck,
    faTimes
} from '@fortawesome/free-solid-svg-icons';
import api from '../services/api';
import { API_CONFIG } from '../config/api';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
  const [showModal, setShowModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('employees');
    const [editingRole, setEditingRole] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        password: 'valet123',
        role_id: '',
        is_active: true
    });

    const [roleForm, setRoleForm] = useState({
        name: '',
        description: '',
        permission_ids: []
    });

    const [permissionForm, setPermissionForm] = useState({
        code: '',
        name: '',
        description: '',
        module: 'admin'
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/employees/');
      setEmployees(response.data);
    } catch (err) {
      setError('Ошибка при загрузке списка сотрудников');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

    const fetchRoles = async () => {
        try {
            const response = await api.get('/api/v1/roles/');
            setRoles(response.data);
        } catch (err) {
            console.error('Error fetching roles:', err);
            setError('Ошибка при загрузке ролей: ' + (err.response?.data?.detail || err.message));
        }
    };

    const fetchPermissions = async () => {
        try {
            const response = await api.get('/api/v1/roles/permissions/');
            setPermissions(response.data);
        } catch (err) {
            console.error('Error fetching permissions:', err);
            setError('Ошибка при загрузке разрешений: ' + (err.response?.data?.detail || err.message));
    }
  };

  useEffect(() => {
    fetchEmployees();
        fetchRoles();
        fetchPermissions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
            const response = await api.post('/employees', formData);
      setShowModal(false);
      fetchEmployees();
                setFormData({ 
                    email: '', 
                    first_name: '', 
                    last_name: '', 
                    password: 'valet123', 
                    role_id: '', 
                    is_active: true 
                });
                setError(null);
    } catch (err) {
            let errorMessage = 'Ошибка при создании сотрудника';
            
            if (err.response?.data?.detail) {
                if (typeof err.response.data.detail === 'string') {
                    errorMessage = err.response.data.detail;
                } else if (Array.isArray(err.response.data.detail)) {
                    errorMessage = err.response.data.detail.map(errItem => 
                        `${errItem.loc?.join(' → ') || 'Поле'}: ${errItem.msg}`
                    ).join('; ');
                }
            }
            
            setError(errorMessage);
            console.error('Error creating employee:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
      try {
                const response = await api.delete(`/employees/${id}`);
                fetchEmployees();
                setError(null);
                alert('Сотрудник успешно деактивирован');
            } catch (err) {
                if (err.response?.status === 400 && err.response?.data?.detail) {
                    // Специальная обработка для ошибки 400 (есть активные сессии)
                    const confirmDeactivate = window.confirm(
                        `${err.response.data.detail}\n\nХотите вместо этого деактивировать сотрудника? (он будет помечен как неактивный, но данные сохранятся)`
                    );
                    
                    if (confirmDeactivate) {
                        await handleDeactivate(id);
                    }
                } else {
                    setError(err.response?.data?.detail || 'Ошибка при удалении сотрудника');
                }
                console.error('Error deleting employee:', err);
            }
        }
    };

    const handleDeactivate = async (id) => {
        try {
            // Ищем сотрудника и обновляем его статус
            const employee = employees.find(emp => emp.id === id);
            if (!employee) return;

            await api.put(`/employees/${id}`, {
                ...employee,
                is_active: false
            });

            fetchEmployees();
            setError(null);
            alert('Сотрудник успешно деактивирован');
        } catch (err) {
            setError(err.response?.data?.detail || 'Ошибка при деактивации сотрудника');
            console.error('Error deactivating employee:', err);
        }
    };

    const handleToggleActive = async (id, currentStatus) => {
        try {
            const employee = employees.find(emp => emp.id === id);
            if (!employee) return;

            await api.put(`/employees/${id}`, {
                ...employee,
                is_active: !currentStatus
            });

            fetchEmployees();
            setError(null);
        } catch (err) {
            setError(err.response?.data?.detail || 'Ошибка при изменении статуса сотрудника');
            console.error('Error toggling employee status:', err);
        }
    };

    const getRoleDisplayName = (employee) => {
        if (employee.role) {
            return employee.role.display_name || employee.role.name;
        }
        return 'Не указана';
    };

    const getRoleBadgeColor = (roleName) => {
        switch (roleName) {
            case 'admin': return 'dark';
            case 'valet': return 'secondary';
            case 'senior_valet': return 'outline-dark';
            case 'manager': return 'light';
            default: return 'outline-secondary';
        }
    };

    // Функции для управления ролями
    const showAlert = (message, type) => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
    };

    const handleCreateRole = () => {
        setEditingRole(null);
        setRoleForm({
            name: '',
            description: '',
            permission_ids: []
        });
        setShowRoleModal(true);
    };

    const handleEditRole = (role) => {
        setEditingRole(role);
        setRoleForm({
            name: role.name,
            description: role.description || '',
            permission_ids: role.permissions.map(p => p.id)
        });
        setShowRoleModal(true);
    };

    const handleSubmitRole = async (e) => {
        e.preventDefault();
        try {
            if (editingRole) {
                await api.put(`/roles/${editingRole.id}`, roleForm);
                showAlert('Роль успешно обновлена!', 'success');
            } else {
                await api.post('/roles/', roleForm);
                showAlert('Роль успешно создана!', 'success');
            }
            setShowRoleModal(false);
            fetchRoles();
        } catch (error) {
            console.error('Ошибка сохранения роли:', error);
            showAlert(error.response?.data?.detail || 'Ошибка сохранения роли', 'danger');
        }
    };

    const handleDeleteRole = async (roleId) => {
        if (window.confirm('Вы уверены, что хотите удалить эту роль?')) {
            try {
                await api.delete(`/roles/${roleId}`);
                showAlert('Роль успешно удалена!', 'success');
                fetchRoles();
            } catch (error) {
                console.error('Ошибка удаления роли:', error);
                showAlert(error.response?.data?.detail || 'Ошибка удаления роли', 'danger');
            }
        }
    };

    const handleSubmitPermission = async (e) => {
        e.preventDefault();
        try {
            await api.post('/roles/permissions/', permissionForm);
            showAlert('Разрешение успешно создано!', 'success');
            setShowPermissionModal(false);
            setPermissionForm({
                code: '',
                name: '',
                description: '',
                module: 'admin'
            });
            fetchPermissions();
        } catch (error) {
            console.error('Ошибка создания разрешения:', error);
            showAlert(error.response?.data?.detail || 'Ошибка создания разрешения', 'danger');
        }
    };

    const getRoleIcon = (roleName) => {
        switch (roleName) {
            case 'admin': return faCrown;
            case 'senior_valet': return faUserTie;
            case 'valet': return faShield;
            default: return faKey;
        }
    };

    const getModuleColor = (module) => {
        switch (module) {
            case 'admin': return 'dark';
            case 'valet': return 'secondary';
            case 'parking': return 'outline-dark';
            case 'client': return 'outline-secondary';
            case 'reports': return 'light';
            default: return 'outline-light';
        }
    };

    const groupPermissionsByModule = (permissions) => {
        return permissions.reduce((groups, permission) => {
            const module = permission.module || 'other';
            if (!groups[module]) {
                groups[module] = [];
            }
            groups[module].push(permission);
            return groups;
        }, {});
    };

    const permissionGroups = groupPermissionsByModule(permissions);

    if (loading) {
    return (
            <Container className="py-4">
                <div className="text-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Загрузка...</span>
                    </div>
                </div>
      </Container>
    );
  }

  return (
        <div style={{backgroundColor: '#f8f9fa', minHeight: '100vh'}}>
            <Container className="py-4" style={{maxWidth: '1200px'}}>
                {alert.show && (
                    <Alert variant={alert.type} className="mb-4">
                        {alert.message}
                    </Alert>
                )}

                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
                        <FontAwesomeIcon icon={faUsers} className="me-2" />
                        {error}
                    </Alert>
                )}

                <div className="mb-4">
                    <h1 className="mb-0" style={{color: '#2c3e50'}}>Сотрудники</h1>
                </div>

                <Tabs activeKey={activeTab} onSelect={(tab) => setActiveTab(tab)} className="mb-4">
                    <Tab eventKey="employees" title="Сотрудники">
                        {/* Статистика */}
                        <Row className="mb-4">
                            <Col md={3}>
                                <Card className="border-0 shadow-sm h-100" style={{backgroundColor: '#f8f9fa'}}>
                                    <Card.Body className="text-center py-4">
                                        <FontAwesomeIcon icon={faUsers} size="2x" className="text-dark mb-3" />
                                        <h4 className="mb-1 text-dark">{employees.length}</h4>
                                        <small className="text-muted">Всего сотрудников</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="border-0 shadow-sm h-100" style={{backgroundColor: '#f8f9fa'}}>
                                    <Card.Body className="text-center py-4">
                                        <FontAwesomeIcon icon={faUserTie} size="2x" className="text-secondary mb-3" />
                                        <h4 className="mb-1 text-dark">{employees.filter(emp => emp.role?.name === 'valet').length}</h4>
                                        <small className="text-muted">Валетов</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="border-0 shadow-sm h-100" style={{backgroundColor: '#f8f9fa'}}>
                                    <Card.Body className="text-center py-4">
                                        <FontAwesomeIcon icon={faIdBadge} size="2x" className="text-dark mb-3" />
                                        <h4 className="mb-1 text-dark">{employees.filter(emp => emp.role?.name === 'admin').length}</h4>
                                        <small className="text-muted">Администраторов</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="border-0 shadow-sm h-100" style={{backgroundColor: '#f8f9fa'}}>
                                    <Card.Body className="text-center py-4">
                                        <FontAwesomeIcon icon={faUser} size="2x" className="text-secondary mb-3" />
                                        <h4 className="mb-1 text-dark">{employees.filter(emp => emp.is_active).length}</h4>
                                        <small className="text-muted">Активных</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        {/* Основная таблица */}
                        <Card className="shadow-sm border-0">
                            <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center py-3">
                                <h5 className="mb-0">
                                    <FontAwesomeIcon icon={faUsers} className="me-2" />
                                    Список сотрудников
                                </h5>
                                <Button variant="outline-light" onClick={() => setShowModal(true)} className="btn-sm">
                                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                                    Добавить сотрудника
                                </Button>
                            </Card.Header>
                            <Card.Body className="p-0">
                                {employees.length === 0 ? (
                                    <div className="text-center py-5">
                                        <FontAwesomeIcon icon={faUsers} size="3x" className="text-muted mb-3" />
                                        <p className="text-muted">Нет сотрудников</p>
            <Button variant="primary" onClick={() => setShowModal(true)}>
                                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                                        Добавить первого сотрудника
            </Button>
          </div>
                                ) : (
                                    <Table responsive hover className="mb-0">
                                        <thead className="bg-light">
              <tr>
                <th>ID</th>
                                            <th>
                                                <FontAwesomeIcon icon={faUser} className="me-2" />
                                                Сотрудник
                                            </th>
                                            <th>
                                                <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                                                Email
                                            </th>
                                            <th>
                                                <FontAwesomeIcon icon={faIdBadge} className="me-2" />
                                                Роль
                                            </th>
                                            <th>Статус</th>
                                            <th width="150">Действия</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                                                <td>
                                                    <Badge bg="secondary">{employee.id}</Badge>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="bg-dark rounded-circle d-flex align-items-center justify-content-center me-3" 
                                                             style={{width: '40px', height: '40px', color: 'white', fontSize: '1rem', fontWeight: 'bold'}}>
                                                            {employee.full_name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold text-dark">{employee.full_name || 'Не указано'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-muted">{employee.email}</td>
                                                <td>
                                                    <Badge bg={getRoleBadgeColor(employee.role?.name)} text={getRoleBadgeColor(employee.role?.name).includes('outline') ? 'dark' : 'white'}>
                                                        {getRoleDisplayName(employee)}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Badge bg={employee.is_active ? 'dark' : 'secondary'} text="white">
                                                        {employee.is_active ? 'Активен' : 'Неактивен'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        <Button
                                                            variant={employee.is_active ? "outline-dark" : "dark"}
                                                            size="sm"
                                                            onClick={() => handleToggleActive(employee.id, employee.is_active)}
                                                            title={employee.is_active ? "Деактивировать" : "Активировать"}
                                                        >
                                                            {employee.is_active ? (
                                                                <FontAwesomeIcon icon={faCheckCircle} />
                                                            ) : (
                                                                <FontAwesomeIcon icon={faTimesCircle} />
                                                            )}
                    </Button>
                                                        
                                                        <Button
                                                            variant="outline-secondary"
                                                            size="sm"
                                                            onClick={() => handleDelete(employee.id)}
                                                            title="Удалить сотрудника"
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} />
                    </Button>
                                                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
                                )}
        </Card.Body>
      </Card>
                    </Tab>

                    <Tab eventKey="roles" title="Роли">
                        <div className="d-flex justify-content-between align-items-center mb-4 p-3" style={{backgroundColor: '#f8f9fa', borderRadius: '8px'}}>
                            <div>
                                <h5 className="mb-1 text-dark">Роли системы</h5>
                                <small className="text-muted">Управление ролями и их разрешениями</small>
                            </div>
                            <Button variant="dark" onClick={handleCreateRole}>
                                <FontAwesomeIcon icon={faPlus} className="me-2" />
                                Создать роль
                            </Button>
                        </div>

                        <Row>
                            {roles.map((role) => (
                                <Col md={6} lg={4} key={role.id} className="mb-4">
                                    <Card className="h-100 border-0 shadow-sm" style={{backgroundColor: '#ffffff'}}>
                                        <Card.Header className="d-flex justify-content-between align-items-center bg-light border-0">
                                            <div className="d-flex align-items-center">
                                                <FontAwesomeIcon 
                                                    icon={getRoleIcon(role.name)} 
                                                    className="me-2 text-dark" 
                                                />
                                                <strong className="text-dark">{role.name}</strong>
                                                {role.is_system && (
                                                    <Badge bg="secondary" className="ms-2">Системная</Badge>
                                                )}
                                            </div>
                                            {!role.is_system && (
                                                <div>
                                                    <Button 
                                                        variant="outline-dark" 
                                                        size="sm" 
                                                        className="me-1"
                                                        onClick={() => handleEditRole(role)}
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} />
                                                    </Button>
                                                    <Button 
                                                        variant="outline-secondary" 
                                                        size="sm"
                                                        onClick={() => handleDeleteRole(role.id)}
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </Button>
                                                </div>
                                            )}
                                        </Card.Header>
                                        <Card.Body>
                                            <p className="text-muted small mb-3">{role.description}</p>
                                            
                                            <h6 className="mb-2 text-dark">Разрешения ({role.permissions.length}):</h6>
                                            <div className="d-flex flex-wrap gap-1">
                                                {role.permissions.slice(0, 6).map((permission) => (
                                                    <Badge 
                                                        key={permission.id} 
                                                        bg={getModuleColor(permission.module)}
                                                        text={getModuleColor(permission.module).includes('outline') ? 'dark' : 'white'}
                                                        className="small"
                                                    >
                                                        {permission.name}
                                                    </Badge>
                                                ))}
                                                {role.permissions.length > 6 && (
                                                    <Badge bg="light" text="dark" className="small">
                                                        +{role.permissions.length - 6} еще
                                                    </Badge>
                                                )}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Tab>

                    <Tab eventKey="permissions" title="Разрешения">
                        <div className="d-flex justify-content-between align-items-center mb-4 p-3" style={{backgroundColor: '#f8f9fa', borderRadius: '8px'}}>
                            <div>
                                <h5 className="mb-1 text-dark">Разрешения системы</h5>
                                <small className="text-muted">Просмотр и создание разрешений</small>
                            </div>
                            <Button variant="dark" onClick={() => setShowPermissionModal(true)}>
                                <FontAwesomeIcon icon={faPlus} className="me-2" />
                                Создать разрешение
                            </Button>
                        </div>

                        {Object.entries(permissionGroups).map(([module, modulePermissions]) => (
                            <Card key={module} className="mb-4 border-0 shadow-sm">
                                <Card.Header className="bg-light border-0">
                                    <h6 className="mb-0 text-dark">
                                        <Badge bg={getModuleColor(module)} text={getModuleColor(module).includes('outline') ? 'dark' : 'white'} className="me-2">
                                            {module.toUpperCase()}
                                        </Badge>
                                        {modulePermissions.length} разрешений
                                    </h6>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        {modulePermissions.map((permission) => (
                                            <Col md={6} lg={4} key={permission.id} className="mb-3">
                                                <div className="border rounded p-3" style={{backgroundColor: '#f8f9fa'}}>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <div>
                                                            <code className="text-dark">{permission.code}</code>
                                                            <h6 className="mt-1 mb-1 text-dark">{permission.name}</h6>
                                                            <small className="text-muted">{permission.description}</small>
                                                        </div>
                                                        <Badge bg={permission.is_active ? 'dark' : 'secondary'} text="white">
                                                            <FontAwesomeIcon 
                                                                icon={permission.is_active ? faCheck : faTimes} 
                                                            />
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                </Card.Body>
                            </Card>
                        ))}
                    </Tab>
                </Tabs>

                {/* Модальное окно добавления */}
                <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                    <Modal.Header closeButton className="bg-primary text-white">
                        <Modal.Title>
                            <FontAwesomeIcon icon={faPlus} className="me-2" />
                            Добавить нового сотрудника
                        </Modal.Title>
        </Modal.Header>
                    <Modal.Body className="p-4">
          <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold">
                                        <FontAwesomeIcon icon={faUser} className="me-2" />
                                        Имя *
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                                        placeholder="Иван"
                                        required
                                        className="form-control-lg"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
            <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold">
                                        <FontAwesomeIcon icon={faUser} className="me-2" />
                                        Фамилия *
                                    </Form.Label>
              <Form.Control
                type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                                        placeholder="Иванов"
                                        required
                                        className="form-control-lg"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold">
                                        <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                                        Email *
                                    </Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        placeholder="user@example.com"
                required
                                        className="form-control-lg"
              />
            </Form.Group>
                            </Col>
                            <Col md={6}>
            <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold">
                                        Пароль *
                                    </Form.Label>
              <Form.Control
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        placeholder="Введите пароль"
                                        required
                                        className="form-control-lg"
                                    />
                                    <Form.Text className="text-muted">
                                        Для валетов используйте: valet123
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold">
                                        <FontAwesomeIcon icon={faIdBadge} className="me-2" />
                                        Роль *
                                    </Form.Label>
                                    <Form.Select
                                        value={formData.role_id}
                                        onChange={(e) => setFormData({...formData, role_id: parseInt(e.target.value)})}
                                        required
                                        className="form-control-lg"
                                    >
                                        <option value="">Выберите роль...</option>
                                        {roles.map((role) => (
                                            <option key={role.id} value={role.id}>
                                                {role.display_name || role.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                    <Form.Text className="text-muted">
                                        Роль определяет права доступа сотрудника
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold">Статус</Form.Label>
                                    <Form.Check
                                        type="switch"
                                        id="is-active-switch"
                                        label="Активный сотрудник"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                        className="mt-2"
                                    />
                                    <Form.Text className="text-muted">
                                        Неактивные сотрудники не могут войти в систему
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
                        <FontAwesomeIcon icon={faTrash} className="me-2" />
                        Отмена
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        Создать сотрудника
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Модальное окно создания/редактирования роли */}
            <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)} size="lg">
                <Form onSubmit={handleSubmitRole}>
                    <Modal.Header closeButton>
                        <Modal.Title>
                            {editingRole ? 'Редактировать роль' : 'Создать роль'}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Название роли *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={roleForm.name}
                                        onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                required
                                        placeholder="Введите название роли"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Описание</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={roleForm.description}
                                        onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                                        placeholder="Описание роли"
              />
            </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Разрешения</Form.Label>
                            <div style={{maxHeight: '300px', overflowY: 'auto'}} className="border rounded p-3">
                                {Object.entries(permissionGroups).map(([module, modulePermissions]) => (
                                    <div key={module} className="mb-3">
                                        <h6 className="text-muted">
                                            <Badge bg={getModuleColor(module)} className="me-2">
                                                {module.toUpperCase()}
                                            </Badge>
                                        </h6>
                                        {modulePermissions.map((permission) => (
                                            <Form.Check
                                                key={permission.id}
                                                type="checkbox"
                                                id={`permission-${permission.id}`}
                                                label={
                                                    <div>
                                                        <strong>{permission.name}</strong>
                                                        <br />
                                                        <small className="text-muted">{permission.description}</small>
                                                    </div>
                                                }
                                                checked={roleForm.permission_ids.includes(permission.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setRoleForm({
                                                            ...roleForm,
                                                            permission_ids: [...roleForm.permission_ids, permission.id]
                                                        });
                                                    } else {
                                                        setRoleForm({
                                                            ...roleForm,
                                                            permission_ids: roleForm.permission_ids.filter(id => id !== permission.id)
                                                        });
                                                    }
                                                }}
                                                className="mb-2"
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
                            Отмена
                        </Button>
                        <Button variant="primary" type="submit">
                            {editingRole ? 'Сохранить' : 'Создать'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Модальное окно создания разрешения */}
            <Modal show={showPermissionModal} onHide={() => setShowPermissionModal(false)}>
                <Form onSubmit={handleSubmitPermission}>
                    <Modal.Header closeButton>
                        <Modal.Title>Создать разрешение</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Код разрешения *</Form.Label>
                            <Form.Control
                                type="text"
                                value={permissionForm.code}
                                onChange={(e) => setPermissionForm({...permissionForm, code: e.target.value})}
                                required
                                placeholder="например: new_feature_access"
                            />
                            <Form.Text className="text-muted">
                                Уникальный код разрешения (только латинские буквы, цифры и подчеркивания)
                            </Form.Text>
                        </Form.Group>

            <Form.Group className="mb-3">
                            <Form.Label>Название *</Form.Label>
              <Form.Control
                type="text"
                                value={permissionForm.name}
                                onChange={(e) => setPermissionForm({...permissionForm, name: e.target.value})}
                required
                                placeholder="Название разрешения"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Описание</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={permissionForm.description}
                                onChange={(e) => setPermissionForm({...permissionForm, description: e.target.value})}
                                placeholder="Описание разрешения"
              />
            </Form.Group>

            <Form.Group className="mb-3">
                            <Form.Label>Модуль</Form.Label>
              <Form.Select
                                value={permissionForm.module}
                                onChange={(e) => setPermissionForm({...permissionForm, module: e.target.value})}
                            >
                                <option value="admin">Администрирование</option>
                                <option value="valet">Валет</option>
                                <option value="parking">Парковка</option>
                                <option value="client">Клиенты</option>
                                <option value="reports">Отчеты</option>
                                <option value="other">Другое</option>
              </Form.Select>
            </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowPermissionModal(false)}>
                Отмена
              </Button>
                        <Button variant="success" type="submit">
                Создать
              </Button>
                    </Modal.Footer>
          </Form>
      </Modal>
    </Container>
        </div>
  );
};

export default Employees; 