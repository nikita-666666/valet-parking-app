import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Alert } from 'react-bootstrap';
import api from '../services/api';
import { API_CONFIG } from '../config/api';

const SubscriptionTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    description: '',
    duration_months: 1,
    valet_card_id: '',
    pin: ''
  });

  const fetchTemplates = async () => {
    try {
      const response = await api.get(API_CONFIG.endpoints.subscription_templates);
      setTemplates(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Ошибка при загрузке шаблонов абонементов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(API_CONFIG.endpoints.subscription_templates, formData);
      setShowModal(false);
      fetchTemplates();
      setFormData({
        type: '',
        name: '',
        description: '',
        duration_months: 1,
        valet_card_id: '',
        pin: ''
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при создании шаблона');
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Card.Title>Шаблоны абонементов</Card.Title>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <i className="fas fa-plus"></i> Создать шаблон
          </Button>
        </div>

        <Table striped bordered hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Тип</th>
              <th>Название</th>
              <th>Описание</th>
              <th>Срок (месяцев)</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.id}>
                <td>{template.id}</td>
                <td>{template.type}</td>
                <td>{template.name}</td>
                <td>{template.description}</td>
                <td>{template.duration_months}</td>
                <td>
                  <Button variant="info" size="sm" className="me-2">
                    Редактировать
                  </Button>
                  <Button variant="danger" size="sm">
                    Удалить
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Создать шаблон абонемента</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Тип</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Название</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Описание</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Срок действия (месяцев)</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.duration_months}
                  onChange={(e) => setFormData({...formData, duration_months: parseInt(e.target.value)})}
                  required
                  min="1"
                />
              </Form.Group>
              <div className="d-flex justify-content-end">
                <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                  Отмена
                </Button>
                <Button variant="primary" type="submit">
                  Создать
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      </Card.Body>
    </Card>
  );
};

export default SubscriptionTemplates; 