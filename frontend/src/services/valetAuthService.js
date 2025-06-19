import api from './api';
import { API_CONFIG } from '../config/api';

const VALET_TOKEN_KEY = 'valet_token';

const valetAuthService = {
    login: async (email, password) => {
        try {
            const response = await api.post(API_CONFIG.endpoints.auth.valetLogin, {
                email,
                password
            });
            
            if (response.data.access_token) {
                localStorage.setItem(VALET_TOKEN_KEY, response.data.access_token);
            }
            
            return response.data;
        } catch (error) {
            console.error('Valet login error:', error);
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem(VALET_TOKEN_KEY);
    },

    getCurrentUser: async () => {
        const token = localStorage.getItem(VALET_TOKEN_KEY);
        if (!token) {
            return null;
        }

        try {
            const response = await api.get(API_CONFIG.endpoints.auth.valetProfile);
            return response.data;
        } catch (error) {
            console.error('Get valet profile error:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem(VALET_TOKEN_KEY);
            }
            throw error;
        }
    },

    getToken: () => {
        return localStorage.getItem(VALET_TOKEN_KEY);
    }
};

export default valetAuthService; 