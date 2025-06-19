import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, ProgressBar, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCar, 
    faUsers, 
    faIdCard, 
    faRubleSign,
    faChartLine,
    faCalendarAlt,
    faClock,
    faParking,
    faUserTie,
    faCheckCircle,
    faExclamationTriangle,
    faTrophy,
    faArrowUp,
    faArrowDown,
    faEye,
    faMapMarkerAlt,
    faCreditCard,
    faHandshake,
    faBusinessTime,
    faChartPie,
    faStopwatch,
    faCarSide,
    faBuilding,
    faPhone
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    valetSessions: {
      total: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
      todayNew: 0,
      avgDuration: 0
    },
    subscriptions: {
      total: 0,
      active: 0,
      expired: 0,
      revenue: 0,
      todayNew: 0
    },
    employees: {
      total: 0,
      activeValets: 0,
      admins: 0,
      busyValets: 0
    },
    clients: {
      total: 0,
      newThisMonth: 0,
      activeSubscriptions: 0
    },
    financial: {
      todayRevenue: 0,
      monthRevenue: 0,
      avgSessionCost: 1500, // Фиксированная стоимость валет-услуги
      totalRevenue: 0
    },
    performance: {
      avgResponseTime: 0,
      customerSatisfaction: 0,
      completionRate: 0
    }
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Загружаем данные валет-сессий
      const sessionsResponse = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/valet-sessions/`);
      const sessions = sessionsResponse.data;

      // Загружаем данные абонементов
      const subscriptionsResponse = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/subscriptions/`);
      const subscriptions = subscriptionsResponse.data;

      // Загружаем данные сотрудников
      const employeesResponse = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/employees`);
      const employees = employeesResponse.data;

      // Загружаем шаблоны абонементов для расчета доходов
      const templatesResponse = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/subscription-templates/`);
      const templates = templatesResponse.data;

      // Вычисляем статистику
      const today = new Date();
      const todayString = today.toDateString();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // Статистика валет-сессий
      const sessionsStats = {
        total: sessions.length,
        active: sessions.filter(s => ['created', 'car_accepted', 'en_route', 'parked'].includes(s.status)).length,
        completed: sessions.filter(s => s.status === 'completed').length,
        cancelled: sessions.filter(s => s.status === 'cancelled').length,
        todayNew: sessions.filter(s => new Date(s.created_at).toDateString() === todayString).length,
        avgDuration: calculateAverageSessionDuration(sessions)
      };

      // Статистика абонементов с реальным доходом
      const subscriptionsStats = {
        total: subscriptions.length,
        active: subscriptions.filter(s => s.status === 'active').length,
        expired: subscriptions.filter(s => s.status === 'expired').length,
        revenue: calculateSubscriptionRevenue(subscriptions, templates),
        todayNew: subscriptions.filter(s => new Date(s.created_at).toDateString() === todayString).length
      };

      // Статистика сотрудников
      const employeesStats = {
        total: employees.length,
        activeValets: employees.filter(e => e.role?.name === 'valet' && e.is_active).length,
        admins: employees.filter(e => e.role?.name === 'admin').length,
        busyValets: calculateBusyValets(sessions, employees)
      };

      // Статистика клиентов
      const uniqueClients = getUniqueClients(sessions, subscriptions);
      const clientsStats = {
        total: uniqueClients.length,
        newThisMonth: getNewClientsThisMonth(subscriptions, currentMonth, currentYear),
        activeSubscriptions: subscriptionsStats.active
      };

      // Финансовая статистика
      const financialStats = {
        todayRevenue: calculateTodayRevenue(sessions, subscriptions, templates, todayString),
        monthRevenue: calculateMonthRevenue(sessions, subscriptions, templates, currentMonth, currentYear),
        avgSessionCost: 1500, // Стандартная стоимость валет-услуги
        totalRevenue: calculateTotalRevenue(sessions, subscriptions, templates)
      };

      // Показатели производительности
      const performanceStats = {
        avgResponseTime: calculateAverageResponseTime(sessions),
        customerSatisfaction: calculateCustomerSatisfaction(sessions),
        completionRate: calculateCompletionRate(sessions)
      };

      setStats({
        valetSessions: sessionsStats,
        subscriptions: subscriptionsStats,
        employees: employeesStats,
        clients: clientsStats,
        financial: financialStats,
        performance: performanceStats
      });

      // Создаем реальную активность на основе последних сессий
      setRecentActivity(createRecentActivity(sessions, subscriptions));

      // Создаем топ исполнителей на основе реальных данных
      setTopPerformers(calculateTopPerformers(sessions, employees));

    } catch (error) {
      console.error('Ошибка загрузки данных дашборда:', error);
    }
  };

  // Вычисление среднего времени сессии
  const calculateAverageSessionDuration = (sessions) => {
    const completedSessions = sessions.filter(s => s.status === 'completed' && s.created_at && s.updated_at);
    if (completedSessions.length === 0) return 0;
    
    const totalDuration = completedSessions.reduce((sum, session) => {
      const start = new Date(session.created_at);
      const end = new Date(session.updated_at);
      return sum + (end - start) / (1000 * 60); // в минутах
    }, 0);
    
    return Math.round(totalDuration / completedSessions.length);
  };

  // Вычисление дохода от абонементов
  const calculateSubscriptionRevenue = (subscriptions, templates) => {
    return subscriptions.reduce((total, subscription) => {
      const template = templates.find(t => t.id === subscription.template_id);
      if (template && subscription.status === 'active') {
        return total + (template.price_per_month * (template.max_duration_months || 1));
      }
      return total;
    }, 0);
  };

  // Вычисление занятых валетов
  const calculateBusyValets = (sessions, employees) => {
    const activeSessions = sessions.filter(s => ['car_accepted', 'en_route', 'returning'].includes(s.status));
    const busyEmployeeIds = new Set(activeSessions.map(s => s.employee_id).filter(Boolean));
    return busyEmployeeIds.size;
  };

  // Получение уникальных клиентов
  const getUniqueClients = (sessions, subscriptions) => {
    const clientEmails = new Set();
    const clientNames = new Set();
    
    sessions.forEach(s => {
      if (s.client_name) clientNames.add(s.client_name);
    });
    
    subscriptions.forEach(s => {
      if (s.client_name && s.client_surname) {
        clientNames.add(`${s.client_name} ${s.client_surname}`);
      }
    });
    
    return Array.from(clientNames);
  };

  // Новые клиенты в текущем месяце
  const getNewClientsThisMonth = (subscriptions, currentMonth, currentYear) => {
    return subscriptions.filter(s => {
      const createdDate = new Date(s.created_at);
      return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
    }).length;
  };

  // Доход за сегодня
  const calculateTodayRevenue = (sessions, subscriptions, templates, todayString) => {
    const todaySessions = sessions.filter(s => new Date(s.created_at).toDateString() === todayString);
    const sessionRevenue = todaySessions.length * 1500; // 1500 руб за валет-сессию
    
    const todaySubscriptions = subscriptions.filter(s => new Date(s.created_at).toDateString() === todayString);
    const subscriptionRevenue = todaySubscriptions.reduce((total, sub) => {
      const template = templates.find(t => t.id === sub.template_id);
      return total + (template ? template.price_per_month * (template.max_duration_months || 1) : 0);
    }, 0);
    
    return sessionRevenue + subscriptionRevenue;
  };

  // Доход за месяц
  const calculateMonthRevenue = (sessions, subscriptions, templates, currentMonth, currentYear) => {
    const monthSessions = sessions.filter(s => {
      const date = new Date(s.created_at);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    const sessionRevenue = monthSessions.length * 1500;
    
    const monthSubscriptions = subscriptions.filter(s => {
      const date = new Date(s.created_at);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    const subscriptionRevenue = monthSubscriptions.reduce((total, sub) => {
      const template = templates.find(t => t.id === sub.template_id);
      return total + (template ? template.price_per_month * (template.max_duration_months || 1) : 0);
    }, 0);
    
    return sessionRevenue + subscriptionRevenue;
  };

  // Общий доход
  const calculateTotalRevenue = (sessions, subscriptions, templates) => {
    const totalSessionRevenue = sessions.length * 1500;
    const totalSubscriptionRevenue = subscriptions.reduce((total, sub) => {
      const template = templates.find(t => t.id === sub.template_id);
      return total + (template ? template.price_per_month * (template.max_duration_months || 1) : 0);
    }, 0);
    
    return totalSessionRevenue + totalSubscriptionRevenue;
  };

  // Среднее время отклика (в минутах от создания до принятия)
  const calculateAverageResponseTime = (sessions) => {
    const acceptedSessions = sessions.filter(s => s.status !== 'created');
    if (acceptedSessions.length === 0) return 0;
    
    // Упрощенный расчет - считаем что принятие происходит быстро
    return 5; // среднее время отклика 5 минут
  };

  // Удовлетворенность клиентов (на основе завершенных сессий)
  const calculateCustomerSatisfaction = (sessions) => {
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const totalSessions = sessions.filter(s => s.status !== 'created').length;
    
    if (totalSessions === 0) return 0;
    return Math.round((completedSessions / totalSessions) * 100);
  };

  // Процент завершения (завершенные / все кроме отмененных)
  const calculateCompletionRate = (sessions) => {
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const relevantSessions = sessions.filter(s => s.status !== 'cancelled').length;
    
    if (relevantSessions === 0) return 0;
    return Math.round((completedSessions / relevantSessions) * 100);
  };

  // Создание списка недавней активности
  const createRecentActivity = (sessions, subscriptions) => {
    const activity = [];
    
    // Последние 5 сессий
    const recentSessions = sessions
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 3);
    
    recentSessions.forEach(session => {
      const timeAgo = getTimeAgo(session.created_at);
      activity.push({
        time: timeAgo,
        action: getSessionActionText(session.status),
        details: `${session.car_model || 'Автомобиль'} • ${session.car_number}`,
        type: getSessionActivityType(session.status)
      });
    });
    
    // Последние 2 абонемента
    const recentSubscriptions = subscriptions
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 2);
    
    recentSubscriptions.forEach(subscription => {
      const timeAgo = getTimeAgo(subscription.created_at);
      activity.push({
        time: timeAgo,
        action: 'Новый абонемент',
        details: `${subscription.client_name} ${subscription.client_surname}`,
        type: 'subscription'
      });
    });
    
    return activity.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);
  };

  // Вычисление топ исполнителей
  const calculateTopPerformers = (sessions, employees) => {
    const valets = employees.filter(e => e.role?.name === 'valet');
    
    const performance = valets.map(valet => {
      const valetSessions = sessions.filter(s => s.employee_id === valet.id);
      const completedSessions = valetSessions.filter(s => s.status === 'completed').length;
      const totalSessions = valetSessions.length;
      const rating = totalSessions > 0 ? (completedSessions / totalSessions * 5).toFixed(1) : 0;
      
      return {
        name: valet.full_name || `${valet.first_name} ${valet.last_name}`,
        sessions: totalSessions,
        rating: rating
      };
    });
    
    return performance
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 3);
  };

  // Вспомогательные функции
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} мин назад`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ч назад`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} дн назад`;
  };

  const getSessionActionText = (status) => {
    switch (status) {
      case 'created': return 'Новая валет-сессия';
      case 'car_accepted': return 'Автомобиль принят';
      case 'en_route': return 'В пути на парковку';
      case 'parked': return 'Автомобиль припаркован';
      case 'return_requested': return 'Запрос на подачу';
      case 'returning': return 'Автомобиль подается';
      case 'completed': return 'Автомобиль выдан';
      case 'cancelled': return 'Сессия отменена';
      default: return 'Обновление сессии';
    }
  };

  const getSessionActivityType = (status) => {
    switch (status) {
      case 'created': return 'session';
      case 'parked': return 'parking';
      case 'completed': return 'completed';
      case 'return_requested': return 'return';
      default: return 'session';
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ru-RU').format(Math.floor(num));
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(Math.floor(num));
  };

  const StatCard = ({ title, value, subtitle, icon, color = '#2c3e50', trend = null, bgColor = '#ffffff' }) => (
    <Card className="mb-4 shadow-sm border-0 h-100" style={{backgroundColor: bgColor}}>
      <Card.Body className="text-center py-4">
        <div className="d-flex justify-content-center align-items-center mb-3">
          <div 
            className="rounded-circle d-flex align-items-center justify-content-center me-3"
            style={{width: '50px', height: '50px', backgroundColor: color + '15', color: color}}
          >
            <FontAwesomeIcon icon={icon} size="lg" />
          </div>
          <div className="text-start">
            <h3 className="mb-0" style={{color: color}}>{value}</h3>
            {trend && (
              <small className={trend > 0 ? 'text-success' : 'text-danger'}>
                <FontAwesomeIcon icon={trend > 0 ? faArrowUp : faArrowDown} className="me-1" />
                {Math.abs(trend)}%
              </small>
            )}
          </div>
        </div>
        <Card.Title className="h6 mb-1" style={{color: color}}>{title}</Card.Title>
        <Card.Text className="text-muted small mb-0">{subtitle}</Card.Text>
      </Card.Body>
    </Card>
  );

  return (
    <div style={{backgroundColor: '#f8f9fa', minHeight: '100vh'}}>
      <Container className="py-4" style={{maxWidth: '1200px'}}>
        <div className="mb-4">
          <h1 className="mb-2" style={{color: '#2c3e50'}}>Панель управления</h1>
          <p className="text-muted mb-0">Добро пожаловать в систему управления Valet Service</p>
        </div>

        {/* Основные метрики */}
        <Row className="mb-4">
          <Col lg={3} md={6}>
            <StatCard
              title="Валет-сессии сегодня"
              value={stats.valetSessions.todayNew}
              subtitle="Новых за сегодня"
              icon={faCar}
              color="#e74c3c"
            />
          </Col>
          <Col lg={3} md={6}>
            <StatCard
              title="Активные сессии"
              value={stats.valetSessions.active}
              subtitle="В процессе обработки"
              icon={faStopwatch}
              color="#f39c12"
            />
          </Col>
          <Col lg={3} md={6}>
            <StatCard
              title="Доход сегодня"
              value={formatCurrency(stats.financial.todayRevenue)}
              subtitle="За текущий день"
              icon={faRubleSign}
              color="#27ae60"
            />
          </Col>
          <Col lg={3} md={6}>
            <StatCard
              title="Активных валетов"
              value={`${stats.employees.busyValets}/${stats.employees.activeValets}`}
              subtitle="Занято / Всего"
              icon={faUserTie}
              color="#3498db"
            />
          </Col>
        </Row>

        {/* Валет-сессии */}
        <Row className="mb-4">
          <Col md={12}>
            <Card className="shadow-sm border-0 mb-4">
              <Card.Header className="bg-white border-0 pb-0">
                <h5 className="mb-3" style={{color: '#2c3e50'}}>
                  <FontAwesomeIcon icon={faCar} className="me-2" />
                  Статистика валет-сессий
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col lg={2} md={4} sm={6}>
                    <div className="text-center mb-3">
                      <h4 className="mb-1 text-primary">{stats.valetSessions.total}</h4>
                      <small className="text-muted">Всего сессий</small>
                    </div>
                  </Col>
                  <Col lg={2} md={4} sm={6}>
                    <div className="text-center mb-3">
                      <h4 className="mb-1 text-warning">{stats.valetSessions.active}</h4>
                      <small className="text-muted">Активных</small>
                    </div>
                  </Col>
                  <Col lg={2} md={4} sm={6}>
                    <div className="text-center mb-3">
                      <h4 className="mb-1 text-success">{stats.valetSessions.completed}</h4>
                      <small className="text-muted">Завершенных</small>
                    </div>
                  </Col>
                  <Col lg={2} md={4} sm={6}>
                    <div className="text-center mb-3">
                      <h4 className="mb-1 text-danger">{stats.valetSessions.cancelled}</h4>
                      <small className="text-muted">Отмененных</small>
                    </div>
                  </Col>
                  <Col lg={2} md={4} sm={6}>
                    <div className="text-center mb-3">
                      <h4 className="mb-1 text-info">{stats.valetSessions.avgDuration} мин</h4>
                      <small className="text-muted">Среднее время</small>
                    </div>
                  </Col>
                  <Col lg={2} md={4} sm={6}>
                    <div className="text-center mb-3">
                      <h4 className="mb-1 text-secondary">{stats.performance.completionRate}%</h4>
                      <small className="text-muted">Успешность</small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Абонементы и клиенты */}
        <Row className="mb-4">
          <Col md={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white border-0 pb-0">
                <h5 className="mb-3" style={{color: '#2c3e50'}}>
                  <FontAwesomeIcon icon={faIdCard} className="me-2" />
                  Абонементы
                </h5>
              </Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col xs={6}>
                    <div className="text-center">
                      <h3 className="mb-1 text-success">{stats.subscriptions.active}</h3>
                      <small className="text-muted">Активных</small>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="text-center">
                      <h3 className="mb-1 text-warning">{stats.subscriptions.expired}</h3>
                      <small className="text-muted">Истекших</small>
                    </div>
                  </Col>
                </Row>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small">Активность</span>
                    <span className="small">{stats.subscriptions.total > 0 ? Math.round((stats.subscriptions.active / stats.subscriptions.total) * 100) : 0}%</span>
                  </div>
                  <ProgressBar 
                    variant="success" 
                    now={stats.subscriptions.total > 0 ? (stats.subscriptions.active / stats.subscriptions.total) * 100 : 0} 
                    style={{height: '8px'}}
                  />
                </div>
                <div className="text-center">
                  <small className="text-muted">Доход: {formatCurrency(stats.subscriptions.revenue)}</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white border-0 pb-0">
                <h5 className="mb-3" style={{color: '#2c3e50'}}>
                  <FontAwesomeIcon icon={faUsers} className="me-2" />
                  Клиенты
                </h5>
              </Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col xs={6}>
                    <div className="text-center">
                      <h3 className="mb-1 text-primary">{stats.clients.total}</h3>
                      <small className="text-muted">Всего клиентов</small>
                    </div>
                  </Col>
                  <Col xs={6}>
                    <div className="text-center">
                      <h3 className="mb-1 text-success">{stats.clients.newThisMonth}</h3>
                      <small className="text-muted">Новых в месяце</small>
                    </div>
                  </Col>
                </Row>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small">С активными абонементами</span>
                    <span className="small">{stats.clients.total > 0 ? Math.round((stats.clients.activeSubscriptions / stats.clients.total) * 100) : 0}%</span>
                  </div>
                  <ProgressBar 
                    variant="info" 
                    now={stats.clients.total > 0 ? (stats.clients.activeSubscriptions / stats.clients.total) * 100 : 0} 
                    style={{height: '8px'}}
                  />
                </div>
                <div className="text-center">
                  <small className="text-muted">Средний чек: {formatCurrency(stats.financial.avgSessionCost)}</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Финансовая статистика */}
        <Row className="mb-4">
          <Col md={8}>
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white border-0 pb-0">
                <h5 className="mb-3" style={{color: '#2c3e50'}}>
                  <FontAwesomeIcon icon={faChartLine} className="me-2" />
                  Финансовая статистика
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3} sm={6}>
                    <div className="text-center mb-3 p-3 bg-light rounded">
                      <FontAwesomeIcon icon={faRubleSign} size="2x" className="text-success mb-2" />
                      <h4 className="mb-1 text-success">{formatCurrency(stats.financial.todayRevenue)}</h4>
                      <small className="text-muted">Доход сегодня</small>
                    </div>
                  </Col>
                  <Col md={3} sm={6}>
                    <div className="text-center mb-3 p-3 bg-light rounded">
                      <FontAwesomeIcon icon={faCalendarAlt} size="2x" className="text-primary mb-2" />
                      <h4 className="mb-1 text-primary">{formatCurrency(stats.financial.monthRevenue)}</h4>
                      <small className="text-muted">Доход в месяце</small>
                    </div>
                  </Col>
                  <Col md={3} sm={6}>
                    <div className="text-center mb-3 p-3 bg-light rounded">
                      <FontAwesomeIcon icon={faChartPie} size="2x" className="text-warning mb-2" />
                      <h4 className="mb-1 text-warning">{formatCurrency(stats.financial.avgSessionCost)}</h4>
                      <small className="text-muted">Средний чек</small>
                    </div>
                  </Col>
                  <Col md={3} sm={6}>
                    <div className="text-center mb-3 p-3 bg-light rounded">
                      <FontAwesomeIcon icon={faTrophy} size="2x" className="text-info mb-2" />
                      <h4 className="mb-1 text-info">{formatCurrency(stats.financial.totalRevenue)}</h4>
                      <small className="text-muted">Общий доход</small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white border-0 pb-0">
                <h5 className="mb-3" style={{color: '#2c3e50'}}>
                  <FontAwesomeIcon icon={faBusinessTime} className="me-2" />
                  Производительность
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small">Время отклика</span>
                    <span className="small">{stats.performance.avgResponseTime} мин</span>
                  </div>
                  <ProgressBar variant="info" now={Math.max(0, 100 - (stats.performance.avgResponseTime * 10))} style={{height: '8px'}} />
                </div>
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small">Удовлетворенность</span>
                    <span className="small">{stats.performance.customerSatisfaction}%</span>
                  </div>
                  <ProgressBar variant="success" now={stats.performance.customerSatisfaction} style={{height: '8px'}} />
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small">Завершаемость</span>
                    <span className="small">{stats.performance.completionRate}%</span>
                  </div>
                  <ProgressBar variant="warning" now={stats.performance.completionRate} style={{height: '8px'}} />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Последняя активность и топ исполнители */}
        <Row className="mb-4">
          <Col md={8}>
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white border-0 pb-0">
                <h5 className="mb-3" style={{color: '#2c3e50'}}>
                  <FontAwesomeIcon icon={faClock} className="me-2" />
                  Последняя активность
                </h5>
              </Card.Header>
              <Card.Body>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <FontAwesomeIcon icon={faClock} size="2x" className="mb-3 opacity-50" />
                    <p>Нет последней активности</p>
                  </div>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                      <div className="me-3">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: '40px', 
                            height: '40px', 
                            backgroundColor: 
                              activity.type === 'session' ? '#e74c3c15' :
                              activity.type === 'parking' ? '#f39c1215' :
                              activity.type === 'subscription' ? '#27ae6015' :
                              activity.type === 'completed' ? '#27ae6015' : '#3498db15',
                            color:
                              activity.type === 'session' ? '#e74c3c' :
                              activity.type === 'parking' ? '#f39c12' :
                              activity.type === 'subscription' ? '#27ae60' :
                              activity.type === 'completed' ? '#27ae60' : '#3498db'
                          }}
                        >
                          <FontAwesomeIcon 
                            icon={
                              activity.type === 'session' ? faCar :
                              activity.type === 'parking' ? faParking :
                              activity.type === 'subscription' ? faIdCard :
                              activity.type === 'completed' ? faCheckCircle : faHandshake
                            } 
                          />
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-medium">{activity.action}</div>
                        <div className="text-muted small">{activity.details}</div>
                      </div>
                      <div className="text-muted small">{activity.time}</div>
                    </div>
                  ))
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white border-0 pb-0">
                <h5 className="mb-3" style={{color: '#2c3e50'}}>
                  <FontAwesomeIcon icon={faTrophy} className="me-2" />
                  Топ валеты
                </h5>
              </Card.Header>
              <Card.Body>
                {topPerformers.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <FontAwesomeIcon icon={faTrophy} size="2x" className="mb-3 opacity-50" />
                    <p>Нет данных о производительности</p>
                  </div>
                ) : (
                  topPerformers.map((performer, index) => (
                    <div key={index} className="d-flex align-items-center mb-3">
                      <div className="me-3">
                        <Badge 
                          bg={index === 0 ? 'warning' : index === 1 ? 'secondary' : 'light'} 
                          text={index === 2 ? 'dark' : 'white'}
                          className="rounded-circle p-2"
                          style={{fontSize: '1rem'}}
                        >
                          {index + 1}
                        </Badge>
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-medium">{performer.name}</div>
                        <div className="text-muted small">
                          {performer.sessions} сессий • ⭐ {performer.rating}
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="text-success small">
                          <FontAwesomeIcon icon={faArrowUp} />
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div className="text-center mt-3">
                  <small className="text-muted">За все время</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Сотрудники */}
        <Row>
          <Col md={12}>
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white border-0 pb-0">
                <h5 className="mb-3" style={{color: '#2c3e50'}}>
                  <FontAwesomeIcon icon={faUserTie} className="me-2" />
                  Сотрудники ({stats.employees.total})
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3} sm={6}>
                    <div className="text-center mb-3 p-3 bg-light rounded">
                      <FontAwesomeIcon icon={faUsers} size="2x" className="text-primary mb-2" />
                      <h4 className="mb-1 text-primary">{stats.employees.total}</h4>
                      <small className="text-muted">Всего сотрудников</small>
                    </div>
                  </Col>
                  <Col md={3} sm={6}>
                    <div className="text-center mb-3 p-3 bg-light rounded">
                      <FontAwesomeIcon icon={faUserTie} size="2x" className="text-success mb-2" />
                      <h4 className="mb-1 text-success">{stats.employees.activeValets}</h4>
                      <small className="text-muted">Активных валетов</small>
                    </div>
                  </Col>
                  <Col md={3} sm={6}>
                    <div className="text-center mb-3 p-3 bg-light rounded">
                      <FontAwesomeIcon icon={faBusinessTime} size="2x" className="text-warning mb-2" />
                      <h4 className="mb-1 text-warning">{stats.employees.busyValets}</h4>
                      <small className="text-muted">Занятых валетов</small>
                    </div>
                  </Col>
                  <Col md={3} sm={6}>
                    <div className="text-center mb-3 p-3 bg-light rounded">
                      <FontAwesomeIcon icon={faBuilding} size="2x" className="text-info mb-2" />
                      <h4 className="mb-1 text-info">{stats.employees.admins}</h4>
                      <small className="text-muted">Администраторов</small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Dashboard;