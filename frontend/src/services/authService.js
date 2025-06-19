import api from './api';

const TOKEN_KEY = 'token';

const authService = {
  login: async (email, password) => {
    try {
      // Создаем объект FormData
      const formData = new FormData();
      formData.append('username', email); // OAuth2 использует 'username' вместо 'email'
      formData.append('password', password);

      const response = await api.post('/api/v1/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      if (response.data.access_token) {
        localStorage.setItem(TOKEN_KEY, response.data.access_token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // Преобразуем ошибку в более понятный формат
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message ||
                         error.message ||
                         'Неизвестная ошибка при входе';
                         
      throw new Error(errorMessage);
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return null;
    }

    try {
      const response = await api.get('/api/v1/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get current user error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
      }
      throw error;
    }
  },

  getUserPermissions: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return [];
    }

    try {
      const response = await api.get('/api/v1/auth/me/permissions');
      return response.data;
    } catch (error) {
      console.error('Get user permissions error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
      }
      throw error;
    }
  },

  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  }
};

export default authService; 