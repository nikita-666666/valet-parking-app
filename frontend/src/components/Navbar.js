import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Button, Badge, Modal, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import PermissionGuard from './PermissionGuard';
import { PERMISSIONS } from '../services/permissions';
import { API_CONFIG } from '../config/api';
import api from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCar, faParking, faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

const NavigationBar = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  // Получаем информацию о текущем пользователе
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setUserLoading(true);
        const user = await authService.getCurrentUser();
        console.log('Информация о пользователе загружена:', user);
        setCurrentUser(user);
      } catch (error) {
        console.error('Не удалось получить информацию о пользователе:', error);
        setCurrentUser(null);
        // Если ошибка авторизации, перенаправляем на страницу входа
        if (error.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setUserLoading(false);
      }
    };

    fetchCurrentUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getUserInitials = (user) => {
    if (user.first_name && user.last_name) {
      return (user.first_name.charAt(0) + user.last_name.charAt(0)).toUpperCase();
    }
    return (user.first_name || user.email || 'U').charAt(0).toUpperCase();
  };

  const getRoleBadgeColor = (roleName) => {
    switch (roleName) {
      case 'admin': return 'danger';
      case 'manager': return 'primary';
      case 'senior_valet': return 'info';
      case 'valet': return 'success';
      case 'guest': return 'warning';
      default: return 'secondary';
    }
  };

  const getRoleDisplayName = (role) => {
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

  return (
    <div className="navbar-wrapper py-2 px-3">
      <Navbar 
        style={{
          backgroundColor: '#2c3e50',
          borderRadius: '12px',
          maxWidth: '1200px',
          margin: '0 auto'
        }} 
        variant="dark" 
        expand="lg" 
        className="py-2"
      >
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold fs-4 text-white">
            Valet Service
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
                <PermissionGuard 
                  permission={PERMISSIONS.VALET_SESSIONS_VIEW}
                  showLoading={false}
                >
                  <Nav.Link as={Link} to="/valet-sessions" className="text-light mx-2">Валет-сессии</Nav.Link>
                </PermissionGuard>
                
                <PermissionGuard 
                  permission={PERMISSIONS.ADMIN_USERS_MANAGE}
                  showLoading={false}
                >
                  <Nav.Link as={Link} to="/employees" className="text-light mx-2">Сотрудники</Nav.Link>
                </PermissionGuard>
                
                <PermissionGuard 
                  permission={PERMISSIONS.CLIENT_SUBSCRIPTIONS_VIEW}
                  showLoading={false}
                >
                  <Nav.Link as={Link} to="/subscriptions" className="text-light mx-2">Абонементы</Nav.Link>
                </PermissionGuard>
                
                <PermissionGuard 
                  permission={PERMISSIONS.ADMIN_SETTINGS_MANAGE}
                  showLoading={false}
                >
                  <Nav.Link as={Link} to="/tariffs" className="text-light mx-2">Тарифы</Nav.Link>
                </PermissionGuard>
                
                <PermissionGuard 
                  permission={PERMISSIONS.CLIENT_VIEW}
                  showLoading={false}
                >
                  <Nav.Link as={Link} to="/clients" className="text-light mx-2">Клиенты</Nav.Link>
                </PermissionGuard>
            </Nav>
            <Nav className="d-flex align-items-center">
                {userLoading ? (
                  <div className="text-light me-3">
                    <div className="d-flex align-items-center">
                      <div 
                        className="bg-secondary rounded-circle d-flex align-items-center justify-content-center me-2" 
                        style={{width: '32px', height: '32px'}}
                      >
                        <div className="spinner-border spinner-border-sm text-light" role="status">
                          <span className="visually-hidden">Загрузка...</span>
                        </div>
                      </div>
                      <div className="d-none d-md-block">
                        <small className="text-light opacity-75">Загрузка профиля...</small>
                      </div>
                    </div>
                  </div>
                ) : currentUser ? (
                  <div className="text-light me-3">
                    <div className="d-flex align-items-center">
                      {/* Аватар пользователя */}
                      <div 
                        className="bg-light text-dark rounded-circle d-flex align-items-center justify-content-center me-2" 
                        style={{
                          width: '36px', 
                          height: '36px', 
                          fontSize: '14px', 
                          fontWeight: 'bold',
                          border: '2px solid rgba(255,255,255,0.2)'
                        }}
                        title={`${currentUser.full_name || `${currentUser.first_name} ${currentUser.last_name}`} (${currentUser.email})`}
                      >
                        {getUserInitials(currentUser)}
                      </div>
                      
                      {/* Информация о пользователе - скрывается на мобильных */}
                      <div className="d-none d-lg-block">
                        <div className="d-flex align-items-center">
                          <span className="fw-bold text-white">
                            {currentUser.full_name || `${currentUser.first_name} ${currentUser.last_name}`}
                          </span>
                          {currentUser.role && (
                            <Badge 
                              bg={getRoleBadgeColor(currentUser.role.name)} 
                              className="ms-2"
                              style={{fontSize: '0.7rem'}}
                            >
                              {getRoleDisplayName(currentUser.role)}
                            </Badge>
                          )}
                        </div>
                        <small className="text-light opacity-75" style={{fontSize: '0.75rem'}}>
                          {currentUser.email}
                        </small>
                      </div>
                      
                      {/* Только роль на средних экранах */}
                      <div className="d-none d-md-block d-lg-none">
                        {currentUser.role && (
                          <Badge 
                            bg={getRoleBadgeColor(currentUser.role.name)} 
                            className="ms-2"
                          >
                            {getRoleDisplayName(currentUser.role)}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Кнопка выхода */}
                      <Button
                        variant="link"
                        className="text-light ms-3 p-0"
                        onClick={() => setShowLogoutModal(true)}
                        title="Выйти"
                      >
                        <FontAwesomeIcon icon={faSignOutAlt} />
                      </Button>
                    </div>
                  </div>
                ) : null}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Модальное окно подтверждения выхода */}
      <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Подтверждение выхода</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Вы действительно хотите выйти из системы?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleLogout}>
            Выйти
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default NavigationBar; 