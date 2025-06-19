import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import NavigationBar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import ValetMobileApp from './components/ValetMobileApp';
import Employees from './components/Employees';
import ValetSessions from './components/ValetSessions';
import Subscriptions from './components/Subscriptions';
import Tariffs from './components/TariffManagement';
import Clients from './components/Clients';
import ClientBooking from './components/ClientBooking';
import PermissionGuard from './components/PermissionGuard';
import { PERMISSIONS } from './services/permissions';
import 'bootstrap/dist/css/bootstrap.min.css';
import api from './services/api';
import { Container } from 'react-bootstrap';
import authService from './services/authService';

// Компонент для защищенных маршрутов с навигацией
const ProtectedLayout = () => {
  const location = useLocation();
  const isMobileApp = location.pathname === '/valet-mobile' || location.pathname === '/client-booking';

  if (isMobileApp) {
    return <Outlet />;
  }

  return (
    <>
      <NavigationBar />
      <Container fluid className="px-4 py-4">
        <Outlet />
      </Container>
    </>
  );
};

// Компонент для защиты маршрутов, требующих авторизации
const PrivateRoute = ({ isAuthenticated, children }) => {
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Проверяем наличие токена
        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const user = await authService.getCurrentUser();
        if (user) {
          setIsAuthenticated(true);
          setEmployee(user);
        }
      } catch (error) {
        // Если ошибка 401, просто очищаем состояние
        if (error.response?.status === 401) {
          setIsAuthenticated(false);
          setEmployee(null);
        } else {
          console.error('Auth check failed:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []); // Проверяем только при монтировании

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Публичные маршруты - доступны всем */}
        <Route path="/login" element={
          <Login 
            setIsAuthenticated={setIsAuthenticated} 
            setEmployee={setEmployee} 
          />
        } />
        <Route path="/client-booking" element={<ClientBooking />} />
        <Route path="/valet-mobile" element={<ValetMobileApp />} />

        {/* Защищенные маршруты - требуют авторизации */}
        <Route element={
          <PrivateRoute isAuthenticated={isAuthenticated}>
            <ProtectedLayout />
          </PrivateRoute>
        }>
          <Route path="/" element={
            <PermissionGuard 
              permission={PERMISSIONS.DASHBOARD_VIEW}
              fallback={<Navigate to="/login" />}
            >
              <Dashboard />
            </PermissionGuard>
          } />
          
          <Route path="/valet-sessions" element={
            <PermissionGuard 
              permission={PERMISSIONS.VALET_SESSIONS_VIEW}
              fallback={<Navigate to="/" />}
            >
              <ValetSessions />
            </PermissionGuard>
          } />

          <Route path="/employees" element={
            <PermissionGuard 
              permission={PERMISSIONS.ADMIN_USERS_MANAGE}
              fallback={<Navigate to="/" />}
            >
              <Employees />
            </PermissionGuard>
          } />

          <Route path="/subscriptions" element={
            <PermissionGuard 
              permission={PERMISSIONS.CLIENT_SUBSCRIPTIONS_VIEW}
              fallback={<Navigate to="/" />}
            >
              <Subscriptions />
            </PermissionGuard>
          } />

          <Route path="/tariffs" element={
            <PermissionGuard 
              permission={PERMISSIONS.ADMIN_SETTINGS_MANAGE}
              fallback={<Navigate to="/" />}
            >
              <Tariffs />
            </PermissionGuard>
          } />

          <Route path="/clients" element={
            <PermissionGuard 
              permission={PERMISSIONS.CLIENT_VIEW}
              fallback={<Navigate to="/" />}
            >
              <Clients />
            </PermissionGuard>
          } />
        </Route>

        {/* Редирект на главную для неизвестных маршрутов */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
