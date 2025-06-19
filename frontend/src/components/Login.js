import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Badge, Modal } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMobile, 
  faDesktop, 
  faUser, 
  faSignOutAlt,
  faKey
} from '@fortawesome/free-solid-svg-icons';
import { API_CONFIG } from '../config/api';
import api from '../services/api';
import authService from '../services/authService';

const Login = ({ setIsAuthenticated, setEmployee }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastUser, setLastUser] = useState(null);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showInterfaceChoice, setShowInterfaceChoice] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });

  // Получаем URL для редиректа после авторизации
  const from = location.state?.from?.pathname || "/";

  const getRoleBadgeColorForLogin = (roleName) => {
    switch (roleName) {
      case 'admin': return 'danger';
      case 'manager': return 'primary';
      case 'senior_valet': return 'info';
      case 'valet': return 'success';
      case 'guest': return 'warning';
      default: return 'secondary';
    }
  };

  const getRoleDisplayNameForLogin = (role) => {
    if (!role) return 'Не указана';
    
    const roleNames = {
      'admin': 'Администратор',
      'manager': 'Менеджер',
      'senior_valet': 'Старший валет',
      'valet': 'Валет',
      'guest': 'Гость'
    };
    
    return roleNames[role.name] || role.name;
  };

  useEffect(() => {
    // Проверяем, есть ли сохраненная информация о последнем пользователе
    const savedUser = localStorage.getItem('lastUser');
    if (savedUser) {
      setLastUser(JSON.parse(savedUser));
      setShowUserInfo(true);
    }
  }, []);

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Базовая валидация
    if (!email.trim()) {
      setError('Email обязателен');
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError('Пароль обязателен');
      setLoading(false);
      return;
    }

    // Валидация формата email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Неверный формат email');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Attempting to login with:', { email, password: '***' });
      
      const response = await authService.login(email, password);
      console.log('Login response:', {
        access_token: response.access_token ? 'present' : 'missing',
        token_type: response.token_type
      });
      
      if (response.access_token) {
        // Получаем информацию о пользователе через authService
        const userInfo = await authService.getCurrentUser();
        console.log('User info:', {
          id: userInfo.id,
          email: userInfo.email,
          full_name: userInfo.full_name,
          role: userInfo.role ? {
            id: userInfo.role.id,
            name: userInfo.role.name,
            description: userInfo.role.description
          } : null
        });
        
        // Проверяем токен в localStorage
        const storedToken = localStorage.getItem('token');
        console.log('Token in localStorage:', storedToken ? 'present' : 'missing');
        
        // Сохраняем информацию о последнем пользователе
        localStorage.setItem('lastUser', JSON.stringify(userInfo));
        
        setEmployee(userInfo);
        setIsAuthenticated(true);
        console.log('Authentication state updated:', { isAuthenticated: true });
        
        // Если пользователь пришел с valet-mobile, возвращаем его туда
        if (from === '/valet-mobile') {
          console.log('Redirecting to valet-mobile');
          navigate('/valet-mobile');
        }
        // Если пользователь валет и пришел с другой страницы, предлагаем выбор
        else if (userInfo.role?.name === 'valet') {
          console.log('Showing interface choice for valet');
          showAlert('Выберите интерфейс для работы', 'info');
          // Показываем модальное окно с выбором интерфейса
          setShowInterfaceChoice(true);
        }
        // В остальных случаях редиректим на запрошенную страницу
        else {
          console.log('Redirecting to:', from);
          navigate(from);
        }
      }
    } catch (error) {
      console.error('Login error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack
      });
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      
      let errorMessage = 'Ошибка при входе в систему';
      
      // Обработка различных типов ошибок
      if (error.message.includes('Network Error')) {
        errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Неверный email или пароль';
      } else if (error.response?.status === 422) {
        errorMessage = 'Неверный формат данных. Проверьте правильность введенных данных.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showAlert(errorMessage, 'error');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '400px' }} className="shadow">
        <Card.Body>
          <h2 className="text-center mb-4">Вход в систему</h2>
          
          {showUserInfo && lastUser && (
            <Alert variant="info" className="mb-4 border-0" style={{backgroundColor: '#e3f2fd'}}>
              <div className="text-center">
                <div className="d-flex align-items-center justify-content-center mb-3">
                  <div 
                    className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                    style={{width: '50px', height: '50px', fontSize: '18px', fontWeight: 'bold'}}
                  >
                    {lastUser.first_name ? lastUser.first_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-start">
                    <strong className="text-dark">Сеанс завершён</strong>
                    <div className="text-muted">Пользователь вышел из системы</div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <h6 className="mb-1 text-dark">{lastUser.full_name || `${lastUser.first_name} ${lastUser.last_name}`}</h6>
                  <small className="text-muted">{lastUser.email}</small>
                  {lastUser.role && (
                    <div className="mt-2">
                      <Badge 
                        bg={getRoleBadgeColorForLogin(lastUser.role.name)} 
                        className="text-white"
                      >
                        {getRoleDisplayNameForLogin(lastUser.role)}
                      </Badge>
                    </div>
                  )}
                </div>
                
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => setShowUserInfo(false)}
                >
                  Скрыть
                </Button>
              </div>
            </Alert>
          )}
          
          {alert.show && (
            <Alert variant={alert.type === 'error' ? 'danger' : alert.type} className="mb-4">
              {alert.message}
            </Alert>
          )}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Введите email"
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Пароль</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Введите пароль"
              />
            </Form.Group>
            <Button 
              variant="primary" 
              type="submit" 
              className="w-100"
              disabled={loading}
            >
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {/* Модальное окно выбора интерфейса */}
      <Modal show={showInterfaceChoice} onHide={() => setShowInterfaceChoice(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Выберите интерфейс</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-grid gap-3">
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => {
                setShowInterfaceChoice(false);
                navigate('/valet-mobile');
              }}
            >
              <FontAwesomeIcon icon={faMobile} className="me-2" />
              Мобильный интерфейс валета
            </Button>
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => {
                setShowInterfaceChoice(false);
                navigate(from);
              }}
            >
              <FontAwesomeIcon icon={faDesktop} className="me-2" />
              Административный интерфейс
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Login; 