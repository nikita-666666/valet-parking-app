import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Container, 
  Paper, 
  Typography, 
  CircularProgress,
  Box
} from '@mui/material';

const WalletData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/api/wallet');
        setData(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 2, backgroundColor: '#fff3f3' }}>
        <Typography color="error">Ошибка: {error}</Typography>
      </Paper>
    );
  }

  return (
    <Container>
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Данные кошелька
        </Typography>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </Paper>
    </Container>
  );
};

export default WalletData; 