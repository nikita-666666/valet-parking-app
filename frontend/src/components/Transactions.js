import React, { useState } from 'react';
import { Container, Card, Table, Form, Button, Row, Col } from 'react-bootstrap';

const Transactions = () => {
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState('');

  const transactions = [
    { id: 1, date: '2024-03-01', description: 'Оплата услуг', amount: -250.00, type: 'expense', status: 'completed' },
    { id: 2, date: '2024-02-28', description: 'Поступление средств', amount: 1200.00, type: 'income', status: 'completed' },
    { id: 3, date: '2024-02-27', description: 'Перевод', amount: -100.00, type: 'transfer', status: 'pending' },
    // Добавьте больше транзакций здесь
  ];

  return (
    <Container className="mt-4">
      <Card className="shadow-sm">
        <Card.Body>
          <Card.Title className="mb-4">Транзакции</Card.Title>
          
          <Row className="mb-4">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Дата</Form.Label>
                <Form.Control 
                  type="date" 
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Тип</Form.Label>
                <Form.Select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">Все</option>
                  <option value="income">Доход</option>
                  <option value="expense">Расход</option>
                  <option value="transfer">Перевод</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-end">
              <Button variant="primary">
                Применить фильтры
              </Button>
            </Col>
          </Row>

          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Описание</th>
                  <th>Тип</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td>{transaction.date}</td>
                    <td>{transaction.description}</td>
                    <td>
                      <span className={`badge bg-${transaction.type === 'income' ? 'success' : 'danger'}`}>
                        {transaction.type === 'income' ? 'Доход' : 'Расход'}
                      </span>
                    </td>
                    <td className={transaction.amount > 0 ? 'text-success' : 'text-danger'}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} ₽
                    </td>
                    <td>
                      <span className={`badge bg-${transaction.status === 'completed' ? 'success' : 'warning'}`}>
                        {transaction.status === 'completed' ? 'Выполнено' : 'В обработке'}
                      </span>
                    </td>
                    <td>
                      <Button variant="link" size="sm" className="me-2">
                        <i className="fas fa-edit"></i>
                      </Button>
                      <Button variant="link" size="sm" className="text-danger">
                        <i className="fas fa-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Transactions; 