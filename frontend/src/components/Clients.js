import React, { useState } from 'react';
import { Container, Nav, Tab } from 'react-bootstrap';
import SubscriptionTemplates from './SubscriptionTemplates';
import Subscriptions from './Subscriptions';

const Clients = () => {
  const [activeTab, setActiveTab] = useState('subscriptions');

  return (
    <div style={{backgroundColor: '#f8f9fa', minHeight: '100vh'}}>
      <Container className="py-4" style={{maxWidth: '1200px'}}>
        <div className="mb-4">
          <h1 className="mb-0" style={{color: '#2c3e50'}}>Клиенты</h1>
        </div>
        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          <Nav variant="tabs" className="mb-4">
            <Nav.Item>
              <Nav.Link eventKey="subscriptions">Абонементы</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="templates">Шаблоны</Nav.Link>
            </Nav.Item>
          </Nav>
          <Tab.Content>
            <Tab.Pane eventKey="subscriptions">
              <Subscriptions />
            </Tab.Pane>
            <Tab.Pane eventKey="templates">
              <SubscriptionTemplates />
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Container>
    </div>
  );
};

export default Clients; 